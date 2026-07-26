import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Activity, AlertTriangle, Bell, BellOff, Clock, Download, FileText,
    Gauge, History, Play, Pause, RefreshCcw, Settings, Shield, TrendingUp,
    XCircle, CheckCircle, ChevronDown, ChevronRight, Filter, Search,
    BarChart3, PieChart as PieChartIcon, Thermometer, Zap, Eye, EyeOff
} from 'lucide-react';
import {
    ResponsiveContainer, LineChart, Line, AreaChart, Area,
    BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import historian from '../utils/historianEngine';
import alarmEngine, { ALARM_STATES, SEVERITY } from '../utils/alarmEngine';
import securityService from '../utils/securityService';
import reportEngine from '../utils/reportEngine';

const COLORS = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    info: '#6b7280',
    active: '#ef4444',
    acknowledged: '#22c55e',
    normal: '#22c55e',
    panel: '#0f172a',
    panelLight: '#1e293b',
    border: '#334155',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    accent: '#3b82f6',
    success: '#22c55e',
    warning: '#eab308'
};

const SCADADashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [alarms, setAlarms] = useState([]);
    const [alarmStats, setAlarmStats] = useState({});
    const [historianStats, setHistorianStats] = useState({});
    const [liveData, setLiveData] = useState({});
    const [trendData, setTrendData] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [filterSeverity, setFilterSeverity] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const trendRef = useRef([]);
    const MAX_TREND_POINTS = 60;

    useEffect(() => {
        initEngines();
        return () => cleanup();
    }, []);

    useEffect(() => {
        const unsub1 = alarmEngine.subscribe('alarmActivated', handleAlarmActivated);
        const unsub2 = alarmEngine.subscribe('alarmAcknowledged', handleAlarmUpdated);
        const unsub3 = alarmEngine.subscribe('alarmReturnedToNormal', handleAlarmUpdated);
        const unsub4 = historian.subscribe('*', handleHistorianUpdate);
        return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
    }, []);

    const initEngines = async () => {
        try {
            await historian.initialize();
            await alarmEngine.initialize();
            await securityService.initialize();
            await registerSampleTags();
            startLiveSimulation();
            refreshData();
            setIsInitialized(true);
        } catch (err) {
            console.error('SCADA Dashboard init failed:', err);
        }
    };

    const cleanup = () => {
        historian.shutdown();
        alarmEngine.shutdown();
    };

    const registerSampleTags = async () => {
        await historian.registerTag('Temperature', { unit: '°C', dataType: 'number', deadband: 0.5 });
        await historian.registerTag('Pressure', { unit: 'PSI', dataType: 'number', deadband: 1 });
        await historian.registerTag('FlowRate', { unit: 'L/min', dataType: 'number', deadband: 0.1 });
        await historian.registerTag('MotorSpeed', { unit: 'RPM', dataType: 'number', deadband: 5 });
        await historian.registerTag('Vibration', { unit: 'mm/s', dataType: 'number', deadband: 0.2 });
        await historian.registerTag('Power', { unit: 'kW', dataType: 'number', deadband: 0.5 });

        alarmEngine.defineAlarm('Temperature', {
            id: 'ALM-TEMP-HH', severity: SEVERITY.CRITICAL, message: 'Temperature High-High',
            setpoint: 95, condition: 'high_high', deadband: 2, delay: 3000, group: 'Process'
        });
        alarmEngine.defineAlarm('Temperature', {
            id: 'ALM-TEMP-H', severity: SEVERITY.HIGH, message: 'Temperature High',
            setpoint: 85, condition: 'greater_than', deadband: 1, delay: 5000, group: 'Process'
        });
        alarmEngine.defineAlarm('Pressure', {
            id: 'ALM-PRESS-HH', severity: SEVERITY.CRITICAL, message: 'Pressure High-High',
            setpoint: 120, condition: 'high_high', deadband: 5, delay: 2000, group: 'Process'
        });
        alarmEngine.defineAlarm('Pressure', {
            id: 'ALM-PRESS-LL', severity: SEVERITY.HIGH, message: 'Pressure Low-Low',
            setpoint: 20, condition: 'low_low', deadband: 5, delay: 3000, group: 'Process'
        });
        alarmEngine.defineAlarm('MotorSpeed', {
            id: 'ALM-MOTOR-H', severity: SEVERITY.MEDIUM, message: 'Motor Over-Speed',
            setpoint: 3600, condition: 'greater_than', deadband: 100, group: 'Equipment'
        });
        alarmEngine.defineAlarm('Vibration', {
            id: 'ALM-VIB-H', severity: SEVERITY.HIGH, message: 'High Vibration Detected',
            setpoint: 7, condition: 'greater_than', deadband: 0.5, delay: 1000, group: 'Equipment'
        });
    };

    const startLiveSimulation = () => {
        setInterval(() => {
            const temp = 70 + Math.random() * 30;
            const pressure = 40 + Math.random() * 80;
            const flow = 5 + Math.random() * 15;
            const rpm = 1500 + Math.random() * 2000;
            const vibration = 2 + Math.random() * 6;
            const power = 10 + Math.random() * 40;

            historian.recordSample('Temperature', temp);
            historian.recordSample('Pressure', pressure);
            historian.recordSample('FlowRate', flow);
            historian.recordSample('MotorSpeed', rpm);
            historian.recordSample('Vibration', vibration);
            historian.recordSample('Power', power);

            alarmEngine.evaluate('Temperature', temp);
            alarmEngine.evaluate('Pressure', pressure);
            alarmEngine.evaluate('MotorSpeed', rpm);
            alarmEngine.evaluate('Vibration', vibration);

            setLiveData({ Temperature: temp, Pressure: pressure, FlowRate: flow, MotorSpeed: rpm, Vibration: vibration, Power: power });

            trendRef.current.push({
                time: new Date().toLocaleTimeString(),
                Temperature: Math.round(temp * 10) / 10,
                Pressure: Math.round(pressure * 10) / 10,
                FlowRate: Math.round(flow * 100) / 100,
                MotorSpeed: Math.round(rpm),
                Vibration: Math.round(vibration * 100) / 100,
                Power: Math.round(power * 10) / 10
            });
            if (trendRef.current.length > MAX_TREND_POINTS) trendRef.current.shift();
            setTrendData([...trendRef.current]);
        }, 2000);
    };

    const refreshData = async () => {
        setAlarms(alarmEngine.getActiveAlarms());
        setAlarmStats(alarmEngine.getAlarmStats());
        setHistorianStats(await historian.getStats());
        setAuditLogs(await securityService.getAuditLogs({ limit: 50 }));
        setCurrentUser(securityService._currentUser);
    };

    const handleAlarmActivated = useCallback(() => {
        setAlarms(alarmEngine.getActiveAlarms());
        setAlarmStats(alarmEngine.getAlarmStats());
    }, []);

    const handleAlarmUpdated = useCallback(() => {
        setAlarms(alarmEngine.getActiveAlarms());
        setAlarmStats(alarmEngine.getAlarmStats());
    }, []);

    const handleHistorianUpdate = useCallback(() => {
        setHistorianStats(historian.getStats ? {} : historianStats);
    }, []);

    const handleAcknowledge = async (alarmId) => {
        await alarmEngine.acknowledgeAlarm(alarmId, currentUser?.username || 'operator');
        refreshData();
    };

    const handleAcknowledgeAll = async () => {
        await alarmEngine.acknowledgeAll(currentUser?.username || 'operator');
        refreshData();
    };

    const handleShelve = async (alarmId) => {
        await alarmEngine.shelveAlarm(alarmId, 3600000);
        refreshData();
    };

    const handleGenerateReport = (type) => {
        let report;
        if (type === 'shift') {
            report = reportEngine.generateShiftReport({
                totalAlarms: alarmStats.totalActive || 0,
                criticalAlarms: alarmStats.bySeverity?.Critical || 0
            });
        } else if (type === 'alarm') {
            report = reportEngine.generateAlarmReport({});
        }
        if (report) reportEngine.downloadReport(report, 'json');
    };

    const filteredAlarms = alarms.filter(a => {
        if (filterSeverity !== 'all' && a.severity?.label !== filterSeverity) return false;
        if (searchTerm && !a.message?.toLowerCase().includes(searchTerm.toLowerCase()) && !a.tagName?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        return true;
    });

    const renderOverview = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <StatCard icon={<AlertTriangle size={20} />} label="Active Alarms" value={alarmStats.totalActive || 0}
                color={alarmStats.totalActive > 0 ? COLORS.critical : COLORS.success} />
            <StatCard icon={<Bell size={20} />} label="Unacknowledged" value={alarmStats.unacknowledged || 0}
                color={alarmStats.unacknowledged > 0 ? COLORS.warning : COLORS.success} />
            <StatCard icon={<History size={20} />} label="Historian Samples" value={historianStats.sampleCount || 0}
                color={COLORS.accent} />
            <StatCard icon={<BarChart3 size={20} />} label="Tags Tracked" value={historianStats.tagCount || 0}
                color={COLORS.info} />
            <StatCard icon={<Shield size={20} />} label="Audit Entries" value={auditLogs.length}
                color={COLORS.accent} />
            <StatCard icon={<Zap size={20} />} label="System Status" value="ONLINE"
                color={COLORS.success} />
        </div>
    );

    const renderTrendChart = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <TrendingUp size={18} color={COLORS.accent} />
                <span style={styles.cardTitle}>Live Process Trends</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                    <XAxis dataKey="time" stroke={COLORS.textMuted} tick={{ fontSize: 11 }} />
                    <YAxis stroke={COLORS.textMuted} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: COLORS.text }} />
                    <Legend wrapperStyle={{ color: COLORS.textMuted, fontSize: 12 }} />
                    <Line type="monotone" dataKey="Temperature" stroke={COLORS.critical} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Pressure" stroke={COLORS.accent} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="FlowRate" stroke={COLORS.success} strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="MotorSpeed" stroke={COLORS.warning} strokeWidth={2} dot={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );

    const renderLiveValues = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <Gauge size={18} color={COLORS.accent} />
                <span style={styles.cardTitle}>Live Process Values</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
                {Object.entries(liveData).map(([key, val]) => (
                    <div key={key} style={styles.valueCard}>
                        <div style={styles.valueLabel}>{key}</div>
                        <div style={styles.valueNumber}>{typeof val === 'number' ? val.toFixed(1) : val}</div>
                        <div style={styles.valueUnit}>{getUnit(key)}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAlarmPanel = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <Bell size={18} color={COLORS.critical} />
                <span style={styles.cardTitle}>Active Alarms ({filteredAlarms.length})</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <button onClick={handleAcknowledgeAll} style={styles.btnSmall}>Ack All</button>
                    <button onClick={refreshData} style={styles.btnSmall}><RefreshCcw size={14} /></button>
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} style={styles.select}>
                    <option value="all">All Severities</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                </select>
                <input placeholder="Search alarms..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.input} />
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {filteredAlarms.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: COLORS.success }}>
                        <CheckCircle size={24} style={{ marginBottom: 8 }} />
                        <div>No Active Alarms</div>
                    </div>
                ) : filteredAlarms.map(alarm => (
                    <div key={alarm.id} style={{ ...styles.alarmRow, borderLeftColor: alarm.severity?.color || COLORS.info }}>
                        <div style={{ flex: 1 }}>
                            <div style={styles.alarmMessage}>{alarm.message}</div>
                            <div style={styles.alarmMeta}>
                                {alarm.tagName} | {alarm.severity?.label} | {alarm.state} | {new Date(alarm.triggeredAt).toLocaleTimeString()}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 4 }}>
                            {alarm.state !== ALARM_STATES.ACKNOWLEDGED && (
                                <button onClick={() => handleAcknowledge(alarm.id)} style={styles.btnAck} title="Acknowledge">
                                    <CheckCircle size={14} />
                                </button>
                            )}
                            <button onClick={() => handleShelve(alarm.id)} style={styles.btnShelve} title="Shelve 1 hour">
                                <Clock size={14} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderAlarmStats = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <PieChartIcon size={18} color={COLORS.accent} />
                <span style={styles.cardTitle}>Alarm Statistics</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                    <h4 style={styles.subTitle}>By Severity</h4>
                    {Object.entries(alarmStats.bySeverity || {}).map(([sev, count]) => (
                        <div key={sev} style={styles.statRow}>
                            <span style={styles.statLabel}>{sev}</span>
                            <span style={{ ...styles.statValue, color: getSeverityColor(sev) }}>{count}</span>
                        </div>
                    ))}
                </div>
                <div>
                    <h4 style={styles.subTitle}>By State</h4>
                    {Object.entries(alarmStats.byState || {}).map(([state, count]) => (
                        <div key={state} style={styles.statRow}>
                            <span style={styles.statLabel}>{state}</span>
                            <span style={styles.statValue}>{count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAuditTrail = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <Shield size={18} color={COLORS.accent} />
                <span style={styles.cardTitle}>Audit Trail</span>
            </div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {auditLogs.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 20, color: COLORS.textMuted }}>No audit entries</div>
                ) : auditLogs.map((log, i) => (
                    <div key={i} style={styles.auditRow}>
                        <div style={styles.auditTime}>{new Date(log.timestamp).toLocaleString()}</div>
                        <div style={styles.auditAction}>{log.action}</div>
                        <div style={styles.auditUser}>{log.userId}</div>
                        <div style={styles.auditResource}>{log.resource}</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderReports = () => (
        <div style={styles.card}>
            <div style={styles.cardHeader}>
                <FileText size={18} color={COLORS.accent} />
                <span style={styles.cardTitle}>Report Generation</span>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => handleGenerateReport('shift')} style={styles.btnReport}>
                    <FileText size={16} /> Shift Summary
                </button>
                <button onClick={() => handleGenerateReport('alarm')} style={styles.btnReport}>
                    <AlertTriangle size={16} /> Alarm History
                </button>
                <button onClick={() => handleGenerateReport('oee')} style={styles.btnReport}>
                    <Gauge size={16} /> OEE Report
                </button>
                <button onClick={() => handleGenerateReport('production')} style={styles.btnReport}>
                    <BarChart3 size={16} /> Production Analytics
                </button>
            </div>
        </div>
    );

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <Activity size={16} /> },
        { id: 'trends', label: 'Trends', icon: <TrendingUp size={16} /> },
        { id: 'alarms', label: 'Alarms', icon: <Bell size={16} /> },
        { id: 'security', label: 'Security', icon: <Shield size={16} /> },
        { id: 'reports', label: 'Reports', icon: <FileText size={16} /> }
    ];

    if (!isInitialized) {
        return (
            <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ textAlign: 'center', color: COLORS.text }}>
                    <Activity size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: 16 }} />
                    <div style={{ fontSize: 18 }}>Initializing SCADA Systems...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Zap size={24} color={COLORS.accent} />
                    <div>
                        <h1 style={styles.title}>SCADA Control Center</h1>
                        <p style={styles.subtitle}>Real-time Monitoring & Control</p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={styles.statusBadge}>
                        <div style={styles.statusDot} />
                        <span>SYSTEM ONLINE</span>
                    </div>
                    <button onClick={refreshData} style={styles.btnRefresh}><RefreshCcw size={16} /></button>
                </div>
            </div>

            <div style={styles.tabBar}>
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                        style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            <div style={styles.content}>
                {activeTab === 'overview' && (
                    <>
                        {renderOverview()}
                        {renderLiveValues()}
                        {renderAlarmPanel()}
                    </>
                )}
                {activeTab === 'trends' && (
                    <>
                        {renderOverview()}
                        {renderTrendChart()}
                    </>
                )}
                {activeTab === 'alarms' && (
                    <>
                        {renderOverview()}
                        {renderAlarmPanel()}
                        {renderAlarmStats()}
                    </>
                )}
                {activeTab === 'security' && (
                    <>
                        {renderOverview()}
                        {renderAuditTrail()}
                    </>
                )}
                {activeTab === 'reports' && (
                    <>
                        {renderOverview()}
                        {renderReports()}
                    </>
                )}
            </div>
        </div>
    );
};

