/**
 * Automation Version Control
 * Track changes, view diffs, and rollback versions
 *
 * Part of Phase 3: Version Control
 */

import React, { useState, useEffect } from 'react';
import {
    GitBranch, GitCommit, Clock, RotateCcw, Plus, Minus,
    RefreshCw, ChevronDown, ChevronRight, Eye, Download,
    Upload, Trash2, AlertTriangle, CheckCircle, XCircle
} from 'lucide-react';
import {
    getAutomationVersions,
    getAutomationVersion,
    createAutomationVersion,
    getAutomationById
} from '../utils/automationDB';

// =====================================================
// DIFF UTILITIES
// =====================================================

/**
 * Calculate diff between two objects
 */
export function calculateObjectDiff(oldObj, newObj) {
    const diffs = [];
    const allKeys = new Set([
        ...Object.keys(oldObj || {}),
        ...Object.keys(newObj || {})
    ]);

    for (const key of allKeys) {
        const oldVal = oldObj?.[key];
        const newVal = newObj?.[key];

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
            diffs.push({
                key,
                oldValue: oldVal,
                newValue: newVal,
                changeType: oldVal === undefined ? 'added' :
                           newVal === undefined ? 'removed' : 'modified'
            });
        }
    }

    return diffs;
}

/**
 * Calculate diff between two graph data
 */
export function calculateGraphDiff(oldGraph, newGraph) {
    const diffs = {
        nodes: { added: [], removed: [], modified: [] },
        edges: { added: [], removed: [] }
    };

    const oldNodes = new Map((oldGraph?.nodes || []).map(n => [n.id, n]));
    const newNodes = new Map((newGraph?.nodes || []).map(n => [n.id, n]));

    // Check for added/modified nodes
    for (const [id, newNode] of newNodes) {
        if (!oldNodes.has(id)) {
            diffs.nodes.added.push(newNode);
        } else {
            const oldNode = oldNodes.get(id);
            const nodeDiff = calculateObjectDiff(oldNode.data, newNode.data);
            if (nodeDiff.length > 0) {
                diffs.nodes.modified.push({
                    node: newNode,
                    changes: nodeDiff
                });
            }
        }
    }

    // Check for removed nodes
    for (const [id, oldNode] of oldNodes) {
        if (!newNodes.has(id)) {
            diffs.nodes.removed.push(oldNode);
        }
    }

    // Edges diff
    const oldEdges = new Set((oldGraph?.edges || []).map(e => `${e.source}-${e.target}`));
    const newEdges = new Set((newGraph?.edges || []).map(e => `${e.source}-${e.target}`));

    for (const edgeStr of newEdges) {
        if (!oldEdges.has(edgeStr)) {
            const edge = newGraph.edges.find(e => `${e.source}-${e.target}` === edgeStr);
            diffs.edges.added.push(edge);
        }
    }

    for (const edgeStr of oldEdges) {
        if (!newEdges.has(edgeStr)) {
            const edge = oldGraph.edges.find(e => `${e.source}-${e.target}` === edgeStr);
            diffs.edges.removed.push(edge);
        }
    }

    return diffs;
}

/**
 * Format diff for display
 */
export function formatDiffSummary(diffs) {
    const parts = [];

    if (diffs.nodes.added.length > 0) {
        parts.push(`+${diffs.nodes.added.length} nodes`);
    }
    if (diffs.nodes.removed.length > 0) {
        parts.push(`-${diffs.nodes.removed.length} nodes`);
    }
    if (diffs.nodes.modified.length > 0) {
        parts.push(`~${diffs.nodes.modified.length} modified`);
    }
    if (diffs.edges.added.length > 0) {
        parts.push(`+${diffs.edges.added.length} edges`);
    }
    if (diffs.edges.removed.length > 0) {
        parts.push(`-${diffs.edges.removed.length} edges`);
    }

    return parts.length > 0 ? parts.join(', ') : 'No changes';
}

// =====================================================
// DIFF VIEW COMPONENT
// =====================================================

