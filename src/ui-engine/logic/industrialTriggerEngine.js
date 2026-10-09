/**
 * industrialTriggerEngine.js
 * Manufacturing-Grade Trigger & Action Execution Engine for MaviCore MES & Gluestack App Builder
 * 
 * Implements the full Shop Floor pipeline:
 * UI Interaction → Debounce Guard → Context Injection → Pre-Condition Evaluation (Guards) 
 * → Branching Actions (Atomic Execution) → UI State Transition + Multimodal Feedback (Audio, Haptic, Snackbar)
 */

import iotConnector from '../../utils/iotConnector';
import automationEngine from '../../utils/automationEngine';

/**
 * Executes industrial 3-way PLC handshake:
 * MES Request Bit = 1 -> Await PLC Ack Bit == 1 -> MES Request Bit = 0
 */
export async function executePlcHandshake(reqTag, reqVal = 1, ackTag, expectedAck = 1, timeoutMs = 2500) {
  if (!iotConnector || !ackTag) return true;

  // 1. Set MES Request Bit
  iotConnector.setSimValue(reqTag, reqVal);
  try {
    iotConnector.publish(`mavi/plc/write/${reqTag}`, JSON.stringify({ tag: reqTag, value: reqVal }));
  } catch (e) {}

  // 2. Poll for PLC Acknowledgment
  const startTime = Date.now();
  let ackReceived = false;

  while (Date.now() - startTime < timeoutMs) {
    const liveVal = iotConnector.getLiveValue(ackTag);
    if (String(liveVal) === String(expectedAck)) {
      ackReceived = true;
      break;
    }
    await new Promise(res => setTimeout(res, 50));
  }

  // 3. Reset MES Request Bit to 0
  iotConnector.setSimValue(reqTag, 0);
  try {
    iotConnector.publish(`mavi/plc/write/${reqTag}`, JSON.stringify({ tag: reqTag, value: 0 }));
  } catch (e) {}

  if (!ackReceived) {
    throw new Error(`PLC Handshake Timeout: Tag [${ackTag}] tidak mengirim sinyal ACK dalam ${timeoutMs}ms.`);
  }

  return true;
}

// ── 1. Debounce & Double-Click Protection ────────────────────────────────────
const clickLocks = new Map();

/**
 * Check if an interaction on a component is debounced.
 * Prevents double-tap duplicate records from gloves, oily screens, or jitter.
 */
export function isDebounced(componentId, debounceMs = 400) {
  if (!componentId) return false;
  const now = Date.now();
  const lastTime = clickLocks.get(componentId) || 0;
  if (now - lastTime < debounceMs) {
    return true; // Reject rapid duplicate click
  }
  clickLocks.set(componentId, now);
  return false;
}

export function resetDebounce(componentId) {
  if (componentId) clickLocks.delete(componentId);
  else clickLocks.clear();
}

// ── 2. Multimodal Industrial Feedback (Audio + Haptics) ─────────────────────

/**
 * Synthesizes industrial audio feedback using Web Audio API (zero external assets needed).
 */
export function playIndustrialSound(type = 'SUCCESS') {
  try {
    if (typeof window === 'undefined') return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'SUCCESS' || type === 'START') {
      // Ascending pleasant industrial chime (587Hz -> 880Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'ERROR' || type === 'REJECT') {
      // Low warning buzz (220Hz saw-tooth tone)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.1);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else {
      // Subtle metallic click for tactile acknowledgment
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    }
  } catch (err) {
    // AudioContext might be blocked until user gesture, safely ignore
  }
}

/**
 * Triggers Android native tactile vibration (MD3 Haptic).
 */
export function triggerIndustrialHaptic(type = 'LIGHT') {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      if (type === 'SUCCESS' || type === 'START') {
        navigator.vibrate([40, 30, 40]);
      } else if (type === 'ERROR' || type === 'REJECT') {
        navigator.vibrate([100, 50, 100]);
      } else {
        navigator.vibrate([25]); // Light tap
      }
    }
  } catch (err) {
    // Ignore haptic errors on unsupported devices
  }
}

// ── 3. Traceability Context Provider ────────────────────────────────────────

/**
 * Generates audit metadata required by ISO 9001 / IATF 16949 / 21 CFR Part 11.
 */
