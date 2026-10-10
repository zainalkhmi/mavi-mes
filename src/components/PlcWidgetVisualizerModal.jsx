import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
    Cpu, Zap, Activity, CheckCircle2, AlertCircle, Link2, Unlink,
    RefreshCw, Play, Pause, Search, Sliders, Gauge, ToggleLeft,
    Square, Radio, Trash2, Sparkles, Layers, ArrowRight, ArrowLeft,
    Check, X, HardDrive, ShieldCheck, ChevronRight, Palette, Sun, Moon,
    SlidersHorizontal, PlusCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export const PlcWidgetVisualizerModal = ({
    isOpen,
    onClose,
    components = [],
    steps = [],
    activeStepName = 'Screen 1',
    onUpdateComponent,
    onAddTrigger,
    appVariables = []
}) => {
    // ── Theme State: 'odoo-light' (default) vs 'odoo-dark' ──
    const [themeMode, setThemeMode] = useState('odoo-light'); // 'odoo-light' | 'odoo-dark'
    const [controllers, setControllers] = useState([]);
    const [plcTags, setPlcTags] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTagId, setSelectedTagId] = useState(null);
    const [selectedCompId, setSelectedCompId] = useState(null);
    const [isSimulating, setIsSimulating] = useState(true);
    const [wireHoverId, setWireHoverId] = useState(null);
    const [pinPositions, setPinPositions] = useState({ tags: {}, comps: {} });
    const [selectedStepFilter, setSelectedStepFilter] = useState('ALL');

    const leftContainerRef = useRef(null);
    const rightContainerRef = useRef(null);
    const svgCanvasRef = useRef(null);

    // ── Odoo Color Tokens ──
    const isLight = themeMode === 'odoo-light';
    const odooTheme = {
        primary: '#714B67',        // Signature Odoo Aubergine / Purple
        primaryHover: '#5B3A53',
        teal: '#00A09D',           // Signature Odoo Teal / Cyan
        tealLight: '#E6F6F6',
        coral: '#F06050',          // Signature Odoo Coral / Red
        coralLight: '#FDECEB',
        gold: '#F5A623',           // Signature Odoo Amber Gold
        goldLight: '#FEF6E9',
        indigo: '#4A90E2',         // Signature Odoo Blue
        indigoLight: '#EDF4FC',
        purple: '#875A7B',
        purpleLight: '#F4EEF3',
        emerald: '#28A745',
        emeraldLight: '#EAF7ED',

        // Backgrounds & Surface
        bgModal: isLight ? '#F8F9FA' : '#181324',
        bgCard: isLight ? '#FFFFFF' : '#231C33',
        bgCardHover: isLight ? '#F1F5F9' : '#2D2442',
        bgPanel: isLight ? '#FFFFFF' : '#1D172B',
        border: isLight ? '#E2E8F0' : 'rgba(255, 255, 255, 0.1)',
        borderHover: isLight ? '#CBD5E1' : 'rgba(255, 255, 255, 0.25)',
        textPrimary: isLight ? '#212529' : '#F8FAFC',
        textSecondary: isLight ? '#495057' : '#CBD5E1',
        textMuted: isLight ? '#868E96' : '#94A3B8',
        canvasBg: isLight ? '#EDF2F7' : '#130E1F',
        gridDot: isLight ? 'rgba(113, 75, 103, 0.12)' : 'rgba(255, 255, 255, 0.08)',
        shadowSm: isLight ? '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)' : '0 2px 8px rgba(0,0,0,0.4)',
        shadowMd: isLight ? '0 4px 14px rgba(113, 75, 103, 0.1)' : '0 8px 24px rgba(0,0,0,0.6)'
    };

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
                    { id: 'ctrl_keyence_1', name: 'Keyence KV-3000 HostLink', type: 'KEYENCE_KV', host: '192.168.1.10', port: 8501, status: 'connected' },
                    { id: 'ctrl_modbus_1', name: 'Modbus TCP Station 01', type: 'MODBUS_TCP', host: '192.168.1.20', port: 502, status: 'connected' }
                ];
                tags = [
                    { id: 'tag_1', controllerId: 'ctrl_keyence_1', name: 'KV_Batch_Counter', address: 'DM100', regType: 'DM_WORD', dataType: 'NUMBER', value: '1420' },
                    { id: 'tag_2', controllerId: 'ctrl_keyence_1', name: 'KV_Line_Speed_RPM', address: 'DM102', regType: 'DM_WORD', dataType: 'NUMBER', value: '1250' },
                    { id: 'tag_3', controllerId: 'ctrl_keyence_1', name: 'KV_Clamp_Pressure_Bar', address: 'DM200', regType: 'FLOAT', dataType: 'FLOAT', value: '6.9' },
                    { id: 'tag_4', controllerId: 'ctrl_keyence_1', name: 'KV_Cycle_Start_Trigger', address: 'MR000', regType: 'MR_RELAY', dataType: 'BOOLEAN', value: '0' },
                    { id: 'tag_5', controllerId: 'ctrl_keyence_1', name: 'KV_Machine_Running', address: 'MR001', regType: 'MR_RELAY', dataType: 'BOOLEAN', value: '1' },
                    { id: 'tag_6', controllerId: 'ctrl_keyence_1', name: 'KV_Emergency_Stop_OK', address: 'MR100', regType: 'MR_RELAY', dataType: 'BOOLEAN', value: '1' },
                    { id: 'tag_7', controllerId: 'ctrl_keyence_1', name: 'KV_Defect_Reject_Count', address: 'DM104', regType: 'DM_WORD', dataType: 'NUMBER', value: '2' },
                    { id: 'tag_8', controllerId: 'ctrl_modbus_1', name: 'MB_Furnace_Zone_Temp', address: '40001', regType: 'HOLDING_REGISTER', dataType: 'NUMBER', value: '235' }
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

    // ── Filter Available Components & Provide Starter Sample Widgets if Empty ──
    const availableWidgets = useMemo(() => {
        let list = [...(components || [])];

        // If list is empty, include a few starter widgets so user can experience wiring immediately
        if (list.length === 0) {
            list = [
                { id: 'widget_speed_gauge', type: 'GAUGE', displayName: 'Speed Tachometer (RPM)', props: { label: 'Line Speed', min: 0, max: 2000 } },
                { id: 'widget_pressure_display', type: 'NUMBER_INPUT', displayName: 'Hydraulic Pressure (Bar)', props: { label: 'Clamp Pressure' } },
                { id: 'widget_run_indicator', type: 'INDICATOR', displayName: 'Machine Running Lamp', props: { label: 'Status Run' } },
                { id: 'widget_cycle_start_btn', type: 'BUTTON', displayName: 'Start Cycle Pushbutton', props: { label: 'START CYCLE' } },
                { id: 'widget_estop_btn', type: 'BUTTON', displayName: 'E-Stop Reset Trigger', props: { label: 'RESET E-STOP' } }
            ];
        }

        return list;
    }, [components]);

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
    }, [isOpen, plcTags, availableWidgets, searchQuery, themeMode]);

    // ── Identify Existing Wiring Connections ──
    const wiringConnections = useMemo(() => {
        const wires = [];

        availableWidgets.forEach(comp => {
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
                        color: odooTheme.teal
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
                        color: odooTheme.indigo
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
                                    color: odooTheme.coral
                                });
                            }
                        }
                    });
                });
            }
        });

        return wires;
    }, [availableWidgets, plcTags, odooTheme]);

    // ── Bind a Tag to a Widget ──
    const handleConnect = (tagId, compId) => {
        const tag = plcTags.find(t => t.id === tagId);
        const comp = availableWidgets.find(c => c.id === compId);
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
            toast.success(`⚡ Tombol "${comp.displayName || comp.type}" dihubungkan ke WRITE Tag [${tag.name}]!`, { icon: '🟣' });
        } else {
            if (onUpdateComponent) {
                onUpdateComponent(comp.id, {
                    dataSourceType: 'PLC_TAG',
                    plcTagId: tag.id,
                    varSource: tag.name,
                    plcTagName: tag.name
                });
            }
            toast.success(`🔌 Widget "${comp.displayName || comp.type}" membaca Tag [${tag.name}] real-time!`, { icon: '🟢' });
        }

        setSelectedTagId(null);
        setSelectedCompId(null);
        setTimeout(updatePinCoordinates, 100);
    };

    // ── Disconnect a Wire ──
    const handleDisconnect = (wire) => {
        const comp = availableWidgets.find(c => c.id === wire.compId);
        if (!comp || !onUpdateComponent) return;

        if (wire.mode === 'READ') {
            onUpdateComponent(comp.id, {
                dataSourceType: '',
                plcTagId: null,
                varSource: ''
            });
            toast.success(`Koneksi ${wire.tagName} ke ${wire.compName} diputus.`, { icon: '✂️' });
        } else if (wire.mode === 'WRITE') {
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
        availableWidgets.forEach(comp => {
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
            // If no match found, wire first 2 for instant demonstration
            if (plcTags.length > 0 && availableWidgets.length > 0) {
                handleConnect(plcTags[0].id, availableWidgets[0].id);
                if (plcTags[1] && availableWidgets[1]) handleConnect(plcTags[1].id, availableWidgets[1].id);
                toast.success(`✨ Berhasil menghubungkan widget contoh ke PLC Tag!`, { icon: '🚀' });
            }
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
        toast.success(`Tag [${tag.name}] = ${nextTags.find(t => t.id === tag.id)?.value}`, { icon: '⚙️' });
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
            backgroundColor: 'rgba(23, 17, 33, 0.72)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1440px',
                height: '92vh',
                backgroundColor: odooTheme.bgModal,
                borderRadius: '16px',
                border: isLight ? '1px solid rgba(113, 75, 103, 0.25)' : '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: isLight
                    ? '0 25px 60px -15px rgba(113, 75, 103, 0.3), 0 0 35px rgba(0, 160, 157, 0.15)'
                    : '0 25px 60px -15px rgba(0, 0, 0, 0.9), 0 0 40px rgba(113, 75, 103, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                color: odooTheme.textPrimary,
                transition: 'background-color 0.3s, color 0.3s'
            }}>
                {/* ════════ ODOO ENTERPRISE COLORFUL HEADER ════════ */}
                <div style={{
                    padding: '14px 24px',
                    background: isLight
                        ? 'linear-gradient(135deg, #714B67 0%, #875A7B 60%, #00A09D 100%)'
                        : 'linear-gradient(135deg, #2D1A2A 0%, #3D2639 60%, #153A39 100%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#FFFFFF'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Odoo Icon Box */}
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            backgroundColor: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                            <Cpu size={24} color="#714B67" />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                                    Odoo Studio: PLC to Widget Wiring Topology
                                </h2>
                                <span style={{
                                    fontSize: '0.68rem',
                                    fontWeight: 800,
                                    padding: '3px 9px',
                                    borderRadius: '12px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                    color: '#FFFFFF',
                                    backdropFilter: 'blur(4px)',
                                    border: '1px solid rgba(255, 255, 255, 0.35)'
                                }}>
                                    ODOO ENTERPRISE COLORFUL
                                </span>
                            </div>
                            <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                Visualisasikan dan sambungkan register PLC (Keyence / Modbus) ke widget visual MAVI secara real-time
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Theme Switcher Toggle (Odoo Light Colorful vs Odoo Dark) */}
                        <button
                            onClick={() => setThemeMode(isLight ? 'odoo-dark' : 'odoo-light')}
                            title="Ganti Tema Odoo Light / Dark"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                                border: '1px solid rgba(255, 255, 255, 0.3)',
                                color: '#FFFFFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isLight ? <Moon size={14} /> : <Sun size={14} />}
                            <span>{isLight ? 'Odoo Dark' : 'Odoo Colorful'}</span>
                        </button>

                        {/* Auto-Wire Button */}
                        <button
                            onClick={handleAutoWire}
                            title="Hubungkan tag dan widget otomatis jika ada kesamaan nama"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: '#00A09D',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 2px 8px rgba(0, 160, 157, 0.35)'
                            }}
                        >
                            <Sparkles size={14} />
                            <span>Auto-Wire Match</span>
                        </button>

                        {/* Simulation Toggle Button */}
                        <button
                            onClick={() => setIsSimulating(!isSimulating)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 14px',
                                borderRadius: '8px',
                                backgroundColor: isSimulating ? '#28A745' : 'rgba(255, 255, 255, 0.2)',
                                border: 'none',
                                color: '#FFFFFF',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: isSimulating ? '0 2px 8px rgba(40, 167, 69, 0.35)' : 'none'
                            }}
                        >
                            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
                            <span>{isSimulating ? 'Simulasi Aktif' : 'Simulasi Jeda'}</span>
                        </button>

                        <button
                            onClick={loadPlcData}
                            title="Refresh Data PLC"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#FFFFFF',
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
                                backgroundColor: 'rgba(255, 255, 255, 0.18)',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                color: '#FFFFFF',
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
                    gridTemplateColumns: '400px 1fr 400px',
                    overflow: 'hidden',
                    backgroundColor: odooTheme.canvasBg,
                    backgroundImage: `radial-gradient(${odooTheme.gridDot} 1.5px, transparent 1.5px)`,
                    backgroundSize: '20px 20px'
                }}>
                    {/* ──── COLUMN 1 (LEFT): PLC REGISTERS & TAGS ──── */}
                    <div
                        ref={leftContainerRef}
                        onScroll={updatePinCoordinates}
                        style={{
                            padding: '18px',
                            borderRight: `1px solid ${odooTheme.border}`,
                            backgroundColor: odooTheme.bgPanel,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            overflowY: 'auto'
                        }}
                    >
                        {/* Section Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    backgroundColor: isLight ? odooTheme.purpleLight : 'rgba(113, 75, 103, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <HardDrive size={15} color={odooTheme.primary} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: odooTheme.primary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    PLC Tags & Registers
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.72rem',
                                color: odooTheme.primary,
                                fontWeight: 800,
                                backgroundColor: isLight ? odooTheme.purpleLight : 'rgba(113, 75, 103, 0.25)',
                                padding: '3px 8px',
                                borderRadius: '10px'
                            }}>
                                {filteredTags.length} Tags
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: isLight ? '#FFFFFF' : 'rgba(255, 255, 255, 0.05)',
                            border: `1px solid ${odooTheme.border}`,
                            boxShadow: odooTheme.shadowSm
                        }}>
                            <Search size={14} color={odooTheme.textMuted} />
                            <input
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Cari tag, address (MR100, DM...)"
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    color: odooTheme.textPrimary,
                                    fontSize: '0.8rem',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        {/* Controllers Odoo Pills */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {controllers.map(c => (
                                <div key={c.id} style={{
                                    fontSize: '0.7rem',
                                    padding: '4px 9px',
                                    borderRadius: '6px',
                                    backgroundColor: isLight ? odooTheme.tealLight : 'rgba(0, 160, 157, 0.15)',
                                    border: `1px solid ${isLight ? '#B2E2E1' : 'rgba(0, 160, 157, 0.35)'}`,
                                    color: isLight ? '#007A78' : '#33D1CE',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontWeight: 700
                                }}>
                                    <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: odooTheme.emerald }} />
                                    <span>{c.name || c.type}</span>
                                </div>
                            ))}
                        </div>

                        {/* Tag Cards List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            {filteredTags.map(tag => {
                                const isConnected = wiringConnections.some(w => w.tagId === tag.id);
                                const isSelected = selectedTagId === tag.id;

                                // Colorful accent border based on data type
                                const isBool = tag.dataType === 'BOOLEAN';
                                const tagColor = isBool ? odooTheme.gold : odooTheme.indigo;

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
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            backgroundColor: isSelected
                                                ? (isLight ? '#E6F6F6' : 'rgba(0, 160, 157, 0.25)')
                                                : odooTheme.bgCard,
                                            border: isSelected
                                                ? `2px solid ${odooTheme.teal}`
                                                : isConnected
                                                    ? `1.5px solid ${odooTheme.teal}`
                                                    : `1px solid ${odooTheme.border}`,
                                            borderLeft: `4px solid ${isBool ? odooTheme.gold : odooTheme.teal}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? '0 4px 14px rgba(0, 160, 157, 0.2)' : odooTheme.shadowSm
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                {/* Address Badge */}
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    fontWeight: 800,
                                                    padding: '3px 7px',
                                                    borderRadius: '6px',
                                                    backgroundColor: isBool
                                                        ? (isLight ? odooTheme.goldLight : 'rgba(245, 166, 35, 0.2)')
                                                        : (isLight ? odooTheme.indigoLight : 'rgba(74, 144, 226, 0.2)'),
                                                    color: isBool ? '#B7791F' : odooTheme.indigo
                                                }}>
                                                    {tag.address || tag.regType}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.84rem',
                                                    fontWeight: 700,
                                                    color: odooTheme.textPrimary,
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
                                                    fontSize: '0.74rem',
                                                    fontWeight: 800,
                                                    padding: '3px 10px',
                                                    borderRadius: '6px',
                                                    backgroundColor: isBool
                                                        ? (tag.value === '1' || tag.value === 1 ? odooTheme.emerald : (isLight ? '#E9ECEF' : '#332B45'))
                                                        : (isLight ? odooTheme.tealLight : 'rgba(0, 160, 157, 0.25)'),
                                                    color: isBool
                                                        ? (tag.value === '1' || tag.value === 1 ? '#FFFFFF' : odooTheme.textMuted)
                                                        : (isLight ? '#007A78' : '#33D1CE'),
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    boxShadow: isBool && (tag.value === '1' || tag.value === 1) ? '0 2px 6px rgba(40, 167, 69, 0.3)' : 'none'
                                                }}
                                            >
                                                {isBool ? (tag.value === '1' || tag.value === 1 ? 'ON (1)' : 'OFF (0)') : tag.value}
                                            </button>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                                            <span style={{ fontSize: '0.68rem', color: odooTheme.textMuted }}>
                                                {tag.regType} • {tag.dataType}
                                            </span>
                                            {isConnected && (
                                                <span style={{ fontSize: '0.7rem', color: odooTheme.teal, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Link2 size={12} /> Terhubung
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
                                                width: '13px',
                                                height: '13px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? odooTheme.teal : isConnected ? odooTheme.teal : (isLight ? '#ADB5BD' : '#495057'),
                                                border: `2.5px solid ${odooTheme.bgPanel}`,
                                                boxShadow: isSelected ? `0 0 10px ${odooTheme.teal}` : isConnected ? `0 0 6px ${odooTheme.teal}` : 'none',
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
                                <linearGradient id="odooWireGradTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={odooTheme.teal} stopOpacity="1" />
                                    <stop offset="100%" stopColor={odooTheme.indigo} stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="odooWireGradCoral" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor={odooTheme.primary} stopOpacity="1" />
                                    <stop offset="100%" stopColor={odooTheme.coral} stopOpacity="1" />
                                </linearGradient>
                                <filter id="odooGlow" x="-20%" y="-20%" width="140%" height="140%">
                                    <feGaussianBlur stdDeviation="3" result="blur" />
                                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                </filter>
                            </defs>

                            {/* Center Instruction Banner if no wires */}
                            {wiringConnections.length === 0 && !selectedTagId && (
                                <g transform="translate(140, 200)">
                                    <rect
                                        width="280"
                                        height="80"
                                        rx="12"
                                        fill={isLight ? '#FFFFFF' : '#231C33'}
                                        stroke={odooTheme.border}
                                        filter="url(#odooGlow)"
                                    />
                                    <text x="140" y="34" textAnchor="middle" fill={odooTheme.textSecondary} fontSize="12" fontWeight="700">
                                        💡 Klik pin Tag di sebelah kiri, lalu
                                    </text>
                                    <text x="140" y="56" textAnchor="middle" fill={odooTheme.primary} fontSize="13" fontWeight="800">
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
                                const strokeColor = isHovered ? odooTheme.coral : (isRead ? 'url(#odooWireGradTeal)' : 'url(#odooWireGradCoral)');

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
                                            stroke={isRead ? odooTheme.teal : odooTheme.coral}
                                            strokeWidth={isHovered ? 6 : 4}
                                            strokeOpacity={isHovered ? 0.6 : 0.25}
                                            filter="url(#odooGlow)"
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
                                                transform={`translate(${(x1 + x2) / 2 - 45}, ${(y1 + y2) / 2 - 14})`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDisconnect(wire);
                                                }}
                                            >
                                                <rect width="90" height="28" rx="14" fill={odooTheme.coral} />
                                                <text x="45" y="18" textAnchor="middle" fill="#FFFFFF" fontSize="11" fontWeight="800">
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
                            borderLeft: `1px solid ${odooTheme.border}`,
                            backgroundColor: odooTheme.bgPanel,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            overflowY: 'auto'
                        }}
                    >
                        {/* Section Header */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '8px',
                                    backgroundColor: isLight ? odooTheme.tealLight : 'rgba(0, 160, 157, 0.25)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Layers size={15} color={odooTheme.teal} />
                                </div>
                                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: odooTheme.teal, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                    Widgets ({activeStepName})
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.72rem',
                                color: odooTheme.teal,
                                fontWeight: 800,
                                backgroundColor: isLight ? odooTheme.tealLight : 'rgba(0, 160, 157, 0.25)',
                                padding: '3px 8px',
                                borderRadius: '10px'
                            }}>
                                {availableWidgets.length} Widgets
                            </span>
                        </div>

                        {/* Widget Cards List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            {availableWidgets.map(comp => {
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
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            backgroundColor: isSelected
                                                ? (isLight ? odooTheme.purpleLight : 'rgba(113, 75, 103, 0.25)')
                                                : odooTheme.bgCard,
                                            border: isSelected
                                                ? `2px solid ${odooTheme.primary}`
                                                : isConnected
                                                    ? `1.5px solid ${isButton ? odooTheme.coral : odooTheme.teal}`
                                                    : `1px solid ${odooTheme.border}`,
                                            borderLeft: `4px solid ${isButton ? odooTheme.coral : odooTheme.teal}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                            boxShadow: isSelected ? '0 4px 14px rgba(113, 75, 103, 0.2)' : odooTheme.shadowSm
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
                                                width: '13px',
                                                height: '13px',
                                                borderRadius: '50%',
                                                backgroundColor: isSelected ? odooTheme.primary : isConnected ? (isButton ? odooTheme.coral : odooTheme.teal) : (isLight ? '#ADB5BD' : '#495057'),
                                                border: `2.5px solid ${odooTheme.bgPanel}`,
                                                boxShadow: isSelected ? `0 0 10px ${odooTheme.primary}` : isConnected ? '0 0 6px rgba(0, 160, 157, 0.6)' : 'none',
                                                transition: 'all 0.2s'
                                            }}
                                        />

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                                {isButton ? <Square size={15} color={odooTheme.coral} /> : <Gauge size={15} color={odooTheme.teal} />}
                                                <span style={{
                                                    fontSize: '0.84rem',
                                                    fontWeight: 700,
                                                    color: odooTheme.textPrimary,
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis'
                                                }}>
                                                    {comp.displayName || comp.name || comp.props?.label || comp.type}
                                                </span>
                                            </div>

                                            <span style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                padding: '2px 7px',
                                                borderRadius: '5px',
                                                backgroundColor: isButton
                                                    ? (isLight ? odooTheme.coralLight : 'rgba(240, 96, 80, 0.2)')
                                                    : (isLight ? odooTheme.tealLight : 'rgba(0, 160, 157, 0.2)'),
                                                color: isButton ? odooTheme.coral : odooTheme.teal
                                            }}>
                                                {isButton ? 'TRIGGER WRITE' : 'TELEMETRY READ'}
                                            </span>
                                        </div>

                                        {/* Connection Info */}
                                        <div style={{ marginTop: '8px' }}>
                                            {connectedWires.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    {connectedWires.map(w => (
                                                        <div key={w.id} style={{
                                                            fontSize: '0.7rem',
                                                            color: w.mode === 'WRITE' ? odooTheme.coral : odooTheme.teal,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            backgroundColor: isLight ? '#F1F3F5' : 'rgba(255, 255, 255, 0.04)',
                                                            padding: '3px 8px',
                                                            borderRadius: '5px'
                                                        }}>
                                                            <span>{w.mode === 'WRITE' ? '⚡ Write' : '➔ Read'}: <b>{w.tagName}</b></span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDisconnect(w);
                                                                }}
                                                                style={{ background: 'none', border: 'none', color: odooTheme.coral, cursor: 'pointer', padding: 0 }}
                                                            >
                                                                <Unlink size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '0.7rem', color: odooTheme.textMuted, fontStyle: 'italic' }}>
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
                    borderTop: `1px solid ${odooTheme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: isLight ? '#FFFFFF' : '#1D172B',
                    fontSize: '0.78rem',
                    color: odooTheme.textSecondary
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: odooTheme.emerald, boxShadow: `0 0 8px ${odooTheme.emerald}` }} />
                            <span>Active Wires: <b style={{ color: odooTheme.textPrimary }}>{wiringConnections.length}</b></span>
                        </div>

                        <div style={{ color: odooTheme.border }}>|</div>

                        <div>
                            Controllers Online: <b style={{ color: odooTheme.textPrimary }}>{controllers.length}</b>
                        </div>

                        <div style={{ color: odooTheme.border }}>|</div>

                        <div>
                            Driver: <b style={{ color: odooTheme.teal }}>Keyence KV-Host & Modbus TCP</b>
                        </div>

                        <div style={{ color: odooTheme.border }}>|</div>

                        <div>
                            Scan Cycle: <b style={{ color: odooTheme.primary }}>50 ms (Tauri Driver)</b>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: odooTheme.emerald, fontWeight: 700 }}>
                        <ShieldCheck size={16} />
                        <span>Odoo Enterprise Connected</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlcWidgetVisualizerModal;
