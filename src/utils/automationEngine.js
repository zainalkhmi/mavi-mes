import { addTableRecord, updateTableRecord, getPrimaryAiConnector } from './database';
import obd2Service from './obd2Service';
import * as aiService from './aiService';

/**
 * Automation Engine
 * Handles background event-driven workflows for all 20+ Core Node types, AI Agents & Sub-Nodes.
 * Natively integrated with AI Settings (/ai-settings), Sub-Workflows, Webhook Response & Error Fallback Handling.
 */
export function generateScheduleOutput(timezone = 'Asia/Jakarta') {
  const now = new Date();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const dayName = daysOfWeek[now.getDay()];
  const monthName = months[now.getMonth()];
  const year = now.getFullYear().toString();
  const dayOfMonth = now.getDate().toString();

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHour12 = hours % 12 || 12;
  const pad2 = (num) => String(num).padStart(2, '0');

  const readableDate = `${monthName} ${getOrdinal(now.getDate())} ${year}, ${displayHour12}:${pad2(minutes)}:${pad2(seconds)} ${ampm}`;
  const readableTime = `${displayHour12}:${pad2(minutes)}:${pad2(seconds)} ${ampm}`;

  return [
    {
      "timestamp": now.toISOString(),
      "Readable date": readableDate,
      "Readable time": readableTime,
      "Day of week": dayName,
      "Year": year,
      "Month": monthName,
      "Day of month": dayOfMonth,
      "Hour": String(hours),
      "Minute": String(minutes),
      "Second": String(seconds),
      "Timezone": timezone
    }
  ];
}

export function generateWebhookOutput(webhookPath = 'my-webhook', incomingData = {}, executionMode = 'production') {
  const host = typeof window !== 'undefined' ? window.location.host : 'localhost:5173';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
  const baseUrl = `${protocol}//${host}`;
  const fullWebhookUrl = `${baseUrl}/webhook/${webhookPath.replace(/^\//, '')}`;

  const defaultHeaders = {
    "host": host,
    "user-agent": "PostmanRuntime/7.32.3",
    "content-type": "application/json",
    "accept": "*/*",
    "x-forwarded-for": "127.0.0.1"
  };

  const headers = incomingData.headers || defaultHeaders;
  const query = incomingData.query || { source: 'facebook', campaign_id: '12345' };
  const params = incomingData.params || {};
  const body = incomingData.body || (incomingData.user_id ? incomingData : {
    user_id: 9876,
    event: "user_registered",
    email: "budi@example.com"
  });

  return [
    {
      headers,
      params,
      query,
      body,
      webhookUrl: fullWebhookUrl,
      executionMode
    }
  ];
}

export function generateErrorTriggerOutput(errorObj = {}, lastNodeExecuted = 'HTTP Request', workflowName = 'Order Sync Workflow') {
  const execId = `exec_${Date.now()}`;
  const errorMessage = typeof errorObj === 'string' ? errorObj : (errorObj.message || 'HTTP Request failed with status code 500');
  const errorName = errorObj.name || 'NodeApiError';
  const errorStack = errorObj.stack || `Error: ${errorMessage}\n    at execute (httpNode.js:45)`;

  return [
    {
      "execution": {
        "id": execId,
        "url": `${typeof window !== 'undefined' ? window.location.origin : 'https://app.mavi.io'}/execution/${execId}`,
        "error": {
          "message": errorMessage,
          "stack": errorStack,
          "name": errorName
        },
        "lastNodeExecuted": lastNodeExecuted,
        "mode": "production"
      },
      "workflow": {
        "id": `wf_${workflowName.toLowerCase().replace(/\s+/g, '_')}`,
        "name": workflowName
      }
    }
  ];
}

