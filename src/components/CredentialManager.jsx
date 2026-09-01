/**
 * Automation Credential Manager
 * UI Component for managing connector credentials
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Key, CheckCircle, XCircle, RefreshCw, Eye, EyeOff, X } from 'lucide-react';
import { getCredentials, createCredential, updateCredential, deleteCredential, getCredentialById } from '../utils/automationDB';
import { validateCredential } from '../utils/automationConnectorExecutor';

// =====================================================
// CONNECTOR CONFIG FORMATS
// =====================================================

const CONNECTOR_FIELDS = {
    telegram: [
        { key: 'botToken', label: 'Bot Token', type: 'password', placeholder: '123456:ABC-DEF...', required: true }
    ],
    slack: [
        { key: 'webhookUrl', label: 'Webhook URL', type: 'url', placeholder: 'https://hooks.slack.com/...' },
        { key: 'token', label: 'Bot Token (xoxb-...)', type: 'password', placeholder: 'xoxb-...' }
    ],
    google_sheets: [
        { key: 'serviceAccount', label: 'Service Account JSON', type: 'json', placeholder: '{"type": "service_account", ...}', required: true }
    ],
    email: [
        { key: 'provider', label: 'Provider', type: 'select', options: ['sendgrid', 'mailgun', 'brevo', 'smtpjs'], required: true },
        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'SG.xxx...' },
        { key: 'domain', label: 'Domain (Mailgun only)', type: 'text', placeholder: 'mg.yourdomain.com' },
        { key: 'host', label: 'SMTP Host', type: 'text', placeholder: 'smtp.gmail.com' },
        { key: 'port', label: 'SMTP Port', type: 'number', placeholder: '587' },
        { key: 'username', label: 'SMTP Username', type: 'text', placeholder: 'user@gmail.com' },
        { key: 'password', label: 'SMTP Password', type: 'password', placeholder: 'app password' },
        { key: 'secureToken', label: 'SMTP.js SecureToken', type: 'password', placeholder: 'from smtpjs.com' }
    ]
};

const CONNECTOR_INFO = {
    telegram: { name: 'Telegram', icon: '📱', color: '#0088cc', description: 'Send messages via Telegram Bot API' },
    slack: { name: 'Slack', icon: '💬', color: '#4A154B', description: 'Send messages via Slack Webhook or Bot API' },
    google_sheets: { name: 'Google Sheets', icon: '📊', color: '#0F9D58', description: 'Read/Write data to Google Sheets' },
    email: { name: 'Email', icon: '📧', color: '#EA4335', description: 'Send emails via SendGrid, Mailgun, Brevo, SMTP' }
};

// =====================================================
// CREDENTIAL CARD
// =====================================================

const CredentialCard = ({ credential, onEdit, onDelete, onValidate }) => {
    const [validating, setValidating] = useState(false);
    const [validationResult, setValidationResult] = useState(null);
    const info = CONNECTOR_INFO[credential.type] || {};

    const handleValidate = async () => {
        setValidating(true);
        setValidationResult(null);
        const result = await validateCredential(credential.id);
        setValidationResult(result);
        setValidating(false);
    };

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            backgroundColor: 'white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        backgroundColor: info.color || '#6366f1',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px', color: 'white'
                    }}>
                        {info.icon}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{credential.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{info.name}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                        onClick={handleValidate}
                        disabled={validating}
                        style={{
                            padding: '6px', border: 'none', background: 'transparent',
                            cursor: validating ? 'wait' : 'pointer', color: '#64748b',
                            borderRadius: '6px'
                        }}
                        title="Validate"
                    >
                        {validating ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    </button>
                    <button
                        onClick={() => onEdit(credential)}
                        style={{
                            padding: '6px', border: 'none', background: 'transparent',
                            cursor: 'pointer', color: '#64748b', borderRadius: '6px'
                        }}
                        title="Edit"
                    >
                        <Edit2 size={16} />
                    </button>
                    <button
                        onClick={() => onDelete(credential.id)}
                        style={{
                            padding: '6px', border: 'none', background: 'transparent',
                            cursor: 'pointer', color: '#ef4444', borderRadius: '6px'
                        }}
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {credential.config_preview && (
                <div style={{
                    fontSize: '0.75rem', color: '#64748b', backgroundColor: '#f8fafc',
                    padding: '8px', borderRadius: '6px', marginBottom: '12px',
                    fontFamily: 'monospace'
                }}>
                    {Object.entries(credential.config_preview).map(([key, value]) => (
                        <div key={key}>
                            <span style={{ color: '#94a3b8' }}>{key}:</span> {String(value)}
                        </div>
                    ))}
                </div>
            )}

            {validationResult && (
                <div style={{
                    padding: '8px', borderRadius: '6px', fontSize: '0.75rem',
                    backgroundColor: validationResult.valid ? '#dcfce7' : '#fee2e2',
                    color: validationResult.valid ? '#166534' : '#dc2626',
                    display: 'flex', alignItems: 'center', gap: '6px'
                }}>
                    {validationResult.valid ? <CheckCircle size={14} /> : <XCircle size={14} />}
                    {validationResult.valid ? 'Credential valid!' : validationResult.error}
                </div>
            )}

            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '8px' }}>
                Last used: {credential.last_used_at ? new Date(credential.last_used_at).toLocaleString() : 'Never'}
            </div>
        </div>
    );
};

// =====================================================
// CREDENTIAL FORM MODAL
// =====================================================

const CredentialFormModal = ({ type, credential, onSave, onClose }) => {
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [showJson, setShowJson] = useState(false);

    useEffect(() => {
        if (credential) {
            // Editing existing
            const config = credential.encrypted_config || {};
            setFormData({
                name: credential.name,
                ...config
            });
        } else {
            // New credential
            setFormData({ name: '' });
        }
    }, [credential, type]);

    const fields = CONNECTOR_FIELDS[type] || [];
    const info = CONNECTOR_INFO[type] || {};

    const handleChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleJsonChange = (jsonString) => {
        try {
            const parsed = JSON.parse(jsonString);
            setFormData(prev => ({ ...prev, serviceAccount: parsed }));
            setError(null);
        } catch (e) {
            setError('Invalid JSON format');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name?.trim()) {
            setError('Name is required');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const config = { ...formData };
            delete config.name;

            await onSave({
                id: credential?.id,
                name: formData.name,
                type,
                config
            });

            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '16px', width: '480px', maxHeight: '90vh',
                overflow: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
                <div style={{
                    padding: '20px', borderBottom: '1px solid #e2e8f0',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '36px', height: '36px', borderRadius: '8px',
                            backgroundColor: info.color, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', fontSize: '16px', color: 'white'
                        }}>
                            {info.icon}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700 }}>{credential ? 'Edit' : 'Add'} {info.name} Credential</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{info.description}</div>
                        </div>
                    </div>
                    <button onClick={onClose} style={{
                        padding: '8px', border: 'none', background: 'transparent',
                        cursor: 'pointer', color: '#64748b'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '10px', borderRadius: '8px', backgroundColor: '#fee2e2',
                            color: '#dc2626', fontSize: '0.875rem', marginBottom: '16px'
                        }}>
                            {error}
                        </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                            Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={(e) => handleChange('name', e.target.value)}
                            placeholder="My Telegram Bot"
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                                borderRadius: '8px', fontSize: '0.875rem'
                            }}
                        />
                    </div>

                    {fields.map(field => (
                        <div key={field.key} style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                                {field.label} {field.required && '*'}
                            </label>

                            {field.type === 'select' ? (
                                <select
                                    value={formData[field.key] || ''}
                                    onChange={(e) => handleChange(field.key, e.target.value)}
                                    style={{
                                        width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                                        borderRadius: '8px', fontSize: '0.875rem'
                                    }}
                                >
                                    <option value="">Select...</option>
                                    {field.options.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            ) : field.type === 'json' ? (
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowJson(!showJson)}
                                            style={{
                                                padding: '4px 8px', fontSize: '0.75rem',
                                                border: '1px solid #e2e8f0', borderRadius: '4px',
                                                background: 'white', cursor: 'pointer'
                                            }}
                                        >
                                            {showJson ? 'Hide JSON' : 'Show JSON'}
                                        </button>
                                    </div>
                                    {showJson ? (
                                        <textarea
                                            value={typeof formData[field.key] === 'object'
                                                ? JSON.stringify(formData[field.key], null, 2)
                                                : ''}
                                            onChange={(e) => handleJsonChange(e.target.value)}
                                            placeholder='{"type": "service_account", ...}'
                                            rows={8}
                                            style={{
                                                width: '100%', padding: '10px', border: '1px solid #e2e8f0',
                                                borderRadius: '8px', fontSize: '0.75rem', fontFamily: 'monospace'
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            padding: '12px', backgroundColor: '#f8fafc',
                                            borderRadius: '8px', fontSize: '0.75rem', color: '#64748b'
                                        }}>
                                            Service account JSON loaded {formData[field.key]?.client_email ? `( ${formData[field.key].client_email} )` : ''}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={field.type === 'password' ? 'password' : 'text'}
                                        value={formData[field.key] || ''}
                                        onChange={(e) => handleChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                        style={{
                                            width: '100%', padding: '10px',
                                            paddingRight: field.type === 'password' ? '40px' : '10px',
                                            border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '0.875rem'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    ))}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1, padding: '12px', border: '1px solid #e2e8f0',
                                borderRadius: '8px', background: 'white', cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                flex: 1, padding: '12px', border: 'none', borderRadius: '8px',
                                backgroundColor: info.color || '#6366f1', color: 'white',
                                cursor: saving ? 'wait' : 'pointer', fontWeight: 600
                            }}
                        >
                            {saving ? 'Saving...' : 'Save Credential'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// =====================================================
// MAIN CREDENTIAL MANAGER COMPONENT
// =====================================================

export const CredentialManager = () => {
    const [credentials, setCredentials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [showForm, setShowForm] = useState(false);
    const [editCredential, setEditCredential] = useState(null);
    const [formType, setFormType] = useState('telegram');

    useEffect(() => {
        loadCredentials();
    }, []);

    const loadCredentials = async () => {
        try {
            const data = await getCredentials(null, null);
            setCredentials(data);
        } catch (error) {
            console.error('Failed to load credentials:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = (type) => {
        setFormType(type);
        setEditCredential(null);
        setShowForm(true);
    };

    const handleEdit = (credential) => {
        setFormType(credential.type);
        setEditCredential(credential);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this credential?')) return;

        try {
            await deleteCredential(id);
            await loadCredentials();
        } catch (error) {
            console.error('Failed to delete:', error);
            alert('Failed to delete credential');
        }
    };

    const handleSave = async (data) => {
        try {
            if (data.id) {
                await updateCredential(data.id, { config: data.config });
            } else {
                await createCredential({
                    name: data.name,
                    type: data.type,
                    config: data.config
                });
            }
            await loadCredentials();
        } catch (error) {
            throw error;
        }
    };

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'telegram', label: '📱 Telegram' },
        { id: 'slack', label: '💬 Slack' },
        { id: 'google_sheets', label: '📊 Sheets' },
        { id: 'email', label: '📧 Email' }
    ];

    const filteredCredentials = activeTab === 'all'
        ? credentials
        : credentials.filter(c => c.type === activeTab);

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                        <Key size={24} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        Connector Credentials
                    </h2>
                    <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                        Manage API keys and authentication for external services
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: '8px', marginBottom: '24px',
                borderBottom: '1px solid #e2e8f0', paddingBottom: '12px'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '8px 16px', border: 'none', borderRadius: '8px',
                            backgroundColor: activeTab === tab.id ? '#6366f1' : '#f1f5f9',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Add Buttons */}
            {activeTab === 'all' && (
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px'
                }}>
                    {Object.entries(CONNECTOR_INFO).map(([type, info]) => (
                        <button
                            key={type}
                            onClick={() => handleAdd(type)}
                            style={{
                                padding: '16px', border: '2px dashed #e2e8f0', borderRadius: '12px',
                                background: 'white', cursor: 'pointer', textAlign: 'left',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = info.color;
                                e.currentTarget.style.backgroundColor = info.color + '10';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#e2e8f0';
                                e.currentTarget.style.backgroundColor = 'white';
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '8px',
                                    backgroundColor: info.color, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center',
                                    fontSize: '14px', color: 'white'
                                }}>
                                    {info.icon}
                                </div>
                                <Plus size={16} color="#64748b" />
                            </div>
                            <div style={{ marginTop: '8px', fontWeight: 600, color: '#1e293b' }}>{info.name}</div>
                        </button>
                    ))}
                </div>
            )}

            {/* Credentials Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '48px', color: '#64748b' }}>
                    Loading...
                </div>
            ) : filteredCredentials.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '48px', backgroundColor: '#f8fafc',
                    borderRadius: '12px', color: '#64748b'
                }}>
                    <Key size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                    <div>No credentials found</div>
                    <div style={{ fontSize: '0.875rem', marginTop: '8px' }}>
                        Add a credential to start using connectors
                    </div>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {filteredCredentials.map(credential => (
                        <CredentialCard
                            key={credential.id}
                            credential={credential}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}

            {/* Form Modal */}
            {showForm && (
                <CredentialFormModal
                    type={formType}
                    credential={editCredential}
                    onSave={handleSave}
                    onClose={() => {
                        setShowForm(false);
                        setEditCredential(null);
                    }}
                />
            )}
        </div>
    );
};

export default CredentialManager;
