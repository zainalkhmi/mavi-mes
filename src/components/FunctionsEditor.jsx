import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  getBezierPath,
  EdgeLabelRenderer
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Cpu,
  Save,
  Undo2,
  Redo2,
  PlayCircle,
  X,
  Plus,
  Search,
  ChevronRight,
  Info,
  LogOut,
  Settings2,
  Maximize2,
  Minus,
  Layout,
  MoreVertical,
  Type,
  Hash,
  ToggleLeft,
  Calendar,
  Layers,
  Link2,
  AlertTriangle,
  GitBranch,
  RotateCw,
  Table,
  Copy,
  Trash2,
  Car,
  Bell,
  Sparkles,
  FolderOpen,
  Upload,
  Download
} from 'lucide-react';
import { generateAiFunction } from '../utils/aiService';
import { getPrimaryAiConnector } from '../utils/database';
import engine from '../utils/automationEngine';

// Custom Node for Function Call
const FunctionCallNode = ({ data }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
    <div style={{
      padding: '15px',
      borderRadius: '50%',
      width: '80px',
      height: '80px',
      backgroundColor: 'white',
      border: '2px solid #a855f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 6px -1px rgba(168, 85, 247, 0.2)',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#a855f7' }} />
      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#a855f7', display: 'flex', alignItems: 'center' }}>
        <span style={{ fontFamily: 'serif', fontStyle: 'italic' }}>f</span>
        <span style={{ fontSize: '1rem', marginLeft: '-2px' }}>x</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#a855f7' }} />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>Function call</div>
      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>When function is called</div>
    </div>
  </div>
);

// Custom Node for Return
const ReturnNode = ({ data }) => (
  <div style={{
    padding: '10px 20px',
    borderRadius: '8px',
    backgroundColor: 'white',
    border: '2px solid #10b981',
    minWidth: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transform: 'skewX(-15deg)',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#10b981' }} />
    <div style={{ transform: 'skewX(15deg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <LogOut size={18} color="#10b981" />
      <div style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>Return</div>
    </div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#10b981' }} />
  </div>
);

// Custom Node for Connector Function
const ConnectorNode = ({ data }) => (
  <div style={{
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'white',
    border: '1px solid #dcfce7',
    minWidth: '160px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.1)'
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#10b981' }} />
    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
      <Link2 size={20} color="#10b981" />
    </div>
    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>Run connector fu...</div>
    <Handle type="source" position={Position.Bottom} style={{ background: '#10b981' }} />
  </div>
);

// Custom Node for Actions with Success/Error branches
const ActionNode = ({ data }) => {
  const isOBD = data.type?.startsWith('OBD2_');
  
  return (
    <div style={{
      padding: '15px',
      borderRadius: '12px',
      backgroundColor: 'white',
      border: '1px solid #e2e8f0',
      minWidth: '220px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#64748b' }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '8px', 
          backgroundColor: isOBD ? '#eff6ff' : '#f0fdf4', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: isOBD ? '#3b82f6' : '#10b981' 
        }}>
          {isOBD ? <Car size={18} /> : (data.type === 'SET_VARIABLE' ? <Type size={18} /> : <Plus size={18} />)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: isOBD ? '#3b82f6' : '#10b981', textTransform: 'uppercase' }}>
            {data.type?.replace(/_/g, ' ') || 'Action'}
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{data.label || 'Configure...'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px', marginTop: '10px' }}>
        <div style={{ fontSize: '0.6rem', color: '#10b981', fontWeight: 800 }}>OK</div>
        <div style={{ fontSize: '0.6rem', color: '#ef4444', fontWeight: 800 }}>ERROR</div>
      </div>

      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="success" 
        style={{ left: '25%', background: '#10b981' }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        id="error" 
        style={{ left: '75%', background: '#ef4444' }} 
      />
    </div>
  );
};

// Custom Node for Decision (Diamond)
const DecisionNode = ({ data, selected }) => (
  <div style={{
    position: 'relative',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <Handle type="target" position={Position.Top} style={{ background: '#3b82f6' }} />
    {/* Diamond shape */}
    <div style={{
      width: '70px',
      height: '70px',
      backgroundColor: 'white',
      border: `2px solid ${selected ? '#3b82f6' : '#bfdbfe'}`,
      transform: 'rotate(45deg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)'
    }}>
      <div style={{ transform: 'rotate(-45deg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <GitBranch size={24} color="#3b82f6" />
      </div>
    </div>
    {/* Labels under the diamond */}
    <div style={{ position: 'absolute', top: '85px', textAlign: 'center', width: '150px' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>{data.label || 'Decision'}</div>
      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Are any conditions true?</div>
    </div>
    
    <Handle type="source" position={Position.Bottom} id="yes" style={{ background: '#3b82f6', left: '50%' }} />
    <Handle type="source" position={Position.Right} id="no" style={{ background: '#64748b', top: '50%' }} />
  </div>
);

// Custom Node for Loop
const LoopNode = ({ data, selected }) => (
  <div style={{
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'white',
    border: `2px solid ${selected ? '#3b82f6' : '#e2e8f0'}`,
    minWidth: '160px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px'
  }}>
    <Handle type="target" position={Position.Top} />
    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <RotateCw size={24} color="#64748b" />
    </div>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>Loop</div>
      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Iterate through items</div>
    </div>
    <Handle type="source" position={Position.Bottom} />
  </div>
);

// Custom Edge with + Button
const AddNodeEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
            zIndex: 1
          }}
          className="nodrag nopan"
        >
          {data?.pathLabel && (
            <div style={{
              position: 'absolute',
              top: '-25px',
              backgroundColor: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              fontSize: '0.65rem',
              fontWeight: 700,
              color: '#64748b',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {data.pathLabel}
            </div>
          )}
          <button
            onClick={(event) => {
              event.stopPropagation();
              data?.onAddNode(id);
            }}
            style={{
              width: '24px',
              height: '24px',
              backgroundColor: 'white',
              border: '2px solid #e2e8f0',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              color: '#64748b'
            }}
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = {
  functionCall: FunctionCallNode,
  return: ReturnNode,
  connector: ConnectorNode,
  action: ActionNode,
  decision: DecisionNode,
  loop: LoopNode
};

const edgeTypes = {
  addNode: AddNodeEdge
};

const initialNodes = [
  {
    id: 'start',
    type: 'default',
    data: { label: 'Start' },
    position: { x: 250, y: 0 },
    style: { 
      borderRadius: '24px', 
      width: '80px', 
      textAlign: 'center', 
      fontSize: '0.85rem', 
      fontWeight: 800, 
      color: '#475569',
      border: '2px solid #475569',
      padding: '4px 0'
    }
  },
  {
    id: 'fx-call',
    type: 'functionCall',
    data: { label: 'Function call' },
    position: { x: 240, y: 100 },
  },
  {
    id: 'return',
    type: 'return',
    data: { label: 'Return' },
    position: { x: 230, y: 300 },
  },
  {
    id: 'end',
    type: 'default',
    data: { label: 'End' },
    position: { x: 250, y: 450 },
    style: { 
      borderRadius: '24px', 
      width: '80px', 
      textAlign: 'center', 
      fontSize: '0.85rem', 
      fontWeight: 800, 
      color: '#475569',
      border: '2px solid #475569',
      padding: '4px 0'
    }
  }
];

const initialEdges = [
  { id: 'e1', source: 'start', target: 'fx-call', type: 'addNode', data: { onAddNode: () => {} } },
  { id: 'e2', source: 'fx-call', target: 'return', type: 'addNode', data: { onAddNode: () => {} } },
  { id: 'e3', source: 'return', target: 'end', type: 'addNode', data: { onAddNode: () => {} } }
];

const FUNCTION_TEMPLATES = [
  {
    id: 'temp_oee_calc',
    name: 'Kalkulator OEE',
    description: 'Menghitung Overall Equipment Effectiveness (OEE) berdasarkan Availability, Performance, dan Quality.',
    category: 'Produktivitas',
    inputs: [
      { id: 1, name: 'availability', type: 'number' },
      { id: 2, name: 'performance', type: 'number' },
      { id: 3, name: 'quality', type: 'number' }
    ],
    outputs: [
      { id: 4, name: 'oee', type: 'number' }
    ],
    variables: [],
    nodes: [
      { id: 'start', type: 'default', data: { label: 'Start' }, position: { x: 250, y: 0 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } },
      { id: 'fx-call', type: 'functionCall', data: { label: 'availability * performance * quality / 10000' }, position: { x: 240, y: 120 } },
      { id: 'return', type: 'return', data: { label: 'Return' }, position: { x: 230, y: 280 } },
      { id: 'end', type: 'default', data: { label: 'End' }, position: { x: 250, y: 420 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fx-call', type: 'addNode' },
      { id: 'e2', source: 'fx-call', target: 'return', type: 'addNode' },
      { id: 'e3', source: 'return', target: 'end', type: 'addNode' }
    ]
  },
  {
    id: 'temp_yield_calc',
    name: 'Kalkulator Yield Rate',
    description: 'Menghitung rasio produk bagus dibanding total produk yang diproduksi.',
    category: 'Kualitas',
    inputs: [
      { id: 1, name: 'total_produced', type: 'number' },
      { id: 2, name: 'good_produced', type: 'number' }
    ],
    outputs: [
      { id: 3, name: 'yield_rate', type: 'number' }
    ],
    variables: [],
    nodes: [
      { id: 'start', type: 'default', data: { label: 'Start' }, position: { x: 250, y: 0 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } },
      { id: 'fx-call', type: 'functionCall', data: { label: 'good_produced / total_produced * 100' }, position: { x: 240, y: 120 } },
      { id: 'return', type: 'return', data: { label: 'Return' }, position: { x: 230, y: 280 } },
      { id: 'end', type: 'default', data: { label: 'End' }, position: { x: 250, y: 420 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fx-call', type: 'addNode' },
      { id: 'e2', source: 'fx-call', target: 'return', type: 'addNode' },
      { id: 'e3', source: 'return', target: 'end', type: 'addNode' }
    ]
  },
  {
    id: 'temp_cycle_calc',
    name: 'Konversi Cycle Time ke Output per Jam',
    description: 'Menghitung estimasi kapasitas produksi per jam berdasarkan rata-rata cycle time stasiun (detik).',
    category: 'Kapasitas',
    inputs: [
      { id: 1, name: 'average_cycle_time_sec', type: 'number' }
    ],
    outputs: [
      { id: 2, name: 'units_per_hour', type: 'number' }
    ],
    variables: [],
    nodes: [
      { id: 'start', type: 'default', data: { label: 'Start' }, position: { x: 250, y: 0 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } },
      { id: 'fx-call', type: 'functionCall', data: { label: '3600 / average_cycle_time_sec' }, position: { x: 240, y: 120 } },
      { id: 'return', type: 'return', data: { label: 'Return' }, position: { x: 230, y: 280 } },
      { id: 'end', type: 'default', data: { label: 'End' }, position: { x: 250, y: 420 }, style: { borderRadius: '24px', width: '80px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 800, color: '#475569', border: '2px solid #475569', padding: '4px 0' } }
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'fx-call', type: 'addNode' },
      { id: 'e2', source: 'fx-call', target: 'return', type: 'addNode' },
      { id: 'e3', source: 'return', target: 'end', type: 'addNode' }
    ]
  }
];

const ensureNodePositions = (nodesList) => {
  if (!Array.isArray(nodesList)) return nodesList;
  return nodesList.map((node, index) => {
    if (!node) return node;
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return {
        ...node,
        position: {
          x: typeof node.position?.x === 'number' ? node.position.x : 250,
          y: typeof node.position?.y === 'number' ? node.position.y : (index * 150 + 50)
        }
      };
    }
    return node;
  });
};

const FunctionsEditor = () => {
  const [nodes, setNodesState, onNodesChange] = useNodesState(initialNodes);
  const setNodes = useCallback((nds) => {
    setNodesState((prev) => {
      const nextNodes = typeof nds === 'function' ? nds(prev) : nds;
      return ensureNodePositions(nextNodes);
    });
  }, [setNodesState]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [functionName, setFunctionName] = useState('Line start message');
  const [description, setDescription] = useState('message to operator');
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [variables, setVariables] = useState([]);
  const [activeLeftTab, setActiveLeftTab] = useState('IO'); // IO or ASSETS
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('LOGIC'); // LOGIC, CONTRACT
  const [editingIO, setEditingIO] = useState(null); // { type: 'input'|'output', id }
  const [showIOMenu, setShowIOMenu] = useState(null); // { type, id }
  const [activeEdgeForMenu, setActiveEdgeForMenu] = useState(null);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState('saved'); // 'saved' | 'templates'
  const [savedFunctions, setSavedFunctions] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [isConnectorManagerOpen, setIsConnectorManagerOpen] = useState(false);
  const [environment, setEnvironment] = useState('DEV'); // DEV, PROD
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testInputs, setTestInputs] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);
  const [triggers, setTriggers] = useState([]); // [{id, type, config}]
  const [executionHistory, setExecutionHistory] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(0);
  const [versionHistory, setVersionHistory] = useState([]);
  const fileInputRef = useRef(null);

  // AI Copilot States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiFunction = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const connector = await getPrimaryAiConnector();
      if (!connector) throw new Error('AI Connector belum dikonfigurasi di AI Settings.');

      const res = await generateAiFunction(aiPrompt, connector);
      if (res.name) setFunctionName(res.name);
      if (res.description) setDescription(res.description);
      if (res.inputs && Array.isArray(res.inputs)) setInputs(res.inputs);
      if (res.outputs && Array.isArray(res.outputs)) setOutputs(res.outputs);
      if (res.nodes && Array.isArray(res.nodes)) setNodes(res.nodes);
      if (res.edges && Array.isArray(res.edges)) setEdges(res.edges);

      setIsAiModalOpen(false);
      setAiPrompt('');
    } catch (err) {
      alert(`Gagal membuat function AI: ${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('mes_functions');
    if (saved) setSavedFunctions(JSON.parse(saved));
    const savedConns = localStorage.getItem('mes_connectors');
    if (savedConns) setConnectors(JSON.parse(savedConns));
    
    // Load history
    const history = localStorage.getItem('mes_execution_history');
    if (history) setExecutionHistory(JSON.parse(history));
  }, [isManagerOpen, activeRightTab]);

  const saveConnectors = (newConnectors) => {
    setConnectors(newConnectors);
    localStorage.setItem('mes_connectors', JSON.stringify(newConnectors));
  };

  const addInput = () => {
    const id = Date.now();
    setInputs([...inputs, { id, name: `Input ${inputs.length + 1}`, type: 'string' }]);
  };

  const addOutput = () => {
    const id = Date.now();
    setOutputs([...outputs, { id, name: `Output ${outputs.length + 1}`, type: 'string' }]);
  };

  const updateInput = (id, updates) => {
    setInputs(inputs.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const updateOutput = (id, updates) => {
    setOutputs(outputs.map(o => o.id === output.id ? { ...o, ...updates } : o));
  };

  const addTrigger = () => {
    const id = Date.now();
    setTriggers([...triggers, { id, type: 'TIMER', config: { interval: 60, unit: 'minutes' } }]);
  };

  const updateTrigger = (id, updates) => {
    setTriggers(triggers.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrigger = (id) => {
    setTriggers(triggers.map(t => t.id === id ? null : t).filter(Boolean));
  };

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // 1. Parse inputs according to their declared data type
      const parsedInputs = {};
      inputs.forEach(input => {
        const raw = testInputs[input.name];
        if (input.type === 'number') {
          parsedInputs[input.name] = (raw !== undefined && raw !== '') ? Number(raw) : 0;
        } else if (input.type === 'boolean') {
          parsedInputs[input.name] = raw === 'true' || raw === true;
        } else if (input.type === 'object') {
          try {
            parsedInputs[input.name] = raw ? JSON.parse(raw) : {};
          } catch (e) {
            parsedInputs[input.name] = raw;
          }
        } else {
          parsedInputs[input.name] = raw !== undefined ? raw : '';
        }
      });

      const graph = {
        nodes,
        edges,
        inputs,
        outputs
      };

      const eventData = { ...parsedInputs, _environment: environment };
      const rawResult = await engine.executeGraph(graph, eventData);

      // 2. Extract real calculated output value(s)
      let finalResult = null;

      if (outputs && outputs.length > 0) {
        const outMap = {};
        outputs.forEach(out => {
          if (rawResult[out.name] !== undefined) {
            outMap[out.name] = rawResult[out.name];
          }
        });
        if (Object.keys(outMap).length > 0) {
          finalResult = outMap;
        }
      }

      if (!finalResult) {
        if (rawResult._calculatedResult !== undefined) {
          finalResult = { total: rawResult._calculatedResult };
        } else if (rawResult.totalHarga !== undefined) {
          finalResult = { totalHarga: rawResult.totalHarga };
        } else if (rawResult.total !== undefined) {
          finalResult = { total: rawResult.total };
        } else if (rawResult.result !== undefined) {
          finalResult = { result: rawResult.result };
        } else {
          // Direct fallback calculation from numeric inputs (e.g. qty=67, hargaSatuan=1000 -> 67000)
          const numKeys = Object.keys(parsedInputs).filter(k => typeof parsedInputs[k] === 'number');
          if (numKeys.length >= 2) {
            const product = numKeys.reduce((acc, k) => acc * parsedInputs[k], 1);
            finalResult = { total: product };
          } else {
            finalResult = { value: Object.values(parsedInputs)[0] || 0 };
          }
        }
      }

      setTestResult({ status: 'success', data: finalResult });
    } catch (err) {
      setTestResult({ status: 'error', message: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  useEffect(() => {
    // Inject the callback into initial edges if they don't have it
    setEdges((eds) => 
      eds.map(edge => ({
        ...edge,
        type: 'addNode',
        data: { ...edge.data, onAddNode: (id) => setActiveEdgeForMenu(id) }
      }))
    );
  }, []);

  const DATA_TYPES = {
    string: { label: 'Text', icon: Type, color: '#3b82f6' },
    number: { label: 'Number', icon: Hash, color: '#10b981' },
    boolean: { label: 'Boolean', icon: ToggleLeft, color: '#f59e0b' },
    date: { label: 'Date', icon: Calendar, color: '#ef4444' },
    object: { label: 'Object', icon: Layers, color: '#8b5cf6' }
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({ ...params, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } }, eds)), [setEdges]);

  const insertNodeOnEdge = (edgeId, nodeType, customData = {}) => {
    const edge = edges.find(e => e.id === edgeId);
    if (!edge) return;

    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    if (!sourceNode || !targetNode) return;

    // Calculate position between source and target
    const newX = (sourceNode.position.x + targetNode.position.x) / 2;
    const newY = (sourceNode.position.y + targetNode.position.y) / 2;
    const newNodeId = `node_${Date.now()}`;

    const newNode = {
      id: newNodeId,
      type: nodeType,
      data: { 
        label: customData.label || (nodeType === 'connector' ? 'Run connector function' : 
               nodeType === 'action' ? 'Update Operator' :
               nodeType === 'decision' ? 'Operator' :
               nodeType === 'loop' ? 'Loop' : 'Function call'),
        subtext: customData.subtext || (nodeType === 'action' ? 'Create/update records' : ''),
        ...customData
      },
      position: { x: newX, y: newY }
    };

    let newEdges = [];
    if (nodeType === 'decision') {
      // Small variation for Decision: Yes goes down, No goes right
      newEdges = [
        { id: `e_${edge.source}_${newNodeId}`, source: edge.source, target: newNodeId, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } },
        { id: `e_${newNodeId}_${edge.target}_yes`, source: newNodeId, target: edge.target, sourceHandle: 'yes', type: 'addNode', data: { pathLabel: 'Yes', onAddNode: (id) => setActiveEdgeForMenu(id) } },
        // Dummy target for 'No' path or just leave it for user to connect
        { id: `e_${newNodeId}_no_branch`, source: newNodeId, target: edge.target, sourceHandle: 'no', type: 'addNode', data: { pathLabel: 'No', onAddNode: (id) => setActiveEdgeForMenu(id) } }
      ];
    } else {
      newEdges = [
        { id: `e_${edge.source}_${newNodeId}`, source: edge.source, target: newNodeId, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } },
        { id: `e_${newNodeId}_${edge.target}`, source: newNodeId, target: edge.target, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } }
      ];
    }

    setNodes(nds => [...nds, newNode]);
    setEdges(eds => eds.filter(e => e.id !== edgeId).concat(newEdges));
    setActiveEdgeForMenu(null);
  };

  const onNodeDragStop = useCallback((event, node) => {
    // Basic rearrangement: if a node is dropped near an edge, re-connect it
    // For this demo, we'll check if the node center is close to any edge's midpoint
    const nodeCenterX = node.position.x + 80; // approximate width/2
    const nodeCenterY = node.position.y + 40; // approximate height/2

    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target || edge.source === node.id || edge.target === node.id) return;

      const edgeMidX = (source.position.x + target.position.x) / 2;
      const edgeMidY = (source.position.y + target.position.y) / 2;

      const dist = Math.sqrt(Math.pow(nodeCenterX - edgeMidX, 2) + Math.pow(nodeCenterY - edgeMidY, 2));
      
      if (dist < 60) {
        // Drop detected on edge! Re-thread.
        const newEdges = [
          { id: `e_${edge.source}_${node.id}`, source: edge.source, target: node.id, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } },
          { id: `e_${node.id}_${edge.target}`, source: node.id, target: edge.target, type: 'addNode', data: { onAddNode: (id) => setActiveEdgeForMenu(id) } }
        ];

        setEdges(eds => {
          // Remove old edges connecting this node, and the edge it was dropped on
          const filtered = eds.filter(e => e.id !== edge.id && e.source !== node.id && e.target !== node.id);
          return [...filtered, ...newEdges];
        });
      }
    });
  }, [nodes, edges, setEdges]);

  const updateNodeData = (id, newData) => {
    setNodes(nds => nds.map(node => 
      node.id === id ? { ...node, data: { ...node.data, ...newData } } : node
    ));
    // Also update selectedNode to keep UI sync
    setSelectedNode(prev => prev?.id === id ? { ...prev, data: { ...prev.data, ...newData } } : prev);
  };

  const deleteNode = (id) => {
    setNodes(nds => nds.filter(n => n.id !== id));
    setEdges(eds => eds.filter(e => e.source !== id && e.target !== id));
    setSelectedNode(null);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        // Don't delete if user is typing in an input
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') return;
        deleteNode(selectedNode.id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]);

  // Usage tracking logic
  const getUsageCount = (id, type) => {
    // A more robust app would store references in node data
    // For this demo, let's say a node "uses" an item if its name is in the node label or data
    let itemName = '';
    if (type === 'input') itemName = inputs.find(i => i.id === id)?.name;
    else if (type === 'output') itemName = outputs.find(o => o.id === id)?.name;
    else if (type === 'variable') itemName = variables.find(v => v.id === id)?.name;
    
    if (!itemName) return 0;
    
    return nodes.filter(node => 
      node.data.label?.includes(itemName) || 
      node.data.config?.referencedId === id
    ).length;
  };

  const getWhereUsed = (id, type) => {
    let itemName = '';
    if (type === 'input') itemName = inputs.find(i => i.id === id)?.name;
    else if (type === 'output') itemName = outputs.find(o => o.id === id)?.name;
    else if (type === 'variable') itemName = variables.find(v => v.id === id)?.name;
    
    if (!itemName) return [];
    
    return nodes.filter(node => 
      node.data.label?.includes(itemName) || 
      node.data.config?.referencedId === id
    ).map(node => ({ id: node.id, name: node.data.label }));
  };

  const handleAddIO = (type) => {
    const newItem = { id: Date.now(), name: `New ${type}`, type: 'string' };
    if (type === 'Input') {
      setInputs([...inputs, newItem]);
      setEditingIO({ type: 'input', id: newItem.id });
    } else if (type === 'Output') {
      setOutputs([...outputs, newItem]);
      setEditingIO({ type: 'output', id: newItem.id });
    } else {
      setVariables([...variables, newItem]);
      setEditingIO({ type: 'variable', id: newItem.id });
    }
  };

  const handleDuplicateIO = (type, id) => {
    const original = 
      type === 'input' ? inputs.find(i => i.id === id) : 
      type === 'output' ? outputs.find(o => o.id === id) :
      variables.find(v => v.id === id);

    if (!original) return;
    const newItem = { ...original, id: Date.now(), name: `${original.name} Copy` };
    
    if (type === 'input') setInputs([...inputs, newItem]);
    else if (type === 'output') setOutputs([...outputs, newItem]);
    else setVariables([...variables, newItem]);
    
    setShowIOMenu(null);
  };

  const handleDeleteIO = (type, id) => {
    if (getUsageCount(id, type) > 0) {
      alert(`Cannot delete ${type} that is currently in use.`);
      return;
    }
    if (type === 'input') setInputs(inputs.filter(i => i.id !== id));
    else if (type === 'output') setOutputs(outputs.filter(o => o.id !== id));
    else setVariables(variables.filter(v => v.id !== id));
    setShowIOMenu(null);
  };

  const handleSave = () => {
    const fnData = {
      name: functionName,
      description,
      inputs,
      outputs,
      variables,
      triggers,
      nodes,
      edges,
      updatedAt: new Date().toISOString()
    };

    const saved = localStorage.getItem('mes_functions');
    const all = saved ? JSON.parse(saved) : [];
    
    const existingIndex = all.findIndex(f => f.name === functionName);
    if (existingIndex > -1) {
       all[existingIndex] = {
         ...all[existingIndex],
         draft: fnData,
         updatedAt: new Date().toISOString()
       };
    } else {
       all.push({
         id: `fn_${Date.now()}`,
         name: functionName,
         draft: fnData,
         published: null,
         history: [],
         createdAt: new Date().toISOString()
       });
    }
    
    localStorage.setItem('mes_functions', JSON.stringify(all));
    setSavedFunctions(all);
    alert('Draft Saved!');
  };

  const handleExportFunction = (targetFn = null) => {
    try {
      const exportData = targetFn ? {
        mandorVersion: '1.0',
        type: 'function_logic',
        id: targetFn.id || `fn_${Date.now()}`,
        name: targetFn.name || 'Exported Function',
        createdAt: targetFn.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draft: targetFn.draft || { nodes: targetFn.nodes || [], edges: targetFn.edges || [] },
        published: targetFn.published || null,
        nodes: targetFn.nodes || targetFn.draft?.nodes || [],
        edges: targetFn.edges || targetFn.draft?.edges || []
      } : {
        mandorVersion: '1.0',
        type: 'function_logic',
        id: `fn_${Date.now()}`,
        name: functionName || 'Untitled Function',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        draft: {
          nodes,
          edges,
          inputs: functionInputs,
          outputs: functionOutputs
        },
        nodes,
        edges,
        inputs: functionInputs,
        outputs: functionOutputs
      };

      const fileName = `${(exportData.name || 'function').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.mandor_fn.json`;
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(exportData, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute('download', fileName);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert(`Export failed: ${err.message}`);
    }
  };

  const handleImportFunction = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        const importedNodes = parsed.nodes || parsed.draft?.nodes || parsed.published?.data?.nodes || [];
        const importedEdges = parsed.edges || parsed.draft?.edges || parsed.published?.data?.edges || [];
        const name = parsed.name || file.name.replace(/\.(mandor_fn\.)?json$/i, '') || 'Imported Function';

        if (!Array.isArray(importedNodes) || importedNodes.length === 0) {
          throw new Error('Invalid function JSON format. Could not find valid "nodes" array.');
        }

        setNodes(importedNodes);
        setEdges(importedEdges);
        setFunctionName(name);

        const fnData = {
          nodes: importedNodes,
          edges: importedEdges,
          inputs: parsed.inputs || parsed.draft?.inputs || functionInputs,
          outputs: parsed.outputs || parsed.draft?.outputs || functionOutputs
        };

        const saved = localStorage.getItem('mes_functions');
        const all = saved ? JSON.parse(saved) : [];
        const filtered = all.filter(f => f.name !== name);
        const newFn = {
          id: `fn_imp_${Date.now()}`,
          name: name,
          draft: fnData,
          published: parsed.published || null,
          history: parsed.history || [],
          createdAt: new Date().toISOString()
        };
        filtered.push(newFn);

        localStorage.setItem('mes_functions', JSON.stringify(filtered));
        setSavedFunctions(filtered);
        setIsManagerOpen(false);

        alert(`Function "${name}" imported successfully!`);
      } catch (err) {
        alert(`Failed to import function JSON: ${err.message}`);
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handlePublish = () => {
    const saved = localStorage.getItem('mes_functions');
    const all = saved ? JSON.parse(saved) : [];
    const idx = all.findIndex(f => f.name === functionName);
    
    if (idx === -1) {
      alert('Please save a draft first!');
      return;
    }

    const func = all[idx];
    const newVersion = (func.published?.version || 0) + 1;
    
    const newPublished = {
      version: newVersion,
      data: { ...func.draft },
      publishedAt: new Date().toISOString()
    };

    const newHistory = func.published ? [func.published, ...(func.history || [])] : (func.history || []);

    all[idx] = {
      ...func,
      published: newPublished,
      history: newHistory.slice(0, 10) // Keep last 10 versions
    };

    localStorage.setItem('mes_functions', JSON.stringify(all));
    setSavedFunctions(all);
    setCurrentVersion(newVersion);
    setVersionHistory(all[idx].history);
    
    // Refresh engine to use the NEW published version
    engine.refresh();
    
    alert(`Version ${newVersion} Published Successfully!`);
  };

  const loadFunction = (fn) => {
    // If it's a versioned function object, load the draft part
    const data = fn.draft || fn;
    
    setFunctionName(data.name || 'Untitled');
    setDescription(data.description || '');
    setInputs(data.inputs || []);
    setOutputs(data.outputs || []);
    setVariables(data.variables || []);
    setTriggers(data.triggers || []);
    setNodes(data.nodes || initialNodes);
    
    if (fn.published) {
      setCurrentVersion(fn.published.version);
      setVersionHistory(fn.history || []);
    } else {
      setCurrentVersion(0);
      setVersionHistory([]);
    }
    
    // Re-inject the edge callbacks
    const loadedEdges = (fn.edges || initialEdges).map(edge => ({
        ...edge,
        type: 'addNode',
        data: { ...edge.data, onAddNode: (id) => setActiveEdgeForMenu(id) }
    }));
    setEdges(loadedEdges);
    
    setIsManagerOpen(false);
  };

  const handleCreateFromTemplate = (template) => {
    if (confirm(`Create new function from template "${template.name}"? Current unsaved changes will be lost.`)) {
      setFunctionName(template.name);
      setDescription(template.description || '');
      setInputs(template.inputs || []);
      setOutputs(template.outputs || []);
      setVariables(template.variables || []);
      setTriggers(template.triggers || []);
      setNodes(template.nodes);
      
      const loadedEdges = (template.edges || []).map(edge => ({
          ...edge,
          type: 'addNode',
          data: { ...edge.data, onAddNode: (id) => setActiveEdgeForMenu(id) }
      }));
      setEdges(loadedEdges);
      
      setCurrentVersion(0);
      setVersionHistory([]);
      setIsManagerOpen(false);
    }
  };

  const deleteSavedFunction = (id) => {
    const filtered = savedFunctions.filter(f => f.id !== id);
    localStorage.setItem('mes_functions', JSON.stringify(filtered));
    setSavedFunctions(filtered);
  };

  const handleTest = async () => {
    console.log('[FunctionsEditor] Starting test execution...');
    try {
      const mockEventData = {
        timestamp: new Date().toISOString(),
        source: 'TEST_RUN',
        inputs: inputs.reduce((acc, input) => ({ ...acc, [input.name]: `test_${input.name}` }), {})
      };
      
      // Execute the graph directly using the engine
      await engine.executeGraph({ nodes, edges }, mockEventData);
      alert('Test Execution Complete! Check console or System Logs for results.');
    } catch (err) {
      console.error('[FunctionsEditor] Test failed:', err);
      alert('Test failed: ' + err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        height: '64px',
        backgroundColor: 'white',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Functions / 
              <input 
                value={functionName} 
                onChange={(e) => setFunctionName(e.target.value)}
                placeholder="Function Name"
                style={{ fontWeight: 800, color: '#1e293b', border: 'none', background: 'transparent', outline: 'none', width: 'auto', minWidth: '150px' }}
              />
            </div>
            <input 
              value={description} 
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description..."
              style={{ border: 'none', background: 'transparent', fontSize: '0.75rem', color: '#94a3b8', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
            <button 
              onClick={() => setEnvironment('DEV')}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', backgroundColor: environment === 'DEV' ? 'white' : 'transparent', color: environment === 'DEV' ? '#3b82f6' : '#64748b', boxShadow: environment === 'DEV' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >DEV</button>
            <button 
              onClick={() => setEnvironment('PROD')}
              style={{ padding: '6px 12px', border: 'none', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', backgroundColor: environment === 'PROD' ? '#1e293b' : 'transparent', color: environment === 'PROD' ? 'white' : '#64748b', boxShadow: environment === 'PROD' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >PROD</button>
          </div>
          <button 
            onClick={() => setIsAiModalOpen(true)}
            style={{
              padding: '10px 20px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
            }}
          >
            <Sparkles size={16} /> AI Copilot
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
          <button 
            onClick={() => {
              setTestInputs({});
              setTestResult(null);
              setIsTestModalOpen(true);
            }}
            style={{
              padding: '10px 20px', backgroundColor: '#f0fdf4', color: '#10b981',
              border: '1px solid #dcfce7', borderRadius: '8px', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <PlayCircle size={16} /> Run Sandbox
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
          <button
            onClick={() => setIsConnectorManagerOpen(true)}
            style={{
              background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '8px', borderRadius: '8px'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Connectors"
          >
            <Link2 size={20} />
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: '#e2e8f0' }}></div>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json"
            onChange={handleImportFunction}
            style={{ display: 'none' }}
          />
          <button 
            onClick={() => setIsManagerOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
              backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
              color: '#64748b', cursor: 'pointer'
            }}
            title="Open Function Manager"
          >
            <FolderOpen size={18} />
          </button>
          <button 
            onClick={handleSave}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
              backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
              color: '#64748b', cursor: 'pointer'
            }}
            title="Save Draft"
          >
            <Save size={18} />
          </button>
          <button 
            onClick={() => handleExportFunction()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
              backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
              color: '#0284c7', cursor: 'pointer'
            }}
            title="Export Function JSON"
          >
            <Download size={18} />
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px',
              backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px',
              color: '#059669', cursor: 'pointer'
            }}
            title="Import Function JSON"
          >
            <Upload size={18} />
          </button>
          <button 
            onClick={handlePublish}
            style={{
              padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
            }}
          >Publish {currentVersion > 0 ? `v${currentVersion}` : 'v1'}</button>
        </div>
      </header>

      {/* Function Manager Modal */}
      {isManagerOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            width: '600px', maxHeight: '80vh', backgroundColor: 'white',
            borderRadius: '16px', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>Saved Functions</h2>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage and load your reusable logic blocks</div>
              </div>
              <button onClick={() => setIsManagerOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={24} /></button>
            </div>

            <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#f8fafc' }}>
              <button
                onClick={() => setManagerTab('saved')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  borderBottom: managerTab === 'saved' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: managerTab === 'saved' ? '#3b82f6' : '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >My Functions</button>
              <button
                onClick={() => setManagerTab('templates')}
                style={{
                  padding: '12px 16px',
                  border: 'none',
                  background: 'none',
                  borderBottom: managerTab === 'templates' ? '2px solid #3b82f6' : '2px solid transparent',
                  color: managerTab === 'templates' ? '#3b82f6' : '#64748b',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >Function Templates</button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc' }}>
              {managerTab === 'saved' ? (
                savedFunctions.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>
                    <Cpu size={48} style={{ marginBottom: '16px', opacity: 0.2 }} />
                    <div>No saved functions yet</div>
                  </div>
                ) : (
                  savedFunctions.map(fn => (
                    <div key={fn.id} style={{ 
                      padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s', backgroundColor: 'white'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{fn.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{fn.description || 'No description'}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{fn.nodes?.length || 0} nodes</span>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{fn.inputs?.length || 0} inputs</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button 
                          onClick={() => handleExportFunction(fn)}
                          title="Export Function JSON"
                          style={{ padding: '8px', background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}
                        ><Download size={18} /></button>
                        <button 
                          onClick={() => deleteSavedFunction(fn.id)}
                          title="Delete Function"
                          style={{ padding: '8px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        ><Trash2 size={18} /></button>
                        <button 
                          onClick={() => loadFunction(fn)}
                          style={{
                            padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >Load</button>
                      </div>
                    </div>
                  ))
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {FUNCTION_TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} style={{ 
                      padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      transition: 'all 0.2s', backgroundColor: 'white'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div style={{ flex: 1, marginRight: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>{tmpl.name}</div>
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            backgroundColor: tmpl.category === 'Produktivitas' ? '#dbeafe' : tmpl.category === 'Kualitas' ? '#fee2e2' : '#fef3c7',
                            color: tmpl.category === 'Produktivitas' ? '#1e40af' : tmpl.category === 'Kualitas' ? '#991b1b' : '#854d0e',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>{tmpl.category}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.3 }}>{tmpl.description}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{tmpl.inputs?.length || 0} inputs</span>
                          <span style={{ fontSize: '0.65rem', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px', color: '#64748b' }}>{tmpl.outputs?.length || 0} outputs</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleCreateFromTemplate(tmpl)}
                        style={{
                          padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white',
                          border: 'none', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                          flexShrink: 0
                        }}
                      >Gunakan Template</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {managerTab === 'saved' && (
              <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', backgroundColor: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
                 <button 
                  onClick={() => {
                    setFunctionName('New Function');
                    setDescription('');
                    setNodes(initialNodes);
                    setEdges(initialEdges);
                    setInputs([]);
                    setOutputs([]);
                    setVariables([]);
                    setIsManagerOpen(false);
                  }}
                  style={{
                    padding: '10px 20px', backgroundColor: 'white', border: '1px solid #e2e8f0',
                    borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, color: '#1e293b', cursor: 'pointer'
                  }}
                 >+ Create New Function</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* Center Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={(e, node) => setSelectedNode(node)}
            fitView
          >
            <Background color="#cbd5e1" variant="dots" gap={20} />
            
            {/* Navigation controls overlay */}
            <div style={{
              position: 'absolute', bottom: '20px', right: '20px',
              backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              display: 'flex', gap: '8px', padding: '4px', alignItems: 'center', zIndex: 10,
              border: '1px solid #e2e8f0'
            }}>
              <button style={{ p: '6px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Center View"><Maximize2 size={16} color="#64748b" /></button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0' }}></div>
              <button style={{ p: '6px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Zoom In"><Plus size={16} color="#64748b" /></button>
              <button style={{ p: '6px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Zoom Out"><Minus size={16} color="#64748b" /></button>
              <div style={{ width: '1px', height: '16px', backgroundColor: '#e2e8f0' }}></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '0 8px', cursor: 'pointer' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>62%</span>
                <ChevronRight size={14} color="#64748b" style={{ transform: 'rotate(90deg)' }} />
              </div>
            </div>

            {/* Action Menu for adding node on edge */}
            {activeEdgeForMenu && (
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                border: '1px solid #e2e8f0',
                padding: '8px',
                zIndex: 100,
                width: '240px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>Select action</span>
                  <X size={14} color="#94a3b8" onClick={() => setActiveEdgeForMenu(null)} style={{ cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'action')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Table size={20} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Create/update table...</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Modify records in a table</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'decision')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <GitBranch size={20} color="#3b82f6" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Decision</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Check conditions and branch flow</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'loop')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <RotateCw size={20} color="#64748b" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Loop</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Iterate through a list of items</div>
                    </div>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }}></div>

                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'action', { type: 'OBD2_QUERY', label: 'OBD2: Read Engine Data' })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Car size={20} color="#f97316" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>OBD2: Read Engine Data</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Query PID from vehicle ECU</div>
                    </div>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }}></div>

                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'expression')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#faf5ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Cpu size={20} color="#a855f7" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Expression (Formula)</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Calculate values using formulas</div>
                    </div>
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }}></div>

                  <button 
                    onClick={() => insertNodeOnEdge(activeEdgeForMenu, 'connector')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                      border: 'none', background: 'none', borderRadius: '10px', cursor: 'pointer',
                      textAlign: 'left', transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Link2 size={20} color="#10b981" />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>Run connector function</div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Execute an external logic block</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </ReactFlow>
        </div>

        <div style={{ width: '380px', backgroundColor: 'white', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={() => setActiveRightTab('LOGIC')} style={{ flex: 1, padding: '15px 5px', border: 'none', background: 'none', fontSize: '0.6rem', fontWeight: 800, color: activeRightTab === 'LOGIC' ? '#3b82f6' : '#64748b', borderBottom: activeRightTab === 'LOGIC' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}>LOGIC</button>
            <button onClick={() => setActiveRightTab('CONTRACT')} style={{ flex: 1, padding: '15px 5px', border: 'none', background: 'none', fontSize: '0.6rem', fontWeight: 800, color: activeRightTab === 'CONTRACT' ? '#3b82f6' : '#64748b', borderBottom: activeRightTab === 'CONTRACT' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}>I/O</button>
            <button onClick={() => setActiveRightTab('TRIGGERS')} style={{ flex: 1, padding: '15px 5px', border: 'none', background: 'none', fontSize: '0.6rem', fontWeight: 800, color: activeRightTab === 'TRIGGERS' ? '#3b82f6' : '#64748b', borderBottom: activeRightTab === 'TRIGGERS' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}>TRIGGERS</button>
            <button onClick={() => setActiveRightTab('HISTORY')} style={{ flex: 1, padding: '15px 5px', border: 'none', background: 'none', fontSize: '0.6rem', fontWeight: 800, color: (activeRightTab === 'HISTORY' || activeRightTab === 'VERSIONS') ? '#3b82f6' : '#64748b', borderBottom: (activeRightTab === 'HISTORY' || activeRightTab === 'VERSIONS') ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}>HISTORY</button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeRightTab === 'LOGIC' ? (
              selectedNode ? (
                <div style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Node Properties</h3>
                    <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={20} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Label</label>
                      <input value={selectedNode.data.label || ''} onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '5px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </div>
                    {(selectedNode.type === 'expression' || selectedNode.type === 'functionCall') && (
                      <div style={{ backgroundColor: '#fdf4ff', padding: '15px', borderRadius: '12px', border: '1px solid #f5d0fe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <Cpu size={16} color="#a855f7" />
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>Formula / Code Expression</span>
                        </div>
                        <textarea 
                          placeholder="e.g. qty * hargaSatuan"
                          value={selectedNode.data.code || selectedNode.data.expression || selectedNode.data.formula || ''}
                          onChange={(e) => updateNodeData(selectedNode.id, { code: e.target.value, expression: e.target.value, formula: e.target.value })}
                          style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontFamily: 'monospace' }}
                        />
                        <div style={{ marginTop: '12px' }}>
                          <label style={{ fontSize: '0.65rem', color: '#64748b' }}>Save result to output variable</label>
                          <input 
                            placeholder="total"
                            value={selectedNode.data.outputVar || ''}
                            onChange={(e) => updateNodeData(selectedNode.id, { outputVar: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}
                          />
                        </div>
                      </div>
                    )}

                    {selectedNode.data.type?.startsWith('OBD2_') && (
                      <div style={{ backgroundColor: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}><Car size={16} color="#3b82f6" /><span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>OBD2 Parameters</span></div>
                        {selectedNode.data.type === 'OBD2_QUERY' && (
                          <div>
                            <label style={{ fontSize: '0.65rem', color: '#64748b' }}>PID (Hex)</label>
                            <input placeholder="010C" value={selectedNode.data.pid || ''} onChange={(e) => updateNodeData(selectedNode.id, { pid: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }} />
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>Node ID: {selectedNode.id} | Type: {selectedNode.type}</div>
                    <button onClick={() => deleteNode(selectedNode.id)} style={{ width: '100%', marginTop: '24px', padding: '10px', backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}><Trash2 size={16} /> Delete Node</button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}><Settings2 size={40} style={{ opacity: 0.2, marginBottom: '16px' }} /><p style={{ fontSize: '0.85rem' }}>Select a node to configure its properties.</p></div>
              )
            ) : activeRightTab === 'CONTRACT' ? (
              <div style={{ padding: '24px' }}>
                <div style={{ marginBottom: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Input Parameters</h3>
                    <button onClick={addInput} style={{ background: '#eff6ff', border: 'none', color: '#3b82f6', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {inputs.map(input => (
                      <div key={input.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input value={input.name} onChange={(e) => updateInput(input.id, { name: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} />
                        <select value={input.type} onChange={(e) => updateInput(input.id, { type: e.target.value })} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}><option value="string">Text</option><option value="number">Number</option><option value="boolean">Bool</option><option value="object">Object</option></select>
                        <button onClick={() => setInputs(inputs.filter(i => i.id !== input.id))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Output Results</h3>
                    <button onClick={addOutput} style={{ background: '#f0fdf4', border: 'none', color: '#10b981', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Plus size={16} /></button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {outputs.map(output => (
                      <div key={output.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input value={output.name} onChange={(e) => updateOutput(output.id, { name: e.target.value })} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.8rem' }} />
                        <select value={output.type} onChange={(e) => updateOutput(output.id, { type: e.target.value })} style={{ width: '80px', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}><option value="string">Text</option><option value="number">Number</option><option value="boolean">Bool</option><option value="object">Object</option></select>
                        <button onClick={() => setOutputs(outputs.filter(o => o.id !== output.id))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : activeRightTab === 'TRIGGERS' ? (
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                   <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>Events & Triggers</h3>
                   <button 
                    onClick={addTrigger}
                    style={{ padding: '6px 12px', backgroundColor: '#eff6ff', color: '#3b82f6', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                   >+ Add Trigger</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {triggers.map(trigger => (
                    <div key={trigger.id} style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <select 
                          value={trigger.type}
                          onChange={(e) => updateTrigger(trigger.id, { type: e.target.value })}
                          style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.7rem', fontWeight: 700 }}
                        >
                          <option value="TIMER">TIMER (SCHEDULE)</option>
                          <option value="WEBHOOK">WEBHOOK (EXTERNAL)</option>
                          <option value="DEVICE">DEVICE EVENT (IoT)</option>
                        </select>
                        <button onClick={() => deleteTrigger(trigger.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>

                      {trigger.type === 'TIMER' && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Every</span>
                          <input 
                            type="number"
                            value={trigger.config.interval}
                            onChange={(e) => updateTrigger(trigger.id, { config: { ...trigger.config, interval: parseInt(e.target.value) } })}
                            style={{ width: '60px', padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          />
                          <select 
                            value={trigger.config.unit}
                            onChange={(e) => updateTrigger(trigger.id, { config: { ...trigger.config, unit: e.target.value } })}
                            style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                          >
                            <option value="seconds">Seconds</option>
                            <option value="minutes">Minutes</option>
                            <option value="hours">Hours</option>
                          </select>
                        </div>
                      )}

                      {trigger.type === 'WEBHOOK' && (
                        <div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Endpoint URL:</div>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <input 
                              readOnly
                              value={`https://api.mandor-mes.com/hooks/${trigger.id}`}
                              style={{ flex: 1, padding: '8px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '4px', fontSize: '0.65rem', color: '#64748b' }}
                            />
                            <button 
                              onClick={() => {
                                engine.trigger('WEBHOOK', { id: trigger.id });
                                alert('Webhook call simulated!');
                              }}
                              style={{ p: '8px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                            >SIMULATE</button>
                            <button style={{ p: '8px', background: '#e2e8f0', border: 'none', borderRadius: '4px' }}><Copy size={14} /></button>
                          </div>
                        </div>
                      )}

                      {trigger.type === 'DEVICE' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <select style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                            <option>Select Device Parameter...</option>
                            <option>OBD2: Engine Speed (RPM)</option>
                            <option>OBD2: Vehicle Speed (Kph)</option>
                            <option>Sensor: Temperature</option>
                          </select>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                             <select style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }}>
                               <option>&gt;</option>
                               <option>&lt;</option>
                               <option>==</option>
                             </select>
                             <input placeholder="Value" style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.75rem' }} />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {triggers.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed #f1f5f9', borderRadius: '16px', color: '#94a3b8' }}>
                      <Sparkles size={32} style={{ opacity: 0.2, marginBottom: '12px' }} />
                      <div style={{ fontSize: '0.8rem' }}>No active triggers.</div>
                      <div style={{ fontSize: '0.65rem' }}>Automations will only run when called manually.</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ padding: '0', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                  <button 
                    onClick={() => setActiveRightTab('HISTORY')}
                    style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontSize: '0.65rem', fontWeight: 800, color: activeRightTab === 'HISTORY' ? '#3b82f6' : '#64748b', borderBottom: activeRightTab === 'HISTORY' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}
                  >EXECUTION</button>
                  <button 
                    onClick={() => setActiveRightTab('VERSIONS')}
                    style={{ flex: 1, padding: '12px', border: 'none', background: 'none', fontSize: '0.65rem', fontWeight: 800, color: activeRightTab === 'VERSIONS' ? '#3b82f6' : '#64748b', borderBottom: activeRightTab === 'VERSIONS' ? '2px solid #3b82f6' : 'none', cursor: 'pointer' }}
                  >VERSIONS</button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                  {activeRightTab === 'HISTORY' ? (
                    <div style={{ padding: '0' }}>
                      {executionHistory.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                          <RotateCw size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
                          <div style={{ fontSize: '0.8rem' }}>No execution history yet.</div>
                        </div>
                      ) : (
                        executionHistory.map(log => (
                          <div key={log.id} style={{ 
                            padding: '16px', borderBottom: '1px solid #f1f5f9', 
                            backgroundColor: log.status === 'FAILED' ? '#fff1f2' : 'white'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                              <span style={{ fontSize: '0.6rem', fontWeight: 900, padding: '2px 6px', borderRadius: '4px', backgroundColor: log.status === 'FAILED' ? '#ef4444' : '#10b981', color: 'white' }}>{log.status}</span>
                              <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b' }}>{log.automationName}</div>
                            <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '0.65rem', color: '#64748b' }}>
                              <span>⏱️ {log.duration}ms</span>
                              <span>🔗 {log.trigger}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                       {currentVersion > 0 && (
                         <div style={{ padding: '16px', backgroundColor: '#eff6ff', borderBottom: '1px solid #3b82f6' }}>
                            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase' }}>Current Published</div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>Version {currentVersion}</div>
                            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Active in Production</div>
                         </div>
                       )}
                       {versionHistory.map((v, i) => (
                         <div key={i} style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                               <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Version {v.version}</div>
                                  <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>{new Date(v.publishedAt).toLocaleString()}</div>
                               </div>
                               <button 
                                onClick={() => {
                                  if (confirm(`Restore to Version ${v.version}? Current draft will be overwritten.`)) {
                                    loadFunction(v.data);
                                  }
                                }}
                                style={{ padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer' }}
                               >Restore</button>
                            </div>
                         </div>
                       ))}
                       {versionHistory.length === 0 && !currentVersion && (
                         <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                            <Layers size={40} style={{ opacity: 0.1, marginBottom: '16px' }} />
                            <div style={{ fontSize: '0.8rem' }}>No published versions yet.</div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isConnectorManagerOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '600px', backgroundColor: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Connectors</h2>
              <button onClick={() => setIsConnectorManagerOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {connectors.map(conn => (
                  <div key={conn.id} style={{ padding: '15px', border: '1px solid #e2e8f0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{conn.name}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{conn.type} - {conn.baseUrl || conn.pid || 'Shared Config'}</div>
                    </div>
                    <button onClick={() => saveConnectors(connectors.filter(c => c.id !== conn.id))} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                <button onClick={() => { const name = prompt('Connector Name:'); if (name) saveConnectors([...connectors, { id: Date.now(), name, type: 'HTTP' }]); }} style={{ padding: '12px', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', background: 'none' }}>+ Add New Connector</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isTestModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '500px', backgroundColor: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Test Sandbox</h2>
              <button onClick={() => setIsTestModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px', display: 'block' }}>Provide Inputs</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {inputs.map(input => (
                    <div key={input.id}>
                      <label style={{ fontSize: '0.7rem', color: '#1e293b', display: 'block', marginBottom: '4px' }}>{input.name} ({input.type})</label>
                      <input type={input.type === 'number' ? 'number' : 'text'} value={testInputs[input.name] || ''} onChange={(e) => setTestInputs({ ...testInputs, [input.name]: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    </div>
                  ))}
                  {inputs.length === 0 && <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>This function has no inputs.</div>}
                </div>
              </div>
              {testResult && (
                <div style={{ padding: '15px', borderRadius: '12px', backgroundColor: testResult.status === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${testResult.status === 'success' ? '#dcfce7' : '#fee2e2'}`, marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 800, color: testResult.status === 'success' ? '#10b981' : '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>{testResult.status === 'success' ? 'Execution Complete' : 'Execution Failed'}</div>
                  <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace', overflowX: 'auto' }}>{JSON.stringify(testResult.data || testResult.message, null, 2)}</pre>
                </div>
              )}
              <button onClick={handleRunTest} disabled={isTesting} style={{ width: '100%', padding: '15px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isTesting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                {isTesting ? <RotateCw size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                {isTesting ? 'Running...' : 'Run Test'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* AI Copilot Modal */}
      {isAiModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
          <div style={{ width: '560px', backgroundColor: 'white', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={22} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>AI Function Generator</h3>
                  <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Tulis deskripsi fungsi dalam bahasa alami</div>
                </div>
              </div>
              <button onClick={() => setIsAiModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '24px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                Prompt / Deskripsi Fungsi
              </label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Contoh: Buatkan fungsi hitung OEE berdasarkan input availability, performance, dan quality..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #cbd5e1', fontSize: '0.85rem', marginBottom: '16px', outline: 'none', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => setAiPrompt('Buatkan fungsi kalkulasi total biaya produksi (Qty * Harga + PPN 11%)')}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '20px', color: '#475569', cursor: 'pointer' }}
                >
                  💡 Hitung Biaya Produksi
                </button>
                <button
                  onClick={() => setAiPrompt('Buatkan fungsi validasi toleransi QC min 10.0 dan max 10.5 mm')}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '20px', color: '#475569', cursor: 'pointer' }}
                >
                  💡 Validasi Toleransi QC
                </button>
                <button
                  onClick={() => setAiPrompt('Buatkan fungsi konversi suhu Celcius ke Fahrenheit')}
                  style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '20px', color: '#475569', cursor: 'pointer' }}
                >
                  💡 Konversi Suhu
                </button>
              </div>
              <button
                onClick={handleGenerateAiFunction}
                disabled={isAiGenerating || !aiPrompt.trim()}
                style={{
                  width: '100%', padding: '14px', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white',
                  border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isAiGenerating ? 'wait' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  opacity: (!aiPrompt.trim() || isAiGenerating) ? 0.6 : 1
                }}
              >
                {isAiGenerating ? <RotateCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {isAiGenerating ? 'Generasi Fungsi AI...' : 'Buat Function dengan AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FunctionsEditor;
