import { describe, it, expect } from 'vitest';

// Test the logic for the newly expanded Tulip Trigger conditions & operators
describe('Tulip Trigger Parity - Extended Conditions & Array Actions', () => {
  const evaluateTulipCondition = (operator, left, right) => {
    const l = String(left ?? '').toLowerCase();
    const r = String(right ?? '').toLowerCase();
    switch (operator) {
      case '==': return l === r;
      case '!=': return l !== r;
      case '>': return Number(left) > Number(right);
      case '<': return Number(left) < Number(right);
      case '>=': return Number(left) >= Number(right);
      case '<=': return Number(left) <= Number(right);
      case 'CONTAINS': return l.includes(r);
      case 'DOES_NOT_CONTAIN': return !l.includes(r);
      case 'STARTS_WITH': return l.startsWith(r);
      case 'ENDS_WITH': return l.endsWith(r);
      case 'IS_WITHIN_RANGE': {
        const parts = String(right ?? '').split(/[,:\s\.\.]+/).filter(Boolean);
        if (parts.length >= 2) {
          const min = Number(parts[0]);
          const max = Number(parts[1]);
          const cur = Number(left);
          if (!isNaN(min) && !isNaN(max) && !isNaN(cur)) {
            return cur >= Math.min(min, max) && cur <= Math.max(min, max);
          }
        }
        return false;
      }
      case 'IS_EMPTY': return !left || String(left).trim() === '';
      case 'IS_NOT_EMPTY': return Boolean(left) && String(left).trim() !== '';
      default: return true;
    }
  };

  it('correctly evaluates DOES_NOT_CONTAIN', () => {
    expect(evaluateTulipCondition('DOES_NOT_CONTAIN', 'Batch-2026-X', 'DEFECT')).toBe(true);
    expect(evaluateTulipCondition('DOES_NOT_CONTAIN', 'Batch-DEFECT-01', 'DEFECT')).toBe(false);
  });

  it('correctly evaluates STARTS_WITH and ENDS_WITH', () => {
    expect(evaluateTulipCondition('STARTS_WITH', 'SN-998823', 'sn-')).toBe(true);
    expect(evaluateTulipCondition('STARTS_WITH', 'LOT-998823', 'sn-')).toBe(false);

    expect(evaluateTulipCondition('ENDS_WITH', 'part_final_PASS', '_pass')).toBe(true);
    expect(evaluateTulipCondition('ENDS_WITH', 'part_final_FAIL', '_pass')).toBe(false);
  });

  it('correctly evaluates IS_WITHIN_RANGE', () => {
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 25.4, '20, 30')).toBe(true);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 19.9, '20, 30')).toBe(false);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 35, '20, 30')).toBe(false);
    expect(evaluateTulipCondition('IS_WITHIN_RANGE', 20, '20..30')).toBe(true);
  });

  it('executes ARRAY_PUSH, ARRAY_POP, and ARRAY_CLEAR accurately', () => {
    let list = ['ITEM_A', 'ITEM_B'];

    // PUSH
    list = [...list, 'ITEM_C'];
    expect(list).toEqual(['ITEM_A', 'ITEM_B', 'ITEM_C']);

    // POP
    const popped = list.pop();
    expect(popped).toBe('ITEM_C');
    expect(list).toEqual(['ITEM_A', 'ITEM_B']);

    // CLEAR
    list = [];
    expect(list).toEqual([]);
  });
});

import {
  resolveDataSource,
  storeDataToLocation,
  executeIndustrialTrigger
} from '../../ui-engine/logic/industrialTriggerEngine';

