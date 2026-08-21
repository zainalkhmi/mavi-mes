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
    Crosshair, HelpCircle, FileCheck, Layers3, Minimize2,
    MessageSquare, Cloud, ArrowUpRight, CircleDot, Scaling, Edit2
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
    onPrint,
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
    onAiCreateShape,
    onAiCreateDimension,
    canvasTheme = 'dark',
    onCanvasThemeChange,
    className = '',
    children
}) {
    // Canvas theme color map
    const canvasThemeColors = {
        white:     { bg: '#e8e8e8', modelBg: '#f5f5f5', grid: '#cbd5e1', text: '#0f172a', ucsX: '#dc2626', ucsY: '#16a34a', ucsOrigin: '#0f172a', commandBg: '#f8fafc', commandBorder: '#cbd5e1', commandText: '#0f172a', statusBg: '#f1f5f9', statusBorder: '#cbd5e1', statusText: '#334155', coordText: '#0f172a', paperSpaceBg: '#d4d4d4' },
        dark:      { bg: '#000000', modelBg: '#000000', grid: '#1e293b', text: '#e2e8f0', ucsX: '#f59e0b', ucsY: '#22c55e', ucsOrigin: '#ffffff', commandBg: '#181818', commandBorder: '#383838', commandText: '#e2e8f0', statusBg: '#181818', statusBorder: '#2a2a2a', statusText: '#94a3b8', coordText: '#cbd5e1', paperSpaceBg: '#2b303c' },
        blueprint: { bg: '#1a3054', modelBg: '#162a4a', grid: '#2563a8', text: '#e0f2fe', ucsX: '#fbbf24', ucsY: '#4ade80', ucsOrigin: '#e0f2fe', commandBg: '#0f2240', commandBorder: '#1e4976', commandText: '#bae6fd', statusBg: '#0c1d38', statusBorder: '#1e4976', statusText: '#7dd3fc', coordText: '#bae6fd', paperSpaceBg: '#1e3a5f' },
    };
    const tc = canvasThemeColors[canvasTheme] || canvasThemeColors.dark;
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
        { id: 'model', label: 'Model', active: true, paperSize: 'Model' },
        { id: 'layout1', label: 'Layout 1', active: false, paperSize: 'A3' },
        { id: 'layout2', label: 'Layout 2', active: false, paperSize: 'A3' },
    ]);
    const [editingTabId, setEditingTabId] = useState(null);
    const [editingTabLabel, setEditingTabLabel] = useState('');
    const [tabContextMenu, setTabContextMenu] = useState(null); // { x, y, tabId }
    const [paperSize, setPaperSize] = useState('A3'); // A4, A3, A2, A1
    const activeLayoutTab = layoutTabs.find(t => t.active) || layoutTabs[0];
    const activeLayout = activeLayoutTab.id || 'model';

    const handleSelectLayout = (id) => {
        setLayoutTabs(prev => prev.map(t => ({ ...t, active: t.id === id })));
        const target = layoutTabs.find(t => t.id === id);
        if (target && target.paperSize && target.paperSize !== 'Model') {
            setPaperSize(target.paperSize);
        }
        toast.success(id === 'model' ? '🏢 Mode Model Space (Infinite Workspace)' : `📄 Mode Paper Space: ${target?.label || id} (${paperSize} Sheet)`);
    };

    const handleAddLayout = () => {
        const nextNum = layoutTabs.length;
        const newId = `layout_${Date.now()}`;
        const newTab = { id: newId, label: `Layout ${nextNum}`, active: true, paperSize: 'A3' };
        setLayoutTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab]);
        setPaperSize('A3');
        toast.success(`Lembar layout baru "${newTab.label}" dibuat.`);
    };

    const handleRenameTab = (tabId, newLabel) => {
        if (!newLabel || !newLabel.trim()) {
            setEditingTabId(null);
            return;
        }
        setLayoutTabs(prev => prev.map(t => t.id === tabId ? { ...t, label: newLabel.trim() } : t));
        setEditingTabId(null);
        toast.success(`Nama lembar diubah menjadi "${newLabel.trim()}".`);
    };

    const handleDuplicateTab = (tabId) => {
        const source = layoutTabs.find(t => t.id === tabId);
        if (!source) return;
        const newTab = {
            id: `layout_${Date.now()}`,
            label: `${source.label} (Salinan)`,
            active: true,
            paperSize: source.paperSize || 'A3'
        };
        setLayoutTabs(prev => [...prev.map(t => ({ ...t, active: false })), newTab]);
        toast.success(`Lembar "${source.label}" berhasil diduplikasi.`);
    };

    const handleDeleteTab = (tabId) => {
        if (tabId === 'model') {
            toast.error('Model Space tidak dapat dihapus.');
            return;
        }
        if (layoutTabs.length <= 1) {
            toast.error('Minimal harus ada satu lembar layout.');
            return;
        }
        const remaining = layoutTabs.filter(t => t.id !== tabId);
        if (activeLayout === tabId) {
            remaining[0].active = true;
        }
        setLayoutTabs(remaining);
        toast.success('Lembar layout berhasil dihapus.');
    };

    // ─── Bottom Status Bar Toggle States ────────────────────────────
    const [cursorCoords, setCursorCoords] = useState({ x: 2104.7656, y: 2301.5848 });
    const [isGridOn, setIsGridOn] = useState(true);
    const [isOrthoOn, setIsOrthoOn] = useState(false);
    const [isOsnapOn, setIsOsnapOn] = useState(true);
    const [isPolarOn, setIsPolarOn] = useState(false);
    const [isDynInputOn, setIsDynInputOn] = useState(true);
    const [isShowLineweight, setIsShowLineweight] = useState(true);
    // isDarkMode derived from canvasTheme for backward compatibility
    const isDarkMode = canvasTheme === 'dark' || canvasTheme === 'blueprint';
    const [isFullscreen, setIsFullscreen] = useState(false);

    // ─── Dropdown Menus State ───────────────────────────────────────
    const [showFileDropdown, setShowFileDropdown] = useState(false);
    const [showDrawDropdown, setShowDrawDropdown] = useState(false);
    const [showModifyDropdown, setShowModifyDropdown] = useState(false);
    const [showAnnotateDropdown, setShowAnnotateDropdown] = useState(false);
    const [showViewDropdown, setShowViewDropdown] = useState(false);
    const [showCircleDropdown, setShowCircleDropdown] = useState(false);
    const [showArcDropdown, setShowArcDropdown] = useState(false);
    const [showLayerDropdown, setShowLayerDropdown] = useState(false);
    const [showColorDropdown, setShowColorDropdown] = useState(false);
    const [showLinetypeDropdown, setShowLinetypeDropdown] = useState(false);
    const [showLineweightDropdown, setShowLineweightDropdown] = useState(false);
    const [showMoreTabsDropdown, setShowMoreTabsDropdown] = useState(false);
    const [cadContextMenu, setCadContextMenu] = useState(null); // { x, y }
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
                
                // Register LibreDWG Parser for DWG support
                try {
                    const { AcDbDatabaseConverterManager, AcDbFileType } = await import('@mlightcad/data-model');
                    const { AcDbLibreDwgConverter } = await import('@mlightcad/libredwg-converter');
                    
                    AcDbDatabaseConverterManager.instance.register(
                        AcDbFileType.DWG,
                        new AcDbLibreDwgConverter({
                            convertByEntityType: false,
                            useWorker: true,
                            parserWorkerUrl: '/workers/libredwg-parser-worker.js'
                        })
                    );
                } catch (dwgErr) {
                    console.warn('[MLightCadViewer] DWG Parser Opt-in missing or failed:', dwgErr.message);
                }

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
                    if (fileData.startsWith('data:image/svg+xml')) {
                        // WebGL engine cannot parse SVG Data URLs natively, skip loading into WebGL
                        // It will be rendered by the overlay instead.
                        return;
                    }
                    if (fileData.startsWith('data:')) {
                        try {
                            const base64Part = fileData.split(',')[1];
                            const binaryString = atob(base64Part);
                            const len = binaryString.length;
                            const bytes = new Uint8Array(len);
                            for (let i = 0; i < len; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            buffer = bytes.buffer;
                        } catch (decodeErr) {
                            console.error('[MLightCadViewer] Base64 Decode Error:', decodeErr);
                            // Fallback to fetch if manual decode fails
                            const res = await fetch(fileData);
                            buffer = await res.arrayBuffer();
                        }
                    } else if (fileData.startsWith('blob:') || fileData.startsWith('http')) {
                        const res = await fetch(fileData);
                        buffer = await res.arrayBuffer();
                    } else {
                        const encoder = new TextEncoder();
                        buffer = encoder.encode(fileData).buffer;
                    }
                }

                if (buffer && buffer.byteLength > 0) {
                    await docManager.openDocument(fileName, buffer, { readHeaderOnly: false });
                    docManager.curView?.zoomToFit?.();
                }
            } catch (err) {
                console.error('[MLightCadViewer] File load error:', err);
                toast.error('Gagal memparsing file CAD: ' + (err.message || 'Unknown error'));
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
            case 'theme': {
                const themeOrder = ['dark', 'blueprint', 'white'];
                const themeLabels = { dark: '⬛ Dark (Black)', blueprint: '📐 Blueprint (Blue)', white: '⬜ White (Light)' };
                const idx = themeOrder.indexOf(canvasTheme);
                const next = themeOrder[(idx + 1) % themeOrder.length];
                if (onCanvasThemeChange) onCanvasThemeChange(next);
                toast.success(`Canvas Theme: ${themeLabels[next]}`);
                break;
            }
            case 'blueprint':
                if (onCanvasThemeChange) onCanvasThemeChange('blueprint');
                toast.success('Canvas Theme: 📐 Blueprint (Blue)');
                break;
            case 'dark':
            case 'darkmode':
                if (onCanvasThemeChange) onCanvasThemeChange('dark');
                toast.success('Canvas Theme: ⬛ Dark (Black)');
                break;
            case 'white':
            case 'lightmode':
                if (onCanvasThemeChange) onCanvasThemeChange('white');
                toast.success('Canvas Theme: ⬜ White (Light)');
                break;
            default:
                toast.success(`CAD Agent: Executing "${cmd}"`, { icon: '🤖' });
                break;
        }
    };

    return (
        <div className={`relative w-full h-full flex flex-col bg-[#000000] text-slate-200 font-sans select-none overflow-hidden ${className}`}>
            {/* ────────────────────────────────────────────────────────── */}
            {/* 1. COMPACT GROUPED CAD TOOLBAR (SPACE SAVING - H-10)       */}
            {/* ────────────────────────────────────────────────────────── */}
            
            {/* Backdrop to close dropdowns on outside click */}
            {(showFileDropdown || showDrawDropdown || showModifyDropdown || showAnnotateDropdown || showViewDropdown || showLayerDropdown || showColorDropdown || showLineweightDropdown) && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => {
                        setShowFileDropdown(false);
                        setShowDrawDropdown(false);
                        setShowModifyDropdown(false);
                        setShowAnnotateDropdown(false);
                        setShowViewDropdown(false);
                        setShowLayerDropdown(false);
                        setShowColorDropdown(false);
                        setShowLineweightDropdown(false);
                    }}
                />
            )}

            <div className="relative flex items-center justify-between px-2 py-1 bg-[#141414] border-b border-[#262626] text-xs shrink-0 z-50 shadow-md h-10 select-none overflow-visible gap-2">
                <div className="flex items-center gap-1.5 overflow-visible">
                    
                    {/* GROUP 1: FILE & HISTORY CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm overflow-visible">
                        {/* File Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setShowFileDropdown(!showFileDropdown);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                                    showFileDropdown ? 'bg-[#1677ff]/20 text-sky-400 font-semibold' : 'text-slate-300 hover:text-white hover:bg-[#282828]'
                                }`}
                                title="File Operations (Open, Save, Export)"
                            >
                                <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                                <span className="font-medium text-[11px]">File</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </button>

                            {showFileDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-44">
                                    <button
                                        onClick={() => {
                                            onOpenFileDialog?.();
                                            setShowFileDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <FolderOpen className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Buka File (DWG/DXF)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onSaveDrawing?.();
                                            setShowFileDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <Save className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Simpan Drawing</span>
                                    </button>
                                    <div className="w-full h-[1px] bg-[#2d2d2d] my-0.5" />
                                    <button
                                        onClick={() => {
                                            if (onExportDxf) onExportDxf();
                                            else toast.success('Exporting DXF...');
                                            setShowFileDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <Download className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>Export DXF</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onExportPdf) onExportPdf();
                                            else toast.success('Exporting Vector PDF...');
                                            setShowFileDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-rose-400" />
                                        <span>Export Vector PDF</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (onPrint) onPrint();
                                            else window.print();
                                            setShowFileDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <Printer className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Print / Plot Blueprint</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-[1px] h-3.5 bg-[#303030] mx-0.5" />

                        {/* Undo / Redo */}
                        <button
                            onClick={() => onUndo?.()}
                            disabled={!canUndo}
                            className={`p-1 rounded transition ${canUndo ? 'text-slate-300 hover:text-white hover:bg-[#282828]' : 'text-slate-600 cursor-not-allowed'}`}
                            title="Undo (Ctrl+Z)"
                        >
                            <Undo className="w-3.5 h-3.5" />
                        </button>
                        <button
                            onClick={() => onRedo?.()}
                            disabled={!canRedo}
                            className={`p-1 rounded transition ${canRedo ? 'text-slate-300 hover:text-white hover:bg-[#282828]' : 'text-slate-600 cursor-not-allowed'}`}
                            title="Redo (Ctrl+Y)"
                        >
                            <Redo className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* GROUP 2: MODIFY & SELECT CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm overflow-visible">
                        {/* Select Primary Tool */}
                        <button
                            onClick={() => handleSetTool('select')}
                            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                                currentTool === 'select' ? 'bg-[#1677ff] text-white font-semibold shadow' : 'text-slate-300 hover:bg-[#282828] hover:text-white'
                            }`}
                            title="Select / Marquee Box (Esc / Space)"
                        >
                            <MousePointer className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Select</span>
                        </button>

                        {/* Modify Flyout Dropdown */}
                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowModifyDropdown(!showModifyDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition ${
                                    ['move', 'copy', 'rotate', 'offset', 'erase'].includes(currentTool) || showModifyDropdown
                                        ? 'bg-[#1677ff]/20 text-sky-400 font-semibold'
                                        : 'text-slate-300 hover:bg-[#282828] hover:text-white'
                                }`}
                                title="Modify Tools (Move, Copy, Rotate, Offset, Erase)"
                            >
                                {currentTool === 'move' ? <Move className="w-3.5 h-3.5 text-sky-400" /> :
                                 currentTool === 'copy' ? <Copy className="w-3.5 h-3.5 text-amber-400" /> :
                                 currentTool === 'rotate' ? <RotateCw className="w-3.5 h-3.5 text-slate-300" /> :
                                 currentTool === 'offset' ? <Scaling className="w-3.5 h-3.5 text-slate-300" /> :
                                 currentTool === 'erase' ? <Trash2 className="w-3.5 h-3.5 text-rose-400" /> :
                                 <Sliders className="w-3.5 h-3.5 text-slate-400" />}
                                <span className="text-[11px] capitalize">{['move', 'copy', 'rotate', 'offset', 'erase'].includes(currentTool) ? currentTool : 'Modify'}</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </button>

                            {showModifyDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-36">
                                    {[
                                        { id: 'move', label: 'Move (M)', icon: Move, color: 'text-sky-400' },
                                        { id: 'copy', label: 'Copy (CO)', icon: Copy, color: 'text-amber-400' },
                                        { id: 'rotate', label: 'Rotate (RO)', icon: RotateCw, color: 'text-slate-300' },
                                        { id: 'offset', label: 'Offset (O)', icon: Scaling, color: 'text-slate-300' },
                                        { id: 'erase', label: 'Erase (Del)', icon: Trash2, color: 'text-rose-400' }
                                    ].map((m) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                handleSetTool(m.id);
                                                setShowModifyDropdown(false);
                                            }}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition ${
                                                currentTool === m.id ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                            }`}
                                        >
                                            <m.icon className={`w-3.5 h-3.5 ${m.color}`} />
                                            <span>{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GROUP 3: DRAW TOOLS CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm overflow-visible">
                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowDrawDropdown(!showDrawDropdown);
                                    setShowFileDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition ${
                                    ['line', 'polyline', 'circle', 'rect', 'arc', 'text', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt'].includes(currentTool) || showDrawDropdown
                                        ? 'bg-[#1677ff] text-white font-semibold shadow'
                                        : 'text-slate-300 hover:bg-[#282828] hover:text-white'
                                }`}
                                title="CAD Draw Tools (Line, Circle, Polyline, Rect, Arc, Text)"
                            >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Draw</span>
                                <ChevronDown className="w-2.5 h-2.5 opacity-80" />
                            </button>

                            {showDrawDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-48">
                                    <button
                                        onClick={() => {
                                            handleSetTool('line');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'line' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Slash className="w-3.5 h-3.5 transform rotate-[-45deg] text-sky-400" />
                                        <div>
                                            <div>Line (L)</div>
                                            <div className="text-[9px] text-slate-400">Click-Move-Click</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('polyline');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'polyline' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                                        <div>
                                            <div>Polyline (PL)</div>
                                            <div className="text-[9px] text-slate-400">Garis kontinu multi-titik</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('circle');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'circle' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Circle className="w-3.5 h-3.5 text-amber-400" />
                                        <div>
                                            <div>Circle (C)</div>
                                            <div className="text-[9px] text-slate-400">Pusat & Radius</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('rect');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'rect' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Square className="w-3.5 h-3.5 text-emerald-400" />
                                        <div>
                                            <div>Rectangle (REC)</div>
                                            <div className="text-[9px] text-slate-400">Kotak 2 sudut diagonal</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('arc');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'arc' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <svg className="w-3.5 h-3.5 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M 4,18 A 12,12 0 0 1 20,18" />
                                        </svg>
                                        <div>
                                            <div>Arc (A)</div>
                                            <div className="text-[9px] text-slate-400">Busur 3 titik</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('text');
                                            setShowDrawDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'text' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Type className="w-3.5 h-3.5 text-pink-400" />
                                        <div>
                                            <div>Text (T)</div>
                                            <div className="text-[9px] text-slate-400">Teks CAD Annotation</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GROUP 4: ANNOTATE & QC CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm overflow-visible">
                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowAnnotateDropdown(!showAnnotateDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition ${
                                    ['dim_linear', 'dim_radial', 'balloon', 'callout', 'revcloud', 'arrow', 'stamp'].includes(currentTool) || isBalloonMode || showAnnotateDropdown
                                        ? 'bg-amber-600 text-white font-semibold shadow'
                                        : 'text-slate-300 hover:bg-[#282828] hover:text-white'
                                }`}
                                title="Annotation & Quality Inspection (Dim, Balloon QC, Callout, Cloud, Stamp)"
                            >
                                <Ruler className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Annotate / QC</span>
                                {dimensionsCount > 0 && (
                                    <span className="bg-amber-400 text-black text-[9px] font-bold px-1 rounded-full leading-none py-0.5">
                                        {dimensionsCount}
                                    </span>
                                )}
                                <ChevronDown className="w-2.5 h-2.5 opacity-80" />
                            </button>

                            {showAnnotateDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-52">
                                    <button
                                        onClick={() => {
                                            handleSetTool('dim_linear');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'dim_linear' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Ruler className="w-3.5 h-3.5 text-emerald-400" />
                                        <div>
                                            <div>Linear Dimension (DLI)</div>
                                            <div className="text-[9px] text-slate-400">Ukuran panjang & jarak</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('dim_radial');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'dim_radial' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Target className="w-3.5 h-3.5 text-emerald-400" />
                                        <div>
                                            <div>Radial Dimension (DRA)</div>
                                            <div className="text-[9px] text-slate-400">Radius (R) & Diameter (Ø)</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('balloon');
                                            setIsBalloonMode(!isBalloonMode);
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center justify-between px-2 py-1.5 rounded text-left text-xs ${
                                            isBalloonMode || currentTool === 'balloon' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <CircleDot className="w-3.5 h-3.5 text-amber-400" />
                                            <div>
                                                <div>🎈 Balon QC (Inspection)</div>
                                                <div className="text-[9px] text-slate-400">Bubble numbering QC</div>
                                            </div>
                                        </div>
                                        <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded font-mono font-bold">
                                            {dimensionsCount}
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('callout');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'callout' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                                        <div>
                                            <div>Callout Annotation</div>
                                            <div className="text-[9px] text-slate-400">Leader note & komentar</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('revcloud');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'revcloud' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <Cloud className="w-3.5 h-3.5 text-rose-400" />
                                        <div>
                                            <div>Revision Cloud</div>
                                            <div className="text-[9px] text-slate-400">Awan revisi perubahan desain</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('arrow');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'arrow' ? 'bg-[#1677ff]/20 text-sky-300 font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
                                        <div>
                                            <div>Arrow Pointer</div>
                                            <div className="text-[9px] text-slate-400">Panah penunjuk bagian</div>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleSetTool('stamp');
                                            setShowAnnotateDropdown(false);
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs ${
                                            currentTool === 'stamp' ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-[#2a2a2a] text-slate-200'
                                        }`}
                                    >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        <div>
                                            <div>Stamp APPROVED</div>
                                            <div className="text-[9px] text-slate-400">Stempel verifikasi mutu</div>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GROUP 5: PROPERTIES & LAYER CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm gap-1 overflow-visible">
                        {/* Layer Dropdown */}
                        <div className="relative overflow-visible">
                            <div
                                onClick={() => {
                                    setShowLayerDropdown(!showLayerDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className="flex items-center gap-1.5 bg-[#111111] border border-[#333333] hover:border-sky-500/60 rounded px-2 py-1 text-xs cursor-pointer"
                                title="Active CAD Layer"
                            >
                                <Layers className="w-3.5 h-3.5 text-sky-400" />
                                <span className="font-mono text-slate-200 truncate max-w-[60px]">{activeLayer}</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </div>

                            {showLayerDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-44">
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
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: l.color || '#fff' }} />
                                                <span className="font-mono">{l.name}</span>
                                            </div>
                                            <span className="text-[9px] text-slate-500">{l.linetype || 'Continuous'}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Color Dropdown */}
                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowColorDropdown(!showColorDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className="flex items-center gap-1 bg-[#111111] border border-[#333333] hover:border-sky-500/60 rounded px-1.5 py-1"
                                title="Color"
                            >
                                <div className="w-3 h-3 rounded-full border border-slate-600" style={{ backgroundColor: cadColor || '#38bdf8' }} />
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </button>

                            {showColorDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-2 grid grid-cols-4 gap-1.5 w-36">
                                    {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#a855f7', '#ffffff'].map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => {
                                                if (onSelectCadColor) onSelectCadColor(c);
                                                setReviewColor(c);
                                                setShowColorDropdown(false);
                                            }}
                                            className="w-6 h-6 rounded-md border border-slate-600 hover:scale-110 transition"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Lineweight */}
                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowLineweightDropdown(!showLineweightDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowViewDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                }}
                                className="flex items-center gap-1 bg-[#111111] border border-[#333333] hover:border-sky-500/60 rounded px-1.5 py-1 text-[11px] font-mono text-slate-300"
                                title="Lineweight"
                            >
                                <span>{cadWidth}px</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                            </button>

                            {showLineweightDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-32">
                                    {[1, 2, 3, 4, 5].map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => {
                                                if (onSelectCadWidth) onSelectCadWidth(w);
                                                setShowLineweightDropdown(false);
                                            }}
                                            className={`px-2 py-1 text-left text-xs rounded ${cadWidth === w ? 'bg-[#1677ff]/20 text-sky-400 font-bold' : 'hover:bg-[#2a2a2a] text-slate-300'}`}
                                        >
                                            {w} px
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* GROUP 6: VIEW & NAVIGATION CLUSTER */}
                    <div className="flex items-center bg-[#1c1c1c] border border-[#2d2d2d] rounded-md p-0.5 shadow-sm overflow-visible">
                        <button
                            onClick={() => onZoomFit?.()}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs text-slate-300 hover:text-white hover:bg-[#282828] transition"
                            title="Zoom Fit / Zoom Extents (Z+E)"
                        >
                            <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                            <span className="text-[11px]">Fit</span>
                        </button>

                        <div className="relative overflow-visible">
                            <button
                                onClick={() => {
                                    setShowViewDropdown(!showViewDropdown);
                                    setShowFileDropdown(false);
                                    setShowDrawDropdown(false);
                                    setShowModifyDropdown(false);
                                    setShowAnnotateDropdown(false);
                                    setShowLayerDropdown(false);
                                    setShowColorDropdown(false);
                                    setShowLineweightDropdown(false);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#282828] transition"
                                title="Zoom Options"
                            >
                                <ChevronDown className="w-2.5 h-2.5" />
                            </button>

                            {showViewDropdown && (
                                <div className="absolute top-full mt-1.5 left-0 z-50 bg-[#1a1a1a] border border-[#383838] rounded-md shadow-2xl p-1 flex flex-col gap-0.5 w-32">
                                    <button
                                        onClick={() => {
                                            onZoomIn?.();
                                            setShowViewDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Zoom In (+)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onZoomOut?.();
                                            setShowViewDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Zoom Out (-)</span>
                                    </button>
                                    <button
                                        onClick={() => {
                                            onZoomFit?.();
                                            setShowViewDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] text-slate-200 text-xs"
                                    >
                                        <Maximize2 className="w-3.5 h-3.5 text-sky-400" />
                                        <span>Zoom Extents</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="w-[1px] h-3.5 bg-[#303030] mx-0.5" />

                        <button
                            onClick={() => handleSetTool('pan')}
                            className={`p-1 rounded transition ${
                                currentTool === 'pan' ? 'bg-[#1677ff] text-white' : 'text-slate-300 hover:text-white hover:bg-[#282828]'
                            }`}
                            title="Pan Viewport (P / Spacebar Drag)"
                        >
                            <Hand className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* ────────────────────────────────────────────────────────── */}
            {/* 3. MAIN CAD VIEWPORT CANVAS (Dynamic Model / Paper Space)  */}
            {/* ────────────────────────────────────────────────────────── */}
            <div
                className="relative flex-1 w-full min-h-0 overflow-hidden transition-colors duration-300"
                style={{ backgroundColor: activeLayout !== 'model' ? tc.paperSpaceBg : tc.modelBg }}
                onMouseMove={handleCanvasMouseMove}
                onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const parentRect = e.currentTarget.getBoundingClientRect();
                    setCadContextMenu({
                        x: Math.min(e.clientX - parentRect.left, parentRect.width - 230),
                        y: Math.min(e.clientY - parentRect.top, parentRect.height - 200)
                    });
                }}
            >
                {/* Paper Space White Paper Sheet (Kertas Gambar Putih Asli AutoCAD) */}
                {activeLayout !== 'model' && (
                    <div className="absolute inset-4 md:inset-8 bg-white rounded-sm shadow-[0_15px_45px_rgba(0,0,0,0.65)] pointer-events-none z-0 border border-slate-300">
                        {/* Engineering Drawing Border */}
                        <div className="absolute inset-3 border-2 border-slate-900 flex flex-col justify-between p-1">
                            <div className="absolute inset-1 border border-slate-700 pointer-events-none" />
                            {/* Top Coordinate Reference */}
                            <div className="flex justify-between px-4 pt-0.5 text-[9px] font-mono font-bold text-slate-800">
                                <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span>
                            </div>

                            {/* Bottom Title Block (Kop Gambar CAD Klasik di Kertas Putih) */}
                            <div className="flex justify-end p-2 pointer-events-auto">
                                <div className="bg-white border-2 border-slate-900 p-2.5 text-slate-900 text-[11px] shadow-sm min-w-[300px] font-sans">
                                    <div className="flex justify-between items-center border-b border-slate-900 pb-1 mb-1.5 font-bold">
                                        <span className="text-slate-900 tracking-wider text-xs font-mono font-extrabold">MAVI ENGINEERING & MES</span>
                                        <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-500 px-1.5 py-0.5 rounded font-mono font-bold">APPROVED</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-slate-800 font-mono">
                                        <div>PROYEK: <span className="font-bold text-slate-900">MAVI Core CAD</span></div>
                                        <div>SKALA: <span className="font-bold text-slate-900">1:1 ({paperSize})</span></div>
                                        <div>LEMBAR: <span className="font-bold text-slate-900">{activeLayoutTab.label}</span></div>
                                        <div>TANGGAL: <span className="font-bold text-slate-900">{new Date().toISOString().split('T')[0]}</span></div>
                                    </div>
                                    <div className="border-t border-slate-900 mt-1.5 pt-1 text-[9px] text-slate-600 font-mono">
                                        DOKUMEN: {documentTitle || 'drawing-template'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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

                {/* CAD Right-Click Quick Actions Context Menu */}
                {cadContextMenu && (
                    <>
                        <div
                            className="fixed inset-0 z-[990] bg-transparent"
                            onClick={() => setCadContextMenu(null)}
                            onContextMenu={(e) => { e.preventDefault(); setCadContextMenu(null); }}
                        />
                        <div
                            className="absolute z-[1000] bg-[#141414]/95 border border-[#333333] shadow-2xl rounded-lg p-1.5 flex flex-col gap-1 min-w-[215px] text-xs backdrop-blur-md"
                            style={{ top: `${cadContextMenu.y}px`, left: `${cadContextMenu.x}px` }}
                        >
                            {/* Header */}
                            <div className="px-2 py-1 border-b border-[#262626] flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                <span>CAD ACTIONS</span>
                                <span className="text-sky-400 font-semibold uppercase">{currentTool || 'SELECT'}</span>
                            </div>

                            {/* 3. End Point (Akhiri Garis / Polyline) */}
                            <button
                                onClick={() => {
                                    handleSetTool('select');
                                    toast.success('🏁 Garis / Polyline berhasil diakhiri (End Point).');
                                    setCadContextMenu(null);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-left bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 font-bold transition"
                            >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>🏁 3. End Point (Akhiri Garis / Polyline)</span>
                            </button>

                            {/* 1. Copy (Duplikasi Objek) */}
                            <button
                                onClick={() => {
                                    handleSetTool('copy');
                                    onSelectCadTool?.('copy');
                                    toast.info('📋 Mode Copy aktif: Klik objek untuk menduplikasi.');
                                    setCadContextMenu(null);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-left hover:bg-[#282828] text-amber-300 font-semibold transition"
                            >
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                <span>📋 1. Copy (Duplikasi Objek)</span>
                            </button>

                            {/* 2. Delete (Hapus Objek) */}
                            <button
                                onClick={() => {
                                    handleSetTool('erase');
                                    onSelectCadTool?.('erase');
                                    toast.info('🗑️ Mode Delete aktif: Klik objek atau garis untuk menghapus.');
                                    setCadContextMenu(null);
                                }}
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded text-left hover:bg-rose-950/40 text-rose-300 font-semibold transition"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>🗑️ 2. Delete (Hapus Objek / Garis)</span>
                            </button>

                            <div className="w-full h-[1px] bg-[#262626] my-0.5" />

                            {/* Batal / Esc */}
                            <button
                                onClick={() => {
                                    handleSetTool('select');
                                    setCadContextMenu(null);
                                }}
                                className="flex items-center justify-center py-1 rounded text-slate-400 hover:text-white hover:bg-[#282828] text-[11px] transition"
                            >
                                Tutup Menu (Esc)
                            </button>
                        </div>
                    </>
                )}

                {/* Paper Space Layout Sheet Frame & Title Block (When in Layout Space) */}
                {activeLayout !== 'model' && (
                    <>
                        {/* Top Indicator & Paper Size Switcher */}
                        <div className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-[#0f172a]/90 border border-sky-500/40 px-3 py-1 rounded-md text-xs text-sky-300 font-medium backdrop-blur shadow-xl select-none">
                            <FileText className="w-3.5 h-3.5 text-sky-400" />
                            <span>Paper Space: <strong>{activeLayoutTab.label}</strong> ({paperSize} Sheet)</span>
                            <span className="text-[10px] text-slate-400">| Scale 1:1</span>
                            <div className="flex items-center gap-1 ml-2 border-l border-slate-700 pl-2">
                                {['A4', 'A3', 'A2', 'A1'].map(sz => (
                                    <button
                                        key={sz}
                                        onClick={() => {
                                            setPaperSize(sz);
                                            setLayoutTabs(prev => prev.map(t => t.id === activeLayoutTab.id ? { ...t, paperSize: sz } : t));
                                            toast.success(`Ukuran kertas lembar "${activeLayoutTab.label}" diubah ke ${sz}`);
                                        }}
                                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                                            paperSize === sz ? 'bg-sky-500 text-white font-bold' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                        }`}
                                    >
                                        {sz}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* AutoCAD UCS Coordinate Triad Fixed at Viewport Bottom-Left */}
                <div className="absolute bottom-3 left-4 z-20 pointer-events-none select-none">
                    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Y Axis Arrow */}
                        <line x1="8" y1="36" x2="8" y2="10" stroke={tc.ucsY} strokeWidth="2.5" />
                        <polygon points="8,4 4,12 12,12" fill={tc.ucsY} />
                        <text x="13" y="14" fill={tc.ucsY} fontSize="12" fontWeight="bold" fontFamily="monospace">Y</text>
                        
                        {/* X Axis Arrow */}
                        <line x1="8" y1="36" x2="34" y2="36" stroke={tc.ucsX} strokeWidth="2.5" />
                        <polygon points="40,36 32,32 32,40" fill={tc.ucsX} />
                        <text x="32" y="29" fill={tc.ucsX} fontSize="12" fontWeight="bold" fontFamily="monospace">X</text>
                        
                        {/* Origin Square Box */}
                        <rect x="5" y="33" width="6" height="6" fill={tc.ucsOrigin} stroke="#1f2937" strokeWidth="1" />
                    </svg>
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
                        className="flex items-center gap-2 px-3 py-1.5 rounded shadow-2xl text-xs font-mono min-w-[360px]"
                        style={{ backgroundColor: tc.commandBg + 'f2', borderWidth: '1px', borderStyle: 'solid', borderColor: tc.commandBorder, color: tc.commandText }}
                    >
                        <span className="text-sky-400 font-bold flex items-center gap-1">
                            &gt;
                        </span>
                        <input
                            name="cmd"
                            type="text"
                            placeholder={getCommandPromptText(currentTool)}
                            className="bg-transparent border-none outline-none text-xs font-mono flex-1"
                            style={{ color: tc.commandText, '--tw-placeholder-opacity': '0.5' }}
                        />
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-sans" style={{ backgroundColor: tc.commandBg, borderWidth: '1px', borderStyle: 'solid', borderColor: tc.commandBorder, color: tc.statusText }}>
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
            <div className="flex items-center justify-between text-xs z-30 shrink-0 select-none h-7 transition-colors duration-300" style={{ backgroundColor: tc.statusBg, borderTop: `1px solid ${tc.statusBorder}` }}>
                
                {/* Exact 1:1 Left: Model, Layout 1, Layout 2, + Layout Switcher */}
                <div className="flex items-stretch h-full relative">
                    {layoutTabs.map((tab) => {
                        const isActive = tab.active;
                        const isEditing = editingTabId === tab.id;
                        return (
                            <div
                                key={tab.id}
                                className={`flex items-center text-xs transition border-r border-[#2a2a2a] ${
                                    isActive
                                        ? 'bg-[#1677ff] text-white font-medium shadow-sm'
                                        : 'bg-[#181818] text-slate-400 hover:text-slate-200 hover:bg-[#222222]'
                                }`}
                                onContextMenu={(e) => {
                                    e.preventDefault();
                                    setTabContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id });
                                }}
                            >
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editingTabLabel}
                                        onChange={(e) => setEditingTabLabel(e.target.value)}
                                        onBlur={() => handleRenameTab(tab.id, editingTabLabel)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleRenameTab(tab.id, editingTabLabel);
                                            if (e.key === 'Escape') setEditingTabId(null);
                                        }}
                                        autoFocus
                                        className="w-20 px-1 py-0 bg-[#000000] text-white text-xs font-medium border border-sky-400 outline-none rounded-none text-center"
                                    />
                                ) : (
                                    <button
                                        onClick={() => handleSelectLayout(tab.id)}
                                        onDoubleClick={() => {
                                            if (tab.id !== 'model') {
                                                setEditingTabId(tab.id);
                                                setEditingTabLabel(tab.label);
                                            }
                                        }}
                                        className="px-3 h-full flex items-center gap-1.5 focus:outline-none"
                                        title={`Double click to rename, Right click for options`}
                                    >
                                        {tab.id !== 'model' && <FileText className="w-3 h-3 opacity-70" />}
                                        <span>{tab.label}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    <button
                        onClick={handleAddLayout}
                        className="px-2.5 flex items-center text-slate-400 hover:text-white hover:bg-[#252525] border-r border-[#2a2a2a] transition"
                        title="New Paper Space Layout Sheet (+)"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Tab Context Menu */}
                    {tabContextMenu && (
                        <div
                            className="fixed z-50 bg-[#1e1e1e] border border-[#383838] rounded-md shadow-2xl py-1 w-44 text-xs text-slate-200"
                            style={{ left: Math.min(window.innerWidth - 180, tabContextMenu.x), top: Math.max(10, tabContextMenu.y - 120) }}
                            onMouseLeave={() => setTabContextMenu(null)}
                        >
                            <button
                                onClick={() => {
                                    const target = layoutTabs.find(t => t.id === tabContextMenu.tabId);
                                    setEditingTabId(tabContextMenu.tabId);
                                    setEditingTabLabel(target?.label || '');
                                    setTabContextMenu(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] flex items-center gap-2"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-sky-400" />
                                <span>Ubah Nama (Rename)</span>
                            </button>
                            <button
                                onClick={() => {
                                    handleDuplicateTab(tabContextMenu.tabId);
                                    setTabContextMenu(null);
                                }}
                                className="w-full px-3 py-1.5 text-left hover:bg-[#2c2c2c] flex items-center gap-2"
                            >
                                <Copy className="w-3.5 h-3.5 text-amber-400" />
                                <span>Duplikasi Lembar</span>
                            </button>
                            {tabContextMenu.tabId !== 'model' && (
                                <button
                                    onClick={() => {
                                        handleDeleteTab(tabContextMenu.tabId);
                                        setTabContextMenu(null);
                                    }}
                                    className="w-full px-3 py-1.5 text-left hover:bg-rose-950/40 text-rose-400 flex items-center gap-2 border-t border-[#2a2a2a]"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus Lembar</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Exact 1:1 Right: Real-time Coordinates & AutoCAD Status Buttons */}
                <div className="flex items-center gap-2 pr-2 text-xs" style={{ color: tc.statusText }}>
                    
                    {/* Live Coordinates: "2104.7656, 2301.5848" */}
                    <span className="font-mono text-[11px] px-2 py-0.5 tracking-tight" style={{ color: tc.coordText }}>
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

                    {/* Canvas Theme Cycle: dark → blueprint → white */}
                    <button
                        onClick={() => {
                            const themeOrder = ['dark', 'blueprint', 'white'];
                            const themeLabels = { dark: '⬛ Dark (Black)', blueprint: '📐 Blueprint (Blue)', white: '⬜ White (Light)' };
                            const idx = themeOrder.indexOf(canvasTheme);
                            const next = themeOrder[(idx + 1) % themeOrder.length];
                            if (onCanvasThemeChange) onCanvasThemeChange(next);
                            toast.success(`Canvas Theme: ${themeLabels[next]}`);
                        }}
                        className={`p-1 rounded transition flex items-center gap-1 ${canvasTheme === 'blueprint' ? 'text-sky-400 bg-sky-500/20' : canvasTheme === 'white' ? 'text-amber-400 bg-amber-500/15' : 'hover:text-white'}`}
                        title={`Canvas Theme: ${canvasTheme.charAt(0).toUpperCase() + canvasTheme.slice(1)} (Click to cycle: Dark → Blueprint → White)`}
                    >
                        {canvasTheme === 'blueprint' ? <Compass className="w-3.5 h-3.5" /> : canvasTheme === 'white' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
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
                <div className="absolute top-20 right-4 z-40 w-84 bg-[#141820]/95 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl p-3.5 flex flex-col gap-2.5 select-none animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-[#2a303c]">
                        <span className="text-xs font-bold text-white flex items-center gap-2">
                            <Bot className="w-4 h-4 text-cyan-400" />
                            CAD AI Drawing Copilot
                            <span className="text-[9px] bg-cyan-950/70 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded font-normal">Active</span>
                        </span>
                        <button
                            onClick={() => setShowAiAgentPanel(false)}
                            className="text-slate-400 hover:text-white p-1 rounded hover:bg-[#202735] transition"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="h-64 overflow-y-auto flex flex-col gap-2 p-1 text-xs custom-scrollbar">
                        {aiAgentMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`p-2.5 rounded-lg text-xs leading-relaxed transition ${
                                    msg.sender === 'user'
                                        ? 'bg-[#1677ff]/25 border border-sky-500/30 text-sky-100 ml-4 self-end'
                                        : 'bg-[#1c2230] border border-[#2a3245] text-slate-200 mr-4 self-start'
                                }`}
                            >
                                <div className="text-[10px] text-slate-400 font-bold mb-1 flex items-center gap-1">
                                    {msg.sender === 'user' ? (
                                        <span className="text-sky-400">👤 User</span>
                                    ) : (
                                        <span className="text-cyan-400 flex items-center gap-1">
                                            <Bot className="w-3 h-3" /> CAD AI Copilot
                                        </span>
                                    )}
                                </div>
                                <div className="whitespace-pre-wrap">{msg.text}</div>
                            </div>
                        ))}
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar text-[10px]">
                        {[
                            '⭕ Buat Lingkaran',
                            '⬛ Buat Kotak',
                            '🎈 Balon QC',
                            '📏 Garis',
                            '💬 Callout',
                            '🔍 Zoom Fit'
                        ].map((chip) => (
                            <button
                                key={chip}
                                onClick={() => {
                                    setAiAgentMessages(prev => [...prev, { sender: 'user', text: chip }]);
                                    setTimeout(() => {
                                        const cleanPrompt = chip.replace(/^[^\w\s]+/, '').trim();
                                        const p = cleanPrompt.toLowerCase();
                                        let botResponse = '';

                                        if (p.includes('lingkaran')) {
                                            if (onAiCreateShape) {
                                                onAiCreateShape({ type: 'circle', cx: 300, cy: 220, r: 50, color: cadColor || '#38bdf8' });
                                                botResponse = '⭕ Lingkaran (Radius 50px) berhasil digenerate langsung ke kanvas!';
                                            } else {
                                                handleSetTool('circle');
                                                botResponse = '⭕ Mode Lingkaran (CIRCLE) aktif.';
                                            }
                                        } else if (p.includes('kotak')) {
                                            if (onAiCreateShape) {
                                                onAiCreateShape({ type: 'rect', x: 230, y: 170, w: 140, h: 90, color: cadColor || '#38bdf8' });
                                                botResponse = '⬛ Kotak Persegi Panjang (140x90px) berhasil digenerate langsung ke kanvas!';
                                            } else {
                                                handleSetTool('rect');
                                                botResponse = '⬛ Mode Kotak (RECTANGLE) aktif.';
                                            }
                                        } else if (p.includes('balon')) {
                                            if (onAiCreateDimension) {
                                                onAiCreateDimension({ label: 'Balon QC AI', spec: '25.00', indicatorType: 'balloon', x1: 280, y1: 200, lx: 320, ly: 150 });
                                                botResponse = '🎈 Balon Inspeksi QC (#AI) berhasil disematkan langsung ke kanvas!';
                                            } else {
                                                handleSetTool('balloon');
                                                setIsBalloonMode(true);
                                                botResponse = '🎈 Mode Balon Inspeksi aktif.';
                                            }
                                        } else if (p.includes('garis')) {
                                            if (onAiCreateShape) {
                                                onAiCreateShape({ type: 'line', x1: 180, y1: 220, x2: 380, y2: 220, color: cadColor || '#38bdf8' });
                                                botResponse = '📏 Garis Linier (200px) berhasil digenerate langsung ke kanvas!';
                                            } else {
                                                handleSetTool('line');
                                                botResponse = '📏 Mode Garis (LINE) aktif.';
                                            }
                                        } else if (p.includes('callout')) {
                                            if (onAiCreateShape) {
                                                onAiCreateShape({ type: 'callout', targetX: 250, targetY: 230, boxX: 320, boxY: 170, text: 'CATATAN QC (AI)', color: '#ef4444' });
                                                botResponse = '💬 Anotasi Callout berhasil ditempatkan langsung pada kanvas!';
                                            } else {
                                                handleSetTool('callout');
                                                botResponse = '💬 Mode Callout aktif.';
                                            }
                                        } else if (p.includes('zoom')) {
                                            if (onZoomFit) onZoomFit();
                                            botResponse = '🔍 Viewport CAD disesuaikan ke ukuran optimal (Zoom Fit).';
                                        }

                                        setAiAgentMessages(prev => [
                                            ...prev,
                                            { sender: 'bot', text: botResponse }
                                        ]);
                                    }, 200);
                                }}
                                className="px-2 py-0.5 bg-[#1f2738] hover:bg-cyan-950/60 hover:text-cyan-300 text-slate-300 rounded border border-[#2e394e] shrink-0 transition"
                            >
                                {chip}
                            </button>
                        ))}
                    </div>

                    {/* Input & Submit Form */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            if (!aiPromptInput.trim()) return;
                            const prompt = aiPromptInput.trim();
                            const p = prompt.toLowerCase();
                            setAiAgentMessages(prev => [...prev, { sender: 'user', text: prompt }]);
                            setAiPromptInput('');

                            setTimeout(() => {
                                let botResponse = '';

                                // Extract any radius number
                                const radMatch = p.match(/(?:radius|r|diameter|d|ukuran|size)\s*[:=]?\s*(\d+)/i) || p.match(/(\d+)\s*(?:px|mm|radius|r)/i);
                                const radiusVal = radMatch ? parseInt(radMatch[1], 10) : 50;

                                // Extract dimensions (e.g. 100x80 or 100 x 80)
                                const dimMatch = p.match(/(\d+)\s*[xX*]\s*(\d+)/);
                                const rectW = dimMatch ? parseInt(dimMatch[1], 10) : 140;
                                const rectH = dimMatch ? parseInt(dimMatch[2], 10) : 90;

                                if (p.includes('lingkaran') || p.includes('circle') || p.includes('bulat')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'circle', cx: 300, cy: 220, r: radiusVal, color: cadColor || '#38bdf8' });
                                        botResponse = `⭕ Lingkaran (Radius: ${radiusVal}px, Center: 300, 220) berhasil digenerate langsung ke kanvas!`;
                                    } else {
                                        handleSetTool('circle');
                                        botResponse = '⭕ Mode Lingkaran (CIRCLE) diaktifkan. Klik pada kanvas untuk menentukan titik pusat dan radius lingkaran.';
                                    }
                                } else if (p.includes('kotak') || p.includes('persegi') || p.includes('rectangle') || p.includes('rect') || p.includes('box')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'rect', x: 230, y: 170, w: rectW, h: rectH, color: cadColor || '#38bdf8' });
                                        botResponse = `⬛ Kotak Persegi Panjang (${rectW}x${rectH}px) berhasil digenerate langsung ke kanvas!`;
                                    } else {
                                        handleSetTool('rect');
                                        botResponse = '⬛ Mode Kotak / Persegi Panjang (RECTANGLE) diaktifkan.';
                                    }
                                } else if (p.includes('garis') || p.includes('line') || p.includes('lurus')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'line', x1: 180, y1: 220, x2: 380, y2: 220, color: cadColor || '#38bdf8' });
                                        botResponse = '📏 Garis Linier berhasil digenerate langsung ke kanvas!';
                                    } else {
                                        handleSetTool('line');
                                        botResponse = '📏 Mode Garis (LINE) diaktifkan. Klik titik awal dan titik akhir garis pada kanvas.';
                                    }
                                } else if (p.includes('polyline') || p.includes('pline') || p.includes('poligon') || p.includes('jalur')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({
                                            type: 'polyline',
                                            points: [{x: 180, y: 220}, {x: 280, y: 150}, {x: 380, y: 220}, {x: 280, y: 290}],
                                            color: cadColor || '#38bdf8'
                                        });
                                        botResponse = '📐 Kontur Polyline 4-titik berhasil digenerate langsung ke kanvas!';
                                    } else {
                                        handleSetTool('polyline');
                                        botResponse = '📐 Mode POLYLINE diaktifkan. Klik berurutan untuk membuat segmen kontur/pipa.';
                                    }
                                } else if (p.includes('balon') || p.includes('balloon') || p.includes('qc') || p.includes('inspeksi') || p.includes('bubble')) {
                                    if (onAiCreateDimension) {
                                        onAiCreateDimension({ label: 'Balon QC AI', spec: '25.00', indicatorType: 'balloon', x1: 280, y1: 200, lx: 320, ly: 150 });
                                        botResponse = '🎈 Balon Inspeksi QC (#AI) berhasil disematkan langsung ke kanvas!';
                                    } else {
                                        handleSetTool('balloon');
                                        setIsBalloonMode(true);
                                        botResponse = '🎈 Mode Balon Inspeksi QC diaktifkan.';
                                    }
                                } else if (p.includes('dimensi') || p.includes('dim') || p.includes('ukur') || p.includes('jarak') || p.includes('measure')) {
                                    if (onAiCreateDimension) {
                                        onAiCreateDimension({ label: 'Dimensi 50mm', spec: '50.00', indicatorType: 'dimension', x1: 180, y1: 200, x2: 320, y2: 200, lx: 250, ly: 160 });
                                        botResponse = '📏 Pengukuran Dimensi (50.00 mm) berhasil digenerate langsung ke kanvas!';
                                    } else {
                                        handleSetTool('dim_linear');
                                        botResponse = '📏 Mode Dimensi Linier diaktifkan.';
                                    }
                                } else if (p.includes('callout') || p.includes('anotasi') || p.includes('catatan')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'callout', targetX: 250, targetY: 230, boxX: 320, boxY: 170, text: 'CATATAN QC (AI)', color: '#ef4444' });
                                        botResponse = '💬 Anotasi Callout berhasil ditempatkan langsung pada kanvas!';
                                    } else {
                                        handleSetTool('callout');
                                        botResponse = '💬 Mode Callout Annotation diaktifkan.';
                                    }
                                } else if (p.includes('cloud') || p.includes('awan') || p.includes('revisi') || p.includes('revcloud')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'revcloud', x: 200, y: 150, w: 180, h: 120, color: '#ef4444' });
                                        botResponse = '☁️ Revision Cloud berhasil dibuat langsung pada kanvas!';
                                    } else {
                                        handleSetTool('revcloud');
                                        botResponse = '☁️ Mode Revision Cloud (REVCLOUD) diaktifkan.';
                                    }
                                } else if (p.includes('panah') || p.includes('arrow')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'arrow', x1: 180, y1: 220, x2: 340, y2: 220, color: '#ef4444' });
                                        botResponse = '➡️ Panah Penunjuk (Arrow) berhasil dibuat langsung pada kanvas!';
                                    } else {
                                        handleSetTool('arrow');
                                        botResponse = '➡️ Mode Arrow Pointer diaktifkan.';
                                    }
                                } else if (p.includes('stamp') || p.includes('stempel') || p.includes('approved')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'stamp', x: 280, y: 220, text: 'APPROVED', color: '#22c55e' });
                                        botResponse = '✅ Stempel APPROVED berhasil disematkan langsung pada kanvas!';
                                    } else {
                                        handleSetTool('stamp');
                                        botResponse = '✅ Mode Stempel APPROVED diaktifkan.';
                                    }
                                } else if (p.includes('teks') || p.includes('text') || p.includes('tulisan')) {
                                    if (onAiCreateShape) {
                                        onAiCreateShape({ type: 'text', x: 260, y: 220, text: 'CAD ANNOTATION', color: '#38bdf8', fontSize: 16 });
                                        botResponse = '🔤 Objek Teks berhasil ditambahkan langsung ke kanvas!';
                                    } else {
                                        handleSetTool('text');
                                        botResponse = '🔤 Mode Teks (TEXT) diaktifkan.';
                                    }
                                } else if (p.includes('merah') || p.includes('red')) {
                                    if (onSelectCadColor) onSelectCadColor('#ef4444');
                                    setReviewColor('#ef4444');
                                    botResponse = '🎨 Warna drafting aktif diubah menjadi MERAH (#ef4444).';
                                } else if (p.includes('hijau') || p.includes('green')) {
                                    if (onSelectCadColor) onSelectCadColor('#22c55e');
                                    setReviewColor('#22c55e');
                                    botResponse = '🎨 Warna drafting aktif diubah menjadi HIJAU (#22c55e).';
                                } else if (p.includes('biru') || p.includes('blue') || p.includes('cyan')) {
                                    if (onSelectCadColor) onSelectCadColor('#38bdf8');
                                    setReviewColor('#38bdf8');
                                    botResponse = '🎨 Warna drafting aktif diubah menjadi BIRU CYAN (#38bdf8).';
                                } else if (p.includes('kuning') || p.includes('yellow')) {
                                    if (onSelectCadColor) onSelectCadColor('#eab308');
                                    setReviewColor('#eab308');
                                    botResponse = '🎨 Warna drafting aktif diubah menjadi KUNING (#eab308).';
                                } else if (p.includes('zoom fit') || p.includes('fit') || p.includes('reset') || p.includes('tengah')) {
                                    if (onZoomFit) onZoomFit();
                                    botResponse = '🔍 Viewport CAD disesuaikan ke ukuran optimal (Zoom Fit).';
                                } else if (p.includes('zoom in') || p.includes('perbesar')) {
                                    if (onZoomIn) onZoomIn();
                                    botResponse = '🔍 Viewport diperbesar (Zoom In).';
                                } else if (p.includes('zoom out') || p.includes('perkecil')) {
                                    if (onZoomOut) onZoomOut();
                                    botResponse = '🔍 Viewport diperkecil (Zoom Out).';
                                } else if (p.includes('pan') || p.includes('geser')) {
                                    handleSetTool('pan');
                                    botResponse = '✋ Mode PAN diaktifkan. Klik dan geser mouse untuk menggeser kanvas.';
                                } else if (p.includes('select all') || p.includes('pilih semua')) {
                                    handleSetTool('select');
                                    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
                                    botResponse = '✨ Seluruh entitas CAD dipilih (Select All).';
                                } else if (p.includes('hapus') || p.includes('erase') || p.includes('delete') || p.includes('clear')) {
                                    handleSetTool('erase');
                                    botResponse = '🗑️ Mode ERASE diaktifkan. Klik objek atau tekan Delete untuk menghapus.';
                                } else if (p.includes('putar') || p.includes('rotate')) {
                                    handleSetTool('rotate');
                                    botResponse = '🔄 Mode ROTATE diaktifkan.';
                                } else if (p.includes('duplikat') || p.includes('copy') || p.includes('salin')) {
                                    handleSetTool('copy');
                                    botResponse = '📋 Mode COPY diaktifkan.';
                                } else if (p.includes('pindah') || p.includes('move')) {
                                    handleSetTool('move');
                                    botResponse = '📦 Mode MOVE diaktifkan.';
                                } else {
                                    executeCadCommand(p);
                                    botResponse = `Perintah CAD "${prompt.toUpperCase()}" dijalankan pada engine MLightCAD.`;
                                }

                                setAiAgentMessages(prev => [
                                    ...prev,
                                    { sender: 'bot', text: botResponse }
                                ]);
                            }, 250);
                        }}
                        className="flex items-center gap-1.5 mt-1"
                    >
                        <input
                            type="text"
                            value={aiPromptInput}
                            onChange={(e) => setAiPromptInput(e.target.value)}
                            placeholder="Ketik instruksi CAD atau pertanyaan..."
                            className="flex-1 bg-[#0f1218] border border-[#2a3245] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-cyan-500 transition"
                        />
                        <button
                            type="submit"
                            className="px-3 py-1.5 bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-cyan-500/25 transition"
                        >
                            Send
                        </button>
                    </form>
                </div>
            )}

        </div>
    );
}
