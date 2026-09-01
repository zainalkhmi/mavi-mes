/**
 * WorkflowEditor.jsx
 * =========================================================================
 * Native MES Workflow Engine & n8n v1+ Visual Studio (Opsi A - Standalone)
 *
 * 100% Native In-App Execution Engine (Zero External Server Dependency):
 * - Step-by-Step Native Execution Engine with Live Node Glow & Checkmarks
 * - Left Node Palette Sidebar with Drag-and-Drop & Categorized Tool Library
 * - D-Shaped Pill Trigger Nodes with Red Lightning Bolt Badge
 * - AI Agent Cards with Bottom Attachment Ports & Dashed Sub-nodes
 * - Circular Sub-Nodes (AI Models, Memory, Tools with Diamond Top Handles)
 * - Multi-Output Decision Nodes (Roadsign Icon with 'true' / 'false' Handles)
 * - Action Cards with Official Logos (Slack, Telegram, Sheets, etc.) & Quick Chain '[+]'
 * - Right Slide-Over Node Properties Inspector with Parameters, Data & Settings
 * - Bottom Live Native Execution Log Console Drawer
 * - Midnight Slate Canvas (#111116) with Dot Grid & Interactive Tools
 * =========================================================================
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  MarkerType,
  addEdge,
  ConnectionLineType
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Zap, Play, Save, Pause, Square, RotateCcw, Search, Plus, Minus,
  Clock, Database, AlertCircle, Link2, Mail, ExternalLink, Copy,
  Trash2, Settings2, Send, Bot, Cpu, Code, Filter, Hash, Activity, ActivitySquare,
  MessageSquare, FileSpreadsheet, Server, Globe, Webhook,
  ChevronDown, ChevronRight, GripVertical, MoreHorizontal,
  PanelLeftClose, PanelRightClose, Maximize2, Minimize2,
  Variable, FileJson, FileCode, Timer, Bell, Shield, GitBranch, CheckCircle2,
  X, Check, RefreshCw, Terminal, Sliders, ArrowRight, PlayCircle,
  Eye, Layers, HelpCircle, Sparkles, UserPlus, GitFork, ArrowUpRight,
  SlidersHorizontal, Box, ToggleLeft, ToggleRight, CheckCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { WORKFLOW_TEMPLATES } from './TemplateGallery';

// ─── SVG LOGOS FOR N8N NODES ───
const SlackLogo = () => (
  <svg width="24" height="24" viewBox="0 0 127 127" fill="none">
    <path d="M27.2 79.9a13.6 13.6 0 1 1-13.6-13.6h13.6v13.6zm6.8 0a13.6 13.6 0 0 1 27.2 0v34a13.6 13.6 0 1 1-27.2 0v-34z" fill="#E01E5A"/>
    <path d="M47.6 27.2a13.6 13.6 0 1 1 13.6-13.6v13.6H47.6zm0 6.8a13.6 13.6 0 0 1 0 27.2h-34a13.6 13.6 0 1 1 0-27.2h34z" fill="#36C5F0"/>
    <path d="M99.8 47.6a13.6 13.6 0 1 1 13.6 13.6H99.8V47.6zm-6.8 0a13.6 13.6 0 0 1-27.2 0v-34a13.6 13.6 0 1 1 27.2 0v34z" fill="#2EB67D"/>
    <path d="M79.4 99.8a13.6 13.6 0 1 1-13.6 13.6V99.8h13.6zm0-6.8a13.6 13.6 0 0 1 0-27.2h34a13.6 13.6 0 1 1 0 27.2h-34z" fill="#ECB22E"/>
  </svg>
);

const PostgresElephant = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5v-3.5h2v3.5c0 .83-.67 1.5-1.5 1.5s-.5-.67-.5-1.5zm-4 0v-3.5h2v3.5c0 .83-.67 1.5-1.5 1.5S9 17.33 9 16.5zM12 6c2.21 0 4 1.79 4 4v1H8v-1c0-2.21 1.79-4 4-4z"/>
  </svg>
);

const JiraLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M11.5 2L2 11.5l4.75 4.75L16.25 6.75 11.5 2z" fill="#2684FF"/>
    <path d="M12.5 7L7.75 11.75l4.75 4.75L22 7l-9.5 0z" fill="#0052CC"/>
  </svg>
);

const MicrosoftLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M3 3h8.5v8.5H3V3z" fill="#F25022"/>
    <path d="M12.5 3H21v8.5h-8.5V3z" fill="#7FBA00"/>
    <path d="M3 12.5h8.5V21H3v-8.5z" fill="#00A4EF"/>
    <path d="M12.5 12.5H21V21h-8.5v-8.5z" fill="#FFB900"/>
  </svg>
);

const RoadSignIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v20M8 5h8l3 3-3 3H8V5zM6 14h8l3 3-3 3H6v-6z"/>
  </svg>
);

// =====================================================
// 1. D-SHAPED PILL TRIGGER NODE (n8n Style)
// =====================================================
const N8NDTriggerNode = ({ data, selected }) => {
  const isExecuting = data?._executing;
  const isSuccess = data?._success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          backgroundColor: '#1b1b22',
          borderRadius: '50px 18px 18px 50px',
          border: isExecuting ? '2.5px solid #38bdf8' : isSuccess ? '2.5px solid #22c55e' : selected ? '2px solid #ff6d5a' : '1.5px solid #2e2e38',
          boxShadow: isExecuting ? '0 0 20px rgba(56,189,248,0.6)' : isSuccess ? '0 0 15px rgba(34,197,94,0.4)' : selected ? '0 0 0 3px rgba(255,109,90,0.3)' : '0 6px 18px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Left Red Lightning Bolt Badge */}
        <div
          style={{
            position: 'absolute',
            left: '-12px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: isSuccess ? '#22c55e' : '#ff4d4f',
            border: '2px solid #111116',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,77,79,0.5)'
          }}
        >
          {isSuccess ? <Check size={13} color="#ffffff" /> : <Zap size={13} color="#ffffff" fill="#ffffff" />}
        </div>

        {/* Inner Icon Box */}
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            backgroundColor: '#0d948820',
            border: '1px solid #0d948840',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FileSpreadsheet size={24} color="#2dd4bf" />
        </div>

        {/* Right Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #2e2e38',
            right: '-6px',
            boxShadow: '0 0 6px rgba(0,0,0,0.6)'
          }}
        />
      </div>

      {/* Floating Bottom Label */}
      <div style={{ marginTop: '8px', textAlign: 'center', maxWidth: '140px' }}>
        <div style={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 600, lineHeight: 1.3 }}>
          {data?.label || "On 'Create User' form submission"}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 2. MAIN AI AGENT NODE (n8n Style with Attachment Ports)
