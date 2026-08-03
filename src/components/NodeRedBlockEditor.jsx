import React, { useState, useCallback, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Play,
  Bug,
  Code,
  GitFork,
  Edit3,
  Clock,
  Globe,
  Radio,
  Database,
  MessageSquare,
  Zap,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Settings,
  Layers,
  Search,
  ChevronRight,
  Terminal,
  Activity
} from 'lucide-react';

// ─── NODE RED COLOR PALETTE DEFINITIONS ───────────────────────────────────────
export const NODE_RED_TYPES = {
  inject: {
    label: 'inject',
    category: 'common',
    color: '#a6bbcf',
    textColor: '#1e293b',
    icon: Play,
    hasInput: false,
    outputs: 1,
    defaultPayload: 'timestamp',
    desc: 'Triggers a flow with a manual click or interval.'
  },
  debug: {
    label: 'debug',
    category: 'common',
    color: '#87a980',
    textColor: '#ffffff',
    icon: Bug,
    hasInput: true,
    outputs: 0,
    desc: 'Displays msg.payload in the Debug sidebar.'
  },
  function: {
    label: 'function',
    category: 'function',
    color: '#fdd835',
    textColor: '#334155',
    icon: Code,
    hasInput: true,
    outputs: 1,
    defaultCode: 'msg.payload = msg.payload.toString().toUpperCase();\nreturn msg;',
    desc: 'Runs custom JavaScript code on incoming msg.'
  },
  switch: {
    label: 'switch',
    category: 'function',
    color: '#fdd835',
    textColor: '#334155',
    icon: GitFork,
    hasInput: true,
    outputs: 2,
    rules: [
      { property: 'payload', op: 'eq', value: 'START' },
      { property: 'payload', op: 'otherwise', value: '' }
    ],
    desc: 'Routes messages based on property rules.'
  },
  change: {
    label: 'change',
    category: 'function',
    color: '#e2d96e',
    textColor: '#334155',
    icon: Edit3,
    hasInput: true,
    outputs: 1,
    rules: [{ action: 'set', property: 'payload', value: 'OK' }],
    desc: 'Sets, changes, or deletes msg properties.'
  },
  delay: {
    label: 'delay',
    category: 'function',
    color: '#e6e6fa',
    textColor: '#334155',
    icon: Clock,
    hasInput: true,
    outputs: 1,
    delaySeconds: 1,
    desc: 'Delays messages passing through the node.'
  },
  http_in: {
    label: 'http in',
    category: 'network',
    color: '#c0deed',
    textColor: '#1e293b',
    icon: Globe,
    hasInput: false,
    outputs: 1,
    endpoint: '/api/v1/data',
    desc: 'Creates an HTTP endpoint for receiving webhooks.'
  },
  mqtt_in: {
    label: 'mqtt in',
    category: 'network',
    color: '#ff80ab',
    textColor: '#ffffff',
    icon: Radio,
    hasInput: false,
    outputs: 1,
    topic: 'mes/telemetry/machine_1',
    desc: 'Subscribes to an MQTT topic.'
  },
  database: {
    label: 'database',
    category: 'storage',
    color: '#90a4ae',
    textColor: '#ffffff',
    icon: Database,
    hasInput: true,
    outputs: 1,
    query: 'SELECT * FROM work_orders LIMIT 10;',
    desc: 'Executes a SQL query against PostgreSQL/Supabase.'
  },
  comment: {
    label: 'comment',
    category: 'common',
    color: '#ffffff',
    textColor: '#64748b',
    icon: MessageSquare,
    hasInput: false,
    outputs: 0,
    desc: 'Add descriptive text nodes on canvas.'
  }
};

