const ALLOWED_COMMAND_TYPES = new Set([
    // Widget management
    'ADD_WIDGET',
    'UPDATE_WIDGET',
    'DELETE_WIDGET',

    // Variable management
    'CREATE_VARIABLE',
    'UPDATE_VARIABLE',
    'DELETE_VARIABLE',

    // Trigger management
    'CREATE_TRIGGER',
    'UPDATE_TRIGGER',
    'DELETE_TRIGGER',

    // Record placeholder management
    'CREATE_RECORD_PLACEHOLDER',
    'UPDATE_RECORD_PLACEHOLDER',
    'DELETE_RECORD_PLACEHOLDER',

    // Table management
    'CREATE_TABLE',
    'UPDATE_TABLE',
    'DELETE_TABLE',

    // Screen/Step management
    'CREATE_STEP',
    'ADD_STEP',
    'UPDATE_STEP',
    'DELETE_STEP',
    'GO_TO_STEP',

    // App-level
    'SET_APP_NAME',

    // Logic/Function management
    'CREATE_FUNCTION',
    'UPDATE_FUNCTION',
    'DELETE_FUNCTION',

    // Automation management
    'CREATE_AUTOMATION',
    'UPDATE_AUTOMATION',
    'DELETE_AUTOMATION',
]);

export const COPILOT_SAFETY_ERROR_CODES = {
    MISSING_TYPE: 'E_CMD_001',
    UNSUPPORTED_TYPE: 'E_CMD_002',
    MISSING_REQUIRED_FIELDS: 'E_CMD_003',
    WIDGET_NOT_FOUND: 'E_REF_001',
    VARIABLE_NOT_FOUND: 'E_REF_002',
    STEP_NOT_FOUND: 'E_REF_003',
    TABLE_NOT_FOUND: 'E_REF_004',
    TRIGGER_NOT_FOUND: 'E_REF_005',
    FUNCTION_NOT_FOUND: 'E_REF_006',
    AUTOMATION_NOT_FOUND: 'E_REF_007'
};

export const DEFAULT_SAFE_RATIO_THRESHOLD = 0.6;

const REQUIRED_FIELDS_BY_TYPE = {
    // Widget
    ADD_WIDGET: ['payload.type'],
    UPDATE_WIDGET: [],          // accepts widgetId OR payload.widgetName — resolved at runtime
    DELETE_WIDGET: [],          // accepts widgetId OR payload.widgetName — resolved at runtime

    // Variable
    CREATE_VARIABLE: ['payload.name'],
    UPDATE_VARIABLE: [],        // accepts variableName OR payload.name
    DELETE_VARIABLE: [],        // accepts variableName OR payload.name

    // Trigger
    CREATE_TRIGGER: ['payload.event'],
    UPDATE_TRIGGER: [],         // accepts triggerId OR payload.triggerName
    DELETE_TRIGGER: [],         // accepts triggerId OR payload.triggerName

    // Record Placeholder
    CREATE_RECORD_PLACEHOLDER: ['payload.name'],
    UPDATE_RECORD_PLACEHOLDER: ['placeholderId'],
    DELETE_RECORD_PLACEHOLDER: ['placeholderId'],

    // Table
    CREATE_TABLE: ['payload.name'],
    UPDATE_TABLE: ['tableId'],
    DELETE_TABLE: ['tableId'],

    // Step/Screen
    CREATE_STEP: ['payload.title'],
    ADD_STEP: ['payload.title'],
    UPDATE_STEP: [],            // accepts stepId OR payload.stepTitle
    DELETE_STEP: [],            // accepts stepId OR payload.stepTitle
    GO_TO_STEP: [],

    // App
    SET_APP_NAME: [],

    // Function/Logic
    CREATE_FUNCTION: ['payload.name'],
    UPDATE_FUNCTION: [],        // accepts payload.functionId OR payload.functionName
    DELETE_FUNCTION: [],        // accepts payload.functionId OR payload.functionName

    // Automation
    CREATE_AUTOMATION: ['payload.name'],
    UPDATE_AUTOMATION: [],      // accepts payload.automationId OR payload.automationName
    DELETE_AUTOMATION: [],      // accepts payload.automationId OR payload.automationName
};

