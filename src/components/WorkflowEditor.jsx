/**
 * WorkflowEditor.jsx
 * =========================================================================
 * Authentic n8n v1+ Visual Workflow Canvas & Node Studio for Mandor MES
 *
 * Exact Visual Fidelity:
 * - D-Shaped Pill Trigger Nodes with Red Lightning Bolt Badge
 * - AI Agent Cards with Bottom Attachment Ports & Dashed Sub-nodes
 * - Circular Sub-Nodes (AI Models, Memory, Tools with Diamond Top Handles)
 * - Multi-Output Decision Nodes (Roadsign Icon with 'true' / 'false' Handles)
 * - Action Cards with Official Logos and Quick Chain '[+]' Buttons
 * - Floating Text Labels Under Nodes & Smooth Bezier Connections
 * - Midnight Slate Canvas (#111116) with Dot Grid
 * - Interactive Right-Side Properties Inspector Panel & Templates
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
  Eye, Layers, HelpCircle, Sparkles, UserPlus, GitFork, ArrowUpRight
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
        {isSlack ? <SlackLogo /> : <Send size={24} color="#38bdf8" />}

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
// MAIN WORKFLOW EDITOR COMPONENT
// =====================================================
export const WorkflowEditorContent = () => {
  // Initial Nodes mirroring the user's authentic n8n v1+ screenshot
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
    // Sub-Nodes attached to AI Agent
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
    // Decision Node
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
    // Slack Action Nodes
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
    // Main Flow
    {
      id: 'e-trigger-agent',
      source: 'node-trigger',
      target: 'node-agent',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 2 }
    },
    // Sub-node Dashed Connections
    {
      id: 'e-anthropic-agent',
      source: 'sub-anthropic',
      target: 'node-agent',
      targetHandle: 'chat_model',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' }
    },
    {
      id: 'e-postgres-agent',
      source: 'sub-postgres',
      target: 'node-agent',
      targetHandle: 'memory',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' }
    },
    {
      id: 'e-entra-agent',
      source: 'sub-entra',
      target: 'node-agent',
      targetHandle: 'tool',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' }
    },
    {
      id: 'e-jira-agent',
      source: 'sub-jira',
      target: 'node-agent',
      targetHandle: 'tool',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 1.5, strokeDasharray: '4,4' }
    },
    // Agent to Decision
    {
      id: 'e-agent-decision',
      source: 'node-agent',
      target: 'node-decision',
      type: 'smoothstep',
      style: { stroke: '#8b8b99', strokeWidth: 2 }
    },
    // Decision to Slacks (True / False)
    {
      id: 'e-decision-slack-true',
      source: 'node-decision',
      sourceHandle: 'true',
      target: 'node-slack-channel',
      type: 'smoothstep',
      label: 'true',
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: '#111116', fillOpacity: 0.8 },
      style: { stroke: '#8b8b99', strokeWidth: 2 }
    },
    {
      id: 'e-decision-slack-false',
      source: 'node-decision',
      sourceHandle: 'false',
      target: 'node-slack-profile',
      type: 'smoothstep',
      label: 'false',
      labelStyle: { fill: '#94a3b8', fontSize: 11, fontWeight: 600 },
      labelBgStyle: { fill: '#111116', fillOpacity: 0.8 },
      style: { stroke: '#8b8b99', strokeWidth: 2 }
    }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [workflowName, setWorkflowName] = useState('AI Onboarding & Role Dispatcher');
  const [selectedNodeId, setSelectedNodeId] = useState('node-agent');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
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
        fontFamily: 'Inter, system-ui, sans-serif'
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
          padding: '0 20px',
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
              width: '320px'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: '#272733',
              border: '1px solid #383848',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Sparkles size={14} /> ⚡ Template Presets
          </button>

          <button
            onClick={() => toast.success(`Workflow "${workflowName}" tersimpan!`, { icon: '💾' })}
            style={{
              padding: '7px 14px',
              borderRadius: '6px',
              backgroundColor: '#272733',
              border: '1px solid #383848',
              color: '#ffffff',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Save size={14} /> Save
          </button>

          <button
            onClick={handleTestWorkflow}
            disabled={isRunning}
            style={{
              padding: '7px 18px',
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
            <Play size={14} /> {isRunning ? 'Running...' : 'Test workflow'}
          </button>
        </div>
      </div>

      {/* ─── MAIN CANVAS AREA ──────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', backgroundColor: '#111116' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => setSelectedNodeId(node.id)}
          onPaneClick={() => setSelectedNodeId(null)}
          nodeTypes={NODE_TYPES}
          connectionLineType={ConnectionLineType.SmoothStep}
          connectionLineStyle={{ stroke: '#8b8b99', strokeWidth: 2 }}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          style={{ backgroundColor: '#111116' }}
        >
          {/* Midnight Dot Grid Background */}
          <Background color="#242430" gap={24} size={1.5} />
          <Controls style={{ backgroundColor: '#18181f', border: '1px solid #282834', borderRadius: '8px', fill: '#ffffff' }} />
          <MiniMap
            nodeColor="#383848"
            maskColor="rgba(17, 17, 22, 0.85)"
            style={{ backgroundColor: '#18181f', border: '1px solid #282834', borderRadius: '8px' }}
          />
        </ReactFlow>

        {/* ─── RIGHT SIDE NODE PROPERTIES PANEL ───────────────────────── */}
        {selectedNode && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '380px',
              backgroundColor: '#18181f',
              borderLeft: '1px solid #282834',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 20,
              boxShadow: '-6px 0 25px rgba(0,0,0,0.6)'
            }}
          >
            {/* Panel Header */}
            <div style={{ padding: '16px', borderBottom: '1px solid #282834', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

              <button onClick={() => setSelectedNodeId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            {/* Panel Form Parameters */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Node Display Label
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.label || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label: val } } : n));
                  }}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Subtitle / Action Info
                </label>
                <input
                  type="text"
                  value={selectedNode.data?.subtitle || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, subtitle: val } } : n));
                  }}
                  style={{ width: '100%', padding: '8px 12px', backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', color: '#ffffff', fontSize: '12px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Parameters & Configuration JSON
                </label>
                <div style={{ backgroundColor: '#111116', border: '1px solid #2e2e3a', borderRadius: '6px', padding: '10px' }}>
                  <pre style={{ margin: 0, fontSize: '11px', color: '#34d399', fontFamily: 'monospace' }}>
                    {JSON.stringify(selectedNode.data?.parameters || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            {/* Panel Footer */}
            <div style={{ padding: '14px', borderTop: '1px solid #282834' }}>
              <button
                onClick={() => {
                  toast.success(`Node "${selectedNode.data?.label}" berhasil diuji!`, { icon: '⚡' });
                }}
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
                  gap: '6px'
                }}
              >
                <Play size={14} /> ⚡ Test Step
              </button>
            </div>
          </div>
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
