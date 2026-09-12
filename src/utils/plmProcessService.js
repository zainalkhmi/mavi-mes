/**
 * plmProcessService.js
 * ==============================================================================
 * Manufacturing Process Management & Control Plan (BOP / Routing) Service
 * Bridges Engineering Drawings & Balloons to Station-Specific Digital Checksheets
 * Conforms to IATF 16949, AS9102 (FAI), and APQP standards.
 * ==============================================================================
 */

import { plmLocalDB, getLocal, setLocal } from './mavicorePLM.js';
import { getSupabaseClient } from './supabaseManualDB.js';

const STORAGE_KEY_PLANS = 'process_plans';
const STORAGE_KEY_OPERATIONS = 'process_operations';

const getClient = () => {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
};

/**
 * Generate a unique ID
 */
const generateId = (prefix = 'pp') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

// ─── 1. PROCESS PLAN MANAGEMENT ──────────────────────────────────────────────

/**
 * Retrieve all process plans for a drawing and revision
 * @param {string} drawingId 
 * @param {string} revisionId 
 * @returns {Promise<Array>}
 */
export async function getProcessPlans(drawingId, revisionId) {
  try {
    // 1. Try Dexie IndexedDB
    if (plmLocalDB && plmLocalDB.process_plans) {
      const plans = await plmLocalDB.process_plans
        .filter(p => (!drawingId || p.drawing_id === drawingId) && (!revisionId || p.drawing_revision_id === revisionId))
        .toArray();
      if (plans && plans.length > 0) return plans;
    }

    // 2. Try LocalStorage fallback
    const all = await getLocal(STORAGE_KEY_PLANS, []);
    const filtered = all.filter(p => (!drawingId || p.drawing_id === drawingId) && (!revisionId || p.drawing_revision_id === revisionId));
    return filtered;
  } catch (err) {
    console.error('[plmProcessService] getProcessPlans error:', err);
    return [];
  }
}

/**
 * Create or initialize a new Process Plan for a drawing revision
 */
export async function createProcessPlan(planData) {
  const newPlan = {
    id: planData.id || generateId('pp'),
    drawing_id: planData.drawing_id,
    drawing_revision_id: planData.drawing_revision_id,
    plan_code: planData.plan_code || `PP-${Date.now().toString().slice(-4)}`,
    name: planData.name || 'Manufacturing Routing & Control Plan',
    status: planData.status || 'RELEASED', // DRAFT | REVIEW | RELEASED
    part_name: planData.part_name || '',
    part_number: planData.part_number || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    // Persist to IndexedDB
    if (plmLocalDB && plmLocalDB.process_plans) {
      await plmLocalDB.process_plans.put(newPlan);
    }
    // Update LocalStorage
    const all = await getLocal(STORAGE_KEY_PLANS, []);
    const idx = all.findIndex(p => p.id === newPlan.id);
    if (idx >= 0) all[idx] = newPlan;
    else all.push(newPlan);
    await setLocal(STORAGE_KEY_PLANS, all);

    return newPlan;
  } catch (err) {
    console.error('[plmProcessService] createProcessPlan error:', err);
    return newPlan;
  }
}

/**
 * Update a Process Plan
 */
export async function updateProcessPlan(planId, updates) {
  try {
    const all = await getLocal(STORAGE_KEY_PLANS, []);
    const idx = all.findIndex(p => p.id === planId);
    if (idx >= 0) {
      const updated = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
      all[idx] = updated;
      if (plmLocalDB && plmLocalDB.process_plans) {
        await plmLocalDB.process_plans.put(updated);
      }
      await setLocal(STORAGE_KEY_PLANS, all);
      return updated;
    }
    return null;
  } catch (err) {
    console.error('[plmProcessService] updateProcessPlan error:', err);
    return null;
  }
}

// ─── 2. PROCESS OPERATIONS (ROUTING / CONTROL PLAN STEPS) ────────────────────

/**
 * Get all operations for a specific process plan, sorted by op_number
 */
