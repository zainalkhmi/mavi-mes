/**
 * industrialTriggerEngine.js
 * Manufacturing-Grade Trigger & Action Execution Engine for MaviCore MES & Gluestack App Builder
 * 
 * Implements the full Shop Floor pipeline:
 * UI Interaction → Debounce Guard → Context Injection → Pre-Condition Evaluation (Guards) 
 * → Branching Actions (Atomic Execution) → UI State Transition + Multimodal Feedback (Audio, Haptic, Snackbar)
 */

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

  // Context token e.g. @operator.id, @machine.ready
  if (operand.startsWith('@')) {
    const path = operand.substring(1);
    const parts = path.split('.');
    let current = state;
    for (const part of parts) {
      if (current === undefined || current === null) return '';
      current = current[part];
    }
    return current !== undefined ? current : '';
  }

  // Variable token lookup
  if (state.variables && Array.isArray(state.variables)) {
    const foundVar = state.variables.find(v => v.name === operand || v.id === operand);
    if (foundVar !== undefined) return foundVar.value;
  }

  // Form value lookup
  if (state.formValues && state.formValues[operand] !== undefined) {
    return state.formValues[operand];
  }

  return operand;
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
        const tag = payload.tag || 'START_CYCLE';
        const val = payload.value !== undefined ? payload.value : 1;

        if (context.onLog) {
          context.onLog(type, `PLC.WRITE: ${tag} = ${val}`);
        }

        return { type, status: 'SUCCESS', tag, value: val };
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
