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
  updateEdge
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
  Square
} from 'lucide-react';

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
  error_trigger: ErrorTriggerNode
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
    if (!node.position || typeof node.position.x !== 'number' || typeof node.position.y !== 'number') {
      return {
        ...node,
        position: {
          x: typeof node.position?.x === 'number' ? node.position.x : (index * 200 + 80),
          y: typeof node.position?.y === 'number' ? node.position.y : 180
        }
      };
    }
    return node;
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

  const edgeUpdateSuccessful = useRef(true);
  const reactFlowWrapper = useRef(null);
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

  const onConnect = useCallback((params) => setEdges((eds) => addEdge({
    ...params,
    type: 'smoothstep',
    animated: true,
    style: {
      stroke: params.sourceHandle === 'model' ? '#38bdf8' :
        params.sourceHandle === 'memory' ? '#c084fc' :
        params.sourceHandle === 'tools' ? '#34d399' :
        params.sourceHandle === 'yes' ? '#00A09D' :
        params.sourceHandle === 'no' ? '#ef4444' : '#714B67',
      strokeWidth: 2.5,
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
      <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', color: '#1e293b' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', backgroundColor: '#714B67', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={15} color="white" />
            </div>
            <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: '#714B67', letterSpacing: '0.3px' }}>Workflow Node Palette</h3>
          </div>

          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search workflow nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 10px 7px 30px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                color: '#1e293b',
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
                        backgroundColor: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#334155',
                        cursor: 'grab',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = cat.color;
                        e.currentTarget.style.backgroundColor = '#ffffff';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = `0 4px 12px ${cat.color}25`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = '#e2e8f0';
                        e.currentTarget.style.backgroundColor = '#f8fafc';
                        e.currentTarget.style.transform = 'none';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
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
              <div style={{ fontSize: '0.68rem', color: '#00A09D', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                Workflow Automation Builder / {automationName}
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
        <div style={{ flex: 1, position: 'relative', backgroundColor: '#F8FAFC' }} ref={reactFlowWrapper}>
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
            fitView
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
              style: { stroke: '#714B67', strokeWidth: 2.5 }
            }}
          >
            <Background color="#CBD5E1" variant="dots" gap={24} size={1.5} />
            <Controls style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', fill: '#1e293b', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
            <MiniMap nodeColor={() => '#714B67'} maskColor="rgba(248, 250, 252, 0.7)" style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1' }} />

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
                  { icon: Clock, label: 'When timer fires...', sub: 'Schedule recurring tasks', triggerType: 'TIMER' },
                  { icon: Database, label: 'When record is created...', sub: 'React to new rows', triggerType: 'TABLE_ROW_ADDED' },
                  { icon: Database, label: 'When record is updated...', sub: 'React to field changes', triggerType: 'TABLE_ROW_UPDATED' },
                  { icon: Cpu, label: 'When machine outputs...', sub: 'Respond to IoT data', triggerType: 'MACHINE_TRIGGER' },
                  { icon: Link2, label: 'When connector finishes...', sub: 'Trigger on API callback', triggerType: 'CONNECTOR_TRIGGER' },
                  { icon: Car, label: 'When OBD2 engine data...', sub: 'React to vehicle sensors', triggerType: 'OBD2_TRIGGER' }
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

      <div style={{ width: '380px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('EDIT')}
            style={{
              flex: 1, padding: '14px', border: 'none', background: 'none',
              borderBottom: activeTab === 'EDIT' ? '3px solid #714B67' : 'none',
              color: activeTab === 'EDIT' ? '#714B67' : '#64748b',
              fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer'
            }}
          >Element Logic & AI</button>
          <button
            onClick={() => setActiveTab('HISTORY')}
            style={{
              flex: 1, padding: '14px', border: 'none', background: 'none',
              borderBottom: activeTab === 'HISTORY' ? '3px solid #714B67' : 'none',
              color: activeTab === 'HISTORY' ? '#714B67' : '#64748b',
              fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer'
            }}
          >Version History</button>
        </div>

        {activeTab === 'EDIT' ? (
          selectedNode ? (
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#714B67' }}>
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Node Config</h3>
                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{selectedNode.type.toUpperCase()} / {selectedNode.id}</div>
                  </div>
                </div>
                <button onClick={() => setSelectedNode(null)} style={{ background: '#f1f5f9', border: 'none', color: '#64748b', width: '30px', height: '30px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={16} /></button>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                  <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Label</label>
                  <input
                    value={selectedNode.data.label || ''}
                    onChange={(e) => {
                      const label = e.target.value;
                      setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, label } } : n));
                    }}
                    style={{ width: '100%', padding: '9px', marginTop: '6px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                  />
                </div>

                {/* ─── AI AGENT NODE CONFIGURATION ─── */}
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

                    <div style={{ backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>Docked Sub-Nodes Status:</div>
                      {(() => {
                        const sub = getConnectedSubNodes(selectedNode.id);
                        return (
                          <div style={{ fontSize: '0.72rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ color: '#0284c7' }}>🔵 Model: {sub.model.length > 0 ? sub.model.map(m => m.data.label).join(', ') : 'Default LLM'}</div>
                            <div style={{ color: '#8E44AD' }}>🟣 Memory: {sub.memory.length > 0 ? sub.memory.map(m => m.data.label).join(', ') : 'None'}</div>
                            <div style={{ color: '#00A09D' }}>🟢 Tools: {sub.tools.length > 0 ? sub.tools.map(t => t.data.label).join(', ') : 'None'}</div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* ─── SUB-MODEL NODE CONFIGURATION ─── */}
                {selectedNode.type === 'sub_model' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '14px', border: '1px solid #00A09D' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00A09D' }}>
                      <Sparkles size={18} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 800 }}>LLM Model Sub-Node Settings</span>
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

                {selectedNode.type === 'code' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Code Snippet (JS / Python)</label>
                    <textarea
                      placeholder="return items.map(item => { item.json.total = item.json.qty * item.json.price; return item; });"
                      value={selectedNode.data.code || ''}
                      onChange={(e) => {
                        const code = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, code } } : n));
                      }}
                      style={{ minHeight: '120px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#10B981', fontFamily: 'monospace', fontSize: '0.78rem' }}
                    />
                  </div>
                )}

                {selectedNode.type === 'wait' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pause Duration</label>
                    <input
                      placeholder="e.g. 3 Days, 5 Minutes, 1 Hour"
                      value={selectedNode.data.duration || ''}
                      onChange={(e) => {
                        const duration = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, duration } } : n));
                      }}
                      style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                    />
                  </div>
                )}

                {selectedNode.type === 'decision' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Condition (IF)</label>
                    <input
                      placeholder="Field (e.g. Stock)"
                      value={selectedNode.data.condition?.field || ''}
                      onChange={(e) => {
                        const field = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, condition: { ...n.data.condition, field } } } : n));
                      }}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                    />
                    <select
                      value={selectedNode.data.condition?.operator || '=='}
                      onChange={(e) => {
                        const operator = e.target.value;
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, condition: { ...n.data.condition, operator } } } : n));
                      }}
                      style={{ padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                    >
                      <option value="==">equals</option>
                      <option value="!=">not equals</option>
                      <option value="<">less than</option>
                      <option value=">">greater than</option>
                      <option value=">=">greater than or equal (&gt;=)</option>
                      <option value="contains">contains</option>
                    </select>
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

                {selectedNode.type === 'error_trigger' && (
                  <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#ef4444', fontSize: '0.78rem' }}>
                    <div style={{ fontWeight: 800, marginBottom: '4px' }}>🛡️ Error Fallback Route</div>
                    Automatically catches exceptions from any node step and routes execution to connected fallback actions.
                  </div>
                )}

                {selectedNode.type === 'action' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <label style={{ fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Action Type</label>
                    <select
                      value={selectedNode.data.type || 'LOG_MESSAGE'}
                      onChange={(e) => {
                        const type = e.target.value;
                        const label = type === 'UPDATE_RECORD' ? 'Update Table' :
                          type === 'CREATE_RECORD' ? 'Create Record' :
                          type === 'WHATSAPP' ? 'WhatsApp Alert' :
                          type === 'MQTT_PUBLISH' ? 'Publish MQTT' : 'Log Message';
                        setNodes(nds => nds.map(n => n.id === selectedNode.id ? { ...n, data: { ...n.data, type, label } } : n));
                      }}
                      style={{ padding: '9px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#1e293b', fontSize: '0.8rem' }}
                    >
                      <option value="LOG_MESSAGE">Log Message</option>
                      <option value="UPDATE_RECORD">Update Table Record</option>
                      <option value="CREATE_RECORD">Create Table Record</option>
                      <option value="HTTP_REQUEST">HTTP Connector (API)</option>
                      <option value="WHATSAPP">WhatsApp Business API Alert</option>
                      <option value="MQTT_PUBLISH">MQTT Publish Command</option>
                      <option value="SEND_NOTIFICATION">Send Notification</option>
                      <option value="TELEGRAM">Telegram Message</option>
                      <option value="GMAIL">Gmail Email</option>
                      <option value="SPREADSHEET">Google Sheets / Excel</option>
                      <option value="ERP_CRM">Odoo / SAP ERP</option>
                    </select>
                  </div>
                )}

                {selectedNode.type === 'event' && (
                  <button
                    onClick={() => setShowEventPicker(true)}
                    style={{ padding: '10px', backgroundColor: '#714B67', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                  >Change Event Type</button>
                )}
              </div>

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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAutomation(auto.id);
                            }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                          ><Trash2 size={14} /></button>
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
