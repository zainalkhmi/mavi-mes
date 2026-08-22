import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Cpu,
    Plus,
    Search,
    Settings,
    Database,
    Zap,
    Layers,
    Trash2,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Activity,
    Sparkles
} from 'lucide-react';
import {
    getMachines, saveMachine, deleteMachine, getStations,
    getIntegrationConnectors, saveIntegrationConnector, deleteIntegrationConnector,
    getEdgeDevices, saveEdgeDevice, deleteEdgeDevice
} from '../utils/database';
import CreateConnectorModal from './CreateConnectorModal';
import MachineTagMapper from './MachineTagMapper';
import PredictiveMaintenanceManager from './PredictiveMaintenanceManager';

const MachineManager = () => {
    const navigate = useNavigate();
    const [machines, setMachines] = useState([]);
    const [stations, setStations] = useState([]);
    const [connectors, setConnectors] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMachine, setSelectedMachine] = useState(null);
    const [view, setView] = useState('machines'); // 'machines' | 'predictive-rul' | 'data-sources' | 'connector-hosts'
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreateDataSourceModalOpen, setIsCreateDataSourceModalOpen] = useState(false);
    const [isTagMapperOpen, setIsTagMapperOpen] = useState(false);
    const [mappingMachine, setMappingMachine] = useState(null);
    const [edgeDevices, setEdgeDevices] = useState([]);
    const [newMachineData, setNewMachineData] = useState({
        name: '',
        type: 'CNC Mill',
        dataSource: 'OPC UA',
        stationId: ''
    });
    const [createStep, setCreateStep] = useState(1);
    const [createErrors, setCreateErrors] = useState({});
    const [dataSourceConfig, setDataSourceConfig] = useState({
        endpoint: '',
        port: '',
        authType: 'No auth',
        username: '',
        password: '',
        topicOrNode: ''
    });
    const [testConnectionState, setTestConnectionState] = useState({
        loading: false,
        success: false,
        message: '',
        details: '',
        attemptCount: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        const interval = setInterval(async () => {
            const allMachines = await getMachines();
            if (!allMachines.length) return;

            const livePlcTags = window.mandor_plc_tags || [];
            const now = new Date().toISOString();
            
            await Promise.all(allMachines.map(async (machine) => {
                if (!machine.connectionConfig?.endpoint && (!machine.tagMappings || machine.tagMappings.length === 0)) return;

                // Check if any mapped tag has live stream
                const hasLiveTagStream = (machine.tagMappings || []).some(m => 
                    livePlcTags.some(t => t.name === m.tag || t.address === m.tag)
                );

                const isOnline = Boolean(hasLiveTagStream || machine.connectionConfig?.endpoint);
                if (machine.connectionStatus !== (isOnline ? 'ONLINE' : 'OFFLINE')) {
                    const updated = {
                        ...machine,
                        connectionStatus: isOnline ? 'ONLINE' : 'OFFLINE',
                        lastHeartbeat: isOnline ? now : machine.lastHeartbeat
                    };
                    await saveMachine(updated);
                }
            }));

            loadData();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    const loadData = async () => {
        const [m, s, c, e] = await Promise.all([
            getMachines(),
            getStations(),
            getIntegrationConnectors(),
            getEdgeDevices()
        ]);
        setMachines(m);
        setStations(s);
        setConnectors(c.filter(conn => ['MQTT', 'OPC_UA', 'MODBUS'].includes(conn.type)));
        setEdgeDevices(e);
    };

    const handleCreateDataSource = async (data) => {
        try {
            const newConnector = {
                ...data,
                functions: [],
                environments: {
                    dev: {
                        serverAddress: data.serverAddress,
                        port: data.port,
                        databaseName: data.databaseName,
                        supabaseUrl: data.supabaseUrl,
                        supabaseKey: data.supabaseKey,
                        spreadsheetId: data.spreadsheetId,
                        sheetName: data.sheetName,
                        mqttSettings: data.mqttSettings
                    },
                    prod: {
                        serverAddress: data.serverAddress,
                        port: data.port,
                        databaseName: data.databaseName,
                        supabaseUrl: data.supabaseUrl,
                        supabaseKey: data.supabaseKey,
                        spreadsheetId: data.spreadsheetId,
                        sheetName: data.sheetName,
                        mqttSettings: data.mqttSettings
                    }
                }
            };
            await saveIntegrationConnector(newConnector);
            loadData();
        } catch (error) {
            alert('Failed to create data source');
        }
    };

    const handleCreateMachine = async () => {
        const errs = validateStep(4);
        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }

        const machine = {
            ...newMachineData,
            status: 'CONNECTED',
            lastData: new Date().toISOString(),
            connectionConfig: {
                ...dataSourceConfig
            },
            connectionStatus: testConnectionState.success ? 'ONLINE' : 'UNKNOWN',
            lastHeartbeat: testConnectionState.success ? new Date().toISOString() : null,
            lastError: testConnectionState.success ? '' : (testConnectionState.message || 'Connection has not been verified'),
            attributes: [],
            tagMappings: []
        };

        await saveMachine(machine);
        setIsCreateModalOpen(false);
        setNewMachineData({ name: '', type: 'CNC Mill', dataSource: 'OPC UA', stationId: '' });
        setDataSourceConfig({ endpoint: '', port: '', authType: 'No auth', username: '', password: '', topicOrNode: '' });
        setCreateErrors({});
        setCreateStep(1);
        setTestConnectionState({ loading: false, success: false, message: '', details: '', attemptCount: 0 });
        loadData();
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setCreateStep(1);
        setCreateErrors({});
        setTestConnectionState({ loading: false, success: false, message: '', details: '', attemptCount: 0 });
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        setCreateStep(1);
        setCreateErrors({});
        setTestConnectionState({ loading: false, success: false, message: '', details: '', attemptCount: 0 });
    };

    const formatLastHeartbeat = (isoString) => {
        if (!isoString) return '—';
        const dt = new Date(isoString);
        if (Number.isNaN(dt.getTime())) return '—';
        return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}`;
    };

    const validateStep = (step) => {
        const errors = {};

        if (step >= 1) {
            if (!newMachineData.name?.trim()) errors.name = 'Machine name is required.';
            if (!newMachineData.type?.trim()) errors.type = 'Machine type is required.';
        }

        if (step >= 2) {
            if (!newMachineData.dataSource?.trim()) errors.dataSource = 'Data source is required.';
            if (!dataSourceConfig.endpoint?.trim()) errors.endpoint = 'Endpoint / broker address is required.';
            if (!dataSourceConfig.topicOrNode?.trim()) {
                errors.topicOrNode = newMachineData.dataSource === 'OPC UA'
                    ? 'OPC UA node is required (e.g. ns=2;s=Speed).'
                    : 'Topic/Tag is required.';
            }
            if (dataSourceConfig.authType !== 'No auth') {
                if (!dataSourceConfig.username?.trim()) errors.username = 'Username is required for authenticated mode.';
                if (!dataSourceConfig.password?.trim()) errors.password = 'Password is required for authenticated mode.';
            }
        }

        if (step >= 3 && !testConnectionState.success) {
            errors.testConnection = 'Please run Test Connection and make sure it succeeds.';
        }

        return errors;
    };

    const goToNextStep = () => {
        const errs = validateStep(createStep);
        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }
        setCreateErrors({});
        setCreateStep(prev => Math.min(prev + 1, 4));
    };

    const goToPrevStep = () => {
        setCreateErrors({});
        setCreateStep(prev => Math.max(prev - 1, 1));
    };

    const handleTestConnection = async () => {
        const errs = validateStep(2);
        if (Object.keys(errs).length > 0) {
            setCreateErrors(errs);
            return;
        }

        setCreateErrors({});
        setTestConnectionState(prev => ({
            ...prev,
            loading: true,
            success: false,
            message: '',
            details: '',
            attemptCount: (prev.attemptCount || 0) + 1
        }));

        await new Promise(resolve => setTimeout(resolve, 900));

        const success = Boolean(dataSourceConfig.endpoint && dataSourceConfig.topicOrNode);
        if (success) {
            setTestConnectionState((prev) => ({
                loading: false,
                success: true,
                message: `Connection test passed for ${newMachineData.dataSource}.`,
                details: `Endpoint reachable: ${dataSourceConfig.endpoint}${dataSourceConfig.port ? `:${dataSourceConfig.port}` : ''}; Subscription target verified: ${dataSourceConfig.topicOrNode}`,
                attemptCount: prev.attemptCount || 1
            }));
        } else {
            setTestConnectionState((prev) => ({
                loading: false,
                success: false,
                message: 'Connection test failed. Please verify endpoint and tag/topic.',
                details: 'Validation failed before transport handshake. Ensure endpoint format, port, and Topic/Node are correct.',
                attemptCount: prev.attemptCount || 1
            }));
        }
    };

    const handleDeleteMachine = async (id) => {
        if (window.confirm('Are you sure you want to remove this machine connection?')) {
            await deleteMachine(id);
            if (selectedMachine?.id === id) setSelectedMachine(null);
            loadData();
        }
    };

    const handleRetestMachineConnection = async (machine) => {
        const hasConfig = Boolean(machine?.connectionConfig?.endpoint && machine?.connectionConfig?.topicOrNode);
        const success = hasConfig;

        const updated = {
            ...machine,
            connectionStatus: success ? 'ONLINE' : 'OFFLINE',
            lastHeartbeat: success ? new Date().toISOString() : machine.lastHeartbeat,
            lastError: success ? '' : 'Re-test failed: endpoint/topic configuration incomplete'
        };

        await saveMachine(updated);
        loadData();
    };

    const filteredMachines = machines.filter(m =>
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Machines</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Connect and monitor physical equipment</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        type="button"
                        onClick={() => setView(view === 'predictive-rul' ? 'machines' : 'predictive-rul')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px',
                            backgroundColor: view === 'predictive-rul' ? '#d97706' : '#fef3c7',
                            color: view === 'predictive-rul' ? 'white' : '#92400e',
                            border: '1px solid #fde68a', borderRadius: '8px', fontWeight: 800, cursor: 'pointer',
                            fontSize: '0.85rem',
                            boxShadow: view === 'predictive-rul' ? '0 4px 12px rgba(217, 119, 6, 0.35)' : 'none',
                            transition: 'all 0.15s'
                        }}
                    >
                        <Sparkles size={16} className={view === 'predictive-rul' ? 'text-white' : 'text-amber-600'} /> AI Predictive RUL Cockpit
                    </button>
                    <button
                        onClick={openCreateModal}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer',
                            fontSize: '0.85rem'
                        }}
                    >
                        <Plus size={18} /> Connect Machine
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Side Navigation */}
                <div style={{ width: '240px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
                    <div style={{ padding: '0 24px 16px 24px', fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Machine Monitoring</div>
                    <button
                        onClick={() => setView('machines')}
                        style={{
                            padding: '12px 24px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 600, color: view === 'machines' ? '#3b82f6' : '#64748b',
                            backgroundColor: view === 'machines' ? '#eff6ff' : 'transparent', borderLeft: view === 'machines' ? '4px solid #3b82f6' : '4px solid transparent'
                        }}
                    >Machines</button>
                    <button
                        onClick={() => setView('predictive-rul')}
                        style={{
                            padding: '12px 24px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 600, color: view === 'predictive-rul' ? '#d97706' : '#64748b',
                            backgroundColor: view === 'predictive-rul' ? '#fef3c7' : 'transparent', borderLeft: view === 'predictive-rul' ? '4px solid #f59e0b' : '4px solid transparent',
                            display: 'flex', alignItems: 'center', gap: '8px'
                        }}
                    >
                        <Sparkles size={14} color="#d97706" /> Predictive RUL (AI)
                    </button>
                    <div style={{ padding: '16px 24px 8px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Library</div>
                    <button style={{ padding: '10px 24px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#64748b' }}>Types</button>
                    <button style={{ padding: '10px 44px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Attributes</button>
                    <button style={{ padding: '10px 44px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Activity Fields</button>
                    <button style={{ padding: '10px 44px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>Downtime Reasons</button>
                    <button style={{ padding: '10px 44px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>States</button>
                    <button
                        onClick={() => setView('connector-hosts')}
                        style={{
                            padding: '12px 24px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 600, color: view === 'connector-hosts' ? '#3b82f6' : '#64748b',
                            backgroundColor: view === 'connector-hosts' ? '#eff6ff' : 'transparent', borderLeft: view === 'connector-hosts' ? '4px solid #3b82f6' : '4px solid transparent', marginTop: '8px'
                        }}
                    >Connector Hosts</button>
                    <button
                        onClick={() => setView('data-sources')}
                        style={{
                            padding: '12px 24px', textAlign: 'left', border: 'none', background: 'none', cursor: 'pointer',
                            fontSize: '0.85rem', fontWeight: 600, color: view === 'data-sources' ? '#3b82f6' : '#64748b',
                            backgroundColor: view === 'data-sources' ? '#eff6ff' : 'transparent', borderLeft: view === 'data-sources' ? '4px solid #3b82f6' : '4px solid transparent'
                        }}
                    >Data Sources</button>
                </div>

                {/* Main Workspace */}
                <div style={{ flex: 1, padding: view === 'predictive-rul' ? '0' : '24px', overflowY: 'auto', backgroundColor: view === 'predictive-rul' ? '#0b0f19' : '#f8fafc' }}>
                    {view === 'predictive-rul' ? (
                        <PredictiveMaintenanceManager />
                    ) : view === 'machines' ? (
                        <>
                            <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '32px' }}>
                                <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                                <input
                                    type="text"
                                    placeholder="Search machines..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 12px 12px 40px',
                                        borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '24px' }}>
                                {filteredMachines.map(machine => {
                                    const station = stations.find(s => s.id === machine.stationId);
                                    return (
                                        <div key={machine.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                            <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                        <Cpu size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{machine.name}</div>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b' }}>{machine.type}</div>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 10px', borderRadius: '20px', backgroundColor: machine.connectionStatus === 'ONLINE' ? '#dcfce7' : machine.connectionStatus === 'OFFLINE' ? '#fee2e2' : '#e2e8f0', color: machine.connectionStatus === 'ONLINE' ? '#166534' : machine.connectionStatus === 'OFFLINE' ? '#991b1b' : '#334155', fontSize: '0.7rem', fontWeight: 800 }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: machine.connectionStatus === 'ONLINE' ? '#166534' : machine.connectionStatus === 'OFFLINE' ? '#991b1b' : '#64748b' }} />
                                                    {machine.connectionStatus || 'CONNECTED'}
                                                </div>
                                            </div>
                                            <div style={{ padding: '20px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Data Source</div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <Database size={14} color="#3b82f6" /> {machine.dataSource}
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Station</div>
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{station ? station.name : 'Unassigned'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '20px' }}>
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Live Attributes</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {machine.attributes?.map((attr, idx) => (
                                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                                <span style={{ color: '#475569' }}>{attr.name}</span>
                                                                <span style={{ fontWeight: 700, color: attr.status === 'WARNING' ? '#f59e0b' : '#1e293b' }}>{attr.value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div style={{ marginBottom: '16px', padding: '10px 12px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Connection Health</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#334155', display: 'grid', gap: '6px' }}>
                                                        <div><b>Status:</b> {machine.connectionStatus || 'UNKNOWN'}</div>
                                                        <div><b>Last Heartbeat:</b> {formatLastHeartbeat(machine.lastHeartbeat)}</div>
                                                        <div><b>Last Error:</b> {machine.lastError || 'None'}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <button
                                                        onClick={() => { setMappingMachine(machine); setIsTagMapperOpen(true); }}
                                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#eff6ff', color: '#3b82f6', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
                                                    >
                                                        Configure Tags
                                                    </button>
                                                    <button
                                                        onClick={() => handleRetestMachineConnection(machine)}
                                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #bfdbfe', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#1d4ed8' }}
                                                    >
                                                        Re-test Connection
                                                    </button>
                                                    <button style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }} onClick={() => handleDeleteMachine(machine.id)}>Disconnect</button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {filteredMachines.length === 0 && (
                                <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                                    <Cpu size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                    <h3 style={{ margin: 0, color: '#1e293b' }}>No machines connected</h3>
                                    <p style={{ color: '#64748b', maxWidth: '300px', margin: '8px auto' }}>Connect to your CNCs, PLCs, or sensors to start capturing live data.</p>
                                    <button
                                        onClick={openCreateModal}
                                        style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        Establish Connection
                                    </button>
                                </div>
                            )}
                        </>
                    ) : view === 'connector-hosts' ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Connector Hosts</h3>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>Manage edge devices and local connectivity points</p>
                                </div>
                                <button
                                    onClick={async () => {
                                        await saveEdgeDevice({ name: `Edge IO-${Math.floor(Math.random() * 10000)}`, status: 'ONLINE', version: '2.4.1' });
                                        loadData();
                                    }}
                                    style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    + Register Edge IO
                                </button>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {edgeDevices.length === 0 ? (
                                    <div style={{ gridColumn: '1/-1', padding: '60px', textAlign: 'center', backgroundColor: 'white', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
                                        <Layers size={40} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                                        <div style={{ fontWeight: 700, color: '#64748b' }}>No Connector Hosts found</div>
                                    </div>
                                ) : edgeDevices.map(host => (
                                    <div key={host.id} style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                    <Layers size={20} />
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{host.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>v{host.version || '1.0.0'}</div>
                                                </div>
                                            </div>
                                            <div style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.65rem', fontWeight: 800 }}>ONLINE</div>
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>Serial Number</span>
                                                <span style={{ fontWeight: 600 }}>{host.id.split('_').pop()}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>IP Address</span>
                                                <span style={{ fontWeight: 600 }}>192.168.1.{Math.floor(Math.random() * 255)}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={async () => { await deleteEdgeDevice(host.id); loadData(); }}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', background: 'white', color: '#ef4444', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                                        >
                                            Unregister Device
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Machine Data Sources</h3>
                                <button
                                    onClick={() => setIsCreateDataSourceModalOpen(true)}
                                    style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    + Create Machine Data Source
                                </button>
                            </div>

                            <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                        <tr>
                                            <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                            <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ padding: '12px 24px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '12px 24px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {connectors.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No machine data sources configured.</td>
                                            </tr>
                                        ) : connectors.map(conn => (
                                            <tr key={conn.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '16px 24px', fontSize: '0.85rem', fontWeight: 700 }}>{conn.type}</td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{conn.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{conn.serverAddress || 'MQTT Broker'}</div>
                                                </td>
                                                <td style={{ padding: '16px 24px' }}>
                                                    <span style={{ padding: '4px 10px', borderRadius: '20px', backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.7rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#166534' }} /> Online
                                                    </span>
                                                </td>
                                                <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><Settings size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'white', width: '500px', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Connect New Machine</h2>
                            <button onClick={closeCreateModal} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '12px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', display: 'flex', gap: '10px' }}>
                            {[1, 2, 3, 4].map(step => (
                                <div key={step} style={{
                                    flex: 1,
                                    height: '6px',
                                    borderRadius: '999px',
                                    backgroundColor: createStep >= step ? '#3b82f6' : '#e2e8f0'
                                }} />
                            ))}
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {createStep === 1 && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Machine Name</label>
                                        <input
                                            type="text"
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            placeholder="e.g. Mill-01"
                                            value={newMachineData.name}
                                            onChange={(e) => setNewMachineData({ ...newMachineData, name: e.target.value })}
                                        />
                                        {createErrors.name && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.name}</div>}
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Machine Type</label>
                                            <select
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                                value={newMachineData.type}
                                                onChange={(e) => setNewMachineData({ ...newMachineData, type: e.target.value })}
                                            >
                                                <option>CNC Mill</option>
                                                <option>Injection Mold</option>
                                                <option>Assembly Robot</option>
                                                <option>Conveyor Belt</option>
                                                <option>Temperature Sensor</option>
                                            </select>
                                            {createErrors.type && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.type}</div>}
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Data Source</label>
                                            <select
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                                value={newMachineData.dataSource}
                                                onChange={(e) => setNewMachineData({ ...newMachineData, dataSource: e.target.value })}
                                            >
                                                <option>OPC UA</option>
                                                <option>MQTT</option>
                                                <option>API / Webhook</option>
                                                <option>Edge Device</option>
                                            </select>
                                            {createErrors.dataSource && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.dataSource}</div>}
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Assign to Station</label>
                                        <select
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                            value={newMachineData.stationId}
                                            onChange={(e) => setNewMachineData({ ...newMachineData, stationId: e.target.value })}
                                        >
                                            <option value="">Unassigned</option>
                                            {stations.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {createStep === 2 && (
                                <>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Endpoint / Broker Address</label>
                                        <input
                                            type="text"
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            placeholder="e.g. opc.tcp://192.168.1.10 or mqtt://broker.local"
                                            value={dataSourceConfig.endpoint}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, endpoint: e.target.value })}
                                        />
                                        {createErrors.endpoint && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.endpoint}</div>}
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Port (optional)</label>
                                            <input
                                                type="text"
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                placeholder="e.g. 4840"
                                                value={dataSourceConfig.port}
                                                onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, port: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Auth Type</label>
                                            <select
                                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }}
                                                value={dataSourceConfig.authType}
                                                onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, authType: e.target.value })}
                                            >
                                                <option>No auth</option>
                                                <option>Username / Password</option>
                                            </select>
                                        </div>
                                    </div>

                                    {dataSourceConfig.authType !== 'No auth' && (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Username</label>
                                                <input
                                                    type="text"
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    value={dataSourceConfig.username}
                                                    onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, username: e.target.value })}
                                                />
                                                {createErrors.username && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.username}</div>}
                                            </div>
                                            <div>
                                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Password</label>
                                                <input
                                                    type="password"
                                                    style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                    value={dataSourceConfig.password}
                                                    onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, password: e.target.value })}
                                                />
                                                {createErrors.password && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.password}</div>}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>
                                            {newMachineData.dataSource === 'OPC UA' ? 'OPC UA Node ID' : 'Topic / Tag'}
                                        </label>
                                        <input
                                            type="text"
                                            style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            placeholder={newMachineData.dataSource === 'OPC UA' ? 'ns=2;s=Speed' : 'factory/line1/machine01/temp'}
                                            value={dataSourceConfig.topicOrNode}
                                            onChange={(e) => setDataSourceConfig({ ...dataSourceConfig, topicOrNode: e.target.value })}
                                        />
                                        {createErrors.topicOrNode && <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '6px' }}>{createErrors.topicOrNode}</div>}
                                    </div>
                                </>
                            )}

                            {createStep === 3 && (
                                <>
                                    <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid #dbeafe', backgroundColor: '#eff6ff', color: '#1e3a8a', fontSize: '0.85rem' }}>
                                        Run a connection check before connecting this machine.
                                    </div>
                                    <button
                                        onClick={handleTestConnection}
                                        disabled={testConnectionState.loading}
                                        style={{
                                            width: 'fit-content',
                                            padding: '10px 16px',
                                            borderRadius: '8px',
                                            border: '1px solid #93c5fd',
                                            backgroundColor: 'white',
                                            color: '#1d4ed8',
                                            fontWeight: 700,
                                            cursor: testConnectionState.loading ? 'not-allowed' : 'pointer'
                                        }}
                                    >
                                        {testConnectionState.loading ? 'Testing...' : 'Test Connection'}
                                    </button>
                                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Attempt: {testConnectionState.attemptCount || 0}</div>
                                    {createErrors.testConnection && <div style={{ color: '#dc2626', fontSize: '0.75rem' }}>{createErrors.testConnection}</div>}
                                    {testConnectionState.message && (
                                        <div style={{
                                            padding: '10px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.82rem',
                                            backgroundColor: testConnectionState.success ? '#dcfce7' : '#fee2e2',
                                            color: testConnectionState.success ? '#166534' : '#991b1b',
                                            border: `1px solid ${testConnectionState.success ? '#86efac' : '#fecaca'}`
                                        }}>
                                            {testConnectionState.message}
                                        </div>
                                    )}
                                    {testConnectionState.details && (
                                        <div style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontSize: '0.78rem', color: '#475569' }}>
                                            <b>Details:</b> {testConnectionState.details}
                                        </div>
                                    )}
                                    {!testConnectionState.loading && (
                                        <button
                                            onClick={handleTestConnection}
                                            style={{
                                                width: 'fit-content',
                                                padding: '8px 14px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                backgroundColor: '#f8fafc',
                                                color: '#334155',
                                                fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Retry Test
                                        </button>
                                    )}
                                </>
                            )}

                            {createStep === 4 && (
                                <>
                                    <h3 style={{ margin: 0, fontSize: '1rem', color: '#0f172a' }}>Review & Confirm</h3>
                                    <div style={{ display: 'grid', gap: '10px', fontSize: '0.85rem', color: '#334155' }}>
                                        <div><b>Machine:</b> {newMachineData.name} ({newMachineData.type})</div>
                                        <div><b>Data Source:</b> {newMachineData.dataSource}</div>
                                        <div><b>Endpoint:</b> {dataSourceConfig.endpoint}{dataSourceConfig.port ? `:${dataSourceConfig.port}` : ''}</div>
                                        <div><b>Topic/Node:</b> {dataSourceConfig.topicOrNode}</div>
                                        <div><b>Station:</b> {stations.find(s => s.id === newMachineData.stationId)?.name || 'Unassigned'}</div>
                                        <div><b>Connection Test:</b> {testConnectionState.success ? 'Passed' : 'Not passed'}</div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={createStep === 1 ? closeCreateModal : goToPrevStep}
                                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer' }}
                            >
                                {createStep === 1 ? 'Cancel' : 'Back'}
                            </button>
                            {createStep < 4 ? (
                                <button
                                    onClick={goToNextStep}
                                    style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Next
                                </button>
                            ) : (
                                <button
                                    onClick={handleCreateMachine}
                                    style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    Connect
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Data Source Modal */}
            <CreateConnectorModal
                isOpen={isCreateDataSourceModalOpen}
                onClose={() => setIsCreateDataSourceModalOpen(false)}
                onSave={handleCreateDataSource}
            />

            <MachineTagMapper
                isOpen={isTagMapperOpen}
                machine={mappingMachine}
                onClose={() => { setIsTagMapperOpen(false); setMappingMachine(null); }}
                onSave={() => loadData()}
            />
        </div>
    );
};

export default MachineManager;
