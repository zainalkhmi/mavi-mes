import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckCircle2, AlertCircle, X, ShieldCheck, Tag, Hash, ListFilter, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PreInspectionGateModal
 * Dialog berukuran besar di tengah layar untuk mengisi field identifikasi part
 * (seperti Nomor Lot / Batch, No Heat, Cavity, Shift) sebelum operator mengisi titik ukur.
 */
export default function PreInspectionGateModal({
  isOpen,
  onClose,
  fields = [],
  values = {},
  onSave,
  onSubmit,
  partInfo = {}
}) {
  const [formData, setFormData] = useState(() => {
    const initial = { ...values };
    fields.forEach(f => {
      if (initial[f.id] === undefined || initial[f.id] === null) {
        if (f.type === 'option' && f.options?.length > 0) {
          initial[f.id] = f.options[0];
        } else {
          initial[f.id] = f.defaultValue || '';
        }
      }
    });
    return initial;
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => {
        const next = { ...values, ...prev };
        fields.forEach(f => {
          if (next[f.id] === undefined || next[f.id] === null) {
            if (f.type === 'option' && f.options?.length > 0) {
              next[f.id] = f.options[0];
            } else {
              next[f.id] = f.defaultValue || '';
            }
          }
        });
        return next;
      });
      setErrors({});
    }
  }, [isOpen, fields, values]);

  if (!isOpen) return null;

  const handleChange = (fieldId, val) => {
    setFormData(prev => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  };

  const handleValidateAndSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const newErrors = {};

    fields.forEach(field => {
      const val = formData[field.id];
      if (field.required && (val === undefined || val === null || val.toString().trim() === '')) {
        newErrors[field.id] = `${field.label} wajib diisi sebelum mulai inspeksi!`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErr = Object.values(newErrors)[0];
      toast.error(firstErr, { icon: '⚠️' });
      return;
    }

    if (typeof onSave === 'function') {
      onSave(formData);
    }
    if (typeof onSubmit === 'function') {
      onSubmit(formData);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(2, 6, 23, 0.85)',
        backdropFilter: 'blur(8px)',
        padding: '16px'
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: '#0f172a',
          border: '2px solid #0284c7',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 30px rgba(2, 132, 199, 0.3)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          animation: 'modalSlideUp 0.25s ease-out'
        }}
      >
        {/* Header Dialog */}
        <div
          style={{
            padding: '18px 22px',
            backgroundColor: '#090d16',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(2, 132, 199, 0.2)',
                border: '1.5px solid #0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8'
              }}
            >
              <ClipboardList size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '0.3px' }}>
                FORM IDENTIFIKASI & PRA-INSPEKSI PART
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>
                Lengkapi data lot & traceability sebelum memulai pengukuran titik check sheet
              </div>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#1e293b',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Tutup Form"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Part Context Banner */}
        <div
          style={{
            padding: '8px 22px',
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#cbd5e1'
          }}
        >
          <div>
            <span style={{ color: '#94a3b8' }}>Part:</span> <strong style={{ color: '#f8fafc' }}>{partInfo.partNo || 'PART-001'}</strong> ({partInfo.partName || 'Precision Component'})
          </div>
          <div>
            <span style={{ color: '#94a3b8' }}>WO:</span> <strong style={{ color: '#38bdf8' }}>{partInfo.workOrderNo || 'WO-2026'}</strong>
          </div>
        </div>

        {/* Form Body - Large Inputs */}
        <form onSubmit={handleValidateAndSubmit} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px', maxHeight: '65vh', overflowY: 'auto' }}>
          {fields.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.82rem' }}>
              Tidak ada field pra-inspeksi kustom yang diatur untuk template ini.
            </div>
          ) : (
            fields.map((field) => {
              const currentVal = formData[field.id] !== undefined ? formData[field.id] : '';
              const hasError = !!errors[field.id];

              return (
                <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Label Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {field.type === 'number' && <Hash size={14} color="#38bdf8" />}
                      {field.type === 'combobox' && <ListFilter size={14} color="#a78bfa" />}
                      {field.type === 'option' && <Sliders size={14} color="#f59e0b" />}
                      {field.type === 'textbox' && <Tag size={14} color="#10b981" />}
                      <span>{field.label}</span>
                      {field.required && <span style={{ color: '#ef4444', fontWeight: 900 }}>*</span>}
                    </label>
                    <span style={{
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: field.required ? 'rgba(239, 68, 68, 0.18)' : 'rgba(100, 116, 139, 0.2)',
                      color: field.required ? '#f87171' : '#94a3b8'
                    }}>
                      {field.required ? 'WAJIB DIISI' : 'OPSIONAL'}
                    </span>
                  </div>

                  {/* Input Besar: Textbox */}
                  {field.type === 'textbox' && (
                    <input
                      type="text"
                      value={currentVal}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || `Masukkan ${field.label}`}
                      autoFocus={field.required}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 16px',
                        backgroundColor: '#090d16',
                        border: hasError ? '2px solid #ef4444' : '2px solid #334155',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '1.05rem',
                        fontWeight: 700,
                        outline: 'none',
                        transition: 'border 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = hasError ? '#ef4444' : '#38bdf8'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = hasError ? '#ef4444' : '#334155'; }}
                    />
                  )}

                  {/* Input Besar: Number */}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      value={currentVal}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      placeholder={field.placeholder || '0'}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 16px',
                        backgroundColor: '#090d16',
                        border: hasError ? '2px solid #ef4444' : '2px solid #334155',
                        borderRadius: '10px',
                        color: '#67e8f9',
                        fontFamily: 'monospace',
                        fontSize: '1.25rem',
                        fontWeight: 800,
                        outline: 'none',
                        transition: 'border 0.2s',
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)'
                      }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = hasError ? '#ef4444' : '#38bdf8'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = hasError ? '#ef4444' : '#334155'; }}
                    />
                  )}

                  {/* Input Besar: Combo Box (Dropdown) */}
                  {field.type === 'combobox' && (
                    <select
                      value={currentVal}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        padding: '12px 16px',
                        backgroundColor: '#090d16',
                        border: hasError ? '2px solid #ef4444' : '2px solid #334155',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '1rem',
                        fontWeight: 700,
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="">-- Pilih {field.label} --</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}

                  {/* Input Besar: Option (Segmented Buttons / Radio) */}
                  {field.type === 'option' && (
                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(field.options?.length || 2, 4)}, 1fr)`, gap: '8px' }}>
                      {(field.options || ['Opsi 1', 'Opsi 2']).map((opt, i) => {
                        const isSelected = currentVal === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleChange(field.id, opt)}
                            style={{
                              padding: '12px 10px',
                              borderRadius: '10px',
                              border: isSelected ? '2px solid #38bdf8' : '1px solid #334155',
                              backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#090d16',
                              color: isSelected ? '#38bdf8' : '#cbd5e1',
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              transition: 'all 0.15s'
                            }}
                          >
                            {isSelected && <CheckCircle2 size={14} color="#38bdf8" />}
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Error Message */}
                  {hasError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f87171', fontSize: '0.72rem', fontWeight: 700, marginTop: '2px' }}>
                      <AlertCircle size={13} />
                      <span>{errors[field.id]}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Submit Button */}
          <div style={{ marginTop: '10px' }}>
            <button
              type="submit"
              onClick={handleValidateAndSubmit}
              style={{
                width: '100%',
                padding: '14px',
                background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '0.95rem',
                fontWeight: 900,
                letterSpacing: '0.4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(2, 132, 199, 0.45)',
                transition: 'all 0.2s'
              }}
            >
              <ShieldCheck size={18} />
              <span>✓ SIMPAN DATA & MULAI UKUR POINT CHECK ➔</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