export async function getOperations(planId) {
  if (!planId) return [];
  try {
    let ops = [];
    if (plmLocalDB && plmLocalDB.process_operations) {
      ops = await plmLocalDB.process_operations
        .filter(op => op.process_plan_id === planId)
        .toArray();
    }
    if (!ops || ops.length === 0) {
      const all = await getLocal(STORAGE_KEY_OPERATIONS, []);
      ops = all.filter(op => op.process_plan_id === planId);
    }

    // Sort numerically by op_number (e.g. 10, 20, 30, 100)
    return ops.sort((a, b) => {
      const numA = parseInt(a.op_number, 10) || 0;
      const numB = parseInt(b.op_number, 10) || 0;
      return numA - numB;
    });
  } catch (err) {
    console.error('[plmProcessService] getOperations error:', err);
    return [];
  }
}

/**
 * Create a new manufacturing operation step
 */
export async function createOperation(planId, opData) {
  const newOp = {
    id: opData.id || generateId('op'),
    process_plan_id: planId,
    op_number: String(opData.op_number || '10'),
    op_name: opData.op_name || 'CNC Machining',
    workcenter_id: opData.workcenter_id || 'ST-01',
    machine_name: opData.machine_name || 'CNC Milling 3-Axis',
    allocated_balloon_ids: Array.isArray(opData.allocated_balloon_ids) ? opData.allocated_balloon_ids : [],
    measuring_tools: Array.isArray(opData.measuring_tools) ? opData.measuring_tools : ['Vernier Caliper (0-150mm)'],
    sampling_frequency: opData.sampling_frequency || '100% First 3 Pcs, 5 Pcs / Shift',
    sample_size: opData.sample_size || 5,
    control_method: opData.control_method || 'Digital Checksheet & SPC',
    reaction_plan: opData.reaction_plan || 'Stop mesin, periksa keausan pahat (tool offset), laporkan ke QC Inspector',
    notes: opData.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    if (plmLocalDB && plmLocalDB.process_operations) {
      await plmLocalDB.process_operations.put(newOp);
    }
    const all = await getLocal(STORAGE_KEY_OPERATIONS, []);
    all.push(newOp);
    await setLocal(STORAGE_KEY_OPERATIONS, all);

    return newOp;
  } catch (err) {
    console.error('[plmProcessService] createOperation error:', err);
    return newOp;
  }
}

/**
 * Update an existing operation step
 */
export async function updateOperation(opId, updates) {
  try {
    const all = await getLocal(STORAGE_KEY_OPERATIONS, []);
    const idx = all.findIndex(o => o.id === opId);
    if (idx >= 0) {
      const updated = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
      all[idx] = updated;
      if (plmLocalDB && plmLocalDB.process_operations) {
        await plmLocalDB.process_operations.put(updated);
      }
      await setLocal(STORAGE_KEY_OPERATIONS, all);
      return updated;
    }
    return null;
  } catch (err) {
    console.error('[plmProcessService] updateOperation error:', err);
    return null;
  }
}

/**
 * Delete an operation step
 */
export async function deleteOperation(opId) {
  try {
    if (plmLocalDB && plmLocalDB.process_operations) {
      await plmLocalDB.process_operations.delete(opId);
    }
    const all = await getLocal(STORAGE_KEY_OPERATIONS, []);
    const filtered = all.filter(o => o.id !== opId);
    await setLocal(STORAGE_KEY_OPERATIONS, filtered);
    return true;
  } catch (err) {
    console.error('[plmProcessService] deleteOperation error:', err);
    return false;
  }
}

/**
 * Allocate specific balloon IDs to an operation
 */
export async function allocateBalloonsToOperation(opId, balloonIds) {
  return await updateOperation(opId, { allocated_balloon_ids: balloonIds });
}

// ─── 3. INDUSTRIAL SEEDER & TEMPLATES ────────────────────────────────────────

/**
 * Pre-populate standard industrial manufacturing operations for a drawing
 * Useful for 1-click professional setup (Blanking -> Machining -> Finishing -> OQC)
 */
