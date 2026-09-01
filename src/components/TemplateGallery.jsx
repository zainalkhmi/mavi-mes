/**
 * Automation Templates & Marketplace
 * Pre-built workflow templates for common use cases
 *
 * Part of Phase 3: Workflow Marketplace
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Zap, Search, Download, Plus, Clock, AlertTriangle,
    CheckCircle, MessageSquare, Database, Mail, FileSpreadsheet,
    Bot, BarChart3, Bell, ShoppingCart, Settings, Users,
    Filter, Grid, List, Star, ChevronRight, Tag, Copy
} from 'lucide-react';
import { createAutomation } from '../utils/automationDB';

// =====================================================
// TEMPLATE DEFINITIONS
// =====================================================

export const WORKFLOW_TEMPLATES = [
    // Production & Manufacturing
    {
        id: 'erp-sync',
        name: 'ERP Sync Workflow',
        description: 'Synchronize work orders between Odoo/SAP and MES system',
        category: 'production',
        icon: Database,
        color: '#6366f1',
        tags: ['ERP', 'Odoo', 'SAP', 'Sync'],
        popularity: 95,
        estimatedTime: '15 min setup',
        difficulty: 'Medium',
        nodes: [
            { type: 'event', data: { triggerType: 'TIMER', label: 'Schedule Sync', cron: '0 */30 * * * *' } },
            { type: 'database', data: { label: 'Query WO Changes' } },
            { type: 'action', data: { type: 'ERP_CRM', label: 'Push to ERP' } },
            { type: 'action', data: { type: 'HTTP_REQUEST', label: 'Confirm Sync' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 }
        ]
    },
    {
        id: 'qc-alert',
        name: 'QC Alert Workflow',
        description: 'Send alerts when quality inspection fails',
        category: 'quality',
        icon: AlertTriangle,
        color: '#ef4444',
        tags: ['QC', 'Alert', 'Quality'],
        popularity: 90,
        estimatedTime: '10 min setup',
        difficulty: 'Easy',
        nodes: [
            { type: 'event', data: { triggerType: 'WEBHOOK', label: 'QC Webhook' } },
            { type: 'decision', data: { label: 'Pass/Fail?' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Alert Team' } },
            { type: 'action', data: { type: 'GOOGLE_SHEETS', label: 'Log Result' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2, label: 'Fail' },
            { source: 2, target: 3 }
        ]
    },
    {
        id: 'shift-report',
        name: 'Shift Handoff Report',
        description: 'Generate and send shift production report',
        category: 'reporting',
        icon: BarChart3,
        color: '#10b981',
        tags: ['Report', 'Daily', 'Summary'],
        popularity: 88,
        estimatedTime: '20 min setup',
        difficulty: 'Easy',
        nodes: [
            { type: 'event', data: { triggerType: 'TIMER', label: 'Daily 17:00', cron: '0 0 17 * * *' } },
            { type: 'database', data: { label: 'Query Completions' } },
            { type: 'action', data: { type: 'transform', label: 'Format Report' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Send Report' } },
            { type: 'action', data: { type: 'EMAIL', label: 'Email Manager' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 },
            { source: 2, target: 4 }
        ]
    },

    // Notifications
    {
        id: 'telegram-notify',
        name: 'Telegram Team Notifications',
        description: 'Send formatted notifications to Telegram groups',
        category: 'notifications',
        icon: MessageSquare,
        color: '#0088cc',
        tags: ['Telegram', 'Notify', 'Alert'],
        popularity: 85,
        estimatedTime: '5 min setup',
        difficulty: 'Easy',
        nodes: [
            { type: 'event', data: { triggerType: 'WEBHOOK', label: 'Trigger Webhook' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Send Message' } }
        ],
        edges: [
            { source: 0, target: 1 }
        ]
    },
    {
        id: 'slack-alerts',
        name: 'Slack Production Alerts',
        description: 'Post alerts to Slack channel for production issues',
        category: 'notifications',
        icon: Bell,
        color: '#4A154B',
        tags: ['Slack', 'Alert', 'Production'],
        popularity: 82,
        estimatedTime: '10 min setup',
        difficulty: 'Easy',
        nodes: [
            { type: 'event', data: { triggerType: 'MACHINE_TRIGGER', label: 'Machine Alert' } },
            { type: 'filter', data: { label: 'Filter Severity' } },
            { type: 'action', data: { type: 'SLACK', label: 'Post to Slack' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 }
        ]
    },

    // Data & Integrations
    {
        id: 'sheets-sync',
        name: 'Google Sheets Production Log',
        description: 'Log production data to Google Sheets',
        category: 'data',
        icon: FileSpreadsheet,
        color: '#0F9D58',
        tags: ['Google Sheets', 'Log', 'Data'],
        popularity: 80,
        estimatedTime: '15 min setup',
        difficulty: 'Medium',
        nodes: [
            { type: 'event', data: { triggerType: 'TABLE_ROW_ADDED', label: 'New Record' } },
            { type: 'action', data: { type: 'GOOGLE_SHEETS', action: 'appendRow', label: 'Append to Sheet' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Confirm' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 }
        ]
    },
    {
        id: 'email-report',
        name: 'Email Production Summary',
        description: 'Send daily production summary via email',
        category: 'reporting',
        icon: Mail,
        color: '#EA4335',
        tags: ['Email', 'Report', 'Daily'],
        popularity: 78,
        estimatedTime: '15 min setup',
        difficulty: 'Medium',
        nodes: [
            { type: 'event', data: { triggerType: 'TIMER', label: 'Daily Report' } },
            { type: 'database', data: { label: 'Aggregate Data' } },
            { type: 'action', data: { type: 'EMAIL', label: 'Send Email' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 }
        ]
    },

    // AI & Automation
    {
        id: 'ai-qc',
        name: 'AI Quality Inspection',
        description: 'Use AI to analyze inspection images and make pass/fail decisions',
        category: 'ai',
        icon: Bot,
        color: '#a855f7',
        tags: ['AI', 'Vision', 'Quality'],
        popularity: 75,
        estimatedTime: '30 min setup',
        difficulty: 'Advanced',
        nodes: [
            { type: 'event', data: { triggerType: 'WEBHOOK', label: 'Image Received' } },
            { type: 'ai_agent', data: { label: 'AI Analysis', model: 'gemini-1.5-pro' } },
            { type: 'decision', data: { label: 'Pass/Fail?' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Notify' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 }
        ]
    },
    {
        id: 'smart-andon',
        name: 'Smart Andon System',
        description: 'Advanced Andon with escalation and auto-resolution',
        category: 'production',
        icon: Zap,
        color: '#f59e0b',
        tags: ['Andon', 'Escalation', 'Smart'],
        popularity: 72,
        estimatedTime: '25 min setup',
        difficulty: 'Advanced',
        nodes: [
            { type: 'event', data: { triggerType: 'MACHINE_TRIGGER', label: 'Machine Alert' } },
            { type: 'ai_agent', data: { label: 'AI Root Cause' } },
            { type: 'action', data: { type: 'SLACK', label: 'Notify Team' } },
            { type: 'wait', data: { label: 'Wait 30 min' } },
            { type: 'decision', data: { label: 'Resolved?' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 },
            { source: 3, target: 4 }
        ]
    },

    // Maintenance
    {
        id: 'maintenance-schedule',
        name: 'Maintenance Scheduler',
        description: 'Schedule and remind for preventive maintenance',
        category: 'maintenance',
        icon: Settings,
        color: '#6b7280',
        tags: ['Maintenance', 'Schedule', 'Reminder'],
        popularity: 70,
        estimatedTime: '20 min setup',
        difficulty: 'Medium',
        nodes: [
            { type: 'event', data: { triggerType: 'TIMER', label: 'Weekly Check' } },
            { type: 'database', data: { label: 'Get Due PMs' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Remind Tech' } },
            { type: 'action', data: { type: 'EMAIL', label: 'CC Supervisor' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 1, target: 3 }
        ]
    },
    {
        id: 'purchase-request',
        name: 'Low Stock Purchase Request',
        description: 'Auto-create purchase requests when inventory is low',
        category: 'inventory',
        icon: ShoppingCart,
        color: '#8b5cf6',
        tags: ['Inventory', 'Purchase', 'Auto'],
        popularity: 68,
        estimatedTime: '20 min setup',
        difficulty: 'Medium',
        nodes: [
            { type: 'event', data: { triggerType: 'WEBHOOK', label: 'Low Stock Alert' } },
            { type: 'ai_agent', data: { label: 'Suggest Vendor' } },
            { type: 'action', data: { type: 'HTTP_REQUEST', label: 'Create PO' } },
            { type: 'action', data: { type: 'TELEGRAM', label: 'Notify Buyer' } }
        ],
        edges: [
            { source: 0, target: 1 },
            { source: 1, target: 2 },
            { source: 2, target: 3 }
        ]
    }
];

// =====================================================
// CATEGORY INFO
// =====================================================

const CATEGORY_INFO = {
    production: { label: 'Production', icon: Zap, color: '#6366f1' },
    quality: { label: 'Quality', icon: CheckCircle, color: '#10b981' },
    reporting: { label: 'Reporting', icon: BarChart3, color: '#3b82f6' },
    notifications: { label: 'Notifications', icon: Bell, color: '#f59e0b' },
    data: { label: 'Data & Sheets', icon: FileSpreadsheet, color: '#0F9D58' },
    ai: { label: 'AI & Automation', icon: Bot, color: '#a855f7' },
    maintenance: { label: 'Maintenance', icon: Settings, color: '#6b7280' },
    inventory: { label: 'Inventory', icon: ShoppingCart, color: '#8b5cf6' }
};

// =====================================================
// TEMPLATE CARD
// =====================================================

const TemplateCard = ({ template, onUse, onPreview }) => {
    const CategoryIcon = CATEGORY_INFO[template.category]?.icon || Zap;
    const categoryInfo = CATEGORY_INFO[template.category] || {};

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            backgroundColor: 'white',
            transition: 'all 0.2s',
            cursor: 'pointer'
        }}
        onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={e => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'none';
        }}
        >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{
                    width: '44px', height: '44px', borderRadius: '10px',
                    backgroundColor: template.color + '15',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <template.icon size={22} color={template.color} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Star size={12} fill="#f59e0b" color="#f59e0b" />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>
                        {template.popularity}
                    </span>
                </div>
            </div>

            {/* Title & Description */}
            <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 700, color: '#1e293b' }}>
                {template.name}
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                {template.description}
            </p>

            {/* Tags */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '16px' }}>
                {template.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                        padding: '2px 8px', borderRadius: '9999px',
                        fontSize: '0.65rem', fontWeight: 500,
                        backgroundColor: '#f1f5f9', color: '#64748b'
                    }}>
                        {tag}
                    </span>
                ))}
            </div>

            {/* Meta */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '0.75rem', color: '#64748b' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {template.estimatedTime}
                </span>
                <span style={{
                    padding: '2px 8px', borderRadius: '4px',
                    backgroundColor: template.difficulty === 'Easy' ? '#d1fae5' :
                                   template.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                    color: template.difficulty === 'Easy' ? '#059669' :
                           template.difficulty === 'Medium' ? '#d97706' : '#dc2626'
                }}>
                    {template.difficulty}
                </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={() => onUse(template)}
                    style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '8px',
                        backgroundColor: template.color, color: 'white',
                        fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}
                >
                    <Plus size={14} />
                    Use Template
                </button>
                <button
                    onClick={() => onPreview(template)}
                    style={{
                        padding: '10px 14px', border: '1px solid #e2e8f0',
                        borderRadius: '8px', backgroundColor: 'white',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

// =====================================================
// TEMPLATE PREVIEW MODAL
// =====================================================

const TemplatePreviewModal = ({ template, onClose, onUse }) => {
    const [view, setView] = useState('preview');

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '16px', width: '700px', maxHeight: '90vh',
                overflow: 'auto', boxShadow: '0 25px 50px rgba(0,0,0,0.25)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '24px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '14px',
                            backgroundColor: template.color + '15',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <template.icon size={28} color={template.color} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                                {template.name}
                            </h2>
                            <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                                {template.description}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px', border: 'none', background: 'transparent',
                            cursor: 'pointer', color: '#64748b', borderRadius: '8px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
                    {['preview', 'nodes', 'code'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setView(tab)}
                            style={{
                                padding: '12px 24px', border: 'none', cursor: 'pointer',
                                background: 'transparent', fontWeight: 600,
                                color: view === tab ? template.color : '#64748b',
                                borderBottom: view === tab ? `2px solid ${template.color}` : '2px solid transparent'
                            }}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div style={{ padding: '24px' }}>
                    {view === 'preview' && (
                        <div>
                            {/* Visual preview */}
                            <div style={{
                                backgroundColor: '#f8fafc', borderRadius: '12px', padding: '24px',
                                marginBottom: '24px', display: 'flex', justifyContent: 'center',
                                gap: '16px', alignItems: 'center', flexWrap: 'wrap'
                            }}>
                                {template.nodes.map((node, i) => (
                                    <React.Fragment key={i}>
                                        <div style={{
                                            padding: '12px 16px', borderRadius: '8px',
                                            backgroundColor: '#e2e8f0',
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            minWidth: '120px'
                                        }}>
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                                                {node.data?.label || node.type}
                                            </span>
                                        </div>
                                        {i < template.nodes.length - 1 && (
                                            <ChevronRight size={20} color="#94a3b8" />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>

                            {/* Meta info */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Category</div>
                                    <div style={{ fontWeight: 600 }}>{CATEGORY_INFO[template.category]?.label}</div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Nodes</div>
                                    <div style={{ fontWeight: 600 }}>{template.nodes.length} steps</div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Setup Time</div>
                                    <div style={{ fontWeight: 600 }}>{template.estimatedTime}</div>
                                </div>
                                <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Difficulty</div>
                                    <div style={{ fontWeight: 600 }}>{template.difficulty}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'nodes' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {template.nodes.map((node, i) => (
                                <div key={i} style={{
                                    padding: '16px', border: '1px solid #e2e8f0',
                                    borderRadius: '8px', display: 'flex', gap: '16px'
                                }}>
                                    <div style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        backgroundColor: template.color, color: 'white',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
                                    }}>
                                        {i + 1}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                            {node.data?.label || node.type}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                            Type: <code style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{node.type}</code>
                                        </div>
                                        {node.data?.cron && (
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
                                                Schedule: <code>{node.data.cron}</code>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'code' && (
                        <pre style={{
                            margin: 0, padding: '16px', backgroundColor: '#1e293b',
                            borderRadius: '8px', color: '#e2e8f0', fontSize: '0.8rem',
                            overflow: 'auto', maxHeight: '400px'
                        }}>
{JSON.stringify({
    name: template.name,
    nodes: template.nodes.map(n => ({ type: n.type, ...n.data })),
    edges: template.edges
}, null, 2)}
                        </pre>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px 24px', borderTop: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'flex-end', gap: '12px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px', border: '1px solid #e2e8f0',
                            borderRadius: '8px', backgroundColor: 'white',
                            cursor: 'pointer', fontWeight: 600
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onUse(template)}
                        style={{
                            padding: '10px 20px', border: 'none', borderRadius: '8px',
                            backgroundColor: template.color, color: 'white',
                            cursor: 'pointer', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                    >
                        <Copy size={14} />
                        Use This Template
                    </button>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// MAIN TEMPLATE GALLERY COMPONENT
// =====================================================

export const TemplateGallery = ({ onSelectTemplate }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [viewMode, setViewMode] = useState('grid');
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [loading, setLoading] = useState(false);

    // Filter templates
    const filteredTemplates = WORKFLOW_TEMPLATES.filter(t => {
        const matchesSearch = !search ||
            t.name.toLowerCase().includes(search.toLowerCase()) ||
            t.description.toLowerCase().includes(search.toLowerCase()) ||
            t.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()));

        const matchesCategory = category === 'all' || t.category === category;

        return matchesSearch && matchesCategory;
    });

    // Sort by popularity
    const sortedTemplates = [...filteredTemplates].sort((a, b) => b.popularity - a.popularity);

    // Handle use template
    const handleUseTemplate = async (template) => {
        setLoading(true);
        try {
            // Save active template into localStorage for WorkflowEditor
            localStorage.setItem('mandor_active_workflow_template', JSON.stringify(template));

            if (onSelectTemplate) {
                await onSelectTemplate(template);
            } else {
                // Navigate directly to workflow editor canvas
                navigate('/automations/editor');
            }
        } catch (error) {
            console.error('Failed to use template:', error);
        } finally {
            setLoading(false);
            setSelectedTemplate(null);
        }
    };

    return (
        <div style={{ padding: '24px', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
            {/* Header */}
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Zap size={28} color="#6366f1" />
                    Workflow Templates
                </h1>
                <p style={{ margin: '4px 0 0', color: '#64748b' }}>
                    Pre-built automation workflows to speed up your MES integration
                </p>
            </div>

            {/* Filters */}
            <div style={{
                padding: '16px', backgroundColor: 'white', borderRadius: '12px',
                border: '1px solid #e2e8f0', marginBottom: '24px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '16px'
            }}>
                {/* Search */}
                <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            width: '100%', padding: '10px 12px 10px 36px',
                            border: '1px solid #e2e8f0', borderRadius: '8px',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>

                {/* Category Filter */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setCategory('all')}
                        style={{
                            padding: '8px 16px', border: '1px solid',
                            borderColor: category === 'all' ? '#6366f1' : '#e2e8f0',
                            borderRadius: '8px', backgroundColor: category === 'all' ? '#6366f1' : 'white',
                            color: category === 'all' ? 'white' : '#64748b',
                            cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem'
                        }}
                    >
                        All
                    </button>
                    {Object.entries(CATEGORY_INFO).map(([key, info]) => (
                        <button
                            key={key}
                            onClick={() => setCategory(key)}
                            style={{
                                padding: '8px 16px', border: '1px solid',
                                borderColor: category === key ? info.color : '#e2e8f0',
                                borderRadius: '8px', backgroundColor: category === key ? info.color : 'white',
                                color: category === key ? 'white' : '#64748b',
                                cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem',
                                display: 'flex', alignItems: 'center', gap: '6px'
                            }}
                        >
                            <info.icon size={14} />
                            {info.label}
                        </button>
                    ))}
                </div>

                {/* View Mode */}
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={() => setViewMode('grid')}
                        style={{
                            padding: '8px', border: 'none', borderRadius: '6px',
                            backgroundColor: viewMode === 'grid' ? '#e2e8f0' : 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        <Grid size={16} color={viewMode === 'grid' ? '#1e293b' : '#64748b'} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            padding: '8px', border: 'none', borderRadius: '6px',
                            backgroundColor: viewMode === 'list' ? '#e2e8f0' : 'transparent',
                            cursor: 'pointer'
                        }}
                    >
                        <List size={16} color={viewMode === 'list' ? '#1e293b' : '#64748b'} />
                    </button>
                </div>
            </div>

            {/* Results count */}
            <div style={{ marginBottom: '16px', color: '#64748b', fontSize: '0.875rem' }}>
                Showing {sortedTemplates.length} of {WORKFLOW_TEMPLATES.length} templates
            </div>

            {/* Templates Grid */}
            <div style={{
                display: viewMode === 'grid' ? 'grid' : 'flex',
                gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : undefined,
                flexDirection: viewMode === 'list' ? 'column' : undefined,
                gap: '16px'
            }}>
                {sortedTemplates.map(template => (
                    <TemplateCard
                        key={template.id}
                        template={template}
                        onUse={handleUseTemplate}
                        onPreview={setSelectedTemplate}
                    />
                ))}
            </div>

            {/* Empty state */}
            {sortedTemplates.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '60px', backgroundColor: 'white',
                    borderRadius: '12px', border: '1px solid #e2e8f0'
                }}>
                    <Search size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>
                        No templates found
                    </div>
                    <div style={{ color: '#94a3b8', marginTop: '8px' }}>
                        Try adjusting your search or filter
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {selectedTemplate && (
                <TemplatePreviewModal
                    template={selectedTemplate}
                    onClose={() => setSelectedTemplate(null)}
                    onUse={handleUseTemplate}
                />
            )}
        </div>
    );
};

export default TemplateGallery;
