import React, { useState } from 'react';
import { X, Sparkles, ClipboardList, CheckCircle2, ShieldCheck, Activity, Gauge, Layers, Sliders, Wrench, FileText, BarChart2, Zap, ArrowRight } from 'lucide-react';
import { MANUFACTURING_TEMPLATES } from '../templates/manufacturingTemplates';

const ICON_MAP = {
  ClipboardList, CheckCircle2, ShieldCheck, Activity, Gauge, Layers, Sliders, Wrench, FileText, BarChart2
};

const CATEGORIES = ['Semua', '⭐ PRO Templates', 'Shop Floor', 'Quality Control', 'Warehouse', 'Management', 'Maintenance'];

export default function ManufacturingTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate
}) {
  const [selectedCat, setSelectedCat] = useState('Semua');

  if (!isOpen) return null;

  const filteredTemplates = MANUFACTURING_TEMPLATES.filter(tmpl => {
    if (selectedCat === 'Semua') return true;
    if (selectedCat === '⭐ PRO Templates') return tmpl.isPro;
    return tmpl.category === selectedCat;
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '18px',
        width: '100%', maxWidth: '920px', maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.95)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(99,102,241,0.4)' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                  Manufacturing App Templates
                </h3>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: '#fff', letterSpacing: '0.5px' }}>
                  PRO READY
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Pilih template industri siap pakai dengan telemetry IoT, sparkline, status pills, dan database bridge.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Category Pills Bar */}
        <div style={{ padding: '10px 20px', borderBottom: '1px solid #1e293b', backgroundColor: '#0b1329', display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCat(cat)}
              style={{
                padding: '4px 12px',
                borderRadius: '8px',
                fontSize: '0.72rem',
                fontWeight: 700,
                border: selectedCat === cat ? '1px solid #6366f1' : '1px solid #1e293b',
                backgroundColor: selectedCat === cat ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: selectedCat === cat ? '#a5b4fc' : '#94a3b8',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '14px' }}>
          {filteredTemplates.map((tmpl) => {
            const IconComp = ICON_MAP[tmpl.icon] || ClipboardList;

            return (
              <div
                key={tmpl.id}
                style={{
                  backgroundColor: tmpl.isPro ? '#0f172a' : '#0a0f1d',
                  border: tmpl.isPro ? '1px solid rgba(99,102,241,0.35)' : '1px solid #1e293b',
                  borderRadius: '14px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                  boxShadow: tmpl.isPro ? '0 4px 20px rgba(99,102,241,0.08)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '8px',
                    backgroundColor: tmpl.isPro ? 'rgba(99,102,241,0.2)' : 'rgba(56,189,248,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <IconComp size={16} color={tmpl.isPro ? '#818cf8' : '#38bdf8'} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {tmpl.isPro && (
                      <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', padding: '2px 6px', borderRadius: '4px' }}>
                        ⭐ PRO
                      </span>
                    )}
                    <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                      {tmpl.category}
                    </span>
                  </div>
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  {tmpl.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.45', flex: 1 }}>
                  {tmpl.description}
                </p>

                {/* Actions */}
                <div style={{ marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'space-between' }}>
                  {tmpl.isPro && tmpl.code ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTemplate) onSelectTemplate(tmpl, { directLoad: true });
                          onClose();
                        }}
                        style={{
                          flex: 1,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
                          padding: '6px 10px', borderRadius: '8px',
                          background: 'linear-gradient(135deg, #4f46e5, #06b6d4)',
                          color: '#fff', fontSize: '0.72rem', fontWeight: 700,
                          border: 'none', cursor: 'pointer',
                          boxShadow: '0 2px 10px rgba(79,70,229,0.3)'
                        }}
                        title="Muat kode pro ini langsung ke live canvas"
                      >
                        <Zap size={12} fill="#fff" />
                        <span>Muat PRO (0.1s)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (onSelectTemplate) onSelectTemplate(tmpl, { directLoad: false });
                          onClose();
                        }}
                        style={{
                          padding: '6px 10px', borderRadius: '8px',
                          backgroundColor: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          color: '#cbd5e1', fontSize: '0.72rem', fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Kirim prompt ke AI Vibe Engine untuk modifikasi"
                      >
                        Prompt AI
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectTemplate) onSelectTemplate(tmpl, { directLoad: false });
                        onClose();
                      }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px',
                        background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      <span>Gunakan Template AI</span>
                      <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
