import React, { useState, useMemo } from 'react';
import { getCalibrationStatus, isToolAllowedForMeasurement, TOOL_DEFINITIONS } from '../../utils/metrologyToolUtils';

/**
 * CalibrationStatusBadge — Inline calibration status indicator for Mobile Check Sheet
 * 
 * Shows calibration validity with color coding:
 * - ✅ Green: Valid
 * - ⚠️ Yellow: Due Soon (< 30 days)
 * - 🔴 Red: EXPIRED (lockout)
 * 
 * Tap to expand → calibration detail modal (cert, uncertainty, traceability).
 */
export default function CalibrationStatusBadge({
  toolType = 'caliper',
  onCalibrationExpired,
  style = {}
}) {
  const [showDetail, setShowDetail] = useState(false);

  const toolDef = useMemo(() => {
    return TOOL_DEFINITIONS.find(t => t.id === toolType) || TOOL_DEFINITIONS[0];
  }, [toolType]);

  const calStatus = useMemo(() => {
    return getCalibrationStatus(toolDef);
  }, [toolDef]);

  const isAllowed = useMemo(() => {
    return isToolAllowedForMeasurement(toolDef);
  }, [toolDef]);

  // Notify parent if expired
  React.useEffect(() => {
    if (!isAllowed && onCalibrationExpired) {
      onCalibrationExpired(toolDef);
    }
  }, [isAllowed, toolDef, onCalibrationExpired]);

  return (
    <>
      {/* Compact Inline Badge */}
      <button
        onClick={() => setShowDetail(true)}
        style={{
          fontSize: '8.5px',
          fontWeight: 800,
          color: calStatus.color,
          backgroundColor: calStatus.bg || 'transparent',
          border: `1px solid ${calStatus.color}40`,
          padding: '1px 6px',
          borderRadius: '10px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          animation: calStatus.status === 'EXPIRED' ? 'pulse 1.2s infinite' : 'none',
          ...style
        }}
      >
        <span style={{ fontSize: '7px' }}>{calStatus.icon}</span>
        <span>{calStatus.status === 'VALID' ? `CAL ✓` : calStatus.status === 'DUE_SOON' ? `CAL ${calStatus.daysRemaining}d` : 'CAL ✕'}</span>
      </button>

      {/* Detail Modal (Bottom Sheet) */}
      {showDetail && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.82)',
            backdropFilter: 'blur(5px)',
            zIndex: 100001,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end'
          }}
          onClick={() => setShowDetail(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#14171c',
              borderTop: `2px solid ${calStatus.color}`,
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '16px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>{toolDef.icon}</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#eef1f5' }}>
                    Status Kalibrasi Alat Ukur
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#8a919e' }}>
                    ISO 9001:2015 Clause 7.1.5 (Monitoring & Measuring Resources)
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowDetail(false)}
                style={{ background: 'none', border: 'none', color: '#8a919e', fontSize: '16px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Status Card */}
            <div style={{
              backgroundColor: calStatus.bg,
              border: `1.5px solid ${calStatus.color}`,
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '4px' }}>{calStatus.icon}</div>
              <div style={{
                fontSize: '14px',
                fontWeight: 900,
                color: calStatus.color,
                marginBottom: '2px'
              }}>
                {calStatus.status === 'VALID' ? 'KALIBRASI VALID' : calStatus.status === 'DUE_SOON' ? 'KALIBRASI SEGERA EXPIRED' : 'KALIBRASI EXPIRED'}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>
                {calStatus.label}
              </div>
              {calStatus.status === 'EXPIRED' && (
                <div style={{
                  marginTop: '8px',
                  padding: '6px 10px',
                  backgroundColor: 'rgba(239,68,68,.2)',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: 900,
                  color: '#fca5a5'
                }}>
                  ⛔ INPUT PENGUKURAN DIBLOKIR — Kalibrasi ulang alat sebelum melanjutkan inspeksi
                </div>
              )}
            </div>

            {/* Tool Information Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <InfoRow label="NAMA ALAT" value={toolDef.name} />
              <InfoRow label="KODE INVENTARIS" value={toolDef.code} color="#38bdf8" />
              <InfoRow label="SERTIFIKAT" value={toolDef.cert} color="#a78bfa" />
              <InfoRow label="RESOLUSI" value={`${toolDef.resolution} ${toolDef.uncertaintyUnit}`} />
              <InfoRow label="KALIBRASI TERAKHIR" value={toolDef.lastCalibrated ? new Date(toolDef.lastCalibrated).toLocaleDateString('id-ID') : '-'} />
              <InfoRow label="EXPIRED KALIBRASI" value={toolDef.calibrationDueDate ? new Date(toolDef.calibrationDueDate).toLocaleDateString('id-ID') : '-'} color={calStatus.color} />
              <InfoRow label="INTERVAL" value={`${toolDef.calibrationInterval} hari`} />
              <InfoRow label="UNCERTAINTY (U)" value={`± ${toolDef.uncertainty} ${toolDef.uncertaintyUnit}`} color="#eab308" />
            </div>

            {/* Traceability Chain */}
            <div style={{
              backgroundColor: '#1b1f26',
              borderRadius: '8px',
              padding: '8px 10px',
              border: '1px solid #262b33'
            }}>
              <div style={{ fontSize: '8.5px', fontWeight: 800, color: '#64748b', letterSpacing: '0.4px', marginBottom: '4px' }}>
                RANTAI KETERTELUSURAN (TRACEABILITY CHAIN)
              </div>
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>
                {toolDef.traceability || 'Tidak tersedia'}
              </div>
              <div style={{ fontSize: '9px', color: '#475569', marginTop: '3px' }}>
                Lab: {toolDef.calibratedBy || 'N/A'}
              </div>
            </div>

            {/* ISO Reference */}
            <div style={{ fontSize: '8.5px', color: '#475569', textAlign: 'center', fontWeight: 700 }}>
              ISO 9001:2015 Cl. 7.1.5 · ISO 10012 · ISO/IEC 17025 Accredited Calibration
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function InfoRow({ label, value, color = '#f8fafc' }) {
  return (
    <div style={{
      backgroundColor: '#1b1f26',
      borderRadius: '6px',
      padding: '6px 8px',
      border: '1px solid #262b33'
    }}>
      <div style={{ fontSize: '7.5px', fontWeight: 800, color: '#64748b', letterSpacing: '0.3px' }}>{label}</div>
      <div style={{ fontSize: '11px', fontWeight: 800, color, marginTop: '1px' }}>{value}</div>
    </div>
  );
}