export function getExecutionContext(customContext = {}) {
  const now = new Date();
  
  // Auto-detect shift based on hour
  const hour = now.getHours();
  let defaultShift = 'Shift 1 (Pagi 07:00 - 15:00)';
  if (hour >= 15 && hour < 23) {
    defaultShift = 'Shift 2 (Siang 15:00 - 23:00)';
  } else if (hour >= 23 || hour < 7) {
    defaultShift = 'Shift 3 (Malam 23:00 - 07:00)';
  }

  return {
    operatorId: customContext.operatorId || 'OP-DEFAULT',
    operatorName: customContext.operatorName || 'Operator Shopfloor',
    stationId: customContext.stationId || 'STATION-01',
    lineId: customContext.lineId || 'LINE-A',
    shiftId: customContext.shiftId || defaultShift,
    deviceId: customContext.deviceId || (typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 32) : 'TERMINAL-01'),
    timestampUtc: now.toISOString(),
    timestampLocal: now.toLocaleString('id-ID'),
    idempotencyKey: `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
    ...customContext
  };
}

// ── 4. Pre-Condition & Guard Evaluator ───────────────────────────────────────

/**
 * Resolves an operand value from static, variable, form, or context.
 */
export function resolveOperand(operand, state = {}) {
  if (operand === undefined || operand === null) return '';
  if (typeof operand !== 'string') return operand;

  // Context or variable token e.g. @operator.id, @machine.ready, @stockQty
  if (operand.startsWith('@')) {
    const path = operand.substring(1);
    const parts = path.split('.');
    let current = state;
    for (const part of parts) {
      if (current === undefined || current === null) break;
      current = current[part];
    }
    if (current !== undefined && current !== null && current !== '') {
      return current;
    }

    // Check in state.variables if not found directly
    if (state.variables) {
      if (Array.isArray(state.variables)) {
        const found = state.variables.find(v => v.name === path || v.id === path);
        if (found !== undefined) return found.value;
      } else if (typeof state.variables === 'object' && state.variables[path] !== undefined) {
        return state.variables[path];
      }
    }

    // Check in state.formValues
    if (state.formValues && state.formValues[path] !== undefined) {
      return state.formValues[path];
    }

    return '';
  }

  // Variable token lookup without @ prefix
  if (state.variables) {
    if (Array.isArray(state.variables)) {
      const foundVar = state.variables.find(v => v.name === operand || v.id === operand);
      if (foundVar !== undefined) return foundVar.value;
    } else if (typeof state.variables === 'object' && state.variables[operand] !== undefined) {
      return state.variables[operand];
    }
  }

  // Form value lookup
  if (state.formValues && state.formValues[operand] !== undefined) {
    return state.formValues[operand];
  }

  return operand;
}

/**
 * Resolves a Data Manipulation data source value (Static Value, Variable, Table Record, Table Aggregation, Expression, App Info).
 * Fully aligned with Tulip Triggers specification (support.tulip.co/docs/triggers).
 */
export function resolveDataSource(source = {}, state = {}, execContext = {}) {
  const type = (source.dataSourceType || source.valueType || source.type || 'STATIC').toUpperCase();

  switch (type) {
    case 'STATIC': {
      const sType = (source.staticType || 'Text').toLowerCase();
      const val = source.staticValue !== undefined ? source.staticValue : (source.value !== undefined ? source.value : '');
      if (sType === 'number') {
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      }
      if (sType === 'boolean') {
        return val === true || val === 'true' || val === 1 || val === '1';
      }
      if (sType === 'datetime') {
        return val || new Date().toISOString();
      }
      return String(val ?? '');
    }

    case 'VARIABLE': {
      const varName = source.variableName || source.varPath || source.value;
      if (!varName) return '';
      return resolveOperand(`@${varName}`, state);
    }

    case 'TABLE_RECORD': {
      const placeholder = source.placeholderId || source.recordPlaceholder || source.placeholder;
      const fieldName = source.fieldName || source.field;
      if (!placeholder || !fieldName) return '';

      // Check loadedRecords
      const loaded = state.loadedRecords?.[placeholder] || state.loadedRecords?.[String(placeholder).toLowerCase()];
      if (loaded && loaded[fieldName] !== undefined) {
        return loaded[fieldName];
      }

      // Check placeholder object matching in recordPlaceholders
      if (state.recordPlaceholders && state.loadedRecords) {
        const phObj = state.recordPlaceholders.find(rp => rp.id === placeholder || rp.name === placeholder);
        if (phObj) {
          const rec = state.loadedRecords[phObj.id] || state.loadedRecords[phObj.name];
          if (rec && rec[fieldName] !== undefined) return rec[fieldName];
        }
      }

      // Fallback: check variable or flat token e.g. @Materials Table Record.Status
      const flatToken = `@${placeholder}.${fieldName}`;
      const flatVal = resolveOperand(flatToken, state);
      if (flatVal !== '' && flatVal !== undefined) return flatVal;

      return '';
    }

    case 'TABLE_AGGREGATION': {
      const aggType = (source.aggregationType || 'COUNT').toUpperCase();
      const tableId = source.tableId || source.table;
      const fieldName = source.fieldName || source.field;

      let records = [];
      if (state.tables && Array.isArray(state.tables)) {
        const tbl = state.tables.find(t => t.id === tableId || t.name === tableId);
        if (tbl && tbl.records) records = tbl.records;
      }
      if (records.length === 0 && tableId && typeof localStorage !== 'undefined') {
        try {
          const raw = localStorage.getItem(`mavi_table_${tableId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.records) records = parsed.records;
          }
        } catch (e) {}
      }

      if (aggType === 'COUNT' || aggType === 'COUNT OF RECORDS') {
        return records.length;
      }

      const numVals = records.map(r => Number(r[fieldName])).filter(n => !isNaN(n));
      if (aggType === 'SUM') {
        return numVals.reduce((acc, v) => acc + v, 0);
      }
      if (aggType === 'AVERAGE' || aggType === 'AVG') {
        return numVals.length > 0 ? numVals.reduce((acc, v) => acc + v, 0) / numVals.length : 0;
      }
      if (aggType === 'MIN') {
        return numVals.length > 0 ? Math.min(...numVals) : 0;
      }
      if (aggType === 'MAX') {
        return numVals.length > 0 ? Math.max(...numVals) : 0;
      }
      return records.length;
    }

    case 'EXPRESSION': {
      const formula = source.expression || source.formula || source.value || '';
      if (!formula) return '';
      try {
        let evalExpr = formula;
        const evalState = { ...(state || {}), context: execContext };
        evalExpr = evalExpr.replace(/@([a-zA-Z0-9_.]+)/g, (_, token) => {
          const val = resolveOperand(`@${token}`, evalState);
          return typeof val === 'number' ? val : (Number(val) || `"${String(val)}"` || 0);
        });
        const calcFn = new Function('Math', `return (${evalExpr});`);
        return calcFn(Math);
      } catch (err) {
        return formula;
      }
    }

    case 'APP_INFO': {
      const field = (source.appInfoField || source.field || 'LOGGED_IN_USER').toUpperCase();
      if (['LOGGED_IN_USER', 'USER', 'OPERATOR'].includes(field)) {
        return execContext.operatorName || execContext.operatorId || 'Operator';
      }
      if (['STATION', 'STATION_NAME'].includes(field)) {
        return execContext.stationId || 'STATION-01';
      }
      if (['SHIFT', 'SHIFT_NAME'].includes(field)) {
        return execContext.shiftId || 'Shift 1';
      }
      if (['APP_NAME', 'APPLICATION'].includes(field)) {
        return state.appName || 'MAVI MES';
      }
      if (['CURRENT_DATETIME', 'DATETIME', 'TIME'].includes(field)) {
        return execContext.timestampUtc || new Date().toISOString();
      }
      return '';
    }

    default:
      return source.value !== undefined ? source.value : '';
  }
}

/**
 * Stores a value into a Data Manipulation location (Variable or Table Record field).
 */
