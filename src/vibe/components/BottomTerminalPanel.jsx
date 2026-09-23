import React, { useState } from 'react';
import {
  Terminal,
  AlertCircle,
  Sparkles,
  Trash2,
  ChevronUp,
  ChevronDown,
  Wrench,
  CheckCircle2,
  Loader2,
  Database,
  Cpu,
  RefreshCw
} from 'lucide-react';

export default function BottomTerminalPanel({
  isOpen = true,
  onToggleOpen,
  logs = [],
  errors = [],
  aiActivity = null,
  stepHistory = [],
  connectedTable = null,
  liveRecordCount = 0,
  activeEngine = 'sandpack',
  onSwitchEngine = () => {},
  onTriggerAutoFix,
  isAutoFixing = false,
  onClearLogs
}) {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'errors' | 'ai' | 'database'

  if (!isOpen) {
    return (
      <div style={{
        height: '32px', backgroundColor: '#070b14', borderTop: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px',
        fontSize: '0.72rem', color: '#94a3b8', userSelect: 'none', zIndex: 30
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={13} color="#38bdf8" />
          <span style={{ fontWeight: 600 }}>Terminal & Runtime Console</span>
          {errors.length > 0 ? (
            <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '9999px', fontSize: '0.62rem', fontWeight: 800 }}>
              {errors.length} error
            </span>
          ) : (
            <span style={{ color: '#10b981', fontSize: '0.65rem', fontWeight: 700 }}>● Online</span>
          )}
          {connectedTable && (
            <span style={{ color: '#0ea5e9', fontSize: '0.65rem' }}>
              🗄️ {connectedTable.name} ({liveRecordCount} data)
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onToggleOpen}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <ChevronUp size={14} />
          <span>Buka Console</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '190px', backgroundColor: '#070b14', borderTop: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', zIndex: 30
    }}>
      {/* Tab bar */}
      <div style={{
        height: '34px', backgroundColor: '#0a0f1d', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('terminal')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: activeTab === 'terminal' ? 700 : 500,
              backgroundColor: activeTab === 'terminal' ? '#1e293b' : 'transparent',
              color: activeTab === 'terminal' ? '#38bdf8' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Terminal size={12} />
            <span>Terminal / Logs ({logs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('errors')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: activeTab === 'errors' ? 700 : 500,
              backgroundColor: activeTab === 'errors' ? '#1e293b' : 'transparent',
              color: activeTab === 'errors' ? '#f43f5e' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <AlertCircle size={12} />
            <span>Errors</span>
            {errors.length > 0 && (
              <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '0 5px', borderRadius: '9999px', fontSize: '0.6rem', fontWeight: 800 }}>
                {errors.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: activeTab === 'ai' ? 700 : 500,
              backgroundColor: activeTab === 'ai' ? '#1e293b' : 'transparent',
              color: activeTab === 'ai' ? '#a5b4fc' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Sparkles size={12} />
            <span>Agent Steps ({stepHistory.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            style={{
              padding: '4px 10px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              fontSize: '0.72rem', fontWeight: activeTab === 'database' ? 700 : 500,
              backgroundColor: activeTab === 'database' ? '#1e293b' : 'transparent',
              color: activeTab === 'database' ? '#34d399' : '#94a3b8',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <Database size={12} />
            <span>Database Inspector {connectedTable ? `(${connectedTable.name})` : ''}</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Engine indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#020617', padding: '2px 8px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '0.65rem' }}>
            <Cpu size={11} color="#38bdf8" />
            <span style={{ color: '#64748b' }}>Engine:</span>
            <span style={{ color: activeEngine === 'webcontainer' ? '#34d399' : '#38bdf8', fontWeight: 700 }}>
              {activeEngine === 'webcontainer' ? 'WebContainer (Node VM)' : 'Sandpack Engine'}
            </span>
          </div>

          {errors.length > 0 && onTriggerAutoFix && (
            <button
              type="button"
              disabled={isAutoFixing}
              onClick={onTriggerAutoFix}
              style={{
                padding: '3px 10px', borderRadius: '6px', backgroundColor: '#dc2626',
                border: 'none', color: '#fff', fontSize: '0.68rem', fontWeight: 700,
                cursor: isAutoFixing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
              }}
            >
              {isAutoFixing ? <Loader2 size={12} className="animate-spin" /> : <Wrench size={12} />}
              <span>{isAutoFixing ? 'Memperbaiki...' : '⚡ AI Auto-Fix'}</span>
            </button>
          )}

          {onClearLogs && (
            <button
              type="button"
              onClick={onClearLogs}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
              title="Bersihkan log"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={onToggleOpen}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            title="Ciutkan Panel"
          >
            <ChevronDown size={14} />
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div style={{ flex: 1, padding: '10px 14px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.72rem', color: '#cbd5e1' }}>
        {activeTab === 'terminal' && (
          <div>
            {logs.length === 0 ? (
              <span style={{ color: '#475569' }}>Terminal siap. Menunggu log dev server / runtime...</span>
            ) : (
              logs.map((log, i) => (
                <div key={i} style={{ marginBottom: '3px', color: log.text?.includes('[ERROR]') ? '#f87171' : '#cbd5e1' }}>
                  <span style={{ color: '#475569', marginRight: '6px' }}>[{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}]</span>
                  <span>{log.text}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'errors' && (
          <div>
            {errors.length === 0 ? (
              <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={14} />
                <span>Tidak ada error terdeteksi. Aplikasi berjalan lancar!</span>
              </div>
            ) : (
              errors.map((err, i) => (
                <div key={i} style={{ padding: '8px 12px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', marginBottom: '6px', color: '#fca5a5' }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>🚨 Runtime / Build Exception:</div>
                  <div>{typeof err === 'string' ? err : err.message || JSON.stringify(err)}</div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            {stepHistory.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {stepHistory.map((st, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', borderRadius: '4px', backgroundColor: '#0f172a' }}>
                    <span style={{ color: st.status === 'completed' ? '#34d399' : (st.status === 'active' ? '#38bdf8' : '#f87171') }}>
                      {st.status === 'completed' ? '✓' : (st.status === 'active' ? '●' : '✕')}
                    </span>
                    <strong style={{ color: '#f8fafc' }}>{st.label}</strong>
                    <span style={{ color: '#64748b' }}>— {st.detail}</span>
                  </div>
                ))}
              </div>
            ) : aiActivity ? (
              <div style={{ color: '#38bdf8' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Status AI: {aiActivity.stage || 'Aktif'}</div>
                <div>{aiActivity.message}</div>
              </div>
            ) : (
              <span style={{ color: '#475569' }}>Belum ada langkah agen yang dicatat. Kirim prompt di panel chat untuk memulai.</span>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div>
            {connectedTable ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid #1e293b' }}>
                  <div>
                    <span style={{ color: '#34d399', fontWeight: 800 }}>Tabel: {connectedTable.name}</span>
                    <span style={{ color: '#94a3b8', marginLeft: '8px' }}>({connectedTable.fields?.length || 0} kolom terdaftar)</span>
                  </div>
                  <span style={{ backgroundColor: '#064e3b', color: '#34d399', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    {liveRecordCount} Record Tersimpan
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(connectedTable.fields || []).map((f, idx) => (
                    <span key={idx} style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: '#1e293b', color: '#e2e8f0', fontSize: '0.68rem', border: '1px solid #334155' }}>
                      {f.name} <span style={{ color: '#38bdf8' }}>({f.type || 'text'})</span>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <span style={{ color: '#475569' }}>Belum ada tabel yang terhubung ke aplikasi ini. Buat form dan gunakan hook `useMaviCoreData('NamaTabel')` untuk auto-provisioning database.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
