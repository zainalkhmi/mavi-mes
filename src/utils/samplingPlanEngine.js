/**
 * Sampling Plan Engine — AQL Lookup (ISO 2859-1 / ANSI Z1.4)
 * 
 * Provides sample size determination, acceptance/rejection numbers,
 * and inspection level switching logic for lot-by-lot inspection.
 * 
 * Standards: ISO 2859-1:1999, ANSI/ASQ Z1.4-2003, MIL-STD-1916
 */

// ─── CODE LETTER TABLE (ISO 2859-1, Table 1) ──────────────────
// Maps lot size range + inspection level → code letter
const CODE_LETTER_TABLE = [
  // [minLot, maxLot, S1, S2, S3, S4, I, II, III]
  [2,       8,       'A','A','A','A','A','A','B'],
  [9,       15,      'A','A','A','A','A','B','C'],
  [16,      25,      'A','A','B','B','B','C','D'],
  [26,      50,      'A','B','B','C','C','D','E'],
  [51,      90,      'B','B','C','C','C','E','F'],
  [91,      150,     'B','B','C','D','D','F','G'],
  [151,     280,     'B','C','D','E','E','G','H'],
  [281,     500,     'B','C','D','E','F','H','J'],
  [501,     1200,    'C','C','E','F','G','J','K'],
  [1201,    3200,    'C','D','E','G','H','K','L'],
  [3201,    10000,   'C','D','F','G','J','L','M'],
  [10001,   35000,   'C','D','F','H','K','M','N'],
  [35001,   150000,  'D','E','G','J','L','N','P'],
  [150001,  500000,  'D','E','G','J','M','P','Q'],
  [500001,  Infinity,'D','E','H','K','N','Q','R'],
];

const LEVEL_INDEX = { 'S-1': 2, 'S-2': 3, 'S-3': 4, 'S-4': 5, 'I': 6, 'II': 7, 'III': 8 };