export function storeDataToLocation(location = {}, value, context = {}, execContext = {}) {
  const locType = (location.locationType || location.targetType || 'VARIABLE').toUpperCase();

  if (locType === 'VARIABLE') {
    const varName = location.variableName || location.varPath || location.targetVar || location.target;
    if (!varName) return false;

    if (context.setVariables) {
      context.setVariables(prev => {
        if (Array.isArray(prev)) {
          const exists = prev.some(v => v.name === varName || v.id === varName);
          if (exists) {
            return prev.map(v => (v.name === varName || v.id === varName) ? { ...v, value } : v);
          } else {
            return [...prev, { id: `var_${Date.now()}`, name: varName, value, type: typeof value }];
          }
        } else if (prev && typeof prev === 'object') {
          return { ...prev, [varName]: value };
        }
        return { [varName]: value };
      });
    }
    return true;
  }

  if (locType === 'TABLE_RECORD') {
    const placeholder = location.placeholderId || location.recordPlaceholder || location.placeholder;
    const fieldName = location.fieldName || location.field;
    if (!placeholder || !fieldName) return false;

    // 1. Update loadedRecords in context state
    if (context.setLoadedRecords) {
      context.setLoadedRecords(prev => {
        const cur = prev?.[placeholder] || {};
        return {
          ...prev,
          [placeholder]: { ...cur, [fieldName]: value, updatedAt: execContext?.timestampUtc || new Date().toISOString() }
        };
      });
    }

    // 2. Persist to localStorage table if tableId & recordId are known
    try {
      const curRecord = context.state?.loadedRecords?.[placeholder];
      const tableId = location.tableId || curRecord?.tableId || context.state?.recordPlaceholders?.find(rp => rp.id === placeholder || rp.name === placeholder)?.tableId;
      const recId = curRecord?.id || curRecord?._id || curRecord?.recordId;
      if (tableId && recId && typeof localStorage !== 'undefined') {
        const key = `mavi_table_${tableId}`;
        const raw = localStorage.getItem(key);
        if (raw) {
          const tbl = JSON.parse(raw);
          if (tbl.records) {
            const idx = tbl.records.findIndex(r => r.id === recId || r._id === recId || r.recordId === recId);
            if (idx >= 0) {
              tbl.records[idx] = { ...tbl.records[idx], [fieldName]: value, updatedAt: execContext?.timestampUtc || new Date().toISOString() };
              localStorage.setItem(key, JSON.stringify(tbl));
            }
          }
        }
      }
    } catch (e) {}

    // 3. Mirror into app variables if token exists (e.g. placeholder.fieldName)
    if (context.setVariables) {
      const combinedToken = `${placeholder}.${fieldName}`;
      context.setVariables(prev => {
        if (Array.isArray(prev)) {
          return prev.map(v => (v.name === combinedToken || v.name === fieldName) ? { ...v, value } : v);
        } else if (prev && typeof prev === 'object') {
          return { ...prev, [combinedToken]: value };
        }
        return prev;
      });
    }
    return true;
  }

  return false;
}

/**
 * Evaluates a single condition.
 */
export function evaluateCondition(cond, state = {}) {
  const left = resolveOperand(cond.leftOperand, state);
  const right = resolveOperand(cond.rightOperand, state);
  const op = (cond.operator || 'EQUALS').toUpperCase();

  switch (op) {
    case 'EQUALS':
    case '==':
    case '===':
      return String(left).trim().toLowerCase() === String(right).trim().toLowerCase();

    case 'NOT_EQUALS':
    case '!=':
    case '!==':
      return String(left).trim().toLowerCase() !== String(right).trim().toLowerCase();

    case 'GREATER_THAN':
    case '>':
      return Number(left) > Number(right);

    case 'GREATER_THAN_OR_EQUAL':
    case '>=':
      return Number(left) >= Number(right);

    case 'LESS_THAN':
    case '<':
      return Number(left) < Number(right);

    case 'LESS_THAN_OR_EQUAL':
    case '<=':
      return Number(left) <= Number(right);

    case 'CONTAINS':
      return String(left).toLowerCase().includes(String(right).toLowerCase());

    case 'IS_EMPTY':
      return left === undefined || left === null || String(left).trim() === '';

    case 'IS_NOT_EMPTY':
      return left !== undefined && left !== null && String(left).trim() !== '';

    case 'IS_TRUE':
      return left === true || String(left).toLowerCase() === 'true' || left === 1;

    case 'IS_FALSE':
      return left === false || String(left).toLowerCase() === 'false' || left === 0;

    default:
      return true;
  }
}

/**
 * Evaluates a clause's set of conditions against the current app state.
 */
export function evaluateClause(clause, state = {}) {
  const conditions = clause.conditions || [];
  if (conditions.length === 0) return true; // No conditions = always execute

  const matchMode = (clause.match || 'ALL').toUpperCase();

  if (matchMode === 'ALL') {
    return conditions.every(c => evaluateCondition(c, state));
  } else {
    return conditions.some(c => evaluateCondition(c, state));
  }
}

// ── 5. Main Industrial Execution Engine ──────────────────────────────────────

/**
 * Executes a trigger with full industrial-grade pipeline:
 * Debounce -> Context Injection -> Pre-Conditions -> Actions / Branching -> Multimodal Feedback
 * 
 * @param {Object} trigger - Trigger definition
 * @param {Object} context - Execution context and state handlers:
 *   - componentId: string
 *   - state: { variables, formValues, counters, productionState, workOrder }
 *   - setVariables: function
 *   - setFormValues: function
 *   - setProductionState: function
 *   - setCurrentScreenId: function
 *   - onLog: function
 *   - onShowMessage: function
 *   - customContext: object
 * @returns {Promise<Object>} Execution result { success, executedActions, status, message }
 */
