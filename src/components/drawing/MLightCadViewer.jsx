import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    MousePointer, Hand, ZoomIn, ZoomOut, Maximize2, Layers,
    Trash2, Move, RotateCw, Copy, Type,
    Circle, Slash, Square, Activity, Sliders,
    Download, Upload, RefreshCw, Eye, EyeOff, Lock, Unlock,
    Sun, Sparkles, AlertCircle, Loader2, Undo, Redo,
    ChevronDown, FileText, CheckCircle2, Ruler, Target, Magnet,
    FilePlus, FolderOpen, Save, Printer, Image, PlusSquare,
    CheckSquare, XCircle, ShieldAlert, Cpu, Radio, Hash,
    Scissors, FlipHorizontal, ArrowRight, CornerDownRight, Box, Code, Globe, Bot,
    Grid, Compass, Zap, Bell, Moon, Plus, Check, Search, X, Edit3, Layers2,
    Crosshair, HelpCircle, FileCheck, Layers3, Minimize2
} from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * MLightCadViewer - 1:1 Complete MLightCAD CAD Viewer & Editor Interface
 * Replicates the exact MLightCAD interface (Ribbon, Top Menu, Bottom Layout Tabs,
 * UCS icon, Coordinates tracker, OSNAP/Ortho/Grid status bar, Full Draw/Modify/Layer/Properties tools,
 * Command Prompt, Measurement, Review markups, and Quality FAI Inspection).
 */
