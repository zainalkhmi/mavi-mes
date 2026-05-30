import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Monitor,
    Plus,
    Search,
    RefreshCw,
    Smartphone,
    Tablet,
    Laptop,
    Trash2,
    ExternalLink,
    XCircle,
    Info,
    ArrowRight,
    Pencil,
    CheckCircle2,
    AlertCircle,
    SlidersHorizontal,
    Cpu,
    Bluetooth,
    Sliders,
    Camera
} from 'lucide-react';
import { getInterfaces, saveInterface, deleteInterface, getStations } from '../utils/database';

const DEFAULT_DRIVERS = {
    serialCaliper: { enabled: false, baudRate: 9600, terminator: '\r\n' },
    bluetoothCaliper: { enabled: false, prefix: '' },
    barcodeScanner: { enabled: false, mode: 'HID', baudRate: 9600, port: 'COM1' },
    webcam: { enabled: false, resolution: '1080p', rtspUrl: '' },
    obd2Reader: { enabled: false, transport: 'BLUETOOTH', baudRate: 38400, ipAddress: '192.168.0.10' }
};

const InterfaceManager = () => {
    const [interfaces, setInterfaces] = useState([]);
    const [stations, setStations] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDriversModalOpen, setIsDriversModalOpen] = useState(false);
    const [selectedInterface, setSelectedInterface] = useState(null);
    const [newInterfaceData, setNewInterfaceData] = useState({ name: '', deviceType: 'Computer', stationId: '' });
    const [editInterfaceData, setEditInterfaceData] = useState({ id: '', name: '', stationId: '' });
    const [driversData, setDriversData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const navigate = useNavigate();

    const handleOpenDrivers = (iface) => {
        setSelectedInterface(iface);
        const mergedDrivers = {
            serialCaliper: { ...DEFAULT_DRIVERS.serialCaliper, ...(iface.drivers?.serialCaliper || {}) },
            bluetoothCaliper: { ...DEFAULT_DRIVERS.bluetoothCaliper, ...(iface.drivers?.bluetoothCaliper || {}) },
            barcodeScanner: { ...DEFAULT_DRIVERS.barcodeScanner, ...(iface.drivers?.barcodeScanner || {}) },
            webcam: { ...DEFAULT_DRIVERS.webcam, ...(iface.drivers?.webcam || {}) },
            obd2Reader: { ...DEFAULT_DRIVERS.obd2Reader, ...(iface.drivers?.obd2Reader || {}) }
        };
        setDriversData(mergedDrivers);
        setIsDriversModalOpen(true);
    };

    const handleSaveDrivers = async () => {
        if (!selectedInterface) return;
        setIsSaving(true);
        try {
            await saveInterface({
                ...selectedInterface,
                drivers: driversData,
                lastSeen: selectedInterface.lastSeen || new Date().toISOString()
            });
            setIsDriversModalOpen(false);
            setSelectedInterface(null);
            await loadData();
        } catch (err) {
            console.error('Failed to save drivers configuration:', err);
            alert(`Failed to save drivers: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [i, s] = await Promise.all([getInterfaces(), getStations()]);
        setInterfaces(i);
        setStations(s);
    };

    const getDeviceIcon = (type) => {
        switch (type) {
            case 'Phone': return <Smartphone size={20} />;
            case 'Tablet': return <Tablet size={20} />;
            default: return <Laptop size={20} />;
        }
    };

    const deriveConnectionState = (iface) => {
        if (!iface?.lastSeen) return 'OFFLINE';
        const ageMs = Date.now() - new Date(iface.lastSeen).getTime();
        return ageMs <= 5 * 60 * 1000 ? 'ONLINE' : 'OFFLINE';
    };

    const getConnectionBadge = (state) => {
        if (state === 'ONLINE') {
            return {
                color: '#10b981',
                bg: '#dcfce7',
                icon: <CheckCircle2 size={12} />
            };
        }
        return {
            color: '#b45309',
            bg: '#fef3c7',
            icon: <AlertCircle size={12} />
        };
    };

    const handleLaunchPlayer = (iface) => {
        const station = stations.find(s => s.id === iface.stationId);
        const stationName = station ? station.name : 'WS-01';
        // Open in new tab for player experience
        window.open(`/#/terminal?station=${encodeURIComponent(stationName)}`, '_blank');
    };

    const filteredInterfaces = useMemo(() => {
        return interfaces.filter((i) =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (i.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [interfaces, searchTerm]);

    const handleCreateInterface = async () => {
        if (!newInterfaceData.name.trim()) {
            alert('Interface Name is required.');
            return;
        }

        setIsSaving(true);
        try {
            const iface = {
                ...newInterfaceData,
                status: 'ONLINE',
                version: 'r284.1',
                lastSeen: new Date().toISOString(),
                ipAddress: `192.168.1.${Math.floor(Math.random() * 254 + 1)}`
            };
            await saveInterface(iface);
            setIsCreateModalOpen(false);
            setNewInterfaceData({ name: '', deviceType: 'Computer', stationId: '' });
            await loadData();
        } catch (err) {
            console.error('Failed to register interface:', err);
            alert(`Failed to register interface: ${err.message || 'Unknown error'}. Please check your database connection.`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEdit = (iface) => {
        setSelectedInterface(iface);
        setEditInterfaceData({
            id: iface.id,
            name: iface.name || '',
            stationId: iface.stationId || ''
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!selectedInterface) return;
        if (!editInterfaceData.name.trim()) {
            alert('Interface Name is required.');
            return;
        }

        setIsSaving(true);
        try {
            await saveInterface({
                ...selectedInterface,
                name: editInterfaceData.name.trim(),
                stationId: editInterfaceData.stationId,
                lastSeen: selectedInterface.lastSeen || new Date().toISOString()
            });
            setIsEditModalOpen(false);
            setSelectedInterface(null);
            await loadData();
        } catch (err) {
            console.error('Failed to update interface:', err);
            alert(`Failed to update interface: ${err.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteInterface = async (id) => {
        if (window.confirm('Are you sure you want to remove this interface?')) {
            await deleteInterface(id);
            if (selectedInterface?.id === id) setSelectedInterface(null);
            await loadData();
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Interfaces (Display Devices)</h2>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.9rem' }}>Monitor and manage display devices running the MES Player</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={loadData} style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer' }}>
                        <RefreshCw size={18} color="#64748b" />
                    </button>
                    <button onClick={() => setIsCreateModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                        <Plus size={18} /> Create Interface
                    </button>
                </div>
            </div>

            <div style={{ padding: '24px' }}>
                <div style={{ position: 'relative', maxWidth: '420px', marginBottom: '24px' }}>
                    <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                    <input type="text" placeholder="Search by name or IP address..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
                    {filteredInterfaces.map((iface) => {
                        const station = stations.find((s) => s.id === iface.stationId);
                        const connectionState = deriveConnectionState(iface);
                        const badge = getConnectionBadge(connectionState);

                        return (
                            <div key={iface.id} style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                <div style={{ padding: '20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                            {getDeviceIcon(iface.deviceType)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: '#1e293b' }}>{iface.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', fontWeight: 700, color: badge.color, backgroundColor: badge.bg, borderRadius: '20px', width: 'fit-content', padding: '3px 8px', marginTop: '4px' }}>
                                                {badge.icon} {connectionState}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleOpenDrivers(iface)} title="Configure Drivers" style={{ border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#10b981', borderRadius: '6px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <SlidersHorizontal size={14} />
                                        </button>
                                        <button onClick={() => handleOpenEdit(iface)} style={{ border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#3b82f6', borderRadius: '6px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteInterface(iface.id)} style={{ border: '1px solid #fee2e2', background: 'white', cursor: 'pointer', color: '#ef4444', borderRadius: '6px', width: '30px', height: '30px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#64748b' }}>Assigned Station</span>
                                            <span style={{ fontWeight: 700, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {station ? station.name : 'Unassigned'} <ArrowRight size={12} />
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#64748b' }}>Software Version</span>
                                            <span style={{ fontWeight: 600 }}>{iface.version || 'r284.1'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#64748b' }}>IP Address</span>
                                            <span style={{ fontWeight: 600 }}>{iface.ipAddress || '-'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                            <span style={{ color: '#64748b' }}>Last Seen</span>
                                            <span style={{ fontWeight: 600 }}>{iface.lastSeen ? new Date(iface.lastSeen).toLocaleString() : '-'}</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => handleLaunchPlayer(iface)}
                                        style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                                        onMouseLeave={(e) => e.target.style.backgroundColor = '#f8fafc'}
                                    >
                                        Launch Player <ExternalLink size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredInterfaces.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '80px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                        <Monitor size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                        <h3 style={{ margin: 0, color: '#1e293b' }}>No interfaces registered</h3>
                        <p style={{ color: '#64748b', maxWidth: '340px', margin: '8px auto' }}>Create your first display interface to start running apps on the shop floor.</p>
                        <button onClick={() => setIsCreateModalOpen(true)} style={{ marginTop: '16px', padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                            Get Started
                        </button>
                    </div>
                )}
            </div>

            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'white', width: '500px', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create Interface</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd', display: 'flex', gap: '12px' }}>
                                <Info size={20} color="#0284c7" />
                                <div style={{ fontSize: '0.85rem', color: '#0369a1' }}>Interfaces are display devices (tablets, PCs, phones) running the Player. Assign each interface to a station.</div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Interface Name</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} placeholder="e.g. Line 1 Tablet" value={newInterfaceData.name} onChange={(e) => setNewInterfaceData({ ...newInterfaceData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Device Type</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                                    {['Computer', 'Tablet', 'Phone'].map((type) => (
                                        <button key={type} onClick={() => setNewInterfaceData({ ...newInterfaceData, deviceType: type })} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: newInterfaceData.deviceType === type ? '#eff6ff' : 'white', borderColor: newInterfaceData.deviceType === type ? '#3b82f6' : '#e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700 }}>
                                            {getDeviceIcon(type)}
                                            <span style={{ fontSize: '0.75rem' }}>{type}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Initial Station Assignment</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }} value={newInterfaceData.stationId} onChange={(e) => setNewInterfaceData({ ...newInterfaceData, stationId: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateInterface} disabled={isSaving} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: isSaving ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? 'Creating...' : 'Create Interface'}</button>
                        </div>
                    </div>
                </div>
            )}

             {isEditModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
                    <div style={{ backgroundColor: 'white', width: '500px', borderRadius: '16px', overflow: 'hidden' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Edit Interface</h2>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Interface Name</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} value={editInterfaceData.name} onChange={(e) => setEditInterfaceData({ ...editInterfaceData, name: e.target.value })} />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Assigned Station</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white' }} value={editInterfaceData.stationId} onChange={(e) => setEditInterfaceData({ ...editInterfaceData, stationId: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {stations.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ padding: '24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsEditModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveEdit} disabled={isSaving} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: isSaving ? '#94a3b8' : '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? 'Saving...' : 'Save Changes'}</button>
                        </div>
                    </div>
                </div>
            )}

            {isDriversModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
                    <div style={{ backgroundColor: 'white', width: '600px', maxHeight: '85vh', borderRadius: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8fafc' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <SlidersHorizontal size={22} color="#10b981" /> Configure Interface Drivers
                            </h2>
                            <button onClick={() => setIsDriversModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><XCircle size={20} /></button>
                        </div>
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ padding: '12px 16px', backgroundColor: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0', display: 'flex', gap: '12px' }}>
                                <Info size={20} color="#16a34a" />
                                <div style={{ fontSize: '0.85rem', color: '#15803d' }}>
                                    Enable only the drivers required for the hardware connected to this display station to optimize Player performance.
                                </div>
                            </div>

                            {/* Serial Caliper Driver Card */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Cpu size={20} color="#3b82f6" />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Web Serial Caliper & Micrometer</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Connect SPC-to-USB calipers and micrometer tools</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={driversData.serialCaliper?.enabled || false}
                                        onChange={(e) => setDriversData(prev => ({
                                            ...prev,
                                            serialCaliper: { ...prev.serialCaliper, enabled: e.target.checked }
                                        }))}
                                        style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                {driversData.serialCaliper?.enabled && (
                                    <div style={{ marginTop: '16px', padding: '12px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Baud Rate</label>
                                            <select 
                                                value={driversData.serialCaliper?.baudRate || 9600}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    serialCaliper: { ...prev.serialCaliper, baudRate: Number(e.target.value) }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value={9600}>9600 bps</option>
                                                <option value={38400}>38400 bps</option>
                                                <option value={115200}>115200 bps</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Data Terminator</label>
                                            <select 
                                                value={driversData.serialCaliper?.terminator || '\r\n'}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    serialCaliper: { ...prev.serialCaliper, terminator: e.target.value }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="\r\n">CRLF (\r\n)</option>
                                                <option value="\n">LF (\n)</option>
                                                <option value="\r">CR (\r)</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bluetooth Caliper Driver Card */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Bluetooth size={20} color="#2563eb" />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Web Bluetooth Caliper & Scale</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Connect Bluetooth-enabled smart measurement tools</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={driversData.bluetoothCaliper?.enabled || false}
                                        onChange={(e) => setDriversData(prev => ({
                                            ...prev,
                                            bluetoothCaliper: { ...prev.bluetoothCaliper, enabled: e.target.checked }
                                        }))}
                                        style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                {driversData.bluetoothCaliper?.enabled && (
                                    <div style={{ marginTop: '16px', padding: '12px', borderTop: '1px solid #e2e8f0' }}>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Device Name Prefix Filter (Optional)</label>
                                        <input 
                                            type="text"
                                            placeholder="e.g. Mitutoyo, Caliper, Scale"
                                            value={driversData.bluetoothCaliper?.prefix || ''}
                                            onChange={(e) => setDriversData(prev => ({
                                                ...prev,
                                                bluetoothCaliper: { ...prev.bluetoothCaliper, prefix: e.target.value }
                                            }))}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Barcode Scanner Driver Card */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Sliders size={20} color="#ea580c" />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>USB Barcode Scanner</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure USB Keyboard (HID) or Serial COM Barcode Scanners</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={driversData.barcodeScanner?.enabled || false}
                                        onChange={(e) => setDriversData(prev => ({
                                            ...prev,
                                            barcodeScanner: { ...prev.barcodeScanner, enabled: e.target.checked }
                                        }))}
                                        style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                {driversData.barcodeScanner?.enabled && (
                                    <div style={{ marginTop: '16px', padding: '12px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Scanner Mode</label>
                                            <select 
                                                value={driversData.barcodeScanner?.mode || 'HID'}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    barcodeScanner: { ...prev.barcodeScanner, mode: e.target.value }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="HID">Keyboard Emulation (HID)</option>
                                                <option value="SERIAL">Serial COM Port</option>
                                            </select>
                                        </div>
                                        {driversData.barcodeScanner?.mode === 'SERIAL' ? (
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>COM Port</label>
                                                <input 
                                                    type="text"
                                                    value={driversData.barcodeScanner?.port || 'COM1'}
                                                    onChange={(e) => setDriversData(prev => ({
                                                        ...prev,
                                                        barcodeScanner: { ...prev.barcodeScanner, port: e.target.value }
                                                    }))}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                        ) : (
                                            <div style={{ opacity: 0.5 }}>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>COM Port (Not Applicable)</label>
                                                <input type="text" disabled value="N/A - Uses Keystrokes" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#e2e8f0' }} />
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Camera Driver Card */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Camera size={20} color="#0d9488" />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>Webcam & Inspection Camera</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Configure integrated webcams or IP streams for Vision AI OCR</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={driversData.webcam?.enabled || false}
                                        onChange={(e) => setDriversData(prev => ({
                                            ...prev,
                                            webcam: { ...prev.webcam, enabled: e.target.checked }
                                        }))}
                                        style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                {driversData.webcam?.enabled && (
                                    <div style={{ marginTop: '16px', padding: '12px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Target Resolution</label>
                                            <select 
                                                value={driversData.webcam?.resolution || '1080p'}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    webcam: { ...prev.webcam, resolution: e.target.value }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="720p">720p (1280x720)</option>
                                                <option value="1080p">1080p (1920x1080)</option>
                                                <option value="4k">4K (3840x2160)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>RTSP Stream IP (Optional)</label>
                                            <input 
                                                type="text"
                                                placeholder="rtsp://192.168.1.100/stream"
                                                value={driversData.webcam?.rtspUrl || ''}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    webcam: { ...prev.webcam, rtspUrl: e.target.value }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* OBD2 Driver Card */}
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', backgroundColor: '#fafafa' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Monitor size={20} color="#7c3aed" />
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1e293b' }}>OBD2 ELM327 Reader</div>
                                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Connect ELM327 adapters for automotive sensor tracking</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={driversData.obd2Reader?.enabled || false}
                                        onChange={(e) => setDriversData(prev => ({
                                            ...prev,
                                            obd2Reader: { ...prev.obd2Reader, enabled: e.target.checked }
                                        }))}
                                        style={{ width: '38px', height: '20px', cursor: 'pointer' }}
                                    />
                                </div>
                                {driversData.obd2Reader?.enabled && (
                                    <div style={{ marginTop: '16px', padding: '12px', borderTop: '1px solid #e2e8f0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                        <div>
                                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Transport Mode</label>
                                            <select 
                                                value={driversData.obd2Reader?.transport || 'BLUETOOTH'}
                                                onChange={(e) => setDriversData(prev => ({
                                                    ...prev,
                                                    obd2Reader: { ...prev.obd2Reader, transport: e.target.value }
                                                }))}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                            >
                                                <option value="BLUETOOTH">Bluetooth LE</option>
                                                <option value="SERIAL">USB Serial</option>
                                                <option value="WIFI">WiFi TCP Socket</option>
                                            </select>
                                        </div>
                                        {driversData.obd2Reader?.transport === 'WIFI' ? (
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Target IP Address</label>
                                                <input 
                                                    type="text"
                                                    value={driversData.obd2Reader?.ipAddress || '192.168.0.10'}
                                                    onChange={(e) => setDriversData(prev => ({
                                                        ...prev,
                                                        obd2Reader: { ...prev.obd2Reader, ipAddress: e.target.value }
                                                    }))}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                />
                                            </div>
                                        ) : (
                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Baud Rate</label>
                                                <select 
                                                    value={driversData.obd2Reader?.baudRate || 38400}
                                                    onChange={(e) => setDriversData(prev => ({
                                                        ...prev,
                                                        obd2Reader: { ...prev.obd2Reader, baudRate: Number(e.target.value) }
                                                    }))}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                                                >
                                                    <option value={9600}>9600 bps</option>
                                                    <option value={38400}>38400 bps</option>
                                                    <option value={115200}>115200 bps</option>
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsDriversModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveDrivers} disabled={isSaving} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: isSaving ? '#94a3b8' : '#10b981', color: 'white', border: 'none', fontWeight: 700, cursor: isSaving ? 'not-allowed' : 'pointer' }}>
                                {isSaving ? 'Saving...' : 'Save Configuration'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InterfaceManager;
