import React, { useState } from 'react';
import { Check, X, FileText, PlusCircle, AlertCircle, Trash2, Eye } from 'lucide-react';

export default function AiChangesReviewModal({
  isOpen,
  fileActions = [],
  onApply,
  onReject
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);

  if (!isOpen || fileActions.length === 0) return null;

  const currentAction = fileActions[selectedIdx] || fileActions[0];

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0a0f1d', border: '1px solid #334155', borderRadius: '16px',
        width: '100%', maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>✨</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
                AI Changes ({fileActions.length} file)
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Tinjau perubahan kode yang disarankan oleh AI sebelum diterapkan ke proyek.
              </p>
            </div>
          </div>
          <button type="button" onClick={onReject} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body: Left File List + Right Code Preview */}
        <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
          {/* File list */}
          <div style={{ width: '260px', borderRight: '1px solid #1e293b', overflowY: 'auto', padding: '10px' }}>
            {fileActions.map((item, idx) => {
              const isSelected = idx === selectedIdx;
              const isCreated = item.action === 'create';
              const isDeleted = item.action === 'delete';

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                    backgroundColor: isSelected ? '#1e293b' : 'transparent',
                    border: isSelected ? '1px solid #38bdf8' : '1px solid transparent',
                    display: 'flex', alignItems: 'center', gap: '8px'
                  }}
                >
                  {isCreated ? (
                    <span style={{ color: '#34d399', fontWeight: 800, fontSize: '0.8rem' }}>+</span>
                  ) : isDeleted ? (
                    <span style={{ color: '#f43f5e', fontWeight: 800, fontSize: '0.8rem' }}>-</span>
                  ) : (
                    <span style={{ color: '#38bdf8', fontWeight: 800, fontSize: '0.8rem' }}>~</span>
                  )}
                  <span style={{ fontSize: '0.78rem', color: isSelected ? '#f8fafc' : '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.path}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Code preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#020617', minHeight: 0 }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid #1e293b', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
              <span>File: {currentAction?.path}</span>
              <span style={{ textTransform: 'uppercase', color: currentAction?.action === 'create' ? '#34d399' : '#38bdf8' }}>
                {currentAction?.action || 'modify'}
              </span>
            </div>
            <pre style={{
              flex: 1, margin: 0, padding: '16px', overflow: 'auto',
              fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: '1.5', color: '#cbd5e1'
            }}>
              <code>{currentAction?.content || '(File dihapus)'}</code>
            </pre>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #1e293b', backgroundColor: '#0f172a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <button
            type="button"
            onClick={onReject}
            style={{
              padding: '8px 18px', borderRadius: '8px', backgroundColor: '#1e293b',
              border: '1px solid #334155', color: '#cbd5e1', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            Tolak (Reject)
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onApply}
              style={{
                padding: '8px 24px', borderRadius: '8px', backgroundColor: '#059669',
                border: 'none', color: '#ffffff', fontSize: '0.82rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(5,150,105,0.4)'
              }}
            >
              <Check size={16} />
              Terapkan Perubahan (Apply)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