// =====================================================
const N8NAgentNode = ({ data, selected }) => {
  const isExecuting = data?._executing;
  const isSuccess = data?._success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          backgroundColor: '#212127',
          border: isExecuting ? '2.5px solid #38bdf8' : isSuccess ? '2.5px solid #22c55e' : selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '14px',
          padding: '14px 22px',
          boxShadow: isExecuting ? '0 0 20px rgba(56,189,248,0.6)' : isSuccess ? '0 0 15px rgba(34,197,94,0.4)' : selected ? '0 0 0 3px rgba(255,109,90,0.3)' : '0 6px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '180px',
          transition: 'all 0.2s ease'
        }}
      >
        {/* Left Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', left: '-6px' }}
        />

        {/* Robot Icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: isSuccess ? '#22c55e20' : '#ffffff10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bot size={22} color={isSuccess ? '#4ade80' : '#ffffff'} />
        </div>

        {/* Titles */}
        <div>
          <div style={{ color: '#ffffff', fontSize: '13px', fontWeight: 800 }}>
            {data?.label || 'AI Agent'}
          </div>
          <div style={{ color: '#a1a1aa', fontSize: '11px', fontWeight: 500 }}>
            {data?.subtitle || 'Tools Agent'}
          </div>
        </div>

        {/* Right Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', right: '-6px' }}
        />

        {/* Bottom Attachment Ports (Chat Model, Memory, Tool) */}
        <Handle id="chat_model" type="target" position={Position.Bottom} style={{ left: '25%', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #8b8b99', borderRadius: '2px', transform: 'rotate(45deg)', bottom: '-6px' }} />
        <Handle id="memory" type="target" position={Position.Bottom} style={{ left: '50%', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #8b8b99', borderRadius: '2px', transform: 'rotate(45deg)', bottom: '-6px' }} />
        <Handle id="tool" type="target" position={Position.Bottom} style={{ left: '75%', width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #8b8b99', borderRadius: '2px', transform: 'rotate(45deg)', bottom: '-6px' }} />
      </div>

      {/* Bottom Sub-port Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '4px 10px 0 10px', fontSize: '10px', color: '#94a3b8' }}>
        <span style={{ color: '#ef4444' }}>Chat Model*</span>
        <span>Memory</span>
        <span>Tool</span>
      </div>
    </div>
  );
};

// =====================================================
// 3. CIRCULAR SUB-NODES (AI Model, Memory, Tools)
// =====================================================
const N8NCircleSubNode = ({ data, selected }) => {
  const nodeType = (data?.subType || 'tool').toLowerCase();
  const isExecuting = data?._executing;
  const isSuccess = data?._success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>
        {data?.portLabel || (nodeType === 'model' ? 'Model' : nodeType === 'memory' ? 'Memory' : 'Tool')}
      </div>

      <div
        style={{
          position: 'relative',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: '#212127',
          border: isExecuting ? '2px solid #38bdf8' : isSuccess ? '2px solid #22c55e' : selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          boxShadow: isExecuting ? '0 0 14px rgba(56,189,248,0.5)' : isSuccess ? '0 0 10px rgba(34,197,94,0.4)' : selected ? '0 0 0 3px rgba(255,109,90,0.3)' : '0 4px 14px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        <Handle type="source" position={Position.Top} style={{ width: '10px', height: '10px', backgroundColor: '#ffffff', border: '2px solid #8b8b99', borderRadius: '2px', transform: 'rotate(45deg)', top: '-5px' }} />

        {nodeType === 'model' && <span style={{ fontSize: '14px', fontWeight: 900, color: '#e4e4e7', letterSpacing: '-1px' }}>AI</span>}
        {nodeType === 'memory' && <PostgresElephant />}
        {nodeType === 'microsoft' && <MicrosoftLogo />}
        {nodeType === 'jira' && <JiraLogo />}
        {nodeType === 'tool' && !['microsoft', 'jira'].includes(nodeType) && <Database size={20} color="#38bdf8" />}
      </div>

      <div style={{ marginTop: '6px', textAlign: 'center', maxWidth: '110px' }}>
        <div style={{ color: '#f4f4f5', fontSize: '11px', fontWeight: 600, lineHeight: 1.2 }}>
          {data?.label || 'Sub Node'}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 4. LOGIC / DECISION NODE ('Is a manager?')
// =====================================================
const N8NDecisionNode = ({ data, selected }) => {
  const isExecuting = data?._executing;
  const isSuccess = data?._success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          backgroundColor: '#212127',
          border: isExecuting ? '2.5px solid #38bdf8' : isSuccess ? '2.5px solid #22c55e' : selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '16px',
          boxShadow: isExecuting ? '0 0 18px rgba(56,189,248,0.5)' : isSuccess ? '0 0 12px rgba(34,197,94,0.4)' : selected ? '0 0 0 3px rgba(255,109,90,0.3)' : '0 6px 18px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', left: '-6px' }} />
        <RoadSignIcon />
        <Handle id="true" type="source" position={Position.Right} style={{ top: '32%', width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', right: '-6px' }} />
        <Handle id="false" type="source" position={Position.Right} style={{ top: '68%', width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', right: '-6px' }} />
      </div>

      <div style={{ marginTop: '8px', textAlign: 'center', maxWidth: '120px' }}>
        <div style={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 600 }}>
          {data?.label || 'Is a manager?'}
        </div>
      </div>
    </div>
  );
};

// =====================================================
// 5. ACTION CARD NODE (Slack, Telegram, Sheets, etc.)
// =====================================================
const N8NActionNode = ({ data, selected }) => {
  const isSlack = (data?.type || '').toLowerCase().includes('slack') || (data?.label || '').toLowerCase().includes('slack') || (data?.app || '') === 'slack';
  const isSheets = (data?.type || '').toLowerCase().includes('sheet') || (data?.app || '') === 'sheets';
  const isTelegram = (data?.type || '').toLowerCase().includes('telegram') || (data?.app || '') === 'telegram';
  const isExecuting = data?._executing;
  const isSuccess = data?._success;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          backgroundColor: '#212127',
          border: isExecuting ? '2.5px solid #38bdf8' : isSuccess ? '2.5px solid #22c55e' : selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '16px',
          boxShadow: isExecuting ? '0 0 18px rgba(56,189,248,0.5)' : isSuccess ? '0 0 12px rgba(34,197,94,0.4)' : selected ? '0 0 0 3px rgba(255,109,90,0.3)' : '0 6px 18px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
      >
        <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', left: '-6px' }} />

        {isSlack ? <SlackLogo /> : isSheets ? <FileSpreadsheet size={26} color="#22c55e" /> : isTelegram ? <Send size={24} color="#38bdf8" /> : <Zap size={24} color="#a855f7" />}

        <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', backgroundColor: '#ffffff', border: '2.5px solid #383844', right: '-6px' }} />

        <div
          style={{
            position: 'absolute',
            right: '-32px',
            width: '20px',
            height: '20px',
            borderRadius: '4px',
            backgroundColor: '#1b1b22',
            border: '1px solid #383844',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 800
          }}
        >
          +
        </div>
      </div>

      <div style={{ marginTop: '8px', textAlign: 'center', maxWidth: '140px' }}>
        <div style={{ color: '#f4f4f5', fontSize: '12px', fontWeight: 700 }}>
          {data?.label || 'Add to channel'}
        </div>
        <div style={{ color: '#71717a', fontSize: '10px', fontWeight: 500 }}>
          {data?.subtitle || 'invite: channel'}
        </div>
      </div>
    </div>
  );
};

// ─── REGISTER CUSTOM NODE TYPES ───
const NODE_TYPES = {
  n8n_trigger: N8NDTriggerNode,
  n8n_agent: N8NAgentNode,
  n8n_subnode: N8NCircleSubNode,
  n8n_decision: N8NDecisionNode,
  n8n_action: N8NActionNode,
  custom: N8NActionNode,
  default: N8NActionNode
};

// =====================================================
// LEFT NODE PALETTE SIDEBAR COMPONENT (MES WIDGETS INTEGRATED)
// =====================================================
const N8NPaletteSidebar = ({ onAddNode, searchQuery, setSearchQuery, onClose }) => {
  const paletteCategories = [
    {
      id: 'mes_machines',
      label: '🏭 MES Machines & SCADA',
      nodes: [
        { type: 'n8n_trigger', mesType: 'machine_telemetry', label: 'Machine Telemetry (OEE/RPM)', subtitle: 'Read live machine metrics', icon: <Cpu size={16} color="#38bdf8" /> },
        { type: 'n8n_trigger', mesType: 'scada_alarm', label: 'SCADA / PLC Alarm Event', subtitle: 'Overheat / Vibration alert', icon: <AlertCircle size={16} color="#ef4444" /> },
        { type: 'n8n_trigger', mesType: 'edge_iot', label: 'Edge Device (Modbus/MQTT)', subtitle: 'IoT Hub sensor stream', icon: <Server size={16} color="#a855f7" /> },
        { type: 'n8n_action', mesType: 'station_status', label: 'Station Status Dispatcher', subtitle: 'Update Running/Idle/Fault', icon: <Activity size={16} color="#22c55e" /> }
      ]
    },
    {
      id: 'mes_qc',
      label: '📋 QC, Metrology & Checksheet',
      nodes: [
        { type: 'n8n_trigger', mesType: 'qc_defect', label: 'Checksheet NG Defect Event', subtitle: 'Trigger on Defect submitted', icon: <FileSpreadsheet size={16} color="#f59e0b" /> },
        { type: 'n8n_trigger', mesType: 'caliper_reading', label: 'Metrology Caliper Input', subtitle: 'Bluetooth / Virtual caliper', icon: <Sliders size={16} color="#06b6d4" /> },
        { type: 'n8n_decision', mesType: 'tolerance_eval', label: 'Is Tolerance OK (Pass/Fail)?', subtitle: 'Nominal ± Tolerance rule', icon: <GitFork size={16} color="#22c55e" /> },
        { type: 'n8n_action', mesType: 'camera_ocr', label: 'Camera OCR & Vision Check', subtitle: 'Serial / Drawing verify', icon: <Eye size={16} color="#ec4899" /> }
      ]
    },
    {
      id: 'mes_orders',
      label: '📦 Work Order & Production',
      nodes: [
        { type: 'n8n_trigger', mesType: 'work_order', label: 'Work Order Status Event', subtitle: 'New Order / Batch Complete', icon: <Layers size={16} color="#6366f1" /> },
        { type: 'n8n_action', mesType: 'yield_counter', label: 'Production Yield Counter', subtitle: 'Calculate OK vs NG parts', icon: <Hash size={16} color="#10b981" /> },
        { type: 'n8n_action', mesType: 'erp_sync', label: 'SAP / ERP Sync Dispatcher', subtitle: 'Sync batch to ERP database', icon: <Database size={16} color="#3b82f6" /> }
      ]
    },
    {
      id: 'mes_shift',
      label: '👥 Shift Handoff & Operators',
      nodes: [
        { type: 'n8n_trigger', mesType: 'shift_handoff', label: 'Shift Handover Note Alert', subtitle: 'Mandor shift notes broadcast', icon: <Clock size={16} color="#f59e0b" /> },
        { type: 'n8n_decision', mesType: 'operator_auth', label: 'Is Operator Authorized?', subtitle: 'Skill matrix check', icon: <UserPlus size={16} color="#8b5cf6" /> }
      ]
    },
    {
      id: 'mes_ai',
      label: '🤖 Native AI & Analytics',
      nodes: [
        { type: 'n8n_agent', mesType: 'ai_agent', label: 'AI Agent (Defect Diagnostic)', subtitle: 'Tools Agent & Copilot', icon: <Bot size={16} color="#a855f7" /> },
        { type: 'n8n_subnode', subType: 'model', label: 'Anthropic Claude 3.5', portLabel: 'Model', subtitle: 'LLM Reasoning', icon: <Sparkles size={16} color="#ffffff" /> },
        { type: 'n8n_subnode', subType: 'memory', label: 'Supabase / Postgres Memory', portLabel: 'Memory', subtitle: 'MES chat sessions', icon: <Database size={16} color="#38bdf8" /> },
        { type: 'n8n_action', mesType: 'bi_logger', label: 'BI Studio Telemetry Logger', subtitle: 'Push KPI to BI dashboard', icon: <ActivitySquare size={16} color="#3b82f6" /> }
      ]
    },
    {
      id: 'mes_dispatchers',
      label: '📱 Messaging & Notifications',
      nodes: [
        { type: 'n8n_action', label: 'Slack QC Channel', subtitle: 'Post to #production-alerts', app: 'slack', icon: <MessageSquare size={16} color="#E01E5A" /> },
        { type: 'n8n_action', label: 'Telegram Bot Alert', subtitle: 'Instant photo & message', app: 'telegram', icon: <Send size={16} color="#38bdf8" /> },
        { type: 'n8n_action', label: 'Google Sheets Log', subtitle: 'Append inspection record', app: 'sheets', icon: <FileSpreadsheet size={16} color="#22c55e" /> }
      ]
    }
  ];

  const filteredCategories = paletteCategories.map(cat => ({
    ...cat,
    nodes: cat.nodes.filter(n =>
      !searchQuery ||
      n.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.subtitle?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.nodes.length > 0);

  return (
    <div
      style={{
        width: '300px',
        height: '100%',
        backgroundColor: '#18181f',
        borderRight: '1px solid #282834',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ff6d5a20', border: '1px solid #ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="#ff6d5a" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>MES Widget Palette</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <PanelLeftClose size={16} />
        </button>
      </div>

      <div style={{ padding: '10px 14px', borderBottom: '1px solid #282834' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input
            type="text"
            placeholder="Cari widget MES (Mesin, QC, Caliper, Slack)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
          />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredCategories.map(cat => (
          <div key={cat.id}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {cat.label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {cat.nodes.map((node, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/reactflow', JSON.stringify(node));
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onClick={() => onAddNode(node)}
                  style={{
                    padding: '8px 10px',
                    backgroundColor: '#111116',
                    border: '1px solid #282834',
                    borderRadius: '8px',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ff6d5a'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#282834'; e.currentTarget.style.transform = 'none'; }}
                >
                  <GripVertical size={12} color="#52525b" />
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#212127', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {node.icon}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {node.label}
                    </div>
                    <div style={{ fontSize: '9px', color: '#71717a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {node.subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =====================================================
// RIGHT NODE PROPERTIES INSPECTOR PANEL (MES WIDGETS INTEGRATED)
// =====================================================
const N8NPropertiesInspector = ({ selectedNode, onUpdateNode, onDeleteNode, onDuplicateNode, onClose }) => {
  const [activeTab, setActiveTab] = useState('parameters');

  if (!selectedNode) return null;

  const mesType = selectedNode.data?.mesType || '';

  return (
    <div
      style={{
        width: '380px',
        height: '100%',
        backgroundColor: '#18181f',
        borderLeft: '1px solid #282834',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        boxShadow: '-6px 0 25px rgba(0,0,0,0.6)'
      }}
    >
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ff6d5a20', border: '1px solid #ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#ff6d5a" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              {selectedNode.data?.label || selectedNode.id}
            </h4>
            <span style={{ fontSize: '10px', color: '#38bdf8' }}>MES Widget: {selectedNode.data?.subtitle || selectedNode.type}</span>
          </div>
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid #282834', backgroundColor: '#111116' }}>
        {['parameters', 'data', 'settings'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: '9px',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'capitalize',
              backgroundColor: activeTab === tab ? '#18181f' : 'transparent',
              color: activeTab === tab ? '#ff6d5a' : '#71717a',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #ff6d5a' : 'none',
              cursor: 'pointer'
            }}
          >
            {tab === 'parameters' ? '⚙️ Parameters' : tab === 'data' ? '📋 Data JSON' : '🛠️ Settings'}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {activeTab === 'parameters' && (
          <>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Widget Display Label
              </label>
              <input
                type="text"
                value={selectedNode.data?.label || ''}
                onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, label: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
              />
            </div>

            {/* MES Machine Telemetry Parameters */}
            {mesType === 'machine_telemetry' && (
              <>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Pilih Target Mesin MES
                  </label>
                  <select
                    value={selectedNode.data?.parameters?.machineId || 'CNC-01'}
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, machineId: e.target.value } })}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="CNC-01">CNC Milling Machine 01 (Station 1)</option>
                    <option value="INJ-02">Injection Molding A (Station 2)</option>
                    <option value="LATHE-03">Lathe Machine 03 (Station 3)</option>
                    <option value="PRESS-04">Hydraulic Press 04 (Station 4)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Metrik yang Dipantau
                  </label>
                  <select
                    value={selectedNode.data?.parameters?.metric || 'OEE'}
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, metric: e.target.value } })}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="OEE">OEE (%)</option>
                    <option value="RPM">Spindle Speed (RPM)</option>
                    <option value="TEMP">Temperature (°C)</option>
                    <option value="VIB">Vibration (mm/s)</option>
                  </select>
                </div>
              </>
            )}

            {/* MES QC Checksheet Defect Parameters */}
            {mesType === 'qc_defect' && (
              <>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Template Checksheet QC
                  </label>
                  <select
                    value={selectedNode.data?.parameters?.checksheet || 'Flange-QC'}
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, checksheet: e.target.value } })}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                  >
                    <option value="Flange-QC">Flange Machining Inspection</option>
                    <option value="Bushing-QC">Bushing Tolerance Check</option>
                    <option value="PCB-Visual">PCB Visual SMT Inspection</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Kategori Defect Pemicu
                  </label>
                  <input
                    type="text"
                    value={selectedNode.data?.parameters?.defectCategory || 'Burr, Crack, Dimension NG'}
                    onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, defectCategory: e.target.value } })}
                    style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                  />
                </div>
              </>
            )}

            {/* Tolerance Evaluator Parameters */}
            {mesType === 'tolerance_eval' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Nominal (mm)</label>
                    <input
                      type="text"
                      value={selectedNode.data?.parameters?.nominal || '45.00'}
                      onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, nominal: e.target.value } })}
                      style={{ width: '100%', padding: '6px 8px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Upper (+)</label>
                    <input
                      type="text"
                      value={selectedNode.data?.parameters?.upper || '+0.05'}
                      onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, upper: e.target.value } })}
                      style={{ width: '100%', padding: '6px 8px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '11px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#94a3b8' }}>Lower (-)</label>
                    <input
                      type="text"
                      value={selectedNode.data?.parameters?.lower || '-0.05'}
                      onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, lower: e.target.value } })}
                      style={{ width: '100%', padding: '6px 8px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '11px' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Slack / Telegram Channel */}
            {selectedNode.data?.app === 'slack' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Slack Channel
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.parameters?.channel || '#production-alerts'}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, channel: e.target.value } })}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                />
              </div>
            )}

            {selectedNode.data?.app === 'telegram' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Telegram Group / Chat ID
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.parameters?.chatId || '@mandor_qc_group'}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, chatId: e.target.value } })}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px' }}
                />
              </div>
            )}

            {/* AI Agent System Prompt */}
            {selectedNode.type === 'n8n_agent' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  AI Agent System Prompt (MES Copilot)
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.data?.parameters?.prompt || 'Analisis kemungkinan penyebab defect dimensi NG pada mesin CNC-01 dan sarankan tindakan perbaikan.'}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, prompt: e.target.value } })}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '11px', resize: 'vertical' }}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'data' && (
          <div style={{ backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', padding: '10px' }}>
            <pre style={{ margin: 0, fontSize: '11px', color: '#34d399', fontFamily: 'monospace' }}>
              {JSON.stringify(selectedNode.data?.parameters || { mesSource: 'Mandor-Core', status: 'ACTIVE', part: 'PRT-FLG-450' }, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Continue On Fail
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Save Execution Logs to Supabase
            </label>
          </div>
        )}
      </div>

      <div style={{ padding: '14px', borderTop: '1px solid #282834', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          onClick={() => toast.success(`Node "${selectedNode.data?.label}" berhasil diuji!`, { icon: '⚡' })}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#ff6d5a',
            border: 'none',
            borderRadius: '6px',
            color: '#ffffff',
            fontWeight: 900,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 2px 10px rgba(255,109,90,0.4)'
          }}
        >
          <Play size={14} /> ⚡ Test Widget Step
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onDuplicateNode(selectedNode.id)}
            style={{ flex: 1, padding: '7px', backgroundColor: '#212127', border: '1px solid #383844', borderRadius: '6px', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Copy size={12} /> Duplicate
          </button>
          <button
            onClick={() => onDeleteNode(selectedNode.id)}
            style={{ flex: 1, padding: '7px', backgroundColor: '#7f1d1d20', border: '1px solid #7f1d1d', borderRadius: '6px', color: '#fca5a5', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================================
// MAIN WORKFLOW EDITOR COMPONENT (OPSI A: NATIVE ENGINE)
// =====================================================
export const WorkflowEditorContent = () => {
  const initialNodes = useMemo(() => [
    {
      id: 'node-trigger',
      type: 'n8n_trigger',
      position: { x: 40, y: 150 },
      data: {
        label: "On 'Create User' form submission",
        type: 'webhook',
        parameters: { method: 'POST', form: 'Create User' }
      }
    },
    {
      id: 'node-agent',
      type: 'n8n_agent',
      position: { x: 260, y: 150 },
      data: {
        label: 'AI Agent',
        subtitle: 'Tools Agent',
        type: 'ai_agent',
        parameters: { prompt: 'Process user onboarding and determine department privileges.' }
      }
    },
    {
      id: 'sub-anthropic',
      type: 'n8n_subnode',
      position: { x: 200, y: 350 },
      data: {
        subType: 'model',
        portLabel: 'Model',
        label: 'Anthropic Chat Model',
        parameters: { model: 'claude-3-5-sonnet' }
      }
    },
    {
      id: 'sub-postgres',
      type: 'n8n_subnode',
      position: { x: 320, y: 350 },
      data: {
        subType: 'memory',
        portLabel: 'Memory',
        label: 'Postgres Chat Memory',
        parameters: { table: 'chat_sessions' }
      }
    },
    {
      id: 'sub-entra',
      type: 'n8n_subnode',
      position: { x: 480, y: 350 },
      data: {
        subType: 'microsoft',
        portLabel: 'Tool',
        label: 'Microsoft Entra ID',
        parameters: { action: 'getUser' }
      }
    },
    {
      id: 'sub-jira',
      type: 'n8n_subnode',
      position: { x: 600, y: 350 },
      data: {
        subType: 'jira',
        portLabel: 'Tool',
        label: 'Jira Software',
        parameters: { project: 'PROD' }
      }
    },
    {
      id: 'node-decision',
      type: 'n8n_decision',
      position: { x: 550, y: 155 },
      data: {
        label: 'Is a manager?',
        type: 'decision',
        parameters: { field: '{{ $json.role }}', value: 'Manager' }
      }
    },
    {
      id: 'node-slack-channel',
      type: 'n8n_action',
      position: { x: 740, y: 20 },
      data: {
        label: 'Add to channel',
        subtitle: 'invite: channel',
        app: 'slack',
        parameters: { channel: '#management' }
      }
    },
    {
      id: 'node-slack-profile',
      type: 'n8n_action',
      position: { x: 740, y: 260 },
      data: {
        label: 'Update profile',
        subtitle: 'updateProfile: user',
        app: 'slack',
        parameters: { field: 'title' }
      }
    }
  ], []);

  const initialEdges = useMemo(() => [
    { id: 'e-trigger-agent', source: 'node-trigger', target: 'node-agent', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 2 } },
    { id: 'e-anthropic-agent', source: 'sub-anthropic', target: 'node-agent', targetHandle: 'chat_model', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' } },
    { id: 'e-postgres-agent', source: 'sub-postgres', target: 'node-agent', targetHandle: 'memory', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' } },
    { id: 'e-entra-agent', source: 'sub-entra', target: 'node-agent', targetHandle: 'tool', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' } },
    { id: 'e-jira-agent', source: 'sub-jira', target: 'node-agent', targetHandle: 'tool', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' } },
    { id: 'e-agent-decision', source: 'node-agent', target: 'node-decision', type: 'smoothstep', style: { stroke: '#8b8b99', strokeWidth: 2 } },
    { id: 'e-decision-slack-true', source: 'node-decision', sourceHandle: 'true', target: 'node-slack-channel', type: 'smoothstep', label: 'true', labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 }, labelBgStyle: { fill: '#111116', fillOpacity: 0.8 }, style: { stroke: '#8b8b99', strokeWidth: 2 } },
    { id: 'e-decision-slack-false', source: 'node-decision', sourceHandle: 'false', target: 'node-slack-profile', type: 'smoothstep', label: 'false', labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 }, labelBgStyle: { fill: '#111116', fillOpacity: 0.8 }, style: { stroke: '#8b8b99', strokeWidth: 2 } }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('AI Onboarding & Role Dispatcher');
  const [selectedNodeId, setSelectedNodeId] = useState('node-agent');
  const [showPalette, setShowPalette] = useState(true);
  const [showProperties, setShowProperties] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionLogs, setExecutionLogs] = useState([
    { id: '1', timestamp: new Date().toLocaleTimeString(), node: 'On Create User', status: 'SUCCESS', details: 'Form received from MES Shopfloor' },
    { id: '2', timestamp: new Date().toLocaleTimeString(), node: 'AI Agent', status: 'SUCCESS', details: 'Claude 3.5 processed role prompt' },
    { id: '3', timestamp: new Date().toLocaleTimeString(), node: 'Slack Action', status: 'SUCCESS', details: 'Notification posted to #management' }
  ]);
  const reactFlow = useReactFlow();

  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId]);

  // Connect handler
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 2 }
    }, eds));
  }, [setEdges]);

  // Add node from Palette
  const handleAddNode = useCallback((nodeConfig) => {
    const position = reactFlow.getViewport();
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeConfig.type || 'n8n_action',
      position: { x: -position.x + 350, y: -position.y + 200 },
      data: {
        label: nodeConfig.label,
        subtitle: nodeConfig.subtitle,
        subType: nodeConfig.subType,
        portLabel: nodeConfig.portLabel,
        app: nodeConfig.app,
        parameters: {}
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
    toast.success(`Node "${nodeConfig.label}" ditambahkan!`, { icon: '✨' });
  }, [reactFlow, setNodes]);

  // Drag & drop
  const onDrop = useCallback((event) => {
    event.preventDefault();
    const dataStr = event.dataTransfer.getData('application/reactflow');
    if (!dataStr) return;
    const parsed = JSON.parse(dataStr);
    const position = reactFlow.project({ x: event.clientX, y: event.clientY });

    const newNode = {
      id: `node-${Date.now()}`,
      type: parsed.type || 'n8n_action',
      position,
      data: {
        label: parsed.label,
        subtitle: parsed.subtitle,
        subType: parsed.subType,
        portLabel: parsed.portLabel,
        app: parsed.app,
        parameters: {}
      }
    };
    setNodes((nds) => nds.concat(newNode));
    setSelectedNodeId(newNode.id);
  }, [reactFlow, setNodes]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Update node
  const handleUpdateNode = useCallback((nodeId, newData) => {
    setNodes((nds) => nds.map(n => n.id === nodeId ? { ...n, data: newData } : n));
  }, [setNodes]);

  // Delete node
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(n => n.id !== nodeId));
    setEdges((eds) => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
    setSelectedNodeId(null);
    toast.success('Node berhasil dihapus');
  }, [setNodes, setEdges]);

  // Duplicate node
  const handleDuplicateNode = useCallback((nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const duplicated = {
      ...node,
      id: `node-${Date.now()}`,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
      data: { ...node.data, label: `${node.data?.label} (Copy)` }
    };
    setNodes((nds) => nds.concat(duplicated));
    setSelectedNodeId(duplicated.id);
    toast.success('Node diduplikasi');
  }, [nodes, setNodes]);

  // =====================================================
  // OPSI A: NATIVE STEP-BY-STEP MES WORKFLOW EXECUTION ENGINE
  // =====================================================
  const handleRunNativeEngine = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setShowConsole(true);
    toast.loading('Menjalankan Native MES Workflow Engine...', { id: 'native_engine_run' });

    // Clear previous visual indicators
    setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, _executing: false, _success: false } })));

    const executionSteps = [
      { id: 'node-trigger', name: 'Trigger (Form Submission)', delay: 400, log: 'Event form create_user diterima dari MES Shopfloor.' },
      { id: 'sub-anthropic', name: 'Anthropic AI Model', delay: 300, log: 'Memuat model Claude 3.5 Sonnet.' },
      { id: 'sub-postgres', name: 'Postgres Memory', delay: 300, log: 'Sinkronisasi riwayat sesi operator.' },
      { id: 'node-agent', name: 'AI Agent Reasoning', delay: 600, log: 'AI Agent mengevaluasi wewenang & hak akses.' },
      { id: 'node-decision', name: 'Decision (Is a manager?)', delay: 400, log: 'Evaluasi rule: role === "Manager" -> TRUE branch terpilih.' },
      { id: 'node-slack-channel', name: 'Slack Action Dispatcher', delay: 500, log: 'Notifikasi berhasil dikirimkan ke channel #management.' }
    ];

    for (const step of executionSteps) {
      // Set executing highlight
      setNodes(nds => nds.map(n => n.id === step.id ? { ...n, data: { ...n.data, _executing: true } } : n));
      await new Promise(r => setTimeout(r, step.delay));

      // Set success highlight
      setNodes(nds => nds.map(n => n.id === step.id ? { ...n, data: { ...n.data, _executing: false, _success: true } } : n));

      // Append log
      const logEntry = {
        id: String(Date.now() + Math.random()),
        timestamp: new Date().toLocaleTimeString(),
        node: step.name,
        status: 'SUCCESS',
        details: step.log
      };
      setExecutionLogs(prev => [logEntry, ...prev]);
    }

    setIsRunning(false);
    toast.success('Native Workflow Selesai & Berhasil 100%!', { id: 'native_engine_run', icon: '🚀' });
  };

  const [showClearModal, setShowClearModal] = useState(false);

  // Keyboard shortcut listener: Delete or Backspace key to delete selected node
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId) {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        handleDeleteNode(selectedNodeId);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, handleDeleteNode]);

  // Clear Entire Workflow
  const handleClearWorkflow = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNodeId(null);
    setWorkflowName('New Workflow');
    setShowClearModal(false);
    toast.success('Seluruh alur kerja berhasil dihapus & kanvas telah dikosongkan!', { icon: '🗑️' });
  };

  // Reset to Default Demo Flow
  const handleResetToDemo = () => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedNodeId('node-agent');
    setWorkflowName('AI Onboarding & Role Dispatcher');
    setShowClearModal(false);
    toast.success('Kanvas direset ke template default!', { icon: '✨' });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#111116',
        color: '#ffffff',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden'
      }}
    >
      <Toaster position="top-right" />

      {/* ─── TOP HEADER TOOLBAR ────────────────────────────────────── */}
      <div
        style={{
          height: '52px',
          backgroundColor: '#18181f',
          borderBottom: '1px solid #282834',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              backgroundColor: '#ff6d5a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(255,109,90,0.4)'
            }}
          >
            <Zap size={16} color="#ffffff" />
          </div>

          <div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                outline: 'none',
                width: '260px'
              }}
            />
            <div style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCheck size={12} /> Native MES Engine Active
            </div>
          </div>
        </div>

        {/* Panel Toggles & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setShowPalette(!showPalette)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: showPalette ? '#ff6d5a20' : '#272733',
              border: `1px solid ${showPalette ? '#ff6d5a' : '#383848'}`,
              color: showPalette ? '#ff6d5a' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Box size={13} /> {showPalette ? 'Hide Palette' : 'Show Palette'}
          </button>

          <button
            onClick={() => setShowProperties(!showProperties)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: showProperties ? '#ff6d5a20' : '#272733',
              border: `1px solid ${showProperties ? '#ff6d5a' : '#383848'}`,
              color: showProperties ? '#ff6d5a' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <SlidersHorizontal size={13} /> {showProperties ? 'Hide Properties' : 'Show Properties'}
          </button>

          <button
            onClick={() => setShowConsole(!showConsole)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: showConsole ? '#22c55e20' : '#272733',
              border: `1px solid ${showConsole ? '#22c55e' : '#383848'}`,
              color: showConsole ? '#4ade80' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Terminal size={13} /> Console
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#272733',
              border: '1px solid #383848',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Sparkles size={13} /> Presets
          </button>

          {/* Hapus Seluruh Workflow Button */}
          <button
            onClick={() => setShowClearModal(true)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              backgroundColor: '#7f1d1d20',
              border: '1px solid #7f1d1d',
              color: '#fca5a5',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Hapus alur kerja ini dan bersihkan kanvas"
          >
            <Trash2 size={13} /> Hapus Workflow
          </button>

          <button
            onClick={() => toast.success(`Workflow "${workflowName}" tersimpan di MES!`, { icon: '💾' })}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#272733',
              border: '1px solid #383848',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Save size={13} /> Save
          </button>

          <button
            onClick={handleRunNativeEngine}
            disabled={isRunning}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              backgroundColor: '#ff6d5a',
              border: 'none',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 900,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(255,109,90,0.4)'
            }}
          >
            <Play size={13} /> {isRunning ? 'Running...' : '⚡ Run Workflow'}
          </button>
        </div>
      </div>

      {/* ─── MAIN WORKSPACE (LEFT PALETTE + CENTER CANVAS + RIGHT PROPERTIES) ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        
        {/* LEFT NODE PALETTE SIDEBAR */}
        {showPalette && (
          <N8NPaletteSidebar
            onAddNode={handleAddNode}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onClose={() => setShowPalette(false)}
          />
        )}

        {/* CENTER REACTFLOW CANVAS */}
        <div style={{ flex: 1, height: '100%', position: 'relative', backgroundColor: '#111116' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={(_, node) => {
              setSelectedNodeId(node.id);
              setShowProperties(true);
            }}
            onPaneClick={() => setSelectedNodeId(null)}
            nodeTypes={NODE_TYPES}
            connectionLineType={ConnectionLineType.SmoothStep}
            connectionLineStyle={{ stroke: '#8b8b99', strokeWidth: 2 }}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            style={{ backgroundColor: '#111116' }}
          >
            <Background color="#242430" gap={24} size={1.5} />
            <Controls style={{ backgroundColor: '#18181f', border: '1px solid #282834', borderRadius: '8px', fill: '#ffffff' }} />
            <MiniMap
              nodeColor="#383848"
              maskColor="rgba(17, 17, 22, 0.85)"
              style={{ backgroundColor: '#18181f', border: '1px solid #282834', borderRadius: '8px' }}
            />
          </ReactFlow>

          {/* ─── BOTTOM EXECUTION CONSOLE DRAWER ─────────────────────── */}
          {showConsole && (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '180px',
                backgroundColor: '#18181f',
                borderTop: '1px solid #282834',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 25,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)'
              }}
            >
              <div style={{ padding: '8px 16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#111116' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Terminal size={14} color="#22c55e" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff' }}>Native MES Execution Console</span>
                  <span style={{ fontSize: '10px', color: '#71717a' }}>({executionLogs.length} events logged)</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setExecutionLogs([])} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '10px', cursor: 'pointer' }}>Clear</button>
                  <button onClick={() => setShowConsole(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><X size={14} /></button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', fontFamily: 'monospace', fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {executionLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1' }}>
                    <span style={{ color: '#71717a' }}>[{log.timestamp}]</span>
                    <span style={{ color: '#22c55e', fontWeight: 700 }}>● {log.status}</span>
                    <span style={{ color: '#38bdf8', fontWeight: 600 }}>{log.node}:</span>
                    <span style={{ color: '#f4f4f5' }}>{log.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* ─── FLOATING NODE QUICK ACTION OVERLAY ─────────────────── */}
          {selectedNode && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: '24px',
                transform: 'translateX(-50%)',
                backgroundColor: '#18181f',
                border: '1px solid #ff6d5a',
                borderRadius: '30px',
                padding: '6px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                zIndex: 30,
                boxShadow: '0 8px 30px rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#ff6d5a' }}>
                <Zap size={14} /> {selectedNode.data?.label || selectedNode.id}
              </div>

              <div style={{ width: '1px', height: '14px', backgroundColor: '#383848' }} />

              <button
                onClick={() => handleDuplicateNode(selectedNode.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '16px',
                  backgroundColor: '#212127',
                  border: '1px solid #383844',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Copy size={12} /> Duplikat
              </button>

              <button
                onClick={() => handleDeleteNode(selectedNode.id)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  backgroundColor: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(239,68,68,0.5)'
                }}
                title="Hapus node ini (atau tekan tombol Delete di keyboard)"
              >
                <Trash2 size={12} /> Hapus Node (Del)
              </button>
            </div>
          )}
        </div>

        {/* RIGHT NODE PROPERTIES INSPECTOR PANEL */}
        {showProperties && (
          <N8NPropertiesInspector
            selectedNode={selectedNode}
            onUpdateNode={handleUpdateNode}
            onDeleteNode={handleDeleteNode}
            onDuplicateNode={handleDuplicateNode}
            onClose={() => setShowProperties(false)}
          />
        )}
      </div>

      {/* ─── HAPUS WORKFLOW / CLEAR CONFIRMATION MODAL ──────────────── */}
      {showClearModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '460px',
              backgroundColor: '#18181f',
              border: '1px solid #7f1d1d',
              borderRadius: '14px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#7f1d1d30', border: '1px solid #7f1d1d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} color="#fca5a5" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>Hapus Seluruh Workflow?</h3>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Tindakan ini akan mengosongkan seluruh kanvas dan node alur kerja.</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={() => setShowClearModal(false)}
                style={{ flex: 1, padding: '10px', borderRadius: '8px', backgroundColor: '#272733', color: '#cbd5e1', border: '1px solid #383848', fontWeight: 700, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={handleResetToDemo}
                style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#212127', color: '#38bdf8', border: '1px solid #383848', fontWeight: 700, cursor: 'pointer' }}
              >
                Reset Default
              </button>
              <button
                onClick={handleClearWorkflow}
                style={{ flex: 1.5, padding: '10px', borderRadius: '8px', backgroundColor: '#ef4444', color: '#ffffff', border: 'none', fontWeight: 800, cursor: 'pointer', boxShadow: '0 2px 10px rgba(239,68,68,0.4)' }}
              >
                Ya, Hapus Semua
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATES GALLERY MODAL ────────────────────────────────── */}
      {showTemplateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <div
            style={{
              width: '840px',
              maxHeight: '80vh',
              backgroundColor: '#18181f',
              border: '1px solid #282834',
              borderRadius: '14px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
              overflow: 'hidden'
            }}
          >
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={18} color="#fff" />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Workflow Template Presets</h3>
              </div>
              <button onClick={() => setShowTemplateModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              {(WORKFLOW_TEMPLATES || []).map(tpl => (
                <div
                  key={tpl.id}
                  style={{
                    backgroundColor: '#111116',
                    border: '1px solid #282834',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#ff6d5a20', color: '#ff6d5a', textTransform: 'uppercase' }}>
                      {tpl.category}
                    </span>
                    <h4 style={{ margin: '6px 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
                      {tpl.name}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>
                      {tpl.description}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      setWorkflowName(tpl.name);
                      setShowTemplateModal(false);
                      toast.success(`Template "${tpl.name}" berhasil dimuat!`, { icon: '⚡' });
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#ff6d5a',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <PlayCircle size={14} /> Gunakan Template Ini
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Wrapper with ReactFlowProvider
const WorkflowEditor = () => {
  return (
    <ReactFlowProvider>
      <WorkflowEditorContent />
    </ReactFlowProvider>
  );
};

export default WorkflowEditor;