const DiffView = ({ diff, oldVersion, newVersion }) => {
    const [expandedSections, setExpandedSections] = useState({
        nodes: true,
        edges: false
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <div style={{ fontSize: '0.875rem' }}>
            {/* Summary */}
            <div style={{
                padding: '12px', backgroundColor: '#f8fafc', borderRadius: '8px',
                marginBottom: '16px', display: 'flex', gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Plus size={14} color="#10b981" />
                    <span style={{ color: '#10b981' }}>{diff.nodes.added.length} added</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Minus size={14} color="#ef4444" />
                    <span style={{ color: '#ef4444' }}>{diff.nodes.removed.length} removed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <RefreshCw size={14} color="#f59e0b" />
                    <span style={{ color: '#f59e0b' }}>{diff.nodes.modified.length} modified</span>
                </div>
            </div>

            {/* Nodes Changes */}
            <div style={{ marginBottom: '16px' }}>
                <div
                    onClick={() => toggleSection('nodes')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontWeight: 600, marginBottom: '8px'
                    }}
                >
                    {expandedSections.nodes ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Nodes ({diff.nodes.added.length + diff.nodes.removed.length + diff.nodes.modified.length})
                </div>

                {expandedSections.nodes && (
                    <div style={{ paddingLeft: '24px' }}>
                        {/* Added Nodes */}
                        {diff.nodes.added.map((node, i) => (
                            <div key={`add-${i}`} style={{
                                padding: '8px 12px', marginBottom: '4px', borderRadius: '6px',
                                backgroundColor: '#d1fae5', borderLeft: '3px solid #10b981'
                            }}>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>+ Added:</span>{' '}
                                <code>{node.data?.label || node.id}</code>
                                <span style={{ color: '#64748b', marginLeft: '8px' }}>({node.type})</span>
                            </div>
                        ))}

                        {/* Removed Nodes */}
                        {diff.nodes.removed.map((node, i) => (
                            <div key={`rem-${i}`} style={{
                                padding: '8px 12px', marginBottom: '4px', borderRadius: '6px',
                                backgroundColor: '#fee2e2', borderLeft: '3px solid #ef4444'
                            }}>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>- Removed:</span>{' '}
                                <code>{node.data?.label || node.id}</code>
                                <span style={{ color: '#64748b', marginLeft: '8px' }}>({node.type})</span>
                            </div>
                        ))}

                        {/* Modified Nodes */}
                        {diff.nodes.modified.map(({ node, changes }, i) => (
                            <div key={`mod-${i}`} style={{
                                padding: '8px 12px', marginBottom: '4px', borderRadius: '6px',
                                backgroundColor: '#fef3c7', borderLeft: '3px solid #f59e0b'
                            }}>
                                <div style={{ color: '#d97706', fontWeight: 600, marginBottom: '4px' }}>
                                    ~ Modified: <code>{node.data?.label || node.id}</code>
                                </div>
                                {changes.map((change, j) => (
                                    <div key={j} style={{ paddingLeft: '12px', fontSize: '0.8rem' }}>
                                        <span style={{ color: '#64748b' }}>{change.key}:</span>{' '}
                                        <span style={{ color: '#ef4444', textDecoration: 'line-through' }}>
                                            {JSON.stringify(change.oldValue)}
                                        </span>
                                        {' → '}
                                        <span style={{ color: '#10b981' }}>
                                            {JSON.stringify(change.newValue)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ))}

                        {diff.nodes.added.length === 0 && diff.nodes.removed.length === 0 && diff.nodes.modified.length === 0 && (
                            <div style={{ color: '#64748b', fontStyle: 'italic' }}>No node changes</div>
                        )}
                    </div>
                )}
            </div>

            {/* Edges Changes */}
            <div>
                <div
                    onClick={() => toggleSection('edges')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', fontWeight: 600, marginBottom: '8px'
                    }}
                >
                    {expandedSections.edges ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    Edges ({diff.edges.added.length + diff.edges.removed.length})
                </div>

                {expandedSections.edges && (
                    <div style={{ paddingLeft: '24px' }}>
                        {diff.edges.added.map((edge, i) => (
                            <div key={`edge-add-${i}`} style={{
                                padding: '8px 12px', marginBottom: '4px', borderRadius: '6px',
                                backgroundColor: '#d1fae5'
                            }}>
                                <span style={{ color: '#10b981', fontWeight: 600 }}>+ </span>
                                <code>{edge.source}</code> → <code>{edge.target}</code>
                            </div>
                        ))}

                        {diff.edges.removed.map((edge, i) => (
                            <div key={`edge-rem-${i}`} style={{
                                padding: '8px 12px', marginBottom: '4px', borderRadius: '6px',
                                backgroundColor: '#fee2e2'
                            }}>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>- </span>
                                <code>{edge.source}</code> → <code>{edge.target}</code>
                            </div>
                        ))}

                        {diff.edges.added.length === 0 && diff.edges.removed.length === 0 && (
                            <div style={{ color: '#64748b', fontStyle: 'italic' }}>No edge changes</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================
// VERSION LIST ITEM
// =====================================================

const VersionListItem = ({ version, isSelected, isCurrent, onSelect, onRollback }) => {
    const formatDate = (iso) => {
        if (!iso) return '';
        const date = new Date(iso);
        return date.toLocaleString();
    };

    return (
        <div
            onClick={() => onSelect(version)}
            style={{
                padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
                cursor: 'pointer', backgroundColor: isSelected ? '#f0f9ff' : 'white',
                borderLeft: isCurrent ? '3px solid #10b981' : '3px solid transparent'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GitCommit size={14} color="#6366f1" />
                        <span style={{ fontWeight: 600 }}>v{version.version}</span>
                        {isCurrent && (
                            <span style={{
                                padding: '2px 6px', borderRadius: '4px',
                                fontSize: '0.65rem', fontWeight: 600,
                                backgroundColor: '#d1fae5', color: '#059669'
                            }}>
                                CURRENT
                            </span>
                        )}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                        {formatDate(version.created_at)}
                    </div>
                </div>

                {version.change_notes && (
                    <div style={{
                        fontSize: '0.75rem', color: '#64748b', maxWidth: '150px',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                    }}>
                        {version.change_notes}
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================
// MAIN VERSION CONTROL COMPONENT
// =====================================================

export const VersionControl = ({ automationId, currentAutomation, onRollback }) => {
    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [compareVersion, setCompareVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showDiff, setShowDiff] = useState(false);
    const [rollbackConfirm, setRollbackConfirm] = useState(null);

    // Load versions
    useEffect(() => {
        if (automationId) {
            loadVersions();
        }
    }, [automationId]);

    const loadVersions = async () => {
        try {
            const data = await getAutomationVersions(automationId);
            setVersions(data);
            if (data.length > 0) {
                setSelectedVersion(data[0]);
                if (data.length > 1) {
                    setCompareVersion(data[1]);
                }
            }
        } catch (error) {
            console.error('Failed to load versions:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle rollback
    const handleRollback = async (version) => {
        try {
            await createAutomationVersion(automationId, {
                graphData: version.graph_data,
                triggerConfig: version.trigger_config,
                changeNotes: `Rollback to v${version.version}`,
                createdBy: 'system'
            });

            await loadVersions();
            if (onRollback) onRollback();
            setRollbackConfirm(null);
        } catch (error) {
            console.error('Failed to rollback:', error);
        }
    };

    // Calculate diff
    const diff = selectedVersion && compareVersion
        ? calculateGraphDiff(compareVersion.graph_data, selectedVersion.graph_data)
        : null;

    const currentVersion = versions.length > 0 ? versions[0] : null;

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" />
                <div style={{ marginTop: '12px' }}>Loading versions...</div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', height: '100%' }}>
            {/* Version List */}
            <div style={{
                width: '280px', borderRight: '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{
                    padding: '16px', borderBottom: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <GitBranch size={18} color="#6366f1" />
                        <span style={{ fontWeight: 700 }}>Version History</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                        {versions.length} version{versions.length !== 1 ? 's' : ''}
                    </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {versions.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
                            No version history
                        </div>
                    ) : (
                        versions.map((version, index) => (
                            <VersionListItem
                                key={version.id}
                                version={version}
                                isSelected={selectedVersion?.id === version.id}
                                isCurrent={index === 0}
                                onSelect={setSelectedVersion}
                                onRollback={() => setRollbackConfirm(version)}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Diff View */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                {selectedVersion ? (
                    <>
                        {/* Toolbar */}
                        <div style={{
                            padding: '12px 16px', borderBottom: '1px solid #e2e8f0',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: '#f8fafc'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <span style={{ fontWeight: 600 }}>v{selectedVersion.version}</span>

                                {versions.length > 1 && (
                                    <>
                                        <span style={{ color: '#64748b' }}>compare with</span>
                                        <select
                                            value={compareVersion?.id || ''}
                                            onChange={(e) => {
                                                const v = versions.find(v => v.id === e.target.value);
                                                setCompareVersion(v);
                                            }}
                                            style={{
                                                padding: '6px 10px', border: '1px solid #e2e8f0',
                                                borderRadius: '6px', fontSize: '0.875rem'
                                            }}
                                        >
                                            {versions.filter(v => v.id !== selectedVersion.id).map(v => (
                                                <option key={v.id} value={v.id}>v{v.version}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {selectedVersion.id !== currentVersion?.id && (
                                    <button
                                        onClick={() => setRollbackConfirm(selectedVersion)}
                                        style={{
                                            padding: '8px 16px', border: '1px solid #e2e8f0',
                                            borderRadius: '8px', backgroundColor: 'white',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                                            fontSize: '0.875rem'
                                        }}
                                    >
                                        <RotateCcw size={14} />
                                        Rollback to v{selectedVersion.version}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                            {/* Version Info */}
                            <div style={{
                                padding: '16px', backgroundColor: '#f8fafc',
                                borderRadius: '8px', marginBottom: '20px'
                            }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Version</div>
                                        <div style={{ fontWeight: 600 }}>v{selectedVersion.version}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Created</div>
                                        <div style={{ fontWeight: 600 }}>
                                            {new Date(selectedVersion.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>By</div>
                                        <div style={{ fontWeight: 600 }}>{selectedVersion.created_by || 'Unknown'}</div>
                                    </div>
                                </div>

                                {selectedVersion.change_notes && (
                                    <div style={{ marginTop: '12px' }}>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Change Notes</div>
                                        <div style={{ marginTop: '4px' }}>{selectedVersion.change_notes}</div>
                                    </div>
                                )}
                            </div>

                            {/* Diff */}
                            {diff && (
                                <div>
                                    <h4 style={{ margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <GitBranch size={16} />
                                        Changes from v{compareVersion.version} to v{selectedVersion.version}
                                    </h4>
                                    <DiffView
                                        diff={diff}
                                        oldVersion={compareVersion}
                                        newVersion={selectedVersion}
                                    />
                                </div>
                            )}

                            {/* Node Preview */}
                            <div style={{ marginTop: '24px' }}>
                                <h4 style={{ margin: '0 0 12px' }}>Workflow Preview</h4>
                                <pre style={{
                                    margin: 0, padding: '16px', backgroundColor: '#1e293b',
                                    borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem',
                                    overflow: 'auto', maxHeight: '300px'
                                }}>
                                    {JSON.stringify({
                                        nodes: selectedVersion.graph_data?.nodes?.map(n => ({
                                            id: n.id,
                                            type: n.type,
                                            label: n.data?.label
                                        })),
                                        edges: selectedVersion.graph_data?.edges?.length
                                    }, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#64748b'
                    }}>
                        Select a version to view changes
                    </div>
                )}
            </div>

            {/* Rollback Confirmation Modal */}
            {rollbackConfirm && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '12px', padding: '24px',
                        width: '400px', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            <AlertTriangle size={24} color="#f59e0b" />
                            <h3 style={{ margin: 0 }}>Confirm Rollback</h3>
                        </div>

                        <p style={{ color: '#64748b', marginBottom: '20px' }}>
                            Are you sure you want to rollback to <strong>v{rollbackConfirm.version}</strong>?
                            This will create a new version with the old configuration.
                        </p>

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => setRollbackConfirm(null)}
                                style={{
                                    padding: '10px 20px', border: '1px solid #e2e8f0',
                                    borderRadius: '8px', backgroundColor: 'white', cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRollback(rollbackConfirm)}
                                style={{
                                    padding: '10px 20px', border: 'none', borderRadius: '8px',
                                    backgroundColor: '#f59e0b', color: 'white', cursor: 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                <RotateCcw size={14} style={{ marginRight: '6px' }} />
                                Confirm Rollback
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VersionControl;
