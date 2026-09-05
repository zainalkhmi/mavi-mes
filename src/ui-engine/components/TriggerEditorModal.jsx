import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Trash2, Maximize2, Minimize2, Play, 
  GripVertical, CheckCircle2, AlertTriangle, Info, 
  ChevronDown, Layers, Zap, ToggleLeft, Sparkles, Pencil
} from 'lucide-react';

/**
 * Action Categories matching Mavi AppBuilder standard
 */
export const ACTION_CATEGORIES = [
  {
    label: 'Variables',
    actions: [
      { value: 'SET_VARIABLE', label: 'Variable: Set' },
      { value: 'INCREMENT_VARIABLE', label: 'Variable: Increment' },
      { value: 'CLEAR_VARIABLE', label: 'Variable: Clear' },
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
    label: 'Table Records',
    actions: [
      { value: 'TABLE_RECORD_LOAD', label: 'Table Record: Load' },
      { value: 'TABLE_RECORD_CREATE', label: 'Table Record: Create' },
      { value: 'TABLE_RECORD_SAVE', label: 'Table Record: Save (Update)' },
      { value: 'TABLE_RECORD_DELETE', label: 'Table Record: Delete' },
      { value: 'CLEAR_RECORD_PLACEHOLDER', label: 'Table Record: Clear Placeholder' },
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
    if (sourceType === 'WIDGET') {
      const type = sourceComponent?.type || '';
      if (['Button', 'FAB', 'Dropdown'].includes(type)) {
        return [
          { value: 'ON_CLICK', label: 'button is pressed' },
          { value: 'ON_CHANGE', label: 'data changes' }
        ];
      }
      if (['QRCodeScanner'].includes(type)) {
        return [
          { value: 'ON_SCAN', label: 'barcode/QR is scanned' },
          { value: 'ON_CHANGE', label: 'data changes' }
        ];
      }
      if (['Camera'].includes(type)) {
        return [
          { value: 'ON_CAPTURE', label: 'photo is captured' },
          { value: 'ON_CHANGE', label: 'data changes' }
        ];
      }
      return [
        { value: 'ON_CHANGE', label: 'data changes' },
        { value: 'ON_CLICK', label: 'widget is clicked' },
        { value: 'ON_SUBMIT', label: 'form submitted' }
      ];
    }
    if (sourceType === 'SCREEN') {
      return [
        { value: 'ON_SCREEN_LOAD', label: 'Screen is opened' },
        { value: 'ON_SCREEN_LEAVE', label: 'Screen is closed' },
        { value: 'TIMER', label: 'timer' }
      ];
    }
    return [
      { value: 'ON_APP_START', label: 'App is started' },
      { value: 'ON_APP_COMPLETE', label: 'App is completed' }
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

      case 'TABLE_RECORD_LOAD':
      case 'TABLE_RECORD_CREATE':
        return (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-500 min-w-[70px]">Placeholder</span>
              <select
                value={payload.placeholderId || ''}
                onChange={(e) => onChangePayload({ placeholderId: e.target.value })}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs min-w-[140px]"
              >
                <option value="">Select placeholder...</option>
                {recordPlaceholders.map(rp => (
                  <option key={rp.id} value={rp.id}>{rp.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 flex-1">
              <span className="font-semibold text-slate-500 min-w-[65px]">{act.type === 'TABLE_RECORD_CREATE' ? 'Record ID (Opt)' : 'Record ID'}</span>
              <input
                type="text"
                value={payload.idValue || ''}
                onChange={(e) => onChangePayload({ idValue: e.target.value })}
                placeholder={act.type === 'TABLE_RECORD_CREATE' ? 'Empty for Auto ID' : 'Static ID / Barcode'}
                className="p-1.5 border border-slate-300 rounded-lg bg-white text-xs flex-1"
              />
            </div>
          </div>
        );

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
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
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
