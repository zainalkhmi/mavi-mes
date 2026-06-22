import React, { useState, useEffect, useRef } from 'react';
import {
    Ruler,
    Upload,
    FileCode,
    Settings,
    CheckCircle,
    XCircle,
    Info,
    ArrowRight,
    Plus,
    Trash2,
    Database,
    Zap,
    Play,
    RefreshCw,
    Maximize2,
    Sliders,
    HelpCircle,
    ChevronDown,
    Circle,
    Triangle,
    CornerUpRight,
    Square,
    Crosshair,
    Cog,
    Copy,
    X,
    MousePointer,
    Slash,
    Type,
    Eraser,
    Magnet,
    Undo,
    Redo,
    Bell,
    OctagonX,
    ClipboardList,
    AlertTriangle,
    FileText,
    Globe,
    Power,
    ImagePlus,
    Move
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllDrawings, saveDrawing, deleteDrawing } from '../utils/supabaseUtilityDB';

// ─────────────────────────────────────────
// GD&T PARAMETER CATEGORY DEFINITIONS
// ─────────────────────────────────────────
const PARAM_CATEGORIES = [
    { key: 'dimension', label: 'Linear Dimension', labelId: 'Dimensi Linear', icon: '📏', color: '#3b82f6', symbol: '', defaultUnit: 'mm', defaultMeasure: 'linear_horizontal', defaultIndicator: 'horizontal' },
    { key: 'diameter',  label: 'Diameter',         labelId: 'Diameter',        icon: '⌀', color: '#8b5cf6', symbol: '⌀', defaultUnit: 'mm', defaultMeasure: 'diameter',         defaultIndicator: 'radial' },
    { key: 'radius',    label: 'Radius',           labelId: 'Radius',          icon: '⊕', color: '#06b6d4', symbol: 'R', defaultUnit: 'mm', defaultMeasure: 'radius',           defaultIndicator: 'radial' },
    { key: 'angle',     label: 'Angle',            labelId: 'Sudut',           icon: '∠', color: '#f59e0b', symbol: '∠', defaultUnit: '°',  defaultMeasure: 'angle',            defaultIndicator: 'arc' },
    { key: 'area',      label: 'Area',             labelId: 'Luas Area',       icon: '▢', color: '#10b981', symbol: '',  defaultUnit: 'mm²', defaultMeasure: 'area',            defaultIndicator: 'area_box' },
    { key: 'roughness', label: 'Surface Roughness', labelId: 'Kekasaran Permukaan', icon: '△', color: '#ef4444', symbol: 'Ra', defaultUnit: 'μm', defaultMeasure: 'surface_roughness', defaultIndicator: 'callout' },
    { key: 'custom',    label: 'Custom',           labelId: 'Kustom',          icon: '⚙', color: '#64748b', symbol: '',  defaultUnit: 'mm', defaultMeasure: 'custom',           defaultIndicator: 'callout' },
];

// ─────────────────────────────────────────
// FEATURE TRIGGER — ACTION & CONDITION DEFINITIONS
// ─────────────────────────────────────────
const TRIGGER_ACTIONS = [
    { key: 'NOTIFY_SUPERVISOR', label: 'Notifikasi Supervisor',   labelShort: 'Notify',    icon: '🔔', color: '#f59e0b', LucideIcon: Bell,           description: 'Kirim notifikasi ke supervisor / QC lead' },
    { key: 'STOP_MACHINE',      label: 'Stop Machine',            labelShort: 'Stop',      icon: '🛑', color: '#ef4444', LucideIcon: Power,          description: 'Perintah stop mesin (integrasi PLC/IoT)' },
    { key: 'CREATE_NCR',        label: 'Buat NCR',                labelShort: 'NCR',       icon: '📋', color: '#8b5cf6', LucideIcon: ClipboardList,  description: 'Buat Non-Conformance Report otomatis' },
    { key: 'ESCALATE_QUALITY',  label: 'Eskalasi Quality',        labelShort: 'Escalate',  icon: '⚠️', color: '#f97316', LucideIcon: AlertTriangle,  description: 'Eskalasi ke tim Quality Engineering' },
    { key: 'LOG_DEFECT',        label: 'Log Defect',              labelShort: 'Log',       icon: '📝', color: '#06b6d4', LucideIcon: FileText,       description: 'Catat defect ke tabel QMS database' },
    { key: 'REWORK_ORDER',      label: 'Rework Order',            labelShort: 'Rework',    icon: '🔄', color: '#10b981', LucideIcon: RefreshCw,      description: 'Buat work order rework otomatis' },
    { key: 'CUSTOM_WEBHOOK',    label: 'Custom Webhook',          labelShort: 'Webhook',   icon: '🌐', color: '#6366f1', LucideIcon: Globe,          description: 'Kirim data ke webhook URL kustom' },
];

const TRIGGER_CONDITIONS = [
    { key: 'ON_FAIL',          label: 'Saat FAIL (Out-of-Spec)',             description: 'Terpicu saat status = FAIL' },
    { key: 'ON_WARNING',       label: 'Saat Mendekati Batas (Warning)',      description: 'Terpicu saat dalam 10% dari batas toleransi' },
    { key: 'ON_PASS_TO_FAIL',  label: 'Saat Berubah PASS → FAIL',           description: 'Terpicu saat status berubah dari PASS ke FAIL' },
    { key: 'ALWAYS',           label: 'Setiap Nilai Baru',                  description: 'Selalu terpicu saat ada nilai baru' },
];

const generateTriggerId = () => `trig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const MEASURE_TYPE_OPTIONS = {
    dimension:  [{ value: 'linear_horizontal', label: 'Horizontal' }, { value: 'linear_vertical', label: 'Vertical' }],
    diameter:   [{ value: 'diameter', label: 'Outer Diameter' }, { value: 'inner_diameter', label: 'Inner Diameter' }],
    radius:     [{ value: 'radius', label: 'Outer Radius' }, { value: 'inner_radius', label: 'Inner Radius' }],
    angle:      [{ value: 'angle', label: 'Included Angle' }, { value: 'taper_angle', label: 'Taper Angle' }],
    area:       [{ value: 'area', label: 'Cross-Section Area' }, { value: 'surface_area', label: 'Surface Area' }],
    roughness:  [{ value: 'surface_roughness', label: 'Ra (Average)' }, { value: 'rz_roughness', label: 'Rz (Max Peak)' }],
    custom:     [{ value: 'custom', label: 'Custom Measurement' }],
};

const INDICATOR_TYPE_OPTIONS = {
    dimension:  [{ value: 'horizontal', label: 'Garis Horizontal' }, { value: 'vertical', label: 'Garis Vertikal' }],
    diameter:   [{ value: 'radial', label: 'Pointer / Radial' }],
    radius:     [{ value: 'radial', label: 'Pointer / Radial' }],
    angle:      [{ value: 'arc', label: 'Arc (Busur)' }],
    area:       [{ value: 'area_box', label: 'Area Box (Kotak)' }],
    roughness:  [{ value: 'callout', label: 'Callout Symbol' }],
    custom:     [{ value: 'callout', label: 'Callout Pointer' }, { value: 'horizontal', label: 'Garis Horizontal' }, { value: 'vertical', label: 'Garis Vertikal' }, { value: 'radial', label: 'Pointer Radial' }],
};

// Dynamic QMS variable suggestions per category
const QMS_VARIABLES_BY_CATEGORY = {
    dimension:  ['Meas_Length', 'Meas_Height', 'Meas_Width', 'Meas_Depth', 'Meas_Thickness', 'Stroke_Length_Actual'],
    diameter:   ['Meas_Diameter', 'Cylinder_Bore_Dia', 'Rod_Diameter_Spec', 'Outer_Dia', 'Inner_Dia'],
    radius:     ['Meas_Radius', 'Corner_Radius', 'Fillet_Radius', 'Inner_Radius'],
    angle:      ['Meas_Angle', 'Taper_Angle', 'Chamfer_Angle', 'Bevel_Angle', 'Inclination'],
    area:       ['Meas_Area', 'Cross_Section_Area', 'Surface_Area', 'Contact_Area'],
    roughness:  ['Meas_Ra', 'Meas_Rz', 'Surface_Roughness', 'Finish_Quality'],
    custom:     ['Custom_Param_1', 'Custom_Param_2'],
};

// ─────────────────────────────────────────
// MIGRATION: old type → new schema
// ─────────────────────────────────────────
function migrateDimension(dim) {
    // Already migrated
    if (dim.category) return dim;

    const oldType = dim.type || 'horizontal';
    let category = 'dimension';
    let measureType = 'linear_horizontal';
    let indicatorType = oldType;
    let gdt_symbol = '';

    if (oldType === 'horizontal') {
        category = 'dimension'; measureType = 'linear_horizontal'; indicatorType = 'horizontal';
    } else if (oldType === 'vertical') {
        category = 'dimension'; measureType = 'linear_vertical'; indicatorType = 'vertical';
    } else if (oldType === 'radial') {
        // Detect if it's a diameter or radius based on label/variable
        const lbl = (dim.label || '').toLowerCase();
        const varName = (dim.variable || '').toLowerCase();
        if (lbl.includes('diameter') || lbl.includes('dia') || varName.includes('diameter') || varName.includes('dia') || lbl.includes('bore')) {
            category = 'diameter'; measureType = 'diameter'; gdt_symbol = '⌀';
        } else if (lbl.includes('radius') || varName.includes('radius')) {
            category = 'radius'; measureType = 'radius'; gdt_symbol = 'R';
        } else {
            category = 'diameter'; measureType = 'diameter'; gdt_symbol = '⌀';
        }
        indicatorType = 'radial';
    }

    return {
        ...dim,
        category,
        measureType,
        indicatorType,
        gdt_symbol,
        cx: dim.cx ?? undefined,
        cy: dim.cy ?? undefined,
        angleStart: dim.angleStart ?? 0,
        angleEnd: dim.angleEnd ?? 90,
    };
}

function migrateDrawings(drawings) {
    return drawings.map(dwg => ({
        ...dwg,
        dimensions: (dwg.dimensions || []).map(migrateDimension),
        shapes: dwg.shapes || []
    }));
}

// ─────────────────────────────────────────
// DEFAULT DATA (already in new schema)
// ─────────────────────────────────────────
const DEFAULT_DRAWINGS = [
    {
        id: 'dwg_flange_connector',
        name: 'Flange Connector CAD Model',
        fileName: 'industrial-flange-rev2.dxf',
        fileType: 'DXF',
        uploadedAt: '2026-06-20T10:30:00Z',
        dimensions: [
            { id: 'dim_len', label: 'Overall Length (L)', spec: '120.0', tolMin: 119.5, tolMax: 120.5, variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 325, y1: 80, x2: 390, y2: 80, lx: 360, ly: 80, triggers: [] },
            { id: 'dim_dia', label: 'Flange Diameter (D)', spec: '80.0', tolMin: 79.8, tolMax: 80.2, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 30, y1: 100, x2: 30, y2: 260, lx: 30, ly: 180, triggers: [] },
            { id: 'dim_bore', label: 'Center Bore (B)', spec: '25.0', tolMin: 24.9, tolMax: 25.1, variable: 'Meas_Bore', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 135, y1: 165, x2: 95, y2: 115, lx: 75, ly: 115, triggers: [
                { id: 'trig_bore_1', type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Center Bore di luar toleransi! Mesin harus dihentikan.', enabled: true },
                { id: 'trig_bore_2', type: 'CREATE_NCR', condition: 'ON_FAIL', priority: 'high', message: 'NCR otomatis: Center Bore out-of-spec.', enabled: true },
            ] },
            { id: 'dim_angle_1', label: 'Chamfer Angle', spec: '45.0', tolMin: 44.0, tolMax: 46.0, variable: 'Meas_Angle', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 370, y1: 130, x2: 410, y2: 170, lx: 420, ly: 140, cx: 370, cy: 170, angleStart: -45, angleEnd: 0, triggers: [] },
            { id: 'dim_ra_1', label: 'Surface Finish Ra', spec: '1.6', tolMin: 0.0, tolMax: 3.2, variable: 'Meas_Ra', unit: 'μm', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 200, y1: 290, x2: 200, y2: 290, lx: 200, ly: 310, triggers: [] },
        ]
    },
    {
        id: 'dwg_hydraulic_cylinder',
        name: 'Hydraulic Cylinder Blueprint',
        fileName: 'hydraulic-cyl-assembly.pdf',
        fileType: 'PDF',
        uploadedAt: '2026-06-19T08:15:00Z',
        dimensions: [
            { id: 'hc_bore', label: 'Cylinder Bore', spec: '80.0', tolMin: 79.95, tolMax: 80.05, variable: 'Cylinder_Bore_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 50, y1: 100, x2: 50, y2: 220, lx: 30, ly: 160, triggers: [
                { id: 'trig_hcbore_1', type: 'NOTIFY_SUPERVISOR', condition: 'ON_FAIL', priority: 'high', message: 'Cylinder Bore di luar toleransi: nilai aktual melewati batas spec.', enabled: true },
                { id: 'trig_hcbore_2', type: 'ESCALATE_QUALITY', condition: 'ON_FAIL', priority: 'high', message: 'Eskalasi: Cylinder Bore memerlukan review Quality Engineering.', enabled: true },
            ] },
            { id: 'hc_rod', label: 'Rod Diameter', spec: '56.0', tolMin: 55.98, tolMax: 56.02, variable: 'Rod_Diameter_Spec', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 390, y1: 130, x2: 390, y2: 190, lx: 390, ly: 160, triggers: [] },
            { id: 'hc_stroke', label: 'Stroke Length', spec: '500.0', tolMin: 499.5, tolMax: 500.5, variable: 'Stroke_Length_Actual', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 60, y1: 240, x2: 280, y2: 240, lx: 170, ly: 240, triggers: [] },
            { id: 'hc_area', label: 'Piston Area', spec: '5026.5', tolMin: 5000.0, tolMax: 5050.0, variable: 'Meas_Area', unit: 'mm²', category: 'area', measureType: 'area', indicatorType: 'area_box', gdt_symbol: '', x1: 100, y1: 120, x2: 230, y2: 200, lx: 165, ly: 160, triggers: [] },
        ]
    }
];

// Helper to generate unique IDs outside render to avoid React purity rule warnings
const generateDimId = (categoryKey) => {
    return `dim_${categoryKey}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

