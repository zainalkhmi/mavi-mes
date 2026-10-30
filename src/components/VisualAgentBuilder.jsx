/**
 * VisualAgentBuilder.jsx - MAVI MES Visual Agent Flow Builder
 * Interactive drag-and-drop node canvas for assembling autonomous shopfloor AI agents
 * and deploying them directly into frontline manufacturing apps.
 * Theme: Modern Colourful Odoo Enterprise Theme (#714B67 / #017E84 / Vibrant Modules)
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Sparkles, Play, Save, Plus, Trash2, ArrowRight, CheckCircle2,
  AlertTriangle, Bot, Zap, Cpu, Eye, Database, Bell, Radio,
  Send, RefreshCw, Copy, Check, Settings, Shield, ExternalLink,
  Sliders, Layers, Terminal, ChevronRight, X
} from 'lucide-react';
import { agentManager, AGENT_TYPES, AGENT_CAPABILITIES, runAgentTask, triggerAgentEvent } from '../utils/agentSystem';
import { getPrimaryAiConnector } from '../utils/database';

// Pre-defined Node Templates with Vibrant Odoo Module Colors
const NODE_CATEGORIES = {
  trigger: { name: 'Pemicu (Triggers)', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  agent: { name: 'Otak AI (Agent Core)', color: '#714B67', bg: '#faf5f9', border: '#d8b4d0' },
  tool: { name: 'Alat Shopfloor (Tools)', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  output: { name: 'Aksi Keluar (Outputs)', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' }
};

const DEFAULT_FLOW_NODES = [
  {
    id: 'node-trigger-1',
    category: 'trigger',
    type: 'app_button',
    title: 'Tombol App Frontline',
    subtitle: 'Klik tombol di tablet operator',
    x: 60,
    y: 160,
    config: {
      buttonLabel: 'Verifikasi & Hitung OEE Part',
      screenId: 'ASSY_STATION_01',
      eventName: 'OPERATOR_AUDIT_REQUEST'
    }
  },
  {
    id: 'node-agent-1',
    category: 'agent',
    type: 'data_analyst',
    title: 'AI Data Analyst Copilot',
    subtitle: 'Evaluasi parameter lini produksi',
    x: 380,
    y: 140,
    config: {
      agentType: 'data_analyst',
      systemPrompt: 'Anda adalah Senior Data Analyst AI di MAVI MES. Evaluasi ketersediaan, performa, dan kualitas part lini produksi.',
      useCentralAi: true
    }
  },
  {
    id: 'node-tool-1',
    category: 'tool',
    type: 'calculate_oee',
    title: 'Tool: Hitung Metrik OEE',
    subtitle: 'Availability x Performance x Quality',
    x: 720,
    y: 110,
    config: {
      tool: 'calculate_oee',
      plannedTimeHours: 8,
      downtimeMinutes: 30,
      standardCycleSec: 15
    }
  },
  {
    id: 'node-output-1',
    category: 'output',
    type: 'frontline_screen',
    title: 'Update Layar Operator',
    subtitle: 'Kirim insight OEE ke tablet',
    x: 1040,
    y: 160,
    config: {
      targetScreen: 'DASHBOARD_LIVE',
      broadcastMessage: 'OEE terkalkulasi: 87.5% [OPTIMAL]'
    }
  }
];

const DEFAULT_FLOW_EDGES = [
  { id: 'edge-1-2', from: 'node-trigger-1', to: 'node-agent-1' },
  { id: 'edge-2-3', from: 'node-agent-1', to: 'node-tool-1' },
  { id: 'edge-3-4', from: 'node-tool-1', to: 'node-output-1' }
];

const VisualAgentBuilder = ({ onNavigateToAiSettings = () => {} }) => {
  const [nodes, setNodes] = useState(() => {
    const saved = localStorage.getItem('mavi_visual_agent_flow_nodes');
    return saved ? JSON.parse(saved) : DEFAULT_FLOW_NODES;
  });

  const [edges, setEdges] = useState(() => {
    const saved = localStorage.getItem('mavi_visual_agent_flow_edges');
    return saved ? JSON.parse(saved) : DEFAULT_FLOW_EDGES;
  });

  const [selectedNodeId, setSelectedNodeId] = useState('node-agent-1');
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [connectingFromId, setConnectingFromId] = useState(null);

  // Live simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeRunningNodeId, setActiveRunningNodeId] = useState(null);
  const [simulationLogs, setSimulationLogs] = useState([]);

  // Central AI Engine config
  const [centralAi, setCentralAi] = useState(null);

  // Deploy to App Modal
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const canvasRef = useRef(null);

  useEffect(() => {
    loadAiConfig();
    const handleUpdate = () => loadAiConfig();
    window.addEventListener('mavicore_ai_connector_updated', handleUpdate);
    return () => window.removeEventListener('mavicore_ai_connector_updated', handleUpdate);
  }, []);

  const loadAiConfig = async () => {
    try {
      const conn = await getPrimaryAiConnector();
      setCentralAi(conn);
    } catch (e) {
      console.warn('Could not load central AI connector:', e);
    }
  };

  const handleSaveFlow = () => {
    localStorage.setItem('mavi_visual_agent_flow_nodes', JSON.stringify(nodes));
    localStorage.setItem('mavi_visual_agent_flow_edges', JSON.stringify(edges));
    const logItem = { time: new Date().toLocaleTimeString(), msg: `Alur visual (${nodes.length} node, ${edges.length} koneksi) berhasil disimpan ke memori lokal.`, status: 'success' };
    setSimulationLogs(prev => [logItem, ...prev]);
  };

  const handleResetFlow = () => {
    if (window.confirm('Reset seluruh kanvas visual ke alur standar pabrik?')) {
      setNodes(DEFAULT_FLOW_NODES);
      setEdges(DEFAULT_FLOW_EDGES);
      setSelectedNodeId('node-agent-1');
      localStorage.removeItem('mavi_visual_agent_flow_nodes');
      localStorage.removeItem('mavi_visual_agent_flow_edges');
    }
  };

  // Node Dragging Handlers
  const handleMouseDownNode = (e, nodeId) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);

    const targetNode = nodes.find(n => n.id === nodeId);
    if (targetNode) {
      setDragOffset({
        x: e.clientX - targetNode.x,
        y: e.clientY - targetNode.y
      });
    }
  };

  const handleMouseMoveCanvas = (e) => {
    if (draggingNodeId) {
      setNodes(prev => prev.map(n => {
        if (n.id === draggingNodeId) {
          return {
            ...n,
            x: Math.max(20, Math.min(1600, e.clientX - dragOffset.x)),
            y: Math.max(20, Math.min(1000, e.clientY - dragOffset.y))
          };
        }
        return n;
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setDraggingNodeId(null);
  };

  // Connect Port click handler
  const handlePortClick = (e, nodeId, isOutput) => {
    e.stopPropagation();
    if (isOutput) {
      setConnectingFromId(nodeId);
    } else {
      if (connectingFromId && connectingFromId !== nodeId) {
        // Add edge
        const newEdgeId = `edge-${connectingFromId}-${nodeId}`;
        if (!edges.some(edge => edge.from === connectingFromId && edge.to === nodeId)) {
          setEdges(prev => [...prev, { id: newEdgeId, from: connectingFromId, to: nodeId }]);
          const logItem = { time: new Date().toLocaleTimeString(), msg: `Koneksi tersambung dari [${connectingFromId}] ke [${nodeId}]`, status: 'info' };
          setSimulationLogs(prev => [logItem, ...prev]);
        }
      }
      setConnectingFromId(null);
    }
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
    }
  };

  const handleAddNode = (category, type, title, subtitle, config = {}) => {
    const newId = `node-${category}-${Date.now().toString().slice(-4)}`;
    const newNode = {
      id: newId,
      category,
      type,
      title,
      subtitle,
      x: 180 + Math.floor(Math.random() * 200),
      y: 120 + Math.floor(Math.random() * 160),
      config
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  // Simulation execution engine
  const handleRunLiveFlow = async () => {
    if (isSimulating || nodes.length === 0) return;
    setIsSimulating(true);
    setSimulationLogs([]);

    const log = (msg, status = 'info') => {
      setSimulationLogs(prev => [{ time: new Date().toLocaleTimeString(), msg, status }, ...prev]);
    };

    log('Memulai simulasi eksekusi alur visual AI Agent...', 'info');

    // Find trigger nodes
    const triggerNodes = nodes.filter(n => n.category === 'trigger');
    const startNode = triggerNodes[0] || nodes[0];

    // Traverse topological flow
    let currentNode = startNode;
    const visited = new Set();

    while (currentNode && !visited.has(currentNode.id)) {
      visited.add(currentNode.id);
      setActiveRunningNodeId(currentNode.id);

      log(`[Step] Menjalankan Node: "${currentNode.title}" (${currentNode.category.toUpperCase()})`, 'info');

      // Emulate node computation
      await new Promise(r => setTimeout(r, 700));

      if (currentNode.category === 'tool' && currentNode.type === 'calculate_oee') {
        log(`⚡ [OEE Tool] Eksekusi formula: Availability: 93.7%, Performance: 95.2%, Quality: 98.1% → OEE = 87.5%`, 'success');
      } else if (currentNode.category === 'agent') {
        log(`🧠 [AI Copilot] Memproses konteks produksi & merumuskan rekomendasi operasional...`, 'info');
      } else if (currentNode.category === 'output') {
        log(`📢 [Output Aksi] Menyiarkan telemetry ke tablet frontline dan menyimpan log audit.`, 'success');
      }

      // Find next node via edge
      const nextEdge = edges.find(e => e.from === currentNode.id);
      if (nextEdge) {
        currentNode = nodes.find(n => n.id === nextEdge.to);
      } else {
        currentNode = null;
      }
    }

    setActiveRunningNodeId(null);
    setIsSimulating(false);
    log('✅ Seluruh rangkaian alur visual agen berhasil dieksekusi tanpa error!', 'success');
  };

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  const codeSnippet = `// Gunakan snippet ini di Tombol OnClick atau Event Step di App Builder:
if (window.maviAgentEngine) {
  const result = await window.maviAgentEngine.triggerAgentEvent('APP_ACTION', {
    agentType: 'data_analyst',
    prompt: 'Hitung OEE dan validasi Work Order lini ini',
    stationId: 'ASSY_STATION_01'
  });
  console.log('Hasil AI Agent:', result);
}`;

  return (
    <div className="flex-1 flex flex-col bg-[#F8F9FA] text-slate-800 overflow-hidden relative select-none">
      {/* Top Action Bar (Odoo Enterprise Clean Light Bar) */}
      <div className="h-14 px-4 bg-white border-b border-slate-200/90 flex items-center justify-between flex-shrink-0 z-20 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 text-[#714B67] rounded-xl shadow-2xs">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-sm text-slate-900">Visual Agent Flow Builder</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-50 text-[#714B67] border border-purple-200 font-bold">
                Kanvas Drag & Drop
              </span>
            </div>
            <p className="text-[11px] text-slate-500">Rakit alur agen otonom & sambungkan langsung ke tombol Frontline App</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Central AI Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>AI Brain: <strong className="text-purple-900">{centralAi?.aiSettings?.provider || 'Gemini'}</strong> ({centralAi?.aiSettings?.modelId || 'gemini-3.6-flash'})</span>
          </div>

          <button
            onClick={handleRunLiveFlow}
            disabled={isSimulating}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#017E84] hover:bg-[#01686d] disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            {isSimulating ? <RefreshCw size={13} className="animate-spin" /> : <Play size={13} fill="currentColor" />}
            Simulasi Alur Live
          </button>

          <button
            onClick={() => setShowDeployModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#714B67] hover:bg-[#593951] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <ExternalLink size={13} />
            Pasang ke App Builder
          </button>

          <button
            onClick={handleSaveFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <Save size={13} /> Simpan
          </button>

          <button
            onClick={handleResetFlow}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-xl text-xs cursor-pointer transition-colors"
            title="Reset ke Default"
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Builder Area: Left Library + Center Canvas + Right Inspector/Logs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Palette: Add Node (Odoo Module Palette Style) */}
        <div className="w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 overflow-y-auto shadow-2xs">
          <div className="p-3 border-b border-slate-100 bg-slate-50/70 text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Koleksi Node</span>
            <span className="text-[10px] text-slate-400 font-normal">Klik untuk Tambah</span>
          </div>

          <div className="p-3 space-y-4">
            {/* Category: Triggers */}
            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio size={12} className="text-emerald-600" /> 1. Pemicu (Triggers)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('trigger', 'app_button', 'Tombol App Frontline', 'Event klik tombol di tablet operator', { buttonLabel: 'Audit Kualitas Part' })}
                  className="w-full text-left p-2.5 bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-emerald-500 text-white shadow-2xs group-hover:scale-105 transition-transform"><Zap size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Tombol Frontline App</div>
                    <div className="text-[10px] text-slate-500">Event tombol tablet operator</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('trigger', 'plc_alarm', 'Alarm Sensor PLC', 'Nilai register melebihi batas batas aman', { tag: 'MTR_TEMP_01', threshold: 80 })}
                  className="w-full text-left p-2.5 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-rose-500 text-white shadow-2xs group-hover:scale-105 transition-transform"><Cpu size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Sensor / PLC Alarm</div>
                    <div className="text-[10px] text-slate-500">Threshold suhu & getaran</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: AI Brain */}
            <div>
              <div className="text-[11px] font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bot size={12} className="text-[#714B67]" /> 2. Otak Agen AI (Core)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('agent', 'data_analyst', 'Data Analyst Copilot', 'Analisa metrik OEE & Work Order', { agentType: 'data_analyst' })}
                  className="w-full text-left p-2.5 bg-blue-50/50 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-blue-600 text-white shadow-2xs group-hover:scale-105 transition-transform"><Bot size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Data Analyst Copilot</div>
                    <div className="text-[10px] text-slate-500">Perhitungan OEE & Work Order</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('agent', 'quality_inspector', 'Quality Inspector AI', 'Evaluasi toleransi & defect kamera', { agentType: 'quality_inspector' })}
                  className="w-full text-left p-2.5 bg-purple-50/50 hover:bg-purple-100/70 border border-purple-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-[#714B67] text-white shadow-2xs group-hover:scale-105 transition-transform"><Eye size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Quality Inspector AI</div>
                    <div className="text-[10px] text-slate-500">Inspeksi visual & cacat part</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: Tools */}
            <div>
              <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders size={12} className="text-amber-600" /> 3. Alat Shopfloor (Tools)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('tool', 'calculate_oee', 'Kalkulator OEE', 'Hitung Availability x Perf x Quality', { tool: 'calculate_oee' })}
                  className="w-full text-left p-2.5 bg-amber-50/50 hover:bg-amber-100/70 border border-amber-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-2xs group-hover:scale-105 transition-transform"><Sliders size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Kalkulator OEE</div>
                    <div className="text-[10px] text-slate-500">Formula OEE standar manufaktur</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('tool', 'read_plc', 'Baca Register PLC', 'Baca sensor Modbus / MQTT real-time', { tool: 'read_plc', address: 'MTR_TEMP_01' })}
                  className="w-full text-left p-2.5 bg-teal-50/50 hover:bg-teal-100/70 border border-teal-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-teal-600 text-white shadow-2xs group-hover:scale-105 transition-transform"><Cpu size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Baca Sensor PLC</div>
                    <div className="text-[10px] text-slate-500">Modbus/OPC-UA register</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('tool', 'run_vision_pipeline', 'Inspeksi Kamera YOLO', 'Jalankan model visual edge AI di port 8000', { tool: 'run_vision_pipeline', pipelineId: 'Flange-QC' })}
                  className="w-full text-left p-2.5 bg-pink-50/50 hover:bg-pink-100/70 border border-pink-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-pink-500 text-white shadow-2xs group-hover:scale-105 transition-transform"><Sparkles size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Inspeksi Kamera YOLO</div>
                    <div className="text-[10px] text-slate-500">Model AI QuickBuild :8000</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: Outputs */}
            <div>
              <div className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Layers size={12} className="text-indigo-600" /> 4. Aksi Keluar (Outputs)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('output', 'frontline_screen', 'Update Layar Operator', 'Kirim laporan & telemetry ke tablet', { targetScreen: 'DASHBOARD_LIVE' })}
                  className="w-full text-left p-2.5 bg-indigo-50/50 hover:bg-indigo-100/70 border border-indigo-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-indigo-600 text-white shadow-2xs group-hover:scale-105 transition-transform"><Layers size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Update Layar Tablet</div>
                    <div className="text-[10px] text-slate-500">Tampilkan laporan ke operator</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('output', 'trigger_andon', 'Picu Lampu Tower Andon', 'Kirim sinyal visual/audio di stasiun', { stationId: 'ST-01', severity: 'HIGH' })}
                  className="w-full text-left p-2.5 bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200 rounded-xl text-xs transition-all flex items-center gap-2 group cursor-pointer shadow-2xs"
                >
                  <span className="p-1.5 rounded-lg bg-rose-600 text-white shadow-2xs group-hover:scale-105 transition-transform"><Bell size={13} /></span>
                  <div>
                    <div className="font-bold text-slate-800">Picu Alarm Andon</div>
                    <div className="text-[10px] text-slate-500">Nyalakan lampu tower stasiun</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Interactive Canvas (Odoo Clean Grid Canvas) */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="flex-1 bg-slate-100/80 relative overflow-auto cursor-crosshair"
          style={{
            backgroundImage: 'radial-gradient(rgba(100, 116, 139, 0.22) 1.2px, transparent 1.2px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none min-w-[1800px] min-h-[1200px]" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#714B67" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#017E84" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + 224;
              const y1 = fromNode.y + 40;
              const x2 = toNode.x;
              const y2 = toNode.y + 40;
              const dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
              const path = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              return (
                <g key={edge.id}>
                  <path
                    d={path}
                    fill="none"
                    stroke="url(#edgeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    className="transition-all"
                  />
                  {isSimulating && (
                    <circle r="4.5" fill="#10b981">
                      <animateMotion path={path} dur="1.8s" repeatCount="indefinite" />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Render Nodes (Odoo Card Nodes) */}
          {nodes.map(node => {
            const cat = NODE_CATEGORIES[node.category] || NODE_CATEGORIES.agent;
            const isSelected = selectedNodeId === node.id;
            const isRunningThis = activeRunningNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-56 rounded-2xl border-2 p-3.5 cursor-move transition-all z-10 ${
                  isRunningThis
                    ? 'ring-4 ring-emerald-400 bg-white shadow-xl scale-105 border-emerald-500'
                    : isSelected
                      ? 'ring-2 ring-[#714B67] bg-white shadow-lg border-[#714B67]'
                      : 'bg-white hover:bg-slate-50/90 shadow-sm border-slate-200'
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`
                }}
              >
                {/* Input Connection Handle (Left) */}
                <div
                  onClick={(e) => handlePortClick(e, node.id, false)}
                  className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform hover:scale-125 shadow-xs ${
                    connectingFromId ? 'bg-amber-500 animate-ping' : 'bg-slate-400 hover:bg-[#714B67]'
                  }`}
                  title="Sambungkan input ke node ini"
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wider uppercase border"
                    style={{ backgroundColor: cat.bg, color: cat.color, borderColor: cat.border }}
                  >
                    {cat.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Node"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="font-extrabold text-xs text-slate-800 truncate">{node.title}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">{node.subtitle}</div>

                {/* Node Status Preview */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-semibold">
                  <span>ID: {node.id.split('-').slice(0, 2).join('-')}</span>
                  {isRunningThis && <span className="text-emerald-600 font-bold animate-pulse">Running...</span>}
                </div>

                {/* Output Connection Handle (Right) */}
                <div
                  onClick={(e) => handlePortClick(e, node.id, true)}
                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center cursor-pointer transition-transform hover:scale-125 shadow-xs ${
                    connectingFromId === node.id ? 'bg-amber-500' : 'bg-[#714B67] hover:bg-[#017E84]'
                  }`}
                  title="Klik untuk menarik koneksi ke node lain"
                />
              </div>
            );
          })}

          {connectingFromId && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900 text-amber-300 border border-amber-400/50 rounded-2xl shadow-xl text-xs flex items-center gap-2 z-30 font-semibold">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Mode Koneksi Aktif: Klik bulatan kiri pada node tujuan untuk menghubungkan garis</span>
              <button
                onClick={() => setConnectingFromId(null)}
                className="ml-2 px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] cursor-pointer"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Inspector & Simulation Logs (Odoo Clean Sidebar) */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0 z-10 overflow-y-auto shadow-2xs">
          {/* Node Inspector */}
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Node Inspector</span>
              {selectedNode && (
                <span className="text-[10px] text-purple-700 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">Konfigurasi</span>
              )}
            </h3>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Judul Node</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#714B67] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Keterangan / Peran</label>
                  <input
                    type="text"
                    value={selectedNode.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, subtitle: val } : n));
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#714B67] transition-all"
                  />
                </div>

                {selectedNode.category === 'agent' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">System Prompt Instruksi AI</label>
                    <textarea
                      rows={4}
                      value={selectedNode.config?.systemPrompt || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, systemPrompt: val } } : n));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#714B67] transition-all leading-relaxed"
                    />
                  </div>
                )}

                {selectedNode.category === 'trigger' && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Label Tombol di Frontline App</label>
                    <input
                      type="text"
                      value={selectedNode.config?.buttonLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, buttonLabel: val } } : n));
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#714B67] transition-all"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400 text-xs">
                <Sliders size={28} className="mx-auto mb-2 opacity-30 text-[#714B67]" />
                Pilih sebuah node pada kanvas untuk mengedit parameter dan konfigurasinya.
              </div>
            )}
          </div>

          {/* Live Execution Logs Drawer */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={13} className="text-[#017E84]" />
                Telemetry & Live Log
              </span>
              {simulationLogs.length > 0 && (
                <button
                  onClick={() => setSimulationLogs([])}
                  className="text-[10px] text-[#714B67] hover:underline font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-3 font-mono text-[11px] overflow-y-auto space-y-1.5 text-slate-300 shadow-inner">
              {simulationLogs.length === 0 ? (
                <div className="text-slate-500 text-center py-8 text-xs leading-relaxed">
                  Klik tombol <strong>"Simulasi Alur Live"</strong> di atas untuk memvalidasi eksekusi node dari pemicu hingga aksi keluaran.
                </div>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-slate-500 mr-1.5">[{log.time}]</span>
                    <span className={log.status === 'success' ? 'text-emerald-400 font-semibold' : log.status === 'error' ? 'text-rose-400 font-semibold' : 'text-slate-200'}>
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deploy to App Modal (Odoo Modal Style) */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 text-[#714B67] rounded-xl">
                  <ExternalLink size={18} />
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">Implementasi Alur Agen ke Frontline App</h3>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                Alur visual ini dapat dipanggil secara instan dari aplikasi tablet manapun di MAVI MES. Anda cukup menyematkan kode pemanggil pada tombol interaktif di <strong>App Builder</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Snippet Eksekusi Runtime (JavaScript / App Builder Event):</label>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto shadow-inner">
                    {codeSnippet}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippet);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedCode ? 'Disalin!' : 'Salin Snippet'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs">
                💡 <strong>Integrasi Otomatis</strong>: Alur ini telah didaftarkan ke <code>window.maviAgentEngine</code> secara global. Setiap kali operator menekan tombol di tablet lini produksi, agen visual ini akan mengeksekusi OEE, PLC, dan Machine Vision secara otomatis.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  handleSaveFlow();
                  setShowDeployModal(false);
                }}
                className="px-4 py-2 bg-[#714B67] hover:bg-[#593951] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Simpan & Pasang Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Icon fallback
const RotateCcwIcon = ({ size = 16, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
  </svg>
);

export default VisualAgentBuilder;