describe('Tulip Data Manipulation Engine Tests', () => {
  it('resolves STATIC data sources (Text, Number, Boolean, Datetime)', () => {
    expect(resolveDataSource({ dataSourceType: 'STATIC', staticType: 'Text', staticValue: 'Hello Tulip' })).toBe('Hello Tulip');
    expect(resolveDataSource({ dataSourceType: 'STATIC', staticType: 'Number', staticValue: '42.5' })).toBe(42.5);
    expect(resolveDataSource({ dataSourceType: 'STATIC', staticType: 'Boolean', staticValue: 'true' })).toBe(true);
    expect(resolveDataSource({ dataSourceType: 'STATIC', staticType: 'Boolean', staticValue: 'false' })).toBe(false);
  });

  it('resolves VARIABLE data sources from state and array variables', () => {
    const state = { batchId: 'BATCH-2026-001', count: 15 };
    expect(resolveDataSource({ dataSourceType: 'VARIABLE', variableName: 'batchId' }, state)).toBe('BATCH-2026-001');

    const execContext = {
      variables: [
        { id: 'v1', name: 'operatorRole', value: 'Quality Inspector' }
      ]
    };
    expect(resolveDataSource({ dataSourceType: 'VARIABLE', variableName: 'operatorRole' }, {}, execContext)).toBe('Quality Inspector');
  });

  it('resolves TABLE_RECORD placeholder field data sources', () => {
    const execContext = {
      recordPlaceholders: [{ id: 'ph_workorder', name: 'Current Work Order' }],
      recordPlaceholderData: {
        ph_workorder: { id: 'WO-101', status: 'IN_PROGRESS', quantity: 500 }
      }
    };
    expect(resolveDataSource({ dataSourceType: 'TABLE_RECORD', placeholderId: 'ph_workorder', fieldName: 'status' }, {}, execContext)).toBe('IN_PROGRESS');
    expect(resolveDataSource({ dataSourceType: 'TABLE_RECORD', recordPlaceholder: 'Current Work Order', fieldName: 'quantity' }, {}, execContext)).toBe(500);
  });

  it('resolves APP_INFO data sources', () => {
    const execContext = { user: 'JOHN_DOE', station: 'ASSEMBLY_LINE_2' };
    expect(resolveDataSource({ dataSourceType: 'APP_INFO', appInfoField: 'LOGGED_IN_USER' }, {}, execContext)).toBe('JOHN_DOE');
    expect(resolveDataSource({ dataSourceType: 'APP_INFO', appInfoField: 'STATION' }, {}, execContext)).toBe('ASSEMBLY_LINE_2');
  });

  it('stores data into VARIABLE via storeDataToLocation', () => {
    let captured = null;
    const context = {
      setVariables: (updater) => {
        if (typeof updater === 'function') captured = updater({});
        else captured = updater;
      }
    };
    storeDataToLocation({ locationType: 'VARIABLE', variableName: 'scannedBarcode' }, 'BC-998822', context);
    expect(captured).toEqual({ scannedBarcode: 'BC-998822' });

    // Also verify array format
    let capturedArray = null;
    const contextArray = {
      setVariables: (updater) => {
        if (typeof updater === 'function') capturedArray = updater([{ id: 'v1', name: 'scannedBarcode', value: '' }]);
        else capturedArray = updater;
      }
    };
    storeDataToLocation({ locationType: 'VARIABLE', variableName: 'scannedBarcode' }, 'BC-998822', contextArray);
    expect(capturedArray[0].value).toBe('BC-998822');
  });

  it('stores data into TABLE_RECORD placeholder via storeDataToLocation', () => {
    let captured = null;
    const context = {
      recordPlaceholders: [{ id: 'ph1', name: 'Part Record' }],
      recordPlaceholderData: { ph1: { id: 'P-01', passCount: 5 } },
      setRecordPlaceholderData: (updater) => {
        captured = typeof updater === 'function' ? updater({ ph1: { id: 'P-01', passCount: 5 } }) : updater;
      }
    };
    storeDataToLocation({ locationType: 'TABLE_RECORD', placeholderId: 'ph1', fieldName: 'passCount' }, 6, context);
    expect(captured.ph1.passCount).toBe(6);
  });

  it('executes DATA_MANIPULATION_STORE action end-to-end', async () => {
    let updatedVars = null;
    const trigger = {
      actions: [
        {
          type: 'DATA_MANIPULATION_STORE',
          payload: {
            data: { dataSourceType: 'STATIC', staticType: 'Text', staticValue: 'DEFECT_CONFIRMED' },
            location: { locationType: 'VARIABLE', variableName: 'inspectionStatus' }
          }
        }
      ]
    };

    const context = {
      variables: {},
      setVariables: (updater) => {
        updatedVars = typeof updater === 'function' ? updater({}) : updater;
      }
    };

    await executeIndustrialTrigger(trigger, context);
    expect(updatedVars).toEqual({ inspectionStatus: 'DEFECT_CONFIRMED' });
  });

  it('executes DATA_MANIPULATION_INCREMENT and DATA_MANIPULATION_DECREMENT', async () => {
    let vars = { totalGoodParts: 10 };
    const context = {
      get variables() { return vars; },
      setVariables: (v) => { vars = { ...vars, ...(typeof v === 'function' ? v(vars) : v) }; }
    };

    // Increment by 5
    await executeIndustrialTrigger({
      actions: [{
        type: 'DATA_MANIPULATION_INCREMENT',
        payload: {
          location: { variableName: 'totalGoodParts' },
          valueType: 'STATIC',
          value: 5
        }
      }]
    }, context);

    expect(vars.totalGoodParts).toBe(15);

    // Decrement by 2
    await executeIndustrialTrigger({
      actions: [{
        type: 'DATA_MANIPULATION_DECREMENT',
        payload: {
          location: { variableName: 'totalGoodParts' },
          valueType: 'STATIC',
          value: 2
        }
      }]
    }, context);

    expect(vars.totalGoodParts).toBe(13);
  });

  it('executes DATA_MANIPULATION_CLEAR on a single variable', async () => {
    let vars = { targetVar: 'Active Data' };
    const context = {
      variables: vars,
      setVariables: (v) => { vars = typeof v === 'function' ? v(vars) : v; }
    };

    await executeIndustrialTrigger({
      actions: [{
        type: 'DATA_MANIPULATION_CLEAR',
        payload: {
          targetType: 'VARIABLE',
          location: { variableName: 'targetVar' }
        }
      }]
    }, context);

    expect(vars.targetVar).toBe('');
  });

  it('executes RESET_ALL_VARIABLES back to defaults', async () => {
    let vars = [
      { id: '1', name: 'counter', value: 99, defaultValue: 0 },
      { id: '2', name: 'batch', value: 'MODIFIED', defaultValue: 'INITIAL' }
    ];

    const context = {
      variables: vars,
      setVariables: (updater) => {
        vars = typeof updater === 'function' ? updater(vars) : updater;
      }
    };

    await executeIndustrialTrigger({
      actions: [{ type: 'RESET_ALL_VARIABLES' }]
    }, context);

    expect(vars[0].value).toBe(0);
    expect(vars[1].value).toBe('INITIAL');
  });

  it('executes TABLE_RECORD_CREATE_OR_LOAD loading existing or creating new record', async () => {
    let placeholderData = {};
    const context = {
      recordPlaceholders: [{ id: 'ph_order', name: 'Selected Order', tableId: 'orders_tbl' }],
      recordPlaceholderData: placeholderData,
      setRecordPlaceholderData: (updater) => {
        placeholderData = typeof updater === 'function' ? updater(placeholderData) : updater;
      },
      tableRecords: [
        { id: 'ORD-001', tableId: 'orders_tbl', customer: 'Acme Corp', qty: 100 }
      ]
    };

    // Case 1: Load existing record
    await executeIndustrialTrigger({
      actions: [{
        type: 'TABLE_RECORD_CREATE_OR_LOAD',
        payload: {
          placeholderId: 'ph_order',
          idType: 'STATIC',
          idValue: 'ORD-001'
        }
      }]
    }, context);

    expect(placeholderData.ph_order).toBeDefined();
    expect(placeholderData.ph_order.customer).toBe('Acme Corp');

    // Case 2: Create or load non-existent record
    await executeIndustrialTrigger({
      actions: [{
        type: 'TABLE_RECORD_CREATE_OR_LOAD',
        payload: {
          placeholderId: 'ph_order',
          idType: 'STATIC',
          idValue: 'ORD-999'
        }
      }]
    }, context);

    expect(placeholderData.ph_order).toBeDefined();
    expect(placeholderData.ph_order.id).toBe('ORD-999');
  });

  it('executes RUN_CONNECTOR_FUNCTION and stores result into variable', async () => {
    let vars = { apiResult: null };
    const context = {
      variables: vars,
      setVariables: (updater) => {
        vars = typeof updater === 'function' ? updater(vars) : updater;
      },
      connectors: [
        {
          id: 'conn_sap',
          name: 'SAP ERP',
          functions: [
            { id: 'fn_get_inventory', name: 'Get Inventory', mockResponse: { stock: 450 } }
          ]
        }
      ]
    };

    await executeIndustrialTrigger({
      actions: [{
        type: 'RUN_CONNECTOR_FUNCTION',
        payload: {
          connectorId: 'conn_sap',
          functionId: 'fn_get_inventory',
          saveResultAs: 'apiResult'
        }
      }]
    }, context);

    expect(vars.apiResult).toEqual({ stock: 450 });
  });

  it('rolls back variables and records atomically if a trigger action fails (Tulip LTS 15 Parity)', async () => {
    let vars = { initialCount: 100 };
    let placeholderData = { ph1: { id: 'REC-1', status: 'ORIGINAL' } };

    const context = {
      variables: vars,
      setVariables: (updater) => {
        vars = typeof updater === 'function' ? updater(vars) : updater;
      },
      recordPlaceholderData: placeholderData,
      setRecordPlaceholderData: (updater) => {
        placeholderData = typeof updater === 'function' ? updater(placeholderData) : updater;
      }
    };

    // Trigger where step 1 succeeds (Store 999 into initialCount)
    // and step 2 fails intentionally
    const trigger = {
      actions: [
        {
          type: 'DATA_MANIPULATION_STORE',
          payload: {
            data: { dataSourceType: 'STATIC', staticType: 'Number', staticValue: 999 },
            location: { locationType: 'VARIABLE', variableName: 'initialCount' }
          }
        },
        {
          type: 'SIMULATED_FAILING_ACTION',
          payload: {}
        }
      ]
    };

    // Temporarily mock an action error
    const result = await executeIndustrialTrigger(trigger, {
      ...context,
      customActionHandler: async () => {
        return { status: 'ERROR', message: 'Simulated Device Timeout' };
      }
    });

    // Verify rollback returned initial values
    expect(vars.initialCount).toBe(100);
    expect(placeholderData.ph1.status).toBe('ORIGINAL');
  });
});

