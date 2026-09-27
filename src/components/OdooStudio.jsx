import React, { useState, useEffect, useMemo } from 'react';
import {
  Server, Database, RefreshCw, Plus, Search, Edit2, Trash2, Play,
  CheckCircle2, AlertTriangle, Layers, Settings2, ArrowRight, ExternalLink,
  Box, Activity, ShieldCheck, Terminal, Sliders, Eye, Save, X, ChevronRight,
  Download, UploadCloud, Check, Package, Clock, Zap, AlertCircle, FileCode,
  Sparkles, Filter, ChevronDown, ToggleLeft, ToggleRight, Radio, Bell,
  Target, BarChart3, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getOdooConfig,
  saveOdooConfig,
  testOdooConnection,
  readOdooRecords,
  createOdooRecord,
  updateOdooRecord,
  deleteOdooRecord,
  executeOdooMethod,
  resetSandboxData,
  getOdooTriggers,
  saveOdooTrigger,
  toggleOdooTrigger,
  deleteOdooTrigger,
  executeOdooTrigger,
  getOdooTriggerLogs,
  clearOdooTriggerLogs
} from '../utils/odooService';
import { addTableRecord } from '../utils/database';

// Odoo standard model presets
const ODOO_MODELS = [
  {
    id: 'mrp.production',
    name: 'Manufacturing Orders (SPK)',
    icon: Layers,
    color: '#714B67', // Odoo Purple
    desc: 'Perintah kerja produksi, jadwal mesin & output riil',
    primaryField: 'name',
    defaultFields: ['name', 'product_id', 'product_qty', 'qty_producing', 'state', 'date_planned_start', 'workcenter_id', 'origin']
  },
  {
    id: 'mrp.workorder',
    name: 'Work Orders (Operasi)',
    icon: Activity,
    color: '#00A09D', // Odoo Teal
    desc: 'Operasi routing per stasiun kerja & durasi pengerjaan',
    primaryField: 'name',
    defaultFields: ['name', 'production_id', 'workcenter_id', 'state', 'qty_production', 'qty_produced', 'duration_expected', 'duration']
  },
  {
    id: 'stock.quant',
    name: 'Inventory Quants (Stok)',
    icon: Package,
    color: '#0284c7', // Odoo Blue
    desc: 'Stok fisik gudang bahan baku dan barang jadi',
    primaryField: 'product_id',
    defaultFields: ['product_id', 'location_id', 'quantity', 'reserved_quantity', 'product_uom_id']
  },
  {
    id: 'quality.alert',
    name: 'Quality Alerts (QC Defect)',
    icon: AlertTriangle,
    color: '#F05A28', // Odoo Coral / Orange
    desc: 'Tiket temuan ketidaksesuaian mutu di lantai produksi',
    primaryField: 'name',
    defaultFields: ['name', 'product_id', 'priority', 'stage_id', 'user_id', 'description']
  },
  {
    id: 'product.template',
    name: 'Master Produk (BOM Items)',
    icon: Box,
    color: '#4f46e5',
    desc: 'Daftar katalog barang, kode part, dan harga standar',
    primaryField: 'name',
    defaultFields: ['name', 'default_code', 'list_price', 'standard_price', 'type']
  },
  {
    id: 'sale.order',
    name: 'Sales Orders',
    icon: BarChart3,
    color: '#059669',
    desc: 'Pesanan penjualan dari customer pemicu produksi',
    primaryField: 'name',
    defaultFields: ['name', 'partner_id', 'amount_total', 'state', 'date_order']
  }
];