export async function seedStandardRouting(planId, drawing, balloons = []) {
  if (!planId) return [];

  // Group balloons intelligently based on characteristic types
  const bList = Array.isArray(balloons) ? balloons : [];
  const bIds = bList.map(b => b.id);

  // Split balloons across OP 10, OP 20, OP 30, OP 50
  const op10Ids = bIds.slice(0, Math.min(2, bIds.length));
  const op20Ids = bIds.slice(2, Math.max(2, bIds.length - 2));
  const op50Ids = bIds.slice(Math.max(2, bIds.length - 2));

  const defaultTemplates = [
    {
      op_number: '10',
      op_name: 'Blanking & Raw Cutting',
      workcenter_id: 'CUT-01',
      machine_name: 'Band Saw / Laser Cutter',
      allocated_balloon_ids: op10Ids,
      measuring_tools: ['Vernier Caliper (0-300mm)', 'Steel Ruler'],
      sampling_frequency: '1 pc per raw batch',
      sample_size: 1,
      control_method: 'Visual & Dimensional Gate',
      reaction_plan: 'Koreksi ukuran potongan, reject raw part jika under-tolerance'
    },
    {
      op_number: '20',
      op_name: 'CNC Milling & Hole Machining',
      workcenter_id: 'CNC-VF2',
      machine_name: 'Haas VF-2 3-Axis VMC',
      allocated_balloon_ids: op20Ids.length > 0 ? op20Ids : op10Ids,
      measuring_tools: ['Digital Caliper 0-150mm', 'Bore Gauge 10-18mm', 'Micrometer 0-25mm', 'Dial Indicator'],
      sampling_frequency: '100% First 3 Pcs (Setup), 5 Pcs / Shift',
      sample_size: 5,
      control_method: 'Digital Checksheet & SPC Chart',
      reaction_plan: 'Hentikan spindle CNC, ganti insert pahat, ukur ulang 100%'
    },
    {
      op_number: '30',
      op_name: 'Surface Finishing & Deburring',
      workcenter_id: 'FIN-02',
      machine_name: 'Tumbler & Manual Deburring Bench',
      allocated_balloon_ids: [],
      measuring_tools: ['Visual 10x Loupe', 'Surface Roughness Tester (Ra)'],
      sampling_frequency: '100% Visual Inspection',
      sample_size: 10,
      control_method: 'Visual Limit Sample OK/NG',
      reaction_plan: 'Deburring ulang tepi tajam secara manual'
    },
    {
      op_number: '50',
      op_name: 'Final Quality Inspection (QA Gate)',
      workcenter_id: 'QC-LAB',
      machine_name: 'Coordinate Measuring Machine (CMM) / QA Bench',
      allocated_balloon_ids: op50Ids.length > 0 ? op50Ids : bIds,
      measuring_tools: ['CMM Zeiss / Micro-Vu Optical', 'Height Gauge 0-600mm', 'Digital Caliper'],
      sampling_frequency: 'AQL 1.0 Level II / 100% Critical Dimensions',
      sample_size: 8,
      control_method: 'FAI AS9102 Report & Outgoing Checksheet',
      reaction_plan: 'Karantina lot (Hold Tag Red), panggil Quality Engineering'
    }
  ];

  const created = [];
  for (const tmpl of defaultTemplates) {
    const op = await createOperation(planId, tmpl);
    created.push(op);
  }
  return created;
}

// ─── 4. ANALYSIS & HELPER FUNCTIONS ──────────────────────────────────────────

/**
 * Identify balloons not yet covered by any manufacturing process
 */
export function getUnallocatedBalloons(balloons = [], operations = []) {
  if (!Array.isArray(balloons)) return [];
  const allocatedSet = new Set();
  (operations || []).forEach(op => {
    (op.allocated_balloon_ids || []).forEach(id => allocatedSet.add(id));
  });

  return balloons.filter(b => !allocatedSet.has(b.id));
}

/**
 * Generate deep link URL to open Digital Drawing Checksheet filtered for an operation
 */
export function getStationChecksheetUrl(drawingId, revisionId, opNumber) {
  const host = typeof window !== 'undefined' ? window.location.origin : '';
  const hash = `#/drawing-checksheet?drawingId=${encodeURIComponent(drawingId || '')}&revisionId=${encodeURIComponent(revisionId || '')}&op=${encodeURIComponent(opNumber || '')}`;
  return `${host}/${hash}`;
}

/**
 * Format Control Plan Report Data (IATF 16949 Standard Structure)
 */