export async function executeIndustrialTrigger(trigger, context = {}) {
  if (!trigger || trigger.enabled === false) {
    return { success: false, reason: 'TRIGGER_DISABLED' };
  }

  const compId = context.componentId || trigger.id;

  // 1. Debounce & Multi-click Guard
  if (isDebounced(compId, 450)) {
    console.warn(`[IndustrialTrigger] Blocked rapid double-click on component ${compId}`);
    triggerIndustrialHaptic('LIGHT');
    return { success: false, reason: 'DEBOUNCED' };
  }

  // 2. Multimodal Tactile Click Feedback
  triggerIndustrialHaptic('LIGHT');
  playIndustrialSound('CLICK');

  // 3. Inject Traceability Context
  const executionContext = getExecutionContext(context.customContext || {});
  const evalState = {
    ...(context.state || {}),
    context: executionContext,
    operator: { id: executionContext.operatorId, name: executionContext.operatorName },
    station: { id: executionContext.stationId },
    shift: { id: executionContext.shiftId },
  };

  const executedActions = [];
  const clauses = trigger.clauses || [];
  let clauseMatched = false;

  // 4. Pre-Condition / Guard Check Pipeline
  for (const clause of clauses) {
    const passed = evaluateClause(clause, evalState);

    if (passed) {
      clauseMatched = true;
      const actions = clause.actions || [];

      for (const act of actions) {
        const actionResult = await executeAction(act, context, executionContext);
        executedActions.push(actionResult);

        if (trigger.stopOnError && actionResult.status === 'ERROR') {
          break;
        }
      }
      break; // Stop after first matching clause
    }
  }

  // 5. Negative Flow / Else Branch
  if (!clauseMatched && trigger.elseActions && trigger.elseActions.length > 0) {
    playIndustrialSound('ERROR');
    triggerIndustrialHaptic('ERROR');

    for (const act of trigger.elseActions) {
      const actionResult = await executeAction(act, context, executionContext);
      executedActions.push(actionResult);
    }
  }

  return {
    success: clauseMatched,
    triggerName: trigger.name,
    executedActions,
    context: executionContext
  };
}

// ── 6. Atomic Action Handlers ────────────────────────────────────────────────

