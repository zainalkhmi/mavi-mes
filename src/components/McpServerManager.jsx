import React, { useState, useEffect, useRef } from 'react';
import {
    BrainCircuit,
    Shield,
    Database,
    Cpu,
    Tv,
    Users,
    Settings,
    Activity,
    Code,
    Terminal,
    Play,
    Pause,
    Plus,
    Key,
    RefreshCw,
    CheckCircle,
    Info,
    ArrowRight
} from 'lucide-react';

export default function McpServerManager() {
    const [serverPort, setServerPort] = useState(3011);
    const [isRunning, setIsRunning] = useState(true);
    const [apiToken, setApiToken] = useState('mavi_mcp_live_pk_8849201974');
    const [showToken, setShowToken] = useState(false);
    
    // Live logs simulation
    const [logs, setLogs] = useState([
        { id: 1, time: '13:42:01', type: 'system', msg: 'Mavi MCP Server initialized on port 3011' },
        { id: 2, time: '13:42:03', type: 'system', msg: 'Successfully registered 6 default Mavi tools' },
        { id: 3, time: '13:42:15', type: 'info', msg: 'Authorized client connection established (Claude 3.5 Sonnet)' },
        { id: 4, time: '13:43:02', type: 'tool_call', msg: 'Tool call: [read_mavi_table] with args: { tableId: "quality_log", limit: 5 }' },
        { id: 5, time: '13:43:03', type: 'tool_resp', msg: 'Tool response: returned 5 records, size: 1.2KB' }
    ]);
    
    // Playground state
    const [userQuery, setUserQuery] = useState('');
    const [playgroundResponses, setPlaygroundResponses] = useState([]);
    const [isThinking, setIsThinking] = useState(false);
    const logsEndRef = useRef(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    // Expose 6 default Mavi tools definitions
    const exposedTools = [
        {
            name: 'read_mavi_table',
            desc: 'Membaca record data dari tabel kualitas, inventori, atau log produksi di Mavi.',
            params: { tableId: 'string (e.g. quality_log)', limit: 'number (opsional)' },
            impact: 'READ'
        },
        {
            name: 'write_mavi_table',
            desc: 'Menulis record baru atau memperbarui entri tabel produksi secara langsung.',
            params: { tableId: 'string', recordData: 'object' },
            impact: 'WRITE'
        },
        {
            name: 'get_station_status',
            desc: 'Mengambil status real-time dari stasiun kerja di shop floor.',
            params: { stationId: 'string (e.g. WS-01)' },
            impact: 'READ'
        },
        {
            name: 'set_station_status',
            desc: 'Mengubah status operasional stasiun kerja (e.g. RUNNING, DOWN, OFFLINE).',
            params: { stationId: 'string', status: 'string' },
            impact: 'WRITE'
        },
        {
            name: 'get_machine_info',
            desc: 'Membaca telemetri mesin, status error, dan data produksi IoT.',
            params: { machineId: 'string' },
            impact: 'READ'
        },
        {
            name: 'list_active_users',
            desc: 'Mendapatkan data operator yang aktif login di stasiun kerja.',
            params: {},
            impact: 'READ'
        }
    ];

    // Handle playground query submission
    const handleQuerySubmit = (e) => {
        e.preventDefault();
        const query = userQuery.trim();
        if (!query) return;

        setUserQuery('');
        setIsThinking(true);

        const newPlaygroundLogs = [
            ...playgroundResponses,
            { type: 'user', content: query, time: new Date().toLocaleTimeString() }
        ];
        setPlaygroundResponses(newPlaygroundLogs);

        // Simulate MCP Tool call generation and response
        setTimeout(() => {
            let selectedTool = 'read_mavi_table';
            let toolArgs = {};
            let toolResponse = '';
            let aiText = '';

            const lowerQuery = query.toLowerCase();

            if (lowerQuery.includes('stasiun') || lowerQuery.includes('station')) {
                if (lowerQuery.includes('set') || lowerQuery.includes('ubah') || lowerQuery.includes('ganti')) {
                    selectedTool = 'set_station_status';
                    toolArgs = { stationId: 'WS-01', status: 'DOWN' };
                    toolResponse = '{ "success": true, "stationId": "WS-01", "newStatus": "DOWN", "updatedAt": "' + new Date().toISOString() + '" }';
                    aiText = 'Saya telah mendeteksi stasiun kerja WS-01 bermasalah, dan memicu tool [set_station_status] untuk mengubah statusnya menjadi DOWN.';
                } else {
                    selectedTool = 'get_station_status';
                    toolArgs = { stationId: 'WS-01' };
                    toolResponse = '{ "stationId": "WS-01", "name": "Assembly Line 1", "status": "RUNNING", "operator": "John Doe" }';
                    aiText = 'Berdasarkan pemanggilan tool [get_station_status] untuk WS-01, stasiun kerja saat ini beroperasi dengan status RUNNING di bawah operator John Doe.';
                }
            } else if (lowerQuery.includes('mesin') || lowerQuery.includes('machine') || lowerQuery.includes('iot')) {
                selectedTool = 'get_machine_info';
                toolArgs = { machineId: 'MCH-559' };
                toolResponse = '{ "machineId": "MCH-559", "type": "CNC Mill", "temp": 72.4, "vibration": "NORMAL", "activeOrder": "WO-8849" }';
                aiText = 'Saya telah memanggil tool [get_machine_info]. CNC Mill (MCH-559) saat ini dalam kondisi NORMAL dengan temperatur 72.4°C.';
            } else {
                // Default table read
                selectedTool = 'read_mavi_table';
                toolArgs = { tableId: 'quality_log', limit: 2 };
                toolResponse = '[ { "id": "rec_01", "defect_type": "Scratched", "status": "REJECTED" }, { "id": "rec_02", "defect_type": "None", "status": "PASSED" } ]';
                aiText = 'Saya telah membaca data tabel log kualitas [read_mavi_table]. Ditemukan 2 record terbaru, termasuk 1 defect goresan (Scratched) yang ditolak.';
            }

            // Append response logs
            setPlaygroundResponses(prev => [
                ...prev,
                {
                    type: 'ai',
                    time: new Date().toLocaleTimeString(),
                    tool: selectedTool,
                    args: JSON.stringify(toolArgs),
                    response: toolResponse,
                    aiText: aiText
                }
            ]);

            // Add server execution logs
            const timestamp = new Date().toLocaleTimeString();
            setLogs(prev => [
                ...prev,
                { id: Date.now(), time: timestamp, type: 'tool_call', msg: `Tool call: [${selectedTool}] with args: ${JSON.stringify(toolArgs)}` },
                { id: Date.now() + 1, time: timestamp, type: 'tool_resp', msg: `Tool response: completed successfully` }
            ]);

            setIsThinking(false);
        }, 1500);
    };

    const handleClearLogs = () => {
        setLogs([
            { id: Date.now(), time: new Date().toLocaleTimeString(), type: 'system', msg: 'Logs cleared by supervisor' }
        ]);
    };

    const toggleServer = () => {
        const nextState = !isRunning;
        setIsRunning(nextState);
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [
            ...prev,
            { id: Date.now(), time: timestamp, type: 'system', msg: nextState ? 'Mavi MCP Server restarted' : 'Mavi MCP Server stopped' }
        ]);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>
            {/* Header */}
            <div style={{ padding: '24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <BrainCircuit size={28} color="#8b5cf6" />
                        <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: '#0f172a' }}>Mavi Model Context Protocol (MCP) Server</h2>
                        <span style={{
                            backgroundColor: isRunning ? '#dcfce7' : '#fee2e2',
                            color: isRunning ? '#166534' : '#991b1b',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                        }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isRunning ? '#22c55e' : '#ef4444' }} />
                            {isRunning ? 'RUNNING' : 'STOPPED'}
                        </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                        Jembatan real-time yang aman untuk mengekspos aset manufaktur (tabel, stasiun, mesin) sebagai toolset bagi LLMs / Agen AI.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={toggleServer}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '10px 18px', backgroundColor: isRunning ? '#ef4444' : '#3b82f6',
                            color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem'
                        }}
                    >
                        {isRunning ? <Pause size={14} /> : <Play size={14} />}
                        {isRunning ? 'STOP MCP SERVER' : 'START MCP SERVER'}
                    </button>
                </div>
            </div>

            {/* Grid Layout */}
            <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '1.4fr 1.1fr', gap: '24px', overflowY: 'auto' }}>
                
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Concept Card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', gap: '16px' }}>
                        <div style={{ backgroundColor: '#f5f3ff', padding: '12px', borderRadius: '12px', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'fit-content' }}>
                            <Shield size={24} />
                        </div>
                        <div>
                            <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 800, color: '#1e293b' }}>Bagaimana MCP Bekerja di Mavi?</h3>
                            <p style={{ margin: 0, color: '#475569', fontSize: '0.82rem', lineHeight: 1.5 }}>
                                Mavi MCP Server bertindak sebagai jembatan real-time aman antara Large Language Models (LLMs) dan instance Mavi Anda. Alih-alih menulis custom code untuk setiap API secara individual, MCP mengekspos stasiun kerja, mesin, tabel log kualitas, dan telemetri IoT sebagai **"tools"** terstruktur. LLM dapat menganalisis deskripsi tool ini, memutuskan parameter data yang dibutuhkan, dan memicunya secara aman tanpa black-box.
                            </p>
                        </div>
                    </div>

                    {/* Architecture diagram card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Arsitektur Sistem Aliran Data MCP</h3>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                            {/* LLM */}
                            <div style={{ width: '100px', padding: '10px', backgroundColor: '#e0e7ff', border: '1.5px solid #818cf8', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#3730a3' }}>
                                LLM / AI Client
                                <div style={{ fontSize: '0.6rem', color: '#6366f1', marginTop: '2px' }}>(Claude/GPT)</div>
                            </div>

                            <ArrowRight size={20} color="#94a3b8" />

                            {/* MCP Server */}
                            <div style={{ width: '140px', padding: '10px', backgroundColor: '#f5f3ff', border: '2px solid #a78bfa', borderRadius: '8px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#5b21b6', position: 'relative' }}>
                                Mavi MCP Server
                                <div style={{ fontSize: '0.6rem', color: '#8b5cf6', marginTop: '2px' }}>Port {serverPort}</div>
                                <span style={{ position: 'absolute', top: '-6px', right: '-6px', backgroundColor: '#10b981', color: 'white', padding: '1px 5px', borderRadius: '6px', fontSize: '0.5rem', fontWeight: 800 }}>ACTIVE</span>
                            </div>

                            <ArrowRight size={20} color="#94a3b8" />

                            {/* Mavi Instance */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}><Database size={10} /> Tables</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}><Cpu size={10} /> Machines</span>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}><Tv size={10} /> Stations</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', padding: '4px 8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 600 }}><Users size={10} /> Users</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tool definitions */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Toolset MCP Terdaftar</h3>
                            <span style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', color: '#475569', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 700 }}>6 Tools Aktif</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {exposedTools.map(tool => (
                                <div key={tool.name} style={{ padding: '12px', border: '1px solid #f1f5f9', borderRadius: '10px', backgroundColor: '#fafafa' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <code style={{ fontSize: '0.8rem', fontWeight: 800, color: '#090d16', backgroundColor: '#e2e8f0', padding: '2px 6px', borderRadius: '4px' }}>{tool.name}</code>
                                        <span style={{
                                            fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px',
                                            backgroundColor: tool.impact === 'WRITE' ? '#fff7ed' : '#eff6ff',
                                            color: tool.impact === 'WRITE' ? '#c2410c' : '#1d4ed8'
                                        }}>{tool.impact}</span>
                                    </div>
                                    <p style={{ margin: '0 0 8px 0', fontSize: '0.75rem', color: '#64748b', lineHeight: 1.4 }}>{tool.desc}</p>
                                    
                                    {Object.keys(tool.params).length > 0 && (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.65rem', borderTop: '1px dashed #e2e8f0', paddingTop: '6px', marginTop: '2px' }}>
                                            <span style={{ fontWeight: 800, color: '#475569' }}>Parameter:</span>
                                            {Object.entries(tool.params).map(([k, v]) => (
                                                <span key={k} style={{ color: '#0f172a' }}>
                                                    <code style={{ color: '#8b5cf6' }}>{k}</code>: <em>{v}</em>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Server settings card */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px' }}>
                        <h3 style={{ margin: '0 0 16px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Konfigurasi Server</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>MCP Port</label>
                                <input
                                    type="number"
                                    value={serverPort}
                                    onChange={(e) => setServerPort(parseInt(e.target.value))}
                                    disabled={isRunning}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', backgroundColor: isRunning ? '#f1f5f9' : 'white' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Authorized API Client Token</label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        type={showToken ? 'text' : 'password'}
                                        value={apiToken}
                                        readOnly
                                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.85rem', fontFamily: 'monospace', backgroundColor: '#f8fafc' }}
                                    />
                                    <button
                                        onClick={() => setShowToken(!showToken)}
                                        style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '8px', backgroundColor: 'white', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
                                    >
                                        {showToken ? 'Hide' : 'Reveal'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive NLP Playground */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', height: '400px' }}>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>MCP Playground / Console</h3>
                        <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '0.7rem' }}>Uji coba instruksi natural language untuk melihat bagaimana MCP menterjemahkan ke tool call.</p>
                        
                        {/* Playground Terminal Screen */}
                        <div style={{ flex: 1, backgroundColor: '#0f172a', borderRadius: '12px', padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.75rem' }}>
                            {playgroundResponses.length === 0 ? (
                                <div style={{ margin: 'auto', textAlign: 'center', color: '#475569', maxWidth: '220px' }}>
                                    <Terminal size={24} style={{ margin: '0 auto 8px' }} />
                                    Ketik instruksi seperti: <em>"Check status stasiun WS-01"</em> atau <em>"Baca data tabel log kualitas"</em>
                                </div>
                            ) : (
                                playgroundResponses.map((res, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {res.type === 'user' ? (
                                            <div style={{ color: '#38bdf8', alignSelf: 'flex-start' }}>
                                                <strong>User:</strong> {res.content}
                                            </div>
                                        ) : (
                                            <div style={{ color: '#a78bfa', backgroundColor: 'rgba(139, 92, 246, 0.05)', padding: '8px', borderRadius: '6px', borderLeft: '3px solid #8b5cf6' }}>
                                                <div style={{ color: '#22c55e', fontWeight: 800, marginBottom: '2px' }}>
                                                    [MCP CALL] {"->"} {res.tool}({res.args})
                                                </div>
                                                <div style={{ color: '#e2e8f0', fontStyle: 'italic', marginBottom: '4px', fontFamily: 'monospace' }}>
                                                    [RESPONSE] {"->"} {res.response}
                                                </div>
                                                <div style={{ color: '#ffffff', marginTop: '6px' }}>
                                                    <strong>AI Response:</strong> {res.aiText}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                            {isThinking && (
                                <div style={{ color: '#64748b', fontStyle: 'italic' }}>
                                    AI sedang menganalisis tools MCP...
                                </div>
                            )}
                        </div>

                        {/* Input form */}
                        <form onSubmit={handleQuerySubmit} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                            <input
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                                placeholder="Tanya AI: e.g. Ubah status stasiun WS-01 menjadi DOWN"
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                            />
                            <button
                                type="submit"
                                disabled={isThinking || !isRunning}
                                style={{ padding: '8px 16px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}
                            >
                                KIRIM
                            </button>
                        </form>
                    </div>

                    {/* Live Server Terminal Logs */}
                    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '200px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b' }}>Live MCP Terminal logs</h3>
                            <button
                                onClick={handleClearLogs}
                                style={{ border: 'none', background: 'transparent', color: '#94a3b8', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Clear logs
                            </button>
                        </div>
                        
                        <div style={{ flex: 1, backgroundColor: '#0f172a', color: '#38bdf8', borderRadius: '12px', padding: '12px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.7rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {logs.map(log => {
                                let color = '#94a3b8';
                                if (log.type === 'system') color = '#fbbf24';
                                else if (log.type === 'tool_call') color = '#22c55e';
                                else if (log.type === 'tool_resp') color = '#818cf8';
                                
                                return (
                                    <div key={log.id} style={{ color }}>
                                        <span style={{ color: '#475569' }}>[{log.time}]</span> {log.msg}
                                    </div>
                                );
                            })}
                            <div ref={logsEndRef} />
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
}
