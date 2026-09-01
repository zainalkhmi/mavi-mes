/**
 * WorkflowEditor.jsx
 * =========================================================================
 * Authentic n8n v1+ Visual Workflow Canvas, Node Palette & Properties Studio
 *
 * Exact Visual Fidelity:
 * - Left Node Palette Sidebar with Drag-and-Drop & Categorized Tool Library
 * - D-Shaped Pill Trigger Nodes with Red Lightning Bolt Badge
 * - AI Agent Cards with Bottom Attachment Ports & Dashed Sub-nodes
 * - Circular Sub-Nodes (AI Models, Memory, Tools with Diamond Top Handles)
 * - Multi-Output Decision Nodes (Roadsign Icon with 'true' / 'false' Handles)
 * - Action Cards with Official Logos (Slack, Telegram, Sheets, etc.) & Quick Chain '[+]'
 * - Right Slide-Over Node Properties Inspector with Parameters, Data & Settings
 * - Floating Text Labels Under Nodes & Smooth Bezier Connections
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
  Trash2, Settings2, Send, Bot, Cpu, Code, Filter, Hash,
  MessageSquare, FileSpreadsheet, Server, Globe, Webhook,
  ChevronDown, ChevronRight, GripVertical, MoreHorizontal,
  PanelLeftClose, PanelRightClose, Maximize2, Minimize2,
  Variable, FileJson, Timer, Bell, Shield, GitBranch, CheckCircle2,
  X, Check, RefreshCw, Terminal, Sliders, ArrowRight, PlayCircle,
  Eye, Layers, HelpCircle, Sparkles, UserPlus, GitFork, ArrowUpRight,
  SlidersHorizontal, Box, ToggleLeft, ToggleRight
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '84px',
          height: '84px',
          backgroundColor: '#1b1b22',
          borderRadius: '50px 18px 18px 50px',
          border: selected ? '2px solid #ff6d5a' : '1.5px solid #2e2e38',
          boxShadow: selected ? '0 0 0 3px rgba(255,109,90,0.3), 0 8px 24px rgba(0,0,0,0.5)' : '0 6px 18px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease'
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
            backgroundColor: '#ff4d4f',
            border: '2px solid #111116',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,77,79,0.5)'
          }}
        >
          <Zap size={13} color="#ffffff" fill="#ffffff" />
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          backgroundColor: '#212127',
          border: selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '14px',
          padding: '14px 22px',
          boxShadow: selected ? '0 0 0 3px rgba(255,109,90,0.3), 0 10px 28px rgba(0,0,0,0.5)' : '0 6px 20px rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          minWidth: '180px',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Left Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            left: '-6px'
          }}
        />

        {/* Robot Icon */}
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#ffffff10',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Bot size={22} color="#ffffff" />
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
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            right: '-6px'
          }}
        />

        {/* Bottom Attachment Ports (Chat Model, Memory, Tool) */}
        <Handle
          id="chat_model"
          type="target"
          position={Position.Bottom}
          style={{
            left: '25%',
            width: '10px',
            height: '10px',
            backgroundColor: '#ffffff',
            border: '2px solid #8b8b99',
            borderRadius: '2px',
            transform: 'rotate(45deg)',
            bottom: '-6px'
          }}
        />
        <Handle
          id="memory"
          type="target"
          position={Position.Bottom}
          style={{
            left: '50%',
            width: '10px',
            height: '10px',
            backgroundColor: '#ffffff',
            border: '2px solid #8b8b99',
            borderRadius: '2px',
            transform: 'rotate(45deg)',
            bottom: '-6px'
          }}
        />
        <Handle
          id="tool"
          type="target"
          position={Position.Bottom}
          style={{
            left: '75%',
            width: '10px',
            height: '10px',
            backgroundColor: '#ffffff',
            border: '2px solid #8b8b99',
            borderRadius: '2px',
            transform: 'rotate(45deg)',
            bottom: '-6px'
          }}
        />
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      {/* Top Diamond Label */}
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
          border: selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          boxShadow: selected ? '0 0 0 3px rgba(255,109,90,0.3), 0 6px 20px rgba(0,0,0,0.4)' : '0 4px 14px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Top Diamond Handle */}
        <Handle
          type="source"
          position={Position.Top}
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: '#ffffff',
            border: '2px solid #8b8b99',
            borderRadius: '2px',
            transform: 'rotate(45deg)',
            top: '-5px'
          }}
        />

        {/* Icon Render */}
        {nodeType === 'model' && (
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#e4e4e7', letterSpacing: '-1px' }}>
            AI
          </span>
        )}
        {nodeType === 'memory' && <PostgresElephant />}
        {nodeType === 'microsoft' && <MicrosoftLogo />}
        {nodeType === 'jira' && <JiraLogo />}
        {nodeType === 'tool' && !['microsoft', 'jira'].includes(nodeType) && (
          <Database size={20} color="#38bdf8" />
        )}
      </div>

      {/* Floating Bottom Label */}
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
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          backgroundColor: '#212127',
          border: selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '16px',
          boxShadow: selected ? '0 0 0 3px rgba(255,109,90,0.3), 0 8px 24px rgba(0,0,0,0.4)' : '0 6px 18px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Left Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            left: '-6px'
          }}
        />

        {/* Green Roadsign Icon */}
        <RoadSignIcon />

        {/* True Output Handle (Top Right) */}
        <Handle
          id="true"
          type="source"
          position={Position.Right}
          style={{
            top: '32%',
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            right: '-6px'
          }}
        />

        {/* False Output Handle (Bottom Right) */}
        <Handle
          id="false"
          type="source"
          position={Position.Right}
          style={{
            top: '68%',
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            right: '-6px'
          }}
        />
      </div>

      {/* Floating Bottom Label */}
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
      <div
        style={{
          position: 'relative',
          width: '74px',
          height: '74px',
          backgroundColor: '#212127',
          border: selected ? '2px solid #ff6d5a' : '1.5px solid #383844',
          borderRadius: '16px',
          boxShadow: selected ? '0 0 0 3px rgba(255,109,90,0.3), 0 8px 24px rgba(0,0,0,0.4)' : '0 6px 18px rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Left Input Handle */}
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            left: '-6px'
          }}
        />

        {/* Icon Render */}
        {isSlack ? <SlackLogo /> : isSheets ? <FileSpreadsheet size={26} color="#22c55e" /> : isTelegram ? <Send size={24} color="#38bdf8" /> : <Zap size={24} color="#a855f7" />}

        {/* Right Output Handle */}
        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '12px',
            height: '12px',
            backgroundColor: '#ffffff',
            border: '2.5px solid #383844',
            right: '-6px'
          }}
        />

        {/* Quick Chain [+] Button on Right */}
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

      {/* Floating Bottom Label */}
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
// LEFT NODE PALETTE SIDEBAR COMPONENT
// =====================================================
const N8NPaletteSidebar = ({ onAddNode, searchQuery, setSearchQuery, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('all');

  const paletteCategories = [
    {
      id: 'triggers',
      label: '⚡ Triggers',
      nodes: [
        { type: 'n8n_trigger', label: "On 'Create User' form submission", subtitle: 'Form Trigger', icon: <FileSpreadsheet size={16} color="#2dd4bf" />, color: '#0d9488' },
        { type: 'n8n_trigger', label: 'Webhook Listener', subtitle: 'Receive HTTP POST/GET', icon: <Webhook size={16} color="#10b981" />, color: '#10b981' },
        { type: 'n8n_trigger', label: 'Schedule Timer', subtitle: 'Cron interval', icon: <Clock size={16} color="#f59e0b" />, color: '#f59e0b' }
      ]
    },
    {
      id: 'ai',
      label: '🤖 AI & Agents',
      nodes: [
        { type: 'n8n_agent', label: 'AI Agent', subtitle: 'Tools Agent', icon: <Bot size={16} color="#a855f7" />, color: '#a855f7' },
        { type: 'n8n_subnode', subType: 'model', label: 'Anthropic Chat Model', portLabel: 'Model', subtitle: 'Claude 3.5 Sonnet', icon: <Sparkles size={16} color="#ffffff" />, color: '#ffffff' },
        { type: 'n8n_subnode', subType: 'memory', label: 'Postgres Chat Memory', portLabel: 'Memory', subtitle: 'Session persistence', icon: <Database size={16} color="#38bdf8" />, color: '#38bdf8' },
        { type: 'n8n_subnode', subType: 'microsoft', label: 'Microsoft Entra ID', portLabel: 'Tool', subtitle: 'Identity & Access', icon: <Shield size={16} color="#F25022" />, color: '#F25022' },
        { type: 'n8n_subnode', subType: 'jira', label: 'Jira Software', portLabel: 'Tool', subtitle: 'Create issue / sync', icon: <Database size={16} color="#2684FF" />, color: '#2684FF' }
      ]
    },
    {
      id: 'logic',
      label: '🔀 Logic & Routing',
      nodes: [
        { type: 'n8n_decision', label: 'Is a manager?', subtitle: 'True / False split', icon: <GitFork size={16} color="#22c55e" />, color: '#22c55e' },
        { type: 'n8n_decision', label: 'Is Dimension Pass?', subtitle: 'QC OK / NG condition', icon: <CheckCircle2 size={16} color="#22c55e" />, color: '#22c55e' },
        { type: 'n8n_action', label: 'Custom Code (JS)', subtitle: 'Data transformation', icon: <Code size={16} color="#eab308" />, color: '#eab308' }
      ]
    },
    {
      id: 'actions',
      label: '📱 Actions & Apps',
      nodes: [
        { type: 'n8n_action', label: 'Add to channel', subtitle: 'invite: channel', app: 'slack', icon: <MessageSquare size={16} color="#E01E5A" />, color: '#E01E5A' },
        { type: 'n8n_action', label: 'Update profile', subtitle: 'updateProfile: user', app: 'slack', icon: <MessageSquare size={16} color="#36C5F0" />, color: '#36C5F0' },
        { type: 'n8n_action', label: 'Telegram Alert', subtitle: 'Send message', app: 'telegram', icon: <Send size={16} color="#38bdf8" />, color: '#38bdf8' },
        { type: 'n8n_action', label: 'Google Sheets Log', subtitle: 'Append row', app: 'sheets', icon: <FileSpreadsheet size={16} color="#22c55e" />, color: '#22c55e' }
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
        width: '280px',
        height: '100%',
        backgroundColor: '#18181f',
        borderRight: '1px solid #282834',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20
      }}
    >
      {/* Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: '#ff6d5a20', border: '1px solid #ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={14} color="#ff6d5a" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>Nodes Palette</span>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid #282834' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
          <input
            type="text"
            placeholder="Cari node (AI, Slack, Sheets)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#fff', fontSize: '11px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Node Items List */}
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
// RIGHT NODE PROPERTIES INSPECTOR PANEL
// =====================================================
const N8NPropertiesInspector = ({ selectedNode, onUpdateNode, onDeleteNode, onDuplicateNode, onClose }) => {
  const [activeTab, setActiveTab] = useState('parameters'); // 'parameters' | 'data' | 'settings'

  if (!selectedNode) return null;

  return (
    <div
      style={{
        width: '360px',
        height: '100%',
        backgroundColor: '#18181f',
        borderLeft: '1px solid #282834',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 20,
        boxShadow: '-6px 0 25px rgba(0,0,0,0.6)'
      }}
    >
      {/* Panel Header */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#ff6d5a20', border: '1px solid #ff6d5a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#ff6d5a" />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: '#ffffff' }}>
              {selectedNode.data?.label || selectedNode.id}
            </h4>
            <span style={{ fontSize: '10px', color: '#94a3b8' }}>Type: {selectedNode.type}</span>
          </div>
        </div>

        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
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

      {/* Panel Body Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {activeTab === 'parameters' && (
          <>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Node Display Label
              </label>
              <input
                type="text"
                value={selectedNode.data?.label || ''}
                onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, label: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                Subtitle / Secondary Info
              </label>
              <input
                type="text"
                value={selectedNode.data?.subtitle || ''}
                onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, subtitle: e.target.value })}
                style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
              />
            </div>

            {/* If Slack */}
            {selectedNode.data?.app === 'slack' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Slack Channel / User
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.parameters?.channel || '#general'}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, channel: e.target.value } })}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                />
              </div>
            )}

            {/* If AI Agent */}
            {selectedNode.type === 'n8n_agent' && (
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  AI Agent System Prompt
                </label>
                <textarea
                  rows={4}
                  value={selectedNode.data?.parameters?.prompt || 'Process user onboarding and determine department privileges.'}
                  onChange={(e) => onUpdateNode(selectedNode.id, { ...selectedNode.data, parameters: { ...selectedNode.data?.parameters, prompt: e.target.value } })}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '11px', outline: 'none', resize: 'vertical' }}
                />
              </div>
            )}
          </>
        )}

        {activeTab === 'data' && (
          <div style={{ backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', padding: '10px' }}>
            <pre style={{ margin: 0, fontSize: '11px', color: '#34d399', fontFamily: 'monospace' }}>
              {JSON.stringify(selectedNode.data?.parameters || { status: 'OK', payload: { id: selectedNode.id } }, null, 2)}
            </pre>
          </div>
        )}

        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Continue On Fail
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" defaultChecked /> Save Execution Logs
            </label>
          </div>
        )}

      </div>

      {/* Panel Footer */}
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
          <Play size={14} /> ⚡ Test Step
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
// MAIN WORKFLOW EDITOR COMPONENT
// =====================================================
export const WorkflowEditorContent = () => {
  // Initial Nodes mirroring authentic n8n v1+ design
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
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRunning, setIsRunning] = useState(false);
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

  // Execute Workflow Test
  const handleTestWorkflow = () => {
    setIsRunning(true);
    toast.loading('Menjalankan n8n AI Agent Workflow...', { id: 'n8n_test' });
    setTimeout(() => {
      setIsRunning(false);
      toast.success('Eksekusi Berhasil! AI Agent memproses data & pesan Slack terkirim.', { id: 'n8n_test', icon: '🚀' });
    }, 1800);
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

          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: 800,
              outline: 'none',
              width: '280px'
            }}
          />
        </div>

        {/* Panel Toggles & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowPalette(!showPalette)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: showPalette ? '#ff6d5a20' : '#272733',
              border: `1px solid ${showPalette ? '#ff6d5a' : '#383848'}`,
              color: showPalette ? '#ff6d5a' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Box size={13} /> {showPalette ? 'Hide Palette' : 'Show Palette'}
          </button>

          <button
            onClick={() => setShowProperties(!showProperties)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: showProperties ? '#ff6d5a20' : '#272733',
              border: `1px solid ${showProperties ? '#ff6d5a' : '#383848'}`,
              color: showProperties ? '#ff6d5a' : '#94a3b8',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <SlidersHorizontal size={13} /> {showProperties ? 'Hide Properties' : 'Show Properties'}
          </button>

          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: '#272733',
              border: '1px solid #383848',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <Sparkles size={13} /> Templates
          </button>

          <button
            onClick={() => toast.success(`Workflow "${workflowName}" tersimpan!`, { icon: '💾' })}
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
              gap: '5px'
            }}
          >
            <Save size={13} /> Save
          </button>

          <button
            onClick={handleTestWorkflow}
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
            <Play size={13} /> {isRunning ? 'Running...' : 'Test workflow'}
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
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>n8n Workflow Template Presets</h3>
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