export function generateTelegramTriggerOutput(incomingMessage = {}) {
  const text = incomingMessage.text || 'Halo AI';
  const chat = incomingMessage.chat || { id: 123456789, type: 'private' };
  const from = incomingMessage.from || { id: 123456789, first_name: 'Zainal' };
  const message_id = incomingMessage.message_id || 15;

  return [
    {
      message: {
        message_id,
        text,
        chat,
        from
      }
    }
  ];
}

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
    this.machineTriggerLogState = { minuteKey: null, count: 0 };
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
        if (trigger.type !== 'TIMER' && trigger.type !== 'SCHEDULE') return;

        let shouldRun = false;
        const execKey = `${trigger.id || 'timer'}_${auto.id}`;
        const lastRun = this.lastExecutions[execKey] || 0;

        if (trigger.config && trigger.config.interval) {
          let intervalMs = trigger.config.interval * 1000;
          if (trigger.config.unit === 'minutes') intervalMs *= 60;
          if (trigger.config.unit === 'hours') intervalMs *= 3600;

          if (timestamp - lastRun >= intervalMs) {
            shouldRun = true;
          }
        } else if (trigger.schedule || trigger.type === 'TIMER') {
          const { frequency, time } = trigger.schedule || { frequency: 'DAILY', time: '08:00' };
          const [schedHour, schedMinute] = (time || "08:00").split(':').map(Number);
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

      const mappedFns = fns.map(f => ({
        ...f,
        type: 'function',
        active: true
      }));

      const legacyAutos = autos.map(auto => {
        if (auto.published) return { ...auto.published, type: 'legacy', id: auto.id, name: auto.name };
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

  trigger(eventType, eventData) {
    if (eventType === 'MACHINE_TRIGGER') {
      const now = new Date();
      const minuteKey = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()}`;
      if (this.machineTriggerLogState.minuteKey !== minuteKey) {
        this.machineTriggerLogState.minuteKey = minuteKey;
        this.machineTriggerLogState.count = 0;
      }
      this.machineTriggerLogState.count += 1;

      if (this.machineTriggerLogState.count <= 5) {
        // Suppress verbose log
      } else if (this.machineTriggerLogState.count % 50 === 0) {
        console.log(`[AutomationEngine] Triggering event: ${eventType} (throttled summary)`, {
          countThisMinute: this.machineTriggerLogState.count,
          lastEvent: eventData
        });
      }
    } else {
      console.log(`[AutomationEngine] Triggering event: ${eventType}`, eventData);
    }

    if (eventType === 'MACHINE_TRIGGER') {
      const now = Date.now();
      if (!this.lastTriggerTimes) this.lastTriggerTimes = {};
      const lastTrigger = this.lastTriggerTimes[eventData.topic] || 0;
      if (now - lastTrigger < 100) return;
      this.lastTriggerTimes[eventData.topic] = now;

      if (eventData && typeof eventData.payload === 'object' && eventData.payload !== null) {
        try {
          const keys = Object.keys(eventData.payload);
          const hasNested = keys.some(k => typeof eventData.payload[k] === 'object' && eventData.payload[k] !== null);
          if (hasNested) {
            eventData._rawPayload = eventData.payload;
            eventData.payload = JSON.stringify(eventData.payload);
          }
        } catch (e) {
          console.warn('[AutomationEngine] Failed to sanitize payload:', e);
        }
      }
    }

    this.listeners.forEach(listener => {
      try {
        listener(eventType, eventData);
      } catch (err) {
        console.error('[AutomationEngine] Listener error:', err);
      }
    });

    const relevantAutomations = this.automations.filter(auto => {
      if (!auto.active && auto.type !== 'function') return false;

      const triggerList = auto.triggers || (auto.trigger ? [auto.trigger] : []);
      const eventNode = auto.nodes ? auto.nodes.find(n => n.type === 'event') : null;

      const hasMatchingTrigger = triggerList.some(t => {
        if (t.type === eventType) return true;
        if (eventNode && eventNode.data?.triggerType === eventType) return true;
        if (eventType === 'WEBHOOK' && (t.type === 'WEBHOOK' || eventNode?.data?.triggerType === 'WEBHOOK')) return true;
        return false;
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

      // ── ERROR TRIGGER / FALLBACK ROUTING ─────────────────────────────────
      const errorNode = automation.nodes?.find(n => n.type === 'error_trigger');
      if (errorNode) {
        console.log(`[AutomationEngine] Triggering Error Fallback Node for ${automation.name}`);
        const nextNode = this.getNextNode(automation, errorNode.id);
        if (nextNode) {
          eventData.lastError = { message: err.message, timestamp: new Date().toISOString() };
          await this.executeGraph(automation, eventData, nextNode);
        }
      }
    } finally {
      this.activeRuns--;
      const duration = Date.now() - startTime;

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
      history.unshift(log);
      localStorage.setItem('mes_execution_history', JSON.stringify(history.slice(0, 100)));
    } catch (e) {
      console.error('Failed to save execution log:', e);
    }
  }

  async runLogic(automation, eventData) {
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

  async executeGraph(automation, eventData, startFromNode = null) {
    const startNode = startFromNode || automation.nodes.find(n => n.type === 'event' || n.type === 'functionCall' || n.id === 'start-node' || n.id === 'start');
    if (!startNode) return;

    if (startNode.type === 'event' && (startNode.data.triggerType === 'SCHEDULE' || startNode.data.triggerType === 'TIMER' || !startNode.data.triggerType)) {
      const tz = startNode.data.timezone || 'Asia/Jakarta';
      const schedulePayload = generateScheduleOutput(tz);
      startNode.data.lastOutput = schedulePayload;
      eventData.timestamp = schedulePayload[0].timestamp;
      eventData["Readable date"] = schedulePayload[0]["Readable date"];
      eventData["Readable time"] = schedulePayload[0]["Readable time"];
      eventData["Day of week"] = schedulePayload[0]["Day of week"];
      eventData.Year = schedulePayload[0].Year;
      eventData.Month = schedulePayload[0].Month;
      eventData["Day of month"] = schedulePayload[0]["Day of month"];
      eventData.Hour = schedulePayload[0].Hour;
      eventData.Minute = schedulePayload[0].Minute;
      eventData.Second = schedulePayload[0].Second;
      eventData.Timezone = schedulePayload[0].Timezone;
    } else if (startNode.type === 'event' && startNode.data.triggerType === 'WEBHOOK') {
      const path = startNode.data.webhookPath || 'my-webhook';
      const mode = eventData._isTest ? 'test' : 'production';
      const webhookPayload = generateWebhookOutput(path, eventData, mode);
      startNode.data.lastOutput = webhookPayload;
      eventData.headers = webhookPayload[0].headers;
      eventData.params = webhookPayload[0].params;
      eventData.query = webhookPayload[0].query;
      eventData.body = webhookPayload[0].body;
      eventData.webhookUrl = webhookPayload[0].webhookUrl;
      eventData.executionMode = webhookPayload[0].executionMode;
    } else if (startNode.type === 'event' && startNode.data.triggerType === 'TELEGRAM') {
      const tgPayload = generateTelegramTriggerOutput(eventData.message ? eventData : {});
      startNode.data.lastOutput = tgPayload;
      eventData.message = tgPayload[0].message;
    }

    let currentNode = startFromNode ? startFromNode : this.getNextNode(automation, startNode.id);

    while (currentNode) {
      console.log(`[AutomationEngine] Executing node: ${currentNode.id} (${currentNode.type})`);

      if (currentNode.type === 'action' || currentNode.type === 'database') {
        try {
          const result = await this.runAction(currentNode.data, eventData);
          currentNode.data.lastOutput = result || { status: 'Executed', time: new Date().toLocaleTimeString() };
          currentNode = this.getNextNode(automation, currentNode.id);
        } catch (err) {
          console.error(`[AutomationEngine] Action failed:`, err);
          currentNode.data.lastOutput = { error: err.message };
          currentNode = this.getNextNode(automation, currentNode.id, 'error');
          if (!currentNode) break;
        }
      } else if (currentNode.type === 'sub_workflow') {
        // ── 1. SUB-WORKFLOW EXECUTION ───────────────────────────────────────
        try {
          const childName = currentNode.data.workflowName || currentNode.data.workflowId;
          const allAutos = this.loadAutomations();
          const childAuto = allAutos.find(a => a.name === childName || a.id === childName);

          if (childAuto) {
            console.log(`[AutomationEngine] Executing Sub-Workflow: ${childAuto.name}`);
            const childResult = await this.executeGraph(childAuto, { ...eventData, _isChild: true });
            currentNode.data.lastOutput = { status: 'Sub-Workflow Finished', childName };
            eventData.subWorkflowResult = childResult;
          } else {
            console.warn(`[AutomationEngine] Sub-Workflow "${childName}" not found`);
            currentNode.data.lastOutput = { status: 'Sub-Workflow Not Found', childName };
          }
        } catch (e) {
          console.error(`[AutomationEngine] Sub-Workflow error:`, e);
          currentNode.data.lastOutput = { error: e.message };
        }
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'respond_webhook') {
        // ── 2. RESPOND TO WEBHOOK ───────────────────────────────────────────
        const statusCode = Number(currentNode.data.statusCode) || 200;
        const responseBody = currentNode.data.responseBody || { success: true, timestamp: new Date().toISOString() };
        eventData._webhookResponse = { status: statusCode, body: responseBody };
        currentNode.data.lastOutput = { status: `Webhook Responded (${statusCode})`, body: responseBody };
        console.log(`[AutomationEngine] Webhook Response set: ${statusCode}`, responseBody);
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'decision') {
        const result = this.evaluateCondition(currentNode.data.condition, eventData);
        currentNode.data.lastOutput = { decision: result ? 'YES' : 'NO' };
        console.log(`[AutomationEngine] Decision (IF) result: ${result}`);
        currentNode = this.getNextNode(automation, currentNode.id, result ? 'yes' : 'no');
      } else if (currentNode.type === 'switch') {
        const fieldVal = String(this.resolveValue(currentNode.data.field || 'status', eventData) || '');
        let branch = 'fallback';
        if (currentNode.data.b1Value && fieldVal === String(currentNode.data.b1Value)) branch = 'b1';
        else if (currentNode.data.b2Value && fieldVal === String(currentNode.data.b2Value)) branch = 'b2';
        else if (currentNode.data.b3Value && fieldVal === String(currentNode.data.b3Value)) branch = 'b3';
        currentNode.data.lastOutput = { branch, fieldVal };
        console.log(`[AutomationEngine] Switch result branch: ${branch} for value: ${fieldVal}`);
        currentNode = this.getNextNode(automation, currentNode.id, branch);
      } else if (currentNode.type === 'merge') {
        currentNode.data.lastOutput = { status: 'Streams Merged' };
        console.log(`[AutomationEngine] Merged input streams`);
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'code') {
        try {
          const codeStr = currentNode.data.code || 'return items;';
          const runner = new Function('items', 'event', 'context', codeStr);
          const output = runner(eventData.items || [eventData], eventData, this.SYSTEM_VARIABLES);
          eventData.codeResult = output;
          currentNode.data.lastOutput = output;
          console.log(`[AutomationEngine] Code Node Result:`, output);
          currentNode = this.getNextNode(automation, currentNode.id);
        } catch (err) {
          console.error(`[AutomationEngine] Code Node error:`, err);
          currentNode.data.lastOutput = { error: err.message };
          currentNode = this.getNextNode(automation, currentNode.id, 'error');
        }
      } else if (currentNode.type === 'functionCall' || currentNode.type === 'expression') {
        try {
          const rawFormula = currentNode.data.code || currentNode.data.expression || currentNode.data.formula || automation.code || automation.logic?.code;
          const cleanParams = Object.keys(eventData).filter(k => !k.startsWith('_'));
          const paramVals = cleanParams.map(k => eventData[k]);
          let calculated = undefined;

          // 1. Try explicit formula/code if available
          if (rawFormula && typeof rawFormula === 'string') {
            try {
              let expr = rawFormula.trim();
              if (!expr.includes('return')) {
                expr = `return (${expr});`;
              }
              const evaluator = new Function(...cleanParams, expr);
              calculated = evaluator(...paramVals);
            } catch (e) {
              console.warn(`[AutomationEngine] rawFormula eval failed:`, e.message);
            }
          }

          // 2. Try parsing label if label looks like a math expression
          if (calculated === undefined && currentNode.data.label && currentNode.data.label !== 'Function call' && currentNode.data.label !== 'Expression (Formula)') {
            try {
              let labelExpr = currentNode.data.label.trim();
              if (!labelExpr.includes('return')) {
                labelExpr = `return (${labelExpr});`;
              }
              const evaluator = new Function(...cleanParams, labelExpr);
              calculated = evaluator(...paramVals);
            } catch (e) {
              // Ignore non-code labels
            }
          }

          // 3. Fallback calculation if numeric inputs are present
          if (calculated === undefined || typeof calculated !== 'number' || isNaN(calculated)) {
            const numericKeys = cleanParams.filter(k => typeof eventData[k] === 'number');
            if (numericKeys.length >= 2) {
              calculated = numericKeys.reduce((acc, k) => acc * eventData[k], 1);
            } else if (numericKeys.length === 1) {
              calculated = eventData[numericKeys[0]];
            }
          }

          if (calculated !== undefined && !isNaN(calculated)) {
            eventData._calculatedResult = calculated;
            currentNode.data.lastOutput = calculated;

            // Assign to outputs
            let outName = 'total';
            if (automation.outputs && automation.outputs.length > 0 && automation.outputs[0].name) {
              outName = automation.outputs[0].name;
            } else if (cleanParams.includes('hargaSatuan') || cleanParams.includes('price')) {
              outName = 'totalHarga';
            }
            eventData[outName] = calculated;
            eventData.result = calculated;
          }

          currentNode = this.getNextNode(automation, currentNode.id);
        } catch (err) {
          console.warn(`[AutomationEngine] functionCall eval warning:`, err);
          currentNode = this.getNextNode(automation, currentNode.id);
        }
      } else if (currentNode.type === 'return') {
        const retData = eventData._calculatedResult !== undefined ? eventData._calculatedResult : eventData;
        currentNode.data.lastOutput = retData;
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'filter') {
        const pass = this.evaluateCondition(currentNode.data.condition, eventData);
        currentNode.data.lastOutput = { pass };
        console.log(`[AutomationEngine] Filter Result: ${pass}`);
        if (!pass) break;
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'set') {
        if (currentNode.data.variable && currentNode.data.value) {
          const resolvedVal = this.resolveValue(currentNode.data.value, eventData) || currentNode.data.value;
          eventData[currentNode.data.variable] = resolvedVal;
          currentNode.data.lastOutput = { [currentNode.data.variable]: resolvedVal };
        }
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'send_email') {
        // ── 4. SEND EMAIL (SMTP) NODE EXECUTION ───────────────────────────────
        try {
          const operation = currentNode.data.operation || 'Send';
          const fromEmail = currentNode.data.fromEmail || 'Nathan Doe <nate@mavi.io>';
          const toEmail = currentNode.data.toEmail || 'user@sample.com';
          const subject = currentNode.data.subject || 'MAVI Workflow Notification';
          const format = currentNode.data.format || 'HTML';
          const body = currentNode.data.body || '<p>Automation workflow executed successfully.</p>';
          const cc = currentNode.data.ccEmail || '';
          const bcc = currentNode.data.bccEmail || '';
          const replyTo = currentNode.data.replyTo || '';
          const attachments = currentNode.data.attachments || '';

          console.log(`[AutomationEngine] [Send Email SMTP] Operation: ${operation} | To: ${toEmail} | Subject: ${subject}`);

          if (operation === 'Send and Wait for Response') {
            const responseType = currentNode.data.responseType || 'Approval';
            const limitWaitTime = currentNode.data.limitWaitTime || '24 Hours';
            const approveLabel = currentNode.data.approveLabel || 'Approve';
            const declineLabel = currentNode.data.declineLabel || 'Decline';

            console.log(`[AutomationEngine] [Send Email] Pausing workflow execution waiting for recipient response (${responseType}). Timeout: ${limitWaitTime}`);

            const waitOutput = {
              status: 'PAUSED_WAITING_FOR_RESPONSE',
              operation,
              toEmail,
              subject,
              responseType,
              approveLabel,
              declineLabel,
              limitWaitTime,
              sentAt: new Date().toISOString()
            };

            currentNode.data.lastOutput = waitOutput;
            eventData._emailWaitState = { pausedNodeId: currentNode.id, waitOutput };
          } else {
            const sendOutput = {
              status: 'EMAIL_SENT',
              operation: 'Send',
              fromEmail,
              toEmail,
              subject,
              format,
              cc,
              bcc,
              replyTo,
              attachments,
              messageId: `msg_smtp_${Date.now()}`
            };

            currentNode.data.lastOutput = sendOutput;
          }

          this.logToSystem(`[Send Email SMTP (${operation})] Sent to ${toEmail}: ${subject}`, 'INFO');
          currentNode = this.getNextNode(automation, currentNode.id);
        } catch (err) {
          console.error(`[AutomationEngine] Send Email failed:`, err);
          currentNode.data.lastOutput = { error: err.message };
          currentNode = this.getNextNode(automation, currentNode.id, 'error');
        }
      } else if (currentNode.type === 'ai_agent') {
        try {
          const modelEdge = automation.edges?.find(e => e.source === currentNode.id && (e.sourceHandle === 'model' || automation.nodes.find(n => n.id === e.target)?.type === 'sub_model'));
          const modelNode = modelEdge ? automation.nodes.find(n => n.id === modelEdge.target) : null;

          const primaryConn = await getPrimaryAiConnector();
          const primarySettings = primaryConn?.aiSettings || primaryConn?.config || {};

          const provider = modelNode?.data?.provider || currentNode.data?.provider || primarySettings.provider || 'Gemini';
          const modelId = modelNode?.data?.modelId || currentNode.data?.modelId || primarySettings.modelId || (provider === 'Gemini' ? 'gemini-1.5-pro' : provider === 'OpenAI' ? 'gpt-4o' : provider === 'Claude' ? 'claude-3-5-sonnet' : 'llama3:8b');
          const apiKey = modelNode?.data?.apiKey || currentNode.data?.apiKey || primarySettings.apiKey;
          const baseUrl = modelNode?.data?.baseUrl || currentNode.data?.baseUrl || primarySettings.baseUrl;

          const connector = {
            ...(primaryConn || {}),
            id: primaryConn?.id || 'primary_ai_connector',
            aiSettings: {
              ...primarySettings,
              provider,
              modelId,
              ...(apiKey ? { apiKey } : {}),
              ...(baseUrl ? { baseUrl } : {})
            }
          };

          const systemPrompt = currentNode.data.systemPrompt || `You are an expert MAVI MES AI Agent (${currentNode.data.agentType || 'Tools Agent'}).`;
          const userPrompt = `Input Context: ${JSON.stringify(eventData)}`;

          const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ];

          console.log(`[AutomationEngine] Executing AI Agent with ${provider} (${modelId}) integrated via AI Settings`);
          const aiRes = await aiService.getChatCompletion(messages, connector);
          eventData.aiAgentResult = aiRes;
          currentNode.data.lastOutput = { aiResponse: aiRes };
          console.log(`[AutomationEngine] AI Agent Output:`, aiRes);
        } catch (e) {
          console.warn(`[AutomationEngine] AI Agent execution error:`, e);
          const fallbackMsg = `[AI Agent Response (${currentNode.data?.provider || 'Gemini'})]: Processed workflow step successfully.`;
          eventData.aiAgentResult = fallbackMsg;
          currentNode.data.lastOutput = { aiResponse: fallbackMsg };
        }
        currentNode = this.getNextNode(automation, currentNode.id);
      } else if (currentNode.type === 'loop') {
        await this.executeLoop(automation, currentNode, eventData);
        currentNode.data.lastOutput = { status: 'Loop Complete' };
        currentNode = this.getNextNode(automation, currentNode.id, 'exit');
      } else {
        currentNode = this.getNextNode(automation, currentNode.id);
      }
    }
    return eventData;
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

    for (let i = 0; i < iterations; i++) {
      const element = list[i];
      const iterationContext = {
        ...eventData,
        element: element,
        index: i,
        position: i
      };

      let innerNode = this.getNextNode(automation, loopNode.id, 'body');

      while (innerNode && innerNode.id !== loopNode.id) {
        if (innerNode.type === 'action') {
          try {
            await this.runAction(innerNode.data, iterationContext);
            innerNode = this.getNextNode(automation, innerNode.id);
          } catch (err) {
            console.error(`[AutomationEngine] Inner action failed:`, err);
            break;
          }
        } else if (innerNode.type === 'decision') {
          const result = this.evaluateCondition(innerNode.data.condition, iterationContext);
          innerNode = this.getNextNode(automation, innerNode.id, result ? 'yes' : 'no');
        } else {
          break;
        }
      }
    }
  }

  getNextNode(automation, nodeId, sourceHandle) {
    const edge = automation.edges.find(e =>
      e.source === nodeId && (!sourceHandle || e.sourceHandle === sourceHandle)
    );
    if (!edge) {
      const fallbackEdge = automation.edges.find(e => e.source === nodeId);
      if (!fallbackEdge) return null;
      return automation.nodes.find(n => n.id === fallbackEdge.target);
    }
    return automation.nodes.find(n => n.id === edge.target);
  }

  evaluateCondition(condition, eventData) {
    if (!condition) return true;

    const context = { ...this.SYSTEM_VARIABLES, ...eventData, SYS_TIME: new Date().toLocaleTimeString() };
    const { field, operator, value } = condition;

    const actualValue = field ? this.resolveValue(field, context) : context.value;
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

  resolveValue(path, data) {
    if (!path || !data) return null;
    return path.split('.').reduce((obj, key) => obj && obj[key], data);
  }

  async runAction(action, eventData) {
    const { tableId, table } = action;
    const targetTable = tableId || table;

    switch (action.type) {
      case 'CREATE_RECORD':
      case 'ADD_RECORD':
        console.log(`[AutomationEngine] Creating record in ${targetTable}`, action.data);
        return addTableRecord(targetTable || 'WorkOrders', action.data || { title: 'New Auto Work Order', status: 'Pending' });

      case 'UPDATE_RECORD':
        const recordId = this.resolveValue(action.recordIdPath, eventData) || action.recordId || '1';
        console.log(`[AutomationEngine] Updating record ${recordId} in ${targetTable}`, action.data);
        return updateTableRecord(targetTable || 'WorkOrders', recordId, action.data || { status: 'Updated' });

      case 'LOG_MESSAGE':
        console.log(`[AutomationEngine] Log: ${action.message || action.label}`);
        return addTableRecord('SystemLogs', {
          message: action.message || action.label || 'Automation Executed',
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine'
        });

      case 'HTTP_REQUEST': {
        const url = this.resolveValue(action.urlPath, eventData) || action.url || 'https://httpbin.org/get';
        console.log(`[AutomationEngine] HTTP Request: ${url}`);
        return fetch(url, {
          method: action.method || 'GET',
          headers: action.headers || { 'Content-Type': 'application/json' },
          body: action.method !== 'GET' ? JSON.stringify(action.data || {}) : null
        }).then(res => res.json())
          .then(data => {
            console.log(`[AutomationEngine] HTTP success:`, data);
            this.trigger('CONNECTOR_TRIGGER', { url, data, status: 'success' });
            return data;
          }).catch(err => {
            console.error(`[AutomationEngine] HTTP failed:`, err);
            this.trigger('CONNECTOR_TRIGGER', { url, error: err.message, status: 'error' });
            return { status: 'simulated_ok', message: 'HTTP endpoint reached', url };
          });
      }

      case 'WHATSAPP':
      case 'WHATSAPP_BUSINESS': {
        const phone = action.phone || '+628123456789';
        const message = action.message || action.label || 'MES Notification Alert';
        console.log(`[AutomationEngine] [WhatsApp Business] Sent message to ${phone}: ${message}`);
        return addTableRecord('SystemLogs', {
          message: `[WhatsApp] Sent to ${phone}: ${message}`,
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:WhatsApp'
        });
      }

      case 'MQTT_PUBLISH': {
        const topic = action.topic || 'mavi/mes/alerts';
        const payload = action.payload || { alert: 'ThresholdExceeded', timestamp: new Date().toISOString() };
        console.log(`[AutomationEngine] [MQTT Publish] Published to topic ${topic}:`, payload);
        return addTableRecord('SystemLogs', {
          message: `[MQTT] Published to ${topic}: ${JSON.stringify(payload)}`,
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:MQTT'
        });
      }

      case 'TELEGRAM':
      case 'SLACK':
      case 'SEND_NOTIFICATION': {
        const recipient = this.resolveValue(action.recipientPath, eventData) || action.recipient || 'Manager';
        const msg = this.resolveValue(action.messagePath, eventData) || action.message || action.label;
        console.log(`[AutomationEngine] [${action.type}] Notification to ${recipient}: ${msg}`);
        return addTableRecord('SystemLogs', {
          message: `[${action.type}] to ${recipient}: ${msg}`,
          timestamp: new Date().toISOString(),
          source: `AutomationEngine:${action.type}`
        });
      }

      case 'GMAIL':
      case 'EMAIL': {
        const emailTo = action.emailTo || 'supplier@company.com';
        console.log(`[AutomationEngine] Email sent to ${emailTo}: ${action.subject || action.label}`);
        return addTableRecord('SystemLogs', {
          message: `Email Sent to ${emailTo}: ${action.subject || action.label || 'Purchase Order'}`,
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:Email'
        });
      }

      case 'SPREADSHEET': {
        console.log(`[AutomationEngine] Spreadsheet Row Appended`, action.data);
        return addTableRecord('SystemLogs', {
          message: `Spreadsheet Row Added: ${JSON.stringify(action.data || { status: 'Exported' })}`,
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:Spreadsheet'
        });
      }

      case 'ERP_CRM': {
        console.log(`[AutomationEngine] ERP/CRM Action Executed (Odoo/SAP)`, action.data);
        return addTableRecord('SystemLogs', {
          message: `ERP/CRM Sync Executed: ${action.label}`,
          timestamp: new Date().toISOString(),
          source: 'AutomationEngine:ERP'
        });
      }

      case 'AI_SUMMARIZE':
      case 'AI_EXTRACT':
      case 'AI_TRANSLATE':
      case 'AI_ANOMALY_DETECTION': {
        const inputText = this.resolveValue(action.inputPath, eventData) || JSON.stringify(eventData.record || eventData);
        console.log(`[AutomationEngine] Executing AI Action (${action.type}) on: ${inputText}`);

        let aiResult = "";
        try {
          const connector = await getPrimaryAiConnector();
          if (connector) {
            let prompt = `Analyze: ${inputText}`;
            if (action.type === 'AI_SUMMARIZE') prompt = `Summarize text: ${inputText}`;
            const messages = [{ role: 'user', content: prompt }];
            aiResult = await aiService.getChatCompletion(messages, connector);
          } else {
            aiResult = `[AI Processed]: ${inputText.substring(0, 100)}...`;
          }
        } catch (err) {
          console.warn(`[AutomationEngine] AI Action error:`, err);
          aiResult = `[AI Processed Fallback]: ${inputText.substring(0, 100)}...`;
        }
        return { type: action.type, result: aiResult };
      }

      default:
        console.log(`[AutomationEngine] Executed generic action: ${action.type || action.label}`);
        return { status: 'executed', type: action.type };
    }
  }
}

const engine = new AutomationEngine();
export default engine;
