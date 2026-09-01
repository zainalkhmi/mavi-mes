import React, { useMemo } from 'react';
import { fullSPCAnalysis, gradeCpk } from '../../utils/spcEngine';

/**
 * SPCMiniChart — Compact inline SPC visualization for Mobile Check Sheet
 * 
 * Features:
 * - X̄ Control Chart (mini SVG, 160px tall)
 * - Cpk Gauge (color-graded donut arc)
 * - Nelson Rule violation alert badges
 * - Histogram mini-overlay
 * - Collapsible panel for mobile UX
 * 
 * Uses pure inline SVG for lightweight rendering (no recharts dependency).
 */
export default function SPCMiniChart({
  parameterData = [],    // Array of measured values for this parameter (across samples/serials)
  usl,                   // Upper Specification Limit
  lsl,                   // Lower Specification Limit
  isExpanded = true,
  onToggle,
  subgroupSize = 5,
  style = {}
}) {
  const spc = useMemo(() => {
    return fullSPCAnalysis(parameterData, usl, lsl, subgroupSize);
  }, [parameterData, usl, lsl, subgroupSize]);

  if (!spc.hasData || parameterData.length < 3) {
    return (
      <div
        style={{
          backgroundColor: '#14171c',
          border: '1px solid #262b33',
          borderRadius: '8px',
          padding: '6px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          ...style
        }}
        onClick={onToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px' }}>📊</span>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700 }}>
            SPC · Data belum cukup ({parameterData.length}/{subgroupSize} sample)
          </span>
        </div>
        <span style={{ fontSize: '9px', color: '#475569', fontWeight: 700 }}>AIAG SPC</span>
      </div>
    );
  }

  const { capability, controlLimits, nelsonViolations, histogram, grade } = spc;

  // ─── X̄ CHART SVG DATA ──────────────────────────────────────
  const chartW = 240;
  const chartH = 80;
  const padding = { left: 0, right: 0, top: 8, bottom: 8 };
  const plotW = chartW - padding.left - padding.right;
  const plotH = chartH - padding.top - padding.bottom;

  const means = controlLimits.means;
  const { xBar, xUCL, xLCL } = controlLimits;
  const yMin = Math.min(xLCL, ...means) - Math.abs(xUCL - xLCL) * 0.15;
  const yMax = Math.max(xUCL, ...means) + Math.abs(xUCL - xLCL) * 0.15;
  const yRange = yMax - yMin || 1;

  const scaleX = (i) => padding.left + (i / Math.max(means.length - 1, 1)) * plotW;
  const scaleY = (v) => padding.top + plotH - ((v - yMin) / yRange) * plotH;

  const pointsPath = means.map((v, i) => `${i === 0 ? 'M' : 'L'} ${scaleX(i).toFixed(1)} ${scaleY(v).toFixed(1)}`).join(' ');

  // Nelson violation indices set
  const violationSet = new Set();
  nelsonViolations.forEach(v => v.indices.forEach(i => violationSet.add(i)));

  // ─── HISTOGRAM SVG DATA ────────────────────────────────────
  const histBins = histogram.bins || [];
  const maxCount = Math.max(...histBins.map(b => b.count), 1);
  const histW = 80;
  const histH = 50;
  const histBarW = histBins.length > 0 ? (histW / histBins.length) - 1 : 4;

  // ─── CPK ARC GAUGE ─────────────────────────────────────────
  const cpkVal = capability.cpk;
  const cpkAngle = Math.min(cpkVal / 2.5, 1) * 180; // 0-2.5 maps to 0-180 degrees
  const arcR = 22;
  const arcCx = 28;
  const arcCy = 28;

  const polarToCart = (cx, cy, r, deg) => {
    const rad = (deg - 180) * Math.PI / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };
  const arcStart = polarToCart(arcCx, arcCy, arcR, 0);
  const arcEnd = polarToCart(arcCx, arcCy, arcR, cpkAngle);
  const largeArc = cpkAngle > 180 ? 1 : 0;
  const arcPath = `M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 ${largeArc} 1 ${arcEnd.x} ${arcEnd.y}`;

  return (
    <div
      style={{
        backgroundColor: '#14171c',
        border: `1px solid ${nelsonViolations.length > 0 ? '#ef4444' : '#262b33'}`,
        borderRadius: '8px',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        ...style
      }}
    >
      {/* Header Bar (always visible) */}
      <div
        onClick={onToggle}
        style={{
          padding: '5px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: isExpanded ? '1px solid #262b33' : 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px' }}>📊</span>
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700 }}>SPC</span>
          {/* Cpk Badge */}
          <span
            style={{
              fontSize: '9px',
              fontWeight: 900,
              color: grade.color,
              backgroundColor: grade.bg,
              border: `1px solid ${grade.color}`,
              padding: '1px 6px',
              borderRadius: '10px',
              letterSpacing: '0.3px'
            }}
          >
            Cpk {cpkVal.toFixed(2)} ({grade.grade})
          </span>
          {/* Nelson violation badge */}
          {nelsonViolations.length > 0 && (
            <span
              style={{
                fontSize: '8px',
                fontWeight: 900,
                color: '#ef4444',
                backgroundColor: 'rgba(239,68,68,.12)',
                border: '1px solid #ef4444',
                padding: '1px 5px',
                borderRadius: '10px',
                animation: 'pulse 1.5s infinite'
              }}
            >
              ⚠ {nelsonViolations.length} Rule
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '8.5px', color: '#475569', fontWeight: 700 }}>n={spc.n}</span>
          <span style={{ fontSize: '10px', color: '#64748b', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>▾</span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '6px 8px 8px', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>

          {/* Left: X̄ Control Chart */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '8px', color: '#64748b', fontWeight: 800, marginBottom: '2px', letterSpacing: '0.4px' }}>
              X̄ CONTROL CHART
            </div>
            <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ display: 'block', backgroundColor: '#0b0d10', borderRadius: '4px' }}>
              {/* UCL / CL / LCL reference lines */}
              <line x1={padding.left} y1={scaleY(xUCL)} x2={chartW - padding.right} y2={scaleY(xUCL)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 2" />
              <line x1={padding.left} y1={scaleY(xBar)} x2={chartW - padding.right} y2={scaleY(xBar)} stroke="#22c55e" strokeWidth="0.8" />
              <line x1={padding.left} y1={scaleY(xLCL)} x2={chartW - padding.right} y2={scaleY(xLCL)} stroke="#ef4444" strokeWidth="0.8" strokeDasharray="3 2" />

              {/* Labels */}
              <text x={chartW - 2} y={scaleY(xUCL) - 2} fontSize="6" fill="#ef4444" textAnchor="end" fontWeight="800">UCL</text>
              <text x={chartW - 2} y={scaleY(xBar) - 2} fontSize="6" fill="#22c55e" textAnchor="end" fontWeight="800">X̄</text>
              <text x={chartW - 2} y={scaleY(xLCL) + 7} fontSize="6" fill="#ef4444" textAnchor="end" fontWeight="800">LCL</text>

              {/* Specification Limits (if visible in range) */}
              {usl && usl <= yMax && usl >= yMin && (
                <line x1={padding.left} y1={scaleY(usl)} x2={chartW} y2={scaleY(usl)} stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="5 3" />
              )}
              {lsl && lsl <= yMax && lsl >= yMin && (
                <line x1={padding.left} y1={scaleY(lsl)} x2={chartW} y2={scaleY(lsl)} stroke="#38bdf8" strokeWidth="0.6" strokeDasharray="5 3" />
              )}

              {/* Data line */}
              <path d={pointsPath} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinejoin="round" />

              {/* Data points */}
              {means.map((v, i) => {
                const isViolation = violationSet.has(i);
                return (
                  <circle
                    key={i}
                    cx={scaleX(i)}
                    cy={scaleY(v)}
                    r={isViolation ? 3.5 : 2.5}
                    fill={isViolation ? '#ef4444' : (v > xUCL || v < xLCL ? '#f97316' : '#38bdf8')}
                    stroke={isViolation ? '#ffffff' : 'none'}
                    strokeWidth={isViolation ? 0.8 : 0}
                  />
                );
              })}
            </svg>
          </div>

          {/* Right Column: Cpk Gauge + Histogram + Stats */}
          <div style={{ width: '100px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
            {/* Cpk Gauge Arc */}
            <svg width="56" height="36" viewBox="0 0 56 36">
              {/* Background arc */}
              <path d={`M ${polarToCart(arcCx, arcCy, arcR, 0).x} ${polarToCart(arcCx, arcCy, arcR, 0).y} A ${arcR} ${arcR} 0 0 1 ${polarToCart(arcCx, arcCy, arcR, 180).x} ${polarToCart(arcCx, arcCy, arcR, 180).y}`}
                fill="none" stroke="#1e293b" strokeWidth="5" strokeLinecap="round" />
              {/* Value arc */}
              {cpkAngle > 0 && (
                <path d={arcPath} fill="none" stroke={grade.color} strokeWidth="5" strokeLinecap="round" />
              )}
              {/* Center text */}
              <text x={arcCx} y={arcCy + 2} fontSize="10" fontWeight="900" fill={grade.color} textAnchor="middle" fontFamily="monospace">
                {cpkVal.toFixed(2)}
              </text>
              <text x={arcCx} y={arcCy + 9} fontSize="5" fontWeight="800" fill="#64748b" textAnchor="middle">
                Cpk
              </text>
            </svg>

            {/* Mini Histogram */}
            {histBins.length > 0 && (
              <svg width="80" height={histH} viewBox={`0 0 ${histW} ${histH}`} style={{ display: 'block' }}>
                {histBins.map((bin, i) => {
                  const barH = (bin.count / maxCount) * (histH - 4);
                  const x = i * (histBarW + 1);
                  const isInSpec = bin.midpoint >= (lsl || -Infinity) && bin.midpoint <= (usl || Infinity);
                  return (
                    <rect
                      key={i}
                      x={x}
                      y={histH - barH}
                      width={Math.max(histBarW, 2)}
                      height={barH}
                      rx={1}
                      fill={isInSpec ? 'rgba(56,189,248,.5)' : 'rgba(239,68,68,.5)'}
                    />
                  );
                })}
              </svg>
            )}

            {/* Quick Stats */}
            <div style={{ fontSize: '7.5px', color: '#64748b', fontWeight: 700, textAlign: 'center', lineHeight: 1.4 }}>
              <div>Cp: <span style={{ color: '#f8fafc' }}>{capability.cp.toFixed(2)}</span></div>
              <div>Ppk: <span style={{ color: '#f8fafc' }}>{capability.ppk.toFixed(2)}</span></div>
              <div>σ: <span style={{ color: '#f8fafc' }}>{capability.sigma_within.toFixed(4)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Nelson Rule Violations Detail (if any) */}
      {isExpanded && nelsonViolations.length > 0 && (
        <div style={{ padding: '4px 8px 6px', borderTop: '1px solid rgba(239,68,68,.2)' }}>
          {nelsonViolations.map((v, i) => (
            <div key={i} style={{ fontSize: '8px', color: '#fca5a5', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '1px' }}>
              <span style={{ color: '#ef4444' }}>⚠</span>
              <span>Rule {v.ruleId}: {v.description}</span>
              <span style={{ color: '#64748b' }}>({v.indices.length} pts)</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
