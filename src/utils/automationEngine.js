import { addTableRecord, updateTableRecord } from './database';
import obd2Service from './obd2Service';

/**
 * Automation Engine
 * Handles background event-driven workflows.
 */
class AutomationEngine {
  constructor() {
    this.automations = this.loadAutomations();
    this.isInitialized = false;
    this.activeRuns = 0;
    this.MAX_CONCURRENT_RUNS = 10;
    this.EXECUTION_TIMEOUT_MS = 60000; // 1 minute
    this.MAX_LOOP_ITERATIONS = 500;
    this.MAX_RECURSION_DEPTH = 25;
    this.lastExecutions = {}; // { triggerId_autoId: timestamp }
    this.listeners = [];
    this.SYSTEM_VARIABLES = {
      SYS_USER: 'Operator-01',
      SYS_STATION: 'Station-A',
      SYS_ENV: 'PROD',
      SYS_SHIFT: 'Morning'
    };
    this.startTimer();
  }

  addListener(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  startTimer() {
    console.log('[AutomationEngine] Starting background timer polling (1s interval)');
    // Check every second to support low-interval triggers
    this.timerInterval = setInterval(() => {
      this.checkScheduledAutomations();
    }, 1000);
  }

  refresh() {
    console.log('[AutomationEngine] Refreshing automations from storage...');
    this.automations = this.loadAutomations();
  }

  checkScheduledAutomations() {
    const now = new Date();
    const timestamp = now.getTime();

    this.automations.forEach(auto => {
      if (!auto.active && auto.type !== 'function') return;

      const triggerList = auto.triggers || (auto.trigger ? [auto.trigger] : []);
      
      triggerList.forEach(trigger => {
        if (trigger.type !== 'TIMER') return;

        let shouldRun = false;
        const execKey = `${trigger.id}_${auto.id}`;
        const lastRun = this.lastExecutions[execKey] || 0;

        // 1. Check for Interval-based triggers (New format)
        if (trigger.config && trigger.config.interval) {
          let intervalMs = trigger.config.interval * 1000;
          if (trigger.config.unit === 'minutes') intervalMs *= 60;
          if (trigger.config.unit === 'hours') intervalMs *= 3600;

          if (timestamp - lastRun >= intervalMs) {
            shouldRun = true;
          }
        } 
        // 2. Check for Schedule-based triggers (Legacy format)
        else if (trigger.schedule) {
          const { frequency, time } = trigger.schedule;
          const [schedHour, schedMinute] = (time || "00:00").split(':').map(Number);
          const currentHour = now.getHours();
          const currentMinute = now.getMinutes();

          if (frequency === 'HOURLY') {
            if (currentMinute === schedMinute && (timestamp - lastRun > 60000)) shouldRun = true;
          } else if (frequency === 'DAILY') {
            if (currentHour === schedHour && currentMinute === schedMinute && (timestamp - lastRun > 60000)) shouldRun = true;
          }
        }

        if (shouldRun) {
          console.log(`[AutomationEngine] Running triggered automation: ${auto.name} via ${trigger.type}`);
          this.lastExecutions[execKey] = timestamp;
          this.execute(auto, { timestamp: now.toISOString(), source: 'TIMER', triggerId: trigger.id });
        }
      });
    });
  }

  loadAutomations() {
    try {
      const savedAutos = localStorage.getItem('mes_automations');
      const savedFunctions = localStorage.getItem('mes_functions');
      
      const autos = savedAutos ? JSON.parse(savedAutos) : [];
      const fns = savedFunctions ? JSON.parse(savedFunctions) : [];
      
      // Map functions to common automation format
      const mappedFns = fns.map(f => ({
        ...f,
        type: 'function',
        active: true // Always treat functions as active for trigger matching
      }));

      const legacyAutos = autos.map(auto => {
        if (auto.published) return { ...auto.published, type: 'legacy' };
        if (auto.nodes) return { ...auto, type: 'legacy' };
        return null;
      }).filter(Boolean);

      return [...legacyAutos, ...mappedFns];
    } catch (e) {
      console.error('Failed to load automations:', e);
      return [];
    }
  }

  saveAutomations(automations) {
    this.automations = automations;
    localStorage.setItem('mes_automations', JSON.stringify(automations));
  }

  // Trigger an event
  trigger(eventType, eventData) {
    console.log(`[AutomationEngine] Triggering event: ${eventType}`, eventData);
    
    // Notify external listeners (e.g. AppBuilder Blockly runtime)
    this.listeners.forEach(listener => {
      try {
        listener(eventType, eventData);
      } catch (err) {
        console.error('[AutomationEngine] Listener error:', err);
      }
    });

    const relevantAutomations = this.automations.filter(auto => {
      if (!auto.active && auto.type !== 'function') return false; // Functions are active if they exist
      
      const triggerList = auto.triggers || (auto.trigger ? [auto.trigger] : []);
      
      const hasMatchingTrigger = triggerList.some(t => {
        if (t.type !== eventType) return false;

        // Webhook check
        if (eventType === 'WEBHOOK' && eventData.id === t.id) return true;

        // Machine/Device check
        if (eventType === 'MACHINE_TRIGGER' || eventType === 'DEVICE') {
          const config = t.config || t;
          if (config.topic && eventData.topic !== config.topic) return false;
          if (config.pid && eventData.pid !== config.pid) return false;
          if (config.condition) {
            return this.evaluateCondition(config.condition, eventData);
          }
          return true;
        }

        // Relational check
        if (eventType === 'ON_RECORD_LINK' || eventType === 'ON_RECORD_UNLINK') {
          const config = t.config || t;
          if (config.sourceTableId && eventData.sourceTableId !== config.sourceTableId) return false;
          if (config.targetTableId && eventData.targetTableId !== config.targetTableId) return false;
          return true;
        }

        // Table Record check
        if (eventType === 'TABLE_ROW_ADDED' || eventType === 'TABLE_ROW_UPDATED') {
          const config = t.config || t;
          if (config.tableId && eventData.tableId !== config.tableId) return false;
          // Support for filtering by record field values (e.g. stock < 10)
          if (config.condition) {
            // Merge event data with record data so condition can access both
            const conditionContext = { ...eventData, ...(eventData.record || {}) };
            return this.evaluateCondition(config.condition, conditionContext);
          }
          return true;
        }

        return true;
      });

      return hasMatchingTrigger;
    });

    relevantAutomations.forEach(auto => {
      const depth = (eventData?._depth || 0) + 1;
      if (depth > this.MAX_RECURSION_DEPTH) {
        console.warn(`[AutomationEngine] Recursion limit reached for ${auto.name}. Depth: ${depth}`);
        this.logToDatabase(`Recursion limit reached: ${auto.name} stopped. (Depth: ${depth})`);
        return;
      }
      this.execute(auto, { ...eventData, _depth: depth }).catch(err => {
        console.error(`[AutomationEngine] Error executing ${auto.name}:`, err);
      });
    });
  }

  async execute(automation, eventData) {
    const runId = `run_${Date.now()}`;
    const startTime = Date.now();
    
    this.activeRuns++;
    console.log(`[AutomationEngine] Executing automation: ${automation.name} (Active: ${this.activeRuns})`);
    
    let status = 'SUCCESS';
    let errorMessage = null;
    let result = null;

    try {
      // Use Promise.race to enforce timeout
      result = await Promise.race([
        this.runLogic(automation, eventData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Execution Timeout')), this.EXECUTION_TIMEOUT_MS)
        )
      ]);
    } catch (err) {
      status = 'FAILED';
      errorMessage = err.message;
      console.error(`[AutomationEngine] Execution error in ${automation.name}:`, err.message);
      this.logToDatabase(`Error in ${automation.name}: ${err.message}`);
    } finally {
      this.activeRuns--;
      const duration = Date.now() - startTime;
      
      // Save to Execution History
      this.saveExecutionLog({
        id: runId,
        automationId: automation.id,
        automationName: automation.name,
        timestamp: new Date().toISOString(),
        duration,
        status,
        errorMessage,
        trigger: eventData.source || 'MANUAL',
        inputs: eventData
      });

      console.log(`[AutomationEngine] Finished: ${automation.name} (Active: ${this.activeRuns})`);
    }
  }

  saveExecutionLog(log) {
    try {
      const history = JSON.parse(localStorage.getItem('mes_execution_history') || '[]');
      history.unshift(log); // Add to beginning
      // Keep only last 100 logs
      localStorage.setItem('mes_execution_history', JSON.stringify(history.slice(0, 100)));
    } catch (e) {
      console.error('Failed to save execution log:', e);
    }
  }

  async runLogic(automation, eventData) {
    // Support for graph-based execution (ReactFlow structure)
    if (automation.nodes && automation.edges) {
      return this.executeGraph(automation, eventData);
    }

    if (automation.actions) {
      for (const action of automation.actions) {
        await this.runAction(action, eventData);
      }
    }
  }

  logToDatabase(message) {
    addTableRecord('SystemLogs', { 
      message, 
      timestamp: new Date().toISOString(),
      source: 'AutomationEngine'
    }).catch(e => console.error('Failed to log to DB:', e));
  }

  async executeGraph(automation, eventData) {
    // Find the start/event node
    const startNode = automation.nodes.find(n => n.type === 'event' || n.type === 'functionCall' || n.id === 'start');
    if (!startNode) return;

    let currentNode = this.getNextNode(automation, startNode.id);
    
    while (currentNode) {
      console.log(`[AutomationEngine] Executing node: ${currentNode.id} (${currentNode.type})`);
      
      if (currentNode.type === 'action') {
        try {
          const result = await this.runAction(currentNode.data, eventData);
          currentNode = this.getNextNode(automation, currentNode.id, 'success');
        } catch (err) {
          console.error(`[AutomationEngine] Action failed:`, err);
          currentNode = this.getNextNode(automation, currentNode.id, 'error');
          if (!currentNode) break; // Stop if no error path defined
        }
      } else if (currentNode.type === 'expression') {
        try {
          const result = this.evaluateExpression(currentNode.data.expression, eventData);
          if (currentNode.data.outputVar) {
             eventData[currentNode.data.outputVar] = result;
          }
          console.log(`[AutomationEngine] Expression result: ${result}`);
          currentNode = this.getNextNode(automation, currentNode.id, 'success');
        } catch (err) {
          console.error(`[AutomationEngine] Expression failed:`, err);
          currentNode = this.getNextNode(automation, currentNode.id, 'error');
        }
      } else if (currentNode.type === 'decision') {
        const result = this.evaluateCondition(currentNode.data.condition, eventData);
        console.log(`[AutomationEngine] Decision result: ${result}`);
        currentNode = this.getNextNode(automation, currentNode.id, result ? 'yes' : 'no');
      } else if (currentNode.type === 'loop') {
        await this.executeLoop(automation, currentNode, eventData);
        currentNode = this.getNextNode(automation, currentNode.id, 'exit');
      } else {
        break;
      }
    }
  }

  async executeLoop(automation, loopNode, eventData) {
    const listPath = loopNode.data.listPath;
    const list = this.resolveValue(listPath, eventData) || [];
    
    if (!Array.isArray(list)) {
      console.warn(`[AutomationEngine] Loop target at ${listPath} is not an array:`, list);
      return;
    }

    console.log(`[AutomationEngine] Starting loop over ${list.length} items`);
    const iterations = Math.min(list.length, this.MAX_LOOP_ITERATIONS);
    if (list.length > this.MAX_LOOP_ITERATIONS) {
      console.warn(`[AutomationEngine] Loop truncated to ${this.MAX_LOOP_ITERATIONS} items`);
    }

    for (let i = 0; i < iterations; i++) {
      const element = list[i];
      // Create a local context for this iteration, including element and index
      const iterationContext = {
        ...eventData,
        element: element,
        index: i,
        // Also keep references consistent with Tulip docs "position"
        position: i
      };

      console.log(`[AutomationEngine] Loop iteration ${i}:`, element);

      // Execute the "body" of the loop
      let innerNode = this.getNextNode(automation, loopNode.id, 'body');
      
      // We process the body until it hits a node that doesn't exist or we hit the loop node again (implicit boundary)
      while (innerNode && innerNode.id !== loopNode.id) {
        console.log(`[AutomationEngine]   Loop execution node: ${innerNode.id} (${innerNode.type})`);
        
        if (innerNode.type === 'action') {
          try {
            await this.runAction(innerNode.data, iterationContext);
            innerNode = this.getNextNode(automation, innerNode.id, 'success');
          } catch (err) {
            console.error(`[AutomationEngine] Inner action failed:`, err);
            innerNode = this.getNextNode(automation, innerNode.id, 'error');
            if (!innerNode) break;
          }
        } else if (innerNode.type === 'decision') {
          const result = this.evaluateCondition(innerNode.data.condition, iterationContext);
          innerNode = this.getNextNode(automation, innerNode.id, result ? 'yes' : 'no');
        } else if (innerNode.type === 'loop') {
          // Nested loops supported
          await this.executeLoop(automation, innerNode, iterationContext);
          innerNode = this.getNextNode(automation, innerNode.id, 'exit');
        } else {
          break;
        }
      }
    }

    console.log(`[AutomationEngine] Loop finished`);
  }

  getNextNode(automation, nodeId, sourceHandle) {
    const edge = automation.edges.find(e => 
      e.source === nodeId && (!sourceHandle || e.sourceHandle === sourceHandle)
    );
    if (!edge) return null;
    return automation.nodes.find(n => n.id === edge.target);
  }

  evaluateCondition(condition, eventData) {
    if (!condition) return true; // Default to true if no condition

    const context = { ...this.SYSTEM_VARIABLES, ...eventData, SYS_TIME: new Date().toLocaleTimeString() };
    const { field, operator, value } = condition;
    
    // Resolve value from eventData if it's a dynamic path (e.g., "record.quantity")
    const actualValue = this.resolveValue(field, context);
    const targetValue = value;

    console.log(`[AutomationEngine] Evaluating: ${actualValue} ${operator} ${targetValue}`);

    switch (operator) {
      case '<': return Number(actualValue) < Number(targetValue);
      case '>': return Number(actualValue) > Number(targetValue);
      case '<=': return Number(actualValue) <= Number(targetValue);
      case '>=': return Number(actualValue) >= Number(targetValue);
      case '==': return String(actualValue) === String(targetValue);
      case '!=': return String(actualValue) !== String(targetValue);
      case 'contains': return String(actualValue).includes(String(targetValue));
      default: return false;
    }
  }

  evaluateExpression(expression, eventData) {
    if (!expression) return null;
    
    // Create a safe sandbox with inputs, variables, and system variables
    const context = { 
      ...this.SYSTEM_VARIABLES, 
      ...eventData, 
      SYS_TIME: new Date().toLocaleTimeString(),
      Math: Math
    };

    try {
      // Simple formula evaluator using Function constructor for basic expressions
      // NOTE: In production, use a safer library like expr-eval or mathjs
      const keys = Object.keys(context);
      const values = Object.values(context);
      const runner = new Function(...keys, `return ${expression};`);
      return runner(...values);
    } catch (err) {
      console.error('[AutomationEngine] Expression Error:', err);
      throw new Error(`Expression Error: ${err.message}`);
    }
  }

  resolveValue(path, data) {
    if (!path || !data) return null;
    return path.split('.').reduce((obj, key) => obj && obj[key], data);
  }

  async runAction(action, eventData) {
    const { tableId, table } = action; // Support both naming variants
    const targetTable = tableId || table;

    switch (action.type) {
      case 'CREATE_RECORD':
      case 'ADD_RECORD':
        console.log(`[AutomationEngine] Creating record in ${targetTable}`, action.data);
        return addTableRecord(targetTable, action.data);
      
      case 'UPDATE_RECORD':
        const recordId = this.resolveValue(action.recordIdPath, eventData) || action.recordId;
        console.log(`[AutomationEngine] Updating record ${recordId} in ${targetTable}`, action.data);
        return updateTableRecord(targetTable, recordId, action.data);

      case 'LINK_RECORD':
      case 'UNLINK_RECORD': {
        const { sourceTable, sourceRecordId: rawSourceId, sourceField, targetTable: targetTableId, targetRecordId: rawTargetId, targetField } = action;
        const sId = this.resolveValue(action.sourceRecordIdPath, eventData) || rawSourceId;
        const tId = this.resolveValue(action.targetRecordIdPath, eventData) || rawTargetId;
        
        console.log(`[AutomationEngine] ${action.type}: ${sId} <-> ${tId}`);
        
        // Import dynamically to avoid circular dependencies if any
        return import('./supabaseTablesDB').then(db => {
          if (action.type === 'LINK_RECORD') {
            return db.linkRecords(sourceTable, sId, sourceField, targetTableId, tId, targetField);
          } else {
            return db.unlinkRecords(sourceTable, sId, sourceField, targetTableId, tId, targetField);
          }
        });
      }

      case 'LOG_MESSAGE':
        console.log(`[AutomationEngine] Log: ${action.message}`);
        return addTableRecord('SystemLogs', { 
          message: action.message, 
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine'
        });

      case 'HTTP_REQUEST':
      case 'CONNECTOR_FUNCTION':
        const url = this.resolveValue(action.urlPath, eventData) || action.url;
        console.log(`[AutomationEngine] Calling HTTP Connector: ${url}`);
        return fetch(url, {
          method: action.method || 'GET',
          headers: action.headers || { 'Content-Type': 'application/json' },
          body: action.method !== 'GET' ? JSON.stringify(action.data || {}) : null
        }).then(res => res.json())
          .then(data => {
            console.log(`[AutomationEngine] Connector success:`, data);
            // After connector finishes, we could potentially trigger a follow-up
            this.trigger('CONNECTOR_TRIGGER', { url, data, status: 'success' });
            return data;
          }).catch(err => {
            console.error(`[AutomationEngine] Connector failed:`, err);
            this.trigger('CONNECTOR_TRIGGER', { url, error: err.message, status: 'error' });
            throw err;
          });

      case 'SEND_NOTIFICATION':
        const recipient = this.resolveValue(action.recipientPath, eventData) || action.recipient;
        const msg = this.resolveValue(action.messagePath, eventData) || action.message;
        console.log(`[AutomationEngine] SEND NOTIFICATION to ${recipient}: ${msg}`);
        // Mock notification: log to system table
        return addTableRecord('SystemLogs', { 
          message: `NOTIFICATION to ${recipient}: ${msg}`, 
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:Notification'
        });

      case 'AI_SUMMARIZE':
      case 'AI_EXTRACT':
      case 'AI_TRANSLATE':
        const inputText = this.resolveValue(action.inputPath, eventData) || 'No input text found.';
        console.log(`[AutomationEngine] Executing AI Action (${action.type}) on: ${inputText}`);
        
        // Simulation of AI processing
        let aiResult = "";
        await new Promise(r => setTimeout(r, 1000)); // Simulate latency

        if (action.type === 'AI_SUMMARIZE') {
          aiResult = "SUMMARY: " + (inputText.slice(0, 50) + (inputText.length > 50 ? "..." : ""));
        } else if (action.type === 'AI_TRANSLATE') {
          aiResult = `[Translated to ${action.targetLanguage || 'English'}]: ${inputText}`;
        } else if (action.type === 'AI_EXTRACT') {
          aiResult = JSON.stringify({ extracted_data: "Simulated extraction for " + inputText.slice(0, 20) });
        }

        if (action.outputPath) {
          const parts = action.outputPath.split('.');
          if (parts[0] === 'record' && eventData.record) {
             const tableId = eventData.tableId;
             const recordId = eventData.record.id;
             const updateData = { [parts[1]]: aiResult };
             await updateTableRecord(tableId, recordId, updateData);
             console.log(`[AutomationEngine] AI result saved to ${action.outputPath}`);
          }
        }
        return aiResult;

      case 'RUN_FUNCTION':
        const functions = JSON.parse(localStorage.getItem('mes_functions') || '[]');
        const targetFn = functions.find(f => f.name === action.functionName || f.id === action.functionId);
        if (targetFn) {
           console.log(`[AutomationEngine] Running function: ${targetFn.name}`);
           // Resolve input values for the function based on its contract
           const inputValues = {};
           if (action.inputs && targetFn.inputs) {
             targetFn.inputs.forEach(contractInput => {
               const value = this.resolveValue(action.inputs[contractInput.name], eventData);
               inputValues[contractInput.name] = value;
             });
           }
           return this.executeGraph(targetFn, { ...eventData, ...inputValues });
        } else {
           console.error(`[AutomationEngine] Function not found: ${action.functionName}`);
           return null;
        }

      case 'OBD2_CONNECT':
        const transport = (action.transport || 'BLUETOOTH').toUpperCase();
        console.log(`[AutomationEngine] OBD2 Connect via ${transport}`);
        return transport === 'SERIAL' 
          ? obd2Service.connectSerial(Number(action.baudRate) || 38400)
          : obd2Service.connectBluetooth();

      case 'OBD2_READ_PID':
        const pid = action.pid || '010C';
        console.log(`[AutomationEngine] OBD2 Read PID: ${pid}`);
        return obd2Service.queryPID(pid);

      case 'OBD2_CLEAR_DTC':
        console.log(`[AutomationEngine] OBD2 Clear DTC`);
        return obd2Service.clearDTC();

      default:
        console.warn(`[AutomationEngine] Unknown action type: ${action.type}`);
    }
  }
}

const engine = new AutomationEngine();
export default engine;
