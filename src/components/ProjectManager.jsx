/**
 * ProjectManager.jsx
 * UI Component untuk manajemen project (export, import, duplicate, backup)
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Upload,
  Copy,
  Save,
  Trash2,
  FileJson,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  ChevronDown,
  X,
  Menu
} from 'lucide-react';
import * as projectMgmt from '../utils/projectManagement';

const ProjectManager = ({ app, onImport, onDuplicate, onAppChange }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [importError, setImportError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  // Load backups on mount
  useEffect(() => {
    if (app?.id) {
      refreshBackups();
    }
  }, [app?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const refreshBackups = () => {
    if (app?.id) {
      const backupList = projectMgmt.getProjectBackups(app.id);
      setBackups(backupList);
    }
  };

  const handleExportJSON = async () => {
    try {
      setImportError(null);
      await projectMgmt.exportProjectToJSON(app);
      setSuccessMessage('Project berhasil di-export sebagai JSON');
      setShowMenu(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal export project: ' + error.message);
    }
  };

  const handleExportCSV = async () => {
    try {
      setImportError(null);
      await projectMgmt.exportProjectAsCSV(app);
      setSuccessMessage('Project summary berhasil di-export sebagai CSV');
      setShowMenu(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal export CSV: ' + error.message);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
    setShowMenu(false);
  };

  const handleFileSelected = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportError(null);
      const result = await projectMgmt.importProjectFromJSON(file);
      
      if (onImport) {
        onImport(result.data);
      } else {
        setSuccessMessage('Project siap untuk disimpan dengan nama baru');
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal import project: ' + error.message);
    }
  };

  const handleDuplicate = async () => {
    try {
      setImportError(null);
      const newName = prompt('Nama project baru:', `${app.name} (Copy)`);
      
      if (newName === null) return; // User cancelled
      
      if (!newName.trim()) {
        setImportError('Nama project tidak boleh kosong');
        return;
      }

      const duplicated = projectMgmt.duplicateProject(app, newName);
      
      if (onDuplicate) {
        onDuplicate(duplicated);
      }

      setSuccessMessage('Project berhasil diduplikasi');
      setShowMenu(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal menduplikasi project: ' + error.message);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setImportError(null);
      await projectMgmt.backupProjectToLocalStorage(app);
      setSuccessMessage('Backup project berhasil dibuat');
      refreshBackups();
      setShowBackupModal(false);
      setShowMenu(false);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal membuat backup: ' + error.message);
    }
  };

  const handleRestoreBackup = async (backupKey) => {
    if (!window.confirm('Yakin ingin restore dari backup ini? Data saat ini akan ditimpa.')) {
      return;
    }

    try {
      setImportError(null);
      const result = projectMgmt.restoreProjectFromBackup(app.id, backupKey);
      
      if (onAppChange) {
        onAppChange(result.data);
      }

      setSuccessMessage('Project berhasil di-restore dari backup');
      setShowRestoreModal(false);
      refreshBackups();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal restore backup: ' + error.message);
    }
  };

  const handleDeleteBackup = async (backupKey) => {
    if (!window.confirm('Hapus backup ini?')) {
      return;
    }

    try {
      setImportError(null);
      await projectMgmt.deleteBackup(app.id, backupKey);
      setSuccessMessage('Backup berhasil dihapus');
      refreshBackups();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setImportError('Gagal menghapus backup: ' + error.message);
    }
  };

  if (!app) return null;

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '6px',
          cursor: 'pointer',
          color: '#ffffff',
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(4px)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
        title="Manajemen Project"
      >
        <Menu size={20} color="#ffffff" />
      </button>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid var(--border-primary, #e2e8f0)',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            minWidth: '220px',
            overflow: 'hidden'
          }}
        >
          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary, #1e293b)',
              borderBottom: '1px solid var(--border-primary, #e2e8f0)',
              transition: 'background-color 0.2s ease',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Ekspor project ke file JSON"
          >
            <Download size={16} />
            Export JSON
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary, #1e293b)',
              borderBottom: '1px solid var(--border-primary, #e2e8f0)',
              transition: 'background-color 0.2s ease',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Ekspor ringkasan project ke file CSV"
          >
            <Download size={16} />
            Export CSV
          </button>

          {/* Import */}
          <button
            onClick={handleImportClick}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary, #1e293b)',
              borderBottom: '1px solid var(--border-primary, #e2e8f0)',
              transition: 'background-color 0.2s ease',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Import project dari file JSON"
          >
            <Upload size={16} />
            Import
          </button>

          {/* Duplicate */}
          <button
            onClick={handleDuplicate}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary, #1e293b)',
              borderBottom: '1px solid var(--border-primary, #e2e8f0)',
              transition: 'background-color 0.2s ease',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Duplikasi project dengan nama baru"
          >
            <Copy size={16} />
            Duplikasi
          </button>

          {/* Backup */}
          <button
            onClick={() => setShowBackupModal(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 16px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--text-primary, #1e293b)',
              borderBottom: '1px solid var(--border-primary, #e2e8f0)',
              transition: 'background-color 0.2s ease',
              justifyContent: 'flex-start'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Buat backup project"
          >
            <Save size={16} />
            Buat Backup
          </button>

          {/* Restore */}
          {backups.length > 0 && (
            <button
              onClick={() => setShowRestoreModal(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-primary, #1e293b)',
                transition: 'background-color 0.2s ease',
                justifyContent: 'flex-start'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover, #f8f9fa)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              title="Restore dari backup yang tersimpan"
            >
              <Clock size={16} />
              Restore Backup ({backups.length})
            </button>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".json"
        style={{ display: 'none' }}
      />

      {/* Backup Modal */}
      {showBackupModal && (
        <Modal
          title="Buat Backup Project"
          onClose={() => setShowBackupModal(false)}
        >
          <p style={{ marginBottom: '16px', color: 'var(--text-secondary, #64748b)' }}>
            Simpan project '{app.name}' ke backup lokal?
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowBackupModal(false)}
              style={{
                padding: '8px 16px',
                backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                border: '1px solid var(--border-primary, #e2e8f0)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'var(--text-primary, #1e293b)'
              }}
            >
              Batal
            </button>
            <button
              onClick={handleCreateBackup}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.875rem',
                color: 'white'
              }}
            >
              <Save size={14} style={{ marginRight: '4px' }} />
              Buat Backup
            </button>
          </div>
        </Modal>
      )}

      {/* Restore Modal */}
      {showRestoreModal && (
        <Modal
          title="Restore dari Backup"
          onClose={() => setShowRestoreModal(false)}
        >
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {backups.length === 0 ? (
              <p style={{ color: 'var(--text-secondary, #64748b)' }}>Tidak ada backup</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {backups.map((backup, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: 'var(--bg-secondary, #f8f9fa)',
                      borderRadius: '4px',
                      border: '1px solid var(--border-primary, #e2e8f0)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                      <Clock size={14} style={{ color: 'var(--text-secondary, #64748b)' }} />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)' }}>
                        {backup.displayTime}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={() => handleRestoreBackup(backup.key)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#22c55e',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: 'white'
                        }}
                        title="Restore backup ini"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDeleteBackup(backup.key)}
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ef4444',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          color: 'white'
                        }}
                        title="Hapus backup ini"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Error Message */}
      {importError && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            borderRadius: '6px',
            padding: '12px 16px',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#991b1b',
            zIndex: 2000,
            animation: 'slideIn 0.3s ease'
          }}
        >
          <AlertCircle size={18} />
          <div style={{ flex: 1 }}>{importError}</div>
          <button
            onClick={() => setImportError(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#991b1b'
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#dcfce7',
            border: '1px solid #86efac',
            borderRadius: '6px',
            padding: '12px 16px',
            maxWidth: '400px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#166534',
            zIndex: 2000,
            animation: 'slideIn 0.3s ease'
          }}
        >
          <CheckCircle size={18} />
          <div>{successMessage}</div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Simple Modal Component
 */
const Modal = ({ title, children, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          animation: 'fadeIn 0.2s ease'
        }}
      />
      
      {/* Modal Content */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
          minWidth: '400px',
          maxWidth: '90%',
          animation: 'slideUp 0.3s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-primary, #e2e8f0)'
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-primary, #1e293b)' }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-secondary, #64748b)',
              padding: '4px'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translate(-50%, -45%);
            opacity: 0;
          }
          to {
            transform: translate(-50%, -50%);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default ProjectManager;
