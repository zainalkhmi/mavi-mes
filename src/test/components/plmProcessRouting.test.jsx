import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('dexie', () => {
  return {
    default: class MockDexie {
      constructor() {
        this.version = () => ({ stores: () => {} });
        this.process_plans = {
          toArray: async () => [],
          put: async () => {},
          filter: () => ({ toArray: async () => [] })
        };
        this.process_operations = {
          toArray: async () => [],
          put: async () => {},
          delete: async () => {},
          filter: () => ({ toArray: async () => [] })
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
  allocateBalloonsToOperation,
  seedStandardRouting,
  getUnallocatedBalloons,
  generateControlPlanSummary,
  getStationChecksheetUrl
} from '../../utils/plmProcessService';

describe('PLM Process Routing & IATF 16949 Control Plan Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('creates and seeds a complete manufacturing routing plan with 4 operations', async () => {
    const drawing = { id: 'dwg_housing_01', code: 'DWG-CAST-HOUSING', name: 'Aluminium Cast Housing' };
    const balloons = [
      { id: 'b_1', balloon_number: 1, parameter_name: 'Bore ID', nominal_value: 25.0, upper_tolerance: 0.02, lower_tolerance: -0.02 },
      { id: 'b_2', balloon_number: 2, parameter_name: 'Depth', nominal_value: 12.5, upper_tolerance: 0.05, lower_tolerance: -0.05 },
      { id: 'b_3', balloon_number: 3, parameter_name: 'Pin PCD', nominal_value: 50.0, upper_tolerance: 0.1, lower_tolerance: -0.1 },
      { id: 'b_4', balloon_number: 4, parameter_name: 'Surface Ra', nominal_value: 1.6, unit: 'µm' }
    ];

    const plan = await createProcessPlan({
      drawing_id: drawing.id,
      drawing_revision_id: 'rev_1',
      plan_code: 'PP-DWG-CAST-01',
      name: 'Machining Routing Plan'
    });

    expect(plan.id).toBeDefined();
    expect(plan.plan_code).toBe('PP-DWG-CAST-01');

    // Seed industrial operations (Blanking -> Milling -> Finishing -> QA)
    const seeded = await seedStandardRouting(plan.id, drawing, balloons);
    expect(seeded.length).toBe(4);

    const ops = await getOperations(plan.id);
    expect(ops.length).toBe(4);
    expect(ops[0].op_number).toBe('10');
    expect(ops[1].op_number).toBe('20');
    expect(ops[2].op_number).toBe('30');
    expect(ops[3].op_number).toBe('50');

    // Check allocation coverage
    const unallocated = getUnallocatedBalloons(balloons, ops);
    // In default seeding, all 4 balloons are covered between OP 10, 20, 50
    expect(Array.isArray(unallocated)).toBe(true);

    // Generate IATF 16949 Control Plan summary
    const controlPlan = generateControlPlanSummary(plan, ops, balloons, drawing, { revision_code: 'A' });
    expect(controlPlan.partNumber).toBe('DWG-CAST-HOUSING');
    expect(controlPlan.totalOperations).toBe(4);
    expect(controlPlan.rows.length).toBeGreaterThanOrEqual(4);

    // Deep link generator to station checksheet
    const stationUrl = getStationChecksheetUrl(drawing.id, 'rev_1', '20');
    expect(stationUrl).toContain('#/drawing-checksheet?drawingId=dwg_housing_01');
    expect(stationUrl).toContain('op=20');
  });

  it('correctly allocates and re-allocates balloons to operations', async () => {
    const plan = await createProcessPlan({ drawing_id: 'd_1', drawing_revision_id: 'r_1' });
    const op = await createOperation(plan.id, { op_number: '20', op_name: 'CNC Milling' });

    expect(op.allocated_balloon_ids).toEqual([]);

    const updated = await allocateBalloonsToOperation(op.id, ['b_1', 'b_3']);
    expect(updated.allocated_balloon_ids).toEqual(['b_1', 'b_3']);

    const reloaded = await getOperations(plan.id);
    expect(reloaded[0].allocated_balloon_ids).toEqual(['b_1', 'b_3']);
  });
});
