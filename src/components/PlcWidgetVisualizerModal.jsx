import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Cpu, Zap, Activity, CheckCircle2, AlertCircle, Link2, Unlink,
    RefreshCw, Play, Pause, Search, Sliders, Gauge, ToggleLeft,
    Square, Radio, Trash2, Sparkles, Layers, ArrowRight, ArrowLeft,
    Check, X, HardDrive, ShieldCheck, ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PlcWidgetVisualizerModal = ({
    isOpen,
    onClose,
    components = [],
    activeStepName = 'Current Step',
    onUpdateComponent,
    onAddTrigger,
    appVariables = []
}) => {
    const [controllers, setControllers] = useState([]);
    const [plcTags, setPlcTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagId, setSelectedTagId] = useState(null);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [isSimulating, setIsSimulating] = useState(true);
    const [wireHoverId, setWireHoverId] = useState(null);
    const [pinPositions, setPinPositions] = useState({ tags: {}, comps: {} });

    const leftContainerRef = useRef(null);
    const rightContainerRef = useRef(null);
    const svgCanvasRef = useRef(null);

    // ── Load PLC Controllers & Tags ──
    const loadPlcData = async () => {
        try {
            let tags = window.mandor_plc_tags || [];
            let ctrls = window.mandor_plc_controllers || [];

            if (tags.length === 0 || ctrls.length === 0) {
                const { loadPlcSettingsFromSupabase } = await import('../utils/supabaseFrontlineDB');
                const loaded = await loadPlcSettingsFromSupabase();
                if (loaded.controllers && loaded.controllers.length > 0) {
                    ctrls = loaded.controllers;
                    window.mandor_plc_controllers = ctrls;
                }
                if (loaded.tags && loaded.tags.length > 0) {
                    tags = loaded.tags;
                    window.mandor_plc_tags = tags;
                }
            }

            // Fallback default sample tags if database is empty
            if (tags.length === 0) {
                ctrls = [
                    { id: 'ctrl_keyence_1', name: 'Keyence KV-3000 CPU', type: 'KEYENCE_KV', host: '192.168.1.10', port: 8501, status: 'connected' },
                    { id: 'ctrl_modbus_1', name: 'Modbus TCP Station 01', type: 'MODBUS_TCP', host: '192.168.1.20', port: 502, status: 'connected' }
                ];
                tags = [
                    { id: 'tag_1', controllerId: 'ctrl_keyence_1', name: 'START_CYCLE_PB', address: 'MR100', regType: 'MR_RELAY', dataType: 'BOOLEAN', value: '0' },
                    { id: 'tag_2', controllerId: 'ctrl_keyence_1', name: 'EMERGENCY_STOP', address: 'MR102', regType: 'MR_RELAY', dataType: 'BOOLEAN', value: '1' },
                    { id: 'tag_3', controllerId: 'ctrl_keyence_1', name: 'SPINDLE_RPM', address: 'DM1000', regType: 'DM_WORD', dataType: 'NUMBER', value: '1420' },
                    { id: 'tag_4', controllerId: 'ctrl_keyence_1', name: 'HYDRAULIC_PRESSURE', address: 'DM1002', regType: 'FLOAT', dataType: 'FLOAT', value: '6.4' },
                    { id: 'tag_5', controllerId: 'ctrl_modbus_1', name: 'CONVEYOR_RUN_LAMP', address: '00001', regType: 'COIL', dataType: 'BOOLEAN', value: '1' },
                    { id: 'tag_6', controllerId: 'ctrl_modbus_1', name: 'OVEN_ZONE1_TEMP', address: '40001', regType: 'HOLDING_REGISTER', dataType: 'NUMBER', value: '185' }
                ];
                window.mandor_plc_controllers = ctrls;
                window.mandor_plc_tags = tags;
            }

            setControllers(ctrls);
            setPlcTags(tags);
        } catch (e) {
            console.warn('Error loading PLC data:', e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadPlcData();
        }
    }, [isOpen]);

    // ── Simulation Interval ──
    useEffect(() => {
        if (!isOpen || !isSimulating) return;

        const interval = setInterval(() => {
            setPlcTags(prev => {
                const updated = prev.map(t => {
                    if (t.dataType === 'NUMBER') {
                        const cur = parseFloat(t.value) || 1000;
                        const delta = (Math.random() - 0.48) * 15;
                        return { ...t, value: String(Math.max(0, Math.round(cur + delta))) };
                    }
                    if (t.dataType === 'FLOAT') {
                        const cur = parseFloat(t.value) || 5.0;
                        const delta = (Math.random() - 0.49) * 0.2;
                        return { ...t, value: (Math.max(0, cur + delta)).toFixed(1) };
                    }
                    return t;
                });
                window.mandor_plc_tags = updated;
                return updated;
            });
        }, 1200);

        return () => clearInterval(interval);
    }, [isOpen, isSimulating]);

    // ── Calculate Pin Coordinates for Dynamic SVG Cables ──
    const updatePinCoordinates = () => {
        if (!svgCanvasRef.current) return;
        const svgRect = svgCanvasRef.current.getBoundingClientRect();

        const tagPins = {};
        const compPins = {};

        // Find all tag anchor pins
        document.querySelectorAll('[data-plc-tag-pin]').forEach(el => {
            const id = el.getAttribute('data-plc-tag-pin');
            const rect = el.getBoundingClientRect();
            tagPins[id] = {
                x: rect.right - svgRect.left,
                y: rect.top + rect.height / 2 - svgRect.top
            };
        });

        // Find all widget anchor pins
        document.querySelectorAll('[data-plc-comp-pin]').forEach(el => {
            const id = el.getAttribute('data-plc-comp-pin');
            const rect = el.getBoundingClientRect();
            compPins[id] = {
                x: rect.left - svgRect.left,
                y: rect.top + rect.height / 2 - svgRect.top
            };
        });

        setPinPositions({ tags: tagPins, comps: compPins });
    };

    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(updatePinCoordinates, 150);
        window.addEventListener('resize', updatePinCoordinates);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updatePinCoordinates);
        };
    }, [isOpen, plcTags, components, searchQuery]);

    // ── Identify Existing Wiring Connections ──
    const wiringConnections = useMemo(() => {
        const wires = [];

        components.forEach(comp => {
            const props = comp.props || {};

            // 1. Direct PLC_TAG data source
            if (props.dataSourceType === 'PLC_TAG' && props.plcTagId) {
                const tag = plcTags.find(t => t.id === props.plcTagId || t.name === props.varSource);
                if (tag) {
                    wires.push({
                        id: `wire_read_${tag.id}_${comp.id}`,
                        tagId: tag.id,
                        tagName: tag.name,
                        compId: comp.id,
                        compName: comp.displayName || comp.name || comp.type,
                        mode: 'READ',
                        color: '#06b6d4' // Neon cyan
                    });
                }
            }

            // 2. Variable binding linked to a PLC Tag
            if (props.dataSourceType === 'VARIABLE' && props.varSource) {
                const tag = plcTags.find(t => t.name === props.varSource);
                if (tag) {
                    wires.push({
                        id: `wire_var_${tag.id}_${comp.id}`,
                        tagId: tag.id,
                        tagName: tag.name,
                        compId: comp.id,
                        compName: comp.displayName || comp.name || comp.type,
                        mode: 'READ',
                        color: '#38bdf8' // Sky blue
                    });
                }
            }

            // 3. Button / Trigger WRITE_PLC_TAG
            if (comp.triggers && Array.isArray(comp.triggers)) {
                comp.triggers.forEach(trig => {
                    (trig.actions || []).concat(trig.elseActions || []).forEach(act => {
                        if (act.type === 'WRITE_PLC_TAG' && act.payload) {
                            const tagId = act.payload.tagId;
                            const tagName = act.payload.tagName;
                            const tag = plcTags.find(t => (tagId && t.id === tagId) || (tagName && t.name === tagName));
                            if (tag) {
                                wires.push({
                                    id: `wire_write_${tag.id}_${comp.id}`,
                                    tagId: tag.id,
                                    tagName: tag.name,
                                    compId: comp.id,
                                    compName: comp.displayName || comp.name || comp.type,
                                    mode: 'WRITE',
                                    color: '#10b981' // Emerald
                                });
                            }
                        }
                    });
                });
            }
        });

        return wires;
    }, [components, plcTags]);

    // ── Bind a Tag to a Widget ──
    const handleConnect = (tagId, compId) => {
        const tag = plcTags.find(t => t.id === tagId);
        const comp = components.find(c => c.id === compId);
        if (!tag || !comp) return;

        const isButton = ['BUTTON', 'BUTTON_GROUP', 'ACTION_BUTTON', 'MOMENTARY_BUTTON'].includes(comp.type?.toUpperCase());

        if (isButton) {
            // Add WRITE_PLC_TAG trigger action
            if (onAddTrigger) {
                onAddTrigger(comp.id, {
                    id: `trig_plc_${Date.now()}`,
                    name: `Write ${tag.name}`,
                    event: 'CLICK',
                    actions: [
                        {
                            type: 'WRITE_PLC_TAG',
                            payload: {
                                tagId: tag.id,
                                tagName: tag.name,
                                controllerId: tag.controllerId,
                                value: tag.dataType === 'BOOLEAN' ? 1 : 100,
                                valueType: 'STATIC'
                            }
                        }
                    ]
                });
            } else if (onUpdateComponent) {
                // Attach trigger directly to component triggers
                const existingTriggers = Array.isArray(comp.triggers) ? [...comp.triggers] : [];
                existingTriggers.push({
                    id: `trig_plc_${Date.now()}`,
                    name: `Write ${tag.name}`,
                    event: 'CLICK',
                    actions: [
                        {
                            type: 'WRITE_PLC_TAG',
                            payload: {
                                tagId: tag.id,
                                tagName: tag.name,
                                controllerId: tag.controllerId,
                                value: tag.dataType === 'BOOLEAN' ? 1 : 100,
                                valueType: 'STATIC'
                            }
                        }
                    ]
                });
                onUpdateComponent(comp.id, { triggers: existingTriggers });
            }
            toast.success(`⚡ Tombol "${comp.displayName || comp.type}" dihubungkan ke WRITE Tag [${tag.name}]!`, { icon: '🟢' });
        } else {
            // Bind as Read Data Source
            if (onUpdateComponent) {
                onUpdateComponent(comp.id, {
                    dataSourceType: 'PLC_TAG',
                    plcTagId: tag.id,
                    varSource: tag.name,
                    plcTagName: tag.name
                });
            }
            toast.success(`🔌 Widget "${comp.displayName || comp.type}" sekarang membaca Tag [${tag.name}] secara real-time!`, { icon: '⚡' });
        }

        setSelectedTagId(null);
        setSelectedCompId(null);
        setTimeout(updatePinCoordinates, 100);
    };

    // ── Disconnect a Wire ──
    const handleDisconnect = (wire) => {
        const comp = components.find(c => c.id === wire.compId);
        if (!comp || !onUpdateComponent) return;

        if (wire.mode === 'READ') {
            onUpdateComponent(comp.id, {
                dataSourceType: '',
                plcTagId: null,
                varSource: ''
            });
            toast.success(`Koneksi pembacaan ${wire.tagName} ke ${wire.compName} diputus.`, { icon: '✂️' });
        } else if (wire.mode === 'WRITE') {
            // Remove the trigger
            const updatedTriggers = (comp.triggers || []).filter(t => {
                const hasAction = (t.actions || []).some(a => a.type === 'WRITE_PLC_TAG' && (a.payload?.tagId === wire.tagId || a.payload?.tagName === wire.tagName));
                return !hasAction;
            });
            onUpdateComponent(comp.id, { triggers: updatedTriggers });
            toast.success(`Trigger penulisan ${wire.tagName} pada ${wire.compName} dihapus.`, { icon: '✂️' });
        }

        setTimeout(updatePinCoordinates, 100);
    };

    // ── Auto-Connect Matching Names ──
    const handleAutoWire = () => {
        let connectedCount = 0;
        components.forEach(comp => {
            const compName = (comp.displayName || comp.name || comp.props?.label || comp.type || '').toUpperCase().replace(/[\s-_]+/g, '');
            const matchedTag = plcTags.find(t => {
                const tName = (t.name || '').toUpperCase().replace(/[\s-_]+/g, '');
                return compName.includes(tName) || tName.includes(compName);
            });

            if (matchedTag) {
                handleConnect(matchedTag.id, comp.id);
                connectedCount++;
            }
        });

        if (connectedCount > 0) {
            toast.success(`✨ Berhasil menghubungkan ${connectedCount} widget secara otomatis!`, { icon: '🚀' });
        } else {
            toast('Tidak ada nama widget & tag yang cocok otomatis.', { icon: 'ℹ️' });
        }
    };

    // ── Toggle / Simulate Live Tag Value ──
    const handleToggleTagValue = (tag) => {
        const nextTags = plcTags.map(t => {
            if (t.id === tag.id) {
                if (t.dataType === 'BOOLEAN') {
                    const newVal = (t.value === '1' || t.value === 1 || t.value === 'true' || t.value === true) ? '0' : '1';
                    return { ...t, value: newVal };
                } else {
                    const cur = parseFloat(t.value) || 0;
                    return { ...t, value: String(Math.round(cur + 10)) };
                }
            }
            return t;
        });
        setPlcTags(nextTags);
        window.mandor_plc_tags = nextTags;
        toast.success(`Tag [${tag.name}] di-update ke: ${nextTags.find(t => t.id === tag.id)?.value}`, { icon: '⚙️' });
    };

    if (!isOpen) return null;

    const filteredTags = plcTags.filter(t =>
        t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.regType?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(5, 8, 16, 0.88)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1440px',
                height: '92vh',
                backgroundColor: '#0a0f1d',
                borderRadius: '20px',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 50px rgba(6, 182, 212, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: '#f1f5f9'
            }}>
                {/* ════════ HEADER BAR ════════ */}
                <div style={{
                    padding: '16px 24px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(6, 182, 212, 0.15)',
                            border: '1px solid #06b6d4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)'
                        }}>
                            <Cpu size={24} color="#06b6d4" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
                                    PLC to Widget Visual Wiring Topology
                                </h2>
                                <span style={{
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                    color: '#34d399',
                                    border: '1px solid rgba(16, 185, 129, 0.3)'
                                }}>
                                    REAL-TIME INTERACTIVE
                                </span>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                                Hubungkan tag register PLC (Keyence / Modbus) ke widget visual screen dengan klik pin antar node
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={handleAutoWire}
                            title="Hubungkan tag dan widget otomatis jika ada kesamaan nama"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(168, 85, 247, 0.15)',
                                border: '1px solid #a855f7',
                                color: '#d8b4fe',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Sparkles size={14} />
                            <span>Auto-Wire Match</span>
                        </button>

                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: isSimulating ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.2)',
                                border: isSimulating ? '1px solid #10b981' : '1px solid #64748b',
                                color: isSimulating ? '#34d399' : '#94a3b8',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                            <span>{isSimulating ? 'Simulasi Aktif' : 'Simulasi Jeda'}</span>
                        </button>

                        <button
                            onClick={loadPlcData}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                color: '#cbd5e1',
                                fontSize: '0.78rem',
                                cursor: 'pointer'
                            }}
                        >
                            <RefreshCw size={14} />
                        </button>

                        <button
                            onClick={onClose}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* ════════ MAIN 3-COLUMN CANVAS ════════ */}
                <div style={{
                    flex: 1,
                    position: 'relative',
                    display: 'grid',
                    gridTemplateColumns: '380px 1fr 380px',
                    overflow: 'hidden',
                    backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}>
                    {/* ──── COLUMN 1 (LEFT): PLC REGISTERS & TAGS ──── */}
                    <div
                        ref={leftContainerRef}
                        onScroll={updatePinCoordinates}
                        style={{
                            padding: '18px',
                            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
                            backgroundColor: 'rgba(11, 17, 32, 0.85)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <HardDrive size={16} color="#38bdf8" />
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                                    PLC Tags & Controllers
                                </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 700 }}>
                                {filteredTags.length} Tags
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.08)'
                        }}>
                            <Search size={14} color="#64748b" />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cari tag, address (MR100, DM...)"
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontSize: '0.78rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Controllers Mini Badges */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {controllers.map(c => (
                                <div key={c.id} style={{
                                    fontSize: '0.68rem',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                                    border: '1px solid rgba(56, 189, 248, 0.25)',
                                    color: '#7dd3fc',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                                    <span>{c.name || c.type}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tag Cards List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                            {filteredTags.map(tag => {
                                const isConnected = wiringConnections.some(w => w.tagId === tag.id);
                                const isSelected = selectedTagId === tag.id;

                                return (
                                    <div
                                        key={tag.id}
                                        onClick={() => {
                                            if (selectedCompId) {
                                                handleConnect(tag.id, selectedCompId);
                                            } else {
                                                setSelectedTagId(isSelected ? null : tag.id);
                                            }
                                        }}
                                        style={{
                                            position: 'relative',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: isSelected ? 'rgba(6, 182, 212, 0.15)' : 'rgba(15, 23, 42, 0.85)',
                                            border: isSelected ? '1px solid #06b6d4' : isConnected ? '1px solid rgba(56, 189, 248, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? '0 0 16px rgba(6, 182, 212, 0.25)' : 'none'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                                                <span style={{
                                                    fontSize: '0.62rem',
                                                    fontWeight: 800,
                                                    padding: '2px 5px',
                                                    borderRadius: '4px',
                                                    backgroundColor: tag.dataType === 'BOOLEAN' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(14, 165, 233, 0.2)',
                                                    color: tag.dataType === 'BOOLEAN' ? '#fde047' : '#38bdf8'
                                                }}>
                                                    {tag.address || tag.regType}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: '#f8fafc',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {tag.name}
                                                </span>
                                            </div>

                                            {/* Live Value Pill */}
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleTagValue(tag);
                                                }}
                                                title="Klik untuk simulasi toggle nilai tag"
                                                style={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 800,
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    backgroundColor: tag.dataType === 'BOOLEAN'
                                                        ? (tag.value === '1' || tag.value === 1 ? 'rgba(16, 185, 129, 0.25)' : 'rgba(100, 116, 139, 0.25)')
                                                        : 'rgba(56, 189, 248, 0.15)',
                                                    color: tag.dataType === 'BOOLEAN'
                                                        ? (tag.value === '1' || tag.value === 1 ? '#34d399' : '#94a3b8')
                                                        : '#38bdf8',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {tag.dataType === 'BOOLEAN' ? (tag.value === '1' || tag.value === 1 ? 'ON (1)' : 'OFF (0)') : tag.value}
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                                                {tag.regType} • {tag.dataType}
                                            </span>
                                            {isConnected && (
                                                <span style={{ fontSize: '0.65rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                    <Link2 size={10} /> Terhubung
                                                </span>
                                            )}
                                        </div>

                                        {/* Connector Pin (Right Edge) */}
                                        <div
                                            data-plc-tag-pin={tag.id}
                                            style={{
                                                position: 'absolute',
                                                right: '-7px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? '#06b6d4' : isConnected ? '#38bdf8' : '#334155',
                                                border: '2px solid #0f172a',
                                                boxShadow: isSelected ? '0 0 10px #06b6d4' : isConnected ? '0 0 6px #38bdf8' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ──── COLUMN 2 (CENTER): SVG ANIMATED WIRING CABLES ──── */}
                    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
                        <svg
                            ref={svgCanvasRef}
                            style={{
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'auto',
                                position: 'absolute',
                                inset: 0
                            }}
                        >
                            <defs>
                                <linearGradient id="wireGradCyan" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
                                </linearGradient>
                                <linearGradient id="wireGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.9" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" />
                                </linearGradient>
                                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Center Instruction Banner if no wires */}
                            {wiringConnections.length === 0 && !selectedTagId && (
                                <g transform="translate(180, 200)">
                                    <rect width="240" height="70" rx="10" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(255, 255, 255, 0.1)" />
                                    <text x="120" y="32" textAnchor="middle" fill="#94a3b8" fontSize="12" fontWeight="700">
                                        Klik pin Tag di kiri, lalu
                                    </text>
                                    <text x="120" y="52" textAnchor="middle" fill="#38bdf8" fontSize="12" fontWeight="700">
                                        Klik pin Widget di kanan untuk wiring
                                    </text>
                                </g>
                            )}

                            {/* Render All Existing Dynamic Wiring Cables */}
                            {wiringConnections.map(wire => {
                                const tagPin = pinPositions.tags[wire.tagId];
                                const compPin = pinPositions.comps[wire.compId];

                                if (!tagPin || !compPin) return null;

                                const x1 = tagPin.x;
                                const y1 = tagPin.y;
                                const x2 = compPin.x;
                                const y2 = compPin.y;
                                const dx = Math.abs(x2 - x1) * 0.5;
                                const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

                                const isHovered = wireHoverId === wire.id;
                                const isRead = wire.mode === 'READ';
                                const strokeColor = isHovered ? '#ec4899' : (isRead ? 'url(#wireGradCyan)' : 'url(#wireGradEmerald)');

                                return (
                                    <g
                                        key={wire.id}
                                        onMouseEnter={() => setWireHoverId(wire.id)}
                                        onMouseLeave={() => setWireHoverId(null)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        {/* Background hit-area for easier clicking */}
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke="transparent"
                                            strokeWidth="24"
                                            onClick={() => handleDisconnect(wire)}
                                        />

                                        {/* Glow Layer */}
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke={isRead ? '#06b6d4' : '#10b981'}
                                            strokeWidth={isHovered ? 6 : 4}
                                            strokeOpacity={isHovered ? 0.7 : 0.3}
                                            filter="url(#glowEffect)"
                                        />

                                        {/* Main Animated Cable */}
                                        <path
                                            d={pathData}
                                            fill="none"
                                            stroke={strokeColor}
                                            strokeWidth={isHovered ? 3.5 : 2.5}
                                            strokeDasharray={isSimulating ? '8 6' : 'none'}
                                        >
                                            {isSimulating && (
                                                <animate
                                                    attributeName="stroke-dashoffset"
                                                    from={isRead ? '28' : '0'}
                                                    to={isRead ? '0' : '28'}
                                                    dur="1.2s"
                                                    repeatCount="indefinite"
                                                />
                                            )}
                                        </path>

                                        {/* Disconnect Badge on Hover */}
                                        {isHovered && (
                                            <g
                                                transform={`translate(${(x1 + x2) / 2 - 40}, ${(y1 + y2) / 2 - 12})`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDisconnect(wire);
                                                }}
                                            >
                                                <rect width="80" height="24" rx="12" fill="#ef4444" />
                                                <text x="40" y="16" textAnchor="middle" fill="white" fontSize="11" fontWeight="800">
                                                    ✂️ Disconnect
                                                </text>
                                            </g>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* ──── COLUMN 3 (RIGHT): CANVAS SCREEN WIDGETS ──── */}
                    <div
                        ref={rightContainerRef}
                        onScroll={updatePinCoordinates}
                        style={{
                            padding: '18px',
                            borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
                            backgroundColor: 'rgba(11, 17, 32, 0.85)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            overflowY: 'auto'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Layers size={16} color="#34d399" />
                                <span style={{ fontSize: '0.82rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8' }}>
                                    Widgets ({activeStepName})
                                </span>
                            </div>
                            <span style={{ fontSize: '0.72rem', color: '#34d399', fontWeight: 700 }}>
                                {components.length} Widgets
                            </span>
                        </div>

                        {/* Widget Cards List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                            {components.map(comp => {
                                const isConnected = wiringConnections.some(w => w.compId === comp.id);
                                const connectedWires = wiringConnections.filter(w => w.compId === comp.id);
                                const isSelected = selectedCompId === comp.id;
                                const isButton = ['BUTTON', 'BUTTON_GROUP', 'ACTION_BUTTON', 'MOMENTARY_BUTTON'].includes(comp.type?.toUpperCase());

                                return (
                                    <div
                                        key={comp.id}
                                        onClick={() => {
                                            if (selectedTagId) {
                                                handleConnect(selectedTagId, comp.id);
                                            } else {
                                                setSelectedCompId(isSelected ? null : comp.id);
                                            }
                                        }}
                                        style={{
                                            position: 'relative',
                                            padding: '10px 12px',
                                            borderRadius: '10px',
                                            backgroundColor: isSelected ? 'rgba(52, 211, 153, 0.15)' : 'rgba(15, 23, 42, 0.85)',
                                            border: isSelected ? '1px solid #10b981' : isConnected ? '1px solid rgba(52, 211, 153, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? '0 0 16px rgba(16, 185, 129, 0.25)' : 'none'
                                        }}
                                    >
                                        {/* Connector Pin (Left Edge) */}
                                        <div
                                            data-plc-comp-pin={comp.id}
                                            style={{
                                                position: 'absolute',
                                                left: '-7px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                width: '12px',
                                                height: '12px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? '#10b981' : isConnected ? '#34d399' : '#334155',
                                                border: '2px solid #0f172a',
                                                boxShadow: isSelected ? '0 0 10px #10b981' : isConnected ? '0 0 6px #34d399' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                {isButton ? <Square size={14} color="#f59e0b" /> : <Gauge size={14} color="#34d399" />}
                                                <span style={{
                                                    fontSize: '0.8rem',
                                                    fontWeight: 700,
                                                    color: '#f8fafc',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {comp.displayName || comp.name || comp.props?.label || comp.type}
                                                </span>
                                            </div>

                                            <span style={{
                                                fontSize: '0.62rem',
                                                fontWeight: 800,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                backgroundColor: isButton ? 'rgba(245, 158, 11, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                                                color: isButton ? '#fbbf24' : '#34d399'
                                            }}>
                                                {isButton ? 'TRIGGER WRITE' : 'TELEMETRY READ'}
                                            </span>
                                        </div>

                                        {/* Connection Info */}
                                        <div style={{ marginTop: '6px' }}>
                                            {connectedWires.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {connectedWires.map(w => (
                                                        <div key={w.id} style={{
                                                            fontSize: '0.68rem',
                                                            color: w.mode === 'WRITE' ? '#fbbf24' : '#38bdf8',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px'
                                                        }}>
                                                            <span>{w.mode === 'WRITE' ? '⚡ Write' : '➔ Read'}: <b>{w.tagName}</b></span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDisconnect(w);
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                            >
                                                                <Unlink size={11} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic' }}>
                                                    Belum terhubung ke Tag PLC
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* ════════ FOOTER DIAGNOSTICS BAR ════════ */}
                <div style={{
                    padding: '12px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    fontSize: '0.75rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                            <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Active Wires: <b>{wiringConnections.length}</b></span>
                        </div>

                        <div style={{ color: '#64748b' }}>|</div>

                        <div style={{ color: '#cbd5e1' }}>
                            Controllers Online: <b>{controllers.length}</b>
                        </div>

                        <div style={{ color: '#64748b' }}>|</div>

                        <div style={{ color: '#cbd5e1' }}>
                            Protocol Driver: <b style={{ color: '#38bdf8' }}>Keyence KV-Host & Modbus TCP</b>
                        </div>

                        <div style={{ color: '#64748b' }}>|</div>

                        <div style={{ color: '#cbd5e1' }}>
                            Scan Rate: <b>50 ms</b> (Tauri Native Driver)
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
                        <ShieldCheck size={14} color="#10b981" />
                        <span>Safety Interlock Ready</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlcWidgetVisualizerModal;
