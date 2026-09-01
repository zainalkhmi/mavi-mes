/**
 * Automation Debug Mode
 * Step-through execution with breakpoints and variable inspection
 *
 * Part of Phase 2: Advanced Features
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
    Background, Controls, MiniMap, useNodesState, useEdgesState,
    Handle, Position, MarkerType, getBezierPath
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
    Play, Pause, SkipForward, Square, RotateCcw, Bug, ChevronRight,
    Eye, EyeOff, Plus, Trash2, CheckCircle, XCircle, AlertTriangle,
    ChevronDown, Code, Variable, Maximize2, Minimize2, RefreshCw
} from 'lucide-react';

// =====================================================
// DEBUG CONTEXT
// =====================================================

const DebugContext = React.createContext(null);

const useDebug = () => React.useContext(DebugContext);

// =====================================================
// DEBUG NODE (with breakpoint marker)
// =====================================================

const DebugNode = ({ data, selected }) => {
    const { breakpoints, currentNode, pausedAt } = useDebug();
    const isBreakpoint = breakpoints.includes(data.id);
    const isCurrentNode = currentNode === data.id;
    const isPausedHere = pausedAt === data.id;

    const getNodeColor = () => {
        if (data.type === 'trigger' || data.triggerType) return '#00A09D';
        if (data.type?.startsWith('AI_')) return '#a855f7';
        if (data.type === 'TELEGRAM' || data.type === 'SLACK') return '#0088cc';
        if (data.type === 'GOOGLE_SHEETS') return '#0F9D58';
        if (data.type === 'EMAIL') return '#EA4335';
        if (isCurrentNode) return '#f59e0b';
        return '#714B67';
    };

    const color = getNodeColor();

    return (
        <div style={{ position: 'relative' }}>
            {/* Breakpoint indicator */}
            {isBreakpoint && (
                <div style={{
                    position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%)',
                    width: '16px', height: '16px', borderRadius: '50%',
                    backgroundColor: '#ef4444', border: '2px solid white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 10
                }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />
                </div>
            )}

            {/* Current execution indicator */}
            {isCurrentNode && (
                <div style={{
                    position: 'absolute', inset: '-4px', borderRadius: '22px',
                    border: '3px solid #f59e0b',
                    animation: 'pulse 1s infinite',
                    pointerEvents: 'none'
                }} />
            )}

            <div style={{
                width: '72px', height: '72px', borderRadius: '18px',
                backgroundColor: color,
                border: `3px solid ${selected ? '#ffffff' : isPausedHere ? '#f59e0b' : 'rgba(0,0,0,0.2)'}`,
                boxShadow: selected ? `0 0 24px ${color}` : '0 4px 12px rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#ffffff',
                position: 'relative'
            }}>
                <Handle type="target" position={Position.Left} style={{
                    width: '10px', height: '10px', background: color, border: '2px solid white', left: '-5px'
                }} />

                {data.triggerType === 'TIMER' || data.type === 'TIMER' ? (
                    <span style={{ fontSize: '24px' }}>⏰</span>
                ) : data.type === 'HTTP_REQUEST' ? (
                    <span style={{ fontSize: '24px' }}>🌐</span>
                ) : data.type === 'TELEGRAM' || data.connectorType === 'telegram' ? (
                    <span style={{ fontSize: '24px' }}>📱</span>
                ) : data.type === 'SLACK' || data.connectorType === 'slack' ? (
                    <span style={{ fontSize: '24px' }}>💬</span>
                ) : data.type === 'GOOGLE_SHEETS' || data.connectorType === 'google_sheets' ? (
                    <span style={{ fontSize: '24px' }}>📊</span>
                ) : data.type === 'EMAIL' || data.connectorType === 'email' ? (
                    <span style={{ fontSize: '24px' }}>📧</span>
                ) : data.type?.startsWith('AI_') ? (
                    <span style={{ fontSize: '24px' }}>🤖</span>
                ) : (
                    <span style={{ fontSize: '24px' }}>⚙️</span>
                )}

                <Handle type="source" position={Position.Right} style={{
                    width: '10px', height: '10px', background: color, border: '2px solid white', right: '-5px'
                }} />
            </div>

            <div style={{
                textAlign: 'center', marginTop: '6px', maxWidth: '100px',
                fontSize: '0.7rem'
            }}>
                <div style={{ fontWeight: 600, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {data.label || 'Node'}
                </div>
                {isCurrentNode && (
                    <div style={{ fontSize: '0.6rem', color: '#f59e0b', fontWeight: 600, marginTop: '2px' }}>
                        {isPausedHere ? '⏸ PAUSED' : '▶ EXECUTING'}
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================
// VARIABLE INSPECTOR
// =====================================================

const VariableInspector = ({ variables, onUpdate }) => {
    const [expanded, setExpanded] = useState(true);
    const [filter, setFilter] = useState('');

    const filteredVars = Object.entries(variables || {}).filter(
        ([key]) => key.toLowerCase().includes(filter.toLowerCase())
    );

    const renderValue = (value, depth = 0) => {
        if (value === null) return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>null</span>;
        if (value === undefined) return <span style={{ color: '#6b7280', fontStyle: 'italic' }}>undefined</span>;
        if (typeof value === 'string') return <span style={{ color: '#059669' }}>"{value}"</span>;
        if (typeof value === 'number') return <span style={{ color: '#2563eb' }}>{value}</span>;
        if (typeof value === 'boolean') return <span style={{ color: '#d97706' }}>{value.toString()}</span>;
        if (Array.isArray(value)) {
            return (
                <details style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                    <summary style={{ cursor: 'pointer', color: '#64748b' }}>
                        Array[{value.length}]
                    </summary>
                    {value.map((item, i) => (
                        <div key={i} style={{ marginLeft: '12px' }}>
                            [{i}]: {renderValue(item, depth + 1)}
                        </div>
                    ))}
                </details>
            );
        }
        if (typeof value === 'object') {
            return (
                <details style={{ marginLeft: depth > 0 ? '12px' : 0 }}>
                    <summary style={{ cursor: 'pointer', color: '#64748b' }}>
                        Object
                    </summary>
                    {Object.entries(value).map(([k, v]) => (
                        <div key={k} style={{ marginLeft: '12px' }}>
                            <span style={{ color: '#7c3aed' }}>{k}</span>: {renderValue(v, depth + 1)}
                        </div>
                    ))}
                </details>
            );
        }
        return String(value);
    };

    return (
        <div style={{
            border: '1px solid #e2e8f0', borderRadius: '12px', backgroundColor: 'white',
            overflow: 'hidden'
        }}>
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    padding: '12px 16px', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', cursor: 'pointer', backgroundColor: '#f8fafc',
                    borderBottom: expanded ? '1px solid #e2e8f0' : 'none'
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Variable size={16} color="#6366f1" />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>Variables</span>
                    <span style={{
                        padding: '2px 8px', borderRadius: '9999px',
                        backgroundColor: '#e0e7ff', color: '#4f46e5',
                        fontSize: '0.7rem', fontWeight: 600
                    }}>
                        {Object.keys(variables || {}).length}
                    </span>
                </div>
                {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {expanded && (
                <div>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                        <input
                            type="text"
                            placeholder="Filter variables..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            style={{
                                width: '100%', padding: '6px 10px', border: '1px solid #e2e8f0',
                                borderRadius: '6px', fontSize: '0.8rem'
                            }}
                        />
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '8px 12px' }}>
                        {filteredVars.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.875rem' }}>
                                No variables
                            </div>
                        ) : (
                            filteredVars.map(([key, value]) => (
                                <div key={key} style={{
                                    padding: '6px 0', borderBottom: '1px solid #f1f5f9',
                                    fontFamily: 'monospace', fontSize: '0.8rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                        <span style={{ color: '#7c3aed', fontWeight: 500, flexShrink: 0 }}>{key}</span>
                                        <span style={{ color: '#94a3b8' }}>=</span>
                                        <span style={{ wordBreak: 'break-all' }}>{renderValue(value)}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// =====================================================
// DEBUG PANEL
// =====================================================

const DebugPanel = ({ automation, onUpdateAutomation }) => {
    const {
        isDebugging,
        isPaused,
        breakpoints,
        currentNode,
        executionLog,
        variables,
        executionIndex,
        toggleBreakpoint,
        startDebug,
        stepOver,
        resume,
        stopDebug,
        clearLog
    } = useDebug();

    const [isFullscreen, setIsFullscreen] = useState(false);

    const containerStyle = isFullscreen ? {
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'white', display: 'flex', flexDirection: 'column'
    } : {
        height: '500px', display: 'flex', flexDirection: 'column',
        border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden'
    };

    // Get current execution node
    const currentNodeData = automation?.graph_data?.nodes?.find(n => n.id === currentNode);

    return (
        <div style={containerStyle}>
            {/* Toolbar */}
            <div style={{
                padding: '12px 16px', backgroundColor: '#1e293b', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Bug size={20} color="#f59e0b" />
                    <span style={{ color: 'white', fontWeight: 600 }}>Debug Mode</span>

                    {isDebugging && (
                        <span style={{
                            padding: '4px 10px', borderRadius: '9999px', fontSize: '0.75rem',
                            backgroundColor: isPaused ? '#fbbf24' : '#10b981',
                            color: 'white', fontWeight: 500
                        }}>
                            {isPaused ? '⏸ Paused' : '▶ Running'}
                        </span>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={clearLog}
                        style={{
                            padding: '6px 10px', border: 'none', borderRadius: '6px',
                            backgroundColor: '#374151', color: '#9ca3af', cursor: 'pointer',
                            fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px'
                        }}
                    >
                        <Trash2 size={12} />
                        Clear
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{
                            padding: '6px 10px', border: 'none', borderRadius: '6px',
                            backgroundColor: '#374151', color: 'white', cursor: 'pointer'
                        }}
                    >
                        {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left: Execution Log */}
                <div style={{
                    width: '300px', borderRight: '1px solid #e2e8f0',
                    display: 'flex', flexDirection: 'column'
                }}>
                    <div style={{
                        padding: '8px 12px', backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '0.75rem', fontWeight: 600, color: '#64748b'
                    }}>
                        Execution Log ({executionIndex + 1}/{automation?.graph_data?.nodes?.length || 0})
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
                        {(executionLog || []).map((log, index) => (
                            <div
                                key={index}
                                style={{
                                    padding: '8px 10px', marginBottom: '4px', borderRadius: '6px',
                                    fontSize: '0.75rem', fontFamily: 'monospace',
                                    backgroundColor: log.type === 'error' ? '#fee2e2' :
                                                   log.type === 'warning' ? '#fef3c7' :
                                                   index === executionIndex ? '#dbeafe' : '#f8fafc',
                                    color: log.type === 'error' ? '#dc2626' :
                                           log.type === 'warning' ? '#d97706' : '#1e293b',
                                    cursor: 'pointer'
                                }}
                                onClick={() => {/* Jump to node */}}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {log.type === 'error' ? <XCircle size={12} /> :
                                     log.type === 'warning' ? <AlertTriangle size={12} /> :
                                     <CheckCircle size={12} />}
                                    <span>{log.node || 'System'}</span>
                                </div>
                                <div style={{ marginLeft: '18px', color: '#64748b' }}>
                                    {log.message}
                                </div>
                            </div>
                        ))}

                        {(!executionLog || executionLog.length === 0) && (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.875rem' }}>
                                Click "Start Debug" to begin execution
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Canvas + Panel */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Debug Controls */}
                    <div style={{
                        padding: '12px 16px', backgroundColor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '8px'
                    }}>
                        {!isDebugging ? (
                            <button
                                onClick={startDebug}
                                style={{
                                    padding: '8px 16px', border: 'none', borderRadius: '8px',
                                    backgroundColor: '#10b981', color: 'white', cursor: 'pointer',
                                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Play size={14} />
                                Start Debug
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={isPaused ? resume : pause}
                                    style={{
                                        padding: '8px 16px', border: 'none', borderRadius: '8px',
                                        backgroundColor: isPaused ? '#10b981' : '#f59e0b',
                                        color: 'white', cursor: 'pointer',
                                        fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    {isPaused ? <Play size={14} /> : <Pause size={14} />}
                                    {isPaused ? 'Resume' : 'Pause'}
                                </button>

                                <button
                                    onClick={stepOver}
                                    disabled={!isPaused}
                                    style={{
                                        padding: '8px 16px', border: '1px solid #e2e8f0',
                                        borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px',
                                        opacity: isPaused ? 1 : 0.5
                                    }}
                                >
                                    <SkipForward size={14} />
                                    Step Over
                                </button>

                                <button
                                    onClick={stopDebug}
                                    style={{
                                        padding: '8px 16px', border: 'none', borderRadius: '8px',
                                        backgroundColor: '#ef4444', color: 'white', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <Square size={14} />
                                    Stop
                                </button>
                            </>
                        )}
                    </div>

                    {/* Canvas placeholder */}
                    <div style={{ flex: 1, backgroundColor: '#f8fafc', position: 'relative' }}>
                        {automation?.graph_data?.nodes?.length > 0 ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ textAlign: 'center', color: '#64748b' }}>
                                    <Code size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                                    <div>Debug canvas with {automation.graph_data.nodes.length} nodes</div>
                                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                                        Click nodes to toggle breakpoints
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                No workflow loaded
                            </div>
                        )}
                    </div>
                </div>

                {/* Variables Panel */}
                <div style={{ width: '280px', borderLeft: '1px solid #e2e8f0', padding: '12px' }}>
                    <VariableInspector variables={variables} />
                </div>
            </div>
        </div>
    );
};

// =====================================================
// MAIN DEBUG WRAPPER
// =====================================================

export const AutomationDebugger = ({ automation, onSave }) => {
    const [debugState, setDebugState] = useState({
        isDebugging: false,
        isPaused: false,
        breakpoints: [],
        currentNode: null,
        executionLog: [],
        variables: {},
        executionIndex: -1
    });

    const pause = useCallback(() => {
        setDebugState(s => ({ ...s, isPaused: true }));
    }, []);

    const toggleBreakpoint = useCallback((nodeId) => {
        setDebugState(s => ({
            ...s,
            breakpoints: s.breakpoints.includes(nodeId)
                ? s.breakpoints.filter(id => id !== nodeId)
                : [...s.breakpoints, nodeId]
        }));
    }, []);

    const startDebug = useCallback(async () => {
        setDebugState(s => ({
            ...s,
            isDebugging: true,
            isPaused: false,
            currentNode: null,
            executionLog: [{ type: 'info', node: 'System', message: 'Debug started' }],
            executionIndex: 0,
            variables: {}
        }));

        // Simulate execution
        const nodes = automation?.graph_data?.nodes || [];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];

            setDebugState(s => ({
                ...s,
                currentNode: node.id,
                executionIndex: i,
                executionLog: [...s.executionLog, {
                    type: 'info',
                    node: node.data?.label || node.id,
                    message: `Executing node ${i + 1}/${nodes.length}`
                }],
                variables: {
                    ...s.variables,
                    [`node_${node.id}_result`]: { status: 'success' }
                }
            }));

            // Check for breakpoint
            if (debugState.breakpoints.includes(node.id)) {
                setDebugState(s => ({
                    ...s,
                    isPaused: true,
                    pausedAt: node.id,
                    executionLog: [...s.executionLog, {
                        type: 'warning',
                        node: node.data?.label || node.id,
                        message: 'Breakpoint hit - paused'
                    }]
                }));
                break;
            }

            // Wait for step or resume
            await new Promise(resolve => {
                const check = setInterval(() => {
                    setDebugState(s => {
                        if (!s.isPaused || !s.isDebugging) {
                            clearInterval(check);
                            resolve();
                        }
                        if (!s.isDebugging) {
                            clearInterval(check);
                            resolve();
                        }
                        return s;
                    });
                }, 100);
            });
        }

        setDebugState(s => ({
            ...s,
            isDebugging: false,
            currentNode: null,
            isPaused: false,
            executionLog: [...s.executionLog, {
                type: 'info',
                node: 'System',
                message: 'Debug completed'
            }]
        }));
    }, [automation, debugState.breakpoints]);

    const stepOver = useCallback(() => {
        setDebugState(s => ({ ...s, isPaused: false }));
    }, []);

    const resume = useCallback(() => {
        setDebugState(s => ({ ...s, isPaused: false }));
    }, []);

    const stopDebug = useCallback(() => {
        setDebugState(s => ({
            ...s,
            isDebugging: false,
            isPaused: false,
            currentNode: null,
            executionLog: [...s.executionLog, {
                type: 'warning',
                node: 'System',
                message: 'Debug stopped by user'
            }]
        }));
    }, []);

    const clearLog = useCallback(() => {
        setDebugState(s => ({ ...s, executionLog: [], executionIndex: -1 }));
    }, []);

    return (
        <DebugContext.Provider value={{
            ...debugState,
            toggleBreakpoint,
            startDebug,
            stepOver,
            resume,
            stopDebug,
            clearLog,
            pause
        }}>
            <DebugPanel automation={automation} onUpdateAutomation={onSave} />
        </DebugContext.Provider>
    );
};

export default AutomationDebugger;
