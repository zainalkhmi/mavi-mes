import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  updateEdge,
  getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Zap,
  Play,
  Save,
  X,
  Plus,
  Minus,
  Clock,
  Database,
  Cpu,
  AlertCircle,
  History,
  CheckCircle2,
  Settings2,
  ChevronRight,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Link2,
  Mail,
  ExternalLink,
  Copy,
  Trash2,
  Clipboard,
  Layers,
  ClipboardPaste,
  Car,
  Sparkles,
  FolderOpen,
  FilePlus,
  Search,
  Bot,
  Wrench,
  Sliders,
  Activity,
  Maximize2,
  Globe,
  Brain,
  GitBranch,
  GitMerge,
  Code,
  Filter,
  Hourglass,
  FileText,
  Building,
  MessageSquare,
  Send,
  Server,
  FileSpreadsheet,
  Table,
  Key,
  ShieldCheck,
  Cpu as CpuIcon,
  Power,
  Pause,
  Square,
  HardDrive,
  Upload,
  Download
} from 'lucide-react';
import { generateAiAutomation } from '../utils/aiService';
import { getPrimaryAiConnector } from '../utils/database';

// ─── ODOO STYLE COLORFUL COMPACT NODES ──────────────────────────────────────────

// ─── PINBADGE (VISUAL DATA PINNING) ──────────────────────────────────────────
const PinBadge = ({ output }) => {
  if (!output) return null;
  const str = typeof output === 'object' ? JSON.stringify(output) : String(output);
  return (
    <div
      title={`Output JSON:\n${JSON.stringify(output, null, 2)}`}
      style={{
        marginTop: '6px',
        padding: '3px 8px',
        borderRadius: '6px',
        backgroundColor: '#00A09D',
        color: '#ffffff',
        fontSize: '0.6rem',
        fontWeight: 800,
        boxShadow: '0 2px 8px rgba(0, 160, 157, 0.4)',
        maxWidth: '140px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        border: '1px solid #ffffff'
      }}
    >
      📌 {str}
    </div>
  );
};

// 1. Event / Trigger Node (Odoo Teal `#00A09D` Compact Logo Node)
const EventNode = ({ data, selected }) => {
  const getTriggerIcon = () => {
    switch (data.triggerType) {
      case 'TIMER':
      case 'SCHEDULE': return <Clock size={28} />;
      case 'TABLE_ROW_ADDED':
      case 'TABLE_ROW_UPDATED': return <Database size={28} />;
      case 'MACHINE_TRIGGER': return <Cpu size={28} />;
      case 'WEBHOOK': return <Link2 size={28} />;
      case 'OBD2_TRIGGER': return <Car size={28} />;
      case 'GMAIL_TRIGGER': return <Mail size={28} />;
      case 'TELEGRAM_TRIGGER': return <Send size={28} />;
      default: return <Zap size={28} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{
        width: '62px',
        height: '62px',
        borderRadius: '18px',
        backgroundColor: '#00A09D',
        border: `3px solid ${selected ? '#ffffff' : '#017E84'}`,
        boxShadow: selected ? '0 0 24px rgba(0, 160, 157, 0.8)' : '0 8px 18px rgba(0, 160, 157, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}>
        {getTriggerIcon()}

        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '12px',
            height: '12px',
            background: '#00A09D',
            border: '2px solid #ffffff',
            boxShadow: '0 0 10px #00A09D',
            right: '-6px'
          }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label || 'Event Trigger'}
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#00A09D', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          Trigger
        </div>
        <PinBadge output={data.lastOutput} />
      </div>
    </div>
  );
};

// 2. Action Node (Odoo Purple `#714B67` / Royal Blue Node)
const ActionNode = ({ data, selected }) => {
  const isAI = data.type?.startsWith('AI_');

  const getActionIcon = () => {
    switch (data.type) {
      case 'UPDATE_RECORD': return <Database size={28} />;
      case 'CREATE_RECORD': return <Plus size={28} />;
      case 'HTTP_REQUEST': return <ExternalLink size={28} />;
      case 'SEND_NOTIFICATION':
      case 'TELEGRAM':
      case 'SLACK': return <MessageSquare size={28} />;
      case 'EMAIL':
      case 'GMAIL': return <Mail size={28} />;
      case 'SPREADSHEET':
      case 'EXCEL': return <FileSpreadsheet size={28} />;
      case 'ERP_CRM': return <Building size={28} />;
      case 'AI_SUMMARIZE':
      case 'AI_EXTRACT':
      case 'AI_ANOMALY_DETECTION':
      case 'AI_TRANSLATE': return <Sparkles size={28} />;
      default: return <Play size={28} />;
    }
  };

  const color = isAI ? '#a855f7' : '#714B67';
  const bgColor = isAI ? '#581c87' : '#714B67';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{
        width: '62px',
        height: '62px',
        borderRadius: '18px',
        backgroundColor: bgColor,
        border: `3px solid ${selected ? '#ffffff' : '#5B3C53'}`,
        boxShadow: selected ? `0 0 24px ${color}` : '0 8px 18px rgba(113, 75, 103, 0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        transition: 'all 0.2s ease',
        position: 'relative'
      }}>
        <Handle
          type="target"
          position={Position.Left}
          style={{
            width: '12px',
            height: '12px',
            background: color,
            border: '2px solid #ffffff',
            left: '-6px'
          }}
        />

        {getActionIcon()}

        <Handle
          type="source"
          position={Position.Right}
          style={{
            width: '12px',
            height: '12px',
            background: color,
            border: '2px solid #ffffff',
            boxShadow: `0 0 10px ${color}`,
            right: '-6px'
          }}
        />
      </div>

      <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label || 'Action'}
        </div>
        <div style={{ fontSize: '0.62rem', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.6px' }}>
          {isAI ? 'AI Action' : 'Action'}
        </div>
      </div>
    </div>
  );
};

// 3. Decision Node (Odoo Orange `#F05A28` IF Condition)
const DecisionNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#F05A28',
      border: `3px solid ${selected ? '#ffffff' : '#D03B0B'}`,
      boxShadow: selected ? '0 0 24px rgba(240, 90, 40, 0.8)' : '0 8px 18px rgba(240, 90, 40, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '12px',
          height: '12px',
          background: '#F05A28',
          border: '2px solid #ffffff',
          left: '-6px'
        }}
      />

      <AlertCircle size={28} />

      <Handle
        type="source"
        id="yes"
        position={Position.Right}
        style={{
          top: '30%',
          width: '12px',
          height: '12px',
          background: '#00A09D',
          border: '2px solid #ffffff',
          boxShadow: '0 0 8px #00A09D',
          right: '-6px'
        }}
      />
      <Handle
        type="source"
        id="no"
        position={Position.Right}
        style={{
          top: '70%',
          width: '12px',
          height: '12px',
          background: '#ef4444',
          border: '2px solid #ffffff',
          boxShadow: '0 0 8px #ef4444',
          right: '-6px'
        }}
      />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'IF Condition'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#F05A28', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Decision (IF)
      </div>
    </div>
  </div>
);

// 4. Switch Node (Odoo Coral / Amber Node)
const SwitchNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#E67E22',
      border: `3px solid ${selected ? '#ffffff' : '#D35400'}`,
      boxShadow: selected ? '0 0 24px rgba(230, 126, 34, 0.8)' : '0 8px 18px rgba(230, 126, 34, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#E67E22', border: '2px solid #ffffff', left: '-6px' }} />

      <GitBranch size={28} />

      <Handle type="source" id="b1" position={Position.Right} style={{ top: '20%', width: '10px', height: '10px', background: '#00A09D', border: '2px solid #ffffff', right: '-5px' }} />
      <Handle type="source" id="b2" position={Position.Right} style={{ top: '40%', width: '10px', height: '10px', background: '#714B67', border: '2px solid #ffffff', right: '-5px' }} />
      <Handle type="source" id="b3" position={Position.Right} style={{ top: '60%', width: '10px', height: '10px', background: '#3b82f6', border: '2px solid #ffffff', right: '-5px' }} />
      <Handle type="source" id="fallback" position={Position.Right} style={{ top: '80%', width: '10px', height: '10px', background: '#64748b', border: '2px solid #ffffff', right: '-5px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Switch Route'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#E67E22', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Switch
      </div>
    </div>
  </div>
);

// 5. Merge Node (Purple Merge)
const MergeNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#8E44AD',
      border: `3px solid ${selected ? '#ffffff' : '#6C3483'}`,
      boxShadow: selected ? '0 0 24px rgba(142, 68, 173, 0.8)' : '0 8px 18px rgba(142, 68, 173, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" id="inputA" position={Position.Left} style={{ top: '30%', width: '10px', height: '10px', background: '#8E44AD', border: '2px solid #ffffff', left: '-5px' }} />
      <Handle type="target" id="inputB" position={Position.Left} style={{ top: '70%', width: '10px', height: '10px', background: '#8E44AD', border: '2px solid #ffffff', left: '-5px' }} />

      <GitMerge size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#8E44AD', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Merge Streams'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#8E44AD', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Merge
      </div>
    </div>
  </div>
);

// 6. Code Node (Emerald Code)
const CodeNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#10B981',
      border: `3px solid ${selected ? '#ffffff' : '#059669'}`,
      boxShadow: selected ? '0 0 24px rgba(16, 185, 129, 0.8)' : '0 8px 18px rgba(16, 185, 129, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#10B981', border: '2px solid #ffffff', left: '-6px' }} />

      <Code size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#10B981', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Run Code'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Code Node
      </div>
    </div>
  </div>
);

// 7. Filter Node (Indigo Filter)
const FilterNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#4F46E5',
      border: `3px solid ${selected ? '#ffffff' : '#3730A3'}`,
      boxShadow: selected ? '0 0 24px rgba(79, 70, 229, 0.8)' : '0 8px 18px rgba(79, 70, 229, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#4F46E5', border: '2px solid #ffffff', left: '-6px' }} />

      <Filter size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#4F46E5', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Filter Data'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Filter
      </div>
    </div>
  </div>
);

// 8. Loop Node (Violet Loop)
const LoopNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#7C3AED',
      border: `3px solid ${selected ? '#ffffff' : '#5B21B6'}`,
      boxShadow: selected ? '0 0 24px rgba(124, 58, 237, 0.8)' : '0 8px 18px rgba(124, 58, 237, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#7C3AED', border: '2px solid #ffffff', left: '-6px' }} />

      <RefreshCw size={28} />

      <Handle type="source" id="body" position={Position.Right} style={{ top: '30%', width: '12px', height: '12px', background: '#7C3AED', border: '2px solid #ffffff', right: '-6px' }} />
      <Handle type="source" id="exit" position={Position.Right} style={{ top: '70%', width: '12px', height: '12px', background: '#64748b', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Loop'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Loop
      </div>
    </div>
  </div>
);

// 9. Wait Node (Sky Blue Wait)
const WaitNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#0284C7',
      border: `3px solid ${selected ? '#ffffff' : '#0369A1'}`,
      boxShadow: selected ? '0 0 24px rgba(2, 132, 199, 0.8)' : '0 8px 18px rgba(2, 132, 199, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#0284C7', border: '2px solid #ffffff', left: '-6px' }} />

      <Hourglass size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#0284C7', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Wait / Pause'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0284C7', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Wait
      </div>
    </div>
  </div>
);

// 10. Set / Edit Fields Node
const SetNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#06B6D4',
      border: `3px solid ${selected ? '#ffffff' : '#0891B2'}`,
      boxShadow: selected ? '0 0 24px rgba(6, 182, 212, 0.8)' : '0 8px 18px rgba(6, 182, 212, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#06B6D4', border: '2px solid #ffffff', left: '-6px' }} />

      <Sliders size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#06B6D4', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Edit Fields / Set'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#06B6D4', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Set Node
      </div>
    </div>
  </div>
);

// 11. Database Node
const DatabaseNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#059669',
      border: `3px solid ${selected ? '#ffffff' : '#047857'}`,
      boxShadow: selected ? '0 0 24px rgba(5, 150, 105, 0.8)' : '0 8px 18px rgba(5, 150, 105, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#059669', border: '2px solid #ffffff', left: '-6px' }} />

      <Database size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#059669', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Database Query'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Database
      </div>
    </div>
  </div>
);

// 12. Odoo Style AI Agent Card Node
const AIAgentCardNode = ({ data, selected }) => (
  <div style={{
    padding: '16px 20px',
    borderRadius: '20px',
    backgroundColor: '#714B67',
    border: `3px solid ${selected ? '#ffffff' : '#5B3C53'}`,
    boxShadow: selected ? '0 0 28px rgba(113, 75, 103, 0.9)' : '0 8px 24px rgba(113, 75, 103, 0.45)',
    minWidth: '230px',
    color: '#ffffff',
    position: 'relative'
  }}>
    <Handle
      type="target"
      position={Position.Left}
      style={{ width: '12px', height: '12px', background: '#ffffff', border: '2px solid #714B67', left: '-6px' }}
    />

    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '44px',
        height: '44px',
        borderRadius: '14px',
        backgroundColor: '#5B3C53',
        border: '2px solid #00A09D',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#00A09D',
        boxShadow: '0 0 12px rgba(0, 160, 157, 0.5)'
      }}>
        <Bot size={26} />
      </div>
      <div>
        <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>
          {data.label || 'AI Agent'}
        </div>
        <div style={{ fontSize: '0.7rem', color: '#e2e8f0', fontWeight: 700 }}>
          {data.agentType || 'Tools Agent'} ({data.provider || 'Gemini'})
        </div>
      </div>
    </div>

    <Handle
      type="source"
      position={Position.Right}
      style={{ width: '12px', height: '12px', background: '#ffffff', border: '2px solid #714B67', right: '-6px' }}
    />

    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.2)' }}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: '#38bdf8', fontWeight: 800 }}>MODEL</span>
        <Handle
          type="source"
          id="model"
          position={Position.Bottom}
          style={{ width: '10px', height: '10px', background: '#38bdf8', border: '2px solid #ffffff', bottom: '-14px' }}
        />
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: '#c084fc', fontWeight: 800 }}>MEMORY</span>
        <Handle
          type="source"
          id="memory"
          position={Position.Bottom}
          style={{ width: '10px', height: '10px', background: '#c084fc', border: '2px solid #ffffff', bottom: '-14px' }}
        />
      </div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6rem', color: '#34d399', fontWeight: 800 }}>TOOLS</span>
        <Handle
          type="source"
          id="tools"
          position={Position.Bottom}
          style={{ width: '10px', height: '10px', background: '#34d399', border: '2px solid #ffffff', bottom: '-14px' }}
        />
      </div>
    </div>
  </div>
);

// 13. Sub-Node: LLM Model
const SubModelNode = ({ data, selected }) => {
  const provider = data.provider || (data.label?.includes('OpenAI') ? 'OpenAI' : data.label?.includes('Gemini') ? 'Gemini' : data.label?.includes('Claude') ? 'Claude' : data.label?.includes('Ollama') ? 'Ollama' : 'OpenAI');

  const getColor = () => {
    switch (provider) {
      case 'OpenAI': return '#10a37f';
      case 'Gemini': return '#8e75ff';
      case 'Claude': return '#d97706';
      case 'Ollama': return '#00A09D';
      default: return '#00A09D';
    }
  };

  const color = getColor();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      <div style={{
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: '#ffffff',
        border: `3px solid ${selected ? '#714B67' : color}`,
        boxShadow: selected ? `0 0 20px ${color}` : '0 6px 14px rgba(0,0,0,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: color,
        position: 'relative'
      }}>
        <Handle type="target" position={Position.Top} style={{ width: '10px', height: '10px', background: color, border: '2px solid #ffffff', top: '-5px' }} />
        <Sparkles size={22} />
      </div>
      <div style={{ textAlign: 'center', marginTop: '6px', maxWidth: '120px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {data.label || `${provider} Model`}
        </div>
        <div style={{ fontSize: '0.6rem', color: color, fontWeight: 800, textTransform: 'uppercase' }}>
          {provider} ({data.modelId || 'Default'})
        </div>
      </div>
    </div>
  );
};

// 14. Sub-Node: AI Memory
const SubMemoryNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      border: `3px solid ${selected ? '#714B67' : '#8E44AD'}`,
      boxShadow: selected ? '0 0 20px #8E44AD' : '0 6px 14px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#8E44AD',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ width: '10px', height: '10px', background: '#8E44AD', border: '2px solid #ffffff', top: '-5px' }} />
      <Brain size={22} />
    </div>
    <div style={{ textAlign: 'center', marginTop: '6px', maxWidth: '110px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Window Buffer'}
      </div>
      <div style={{ fontSize: '0.6rem', color: '#8E44AD', fontWeight: 800 }}>MEMORY</div>
    </div>
  </div>
);

// 15. Sub-Node: AI Tool
const SubToolNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '50%',
      backgroundColor: '#ffffff',
      border: `3px solid ${selected ? '#714B67' : '#00A09D'}`,
      boxShadow: selected ? '0 0 20px #00A09D' : '0 6px 14px rgba(0,0,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#00A09D',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Top} style={{ width: '10px', height: '10px', background: '#00A09D', border: '2px solid #ffffff', top: '-5px' }} />
      {data.label?.includes('Wikipedia') ? <Globe size={22} /> : data.label?.includes('DB') ? <Database size={22} /> : <Wrench size={22} />}
    </div>
    <div style={{ textAlign: 'center', marginTop: '6px', maxWidth: '110px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Workflow Tool'}
      </div>
      <div style={{ fontSize: '0.6rem', color: '#00A09D', fontWeight: 800 }}>TOOL</div>
    </div>
  </div>
);

// 16. Sub-Workflow Node (Call Child Workflow)
const SubWorkflowNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#4F46E5',
      border: `3px solid ${selected ? '#ffffff' : '#3730A3'}`,
      boxShadow: selected ? '0 0 24px rgba(79, 70, 229, 0.8)' : '0 8px 18px rgba(79, 70, 229, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#4F46E5', border: '2px solid #ffffff', left: '-6px' }} />

      <Layers size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#4F46E5', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Call Sub-Workflow'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Sub-Workflow
      </div>
      <PinBadge output={data.lastOutput} />
    </div>
  </div>
);

// 17. Respond to Webhook Node
const RespondWebhookNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#E11D48',
      border: `3px solid ${selected ? '#ffffff' : '#BE123C'}`,
      boxShadow: selected ? '0 0 24px rgba(225, 29, 72, 0.8)' : '0 8px 18px rgba(225, 29, 72, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#E11D48', border: '2px solid #ffffff', left: '-6px' }} />

      <Send size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#E11D48', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Respond Webhook'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#E11D48', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Webhook Response
      </div>
      <PinBadge output={data.lastOutput} />
    </div>
  </div>
);

// 18. Error Trigger Node (Error Catch & Fallback Route)
const ErrorTriggerNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#EF4444',
      border: `3px solid ${selected ? '#ffffff' : '#B91C1C'}`,
      boxShadow: selected ? '0 0 24px rgba(239, 68, 68, 0.8)' : '0 8px 18px rgba(239, 68, 68, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <AlertTriangle size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#EF4444', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Error Fallback'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        Error Trigger
      </div>
      <PinBadge output={data.lastOutput} />
    </div>
  </div>
);

// 19. Send Email (SMTP) Node - Official n8n Specification
const SendEmailNode = ({ data, selected }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
    <div style={{
      width: '62px',
      height: '62px',
      borderRadius: '18px',
      backgroundColor: '#EA4335',
      border: `3px solid ${selected ? '#ffffff' : '#C5221F'}`,
      boxShadow: selected ? '0 0 24px rgba(234, 67, 53, 0.8)' : '0 8px 18px rgba(234, 67, 53, 0.4)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#ffffff',
      transition: 'all 0.2s ease',
      position: 'relative'
    }}>
      <Handle type="target" position={Position.Left} style={{ width: '12px', height: '12px', background: '#EA4335', border: '2px solid #ffffff', left: '-6px' }} />

      <Mail size={28} />

      <Handle type="source" position={Position.Right} style={{ width: '12px', height: '12px', background: '#EA4335', border: '2px solid #ffffff', right: '-6px' }} />
    </div>

    <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {data.label || 'Send Email (SMTP)'}
      </div>
      <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#EA4335', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
        {data.operation === 'Send and Wait for Response' ? 'Send & Wait Response' : 'Send Email'}
      </div>
      <PinBadge output={data.lastOutput} />
    </div>
  </div>
);

const nodeTypes = {
  event: EventNode,
  action: ActionNode,
  decision: DecisionNode,
  switch: SwitchNode,
  merge: MergeNode,
  code: CodeNode,
  filter: FilterNode,
  loop: LoopNode,
  wait: WaitNode,
  set: SetNode,
  database: DatabaseNode,
  ai_agent: AIAgentCardNode,
  sub_model: SubModelNode,
  sub_memory: SubMemoryNode,
  sub_tool: SubToolNode,
  sub_workflow: SubWorkflowNode,
  respond_webhook: RespondWebhookNode,
  error_trigger: ErrorTriggerNode,
  send_email: SendEmailNode
};

const PulseDataEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
  });

  const baseColor = selected ? '#a855f7' : '#6366f1';

  return (
    <g className="react-flow__edge-pulse">
      <path
        d={edgePath}
        fill="none"
        stroke={baseColor}
        strokeWidth={selected ? 5 : 3.5}
        strokeOpacity={0.25}
      />
      <path
        d={edgePath}
        fill="none"
        stroke={baseColor}
        strokeWidth={2}
        strokeDasharray="6,4"
        style={{ ...style }}
      />
      <circle r="4.5" fill="#38bdf8" style={{ filter: 'drop-shadow(0 0 6px #0284c7)' }}>
        <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
      </circle>
      <circle r="2.5" fill="#ffffff">
        <animateMotion dur="1.8s" repeatCount="indefinite" path={edgePath} />
      </circle>
    </g>
  );
};

const edgeTypes = {
  animatedPulse: PulseDataEdge,
  smoothstep: PulseDataEdge,
  default: PulseDataEdge
};

const initialNodes = [
  {
    id: 'start-node',
    type: 'event',
    data: { label: 'Click to choose event' },
    position: { x: 80, y: 180 },
  }
];

const initialEdges = [];

const AUTOMATION_TEMPLATES = [
  {
    id: 'temp_mavi_erp_workflow',
    name: 'MAVI MES Full ERP-Stock-Purchase Workflow',
    description: 'Workflow lengkap MAVI MES: Schedule Trigger -> HTTP ERP Order API -> IF (Cek Stok) -> [Ya: Buat MES WO + Supabase + Telegram] | [Tidak: Purchase Request + Email Supplier].',
    category: 'MAVI MES Core',
    nodes: [
      { id: 'start-node', type: 'event', position: { x: 60, y: 180 }, data: { triggerType: 'TIMER', label: 'Schedule Trigger (08:00)' } },
      { id: 'node_http_erp', type: 'action', position: { x: 260, y: 180 }, data: { type: 'HTTP_REQUEST', label: 'HTTP Request (Ambil Order ERP)' } },
      { id: 'node_dec_stock', type: 'decision', position: { x: 460, y: 180 }, data: { label: 'Stok Cukup?', condition: { field: 'stock', operator: '>=', value: 'order_qty' } } },
      
      { id: 'node_mes_wo', type: 'action', position: { x: 660, y: 100 }, data: { type: 'CREATE_RECORD', label: 'MES Create Work Order' } },
      { id: 'node_supabase', type: 'database', position: { x: 860, y: 100 }, data: { label: 'Supabase DB Sync' } },
      { id: 'node_telegram', type: 'action', position: { x: 1060, y: 100 }, data: { type: 'TELEGRAM', label: 'Telegram Alert Manager' } },

      { id: 'node_pr', type: 'action', position: { x: 660, y: 260 }, data: { type: 'CREATE_RECORD', label: 'Buat Purchase Request' } },
      { id: 'node_email_supplier', type: 'action', position: { x: 860, y: 260 }, data: { type: 'EMAIL', label: 'Email Supplier Auto' } }
    ],
    edges: [
      { id: 'e1', source: 'start-node', target: 'node_http_erp' },
      { id: 'e2', source: 'node_http_erp', target: 'node_dec_stock' },
      { id: 'e3', source: 'node_dec_stock', sourceHandle: 'yes', target: 'node_mes_wo' },
      { id: 'e4', source: 'node_mes_wo', target: 'node_supabase' },
      { id: 'e5', source: 'node_supabase', target: 'node_telegram' },
      { id: 'e6', source: 'node_dec_stock', sourceHandle: 'no', target: 'node_pr' },
      { id: 'e7', source: 'node_pr', target: 'node_email_supplier' }
    ]
  },
  {
    id: 'temp_n8n_ai_agent',
    name: 'Multi-LLM AI Agent Workflow (Gemini/OpenAI/Claude)',
    description: 'Workflow AI Agent lengkap: AI Agent terhubung ke Google Gemini / OpenAI / Claude Model, Window Buffer Memory, Wikipedia Tool, & Postgres DB Tool.',
    category: 'AI & Automation',
    nodes: [
      { id: 'start-node', type: 'event', position: { x: 60, y: 160 }, data: { triggerType: 'TABLE_ROW_ADDED', label: 'Inspeksi QC Ditambahkan' } },
      { id: 'node_ai_agent', type: 'ai_agent', position: { x: 260, y: 145 }, data: { label: 'AI Agent (MES Assistant)', agentType: 'Tools Agent', provider: 'Gemini', modelId: 'gemini-1.5-pro' } },
      
      { id: 'sub_model_gemini', type: 'sub_model', position: { x: 180, y: 310 }, data: { label: 'Google Gemini Model', provider: 'Gemini', modelId: 'gemini-1.5-pro' } },
      { id: 'sub_memory_buffer', type: 'sub_memory', position: { x: 290, y: 310 }, data: { label: 'Window Buffer Memory' } },
      { id: 'sub_tool_wiki', type: 'sub_tool', position: { x: 400, y: 310 }, data: { label: 'Wikipedia Tool' } },
      { id: 'sub_tool_db', type: 'sub_tool', position: { x: 510, y: 310 }, data: { label: 'Postgres DB Tool' } },
      
      { id: 'node_act_1', type: 'action', position: { x: 640, y: 160 }, data: { type: 'CREATE_RECORD', label: 'Buat Work Order Rework' } }
    ],
    edges: [
      { id: 'e1', source: 'start-node', target: 'node_ai_agent' },
      { id: 'e2', source: 'node_ai_agent', sourceHandle: 'model', target: 'sub_model_gemini', style: { strokeDasharray: '5,5', stroke: '#8e75ff' } },
      { id: 'e3', source: 'node_ai_agent', sourceHandle: 'memory', target: 'sub_memory_buffer', style: { strokeDasharray: '5,5', stroke: '#a78bfa' } },
      { id: 'e4', source: 'node_ai_agent', sourceHandle: 'tools', target: 'sub_tool_wiki', style: { strokeDasharray: '5,5', stroke: '#34d399' } },
      { id: 'e5', source: 'node_ai_agent', sourceHandle: 'tools', target: 'sub_tool_db', style: { strokeDasharray: '5,5', stroke: '#34d399' } },
      { id: 'e6', source: 'node_ai_agent', target: 'node_act_1' }
    ]
  }
];

const ensureNodePositions = (nodesList) => {
  if (!Array.isArray(nodesList)) return nodesList;
  return nodesList.map((node, index) => {
    if (!node) return node;

    let type = node.type || 'action';
    const data = { ...(node.data || {}) };

    // ─── NORMALIZE PALETTE NODE TYPES ──────────────────────────────────────────
    if (type === 'eventNode' || type === 'trigger') {
      type = 'event';
      if (!data.triggerType) data.triggerType = 'TABLE_ROW_ADDED';
    } else if (type === 'conditionNode' || type === 'condition' || type === 'if') {
      type = 'decision';
    } else if (type === 'actionNode') {
      type = 'action';
    }

    if (!data.label) {
      data.label = type === 'event' ? 'Event Trigger' : type === 'decision' ? 'IF Condition' : type === 'action' ? 'Action' : 'Node';
    }

    const pos = {
      x: typeof node.position?.x === 'number' ? node.position.x : (index * 200 + 80),
      y: typeof node.position?.y === 'number' ? node.position.y : 180
    };

    return {
      ...node,
      type,
      data,
      position: pos
    };
  });
};

