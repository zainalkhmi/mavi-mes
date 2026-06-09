import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Link2, Plus, Search, Globe, Server, Database, 
    AlertCircle, ChevronRight, Settings2, Code, Activity, 
    ShieldCheck, Cloud, ArrowLeft, Save, Trash2, Zap, Play,
    X, CheckCircle, XCircle, Clock, RefreshCw, Eye, EyeOff,
    Package, BarChart3, Building2, HardDrive, Terminal,
    ChevronDown, Key, Lock, FilePlus, Copy, Sparkles
} from 'lucide-react';
import { getIntegrationConnectors, saveIntegrationConnector, deleteIntegrationConnector } from '../utils/database';
import { executeConnector, testConnection, getCallLog, clearCallLog, ERP_PRESETS, CONNECTOR_TYPES } from '../utils/connectorHub';
import CreateConnectorModal from './CreateConnectorModal';

// ─── Icon Map ────────────────────────────────────────────────────────────────
const iconMap = { Globe, Package, BarChart3, Building2, Database, Zap, HardDrive, Link2, Server };
function ConnectorTypeIcon({ type, size = 22 }) {
    const t = CONNECTOR_TYPES.find(c => c.value === type);
    const Icon = iconMap[t?.icon] || Link2;
    return <Icon size={size} />;
}
function typeColor(type) {
    return CONNECTOR_TYPES.find(c => c.value === type)?.color || '#64748b';
}

// ─── Status Dot ──────────────────────────────────────────────────────────────
function StatusDot({ status }) {
    const colors = { success: '#10b981', error: '#ef4444', running: '#f59e0b', idle: '#cbd5e1' };
    return (
        <div style={{
            width: 8, height: 8, borderRadius: '50%',
            backgroundColor: colors[status] || colors.idle,
            boxShadow: status === 'running' ? `0 0 0 3px ${colors.running}33` : 'none',
            animation: status === 'running' ? 'pulse 1.5s infinite' : 'none'
        }} />
    );
}

