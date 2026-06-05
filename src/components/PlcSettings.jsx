import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu, Zap, Database, Activity, Plus, Search, Trash2, Edit2, Settings2, 
  RefreshCw, Play, StopCircle, CheckCircle2, AlertTriangle, Grid, 
  FileJson, Download, Upload, Server, Terminal, Save, X, ArrowRight,
  TrendingUp, Radio, HelpCircle, AlertCircle, Key
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Constants & Options ───────────────────────────────────────────────────
const CONTROLLER_TYPES = [
  { value: 'MODBUS_TCP', label: 'Modbus TCP', icon: Database, color: '#6366f1', desc: 'Direct Modbus registers over TCP/IP' },
  { value: 'OPC_UA', label: 'OPC UA', icon: Cpu, color: '#8b5cf6', desc: 'Secure Unified Architecture nodes' }
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

  // ─── PERSISTENCE STATES ──────────────────────────────────────────────────
  const [controllers, setControllers] = useState(() => {
    try {
      const saved = localStorage.getItem('mavi_plc_controllers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error parsing PLC controllers:', e);
    }
    return [
      { id: 'ctrl_1', name: 'Main Conveyor PLC', type: 'MODBUS_TCP', ip: '192.168.1.50', port: 502, unitId: 1, status: 'connected', latency: 45, tagCount: 4, pollingInterval: 1000 },
      { id: 'ctrl_2', name: 'Boiler OPC UA Server', type: 'OPC_UA', ip: 'opc.tcp://192.168.1.60:4840', port: 4840, securityPolicy: 'Basic256Sha256', status: 'connected', latency: 68, tagCount: 4, pollingInterval: 2000 }
    ];
  });

  const [tags, setTags] = useState(() => {
    try {
      const saved = localStorage.getItem('mavi_plc_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error parsing PLC tags:', e);
    }
    return [
      { id: 'tag_1', controllerId: 'ctrl_1', name: 'Motor_Status', regType: 'COIL', address: '1', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: '1' },
      { id: 'tag_2', controllerId: 'ctrl_1', name: 'Conveyor_Speed_Setpoint', regType: 'HOLDING_REGISTER', address: '2', dataType: 'INT16', multiplier: 0.1, permissions: 'RW', value: '65.5' },
      { id: 'tag_3', controllerId: 'ctrl_1', name: 'Emergency_Stop', regType: 'DISCRETE_INPUT', address: '5', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RO', value: 'false' },
      { id: 'tag_4', controllerId: 'ctrl_1', name: 'Item_Counter', regType: 'INPUT_REGISTER', address: '10', dataType: 'UINT16', multiplier: 1, permissions: 'RO', value: '1420' },
      
      { id: 'tag_5', controllerId: 'ctrl_2', name: 'Core_Temperature', regType: 'NODE', address: 'ns=2;s=BoilerCore.Temperature', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '184.2' },
      { id: 'tag_6', controllerId: 'ctrl_2', name: 'Water_Level_Sensor', regType: 'NODE', address: 'ns=2;s=BoilerCore.WaterLevel', dataType: 'FLOAT', multiplier: 1, permissions: 'RO', value: '72.8' },
      { id: 'tag_7', controllerId: 'ctrl_2', name: 'Safety_Valve_Command', regType: 'NODE', address: 'ns=2;s=BoilerCore.ValveCommand', dataType: 'BOOLEAN', multiplier: 1, permissions: 'RW', value: 'false' },
      { id: 'tag_8', controllerId: 'ctrl_2', name: 'Pressure_Psi', regType: 'NODE', address: 'ns=2;s=BoilerCore.PressurePSI', dataType: 'INT32', multiplier: 0.1, permissions: 'RO', value: '142' }
    ];
  });

  const [logs, setLogs] = useState([
    { ts: new Date(Date.now() - 5000).toLocaleTimeString(), type: 'INFO', msg: 'System initialized. Loading controllers.' },
    { ts: new Date(Date.now() - 4000).toLocaleTimeString(), type: 'SUCCESS', msg: 'Successfully connected to Main Conveyor PLC (192.168.1.50:502)' },
    { ts: new Date(Date.now() - 3500).toLocaleTimeString(), type: 'SUCCESS', msg: 'Successfully connected to Boiler OPC UA Server (opc.tcp://192.168.1.60:4840)' },
    { ts: new Date(Date.now() - 2000).toLocaleTimeString(), type: 'READ', msg: '[Modbus] Read Coil 00001 (Motor_Status): 1' },
    { ts: new Date(Date.now() - 1000).toLocaleTimeString(), type: 'READ', msg: '[OPC UA] Read ns=2;s=BoilerCore.Temperature: 184.2' }
  ]);

  // Sync default scanner controller on load
  const [scannerAddressRange, setScannerAddressRange] = useState('40001');
  const [scannerData, setScannerData] = useState([]);
  const [scannerControllerId, setScannerControllerId] = useState(controllers[0]?.id || '');
  const [scannerWriteVal, setScannerWriteVal] = useState('');
  const [scannerActiveReg, setScannerActiveReg] = useState(null);

  // Persistent settings save
  useEffect(() => {
    if (Array.isArray(controllers)) {
      localStorage.setItem('mavi_plc_controllers', JSON.stringify(controllers));
    }
  }, [controllers]);

  // Connect to Modbus TCP PLCs on startup if they are set to 'connected'
  useEffect(() => {
    const initConnections = async () => {
      const api = await getTauriApi();
      if (!api.invoke) return;
      
      for (const ctrl of controllers) {
        if (ctrl.type === 'MODBUS_TCP' && ctrl.status === 'connected') {
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
            // Set status to disconnected since we failed to connect on startup
            setControllers(prev => (prev || []).map(c => c.id === ctrl.id ? { ...c, status: 'disconnected', latency: 0 } : c));
          }
        }
      }
    };
    initConnections();
  }, []); // Run once on mount

  useEffect(() => {
    if (Array.isArray(tags)) {
      localStorage.setItem('mavi_plc_tags', JSON.stringify(tags));
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
  const [simulationActive, setSimulationActive] = useState(true);
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
        if (isRealModbus) return prev;

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
        const protocol = controller?.type === 'OPC_UA' ? 'OPC UA' : 'Modbus';
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

  // ─── REAL MODBUS BACKEND POLLING ──────────────────────────────────────────
  useEffect(() => {
    const apiPromise = getTauriApi();
    let isMounted = true;
    let activeIntervals = [];

    const startPolling = async () => {
      const api = await apiPromise;
      if (!api.invoke) return;

      // Clean up previous intervals
      activeIntervals.forEach(clearInterval);
      activeIntervals = [];

      controllers.forEach(ctrl => {
        if (ctrl.type === 'MODBUS_TCP' && ctrl.status === 'connected') {
          const intervalId = setInterval(async () => {
            if (!isMounted) return;

            // 1. Poll registered tags for this controller
            const ctrlTags = (tags || []).filter(t => t.controllerId === ctrl.id);
            for (const tag of ctrlTags) {
              let addr = parseInt(tag.address);
              if (isNaN(addr)) continue;

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
                console.error('Error scanning Modbus registers:', err);
                addLog('ERROR', `Error scanning Modbus registers: ${err}`);
              }
            }

          }, ctrl.pollingInterval || 2000);

          activeIntervals.push(intervalId);
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
    if (editingCtrl) {
      setControllers(prev => prev.map(c => c.id === editingCtrl.id ? { ...c, ...ctrlForm } : c));
      addLog('INFO', `Controller '${ctrlForm.name}' updated.`);
      toast.success('Controller berhasil diperbarui.');
    } else {
      const newId = `ctrl_${Date.now()}`;
      setControllers(prev => [...prev, {
        id: newId, ...ctrlForm, status: 'connected', latency: 30, tagCount: 0
      }]);
      addLog('SUCCESS', `New controller '${ctrlForm.name}' connected.`);
      toast.success('Controller baru ditambahkan.');
    }
    setIsCtrlModalOpen(false);
  };

  const handleDeleteController = (id, name) => {
    if (window.confirm(`Hapus controller '${name}' beserta semua tag yang dimilikinya?`)) {
      setControllers(prev => prev.filter(c => c.id !== id));
      setTags(prev => prev.filter(t => t.controllerId !== id));
      addLog('WARNING', `Controller '${name}' deleted.`);
      toast.success('Controller berhasil dihapus.');
    }
  };

  const toggleControllerStatus = async (id, currentStatus) => {
    const controller = controllers.find(c => c.id === id);
    if (!controller) return;

    const nextStatus = currentStatus === 'connected' ? 'disconnected' : 'connected';
    
    // Connect/Disconnect Modbus in Backend if Tauri is available and type is MODBUS_TCP
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
    }

    setControllers(prev => prev.map(c => c.id === id ? {
      ...c,
      status: nextStatus,
      latency: nextStatus === 'connected' ? 30 : 0
    } : c));
    addLog(nextStatus === 'connected' ? 'SUCCESS' : 'WARNING', `Controller status changed: ${nextStatus.toUpperCase()}`);
    if (!api.invoke || controller.type !== 'MODBUS_TCP') {
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
    setTagForm(prev => ({
      ...prev,
      controllerId: cId,
      regType: parent?.type === 'OPC_UA' ? 'NODE' : 'HOLDING_REGISTER'
    }));
  };

  const handleSaveTag = () => {
    if (!tagForm.name || !tagForm.address) {
      toast.error('Nama tag dan Alamat register wajib diisi.');
      return;
    }
    if (editingTag) {
      setTags(prev => prev.map(t => t.id === editingTag.id ? { ...t, ...tagForm } : t));
      addLog('INFO', `Tag '${tagForm.name}' updated.`);
      toast.success('Tag berhasil diperbarui.');
    } else {
      const newId = `tag_${Date.now()}`;
      setTags(prev => [...prev, { id: newId, ...tagForm }]);
      addLog('SUCCESS', `Mapped new tag '${tagForm.name}' on register ${tagForm.address}.`);
      toast.success('Tag baru berhasil dipetakan.');
    }
    setIsTagModalOpen(false);
  };

  const handleDeleteTag = (id, name) => {
    if (window.confirm(`Hapus pemetaan tag '${name}'?`)) {
      setTags(prev => prev.filter(t => t.id !== id));
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
        } else {
          const timeFactor = Date.now() / 10000;
          if (isCoil || isDiscIn) {
            val = Math.sin(timeFactor + i) > 0 ? 1 : 0;
          } else if (isInputReg) {
            val = Math.floor(150 + Math.sin(timeFactor + i) * 30 + Math.random() * 5);
          } else {
            val = Math.floor(60 + Math.cos(timeFactor + i) * 10);
          }
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

    if (api.invoke && activeCtrl && activeCtrl.status === 'connected' && activeCtrl.type === 'MODBUS_TCP') {
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

      addLog('WRITE', `[Modbus Simulation] Write Register ${baseAddr} -> SUCCESS (Value: ${parsed})`);
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

      setTags(prev => [...prev, ...importedTags]);
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
      <div style={{ display: 'flex', backgroundColor: '#111827', borderBottom: '1px solid #1f2937', padding: '0 24px', flexShrink: 0 }}>
        {[
          { id: 'overview', label: 'Overview & Diagnostics', icon: Activity },
          { id: 'controllers', label: 'PLC Controllers', icon: Server },
          { id: 'tags', label: 'Register Tag Mapping', icon: Key },
          { id: 'scanner', label: 'Live Register Grid', icon: Grid },
          { id: 'templates', label: 'Industrial Templates', icon: FileJson }
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
              position: 'relative'
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
                        <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: ctrl.type === 'OPC_UA' ? 'rgba(139, 92, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)', color: ctrl.type === 'OPC_UA' ? '#8b5cf6' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                        <span style={{ color: '#cbd5e1', fontWeight: 700 }}>{ctrl.type === 'OPC_UA' ? 'OPC UA' : 'Modbus TCP'}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Server Host/IP</span>
                        <span style={{ color: '#cbd5e1', fontFamily: 'monospace' }}>{ctrl.ip}</span>
                      </div>
                      {ctrl.type === 'MODBUS_TCP' ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Port & Unit ID</span>
                          <span style={{ color: '#cbd5e1' }}>Port {ctrl.port} / Slave #{ctrl.unitId}</span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Security Policy</span>
                          <span style={{ color: '#cbd5e1' }}>{ctrl.securityPolicy || 'None'}</span>
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
                    {controllers.filter(c => c.type === 'MODBUS_TCP').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    {controllers.filter(c => c.type === 'MODBUS_TCP').length === 0 && (
                      <option value="">No Modbus PLCs</option>
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
                    onChange={e => setCtrlForm({...ctrlForm, type: e.target.value, port: e.target.value === 'OPC_UA' ? 4840 : 502})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="MODBUS_TCP">Modbus TCP</option>
                    <option value="OPC_UA">OPC UA</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Host/IP Address</label>
                  <input
                    type="text"
                    value={ctrlForm.ip}
                    onChange={e => setCtrlForm({...ctrlForm, ip: e.target.value})}
                    placeholder="e.g. 192.168.1.15"
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {ctrlForm.type === 'MODBUS_TCP' ? (
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
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Security Policy</label>
                  <select
                    value={ctrlForm.securityPolicy}
                    onChange={e => setCtrlForm({...ctrlForm, securityPolicy: e.target.value})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    <option value="None">None</option>
                    <option value="Basic256Sha256">Basic256Sha256 (Sign & Encrypt)</option>
                    <option value="Basic256">Basic256 (Sign)</option>
                  </select>
                </div>
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
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe Register</label>
                  <select
                    value={tagForm.regType}
                    onChange={e => setTagForm({...tagForm, regType: e.target.value})}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #1f2937', backgroundColor: '#0f172a', color: 'white', fontSize: '0.85rem', boxSizing: 'border-box' }}
                  >
                    {controllers.find(c => c.id === tagForm.controllerId)?.type === 'OPC_UA' ? (
                      <option value="NODE">OPC UA Node</option>
                    ) : (
                      MODBUS_REG_TYPES.map(r => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    {tagForm.regType === 'NODE' ? 'Node ID' : 'Register Address'}
                  </label>
                  <input
                    type="text"
                    value={tagForm.address}
                    onChange={e => setTagForm({...tagForm, address: e.target.value})}
                    placeholder={tagForm.regType === 'NODE' ? 'ns=2;s=Device.TagName' : 'e.g. 40001'}
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

// Inline component replacement of lucide-react SlidersHorizontal if missing, though SlidersHorizontal is standard
function SlidersHorizontal({ size = 20, color = 'currentColor', className = '' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="2" y1="14" x2="6" y2="14" />
      <line x1="10" y1="8" x2="14" y2="8" />
      <line x1="18" y1="16" x2="22" y2="16" />
    </svg>
  );
}
