import React, { useEffect, useMemo, useState } from 'react';
import {
    Layout,
    Plus,
    Search,
    Monitor,
    Activity,
    Globe,
    MapPin,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Layers,
    Clock,
    Pencil,
    Calendar
} from 'lucide-react';
import {
    getStations,
    saveStation,
    deleteStation,
    getInterfaces,
    getStationGroups,
    saveStationGroup,
    deleteStationGroup,
    getStationEvents
} from '../utils/database';
import { getAllFrontlineApps } from '../utils/supabaseFrontlineDB';

const StationManager = () => {
    const [stations, setStations] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const [interfaces, setInterfaces] = useState([]);
    const [stationGroups, setStationGroups] = useState([]);
    const [stationEvents, setStationEvents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [newStationData, setNewStationData] = useState({
        name: '',
        description: '',
        site: 'Factory A',
        area: 'Assembly Floor',
        group: 'Ungrouped',
        status: 'READY'
    });

    const [frontlineApps, setFrontlineApps] = useState([]);
    const [isEditAssignmentsOpen, setIsEditAssignmentsOpen] = useState(false);
    const [tempAssignedApps, setTempAssignedApps] = useState([]);
    const [isManageDevicesOpen, setIsManageDevicesOpen] = useState(false);
    const [tempInterfaceId, setTempInterfaceId] = useState('');
    const [tempTimezone, setTempTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (selectedStation?.id) {
            loadStationEvents(selectedStation.id);
        } else {
            setStationEvents([]);
        }
    }, [selectedStation?.id]);

    const loadData = async () => {
        const [s, i, apps, groups] = await Promise.all([
            getStations(),
            getInterfaces(),
            getAllFrontlineApps(),
            getStationGroups()
        ]);

        const ungrouped = { id: 'default_group_ungrouped', name: 'Ungrouped', color: '#94a3b8' };
        const normalizedGroups = groups.some(g => g.name === 'Ungrouped')
            ? groups
            : [ungrouped, ...groups];

        setStations(s);
        setInterfaces(i);
        setFrontlineApps(apps);
        setStationGroups(normalizedGroups);

        if (selectedStation?.id) {
            const refreshed = s.find((row) => row.id === selectedStation.id) || null;
            setSelectedStation(refreshed);
        }
    };

    const loadStationEvents = async (stationId) => {
        const events = await getStationEvents(stationId);
        setStationEvents(events);
    };

    const handleCreateStation = async () => {
        if (!newStationData.name.trim()) return;

        const station = {
            ...newStationData,
            interfaceId: null,
            assignedApps: [],
            devices: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lastEvent: 'Station Created'
        };

        await saveStation(station);
        setIsCreateModalOpen(false);
        setNewStationData({
            name: '',
            description: '',
            site: 'Factory A',
            area: 'Assembly Floor',
            group: 'Ungrouped',
            status: 'READY'
        });
        await loadData();
    };

    const handleCreateStationGroup = async () => {
        const trimmed = newGroupName.trim();
        if (!trimmed) return;

        await saveStationGroup({ name: trimmed, color: '#3b82f6' });
        setNewGroupName('');
        setIsCreateGroupModalOpen(false);
        await loadData();
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (groupName === 'Ungrouped') return;
        if (!window.confirm(`Delete station group "${groupName}"? Stations in this group will be moved to Ungrouped.`)) return;

        const impacted = stations.filter((s) => (s.group || 'Ungrouped') === groupName);
        for (const station of impacted) {
            await saveStation({ ...station, group: 'Ungrouped' });
        }

        await deleteStationGroup(groupId);
        await loadData();
    };

    const handleSaveAssignments = async () => {
        if (!selectedStation) return;
        const updatedStation = { ...selectedStation, assignedApps: tempAssignedApps };
        await saveStation(updatedStation);
        setSelectedStation(updatedStation);
        setIsEditAssignmentsOpen(false);
        await loadData();
        await loadStationEvents(updatedStation.id);
    };

    const handleSaveDeviceAndTimezone = async () => {
        if (!selectedStation) return;
        const updatedStation = {
            ...selectedStation,
            interfaceId: tempInterfaceId || null,
            timezone: tempTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone
        };
        await saveStation(updatedStation);
        setSelectedStation(updatedStation);
        setIsManageDevicesOpen(false);
        await loadData();
        await loadStationEvents(updatedStation.id);
    };

    const handleDeleteStation = async (id) => {
        if (window.confirm('Are you sure you want to delete this station?')) {
            await deleteStation(id);
            if (selectedStation?.id === id) setSelectedStation(null);
            await loadData();
        }
    };

    const filteredStations = stations.filter((s) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.group || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.site || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.area || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const groupedStations = useMemo(() => {
        return stationGroups.map((group) => ({
            ...group,
            stations: filteredStations.filter((s) => (s.group || 'Ungrouped') === group.name)
        }));
    }, [stationGroups, filteredStations]);

    const getStatusBadge = (status) => {
        const styles = {
            READY: { bg: '#eff6ff', color: '#1e40af', dotClass: 'pulse-dot-success', label: 'READY' },
            RUNNING: { bg: '#dcfce7', color: '#166534', dotClass: 'pulse-dot-success', label: 'RUNNING' },
            DOWN: { bg: '#fee2e2', color: '#991b1b', dotClass: 'pulse-dot-danger', label: 'DOWN' },
            OFFLINE: { bg: '#f1f5f9', color: '#94a3b8', dotClass: '', label: 'OFFLINE' }
        };
        const style = styles[status] || styles.OFFLINE;
        return (
            <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '6px', 
                padding: '4px 10px', 
                borderRadius: '20px', 
                backgroundColor: style.bg, 
                color: style.color, 
                fontSize: '0.7rem', 
                fontWeight: 800,
                letterSpacing: '0.05em'
            }}>
                {style.dotClass ? (
                    <span className={`pulse-dot ${style.dotClass}`} style={{ width: '6px', height: '6px' }} />
                ) : (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                )}
                {style.label}
            </span>
        );
    };

    const showSidebar = !isMobile || !selectedStation;
    const showDetails = !isMobile || !!selectedStation;

    return (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', backgroundColor: '#f8fafc', overflow: 'hidden' }}>
            {showSidebar && (
                <div style={{ width: isMobile ? '100%' : '380px', flexShrink: 0, borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', backgroundColor: 'white' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Stations</h2>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => setIsCreateGroupModalOpen(true)} className="mandor-widget-btn" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: 'white', color: '#3b82f6', border: '1px solid #e2e8f0', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <Layers size={14} /> Group
                                </button>
                                <button onClick={() => setIsCreateModalOpen(true)} className="mandor-widget-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                                    <Plus size={16} /> Station
                                </button>
                            </div>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} size={16} />
                            <input 
                                type="text" 
                                placeholder="Search site, area, group, station..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)} 
                                className="mandor-input"
                                style={{ 
                                    width: '100%', 
                                    padding: '10px 10px 10px 40px', 
                                    borderRadius: '10px', 
                                    border: '1px solid #e2e8f0',
                                    outline: 'none',
                                    fontSize: '0.9rem',
                                    backgroundColor: '#f8fafc'
                                }} 
                            />
                        </div>
                    </div>

                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {stationGroups.map((group) => (
                            <span key={group.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '20px', backgroundColor: '#f1f5f9', color: '#334155', fontSize: '0.75rem', fontWeight: 700, border: `1px solid ${group.color || '#cbd5e1'}` }}>
                                <Layers size={12} /> {group.name}
                                {group.name !== 'Ungrouped' && (
                                    <button onClick={() => handleDeleteGroup(group.id, group.name)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', padding: 0, display: 'inline-flex' }}>
                                        <Trash2 size={12} />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                        {groupedStations.map((group) => (
                            <div key={group.id} style={{ marginBottom: '20px' }}>
                                <div style={{ padding: '8px 12px', fontSize: '0.7rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Layers size={12} /> {group.name}
                                </div>
                                {group.stations.length === 0 ? (
                                    <div style={{ padding: '8px 12px', fontSize: '0.78rem', color: '#94a3b8' }}>No stations in this group</div>
                                ) : group.stations.map((station) => (
                                    <div
                                        key={station.id}
                                        onClick={() => setSelectedStation(station)}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            marginBottom: '10px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedStation?.id === station.id ? '#eff6ff' : '#ffffff',
                                            border: selectedStation?.id === station.id ? '1px solid #3b82f6' : '1px solid #e2e8f0',
                                            boxShadow: selectedStation?.id === station.id ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                                            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: selectedStation?.id === station.id ? 'translateY(-1px)' : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedStation?.id !== station.id) {
                                                e.currentTarget.style.borderColor = '#3b82f6';
                                                e.currentTarget.style.backgroundColor = '#f8fafc';
                                                e.currentTarget.style.transform = 'translateY(-1px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedStation?.id !== station.id) {
                                                e.currentTarget.style.borderColor = '#e2e8f0';
                                                e.currentTarget.style.backgroundColor = '#ffffff';
                                                e.currentTarget.style.transform = 'none';
                                                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.02)';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                                            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem' }}>{station.name}</span>
                                            {getStatusBadge(station.status)}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.75rem' }}>
                                            <Globe size={12} /> {station.site || 'Default Site'}
                                            <span>•</span>
                                            <MapPin size={12} /> {station.area || 'General Area'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {showDetails && selectedStation && (
                <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                    <div style={{ 
                        padding: isMobile ? '16px' : '24px', 
                        borderBottom: '1px solid var(--border-color)', 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row', 
                        gap: isMobile ? '16px' : '24px', 
                        alignItems: isMobile ? 'flex-start' : 'center', 
                        justifyContent: 'space-between' 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#f0f7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <MapPin size={24} color="#3b82f6" />
                            </div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: isMobile ? '1.25rem' : '1.5rem', fontWeight: 900, color: '#0f172a' }}>{selectedStation.name}</h1>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                                    <Globe size={14} /> <span>{selectedStation.site || 'Default Site'}</span>
                                    <span>•</span>
                                    <MapPin size={14} /> <span>{selectedStation.area || 'General Area'}</span>
                                    <span>•</span>
                                    <Layers size={14} /> <span>{selectedStation.group || 'Ungrouped'}</span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'flex-end' : 'flex-start' }}>
                            <button onClick={() => handleDeleteStation(selectedStation.id)} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #fee2e2', color: '#ef4444', backgroundColor: 'transparent', cursor: 'pointer' }}><Trash2 size={18} /></button>
                            <button onClick={() => setSelectedStation(null)} style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: isMobile ? '16px' : '32px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '20px' : '32px' }}>
                            <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Layout size={18} color="#3b82f6" /> App Assignments</h3>
                                {selectedStation.assignedApps?.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {selectedStation.assignedApps.map((appId, idx) => {
                                            const app = frontlineApps.find((a) => a.id === appId);
                                            if (!app) return null;
                                            return (
                                                <div key={idx} style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ fontWeight: 600 }}>{app.name}</span>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>v{app.version || '1.0'}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '0.85rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>No apps assigned to this station.</div>
                                )}
                                <button onClick={() => { setTempAssignedApps(selectedStation.assignedApps || []); setIsEditAssignmentsOpen(true); }} style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Edit Assignments</button>
                            </div>

                            <div style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
                                <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}><Monitor size={18} color="#3b82f6" /> Interface & Station Settings</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ padding: '16px', backgroundColor: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Active Interface</div>
                                        {selectedStation.interfaceId ? (() => {
                                            const ui = interfaces.find((i) => i.id === selectedStation.interfaceId);
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <Monitor size={20} color="#10b981" />
                                                    <div>
                                                        <div style={{ fontWeight: 700 }}>{ui ? ui.name : 'Unknown Interface'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: '#10b981' }}>{ui ? (ui.status || 'ONLINE') : 'ONLINE'}</div>
                                                    </div>
                                                </div>
                                            );
                                        })() : (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-secondary)' }}>
                                                <Monitor size={20} />
                                                <span style={{ fontSize: '0.85rem' }}>No interface assigned</span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '12px 16px', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#475569', fontWeight: 600, fontSize: '0.85rem' }}><Clock size={14} /> Timezone</span>
                                        <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{selectedStation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
                                    </div>
                                </div>
                                <button onClick={() => { setTempInterfaceId(selectedStation.interfaceId || ''); setTempTimezone(selectedStation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone); setIsManageDevicesOpen(true); }} style={{ width: '100%', marginTop: '20px', padding: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid #3b82f6', color: '#3b82f6', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>Manage Interface & Timezone</button>
                            </div>
                        </div>

                        <div style={{ marginTop: '32px' }}>
                            <h3 style={{ margin: '0 0 20px 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}><Calendar size={16} /> Recent Events</h3>
                            <div style={{ border: '1px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead style={{ backgroundColor: 'var(--bg-primary)' }}>
                                        <tr>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Timestamp</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Event</th>
                                            <th style={{ textAlign: 'left', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stationEvents.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} style={{ padding: '16px 20px', color: '#94a3b8' }}>No events yet for this station.</td>
                                            </tr>
                                        ) : stationEvents.slice(0, 12).map((event) => (
                                            <tr key={event.id}>
                                                <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>{new Date(event.timestamp).toLocaleString()}</td>
                                                <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}><span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-primary)', fontWeight: 700 }}>{event.eventType}</span></td>
                                                <td style={{ padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>{event.detail || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && !selectedStation && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ width: '80px', height: '80px', borderRadius: '24px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}><MapPin size={32} color="#cbd5e1" /></div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>Select a station to view details</div>
                </div>
            )}

            {isCreateModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', width: '520px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Create New Station</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Station Name</label>
                                <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} placeholder="e.g. Assembly Line A - Station 1" value={newStationData.name} onChange={(e) => setNewStationData({ ...newStationData, name: e.target.value })} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Site</label>
                                    <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={newStationData.site} onChange={(e) => setNewStationData({ ...newStationData, site: e.target.value })} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Area</label>
                                    <input type="text" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }} value={newStationData.area} onChange={(e) => setNewStationData({ ...newStationData, area: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Station Group</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }} value={newStationData.group} onChange={(e) => setNewStationData({ ...newStationData, group: e.target.value })}>
                                    {stationGroups.map((group) => <option key={group.id} value={group.name}>{group.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Description</label>
                                <textarea style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', minHeight: '80px', fontFamily: 'inherit' }} placeholder="Brief details about this workspace..." value={newStationData.description} onChange={(e) => setNewStationData({ ...newStationData, description: e.target.value })} />
                            </div>
                        </div>
                        <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsCreateModalOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateStation} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Create Station</button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateGroupModalOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2100 }}>
                    <div style={{ backgroundColor: 'white', width: '440px', borderRadius: '14px', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Create Station Group</h3>
                            <button onClick={() => setIsCreateGroupModalOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={18} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Group Name</label>
                            <input type="text" placeholder="e.g. Packaging Area" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                        </div>
                        <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', backgroundColor: '#f8fafc' }}>
                            <button onClick={() => setIsCreateGroupModalOpen(false)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleCreateStationGroup} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer' }}>Create Group</button>
                        </div>
                    </div>
                </div>
            )}

            {isEditAssignmentsOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', width: '600px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>App Assignments</h2>
                            <button onClick={() => setIsEditAssignmentsOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', fontSize: '0.9rem' }}>Select the applications that operators can access and run on <b>{selectedStation?.name}</b>.</p>
                            {frontlineApps.length > 0 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {frontlineApps.map((app) => {
                                        const isChecked = tempAssignedApps.includes(app.id);
                                        return (
                                            <div key={app.id} onClick={() => setTempAssignedApps(isChecked ? tempAssignedApps.filter((id) => id !== app.id) : [...tempAssignedApps, app.id])} style={{ padding: '16px', borderRadius: '8px', border: `1px solid ${isChecked ? '#3b82f6' : 'var(--border-color)'}`, backgroundColor: isChecked ? '#eff6ff' : 'var(--bg-primary)', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'all 0.2s' }}>
                                                <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: `2px solid ${isChecked ? '#3b82f6' : '#cbd5e1'}`, backgroundColor: isChecked ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{isChecked && <CheckCircle2 size={14} color="white" />}</div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{app.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{app.category || 'Custom App'} • v{app.version || '1.0'}</div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '1px dashed #cbd5e1', borderRadius: '8px' }}>No apps available. Create an app first in the App Builder.</div>
                            )}
                        </div>
                        <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsEditAssignmentsOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveAssignments} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Save Assignments</button>
                        </div>
                    </div>
                </div>
            )}

            {isManageDevicesOpen && (
                <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', width: '520px', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Manage Interface & Timezone</h2>
                            <button onClick={() => setIsManageDevicesOpen(false)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><XCircle size={20} color="#94a3b8" /></button>
                        </div>
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Primary Display Interface</label>
                                <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 600 }} value={tempInterfaceId} onChange={(e) => setTempInterfaceId(e.target.value)}>
                                    <option value="">-- No Interface Assigned --</option>
                                    {interfaces.map((ui) => <option key={ui.id} value={ui.id}>{ui.name} ({ui.ipAddress || 'Unknown IP'})</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Station Timezone</label>
                                <input type="text" value={tempTimezone} onChange={(e) => setTempTimezone(e.target.value)} placeholder="e.g. Asia/Jakarta" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontFamily: 'inherit' }} />
                            </div>
                        </div>
                        <div style={{ padding: '24px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button onClick={() => setIsManageDevicesOpen(false)} style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSaveDeviceAndTimezone} style={{ padding: '10px 24px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationManager;
