import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {
  Layout,
  Database,
  Cpu,
  Zap,
  Sparkles,
  Search,
  Plus,
  Code,
  RefreshCw,
  Network,
  X,
  Variable,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  PlayCircle,
  CheckCircle,
  Bell,
  Navigation,
  Save,
  AlertTriangle,
  Radio,
  Send,
  Monitor,
  Play,
  Terminal,
  Check
} from 'lucide-react';

// ─── 1. NODE-RED STYLE BLOCK NODE COMPONENTS ─────────────────────────────────

const NodeRedStyleBlockBase = ({
  icon,
  label,
  sublabel,
  color,
  bg,
  selected,
  targetId = "target",
  sourceId = "source"
}) => (
  <div
    style={{
      position: 'relative',
      userSelect: 'none',
      cursor: 'pointer'
    }}
  >
    {/* Target Input Handle (Left) */}
    <Handle
      type="target"
      position={Position.Left}
      id={targetId}
      style={{
        width: 10,
        height: 10,
        background: color,
        border: '2px solid #ffffff',
        borderRadius: '50%',
        left: -5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        zIndex: 10
      }}
    />

    {/* Node-RED Style Capsule Block Container */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        minWidth: '175px',
        maxWidth: '250px',
        height: '38px',
        padding: '0 10px 0 6px',
        backgroundColor: bg,
        color: '#ffffff',
        borderRadius: '6px',
        border: selected ? '2px solid #0284c7' : '1px solid rgba(0,0,0,0.25)',
        boxShadow: selected
          ? '0 0 0 3px rgba(2, 132, 199, 0.35), 0 6px 16px rgba(0,0,0,0.2)'
          : '0 2px 8px rgba(0,0,0,0.12)',
        transition: 'all 0.15s ease',
        fontFamily: "'Inter', system-ui, sans-serif"
      }}
    >
      {/* Icon Badge Box */}
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: '#ffffff'
        }}
      >
        {icon}
      </div>

      {/* Label & Sublabel */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 800,
            color: '#ffffff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div
            style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              color: 'rgba(255, 255, 255, 0.85)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              lineHeight: 1,
              marginTop: '1px'
            }}
          >
            {sublabel}
          </div>
        )}
      </div>

      {/* Node Status Dot */}
      <div
        style={{
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          opacity: 0.9,
          flexShrink: 0,
          boxShadow: '0 0 4px rgba(255,255,255,0.8)'
        }}
      />
    </div>

    {/* Source Output Handle (Right) */}
    <Handle
      type="source"
      position={Position.Right}
      id={sourceId}
      style={{
        width: 10,
        height: 10,
        background: color,
        border: '2px solid #ffffff',
        borderRadius: '50%',
        right: -5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        zIndex: 10
      }}
    />
  </div>
);

// Node Type Wrappers
const WidgetNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Layout size={15} />}
    label={data.label}
    sublabel={data.type || 'Screen Widget'}
    color="#4f46e5"
    bg="#6366f1"
    selected={selected}
    targetId="prop_input"
    sourceId="event_output"
  />
);

const ScreenStepNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Navigation size={15} />}
    label={data.label}
    sublabel="Screen Step Target"
    color="#0284c7"
    bg="#0284c7"
    selected={selected}
    targetId="step_in"
    sourceId="step_out"
  />
);

const TriggerNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<PlayCircle size={15} />}
    label={data.label}
    sublabel={data.event ? `WHEN: ${data.event}` : 'Event Trigger'}
    color="#be123c"
    bg="#e11d48"
    selected={selected}
    targetId="trig_in"
    sourceId="trig_out"
  />
);

const ActionNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<ArrowRight size={15} />}
    label={data.label}
    sublabel={data.actionType ? `THEN: ${data.actionType}` : 'Action Step'}
    color="#6d28d9"
    bg="#8b5cf6"
    selected={selected}
    targetId="act_in"
    sourceId="act_out"
  />
);

const VariableNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Variable size={15} />}
    label={data.label}
    sublabel={data.varType ? `VAR (${data.varType})` : 'Variable'}
    color="#059669"
    bg="#10b981"
    selected={selected}
    targetId="var_input"
    sourceId="var_output"
  />
);

const TableNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Database size={15} />}
    label={data.label}
    sublabel="Database Table"
    color="#0d9488"
    bg="#00A09D"
    selected={selected}
    targetId="query_input"
    sourceId="data_output"
  />
);

const MachineNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Cpu size={15} />}
    label={data.label}
    sublabel="PLC Tag Sensor"
    color="#d97706"
    bg="#f59e0b"
    selected={selected}
    targetId="cmd_input"
    sourceId="tag_output"
  />
);

const AutomationNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Zap size={15} />}
    label={data.label}
    sublabel="Automation Pipeline"
    color="#714B67"
    bg="#714B67"
    selected={selected}
    targetId="exec_input"
    sourceId="workflow_output"
  />
);

const FunctionNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Code size={15} />}
    label={data.label}
    sublabel="Visual Function"
    color="#2563eb"
    bg="#3b82f6"
    selected={selected}
    targetId="fn_params"
    sourceId="fn_result"
  />
);

const AiVisionNode = ({ data, selected }) => (
  <NodeRedStyleBlockBase
    icon={<Sparkles size={15} />}
    label={data.label}
    sublabel="AI Vision Agent"
    color="#db2777"
    bg="#ec4899"
    selected={selected}
    targetId="ai_image_input"
    sourceId="ai_result"
  />
);

const nodeTypes = {
  widget: WidgetNode,
  screen_step: ScreenStepNode,
  trigger: TriggerNode,
  action: ActionNode,
  variable: VariableNode,
  table: TableNode,
  machine: MachineNode,
  automation: AutomationNode,
  function: FunctionNode,
  aivision: AiVisionNode
};

// ─── 2. MAIN APP NODE EDITOR COMPONENT ───────────────────────────────────────
const AppNodeEditor = ({
  steps = [],
  currentStepId,
  baseComponents = [],
  tables = [],
  appVariables = [],
  appTriggers = [],
  onUpdateWidgetLogic
}) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);

  // Active Screen Step state (defaults to currentStepId or first step)
  const [activeStepId, setActiveStepId] = useState(currentStepId || (steps[0] ? steps[0].id : 'step_1'));

  // Execution Test states
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([]);

  // Storage map for per-screen node graphs: { [stepId]: { nodes, edges } }
  const stepGraphStorage = useRef({});

  // Inspector form states for configuring triggers & actions via node
  const [triggerForm, setTriggerForm] = useState({
    event: 'onClick',
    actionType: 'SET_VARIABLE',
    targetVar: '',
    targetStep: '',
    valueFormula: '',
    toastMessage: ''
  });

  // Helper: Generate initial graph specifically for a target step ID
  const generateGraphForStep = useCallback((stepId) => {
    const stepComps = baseComponents.filter(c => !c.stepId || c.stepId === stepId);

    const generatedNodes = [];
    const generatedEdges = [];

    // 1. Render Screen Widgets for this specific step (Column 1)
    stepComps.forEach((comp, idx) => {
      generatedNodes.push({
        id: `node_widget_${comp.id}`,
        type: 'widget',
        position: { x: 40, y: 60 + idx * 80 },
        data: {
          id: comp.id,
          label: comp.name || comp.type || 'Widget',
          type: comp.type,
          stepId: stepId,
          events: comp.type === 'BUTTON' ? ['onClick'] : comp.type === 'TEXTINPUT' ? ['onChange'] : ['onEvent']
        }
      });
    });

    // 2. Render Event Trigger Nodes (Column 2 - WHEN)
    const activeWidget = stepComps[0] || { id: `btn_${stepId}`, name: 'Submit Button' };
    generatedNodes.push({
      id: `node_trig_${activeWidget.id}`,
      type: 'trigger',
      position: { x: 270, y: 60 },
      data: {
        id: `trig_${activeWidget.id}`,
        label: `${activeWidget.name || 'Button'}.onClick`,
        event: 'onClick',
        widgetId: activeWidget.id,
        stepId: stepId
      }
    });

    // 3. Render Action Nodes (Column 3 - THEN)
    generatedNodes.push({
      id: `node_action_${stepId}`,
      type: 'action',
      position: { x: 500, y: 60 },
      data: {
        id: `act_${stepId}`,
        label: 'Set Variable: Order_ID',
        actionType: 'SET_VARIABLE',
        targetVar: 'Selected_Order_ID'
      }
    });

    // 4. Render App Variables (Column 4)
    if (appVariables && appVariables.length > 0) {
      appVariables.forEach((v, idx) => {
        generatedNodes.push({
          id: `node_var_${v.id || v.name}`,
          type: 'variable',
          position: { x: 740, y: 60 + idx * 80 },
          data: {
            id: v.id || v.name,
            label: v.name || 'Variable',
            varType: v.type || 'string',
            value: v.defaultValue
          }
        });
      });
    } else {
      generatedNodes.push({
        id: 'node_var_count',
        type: 'variable',
        position: { x: 740, y: 60 },
        data: { label: 'Selected_Order_ID', varType: 'string' }
      });
    }

    // 5. Render Database Table Node (Column 4)
    const activeTable = tables[0] || { id: 'work_orders', name: 'Work_Orders_Table' };
    generatedNodes.push({
      id: `node_table_${activeTable.id || 'main'}`,
      type: 'table',
      position: { x: 740, y: 160 },
      data: { label: activeTable.name || activeTable.id }
    });

    // Connect initial pipeline for this screen
    if (stepComps.length > 0) {
      generatedEdges.push({
        id: `edge_w1_trig_${stepId}`,
        source: `node_widget_${activeWidget.id}`,
        sourceHandle: 'event_output',
        target: `node_trig_${activeWidget.id}`,
        targetHandle: 'trig_in',
        type: 'smoothstep',
        animated: true,
        label: 'WHEN Event',
        labelStyle: { fontSize: '0.65rem', fill: '#e11d48', fontWeight: 800 },
        style: { stroke: '#e11d48', strokeWidth: 2 }
      });

      generatedEdges.push({
        id: `edge_trig_act_${stepId}`,
        source: `node_trig_${activeWidget.id}`,
        sourceHandle: 'trig_out',
        target: `node_action_${stepId}`,
        targetHandle: 'act_in',
        type: 'smoothstep',
        animated: true,
        label: 'THEN Action',
        labelStyle: { fontSize: '0.65rem', fill: '#8b5cf6', fontWeight: 800 },
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      });

      const targetVarNodeId = (appVariables[0]?.id || appVariables[0]?.name)
        ? `node_var_${appVariables[0].id || appVariables[0].name}`
        : 'node_var_count';

      generatedEdges.push({
        id: `edge_act_var_${stepId}`,
        source: `node_action_${stepId}`,
        sourceHandle: 'act_out',
        target: targetVarNodeId,
        targetHandle: 'var_input',
        type: 'smoothstep',
        animated: true,
        label: 'Update State',
        labelStyle: { fontSize: '0.65rem', fill: '#10b981', fontWeight: 800 },
        style: { stroke: '#10b981', strokeWidth: 2 }
      });
    }

    return { nodes: generatedNodes, edges: generatedEdges };
  }, [baseComponents, tables, appVariables]);

  // Initial setup for current active step
  const initialData = useMemo(() => {
    return generateGraphForStep(activeStepId);
  }, [generateGraphForStep, activeStepId]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);

  // Switch Screen Step: Save previous graph state and load new step's graph
  const handleSwitchStep = (targetStepId) => {
    if (targetStepId === activeStepId) return;

    // Save current graph to memory
    stepGraphStorage.current[activeStepId] = { nodes, edges };

    // Load or generate graph for new targetStepId
    let nextGraph = stepGraphStorage.current[targetStepId];
    if (!nextGraph) {
      nextGraph = generateGraphForStep(targetStepId);
      stepGraphStorage.current[targetStepId] = nextGraph;
    }

    setActiveStepId(targetStepId);
    setNodes(nextGraph.nodes);
    setEdges(nextGraph.edges);
    setSelectedElement(null);
  };

  // Sync selected element to triggerForm when clicked
  useEffect(() => {
    if (selectedElement && selectedElement.data) {
      setTriggerForm({
        event: selectedElement.data.event || 'onClick',
        actionType: selectedElement.data.actionType || 'SET_VARIABLE',
        targetVar: selectedElement.data.targetVar || (appVariables[0]?.name || 'Selected_Order_ID'),
        targetStep: selectedElement.data.targetStep || (steps[0]?.id || 'step_1'),
        valueFormula: selectedElement.data.valueFormula || '1001',
        toastMessage: selectedElement.data.toastMessage || 'Action completed successfully'
      });
    }
  }, [selectedElement, appVariables, steps]);

  // ─── PLAY / TEST RUN FLOW EXECUTION SIMULATOR ─────────────────────────────
  const handleRunFlowExecutionTest = () => {
    setIsRunningTest(true);
    setIsConsoleOpen(true);

    const nowTime = new Date().toLocaleTimeString();
    const newLogs = [
      { time: nowTime, type: 'start', text: `▶ Started Node Flow Execution Test for Active Screen (${activeStepId})` }
    ];
    setExecutionLogs(newLogs);

    // Animate edges with green glowing strokes during test
    setEdges((eds) =>
      eds.map((e) => ({
        ...e,
        animated: true,
        style: { stroke: '#22c55e', strokeWidth: 3, filter: 'drop-shadow(0 0 6px #22c55e)' }
      }))
    );

    // Sequential step-by-step node execution simulation
    setTimeout(() => {
      const time1 = new Date().toLocaleTimeString();
      setExecutionLogs((prev) => [
        ...prev,
        { time: time1, type: 'event', text: `⚡ [EVENT TRIGGER] Button.onClick fired successfully!` }
      ]);
    }, 400);

    setTimeout(() => {
      const time2 = new Date().toLocaleTimeString();
      setExecutionLogs((prev) => [
        ...prev,
        { time: time2, type: 'action', text: `⚙️ [ACTION STEP] Set Variable Selected_Order_ID = '1001' committed!` }
      ]);
    }, 800);

    setTimeout(() => {
      const time3 = new Date().toLocaleTimeString();
      setExecutionLogs((prev) => [
        ...prev,
        { time: time3, type: 'db', text: `🗄️ [DATABASE] Query Work_Orders Table executed (Status 200 OK)` }
      ]);
    }, 1200);

    setTimeout(() => {
      const time4 = new Date().toLocaleTimeString();
      setExecutionLogs((prev) => [
        ...prev,
        { time: time4, type: 'success', text: `🎉 [FLOW PASSED] All connected nodes executed cleanly! (0 Errors)` }
      ]);

      // Revert edge styles back to original
      setEdges((eds) =>
        eds.map((e) => ({
          ...e,
          style: { stroke: e.labelStyle?.fill || '#6366f1', strokeWidth: 2 }
        }))
      );
      setIsRunningTest(false);
    }, 1600);
  };

  // Handle visual wiring connection drawn by user
  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      let edgeLabel = 'Connected';
      let edgeColor = '#6366f1';

      if (sourceNode?.type === 'widget' && targetNode?.type === 'trigger') {
        edgeLabel = 'WHEN Event';
        edgeColor = '#e11d48';
      } else if (sourceNode?.type === 'trigger' && targetNode?.type === 'action') {
        edgeLabel = 'THEN Action';
        edgeColor = '#8b5cf6';
      } else if (sourceNode?.type === 'action' && targetNode?.type === 'variable') {
        edgeLabel = 'Set Variable';
        edgeColor = '#10b981';
      } else if (sourceNode?.type === 'action' && targetNode?.type === 'screen_step') {
        edgeLabel = 'Navigate Screen';
        edgeColor = '#0284c7';
      } else if (sourceNode?.type === 'widget' && targetNode?.type === 'variable') {
        edgeLabel = 'onClick ➔ Set Variable';
        edgeColor = '#10b981';
      } else if (sourceNode?.type === 'widget' && targetNode?.type === 'automation') {
        edgeLabel = 'onClick ➔ Run Action';
        edgeColor = '#8b5cf6';
      } else if (sourceNode?.type === 'table' && targetNode?.type === 'widget') {
        edgeLabel = 'Data Source ➔ Widget';
        edgeColor = '#00A09D';
      }

      const newEdge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        label: edgeLabel,
        labelStyle: { fontSize: '0.65rem', fill: edgeColor, fontWeight: 800 },
        style: { stroke: edgeColor, strokeWidth: 2 }
      };

      setEdges((eds) => addEdge(newEdge, eds));

      if (onUpdateWidgetLogic && sourceNode && targetNode) {
        onUpdateWidgetLogic({
          stepId: activeStepId,
          source: sourceNode.data,
          target: targetNode.data,
          connectionType: edgeLabel
        });
      }
    },
    [nodes, setEdges, onUpdateWidgetLogic, activeStepId]
  );

  // Auto layout using Dagre
  const handleAutoArrange = () => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 180, height: 40 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 90,
          y: nodeWithPosition.y - 20
        }
      };
    });

    setNodes(layoutedNodes);
  };

  // Load Andon Management Template specifically on current active screen step
  const handleLoadAndonTemplate = () => {
    const andonNodes = [
      {
        id: `node_andon_btn_${activeStepId}`,
        type: 'widget',
        position: { x: 40, y: 120 },
        data: { label: 'Call Maintenance Button', type: 'BUTTON', stepId: activeStepId }
      },
      {
        id: `node_andon_trig_${activeStepId}`,
        type: 'trigger',
        position: { x: 270, y: 120 },
        data: { label: 'WHEN: onClick (Operator Call)', event: 'onClick', stepId: activeStepId }
      },
      {
        id: `node_andon_var_${activeStepId}`,
        type: 'variable',
        position: { x: 500, y: 60 },
        data: { label: 'Andon_Status', varType: 'CRITICAL_STOP' }
      },
      {
        id: `node_andon_light_${activeStepId}`,
        type: 'machine',
        position: { x: 500, y: 180 },
        data: { label: 'PLC Write: Red Tower Light' }
      },
      {
        id: `node_andon_db_${activeStepId}`,
        type: 'table',
        position: { x: 760, y: 60 },
        data: { label: 'andon_incidents DB' }
      },
      {
        id: `node_andon_alert_${activeStepId}`,
        type: 'action',
        position: { x: 760, y: 180 },
        data: { label: 'THEN: Dispatch Telegram Alert', actionType: 'RUN_WORKFLOW' }
      }
    ];

    const andonEdges = [
      {
        id: `e_btn_trig_${activeStepId}`,
        source: `node_andon_btn_${activeStepId}`,
        sourceHandle: 'event_output',
        target: `node_andon_trig_${activeStepId}`,
        targetHandle: 'trig_in',
        animated: true,
        label: 'WHEN Press',
        labelStyle: { fontSize: '0.65rem', fill: '#e11d48', fontWeight: 800 },
        style: { stroke: '#e11d48', strokeWidth: 2 }
      },
      {
        id: `e_trig_var_${activeStepId}`,
        source: `node_andon_trig_${activeStepId}`,
        sourceHandle: 'trig_out',
        target: `node_andon_var_${activeStepId}`,
        targetHandle: 'var_input',
        animated: true,
        label: 'Set Status',
        labelStyle: { fontSize: '0.65rem', fill: '#10b981', fontWeight: 800 },
        style: { stroke: '#10b981', strokeWidth: 2 }
      },
      {
        id: `e_trig_light_${activeStepId}`,
        source: `node_andon_trig_${activeStepId}`,
        sourceHandle: 'trig_out',
        target: `node_andon_light_${activeStepId}`,
        targetHandle: 'cmd_input',
        animated: true,
        label: 'Signal Red Light',
        labelStyle: { fontSize: '0.65rem', fill: '#f59e0b', fontWeight: 800 },
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      },
      {
        id: `e_var_db_${activeStepId}`,
        source: `node_andon_var_${activeStepId}`,
        sourceHandle: 'var_output',
        target: `node_andon_db_${activeStepId}`,
        targetHandle: 'query_input',
        animated: true,
        label: 'Log Incident',
        labelStyle: { fontSize: '0.65rem', fill: '#00A09D', fontWeight: 800 },
        style: { stroke: '#00A09D', strokeWidth: 2 }
      },
      {
        id: `e_light_alert_${activeStepId}`,
        source: `node_andon_light_${activeStepId}`,
        sourceHandle: 'tag_output',
        target: `node_andon_alert_${activeStepId}`,
        targetHandle: 'act_in',
        animated: true,
        label: 'Dispatch Alert',
        labelStyle: { fontSize: '0.65rem', fill: '#8b5cf6', fontWeight: 800 },
        style: { stroke: '#8b5cf6', strokeWidth: 2 }
      }
    ];

    setNodes(andonNodes);
    setEdges(andonEdges);
  };

  // Add custom node from palette
  const handleAddNodeToGraph = (nodeType, label, extraData = {}) => {
    const newNode = {
      id: `node_${nodeType}_${Date.now()}`,
      type: nodeType,
      position: { x: 350 + Math.random() * 80, y: 100 + Math.random() * 80 },
      data: { label: label || `${nodeType.toUpperCase()} Node`, stepId: activeStepId, ...extraData }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  // Save & Apply Trigger logic configured in Node Inspector to App Builder
  const handleSaveTriggerLogic = () => {
    if (!selectedElement) return;

    const updatedLabel =
      selectedElement.type === 'trigger'
        ? `WHEN ${triggerForm.event}`
        : selectedElement.type === 'action'
        ? `${triggerForm.actionType}: ${triggerForm.targetVar || triggerForm.targetStep || 'Value'}`
        : selectedElement.data.label;

    setNodes((nds) =>
      nds.map((n) =>
        n.id === selectedElement.id
          ? {
              ...n,
              data: {
                ...n.data,
                label: updatedLabel,
                event: triggerForm.event,
                actionType: triggerForm.actionType,
                targetVar: triggerForm.targetVar,
                targetStep: triggerForm.targetStep,
                valueFormula: triggerForm.valueFormula,
                toastMessage: triggerForm.toastMessage,
                stepId: activeStepId
              }
            }
          : n
      )
    );

    setSelectedElement((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        label: updatedLabel,
        event: triggerForm.event,
        actionType: triggerForm.actionType,
        targetVar: triggerForm.targetVar,
        targetStep: triggerForm.targetStep,
        valueFormula: triggerForm.valueFormula,
        toastMessage: triggerForm.toastMessage,
        stepId: activeStepId
      }
    }));

    if (onUpdateWidgetLogic) {
      onUpdateWidgetLogic({
        stepId: activeStepId,
        nodeId: selectedElement.id,
        nodeType: selectedElement.type,
        trigger: triggerForm
      });
    }
  };

  const deleteSelectedElement = () => {
    if (!selectedElement) return;
    if (selectedElement.source) {
      setEdges((eds) => eds.filter((e) => e.id !== selectedElement.id));
    } else {
      setNodes((nds) => nds.filter((n) => n.id !== selectedElement.id));
      setEdges((eds) => eds.filter((e) => e.source !== selectedElement.id && e.target !== selectedElement.id));
    }
    setSelectedElement(null);
  };

  // Filter components on active step for Palette
  const activeStepComponents = useMemo(() => {
    return baseComponents.filter(c => !c.stepId || c.stepId === activeStepId);
  }, [baseComponents, activeStepId]);

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 64px)', minHeight: '600px', display: 'flex', backgroundColor: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
      {/* ─── LEFT NODE PALETTE & CONTROLS ─── */}
      <div style={{
        width: isPaletteOpen ? '290px' : '0px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
        zIndex: 10,
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Network size={18} color="#6366f1" />
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Node Canvas Palette</span>
          </div>
          <button onClick={() => setIsPaletteOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Filter screen components & triggers..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px 6px 30px', border: '1px solid #cbd5e1', borderRadius: '8px', fontSize: '0.78rem', outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Palette Items */}
        <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* CATEGORY 1: ANDON MANAGEMENT NODES (SPECIALIZED PRESETS) */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={13} /> Andon Management System
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                onClick={() => handleAddNodeToGraph('widget', 'Call Maintenance Button', { type: 'BUTTON' })}
                style={{ padding: '8px 10px', border: '1px solid #fecaca', borderRadius: '8px', backgroundColor: '#fef2f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#991b1b' }}
              >
                <Layout size={14} /> Add Andon Call Button Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('machine', 'PLC Red Tower Light Stack', { tag: 'LIGHT_RED' })}
                style={{ padding: '8px 10px', border: '1px solid #fef3c7', borderRadius: '8px', backgroundColor: '#fffbeb', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#92400e' }}
              >
                <Radio size={14} /> Add Tower Light PLC Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('table', 'andon_incidents DB')}
                style={{ padding: '8px 10px', border: '1px solid #ccfbf1', borderRadius: '8px', backgroundColor: '#f0fdfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#0f766e' }}
              >
                <Database size={14} /> Add Andon Incidents DB Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('variable', 'Andon_Status', { varType: 'CRITICAL' })}
                style={{ padding: '8px 10px', border: '1px solid #d1fae5', borderRadius: '8px', backgroundColor: '#ecfdf5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#065f46' }}
              >
                <Variable size={14} /> Add Andon Status Var Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('action', 'Telegram Maintenance Alert', { actionType: 'RUN_WORKFLOW' })}
                style={{ padding: '8px 10px', border: '1px solid #f3e8ff', borderRadius: '8px', backgroundColor: '#faf5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}
              >
                <Send size={14} /> Add Telegram Alert Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* CATEGORY 2: SCREEN UI WIDGETS FOR ACTIVE SCREEN */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#4f46e5', textTransform: 'uppercase', marginBottom: '8px' }}>
              Screen Components (Active Screen)
            </div>
            {activeStepComponents && activeStepComponents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeStepComponents.map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => handleAddNodeToGraph('widget', comp.name || comp.type, { widgetId: comp.id, type: comp.type })}
                    style={{ padding: '8px 10px', border: '1px solid #e0e7ff', borderRadius: '8px', backgroundColor: '#eef2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}
                  >
                    <Layout size={14} /> {comp.name || comp.type || 'Widget'}
                    <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => handleAddNodeToGraph('widget', 'Button Widget', { type: 'BUTTON' })}
                style={{ padding: '8px 10px', border: '1px solid #e0e7ff', borderRadius: '8px', backgroundColor: '#eef2ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}
              >
                <Layout size={14} /> Add Screen Button Widget
              </div>
            )}
          </div>

          {/* CATEGORY 3: SCREEN STEP TARGETS */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '8px' }}>Screen Navigation Steps</div>
            {steps && steps.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {steps.map((st) => (
                  <div
                    key={st.id}
                    onClick={() => handleAddNodeToGraph('screen_step', st.name || st.id, { targetStepId: st.id })}
                    style={{ padding: '8px 10px', border: '1px solid #bae6fd', borderRadius: '8px', backgroundColor: '#f0f9ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}
                  >
                    <Navigation size={14} /> {st.name || st.id}
                    <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => handleAddNodeToGraph('screen_step', 'Target Screen Step')}
                style={{ padding: '8px 10px', border: '1px solid #bae6fd', borderRadius: '8px', backgroundColor: '#f0f9ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#0369a1' }}
              >
                <Navigation size={14} /> Add Target Screen Step Node
              </div>
            )}
          </div>

          {/* CATEGORY 4: EVENT TRIGGERS (WHEN) */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#e11d48', textTransform: 'uppercase', marginBottom: '8px' }}>1. WHEN Event Triggers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                onClick={() => handleAddNodeToGraph('trigger', 'Button.onClick', { event: 'onClick' })}
                style={{ padding: '8px 10px', border: '1px solid #ffe4e6', borderRadius: '8px', backgroundColor: '#fff1f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#9f1239' }}
              >
                <PlayCircle size={14} /> Add onClick Event Trigger Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('trigger', 'Input.onChange', { event: 'onChange' })}
                style={{ padding: '8px 10px', border: '1px solid #ffe4e6', borderRadius: '8px', backgroundColor: '#fff1f2', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#9f1239' }}
              >
                <PlayCircle size={14} /> Add onChange Event Trigger Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
            </div>
          </div>

          {/* CATEGORY 5: ACTION STEPS (THEN) */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: '8px' }}>2. THEN Action Steps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div
                onClick={() => handleAddNodeToGraph('action', 'Set Variable Action', { actionType: 'SET_VARIABLE' })}
                style={{ padding: '8px 10px', border: '1px solid #f3e8ff', borderRadius: '8px', backgroundColor: '#faf5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}
              >
                <ArrowRight size={14} /> Add Set Variable Action Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
              <div
                onClick={() => handleAddNodeToGraph('action', 'Navigate Screen Action', { actionType: 'NAVIGATE_STEP' })}
                style={{ padding: '8px 10px', border: '1px solid #f3e8ff', borderRadius: '8px', backgroundColor: '#faf5ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, color: '#6b21a8' }}
              >
                <Navigation size={14} /> Add Navigate Step Action Node
                <Plus size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── MAIN REACTFLOW CANVAS ─── */}
      <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        
        {/* TOP FLOATING TOOLBAR WITH PLAY TEST BUTTON & SCREEN SWITCHER */}
        <div style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 5, display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'
        }}>
          {!isPaletteOpen && (
            <button
              onClick={() => setIsPaletteOpen(true)}
              style={{ padding: '8px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
            >
              <Plus size={16} color="#6366f1" /> Node Palette
            </button>
          )}

          {/* PLAY / TEST RUN FLOW BUTTON */}
          <button
            onClick={handleRunFlowExecutionTest}
            disabled={isRunningTest}
            style={{
              padding: '8px 16px',
              backgroundColor: isRunningTest ? '#16a34a' : '#22c55e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.78rem',
              fontWeight: 800,
              cursor: isRunningTest ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Play size={15} fill="currentColor" /> {isRunningTest ? 'Testing Flow Execution...' : 'Play / Test Run Flow'}
          </button>

          {/* PER-SCREEN STEP SELECTOR SWITCHER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#ffffff', padding: '4px', borderRadius: '10px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '0.75rem', fontWeight: 800, color: '#6366f1' }}>
              <Monitor size={15} /> Active Screen:
            </div>
            {steps && steps.length > 0 ? (
              steps.map((st) => (
                <button
                  key={st.id}
                  onClick={() => handleSwitchStep(st.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: activeStepId === st.id ? '#4f46e5' : 'transparent',
                    color: activeStepId === st.id ? '#ffffff' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {st.name || st.id}
                </button>
              ))
            ) : (
              <button style={{ padding: '5px 12px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#4f46e5', color: '#ffffff', border: 'none' }}>
                Main Screen
              </button>
            )}
          </div>

          <button
            onClick={handleAutoArrange}
            style={{ padding: '8px 14px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
          >
            <RefreshCw size={14} /> Auto-Arrange
          </button>

          <button
            onClick={handleLoadAndonTemplate}
            style={{ padding: '8px 14px', backgroundColor: '#dc2626', color: '#ffffff', border: 'none', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 14px rgba(220,38,38,0.35)' }}
          >
            <AlertTriangle size={15} /> Load Andon Template
          </button>
        </div>

        {/* REACTFLOW CANVAS */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            onNodeClick={(_, node) => setSelectedElement(node)}
            onEdgeClick={(_, edge) => setSelectedElement(edge)}
            fitView
          >
            <Background color="#cbd5e1" variant="dots" gap={20} size={1.5} />
            <Controls style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
            <MiniMap style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '8px' }} />
          </ReactFlow>
        </div>

        {/* BOTTOM LIVE FLOW EXECUTION CONSOLE DRAWER */}
        {isConsoleOpen && (
          <div style={{
            height: '170px',
            backgroundColor: '#0f172a',
            color: '#f8fafc',
            borderTop: '2px solid #22c55e',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 100,
            fontFamily: 'monospace'
          }}>
            {/* Console Header */}
            <div style={{ padding: '8px 16px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800, color: '#22c55e' }}>
                <Terminal size={15} /> Flow Test Execution Output Console
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button onClick={() => setExecutionLogs([])} style={{ fontSize: '0.68rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Clear Logs</button>
                <button onClick={() => setIsConsoleOpen(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
              </div>
            </div>

            {/* Console Output List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
              {executionLogs.length === 0 ? (
                <div style={{ color: '#64748b' }}>Console ready. Click "Play / Test Run Flow" to simulate execution.</div>
              ) : (
                executionLogs.map((log, i) => (
                  <div key={i} style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ color: '#64748b', fontSize: '0.68rem' }}>[{log.time}]</span>
                    <span style={{ color: log.type === 'success' ? '#22c55e' : log.type === 'event' ? '#f43f5e' : log.type === 'action' ? '#a855f7' : log.type === 'db' ? '#00A09D' : '#38bdf8', fontWeight: 700 }}>
                      {log.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ─── RIGHT NODE PROPERTY & TRIGGER INSPECTOR DRAWER ─── */}
      {selectedElement && (
        <div style={{
          width: '320px',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10
        }}>
          {/* Inspector Header */}
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
              {selectedElement.source ? 'Wire Connection' : 'Trigger & Node Inspector'}
            </div>
            <button onClick={() => setSelectedElement(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.78rem', overflowY: 'auto', flex: 1 }}>
            {selectedElement.source ? (
              // Edge Connection Inspector
              <div>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>Connection Pipeline Type</label>
                  <div style={{ fontWeight: 800, color: '#0284c7', marginTop: '2px', fontSize: '0.85rem' }}>
                    {selectedElement.label || 'Wire Connection'}
                  </div>
                </div>

                <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.72rem' }}>
                  <div><strong>From Source Node:</strong> {selectedElement.source}</div>
                  <div style={{ marginTop: '4px' }}><strong>To Target Node:</strong> {selectedElement.target}</div>
                </div>

                <button
                  onClick={deleteSelectedElement}
                  style={{ marginTop: '16px', width: '100%', padding: '8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Trash2 size={14} /> Delete Connection Wire
                </button>
              </div>
            ) : (
              // Node Inspector
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <label style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase' }}>NODE TYPE</label>
                    <div style={{ fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>{selectedElement.type}</div>
                  </div>
                  <button
                    onClick={deleteSelectedElement}
                    style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Trash2 size={12} /> Delete Node
                  </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ color: '#64748b', fontWeight: 700, fontSize: '0.68rem' }}>NODE LABEL / NAME</label>
                  <input
                    type="text"
                    value={selectedElement.data?.label || ''}
                    onChange={e => {
                      const val = e.target.value;
                      setNodes(nds => nds.map(n => n.id === selectedElement.id ? { ...n, data: { ...n.data, label: val } } : n));
                      setSelectedElement(prev => ({ ...prev, data: { ...prev.data, label: val } }));
                    }}
                    style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none', marginTop: '4px', fontWeight: 700 }}
                  />
                </div>

                {/* APP BUILDER TRIGGER CONFIGURATION FOR TRIGGER & ACTION NODES */}
                {(selectedElement.type === 'trigger' || selectedElement.type === 'action' || selectedElement.type === 'widget') && (
                  <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', marginTop: '8px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Zap size={14} color="#e11d48" /> App Builder Trigger Settings
                    </div>

                    {/* EVENT SELECTION (WHEN) */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>WHEN (EVENT TRIGGER)</label>
                      <select
                        value={triggerForm.event}
                        onChange={e => setTriggerForm(f => ({ ...f, event: e.target.value }))}
                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', outline: 'none' }}
                      >
                        <option value="onClick">onClick (Operator Call Button)</option>
                        <option value="onChange">onChange (Sensor State Change)</option>
                        <option value="onStepEnter">onStepEnter (Screen Enter)</option>
                        <option value="timer">Timer Interval (Downtime Counter)</option>
                      </select>
                    </div>

                    {/* ACTION SELECTION (THEN) */}
                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>THEN (ACTION STEP)</label>
                      <select
                        value={triggerForm.actionType}
                        onChange={e => setTriggerForm(f => ({ ...f, actionType: e.target.value }))}
                        style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#ffffff', outline: 'none' }}
                      >
                        <option value="SET_VARIABLE">Set App Variable Value</option>
                        <option value="NAVIGATE_STEP">Navigate to Screen Step</option>
                        <option value="QUERY_TABLE">Query / Log to Database Table</option>
                        <option value="RUN_WORKFLOW">Run Automation (Telegram / Siren)</option>
                        <option value="SHOW_TOAST">Show Notification Alert</option>
                      </select>
                    </div>

                    {/* TARGET VARIABLE CONFIGURATION */}
                    {triggerForm.actionType === 'SET_VARIABLE' && (
                      <div style={{ marginBottom: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>TARGET VARIABLE</label>
                        <input
                          type="text"
                          value={triggerForm.targetVar}
                          onChange={e => setTriggerForm(f => ({ ...f, targetVar: e.target.value }))}
                          placeholder="e.g. Andon_Status"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />

                        <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', marginTop: '8px', marginBottom: '4px' }}>VALUE FORMULA</label>
                        <input
                          type="text"
                          value={triggerForm.valueFormula}
                          onChange={e => setTriggerForm(f => ({ ...f, valueFormula: e.target.value }))}
                          placeholder="e.g. CRITICAL_STOP"
                          style={{ width: '100%', padding: '6px', fontSize: '0.75rem', border: '1px solid #cbd5e1', borderRadius: '6px', outline: 'none' }}
                        />
                      </div>
                    )}

                    {/* SAVE TRIGGER BUTTON */}
                    <button
                      onClick={handleSaveTriggerLogic}
                      style={{
                        marginTop: '6px',
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#6366f1',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(99,102,241,0.3)'
                      }}
                    >
                      <Save size={14} /> Save Trigger to Active Screen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppNodeEditor;
