import React, { useState } from 'react';
import { Terminal, AlertCircle, Sparkles, Trash2, ChevronUp, ChevronDown, Wrench, CheckCircle2, Loader2 } from 'lucide-react';

export default function BottomTerminalPanel({
  isOpen = true,
  onToggleOpen,
  logs = [],
  errors = [],
  aiActivity = null,
  onTriggerAutoFix,
  isAutoFixing = false,
  onClearLogs
}) {
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'errors' | 'ai'

  if (!isOpen) {
    return (
      <div style={{
        height: '32px', backgroundColor: '#070b14', borderTop: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px',
        fontSize: '0.72rem', color: '#94a3b8', userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Terminal size={13} color="#38bdf8" />
          <span style={{ fontWeight: 600 }}>Terminal & Error Log</span>
          {errors.length > 0 && (
            <span style={{ backgroundColor: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '9999px', fontSize: '0.62rem', fontWeight: 800 }}>
              {errors.length} error
            </span>
          )}
        </div>
        <button type="button" onClick={onToggleOpen} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <ChevronUp size={14} />
          <span>Buka Panel</span>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      height: '180px', backgroundColor: '#070b14', borderTop: '1px solid #1e293b',
      display: 'flex', flexDirection: 'column', overflow: 'hidden'
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
            <span>AI Activity</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
              <span>{isAutoFixing ? 'Memperbaiki...' : 'Auto-Fix Error'}</span>
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
                  <span style={{ color: '#475569', marginRight: '6px' }}>[{log.timestamp?.toLocaleTimeString() || ''}]</span>
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
                <div key={i} style={{ padding: '6px 10px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '6px', marginBottom: '6px', color: '#fca5a5' }}>
                  <strong>Error:</strong> {typeof err === 'string' ? err : err.message || JSON.stringify(err)}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div>
            {aiActivity ? (
              <div style={{ color: '#38bdf8' }}>
                <div style={{ fontWeight: 700, marginBottom: '4px' }}>Status AI: {aiActivity.stage || 'Aktif'}</div>
                <div>{aiActivity.message}</div>
              </div>
            ) : (
              <span style={{ color: '#475569' }}>Tidak ada aktivitas AI yang sedang berjalan.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
