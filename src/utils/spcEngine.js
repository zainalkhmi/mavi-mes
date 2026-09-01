/**
 * SPC Engine — Statistical Process Control Calculator (ISO 9001:2015 Clause 9.1.3)
 * 
 * Provides real-time Cpk/Ppk calculation, X̄-R control chart data generation,
 * Nelson Rules detection, and histogram binning for dimensional inspection data.
 * 
 * Standards: AIAG SPC Manual 2nd Ed, IATF 16949 (8.2.3.1), ISO 22514
 */

// ─── CONSTANTS ─────────────────────────────────────────────────
const A2_TABLE = { 2: 1.880, 3: 1.023, 4: 0.729, 5: 0.577, 6: 0.483, 7: 0.419, 8: 0.373, 9: 0.337, 10: 0.308 };
const D3_TABLE = { 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0.076, 8: 0.136, 9: 0.184, 10: 0.223 };
const D4_TABLE = { 2: 3.267, 3: 2.574, 4: 2.282, 5: 2.114, 6: 2.004, 7: 1.924, 8: 1.864, 9: 1.816, 10: 1.777 };
const d2_TABLE = { 2: 1.128, 3: 1.693, 4: 2.059, 5: 2.326, 6: 2.534, 7: 2.704, 8: 2.847, 9: 2.970, 10: 3.078 };

