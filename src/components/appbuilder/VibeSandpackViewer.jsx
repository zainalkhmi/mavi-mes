import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import toast from 'react-hot-toast';
import {
  syncVibeAppToTable,
  initVibeMessageListener,
  deployVibeAppToFrontline,
  extractTableSchemaFromCode,
  getTables
} from '../../utils/vibeTableBridge';

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
  Bell, ChevronRight, Play, Pause, RotateCcw, Zap, Factory, RefreshCw
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

  return { records, loading };
}

// ─── Tailwind CSS Styles ───
const styles = \`
@import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

* { font-family: 'Inter', system-ui, sans-serif; }

body {
  background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%);
  min-height: 100vh;
  margin: 0;
  color: #f8fafc;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
}

.glow-green { box-shadow: 0 0 40px rgba(16, 185, 129, 0.3); }
.glow-red { box-shadow: 0 0 40px rgba(239, 68, 68, 0.3); }
.glow-purple { box-shadow: 0 0 40px rgba(139, 92, 246, 0.3); }

.stat-card {
  background: linear-gradient(135deg, rgba(30, 30, 50, 0.8), rgba(20, 20, 40, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  border-color: rgba(139, 92, 246, 0.5);
}

.btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 30px rgba(99, 102, 241, 0.4);
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
  const { records: productionLogs, loading: isLoadingLogs } = useMaviCoreData(TABLE_NAME);

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
        operator: 'Auto Logged'
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
      <div className="min-h-screen p-6">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Stasiun Assembly A1</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-green-500 pulse-dot" />
                <span className="text-sm text-gray-400">{isRunning ? 'Lini Aktif - Produksi Normal' : 'Lini Berhenti'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Sync Status */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
              <span className={\`w-2 h-2 rounded-full \${isLoadingLogs ? 'bg-yellow-500 animate-spin' : 'bg-green-500'}\`} />
              <span className="text-xs text-gray-400">
                {isLoadingLogs ? 'Syncing...' : lastSync ? 'Synced' : 'Ready'}
              </span>
              {lastSync && (
                <span className="text-xs text-gray-500">
                  {lastSync.toLocaleTimeString()}
                </span>
              )}
            </div>
            <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Bell className="w-5 h-5 text-gray-400" />
            </button>
            <button className="p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Settings className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-white/5 rounded-2xl w-fit">
          {['overview', 'production', 'quality'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab)}
              className={\`px-6 py-2 rounded-xl text-sm font-medium transition-all \${selectedTab === tab ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}\`}
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
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: stat.color + '20' }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400 font-medium">{stat.trend}</span>
              </div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
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
            className="glass-card glow-green p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Produksi Sesuai (OK)</h3>
                <p className="text-sm text-gray-400 mt-1">Part yang memenuhi standar kualitas</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={productionCount}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-white text-center mb-6"
              >
                {productionCount.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <button
              onClick={handleLogProduction}
              className="btn-primary w-full py-4 rounded-2xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Catat Part OK
            </button>
          </motion.div>

          {/* Defect Card */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card glow-red p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white">Produksi Cacat (NG)</h3>
                <p className="text-sm text-gray-400 mt-1">Part yang tidak memenuhi standar</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-400" />
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={rejectCount}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-6xl font-black text-white text-center mb-6"
              >
                {rejectCount.toLocaleString()}
              </motion.div>
            </AnimatePresence>
            <button
              onClick={handleLogReject}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/30 transition"
            >
              <XCircle className="w-5 h-5" />
              Catat NG
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
              <h4 className="text-sm font-semibold text-white">Real-time Log</h4>
              <span className="text-xs text-gray-500">{productionLogs.length} records</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {productionLogs.slice(0, 5).map((record, i) => (
                <div key={i} className="flex items-center gap-3 text-xs">
                  <span className={\`px-2 py-0.5 rounded-full text-xs font-medium \${record.type === 'OK' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}\`}>
                    {record.type}
                  </span>
                  <span className="text-gray-500">{new Date(record.timestamp).toLocaleTimeString()}</span>
                  <span className="text-gray-400 flex-1">{record.station || 'Assembly A1'}</span>
                  {/* Delete Button */}
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
  const prevErrorsRef = useRef([]);

  useEffect(() => {
    const errs = sandpack?.errors || [];
    if (errs.length > 0 && JSON.stringify(errs) !== JSON.stringify(prevErrorsRef.current)) {
      prevErrorsRef.current = errs;
      const first = errs[0];
      const msg = typeof first === 'string' ? first : first.message || JSON.stringify(first);
      if (onError) onError(msg);
      if (onLog) onLog(`[Sandpack Error] ${msg}`);
    }
  }, [sandpack?.errors, onError, onLog]);

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
  background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 45%, #0b0f19 100%);
  color: #f8fafc;
  -webkit-font-smoothing: antialiased;
}
button {
  font-family: inherit;
}
/* Beautiful Industrial UI Utilities */
.glass-panel {
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1);
}
.btn-ok {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  border: 1px solid rgba(52, 211, 153, 0.4);
  color: #ffffff;
}
.btn-ok:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
}
.btn-ng {
  background: linear-gradient(135deg, #f43f5e 0%, #dc2626 100%);
  box-shadow: 0 6px 20px rgba(244, 63, 94, 0.4);
  border: 1px solid rgba(251, 113, 133, 0.4);
  color: #ffffff;
}
.btn-ng:hover {
  transform: translateY(-1px) scale(1.02);
  box-shadow: 0 8px 25px rgba(244, 63, 94, 0.5);
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
  const [activeFilePath, setActiveFilePath] = useState('/App.js');
  const [fileTree, setFileTree] = useState(() => vfs.getFileTree());
  const [appMode, setAppMode] = useState('web'); // 'web' | 'mobile'
  const [appName, setAppName] = useState('Sandbox');
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempAppName, setTempAppName] = useState('');

  // Sync external code prop if updated externally
  useEffect(() => {
    if (code && code.trim() && code !== vfs.readFile('/App.js')) {
      vfs.writeFile('/App.js', code);
      setFilesRecord(vfs.getAllFilesRecord());
      setFileTree(vfs.getFileTree());
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
          vfs.writeFile('/App.js', saved);
          setFilesRecord(vfs.getAllFilesRecord());
          setFileTree(vfs.getFileTree());
          toast.success('💾 Kode terakhir dipulihkan dari auto-save!');
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

  const errorFixEngine = useMemo(() => {
    const engine = new ErrorFixEngine(vfs, runtimeManager, 3);
    engine.onProgress((event) => {
      setAiActivity(event);
      if (event.message) {
        setLogs(prev => [...prev, { timestamp: new Date(), text: `[Auto-Fix] ${event.message}` }]);
      }
      if (event.stage === 'success') {
        setFilesRecord(vfs.getAllFilesRecord());
        setFileTree(vfs.getFileTree());
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
  const handleTriggerAutoFix = () => {
    if (errors.length === 0) {
      toast('Tidak ada error aktif untuk diperbaiki.');
      return;
    }
    setIsAutoFixing(true);
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

          <SandpackProvider
            key={activeFilePath + Object.keys(filesRecord).length}
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
            {/* Listener capturing Sandpack compilation & runtime errors */}
            <SandpackErrorListener
              onError={(err) => {
                setErrors(prev => [err, ...prev.slice(0, 4)]);
                setIsTerminalPanelOpen(true);
              }}
              onLog={(text) => {
                setLogs(prev => [...prev, { timestamp: new Date(), text }]);
              }}
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
                    backgroundColor: '#030712',
                    transition: 'width 0.3s ease, max-height 0.3s ease',
                    flexShrink: 0
                  }}>
                    {/* Dynamic Island for Mobile */}
                    {viewportSize === 'mobile' && (
                      <div style={{ height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
                        <div style={{ width: '92px', height: '18px', backgroundColor: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0284c7' }} />
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#334155' }} />
                        </div>
                      </div>
                    )}

                    {/* Camera Dot for Tablet */}
                    {viewportSize === 'tablet' && (
                      <div style={{ height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#030712', flexShrink: 0 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#334155' }} />
                      </div>
                    )}

                    {/* Mac Chrome Bar for Desktop */}
                    {viewportSize === 'desktop' && (
                      <div style={{
                        height: '34px', backgroundColor: '#0f172a', borderBottom: '1px solid #1e293b',
                        display: 'flex', alignItems: 'center', padding: '0 12px', gap: '12px', flexShrink: 0
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                        </div>
                        <div style={{
                          flex: 1, maxWidth: '480px', margin: '0 auto', height: '22px', backgroundColor: '#030712',
                          borderRadius: '6px', border: '1px solid #1e293b', display: 'flex', alignItems: 'center',
                          padding: '0 8px', gap: '6px', fontSize: '0.7rem', color: '#94a3b8'
                        }}>
                          <Lock size={10} color="#34d399" />
                          <span style={{ color: '#e2e8f0', fontWeight: 600 }}>https://mavicore.mes</span>
                          <span style={{ color: '#64748b' }}>/runtime</span>
                        </div>
                      </div>
                    )}

                    {/* Sandpack Preview */}
                    <div style={{ flex: 1, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
                      <SandpackPreview
                        showOpenInCodeSandbox={false}
                        showRefreshButton={true}
                        style={{ height: '100%', width: '100%', backgroundColor: '#030712' }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </SandpackLayout>
          </SandpackProvider>
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
              settings={null}
              onCodeGenerated={async (code) => {
                vfs.writeFile('/App.js', code);
                setFilesRecord(vfs.getAllFilesRecord());
                toast.success('AI code applied to /App.js!');
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
        onSelectTemplate={(tmpl) => handleChatSubmit(tmpl.prompt)}
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

    </div>
  );
}
