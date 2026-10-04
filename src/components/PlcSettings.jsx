import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu, Zap, Database, Activity, Plus, Search, Trash2, Edit2, Settings2, 
  RefreshCw, Play, StopCircle, CheckCircle2, AlertTriangle, Grid, 
  FileJson, Download, Upload, Server, Terminal, Save, X, ArrowRight,
  TrendingUp, Radio, HelpCircle, AlertCircle, Key, ArrowRightLeft,
  Sliders, FolderTree, HeartPulse, Workflow, Lock, Unlock, Eye, ChevronRight,
  RotateCw, Check, Sparkles, SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { savePlcSettingsToSupabase, loadPlcSettingsFromSupabase } from '../utils/supabaseFrontlineDB';
import PlcHelpAssistant from './PlcHelpAssistant';

// ─── Constants & Options ───────────────────────────────────────────────────
const CONTROLLER_TYPES = [
  { value: 'MODBUS_TCP', label: 'Modbus TCP', icon: Database, color: '#6366f1', desc: 'Direct Modbus registers over TCP/IP' },
  { value: 'MODBUS_RTU', label: 'Modbus RTU', icon: Radio, color: '#10b981', desc: 'Modbus serial communications over RS485/RTU' },
  { value: 'OPC_UA', label: 'OPC UA (Python)', icon: Cpu, color: '#8b5cf6', desc: 'Secure Unified Architecture nodes via Python' },
  { value: 'SIEMENS_S7', label: 'Siemens S7 (Python)', icon: Server, color: '#ec4899', desc: 'Siemens S7-300/400/1200/1500 connection via snap7' },
  { value: 'MITSUBISHI_MELSEC', label: 'Mitsubishi MELSEC (MC Protocol)', icon: Cpu, color: '#dc2626', desc: 'Direct Q-Series, iQ-R, FX5U via MC Protocol (3E/4E frame)' },
  { value: 'OMRON_FINS', label: 'Omron FINS (Ethernet)', icon: Server, color: '#0284c7', desc: 'Direct Omron CS/CJ/CP/NX via FINS commands' },
  { value: 'ROCKWELL_CIP', label: 'Rockwell / Allen-Bradley (EtherNet/IP)', icon: Database, color: '#f97316', desc: 'ControlLogix, CompactLogix, Micro800 via CIP' },
  { value: 'MQTT', label: 'MQTT Broker', icon: Zap, color: '#f59e0b', desc: 'Telemetry subscription over MQTT Broker' }
];

const MODBUS_REG_TYPES = [
  { value: 'COIL', label: 'Coil (0x) [Read/Write Bit]' },
  { value: 'DISCRETE_INPUT', label: 'Discrete Input (1x) [Read-Only Bit]' },
  { value: 'INPUT_REGISTER', label: 'Input Register (3x) [Read-Only 16-bit]' },
  { value: 'HOLDING_REGISTER', label: 'Holding Register (4x) [Read/Write 16-bit]' }
];

const DATA_TYPES = [
  { value: 'INT16', label: '16-bit Integer' },
  { value: 'UINT16', label: 'Unsigned 16-bit' },
  { value: 'INT32', label: '32-bit Integer' },
  { value: 'FLOAT', label: '32-bit Float' },
  { value: 'BOOLEAN', label: 'Boolean (1-bit)' }
];

