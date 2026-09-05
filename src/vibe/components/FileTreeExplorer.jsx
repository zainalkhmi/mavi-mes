import React, { useState } from 'react';
import {
  Folder, FolderOpen, FileCode, FileText, Plus, Trash2, Edit2,
  FileJson, Check, X, ChevronRight, ChevronDown, Sparkles, Box, Smartphone
} from 'lucide-react';

export default function FileTreeExplorer({
  tree = [],
  activePath = '/App.js',
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onOpenTemplates,
  // Apps Sandbox section props
  sandboxApps = [],
  activeAppId = null,
  onSelectApp,
  onDeleteApp,
  onNewApp,
  isLoadingApps = false
}) {
  const [newFileName, setNewFileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let clean = newFileName.trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    if (onCreateFile) onCreateFile(clean);
    setNewFileName('');
    setIsCreating(false);
  };

  const getFileIcon = (name) => {
    if (name.endsWith('.json')) return <FileJson size={14} color="#f59e0b" />;
    if (name.endsWith('.css')) return <FileCode size={14} color="#38bdf8" />;
    if (name.endsWith('.jsx') || name.endsWith('.js') || name.endsWith('.tsx')) {
      return <FileCode size={14} color="#60a5fa" />;
    }
    return <FileText size={14} color="#94a3b8" />;
  };

  const renderItem = (item, level = 0) => {
    const isSelected = activePath === item.path;

    if (item.isDirectory) {
      return (
        <div key={item.path}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 8px', paddingLeft: `${8 + level * 14}px`,
            fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8',
            cursor: 'pointer', userSelect: 'none'
          }}>
            <FolderOpen size={14} color="#eab308" />
            <span>{item.name}</span>
          </div>
          <div>
            {(item.children || []).map(child => renderItem(child, level + 1))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={item.path}
        onClick={() => onSelectFile && onSelectFile(item.path)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '5px 8px', paddingLeft: `${8 + level * 14}px`,
          backgroundColor: isSelected ? 'rgba(14,165,233,0.15)' : 'transparent',
          borderLeft: isSelected ? '2px solid #38bdf8' : '2px solid transparent',
          color: isSelected ? '#38bdf8' : '#cbd5e1',
          fontSize: '0.75rem', fontWeight: isSelected ? 700 : 500,
          cursor: 'pointer', transition: 'all 0.12s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getFileIcon(item.name)}
          <span>{item.name}</span>
        </div>

        {item.path !== '/App.js' && item.path !== '/App.jsx' && item.path !== '/package.json' && item.path !== '/styles.css' && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Hapus file ${item.name}?`)) {
                if (onDeleteFile) onDeleteFile(item.path);
              }
            }}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}
            title="Hapus file"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#070b14', borderRight: '1px solid #1e293b' }}>
      {/* ─── SECTION 1: FILES ─── */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b' }}>
          Files
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setIsCreating(v => !v)}
            style={{
              padding: '3px 6px', borderRadius: '4px', backgroundColor: '#1e293b',
              border: 'none', color: '#cbd5e1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem'
            }}
            title="Tambah File Baru"
          >
            <Plus size={12} />
            <span>File</span>
          </button>

          {onOpenTemplates && (
            <button
              type="button"
              onClick={onOpenTemplates}
              style={{
                padding: '3px 6px', borderRadius: '4px', backgroundColor: 'rgba(99,102,241,0.2)',
                border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem'
              }}
              title="Template Manufaktur"
            >
              <Sparkles size={12} />
              <span>Template</span>
            </button>
          )}
        </div>
      </div>

      {/* New File Input */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} style={{ padding: '8px', borderBottom: '1px solid #1e293b', backgroundColor: '#0f172a' }}>
          <input
            type="text"
            placeholder="/components/Name.jsx"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            autoFocus
            style={{
              width: '100%', padding: '6px 8px', fontSize: '0.72rem',
              backgroundColor: '#020617', border: '1px solid #38bdf8',
              borderRadius: '6px', color: '#fff', outline: 'none'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', marginTop: '6px' }}>
            <button type="button" onClick={() => setIsCreating(false)} style={{ padding: '2px 8px', fontSize: '0.65rem', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>Batal</button>
            <button type="submit" style={{ padding: '2px 8px', fontSize: '0.65rem', backgroundColor: '#0ea5e9', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>Buat</button>
          </div>
        </form>
      )}

      {/* Tree Content */}
      <div style={{ flex: '1 1 50%', minHeight: '120px', maxHeight: '50%', overflowY: 'auto', padding: '6px 0', borderBottom: '1px solid #1e293b' }}>
        {tree.map(item => renderItem(item, 0))}
      </div>

      {/* ─── SECTION 2: APLIKASI SANDBOX TERSIMPAN (DIBAWAH TAB FILE) ─── */}
      <div style={{ padding: '10px 12px 6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={13} color="#f59e0b" />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#f59e0b' }}>
            Apps Sandbox
          </span>
          <span style={{
            fontSize: '0.65rem',
            padding: '1px 5px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            color: '#f59e0b',
            fontWeight: 700
          }}>
            {sandboxApps.length}
          </span>
        </div>

        {onNewApp && (
          <button
            type="button"
            onClick={onNewApp}
            style={{
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.35)',
              color: '#f59e0b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              fontSize: '0.65rem',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
            title="Buka Lembar Kerja Kosong (App Baru)"
          >
            <Plus size={11} />
            <span>App Baru</span>
          </button>
        )}
      </div>

      {/* Apps List Content */}
      <div style={{ flex: '1 1 50%', overflowY: 'auto', padding: '4px 6px 12px 6px' }}>
        {isLoadingApps ? (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
            Memuat aplikasi...
          </div>
        ) : sandboxApps.length === 0 ? (
          <div style={{
            padding: '16px 10px',
            textAlign: 'center',
            fontSize: '0.7rem',
            color: '#64748b',
            lineHeight: 1.4,
            border: '1px dashed #1e293b',
            borderRadius: '8px',
            margin: '4px 6px'
          }}>
            Belum ada aplikasi tersimpan.<br />
            Klik <b>Frontline Publish</b> untuk menyimpan.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {sandboxApps.map(app => {
              const isActive = activeAppId === app.id;
              return (
                <div
                  key={app.id}
                  onClick={() => onSelectApp && onSelectApp(app)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    backgroundColor: isActive ? 'rgba(245, 158, 11, 0.16)' : 'rgba(255, 255, 255, 0.02)',
                    border: isActive ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1, marginRight: '6px' }}>
                    <div style={{
                      fontSize: '0.76rem',
                      fontWeight: isActive ? 800 : 600,
                      color: isActive ? '#fbbf24' : '#e2e8f0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {app.name || 'Untitled Sandbox'}
                    </div>
                    <div style={{ fontSize: '0.62rem', color: '#64748b', marginTop: '2px' }}>
                      {app.updated_at ? new Date(app.updated_at).toLocaleDateString() : 'Draft'}
                    </div>
                  </div>

                  {onDeleteApp && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteApp(app.id, app.name);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#64748b';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                      title="Hapus Aplikasi"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
