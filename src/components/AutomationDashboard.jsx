/**
 * Automation Dashboard
 * Main hub for automation features
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Cpu, Workflow, ActivitySquare, Key, LayoutTemplate,
    Play, CheckCircle, XCircle, Clock, Zap, ArrowRight,
    BarChart3, Settings, Plus, RefreshCw
} from 'lucide-react';
import { getDashboardSummary, getAutomations } from '../utils/automationDB';

// =====================================================
// STATS CARD
// =====================================================

const StatsCard = ({ title, value, icon: Icon, color, subtitle, link }) => {
    const content = (
        <div style={{
            padding: '20px', borderRadius: '12px', backgroundColor: 'white',
            border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            transition: 'all 0.2s', cursor: link ? 'pointer' : 'default'
        }}
        className={link ? 'hover:shadow-lg hover:-translate-y-0.5' : ''}
        >
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

    if (link) {
        return <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link>;
    }

    return content;
};

// =====================================================
// QUICK ACTION CARD
// =====================================================

const QuickActionCard = ({ title, description, icon: Icon, color, link }) => {
    return (
        <Link
            to={link}
            style={{
                display: 'block', padding: '20px', borderRadius: '12px',
                backgroundColor: 'white', border: '1px solid #e2e8f0',
                textDecoration: 'none', transition: 'all 0.2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}
            className="hover:shadow-lg hover:-translate-y-0.5"
        >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    backgroundColor: color + '15', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                    <Icon size={24} color={color} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1e293b', marginBottom: '4px' }}>
                        {title}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                        {description}
                    </div>
                </div>
                <ArrowRight size={20} color="#94a3b8" style={{ flexShrink: 0, marginTop: '4px' }} />
            </div>
        </Link>
    );
};

// =====================================================
// RECENT RUN ITEM
// =====================================================

const RecentRunItem = ({ run }) => {
    const statusColors = {
        completed: { bg: '#d1fae5', color: '#059669' },
        failed: { bg: '#fee2e2', color: '#dc2626' },
        running: { bg: '#dbeafe', color: '#2563eb' },
        cancelled: { bg: '#f3f4f6', color: '#6b7280' }
    };

    const status = statusColors[run.status] || statusColors.running;

    return (
        <div style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9'
        }}>
            <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                    {run.automations?.name || 'Unknown'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(run.started_at).toLocaleString()}
                </div>
            </div>
            <span style={{
                padding: '4px 10px', borderRadius: '9999px',
                fontSize: '0.75rem', fontWeight: 600,
                backgroundColor: status.bg, color: status.color
            }}>
                {run.status}
            </span>
        </div>
    );
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export const AutomationDashboard = () => {
    const [summary, setSummary] = useState(null);
    const [automations, setAutomations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [summaryData, autoData] = await Promise.all([
                getDashboardSummary(),
                getAutomations()
            ]);
            setSummary(summaryData);
            setAutomations(autoData);
        } catch (error) {
            console.error('Failed to load automation data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                <RefreshCw size={24} className="animate-spin" style={{ marginBottom: '12px' }} />
                <div>Loading automation dashboard...</div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Cpu size={28} color="#6366f1" />
                    Automation Hub
                </h1>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Manage your workflow automations, monitor executions, and configure connectors
                </p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <StatsCard
                    title="Total Automations"
                    value={summary?.totalAutomations || 0}
                    icon={Workflow}
                    color="#6366f1"
                    subtitle={`${summary?.activeAutomations || 0} active`}
                    link="/automations"
                />
                <StatsCard
                    title="Today's Runs"
                    value={summary?.todayRuns?.total || 0}
                    icon={ActivitySquare}
                    color="#3b82f6"
                    subtitle={`${summary?.todayRuns?.completed || 0} completed`}
                    link="/automations/monitor"
                />
                <StatsCard
                    title="Success Rate"
                    value={
                        summary?.todayRuns?.total > 0
                            ? Math.round((summary?.todayRuns?.completed / summary?.todayRuns?.total) * 100) + '%'
                            : '-'
                    }
                    icon={CheckCircle}
                    color="#10b981"
                />
                <StatsCard
                    title="Failed Today"
                    value={summary?.todayRuns?.failed || 0}
                    icon={XCircle}
                    color="#ef4444"
                />
            </div>

            {/* Quick Actions */}
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>
                    Quick Actions
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <QuickActionCard
                        title="Workflow Editor"
                        description="Create and edit automation workflows with visual drag-and-drop editor"
                        icon={Workflow}
                        color="#6366f1"
                        link="/automations"
                    />
                    <QuickActionCard
                        title="Execution Monitor"
                        description="View real-time execution logs and debug workflow runs"
                        icon={ActivitySquare}
                        color="#3b82f6"
                        link="/automations/monitor"
                    />
                    <QuickActionCard
                        title="Templates Gallery"
                        description="Browse pre-built workflow templates for common use cases"
                        icon={LayoutTemplate}
                        color="#10b981"
                        link="/automations/templates"
                    />
                    <QuickActionCard
                        title="Credentials Manager"
                        description="Manage API keys and authentication for external services"
                        icon={Key}
                        color="#f59e0b"
                        link="/automations/credentials"
                    />
                </div>
            </div>

            {/* Recent Activity & Automations */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                {/* Recent Runs */}
                <div style={{
                    borderRadius: '12px', backgroundColor: 'white',
                    border: '1px solid #e2e8f0', overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ActivitySquare size={18} color="#3b82f6" />
                            Recent Executions
                        </h3>
                        <Link
                            to="/automations/monitor"
                            style={{
                                fontSize: '0.875rem', color: '#3b82f6',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {summary?.recentRuns?.length > 0 ? (
                        summary.recentRuns.slice(0, 5).map(run => (
                            <RecentRunItem key={run.id} run={run} />
                        ))
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No recent executions
                        </div>
                    )}
                </div>

                {/* My Automations */}
                <div style={{
                    borderRadius: '12px', backgroundColor: 'white',
                    border: '1px solid #e2e8f0', overflow: 'hidden'
                }}>
                    <div style={{
                        padding: '16px 20px', borderBottom: '1px solid #e2e8f0',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Workflow size={18} color="#6366f1" />
                            My Workflows
                        </h3>
                        <Link
                            to="/automations"
                            style={{
                                fontSize: '0.875rem', color: '#6366f1',
                                textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px'
                            }}
                        >
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {automations.length > 0 ? (
                        <div>
                            {automations.slice(0, 5).map(auto => (
                                <Link
                                    key={auto.id}
                                    to={`/automations?edit=${auto.id}`}
                                    style={{
                                        padding: '12px 16px', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        borderBottom: '1px solid #f1f5f9',
                                        textDecoration: 'none'
                                    }}
                                >
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                                            {auto.name}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {auto.description || 'No description'}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '9999px',
                                        fontSize: '0.75rem', fontWeight: 600,
                                        backgroundColor: auto.is_active ? '#d1fae5' : '#f3f4f6',
                                        color: auto.is_active ? '#059669' : '#6b7280'
                                    }}>
                                        {auto.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                            No automations yet
                        </div>
                    )}
                </div>
            </div>

            {/* Connectors Info */}
            <div style={{
                marginTop: '32px', padding: '20px', borderRadius: '12px',
                backgroundColor: '#1e293b', color: 'white'
            }}>
                <h3 style={{ margin: '0 0 12px', fontSize: '1rem', fontWeight: 700 }}>
                    Available Connectors
                </h3>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {[
                        { name: 'Telegram', icon: '📱', color: '#0088cc' },
                        { name: 'Slack', icon: '💬', color: '#4A154B' },
                        { name: 'Google Sheets', icon: '📊', color: '#0F9D58' },
                        { name: 'Email', icon: '📧', color: '#EA4335' },
                        { name: 'Odoo', icon: '🏢', color: '#714B67' },
                        { name: 'SAP', icon: '📦', color: '#0070F3' },
                    ].map(connector => (
                        <div
                            key={connector.name}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.1)'
                            }}
                        >
                            <span style={{ fontSize: '1.25rem' }}>{connector.icon}</span>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{connector.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AutomationDashboard;
