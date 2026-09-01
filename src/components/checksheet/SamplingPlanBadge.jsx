import React, { useState, useMemo } from 'react';
import { getSamplingPlan, evaluateLotDisposition, evaluateSwitchingRules } from '../../utils/samplingPlanEngine';

/**
 * SamplingPlanBadge — Compact sampling status indicator for Mobile Check Sheet topbar
 * 
 * Displays: "Sample 3/13 (AQL 1.0, Level II)" with lot accept/reject status.
 * Tap to expand → full sampling plan details modal.
 */
export default function SamplingPlanBadge({
  lotSize = 500,
  aql = '1.0',
  inspectionLevel = 'II',
  currentSampleIndex = 0,
  ngCountInSample = 0,
  recentLotDecisions = [],
  inspectionSeverity = 'NORMAL',
  style = {}
}) {
  const [showDetail, setShowDetail] = useState(false);

  const plan = useMemo(() => {
    return getSamplingPlan(lotSize, aql, inspectionLevel);
  }, [lotSize, aql, inspectionLevel]);

  const disposition = useMemo(() => {
    return evaluateLotDisposition(ngCountInSample, plan.acceptNumber, plan.rejectNumber);
  }, [ngCountInSample, plan.acceptNumber, plan.rejectNumber]);

  const switchRec = useMemo(() => {
    return evaluateSwitchingRules(recentLotDecisions, inspectionSeverity);
  }, [recentLotDecisions, inspectionSeverity]);

  const isComplete = currentSampleIndex >= plan.sampleSize;
  const progress = plan.sampleSize > 0 ? Math.min(currentSampleIndex / plan.sampleSize, 1) : 0;

  // Badge color based on status
  const badgeColor = disposition.decision === 'REJECT'
    ? '#ef4444'
    : isComplete ? '#22c55e' : '#38bdf8';

  const badgeBg = disposition.decision === 'REJECT'
    ? 'rgba(239,68,68,.12)'
    : isComplete ? 'rgba(34,197,94,.1)' : 'rgba(56,189,248,.08)';

  return (
    <>
      {/* Compact Badge */}
      <button
        onClick={() => setShowDetail(true)}
        style={{
          fontSize: '9px',
          fontWeight: 800,
          color: badgeColor,
          backgroundColor: badgeBg,
          border: `1px solid ${badgeColor}40`,
          padding: '2px 7px',
          borderRadius: '12px',
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '3px',
          ...style
        }}
      >
        <span style={{ fontSize: '8px' }}>📋</span>
        <span>{currentSampleIndex}/{plan.sampleSize}</span>
        <span style={{ color: `${badgeColor}99`, fontSize: '8px' }}>AQL {plan.aql}</span>
      </button>

      {/* Detail Modal */}
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
              borderTop: '1px solid #262b33',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '16px 16px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>📋</span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#eef1f5' }}>
                    Sampling Plan (ISO 2859-1)
                  </div>
                  <div style={{ fontSize: '10.5px', color: '#8a919e' }}>
                    Single Sampling · {inspectionSeverity} Inspection · Level {inspectionLevel}
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

            {/* Plan Parameters Grid */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px'
            }}>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>LOT SIZE</div>
                <div style={cardValueStyle}>{lotSize}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>CODE LETTER</div>
                <div style={{ ...cardValueStyle, color: '#38bdf8' }}>{plan.codeLetter}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>AQL</div>
                <div style={{ ...cardValueStyle, color: '#a78bfa' }}>{plan.aql}%</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>SAMPLE SIZE (n)</div>
                <div style={cardValueStyle}>{plan.sampleSize}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>ACCEPT (Ac)</div>
                <div style={{ ...cardValueStyle, color: '#22c55e' }}>≤ {plan.acceptNumber}</div>
              </div>
              <div style={cardStyle}>
                <div style={cardLabelStyle}>REJECT (Re)</div>
                <div style={{ ...cardValueStyle, color: '#ef4444' }}>≥ {plan.rejectNumber}</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>
                  PROGRESS SAMPLING
                </span>
                <span style={{ fontSize: '10px', fontWeight: 900, color: badgeColor }}>
                  {currentSampleIndex} / {plan.sampleSize} ({Math.round(progress * 100)}%)
                </span>
              </div>
              <div style={{
                height: '6px',
                backgroundColor: '#1e293b',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${progress * 100}%`,
                  backgroundColor: badgeColor,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Current Disposition */}
            <div style={{
              backgroundColor: disposition.decision === 'REJECT' ? 'rgba(239,68,68,.1)' : 'rgba(34,197,94,.08)',
              border: `1px solid ${disposition.decision === 'REJECT' ? '#ef4444' : '#22c55e'}40`,
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '9px', fontWeight: 800, color: '#94a3b8' }}>KEPUTUSAN LOT</div>
                <div style={{
                  fontSize: '16px',
                  fontWeight: 900,
                  color: disposition.decision === 'REJECT' ? '#ef4444' : '#22c55e',
                  marginTop: '2px'
                }}>
                  {disposition.decision === 'REJECT' ? '⛔ LOT DITOLAK' : isComplete ? '✅ LOT DITERIMA' : '⏳ INSPEKSI BERLANGSUNG'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>NG ditemukan</div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: 900,
                  color: ngCountInSample > plan.acceptNumber ? '#ef4444' : '#22c55e',
                  fontFamily: 'monospace'
                }}>
                  {ngCountInSample}
                </div>
              </div>
            </div>

            {/* Switching Rule Recommendation */}
            {switchRec.recommendedLevel !== inspectionSeverity && (
              <div style={{
                backgroundColor: 'rgba(234,179,8,.08)',
                border: '1px solid rgba(234,179,8,.3)',
                borderRadius: '8px',
                padding: '8px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '14px' }}>⚠️</span>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: '#eab308' }}>
                    SWITCHING RULE: {inspectionSeverity} → {switchRec.recommendedLevel}
                  </div>
                  <div style={{ fontSize: '9px', color: '#a3a39e' }}>
                    {switchRec.reason}
                  </div>
                </div>
              </div>
            )}

            {/* ISO Reference */}
            <div style={{ fontSize: '8.5px', color: '#475569', textAlign: 'center', fontWeight: 700 }}>
              ISO 2859-1:1999 / ANSI Z1.4 · Single Sampling Plan · {inspectionSeverity} Inspection
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const cardStyle = {
  backgroundColor: '#1b1f26',
  borderRadius: '8px',
  padding: '8px',
  border: '1px solid #262b33',
  textAlign: 'center'
};

const cardLabelStyle = {
  fontSize: '8px',
  fontWeight: 800,
  color: '#64748b',
  letterSpacing: '0.4px',
  marginBottom: '2px'
};

const cardValueStyle = {
  fontSize: '16px',
  fontWeight: 900,
  color: '#f8fafc',
  fontFamily: 'monospace'
};