const getByPath = (obj, path) => {
    return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const hasValue = (v) => !(v === undefined || v === null || v === '');

const buildContextIndex = (context = {}) => {
    // DEFENSIVE: Ensure all context fields are arrays before mapping
    const getSafeArray = (arr, name) => {
        if (Array.isArray(arr)) return arr;
        if (arr) console.warn(`[CopilotSafety] Context.${name} is not an array:`, arr);
        return [];
    };

    const widgets = getSafeArray(context?.widgets, 'widgets');
    const variables = getSafeArray(context?.variables, 'variables');
    const steps = getSafeArray(context?.steps, 'steps');
    const tables = getSafeArray(context?.tables, 'tables');

    return {
        widgetIds: new Set(widgets.map(w => w?.id).filter(Boolean)),
        variableNames: new Set(variables.map(v => v?.name).filter(Boolean)),
        stepIds: new Set(steps.map(s => s?.id).filter(Boolean)),
        tableIds: new Set(tables.map(t => t?.id).filter(Boolean))
    };
};

const normalizeCommandType = (type) => {
    if (!type) return '';
    return String(type).trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
};

const normalizePayloadShape = (cmd) => {
    const next = { ...cmd };
    const payload = { ...(next.payload || {}) };

    if (!next.payload && next.detail && typeof next.detail === 'object') next.payload = { ...next.detail };
    if (!next.payload && next.data && typeof next.data === 'object') next.payload = { ...next.data };

    const p = { ...(next.payload || payload) };

    // trigger field normalization
    if (p.on && !p.event) p.event = p.on;
    if (p.detail && !p.payload && typeof p.detail === 'object') p.payload = p.detail;

    next.payload = p;
    return next;
};

export const sanitizeCopilotCommands = (commandData, context = {}, options = {}) => {
    if (!commandData || !Array.isArray(commandData.commands)) {
        return { safeCommands: [], warnings: ['No commands array found.'], blockedCount: 0, hardFail: true, safeRatio: 0 };
    }

    const warnings = [];
    let blockedCount = 0;
    const contextIndex = buildContextIndex(context);

    let commands = commandData.commands;

    // Detect if commands is actually a flat list of database column definitions
    const isFlatColumnList = commands.length > 0 && commands.every(cmd => {
        if (!cmd || typeof cmd !== 'object') return false;
        
        // If it is a known allowed builder command type, it is not a raw column
        const type = String(cmd.type || '').toUpperCase().trim();
        if (ALLOWED_COMMAND_TYPES.has(type)) return false;

        const hasColumnIndicator = 'name' in cmd || 'columnName' in cmd || 'fieldName' in cmd;
        const isDbDataType = ['UUID', 'RECORD', 'TEXT', 'INTEGER', 'NUMERIC', 'BOOLEAN', 'JSONB', 'DATE', 'TIMESTAMP', 'TIMESTAMPTZ', 'VARCHAR', 'DOUBLE', 'FLOAT'].includes(type) || type === '';
        
        return hasColumnIndicator && isDbDataType;
    });

    if (isFlatColumnList) {
        const columns = commands.map(cmd => ({
            name: cmd.name || cmd.columnName || cmd.fieldName,
            type: cmd.type || 'text'
        }));
        
        commands = [{
            type: 'CREATE_TABLE',
            payload: {
                name: 'new_table',
                columns: columns
            }
        }];
        warnings.push(`[REPAIR] Detected a flat column list in commands. Automatically wrapped ${columns.length} columns into a single 'CREATE_TABLE' command.`);
    }

    const safeCommands = commands
        .map((raw, cmdIndex) => {
            const normalized = normalizePayloadShape({ ...raw, type: normalizeCommandType(raw?.type) });
            const cmdWarnings = [];

            if (!normalized.type) {
                blockedCount += 1;
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.MISSING_TYPE}] Command #${cmdIndex + 1} blocked: missing type.`);
                return null;
            }

            if (!ALLOWED_COMMAND_TYPES.has(normalized.type)) {
                blockedCount += 1;
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.UNSUPPORTED_TYPE}] Command #${cmdIndex + 1} blocked: unsupported type '${normalized.type}'.`);
                return null;
            }

            const requiredFields = REQUIRED_FIELDS_BY_TYPE[normalized.type] || [];
            const missingFields = requiredFields.filter((fieldPath) => !hasValue(getByPath(normalized, fieldPath)));
            if (missingFields.length > 0) {
                blockedCount += 1;
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.MISSING_REQUIRED_FIELDS}] Command #${cmdIndex + 1} blocked: missing required fields (${missingFields.join(', ')}).`);
                return null;
            }

            const strictReferenceCheck = options.strictReferenceCheck === true;

            // Context-aware referential checks (non-fatal if context empty)
            if (contextIndex.widgetIds.size > 0 && hasValue(normalized.widgetId) && !contextIndex.widgetIds.has(normalized.widgetId)) {
                if (strictReferenceCheck) {
                    blockedCount += 1;
                    warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.WIDGET_NOT_FOUND}] Command #${cmdIndex + 1} blocked: widgetId '${normalized.widgetId}' not found in current context.`);
                    return null;
                }
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.WIDGET_NOT_FOUND}] Command #${cmdIndex + 1}: widgetId '${normalized.widgetId}' not found in current context. Command allowed (non-strict reference mode).`);
            }
            if (contextIndex.variableNames.size > 0 && hasValue(normalized.variableName) && !contextIndex.variableNames.has(normalized.variableName)) {
                if (strictReferenceCheck) {
                    blockedCount += 1;
                    warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.VARIABLE_NOT_FOUND}] Command #${cmdIndex + 1} blocked: variable '${normalized.variableName}' not found in current context.`);
                    return null;
                }
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.VARIABLE_NOT_FOUND}] Command #${cmdIndex + 1}: variable '${normalized.variableName}' not found in current context. Command allowed (non-strict reference mode).`);
            }
            if (contextIndex.stepIds.size > 0 && hasValue(normalized.stepId) && !contextIndex.stepIds.has(normalized.stepId)) {
                if (strictReferenceCheck) {
                    blockedCount += 1;
                    warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.STEP_NOT_FOUND}] Command #${cmdIndex + 1} blocked: stepId '${normalized.stepId}' not found in current context.`);
                    return null;
                }
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.STEP_NOT_FOUND}] Command #${cmdIndex + 1}: stepId '${normalized.stepId}' not found in current context. Command allowed (non-strict reference mode).`);
            }
            if (contextIndex.tableIds.size > 0 && hasValue(normalized.tableId) && !contextIndex.tableIds.has(normalized.tableId)) {
                if (strictReferenceCheck) {
                    blockedCount += 1;
                    warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.TABLE_NOT_FOUND}] Command #${cmdIndex + 1} blocked: tableId '${normalized.tableId}' not found in current context.`);
                    return null;
                }
                warnings.push(`[${COPILOT_SAFETY_ERROR_CODES.TABLE_NOT_FOUND}] Command #${cmdIndex + 1}: tableId '${normalized.tableId}' not found in current context. Command allowed (non-strict reference mode).`);
            }

            if (!normalized.payload && !normalized.widgetId && !normalized.variableName && !normalized.stepId) {
                cmdWarnings.push('Command has no payload/target; applied as-is.');
            }

            return {
                ...normalized,
                _safety: {
                    repaired: JSON.stringify(raw) !== JSON.stringify(normalized),
                    warnings: cmdWarnings
                }
            };
        })
        .filter(Boolean);

    const totalCount = commands.length;
    const safeCount = safeCommands.length;
    const safeRatio = totalCount > 0 ? safeCount / totalCount : 0;
    const threshold = typeof options.threshold === 'number'
        ? Math.max(0, Math.min(1, options.threshold))
        : DEFAULT_SAFE_RATIO_THRESHOLD;
    const hardFail = safeRatio < threshold;

    return {
        safeCommands,
        warnings,
        blockedCount,
        totalCount,
        safeCount,
        safeRatio,
        hardFail,
        threshold
    };
};