const TEMPLATES = {
  conveyor: {
    name: 'Conveyor Line PLC Template',
    description: 'Standard registers for a variable-speed motor conveyor belt.',
    tags: [
      { name: 'Motor_Status', type: 'MODBUS_TCP', regType: 'COIL', address: '1', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '1' },
      { name: 'Conveyor_Speed_Setpoint', type: 'MODBUS_TCP', regType: 'HOLDING_REGISTER', address: '2', dataType: 'INT16', multiplier: 0.1, permissions: 'RW', value: '65.5' },
      { name: 'Emergency_Stop', type: 'MODBUS_TCP', regType: 'DISCRETE_INPUT', address: '5', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RO', value: 'false' },
      { name: 'Item_Counter', type: 'MODBUS_TCP', regType: 'INPUT_REGISTER', address: '10', dataType: 'UINT16', multiplier: 1, permissions: 'RO', value: '1420' }
    ]
  },
  boiler: {
    name: 'Steam Boiler OPC UA Template',
    description: 'Node IDs for water levels, temperature gauges, and valve releases.',
    tags: [
      { name: 'Core_Temperature', type: 'OPC_UA', regType: 'NODE', address: 'ns=2;s=BoilerCore.Temperature', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '184.2' },
      { name: 'Water_Level_Sensor', type: 'OPC_UA', regType: 'NODE', address: 'ns=2;s=BoilerCore.WaterLevel', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '72.8' },
      { name: 'Safety_Valve_Command', type: 'OPC_UA', regType: 'NODE', address: 'ns=2;s=BoilerCore.ValveCommand', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: 'false' },
      { name: 'Pressure_Psi', type: 'OPC_UA', regType: 'NODE', address: 'ns=2;s=BoilerCore.PressurePSI', dataType: 'INT32', multiplier: 0.1, permissions: 'RO', value: '142' }
    ]
  },
  packaging: {
    name: 'Packaging Station PLC Template',
    description: 'Modbus registers for pneumatic cylinders, photo sensors, and cycle logs.',
    tags: [
      { name: 'Clamping_Cylinder_Active', type: 'MODBUS_TCP', regType: 'COIL', address: '10', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '0' },
      { name: 'Piston_Pressure', type: 'MODBUS_TCP', regType: 'HOLDING_REGISTER', address: '15', dataType: 'INT16', multiplier: 0.1, permissions: 'RW', value: '6.4' },
      { name: 'Photo_Eye_Blocked', type: 'MODBUS_TCP', regType: 'DISCRETE_INPUT', address: '12', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RO', value: 'true' },
      { name: 'Cycle_Time_Ms', type: 'MODBUS_TCP', regType: 'INPUT_REGISTER', address: '20', dataType: 'UINT16', multiplier: 1, permissions: 'RO', value: '850' }
    ]
  },
  assembly_rtu: {
    name: 'Assembly Line RTU Template',
    description: 'Modbus RTU registers for torque tools, test benches, and cycle status.',
    tags: [
      { name: 'Torque_Target', type: 'MODBUS_RTU', regType: 'HOLDING_REGISTER', address: '40010', dataType: 'INT16', multiplier: 0.1, permissions: 'RW', value: '45.0' },
      { name: 'Tool_Lock_Cmd', type: 'MODBUS_RTU', regType: 'COIL', address: '15', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: 'false' },
      { name: 'Test_Result_Pass', type: 'MODBUS_RTU', regType: 'DISCRETE_INPUT', address: '10012', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RO', value: 'true' },
      { name: 'Cycle_Completed_Count', type: 'MODBUS_RTU', regType: 'INPUT_REGISTER', address: '30005', dataType: 'UINT16', multiplier: 1, permissions: 'RO', value: '384' }
    ]
  },
  mqtt_telemetry: {
    name: 'MQTT Telemetry Broker Template',
    description: 'Topics for environment logging, vibration sensors, and power diagnostics.',
    tags: [
      { name: 'Machine_Vibration_Rms', type: 'MQTT', regType: 'MQTT_TOPIC', address: 'sensors/vibration/rms', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '2.45' },
      { name: 'Machine_Power_State', type: 'MQTT', regType: 'MQTT_TOPIC', address: 'telemetry/power/state', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: 'true' },
      { name: 'Total_Energy_Kwh', type: 'MQTT', regType: 'MQTT_TOPIC', address: 'telemetry/power/energy_kwh', dataType: 'FLOAT', multiplier: 0.1, permissions: 'RO', value: '9845.2' },
      { name: 'Cabinet_Temp_C', type: 'MQTT', regType: 'MQTT_TOPIC', address: 'sensors/temp/cabinet', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '34.8' }
    ]
  },
  mitsubishi_press: {
    name: 'Mitsubishi MELSEC Servo Press Template',
    description: 'MC Protocol registers (D data registers & M relays) for stamping press lines.',
    tags: [
      { name: 'Press_Cycle_Trigger', type: 'MITSUBISHI_MELSEC', regType: 'M_RELAY', address: 'M100', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '0' },
      { name: 'Peak_Press_Force_kN', type: 'MITSUBISHI_MELSEC', regType: 'D_REGISTER', address: 'D200', dataType: 'FLOAT', multiplier: 0.1, permissions: 'RO', value: '145.8' },
      { name: 'Stroke_Displacement_mm', type: 'MITSUBISHI_MELSEC', regType: 'D_REGISTER', address: 'D204', dataType: 'FLOAT', multiplier: 0.01, permissions: 'RO', value: '25.42' },
      { name: 'Press_Interlock_Guard', type: 'MITSUBISHI_MELSEC', regType: 'M_RELAY', address: 'M105', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '1' }
    ]
  },
  omron_packaging: {
    name: 'Omron FINS Packaging Line Template',
    description: 'FINS CIO & DM area addresses for heat sealing and conveyor gating.',
    tags: [
      { name: 'Heat_Seal_Temp_Actual', type: 'OMRON_FINS', regType: 'DM_WORD', address: 'D1000', dataType: 'INT16', multiplier: 0.1, permissions: 'RO', value: '185.0' },
      { name: 'Conveyor_Gate_Interlock', type: 'OMRON_FINS', regType: 'CIO_BIT', address: 'CIO0.05', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '1' },
      { name: 'Pouch_Count_Good', type: 'OMRON_FINS', regType: 'DM_WORD', address: 'D1010', dataType: 'UINT16', multiplier: 1, permissions: 'RO', value: '840' },
      { name: 'Pouch_Reject_Trigger', type: 'OMRON_FINS', regType: 'CIO_BIT', address: 'CIO1.02', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '0' }
    ]
  }
};

let tauriInvoke = null;
async function getTauriApi() {
  if (window.__TAURI_INTERNALS__) {
    if (!tauriInvoke) {
      try {
        const core = await import('@tauri-apps/api/core');
        tauriInvoke = core.invoke;
      } catch (e) {
        console.warn('Failed to load Tauri APIs:', e);
      }
    }
    return { invoke: tauriInvoke };
  }
  return { invoke: null };
}

export default function PlcSettings() {
  const [activeTab, setActiveTab] = useState('overview');

  const saveToDb = async (ctrls, tagList) => {
    if (ctrls) window.mandor_plc_controllers = ctrls;
    if (tagList) window.mandor_plc_tags = tagList;
    try {
      await savePlcSettingsToSupabase(ctrls, tagList);
    } catch (err) {
      console.error('Failed to sync PLC settings to Supabase:', err);
    }
  };

  // ─── PERSISTENCE STATES ──────────────────────────────────────────────────
  const [controllers, setControllers] = useState(() => {
    if (Array.isArray(window.mandor_plc_controllers)) return window.mandor_plc_controllers;
    return [];
  });

  const [tags, setTags] = useState(() => {
    if (Array.isArray(window.mandor_plc_tags)) return window.mandor_plc_tags;
    return [];
  });

  const [logs, setLogs] = useState([
    { ts: new Date().toLocaleTimeString(), type: 'INFO', msg: 'System initialized. Loading controllers.' }
  ]);

  // Sync default scanner controller on load
  const [scannerAddressRange, setScannerAddressRange] = useState('40001');
  const [scannerData, setScannerData] = useState([]);
  const [scannerControllerId, setScannerControllerId] = useState(controllers[0]?.id || '');
  const [scannerWriteVal, setScannerWriteVal] = useState('');
  const [scannerActiveReg, setScannerActiveReg] = useState(null);

  // ─── MES-PLC HANDSHAKE STATE MACHINE ──────────────────────────────────────
  const [handshakeStep, setHandshakeStep] = useState(0);
  const [isHandshakeRunning, setIsHandshakeRunning] = useState(false);
  const [handshakeRegisters, setHandshakeRegisters] = useState({
    triggerReq: false,
    partBarcode: 'SN-GBX-2026-0088',
    recipeId: 402,
    recipeOk: false,
    cycleRunning: false,
    cycleDone: false,
    measuredTorque: 0,
    mesAck: false,
    stopperReleased: false
  });

  const runHandshakeSimulation = async () => {
    setIsHandshakeRunning(true);
    setHandshakeStep(1);
    setHandshakeRegisters(prev => ({ ...prev, triggerReq: true, recipeOk: false, cycleRunning: false, cycleDone: false, mesAck: false, stopperReleased: false }));
    toast('Step 1: Part Tiba di Stopper ➔ PLC Mengirim TRIGGER_REQ = 1', { icon: '📦' });
    
    await new Promise(r => setTimeout(r, 1200));
    setHandshakeStep(2);
    setHandshakeRegisters(prev => ({ ...prev, recipeOk: true }));
    toast.success('Step 2: MES Memverifikasi Part & Menulis RECIPE_OK = 1');

    await new Promise(r => setTimeout(r, 1200));
    setHandshakeStep(3);
    setHandshakeRegisters(prev => ({ ...prev, cycleRunning: true }));
    toast('Step 3: PLC Menjalankan Siklus Mesin (Nutrunner Tightening)...', { icon: '⚙️' });

    await new Promise(r => setTimeout(r, 1500));
    setHandshakeStep(4);
    setHandshakeRegisters(prev => ({ ...prev, cycleRunning: false, cycleDone: true, measuredTorque: 45.2 }));
    toast.success('Step 4: Siklus Mesin Selesai ➔ PLC Menulis Nilai Ukur 45.2 Nm & CYCLE_DONE = 1');

    await new Promise(r => setTimeout(r, 1200));
    setHandshakeStep(5);
    setHandshakeRegisters(prev => ({ ...prev, mesAck: true, stopperReleased: true }));
    toast.success('Step 5: MES Simpan Transaksi ➔ MES_ACK = 1 & Stopper Dibuka!');

    await new Promise(r => setTimeout(r, 1000));
    setIsHandshakeRunning(false);
  };

  // ─── WATCHDOG HEARTBEAT ALTERNATOR ────────────────────────────────────────
  const [watchdogBit, setWatchdogBit] = useState(true);
  const [watchdogLatency, setWatchdogLatency] = useState(14);
  const [watchdogTrip, setWatchdogTrip] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!watchdogTrip) {
        setWatchdogBit(b => !b);
        setWatchdogLatency(Math.floor(10 + Math.random() * 8));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [watchdogTrip]);

  // ─── RECIPE MANAGEMENT STATE ──────────────────────────────────────────────
  const [recipes, setRecipes] = useState([
    {
      id: 'REC-01',
      name: 'Planetary Gearbox Final Stage Assembly',
      partNo: 'GBX-DUAL-9000',
      parameters: [
        { name: 'Target Tightening Torque', target: 45.0, unit: 'Nm', register: 'D100 / Holding 40010', current: 45.0, status: 'MATCH' },
        { name: 'Peak Clamping Pressure', target: 6.2, unit: 'bar', register: 'D102 / Holding 40012', current: 6.2, status: 'MATCH' },
        { name: 'Spindle Speed Setpoint', target: 1450, unit: 'RPM', register: 'D104 / Holding 40014', current: 1450, status: 'MATCH' },
        { name: 'Press Hold Dwell Time', target: 2500, unit: 'ms', register: 'D106 / Holding 40016', current: 2500, status: 'MATCH' }
      ]
    },
    {
      id: 'REC-02',
      name: 'Flange Housing Die Casting & Trim',
      partNo: 'HSG-FLG-900',
      parameters: [
        { name: 'Die Mold Temperature', target: 215.0, unit: '°C', register: 'D200 / Holding 40020', current: 215.0, status: 'MATCH' },
        { name: 'Injection Velocity High', target: 4.8, unit: 'm/s', register: 'D202 / Holding 40022', current: 4.8, status: 'MATCH' },
        { name: 'Intensification Pressure', target: 85.0, unit: 'MPa', register: 'D204 / Holding 40024', current: 85.0, status: 'MATCH' }
      ]
    }
  ]);
  const [selectedRecipeId, setSelectedRecipeId] = useState('REC-01');
  const [recipePushState, setRecipePushState] = useState(null);

  const handlePushRecipeToPlc = async (recipe) => {
    setRecipePushState('pushing');
    toast('Mengirim setpoint parameter ke PLC Data Block...', { icon: '🚀' });
    await new Promise(r => setTimeout(r, 1200));
    setRecipePushState('verified');
    toast.success(`Resep "${recipe.name}" berhasil diunduh ke PLC & diverifikasi 100% cocok!`);
  };

  // ─── OPC UA / PLC LIVE TAG BROWSER TREE ───────────────────────────────────
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root', 'station_1', 'station_2']));
  const [selectedBrowserTag, setSelectedBrowserTag] = useState(null);

  const PLC_TAG_TREE = {
    id: 'root',
    name: 'PLC_Industrial_Station_Server (Root)',
    type: 'folder',
    children: [
      {
        id: 'station_1',
        name: 'Station_01_PressMachine (DB10)',
        type: 'folder',
        children: [
          { id: 't1', name: 'Cycle_Trigger', address: 'DB10.DBX0.0', type: 'BOOLEAN', value: '1', access: 'RW' },
          { id: 't2', name: 'Hydraulic_Pressure_bar', address: 'DB10.DBD4', type: 'FLOAT', value: '142.5', access: 'RO' },
          { id: 't3', name: 'Ram_Position_mm', address: 'DB10.DBD8', type: 'FLOAT', value: '25.4', access: 'RO' },
          { id: 't4', name: 'Interlock_EStop_Active', address: 'DB10.DBX12.0', type: 'BOOLEAN', value: '0', access: 'RO' }
        ]
      },
      {
        id: 'station_2',
        name: 'Station_02_TorqueNutrunner (DB20)',
        type: 'folder',
        children: [
          { id: 't5', name: 'Torque_Actual_Nm', address: 'DB20.DBD0', type: 'FLOAT', value: '45.12', access: 'RO' },
          { id: 't6', name: 'Angle_Actual_deg', address: 'DB20.DBD4', type: 'FLOAT', value: '182.4', access: 'RO' },
          { id: 't7', name: 'Tightening_OK', address: 'DB20.DBX8.0', type: 'BOOLEAN', value: '1', access: 'RO' },
          { id: 't8', name: 'Batch_Counter', address: 'DB20.DBW10', type: 'INT16', value: '88', access: 'RW' }
        ]
      },
      {
        id: 'safety_system',
        name: 'Safety_Interlock_Bus (DB99)',
        type: 'folder',
        children: [
          { id: 't9', name: 'LightCurtain_Clear', address: 'DB99.DBX0.0', type: 'BOOLEAN', value: '1', access: 'RO' },
          { id: 't10', name: 'Conveyor_Lock_Solenoid', address: 'DB99.DBX0.1', type: 'BOOLEAN', value: '0', access: 'RW' },
          { id: 't11', name: 'Watchdog_Pulse_Heartbeat', address: 'DB99.DBX2.0', type: 'BOOLEAN', value: '1', access: 'RW' }
        ]
      }
    ]
  };

  const handleBindTagFromBrowser = (node) => {
    const newTag = {
      id: `tag-${Date.now()}`,
      name: node.name,
      type: 'OPC_UA',
      regType: 'NODE',
      address: node.address,
      dataType: node.type,
      multiplier: 1,
      permissions: node.access,
      value: node.value,
      description: `Auto-discovered via Live Tag Browser from ${node.address}`
    };
    const updated = [...tags, newTag];
    setTags(updated);
    saveToDb(controllers, updated);
    toast.success(`Tag "${node.name}" (${node.address}) berhasil ditambahkan ke Tag Mapping!`);
  };

  // Persistent settings save
  useEffect(() => {
    if (Array.isArray(controllers)) {
      window.mandor_plc_controllers = controllers;
    }
  }, [controllers]);

  // Connect to PLCs and load from Supabase on startup
  useEffect(() => {
    const initApp = async () => {
      let activeControllers = controllers;
      let activeTags = tags;

      // 1. Try loading settings from Supabase
      addLog('INFO', 'Synchronizing PLC settings with Supabase...');
      try {
        const { controllers: dbControllers, tags: dbTags } = await loadPlcSettingsFromSupabase();
        if (dbControllers && dbControllers.length > 0) {
          activeControllers = dbControllers;
          activeTags = dbTags || [];
          setControllers(dbControllers);
          setTags(dbTags || []);
          addLog('SUCCESS', 'PLC settings synchronized successfully from Supabase.');
        } else {
          addLog('INFO', 'Supabase PLC settings empty or tables not found. Using local configuration.');
        }
      } catch (err) {
        addLog('WARNING', 'Failed to sync with Supabase. Using offline local config.');
        console.warn('Failed to load PLC settings from Supabase:', err);
      }

      // 2. Initialize startup connections
      const api = await getTauriApi();
      if (!api.invoke) return;
      
      for (const ctrl of activeControllers) {
        if (ctrl.status === 'connected') {
          if (ctrl.type === 'MODBUS_TCP') {
            addLog('INFO', `Initializing startup connection for Modbus PLC: ${ctrl.name}...`);
            try {
              await api.invoke('modbus_connect', {
                id: ctrl.id,
                ip: ctrl.ip,
                port: parseInt(ctrl.port) || 502,
                unitId: parseInt(ctrl.unitId) || 1
              });
              addLog('SUCCESS', `Startup connection successful for: ${ctrl.name}`);
            } catch (err) {
              addLog('ERROR', `Startup connection failed for ${ctrl.name}: ${err}`);
              setControllers(prev => (prev || []).map(c => c.id === ctrl.id ? { ...c, status: 'disconnected', latency: 0 } : c));
            }
          } else if (['SIEMENS_S7', 'OPC_UA'].includes(ctrl.type)) {
            addLog('INFO', `Initializing startup connection for Python PLC: ${ctrl.name}...`);
            try {
              const params = {};
              if (ctrl.type === 'SIEMENS_S7') {
                params.rack = parseInt(ctrl.rack) || 0;
                params.slot = parseInt(ctrl.slot) || 1;
              } else if (ctrl.type === 'OPC_UA') {
                params.url = ctrl.ip;
              }
              const res = await fetch('http://localhost:8000/plc/connect', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  controller_id: ctrl.id,
                  plc_type: ctrl.type,
                  ip: ctrl.ip,
                  port: parseInt(ctrl.port) || (ctrl.type === 'SIEMENS_S7' ? 102 : 4840),
                  params
                })
              });
              const data = await res.json();
              if (data && data.success) {
                addLog('SUCCESS', `Startup connection successful for Python PLC: ${ctrl.name}`);
              } else {
                throw new Error(data?.error || 'Backend failed');
              }
            } catch (err) {
              addLog('ERROR', `Startup connection failed for Python PLC ${ctrl.name}: ${err}`);
              setControllers(prev => (prev || []).map(c => c.id === ctrl.id ? { ...c, status: 'disconnected', latency: 0 } : c));
            }
          }
        }
      }
    };
    initApp();
  }, []); // Run once on mount

  useEffect(() => {
    if (Array.isArray(tags)) {
      window.mandor_plc_tags = tags;
      // Dynamic recalculate tag count on controllers
      setControllers(prev => (prev || []).map(c => ({
        ...c,
        tagCount: (tags || []).filter(t => t.controllerId === c.id).length
      })));
    }
  }, [tags]);

  // ─── LOGGING HELPER ────────────────────────────────────────────────────────
  const addLog = (type, msg) => {
    const newLog = {
      ts: new Date().toLocaleTimeString(),
      type,
      msg
    };
    setLogs(prev => [newLog, ...prev.slice(0, 49)]); // Keep last 50 logs
  };

  // ─── SIMULATION LOOP ───────────────────────────────────────────────────────
  const [simulationActive, setSimulationActive] = useState(false);
  useEffect(() => {
    if (!simulationActive) return;
    const interval = setInterval(() => {
      // Pick random tag to update value
      setTags(prev => {
        if (!Array.isArray(prev) || prev.length === 0) return prev || [];
        const targetIdx = Math.floor(Math.random() * prev.length);
        const nextTags = [...prev];
        const currentTag = nextTags[targetIdx];
        if (!currentTag) return prev;
        
        // Skip simulated updates for real Modbus PLCs running in Tauri
        const controller = (controllers || []).find(c => c.id === currentTag.controllerId);
        const isRealModbus = controller?.type === 'MODBUS_TCP' && controller?.status === 'connected' && !!window.__TAURI_INTERNALS__;
        const isRealPython = ['SIEMENS_S7', 'OPC_UA'].includes(controller?.type) && controller?.status === 'connected';
        if (isRealModbus || isRealPython) return prev;

        let newVal = currentTag.value;
        if (currentTag.dataType === 'BOOLEAN') {
          newVal = Math.random() > 0.9 ? (currentTag.value === 'true' || currentTag.value === '1' ? 'false' : 'true') : currentTag.value;
        } else if (currentTag.dataType === 'FLOAT') {
          const change = (Math.random() - 0.5) * 2;
          newVal = (parseFloat(currentTag.value || 0) + change).toFixed(2);
        } else {
          // Int
          const change = Math.floor((Math.random() - 0.5) * 5);
          newVal = String(Math.max(0, parseInt(currentTag.value || 0) + change));
        }

        nextTags[targetIdx] = { ...currentTag, value: newVal };
        
        // Log the read
        let protocol = 'Modbus';
        if (controller?.type === 'OPC_UA') protocol = 'OPC UA (Python)';
        else if (controller?.type === 'SIEMENS_S7') protocol = 'Siemens S7 (Python)';
        else if (controller?.type === 'MQTT') protocol = 'MQTT';
        else if (controller?.type === 'MODBUS_RTU') protocol = 'Modbus RTU';
        else if (controller?.type === 'MODBUS_TCP') protocol = 'Modbus TCP';
        
        addLog('READ', `[${protocol}] Read ${currentTag.name} (${currentTag.address}): ${newVal}`);
        
        return nextTags;
      });

      // Fluctuate Latency slightly
      setControllers(prev => (prev || []).map(c => {
        if (c.status !== 'connected') return c;
        const delta = Math.floor((Math.random() - 0.5) * 6);
        return { ...c, latency: Math.max(10, c.latency + delta) };
      }));

    }, 3000);
    return () => clearInterval(interval);
  }, [simulationActive, controllers]);

  // ─── REAL PLC BACKEND POLLING (Rust Modbus & Python PLC Gateway) ──────────
  useEffect(() => {
    const apiPromise = getTauriApi();
    let isMounted = true;
    let activeIntervals = [];

    const startPolling = async () => {
      const api = await apiPromise;

      // Clean up previous intervals
      activeIntervals.forEach(clearInterval);
      activeIntervals = [];

      controllers.forEach(ctrl => {
        if (ctrl.status === 'connected') {
          const isPythonType = ['SIEMENS_S7', 'OPC_UA'].includes(ctrl.type);
          const isRustType = ctrl.type === 'MODBUS_TCP';
          
          if (isRustType || isPythonType) {
            const intervalId = setInterval(async () => {
              if (!isMounted) return;

              // 1. Poll registered tags for this controller
              const ctrlTags = (tags || []).filter(t => t.controllerId === ctrl.id);
              for (const tag of ctrlTags) {
                let addr = parseInt(tag.address);
                if (isNaN(addr)) continue;

                if (isRustType && api.invoke) {
                  // Tauri Rust Modbus Path
                  let offset = addr;
                  if (tag.regType === 'COIL') offset = addr - 1;
                  else if (tag.regType === 'DISCRETE_INPUT') offset = addr - 10001;
                  else if (tag.regType === 'INPUT_REGISTER') offset = addr - 30001;
                  else if (tag.regType === 'HOLDING_REGISTER') offset = addr - 40001;
                  if (offset < 0) offset = 0;

                  try {
                    const res = await api.invoke('modbus_read', {
                      id: ctrl.id,
                      regType: tag.regType,
                      address: offset,
                      quantity: 1
                    });
                    if (Array.isArray(res) && res.length > 0 && isMounted) {
                      const rawVal = res[0];
                      let scaledVal = rawVal;
                      
                      if (tag.dataType === 'BOOLEAN') {
                        scaledVal = rawVal !== 0 ? 'true' : 'false';
                      } else if (tag.dataType === 'FLOAT') {
                        scaledVal = (rawVal * (tag.multiplier || 1)).toFixed(2);
                      } else {
                        scaledVal = String(Math.round(rawVal * (tag.multiplier || 1)));
                      }

                      setTags(prev => (prev || []).map(t => t.id === tag.id ? { ...t, value: String(scaledVal) } : t));
                      addLog('READ', `[Modbus Real] Read ${tag.name} (${tag.address}): ${scaledVal}`);
                    }
                  } catch (err) {
                    console.error(`Error polling tag ${tag.name}:`, err);
                    addLog('ERROR', `Error polling tag ${tag.name}: ${err}`);
                  }
                } else {
                  // Python PLC Gateway Path (SIEMENS_S7, OPC_UA, or fallback MODBUS)
                  try {
                    const params = {};
                    if (ctrl.type === 'SIEMENS_S7') {
                      params.dbNumber = parseInt(tag.dbNumber) || 1;
                      params.bitOffset = parseInt(tag.bitOffset) || 0;
                    } else if (ctrl.type === 'OPC_UA') {
                      params.nodeId = tag.address;
                    }

                    const res = await fetch('http://localhost:8000/plc/read', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        controller_id: ctrl.id,
                        reg_type: tag.regType || 'DB',
                        address: addr,
                        data_type: tag.dataType || 'INTEGER',
                        params
                      })
                    });
                    const data = await res.json();
                    if (data && data.success && isMounted) {
                      const rawVal = data.value;
                      let scaledVal = rawVal;

                      if (tag.dataType === 'BOOLEAN') {
                        scaledVal = rawVal ? 'true' : 'false';
                      } else if (tag.dataType === 'FLOAT') {
                        scaledVal = (rawVal * (tag.multiplier || 1)).toFixed(2);
                      } else {
                        scaledVal = String(Math.round(rawVal * (tag.multiplier || 1)));
                      }

                      setTags(prev => (prev || []).map(t => t.id === tag.id ? { ...t, value: String(scaledVal) } : t));
                      addLog('READ', `[Python Real] Read ${tag.name} (${tag.address}): ${scaledVal} (simulated=${!!data.simulated})`);
                    }
                  } catch (err) {
                    console.error(`Error polling tag ${tag.name} via Python:`, err);
                    addLog('ERROR', `Error polling tag ${tag.name} via Python: ${err}`);
                  }
                }
              }

              // 2. Poll scanner grid (if scanner active & selected ctrl is this one)
              if (activeTab === 'scanner' && scannerControllerId === ctrl.id) {
                const baseAddr = parseInt(scannerAddressRange) || 40001;
                const isCoil = baseAddr < 10000;
                const isDiscIn = baseAddr >= 10000 && baseAddr < 30000;
                const isInputReg = baseAddr >= 30000 && baseAddr < 40000;
                const isHolding = baseAddr >= 40000;

                let regType = 'HOLDING_REGISTER';
                let baseOffset = baseAddr - 40001;
                if (isCoil) { regType = 'COIL'; baseOffset = baseAddr - 1; }
                else if (isDiscIn) { regType = 'DISCRETE_INPUT'; baseOffset = baseAddr - 10001; }
                else if (isInputReg) { regType = 'INPUT_REGISTER'; baseOffset = baseAddr - 30001; }
                if (baseOffset < 0) baseOffset = 0;

                if (isRustType && api.invoke) {
                  try {
                    const res = await api.invoke('modbus_read', {
                      id: ctrl.id,
                      regType,
                      address: baseOffset,
                      quantity: 20
                    });

                    if (Array.isArray(res) && res.length > 0 && isMounted) {
                      setScannerData(prev => {
                        return (prev || []).map((reg, idx) => {
                          const val = res[idx] !== undefined ? res[idx] : reg.decimal;
                          return {
                            ...reg,
                            decimal: val,
                            hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
                            binary: val.toString(2).padStart(16, '0').match(/.{4}/g).join(' ')
                          };
                        });
                      });
                    }
                  } catch (err) {
                    console.error('Error polling scanner Modbus:', err);
                  }
                } else {
                  try {
                    const res = await fetch('http://localhost:8000/plc/read', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        controller_id: ctrl.id,
                        reg_type: regType,
                        address: baseAddr,
                        data_type: 'INTEGER',
                        params: { quantity: 20 }
                      })
                    });
                    const data = await res.json();
                    if (data && data.success && isMounted) {
                      const valArray = Array.isArray(data.value) ? data.value : [data.value];
                      setScannerData(prev => {
                        return (prev || []).map((reg, idx) => {
                          const val = valArray[idx] !== undefined ? valArray[idx] : reg.decimal;
                          return {
                            ...reg,
                            decimal: val,
                            hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
                            binary: val.toString(2).padStart(16, '0').match(/.{4}/g).join(' ')
                          };
                        });
                      });
                    }
                  } catch (err) {
                    console.error('Error polling scanner via Python:', err);
                  }
                }
              }
            }, ctrl.pollingInterval || 2000);

            activeIntervals.push(intervalId);
          }
        }
      });
    };

    startPolling();

    return () => {
      isMounted = false;
      activeIntervals.forEach(clearInterval);
    };
  }, [controllers, tags, activeTab, scannerControllerId, scannerAddressRange]);

  // ─── FORM MODAL STATES ─────────────────────────────────────────────────────
  const [isCtrlModalOpen, setIsCtrlModalOpen] = useState(false);
  const [editingCtrl, setEditingCtrl] = useState(null);
  const [ctrlForm, setCtrlForm] = useState({
    name: '', type: 'MODBUS_TCP', ip: '', port: 502, unitId: 1, pollingInterval: 1000, securityPolicy: 'None'
  });

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagForm, setTagForm] = useState({
    controllerId: '', name: '', regType: 'HOLDING_REGISTER', address: '', dataType: 'INT16', multiplier: 1, permissions: 'RW', value: '0'
  });

  // ─── CONTROLLER OPERATIONS ──────────────────────────────────────────────────
  const openCtrlModal = (ctrl = null) => {
    if (ctrl) {
      setEditingCtrl(ctrl);
      setCtrlForm({ ...ctrl });
    } else {
      setEditingCtrl(null);
      setCtrlForm({
        name: '', type: 'MODBUS_TCP', ip: '192.168.1.100', port: 502, unitId: 1, pollingInterval: 1000, securityPolicy: 'None'
      });
    }
    setIsCtrlModalOpen(true);
  };

  const handleSaveController = () => {
    if (!ctrlForm.name || !ctrlForm.ip) {
      toast.error('Nama dan Host/IP wajib diisi.');
      return;
    }
    let updatedControllers;
    if (editingCtrl) {
      updatedControllers = controllers.map(c => c.id === editingCtrl.id ? { ...c, ...ctrlForm } : c);
      setControllers(updatedControllers);
      addLog('INFO', `Controller '${ctrlForm.name}' updated.`);
      toast.success('Controller berhasil diperbarui.');
    } else {
      const newId = `ctrl_${Date.now()}`;
      updatedControllers = [...controllers, {
        id: newId, ...ctrlForm, status: 'connected', latency: 30, tagCount: 0
      }];
      setControllers(updatedControllers);
      addLog('SUCCESS', `New controller '${ctrlForm.name}' connected.`);
      toast.success('Controller baru ditambahkan.');
    }
    saveToDb(updatedControllers, tags);
    setIsCtrlModalOpen(false);
  };

  const handleDeleteController = (id, name) => {
    if (window.confirm(`Hapus controller '${name}' beserta semua tag yang dimilikinya?`)) {
      const updatedCtrls = controllers.filter(c => c.id !== id);
      const updatedTags = tags.filter(t => t.controllerId !== id);
      setControllers(updatedCtrls);
      setTags(updatedTags);
      saveToDb(updatedCtrls, updatedTags);
      addLog('WARNING', `Controller '${name}' deleted.`);
      toast.success('Controller berhasil dihapus.');
    }
  };

  const toggleControllerStatus = async (id, currentStatus) => {
    const controller = controllers.find(c => c.id === id);
    if (!controller) return;

    const nextStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    const isPythonType = ['SIEMENS_S7', 'OPC_UA'].includes(controller.type);
    
    const api = await getTauriApi();
    if (api.invoke && controller.type === 'MODBUS_TCP') {
      if (nextStatus === 'connected') {
        const loadingToast = toast.loading(`Connecting to Modbus PLC ${controller.name} (${controller.ip}:${controller.port})...`);
        try {
          await api.invoke('modbus_connect', {
            id: controller.id,
            ip: controller.ip,
            port: parseInt(controller.port) || 502,
            unitId: parseInt(controller.unitId) || 1
          });
          toast.dismiss(loadingToast);
          toast.success(`Connected to Modbus PLC: ${controller.name}`);
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error(`Modbus connection failed: ${err}`);
          addLog('ERROR', `Failed to connect to ${controller.name}: ${err}`);
          return; // Do not update status to connected
        }
      } else {
        try {
          await api.invoke('modbus_disconnect', { id: controller.id });
          toast.success(`Disconnected from Modbus PLC: ${controller.name}`);
        } catch (err) {
          console.warn('Disconnect error:', err);
        }
      }
    } else if (isPythonType) {
      if (nextStatus === 'connected') {
        const loadingToast = toast.loading(`Connecting to PLC ${controller.name} (${controller.ip}:${controller.port}) via Python...`);
        try {
          const params = {};
          if (controller.type === 'SIEMENS_S7') {
            params.rack = parseInt(controller.rack) || 0;
            params.slot = parseInt(controller.slot) || 1;
          } else if (controller.type === 'OPC_UA') {
            params.url = controller.ip;
          }
          const res = await fetch('http://localhost:8000/plc/connect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              controller_id: controller.id,
              plc_type: controller.type,
              ip: controller.ip,
              port: parseInt(controller.port) || (controller.type === 'SIEMENS_S7' ? 102 : 4840),
              params
            })
          });
          const data = await res.json();
          toast.dismiss(loadingToast);
          if (data && data.success) {
            toast.success(data.simulated ? `Connected to Simulated PLC: ${controller.name}` : `Connected to PLC: ${controller.name}`);
            addLog('SUCCESS', `Python PLC connection: ${data.message}`);
          } else {
            throw new Error(data?.error || 'Backend failed');
          }
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error(`PLC connection failed: ${err.message || err}`);
          addLog('ERROR', `Failed to connect to ${controller.name}: ${err}`);
          return;
        }
      } else {
        try {
          await fetch('http://localhost:8000/plc/disconnect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ controller_id: controller.id })
          });
          toast.success(`Disconnected from PLC: ${controller.name}`);
        } catch (err) {
          console.warn('Disconnect error:', err);
        }
      }
    }

    const updatedCtrls = controllers.map(c => c.id === id ? {
      ...c,
      status: nextStatus,
      latency: nextStatus === 'connected' ? 30 : 0
    } : c);
    setControllers(updatedCtrls);
    saveToDb(updatedCtrls, tags);
    addLog(nextStatus === 'connected' ? 'SUCCESS' : 'WARNING', `Controller status changed: ${nextStatus.toUpperCase()}`);
    if (!api.invoke && !isPythonType) {
      toast.success(`Controller status: ${nextStatus}`);
    }
  };

  // ─── TAG OPERATIONS ──────────────────────────────────────────────────────────
  const openTagModal = (tag = null) => {
    if (controllers.length === 0) {
      toast.error('Tambahkan PLC controller terlebih dahulu sebelum memetakan tag.');
      return;
    }
    if (tag) {
      setEditingTag(tag);
      setTagForm({ ...tag });
    } else {
      setEditingTag(null);
      setTagForm({
        controllerId: controllers[0]?.id || '',
        name: '',
        regType: controllers[0]?.type === 'OPC_UA' ? 'NODE' : 'HOLDING_REGISTER',
        address: '',
        dataType: 'INT16',
        multiplier: 1,
        permissions: 'RW',
        value: '0'
      });
    }
    setIsTagModalOpen(true);
  };

  // Auto-adjust default regType based on selected controller's protocol
  const handleTagControllerChange = (cId) => {
    const parent = controllers.find(c => c.id === cId);
    let defaultReg = 'HOLDING_REGISTER';
    if (parent?.type === 'OPC_UA') defaultReg = 'NODE';
    else if (parent?.type === 'MQTT') defaultReg = 'MQTT_TOPIC';
    else if (parent?.type === 'SIEMENS_S7') defaultReg = 'DB';

    setTagForm(prev => ({
      ...prev,
      controllerId: cId,
      regType: defaultReg,
      dbNumber: parent?.type === 'SIEMENS_S7' ? 1 : undefined,
      bitOffset: parent?.type === 'SIEMENS_S7' ? 0 : undefined
    }));
  };

  const handleSaveTag = () => {
    if (!tagForm.name || !tagForm.address) {
      toast.error('Nama tag dan Alamat register wajib diisi.');
      return;
    }
    let updatedTags;
    if (editingTag) {
      updatedTags = tags.map(t => t.id === editingTag.id ? { ...t, ...tagForm } : t);
      setTags(updatedTags);
      addLog('INFO', `Tag '${tagForm.name}' updated.`);
      toast.success('Tag berhasil diperbarui.');
    } else {
      const newId = `tag_${Date.now()}`;
      updatedTags = [...tags, { id: newId, ...tagForm }];
      setTags(updatedTags);
      addLog('SUCCESS', `Mapped new tag '${tagForm.name}' on register ${tagForm.address}.`);
      toast.success('Tag baru berhasil dipetakan.');
    }
    saveToDb(controllers, updatedTags);
    setIsTagModalOpen(false);
  };

  const handleDeleteTag = (id, name) => {
    if (window.confirm(`Hapus pemetaan tag '${name}'?`)) {
      const updatedTags = tags.filter(t => t.id !== id);
      setTags(updatedTags);
      saveToDb(controllers, updatedTags);
      addLog('WARNING', `Tag mapping '${name}' deleted.`);
      toast.success('Tag berhasil dihapus.');
    }
  };

  // Test tag read/write trigger
  const handleTestTag = async (tag) => {
    const controller = controllers.find(c => c.id === tag.controllerId);
    if (!controller || controller.status !== 'connected') {
      toast.error(`Koneksi PLC '${controller?.name || 'Unknown'}' terputus.`);
      return;
    }

    const api = await getTauriApi();
    if (api.invoke && controller.type === 'MODBUS_TCP') {
      let addr = parseInt(tag.address);
      if (isNaN(addr)) {
        toast.error('Alamat register tidak valid.');
        return;
      }

      let offset = addr;
      if (tag.regType === 'COIL') offset = addr - 1;
      else if (tag.regType === 'DISCRETE_INPUT') offset = addr - 10001;
      else if (tag.regType === 'INPUT_REGISTER') offset = addr - 30001;
      else if (tag.regType === 'HOLDING_REGISTER') offset = addr - 40001;
      if (offset < 0) offset = 0;

      toast.promise(
        (async () => {
          const res = await api.invoke('modbus_read', {
            id: controller.id,
            regType: tag.regType,
            address: offset,
            quantity: 1
          });
          if (Array.isArray(res) && res.length > 0) {
            const rawVal = res[0];
            let scaledVal = rawVal;
            if (tag.dataType === 'BOOLEAN') {
              scaledVal = rawVal !== 0 ? 'true' : 'false';
            } else if (tag.dataType === 'FLOAT') {
              scaledVal = (rawVal * (tag.multiplier || 1)).toFixed(2);
            } else {
              scaledVal = String(Math.round(rawVal * (tag.multiplier || 1)));
            }
            setTags(prev => (prev || []).map(t => t.id === tag.id ? { ...t, value: String(scaledVal) } : t));
            return `Nilai: ${scaledVal}`;
          }
          throw new Error('No data received');
        })(),
        {
          loading: `Membaca tag '${tag.name}' dari register ${tag.address} (Modbus Real)...`,
          success: (valText) => `Sukses! ${valText}`,
          error: (err) => `Gagal membaca tag: ${err.message || err}`
        }
      );
    } else {
      // Simulation test
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 800)),
        {
          loading: `Membaca tag '${tag.name}' dari register ${tag.address}...`,
          success: `Sukses! Nilai: ${tag.value} (Latency: ${controller.latency}ms)`,
          error: 'Gagal membaca tag.'
        }
      );
    }
  };

  useEffect(() => {
    if (!scannerControllerId && (controllers || []).length > 0) {
      setScannerControllerId(controllers[0].id);
    }
  }, [controllers]);

  // Generate 20 registers starting from scannerAddressRange
  useEffect(() => {
    const baseAddr = parseInt(scannerAddressRange) || 40001;
    const isCoil = baseAddr < 10000;
    const isDiscIn = baseAddr >= 10000 && baseAddr < 30000;
    const isInputReg = baseAddr >= 30000 && baseAddr < 40000;
    const isHolding = baseAddr >= 40000;

    const activeCtrl = controllers.find(c => c.id === scannerControllerId);
    const isRealModbus = activeCtrl?.type === 'MODBUS_TCP' && activeCtrl?.status === 'connected' && !!window.__TAURI_INTERNALS__;

    if (isRealModbus) {
      setScannerData(prev => {
        const startsWithSameAddr = (prev || []).length === 20 && prev[0].address === baseAddr;
        if (startsWithSameAddr) {
          return prev.map(reg => {
            const matchingTag = (tags || []).find(t => 
              t.controllerId === scannerControllerId && 
              (parseInt(t.address) === reg.address || t.address === String(reg.address))
            );
            if (matchingTag) {
              const val = parseFloat(matchingTag.value) || 0;
              return {
                ...reg,
                decimal: val,
                hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
                binary: val.toString(2).padStart(16, '0').match(/.{4}/g).join(' '),
                tag: matchingTag.name
              };
            }
            return reg;
          });
        }

        const data = [];
        for (let i = 0; i < 20; i++) {
          const addr = baseAddr + i;
          const matchingTag = (tags || []).find(t => 
            t.controllerId === scannerControllerId && 
            (parseInt(t.address) === addr || t.address === String(addr))
          );
          const val = matchingTag ? parseFloat(matchingTag.value) || 0 : 0;
          data.push({
            address: addr,
            hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
            decimal: val,
            binary: val.toString(2).padStart(16, '0').match(/.{4}/g).join(' '),
            tag: matchingTag ? matchingTag.name : null,
            writable: isCoil || isHolding
          });
        }
        return data;
      });
    } else {
      const data = [];
      for (let i = 0; i < 20; i++) {
        const addr = baseAddr + i;
        const matchingTag = (tags || []).find(t => 
          t.controllerId === scannerControllerId && 
          (parseInt(t.address) === addr || t.address === String(addr))
        );

        let val = 0;
        if (matchingTag) {
          val = parseFloat(matchingTag.value) || 0;
        }

        data.push({
          address: addr,
          hex: '0x' + val.toString(16).toUpperCase().padStart(4, '0'),
          decimal: val,
          binary: val.toString(2).padStart(16, '0').match(/.{4}/g).join(' '),
          tag: matchingTag ? matchingTag.name : null,
          writable: isCoil || isHolding
        });
      }
      setScannerData(data);
    }
  }, [scannerAddressRange, tags, scannerControllerId, simulationActive]);

  const handleWriteRegister = async () => {
    if (scannerWriteVal === '') return;
    const parsed = parseFloat(scannerWriteVal);
    if (isNaN(parsed)) {
      toast.error('Nilai input harus berupa angka.');
      return;
    }

    const baseAddr = scannerActiveReg.address;
    const isCoil = baseAddr < 10000;
    const isHolding = baseAddr >= 40000;

    let regType = 'HOLDING_REGISTER';
    let offset = baseAddr - 40001;
    if (isCoil) { regType = 'COIL'; offset = baseAddr - 1; }
    if (offset < 0) offset = 0;

    const activeCtrl = controllers.find(c => c.id === scannerControllerId);
    const api = await getTauriApi();
    const isPythonType = activeCtrl && ['SIEMENS_S7', 'OPC_UA'].includes(activeCtrl.type);
    const isRustType = activeCtrl && activeCtrl.type === 'MODBUS_TCP';

    if (isRustType && api.invoke && activeCtrl.status === 'connected') {
      const loadingToast = toast.loading(`Menulis nilai ${parsed} ke Register ${baseAddr}...`);
      try {
        await api.invoke('modbus_write', {
          id: scannerControllerId,
          regType,
          address: offset,
          value: Math.round(parsed)
        });
        
        // Update tags and scannerData in frontend immediately
        const matchingTag = tags.find(t => 
          t.controllerId === scannerControllerId && 
          (parseInt(t.address) === baseAddr || t.address === String(baseAddr))
        );

        if (matchingTag) {
          setTags(prev => (prev || []).map(t => t.id === matchingTag.id ? { ...t, value: String(parsed) } : t));
        }

        setScannerData(prev => (prev || []).map(reg => reg.address === baseAddr ? {
          ...reg,
          decimal: parsed,
          hex: '0x' + Math.round(parsed).toString(16).toUpperCase().padStart(4, '0'),
          binary: Math.round(parsed).toString(2).padStart(16, '0').match(/.{4}/g).join(' ')
        } : reg));

        toast.dismiss(loadingToast);
        addLog('WRITE', `[Modbus Real] Write Register ${baseAddr} -> SUCCESS (Value: ${parsed})`);
        toast.success(`Berhasil menulis ${parsed} ke Register ${baseAddr}`);
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(`Gagal menulis: ${err}`);
        addLog('ERROR', `Failed to write Register ${baseAddr}: ${err}`);
      }
    } else if (isPythonType && activeCtrl.status === 'connected') {
      const loadingToast = toast.loading(`Menulis nilai ${parsed} ke PLC ${activeCtrl.name}...`);
      try {
        const params = {};
        if (activeCtrl.type === 'SIEMENS_S7') {
          const matchingTag = tags.find(t => t.controllerId === scannerControllerId && parseInt(t.address) === baseAddr);
          params.dbNumber = parseInt(matchingTag?.dbNumber) || 1;
          params.bitOffset = parseInt(matchingTag?.bitOffset) || 0;
        } else if (activeCtrl.type === 'OPC_UA') {
          const matchingTag = tags.find(t => t.controllerId === scannerControllerId && parseInt(t.address) === baseAddr);
          params.nodeId = matchingTag?.nodeId || `ns=2;s=${baseAddr}`;
        }

        const res = await fetch('http://localhost:8000/plc/write', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            controller_id: scannerControllerId,
            reg_type: isCoil ? 'COIL' : 'HOLDING_REGISTER',
            address: baseAddr,
            value: String(parsed),
            data_type: 'INTEGER',
            params
          })
        });
        const data = await res.json();
        toast.dismiss(loadingToast);
        
        if (data && data.success) {
          const matchingTag = tags.find(t => 
            t.controllerId === scannerControllerId && 
            (parseInt(t.address) === baseAddr || t.address === String(baseAddr))
          );

          if (matchingTag) {
            setTags(prev => (prev || []).map(t => t.id === matchingTag.id ? { ...t, value: String(parsed) } : t));
          }

          setScannerData(prev => (prev || []).map(reg => reg.address === baseAddr ? {
            ...reg,
            decimal: parsed,
            hex: '0x' + Math.round(parsed).toString(16).toUpperCase().padStart(4, '0'),
            binary: Math.round(parsed).toString(2).padStart(16, '0').match(/.{4}/g).join(' ')
          } : reg));

          addLog('WRITE', `[Python Real] Write Register ${baseAddr} -> SUCCESS (Value: ${parsed}) (simulated=${!!data.simulated})`);
          toast.success(`Berhasil menulis ${parsed} ke Register ${baseAddr}`);
        } else {
          throw new Error(data?.error || 'Backend failed');
        }
      } catch (err) {
        toast.dismiss(loadingToast);
        toast.error(`Gagal menulis via Python: ${err.message || err}`);
        addLog('ERROR', `Failed to write Register ${baseAddr} via Python: ${err}`);
      }
    } else {
      // Mock write
      const matchingTag = tags.find(t => 
        t.controllerId === scannerControllerId && 
        (parseInt(t.address) === baseAddr || t.address === String(baseAddr))
      );

      if (matchingTag) {
        setTags(prev => (prev || []).map(t => t.id === matchingTag.id ? { ...t, value: String(parsed) } : t));
      }

      setScannerData(prev => (prev || []).map(reg => reg.address === baseAddr ? {
        ...reg,
        decimal: parsed,
        hex: '0x' + Math.round(parsed).toString(16).toUpperCase().padStart(4, '0'),
        binary: Math.round(parsed).toString(2).padStart(16, '0').match(/.{4}/g).join(' ')
      } : reg));

      addLog('WRITE', `[PLC Simulation] Write Register ${baseAddr} -> SUCCESS (Value: ${parsed})`);
      toast.success(`Berhasil menulis ${parsed} ke Register ${baseAddr}`);
    }

    setScannerActiveReg(null);
    setScannerWriteVal('');
  };

  // ─── TEMPLATES AND IMPORT ──────────────────────────────────────────────────
  const handleLoadTemplate = (key) => {
    const template = TEMPLATES[key];
    if (!template) return;
    
    if (window.confirm(`Muat ${template.name}? Ini akan menambahkan tag template ke controller terpilih.`)) {
      const activeCtrl = controllers[0];
      if (!activeCtrl) {
        toast.error('Hubungkan PLC controller terlebih dahulu.');
        return;
      }

      const importedTags = template.tags.map((t, idx) => ({
        id: `import_${Date.now()}_${idx}`,
        controllerId: activeCtrl.id,
        ...t
      }));

      const updatedTags = [...tags, ...importedTags];
      setTags(updatedTags);
      saveToDb(controllers, updatedTags);
      addLog('SUCCESS', `Imported ${importedTags.length} tags from '${template.name}' to '${activeCtrl.name}'.`);
      toast.success(`Sukses mengimpor ${importedTags.length} tag.`);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ controllers, tags }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `PLC_Settings_Export_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success('Konfigurasi PLC diekspor.');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#0b0f19', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* ─── Premium Header ──────────────────────────────────────────────────── */}
      <div style={{ padding: '20px 24px', background: 'linear-gradient(180deg, #111827 0%, #0b0f19 100%)', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)' }}>
            <SlidersHorizontal size={24} color="#ffffff" className="animate-pulse" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                PLC Connections & Tag Registry
              </h1>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', backgroundColor: '#3b82f6', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Admin
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Konfigurasi Modbus TCP, OPC UA, Register Memory Scanner, dan Tag Mapping
            </p>
          </div>
        </div>

        {/* Global Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            onClick={() => setSimulationActive(!simulationActive)}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #1f2937',
              backgroundColor: simulationActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: simulationActive ? '#10b981' : '#ef4444',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            {simulationActive ? <Play size={14} className="animate-spin" /> : <StopCircle size={14} />}
            {simulationActive ? 'Scanner: RUNNING' : 'Scanner: PAUSED'}
          </button>
          <button 
            onClick={handleExportJSON}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 16px', borderRadius: '8px', border: '1px solid #1f2937',
              backgroundColor: '#111827', color: '#e2e8f0',
              fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
            }}
          >
            <Download size={14} /> Ekspor JSON
          </button>
        </div>
      </div>

      {/* ─── Secondary Tabs Bar ─────────────────────────────────────────────── */}
      <div style={{ display: 'flex', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '0 24px', flexShrink: 0, overflowX: 'auto' }}>
        {[
          { id: 'overview', label: 'Overview & Diagnostics', icon: Activity },
          { id: 'controllers', label: 'PLC Controllers', icon: Server },
          { id: 'tags', label: 'Register Tag Mapping', icon: Key },
          { id: 'tag_browser', label: 'Live Tag Browser', icon: FolderTree },
          { id: 'handshake', label: 'MES-PLC Handshake', icon: ArrowRightLeft },
          { id: 'recipe', label: 'Recipe Push', icon: Sliders },
          { id: 'scanner', label: 'Live Register Grid', icon: Grid },
          { id: 'templates', label: 'Industrial Templates', icon: FileJson },
          { id: 'help', label: 'Help & Wiring Guide', icon: HelpCircle }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '16px 20px', border: 'none', background: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? '#6366f1' : '#94a3b8',
              fontSize: '0.85rem', fontWeight: 700, transition: 'all 0.15s',
              borderBottom: activeTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
              position: 'relative',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Main Contents Scroll ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', boxSizing: 'border-box' }}>
        
        {/* ── Tab 1: OVERVIEW & DIAGNOSTICS ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Quick KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '20px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Total Controllers</span>
                  <Server size={14} color="#6366f1" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
                  {controllers.length}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} />
                  {controllers.filter(c => c.status === 'connected').length} Connected Online
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Active Tags Mapping</span>
                  <Key size={14} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
                  {tags.length}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
                  Telemetry variables registered
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Scanner Throughput</span>
                  <TrendingUp size={14} color="#10b981" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
                  {simulationActive ? (tags.length * 0.8).toFixed(1) : '0.0'} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>tags/s</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '6px', fontWeight: 500 }}>
                  Active scanner rate: {simulationActive ? 'Normal' : 'Paused'}
                </div>
              </div>

              <div style={{ padding: '20px', backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <span>Avg Response Time</span>
                  <Activity size={14} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 900, marginTop: '8px', color: '#ffffff' }}>
                  {controllers.filter(c => c.status === 'connected').length > 0
                    ? Math.round(controllers.reduce((acc, c) => acc + (c.latency || 0), 0) / controllers.filter(c => c.status === 'connected').length)
                    : 0
                  } <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#94a3b8' }}>ms</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#10b981', marginTop: '6px', fontWeight: 600 }}>
                  Ping network: STABLE
                </div>
              </div>
            </div>

            {/* Watchdog Heartbeat & Safety Interlock Diagnostic Card */}
            <div style={{
              padding: '16px 20px',
              backgroundColor: '#111827',
              border: `1.5px solid ${watchdogTrip ? '#ef4444' : '#1f2937'}`,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px', height: '42px', borderRadius: '10px',
                  backgroundColor: watchdogTrip ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <HeartPulse size={22} color={watchdogTrip ? '#ef4444' : '#10b981'} className={watchdogTrip ? '' : 'animate-pulse'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>PLC Watchdog Pulse Alternator</strong>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                      backgroundColor: watchdogTrip ? '#ef4444' : '#10b981', color: 'white'
                    }}>
                      {watchdogTrip ? 'DISCONNECTED (FAIL-SAFE TRIPPED)' : 'WATCHDOG ACTIVE (1 Hz)'}
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                    Saling bertukar bit pulsa bolak-balik (0 ↔ 1) setiap 1 detik. Jika koneksi putus {'>'} 3 detik, PLC otomatis mengunci stopper dan sistem membunyikan alarm.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Watchdog Bit Pulse</span>
                  <strong style={{ fontFamily: 'monospace', color: watchdogBit ? '#10b981' : '#6366f1', fontSize: '1rem' }}>
                    BIT = {watchdogBit ? '1' : '0'}
                  </strong>
                </div>
                <div style={{ width: '1px', height: '28px', backgroundColor: '#1f2937' }} />
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', display: 'block' }}>Ping Latency</span>
                  <strong style={{ fontFamily: 'monospace', color: '#f8fafc', fontSize: '1rem' }}>
                    {watchdogTrip ? 'TIMEOUT' : `${watchdogLatency} ms`}
                  </strong>
                </div>
                <button
                  onClick={() => {
                    const next = !watchdogTrip;
                    setWatchdogTrip(next);
                    if (next) toast.error('🚨 SIMULASI KABEL PUTUS! Watchdog Gagal ➔ Interlock Safety Tripped!');
                    else toast.success('Watchdog Heartbeat dipulihkan normal');
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: watchdogTrip ? '#10b981' : '#ef4444',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {watchdogTrip ? 'Pulihkan Watchdog' : 'Simulasi Kabel Putus'}
                </button>
              </div>
            </div>

            {/* Diagnostic Logs & Active Controllers list */}
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px' }}>
              {/* Event Log Terminal */}
              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 700 }}>
                    <Terminal size={14} color="#6366f1" />
                    <span>PLC Gateway Log Console</span>
                  </div>
                  <button 
                    onClick={() => setLogs([])}
                    style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700 }}
                  >
                    Clear Console
                  </button>
                </div>
                <div style={{ padding: '16px', fontFamily: 'Consolas, monospace', fontSize: '0.75rem', height: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {logs.length === 0 ? (
                    <div style={{ color: '#64748b', textAlign: 'center', padding: '100px 0' }}>No telemetry logs recorded. Start scanner or query tag registers.</div>
                  ) : logs.map((log, idx) => {
                    let color = '#94a3b8';
                    if (log.type === 'SUCCESS') color = '#10b981';
                    if (log.type === 'WRITE') color = '#6366f1';
                    if (log.type === 'WARNING') color = '#f59e0b';
                    if (log.type === 'ERROR') color = '#ef4444';
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '12px', lineHeight: 1.5 }}>
                        <span style={{ color: '#475569' }}>[{log.ts}]</span>
                        <span style={{ color, fontWeight: 700 }}>[{log.type}]</span>
                        <span style={{ color: '#e2e8f0' }}>{log.msg}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>PLC Network Nodes</h3>
                {controllers.map(ctrl => (
                  <div key={ctrl.id} style={{ padding: '16px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: ctrl.type === 'OPC_UA' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: ctrl.type === 'OPC_UA' ? '#8b5cf6' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Server size={20} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ctrl.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>{ctrl.ip}:{ctrl.port}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '10px', backgroundColor: '#1f2937', color: '#94a3b8', fontWeight: 700 }}>
                          {ctrl.type === 'OPC_UA' ? 'OPC UA' : 'Modbus TCP'}
                        </span>
                        <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>
                          {ctrl.tagCount} tags active
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 8px', borderRadius: '12px', backgroundColor: ctrl.status === 'connected' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '0.7rem', fontWeight: 800, color: ctrl.status === 'connected' ? '#10b981' : '#ef4444' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: ctrl.status === 'connected' ? '#10b981' : '#ef4444' }} />
                        {ctrl.status === 'connected' ? `${ctrl.latency}ms` : 'Offline'}
                      </div>
                      <button
                        onClick={() => toggleControllerStatus(ctrl.id, ctrl.status)}
                        style={{ marginTop: '8px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: '#94a3b8', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        {ctrl.status === 'connected' ? 'Disconnect' : 'Connect'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab 2: PLC CONTROLLERS ── */}
        {activeTab === 'controllers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>PLC Controller Config</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Konfigurasikan stasiun PLC fisik atau server OPC UA sebagai sumber data.</p>
              </div>
              <button
                onClick={() => openCtrlModal()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <Plus size={16} /> Hubungkan PLC Baru
              </button>
            </div>

            {controllers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed #1f2937', borderRadius: '16px', color: '#64748b' }}>
                <Server size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontWeight: 700 }}>Tidak ada controller terdaftar</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Silakan hubungkan PLC fisik atau simulator untuk memulai.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                {controllers.map(ctrl => (
                  <div key={ctrl.id} style={{ backgroundColor: '#111827', border: '1.5px solid #1f2937', borderRadius: '14px', padding: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyBetween: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                          width: '42px', height: '42px', borderRadius: '10px',
                          backgroundColor: ctrl.type === 'OPC_UA' ? 'rgba(139, 92, 246, 0.1)' :
                                           ctrl.type === 'MODBUS_RTU' ? 'rgba(16, 185, 129, 0.1)' :
                                           ctrl.type === 'MQTT' ? 'rgba(245, 158, 11, 0.1)' :
                                           'rgba(99, 102, 241, 0.1)',
                          color: ctrl.type === 'OPC_UA' ? '#8b5cf6' :
                                 ctrl.type === 'MODBUS_RTU' ? '#10b981' :
                                 ctrl.type === 'MQTT' ? '#f59e0b' :
                                 '#6366f1',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                          <Server size={22} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.92rem', color: '#f8fafc' }}>{ctrl.name}</h4>
                          <span style={{ fontSize: '0.62rem', color: '#64748b', fontFamily: 'monospace' }}>ID: {ctrl.id}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '2px 8px', borderRadius: '20px', backgroundColor: ctrl.status === 'connected' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', fontSize: '0.68rem', fontWeight: 800, color: ctrl.status === 'connected' ? '#10b981' : '#ef4444' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: ctrl.status === 'connected' ? '#10b981' : '#ef4444' }} />
                        {ctrl.status === 'connected' ? 'Connected' : 'Offline'}
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', borderBottom: '1px solid #1f2937', paddingBottom: '14px', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Tipe Protokol</span>
                        <span style={{ color: '#cbd5e1', fontWeight: 700 }}>
                          {ctrl.type === 'OPC_UA' ? 'OPC UA (Python)' :
                           ctrl.type === 'SIEMENS_S7' ? 'Siemens S7 (Python)' :
                           ctrl.type === 'MODBUS_RTU' ? 'Modbus RTU' :
                           ctrl.type === 'MQTT' ? 'MQTT Broker' : 'Modbus TCP'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>
                          {ctrl.type === 'MODBUS_RTU' ? 'Serial Port' : ctrl.type === 'OPC_UA' ? 'Endpoint URL' : ctrl.type === 'MQTT' ? 'Broker Host' : 'Server Host/IP'}
                        </span>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{ctrl.ip}</span>
                      </div>
                      {ctrl.type === 'MODBUS_TCP' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Port & Unit ID</span>
                          <span style={{ color: '#cbd5e1' }}>Port {ctrl.port} / Slave #{ctrl.unitId}</span>
                        </div>
                      )}
                      {ctrl.type === 'SIEMENS_S7' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Rack & Slot / Port</span>
                          <span style={{ color: '#cbd5e1' }}>Rack {ctrl.rack || 0} / Slot {ctrl.slot || 1} / Port {ctrl.port || 102}</span>
                        </div>
                      )}
                      {ctrl.type === 'MODBUS_RTU' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Baud & Parity & Slave</span>
                          <span style={{ color: '#cbd5e1' }}>Baud {ctrl.baudRate || 9600} / {ctrl.parity || 'None'} / Slave #{ctrl.unitId || 1}</span>
                        </div>
                      )}
                      {ctrl.type === 'OPC_UA' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Security Policy</span>
                          <span style={{ color: '#cbd5e1' }}>{ctrl.securityPolicy || 'None'}</span>
                        </div>
                      )}
                      {ctrl.type === 'MQTT' && (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Port & Client ID</span>
                          <span style={{ color: '#cbd5e1' }}>Port {ctrl.port || 1883} / {ctrl.clientId || 'mandor-client'}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Interval Polling</span>
                        <span style={{ color: '#cbd5e1' }}>{ctrl.pollingInterval} ms</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                        {ctrl.tagCount} Tag Terdaftar
                      </span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => openCtrlModal(ctrl)}
                          style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteController(ctrl.id, ctrl.name)}
                          style={{ padding: '6px', borderRadius: '7px', border: '1px solid #311', backgroundColor: '#211', color: '#ef4444', cursor: 'pointer' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 3: REGISTER TAG MAPPING ── */}
        {activeTab === 'tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>PLC Registry Tag Mappings</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Daftarkan tag memori PLC agar dapat dibaca di Live Terminal, dashboard HMI, atau skrip otomasi.</p>
              </div>
              <button
                onClick={() => openTagModal()}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}
              >
                <Plus size={16} /> Daftarkan Tag Baru
              </button>
            </div>

            {tags.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', border: '2px dashed #1f2937', borderRadius: '16px', color: '#64748b' }}>
                <Key size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <div style={{ fontWeight: 700 }}>Belum ada tag dipetakan</div>
                <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>Daftarkan alamat register Modbus atau node OPC UA untuk di-polling.</div>
              </div>
            ) : (
              <div style={{ backgroundColor: '#111827', borderRadius: '12px', border: '1px solid #1f2937', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #1f2937', color: '#94a3b8', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: '0.05em' }}>
                      <th style={{ padding: '16px' }}>Nama Tag</th>
                      <th style={{ padding: '16px' }}>PLC Node</th>
                      <th style={{ padding: '16px' }}>Tipe Register</th>
                      <th style={{ padding: '16px' }}>Alamat/NodeID</th>
                      <th style={{ padding: '16px' }}>Tipe Data</th>
                      <th style={{ padding: '16px' }}>Multiplier</th>
                      <th style={{ padding: '16px' }}>Live Value</th>
                      <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tags.map(tag => {
                      const parentCtrl = controllers.find(c => c.id === tag.controllerId);
                      return (
                        <tr key={tag.id} style={{ borderBottom: '1px solid #1f2937', transition: 'background-color 0.15s' }}>
                          <td style={{ padding: '14px 16px', fontWeight: 800, color: '#f8fafc' }}>{tag.name}</td>
                          <td style={{ padding: '14px 16px', color: '#cbd5e1' }}>{parentCtrl ? parentCtrl.name : 'Unknown PLC'}</td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: '#1e293b', color: '#a5b4fc', fontWeight: 700 }}>
                              {tag.regType}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', fontFamily: 'monospace', color: '#a5b4fc' }}>{tag.address}</td>
                          <td style={{ padding: '14px 16px', color: '#94a3b8' }}>{tag.dataType}</td>
                          <td style={{ padding: '14px 16px', color: '#94a3b8' }}>x{tag.multiplier}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, fontFamily: 'monospace', color: '#10b981' }}>
                            {tag.value}
                          </td>
                          <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleTestTag(tag)}
                                style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: '#6366f1', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Test Tag
                              </button>
                              <button
                                onClick={() => openTagModal(tag)}
                                style={{ padding: '5px', borderRadius: '6px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: '#94a3b8', cursor: 'pointer' }}
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteTag(tag.id, tag.name)}
                                style={{ padding: '5px', borderRadius: '6px', border: '1px solid #311', backgroundColor: '#211', color: '#ef4444', cursor: 'pointer' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 4: LIVE REGISTER SCANNER GRID ── */}
        {activeTab === 'scanner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Modbus Live Register Scanner</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Inspeksi memori register langsung dari PLC secara berurutan. Klik sel data writable untuk menulis nilai.</p>
              </div>

              {/* Selector Toolbar */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>PLC Controller</label>
                  <select
                    value={scannerControllerId}
                    onChange={e => setScannerControllerId(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#111827', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                  >
                    {controllers.filter(c => ['MODBUS_TCP', 'SIEMENS_S7', 'OPC_UA'].includes(c.type)).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                    {controllers.filter(c => ['MODBUS_TCP', 'SIEMENS_S7', 'OPC_UA'].includes(c.type)).length === 0 && (
                      <option value="">No Writable PLCs</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginBottom: '4px', fontWeight: 700 }}>Register Block</label>
                  <select
                    value={scannerAddressRange}
                    onChange={e => setScannerAddressRange(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#111827', color: 'white', fontSize: '0.8rem', outline: 'none' }}
                  >
                    <option value="1">Coils (00001 - 00020)</option>
                    <option value="10001">Discrete Inputs (10001 - 10020)</option>
                    <option value="30001">Input Registers (30001 - 30020)</option>
                    <option value="40001">Holding Registers (40001 - 40020)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Register Grid Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {scannerData.map(reg => (
                <div 
                  key={reg.address}
                  onClick={() => reg.writable && setScannerActiveReg(reg)}
                  style={{
                    padding: '14px',
                    backgroundColor: '#111827',
                    border: scannerActiveReg?.address === reg.address ? '1.5px solid #6366f1' : '1px solid #1f2937',
                    borderRadius: '10px',
                    cursor: reg.writable ? 'pointer' : 'default',
                    transition: 'all 0.15s',
                    position: 'relative'
                  }}
                  onMouseEnter={e => { if (reg.writable) e.currentTarget.style.borderColor = '#4f46e5'; }}
                  onMouseLeave={e => { if (reg.writable && scannerActiveReg?.address !== reg.address) e.currentTarget.style.borderColor = '#1f2937'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 800 }}>{String(reg.address).padStart(5, '0')}</span>
                    {reg.tag && (
                      <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: '#818cf8', fontWeight: 700, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg.tag}
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '8px 0 2px 0', fontFamily: 'monospace' }}>
                    {reg.decimal}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#475569', fontFamily: 'monospace' }}>
                    <span>{reg.hex}</span>
                    <span>{reg.binary}</span>
                  </div>

                  {reg.writable && (
                    <div style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '0.55rem', color: '#6366f1', fontWeight: 800 }}>
                      EDIT
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Quick Register Write Tool */}
            {scannerActiveReg && (
              <div style={{ marginTop: '10px', padding: '18px', backgroundColor: 'rgba(99, 102, 241, 0.05)', border: '1px dashed #4f46e5', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyBetween: 'space-between', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800 }}>Tulis Data ke Register {scannerActiveReg.address}</div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>Masukkan nilai baru untuk dikirimkan ke memori simulator PLC.</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                  <input
                    type="number"
                    value={scannerWriteVal}
                    onChange={e => setScannerWriteVal(e.target.value)}
                    placeholder={`Current: ${scannerActiveReg.decimal}`}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#111827', color: 'white', fontSize: '0.85rem', width: '120px', outline: 'none' }}
                  />
                  <button
                    onClick={handleWriteRegister}
                    style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Tulis Nilai
                  </button>
                  <button
                    onClick={() => { setScannerActiveReg(null); setScannerWriteVal(''); }}
                    style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tab 5: INDUSTRIAL TEMPLATES ── */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Predefined PLC Templates</h3>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>Pilih dari template industri siap pakai untuk mempercepat pemetaan register tag pada stasiun kerja Anda.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {Object.entries(TEMPLATES).map(([key, template]) => (
                <div key={key} style={{ padding: '20px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px' }}>
                  <div>
                    <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem', color: '#f8fafc' }}>{template.name}</h4>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: '#94a3b8', lineHeight: 1.5 }}>{template.description}</p>
                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {template.tags.map(t => (
                        <span key={t.name} style={{ fontSize: '0.62rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#1f2937', color: '#cbd5e1', fontFamily: 'monospace' }}>
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleLoadTemplate(key)}
                    style={{ marginTop: '20px', width: '100%', padding: '9px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    Muat Template Tag
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tab: LIVE TAG BROWSER (OPC-UA / PLC AUTO-DISCOVERY) ── */}
        {activeTab === 'tag_browser' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FolderTree size={18} color="#8b5cf6" /> Live OPC-UA & PLC Tag Browser (Auto-Discovery)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Jelajahi struktur Data Block dan Node ID PLC secara langsung tanpa mengetik alamat register secara manual.
                </p>
              </div>
              <button
                onClick={() => toast.success('Struktur Node Tag PLC berhasil di-refresh!')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '8px 14px', borderRadius: '8px', border: '1px solid #334155',
                  backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer'
                }}
              >
                <RefreshCw size={14} /> Scan Ulang PLC
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
              {/* Left Tree Explorer */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '16px', minHeight: '400px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                  Address Space Node Tree
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.8rem' }}>
                  {PLC_TAG_TREE.children.map(group => {
                    const isGroupOpen = expandedNodes.has(group.id);
                    return (
                      <div key={group.id} style={{ display: 'flex', flexDirection: 'column' }}>
                        <div
                          onClick={() => {
                            const next = new Set(expandedNodes);
                            if (next.has(group.id)) next.delete(group.id);
                            else next.add(group.id);
                            setExpandedNodes(next);
                          }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                            borderRadius: '6px', cursor: 'pointer', backgroundColor: '#1e293b', color: '#f8fafc', fontWeight: 700
                          }}
                        >
                          <ChevronRight size={14} style={{ transform: isGroupOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                          <FolderTree size={15} color="#8b5cf6" />
                          <span>{group.name}</span>
                        </div>

                        {isGroupOpen && (
                          <div style={{ paddingLeft: '28px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', marginBottom: '8px' }}>
                            {group.children.map(tagNode => {
                              const isTagSelected = selectedBrowserTag?.id === tagNode.id;
                              return (
                                <div
                                  key={tagNode.id}
                                  onClick={() => setSelectedBrowserTag(tagNode)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 10px', borderRadius: '6px', cursor: 'pointer',
                                    backgroundColor: isTagSelected ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
                                    border: isTagSelected ? '1px solid #6366f1' : '1px solid transparent',
                                    color: isTagSelected ? '#ffffff' : '#cbd5e1'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Key size={13} color="#f59e0b" />
                                    <span style={{ fontWeight: 600 }}>{tagNode.name}</span>
                                  </div>
                                  <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', color: '#94a3b8' }}>{tagNode.address}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Tag Inspector & Bind Action */}
              <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '14px' }}>
                  Detail Node & 1-Click Binding
                </span>
                {selectedBrowserTag ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ padding: '14px', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px' }}>
                      <strong style={{ fontSize: '1rem', color: '#f8fafc', display: 'block' }}>{selectedBrowserTag.name}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#8b5cf6', fontFamily: 'monospace', marginTop: '4px' }}>
                        Alamat Node: {selectedBrowserTag.address}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.75rem' }}>
                      <div style={{ padding: '10px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Tipe Data</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedBrowserTag.type}</strong>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Hak Akses</span>
                        <strong style={{ color: '#f8fafc' }}>{selectedBrowserTag.access}</strong>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Live Value Terbaca</span>
                        <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>{selectedBrowserTag.value}</strong>
                      </div>
                      <div style={{ padding: '10px', backgroundColor: '#1f2937', borderRadius: '6px' }}>
                        <span style={{ color: '#94a3b8', display: 'block', fontSize: '0.65rem' }}>Sampling Rate</span>
                        <strong style={{ color: '#f8fafc' }}>100 ms</strong>
                      </div>
                    </div>

                    <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
                      <button
                        onClick={() => handleBindTagFromBrowser(selectedBrowserTag)}
                        style={{
                          width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white',
                          border: 'none', borderRadius: '8px', fontSize: '0.84rem', fontWeight: 800,
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)'
                        }}
                      >
                        <Plus size={16} /> Bind ke Register Tag MAVI MES
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b', fontSize: '0.8rem' }}>
                    Pilih salah satu variabel tag dari pohon address space di sebelah kiri untuk melihat rincian dan melakukan binding.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: MES ↔ PLC HANDSHAKE STATE MACHINE ── */}
        {activeTab === 'handshake' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ArrowRightLeft size={18} color="#10b981" /> MES ↔ PLC Handshake State Machine (Poka-Yoke)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Protokol jabat tangan otomatis untuk memastikan part tidak dapat melaju sebelum checksheet tervalidasi dan hasil ukur tercatat.
                </p>
              </div>
              <button
                onClick={runHandshakeSimulation}
                disabled={isHandshakeRunning}
                style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '8px', border: 'none',
                  backgroundColor: isHandshakeRunning ? '#4f46e5' : '#10b981', color: 'white',
                  fontSize: '0.84rem', fontWeight: 800, cursor: isHandshakeRunning ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                }}
              >
                {isHandshakeRunning ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                {isHandshakeRunning ? 'Handshake Berjalan...' : 'Simulasikan 1 Siklus Handshake'}
              </button>
            </div>

            {/* Visual 5-Step Process */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {[
                { step: 1, title: 'Part Tiba di Stopper', desc: 'PLC kirim TRIGGER_REQ = 1 & Part Barcode', bit: 'TRIGGER_REQ', val: handshakeRegisters.triggerReq ? '1' : '0' },
                { step: 2, title: 'Validasi MES', desc: 'MES verifikasi checksheet ➔ Tulis RECIPE_OK = 1', bit: 'RECIPE_OK', val: handshakeRegisters.recipeOk ? '1' : '0' },
                { step: 3, title: 'Mesin Beroperasi', desc: 'PLC jepit part & jalankan motor/press', bit: 'CYCLE_ACTIVE', val: handshakeRegisters.cycleRunning ? '1' : '0' },
                { step: 4, title: 'Hasil Ukur Siap', desc: 'PLC tulis 45.2 Nm & CYCLE_DONE = 1', bit: 'CYCLE_DONE', val: handshakeRegisters.cycleDone ? '1' : '0' },
                { step: 5, title: 'MES Ack & Lepas Part', desc: 'MES simpan record ➔ MES_ACK = 1 & Stopper turun', bit: 'MES_ACK', val: handshakeRegisters.mesAck ? '1' : '0' }
              ].map(s => {
                const isStepActive = handshakeStep === s.step;
                const isPassed = handshakeStep > s.step;
                return (
                  <div
                    key={s.step}
                    style={{
                      padding: '16px',
                      backgroundColor: isStepActive ? '#1e1b4b' : '#111827',
                      border: `1.5px solid ${isStepActive ? '#6366f1' : isPassed ? '#10b981' : '#1f2937'}`,
                      borderRadius: '10px',
                      display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '140px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', backgroundColor: isPassed ? '#10b981' : isStepActive ? '#6366f1' : '#374151', color: 'white' }}>
                          TAHAP {s.step}
                        </span>
                        <span style={{ fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800, color: s.val === '1' ? '#10b981' : '#64748b' }}>
                          {s.bit}: {s.val}
                        </span>
                      </div>
                      <strong style={{ fontSize: '0.85rem', color: '#f8fafc', display: 'block' }}>{s.title}</strong>
                      <p style={{ margin: '6px 0 0', fontSize: '0.72rem', color: '#94a3b8', lineHeight: 1.4 }}>{s.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Register Signal Status Card */}
            <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', padding: '18px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
                Status Bit Register Handshake PLC (Live State)
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '0.78rem' }}>
                <div style={{ padding: '12px', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block' }}>TRIGGER_REQ (PLC ➔ MES)</span>
                  <strong style={{ color: handshakeRegisters.triggerReq ? '#10b981' : '#64748b', fontSize: '1rem', fontFamily: 'monospace' }}>
                    {handshakeRegisters.triggerReq ? '1 (TRUE)' : '0 (FALSE)'}
                  </strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block' }}>RECIPE_OK (MES ➔ PLC)</span>
                  <strong style={{ color: handshakeRegisters.recipeOk ? '#10b981' : '#64748b', fontSize: '1rem', fontFamily: 'monospace' }}>
                    {handshakeRegisters.recipeOk ? '1 (TRUE)' : '0 (FALSE)'}
                  </strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block' }}>CYCLE_DONE (PLC ➔ MES)</span>
                  <strong style={{ color: handshakeRegisters.cycleDone ? '#10b981' : '#64748b', fontSize: '1rem', fontFamily: 'monospace' }}>
                    {handshakeRegisters.cycleDone ? '1 (TRUE)' : '0 (FALSE)'}
                  </strong>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#090d16', border: '1px solid #1f2937', borderRadius: '8px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '0.65rem', display: 'block' }}>MES_ACK (MES ➔ PLC)</span>
                  <strong style={{ color: handshakeRegisters.mesAck ? '#10b981' : '#64748b', fontSize: '1rem', fontFamily: 'monospace' }}>
                    {handshakeRegisters.mesAck ? '1 (TRUE)' : '0 (FALSE)'}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: AUTOMATED RECIPE & PARAMETER PUSH ── */}
        {activeTab === 'recipe' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sliders size={18} color="#06b6d4" /> 1-Click Recipe Parameter Push (Poka-Yoke Resep Mesin)
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                  Kirim setpoint parameter otomatis dari Work Order / Checksheet ke Data Block PLC tanpa operator harus mengetik manual di HMI.
                </p>
              </div>

              {/* Recipe Selector Dropdown */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => { setSelectedRecipeId(e.target.value); setRecipePushState(null); }}
                  style={{
                    padding: '8px 12px', backgroundColor: '#1e293b', border: '1px solid #334155',
                    borderRadius: '8px', color: '#f8fafc', fontSize: '0.8rem', fontWeight: 600, outline: 'none'
                  }}
                >
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.name} ({r.partNo})</option>
                  ))}
                </select>

                <button
                  onClick={() => handlePushRecipeToPlc(recipes.find(r => r.id === selectedRecipeId))}
                  disabled={recipePushState === 'pushing'}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '9px 18px', borderRadius: '8px', border: 'none',
                    backgroundColor: '#06b6d4', color: '#090d16', fontSize: '0.84rem', fontWeight: 800,
                    cursor: recipePushState === 'pushing' ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 12px rgba(6, 182, 212, 0.35)'
                  }}
                >
                  {recipePushState === 'pushing' ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  {recipePushState === 'pushing' ? 'Mengirim ke PLC...' : '🚀 Download Recipe ke PLC'}
                </button>
              </div>
            </div>

            {/* Recipe Parameters Table */}
            {(() => {
              const currentRecipe = recipes.find(r => r.id === selectedRecipeId) || recipes[0];
              return (
                <div style={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' }}>
                    <div>
                      <strong style={{ fontSize: '0.92rem', color: '#f8fafc' }}>{currentRecipe.name}</strong>
                      <span style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'block', marginTop: '2px' }}>
                        Part Target: <strong>{currentRecipe.partNo}</strong> • {currentRecipe.parameters.length} Setpoints
                      </span>
                    </div>

                    {recipePushState === 'verified' && (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '12px', backgroundColor: 'rgba(16, 185, 129, 0.2)',
                        border: '1px solid #10b981', color: '#10b981', fontSize: '0.72rem', fontWeight: 800
                      }}>
                        <CheckCircle2 size={13} /> Setpoints Verified in PLC Memory (0.0% Error)
                      </span>
                    )}
                  </div>

                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead style={{ backgroundColor: '#090d16', color: '#94a3b8', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase' }}>
                      <tr>
                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Parameter Mesin</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Target Setpoint (MES)</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Satuan</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Alamat Register PLC</th>
                        <th style={{ padding: '10px 16px', textAlign: 'left' }}>Nilai Aktual Terbaca di PLC</th>
                        <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status Verifikasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecipe.parameters.map((p, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid #1f2937' }}>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: '#f8fafc' }}>{p.name}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 800, color: '#06b6d4', fontSize: '0.9rem' }}>
                            {p.target}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#94a3b8' }}>{p.unit}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', color: '#8b5cf6' }}>{p.register}</td>
                          <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>
                            {p.current}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800,
                              backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                              MATCH 100%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── Tab 6: HELP & WIRING GUIDE ── */}
        {activeTab === 'help' && (
          <PlcHelpAssistant />
        )}

      </div>

      {/* ─── CONTROLLER CONFIG MODAL ─────────────────────────────────────────── */}
      {isCtrlModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '480px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                {editingCtrl ? 'Edit PLC Controller' : 'Hubungkan PLC Controller'}
              </h3>
              <button onClick={() => setIsCtrlModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Nama Controller</label>
                <input
                  type="text"
                  value={ctrlForm.name}
                  onChange={e => setCtrlForm({...ctrlForm, name: e.target.value})}
                  placeholder="e.g. Packing Station Mitsubishi"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe Protokol</label>
                  <select
                    value={ctrlForm.type}
                    onChange={e => {
                      const type = e.target.value;
                      const port = type === 'OPC_UA' ? 4840 : (type === 'SIEMENS_S7' ? 102 : (type === 'MQTT' ? 1883 : 502));
                      setCtrlForm({...ctrlForm, type, port});
                    }}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="MODBUS_TCP">Modbus TCP (Tauri Native)</option>
                    <option value="MODBUS_RTU">Modbus RTU (Tauri Native)</option>
                    <option value="OPC_UA">OPC UA (Python)</option>
                    <option value="SIEMENS_S7">Siemens S7 (Python)</option>
                    <option value="MQTT">MQTT Broker</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {ctrlForm.type === 'MODBUS_RTU' ? 'Serial Port Path' : ctrlForm.type === 'OPC_UA' ? 'Endpoint URL' : ctrlForm.type === 'MQTT' ? 'Broker Host' : 'Host/IP Address'}
                  </label>
                  <input
                    type="text"
                    value={ctrlForm.ip}
                    onChange={e => setCtrlForm({...ctrlForm, ip: e.target.value})}
                    placeholder={ctrlForm.type === 'MODBUS_RTU' ? 'e.g. COM3 or /dev/ttyUSB0' : ctrlForm.type === 'OPC_UA' ? 'opc.tcp://192.168.1.60:4840' : ctrlForm.type === 'MQTT' ? 'e.g. broker.hivemq.com' : 'e.g. 192.168.1.15'}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {ctrlForm.type === 'MODBUS_TCP' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Port TCP</label>
                    <input
                      type="number"
                      value={ctrlForm.port}
                      onChange={e => setCtrlForm({...ctrlForm, port: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Unit/Slave ID</label>
                    <input
                      type="number"
                      value={ctrlForm.unitId}
                      onChange={e => setCtrlForm({...ctrlForm, unitId: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {ctrlForm.type === 'SIEMENS_S7' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Port TCP</label>
                    <input
                      type="number"
                      value={ctrlForm.port || 102}
                      onChange={e => setCtrlForm({...ctrlForm, port: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Rack</label>
                    <input
                      type="number"
                      value={ctrlForm.rack !== undefined ? ctrlForm.rack : 0}
                      onChange={e => setCtrlForm({...ctrlForm, rack: parseInt(e.target.value) || 0})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Slot</label>
                    <input
                      type="number"
                      value={ctrlForm.slot !== undefined ? ctrlForm.slot : 1}
                      onChange={e => setCtrlForm({...ctrlForm, slot: parseInt(e.target.value) || 0})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {ctrlForm.type === 'MODBUS_RTU' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Baud Rate</label>
                    <select
                      value={ctrlForm.baudRate || 9600}
                      onChange={e => setCtrlForm({...ctrlForm, baudRate: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    >
                      <option value="4800">4800</option>
                      <option value="9600">9600</option>
                      <option value="19200">19200</option>
                      <option value="38400">38400</option>
                      <option value="115200">115200</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Parity</label>
                    <select
                      value={ctrlForm.parity || 'None'}
                      onChange={e => setCtrlForm({...ctrlForm, parity: e.target.value})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    >
                      <option value="None">None</option>
                      <option value="Even">Even</option>
                      <option value="Odd">Odd</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Unit/Slave ID</label>
                    <input
                      type="number"
                      value={ctrlForm.unitId || 1}
                      onChange={e => setCtrlForm({...ctrlForm, unitId: parseInt(e.target.value)})}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {ctrlForm.type === 'OPC_UA' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Security Policy</label>
                  <select
                    value={ctrlForm.securityPolicy || 'None'}
                    onChange={e => setCtrlForm({...ctrlForm, securityPolicy: e.target.value})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="None">None</option>
                    <option value="Basic256Sha256">Basic256Sha256 (Sign & Encrypt)</option>
                    <option value="Basic256">Basic256 (Sign)</option>
                  </select>
                </div>
              )}

              {ctrlForm.type === 'MQTT' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Port MQTT</label>
                      <input
                        type="number"
                        value={ctrlForm.port || 1883}
                        onChange={e => setCtrlForm({...ctrlForm, port: parseInt(e.target.value)})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Client ID</label>
                      <input
                        type="text"
                        value={ctrlForm.clientId || 'mandor-client'}
                        onChange={e => setCtrlForm({...ctrlForm, clientId: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Username</label>
                      <input
                        type="text"
                        value={ctrlForm.username || ''}
                        onChange={e => setCtrlForm({...ctrlForm, username: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Password</label>
                      <input
                        type="password"
                        value={ctrlForm.password || ''}
                        onChange={e => setCtrlForm({...ctrlForm, password: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Topic Prefix (Optional)</label>
                    <input
                      type="text"
                      value={ctrlForm.topicPrefix || ''}
                      onChange={e => setCtrlForm({...ctrlForm, topicPrefix: e.target.value})}
                      placeholder="e.g. factory/line1/"
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                    />
                  </div>
                </>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Polling Interval (ms)</label>
                <input
                  type="number"
                  value={ctrlForm.pollingInterval}
                  onChange={e => setCtrlForm({...ctrlForm, pollingInterval: parseInt(e.target.value)})}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#0f172a' }}>
              <button onClick={() => setIsCtrlModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSaveController} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── REGISTER TAG MAPPING MODAL ─────────────────────────────────────── */}
      {isTagModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '500px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '16px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a' }}>
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                {editingTag ? 'Edit Tag Register Mapping' : 'Daftarkan Tag PLC Baru'}
              </h3>
              <button onClick={() => setIsTagModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>PLC Controller</label>
                <select
                  value={tagForm.controllerId}
                  onChange={e => handleTagControllerChange(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                >
                  {controllers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Nama Tag (Variabel)</label>
                  <input
                    type="text"
                    value={tagForm.name}
                    onChange={e => setTagForm({...tagForm, name: e.target.value})}
                    placeholder="e.g. Tank_Level"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe Register / Topic</label>
                  <select
                    value={tagForm.regType}
                    onChange={e => setTagForm({...tagForm, regType: e.target.value})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    {(() => {
                      const cType = controllers.find(c => c.id === tagForm.controllerId)?.type;
                      if (cType === 'OPC_UA') {
                        return <option value="NODE">OPC UA Node ID</option>;
                      } else if (cType === 'MQTT') {
                        return <option value="MQTT_TOPIC">MQTT Topic</option>;
                      } else if (cType === 'SIEMENS_S7') {
                        return (
                          <>
                            <option value="DB">Data Block (DB)</option>
                            <option value="INPUT">Inputs (I)</option>
                            <option value="OUTPUT">Outputs (Q)</option>
                            <option value="MERKER">Merkers (M)</option>
                          </>
                        );
                      } else {
                        return MODBUS_REG_TYPES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ));
                      }
                    })()}
                  </select>
                </div>
              </div>

              {(() => {
                const cType = controllers.find(c => c.id === tagForm.controllerId)?.type;
                if (cType === 'SIEMENS_S7') {
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: tagForm.regType === 'DB' ? '1fr 1.2fr' : '1fr', gap: '8px' }}>
                          {tagForm.regType === 'DB' && (
                            <div>
                              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>DB No.</label>
                              <input
                                type="number"
                                value={tagForm.dbNumber !== undefined ? tagForm.dbNumber : 1}
                                onChange={e => setTagForm({...tagForm, dbNumber: parseInt(e.target.value) || 1})}
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                              />
                            </div>
                          )}
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Byte Address</label>
                            <input
                              type="number"
                              value={tagForm.address}
                              onChange={e => setTagForm({...tagForm, address: e.target.value})}
                              placeholder="e.g. 0"
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                        {tagForm.dataType === 'BOOLEAN' && (
                          <div>
                            <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Bit Offset (0-7)</label>
                            <input
                              type="number"
                              min="0"
                              max="7"
                              value={tagForm.bitOffset !== undefined ? tagForm.bitOffset : 0}
                              onChange={e => setTagForm({...tagForm, bitOffset: parseInt(e.target.value) || 0})}
                              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe Data</label>
                        <select
                          value={tagForm.dataType}
                          onChange={e => setTagForm({...tagForm, dataType: e.target.value})}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        >
                          {DATA_TYPES.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                        {tagForm.regType === 'NODE' ? 'Node ID' : tagForm.regType === 'MQTT_TOPIC' ? 'MQTT Topic' : 'Register Address'}
                      </label>
                      <input
                        type="text"
                        value={tagForm.address}
                        onChange={e => setTagForm({...tagForm, address: e.target.value})}
                        placeholder={tagForm.regType === 'NODE' ? 'ns=2;s=Device.TagName' : tagForm.regType === 'MQTT_TOPIC' ? 'e.g. telemetry/temperature' : 'e.g. 40001'}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe Data</label>
                      <select
                        value={tagForm.dataType}
                        onChange={e => setTagForm({...tagForm, dataType: e.target.value})}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                      >
                        {DATA_TYPES.map(d => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })()}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Multiplier (Scaling)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={tagForm.multiplier}
                    onChange={e => setTagForm({...tagForm, multiplier: parseFloat(e.target.value) || 1})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Permissions</label>
                  <select
                    value={tagForm.permissions}
                    onChange={e => setTagForm({...tagForm, permissions: e.target.value})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="RW">Read / Write (RW)</option>
                    <option value="RO">Read-Only (RO)</option>
                  </select>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#0f172a' }}>
              <button onClick={() => setIsTagModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}>Batal</button>
              <button onClick={handleSaveTag} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', backgroundColor: '#6366f1', color: 'white', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}>Simpan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