// ─── SINGLE SAMPLING PLAN TABLE (ISO 2859-1, Table 2-A: Normal) ─
// code letter → { sampleSize, plans: { aql → { ac, re } } }
const SINGLE_NORMAL = {
  'A': { n: 2, plans: { '4.0': { ac: 0, re: 1 }, '6.5': { ac: 0, re: 1 }, '10.0': { ac: 0, re: 1 } } },
  'B': { n: 3, plans: { '2.5': { ac: 0, re: 1 }, '4.0': { ac: 0, re: 1 }, '6.5': { ac: 1, re: 2 }, '10.0': { ac: 1, re: 2 } } },
  'C': { n: 5, plans: { '1.0': { ac: 0, re: 1 }, '1.5': { ac: 0, re: 1 }, '2.5': { ac: 0, re: 1 }, '4.0': { ac: 1, re: 2 }, '6.5': { ac: 1, re: 2 }, '10.0': { ac: 2, re: 3 } } },
  'D': { n: 8, plans: { '0.65': { ac: 0, re: 1 }, '1.0': { ac: 0, re: 1 }, '1.5': { ac: 1, re: 2 }, '2.5': { ac: 1, re: 2 }, '4.0': { ac: 2, re: 3 }, '6.5': { ac: 3, re: 4 }, '10.0': { ac: 5, re: 6 } } },
  'E': { n: 13, plans: { '0.40': { ac: 0, re: 1 }, '0.65': { ac: 0, re: 1 }, '1.0': { ac: 1, re: 2 }, '1.5': { ac: 1, re: 2 }, '2.5': { ac: 2, re: 3 }, '4.0': { ac: 3, re: 4 }, '6.5': { ac: 5, re: 6 }, '10.0': { ac: 7, re: 8 } } },
  'F': { n: 20, plans: { '0.25': { ac: 0, re: 1 }, '0.40': { ac: 0, re: 1 }, '0.65': { ac: 1, re: 2 }, '1.0': { ac: 1, re: 2 }, '1.5': { ac: 2, re: 3 }, '2.5': { ac: 3, re: 4 }, '4.0': { ac: 5, re: 6 }, '6.5': { ac: 7, re: 8 }, '10.0': { ac: 10, re: 11 } } },
  'G': { n: 32, plans: { '0.15': { ac: 0, re: 1 }, '0.25': { ac: 0, re: 1 }, '0.40': { ac: 1, re: 2 }, '0.65': { ac: 1, re: 2 }, '1.0': { ac: 2, re: 3 }, '1.5': { ac: 3, re: 4 }, '2.5': { ac: 5, re: 6 }, '4.0': { ac: 7, re: 8 }, '6.5': { ac: 10, re: 11 }, '10.0': { ac: 14, re: 15 } } },
  'H': { n: 50, plans: { '0.10': { ac: 0, re: 1 }, '0.15': { ac: 0, re: 1 }, '0.25': { ac: 1, re: 2 }, '0.40': { ac: 1, re: 2 }, '0.65': { ac: 2, re: 3 }, '1.0': { ac: 3, re: 4 }, '1.5': { ac: 5, re: 6 }, '2.5': { ac: 7, re: 8 }, '4.0': { ac: 10, re: 11 }, '6.5': { ac: 14, re: 15 } } },
  'J': { n: 80, plans: { '0.065': { ac: 0, re: 1 }, '0.10': { ac: 0, re: 1 }, '0.15': { ac: 1, re: 2 }, '0.25': { ac: 1, re: 2 }, '0.40': { ac: 2, re: 3 }, '0.65': { ac: 3, re: 4 }, '1.0': { ac: 5, re: 6 }, '1.5': { ac: 7, re: 8 }, '2.5': { ac: 10, re: 11 }, '4.0': { ac: 14, re: 15 } } },
  'K': { n: 125, plans: { '0.040': { ac: 0, re: 1 }, '0.065': { ac: 0, re: 1 }, '0.10': { ac: 1, re: 2 }, '0.15': { ac: 1, re: 2 }, '0.25': { ac: 2, re: 3 }, '0.40': { ac: 3, re: 4 }, '0.65': { ac: 5, re: 6 }, '1.0': { ac: 7, re: 8 }, '1.5': { ac: 10, re: 11 }, '2.5': { ac: 14, re: 15 } } },
  'L': { n: 200, plans: { '0.025': { ac: 0, re: 1 }, '0.040': { ac: 0, re: 1 }, '0.065': { ac: 1, re: 2 }, '0.10': { ac: 1, re: 2 }, '0.15': { ac: 2, re: 3 }, '0.25': { ac: 3, re: 4 }, '0.40': { ac: 5, re: 6 }, '0.65': { ac: 7, re: 8 }, '1.0': { ac: 10, re: 11 }, '1.5': { ac: 14, re: 15 }, '2.5': { ac: 21, re: 22 } } },
  'M': { n: 315, plans: { '0.010': { ac: 0, re: 1 }, '0.025': { ac: 0, re: 1 }, '0.040': { ac: 1, re: 2 }, '0.065': { ac: 1, re: 2 }, '0.10': { ac: 2, re: 3 }, '0.15': { ac: 3, re: 4 }, '0.25': { ac: 5, re: 6 }, '0.40': { ac: 7, re: 8 }, '0.65': { ac: 10, re: 11 }, '1.0': { ac: 14, re: 15 }, '1.5': { ac: 21, re: 22 } } },
  'N': { n: 500, plans: { '0.010': { ac: 0, re: 1 }, '0.025': { ac: 1, re: 2 }, '0.040': { ac: 1, re: 2 }, '0.065': { ac: 2, re: 3 }, '0.10': { ac: 3, re: 4 }, '0.15': { ac: 5, re: 6 }, '0.25': { ac: 7, re: 8 }, '0.40': { ac: 10, re: 11 }, '0.65': { ac: 14, re: 15 }, '1.0': { ac: 21, re: 22 } } },
  'P': { n: 800, plans: { '0.010': { ac: 1, re: 2 }, '0.025': { ac: 1, re: 2 }, '0.040': { ac: 2, re: 3 }, '0.065': { ac: 3, re: 4 }, '0.10': { ac: 5, re: 6 }, '0.15': { ac: 7, re: 8 }, '0.25': { ac: 10, re: 11 }, '0.40': { ac: 14, re: 15 }, '0.65': { ac: 21, re: 22 } } },
  'Q': { n: 1250, plans: { '0.010': { ac: 1, re: 2 }, '0.025': { ac: 2, re: 3 }, '0.040': { ac: 3, re: 4 }, '0.065': { ac: 5, re: 6 }, '0.10': { ac: 7, re: 8 }, '0.15': { ac: 10, re: 11 }, '0.25': { ac: 14, re: 15 }, '0.40': { ac: 21, re: 22 } } },
  'R': { n: 2000, plans: { '0.010': { ac: 2, re: 3 }, '0.025': { ac: 3, re: 4 }, '0.040': { ac: 5, re: 6 }, '0.065': { ac: 7, re: 8 }, '0.10': { ac: 10, re: 11 }, '0.15': { ac: 14, re: 15 }, '0.25': { ac: 21, re: 22 } } },
};

// Available AQL values
export const AQL_VALUES = ['0.010', '0.025', '0.040', '0.065', '0.10', '0.15', '0.25', '0.40', '0.65', '1.0', '1.5', '2.5', '4.0', '6.5', '10.0'];
export const INSPECTION_LEVELS = ['S-1', 'S-2', 'S-3', 'S-4', 'I', 'II', 'III'];

// ─── CODE LETTER LOOKUP ────────────────────────────────────────
/**
 * Get code letter from lot size and inspection level
 * @param {number} lotSize - Number of pieces in the lot
 * @param {string} level - Inspection level ('I', 'II', 'III', 'S-1'...'S-4')
 * @returns {string} Code letter (A-R)
 */
export function getCodeLetter(lotSize, level = 'II') {
  const colIdx = LEVEL_INDEX[level];
  if (colIdx === undefined) return 'D'; // default fallback

  for (const row of CODE_LETTER_TABLE) {
    if (lotSize >= row[0] && lotSize <= row[1]) {
      return row[colIdx];
    }
  }
  return 'D';
}