export function generateControlPlanSummary(plan, operations = [], balloons = [], drawing = {}, revision = {}) {
  const balloonMap = new Map((balloons || []).map(b => [b.id, b]));

  const rows = [];
  operations.forEach(op => {
    const opBalloons = (op.allocated_balloon_ids || []).map(id => balloonMap.get(id)).filter(Boolean);

    if (opBalloons.length === 0) {
      rows.push({
        opNumber: op.op_number,
        opName: op.op_name,
        workcenter: op.machine_name || op.workcenter_id,
        balloonNumber: '-',
        characteristic: 'Proses Umum / Visual Tanpa Balloon',
        specification: 'Bebas burr, bersih, sesuai SOP',
        gauge: (op.measuring_tools || []).join(', ') || 'Visual',
        frequency: op.sampling_frequency,
        controlMethod: op.control_method,
        reactionPlan: op.reaction_plan
      });
    } else {
      opBalloons.forEach(b => {
        const nom = b.nominal_value || b.characteristic_value || '-';
        const tol = b.upper_tolerance && b.lower_tolerance
          ? `+${b.upper_tolerance} / ${b.lower_tolerance}`
          : (b.tolerance || '±0.05');

        rows.push({
          opNumber: op.op_number,
          opName: op.op_name,
          workcenter: op.machine_name || op.workcenter_id,
          balloonNumber: `#${b.balloon_number || b.sequence_number || '?'}`,
          characteristic: b.parameter_name || b.feature_type || b.description || 'Dimensi Kunci',
          specification: `${nom} (${tol}) ${b.unit || 'mm'}`,
          gauge: (op.measuring_tools || []).join(', ') || 'Caliper',
          frequency: op.sampling_frequency,
          controlMethod: op.control_method,
          reactionPlan: op.reaction_plan
        });
      });
    }
  });

  return {
    documentNumber: plan?.plan_code || `CP-${drawing?.code || 'DWG'}`,
    partNumber: drawing?.code || 'PART-001',
    partName: drawing?.name || 'Machined Component',
    revision: revision?.revision_code || 'A',
    date: new Date().toLocaleDateString('id-ID'),
    totalOperations: operations.length,
    totalCharacteristics: rows.length,
    rows
  };
}

/**
 * Convert Control Plan summary matrix to CSV format (IATF 16949 / APQP)
 * and trigger browser file download if available.
 * @param {Object} summary - Summary object generated by generateControlPlanSummary
 * @returns {string} - CSV file content string
 */
