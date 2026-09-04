import React from 'react';
import { X, Sparkles, ClipboardList, CheckCircle2, ShieldCheck, Activity, Gauge, Layers, Sliders, Wrench, FileText, BarChart2 } from 'lucide-react';
import { MANUFACTURING_TEMPLATES } from '../templates/manufacturingTemplates';

const ICON_MAP = {
  ClipboardList, CheckCircle2, ShieldCheck, Activity, Gauge, Layers, Sliders, Wrench, FileText, BarChart2
};

export default function ManufacturingTemplatesModal({
  isOpen,
  onClose,
  onSelectTemplate
}) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
      zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#0a0f1d', border: '1px solid #1e293b', borderRadius: '16px',
        width: '100%', maxWidth: '880px', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)', overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                Manufacturing App Templates
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#94a3b8' }}>
                Pilih template industri siap pakai untuk langsung digenerate oleh AI Vibe Engine.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Templates Grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '14px' }}>
          {MANUFACTURING_TEMPLATES.map((tmpl) => {
            const IconComp = ICON_MAP[tmpl.icon] || ClipboardList;

            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  if (onSelectTemplate) onSelectTemplate(tmpl);
                  onClose();
                }}
                style={{
                  backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px',
                  display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#38bdf8';
                  e.currentTarget.style.backgroundColor = '#131e36';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#1e293b';
                  e.currentTarget.style.backgroundColor = '#0f172a';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComp size={16} color="#38bdf8" />
                  </div>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', backgroundColor: '#1e293b', padding: '2px 8px', borderRadius: '4px' }}>
                    {tmpl.category}
                  </span>
                </div>

                <h4 style={{ margin: '0 0 6px', fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>
                  {tmpl.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4', flex: 1 }}>
                  {tmpl.description}
                </p>

                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8' }}>
                    Gunakan Template →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
