/**
 * AgentActivityCard.jsx
 * Emergent-style live agent activity & step progress timeline widget.
 * Rendered in chat or as a floating card during autonomous code generation.
 */

import React, { useState } from 'react';
import {
  Brain,
  Package,
  FileCode,
  Play,
  Database,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  Layers
} from 'lucide-react';

export default function AgentActivityCard({
  steps = [],
  currentStep = null,
  isFinished = false,
  hasError = false,
  errorText = '',
  logs = [],
  className = ''
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStepIcon = (stepId, status) => {
    if (status === 'error') return <AlertCircle size={14} className="text-red-400" />;
    if (status === 'completed') return <CheckCircle2 size={14} className="text-emerald-400" />;
    if (status === 'active') return <Loader2 size={14} className="animate-spin text-cyan-400" />;

    switch (stepId) {
      case 'planning': return <Brain size={13} className="text-indigo-400" />;
      case 'dependencies': return <Package size={13} className="text-amber-400" />;
      case 'generating': return <FileCode size={13} className="text-purple-400" />;
      case 'compiling': return <Play size={13} className="text-blue-400" />;
      case 'database_sync': return <Database size={13} className="text-emerald-400" />;
      case 'ready': return <Sparkles size={13} className="text-yellow-400" />;
      default: return <Layers size={13} className="text-slate-400" />;
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#070b14',
        border: hasError ? '1px solid #ef4444' : (isFinished ? '1px solid #10b981' : '1px solid #0284c7'),
        borderRadius: '14px',
        padding: '12px 14px',
        margin: '10px 0',
        boxShadow: isFinished
          ? '0 8px 24px rgba(16, 185, 129, 0.15)'
          : '0 8px 24px rgba(2, 132, 199, 0.2)',
        fontFamily: 'Inter, system-ui, sans-serif'
      }}
      className={className}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isExpanded ? '10px' : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '24px', height: '24px', borderRadius: '6px',
            background: hasError ? '#ef4444' : (isFinished ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #0284c7, #6366f1)'),
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            {isFinished ? <Sparkles size={13} color="#fff" /> : (hasError ? <AlertCircle size={13} color="#fff" /> : <Loader2 size={13} color="#fff" className="animate-spin" />)}
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>EMERGENT AUTONOMOUS AGENT</span>
              {isFinished ? (
                <span style={{ fontSize: '0.62rem', backgroundColor: '#064e3b', color: '#34d399', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  READY
                </span>
              ) : (
                <span style={{ fontSize: '0.62rem', backgroundColor: '#0c4a6e', color: '#38bdf8', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  EXECUTING
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
              {isFinished ? 'Proses autonomous build selesai tanpa error' : (currentStep?.label || 'Sedang memproses instruksi aplikasi...')}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(prev => !prev)}
          style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
        >
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Step Timeline */}
      {isExpanded && (
        <div style={{ marginTop: '8px', borderTop: '1px solid #1e293b', paddingTop: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {steps.map((st, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  fontSize: '0.72rem',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  backgroundColor: st.status === 'active' ? 'rgba(2, 132, 199, 0.1)' : 'transparent'
                }}
              >
                <div style={{ marginTop: '2px', flexShrink: 0 }}>
                  {getStepIcon(st.step, st.status)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontWeight: 700,
                    color: st.status === 'completed' ? '#94a3b8' : (st.status === 'active' ? '#38bdf8' : '#e2e8f0')
                  }}>
                    {st.label}
                  </div>
                  {st.detail && (
                    <div style={{ fontSize: '0.65rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {st.detail}
                    </div>
                  )}
                </div>
                <div style={{ fontSize: '0.62rem', color: '#475569', flexShrink: 0 }}>
                  {new Date(st.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          {/* Error Message banner */}
          {hasError && errorText && (
            <div style={{
              marginTop: '10px',
              padding: '8px 10px',
              borderRadius: '8px',
              backgroundColor: '#450a0a',
              border: '1px solid #dc2626',
              color: '#fca5a5',
              fontSize: '0.7rem'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '2px' }}>Peringatan Eksekusi:</div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.66rem' }}>{errorText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