const AutomationEditor = () => {
  const [nodes, setNodesState, onNodesChange] = useNodesState(initialNodes);
  const setNodes = useCallback((nds) => {
    setNodesState((prev) => {
      const nextNodes = typeof nds === 'function' ? nds(prev) : nds;
      return ensureNodePositions(nextNodes);
    });
  }, [setNodesState]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [activeTab, setActiveTab] = useState('EDIT');
  const [automationName, setAutomationName] = useState('Untitled Automation');
  const [showEventPicker, setShowEventPicker] = useState(false);
  const [tables, setTables] = useState([]);
  const [currentAuto, setCurrentAuto] = useState(null);
  const [automations, setAutomations] = useState([]);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerTab, setManagerTab] = useState('saved');
  const [menu, setMenu] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Execution Control States
  const [isActive, setIsActive] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inspectorSubTab, setInspectorSubTab] = useState('PARAMETERS');

  // AI Copilot States
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);

  const handleGenerateAiAutomation = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiGenerating(true);
    try {
      const connector = await getPrimaryAiConnector();
      if (!connector) throw new Error('AI Connector belum dikonfigurasi di AI Settings.');

      const res = await generateAiAutomation(aiPrompt, connector);
      if (res.name) setAutomationName(res.name);
      if (res.nodes && Array.isArray(res.nodes)) setNodes(res.nodes);
      if (res.edges && Array.isArray(res.edges)) setEdges(res.edges);

      setIsAiModalOpen(false);
      setAiPrompt('');
    } catch (err) {
      alert(`Gagal membuat otomasi AI: ${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const edgeUpdateSuccessful = useRef(true);
  const reactFlowWrapper = useRef(null);
  const fileInputRef = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const { project, setViewport } = useReactFlow();

  const onInit = (instance) => setReactFlowInstance(instance);

  const onDragStart = (event, nodeType, data = {}) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(data));
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      const rawData = event.dataTransfer.getData('application/reactflow-data');
      const data = rawData ? JSON.parse(rawData) : {};

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode = {
        id: `node_${Date.now()}`,
        type,
        position,
        data: { ...data, label: data.label || `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  useEffect(() => {
    if (isManagerOpen) {
      const saved = localStorage.getItem('mes_automations');
      if (saved) setAutomations(JSON.parse(saved));
    }
  }, [isManagerOpen]);

  useEffect(() => {
    import('../utils/database').then(db => {
      db.getTables().then(setTables);
    });

    const saved = localStorage.getItem('mes_automations');
    if (saved) {
      const allAutos = JSON.parse(saved);
      const existing = allAutos.find(a => a.name === automationName || a.id === 'default_auto');
      if (existing) {
        setCurrentAuto(existing);
        setAutomationName(existing.name);
        setIsActive(existing.active !== false);
        const source = existing.development || existing.published || existing;
        setNodes(source.nodes || initialNodes);
        setEdges(source.edges || initialEdges);
      }
    }
  }, []);

  const onNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      setMenu({
        id: node.id,
        top: event.clientY,
        left: event.clientX,
        type: 'node',
      });
    },
    [setMenu]
  );

  const onPaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      setMenu({
        id: null,
        top: event.clientY,
        left: event.clientX,
        type: 'pane',
      });
    },
    [setMenu]
  );

  const onPaneClick = useCallback(() => setMenu(null), [setMenu]);

  const deleteNode = useCallback((id) => {
    if (id === 'start-node') return;
    setNodes((nds) => nds.filter((node) => node.id !== id));
    setEdges((eds) => eds.filter((edge) => edge.source !== id && edge.target !== id));
    setMenu(null);
  }, [setNodes, setEdges]);

  const copyNode = useCallback((id) => {
    const node = nodes.find((n) => n.id === id);
    if (node) {
      setClipboard({ ...node });
    }
    setMenu(null);
  }, [nodes]);

  const duplicateNode = useCallback((id) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    const newId = `node_${Date.now()}`;
    const newNode = {
      ...node,
      id: newId,
      position: { x: node.position.x + 40, y: node.position.y + 40 },
    };

    setNodes((nds) => nds.concat(newNode));
    setMenu(null);
  }, [nodes, setNodes]);

  const pasteNode = useCallback(() => {
    if (!clipboard || !menu) return;

    const id = `node_${Date.now()}`;
    const rect = reactFlowWrapper.current?.getBoundingClientRect();
    const position = project({
      x: menu.left - (rect?.left || 0),
      y: menu.top - (rect?.top || 0),
    });

    const newNode = {
      ...clipboard,
      id,
      position,
    };

    setNodes((nds) => nds.concat(newNode));
    setMenu(null);
  }, [clipboard, menu, project, setNodes]);

  const handleNewAutomation = () => {
    if (confirm('Create new automation? Current unsaved changes will be lost.')) {
      setNodes(initialNodes);
      setEdges(initialEdges);
      setAutomationName('Untitled Automation');
      setCurrentAuto(null);
      setSelectedNode(null);
      setIsActive(true);
      setIsRunning(false);
      setIsPaused(false);
    }
  };

  const loadAutomation = (auto) => {
    setCurrentAuto(auto);
    setAutomationName(auto.name);
    setIsActive(auto.active !== false);
    setIsRunning(false);
    setIsPaused(false);
    const source = auto.development || auto.published || auto;
    setNodes(source.nodes || initialNodes);
    setEdges(source.edges || initialEdges);
    setIsManagerOpen(false);
    setSelectedNode(null);

    setTimeout(() => {
      setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
    }, 100);
  };

  const handleCreateFromTemplate = (template) => {
    if (confirm(`Create new automation from template "${template.name}"? Current unsaved changes will be lost.`)) {
      setNodes(template.nodes);
      setEdges(template.edges);
      setAutomationName(template.name);
      setCurrentAuto(null);
      setSelectedNode(null);
      setIsManagerOpen(false);
      setIsActive(true);
      setIsRunning(false);
      setIsPaused(false);

      setTimeout(() => {
        setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
      }, 100);
    }
  };

  const deleteAutomation = (id) => {
    if (!confirm('Are you sure you want to delete this automation?')) return;
    const saved = localStorage.getItem('mes_automations');
    if (saved) {
      const allAutos = JSON.parse(saved);
      const filtered = allAutos.filter(a => a.id !== id);
      localStorage.setItem('mes_automations', JSON.stringify(filtered));
      setAutomations(filtered);
      if (currentAuto?.id === id) {
        handleNewAutomation();
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        if (selectedNode && selectedNode.id !== 'start-node') {
          deleteNode(selectedNode.id);
          setSelectedNode(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode, deleteNode]);

  // ─── EXECUTION HANDLERS ──────────────────────────────────────────────────
  const handleExecuteWorkflow = async () => {
    setIsRunning(true);
    setIsPaused(false);
    try {
      const currentWorkflow = {
        id: currentAuto?.id || `temp_${Date.now()}`,
        name: automationName,
        active: true,
        nodes,
        edges
      };

      const mod = await import('../utils/automationEngine');
      await mod.default.execute(currentWorkflow, {
        source: 'MANUAL_TEST_RUN',
        timestamp: new Date().toISOString()
      });

      setIsRunning(false);
      alert(`Workflow "${automationName}" executed successfully! Output logged to System Logs.`);
    } catch (err) {
      setIsRunning(false);
      alert(`Workflow execution error: ${err.message}`);
    }
  };

  const handlePauseWorkflow = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    alert(nextPaused ? `Workflow "${automationName}" PAUSED.` : `Workflow "${automationName}" RESUMED.`);
  };

  const handleStopWorkflow = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsActive(false);
    alert(`Workflow "${automationName}" STOPPED and deactivated.`);
  };

  const toggleActiveState = () => {
    const nextState = !isActive;
    setIsActive(nextState);
    if (currentAuto) {
      currentAuto.active = nextState;
    }
  };

  const handleSave = () => {
    const saved = localStorage.getItem('mes_automations');
    const allAutos = saved ? JSON.parse(saved) : [];

    const eventNode = nodes.find(n => n.type === 'event');
    const devVersion = {
      nodes,
      edges,
      trigger: {
        type: eventNode?.data.triggerType || 'MANUAL',
        schedule: eventNode?.data.schedule || null
      },
      updatedAt: new Date().toISOString()
    };

    const updatedAuto = currentAuto ? {
      ...currentAuto,
      name: automationName,
      active: isActive,
      development: devVersion
    } : {
      id: `auto_${Date.now()}`,
      name: automationName,
      active: isActive,
      development: devVersion,
      published: null,
      history: []
    };

    const newAllAutos = allAutos.filter(a => a.id !== updatedAuto.id);
    newAllAutos.push(updatedAuto);
    localStorage.setItem('mes_automations', JSON.stringify(newAllAutos));
    setCurrentAuto(updatedAuto);
    alert('Development Version Saved!');
  };

  const handleExportWorkflow = (targetAuto = null) => {
    try {
      const exportData = targetAuto ? {
        maviVersion: '1.0',
        type: 'automation_workflow',
        id: targetAuto.id || `auto_${Date.now()}`,
        name: targetAuto.name || 'Exported Automation',
        active: targetAuto.active !== false,
        createdAt: targetAuto.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        development: targetAuto.development || {
          nodes: targetAuto.nodes || [],
          edges: targetAuto.edges || [],
          trigger: targetAuto.trigger || { type: 'MANUAL' }
        },
        published: targetAuto.published || null,
        nodes: targetAuto.nodes || targetAuto.development?.nodes || [],
        edges: targetAuto.edges || targetAuto.development?.edges || []
      } : {
        maviVersion: '1.0',
        type: 'automation_workflow',
        id: currentAuto?.id || `auto_${Date.now()}`,
        name: automationName || 'Untitled Automation',
        active: isActive,
        createdAt: currentAuto?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        development: {
          nodes,
          edges,
          trigger: {
            type: nodes.find(n => n.type === 'event')?.data?.triggerType || 'MANUAL',
            schedule: nodes.find(n => n.type === 'event')?.data?.schedule || null
          }
        },
        published: currentAuto?.published || null,
        nodes,
        edges
      };

      const fileName = `${(exportData.name || 'workflow').toLowerCase().replace(/[^a-z0-9]/gi, '_')}.mavi.json`;
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

  const handleImportWorkflow = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);

        const importedNodes = parsed.nodes || parsed.development?.nodes || parsed.published?.nodes || [];
        const importedEdges = parsed.edges || parsed.development?.edges || parsed.published?.edges || [];
        const name = parsed.name || file.name.replace(/\.(mavi\.)?json$/i, '') || 'Imported Workflow';

        if (!Array.isArray(importedNodes) || importedNodes.length === 0) {
          throw new Error('Invalid workflow JSON format. Could not find valid "nodes" array.');
        }

        const newAuto = {
          id: `auto_imp_${Date.now()}`,
          name: name,
          active: parsed.active !== false,
          development: {
            nodes: importedNodes,
            edges: importedEdges,
            trigger: parsed.development?.trigger || { type: 'MANUAL' },
            updatedAt: new Date().toISOString()
          },
          published: parsed.published || null,
          history: parsed.history || []
        };

        setNodes(importedNodes);
        setEdges(importedEdges);
        setAutomationName(name);
        setCurrentAuto(newAuto);
        setIsActive(newAuto.active);
        setIsRunning(false);
        setIsPaused(false);
        setSelectedNode(null);

        const saved = localStorage.getItem('mes_automations');
        const allAutos = saved ? JSON.parse(saved) : [];
        const filtered = allAutos.filter(a => a.name !== name && a.id !== newAuto.id);
        filtered.push(newAuto);
        localStorage.setItem('mes_automations', JSON.stringify(filtered));
        setAutomations(filtered);

        setIsManagerOpen(false);

        setTimeout(() => {
          setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 800 });
        }, 100);

        alert(`Workflow "${name}" imported successfully!`);
      } catch (err) {
        alert(`Failed to import workflow JSON: ${err.message}`);
      }
      if (e.target) e.target.value = '';
    };
    reader.readAsText(file);
  };

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params,
    type: 'animatedPulse',
    animated: true,
    style: {
      stroke: params.sourceHandle === 'model' ? '#38bdf8' :
        params.sourceHandle === 'memory' ? '#c084fc' :
        params.sourceHandle === 'tools' ? '#34d399' :
        params.sourceHandle === 'yes' ? '#00A09D' :
        params.sourceHandle === 'no' ? '#ef4444' : '#6366f1',
      strokeWidth: 3,
      strokeDasharray: params.sourceHandle === 'model' || params.sourceHandle === 'memory' || params.sourceHandle === 'tools' ? '5,5' : 'none'
    }
  }, eds)), [setEdges]);

  const onEdgeUpdateStart = useCallback(() => {
    edgeUpdateSuccessful.current = false;
  }, []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    edgeUpdateSuccessful.current = true;
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, [setEdges]);

  const onEdgeUpdateEnd = useCallback((_, edge) => {
    if (!edgeUpdateSuccessful.current) {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    }
    edgeUpdateSuccessful.current = true;
  }, [setEdges]);

  const onNodeClick = (event, node) => {
    setSelectedNode(node);
    if (node.id === 'start-node') {
      setShowEventPicker(true);
    }
  };

  const handlePublish = async () => {
    const saved = localStorage.getItem('mes_automations');
    const allAutos = saved ? JSON.parse(saved) : [];

    const eventNode = nodes.find(n => n.type === 'event');
    const newVersionNum = (currentAuto?.published?.version || 0) + 1;

    const snapshot = {
      version: newVersionNum,
      publishedAt: new Date().toISOString(),
      nodes,
      edges,
      trigger: {
        type: eventNode?.data.triggerType || 'MANUAL',
        schedule: eventNode?.data.schedule || null
      }
    };

    const updatedAuto = currentAuto ? {
      ...currentAuto,
      name: automationName,
      active: isActive,
      published: snapshot,
      history: [snapshot, ...(currentAuto.history || [])].slice(0, 10)
    } : {
      id: `auto_${Date.now()}`,
      name: automationName,
      active: isActive,
      development: snapshot,
      published: snapshot,
      history: [snapshot]
    };

    const newAllAutos = allAutos.filter(a => a.id !== updatedAuto.id);
    newAllAutos.push(updatedAuto);
    localStorage.setItem('mes_automations', JSON.stringify(newAllAutos));
    setCurrentAuto(updatedAuto);

    import('../utils/automationEngine').then(module => {
      module.default.refresh();
    });

    alert(`Version ${newVersionNum} Published!`);
  };

  const handleRestore = (version) => {
    if (!window.confirm(`Restore to version ${version.version}? This will overwrite your current development draft.`)) return;

    setNodes(version.nodes);
    setEdges(version.edges);
    setActiveTab('EDIT');
    alert(`Restored to version ${version.version}. Don't forget to Save or Publish!`);
  };

  const isRecursiveLoop = () => {
    const eventNode = nodes.find(n => n.type === 'event');
    if (eventNode?.data.triggerType !== 'TABLE_ROW_UPDATED') return false;

    return nodes.some(n =>
      n.type === 'action' &&
      (n.data.type === 'UPDATE_RECORD' || n.data.type === 'CREATE_RECORD') &&
      n.data.tableId &&
      n.data.tableId === eventNode.data.tableId
    );
  };

  const getConnectedSubNodes = (agentNodeId) => {
    const connected = { model: [], memory: [], tools: [] };
    edges.forEach(e => {
      if (e.source === agentNodeId) {
        const targetNode = nodes.find(n => n.id === e.target);
        if (targetNode) {
          if (e.sourceHandle === 'model' || targetNode.type === 'sub_model') connected.model.push(targetNode);
          else if (e.sourceHandle === 'memory' || targetNode.type === 'sub_memory') connected.memory.push(targetNode);
          else if (e.sourceHandle === 'tools' || targetNode.type === 'sub_tool') connected.tools.push(targetNode);
        }
      }
    });
    return connected;
  };

  // ─── ODOO STYLE COLORFUL SIDEBAR PALETTE ─────────────────────────────────────
  const SidebarPalette = () => {
    const categories = [
      { id: 'triggers', label: '1. Triggers (Workflow Start)', icon: Zap, color: '#00A09D' },
      { id: 'logic', label: '2. Core Logic & Flow', icon: Layers, color: '#F05A28' },
      { id: 'http', label: '3. HTTP & Connectors', icon: ExternalLink, color: '#2B6CB0' },
      { id: 'ai', label: '4. AI Agents & LLM Models', icon: Bot, color: '#714B67' },
      { id: 'data', label: '5. Databases & ERP/CRM', icon: Database, color: '#4F46E5' },
      { id: 'actions', label: '6. Email & Notifications', icon: Mail, color: '#E11D48' },
      { id: 'iot', label: '7. IoT & Hardware Sensors', icon: Cpu, color: '#10B981' },
    ];

    const nodesByCategory = {
      triggers: [
        { type: 'event', label: 'Manual Trigger', icon: Zap, data: { triggerType: 'MANUAL', label: 'Manual Trigger' } },
        { type: 'event', label: 'Schedule Trigger', icon: Clock, data: { triggerType: 'TIMER', label: 'Schedule (Jam 08:00)' } },
        { type: 'event', label: 'Webhook Trigger', icon: Link2, data: { triggerType: 'WEBHOOK', label: 'Webhook HTTP' } },
        { type: 'error_trigger', label: 'Error Trigger Node', icon: AlertTriangle, data: { label: 'Error Fallback Catch' } },
        { type: 'event', label: 'Gmail Trigger', icon: Mail, data: { triggerType: 'GMAIL_TRIGGER', label: 'Email Masuk' } },
        { type: 'event', label: 'Telegram Trigger', icon: Send, data: { triggerType: 'TELEGRAM_TRIGGER', label: 'Chat Telegram' } },
        { type: 'event', label: 'Table Row Event', icon: Table, data: { triggerType: 'TABLE_ROW_ADDED', label: 'Tabel Row Added' } },
      ],
      logic: [
        { type: 'decision', label: 'IF Node (Percabangan)', icon: AlertCircle, data: { label: 'IF Stock > 10' } },
        { type: 'switch', label: 'Switch Node (Multi-Branch)', icon: GitBranch, data: { label: 'Switch Country' } },
        { type: 'sub_workflow', label: 'Call Sub-Workflow', icon: Layers, data: { label: 'Call Child Workflow' } },
        { type: 'merge', label: 'Merge Node (Gabung Stream)', icon: GitMerge, data: { label: 'Merge Data' } },
        { type: 'set', label: 'Set / Edit Fields', icon: Sliders, data: { label: 'Set Variables' } },
        { type: 'code', label: 'Code Node (JS/Python)', icon: Code, data: { label: 'Code JS/Python' } },
        { type: 'filter', label: 'Filter Node', icon: Filter, data: { label: 'Filter Qty > 100' } },
        { type: 'loop', label: 'Loop Node (For Each)', icon: RefreshCw, data: { label: 'Loop Items' } },
        { type: 'wait', label: 'Wait / Pause Node', icon: Hourglass, data: { label: 'Wait 3 Days' } },
      ],
      http: [
        { type: 'action', label: 'HTTP Request (API)', icon: ExternalLink, data: { type: 'HTTP_REQUEST', label: 'HTTP Order ERP API' } },
        { type: 'respond_webhook', label: 'Respond to Webhook', icon: Send, data: { label: 'Respond 200 OK', statusCode: 200 } },
      ],
      ai: [
        { type: 'ai_agent', label: 'AI Agent Container', icon: Bot, data: { label: 'AI Agent Assistant', agentType: 'Tools Agent', provider: 'Gemini', modelId: 'gemini-1.5-pro' } },
        { type: 'sub_model', label: 'Google Gemini Model', icon: Sparkles, data: { label: 'Google Gemini Model', provider: 'Gemini', modelId: 'gemini-1.5-pro' } },
        { type: 'sub_model', label: 'OpenAI Chat Model', icon: Sparkles, data: { label: 'OpenAI Chat Model', provider: 'OpenAI', modelId: 'gpt-4o' } },
        { type: 'sub_model', label: 'Anthropic Claude Model', icon: Sparkles, data: { label: 'Anthropic Claude Model', provider: 'Claude', modelId: 'claude-3-5-sonnet' } },
        { type: 'sub_model', label: 'Ollama Local LLM', icon: CpuIcon, data: { label: 'Ollama Local LLM', provider: 'Ollama', modelId: 'llama3:8b' } },
        { type: 'sub_memory', label: 'Chat Memory Buffer', icon: Brain, data: { label: 'Window Buffer Memory' } },
        { type: 'sub_tool', label: 'Vector Store / Tools', icon: Wrench, data: { label: 'Postgres Vector DB' } },
      ],
      data: [
        { type: 'database', label: 'Supabase DB', icon: Database, data: { label: 'Supabase DB Sync' } },
        { type: 'database', label: 'PostgreSQL / MySQL', icon: Server, data: { label: 'Query PostgreSQL' } },
        { type: 'action', label: 'Google Sheets / Excel', icon: FileSpreadsheet, data: { type: 'SPREADSHEET', label: 'Google Sheets Row' } },
        { type: 'action', label: 'ERP / CRM Node (Odoo/SAP)', icon: Building, data: { type: 'ERP_CRM', label: 'Odoo / SAP ERP' } },
        { type: 'action', label: 'File PDF / CSV Node', icon: FileText, data: { type: 'FILE', label: 'Extract PDF / CSV' } },
      ],
      actions: [
        { type: 'action', label: 'WhatsApp Business API', icon: MessageSquare, data: { type: 'WHATSAPP', label: 'WhatsApp Order Alert' } },
        { type: 'action', label: 'Gmail / Email Node', icon: Mail, data: { type: 'GMAIL', label: 'Kirim Email' } },
        { type: 'action', label: 'Telegram Notification', icon: Send, data: { type: 'TELEGRAM', label: 'Telegram Manager' } },
        { type: 'action', label: 'Slack / Discord Alert', icon: MessageSquare, data: { type: 'SLACK', label: 'Slack Alert' } },
      ],
      iot: [
        { type: 'event', label: 'Machine / PLC Trigger', icon: Cpu, data: { triggerType: 'MACHINE_TRIGGER', label: 'PLC MQTT Trigger' } },
        { type: 'event', label: 'OBD2 Vehicle Data', icon: Car, data: { triggerType: 'OBD2_TRIGGER', label: 'OBD2 Sensor Data' } },
        { type: 'action', label: 'MQTT Publish Command', icon: Cpu, data: { type: 'MQTT_PUBLISH', label: 'Publish MQTT Topic' } },
        { type: 'action', label: 'Machine Command', icon: Cpu, data: { type: 'MACHINE_COMMAND', label: 'Send Machine Command' } },
      ]
    };

    return (
      <div style={{ width: '280px', backgroundColor: '#0f172a', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #1e293b', backgroundColor: '#0b0f19' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(99, 102, 241, 0.5)' }}>
              <Zap size={15} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.3px' }}>Node-RED Palette</h3>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#64748b' }} />
            <input
              type="text"
              placeholder="Search workflow nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#f8fafc',
                fontSize: '0.76rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
          {categories.map(cat => {
            const filteredNodes = nodesByCategory[cat.id].filter(n => n.label.toLowerCase().includes(searchQuery.toLowerCase()));
            if (searchQuery && filteredNodes.length === 0) return null;

            return (
              <div key={cat.id} style={{ marginBottom: '16px' }}>
                <div style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  color: cat.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.6px',
                  marginBottom: '8px',
                  padding: '0 6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <cat.icon size={13} /> {cat.label}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                  {filteredNodes.map((node, i) => (
                    <div
                      key={i}
                      draggable
                      onDragStart={(e) => onDragStart(e, node.type, node.data)}
                      style={{
                        padding: '9px 12px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#cbd5e1',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = cat.color;
                        e.currentTarget.style.backgroundColor = '#334155';
                        e.currentTarget.style.color = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 4px 14px ${cat.color}40`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#334155';
                        e.currentTarget.style.backgroundColor = '#1e293b';
                        e.currentTarget.style.color = '#cbd5e1';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                      }}
                    >
                      <div style={{ color: cat.color }}><node.icon size={16} /></div>
                      {node.label}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', height: '100%', backgroundColor: '#F8FAFC', color: '#1e293b' }}>
      <SidebarPalette />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <header style={{
          height: '64px',
          backgroundColor: '#1E1E2D',
          borderBottom: '1px solid #2B2B40',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button
              onClick={() => setIsManagerOpen(true)}
              style={{
                background: '#714B67',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 4px 10px rgba(113, 75, 103, 0.4)'
              }}
              title="Open Automations Manager"
            >
              <FolderOpen size={18} />
            </button>
            <div style={{ width: '1px', height: '24px', backgroundColor: '#3B3B54' }}></div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Node-RED Industrial Engine / {automationName}
                <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '999px', backgroundColor: '#064e3b', color: '#34d399', fontWeight: 800, border: '1px solid #059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34d399', boxShadow: '0 0 8px #34d399' }} />
                  ENGINE LIVE (2ms)
                </span>
                {isRecursiveLoop() && (
                  <span title="Potential Infinite Loop" style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={14} /> <span style={{ fontSize: '0.65rem', fontWeight: 800 }}>LOOP WARNING</span>
                  </span>
                )}
              </div>
              <input
                value={automationName}
                onChange={(e) => setAutomationName(e.target.value)}
                style={{
                  fontSize: '1.1rem',
                  fontWeight: 800,
                  border: 'none',
                  background: 'transparent',
                  outline: 'none',
                  color: '#ffffff',
                  width: '320px'
                }}
              />
            </div>
          </div>

          {/* ─── SLEEK ICON-ONLY WORKFLOW EXECUTION CONTROLS ─── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#2B2B40', padding: '5px 10px', borderRadius: '12px' }}>
            {/* ACTIVE / INACTIVE TOGGLE */}
            <button
              onClick={toggleActiveState}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                backgroundColor: isActive ? '#00A09D' : '#3B3B54',
                color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isActive ? '0 0 14px rgba(0, 160, 157, 0.7)' : 'none',
                transition: 'all 0.2s'
              }}
              title={isActive ? 'Status: ACTIVE (Listening to Background Triggers)' : 'Status: INACTIVE (Deactivated)'}
            >
              <Power size={18} />
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#3B3B54', margin: '0 2px' }}></div>

            {/* RUN TEST */}
            <button
              onClick={handleExecuteWorkflow}
              disabled={isRunning}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                backgroundColor: isRunning ? '#3b82f6' : '#10B981',
                color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 14px rgba(16, 185, 129, 0.5)',
                transition: 'all 0.2s'
              }}
              title={isRunning ? 'Running Workflow Test...' : 'Run Test Execution'}
            >
              <Play size={18} fill="#ffffff" />
            </button>

            {/* PAUSE */}
            <button
              onClick={handlePauseWorkflow}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                backgroundColor: isPaused ? '#F05A28' : '#3B3B54',
                color: isPaused ? '#ffffff' : '#F05A28',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={isPaused ? 'Resume Workflow' : 'Pause Workflow'}
            >
              <Pause size={18} />
            </button>

            {/* STOP */}
            <button
              onClick={handleStopWorkflow}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                backgroundColor: '#3B3B54',
                color: '#ef4444',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Stop & Deactivate Workflow"
            >
              <Square size={18} fill="#ef4444" />
            </button>

            <div style={{ width: '1px', height: '20px', backgroundColor: '#3B3B54', margin: '0 2px' }}></div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportWorkflow}
              style={{ display: 'none' }}
            />

            {/* AI COPILOT */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              style={{
                height: '36px', padding: '0 14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: '#ffffff', fontWeight: 800, fontSize: '0.78rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 0 14px rgba(168, 85, 247, 0.4)',
                transition: 'all 0.2s'
              }}
              title="AI Automation Copilot"
            >
              <Sparkles size={16} />
              AI Copilot
            </button>

            {/* NEW WORKFLOW */}
            <button
              onClick={handleNewAutomation}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #3B3B54',
                backgroundColor: '#3B3B54', color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="New Workflow"
            >
              <FilePlus size={18} />
            </button>

            {/* SAVE DRAFT */}
            <button
              onClick={handleSave}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #3B3B54',
                backgroundColor: '#3B3B54', color: '#ffffff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Save Draft"
            >
              <Save size={18} />
            </button>

            {/* EXPORT WORKFLOW JSON */}
            <button
              onClick={() => handleExportWorkflow()}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #3B3B54',
                backgroundColor: '#3B3B54', color: '#38bdf8', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Export Workflow JSON"
            >
              <Download size={18} />
            </button>

            {/* IMPORT WORKFLOW JSON */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '36px', height: '36px', borderRadius: '10px', border: '1px solid #3B3B54',
                backgroundColor: '#3B3B54', color: '#34d399', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title="Import Workflow JSON"
            >
              <Upload size={18} />
            </button>

            {/* PUBLISH VERSION */}
            <button
              onClick={handlePublish}
              style={{
                height: '36px', padding: '0 14px', borderRadius: '10px', border: 'none',
                backgroundColor: '#714B67', color: '#ffffff', fontWeight: 800, fontSize: '0.78rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 0 14px rgba(113, 75, 103, 0.6)',
                transition: 'all 0.2s'
              }}
              title="Publish Workflow Version"
            >
              <Send size={15} />
              Publish v{(currentAuto?.published?.version || 0) + 1}
            </button>
          </div>
        </header>

        {/* ─── CANVAS (ODOO LIGHT GRID STYLE) ─── */}
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#0b0f19' }} ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeUpdate={onEdgeUpdate}
            onEdgeUpdateStart={onEdgeUpdateStart}
            onEdgeUpdateEnd={onEdgeUpdateEnd}
            onNodeClick={onNodeClick}
            onNodeContextMenu={onNodeContextMenu}
            onPaneContextMenu={onPaneContextMenu}
            onPaneClick={onPaneClick}
            onInit={onInit}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={{
              type: 'animatedPulse',
              animated: true,
              style: { stroke: '#6366f1', strokeWidth: 3 }
            }}
          >
            <Background color="#334155" variant="dots" gap={20} size={1} />
            <Controls style={{ backgroundColor: '#1e293b', border: '1px solid #334155', fill: '#94a3b8', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', borderRadius: '10px' }} />
            <MiniMap nodeColor={() => '#6366f1'} maskColor="rgba(15, 23, 42, 0.75)" style={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '10px' }} />

            <div style={{
              position: 'absolute',
              bottom: '20px',
              right: '20px',
              backgroundColor: '#ffffff',
              border: '1px solid #cbd5e1',
              padding: '6px 14px',
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              zIndex: 5
            }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>MAVI AI Workflow Engine</span>
              <div style={{ width: '1px', height: '14px', backgroundColor: '#cbd5e1' }}></div>
              <span style={{ fontSize: '0.72rem', color: isActive ? '#00A09D' : '#ef4444', fontWeight: 800 }}>
                {isActive ? 'LISTENING' : 'INACTIVE'}
              </span>
            </div>
          </ReactFlow>

          {showEventPicker && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '420px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '24px',
              zIndex: 100,
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#714B67' }}>Choose Trigger Event</h3>
                <button onClick={() => setShowEventPicker(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: Play, label: 'Manual Trigger', sub: 'Execute workflow on button click', triggerType: 'MANUAL' },
                  { icon: Clock, label: 'Schedule Trigger', sub: 'Run on interval or Cron schedule', triggerType: 'SCHEDULE' },
                  { icon: Zap, label: 'Webhook Trigger', sub: 'Trigger on incoming HTTP request', triggerType: 'WEBHOOK' },
                  { icon: FileText, label: 'Form Trigger', sub: 'Trigger on user form submission', triggerType: 'FORM' },
                  { icon: MessageSquare, label: 'Chat Trigger', sub: 'Start workflow from AI chatbot message', triggerType: 'CHAT' },
                  { icon: Mail, label: 'Email Trigger (IMAP)', sub: 'Trigger when new email arrives in INBOX', triggerType: 'EMAIL_IMAP' },
                  { icon: Send, label: 'Telegram Trigger', sub: 'Trigger on Telegram Bot message or callback', triggerType: 'TELEGRAM' },
                  { icon: HardDrive, label: 'Google Drive Trigger', sub: 'Trigger on file created/modified', triggerType: 'GDRIVE' },
                  { icon: Table, label: 'Google Sheets Trigger', sub: 'Trigger when spreadsheet row changes', triggerType: 'GSHEETS' },
                  { icon: Database, label: 'Database Trigger', sub: 'Trigger on table INSERT / UPDATE / DELETE', triggerType: 'DATABASE' }
                ].map((ev, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (!ev.comingSoon) {
                        const triggerType = ev.triggerType || 'MANUAL';
                        setNodes(nds => nds.map(n => n.id === 'start-node' ? { ...n, data: { ...n.data, label: ev.label, triggerType } } : n));
                        setShowEventPicker(false);
                      }
                    }}
                    style={{
                      padding: '12px 15px',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px',
                      cursor: 'pointer',
                      backgroundColor: '#f8fafc',
                      color: '#1e293b',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#00A09D'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e2e8f0'}
                  >
                    <div style={{ color: '#00A09D' }}><ev.icon size={20} /></div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{ev.label}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{ev.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ width: '380px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column', color: '#f8fafc' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', backgroundColor: '#0b0f19' }}>
          <button
            onClick={() => setActiveTab('EDIT')}
            style={{
              flex: 1, padding: '14px', border: 'none', background: 'none',
              borderBottom: activeTab === 'EDIT' ? '3px solid #6366f1' : 'none',
              color: activeTab === 'EDIT' ? '#818cf8' : '#64748b',
              fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer'
            }}
          >Element Logic & AI</button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            style={{
              flex: 1, padding: '14px', border: 'none', background: 'none',
              borderBottom: activeTab === 'HISTORY' ? '3px solid #6366f1' : 'none',
              color: activeTab === 'HISTORY' ? '#818cf8' : '#64748b',
              fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer'
            }}
          >Version History</button>
        </div>

        {activeTab === 'EDIT' ? (
          selectedNode ? (
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#1e293b', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>Node Inspector</h3>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>{selectedNode.type.toUpperCase()} / {selectedNode.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              {/* ─── N8N COMPLIANT INSPECTOR SUB-TABS ─── */}
              <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '16px', backgroundColor: '#0f172a', borderRadius: '10px', padding: '3px' }}>
                <button
                  onClick={() => setInspectorSubTab('PARAMETERS')}
                  style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '8px',
                    backgroundColor: inspectorSubTab === 'PARAMETERS' ? '#334155' : 'transparent',
                    color: inspectorSubTab === 'PARAMETERS' ? '#38bdf8' : '#94a3b8',
                    fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer',
                    boxShadow: inspectorSubTab === 'PARAMETERS' ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >⚙️ Params</button>

                <button
                  onClick={() => setInspectorSubTab('OUTPUT')}
                  style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '8px',
                    backgroundColor: inspectorSubTab === 'OUTPUT' ? '#334155' : 'transparent',
                    color: inspectorSubTab === 'OUTPUT' ? '#34d399' : '#94a3b8',
                    fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer',
                    boxShadow: inspectorSubTab === 'OUTPUT' ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >📌 Telemetry</button>

                <button
                  onClick={() => setInspectorSubTab('CREDENTIALS')}
                  style={{
                    flex: 1, padding: '7px 4px', border: 'none', borderRadius: '8px',
                    backgroundColor: inspectorSubTab === 'CREDENTIALS' ? '#334155' : 'transparent',
                    color: inspectorSubTab === 'CREDENTIALS' ? '#a78bfa' : '#94a3b8',
                    fontWeight: 800, fontSize: '0.74rem', cursor: 'pointer',
                    boxShadow: inspectorSubTab === 'CREDENTIALS' ? '0 2px 6px rgba(0,0,0,0.3)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >🔒 Security</button>
              </div>

              {inspectorSubTab === 'PARAMETERS' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Node Name / Label</label>
                    <input
                      value={selectedNode.data.label || ''}
                      onChange={(e) => {
                        const label = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n));
                      }}
                      style={{ width: '100%', padding: '9px', marginTop: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                    />
                  </div>

                  {/* ─── 1. EVENT / TRIGGER NODE PARAMETERS ─── */}
                  {selectedNode.type === 'event' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #00A09D' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#00A09D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Zap size={16} /> Trigger Configuration ({selectedNode.data.triggerType || 'MANUAL'})
                      </div>

                      {(selectedNode.data.triggerType === 'TIMER' || selectedNode.data.triggerType === 'SCHEDULE' || !selectedNode.data.triggerType) && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Trigger Interval (Mode Interval)</label>
                          <select
                            value={selectedNode.data.schedule?.intervalMode || 'EVERY_DAY'}
                            onChange={(e) => {
                              const intervalMode = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), intervalMode } } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="EVERY_SECOND">Every Second</option>
                            <option value="EVERY_MINUTE">Every Minute</option>
                            <option value="EVERY_HOUR">Every Hour</option>
                            <option value="EVERY_DAY">Every Day</option>
                            <option value="EVERY_WEEK">Every Week</option>
                            <option value="EVERY_MONTH">Every Month</option>
                            <option value="CUSTOM_CRON">Custom (Cron Expression)</option>
                          </select>

                          {/* EVERY SECOND */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_SECOND' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Seconds Between Triggers</label>
                              <input
                                type="number"
                                placeholder="5"
                                value={selectedNode.data.schedule?.secondsBetween || 5}
                                onChange={(e) => {
                                  const secondsBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), secondsBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* EVERY MINUTE */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_MINUTE' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Minutes Between Triggers</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={selectedNode.data.schedule?.minutesBetween || 1}
                                onChange={(e) => {
                                  const minutesBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), minutesBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* EVERY HOUR */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_HOUR' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Hours Between Triggers</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={selectedNode.data.schedule?.hoursBetween || 1}
                                onChange={(e) => {
                                  const hoursBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), hoursBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Minute Trigger Runs On (0-59)</label>
                              <input
                                type="number"
                                min="0" max="59"
                                placeholder="0"
                                value={selectedNode.data.schedule?.minuteRunsOn || 0}
                                onChange={(e) => {
                                  const minuteRunsOn = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), minuteRunsOn } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* EVERY DAY */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_DAY' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Days Between Triggers</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={selectedNode.data.schedule?.daysBetween || 1}
                                onChange={(e) => {
                                  const daysBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), daysBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Time Trigger Runs (HH:MM)</label>
                              <input
                                type="time"
                                value={selectedNode.data.schedule?.time || '09:00'}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), time } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* EVERY WEEK */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_WEEK' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Weeks Between Triggers</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={selectedNode.data.schedule?.weeksBetween || 1}
                                onChange={(e) => {
                                  const weeksBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), weeksBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Days of the Week</label>
                              <select
                                value={selectedNode.data.schedule?.daysOfWeek || 'Monday,Friday'}
                                onChange={(e) => {
                                  const daysOfWeek = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), daysOfWeek } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              >
                                <option value="Monday,Friday">Monday & Friday</option>
                                <option value="Monday,Wednesday,Friday">Monday, Wednesday, Friday</option>
                                <option value="Monday-Friday">Workdays (Mon-Fri)</option>
                                <option value="Saturday,Sunday">Weekends (Sat-Sun)</option>
                                <option value="Monday">Every Monday</option>
                              </select>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Time Trigger Runs (HH:MM)</label>
                              <input
                                type="time"
                                value={selectedNode.data.schedule?.time || '09:00'}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), time } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* EVERY MONTH */}
                          {selectedNode.data.schedule?.intervalMode === 'EVERY_MONTH' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Months Between Triggers</label>
                              <input
                                type="number"
                                placeholder="1"
                                value={selectedNode.data.schedule?.monthsBetween || 1}
                                onChange={(e) => {
                                  const monthsBetween = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), monthsBetween } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Day of the Month (1-31)</label>
                              <input
                                type="number"
                                min="1" max="31"
                                placeholder="1"
                                value={selectedNode.data.schedule?.dayOfMonth || 1}
                                onChange={(e) => {
                                  const dayOfMonth = Number(e.target.value);
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), dayOfMonth } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Time Trigger Runs (HH:MM)</label>
                              <input
                                type="time"
                                value={selectedNode.data.schedule?.time || '09:00'}
                                onChange={(e) => {
                                  const time = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), time } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* CUSTOM CRON */}
                          {selectedNode.data.schedule?.intervalMode === 'CUSTOM_CRON' && (
                            <>
                              <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Cron Expression (5-6 Fields)</label>
                              <input
                                placeholder="0 9 * * 1-5"
                                value={selectedNode.data.schedule?.cron || '0 9 * * 1-5'}
                                onChange={(e) => {
                                  const cron = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, schedule: { ...(n.data.schedule || {}), cron } } } : n));
                                }}
                                style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#10B981', fontFamily: 'monospace', fontSize: '0.8rem' }}
                              />
                            </>
                          )}

                          {/* TIMEZONE OPTION */}
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Timezone</label>
                          <select
                            value={selectedNode.data.timezone || 'Asia/Jakarta'}
                            onChange={(e) => {
                              const timezone = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, timezone } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="Asia/Jakarta">Asia/Jakarta (WIB GMT+7)</option>
                            <option value="Asia/Makassar">Asia/Makassar (WITA GMT+8)</option>
                            <option value="Asia/Jayapura">Asia/Jayapura (WIT GMT+9)</option>
                            <option value="UTC">UTC (Coordinated Universal Time)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                            <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                          </select>
                        </>
                      )}

                      {selectedNode.data.triggerType === 'WEBHOOK' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>HTTP Method</label>
                          <select
                            value={selectedNode.data.httpMethod || 'POST'}
                            onChange={(e) => {
                              const httpMethod = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, httpMethod } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="POST">POST (Default JSON Body Payload)</option>
                            <option value="GET">GET (Query Parameters)</option>
                            <option value="PUT">PUT</option>
                            <option value="PATCH">PATCH</option>
                            <option value="DELETE">DELETE</option>
                            <option value="HEAD">HEAD</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Webhook Endpoint Path</label>
                          <input
                            placeholder="my-webhook"
                            value={selectedNode.data.webhookPath || 'my-webhook'}
                            onChange={(e) => {
                              const webhookPath = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, webhookPath } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />

                          <div style={{ fontSize: '0.68rem', backgroundColor: '#f1f5f9', padding: '8px 10px', borderRadius: '6px', color: '#475569', fontFamily: 'monospace' }}>
                            📍 URL: {typeof window !== 'undefined' ? window.location.origin : 'https://app.mavi.io'}/webhook/{selectedNode.data.webhookPath || 'my-webhook'}
                          </div>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Respond Strategy (Response Mode)</label>
                          <select
                            value={selectedNode.data.respondMode || 'IMMEDIATELY'}
                            onChange={(e) => {
                              const respondMode = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, respondMode } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="IMMEDIATELY">Immediately (Default 200 OK)</option>
                            <option value="LAST_NODE">When Last Node Finishes</option>
                            <option value="RESPOND_NODE">Using 'Respond to Webhook' Node</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Authentication Strategy</label>
                          <select
                            value={selectedNode.data.authMode || 'NONE'}
                            onChange={(e) => {
                              const authMode = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, authMode } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="NONE">None (Public Endpoint)</option>
                            <option value="BASIC_AUTH">Basic Auth (Username & Password)</option>
                            <option value="HEADER_AUTH">Header Auth (X-API-Key Header)</option>
                            <option value="JWT_AUTH">JWT Auth (Bearer Token)</option>
                          </select>

                          {/* OPTIONS SECTION */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #cbd5e1', paddingTop: '10px' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>Webhook Options</div>
                            
                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>Property Name for Body</label>
                            <input
                              placeholder="body"
                              value={selectedNode.data.bodyProperty || 'body'}
                              onChange={(e) => {
                                const bodyProperty = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, bodyProperty } } : n));
                              }}
                              style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />

                            <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b' }}>Allowed Origins (CORS)</label>
                            <input
                              placeholder="*"
                              value={selectedNode.data.allowedOrigins || '*'}
                              onChange={(e) => {
                                const allowedOrigins = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, allowedOrigins } } : n));
                              }}
                              style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />

                            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1e293b', fontWeight: 700 }}>
                              <input
                                type="checkbox"
                                checked={!!selectedNode.data.rawBody}
                                onChange={(e) => {
                                  const rawBody = e.target.checked;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, rawBody } } : n));
                                }}
                              /> Raw Body (Save payload as raw Buffer/Binary)
                            </label>

                            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1e293b', fontWeight: 700 }}>
                              <input
                                type="checkbox"
                                checked={!!selectedNode.data.binaryData}
                                onChange={(e) => {
                                  const binaryData = e.target.checked;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, binaryData } } : n));
                                }}
                              /> Binary Data (Accept file uploads via multipart/form-data)
                            </label>
                          </div>
                        </>
                      )}

                      {/* ─── 4. FORM TRIGGER PARAMETERS ─── */}
                      {selectedNode.data.triggerType === 'FORM' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Form Title</label>
                          <input
                            placeholder="User Registration Form"
                            value={selectedNode.data.formTitle || 'User Registration Form'}
                            onChange={(e) => {
                              const formTitle = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, formTitle } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Form Fields (JSON Schema)</label>
                          <textarea
                            placeholder='[{"name": "email", "type": "email", "label": "Email Address"}]'
                            value={selectedNode.data.formFields || ''}
                            onChange={(e) => {
                              const formFields = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, formFields } } : n));
                            }}
                            style={{ minHeight: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.75rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Completion Response Message</label>
                          <input
                            placeholder="Thank you for submitting!"
                            value={selectedNode.data.responseMessage || 'Thank you for submitting!'}
                            onChange={(e) => {
                              const responseMessage = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, responseMessage } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />
                        </>
                      )}

                      {/* ─── 5. CHAT TRIGGER PARAMETERS ─── */}
                      {selectedNode.data.triggerType === 'CHAT' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Chatbot Mode</label>
                          <select
                            value={selectedNode.data.chatMode || 'CONVERSATIONAL'}
                            onChange={(e) => {
                              const chatMode = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, chatMode } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="CONVERSATIONAL">Conversational Chatbot</option>
                            <option value="AGENT_COMMAND">AI Agent Command Executor</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Initial Welcome Message</label>
                          <input
                            placeholder="Halo! Ada yang bisa saya bantu?"
                            value={selectedNode.data.initialMessage || 'Halo! Ada yang bisa saya bantu?'}
                            onChange={(e) => {
                              const initialMessage = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, initialMessage } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />
                        </>
                      )}

                      {/* ─── 6. EMAIL TRIGGER (IMAP) PARAMETERS ─── */}
                      {selectedNode.data.triggerType === 'EMAIL_IMAP' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>IMAP Host & Port</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              placeholder="imap.gmail.com"
                              value={selectedNode.data.imapHost || 'imap.gmail.com'}
                              onChange={(e) => {
                                const imapHost = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imapHost } } : n));
                              }}
                              style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                            <input
                              placeholder="993"
                              value={selectedNode.data.imapPort || '993'}
                              onChange={(e) => {
                                const imapPort = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imapPort } } : n));
                              }}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                          </div>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>IMAP Username / Folder</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              placeholder="user@mavi.io"
                              value={selectedNode.data.imapUser || ''}
                              onChange={(e) => {
                                const imapUser = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imapUser } } : n));
                              }}
                              style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                            <input
                              placeholder="INBOX"
                              value={selectedNode.data.imapFolder || 'INBOX'}
                              onChange={(e) => {
                                const imapFolder = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imapFolder } } : n));
                              }}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                          </div>
                        </>
                      )}

                      {/* ─── 7. TELEGRAM TRIGGER PARAMETERS (N8N SPECIFICATION) ─── */}
                      {selectedNode.data.triggerType === 'TELEGRAM' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Credentials (Bot Token)</label>
                          <input
                            type="password"
                            placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                            value={selectedNode.data.botToken || ''}
                            onChange={(e) => {
                              const botToken = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, botToken } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontFamily: 'monospace', fontSize: '0.8rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Trigger On Event</label>
                          <select
                            value={selectedNode.data.telegramTriggerOn || 'MESSAGE'}
                            onChange={(e) => {
                              const telegramTriggerOn = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, telegramTriggerOn } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="MESSAGE">Message (Incoming Text/Media)</option>
                            <option value="EDITED_MESSAGE">Edited Message</option>
                            <option value="CHANNEL_POST">Channel Post</option>
                            <option value="EDITED_CHANNEL_POST">Edited Channel Post</option>
                            <option value="CALLBACK">Callback Query (Inline Button Click)</option>
                            <option value="INLINE_QUERY">Inline Query</option>
                            <option value="POLL">Poll Change</option>
                            <option value="SHIPPING_QUERY">Shipping Query (Payment)</option>
                            <option value="PRE_CHECKOUT_QUERY">Pre-Checkout Query</option>
                            <option value="CHAT_JOIN_REQUEST">Chat Join Request</option>
                            <option value="CHAT_MEMBER">Chat Member Status Change</option>
                            <option value="MY_CHAT_MEMBER">My Chat Member (Bot Status)</option>
                            <option value="MESSAGE_REACTION">Message Reaction</option>
                            <option value="MESSAGE_REACTION_COUNT">Message Reaction Count</option>
                            <option value="BUSINESS_CONNECTION">Business Connection</option>
                            <option value="BUSINESS_MESSAGE">Business Message</option>
                            <option value="EDITED_BUSINESS_MESSAGE">Edited Business Message</option>
                            <option value="DELETED_BUSINESS_MESSAGES">Deleted Business Messages</option>
                            <option value="PURCHASED_PAID_MEDIA">Purchased Paid Media</option>
                            <option value="ALL">* (All Updates)</option>
                          </select>

                          {/* DOWNLOAD IMAGES OPTIONS */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <label style={{ fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#1e293b', fontWeight: 700 }}>
                              <input
                                type="checkbox"
                                checked={!!selectedNode.data.downloadImages}
                                onChange={(e) => {
                                  const downloadImages = e.target.checked;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, downloadImages } } : n));
                                }}
                              /> Download Images (Save photo attachments as binary data)
                            </label>

                            {selectedNode.data.downloadImages && (
                              <>
                                <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Image Size</label>
                                <select
                                  value={selectedNode.data.imageSize || 'MEDIUM'}
                                  onChange={(e) => {
                                    const imageSize = e.target.value;
                                    setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, imageSize } } : n));
                                  }}
                                  style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                                >
                                  <option value="SMALL">Small</option>
                                  <option value="MEDIUM">Medium</option>
                                  <option value="LARGE">Large</option>
                                  <option value="EXTRA_LARGE">Extra Large</option>
                                </select>
                              </>
                            )}
                          </div>

                          {/* FILTERS */}
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Restrict to Chat IDs (Comma-Separated)</label>
                          <input
                            placeholder="123456789, 987654321"
                            value={selectedNode.data.restrictChatIds || ''}
                            onChange={(e) => {
                              const restrictChatIds = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, restrictChatIds } } : n));
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Restrict to User IDs (Comma-Separated)</label>
                          <input
                            placeholder="123456789"
                            value={selectedNode.data.restrictUserIds || ''}
                            onChange={(e) => {
                              const restrictUserIds = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, restrictUserIds } } : n));
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                          />

                          <div style={{ fontSize: '0.72rem', backgroundColor: '#e0f2fe', border: '1px solid #7dd3fc', padding: '10px', borderRadius: '8px', color: '#0369a1' }}>
                            💡 <b>Downstream Data Expression Guide:</b><br />
                            • Message Text: <code>{`{{ $json.message.text }}`}</code><br />
                            • Chat ID: <code>{`{{ $json.message.chat.id }}`}</code><br />
                            • Sender Name: <code>{`{{ $json.message.from.first_name }}`}</code><br />
                            • Sender User ID: <code>{`{{ $json.message.from.id }}`}</code>
                          </div>
                        </>
                      )}

                      {/* ─── 8. GOOGLE DRIVE TRIGGER PARAMETERS ─── */}
                      {selectedNode.data.triggerType === 'GDRIVE' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Drive Event</label>
                          <select
                            value={selectedNode.data.driveEvent || 'FILE_ADDED'}
                            onChange={(e) => {
                              const driveEvent = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, driveEvent } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="FILE_ADDED">File Added to Folder</option>
                            <option value="FILE_UPDATED">File Updated</option>
                            <option value="FILE_DELETED">File Deleted</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Drive Folder</label>
                          <input
                            placeholder="/MES_Reports"
                            value={selectedNode.data.driveFolder || '/MES_Reports'}
                            onChange={(e) => {
                              const driveFolder = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, driveFolder } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />
                        </>
                      )}

                      {/* ─── 9. GOOGLE SHEETS TRIGGER PARAMETERS ─── */}
                      {selectedNode.data.triggerType === 'GSHEETS' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Spreadsheet & Sheet Name</label>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                              placeholder="Production_Logs_2026"
                              value={selectedNode.data.sheetsName || 'Production_Logs_2026'}
                              onChange={(e) => {
                                const sheetsName = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetsName } } : n));
                              }}
                              style={{ flex: 2, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                            <input
                              placeholder="Sheet1"
                              value={selectedNode.data.sheetTab || 'Sheet1'}
                              onChange={(e) => {
                                const sheetTab = e.target.value;
                                setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetTab } } : n));
                              }}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.78rem' }}
                            />
                          </div>
                        </>
                      )}

                      {/* ─── 10. DATABASE TRIGGER PARAMETERS ─── */}
                      {(selectedNode.data.triggerType === 'DATABASE' || selectedNode.data.triggerType === 'TABLE_ROW_ADDED' || selectedNode.data.triggerType === 'TABLE_ROW_UPDATED') && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Database Table</label>
                          <select
                            value={selectedNode.data.tableName || 'WorkOrders'}
                            onChange={(e) => {
                              const tableName = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, tableName } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="WorkOrders">WorkOrders (Production Orders)</option>
                            <option value="Machines">Machines (Telemetry & Status)</option>
                            <option value="MaterialLogs">MaterialLogs (Inventory)</option>
                            <option value="SystemLogs">SystemLogs (Audit Logs)</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operation Event</label>
                          <select
                            value={selectedNode.data.dbOperation || 'INSERT'}
                            onChange={(e) => {
                              const dbOperation = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, dbOperation } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="INSERT">On Row Added (INSERT)</option>
                            <option value="UPDATE">On Row Updated (UPDATE)</option>
                            <option value="DELETE">On Row Deleted (DELETE)</option>
                          </select>
                        </>
                      )}

                      <button
                        onClick={() => setShowEventPicker(true)}
                        style={{ padding: '9px', backgroundColor: '#00A09D', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', fontSize: '0.78rem', marginTop: '6px' }}
                      >Change Event Trigger Type</button>
                    </div>
                  )}

                  {/* ─── 2. ACTION NODE EXHAUSTIVE PARAMETERS ─── */}
                  {selectedNode.type === 'action' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #714B67' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Action Category</label>
                      <select
                        value={selectedNode.data.type || 'LOG_MESSAGE'}
                        onChange={(e) => {
                          const type = e.target.value;
                          const label = type === 'UPDATE_RECORD' ? 'Update Table' :
                            type === 'CREATE_RECORD' ? 'Create Record' :
                            type === 'WHATSAPP' ? 'WhatsApp Alert' :
                            type === 'MQTT_PUBLISH' ? 'Publish MQTT' :
                            type === 'SPREADSHEET' ? 'Google Sheets' :
                            type === 'ERP_CRM' ? 'Odoo ERP Sync' : 'Log Message';
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, type, label } } : n));
                        }}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="LOG_MESSAGE">Log Message (System Log)</option>
                        <option value="UPDATE_RECORD">Update Table Record</option>
                        <option value="CREATE_RECORD">Create Table Record</option>
                        <option value="HTTP_REQUEST">HTTP Request (REST API)</option>
                        <option value="WHATSAPP">WhatsApp Business API Alert</option>
                        <option value="MQTT_PUBLISH">MQTT Publish Command</option>
                        <option value="GMAIL">Gmail / Email Notification</option>
                        <option value="TELEGRAM">Telegram Bot Message</option>
                        <option value="SLACK">Slack / Discord Webhook</option>
                        <option value="SPREADSHEET">Google Sheets / Excel</option>
                        <option value="ERP_CRM">Odoo / SAP ERP Sync</option>
                      </select>

                      {/* HTTP REQUEST DETAILS */}
                      {(selectedNode.data?.type === 'HTTP_REQUEST' || selectedNode.type === 'http') && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>HTTP Method</label>
                          <select
                            value={selectedNode.data.method || 'GET'}
                            onChange={(e) => {
                              const method = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, method } } : n));
                            }}
                            style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                            <option value="PATCH">PATCH</option>
                          </select>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Request URL</label>
                          <input
                            placeholder="https://api.company.com/v1/orders"
                            value={selectedNode.data.url || ''}
                            onChange={(e) => {
                              const url = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, url } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Request Headers (JSON)</label>
                          <input
                            placeholder='{"Authorization": "Bearer token"}'
                            value={selectedNode.data.headers || ''}
                            onChange={(e) => {
                              const headers = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, headers } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#10B981', fontFamily: 'monospace', fontSize: '0.78rem' }}
                          />
                        </>
                      )}

                      {/* WHATSAPP DETAILS */}
                      {selectedNode.data?.type === 'WHATSAPP' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Recipient Phone Number</label>
                          <input
                            placeholder="+628123456789"
                            value={selectedNode.data.phone || ''}
                            onChange={(e) => {
                              const phone = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, phone } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Message Body (Supports $json.orderId)</label>
                          <textarea
                            placeholder="Halo $json.customer, Work Order $json.orderId telah selesai diproses."
                            value={selectedNode.data.message || ''}
                            onChange={(e) => {
                              const message = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, message } } : n));
                            }}
                            style={{ minHeight: '70px', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem' }}
                          />
                        </>
                      )}

                      {/* MQTT DETAILS */}
                      {selectedNode.data?.type === 'MQTT_PUBLISH' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>MQTT Topic</label>
                          <input
                            placeholder="mavi/factory/line1/plc_command"
                            value={selectedNode.data.topic || ''}
                            onChange={(e) => {
                              const topic = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, topic } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>QoS Level</label>
                          <select
                            value={selectedNode.data.qos || 0}
                            onChange={(e) => {
                              const qos = Number(e.target.value);
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, qos } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value={0}>QoS 0 (At most once)</option>
                            <option value={1}>QoS 1 (At least once)</option>
                            <option value={2}>QoS 2 (Exactly once)</option>
                          </select>
                        </>
                      )}

                      {/* SPREADSHEET DETAILS */}
                      {selectedNode.data?.type === 'SPREADSHEET' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Spreadsheet ID / Sheet Name</label>
                          <input
                            placeholder="Sheet1"
                            value={selectedNode.data.sheetName || 'Sheet1'}
                            onChange={(e) => {
                              const sheetName = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, sheetName } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />
                        </>
                      )}

                      {/* ERP / CRM DETAILS */}
                      {selectedNode.data?.type === 'ERP_CRM' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Odoo / SAP Model</label>
                          <select
                            value={selectedNode.data.erpModel || 'mrp.production'}
                            onChange={(e) => {
                              const erpModel = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, erpModel } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          >
                            <option value="mrp.production">mrp.production (Manufacturing Order)</option>
                            <option value="sale.order">sale.order (Sales Order)</option>
                            <option value="stock.picking">stock.picking (Inventory Transfer)</option>
                            <option value="account.move">account.move (Invoices & Accounting)</option>
                          </select>
                        </>
                      )}
                    </div>
                  )}

                  {/* ─── 3. IF / DECISION NODE PARAMETERS ─── */}
                  {selectedNode.type === 'decision' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fff7ed', padding: '14px', borderRadius: '12px', border: '1px solid #F05A28' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#F05A28' }}>IF Condition Rules</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Field Path (e.g. status / qty)</label>
                      <input
                        placeholder="Field (e.g. Stock)"
                        value={selectedNode.data.condition?.field || ''}
                        onChange={(e) => {
                          const field = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, condition: { ...n.data.condition, field } } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Comparison Operator</label>
                      <select
                        value={selectedNode.data.condition?.operator || '=='}
                        onChange={(e) => {
                          const operator = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, condition: { ...n.data.condition, operator } } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="==">Equals (==)</option>
                        <option value="!=">Not Equals (!=)</option>
                        <option value="<">Less Than (&lt;)</option>
                        <option value=">">Greater Than (&gt;)</option>
                        <option value=">=">Greater Than or Equal (&gt;=)</option>
                        <option value="contains">Contains Text</option>
                      </select>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Value</label>
                      <input
                        placeholder="Value (e.g. 10)"
                        value={selectedNode.data.condition?.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, condition: { ...n.data.condition, value } } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 4. SWITCH NODE PARAMETERS ─── */}
                  {selectedNode.type === 'switch' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#fef3c7', padding: '14px', borderRadius: '12px', border: '1px solid #E67E22' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#E67E22' }}>Switch Multi-Branch Config</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Property Field</label>
                      <input
                        placeholder="e.g. status or country"
                        value={selectedNode.data.field || 'status'}
                        onChange={(e) => {
                          const field = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, field } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Branch 1 Value</label>
                      <input
                        placeholder="Value for Branch 1"
                        value={selectedNode.data.b1Value || ''}
                        onChange={(e) => {
                          const b1Value = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, b1Value } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Branch 2 Value</label>
                      <input
                        placeholder="Value for Branch 2"
                        value={selectedNode.data.b2Value || ''}
                        onChange={(e) => {
                          const b2Value = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, b2Value } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 5. SET NODE PARAMETERS ─── */}
                  {selectedNode.type === 'set' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#ecfeff', padding: '14px', borderRadius: '12px', border: '1px solid #06B6D4' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0891B2' }}>Set / Edit Fields Variable Mapper</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Variable Name</label>
                      <input
                        placeholder="e.g. total_price"
                        value={selectedNode.data.variable || ''}
                        onChange={(e) => {
                          const variable = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, variable } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Assigned Value / Expression</label>
                      <input
                        placeholder="e.g. 1500 or $json.qty * 2"
                        value={selectedNode.data.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, value } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#10B981', fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 6. LOOP NODE PARAMETERS ─── */}
                  {selectedNode.type === 'loop' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f3e8ff', padding: '14px', borderRadius: '12px', border: '1px solid #7C3AED' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#7C3AED' }}>Loop Over Items Config</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Array Path</label>
                      <input
                        placeholder="items or payload.orders"
                        value={selectedNode.data.listPath || 'items'}
                        onChange={(e) => {
                          const listPath = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, listPath } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 7. WAIT NODE PARAMETERS ─── */}
                  {selectedNode.type === 'wait' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pause Duration (ms)</label>
                      <input
                        placeholder="e.g. 5000 (for 5s delay)"
                        value={selectedNode.data.durationMs || ''}
                        onChange={(e) => {
                          const durationMs = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, durationMs } } : n));
                        }}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 8. CODE NODE PARAMETERS ─── */}
                  {selectedNode.type === 'code' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Code Snippet (JS / Python Sandbox)</label>
                      <textarea
                        placeholder="return items.map(item => { item.json.total = item.json.qty * item.json.price; return item; });"
                        value={selectedNode.data.code || ''}
                        onChange={(e) => {
                          const code = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, code } } : n));
                        }}
                        style={{ minHeight: '130px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#1E1E2D', color: '#10B981', fontFamily: 'monospace', fontSize: '0.78rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 9. DATABASE QUERY PARAMETERS ─── */}
                  {selectedNode.type === 'database' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#ecfdf5', padding: '14px', borderRadius: '12px', border: '1px solid #059669' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#059669' }}>Database Engine Settings</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operation</label>
                      <select
                        value={selectedNode.data.operation || 'SELECT'}
                        onChange={(e) => {
                          const operation = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, operation } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="SELECT">Select Rows (Query)</option>
                        <option value="INSERT">Insert New Record</option>
                        <option value="UPDATE">Update Existing Record</option>
                        <option value="DELETE">Delete Record</option>
                      </select>

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Table</label>
                      <select
                        value={selectedNode.data.table || 'WorkOrders'}
                        onChange={(e) => {
                          const table = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, table } } : n));
                        }}
                        style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="WorkOrders">WorkOrders</option>
                        <option value="Machines">Machines</option>
                        <option value="MaterialLogs">MaterialLogs</option>
                        <option value="SystemLogs">SystemLogs</option>
                      </select>
                    </div>
                  )}

                  {/* ─── 10. AI AGENT CONTAINER PARAMETERS ─── */}
                  {selectedNode.type === 'ai_agent' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #714B67' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#714B67' }}>
                          <Bot size={18} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>AI Agent Core Settings</span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#00A09D', display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: '#e6f7f7', padding: '3px 8px', borderRadius: '6px', fontWeight: 800 }}>
                          <ShieldCheck size={12} /> Synced with AI Settings
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Agent Type</label>
                        <select
                          value={selectedNode.data.agentType || 'Tools Agent'}
                          onChange={(e) => {
                            const agentType = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, agentType } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="Tools Agent">Tools Agent (ReAct Loop)</option>
                          <option value="Conversational Agent">Conversational Chat Agent</option>
                          <option value="Plan & Execute Agent">Plan and Execute Agent</option>
                          <option value="OpenAI Functions Agent">OpenAI Functions Agent</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Default LLM Provider</label>
                        <select
                          value={selectedNode.data.provider || 'Gemini'}
                          onChange={(e) => {
                            const provider = e.target.value;
                            const defaultModel = provider === 'Gemini' ? 'gemini-1.5-pro' : provider === 'OpenAI' ? 'gpt-4o' : provider === 'Claude' ? 'claude-3-5-sonnet' : 'llama3:8b';
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, provider, modelId: defaultModel } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="Gemini">Google Gemini (Gemini 1.5 Pro / Flash)</option>
                          <option value="OpenAI">OpenAI (GPT-4o / GPT-4o-mini)</option>
                          <option value="Claude">Anthropic Claude (Claude 3.5 Sonnet)</option>
                          <option value="Ollama">Ollama (Local Llama 3 / Mistral)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>System Instructions / Prompt</label>
                        <textarea
                          placeholder="You are an expert MAVI MES AI Assistant. Help optimize production work orders..."
                          value={selectedNode.data.systemPrompt || ''}
                          onChange={(e) => {
                            const systemPrompt = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, systemPrompt } } : n));
                          }}
                          style={{ width: '100%', minHeight: '80px', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#714B67', fontSize: '0.78rem' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── 11. SUB-WORKFLOW PARAMETERS ─── */}
                  {selectedNode.type === 'sub_workflow' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Sub-Workflow Name / ID</label>
                      <select
                        value={selectedNode.data.workflowName || ''}
                        onChange={(e) => {
                          const workflowName = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, workflowName, label: `Call: ${workflowName}` } } : n));
                        }}
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="">Select Child Workflow...</option>
                        {automations.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* ─── 12. RESPOND WEBHOOK PARAMETERS ─── */}
                  {selectedNode.type === 'respond_webhook' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Response HTTP Status Code</label>
                      <select
                        value={selectedNode.data.statusCode || 200}
                        onChange={(e) => {
                          const statusCode = Number(e.target.value);
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, statusCode } } : n));
                        }}
                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value={200}>200 OK (Success)</option>
                        <option value={201}>201 Created</option>
                        <option value={400}>400 Bad Request</option>
                        <option value={500}>500 Internal Server Error</option>
                      </select>
                    </div>
                  )}

                  {/* ─── 13. ERROR TRIGGER PARAMETERS (N8N SPECIFICATION) ─── */}
                  {selectedNode.type === 'error_trigger' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#fef2f2', padding: '14px', borderRadius: '12px', border: '1px solid #ef4444' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ef4444', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🛡️ Error Trigger Configuration (n8n Spec)
                      </div>

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Error Catch Mode</label>
                      <select
                        value={selectedNode.data.catchMode || 'ALL'}
                        onChange={(e) => {
                          const catchMode = e.target.value;
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, catchMode } } : n));
                        }}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value="ALL">Catch All Workflow Errors</option>
                        <option value="SPECIFIC">Catch Specific Target Node Failure</option>
                      </select>

                      {selectedNode.data.catchMode === 'SPECIFIC' && (
                        <>
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Target Node Name / ID</label>
                          <input
                            placeholder="HTTP Request"
                            value={selectedNode.data.targetNode || 'HTTP Request'}
                            onChange={(e) => {
                              const targetNode = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, targetNode } } : n));
                            }}
                            style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                          />
                        </>
                      )}

                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Max Auto Retries</label>
                      <select
                        value={selectedNode.data.maxRetries || 0}
                        onChange={(e) => {
                          const maxRetries = Number(e.target.value);
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, maxRetries } } : n));
                        }}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      >
                        <option value={0}>0 (No Retries - Trigger Fallback Immediately)</option>
                        <option value={1}>1 Retry Attempt</option>
                        <option value={3}>3 Retry Attempts</option>
                        <option value={5}>5 Retry Attempts</option>
                      </select>

                      <div style={{ fontSize: '0.72rem', backgroundColor: '#ffffff', border: '1px solid #fca5a5', padding: '10px', borderRadius: '8px', color: '#991b1b' }}>
                        💡 <b>Downstream Data Reference:</b><br />
                        • Error Message: <code>{`{{ $json.execution.error.message }}`}</code><br />
                        • Failed Node: <code>{`{{ $json.execution.lastNodeExecuted }}`}</code><br />
                        • Workflow Name: <code>{`{{ $json.workflow.name }}`}</code>
                      </div>
                    </div>
                  )}

                  {/* ─── 14. SUB-MODEL NODE PARAMETERS ─── */}
                  {selectedNode.type === 'sub_model' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #00A09D' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A09D' }}>
                        <Sparkles size={18} />
                        <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>LLM Sub-Node Parameters</span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>AI Provider</label>
                        <select
                          value={selectedNode.data.provider || 'Gemini'}
                          onChange={(e) => {
                            const provider = e.target.value;
                            const label = `${provider} Model`;
                            const defaultModel = provider === 'Gemini' ? 'gemini-1.5-pro' : provider === 'OpenAI' ? 'gpt-4o' : provider === 'Claude' ? 'claude-3-5-sonnet' : 'llama3:8b';
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, provider, label, modelId: defaultModel } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="Gemini">Google Gemini</option>
                          <option value="OpenAI">OpenAI</option>
                          <option value="Claude">Anthropic Claude</option>
                          <option value="Ollama">Ollama (Local LLM)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Model Version / ID</label>
                        <select
                          value={selectedNode.data.modelId || 'gemini-1.5-pro'}
                          onChange={(e) => {
                            const modelId = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, modelId } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          {selectedNode.data.provider === 'OpenAI' ? (
                            <>
                              <option value="gpt-4o">gpt-4o (Most Intelligent)</option>
                              <option value="gpt-4o-mini">gpt-4o-mini (Fast & Affordable)</option>
                              <option value="gpt-4-turbo">gpt-4-turbo</option>
                              <option value="o1-preview">o1-preview (Reasoning)</option>
                            </>
                          ) : selectedNode.data.provider === 'Claude' ? (
                            <>
                              <option value="claude-3-5-sonnet">claude-3-5-sonnet (Smartest)</option>
                              <option value="claude-3-haiku">claude-3-haiku (Lightning Fast)</option>
                              <option value="claude-3-opus">claude-3-opus</option>
                            </>
                          ) : selectedNode.data.provider === 'Ollama' ? (
                            <>
                              <option value="llama3:8b">llama3:8b (Local Meta)</option>
                              <option value="mistral:7b">mistral:7b (Local Mistral)</option>
                              <option value="deepseek-r1">deepseek-r1 (Local Reasoning)</option>
                            </>
                          ) : (
                            <>
                              <option value="gemini-1.5-pro">gemini-1.5-pro (Long Context 2M)</option>
                              <option value="gemini-1.5-flash">gemini-1.5-flash (Fast)</option>
                              <option value="gemini-2.0-flash">gemini-2.0-flash (Latest Next Gen)</option>
                            </>
                          )}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Temperature ({selectedNode.data.temperature || 0.7})</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={selectedNode.data.temperature || 0.7}
                          onChange={(e) => {
                            const temperature = parseFloat(e.target.value);
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, temperature } } : n));
                          }}
                          style={{ width: '100%', marginTop: '4px' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* ─── 15. SUB-MEMORY NODE PARAMETERS ─── */}
                  {selectedNode.type === 'sub_memory' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f3e8ff', padding: '14px', borderRadius: '14px', border: '1px solid #8E44AD' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#8E44AD' }}>Chat Memory Settings</div>
                      <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Context Window Size (Messages)</label>
                      <input
                        type="number"
                        placeholder="10"
                        value={selectedNode.data.windowSize || 10}
                        onChange={(e) => {
                          const windowSize = Number(e.target.value);
                          setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, windowSize } } : n));
                        }}
                        style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                      />
                    </div>
                  )}

                  {/* ─── 17. SEND EMAIL (SMTP) NODE PARAMETERS (N8N SPECIFICATION) ─── */}
                  {selectedNode.type === 'send_email' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#fdf2f2', padding: '14px', borderRadius: '14px', border: '1px solid #EA4335' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#EA4335' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Mail size={18} />
                          <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>Send Email (SMTP) Parameters</span>
                        </div>
                        <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fee2e2', fontWeight: 800 }}>n8n Ready</span>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Credential to Connect with</label>
                        <select
                          value={selectedNode.data.credential || 'SMTP_DEFAULT'}
                          onChange={(e) => {
                            const credential = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, credential } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="SMTP_DEFAULT">SMTP Account Credential (smtp.mavi.id:465)</option>
                          <option value="GMAIL_OAUTH2">Gmail OAuth2 Account</option>
                          <option value="CUSTOM_SMTP">Custom External SMTP Server</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Operation</label>
                        <select
                          value={selectedNode.data.operation || 'Send'}
                          onChange={(e) => {
                            const operation = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, operation } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="Send">Send (Send email immediately)</option>
                          <option value="Send and Wait for Response">Send and Wait for Response (Pause workflow for reply)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>From Email</label>
                        <input
                          placeholder="Nathan Doe <nate@mavi.io>"
                          value={selectedNode.data.fromEmail || ''}
                          onChange={(e) => {
                            const fromEmail = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, fromEmail } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>To Email (Comma Separated)</label>
                        <input
                          placeholder="first@sample.com, &quot;Second Name&quot; <second@sample.com>"
                          value={selectedNode.data.toEmail || ''}
                          onChange={(e) => {
                            const toEmail = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, toEmail } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Subject</label>
                        <input
                          placeholder="Work Order Status Update #$json.orderId"
                          value={selectedNode.data.subject || ''}
                          onChange={(e) => {
                            const subject = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, subject } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Email Format</label>
                        <select
                          value={selectedNode.data.format || 'HTML'}
                          onChange={(e) => {
                            const format = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, format } } : n));
                          }}
                          style={{ width: '100%', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                        >
                          <option value="HTML">HTML (Rich HTML Email Body)</option>
                          <option value="Text">Text (Plain Text Only)</option>
                          <option value="Both">Both (Multi-part MIME HTML & Text)</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Email Message Body</label>
                        <textarea
                          placeholder="<p>Halo $json.customer,</p><p>Order <b>#$json.orderId</b> telah selesai diproses.</p>"
                          value={selectedNode.data.body || ''}
                          onChange={(e) => {
                            const body = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, body } } : n));
                          }}
                          style={{ width: '100%', minHeight: '90px', padding: '9px', marginTop: '4px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.78rem' }}
                        />
                      </div>

                      {/* ─── WAITING FOR RESPONSE PARAMETERS ─── */}
                      {selectedNode.data.operation === 'Send and Wait for Response' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px', borderRadius: '10px', backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c2410c' }}>⏳ Wait for Response Settings</div>
                          
                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Response Type</label>
                          <select
                            value={selectedNode.data.responseType || 'Approval'}
                            onChange={(e) => {
                              const responseType = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, responseType } } : n));
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.78rem' }}
                          >
                            <option value="Approval">Approval (Approve / Decline Buttons)</option>
                            <option value="Free Text">Free Text (Submit Text Response)</option>
                            <option value="Custom Form">Custom Form (Interactive Web Form)</option>
                          </select>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>Approve Label</label>
                              <input
                                placeholder="Approve"
                                value={selectedNode.data.approveLabel || 'Approve'}
                                onChange={(e) => {
                                  const approveLabel = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, approveLabel } } : n));
                                }}
                                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                              />
                            </div>
                            <div style={{ flex: 1 }}>
                              <label style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b' }}>Decline Label</label>
                              <input
                                placeholder="Decline"
                                value={selectedNode.data.declineLabel || 'Decline'}
                                onChange={(e) => {
                                  const declineLabel = e.target.value;
                                  setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, declineLabel } } : n));
                                }}
                                style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                              />
                            </div>
                          </div>

                          <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Limit Wait Time (Timeout)</label>
                          <input
                            placeholder="24 Hours"
                            value={selectedNode.data.limitWaitTime || '24 Hours'}
                            onChange={(e) => {
                              const limitWaitTime = e.target.value;
                              setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, limitWaitTime } } : n));
                            }}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '0.78rem' }}
                          />
                        </div>
                      )}

                      {/* ─── NODE OPTIONS (CC, BCC, ATTACHMENTS) ─── */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #fee2e2', paddingTop: '10px' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>Node Options</div>
                        
                        <input
                          placeholder="CC Email (cc@sample.com)"
                          value={selectedNode.data.ccEmail || ''}
                          onChange={(e) => {
                            const ccEmail = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, ccEmail } } : n));
                          }}
                          style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                        />

                        <input
                          placeholder="BCC Email (bcc@sample.com)"
                          value={selectedNode.data.bccEmail || ''}
                          onChange={(e) => {
                            const bccEmail = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, bccEmail } } : n));
                          }}
                          style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                        />

                        <input
                          placeholder="Attachments (e.g. data_attachment, report.pdf)"
                          value={selectedNode.data.attachments || ''}
                          onChange={(e) => {
                            const attachments = e.target.value;
                            setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, attachments } } : n));
                          }}
                          style={{ padding: '7px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── OUTPUT DATA TAB ─── */}
              {inspectorSubTab === 'OUTPUT' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#00A09D', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={15} /> Execution Output Data Preview
                  </div>
                  {selectedNode.data?.lastOutput ? (
                    <pre style={{
                      backgroundColor: '#1E1E2D', color: '#10B981', padding: '12px',
                      borderRadius: '10px', fontSize: '0.72rem', fontFamily: 'monospace',
                      maxHeight: '350px', overflowY: 'auto', border: '1px solid #3B3B54'
                    }}>
                      {JSON.stringify(selectedNode.data.lastOutput, null, 2)}
                    </pre>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '30px 15px', color: '#94a3b8', fontSize: '0.78rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px dashed #cbd5e1' }}>
                      No output recorded yet. Click <b>RUN TEST</b> to execute workflow and view live JSON payload.
                    </div>
                  )}
                </div>
              )}

              {/* ─── CREDENTIALS TAB ─── */}
              {inspectorSubTab === 'CREDENTIALS' && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#4F46E5', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={16} /> Credential & Security Context
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#475569' }}>
                    Credentials and API Keys are securely managed via global <b>AI Settings</b> and <b>Webhook Integration Manager</b>.
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 800, backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                    ✓ Primary AI Connector Active & Verified
                  </div>
                </div>
              )}

              {selectedNode.id !== 'start-node' && (
                <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
                  <button
                    onClick={() => {
                      deleteNode(selectedNode.id);
                      setSelectedNode(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px',
                      backgroundColor: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fca5a5',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <Trash2 size={16} /> Delete Node
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8', fontSize: '0.8rem' }}>
              <Settings2 size={40} style={{ marginBottom: '10px', opacity: 0.3 }} />
              <p>Select a node on the canvas to edit its properties.</p>
            </div>
          )
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px', overflowY: 'auto' }}>
            {currentAuto?.history && currentAuto.history.length > 0 ? (
              currentAuto.history.map((version, idx) => (
                <div key={idx} style={{
                  padding: '12px',
                  backgroundColor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>v{version.version}</span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{new Date(version.publishedAt).toLocaleDateString()}</span>
                  </div>
                  <button
                    onClick={() => handleRestore(version)}
                    style={{
                      width: '100%',
                      padding: '6px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      color: '#714B67',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >Restore</button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                <History size={40} style={{ marginBottom: '12px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '0.8rem' }}>No publication history yet.</p>
              </div>
            )}
          </div>
        )}

        {menu && (
          <div style={{
            position: 'fixed',
            top: menu.top,
            left: menu.left,
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            padding: '6px',
            zIndex: 1000,
            minWidth: '160px'
          }}>
            {menu.type === 'node' ? (
              <>
                <button
                  onClick={() => copyNode(menu.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', color: '#1e293b' }}
                >
                  <Copy size={14} /> Copy
                </button>
                <button
                  onClick={() => duplicateNode(menu.id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', color: '#1e293b' }}
                >
                  <Layers size={14} /> Duplicate
                </button>
                {menu.id !== 'start-node' && (
                  <button
                    onClick={() => deleteNode(menu.id)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '4px', fontSize: '0.8rem', color: '#ef4444' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={pasteNode}
                disabled={!clipboard}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: 'none', background: 'none', cursor: clipboard ? 'pointer' : 'not-allowed', borderRadius: '4px', fontSize: '0.8rem', color: clipboard ? '#1e293b' : '#94a3b8' }}
              >
                <ClipboardPaste size={14} /> Paste Node
              </button>
            )}
          </div>
        )}

        {isManagerOpen && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}>
            <div style={{
              width: '840px',
              maxWidth: '90vw',
              height: '620px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#714B67' }}>Automation Workflows</h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Load, manage and organize your automation pipelines</p>
                </div>
                <button
                  onClick={() => setIsManagerOpen(false)}
                  style={{ background: '#e2e8f0', border: 'none', color: '#64748b', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                ><X size={18} /></button>
              </div>

              <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid #e2e8f0', padding: '0 24px', backgroundColor: '#ffffff' }}>
                <button
                  onClick={() => setManagerTab('saved')}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    borderBottom: managerTab === 'saved' ? '3px solid #714B67' : '3px solid transparent',
                    color: managerTab === 'saved' ? '#714B67' : '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >My Workflows</button>
                <button
                  onClick={() => setManagerTab('templates')}
                  style={{
                    padding: '12px 16px',
                    border: 'none',
                    background: 'none',
                    borderBottom: managerTab === 'templates' ? '3px solid #714B67' : '3px solid transparent',
                    color: managerTab === 'templates' ? '#714B67' : '#64748b',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >Workflow Templates</button>
              </div>

              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: '#f8fafc' }}>
                {managerTab === 'saved' ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: '16px' }}>
                    <div
                      onClick={handleNewAutomation}
                      style={{
                        height: '140px',
                        border: '2px dashed #cbd5e1',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#714B67';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <Plus size={24} color="#714B67" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#714B67' }}>Create Workflow</span>
                    </div>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        height: '140px',
                        border: '2px dashed #00A09D',
                        borderRadius: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: 'pointer',
                        backgroundColor: '#ffffff',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = '#00A09D';
                        e.currentTarget.style.backgroundColor = '#f0fdfa';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#00A09D';
                        e.currentTarget.style.backgroundColor = '#ffffff';
                      }}
                    >
                      <Upload size={24} color="#00A09D" />
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00A09D' }}>Import JSON</span>
                    </div>

                    {automations.map(auto => (
                      <div
                        key={auto.id}
                        style={{
                          height: '140px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                        }}
                        onClick={() => loadAutomation(auto)}
                      >
                        <div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>{auto.name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            Edited: {auto.development?.updatedAt ? new Date(auto.development.updatedAt).toLocaleDateString() : 'Draft'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.65rem', fontWeight: 800, backgroundColor: '#e6f7f7', color: '#00A09D', padding: '2px 8px', borderRadius: '4px' }}>
                            {auto.published ? `v${auto.published.version}` : 'DRAFT'}
                          </span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportWorkflow(auto);
                              }}
                              title="Export Workflow JSON"
                              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                            ><Download size={14} /></button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteAutomation(auto.id);
                              }}
                              title="Delete Workflow"
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            ><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                    {AUTOMATION_TEMPLATES.map(tmpl => (
                      <div
                        key={tmpl.id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          minHeight: '190px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.03)'
                        }}
                      >
                        <div>
                          <span style={{
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            backgroundColor: '#f1f5f9',
                            color: '#714B67',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            border: '1px solid #cbd5e1'
                          }}>{tmpl.category}</span>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', margin: '10px 0 6px 0' }}>{tmpl.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{tmpl.description}</div>
                        </div>
                        <button
                          onClick={() => handleCreateFromTemplate(tmpl)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#714B67',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '10px',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            marginTop: '12px',
                            boxShadow: '0 4px 10px rgba(113, 75, 103, 0.3)'
                          }}
                        >Use Template</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Copilot Modal */}
        {isAiModalOpen && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000 }}>
            <div style={{ width: '560px', backgroundColor: '#1E1E2D', borderRadius: '20px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden', border: '1px solid #3B3B54' }}>
              <div style={{ padding: '20px 24px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={22} />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>AI Automation Flow Generator</h3>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Tulis aturan / alur otomasi dalam bahasa alami</div>
                  </div>
                </div>
                <button onClick={() => setIsAiModalOpen(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} />
                </button>
              </div>
              <div style={{ padding: '24px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#A2A0B8', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                  Prompt / Deskripsi Otomasi
                </label>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Contoh: Buatkan otomasi jika stok barang < 10 pada tabel inventory, kirim notifikasi warning ke operator..."
                  rows={4}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #3B3B54', backgroundColor: '#151521', color: '#ffffff', fontSize: '0.85rem', marginBottom: '16px', outline: 'none', resize: 'vertical' }}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                  <button
                    onClick={() => setAiPrompt('Buatkan otomasi jika suhu mesin > 80°C, kirim notifikasi bahaya dan matikan status mesin')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#2B2B40', border: '1px solid #3B3B54', borderRadius: '20px', color: '#A2A0B8', cursor: 'pointer' }}
                  >
                    💡 Alert Suhu Tinggi
                  </button>
                  <button
                    onClick={() => setAiPrompt('Buatkan otomasi saat ada record baru di tabel QC dengan status FAIL, kirim alert notifikasi')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#2B2B40', border: '1px solid #3B3B54', borderRadius: '20px', color: '#A2A0B8', cursor: 'pointer' }}
                  >
                    💡 QC Defect Alert
                  </button>
                  <button
                    onClick={() => setAiPrompt('Buatkan otomasi timer setiap 60 menit untuk cek jumlah total barang terproduksi')}
                    style={{ padding: '6px 12px', fontSize: '0.75rem', backgroundColor: '#2B2B40', border: '1px solid #3B3B54', borderRadius: '20px', color: '#A2A0B8', cursor: 'pointer' }}
                  >
                    💡 Timer Audit Berkala
                  </button>
                </div>
                <button
                  onClick={handleGenerateAiAutomation}
                  disabled={isAiGenerating || !aiPrompt.trim()}
                  style={{
                    width: '100%', padding: '14px', background: 'linear-gradient(135deg, #a855f7, #6366f1)', color: 'white',
                    border: 'none', borderRadius: '12px', fontWeight: 800, cursor: isAiGenerating ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    opacity: (!aiPrompt.trim() || isAiGenerating) ? 0.6 : 1
                  }}
                >
                  {isAiGenerating ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  {isAiGenerating ? 'Generasi Otomasi AI...' : 'Buat Otomasi dengan AI'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const WrappedAutomationEditor = (props) => (
  <ReactFlowProvider>
    <AutomationEditor {...props} />
  </ReactFlowProvider>
);

export default WrappedAutomationEditor;