// ─── AUTHENTIC NODE-RED STYLE CUSTOM NODE COMPONENT ───────────────────────────
export const NodeRedBlockNode = ({ id, data, selected }) => {
  const nodeDef = NODE_RED_TYPES[data.nodeType] || NODE_RED_TYPES.function;
  const IconComponent = nodeDef.icon;
  const isComment = data.nodeType === 'comment';

  // Output handles generator (e.g. switch nodes have multiple vertical right handles)
  const outputCount = data.outputs !== undefined ? data.outputs : nodeDef.outputs;

  return (
    <div
      style={{
        position: 'relative',
        userSelect: 'none',
        cursor: 'grab'
      }}
    >
      {/* Input Handle (Left) */}
      {nodeDef.hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          id="input"
          style={{
            width: 10,
            height: 10,
            background: '#475569',
            border: '2px solid #ffffff',
            borderRadius: '50%',
            left: -5,
            boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
            zIndex: 10
          }}
        />
      )}

      {/* Main Node Box (Node-RED Capsule Style) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          minWidth: isComment ? '180px' : '150px',
          height: isComment ? 'auto' : '36px',
          padding: isComment ? '8px 12px' : '0 10px 0 6px',
          backgroundColor: isComment ? '#f8fafc' : nodeDef.color,
          color: isComment ? '#334155' : nodeDef.textColor,
          borderRadius: isComment ? '6px' : '6px',
          border: selected
            ? '2px solid #0284c7'
            : isComment
            ? '1.5px dashed #cbd5e1'
            : '1px solid rgba(0,0,0,0.25)',
          boxShadow: selected
            ? '0 0 0 3px rgba(2, 132, 199, 0.25), 0 4px 12px rgba(0,0,0,0.15)'
            : '0 2px 6px rgba(0,0,0,0.12)',
          transition: 'all 0.15s ease',
          fontSize: '0.8rem',
          fontWeight: 700,
          fontFamily: "'Segoe UI', Roboto, sans-serif"
        }}
      >
        {/* Left Button / Trigger Icon for Inject Node */}
        {data.nodeType === 'inject' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (data.onInject) data.onInject(id);
            }}
            title="Click to trigger node"
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.15)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: nodeDef.textColor,
              padding: 0
            }}
          >
            <Play size={12} fill="currentColor" />
          </button>
        )}

        {/* Node Icon Box */}
        {data.nodeType !== 'inject' && (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <IconComponent size={14} />
          </div>
        )}

        {/* Node Label Text */}
        <div
          style={{
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            letterSpacing: '-0.01em'
          }}
        >
          {data.label || nodeDef.label}
        </div>

        {/* Debug Output Badge (Node-RED style output indicator) */}
        {data.nodeType === 'debug' && data.lastPayload !== undefined && (
          <span
            style={{
              fontSize: '0.65rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              padding: '1px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace'
            }}
          >
            msg
          </span>
        )}
      </div>

      {/* Output Handle(s) (Right) */}
      {outputCount > 0 &&
        Array.from({ length: outputCount }).map((_, idx) => {
          // Calculate vertical distribution for multiple outputs (e.g. switch node)
          const topPercent = outputCount === 1 ? 50 : ((idx + 1) * 100) / (outputCount + 1);

          return (
            <Handle
              key={`output-${idx}`}
              type="source"
              position={Position.Right}
              id={`out-${idx}`}
              style={{
                width: 10,
                height: 10,
                background: '#475569',
                border: '2px solid #ffffff',
                borderRadius: '50%',
                right: -5,
                top: `${topPercent}%`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                zIndex: 10
              }}
            />
          );
        })}

      {/* Status indicator below node (Node-RED dot status) */}
      {data.status && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginTop: '4px',
            fontSize: '0.65rem',
            color: '#64748b',
            fontFamily: 'sans-serif'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor:
                data.status.fill === 'green'
                  ? '#22c55e'
                  : data.status.fill === 'red'
                  ? '#ef4444'
                  : data.status.fill === 'yellow'
                  ? '#eab308'
                  : '#94a3b8',
              boxShadow: data.status.fill === 'green' ? '0 0 6px #22c55e' : 'none'
            }}
          />
          <span>{data.status.text}</span>
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  nodeRed: NodeRedBlockNode
};