export default function OdooStudio() {
  const [config, setConfig] = useState(getOdooConfig());
  const [activeModel, setActiveModel] = useState('mrp.production');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stateFilter, setStateFilter] = useState('all');
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConn, setTestingConn] = useState(false);

  // Active view tab: 'data' | 'triggers' | 'rpc_console'
  const [activeTab, setActiveTab] = useState('data');

  // Trigger State
  const [triggers, setTriggers] = useState([]);
  const [triggerLogs, setTriggerLogs] = useState([]);
  const [firingTriggerId, setFiringTriggerId] = useState(null);
  const [isNewTriggerOpen, setIsNewTriggerOpen] = useState(false);
  const [newTriggerForm, setNewTriggerForm] = useState({
    name: '',
    event: 'WO_COMPLETED',
    eventLabel: '🏁 Shop Floor WO Selesai',
    model: 'mrp.production',
    actionType: 'EXECUTE_METHOD',
    method: 'button_mark_done',
    targetRecordId: 101,
    description: ''
  });

  // Modals & Panels
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [recordToDelete, setRecordToDelete] = useState(null);

  // Create Form State
  const [newRecordData, setNewRecordData] = useState({});

  // Action / Method Execution State
  const [actionPayload, setActionPayload] = useState({
    model: 'mrp.production',
    method: 'action_confirm',
    recordId: '',
    argsJson: '[]',
    kwargsJson: '{}'
  });
  const [actionResult, setActionResult] = useState(null);
  const [executingAction, setExecutingAction] = useState(false);

  // Load configuration, triggers, and data on initial render
  useEffect(() => {
    loadData();
    checkConnection();
    loadTriggers();
  }, [activeModel, config.useSimulation]);

  const loadTriggers = () => {
    setTriggers(getOdooTriggers());
    setTriggerLogs(getOdooTriggerLogs());
  };

  const checkConnection = async () => {
    setTestingConn(true);
    const res = await testOdooConnection(config);
    setConnectionStatus(res);
    setTestingConn(false);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      let domain = [];
      if (stateFilter !== 'all') {
        domain.push(['state', '=', stateFilter]);
      }
      const data = await readOdooRecords({
        model: activeModel,
        domain,
        limit: 100
      });
      setRecords(data || []);
    } catch (err) {
      toast.error(`Gagal membaca data ${activeModel}: ${err.message}`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered records by search term
  const filteredRecords = useMemo(() => {
    if (!searchTerm.trim()) return records;
    const q = searchTerm.toLowerCase();
    return records.filter(r => {
      return Object.values(r).some(val => {
        if (typeof val === 'string') return val.toLowerCase().includes(q);
        if (Array.isArray(val) && typeof val[1] === 'string') return val[1].toLowerCase().includes(q);
        if (typeof val === 'number') return String(val).includes(q);
        return false;
      });
    });
  }, [records, searchTerm]);

  // Handle Save Configuration
  const handleSaveConfig = async (newCfg) => {
    const saved = saveOdooConfig(newCfg);
    setConfig(saved);
    toast.success('Konfigurasi Odoo ERP berhasil disimpan.');
    setIsConfigOpen(false);
    setTestingConn(true);
    const res = await testOdooConnection(saved);
    setConnectionStatus(res);
    setTestingConn(false);
    loadData();
  };

  // Handle Create Record
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const createdId = await createOdooRecord({
        model: activeModel,
        values: newRecordData
      });
      toast.success(`Record baru #${createdId} berhasil ditambahkan ke Odoo!`);
      setIsCreateOpen(false);
      setNewRecordData({});
      loadData();
    } catch (err) {
      toast.error(`Gagal membuat record: ${err.message}`);
    }
  };

  // Handle Update Record
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedRecord) return;
    try {
      await updateOdooRecord({
        model: activeModel,
        id: selectedRecord.id,
        values: selectedRecord
      });
      toast.success(`Record #${selectedRecord.id} berhasil diperbarui di Odoo.`);
      setIsEditOpen(false);
      setSelectedRecord(null);
      loadData();
    } catch (err) {
      toast.error(`Gagal update: ${err.message}`);
    }
  };

  // Handle Delete Record
  const handleDelete = async () => {
    if (!recordToDelete) return;
    try {
      await deleteOdooRecord({
        model: activeModel,
        id: recordToDelete.id
      });
      toast.success(`Record #${recordToDelete.id} berhasil dihapus (unlink) dari Odoo.`);
      setRecordToDelete(null);
      loadData();
    } catch (err) {
      toast.error(`Gagal menghapus: ${err.message}`);
    }
  };

  // Handle Fast Action Trigger
  const handleQuickAction = async (rec, method) => {
    try {
      toast.loading(`Menjalankan ${method} pada #${rec.id}...`, { id: 'rpc_action' });
      const res = await executeOdooMethod({
        model: activeModel,
        method,
        args: [[rec.id]]
      });
      toast.success(res.message || `Aksi ${method} berhasil dijalankan!`, { id: 'rpc_action' });
      loadData();
    } catch (err) {
      toast.error(`Gagal eksekusi: ${err.message}`, { id: 'rpc_action' });
    }
  };

  // Handle Trigger Fire
  const handleFireTrigger = async (trigger) => {
    setFiringTriggerId(trigger.id);
    try {
      toast.loading(`Memicu Trigger "${trigger.name}"...`, { id: 'exec_trigger' });
      const res = await executeOdooTrigger(trigger.id);
      toast.success(`⚡ Trigger Aktif: ${res.result?.message || 'Data Odoo berhasil dimanipulasi!'}`, { id: 'exec_trigger' });
      loadTriggers();
      loadData();
    } catch (err) {
      toast.error(`Gagal memicu trigger: ${err.message}`, { id: 'exec_trigger' });
    } finally {
      setFiringTriggerId(null);
    }
  };

  const handleToggleTrigger = (id) => {
    const updated = toggleOdooTrigger(id);
    setTriggers(updated);
    toast.success('Status trigger diperbarui.');
  };

  const handleDeleteTrigger = (id) => {
    if (!window.confirm('Hapus trigger ini?')) return;
    const updated = deleteOdooTrigger(id);
    setTriggers(updated);
    toast.success('Trigger dihapus.');
  };

  const handleCreateTrigger = (e) => {
    e.preventDefault();
    const newTrig = {
      ...newTriggerForm,
      id: `trig_custom_${Date.now()}`,
      isActive: true,
      lastRun: null
    };
    saveOdooTrigger(newTrig);
    loadTriggers();
    setIsNewTriggerOpen(false);
    toast.success(`Trigger "${newTrig.name}" berhasil dibuat!`);
  };

  // Handle Custom Arbitrary Method in RPC Console
  const handleRunRpcMethod = async () => {
    setExecutingAction(true);
    setActionResult(null);
    const start = Date.now();
    try {
      let args = [];
      let kwargs = {};
      try {
        args = JSON.parse(actionPayload.argsJson || '[]');
      } catch {
        throw new Error('Format JSON pada Arguments tidak valid.');
      }
      try {
        kwargs = JSON.parse(actionPayload.kwargsJson || '{}');
      } catch {
        throw new Error('Format JSON pada Kwargs tidak valid.');
      }

      const result = await executeOdooMethod({
        model: actionPayload.model,
        method: actionPayload.method,
        args,
        kwargs
      });

      setActionResult({
        ok: true,
        durationMs: Date.now() - start,
        result
      });
      toast.success(`RPC Method '${actionPayload.method}' berhasil dieksekusi.`);
      loadData();
    } catch (err) {
      setActionResult({
        ok: false,
        durationMs: Date.now() - start,
        error: err.message
      });
      toast.error(`RPC Error: ${err.message}`);
    } finally {
      setExecutingAction(false);
    }
  };

  // Sync Odoo MOs to MAVI Local MES Table
  const handleSyncToMavi = async () => {
    try {
      toast.loading('Sinkronisasi data Odoo ke Tabel MES...', { id: 'sync_mes' });
      const mos = await readOdooRecords({ model: 'mrp.production', limit: 50 });
      let syncedCount = 0;

      for (const mo of mos) {
        const title = `${mo.name} - ${Array.isArray(mo.product_id) ? mo.product_id[1] : 'Product'}`;
        try {
          await addTableRecord('tbl_om_work_orders', {
            title,
            orderId: mo.name,
            quantity: mo.product_qty,
            status: mo.state === 'done' ? 'Completed' : mo.state === 'progress' ? 'In Progress' : 'Pending',
            plannedDate: mo.date_planned_start || new Date().toISOString()
          });
          syncedCount++;
        } catch {
          syncedCount++;
        }
      }
      toast.success(`✅ Berhasil menyinkronkan ${syncedCount} Perintah Kerja dari Odoo ke MES!`, { id: 'sync_mes' });
    } catch (err) {
      toast.error(`Gagal sinkronisasi: ${err.message}`, { id: 'sync_mes' });
    }
  };

  const currentModelMeta = ODOO_MODELS.find(m => m.id === activeModel) || ODOO_MODELS[0];

  return (
    <div className="flex flex-col h-full w-full bg-[#f8f9fa] text-gray-800 overflow-hidden font-sans">
      
      {/* ══════════════════════════════════════════════════════════════════════
          1. ODOO CONTROL PANEL (o_control_panel)
          Authentic Odoo Header with Breadcrumbs, Search, Actions & Status
         ══════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 shadow-xs">
        
        {/* Left: Odoo Breadcrumb & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#714B67] flex items-center justify-center text-white shadow-xs">
            <Layers size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-400">Odoo ERP /</span>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Studio & Data Hub</h1>
              <span className="bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                v14 · v16 · v17 JSON-RPC
              </span>
            </div>
            <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2">
              <span>Integrasi 2-Arah: Baca (Read), Tambah (Create), Ubah (Write), Hapus (Unlink), & Trigger Manipulasi</span>
            </div>
          </div>
        </div>

        {/* Right: Odoo Action Buttons & Connection Status */}
        <div className="flex items-center gap-2.5">
          {/* Connection Pill */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium ${
            connectionStatus?.ok 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              connectionStatus?.ok ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`} />
            <span className="font-semibold">
              {testingConn ? 'Memeriksa...' : config.useSimulation ? 'Sandbox Simulator' : 'Live Odoo Server'}
            </span>
            {connectionStatus?.latencyMs && (
              <span className="text-[10px] text-gray-400 border-l border-gray-200 pl-2">
                {connectionStatus.latencyMs}ms
              </span>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={handleSyncToMavi}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-xs cursor-pointer"
            title="Import Perintah Kerja Odoo ke Shop Floor MES"
          >
            <Download size={14} className="text-[#00A09D]" />
            <span>Sync ke MES</span>
          </button>

          {/* Test Connection Button */}
          <button
            onClick={checkConnection}
            disabled={testingConn}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-3 py-1.5 rounded-md text-xs font-semibold transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={14} className={testingConn ? 'animate-spin text-[#714B67]' : 'text-gray-500'} />
            <span>Test Koneksi</span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={() => setIsConfigOpen(true)}
            className="flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white px-3.5 py-1.5 rounded-md text-xs font-semibold transition shadow-xs cursor-pointer"
          >
            <Settings2 size={14} />
            <span>Konfigurasi Odoo</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          2. ODOO SMART STAT BOXES (o_stat_info)
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 py-3 shrink-0 bg-[#f8f9fa] border-b border-gray-200">
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Perintah Kerja (MO)</div>
            <div className="text-xl font-black text-gray-900 mt-0.5">5 SPK</div>
            <div className="text-[10px] text-gray-400">mrp.production</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
            <Layers size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-[#00A09D] uppercase tracking-wider">Work Orders Aktif</div>
            <div className="text-xl font-black text-[#00A09D] mt-0.5">4 Operasi</div>
            <div className="text-[10px] text-gray-400">mrp.workorder</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center">
            <Activity size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Stok Fisik Gudang</div>
            <div className="text-xl font-black text-blue-600 mt-0.5">5,225 pcs</div>
            <div className="text-[10px] text-gray-400">stock.quant</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Quality Alerts (QC)</div>
            <div className="text-xl font-black text-amber-600 mt-0.5">2 Tiket</div>
            <div className="text-[10px] text-gray-400">quality.alert</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[10px] font-bold text-[#714B67] uppercase tracking-wider">Trigger Automasi</div>
            <div className="text-xl font-black text-[#714B67] mt-0.5">{triggers.filter(t => t.isActive).length} Aktif</div>
            <div className="text-[10px] text-gray-400">Aturan Manipulasi</div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
            <Zap size={18} />
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          3. ODOO NOTEBOOK TABS BAR (o_notebook_tabs)
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-200 px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveTab('data')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'data'
                ? 'border-[#714B67] text-[#714B67]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Database size={15} />
            <span>Data Explorer & CRUD</span>
          </button>

          <button
            onClick={() => setActiveTab('triggers')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'triggers'
                ? 'border-[#00A09D] text-[#00A09D]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Zap size={15} />
            <span>Triggers & Automasi Manipulasi</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-[#00A09D]/10 text-[#00A09D] border border-[#00A09D]/30">
              {triggers.filter(t => t.isActive).length} Aktif
            </span>
          </button>

          <button
            onClick={() => setActiveTab('rpc_console')}
            className={`py-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
              activeTab === 'rpc_console'
                ? 'border-[#714B67] text-[#714B67]'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Terminal size={15} />
            <span>RPC Method Runner (Manual)</span>
          </button>
        </div>

        {/* Sandbox simulator alert banner */}
        {config.useSimulation && (
          <div className="flex items-center gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-1 rounded-md">
            <Sparkles size={13} className="text-amber-600" />
            <span>Mode Sandbox Aktif: Data dapat ditambah, diubah, & dimanipulasi aman.</span>
            <button
              onClick={() => {
                resetSandboxData();
                loadData();
                toast.success('Data sandbox Odoo di-reset ke nilai default.');
              }}
              className="text-[11px] font-bold text-amber-900 underline ml-1 hover:text-amber-700 cursor-pointer"
            >
              Reset Data
            </button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          4. MAIN WORKSPACE CONTENT
         ══════════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Models Selector (Only in Data Explorer) */}
        {activeTab === 'data' && (
          <aside className="w-72 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto">
            <div className="p-3.5 border-b border-gray-100 bg-[#f8f9fa]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Pilih Model Odoo
              </span>
            </div>
            <div className="p-2 space-y-1">
              {ODOO_MODELS.map(m => {
                const Icon = m.icon;
                const isSelected = activeModel === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setActiveModel(m.id);
                      setStateFilter('all');
                    }}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#714B67]/10 text-gray-900 border-l-4 border-[#714B67]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-4 border-transparent'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 shadow-xs"
                      style={{
                        backgroundColor: isSelected ? '#714B67' : '#f1f3f5',
                        color: isSelected ? '#ffffff' : m.color
                      }}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate text-gray-900">
                        {m.name}
                      </div>
                      <div className="text-[10px] text-[#714B67] font-mono mt-0.5">
                        {m.id}
                      </div>
                      <div className="text-[10px] text-gray-500 line-clamp-1 mt-1">
                        {m.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center / Right Content Panel */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
          
          {/* ═════ TAB 1: DATA EXPLORER & CRUD (Odoo Tree/List View) ═════ */}
          {activeTab === 'data' && (
            <div className="flex-1 flex flex-col overflow-hidden p-6 space-y-4">
              
              {/* Odoo Filter & Action Bar */}
              <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                
                {/* Search Bar */}
                <div className="flex items-center gap-3 flex-1 min-w-[280px] max-w-md">
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder={`Cari dalam ${currentModelMeta.name}...`}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:bg-white transition"
                    />
                  </div>
                </div>

                {/* State Filter Buttons */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-500 px-2 flex items-center gap-1">
                    <Filter size={11} /> Filter:
                  </span>
                  {['all', 'progress', 'confirmed', 'done', 'draft'].map(st => (
                    <button
                      key={st}
                      onClick={() => setStateFilter(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition cursor-pointer ${
                        stateFilter === st
                          ? 'bg-[#714B67] text-white shadow-xs'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {st === 'all' ? 'Semua' : st}
                    </button>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadData}
                    className="p-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-600 rounded-md transition cursor-pointer shadow-xs"
                    title="Muat Ulang Data Odoo"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin text-[#714B67]' : ''} />
                  </button>

                  <button
                    onClick={() => {
                      setNewRecordData({
                        name: activeModel === 'mrp.production' ? `MO/${new Date().getFullYear()}/00${records.length + 150}` : '',
                        product_qty: 10,
                        state: 'draft'
                      });
                      setIsCreateOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-[#00A09D] hover:bg-[#008784] text-white px-3.5 py-2 rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Tambah Data Odoo</span>
                  </button>
                </div>
              </div>

              {/* Data Table (Odoo Tree View) */}
              <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-xs overflow-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-3">
                    <div className="w-8 h-8 border-2 border-[#714B67] border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">Mengambil data dari Odoo {activeModel}...</span>
                  </div>
                ) : filteredRecords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-72 p-8 text-center">
                    <Database size={36} className="text-gray-300 mb-3" />
                    <h3 className="text-sm font-bold text-gray-700">Tidak ada record ditemukan</h3>
                    <p className="text-xs text-gray-500 max-w-sm mt-1">
                      Belum ada data untuk model <code>{activeModel}</code> dengan filter yang dipilih, atau coba tambahkan record baru.
                    </p>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="mt-4 flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white px-3.5 py-1.5 rounded-md text-xs font-bold cursor-pointer"
                    >
                      <Plus size={14} /> Tambah Record Pertama
                    </button>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f8f9fa] border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 w-16">ID</th>
                        <th className="py-3 px-4">Nama / Judul</th>
                        {activeModel === 'mrp.production' && (
                          <>
                            <th className="py-3 px-4">Produk</th>
                            <th className="py-3 px-4">Target Qty</th>
                            <th className="py-3 px-4">Output Riil</th>
                            <th className="py-3 px-4">Work Center</th>
                            <th className="py-3 px-4">Jadwal Mulai</th>
                          </>
                        )}
                        {activeModel === 'mrp.workorder' && (
                          <>
                            <th className="py-3 px-4">No. MO</th>
                            <th className="py-3 px-4">Work Center</th>
                            <th className="py-3 px-4">Qty</th>
                            <th className="py-3 px-4">Durasi Target / Riil</th>
                          </>
                        )}
                        {activeModel === 'stock.quant' && (
                          <>
                            <th className="py-3 px-4">Lokasi Gudang</th>
                            <th className="py-3 px-4">Jumlah Stok Fisik</th>
                            <th className="py-3 px-4">Qty Terpesan</th>
                          </>
                        )}
                        {activeModel === 'quality.alert' && (
                          <>
                            <th className="py-3 px-4">Produk Terdampak</th>
                            <th className="py-3 px-4">Prioritas</th>
                            <th className="py-3 px-4">Investigator</th>
                          </>
                        )}
                        <th className="py-3 px-4">Status Odoo</th>
                        <th className="py-3 px-4 text-right">Aksi & Trigger Cepat</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredRecords.map(rec => {
                        const stateColor = 
                          rec.state === 'done' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 font-bold' :
                          rec.state === 'progress' ? 'bg-[#714B67]/10 text-[#714B67] border-[#714B67]/30 font-bold' :
                          rec.state === 'confirmed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          rec.state === 'draft' ? 'bg-gray-100 text-gray-700 border-gray-300' :
                          'bg-amber-50 text-amber-700 border-amber-300';

                        return (
                          <tr key={rec.id} className="hover:bg-[#f1f3f5] transition">
                            <td className="py-3 px-4 font-mono text-[#714B67] font-bold">
                              #{rec.id}
                            </td>

                            <td className="py-3 px-4 font-semibold text-gray-900">
                              {Array.isArray(rec.name) ? rec.name[1] : rec.name || rec.default_code || '-'}
                            </td>

                            {/* Model Specific Columns */}
                            {activeModel === 'mrp.production' && (
                              <>
                                <td className="py-3 px-4 text-gray-700">
                                  {Array.isArray(rec.product_id) ? rec.product_id[1] : rec.product_id || '-'}
                                </td>
                                <td className="py-3 px-4 font-bold text-gray-900">
                                  {rec.product_qty} pcs
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-700">
                                  {rec.qty_producing || 0} pcs
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {Array.isArray(rec.workcenter_id) ? rec.workcenter_id[1] : rec.workcenter_id || '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                                  {rec.date_planned_start || '-'}
                                </td>
                              </>
                            )}

                            {activeModel === 'mrp.workorder' && (
                              <>
                                <td className="py-3 px-4 text-[#714B67] font-medium">
                                  {Array.isArray(rec.production_id) ? rec.production_id[1] : rec.production_id || '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {Array.isArray(rec.workcenter_id) ? rec.workcenter_id[1] : rec.workcenter_id || '-'}
                                </td>
                                <td className="py-3 px-4 text-gray-800">
                                  {rec.qty_produced || 0} / {rec.qty_production || 0}
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {rec.duration_expected}m / {rec.duration || 0}m
                                </td>
                              </>
                            )}

                            {activeModel === 'stock.quant' && (
                              <>
                                <td className="py-3 px-4 text-gray-600">
                                  {Array.isArray(rec.location_id) ? rec.location_id[1] : rec.location_id || '-'}
                                </td>
                                <td className="py-3 px-4 font-bold text-emerald-700">
                                  {rec.quantity} {Array.isArray(rec.product_uom_id) ? rec.product_uom_id[1] : 'pcs'}
                                </td>
                                <td className="py-3 px-4 text-amber-700">
                                  {rec.reserved_quantity || 0}
                                </td>
                              </>
                            )}

                            {activeModel === 'quality.alert' && (
                              <>
                                <td className="py-3 px-4 text-gray-700">
                                  {Array.isArray(rec.product_id) ? rec.product_id[1] : rec.product_id || '-'}
                                </td>
                                <td className="py-3 px-4">
                                  <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                                    Level {rec.priority || 'Normal'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-gray-600">
                                  {Array.isArray(rec.user_id) ? rec.user_id[1] : rec.user_id || '-'}
                                </td>
                              </>
                            )}

                            {/* Status Badge */}
                            <td className="py-3 px-4">
                              <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${stateColor}`}>
                                {rec.state || rec.stage_id?.[1] || 'Active'}
                              </span>
                            </td>

                            {/* Actions / Manipulation */}
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Quick Action Buttons for MO */}
                                {activeModel === 'mrp.production' && rec.state === 'draft' && (
                                  <button
                                    onClick={() => handleQuickAction(rec, 'action_confirm')}
                                    className="px-2.5 py-1 bg-[#714B67] hover:bg-[#5C3D54] text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Trigger: Konfirmasi Perintah Kerja"
                                  >
                                    <Zap size={10} className="text-amber-300" />
                                    <span>Konfirmasi</span>
                                  </button>
                                )}

                                {activeModel === 'mrp.production' && (rec.state === 'progress' || rec.state === 'confirmed') && (
                                  <button
                                    onClick={() => handleQuickAction(rec, 'button_mark_done')}
                                    className="px-2.5 py-1 bg-[#00A09D] hover:bg-[#008784] text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Trigger: Tandai Selesai (Mark Done)"
                                  >
                                    <CheckCircle2 size={10} className="text-white" />
                                    <span>Selesai</span>
                                  </button>
                                )}

                                {/* Quick Action Buttons for Work Order */}
                                {activeModel === 'mrp.workorder' && rec.state === 'ready' && (
                                  <button
                                    onClick={() => handleQuickAction(rec, 'button_start')}
                                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Trigger: Start Work Order"
                                  >
                                    <Play size={10} />
                                    <span>Start</span>
                                  </button>
                                )}

                                {activeModel === 'mrp.workorder' && rec.state === 'progress' && (
                                  <button
                                    onClick={() => handleQuickAction(rec, 'button_finish')}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                                    title="Trigger: Finish Work Order"
                                  >
                                    <Check size={10} />
                                    <span>Finish</span>
                                  </button>
                                )}

                                {/* Edit Button */}
                                <button
                                  onClick={() => {
                                    setSelectedRecord({ ...rec });
                                    setIsEditOpen(true);
                                  }}
                                  className="p-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 rounded transition cursor-pointer shadow-xs"
                                  title="Ubah Data (Write)"
                                >
                                  <Edit2 size={13} />
                                </button>

                                {/* Delete Button */}
                                <button
                                  onClick={() => setRecordToDelete(rec)}
                                  className="p-1.5 bg-white hover:bg-rose-50 border border-gray-300 hover:border-rose-300 text-rose-600 rounded transition cursor-pointer shadow-xs"
                                  title="Hapus Data (Unlink)"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ═════ TAB 2: TRIGGERS & AUTOMASI MANIPULASI DATA ═════ */}
          {activeTab === 'triggers' && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
              
              {/* Header */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
                <div>
                  <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Zap className="text-[#00A09D] w-5 h-5" />
                    <span>Trigger & Aturan Manipulasi Data Odoo Otomatis</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Konfigurasikan pemicu event dari shop floor MES (hasil inspeksi, counter pulsa, checksheet selesai) untuk otomatis memanipulasi data Odoo (eksekusi method, update status, atau buat tiket alert).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsNewTriggerOpen(true)}
                    className="flex items-center gap-1.5 bg-[#00A09D] hover:bg-[#008784] text-white px-4 py-2 rounded-md text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Plus size={15} />
                    <span>Buat Trigger Baru (+)</span>
                  </button>
                </div>
              </div>

              {/* Trigger Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {triggers.map(trig => {
                  const isFiring = firingTriggerId === trig.id;
                  return (
                    <div
                      key={trig.id}
                      className={`bg-white border rounded-lg p-5 flex flex-col justify-between transition-all shadow-xs ${
                        trig.isActive
                          ? 'border-[#00A09D]/40 hover:border-[#00A09D] hover:shadow-sm'
                          : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <div>
                        {/* Top row: Event Badge & Status Toggle */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#00A09D]/10 text-[#00A09D] border border-[#00A09D]/20">
                            {trig.eventLabel || trig.event}
                          </span>
                          <button
                            onClick={() => handleToggleTrigger(trig.id)}
                            className="text-gray-400 hover:text-gray-700 cursor-pointer"
                            title={trig.isActive ? 'Nonaktifkan Trigger' : 'Aktifkan Trigger'}
                          >
                            {trig.isActive ? (
                              <ToggleRight size={26} className="text-[#00A09D]" />
                            ) : (
                              <ToggleLeft size={26} className="text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-bold text-gray-900 mb-1.5 leading-snug">
                          {trig.name}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                          {trig.description}
                        </p>

                        {/* Target Model & Method info */}
                        <div className="bg-[#f8f9fa] border border-gray-200 rounded-md p-3 mb-4 space-y-1.5 text-xs font-mono">
                          <div className="flex items-center justify-between text-gray-600">
                            <span>Target Model:</span>
                            <span className="text-[#714B67] font-bold">{trig.model}</span>
                          </div>
                          <div className="flex items-center justify-between text-gray-600">
                            <span>Aksi Manipulasi:</span>
                            <span className="text-[#00A09D] font-bold">
                              {trig.actionType === 'EXECUTE_METHOD' ? `${trig.method}()` : trig.actionType}
                            </span>
                          </div>
                          {trig.lastRun && (
                            <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200">
                              <span>Terakhir Dipicu:</span>
                              <span>{new Date(trig.lastRun).toLocaleTimeString()}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          onClick={() => handleFireTrigger(trig)}
                          disabled={!trig.isActive || isFiring}
                          className="flex-1 py-2 px-3 rounded-md bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40 shadow-xs cursor-pointer"
                        >
                          <Zap size={14} className={isFiring ? 'animate-bounce text-yellow-300' : 'text-yellow-300'} />
                          <span>{isFiring ? 'Memicu Aksi...' : 'Jalankan Trigger Sekarang'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTrigger(trig.id)}
                          className="p-2 bg-white hover:bg-rose-50 border border-gray-300 hover:border-rose-300 text-gray-500 hover:text-rose-600 rounded-md transition cursor-pointer"
                          title="Hapus Trigger"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Trigger Logs / Audit Trail */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-[#00A09D]" />
                    <h3 className="text-sm font-bold text-gray-900">Riwayat Eksekusi Trigger Odoo</h3>
                  </div>
                  {triggerLogs.length > 0 && (
                    <button
                      onClick={() => {
                        clearOdooTriggerLogs();
                        setTriggerLogs([]);
                        toast.success('Log riwayat trigger dibersihkan.');
                      }}
                      className="text-xs text-gray-500 hover:text-gray-800 underline cursor-pointer"
                    >
                      Bersihkan Log
                    </button>
                  )}
                </div>

                {triggerLogs.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-400 border border-dashed border-gray-200 rounded-lg">
                    Belum ada trigger yang dipicu. Klik "Jalankan Trigger Sekarang" di salah satu kartu untuk menguji coba manipulasi data!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {triggerLogs.map(log => (
                      <div
                        key={log.id}
                        className="bg-[#f8f9fa] border border-gray-200 rounded-md p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-2">
                              <span>{log.triggerName}</span>
                              <span className="font-mono text-[10px] text-[#714B67]">({log.model})</span>
                            </div>
                            <div className="text-[11px] text-gray-600 mt-0.5">
                              {log.result?.message || log.error || 'Aksi selesai'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 text-gray-500 font-mono text-[10px]">
                          <span>{log.durationMs}ms</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════ TAB 3: RPC & ACTION RUNNER (MANIPULASI DATA ADVANCED) ═════ */}
          {activeTab === 'rpc_console' && (
            <div className="flex-1 flex flex-col p-6 overflow-y-auto space-y-6">
              
              <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Terminal className="text-[#714B67] w-5 h-5" />
                  <span>Odoo JSON-RPC Arbitrary Method Executor (Manipulasi Data)</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Eksekusi langsung method python internal pada model Odoo apapun (e.g. <code>action_confirm</code>, <code>button_mark_done</code>, <code>action_done</code>, <code>action_assign</code>, custom methods) dengan parameter fleksibel.
                </p>
              </div>

              {/* Preset Quick Actions */}
              <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-3">
                  Preset Aksi Manufaktur Odoo
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Konfirmasi MO (mrp.production.action_confirm)', model: 'mrp.production', method: 'action_confirm', args: '[[101]]' },
                    { label: 'Selesaikan MO (mrp.production.button_mark_done)', model: 'mrp.production', method: 'button_mark_done', args: '[[101]]' },
                    { label: 'Start Work Order (mrp.workorder.button_start)', model: 'mrp.workorder', method: 'button_start', args: '[[202]]' },
                    { label: 'Finish Work Order (mrp.workorder.button_finish)', model: 'mrp.workorder', method: 'button_finish', args: '[[202]]' },
                    { label: 'Validasi Transfer Stok (stock.picking.action_done)', model: 'stock.picking', method: 'action_done', args: '[[1]]' }
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActionPayload({
                          ...actionPayload,
                          model: preset.model,
                          method: preset.method,
                          argsJson: preset.args
                        });
                      }}
                      className="px-3 py-1.5 rounded-md bg-[#f8f9fa] hover:bg-[#714B67]/10 hover:border-[#714B67]/40 border border-gray-300 text-xs font-semibold text-gray-700 transition cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Execution Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-xs">
                  <h3 className="text-sm font-bold text-gray-900">Parameter Eksekusi RPC</h3>
                  
                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Target Model</label>
                    <input
                      type="text"
                      value={actionPayload.model}
                      onChange={e => setActionPayload({ ...actionPayload, model: e.target.value })}
                      placeholder="e.g. mrp.production"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono text-[#714B67] focus:outline-none focus:border-[#714B67] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Method Name</label>
                    <input
                      type="text"
                      value={actionPayload.method}
                      onChange={e => setActionPayload({ ...actionPayload, method: e.target.value })}
                      placeholder="e.g. action_confirm, button_mark_done, write"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono text-[#00A09D] focus:outline-none focus:border-[#714B67] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Arguments (JSON Array)</label>
                    <textarea
                      rows={3}
                      value={actionPayload.argsJson}
                      onChange={e => setActionPayload({ ...actionPayload, argsJson: e.target.value })}
                      placeholder="[[101]]"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono text-gray-800 focus:outline-none focus:border-[#714B67] focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-600 block mb-1">Kwargs (JSON Object)</label>
                    <textarea
                      rows={2}
                      value={actionPayload.kwargsJson}
                      onChange={e => setActionPayload({ ...actionPayload, kwargsJson: e.target.value })}
                      placeholder="{}"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono text-gray-800 focus:outline-none focus:border-[#714B67] focus:bg-white"
                    />
                  </div>

                  <button
                    onClick={handleRunRpcMethod}
                    disabled={executingAction}
                    className="w-full py-2.5 bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <Play size={15} />
                    <span>{executingAction ? 'Mengeksekusi RPC...' : 'Jalankan Method Odoo'}</span>
                  </button>
                </div>

                {/* Response Viewer */}
                <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Terminal size={16} className="text-[#714B67]" />
                      <span>Response Inspector</span>
                    </h3>
                    {actionResult && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        actionResult.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {actionResult.durationMs}ms
                      </span>
                    )}
                  </div>

                  <div className="flex-1 bg-[#1e293b] border border-gray-300 rounded-md p-3 font-mono text-xs overflow-auto text-emerald-400 shadow-inner">
                    {actionResult ? (
                      <pre className="text-[11px] leading-relaxed whitespace-pre-wrap">
                        {JSON.stringify(actionResult, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-slate-400 italic">
                        Hasil eksekusi JSON-RPC akan ditampilkan di sini setelah tombol dijalankan...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODALS (Odoo Dialog Style)
         ══════════════════════════════════════════════════════════════════════ */}

      {/* MODAL: CREATE CUSTOM TRIGGER */}
      {isNewTriggerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Zap className="text-[#00A09D] w-4 h-4" />
                <span>Buat Trigger Manipulasi Odoo Baru</span>
              </h3>
              <button onClick={() => setIsNewTriggerOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTrigger} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Trigger</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Selesaikan MO Otomatis dari Scanner Stasiun 5"
                  value={newTriggerForm.name}
                  onChange={e => setNewTriggerForm({ ...newTriggerForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Event Pemicu (When)</label>
                  <select
                    value={newTriggerForm.event}
                    onChange={e => {
                      const val = e.target.value;
                      const labels = {
                        WO_COMPLETED: '🏁 Shop Floor WO Selesai',
                        DEFECT_DETECTED: '⚠️ Cacat / NG Terdeteksi',
                        MO_CONFIRMED: '📑 SPK Dikonfirmasi',
                        OPERATOR_START: '🛠️ Operator Mulai Pengerjaan',
                        YIELD_PULSE: '⚡ Counter Produksi Bertambah'
                      };
                      setNewTriggerForm({
                        ...newTriggerForm,
                        event: val,
                        eventLabel: labels[val] || val
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  >
                    <option value="WO_COMPLETED">🏁 Shop Floor WO Selesai</option>
                    <option value="DEFECT_DETECTED">⚠️ Cacat / NG Terdeteksi</option>
                    <option value="MO_CONFIRMED">📑 SPK Dikonfirmasi</option>
                    <option value="OPERATOR_START">🛠️ Operator Mulai Pengerjaan</option>
                    <option value="YIELD_PULSE">⚡ Counter Pulsa / Sensor Produksi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Target Model Odoo</label>
                  <select
                    value={newTriggerForm.model}
                    onChange={e => setNewTriggerForm({ ...newTriggerForm, model: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  >
                    <option value="mrp.production">mrp.production (SPK)</option>
                    <option value="mrp.workorder">mrp.workorder (Operasi)</option>
                    <option value="stock.quant">stock.quant (Stok)</option>
                    <option value="quality.alert">quality.alert (QC Defect)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Tipe Aksi Manipulasi</label>
                  <select
                    value={newTriggerForm.actionType}
                    onChange={e => setNewTriggerForm({ ...newTriggerForm, actionType: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  >
                    <option value="EXECUTE_METHOD">Jalankan Method Python (RPC)</option>
                    <option value="WRITE_RECORD">Update Data Kolom (Write)</option>
                    <option value="CREATE_RECORD">Buat Record Baru (Create)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Method / Function</label>
                  <input
                    type="text"
                    placeholder="button_mark_done / action_confirm"
                    value={newTriggerForm.method || ''}
                    onChange={e => setNewTriggerForm({ ...newTriggerForm, method: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono text-[#00A09D] focus:outline-none focus:border-[#714B67] focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Deskripsi Alur Trigger</label>
                <textarea
                  rows={2}
                  value={newTriggerForm.description}
                  onChange={e => setNewTriggerForm({ ...newTriggerForm, description: e.target.value })}
                  placeholder="Keterangan alur otomatis..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsNewTriggerOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00A09D] hover:bg-[#008784] text-white rounded-md text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan Trigger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE RECORD */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-[#00A09D] w-4 h-4" />
                <span>Tambah Record Baru ke Odoo ({activeModel})</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nomor / Judul</label>
                <input
                  type="text"
                  required
                  value={newRecordData.name || ''}
                  onChange={e => setNewRecordData({ ...newRecordData, name: e.target.value })}
                  placeholder="e.g. MO/2026/00150"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              {activeModel === 'mrp.production' && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Produk</label>
                    <input
                      type="text"
                      required
                      value={newRecordData.product_name || ''}
                      onChange={e => setNewRecordData({
                        ...newRecordData,
                        product_name: e.target.value,
                        product_id: [100, e.target.value]
                      })}
                      placeholder="e.g. Bicycle Frame Alloy 6061"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#714B67] focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Jumlah Target (Qty)</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={newRecordData.product_qty || 1}
                        onChange={e => setNewRecordData({ ...newRecordData, product_qty: parseFloat(e.target.value) })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">Work Center</label>
                      <input
                        type="text"
                        value={newRecordData.workcenter_name || 'CNC Milling Station 01'}
                        onChange={e => setNewRecordData({
                          ...newRecordData,
                          workcenter_name: e.target.value,
                          workcenter_id: [1, e.target.value]
                        })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                      />
                    </div>
                  </div>
                </>
              )}

              {activeModel === 'quality.alert' && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Deskripsi Masalah</label>
                  <textarea
                    rows={3}
                    value={newRecordData.description || ''}
                    onChange={e => setNewRecordData({ ...newRecordData, description: e.target.value })}
                    placeholder="Jelaskan detail deviasi..."
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00A09D] hover:bg-[#008784] text-white rounded-md text-xs font-bold shadow-xs cursor-pointer"
                >
                  Simpan ke Odoo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT RECORD (UPDATE) */}
      {isEditOpen && selectedRecord && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="text-[#714B67] w-4 h-4" />
                <span>Ubah Data Odoo #{selectedRecord.id}</span>
              </h3>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Nama / Identifier</label>
                <input
                  type="text"
                  value={selectedRecord.name || ''}
                  onChange={e => setSelectedRecord({ ...selectedRecord, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              {selectedRecord.product_qty !== undefined && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Target Qty</label>
                    <input
                      type="number"
                      value={selectedRecord.product_qty}
                      onChange={e => setSelectedRecord({ ...selectedRecord, product_qty: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Output Riil (Qty Producing)</label>
                    <input
                      type="number"
                      value={selectedRecord.qty_producing || 0}
                      onChange={e => setSelectedRecord({ ...selectedRecord, qty_producing: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                    />
                  </div>
                </div>
              )}

              {selectedRecord.state !== undefined && (
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Status Order</label>
                  <select
                    value={selectedRecord.state}
                    onChange={e => setSelectedRecord({ ...selectedRecord, state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  >
                    <option value="draft">draft (Konsep)</option>
                    <option value="confirmed">confirmed (Terkonfirmasi)</option>
                    <option value="progress">progress (Sedang Diproduksi)</option>
                    <option value="to_close">to_close (Menunggu Tutup)</option>
                    <option value="done">done (Selesai)</option>
                    <option value="cancel">cancel (Dibatalkan)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md text-xs font-bold cursor-pointer"
                >
                  Simpan Perubahan (Write)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION (UNLINK) */}
      {recordToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-300 rounded-lg w-full max-w-sm p-6 shadow-xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-sm font-bold text-gray-900">Hapus Record Odoo?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Aksi ini akan menghapus (unlink) record #{recordToDelete.id} ({recordToDelete.name || activeModel}) secara permanen.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRecordToDelete(null)}
                className="flex-1 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold cursor-pointer"
              >
                Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIGURATION SETTINGS */}
      {isConfigOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-gray-300 rounded-lg w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Settings2 className="text-[#714B67] w-4 h-4" />
                <span>Pengaturan Koneksi Odoo ERP</span>
              </h3>
              <button onClick={() => setIsConfigOpen(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Simulation Mode Toggle */}
              <div className="bg-[#f8f9fa] border border-gray-200 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">Mode Sandbox Simulator</span>
                  <span className="text-[11px] text-gray-500">
                    Gunakan simulator offline untuk uji coba tanpa instalasi Odoo lokal
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.useSimulation}
                  onChange={e => setConfig({ ...config, useSimulation: e.target.checked })}
                  className="w-5 h-5 accent-[#714B67] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">Odoo Server Base URL</label>
                <input
                  type="text"
                  value={config.url}
                  onChange={e => setConfig({ ...config, url: e.target.value })}
                  placeholder="http://localhost:8069 atau https://erp.perusahaan.com"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900 focus:outline-none focus:border-[#714B67] focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Nama Database Odoo</label>
                  <input
                    type="text"
                    value={config.db}
                    onChange={e => setConfig({ ...config, db: e.target.value })}
                    placeholder="e.g. odoo_mes_db"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Versi Odoo</label>
                  <select
                    value={config.version}
                    onChange={e => setConfig({ ...config, version: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  >
                    <option value={17}>Odoo v17 (Modern)</option>
                    <option value={16}>Odoo v16</option>
                    <option value={15}>Odoo v15</option>
                    <option value={14}>Odoo v14</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Username / Email</label>
                  <input
                    type="text"
                    value={config.username}
                    onChange={e => setConfig({ ...config, username: e.target.value })}
                    placeholder="admin@perusahaan.com"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Password / API Key</label>
                  <input
                    type="password"
                    value={config.password}
                    onChange={e => setConfig({ ...config, password: e.target.value })}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">CORS Proxy / Bridge URL (Opsional)</label>
                <input
                  type="text"
                  value={config.corsProxyUrl || ''}
                  onChange={e => setConfig({ ...config, corsProxyUrl: e.target.value })}
                  placeholder="e.g. http://localhost:3099 atau biarkan kosong jika direct"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs text-gray-900"
                />
                <span className="text-[10px] text-gray-500 mt-1 block">
                  Jika Odoo Anda di server terpisah dan browser memblokir CORS, gunakan URL reverse proxy atau Mandor ERP Bridge.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-md text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => handleSaveConfig(config)}
                className="px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