const StatCard = ({ icon, label, value, color }) => (
    <div style={{ ...styles.statCard, borderLeftColor: color }}>
        <div style={{ color, marginBottom: 8 }}>{icon}</div>
        <div style={styles.statCardValue}>{value}</div>
        <div style={styles.statCardLabel}>{label}</div>
    </div>
);

const getUnit = (key) => {
    const units = { Temperature: '°C', Pressure: 'PSI', FlowRate: 'L/min', MotorSpeed: 'RPM', Vibration: 'mm/s', Power: 'kW' };
    return units[key] || '';
};

const getSeverityColor = (sev) => {
    const map = { Critical: COLORS.critical, High: COLORS.high, Medium: COLORS.medium, Low: COLORS.low, Info: COLORS.info };
    return map[sev] || COLORS.info;
};

const styles = {
    container: { minHeight: '100vh', backgroundColor: '#0a0e1a', color: COLORS.text, fontFamily: "'Inter', system-ui, sans-serif" },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panel },
    title: { margin: 0, fontSize: 20, fontWeight: 700, color: COLORS.text },
    subtitle: { margin: 0, fontSize: 12, color: COLORS.textMuted },
    statusBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 20, backgroundColor: 'rgba(34,197,94,0.15)', color: COLORS.success, fontSize: 12, fontWeight: 600 },
    statusDot: { width: 8, height: 8, borderRadius: '50%', backgroundColor: COLORS.success, boxShadow: `0 0 8px ${COLORS.success}` },
    btnRefresh: { padding: 8, borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panelLight, color: COLORS.text, cursor: 'pointer' },
    tabBar: { display: 'flex', gap: 4, padding: '12px 24px', backgroundColor: COLORS.panel, borderBottom: `1px solid ${COLORS.border}` },
    tab: { display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', backgroundColor: 'transparent', color: COLORS.textMuted, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' },
    tabActive: { backgroundColor: COLORS.accent, color: '#fff' },
    content: { padding: 24 },
    card: { backgroundColor: COLORS.panel, borderRadius: 12, border: `1px solid ${COLORS.border}`, padding: 20, marginBottom: 16 },
    cardHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 },
    cardTitle: { fontSize: 15, fontWeight: 600, color: COLORS.text },
    statCard: { backgroundColor: COLORS.panelLight, borderRadius: 10, padding: 16, borderLeft: '3px solid', border: `1px solid ${COLORS.border}` },
    statCardValue: { fontSize: 24, fontWeight: 700, color: COLORS.text },
    statCardLabel: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
    valueCard: { backgroundColor: COLORS.panelLight, borderRadius: 8, padding: 12, textAlign: 'center', border: `1px solid ${COLORS.border}` },
    valueLabel: { fontSize: 11, color: COLORS.textMuted, marginBottom: 4 },
    valueNumber: { fontSize: 22, fontWeight: 700, color: COLORS.text },
    valueUnit: { fontSize: 11, color: COLORS.textMuted },
    alarmRow: { display: 'flex', alignItems: 'center', padding: '10px 12px', borderRadius: 8, marginBottom: 6, backgroundColor: COLORS.panelLight, borderLeft: '3px solid', transition: 'background 0.2s' },
    alarmMessage: { fontSize: 13, fontWeight: 600, color: COLORS.text },
    alarmMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    btnSmall: { padding: '6px 12px', borderRadius: 6, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panelLight, color: COLORS.text, cursor: 'pointer', fontSize: 12 },
    btnAck: { padding: 6, borderRadius: 6, border: 'none', backgroundColor: 'rgba(34,197,94,0.2)', color: COLORS.success, cursor: 'pointer' },
    btnShelve: { padding: 6, borderRadius: 6, border: 'none', backgroundColor: 'rgba(234,179,8,0.2)', color: COLORS.warning, cursor: 'pointer' },
    select: { padding: '6px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panelLight, color: COLORS.text, fontSize: 12 },
    input: { flex: 1, padding: '6px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panelLight, color: COLORS.text, fontSize: 12 },
    subTitle: { fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 8 },
    statRow: { display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: `1px solid ${COLORS.border}` },
    statLabel: { fontSize: 12, color: COLORS.textMuted },
    statValue: { fontSize: 12, fontWeight: 600, color: COLORS.text },
    auditRow: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 },
    auditTime: { color: COLORS.textMuted },
    auditAction: { color: COLORS.accent, fontWeight: 500 },
    auditUser: { color: COLORS.text },
    auditResource: { color: COLORS.textMuted },
    btnReport: { display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 8, border: `1px solid ${COLORS.border}`, backgroundColor: COLORS.panelLight, color: COLORS.text, cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.2s' }
};

export default SCADADashboard;
