import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dexie', () => {
  return {
    default: class MockDexie {
      constructor() {
        this.version = () => ({ stores: () => ({}) });
        this.process_plans = {
          toArray: async () => [],
          put: async () => {},
          filter: () => ({ toArray: async () => [] }),
          delete: async () => {}
        };
        this.process_operations = {
          toArray: async () => [],
          put: async () => {},
          filter: () => ({ toArray: async () => [] }),
          delete: async () => {}
        };
      }
    }
  };
});

import {
  createProcessPlan,
  getProcessPlans,
  createOperation,
  getOperations,
  updateOperation,
  deleteOperation,
  allocateBalloonsToOperation,
  getUnallocatedBalloons,
  generateControlPlanSummary,
  getStationChecksheetUrl,
  exportControlPlanToCsv,
  reorderOperations,
  recordStationInspection,
  getStationQualityMetrics
} from '../../utils/plmProcessService.js';

describe('PLM Process Management & Control Plan (BOP) Service', () => {
  const mockDrawingId = 'dwg_test_101';
  const mockRevisionId = 'rev_test_a';

  const mockBalloons = [
    { id: 'b1', balloon_number: 1, parameter_name: 'Panjang Total', nominal_value: '120.00', upper_tolerance: '0.10', lower_tolerance: '-0.10' },
    { id: 'b2', balloon_number: 2, parameter_name: 'Lebar Flange', nominal_value: '45.50', upper_tolerance: '0.05', lower_tolerance: '-0.05' },
    { id: 'b3', balloon_number: 3, parameter_name: 'Diameter Lubang Pin', nominal_value: '12.00', upper_tolerance: '0.02', lower_tolerance: '0.00' },
    { id: 'b4', balloon_number: 4, parameter_name: 'Kedalaman Chamfer', nominal_value: '1.50', upper_tolerance: '0.20', lower_tolerance: '-0.20' }
  ];

  it('creates and retrieves a process plan for a drawing revision', async () => {
    const plan = await createProcessPlan({
      drawing_id: mockDrawingId,
      drawing_revision_id: mockRevisionId,
      plan_code: 'PP-TEST-001',
      name: 'Rencana Proses Machining Stang Piston'
    });

    expect(plan).toBeDefined();
    expect(plan.id).toBeDefined();
    expect(plan.plan_code).toBe('PP-TEST-001');

    const plans = await getProcessPlans(mockDrawingId, mockRevisionId);
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.some(p => p.id === plan.id)).toBe(true);
  });

  it('adds manufacturing operations (OP 10, OP 20) in sequential order', async () => {
    const plan = await createProcessPlan({
      drawing_id: mockDrawingId,
      drawing_revision_id: mockRevisionId,
      plan_code: 'PP-ROUTING-01'
    });

    const op20 = await createOperation(plan.id, {
      op_number: '20',
      op_name: 'CNC Milling',
      machine_name: 'Haas VF-2'
    });

    const op10 = await createOperation(plan.id, {
      op_number: '10',
      op_name: 'Sawing / Cutting',
      machine_name: 'Band Saw'
    });

    const operations = await getOperations(plan.id);
    expect(operations.length).toBe(2);
    // Should be sorted by op_number: OP 10 first, then OP 20
    expect(operations[0].op_number).toBe('10');
    expect(operations[1].op_number).toBe('20');
  });

  it('allocates balloons to operations and accurately tracks unallocated balloons', async () => {
    const plan = await createProcessPlan({
      drawing_id: mockDrawingId,
      drawing_revision_id: mockRevisionId
    });

    const op10 = await createOperation(plan.id, {
      op_number: '10',
      op_name: 'Cutting'
    });

    const op20 = await createOperation(plan.id, {
      op_number: '20',
      op_name: 'Milling'
    });

    // Allocate b1, b2 to OP 10
    await allocateBalloonsToOperation(op10.id, ['b1', 'b2']);
    // Allocate b3 to OP 20
    await allocateBalloonsToOperation(op20.id, ['b3']);

    const updatedOps = await getOperations(plan.id);
    const op10Updated = updatedOps.find(o => o.id === op10.id);
    expect(op10Updated.allocated_balloon_ids).toEqual(['b1', 'b2']);

    // Check unallocated balloons: b4 should be the only unallocated balloon
    const unallocated = getUnallocatedBalloons(mockBalloons, updatedOps);
    expect(unallocated.length).toBe(1);
    expect(unallocated[0].id).toBe('b4');
  });

  it('generates a full IATF 16949 Control Plan summary matrix', async () => {
    const plan = { plan_code: 'CP-AUTO-01' };
    const operations = [
      {
        op_number: '10',
        op_name: 'Sawing',
        machine_name: 'Band Saw',
        allocated_balloon_ids: ['b1'],
        measuring_tools: ['Caliper 0-300mm'],
        sampling_frequency: '1 pc/lot',
        control_method: 'Gate Check',
        reaction_plan: 'Koreksi panjang'
      }
    ];

    const summary = generateControlPlanSummary(
      plan,
      operations,
      mockBalloons,
      { code: 'PRT-88', name: 'Bracket' },
      { revision_code: 'B' }
    );

    expect(summary.documentNumber).toBe('CP-AUTO-01');
    expect(summary.partNumber).toBe('PRT-88');
    expect(summary.rows.length).toBe(1);
    expect(summary.rows[0].balloonNumber).toBe('#1');
    expect(summary.rows[0].characteristic).toBe('Panjang Total');
    expect(summary.rows[0].specification).toContain('120.00');
  });

  it('generates correct station checksheet deep link URL', () => {
    const url = getStationChecksheetUrl('dwg_1', 'rev_2', '20');
    expect(url).toContain('#/drawing-checksheet');
    expect(url).toContain('op=20');
    expect(url).toContain('drawingId=dwg_1');
  });

  it('exports Control Plan to valid IATF 16949 CSV formatted text', () => {
    const summary = {
      documentNumber: 'CP-DWG-001',
      partNumber: 'PART-CAST-01',
      partName: 'Aluminium Housing',
      revision: 'A',
      date: '12/09/2026',
      totalOperations: 2,
      rows: [
        {
          opNumber: '10',
          opName: 'Sawing',
          workcenter: 'CUT-01',
          balloonNumber: '#1',
          characteristic: 'Total Length',
          specification: '120.00 (±0.10) mm',
          gauge: 'Vernier Caliper',
          frequency: '1 pc/lot',
          controlMethod: 'Dimensional Gate',
          reactionPlan: 'Hold lot'
        }
      ]
    };

    const csv = exportControlPlanToCsv(summary);
    expect(csv).toContain('MANUFACTURING CONTROL PLAN (IATF 16949 / APQP)');
    expect(csv).toContain('PART-CAST-01');
    expect(csv).toContain('Total Length');
    expect(csv).toContain('Vernier Caliper');
    expect(csv).toContain('Hold lot');
  });

  it('reorders operations and updates sequential op_numbers', async () => {
    const plan = await createProcessPlan({
      drawing_id: 'dwg_reorder',
      drawing_revision_id: 'rev_1'
    });

    const opA = await createOperation(plan.id, { op_number: '10', op_name: 'Op A' });
    const opB = await createOperation(plan.id, { op_number: '20', op_name: 'Op B' });
    const opC = await createOperation(plan.id, { op_number: '30', op_name: 'Op C' });

    // Reverse order: C -> A -> B
    const reordered = await reorderOperations(plan.id, [opC.id, opA.id, opB.id]);
    expect(reordered.length).toBe(3);

    const reloaded = await getOperations(plan.id);
    const itemC = reloaded.find(o => o.id === opC.id);
    const itemA = reloaded.find(o => o.id === opA.id);
    const itemB = reloaded.find(o => o.id === opB.id);

    expect(itemC.op_number).toBe('10');
    expect(itemA.op_number).toBe('20');
    expect(itemB.op_number).toBe('30');
  });

  it('records station inspections and computes aggregated quality metrics', async () => {
    const dwgId = 'dwg_station_test';
    const opNo = '20';

    // Record two inspections: 1 OK, 1 NG
    await recordStationInspection({
      drawing_id: dwgId,
      op_number: opNo,
      op_name: 'CNC Milling',
      overall_status: 'OK',
      inspector: 'Budi (QC)'
    });

    await recordStationInspection({
      drawing_id: dwgId,
      op_number: opNo,
      op_name: 'CNC Milling',
      overall_status: 'NG',
      inspector: 'Agus (QC)'
    });

    const metrics = await getStationQualityMetrics(dwgId, opNo);
    expect(metrics.totalInspections).toBe(2);
    expect(metrics.passedCount).toBe(1);
    expect(metrics.failedCount).toBe(1);
    expect(metrics.passRate).toBe(50);
    expect(metrics.status).toBe('ACTION_REQUIRED');
  });
});
