/**
 * Automation Data Nodes
 * New node types: JSON Parse, Transform, Template, Delay
 *
 * Part of Phase 2: Advanced Features
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Hash, FileJson, Type, Clock, ArrowRightLeft } from 'lucide-react';

// =====================================================
// JSON PARSE NODE
// =====================================================

export const JSONParseNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '62px', height: '62px', borderRadius: '18px',
            backgroundColor: '#6366f1',
            border: `3px solid ${selected ? '#ffffff' : '#4f46e5'}`,
            boxShadow: selected ? '0 0 24px rgba(99, 102, 241, 0.8)' : '0 8px 18px rgba(99, 102, 241, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff'
        }}>
            <Handle type="target" position={Position.Left} style={{
                width: '12px', height: '12px', background: '#6366f1', border: '2px solid white', left: '-6px'
            }} />
            <FileJson size={28} />
            <Handle type="source" position={Position.Right} style={{
                width: '12px', height: '12px', background: '#6366f1', border: '2px solid white', right: '-6px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'JSON Parse'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase' }}>
                Parse String → JSON
            </div>
        </div>
    </div>
);

// =====================================================
// JSON TRANSFORM NODE
// =====================================================

export const JSONTransformNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '62px', height: '62px', borderRadius: '18px',
            backgroundColor: '#8b5cf6',
            border: `3px solid ${selected ? '#ffffff' : '#7c3aed'}`,
            boxShadow: selected ? '0 0 24px rgba(139, 92, 246, 0.8)' : '0 8px 18px rgba(139, 92, 246, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff'
        }}>
            <Handle type="target" position={Position.Left} style={{
                width: '12px', height: '12px', background: '#8b5cf6', border: '2px solid white', left: '-6px'
            }} />
            <ArrowRightLeft size={28} />
            <Handle type="source" position={Position.Right} style={{
                width: '12px', height: '12px', background: '#8b5cf6', border: '2px solid white', right: '-6px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'Transform'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase' }}>
                Map JSON Keys
            </div>
        </div>
    </div>
);

// =====================================================
// TEMPLATE NODE
// =====================================================

export const TemplateNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '62px', height: '62px', borderRadius: '18px',
            backgroundColor: '#06b6d4',
            border: `3px solid ${selected ? '#ffffff' : '#0891b2'}`,
            boxShadow: selected ? '0 0 24px rgba(6, 182, 212, 0.8)' : '0 8px 18px rgba(6, 182, 212, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff'
        }}>
            <Handle type="target" position={Position.Left} style={{
                width: '12px', height: '12px', background: '#06b6d4', border: '2px solid white', left: '-6px'
            }} />
            <Type size={28} />
            <Handle type="source" position={Position.Right} style={{
                width: '12px', height: '12px', background: '#06b6d4', border: '2px solid white', right: '-6px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'Template'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase' }}>
                String Interpolation
            </div>
        </div>
    </div>
);

// =====================================================
// DELAY / WAIT NODE
// =====================================================

export const DelayNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '62px', height: '62px', borderRadius: '18px',
            backgroundColor: '#f59e0b',
            border: `3px solid ${selected ? '#ffffff' : '#d97706'}`,
            boxShadow: selected ? '0 0 24px rgba(245, 158, 11, 0.8)' : '0 8px 18px rgba(245, 158, 11, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff'
        }}>
            <Handle type="target" position={Position.Left} style={{
                width: '12px', height: '12px', background: '#f59e0b', border: '2px solid white', left: '-6px'
            }} />
            <Clock size={28} />
            <Handle type="source" position={Position.Right} style={{
                width: '12px', height: '12px', background: '#f59e0b', border: '2px solid white', right: '-6px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'Delay'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase' }}>
                Wait {data.duration || 5}s
            </div>
        </div>
    </div>
);

// =====================================================
// FORK NODE (Parallel)
// =====================================================

export const ForkNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            backgroundColor: '#ec4899',
            border: `3px solid ${selected ? '#ffffff' : '#db2777'}`,
            boxShadow: selected ? '0 0 24px rgba(236, 72, 153, 0.8)' : '0 8px 18px rgba(236, 72, 153, 0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', position: 'relative'
        }}>
            <Handle type="target" position={Position.Left} style={{
                width: '10px', height: '10px', background: '#ec4899', border: '2px solid white', left: '-5px'
            }} />

            <div style={{ fontSize: '10px', fontWeight: 800, marginBottom: '2px' }}>FORK</div>
            <div style={{ fontSize: '14px' }}>⤵</div>

            {/* Multiple outputs */}
            <Handle type="source" position={Position.Right} id="branch1" style={{
                top: '20%', width: '10px', height: '10px', background: '#10b981', border: '2px solid white', right: '-5px'
            }} />
            <Handle type="source" position={Position.Right} id="branch2" style={{
                top: '50%', width: '10px', height: '10px', background: '#3b82f6', border: '2px solid white', right: '-5px'
            }} />
            <Handle type="source" position={Position.Right} id="branch3" style={{
                top: '80%', width: '10px', height: '10px', background: '#8b5cf6', border: '2px solid white', right: '-5px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'Fork'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#ec4899', textTransform: 'uppercase' }}>
                Parallel Branches
            </div>
        </div>
    </div>
);

