import React, { useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { NODE_TYPES } from './quickbuildToolTypes';

/**
 * QuickBuildCanvas — Flowchart canvas with draggable nodes, SVG bezier wiring, and pin connectors.
 */
export default function QuickBuildCanvas({
    nodes,
    setNodes,
    links,
    setLinks,
    selectedNodeId,
    setSelectedNodeId,
    isSimulating,
    simStepIndex,
}) {
    const canvasRef = useRef(null);
    const [draggingNodeId, setDraggingNodeId] = useState(null);
    const dragOffset = useRef({ x: 0, y: 0 });
    const [activeLinkStart, setActiveLinkStart] = useState(null);

    // ── Node Drag ──────────────────────────────────────────────
    const handleNodeMouseDown = (e, nodeId) => {
        if (e.target.closest('.pin-connector')) return;
        setDraggingNodeId(nodeId);
        setSelectedNodeId(nodeId);
        const node = nodes.find(n => n.id === nodeId);
        if (node) {
            dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y };
        }
    };

    const handleCanvasMouseMove = (e) => {
        if (draggingNodeId) {
            const rect = canvasRef.current.getBoundingClientRect();
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;
            newX = Math.max(10, Math.min(rect.width - 80, newX));
            newY = Math.max(10, Math.min(rect.height - 100, newY));
            setNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
        }
    };

    const handleCanvasMouseUp = () => {
        setDraggingNodeId(null);
    };

    // ── Pin Linking ────────────────────────────────────────────
    const handlePinClick = (e, nodeId, pinName, type) => {
        e.stopPropagation();
        if (!activeLinkStart) {
            setActiveLinkStart({ nodeId, pinName, type });
        } else {
            if (activeLinkStart.type === type) {
                toast.error('Cannot connect output→output or input→input.');
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

            const dup = links.find(l => l.fromNode === fromNode && l.fromPin === fromPin && l.toNode === toNode && l.toPin === toPin);
            if (dup) { setActiveLinkStart(null); return; }

            setLinks(prev => [...prev, {
                id: `link_${Date.now()}`,
                fromNode, fromPin, toNode, toPin,
            }]);
            setActiveLinkStart(null);
            toast.success('Nodes connected.');
        }
    };

    const handleRemoveLink = (linkId) => {
        setLinks(prev => prev.filter(l => l.id !== linkId));
        toast.error('Link disconnected.');
    };

    // ── Deselect on canvas click ───────────────────────────────
    const handleCanvasClick = (e) => {
        if (e.target === canvasRef.current) {
            setSelectedNodeId(null);
            setActiveLinkStart(null);
        }
    };

    // ── Node Dimensions ────────────────────────────────────────
    const NODE_W = 60;
    const NODE_H = 60;

    return (
        <div
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            onClick={handleCanvasClick}
            style={{
                flex: 1,
                backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                backgroundSize: '20px 20px',
                position: 'relative',
                overflow: 'hidden',
                backgroundColor: '#f8fafc',
            }}
        >
            {/* Active link indicator */}
            {activeLinkStart && (
                <div style={{
                    position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '8px',
                    padding: '4px 12px', fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', zIndex: 100,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}>
                    🔗 Click a {activeLinkStart.type === 'output' ? 'input' : 'output'} pin to connect…
                    <button
                        onClick={() => setActiveLinkStart(null)}
                        style={{ marginLeft: '8px', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontWeight: 700, fontSize: '0.65rem' }}
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* SVG Connections */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
                {links.map((link) => {
                    const from = nodes.find(n => n.id === link.fromNode);
                    const to = nodes.find(n => n.id === link.toNode);
                    if (!from || !to) return null;

                    const x1 = from.x + NODE_W;
                    const y1 = from.y + NODE_H / 2;
                    const x2 = to.x;
                    const y2 = to.y + NODE_H / 2;
                    const dx = Math.abs(x2 - x1) * 0.5;
                    const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                    return (
                        <g key={link.id} style={{ pointerEvents: 'auto', cursor: 'pointer' }}>
                            {/* Wide invisible hit area */}
                            <path
                                d={pathData} fill="none" stroke="transparent" strokeWidth="12"
                                onClick={() => handleRemoveLink(link.id)}
                                onMouseEnter={(e) => e.currentTarget.nextSibling.setAttribute('stroke', '#ef4444')}
                                onMouseLeave={(e) => e.currentTarget.nextSibling.setAttribute('stroke', from.status === 'success' ? '#10b981' : '#3b82f6')}
                            />
                            {/* Visible wire */}
                            <path
                                d={pathData} fill="none"
                                stroke={from.status === 'success' ? '#10b981' : '#3b82f6'}
                                strokeWidth="2.5"
                                style={{ transition: 'stroke 0.2s' }}
                            />
                            {/* Animated flow dot when simulating */}
                            {from.status === 'success' && (
                                <circle r="3" fill="#10b981">
                                    <animateMotion dur="1.5s" repeatCount="indefinite" path={pathData} />
                                </circle>
                            )}
                        </g>
                    );
                })}
            </svg>

            {/* Nodes */}
            {nodes.map((node, index) => {
                const typeInfo = NODE_TYPES[node.type] || { color: '#94a3b8', icon: '❓', label: node.type };
                const isNodeSelected = selectedNodeId === node.id;
                const isNodeSimulating = isSimulating && simStepIndex === index;

                let nodeBorder = '1px solid #cbd5e1';
                if (isNodeSelected) nodeBorder = `2px solid ${typeInfo.color}`;
                else if (node.status === 'success') nodeBorder = '2px solid #10b981';
                else if (node.status === 'failed') nodeBorder = '2px solid #ef4444';

                const hasInputs = node.inputs && node.inputs.length > 0;
                const hasOutputs = node.outputs && node.outputs.length > 0;

                return (
                    <div
                        key={node.id}
                        onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
                        title={`${node.name} (${typeInfo.label})${node.value ? ': ' + node.value : ''}`}
                        style={{
                            position: 'absolute',
                            left: node.x,
                            top: node.y,
                            width: `${NODE_W}px`,
                            height: `${NODE_H}px`,
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            boxShadow: isNodeSelected
                                ? `0 0 0 3px ${typeInfo.color}25, 0 8px 20px -5px ${typeInfo.color}30`
                                : node.status === 'success'
                                ? '0 0 12px rgba(16, 185, 129, 0.2), 0 4px 6px -1px rgba(0,0,0,0.05)'
                                : node.status === 'failed'
                                ? '0 0 12px rgba(239, 68, 68, 0.2), 0 4px 6px -1px rgba(0,0,0,0.05)'
                                : '0 4px 8px -1px rgba(0,0,0,0.05)',
                            border: isNodeSelected
                                ? `2.5px solid ${typeInfo.color}`
                                : node.status === 'success'
                                ? '2.5px solid #10b981'
                                : node.status === 'failed'
                                ? '2.5px solid #ef4444'
                                : `2px solid ${typeInfo.color}40`,
                            cursor: 'grab',
                            zIndex: 10,
                            transition: 'all 0.15s',
                            boxSizing: 'border-box',
                            animation: isNodeSimulating ? 'qb-pulse 1s infinite alternate' : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <style>{`@keyframes qb-pulse { 0% { box-shadow: 0 0 4px ${typeInfo.color}; } 100% { box-shadow: 0 0 16px ${typeInfo.color}; } }`}</style>

                        {/* Large Central Icon */}
                        <div style={{
                            fontSize: '1.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            userSelect: 'none',
                        }}>
                            {typeInfo.icon}
                        </div>

                        {/* Status Badge (Top-Right) */}
                        {node.status && node.status !== 'idle' && (
                            <div style={{
                                position: 'absolute',
                                top: '-6px',
                                right: '-6px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                backgroundColor: node.status === 'success' ? '#10b981' : '#ef4444',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                zIndex: 12,
                            }}>
                                {node.status === 'success' ? (
                                    <Check size={10} color="#ffffff" style={{ strokeWidth: 4 }} />
                                ) : (
                                    <X size={10} color="#ffffff" style={{ strokeWidth: 4 }} />
                                )}
                            </div>
                        )}

                        {/* Label underneath the Node (n8n Style) */}
                        <div style={{
                            position: 'absolute',
                            top: '66px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '120px',
                            textAlign: 'center',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#334155',
                            lineHeight: '1.2',
                            pointerEvents: 'none',
                            textShadow: '0px 1px 1px rgba(255,255,255,0.8)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }} title={node.name}>
                            {node.name}
                        </div>

                        {/* Input Pin (Left) */}
                        {hasInputs && (
                            <div
                                className="pin-connector"
                                onClick={(e) => handlePinClick(e, node.id, node.inputs[0], 'input')}
                                style={{
                                    position: 'absolute', left: '-8px', top: 'calc(50% - 7px)',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: activeLinkStart?.type === 'output' ? typeInfo.color : '#ffffff',
                                    border: `3px solid ${activeLinkStart?.type === 'output' ? typeInfo.color : '#cbd5e1'}`,
                                    cursor: 'pointer', boxSizing: 'border-box',
                                    transition: 'all 0.15s',
                                    boxShadow: activeLinkStart?.type === 'output' ? `0 0 6px ${typeInfo.color}40` : 'none',
                                }}
                                title={`Input: ${node.inputs[0]}`}
                                onMouseEnter={(e) => { e.currentTarget.style.borderColor = typeInfo.color; e.currentTarget.style.transform = 'scale(1.3)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.borderColor = activeLinkStart?.type === 'output' ? typeInfo.color : '#cbd5e1'; e.currentTarget.style.transform = 'scale(1)'; }}
                            />
                        )}

                        {/* Output Pin (Right) */}
                        {hasOutputs && (
                            <div
                                className="pin-connector"
                                onClick={(e) => handlePinClick(e, node.id, node.outputs[0], 'output')}
                                style={{
                                    position: 'absolute', right: '-8px', top: 'calc(50% - 7px)',
                                    width: '14px', height: '14px', borderRadius: '50%',
                                    backgroundColor: activeLinkStart?.type === 'input' ? typeInfo.color : '#ffffff',
                                    border: `3px solid ${typeInfo.color}`,
                                    cursor: 'pointer', boxSizing: 'border-box',
                                    transition: 'all 0.15s',
                                    boxShadow: activeLinkStart?.type === 'input' ? `0 0 6px ${typeInfo.color}40` : 'none',
                                }}
                                title={`Output: ${node.outputs[0]}`}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