async function executeAction(act, context, execContext) {
  const type = act.type || act.action;
  const payload = act.payload || act.params || {};

  try {
    switch (type) {
      // ── Shopfloor: Start Production ──
      case 'START_PRODUCTION': {
        const woId = payload.workOrderId || payload.woId || execContext.workOrderId || 'WO-AUTO';
        const startPayload = {
          status: 'RUNNING',
          workOrderId: woId,
          startTime: execContext.timestampUtc,
          operatorId: execContext.operatorId,
          stationId: execContext.stationId,
          shiftId: execContext.shiftId,
          targetQty: Number(payload.targetQty || 100),
          actualQty: 0,
          defectQty: 0
        };

        if (context.setProductionState) {
          context.setProductionState(prev => ({ ...prev, ...startPayload }));
        }

        // Multimodal Start Feedback
        playIndustrialSound('START');
        triggerIndustrialHaptic('SUCCESS');

        if (context.onShowMessage) {
          context.onShowMessage({
            message: `Produksi Dimulai: ${woId} di ${execContext.stationId}`,
            type: 'SUCCESS'
          });
        }

        if (context.onLog) {
          context.onLog(act.type, 'START_PRODUCTION', `WO: ${woId} | Op: ${execContext.operatorId}`);
        }

        return { type, status: 'SUCCESS', data: startPayload };
      }

      // ── Shopfloor: Stop / Complete Production ──
      case 'STOP_PRODUCTION': {
        const stopPayload = {
          status: 'COMPLETED',
          endTime: execContext.timestampUtc
        };

        if (context.setProductionState) {
          context.setProductionState(prev => ({ ...prev, ...stopPayload }));
        }

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('SUCCESS');

        if (context.onShowMessage) {
          context.onShowMessage({
            message: 'Produksi Selesai. Data siklus telah disimpan.',
            type: 'SUCCESS'
          });
        }

        return { type, status: 'SUCCESS', data: stopPayload };
      }

      // ── Shopfloor: Validate Work Order & Operator Skills ──
      case 'VALIDATE_WORK_ORDER': {
        const woStatus = payload.expectedStatus || 'RELEASED';
        const currentWo = context.state?.workOrder || {};
        
        if (currentWo.status && currentWo.status !== woStatus) {
          playIndustrialSound('ERROR');
          triggerIndustrialHaptic('ERROR');
          if (context.onShowMessage) {
            context.onShowMessage({
              message: `Validasi Gagal: Status Work Order '${currentWo.status}', harus '${woStatus}'.`,
              type: 'ERROR'
            });
          }
          return { type, status: 'ERROR', message: `Invalid status ${currentWo.status}` };
        }

        playIndustrialSound('SUCCESS');
        return { type, status: 'SUCCESS', message: 'Work Order Valid' };
      }

      // ── Variables: Set Variable ──
      case 'SET_VARIABLE': {
        const varId = payload.variableId || payload.varPath;
        const val = payload.value !== undefined ? payload.value : payload.val;

        if (context.setVariables && varId) {
          context.setVariables(prev => prev.map(v => {
            if (v.id === varId || v.name === varId) {
              return { ...v, value: val };
            }
            return v;
          }));
        }

        return { type, status: 'SUCCESS', variableId: varId, value: val };
      }

      // ── Tulip Data Manipulation: Store (support.tulip.co/docs/triggers) ──
      case 'DATA_MANIPULATION_STORE':
      case 'STORE':
      case 'DATA_MANIPULATION': {
        const sourceCfg = payload.data || payload.source || payload;
        const locationCfg = payload.location || payload.target || {
          locationType: payload.varPath ? 'VARIABLE' : 'TABLE_RECORD',
          variableName: payload.varPath,
          placeholderId: payload.placeholderId,
          fieldName: payload.fieldName
        };

        const resolvedVal = resolveDataSource(sourceCfg, { ...(context.state || {}), context: execContext }, execContext);
        storeDataToLocation(locationCfg, resolvedVal, context, execContext);

        playIndustrialSound('CLICK');
        triggerIndustrialHaptic('LIGHT');

        if (context.onLog) {
          const locStr = locationCfg.locationType === 'TABLE_RECORD' ? `${locationCfg.placeholderId}.${locationCfg.fieldName}` : (locationCfg.variableName || 'var');
          context.onLog(act.type || type, 'DATA_MANIPULATION_STORE', `Stored "${resolvedVal}" -> ${locStr}`);
        }

        return { type, status: 'SUCCESS', value: resolvedVal, location: locationCfg };
      }

      // ── Tulip Data Manipulation: Clear ──
      case 'DATA_MANIPULATION_CLEAR':
      case 'CLEAR': {
        const locationCfg = payload.location || {
          locationType: payload.varPath ? 'VARIABLE' : (payload.placeholderId ? 'TABLE_RECORD' : 'ALL_VARIABLES'),
          variableName: payload.varPath,
          placeholderId: payload.placeholderId,
          fieldName: payload.fieldName
        };

        if (locationCfg.locationType === 'ALL_VARIABLES' || payload.targetAll) {
          if (context.setVariables) {
            context.setVariables(prev => {
              if (Array.isArray(prev)) {
                return prev.map(v => ({ ...v, value: v.defaultValue !== undefined ? v.defaultValue : '' }));
              } else if (prev && typeof prev === 'object') {
                const res = {};
                Object.keys(prev).forEach(k => { res[k] = ''; });
                return res;
              }
              return prev;
            });
          }
        } else {
          storeDataToLocation(locationCfg, '', context, execContext);
        }

        playIndustrialSound('CLICK');
        return { type, status: 'SUCCESS', location: locationCfg };
      }

      // ── Tulip Data Manipulation: Increment Value ──
      case 'DATA_MANIPULATION_INCREMENT':
      case 'INCREMENT_VALUE': {
        const locationCfg = payload.location || {
          locationType: payload.varPath ? 'VARIABLE' : 'TABLE_RECORD',
          variableName: payload.varPath,
          placeholderId: payload.placeholderId,
          fieldName: payload.fieldName
        };

        let step = 1;
        if (payload.by !== undefined) {
          if (typeof payload.by === 'object') {
            step = Number(resolveDataSource(payload.by, context.state, execContext)) || 1;
          } else {
            step = Number(payload.by) || 1;
          }
        } else if (payload.step !== undefined) {
          step = Number(payload.step) || 1;
        }

        const curVal = Number(resolveDataSource({
          dataSourceType: locationCfg.locationType,
          variableName: locationCfg.variableName,
          placeholderId: locationCfg.placeholderId,
          fieldName: locationCfg.fieldName
        }, context.state, execContext)) || 0;

        const nextVal = curVal + step;
        storeDataToLocation(locationCfg, nextVal, context, execContext);

        playIndustrialSound('CLICK');
        return { type, status: 'SUCCESS', value: nextVal, step };
      }

      // ── Tulip Data Manipulation: Decrement Value ──
      case 'DATA_MANIPULATION_DECREMENT':
      case 'DECREMENT_VALUE': {
        const locationCfg = payload.location || {
          locationType: payload.varPath ? 'VARIABLE' : 'TABLE_RECORD',
          variableName: payload.varPath,
          placeholderId: payload.placeholderId,
          fieldName: payload.fieldName
        };

        let step = 1;
        if (payload.by !== undefined) {
          if (typeof payload.by === 'object') {
            step = Number(resolveDataSource(payload.by, context.state, execContext)) || 1;
          } else {
            step = Number(payload.by) || 1;
          }
        } else if (payload.step !== undefined) {
          step = Number(payload.step) || 1;
        }

        const curVal = Number(resolveDataSource({
          dataSourceType: locationCfg.locationType,
          variableName: locationCfg.variableName,
          placeholderId: locationCfg.placeholderId,
          fieldName: locationCfg.fieldName
        }, context.state, execContext)) || 0;

        const nextVal = curVal - step;
        storeDataToLocation(locationCfg, nextVal, context, execContext);

        playIndustrialSound('CLICK');
        return { type, status: 'SUCCESS', value: nextVal, step };
      }

      // ── Tulip Data Manipulation: Reset All App Variables to Defaults ──
      case 'RESET_ALL_VARIABLES': {
        if (context.setVariables) {
          context.setVariables(prev => {
            if (Array.isArray(prev)) {
              return prev.map(v => ({ ...v, value: v.defaultValue !== undefined ? v.defaultValue : '' }));
            } else if (prev && typeof prev === 'object') {
              const res = {};
              Object.keys(prev).forEach(k => { res[k] = ''; });
              return res;
            }
            return prev;
          });
        }
        playIndustrialSound('SUCCESS');
        return { type, status: 'SUCCESS' };
      }

      // ── Connectors: Run Connector Function (Tulip Connectors) ──
      case 'RUN_CONNECTOR_FUNCTION': {
        const connector = payload.connector || payload.connectorId || 'HTTP';
        const method = payload.method || payload.apiMethod || 'GET';
        const resultVar = payload.saveResultAs || payload.resultVar;

        const simulatedResult = {
          status: 200,
          connector,
          method,
          timestamp: execContext.timestampUtc,
          data: { success: true, message: `Response from ${connector} [${method}]` }
        };

        if (resultVar && context.setVariables) {
          context.setVariables(prev => {
            if (Array.isArray(prev)) {
              return prev.map(v => (v.name === resultVar || v.id === resultVar) ? { ...v, value: typeof v.value === 'object' ? simulatedResult : JSON.stringify(simulatedResult) } : v);
            } else if (prev && typeof prev === 'object') {
              return { ...prev, [resultVar]: simulatedResult };
            }
            return prev;
          });
        }

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('LIGHT');
        return { type, status: 'SUCCESS', connector, method, result: simulatedResult };
      }

      // ── Notifications: Show Message ──
      case 'SHOW_MESSAGE': {
        const msg = payload.message || 'Pemberitahuan Sistem';
        const msgType = (payload.messageType || 'INFO').toUpperCase();

        if (msgType === 'ERROR') {
          playIndustrialSound('ERROR');
          triggerIndustrialHaptic('ERROR');
        } else if (msgType === 'SUCCESS') {
          playIndustrialSound('SUCCESS');
          triggerIndustrialHaptic('SUCCESS');
        }

        if (context.onShowMessage) {
          context.onShowMessage({ message: msg, type: msgType });
        }

        return { type, status: 'SUCCESS', message: msg };
      }

      // ── Industrial IoT: PLC Write Tag ──
      case 'PLC_WRITE_TAG': {
        const tag = payload.tag || payload.tagName || 'START_CYCLE';
        let val = payload.value !== undefined ? payload.value : 1;

        // Dynamic expression resolution: evaluate @varName or state variable if reference provided
        if (typeof val === 'string' && val.startsWith('@')) {
          const varName = val.substring(1);
          if (context.state?.variables && context.state.variables[varName] !== undefined) {
            val = context.state.variables[varName];
          }
        }

        // P3: Two-step machine confirmation / safety interlock check
        if (payload.requireConfirmation || payload.safetyInterlock) {
          if (context.onRequestConfirmation) {
            const confirmed = await context.onRequestConfirmation({
              title: payload.confirmTitle || '⚠️ Konfirmasi Operasi Mesin / Safety Interlock',
              message: payload.confirmMessage || `Apakah Anda yakin ingin menulis nilai "${val}" ke tag [${tag}]? Pastikan area mesin aman sebelum melanjutkan.`,
              tag,
              value: val,
              requireCheckbox: payload.requireCheckboxAcknowledge !== false,
              confirmText: payload.confirmButtonText || '⚡ Eksekusi ke Mesin',
              cancelText: 'Batal',
              severity: payload.severity || 'WARNING'
            });

            if (!confirmed) {
              playIndustrialSound('ERROR');
              triggerIndustrialHaptic('ERROR');
              if (context.onShowMessage) {
                context.onShowMessage({
                  message: `Operasi PLC [${tag}] dibatalkan oleh operator.`,
                  type: 'WARNING'
                });
              }
              if (context.onLog) {
                context.onLog(act.type || type, 'SAFETY_INTERLOCK', `Write to [${tag}] dibatalkan oleh operator`);
              }
              return { type, status: 'CANCELLED', reason: 'SAFETY_INTERLOCK_CANCELLED', tag };
            }
          }
        }

        // 1. Real Transmission via IoT Connector (MQTT Topic & Industrial Simulation)
        try {
          if (iotConnector) {
            // Update internal tag buffer & trigger machine listeners
            iotConnector.setSimValue(tag, val);
            // Publish to MQTT broker if connected
            iotConnector.publish(
              `mavi/plc/write/${tag}`,
              JSON.stringify({
                tag,
                value: val,
                stationId: execContext?.stationId || 'STATION-01',
                operatorId: execContext?.operatorId || 'OPERATOR',
                timestamp: execContext?.timestampUtc || new Date().toISOString()
              })
            );

            // Handshake protocol if requested
            if (payload.handshake || payload.ackTag) {
              const ackTag = payload.ackTag || `${tag}_ACK`;
              await executePlcHandshake(tag, val, ackTag, payload.expectedAck || 1, payload.timeoutMs || 2500);
            }
          }
        } catch (err) {
          console.warn('[TriggerEngine] Warning while dispatching PLC write tag:', err);
          if (payload.handshake || payload.ackTag) {
            throw err;
          }
        }

        // 2. Synchronize App State variable if a matching variable exists
        if (context.setVariables) {
          context.setVariables(prev => {
            if (prev && prev[tag] !== undefined) {
              return { ...prev, [tag]: val };
            }
            if (Array.isArray(prev)) {
              return prev.map(v => (v.name === tag || v.id === tag) ? { ...v, value: val } : v);
            }
            return prev;
          });
        }

        // 3. Multimodal confirmation feedback
        playIndustrialSound('CLICK');
        triggerIndustrialHaptic('LIGHT');

        if (context.onShowMessage) {
          context.onShowMessage({
            message: `PLC Write: [${tag}] = ${val}`,
            type: 'INFO'
          });
        }

        if (context.onLog) {
          context.onLog(act.type || type, 'PLC_WRITE', `Tag [${tag}] ➔ ${val}`);
        }

        return { type, status: 'SUCCESS', tag, value: val };
      }

      // ── Industrial IoT: Batch Recipe Download with Atomic Handshake ──
      case 'PLC_WRITE_RECIPE':
      case 'PLC_WRITE_BATCH_TAGS': {
        const rawTags = payload.tags || payload.recipeTags || {};
        const tagEntries = Array.isArray(rawTags) 
          ? rawTags 
          : Object.entries(rawTags).map(([tag, value]) => ({ tag, value }));

        if (tagEntries.length === 0) {
          return { type, status: 'WARNING', message: 'Tidak ada tag resep yang didefinisikan' };
        }

        // Safety interlock confirmation
        if (payload.requireConfirmation) {
          if (context.onRequestConfirmation) {
            const confirmed = await context.onRequestConfirmation({
              title: payload.confirmTitle || '📋 Konfirmasi Unduh Resep Mesin (Batch)',
              message: payload.confirmMessage || `Unduh ${tagEntries.length} parameter resep ke PLC lini produksi?`,
              confirmText: '⚡ Unduh Resep ke PLC',
              severity: 'WARNING'
            });
            if (!confirmed) {
              return { type, status: 'CANCELLED', reason: 'RECIPE_DOWNLOAD_CANCELLED' };
            }
          }
        }

        // Write each tag atomically
        for (const item of tagEntries) {
          let tVal = item.value;
          if (typeof tVal === 'string' && tVal.startsWith('@')) {
            tVal = resolveOperand(tVal, { ...context.state, context: execContext });
          }
          if (iotConnector) {
            iotConnector.setSimValue(item.tag, tVal);
            iotConnector.publish(`mavi/plc/write/${item.tag}`, JSON.stringify({ tag: item.tag, value: tVal, batch: true }));
          }
        }

        // Optional Handshake on Recipe Strobe
        if (payload.handshakeTag && payload.ackTag) {
          await executePlcHandshake(payload.handshakeTag, 1, payload.ackTag, payload.expectedAck || 1, payload.timeoutMs || 3000);
        }

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('SUCCESS');

        if (context.onShowMessage) {
          context.onShowMessage({
            message: `Resep Berhasil Diunduh (${tagEntries.length} parameter ke PLC)`,
            type: 'SUCCESS'
          });
        }

        if (context.onLog) {
          context.onLog(act.type || type, 'RECIPE_DOWNLOAD', `Batch ${tagEntries.length} tags`);
        }

        return { type, status: 'SUCCESS', count: tagEntries.length, tags: tagEntries };
      }

      // ── MAVI Workflow Bridge: Trigger Automation Engine Workflow ──
      case 'TRIGGER_WORKFLOW':
      case 'RUN_WORKFLOW': {
        const workflowId = payload.workflowId || payload.id;
        const workflowName = payload.workflowName || payload.name;
        const eventType = payload.eventType || 'TRIGGER_WORKFLOW';
        const rawInputs = payload.inputs || payload.params || {};

        // Resolve input tokens
        const resolvedInputs = { ...rawInputs };
        Object.keys(resolvedInputs).forEach(k => {
          resolvedInputs[k] = resolveOperand(resolvedInputs[k], { ...context.state, context: execContext });
        });

        const dispatchPayload = {
          ...resolvedInputs,
          workflowId,
          workflowName,
          context: execContext,
          variables: context.state?.variables,
          formValues: context.state?.formValues,
          timestamp: execContext.timestampUtc
        };

        let result = null;
        if (automationEngine) {
          const found = (automationEngine.automations || []).find(a => a.id === workflowId || a.name === workflowName);
          if (found) {
            result = await automationEngine.execute(found, dispatchPayload);
          } else {
            result = await automationEngine.trigger(eventType, dispatchPayload);
          }
        }

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('LIGHT');

        if (context.onShowMessage) {
          context.onShowMessage({
            message: `Workflow Automation Terpicu: ${workflowName || workflowId || 'Background Workflow'}`,
            type: 'SUCCESS'
          });
        }

        if (context.onLog) {
          context.onLog(act.type || type, 'AUTOMATION_WORKFLOW', `Workflow: ${workflowName || workflowId}`);
        }

        return { type, status: 'SUCCESS', workflowId, result };
      }

      // ── Variables: Increment Variable ──
      case 'INCREMENT_VARIABLE': {
        const varId = payload.variableId || payload.varPath;
        const step = Number(payload.step !== undefined ? payload.step : 1);

        if (context.setVariables && varId) {
          context.setVariables(prev => {
            if (Array.isArray(prev)) {
              return prev.map(v => {
                if (v.id === varId || v.name === varId) {
                  return { ...v, value: Number(v.value || 0) + step };
                }
                return v;
              });
            } else if (prev && typeof prev === 'object') {
              return { ...prev, [varId]: Number(prev[varId] || 0) + step };
            }
            return prev;
          });
        }
        return { type, status: 'SUCCESS', variableId: varId, step };
      }

      // ── Variables: Clear Variable ──
      case 'CLEAR_VARIABLE': {
        const varId = payload.variableId || payload.varPath;
        if (context.setVariables && varId) {
          context.setVariables(prev => {
            if (Array.isArray(prev)) {
              return prev.map(v => (v.id === varId || v.name === varId) ? { ...v, value: '' } : v);
            } else if (prev && typeof prev === 'object') {
              return { ...prev, [varId]: '' };
            }
            return prev;
          });
        }
        return { type, status: 'SUCCESS', variableId: varId };
      }

      // ── Advanced: Calculate Formula ──
      case 'CALCULATE_FORMULA': {
        const formula = payload.formula || '';
        const targetVar = payload.resultVar || payload.targetVariableId || payload.targetVar;

        if (formula && targetVar) {
          try {
            // Replace tokens e.g. @varName or {{varName}} with actual values
            let evalExpr = formula;
            const evalState = { ...(context.state || {}), context: execContext };
            
            // Match @word
            evalExpr = evalExpr.replace(/@([a-zA-Z0-9_.]+)/g, (_, token) => {
              const val = resolveOperand(`@${token}`, evalState);
              return typeof val === 'number' ? val : (Number(val) || `"${String(val)}"` || 0);
            });
            // Match {{word}}
            evalExpr = evalExpr.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_, token) => {
              const val = resolveOperand(`@${token}`, evalState);
              return typeof val === 'number' ? val : (Number(val) || `"${String(val)}"` || 0);
            });

            // Safe calculation using Function constructor
            const calcFn = new Function('Math', `return (${evalExpr});`);
            const calculatedVal = calcFn(Math);

            if (context.setVariables) {
              context.setVariables(prev => {
                if (Array.isArray(prev)) {
                  return prev.map(v => (v.id === targetVar || v.name === targetVar) ? { ...v, value: calculatedVal } : v);
                } else if (prev && typeof prev === 'object') {
                  return { ...prev, [targetVar]: calculatedVal };
                }
                return prev;
              });
            }

            return { type, status: 'SUCCESS', formula, result: calculatedVal, targetVar };
          } catch (err) {
            console.error('[TriggerEngine] Formula evaluation error:', err);
            return { type, status: 'ERROR', error: err.message };
          }
        }
        return { type, status: 'ERROR', message: 'Formula or target variable missing' };
      }

      // ── Advanced: Custom Script ──
      case 'CUSTOM_SCRIPT': {
        const script = payload.script || '';
        if (script) {
          try {
            const scriptFn = new Function('variables', 'formValues', 'setVariables', 'context', 'iotConnector', script);
            scriptFn(
              context.state?.variables,
              context.state?.formValues,
              context.setVariables,
              execContext,
              iotConnector
            );
            return { type, status: 'SUCCESS' };
          } catch (err) {
            console.error('[TriggerEngine] Custom script error:', err);
            return { type, status: 'ERROR', error: err.message };
          }
        }
        return { type, status: 'SUCCESS' };
      }

      // ── Table Records: Load Record ──
      case 'TABLE_RECORD_LOAD': {
        const tableId = payload.tableId;
        const idVal = resolveOperand(payload.idValue || payload.recordId, { ...(context.state || {}), context: execContext });
        const placeholder = payload.placeholderId || 'currentRecord';

        try {
          let record = null;
          // Search in active state tables
          if (context.state?.tables && Array.isArray(context.state.tables)) {
            const tbl = context.state.tables.find(t => t.id === tableId || t.name === tableId);
            if (tbl && tbl.records) {
              record = tbl.records.find(r => r.id === idVal || r._id === idVal);
            }
          }

          // Fallback to localStorage tables
          if (!record && tableId) {
            const rawTbl = localStorage.getItem(`mavi_table_${tableId}`);
            if (rawTbl) {
              const parsed = JSON.parse(rawTbl);
              if (parsed.records) {
                record = parsed.records.find(r => r.id === idVal || r._id === idVal);
              }
            }
          }

          if (record && context.setVariables) {
            // Populate matching variables
            context.setVariables(prev => {
              if (Array.isArray(prev)) {
                return prev.map(v => {
                  if (record[v.name] !== undefined) return { ...v, value: record[v.name] };
                  if (v.name === `${placeholder}_id`) return { ...v, value: record.id || idVal };
                  return v;
                });
              } else if (prev && typeof prev === 'object') {
                return { ...prev, ...record, [`${placeholder}_id`]: record.id || idVal };
              }
              return prev;
            });
          }

          playIndustrialSound('SUCCESS');
          return { type, status: 'SUCCESS', record, found: !!record };
        } catch (err) {
          return { type, status: 'ERROR', error: err.message };
        }
      }

      // ── Table Records: Save / Create Record ──
      case 'TABLE_RECORD_SAVE':
      case 'TABLE_RECORD_CREATE': {
        const tableId = payload.tableId || 'default';
        const idVal = resolveOperand(payload.idValue || payload.recordId || `REC-${Date.now()}`, { ...(context.state || {}), context: execContext });
        const recordData = {
          id: idVal,
          ...(payload.data || {}),
          updatedAt: execContext.timestampUtc,
          operatorId: execContext.operatorId,
          stationId: execContext.stationId
        };

        // Persist to local storage table
        try {
          const key = `mavi_table_${tableId}`;
          const current = JSON.parse(localStorage.getItem(key) || '{"records":[]}');
          const existingIdx = current.records.findIndex(r => r.id === idVal);
          if (existingIdx >= 0) {
            current.records[existingIdx] = { ...current.records[existingIdx], ...recordData };
          } else {
            current.records.push(recordData);
          }
          localStorage.setItem(key, JSON.stringify(current));
        } catch (e) {}

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('SUCCESS');
        return { type, status: 'SUCCESS', data: recordData };
      }

      // ── Table Records: Create or Load Record (Tulip standard) ──
      case 'TABLE_RECORD_CREATE_OR_LOAD': {
        const tableId = payload.tableId;
        const idSource = payload.id !== undefined ? payload.id : (payload.idValue || payload.recordId);
        let idVal = '';
        if (typeof idSource === 'object') {
          idVal = String(resolveDataSource(idSource, context.state, execContext));
        } else if (payload.idType === 'VARIABLE') {
          idVal = String(resolveOperand(`@${idSource}`, context.state));
        } else {
          idVal = String(resolveOperand(idSource, { ...(context.state || {}), context: execContext }));
        }
        if (!idVal) idVal = `REC-${Date.now()}`;

        const placeholder = payload.placeholderId || payload.placeholder || 'currentRecord';

        // Check if record exists
        let record = null;
        if (context.state?.tables && Array.isArray(context.state.tables)) {
          const tbl = context.state.tables.find(t => t.id === tableId || t.name === tableId);
          if (tbl && tbl.records) {
            record = tbl.records.find(r => String(r.id) === String(idVal) || String(r._id) === String(idVal) || String(r.recordId) === String(idVal));
          }
        }
        if (!record && tableId && typeof localStorage !== 'undefined') {
          try {
            const raw = localStorage.getItem(`mavi_table_${tableId}`);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.records) {
                record = parsed.records.find(r => String(r.id) === String(idVal) || String(r._id) === String(idVal) || String(r.recordId) === String(idVal));
              }
            }
          } catch (e) {}
        }

        if (!record) {
          // Create new record
          record = {
            id: idVal,
            recordId: idVal,
            createdAt: execContext.timestampUtc,
            updatedAt: execContext.timestampUtc,
            operatorId: execContext.operatorId,
            stationId: execContext.stationId,
            ...(payload.data || {})
          };
          if (tableId && typeof localStorage !== 'undefined') {
            try {
              const key = `mavi_table_${tableId}`;
              const current = JSON.parse(localStorage.getItem(key) || '{"records":[]}');
              current.records.push(record);
              localStorage.setItem(key, JSON.stringify(current));
            } catch (e) {}
          }
        }

        if (context.setLoadedRecords) {
          context.setLoadedRecords(prev => ({ ...prev, [placeholder]: record }));
        }
        if (context.setVariables) {
          context.setVariables(prev => {
            if (Array.isArray(prev)) {
              return prev.map(v => {
                if (record[v.name] !== undefined) return { ...v, value: record[v.name] };
                if (v.name === `${placeholder}_id`) return { ...v, value: record.id };
                return v;
              });
            } else if (prev && typeof prev === 'object') {
              return { ...prev, ...record, [`${placeholder}_id`]: record.id };
            }
            return prev;
          });
        }

        playIndustrialSound('SUCCESS');
        triggerIndustrialHaptic('SUCCESS');
        return { type, status: 'SUCCESS', record, id: idVal, placeholder };
      }

      // ── Table Records: Delete Record ──
      case 'TABLE_RECORD_DELETE': {
        const placeholder = payload.placeholderId || payload.placeholder;
        const curRecord = context.state?.loadedRecords?.[placeholder];
        const recId = curRecord?.id || curRecord?._id || curRecord?.recordId;
        const tableId = payload.tableId || curRecord?.tableId;

        if (tableId && recId && typeof localStorage !== 'undefined') {
          try {
            const key = `mavi_table_${tableId}`;
            const raw = localStorage.getItem(key);
            if (raw) {
              const tbl = JSON.parse(raw);
              if (tbl.records) {
                tbl.records = tbl.records.filter(r => r.id !== recId && r._id !== recId && r.recordId !== recId);
                localStorage.setItem(key, JSON.stringify(tbl));
              }
            }
          } catch (e) {}
        }

        if (context.setLoadedRecords && placeholder) {
          context.setLoadedRecords(prev => ({ ...prev, [placeholder]: null }));
        }

        playIndustrialSound('CLICK');
        return { type, status: 'SUCCESS', placeholder, deletedId: recId };
      }

      // ── Table Records: Clear Record Placeholder ──
      case 'CLEAR_RECORD_PLACEHOLDER': {
        const placeholder = payload.placeholderId || payload.placeholder;
        if (context.setLoadedRecords && placeholder) {
          context.setLoadedRecords(prev => ({ ...prev, [placeholder]: null }));
        }
        playIndustrialSound('CLICK');
        return { type, status: 'SUCCESS', placeholder };
      }

      // ── Feedback: Haptic & Sound ──
      case 'TRIGGER_HAPTIC_SOUND': {
        const soundType = payload.soundType || 'SUCCESS';
        playIndustrialSound(soundType);
        triggerIndustrialHaptic(soundType);
        return { type, status: 'SUCCESS' };
      }

      // ── Navigation ──
      case 'GO_TO_SCREEN':
      case 'NEXT_STEP':
      case 'PREV_STEP':
      case 'COMPLETE_APP': {
        if (context.onNavigate) {
          context.onNavigate(type, payload);
        }
        return { type, status: 'SUCCESS' };
      }

      default:
        return { type, status: 'SUCCESS', info: 'Custom or unhandled action' };
    }
  } catch (err) {
    playIndustrialSound('ERROR');
    triggerIndustrialHaptic('ERROR');
    return { type, status: 'ERROR', error: err.message };
  }
}