// =====================================================
// JOIN NODE
// =====================================================

export const JoinNode = ({ data, selected }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{
            width: '72px', height: '72px', borderRadius: '18px',
            backgroundColor: '#14b8a6',
            border: `3px solid ${selected ? '#ffffff' : '#0d9488'}`,
            boxShadow: selected ? '0 0 24px rgba(20, 184, 166, 0.8)' : '0 8px 18px rgba(20, 184, 166, 0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: '#ffffff', position: 'relative'
        }}>
            {/* Multiple inputs */}
            <Handle type="target" position={Position.Left} id="input1" style={{
                top: '20%', width: '10px', height: '10px', background: '#14b8a6', border: '2px solid white', left: '-5px'
            }} />
            <Handle type="target" position={Position.Left} id="input2" style={{
                top: '50%', width: '10px', height: '10px', background: '#14b8a6', border: '2px solid white', left: '-5px'
            }} />
            <Handle type="target" position={Position.Left} id="input3" style={{
                top: '80%', width: '10px', height: '10px', background: '#14b8a6', border: '2px solid white', left: '-5px'
            }} />

            <div style={{ fontSize: '10px', fontWeight: 800, marginBottom: '2px' }}>JOIN</div>
            <div style={{ fontSize: '14px' }}>⤴</div>

            <Handle type="source" position={Position.Right} style={{
                width: '10px', height: '10px', background: '#14b8a6', border: '2px solid white', right: '-5px'
            }} />
        </div>
        <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b' }}>
                {data.label || 'Join'}
            </div>
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#14b8a6', textTransform: 'uppercase' }}>
                Wait All Branches
            </div>
        </div>
    </div>
);

// =====================================================
// NODE TYPES REGISTRY
// =====================================================

export const dataNodeTypes = {
    json_parse: JSONParseNode,
    json_transform: JSONTransformNode,
    template: TemplateNode,
    delay: DelayNode,
    fork: ForkNode,
    join: JoinNode
};

// =====================================================
// NODE DEFINITIONS FOR SIDEBAR
// =====================================================

export const dataNodeDefinitions = [
    {
        category: 'data',
        label: 'Data Operations',
        icon: FileJson,
        color: '#6366f1',
        nodes: [
            { type: 'json_parse', label: 'JSON Parse', icon: FileJson, data: { label: 'Parse JSON', type: 'json_parse' } },
            { type: 'json_transform', label: 'JSON Transform', icon: ArrowRightLeft, data: { label: 'Transform', type: 'json_transform' } },
            { type: 'template', label: 'Template String', icon: Type, data: { label: 'Template', type: 'template' } },
            { type: 'delay', label: 'Delay / Wait', icon: Clock, data: { label: 'Wait 5s', type: 'delay', duration: 5 } },
        ]
    },
    {
        category: 'parallel',
        label: 'Parallel Execution',
        icon: Hash,
        color: '#ec4899',
        nodes: [
            { type: 'fork', label: 'Fork (Parallel)', icon: Hash, data: { label: 'Fork Branches', type: 'fork', branches: 3 } },
            { type: 'join', label: 'Join (Wait All)', icon: Hash, data: { label: 'Join Branches', type: 'join' } },
        ]
    }
];

export default {
    JSONParseNode,
    JSONTransformNode,
    TemplateNode,
    DelayNode,
    ForkNode,
    JoinNode,
    dataNodeTypes,
    dataNodeDefinitions
};
