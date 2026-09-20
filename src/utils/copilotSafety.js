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
    'ADD_SCREEN',
    'CREATE_SCREEN',
    'NEW_SCREEN',
    'ADD_PAGE',
    'CREATE_PAGE',
    'NEW_PAGE',
    'UPDATE_STEP',
    'UPDATE_SCREEN',
    'UPDATE_PAGE',
    'DELETE_STEP',
    'DELETE_SCREEN',
    'DELETE_PAGE',
    'GO_TO_STEP',
    'GO_TO_SCREEN',

    // App-level
    'SET_APP_NAME',
    'GENERATE_BASE_LAYOUT',
    'BUILD_BASE_LAYOUT',
    'ADD_BASE_LAYOUT',

    // Logic/Function management
    'CREATE_FUNCTION',
    'UPDATE_FUNCTION',
    'DELETE_FUNCTION',

    // Automation management
    'CREATE_AUTOMATION',
    'UPDATE_AUTOMATION',
    'DELETE_AUTOMATION',

    // App Documentation/Guide
    'UPDATE_HELP_GUIDE',
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
    CREATE_TRIGGER: [],
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

    // Step/Screen (Title is safely auto-defaulted in normalizePayloadShape)
    CREATE_STEP: [],
    ADD_STEP: [],
    UPDATE_STEP: [],            // accepts stepId OR payload.stepTitle
    DELETE_STEP: [],            // accepts stepId OR payload.stepTitle
    GO_TO_STEP: [],

    // App
    SET_APP_NAME: [],
    GENERATE_BASE_LAYOUT: [],

    // Function/Logic
    CREATE_FUNCTION: ['payload.name'],
    UPDATE_FUNCTION: [],        // accepts payload.functionId OR payload.functionName
    DELETE_FUNCTION: [],        // accepts payload.functionId OR payload.functionName

    // Automation
    CREATE_AUTOMATION: ['payload.name'],
    UPDATE_AUTOMATION: [],      // accepts payload.automationId OR payload.automationName
    DELETE_AUTOMATION: [],      // accepts payload.automationId OR payload.automationName

    // App Documentation/Guide
    UPDATE_HELP_GUIDE: ['payload.markdown'],
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

const WIDGET_PREFIX_REGEX = /^(ADD_|CREATE_|NEW_|INSERT_)(BUTTON|INPUT|TEXT_INPUT|TEXT|LABEL|TITLE|HEADING|CARD|RECTANGLE|CONTAINER|TABLE|INTERACTIVE_TABLE|CHART|IMAGE|GAUGE|CHECKBOX|SWITCH|TOGGLE|DROPDOWN|SELECT|CAMERA|NUMPAD|QR|BARCODE)$/i;

const WIDGET_TYPE_MAP = {
    BUTTON: 'BUTTON',
    INPUT: 'TEXT_INPUT',
    TEXT_INPUT: 'TEXT_INPUT',
    TEXT: 'TEXT',
    LABEL: 'TEXT',
    TITLE: 'TEXT',
    HEADING: 'TEXT',
    CARD: 'SHAPE_RECTANGLE',
    RECTANGLE: 'SHAPE_RECTANGLE',
    CONTAINER: 'SHAPE_RECTANGLE',
    TABLE: 'INTERACTIVE_TABLE',
    INTERACTIVE_TABLE: 'INTERACTIVE_TABLE',
    CHART: 'CHART',
    IMAGE: 'IMAGE',
    GAUGE: 'GAUGE',
    CHECKBOX: 'CHECKBOX',
    SWITCH: 'TOGGLE_SWITCH',
    TOGGLE: 'TOGGLE_SWITCH',
    DROPDOWN: 'DROPDOWN',
    SELECT: 'DROPDOWN',
    CAMERA: 'VISION_CAMERA',
    NUMPAD: 'NUMPAD_INPUT',
    QR: 'QR_SCANNER',
    BARCODE: 'BARCODE_SCANNER'
};

const normalizeCommandType = (type) => {
    if (!type) return '';
    const t = String(type).trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (t === 'CREATE_WIDGET' || t === 'NEW_WIDGET' || t === 'INSERT_WIDGET' || t === 'ADD_COMPONENT' || t === 'CREATE_COMPONENT') return 'ADD_WIDGET';
    if (WIDGET_PREFIX_REGEX.test(t)) return 'ADD_WIDGET';
    if (t === 'CREATE_STEP' || t === 'NEW_STEP' || t === 'ADD_SCREEN' || t === 'CREATE_SCREEN' || t === 'NEW_SCREEN' || t === 'ADD_PAGE' || t === 'CREATE_PAGE' || t === 'NEW_PAGE') return 'ADD_STEP';
    if (t === 'UPDATE_SCREEN' || t === 'RENAME_SCREEN' || t === 'UPDATE_PAGE') return 'UPDATE_STEP';
    if (t === 'DELETE_SCREEN' || t === 'REMOVE_SCREEN' || t === 'DELETE_PAGE') return 'DELETE_STEP';
    if (t === 'NAVIGATE_STEP' || t === 'SWITCH_STEP' || t === 'CHANGE_STEP' || t === 'GOTO_STEP' || t === 'NAVIGATE' || t === 'GO_TO_SCREEN' || t === 'GOTO_SCREEN' || t === 'NAVIGATE_SCREEN' || t === 'SWITCH_SCREEN' || t === 'CHANGE_SCREEN' || t === 'GO_TO_PAGE' || t === 'GOTO_PAGE' || t === 'NAVIGATE_PAGE' || t === 'SWITCH_PAGE') return 'GO_TO_STEP';
    if (t === 'BUILD_BASE_LAYOUT' || t === 'ADD_BASE_LAYOUT' || t === 'CREATE_BASE_LAYOUT') return 'GENERATE_BASE_LAYOUT';
    if (t === 'NEW_TABLE') return 'CREATE_TABLE';
    if (t === 'NEW_VARIABLE') return 'CREATE_VARIABLE';
    if (t === 'NEW_TRIGGER') return 'CREATE_TRIGGER';
    return t;
};