// ─── GET SAMPLING PLAN ─────────────────────────────────────────
/**
 * Get complete sampling plan from lot size, AQL, and inspection level
 * @param {number} lotSize - Lot/batch size
 * @param {string|number} aql - Acceptable Quality Level (e.g. '1.0', '2.5')
 * @param {string} level - Inspection level (default 'II')
 * @returns {{ codeLetter, sampleSize, acceptNumber, rejectNumber, aql, level, lotSize, isValid }}
 */
export function getSamplingPlan(lotSize, aql = '1.0', level = 'II') {
  const aqlStr = String(aql);
  const codeLetter = getCodeLetter(lotSize, level);
  const plan = SINGLE_NORMAL[codeLetter];

  if (!plan) {
    return {
      codeLetter,
      sampleSize: 0,
      acceptNumber: 0,
      rejectNumber: 1,
      aql: aqlStr,
      level,
      lotSize,
      isValid: false,
      error: `Invalid code letter: ${codeLetter}`
    };
  }

  const aqlPlan = plan.plans[aqlStr];
  if (!aqlPlan) {
    // Find closest available AQL
    const available = Object.keys(plan.plans);
    const closest = available.reduce((prev, curr) =>
      Math.abs(parseFloat(curr) - parseFloat(aqlStr)) < Math.abs(parseFloat(prev) - parseFloat(aqlStr)) ? curr : prev
    );
    const fallback = plan.plans[closest];
    return {
      codeLetter,
      sampleSize: plan.n,
      acceptNumber: fallback.ac,
      rejectNumber: fallback.re,
      aql: closest,
      requestedAql: aqlStr,
      level,
      lotSize,
      isValid: true,
      note: `AQL ${aqlStr} not available for code ${codeLetter}. Using closest: ${closest}`
    };
  }

  return {
    codeLetter,
    sampleSize: plan.n,
    acceptNumber: aqlPlan.ac,
    rejectNumber: aqlPlan.re,
    aql: aqlStr,
    level,
    lotSize,
    isValid: true
  };
}

// ─── LOT ACCEPT/REJECT DECISION ────────────────────────────────
/**
 * Evaluate lot disposition based on sampling results
 * @param {number} defectsFound - Number of defective/NG items found in sample
 * @param {number} acceptNumber - Ac (acceptance number)
 * @param {number} rejectNumber - Re (rejection number)
 * @returns {{ decision: 'ACCEPT'|'REJECT', defectsFound, acceptNumber, rejectNumber }}
 */
export function evaluateLotDisposition(defectsFound, acceptNumber, rejectNumber) {
  if (defectsFound <= acceptNumber) {
    return { decision: 'ACCEPT', defectsFound, acceptNumber, rejectNumber };
  }
  return { decision: 'REJECT', defectsFound, acceptNumber, rejectNumber };
}

// ─── INSPECTION LEVEL SWITCHING (ISO 2859-1, Section 9) ────────
/**
 * Determine if inspection level should switch based on recent lot history
 * @param {string[]} recentDecisions - Array of recent lot decisions ('ACCEPT' or 'REJECT')
 * @param {string} currentLevel - Current inspection severity ('NORMAL', 'TIGHTENED', 'REDUCED')
 * @returns {{ recommendedLevel: string, reason: string }}
 */
export function evaluateSwitchingRules(recentDecisions, currentLevel = 'NORMAL') {
  const last5 = recentDecisions.slice(-5);
  const last10 = recentDecisions.slice(-10);
  const rejectCount5 = last5.filter(d => d === 'REJECT').length;
  const acceptCount5 = last5.filter(d => d === 'ACCEPT').length;
  const rejectCount10 = last10.filter(d => d === 'REJECT').length;

  if (currentLevel === 'NORMAL') {
    // Switch to Tightened: 2 of 5 consecutive lots rejected
    if (rejectCount5 >= 2) {
      return { recommendedLevel: 'TIGHTENED', reason: `${rejectCount5} dari 5 lot terakhir ditolak → Switching ke Tightened Inspection` };
    }
    // Switch to Reduced: 10 consecutive lots accepted under normal
    if (last10.length >= 10 && rejectCount10 === 0) {
      return { recommendedLevel: 'REDUCED', reason: '10 lot berturut-turut diterima → Eligible untuk Reduced Inspection' };
    }
  }

  if (currentLevel === 'TIGHTENED') {
    // Revert to Normal: 5 consecutive lots accepted under tightened
    if (acceptCount5 >= 5 && last5.length >= 5) {
      return { recommendedLevel: 'NORMAL', reason: '5 lot berturut-turut diterima (tightened) → Kembali ke Normal Inspection' };
    }
  }

  if (currentLevel === 'REDUCED') {
    // Revert to Normal: any single lot rejected
    if (last5.includes('REJECT')) {
      return { recommendedLevel: 'NORMAL', reason: 'Lot ditolak pada Reduced Inspection → Kembali ke Normal Inspection' };
    }
  }

  return { recommendedLevel: currentLevel, reason: 'Tidak ada perubahan level inspeksi' };
}