export default function DrawingManager() {
    // Load and auto-migrate drawings
    const [drawings, setDrawings] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        if (saved) {
            try {
                return migrateDrawings(JSON.parse(saved));
            } catch { return migrateDrawings(DEFAULT_DRAWINGS); }
        }
        return migrateDrawings(DEFAULT_DRAWINGS);
    });

    // Fetch drawings from Supabase on mount
    useEffect(() => {
        const loadDwgFromDb = async () => {
            try {
                const dbDrawings = await getAllDrawings();
                if (dbDrawings && dbDrawings.length > 0) {
                    const migrated = migrateDrawings(dbDrawings);
                    setDrawings(migrated);
                    
                    // Sync active selected ID with database drawings
                    const savedActive = localStorage.getItem('mavi_selected_dwg_id');
                    if (savedActive && migrated.some(d => d.id === savedActive)) {
                        setSelectedDwgId(savedActive);
                    } else {
                        setSelectedDwgId(migrated[0].id);
                    }
                }
            } catch (err) {
                console.error('Failed to load drawings from database:', err);
            }
        };
        loadDwgFromDb();
    }, []);

    const [selectedDwgId, setSelectedDwgId] = useState(() => {
        const savedActive = localStorage.getItem('mavi_selected_dwg_id');
        if (savedActive && drawings.some(d => d.id === savedActive)) {
            return savedActive;
        }
        return drawings.length > 0 ? drawings[0].id : '';
    });
    const selectedDwg = drawings.find(d => d.id === selectedDwgId) || drawings[0];

    const [activeDimId, setActiveDimId] = useState(() => {
        const savedActive = localStorage.getItem('mavi_selected_dwg_id');
        const initialDwgId = (savedActive && drawings.some(d => d.id === savedActive))
            ? savedActive
            : (drawings.length > 0 ? drawings[0].id : '');
        const dwg = drawings.find(d => d.id === initialDwgId);
        return dwg?.dimensions?.length > 0 ? dwg.dimensions[0].id : '';
    });
    const activeDim = selectedDwg?.dimensions.find(dim => dim.id === activeDimId);

    // Edit properties
    const [editLabel, setEditLabel] = useState('');
    const [editSpec, setEditSpec] = useState('');
    const [editTolMin, setEditTolMin] = useState(0);
    const [editTolMax, setEditTolMax] = useState(0);
    const [editVariable, setEditVariable] = useState('');
    const [editUnit, setEditUnit] = useState('mm');
    const [editCategory, setEditCategory] = useState('dimension');
    const [editMeasureType, setEditMeasureType] = useState('linear_horizontal');
    const [editIndicatorType, setEditIndicatorType] = useState('horizontal');
    const [editGdtSymbol, setEditGdtSymbol] = useState('');
    const [editX1, setEditX1] = useState(150);
    const [editY1, setEditY1] = useState(180);
    const [editX2, setEditX2] = useState(350);
    const [editY2, setEditY2] = useState(180);
    const [editLx, setEditLx] = useState(250);
    const [editLy, setEditLy] = useState(200);
    const [editCx, setEditCx] = useState(250);
    const [editCy, setEditCy] = useState(180);
    const [editAngleStart, setEditAngleStart] = useState(0);
    const [editAngleEnd, setEditAngleEnd] = useState(90);
    const [editMarkerShape, setEditMarkerShape] = useState('default');
    const [editMarkerSize, setEditMarkerSize] = useState(60);

    // Simulation state: per-dimension values
    const [simValues, setSimValues] = useState({});
    // Track previous statuses for ON_PASS_TO_FAIL condition
    const [prevStatuses, setPrevStatuses] = useState({});
    // Track triggered actions for visual feedback
    const [triggeredActions, setTriggeredActions] = useState({});
    // Show trigger add picker
    const [showTriggerAddPicker, setShowTriggerAddPicker] = useState(false);
    const triggerAddPickerRef = useRef(null);

    // AutoCAD CAD Editor States
    const [cadTool, setCadTool] = useState('select'); // select, line, circle, rect, text, erase
    const [cadColor, setCadColor] = useState('#3b82f6');
    const [cadWidth, setCadWidth] = useState(2);
    const [gridSnap, setGridSnap] = useState(false);
    const [drawingShape, setDrawingShape] = useState(null);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [textInputPos, setTextInputPos] = useState(null); // { x, y, top, left }
    const [textInputValue, setTextInputValue] = useState('');
    const [zoom, setZoom] = useState(1.0);

    // UI states
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState(0);
    const [parseStatusText, setParseStatusText] = useState('');
    const [showAddPicker, setShowAddPicker] = useState(false);
    const [customVarMode, setCustomVarMode] = useState(false);
    const [showMgmtMenu, setShowMgmtMenu] = useState(false);
    const fileInputRef = useRef(null);
    const addPickerRef = useRef(null);
    const mgmtMenuRef = useRef(null);
    const fileSchemaRef = useRef(null);
    const imageInsertRef = useRef(null); // for image insertion into canvas
    const [dragImageShape, setDragImageShape] = useState(null); // image being dragged/resized on canvas
    const [selectedShapeId, setSelectedShapeId] = useState(null); // currently selected shape ID (e.g. image)

    // Clear selection on tool or drawing change
    useEffect(() => {
        setSelectedShapeId(null);
    }, [cadTool, selectedDwgId]);

    // Copilot AI state declarations
    const [copilotPrompt, setCopilotPrompt] = useState('');
    const [copilotLoading, setCopilotLoading] = useState(false);
    const [copilotProgress, setCopilotProgress] = useState(0);
    const [copilotLog, setCopilotLog] = useState('');

    // Close add picker and management menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (addPickerRef.current && !addPickerRef.current.contains(e.target)) {
                setShowAddPicker(false);
            }
            if (mgmtMenuRef.current && !mgmtMenuRef.current.contains(e.target)) {
                setShowMgmtMenu(false);
            }
            if (triggerAddPickerRef.current && !triggerAddPickerRef.current.contains(e.target)) {
                setShowTriggerAddPicker(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // Interactive mouse wheel zoom support
    useEffect(() => {
        const svgEl = svgRef.current;
        if (!svgEl) return;

        const handleWheel = (e) => {
            e.preventDefault();
            const zoomFactor = 0.1;
            if (e.deltaY < 0) {
                // Zoom In
                setZoom(z => Math.min(3.0, Math.round((z + zoomFactor) * 10) / 10));
            } else {
                // Zoom Out
                setZoom(z => Math.max(0.5, Math.round((z - zoomFactor) * 10) / 10));
            }
        };

        svgEl.addEventListener('wheel', handleWheel, { passive: false });
        return () => {
            svgEl.removeEventListener('wheel', handleWheel);
        };
    }, []);

    // Sync form values with active dimension
    useEffect(() => {
        if (activeDim) {
            setEditLabel(activeDim.label || '');
            setEditSpec(activeDim.spec || '');
            setEditTolMin(activeDim.tolMin || 0);
            setEditTolMax(activeDim.tolMax || 0);
            setEditVariable(activeDim.variable || '');
            setEditUnit(activeDim.unit || 'mm');
            setEditCategory(activeDim.category || 'dimension');
            setEditMeasureType(activeDim.measureType || 'linear_horizontal');
            setEditIndicatorType(activeDim.indicatorType || 'horizontal');
            setEditGdtSymbol(activeDim.gdt_symbol || '');
            setEditX1(activeDim.x1 !== undefined ? activeDim.x1 : 150);
            setEditY1(activeDim.y1 !== undefined ? activeDim.y1 : 180);
            setEditX2(activeDim.x2 !== undefined ? activeDim.x2 : 350);
            setEditY2(activeDim.y2 !== undefined ? activeDim.y2 : 180);
            setEditLx(activeDim.lx !== undefined ? activeDim.lx : 250);
            setEditLy(activeDim.ly !== undefined ? activeDim.ly : 200);
            setEditCx(activeDim.cx !== undefined ? activeDim.cx : 250);
            setEditCy(activeDim.cy !== undefined ? activeDim.cy : 180);
            setEditAngleStart(activeDim.angleStart !== undefined ? activeDim.angleStart : 0);
            setEditAngleEnd(activeDim.angleEnd !== undefined ? activeDim.angleEnd : 90);
            setEditMarkerShape(activeDim.markerShape || 'default');
            setEditMarkerSize(activeDim.markerSize !== undefined ? activeDim.markerSize : 60);
            setCustomVarMode(false);

            // Check if current variable is in the suggested list
            const catDef = PARAM_CATEGORIES.find(c => c.key === (activeDim.category || 'dimension'));
            const suggestions = QMS_VARIABLES_BY_CATEGORY[catDef?.key || 'dimension'] || [];
            if (activeDim.variable && !suggestions.includes(activeDim.variable)) {
                setCustomVarMode(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeDimId, selectedDwgId]);

    // Save drawings to localStorage
    useEffect(() => {
        localStorage.setItem('mavi_drawings', JSON.stringify(drawings));
    }, [drawings]);

    // Save selected blueprint selection to localStorage for cross-dashboard syncing
    useEffect(() => {
        if (selectedDwg?.id) {
            localStorage.setItem('mavi_selected_dwg_id', selectedDwg.id);
            if (selectedDwgId !== selectedDwg.id) {
                setSelectedDwgId(selectedDwg.id);
            }
        }
    }, [selectedDwg, selectedDwgId]);

    // Validation helpers
    const getValidationStatus = (val, min, max) => {
        const floatVal = parseFloat(val);
        if (isNaN(floatVal) || floatVal === 0) return 'PENDING';
        return (floatVal >= min && floatVal <= max) ? 'PASS' : 'FAIL';
    };

    const getStatusColor = (status, isActive) => {
        if (status === 'PASS') return '#10b981';
        if (status === 'FAIL') return '#ef4444';
        return isActive ? '#3b82f6' : '#64748b';
    };

    const getCategoryDef = (key) => PARAM_CATEGORIES.find(c => c.key === key) || PARAM_CATEGORIES[0];
    const getCategoryColor = (key) => getCategoryDef(key).color;

    // ─── Update dimension property ───
    const updateActiveDimProp = (field, value) => {
        if (!activeDim) return;

        const setters = {
            label: setEditLabel, spec: setEditSpec, tolMin: setEditTolMin, tolMax: setEditTolMax,
            variable: setEditVariable, unit: setEditUnit, category: setEditCategory,
            measureType: setEditMeasureType, indicatorType: setEditIndicatorType, gdt_symbol: setEditGdtSymbol,
            x1: setEditX1, y1: setEditY1, x2: setEditX2, y2: setEditY2,
            lx: setEditLx, ly: setEditLy, cx: setEditCx, cy: setEditCy,
            angleStart: setEditAngleStart, angleEnd: setEditAngleEnd,
            markerShape: setEditMarkerShape, markerSize: setEditMarkerSize,
        };
        if (setters[field]) setters[field](value);

        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    let parsedVal = value;
                    if (['x1', 'y1', 'x2', 'y2', 'lx', 'ly', 'cx', 'cy', 'markerSize'].includes(field)) {
                        parsedVal = parseInt(value) || 0;
                    } else if (['tolMin', 'tolMax', 'angleStart', 'angleEnd'].includes(field)) {
                        parsedVal = parseFloat(value) || 0;
                    }
                    return { ...dim, [field]: parsedVal };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
    };

    // Handle category change — update dependent defaults
    const handleCategoryChange = (newCategory) => {
        const catDef = getCategoryDef(newCategory);
        updateActiveDimProp('category', newCategory);

        // Update dependent fields
        setTimeout(() => {
            updateActiveDimProp('measureType', catDef.defaultMeasure);
            updateActiveDimProp('indicatorType', catDef.defaultIndicator);
            updateActiveDimProp('unit', catDef.defaultUnit);
            updateActiveDimProp('gdt_symbol', catDef.symbol);
        }, 0);
    };

    const handleSaveMapping = async () => {
        if (!activeDim) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return {
                        ...dim,
                        label: editLabel, spec: editSpec, tolMin: parseFloat(editTolMin), tolMax: parseFloat(editTolMax),
                        variable: editVariable, unit: editUnit, category: editCategory, measureType: editMeasureType,
                        indicatorType: editIndicatorType, gdt_symbol: editGdtSymbol,
                        x1: parseInt(editX1), y1: parseInt(editY1), x2: parseInt(editX2), y2: parseInt(editY2),
                        lx: parseInt(editLx), ly: parseInt(editLy), cx: parseInt(editCx), cy: parseInt(editCy),
                        angleStart: parseFloat(editAngleStart), angleEnd: parseFloat(editAngleEnd),
                        markerShape: editMarkerShape,
                        markerSize: parseInt(editMarkerSize) || 60,
                    };
                }
                return dim;
            })
        };

        try {
            const saved = await saveDrawing(updatedDwg);
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? saved : d));
            toast.success(`Parameter "${editLabel}" berhasil disimpan ke database.`);
        } catch (err) {
            console.error('Failed to save drawing mapping:', err);
            toast.error('Gagal menyimpan ke database, disimpan secara lokal.');
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        }
    };

    // ─── Add new dimension by category ───
    const handleAddDimension = (categoryKey) => {
        if (!selectedDwg) {
            toast.error('Pilih gambar blueprint terlebih dahulu.');
            return;
        }
        const catDef = getCategoryDef(categoryKey);
        const newDimId = generateDimId(categoryKey);

        const defaultSpecs = {
            dimension: { spec: '10.0', tolMin: 9.5, tolMax: 10.5 },
            diameter:  { spec: '25.0', tolMin: 24.9, tolMax: 25.1 },
            radius:    { spec: '12.5', tolMin: 12.3, tolMax: 12.7 },
            angle:     { spec: '90.0', tolMin: 89.0, tolMax: 91.0 },
            area:      { spec: '100.0', tolMin: 95.0, tolMax: 105.0 },
            roughness: { spec: '1.6', tolMin: 0.0, tolMax: 3.2 },
            custom:    { spec: '0.0', tolMin: 0.0, tolMax: 0.0 },
        };

        const specs = defaultSpecs[categoryKey] || defaultSpecs.custom;
        const suggestedVars = QMS_VARIABLES_BY_CATEGORY[categoryKey] || [];

        const newDim = {
            id: newDimId,
            label: `${catDef.labelId} Baru`,
            spec: specs.spec,
            tolMin: specs.tolMin,
            tolMax: specs.tolMax,
            variable: suggestedVars[0] || '',
            unit: catDef.defaultUnit,
            category: categoryKey,
            measureType: catDef.defaultMeasure,
            indicatorType: catDef.defaultIndicator,
            gdt_symbol: catDef.symbol,
            x1: 150, y1: 180, x2: 350, y2: 180, lx: 250, ly: 200,
            cx: 250, cy: 180, angleStart: 0, angleEnd: 90,
            markerShape: 'default',
            markerSize: 60,
            triggers: [],
        };

        const updatedDwg = { ...selectedDwg, dimensions: [...selectedDwg.dimensions, newDim] };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        setActiveDimId(newDimId);
        setShowAddPicker(false);
        toast.success(`Parameter ${catDef.label} berhasil ditambahkan.`);
    };

    const handleDeleteDimension = (dimId) => {
        if (!selectedDwg) return;
        const updatedDwg = { ...selectedDwg, dimensions: selectedDwg.dimensions.filter(dim => dim.id !== dimId) };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        if (activeDimId === dimId) {
            setActiveDimId(updatedDwg.dimensions.length > 0 ? updatedDwg.dimensions[0].id : '');
        }
        toast.success('Parameter berhasil dihapus.');
    };

    // ─── Trigger Management Handlers ───
    const handleAddTrigger = (actionKey) => {
        if (!activeDim || !selectedDwg) return;
        const actionDef = TRIGGER_ACTIONS.find(a => a.key === actionKey);
        const newTrigger = {
            id: generateTriggerId(),
            type: actionKey,
            condition: 'ON_FAIL',
            priority: 'high',
            message: `${activeDim.label} di luar toleransi: nilai aktual melewati batas spec (${activeDim.tolMin}–${activeDim.tolMax} ${activeDim.unit}).`,
            enabled: true,
        };
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return { ...dim, triggers: [...(dim.triggers || []), newTrigger] };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        setShowTriggerAddPicker(false);
        toast.success(`Trigger "${actionDef?.label}" ditambahkan ke ${activeDim.label}.`);
    };

    const handleDeleteTrigger = (triggerId) => {
        if (!activeDim || !selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return { ...dim, triggers: (dim.triggers || []).filter(t => t.id !== triggerId) };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        toast.success('Trigger berhasil dihapus.');
    };

    const handleUpdateTrigger = (triggerId, field, value) => {
        if (!activeDim || !selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return {
                        ...dim,
                        triggers: (dim.triggers || []).map(t => {
                            if (t.id === triggerId) return { ...t, [field]: value };
                            return t;
                        })
                    };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
    };

    const handleToggleTrigger = (triggerId) => {
        if (!activeDim || !selectedDwg) return;
        const trigger = (activeDim.triggers || []).find(t => t.id === triggerId);
        if (trigger) handleUpdateTrigger(triggerId, 'enabled', !trigger.enabled);
    };

    // ─── Trigger Execution Logic ───
    const getWarningStatus = (val, min, max) => {
        const floatVal = parseFloat(val);
        if (isNaN(floatVal) || floatVal === 0) return false;
        const range = max - min;
        const warningThreshold = range * 0.1;
        return (floatVal >= min && floatVal < min + warningThreshold) || (floatVal <= max && floatVal > max - warningThreshold);
    };

    const executeTriggers = (dim, newValue, oldStatus, newStatus) => {
        const triggers = (dim.triggers || []).filter(t => t.enabled);
        if (triggers.length === 0) return;

        const isWarning = getWarningStatus(newValue, dim.tolMin, dim.tolMax);
        const firedTriggers = [];

        triggers.forEach(trigger => {
            let shouldFire = false;
            switch (trigger.condition) {
                case 'ON_FAIL':
                    shouldFire = newStatus === 'FAIL';
                    break;
                case 'ON_WARNING':
                    shouldFire = isWarning;
                    break;
                case 'ON_PASS_TO_FAIL':
                    shouldFire = oldStatus === 'PASS' && newStatus === 'FAIL';
                    break;
                case 'ALWAYS':
                    shouldFire = true;
                    break;
                default:
                    shouldFire = newStatus === 'FAIL';
            }

            if (shouldFire) {
                firedTriggers.push(trigger);
                const actionDef = TRIGGER_ACTIONS.find(a => a.key === trigger.type);
                const msg = (trigger.message || '')
                    .replace('{label}', dim.label)
                    .replace('{value}', String(newValue))
                    .replace('{tolMin}', String(dim.tolMin))
                    .replace('{tolMax}', String(dim.tolMax));

                console.log(`[TRIGGER FIRED] ${actionDef?.icon} ${actionDef?.label}: ${msg}`);

                // Visual toast with trigger info
                toast(
                    (t) => (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
                            <span style={{ fontSize: '1.1rem' }}>{actionDef?.icon}</span>
                            <div>
                                <div style={{ fontWeight: 800, color: actionDef?.color }}>{actionDef?.label}</div>
                                <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{msg}</div>
                            </div>
                        </div>
                    ),
                    {
                        duration: 4000,
                        style: {
                            border: `1px solid ${actionDef?.color}40`,
                            backgroundColor: '#0f172a',
                            color: 'white',
                            borderRadius: '10px',
                            padding: '10px 14px',
                        },
                    }
                );
            }
        });

        if (firedTriggers.length > 0) {
            setTriggeredActions(prev => ({
                ...prev,
                [dim.id]: { triggers: firedTriggers, timestamp: Date.now() }
            }));
            // Clear triggered visual after 3 seconds
            setTimeout(() => {
                setTriggeredActions(prev => {
                    const next = { ...prev };
                    if (next[dim.id]?.timestamp <= Date.now() - 2800) {
                        delete next[dim.id];
                    }
                    return next;
                });
            }, 3000);
        }
    };

    // SVG Ref for coordinate calculation
    const svgRef = useRef(null);

    // Clear history and text input on selected blueprint change
    useEffect(() => {
        setUndoStack([]);
        setRedoStack([]);
        setTextInputPos(null);
        setZoom(1.0);
    }, [selectedDwgId]);

    const getCanvasCoords = (e) => {
        if (!svgRef.current) return { x: 0, y: 0 };
        const rect = svgRef.current.getBoundingClientRect();
        
        // Client click relative to SVG viewBox dimension limits
        const clickX = ((e.clientX - rect.left) / rect.width) * 500;
        const clickY = ((e.clientY - rect.top) / rect.height) * 360;
        
        // Reverse scale relative to the coordinate center (250, 180):
        let x = 250 + (clickX - 250) / zoom;
        let y = 180 + (clickY - 180) / zoom;
        
        if (gridSnap) {
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
        } else {
            x = Math.round(x);
            y = Math.round(y);
        }
        
        // Clamp bounds to prevent drawings from exceeding viewport limits
        x = Math.max(0, Math.min(500, x));
        y = Math.max(0, Math.min(360, y));
        
        return { x, y };
    };

    const updateShapes = (newShapes) => {
        if (!selectedDwg) return;
        const currentShapes = selectedDwg.shapes || [];
        setUndoStack(prev => [...prev, currentShapes]);
        setRedoStack([]);
        
        const updatedDwg = {
            ...selectedDwg,
            shapes: newShapes
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save CAD shapes:', err));
    };

    const handleUndo = () => {
        if (undoStack.length === 0 || !selectedDwg) return;
        const previousShapes = undoStack[undoStack.length - 1];
        setUndoStack(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, selectedDwg.shapes || []]);
        
        const updatedDwg = {
            ...selectedDwg,
            shapes: previousShapes
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error(err));
    };

    const handleRedo = () => {
        if (redoStack.length === 0 || !selectedDwg) return;
        const nextShapes = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setUndoStack(prev => [...prev, selectedDwg.shapes || []]);
        
        const updatedDwg = {
            ...selectedDwg,
            shapes: nextShapes
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error(err));
    };

    const handleSvgMouseDown = (e) => {
        if (cadTool === 'select') return;
        if (e.button !== 0) return; // left click only
        
        if (!selectedDwg) {
            toast.error("Silakan pilih atau unggah blueprint terlebih dahulu.");
            return;
        }
        
        const coords = getCanvasCoords(e);
        
        if (cadTool === 'line') {
            setDrawingShape({
                type: 'line',
                x1: coords.x,
                y1: coords.y,
                x2: coords.x,
                y2: coords.y,
                color: cadColor,
                strokeWidth: cadWidth
            });
        } else if (cadTool === 'circle') {
            setDrawingShape({
                type: 'circle',
                cx: coords.x,
                cy: coords.y,
                r: 0,
                color: cadColor,
                strokeWidth: cadWidth
            });
        } else if (cadTool === 'rect') {
            setDrawingShape({
                type: 'rect',
                x: coords.x,
                y: coords.y,
                x1: coords.x,
                y1: coords.y,
                w: 0,
                h: 0,
                color: cadColor,
                strokeWidth: cadWidth
            });
        } else if (cadTool === 'text') {
            const svgRect = svgRef.current.getBoundingClientRect();
            const parentRect = svgRef.current.parentElement.getBoundingClientRect();
            const top = e.clientY - parentRect.top;
            const left = e.clientX - parentRect.left;
            
            setTextInputPos({
                x: coords.x,
                y: coords.y,
                top,
                left
            });
            setTextInputValue('');
        } else if (cadTool === 'image') {
            // For image tool, clicking the canvas triggers file picker
            if (imageInsertRef.current) {
                imageInsertRef.current.click();
            }
        }
    };

    const handleSvgMouseMove = (e) => {
        if (dragImageShape) {
            const coords = getCanvasCoords(e);
            const dx = coords.x - dragImageShape.startX;
            const dy = coords.y - dragImageShape.startY;
            
            const start = dragImageShape.startShape;
            const crop = start.crop || { x: 0, y: 0, w: start.naturalWidth || start.w, h: start.naturalHeight || start.h };
            const natW = start.naturalWidth || start.w;
            const natH = start.naturalHeight || start.h;

            let nextX = start.x;
            let nextY = start.y;
            let nextW = start.w;
            let nextH = start.h;
            let nextCrop = { ...crop };

            if (dragImageShape.type === 'move') {
                nextX = Math.round(coords.x - dragImageShape.offsetX);
                nextY = Math.round(coords.y - dragImageShape.offsetY);
            } else if (dragImageShape.type === 'resize-br') {
                nextW = Math.max(10, Math.round(start.w + dx));
                nextH = Math.max(10, Math.round(start.h + dy));
            } else if (dragImageShape.type === 'resize-bl') {
                nextW = Math.max(10, Math.round(start.w - dx));
                nextH = Math.max(10, Math.round(start.h + dy));
                nextX = Math.round(start.x + (start.w - nextW));
            } else if (dragImageShape.type === 'resize-tr') {
                nextW = Math.max(10, Math.round(start.w + dx));
                nextH = Math.max(10, Math.round(start.h - dy));
                nextY = Math.round(start.y + (start.h - nextH));
            } else if (dragImageShape.type === 'resize-tl') {
                nextW = Math.max(10, Math.round(start.w - dx));
                nextH = Math.max(10, Math.round(start.h - dy));
                nextX = Math.round(start.x + (start.w - nextW));
                nextY = Math.round(start.y + (start.h - nextH));
            } else if (dragImageShape.type === 'crop-r') {
                nextW = Math.max(10, Math.round(start.w + dx));
                const deltaW = nextW - start.w;
                nextCrop.w = Math.max(10, Math.min(natW - crop.x, Math.round(crop.w + (deltaW * (crop.w / start.w)))));
            } else if (dragImageShape.type === 'crop-l') {
                nextW = Math.max(10, Math.round(start.w - dx));
                const deltaW = start.w - nextW;
                nextX = Math.round(start.x + deltaW);
                nextCrop.x = Math.max(0, Math.min(natW - 10, Math.round(crop.x + (deltaW * (crop.w / start.w)))));
                nextCrop.w = Math.max(10, Math.round(crop.w - (deltaW * (crop.w / start.w))));
            } else if (dragImageShape.type === 'crop-b') {
                nextH = Math.max(10, Math.round(start.h + dy));
                const deltaH = nextH - start.h;
                nextCrop.h = Math.max(10, Math.min(natH - crop.y, Math.round(crop.h + (deltaH * (crop.h / start.h)))));
            } else if (dragImageShape.type === 'crop-t') {
                nextH = Math.max(10, Math.round(start.h - dy));
                const deltaH = start.h - nextH;
                nextY = Math.round(start.y + deltaH);
                nextCrop.y = Math.max(0, Math.min(natH - 10, Math.round(crop.y + (deltaH * (crop.h / start.h)))));
                nextCrop.h = Math.max(10, Math.round(crop.h - (deltaH * (crop.h / start.h))));
            }

            setDragImageShape(prev => ({
                ...prev,
                currentX: nextX,
                currentY: nextY,
                currentW: nextW,
                currentH: nextH,
                currentCrop: nextCrop
            }));
            return;
        }
        if (!drawingShape) return;
        const coords = getCanvasCoords(e);
        
        if (drawingShape.type === 'line') {
            setDrawingShape(prev => ({
                ...prev,
                x2: coords.x,
                y2: coords.y
            }));
        } else if (drawingShape.type === 'circle') {
            const dx = coords.x - drawingShape.cx;
            const dy = coords.y - drawingShape.cy;
            const r = Math.round(Math.sqrt(dx * dx + dy * dy));
            setDrawingShape(prev => ({
                ...prev,
                r
            }));
        } else if (drawingShape.type === 'rect') {
            const x = Math.min(drawingShape.x1, coords.x);
            const y = Math.min(drawingShape.y1, coords.y);
            const w = Math.abs(coords.x - drawingShape.x1);
            const h = Math.abs(coords.y - drawingShape.y1);
            setDrawingShape(prev => ({
                ...prev,
                x,
                y,
                w,
                h
            }));
        }
    };

    const handleSvgMouseUp = () => {
        if (dragImageShape) {
            const currentShapes = selectedDwg.shapes || [];
            const updatedShapes = currentShapes.map(s => {
                if (s.id === dragImageShape.id) {
                    return {
                        ...s,
                        x: dragImageShape.currentX !== undefined ? dragImageShape.currentX : s.x,
                        y: dragImageShape.currentY !== undefined ? dragImageShape.currentY : s.y,
                        w: dragImageShape.currentW !== undefined ? dragImageShape.currentW : s.w,
                        h: dragImageShape.currentH !== undefined ? dragImageShape.currentH : s.h,
                        crop: dragImageShape.currentCrop !== undefined ? dragImageShape.currentCrop : s.crop
                    };
                }
                return s;
            });
            updateShapes(updatedShapes);
            setDragImageShape(null);
            return;
        }
        if (!drawingShape) return;
        if (!selectedDwg) {
            setDrawingShape(null);
            return;
        }
        const currentShapes = selectedDwg.shapes || [];
        const newShape = {
            ...drawingShape,
            id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        };
        updateShapes([...currentShapes, newShape]);
        setDrawingShape(null);
    };

    const handleCanvasClick = (e) => {
        if (cadTool !== 'select') return;
        
        // Clear active selection on background click
        setSelectedShapeId(null);
        
        if (!activeDim) return;
        const coords = getCanvasCoords(e);
        const x = coords.x;
        const y = coords.y;
        
        setEditLx(x);
        setEditLy(y);

        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    const dx = x - (dim.lx || 250);
                    const dy = y - (dim.ly || 200);
                    return {
                        ...dim,
                        lx: x, ly: y,
                        x1: dim.x1 !== undefined ? Math.max(10, Math.min(490, dim.x1 + dx)) : x - 30,
                        y1: dim.y1 !== undefined ? Math.max(10, Math.min(350, dim.y1 + dy)) : y - 20,
                        x2: dim.x2 !== undefined ? Math.max(10, Math.min(490, dim.x2 + dx)) : x + 30,
                        y2: dim.y2 !== undefined ? Math.max(10, Math.min(350, dim.y2 + dy)) : y - 20,
                    };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        toast.success(`Hotspot dipindahkan ke (${x}, ${y})`, { id: 'click-hotspot' });
    };

    const handleDeleteDwg = async (dwgId, e) => {
        e.stopPropagation();
        if (window.confirm('Apakah Anda yakin ingin menghapus blueprint ini dari database?')) {
            try {
                await deleteDrawing(dwgId);
                const updatedDrawings = drawings.filter(d => d.id !== dwgId);
                setDrawings(updatedDrawings);
                if (selectedDwgId === dwgId) {
                    if (updatedDrawings.length > 0) {
                        setSelectedDwgId(updatedDrawings[0].id);
                        setActiveDimId(updatedDrawings[0].dimensions.length > 0 ? updatedDrawings[0].dimensions[0].id : '');
                    } else {
                        setSelectedDwgId('');
                        setActiveDimId('');
                    }
                }
                toast.success('Gambar drawing berhasil dihapus dari database.');
            } catch (err) {
                console.error(err);
                toast.error('Gagal menghapus gambar dari database.');
            }
        }
    };

    // ─── Image Insertion Handler ───
    const handleImageInsert = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp', 'image/gif', 'image/bmp'];
        if (!validTypes.includes(file.type)) {
            toast.error('Format gambar tidak didukung. Gunakan PNG, JPG, SVG, WebP, atau GIF.');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('Ukuran gambar terlalu besar. Maksimal 5MB.');
            return;
        }

        if (!selectedDwg) {
            toast.error('Pilih atau buat blueprint terlebih dahulu.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target.result;
            
            // Create a temp image to get natural dimensions
            const img = new window.Image();
            img.onload = () => {
                // Scale to fit within canvas, max 300px wide or 250px tall
                let w = img.naturalWidth;
                let h = img.naturalHeight;
                const maxW = 300;
                const maxH = 250;
                if (w > maxW) { h = h * (maxW / w); w = maxW; }
                if (h > maxH) { w = w * (maxH / h); h = maxH; }
                w = Math.round(w);
                h = Math.round(h);

                const newShape = {
                    id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                    type: 'image',
                    x: Math.round(250 - w / 2), // center horizontally
                    y: Math.round(180 - h / 2), // center vertically
                    w,
                    h,
                    src: dataUrl,
                    fileName: file.name,
                    opacity: 0.85,
                    naturalWidth: img.naturalWidth || w,
                    naturalHeight: img.naturalHeight || h,
                    crop: { x: 0, y: 0, w: img.naturalWidth || w, h: img.naturalHeight || h }
                };

                const currentShapes = selectedDwg.shapes || [];
                updateShapes([...currentShapes, newShape]);
                toast.success(`Gambar "${file.name}" berhasil disisipkan ke canvas.`);
            };
            img.src = dataUrl;
        };
        reader.readAsDataURL(file);
        
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    // ─── Drawing Management Handlers ───
    const handleExportSchema = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drawings, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "mavi_drawings_schema.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success('Skema drawing berhasil diekspor.');
        setShowMgmtMenu(false);
    };

    const handleImportSchema = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed)) {
                    const isValid = parsed.every(dwg => dwg.id && dwg.name && Array.isArray(dwg.dimensions));
                    if (isValid) {
                        setDrawings(parsed);
                        if (parsed.length > 0) {
                            setSelectedDwgId(parsed[0].id);
                            setActiveDimId(parsed[0].dimensions.length > 0 ? parsed[0].dimensions[0].id : '');
                        }
                        toast.success('Skema drawing berhasil diimpor!');
                    } else {
                        toast.error('Format berkas JSON tidak valid.');
                    }
                } else {
                    toast.error('Format berkas harus berupa JSON Array.');
                }
            } catch {
                toast.error('Gagal membaca berkas JSON.');
            }
        };
        reader.readAsText(file);
        setShowMgmtMenu(false);
        e.target.value = '';
    };

    const handleResetToDefault = async () => {
        if (window.confirm('Apakah Anda yakin ingin mereset semua blueprint ke template bawaan? Perubahan kustom Anda akan hilang.')) {
            try {
                const savePromises = DEFAULT_DRAWINGS.map(dwg => saveDrawing(dwg));
                const savedList = await Promise.all(savePromises);
                setDrawings(savedList);
                if (savedList.length > 0) {
                    setSelectedDwgId(savedList[0].id);
                    setActiveDimId(savedList[0].dimensions.length > 0 ? savedList[0].dimensions[0].id : '');
                }
                toast.success('Blueprint berhasil direset ke template bawaan di database.');
            } catch (err) {
                console.error(err);
                toast.error('Gagal mereset ke template bawaan di database.');
            }
            setShowMgmtMenu(false);
        }
    };

    const handleClearAllDrawings = async () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus semua gambar blueprint?')) {
            try {
                const deletePromises = drawings.map(dwg => deleteDrawing(dwg.id));
                await Promise.all(deletePromises);
                setDrawings([]);
                setSelectedDwgId('');
                setActiveDimId('');
                toast.success('Semua gambar blueprint telah dihapus dari database.');
            } catch (err) {
                console.error(err);
                toast.error('Gagal menghapus beberapa gambar dari database.');
            }
            setShowMgmtMenu(false);
        }
    };

    const handleCreateBlankDrawing = () => {
        const name = window.prompt("Masukkan nama blueprint baru:", "Blueprint Kustom Baru");
        if (name === null) return;
        const cleanName = name.trim() || "Blueprint Kustom Baru";
        
        const newDwg = {
            id: `dwg_custom_${Date.now()}`,
            name: cleanName,
            fileName: `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.cad`,
            fileType: 'CAD',
            uploadedAt: new Date().toISOString(),
            dimensions: [],
            shapes: []
        };
        
        saveDrawing(newDwg).then(saved => {
            setDrawings(prev => [saved, ...prev]);
            setSelectedDwgId(saved.id);
            setActiveDimId('');
            toast.success(`Blueprint kustom "${cleanName}" berhasil dibuat!`);
        }).catch(err => {
            console.error(err);
            toast.error('Gagal menyimpan blueprint baru ke database.');
        });
        
        setShowMgmtMenu(false);
    };

    const parsePromptParams = (promptText) => {
        const text = promptText.toLowerCase();
        
        const extractParam = (keywords, defaultValue) => {
            for (const word of keywords) {
                const regex1 = new RegExp(`${word}\\s*[:=\\-⌀\\s]*\\s*(\\d+(?:\\.\\d+)?)`, 'i');
                const match1 = text.match(regex1);
                if (match1) return parseFloat(match1[1]);
                
                const regex2 = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:mm|°|μm|um|mm²)?\\s*${word}`, 'i');
                const match2 = text.match(regex2);
                if (match2) return parseFloat(match2[1]);
            }
            return defaultValue;
        };

        const allNumbers = text.match(/\d+(?:\.\d+)?/g)?.map(Number) || [];

        if (text.includes("flens") || text.includes("flange") || text.includes("ring") || text.includes("lingkaran") || text.includes("circle")) {
            let outer = extractParam(["diameter luar", "outer diameter", "diameter utama", "diameter", "od", "flens", "flange", "ring", "⌀", "d"], 160);
            let inner = extractParam(["lubang tengah", "diameter dalam", "lubang", "inner diameter", "bore", "id"], 50);
            let holes = extractParam(["lubang baut", "jumlah lubang", "lubang", "holes", "bolts", "baut"], 4);
            
            if (outer === 160 && allNumbers.length >= 1) outer = allNumbers[0];
            if (inner === 50 && allNumbers.length >= 2) {
                if (allNumbers[1] < outer) inner = allNumbers[1];
            }
            if (holes === 4 && allNumbers.length >= 3) {
                const boltCountMatch = text.match(/(\d+)\s*(lubang|hole|baut)/i);
                if (boltCountMatch) {
                    holes = parseInt(boltCountMatch[1]);
                } else if (allNumbers[2] < 30) {
                    holes = allNumbers[2];
                }
            }

            let pcd = extractParam(["pcd", "pitch circle diameter", "diameter pcd"], outer * 0.75);
            if (pcd <= inner || pcd >= outer) {
                pcd = inner + (outer - inner) * 0.7;
            }

            let boltD = extractParam(["diameter baut", "baut", "bolt diameter", "bolt size"], 12);
            
            return {
                type: 'flange',
                outer,
                inner,
                holes: Math.round(holes),
                pcd,
                boltD
            };
        } else if (text.includes("poros") || text.includes("shaft") || text.includes("rod") || text.includes("silinder") || text.includes("piston") || text.includes("cylinder")) {
            let length = extractParam(["panjang total", "panjang", "total length", "length", "l"], 220);
            let bodyDia = extractParam(["diameter utama", "diameter poros", "diameter", "body diameter", "shaft diameter", "d"], 40);
            let journalDia = extractParam(["bearing journal", "journal", "diameter journal", "bearing", "journal diameter", "j diameter"], 25);
            let journalLen = extractParam(["panjang journal", "journal length", "j length"], length * 0.22);

            if (length === 220 && allNumbers.length >= 1) length = allNumbers[0];
            if (bodyDia === 40 && allNumbers.length >= 2) bodyDia = allNumbers[1];
            if (journalDia === 25 && allNumbers.length >= 3) journalDia = allNumbers[2];

            if (journalDia >= bodyDia) journalDia = bodyDia * 0.625;
            if (journalLen * 2 >= length) journalLen = length * 0.22;

            return {
                type: 'shaft',
                length,
                bodyDia,
                journalDia,
                journalLen
            };
        } else {
            const dimsMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:mm)?\s*[xX*]\s*(\d+(?:\.\d+)?)/);
            let width = 150;
            let height = 100;
            if (dimsMatch) {
                width = parseFloat(dimsMatch[1]);
                height = parseFloat(dimsMatch[2]);
            } else {
                width = extractParam(["lebar", "width", "w", "panjang pelat", "panjang plat"], 150);
                height = extractParam(["tinggi", "lebar pelat", "lebar plat", "height", "h"], 100);
                
                if (width === 150 && allNumbers.length >= 1) width = allNumbers[0];
                if (height === 100 && allNumbers.length >= 2) height = allNumbers[1];
            }

            let holes = extractParam(["lubang baut", "lubang", "holes", "mounting holes"], 4);
            let holeD = extractParam(["diameter lubang", "lubang", "hole diameter", "d"], 10);

            if (holes === 4 && allNumbers.length >= 3) {
                const third = allNumbers[2];
                if (third <= 12) holes = third;
            }

            return {
                type: 'plate',
                width,
                height,
                holes: Math.round(holes),
                holeD
            };
        }
    };

    const handleAIGenerate = () => {
        if (!copilotPrompt.trim()) {
            toast.error('Ketik prompt instruksi terlebih dahulu.');
            return;
        }

        setCopilotLoading(true);
        setCopilotProgress(10);
        setCopilotLog('Menganalisis instruksi prompt...');

        setTimeout(() => {
            setCopilotProgress(35);
            setCopilotLog('Menghitung geometri vector 2D...');
            
            setTimeout(() => {
                setCopilotProgress(70);
                setCopilotLog('Memetakan parameter & hotspot toleransi dimensi...');
                
                setTimeout(() => {
                    setCopilotProgress(90);
                    setCopilotLog('Menyimpan blueprint CAD ke database...');
                    
                    const params = parsePromptParams(copilotPrompt);
                    let generatedDwgName = "AI Blueprint - Model 2D";
                    let shapes = [];
                    let dimensions = [];
                    
                    const cx = 250;
                    const cy = 180;

                    if (params.type === 'flange') {
                        generatedDwgName = `Flange Connector ⌀${params.outer}x⌀${params.inner} [AI]`;
                        const outerR = Math.min(120, params.outer * 0.65);
                        const pcdR = outerR * (params.pcd / params.outer);
                        const innerR = outerR * (params.inner / params.outer);
                        const scaleFlange = outerR / params.outer;
                        
                        shapes.push({
                            id: `ai_shape_outer_${Date.now()}`,
                            type: 'circle',
                            cx, cy, r: outerR,
                            color: '#3b82f6', strokeWidth: 2
                        });
                        shapes.push({
                            id: `ai_shape_pcd_${Date.now()}`,
                            type: 'circle',
                            cx, cy, r: pcdR,
                            color: '#3b82f6', strokeWidth: 1,
                            strokeDasharray: '4,4'
                        });
                        shapes.push({
                            id: `ai_shape_inner_${Date.now()}`,
                            type: 'circle',
                            cx, cy, r: innerR,
                            color: '#60a5fa', strokeWidth: 2
                        });
                        
                        for (let i = 0; i < params.holes; i++) {
                            const angle = (i * 2 * Math.PI) / params.holes;
                            shapes.push({
                                id: `ai_shape_bolt_${i}_${Date.now()}`,
                                type: 'circle',
                                cx: Math.round(cx + pcdR * Math.cos(angle)),
                                cy: Math.round(cy + pcdR * Math.sin(angle)),
                                r: Math.max(3, Math.round((params.boltD * scaleFlange) / 2)),
                                color: '#3b82f6', strokeWidth: 1
                            });
                        }
                        
                        shapes.push({
                            id: `ai_shape_cl1_${Date.now()}`,
                            type: 'line',
                            x1: cx - outerR - 20, y1: cy, x2: cx + outerR + 20, y2: cy,
                            color: '#3b82f6', strokeWidth: 0.75, strokeDasharray: '10,4,2,4'
                        });
                        shapes.push({
                            id: `ai_shape_cl2_${Date.now()}`,
                            type: 'line',
                            x1: cx, y1: cy - outerR - 20, x2: cx, y2: cy + outerR + 20,
                            color: '#3b82f6', strokeWidth: 0.75, strokeDasharray: '10,4,2,4'
                        });
                        
                        dimensions.push({
                            id: `dim_ai_outer_${Date.now()}`,
                            label: 'Flange Outer Diameter',
                            spec: params.outer.toFixed(1),
                            tolMin: parseFloat((params.outer - 0.2).toFixed(2)),
                            tolMax: parseFloat((params.outer + 0.2).toFixed(2)),
                            variable: 'Outer_Dia',
                            unit: 'mm',
                            category: 'diameter',
                            measureType: 'diameter',
                            indicatorType: 'radial',
                            gdt_symbol: '⌀',
                            x1: cx, y1: cy,
                            x2: cx + Math.round(outerR * Math.cos(-Math.PI/4)),
                            y2: cy + Math.round(outerR * Math.sin(-Math.PI/4)),
                            lx: cx + Math.round((outerR + 20) * Math.cos(-Math.PI/4)),
                            ly: cy + Math.round((outerR + 20) * Math.sin(-Math.PI/4)),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: []
                        });
                        dimensions.push({
                            id: `dim_ai_inner_${Date.now()}`,
                            label: 'Center Bore Diameter',
                            spec: params.inner.toFixed(1),
                            tolMin: parseFloat((params.inner - 0.1).toFixed(2)),
                            tolMax: parseFloat((params.inner + 0.1).toFixed(2)),
                            variable: 'Cylinder_Bore_Dia',
                            unit: 'mm',
                            category: 'diameter',
                            measureType: 'diameter',
                            indicatorType: 'radial',
                            gdt_symbol: '⌀',
                            x1: cx, y1: cy,
                            x2: cx + Math.round(innerR * Math.cos(Math.PI/4)),
                            y2: cy + Math.round(innerR * Math.sin(Math.PI/4)),
                            lx: cx + Math.round((innerR + 30) * Math.cos(Math.PI/4)),
                            ly: cy + Math.round((innerR + 30) * Math.sin(Math.PI/4)),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: [
                                { id: `trig_ai_bore_${Date.now()}`, type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Center Bore di luar toleransi! Hentikan lini perakitan.', enabled: true }
                            ]
                        });
                        dimensions.push({
                            id: `dim_ai_pcd_${Date.now()}`,
                            label: 'Bolt PCD Circle',
                            spec: params.pcd.toFixed(1),
                            tolMin: parseFloat((params.pcd - 0.15).toFixed(2)),
                            tolMax: parseFloat((params.pcd + 0.15).toFixed(2)),
                            variable: 'Custom_Param_1',
                            unit: 'mm',
                            category: 'dimension',
                            measureType: 'linear_horizontal',
                            indicatorType: 'horizontal',
                            gdt_symbol: '',
                            x1: cx - Math.round(pcdR), y1: cy,
                            x2: cx + Math.round(pcdR), y2: cy,
                            lx: cx, ly: cy + Math.round(pcdR) + 20,
                            markerShape: 'circle',
                            markerSize: 50,
                            triggers: []
                        });
                        if (params.holes > 0) {
                            dimensions.push({
                                id: `dim_ai_bolt_${Date.now()}`,
                                label: 'Bolt Hole Diameter',
                                spec: params.boltD.toFixed(1),
                                tolMin: parseFloat((params.boltD - 0.1).toFixed(2)),
                                tolMax: parseFloat((params.boltD + 0.1).toFixed(2)),
                                variable: 'Custom_Param_2',
                                unit: 'mm',
                                category: 'diameter',
                                measureType: 'diameter',
                                indicatorType: 'radial',
                                gdt_symbol: '⌀',
                                x1: cx + Math.round(pcdR),
                                y1: cy,
                                x2: cx + Math.round(pcdR) + Math.max(3, Math.round((params.boltD * scaleFlange) / 2)),
                                y2: cy,
                                lx: cx + Math.round(pcdR) + 20,
                                ly: cy - 20,
                                markerShape: 'default',
                                markerSize: 40,
                                triggers: []
                            });
                        }
                    } else if (params.type === 'shaft') {
                        generatedDwgName = `Shaft Journal L${params.length}x⌀${params.bodyDia} [AI]`;
                        const sLen = Math.min(300, params.length * 1.1);
                        const sDia = Math.min(100, params.bodyDia * 1.5);
                        
                        const scaleX = sLen / params.length;
                        const scaleY = sDia / params.bodyDia;
                        
                        const jDia = params.journalDia * scaleY;
                        const jLen = params.journalLen * scaleX;
                        
                        const xStart = cx - sLen / 2;
                        const yStart = cy - sDia / 2;
                        
                        shapes.push({
                            id: `ai_shape_shaft_body_${Date.now()}`,
                            type: 'rect',
                            x: Math.round(xStart + jLen),
                            y: Math.round(yStart),
                            w: Math.round(sLen - 2 * jLen),
                            h: Math.round(sDia),
                            color: '#3b82f6', strokeWidth: 2
                        });
                        shapes.push({
                            id: `ai_shape_left_journal_${Date.now()}`,
                            type: 'rect',
                            x: Math.round(xStart),
                            y: Math.round(cy - jDia / 2),
                            w: Math.round(jLen),
                            h: Math.round(jDia),
                            color: '#60a5fa', strokeWidth: 1.5
                        });
                        shapes.push({
                            id: `ai_shape_right_journal_${Date.now()}`,
                            type: 'rect',
                            x: Math.round(xStart + sLen - jLen),
                            y: Math.round(cy - jDia / 2),
                            w: Math.round(jLen),
                            h: Math.round(jDia),
                            color: '#60a5fa', strokeWidth: 1.5
                        });
                        shapes.push({
                            id: `ai_shape_cl_${Date.now()}`,
                            type: 'line',
                            x1: xStart - 20, y1: cy, x2: xStart + sLen + 20, y2: cy,
                            color: '#3b82f6', strokeWidth: 0.75, strokeDasharray: '15,4,2,4'
                        });
                        
                        dimensions.push({
                            id: `dim_ai_len_${Date.now()}`,
                            label: 'Total Shaft Length',
                            spec: params.length.toFixed(1),
                            tolMin: parseFloat((params.length - 0.5).toFixed(2)),
                            tolMax: parseFloat((params.length + 0.5).toFixed(2)),
                            variable: 'Meas_Length',
                            unit: 'mm',
                            category: 'dimension',
                            measureType: 'linear_horizontal',
                            indicatorType: 'horizontal',
                            gdt_symbol: '',
                            x1: Math.round(xStart), y1: Math.round(cy + sDia / 2 + 20),
                            x2: Math.round(xStart + sLen), y2: Math.round(cy + sDia / 2 + 20),
                            lx: Math.round(cx), ly: Math.round(cy + sDia / 2 + 35),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: []
                        });
                        dimensions.push({
                            id: `dim_ai_dia_${Date.now()}`,
                            label: 'Main Body Diameter',
                            spec: params.bodyDia.toFixed(1),
                            tolMin: parseFloat((params.bodyDia - 0.05).toFixed(2)),
                            tolMax: parseFloat((params.bodyDia + 0.05).toFixed(2)),
                            variable: 'Meas_Diameter',
                            unit: 'mm',
                            category: 'diameter',
                            measureType: 'diameter',
                            indicatorType: 'radial',
                            gdt_symbol: '⌀',
                            x1: Math.round(cx), y1: Math.round(yStart),
                            x2: Math.round(cx), y2: Math.round(yStart + sDia),
                            lx: Math.round(cx + 30), ly: Math.round(cy - 20),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: []
                        });
                        dimensions.push({
                            id: `dim_ai_j_dia_${Date.now()}`,
                            label: 'Journal Bearing Dia',
                            spec: params.journalDia.toFixed(1),
                            tolMin: parseFloat((params.journalDia - 0.02).toFixed(2)),
                            tolMax: parseFloat((params.journalDia + 0.02).toFixed(2)),
                            variable: 'Rod_Diameter_Spec',
                            unit: 'mm',
                            category: 'diameter',
                            measureType: 'diameter',
                            indicatorType: 'radial',
                            gdt_symbol: '⌀',
                            x1: Math.round(xStart + jLen / 2), y1: Math.round(cy - jDia / 2),
                            x2: Math.round(xStart + jLen / 2), y2: Math.round(cy + jDia / 2),
                            lx: Math.round(xStart + jLen / 2 - 30), ly: Math.round(cy - 30),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: [
                                { id: `trig_ai_j_dia_${Date.now()}`, type: 'NOTIFY_SUPERVISOR', condition: 'ON_FAIL', priority: 'high', message: 'Bearing journal shaft di luar batas toleransi!', enabled: true }
                            ]
                        });
                        dimensions.push({
                            id: `dim_ai_j_len_${Date.now()}`,
                            label: 'Journal Bearing Length',
                            spec: params.journalLen.toFixed(1),
                            tolMin: parseFloat((params.journalLen - 0.2).toFixed(2)),
                            tolMax: parseFloat((params.journalLen + 0.2).toFixed(2)),
                            variable: 'Custom_Param_1',
                            unit: 'mm',
                            category: 'dimension',
                            measureType: 'linear_horizontal',
                            indicatorType: 'horizontal',
                            gdt_symbol: '',
                            x1: Math.round(xStart), y1: Math.round(cy - jDia / 2 - 15),
                            x2: Math.round(xStart + jLen), y2: Math.round(cy - jDia / 2 - 15),
                            lx: Math.round(xStart + jLen / 2), ly: Math.round(cy - jDia / 2 - 30),
                            markerShape: 'default',
                            markerSize: 50,
                            triggers: []
                        });
                    } else {
                        generatedDwgName = `Plate Bracket ${params.width}x${params.height} [AI]`;
                        const w = Math.min(300, params.width * 1.5);
                        const h = Math.min(200, params.height * 1.5);
                        const scaleX = w / params.width;
                        const xStart = cx - w / 2;
                        const yStart = cy - h / 2;
                        
                        shapes.push({
                            id: `ai_shape_plate_${Date.now()}`,
                            type: 'rect',
                            x: Math.round(xStart),
                            y: Math.round(yStart),
                            w: Math.round(w),
                            h: Math.round(h),
                            color: '#3b82f6', strokeWidth: 2
                        });
                        
                        const offset = 20;
                        let holeCenters = [];
                        
                        if (params.holes === 4) {
                            holeCenters = [
                                { x: xStart + offset, y: yStart + offset },
                                { x: xStart + w - offset, y: yStart + offset },
                                { x: xStart + offset, y: yStart + h - offset },
                                { x: xStart + w - offset, y: yStart + h - offset }
                            ];
                        } else if (params.holes === 2) {
                            holeCenters = [
                                { x: xStart + offset, y: cy },
                                { x: xStart + w - offset, y: cy }
                            ];
                        } else if (params.holes === 6) {
                            holeCenters = [
                                { x: xStart + offset, y: yStart + offset },
                                { x: xStart + w - offset, y: yStart + offset },
                                { x: xStart + offset, y: yStart + h - offset },
                                { x: xStart + w - offset, y: yStart + h - offset },
                                { x: cx, y: yStart + offset },
                                { x: cx, y: yStart + h - offset }
                            ];
                        } else if (params.holes > 0) {
                            holeCenters = [{ x: cx, y: cy }];
                        }
                        
                        const r = Math.max(3, Math.round((params.holeD * scaleX) / 2));
                        holeCenters.forEach((hole, idx) => {
                            shapes.push({
                                id: `ai_shape_hole_${idx}_${Date.now()}`,
                                type: 'circle',
                                cx: Math.round(hole.x), cy: Math.round(hole.y), r,
                                color: '#60a5fa', strokeWidth: 1.5
                            });
                        });
                        
                        dimensions.push({
                            id: `dim_ai_w_${Date.now()}`,
                            label: 'Plate Overall Width',
                            spec: params.width.toFixed(1),
                            tolMin: parseFloat((params.width - 0.3).toFixed(2)),
                            tolMax: parseFloat((params.width + 0.3).toFixed(2)),
                            variable: 'Meas_Width',
                            unit: 'mm',
                            category: 'dimension',
                            measureType: 'linear_horizontal',
                            indicatorType: 'horizontal',
                            gdt_symbol: '',
                            x1: Math.round(xStart), y1: Math.round(yStart - 15),
                            x2: Math.round(xStart + w), y2: Math.round(yStart - 15),
                            lx: Math.round(cx), ly: Math.round(yStart - 30),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: []
                        });
                        dimensions.push({
                            id: `dim_ai_h_${Date.now()}`,
                            label: 'Plate Overall Height',
                            spec: params.height.toFixed(1),
                            tolMin: parseFloat((params.height - 0.2).toFixed(2)),
                            tolMax: parseFloat((params.height + 0.2).toFixed(2)),
                            variable: 'Meas_Height',
                            unit: 'mm',
                            category: 'dimension',
                            measureType: 'linear_vertical',
                            indicatorType: 'vertical',
                            gdt_symbol: '',
                            x1: Math.round(xStart - 15), y1: Math.round(yStart),
                            x2: Math.round(xStart - 15), y2: Math.round(yStart + h),
                            lx: Math.round(xStart - 30), ly: Math.round(cy),
                            markerShape: 'default',
                            markerSize: 60,
                            triggers: []
                        });
                        if (params.holes > 0 && holeCenters.length > 0) {
                            dimensions.push({
                                id: `dim_ai_hole_dia_${Date.now()}`,
                                label: 'Mounting Hole Dia',
                                spec: params.holeD.toFixed(1),
                                tolMin: parseFloat((params.holeD - 0.08).toFixed(2)),
                                tolMax: parseFloat((params.holeD + 0.08).toFixed(2)),
                                variable: 'Inner_Dia',
                                unit: 'mm',
                                category: 'diameter',
                                measureType: 'diameter',
                                indicatorType: 'radial',
                                gdt_symbol: '⌀',
                                x1: Math.round(holeCenters[0].x), y1: Math.round(holeCenters[0].y),
                                x2: Math.round(holeCenters[0].x + r * Math.cos(-Math.PI/4)),
                                y2: Math.round(holeCenters[0].y + r * Math.sin(-Math.PI/4)),
                                lx: Math.round(holeCenters[0].x + (r + 15) * Math.cos(-Math.PI/4)),
                                ly: Math.round(holeCenters[0].y + (r + 15) * Math.sin(-Math.PI/4)),
                                markerShape: 'triangle',
                                markerSize: 45,
                                triggers: [
                                    { id: `trig_ai_hole_${Date.now()}`, type: 'ESCALATE_QUALITY', condition: 'ON_FAIL', priority: 'high', message: 'Hole diameter out of spec, mounting pins won\'t fit!', enabled: true }
                                ]
                            });
                        }
                    }
 
                    const newDwg = {
                        id: `dwg_ai_${Date.now()}`,
                        name: generatedDwgName,
                        fileName: `${generatedDwgName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.dxf`,
                        fileType: 'AI_CAD',
                        uploadedAt: new Date().toISOString(),
                        dimensions,
                        shapes
                    };

                    saveDrawing(newDwg).then(saved => {
                        setDrawings(prev => [saved, ...prev]);
                        setSelectedDwgId(saved.id);
                        if (saved.dimensions?.length > 0) setActiveDimId(saved.dimensions[0].id);
                        else setActiveDimId('');
                        
                        setCopilotLoading(false);
                        setCopilotProgress(100);
                        setCopilotPrompt('');
                        toast.success(`Blueprint "${generatedDwgName}" berhasil digenerasi!`);
                    }).catch(err => {
                        console.error(err);
                        setCopilotLoading(false);
                        toast.error('Gagal menyimpan blueprint hasil generasi AI.');
                    });
                }, 1000);
            }, 800);
        }, 800);
    };

    // ─── Upload handlers ───
    const handleFileDrop = (e) => { e.preventDefault(); setIsDragOver(false); if (e.dataTransfer.files?.length > 0) processUploadedFile(e.dataTransfer.files[0]); };
    const handleFileSelect = (e) => { if (e.target.files?.length > 0) processUploadedFile(e.target.files[0]); };

    const processUploadedFile = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['svg', 'dxf', 'pdf'].includes(extension)) {
            toast.error('Format tidak didukung! Gunakan .svg, .dxf, atau .pdf.');
            return;
        }
        setIsParsing(true); setParseProgress(5);
        setParseStatusText('Membaca berkas binary...');

        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target.result || '';
            const fileContent = extension === 'pdf' ? '' : result;
            const dataUrl = extension === 'pdf' ? result : undefined;
            let extractedDims = [];

            setParseProgress(30);
            setParseStatusText('Mengekstrak vector data & geometry primitives...');

            if (extension === 'svg') {
                const circleRegex = /<circle[^>]*\sr="([^"]+)"[^>]*>/gi;
                let match; let circleCount = 0;
                while ((match = circleRegex.exec(fileContent)) !== null && circleCount < 3) {
                    const radius = parseFloat(match[1]);
                    if (!isNaN(radius)) {
                        circleCount++;
                        extractedDims.push({
                            id: `dim_svg_c_${circleCount}_${Date.now()}`,
                            label: circleCount === 1 ? 'Inner Bore Diameter' : `Hole Circle ${circleCount} Dia`,
                            spec: (radius * 2).toFixed(1), tolMin: parseFloat((radius * 2 - 0.1).toFixed(2)), tolMax: parseFloat((radius * 2 + 0.1).toFixed(2)),
                            variable: circleCount === 1 ? 'Meas_Bore' : 'Inner_Dia', unit: 'mm',
                            category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀',
                            x1: 240, y1: 170, x2: 240 + Math.round(radius), y2: 170, lx: 240 + Math.round(radius) + 15, ly: 170 - 15,
                        });
                    }
                }
                const rectRegex = /<rect[^>]*\swidth="([^"]+)"[^>]*\sheight="([^"]+)"/gi;
                let rectMatch = rectRegex.exec(fileContent);
                if (rectMatch) {
                    const w = parseFloat(rectMatch[1]);
                    const h = parseFloat(rectMatch[2]);
                    if (!isNaN(w) && !isNaN(h)) {
                        extractedDims.push({
                            id: `dim_svg_w_${Date.now()}`, label: 'Overall Width', spec: w.toFixed(1),
                            tolMin: parseFloat((w - 0.5).toFixed(2)), tolMax: parseFloat((w + 0.5).toFixed(2)),
                            variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '',
                            x1: 120, y1: 260, x2: 120 + Math.round(w), y2: 260, lx: 120 + Math.round(w/2), ly: 280,
                        });
                        extractedDims.push({
                            id: `dim_svg_h_${Date.now()}`, label: 'Overall Height', spec: h.toFixed(1),
                            tolMin: parseFloat((h - 0.5).toFixed(2)), tolMax: parseFloat((h + 0.5).toFixed(2)),
                            variable: 'Meas_Height', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '',
                            x1: 90, y1: 80, x2: 90, y2: 80 + Math.round(h), lx: 65, ly: 80 + Math.round(h/2),
                        });
                        // Also extract area
                        extractedDims.push({
                            id: `dim_svg_area_${Date.now()}`, label: 'Cross-Section Area', spec: (w * h).toFixed(1),
                            tolMin: parseFloat(((w - 0.5) * (h - 0.5)).toFixed(1)), tolMax: parseFloat(((w + 0.5) * (h + 0.5)).toFixed(1)),
                            variable: 'Meas_Area', unit: 'mm²', category: 'area', measureType: 'area', indicatorType: 'area_box', gdt_symbol: '',
                            x1: 120, y1: 80, x2: 120 + Math.round(w), y2: 80 + Math.round(h), lx: 120 + Math.round(w/2), ly: 80 + Math.round(h/2),
                        });
                    }
                }
            } else if (extension === 'dxf') {
                const circleMatches = fileContent.match(/CIRCLE[\s\S]*?\b40\s+([0-9.]+)/gi);
                if (circleMatches) {
                    circleMatches.slice(0, 3).forEach((cm, idx) => {
                        const radiusVal = parseFloat(cm.replace(/CIRCLE[\s\S]*?\b40\s+/, '').trim());
                        if (!isNaN(radiusVal)) {
                            extractedDims.push({
                                id: `dim_dxf_c_${idx}_${Date.now()}`, label: `Outer Flange Diameter ${idx + 1}`,
                                spec: (radiusVal * 2).toFixed(1), tolMin: parseFloat((radiusVal * 2 - 0.2).toFixed(2)), tolMax: parseFloat((radiusVal * 2 + 0.2).toFixed(2)),
                                variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀',
                                x1: 240, y1: 170, x2: 240 + Math.round(radiusVal), y2: 170, lx: 240 + Math.round(radiusVal) + 15, ly: 170 + 20 * idx,
                            });
                        }
                    });
                }
            }

            setParseProgress(65);
            setParseStatusText('Melakukan OCR & text parsing...');

            // Fallback heuristics
            if (extractedDims.length === 0) {
                const nameLower = file.name.toLowerCase();
                if (nameLower.includes('shaft') || nameLower.includes('rod') || nameLower.includes('piston')) {
                    extractedDims = [
                        { id: `dim_sh_1_${Date.now()}`, label: 'Shaft Length (L)', spec: '240.0', tolMin: 239.5, tolMax: 240.5, variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 120, y1: 240, x2: 360, y2: 240, lx: 240, ly: 255 },
                        { id: `dim_sh_2_${Date.now()}`, label: 'Journal Diameter (d1)', spec: '35.0', tolMin: 34.98, tolMax: 35.02, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 120, y1: 135, x2: 120, y2: 205, lx: 95, ly: 170 },
                        { id: `dim_sh_3_${Date.now()}`, label: 'Chamfer Angle', spec: '45.0', tolMin: 44.0, tolMax: 46.0, variable: 'Meas_Angle', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 360, y1: 170, x2: 380, y2: 150, lx: 390, ly: 155, cx: 360, cy: 170, angleStart: -30, angleEnd: 0 },
                        { id: `dim_sh_4_${Date.now()}`, label: 'Surface Finish', spec: '0.8', tolMin: 0.0, tolMax: 1.6, variable: 'Meas_Ra', unit: 'μm', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 240, y1: 280, x2: 240, y2: 280, lx: 240, ly: 300 },
                    ];
                } else if (nameLower.includes('gear') || nameLower.includes('pinion') || nameLower.includes('wheel')) {
                    extractedDims = [
                        { id: `dim_gr_1_${Date.now()}`, label: 'Outer Pitch Diameter', spec: '150.0', tolMin: 149.8, tolMax: 150.2, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 120, y1: 80, x2: 360, y2: 80, lx: 240, ly: 65 },
                        { id: `dim_gr_2_${Date.now()}`, label: 'Center Hub Bore', spec: '30.0', tolMin: 29.95, tolMax: 30.05, variable: 'Meas_Bore', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 255, y2: 170, lx: 265, ly: 155 },
                        { id: `dim_gr_3_${Date.now()}`, label: 'Tooth Angle', spec: '20.0', tolMin: 19.5, tolMax: 20.5, variable: 'Meas_Angle', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 240, y1: 100, x2: 270, y2: 80, lx: 275, ly: 85, cx: 240, cy: 100, angleStart: -30, angleEnd: 0 },
                    ];
                } else {
                    extractedDims = [
                        { id: `dim_gen_1_${Date.now()}`, label: 'Dimension Height (H)', spec: '50.0', tolMin: 49.5, tolMax: 50.5, variable: 'Meas_Height', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 90, y1: 80, x2: 90, y2: 260, lx: 65, ly: 170 },
                        { id: `dim_gen_2_${Date.now()}`, label: 'Core Diameter', spec: '12.0', tolMin: 11.9, tolMax: 12.1, variable: 'Inner_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 255, y2: 170, lx: 260, ly: 155 },
                    ];
                }
            }

            setParseProgress(95);
            setParseStatusText('Membangun pemetaan koordinat interaktif...');

            setTimeout(() => {
                setParseProgress(100);
                setIsParsing(false);
                const newDwg = {
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint',
                    fileName: file.name,
                    fileType: extension.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: extractedDims,
                    dataUrl: dataUrl
                };
                
                saveDrawing(newDwg).then(saved => {
                    setDrawings(prev => [saved, ...prev]);
                    setSelectedDwgId(saved.id);
                    if (saved.dimensions?.length > 0) setActiveDimId(saved.dimensions[0].id);
                    else setActiveDimId('');
                    toast.success(`${file.name} berhasil disimpan ke database! Ditemukan ${extractedDims.length} parameter.`);
                }).catch(err => {
                    console.error(err);
                    toast.error('Gagal menyimpan file drawing baru ke database.');
                });
            }, 800);
        };
        reader.onerror = () => { setIsParsing(false); toast.error('Gagal membaca berkas.'); };
        if (extension === 'pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    // ─── Shared Custom Label Badge Renderer ───
    const renderLabelBadge = (dim, color, labelText, isActive) => {
        const size = dim.markerSize !== undefined ? dim.markerSize : 60;
        const shape = dim.markerShape || 'default';
        const catColor = getCategoryColor(dim.category || 'dimension');
        const lx = dim.lx ?? 250;
        const ly = dim.ly ?? 200;

        let shapeElement = null;
        let textYOffset = 3;

        if (shape === 'circle') {
            shapeElement = (
                <circle
                    cx={lx}
                    cy={ly}
                    r={size / 2}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                />
            );
        } else if (shape === 'square') {
            shapeElement = (
                <rect
                    x={lx - size / 2}
                    y={ly - size / 2}
                    width={size}
                    height={size}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                />
            );
        } else if (shape === 'triangle') {
            const h = size;
            const halfW = size / 2;
            const p1 = `${lx},${ly - h/2}`;
            const p2 = `${lx + halfW},${ly + h/2}`;
            const p3 = `${lx - halfW},${ly + h/2}`;
            shapeElement = (
                <polygon
                    points={`${p1} ${p2} ${p3}`}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeLinejoin="round"
                />
            );
            textYOffset = h / 4;
        } else {
            // Default rounded rect
            const w = Math.max(60, size * 1.3);
            const h = Math.max(20, size * 0.4);
            shapeElement = (
                <rect
                    x={lx - w / 2}
                    y={ly - h / 2}
                    width={w}
                    height={h}
                    rx={4}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                />
            );
        }

        // Active pulsing ring
        const activeRing = isActive ? (
            <g>
                {shape === 'circle' ? (
                    <circle cx={lx} cy={ly} r={size / 2 + 8} fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="r" values={`${size/2 + 2};${size/2 + 14};${size/2 + 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                ) : shape === 'square' ? (
                    <rect x={lx - size/2 - 8} y={ly - size/2 - 8} width={size + 16} height={size + 16} rx="4" fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="width" values={`${size + 4};${size + 20};${size + 4}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="height" values={`${size + 4};${size + 20};${size + 4}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="x" values={`${lx - size/2 - 2};${lx - size/2 - 10};${lx - size/2 - 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="y" values={`${ly - size/2 - 2};${ly - size/2 - 10};${ly - size/2 - 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </rect>
                ) : shape === 'triangle' ? (
                    <polygon points={`${lx},${ly - size/2 - 8} ${lx + size/2 + 8},${ly + size/2 + 4} ${lx - size/2 - 8},${ly + size/2 + 4}`} fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </polygon>
                ) : (
                    <rect x={lx - Math.max(60, size * 1.3)/2 - 8} y={ly - Math.max(20, size * 0.4)/2 - 8} width={Math.max(60, size * 1.3) + 16} height={Math.max(20, size * 0.4) + 16} rx="6" fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </rect>
                )}
            </g>
        ) : null;

        // Category badge (small badge offset depending on shape)
        let badgeX = lx + (shape === 'circle' ? size/2 - 5 : shape === 'square' ? size/2 - 2 : shape === 'triangle' ? size/2 - 5 : Math.max(60, size * 1.3)/2 + 2);
        let badgeY = ly - (shape === 'circle' ? size/2 - 5 : shape === 'square' ? size/2 - 2 : shape === 'triangle' ? -size/2 + 10 : Math.max(20, size * 0.4)/2 - 2);
        
        const categoryBadge = (
            <g>
                <rect x={badgeX} y={badgeY} width="16" height="12" rx="2" fill={catColor} fillOpacity="0.25" stroke={catColor} strokeWidth="0.5" />
                <text x={badgeX + 8} y={badgeY + 9} textAnchor="middle" fill={catColor} fontSize="7" fontWeight="bold">
                    {dim.gdt_symbol || getCategoryDef(dim.category).icon}
                </text>
            </g>
        );

        const fontSizeValue = Math.max(7, Math.min(12, size * 0.15));

        // Trigger indicator ⚡ badge
        const hasTriggers = (dim.triggers || []).length > 0;
        const isTriggered = triggeredActions[dim.id] !== undefined;
        const triggerBadgeX = badgeX + 18;
        const triggerBadgeY = badgeY;
        const triggerBadge = hasTriggers ? (
            <g>
                <rect x={triggerBadgeX} y={triggerBadgeY} width="16" height="12" rx="2" fill={isTriggered ? '#ef4444' : '#f59e0b'} fillOpacity={isTriggered ? 0.9 : 0.25} stroke={isTriggered ? '#ef4444' : '#f59e0b'} strokeWidth="0.5">
                    {isTriggered && <animate attributeName="fill-opacity" values="0.9;0.3;0.9" dur="0.6s" repeatCount="5" />}
                </rect>
                <text x={triggerBadgeX + 8} y={triggerBadgeY + 9} textAnchor="middle" fill={isTriggered ? '#ffffff' : '#f59e0b'} fontSize="7" fontWeight="bold">⚡</text>
            </g>
        ) : null;

        return (
            <g>
                {shapeElement}
                <text x={lx} y={ly + textYOffset} textAnchor="middle" fill={color} fontSize={fontSizeValue} fontWeight="bold">
                    {labelText}
                </text>
                {categoryBadge}
                {triggerBadge}
                {activeRing}
            </g>
        );
    };

    // ─── Canvas Indicator Renderers ───
    const renderDimensionIndicators = (dims) => {
        return dims.map((dim) => {
            const isActive = dim.id === activeDimId;
            const x1 = dim.x1 ?? 150, y1 = dim.y1 ?? 180;
            const x2 = dim.x2 ?? 350, y2 = dim.y2 ?? 180;
            const lx = dim.lx ?? 250, ly = dim.ly ?? 200;
            const indicatorType = dim.indicatorType || 'horizontal';

            // Simulation value
            const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            const valStatus = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
            const color = getStatusColor(valStatus, isActive);

            const labelText = `${dim.gdt_symbol || ''}${dim.gdt_symbol ? ' ' : ''}${dim.spec}`;
            const strokeW = isActive ? 2.5 : 1.5;

            if (indicatorType === 'horizontal') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <line x1={x1} y1={y1} x2={x1} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={x2} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x1 + 8} y1={ly - 5} x2={x2 - 8} y2={ly - 5} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${x1},${ly - 5} ${x1+10},${ly - 8} ${x1+10},${ly - 2}`} fill={color} />
                        <polygon points={`${x2},${ly - 5} ${x2-10},${ly - 8} ${x2-10},${ly - 2}`} fill={color} />
                        {renderLabelBadge(dim, color, labelText, isActive)}
                    </g>
                );
            } else if (indicatorType === 'vertical') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <line x1={x1} y1={y1} x2={lx} y2={y1} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={lx} y2={y2} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={lx - 5} y1={y1 + 8} x2={lx - 5} y2={y2 - 8} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${lx - 5},${y1} ${lx - 8},${y1+10} ${lx - 2},${y1+10}`} fill={color} />
                        <polygon points={`${lx - 5},${y2} ${lx - 8},${y2-10} ${lx - 2},${y2-10}`} fill={color} />
                        {renderLabelBadge(dim, color, labelText, isActive)}
                    </g>
                );
            } else if (indicatorType === 'arc') {
                // Arc indicator for angles
                const cx = dim.cx ?? lx;
                const cy = dim.cy ?? ly;
                const arcRadius = 25;
                const startAngle = (dim.angleStart ?? 0) * (Math.PI / 180);
                const endAngle = (dim.angleEnd ?? 90) * (Math.PI / 180);
                const sx = cx + arcRadius * Math.cos(startAngle);
                const sy = cy + arcRadius * Math.sin(startAngle);
                const ex = cx + arcRadius * Math.cos(endAngle);
                const ey = cy + arcRadius * Math.sin(endAngle);
                const largeArc = Math.abs((dim.angleEnd ?? 90) - (dim.angleStart ?? 0)) > 180 ? 1 : 0;
                const sweepFlag = (dim.angleEnd ?? 90) > (dim.angleStart ?? 0) ? 1 : 0;

                // Reference lines from center
                const lineLen = 40;
                const lsx = cx + lineLen * Math.cos(startAngle);
                const lsy = cy + lineLen * Math.sin(startAngle);
                const lex = cx + lineLen * Math.cos(endAngle);
                const ley = cy + lineLen * Math.sin(endAngle);

                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        {/* Reference lines */}
                        <line x1={cx} y1={cy} x2={lsx} y2={lsy} stroke={color} strokeWidth="1" strokeDasharray="4,2" />
                        <line x1={cx} y1={cy} x2={lex} y2={ley} stroke={color} strokeWidth="1" strokeDasharray="4,2" />
                        {/* Arc */}
                        <path d={`M ${sx},${sy} A ${arcRadius},${arcRadius} 0 ${largeArc},${sweepFlag} ${ex},${ey}`} fill="none" stroke={color} strokeWidth={strokeW} />
                        {/* Arrow tips */}
                        <circle cx={sx} cy={sy} r="2.5" fill={color} />
                        <circle cx={ex} cy={ey} r="2.5" fill={color} />
                        {renderLabelBadge(dim, color, `∠ ${dim.spec}°`, isActive)}
                    </g>
                );
            } else if (indicatorType === 'area_box') {
                // Dashed rectangle area indicator
                const bx = Math.min(x1, x2);
                const by = Math.min(y1, y2);
                const bw = Math.abs(x2 - x1);
                const bh = Math.abs(y2 - y1);
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <rect x={bx} y={by} width={bw} height={bh} fill={color} fillOpacity="0.06" stroke={color} strokeWidth={strokeW} strokeDasharray="6,3" rx="2" />
                        {/* Cross-hatch */}
                        <line x1={bx} y1={by} x2={bx + bw} y2={by + bh} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
                        <line x1={bx + bw} y1={by} x2={bx} y2={by + bh} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
                        {renderLabelBadge(dim, color, `▢ ${dim.spec} {dim.unit}`, isActive)}
                    </g>
                );
            } else if (indicatorType === 'callout') {
                // Surface roughness / custom callout
                const symbolChar = dim.gdt_symbol || '';
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        {/* Leader line */}
                        <line x1={x1} y1={y1} x2={lx} y2={ly - 14} stroke={color} strokeWidth="1" />
                        <circle cx={x1} cy={y1} r="3" fill="none" stroke={color} strokeWidth="1.5" />
                        {/* Roughness symbol (triangle) */}
                        {dim.category === 'roughness' && (
                            <g>
                                <path d={`M ${lx - 8},${ly + 8} L ${lx},${ly - 6} L ${lx + 8},${ly + 8}`} fill="none" stroke={color} strokeWidth="1.5" />
                                <line x1={lx - 12} y1={ly + 8} x2={lx + 12} y2={ly + 8} stroke={color} strokeWidth="1" />
                            </g>
                        )}
                        {renderLabelBadge(dim, color, `${symbolChar} ${dim.spec} ${dim.unit}`, isActive)}
                    </g>
                );
            } else {
                // Radial / pointer (default for diameter, radius, custom)
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <path d={`M ${x1},${y1} L ${x2},${y2} L ${lx},${ly}`} fill="none" stroke={color} strokeWidth={strokeW} />
                        {(() => {
                            const angle = Math.atan2(y2 - y1, x2 - x1);
                            const arrowLength = 10;
                            const ax1 = x1 + arrowLength * Math.cos(angle - 0.25);
                            const ay1 = y1 + arrowLength * Math.sin(angle - 0.25);
                            const ax2 = x1 + arrowLength * Math.cos(angle + 0.25);
                            const ay2 = y1 + arrowLength * Math.sin(angle + 0.25);
                            return <polygon points={`${x1},${y1} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} />;
                        })()}
                        {renderLabelBadge(dim, color, labelText, isActive)}
                    </g>
                );
            }
        });
    };

    // ─── Label helper ───
    const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none', fontFamily: "'Inter', sans-serif", transition: 'border-color 0.2s' };
    const selectStyle = { ...inputStyle, backgroundColor: 'white', cursor: 'pointer' };
    const labelStyle = { display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.03em' };
    const mgmtItemStyle = {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 16px',
        border: 'none',
        background: 'none',
        width: '100%',
        textAlign: 'left',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#334155',
        cursor: 'pointer',
        transition: 'background-color 0.2s'
    };

    // Group dimensions by category for the sidebar list
    const groupedDims = {};
    (selectedDwg?.dimensions || []).forEach(dim => {
        const cat = dim.category || 'dimension';
        if (!groupedDims[cat]) groupedDims[cat] = [];
        groupedDims[cat].push(dim);
    });

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div style={{ padding: '12px 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '7px', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center' }}>
                            <Ruler size={22} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>Drawing & CAD Blueprint Manager</h2>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bfdbfe' }}>
                            <Zap size={11} /> GD&T Enterprise
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Active Blueprint Selector Combo Box */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                            value={selectedDwgId}
                            onChange={(e) => {
                                const id = e.target.value;
                                setSelectedDwgId(id);
                                const dwg = drawings.find(d => d.id === id);
                                if (dwg) {
                                    if (dwg.dimensions && dwg.dimensions.length > 0) {
                                        setActiveDimId(dwg.dimensions[0].id);
                                    } else {
                                        setActiveDimId('');
                                    }
                                } else {
                                    setActiveDimId('');
                                }
                            }}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: 'white',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                color: '#1e293b',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '180px',
                                maxWidth: '240px',
                                textOverflow: 'ellipsis',
                                overflow: 'hidden',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {drawings.length === 0 ? (
                                <option value="">Tidak Ada Blueprint</option>
                            ) : (
                                drawings.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))
                            )}
                        </select>
                    </div>

                    {/* Compact Upload Button */}
                    <div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept=".svg,.dxf,.pdf"
                        />
                        {isParsing ? (
                            <button
                                disabled
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #bfdbfe',
                                    backgroundColor: '#eff6ff',
                                    color: '#2563eb',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid #2563eb', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                                {parseProgress}%
                            </button>
                        ) : (
                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    padding: '8px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1',
                                    backgroundColor: '#f8fafc',
                                    color: '#334155',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                            >
                                Unggah
                            </button>
                        )}
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </div>

                    {/* Drawing Management Dropdown Menu */}
                    <div style={{ position: 'relative' }} ref={mgmtMenuRef}>
                        <button
                            onClick={() => setShowMgmtMenu(!showMgmtMenu)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                border: '1px solid #cbd5e1', backgroundColor: '#f8fafc',
                                color: '#334155', padding: '8px 14px', borderRadius: '8px',
                                fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
                                transition: 'all 0.2s', outline: 'none'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                        >
                            Manajemen Drawing <ChevronDown size={12} />
                        </button>
                        {showMgmtMenu && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                padding: '6px 0', zIndex: 100, width: '200px', display: 'flex', flexDirection: 'column'
                            }}>
                                <button
                                    onClick={handleCreateBlankDrawing}
                                    style={mgmtItemStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Plus size={13} color="#2563eb" /> Buat Blueprint Baru
                                </button>
                                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                                <button
                                    onClick={handleExportSchema}
                                    style={mgmtItemStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Database size={13} color="#2563eb" /> Ekspor Skema (.json)
                                </button>
                                <button
                                    onClick={() => fileSchemaRef.current.click()}
                                    style={mgmtItemStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Upload size={13} color="#10b981" /> Impor Skema (.json)
                                </button>
                                <input
                                    type="file"
                                    ref={fileSchemaRef}
                                    style={{ display: 'none' }}
                                    accept=".json"
                                    onChange={handleImportSchema}
                                />
                                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />
                                <button
                                    onClick={handleResetToDefault}
                                    style={mgmtItemStyle}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <RefreshCw size={13} color="#f59e0b" /> Reset ke Default
                                </button>
                                <button
                                    onClick={handleClearAllDrawings}
                                    style={{ ...mgmtItemStyle, color: '#ef4444' }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                    <Trash2 size={13} color="#ef4444" /> Hapus Semua Gambar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, padding: '0 24px 24px 24px', display: 'grid', gridTemplateColumns: '300px 1fr 340px', gap: '20px', overflow: 'hidden' }}>
                    
                    {/* Left Panel: Copilot AI */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                            borderRadius: '12px',
                            border: '1px solid #312e81',
                            boxShadow: '0 0 15px rgba(99, 102, 241, 0.15)',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            {/* Decorative background glow */}
                            <div style={{
                                position: 'absolute', top: '-40px', right: '-40px',
                                width: '100px', height: '100px', borderRadius: '50%',
                                backgroundColor: 'rgba(99, 102, 241, 0.15)', filter: 'blur(30px)',
                                pointerEvents: 'none'
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.2rem', animation: 'sparkle 2s ease-in-out infinite' }}>🤖</span>
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, color: '#e2e8f0', letterSpacing: '0.02em' }}>
                                        Copilot AI CAD Generator
                                    </h3>
                                </div>
                                <span style={{
                                    fontSize: '0.55rem', fontWeight: 800, padding: '2px 6px',
                                    borderRadius: '6px', backgroundColor: '#312e81', color: '#818cf8',
                                    border: '1px solid #4338ca'
                                }}>
                                    BETA
                                </span>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.68rem', color: '#94a3b8', lineHeight: '1.4' }}>
                                Ketik prompt gambar 2D yang ingin Anda buat beserta ukurannya (misal: Flens ⌀150 dengan lubang tengah ⌀40).
                            </p>

                            <textarea
                                value={copilotPrompt}
                                onChange={(e) => setCopilotPrompt(e.target.value)}
                                disabled={copilotLoading}
                                placeholder="Contoh: Buat ring flens diameter 150mm, lubang tengah 40mm, dan 6 lubang baut..."
                                rows={2}
                                style={{
                                    width: '100%', padding: '8px 10px', borderRadius: '8px',
                                    border: '1px solid #334155', backgroundColor: '#0f172a',
                                    color: '#f8fafc', fontSize: '0.72rem', outline: 'none',
                                    resize: 'none', fontFamily: "'Inter', sans-serif",
                                    transition: 'border-color 0.2s',
                                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAIGenerate();
                                    }
                                }}
                            />

                            {copilotLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '6px 0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#818cf8', fontWeight: 800 }}>
                                        <span>{copilotLog}</span>
                                        <span>{copilotProgress}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', backgroundColor: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${copilotProgress}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.3s ease' }} />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button
                                        onClick={handleAIGenerate}
                                        style={{
                                            padding: '8px 12px',
                                            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                                            color: 'white', border: 'none', borderRadius: '8px',
                                            fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            gap: '6px', boxShadow: '0 4px 10px rgba(79, 70, 229, 0.3)',
                                            transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Zap size={12} fill="white" /> Generasikan Model CAD
                                    </button>

                                    {/* Prompt Suggestions */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Rekomendasi Prompt:</span>
                                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                            {[
                                                { label: '⌀160 Flange', text: 'Buat flens bundar diameter 160mm dengan lubang tengah 50mm dan 8 lubang baut' },
                                                { label: 'Shaft Poros', text: 'Buat poros shaft dengan panjang total 220mm, diameter utama 40mm dan bearing journal 25mm' },
                                                { label: 'Bracket Plate', text: 'Buat pelat braket kustom dengan ukuran 150x100mm dan mounting hole 4 lubang' }
                                            ].map((sug, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCopilotPrompt(sug.text)}
                                                    style={{
                                                        border: '1px solid #334155', backgroundColor: 'transparent',
                                                        color: '#94a3b8', fontSize: '0.62rem', padding: '3px 6px',
                                                        borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#4f46e5'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#334155'; }}
                                                >
                                                    {sug.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <style>{`
                                @keyframes sparkle {
                                    0%, 100% { transform: scale(1); filter: drop-shadow(0 0 2px rgba(99, 102, 241, 0.4)); }
                                    50% { transform: scale(1.1); filter: drop-shadow(0 0 8px rgba(99, 102, 241, 0.8)); }
                                }
                            `}</style>
                        </div>

                        {/* MANUAL BLANK BLUEPRINT CARD */}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            padding: '14px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.2rem' }}>➕</span>
                                <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                                    Desain Manual Kanvas Kosong
                                </h3>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.68rem', color: '#64748b', lineHeight: '1.4' }}>
                                Mulai dari kanvas kosong untuk menggambar garis, lingkaran, teks, menyisipkan gambar, dan memetakan dimensi parameter secara manual.
                            </p>
                            <button
                                onClick={handleCreateBlankDrawing}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: '#2563eb',
                                    color: 'white', border: 'none', borderRadius: '8px',
                                    fontWeight: 800, cursor: 'pointer', fontSize: '0.72rem',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '6px', transition: 'background-color 0.2s',
                                    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                            >
                                <Plus size={12} /> Buat Blueprint Baru
                            </button>
                        </div>
                    </div>
                    
                    {/* Interactive Editor Canvas */}
                    <div style={{ backgroundColor: '#0b1d33', borderRadius: '16px', border: '1px solid #1e3a8a', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                        
                        {/* Canvas toolbar */}
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                CAD Canvas View
                            </span>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.62rem', color: '#94a3b8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981' }}></span>PASS</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#ef4444' }}></span>FAIL</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>ACTIVE</span>
                            </div>
                        </div>

                        {/* AutoCAD Premium Toolbar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '8px 16px',
                            backgroundColor: '#0f172a',
                            borderBottom: '1px solid #1e3a8a',
                            flexWrap: 'wrap',
                            zIndex: 10
                        }}>
                            {/* Tool selection buttons */}
                            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <button
                                    title="Select / Move Hotspot"
                                    onClick={() => setCadTool('select')}
                                    style={{
                                        background: cadTool === 'select' ? '#2563eb' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <MousePointer size={16} />
                                </button>
                                <button
                                    title="Line Tool"
                                    onClick={() => setCadTool('line')}
                                    style={{
                                        background: cadTool === 'line' ? '#2563eb' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Slash size={16} />
                                </button>
                                <button
                                    title="Circle Tool"
                                    onClick={() => setCadTool('circle')}
                                    style={{
                                        background: cadTool === 'circle' ? '#2563eb' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Circle size={16} />
                                </button>
                                <button
                                    title="Rectangle Tool"
                                    onClick={() => setCadTool('rect')}
                                    style={{
                                        background: cadTool === 'rect' ? '#2563eb' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Square size={16} />
                                </button>
                                <button
                                    title="Text Tool"
                                    onClick={() => setCadTool('text')}
                                    style={{
                                        background: cadTool === 'text' ? '#2563eb' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Type size={16} />
                                </button>
                                <button
                                    title="Eraser Tool"
                                    onClick={() => setCadTool('erase')}
                                    style={{
                                        background: cadTool === 'erase' ? '#ef4444' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <Eraser size={16} />
                                </button>
                                <button
                                    title="Insert Image / Sisipkan Gambar"
                                    onClick={() => {
                                        setCadTool('image');
                                        if (imageInsertRef.current) {
                                            imageInsertRef.current.click();
                                        }
                                    }}
                                    style={{
                                        background: cadTool === 'image' ? '#10b981' : 'transparent',
                                        border: 'none',
                                        color: 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                >
                                    <ImagePlus size={16} />
                                </button>
                            </div>

                            {/* Color swatches */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Color:</span>
                                {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setCadColor(color)}
                                        style={{
                                            width: '16px',
                                            height: '16px',
                                            borderRadius: '50%',
                                            backgroundColor: color,
                                            border: cadColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.3)',
                                            cursor: 'pointer',
                                            padding: 0,
                                            boxShadow: cadColor === color ? '0 0 8px ' + color : 'none',
                                            transition: 'all 0.2s'
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Line width */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Width: {cadWidth}px</span>
                                <input
                                    type="range"
                                    min="1"
                                    max="8"
                                    value={cadWidth}
                                    onChange={(e) => setCadWidth(parseInt(e.target.value))}
                                    style={{ width: '60px', accentColor: '#2563eb', cursor: 'pointer' }}
                                />
                            </div>

                            {/* Magnet Grid Snap */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <button
                                    title="Toggle Grid Snapping (10px)"
                                    onClick={() => setGridSnap(!gridSnap)}
                                    style={{
                                        background: gridSnap ? '#10b981' : 'transparent',
                                        border: gridSnap ? 'none' : '1px solid #475569',
                                        color: 'white',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <Magnet size={12} />
                                    Snap
                                </button>
                            </div>

                            {/* History controls (Undo/Redo) */}
                            <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <button
                                    title="Undo"
                                    disabled={undoStack.length === 0}
                                    onClick={handleUndo}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: undoStack.length === 0 ? '#475569' : 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => { if (undoStack.length > 0) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <Undo size={16} />
                                </button>
                                <button
                                    title="Redo"
                                    disabled={redoStack.length === 0}
                                    onClick={handleRedo}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: redoStack.length === 0 ? '#475569' : 'white',
                                        padding: '6px',
                                        borderRadius: '4px',
                                        cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => { if (redoStack.length > 0) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <Redo size={16} />
                                </button>
                            </div>

                            {/* Zoom controls */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRight: '1px solid #334155', paddingRight: '12px' }}>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 800 }}>Zoom:</span>
                                <button
                                    title="Zoom Out"
                                    onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.2) * 10) / 10))}
                                    style={{
                                        background: 'transparent', border: '1px solid #475569', color: 'white',
                                        width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}
                                >
                                    -
                                </button>
                                <span style={{ color: 'white', fontSize: '0.68rem', fontWeight: 800, minWidth: '35px', textAlign: 'center' }}>
                                    {Math.round(zoom * 100)}%
                                </span>
                                <button
                                    title="Zoom In"
                                    onClick={() => setZoom(z => Math.min(3.0, Math.round((z + 0.2) * 10) / 10))}
                                    style={{
                                        background: 'transparent', border: '1px solid #475569', color: 'white',
                                        width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold'
                                    }}
                                >
                                    +
                                </button>
                                <button
                                    title="Reset Zoom"
                                    onClick={() => setZoom(1.0)}
                                    style={{
                                        background: 'transparent', border: '1px solid #475569', color: '#94a3b8',
                                        padding: '1px 6px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                >
                                    1:1
                                </button>
                            </div>

                            {/* Clear all overlay vectors button */}
                            <button
                                title="Clear Custom CAD Overlay"
                                onClick={() => {
                                    if (window.confirm('Hapus semua coretan/gambar CAD kustom di blueprint ini?')) {
                                        updateShapes([]);
                                    }
                                }}
                                style={{
                                    marginLeft: 'auto',
                                    background: 'transparent',
                                    border: '1px solid #ef4444',
                                    color: '#fca5a5',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <Trash2 size={12} />
                                Reset CAD
                            </button>
                        </div>

                        {/* Hidden image input for canvas image insertion */}
                        <input
                            ref={imageInsertRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,image/gif,image/bmp"
                            onChange={handleImageInsert}
                            style={{ display: 'none' }}
                        />

                        {/* Canvas SVG */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', width: '100%', minHeight: 0 }}>
                            <svg
                                ref={svgRef}
                                viewBox="0 0 500 360"
                                onMouseDown={handleSvgMouseDown}
                                onMouseMove={handleSvgMouseMove}
                                onMouseUp={handleSvgMouseUp}
                                onClick={handleCanvasClick}
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    width: 'auto',
                                    height: 'auto',
                                    aspectRatio: '500 / 360',
                                    cursor: dragImageShape
                                        ? 'grabbing'
                                        : (cadTool === 'select'
                                            ? (activeDim ? 'crosshair' : 'default')
                                            : (cadTool === 'erase' ? 'pointer' : 'crosshair'))
                                }}
                            >
                                <defs>
                                    <pattern id="canvas_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.25" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#canvas_grid)" />
                                <rect x="5" y="5" width="490" height="350" fill="none" stroke="#1e40af" strokeWidth="1" />
                                <rect x="8" y="8" width="484" height="344" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.5" />

                                {selectedDwg && selectedDwg.fileType === 'PDF' && selectedDwg.dataUrl && (
                                    <foreignObject x="0" y="0" width="500" height="360" style={{ pointerEvents: 'none' }}>
                                        <iframe
                                            src={`${selectedDwg.dataUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                                            style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                            title="PDF Blueprint Backdrop"
                                        />
                                    </foreignObject>
                                )}

                                <g transform={`translate(250, 180) scale(${zoom}) translate(-250, -180)`}>
                                    {/* Blueprint backdrop */}
                                    {selectedDwgId === 'dwg_flange_connector' ? (
                                        <>
                                            <g transform="translate(10, 0)">
                                                <circle cx="140" cy="180" r="90" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                                <circle cx="140" cy="180" r="65" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" />
                                                <circle cx="140" cy="180" r="30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                                <line x1="140" y1="75" x2="140" y2="285" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                                <line x1="35" y1="180" x2="245" y2="180" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                                                    const rad = (angle * Math.PI) / 180;
                                                    const bx = 140 + 65 * Math.cos(rad);
                                                    const by = 180 + 65 * Math.sin(rad);
                                                    return <circle key={idx} cx={bx} cy={by} r="8" fill="none" stroke="#3b82f6" strokeWidth="1" />;
                                                })}
                                            </g>
                                            <g transform="translate(300, 0)">
                                                <line x1="100" y1="65" x2="100" y2="295" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                                <path d="M 40,110 L 100,110 L 100,140 L 90,140 L 90,220 L 100,220 L 100,250 L 40,250 L 40,220 L 15,220 L 15,140 L 40,140 Z" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                                                <path d="M 40,120 L 50,110 M 40,140 L 70,110 M 40,160 L 90,110 M 40,180 L 100,120 M 40,200 L 100,140 M 45,210 L 100,155 M 65,210 L 100,175" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.4" />
                                            </g>
                                        </>
                                    ) : selectedDwgId === 'dwg_hydraulic_cylinder' ? (
                                        <g transform="translate(40, 20)">
                                            <rect x="60" y="100" width="220" height="120" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                            <rect x="280" y="130" width="140" height="60" fill="none" stroke="#60a5fa" strokeWidth="2" />
                                            <circle cx="435" cy="160" r="15" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                            <line x1="20" y1="160" x2="450" y2="160" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                        </g>
                                    ) : null}

                                    {/* Dynamic Indicators */}
                                    {selectedDwg && renderDimensionIndicators(selectedDwg.dimensions)}

                                    {/* Custom CAD Drawing Overlay */}
                                    {selectedDwg && (selectedDwg.shapes || []).map((shape) => {
                                        const handleShapeClick = (e) => {
                                            if (cadTool === 'erase') {
                                                e.stopPropagation();
                                                const currentShapes = selectedDwg.shapes || [];
                                                updateShapes(currentShapes.filter(s => s.id !== shape.id));
                                                toast.success('Bentuk terhapus', { id: 'erase-shape' });
                                            } else if (cadTool === 'select' && shape.type === 'image') {
                                                e.stopPropagation();
                                            }
                                        };
                                        
                                        const shapeProps = {
                                            key: shape.id,
                                            stroke: shape.color,
                                            strokeWidth: shape.strokeWidth || shape.width || 2,
                                            onClick: handleShapeClick,
                                            style: {
                                                cursor: cadTool === 'erase' ? 'pointer' : 'default',
                                                transition: 'all 0.1s'
                                            },
                                            onMouseEnter: (e) => {
                                                if (cadTool === 'erase') {
                                                    e.currentTarget.style.stroke = '#ef4444';
                                                    e.currentTarget.style.strokeDasharray = '4,2';
                                                }
                                            },
                                            onMouseLeave: (e) => {
                                                e.currentTarget.style.stroke = shape.color;
                                                e.currentTarget.style.strokeDasharray = 'none';
                                            }
                                        };
                                        
                                        if (shape.type === 'line') {
                                            return (
                                                <line
                                                    {...shapeProps}
                                                    x1={shape.x1}
                                                    y1={shape.y1}
                                                    x2={shape.x2}
                                                    y2={shape.y2}
                                                />
                                            );
                                        } else if (shape.type === 'circle') {
                                            return (
                                                <circle
                                                    {...shapeProps}
                                                    cx={shape.cx}
                                                    cy={shape.cy}
                                                    r={shape.r}
                                                    fill="none"
                                                />
                                            );
                                        } else if (shape.type === 'rect') {
                                            return (
                                                <rect
                                                    {...shapeProps}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    width={shape.w}
                                                    height={shape.h}
                                                    fill="none"
                                                />
                                            );
                                        } else if (shape.type === 'text') {
                                            return (
                                                <text
                                                    key={shape.id}
                                                    x={shape.x}
                                                    y={shape.y}
                                                    fill={shape.color}
                                                    fontSize={shape.fontSize || 14}
                                                    onClick={handleShapeClick}
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                    style={{
                                                        cursor: cadTool === 'erase' ? 'pointer' : 'default',
                                                        fontFamily: 'monospace',
                                                        fontWeight: 'bold',
                                                        userSelect: 'none'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (cadTool === 'erase') {
                                                            e.currentTarget.style.fill = '#ef4444';
                                                        }
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.fill = shape.color;
                                                    }}
                                                >
                                                    {shape.text}
                                                </text>
                                            );
                                        } else if (shape.type === 'image') {
                                            const isDraggingThis = dragImageShape && dragImageShape.id === shape.id;
                                            const displayX = isDraggingThis ? dragImageShape.currentX : shape.x;
                                            const displayY = isDraggingThis ? dragImageShape.currentY : shape.y;
                                            const displayW = isDraggingThis ? dragImageShape.currentW : shape.w;
                                            const displayH = isDraggingThis ? dragImageShape.currentH : shape.h;
                                            
                                            const defaultCrop = { x: 0, y: 0, w: shape.naturalWidth || shape.w, h: shape.naturalHeight || shape.h };
                                            const crop = isDraggingThis && dragImageShape.currentCrop ? dragImageShape.currentCrop : (shape.crop || defaultCrop);
                                            const natW = shape.naturalWidth || shape.w;
                                            const natH = shape.naturalHeight || shape.h;

                                            const isSelected = selectedShapeId === shape.id;

                                            return (
                                                <g key={shape.id}>
                                                    {/* Cropped Image using nested <svg> viewport */}
                                                    <svg
                                                        x={displayX}
                                                        y={displayY}
                                                        width={displayW}
                                                        height={displayH}
                                                        viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
                                                        preserveAspectRatio="none"
                                                        opacity={shape.opacity || 0.85}
                                                        onClick={(e) => {
                                                            if (cadTool === 'erase') {
                                                                handleShapeClick(e);
                                                            } else if (cadTool === 'select') {
                                                                e.stopPropagation();
                                                                setSelectedShapeId(shape.id);
                                                            }
                                                        }}
                                                        onMouseDown={(e) => {
                                                            if (cadTool !== 'select') return;
                                                            e.stopPropagation();
                                                            e.preventDefault();
                                                            const coords = getCanvasCoords(e);
                                                            setSelectedShapeId(shape.id);
                                                            setDragImageShape({
                                                                id: shape.id,
                                                                type: 'move',
                                                                startX: coords.x,
                                                                startY: coords.y,
                                                                offsetX: coords.x - shape.x,
                                                                offsetY: coords.y - shape.y,
                                                                startShape: shape,
                                                                currentX: shape.x,
                                                                currentY: shape.y,
                                                                currentW: shape.w,
                                                                currentH: shape.h,
                                                                currentCrop: crop
                                                            });
                                                        }}
                                                        style={{
                                                            cursor: cadTool === 'erase'
                                                                ? 'pointer'
                                                                : (cadTool === 'select' ? (isDraggingThis ? 'grabbing' : 'grab') : 'default'),
                                                            transition: isDraggingThis ? 'none' : 'opacity 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (cadTool === 'erase') {
                                                                e.currentTarget.style.opacity = '0.3';
                                                                e.currentTarget.style.outline = '2px dashed #ef4444';
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.opacity = shape.opacity || 0.85;
                                                            e.currentTarget.style.outline = 'none';
                                                        }}
                                                    >
                                                        <image
                                                            href={shape.src}
                                                            x="0"
                                                            y="0"
                                                            width={natW}
                                                            height={natH}
                                                        />
                                                    </svg>
                                                    
                                                    {/* Image border indicator */}
                                                    <rect
                                                        x={displayX}
                                                        y={displayY}
                                                        width={displayW}
                                                        height={displayH}
                                                        fill="none"
                                                        stroke={isSelected ? "#8b5cf6" : "#3b82f680"}
                                                        strokeWidth={isSelected ? "1.5" : "0.5"}
                                                        strokeDasharray={isSelected ? "none" : "4,2"}
                                                        pointerEvents="none"
                                                    />

                                                    {/* Selected overlay handles */}
                                                    {isSelected && cadTool === 'select' && (
                                                        <>
                                                            {/* Corner Resize Handles */}
                                                            {/* Top-Left */}
                                                            <rect
                                                                x={displayX - 4}
                                                                y={displayY - 4}
                                                                width="8"
                                                                height="8"
                                                                fill="white"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="1.5"
                                                                style={{ cursor: 'nwse-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'resize-tl',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Top-Right */}
                                                            <rect
                                                                x={displayX + displayW - 4}
                                                                y={displayY - 4}
                                                                width="8"
                                                                height="8"
                                                                fill="white"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="1.5"
                                                                style={{ cursor: 'nesw-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'resize-tr',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Bottom-Left */}
                                                            <rect
                                                                x={displayX - 4}
                                                                y={displayY + displayH - 4}
                                                                width="8"
                                                                height="8"
                                                                fill="white"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="1.5"
                                                                style={{ cursor: 'nesw-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'resize-bl',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Bottom-Right */}
                                                            <rect
                                                                x={displayX + displayW - 4}
                                                                y={displayY + displayH - 4}
                                                                width="8"
                                                                height="8"
                                                                fill="white"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="1.5"
                                                                style={{ cursor: 'nwse-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'resize-br',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />

                                                            {/* Edge Crop Handles */}
                                                            {/* Top Crop */}
                                                            <rect
                                                                x={displayX + displayW / 2 - 8}
                                                                y={displayY - 3}
                                                                width="16"
                                                                height="4"
                                                                fill="#1e293b"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="0.5"
                                                                style={{ cursor: 'ns-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'crop-t',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Bottom Crop */}
                                                            <rect
                                                                x={displayX + displayW / 2 - 8}
                                                                y={displayY + displayH - 1}
                                                                width="16"
                                                                height="4"
                                                                fill="#1e293b"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="0.5"
                                                                style={{ cursor: 'ns-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'crop-b',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Left Crop */}
                                                            <rect
                                                                x={displayX - 3}
                                                                y={displayY + displayH / 2 - 8}
                                                                width="4"
                                                                height="16"
                                                                fill="#1e293b"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="0.5"
                                                                style={{ cursor: 'ew-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'crop-l',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />
                                                            {/* Right Crop */}
                                                            <rect
                                                                x={displayX + displayW - 1}
                                                                y={displayY + displayH / 2 - 8}
                                                                width="4"
                                                                height="16"
                                                                fill="#1e293b"
                                                                stroke="#8b5cf6"
                                                                strokeWidth="0.5"
                                                                style={{ cursor: 'ew-resize' }}
                                                                onMouseDown={(e) => {
                                                                    e.stopPropagation();
                                                                    e.preventDefault();
                                                                    const coords = getCanvasCoords(e);
                                                                    setDragImageShape({
                                                                        id: shape.id,
                                                                        type: 'crop-r',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: shape,
                                                                        currentX: shape.x,
                                                                        currentY: shape.y,
                                                                        currentW: shape.w,
                                                                        currentH: shape.h,
                                                                        currentCrop: crop
                                                                    });
                                                                }}
                                                            />

                                                            {/* Contextual Toolbar */}
                                                            <foreignObject
                                                                x={displayX}
                                                                y={displayY - 26 > 5 ? displayY - 26 : displayY + displayH + 5}
                                                                width="240"
                                                                height="24"
                                                            >
                                                                <div style={{
                                                                    display: 'flex',
                                                                    gap: '4px',
                                                                    backgroundColor: '#0f172ae6',
                                                                    border: '1px solid #8b5cf6',
                                                                    borderRadius: '4px',
                                                                    padding: '2px 4px',
                                                                    alignItems: 'center',
                                                                    width: 'max-content',
                                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                                                                    fontFamily: "'Inter', sans-serif"
                                                                }}>
                                                                    <span style={{ fontSize: '0.55rem', color: '#a78bfa', fontWeight: 800, padding: '0 2px' }}>GAMBAR</span>
                                                                    <button
                                                                        onClick={(ev) => {
                                                                            ev.stopPropagation();
                                                                            const currentShapes = selectedDwg.shapes || [];
                                                                            const updated = currentShapes.map(s => {
                                                                                if (s.id === shape.id) {
                                                                                    return {
                                                                                        ...s,
                                                                                        crop: { x: 0, y: 0, w: s.naturalWidth || s.w, h: s.naturalHeight || s.h }
                                                                                    };
                                                                                }
                                                                                return s;
                                                                            });
                                                                            updateShapes(updated);
                                                                            toast.success('Crop direset ke ukuran penuh.');
                                                                        }}
                                                                        style={{
                                                                            background: '#312e81', border: 'none', color: '#c084fc', cursor: 'pointer',
                                                                            padding: '1px 5px', fontSize: '0.55rem', fontWeight: 'bold', borderRadius: '3px',
                                                                            transition: 'background-color 0.1s'
                                                                        }}
                                                                        onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#3730a3'}
                                                                        onMouseLeave={ev => ev.currentTarget.style.backgroundColor = '#312e81'}
                                                                    >
                                                                        Reset Crop
                                                                    </button>
                                                                    <button
                                                                        onClick={(ev) => {
                                                                            ev.stopPropagation();
                                                                            const currentShapes = selectedDwg.shapes || [];
                                                                            updateShapes(currentShapes.filter(s => s.id !== shape.id));
                                                                            setSelectedShapeId(null);
                                                                            toast.success('Gambar berhasil dihapus.');
                                                                        }}
                                                                        style={{
                                                                            background: '#7f1d1d', border: 'none', color: '#fca5a5', cursor: 'pointer',
                                                                            padding: '1px 5px', fontSize: '0.55rem', fontWeight: 'bold', borderRadius: '3px',
                                                                            transition: 'background-color 0.1s'
                                                                        }}
                                                                        onMouseEnter={ev => ev.currentTarget.style.backgroundColor = '#991b1b'}
                                                                        onMouseLeave={ev => ev.currentTarget.style.backgroundColor = '#7f1d1d'}
                                                                    >
                                                                        Hapus
                                                                    </button>
                                                                </div>
                                                            </foreignObject>
                                                        </>
                                                    )}

                                                    {/* Label badge (only show if not selected to reduce clutter) */}
                                                    {!isSelected && (
                                                        <>
                                                            <rect
                                                                x={displayX}
                                                                y={displayY - 11}
                                                                width={Math.min(shape.fileName?.length * 4.5 + 12 || 50, displayW)}
                                                                height="11"
                                                                rx="2"
                                                                fill="#0f172aCC"
                                                                pointerEvents="none"
                                                            />
                                                            <text
                                                                x={displayX + 4}
                                                                y={displayY - 3}
                                                                fill="#94a3b8"
                                                                fontSize="6"
                                                                fontFamily="monospace"
                                                                pointerEvents="none"
                                                            >
                                                                🖼 {(shape.fileName || 'image').substring(0, Math.floor(displayW / 4.5))}
                                                            </text>
                                                        </>
                                                    )}
                                                </g>
                                            );
                                        }
                                        return null;
                                    })}

                                    {/* Temporary drawing shape during active drag */}
                                    {drawingShape && (() => {
                                        const tempProps = {
                                            stroke: drawingShape.color,
                                            strokeWidth: drawingShape.strokeWidth,
                                            fill: 'none',
                                            style: { pointerEvents: 'none' }
                                        };
                                        
                                        if (drawingShape.type === 'line') {
                                            return (
                                                <line
                                                    {...tempProps}
                                                    x1={drawingShape.x1}
                                                    y1={drawingShape.y1}
                                                    x2={drawingShape.x2}
                                                    y2={drawingShape.y2}
                                                />
                                            );
                                        } else if (drawingShape.type === 'circle') {
                                            return (
                                                <circle
                                                    {...tempProps}
                                                    cx={drawingShape.cx}
                                                    cy={drawingShape.cy}
                                                    r={drawingShape.r}
                                                />
                                            );
                                        } else if (drawingShape.type === 'rect') {
                                            return (
                                                <rect
                                                    {...tempProps}
                                                    x={drawingShape.x}
                                                    y={drawingShape.y}
                                                    width={drawingShape.w}
                                                    height={drawingShape.h}
                                                />
                                            );
                                        }
                                        return null;
                                    })()}
                                </g>
                            </svg>

                            {/* Absolutely positioned Text Input widget */}
                            {textInputPos && (
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="Ketik teks & tekan Enter..."
                                    value={textInputValue}
                                    onChange={(e) => setTextInputValue(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (textInputValue.trim() && selectedDwg) {
                                                const currentShapes = selectedDwg.shapes || [];
                                                const newTextShape = {
                                                    id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                                    type: 'text',
                                                    x: textInputPos.x,
                                                    y: textInputPos.y,
                                                    text: textInputValue,
                                                    color: cadColor,
                                                    fontSize: cadWidth * 3 + 12
                                                };
                                                updateShapes([...currentShapes, newTextShape]);
                                            }
                                            setTextInputPos(null);
                                        } else if (e.key === 'Escape') {
                                            setTextInputPos(null);
                                        }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: `${textInputPos.top}px`,
                                        left: `${textInputPos.left}px`,
                                        transform: 'translate(-50%, -50%)',
                                        backgroundColor: '#0f172a',
                                        color: cadColor,
                                        border: `1px solid ${cadColor}`,
                                        borderRadius: '4px',
                                        padding: '4px 8px',
                                        fontSize: `${cadWidth * 2 + 10}px`,
                                        outline: 'none',
                                        zIndex: 1000,
                                        fontFamily: 'monospace',
                                        boxShadow: `0 0 10px ${cadColor}55`
                                    }}
                                />
                            )}
                        </div>

                        {/* Tips footer */}
                        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(30, 58, 138, 0.2)', borderTop: '1px solid #1e3a8a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <HelpCircle size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.68rem', color: '#93c5fd' }}>
                                <b>Tips:</b> Klik label pada canvas untuk memilih, lalu <b>klik di mana saja</b> untuk reposisi. Gunakan <b>🖼 Insert Image</b> untuk menyisipkan gambar ke canvas. Warna berubah berdasarkan status QC.
                            </span>
                        </div>
                    </div>

                    {/* Right Panel: Properties + Simulation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        
                        {/* Legend */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipe Parameter QC</div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {PARAM_CATEGORIES.filter(c => c.key !== 'custom').map(cat => (
                                    <span key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', fontWeight: 700, color: cat.color, backgroundColor: `${cat.color}12`, padding: '2px 7px', borderRadius: '6px', border: `1px solid ${cat.color}30` }}>
                                        <span style={{ fontSize: '0.7rem' }}>{cat.icon}</span> {cat.label}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* PARAMETER PROPERTIES FORM */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Settings size={16} color="#2563eb" />
                                    <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>Pemetaan Parameter QC</h3>
                                </div>
                                {/* Add button with category picker */}
                                <div style={{ position: 'relative' }} ref={addPickerRef}>
                                    <button
                                        onClick={() => setShowAddPicker(!showAddPicker)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        <Plus size={12} /> Tambah <ChevronDown size={10} />
                                    </button>
                                    {showAddPicker && (
                                        <div style={{
                                            position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                                            backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0',
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.15)', padding: '10px', zIndex: 100,
                                            width: '220px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px',
                                        }}>
                                            <div style={{ gridColumn: '1 / -1', fontSize: '0.65rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px', padding: '0 4px' }}>
                                                Pilih Tipe Parameter
                                            </div>
                                            {PARAM_CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.key}
                                                    onClick={() => handleAddDimension(cat.key)}
                                                    style={{
                                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                                        padding: '10px 6px', borderRadius: '8px', border: `1px solid ${cat.color}30`,
                                                        backgroundColor: `${cat.color}08`, cursor: 'pointer', transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${cat.color}18`; e.currentTarget.style.borderColor = cat.color; }}
                                                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${cat.color}08`; e.currentTarget.style.borderColor = `${cat.color}30`; }}
                                                >
                                                    <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: cat.color, textAlign: 'center' }}>{cat.labelId}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {activeDim ? (
                                <>
                                    {/* Category + GD&T Symbol header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', borderRadius: '8px', backgroundColor: `${getCategoryColor(editCategory)}10`, border: `1px solid ${getCategoryColor(editCategory)}30` }}>
                                        <span style={{ fontSize: '1.2rem' }}>{getCategoryDef(editCategory).icon}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: getCategoryColor(editCategory) }}>{getCategoryDef(editCategory).label}</div>
                                            <div style={{ fontSize: '0.6rem', color: '#64748b' }}>{editMeasureType.replace(/_/g, ' ')}</div>
                                        </div>
                                        {editGdtSymbol && (
                                            <span style={{ fontSize: '1rem', fontWeight: 900, color: getCategoryColor(editCategory), padding: '2px 8px', backgroundColor: 'white', borderRadius: '6px', border: `1px solid ${getCategoryColor(editCategory)}40` }}>
                                                {editGdtSymbol}
                                            </span>
                                        )}
                                    </div>

                                    {/* Category selector */}
                                    <div>
                                        <label style={labelStyle}>Kategori Parameter</label>
                                        <select value={editCategory} onChange={(e) => handleCategoryChange(e.target.value)} style={selectStyle}>
                                            {PARAM_CATEGORIES.map(cat => (
                                                <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Measure Type */}
                                    <div>
                                        <label style={labelStyle}>Tipe Pengukuran</label>
                                        <select value={editMeasureType} onChange={(e) => updateActiveDimProp('measureType', e.target.value)} style={selectStyle}>
                                            {(MEASURE_TYPE_OPTIONS[editCategory] || []).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Label */}
                                    <div>
                                        <label style={labelStyle}>Label Parameter</label>
                                        <input type="text" value={editLabel} onChange={(e) => updateActiveDimProp('label', e.target.value)} style={inputStyle} />
                                    </div>

                                    {/* Spec + Unit */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: '8px' }}>
                                        <div>
                                            <label style={labelStyle}>Target Spec Nominal</label>
                                            <input type="text" value={editSpec} onChange={(e) => updateActiveDimProp('spec', e.target.value)} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Satuan</label>
                                            <input type="text" value={editUnit} onChange={(e) => updateActiveDimProp('unit', e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* Tolerances */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={labelStyle}>Batas Tol. Min</label>
                                            <input type="number" step="0.01" value={editTolMin} onChange={(e) => updateActiveDimProp('tolMin', e.target.value)} style={inputStyle} />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Batas Tol. Max</label>
                                            <input type="number" step="0.01" value={editTolMax} onChange={(e) => updateActiveDimProp('tolMax', e.target.value)} style={inputStyle} />
                                        </div>
                                    </div>

                                    {/* QMS Variable (dynamic) */}
                                    <div>
                                        <label style={labelStyle}>
                                            Variabel QMS
                                            <button
                                                onClick={() => setCustomVarMode(!customVarMode)}
                                                style={{ marginLeft: '8px', border: 'none', background: 'none', color: '#2563eb', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 600, textDecoration: 'underline' }}
                                            >
                                                {customVarMode ? 'Pilih dari daftar' : 'Input manual'}
                                            </button>
                                        </label>
                                        {customVarMode ? (
                                            <input type="text" value={editVariable} onChange={(e) => updateActiveDimProp('variable', e.target.value)} placeholder="Nama variabel kustom..." style={inputStyle} />
                                        ) : (
                                            <select value={editVariable} onChange={(e) => updateActiveDimProp('variable', e.target.value)} style={selectStyle}>
                                                <option value="">-- Pilih Variabel --</option>
                                                {(QMS_VARIABLES_BY_CATEGORY[editCategory] || []).map(v => (
                                                    <option key={v} value={v}>{v}</option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Indicator Type */}
                                    <div>
                                        <label style={labelStyle}>Tipe Indikator Canvas</label>
                                        <select value={editIndicatorType} onChange={(e) => updateActiveDimProp('indicatorType', e.target.value)} style={selectStyle}>
                                            {(INDICATOR_TYPE_OPTIONS[editCategory] || INDICATOR_TYPE_OPTIONS.custom).map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Angle-specific fields */}
                                    {editCategory === 'angle' && (
                                        <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                ∠ Parameter Sudut
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <div>
                                                    <label style={{ ...labelStyle, color: '#92400e' }}>Sudut Mulai (°)</label>
                                                    <input type="number" value={editAngleStart} onChange={(e) => updateActiveDimProp('angleStart', e.target.value)} style={inputStyle} />
                                                </div>
                                                <div>
                                                    <label style={{ ...labelStyle, color: '#92400e' }}>Sudut Akhir (°)</label>
                                                    <input type="number" value={editAngleEnd} onChange={(e) => updateActiveDimProp('angleEnd', e.target.value)} style={inputStyle} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <div>
                                                    <label style={{ ...labelStyle, color: '#92400e' }}>Center X</label>
                                                    <input type="range" min="10" max="490" value={editCx} onChange={(e) => updateActiveDimProp('cx', e.target.value)} style={{ width: '100%' }} />
                                                </div>
                                                <div>
                                                    <label style={{ ...labelStyle, color: '#92400e' }}>Center Y</label>
                                                    <input type="range" min="10" max="350" value={editCy} onChange={(e) => updateActiveDimProp('cy', e.target.value)} style={{ width: '100%' }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Kustomisasi Hotspot / Marker */}
                                    <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Sliders size={12} color="#475569" /> Kustomisasi Hotspot / Marker
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '6px' }}>
                                            <div>
                                                <label style={labelStyle}>Bentuk Marker</label>
                                                <select value={editMarkerShape || 'default'} onChange={(e) => updateActiveDimProp('markerShape', e.target.value)} style={selectStyle}>
                                                    <option value="default">Bawaan Indikator</option>
                                                    <option value="circle">● Bulat (Circle)</option>
                                                    <option value="square">■ Kotak (Square)</option>
                                                    <option value="triangle">▲ Segitiga (Triangle)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label style={labelStyle}>Ukuran: {editMarkerSize || 60}px</label>
                                                <input
                                                    type="range"
                                                    min="20"
                                                    max="120"
                                                    value={editMarkerSize || 60}
                                                    onChange={(e) => updateActiveDimProp('markerSize', e.target.value)}
                                                    style={{ width: '100%', accentColor: getCategoryColor(editCategory) }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ─── Feature Trigger — Out-of-Spec Actions ─── */}
                                    <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #1e3a8a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                <Zap size={13} color="#f59e0b" /> Feature Trigger — Out-of-Spec Actions
                                            </div>
                                            <div style={{ position: 'relative' }} ref={triggerAddPickerRef}>
                                                <button
                                                    onClick={() => setShowTriggerAddPicker(!showTriggerAddPicker)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '3px', border: '1px solid #f59e0b40', backgroundColor: '#f59e0b15', color: '#f59e0b', padding: '3px 8px', borderRadius: '6px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                                                >
                                                    <Plus size={10} /> Tambah
                                                </button>
                                                {showTriggerAddPicker && (
                                                    <div style={{
                                                        position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                                                        backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155',
                                                        boxShadow: '0 12px 40px rgba(0,0,0,0.4)', padding: '8px', zIndex: 100,
                                                        width: '240px', display: 'flex', flexDirection: 'column', gap: '4px',
                                                    }}>
                                                        <div style={{ fontSize: '0.6rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', padding: '2px 6px', marginBottom: '2px' }}>Pilih Tipe Aksi Trigger</div>
                                                        {TRIGGER_ACTIONS.map(action => (
                                                            <button
                                                                key={action.key}
                                                                onClick={() => handleAddTrigger(action.key)}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                                    padding: '8px 10px', borderRadius: '6px', border: 'none',
                                                                    backgroundColor: 'transparent', cursor: 'pointer', transition: 'all 0.2s',
                                                                    width: '100%', textAlign: 'left',
                                                                }}
                                                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${action.color}18`; }}
                                                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                            >
                                                                <span style={{ fontSize: '1rem' }}>{action.icon}</span>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: action.color }}>{action.label}</div>
                                                                    <div style={{ fontSize: '0.58rem', color: '#64748b' }}>{action.description}</div>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* List configured triggers */}
                                        {(activeDim.triggers || []).length === 0 ? (
                                            <div style={{ padding: '12px', backgroundColor: '#1e293b', borderRadius: '8px', border: '1px dashed #334155', textAlign: 'center', fontSize: '0.68rem', color: '#64748b' }}>
                                                Belum ada trigger. Klik <b style={{ color: '#f59e0b' }}>+ Tambah</b> untuk menambahkan aksi otomatis saat out-of-spec.
                                            </div>
                                        ) : (
                                            (activeDim.triggers || []).map(trigger => {
                                                const actionDef = TRIGGER_ACTIONS.find(a => a.key === trigger.type);
                                                const condDef = TRIGGER_CONDITIONS.find(c => c.key === trigger.condition);
                                                const isTriggeredNow = triggeredActions[activeDim.id]?.triggers?.some(t => t.id === trigger.id);
                                                return (
                                                    <div key={trigger.id} style={{
                                                        backgroundColor: isTriggeredNow ? `${actionDef?.color}15` : '#1e293b',
                                                        borderRadius: '8px',
                                                        border: `1px solid ${isTriggeredNow ? actionDef?.color : '#334155'}`,
                                                        padding: '10px',
                                                        display: 'flex', flexDirection: 'column', gap: '8px',
                                                        transition: 'all 0.3s',
                                                        animation: isTriggeredNow ? 'triggerPulse 0.6s ease 3' : 'none',
                                                    }}>
                                                        {/* Trigger Header */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                <span style={{ fontSize: '1rem' }}>{actionDef?.icon}</span>
                                                                <div>
                                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: actionDef?.color }}>{actionDef?.label}</div>
                                                                    <div style={{ fontSize: '0.58rem', color: '#94a3b8' }}>{condDef?.label || trigger.condition}</div>
                                                                </div>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button
                                                                    onClick={() => handleToggleTrigger(trigger.id)}
                                                                    title={trigger.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                                                                    style={{
                                                                        border: 'none', borderRadius: '4px', padding: '3px 6px', cursor: 'pointer',
                                                                        backgroundColor: trigger.enabled ? '#10b98120' : '#64748b20',
                                                                        color: trigger.enabled ? '#10b981' : '#64748b',
                                                                        fontSize: '0.58rem', fontWeight: 700, transition: 'all 0.2s',
                                                                    }}
                                                                >
                                                                    {trigger.enabled ? 'ON' : 'OFF'}
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTrigger(trigger.id)}
                                                                    title="Hapus Trigger"
                                                                    style={{ border: 'none', borderRadius: '4px', padding: '3px', cursor: 'pointer', backgroundColor: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Trigger Config */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>Kondisi</label>
                                                                <select
                                                                    value={trigger.condition}
                                                                    onChange={(e) => handleUpdateTrigger(trigger.id, 'condition', e.target.value)}
                                                                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.68rem', outline: 'none', cursor: 'pointer' }}
                                                                >
                                                                    {TRIGGER_CONDITIONS.map(c => (
                                                                        <option key={c.key} value={c.key}>{c.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>Prioritas</label>
                                                                <select
                                                                    value={trigger.priority || 'high'}
                                                                    onChange={(e) => handleUpdateTrigger(trigger.id, 'priority', e.target.value)}
                                                                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.68rem', outline: 'none', cursor: 'pointer' }}
                                                                >
                                                                    <option value="critical">🔴 Critical</option>
                                                                    <option value="high">🟠 Tinggi (High)</option>
                                                                    <option value="medium">🟡 Menengah (Medium)</option>
                                                                    <option value="low">🟢 Rendah (Low)</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#94a3b8', fontWeight: 700, marginBottom: '3px', textTransform: 'uppercase' }}>Pesan</label>
                                                                <textarea
                                                                    value={trigger.message || ''}
                                                                    onChange={(e) => handleUpdateTrigger(trigger.id, 'message', e.target.value)}
                                                                    placeholder="Pesan trigger... Gunakan {label}, {value}, {tolMin}, {tolMax}"
                                                                    rows={2}
                                                                    style={{ width: '100%', padding: '5px 8px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.65rem', outline: 'none', resize: 'vertical', fontFamily: "'Inter', sans-serif" }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        )}

                                        {/* Trigger count summary */}
                                        {(activeDim.triggers || []).length > 0 && (
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {(activeDim.triggers || []).map(t => {
                                                    const ad = TRIGGER_ACTIONS.find(a => a.key === t.type);
                                                    return (
                                                        <span key={t.id} style={{
                                                            fontSize: '0.58rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px',
                                                            color: t.enabled ? ad?.color : '#64748b',
                                                            backgroundColor: t.enabled ? `${ad?.color}15` : '#1e293b',
                                                            border: `1px solid ${t.enabled ? ad?.color + '30' : '#334155'}`,
                                                            opacity: t.enabled ? 1 : 0.5,
                                                        }}>
                                                            {ad?.icon} {ad?.labelShort}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <style>{`@keyframes triggerPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`}</style>

                                    {/* Coordinate groups */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {/* Group for Mark/Label */}
                                        <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Sliders size={12} color="#2563eb" /> Koordinat Mark / Label
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Label X: {editLx}</label>
                                                    <input type="range" min="10" max="490" value={editLx} onChange={(e) => updateActiveDimProp('lx', e.target.value)} style={{ width: '100%', accentColor: '#2563eb' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Label Y: {editLy}</label>
                                                    <input type="range" min="10" max="350" value={editLy} onChange={(e) => updateActiveDimProp('ly', e.target.value)} style={{ width: '100%', accentColor: '#2563eb' }} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Group for Line (Awal / Akhir) */}
                                        <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Ruler size={12} color="#3b82f6" /> Koordinat Garis Penunjuk
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Awal X: {editX1}</label>
                                                    <input type="range" min="10" max="490" value={editX1} onChange={(e) => updateActiveDimProp('x1', e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Awal Y: {editY1}</label>
                                                    <input type="range" min="10" max="350" value={editY1} onChange={(e) => updateActiveDimProp('y1', e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                                </div>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Akhir X: {editX2}</label>
                                                    <input type="range" min="10" max="490" value={editX2} onChange={(e) => updateActiveDimProp('x2', e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Akhir Y: {editY2}</label>
                                                    <input type="range" min="10" max="350" value={editY2} onChange={(e) => updateActiveDimProp('y2', e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Save / Delete */}
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                                        <button
                                            onClick={handleSaveMapping}
                                            style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem', transition: 'opacity 0.2s' }}
                                        >
                                            Simpan Mapping
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDimension(activeDim.id)}
                                            style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Hapus Parameter"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                                    Pilih dimensi pada gambar sebelah kiri untuk memulai konfigurasi.
                                </div>
                            )}
                        </div>

                        {/* LIVE QC SIMULATOR */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' }}>
                                <Play size={16} color="#10b981" />
                                <h3 style={{ margin: 0, fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                                    Simulasi Input QC
                                </h3>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {selectedDwg?.dimensions.map((dim) => {
                                    const catDef = getCategoryDef(dim.category || 'dimension');
                                    const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
                                    const status = getValidationStatus(simVal, dim.tolMin, dim.tolMax);

                                    const triggerCount = (dim.triggers || []).filter(t => t.enabled).length;
                                    const isTriggeredNow = triggeredActions[dim.id] !== undefined;

                                    return (
                                        <div key={dim.id} style={{
                                            backgroundColor: isTriggeredNow ? '#fef2f210' : (activeDimId === dim.id ? '#f0f9ff' : '#f8fafc'),
                                            padding: '8px', borderRadius: '6px',
                                            border: `1px solid ${isTriggeredNow ? '#ef4444' : (activeDimId === dim.id ? '#bfdbfe' : '#e2e8f0')}`,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s',
                                        }} onClick={() => setActiveDimId(dim.id)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontWeight: 800, marginBottom: '4px' }}>
                                                <span style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ color: catDef.color, fontSize: '0.75rem' }}>{catDef.icon}</span>
                                                    {dim.label}
                                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>[{dim.tolMin}–{dim.tolMax} {dim.unit}]</span>
                                                    {triggerCount > 0 && (
                                                        <span style={{ color: '#f59e0b', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${triggerCount} trigger aktif`}>
                                                            ⚡{triggerCount}
                                                        </span>
                                                    )}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    {isTriggeredNow && (
                                                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444', padding: '1px 5px', backgroundColor: '#ef444418', borderRadius: '4px', animation: 'triggerPulse 0.6s ease 3' }}>TRIGGERED</span>
                                                    )}
                                                    <span style={{ color: status === 'PASS' ? '#10b981' : status === 'FAIL' ? '#ef4444' : '#94a3b8', fontWeight: 900, fontSize: '0.7rem' }}>{status}</span>
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={simVal}
                                                onChange={(e) => {
                                                    const newVal = parseFloat(e.target.value) || 0;
                                                    const oldStatus = prevStatuses[dim.id] || 'PENDING';
                                                    const newStatus = getValidationStatus(newVal, dim.tolMin, dim.tolMax);
                                                    setSimValues(prev => ({ ...prev, [dim.id]: newVal }));
                                                    setPrevStatuses(prev => ({ ...prev, [dim.id]: newStatus }));
                                                    // Execute triggers if conditions are met
                                                    executeTriggers(dim, newVal, oldStatus, newStatus);
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                                style={{ ...inputStyle, fontSize: '0.75rem', padding: '6px 8px' }}
                                            />
                                        </div>
                                    );
                                })}
                                {(!selectedDwg || selectedDwg.dimensions.length === 0) && (
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                                        Tambahkan parameter QC untuk memulai simulasi.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        );
    }
