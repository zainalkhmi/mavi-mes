import React, { useState } from 'react';
import {
  Folder, FolderOpen, FileCode, FileText, Plus, Trash2, Edit2,
  FileJson, Check, X, ChevronRight, ChevronDown, Sparkles
} from 'lucide-react';

export default function FileTreeExplorer({
  tree = [],
  activePath = '/App.jsx',
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onOpenTemplates
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

        {item.path !== '/App.jsx' && item.path !== '/package.json' && item.path !== '/styles.css' && (
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
      {/* Header */}
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {tree.map(item => renderItem(item, 0))}
      </div>
    </div>
  );
}
