import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  SandpackCodeEditor,
  useSandpack
} from '@codesandbox/sandpack-react';
import {
  Monitor,
  Tablet,
  Smartphone,
  Code,
  Eye,
  Columns,
  RotateCcw,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Sparkles,
  Layers,
  Lock,
  Globe,
  Database,
  Table,
  Rocket,
  X,
  CheckCircle2,
  Send,
  ChevronDown,
  ExternalLink,
  RotateCw,
  Type,
  Link2,
  MessageSquare,
  Search,
  FileText,
  ArrowUp,
  ArrowLeft,
  Loader2,
  History,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
  Bot,
  User,
  Smartphone as MobileIcon,
  Download,
  Server,
  FolderOpen,
  Wrench,
  PenTool,
  MousePointerClick,
  Play,
  FileCode,
  QrCode,
  Wifi,
  Save,
  FilePlus,
  UploadCloud,
  Boxes
} from 'lucide-react';
import QRCode from 'react-qr-code';
import toast, { Toaster } from 'react-hot-toast';
import {
  syncVibeAppToTable,
  initVibeMessageListener,
  deployVibeAppToFrontline,
  extractTableSchemaFromCode,
  getTables
} from '../../utils/vibeTableBridge';
import { getFrontlineAppById, getAllFrontlineApps, deleteFrontlineApp } from '../../utils/supabaseFrontlineDB';
import { checkBuilderCompatibility, BUILDER_TYPES, getAppBuilderType } from '../../utils/builderType';

import { ProjectFileSystem } from '../../vibe/filesystem/ProjectFileSystem';
import { ProjectVersionControl } from '../../vibe/filesystem/ProjectVersionControl';
import { AIProvider } from '../../vibe/ai/AIProvider';
import { AgenticPromptEngine } from '../../vibe/ai/AgenticPromptEngine';
import { RuntimeManager } from '../../vibe/runtime/RuntimeManager';
import { EmergentAgentPipeline } from '../../vibe/ai/EmergentAgentPipeline';
import { ErrorFixEngine } from '../../vibe/autofix/ErrorFixEngine';
import { MAVICORE_UIKIT_VIRTUAL_FILE } from '../../vibe/uikit';
import { MAVICORE_SDK_VIRTUAL_FILE, MAVICORE_BRIDGE_VIRTUAL_FILE, MAVICORE_UI_VIRTUAL_FILE, SHADCN_UI_VIRTUAL_FILES } from '../../vibe/sdk';

import FileTreeExplorer from '../../vibe/components/FileTreeExplorer';
import AiChangesReviewModal from '../../vibe/components/AiChangesReviewModal';
import ManufacturingTemplatesModal from '../../vibe/components/ManufacturingTemplatesModal';
import BuildModal from '../../vibe/components/BuildModal';
import WidgetCatalogModal from '../../vibe/components/WidgetCatalogModal';
import VibeChatPanel from '../../vibe/components/VibeChatPanel';
import BottomTerminalPanel from '../../vibe/components/BottomTerminalPanel';
import { cleanVibeCode, healTruncatedReactCode, extractVibeCode, autoFixMissingImports, autoFixSyntaxErrors } from '../../vibe/utils/codeCleaner';
import { DyadCAGResolver, DyadPatchEngine } from '../../vibe/ai/DyadEngine';

// ═══════════════════════════════════════════════════════════════════
// 🔌 MaviCore Real-time Data Bridge Helper
// ═══════════════════════════════════════════════════════════════════
// This code will be INJECTED into the Vibe sandbox template

export const MAVICORE_BRIDGE_CODE = `
// MaviCore Table Bridge - Real-time Data Sync
// Auto-injected into every Vibe app
// Supports: INSERT, READ, UPDATE, DELETE, SUBSCRIBE

const MaviCoreBridge = {
  // ─── INSERT: Save data to MaviCore table ───
  save: (tableName, data) => {
    const payload = {
      type: 'MAVICORE_TABLE_INSERT',
      tableName: tableName,
      data: {
        timestamp: new Date().toISOString(),
        ...data
      }
    };

    // Send to parent (MaviCore app)
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }

    // Also dispatch for standalone mode
    window.dispatchEvent(new CustomEvent('mavicore_save', { detail: payload }));
    console.log('[MaviCore] 📊 Record saved to', tableName, data);
    return true;
  },

  // ─── READ: Fetch records from MaviCore table ───
  read: async (tableName) => {
    return new Promise((resolve, reject) => {
      const payload = {
        type: 'MAVICORE_TABLE_READ',
        tableName: tableName
      };

      // Send to parent
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(payload, '*');
      }

      // Listen for response
      const handler = (event) => {
        if (event.data?.type === 'MAVICORE_TABLE_READ_RESPONSE' &&
            event.data?.tableName === tableName) {
          window.removeEventListener('message', handler);
          resolve(event.data.records || []);
        }
      };

      window.addEventListener('message', handler);

      // Timeout fallback
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve([]);
      }, 3000);
    });
  },

  // ─── UPDATE: Update a record in MaviCore table ───
  update: (tableName, recordId, data) => {
    const payload = {
      type: 'MAVICORE_TABLE_UPDATE',
      tableName: tableName,
      recordId: recordId,
      data: {
        updatedAt: new Date().toISOString(),
        ...data
      }
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }

    window.dispatchEvent(new CustomEvent('mavicore_update', { detail: payload }));
    console.log('[MaviCore] ✏️ Record updated in', tableName, { recordId, data });
    return true;
  },

  // ─── DELETE: Delete a record from MaviCore table ───
  delete: (tableName, recordId) => {
    const payload = {
      type: 'MAVICORE_TABLE_DELETE',
      tableName: tableName,
      recordId: recordId
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }

    window.dispatchEvent(new CustomEvent('mavicore_delete', { detail: payload }));
    console.log('[MaviCore] 🗑️ Record deleted from', tableName, { recordId });
    return true;
  },

  // ─── LISTEN: Subscribe to real-time updates ───
  onRecord: (tableName, callback) => {
    const handler = (event) => {
      if (event.data?.type === 'MAVICORE_RECORD_SAVED' &&
          event.data?.table === tableName) {
        callback(event.data.record);
      }
    };

    window.addEventListener('message', handler);

    // Also listen for local events
    const localHandler = (e) => {
      if (e.detail?.tableName === tableName) {
        callback(e.detail.data);
      }
    };
    window.addEventListener('mavicore_save', localHandler);

    // Return cleanup function
    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('mavicore_save', localHandler);
    };
  },

  // ─── CREATE TABLE: Create a new table ───
  createTable: (tableName, fields) => {
    const payload = {
      type: 'MAVICORE_TABLE_CREATE',
      tableName: tableName,
      fields: fields || []
    };

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }

    window.dispatchEvent(new CustomEvent('mavicore_create_table', { detail: payload }));
    console.log('[MaviCore] 🆕 Table created:', tableName, fields);
    return true;
  }
};

// Auto report device/iframe runtime errors to parent Sandbox
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'MAVICORE_DEVICE_ERROR',
          error: e.message || String(e),
          stack: e.error?.stack || '',
          filename: e.filename || '',
          lineno: e.lineno || 0
        }, '*');
      }
    } catch (_) {}
  });

  window.addEventListener('unhandledrejection', (e) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'MAVICORE_DEVICE_ERROR',
          error: e.reason?.message || String(e.reason || 'Unhandled Promise Rejection'),
          stack: e.reason?.stack || ''
        }, '*');
      }
    } catch (_) {}
  });
}

// Expose globally
window.MaviCoreBridge = MaviCoreBridge;
console.log('[MaviCore] 🔌 Real-time data bridge ready - CRUD operations enabled');
`;

// Clean, blank starter component for new Sandbox sessions
export const CLEAN_BLANK_APP_CODE = `import React from 'react';

export default function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      color: '#334155',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px',
        boxShadow: '0 8px 24px -4px rgba(14, 165, 233, 0.35)',
        color: '#ffffff'
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m18 16 4-4-4-4"/>
          <path d="m6 8-4 4 4 4"/>
          <path d="m14.5 4-5 16"/>
        </svg>
      </div>
      <h2 style={{ margin: '0 0 8px 0', fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
        Sandbox Siap Digunakan
      </h2>
      <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b', maxWidth: '320px', lineHeight: 1.5 }}>
        Belum ada aplikasi yang aktif. Tulis prompt di panel kanan untuk generate app baru atau pilih dari daftar aplikasi di bawah tab files.
      </p>
    </div>
  );
}
`;

// Default table name for the template
export const DEFAULT_TABLE_NAME = 'Stasiun Assembly A1 Log';

export const DEFAULT_VIBE_HMI_CODE = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CheckCircle2, XCircle, TrendingUp, Users, Settings,
  Bell, ChevronRight, Play, Pause, RotateCcw, Zap, Factory, RefreshCw, Trash2
} from 'lucide-react';
import { KPICard, ScadaProdCounter, StatusBadge, TelemetryGauge } from './mavicore-ui';

// ─── Inject MaviCore Bridge ───
${MAVICORE_BRIDGE_CODE}

// ─── Custom Hook for Real-time Data ───
function useMaviCoreData(tableName) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initial load
    const loadData = async () => {
      if (window.MaviCoreBridge) {
        setLoading(true);
        const data = await window.MaviCoreBridge.read(tableName);
        setRecords(data);
        setLoading(false);
      }
    };
    loadData();

    // Subscribe to real-time updates
    if (window.MaviCoreBridge) {
      const cleanup = window.MaviCoreBridge.onRecord(tableName, (newRecord) => {
        setRecords(prev => [newRecord, ...prev]);
      });
      return cleanup;
    }
  }, [tableName]);

  return { records, loading, setRecords };
}

// ─── Tailwind CSS Styles ───
const styles = \`
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { font-family: 'Inter', system-ui, sans-serif; }

body {
  background: #f8fafc;
  min-height: 100vh;
  margin: 0;
  color: #0f172a;
}

.glass-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}

.glow-green { box-shadow: 0 4px 20px rgba(16, 185, 129, 0.25); }
.glow-red { box-shadow: 0 4px 20px rgba(239, 68, 68, 0.25); }
.glow-purple { box-shadow: 0 4px 20px rgba(99, 102, 241, 0.25); }

.stat-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
  transition: all 0.25s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.08);
  border-color: #cbd5e1;
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.pulse-dot {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin { animation: spin 1s linear infinite; }
\`;

const TABLE_NAME = '${DEFAULT_TABLE_NAME}';

export default function IndustrialDashboard() {
  const [productionCount, setProductionCount] = useState(1452);
  const [rejectCount, setRejectCount] = useState(12);
  const [isRunning, setIsRunning] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [lastSync, setLastSync] = useState(null);

  // ─── Real-time Data Hook ───
  const { records: productionLogs, loading: isLoadingLogs, setRecords: setProductionLogs } = useMaviCoreData(TABLE_NAME);

  // Update counts from real data when available
  useEffect(() => {
    if (productionLogs.length > 0) {
      const okCount = productionLogs.filter(r => r.type === 'OK' || r.status === 'OK').length;
      const ngCount = productionLogs.filter(r => r.type === 'NG' || r.status === 'NG').length;
      if (okCount > 0) setProductionCount(prev => Math.max(prev, okCount));
      if (ngCount > 0) setRejectCount(prev => Math.max(prev, ngCount));
    }
  }, [productionLogs]);

  const handleLogProduction = () => {
    const newCount = productionCount + 1;
    setProductionCount(newCount);
    setLastSync(new Date());

    // ─── SAVE TO MAVICORE TABLE ───
    if (window.MaviCoreBridge) {
      window.MaviCoreBridge.save(TABLE_NAME, {
        type: 'OK',
        status: 'PASS',
        total: newCount,
        station: 'Assembly A1',
        operator: 'Auto Logged'
      });
    }
  };

  const handleLogReject = () => {
    const newCount = rejectCount + 1;
    setRejectCount(newCount);
    setLastSync(new Date());

    // ─── SAVE TO MAVICORE TABLE ───
    if (window.MaviCoreBridge) {
      window.MaviCoreBridge.save(TABLE_NAME, {
        type: 'NG',
        status: 'FAIL',
        total: newCount,
        station: 'Assembly A1',
        timestamp: new Date().toISOString()
      });
    }
  };

  const efficiency = ((productionCount / (productionCount + rejectCount)) * 100).toFixed(1);

  const stats = [
    { label: 'Total Output', value: productionCount + rejectCount, icon: Factory, color: '#6366f1', trend: '+12%' },
    { label: 'Efisiensi', value: efficiency + '%', icon: TrendingUp, color: '#10b981', trend: '+3.2%' },
    { label: 'Operator Aktif', value: '8', icon: Users, color: '#f59e0b', trend: '+2' },
  ];

  return (
    <>
      <style>{styles}</style>
      <div className="min-h-screen p-6 bg-slate-50 text-slate-900">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Stasiun Assembly A1</h1>
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={isRunning ? 'RUNNING' : 'DOWNTIME'} />
                <span className="text-xs text-slate-500 font-semibold">{isRunning ? 'Lini Aktif - Produksi Normal' : 'Lini Berhenti'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm">
              <span className={\`w-2 h-2 rounded-full \${isLoadingLogs ? 'bg-yellow-500 animate-spin' : 'bg-green-500'}\`} />
              <span className="text-xs font-semibold text-slate-600">
                {isLoadingLogs ? 'Syncing...' : lastSync ? 'Synced' : 'Ready'}
              </span>
              {lastSync && (
                <span className="text-xs text-slate-400">
                  {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition">
              <Bell className="w-5 h-5 text-slate-600" />
            </button>
            <button className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 shadow-sm transition">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-slate-200/70 rounded-2xl w-fit">
          {['overview', 'production', 'quality'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={\`px-6 py-2 rounded-xl text-sm font-medium transition-all \${selectedTab === tab ? 'bg-white text-slate-900 shadow-md font-semibold' : 'text-slate-600 hover:text-slate-900'}\`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* ─── 3 MAVICORE UI KPI CARDS ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <KPICard title="TOTAL OUTPUT" value={(productionCount + rejectCount).toLocaleString()} unit="pcs" trend="+12%" color="indigo" icon={Factory} />
          <KPICard title="EFISIENSI LINI" value={efficiency + '%'} unit="Yield" trend="+3.2%" color="emerald" icon={TrendingUp} />
          <KPICard title="OPERATOR AKTIF" value="8" unit="Staff" trend="Shift 1" color="amber" icon={Users} />
        </div>

        {/* ─── MAVICORE SCADA COUNTER & TELEMETRY ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2">
            <ScadaProdCounter target={2000} actual={productionCount} defect={rejectCount} />
          </div>
          <div className="space-y-3">
            <TelemetryGauge title="Stasiun Feed Rate" value="120" unit="m/min" status={isRunning ? 'OPTIMAL' : 'WARN'} />
            <TelemetryGauge title="Hydraulic Pressure" value="142" unit="Bar" status={isRunning ? 'OPTIMAL' : 'WARN'} />
          </div>
        </div>

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Production Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Produksi Sesuai (OK)</h3>
                <p className="text-sm text-slate-500 mt-1">Part yang memenuhi standar kualitas</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={productionCount}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-slate-900 text-center mb-6"
              >
                {productionCount.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <button
              onClick={handleLogProduction}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition"
            >
              <Zap className="w-5 h-5" />
              Catat Part OK (+1)
            </button>
          </motion.div>

          {/* Defect Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Produksi Cacat (NG)</h3>
                <p className="text-sm text-slate-500 mt-1">Part yang tidak memenuhi standar</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={rejectCount}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-rose-600 text-center mb-6"
              >
                {rejectCount.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <button
              onClick={handleLogReject}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40 transition"
            >
              <XCircle className="w-5 h-5" />
              Catat Part NG
            </button>
          </motion.div>
        </div>

        {/* Real-time Log Preview */}
        {productionLogs.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mt-6 glass-card p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-bold text-slate-900">Real-time Log</h4>
              <span className="text-xs text-slate-500">{productionLogs.length} records</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {productionLogs.slice(0, 5).map((record, i) => (
                <div key={i} className="flex items-center gap-3 text-xs bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className={\`px-2.5 py-0.5 rounded-full text-xs font-bold \${record.type === 'OK' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}\`}>
                    {record.type}
                  </span>
                  <span className="text-slate-400 font-mono">{record.timestamp ? new Date(record.timestamp).toLocaleTimeString() : '--:--'}</span>
                  <span className="text-slate-700 font-medium flex-1">{record.station || 'Assembly A1'}</span>
                  <button
                    onClick={() => {
                      if (window.MaviCoreBridge) {
                        window.MaviCoreBridge.delete(TABLE_NAME, record.id || record.recordId);
                        // Remove from local state
                        setProductionLogs(prev => prev.filter(r => r.id !== record.id && r.recordId !== record.recordId));
                      }
                    }}
                    className="p-1 rounded hover:bg-red-500/20 transition"
                    title="Hapus record"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Control Bar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 glass-card p-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={\`p-3 rounded-xl transition \${isRunning ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'}\`}
            >
              {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <div>
              <div className="text-sm font-medium text-white">{isRunning ? 'Lini Produksi Aktif' : 'Lini Berhenti'}</div>
              <div className="text-xs text-gray-400">Mesin: Press Hydraulik #3 | Speed: 45 cycles/min</div>
            </div>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition">
            <RotateCcw className="w-4 h-4" />
            Reset Counter
          </button>
        </motion.div>

        {/* Data Source Info & CRUD Controls */}
        <div className="mt-4 glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs text-gray-400">🔌 Database: </span>
              <span className="text-xs text-indigo-400 font-medium">{TABLE_NAME}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-500 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Real-time
              </span>
            </div>
          </div>

          {/* CRUD Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => {
                if (window.MaviCoreBridge) {
                  window.MaviCoreBridge.createTable('New Table', [
                    { name: 'name', type: 'text' },
                    { name: 'value', type: 'number' }
                  ]);
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/30 transition flex items-center gap-1"
            >
              <span>+</span> Create Table
            </button>
            <button
              onClick={async () => {
                if (window.MaviCoreBridge) {
                  const data = await window.MaviCoreBridge.read(TABLE_NAME);
                  setProductionLogs(data);
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Read Data
            </button>
            <button
              onClick={() => {
                if (window.MaviCoreBridge) {
                  window.MaviCoreBridge.save(TABLE_NAME, { note: 'Manual entry', status: 'TEST' });
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition flex items-center gap-1"
            >
              <span>+</span> Insert
            </button>
            <button
              onClick={() => {
                const lastRecord = productionLogs[0];
                if (lastRecord && window.MaviCoreBridge) {
                  const idToDelete = lastRecord.id || lastRecord.recordId;
                  window.MaviCoreBridge.delete(TABLE_NAME, idToDelete);
                  setProductionLogs(prev => prev.slice(1));
                }
              }}
              className="px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Delete Last
            </button>
          </div>

          {/* Record Count */}
          <div className="mt-3 pt-3 border-t border-white/5 text-center">
            <span className="text-xs text-gray-500">
              Total records in database: <span className="text-white font-medium">{productionLogs.length}</span>
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
`;

