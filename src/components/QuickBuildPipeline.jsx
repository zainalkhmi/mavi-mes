import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, 
    Plus, 
    Trash2, 
    Settings, 
    Save, 
    Folder, 
    Sparkles, 
    HelpCircle, 
    ChevronRight, 
    Check, 
    X,
    Activity,
    Sliders,
    Zap,
    Download,
    Eye,
    RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';

// Default templates to choose from
const TEMPLATES = [
    {
        name: 'Flange Connector Check',
        description: 'Locate a flange metal component, verify center bore diameter, and check for surface scratches.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Frame', x: 50, y: 180, params: { camera: 'Main Inspection Camera', trigger: 'PLC Continuous' }, outputs: ['image'], status: 'idle', value: null },
            { id: 'n_loc', type: 'locate', name: 'Geometric Align', x: 230, y: 180, params: { template: 'flange_rim_align', angleTolerance: 15, scoreThreshold: 85 }, inputs: ['image'], outputs: ['offset'], status: 'idle', value: null },
            { id: 'n_meas', type: 'measure', name: 'Bore Caliper', x: 430, y: 100, params: { tool: 'Caliper Edge-to-Edge', nominalSize: '25.0 mm', lsl: '24.9', usl: '25.1' }, inputs: ['image', 'offset'], outputs: ['dimension'], status: 'idle', value: null },
            { id: 'n_ins', type: 'inspect', name: 'Scratch Detect', x: 430, y: 260, params: { mode: 'Anomaly Segmentation', thresholdArea: 50 }, inputs: ['image', 'offset'], outputs: ['defects'], status: 'idle', value: null },
            { id: 'n_dec', type: 'decide', name: 'Yield Judge', x: 650, y: 180, params: { minPassedScore: 90, failAction: 'Trigger Alert Light' }, inputs: ['dimension', 'defects'], outputs: ['status'], status: 'idle', value: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_loc', toPin: 'image' },
            { id: 'l2', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_meas', toPin: 'image' },
            { id: 'l3', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_ins', toPin: 'image' },
            { id: 'l4', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_meas', toPin: 'offset' },
            { id: 'l5', fromNode: 'n_loc', fromPin: 'offset', toNode: 'n_ins', toPin: 'offset' },
            { id: 'l6', fromNode: 'n_meas', fromPin: 'dimension', toNode: 'n_dec', toPin: 'dimension' },
            { id: 'l7', fromNode: 'n_ins', fromPin: 'defects', toNode: 'n_dec', toPin: 'defects' }
        ]
    },
    {
        name: 'Lot Expiry OCR & OCV Verify',
        description: 'Read expiry details printed on product packaging and verify details against active batch ID.',
        nodes: [
            { id: 'n_acq', type: 'acquire', name: 'Acquire Packaging', x: 80, y: 180, params: { camera: 'Packaging Line Camera', trigger: 'Sensor Trigger' }, outputs: ['image'], status: 'idle', value: null },
            { id: 'n_ocr', type: 'inspect', name: 'Tesseract OCR', x: 300, y: 180, params: { mode: 'OCR Reading', language: 'English', matchPattern: 'EXP:\\s*\\d{2}/\\d{2}' }, inputs: ['image'], outputs: ['text'], status: 'idle', value: null },
            { id: 'n_ocv', type: 'inspect', name: 'OCV Validator', x: 500, y: 180, params: { mode: 'OCV Verification', referenceSource: 'Variable: Active_Batch_Code', similarityThreshold: 85 }, inputs: ['text'], outputs: ['matchStatus'], status: 'idle', value: null },
            { id: 'n_dec', type: 'decide', name: 'PLC Reject Control', x: 700, y: 180, params: { minPassedScore: 100, failAction: 'Activate Reject Arm' }, inputs: ['matchStatus'], outputs: ['status'], status: 'idle', value: null }
        ],
        links: [
            { id: 'l1', fromNode: 'n_acq', fromPin: 'image', toNode: 'n_ocr', toPin: 'image' },
            { id: 'l2', fromNode: 'n_ocr', fromPin: 'text', toNode: 'n_ocv', toPin: 'text' },
            { id: 'l3', fromNode: 'n_ocv', fromPin: 'matchStatus', toNode: 'n_dec', toPin: 'matchStatus' }
        ]
    }
];

const NODE_TYPES = {
    acquire: { color: '#3b82f6', icon: '📷', label: 'Acquire Block', desc: 'Manage camera feeds & frames' },
    locate: { color: '#06b6d4', icon: '🎯', label: 'Locate Block', desc: 'Pattern matching & alignment' },
    measure: { color: '#14b8a6', icon: '📏', label: 'Measure Block', desc: 'Sub-pixel caliper & dimensions' },
    inspect: { color: '#ec4899', icon: '🔬', label: 'Inspect Block', desc: 'OCR, OCV, barcode, or anomaly check' },
    decide: { color: '#f59e0b', icon: '⚡', label: 'Decide Block', desc: 'Pass/Fail logic rules & outputs' }
};

export default function QuickBuildPipeline({ appVariables = [] }) {
    const [nodes, setNodes] = useState(TEMPLATES[0].nodes);
    const [links, setLinks] = useState(TEMPLATES[0].links);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [activeTemplateIndex, setActiveTemplateIndex] = useState(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [simStepIndex, setSimStepIndex] = useState(-1);
    
    // UI dragging states
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const canvasRef = useRef(null);

    // Active linking state
    const [activeLinkStart, setActiveLinkStart] = useState(null); // { nodeId, pinName, type: 'input'|'output' }

    // Load template
    const handleLoadTemplate = (index) => {
        setActiveTemplateIndex(index);
        setNodes(JSON.parse(JSON.stringify(TEMPLATES[index].nodes)));
        setLinks(JSON.parse(JSON.stringify(TEMPLATES[index].links)));
        setSelectedNodeId(null);
        setSimStepIndex(-1);
        setIsSimulating(false);
        toast.success(`Loaded template: "${TEMPLATES[index].name}"`);
    };

    // Node parameter changes
    const updateNodeParam = (nodeId, paramKey, value) => {
        setNodes(prev => prev.map(n => {
            if (n.id === nodeId) {
                return {
                    ...n,
                    params: {
                        ...n.params,
                        [paramKey]: value
                    }
                };
            }
            return n;
        }));
    };

    // Spawn new node on canvas
    const handleAddNode = (type) => {
        const id = `node_${Date.now()}`;
        const newObj = {
            id,
            type,
            name: `New ${NODE_TYPES[type].label}`,
            x: 100 + Math.random() * 100,
            y: 100 + Math.random() * 100,
            params: type === 'acquire' ? { camera: 'Default IP Camera', trigger: 'Continuous' }
                : type === 'locate' ? { template: 'Reference_Template', angleTolerance: 10, scoreThreshold: 80 }
                : type === 'measure' ? { tool: 'Caliper Edge-to-Edge', nominalSize: '10.0 mm', lsl: '9.8', usl: '10.2' }
                : type === 'inspect' ? { mode: 'OCR Reading', language: 'English', matchPattern: '.*' }
                : { minPassedScore: 95, failAction: 'Stop conveyor' },
            inputs: type === 'acquire' ? [] : type === 'decide' ? ['dimension', 'defects'] : ['image'],
            outputs: type === 'acquire' ? ['image'] : type === 'locate' ? ['offset'] : type === 'measure' ? ['dimension'] : type === 'inspect' ? ['text'] : ['status'],
            status: 'idle',
            value: null
        };
        setNodes(prev => [...prev, newObj]);
        setSelectedNodeId(id);
        toast.success(`Created node: "${newObj.name}"`);
    };

    // Delete selected node
    const handleDeleteNode = (nodeId) => {
        setNodes(prev => prev.filter(n => n.id !== nodeId));
        setLinks(prev => prev.filter(l => l.fromNode !== nodeId && l.toNode !== nodeId));
        if (selectedNodeId === nodeId) {
            setSelectedNodeId(null);
        }
        toast.error('Removed node and linked connections.');
    };

    // Node Drag Handlers
    const handleNodeMouseDown = (e, nodeId) => {
        if (e.target.closest('.pin-connector')) return; // ignore pin clicks
        setDraggingNodeId(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            dragOffset.current = {
                x: e.clientX - node.x,
                y: e.clientY - node.y
            };
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (draggingNodeId) {
            const rect = canvasRef.current.getBoundingClientRect();
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;
            
            // Constrain to canvas boundaries
            newX = Math.max(10, Math.min(rect.width - 200, newX));
            newY = Math.max(10, Math.min(rect.height - 120, newY));

            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNodeId(null);
    };

    // Linking pins
    const handlePinClick = (e, nodeId, pinName, type) => {
        e.stopPropagation();
        if (!activeLinkStart) {
            setActiveLinkStart({ nodeId, pinName, type });
        } else {
            // Check linking constraint (must link output -> input)
            if (activeLinkStart.type === type) {
                toast.error('Cannot connect output-to-output or input-to-input.');
                setActiveLinkStart(null);
                return;
            }
            if (activeLinkStart.nodeId === nodeId) {
                toast.error('Cannot connect a node to itself.');
                setActiveLinkStart(null);
                return;
            }

            const fromNode = type === 'input' ? activeLinkStart.nodeId : nodeId;
            const fromPin = type === 'input' ? activeLinkStart.pinName : pinName;
            const toNode = type === 'input' ? nodeId : activeLinkStart.nodeId;
            const toPin = type === 'input' ? pinName : activeLinkStart.pinName;

            // Check if link already exists
            const duplicate = links.find(l => l.fromNode === fromNode && l.fromPin === fromPin && l.toNode === toNode && l.toPin === toPin);
            if (duplicate) {
                setActiveLinkStart(null);
                return;
            }

            const newLink = {
                id: `link_${Date.now()}`,
                fromNode,
                fromPin,
                toNode,
                toPin
            };

            setLinks(prev => [...prev, newLink]);
            setActiveLinkStart(null);
            toast.success('Nodes connected successfully.');
        }
    };

    // Remove a connection wire
    const handleRemoveLink = (linkId) => {
        setLinks(prev => prev.filter(l => l.id !== linkId));
        toast.error('Link disconnected.');
    };

    // Run execution simulation
    const handleRunSimulation = () => {
        if (isSimulating) return;
        setIsSimulating(true);
        setSimStepIndex(0);
        
        // Reset all nodes status
        setNodes(prev => prev.map(n => ({ ...n, status: 'idle', value: null })));
    };

    useEffect(() => {
        if (isSimulating && simStepIndex >= 0 && simStepIndex < nodes.length) {
            const timer = setTimeout(() => {
                const updatedNodes = [...nodes];
                const currentNode = updatedNodes[simStepIndex];
                
                // Simulate output values depending on block type
                let simVal = '';
                let passed = true;

                if (currentNode.type === 'acquire') {
                    simVal = 'Frame Captured (2048x1536)';
                } else if (currentNode.type === 'locate') {
                    simVal = 'Match: 92.4% (X: +12px, Y: -4px)';
                } else if (currentNode.type === 'measure') {
                    simVal = 'Bore: 25.02 mm [PASS]';
                } else if (currentNode.type === 'inspect') {
                    if (currentNode.params.mode === 'OCV Verification') {
                        simVal = 'OCV: Match 100% [LOT-8924A]';
                    } else if (currentNode.params.mode === 'Anomaly Segmentation') {
                        simVal = 'Scratch Area: 12px² [PASS]';
                    } else {
                        simVal = 'OCR EXP: 12/28 [MATCH]';
                    }
                } else if (currentNode.type === 'decide') {
                    simVal = 'PIPELINE PASS';
                }

                currentNode.status = passed ? 'success' : 'failed';
                currentNode.value = simVal;

                setNodes(updatedNodes);
                setSimStepIndex(prev => prev + 1);
            }, 1200);
            return () => clearTimeout(timer);
        } else if (simStepIndex >= nodes.length) {
            setIsSimulating(false);
            setSimStepIndex(-1);
            toast.success('QuickBuild Inspection Sequence completed!');
        }
    }, [isSimulating, simStepIndex]);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', height: 'calc(100vh - 120px)', minHeight: 0, padding: '20px' }}>
            
            {/* Left Flowchart Canvas */}
            <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative' }}>
                
                {/* Canvas Toolbar */}
                <div style={{ padding: '12px 20px', borderBottom: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc', flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Sliders size={16} color="#64748b" />
                        <span style={{ fontSize: '0.88rem', fontWeight: 800 }}>Sequence Designer</span>
                        <div style={{ display: 'flex', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', backgroundColor: 'white', padding: '2px' }}>
                            {TEMPLATES.map((t, idx) => (
                                <button
                                    key={t.name}
                                    onClick={() => handleLoadTemplate(idx)}
                                    style={{
                                        border: 'none',
                                        background: activeTemplateIndex === idx ? 'linear-gradient(135deg, #3b82f6, #8b5cf6)' : 'none',
                                        color: activeTemplateIndex === idx ? 'white' : '#64748b',
                                        padding: '5px 12px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                    }}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={handleRunSimulation}
                            disabled={isSimulating}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: 'none',
                                backgroundColor: isSimulating ? '#94a3b8' : '#10b981',
                                color: 'white', fontWeight: 700, fontSize: '0.78rem', cursor: isSimulating ? 'default' : 'pointer'
                            }}
                        >
                            <Play size={12} fill="white" /> {isSimulating ? 'SIMULATING...' : 'RUN PIPELINE'}
                        </button>
                        <button
                            onClick={() => {
                                toast.success('Inspection sequence config saved successfully!');
                            }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                backgroundColor: 'white', color: '#334155', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                            }}
                        >
                            <Save size={12} /> Save
                        </button>
                    </div>
                </div>

                {/* Node Canvas Area */}
                <div 
                    ref={canvasRef}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                    style={{ 
                        flex: 1, 
                        backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', 
                        backgroundSize: '20px 20px', 
                        position: 'relative', 
                        overflow: 'hidden',
                        backgroundColor: '#f8fafc' 
                    }}
                >
                    {/* SVG Connections Overlay */}
                    <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                        {links.map((link) => {
                            const from = nodes.find(n => n.id === link.fromNode);
                            const to = nodes.find(n => n.id === link.toNode);
                            if (!from || !to) return null;

                            // Calculate link pin pixel coordinates
                            const x1 = from.x + 180;
                            const y1 = from.y + 45;
                            const x2 = to.x;
                            const y2 = to.y + 45;

                            // Smooth curve
                            const dx = Math.abs(x2 - x1) * 0.5;
                            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                            return (
                                <g key={link.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                                    <path
                                        d={pathData}
                                        fill="none"
                                        stroke="#cbd5e1"
                                        strokeWidth="5"
                                        style={{ transition: 'stroke 0.25s' }}
                                        onMouseEnter={(e) => e.currentTarget.setAttribute('stroke', '#ef4444')}
                                        onMouseLeave={(e) => e.currentTarget.setAttribute('stroke', '#cbd5e1')}
                                        onClick={() => handleRemoveLink(link.id)}
                                        title="Click to remove connection"
                                    />
                                    <path
                                        d={pathData}
                                        fill="none"
                                        stroke={from.status === 'success' ? '#10b981' : '#3b82f6'}
                                        strokeWidth="2.5"
                                    />
                                </g>
                            );
                        })}
                    </svg>

                    {/* Nodes Loop */}
                    {nodes.map((node, index) => {
                        const typeInfo = NODE_TYPES[node.type];
                        const isNodeSelected = selectedNodeId === node.id;
                        const isNodeSimulating = isSimulating && simStepIndex === index;
                        
                        let nodeBorder = '1px solid #cbd5e1';
                        if (isNodeSelected) nodeBorder = `2px solid ${typeInfo.color}`;
                        else if (node.status === 'success') nodeBorder = '2px solid #10b981';
                        else if (node.status === 'failed') nodeBorder = '2px solid #ef4444';

                        return (
                            <div
                                key={node.id}
                                onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                                style={{
                                    position: 'absolute',
                                    left: node.x,
                                    top: node.y,
                                    width: '180px',
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    boxShadow: isNodeSelected 
                                        ? '0 10px 25px -5px rgba(0, 0, 0, 0.15)' 
                                        : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                                    border: nodeBorder,
                                    cursor: 'grab',
                                    zIndex: 10,
                                    transition: 'box-shadow 0.15s',
                                    boxSizing: 'border-box',
                                    animation: isNodeSimulating ? 'pulse-border 1s infinite alternate' : 'none'
                                }}
                            >
                                {/* Bouncing highlight keyframes styling */}
                                <style>{`
                                    @keyframes pulse-border {
                                        0% { box-shadow: 0 0 4px #3b82f6; }
                                        100% { box-shadow: 0 0 16px #3b82f6; }
                                    }
                                `}</style>

                                {/* Header */}
                                <div style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: '#f8fafc', 
                                    borderBottom: '1px solid #cbd5e1', 
                                    borderTopLeftRadius: '11px', 
                                    borderTopRightRadius: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}>
                                    <span style={{ fontSize: '0.85rem' }}>{typeInfo.icon}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1e293b', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {node.name}
                                    </span>
                                    {node.status === 'success' && <Check size={12} color="#10b981" style={{ strokeWidth: 3 }} />}
                                    {node.status === 'failed' && <X size={12} color="#ef4444" style={{ strokeWidth: 3 }} />}
                                </div>

                                {/* Body / Outputs */}
                                <div style={{ padding: '8px 12px', fontSize: '0.68rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {node.value ? (
                                        <div style={{ color: '#0f172a', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', backgroundColor: '#f1f5f9', padding: '3px 6px', borderRadius: '4px' }}>
                                            {node.value}
                                        </div>
                                    ) : (
                                        <div>Ready to process</div>
                                    )}
                                </div>

                                {/* Link Handles / Pins */}
                                {/* Left Input Pin */}
                                {node.type !== 'acquire' && (
                                    <div 
                                        className="pin-connector"
                                        onClick={(e) => handlePinClick(e, node.id, node.inputs?.[0] || 'input', 'input')}
                                        style={{
                                            position: 'absolute',
                                            left: '-8px',
                                            top: '40px',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffffff',
                                            border: '3.5px solid #cbd5e1',
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                        title="Connect Input Wire"
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = typeInfo.color}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                                    />
                                )}

                                {/* Right Output Pin */}
                                {node.type !== 'decide' && (
                                    <div 
                                        className="pin-connector"
                                        onClick={(e) => handlePinClick(e, node.id, node.outputs?.[0] || 'output', 'output')}
                                        style={{
                                            position: 'absolute',
                                            right: '-8px',
                                            top: '40px',
                                            width: '14px',
                                            height: '14px',
                                            borderRadius: '50%',
                                            backgroundColor: '#ffffff',
                                            border: `3.5px solid ${typeInfo.color}`,
                                            cursor: 'pointer',
                                            boxSizing: 'border-box'
                                        }}
                                        title="Connect Output Wire"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Right Control Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                
                {/* 1. Tool Block spawning panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '0.85rem', fontWeight: 800 }}>QuickBuild Tool Blocks</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.keys(NODE_TYPES).map((type) => {
                            const info = NODE_TYPES[type];
                            return (
                                <button
                                    key={type}
                                    onClick={() => handleAddNode(type)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#f8fafc',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.borderColor = info.color;
                                        e.currentTarget.style.backgroundColor = 'white';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                        e.currentTarget.style.backgroundColor = '#f8fafc';
                                    }}
                                >
                                    <span style={{ fontSize: '1.1rem' }}>{info.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155' }}>{info.label}</div>
                                        <div style={{ fontSize: '0.62rem', color: '#64748b' }}>{info.desc}</div>
                                    </div>
                                    <Plus size={14} color="#94a3b8" />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 2. Selected Node parameter editor panel */}
                <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #cbd5e1', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>Block Settings</span>
                        {selectedNode && (
                            <button 
                                onClick={() => handleDeleteNode(selectedNode.id)}
                                style={{ border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>

                    {selectedNode ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            
                            {/* Block name input */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Block Label</span>
                                <input
                                    type="text"
                                    value={selectedNode.name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, name: val } : n));
                                    }}
                                    style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                />
                            </div>

                            {/* Dynamic Parameters depending on type */}
                            {selectedNode.type === 'acquire' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Select Camera Source</span>
                                        <select
                                            value={selectedNode.params.camera || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'camera', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="Main Inspection Camera">Main Inspection Camera</option>
                                            <option value="Packaging Line Camera">Packaging Line Camera</option>
                                            <option value="Calibration Webcam">Calibration Webcam</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Trigger Shutter Mode</span>
                                        <select
                                            value={selectedNode.params.trigger || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'trigger', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="PLC Continuous">PLC Continuous</option>
                                            <option value="Sensor Trigger">Sensor Trigger</option>
                                            <option value="Software Continuous">Software Continuous</option>
                                        </select>
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'locate' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Align Reference Template</span>
                                        <input
                                            type="text"
                                            value={selectedNode.params.template || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'template', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Angle Tolerance (±°)</span>
                                        <input
                                            type="number"
                                            value={selectedNode.params.angleTolerance || 10}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'angleTolerance', Number(e.target.value))}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'measure' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Caliper Scan Tool</span>
                                        <select
                                            value={selectedNode.params.tool || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'tool', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="Caliper Edge-to-Edge">Caliper Edge-to-Edge</option>
                                            <option value="Circle Diameter Caliper">Circle Diameter Caliper</option>
                                            <option value="Corner Angle Check">Corner Angle Check</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Nominal Target Size</span>
                                        <input
                                            type="text"
                                            value={selectedNode.params.nominalSize || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'nominalSize', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                </>
                            )}

                            {selectedNode.type === 'inspect' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Inspection Mode</span>
                                        <select
                                            value={selectedNode.params.mode || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'mode', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="OCR Reading">OCR Reading</option>
                                            <option value="OCV Verification">OCV Verification</option>
                                            <option value="Anomaly Segmentation">Anomaly Segmentation</option>
                                            <option value="Barcode Code Scanning">Barcode Code Scanning</option>
                                        </select>
                                    </div>

                                    {selectedNode.params.mode === 'OCV Verification' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Verification Reference</span>
                                            <select
                                                value={selectedNode.params.referenceSource || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'referenceSource', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                            >
                                                <option value="Static Ref Text">Static Reference Text</option>
                                                {appVariables.map(v => (
                                                    <option key={v.id} value={`Variable: ${v.name}`}>Var: {v.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Match Pattern Validation</span>
                                            <input
                                                type="text"
                                                value={selectedNode.params.matchPattern || ''}
                                                onChange={(e) => updateNodeParam(selectedNode.id, 'matchPattern', e.target.value)}
                                                style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            {selectedNode.type === 'decide' && (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Target Yield Match (%)</span>
                                        <input
                                            type="number"
                                            value={selectedNode.params.minPassedScore || 90}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'minPassedScore', Number(e.target.value))}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#64748b' }}>Fail Trigger Actions</span>
                                        <select
                                            value={selectedNode.params.failAction || ''}
                                            onChange={(e) => updateNodeParam(selectedNode.id, 'failAction', e.target.value)}
                                            style={{ padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '0.78rem', outline: 'none', backgroundColor: 'white' }}
                                        >
                                            <option value="Trigger Alert Light">Trigger Alert Light</option>
                                            <option value="Activate Reject Arm">Activate Reject Arm</option>
                                            <option value="Write PLC Boolean Error">Write PLC Boolean Error</option>
                                        </select>
                                    </div>
                                </>
                            )}

                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
                            <HelpCircle size={32} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                            <span style={{ fontSize: '0.78rem', fontWeight: 700 }}>No Node Selected</span>
                            <p style={{ fontSize: '0.68rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Click on a block on the flowchart to edit its settings.</p>
                        </div>
                    )}
                </div>

            </div>
            
        </div>
    );
}
