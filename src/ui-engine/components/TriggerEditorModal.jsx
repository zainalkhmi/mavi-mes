import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Maximize2, Minimize2, Play, 
  GripVertical, CheckCircle2, AlertTriangle, Info, 
  ChevronDown, Layers, Zap, ToggleLeft, Sparkles, Pencil,
  ShieldAlert, Lock
} from 'lucide-react';

/**
 * Action Categories matching Mavi AppBuilder standard
 */
export const ACTION_CATEGORIES = [
  {
    label: 'Data Manipulation',
    actions: [
      { value: 'DATA_MANIPULATION_STORE', label: 'Data Manipulation: Store' },
      { value: 'DATA_MANIPULATION_CLEAR', label: 'Data Manipulation: Clear' },
      { value: 'DATA_MANIPULATION_INCREMENT', label: 'Data Manipulation: Increment Value' },
      { value: 'DATA_MANIPULATION_DECREMENT', label: 'Data Manipulation: Decrement Value' },
      { value: 'RESET_ALL_VARIABLES', label: 'Data Manipulation: Reset All App Variables to Defaults' },
    ]
  },
  {
    label: 'Table Records',
    actions: [
      { value: 'TABLE_RECORD_CREATE', label: 'Table Record: Create' },
      { value: 'TABLE_RECORD_CREATE_OR_LOAD', label: 'Table Record: Create or Load' },
      { value: 'TABLE_RECORD_LOAD', label: 'Table Record: Load' },
      { value: 'TABLE_RECORD_SAVE', label: 'Table Record: Save (Update)' },
      { value: 'TABLE_RECORD_DELETE', label: 'Table Record: Delete' },
      { value: 'CLEAR_RECORD_PLACEHOLDER', label: 'Table Record: Clear Placeholder' },
    ]
  },
  {
    label: 'Connectors',
    actions: [
      { value: 'RUN_CONNECTOR_FUNCTION', label: 'Connectors: Run Connector Function' },
    ]
  },
  {
    label: 'Variables',
    actions: [
      { value: 'SET_VARIABLE', label: 'Variable: Set' },
      { value: 'INCREMENT_VARIABLE', label: 'Variable: Increment' },
      { value: 'CLEAR_VARIABLE', label: 'Variable: Clear' },
    ]
  },
  {
    label: 'Manufacturing & Shopfloor',
    actions: [
      { value: 'START_PRODUCTION', label: 'Shopfloor: Start Production Order' },
      { value: 'STOP_PRODUCTION', label: 'Shopfloor: Stop / Complete Production' },
      { value: 'VALIDATE_WORK_ORDER', label: 'Shopfloor: Validate Work Order & Skills' },
      { value: 'PLC_WRITE_TAG', label: 'Industrial IoT: Write PLC Bit/Tag' },
      { value: 'PLC_WRITE_RECIPE', label: 'Industrial IoT: Write Recipe (Batch Multi-Tag)' },
      { value: 'TRIGGER_WORKFLOW', label: 'Automation: Trigger Background Workflow' },
      { value: 'TRIGGER_HAPTIC_SOUND', label: 'Feedback: Play Sound & Haptic Vibration' },
    ]
  },
  {
    label: 'Notifications',
    actions: [
      { value: 'SHOW_MESSAGE', label: 'Notification: Show Message' },
    ]
  },
  {
    label: 'Media & Audio',
    actions: [
      { value: 'PLAY_SOUND', label: 'Media: Play Sound' },
      { value: 'SHOW_IMAGE', label: 'Media: Show Image' },
      { value: 'PLAY_VIDEO', label: 'Media: Play Video' },
    ]
  },
  {
    label: 'Google Cloud Vertex AI',
    actions: [
      { value: 'VERTEX_AI_VISION_INSPECT', label: 'Vertex AI: Multimodal Vision Defect Inspection' },
      { value: 'VERTEX_AI_ROOT_CAUSE_ANALYSIS', label: 'Vertex AI: 1M+ Long-Context Root Cause Analysis (5-Why)' },
      { value: 'VERTEX_AI_AGENT_ACTION', label: 'Vertex AI: Autonomous Agent Tool Execution (Andon/CAPA)' },
    ]
  },
  {
    label: 'AI & Advanced',
    actions: [
      { value: 'AI_PROCESS', label: 'AI: Process with AI' },
      { value: 'RUN_VISION_MODEL_INFERENCE', label: 'Vision AI: Run Vision Model Inference' },
      { value: 'CUSTOM_SCRIPT', label: 'Advanced: Execute Custom Script' },
      { value: 'CALCULATE_FORMULA', label: 'Advanced: Calculate Formula' },
    ]
  },
  {
    label: 'OBD2 & Engine Logic',
    actions: [
      { value: 'RUN_FUNCTION', label: 'Logic: Execute Function' },
      { value: 'OBD2_CONNECT', label: 'OBD2: Connect Vehicle' },
      { value: 'OBD2_QUERY', label: 'OBD2: Read Engine PID' },
      { value: 'OBD2_CLEAR_DTC', label: 'OBD2: Clear Error Codes' },
    ]
  },
  {
    label: 'App & Navigation',
    actions: [
      { value: 'PRINT_REPORT_TEMPLATE', label: 'Report: Print / Generate PDF' },
      { value: 'APP_REFRESH', label: 'App: Refresh All Data' },
      { value: 'PRINT_SCREEN', label: 'App: Print Screen / Area' },
      { value: 'NEXT_STEP', label: 'App: Go to Next Screen' },
      { value: 'PREV_STEP', label: 'App: Go to Previous Screen' },
      { value: 'GO_TO_STEP', label: 'App: Go to Specific Screen' },
      { value: 'COMPLETE_APP', label: 'App: Complete App' },
      { value: 'CANCEL_APP', label: 'App: Cancel App' },
    ]
  }
];

/**
 * TriggerEditorModal Component
 * Full-featured Trigger & Action logic editor matching Mavi AppBuilder.
 * Supports When, Stop-on-error, If/Else Clauses, Conditions, and Then/Else Action pipelines.
 */
