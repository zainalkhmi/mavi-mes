/**
 * IndustrialTemplatesModal.jsx
 * Interactive Catalog & One-Click Installer for Master Industrial Table Templates in MaviCore MES
 */

import React, { useState, useMemo } from 'react';
import {
  Factory, Table, CheckCircle2, Sparkles, Download, ArrowRight,
  Layers, Clock, Shield, CheckSquare, Database, X, Search,
  RefreshCw, FileText, ChevronRight, Play, Layout, Plus, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  INDUSTRIAL_CATEGORIES,
  INDUSTRIAL_TABLE_TEMPLATES,
  instantiateTableFromTemplate,
  instantiateAllIndustrialTemplates
} from '../utils/industrialTableTemplates.js';

export default function IndustrialTemplatesModal({
  isOpen,
  onClose,
  existingTables = [],
  onTableInstalled,
  onOpenAppGenerator
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [installingId, setInstallingId] = useState(null);
  const [isInstallingAll, setIsInstallingAll] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);

  // Set of existing table names in lower case for quick lookup
  const existingTableNames = useMemo(() => {
    return new Set((existingTables || []).map(t => (t.name || '').toLowerCase()));
  }, [existingTables]);

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    return INDUSTRIAL_TABLE_TEMPLATES.filter(t => {
      const matchCat = selectedCategory === 'all' || t.category === selectedCategory;
      const matchSearch = !searchQuery ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.fields.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (!isOpen) return null;

  // Single Template Installation
  const handleInstallTemplate = async (template) => {
    setInstallingId(template.id);
    try {
      const res = await instantiateTableFromTemplate(template.id);
      toast.success(`Tabel "${template.label}" berhasil dibuat ke database!`);
      if (onTableInstalled) {
        await onTableInstalled(res.table);
      }
    } catch (err) {
      toast.error('Gagal memasang template: ' + err.message);
    } finally {
      setInstallingId(null);
    }
  };

  // Batch Installation of all 12 templates
  const handleInstallAll = async () => {
    setIsInstallingAll(true);
    try {
      const res = await instantiateAllIndustrialTemplates();
      if (res.installed.length > 0) {
        toast.success(`Berhasil memasang ${res.installed.length} tabel industri baru!`);
        if (onTableInstalled) {
          await onTableInstalled();
        }
      } else {
        toast('Semua tabel industri sudah terpasang di database.', { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error('Gagal memasang paket template: ' + err.message);
    } finally {
      setIsInstallingAll(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        width: '100%',
        maxWidth: '1100px',
        height: '90vh',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        
        {/* MODAL HEADER */}
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              <Factory size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Master Industrial Table Templates
                </h2>
                <span style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  border: '1px solid #bfdbfe'
                }}>
                  ISA-95 MES Compliant
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '4px 0 0 0' }}>
                Pilih template tabel manufaktur siap pakai dengan relasi data terstruktur, field lengkap, dan seed data realistis.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Deploy All Button */}
            <button
              onClick={handleInstallAll}
              disabled={isInstallingAll}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                color: 'white',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: isInstallingAll ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                opacity: isInstallingAll ? 0.7 : 1
              }}
            >
              {isInstallingAll ? <RefreshCw size={15} className="animate-spin" /> : <Sparkles size={15} />}
              <span>{isInstallingAll ? 'Memasang Semua...' : 'Pasang Semua (12 Tabel)'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* SEARCH & CATEGORY FILTER BAR */}
        <div style={{
          padding: '14px 28px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          backgroundColor: '#ffffff'
        }}>
          {/* Category Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {INDUSTRIAL_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  border: `1px solid ${selectedCategory === cat.id ? '#2563eb' : '#e2e8f0'}`,
                  backgroundColor: selectedCategory === cat.id ? '#eff6ff' : '#ffffff',
                  color: selectedCategory === cat.id ? '#2563eb' : '#475569',
                  fontSize: '0.78rem',
                  fontWeight: selectedCategory === cat.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '280px', flexShrink: 0 }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tabel atau nama kolom..."
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '7px 10px 7px 32px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '0.8rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* TEMPLATE CARDS GRID */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px 28px',
          backgroundColor: '#f8fafc',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
          gap: '18px',
          alignContent: 'start'
        }}>
          {filteredTemplates.map(template => {
            const isInstalled = existingTableNames.has(template.name.toLowerCase());
            const isInstallingThis = installingId === template.id;

            return (
              <div
                key={template.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: `1px solid ${isInstalled ? '#bbf7d0' : '#e2e8f0'}`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '18px',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
              >
                {/* Card Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase'
                    }}>
                      {template.categoryLabel}
                    </span>
                    <h3 style={{ fontSize: '0.96rem', fontWeight: 700, color: '#0f172a', margin: '6px 0 2px 0' }}>
                      {template.label}
                    </h3>
                    <code style={{ fontSize: '0.72rem', color: '#2563eb', fontWeight: 600 }}>
                      {template.name}
                    </code>
                  </div>

                  {isInstalled ? (
                    <span style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#16a34a',
                      backgroundColor: '#f0fdf4',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <CheckCircle2 size={13} />
                      Terpasang
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.72rem',
                      color: '#64748b',
                      backgroundColor: '#f8fafc',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      {template.fields.length} kolom
                    </span>
                  )}
                </div>

                {/* Description */}
                <p style={{
                  fontSize: '0.78rem',
                  color: '#64748b',
                  lineHeight: '1.4',
                  margin: '0 0 14px 0',
                  flex: 1
                }}>
                  {template.description}
                </p>

                {/* Columns Preview Pills */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Struktur Kolom Utama:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {template.fields.slice(0, 5).map(f => (
                      <span
                        key={f.name}
                        style={{
                          fontSize: '0.68rem',
                          backgroundColor: '#f1f5f9',
                          color: '#334155',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        {f.name} <strong style={{ color: '#64748b' }}>({f.type})</strong>
                      </span>
                    ))}
                    {template.fields.length > 5 && (
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', padding: '2px 4px' }}>
                        +{template.fields.length - 5} lainnya
                      </span>
                    )}
                  </div>
                </div>

                {/* Recommended Apps */}
                <div style={{ marginBottom: '16px', borderTop: '1px dashed #e2e8f0', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                    Cocok untuk Aplikasi:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {template.recommendedApps.map(app => (
                      <span
                        key={app}
                        style={{
                          fontSize: '0.66rem',
                          color: '#2563eb',
                          backgroundColor: '#eff6ff',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        ⚡ {app}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {isInstalled ? (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenAppGenerator) {
                          const tbl = (existingTables || []).find(t => t.name.toLowerCase() === template.name.toLowerCase());
                          onOpenAppGenerator(tbl || template);
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <Layout size={14} />
                      Generate App Sekarang →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleInstallTemplate(template)}
                      disabled={isInstallingThis}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: '#2563eb',
                        color: 'white',
                        border: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: isInstallingThis ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
                        opacity: isInstallingThis ? 0.7 : 1
                      }}
                    >
                      {isInstallingThis ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Plus size={15} />
                      )}
                      <span>{isInstallingThis ? 'Memasang...' : 'Pasang Tabel Ini'}</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* FOOTER BAR */}
        <div style={{
          padding: '14px 28px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff'
        }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Menampilkan <strong>{filteredTemplates.length}</strong> template tabel industri siap pakai
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onClose}
              style={{
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Tutup
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
