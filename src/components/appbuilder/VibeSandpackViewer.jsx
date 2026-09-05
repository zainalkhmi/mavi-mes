import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  PenTool
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import toast, { Toaster } from 'react-hot-toast';
import {
  syncVibeAppToTable,
  initVibeMessageListener,
  deployVibeAppToFrontline,
  extractTableSchemaFromCode,
  getTables
} from '../../utils/vibeTableBridge';
import { getFrontlineAppById } from '../../utils/supabaseFrontlineDB';
import { checkBuilderCompatibility, BUILDER_TYPES } from '../../utils/builderType';

import { ProjectFileSystem } from '../../vibe/filesystem/ProjectFileSystem';
import { ProjectVersionControl } from '../../vibe/filesystem/ProjectVersionControl';
import { AIProvider } from '../../vibe/ai/AIProvider';
import { AgenticPromptEngine } from '../../vibe/ai/AgenticPromptEngine';
import { RuntimeManager } from '../../vibe/runtime/RuntimeManager';
import { ErrorFixEngine } from '../../vibe/autofix/ErrorFixEngine';
import { MAVICORE_UIKIT_VIRTUAL_FILE } from '../../vibe/uikit';
import { MAVICORE_SDK_VIRTUAL_FILE } from '../../vibe/sdk';

import FileTreeExplorer from '../../vibe/components/FileTreeExplorer';
import AiChangesReviewModal from '../../vibe/components/AiChangesReviewModal';
import ManufacturingTemplatesModal from '../../vibe/components/ManufacturingTemplatesModal';
import BuildModal from '../../vibe/components/BuildModal';
import VibeChatPanel from '../../vibe/components/VibeChatPanel';
import BottomTerminalPanel from '../../vibe/components/BottomTerminalPanel';
import { cleanVibeCode, healTruncatedReactCode, extractVibeCode, autoFixMissingImports } from '../../vibe/utils/codeCleaner';

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

// Expose globally
window.MaviCoreBridge = MaviCoreBridge;
console.log('[MaviCore] 🔌 Real-time data bridge ready - CRUD operations enabled');
`;

// Default table name for the template
export const DEFAULT_TABLE_NAME = 'Stasiun Assembly A1 Log';

export const DEFAULT_VIBE_HMI_CODE = `import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, CheckCircle2, XCircle, TrendingUp, Users, Settings,
  Bell, ChevronRight, Play, Pause, RotateCcw, Zap, Factory, RefreshCw, Trash2
} from 'lucide-react';

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
                <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span className="text-sm text-slate-500">{isRunning ? 'Lini Aktif - Produksi Normal' : 'Lini Berhenti'}</span>
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="stat-card rounded-2xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '18' }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-semibold">{stat.trend}</span>
              </div>
              <div className="text-3xl font-extrabold text-slate-900 mb-1">{stat.value}</div>
              <div className="text-sm font-medium text-slate-500">{stat.label}</div>
            </motion.div>
          ))}
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
            // Guard: skip if the file in Sandpack already has the exact same content
            const currentCode = sandpackRef.current?.files?.[path]?.code;
            if (currentCode === content) {
              return;
            }
            sandpackRef.current?.updateFile(path, content, true);
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

