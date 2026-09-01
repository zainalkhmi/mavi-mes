/**
 * Automation Execution Monitor
 * Real-time dashboard for monitoring workflow executions
 *
 * Part of Phase 2: Advanced Features
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Play, Pause, CheckCircle, XCircle, Clock, AlertTriangle,
    RefreshCw, ChevronRight, ChevronDown, X, Filter, Search,
    Download, Eye, Trash2, RotateCcw, Zap, BarChart3, Activity
} from 'lucide-react';
import { getRecentRuns, getRunWithSteps, getAutomationStats } from '../utils/automationDB';

// =====================================================
// STATUS BADGE
// =====================================================

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { color: '#f59e0b', bg: '#fef3c7', label: 'Pending', icon: Clock },
        running: { color: '#3b82f6', bg: '#dbeafe', label: 'Running', icon: RefreshCw },
        completed: { color: '#10b981', bg: '#d1fae5', label: 'Completed', icon: CheckCircle },
        failed: { color: '#ef4444', bg: '#fee2e2', label: 'Failed', icon: XCircle },
        cancelled: { color: '#6b7280', bg: '#f3f4f6', label: 'Cancelled', icon: X },
        paused: { color: '#8b5cf6', bg: '#ede9fe', label: 'Paused', icon: Pause }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            padding: '4px 10px', borderRadius: '9999px',
            fontSize: '0.75rem', fontWeight: 600,
            color: config.color, backgroundColor: config.bg
        }}>
            <Icon size={12} className={status === 'running' ? 'animate-spin' : ''} />
            {config.label}
        </span>
    );
};

// =====================================================
// RUN DETAIL PANEL
// =====================================================

const RunDetailPanel = ({ run, onClose }) => {
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(false);
    const [runDetails, setRunDetails] = useState(null);

    useEffect(() => {
        if (run) {
            loadRunDetails();
        }
    }, [run?.id]);

    const loadRunDetails = async () => {
        if (!run?.id) return;
        setLoading(true);
        try {
            const details = await getRunWithSteps(run.id);
            setRunDetails(details);
        } catch (error) {
            console.error('Failed to load run details:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!run) return null;

    const formatDuration = (ms) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const formatTime = (iso) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleString();
    };

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: '600px',
            backgroundColor: 'white', boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
            zIndex: 1000, display: 'flex', flexDirection: 'column'
        }}>
            {/* Header */}
            <div style={{
                padding: '20px', borderBottom: '1px solid #e2e8f0',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                backgroundColor: '#f8fafc'
            }}>
                <div>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>
                        Execution Details
                    </h3>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                        {run.automations?.name || 'Unknown Automation'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    style={{
                        padding: '8px', border: 'none', background: 'transparent',
                        cursor: 'pointer', color: '#64748b', borderRadius: '8px'
                    }}
                >
                    <X size={20} />
                </button>
            </div>

            {/* Summary */}
            <div style={{
                padding: '20px', borderBottom: '1px solid #e2e8f0',
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <StatusBadge status={run.status} />
                    <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#64748b' }}>Status</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                        {formatDuration(run.duration_ms)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Duration</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                        {runDetails?.steps?.length || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Steps</div>
                </div>
            </div>

            {/* Times */}
            <div style={{
                padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px',
                fontSize: '0.875rem'
            }}>
                <div>
                    <span style={{ color: '#64748b' }}>Started:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{formatTime(run.started_at)}</span>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Completed:</span>{' '}
                    <span style={{ fontWeight: 600 }}>{formatTime(run.completed_at)}</span>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Trigger:</span>{' '}
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{run.trigger_type}</span>
                </div>
                <div>
                    <span style={{ color: '#64748b' }}>Mode:</span>{' '}
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{run.execution_mode}</span>
                </div>
            </div>

            {/* Error */}
            {run.error_message && (
                <div style={{
                    margin: '16px 20px', padding: '12px', borderRadius: '8px',
                    backgroundColor: '#fee2e2', border: '1px solid #fecaca',
                    display: 'flex', gap: '10px'
                }}>
                    <AlertTriangle size={18} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <div style={{ fontWeight: 600, color: '#dc2626', marginBottom: '4px' }}>
                            {run.error_node_id ? `Error in node: ${run.error_node_id}` : 'Execution Failed'}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#991b1b' }}>
                            {run.error_message}
                        </div>
                    </div>
                </div>
            )}

            {/* Steps */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <h4 style={{ margin: '0 0 16px', fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>
                    Execution Steps
                </h4>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        Loading steps...
                    </div>
                ) : !runDetails?.steps?.length ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No step data available
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {runDetails.steps.map((step, index) => (
                            <div
                                key={step.id}
                                style={{
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '10px',
                                    overflow: 'hidden',
                                    backgroundColor: 'white'
                                }}
                            >
                                <div
                                    onClick={() => setExpanded(expanded === index ? null : index)}
                                    style={{
                                        padding: '12px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        cursor: 'pointer',
                                        backgroundColor: step.status === 'failed' ? '#fef2f2' : 'white'
                                    }}
                                >
                                    <div style={{
                                        width: '24px', height: '24px', borderRadius: '50%',
                                        backgroundColor: step.status === 'completed' ? '#d1fae5' :
                                                       step.status === 'failed' ? '#fee2e2' :
                                                       step.status === 'running' ? '#dbeafe' : '#f3f4f6',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.7rem', fontWeight: 700,
                                        color: step.status === 'completed' ? '#059669' :
                                               step.status === 'failed' ? '#dc2626' :
                                               step.status === 'running' ? '#2563eb' : '#6b7280'
                                    }}>
                                        {index + 1}
                                    </div>

                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                                            {step.node_name || step.node_id}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {step.node_type}
                                        </div>
                                    </div>

                                    <StatusBadge status={step.status} />

                                    <div style={{ fontSize: '0.75rem', color: '#64748b', minWidth: '60px', textAlign: 'right' }}>
                                        {formatDuration(step.duration_ms)}
                                    </div>

                                    {expanded === index ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>

                                {expanded === index && (
                                    <div style={{ padding: '12px 16px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                                        {/* Input */}
                                        {step.input_data && Object.keys(step.input_data).length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                                                    Input
                                                </div>
                                                <pre style={{
                                                    margin: 0, padding: '8px', backgroundColor: '#1e293b',
                                                    borderRadius: '6px', fontSize: '0.75rem', color: '#e2e8f0',
                                                    overflow: 'auto', maxHeight: '150px'
                                                }}>
                                                    {JSON.stringify(step.input_data, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Output */}
                                        {step.output_data && Object.keys(step.output_data).length > 0 && (
                                            <div style={{ marginBottom: '12px' }}>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>
                                                    Output
                                                </div>
                                                <pre style={{
                                                    margin: 0, padding: '8px', backgroundColor: '#1e293b',
                                                    borderRadius: '6px', fontSize: '0.75rem', color: '#10b981',
                                                    overflow: 'auto', maxHeight: '150px'
                                                }}>
                                                    {JSON.stringify(step.output_data, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Error */}
                                        {step.error && (
                                            <div style={{
                                                padding: '8px', backgroundColor: '#fee2e2',
                                                borderRadius: '6px', fontSize: '0.75rem', color: '#dc2626'
                                            }}>
                                                {step.error}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// =====================================================
// STATS CARD
// =====================================================

const StatsCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <div style={{
        padding: '20px', borderRadius: '12px', backgroundColor: 'white',
        border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '8px' }}>{title}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
                {subtitle && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>{subtitle}</div>}
            </div>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                backgroundColor: color + '15', display: 'flex',
                alignItems: 'center', justifyContent: 'center'
            }}>
                <Icon size={24} color={color} />
            </div>
        </div>
    </div>
);

// =====================================================
// MAIN MONITOR COMPONENT
// =====================================================

export const ExecutionMonitor = () => {
    const [runs, setRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRun, setSelectedRun] = useState(null);
    const [filter, setFilter] = useState({ status: '', search: '' });
    const [autoRefresh, setAutoRefresh] = useState(true);

    // Load runs
    const loadRuns = useCallback(async () => {
        try {
            const data = await getRecentRuns({ limit: 50 });
            setRuns(data);
        } catch (error) {
            console.error('Failed to load runs:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadRuns();
    }, [loadRuns]);

    // Auto-refresh
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(loadRuns, 5000);
        return () => clearInterval(interval);
    }, [autoRefresh, loadRuns]);

    // Filter runs
    const filteredRuns = runs.filter(run => {
        if (filter.status && run.status !== filter.status) return false;
        if (filter.search) {
            const search = filter.search.toLowerCase();
            const name = run.automations?.name?.toLowerCase() || '';
            const id = run.id.toLowerCase();
            if (!name.includes(search) && !id.includes(search)) return false;
        }
        return true;
    });

    // Stats
    const stats = {
        total: runs.length,
        running: runs.filter(r => r.status === 'running').length,
        completed: runs.filter(r => r.status === 'completed').length,
        failed: runs.filter(r => r.status === 'failed').length
    };

    const formatDuration = (ms) => {
        if (!ms) return '-';
        if (ms < 1000) return `${ms}ms`;
        if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
        return `${(ms / 60000).toFixed(1)}m`;
    };

    const formatTime = (iso) => {
        if (!iso) return '-';
        const date = new Date(iso);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    return (
        <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={28} />
                        Execution Monitor
                    </h1>
                    <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                        Monitor and debug automation workflow executions
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    {/* Auto Refresh Toggle */}
                    <button
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 16px', border: '1px solid #e2e8f0',
                            borderRadius: '8px', background: autoRefresh ? '#dbeafe' : 'white',
                            cursor: 'pointer', fontSize: '0.875rem',
                            color: autoRefresh ? '#2563eb' : '#64748b'
                        }}
                    >
                        <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
                        Auto Refresh
                    </button>

                    {/* Manual Refresh */}
                    <button
                        onClick={loadRuns}
                        style={{
                            padding: '8px 16px', border: '1px solid #e2e8f0',
                            borderRadius: '8px', background: 'white',
                            cursor: 'pointer', fontSize: '0.875rem'
                        }}
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <StatsCard
                    title="Total Executions"
                    value={stats.total}
                    icon={BarChart3}
                    color="#6366f1"
                />
                <StatsCard
                    title="Running Now"
                    value={stats.running}
                    icon={Play}
                    color="#3b82f6"
                />
                <StatsCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    color="#10b981"
                />
                <StatsCard
                    title="Failed"
                    value={stats.failed}
                    icon={XCircle}
                    color="#ef4444"
                />
            </div>

            {/* Filters */}
            <div style={{
                padding: '16px', borderRadius: '12px', backgroundColor: 'white',
                border: '1px solid #e2e8f0', marginBottom: '16px',
                display: 'flex', gap: '12px', alignItems: 'center'
            }}>
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="Search by automation name or run ID..."
                        value={filter.search}
                        onChange={(e) => setFilter(f => ({ ...f, search: e.target.value }))}
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px',
                            border: '1px solid #e2e8f0', borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                <select
                    value={filter.status}
                    onChange={(e) => setFilter(f => ({ ...f, status: e.target.value }))}
                    style={{
                        padding: '10px 16px', border: '1px solid #e2e8f0',
                        borderRadius: '8px', fontSize: '0.875rem', backgroundColor: 'white'
                    }}
                >
                    <option value="">All Status</option>
                    <option value="running">Running</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            {/* Runs Table */}
            <div style={{
                borderRadius: '12px', backgroundColor: 'white',
                border: '1px solid #e2e8f0', overflow: 'hidden'
            }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '12px' }} />
                        <div>Loading executions...</div>
                    </div>
                ) : filteredRuns.length === 0 ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                        <Activity size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
                        <div>No executions found</div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Automation</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Trigger</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Duration</th>
                                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Started</th>
                                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRuns.map(run => (
                                <tr
                                    key={run.id}
                                    style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                                    onClick={() => setSelectedRun(run)}
                                >
                                    <td style={{ padding: '16px' }}>
                                        <StatusBadge status={run.status} />
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                            {run.automations?.name || 'Unknown'}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>
                                            {run.id.slice(0, 8)}...
                                        </div>
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px',
                                            fontSize: '0.75rem', fontWeight: 500,
                                            backgroundColor: '#f1f5f9', color: '#64748b',
                                            textTransform: 'capitalize'
                                        }}>
                                            {run.trigger_type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontFamily: 'monospace' }}>
                                        {formatDuration(run.duration_ms)}
                                    </td>
                                    <td style={{ padding: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                                        {formatTime(run.started_at)}
                                    </td>
                                    <td style={{ padding: '16px', textAlign: 'right' }}>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedRun(run); }}
                                            style={{
                                                padding: '6px 12px', border: 'none', borderRadius: '6px',
                                                backgroundColor: '#6366f1', color: 'white',
                                                cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500
                                            }}
                                        >
                                            <Eye size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Detail Panel */}
            {selectedRun && (
                <RunDetailPanel
                    run={selectedRun}
                    onClose={() => setSelectedRun(null)}
                />
            )}
        </div>
    );
};

export default ExecutionMonitor;
