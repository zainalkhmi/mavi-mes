/**
 * VisualAgentBuilder.jsx - MAVI MES Visual Agent Flow Builder
 * Interactive drag-and-drop node canvas for assembling autonomous shopfloor AI agents
 * and deploying them directly into frontline manufacturing apps.
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

// Pre-defined Node Templates
const NODE_CATEGORIES = {
  trigger: { name: 'Pemicu (Triggers)', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: '#059669' },
  agent: { name: 'Otak AI (Agent Core)', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', border: '#2563eb' },
  tool: { name: 'Alat Shopfloor (Tools)', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: '#d97706' },
  output: { name: 'Aksi Keluar (Outputs)', color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', border: '#7c3aed' }
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
    y: 80,
    config: {
      tool: 'calculate_oee',
      defaultLine: 'Line-ST-01',
      benchmark: 85.0
    }
  },
  {
    id: 'node-tool-2',
    category: 'tool',
    type: 'get_work_orders',
    title: 'Tool: Validasi Work Order',
    subtitle: 'Ambil data WO aktif di stasiun',
    x: 720,
    y: 260,
    config: {
      tool: 'get_work_orders',
      status: 'IN_PROGRESS'
    }
  },
  {
    id: 'node-output-1',
    category: 'output',
    type: 'app_screen',
    title: 'Update Layar App Tablet',
    subtitle: 'Tampilkan hasil analitis ke operator',
    x: 1060,
    y: 160,
    config: {
      targetField: 'oee_summary_widget',
      showToast: true,
      autoAdvanceStep: false
    }
  }
];

const DEFAULT_EDGES = [
  { id: 'edge-1', from: 'node-trigger-1', to: 'node-agent-1' },
  { id: 'edge-2', from: 'node-agent-1', to: 'node-tool-1' },
  { id: 'edge-3', from: 'node-agent-1', to: 'node-tool-2' },
  { id: 'edge-4', from: 'node-tool-1', to: 'node-output-1' },
  { id: 'edge-5', from: 'node-tool-2', to: 'node-output-1' }
];

export const VisualAgentBuilder = ({ onNavigateToAiSettings }) => {
  const [nodes, setNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('mavi_visual_agent_nodes');
      return saved ? JSON.parse(saved) : DEFAULT_FLOW_NODES;
    } catch {
      return DEFAULT_FLOW_NODES;
    }
  });

  const [edges, setEdges] = useState(() => {
    try {
      const saved = localStorage.getItem('mavi_visual_agent_edges');
      return saved ? JSON.parse(saved) : DEFAULT_EDGES;
    } catch {
      return DEFAULT_EDGES;
    }
  });

  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [centralAi, setCentralAi] = useState(null);
  const [activeRunningNodeId, setActiveRunningNodeId] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationLogs, setSimulationLogs] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [connectingFromId, setConnectingFromId] = useState(null);

  // Dragging state
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  useEffect(() => {
    getPrimaryAiConnector().then(setCentralAi).catch(() => {});
  }, []);

  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  // Persist flow
  const handleSaveFlow = () => {
    localStorage.setItem('mavi_visual_agent_nodes', JSON.stringify(nodes));
    localStorage.setItem('mavi_visual_agent_edges', JSON.stringify(edges));

    // Register active agent flow configuration
    const agentNode = nodes.find(n => n.category === 'agent');
    const toolNodes = nodes.filter(n => n.category === 'tool');

    if (agentNode) {
      const capabilities = toolNodes.map(t => t.config?.tool || t.type).filter(Boolean);
      agentManager.updateAgent(agentNode.config?.agentType || 'data_analyst', {
        name: `Visual Flow: ${agentNode.title}`,
        capabilities,
        systemPrompt: agentNode.config?.systemPrompt || agentNode.subtitle
      });
    }

    alert('✅ Alur Agen Visual berhasil disimpan dan disinkronkan ke MAVI MES Runtime!');
  };

  const handleResetFlow = () => {
    if (window.confirm('Muat ulang alur template visual bawaan pabrik?')) {
      setNodes(DEFAULT_FLOW_NODES);
      setEdges(DEFAULT_EDGES);
      setSelectedNodeId(null);
    }
  };

  // Add new node to canvas
  const handleAddNode = (category, type, title, subtitle, extraConfig = {}) => {
    const id = `node-${Date.now().toString(36)}`;
    const newNode = {
      id,
      category,
      type,
      title,
      subtitle,
      x: 350 + Math.floor(Math.random() * 80),
      y: 180 + Math.floor(Math.random() * 80),
      config: { ...extraConfig }
    };
    setNodes(prev => [...prev, newNode]);
    setSelectedNodeId(id);
  };

  const handleDeleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setEdges(prev => prev.filter(e => e.from !== nodeId && e.to !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  // Dragging logic
  const handleMouseDownNode = (e, nodeId) => {
    e.stopPropagation();
    const node = nodes.find(n => n.id === nodeId);
    if (!node || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    setDraggedNodeId(nodeId);
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
    setSelectedNodeId(nodeId);
  };

  const handleMouseMoveCanvas = (e) => {
    if (!draggedNodeId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(1800, e.clientX - rect.left - dragOffset.x));
    const newY = Math.max(20, Math.min(1200, e.clientY - rect.top - dragOffset.y));

    setNodes(prev => prev.map(n => n.id === draggedNodeId ? { ...n, x: newX, y: newY } : n));
  };

  const handleMouseUpCanvas = () => {
    setDraggedNodeId(null);
  };

  // Handle port connection
  const handlePortClick = (e, nodeId, isOutput) => {
    e.stopPropagation();
    if (isOutput) {
      setConnectingFromId(nodeId);
    } else if (connectingFromId && connectingFromId !== nodeId) {
      // Create edge
      const edgeId = `edge-${connectingFromId}-${nodeId}`;
      if (!edges.some(edge => edge.from === connectingFromId && edge.to === nodeId)) {
        setEdges(prev => [...prev, { id: edgeId, from: connectingFromId, to: nodeId }]);
      }
      setConnectingFromId(null);
    }
  };

  // Execute Live Flow Simulation
  const handleRunLiveFlow = async () => {
    setIsSimulating(true);
    setSimulationLogs([]);

    const logStep = (msg, status = 'info') => {
      setSimulationLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), msg, status }]);
    };

    try {
      logStep('🚀 Memulai eksekusi alur agen visual...', 'info');

      // 1. Trigger
      const triggerNode = nodes.find(n => n.category === 'trigger') || nodes[0];
      if (triggerNode) {
        setActiveRunningNodeId(triggerNode.id);
        logStep(`[Pemicu]: ${triggerNode.title} dipicu dari ${triggerNode.config?.screenId || 'Shopfloor App'}`, 'success');
        await new Promise(r => setTimeout(r, 600));
      }

      // 2. Agent Core
      const agentNode = nodes.find(n => n.category === 'agent');
      if (agentNode) {
        setActiveRunningNodeId(agentNode.id);
        logStep(`[Otak AI]: Mengaktifkan ${agentNode.title} menggunakan engine ${centralAi?.aiSettings?.provider || 'Gemini'}...`, 'info');
        await new Promise(r => setTimeout(r, 800));
      }

      // 3. Tools
      const toolNodes = nodes.filter(n => n.category === 'tool');
      const toolOutputs = [];
      for (const tNode of toolNodes) {
        setActiveRunningNodeId(tNode.id);
        logStep(`[Tool]: Menjalankan integrasi shopfloor: ${tNode.title}...`, 'info');
        await new Promise(r => setTimeout(r, 700));

        if (tNode.type === 'calculate_oee') {
          toolOutputs.push({ tool: 'calculate_oee', oee: '80.32%', availability: '92.00%', performance: '88.00%', quality: '99.21%', status: 'GOOD' });
          logStep(`✅ Hasil OEE: 80.32% (World Class Target: 85%)`, 'success');
        } else if (tNode.type === 'get_work_orders') {
          toolOutputs.push({ tool: 'get_work_orders', activeOrders: 3, topPart: 'FLANGE-ALU-50' });
          logStep(`✅ Work Orders: 3 order aktif termonitor di station`, 'success');
        } else if (tNode.type === 'read_plc') {
          toolOutputs.push({ tool: 'read_plc', tag: 'MTR_TEMP_01', val: '72.4°C' });
          logStep(`✅ Telemetri PLC: Suhu Motor 72.4°C (Normal)`, 'success');
        } else if (tNode.type === 'run_vision_pipeline') {
          toolOutputs.push({ tool: 'run_vision_pipeline', status: 'PASS', score: '99.1%' });
          logStep(`✅ Vision YOLO: Inspeksi PASS (Toleransi OK)`, 'success');
        }
      }

      // 4. Output Node
      const outputNode = nodes.find(n => n.category === 'output');
      if (outputNode) {
        setActiveRunningNodeId(outputNode.id);
        logStep(`[Output]: Mengirim ringkasan laporan operasional ke ${outputNode.title}...`, 'success');
        await new Promise(r => setTimeout(r, 600));
      }

      setActiveRunningNodeId(null);
      logStep('🎉 Alur Visual Agen Selesai 100% dengan Sukses!', 'success');
    } catch (err) {
      logStep(`❌ Error: ${err.message}`, 'error');
      setActiveRunningNodeId(null);
    } finally {
      setIsSimulating(false);
    }
  };

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
    <div className="flex-1 flex flex-col bg-gray-950 text-gray-100 overflow-hidden relative select-none">
      {/* Top Action Bar */}
      <div className="h-14 px-4 bg-gray-900/90 border-b border-gray-800 flex items-center justify-between flex-shrink-0 z-20 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-600/20 text-purple-400 rounded-lg border border-purple-500/30">
            <Sparkles size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-gray-200">Visual Agent Flow Builder</h2>
              <span className="px-2 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 border border-purple-700/60 font-semibold">
                Kanvas Drag & Drop
              </span>
            </div>
            <p className="text-xs text-gray-400">Rakit alur agen otonom & sambungkan langsung ke tombol Frontline App</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Central AI Indicator */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-800/80 rounded-lg border border-gray-700 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Brain: <strong className="text-blue-400">{centralAi?.aiSettings?.provider || 'Gemini'}</strong> ({centralAi?.aiSettings?.modelId || 'gemini-3.6-flash'})</span>
          </div>

          <button
            onClick={handleRunLiveFlow}
            disabled={isSimulating}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 text-white rounded-lg text-xs font-semibold shadow transition-all"
          >
            {isSimulating ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} />}
            Simulasi Alur Live
          </button>

          <button
            onClick={() => setShowDeployModal(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
          >
            <ExternalLink size={14} />
            Pasang ke App Builder
          </button>

          <button
            onClick={handleSaveFlow}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-750 text-gray-200 border border-gray-700 rounded-lg text-xs font-medium"
          >
            <Save size={14} /> Simpan
          </button>

          <button
            onClick={handleResetFlow}
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg text-xs"
            title="Reset ke Default"
          >
            <RotateCcwIcon size={16} />
          </button>
        </div>
      </div>

      {/* Main Builder Area: Left Library + Center Canvas + Right Inspector/Logs */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Palette: Add Node */}
        <div className="w-64 bg-gray-900/90 border-r border-gray-800 flex flex-col flex-shrink-0 z-10 overflow-y-auto">
          <div className="p-3 border-b border-gray-800 text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
            <span>Koleksi Node</span>
            <span className="text-[10px] text-gray-500 font-normal">Klik untuk Tambah</span>
          </div>

          <div className="p-3 space-y-4">
            {/* Category: Triggers */}
            <div>
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Radio size={12} /> 1. Pemicu (Triggers)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('trigger', 'app_button', 'Tombol App Frontline', 'Event klik tombol di tablet operator', { buttonLabel: 'Audit Kualitas Part' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-emerald-950/40 border border-gray-700/60 hover:border-emerald-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><Zap size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Tombol Frontline App</div>
                    <div className="text-[10px] text-gray-500">Event tombol tablet operator</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('trigger', 'plc_alarm', 'Alarm Sensor PLC', 'Nilai register melebihi batas batas aman', { tag: 'MTR_TEMP_01', threshold: 80 })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-emerald-950/40 border border-gray-700/60 hover:border-emerald-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform"><Cpu size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Sensor / PLC Alarm</div>
                    <div className="text-[10px] text-gray-500">Threshold suhu & getaran</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: AI Brain */}
            <div>
              <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Bot size={12} /> 2. Otak Agen AI (Core)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('agent', 'data_analyst', 'Data Analyst Copilot', 'Analisis OEE, shift & yield pabrik', { agentType: 'data_analyst' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-blue-950/40 border border-gray-700/60 hover:border-blue-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><Bot size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Data Analyst Copilot</div>
                    <div className="text-[10px] text-gray-500">Perhitungan OEE & Work Order</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('agent', 'quality_inspector', 'Quality Inspector AI', 'Evaluasi toleransi & defect kamera', { agentType: 'quality_inspector' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-blue-950/40 border border-gray-700/60 hover:border-blue-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-blue-500/20 text-blue-400 group-hover:scale-110 transition-transform"><Eye size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Quality Inspector AI</div>
                    <div className="text-[10px] text-gray-500">Inspeksi visual & cacat part</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: Tools */}
            <div>
              <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sliders size={12} /> 3. Alat Shopfloor (Tools)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('tool', 'calculate_oee', 'Kalkulator OEE', 'Hitung Availability x Perf x Quality', { tool: 'calculate_oee' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-amber-950/40 border border-gray-700/60 hover:border-amber-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform"><Sliders size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Kalkulator OEE</div>
                    <div className="text-[10px] text-gray-500">Formula OEE standar manufaktur</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('tool', 'read_plc', 'Baca Register PLC', 'Baca sensor Modbus / MQTT real-time', { tool: 'read_plc', address: 'MTR_TEMP_01' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-amber-950/40 border border-gray-700/60 hover:border-amber-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform"><Cpu size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Baca Sensor PLC</div>
                    <div className="text-[10px] text-gray-500">Modbus/OPC-UA register</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('tool', 'run_vision_pipeline', 'Inspeksi Kamera YOLO', 'Jalankan model visual edge AI di port 8000', { tool: 'run_vision_pipeline', pipelineId: 'Flange-QC' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-amber-950/40 border border-gray-700/60 hover:border-amber-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform"><Eye size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Kamera YOLO Vision</div>
                    <div className="text-[10px] text-gray-500">Deteksi goresan & cacat part</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Category: Outputs */}
            <div>
              <div className="text-[11px] font-bold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRight size={12} /> 4. Aksi Keluar (Outputs)
              </div>
              <div className="space-y-1.5">
                <button
                  onClick={() => handleAddNode('output', 'app_screen', 'Tampilkan ke Layar Tablet', 'Update widget hasil di layar app operator', { targetField: 'oee_summary' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-purple-950/40 border border-gray-700/60 hover:border-purple-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform"><Layers size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Update Layar Tablet</div>
                    <div className="text-[10px] text-gray-500">Tampilkan laporan ke operator</div>
                  </div>
                </button>

                <button
                  onClick={() => handleAddNode('output', 'trigger_andon', 'Picu Lampu Tower Andon', 'Kirim sinyal visual/audio di stasiun', { stationId: 'ST-01', severity: 'HIGH' })}
                  className="w-full text-left p-2 bg-gray-800/60 hover:bg-purple-950/40 border border-gray-700/60 hover:border-purple-500/50 rounded-lg text-xs transition-all flex items-center gap-2 group"
                >
                  <span className="p-1 rounded bg-purple-500/20 text-purple-400 group-hover:scale-110 transition-transform"><Bell size={13} /></span>
                  <div>
                    <div className="font-semibold text-gray-200">Picu Alarm Andon</div>
                    <div className="text-[10px] text-gray-500">Nyalakan lampu tower stasiun</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Interactive Canvas */}
        <div
          ref={canvasRef}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="flex-1 bg-gray-950 relative overflow-auto cursor-crosshair"
          style={{
            backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px'
          }}
        >
          {/* SVG Connection Lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none min-w-[1800px] min-h-[1200px]" style={{ zIndex: 1 }}>
            <defs>
              <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            {edges.map(edge => {
              const fromNode = nodes.find(n => n.id === edge.from);
              const toNode = nodes.find(n => n.id === edge.to);
              if (!fromNode || !toNode) return null;

              const x1 = fromNode.x + 220;
              const y1 = fromNode.y + 40;
              const x2 = toNode.x;
              const y2 = toNode.y + 40;
              const dx = Math.abs(x2 - x1) * 0.5;
              const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

              const isEdgeActive = activeRunningNodeId === fromNode.id || activeRunningNodeId === toNode.id;

              return (
                <g key={edge.id}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isEdgeActive ? '#10b981' : 'rgba(148, 163, 184, 0.35)'}
                    strokeWidth={isEdgeActive ? '3' : '2'}
                    strokeDasharray={isEdgeActive ? '6,3' : 'none'}
                    className={isEdgeActive ? 'animate-pulse' : ''}
                  />
                  <circle cx={x2} cy={y2} r="4" fill={isEdgeActive ? '#10b981' : '#64748b'} />
                </g>
              );
            })}
          </svg>

          {/* Render Nodes */}
          {nodes.map(node => {
            const cat = NODE_CATEGORIES[node.category] || NODE_CATEGORIES.agent;
            const isSelected = selectedNodeId === node.id;
            const isRunningThis = activeRunningNodeId === node.id;

            return (
              <div
                key={node.id}
                onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                onClick={() => setSelectedNodeId(node.id)}
                className={`absolute w-56 rounded-xl border p-3 cursor-move transition-shadow z-10 ${
                  isRunningThis
                    ? 'ring-4 ring-emerald-400 bg-emerald-950/80 shadow-2xl scale-105'
                    : isSelected
                      ? 'ring-2 ring-blue-500 bg-gray-900 shadow-xl'
                      : 'bg-gray-900/90 hover:bg-gray-850 shadow-md'
                }`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                  borderColor: isRunningThis ? '#10b981' : isSelected ? '#3b82f6' : cat.border
                }}
              >
                {/* Input Connection Handle (Left) */}
                <div
                  onClick={(e) => handlePortClick(e, node.id, false)}
                  className={`absolute -left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
                    connectingFromId ? 'bg-amber-400 animate-ping' : 'bg-gray-400 hover:bg-blue-400'
                  }`}
                  title="Sambungkan input ke node ini"
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase"
                    style={{ backgroundColor: cat.bg, color: cat.color, border: `1px solid ${cat.color}40` }}
                  >
                    {cat.name.split(' ')[0]}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteNode(node.id); }}
                    className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded"
                    title="Hapus Node"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="font-bold text-xs text-gray-200 truncate">{node.title}</div>
                <div className="text-[11px] text-gray-400 truncate mt-0.5">{node.subtitle}</div>

                {/* Node Status Preview */}
                <div className="mt-2.5 pt-2 border-t border-gray-800 flex items-center justify-between text-[10px] text-gray-500">
                  <span>ID: {node.id.split('-').slice(0, 2).join('-')}</span>
                  {isRunningThis && <span className="text-emerald-400 font-bold animate-pulse">Running...</span>}
                </div>

                {/* Output Connection Handle (Right) */}
                <div
                  onClick={(e) => handlePortClick(e, node.id, true)}
                  className={`absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center cursor-pointer transition-transform hover:scale-125 ${
                    connectingFromId === node.id ? 'bg-amber-400' : 'bg-blue-500 hover:bg-emerald-400'
                  }`}
                  title="Klik untuk menarik koneksi ke node lain"
                />
              </div>
            );
          })}

          {connectingFromId && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-amber-900/90 text-amber-200 border border-amber-500/50 rounded-xl shadow-2xl text-xs flex items-center gap-2 z-30">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Mode Koneksi Aktif: Klik bulatan kiri pada node tujuan untuk menghubungkan garis</span>
              <button
                onClick={() => setConnectingFromId(null)}
                className="ml-2 px-2 py-0.5 bg-gray-800 hover:bg-gray-700 rounded text-[11px]"
              >
                Batal
              </button>
            </div>
          )}
        </div>

        {/* Right Sidebar: Inspector & Simulation Logs */}
        <div className="w-80 bg-gray-900/95 border-l border-gray-800 flex flex-col flex-shrink-0 z-10 overflow-y-auto">
          {/* Node Inspector */}
          <div className="p-4 border-b border-gray-800">
            <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Node Inspector</span>
              {selectedNode && (
                <span className="text-[10px] text-gray-400 font-normal">Konfigurasi</span>
              )}
            </h3>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Judul Node</label>
                  <input
                    type="text"
                    value={selectedNode.title}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, title: val } : n));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-400 mb-1">Keterangan / Peran</label>
                  <input
                    type="text"
                    value={selectedNode.subtitle}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, subtitle: val } : n));
                    }}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200"
                  />
                </div>

                {selectedNode.category === 'agent' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">System Prompt Instruksi AI</label>
                    <textarea
                      rows={4}
                      value={selectedNode.config?.systemPrompt || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, systemPrompt: val } } : n));
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-xs text-gray-200 font-sans"
                    />
                  </div>
                )}

                {selectedNode.category === 'trigger' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-400 mb-1">Label Tombol di Frontline App</label>
                    <input
                      type="text"
                      value={selectedNode.config?.buttonLabel || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, config: { ...n.config, buttonLabel: val } } : n));
                      }}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-gray-200"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-xs">
                <Sliders size={28} className="mx-auto mb-2 opacity-30" />
                Pilih sebuah node pada kanvas untuk mengedit parameter dan konfigurasinya.
              </div>
            )}
          </div>

          {/* Live Execution Logs Drawer */}
          <div className="flex-1 p-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={13} className="text-emerald-400" />
                Telemetry & Live Log
              </span>
              {simulationLogs.length > 0 && (
                <button
                  onClick={() => setSimulationLogs([])}
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 bg-gray-950 rounded-xl border border-gray-800 p-2.5 font-mono text-[11px] overflow-y-auto space-y-1.5 text-gray-300">
              {simulationLogs.length === 0 ? (
                <div className="text-gray-600 text-center py-8 text-xs">
                  Klik tombol <strong>"Simulasi Alur Live"</strong> di atas untuk memvalidasi eksekusi node dari pemicu hingga aksi keluaran.
                </div>
              ) : (
                simulationLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    <span className="text-gray-600 mr-1.5">[{log.time}]</span>
                    <span className={log.status === 'success' ? 'text-emerald-400 font-semibold' : log.status === 'error' ? 'text-red-400' : 'text-gray-300'}>
                      {log.msg}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Deploy to App Modal */}
      {showDeployModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <ExternalLink size={20} className="text-blue-400" />
                <h3 className="font-bold text-gray-100 text-base">Implementasi Alur Agen ke Frontline App</h3>
              </div>
              <button
                onClick={() => setShowDeployModal(false)}
                className="p-1 text-gray-400 hover:text-gray-200 rounded"
              >
                <X size={18} />
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-gray-300 leading-relaxed">
              <p>
                Alur visual ini dapat dipanggil secara instan dari aplikasi tablet manapun di MAVI MES. Anda cukup menyematkan kode pemanggil pada tombol interaktif di <strong>App Builder</strong>.
              </p>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">Snippet Eksekusi Runtime (JavaScript / App Builder Event):</label>
                <div className="relative">
                  <pre className="p-3 bg-gray-950 border border-gray-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto">
                    {codeSnippet}
                  </pre>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(codeSnippet);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="absolute top-2 right-2 px-2.5 py-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded text-[10px] text-gray-200 flex items-center gap-1 font-sans"
                  >
                    {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    {copiedCode ? 'Disalin!' : 'Salin Snippet'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800/60 rounded-xl text-blue-200 text-xs">
                💡 <strong>Integrasi Otomatis</strong>: Alur ini telah didaftarkan ke <code>window.maviAgentEngine</code> secara global. Setiap kali operator menekan tombol di tablet lini produksi, agen visual ini akan mengeksekusi OEE, PLC, dan Machine Vision secara otomatis.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-800">
              <button
                onClick={() => setShowDeployModal(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-semibold text-gray-200"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  handleSaveFlow();
                  setShowDeployModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white shadow"
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