// ─── Function Panel ───────────────────────────────────────────────────────────
function FunctionPanel({ fn, connector, onUpdate, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [inputValues, setInputValues] = useState({});
    const [showResult, setShowResult] = useState(false);

    const runFn = async () => {
        setRunning(true); setError(null); setResult(null);
        try {
            const res = await executeConnector(connector.id, fn.id || fn.name, inputValues);
            setResult(res);
            setShowResult(true);
        } catch (err) {
            setError(err.message);
            setShowResult(true);
        } finally {
            setRunning(false);
        }
    };

    const methodColors = { GET: '#10b981', POST: '#3b82f6', PUT: '#f59e0b', PATCH: '#8b5cf6', DELETE: '#ef4444' };
    const mc = methodColors[fn.method?.toUpperCase()] || '#64748b';

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden', backgroundColor: 'white' }}>
            {/* Header */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
            >
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b' }}>{fn.name}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ color: mc, fontWeight: 800, fontSize: '0.68rem' }}>{fn.method || 'CALL'}</span>
                        <span>{fn.path || fn.odooModel ? `${fn.odooModel}.${fn.odooMethod}` : ''}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button
                        onClick={e => { e.stopPropagation(); runFn(); }}
                        disabled={running}
                        style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 8, border: 'none',
                            backgroundColor: running ? '#f1f5f9' : '#eff6ff', color: running ? '#94a3b8' : '#3b82f6',
                            fontWeight: 700, fontSize: '0.75rem', cursor: running ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {running ? <RefreshCw size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Play size={12} />}
                        {running ? 'Running...' : 'Run'}
                    </button>
                    <button onClick={() => setExpanded(!expanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
                        <ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                </div>
            </div>

            {/* Expanded: Inputs + Result */}
            {expanded && (
                <div style={{ padding: '0 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    {/* Inputs */}
                    {(fn.inputs || []).length > 0 && (
                        <div style={{ marginTop: 14 }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>Input Parameters</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {fn.inputs.map(inp => (
                                    <div key={inp.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <label style={{ fontSize: '0.75rem', color: '#64748b', minWidth: 120, fontWeight: 600 }}>
                                            {inp.label || inp.name}
                                            {inp.required && <span style={{ color: '#ef4444' }}> *</span>}
                                        </label>
                                        <input
                                            type={inp.type === 'number' ? 'number' : 'text'}
                                            placeholder={inp.default !== undefined ? String(inp.default) : inp.type}
                                            value={inputValues[inp.name] ?? ''}
                                            onChange={e => setInputValues(prev => ({ ...prev, [inp.name]: inp.type === 'number' ? Number(e.target.value) : e.target.value }))}
                                            style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem', outline: 'none' }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Result */}
                    {showResult && (
                        <div style={{ marginTop: 14, borderRadius: 10, overflow: 'hidden', border: `1px solid ${error ? '#fee2e2' : '#dcfce7'}` }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                                backgroundColor: error ? '#fef2f2' : '#f0fdf4',
                                borderBottom: `1px solid ${error ? '#fee2e2' : '#dcfce7'}`
                            }}>
                                {error ? <XCircle size={14} color="#ef4444" /> : <CheckCircle size={14} color="#10b981" />}
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: error ? '#ef4444' : '#10b981' }}>
                                    {error ? 'Error' : 'Success'}
                                </span>
                                <button onClick={() => { navigator.clipboard?.writeText(JSON.stringify(result || error, null, 2)); }} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <Copy size={12} />
                                </button>
                                <button onClick={() => setShowResult(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                    <X size={12} />
                                </button>
                            </div>
                            <pre style={{
                                margin: 0, padding: 12, fontSize: '0.72rem', color: error ? '#991b1b' : '#166534',
                                backgroundColor: error ? '#fef2f2' : '#f0fdf4',
                                maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                            }}>
                                {error || JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Execution Log ────────────────────────────────────────────────────────────
function ExecutionLog({ connectorId }) {
    const [log, setLog] = useState([]);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const all = getCallLog();
        setLog(connectorId ? all.filter(e => e.connectorId === connectorId) : all);
        const interval = setInterval(() => {
            const all = getCallLog();
            setLog(connectorId ? all.filter(e => e.connectorId === connectorId) : all);
        }, 2000);
        return () => clearInterval(interval);
    }, [connectorId]);

    const filtered = filter === 'all' ? log : log.filter(e => e.status === filter);

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem' }}>Execution Log</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    {['all', 'success', 'error'].map(f => (
                        <button key={f} onClick={() => setFilter(f)} style={{
                            padding: '4px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                            fontWeight: 700, fontSize: '0.72rem', textTransform: 'capitalize',
                            backgroundColor: filter === f ? '#1e293b' : '#f1f5f9',
                            color: filter === f ? 'white' : '#64748b'
                        }}>{f}</button>
                    ))}
                    <button onClick={() => { clearCallLog(); setLog([]); }} style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#94a3b8', fontSize: '0.72rem' }}>Clear</button>
                </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: 12 }}>
                        <Terminal size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                        <p style={{ margin: 0 }}>No calls recorded yet. Run a function to see logs.</p>
                    </div>
                ) : filtered.map(entry => (
                    <div key={entry.id} style={{
                        backgroundColor: 'white', borderRadius: 10, border: '1px solid #e2e8f0',
                        padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: 12
                    }}>
                        <StatusDot status={entry.status} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>{entry.connectorName}</span>
                                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>→</span>
                                <span style={{ fontWeight: 600, fontSize: '0.82rem', color: '#475569' }}>{entry.functionName}</span>
                                <span style={{ marginLeft: 'auto', fontSize: '0.68rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                                    <Clock size={10} /> {entry.durationMs}ms
                                </span>
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{new Date(entry.timestamp).toLocaleString()}</div>
                            {entry.error && (
                                <div style={{ marginTop: 6, fontSize: '0.72rem', color: '#ef4444', backgroundColor: '#fef2f2', padding: '4px 8px', borderRadius: 6 }}>
                                    {entry.error}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Auth Config ──────────────────────────────────────────────────────────────
function AuthConfig({ connector, onChange }) {
    const [show, setShow] = useState(false);
    const auth = connector.auth || {};

    const update = (key, val) => onChange({ ...connector, auth: { ...auth, [key]: val } });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Auth Type</label>
                <select
                    value={auth.type || 'NONE'}
                    onChange={e => onChange({ ...connector, auth: { type: e.target.value } })}
                    style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem' }}
                >
                    <option value="NONE">No Authentication</option>
                    <option value="BASIC">Basic Auth (Username/Password)</option>
                    <option value="BEARER">Bearer Token</option>
                    <option value="API_KEY">API Key Header</option>
                    <option value="OAUTH2">OAuth 2.0</option>
                </select>
            </div>

            {auth.type === 'BASIC' && (
                <>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Username</label>
                        <input value={auth.username || ''} onChange={e => update('username', e.target.value)} placeholder="admin" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Password</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <input type={show ? 'text' : 'password'} value={auth.password || ''} onChange={e => update('password', e.target.value)} placeholder="••••••••" style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                            <button onClick={() => setShow(!show)} style={{ padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}>
                                {show ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {(auth.type === 'BEARER' || auth.type === 'API_KEY') && (
                <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>
                        {auth.type === 'BEARER' ? 'Bearer Token' : 'API Key'}
                    </label>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input type={show ? 'text' : 'password'} value={auth.token || auth.apiKey || ''} onChange={e => update(auth.type === 'BEARER' ? 'token' : 'apiKey', e.target.value)} placeholder="Enter token..." style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        <button onClick={() => setShow(!show)} style={{ padding: '0 12px', borderRadius: 8, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b' }}>
                            {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>
            )}

            {auth.type === 'OAUTH2' && (
                <>
                    <div>
                        <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Token URL</label>
                        <input value={auth.tokenUrl || ''} onChange={e => update('tokenUrl', e.target.value)} placeholder="https://auth.example.com/oauth/token" style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Client ID</label>
                            <input value={auth.clientId || ''} onChange={e => update('clientId', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        </div>
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: 6, display: 'block' }}>Client Secret</label>
                            <input type="password" value={auth.clientSecret || ''} onChange={e => update('clientSecret', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                        </div>
                    </div>
                </>
            )}

            <div style={{ padding: 14, backgroundColor: '#f0fdf4', borderRadius: 10, border: '1px solid #dcfce7', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <Lock size={16} color="#10b981" style={{ marginTop: 1, flexShrink: 0 }} />
                <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                    Credentials are stored in your browser's local storage and never sent to external servers except when making connector function calls.
                </div>
            </div>
        </div>
    );
}

// ─── Main ConnectorManager ────────────────────────────────────────────────────
const ConnectorManager = () => {
    const [connectors, setConnectors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedConnector, setSelectedConnector] = useState(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [activeEnv, setActiveEnv] = useState('dev');
    const [activeTab, setActiveTab] = useState('functions');
    const [testResult, setTestResult] = useState(null);
    const [testing, setTesting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showPresets, setShowPresets] = useState(false);

    useEffect(() => { loadConnectors(); }, []);

    const loadConnectors = async () => {
        setLoading(true);
        try {
            const data = await getIntegrationConnectors();
            setConnectors(data || []);
        } catch { setConnectors([]); }
        finally { setLoading(false); }
    };

    const handleCreateConnector = async (data) => {
        try {
            const newConnector = {
                ...data,
                functions: [],
                environments: {
                    dev: { baseUrl: data.baseUrl || data.serverAddress, databaseName: data.databaseName },
                    prod: { baseUrl: data.baseUrl || data.serverAddress, databaseName: data.databaseName }
                }
            };
            await saveIntegrationConnector(newConnector);
            loadConnectors();
        } catch { alert('Failed to create connector'); }
    };

    const handleSaveConnector = async (connector) => {
        setSaving(true);
        try {
            await saveIntegrationConnector(connector);
            await loadConnectors();
            // Re-select updated connector
            const fresh = await getIntegrationConnectors();
            const updated = fresh.find(c => c.id === connector.id);
            if (updated) setSelectedConnector(updated);
        } catch { alert('Failed to save connector'); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this connector?')) return;
        try {
            await deleteIntegrationConnector(id);
            setSelectedConnector(null);
            loadConnectors();
        } catch { alert('Failed to delete connector'); }
    };

    const handleTestConnection = async () => {
        if (!selectedConnector) return;
        setTesting(true); setTestResult(null);
        const result = await testConnection(selectedConnector);
        setTestResult(result);
        setTesting(false);
    };

    const addPresetFunctions = (presets) => {
        if (!selectedConnector) return;
        const existing = selectedConnector.functions || [];
        const toAdd = presets.filter(p => !existing.find(f => f.id === p.id || f.name === p.name));
        const updated = { ...selectedConnector, functions: [...existing, ...toAdd] };
        setSelectedConnector(updated);
        handleSaveConnector(updated);
        setShowPresets(false);
    };

    const addBlankFunction = () => {
        if (!selectedConnector) return;
        const name = prompt('Function name:');
        if (!name) return;
        const fn = {
            id: `fn_${Date.now()}`,
            name,
            path: '/',
            method: 'GET',
            inputs: [],
            outputs: [{ name: 'data', path: '$', label: 'Response' }]
        };
        const updated = { ...selectedConnector, functions: [...(selectedConnector.functions || []), fn] };
        setSelectedConnector(updated);
        handleSaveConnector(updated);
    };

    // ── Detail View ──────────────────────────────────────────────────────────
    if (selectedConnector) {
        const color = typeColor(selectedConnector.type);
        const presets = ERP_PRESETS[selectedConnector.type] || [];

        return (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
                {/* Header */}
                <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button onClick={() => { setSelectedConnector(null); setTestResult(null); }}
                            style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', padding: '8px', color: '#64748b', display: 'flex' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                            <ConnectorTypeIcon type={selectedConnector.type} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>{selectedConnector.name}</h2>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                                {CONNECTOR_TYPES.find(t => t.value === selectedConnector.type)?.label || selectedConnector.type}
                                {selectedConnector.environments?.[activeEnv]?.baseUrl && ` · ${selectedConnector.environments[activeEnv].baseUrl}`}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Env Toggle */}
                        <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: 8, padding: 3 }}>
                            {['dev', 'prod'].map(e => (
                                <button key={e} onClick={() => setActiveEnv(e)} style={{
                                    padding: '5px 14px', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer',
                                    backgroundColor: activeEnv === e ? 'white' : 'transparent',
                                    color: activeEnv === e ? '#001e3c' : '#64748b',
                                    boxShadow: activeEnv === e ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}>{e === 'dev' ? 'Dev' : 'Prod'}</button>
                            ))}
                        </div>

                        {/* Test Connection */}
                        <button onClick={handleTestConnection} disabled={testing} style={{
                            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px',
                            border: `1px solid ${testResult?.ok === true ? '#10b981' : testResult?.ok === false ? '#ef4444' : '#e2e8f0'}`,
                            borderRadius: 8, cursor: testing ? 'not-allowed' : 'pointer',
                            backgroundColor: testResult?.ok === true ? '#ecfdf5' : testResult?.ok === false ? '#fef2f2' : 'white',
                            color: testResult?.ok === true ? '#10b981' : testResult?.ok === false ? '#ef4444' : '#475569',
                            fontWeight: 700, fontSize: '0.8rem'
                        }}>
                            {testing ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> :
                                testResult?.ok === true ? <CheckCircle size={14} /> :
                                    testResult?.ok === false ? <XCircle size={14} /> :
                                        <Activity size={14} />}
                            {testing ? 'Testing...' : testResult?.ok === true ? `OK · ${testResult.latencyMs}ms` :
                                testResult?.ok === false ? 'Failed' : 'Test Connection'}
                        </button>

                        <button onClick={() => handleSaveConnector(selectedConnector)} disabled={saving} style={{
                            padding: '9px 18px', backgroundColor: '#2563eb', color: 'white', border: 'none',
                            borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.85rem'
                        }}>
                            <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                        <button onClick={() => handleDelete(selectedConnector.id)} style={{
                            padding: '9px 12px', color: '#ef4444', border: '1px solid #fee2e2', backgroundColor: 'white', borderRadius: 8, cursor: 'pointer', display: 'flex'
                        }}>
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>

                {/* Test Error Banner */}
                {testResult?.ok === false && (
                    <div style={{ padding: '10px 24px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca', display: 'flex', gap: 8, alignItems: 'center' }}>
                        <XCircle size={14} color="#ef4444" />
                        <span style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: 600 }}>{testResult.message}</span>
                    </div>
                )}

                {/* Body */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    {/* Sidebar */}
                    <div style={{ width: 220, backgroundColor: 'white', borderRight: '1px solid #e2e8f0', padding: '16px 0' }}>
                        {[
                            { id: 'functions', icon: Code, label: 'Functions' },
                            { id: 'config', icon: Settings2, label: 'Configuration' },
                            { id: 'auth', icon: ShieldCheck, label: 'Authentication' },
                            { id: 'log', icon: Terminal, label: 'Execution Log' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                padding: '11px 20px', border: 'none', background: 'none', cursor: 'pointer',
                                color: activeTab === tab.id ? '#2563eb' : '#64748b',
                                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.85rem',
                                borderLeft: activeTab === tab.id ? '3px solid #2563eb' : '3px solid transparent',
                                backgroundColor: activeTab === tab.id ? '#eff6ff' : 'transparent'
                            }}>
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, padding: 28, overflowY: 'auto' }}>

                        {/* ── FUNCTIONS TAB ── */}
                        {activeTab === 'functions' && (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem' }}>
                                        Connector Functions
                                        <span style={{ marginLeft: 8, fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>
                                            {(selectedConnector.functions || []).length} functions
                                        </span>
                                    </h3>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        {presets.length > 0 && (
                                            <div style={{ position: 'relative' }}>
                                                <button onClick={() => setShowPresets(!showPresets)} style={{
                                                    display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                                                    border: `1px solid ${color}`, borderRadius: 8, cursor: 'pointer',
                                                    backgroundColor: `${color}10`, color, fontWeight: 700, fontSize: '0.78rem'
                                                }}>
                                                    <Sparkles size={14} /> Add from Presets
                                                </button>
                                                {showPresets && (
                                                    <div style={{
                                                        position: 'absolute', right: 0, top: 'calc(100% + 6px)', backgroundColor: 'white',
                                                        border: '1px solid #e2e8f0', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                                                        padding: 12, zIndex: 100, minWidth: 280
                                                    }}>
                                                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                                                            {CONNECTOR_TYPES.find(t => t.value === selectedConnector.type)?.label} Presets
                                                        </div>
                                                        {presets.map(p => (
                                                            <div key={p.id} onClick={() => addPresetFunctions([p])} style={{
                                                                padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem',
                                                                fontWeight: 600, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8
                                                            }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                            >
                                                                <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
                                                                {p.name}
                                                            </div>
                                                        ))}
                                                        <div style={{ borderTop: '1px solid #f1f5f9', marginTop: 8, paddingTop: 8 }}>
                                                            <button onClick={() => addPresetFunctions(presets)} style={{
                                                                width: '100%', padding: '8px', borderRadius: 8, border: `1px solid ${color}`,
                                                                backgroundColor: `${color}10`, color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer'
                                                            }}>
                                                                Add All Presets ({presets.length})
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <button onClick={addBlankFunction} style={{
                                            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                                            border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer',
                                            backgroundColor: 'white', color: '#475569', fontWeight: 700, fontSize: '0.78rem'
                                        }}>
                                            <Plus size={14} /> Custom Function
                                        </button>
                                    </div>
                                </div>

                                {(selectedConnector.functions || []).length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: 48, border: '2px dashed #e2e8f0', borderRadius: 16, color: '#94a3b8' }}>
                                        <Code size={36} style={{ marginBottom: 12, opacity: 0.3 }} />
                                        <p style={{ margin: '0 0 16px 0', fontWeight: 600 }}>No functions yet.</p>
                                        <p style={{ margin: 0, fontSize: '0.82rem' }}>Add preset functions for {CONNECTOR_TYPES.find(t => t.value === selectedConnector.type)?.label || 'this connector'} or create a custom one.</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        {(selectedConnector.functions || []).map(fn => (
                                            <FunctionPanel key={fn.id || fn.name} fn={fn} connector={selectedConnector} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── CONFIG TAB ── */}
                        {activeTab === 'config' && (
                            <div style={{ maxWidth: 560 }}>
                                <h3 style={{ margin: '0 0 20px 0', fontWeight: 800 }}>Configuration ({activeEnv.toUpperCase()})</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Base URL / Host</label>
                                        <input
                                            type="text"
                                            placeholder={
                                                selectedConnector.type === 'ODOO' ? 'https://mycompany.odoo.com' :
                                                    selectedConnector.type === 'SAP_ODATA' ? 'https://my.s4hana.cloud' :
                                                        selectedConnector.type === 'FREPPLE' ? 'https://demo.frepple.com' :
                                                            'https://api.example.com'
                                            }
                                            value={selectedConnector.environments?.[activeEnv]?.baseUrl || ''}
                                            onChange={e => {
                                                const envs = { ...(selectedConnector.environments || {}) };
                                                if (!envs[activeEnv]) envs[activeEnv] = {};
                                                envs[activeEnv].baseUrl = e.target.value;
                                                setSelectedConnector({ ...selectedConnector, environments: envs });
                                            }}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                        />
                                    </div>

                                    {(selectedConnector.type === 'ODOO') && (
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Database Name</label>
                                            <input
                                                type="text" placeholder="mycompany_db"
                                                value={selectedConnector.environments?.[activeEnv]?.databaseName || selectedConnector.databaseName || ''}
                                                onChange={e => {
                                                    const envs = { ...(selectedConnector.environments || {}) };
                                                    if (!envs[activeEnv]) envs[activeEnv] = {};
                                                    envs[activeEnv].databaseName = e.target.value;
                                                    setSelectedConnector({ ...selectedConnector, environments: envs });
                                                }}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    )}

                                    {selectedConnector.type === 'SAP_ODATA' && (
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>SAP Client</label>
                                            <input
                                                type="text" placeholder="100"
                                                value={selectedConnector.sapClient || ''}
                                                onChange={e => setSelectedConnector({ ...selectedConnector, sapClient: e.target.value })}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', boxSizing: 'border-box' }}
                                            />
                                        </div>
                                    )}

                                    {/* ── SQL / PostgreSQL Config ── */}
                                    {selectedConnector.type === 'SQL' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, backgroundColor: '#f0fdf4', borderRadius: 12, border: '1px solid #dcfce7' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Database size={13} /> PostgreSQL Connection
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                                                <div>
                                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Database Host</label>
                                                    <input
                                                        type="text" placeholder="192.168.1.10"
                                                        value={selectedConnector.pgHost || ''}
                                                        onChange={e => setSelectedConnector({ ...selectedConnector, pgHost: e.target.value })}
                                                        style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div style={{ width: 80 }}>
                                                    <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Port</label>
                                                    <input
                                                        type="number" placeholder="5432"
                                                        value={selectedConnector.pgPort || 5432}
                                                        onChange={e => setSelectedConnector({ ...selectedConnector, pgPort: e.target.value })}
                                                        style={{ width: '100%', padding: '9px 8px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Database Name</label>
                                                <input
                                                    type="text" placeholder="myapp_db"
                                                    value={selectedConnector.databaseName || selectedConnector.environments?.[activeEnv]?.databaseName || ''}
                                                    onChange={e => setSelectedConnector({ ...selectedConnector, databaseName: e.target.value })}
                                                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div
                                                    onClick={() => setSelectedConnector({ ...selectedConnector, pgSsl: !selectedConnector.pgSsl })}
                                                    style={{
                                                        width: 36, height: 18, borderRadius: 10, cursor: 'pointer',
                                                        backgroundColor: selectedConnector.pgSsl ? '#10b981' : '#cbd5e1',
                                                        position: 'relative', transition: 'background-color 0.2s', flexShrink: 0
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 14, height: 14, borderRadius: '50%', backgroundColor: 'white',
                                                        position: 'absolute', top: 2,
                                                        left: selectedConnector.pgSsl ? 20 : 2, transition: 'left 0.2s'
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                                                    Enable SSL (recommended for production)
                                                </span>
                                            </div>
                                            <div style={{ borderTop: '1px solid #d1fae5', paddingTop: 12 }}>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Bridge API Key (optional)</label>
                                                <input
                                                    type="password" placeholder="Key untuk BRIDGE_API_KEY di server"
                                                    value={selectedConnector.bridgeApiKey || ''}
                                                    onChange={e => setSelectedConnector({ ...selectedConnector, bridgeApiKey: e.target.value })}
                                                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div style={{ padding: 10, backgroundColor: 'white', borderRadius: 8, border: '1px solid #d1fae5', fontSize: '0.75rem', color: '#065f46' }}>
                                                <strong>💡 Setup:</strong> Jalankan <code style={{ backgroundColor: '#f0fdf4', padding: '1px 4px', borderRadius: 4 }}>node mavi-erp-bridge.js</code> di server database Anda.
                                                Pastikan Base URL di atas menunjuk ke bridge (contoh: <code style={{ backgroundColor: '#f0fdf4', padding: '1px 4px', borderRadius: 4 }}>http://SERVER_IP:3099</code>).
                                            </div>
                                        </div>
                                    )}

                                    {selectedConnector.type === 'CANVA' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16, backgroundColor: '#f0fdfa', borderRadius: 12, border: '1px solid #ccfbf1' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0f766e', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
                                                Canva Connect Config
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Canva API Key / Access Token</label>
                                                <input
                                                    type="password" placeholder="Insert your Canva Connect API Key"
                                                    value={selectedConnector.canvaSettings?.apiKey || ''}
                                                    onChange={e => setSelectedConnector({
                                                        ...selectedConnector,
                                                        canvaSettings: { ...(selectedConnector.canvaSettings || {}), apiKey: e.target.value }
                                                    })}
                                                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #99f6e4', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Default Design Folder ID (Optional)</label>
                                                <input
                                                    type="text" placeholder="e.g. FOF12345678"
                                                    value={selectedConnector.canvaSettings?.defaultFolderId || ''}
                                                    onChange={e => setSelectedConnector({
                                                        ...selectedConnector,
                                                        canvaSettings: { ...(selectedConnector.canvaSettings || {}), defaultFolderId: e.target.value }
                                                    })}
                                                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #99f6e4', fontSize: '0.85rem', boxSizing: 'border-box' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Export Format</label>
                                                <select
                                                    value={selectedConnector.canvaSettings?.exportFormat || 'PNG'}
                                                    onChange={e => setSelectedConnector({
                                                        ...selectedConnector,
                                                        canvaSettings: { ...(selectedConnector.canvaSettings || {}), exportFormat: e.target.value }
                                                    })}
                                                    style={{ width: '100%', padding: '9px 11px', borderRadius: 8, border: '1px solid #99f6e4', fontSize: '0.85rem', boxSizing: 'border-box', backgroundColor: 'white' }}
                                                >
                                                    <option>PNG</option>
                                                    <option>JPG</option>
                                                    <option>PDF</option>
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {selectedConnector.type !== 'SQL' && (
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Connector Host</label>
                                        <select value={selectedConnector.host || 'Cloud Connector Host'}
                                            onChange={e => setSelectedConnector({ ...selectedConnector, host: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.875rem', backgroundColor: 'white' }}>
                                            <option>Cloud Connector Host</option>
                                            <option>On-Premise Host A</option>
                                            <option>Edge Agent (Local Network)</option>
                                        </select>
                                    </div>
                                    )}

                                    <div style={{ padding: 14, backgroundColor: '#eff6ff', borderRadius: 10, border: '1px solid #dbeafe', display: 'flex', gap: 10 }}>
                                        <AlertCircle size={16} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
                                        <div style={{ fontSize: '0.78rem', color: '#1e40af' }}>
                                            {selectedConnector.type === 'SQL'
                                                ? <><strong>PostgreSQL Note:</strong> Browser tidak bisa koneksi langsung ke PostgreSQL. Gunakan <strong>Mavi ERP Bridge</strong> yang berjalan di server database sebagai perantara.</>
                                                : <><strong>CORS Note:</strong> For on-premise systems (SAP ECC, Odoo on your server), you may need to configure a CORS proxy or use the Edge Agent to avoid browser restrictions.</>
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}


                        {/* ── AUTH TAB ── */}
                        {activeTab === 'auth' && (
                            <div style={{ maxWidth: 560 }}>
                                <h3 style={{ margin: '0 0 20px 0', fontWeight: 800 }}>Authentication</h3>
                                <AuthConfig connector={selectedConnector} onChange={setSelectedConnector} />
                            </div>
                        )}

                        {/* ── LOG TAB ── */}
                        {activeTab === 'log' && (
                            <ExecutionLog connectorId={selectedConnector.id} />
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ── List View ────────────────────────────────────────────────────────────
    const filtered = connectors.filter(c => c.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ padding: 28, backgroundColor: '#f8fafc', minHeight: '100%' }}>
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
            `}</style>

            <CreateConnectorModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSave={handleCreateConnector} />

            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
                <div>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0, color: '#001e3c' }}>Connectors</h1>
                    <p style={{ color: '#64748b', marginTop: 6, marginBottom: 0 }}>
                        Integrate Mavi-MES with SAP, Odoo, FrePPLe, and any REST/SQL system.
                    </p>
                </div>
                <button onClick={() => setIsCreateModalOpen(true)} style={{
                    padding: '11px 22px', backgroundColor: '#2563eb', color: 'white', border: 'none',
                    borderRadius: 8, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9,
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)', fontSize: '0.875rem'
                }}>
                    <Plus size={18} /> New Connector
                </button>
            </div>

            {/* ERP Quick-add Banner */}
            <div style={{
                marginBottom: 24, padding: '16px 20px', backgroundColor: 'white', borderRadius: 14,
                border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', flexShrink: 0 }}>Quick connect:</div>
                {CONNECTOR_TYPES.filter(t => ['ODOO', 'SAP_ODATA', 'FREPPLE', 'HTTP'].includes(t.value)).map(t => {
                    const Icon = iconMap[t.icon] || Link2;
                    return (
                        <button key={t.value} onClick={() => setIsCreateModalOpen(true)} style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px',
                            border: `1px solid ${t.color}40`, borderRadius: 20, cursor: 'pointer',
                            backgroundColor: `${t.color}08`, color: t.color, fontWeight: 700, fontSize: '0.78rem'
                        }}>
                            <Icon size={14} /> {t.label}
                        </button>
                    );
                })}
            </div>

            {/* Search */}
            <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Search connectors..."
                    value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: '0.875rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>

            {/* Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 18 }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, backgroundColor: 'white', borderRadius: 16, border: '2px dashed #e2e8f0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#eff6ff', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                            <Link2 size={30} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>No Connectors Yet</h3>
                        <p style={{ color: '#64748b', margin: '0 0 18px' }}>Connect Mavi-MES to SAP, Odoo, FrePPLe, or any REST API.</p>
                        <button onClick={() => setIsCreateModalOpen(true)} style={{
                            color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe',
                            padding: '8px 18px', borderRadius: 8, fontWeight: 700, cursor: 'pointer'
                        }}>Create First Connector</button>
                    </div>
                ) : filtered.map(connector => {
                    const color = typeColor(connector.type);
                    const typeInfo = CONNECTOR_TYPES.find(t => t.value === connector.type);
                    return (
                        <div key={connector.id} onClick={() => setSelectedConnector(connector)} style={{
                            backgroundColor: 'white', borderRadius: 14, padding: '20px',
                            border: '1px solid #e2e8f0', cursor: 'pointer', position: 'relative', overflow: 'hidden',
                            transition: 'all 0.2s', boxShadow: '0 1px 6px rgba(0,0,0,0.03)'
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 6px 20px ${color}20`; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.03)'; }}
                        >
                            {/* Left accent bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', backgroundColor: color, borderRadius: '14px 0 0 14px' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 11, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                                    <ConnectorTypeIcon type={connector.type} size={20} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', fontWeight: 800, color: '#10b981', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: 20 }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10b981' }} /> ACTIVE
                                </div>
                            </div>

                            <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#1e293b' }}>{connector.name}</h3>
                            <p style={{ margin: '0 0 6px', fontSize: '0.78rem', color: '#94a3b8' }}>{typeInfo?.label || connector.type}</p>
                            <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: '#64748b', minHeight: '2.2em' }}>{connector.description || typeInfo?.description || ''}</p>

                            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#475569', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: 4 }}>
                                    {connector.functions?.length || 0} FUNCTIONS
                                </span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color, backgroundColor: `${color}12`, padding: '2px 8px', borderRadius: 4 }}>
                                    {connector.type}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color, fontSize: '0.72rem', fontWeight: 800 }}>
                                    VIEW DETAILS <ChevronRight size={13} />
                                </div>
                                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                    Updated {connector.updatedAt ? new Date(connector.updatedAt).toLocaleDateString() : '–'}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ConnectorManager;
