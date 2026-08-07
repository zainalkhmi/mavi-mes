import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background, Controls, MiniMap, Handle, Position,
  useNodesState, useEdgesState, addEdge
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {
  Layout, Database, Cpu, Zap, Sparkles, Search, Plus, Code,
  RefreshCw, Network, X, Variable, Trash2, ArrowRight, PlayCircle,
  CheckCircle, Navigation, Save, AlertTriangle, Radio, Send,
  Monitor, Play, Terminal, Check, ChevronDown, Filter,
  Settings, Layers, ToggleLeft, Sliders, Camera, Activity,
  MousePointer2, BarChart2, Ruler, Factory, Box, Download, Upload,
  Undo2, Redo2, GitBranch, ShieldCheck, Copy, Clipboard, ClipboardPaste
} from 'lucide-react';

// ─── WIDGET TYPE META MAP ────────────────────────────────────────────────────
const WIDGET_META = {
  BUTTON:             { icon: <MousePointer2 size={13}/>, color: '#6366f1', bg: '#eef2ff', border: '#c7d2fe', label: 'Button' },
  TEXT:               { icon: <Layout size={13}/>,        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', label: 'Text' },
  TEXT_INPUT:         { icon: <Layout size={13}/>,        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', label: 'Text Input' },
  NUMBER_INPUT:       { icon: <Layout size={13}/>,        color: '#0369a1', bg: '#f0f9ff', border: '#bae6fd', label: 'Number Input' },
  BOOLEAN_TOGGLE:     { icon: <ToggleLeft size={13}/>,    color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Toggle' },
  DROPDOWN:           { icon: <ChevronDown size={13}/>,   color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Dropdown' },
  SLIDER:             { icon: <Sliders size={13}/>,       color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Slider' },
  CHECKBOX:           { icon: <Check size={13}/>,         color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', label: 'Checkbox' },
  CHECKLIST:          { icon: <Check size={13}/>,         color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Checklist' },
  CAMERA_CAPTURE:     { icon: <Camera size={13}/>,        color: '#be123c', bg: '#fff1f2', border: '#fecdd3', label: 'Camera' },
  OPENCV_CAMERA:      { icon: <Camera size={13}/>,        color: '#be123c', bg: '#fff1f2', border: '#fecdd3', label: 'Vision Cam' },
  CHART:              { icon: <BarChart2 size={13}/>,     color: '#6d28d9', bg: '#faf5ff', border: '#e9d5ff', label: 'Chart' },
  GAUGE:              { icon: <Activity size={13}/>,      color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', label: 'Gauge' },
  DIAL_GAUGE:         { icon: <Activity size={13}/>,      color: '#0e7490', bg: '#ecfeff', border: '#a5f3fc', label: 'Dial Gauge' },
  INTERACTIVE_TABLE:  { icon: <Database size={13}/>,      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Table' },
  RECORD_DISPLAY:     { icon: <Database size={13}/>,      color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', label: 'Record' },
  IMAGE:              { icon: <Camera size={13}/>,        color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', label: 'Image' },
  ARDUINO_BOARD:      { icon: <Cpu size={13}/>,           color: '#00787a', bg: '#f0fdfd', border: '#a5f3fc', label: 'Arduino' },
  SCADA_VALVE:        { icon: <Settings size={13}/>,      color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'SCADA Valve' },
  SCADA_PUMP:         { icon: <Activity size={13}/>,      color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'SCADA Pump' },
  SCADA_OEE:          { icon: <Factory size={13}/>,       color: '#a855f7', bg: '#faf5ff', border: '#e9d5ff', label: 'OEE Widget' },
  SCADA_ALARM_BANNER: { icon: <AlertTriangle size={13}/>, color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Alarm Banner' },
  SCADA_MACHINE_STATUS:{icon: <Activity size={13}/>,      color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', label: 'Machine Status'},
  SCADA_PROD_COUNTER: { icon: <Factory size={13}/>,       color: '#7c3aed', bg: '#faf5ff', border: '#e9d5ff', label: 'Prod Counter' },
  QUALITY_PASS_FAIL:  { icon: <CheckCircle size={13}/>,   color: '#15803d', bg: '#f0fdf4', border: '#bbf7d0', label: 'Pass/Fail' },
  QUALITY_TOLERANCE:  { icon: <Ruler size={13}/>,         color: '#b45309', bg: '#fffbeb', border: '#fde68a', label: 'Tolerance' },
  MEASUREMENT_WIDGET: { icon: <Ruler size={13}/>,         color: '#0f766e', bg: '#f0fdfa', border: '#99f6e4', label: 'Measurement' },
};
const getWidgetMeta = (t) =>
  WIDGET_META[t] || { icon: <Box size={13}/>, color:'#475569', bg:'#f8fafc', border:'#e2e8f0', label:(t||'Widget').replace(/_/g,' ') };

// ─── EVENTS PER WIDGET TYPE ──────────────────────────────────────────────────
const WIDGET_EVENTS = {
  BUTTON:['onClick','onLongPress'], TEXT_INPUT:['onChange','onFocus','onBlur','onSubmit'],
  NUMBER_INPUT:['onChange','onSubmit'], BOOLEAN_TOGGLE:['onChange','onToggleOn','onToggleOff'],
  DROPDOWN:['onChange','onOpen'], SLIDER:['onChange','onSlideEnd'], CHECKBOX:['onChange'],
  CHECKLIST:['onItemCheck','onAllComplete'], CAMERA_CAPTURE:['onCapture','onError'],
  OPENCV_CAMERA:['onCapture','onDetect','onError'], CHART:['onDataUpdate','onClick'],
  GAUGE:['onThresholdCross'], INTERACTIVE_TABLE:['onRowClick','onRowAdd','onRowDelete'],
  SCADA_BTN_START:['onClick'], SCADA_BTN_STOP:['onClick'], SCADA_TOGGLE_SWITCH:['onChange'],
  SCADA_ALARM_BANNER:['onAlarmAck','onAlarmClear'], SCADA_OEE:['onUpdate','onThresholdCross'],
  QUALITY_PASS_FAIL:['onPass','onFail','onChange'], ARDUINO_BOARD:['onData','onConnect','onDisconnect'],
};
const getWidgetEvents = (t) => WIDGET_EVENTS[t] || ['onClick','onChange','onEvent'];

// ─── PROPS SCHEMA ────────────────────────────────────────────────────────────
const WIDGET_PROPS = {
  BUTTON:['label','text','color','backgroundColor','width','height','disabled','visible'],
  TEXT:['text','fontSize','fontWeight','color','width','height','visible'],
  TEXT_INPUT:['placeholder','label','value','required','maxLength','width','height','visible'],
  NUMBER_INPUT:['placeholder','label','value','min','max','step','width','height'],
  DROPDOWN:['label','options','value','width','height','visible'],
  SLIDER:['min','max','step','value','label','width','visible'],
  CHECKBOX:['label','checked','visible'],
  GAUGE:['min','max','value','label','unit','thresholdWarning','thresholdCritical'],
  CHART:['title','chartType','dataSource','width','height'],
  INTERACTIVE_TABLE:['tableId','columns','filterColumn','editable','width','height'],
  SCADA_OEE:['targetOEE','machineId','refreshInterval'],
  ARDUINO_BOARD:['port','baudRate','autoConnect'],
  QUALITY_TOLERANCE:['label','nominalValue','upperTolerance','lowerTolerance','unit'],
  MEASUREMENT_WIDGET:['label','deviceId','unit','precision'],
};
const getWidgetProps = (t) => WIDGET_PROPS[t] || ['label','value','visible','width','height'];

// ─── NODE BASE COMPONENT ──────────────────────────────────────────────────────
const NodeBlock = ({ icon, label, sublabel, color, selected, targetId='target', sourceId='source', isGlowing=false }) => (
  <div style={{ position:'relative', userSelect:'none', cursor:'pointer' }}>
    <Handle type="target" position={Position.Left} id={targetId}
      style={{ width:10,height:10,background:color,border:'2px solid #fff',borderRadius:'50%',left:-5,zIndex:10 }}/>
    <div style={{
      display:'flex',alignItems:'center',gap:'8px',minWidth:'175px',maxWidth:'260px',height:'38px',
      padding:'0 10px 0 6px',backgroundColor:color,color:'#fff',borderRadius:'6px',
      border:selected?`2px solid #fff`:isGlowing?'2px solid #22c55e':'1px solid rgba(0,0,0,0.2)',
      boxShadow:isGlowing?'0 0 16px #22c55e, 0 0 24px rgba(34,197,94,0.6)':selected?`0 0 0 3px ${color}88,0 6px 16px rgba(0,0,0,0.15)`:'0 2px 8px rgba(0,0,0,0.1)',
      transition:'all 0.2s ease',fontFamily:"'Inter',system-ui,sans-serif"
    }}>
      <div style={{width:26,height:26,borderRadius:'4px',backgroundColor:'rgba(0,0,0,0.18)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,color:'#fff'}}>{icon}</div>
      <div style={{flex:1,overflow:'hidden'}}>
        <div style={{fontSize:'0.78rem',fontWeight:800,color:'#fff',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',lineHeight:1.2}}>{label}</div>
        {sublabel&&<div style={{fontSize:'0.58rem',fontWeight:700,color:'rgba(255,255,255,0.85)',textTransform:'uppercase',letterSpacing:'0.05em',marginTop:'1px'}}>{sublabel}</div>}
      </div>
      <div style={{width:7,height:7,borderRadius:'50%',backgroundColor:isGlowing?'#22c55e':'#fff',opacity:0.9,flexShrink:0,boxShadow:isGlowing?'0 0 8px #22c55e':'none'}}/>
    </div>
    <Handle type="source" position={Position.Right} id={sourceId}
      style={{width:10,height:10,background:color,border:'2px solid #fff',borderRadius:'50%',right:-5,zIndex:10}}/>
  </div>
);

const WidgetNode    = ({data,selected}) => { const m=getWidgetMeta(data.widgetType||data.type); return <NodeBlock icon={m.icon} label={data.label} sublabel={data.widgetType||data.type||'Widget'} color={m.color} selected={selected} isGlowing={data.isGlowing} targetId="prop_input" sourceId="event_output"/>; };
const ScreenStepNode= ({data,selected}) => <NodeBlock icon={<Monitor size={15}/>} label={data.label} sublabel="Screen Step" color="#0284c7" selected={selected} isGlowing={data.isGlowing} targetId="step_in" sourceId="step_out"/>;
const TriggerNode   = ({data,selected}) => <NodeBlock icon={<PlayCircle size={15}/>} label={data.label} sublabel={`WHEN:${data.event||'event'}`} color="#e11d48" selected={selected} isGlowing={data.isGlowing} targetId="trig_in" sourceId="trig_out"/>;
const ActionNode    = ({data,selected}) => <NodeBlock icon={<ArrowRight size={15}/>} label={data.label} sublabel={`THEN:${data.actionType||'action'}`} color="#8b5cf6" selected={selected} isGlowing={data.isGlowing} targetId="act_in" sourceId="act_out"/>;
const VariableNode  = ({data,selected}) => <NodeBlock icon={<Variable size={15}/>} label={data.label} sublabel={`VAR(${data.varType||'str'})`} color="#10b981" selected={selected} isGlowing={data.isGlowing} targetId="var_input" sourceId="var_output"/>;
const TableNode     = ({data,selected}) => <NodeBlock icon={<Database size={15}/>} label={data.label} sublabel="DB Table" color="#00A09D" selected={selected} isGlowing={data.isGlowing} targetId="query_input" sourceId="data_output"/>;
const MachineNode   = ({data,selected}) => <NodeBlock icon={<Cpu size={15}/>} label={data.label} sublabel="PLC/Sensor" color="#f59e0b" selected={selected} isGlowing={data.isGlowing} targetId="cmd_input" sourceId="tag_output"/>;
const AutomationNode= ({data,selected}) => <NodeBlock icon={<Zap size={15}/>} label={data.label} sublabel="Automation" color="#714B67" selected={selected} isGlowing={data.isGlowing} targetId="exec_input" sourceId="workflow_output"/>;
const FunctionNode  = ({data,selected}) => <NodeBlock icon={<Code size={15}/>} label={data.label} sublabel="Function" color="#3b82f6" selected={selected} isGlowing={data.isGlowing} targetId="fn_params" sourceId="fn_result"/>;
const AiVisionNode  = ({data,selected}) => <NodeBlock icon={<Sparkles size={15}/>} label={data.label} sublabel="AI Vision" color="#ec4899" selected={selected} isGlowing={data.isGlowing} targetId="ai_input" sourceId="ai_result"/>;
const ConditionNode = ({data,selected}) => <NodeBlock icon={<GitBranch size={15}/>} label={data.label} sublabel={`IF/ELSE Branch (${data.conditions?.length||1})`} color="#f97316" selected={selected} isGlowing={data.isGlowing} targetId="cond_in" sourceId="cond_out"/>;
const AppTriggerNode= ({data,selected}) => <NodeBlock icon={<Zap size={15}/>} label={data.label} sublabel={`APP:${data.event||'EVENT'}`} color="#b45309" selected={selected} isGlowing={data.isGlowing} targetId="app_trig_in" sourceId="app_trig_out"/>;

const nodeTypes = {
  widget:WidgetNode, screen_step:ScreenStepNode, trigger:TriggerNode,
  action:ActionNode, variable:VariableNode, table:TableNode,
  machine:MachineNode, automation:AutomationNode, function:FunctionNode,
  aivision:AiVisionNode, condition:ConditionNode, app_trigger:AppTriggerNode
};

// ─── MAIN ENTERPRISE COMPONENT ───────────────────────────────────────────────
const AppNodeEditor = ({
  steps=[], currentStepId, baseComponents=[], tables=[], appVariables=[], appTriggers=[], onUpdateWidgetLogic
}) => {
  const [selectedEl, setSelectedEl]     = useState(null);
  const [searchQ, setSearchQ]           = useState('');
  const [paletteOpen, setPaletteOpen]   = useState(true);
  const [activeStepId, setActiveStepId] = useState(currentStepId||steps[0]?.id||'screen_1');
  const [running, setRunning]           = useState(false);
  const [consoleOpen, setConsoleOpen]   = useState(false);
  const [logs, setLogs]                 = useState([]);
  const [palTab, setPalTab]             = useState('WIDGETS');
  const [cats, setCats]                 = useState({});
  const [inspTab, setInspTab]           = useState('PROPS');
  const graphStore                      = useRef({});
  const fileInputRef                    = useRef(null);

  // Undo / Redo History Stack State
  const [historyStack, setHistoryStack] = useState([]);
  const [historyPointer, setHistoryPointer] = useState(-1);

  // Form State with Multi-Conditions & Branching (Enterprise)
  const [form, setForm] = useState({
    event:'onClick', actionType:'SET_VARIABLE',
    targetVar:'', targetStep:'', valueFormula:'',
    toastMessage:'',
    conditions: [{ var:'', op:'===', val:'', join:'AND' }],
    elseAction:'NONE', elseTarget:''
  });

  // All widgets for active step
  const activeStep = useMemo(()=>steps.find(s=>s.id===activeStepId)||steps[0],[steps,activeStepId]);
  const allWidgetsActive = useMemo(()=>[
    ...(baseComponents||[]).map(c=>({...c,_origin:'base',_stepId:null,_stepName:'Global (Base)'})),
    ...(activeStep?.components||[]).map(c=>({...c,_origin:'step',_stepId:activeStepId,_stepName:activeStep?.name||activeStep?.title||activeStepId}))
  ],[baseComponents,activeStep,activeStepId]);

  // All widgets across ALL steps
  const allWidgets = useMemo(()=>[
    ...(baseComponents||[]).map(c=>({...c,_origin:'base',_stepId:null,_stepName:'Global (Base)'})),
    ...steps.flatMap(step=>(step.components||[]).map(c=>({...c,_origin:'step',_stepId:step.id,_stepName:step.name||step.title||step.id})))
  ],[baseComponents,steps]);

  const filteredWidgets = useMemo(()=>{
    if(!searchQ) return allWidgets;
    const q=searchQ.toLowerCase();
    return allWidgets.filter(w=>(w.name||'').toLowerCase().includes(q)||(w.type||'').toLowerCase().includes(q)||(w.props?.label||'').toLowerCase().includes(q)||(w.props?.text||'').toLowerCase().includes(q));
  },[allWidgets,searchQ]);

  const widgetsByStep = useMemo(()=>{
    const map={};
    const base=filteredWidgets.filter(w=>w._origin==='base');
    if(base.length>0) map['__base__']={label:'Global (Base)',color:'#7c3aed',widgets:base};
    steps.forEach(step=>{
      const comps=filteredWidgets.filter(w=>w._stepId===step.id);
      if(comps.length>0) map[step.id]={label:step.name||step.title||step.id,color:'#0284c7',widgets:comps};
    });
    return map;
  },[filteredWidgets,steps]);

  // ─── GRAPH GENERATOR ────────────────────────────────────────────────────────
  const genGraph = useCallback((stepId)=>{
    const step=steps.find(s=>s.id===stepId);
    const comps=[...(baseComponents||[]),...(step?.components||[])];
    const nodes=[],edges=[];

    comps.forEach((c,i)=>{
      const m=getWidgetMeta(c.type);
      nodes.push({id:`nw_${c.id}`,type:'widget',position:{x:40,y:60+i*85},data:{
        id:c.id,label:c.name||c.props?.label||c.props?.text||c.type||'Widget',
        widgetType:c.type,type:c.type,stepId,props:c.props||{},logic:c.logic||null,events:getWidgetEvents(c.type)
      }});
    });

    let trigY = 60, actY = 60, createdTriggersCount = 0;

    comps.forEach((c)=>{
      const widgetNodeId = `nw_${c.id}`;
      const defaultEv = getWidgetEvents(c.type)[0] || 'onClick';

      if (Array.isArray(c.props?.triggers) && c.props.triggers.length > 0) {
        c.props.triggers.forEach((trg, tIdx) => {
          createdTriggersCount++;
          const trigId = `nt_${c.id}_trg_${tIdx}`;
          const evName = trg.event || defaultEv;
          nodes.push({
            id: trigId, type: 'trigger', position: { x: 310, y: trigY },
            data: { id: trigId, label: `${c.name || c.type}.${evName}`, event: evName, widgetId: c.id, stepId }
          });
          edges.push({
            id: `e_wt_${c.id}_${tIdx}`, source: widgetNodeId, sourceHandle: 'event_output',
            target: trigId, targetHandle: 'trig_in', type: 'smoothstep', animated: true,
            label: 'WHEN Event', labelStyle: { fontSize: '0.65rem', fill: '#e11d48', fontWeight: 800 },
            style: { stroke: '#e11d48', strokeWidth: 2 }
          });
          trigY += 85;

          const actionList = [];
          if (Array.isArray(trg.clauses)) {
            trg.clauses.forEach(clause => { if (Array.isArray(clause.actions)) actionList.push(...clause.actions); });
          }
          if (Array.isArray(trg.actions)) actionList.push(...trg.actions);
          if (actionList.length === 0) actionList.push({ type: 'SET_VARIABLE', payload: { targetVar: appVariables[0]?.name } });

          actionList.forEach((act, aIdx) => {
            const actId = `na_${c.id}_act_${tIdx}_${aIdx}`;
            const actType = act.type || 'SET_VARIABLE';
            const targetVar = act.payload?.variable || act.payload?.targetVar || '';
            const targetStep = act.payload?.stepId || act.payload?.targetStep || '';

            nodes.push({
              id: actId, type: 'action', position: { x: 560, y: actY },
              data: { id: actId, label: `${actType}`, actionType: actType, targetVar, targetStep }
            });
            edges.push({
              id: `e_ta_${trigId}_${actId}`, source: trigId, sourceHandle: 'trig_out',
              target: actId, targetHandle: 'act_in', type: 'smoothstep', animated: true,
              label: 'THEN Action', labelStyle: { fontSize: '0.65rem', fill: '#8b5cf6', fontWeight: 800 },
              style: { stroke: '#8b5cf6', strokeWidth: 2 }
            });
            actY += 85;

            if (targetVar) {
              const vNode = nodes.find(n => n.type === 'variable' && (n.data.id === targetVar || n.data.label === targetVar));
              if (vNode) edges.push({ id: `e_av_${actId}_${vNode.id}`, source: actId, sourceHandle: 'act_out', target: vNode.id, targetHandle: 'var_input', type: 'smoothstep', animated: true, label: 'Update Var', style: { stroke: '#10b981', strokeWidth: 2 } });
            }
          });
        });
      }

      if (c.props?.action) {
        createdTriggersCount++;
        const trigId = `nt_${c.id}_actprop`;
        nodes.push({ id: trigId, type: 'trigger', position: { x: 310, y: trigY }, data: { id: trigId, label: `${c.name || c.type}.onClick`, event: 'onClick', widgetId: c.id, stepId } });
        edges.push({ id: `e_wt_${c.id}_ap`, source: widgetNodeId, sourceHandle: 'event_output', target: trigId, targetHandle: 'trig_in', type: 'smoothstep', animated: true, label: 'WHEN Click', style: { stroke: '#e11d48', strokeWidth: 2 } });
        trigY += 85;

        const actId = `na_${c.id}_actprop`;
        const actType = c.props.action;
        nodes.push({ id: actId, type: 'action', position: { x: 560, y: actY }, data: { id: actId, label: `${actType}`, actionType: actType } });
        edges.push({ id: `e_ta_${trigId}_ap`, source: trigId, sourceHandle: 'trig_out', target: actId, targetHandle: 'act_in', type: 'smoothstep', animated: true, label: 'THEN Action', style: { stroke: '#8b5cf6', strokeWidth: 2 } });
        actY += 85;
      }

      if (c.logic?.code || c.logic?.xml || c.logic?.trigger) {
        createdTriggersCount++;
        const trigId = `nt_${c.id}_blockly`;
        const evName = c.logic?.trigger?.event || defaultEv;
        nodes.push({ id: trigId, type: 'trigger', position: { x: 310, y: trigY }, data: { id: trigId, label: `${c.name || c.type}.${evName}`, event: evName, widgetId: c.id, stepId } });
        edges.push({ id: `e_wt_${c.id}_b`, source: widgetNodeId, sourceHandle: 'event_output', target: trigId, targetHandle: 'trig_in', type: 'smoothstep', animated: true, label: 'WHEN Logic', style: { stroke: '#e11d48', strokeWidth: 2 } });
        trigY += 85;

        const actId = `na_${c.id}_blockly`;
        const actType = c.logic?.trigger?.actionType || 'EXECUTE_BLOCKLY';
        nodes.push({ id: actId, type: 'action', position: { x: 560, y: actY }, data: { id: actId, label: actType === 'EXECUTE_BLOCKLY' ? 'Blockly Script' : actType, actionType: actType } });
        edges.push({ id: `e_ta_${trigId}_b`, source: trigId, sourceHandle: 'trig_out', target: actId, targetHandle: 'act_in', type: 'smoothstep', animated: true, label: 'THEN Logic', style: { stroke: '#8b5cf6', strokeWidth: 2 } });
        actY += 85;
      }
    });

    if (createdTriggersCount === 0 && comps.length > 0) {
      const firstW = comps[0];
      const ev = getWidgetEvents(firstW.type)[0] || 'onClick';
      const trigId = `nt_${firstW.id}_init`;
      const actId = `na_${stepId}_init`;

      nodes.push({ id: trigId, type: 'trigger', position: { x: 310, y: 60 }, data: { id: trigId, label: `${firstW.name || firstW.type}.${ev}`, event: ev, widgetId: firstW.id, stepId } });
      edges.push({ id: `e_wt_${firstW.id}`, source: `nw_${firstW.id}`, sourceHandle: 'event_output', target: trigId, targetHandle: 'trig_in', type: 'smoothstep', animated: true, label: 'WHEN Event', style: { stroke: '#e11d48', strokeWidth: 2 } });

      nodes.push({ id: actId, type: 'action', position: { x: 560, y: 60 }, data: { id: actId, label: 'Set Variable Action', actionType: 'SET_VARIABLE', targetVar: appVariables[0]?.name || 'MyVar' } });
      edges.push({ id: `e_ta_${stepId}`, source: trigId, sourceHandle: 'trig_out', target: actId, targetHandle: 'act_in', type: 'smoothstep', animated: true, label: 'THEN Action', style: { stroke: '#8b5cf6', strokeWidth: 2 } });
    }

    (appVariables||[]).forEach((v,i)=>{
      const key=v.id||v.name;
      nodes.push({id:`nv_${key}`,type:'variable',position:{x:800,y:60+i*85},data:{id:key,label:v.name||'Variable',varType:v.type||'string',value:v.defaultValue}});
    });
    if(appVariables?.length>0&&nodes.some(n=>n.type==='action')){
      const firstAct = nodes.find(n=>n.type==='action');
      const vk=appVariables[0].id||appVariables[0].name;
      if (firstAct && !edges.some(e=>e.source===firstAct.id)) {
        edges.push({id:`e_av_${stepId}`,source:firstAct.id,sourceHandle:'act_out',target:`nv_${vk}`,targetHandle:'var_input',type:'smoothstep',animated:true,label:'Update State',style:{stroke:'#10b981',strokeWidth:2}});
      }
    }

    (tables||[]).slice(0,3).forEach((t,i)=>{
      nodes.push({id:`ntbl_${t.id}`,type:'table',position:{x:800,y:60+((appVariables?.length||0)+i)*85},data:{id:t.id,label:t.name||t.id}});
    });

    (steps||[]).forEach((st, i)=>{
      nodes.push({id:`ns_${st.id}`,type:'screen_step',position:{x:800,y:60+((appVariables?.length||0)+(tables?.length||0)+i)*85},data:{id:st.id,label:st.name||st.title||st.id,targetStepId:st.id}});
    });

    (appTriggers||[]).forEach((trg,i)=>{
      nodes.push({id:`nat_${trg.id}`,type:'app_trigger',position:{x:40,y:60+(comps.length+i)*85},data:{id:trg.id,label:trg.name||trg.event,event:trg.event,actions:trg.actions}});
    });

    return {nodes,edges};
  },[steps,baseComponents,appVariables,tables,appTriggers]);

  const init = useMemo(()=>genGraph(activeStepId),[genGraph,activeStepId]);
  const [nodes, setNodes, onNodesChange] = useNodesState(init.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(init.edges);

  // ─── UNDO / REDO HISTORY STACK ──────────────────────────────────────────────
  const pushStateToHistory = useCallback((newNodes, newEdges) => {
    setHistoryStack(stack => {
      const nextStack = stack.slice(0, historyPointer + 1);
      return [...nextStack, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryPointer(ptr => ptr + 1);
  }, [historyPointer]);

  const handleUndo = useCallback(() => {
    if (historyPointer > 0) {
      const prev = historyStack[historyPointer - 1];
      setNodes(prev.nodes);
      setEdges(prev.edges);
      setHistoryPointer(ptr => ptr - 1);
    }
  }, [historyPointer, historyStack, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (historyPointer < historyStack.length - 1) {
      const next = historyStack[historyPointer + 1];
      setNodes(next.nodes);
      setEdges(next.edges);
      setHistoryPointer(ptr => ptr + 1);
    }
  }, [historyPointer, historyStack, setNodes, setEdges]);

  const [contextMenu, setContextMenu] = useState(null);
  const [clipboardNode, setClipboardNode] = useState(null);

  // Context Menu Handlers
  const onNodeContextMenu = useCallback((event, node) => {
    event.preventDefault();
    setSelectedEl(node);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'node',
      targetNode: node
    });
  }, []);

  const onPaneContextMenu = useCallback((event) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'pane'
    });
  }, []);

  const onEdgeContextMenu = useCallback((event, edge) => {
    event.preventDefault();
    setSelectedEl(edge);
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      type: 'edge',
      targetEdge: edge
    });
  }, []);

  const copySelectedNode = useCallback((nodeToCopy) => {
    const target = nodeToCopy || (selectedEl && !selectedEl.source ? selectedEl : null);
    if (target) {
      setClipboardNode(target);
    }
    setContextMenu(null);
  }, [selectedEl]);

  const duplicateSelectedNode = useCallback((nodeToDup) => {
    const target = nodeToDup || (selectedEl && !selectedEl.source ? selectedEl : null);
    if (!target) return;
    const newId = `node_${Date.now()}`;
    const newNode = {
      ...target,
      id: newId,
      position: { x: (target.position?.x || 100) + 40, y: (target.position?.y || 100) + 40 },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedEl(newNode);
    setContextMenu(null);
  }, [selectedEl, setNodes]);

  const pasteNode = useCallback(() => {
    if (!clipboardNode) return;
    const newId = `node_${Date.now()}`;
    const mouseX = contextMenu?.x || 300;
    const mouseY = contextMenu?.y || 200;
    const newNode = {
      ...clipboardNode,
      id: newId,
      position: { x: mouseX - 200, y: mouseY - 100 },
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedEl(newNode);
    setContextMenu(null);
  }, [clipboardNode, contextMenu, setNodes]);

  const disconnectWires = useCallback((nodeId) => {
    if (!nodeId) return;
    setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setContextMenu(null);
  }, [setEdges]);

  const delSelected = useCallback(() => {
    if (!selectedEl) return;
    if (selectedEl.source) setEdges(eds => eds.filter(e => e.id !== selectedEl.id));
    else { setNodes(nds => nds.filter(n => n.id !== selectedEl.id)); setEdges(eds => eds.filter(e => e.source !== selectedEl.id && e.target !== selectedEl.id)); }
    setSelectedEl(null);
  }, [selectedEl, setNodes, setEdges]);

  // Keyboard shortcuts Ctrl+Z, Ctrl+Y, Ctrl+C, Ctrl+V, Ctrl+D, Del, Esc
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo(); else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedEl && !selectedEl.source) copySelectedNode(selectedEl);
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        pasteNode();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        if (selectedEl && !selectedEl.source) duplicateSelectedNode(selectedEl);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEl) delSelected();
      } else if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, selectedEl, copySelectedNode, pasteNode, duplicateSelectedNode, delSelected]);

  // ─── LIVE WIRE DRAG-TO-CONNECT LOGIC CREATION (AUTO-WIRING ENGINE) ────────
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    const edgeColor = sourceNode?.type === 'widget' ? '#e11d48' : sourceNode?.type === 'trigger' ? '#8b5cf6' : '#10b981';

    const newEdge = {
      ...params, type: 'smoothstep', animated: true,
      label: sourceNode?.type === 'widget' ? 'WHEN Event' : sourceNode?.type === 'trigger' ? 'THEN Action' : 'Data Wire',
      labelStyle: { fontSize: '0.65rem', fill: edgeColor, fontWeight: 800 },
      style: { stroke: edgeColor, strokeWidth: 3, filter: `drop-shadow(0 0 6px ${edgeColor})` }
    };

    setEdges(eds => {
      const updated = addEdge(newEdge, eds);
      pushStateToHistory(nodes, updated);
      return updated;
    });

    // AUTO-PERSIST LOGIC TO WIDGET ON CONNECT
    if (sourceNode && sourceNode.type === 'widget' && targetNode) {
      const widgetId = sourceNode.data.id;
      const defaultEv = sourceNode.data.events?.[0] || 'onClick';
      let autoCode = '';

      if (targetNode.type === 'variable') {
        autoCode = `setVariable("${targetNode.data.label}", "true");`;
      } else if (targetNode.type === 'screen_step') {
        autoCode = `navigateToStep("${targetNode.data.targetStepId || targetNode.data.id}");`;
      } else if (targetNode.type === 'table') {
        autoCode = `queryTable("${targetNode.data.id}");`;
      } else if (targetNode.type === 'action') {
        autoCode = `executeAction("${targetNode.data.actionType || 'SET_VARIABLE'}");`;
      }

      if (autoCode && onUpdateWidgetLogic && typeof onUpdateWidgetLogic === 'function') {
        onUpdateWidgetLogic(widgetId, '', `// Auto-Wired from Canvas\n${autoCode}`);
      }
    }
  }, [nodes, onUpdateWidgetLogic, setEdges, pushStateToHistory]);

  const switchStep = useCallback((sid) => {
    graphStore.current[activeStepId] = { nodes, edges };
    setActiveStepId(sid);
    const saved = graphStore.current[sid];
    if (saved) { setNodes(saved.nodes); setEdges(saved.edges); }
    else { const f = genGraph(sid); setNodes(f.nodes); setEdges(f.edges); }
    setSelectedEl(null);
  }, [activeStepId, nodes, edges, genGraph, setNodes, setEdges]);

  const addWidgetNode = useCallback((widget) => {
    setNodes(nds => {
      const next = [...nds, {
        id: `nw_${widget.id}_${Date.now()}`, type: 'widget',
        position: { x: 80 + Math.random() * 120, y: 80 + Math.random() * 200 },
        data: { id: widget.id, label: widget.name || widget.props?.label || widget.type || 'Widget', widgetType: widget.type, type: widget.type, props: widget.props || {}, logic: widget.logic || null, events: getWidgetEvents(widget.type) }
      }];
      pushStateToHistory(next, edges);
      return next;
    });
  }, [setNodes, edges, pushStateToHistory]);

  const addNode = useCallback((type, label, extra = {}) => {
    const pos = { trigger: { x: 310, y: 60 }, action: { x: 560, y: 60 }, variable: { x: 800, y: 60 }, machine: { x: 40, y: 300 } }[type] || { x: 200 + Math.random() * 150, y: 100 + Math.random() * 200 };
    setNodes(nds => {
      const next = [...nds, { id: `n_${type}_${Date.now()}`, type, position: pos, data: { label, ...extra } }];
      pushStateToHistory(next, edges);
      return next;
    });
  }, [setNodes, edges, pushStateToHistory]);

  const autoArrange = useCallback(() => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: 'LR', nodesep: 55, ranksep: 120 });
    nodes.forEach(n => g.setNode(n.id, { width: 220, height: 50 }));
    edges.forEach(e => g.setEdge(e.source, e.target));
    dagre.layout(g);
    setNodes(nds => nds.map(n => { const p = g.node(n.id); return p ? { ...n, position: { x: p.x - 110, y: p.y - 25 } } : n; }));
  }, [nodes, edges, setNodes]);

  // ─── LIVE SIGNAL PULSE SIMULATOR (GLOWING WIRES) ───────────────────────────
  const runTest = useCallback(() => {
    setRunning(true); setConsoleOpen(true); setLogs([]);
    const ts = () => new Date().toLocaleTimeString();
    const delay = ms => new Promise(r => setTimeout(r, ms));

    (async () => {
      setLogs(l => [...l, { time: ts(), text: `▶ Flow Test — Screen: ${activeStepId} (${nodes.length} nodes)`, type: 'info' }]);
      await delay(300);

      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        setNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, data: { ...nd.data, isGlowing: true } } : nd));

        // Highlight connecting edges with glowing green pulse
        const outgoingEdges = edges.filter(e => e.source === n.id);
        setEdges(eds => eds.map(e => outgoingEdges.some(oe => oe.id === e.id) ? {
          ...e, style: { stroke: '#22c55e', strokeWidth: 4, filter: 'drop-shadow(0 0 12px #22c55e)' }, animated: true
        } : e));

        setLogs(l => [...l, {
          time: ts(),
          text: n.type === 'widget' ? `📦 [WIDGET] ${n.data.label} (${n.data.widgetType || n.data.type}) ready`
              : n.type === 'trigger' ? `🔴 [EVENT TRIGGER] ${n.data.label} FIRED!`
              : n.type === 'action' ? `🟣 [ACTION EXEC] ${n.data.label} -> ${n.data.actionType}`
              : n.type === 'variable' ? `🟢 [STATE UPDATE] ${n.data.label} = active`
              : n.type === 'table' ? `🩵 [DB QUERY] ${n.data.label} -> OK`
              : `⚡ [NODE] ${n.data.label} processed`,
          type: n.type === 'trigger' ? 'event' : n.type === 'action' ? 'action' : n.type === 'variable' ? 'success' : 'info'
        }]);

        await delay(280);
        setNodes(nds => nds.map(nd => nd.id === n.id ? { ...nd, data: { ...nd.data, isGlowing: false } } : nd));
      }

      setEdges(eds => eds.map(e => ({ ...e, style: { stroke: '#6366f1', strokeWidth: 2 }, animated: true })));
      setLogs(l => [...l, { time: ts(), text: `✅ [TEST PASSED] All ${nodes.length} nodes & wires executed (0 Errors)`, type: 'success' }]);
      setRunning(false);
    })();
  }, [nodes, edges, activeStepId, setNodes, setEdges]);

  // ─── BLUEPRINT EXPORT & IMPORT (JSON SHARE) ─────────────────────────────────
  const handleExportBlueprint = useCallback(() => {
    const blueprint = {
      appName: 'Mavi Low-Code App Flow',
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      screenId: activeStepId,
      nodes, edges
    };
    const blob = new Blob([JSON.stringify(blueprint, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `flow_blueprint_${activeStepId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, activeStepId]);

  const handleImportBlueprint = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const json = JSON.parse(evt.target.result);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          pushStateToHistory(json.nodes, json.edges);
        }
      } catch (err) {
        alert('Invalid JSON Blueprint file');
      }
    };
    reader.readAsText(file);
  }, [setNodes, setEdges, pushStateToHistory]);

  // ─── SAVE LOGIC (WITH MULTI-CONDITIONS) ────────────────────────────────────
  const saveLogic = useCallback(() => {
    if (!selectedEl) return;
    const condStr = form.conditions.filter(c => c.var).map(c => `${c.var} ${c.op} "${c.val}"`).join(` ${form.conditions[0]?.join || 'AND'} `);
    const lbl = selectedEl.type === 'trigger' ? `WHEN ${form.event}` : selectedEl.type === 'action' ? `${form.actionType}:${form.targetVar || form.targetStep || '...'}` : selectedEl.data?.label;

    setNodes(nds => nds.map(n => n.id === selectedEl.id ? { ...n, data: { ...n.data, label: lbl, ...form } } : n));
    setSelectedEl(p => ({ ...p, data: { ...p.data, label: lbl, ...form } }));

    if (onUpdateWidgetLogic && typeof onUpdateWidgetLogic === 'function') {
      const widgetId = selectedEl.data?.widgetId || selectedEl.data?.id || (typeof selectedEl.id === 'string' && selectedEl.id.startsWith('nw_') ? selectedEl.id.replace(/^nw_/, '').split('_')[0] : null);
      if (widgetId) {
        const condCode = condStr ? `if (${condStr}) ` : '';
        let codeStr = '';
        if (form.actionType === 'SET_VARIABLE') codeStr = `${condCode}setVariable("${form.targetVar}", "${form.valueFormula || 'true'}");`;
        else if (form.actionType === 'NAVIGATE_STEP') codeStr = `${condCode}navigateToStep("${form.targetStep}");`;
        else if (form.actionType === 'SHOW_TOAST') codeStr = `${condCode}showToast("${form.toastMessage || 'Notification'}");`;
        else codeStr = `${condCode}executeAction("${form.actionType}");`;

        if (form.elseAction !== 'NONE' && form.elseTarget) {
          codeStr += ` else { executeAction("${form.elseAction}"); }`;
        }

        onUpdateWidgetLogic(widgetId, '', codeStr);
      }
    }
  }, [selectedEl, form, activeStepId, onUpdateWidgetLogic, setNodes]);



  const loadAndon = useCallback(() => {
    const t = Date.now();
    setNodes([
      { id: `an_btn_${t}`, type: 'widget', position: { x: 40, y: 60 }, data: { label: 'Andon Call Button', widgetType: 'BUTTON', type: 'BUTTON', events: ['onClick'] } },
      { id: `an_trig_${t}`, type: 'trigger', position: { x: 280, y: 60 }, data: { label: 'Button.onClick', event: 'onClick' } },
      { id: `an_plc_${t}`, type: 'machine', position: { x: 40, y: 160 }, data: { label: 'PLC Red Tower Light', tag: 'LIGHT_RED' } },
      { id: `an_db_${t}`, type: 'table', position: { x: 520, y: 160 }, data: { label: 'andon_incidents DB' } },
      { id: `an_var_${t}`, type: 'variable', position: { x: 520, y: 60 }, data: { label: 'Andon_Status', varType: 'CRITICAL' } },
      { id: `an_tg_${t}`, type: 'action', position: { x: 280, y: 160 }, data: { label: 'Telegram Alert', actionType: 'RUN_WORKFLOW' } },
    ]);
    setEdges([
      { id: `ae1_${t}`, source: `an_btn_${t}`, target: `an_trig_${t}`, type: 'smoothstep', animated: true, label: 'WHEN', style: { stroke: '#e11d48', strokeWidth: 2 } },
      { id: `ae2_${t}`, source: `an_trig_${t}`, target: `an_var_${t}`, type: 'smoothstep', animated: true, label: 'Set State', style: { stroke: '#10b981', strokeWidth: 2 } },
      { id: `ae3_${t}`, source: `an_trig_${t}`, target: `an_tg_${t}`, type: 'smoothstep', animated: true, label: 'THEN', style: { stroke: '#8b5cf6', strokeWidth: 2 } },
      { id: `ae4_${t}`, source: `an_tg_${t}`, target: `an_db_${t}`, type: 'smoothstep', animated: true, label: 'Log DB', style: { stroke: '#00A09D', strokeWidth: 2 } },
    ]);
  }, [setNodes, setEdges]);

  // UI helpers
  const toggleCat = key => setCats(p => ({ ...p, [key]: p[key] === false }));
  const PSection = ({ skey, title, color, icon, children }) => {
    const open = cats[skey] !== false;
    return (
      <div style={{ marginBottom: '8px' }}>
        <div onClick={() => toggleCat(skey)} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.67rem', fontWeight: 800, color, textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', padding: '4px 0', marginBottom: open ? '5px' : 0 }}>
          {icon}<span style={{ flex: 1 }}>{title}</span>
          <ChevronDown size={11} style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }} />
        </div>
        {open && <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>{children}</div>}
      </div>
    );
  };
  const PItem = ({ label, sublabel, icon, color, bg, border, onClick }) => (
    <div onClick={onClick} style={{ padding: '7px 9px', border: `1px solid ${border || '#e2e8f0'}`, borderRadius: '7px', backgroundColor: bg || '#f8fafc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.72rem', fontWeight: 700, color: color || '#1e293b', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = `0 2px 8px ${color}44`}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {sublabel && <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 600, background: '#f1f5f9', padding: '1px 5px', borderRadius: '4px', flexShrink: 0 }}>{sublabel}</span>}
      <Plus size={10} style={{ opacity: 0.35, flexShrink: 0 }} />
    </div>
  );

  // Inspector
  const renderInspector = () => {
    if (!selectedEl) return null;
    const isEdge = !!selectedEl.source;
    if (isEdge) return (
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.73rem' }}>
          <div style={{ fontWeight: 700, color: '#64748b', fontSize: '0.62rem', textTransform: 'uppercase', marginBottom: '8px' }}>Wire Connection</div>
          <div><b>From:</b> {selectedEl.source}</div>
          <div style={{ marginTop: '4px' }}><b>To:</b> {selectedEl.target}</div>
          {selectedEl.label && <div style={{ marginTop: '4px' }}><b>Label:</b> {selectedEl.label}</div>}
        </div>
        <button onClick={delSelected} style={{ padding: '8px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <Trash2 size={13} /> Delete Wire
        </button>
      </div>
    );

    const data = selectedEl.data || {};
    const wType = data.widgetType || data.type;
    const pSchema = getWidgetProps(wType);
    const aProps = data.props || {};
    const wEvents = data.events || getWidgetEvents(wType);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', flexShrink: 0 }}>
          {[['PROPS', '⚙ Props'], ['LOGIC', '⚡ Logic (Multi-IF)'], ['INFO', 'ℹ Info']].map(([id, lbl]) => (
            <button key={id} onClick={() => setInspTab(id)} style={{ flex: 1, padding: '8px 4px', fontSize: '0.63rem', fontWeight: 800, border: 'none', cursor: 'pointer', textTransform: 'uppercase', backgroundColor: inspTab === id ? '#fff' : 'transparent', color: inspTab === id ? '#6366f1' : '#94a3b8', borderBottom: inspTab === id ? '2px solid #6366f1' : '2px solid transparent', transition: 'all 0.15s' }}>{lbl}</button>
          ))}
        </div>
        <div style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>

          {inspTab === 'PROPS' && <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Node Type</div>
                <div style={{ fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>{selectedEl.type}</div>
              </div>
              {wType && <div style={{ padding: '3px 8px', background: getWidgetMeta(wType).bg, border: `1px solid ${getWidgetMeta(wType).border}`, borderRadius: '5px', fontSize: '0.6rem', fontWeight: 700, color: getWidgetMeta(wType).color }}>{wType}</div>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.62rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Name / Label</label>
              <input type="text" value={data.label || ''} onChange={e => { const v = e.target.value; setNodes(nds => nds.map(n => n.id === selectedEl.id ? { ...n, data: { ...n.data, label: v } } : n)); setSelectedEl(p => ({ ...p, data: { ...p.data, label: v } })); }} style={{ width: '100%', padding: '6px 9px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', fontWeight: 700, fontSize: '0.75rem', boxSizing: 'border-box' }} />
            </div>
            {selectedEl.type === 'widget' && (
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px' }}>Widget Properties ({pSchema.length})</div>
                {pSchema.map(pk => {
                  const v = aProps[pk];
                  return (
                    <div key={pk} style={{ marginBottom: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>{pk}</label>
                        {v !== undefined && <span style={{ fontSize: '0.57rem', background: '#e0e7ff', color: '#4338ca', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>set</span>}
                      </div>
                      <input type="text" defaultValue={typeof v === 'object' ? JSON.stringify(v) : (v ?? '')} placeholder={`${pk}...`} style={{ width: '100%', padding: '5px 8px', border: '1px solid #cbd5e1', borderRadius: '5px', fontSize: '0.7rem', outline: 'none', boxSizing: 'border-box', background: v !== undefined ? '#f0f9ff' : '#fff' }} />
                    </div>
                  );
                })}
              </div>
            )}
            <button onClick={delSelected} style={{ padding: '7px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '0.73rem' }}>
              <Trash2 size={13} /> Delete Node
            </button>
          </>}

          {/* ⚡ LOGIC TAB WITH MULTI-CONDITIONS & ELSE BRANCH */}
          {inspTab === 'LOGIC' && <>
            <div style={{ padding: '11px', background: '#fff1f2', borderRadius: '8px', border: '1px solid #fecdd3' }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#be123c', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><PlayCircle size={13} /> WHEN (Event Trigger)</div>
              <select value={form.event} onChange={e => setForm(f => ({ ...f, event: e.target.value }))} style={{ width: '100%', padding: '6px', fontSize: '0.72rem', border: '1px solid #fecdd3', borderRadius: '6px', outline: 'none', background: '#fff' }}>
                {(selectedEl.type === 'widget' ? wEvents : ['onClick', 'onChange', 'onStepEnter', 'timer', 'ON_APP_START', 'ON_VAR_CHANGE', 'onSubmit', 'onIoTSignal']).map(ev => <option key={ev} value={ev}>{ev}</option>)}
              </select>
            </div>

            {/* MULTI-CONDITION BRANCH BUILDER */}
            <div style={{ padding: '11px', background: '#fff7ed', borderRadius: '8px', border: '1px solid #fed7aa' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#c2410c', display: 'flex', alignItems: 'center', gap: '5px' }}><GitBranch size={13} /> IF Multi-Conditions</div>
                <button onClick={() => setForm(f => ({ ...f, conditions: [...f.conditions, { var: '', op: '===', val: '', join: 'AND' }] }))} style={{ fontSize: '0.6rem', color: '#c2410c', background: '#ffedd5', border: 'none', padding: '2px 6px', borderRadius: '4px', fontWeight: 800, cursor: 'pointer' }}>+ Add IF</button>
              </div>

              {form.conditions.map((c, idx) => (
                <div key={idx} style={{ marginBottom: '6px', paddingBottom: '6px', borderBottom: idx < form.conditions.length - 1 ? '1px dashed #fed7aa' : 'none' }}>
                  {idx > 0 && (
                    <select value={c.join} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, conditions: f.conditions.map((cd, i) => i === idx ? { ...cd, join: val } : cd) })); }} style={{ fontSize: '0.6rem', padding: '2px', margin: '3px 0', border: '1px solid #fed7aa', borderRadius: '4px', fontWeight: 800, color: '#ea580c' }}>
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                    </select>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 65px 1fr', gap: '4px' }}>
                    <input type="text" value={c.var} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, conditions: f.conditions.map((cd, i) => i === idx ? { ...cd, var: val } : cd) })); }} placeholder="Variable" style={{ padding: '4px 6px', border: '1px solid #fed7aa', borderRadius: '4px', fontSize: '0.68rem' }} />
                    <select value={c.op} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, conditions: f.conditions.map((cd, i) => i === idx ? { ...cd, op: val } : cd) })); }} style={{ padding: '4px', border: '1px solid #fed7aa', borderRadius: '4px', fontSize: '0.68rem' }}>
                      {['===', '!==', '>', '<', '>=', '<=', 'includes'].map(op => <option key={op}>{op}</option>)}
                    </select>
                    <input type="text" value={c.val} onChange={e => { const val = e.target.value; setForm(f => ({ ...f, conditions: f.conditions.map((cd, i) => i === idx ? { ...cd, val: val } : cd) })); }} placeholder="Value" style={{ padding: '4px 6px', border: '1px solid #fed7aa', borderRadius: '4px', fontSize: '0.68rem' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* THEN ACTION */}
            <div style={{ padding: '11px', background: '#faf5ff', borderRadius: '8px', border: '1px solid #e9d5ff' }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#6d28d9', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><ArrowRight size={13} /> THEN (Primary Action)</div>
              <select value={form.actionType} onChange={e => setForm(f => ({ ...f, actionType: e.target.value }))} style={{ width: '100%', padding: '6px', fontSize: '0.72rem', border: '1px solid #e9d5ff', borderRadius: '6px', outline: 'none', background: '#fff', marginBottom: '8px' }}>
                {[['SET_VARIABLE', 'Set App Variable'], ['NAVIGATE_STEP', 'Navigate Screen'], ['QUERY_TABLE', 'Query Database'], ['RUN_WORKFLOW', 'Run Automation'], ['SHOW_TOAST', 'Show Toast Alert'], ['CALL_API', 'Call External API'], ['PUBLISH_MQTT', 'Publish MQTT IoT'], ['WRITE_PLC', 'Write PLC Tag'], ['SEND_EMAIL', 'Send Email'], ['GENERATE_REPORT', 'Generate PDF Report'], ['PLAY_ALARM', 'Play Sound/Alarm']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              {form.actionType === 'SET_VARIABLE' && <>
                <select value={form.targetVar} onChange={e => setForm(f => ({ ...f, targetVar: e.target.value }))} style={{ width: '100%', padding: '6px', fontSize: '0.72rem', border: '1px solid #e9d5ff', borderRadius: '6px', outline: 'none', background: '#fff', marginBottom: '6px' }}>
                  <option value="">-- select variable --</option>
                  {(appVariables || []).map(v => <option key={v.id || v.name} value={v.name}>{v.name} ({v.type || 'string'})</option>)}
                </select>
                <input type="text" value={form.valueFormula} onChange={e => setForm(f => ({ ...f, valueFormula: e.target.value }))} placeholder="Value / Formula" style={{ width: '100%', padding: '6px', fontSize: '0.72rem', border: '1px solid #e9d5ff', borderRadius: '6px', outline: 'none', boxSizing: 'border-box' }} />
              </>}
            </div>

            {/* ELSE BRANCH */}
            <div style={{ padding: '11px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <div style={{ fontSize: '0.67rem', fontWeight: 800, color: '#15803d', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}><ShieldCheck size={13} /> ELSE (Fallback Branch)</div>
              <select value={form.elseAction} onChange={e => setForm(f => ({ ...f, elseAction: e.target.value }))} style={{ width: '100%', padding: '6px', fontSize: '0.72rem', border: '1px solid #bbf7d0', borderRadius: '6px', outline: 'none', background: '#fff' }}>
                <option value="NONE">None (Do Nothing)</option>
                <option value="SHOW_TOAST">Show Error Toast</option>
                <option value="SET_VARIABLE">Reset Variable</option>
                <option value="PLAY_ALARM">Trigger Alarm</option>
              </select>
            </div>

            <button onClick={saveLogic} style={{ padding: '9px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 2px 8px rgba(99,102,241,0.35)' }}>
              <Save size={14} /> Save Logic & Branching
            </button>
          </>}

          {inspTab === 'INFO' && <>
            <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>ID: </span><code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>{selectedEl.id}</code></div>
              <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Type: </span><code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>{selectedEl.type}</code></div>
              {wType && <div><span style={{ color: '#94a3b8', fontWeight: 700 }}>Widget: </span><code style={{ background: '#e2e8f0', padding: '1px 5px', borderRadius: '4px', fontSize: '0.65rem' }}>{wType}</code></div>}
            </div>
          </>}
        </div>
      </div>
    );
  };

  // ─── RENDER MAIN UI ──────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', minHeight: '600px', display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', overflow: 'hidden', fontFamily: "'Inter',system-ui,sans-serif" }}>

      {/* ─── ENTERPRISE TOP TOOLBAR ─── */}
      <header style={{
        height: '52px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        zIndex: 20,
        flexShrink: 0
      }}>
        {/* Left Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {!paletteOpen && (
            <button
              onClick={() => setPaletteOpen(true)}
              style={{
                padding: '6px 12px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: '#f8fafc',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Plus size={14} color="#6366f1" /> Palette
            </button>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} color="#6366f1" />
            <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#f8fafc', letterSpacing: '0.2px' }}>
              Node Canvas Palette
            </span>
          </div>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#334155', margin: '0 4px' }} />

          <button
            onClick={runTest}
            disabled={running}
            style={{
              padding: '6px 14px',
              backgroundColor: running ? '#15803d' : '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: running ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 0 14px rgba(34, 197, 94, 0.4)',
              transition: 'all 0.2s'
            }}
          >
            <Play size={14} fill="currentColor" /> {running ? 'Pulsing Live Signal...' : 'Play / Test Run Flow'}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '2px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button
              onClick={handleUndo}
              disabled={historyPointer <= 0}
              style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: historyPointer > 0 ? 'pointer' : 'default', color: historyPointer > 0 ? '#cbd5e1' : '#475569' }}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={14} />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyPointer >= historyStack.length - 1}
              style={{ padding: '5px 8px', border: 'none', background: 'none', cursor: historyPointer < historyStack.length - 1 ? 'pointer' : 'default', color: historyPointer < historyStack.length - 1 ? '#cbd5e1' : '#475569' }}
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={14} />
            </button>
          </div>
        </div>

        {/* Center Section: SCREEN SWITCHER DROPDOWN */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#1e293b', padding: '4px 10px', borderRadius: '8px', border: '1px solid #334155' }}>
          <Monitor size={14} color="#818cf8" />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>Screen:</span>
          <select
            value={activeStepId}
            onChange={(e) => switchStep(e.target.value)}
            style={{
              backgroundColor: '#0f172a',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              padding: '4px 8px',
              fontSize: '0.75rem',
              fontWeight: 700,
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {(steps || []).map(st => (
              <option key={st.id} value={st.id}>
                {st.name || st.title || st.id}
              </option>
            ))}
          </select>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={autoArrange}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#818cf8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RefreshCw size={13} /> Auto-Arrange
          </button>

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '2px', borderRadius: '8px', border: '1px solid #334155' }}>
            <button onClick={handleExportBlueprint} style={{ padding: '5px 9px', fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Export JSON Blueprint"><Download size={13} /> Export</button>
            <button onClick={() => fileInputRef.current?.click()} style={{ padding: '5px 9px', fontSize: '0.72rem', fontWeight: 800, color: '#c084fc', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }} title="Import JSON Blueprint"><Upload size={13} /> Import</button>
            <input type="file" ref={fileInputRef} onChange={handleImportBlueprint} accept=".json" style={{ display: 'none' }} />
          </div>

          <button
            onClick={loadAndon}
            style={{
              padding: '6px 12px',
              backgroundColor: '#991b1b',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.72rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 0 12px rgba(220,38,38,0.35)'
            }}
          >
            <AlertTriangle size={13} /> Andon Template
          </button>

          <div style={{ padding: '5px 10px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '0.68rem', fontWeight: 800, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={13} color="#818cf8" />
            <span>{allWidgets.length} w</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>{appVariables?.length || 0} v</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>{tables?.length || 0} t</span>
            <span style={{ color: '#475569' }}>•</span>
            <span>{steps?.length || 0} s</span>
          </div>
        </div>
      </header>

      {/* ─── WORKSPACE (LEFT PALETTE + CANVAS + RIGHT INSPECTOR) ─── */}
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>

        {/* LEFT PALETTE */}
        <div style={{ width: paletteOpen ? '298px' : '0px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', transition: 'width 0.3s ease', zIndex: 10, overflow: 'hidden', flexShrink: 0 }}>
          <div style={{ padding: '11px 13px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}><Network size={16} color="#6366f1" /><span style={{ fontWeight: 800, fontSize: '0.84rem', color: '#1e293b' }}>Node Canvas Palette</span></div>
            <button onClick={() => setPaletteOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={15} /></button>
          </div>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            {[{ id: 'WIDGETS', lbl: '🧩 Widgets', cnt: allWidgets.length }, { id: 'TRIGGERS', lbl: '⚡ Events' }, { id: 'VARS', lbl: '📦 Vars', cnt: appVariables?.length }, { id: 'TABLES', lbl: '🗄 Tables', cnt: tables?.length }].map(tab => (
              <button key={tab.id} onClick={() => setPalTab(tab.id)} style={{ flex: 1, padding: '6px 2px', fontSize: '0.6rem', fontWeight: 800, border: 'none', cursor: 'pointer', backgroundColor: palTab === tab.id ? '#fff' : 'transparent', color: palTab === tab.id ? '#6366f1' : '#94a3b8', borderBottom: palTab === tab.id ? '2px solid #6366f1' : '2px solid transparent', transition: 'all 0.15s', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px', flexDirection: 'column' }}>
                {tab.lbl}
                {tab.cnt !== undefined && <span style={{ fontSize: '0.53rem', background: palTab === tab.id ? '#e0e7ff' : '#f1f5f9', color: palTab === tab.id ? '#4338ca' : '#64748b', padding: '1px 5px', borderRadius: '10px' }}>{tab.cnt}</span>}
              </button>
            ))}
          </div>
          <div style={{ padding: '9px 11px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '9px', top: '7px', color: '#94a3b8' }} />
              <input type="text" placeholder="Search widgets, events, variables..." value={searchQ} onChange={e => setSearchQ(e.target.value)} style={{ width: '100%', padding: '5px 9px 5px 28px', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '0.71rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>

            {palTab === 'WIDGETS' && (
              Object.keys(widgetsByStep).length === 0
                ? <div style={{ textAlign: 'center', padding: '24px 12px', color: '#94a3b8', fontSize: '0.72rem' }}>
                  <Layers size={26} style={{ marginBottom: '8px', opacity: 0.35, display: 'block', margin: '0 auto 8px' }} />
                  <div style={{ fontWeight: 700 }}>No widgets in this app yet</div>
                  <div style={{ marginTop: '4px', fontSize: '0.65rem' }}>Add widgets in Design tab to see them here</div>
                </div>
                : <>
                  {Object.entries(widgetsByStep).map(([key, { label: slbl, color, widgets }]) => (
                    <PSection key={key} skey={key} title={`${slbl} (${widgets.length})`} color={color} icon={key === '__base__' ? <Layers size={11} /> : <Monitor size={11} />}>
                      {widgets.map(w => {
                        const m = getWidgetMeta(w.type);
                        return <PItem key={`${w.id}_${key}`} label={w.name || w.props?.label || w.props?.text || w.type || 'Widget'} sublabel={m.label} icon={m.icon} color={m.color} bg={m.bg} border={m.border} onClick={() => addWidgetNode(w)} />;
                      })}
                    </PSection>
                  ))}
                  <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #e2e8f0' }}>
                    <PSection skey="andon_p" title="Andon Preset Nodes" color="#dc2626" icon={<AlertTriangle size={11} />}>
                      <PItem label="Andon Call Button" sublabel="BUTTON" icon={<MousePointer2 size={13} />} color="#991b1b" bg="#fef2f2" border="#fecaca" onClick={() => addNode('widget', 'Call Maintenance Button', { widgetType: 'BUTTON', type: 'BUTTON' })} />
                      <PItem label="Tower Light PLC" sublabel="PLC" icon={<Radio size={13} />} color="#92400e" bg="#fffbeb" border="#fef3c7" onClick={() => addNode('machine', 'PLC Red Tower Light', { tag: 'LIGHT_RED' })} />
                      <PItem label="Andon Incidents DB" sublabel="TABLE" icon={<Database size={13} />} color="#0f766e" bg="#f0fdfa" border="#ccfbf1" onClick={() => addNode('table', 'andon_incidents DB')} />
                      <PItem label="Andon Status Var" sublabel="VAR" icon={<Variable size={13} />} color="#065f46" bg="#ecfdf5" border="#d1fae5" onClick={() => addNode('variable', 'Andon_Status', { varType: 'CRITICAL' })} />
                      <PItem label="Telegram Alert" sublabel="ACTION" icon={<Send size={13} />} color="#6b21a8" bg="#faf5ff" border="#f3e8ff" onClick={() => addNode('action', 'Telegram Alert', { actionType: 'RUN_WORKFLOW' })} />
                    </PSection>
                  </div>
                </>
            )}

            {palTab === 'TRIGGERS' && <>
              <PSection skey="when" title="WHEN — Event Triggers" color="#be123c" icon={<PlayCircle size={11} />}>
                {[{ lbl: 'onClick Trigger', ev: 'onClick', sub: 'Button' }, { lbl: 'onChange Trigger', ev: 'onChange', sub: 'Input' }, { lbl: 'onStepEnter Trigger', ev: 'onStepEnter', sub: 'Screen' }, { lbl: 'Timer Interval Trigger', ev: 'timer', sub: 'Scheduler' }, { lbl: 'onVariableChange', ev: 'ON_VAR_CHANGE', sub: 'State' }, { lbl: 'On App Start', ev: 'ON_APP_START', sub: 'Init' }, { lbl: 'onFormSubmit', ev: 'onSubmit', sub: 'Form' }, { lbl: 'IoT Signal Trigger', ev: 'onIoTSignal', sub: 'PLC/Sensor' }].map(t => (
                  <PItem key={t.ev} label={t.lbl} sublabel={t.sub} icon={<PlayCircle size={13} />} color="#9f1239" bg="#fff1f2" border="#ffe4e6" onClick={() => addNode('trigger', t.lbl, { event: t.ev })} />
                ))}
              </PSection>
              <PSection skey="then" title="THEN — Action Steps" color="#6d28d9" icon={<ArrowRight size={11} />}>
                {[{ lbl: 'Set Variable', t: 'SET_VARIABLE' }, { lbl: 'Navigate Screen', t: 'NAVIGATE_STEP' }, { lbl: 'Query Database', t: 'QUERY_TABLE' }, { lbl: 'Run Automation', t: 'RUN_WORKFLOW' }, { lbl: 'Show Toast', t: 'SHOW_TOAST' }, { lbl: 'Call External API', t: 'CALL_API' }, { lbl: 'Publish MQTT', t: 'PUBLISH_MQTT' }, { lbl: 'Write PLC Tag', t: 'WRITE_PLC' }, { lbl: 'Send Email', t: 'SEND_EMAIL' }, { lbl: 'Generate PDF Report', t: 'GENERATE_REPORT' }, { lbl: 'Play Sound/Alarm', t: 'PLAY_ALARM' }].map(a => (
                  <PItem key={a.t} label={a.lbl} sublabel={a.t} icon={<ArrowRight size={13} />} color="#6b21a8" bg="#faf5ff" border="#f3e8ff" onClick={() => addNode('action', a.lbl, { actionType: a.t })} />
                ))}
              </PSection>
              <PSection skey="logic" title="Logic / Branching" color="#ea580c" icon={<Filter size={11} />}>
                <PItem label="IF/ELSE Branch" sublabel="CONDITION" icon={<GitBranch size={13} />} color="#c2410c" bg="#fff7ed" border="#fed7aa" onClick={() => addNode('condition', 'IF/ELSE Branch', { condition: 'var===value' })} />
                <PItem label="AI Vision Agent" sublabel="AI" icon={<Sparkles size={13} />} color="#be185d" bg="#fdf4ff" border="#f5d0fe" onClick={() => addNode('aivision', 'AI Vision Agent', {})} />
              </PSection>
            </>}

            {palTab === 'VARS' && <PSection skey="vars" title={`App Variables (${(appVariables || []).length})`} color="#059669" icon={<Variable size={11} />}>
              {(appVariables || []).length === 0 ? <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: '0.7rem' }}>No variables defined</div> : (appVariables || []).filter(v => (v.name || '').toLowerCase().includes(searchQ.toLowerCase())).map(v => (
                <PItem key={v.id || v.name} label={v.name || 'Variable'} sublabel={v.type || 'string'} icon={<Variable size={13} />} color="#065f46" bg="#ecfdf5" border="#d1fae5" onClick={() => addNode('variable', v.name, { varType: v.type || 'string', value: v.defaultValue })} />
              ))}
            </PSection>}

            {palTab === 'TABLES' && <>
              <PSection skey="tables" title={`Database Tables (${(tables || []).length})`} color="#0d9488" icon={<Database size={11} />}>
                {(tables || []).length === 0 ? <div style={{ textAlign: 'center', padding: '16px 0', color: '#94a3b8', fontSize: '0.7rem' }}>No tables defined</div> : (tables || []).filter(t => (t.name || t.id || '').toLowerCase().includes(searchQ.toLowerCase())).map(t => (
                  <PItem key={t.id} label={t.name || t.id} sublabel={`${t.columns?.length || 0} cols`} icon={<Database size={13} />} color="#0d9488" bg="#f0fdfa" border="#99f6e4" onClick={() => addNode('table', t.name || t.id, { tableId: t.id, columns: t.columns })} />
                ))}
              </PSection>
              <PSection skey="screens" title="Screen Navigation" color="#0284c7" icon={<Monitor size={11} />}>
                {(steps || []).map(s => <PItem key={s.id} label={s.name || s.title || s.id} sublabel="SCREEN" icon={<Navigation size={13} />} color="#0369a1" bg="#f0f9ff" border="#bae6fd" onClick={() => addNode('screen_step', s.name || s.title || s.id, { targetStepId: s.id })} />)}
              </PSection>
            </>}
          </div>
        </div>

        {/* MAIN CANVAS CONTAINER */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* REACT FLOW CANVAS */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onEdgeContextMenu={onEdgeContextMenu}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => { setSelectedEl(node); setContextMenu(null); setInspTab('PROPS'); setForm(f => ({ ...f, event: node.data.events?.[0] || 'onClick', actionType: node.data.actionType || 'SET_VARIABLE', targetVar: node.data.targetVar || '', targetStep: node.data.targetStep || '' })); }}
            onEdgeClick={(_, edge) => { setSelectedEl(edge); setContextMenu(null); }}
            onPaneClick={() => { setSelectedEl(null); setContextMenu(null); }}
            fitView
          >
            <Background color="#cbd5e1" variant="dots" gap={20} size={1.5} />
            <Controls style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            <MiniMap style={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} nodeColor={n => getWidgetMeta(n.data?.widgetType || n.data?.type)?.color || '#6366f1'} />
          </ReactFlow>

          {/* PRO CONTEXT MENU OVERLAY */}
          {contextMenu && (
            <div
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '12px',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
                padding: '6px',
                zIndex: 99999,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                minWidth: '210px',
                color: '#f8fafc',
                fontFamily: "'Inter', system-ui, sans-serif"
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {contextMenu.type === 'node' && (
                <>
                  <div style={{ padding: '6px 10px', fontSize: '0.68rem', fontWeight: 800, color: '#818cf8', borderBottom: '1px solid #1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Node: {contextMenu.targetNode?.data?.label || contextMenu.targetNode?.id}
                  </div>
                  <button
                    onClick={() => duplicateSelectedNode(contextMenu.targetNode)}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Copy size={14} color="#38bdf8" /> Duplicate Node <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#64748b' }}>Ctrl+D</span>
                  </button>
                  <button
                    onClick={() => copySelectedNode(contextMenu.targetNode)}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Clipboard size={14} color="#a78bfa" /> Copy Node <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#64748b' }}>Ctrl+C</span>
                  </button>
                  <button
                    onClick={() => disconnectWires(contextMenu.targetNode?.id)}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Zap size={14} color="#f59e0b" /> Disconnect All Wires
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '2px 0' }} />
                  <button
                    onClick={() => { delSelected(); setContextMenu(null); }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#450a0a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={14} color="#ef4444" /> Delete Node <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#ef4444' }}>Del</span>
                  </button>
                </>
              )}

              {contextMenu.type === 'edge' && (
                <>
                  <div style={{ padding: '6px 10px', fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', borderBottom: '1px solid #1e293b', textTransform: 'uppercase' }}>
                    Wire Connection
                  </div>
                  <button
                    onClick={() => { delSelected(); setContextMenu(null); }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#450a0a'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={14} color="#ef4444" /> Remove Wire <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#ef4444' }}>Del</span>
                  </button>
                </>
              )}

              {contextMenu.type === 'pane' && (
                <>
                  <button
                    onClick={pasteNode}
                    disabled={!clipboardNode}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: clipboardNode ? '#f8fafc' : '#475569', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: clipboardNode ? 'pointer' : 'not-allowed', borderRadius: '6px' }}
                    onMouseEnter={(e) => clipboardNode && (e.currentTarget.style.backgroundColor = '#1e293b')}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ClipboardPaste size={14} color={clipboardNode ? '#34d399' : '#475569'} /> Paste Node <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#64748b' }}>Ctrl+V</span>
                  </button>
                  <button
                    onClick={() => { autoArrange(); setContextMenu(null); }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <RefreshCw size={14} color="#818cf8" /> Auto-Arrange Flow
                  </button>
                  <div style={{ height: '1px', backgroundColor: '#1e293b', margin: '2px 0' }} />
                  <button
                    onClick={() => { addNode('trigger', 'onClick Event', { event: 'onClick' }); setContextMenu(null); }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <PlayCircle size={14} color="#f43f5e" /> Add Event Trigger
                  </button>
                  <button
                    onClick={() => { addNode('action', 'Set Variable', { actionType: 'SET_VARIABLE' }); setContextMenu(null); }}
                    style={{ padding: '8px 12px', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '6px' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1e293b'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <ArrowRight size={14} color="#a855f7" /> Add Action Step
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* LOG CONSOLE */}
        {consoleOpen && <div style={{ height: '172px', backgroundColor: '#0f172a', color: '#f8fafc', borderTop: '2px solid #22c55e', display: 'flex', flexDirection: 'column', zIndex: 100, fontFamily: 'monospace' }}>
          <div style={{ padding: '7px 13px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '0.7rem', fontWeight: 800, color: '#22c55e' }}><Terminal size={13} /> Live Signal Telemetry Console</div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setLogs([])} style={{ fontSize: '0.63rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
              <button onClick={() => setConsoleOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={13} /></button>
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 13px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem' }}>
            {logs.length === 0 ? <div style={{ color: '#64748b' }}>Console ready. Click "Play / Test Run Flow" to simulate.</div> : logs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: '#475569', fontSize: '0.63rem' }}>[{log.time}]</span>
                <span style={{ color: log.type === 'success' ? '#22c55e' : log.type === 'event' ? '#f43f5e' : log.type === 'action' ? '#a855f7' : log.type === 'db' ? '#00A09D' : '#38bdf8', fontWeight: 700 }}>{log.text}</span>
              </div>
            ))}
          </div>
        </div>}
      </div>

      {/* RIGHT INSPECTOR */}
      {selectedEl && <div style={{ width: '310px', backgroundColor: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', zIndex: 10, flexShrink: 0 }}>
        <div style={{ padding: '11px 13px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Settings size={14} color="#6366f1" /><span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>{selectedEl.source ? 'Wire Connection' : 'Widget & Node Inspector'}</span></div>
          <button onClick={() => setSelectedEl(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={15} /></button>
        </div>
        {renderInspector()}
      </div>}
      </div>
    </div>
  );
};

export default AppNodeEditor;