export function TriggerEditorModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialTrigger = null,
  sourceType = 'WIDGET', // 'WIDGET' | 'SCREEN' | 'APP'
  sourceComponent = null,
  screens = [],
  variables = [],
  tables = [],
  recordPlaceholders = [],
  onTestTrigger
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Local trigger state
  const [trigger, setTrigger] = useState({
    id: `trig_${Date.now()}`,
    name: 'New Trigger',
    event: 'ON_CLICK',
    enabled: true,
    stopOnError: false,
    clauses: [
      {
        id: `clause_${Date.now()}`,
        match: 'ALL',
        conditions: [],
        actions: [
          {
            id: `act_${Date.now()}`,
            type: 'SET_VARIABLE',
            payload: { varPath: '', valueType: 'STATIC', value: '' }
          }
        ]
      }
    ],
    elseActions: []
  });

  // Sync initial trigger when opening
  useEffect(() => {
    if (initialTrigger) {
      setTrigger({
        id: initialTrigger.id || `trig_${Date.now()}`,
        name: initialTrigger.name || 'New Trigger',
        event: initialTrigger.event || (sourceComponent?.type === 'Button' || sourceComponent?.type === 'FAB' ? 'ON_CLICK' : 'ON_CHANGE'),
        enabled: initialTrigger.enabled !== false,
        stopOnError: initialTrigger.stopOnError === true,
        clauses: (initialTrigger.clauses && initialTrigger.clauses.length > 0)
          ? initialTrigger.clauses.map(c => ({
              id: c.id || `clause_${Date.now()}_${Math.random()}`,
              match: c.match || 'ALL',
              conditions: c.conditions || [],
              actions: c.actions || []
            }))
          : [
              {
                id: `clause_${Date.now()}`,
                match: 'ALL',
                conditions: [],
                actions: initialTrigger.action
                  ? [{ id: `act_${Date.now()}`, type: initialTrigger.action, payload: initialTrigger.params || {} }]
                  : [{ id: `act_${Date.now()}`, type: 'SET_VARIABLE', payload: { varPath: '', valueType: 'STATIC', value: '' } }]
              }
            ],
        elseActions: initialTrigger.elseActions || []
      });
    } else {
      const defaultEvent = ['Button', 'FAB'].includes(sourceComponent?.type) ? 'ON_CLICK' : 'ON_CHANGE';
      setTrigger({
        id: `trig_${Date.now()}`,
        name: 'New Trigger',
        event: defaultEvent,
        enabled: true,
        stopOnError: false,
        clauses: [
          {
            id: `clause_${Date.now()}`,
            match: 'ALL',
            conditions: [],
            actions: [
              {
                id: `act_${Date.now()}`,
                type: 'SET_VARIABLE',
                payload: { varPath: '', valueType: 'STATIC', value: '' }
              }
            ]
          }
        ],
        elseActions: []
      });
    }
    setTestResult(null);
  }, [initialTrigger, sourceComponent, isOpen]);

  if (!isOpen) return null;

  // Event options based on component or source
  const getEventOptions = () => {
    const iotEvents = [
      { value: 'ON_TAG_CHANGE', label: '⚡ Industrial IoT: PLC Tag / Sensor Changes' },
      { value: 'ON_RISING_EDGE', label: '📈 Industrial IoT: Rising Edge (0 ➔ 1 Machine Cycle)' },
      { value: 'ON_PLC_ALARM', label: '🚨 Industrial IoT: PLC Alarm / Threshold Exceeded' }
    ];

    if (sourceType === 'WIDGET') {
      const type = sourceComponent?.type || '';
      if (['Button', 'FAB', 'Dropdown'].includes(type)) {
        return [
          { value: 'ON_CLICK', label: 'button is pressed' },
          { value: 'ON_CHANGE', label: 'data changes' },
          ...iotEvents
        ];
      }
      if (['QRCodeScanner'].includes(type)) {
        return [
          { value: 'ON_SCAN', label: 'barcode/QR is scanned' },
          { value: 'ON_CHANGE', label: 'data changes' },
          ...iotEvents
        ];
      }
      if (['Camera'].includes(type)) {
        return [
          { value: 'ON_CAPTURE', label: 'photo is captured' },
          { value: 'ON_CHANGE', label: 'data changes' },
          ...iotEvents
        ];
      }
      return [
        { value: 'ON_CHANGE', label: 'data changes' },
        { value: 'ON_CLICK', label: 'widget is clicked' },
        { value: 'ON_SUBMIT', label: 'form submitted' },
        ...iotEvents
      ];
    }
    if (sourceType === 'SCREEN') {
      return [
        { value: 'ON_SCREEN_LOAD', label: 'Screen is opened' },
        { value: 'ON_SCREEN_LEAVE', label: 'Screen is closed' },
        { value: 'TIMER', label: 'timer' },
        ...iotEvents
      ];
    }
    return [
      { value: 'ON_APP_START', label: 'App is started' },
      { value: 'ON_APP_COMPLETE', label: 'App is completed' },
      ...iotEvents
    ];
  };

  // Clause manipulation
  const addClause = () => {
    const newClause = {
      id: `clause_${Date.now()}`,
      match: 'ALL',
      conditions: [],
      actions: []
    };
    setTrigger(prev => ({
      ...prev,
      clauses: [...prev.clauses, newClause]
    }));
  };

  const removeClause = (cIdx) => {
    setTrigger(prev => ({
      ...prev,
      clauses: prev.clauses.filter((_, i) => i !== cIdx)
    }));
  };

  const addCondition = (cIdx) => {
    const newCond = {
      id: `cond_${Date.now()}`,
      leftSource: 'VARIABLE',
      leftValue: '',
      operator: '==',
      rightSource: 'STATIC',
      rightValue: ''
    };
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].conditions = [...(nextClauses[cIdx].conditions || []), newCond];
      return { ...prev, clauses: nextClauses };
    });
  };

  const removeCondition = (cIdx, condIdx) => {
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].conditions = nextClauses[cIdx].conditions.filter((_, i) => i !== condIdx);
      return { ...prev, clauses: nextClauses };
    });
  };

  const updateCondition = (cIdx, condIdx, updates) => {
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].conditions[condIdx] = {
        ...nextClauses[cIdx].conditions[condIdx],
        ...updates
      };
      return { ...prev, clauses: nextClauses };
    });
  };

  const addAction = (cIdx) => {
    const newAct = {
      id: `act_${Date.now()}`,
      type: 'SET_VARIABLE',
      payload: { varPath: '', valueType: 'STATIC', value: '' }
    };
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].actions = [...(nextClauses[cIdx].actions || []), newAct];
      return { ...prev, clauses: nextClauses };
    });
  };

  const removeAction = (cIdx, aIdx) => {
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].actions = nextClauses[cIdx].actions.filter((_, i) => i !== aIdx);
      return { ...prev, clauses: nextClauses };
    });
  };

  const updateAction = (cIdx, aIdx, updates) => {
    setTrigger(prev => {
      const nextClauses = [...prev.clauses];
      nextClauses[cIdx].actions[aIdx] = {
        ...nextClauses[cIdx].actions[aIdx],
        ...updates
      };
      return { ...prev, clauses: nextClauses };
    });
  };

  // Else actions
  const addElseAction = () => {
    const newAct = {
      id: `act_${Date.now()}`,
      type: 'SET_VARIABLE',
      payload: { varPath: '', valueType: 'STATIC', value: '' }
    };
    setTrigger(prev => ({
      ...prev,
      elseActions: [...(prev.elseActions || []), newAct]
    }));
  };

  const removeElseAction = (eIdx) => {
    setTrigger(prev => ({
      ...prev,
      elseActions: prev.elseActions.filter((_, i) => i !== eIdx)
    }));
  };

  const updateElseAction = (eIdx, updates) => {
    setTrigger(prev => {
      const nextElse = [...prev.elseActions];
      nextElse[eIdx] = { ...nextElse[eIdx], ...updates };
      return { ...prev, elseActions: nextElse };
    });
  };

  // Action fields renderer matching Mavi AppBuilder
  const renderActionFields = (act, onChangePayload) => {
    const payload = act.payload || {};

    switch (act.type) {
      // ── Tulip Data Manipulation: Store (support.tulip.co/docs/triggers) ──
      case 'DATA_MANIPULATION_STORE':
      case 'STORE':
      case 'DATA_MANIPULATION': {
        const source = payload.data || payload.source || {};
        const location = payload.location || payload.target || {};
        const sType = source.dataSourceType || 'STATIC';
        const lType = location.locationType || (payload.varPath ? 'VARIABLE' : 'TABLE_RECORD');

        const updateSource = (srcUpdates) => {
          onChangePayload({
            data: { ...source, ...srcUpdates }
          });
        };
        const updateLocation = (locUpdates) => {
          onChangePayload({
            location: { ...location, ...locUpdates }
          });
        };

        return (
          <div className="flex flex-col gap-2.5 flex-1 text-xs">
            {/* Row 1: data: */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 w-14 shrink-0 text-right pr-1">data:</span>
              
              <select
                value={sType}
                onChange={(e) => updateSource({ dataSourceType: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="STATIC">Static Value</option>
                <option value="VARIABLE">Variable</option>
                <option value="TABLE_RECORD">Table Record</option>
                <option value="TABLE_AGGREGATION">Table Aggregation</option>
                <option value="EXPRESSION">Expression</option>
                <option value="APP_INFO">App Info</option>
              </select>

              {sType === 'STATIC' && (
                <>
                  <select
                    value={source.staticType || 'Text'}
                    onChange={(e) => updateSource({ staticType: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                  >
                    <option value="Text">Text</option>
                    <option value="Number">Number</option>
                    <option value="Boolean">Boolean</option>
                    <option value="Datetime">Datetime</option>
                  </select>

                  {source.staticType === 'Boolean' ? (
                    <select
                      value={String(source.staticValue ?? 'true')}
                      onChange={(e) => updateSource({ staticValue: e.target.value === 'true' })}
                      className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : (
                    <input
                      type={source.staticType === 'Number' ? 'number' : 'text'}
                      value={source.staticValue !== undefined ? source.staticValue : (source.value || '')}
                      onChange={(e) => updateSource({ staticValue: e.target.value, value: e.target.value })}
                      placeholder={source.staticType === 'Number' ? '0' : '"enter value"'}
                      className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[130px]"
                    />
                  )}
                </>
              )}

              {sType === 'VARIABLE' && (
                <select
                  value={source.variableName || source.varPath || ''}
                  onChange={(e) => updateSource({ variableName: e.target.value, varPath: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[150px] font-medium"
                >
                  <option value="">Select variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              )}

              {sType === 'TABLE_RECORD' && (
                <>
                  <select
                    value={source.placeholderId || source.recordPlaceholder || ''}
                    onChange={(e) => updateSource({ placeholderId: e.target.value, recordPlaceholder: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[140px] font-medium"
                  >
                    <option value="">Select Record Placeholder...</option>
                    {recordPlaceholders.map(rp => (
                      <option key={rp.id} value={rp.name || rp.id}>{rp.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={source.fieldName || source.field || ''}
                    onChange={(e) => updateSource({ fieldName: e.target.value, field: e.target.value })}
                    placeholder="Field name (e.g. Status, Date Created)..."
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[130px]"
                  />
                </>
              )}

              {sType === 'TABLE_AGGREGATION' && (
                <>
                  <select
                    value={source.aggregationType || 'COUNT'}
                    onChange={(e) => updateSource({ aggregationType: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
                  >
                    <option value="COUNT">Count of Records</option>
                    <option value="SUM">Sum</option>
                    <option value="AVERAGE">Average</option>
                    <option value="MIN">Min</option>
                    <option value="MAX">Max</option>
                  </select>
                  <select
                    value={source.tableId || ''}
                    onChange={(e) => updateSource({ tableId: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[120px]"
                  >
                    <option value="">Select Table...</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {source.aggregationType && source.aggregationType !== 'COUNT' && (
                    <input
                      type="text"
                      value={source.fieldName || ''}
                      onChange={(e) => updateSource({ fieldName: e.target.value })}
                      placeholder="Column/Field..."
                      className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-28"
                    />
                  )}
                </>
              )}

              {sType === 'EXPRESSION' && (
                <input
                  type="text"
                  value={source.expression || source.formula || ''}
                  onChange={(e) => updateSource({ expression: e.target.value, formula: e.target.value })}
                  placeholder="e.g. UPPER(@status) or @qty * 2"
                  className="p-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs flex-1 min-w-[180px]"
                />
              )}

              {sType === 'APP_INFO' && (
                <select
                  value={source.appInfoField || 'LOGGED_IN_USER'}
                  onChange={(e) => updateSource({ appInfoField: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium min-w-[160px]"
                >
                  <option value="LOGGED_IN_USER">Logged-in User</option>
                  <option value="STATION">Station Name</option>
                  <option value="SHIFT">Current Shift</option>
                  <option value="APP_NAME">App Name</option>
                  <option value="CURRENT_DATETIME">Current Date/Time</option>
                </select>
              )}
            </div>

            {/* Row 2: location: */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 w-14 shrink-0 text-right pr-1">location:</span>

              <select
                value={lType}
                onChange={(e) => updateLocation({ locationType: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="TABLE_RECORD">Table Record</option>
                <option value="VARIABLE">Variable</option>
              </select>

              {lType === 'TABLE_RECORD' ? (
                <>
                  <select
                    value={location.placeholderId || location.recordPlaceholder || ''}
                    onChange={(e) => updateLocation({ placeholderId: e.target.value, recordPlaceholder: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px] font-medium"
                  >
                    <option value="">Select Record Placeholder...</option>
                    {recordPlaceholders.map(rp => (
                      <option key={rp.id} value={rp.name || rp.id}>{rp.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={location.fieldName || location.field || ''}
                    onChange={(e) => updateLocation({ fieldName: e.target.value, field: e.target.value })}
                    placeholder="Field name (e.g. Status, Lot Date)..."
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[130px]"
                  />
                </>
              ) : (
                <select
                  value={location.variableName || location.varPath || ''}
                  onChange={(e) => updateLocation({ variableName: e.target.value, varPath: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[160px] font-medium"
                >
                  <option value="">Select destination variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        );
      }

      // ── Tulip Data Manipulation: Clear ──
      case 'DATA_MANIPULATION_CLEAR':
      case 'CLEAR': {
        const location = payload.location || payload.target || {};
        const lType = location.locationType || (payload.varPath ? 'VARIABLE' : (payload.placeholderId ? 'TABLE_RECORD' : 'VARIABLE'));

        const updateLocation = (locUpdates) => {
          onChangePayload({
            location: { ...location, ...locUpdates }
          });
        };

        return (
          <div className="flex flex-wrap items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 w-14 shrink-0 text-right pr-1">location:</span>
            <select
              value={lType}
              onChange={(e) => updateLocation({ locationType: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
            >
              <option value="VARIABLE">Variable</option>
              <option value="TABLE_RECORD">Table Record</option>
              <option value="ALL_VARIABLES">All App Variables</option>
            </select>

            {lType === 'VARIABLE' && (
              <select
                value={location.variableName || location.varPath || ''}
                onChange={(e) => updateLocation({ variableName: e.target.value, varPath: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[160px] font-medium"
              >
                <option value="">Select variable...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            )}

            {lType === 'TABLE_RECORD' && (
              <>
                <select
                  value={location.placeholderId || location.recordPlaceholder || ''}
                  onChange={(e) => updateLocation({ placeholderId: e.target.value, recordPlaceholder: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px] font-medium"
                >
                  <option value="">Select Record Placeholder...</option>
                  {recordPlaceholders.map(rp => (
                    <option key={rp.id} value={rp.name || rp.id}>{rp.name}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={location.fieldName || location.field || ''}
                  onChange={(e) => updateLocation({ fieldName: e.target.value, field: e.target.value })}
                  placeholder="Field name..."
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[130px]"
                />
              </>
            )}

            {lType === 'ALL_VARIABLES' && (
              <span className="text-[11px] text-amber-600 font-medium">
                Reset all variables in app back to initial defaults.
              </span>
            )}
          </div>
        );
      }

      // ── Tulip Data Manipulation: Increment / Decrement ──
      case 'DATA_MANIPULATION_INCREMENT':
      case 'DATA_MANIPULATION_DECREMENT': {
        const location = payload.location || payload.target || {};
        const lType = location.locationType || (payload.varPath ? 'VARIABLE' : 'TABLE_RECORD');
        const by = payload.by || {};
        const byType = typeof by === 'object' ? (by.byType || 'STATIC') : 'STATIC';
        const byValue = typeof by === 'object' ? (by.value ?? 1) : (payload.step ?? 1);

        const updateLocation = (locUpdates) => {
          onChangePayload({
            location: { ...location, ...locUpdates }
          });
        };

        return (
          <div className="flex flex-col gap-2 flex-1 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-500 w-14 shrink-0 text-right pr-1">location:</span>
              <select
                value={lType}
                onChange={(e) => updateLocation({ locationType: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="VARIABLE">Variable</option>
                <option value="TABLE_RECORD">Table Record</option>
              </select>

              {lType === 'VARIABLE' ? (
                <select
                  value={location.variableName || location.varPath || ''}
                  onChange={(e) => updateLocation({ variableName: e.target.value, varPath: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[160px] font-medium"
                >
                  <option value="">Select variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <>
                  <select
                    value={location.placeholderId || location.recordPlaceholder || ''}
                    onChange={(e) => updateLocation({ placeholderId: e.target.value, recordPlaceholder: e.target.value })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px] font-medium"
                  >
                    <option value="">Select Record Placeholder...</option>
                    {recordPlaceholders.map(rp => (
                      <option key={rp.id} value={rp.name || rp.id}>{rp.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={location.fieldName || location.field || ''}
                    onChange={(e) => updateLocation({ fieldName: e.target.value, field: e.target.value })}
                    placeholder="Field name..."
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[120px]"
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 w-14 shrink-0 text-right pr-1">by:</span>
              <select
                value={byType}
                onChange={(e) => onChangePayload({ by: { byType: e.target.value, value: e.target.value === 'VARIABLE' ? '' : 1 } })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
              >
                <option value="STATIC">Static Value</option>
                <option value="VARIABLE">Variable</option>
              </select>

              {byType === 'VARIABLE' ? (
                <select
                  value={typeof by === 'object' ? (by.value || '') : ''}
                  onChange={(e) => onChangePayload({ by: { byType: 'VARIABLE', value: e.target.value } })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[140px]"
                >
                  <option value="">Select variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  value={byValue}
                  onChange={(e) => onChangePayload({ by: { byType: 'STATIC', value: Number(e.target.value) }, step: Number(e.target.value) })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-24"
                />
              )}
            </div>
          </div>
        );
      }

      // ── Tulip Data Manipulation: Reset All App Variables to Defaults ──
      case 'RESET_ALL_VARIABLES':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-700">Aksi:</span>
            <span>Mengembalikan semua variabel aplikasi ke nilai default awalnya.</span>
          </div>
        );

      // ── Connectors: Run Connector Function (Tulip standard) ──
      case 'RUN_CONNECTOR_FUNCTION':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">connector:</span>
              <select
                value={payload.connector || '*Connectors Testing - HTTP'}
                onChange={(e) => onChangePayload({ connector: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold min-w-[180px]"
              >
                <option value="*Connectors Testing - HTTP">*Connectors Testing - HTTP</option>
                <option value="Odoo ERP Connector">Odoo ERP Connector</option>
                <option value="n8n Webhook Connector">n8n Webhook Automation</option>
                <option value="Industrial IoT / MQTT">Industrial IoT / MQTT Gateway</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">api method:</span>
              <select
                value={payload.method || 'api method - get'}
                onChange={(e) => onChangePayload({ method: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="api method - get">api method - get</option>
                <option value="api method - post">api method - post</option>
                <option value="api method - put">api method - put</option>
                <option value="api method - delete">api method - delete</option>
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 whitespace-nowrap">and save result as:</span>
              <select
                value={payload.saveResultAs || ''}
                onChange={(e) => onChangePayload({ saveResultAs: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[120px] font-medium"
              >
                <option value="">Select result variable...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'START_PRODUCTION':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[75px]">Work Order</span>
              <input
                type="text"
                value={payload.workOrderId || ''}
                onChange={(e) => onChangePayload({ workOrderId: e.target.value })}
                placeholder="WO-1089 (atau kosongkan untuk auto)"
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[140px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[65px]">Target Qty</span>
              <input
                type="number"
                value={payload.targetQty || 100}
                onChange={(e) => onChangePayload({ targetQty: Number(e.target.value) })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-20"
              />
            </div>
            <div className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              ✓ Auto-injects Operator, Station, Shift, & Takt Timer
            </div>
          </div>
        );

      case 'STOP_PRODUCTION':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-500">Aksi:</span>
            <span>Menghentikan siklus kerja, menghitung total waktu siklus, dan menyimpan record akhir.</span>
          </div>
        );

      case 'VALIDATE_WORK_ORDER':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[85px]">Expected Status</span>
              <select
                value={payload.expectedStatus || 'RELEASED'}
                onChange={(e) => onChangePayload({ expectedStatus: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[130px]"
              >
                <option value="RELEASED">RELEASED (Siap Jalan)</option>
                <option value="IN_PROGRESS">IN_PROGRESS (Sedang Jalan)</option>
                <option value="APPROVED">APPROVED (Disetujui)</option>
              </select>
            </div>
            <div className="text-[10px] text-amber-600 font-medium">
              ⚠ Blokir start jika status tidak sesuai
            </div>
          </div>
        );

      case 'PLC_WRITE_TAG':
        return (
          <div className="flex flex-col gap-2.5 flex-1 text-xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                <span className="font-semibold text-slate-500 min-w-[55px]">PLC Tag</span>
                <select
                  value={['START_CYCLE', 'STOP_CYCLE', 'RESET_LINE', 'ns=2;s=SpindleSpeed', 'ns=2;s=Temperature', '40001', '10001', 'mavi/machine/line1/speed'].includes(payload.tag) ? payload.tag : 'CUSTOM'}
                  onChange={(e) => {
                    if (e.target.value !== 'CUSTOM') {
                      onChangePayload({ tag: e.target.value });
                    }
                  }}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs max-w-[140px]"
                >
                  <option value="START_CYCLE">START_CYCLE</option>
                  <option value="STOP_CYCLE">STOP_CYCLE</option>
                  <option value="RESET_LINE">RESET_LINE</option>
                  <option value="ns=2;s=SpindleSpeed">ns=2;s=SpindleSpeed (OPC UA)</option>
                  <option value="ns=2;s=Temperature">ns=2;s=Temperature (OPC UA)</option>
                  <option value="40001">40001 (Modbus Holding)</option>
                  <option value="10001">10001 (Modbus Discrete)</option>
                  <option value="mavi/machine/line1/speed">MQTT Topic Speed</option>
                  <option value="CUSTOM">Custom Tag...</option>
                </select>
                <input
                  type="text"
                  value={payload.tag || 'START_CYCLE'}
                  onChange={(e) => onChangePayload({ tag: e.target.value })}
                  placeholder="e.g. DB1.DBX0.0 / ns=2;s=Tag"
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[110px]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-500 min-w-[35px]">Value</span>
                <input
                  type="text"
                  value={payload.value !== undefined ? payload.value : '1'}
                  onChange={(e) => onChangePayload({ value: e.target.value })}
                  placeholder="1 / 0 / @var"
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-24"
                />
              </div>
            </div>

            {/* P3: Safety Interlock / Two-Step Confirmation Configuration */}
            <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-amber-800 dark:text-amber-400 select-none">
                <input
                  type="checkbox"
                  checked={payload.requireConfirmation === true}
                  onChange={(e) => onChangePayload({ 
                    requireConfirmation: e.target.checked,
                    confirmTitle: payload.confirmTitle || '⚠️ Konfirmasi Operasi Mesin / Safety Interlock',
                    confirmMessage: payload.confirmMessage || 'Pastikan area mesin aman dan steril sebelum sinyal PLC dikirimkan.',
                    requireCheckboxAcknowledge: payload.requireCheckboxAcknowledge !== false,
                    confirmButtonText: payload.confirmButtonText || '⚡ Eksekusi ke Mesin'
                  })}
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                />
                <span className="flex items-center gap-1.5 text-xs font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Wajibkan Konfirmasi Operator (Safety Interlock Two-Step)</span>
                </span>
              </label>

              {payload.requireConfirmation && (
                <div className="mt-2 p-2.5 bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-lg space-y-2 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">Judul Interlock</span>
                      <input
                        type="text"
                        value={payload.confirmTitle || '⚠️ Konfirmasi Operasi Mesin / Safety Interlock'}
                        onChange={(e) => onChangePayload({ confirmTitle: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 dark:border-amber-700/60 rounded bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">Label Tombol Eksekusi</span>
                      <input
                        type="text"
                        value={payload.confirmButtonText || '⚡ Eksekusi ke Mesin'}
                        onChange={(e) => onChangePayload({ confirmButtonText: e.target.value })}
                        className="w-full p-1.5 border border-amber-300 dark:border-amber-700/60 rounded bg-white dark:bg-slate-900 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block mb-0.5">Pesan Peringatan / Instruksi SOP</span>
                    <textarea
                      value={payload.confirmMessage || 'Pastikan area mesin aman dan steril sebelum sinyal PLC dikirimkan.'}
                      onChange={(e) => onChangePayload({ confirmMessage: e.target.value })}
                      rows={2}
                      className="w-full p-1.5 border border-amber-300 dark:border-amber-700/60 rounded bg-white dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-700 dark:text-slate-300 font-medium select-none">
                    <input
                      type="checkbox"
                      checked={payload.requireCheckboxAcknowledge !== false}
                      onChange={(e) => onChangePayload({ requireCheckboxAcknowledge: e.target.checked })}
                      className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Operator wajib mencentang checkbox pernyataan verifikasi SOP</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        );

      case 'PLC_WRITE_RECIPE':
        return (
          <div className="flex flex-col gap-2.5 flex-1 text-xs">
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Recipe Tags (JSON Object atau key=value)</span>
              <textarea
                value={typeof payload.tags === 'object' ? JSON.stringify(payload.tags, null, 2) : (payload.tags || '{\n  "ns=2;s=SpindleSpeed": 1500,\n  "ns=2;s=Temperature": 180,\n  "40001": 55\n}')}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    onChangePayload({ tags: parsed });
                  } catch (err) {
                    onChangePayload({ tags: e.target.value });
                  }
                }}
                rows={3}
                placeholder='{ "ns=2;s=SpindleSpeed": 1500, "ns=2;s=TargetTemp": 180 }'
                className="w-full p-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 font-mono text-[11px]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Strobe/Req Tag:</span>
                <input
                  type="text"
                  value={payload.handshakeTag || ''}
                  onChange={(e) => onChangePayload({ handshakeTag: e.target.value })}
                  placeholder="REQ_LOAD_RECIPE"
                  className="p-1 border border-slate-300 rounded bg-white text-xs flex-1"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">ACK Tag:</span>
                <input
                  type="text"
                  value={payload.ackTag || ''}
                  onChange={(e) => onChangePayload({ ackTag: e.target.value })}
                  placeholder="ACK_RECIPE_LOADED"
                  className="p-1 border border-slate-300 rounded bg-white text-xs flex-1"
                />
              </div>
            </div>
          </div>
        );

      case 'TRIGGER_WORKFLOW':
      case 'RUN_WORKFLOW':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[85px]">Workflow Name/ID</span>
              <input
                type="text"
                value={payload.workflowName || payload.workflowId || ''}
                onChange={(e) => onChangePayload({ workflowName: e.target.value, workflowId: e.target.value })}
                placeholder="e.g. Sync Order to ERP / Quality Alert Telegram"
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Event Key</span>
              <input
                type="text"
                value={payload.eventType || 'TRIGGER_WORKFLOW'}
                onChange={(e) => onChangePayload({ eventType: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-36 font-mono"
              />
            </div>
          </div>
        );

      case 'TRIGGER_HAPTIC_SOUND':
        return (
          <div className="flex items-center gap-3 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[65px]">Feedback</span>
            <select
              value={payload.soundType || 'SUCCESS'}
              onChange={(e) => onChangePayload({ soundType: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px]"
            >
              <option value="SUCCESS">Chime Positif + Getar Pendek</option>
              <option value="ERROR">Buzzer Peringatan + Getar Panjang</option>
              <option value="TAP">Klik Sentuh Halus (Tactile)</option>
            </select>
          </div>
        );

      case 'SET_VARIABLE':
      case 'INCREMENT_VARIABLE':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[60px]">Variable</span>
              <select
                value={payload.varPath || ''}
                onChange={(e) => onChangePayload({ varPath: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px] font-medium"
              >
                <option value="">Select variable...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name} ({v.type || 'string'})</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[65px]">Value From</span>
              <select
                value={payload.valueType || 'STATIC'}
                onChange={(e) => onChangePayload({ valueType: e.target.value, value: '' })}
                className="p-1.5 border border-slate-300 rounded-lg bg-slate-50 text-xs"
              >
                <option value="STATIC">Static Value</option>
                <option value="VARIABLE">Variable</option>
                <option value="TABLE_AGGREGATION">Table Aggregation</option>
                <option value="EXPRESSION">Expression</option>
              </select>

              {payload.valueType === 'VARIABLE' ? (
                <select
                  value={payload.value || ''}
                  onChange={(e) => onChangePayload({ value: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
                >
                  <option value="">Select source variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : payload.valueType === 'TABLE_AGGREGATION' ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <select
                    value={payload.value?.split(':')[0] || ''}
                    onChange={(e) => onChangePayload({ value: `${e.target.value}:COUNT` })}
                    className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
                  >
                    <option value="">Select table...</option>
                    {tables.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  type="text"
                  value={payload.value || ''}
                  onChange={(e) => onChangePayload({ value: e.target.value })}
                  placeholder={act.type === 'INCREMENT_VARIABLE' ? 'Step e.g. 1' : 'Enter value...'}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
                />
              )}
            </div>
          </div>
        );

      case 'CLEAR_VARIABLE':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[60px]">Variable</span>
            <select
              value={payload.varPath || ''}
              onChange={(e) => onChangePayload({ varPath: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[180px] font-medium"
            >
              <option value="">Select variable...</option>
              {variables.map(v => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        );

      case 'SHOW_MESSAGE':
      case 'SHOW_TOAST':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500">Message</span>
              <input
                type="text"
                value={payload.message || ''}
                onChange={(e) => onChangePayload({ message: e.target.value })}
                placeholder="e.g. Operation Complete"
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Type</span>
              <select
                value={payload.msgType || payload.toastType || 'info'}
                onChange={(e) => onChangePayload({ msgType: e.target.value, toastType: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="info">Info (Blue)</option>
                <option value="success">Success (Green)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="error">Error (Red)</option>
              </select>
            </div>
          </div>
        );

      case 'PLAY_SOUND':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[70px]">Sound URL</span>
            <input
              type="text"
              value={payload.url || ''}
              onChange={(e) => onChangePayload({ url: e.target.value })}
              placeholder="https://example.com/sound.mp3 or assets/beep.wav"
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
            />
          </div>
        );

      case 'SHOW_IMAGE':
      case 'PLAY_VIDEO':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[70px]">{act.type === 'SHOW_IMAGE' ? 'Image URL' : 'Video URL'}</span>
              <input
                type="text"
                value={payload.url || ''}
                onChange={(e) => onChangePayload({ url: e.target.value })}
                placeholder={act.type === 'SHOW_IMAGE' ? 'https://example.com/image.png' : 'https://example.com/video.mp4'}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Duration (s)</span>
              <input
                type="number"
                value={payload.duration ?? (act.type === 'SHOW_IMAGE' ? 5 : 10)}
                onChange={(e) => onChangePayload({ duration: parseInt(e.target.value) || 0 })}
                className="w-16 p-1.5 border border-slate-300 rounded-lg bg-white text-xs"
              />
            </div>
          </div>
        );

      case 'TABLE_RECORD_CREATE_OR_LOAD':
      case 'TABLE_RECORD_LOAD':
      case 'TABLE_RECORD_CREATE': {
        const idType = payload.idType || (payload.id?.dataSourceType) || 'STATIC';
        const idVal = payload.idValue !== undefined ? payload.idValue : (payload.id?.staticValue || payload.id?.value || payload.id || '');

        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">by ID:</span>
              <select
                value={idType}
                onChange={(e) => onChangePayload({ idType: e.target.value, idValue: '' })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
              >
                <option value="STATIC">Static Value</option>
                <option value="VARIABLE">Variable</option>
              </select>

              {idType === 'VARIABLE' ? (
                <select
                  value={idVal}
                  onChange={(e) => onChangePayload({ idValue: e.target.value })}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[130px] font-medium"
                >
                  <option value="">Select variable...</option>
                  {variables.map(v => (
                    <option key={v.name} value={v.name}>{v.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={idVal}
                  onChange={(e) => onChangePayload({ idValue: e.target.value })}
                  placeholder={act.type === 'TABLE_RECORD_CREATE' ? '000123 (Opt)' : '000123'}
                  className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs w-28 font-mono"
                />
              )}
            </div>

            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500">into:</span>
              <select
                value={payload.placeholderId || payload.placeholder || ''}
                onChange={(e) => onChangePayload({ placeholderId: e.target.value, placeholder: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 min-w-[150px] font-bold text-slate-800"
              >
                <option value="">Select Record Placeholder...</option>
                {recordPlaceholders.map(rp => (
                  <option key={rp.id} value={rp.name || rp.id}>{rp.name}</option>
                ))}
              </select>
            </div>
          </div>
        );
      }

      case 'TABLE_RECORD_SAVE':
      case 'TABLE_RECORD_DELETE':
      case 'CLEAR_RECORD_PLACEHOLDER':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[70px]">Placeholder</span>
            <select
              value={payload.placeholderId || ''}
              onChange={(e) => onChangePayload({ placeholderId: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[180px]"
            >
              <option value="">Select placeholder...</option>
              {recordPlaceholders.map(rp => (
                <option key={rp.id} value={rp.id}>{rp.name}</option>
              ))}
            </select>
          </div>
        );

      case 'AI_PROCESS':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[50px]">Prompt</span>
              <input
                type="text"
                value={payload.prompt || ''}
                onChange={(e) => onChangePayload({ prompt: e.target.value })}
                placeholder="e.g. Analyze defect reason"
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Save Result</span>
              <select
                value={payload.resultVar || ''}
                onChange={(e) => onChangePayload({ resultVar: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[120px]"
              >
                <option value="">Select var...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'RUN_VISION_MODEL_INFERENCE':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[75px]">Vision Model</span>
              <select
                value={payload.modelId || 'yolo_defect'}
                onChange={(e) => onChangePayload({ modelId: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[150px]"
              >
                <option value="yolo_defect">YOLOv8 Defect Detection</option>
                <option value="scratch_classifier">Surface Scratch AI</option>
                <option value="ocr_label">Label & Barcode OCR</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[65px]">Save Result</span>
              <select
                value={payload.resultVar || ''}
                onChange={(e) => onChangePayload({ resultVar: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              >
                <option value="">Select result variable...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'CUSTOM_SCRIPT':
      case 'CALCULATE_FORMULA':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[60px]">{act.type === 'CUSTOM_SCRIPT' ? 'Script' : 'Formula'}</span>
              <input
                type="text"
                value={payload.formula || payload.script || ''}
                onChange={(e) => onChangePayload({ formula: e.target.value, script: e.target.value })}
                placeholder={act.type === 'CUSTOM_SCRIPT' ? '// e.g. return variables.qty * 2;' : 'SUM(@target, 100)'}
                className="p-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs flex-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500">Save Result</span>
              <select
                value={payload.resultVar || ''}
                onChange={(e) => onChangePayload({ resultVar: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[120px]"
              >
                <option value="">Select var...</option>
                {variables.map(v => (
                  <option key={v.name} value={v.name}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 'RUN_FUNCTION':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[60px]">Function</span>
            <select
              value={payload.functionName || ''}
              onChange={(e) => onChangePayload({ functionName: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1 font-medium"
            >
              <option value="">Select Function...</option>
              <option value="CALCULATE_OEE">Calculate Shift OEE</option>
              <option value="CHECK_QC_LIMITS">Check QC Tolerance Limits</option>
              <option value="TRIGGER_BUZZER">Trigger Andon Buzzer</option>
              <option value="NOTIFY_SUPERVISOR">Send Slack / Telegram Alert</option>
            </select>
          </div>
        );

      case 'OBD2_CONNECT':
      case 'OBD2_QUERY':
      case 'OBD2_CLEAR_DTC':
        return (
          <div className="flex items-center gap-2 flex-1 text-xs">
            <span className="font-semibold text-slate-500 min-w-[60px]">OBD2 Metric</span>
            <select
              value={payload.pid || 'SPEED'}
              onChange={(e) => onChangePayload({ pid: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
            >
              <option value="SPEED">Vehicle Speed (km/h)</option>
              <option value="RPM">Engine RPM</option>
              <option value="COOLANT_TEMP">Engine Coolant Temp (°C)</option>
              <option value="THROTTLE">Throttle Position (%)</option>
              <option value="FUEL_RATE">Engine Fuel Rate</option>
            </select>
            <span className="font-semibold text-slate-500">Save Result</span>
            <select
              value={payload.resultVar || ''}
              onChange={(e) => onChangePayload({ resultVar: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[120px]"
            >
              <option value="">Select var...</option>
              {variables.map(v => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        );

      case 'PRINT_REPORT_TEMPLATE':
      case 'PRINT_SCREEN':
        return (
          <div className="flex items-center gap-3 flex-1 text-xs">
            <span className="font-semibold text-slate-500">Target</span>
            <select
              value={payload.actionTarget || 'PRINT'}
              onChange={(e) => onChangePayload({ actionTarget: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[200px]"
            >
              <option value="PRINT">🖨️ Direct Print (Thermal / Laser)</option>
              <option value="DOWNLOAD">📥 Download PDF File</option>
              <option value="PREVIEW">👁️ Open PDF Preview in New Tab</option>
            </select>
          </div>
        );

      case 'GO_TO_STEP':
      case 'GO_TO_SCREEN':
        return (
          <div className="flex items-center gap-3 flex-1 text-xs">
            <span className="font-semibold text-slate-500">Target Screen</span>
            <select
              value={payload.stepId || payload.targetScreenId || ''}
              onChange={(e) => onChangePayload({ stepId: e.target.value, targetScreenId: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[200px]"
            >
              <option value="">Select screen...</option>
              {screens.map(s => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </div>
        );

      case 'NEXT_STEP':
      case 'PREV_STEP':
      case 'COMPLETE_APP':
      case 'CANCEL_APP':
      case 'APP_REFRESH':
        return (
          <div className="text-xs text-slate-400 italic">
            No additional parameters required.
          </div>
        );

      case 'SCAN_BARCODE':
      case 'CAPTURE_PHOTO':
        return (
          <div className="flex items-center gap-3 flex-1 text-xs">
            <span className="font-semibold text-slate-500">Save Scanned Code To</span>
            <select
              value={payload.targetVar || ''}
              onChange={(e) => onChangePayload({ targetVar: e.target.value })}
              className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[180px]"
            >
              <option value="">Select variable...</option>
              {variables.map(v => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        );

      default:
        return (
          <div className="text-xs text-slate-400 italic">
            Standard parameter configuration
          </div>
        );
    }
  };

  // Execute trigger in test mode
  const handleTestRun = () => {
    let actionsExecuted = 0;
    let description = [];

    (trigger.clauses || []).forEach((clause, ci) => {
      (clause.actions || []).forEach(act => {
        actionsExecuted++;
        if (act.type === 'SET_VARIABLE') {
          description.push(`Set variable '${act.payload?.varPath || 'var'}' = '${act.payload?.value || 'val'}'`);
        } else if (act.type === 'SHOW_TOAST') {
          description.push(`Show Toast: "${act.payload?.message || 'Message'}"`);
        } else if (act.type === 'GO_TO_SCREEN') {
          const sName = screens.find(s => s.id === act.payload?.targetScreenId)?.title || 'Target Screen';
          description.push(`Go to Screen: ${sName}`);
        } else {
          description.push(`Executed action: ${act.type}`);
        }
      });
    });

    setTestResult({
      success: true,
      message: `${actionsExecuted} actions successfully tested.`,
      details: description
    });

    if (onTestTrigger) {
      onTestTrigger(trigger);
    }
  };

  const handleSave = () => {
    onSave(trigger);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150">
      <div
        className={`bg-[#f1f5f9] rounded-2xl shadow-2xl border border-slate-300 flex flex-col overflow-hidden transition-all duration-200 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-[980px] max-w-full max-h-[95vh] h-[850px]'
        }`}
      >
        {/* Header (Matching Mavi AppBuilder New Trigger Header) */}
        <div className="px-6 py-3.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4 flex-1">
            {/* Trigger Title & Source Type */}
            <div className="flex flex-col gap-0.5 max-w-sm flex-1">
              <input
                type="text"
                value={trigger.name}
                onChange={(e) => setTrigger({ ...trigger, name: e.target.value })}
                placeholder="New Trigger"
                className="text-lg font-black text-slate-800 bg-[#f5f3ff] border border-[#ddd6fe] focus:border-[#7c3aed] focus:ring-2 focus:ring-[#7c3aed]/20 rounded-lg px-2.5 py-1 transition-all outline-none"
              />
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-0.5">
                {sourceType} TRIGGER • {trigger.event}
              </span>
            </div>

            {/* Active Switcher Pill */}
            <div
              className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
                trigger.enabled
                  ? 'bg-[#f5f3ff] border-[#ddd6fe] text-[#7c3aed]'
                  : 'bg-slate-100 border-slate-200 text-slate-400'
              }`}
            >
              <span className="text-[11px] font-bold tracking-tight">
                {trigger.enabled ? 'ACTIVE' : 'INACTIVE'}
              </span>
              <button
                type="button"
                onClick={() => setTrigger({ ...trigger, enabled: !trigger.enabled })}
                className={`w-9 h-5 rounded-full p-0.5 transition-colors relative ${
                  trigger.enabled ? 'bg-[#8b5cf6]' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    trigger.enabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMaximized(!isMaximized)}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 shadow-xs">
            
            {/* 1. When Section */}
            <div className="space-y-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">When</span>
                <select
                  value={trigger.event}
                  onChange={(e) => setTrigger({ ...trigger, event: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold bg-white text-slate-700 shadow-3xs outline-none focus:border-blue-500"
                >
                  {getEventOptions().map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* P2: Specific Machine IoT Configuration for ON_TAG_CHANGE and ON_PLC_ALARM */}
              {(trigger.event === 'ON_TAG_CHANGE' || trigger.event === 'ON_PLC_ALARM') && (
                <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-900">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                    <span>Konfigurasi Tag PLC & Ambang Batas Sensor</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Target PLC Tag / Topic</label>
                      <select
                        value={trigger.tag || ''}
                        onChange={(e) => setTrigger({ ...trigger, tag: e.target.value })}
                        className="w-full p-1.5 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
                      >
                        <option value="">(Semua Perubahan Tag / Universal)</option>
                        <option value="ns=2;s=SpindleSpeed">ns=2;s=SpindleSpeed (OPC-UA RPM)</option>
                        <option value="ns=2;s=Temperature">ns=2;s=Temperature (OPC-UA Suhu °C)</option>
                        <option value="ns=2;s=Status">ns=2;s=Status (OPC-UA Mesin State)</option>
                        <option value="40001">40001 (Modbus Holding Register)</option>
                        <option value="10001">10001 (Modbus Discrete Input Coil)</option>
                        <option value="mavi/machine/line1/speed">mavi/machine/line1/speed (MQTT)</option>
                        <option value="mavi/machine/line1/pressure">mavi/machine/line1/pressure (MQTT)</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Atau masukkan tag kustom (cth: DB10.DBD24)..."
                        value={trigger.tag || ''}
                        onChange={(e) => setTrigger({ ...trigger, tag: e.target.value })}
                        className="w-full mt-1 p-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                      />
                    </div>

                    {trigger.event === 'ON_PLC_ALARM' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-600 uppercase block">Syarat Alarm (Threshold)</label>
                        <div className="flex items-center gap-1.5">
                          <select
                            value={trigger.alarmComparator || '>'}
                            onChange={(e) => setTrigger({ ...trigger, alarmComparator: e.target.value })}
                            className="p-1.5 border border-slate-300 rounded-lg bg-white font-bold text-xs"
                          >
                            <option value=">">&gt; (Lebih Dari)</option>
                            <option value=">=">&gt;= (Lebih Dari / Sama)</option>
                            <option value="<">&lt; (Kurang Dari)</option>
                            <option value="<=">&lt;= (Kurang Dari / Sama)</option>
                            <option value="==">== (Sama Dengan)</option>
                          </select>
                          <input
                            type="text"
                            placeholder="Nilai batas (cth: 85)"
                            value={trigger.alarmThreshold !== undefined ? trigger.alarmThreshold : '80'}
                            onChange={(e) => setTrigger({ ...trigger, alarmThreshold: e.target.value })}
                            className="flex-1 p-1.5 border border-slate-300 rounded-lg bg-white font-mono text-xs font-bold"
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 block">
                          Jika nilai tag melampaui batas, trigger akan dipicu otomatis oleh sensor tanpa klik operator.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Stop remaining triggers on error */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <div className="text-xs font-bold text-slate-800">Stop remaining triggers on error</div>
                <div className="text-[11px] text-slate-400">If an action errors, cancel subsequent triggers in this event.</div>
              </div>
              <button
                type="button"
                onClick={() => setTrigger({ ...trigger, stopOnError: !trigger.stopOnError })}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors relative ${
                  trigger.stopOnError ? 'bg-sky-500' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                    trigger.stopOnError ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 3. Clauses (If / Else If with Conditions and Then Actions) */}
            {trigger.clauses.map((clause, cIdx) => (
              <div key={clause.id || cIdx} className="space-y-4 pt-1">
                {/* Clause Conditions Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-900 text-sm">
                      {cIdx === 0 ? 'If' : 'Else If'}
                    </span>
                    <select
                      value={clause.match || 'ALL'}
                      onChange={(e) => {
                        const next = [...trigger.clauses];
                        next[cIdx].match = e.target.value;
                        setTrigger({ ...trigger, clauses: next });
                      }}
                      className="px-2 py-1 rounded border border-slate-300 text-xs font-bold bg-white"
                    >
                      <option value="ALL">all</option>
                      <option value="ANY">any</option>
                    </select>
                    <span className="text-slate-600">of the following conditions are met:</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {cIdx > 0 && (
                      <button
                        type="button"
                        onClick={() => removeClause(cIdx)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Remove Clause"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => addCondition(cIdx)}
                      className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-md shadow-2xs transition-colors flex items-center gap-1 active:scale-95"
                    >
                      Add new condition
                    </button>
                  </div>
                </div>

                {/* Conditions Container */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                  {clause.conditions.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 italic bg-slate-50 text-center sm:text-left">
                      No conditions added.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200 p-2 space-y-2 bg-white">
                      {clause.conditions.map((cond, condIdx) => (
                        <div key={cond.id || condIdx} className="flex items-center gap-2 pt-2 first:pt-0">
                          {/* Left variable */}
                          <select
                            value={cond.leftValue || ''}
                            onChange={(e) => updateCondition(cIdx, condIdx, { leftValue: e.target.value })}
                            className="p-1.5 border border-slate-300 rounded text-xs bg-white flex-1"
                          >
                            <option value="">Select variable...</option>
                            {variables.map(v => (
                              <option key={v.name} value={v.name}>{v.name}</option>
                            ))}
                          </select>

                          {/* Operator */}
                          <select
                            value={cond.operator || '=='}
                            onChange={(e) => updateCondition(cIdx, condIdx, { operator: e.target.value })}
                            className="p-1.5 border border-slate-300 rounded text-xs bg-white font-mono font-bold"
                          >
                            <option value="==">== (equals)</option>
                            <option value="!=">!= (not equals)</option>
                            <option value=">">&gt; (greater than)</option>
                            <option value="<">&lt; (less than)</option>
                            <option value=">=">&gt;= (greater/equal)</option>
                            <option value="<=">&lt;= (less/equal)</option>
                            <option value="CONTAINS">contains</option>
                          </select>

                          {/* Right value */}
                          <input
                            type="text"
                            value={cond.rightValue || ''}
                            onChange={(e) => updateCondition(cIdx, condIdx, { rightValue: e.target.value })}
                            placeholder="Static value..."
                            className="p-1.5 border border-slate-300 rounded text-xs bg-white flex-1"
                          />

                          {/* Delete condition */}
                          <button
                            type="button"
                            onClick={() => removeCondition(cIdx, condIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Then Actions Header */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-slate-900">
                    Then <span className="text-xs font-normal text-slate-600">perform the following actions:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addAction(cIdx)}
                    className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-md shadow-2xs transition-colors active:scale-95"
                  >
                    Add new action
                  </button>
                </div>

                {/* Then Actions List */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
                  {clause.actions.length === 0 ? (
                    <div className="p-3 text-xs text-slate-400 italic bg-slate-50 text-center sm:text-left">
                      No actions added.
                    </div>
                  ) : (
                    clause.actions.map((act, aIdx) => (
                      <div key={act.id || aIdx} className="p-3 flex items-start sm:items-center gap-3 bg-white hover:bg-slate-50/60 transition-colors">
                        <GripVertical className="w-4 h-4 text-slate-300 mt-1 sm:mt-0 shrink-0 cursor-grab" />
                        
                        {/* Action Type Selector matching Mavi AppBuilder */}
                        <select
                          value={act.type}
                          onChange={(e) => updateAction(cIdx, aIdx, { type: e.target.value, payload: {} })}
                          className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-700 min-w-[210px] shadow-3xs"
                        >
                          {ACTION_CATEGORIES.map(group => (
                            <optgroup key={group.label} label={group.label}>
                              {group.actions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>

                        {/* Action Parameters */}
                        {renderActionFields(act, (updates) => {
                          const nextPayload = { ...(act.payload || {}), ...updates };
                          updateAction(cIdx, aIdx, { payload: nextPayload });
                        })}

                        {/* Delete Action */}
                        <button
                          type="button"
                          onClick={() => removeAction(cIdx, aIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                          title="Delete Action"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}

            {/* Add If/Then Clause Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={addClause}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add If/Then Clause</span>
              </button>
            </div>

            {/* 4. Else perform the following actions */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  Else <span className="text-xs font-normal text-slate-600">perform the following actions:</span>
                </span>
                <button
                  type="button"
                  onClick={addElseAction}
                  className="px-3 py-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-md shadow-2xs transition-colors active:scale-95"
                >
                  Add new action
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white divide-y divide-slate-100">
                {(trigger.elseActions || []).length === 0 ? (
                  <div className="p-3 text-xs text-slate-400 italic bg-slate-50 text-center sm:text-left">
                    No actions added.
                  </div>
                ) : (
                  trigger.elseActions.map((act, eIdx) => (
                    <div key={act.id || eIdx} className="p-3 flex items-start sm:items-center gap-3 bg-white hover:bg-slate-50/60 transition-colors">
                      <GripVertical className="w-4 h-4 text-slate-300 mt-1 sm:mt-0 shrink-0 cursor-grab" />
                      
                      <select
                        value={act.type}
                        onChange={(e) => updateElseAction(eIdx, { type: e.target.value, payload: {} })}
                        className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-700 min-w-[210px] shadow-3xs"
                      >
                        {ACTION_CATEGORIES.map(group => (
                          <optgroup key={group.label} label={group.label}>
                            {group.actions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>

                      {renderActionFields(act, (updates) => {
                        const nextPayload = { ...(act.payload || {}), ...updates };
                        updateElseAction(eIdx, { payload: nextPayload });
                      })}

                      <button
                        type="button"
                        onClick={() => removeElseAction(eIdx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Test Result Feedback Box */}
            {testResult && (
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-purple-900">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>{testResult.message}</span>
                </div>
                <ul className="list-disc list-inside text-purple-800 text-[11px] space-y-0.5 pl-2">
                  {testResult.details.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

          </div>
        </div>

        {/* Footer (Matching Mavi AppBuilder New Trigger Footer) */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div>
            {initialTrigger && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Delete this trigger?')) {
                    onDelete(initialTrigger.id);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Trigger</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Test Button (Purple Pill) */}
            <button
              type="button"
              onClick={handleTestRun}
              className="px-5 py-2 rounded-xl bg-[#f5f3ff] hover:bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe] text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-3xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Test</span>
            </button>

            {/* Cancel */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* Save Trigger (Solid Blue) */}
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-extrabold shadow-md transition-colors cursor-pointer active:scale-95"
            >
              Save Trigger
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default TriggerEditorModal;