/**
 * Child helper component to capture runtime errors from Sandpack
 */
function SandpackErrorListener({ onError, onLog }) {
  const { sandpack } = useSandpack();
  const prevErrorsRef = useRef('');
  const onErrorRef = useRef(onError);
  const onLogRef = useRef(onLog);
  onErrorRef.current = onError;
  onLogRef.current = onLog;

  useEffect(() => {
    const errs = sandpack?.errors || [];
    let errKey = '';
    try {
      errKey = errs.map(e => (typeof e === 'string' ? e : e?.message || '')).join('|');
    } catch {
      errKey = String(errs.length);
    }

    if (errs.length > 0 && errKey !== prevErrorsRef.current) {
      prevErrorsRef.current = errKey;
      const first = errs[0];
      const msg = typeof first === 'string' ? first : first?.message || JSON.stringify(first);
      if (onErrorRef.current) onErrorRef.current(msg);
      if (onLogRef.current) onLogRef.current(`[Sandpack Error] ${msg}`);
    } else if (errs.length === 0) {
      prevErrorsRef.current = '';
    }
  }, [sandpack?.errors]);

  return null;
}

/**
 * Live Bridge to push files directly into Sandpack's in-memory bundler without remounting
 */
function SandpackLiveBridge({ onBridgeReady }) {
  const { sandpack } = useSandpack();
  const sandpackRef = useRef(sandpack);
  sandpackRef.current = sandpack;
  const onBridgeReadyRef = useRef(onBridgeReady);
  onBridgeReadyRef.current = onBridgeReady;

  useEffect(() => {
    if (onBridgeReadyRef.current) {
      onBridgeReadyRef.current({
        updateFile: (path, content) => {
          try {
            if (!path || content == null) return;
            const safeContent = typeof content === 'string' ? content : String(content);
            // Guard: skip if the file in Sandpack already has the exact same content
            const currentCode = sandpackRef.current?.files?.[path]?.code;
            if (currentCode === safeContent) {
              return;
            }
            sandpackRef.current?.updateFile(path, safeContent, true);
          } catch (e) {
            console.error('Sandpack updateFile error:', e);
          }
        },
        openFile: (path) => {
          try {
            sandpackRef.current?.openFile(path);
          } catch (e) {}
        },
        runSandpack: () => {
          try {
            sandpackRef.current?.runSandpack?.();
          } catch (e) {}
        },
        get sandpack() {
          return sandpackRef.current;
        }
      });
    }
  }, []); // Run only once on mount of this Sandpack instance

  return null;
}

/**
 * Pro Editor Toolbar with Run button, format, file badge and shortcuts
 */
function SandpackProEditorBar({
  activePath,
  onRunCode,
  onFormatCode,
  isInspectActive,
  onToggleInspect
}) {
  const { sandpack } = useSandpack();
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRun = useCallback(() => {
    setIsRunning(true);
    try {
      const currentCode = sandpack?.files?.[activePath]?.code;
      if (currentCode && onRunCode) {
        onRunCode(activePath, currentCode);
      }
      sandpack?.runSandpack?.();
      toast.success('⚡ Kode berhasil dijalankan di device!', { id: 'run-code-toast', icon: '▶️' });
    } catch (err) {
      toast.error('Gagal menjalankan kode: ' + (err?.message || err));
    } finally {
      setTimeout(() => setIsRunning(false), 300);
    }
  }, [sandpack, activePath, onRunCode]);

  const handleFormat = () => {
    try {
      const currentCode = sandpack?.files?.[activePath]?.code;
      if (currentCode && onFormatCode) {
        onFormatCode(activePath, currentCode);
      }
    } catch (e) {
      console.warn('Format error:', e);
    }
  };

  const handleCopy = async () => {
    try {
      const currentCode = sandpack?.files?.[activePath]?.code || '';
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Kode disalin ke clipboard');
    } catch (_) {}
  };

  // Shortcut Ctrl+Enter / Cmd+Enter to Run
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRun]);

  return (
    <div style={{
      height: '38px',
      minHeight: '38px',
      backgroundColor: '#070b14',
      borderBottom: '1px solid #1e293b',
      padding: '0 10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      userSelect: 'none',
      flexShrink: 0
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <FileCode size={14} color="#38bdf8" />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
          {activePath}
        </span>
        <span style={{
          fontSize: '0.62rem',
          padding: '1px 6px',
          borderRadius: '4px',
          backgroundColor: 'rgba(56, 189, 248, 0.12)',
          color: '#38bdf8',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontWeight: 600
        }}>
          Editor Pro
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {/* Run Button */}
        <button
          type="button"
          onClick={handleRun}
          disabled={isRunning}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '4px 10px',
            borderRadius: '6px',
            border: 'none',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            fontSize: '0.72rem',
            fontWeight: 800,
            cursor: isRunning ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.15s ease'
          }}
          title="Jalankan kode hasil edit ke device preview (Shortcut: Ctrl+Enter)"
        >
          {isRunning ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} fill="#fff" />}
          <span>Jalankan (Ctrl+Enter)</span>
        </button>

        {/* Inspect Component Toggle */}
        <button
          type="button"
          onClick={onToggleInspect}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: isInspectActive ? 'rgba(14, 165, 233, 0.25)' : 'rgba(255, 255, 255, 0.06)',
            border: isInspectActive ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isInspectActive ? '#38bdf8' : '#cbd5e1',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          title="Klik elemen di layar device untuk langsung meloncat ke baris kode"
        >
          <MousePointerClick size={12} />
          <span>{isInspectActive ? 'Inspeksi Aktif' : 'Inspeksi Layar'}</span>
        </button>

        {/* Format Button */}
        <button
          type="button"
          onClick={handleFormat}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Rapikan format kode"
        >
          <Sparkles size={11} color="#a5b4fc" />
          <span>Format</span>
        </button>

        {/* Copy Button */}
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
          title="Salin isi file kode"
        >
          {copied ? <Check size={11} color="#10b981" /> : <Copy size={11} />}
          <span>{copied ? 'Disalin' : 'Copy'}</span>
        </button>
      </div>
    </div>
  );
}

