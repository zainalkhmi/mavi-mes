/**
 * SimpleDigitalCheckSheet.jsx
 * =====================================================
 * Simple Digital Check Sheet - Type 2
 * Clean, minimal interface for factory floor inspection
 * =====================================================
 */

import React, { useState, useEffect } from 'react';
import { Check, X, Camera, Signature, Clock, User, FileText, Download, ChevronDown, ChevronUp } from 'lucide-react';

export default function SimpleDigitalCheckSheet({ checkSheetData, onComplete, onCancel }) {
  const [responses, setResponses] = useState({});
  const [expandedItems, setExpandedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [photos, setPhotos] = useState({});
  const [showSignature, setShowSignature] = useState(false);
  const [signature, setSignature] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize responses
  useEffect(() => {
    if (checkSheetData?.items) {
      const initial = {};
      checkSheetData.items.forEach((item, idx) => {
        initial[idx] = null; // null = not checked
      });
      setResponses(initial);
    }
  }, [checkSheetData]);

  const toggleItem = (index, value) => {
    setResponses(prev => ({ ...prev, [index]: value }));
  };

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNoteChange = (index, value) => {
    setNotes(prev => ({ ...prev, [index]: value }));
  };

  const handlePhotoCapture = (index) => {
    // Simulate photo capture - in production, integrate with camera
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPhotos(prev => ({ ...prev, [index]: ev.target?.result }));
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const allItemsChecked = Object.values(responses).every(v => v !== null);
  const okCount = Object.values(responses).filter(v => v === true).length;
  const ngCount = Object.values(responses).filter(v => v === false).length;

  const handleSubmit = async () => {
    if (!submitterName.trim()) {
      alert('Mohon isi nama submitter');
      return;
    }

    if (!allItemsChecked) {
      alert('Mohon lengkapi semua inspection point');
      return;
    }

    setIsSubmitting(true);

    const result = {
      ...checkSheetData,
      responses,
      notes,
      photos,
      signature,
      submitterName,
      completedAt: new Date().toISOString(),
      status: ngCount > 0 ? 'NG' : 'OK',
      okCount,
      ngCount
    };

    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));

    localStorage.setItem('mandor_simple_checksheet_result', JSON.stringify(result));

    if (onComplete) onComplete(result);
    setIsSubmitting(false);
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#F1F5F9',
      fontFamily: "'Inter', sans-serif",
    },
    header: {
      backgroundColor: '#1E293B',
      color: 'white',
      padding: '1rem 1.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    },
    headerTop: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
    },
    title: {
      fontSize: '1.1rem',
      fontWeight: '700',
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
    },
    statusRow: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      opacity: 0.9,
    },
    infoBar: {
      display: 'flex',
      gap: '1rem',
      backgroundColor: 'white',
      padding: '0.75rem 1rem',
      borderBottom: '1px solid #E2E8F0',
      overflowX: 'auto',
    },
    infoItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
      fontSize: '0.8rem',
      color: '#64748B',
      whiteSpace: 'nowrap',
    },
    summary: {
      display: 'flex',
      gap: '0.75rem',
      padding: '1rem',
      backgroundColor: 'white',
      borderBottom: '1px solid #E2E8F0',
    },
    summaryItem: {
      flex: 1,
      textAlign: 'center',
      padding: '0.75rem',
      borderRadius: '8px',
    },
    summaryValue: {
      fontSize: '1.5rem',
      fontWeight: '700',
    },
    summaryLabel: {
      fontSize: '0.7rem',
      color: '#64748B',
      marginTop: '0.25rem',
    },
    content: {
      padding: '1rem',
    },
    item: {
      backgroundColor: 'white',
      borderRadius: '12px',
      marginBottom: '0.75rem',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    itemHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '1rem',
      cursor: 'pointer',
    },
    itemNumber: {
      width: '2rem',
      height: '2rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '600',
      fontSize: '0.85rem',
      marginRight: '0.75rem',
      flexShrink: 0,
    },
    itemInfo: {
      flex: 1,
      minWidth: 0,
    },
    itemName: {
      fontWeight: '600',
      fontSize: '0.95rem',
      color: '#1E293B',
    },
    itemSpec: {
      fontSize: '0.75rem',
      color: '#64748B',
      marginTop: '0.15rem',
    },
    itemActions: {
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
    },
    btn: {
      padding: '0.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s',
    },
    btnOk: {
      backgroundColor: '#DCFCE7',
      color: '#16A34A',
      border: '2px solid #DCFCE7',
    },
    btnOkActive: {
      backgroundColor: '#16A34A',
      color: 'white',
      border: '2px solid #16A34A',
    },
    btnNg: {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      border: '2px solid #FEE2E2',
    },
    btnNgActive: {
      backgroundColor: '#DC2626',
      color: 'white',
      border: '2px solid #DC2626',
    },
    resultBadge: {
      width: '2.5rem',
      height: '2.5rem',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    expanded: {
      padding: '1rem',
      borderTop: '1px solid #F1F5F9',
      backgroundColor: '#F8FAFC',
    },
    noteInput: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      fontSize: '0.85rem',
      resize: 'vertical',
      minHeight: '60px',
      fontFamily: 'inherit',
    },
    photoThumb: {
      width: '60px',
      height: '60px',
      borderRadius: '8px',
      objectFit: 'cover',
      border: '2px solid #E2E8F0',
    },
    footer: {
      padding: '1rem',
      backgroundColor: 'white',
      borderTop: '1px solid #E2E8F0',
      position: 'sticky',
      bottom: 0,
    },
    submitterSection: {
      marginBottom: '1rem',
    },
    label: {
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#64748B',
      marginBottom: '0.35rem',
      display: 'block',
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '8px',
      border: '1px solid #E2E8F0',
      fontSize: '0.9rem',
      fontFamily: 'inherit',
    },
    submitBtn: {
      width: '100%',
      padding: '1rem',
      backgroundColor: allItemsChecked ? '#16A34A' : '#94A3B8',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: allItemsChecked ? 'pointer' : 'not-allowed',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
    },
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.title}>
            <FileText size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
            {checkSheetData?.name || 'Digital Check Sheet'}
          </div>
          <div style={{
            ...styles.badge,
            backgroundColor: ngCount > 0 ? '#FEE2E2' : '#DCFCE7',
            color: ngCount > 0 ? '#DC2626' : '#16A34A'
          }}>
            {ngCount > 0 ? 'NG' : 'OK'}
          </div>
        </div>
        <div style={styles.statusRow}>
          <span>📋 {checkSheetData?.workOrder || 'Work Order'}</span>
          <span>⏰ {currentTime.toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      {/* Info Bar */}
      <div style={styles.infoBar}>
        <div style={styles.infoItem}>
          <User size={14} /> {submitterName || 'Operator'}
        </div>
        <div style={styles.infoItem}>
          <Clock size={14} /> {currentTime.toLocaleDateString('id-ID')}
        </div>
        <div style={styles.infoItem}>
          📍 Station: {checkSheetData?.station || 'A-01'}
        </div>
      </div>

      {/* Summary */}
      <div style={styles.summary}>
        <div style={{ ...styles.summaryItem, backgroundColor: '#DCFCE7' }}>
          <div style={{ ...styles.summaryValue, color: '#16A34A' }}>{okCount}</div>
          <div style={styles.summaryLabel}>✓ OK</div>
        </div>
        <div style={{ ...styles.summaryItem, backgroundColor: '#FEE2E2' }}>
          <div style={{ ...styles.summaryValue, color: '#DC2626' }}>{ngCount}</div>
          <div style={styles.summaryLabel}>✗ NG</div>
        </div>
        <div style={{ ...styles.summaryItem, backgroundColor: '#F1F5F9' }}>
          <div style={{ ...styles.summaryValue, color: '#64748B' }}>{checkSheetData?.items?.length || 0}</div>
          <div style={styles.summaryLabel}>📋 Total</div>
        </div>
      </div>

      {/* Items */}
      <div style={styles.content}>
        {checkSheetData?.items?.map((item, index) => (
          <div key={index} style={styles.item}>
            <div style={styles.itemHeader} onClick={() => toggleExpand(index)}>
              <div style={{
                ...styles.itemNumber,
                backgroundColor: responses[index] === true ? '#DCFCE7' : responses[index] === false ? '#FEE2E2' : '#F1F5F9',
                color: responses[index] === true ? '#16A34A' : responses[index] === false ? '#DC2626' : '#64748B',
              }}>
                {index + 1}
              </div>
              <div style={styles.itemInfo}>
                <div style={styles.itemName}>{item.name}</div>
                {item.spec && <div style={styles.itemSpec}>Spec: {item.spec}</div>}
                {item.tolerance && <div style={styles.itemSpec}>Tolerance: {item.tolerance}</div>}
              </div>
              <div style={styles.itemActions}>
                {responses[index] !== null && (
                  <div style={{
                    ...styles.resultBadge,
                    backgroundColor: responses[index] ? '#DCFCE7' : '#FEE2E2',
                  }}>
                    {responses[index] ? <Check size={18} color="#16A34A" /> : <X size={18} color="#DC2626" />}
                  </div>
                )}
                <button style={{ ...styles.btn, backgroundColor: '#F1F5F9' }}>
                  {expandedItems[index] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
              </div>
            </div>

            {/* OK/NG Buttons */}
            <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => toggleItem(index, true)}
                style={{
                  ...styles.btn,
                  flex: 1,
                  ...(responses[index] === true ? styles.btnOkActive : styles.btnOk),
                }}
              >
                <Check size={20} /> OK
              </button>
              <button
                onClick={() => toggleItem(index, false)}
                style={{
                  ...styles.btn,
                  flex: 1,
                  ...(responses[index] === false ? styles.btnNgActive : styles.btnNg),
                }}
              >
                <X size={20} /> NG
              </button>
            </div>

            {/* Expanded Details */}
            {expandedItems[index] && (
              <div style={styles.expanded}>
                {item.description && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    <span style={{ ...styles.label }}>Description</span>
                    <p style={{ fontSize: '0.85rem', color: '#64748B' }}>{item.description}</p>
                  </div>
                )}

                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ ...styles.label }}>Catatan</span>
                  <textarea
                    placeholder="Tambahkan catatan jika diperlukan..."
                    value={notes[index] || ''}
                    onChange={(e) => handleNoteChange(index, e.target.value)}
                    style={styles.noteInput}
                  />
                </div>

                <div>
                  <span style={{ ...styles.label }}>Photo Evidence</span>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {photos[index] ? (
                      <img src={photos[index]} alt="Photo" style={styles.photoThumb} />
                    ) : (
                      <button
                        onClick={() => handlePhotoCapture(index)}
                        style={{
                          ...styles.btn,
                          padding: '0.75rem',
                          backgroundColor: '#F1F5F9',
                          border: '2px dashed #CBD5E1',
                        }}
                      >
                        <Camera size={20} color="#64748B" />
                      </button>
                    )}
                    {photos[index] && (
                      <button
                        onClick={() => handlePhotoCapture(index)}
                        style={{ ...styles.btn, padding: '0.5rem', backgroundColor: '#F1F5F9' }}
                      >
                        <Camera size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <div style={styles.submitterSection}>
          <label style={styles.label}>Nama Operator *</label>
          <input
            type="text"
            placeholder="Masukkan nama Anda"
            value={submitterName}
            onChange={(e) => setSubmitterName(e.target.value)}
            style={styles.input}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allItemsChecked || !submitterName.trim() || isSubmitting}
          style={styles.submitBtn}
        >
          {isSubmitting ? (
            <>⏳ Menyimpan...</>
          ) : (
            <>
              <Download size={20} />
              {ngCount > 0 ? 'Submit dengan NG' : 'Submit Check Sheet'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