// ─── INITIAL FLOW DEMO NODES ──────────────────────────────────────────────────
const initialNodes = [
  {
    id: 'inject_1',
    type: 'nodeRed',
    position: { x: 80, y: 150 },
    data: {
      nodeType: 'inject',
      label: 'timestamp (Trigger)',
      payload: '1722686200000',
      status: { fill: 'green', text: 'ready' }
    }
  },
  {
    id: 'function_1',
    type: 'nodeRed',
    position: { x: 300, y: 150 },
    data: {
      nodeType: 'function',
      label: 'Format Sensor Data',
      code: 'msg.payload = { temp: 42.5, status: "OK", timestamp: Date.now() };\nreturn msg;',
      status: { fill: 'green', text: 'active' }
    }
  },
  {
    id: 'switch_1',
    type: 'nodeRed',
    position: { x: 540, y: 150 },
    data: {
      nodeType: 'switch',
      label: 'Check Temp >= 40',
      outputs: 2,
      status: { fill: 'yellow', text: 'evaluating' }
    }
  },
  {
    id: 'debug_normal',
    type: 'nodeRed',
    position: { x: 780, y: 100 },
    data: {
      nodeType: 'debug',
      label: 'msg.payload (Normal)',
      status: { fill: 'green', text: 'connected' }
    }
  },
  {
    id: 'debug_alert',
    type: 'nodeRed',
    position: { x: 780, y: 220 },
    data: {
      nodeType: 'debug',
      label: 'msg.payload (Alert)',
      status: { fill: 'red', text: 'alert high' }
    }
  }
];