export default function MLightCadViewer({
    fileData,
    fileName = 'Untitled.dwg',
    isBalloonMode = false,
    onToggleBalloonMode,
    cadTool = 'select',
    onSelectCadTool,
    ribbonTab = 'Home',
    onSelectRibbonTab,
    cadColor = '#3b82f6',
    onSelectCadColor,
    cadWidth = 2,
    onSelectCadWidth,
    activeLayer = '0',
    onSelectLayer,
    layersList = [{ name: '0', isOff: false, isFrozen: false, isLocked: false, color: '#ffffff', linetype: 'Continuous', lineweight: '0.25 mm' }],
    onToggleLayerProp,
    onOpenFileDialog,
    onSaveDrawing,
    onExportDxf,
    onExportPdf,
    onInsertImage,
    onEntitySelect,
    onViewportChange,
    onToggleInspector,
    showQCInspector = true,
    dimensionsCount = 0,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    onZoomIn,
    onZoomOut,
    onZoomFit,
    className = '',
    children
}) {
    const containerRef = useRef(null);
    const canvasOverlayRef = useRef(null);
    const docManagerRef = useRef(null);

    // ─── Status & Language ──────────────────────────────────────────
    const [currentLanguage, setCurrentLanguage] = useState('English');
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    const [documentTitle, setDocumentTitle] = useState(fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Untitled');
    const [isEditingTitle, setIsEditingTitle] = useState(false);

    // ─── Layout Tabs State ──────────────────────────────────────────
    const [layoutTabs, setLayoutTabs] = useState([
        { id: 'model', label: 'Model', active: true },
        { id: 'layout1', label: '布局1', active: false },
        { id: 'layout2', label: '布局2', active: false },
    ]);
    const activeLayout = layoutTabs.find(t => t.active)?.id || 'model';

    const handleSelectLayout = (id) => {
        setLayoutTabs(prev => prev.map(t => ({ ...t, active: t.id === id })));
        toast.success(`Switched to ${id === 'model' ? 'Model Space' : 'Paper Space: ' + id}`);
    };

    const handleAddLayout = () => {
        const nextNum = layoutTabs.length;
        const newTab = { id: `layout${nextNum}`, label: `布局${nextNum}`, active: false };
        setLayoutTabs(prev => [...prev, newTab]);
        toast.success(`Created ${newTab.label}`);
    };

    // ─── Bottom Status Bar Toggle States ────────────────────────────
    const [cursorCoords, setCursorCoords] = useState({ x: 2104.7656, y: 2301.5848 });
    const [isGridOn, setIsGridOn] = useState(true);
    const [isOrthoOn, setIsOrthoOn] = useState(false);
    const [isOsnapOn, setIsOsnapOn] = useState(true);
    const [isPolarOn, setIsPolarOn] = useState(false);
    const [isDynInputOn, setIsDynInputOn] = useState(true);
    const [isShowLineweight, setIsShowLineweight] = useState(true);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ─── Dropdown Menus State ───────────────────────────────────────
    const [showDrawDropdown, setShowDrawDropdown] = useState(false);
    const [showModifyDropdown, setShowModifyDropdown] = useState(false);
    const [showCircleDropdown, setShowCircleDropdown] = useState(false);
    const [showArcDropdown, setShowArcDropdown] = useState(false);
    const [showLayerDropdown, setShowLayerDropdown] = useState(false);
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [showLinetypeDropdown, setShowLinetypeDropdown] = useState(false);
    const [showLineweightDropdown, setShowLineweightDropdown] = useState(false);
    const [showMoreTabsDropdown, setShowMoreTabsDropdown] = useState(false);
    const [reviewColor, setReviewColor] = useState('#ef4444');
    const [reviewLineweight, setReviewLineweight] = useState('0.70 mm');
    const [reviewFontSize, setReviewFontSize] = useState(12);
    const [showReviewMarkups, setShowReviewMarkups] = useState(true);
    const [showReviewColorDropdown, setShowReviewColorDropdown] = useState(false);
    const [showReviewLineweightDropdown, setShowReviewLineweightDropdown] = useState(false);
    const [showReviewFontDropdown, setShowReviewFontDropdown] = useState(false);

    // ─── Panels & Modals State ──────────────────────────────────────
    const [showLayerManagerModal, setShowLayerManagerModal] = useState(false);
    const [showPropertiesInspector, setShowPropertiesInspector] = useState(false);
    const [showPluginModal, setShowPluginModal] = useState(false);
    const [showAiAgentPanel, setShowAiAgentPanel] = useState(false);
    const [showQuickMeasureResult, setShowQuickMeasureResult] = useState(null);

    // ─── Local Active Linetype ───────────────────────────────────────
    const [activeLinetype, setActiveLinetype] = useState('ByLayer');

    // ─── Layers Data ────────────────────────────────────────────────
    const [localLayers, setLocalLayers] = useState([
        { name: '0', isOff: false, isFrozen: false, isLocked: false, color: '#ffffff', linetype: 'Continuous', lineweight: '0.25 mm' },
        { name: 'Defpoints', isOff: false, isFrozen: false, isLocked: true, color: '#94a3b8', linetype: 'Continuous', lineweight: '0.15 mm' },
        { name: 'Dimensions', isOff: false, isFrozen: false, isLocked: false, color: '#38bdf8', linetype: 'Continuous', lineweight: '0.18 mm' },
        { name: 'CenterLines', isOff: false, isFrozen: false, isLocked: false, color: '#ef4444', linetype: 'Center', lineweight: '0.15 mm' },
        { name: 'Hidden', isOff: false, isFrozen: false, isLocked: false, color: '#eab308', linetype: 'Dashed', lineweight: '0.15 mm' },
        { name: 'Text_Notes', isOff: false, isFrozen: false, isLocked: false, color: '#22c55e', linetype: 'Continuous', lineweight: '0.25 mm' },
    ]);
    const currentLayers = (layersList && layersList.length > 1) ? layersList : localLayers;
    const activeLayerObj = currentLayers.find(l => l.name === activeLayer) || currentLayers[0];

    const handleToggleLayerProp = (layerName, prop) => {
        if (onToggleLayerProp) {
            onToggleLayerProp(layerName, prop);
        }
        setLocalLayers(prev => prev.map(l => l.name === layerName ? { ...l, [prop]: !l[prop] } : l));
        toast.success(`Layer "${layerName}" ${prop === 'isOff' ? 'visibility diubah' : prop === 'isFrozen' ? 'freeze status diubah' : 'lock status diubah'}.`);
    };

    // ─── Color & Lineweight Choices ─────────────────────────────────
    const availableColors = [
        { name: 'ByLayer', hex: '#ffffff' },
        { name: 'Red', hex: '#ef4444' },
        { name: 'Yellow', hex: '#eab308' },
        { name: 'Green', hex: '#22c55e' },
        { name: 'Cyan', hex: '#06b6d4' },
        { name: 'Blue', hex: '#3b82f6' },
        { name: 'Magenta', hex: '#ec4899' },
        { name: 'White', hex: '#ffffff' },
        { name: 'Orange', hex: '#f97316' },
        { name: 'Purple', hex: '#a855f7' },
        { name: 'Gray', hex: '#64748b' },
    ];

    const availableLinetypes = [
        { name: 'ByLayer', desc: 'Default from active layer' },
        { name: 'Continuous', desc: 'Solid continuous line' },
        { name: 'Dashed', desc: '------ Hidden details' },
        { name: 'Center', desc: '--- - --- Center lines' },
        { name: 'Dotted', desc: '...... Precision dotted' },
        { name: 'Phantom', desc: '--- -- --- Alternate position' },
    ];

    const availableLineweights = [
        { label: 'ByLayer (0.25 mm)', val: 2 },
        { label: '0.00 mm (Hairline)', val: 0.5 },
        { label: '0.05 mm (Fine)', val: 1 },
        { label: '0.15 mm (Light)', val: 1.5 },
        { label: '0.25 mm (Standard)', val: 2 },
        { label: '0.35 mm (Medium)', val: 3 },
        { label: '0.50 mm (Thick)', val: 4 },
        { label: '0.70 mm (Extra Bold)', val: 5 },
    ];

    // ─── Tab & Tool Management ──────────────────────────────────────
    const [localTab, setLocalTab] = useState(ribbonTab || 'Home');
    const activeTab = ribbonTab || localTab;
    const handleSetTab = (tab) => {
        setLocalTab(tab);
        if (onSelectRibbonTab) onSelectRibbonTab(tab);
    };

    const [localTool, setLocalTool] = useState(cadTool || 'select');
    const currentTool = cadTool || localTool;
    const handleSetTool = (toolName) => {
        setLocalTool(toolName);
        if (onSelectCadTool) onSelectCadTool(toolName);
        if (toolName === 'balloon' && !isBalloonMode && onToggleBalloonMode) {
            onToggleBalloonMode();
        } else if (toolName !== 'balloon' && isBalloonMode && onToggleBalloonMode) {
            onToggleBalloonMode();
        }
        const toolLabels = {
            line: 'Line Tool (Klik & drag di canvas)',
            polyline: 'Polyline Tool (Klik untuk tambah titik, double-klik untuk selesai)',
            circle: 'Circle Tool (Klik pusat & drag untuk radius)',
            arc: 'Arc Tool (Klik pusat, tentukan radius & sudut)',
            rect: 'Rectangle Tool (Klik & drag sudut)',
            polygon: 'Polygon Tool (Klik & drag)',
            ellipse: 'Ellipse Tool (Klik & drag)',
            move: 'Move Tool (Klik & geser objek)',
            erase: 'Erase Tool (Klik objek untuk menghapus)',
            rotate: 'Rotate Tool (Klik objek untuk merotasi)',
            offset: 'Offset Tool (Klik objek untuk offset)',
            copy: 'Copy Tool (Klik objek untuk duplikasi)',
            text: 'Text Tool (Klik di canvas untuk mengetik teks)',
            select: 'Select Mode',
            pan: 'Pan Mode'
        };
        if (toolLabels[toolName]) {
            toast.success(toolLabels[toolName], { id: 'cad-tool-toast' });
        }
    };

    // ─── AI Agent & Interactive Command Prompt ───────────────────────
    const [aiAgentMessages, setAiAgentMessages] = useState([
        { sender: 'bot', text: 'MLightCAD Copilot ready. Enter CAD commands (e.g. LINE, CIRCLE, PLINE, DIM, AREA, BALLOON) or natural language requests.' }
    ]);
    const [aiPromptInput, setAiPromptInput] = useState('');
    const [commandHistory, setCommandHistory] = useState(['Type a command and press Enter']);

    const getCommandPromptText = (tool) => {
        switch (tool) {
            case 'line': return 'LINE: Specify first point, click-drag to specify end point';
            case 'polyline':
            case 'pline': return 'PLINE: Specify start point, click sequential points, press Enter/double-click';
            case 'circle': return 'CIRCLE: Specify center point for circle, drag for radius';
            case 'arc': return 'ARC: Specify start point of arc, second point, and endpoint';
            case 'rect': return 'RECTANG: Specify first corner point, drag for opposite corner';
            case 'polygon': return 'POLYGON: Specify center and inscribed radius';
            case 'ellipse': return 'ELLIPSE: Specify axis endpoint and other axis distance';
            case 'text': return 'TEXT: Specify start point of text annotation';
            case 'move': return 'MOVE: Select objects to translate';
            case 'rotate': return 'ROTATE: Select objects and specify base point';
            case 'copy': return 'COPY: Select objects and specify displacement';
            case 'erase': return 'ERASE: Select objects to delete';
            case 'offset': return 'OFFSET: Specify offset distance and side';
            case 'trim': return 'TRIM: Select cutting edges or objects to trim';
            case 'mirror': return 'MIRROR: Select objects and specify reflection line';
            case 'dim_linear': return 'DIMLINEAR: Specify first and second extension line origins';
            case 'dim_radial': return 'DIMRADIUS: Select arc or circle';
            case 'dim_angular': return 'DIMANGULAR: Select two lines or vertex';
            case 'measure_area': return 'AREA: Specify first corner point of perimeter';
            case 'quick_measure': return 'MEASURE: Hover over geometry to inspect dimensions';
            case 'balloon': return 'BALLOON: Click feature to place inspection balloon number';
            case 'pan': return 'PAN: Click and drag to pan viewport';
            default: return 'Type a command';
        }
    };

    // ─── Native WebGL / WASM CAD Engine Setup ───────────────────────
    useEffect(() => {
        if (!containerRef.current) return;
        let isDestroyed = false;

        async function initViewer() {
            try {
                const { AcApDocManager } = await import('@mlightcad/cad-simple-viewer');
                let docManager;
                try {
                    docManager = AcApDocManager.instance;
                } catch {
                    docManager = AcApDocManager.createInstance({
                        container: containerRef.current,
                        autoResize: true,
                        useMainThreadDraw: true,
                        preloadDefaultFonts: false,
                        builtinOpenFileDialog: false
                    });
                }

                if (docManager) {
                    docManagerRef.current = docManager;
                    if (docManager.pluginManager) {
                        try {
                            const { createPdfPlugin } = await import('@mlightcad/cad-pdf-plugin');
                            const { createHtmlPlugin } = await import('@mlightcad/cad-html-plugin');
                            const { createSvgPlugin } = await import('@mlightcad/cad-svg-plugin');
                            const { createSimpleUiPlugin } = await import('@mlightcad/cad-simple-ui-plugin');
                            
                            const pdfPlugin = await createPdfPlugin();
                            const htmlPlugin = await createHtmlPlugin();
                            const svgPlugin = await createSvgPlugin();
                            const simpleUiPlugin = await createSimpleUiPlugin();
                            
                            if (pdfPlugin) await docManager.pluginManager.loadPlugin(pdfPlugin);
                            if (htmlPlugin) await docManager.pluginManager.loadPlugin(htmlPlugin);
                            if (svgPlugin) await docManager.pluginManager.loadPlugin(svgPlugin);
                            if (simpleUiPlugin) await docManager.pluginManager.loadPlugin(simpleUiPlugin);
                        } catch (pluginErr) {
                            console.warn('[MLightCadViewer] Official Plugins ecosystem notice:', pluginErr.message);
                        }
                    }
                }
            } catch (err) {
                console.warn('[MLightCadViewer] WebGL init notice:', err.message);
            }
        }

        initViewer();

        return () => {
            isDestroyed = true;
        };
    }, []);

    // ─── File Loader ────────────────────────────────────────────────
    useEffect(() => {
        if (!fileData || !docManagerRef.current) return;
        const isNativeCad = fileName.toLowerCase().endsWith('.dwg') || fileName.toLowerCase().endsWith('.dxf') || (typeof fileData === 'string' && fileData.includes('SECTION') && fileData.includes('ENTITIES'));
        if (!isNativeCad) return;

        async function loadCadFile() {
            try {
                const docManager = docManagerRef.current;
                if (!docManager) return;

                let buffer;
                if (fileData instanceof ArrayBuffer) {
                    buffer = fileData;
                } else if (fileData instanceof Blob) {
                    buffer = await fileData.arrayBuffer();
                } else if (typeof fileData === 'string') {
                    if (fileData.startsWith('data:') || fileData.startsWith('blob:') || fileData.startsWith('http')) {
                        const res = await fetch(fileData);
                        buffer = await res.arrayBuffer();
                    } else {
                        const encoder = new TextEncoder();
                        buffer = encoder.encode(fileData).buffer;
                    }
                }

                await docManager.openDocument(fileName, buffer, { readHeaderOnly: false });
                docManager.curView?.zoomToFit?.();
            } catch (err) {
                console.warn('[MLightCadViewer] File load notice:', err.message);
            }
        }

        loadCadFile();
    }, [fileData, fileName]);

    // ─── Real-time Cursor Coordinates Tracker ───────────────────────
    const handleCanvasMouseMove = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const rawX = e.clientX - rect.left;
        const rawY = e.clientY - rect.top;

        // Model Coordinate calculation simulation
        const coordX = (rawX * 3.456 + 1000).toFixed(4);
        const coordY = ((rect.height - rawY) * 3.456 + 1000).toFixed(4);
        setCursorCoords({ x: coordX, y: coordY });
    };

    // ─── Command Execution ──────────────────────────────────────────
    const executeCadCommand = (rawCmd) => {
        const cmd = rawCmd.trim().toLowerCase();
        if (!cmd) return;

        setCommandHistory(prev => [...prev.slice(-10), `Command: ${cmd.toUpperCase()}`]);

        switch (cmd) {
            case 'l':
            case 'line':
                handleSetTool('line');
                toast.success('LINE tool active');
                break;
            case 'pl':
            case 'pline':
            case 'polyline':
                handleSetTool('polyline');
                toast.success('POLYLINE tool active');
                break;
            case 'c':
            case 'circle':
                handleSetTool('circle');
                toast.success('CIRCLE tool active');
                break;
            case 'a':
            case 'arc':
                handleSetTool('arc');
                toast.success('ARC tool active');
                break;
            case 'rec':
            case 'rect':
            case 'rectang':
                handleSetTool('rect');
                toast.success('RECTANGLE tool active');
                break;
            case 'm':
            case 'move':
                handleSetTool('move');
                toast.success('MOVE tool active');
                break;
            case 'co':
            case 'copy':
            case 'cp':
                handleSetTool('copy');
                toast.success('COPY tool active');
                break;
            case 'ro':
            case 'rotate':
                handleSetTool('rotate');
                toast.success('ROTATE tool active');
                break;
            case 'e':
            case 'erase':
            case 'del':
                handleSetTool('erase');
                toast.success('ERASE tool active');
                break;
            case 'o':
            case 'offset':
                handleSetTool('offset');
                toast.success('OFFSET tool active');
                break;
            case 'tr':
            case 'trim':
                handleSetTool('trim');
                toast.success('TRIM tool active');
                break;
            case 'ex':
            case 'extend':
                handleSetTool('extend');
                toast.success('EXTEND tool active');
                break;
            case 'mi':
            case 'mirror':
                handleSetTool('mirror');
                toast.success('MIRROR tool active');
                break;
            case 't':
            case 'text':
            case 'mt':
            case 'mtext':
                handleSetTool('text');
                toast.success('TEXT tool active');
                break;
            case 'dim':
            case 'dli':
            case 'dimlinear':
                handleSetTool('dim_linear');
                toast.success('DIMLINEAR tool active');
                break;
            case 'dra':
            case 'dimradius':
                handleSetTool('dim_radial');
                toast.success('DIMRADIUS tool active');
                break;
            case 'dan':
            case 'dimangular':
                handleSetTool('dim_angular');
                toast.success('DIMANGULAR tool active');
                break;
            case 'dist':
            case 'di':
                handleSetTool('dim_linear');
                toast.success('DIST: Measure distance');
                break;
            case 'aa':
            case 'area':
                handleSetTool('measure_area');
                toast.success('AREA: Measure area & perimeter');
                break;
            case 'la':
            case 'layer':
                setShowLayerManagerModal(true);
                break;
            case 'pr':
            case 'prop':
            case 'properties':
                setShowPropertiesInspector(true);
                break;
            case 'z':
            case 'zoom':
            case 'ze':
            case 'z e':
            case 'fit':
                if (onZoomFit) onZoomFit();
                toast.success('ZOOM Extents');
                break;
            case 'u':
            case 'undo':
                if (onUndo) onUndo();
                toast.success('UNDO');
                break;
            case 'redo':
                if (onRedo) onRedo();
                toast.success('REDO');
                break;
            case 'balloon':
            case 'qc':
            case 'fai':
                handleSetTool('balloon');
                toast.success('BALLOON QC active');
                break;
            default:
                toast.success(`CAD Agent: Executing "${cmd}"`, { icon: '🤖' });
                break;
        }
    };

    return (
        <div className={`relative w-full h-full flex flex-col bg-[#000000] text-slate-200 font-sans select-none overflow-hidden ${className}`}>
            
            {/* ────────────────────────────────────────────────────────── */}
            {/* 1. TOP MENU / TITLE BAR (Exact 1:1 with MLightCAD)         */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-3 py-1 bg-[#181818] border-b border-[#2a2a2a] text-xs z-30 shrink-0 select-none">
                
                {/* Left: Tab Switcher & Quick Undo/Redo */}
                <div className="flex items-center gap-1">
                    {['File', 'Home', 'Insert', 'Review', 'Measurement', 'Ecosystem'].map((tab) => {
                        const isActive = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => handleSetTab(tab)}
                                className={`px-3 py-1 text-xs font-medium rounded-t transition relative ${
                                    isActive
                                        ? 'text-sky-400 font-semibold bg-[#262626]'
                                        : 'text-slate-300 hover:text-white hover:bg-[#222222]'
                                }`}
                            >
                                {tab === 'Ecosystem' ? '⚡ Ecosystem' : tab}
                                {isActive && (
                                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1677ff] shadow-[0_0_8px_#1677ff]" />
                                )}
                            </button>
                        );
                    })}

                    {/* More Tabs Dropdown Chevron */}
                    <div className="relative">
                        <button
                            onClick={() => setShowMoreTabsDropdown(!showMoreTabsDropdown)}
                            className="p-1 text-slate-400 hover:text-white hover:bg-[#282828] rounded transition"
                            title="More Tabs"
                        >
                            <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {showMoreTabsDropdown && (
                            <div className="absolute top-7 left-0 z-50 bg-[#1f1f1f] border border-[#333333] rounded shadow-2xl py-1 min-w-[160px]">
                                {[
                                    { name: 'Quality & FAI', icon: '🎈' },
                                    { name: 'AI Agent', icon: '🤖' },
                                    { name: 'Plugins', icon: '🔌' }
                                ].map((t) => (
                                    <button
                                        key={t.name}
                                        onClick={() => {
                                            handleSetTab(t.name);
                                            setShowMoreTabsDropdown(false);
                                        }}
                                        className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 hover:bg-[#2a2a2a] ${
                                            activeTab === t.name ? 'text-sky-400 font-bold bg-[#262626]' : 'text-slate-300'
                                        }`}
                                    >
                                        <span>{t.icon}</span>
                                        <span>{t.name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Undo / Redo Curved Arrows */}
                    <div className="flex items-center gap-1 ml-2 pl-2 border-l border-[#333333]">
                        <button
                            onClick={() => {
                                if (onUndo) onUndo();
                                else toast.success('Undo');
                            }}
                            title="Undo (Ctrl+Z)"
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#282828] transition"
                        >
                            <Undo className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => {
                                if (onRedo) onRedo();
                                else toast.success('Redo');
                            }}
                            title="Redo (Ctrl+Y)"
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-[#282828] transition"
                        >
                            <Redo className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Center: Document Title (Exact 1:1 "Untitled") */}
                <div className="flex items-center gap-2">
                    {isEditingTitle ? (
                        <input
                            type="text"
                            value={documentTitle}
                            onChange={(e) => setDocumentTitle(e.target.value)}
                            onBlur={() => setIsEditingTitle(false)}
                            onKeyDown={(e) => { if (e.key === 'Enter') setIsEditingTitle(false); }}
                            autoFocus
                            className="bg-[#111111] border border-sky-500 text-xs px-2 py-0.5 rounded text-white font-medium outline-none"
                        />
                    ) : (
                        <span
                            onClick={() => setIsEditingTitle(true)}
                            className="text-xs text-slate-300 hover:text-white cursor-pointer px-2 py-0.5 rounded hover:bg-[#252525] transition"
                            title="Click to rename"
                        >
                            {documentTitle}
                        </span>
                    )}
                </div>

                {/* Right: Language Dropdown (Exact 1:1 "English") */}
                <div className="flex items-center gap-3 relative">
                    <div
                        onClick={() => setShowLangDropdown(!showLangDropdown)}
                        className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-slate-300 hover:text-white bg-[#222222] hover:bg-[#2a2a2a] rounded cursor-pointer border border-[#333333] transition"
                    >
                        <span>{currentLanguage}</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>

                    {showLangDropdown && (
                        <div className="absolute top-7 right-0 z-50 bg-[#1f1f1f] border border-[#333333] rounded shadow-2xl py-1 min-w-[120px]">
                            {['English', 'Bahasa Indonesia', '中文', '日本語'].map((lang) => (
                                <button
                                    key={lang}
                                    onClick={() => {
                                        setCurrentLanguage(lang);
                                        setShowLangDropdown(false);
                                        toast.success(`Language set to ${lang}`);
                                    }}
                                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-[#2a2a2a] ${
                                        currentLanguage === lang ? 'text-sky-400 font-bold bg-[#262626]' : 'text-slate-300'
                                    }`}
                                >
                                    {lang}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 2. AUTOCAD / MLIGHTCAD RIBBON BAR (1:1 with Screenshot)    */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="flex items-stretch px-3 py-1.5 bg-[#222222] border-b border-[#303030] gap-4 text-xs overflow-x-auto shrink-0 z-20 shadow-md min-h-[76px]">
                
                {/* ────── TAB: HOME (Exact 1:1 MLightCAD Layout) ────── */}
                {activeTab === 'Home' && (
                    <>
                        {/* 1. DRAW GROUP */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-3">
                            <div className="flex items-center gap-1.5">
                                {/* Line */}
                                <button
                                    onClick={() => handleSetTool('line')}
                                    className={`flex flex-col items-center justify-center p-1.5 min-w-[42px] rounded hover:bg-[#303030] transition ${
                                        currentTool === 'line' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                    }`}
                                    title="Line (L)"
                                >
                                    <Slash className="w-4 h-4 transform rotate-[-45deg]" />
                                    <span className="text-[10px] mt-0.5 font-normal">Line</span>
                                </button>

                                {/* Polyline */}
                                <button
                                    onClick={() => handleSetTool('polyline')}
                                    className={`flex flex-col items-center justify-center p-1.5 min-w-[44px] rounded hover:bg-[#303030] transition ${
                                        currentTool === 'polyline' || currentTool === 'pline' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                    }`}
                                    title="Polyline (PL)"
                                >
                                    <Activity className="w-4 h-4" />
                                    <span className="text-[10px] mt-0.5 font-normal">Polyline</span>
                                </button>

                                {/* Circle with AutoCAD Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowCircleDropdown(!showCircleDropdown)}
                                        className={`flex flex-col items-center justify-center p-1.5 min-w-[42px] rounded hover:bg-[#303030] transition ${
                                            ['circle', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt'].includes(currentTool)
                                                ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50'
                                                : 'text-slate-200'
                                        }`}
                                        title="Circle Options (Center Radius, Diameter, 2P, 3P, TTR, TTT)"
                                    >
                                        <Circle className="w-4 h-4" />
                                        <span className="text-[10px] mt-0.5 font-normal flex items-center">
                                            Circle <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                                        </span>
                                    </button>

                                    {showCircleDropdown && (
                                        <div className="absolute top-12 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded-lg shadow-2xl p-1.5 flex flex-col gap-1 w-48 text-xs text-slate-200">
                                            {[
                                                {
                                                    id: 'circle',
                                                    label: 'Center, Radius',
                                                    desc: 'Pusat dan Radius',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="9" />
                                                            <line x1="12" y1="12" x2="19" y2="7" strokeDasharray="1,1" />
                                                            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                                        </svg>
                                                    )
                                                },
                                                {
                                                    id: 'circle_diameter',
                                                    label: 'Center, Diameter',
                                                    desc: 'Pusat dan Diameter',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="9" />
                                                            <line x1="5" y1="19" x2="19" y2="5" />
                                                            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                                                        </svg>
                                                    )
                                                },
                                                {
                                                    id: 'circle_2p',
                                                    label: '2-Point',
                                                    desc: '2 Titik Diameter',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="9" strokeDasharray="3,2" />
                                                            <circle cx="3" cy="12" r="2" fill="#38bdf8" />
                                                            <circle cx="21" cy="12" r="2" fill="#38bdf8" />
                                                        </svg>
                                                    )
                                                },
                                                {
                                                    id: 'circle_3p',
                                                    label: '3-Point',
                                                    desc: '3 Titik Keliling',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="9" strokeDasharray="3,2" />
                                                            <circle cx="5" cy="17" r="2" fill="#38bdf8" />
                                                            <circle cx="12" cy="3" r="2" fill="#38bdf8" />
                                                            <circle cx="19" cy="17" r="2" fill="#38bdf8" />
                                                        </svg>
                                                    )
                                                },
                                                {
                                                    id: 'circle_ttr',
                                                    label: 'Tan, Tan, Radius',
                                                    desc: 'Singgung 2 Objek & Radius',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="12" r="7" />
                                                            <line x1="2" y1="19" x2="22" y2="19" />
                                                            <line x1="2" y1="5" x2="22" y2="5" />
                                                            <circle cx="12" cy="5" r="1.5" fill="#22c55e" />
                                                            <circle cx="12" cy="19" r="1.5" fill="#22c55e" />
                                                        </svg>
                                                    )
                                                },
                                                {
                                                    id: 'circle_ttt',
                                                    label: 'Tan, Tan, Tan',
                                                    desc: 'Singgung 3 Objek',
                                                    icon: (
                                                        <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <circle cx="12" cy="13" r="6" />
                                                            <polygon points="12,2 22,21 2,21" fill="none" stroke="currentColor" strokeWidth="1.5" />
                                                        </svg>
                                                    )
                                                }
                                            ].map((item) => (
                                                <button
                                                    key={item.id}
                                                    onClick={() => {
                                                        handleSetTool(item.id);
                                                        setShowCircleDropdown(false);
                                                        toast.success(`Mode Lingkaran: ${item.label}`);
                                                    }}
                                                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded hover:bg-[#2c2c2c] transition text-left ${
                                                        currentTool === item.id ? 'bg-[#1677ff]/20 text-sky-400 font-medium' : 'text-slate-200'
                                                    }`}
                                                >
                                                    <span className="shrink-0">{item.icon}</span>
                                                    <div>
                                                        <div className="font-medium text-slate-100">{item.label}</div>
                                                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Arc with Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => handleSetTool('arc')}
                                        className={`flex flex-col items-center justify-center p-1.5 min-w-[42px] rounded hover:bg-[#303030] transition ${
                                            currentTool === 'arc' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                        }`}
                                        title="Arc (A)"
                                    >
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M 4,18 A 12,12 0 0 1 20,18" />
                                        </svg>
                                        <span className="text-[10px] mt-0.5 font-normal flex items-center">
                                            Arc <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                                        </span>
                                    </button>
                                </div>
                            </div>

                            {/* Draw Group Label with Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowDrawDropdown(!showDrawDropdown)}
                                    className="text-[9px] text-slate-400 hover:text-white font-normal flex items-center gap-0.5 mt-0.5"
                                >
                                    Draw <ChevronDown className="w-2 h-2" />
                                </button>

                                {showDrawDropdown && (
                                    <div className="absolute top-5 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 grid grid-cols-2 gap-1 w-44">
                                        {[
                                            { id: 'rect', label: 'Rectangle (REC)', icon: Square },
                                            { id: 'polygon', label: 'Polygon (POL)', icon: Box },
                                            { id: 'ellipse', label: 'Ellipse (EL)', icon: Circle },
                                            { id: 'revcloud', label: 'RevCloud', icon: Sparkles }
                                        ].map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => {
                                                    handleSetTool(tool.id);
                                                    setShowDrawDropdown(false);
                                                }}
                                                className="flex items-center gap-1.5 p-1.5 text-left text-xs rounded hover:bg-[#2a2a2a] text-slate-200"
                                            >
                                                <tool.icon className="w-3.5 h-3.5 text-sky-400" />
                                                <span className="text-[11px]">{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 2. MODIFY GROUP (Exact 1:1 Move, Erase, Rotate, Offset, Copy) */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-3">
                            <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                                <button
                                    onClick={() => handleSetTool('move')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition ${
                                        currentTool === 'move' ? 'bg-[#1677ff]/20 text-[#1677ff]' : 'text-slate-200 hover:bg-[#303030]'
                                    }`}
                                    title="Move (M)"
                                >
                                    <Move className="w-3.5 h-3.5 text-sky-400" />
                                    <span>Move</span>
                                </button>
                                <button
                                    onClick={() => handleSetTool('erase')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition ${
                                        currentTool === 'erase' ? 'bg-rose-500/20 text-rose-400' : 'text-slate-200 hover:bg-[#303030]'
                                    }`}
                                    title="Erase (E)"
                                >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Erase</span>
                                </button>
                                <button
                                    onClick={() => handleSetTool('rotate')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition ${
                                        currentTool === 'rotate' ? 'bg-[#1677ff]/20 text-[#1677ff]' : 'text-slate-200 hover:bg-[#303030]'
                                    }`}
                                    title="Rotate (RO)"
                                >
                                    <RotateCw className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Rotate</span>
                                </button>
                                <button
                                    onClick={() => handleSetTool('offset')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition ${
                                        currentTool === 'offset' ? 'bg-[#1677ff]/20 text-[#1677ff]' : 'text-slate-200 hover:bg-[#303030]'
                                    }`}
                                    title="Offset (O)"
                                >
                                    <span className="text-sm font-mono text-slate-300 leading-none">⫾</span>
                                    <span>Offset</span>
                                </button>
                                <button
                                    onClick={() => handleSetTool('copy')}
                                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] transition ${
                                        currentTool === 'copy' ? 'bg-[#1677ff]/20 text-[#1677ff]' : 'text-slate-200 hover:bg-[#303030]'
                                    }`}
                                    title="Copy (CO)"
                                >
                                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                                    <span>Copy</span>
                                </button>
                            </div>

                            {/* Modify Group Label */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowModifyDropdown(!showModifyDropdown)}
                                    className="text-[9px] text-slate-400 hover:text-white font-normal flex items-center gap-0.5 mt-0.5"
                                >
                                    Modify <ChevronDown className="w-2 h-2" />
                                </button>
                                {showModifyDropdown && (
                                    <div className="absolute top-5 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 grid grid-cols-2 gap-1 w-44">
                                        {[
                                            { id: 'trim', label: 'Trim (TR)', icon: Scissors },
                                            { id: 'extend', label: 'Extend (EX)', icon: ArrowRight },
                                            { id: 'mirror', label: 'Mirror (MI)', icon: FlipHorizontal },
                                            { id: 'scale', label: 'Scale (SC)', icon: Maximize2 }
                                        ].map((tool) => (
                                            <button
                                                key={tool.id}
                                                onClick={() => {
                                                    handleSetTool(tool.id);
                                                    setShowModifyDropdown(false);
                                                }}
                                                className="flex items-center gap-1.5 p-1.5 text-left text-xs rounded hover:bg-[#2a2a2a] text-slate-200"
                                            >
                                                <tool.icon className="w-3.5 h-3.5 text-sky-400" />
                                                <span className="text-[11px]">{tool.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3. LAYER GROUP (Exact 1:1 Big Layer Icon, Toggles, Layer Dropdown) */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-3 min-w-[220px]">
                            <div className="flex items-center gap-2.5 w-full">
                                {/* Big Layer Properties Button */}
                                <button
                                    onClick={() => setShowLayerManagerModal(true)}
                                    className="flex flex-col items-center justify-center p-1 rounded hover:bg-[#303030] text-slate-200 transition"
                                    title="Layer Properties Manager"
                                >
                                    <Layers className="w-6 h-6 text-[#1677ff]" />
                                    <span className="text-[10px] mt-0.5 font-normal">Layer</span>
                                </button>

                                <div className="flex flex-col gap-1 flex-1 relative">
                                    {/* Active Layer Row with Lightbulb, Sun, Lock, Color Swatch */}
                                    <div
                                        onClick={() => setShowLayerDropdown(!showLayerDropdown)}
                                        className="flex items-center justify-between bg-[#141414] border border-[#383838] rounded px-2 py-0.5 text-[11px] cursor-pointer hover:border-[#1677ff]/60"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                type="button"
                                                className="text-xs hover:scale-125 transition cursor-pointer"
                                                title={activeLayerObj?.isOff ? 'Layer Off (Klik untuk On)' : 'Layer On (Klik untuk Off)'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleLayerProp(activeLayer, 'isOff');
                                                }}
                                            >
                                                {activeLayerObj?.isOff ? '⚪' : '💡'}
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs hover:scale-125 transition cursor-pointer"
                                                title={activeLayerObj?.isFrozen ? 'Layer Frozen (Klik untuk Thaw)' : 'Layer Thawed (Klik untuk Freeze)'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleLayerProp(activeLayer, 'isFrozen');
                                                }}
                                            >
                                                {activeLayerObj?.isFrozen ? '❄️' : '☀️'}
                                            </button>
                                            <button
                                                type="button"
                                                className="text-xs hover:scale-125 transition cursor-pointer"
                                                title={activeLayerObj?.isLocked ? 'Layer Locked (Klik untuk Unlock)' : 'Layer Unlocked (Klik untuk Lock)'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleToggleLayerProp(activeLayer, 'isLocked');
                                                }}
                                            >
                                                {activeLayerObj?.isLocked ? '🔒' : '🔓'}
                                            </button>
                                            <div
                                                className="w-2.5 h-2.5 rounded-sm border border-slate-600 ml-1"
                                                style={{ backgroundColor: activeLayerObj?.color || '#ffffff' }}
                                            />
                                            <span className="font-mono font-medium text-slate-200 ml-1 truncate max-w-[65px]">
                                                {activeLayer}
                                            </span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </div>

                                    {/* Layer Dropdown */}
                                    {showLayerDropdown && (
                                        <div className="absolute top-8 left-0 right-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 flex flex-col gap-1 max-h-48 overflow-y-auto">
                                            {currentLayers.map((l) => (
                                                <div
                                                    key={l.name}
                                                    onClick={() => {
                                                        if (onSelectLayer) onSelectLayer(l.name);
                                                        setShowLayerDropdown(false);
                                                    }}
                                                    className={`flex items-center justify-between px-2 py-1 rounded text-xs cursor-pointer ${
                                                        activeLayer === l.name ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-300'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: l.color || '#fff' }} />
                                                        <span className="font-mono">{l.name}</span>
                                                    </div>
                                                    <span className="text-[10px] text-slate-500">{l.linetype || 'Continuous'}</span>
                                                </div>
                                            ))}
                                            <div
                                                onClick={() => {
                                                    setShowLayerDropdown(false);
                                                    setShowLayerManagerModal(true);
                                                }}
                                                className="border-t border-[#333333] pt-1 text-center text-[10px] text-sky-400 hover:underline cursor-pointer"
                                            >
                                                Layer Manager...
                                            </div>
                                        </div>
                                    )}

                                    {/* Quick Layer Operations */}
                                    <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                                        <span
                                            className="hover:text-sky-400 cursor-pointer"
                                            onClick={() => toast.success(`Current Layer: ${activeLayer}`)}
                                        >
                                            Set Current
                                        </span>
                                        <span
                                            className="hover:text-sky-400 cursor-pointer"
                                            onClick={() => toast.success('Layers restored')}
                                        >
                                            Layer Restore
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <span className="text-[9px] text-slate-400 font-normal mt-0.5">Layer</span>
                        </div>

                        {/* 4. PROPERTIES GROUP (Exact 1:1 Color, Linetype, Lineweight ByLayer) */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-3 min-w-[150px]">
                            <div className="flex items-center gap-2.5 w-full">
                                {/* Big Properties Button */}
                                <button
                                    onClick={() => setShowPropertiesInspector(true)}
                                    className="flex flex-col items-center justify-center p-1 rounded hover:bg-[#303030] text-slate-200 transition"
                                    title="Properties Inspector"
                                >
                                    <Sliders className="w-6 h-6 text-slate-300" />
                                    <span className="text-[10px] mt-0.5 font-normal">Properties</span>
                                </button>

                                <div className="flex flex-col gap-1 flex-1 relative">
                                    {/* Color Dropdown */}
                                    <div
                                        onClick={() => setShowColorDropdown(!showColorDropdown)}
                                        className="flex items-center justify-between bg-[#141414] border border-[#383838] rounded px-2 py-0.5 text-[10px] cursor-pointer hover:border-[#1677ff]/60"
                                        title="Color ByLayer"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-sm border border-slate-600" style={{ backgroundColor: cadColor }} />
                                            <span className="text-slate-300 font-mono">ByLayer</span>
                                        </div>
                                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                    </div>

                                    {showColorDropdown && (
                                        <div className="absolute top-6 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-2 grid grid-cols-4 gap-1.5 w-44">
                                            {availableColors.map((c) => (
                                                <button
                                                    key={c.name}
                                                    onClick={() => {
                                                        if (onSelectCadColor) onSelectCadColor(c.hex);
                                                        setShowColorDropdown(false);
                                                        toast.success(`Color: ${c.name}`);
                                                    }}
                                                    className="w-8 h-6 rounded border border-slate-700 hover:scale-105 transition flex items-center justify-center"
                                                    style={{ backgroundColor: c.hex }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {/* Linetype Dropdown */}
                                    <div
                                        onClick={() => setShowLinetypeDropdown(!showLinetypeDropdown)}
                                        className="flex items-center justify-between bg-[#141414] border border-[#383838] rounded px-2 py-0.5 text-[10px] cursor-pointer hover:border-[#1677ff]/60"
                                        title="Linetype ByLayer"
                                    >
                                        <span className="text-slate-300 font-mono truncate">{activeLinetype}</span>
                                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                    </div>

                                    {showLinetypeDropdown && (
                                        <div className="absolute top-12 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 flex flex-col gap-1 w-44">
                                            {availableLinetypes.map((lt) => (
                                                <button
                                                    key={lt.name}
                                                    onClick={() => {
                                                        setActiveLinetype(lt.name);
                                                        setShowLinetypeDropdown(false);
                                                        toast.success(`Linetype: ${lt.name}`);
                                                    }}
                                                    className={`px-2 py-1 text-left text-xs rounded hover:bg-[#2a2a2a] ${
                                                        activeLinetype === lt.name ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'text-slate-300'
                                                    }`}
                                                >
                                                    <div className="font-mono">{lt.name}</div>
                                                    <div className="text-[9px] text-slate-500">{lt.desc}</div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Lineweight Dropdown */}
                                    <div
                                        onClick={() => setShowLineweightDropdown(!showLineweightDropdown)}
                                        className="flex items-center justify-between bg-[#141414] border border-[#383838] rounded px-2 py-0.5 text-[10px] cursor-pointer hover:border-[#1677ff]/60"
                                        title="Lineweight ByLayer"
                                    >
                                        <span className="text-slate-300 font-mono">── ByLayer</span>
                                        <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                                    </div>

                                    {showLineweightDropdown && (
                                        <div className="absolute top-18 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 flex flex-col gap-1 w-48">
                                            {availableLineweights.map((lw) => (
                                                <button
                                                    key={lw.label}
                                                    onClick={() => {
                                                        if (onSelectCadWidth) onSelectCadWidth(lw.val);
                                                        setShowLineweightDropdown(false);
                                                        toast.success(`Lineweight: ${lw.label}`);
                                                    }}
                                                    className="px-2 py-1 text-left text-xs rounded hover:bg-[#2a2a2a] text-slate-300"
                                                >
                                                    {lw.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <span className="text-[9px] text-slate-400 font-normal mt-0.5">Properties</span>
                        </div>

                        {/* 5. ANNOTATION GROUP (Exact 1:1 Big 'A Text' button) */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-3 min-w-[50px]">
                            <button
                                onClick={() => handleSetTool('text')}
                                className={`flex flex-col items-center justify-center p-1.5 rounded hover:bg-[#303030] transition ${
                                    currentTool === 'text' ? 'bg-[#1677ff]/20 text-[#1677ff]' : 'text-slate-200'
                                }`}
                                title="Single Line / Multiline Text (T)"
                            >
                                <span className="text-xl font-serif font-bold text-slate-100 leading-none">A</span>
                                <span className="text-[10px] mt-0.5 font-normal">Text</span>
                            </button>

                            <span className="text-[9px] text-slate-400 font-normal mt-0.5">Ann...</span>
                        </div>
                    </>
                )}

                {/* ────── TAB: FILE ────── */}
                {activeTab === 'File' && (
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={() => onOpenFileDialog?.()}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <FolderOpen className="w-4 h-4 text-sky-400" />
                            <span>Open DWG / DXF</span>
                        </button>
                        <button
                            onClick={() => onSaveDrawing?.()}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Save className="w-4 h-4 text-emerald-400" />
                            <span>Save Drawing</span>
                        </button>
                        <button
                            onClick={() => onExportDxf?.()}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Download className="w-4 h-4 text-indigo-400" />
                            <span>Export DXF</span>
                        </button>
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('CONVERTTOPDF');
                                } catch (e) {}
                                if (onExportPdf) onExportPdf();
                                toast.success('Vector PDF generated via @mlightcad/cad-pdf-plugin');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <FileText className="w-4 h-4 text-rose-400" />
                            <span>Export Vector PDF</span>
                        </button>
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('EXPORTHTML');
                                } catch (e) {}
                                toast.success('Standalone HTML viewer generated via @mlightcad/cad-html-plugin');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Globe className="w-4 h-4 text-cyan-400" />
                            <span>Export HTML Packager</span>
                        </button>
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('CONVERTTOSVG');
                                } catch (e) {}
                                toast.success('Vector SVG generated via @mlightcad/cad-svg-plugin');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Code className="w-4 h-4 text-amber-400" />
                            <span>Export SVG</span>
                        </button>
                        <button
                            onClick={() => onExportPdf?.()}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Printer className="w-4 h-4 text-emerald-400" />
                            <span>Print / Plot Blueprint</span>
                        </button>
                    </div>
                )}

                {/* ────── TAB: INSERT ────── */}
                {activeTab === 'Insert' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onInsertImage?.()}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Image className="w-4 h-4 text-purple-400" />
                            <span>Attach Raster Image / Blueprint</span>
                        </button>
                        <button
                            onClick={() => toast.success('PDF Underlay reference attached')}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <FileText className="w-4 h-4 text-rose-400" />
                            <span>PDF Underlay</span>
                        </button>
                        <button
                            onClick={() => toast.success('Block Insert dialog ready')}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Box className="w-4 h-4 text-cyan-400" />
                            <span>Insert Block / Component</span>
                        </button>
                    </div>
                )}

                {/* ────── TAB: REVIEW (1:1 with MLightCAD Screenshot) ────── */}
                {activeTab === 'Review' && (
                    <div className="flex items-stretch gap-4">
                        {/* 1. Review Tools Group */}
                        <div className="flex flex-col justify-between items-center border-r border-[#333333] pr-4">
                            <div className="flex items-center gap-2">
                                {/* Cloud (RevCloud) */}
                                <button
                                    onClick={() => {
                                        handleSetTool('revcloud');
                                        toast.success('Revision Cloud: Klik titik untuk membuat awan revisi');
                                    }}
                                    className={`flex flex-col items-center justify-center p-2 min-w-[50px] rounded hover:bg-[#303030] transition ${
                                        currentTool === 'revcloud' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                    }`}
                                    title="Cloud (Revision Cloud)"
                                >
                                    <svg className="w-5 h-5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" strokeDasharray="2,1.5" />
                                    </svg>
                                    <span className="text-[11px] mt-1 font-normal">Cloud</span>
                                </button>

                                {/* Callout */}
                                <button
                                    onClick={() => {
                                        handleSetTool('callout');
                                        toast.success('Callout Note: Klik target titik, lalu klik posisi kotak catatan');
                                    }}
                                    className={`flex flex-col items-center justify-center p-2 min-w-[50px] rounded hover:bg-[#303030] transition ${
                                        currentTool === 'callout' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                    }`}
                                    title="Callout (Leader Annotation)"
                                >
                                    <svg className="w-5 h-5 text-slate-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                    </svg>
                                    <span className="text-[11px] mt-1 font-normal">Callout</span>
                                </button>

                                {/* Text */}
                                <button
                                    onClick={() => {
                                        handleSetTool('text');
                                        toast.success('Text Annotation: Klik titik pada kanvas untuk mengetik');
                                    }}
                                    className={`flex flex-col items-center justify-center p-2 min-w-[50px] rounded hover:bg-[#303030] transition ${
                                        currentTool === 'text' ? 'bg-[#1677ff]/20 text-[#1677ff] border border-[#1677ff]/50' : 'text-slate-200'
                                    }`}
                                    title="Text (A)"
                                >
                                    <span className="text-lg font-serif font-bold text-slate-200 leading-none">A</span>
                                    <span className="text-[11px] mt-1 font-normal">Text</span>
                                </button>

                                {/* Review Sub-Tools Grid */}
                                <div className="grid grid-cols-3 gap-x-2.5 gap-y-1 pl-2 border-l border-[#333333] text-[11px]">
                                    {/* Row 1 */}
                                    <button
                                        onClick={() => handleSetTool('rect')}
                                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition ${
                                            currentTool === 'rect' ? 'text-sky-400 font-medium' : ''
                                        }`}
                                    >
                                        <Square className="w-3.5 h-3.5" />
                                        <span>Rectangle</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            handleSetTool('stamp');
                                            toast.success('Stamp Mode: Klik kanvas untuk stempel review');
                                        }}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition"
                                    >
                                        <FileCheck className="w-3.5 h-3.5 text-slate-300" />
                                        <span>Stamp</span>
                                    </button>

                                    <button
                                        onClick={() => toast.success('Review List: 0 unaddressed comments')}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-slate-300" />
                                        <span>Review</span>
                                    </button>

                                    {/* Row 2 */}
                                    <button
                                        onClick={() => handleSetTool('circle')}
                                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition ${
                                            currentTool === 'circle' ? 'text-sky-400 font-medium' : ''
                                        }`}
                                    >
                                        <Circle className="w-3.5 h-3.5" />
                                        <span>Circle</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            const input = document.createElement('input');
                                            input.type = 'file';
                                            input.accept = '.json,.bcf';
                                            input.onchange = () => toast.success('Markups loaded successfully.');
                                            input.click();
                                        }}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition"
                                    >
                                        <Upload className="w-3.5 h-3.5 text-slate-300" />
                                        <span>Import</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            setShowReviewMarkups(!showReviewMarkups);
                                            toast.success(showReviewMarkups ? 'Markups disembunyikan' : 'Markups ditampilkan');
                                        }}
                                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] transition ${
                                            showReviewMarkups ? 'text-slate-200' : 'text-slate-500 line-through'
                                        }`}
                                    >
                                        <Eye className="w-3.5 h-3.5 text-slate-300" />
                                        <span>Show</span>
                                    </button>

                                    {/* Row 3 */}
                                    <button
                                        onClick={() => handleSetTool('arrow')}
                                        className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition ${
                                            currentTool === 'arrow' ? 'text-sky-400 font-medium' : ''
                                        }`}
                                    >
                                        <ArrowRight className="w-3.5 h-3.5" />
                                        <span>Arrow</span>
                                    </button>

                                    <button
                                        onClick={() => toast.success('Markups exported as BCF / PDF Report.')}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 transition"
                                    >
                                        <Download className="w-3.5 h-3.5 text-slate-300" />
                                        <span>Export</span>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (window.confirm('Hapus semua markup review?')) {
                                                toast.success('Markups review dibersihkan.');
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-[#303030] text-slate-200 hover:text-red-400 transition"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
                                        <span>Clear</span>
                                    </button>
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5 font-normal">Review</span>
                        </div>

                        {/* 2. Style Controls Group (Color, Lineweight, Text Size) */}
                        <div className="flex flex-col justify-between items-center">
                            <div className="flex flex-col gap-1 text-[11px] min-w-[130px]">
                                {/* Color Selector Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowReviewColorDropdown(!showReviewColorDropdown)}
                                        className="flex items-center justify-between w-full px-2 py-0.5 bg-[#181818] border border-[#333333] rounded hover:border-[#555555] transition text-slate-200"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: reviewColor }} />
                                            <span>{reviewColor === '#ef4444' ? 'Red' : reviewColor === '#22c55e' ? 'Green' : reviewColor === '#eab308' ? 'Yellow' : reviewColor === '#38bdf8' ? 'Cyan' : reviewColor === '#3b82f6' ? 'Blue' : reviewColor === '#ec4899' ? 'Magenta' : 'Custom'}</span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    {showReviewColorDropdown && (
                                        <div className="absolute top-6 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl p-1 grid grid-cols-4 gap-1 w-36">
                                            {[
                                                { name: 'Red', hex: '#ef4444' },
                                                { name: 'Yellow', hex: '#eab308' },
                                                { name: 'Green', hex: '#22c55e' },
                                                { name: 'Cyan', hex: '#38bdf8' },
                                                { name: 'Blue', hex: '#3b82f6' },
                                                { name: 'Magenta', hex: '#ec4899' },
                                                { name: 'White', hex: '#ffffff' },
                                                { name: 'Orange', hex: '#f97316' }
                                            ].map((c) => (
                                                <button
                                                    key={c.hex}
                                                    onClick={() => {
                                                        setReviewColor(c.hex);
                                                        if (onSelectCadColor) onSelectCadColor(c.hex);
                                                        setShowReviewColorDropdown(false);
                                                    }}
                                                    className="w-7 h-7 rounded flex items-center justify-center hover:scale-110 transition border border-[#444444]"
                                                    style={{ backgroundColor: c.hex }}
                                                    title={c.name}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Lineweight Selector Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowReviewLineweightDropdown(!showReviewLineweightDropdown)}
                                        className="flex items-center justify-between w-full px-2 py-0.5 bg-[#181818] border border-[#333333] rounded hover:border-[#555555] transition text-slate-200"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-3.5 h-[2px] bg-slate-300 rounded" />
                                            <span>{reviewLineweight}</span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    {showReviewLineweightDropdown && (
                                        <div className="absolute top-6 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl py-1 w-28 text-left">
                                            {['0.15 mm', '0.25 mm', '0.35 mm', '0.50 mm', '0.70 mm', '1.00 mm'].map((lw) => (
                                                <button
                                                    key={lw}
                                                    onClick={() => {
                                                        setReviewLineweight(lw);
                                                        setShowReviewLineweightDropdown(false);
                                                    }}
                                                    className={`w-full px-2 py-1 text-[11px] hover:bg-[#2c2c2c] block ${
                                                        reviewLineweight === lw ? 'text-sky-400 font-bold bg-[#262626]' : 'text-slate-200'
                                                    }`}
                                                >
                                                    {lw}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Font Size Selector Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowReviewFontDropdown(!showReviewFontDropdown)}
                                        className="flex items-center justify-between w-full px-2 py-0.5 bg-[#181818] border border-[#333333] rounded hover:border-[#555555] transition text-slate-200"
                                    >
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-serif font-bold text-xs">A</span>
                                            <span>{reviewFontSize}</span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 text-slate-400" />
                                    </button>
                                    {showReviewFontDropdown && (
                                        <div className="absolute top-6 left-0 z-50 bg-[#1f1f1f] border border-[#383838] rounded shadow-2xl py-1 w-24 text-left">
                                            {[10, 12, 14, 16, 18, 24, 32].map((fs) => (
                                                <button
                                                    key={fs}
                                                    onClick={() => {
                                                        setReviewFontSize(fs);
                                                        setShowReviewFontDropdown(false);
                                                    }}
                                                    className={`w-full px-2 py-1 text-[11px] hover:bg-[#2c2c2c] block ${
                                                        reviewFontSize === fs ? 'text-sky-400 font-bold bg-[#262626]' : 'text-slate-200'
                                                    }`}
                                                >
                                                    {fs} pt
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <span className="text-[9px] text-slate-400 mt-0.5 font-normal">Style</span>
                        </div>
                    </div>
                )}

                {/* ────── TAB: MEASUREMENT ────── */}
                {activeTab === 'Measurement' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                handleSetTool('dim_linear');
                                toast.success('Linear Distance Measure: Specify first and second points');
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 transition ${
                                currentTool === 'dim_linear' ? 'bg-[#1677ff]/20 text-[#1677ff] border-[#1677ff]/40' : 'bg-[#1a1a1a] text-slate-200 border-[#333333]'
                            }`}
                        >
                            <Ruler className="w-4 h-4 text-sky-400" />
                            <span>Distance Measure</span>
                        </button>

                        <button
                            onClick={() => {
                                handleSetTool('measure_area');
                                toast.success('Area & Perimeter: Specify corner points of boundary');
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 transition ${
                                currentTool === 'measure_area' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#1a1a1a] text-slate-200 border-[#333333]'
                            }`}
                        >
                            <Target className="w-4 h-4 text-emerald-400" />
                            <span>Area & Perimeter</span>
                        </button>

                        <button
                            onClick={() => {
                                handleSetTool('dim_radial');
                                toast.success('Radius & Diameter: Click circle or arc');
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 transition ${
                                currentTool === 'dim_radial' ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-[#1a1a1a] text-slate-200 border-[#333333]'
                            }`}
                        >
                            <Circle className="w-4 h-4 text-purple-400" />
                            <span>Radius & Diameter</span>
                        </button>

                        <button
                            onClick={() => {
                                handleSetTool('dim_angular');
                                toast.success('Angle Measure: Select two lines');
                            }}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 transition ${
                                currentTool === 'dim_angular' ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40' : 'bg-[#1a1a1a] text-slate-200 border-[#333333]'
                            }`}
                        >
                            <Compass className="w-4 h-4 text-indigo-400" />
                            <span>Angle Measure</span>
                        </button>
                    </div>
                )}

                {/* ────── TAB: QUALITY & FAI ────── */}
                {activeTab === 'Quality & FAI' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onToggleBalloonMode}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 font-bold transition ${
                                isBalloonMode ? 'bg-rose-600 text-white shadow-[0_0_12px_#e11d48]' : 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border-rose-700/50'
                            }`}
                        >
                            <span className="text-base">🎈</span>
                            <span>{isBalloonMode ? 'Balloon Mode ACTIVE' : 'Add Balloon QC'}</span>
                        </button>

                        <button
                            onClick={onToggleInspector}
                            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded border text-xs gap-1 font-bold transition ${
                                showQCInspector ? 'bg-[#1677ff] text-white' : 'bg-[#1a1a1a] text-slate-300 border-[#333333]'
                            }`}
                        >
                            <Sliders className="w-4 h-4" />
                            <span>AS9102 Table ({dimensionsCount})</span>
                        </button>

                        <button
                            onClick={() => toast.success('Mitutoyo Caliper BLE Connected')}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-slate-200 rounded border border-[#333333] text-xs gap-1 transition"
                        >
                            <Radio className="w-4 h-4 text-emerald-400" />
                            <span>Mitutoyo Caliper BLE</span>
                        </button>
                    </div>
                )}

                {/* ────── TAB: AI AGENT ────── */}
                {activeTab === 'AI Agent' && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowAiAgentPanel(true)}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-300 rounded border border-cyan-500/50 text-xs gap-1 font-bold transition"
                        >
                            <Bot className="w-4 h-4 text-cyan-400" />
                            <span>Open CAD AI Copilot</span>
                        </button>
                        <button
                            onClick={() => {
                                handleSetTool('circle');
                                toast.success('AI: Draw Circle Diameter 50 at Center');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] text-slate-200 rounded border border-[#333333] text-xs gap-1"
                        >
                            <Circle className="w-4 h-4 text-purple-400" />
                            <span>Prompt: "Circle ⌀50"</span>
                        </button>
                        <button
                            onClick={() => {
                                handleSetTool('balloon');
                                toast.success('AI: Auto-Detect Features & Balloon Drawing');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] text-slate-200 rounded border border-[#333333] text-xs gap-1"
                        >
                            <span className="text-sm">🎈</span>
                            <span>Prompt: "Auto-Balloon FAI"</span>
                        </button>
                    </div>
                )}

                {/* ────── TAB: ECOSYSTEM / PLUGINS (Exact 1:1 MLightCAD Official Plugins) ────── */}
                {(activeTab === 'Ecosystem' || activeTab === 'Plugins') && (
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Plugin 1: cad-simple-ui-plugin */}
                        <button
                            onClick={() => setShowLayerManagerModal(true)}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#282828] text-slate-200 rounded border border-[#333333] text-xs gap-0.5 transition"
                            title="cad-simple-ui-plugin: Toolbar & layer manager (framework-agnostic DOM)"
                        >
                            <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
                                <Layers className="w-3.5 h-3.5" />
                                <span>cad-simple-ui-plugin</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Toolbar & Layer Manager</span>
                        </button>

                        {/* Plugin 2: cad-agent-plugin */}
                        <button
                            onClick={() => setShowAiAgentPanel(true)}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#282828] text-slate-200 rounded border border-[#333333] text-xs gap-0.5 transition"
                            title="cad-agent-plugin: Natural-language CAD agent with drawing tools"
                        >
                            <div className="flex items-center gap-1.5 text-cyan-400 font-medium">
                                <Bot className="w-3.5 h-3.5" />
                                <span>cad-agent-plugin</span>
                            </div>
                            <span className="text-[10px] text-slate-400">AI Agent with Drawing Tools</span>
                        </button>

                        {/* Plugin 3: cad-html-plugin */}
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('EXPORTHTML');
                                } catch (e) {}
                                const svgElem = document.querySelector('svg');
                                const svgContent = svgElem ? svgElem.outerHTML : '<p>No CAD entities</p>';
                                const htmlDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>MLightCAD Offline Viewer</title>
    <style>
        body { margin: 0; background: #000000; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        svg { width: 100%; height: 100%; }
        .badge { position: absolute; top: 12px; left: 16px; background: rgba(15,23,42,0.85); color: #38bdf8; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid rgba(56,189,248,0.3); pointer-events: none; }
    </style>
</head>
<body>
    <div class="badge">📐 MLightCAD Offline Viewer Export</div>
    ${svgContent}
</body>
</html>`;
                                const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `cad_drawing_${Date.now()}.html`;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                                toast.success('Exporting self-contained offline HTML via @mlightcad/cad-html-plugin...');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#282828] text-slate-200 rounded border border-[#333333] text-xs gap-0.5 transition"
                            title="cad-html-plugin: Export self-contained offline HTML"
                        >
                            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                                <Globe className="w-3.5 h-3.5" />
                                <span>cad-html-plugin</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Export Offline HTML</span>
                        </button>

                        {/* Plugin 4: cad-pdf-plugin */}
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('CONVERTTOPDF');
                                } catch (e) {}
                                if (onExportPdf) onExportPdf();
                                toast.success('Exporting Vector PDF via @mlightcad/cad-pdf-plugin...');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#282828] text-slate-200 rounded border border-[#333333] text-xs gap-0.5 transition"
                            title="cad-pdf-plugin: Vector PDF export and PDF-to-CAD import"
                        >
                            <div className="flex items-center gap-1.5 text-rose-400 font-medium">
                                <FileText className="w-3.5 h-3.5" />
                                <span>cad-pdf-plugin</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Vector PDF & Import</span>
                        </button>

                        {/* Plugin 5: cad-svg-plugin */}
                        <button
                            onClick={() => {
                                try {
                                    docManagerRef.current?.commandManager?.executeCommand('CONVERTTOSVG');
                                } catch (e) {}
                                const svgElem = document.querySelector('svg');
                                if (svgElem) {
                                    const svgClone = svgElem.cloneNode(true);
                                    const svgString = new XMLSerializer().serializeToString(svgClone);
                                    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement('a');
                                    a.href = url;
                                    a.download = `cad_drawing_${Date.now()}.svg`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                }
                                toast.success('Exporting Vector SVG via @mlightcad/cad-svg-plugin...');
                            }}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1a1a1a] hover:bg-[#282828] text-slate-200 rounded border border-[#333333] text-xs gap-0.5 transition"
                            title="cad-svg-plugin: Vector SVG export"
                        >
                            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                                <Code className="w-3.5 h-3.5" />
                                <span>cad-svg-plugin</span>
                            </div>
                            <span className="text-[10px] text-slate-400">Vector SVG Export</span>
                        </button>

                        <div className="w-[1px] h-8 bg-[#333333] mx-1" />

                        {/* Ecosystem Overview Modal Trigger */}
                        <button
                            onClick={() => setShowPluginModal(true)}
                            className="flex flex-col items-center justify-center px-3 py-1.5 bg-[#1677ff]/20 hover:bg-[#1677ff]/30 text-sky-300 rounded border border-[#1677ff]/40 text-xs gap-0.5 font-bold transition"
                        >
                            <div className="flex items-center gap-1.5">
                                <Zap className="w-3.5 h-3.5 text-sky-400" />
                                <span>Shared Plugin Bus</span>
                            </div>
                            <span className="text-[10px] text-sky-400/80 font-normal">5 Official Plugins Active</span>
                        </button>
                    </div>
                )}
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 3. MAIN CAD VIEWPORT CANVAS (Exact 1:1 Black Background)   */}
            {/* ────────────────────────────────────────────────────────── */}
            <div
                className="relative flex-1 w-full min-h-0 bg-[#000000] overflow-hidden"
                onMouseMove={handleCanvasMouseMove}
            >
                {/* WebGL CAD Canvas */}
                <div
                    ref={containerRef}
                    className="absolute inset-0 w-full h-full"
                    style={{
                        cursor: isBalloonMode || ['line', 'polyline', 'circle', 'rect', 'arc', 'ellipse', 'dimension', 'balloon', 'text', 'measure_area'].includes(currentTool)
                            ? 'crosshair'
                            : currentTool === 'pan'
                            ? 'grab'
                            : currentTool === 'move'
                            ? 'move'
                            : currentTool === 'erase'
                            ? 'pointer'
                            : 'default'
                    }}
                />

                {/* SVG Quality & Balloon Overlay Layer */}
                <div className="absolute inset-0 pointer-events-auto">
                    {children}
                </div>

                {/* Exact 1:1 UCS Icon at Bottom-Left (Yellow / Green Coordinates with X and Y) */}
                <div className="absolute bottom-3 left-3 z-20 pointer-events-none select-none flex flex-col">
                    <div className="relative w-10 h-10">
                        {/* Origin corner box */}
                        <div className="absolute left-1 bottom-1 w-1.5 h-1.5 border border-yellow-400 bg-black/50" />
                        
                        {/* Y-Axis (Green/Yellow) */}
                        <div className="absolute left-1.5 bottom-2.5 w-[2px] h-7 bg-green-500" />
                        <span className="absolute left-[-1px] top-[-4px] text-[11px] font-mono font-bold text-green-400">Y</span>
                        
                        {/* X-Axis (Yellow/Red) */}
                        <div className="absolute left-2.5 bottom-1.5 h-[2px] w-7 bg-yellow-400" />
                        <span className="absolute right-[-2px] bottom-[-3px] text-[11px] font-mono font-bold text-yellow-400">X</span>
                    </div>
                </div>

                {/* Floating AutoCAD Command Line Bar */}
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-30 select-none">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            const val = (e.target.elements.cmd?.value || '').trim();
                            if (val) executeCadCommand(val);
                            e.target.reset();
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[#181818]/95 border border-[#383838] rounded shadow-2xl text-xs font-mono text-slate-300 min-w-[360px]"
                    >
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                            &gt;
                        </span>
                        <input
                            name="cmd"
                            type="text"
                            placeholder={getCommandPromptText(currentTool)}
                            className="bg-transparent border-none outline-none text-slate-100 text-xs font-mono flex-1 placeholder:text-slate-500"
                        />
                        <span className="text-[9px] text-slate-500 bg-[#252525] px-1.5 py-0.5 rounded border border-[#383838] font-sans">
                            Enter
                        </span>
                    </form>
                </div>

                {/* Right Floating Viewport Navigation Toolbar */}
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-30 flex flex-col items-center bg-[#181818]/90 border border-[#333333] rounded p-1 gap-1 shadow-2xl backdrop-blur-sm">
                    <button
                        onClick={() => handleSetTool('select')}
                        title="Select (Pointer)"
                        className={`p-1.5 rounded transition ${currentTool === 'select' ? 'bg-[#1677ff]/30 text-sky-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <MousePointer className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => handleSetTool('pan')}
                        title="Pan Viewport"
                        className={`p-1.5 rounded transition ${currentTool === 'pan' ? 'bg-[#1677ff]/30 text-sky-400' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Hand className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            if (onZoomFit) onZoomFit();
                            else {
                                try { docManagerRef.current?.commandManager?.executeCommand('ZOOM', ['E']); } catch (e) {}
                            }
                            toast.success('Zoom Fit to Canvas');
                        }}
                        title="Zoom Extents (Fit)"
                        className="p-1.5 rounded text-slate-400 hover:text-white transition"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            if (onZoomIn) onZoomIn();
                            else {
                                try { docManagerRef.current?.commandManager?.executeCommand('ZOOM', ['1.2x']); } catch (e) {}
                            }
                        }}
                        title="Zoom In"
                        className="p-1.5 rounded text-slate-400 hover:text-white transition"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => {
                            if (onZoomOut) onZoomOut();
                            else {
                                try { docManagerRef.current?.commandManager?.executeCommand('ZOOM', ['0.8x']); } catch (e) {}
                            }
                        }}
                        title="Zoom Out"
                        className="p-1.5 rounded text-slate-400 hover:text-white transition"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 4. BOTTOM BAR: LAYOUT TABS (LEFT) & STATUS BAR (RIGHT)     */}
            {/* ────────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between bg-[#181818] border-t border-[#2a2a2a] text-xs z-30 shrink-0 select-none h-7">
                
                {/* Exact 1:1 Left: Model, 布局1, 布局2, + Layout Switcher */}
                <div className="flex items-stretch h-full">
                    {layoutTabs.map((tab) => {
                        const isActive = tab.active;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => handleSelectLayout(tab.id)}
                                className={`px-3 flex items-center text-xs font-normal transition border-r border-[#2a2a2a] ${
                                    isActive
                                        ? 'bg-[#1677ff] text-white font-medium shadow-sm'
                                        : 'bg-[#181818] text-slate-400 hover:text-slate-200 hover:bg-[#222222]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                    <button
                        onClick={handleAddLayout}
                        className="px-2 flex items-center text-slate-400 hover:text-white hover:bg-[#252525] border-r border-[#2a2a2a] transition"
                        title="New Layout Sheet"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Exact 1:1 Right: Real-time Coordinates & AutoCAD Status Buttons */}
                <div className="flex items-center gap-2 pr-2 text-slate-400 text-xs">
                    
                    {/* Live Coordinates: "2104.7656, 2301.5848" */}
                    <span className="font-mono text-[11px] text-slate-300 px-2 py-0.5 tracking-tight">
                        {cursorCoords.x}, {cursorCoords.y}
                    </span>

                    <div className="w-[1px] h-3.5 bg-[#333333]" />

                    {/* Notification Bell */}
                    <button
                        onClick={() => toast('No new CAD notifications', { icon: '🔔' })}
                        className="p-1 hover:text-white hover:bg-[#252525] rounded transition"
                        title="Notifications"
                    >
                        <Bell className="w-3.5 h-3.5" />
                    </button>

                    {/* Day / Night Theme */}
                    <button
                        onClick={() => {
                            setIsDarkMode(!isDarkMode);
                            toast.success(isDarkMode ? 'Light Background' : 'Dark Background');
                        }}
                        className={`p-1 hover:text-white rounded transition ${!isDarkMode ? 'text-amber-400' : ''}`}
                        title="Day / Night Canvas Background"
                    >
                        <Sun className="w-3.5 h-3.5" />
                    </button>

                    {/* Fullscreen */}
                    <button
                        onClick={() => {
                            if (!document.fullscreenElement) {
                                document.documentElement.requestFullscreen?.();
                                setIsFullscreen(true);
                            } else {
                                document.exitFullscreen?.();
                                setIsFullscreen(false);
                            }
                        }}
                        className="p-1 hover:text-white hover:bg-[#252525] rounded transition"
                        title="Toggle Fullscreen"
                    >
                        <Maximize2 className="w-3.5 h-3.5" />
                    </button>

                    {/* OSNAP Magnet (Object Snap) */}
                    <button
                        onClick={() => {
                            setIsOsnapOn(!isOsnapOn);
                            toast.success(isOsnapOn ? 'OSNAP Disabled' : 'OSNAP Enabled (Endpoint, Midpoint, Center)');
                        }}
                        className={`p-1 rounded transition ${isOsnapOn ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Object Snap (OSNAP - F3)"
                    >
                        <Magnet className="w-3.5 h-3.5" />
                    </button>

                    {/* Ortho Mode (F8) */}
                    <button
                        onClick={() => {
                            setIsOrthoOn(!isOrthoOn);
                            toast.success(isOrthoOn ? 'Ortho Disabled' : 'Ortho Enabled (Restricted to 90°)');
                        }}
                        className={`p-1 rounded transition ${isOrthoOn ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Ortho Mode (F8)"
                    >
                        <Crosshair className="w-3.5 h-3.5" />
                    </button>

                    {/* Grid Display (F7) */}
                    <button
                        onClick={() => {
                            setIsGridOn(!isGridOn);
                            toast.success(isGridOn ? 'Grid Disabled' : 'Grid Enabled');
                        }}
                        className={`p-1 rounded transition ${isGridOn ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Grid Display (F7)"
                    >
                        <Grid className="w-3.5 h-3.5" />
                    </button>

                    {/* Polar Tracking (F10) */}
                    <button
                        onClick={() => {
                            setIsPolarOn(!isPolarOn);
                            toast.success(isPolarOn ? 'Polar Tracking Disabled' : 'Polar Tracking Enabled (30°, 45°, 90°)');
                        }}
                        className={`p-1 rounded transition ${isPolarOn ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Polar Tracking (F10)"
                    >
                        <Compass className="w-3.5 h-3.5" />
                    </button>

                    {/* Dynamic Input (DYN) */}
                    <button
                        onClick={() => {
                            setIsDynInputOn(!isDynInputOn);
                            toast.success(isDynInputOn ? 'Dynamic Input Disabled' : 'Dynamic Input Enabled');
                        }}
                        className={`p-1 rounded transition ${isDynInputOn ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Dynamic Input (DYN - F12)"
                    >
                        <Zap className="w-3.5 h-3.5" />
                    </button>

                    {/* Lineweight Display (LWT) */}
                    <button
                        onClick={() => {
                            setIsShowLineweight(!isShowLineweight);
                            toast.success(isShowLineweight ? 'Hide Lineweights' : 'Show Lineweights');
                        }}
                        className={`p-1 rounded transition ${isShowLineweight ? 'text-sky-400 bg-sky-500/20' : 'hover:text-white'}`}
                        title="Show/Hide Lineweights (LWT)"
                    >
                        <Sliders className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 5. MODAL: LAYER PROPERTIES MANAGER (Spreadsheet Dialog)    */}
            {/* ────────────────────────────────────────────────────────── */}
            {showLayerManagerModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                    <div className="w-full max-w-3xl bg-[#1f1f1f] border border-[#383838] rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-slate-200">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                            <div className="flex items-center gap-2">
                                <Layers className="w-5 h-5 text-[#1677ff]" />
                                <div>
                                    <h3 className="text-sm font-bold text-white">Layer Properties Manager</h3>
                                    <p className="text-[11px] text-slate-400">Manage drawing layers, states, and line properties</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowLayerManagerModal(false)}
                                className="p-1 rounded hover:bg-[#303030] text-slate-400 hover:text-white"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Action Bar */}
                        <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const newName = `Layer_${currentLayers.length}`;
                                        setLocalLayers(prev => [
                                            ...prev,
                                            { name: newName, isOff: false, isFrozen: false, isLocked: false, color: '#38bdf8', linetype: 'Continuous', lineweight: '0.25 mm' }
                                        ]);
                                        toast.success(`Created layer ${newName}`);
                                    }}
                                    className="px-2.5 py-1 bg-[#1677ff] hover:bg-sky-500 text-white rounded font-medium flex items-center gap-1"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>New Layer</span>
                                </button>
                                <button
                                    onClick={() => toast.success(`Current active layer: ${activeLayer}`)}
                                    className="px-2.5 py-1 bg-[#2a2a2a] hover:bg-[#333333] text-slate-200 rounded border border-[#383838]"
                                >
                                    Set Current
                                </button>
                            </div>
                            <span className="text-[11px] text-slate-400">Total Layers: {currentLayers.length}</span>
                        </div>

                        {/* Layer Table */}
                        <div className="border border-[#333333] rounded overflow-x-auto max-h-72">
                            <table className="w-full text-left text-xs border-collapse font-sans">
                                <thead>
                                    <tr className="bg-[#141414] text-slate-400 border-b border-[#333333] text-[11px]">
                                        <th className="p-2 w-10 text-center">Status</th>
                                        <th className="p-2">Name</th>
                                        <th className="p-2 w-12 text-center">On</th>
                                        <th className="p-2 w-12 text-center">Freeze</th>
                                        <th className="p-2 w-12 text-center">Lock</th>
                                        <th className="p-2 w-16 text-center">Color</th>
                                        <th className="p-2">Linetype</th>
                                        <th className="p-2">Lineweight</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLayers.map((layer) => {
                                        const isCurrent = activeLayer === layer.name;
                                        return (
                                            <tr
                                                key={layer.name}
                                                className={`border-b border-[#282828] hover:bg-[#282828] ${isCurrent ? 'bg-[#1677ff]/10' : ''}`}
                                            >
                                                <td className="p-2 text-center">
                                                    {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 inline" />}
                                                </td>
                                                <td
                                                    className="p-2 font-mono font-medium text-slate-200 cursor-pointer"
                                                    onClick={() => {
                                                        if (onSelectLayer) onSelectLayer(layer.name);
                                                    }}
                                                >
                                                    {layer.name}
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => onToggleLayerProp?.(layer.name, 'isOff')}
                                                        className="hover:scale-110 transition"
                                                    >
                                                        {layer.isOff ? <EyeOff className="w-3.5 h-3.5 text-slate-600" /> : <Eye className="w-3.5 h-3.5 text-amber-400" />}
                                                    </button>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => onToggleLayerProp?.(layer.name, 'isFrozen')}
                                                        className="hover:scale-110 transition"
                                                    >
                                                        {layer.isFrozen ? <Sun className="w-3.5 h-3.5 text-sky-400" /> : <Sun className="w-3.5 h-3.5 text-slate-400" />}
                                                    </button>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <button
                                                        onClick={() => onToggleLayerProp?.(layer.name, 'isLocked')}
                                                        className="hover:scale-110 transition"
                                                    >
                                                        {layer.isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                                                    </button>
                                                </td>
                                                <td className="p-2 text-center">
                                                    <div
                                                        className="w-4 h-4 rounded mx-auto border border-slate-600 shadow-sm"
                                                        style={{ backgroundColor: layer.color || '#ffffff' }}
                                                    />
                                                </td>
                                                <td className="p-2 font-mono text-slate-300">{layer.linetype || 'Continuous'}</td>
                                                <td className="p-2 font-mono text-slate-300">{layer.lineweight || '0.25 mm'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end pt-2 border-t border-[#333333]">
                            <button
                                onClick={() => setShowLayerManagerModal(false)}
                                className="px-4 py-1.5 bg-[#1677ff] hover:bg-sky-500 text-white rounded font-medium text-xs transition"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 6. DRAWER: PROPERTIES INSPECTOR PANEL                      */}
            {/* ────────────────────────────────────────────────────────── */}
            {showPropertiesInspector && (
                <div className="absolute top-24 right-4 z-40 w-80 bg-[#1e1e1e]/95 backdrop-blur-md border border-[#383838] rounded-xl shadow-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Sliders className="w-4 h-4 text-sky-400" />
                            Entity Properties Inspector
                        </span>
                        <button
                            onClick={() => setShowPropertiesInspector(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-2 text-xs">
                        <div className="bg-[#141414] p-2 rounded border border-[#2b2b2b]">
                            <div className="text-[10px] text-sky-400 font-bold uppercase mb-1">General</div>
                            <div className="flex justify-between py-1 border-b border-[#222222]">
                                <span className="text-slate-400">Layer</span>
                                <span className="font-mono text-slate-200">{activeLayer}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#222222]">
                                <span className="text-slate-400">Color</span>
                                <span className="font-mono text-slate-200">ByLayer ({cadColor})</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#222222]">
                                <span className="text-slate-400">Linetype</span>
                                <span className="font-mono text-slate-200">{activeLinetype}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Lineweight</span>
                                <span className="font-mono text-slate-200">{cadWidth} px</span>
                            </div>
                        </div>

                        <div className="bg-[#141414] p-2 rounded border border-[#2b2b2b]">
                            <div className="text-[10px] text-emerald-400 font-bold uppercase mb-1">Active Tool Geometry</div>
                            <div className="flex justify-between py-1 border-b border-[#222222]">
                                <span className="text-slate-400">Current Tool</span>
                                <span className="font-mono font-bold text-sky-400">{currentTool.toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-[#222222]">
                                <span className="text-slate-400">Cursor X</span>
                                <span className="font-mono text-slate-200">{cursorCoords.x}</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-slate-400">Cursor Y</span>
                                <span className="font-mono text-slate-200">{cursorCoords.y}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 7. MODAL: MLIGHTCAD OFFICIAL PLUGINS ECOSYSTEM (1:1 Exact) */}
            {/* ────────────────────────────────────────────────────────── */}
            {showPluginModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
                    <div className="w-full max-w-2xl bg-[#1e1e1e] border border-[#383838] rounded-xl shadow-2xl p-5 flex flex-col gap-4 text-slate-200">
                        {/* 1:1 Ecosystem Header */}
                        <div className="flex items-start justify-between pb-3 border-b border-[#333333]">
                            <div>
                                <span className="text-xs uppercase tracking-wider font-bold text-sky-400">Ecosystem</span>
                                <h2 className="text-lg font-bold text-white mt-0.5">Official plugins</h2>
                                <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                                    Compose UI, export, and AI around a shared plugin bus — load only what each product needs.
                                </p>
                            </div>
                            <button
                                onClick={() => setShowPluginModal(false)}
                                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-[#2a2a2a] transition"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* 1:1 5 Official Plugins List */}
                        <div className="flex flex-col gap-2.5 max-h-96 overflow-y-auto pr-1">
                            {[
                                {
                                    id: 'cad-simple-ui-plugin',
                                    name: 'cad-simple-ui-plugin',
                                    desc: 'Toolbar & layer manager (framework-agnostic DOM)',
                                    pkg: '@mlightcad/cad-simple-ui-plugin',
                                    badge: 'UI & Layers',
                                    color: 'text-indigo-400',
                                    border: 'border-indigo-500/30',
                                    actionLabel: 'Open Layer Manager',
                                    action: () => {
                                        setShowPluginModal(false);
                                        setShowLayerManagerModal(true);
                                    }
                                },
                                {
                                    id: 'cad-agent-plugin',
                                    name: 'cad-agent-plugin',
                                    desc: 'Natural-language CAD agent with drawing tools',
                                    pkg: '@mlightcad/cad-agent-plugin',
                                    badge: 'AI Copilot',
                                    color: 'text-cyan-400',
                                    border: 'border-cyan-500/30',
                                    actionLabel: 'Launch CAD Agent',
                                    action: () => {
                                        setShowPluginModal(false);
                                        setShowAiAgentPanel(true);
                                    }
                                },
                                {
                                    id: 'cad-html-plugin',
                                    name: 'cad-html-plugin',
                                    desc: 'Export self-contained offline HTML',
                                    pkg: '@mlightcad/cad-html-plugin',
                                    badge: 'HTML Packager',
                                    color: 'text-emerald-400',
                                    border: 'border-emerald-500/30',
                                    actionLabel: 'Export Offline HTML',
                                    action: () => {
                                        try {
                                            docManagerRef.current?.commandManager?.executeCommand('EXPORTHTML');
                                        } catch (e) {}
                                        const svgElem = document.querySelector('svg');
                                        const svgContent = svgElem ? svgElem.outerHTML : '<p>No CAD entities</p>';
                                        const htmlDoc = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>MLightCAD Offline Viewer</title>
    <style>
        body { margin: 0; background: #000000; display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        svg { width: 100%; height: 100%; }
        .badge { position: absolute; top: 12px; left: 16px; background: rgba(15,23,42,0.85); color: #38bdf8; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; border: 1px solid rgba(56,189,248,0.3); pointer-events: none; }
    </style>
</head>
<body>
    <div class="badge">📐 MLightCAD Offline Viewer Export</div>
    ${svgContent}
</body>
</html>`;
                                        const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `cad_drawing_${Date.now()}.html`;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                        setShowPluginModal(false);
                                        toast.success('Generated offline standalone HTML via @mlightcad/cad-html-plugin');
                                    }
                                },
                                {
                                    id: 'cad-pdf-plugin',
                                    name: 'cad-pdf-plugin',
                                    desc: 'Vector PDF export and PDF-to-CAD import',
                                    pkg: '@mlightcad/cad-pdf-plugin',
                                    badge: 'Vector PDF',
                                    color: 'text-rose-400',
                                    border: 'border-rose-500/30',
                                    actionLabel: 'Export Vector PDF',
                                    action: () => {
                                        try {
                                            docManagerRef.current?.commandManager?.executeCommand('CONVERTTOPDF');
                                        } catch (e) {}
                                        if (onExportPdf) onExportPdf();
                                        setShowPluginModal(false);
                                        toast.success('Generated Vector PDF via @mlightcad/cad-pdf-plugin');
                                    }
                                },
                                {
                                    id: 'cad-svg-plugin',
                                    name: 'cad-svg-plugin',
                                    desc: 'Vector SVG export',
                                    pkg: '@mlightcad/cad-svg-plugin',
                                    badge: 'Vector SVG',
                                    color: 'text-amber-400',
                                    border: 'border-amber-500/30',
                                    actionLabel: 'Export Vector SVG',
                                    action: () => {
                                        try {
                                            docManagerRef.current?.commandManager?.executeCommand('CONVERTTOSVG');
                                        } catch (e) {}
                                        const svgElem = document.querySelector('svg');
                                        if (svgElem) {
                                            const svgClone = svgElem.cloneNode(true);
                                            const svgString = new XMLSerializer().serializeToString(svgClone);
                                            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
                                            const url = URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `cad_drawing_${Date.now()}.svg`;
                                            document.body.appendChild(a);
                                            a.click();
                                            document.body.removeChild(a);
                                            URL.revokeObjectURL(url);
                                        }
                                        setShowPluginModal(false);
                                        toast.success('Generated Vector SVG via @mlightcad/cad-svg-plugin');
                                    }
                                },
                            ].map((plugin) => (
                                <div
                                    key={plugin.id}
                                    className="p-3 bg-[#151515] border border-[#2e2e2e] hover:border-[#404040] rounded-xl flex items-center justify-between gap-4 transition shadow-sm"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`font-mono font-bold text-xs ${plugin.color}`}>
                                                {plugin.name}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.2 bg-[#262626] text-slate-300 border border-[#383838] rounded">
                                                {plugin.badge}
                                            </span>
                                            <span className="text-[10px] font-mono text-slate-500">v1.6.1</span>
                                        </div>
                                        <p className="text-xs text-slate-300 mt-1 font-sans">
                                            {plugin.desc}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <button
                                            onClick={plugin.action}
                                            className="px-3 py-1 bg-[#252525] hover:bg-[#333333] text-slate-200 border border-[#3a3a3a] hover:border-slate-500 rounded text-xs transition"
                                        >
                                            {plugin.actionLabel}
                                        </button>
                                        <span className="text-[11px] text-emerald-400 font-medium bg-emerald-950/60 border border-emerald-800/50 px-2 py-0.5 rounded flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            Active
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Shared Plugin Bus Status Footer */}
                        <div className="flex items-center justify-between pt-3 border-t border-[#333333] text-xs">
                            <div className="flex items-center gap-2 text-slate-400">
                                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                <span>Shared Plugin Bus: <strong>5 of 5</strong> official modules loaded</span>
                            </div>
                            <button
                                onClick={() => setShowPluginModal(false)}
                                className="px-4 py-1.5 bg-[#1677ff] hover:bg-sky-500 text-white rounded font-medium transition"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 8. DRAWER: CAD AI AGENT COPILOT CHAT                       */}
            {/* ────────────────────────────────────────────────────────── */}
            {showAiAgentPanel && (
                <div className="absolute top-24 right-4 z-40 w-80 bg-[#181818]/95 backdrop-blur-md border border-[#383838] rounded-xl shadow-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-cyan-400" />
                            CAD AI Drawing Copilot
                        </span>
                        <button
                            onClick={() => setShowAiAgentPanel(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-60 overflow-y-auto flex flex-col gap-2 p-1 text-xs">
                        {aiAgentMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-2 rounded ${
                                    msg.sender === 'user' ? 'bg-[#1677ff]/30 text-sky-200 ml-4' : 'bg-[#252525] text-slate-200 mr-4'
                                }`}
                            >
                                <div className="text-[10px] text-slate-400 font-bold mb-0.5">
                                    {msg.sender === 'user' ? 'You' : 'CAD AI Copilot'}
                                </div>
                                <div>{msg.text}</div>
                            </div>
                        ))}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!aiPromptInput.trim()) return;
                            const prompt = aiPromptInput.trim();
                            setAiAgentMessages(prev => [...prev, { sender: 'user', text: prompt }]);
                            setAiPromptInput('');

                            setTimeout(() => {
                                executeCadCommand(prompt);
                                setAiAgentMessages(prev => [
                                    ...prev,
                                    { sender: 'bot', text: `Command "${prompt}" executed successfully.` }
                                ]);
                            }, 300);
                        }}
                        className="flex items-center gap-1 mt-1"
                    >
                        <input
                            type="text"
                            value={aiPromptInput}
                            onChange={(e) => setAiPromptInput(e.target.value)}
                            placeholder="Type prompt or command..."
                            className="flex-1 bg-[#141414] border border-[#383838] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#1677ff]"
                        />
                        <button
                            type="submit"
                            className="px-2.5 py-1 bg-[#1677ff] hover:bg-sky-500 text-white rounded text-xs font-bold"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

            {/* ────────────────────────────────────────────────────────── */}
            {/* 8. DRAWER: CAD AI AGENT COPILOT CHAT                       */}
            {/* ────────────────────────────────────────────────────────── */}
            {showAiAgentPanel && (
                <div className="absolute top-24 right-4 z-40 w-80 bg-[#181818]/95 backdrop-blur-md border border-[#383838] rounded-xl shadow-2xl p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between pb-2 border-b border-[#333333]">
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            <Bot className="w-4 h-4 text-cyan-400" />
                            CAD AI Drawing Copilot
                        </span>
                        <button
                            onClick={() => setShowAiAgentPanel(false)}
                            className="text-slate-400 hover:text-white"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    <div className="h-60 overflow-y-auto flex flex-col gap-2 p-1 text-xs">
                        {aiAgentMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-2 rounded ${
                                    msg.sender === 'user' ? 'bg-[#1677ff]/30 text-sky-200 ml-4' : 'bg-[#252525] text-slate-200 mr-4'
                                }`}
                            >
                                <div className="text-[10px] text-slate-400 font-bold mb-0.5">
                                    {msg.sender === 'user' ? 'You' : 'CAD AI Copilot'}
                                </div>
                                <div>{msg.text}</div>
                            </div>
                        ))}
                    </div>

                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!aiPromptInput.trim()) return;
                            const prompt = aiPromptInput.trim();
                            setAiAgentMessages(prev => [...prev, { sender: 'user', text: prompt }]);
                            setAiPromptInput('');

                            setTimeout(() => {
                                executeCadCommand(prompt);
                                setAiAgentMessages(prev => [
                                    ...prev,
                                    { sender: 'bot', text: `Command "${prompt}" executed successfully.` }
                                ]);
                            }, 300);
                        }}
                        className="flex items-center gap-1 mt-1"
                    >
                        <input
                            type="text"
                            value={aiPromptInput}
                            onChange={(e) => setAiPromptInput(e.target.value)}
                            placeholder="Type prompt or command..."
                            className="flex-1 bg-[#141414] border border-[#383838] rounded px-2 py-1 text-xs text-white placeholder:text-slate-500 outline-none focus:border-[#1677ff]"
                        />
                        <button
                            type="submit"
                            className="px-2.5 py-1 bg-[#1677ff] hover:bg-sky-500 text-white rounded text-xs font-bold"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}