export default function VibeSandpackViewer({
  code = null,
  onCodeChange = null,
  isFullScreen = false,
  onToggleFullScreen = null,
  onPromptSandbox = null,
  isLoading = false,
  onClose = null,
  isStandalone = false
}) {
  const navigate = useNavigate();
  const effectiveInitialCode = code && code.trim().length > 0 ? code : CLEAN_BLANK_APP_CODE;
  const sandpackBridgeRef = useRef(null);
  const handleBridgeReady = useCallback((bridge) => {
    sandpackBridgeRef.current = bridge;
  }, []);
  const lastKnownExternalCodeRef = useRef(effectiveInitialCode);

  // 1. Virtual File System & Version Control
  const [vfs] = useState(() => {
    const initialFiles = {
      '/App.js': effectiveInitialCode,
      '/styles.css': `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
* {
  font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  box-sizing: border-box;
}
html, body, #root {
  margin: 0;
  padding: 0;
  min-height: 100%;
  background-color: #f8fafc;
  color: #0f172a;
  -webkit-font-smoothing: antialiased;
}
button {
  font-family: inherit;
}
/* Beautiful Modern Light UI Utilities */
.glass-panel {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05);
}
.btn-ok {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
  border: none;
  color: #ffffff;
}
.btn-ok:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
}
.btn-ng {
  background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
  box-shadow: 0 4px 14px rgba(244, 63, 94, 0.35);
  border: none;
  color: #ffffff;
}
.btn-ng:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 6px 20px rgba(244, 63, 94, 0.45);
}
`,
      '/package.json': JSON.stringify({
        name: 'mavicore-app',
        version: '1.0.0',
        dependencies: {
          'react': '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': 'latest',
          'recharts': 'latest',
          'framer-motion': '^11.0.0'
        }
      }, null, 2),
      '/index.js': `import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./mavicore-bridge.js";

import * as AppModule from "./App.js";

class SandboxErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("[Sandbox Runtime Error]", error, errorInfo);
    if (typeof window !== 'undefined' && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'MAVICORE_DEVICE_ERROR',
        error: error?.message || String(error),
        stack: errorInfo?.componentStack || error?.stack || ''
      }, '*');
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#f8fafc',
          color: '#0f172a',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          boxSizing: 'border-box'
        }}>
          <div style={{
            maxWidth: '400px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #fee2e2',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.12)',
            padding: '20px',
            textAlign: 'center'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: '#fef2f2',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
              fontSize: '22px'
            }}>
              ⚠️
            </div>
            <h3 style={{
              fontSize: '15px',
              fontWeight: 800,
              color: '#b91c1c',
              margin: '0 0 6px 0'
            }}>
              Komponen Mengalami Kendala
            </h3>
            <p style={{
              fontSize: '12px',
              color: '#64748b',
              margin: '0 0 12px 0',
              lineHeight: 1.4
            }}>
              Terjadi runtime error saat komponen React dirender:
            </p>
            <div style={{
              backgroundColor: '#fff1f2',
              border: '1px solid #fecdd3',
              borderRadius: '10px',
              padding: '10px 12px',
              color: '#9f1239',
              fontSize: '11px',
              fontFamily: 'ui-monospace, monospace',
              textAlign: 'left',
              wordBreak: 'break-word',
              marginBottom: '16px',
              maxHeight: '140px',
              overflowY: 'auto'
            }}>
              {this.state.error?.message || String(this.state.error)}
            </div>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, error: null })}
              style={{
                width: '100%',
                padding: '9px 14px',
                borderRadius: '10px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Coba Muat Ulang Komponen
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppRunner() {
  const Component = AppModule.default || AppModule.App || Object.values(AppModule).find(v => typeof v === 'function');
  if (!Component || typeof Component !== 'function') {
    return (
      <div style={{ padding: '32px 16px', textAlign: 'center', color: '#1e293b', fontFamily: 'system-ui, sans-serif' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#ef4444', marginBottom: '6px' }}>Komponen App Tidak Ditemukan</h3>
        <p style={{ fontSize: '12px', color: '#64748b' }}>Pastikan file /App.js memiliki <code>export default function App()</code>.</p>
      </div>
    );
  }
  return React.createElement(Component);
}

const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <SandboxErrorBoundary>
      <AppRunner />
    </SandboxErrorBoundary>
  </StrictMode>
);
`,
      '/mavicore-ui.jsx': MAVICORE_UI_VIRTUAL_FILE,
      '/mavicore-ui.js': MAVICORE_UI_VIRTUAL_FILE,
      '/mavicore-ui': MAVICORE_UI_VIRTUAL_FILE,
      '/mavicoreUi.js': MAVICORE_UI_VIRTUAL_FILE,
      '/mavicoreUi': MAVICORE_UI_VIRTUAL_FILE,
      '/components/mavicore-ui.js': MAVICORE_UI_VIRTUAL_FILE,
      '/components/MaviCoreUI.jsx': MAVICORE_UI_VIRTUAL_FILE,
      '/node_modules/mavicore-ui/index.js': MAVICORE_UI_VIRTUAL_FILE,
      '/node_modules/mavicore-ui/package.json': JSON.stringify({ name: 'mavicore-ui', main: 'index.js' }),
      '/mavicore-sdk.js': MAVICORE_SDK_VIRTUAL_FILE,
      '/mavicore-sdk': MAVICORE_SDK_VIRTUAL_FILE,
      '/mavicoreSdk.js': MAVICORE_SDK_VIRTUAL_FILE,
      '/mavicoreSdk': MAVICORE_SDK_VIRTUAL_FILE,
      '/mavicore-bridge.js': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/mavicore-bridge': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/mavicoreBridge.js': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/mavicoreBridge': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/mavicore_bridge.js': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/mavicore_bridge': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/node_modules/mavicore-bridge/index.js': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/node_modules/mavicore-bridge/package.json': JSON.stringify({ name: 'mavicore-bridge', main: 'index.js' }),
      '/node_modules/mavicoreBridge/index.js': MAVICORE_BRIDGE_VIRTUAL_FILE,
      '/node_modules/mavicoreBridge/package.json': JSON.stringify({ name: 'mavicoreBridge', main: 'index.js' }),
      ...SHADCN_UI_VIRTUAL_FILES
    };
    return new ProjectFileSystem(initialFiles);
  });

  const [versionControl] = useState(() => new ProjectVersionControl());
  const [runtimeManager] = useState(() => new RuntimeManager('sandpack'));

  // Project state
  const [filesRecord, setFilesRecord] = useState(() => vfs.getAllFilesRecord());
  const [filesRevision, setFilesRevision] = useState(0);
  const [chatInitialPrompt, setChatInitialPrompt] = useState('');
  const [activeFilePath, setActiveFilePath] = useState('/App.js');
  const [fileTree, setFileTree] = useState(() => vfs.getFileTree());
  const [appMode, setAppMode] = useState('web'); // 'web' | 'mobile'
  const [appName, setAppName] = useState('Sandbox');
  const [deployedApp, setDeployedApp] = useState(null);
  const [currentAppId, setCurrentAppId] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempAppName, setTempAppName] = useState('');

  // Bulletproof sanitization of virtual files for Sandpack to prevent "Cannot read properties of null (reading 'code')"
  const sanitizedSandpackFiles = useMemo(() => {
    const result = {};
    if (filesRecord && typeof filesRecord === 'object') {
      for (const [rawPath, rawVal] of Object.entries(filesRecord)) {
        if (!rawPath || typeof rawPath !== 'string') continue;
        const normPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
        if (typeof rawVal === 'string') {
          result[normPath] = rawVal;
        } else if (rawVal && typeof rawVal.code === 'string') {
          result[normPath] = rawVal.code;
        } else if (rawVal != null) {
          result[normPath] = String(rawVal);
        } else {
          result[normPath] = '';
        }
      }
    }
    // Guarantee that both /App.js and /App.jsx exist, match, and are never empty
    const rawAppJs = result['/App.js'];
    const rawAppJsx = result['/App.jsx'];
    const canonicalMainCode =
      (rawAppJs && typeof rawAppJs === 'string' && rawAppJs.trim().length > 20)
        ? rawAppJs
        : (rawAppJsx && typeof rawAppJsx === 'string' && rawAppJsx.trim().length > 20)
          ? rawAppJsx
          : (effectiveInitialCode || CLEAN_BLANK_APP_CODE);

    result['/App.js'] = canonicalMainCode;
    result['/App.jsx'] = canonicalMainCode;
    return result;
  }, [filesRecord, effectiveInitialCode]);

  // Pre-emptive auto-heal on mount to instantly cure any legacy duplicate imports or rogue closures
  useEffect(() => {
    try {
      const current = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
      if (current) {
        const cleaned = cleanVibeCode(current);
        if (cleaned && cleaned.trim() !== current.trim()) {
          vfs.writeFile('/App.js', cleaned);
          setFilesRecord(vfs.getAllFilesRecord());
          setFilesRevision(prev => prev + 1);
          if (onCodeChange) onCodeChange(cleaned);
        }
      }
    } catch (_) {}
  }, []);

  // Sync external code prop if updated externally
  useEffect(() => {
    if (code && code.trim() && code !== lastKnownExternalCodeRef.current) {
      lastKnownExternalCodeRef.current = code;
      const cleaned = cleanVibeCode(code);
      vfs.writeFile('/App.js', cleaned);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
      autoFixAttemptsRef.current = 0;
      isAutoFixingRef.current = false;
      setErrors([]);
      setFilesRevision(prev => prev + 1);
      if (sandpackBridgeRef.current) {
        sandpackBridgeRef.current.updateFile('/App.js', cleaned);
        sandpackBridgeRef.current.runSandpack?.();
      }
    }
  }, [code, vfs, onCodeChange]);

  // UI state
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code' | 'split'
  const [viewportSize, setViewportSize] = useState('responsive'); // 'responsive' | 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [connectedTable, setConnectedTable] = useState(null);
  const [isSyncingTable, setIsSyncingTable] = useState(false);
  const [liveRecordCount, setLiveRecordCount] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [incompatibleNotice, setIncompatibleNotice] = useState(null);
  const [isInspectModeActive, setIsInspectModeActive] = useState(false);

  // Live Real Device QR Runner state
  const [isLiveDeviceModalOpen, setIsLiveDeviceModalOpen] = useState(false);
  const [liveDeviceAppId, setLiveDeviceAppId] = useState(null);
  const [isSyncingLiveDevice, setIsSyncingLiveDevice] = useState(false);
  const [liveDeviceHost, setLiveDeviceHost] = useState(() => {
    if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
      return 'http://192.168.100.98:5173';
    }
    return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  });

  const getLiveDeviceUrl = useCallback(() => {
    const id = liveDeviceAppId || currentAppId || 'live_app';
    const host = (liveDeviceHost || window.location.origin).replace(/\/+$/, '');
    const pathname = window.location.pathname.replace(/\/+$/, '');
    return `${host}${pathname}/#/sandbox-runner?appId=${encodeURIComponent(id)}&mode=companion`;
  }, [liveDeviceAppId, currentAppId, liveDeviceHost]);

  const handleOpenLiveDevice = useCallback(async () => {
    setIsLiveDeviceModalOpen(true);
    setIsSyncingLiveDevice(true);
    try {
      const currentCode = vfs.readFile('/App.js') || effectiveInitialCode;
      const targetName = (appName || 'Sandbox Live App').trim();

      // Persist to Supabase so phone can load it instantly anywhere
      const saved = await deployVibeAppToFrontline({
        id: currentAppId || undefined,
        name: targetName,
        code: currentCode,
        category: 'Shop Floor',
        isPublished: true
      });

      const effectiveId = saved?.id || currentAppId || ('live_' + Date.now());
      setLiveDeviceAppId(effectiveId);
      if (saved?.id && !currentAppId) {
        setCurrentAppId(saved.id);
      }

      // Also save to localStorage cache
      localStorage.setItem('vibe_last_active_app', JSON.stringify({
        id: effectiveId,
        name: targetName,
        config: {
          vibeCode: currentCode,
          files: filesRecord
        }
      }));
    } catch (err) {
      console.warn('[VibeSandpackViewer] Live device sync warning:', err);
    } finally {
      setIsSyncingLiveDevice(false);
    }
  }, [vfs, effectiveInitialCode, appName, currentAppId, filesRecord]);

  // Load app from Supabase if appId query param is present
  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const searchStr = hash.includes('?') ? hash.split('?')[1] : (search.startsWith('?') ? search.slice(1) : search);
    const params = new URLSearchParams(searchStr);
    const appId = params.get('appId');

    if (appId) {
      getFrontlineAppById(appId)
        .then(appData => {
          if (appData) {
            const compatibility = checkBuilderCompatibility(BUILDER_TYPES.SANDBOX, appData);
            if (!compatibility.allowed) {
              console.warn('[VibeSandpackViewer] Incompatible app for Sandbox:', compatibility);
              setIncompatibleNotice(compatibility);
              return;
            }

            setAppName(appData.name || 'Sandbox App');
            setDeployedApp(appData);
            setCurrentAppId(appData.id);
            const savedCode = appData.config?.vibeCode || (typeof appData.config === 'string' ? appData.config : null);
            if (savedCode) {
              const cleaned = cleanVibeCode(savedCode);
              vfs.writeFile('/App.js', cleaned || savedCode);
              setFilesRecord(vfs.getAllFilesRecord());
              setFileTree(vfs.getFileTree());
              if (sandpackBridgeRef.current) {
                sandpackBridgeRef.current.updateFile('/App.js', cleaned || savedCode);
              }
              toast.success(`Aplikasi "${appData.name}" berhasil dimuat di Sandbox!`);
            }
          }
        })
        .catch(err => {
          console.error('[VibeSandpackViewer] Failed to load app by ID:', err);
          toast.error('Gagal memuat aplikasi dari database');
        });
    }

    // Ensure virtual bridge files are up-to-date with latest CRUD aliases
    vfs.writeFile('/mavicore-bridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-bridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreBridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreBridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicore_bridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicore_bridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/node_modules/mavicore-bridge/index.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/node_modules/mavicoreBridge/index.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-sdk.js', MAVICORE_SDK_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-sdk', MAVICORE_SDK_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreSdk.js', MAVICORE_SDK_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreSdk', MAVICORE_SDK_VIRTUAL_FILE);
    vfs.writeFile('/node_modules/mavicore-sdk/index.js', MAVICORE_SDK_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-ui.jsx', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-ui.js', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/mavicore-ui', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreUi.js', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/mavicoreUi', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/components/mavicore-ui.js', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/components/MaviCoreUI.jsx', MAVICORE_UI_VIRTUAL_FILE);
    vfs.writeFile('/node_modules/mavicore-ui/index.js', MAVICORE_UI_VIRTUAL_FILE);
    Object.entries(SHADCN_UI_VIRTUAL_FILES).forEach(([path, content]) => {
      vfs.writeFile(path, content);
    });
    setFilesRecord(vfs.getAllFilesRecord());
    setFileTree(vfs.getFileTree());
  }, []);

  // Auto-save to localStorage every 5 seconds when code changes
  useEffect(() => {
    const saveTimer = setTimeout(() => {
      try {
        const currentCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
        if (currentCode) {
          localStorage.setItem('vibe_sandbox_autosave', currentCode);
          localStorage.setItem('vibe_sandbox_autosave_time', new Date().toISOString());
          setLastSaved(new Date());
        }
      } catch (e) { /* localStorage full */ }
    }, 3000);
    return () => clearTimeout(saveTimer);
  }, [filesRecord]);

  // ─── Apps Sandbox List Management (Tampil di bawah tab files) ───
  const [sandboxAppsList, setSandboxAppsList] = useState([]);
  const [isLoadingSandboxApps, setIsLoadingSandboxApps] = useState(false);

  const loadSandboxApps = useCallback(async () => {
    setIsLoadingSandboxApps(true);
    try {
      const apps = await getAllFrontlineApps();
      const filtered = (apps || []).filter(app => getAppBuilderType(app) === BUILDER_TYPES.SANDBOX);
      setSandboxAppsList(filtered);
    } catch (err) {
      console.warn('[VibeSandpackViewer] Failed to load sandbox apps:', err);
    } finally {
      setIsLoadingSandboxApps(false);
    }
  }, []);

  useEffect(() => {
    loadSandboxApps();
  }, [loadSandboxApps]);

  const handleSelectSandboxApp = useCallback(async (app) => {
    if (!app) return;
    try {
      const compatibility = checkBuilderCompatibility(BUILDER_TYPES.SANDBOX, app);
      if (!compatibility.allowed) {
        setIncompatibleNotice(compatibility);
        return;
      }
      setAppName(app.name || 'Sandbox App');
      setDeployedApp(app);
      const savedCode = app.config?.vibeCode || (typeof app.config === 'string' ? app.config : null);
      if (savedCode) {
        const cleaned = cleanVibeCode(savedCode) || savedCode;
        vfs.writeFile('/App.js', cleaned);
        setFilesRecord(vfs.getAllFilesRecord());
        setFileTree(vfs.getFileTree());
        lastKnownExternalCodeRef.current = cleaned;
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.updateFile('/App.js', cleaned);
        }
        if (onCodeChange) onCodeChange(cleaned);
        const url = new URL(window.location.href);
        url.searchParams.set('appId', app.id);
        window.history.pushState({}, '', url.toString());
        setErrors([]);
        toast.success(`Aplikasi "${app.name}" berhasil dibuka!`);
      }
    } catch (err) {
      console.error('[VibeSandpackViewer] Gagal membuka app:', err);
      toast.error('Gagal membuka aplikasi terpilih');
    }
  }, [vfs, onCodeChange]);

  const handleNewBlankApp = useCallback(() => {
    setAppName('Sandbox App');
    setDeployedApp(null);
    vfs.writeFile('/App.js', CLEAN_BLANK_APP_CODE);
    setFilesRecord(vfs.getAllFilesRecord());
    setFileTree(vfs.getFileTree());
    lastKnownExternalCodeRef.current = CLEAN_BLANK_APP_CODE;
    if (sandpackBridgeRef.current) {
      sandpackBridgeRef.current.updateFile('/App.js', CLEAN_BLANK_APP_CODE);
    }
    if (onCodeChange) onCodeChange(CLEAN_BLANK_APP_CODE);
    try { localStorage.removeItem('vibe_sandbox_autosave'); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.delete('appId');
    window.history.pushState({}, '', url.toString());
    setErrors([]);
    toast.success('✨ Sandbox bersih siap digunakan untuk aplikasi baru!');
  }, [vfs, onCodeChange]);

  const handleDeleteSandboxApp = useCallback(async (appId, appTitle) => {
    const confirmDel = window.confirm(`Hapus aplikasi "${appTitle || 'Sandbox App'}" secara permanen?`);
    if (!confirmDel) return;
    try {
      await deleteFrontlineApp(appId);
      toast.success(`Aplikasi "${appTitle}" berhasil dihapus.`);
      if (deployedApp?.id === appId) {
        handleNewBlankApp();
      }
      loadSandboxApps();
    } catch (err) {
      console.error('[VibeSandpackViewer] Gagal menghapus app:', err);
      toast.error('Gagal menghapus aplikasi dari database.');
    }
  }, [deployedApp, handleNewBlankApp, loadSandboxApps]);

  // Initialize postMessage listener for real-time data & CRUD sync
  useEffect(() => {
    const cleanup = initVibeMessageListener((table, change) => {
      setConnectedTable(table);
      setLiveRecordCount(prev => prev + 1);
      if (change?.deleted) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Table CRUD] 🗑️ Record dihapus dari tabel "${table.name}"` }]);
      } else if (change?.updated) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Table CRUD] ✏️ Record diupdate di tabel "${table.name}"` }]);
      } else {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Table CRUD] 📊 Record baru tersimpan di tabel "${table.name}"` }]);
      }
    });
    return cleanup;
  }, []);

  // Dyad Studio Panels state
  const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(true);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(false);
  const [rightPanelTab, setRightPanelTab] = useState('both'); // 'editor' | 'files' | 'both'
  const [isTerminalPanelOpen, setIsTerminalPanelOpen] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState('MiniMax-M2.7');

  const aiModels = [
    { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', icon: '🤖', color: '#10b981' },
    { id: 'MiniMax-M1.5', name: 'MiniMax-M1.5', icon: '⚡', color: '#f59e0b' },
    { id: 'GPT-4o', name: 'GPT-4o', icon: '🧠', color: '#6366f1' },
    { id: 'Claude-3.5', name: 'Claude 3.5', icon: '💎', color: '#ec4899' },
  ];

  // Emergent.sh Agent & Pipeline state
  const [stepHistory, setStepHistory] = useState([]);
  const [activeEngine, setActiveEngine] = useState('sandpack');
  const pipelineRef = useRef(null);

  const handleDownloadProjectZip = useCallback(async () => {
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const allFiles = vfs.getAllFilesRecord();
      for (const [path, content] of Object.entries(allFiles)) {
        const cleanPath = path.replace(/^\//, '');
        zip.file(cleanPath, content);
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(appName || 'mavi-vibe-app').toLowerCase().replace(/\s+/g, '-')}-project.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📦 Project ZIP berhasil diunduh!');
    } catch (err) {
      toast.error(`Gagal mendownload ZIP: ${err.message}`);
    }
  }, [vfs, appName]);

  // Modals state
  const [isTemplatesModalOpen, setIsTemplatesModalOpen] = useState(false);
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [pendingFileActions, setPendingFileActions] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);

  useEffect(() => {
    getTables().then(tbls => {
      if (Array.isArray(tbls)) setAvailableTables(tbls);
    }).catch(err => console.warn('Failed to fetch tables:', err));
  }, []);

  // Chat & AI state
  const [inlinePrompt, setInlinePrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [internalAiLoading, setInternalAiLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Logs & errors
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [aiActivity, setAiActivity] = useState(null);
  const [isAutoFixing, setIsAutoFixing] = useState(false);

  // ─── Automated Device Error Analysis & Auto-Repair Loop ───
  const autoFixAttemptsRef = useRef(0);
  const isAutoFixingRef = useRef(false);
  const autoFixDebounceTimerRef = useRef(null);
  const healthyCheckTimerRef = useRef(null);
  const activeFilePathRef = useRef(activeFilePath);
  activeFilePathRef.current = activeFilePath;
  const errorsRef = useRef(errors);
  errorsRef.current = errors;

  // Verifies that code runs on device without errors
  const scheduleHealthyCheck = useCallback(() => {
    if (healthyCheckTimerRef.current) clearTimeout(healthyCheckTimerRef.current);
    healthyCheckTimerRef.current = setTimeout(() => {
      if (errorsRef.current.length === 0) {
        autoFixAttemptsRef.current = 0;
        setLogs(prev => [...prev, {
          timestamp: new Date(),
          text: '[Device Verification] ✅ Aplikasi berjalan sempurna di device tanpa error!'
        }]);
        toast.success('🎉 Aplikasi berjalan sempurna di device!', { id: 'device-run-success' });
      }
    }, 2500);
  }, []);

  const errorFixEngine = useMemo(() => {
    const engine = new ErrorFixEngine(vfs, runtimeManager, 4);
    engine.onProgress((event) => {
      setAiActivity(event);
      if (event.message) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Auto-Fix AI] ${event.message}` }]);
      }
      if (event.stage === 'success') {
        const updatedFiles = vfs.getAllFilesRecord();
        setFilesRecord(updatedFiles);
        setFileTree(vfs.getFileTree());
        setFilesRevision(prev => prev + 1);
        const appCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
        if (appCode) {
          lastKnownExternalCodeRef.current = appCode;
          if (sandpackBridgeRef.current) {
            sandpackBridgeRef.current.updateFile('/App.js', appCode);
            sandpackBridgeRef.current.runSandpack?.();
          }
          try { localStorage.setItem('vibe_sandbox_autosave', appCode); } catch {}
          if (onCodeChange) onCodeChange(appCode);
        }
        setErrors([]);
        setIsAutoFixing(false);
        isAutoFixingRef.current = false;
        toast.success(event.message);
        scheduleHealthyCheck();
      } else if (event.stage === 'error' || event.stage === 'failed') {
        setIsAutoFixing(false);
        isAutoFixingRef.current = false;
        toast.error(event.message);
      }
    });
    return engine;
  }, [vfs, runtimeManager, onCodeChange, scheduleHealthyCheck]);

  const handleSandpackError = useCallback((err) => {
    if (!err) return;
    const cleanErrMsg = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
    setErrors(prev => (prev.includes(cleanErrMsg) ? prev : [cleanErrMsg, ...prev.slice(0, 4)]));
    setIsTerminalPanelOpen(true);

    if (healthyCheckTimerRef.current) {
      clearTimeout(healthyCheckTimerRef.current);
    }

    if (isAutoFixingRef.current) {
      return;
    }

    if (autoFixDebounceTimerRef.current) {
      clearTimeout(autoFixDebounceTimerRef.current);
    }

    // Fast-track auto-fix: immediately attempt heuristic repair in 200ms
    autoFixDebounceTimerRef.current = setTimeout(async () => {
      if (autoFixAttemptsRef.current >= 6) {
        setLogs(prev => [...prev, {
          timestamp: new Date(),
          text: `[Auto-Fix] ⚠️ Batas percobaan auto-fix (6x) tercapai. Silakan periksa kode di tab editor.`
        }]);
        toast.error('Batas auto-fix tercapai. Silakan periksa error di tab code.');
        return;
      }

      autoFixAttemptsRef.current += 1;
      isAutoFixingRef.current = true;
      setIsAutoFixing(true);

      // 0. Safety: Immediately restore virtual bridge/UI files if corrupted or reported in error
      if (/mavicore[-_]?bridge/i.test(cleanErrMsg)) {
        vfs.writeFile('/mavicore-bridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/mavicore-bridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/mavicoreBridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/mavicoreBridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/mavicore_bridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/mavicore_bridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
        vfs.writeFile('/node_modules/mavicore-bridge/index.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.updateFile('/mavicore-bridge.js', MAVICORE_BRIDGE_VIRTUAL_FILE);
          sandpackBridgeRef.current.updateFile('/mavicore-bridge', MAVICORE_BRIDGE_VIRTUAL_FILE);
        }
      }
      if (/mavicore[-_]?ui/i.test(cleanErrMsg)) {
        vfs.writeFile('/mavicore-ui.js', MAVICORE_UI_VIRTUAL_FILE);
        vfs.writeFile('/mavicore-ui.jsx', MAVICORE_UI_VIRTUAL_FILE);
        vfs.writeFile('/mavicore-ui', MAVICORE_UI_VIRTUAL_FILE);
        vfs.writeFile('/node_modules/mavicore-ui/index.js', MAVICORE_UI_VIRTUAL_FILE);
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.updateFile('/mavicore-ui.js', MAVICORE_UI_VIRTUAL_FILE);
        }
      }
      if (/components\/ui|lib\/utils/i.test(cleanErrMsg)) {
        Object.entries(SHADCN_UI_VIRTUAL_FILES).forEach(([p, c]) => {
          vfs.writeFile(p, c);
          if (sandpackBridgeRef.current) {
            sandpackBridgeRef.current.updateFile(p, c);
          }
        });
      }

      // Safe target path: Never allow auto-fix to target protected system SDK files
      let targetPath = activeFilePathRef.current || '/App.js';
      if (/mavicore|index\.js|package\.json|styles\.css|node_modules/i.test(targetPath)) {
        targetPath = '/App.js';
      }
      const currentCode = vfs.readFile(targetPath) || vfs.readFile('/App.js') || vfs.readFile('/App.jsx');

      setLogs(prev => [...prev, {
        timestamp: new Date(),
        text: `[Auto-Fix #${autoFixAttemptsRef.current}/6] ⚡ Mendeteksi error runtime/sintaks. Mengaplikasikan perbaikan otomatis...`
      }]);

      // 1. Quick Heuristic Missing Imports & Duplicate Declarations
      try {
        if (currentCode) {
          const importFixed = autoFixMissingImports(currentCode, cleanErrMsg);
          if (importFixed && importFixed.trim() !== currentCode.trim()) {
            vfs.writeFile(targetPath, importFixed);
            const updatedFiles = vfs.getAllFilesRecord();
            setFilesRecord(updatedFiles);
            setFileTree(vfs.getFileTree());
            setFilesRevision(prev => prev + 1);
            lastKnownExternalCodeRef.current = importFixed;
            if (sandpackBridgeRef.current) {
              sandpackBridgeRef.current.updateFile(targetPath, importFixed);
              sandpackBridgeRef.current.runSandpack?.();
            }
            try { localStorage.setItem('vibe_sandbox_autosave', importFixed); } catch {}
            if (onCodeChange) onCodeChange(importFixed);
            setErrors([]);
            isAutoFixingRef.current = false;
            setIsAutoFixing(false);
            setLogs(prev => [...prev, {
              timestamp: new Date(),
              text: `[Auto-Fix] ✅ Berhasil memperbaiki import & deklarasi (${targetPath}). Device dimuat ulang...`
            }]);
            toast.success('⚡ Auto-Fix: Import & deklarasi berhasil diperbaiki otomatis!');
            scheduleHealthyCheck();
            return;
          }
        }
      } catch (e) {
        console.warn('Heuristic import auto-fix failed:', e);
      }

      // 2. Quick Heuristic Syntax Auto-Heal (solves truncated codes & rogue syntax errors like extra `);`)
      try {
        if (currentCode) {
          const syntaxFixed = autoFixSyntaxErrors(currentCode, cleanErrMsg);
          const healed = syntaxFixed || healTruncatedReactCode(cleanVibeCode(currentCode));
          if (healed && healed.trim() !== currentCode.trim()) {
            vfs.writeFile(targetPath, healed);
            const updatedFiles = vfs.getAllFilesRecord();
            setFilesRecord(updatedFiles);
            setFileTree(vfs.getFileTree());
            setFilesRevision(prev => prev + 1);
            lastKnownExternalCodeRef.current = healed;
            if (sandpackBridgeRef.current) {
              sandpackBridgeRef.current.updateFile(targetPath, healed);
              sandpackBridgeRef.current.runSandpack?.();
            }
            try { localStorage.setItem('vibe_sandbox_autosave', healed); } catch {}
            if (onCodeChange) onCodeChange(healed);
            setErrors([]);
            isAutoFixingRef.current = false;
            setIsAutoFixing(false);
            setLogs(prev => [...prev, {
              timestamp: new Date(),
              text: `[Auto-Fix] ✅ Sintaks kode diperbaiki instan oleh Healer (${targetPath}). Device dimuat ulang...`
            }]);
            toast.success('⚡ Auto-Fix: Sintaks kode diperbaiki otomatis!');
            scheduleHealthyCheck();
            return;
          }
        }
      } catch (e) {
        console.warn('Heuristic syntax auto-fix failed:', e);
      }

      // 3. AI Error Fix Engine
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        text: `[Auto-Fix] 🤖 Menganalisis kode dan error dengan AI Debugger...`
      }]);
      errorFixEngine.attemptAutoFix(cleanErrMsg, targetPath);
    }, 200);
  }, [vfs, onCodeChange, errorFixEngine, scheduleHealthyCheck]);

  // ─── Pro Editor & Component Inspector Handlers ───
  const handleRunEditorCode = useCallback((filePath, newCode) => {
    vfs.writeFile(filePath, newCode);
    setFilesRecord(vfs.getAllFilesRecord());
    if (filePath === '/App.js' && onCodeChange) {
      onCodeChange(newCode);
    }
    if (sandpackBridgeRef.current) {
      sandpackBridgeRef.current.updateFile(filePath, newCode);
      sandpackBridgeRef.current.runSandpack?.();
    }
    setLogs(prev => [...prev, {
      timestamp: new Date(),
      text: `[Editor Pro] ▶️ Menjalankan kode terbaru untuk ${filePath}`
    }]);
  }, [vfs, onCodeChange]);

  const handleFormatEditorCode = useCallback((filePath, codeText) => {
    try {
      const cleaned = cleanVibeCode(codeText);
      if (cleaned && cleaned !== codeText) {
        handleRunEditorCode(filePath, cleaned);
        toast.success('Format kode berhasil dirapikan!');
      } else {
        toast.success('Format kode sudah rapi');
      }
    } catch (_) {}
  }, [handleRunEditorCode]);

  const handleElementInspected = useCallback((elementData) => {
    const { tagName, text, placeholder, id, className, firstLine, name, value, words } = elementData;

    // 1. Auto switch to split if currently in preview
    setViewMode(prev => (prev === 'preview' ? 'split' : prev));

    // Get live code from Sandpack bundler or VFS
    let targetPath = activeFilePath || '/App.js';
    let targetCode = 
      sandpackBridgeRef.current?.sandpack?.files?.[targetPath]?.code ||
      vfs.readFile(targetPath) ||
      '';

    // Scoring search algorithm
    const searchInCode = (codeStr) => {
      if (!codeStr) return { lineIdx: -1, score: 0, matchedTerm: '' };
      const lines = codeStr.split('\n');
      let bestIdx = -1;
      let maxScore = 0;
      let bestTerm = '';

      const cleanFirstLine = (firstLine || (text || '').split('\n')[0] || '').trim();
      const cleanSnippet = cleanFirstLine.slice(0, 30);
      const keywords = (words || cleanFirstLine.replace(/[^a-zA-Z0-9_\s-]/g, ' ').split(/\s+/))
        .filter(w => w && w.length >= 3);

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx];
        const lowerLine = line.toLowerCase();
        let score = 0;

        // 1. Exact or partial match for firstLine text (+100)
        if (cleanSnippet.length > 2 && line.includes(cleanSnippet)) {
          score += 100;
          bestTerm = cleanSnippet;
        } else if (cleanSnippet.length > 2 && lowerLine.includes(cleanSnippet.toLowerCase())) {
          score += 80;
          bestTerm = cleanSnippet;
        }

        // 2. Match placeholder (+90)
        if (placeholder && placeholder.length > 1 && line.includes(placeholder)) {
          score += 90;
          bestTerm = placeholder;
        }

        // 3. Match name attribute (+85)
        if (name && name.length > 1 && lowerLine.includes(`name="${name.toLowerCase()}"`)) {
          score += 85;
          bestTerm = name;
        }

        // 4. Match ID (+85)
        if (id && id.length > 1 && (line.includes(`"${id}"`) || line.includes(`'${id}'`))) {
          score += 85;
          bestTerm = id;
        }

        // 5. Match individual keywords (+25 per word)
        let matchedKeywords = 0;
        for (const kw of keywords) {
          if (lowerLine.includes(kw.toLowerCase())) {
            score += 25;
            matchedKeywords++;
            if (!bestTerm) bestTerm = kw;
          }
        }
        if (matchedKeywords > 1) score += 20;

        // 6. Match specific tag name (+20)
        if (tagName && !['div', 'span', 'section', 'main'].includes(tagName)) {
          const tagRegex = new RegExp(`<${tagName}\\b`, 'i');
          if (tagRegex.test(line)) {
            score += 20;
          }
        }

        // 7. Match value (+30)
        if (value && typeof value === 'string' && value.length > 2 && line.includes(value)) {
          score += 30;
          if (!bestTerm) bestTerm = value;
        }

        // De-prioritize imports or useState declarations unless no other match
        if (lowerLine.startsWith('import ') || lowerLine.startsWith('const [') || lowerLine.startsWith('export default')) {
          score = Math.max(0, score - 60);
        }

        if (score > maxScore) {
          maxScore = score;
          bestIdx = idx;
        }
      }

      return { lineIdx: bestIdx, score: maxScore, matchedTerm: bestTerm };
    };

    let result = searchInCode(targetCode);

    // Fallback to /App.js if not found in current file
    if (result.lineIdx === -1 && targetPath !== '/App.js') {
      const appCode = 
        sandpackBridgeRef.current?.sandpack?.files?.['/App.js']?.code ||
        vfs.readFile('/App.js') ||
        '';
      const appResult = searchInCode(appCode);
      if (appResult.lineIdx !== -1) {
        targetPath = '/App.js';
        setActiveFilePath('/App.js');
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.openFile('/App.js');
        }
        result = appResult;
      }
    }

    if (result.lineIdx !== -1 && result.score >= 20) {
      const lineNumber = result.lineIdx + 1;
      const term = result.matchedTerm;

      toast.success(`🎯 Komponen <${tagName}> ditemukan di ${targetPath} (baris ${lineNumber})!`, {
        id: 'inspect-found',
        icon: '🔍',
        duration: 3500
      });
      setLogs(prev => [...prev, {
        timestamp: new Date(),
        text: `[Inspector] 🎯 Elemen <${tagName}> ditemukan di baris ${lineNumber}`
      }]);

      // 1. Scroll the CodeMirror scroller container to the target position
      const scrollEditor = () => {
        const scroller = document.querySelector('.sp-code-editor .cm-scroller') || document.querySelector('.cm-scroller');
        if (scroller) {
          const sampleLine = document.querySelector('.sp-code-editor .cm-line');
          const lineHeight = sampleLine ? sampleLine.getBoundingClientRect().height : 21;
          const targetY = Math.max(0, (result.lineIdx * lineHeight) - (scroller.clientHeight / 2));
          scroller.scrollTo({
            top: targetY,
            behavior: 'smooth'
          });
        }
      };

      scrollEditor();

      // 2. Highlight line after CodeMirror renders virtual lines
      const highlightTargetLine = (attempt = 0) => {
        const cmLines = document.querySelectorAll('.sp-code-editor .cm-line');
        if (!cmLines || cmLines.length === 0) {
          if (attempt < 5) setTimeout(() => highlightTargetLine(attempt + 1), 100);
          return;
        }

        let targetLine = null;

        // Try to find the rendered line by matched term
        if (term) {
          targetLine = Array.from(cmLines).find(l => l.textContent.includes(term));
        }

        // Try by gutter element line number
        if (!targetLine) {
          const gutters = document.querySelectorAll('.sp-code-editor .cm-gutterElement');
          const targetGutter = Array.from(gutters).find(g => g.textContent.trim() === String(lineNumber));
          if (targetGutter) {
            const gRect = targetGutter.getBoundingClientRect();
            targetLine = Array.from(cmLines).find(l => Math.abs(l.getBoundingClientRect().top - gRect.top) < 8);
          }
        }

        // Retry if virtual DOM not rendered yet
        if (!targetLine && attempt < 3) {
          scrollEditor();
          setTimeout(() => highlightTargetLine(attempt + 1), 150);
          return;
        }

        // Fallback to center line in viewport
        if (!targetLine && cmLines.length > 0) {
          targetLine = cmLines[Math.floor(cmLines.length / 2)];
        }

        if (targetLine) {
          targetLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetLine.style.transition = 'all 0.3s ease';
          targetLine.style.backgroundColor = 'rgba(14, 165, 233, 0.45)';
          targetLine.style.boxShadow = '0 0 24px rgba(56, 189, 248, 0.9)';
          targetLine.style.outline = '2px solid #38bdf8';
          targetLine.style.borderRadius = '4px';

          setTimeout(() => {
            targetLine.style.backgroundColor = 'transparent';
            targetLine.style.boxShadow = 'none';
            targetLine.style.outline = 'none';
          }, 3500);
        }
      };

      setTimeout(() => highlightTargetLine(0), 120);
    } else {
      toast(`🔍 Elemen <${tagName}> dipilih`, { icon: '🎯' });
    }
  }, [activeFilePath, vfs]);

  // Sync inspect mode to preview iframe
  useEffect(() => {
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach(iframe => {
      try {
        iframe.contentWindow?.postMessage({
          type: 'MAVICORE_SET_INSPECT_MODE',
          enabled: isInspectModeActive
        }, '*');
      } catch (_) {}
    });
  }, [isInspectModeActive]);

  // Listen to postMessage from device/companion/iframe
  useEffect(() => {
    const handleDeviceMessage = (event) => {
      if (!event.data) return;
      if (
        event.data.type === 'MAVICORE_DEVICE_ERROR' ||
        event.data.type === 'DEVICE_ERROR' ||
        event.data.type === 'SANDPACK_RUNTIME_ERROR'
      ) {
        const errorMsg = event.data.error || event.data.message || 'Device runtime error';
        handleSandpackError(errorMsg);
      }
      if (event.data.type === 'MAVICORE_ELEMENT_INSPECTED') {
        handleElementInspected(event.data);
      }
    };
    window.addEventListener('message', handleDeviceMessage);
    return () => window.removeEventListener('message', handleDeviceMessage);
  }, [handleSandpackError, handleElementInspected]);

  const handleSandpackLog = useCallback((text) => {
    setLogs(prev => [...prev.slice(-49), { timestamp: new Date(), text }]);
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, internalAiLoading, isLoading]);


  // AI Prompt execution
  const handleChatSubmit = async (promptText) => {
    if (!promptText.trim() || internalAiLoading || isLoading) return;
    const userMsg = promptText.trim();
    setInlinePrompt('');

    // Add user message to chat history
    setChatHistory(prev => [...prev, {
      role: 'user',
      content: userMsg,
      timestamp: new Date()
    }]);

    setLogs(prev => [...prev, { timestamp: new Date(), text: `[AI Request] "${userMsg.slice(0, 60)}..."` }]);

    // Take snapshot before modification
    versionControl.createSnapshot(vfs.getAllFilesRecord(), `Before: ${userMsg.slice(0, 30)}`);

    // If external onPromptSandbox is provided and user didn't request internal multi-file prompt, call it as well
    if (onPromptSandbox) {
      onPromptSandbox(userMsg);
    }

    setInternalAiLoading(true);
    setAiActivity({ stage: 'thinking', message: 'Menganalisis prompt & arsitektur proyek...' });

    try {
      // Dyad CAG: Resolve relevant project files on-demand
      const allFiles = vfs ? vfs.getFileList() : [];
      const relevantFiles = DyadCAGResolver.resolveRelevantFiles(userMsg, allFiles);

      const systemPrompt = AgenticPromptEngine.buildSystemPrompt({
        appMode,
        vfs,
        context: { connectedTable, tables: [], relevantFiles }
      });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg }
      ];

      setAiActivity({ stage: 'generating', message: 'Menghasilkan rencana & file kode...' });
      const fullResponse = await AIProvider.getCompletion(messages);

      // Parse plan, multi-file actions, and Dyad atomic search-replace patches
      const { plan, fileActions } = AgenticPromptEngine.parseResponse(fullResponse);

      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: plan ? `📋 **Rencana AI:**\n${plan}\n\nMenghasilkan ${fileActions.length} perubahan file.` : 'Perubahan kode berhasil dihasilkan!',
        plan,
        fileActions,
        timestamp: new Date()
      }]);

      if (fileActions.length > 0) {
        setPendingFileActions(fileActions);
        setIsReviewModalOpen(true);
      } else {
        toast('AI merespon namun tidak mendeteksi kode yang dapat diubah.');
      }
    } catch (err) {
      console.error('[VibeSandpackViewer AI error]', err);
      toast.error(`Gagal update AI: ${err.message || 'Network error'}`);
      setLogs(prev => [...prev, { timestamp: new Date(), text: `[AI Error] ${err.message}` }]);
    } finally {
      setInternalAiLoading(false);
      setAiActivity(null);
    }
  };

  // Apply AI Changes after review (supports whole-file write and Dyad atomic search-replace patch)
  const handleApplyFileActions = () => {
    if (pendingFileActions.length === 0) return;

    for (const action of pendingFileActions) {
      if (action.action === 'delete') {
        vfs.deleteFile(action.path);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Deleted] ${action.path}` }]);
      } else if (action.action === 'patch' && action.search && action.replace) {
        const existingCode = vfs.readFile(action.path) || '';
        const patchResult = DyadPatchEngine.applySearchReplace(existingCode, action.search, action.replace);
        if (patchResult.success) {
          vfs.writeFile(action.path, patchResult.code);
          setLogs(prev => [...prev, { timestamp: new Date(), text: `[Dyad Patch Applied] ${action.path}` }]);
          if (action.path === '/App.js' || action.path === '/App.jsx') {
            if (onCodeChange) onCodeChange(patchResult.code);
          }
        } else {
          console.warn('[Dyad Patch Fallback]', patchResult.error);
          vfs.writeFile(action.path, action.content || existingCode);
        }
      } else {
        vfs.writeFile(action.path, action.content);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Updated] ${action.path}` }]);
        if (action.path === '/App.js' || action.path === '/App.jsx') {
          vfs.writeFile('/App.js', action.content);
          vfs.writeFile('/App.jsx', action.content);
          if (sandpackBridgeRef.current) {
            sandpackBridgeRef.current.updateFile('/App.js', action.content);
            sandpackBridgeRef.current.updateFile('/App.jsx', action.content);
          }
          if (onCodeChange) onCodeChange(action.content);
        }
      }
    }

    // Refresh files record for Sandpack
    setFilesRecord(vfs.getAllFilesRecord());
    setFileTree(vfs.getFileTree());
    versionControl.createSnapshot(vfs.getAllFilesRecord(), 'Applied AI changes');

    setIsReviewModalOpen(false);
    setPendingFileActions([]);
    toast.success('⚡ Semua perubahan file berhasil diterapkan!');
  };

  const handleRejectFileActions = () => {
    setIsReviewModalOpen(false);
    setPendingFileActions([]);
    toast('Perubahan AI dibatalkan.');
  };

  // Undo AI Change
  const handleUndo = () => {
    const snap = versionControl.undo();
    if (snap) {
      vfs.init(snap.files);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
      const main = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
      if (main && onCodeChange) onCodeChange(main);
      toast.success(`Berhasil membatalkan ke snapshot: ${snap.label}`);
    } else {
      toast('Tidak ada riwayat untuk di-undo.');
    }
  };

  // Auto-Fix Error trigger (Manual button)
  const handleTriggerAutoFix = async () => {
    if (errors.length === 0) {
      toast('Tidak ada error aktif untuk diperbaiki.');
      return;
    }
    autoFixAttemptsRef.current = 0;
    isAutoFixingRef.current = false;
    handleSandpackError(errors[0]);
  };

  // Table Sync
  const handleSyncTable = async () => {
    setIsSyncingTable(true);
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    try {
      const res = await syncVibeAppToTable(mainCode);
      setConnectedTable(res.table);
      setLiveRecordCount(res.recordCount);
      toast.success(
        res.isNew
          ? `Tabel "${res.table.name}" berhasil dibuat di MaviCore dengan ${res.table.fields?.length || 0} kolom!`
          : `Tabel "${res.table.name}" terhubung (${res.recordCount} records tersimpan)!`,
        { duration: 4000 }
      );
    } catch (err) {
      toast.error(`Gagal menghubungkan tabel: ${err.message || 'Database error'}`);
    } finally {
      setIsSyncingTable(false);
    }
  };

  // Deploy to Frontline
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [deployName, setDeployName] = useState('');
  const [deployCategory, setDeployCategory] = useState('Shop Floor');
  const [deployPublish, setDeployPublish] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isSavingApp, setIsSavingApp] = useState(false);

  const handleSaveSandboxApp = async () => {
    setIsSavingApp(true);
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    const cleanName = appName.trim() || 'Sandbox App';
    try {
      const saved = await deployVibeAppToFrontline({
        id: deployedApp?.id,
        name: cleanName,
        category: deployedApp?.category || 'Shop Floor',
        code: mainCode,
        isPublished: deployedApp?.is_published ?? true
      });
      setDeployedApp(saved);
      setAppName(saved.name);
      loadSandboxApps();
      const url = new URL(window.location.href);
      url.searchParams.set('appId', saved.id);
      window.history.pushState({}, '', url.toString());
      toast.success(`💾 Aplikasi "${saved.name}" berhasil disimpan ke Apps Sandbox!`, { duration: 3500, icon: '✅' });
    } catch (err) {
      console.error('Failed to save sandbox app:', err);
      toast.error(`Gagal menyimpan aplikasi: ${err.message || 'Database error'}`);
    } finally {
      setIsSavingApp(false);
    }
  };

  const handleOpenDeployModal = () => {
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    const schema = extractTableSchemaFromCode(mainCode);
    setDeployName(appName !== 'Sandbox' ? appName : (schema.name || 'HMI Stamping Press 04'));
    setIsDeployModalOpen(true);
  };

  const handleConfirmDeploy = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!deployName.trim()) {
      toast.error('Silakan isi nama aplikasi');
      return;
    }
    setIsDeploying(true);
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    try {
      const saved = await deployVibeAppToFrontline({
        id: deployedApp?.id,
        name: deployName.trim(),
        category: deployCategory,
        code: mainCode,
        isPublished: deployPublish
      });
      setDeployedApp(saved);
      loadSandboxApps();
      setIsDeployModalOpen(false);
      toast.success(`🚀 Aplikasi "${saved.name}" berhasil di-deploy ke Frontline Apps!`, { duration: 5000, icon: '🎉' });
    } catch (err) {
      toast.error(`Gagal deploy aplikasi: ${err.message || 'Database error'}`);
    } finally {
      setIsDeploying(false);
    }
  };

  // Copy active code
  const handleCopyCode = async () => {
    try {
      const activeCode = vfs.readFile(activeFilePath) || '';
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      toast.success(`Kode ${activeFilePath} disalin ke clipboard!`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Gagal menyalin kode');
    }
  };

  // Widget Catalog Modal state & Inserter
  const [isWidgetCatalogOpen, setIsWidgetCatalogOpen] = useState(false);

  const handleInsertWidgetCode = (importStatement, sampleSnippet) => {
    let current = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || '';
    if (!current) return;
    
    // 1. Add import statement at top if not present
    if (!current.includes("from './mavicore-ui'") && !current.includes('from "./mavicore-ui"')) {
      current = importStatement + '\n' + current;
    } else {
      const importMatch = importStatement.match(/import\s*\{([^}]+)\}/);
      if (importMatch) {
        const newNames = importMatch[1].split(',').map(s => s.trim());
        current = current.replace(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*mavicore-ui[^'"]*['"]/, (m, existing) => {
          const existingList = existing.split(',').map(s => s.trim());
          const merged = Array.from(new Set([...existingList, ...newNames])).join(', ');
          return `import { ${merged} } from './mavicore-ui'`;
        });
      }
    }
    
    // 2. Insert sample snippet inside the main return JSX before the last closing </div>
    const lastDivIdx = current.lastIndexOf('</div>');
    if (lastDivIdx > 0) {
      current = current.slice(0, lastDivIdx) + '\n      {/* Widget MaviCore UI */}\n      <div className="my-4">\n        ' + sampleSnippet.replace(/\n/g, '\n        ') + '\n      </div>\n' + current.slice(lastDivIdx);
    }
    
    vfs.writeFile('/App.js', current);
    setFilesRecord(vfs.getAllFilesRecord());
    setFileTree(vfs.getFileTree());
    if (sandpackBridgeRef.current) {
      sandpackBridgeRef.current.updateFile('/App.js', current);
    }
    if (onCodeChange) onCodeChange(current);
    setIsWidgetCatalogOpen(false);
    toast.success('Widget berhasil disisipkan ke /App.js!');
  };

  // Switch App Mode (Web vs Mobile)
  const handleSwitchAppMode = (mode) => {
    setAppMode(mode);
    toast(`Beralih ke mode ${mode === 'mobile' ? 'Mobile App (Ionic + Capacitor)' : 'Web App (React + Tailwind)'}`, { icon: '🔄' });
  };

  return (
    <div
      className="w-full h-full flex-1 flex flex-col overflow-hidden"
      style={{
        width: '100%',
        height: '100%',
        minWidth: 0,
        minHeight: 0,
        flex: 1,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column'
      }}
    >

      {/* Hide scrollbar on top navbar */}
      <style>{`
        .vibe-top-navbar::-webkit-scrollbar { display: none; }
        .vibe-top-navbar { -ms-overflow-style: none; scrollbar-width: none; }
        body { margin: 0; padding: 0; overflow: hidden; }
      `}</style>

      {/* ═══════════ TOP NAVBAR ═══════════ */}
      <div className="vibe-top-navbar" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px', height: '48px', minHeight: '48px', flexShrink: 0,
        backgroundColor: '#017E84', borderBottom: '2px solid #014a51',
        color: '#fff', userSelect: 'none', gap: '8px', zIndex: 40,
        position: 'relative', width: '100%', boxSizing: 'border-box',
        overflowX: 'auto', overflowY: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
      }}>
        {/* Left Group: Branding, Editable Name, Mode Switcher, Undo AI */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isStandalone && (
            <a
              href="#/builder"
              title="Kembali ke App Builder PC"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '7px',
                backgroundColor: 'rgba(255,255,255,0.15)', color: '#fff',
                textDecoration: 'none', transition: 'all 0.15s', flexShrink: 0
              }}
            >
              <ArrowLeft size={14} />
            </a>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px',
            borderRadius: '7px',
            backgroundColor: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.15)'
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '5px',
              background: 'linear-gradient(135deg, #f43f5e, #f59e0b, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Sparkles size={11} color="#fff" />
            </div>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px', color: '#fff' }}>
              DYAD STUDIO
            </span>
          </div>

          {/* AI Copilot Panel Toggle - ICON ONLY */}
          <button
            type="button"
            onClick={() => setIsChatPanelOpen(prev => !prev)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              width: '28px', height: '28px', borderRadius: '6px',
              backgroundColor: isChatPanelOpen ? 'rgba(56, 189, 248, 0.25)' : 'rgba(0,0,0,0.22)',
              border: isChatPanelOpen ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
              color: isChatPanelOpen ? '#38bdf8' : '#cbd5e1',
              cursor: 'pointer', transition: 'all 0.15s'
            }}
            title={isChatPanelOpen ? "Dyad Copilot: ON (Klik untuk tutup panel)" : "Dyad Copilot: OFF (Klik untuk buka panel)"}
          >
            <Bot size={14} />
            <span style={{
              position: 'absolute', top: '3px', right: '3px', width: '5px', height: '5px', borderRadius: '50%',
              backgroundColor: isChatPanelOpen ? '#38bdf8' : '#64748b',
              boxShadow: isChatPanelOpen ? '0 0 6px #38bdf8' : 'none'
            }} />
          </button>

          {/* Editable App Name */}
          {isEditingName ? (
            <input
              type="text"
              value={tempAppName}
              onChange={(e) => setTempAppName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === 'Enter') {
                  const newName = tempAppName.trim() || 'Sandbox';
                  setAppName(newName);
                  setIsEditingName(false);
                  if (deployedApp?.id && newName !== deployedApp.name) {
                    try {
                      const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
                      const saved = await deployVibeAppToFrontline({
                        id: deployedApp.id,
                        name: newName,
                        category: deployedApp.category || 'Shop Floor',
                        code: mainCode,
                        isPublished: deployedApp.is_published ?? true
                      });
                      setDeployedApp(saved);
                      loadSandboxApps();
                      toast.success(`Nama aplikasi diubah: "${newName}"`);
                    } catch (_) {}
                  }
                }
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              onBlur={async () => {
                const newName = tempAppName.trim() || 'Sandbox';
                setAppName(newName);
                setIsEditingName(false);
                if (deployedApp?.id && newName !== deployedApp.name) {
                  try {
                    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
                    const saved = await deployVibeAppToFrontline({
                      id: deployedApp.id,
                      name: newName,
                      category: deployedApp.category || 'Shop Floor',
                      code: mainCode,
                      isPublished: deployedApp.is_published ?? true
                    });
                    setDeployedApp(saved);
                    loadSandboxApps();
                    toast.success(`Nama aplikasi diubah: "${newName}"`);
                  } catch (_) {}
                }
              }}
              autoFocus
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(99,102,241,0.5)',
                borderRadius: '6px',
                padding: '3px 7px',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 700,
                outline: 'none',
                maxWidth: '120px'
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => {
                setTempAppName(appName);
                setIsEditingName(true);
              }}
              title="Klik untuk rename app"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '3px 5px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{
                fontWeight: 700, color: '#fff', fontSize: '0.8rem',
                maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {appName}
              </span>
              <PenTool size={11} color="#cbd5e1" />
            </button>
          )}

          {/* Auto-save indicator */}
          {lastSaved && (
            <div style={{
              padding: '2px 6px', borderRadius: '4px',
              backgroundColor: 'rgba(39,174,96,0.3)', border: '1px solid rgba(39,174,96,0.5)',
              color: '#fff', fontSize: '0.65rem', fontWeight: 600
            }}>
              💾
            </div>
          )}

          {/* 1. Mode Switcher (WEB APP vs MOBILE APP) - ICON ONLY */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: '6px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('web')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'web' ? '#0ea5e9' : 'transparent',
                color: appMode === 'web' ? '#fff' : '#94a3b8', transition: 'all 0.15s'
              }}
              title="Web App Mode (React + Tailwind)"
            >
              <Globe size={13} />
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('mobile')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '24px', height: '24px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'mobile' ? '#8b5cf6' : 'transparent',
                color: appMode === 'mobile' ? '#fff' : '#94a3b8', transition: 'all 0.15s'
              }}
              title="Mobile App Mode (Ionic + Capacitor)"
            >
              <Smartphone size={13} />
            </button>
          </div>

          {/* 2. Undo AI button - ICON ONLY */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!versionControl.canUndo()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              backgroundColor: versionControl.canUndo() ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255,255,255,0.06)',
              border: versionControl.canUndo() ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: versionControl.canUndo() ? '#fca5a5' : '#64748b',
              cursor: versionControl.canUndo() ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s'
            }}
            title={versionControl.canUndo() ? "Undo perubahan AI terakhir" : "Belum ada riwayat AI untuk di-undo"}
          >
            <RotateCcw size={13} />
          </button>

          {/* Reset Kosong button - ICON ONLY */}
          <button
            type="button"
            onClick={handleNewBlankApp}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Reset ke Template Kosong Baru"
          >
            <FilePlus size={13} />
          </button>

          {/* Katalog Widget MaviCore UI - ICON ONLY */}
          <button
            type="button"
            onClick={() => setIsWidgetCatalogOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              backgroundColor: 'rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(99, 102, 241, 0.5)',
              color: '#a5b4fc',
              cursor: 'pointer',
              transition: 'all 0.15s'
            }}
            title="Katalog Widget MaviCore UI (Numpad, Quality, SCADA, dll)"
          >
            <Boxes size={13} />
          </button>
        </div>

        {/* Center Group: View Mode + 3. Device Selector + Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* View Mode (Preview / Code / Split) */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.22)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'preview', icon: <Eye size={13} />, label: 'Preview', color: '#3498db' },
              { key: 'code', icon: <Code size={13} />, label: 'Code', color: '#f39c12' },
              { key: 'split', icon: <Columns size={13} />, label: 'Split', color: '#9b59b6' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  setViewMode(item.key);
                  if (item.key === 'preview') {
                    setIsRightPanelOpen(false);
                  } else {
                    setIsRightPanelOpen(true);
                  }
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '3px 7px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === item.key ? item.color : 'transparent',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s'
                }}
                title={`Mode Tampilan: ${item.label}`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 3. Device Selector */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.22)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'responsive', label: 'Auto', icon: <Maximize2 size={12} /> },
              { key: 'desktop', label: 'Desktop', icon: <Monitor size={12} /> },
              { key: 'tablet', label: 'Tablet', icon: <Tablet size={12} /> },
              { key: 'mobile', label: 'Mobile', icon: <Smartphone size={12} /> },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setViewportSize(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '3px 7px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewportSize === item.key ? '#fff' : 'transparent',
                  color: viewportSize === item.key ? '#017E84' : '#fff',
                  fontSize: '0.7rem', fontWeight: viewportSize === item.key ? 700 : 500,
                  transition: 'all 0.15s'
                }}
                title={`Device Viewport: ${item.label}`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Edit Komponen / Inspeksi Layar - ICON ONLY */}
          <button
            type="button"
            onClick={() => {
              setIsInspectModeActive(prev => {
                const nextVal = !prev;
                if (nextVal) {
                  toast('🎯 Mode Inspeksi Aktif: Klik komponen di layar device untuk langsung menuju kodenya!', { icon: '🔍', duration: 4000 });
                }
                return nextVal;
              });
            }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              backgroundColor: isInspectModeActive ? '#0284c7' : 'rgba(0,0,0,0.22)',
              border: isInspectModeActive ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
              color: isInspectModeActive ? '#ffffff' : '#94a3b8',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isInspectModeActive ? '0 0 10px rgba(14, 165, 233, 0.5)' : 'none'
            }}
            title={isInspectModeActive ? "Mode Inspeksi Aktif (Klik komponen di layar)" : "Inspeksi & Edit Komponen Layar"}
          >
            <MousePointerClick size={13} />
          </button>

          {/* Reload - ICON ONLY */}
          <button
            type="button"
            onClick={() => { const ifr = document.querySelector('.sp-preview-iframe'); if (ifr && ifr.contentWindow) ifr.contentWindow.location.reload(); else toast.success('Reloaded'); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', cursor: 'pointer' }}
            title="Reload Preview"
          >
            <RotateCw size={13} />
          </button>
        </div>

        {/* Right Group: 4. Table Sync, 5. Build APK, 6. Frontline Publish, Copy, Close - ICON ONLY */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* 4. Table Sync button - ICON ONLY */}
          <button
            type="button"
            onClick={handleSyncTable}
            disabled={isSyncingTable}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px',
              background: connectedTable ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'rgba(139, 92, 246, 0.25)',
              border: '1px solid rgba(139, 92, 246, 0.5)',
              color: '#c4b5fd',
              cursor: isSyncingTable ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.25)',
              transition: 'all 0.15s'
            }}
            title={isSyncingTable ? 'Menyinkronkan tabel...' : connectedTable ? `Tabel Terhubung: ${connectedTable.name} (Klik untuk resync)` : 'Sinkronisasi Tabel Database MaviCore'}
          >
            <Database size={13} className={isSyncingTable ? 'animate-spin' : ''} />
          </button>

          {/* 5. Build APK button - ICON ONLY */}
          <button
            type="button"
            onClick={() => setIsBuildModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Build Android APK / Capacitor Package"
          >
            <Download size={13} />
          </button>

          {/* Live Real Device (QR Code) button - ICON ONLY */}
          <button
            type="button"
            onClick={handleOpenLiveDevice}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(6, 182, 212, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Buka Aplikasi Langsung di Real Live Device (Scan QR HP)"
          >
            <QrCode size={13} />
          </button>

          {/* Save Sandbox App button - ICON ONLY */}
          <button
            type="button"
            onClick={handleSaveSandboxApp}
            disabled={isSavingApp}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #0284c7, #0369a1)',
              color: '#fff',
              cursor: isSavingApp ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.35)',
              transition: 'all 0.15s'
            }}
            title={deployedApp ? "Simpan perubahan aplikasi saat ini" : "Simpan sebagai aplikasi baru di Apps Sandbox"}
          >
            {isSavingApp ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
          </button>

          {/* Download Project ZIP button (Emergent.sh style export) - ICON ONLY */}
          <button
            type="button"
            onClick={handleDownloadProjectZip}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Download Full Project ZIP (Export untuk VS Code / Cursor)"
          >
            <FolderOpen size={13} />
          </button>

          {/* 6. Frontline Publish button - ICON ONLY */}
          <button
            type="button"
            onClick={handleOpenDeployModal}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Publish ke Frontline Apps untuk Operator Shop Floor"
          >
            <Rocket size={13} />
          </button>

          {/* Copy Code - ICON ONLY */}
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '6px', border: 'none',
              backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff',
              cursor: 'pointer'
            }}
            title="Salin Kode ke Clipboard"
          >
            {copied ? <Check size={13} color="#4ade80" /> : <Copy size={13} />}
          </button>

          {/* Close */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '28px', height: '28px', borderRadius: '6px', border: 'none',
                backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff', cursor: 'pointer'
              }}
              title="Tutup Studio"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ═══════════ MAIN WORKSPACE: DYAD STUDIO 3-PANEL ARCHITECTURE ═══════════ */}
      {/* 1. LEFT: DYAD COPILOT | 2. CENTER: LIVE PREVIEW CANVAS | 3. RIGHT: CODE & FILES */}
      <div className="flex-1 w-full overflow-hidden flex" style={{ minHeight: 0, backgroundColor: '#0b1120' }}>

        {/* ─── 1. LEFT PANEL: DYAD AI COPILOT ─── */}
        <div style={{
          width: isChatPanelOpen ? '410px' : '0px',
          minWidth: isChatPanelOpen ? '360px' : '0px',
          maxWidth: '460px',
          height: '100%',
          transition: 'width 0.22s cubic-bezier(0.4, 0, 0.2, 1), min-width 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0a0f1d',
          borderRight: isChatPanelOpen ? '1px solid #1e293b' : 'none',
          position: 'relative',
          zIndex: 20
        }}>
          {isChatPanelOpen && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Dyad Copilot Top Header Bar */}
              <div style={{
                height: '40px',
                minHeight: '40px',
                backgroundColor: '#070b14',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                color: '#f8fafc',
                userSelect: 'none'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '22px', height: '22px', borderRadius: '6px',
                    background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Sparkles size={12} color="#fff" />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.5px', background: 'linear-gradient(135deg, #38bdf8, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                      DYAD COPILOT
                    </span>
                    <span style={{ fontSize: '0.62rem', color: '#10b981', marginLeft: '6px', fontWeight: 700 }}>
                      ● ACTIVE
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setIsChatPanelOpen(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#94a3b8',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '24px',
                      height: '24px',
                      borderRadius: '5px',
                      transition: 'all 0.15s'
                    }}
                    title="Tutup Panel Copilot (Perbesar Preview)"
                  >
                    <PanelLeftClose size={13} />
                  </button>
                </div>
              </div>

              {/* VibeChatPanel Engine */}
              <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                <VibeChatPanel
                  context={{
                    appName: appName,
                    files: filesRecord,
                    tables: availableTables
                  }}
                  initialPrompt={chatInitialPrompt}
                  onPromptConsumed={() => setChatInitialPrompt('')}
                  settings={null}
                  onCodeGenerated={async (rawCode) => {
                    if (!pipelineRef.current) {
                      pipelineRef.current = new EmergentAgentPipeline({
                        vfs,
                        runtimeManager,
                        versionControl,
                        onStepChange: (step, history) => {
                          setStepHistory(history);
                          setLogs(prev => [...prev, { timestamp: new Date(), text: `[Agent] ${step.label} (${step.status})` }]);
                        },
                        onLog: (entry) => setLogs(prev => [...prev, entry]),
                        onFileWritten: (path, content) => {
                          if (path === '/App.js' || path === '/App.jsx') {
                            lastKnownExternalCodeRef.current = content;
                            if (onCodeChange) onCodeChange(content);
                          }
                        },
                        onTableSync: (table, count) => {
                          setConnectedTable(table);
                          setLiveRecordCount(count);
                          getTables().then(tbls => {
                            if (Array.isArray(tbls)) setAvailableTables(tbls);
                          });
                        }
                      });
                    }

                    try {
                      const res = await pipelineRef.current.execute({
                        rawResponse: rawCode,
                        prompt: inlinePrompt || chatInitialPrompt || appName,
                        sandpackBridge: sandpackBridgeRef.current
                      });

                      setActiveFilePath('/App.js');
                      const updatedFiles = vfs.getAllFilesRecord();
                      setFilesRecord(updatedFiles);
                      setFileTree(vfs.getFileTree());
                      setFilesRevision(prev => prev + 1);
                      setErrors([]);

                      if (sandpackBridgeRef.current) {
                        sandpackBridgeRef.current.openFile?.('/App.js');
                        sandpackBridgeRef.current.runSandpack?.();
                      }

                      try {
                        localStorage.setItem('vibe_sandbox_autosave', res.mainCode);
                        localStorage.setItem('vibe_sandbox_autosave_time', new Date().toISOString());
                      } catch {}

                      toast.success('⚡ Aplikasi Emergent berhasil dieksekusi & live!');
                    } catch (err) {
                      console.error('[Emergent Pipeline Error]', err);
                      toast.error(`Eksekusi gagal: ${err.message}`);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Collapsed Copilot Trigger */}
        {!isChatPanelOpen && (
          <button
            type="button"
            onClick={() => setIsChatPanelOpen(true)}
            style={{
              width: '26px',
              backgroundColor: '#0a0f1d',
              borderRight: '1px solid #1e293b',
              borderLeft: 'none',
              borderTop: 'none',
              borderBottom: 'none',
              color: '#38bdf8',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 0',
              zIndex: 20,
              transition: 'background 0.15s'
            }}
            title="Buka Dyad AI Copilot"
          >
            <Sparkles size={13} />
            <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontSize: '0.66rem', fontWeight: 800, letterSpacing: '1.5px', color: '#94a3b8' }}>
              COPILOT
            </span>
          </button>
        )}

        {/* ─── SANDPACK PROVIDER (WRAPS CENTER PREVIEW & RIGHT CODE STUDIO) ─── */}
        <div className="vibe-sandpack-root flex-1 overflow-hidden flex flex-col" style={{ minWidth: 0, flex: 1, position: 'relative', backgroundColor: '#0f172a' }}>
          <style>{`
            .vibe-sandpack-root .sp-wrapper {
              height: 100% !important;
              flex: 1 1 0% !important;
              display: flex !important;
              flex-direction: column !important;
            }
            .vibe-sandpack-root .sp-layout {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
              --sp-layout-height: 100% !important;
              display: flex !important;
            }
            .vibe-sandpack-root .sp-stack {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
            }
            .vibe-sandpack-root .sp-preview,
            .vibe-sandpack-root .sp-preview-container,
            .vibe-sandpack-root .sp-preview-iframe {
              height: 100% !important;
              min-height: 100% !important;
              flex: 1 1 0% !important;
            }
          `}</style>

          <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f8fafc', border: '1px solid #334155' } }} />

          <SandpackProvider
            key={`${appMode}-${filesRevision}`}
            template="react"
            theme="dark"
            files={sanitizedSandpackFiles}
            customSetup={{
              dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'lucide-react': '^0.344.0',
                'framer-motion': '^10.16.4',
                'clsx': '^2.0.0',
                'tailwind-merge': '^2.0.0'
              }
            }}
            options={{
              activeFile: activeFilePath,
              visibleFiles: [activeFilePath],
              initMode: 'immediate',
              bundlerTimeOut: 60000,
              externalResources: [
                'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css',
                'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
              ]
            }}
          >
            {/* Live in-memory bridge to push generated code instantly without remounting */}
            <SandpackLiveBridge onBridgeReady={handleBridgeReady} />

            {/* Listener capturing Sandpack compilation & runtime errors */}
            <SandpackErrorListener
              onError={handleSandpackError}
              onLog={handleSandpackLog}
            />

            <SandpackLayout style={{ height: '100%', minHeight: '100%', border: 'none', borderRadius: 0, flex: 1, display: 'flex', alignSelf: 'stretch', backgroundColor: '#020617' }}>

              {/* ─── 2. CENTER PANEL: LIVE PREVIEW CANVAS ─── */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div style={{
                  position: 'relative',
                  flex: 1,
                  height: '100%',
                  minHeight: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  backgroundColor: '#030712'
                }}>

                  {/* Dyad Canvas Top Action Floating Strip */}
                  <div style={{
                    width: '100%',
                    height: '38px',
                    backgroundColor: '#0a0f1d',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 12px',
                    flexShrink: 0
                  }}>
                    {/* Viewport indicators */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b' }}>CANVAS:</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase' }}>
                        {viewportSize} {viewportSize === 'mobile' ? '(390 × 820)' : viewportSize === 'tablet' ? '(768 × 1024)' : ''}
                      </span>
                    </div>

                    {/* Quick right side tools */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {viewMode === 'preview' && (
                        <button
                          type="button"
                          onClick={() => { setViewMode('split'); setIsRightPanelOpen(true); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', borderRadius: '5px',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.12)',
                            color: '#cbd5e1', fontSize: '0.68rem', fontWeight: 600,
                            cursor: 'pointer'
                          }}
                          title="Buka Code Editor & File Explorer di panel kanan"
                        >
                          <Code size={11} color="#f59e0b" />
                          <span>Buka Editor & Files</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Device Container Preview Area */}
                  <div style={{
                    flex: 1,
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'auto',
                    padding: viewportSize === 'responsive' ? 0 : '16px',
                    position: 'relative'
                  }}>
                    {/* Floating Inspection Banner */}
                    {isInspectModeActive && (
                      <div style={{
                        position: 'absolute',
                        top: 14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 100,
                        backgroundColor: 'rgba(15, 23, 42, 0.94)',
                        border: '1px solid #0284c7',
                        boxShadow: '0 8px 24px rgba(2, 132, 199, 0.4)',
                        borderRadius: '24px',
                        padding: '6px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: '#38bdf8',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backdropFilter: 'blur(8px)',
                        pointerEvents: 'auto'
                      }}>
                        <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
                        <span>🎯 Mode Inspeksi: Klik komponen di layar untuk langsung meloncat ke kodenya</span>
                        <button
                          type="button"
                          onClick={() => setIsInspectModeActive(false)}
                          style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#94a3b8',
                            borderRadius: '50%',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            fontSize: '10px',
                            marginLeft: '4px'
                          }}
                          title="Tutup mode inspeksi"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    {/* Device Container */}
                    <div style={{
                      width: viewportSize === 'mobile' ? '390px' : (viewportSize === 'tablet' ? '768px' : '100%'),
                      maxWidth: '100%',
                      height: '100%',
                      maxHeight: viewportSize === 'mobile' ? '820px' : (viewportSize === 'tablet' ? '1000px' : '100%'),
                      borderRadius: viewportSize === 'mobile' ? '44px' : (viewportSize === 'tablet' ? '24px' : (viewportSize === 'desktop' ? '12px' : '0')),
                      border: viewportSize === 'mobile' ? '10px solid #1e293b' : (viewportSize === 'tablet' ? '12px solid #1e293b' : (viewportSize === 'desktop' ? '1px solid #1e293b' : 'none')),
                      boxShadow: viewportSize === 'responsive' ? 'none' : '0 25px 60px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      backgroundColor: '#f8fafc',
                      transition: 'width 0.3s ease, max-height 0.3s ease',
                      flexShrink: 0
                    }}>
                      {/* Dynamic Island for Mobile */}
                      {viewportSize === 'mobile' && (
                        <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderBottom: '1px solid rgba(0,0,0,0.05)', flexShrink: 0 }}>
                          <div style={{ width: '92px', height: '18px', backgroundColor: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                            <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#334155' }} />
                          </div>
                        </div>
                      )}

                      {/* Camera Dot for Tablet */}
                      {viewportSize === 'tablet' && (
                        <div style={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#cbd5e1' }} />
                        </div>
                      )}

                      {/* Mac Chrome Bar for Desktop */}
                      {viewportSize === 'desktop' && (
                        <div style={{
                          height: '34px', backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0',
                          display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', flexShrink: 0
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                          </div>
                          <div style={{
                            flex: 1, maxWidth: '480px', margin: '0 auto', height: '22px', backgroundColor: '#f1f5f9',
                            borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center',
                            padding: '0 8px', gap: '6px', fontSize: '0.7rem', color: '#64748b'
                          }}>
                            <Lock size={10} color="#10b981" />
                            <span style={{ color: '#0f172a', fontWeight: 600 }}>https://mavicore.mes</span>
                            <span style={{ color: '#94a3b8' }}>/runtime</span>
                          </div>
                        </div>
                      )}

                      {/* Sandpack Preview */}
                      <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                        {errors.length > 0 && (
                          <div style={{
                            position: 'absolute', top: 12, left: 12, right: 12, zIndex: 999,
                            backgroundColor: 'rgba(15, 23, 42, 0.96)', border: '1px solid #ef4444',
                            backdropFilter: 'blur(12px)', color: '#fff', borderRadius: '12px',
                            padding: '10px 14px', display: 'flex', alignItems: 'center',
                            justifyContent: 'space-between', gap: '12px',
                            boxShadow: '0 12px 30px rgba(239, 68, 68, 0.25)', fontSize: '0.78rem'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                              <span style={{ fontSize: '1.1rem' }}>⚠️</span>
                              <div style={{ overflow: 'hidden' }}>
                                <div style={{ fontWeight: 700, color: '#fca5a5' }}>Syntax / Build Error Terdeteksi</div>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {typeof errors[0] === 'string' ? errors[0].split('\n')[0] : errors[0]?.message}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={isAutoFixing}
                              onClick={handleTriggerAutoFix}
                              style={{
                                backgroundColor: '#ef4444', color: '#ffffff', border: 'none',
                                padding: '7px 14px', borderRadius: '8px', fontWeight: 800,
                                cursor: isAutoFixing ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', gap: '6px',
                                flexShrink: 0, boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                              }}
                            >
                              {isAutoFixing ? <Loader2 size={13} className="animate-spin" /> : <Wrench size={13} />}
                              <span>{isAutoFixing ? 'Memperbaiki...' : '⚡ Auto-Fix Sekarang'}</span>
                            </button>
                          </div>
                        )}
                        <SandpackPreview
                          showOpenInCodeSandbox={false}
                          showRefreshButton={true}
                          style={{ height: '100%', width: '100%', backgroundColor: '#f8fafc' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 3. RIGHT PANEL: CODE EDITOR & FILE EXPLORER STUDIO ─── */}
              {(viewMode === 'split' || viewMode === 'code' || isRightPanelOpen) && (
                <div style={{
                  height: '100%',
                  minHeight: '100%',
                  width: viewMode === 'code' ? '100%' : '520px',
                  minWidth: viewMode === 'code' ? '100%' : '380px',
                  maxWidth: viewMode === 'code' ? '100%' : '650px',
                  display: 'flex',
                  flexDirection: 'column',
                  borderLeft: '1px solid #1e293b',
                  backgroundColor: '#0a0f1d',
                  overflow: 'hidden',
                  zIndex: 10
                }}>
                  {/* Right Studio Header with Dyad-style Sub-Tabs */}
                  <div style={{
                    height: '40px',
                    minHeight: '40px',
                    backgroundColor: '#070b14',
                    borderBottom: '1px solid #1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    userSelect: 'none'
                  }}>
                    {/* Tab Switcher: Files | Code | Split */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', backgroundColor: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: '6px' }}>
                      {[
                        { key: 'editor', label: 'Code Editor', icon: <Code size={12} /> },
                        { key: 'files', label: 'Files', icon: <FolderOpen size={12} /> },
                        { key: 'both', label: 'Split Files + Code', icon: <Columns size={12} /> }
                      ].map(tab => (
                        <button
                          key={tab.key}
                          type="button"
                          onClick={() => setRightPanelTab(tab.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', borderRadius: '4px', border: 'none',
                            backgroundColor: rightPanelTab === tab.key ? '#0284c7' : 'transparent',
                            color: rightPanelTab === tab.key ? '#fff' : '#94a3b8',
                            fontSize: '0.7rem', fontWeight: rightPanelTab === tab.key ? 700 : 500,
                            cursor: 'pointer', transition: 'all 0.15s'
                          }}
                        >
                          {tab.icon}
                          <span>{tab.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Close / Minimize Right Panel */}
                    <button
                      type="button"
                      onClick={() => {
                        setViewMode('preview');
                        setIsRightPanelOpen(false);
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px'
                      }}
                      title="Tutup Editor (Kembali ke Full Preview)"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Body of Right Studio */}
                  <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>

                    {/* File Tree Section (shown in 'files' or 'both' mode) */}
                    {(rightPanelTab === 'files' || rightPanelTab === 'both') && (
                      <div style={{
                        width: rightPanelTab === 'both' ? '210px' : '100%',
                        minWidth: rightPanelTab === 'both' ? '210px' : '100%',
                        borderRight: rightPanelTab === 'both' ? '1px solid #1e293b' : 'none',
                        height: '100%',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <FileTreeExplorer
                          tree={fileTree}
                          activePath={activeFilePath}
                          onSelectFile={(path) => {
                            setActiveFilePath(path);
                            if (sandpackBridgeRef.current) {
                              sandpackBridgeRef.current.openFile(path);
                            }
                          }}
                          onCreateFile={(newPath) => {
                            vfs.writeFile(newPath, '// New file\n');
                            setFilesRecord(vfs.getAllFilesRecord());
                            setFileTree(vfs.getFileTree());
                            setActiveFilePath(newPath);
                          }}
                          onDeleteFile={(delPath) => {
                            vfs.deleteFile(delPath);
                            setFilesRecord(vfs.getAllFilesRecord());
                            setFileTree(vfs.getFileTree());
                            if (activeFilePath === delPath) setActiveFilePath('/App.js');
                          }}
                          onOpenTemplates={() => setIsTemplatesModalOpen(true)}
                          sandboxApps={sandboxAppsList}
                          activeAppId={deployedApp?.id || null}
                          onSelectApp={handleSelectSandboxApp}
                          onDeleteApp={handleDeleteSandboxApp}
                          onNewApp={handleNewBlankApp}
                          isLoadingApps={isLoadingSandboxApps}
                        />
                      </div>
                    )}

                    {/* Code Editor Section (shown in 'editor' or 'both' mode) */}
                    {(rightPanelTab === 'editor' || rightPanelTab === 'both') && (
                      <div style={{
                        flex: 1,
                        minWidth: 0,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                      }}>
                        <SandpackProEditorBar
                          activePath={activeFilePath}
                          onRunCode={handleRunEditorCode}
                          onFormatCode={handleFormatEditorCode}
                          isInspectActive={isInspectModeActive}
                          onToggleInspect={() => setIsInspectModeActive(prev => !prev)}
                        />
                        <SandpackCodeEditor
                          showLineNumbers
                          showInlineErrors
                          wrapContent
                          style={{
                            flex: 1,
                            height: '100%',
                            minHeight: 0,
                            fontFamily: 'monospace',
                            fontSize: '12px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

            </SandpackLayout>
          </SandpackProvider>

          {/* Bottom Terminal & Auto-Fix Panel */}
          <BottomTerminalPanel
            isOpen={isTerminalPanelOpen}
            onToggleOpen={() => setIsTerminalPanelOpen(prev => !prev)}
            logs={logs}
            errors={errors}
            aiActivity={aiActivity}
            stepHistory={stepHistory}
            connectedTable={connectedTable}
            liveRecordCount={liveRecordCount}
            activeEngine={activeEngine}
            onSwitchEngine={(eng) => {
              setActiveEngine(eng);
              try {
                runtimeManager.switchEngine(eng);
                toast.success(`Engine dialihkan ke: ${eng}`);
              } catch (err) {
                toast.error(err.message);
              }
            }}
            onTriggerAutoFix={handleTriggerAutoFix}
            isAutoFixing={isAutoFixing}
            onClearLogs={() => { setLogs([]); setErrors([]); }}
          />
        </div>

      </div>
{/* ═══════════ MODALS ═══════════ */}
      {/* 1. AI Changes Review Modal */}
      <AiChangesReviewModal
        isOpen={isReviewModalOpen}
        fileActions={pendingFileActions}
        onApply={handleApplyFileActions}
        onReject={handleRejectFileActions}
      />

      {/* 2. Manufacturing Templates Modal */}
      <ManufacturingTemplatesModal
        isOpen={isTemplatesModalOpen}
        onClose={() => setIsTemplatesModalOpen(false)}
        onSelectTemplate={(tmpl, options = {}) => {
          setIsTemplatesModalOpen(false);
          if (options.directLoad && tmpl?.code) {
            vfs.writeFile('/App.js', tmpl.code);
            setFilesRecord(vfs.getAllFilesRecord());
            setFileTree(vfs.getFileTree());
            versionControl.createSnapshot(vfs.getAllFilesRecord(), `Loaded PRO Template: ${tmpl.title}`);
            if (onCodeChange) onCodeChange(tmpl.code);
            if (tmpl.title) setAppName(tmpl.title.replace(' (PRO)', ''));
            setLogs(prev => [...prev, { timestamp: new Date(), text: `[PRO Template Loaded] ${tmpl.title}` }]);
            toast.success(`⚡ Berhasil memuat Template PRO: ${tmpl.title}`);
          } else if (tmpl?.prompt) {
            setChatInitialPrompt(tmpl.prompt);
          }
        }}
      />

      {/* 3. Build & Compiler Modal */}
      <BuildModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
        projectFiles={filesRecord}
        appName={appName}
      />

      {/* 4. Deploy to Frontline Modal */}
      {isDeployModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: '1.1rem' }}>Deploy ke Frontline Apps</h3>
            <form onSubmit={handleConfirmDeploy} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>Nama Aplikasi</label>
                <input
                  type="text"
                  value={deployName}
                  onChange={e => setDeployName(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '6px' }}>Kategori</label>
                <select
                  value={deployCategory}
                  onChange={e => setDeployCategory(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', backgroundColor: '#020617', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
                >
                  <option value="Shop Floor">Shop Floor</option>
                  <option value="Quality Control">Quality Control</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Management">Management</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="deployPublishCheck"
                  checked={deployPublish}
                  onChange={e => setDeployPublish(e.target.checked)}
                />
                <label htmlFor="deployPublishCheck" style={{ fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Langsung Publish (Bisa diakses Operator di Player)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem' }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDeploying}
                  style={{
                    padding: '8px 20px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                    cursor: isDeploying ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px'
                  }}
                >
                  {isDeploying ? 'Deploying...' : 'Deploy Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Live Real Device QR Modal (Opens directly on real smartphone) */}
      {isLiveDeviceModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15,23,42,0.82)', backdropFilter: 'blur(6px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.35)', maxWidth: '440px', width: '100%', padding: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '14px', marginBottom: '16px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '12px', backgroundColor: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(8,145,178,0.1)' }}>
                  <Smartphone size={20} />
                </div>
                <div style={{ textAlign: 'left' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1rem', fontWeight: 800 }}>Live Real Device (HP)</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.72rem' }}>Jalankan aplikasi Sandbox langsung di smartphone</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveDeviceModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* App Name Badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '14px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSyncingLiveDevice ? '#f59e0b' : '#10b981' }} />
              <span style={{ maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {isSyncingLiveDevice ? 'Menyinkronkan App...' : (appName || 'Sandbox Live App')}
              </span>
            </div>

            {/* QR Code Container (Crisp Vector SVG) */}
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '16px', border: '2px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0,0,0,0.06)', marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QRCode
                value={getLiveDeviceUrl()}
                size={180}
                level="M"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            {/* Instruction */}
            <p style={{ margin: '0 0 12px', color: '#475569', fontSize: '0.78rem', lineHeight: '1.5', maxWidth: '340px' }}>
              Scan QR code ini menggunakan <strong>kamera HP</strong> untuk membuka aplikasi secara langsung di layar smartphone (edge-to-edge native live device).
            </p>

            {/* Network Host Switcher / Config */}
            <div style={{ width: '100%', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 12px', marginBottom: '14px', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Wifi size={11} color="#0891b2" /> Host URL Perangkat:
                </span>
                <button
                  type="button"
                  onClick={() => setLiveDeviceHost(prev => prev.includes('192.168.100.98') ? window.location.origin : 'http://192.168.100.98:5173')}
                  style={{ background: 'none', border: 'none', color: '#0891b2', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {liveDeviceHost.includes('192.168.100.98') ? 'Ganti ke Localhost' : 'Ganti ke Wi-Fi IP'}
                </button>
              </div>
              <input
                type="text"
                value={liveDeviceHost}
                onChange={e => setLiveDeviceHost(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem', fontFamily: 'monospace', color: '#0f172a', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Copyable Link */}
            <div style={{ width: '100%', display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                readOnly
                value={getLiveDeviceUrl()}
                style={{ flex: 1, padding: '7px 10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '0.72rem', fontFamily: 'monospace', color: '#475569' }}
              />
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(getLiveDeviceUrl());
                  toast.success('Link Real Device berhasil disalin!');
                }}
                style={{ padding: '7px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#0891b2', color: '#fff', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={12} />
                <span>Salin</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => window.open(getLiveDeviceUrl(), '_blank')}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <ExternalLink size={13} />
                <span>Buka di Tab Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setIsLiveDeviceModalOpen(false)}
                style={{ flex: 1, padding: '9px 12px', borderRadius: '10px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Katalog Widget MaviCore UI Modal */}
      <WidgetCatalogModal
        isOpen={isWidgetCatalogOpen}
        onClose={() => setIsWidgetCatalogOpen(false)}
        onInsertCode={handleInsertWidgetCode}
      />

      {/* Incompatible Builder Warning Modal */}
      {incompatibleNotice && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            maxWidth: '500px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '1px solid #334155',
            textAlign: 'center'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(217, 119, 6, 0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              border: '1px solid rgba(217, 119, 6, 0.4)'
            }}>
              <Sparkles size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#f8fafc', margin: '0 0 10px' }}>
              Akses Ditolak: Builder Tidak Kompatibel
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 24px' }}>
              {incompatibleNotice.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setIncompatibleNotice(null);
                  try {
                    const cleanHash = window.location.hash.split('?')[0];
                    window.history.replaceState({}, '', cleanHash);
                  } catch (e) {}
                }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '8px',
                  border: '1px solid #475569',
                  backgroundColor: 'transparent',
                  color: '#cbd5e1',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem'
                }}
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  if (incompatibleNotice?.recommendedUrl) {
                    const targetUrl = incompatibleNotice.recommendedUrl;
                    const cleanRoute = targetUrl.replace(/^\/?#/, '');
                    try {
                      navigate(cleanRoute);
                    } catch (e) {
                      console.warn('[VibeSandpackViewer] Navigate error:', e);
                    }
                    window.location.href = window.location.origin + window.location.pathname + targetUrl;
                    window.location.reload();
                  }
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#d97706',
                  color: 'white',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(217, 119, 6, 0.4)'
                }}
              >
                <ExternalLink size={15} /> Buka di {incompatibleNotice.appBuilderLabel}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