const normalizePayloadShape = (cmd) => {
    const next = { ...cmd };
    let payload = (next.payload && typeof next.payload === 'object') ? { ...next.payload } : {};

    if (!next.payload && next.detail && typeof next.detail === 'object') payload = { ...next.detail };
    if (!next.payload && next.data && typeof next.data === 'object') payload = { ...next.data };

    // Support string payload e.g. { type: 'ADD_STEP', payload: 'Screen 2' } or { type: 'GO_TO_STEP', payload: 'Screen 2' }
    if (typeof next.payload === 'string' && next.payload.trim()) {
        const strVal = next.payload.trim();
        payload.title = payload.title || strVal;
        payload.stepTitle = payload.stepTitle || strVal;
        payload.screenTitle = payload.screenTitle || strVal;
        payload.name = payload.name || strVal;
        payload.stepId = payload.stepId || strVal;
    }

    // Pull root-level fields if payload is empty or missing key properties
    const rootKeys = ['event', 'on', 'trigger', 'widgetId', 'widgetName', 'target', 'componentId', 'actions', 'clauses', 'conditions', 'elseActions', 'name', 'title', 'stepId', 'stepTitle', 'screenTitle', 'step', 'screen', 'page', 'stepName', 'targetStep', 'tableId', 'tableName', 'variableName', 'variable', 'defaultValue', 'columns', 'fields', 'markdown', 'content', 'code', 'logic', 'description'];
    rootKeys.forEach(k => {
        if (next[k] !== undefined && payload[k] === undefined) {
            payload[k] = next[k];
        }
    });

    // Step / Screen title normalization
    if (next.type === 'ADD_STEP' || next.type === 'CREATE_STEP' || next.type === 'ADD_SCREEN' || next.type === 'CREATE_SCREEN') {
        payload.title = payload.title || payload.stepTitle || payload.screenTitle || payload.name || payload.screen || payload.page || payload.stepName || payload.label || next.title || next.stepTitle || next.name || 'New Screen';
    }

    // Detect widget type from raw cmd.type if e.g. ADD_BUTTON
    const rawType = String(cmd?.type || '').toUpperCase().trim();
    const rawTypeSuffix = rawType.replace(/^(ADD_|CREATE_|NEW_|INSERT_)/, '');
    const mappedWidgetType = WIDGET_TYPE_MAP[rawTypeSuffix];

    // Widget type normalization
    if (next.type === 'ADD_WIDGET' || next.type === 'CREATE_WIDGET') {
        payload.type = payload.type || payload.widgetType || payload.componentType || payload.widget || payload.component || mappedWidgetType || next.widgetType || next.componentType || next.widget || next.component || 'BUTTON';
        if (payload.type === 'ADD_WIDGET' || payload.type === 'CREATE_WIDGET') {
            payload.type = mappedWidgetType || 'BUTTON';
        }
    }

    // Trigger normalization
    if (next.type === 'CREATE_TRIGGER' || next.type === 'TRIGGER' || payload.event || payload.on || payload.actions || payload.clauses) {
        let rawEvt = payload.event || payload.on || payload.trigger || payload.eventName || next.event || '';
        if (typeof rawEvt === 'object') rawEvt = rawEvt.type || rawEvt.name || rawEvt.eventName || '';
        const evtStr = String(rawEvt || '').toUpperCase().trim();

        if (evtStr.includes('START') || evtStr.includes('INIT') || evtStr.includes('MOUNT')) {
            payload.event = 'ON_APP_START';
        } else if (evtStr.includes('VARIABLE') || (evtStr.includes('CHANGE') && !payload.widgetId && !payload.target)) {
            payload.event = 'ON_VARIABLE_CHANGE';
        } else if (evtStr.includes('STEP_ENTER') || evtStr.includes('SCREEN_ENTER')) {
            payload.event = 'ON_STEP_ENTER';
        } else if (evtStr.includes('STEP_EXIT') || evtStr.includes('SCREEN_EXIT')) {
            payload.event = 'ON_STEP_EXIT';
        } else if (evtStr.includes('CHANGE')) {
            payload.event = 'ON_CHANGE';
        } else if (evtStr.includes('TIMER') || evtStr.includes('INTERVAL')) {
            payload.event = 'TIMER';
        } else if (evtStr.includes('CLICK') || evtStr.includes('PRESS') || evtStr.includes('TAP') || evtStr.includes('SUBMIT')) {
            payload.event = 'ON_CLICK';
        } else if (!payload.event) {
            payload.event = 'ON_CLICK';
        }
    }

    if (payload.detail && !payload.payload && typeof payload.detail === 'object') payload.payload = payload.detail;

    next.payload = payload;
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