// ─── BASIC STATISTICS ──────────────────────────────────────────
export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function stdDev(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function range(arr) {
  if (!arr || arr.length === 0) return 0;
  return Math.max(...arr) - Math.min(...arr);
}

// ─── SUBGROUP CALCULATION ──────────────────────────────────────
/**
 * Split raw measurement data into subgroups of size n
 * @param {number[]} data - Array of measured values
 * @param {number} subgroupSize - Subgroup size (typically 3-5)
 * @returns {{ means: number[], ranges: number[], subgroups: number[][] }}
 */
export function calculateSubgroups(data, subgroupSize = 5) {
  if (!data || data.length < subgroupSize) {
    return { means: [], ranges: [], subgroups: [] };
  }

  const subgroups = [];
  const means = [];
  const ranges = [];

  for (let i = 0; i <= data.length - subgroupSize; i += subgroupSize) {
    const sg = data.slice(i, i + subgroupSize);
    subgroups.push(sg);
    means.push(mean(sg));
    ranges.push(range(sg));
  }

  return { means, ranges, subgroups };
}

// ─── CONTROL LIMITS (X̄-R CHART) ───────────────────────────────
/**
 * Calculate X̄-R control chart limits
 * @param {number[]} data - All measured values
 * @param {number} subgroupSize - Subgroup size (2-10)
 * @returns {{ xBar, rBar, xUCL, xLCL, rUCL, rLCL, means, ranges }}
 */
export function calculateControlLimits(data, subgroupSize = 5) {
  const sg = calculateSubgroups(data, subgroupSize);
  if (sg.means.length < 2) {
    return {
      xBar: mean(data), rBar: 0,
      xUCL: 0, xLCL: 0, rUCL: 0, rLCL: 0,
      means: sg.means, ranges: sg.ranges
    };
  }

  const n = Math.min(Math.max(subgroupSize, 2), 10);
  const xBar = mean(sg.means);
  const rBar = mean(sg.ranges);

  const A2 = A2_TABLE[n] || 0.577;
  const D3 = D3_TABLE[n] || 0;
  const D4 = D4_TABLE[n] || 2.114;

  return {
    xBar,
    rBar,
    xUCL: xBar + A2 * rBar,
    xLCL: xBar - A2 * rBar,
    rUCL: D4 * rBar,
    rLCL: D3 * rBar,
    means: sg.means,
    ranges: sg.ranges
  };
}

// ─── PROCESS CAPABILITY (Cp / Cpk / Pp / Ppk) ─────────────────
/**
 * Calculate process capability indices
 * @param {number[]} data - All measured values
 * @param {number} usl - Upper Specification Limit
 * @param {number} lsl - Lower Specification Limit
 * @param {number} subgroupSize - Subgroup size for within-group sigma
 * @returns {{ cp, cpk, pp, ppk, cpupper, cplower, sigma_within, sigma_overall }}
 */
export function evaluateCapability(data, usl, lsl, subgroupSize = 5) {
  if (!data || data.length < 2 || usl <= lsl) {
    return { cp: 0, cpk: 0, pp: 0, ppk: 0, cpupper: 0, cplower: 0, sigma_within: 0, sigma_overall: 0 };
  }

  const xBar = mean(data);
  const n = Math.min(Math.max(subgroupSize, 2), 10);
  const d2 = d2_TABLE[n] || 2.326;

  // Within-subgroup sigma (short-term)
  const sg = calculateSubgroups(data, subgroupSize);
  const rBar = sg.ranges.length > 0 ? mean(sg.ranges) : range(data);
  const sigma_within = rBar / d2;

  // Overall sigma (long-term)
  const sigma_overall = stdDev(data);

  // Cp / Cpk (short-term, within-group variation)
  const cp = sigma_within > 0 ? (usl - lsl) / (6 * sigma_within) : 0;
  const cpupper = sigma_within > 0 ? (usl - xBar) / (3 * sigma_within) : 0;
  const cplower = sigma_within > 0 ? (xBar - lsl) / (3 * sigma_within) : 0;
  const cpk = Math.min(cpupper, cplower);

  // Pp / Ppk (long-term, overall variation)
  const pp = sigma_overall > 0 ? (usl - lsl) / (6 * sigma_overall) : 0;
  const ppupper = sigma_overall > 0 ? (usl - xBar) / (3 * sigma_overall) : 0;
  const pplower = sigma_overall > 0 ? (xBar - lsl) / (3 * sigma_overall) : 0;
  const ppk = Math.min(ppupper, pplower);

  return {
    cp: Math.max(0, cp),
    cpk: Math.max(0, cpk),
    pp: Math.max(0, pp),
    ppk: Math.max(0, ppk),
    cpupper: Math.max(0, cpupper),
    cplower: Math.max(0, cplower),
    sigma_within,
    sigma_overall,
    xBar,
    usl,
    lsl
  };
}

// ─── NELSON RULES (8 SPC Out-of-Control Tests) ────────────────
/**
 * Detect Nelson Rule violations on an X̄ chart
 * @param {number[]} means - Subgroup means
 * @param {number} centerLine - X̄ (grand mean)
 * @param {number} ucl - Upper Control Limit
 * @param {number} lcl - Lower Control Limit
 * @returns {{ ruleId: number, description: string, indices: number[] }[]}
 */
export function detectNelsonRules(means, centerLine, ucl, lcl) {
  const violations = [];
  if (!means || means.length < 2) return violations;

  const sigma = (ucl - centerLine) / 3;
  const sigma1Up = centerLine + sigma;
  const sigma1Dn = centerLine - sigma;
  const sigma2Up = centerLine + 2 * sigma;
  const sigma2Dn = centerLine - 2 * sigma;

  // Rule 1: Any single point beyond 3σ (beyond UCL/LCL)
  const r1 = [];
  means.forEach((v, i) => { if (v > ucl || v < lcl) r1.push(i); });
  if (r1.length > 0) violations.push({ ruleId: 1, description: 'Point beyond ±3σ control limit', indices: r1 });

  // Rule 2: Nine+ points in a row on the same side of the center line
  const r2 = [];
  let runCount = 1;
  for (let i = 1; i < means.length; i++) {
    if ((means[i] > centerLine && means[i - 1] > centerLine) ||
        (means[i] < centerLine && means[i - 1] < centerLine)) {
      runCount++;
      if (runCount >= 9) {
        for (let j = i - 8; j <= i; j++) r2.push(j);
      }
    } else {
      runCount = 1;
    }
  }
  if (r2.length > 0) violations.push({ ruleId: 2, description: '9+ points on same side of center', indices: [...new Set(r2)] });

  // Rule 3: Six+ points in a row steadily increasing or decreasing (trend)
  const r3 = [];
  let trendUp = 0, trendDn = 0;
  for (let i = 1; i < means.length; i++) {
    if (means[i] > means[i - 1]) { trendUp++; trendDn = 0; }
    else if (means[i] < means[i - 1]) { trendDn++; trendUp = 0; }
    else { trendUp = 0; trendDn = 0; }
    if (trendUp >= 6 || trendDn >= 6) {
      const startIdx = i - (trendUp >= 6 ? trendUp : trendDn);
      for (let j = startIdx; j <= i; j++) r3.push(j);
    }
  }
  if (r3.length > 0) violations.push({ ruleId: 3, description: '6+ points trending (up or down)', indices: [...new Set(r3)] });

  // Rule 5: Two of three successive points beyond 2σ (same side)
  const r5 = [];
  for (let i = 2; i < means.length; i++) {
    const window = [means[i - 2], means[i - 1], means[i]];
    const above2 = window.filter(v => v > sigma2Up).length;
    const below2 = window.filter(v => v < sigma2Dn).length;
    if (above2 >= 2 || below2 >= 2) {
      r5.push(i - 2, i - 1, i);
    }
  }
  if (r5.length > 0) violations.push({ ruleId: 5, description: '2 of 3 points beyond ±2σ', indices: [...new Set(r5)] });

  return violations;
}

// ─── HISTOGRAM BINNING ─────────────────────────────────────────
/**
 * Generate histogram bin data from measurement array
 * @param {number[]} data - Measurement values
 * @param {number} numBins - Number of histogram bins (default: auto)
 * @param {number} [lsl] - Lower spec limit for overlay
 * @param {number} [usl] - Upper spec limit for overlay
 * @returns {{ bins: { min, max, count, midpoint }[], lsl, usl }}
 */
export function generateHistogram(data, numBins = 0, lsl, usl) {
  if (!data || data.length < 2) return { bins: [], lsl, usl };

  // Sturges' rule for auto bin count
  if (numBins <= 0) {
    numBins = Math.max(5, Math.min(20, Math.ceil(1 + 3.322 * Math.log10(data.length))));
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins || 0.001;

  const bins = [];
  for (let i = 0; i < numBins; i++) {
    const binMin = min + i * binWidth;
    const binMax = min + (i + 1) * binWidth;
    const count = data.filter(v => v >= binMin && (i === numBins - 1 ? v <= binMax : v < binMax)).length;
    bins.push({ min: binMin, max: binMax, count, midpoint: (binMin + binMax) / 2 });
  }

  return { bins, lsl, usl, min, max, binWidth };
}

// ─── CAPABILITY STATUS GRADE ───────────────────────────────────
/**
 * Grade the Cpk value against industry thresholds
 * @param {number} cpk
 * @returns {{ grade: string, color: string, label: string }}
 */
export function gradeCpk(cpk) {
  if (cpk >= 2.0)  return { grade: 'A+', color: '#22c55e', label: 'Six Sigma (World Class)', bg: 'rgba(34,197,94,.15)' };
  if (cpk >= 1.67) return { grade: 'A',  color: '#22c55e', label: 'Sangat Baik (Capable)', bg: 'rgba(34,197,94,.12)' };
  if (cpk >= 1.33) return { grade: 'B',  color: '#38bdf8', label: 'Baik (Acceptable)', bg: 'rgba(56,189,248,.12)' };
  if (cpk >= 1.0)  return { grade: 'C',  color: '#eab308', label: 'Marginal (Perlu Improvement)', bg: 'rgba(234,179,8,.12)' };
  if (cpk >= 0.67) return { grade: 'D',  color: '#f97316', label: 'Kurang (Corrective Action)', bg: 'rgba(249,115,22,.12)' };
  return { grade: 'F', color: '#ef4444', label: 'Tidak Capable (Critical)', bg: 'rgba(239,68,68,.12)' };
}

// ─── CONVENIENCE: Full SPC Summary ─────────────────────────────
/**
 * One-call full SPC analysis for a single parameter
 * @param {number[]} data - All measured values for this parameter
 * @param {number} usl - Upper Specification Limit
 * @param {number} lsl - Lower Specification Limit
 * @param {number} subgroupSize - Subgroup size (default 5)
 * @returns {object} Complete SPC summary
 */
export function fullSPCAnalysis(data, usl, lsl, subgroupSize = 5) {
  const validData = (data || []).filter(v => typeof v === 'number' && !isNaN(v));
  
  if (validData.length < 2) {
    return {
      hasData: false,
      n: validData.length,
      capability: { cp: 0, cpk: 0, pp: 0, ppk: 0 },
      controlLimits: { xBar: 0, rBar: 0, xUCL: 0, xLCL: 0 },
      nelsonViolations: [],
      histogram: { bins: [] },
      grade: gradeCpk(0)
    };
  }

  const capability = evaluateCapability(validData, usl, lsl, subgroupSize);
  const controlLimits = calculateControlLimits(validData, subgroupSize);
  const nelsonViolations = detectNelsonRules(
    controlLimits.means, controlLimits.xBar, controlLimits.xUCL, controlLimits.xLCL
  );
  const histogram = generateHistogram(validData, 0, lsl, usl);
  const grade = gradeCpk(capability.cpk);

  return {
    hasData: true,
    n: validData.length,
    capability,
    controlLimits,
    nelsonViolations,
    histogram,
    grade
  };
}