export default function VibeSandpackViewer({
  code = DEFAULT_VIBE_HMI_CODE,
  onCodeChange = null,
  isFullScreen = false,
  onToggleFullScreen = null,
  onPromptSandbox = null,
  isLoading = false,
  onClose = null,
  isStandalone = false
}) {
  const effectiveInitialCode = code && code.trim().length > 0 ? code : DEFAULT_VIBE_HMI_CODE;
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
          '@ionic/react': '^7.0.0',
          'ionicons': '^7.0.0',
          'lucide-react': 'latest',
          'recharts': 'latest'
        }
      }, null, 2),
      '/mavicore-ui.jsx': MAVICORE_UIKIT_VIRTUAL_FILE,
      '/mavicore-sdk.js': MAVICORE_SDK_VIRTUAL_FILE
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
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempAppName, setTempAppName] = useState('');

  // Sync external code prop if updated externally
  useEffect(() => {
    if (code && code.trim() && code !== lastKnownExternalCodeRef.current) {
      lastKnownExternalCodeRef.current = code;
      vfs.writeFile('/App.js', code);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
      if (sandpackBridgeRef.current) {
        sandpackBridgeRef.current.updateFile('/App.js', code);
      }
    }
  }, [code, vfs]);

  // UI state
  const [viewMode, setViewMode] = useState('preview'); // 'preview' | 'code' | 'split'
  const [viewportSize, setViewportSize] = useState('responsive'); // 'responsive' | 'desktop' | 'tablet' | 'mobile'
  const [copied, setCopied] = useState(false);
  const [connectedTable, setConnectedTable] = useState(null);
  const [isSyncingTable, setIsSyncingTable] = useState(false);
  const [liveRecordCount, setLiveRecordCount] = useState(0);
  const [isCompanionOpen, setIsCompanionOpen] = useState(false);
  const [companionLink, setCompanionLink] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const [incompatibleNotice, setIncompatibleNotice] = useState(null);

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

  // Restore from localStorage on mount (standalone mode only)
  useEffect(() => {
    if (isStandalone) {
      try {
        const saved = localStorage.getItem('vibe_sandbox_autosave');
        if (saved && saved !== effectiveInitialCode) {
          const cleaned = cleanVibeCode(saved);
          if (cleaned && (cleaned.includes('function') || cleaned.includes('const')) && cleaned.includes('return')) {
            vfs.writeFile('/App.js', cleaned);
            setFilesRecord(vfs.getAllFilesRecord());
            setFileTree(vfs.getFileTree());
            if (cleaned !== saved) {
              try { localStorage.setItem('vibe_sandbox_autosave', cleaned); } catch {}
            }
            toast.success('💾 Kode terakhir dipulihkan dari auto-save!');
          } else {
            // Corrupted or truncated saved code, safely reset to clean default code
            localStorage.removeItem('vibe_sandbox_autosave');
            vfs.writeFile('/App.js', DEFAULT_VIBE_HMI_CODE);
            setFilesRecord(vfs.getAllFilesRecord());
            setFileTree(vfs.getFileTree());
          }
        }
      } catch (e) { /* ignore */ }
    }
  }, [isStandalone]);

  // Initialize postMessage listener for real-time data sync
  useEffect(() => {
    const cleanup = initVibeMessageListener((table, record) => {
      setLiveRecordCount(prev => prev + 1);
      // Broadcast to sandbox iframe
      const iframe = document.querySelector('iframe[sandbox]');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'MAVICORE_RECORD_SAVED',
          table: table.name,
          record: record
        }, '*');
      }
    });
    return cleanup;
  }, []);

  // Generate companion link when modal opens
  useEffect(() => {
    if (isCompanionOpen) {
      const code = vfs.readFile('/App.js') || effectiveInitialCode;
      const sessionId = 'vibe_' + Date.now();
      try {
        sessionStorage.setItem(sessionId, code);
      } catch (e) {
        // sessionStorage full, use shorter ID
      }
      const baseUrl = window.location.origin + window.location.pathname;
      setCompanionLink(`${baseUrl}#/player?session=${sessionId}`);
    }
  }, [isCompanionOpen]);

  // Panels state
  const [isFilesPanelOpen, setIsFilesPanelOpen] = useState(true);
  const [isChatPanelOpen, setIsChatPanelOpen] = useState(isStandalone ? false : true);
  const [isTerminalPanelOpen, setIsTerminalPanelOpen] = useState(false);
  const [selectedAIModel, setSelectedAIModel] = useState('MiniMax-M2.7');

  const aiModels = [
    { id: 'MiniMax-M2.7', name: 'MiniMax-M2.7', icon: '🤖', color: '#10b981' },
    { id: 'MiniMax-M1.5', name: 'MiniMax-M1.5', icon: '⚡', color: '#f59e0b' },
    { id: 'GPT-4o', name: 'GPT-4o', icon: '🧠', color: '#6366f1' },
    { id: 'Claude-3.5', name: 'Claude 3.5', icon: '💎', color: '#ec4899' },
  ];

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

  const handleSandpackError = useCallback((err) => {
    setErrors(prev => (prev.includes(err) ? prev : [err, ...prev.slice(0, 4)]));
    setIsTerminalPanelOpen(true);

    // Instant auto-heal for missing imports (e.g. ReferenceError: Trash2 is not defined)
    try {
      const currentCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
      if (currentCode) {
        const importFixed = autoFixMissingImports(currentCode, err);
        if (importFixed && importFixed.trim() !== currentCode.trim()) {
          vfs.writeFile('/App.js', importFixed);
          setFilesRecord(vfs.getAllFilesRecord());
          setFileTree(vfs.getFileTree());
          lastKnownExternalCodeRef.current = importFixed;
          if (sandpackBridgeRef.current) {
            sandpackBridgeRef.current.updateFile('/App.js', importFixed);
          }
          try { localStorage.setItem('vibe_sandbox_autosave', importFixed); } catch {}
          if (onCodeChange) onCodeChange(importFixed);
          setErrors([]);
          setLogs(prev => [...prev, { timestamp: new Date(), text: `[Auto-Fix] ✅ Berhasil menambahkan import otomatis untuk "${err}"` }]);
          toast.success('⚡ Berhasil memperbaiki import yang hilang otomatis!');
        }
      }
    } catch (e) {
      console.warn('Auto-fix missing import failed:', e);
    }
  }, [vfs, onCodeChange]);

  const handleSandpackLog = useCallback((text) => {
    setLogs(prev => [...prev.slice(-49), { timestamp: new Date(), text }]);
  }, []);

  const errorFixEngine = useMemo(() => {
    const engine = new ErrorFixEngine(vfs, runtimeManager, 3);
    engine.onProgress((event) => {
      setAiActivity(event);
      if (event.message) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Auto-Fix] ${event.message}` }]);
      }
      if (event.stage === 'success') {
        const updatedFiles = vfs.getAllFilesRecord();
        setFilesRecord(updatedFiles);
        setFileTree(vfs.getFileTree());
        const appCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
        if (appCode) {
          lastKnownExternalCodeRef.current = appCode;
          if (sandpackBridgeRef.current) {
            sandpackBridgeRef.current.updateFile('/App.js', appCode);
          }
          try { localStorage.setItem('vibe_sandbox_autosave', appCode); } catch {}
          if (onCodeChange) onCodeChange(appCode);
        }
        setErrors([]);
        setIsAutoFixing(false);
        toast.success(event.message);
      } else if (event.stage === 'error' || event.stage === 'failed') {
        setIsAutoFixing(false);
        toast.error(event.message);
      }
    });
    return engine;
  }, [vfs, runtimeManager]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, internalAiLoading, isLoading]);

  // Listen to postMessage from Sandpack to MaviCore table storage
  useEffect(() => {
    const cleanup = initVibeMessageListener((table) => {
      setConnectedTable(table);
      setLiveRecordCount(c => c + 1);
      setLogs(prev => [...prev, { timestamp: new Date(), text: `[Table Synced] Record baru tersimpan di tabel "${table.name}"` }]);
    });
    return cleanup;
  }, []);

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
      const systemPrompt = AgenticPromptEngine.buildSystemPrompt({
        appMode,
        vfs,
        context: { connectedTable, tables: [] }
      });

      const messages = [
        { role: 'system', content: systemPrompt },
        ...chatHistory.slice(-4).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg }
      ];

      setAiActivity({ stage: 'generating', message: 'Menghasilkan rencana & file kode...' });
      const fullResponse = await AIProvider.getCompletion(messages);

      // Parse plan and file actions
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

  // Apply AI Changes after review
  const handleApplyFileActions = () => {
    if (pendingFileActions.length === 0) return;

    for (const action of pendingFileActions) {
      if (action.action === 'delete') {
        vfs.deleteFile(action.path);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Deleted] ${action.path}` }]);
      } else {
        vfs.writeFile(action.path, action.content);
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[File Updated] ${action.path}` }]);
        if (action.path === '/App.js' || action.path === '/App.jsx') {
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

  // Auto-Fix Error trigger
  const handleTriggerAutoFix = async () => {
    setIsAutoFixing(true);
    setLogs(prev => [...prev, { timestamp: new Date(), text: '[Auto-Fix] Memulai pemeriksaan dan perbaikan error...' }]);

    // 1. Instant heuristic syntax auto-heal
    const currentCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx');
    if (currentCode) {
      const healed = healTruncatedReactCode(currentCode);
      if (healed && healed.trim() !== currentCode.trim()) {
        vfs.writeFile('/App.js', healed);
        const updatedFiles = vfs.getAllFilesRecord();
        setFilesRecord(updatedFiles);
        setFileTree(vfs.getFileTree());
        lastKnownExternalCodeRef.current = healed;
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.updateFile('/App.js', healed);
        }
        try { localStorage.setItem('vibe_sandbox_autosave', healed); } catch {}
        if (onCodeChange) onCodeChange(healed);
        setErrors([]);
        setIsAutoFixing(false);
        setLogs(prev => [...prev, { timestamp: new Date(), text: '[Auto-Fix] ✅ Syntax Healer berhasil memulihkan kode secara instan!' }]);
        toast.success('⚡ Error sintaks berhasil dipulihkan otomatis!');
        return;
      }
    }

    // 1.5. Instant heuristic missing imports auto-heal
    if (currentCode && errors.length > 0) {
      const importFixed = autoFixMissingImports(currentCode, errors[0]);
      if (importFixed && importFixed.trim() !== currentCode.trim()) {
        vfs.writeFile('/App.js', importFixed);
        const updatedFiles = vfs.getAllFilesRecord();
        setFilesRecord(updatedFiles);
        setFileTree(vfs.getFileTree());
        lastKnownExternalCodeRef.current = importFixed;
        if (sandpackBridgeRef.current) {
          sandpackBridgeRef.current.updateFile('/App.js', importFixed);
        }
        try { localStorage.setItem('vibe_sandbox_autosave', importFixed); } catch {}
        if (onCodeChange) onCodeChange(importFixed);
        setErrors([]);
        setIsAutoFixing(false);
        setLogs(prev => [...prev, { timestamp: new Date(), text: '[Auto-Fix] ✅ Berhasil mengimpor identifier yang belum terdefinisi secara instan!' }]);
        toast.success('⚡ Error import berhasil dipulihkan otomatis!');
        return;
      }
    }

    // 2. If errors array is empty and code couldn't be healed
    if (errors.length === 0) {
      setIsAutoFixing(false);
      toast('Tidak ada error aktif untuk diperbaiki.');
      return;
    }

    // 3. AI Error Fix Engine
    errorFixEngine.attemptAutoFix(errors[0], activeFilePath);
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
  const [deployedApp, setDeployedApp] = useState(null);

  const handleOpenDeployModal = () => {
    const mainCode = vfs.readFile('/App.js') || vfs.readFile('/App.jsx') || effectiveInitialCode;
    const schema = extractTableSchemaFromCode(mainCode);
    setDeployName(schema.name || 'HMI Stamping Press 04');
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

  // Switch App Mode (Web vs Mobile)
  const handleSwitchAppMode = (mode) => {
    setAppMode(mode);
    toast(`Beralih ke mode ${mode === 'mobile' ? 'Mobile App (Ionic + Capacitor)' : 'Web App (React + Tailwind)'}`, { icon: '🔄' });
  };

  return (
    <div className={isStandalone ? "w-screen h-screen flex flex-col" : "w-full h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl"} style={isStandalone ? { backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column' } : { minHeight: 0, height: '100%' }}>

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
            width: '28px', height: '28px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #f43f5e, #f59e0b, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <Sparkles size={13} color="#fff" />
          </div>



          {/* Editable App Name */}
          {isEditingName ? (
            <input
              type="text"
              value={tempAppName}
              onChange={(e) => setTempAppName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newName = tempAppName.trim() || 'Sandbox';
                  setAppName(newName);
                  setIsEditingName(false);
                }
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                }
              }}
              onBlur={() => {
                const newName = tempAppName.trim() || 'Sandbox';
                setAppName(newName);
                setIsEditingName(false);
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

          {/* 1. Mode Switcher (WEB APP vs MOBILE APP) */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: '7px', padding: '2px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('web')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'web' ? '#0ea5e9' : 'transparent',
                color: '#fff', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s'
              }}
              title="Web App Mode (React + Tailwind)"
            >
              <Globe size={12} />
              <span>WEB APP</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchAppMode('mobile')}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '3px 8px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                backgroundColor: appMode === 'mobile' ? '#8b5cf6' : 'transparent',
                color: '#fff', fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.15s'
              }}
              title="Mobile App Mode (Ionic + Capacitor)"
            >
              <Smartphone size={12} />
              <span>MOBILE APP</span>
            </button>
          </div>

          {/* 2. Undo AI button */}
          <button
            type="button"
            onClick={handleUndo}
            disabled={!versionControl.canUndo()}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 8px', borderRadius: '6px',
              backgroundColor: versionControl.canUndo() ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.06)',
              border: versionControl.canUndo() ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(255,255,255,0.1)',
              color: versionControl.canUndo() ? '#fca5a5' : '#94a3b8',
              cursor: versionControl.canUndo() ? 'pointer' : 'not-allowed',
              fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s'
            }}
            title={versionControl.canUndo() ? "Undo perubahan kode AI terakhir" : "Belum ada riwayat AI untuk di-undo"}
          >
            <RotateCcw size={12} />
            <span>Undo AI</span>
          </button>

          <button
            type="button"
            onClick={() => {
              vfs.writeFile('/App.js', DEFAULT_VIBE_HMI_CODE);
              setFilesRecord(vfs.getAllFilesRecord());
              setFileTree(vfs.getFileTree());
              setErrors([]);
              try { localStorage.removeItem('vibe_sandbox_autosave'); } catch {}
              toast.success('Template awal berhasil dimuat ulang!');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '4px 8px', borderRadius: '6px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s'
            }}
            title="Reset ke template bawaan yang bersih & stabil"
          >
            <RotateCcw size={12} />
            <span>Reset App</span>
          </button>
        </div>

        {/* Center Group: View Mode + 3. Device Selector + Reload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* View Mode (Preview / Code / Split) */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.22)', padding: '2px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { key: 'preview', icon: <Eye size={13} />, label: 'Preview', color: '#3498db' },
              { key: 'code', icon: <Code size={13} />, label: 'Code', color: '#f39c12' },
              { key: 'split', icon: <Columns size={13} />, label: 'Split', color: '#9b59b6' },
            ].map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setViewMode(item.key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '3px',
                  padding: '3px 7px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewMode === item.key ? item.color : 'transparent',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s'
                }}
                title={`Mode tampilan: ${item.label}`}
              >
                {item.icon}
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            ))}
          </div>

          {/* 3. Device Selector */}
          <div style={{ display: 'flex', backgroundColor: 'rgba(0,0,0,0.22)', padding: '2px', borderRadius: '7px', border: '1px solid rgba(255,255,255,0.08)' }}>
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
                  padding: '3px 7px', borderRadius: '5px', border: 'none', cursor: 'pointer',
                  backgroundColor: viewportSize === item.key ? '#fff' : 'transparent',
                  color: viewportSize === item.key ? '#017E84' : '#fff',
                  fontSize: '0.7rem', fontWeight: viewportSize === item.key ? 700 : 500,
                  transition: 'all 0.15s'
                }}
                title={`Device Viewport: ${item.label}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Reload */}
          <button
            type="button"
            onClick={() => { const ifr = document.querySelector('.sp-preview-iframe'); if (ifr && ifr.contentWindow) ifr.contentWindow.location.reload(); else toast.success('Reloaded'); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: 'none', backgroundColor: 'rgba(0,0,0,0.2)', color: '#fff', cursor: 'pointer' }}
            title="Reload Preview"
          >
            <RotateCw size={12} />
          </button>
        </div>

        {/* Right Group: 4. Table Sync, 5. Build APK, 6. Frontline Publish, Companion, Copy, Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          {/* Companion QR */}
          <button
            type="button"
            onClick={() => setIsCompanionOpen(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '6px', border: 'none', background: 'linear-gradient(135deg, #00b894, #00cec9)', color: '#fff', cursor: 'pointer' }}
            title="Companion - QR Code Live Preview di HP"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/>
              <rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/>
            </svg>
          </button>

          {/* 4. Table Sync button */}
          <button
            type="button"
            onClick={handleSyncTable}
            disabled={isSyncingTable}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: '6px', border: 'none',
              background: connectedTable ? 'linear-gradient(135deg, #7c3aed, #6d28d9)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: '#fff', fontSize: '0.72rem', fontWeight: 700,
              cursor: isSyncingTable ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 6px rgba(139, 92, 246, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Sinkronisasi Tabel Database MaviCore"
          >
            <Database size={12} className={isSyncingTable ? 'animate-spin' : ''} />
            <span>{isSyncingTable ? 'Syncing...' : connectedTable ? `Sync: ${connectedTable.name}` : 'Table Sync'}</span>
          </button>

          {/* 5. Build APK button */}
          <button
            type="button"
            onClick={() => setIsBuildModalOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 11px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #f97316, #ea580c)',
              color: '#fff', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(249, 115, 22, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Build Android APK / Capacitor Package"
          >
            <Smartphone size={12} />
            <span>Build APK</span>
          </button>

          {/* 6. Frontline Publish button */}
          <button
            type="button"
            onClick={handleOpenDeployModal}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 12px', borderRadius: '6px', border: 'none',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Publish ke Frontline Apps untuk Operator Shop Floor"
          >
            <Rocket size={12} />
            <span>Frontline Publish</span>
          </button>

          {/* Copy Code */}
          <button
            type="button"
            onClick={handleCopyCode}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              padding: '5px 8px', borderRadius: '6px', border: 'none',
              backgroundColor: 'rgba(0,0,0,0.25)', color: '#fff',
              cursor: 'pointer', fontSize: '0.7rem'
            }}
            title="Salin Kode ke Clipboard"
          >
            {copied ? <Check size={12} color="#4ade80" /> : <Copy size={12} />}
            <span>{copied ? 'Disalin' : 'Copy'}</span>
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

      {/* ═══════════ MAIN WORKSPACE (LEFT FILES + CENTER SANDPACK + RIGHT COPILOT) ═══════════ */}
      <div className="flex-1 w-full overflow-hidden flex" style={{ minHeight: 0, backgroundColor: '#0f172a' }}>

        {/* 1. LEFT FILE TREE PANEL (Collapsible) */}
        <div style={{
          width: isFilesPanelOpen ? '200px' : '0px',
          minWidth: isFilesPanelOpen ? '200px' : '0px',
          transition: 'width 0.2s ease, min-width 0.2s ease',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {isFilesPanelOpen && (
            <FileTreeExplorer
              tree={fileTree}
              activePath={activeFilePath}
              onSelectFile={(path) => setActiveFilePath(path)}
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
            />
          )}
        </div>

        {/* Toggle Files Panel button */}
        <button
          type="button"
          onClick={() => setIsFilesPanelOpen(v => !v)}
          style={{
            width: '18px', backgroundColor: '#0a0f1d', borderRight: '1px solid #1e293b',
            borderLeft: 'none', borderTop: 'none', borderBottom: 'none',
            color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
          title={isFilesPanelOpen ? 'Tutup File Explorer' : 'Buka File Explorer'}
        >
          {isFilesPanelOpen ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
        </button>

        {/* 2. CENTER: SANDPACK EDITOR + LIVE PREVIEW */}
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
            files={filesRecord}
            customSetup={{
              dependencies: {
                'react': '^18.2.0',
                'react-dom': '^18.2.0',
                'react-is': '^18.2.0',
                // NextUI + Framer Motion
                '@nextui-org/react': '^2.2.0',
                'framer-motion': '^10.16.0',
                // Icons & Utilities
                'lucide-react': 'latest',
                'clsx': '^2.0.0',
                'tailwind-merge': '^2.0.0',
                'class-variance-authority': '^0.7.0',
                // Charts
                'recharts': '^2.10.0',
                // Tailwind CSS
                'tailwindcss': '^3.4.0',
                'autoprefixer': '^10.4.0',
                'postcss': '^8.4.0'
              }
            }}
            options={{
              activeFile: activeFilePath,
              visibleFiles: [activeFilePath],
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

            <SandpackLayout style={{ height: '100%', minHeight: '100%', border: 'none', borderRadius: 0, flex: 1, display: 'flex', alignSelf: 'stretch' }}>
              {(viewMode === 'split' || viewMode === 'code') && (
                <SandpackCodeEditor
                  showLineNumbers
                  showInlineErrors
                  wrapContent
                  style={{
                    height: '100%',
                    minHeight: '100%',
                    width: viewMode === 'code' ? '100%' : '42%',
                    fontFamily: 'monospace',
                    fontSize: '12px'
                  }}
                />
              )}

              {(viewMode === 'split' || viewMode === 'preview') && (
                <div style={{
                  position: 'relative',
                  flex: 1,
                  height: '100%',
                  minHeight: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'auto',
                  backgroundColor: '#020617',
                  padding: viewportSize === 'responsive' ? 0 : '16px'
                }}>
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
            onTriggerAutoFix={handleTriggerAutoFix}
            isAutoFixing={isAutoFixing}
            onClearLogs={() => { setLogs([]); setErrors([]); }}
          />
        </div>

        {/* RIGHT PANEL: VIBECHAT STREAMING */}
        {isStandalone && (
          <div style={{
            width: '420px',
            minWidth: '380px',
            maxWidth: '480px',
            height: '100%',
            borderLeft: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0,
            overflow: 'hidden',
            backgroundColor: '#0f172a'
          }}>
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
                let code = cleanVibeCode(rawCode);

                // Safeguard: If code starts with `return (` without a function wrapper, wrap it
                if (/^\s*return\s*\(/.test(code) && !/function\s+\w+\s*\(|=>\s*\(?|export\s+default|const\s+\w+\s*=\s*\(/i.test(code.slice(0, 100))) {
                  code = `export default function App() {\n  ${code}\n}`;
                  console.log('[Sandbox] Wrapped orphan `return (` in function App()');
                }

                vfs.writeFile('/App.js', code);
                lastKnownExternalCodeRef.current = code;
                setFilesRecord(vfs.getAllFilesRecord());
                setFilesRevision(prev => prev + 1);
                setErrors([]);

                // ⚡ Instantly update Sandpack in-memory instance & live device screen!
                if (sandpackBridgeRef.current) {
                  sandpackBridgeRef.current.updateFile('/App.js', code);
                  sandpackBridgeRef.current.openFile('/App.js');
                  sandpackBridgeRef.current.runSandpack?.();
                }

                try {
                  localStorage.setItem('vibe_sandbox_autosave', code);
                  localStorage.setItem('vibe_sandbox_autosave_time', new Date().toISOString());
                } catch {}

                if (onCodeChange) onCodeChange(code);

                toast.success('⚡ Kode berhasil diterapkan ke layar device!');
                try {
                  const res = await syncVibeAppToTable(code);
                  if (res?.table) {
                    setConnectedTable(res.table);
                    setLiveRecordCount(res.recordCount);
                    toast.success(
                      res.isNew
                        ? `Tabel "${res.table.name}" berhasil dibuat di Database MaviCore!`
                        : `Tabel "${res.table.name}" tersinkronisasi (${res.recordCount} data tersimpan)!`,
                      { duration: 4000 }
                    );
                    getTables().then(tbls => {
                      if (Array.isArray(tbls)) setAvailableTables(tbls);
                    });
                  }
                } catch (syncErr) {
                  console.warn('Auto table sync error:', syncErr);
                }
              }}
            />
          </div>
        )}
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
        onSelectTemplate={(tmpl) => {
          setIsTemplatesModalOpen(false);
          if (tmpl?.prompt) {
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

      {/* 3. Companion - QR Code Modal */}
      {isCompanionOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '24px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>📱</span> Device Companion
              </h3>
              <button type="button" onClick={() => setIsCompanionOpen(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            {/* QR Code Section */}
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
              {/* QR Code */}
              <div style={{ flex: '0 0 auto', backgroundColor: '#fff', padding: '12px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                <QRCodeCanvas
                  value={companionLink || window.location.origin}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#000000"
                  level="M"
                  includeMargin={true}
                />
              </div>

              {/* Instructions */}
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 12px', color: '#fff', fontSize: '0.95rem' }}>Cara Pakai:</h4>
                <ol style={{ margin: 0, paddingLeft: '16px', color: '#94a3b8', fontSize: '0.82rem', lineHeight: '1.8' }}>
                  <li>Buka <strong style={{ color: '#00cec9' }}>kamera HP</strong> atau <strong style={{ color: '#00cec9' }}>QR scanner</strong></li>
                  <li>Arahkan ke <strong style={{ color: '#fff' }}>QR Code</strong> di samping</li>
                  <li>T tap link yang muncul</li>
                  <li>App akan terbuka di <strong style={{ color: '#fff' }}>browser HP</strong></li>
                </ol>

                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'rgba(0,206,201,0.1)', borderRadius: '8px', border: '1px solid rgba(0,206,201,0.3)' }}>
                  <p style={{ margin: 0, color: '#00cec9', fontSize: '0.78rem' }}>
                    💡 <strong>Tips:</strong> Simpan link ini untuk akses cepat dari HP!
                  </p>
                </div>

                {/* Direct Link */}
                <div style={{ marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(companionLink || window.location.origin);
                      toast.success('Link copied!');
                    }}
                    style={{
                      padding: '8px 16px', borderRadius: '8px',
                      background: 'linear-gradient(135deg, #00b894, #00cec9)',
                      border: 'none', color: '#fff', fontSize: '0.8rem', fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                  >
                    📋 Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <label htmlFor="deployPublishCheck" style={{ fontSize: '0.78rem', color: '#cbd5e1', cursor: 'pointer' }}>
                  Publikasikan langsung ke operator shop floor
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsDeployModalOpen(false)} style={{ padding: '8px 16px', borderRadius: '8px', backgroundColor: '#1e293b', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Batal</button>
                <button type="submit" disabled={isDeploying} style={{ padding: '8px 20px', borderRadius: '8px', backgroundColor: '#2563eb', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
                  {isDeploying ? 'Deploying...' : 'Deploy Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                onClick={() => setIncompatibleNotice(null)}
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
                  window.location.href = incompatibleNotice.recommendedUrl;
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