const initialEdges = [
  { id: 'e1', source: 'inject_1', sourceHandle: 'out-0', target: 'function_1', targetHandle: 'input', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
  { id: 'e2', source: 'function_1', sourceHandle: 'out-0', target: 'switch_1', targetHandle: 'input', animated: true, style: { stroke: '#0284c7', strokeWidth: 2 } },
  { id: 'e3', source: 'switch_1', sourceHandle: 'out-0', target: 'debug_normal', targetHandle: 'input', style: { stroke: '#64748b', strokeWidth: 2 } },
  { id: 'e4', source: 'switch_1', sourceHandle: 'out-1', target: 'debug_alert', targetHandle: 'input', style: { stroke: '#ef4444', strokeWidth: 2 } }
];

// ─── MAIN EDITOR COMPONENT ───────────────────────────────────────────────────
export default function NodeRedBlockEditor() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [debugLogs, setDebugLogs] = useState([
    { id: 1, time: '17:58:01', nodeName: 'msg.payload (Normal)', topic: 'sensor/temp', payload: '{"temp": 42.5, "status": "OK"}' }
  ]);
  const [activeTab, setActiveTab] = useState('palette'); // 'palette' | 'debug'
  const [searchQuery, setSearchQuery] = useState('');

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: '#0284c7', strokeWidth: 2 }
          },
          eds
        )
      ),
    [setEdges]
  );

  // Handle Inject button click
  const handleInject = useCallback(
    (nodeId) => {
      const timestamp = new Date().toLocaleTimeString();
      const targetNode = nodes.find((n) => n.id === nodeId);
      const payloadVal = targetNode?.data?.payload || timestamp;

      setDebugLogs((prev) => [
        {
          id: Date.now(),
          time: timestamp,
          nodeName: targetNode?.data?.label || 'Inject Node',
          topic: 'manual/trigger',
          payload: typeof payloadVal === 'object' ? JSON.stringify(payloadVal) : String(payloadVal)
        },
        ...prev.slice(0, 49)
      ]);

      // Highlight edges & nodes temporarily
      setNodes((nds) =>
        nds.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, status: { fill: 'green', text: 'triggered at ' + timestamp } } }
            : n
        )
      );
    },
    [nodes, setNodes]
  );

  // Pass onInject handler to inject nodes
  const updatedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onInject: handleInject
      }
    }));
  }, [nodes, handleInject]);

  // Add node from Palette
  const addNode = (typeKey) => {
    const typeDef = NODE_RED_TYPES[typeKey];
    if (!typeDef) return;

    const newNode = {
      id: `${typeKey}_${Date.now()}`,
      type: 'nodeRed',
      position: {
        x: 200 + Math.random() * 100,
        y: 150 + Math.random() * 100
      },
      data: {
        nodeType: typeKey,
        label: typeDef.label,
        outputs: typeDef.outputs,
        status: { fill: 'green', text: 'ready' }
      }
    };

    setNodes((nds) => nds.concat(newNode));
  };

  // Node Selection
  const onNodeClick = (_, node) => {
    setSelectedNode(node);
  };

  const updateSelectedNodeLabel = (val) => {
    if (!selectedNode) return;
    setNodes((nds) =>
      nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: val } } : n))
    );
    setSelectedNode((prev) => ({ ...prev, data: { ...prev.data, label: val } }));
  };

  const deleteSelectedNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
    setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
    setSelectedNode(null);
  };

  // Group node types by category
  const categories = useMemo(() => {
    const groups = {};
    Object.entries(NODE_RED_TYPES).forEach(([key, val]) => {
      if (searchQuery && !val.label.toLowerCase().includes(searchQuery.toLowerCase())) {
        return;
      }
      if (!groups[val.category]) groups[val.category] = [];
      groups[val.category].push({ key, ...val });
    });
    return groups;
  }, [searchQuery]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        backgroundColor: '#0f172a',
        color: '#f8fafc',
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* ─── LEFT SIDEBAR: PALETTE NODES ─────────────────────────────────────── */}
      <div
        style={{
          width: '260px',
          backgroundColor: '#1e293b',
          borderRight: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20
        }}
      >
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(239,68,68,0.4)'
              }}
            >
              <Zap size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#f8fafc' }}>Node-RED Flow</div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Block Node Palette & Visual Engine</div>
            </div>
          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '9px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Filter nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                fontSize: '0.75rem',
                backgroundColor: '#0f172a',
                border: '1px solid #334155',
                borderRadius: '6px',
                color: '#f8fafc',
                outline: 'none'
              }}
            />
          </div>
        </div>

        {/* Palette Accordion List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {Object.keys(categories).length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', padding: '20px' }}>
              No matching node types found.
            </div>
          ) : (
            Object.entries(categories).map(([catName, items]) => (
              <div key={catName} style={{ marginBottom: '16px' }}>
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: '#94a3b8',
                    letterSpacing: '0.05em',
                    marginBottom: '8px',
                    paddingLeft: '4px'
                  }}
                >
                  {catName}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {items.map((node) => {
                    const IconComp = node.icon;
                    return (
                      <div
                        key={node.key}
                        onClick={() => addNode(node.key)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '6px 10px',
                          backgroundColor: node.color,
                          color: node.textColor,
                          borderRadius: '6px',
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
                          transition: 'transform 0.15s ease, filter 0.15s ease',
                          fontSize: '0.78rem',
                          fontWeight: 700
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateX(4px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateX(0)')}
                      >
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '4px',
                            backgroundColor: 'rgba(0,0,0,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <IconComp size={13} />
                        </div>
                        <span style={{ flex: 1 }}>{node.label}</span>
                        <Plus size={14} style={{ opacity: 0.6 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── CENTER: REACTFLOW CANVAS ────────────────────────────────────────── */}
      <div style={{ flex: 1, relative: 'relative', height: '100%' }}>
        {/* Top Control Bar */}
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '280px',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#1e293b',
            padding: '8px 16px',
            borderRadius: '10px',
            border: '1px solid #334155',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
          }}
        >
          <button
            onClick={() => handleInject('inject_1')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              fontSize: '0.78rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(2,132,199,0.4)'
            }}
          >
            <Play size={14} fill="currentColor" /> Deploy & Trigger Flow
          </button>

          <button
            onClick={() => {
              setNodes(initialNodes);
              setEdges(initialEdges);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.75rem',
              cursor: 'pointer'
            }}
          >
            <RotateCcw size={13} /> Reset Canvas
          </button>
        </div>

        <ReactFlow
          nodes={updatedNodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: '#090d16' }}
        >
          <Background color="#1e293b" gap={20} size={1.5} />
          <Controls style={{ backgroundColor: '#1e293b', border: '1px solid #334155', fill: '#f8fafc' }} />
          <MiniMap style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} nodeColor="#a6bbcf" />
        </ReactFlow>
      </div>

      {/* ─── RIGHT SIDEBAR: DEBUG & PROPERTIES INSPECTOR ────────────────────── */}
      <div
        style={{
          width: '320px',
          backgroundColor: '#1e293b',
          borderLeft: '1px solid #334155',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 20
        }}
      >
        {/* Tab Header */}
        <div style={{ display: 'flex', borderBottom: '1px solid #334155' }}>
          <button
            onClick={() => setActiveTab('debug')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === 'debug' ? '#0f172a' : 'transparent',
              color: activeTab === 'debug' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'debug' ? '2px solid #38bdf8' : 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Bug size={14} /> Debug Console
          </button>

          <button
            onClick={() => setActiveTab('properties')}
            style={{
              flex: 1,
              padding: '12px',
              backgroundColor: activeTab === 'properties' ? '#0f172a' : 'transparent',
              color: activeTab === 'properties' ? '#38bdf8' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === 'properties' ? '2px solid #38bdf8' : 'none',
              fontWeight: 700,
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Settings size={14} /> Inspector
          </button>
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {activeTab === 'debug' ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                  Live Payload Log ({debugLogs.length})
                </span>
                <button
                  onClick={() => setDebugLogs([])}
                  style={{
                    fontSize: '0.65rem',
                    color: '#ef4444',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Clear Logs
                </button>
              </div>

              {debugLogs.length === 0 ? (
                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '30px' }}>
                  No debug messages received yet. Click an Inject node to trigger messages!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {debugLogs.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '10px',
                        backgroundColor: '#0f172a',
                        borderRadius: '6px',
                        border: '1px solid #334155',
                        fontSize: '0.75rem',
                        fontFamily: 'monospace'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '0.65rem', marginBottom: '4px' }}>
                        <span style={{ color: '#38bdf8', fontWeight: 700 }}>{log.nodeName}</span>
                        <span>{log.time}</span>
                      </div>
                      <div style={{ color: '#22c55e', wordBreak: 'break-all', whiteSpace: 'pre-wrap' }}>
                        msg.payload: {log.payload}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {selectedNode ? (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>Edit Node Properties</span>
                    <button
                      onClick={deleteSelectedNode}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} /> Delete Node
                    </button>
                  </div>

                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px' }}>Node Name / Label</label>
                    <input
                      type="text"
                      value={selectedNode.data.label || ''}
                      onChange={(e) => updateSelectedNodeLabel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        fontSize: '0.8rem',
                        backgroundColor: '#0f172a',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {selectedNode.data.nodeType === 'function' && (
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: '6px' }}>Function JavaScript Code</label>
                      <textarea
                        rows={6}
                        value={selectedNode.data.code || NODE_RED_TYPES.function.defaultCode}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNodes((nds) => nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, code: val } } : n)));
                        }}
                        style={{
                          width: '100%',
                          padding: '8px',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          backgroundColor: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '6px',
                          color: '#38bdf8',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                      />
                    </div>
                  )}

                  <div style={{ padding: '10px', backgroundColor: '#0f172a', borderRadius: '6px', border: '1px solid #334155', fontSize: '0.7rem', color: '#94a3b8' }}>
                    <strong>Node ID:</strong> {selectedNode.id}<br />
                    <strong>Type:</strong> {selectedNode.data.nodeType}<br />
                    <strong>Outputs:</strong> {selectedNode.data.outputs || 1}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', marginTop: '30px' }}>
                  Click on any block node in the flow canvas to inspect and edit its properties.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