export function exportControlPlanToCsv(summary) {
  if (!summary || !Array.isArray(summary.rows)) return '';

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLines = [
    `"MANUFACTURING CONTROL PLAN (IATF 16949 / APQP)"`,
    `"Document No:",${escapeCsv(summary.documentNumber)},"Part No:",${escapeCsv(summary.partNumber)}`,
    `"Part Name:",${escapeCsv(summary.partName)},"Revision:",${escapeCsv(summary.revision)}`,
    `"Date:",${escapeCsv(summary.date)},"Total Operations:",${escapeCsv(summary.totalOperations)}`,
    ``, // empty separator line
    [
      'OP #',
      'Process Description',
      'Machine / Workcenter',
      'Balloon #',
      'Characteristic',
      'Specification & Tolerance',
      'Measuring Tool / Gauge',
      'Sampling Frequency',
      'Control Method',
      'Reaction Plan'
    ].map(escapeCsv).join(',')
  ];

  const rowLines = summary.rows.map(r => [
    r.opNumber,
    r.opName,
    r.workcenter,
    r.balloonNumber,
    r.characteristic,
    r.specification,
    r.gauge,
    r.frequency,
    r.controlMethod,
    r.reactionPlan
  ].map(escapeCsv).join(','));

  const csvContent = [...headerLines, ...rowLines].join('\r\n');

  // Trigger browser download if in window context
  if (typeof window !== 'undefined' && window.document && typeof window.URL?.createObjectURL === 'function' && window.Blob) {
    try {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const filename = `Control_Plan_${summary.partNumber || 'PART'}_${summary.documentNumber || 'DOC'}.csv`;
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (e) {
      console.warn('[plmProcessService] Browser auto-download failed:', e);
    }
  }

  return csvContent;
}

/**
 * Reorder operations for a process plan and re-number sequentially
 * @param {string} planId
 * @param {Array<string>} orderedOpIds - Array of op IDs in desired order
 * @returns {Promise<Array>} - Updated and renumbered operations
 */
export async function reorderOperations(planId, orderedOpIds) {
  if (!planId || !Array.isArray(orderedOpIds)) return [];
  try {
    const all = await getLocal(STORAGE_KEY_OPERATIONS, []);
    const updatedOps = [];

    // Map through ordered IDs and reassign op_number as 10, 20, 30...
    orderedOpIds.forEach((opId, index) => {
      const targetIdx = all.findIndex(o => o.id === opId && o.process_plan_id === planId);
      if (targetIdx >= 0) {
        const newOpNumber = String((index + 1) * 10);
        all[targetIdx] = {
          ...all[targetIdx],
          op_number: newOpNumber,
          updated_at: new Date().toISOString()
        };
        updatedOps.push(all[targetIdx]);
      }
    });

    if (plmLocalDB && plmLocalDB.process_operations) {
      for (const op of updatedOps) {
        await plmLocalDB.process_operations.put(op);
      }
    }
    await setLocal(STORAGE_KEY_OPERATIONS, all);

    return updatedOps.sort((a, b) => (parseInt(a.op_number, 10) || 0) - (parseInt(b.op_number, 10) || 0));
  } catch (err) {
    console.error('[plmProcessService] reorderOperations error:', err);
    return [];
  }
}

// ─── 5. STATION INSPECTION RECORDING & QUALITY METRICS ───────────────────────

const STORAGE_KEY_STATION_INSPECTIONS = 'mandor_station_inspections';

/**
 * Record a checksheet inspection run completed at a specific workstation
 */
export async function recordStationInspection(record) {
  const newRecord = {
    id: record.id || generateId('insp'),
    drawing_id: record.drawing_id || '',
    revision_id: record.revision_id || '',
    plan_id: record.plan_id || '',
    op_number: String(record.op_number || ''),
    op_name: record.op_name || '',
    workcenter_id: record.workcenter_id || '',
    work_order_no: record.work_order_no || '',
    part_serial: record.part_serial || '',
    lot_batch_no: record.lot_batch_no || '',
    inspector: record.inspector || 'QC Inspector',
    overall_status: record.overall_status || 'OK', // OK | NG
    total_points: record.total_points || 0,
    passed_points: record.passed_points || 0,
    failed_points: record.failed_points || 0,
    timestamp: record.timestamp || new Date().toISOString()
  };

  try {
    const all = await getLocal(STORAGE_KEY_STATION_INSPECTIONS, []);
    all.unshift(newRecord);
    // Keep max 200 history records locally
    const trimmed = all.slice(0, 200);
    await setLocal(STORAGE_KEY_STATION_INSPECTIONS, trimmed);
    return newRecord;
  } catch (err) {
    console.error('[plmProcessService] recordStationInspection error:', err);
    return newRecord;
  }
}

/**
 * Get aggregated quality metrics for a station operation
 * @param {string} drawingId 
 * @param {string} opNumber 
 * @returns {Promise<Object>}
 */
export async function getStationQualityMetrics(drawingId, opNumber) {
  try {
    const all = await getLocal(STORAGE_KEY_STATION_INSPECTIONS, []);
    const filtered = all.filter(rec => {
      const matchOp = !opNumber || String(rec.op_number).trim() === String(opNumber).trim();
      const matchDwg = !drawingId || rec.drawing_id === drawingId;
      return matchOp && matchDwg;
    });

    if (filtered.length === 0) {
      return {
        totalInspections: 0,
        passedCount: 0,
        failedCount: 0,
        passRate: 100,
        status: 'PENDING',
        lastInspectedAt: null,
        lastInspector: null
      };
    }

    const passedCount = filtered.filter(r => r.overall_status === 'OK' || r.overall_status?.includes('APPROVED')).length;
    const failedCount = filtered.length - passedCount;
    const passRate = Math.round((passedCount / filtered.length) * 100);

    return {
      totalInspections: filtered.length,
      passedCount,
      failedCount,
      passRate,
      status: passRate >= 95 ? 'EXCELLENT' : passRate >= 80 ? 'ACCEPTABLE' : 'ACTION_REQUIRED',
      lastInspectedAt: filtered[0].timestamp,
      lastInspector: filtered[0].inspector
    };
  } catch (err) {
    console.error('[plmProcessService] getStationQualityMetrics error:', err);
    return {
      totalInspections: 0,
      passedCount: 0,
      failedCount: 0,
      passRate: 100,
      status: 'PENDING',
      lastInspectedAt: null,
      lastInspector: null
    };
  }
}

export default {
  getProcessPlans,
  createProcessPlan,
  updateProcessPlan,
  getOperations,
  createOperation,
  updateOperation,
  deleteOperation,
  allocateBalloonsToOperation,
  seedStandardRouting,
  getUnallocatedBalloons,
  getStationChecksheetUrl,
  generateControlPlanSummary,
  exportControlPlanToCsv,
  reorderOperations,
  recordStationInspection,
  getStationQualityMetrics
};

