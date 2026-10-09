import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  isDebounced,
  resetDebounce,
  getExecutionContext,
  evaluateCondition,
  evaluateClause,
  executeIndustrialTrigger
} from '../../ui-engine/logic/industrialTriggerEngine';

describe('Industrial Trigger & Logic Engine (Shopfloor Pipeline)', () => {
  beforeEach(() => {
    resetDebounce();
  });

  describe('1. Debounce & Double-Tap Protection', () => {
    it('allows the first click and blocks subsequent clicks within the debounce window', () => {
      const compId = 'btn_start_prod';

      // First click: allowed
      expect(isDebounced(compId, 400)).toBe(false);

      // Rapid second click immediately after: blocked
      expect(isDebounced(compId, 400)).toBe(true);

      // Third click immediately after: still blocked
      expect(isDebounced(compId, 400)).toBe(true);
    });

    it('allows clicks on different components independently', () => {
      expect(isDebounced('btn_start', 400)).toBe(false);
      expect(isDebounced('btn_stop', 400)).toBe(false);
    });
  });

  describe('2. Traceability Context Injection', () => {
    it('generates standard audit trail metadata for shop floor compliance', () => {
      const ctx = getExecutionContext({
        operatorId: 'OP-402',
        operatorName: 'Budi Santoso',
        stationId: 'CNC-01',
        workOrderId: 'WO-2026-9901'
      });

      expect(ctx.operatorId).toBe('OP-402');
      expect(ctx.operatorName).toBe('Budi Santoso');
      expect(ctx.stationId).toBe('CNC-01');
      expect(ctx.shiftId).toBeDefined();
      expect(ctx.timestampUtc).toBeDefined();
      expect(ctx.idempotencyKey).toMatch(/^TX-/);
    });
  });

  describe('3. Pre-Condition & Guard Evaluator', () => {
    it('evaluates equality conditions correctly', () => {
      expect(evaluateCondition({ leftOperand: 'RELEASED', operator: 'EQUALS', rightOperand: 'RELEASED' })).toBe(true);
      expect(evaluateCondition({ leftOperand: 'DRAFT', operator: 'EQUALS', rightOperand: 'RELEASED' })).toBe(false);
    });

    it('evaluates numeric comparisons correctly', () => {
      expect(evaluateCondition({ leftOperand: '150', operator: 'GREATER_THAN', rightOperand: '100' })).toBe(true);
      expect(evaluateCondition({ leftOperand: '50', operator: 'GREATER_THAN', rightOperand: '100' })).toBe(false);
    });

    it('evaluates boolean and context tokens', () => {
      const state = {
        workOrder: { status: 'RELEASED' },
        machine: { eStop: false }
      };

      expect(evaluateCondition({ leftOperand: '@workOrder.status', operator: 'EQUALS', rightOperand: 'RELEASED' }, state)).toBe(true);
      expect(evaluateCondition({ leftOperand: '@machine.eStop', operator: 'IS_FALSE' }, state)).toBe(true);
    });

    it('evaluates multi-condition clauses with ALL and ANY matching', () => {
      const state = {
        variables: [{ name: 'stockQty', value: 50 }, { name: 'machineReady', value: true }]
      };

      const clauseAll = {
        match: 'ALL',
        conditions: [
          { leftOperand: 'stockQty', operator: 'GREATER_THAN', rightOperand: '10' },
          { leftOperand: 'machineReady', operator: 'IS_TRUE' }
        ]
      };
      expect(evaluateClause(clauseAll, state)).toBe(true);

      const clauseFailing = {
        match: 'ALL',
        conditions: [
          { leftOperand: 'stockQty', operator: 'GREATER_THAN', rightOperand: '100' }, // false
          { leftOperand: 'machineReady', operator: 'IS_TRUE' }
        ]
      };
      expect(evaluateClause(clauseFailing, state)).toBe(false);
    });
  });

  describe('4. Full Pipeline: UI → Trigger → Guards → Action → State Transition', () => {
    it('executes START_PRODUCTION when pre-conditions pass', async () => {
      let prodState = { status: 'IDLE' };
      const setProductionState = (updater) => {
        prodState = typeof updater === 'function' ? updater(prodState) : updater;
      };

      const messages = [];
      const onShowMessage = (msg) => messages.push(msg);

      const trigger = {
        id: 'trig_start',
        name: 'Start Production Trigger',
        clauses: [
          {
            match: 'ALL',
            conditions: [
              { leftOperand: '@workOrder.status', operator: 'EQUALS', rightOperand: 'RELEASED' }
            ],
            actions: [
              {
                type: 'START_PRODUCTION',
                payload: { workOrderId: 'WO-1089', targetQty: 250 }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, {
        componentId: 'btn_start',
        state: {
          workOrder: { status: 'RELEASED' }
        },
        setProductionState,
        onShowMessage
      });

      expect(result.success).toBe(true);
      expect(prodState.status).toBe('RUNNING');
      expect(prodState.workOrderId).toBe('WO-1089');
      expect(prodState.targetQty).toBe(250);
      expect(messages.length).toBeGreaterThan(0);
      expect(messages[0].type).toBe('SUCCESS');
    });

    it('blocks START_PRODUCTION and executes Else branch when pre-conditions fail (Negative Flow)', async () => {
      let prodState = { status: 'IDLE' };
      const setProductionState = (updater) => {
        prodState = typeof updater === 'function' ? updater(prodState) : updater;
      };

      const messages = [];
      const onShowMessage = (msg) => messages.push(msg);

      const trigger = {
        id: 'trig_start_guard_fail',
        name: 'Guard Failing Trigger',
        clauses: [
          {
            match: 'ALL',
            conditions: [
              // Guard: Work Order MUST be RELEASED
              { leftOperand: '@workOrder.status', operator: 'EQUALS', rightOperand: 'RELEASED' }
            ],
            actions: [
              { type: 'START_PRODUCTION', payload: { workOrderId: 'WO-1089' } }
            ]
          }
        ],
        // Else branch: execute warning
        elseActions: [
          {
            type: 'SHOW_MESSAGE',
            payload: {
              message: 'Tidak dapat memulai: Work Order belum di-release oleh Supervisor!',
              messageType: 'ERROR'
            }
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, {
        componentId: 'btn_start_fail',
        state: {
          // Status is DRAFT -> Guard will fail!
          workOrder: { status: 'DRAFT' }
        },
        setProductionState,
        onShowMessage
      });

      // Guard failed: action was NOT executed, state remains IDLE
      expect(result.success).toBe(false);
      expect(prodState.status).toBe('IDLE');

      // Else branch executed
      expect(messages.length).toBe(1);
      expect(messages[0].type).toBe('ERROR');
      expect(messages[0].message).toContain('belum di-release');
    });

    it('requires safety interlock confirmation on PLC_WRITE_TAG and proceeds when approved', async () => {
      const onRequestConfirmation = vi.fn().mockResolvedValue(true);
      const messages = [];
      const onShowMessage = (msg) => messages.push(msg);

      const trigger = {
        id: 'trig_plc_safe',
        name: 'Safe PLC Write',
        clauses: [
          {
            match: 'ALL',
            actions: [
              {
                type: 'PLC_WRITE_TAG',
                payload: {
                  tag: 'ns=2;s=SpindleSpeed',
                  value: 1800,
                  requireConfirmation: true,
                  confirmTitle: 'Start High Speed Spindle'
                }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, {
        componentId: 'btn_spindle',
        onRequestConfirmation,
        onShowMessage
      });

      expect(onRequestConfirmation).toHaveBeenCalledTimes(1);
      expect(onRequestConfirmation).toHaveBeenCalledWith(expect.objectContaining({
        tag: 'ns=2;s=SpindleSpeed',
        value: 1800,
        title: 'Start High Speed Spindle'
      }));
      expect(result.executedActions[0].status).toBe('SUCCESS');
      expect(result.executedActions[0].value).toBe(1800);
    });

    it('cancels PLC_WRITE_TAG when operator rejects safety interlock confirmation', async () => {
      const onRequestConfirmation = vi.fn().mockResolvedValue(false);
      const messages = [];
      const onShowMessage = (msg) => messages.push(msg);

      const trigger = {
        id: 'trig_plc_reject',
        name: 'Rejected PLC Write',
        clauses: [
          {
            match: 'ALL',
            actions: [
              {
                type: 'PLC_WRITE_TAG',
                payload: {
                  tag: 'RESET_SAFETY_BARRIER',
                  value: 1,
                  requireConfirmation: true
                }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, {
        componentId: 'btn_barrier',
        onRequestConfirmation,
        onShowMessage
      });

      expect(onRequestConfirmation).toHaveBeenCalledTimes(1);
      expect(result.executedActions[0].status).toBe('CANCELLED');
      expect(result.executedActions[0].reason).toBe('SAFETY_INTERLOCK_CANCELLED');
      expect(messages.some(m => m.message.includes('dibatalkan oleh operator'))).toBe(true);
    });

    it('executes PLC_WRITE_RECIPE batch multi-tag write successfully', async () => {
      const trigger = {
        id: 'trig_recipe',
        name: 'Download Recipe',
        clauses: [
          {
            match: 'ALL',
            actions: [
              {
                type: 'PLC_WRITE_RECIPE',
                payload: {
                  tags: {
                    'ns=2;s=SpindleSpeed': 1500,
                    'ns=2;s=Temperature': 180,
                    '40001': 55
                  }
                }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, { componentId: 'btn_recipe' });
      expect(result.executedActions[0].status).toBe('SUCCESS');
      expect(result.executedActions[0].count).toBe(3);
    });

    it('executes TRIGGER_WORKFLOW and passes execution context', async () => {
      const trigger = {
        id: 'trig_wf',
        name: 'Run ERP Sync',
        clauses: [
          {
            match: 'ALL',
            actions: [
              {
                type: 'TRIGGER_WORKFLOW',
                payload: {
                  workflowId: 'wf_sap_sync',
                  workflowName: 'Sync SAP S/4HANA',
                  inputs: { orderId: 'WO-9912' }
                }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, { componentId: 'btn_sync_wf' });
      expect(result.executedActions[0].status).toBe('SUCCESS');
      expect(result.executedActions[0].workflowId).toBe('wf_sap_sync');
    });

    it('calculates dynamic arithmetic formula with CALCULATE_FORMULA', async () => {
      let variables = [{ name: 'stockQty', value: 100 }, { name: 'consumed', value: 25 }, { name: 'remaining', value: 0 }];
      const setVariables = (fn) => { variables = fn(variables); };

      const trigger = {
        id: 'trig_calc',
        name: 'Calculate Balance',
        clauses: [
          {
            match: 'ALL',
            actions: [
              {
                type: 'CALCULATE_FORMULA',
                payload: {
                  formula: '@stockQty - @consumed',
                  targetVar: 'remaining'
                }
              }
            ]
          }
        ]
      };

      const result = await executeIndustrialTrigger(trigger, {
        componentId: 'btn_calc',
        state: { variables },
        setVariables
      });

      expect(result.executedActions[0].status).toBe('SUCCESS');
      expect(result.executedActions[0].result).toBe(75);
      expect(variables.find(v => v.name === 'remaining').value).toBe(75);
    });
  });
});
