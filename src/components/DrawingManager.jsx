import React, { useState, useEffect, useRef } from 'react';
import {
    Ruler,
    Scale,
    Activity,
    Upload,
    Download,
    FileDown,
    Hand,
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
    Move,
    Scissors,
    RotateCw,
    FlipHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllDrawings, saveDrawing, deleteDrawing } from '../utils/supabaseUtilityDB';
import { CADViewer3DEditor } from './CADViewer3D';

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
    },
    {
        id: 'dwg_product_checking',
        name: 'Product Checking Template',
        fileName: 'product-checking-template.pdf',
        fileType: 'PDF',
        uploadedAt: '2026-06-26T12:00:00Z',
        dimensions: [
            { id: 'linear_2d', label: '2D Length Dimension', spec: '50.0', tolMin: 49.8, tolMax: 50.2, variable: 'Linear_2D_Val', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 50, y1: 300, x2: 250, y2: 300, lx: 150, ly: 320, triggers: [] },
            { id: 'pdf_height', label: 'PDF Thickness Check', spec: '12.0', tolMin: 11.8, tolMax: 12.2, variable: 'PDF_Thickness_Val', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 400, y1: 100, x2: 400, y2: 200, lx: 420, ly: 150, triggers: [] },
            { id: 'balloon_mark', label: 'Balloon Marker', spec: '10.0', tolMin: 9.5, tolMax: 10.5, variable: 'Balloon_Marker', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 200, y1: 200, lx: 250, ly: 200, triggers: [] },
            { id: 'cad_angle', label: '3D Included Angle', spec: '90.0', tolMin: 89.5, tolMax: 90.5, variable: 'CAD_Angle_Val', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 350, y1: 250, x2: 450, y2: 350, lx: 470, ly: 280, triggers: [] },
            { id: 'qc_check', label: 'QC Check Status', spec: 'PASS', tolMin: 1, tolMax: 1, variable: 'QC_Check_Status', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: 'QC', x1: 100, y1: 100, lx: 150, ly: 100, triggers: [] },
            { id: 'trigger_check', label: 'Trigger Check', spec: '1.0', tolMin: 1.0, tolMax: 1.0, variable: 'Trigger_Output', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '⚡', x1: 300, y1: 150, lx: 350, ly: 150, triggers: [
                { id: 'trig_p1', type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Trigger failed! Stopping machine.', enabled: true }
            ] },
            { id: 'camera_check', label: 'Camera/Vision Check', spec: '24.0', tolMin: 23.5, tolMax: 24.5, variable: 'Vision_Camera_Val', unit: 'fps', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 150, y1: 250, lx: 200, ly: 270, triggers: [] }
        ]
    }
];

// Helper to generate unique IDs outside render to avoid React purity rule warnings
const generateDimId = (categoryKey) => {
    return `dim_${categoryKey}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
};

// Validation helpers moved to module scope to avoid Temporal Dead Zone ReferenceErrors
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

const getSeverityStyle = (severity) => {
    const sevColors = {
        Minor: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
        Major: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
        Critical: { bg: '#fef2f2', text: '#b91c1c', border: '#fca5a5' }
    };
    return sevColors[severity || 'Minor'] || sevColors.Minor;
};

const getValidationStatusStyle = (status) => {
    const statusColors = {
        PASS: { bg: '#ecfdf5', text: '#047857' },
        FAIL: { bg: '#fef2f2', text: '#b91c1c' },
        PENDING: { bg: '#f1f5f9', text: '#475569' }
    };
    return statusColors[status] || statusColors.PENDING;
};

export default function DrawingManager() {
    // Load and auto-migrate drawings
    const [drawings, setDrawings] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        if (saved) {
            try {
                const parsed = migrateDrawings(JSON.parse(saved));
                if (!parsed.some(d => d.id === 'dwg_product_checking')) {
                    const templateDwg = DEFAULT_DRAWINGS.find(d => d.id === 'dwg_product_checking');
                    if (templateDwg) {
                        const updated = [...parsed, templateDwg];
                        localStorage.setItem('mavi_drawings', JSON.stringify(updated));
                        return updated;
                    }
                }
                return parsed;
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
    const [editZ1, setEditZ1] = useState(0);
    const [editX2, setEditX2] = useState(350);
    const [editY2, setEditY2] = useState(180);
    const [editZ2, setEditZ2] = useState(0);
    const [editLx, setEditLx] = useState(250);
    const [editLy, setEditLy] = useState(200);
    const [editLz, setEditLz] = useState(0);
    const [editCx, setEditCx] = useState(250);
    const [editCy, setEditCy] = useState(180);
    const [editAngleStart, setEditAngleStart] = useState(0);
    const [editAngleEnd, setEditAngleEnd] = useState(90);
    const [editMarkerShape, setEditMarkerShape] = useState('default');
    const [editMarkerSize, setEditMarkerSize] = useState(60);
    const [editLineWidth, setEditLineWidth] = useState(2);

    // Coordinate Joystick Control States
    const [coordControlMode, setCoordControlMode] = useState('slider'); // 'slider' | 'joystick'
    const [joystickTarget, setJoystickTarget] = useState('label'); // 'label' | 'x1y1' | 'x2y2'
    const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 });
    const joystickPosRef = useRef({ x: 0, y: 0 });
    const [isDraggingJoystick, setIsDraggingJoystick] = useState(false);
    const joystickRef = useRef(null);
    const editValuesRef = useRef({ lx: 250, ly: 200, lz: 0, x1: 150, y1: 180, z1: 0, x2: 350, y2: 180, z2: 0 });

    // Update the ref so the joystick interval always has the latest coordinate values
    useEffect(() => {
        editValuesRef.current = {
            lx: editLx,
            ly: editLy,
            lz: editLz,
            x1: editX1,
            y1: editY1,
            z1: editZ1,
            x2: editX2,
            y2: editY2,
            z2: editZ2
        };
    }, [editLx, editLy, editLz, editX1, editY1, editZ1, editX2, editY2, editZ2]);

    // Handle relative joystick movements continuously at 50ms intervals while dragging
    useEffect(() => {
        if (isDraggingJoystick) {
            const interval = setInterval(() => {
                const pos = joystickPosRef.current;
                if (pos.x === 0 && pos.y === 0) return;

                const speedFactor = 0.15; // Speed multiplier for dragging
                const deltaX = pos.x * speedFactor;
                const deltaY = pos.y * speedFactor;
                const vals = editValuesRef.current;

                if (joystickTarget === 'label') {
                    const newLx = Math.max(10, Math.min(490, Math.round(vals.lx + deltaX)));
                    const newLy = Math.max(10, Math.min(350, Math.round(vals.ly + deltaY)));
                    updateActiveDimProp('lx', newLx);
                    updateActiveDimProp('ly', newLy);
                } else if (joystickTarget === 'x1y1') {
                    const newX1 = Math.max(10, Math.min(490, Math.round(vals.x1 + deltaX)));
                    const newY1 = Math.max(10, Math.min(350, Math.round(vals.y1 + deltaY)));
                    updateActiveDimProp('x1', newX1);
                    updateActiveDimProp('y1', newY1);
                } else if (joystickTarget === 'x2y2') {
                    const newX2 = Math.max(10, Math.min(490, Math.round(vals.x2 + deltaX)));
                    const newY2 = Math.max(10, Math.min(350, Math.round(vals.y2 + deltaY)));
                    updateActiveDimProp('x2', newX2);
                    updateActiveDimProp('y2', newY2);
                }
            }, 50);

            return () => clearInterval(interval);
        }
    }, [isDraggingJoystick, joystickTarget]);

    const handleJoystickStart = (e) => {
        e.preventDefault();
        setIsDraggingJoystick(true);
        joystickPosRef.current = { x: 0, y: 0 };
        window.addEventListener('mousemove', handleJoystickMove);
        window.addEventListener('mouseup', handleJoystickEnd);
    };

    const handleJoystickMove = (e) => {
        if (!joystickRef.current) return;
        const rect = joystickRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let dx = e.clientX - centerX;
        let dy = e.clientY - centerY;

        const maxDist = 56; // Max radius for knob dragging
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        setJoystickPos({ x: dx, y: dy });
        joystickPosRef.current = { x: dx, y: dy };
    };

    const handleJoystickEnd = () => {
        setIsDraggingJoystick(false);
        setJoystickPos({ x: 0, y: 0 });
        joystickPosRef.current = { x: 0, y: 0 };
        window.removeEventListener('mousemove', handleJoystickMove);
        window.removeEventListener('mouseup', handleJoystickEnd);
    };

    // Fine-tune step adjustment using buttons (Micro-steps)
    const handleMicroStep = (axis, amount) => {
        const vals = editValuesRef.current;
        if (joystickTarget === 'label') {
            if (axis === 'x') {
                updateActiveDimProp('lx', Math.max(10, Math.min(490, vals.lx + amount)));
            } else {
                updateActiveDimProp('ly', Math.max(10, Math.min(350, vals.ly + amount)));
            }
        } else if (joystickTarget === 'x1y1') {
            if (axis === 'x') {
                updateActiveDimProp('x1', Math.max(10, Math.min(490, vals.x1 + amount)));
            } else {
                updateActiveDimProp('y1', Math.max(10, Math.min(350, vals.y1 + amount)));
            }
        } else if (joystickTarget === 'x2y2') {
            if (axis === 'x') {
                updateActiveDimProp('x2', Math.max(10, Math.min(490, vals.x2 + amount)));
            } else {
                updateActiveDimProp('y2', Math.max(10, Math.min(350, vals.y2 + amount)));
            }
        }
    };

    // DISCUS / Ballooning states
    const [isBalloonMode, setIsBalloonMode] = useState(false);
    const [editSeverity, setEditSeverity] = useState('Minor'); // Minor, Major, Critical
    const [editInspectionMethod, setEditInspectionMethod] = useState('Caliper'); // Caliper, Micrometer, Vision, CMM, SCADA, Custom
    const [isBocCollapsed, setIsBocCollapsed] = useState(false);
    const [showBocTable, setShowBocTable] = useState(true);
    const [showQCInspector, setShowQCInspector] = useState(true);
    const [qcTab, setQcTab] = useState('properties'); // 'properties' | 'simulator'

    // Viewport Panning & Quantity Takeoff States
    const svgRef = useRef(null);
    const [canvasSize, setCanvasSize] = useState({ width: 500, height: 360 });
    const [zoom, setZoom] = useState(1.0);
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const [panStart, setPanStart] = useState({ x: 0, y: 0 });
    const [spacePressed, setSpacePressed] = useState(false);
    const [leftPanelTab, setLeftPanelTab] = useState('qc'); // 'qc' | 'takeoff'
    const [activeTakeoffCategory, setActiveTakeoffCategory] = useState(null); // null | 'length_cable' | 'area_paint' | 'area_floor' | 'count_bolt'
    const [isDraggingScroll, setIsDraggingScroll] = useState(null); // null | 'horizontal' | 'vertical'
    const scrollStartRef = useRef({ mouseX: 0, mouseY: 0, panX: 0, panY: 0 });

    useEffect(() => {
        if (!isDraggingScroll) return;

        const handleMouseMove = (e) => {
            const start = scrollStartRef.current;
            const maxPanX = (canvasSize.width * zoom) / 2;
            const maxPanY = (canvasSize.height * zoom) / 2;

            if (isDraggingScroll === 'horizontal') {
                const dx = e.clientX - start.mouseX;
                const trackWidth = canvasSize.width - 40;
                const thumbWidth = Math.max(30, trackWidth / Math.max(1, zoom));
                const scrollableTrack = trackWidth - thumbWidth;
                if (scrollableTrack > 0) {
                    const ratio = (maxPanX * 2) / scrollableTrack;
                    const nextPanX = start.panX - dx * ratio;
                    setPanOffset(prev => ({
                        ...prev,
                        x: Math.max(-maxPanX, Math.min(maxPanX, nextPanX))
                    }));
                }
            } else if (isDraggingScroll === 'vertical') {
                const dy = e.clientY - start.mouseY;
                const trackHeight = canvasSize.height - 40;
                const thumbHeight = Math.max(30, trackHeight / Math.max(1, zoom));
                const scrollableTrack = trackHeight - thumbHeight;
                if (scrollableTrack > 0) {
                    const ratio = (maxPanY * 2) / scrollableTrack;
                    const nextPanY = start.panY - dy * ratio;
                    setPanOffset(prev => ({
                        ...prev,
                        y: Math.max(-maxPanY, Math.min(maxPanY, nextPanY))
                    }));
                }
            }
        };

        const handleMouseUp = () => {
            setIsDraggingScroll(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDraggingScroll, canvasSize, zoom]);

    // Prevent window spacebar scrolling when canvas area might be active
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === 'Space') {
                const activeEl = document.activeElement;
                if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
                    return;
                }
                e.preventDefault();
                setSpacePressed(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === 'Space') {
                setSpacePressed(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    // Auto-reveal QC Inspector panel when active dimension changes
    useEffect(() => {
        if (activeDimId) {
            setShowQCInspector(true);
        }
    }, [activeDimId]);

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
    const [mirrorMenu, setMirrorMenu] = useState(null); // { shapeId, x, y }
    const [cadColor, setCadColor] = useState('#3b82f6');
    const [cadWidth, setCadWidth] = useState(2);
    const [gridSnap, setGridSnap] = useState(false);
    const [drawingShape, setDrawingShape] = useState(null);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [textInputPos, setTextInputPos] = useState(null); // { x, y, top, left }
    const [textInputValue, setTextInputValue] = useState('');
    const [hoveredShapeId, setHoveredShapeId] = useState(null);

    // AutoCAD UI/UX states
    const [ribbonTab, setRibbonTab] = useState('home');
    const [commandInput, setCommandInput] = useState('');
    const [commandHistory, setCommandHistory] = useState([
        'MaviCAD 2026 [Version 1.0.0] - AutoCAD Style Interface',
        'Type "help" to see available CAD commands. Press ENTER to execute.'
    ]);
    const [activeSpace, setActiveSpace] = useState('model'); // model, layout1, layout2
    const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
    const [showCrosshair, setShowCrosshair] = useState(false);
    const [orthoMode, setOrthoMode] = useState(false);

    // Scale Calibration States
    const [scaleDrawState, setScaleDrawState] = useState('idle'); // idle, drawing
    const [scaleDraftCoords, setScaleDraftCoords] = useState(null);
    const [isScaleModalOpen, setIsScaleModalOpen] = useState(false);
    const [scaleModalPx, setScaleModalPx] = useState(0);
    const [scaleModalValue, setScaleModalValue] = useState('');

    // Dimension Creation States
    const [dimDrawState, setDimDrawState] = useState('idle'); // idle, waiting_end, waiting_offset
    const [dimDraftCoords, setDimDraftCoords] = useState(null);
    const [isDimModalOpen, setIsDimModalOpen] = useState(false);
    const [dimModalData, setDimModalData] = useState(null);

    // Arc and Polyline States
    const [arcDrawState, setArcDrawState] = useState('idle'); // idle, waiting_radius, waiting_end
    const [arcDraftCoords, setArcDraftCoords] = useState(null);
    const [polylineDraftPoints, setPolylineDraftPoints] = useState([]);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
        setHoveredShapeId(null);
    }, [cadTool]);

    useEffect(() => {
        setSelectedShapeId(null);
        setHoveredShapeId(null);
        setPanOffset({ x: 0, y: 0 });
        setZoom(1.0);
        setActiveTakeoffCategory(null);
    }, [selectedDwgId]);

    // PDF backdrop rendering state and effect
    const [pdfBackdropUrl, setPdfBackdropUrl] = useState(null);
    useEffect(() => {
        const dataUrlVal = selectedDwg?.dataUrl || selectedDwg?.data_url;
        if (selectedDwg && (selectedDwg.fileType === 'PDF' || selectedDwg.fileType === 'DWG') && dataUrlVal) {
            if (dataUrlVal.startsWith('data:image/')) {
                setPdfBackdropUrl(dataUrlVal);
            } else {
                setPdfBackdropUrl(null);
                fetch('http://localhost:8000/blueprint/pdf_to_image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pdf_data_url: dataUrlVal })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.image_url) {
                        setPdfBackdropUrl(data.image_url);
                    } else {
                        console.error("Failed to render PDF backdrop:", data.error);
                    }
                })
                .catch(err => {
                    console.error("Error fetching PDF backdrop image:", err);
                });
            }
        } else {
            setPdfBackdropUrl(null);
        }
    }, [selectedDwg]);

    // QC Simulation Actions & Calculations
    const [isSubmittingSim, setIsSubmittingSim] = useState(false);

    const overallJudgment = (() => {
        if (!selectedDwg || !selectedDwg.dimensions || selectedDwg.dimensions.length === 0) return 'PENDING';
        let passCount = 0;
        let failCount = 0;
        selectedDwg.dimensions.forEach(dim => {
            const val = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            const stat = getValidationStatus(val, dim.tolMin, dim.tolMax);
            if (stat === 'PASS') passCount++;
            else if (stat === 'FAIL') failCount++;
        });
        if (failCount > 0) return 'FAIL';
        if (passCount > 0) return 'PASS';
        return 'PENDING';
    })();

    const handleResetSimValues = () => {
        setSimValues({});
        setPrevStatuses({});
        setTriggeredActions({});
        toast.success('Nilai simulasi berhasil diatur ulang ke spesifikasi nominal.');
    };

    const handleSubmitSimResults = async () => {
        if (!selectedDwg || !selectedDwg.dimensions || selectedDwg.dimensions.length === 0) {
            toast.error('Tidak ada parameter dimensi untuk dikirim.');
            return;
        }
        setIsSubmittingSim(true);
        
        const measurementsMap = {};
        selectedDwg.dimensions.forEach(dim => {
            const val = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            measurementsMap[dim.variable || `sim_${dim.id}`] = val;
        });

        const cycleData = selectedDwg.dimensions.map(dim => {
            const val = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            const stat = getValidationStatus(val, dim.tolMin, dim.tolMax);
            return {
                dimension_id: dim.id,
                label: dim.label,
                spec: dim.spec,
                tolMin: dim.tolMin,
                tolMax: dim.tolMax,
                value: val,
                status: stat,
                unit: dim.unit,
                variable: dim.variable
            };
        });

        const payload = {
            video_name: `SIM_CAD_${selectedDwg.fileName || 'drawing'}_${Date.now()}`,
            measurements: measurementsMap,
            cycle_data: cycleData,
            quality_data: {
                judgment: overallJudgment,
                drawing_id: selectedDwg.id,
                drawing_name: selectedDwg.name,
                inspector: 'QC SIMULATOR',
                pass_count: cycleData.filter(d => d.status === 'PASS').length,
                fail_count: cycleData.filter(d => d.status === 'FAIL').length
            },
            work_order: 'WO-SIM-9999',
            narration: `Simulated CAD Inspection Run for ${selectedDwg.name}`
        };

        try {
            await saveLiveMeasurement(payload);
            toast.success('Hasil simulasi inspeksi berhasil dikirim ke log database QMS!');
        } catch (err) {
            console.error('Failed to save simulated QC run:', err);
            toast.error('Gagal menyimpan hasil simulasi ke database.');
        } finally {
            setIsSubmittingSim(false);
        }
    };

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
            setEditZ1(activeDim.z1 !== undefined ? activeDim.z1 : 0);
            setEditX2(activeDim.x2 !== undefined ? activeDim.x2 : 350);
            setEditY2(activeDim.y2 !== undefined ? activeDim.y2 : 180);
            setEditZ2(activeDim.z2 !== undefined ? activeDim.z2 : 0);
            setEditLx(activeDim.lx !== undefined ? activeDim.lx : 250);
            setEditLy(activeDim.ly !== undefined ? activeDim.ly : 200);
            setEditLz(activeDim.lz !== undefined ? activeDim.lz : 0);
            setEditCx(activeDim.cx !== undefined ? activeDim.cx : 250);
            setEditCy(activeDim.cy !== undefined ? activeDim.cy : 180);
            setEditAngleStart(activeDim.angleStart !== undefined ? activeDim.angleStart : 0);
            setEditAngleEnd(activeDim.angleEnd !== undefined ? activeDim.angleEnd : 90);
            setEditMarkerShape(activeDim.markerShape || 'default');
            setEditMarkerSize(activeDim.markerSize !== undefined ? activeDim.markerSize : 60);
            setEditLineWidth(activeDim.lineWidth !== undefined ? activeDim.lineWidth : 2);
            setEditSeverity(activeDim.severity || 'Minor');
            setEditInspectionMethod(activeDim.inspection_method || 'Caliper');
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

    // Validation helpers are now defined at the module scope above

    const getCategoryDef = (key) => PARAM_CATEGORIES.find(c => c.key === key) || PARAM_CATEGORIES[0];
    const getCategoryColor = (key) => getCategoryDef(key).color;

    // ─── Update dimension property ───
    const updateActiveDimProp = (field, value) => {
        if (!activeDim) return;

        const setters = {
            label: setEditLabel, spec: setEditSpec, tolMin: setEditTolMin, tolMax: setEditTolMax,
            variable: setEditVariable, unit: setEditUnit, category: setEditCategory,
            measureType: setEditMeasureType, indicatorType: setEditIndicatorType, gdt_symbol: setEditGdtSymbol,
            x1: setEditX1, y1: setEditY1, z1: setEditZ1, x2: setEditX2, y2: setEditY2, z2: setEditZ2,
            lx: setEditLx, ly: setEditLy, lz: setEditLz, cx: setEditCx, cy: setEditCy,
            angleStart: setEditAngleStart, angleEnd: setEditAngleEnd,
            markerShape: setEditMarkerShape, markerSize: setEditMarkerSize, lineWidth: setEditLineWidth,
            severity: setEditSeverity, inspection_method: setEditInspectionMethod,
        };
        if (setters[field]) setters[field](value);

        const is3D = selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType);

        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    let parsedVal = value;
                    if (['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'lx', 'ly', 'lz', 'cx', 'cy', 'markerSize', 'lineWidth'].includes(field)) {
                        parsedVal = is3D ? (parseFloat(value) || 0) : (parseInt(value) || 0);
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
        const is3D = selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType);
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return {
                        ...dim,
                        label: editLabel, spec: editSpec, tolMin: parseFloat(editTolMin), tolMax: parseFloat(editTolMax),
                        variable: editVariable, unit: editUnit, category: editCategory, measureType: editMeasureType,
                        indicatorType: editIndicatorType, gdt_symbol: editGdtSymbol,
                        x1: is3D ? parseFloat(editX1) : parseInt(editX1), 
                        y1: is3D ? parseFloat(editY1) : parseInt(editY1), 
                        z1: parseFloat(editZ1 || 0),
                        x2: is3D ? parseFloat(editX2) : parseInt(editX2), 
                        y2: is3D ? parseFloat(editY2) : parseInt(editY2), 
                        z2: parseFloat(editZ2 || 0),
                        lx: is3D ? parseFloat(editLx) : parseInt(editLx), 
                        ly: is3D ? parseFloat(editLy) : parseInt(editLy), 
                        lz: parseFloat(editLz || 0),
                        cx: is3D ? parseFloat(editCx) : parseInt(editCx), 
                        cy: is3D ? parseFloat(editCy) : parseInt(editCy),
                        angleStart: parseFloat(editAngleStart), angleEnd: parseFloat(editAngleEnd),
                        markerShape: editMarkerShape,
                        markerSize: parseInt(editMarkerSize) || 60,
                        lineWidth: parseInt(editLineWidth) || 2,
                        severity: editSeverity,
                        inspection_method: editInspectionMethod,
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

    // ─── Add 3D dimension from raycast ───
    const handleAdd3DDimension = (x, y, z) => {
        if (!selectedDwg) {
            toast.error('Pilih model blueprint terlebih dahulu.');
            return;
        }
        const categoryKey = 'dimension';
        const catDef = getCategoryDef(categoryKey);
        const newDimId = generateDimId(categoryKey);

        const specs = { spec: '1.0', tolMin: 0.9, tolMax: 1.1 };

        const newDim = {
            id: newDimId,
            label: `${catDef.labelId} Baru`,
            spec: specs.spec,
            tolMin: specs.tolMin,
            tolMax: specs.tolMax,
            variable: '',
            unit: catDef.defaultUnit,
            category: categoryKey,
            measureType: catDef.defaultMeasure,
            indicatorType: catDef.defaultIndicator,
            gdt_symbol: catDef.symbol,
            x1: parseFloat(x.toFixed(3)),
            y1: parseFloat(y.toFixed(3)),
            z1: parseFloat(z.toFixed(3)),
            x2: parseFloat(x.toFixed(3)),
            y2: parseFloat(y.toFixed(3)),
            z2: parseFloat(z.toFixed(3)),
            lx: parseFloat(x.toFixed(3)),
            ly: parseFloat(y.toFixed(3)),
            lz: parseFloat(z.toFixed(3)),
            cx: parseFloat(x.toFixed(3)),
            cy: parseFloat(y.toFixed(3)),
            markerShape: 'default',
            markerSize: 60,
            triggers: [],
            severity: 'Minor',
            inspection_method: 'Caliper',
        };

        const updatedDwg = { ...selectedDwg, dimensions: [...selectedDwg.dimensions, newDim] };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        setActiveDimId(newDimId);
        toast.success(`Parameter 3D ditambahkan pada koordinat (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
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
            lineWidth: 2,
            triggers: [],
            severity: 'Minor',
            inspection_method: 'Caliper',
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
    const [dragShape, setDragShape] = useState(null);

    const getShapeCenter = (shape) => {
        if (shape.type === 'line') {
            return { x: (shape.x1 + shape.x2) / 2, y: (shape.y1 + shape.y2) / 2 };
        } else if (shape.type === 'circle' || shape.type === 'arc') {
            return { x: shape.cx, y: shape.cy };
        } else if (shape.type === 'rect' || shape.type === 'image') {
            return { x: shape.x + shape.w / 2, y: shape.y + shape.h / 2 };
        } else if (shape.type === 'text') {
            return { x: shape.x, y: shape.y };
        } else if (shape.type === 'polyline') {
            const points = shape.points || [];
            if (points.length === 0) return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            const minX = Math.min(...xs);
            const maxX = Math.max(...xs);
            const minY = Math.min(...ys);
            const maxY = Math.max(...ys);
            return { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
        }
        return { x: canvasSize.width / 2, y: canvasSize.height / 2 };
    };

    const getLineLineIntersection = (l1, l2) => {
        const x1 = l1.x1, y1 = l1.y1, x2 = l1.x2, y2 = l1.y2;
        const x3 = l2.x1, y3 = l2.y1, x4 = l2.x2, y4 = l2.y2;
        
        const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
        if (denom === 0) return null; // parallel
        
        const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
        const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
        
        // Check if intersection lies on both line segments
        if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
            return {
                x: x1 + ua * (x2 - x1),
                y: y1 + ua * (y2 - y1)
            };
        }
        return null;
    };

    const handleMirrorShape = (shapeId, direction) => {
        if (!selectedDwg) return;
        const currentShapes = selectedDwg.shapes || [];
        const updated = currentShapes.map(shape => {
            if (shape.id === shapeId) {
                const cx_cy = getShapeCenter(shape);
                const cx = cx_cy.x;
                const cy = cx_cy.y;
                
                if (shape.type === 'line') {
                    if (direction === 'horizontal') {
                        return { ...shape, x1: 2 * cx - shape.x1, x2: 2 * cx - shape.x2 };
                    } else {
                        return { ...shape, y1: 2 * cy - shape.y1, y2: 2 * cy - shape.y2 };
                    }
                } else if (shape.type === 'rect' || shape.type === 'image') {
                    if (direction === 'horizontal') {
                        return { ...shape, x: 2 * cx - shape.x - shape.w };
                    } else {
                        return { ...shape, y: 2 * cy - shape.y - shape.h };
                    }
                } else if (shape.type === 'circle') {
                    return shape;
                } else if (shape.type === 'arc') {
                    if (direction === 'horizontal') {
                        return {
                            ...shape,
                            startAngle: Math.round(180 - shape.endAngle),
                            endAngle: Math.round(180 - shape.startAngle)
                        };
                    } else {
                        return {
                            ...shape,
                            startAngle: Math.round(-shape.endAngle),
                            endAngle: Math.round(-shape.startAngle)
                        };
                    }
                } else if (shape.type === 'polyline') {
                    if (direction === 'horizontal') {
                        return { ...shape, points: (shape.points || []).map(p => ({ x: 2 * cx - p.x, y: p.y })) };
                    } else {
                        return { ...shape, points: (shape.points || []).map(p => ({ x: p.x, y: 2 * cy - p.y })) };
                    }
                } else if (shape.type === 'text') {
                    if (direction === 'horizontal') {
                        return { ...shape, x: 2 * cx - shape.x };
                    } else {
                        return { ...shape, y: 2 * cy - shape.y };
                    }
                }
            }
            return shape;
        });
        updateShapes(updated);
        setMirrorMenu(null);
        toast.success(`Bentuk dicerminkan secara ${direction === 'horizontal' ? 'Horizontal' : 'Vertikal'}.`);
    };

    const handleTrimLine = (targetLine, clickX, clickY) => {
        if (!selectedDwg) return;
        const currentShapes = selectedDwg.shapes || [];
        
        const dx = targetLine.x2 - targetLine.x1;
        const dy = targetLine.y2 - targetLine.y1;
        const lengthSq = dx * dx + dy * dy;
        if (lengthSq === 0) return;
        
        // 1. Calculate click parameter t_click
        let tClick = ((clickX - targetLine.x1) * dx + (clickY - targetLine.y1) * dy) / lengthSq;
        tClick = Math.max(0, Math.min(1, tClick));
        
        // 2. Find all intersections with other shapes
        const tIntersections = [0, 1]; // start and end points of target line
        
        currentShapes.forEach(shape => {
            if (shape.id === targetLine.id) return;
            
            if (shape.type === 'line') {
                const pt = getLineLineIntersection(targetLine, shape);
                if (pt) {
                    const t = ((pt.x - targetLine.x1) * dx + (pt.y - targetLine.y1) * dy) / lengthSq;
                    if (t > 0.001 && t < 0.999) tIntersections.push(t);
                }
            } else if (shape.type === 'rect') {
                const x = shape.x;
                const y = shape.y;
                const w = shape.w;
                const h = shape.h;
                const segments = [
                    { x1: x, y1: y, x2: x + w, y2: y },
                    { x1: x + w, y1: y, x2: x + w, y2: y + h },
                    { x1: x + w, y1: y + h, x2: x, y2: y + h },
                    { x1: x, y1: y + h, x2: x, y2: y }
                ];
                segments.forEach(seg => {
                    const pt = getLineLineIntersection(targetLine, seg);
                    if (pt) {
                        const t = ((pt.x - targetLine.x1) * dx + (pt.y - targetLine.y1) * dy) / lengthSq;
                        if (t > 0.001 && t < 0.999) tIntersections.push(t);
                    }
                });
            } else if (shape.type === 'polyline') {
                const pts = shape.points || [];
                for (let i = 0; i < pts.length - 1; i++) {
                    const seg = { x1: pts[i].x, y1: pts[i].y, x2: pts[i + 1].x, y2: pts[i + 1].y };
                    const pt = getLineLineIntersection(targetLine, seg);
                    if (pt) {
                        const t = ((pt.x - targetLine.x1) * dx + (pt.y - targetLine.y1) * dy) / lengthSq;
                        if (t > 0.001 && t < 0.999) tIntersections.push(t);
                    }
                }
            } else if (shape.type === 'circle') {
                const cx = shape.cx, cy = shape.cy, r = shape.r;
                const b = 2 * (dx * (targetLine.x1 - cx) + dy * (targetLine.y1 - cy));
                const c = (targetLine.x1 - cx) * (targetLine.x1 - cx) + (targetLine.y1 - cy) * (targetLine.y1 - cy) - r * r;
                const disc = b * b - 4 * lengthSq * c;
                if (disc >= 0) {
                    const t1 = (-b - Math.sqrt(disc)) / (2 * lengthSq);
                    const t2 = (-b + Math.sqrt(disc)) / (2 * lengthSq);
                    if (t1 > 0.001 && t1 < 0.999) tIntersections.push(t1);
                    if (t2 > 0.001 && t2 < 0.999) tIntersections.push(t2);
                }
            } else if (shape.type === 'arc') {
                const cx = shape.cx, cy = shape.cy, r = shape.r;
                const b = 2 * (dx * (targetLine.x1 - cx) + dy * (targetLine.y1 - cy));
                const c = (targetLine.x1 - cx) * (targetLine.x1 - cx) + (targetLine.y1 - cy) * (targetLine.y1 - cy) - r * r;
                const disc = b * b - 4 * lengthSq * c;
                if (disc >= 0) {
                    const t1 = (-b - Math.sqrt(disc)) / (2 * lengthSq);
                    const t2 = (-b + Math.sqrt(disc)) / (2 * lengthSq);
                    
                    const checkArcAngle = (t) => {
                        const px = targetLine.x1 + t * dx;
                        const py = targetLine.y1 + t * dy;
                        let angle = Math.atan2(py - cy, px - cx) * (180 / Math.PI);
                        let sa = shape.startAngle ?? 0;
                        let ea = shape.endAngle ?? 90;
                        while (sa < 0) sa += 360;
                        while (ea < 0) ea += 360;
                        while (angle < 0) angle += 360;
                        if (sa > ea) {
                            return angle >= sa || angle <= ea;
                        } else {
                            return angle >= sa && angle <= ea;
                        }
                    };

                    if (t1 > 0.001 && t1 < 0.999 && checkArcAngle(t1)) tIntersections.push(t1);
                    if (t2 > 0.001 && t2 < 0.999 && checkArcAngle(t2)) tIntersections.push(t2);
                }
            }
        });
        
        const uniqueT = Array.from(new Set(tIntersections)).sort((a, b) => a - b);
        
        let clickedSegIdx = -1;
        for (let i = 0; i < uniqueT.length - 1; i++) {
            if (tClick >= uniqueT[i] && tClick <= uniqueT[i + 1]) {
                clickedSegIdx = i;
                break;
            }
        }
        
        if (clickedSegIdx === -1) {
            toast.error('Gagal memotong segmen.');
            return;
        }
        
        const remainingSegments = [];
        for (let i = 0; i < uniqueT.length - 1; i++) {
            if (i === clickedSegIdx) continue;
            
            remainingSegments.push({
                ...targetLine,
                id: `shape_line_${Date.now()}_${Math.floor(Math.random() * 1000)}_${i}`,
                x1: Math.round(targetLine.x1 + uniqueT[i] * dx),
                y1: Math.round(targetLine.y1 + uniqueT[i] * dy),
                x2: Math.round(targetLine.x1 + uniqueT[i + 1] * dx),
                y2: Math.round(targetLine.y1 + uniqueT[i + 1] * dy)
            });
        }
        
        const filteredShapes = currentShapes.filter(s => s.id !== targetLine.id);
        updateShapes([...filteredShapes, ...remainingSegments]);
        toast.success('Segmen garis dipotong.');
    };

    // Measure parent container of SVG to fit screen dynamically
    useEffect(() => {
        if (!svgRef.current) return;
        const parent = svgRef.current.parentElement;
        if (!parent) return;

        const updateSize = () => {
            const rect = parent.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                setCanvasSize({
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                });
            }
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(parent);
        return () => observer.disconnect();
    }, []);

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
        
        // Client click relative to SVG client dimensions
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        const cx = canvasSize.width / 2;
        const cy = canvasSize.height / 2;
        
        // Reverse scale relative to the coordinate center (cx, cy) and panOffset:
        let x = cx + (clickX - cx - panOffset.x) / zoom;
        let y = cy + (clickY - cy - panOffset.y) / zoom;
        
        if (gridSnap) {
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
        } else {
            x = Math.round(x);
            y = Math.round(y);
        }
        
        // Clamp bounds to prevent drawings from exceeding viewport limits
        x = Math.max(0, Math.min(canvasSize.width, x));
        y = Math.max(0, Math.min(canvasSize.height, y));
        
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

    const handleExecuteCommand = (cmdText) => {
        const text = cmdText.trim().toLowerCase();
        if (!text) return;

        setCommandHistory(prev => [...prev, `Command: ${cmdText}`]);

        let successMessage = '';
        let matched = true;

        switch (text) {
            case 'line':
                setCadTool('line');
                successMessage = 'LINE Command activated. Click first point, then second point.';
                break;
            case 'circle':
                setCadTool('circle');
                successMessage = 'CIRCLE Command activated. Click center point, drag to set radius.';
                break;
            case 'rect':
            case 'rectangle':
                setCadTool('rect');
                successMessage = 'RECTANGLE Command activated. Click corner point, drag to opposite corner.';
                break;
            case 'arc':
                setArcDrawState('idle');
                setArcDraftCoords(null);
                setCadTool('arc');
                successMessage = 'ARC Command activated. Click Center, then start angle point, then end angle.';
                break;
            case 'polyline':
                setPolylineDraftPoints([]);
                setCadTool('polyline');
                successMessage = 'POLYLINE Command activated. Click points to draw segments, double-click to close.';
                break;
            case 'text':
                setCadTool('text');
                successMessage = 'TEXT Command activated. Click where you want to place the text.';
                break;
            case 'image':
                setCadTool('image');
                if (imageInsertRef.current) {
                    imageInsertRef.current.click();
                    successMessage = 'IMAGE Command activated. File selection dialog opened.';
                } else {
                    successMessage = 'IMAGE Command failed. File selector not ready.';
                }
                break;
            case 'move':
                setCadTool('move');
                successMessage = 'MOVE Command activated. Click and drag shapes to move them.';
                break;
            case 'rotate':
                setCadTool('rotate');
                successMessage = 'ROTATE Command activated. Click shape center, drag to rotate.';
                break;
            case 'mirror':
                setCadTool('mirror');
                successMessage = 'MIRROR Command activated. Click a shape to open options.';
                break;
            case 'trim':
                setCadTool('trim');
                successMessage = 'TRIM Command activated. Hover and click intersecting line segment to cut it.';
                break;
            case 'erase':
                setCadTool('erase');
                successMessage = 'ERASER Command activated. Click shape vector to remove it.';
                break;
            case 'select':
                setCadTool('select');
                successMessage = 'SELECT Mode activated.';
                break;
            case 'undo':
                handleUndo();
                successMessage = 'UNDO executed.';
                break;
            case 'redo':
                handleRedo();
                successMessage = 'REDO executed.';
                break;
            case 'grid':
            case 'snap':
                setGridSnap(g => !g);
                successMessage = `GRID SNAP toggled.`;
                break;
            case 'ortho':
                setOrthoMode(o => !o);
                successMessage = `ORTHO MODE toggled.`;
                break;
            case 'clear':
                updateShapes([]);
                successMessage = 'Canvas shapes cleared.';
                break;
            case 'help':
                setCommandHistory(prev => [
                    ...prev,
                    'Available commands: LINE, CIRCLE, RECT, ARC, POLYLINE, TEXT, IMAGE',
                    'Editing commands: MOVE, ROTATE, MIRROR, TRIM, ERASE, SELECT, UNDO, REDO',
                    'Toggles: GRID (toggle snap), ORTHO (toggle drawing lock), CLEAR (clear shapes), HELP'
                ]);
                matched = false;
                break;
            default:
                setCommandHistory(prev => [...prev, `Unknown command: "${cmdText}". Type "help" for a list of commands.`]);
                matched = false;
                break;
        }

        if (matched && successMessage) {
            setCommandHistory(prev => [...prev, successMessage]);
            toast.success(successMessage, { id: 'cmd-feedback' });
        }
    };

    // Scale Calibration Helper
    const handleSaveScaleFactor = async (mmVal) => {
        const mm = parseFloat(mmVal);
        if (isNaN(mm) || mm <= 0 || scaleModalPx <= 0) {
            toast.error('Nilai kalibrasi tidak valid.');
            return;
        }
        const calculatedFactor = mm / scaleModalPx;
        const updatedDwg = {
            ...selectedDwg,
            scaleFactor: calculatedFactor
        };

        try {
            const saved = await saveDrawing(updatedDwg);
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? saved : d));
            toast.success(`Kalibrasi sukses! Skala: ${calculatedFactor.toFixed(4)} mm/px`);
        } catch (err) {
            console.error('Failed to save scale factor:', err);
            toast.error('Gagal menyimpan skala ke database.');
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        }
        setIsScaleModalOpen(false);
    };

    // Dimension Creation Helper
    const handleSaveNewDimension = async (formData) => {
        const newDim = {
            id: generateDimId(formData.category),
            label: formData.label,
            spec: formData.spec,
            tolMin: parseFloat(formData.tolMin) || 0,
            tolMax: parseFloat(formData.tolMax) || 0,
            variable: formData.variable,
            unit: formData.unit,
            category: formData.category,
            measureType: formData.measureType,
            indicatorType: formData.indicatorType,
            gdt_symbol: formData.gdt_symbol,
            x1: formData.x1,
            y1: formData.y1,
            x2: formData.x2,
            y2: formData.y2,
            lx: formData.lx,
            ly: formData.ly,
            cx: formData.cx,
            cy: formData.cy,
            angleStart: parseFloat(formData.angleStart) || 0,
            angleEnd: parseFloat(formData.angleEnd) || 90,
            markerShape: formData.markerShape || 'default',
            markerSize: parseInt(formData.markerSize) || 60,
            triggers: []
        };

        const updatedDwg = {
            ...selectedDwg,
            dimensions: [...(selectedDwg.dimensions || []), newDim]
        };

        try {
            const saved = await saveDrawing(updatedDwg);
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? saved : d));
            setActiveDimId(newDim.id);
            toast.success(`Dimensi "${formData.label}" berhasil disimpan.`);
        } catch (err) {
            console.error('Failed to save new dimension:', err);
            toast.error('Gagal menyimpan dimensi ke database.');
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        }
        setIsDimModalOpen(false);
        setDimModalData(null);
    };

    const handleSvgDoubleClick = (e) => {
        if (cadTool === 'polyline' && polylineDraftPoints.length > 2) {
            e.stopPropagation();
            e.preventDefault();
            
            const points = polylineDraftPoints.slice(0, -1);
            if (points.length >= 2) {
                const currentShapes = selectedDwg.shapes || [];
                const takeoffShapesList = currentShapes.filter(s => s.takeoffType);
                
                const newPolyline = {
                    id: `shape_poly_${Date.now()}`,
                    type: 'polyline',
                    points: points,
                    color: activeTakeoffCategory ? (
                        activeTakeoffCategory === 'length_cable' ? '#10b981' : 
                        activeTakeoffCategory === 'area_floor' ? '#f59e0b' : 
                        activeTakeoffCategory === 'area_paint' ? '#3b82f6' : cadColor
                    ) : cadColor,
                    strokeWidth: cadWidth
                };
                
                if (activeTakeoffCategory) {
                    if (activeTakeoffCategory === 'length_cable') {
                        newPolyline.takeoffType = 'length';
                        newPolyline.takeoffSubtype = 'cable_length';
                        newPolyline.takeoffName = `Kabel #${takeoffShapesList.filter(s => s.takeoffSubtype === 'cable_length').length + 1}`;
                    } else if (activeTakeoffCategory === 'area_paint') {
                        newPolyline.takeoffType = 'area';
                        newPolyline.takeoffSubtype = 'paint_area';
                        newPolyline.takeoffName = `Luas Cat #${takeoffShapesList.filter(s => s.takeoffSubtype === 'paint_area').length + 1}`;
                    } else if (activeTakeoffCategory === 'area_floor') {
                        newPolyline.takeoffType = 'area';
                        newPolyline.takeoffSubtype = 'floor_area';
                        newPolyline.takeoffName = `Luas Lantai #${takeoffShapesList.filter(s => s.takeoffSubtype === 'floor_area').length + 1}`;
                    }
                }
                
                updateShapes([...currentShapes, newPolyline]);
                toast.success(activeTakeoffCategory ? 'Item Takeoff berhasil ditambahkan.' : 'Polyline berhasil ditambahkan.');
            }
            setPolylineDraftPoints([]);
        }
    };

    const handleSvgMouseDown = (e) => {
        // Intercept middle click, Spacebar + drag, or Pan tool active
        if (e.button === 1 || (e.button === 0 && spacePressed) || (cadTool === 'pan' && e.button === 0)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        if (cadTool === 'select' || cadTool === 'move' || cadTool === 'rotate' || cadTool === 'mirror' || cadTool === 'trim') return;
        
        if (!selectedDwg) {
            toast.error("Silakan pilih atau unggah blueprint terlebih dahulu.");
            return;
        }
        
        const coords = getCanvasCoords(e);
        
        if (cadTool === 'takeoff_count') {
            if (e.button !== 0) return; // left click only
            const currentShapes = selectedDwg.shapes || [];
            const newShape = {
                id: `shape_count_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                type: 'circle',
                cx: coords.x,
                cy: coords.y,
                r: 6,
                color: '#ef4444',
                strokeWidth: 2,
                takeoffType: 'count',
                takeoffSubtype: 'bolt_count',
                takeoffName: `Baut #${currentShapes.filter(s => s.takeoffSubtype === 'bolt_count').length + 1}`
            };
            updateShapes([...currentShapes, newShape]);
            toast.success('Baut dihitung (+1)', { id: 'takeoff-count' });
            return;
        }

        if (e.button !== 0) return; // left click only

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
        } else if (cadTool === 'dimension') {
            if (dimDrawState === 'idle') {
                setDimDraftCoords({
                    x1: coords.x,
                    y1: coords.y,
                    x2: coords.x,
                    y2: coords.y,
                    lx: coords.x,
                    ly: coords.y
                });
                setDimDrawState('waiting_end');
                toast.success('Titik awal ditempatkan. Klik titik kedua.');
            } else if (dimDrawState === 'waiting_end') {
                setDimDraftCoords(prev => ({
                    ...prev,
                    x2: coords.x,
                    y2: coords.y
                }));
                setDimDrawState('waiting_offset');
                toast.success('Titik kedua ditempatkan. Gerakkan kursor dan klik titik ketiga untuk offset.');
            } else if (dimDrawState === 'waiting_offset') {
                const x1 = dimDraftCoords.x1;
                const y1 = dimDraftCoords.y1;
                const x2 = dimDraftCoords.x2;
                const y2 = dimDraftCoords.y2;
                const lx = coords.x;
                const ly = coords.y;
                
                const pxDist = Math.sqrt((x2 - x1)**2 + (y2 - y1)**2);
                const currentScale = selectedDwg?.scaleFactor || 1.0;
                const initialSpec = (pxDist * currentScale).toFixed(2);

                setDimModalData({
                    x1, y1, x2, y2, lx, ly,
                    cx: Math.round((x1 + x2) / 2),
                    cy: Math.round((y1 + y2) / 2),
                    spec: initialSpec,
                    label: 'Dimensi Baru',
                    category: 'dimension',
                    measureType: 'linear_horizontal',
                    indicatorType: 'horizontal',
                    unit: 'mm',
                    gdt_symbol: '',
                    tolMin: (parseFloat(initialSpec) - 0.1).toFixed(2),
                    tolMax: (parseFloat(initialSpec) + 0.1).toFixed(2),
                    variable: 'Meas_Length',
                    angleStart: 0,
                    angleEnd: 90,
                    markerShape: 'default',
                    markerSize: 60
                });
                setIsDimModalOpen(true);
                setDimDrawState('idle');
                setDimDraftCoords(null);
            }
        } else if (cadTool === 'scale') {
            if (scaleDrawState === 'idle') {
                setScaleDraftCoords({
                    x1: coords.x,
                    y1: coords.y,
                    x2: coords.x,
                    y2: coords.y
                });
                setScaleDrawState('drawing');
            }
        } else if (cadTool === 'arc') {
            if (arcDrawState === 'idle') {
                setArcDraftCoords({
                    cx: coords.x,
                    cy: coords.y,
                    x1: coords.x,
                    y1: coords.y,
                    x2: coords.x,
                    y2: coords.y,
                    r: 0,
                    startAngle: 0,
                    endAngle: 0
                });
                setArcDrawState('waiting_radius');
                toast.success('Pusat busur (Center) ditentukan. Klik titik kedua untuk radius.');
            } else if (arcDrawState === 'waiting_radius') {
                const dx = coords.x - arcDraftCoords.cx;
                const dy = coords.y - arcDraftCoords.cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);

                setArcDraftCoords(prev => ({
                    ...prev,
                    x1: coords.x,
                    y1: coords.y,
                    r,
                    startAngle
                }));
                setArcDrawState('waiting_end');
                toast.success('Radius & sudut mulai ditentukan. Klik titik ketiga untuk sudut akhir.');
            } else if (arcDrawState === 'waiting_end') {
                const dx = coords.x - arcDraftCoords.cx;
                const dy = coords.y - arcDraftCoords.cy;
                const endAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                
                const finalArc = {
                    id: `shape_arc_${Date.now()}`,
                    type: 'arc',
                    cx: arcDraftCoords.cx,
                    cy: arcDraftCoords.cy,
                    r: Math.round(arcDraftCoords.r),
                    startAngle: Math.round(arcDraftCoords.startAngle),
                    endAngle: Math.round(endAngle),
                    color: cadColor,
                    strokeWidth: cadWidth
                };

                const currentShapes = selectedDwg.shapes || [];
                updateShapes([...currentShapes, finalArc]);
                setArcDrawState('idle');
                setArcDraftCoords(null);
                toast.success('Busur (Arc) berhasil ditambahkan.');
            }
        } else if (cadTool === 'polyline') {
            if (polylineDraftPoints.length === 0) {
                setPolylineDraftPoints([coords, coords]);
                toast.success('Polyline dimulai. Klik untuk tambah titik, double-klik untuk menutup.');
            } else {
                setPolylineDraftPoints(prev => [...prev.slice(0, -1), coords, coords]);
            }
        }
    };

    const handleSvgMouseMove = (e) => {
        if (isPanning) {
            setPanOffset({
                x: e.clientX - panStart.x,
                y: e.clientY - panStart.y
            });
            return;
        }

        const coords = getCanvasCoords(e);
        setCrosshairPos(coords);
        if (dragShape) {
            const currentShapes = selectedDwg.shapes || [];
            const startShape = dragShape.startShape;
            
            if (dragShape.type === 'move') {
                const dx = coords.x - dragShape.startX;
                const dy = coords.y - dragShape.startY;
                
                const updatedShapes = currentShapes.map(s => {
                    if (s.id === dragShape.id) {
                        if (s.type === 'line') {
                            return {
                                ...s,
                                x1: Math.round(startShape.x1 + dx),
                                y1: Math.round(startShape.y1 + dy),
                                x2: Math.round(startShape.x2 + dx),
                                y2: Math.round(startShape.y2 + dy)
                            };
                        } else if (s.type === 'circle' || s.type === 'arc') {
                            return {
                                ...s,
                                cx: Math.round(startShape.cx + dx),
                                cy: Math.round(startShape.cy + dy)
                            };
                        } else if (s.type === 'rect' || s.type === 'image') {
                            return {
                                ...s,
                                x: Math.round(startShape.x + dx),
                                y: Math.round(startShape.y + dy)
                            };
                        } else if (s.type === 'text') {
                            return {
                                ...s,
                                x: Math.round(startShape.x + dx),
                                y: Math.round(startShape.y + dy)
                            };
                        } else if (s.type === 'polyline') {
                            return {
                                ...s,
                                points: startShape.points.map(p => ({
                                    x: Math.round(p.x + dx),
                                    y: Math.round(p.y + dy)
                                }))
                            };
                        }
                    }
                    return s;
                });
                
                const updatedDwg = {
                    ...selectedDwg,
                    shapes: updatedShapes
                };
                setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
            } else if (dragShape.type === 'rotate') {
                const angleStart = Math.atan2(dragShape.startY - dragShape.center.y, dragShape.startX - dragShape.center.x);
                const angleCurrent = Math.atan2(coords.y - dragShape.center.y, coords.x - dragShape.center.x);
                const deltaRotation = (angleCurrent - angleStart) * (180 / Math.PI);
                
                const updatedShapes = currentShapes.map(s => {
                    if (s.id === dragShape.id) {
                        return {
                            ...s,
                            rotation: Math.round((startShape.rotation || 0) + deltaRotation),
                            cx: dragShape.center.x,
                            cy: dragShape.center.y
                        };
                    }
                    return s;
                });
                
                const updatedDwg = {
                    ...selectedDwg,
                    shapes: updatedShapes
                };
                setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
            }
            return;
        }

        if (dragImageShape) {
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

        setMousePos(coords);
        
        if (cadTool === 'dimension' && dimDraftCoords) {
            if (dimDrawState === 'waiting_end') {
                setDimDraftCoords(prev => ({ ...prev, x2: coords.x, y2: coords.y }));
            } else if (dimDrawState === 'waiting_offset') {
                setDimDraftCoords(prev => ({ ...prev, lx: coords.x, ly: coords.y }));
            }
            return;
        }

        if (cadTool === 'scale' && scaleDraftCoords && scaleDrawState === 'drawing') {
            setScaleDraftCoords(prev => ({ ...prev, x2: coords.x, y2: coords.y }));
            return;
        }

        if (cadTool === 'arc' && arcDraftCoords) {
            if (arcDrawState === 'waiting_radius') {
                const dx = coords.x - arcDraftCoords.cx;
                const dy = coords.y - arcDraftCoords.cy;
                const r = Math.sqrt(dx * dx + dy * dy);
                const startAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                setArcDraftCoords(prev => ({ ...prev, r, startAngle, x1: coords.x, y1: coords.y }));
            } else if (arcDrawState === 'waiting_end') {
                const dx = coords.x - arcDraftCoords.cx;
                const dy = coords.y - arcDraftCoords.cy;
                const endAngle = Math.atan2(dy, dx) * (180 / Math.PI);
                setArcDraftCoords(prev => ({ ...prev, endAngle, x2: coords.x, y2: coords.y }));
            }
            return;
        }

        if (cadTool === 'polyline' && polylineDraftPoints.length > 0) {
            setPolylineDraftPoints(prev => {
                const next = [...prev];
                let targetCoords = coords;
                if (orthoMode && prev.length > 1) {
                    const lastPoint = prev[prev.length - 2];
                    const dx = Math.abs(targetCoords.x - lastPoint.x);
                    const dy = Math.abs(targetCoords.y - lastPoint.y);
                    if (dx > dy) {
                        targetCoords = { x: targetCoords.x, y: lastPoint.y };
                    } else {
                        targetCoords = { x: lastPoint.x, y: targetCoords.y };
                    }
                }
                next[next.length - 1] = targetCoords;
                return next;
            });
            return;
        }

        if (!drawingShape) return;
        
        if (drawingShape.type === 'line') {
            let targetX = coords.x;
            let targetY = coords.y;
            if (orthoMode) {
                const dx = Math.abs(targetX - drawingShape.x1);
                const dy = Math.abs(targetY - drawingShape.y1);
                if (dx > dy) {
                    targetY = drawingShape.y1;
                } else {
                    targetX = drawingShape.x1;
                }
            }
            setDrawingShape(prev => ({
                ...prev,
                x2: targetX,
                y2: targetY
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
        if (isPanning) {
            setIsPanning(false);
            return;
        }

        if (dragShape) {
            if (selectedDwg) {
                saveDrawing(selectedDwg).catch(err => console.error('Failed to save CAD shapes:', err));
            }
            setDragShape(null);
            return;
        }

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

        if (cadTool === 'scale' && scaleDraftCoords && scaleDrawState === 'drawing') {
            const pxDistance = Math.sqrt(
                (scaleDraftCoords.x2 - scaleDraftCoords.x1) ** 2 +
                (scaleDraftCoords.y2 - scaleDraftCoords.y1) ** 2
            );
            if (pxDistance > 2) {
                setScaleModalPx(pxDistance);
                setScaleModalValue('');
                setIsScaleModalOpen(true);
            }
            setScaleDrawState('idle');
            setScaleDraftCoords(null);
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

        // If in Takeoff active mode, automatically tag new shape
        if (activeTakeoffCategory) {
            const takeoffShapesList = currentShapes.filter(s => s.takeoffType);
            if (activeTakeoffCategory === 'length_cable') {
                newShape.takeoffType = 'length';
                newShape.takeoffSubtype = 'cable_length';
                newShape.takeoffName = `Kabel #${takeoffShapesList.filter(s => s.takeoffSubtype === 'cable_length').length + 1}`;
                newShape.color = '#10b981';
            } else if (activeTakeoffCategory === 'area_paint') {
                newShape.takeoffType = 'area';
                newShape.takeoffSubtype = 'paint_area';
                newShape.takeoffName = `Luas Cat #${takeoffShapesList.filter(s => s.takeoffSubtype === 'paint_area').length + 1}`;
                newShape.color = '#3b82f6';
            } else if (activeTakeoffCategory === 'area_floor') {
                newShape.takeoffType = 'area';
                newShape.takeoffSubtype = 'floor_area';
                newShape.takeoffName = `Luas Lantai #${takeoffShapesList.filter(s => s.takeoffSubtype === 'floor_area').length + 1}`;
                newShape.color = '#f59e0b';
            } else if (activeTakeoffCategory === 'count_bolt') {
                newShape.takeoffType = 'count';
                newShape.takeoffSubtype = 'bolt_count';
                newShape.takeoffName = `Baut #${takeoffShapesList.filter(s => s.takeoffSubtype === 'bolt_count').length + 1}`;
                newShape.color = '#ef4444';
            }
        }

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

    const handleExportAS9102 = () => {
        if (!selectedDwg || !selectedDwg.dimensions || selectedDwg.dimensions.length === 0) {
            toast.error("Tidak ada data parameter untuk diekspor.");
            return;
        }

        const headers = [
            "Balloon No (#)",
            "Parameter Label",
            "Nominal Spec",
            "Tol Min",
            "Tol Max",
            "Unit",
            "Severity / Class",
            "Inspection Method",
            "QMS Tag / Variable",
            "Actual Measured Value",
            "QC Status"
        ];

        const rows = selectedDwg.dimensions.map((dim, idx) => {
            const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            const status = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
            return [
                idx + 1,
                `"${dim.label || ''}"`,
                dim.spec,
                dim.tolMin,
                dim.tolMax,
                dim.unit || "mm",
                dim.severity || "Minor",
                dim.inspection_method || "Caliper",
                dim.variable || "",
                simVal,
                status
            ];
        });

        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `AS9102_Form3_${selectedDwg.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Laporan AS9102 Form 3 berhasil diekspor sebagai CSV!");
    };

    // ΓöÇΓöÇΓöÇ Quantity Takeoff Helper Functions ΓöÇΓöÇΓöÇ
    const getPolygonArea = (points) => {
        if (!points || points.length < 3) return 0;
        let area = 0;
        const n = points.length;
        for (let i = 0; i < n; i++) {
            const p1 = points[i];
            const p2 = points[(i + 1) % n];
            area += p1.x * p2.y - p2.x * p1.y;
        }
        return Math.abs(area / 2);
    };

    const computeShapeLength = (shape) => {
        if (shape.type === 'line') {
            const dx = shape.x2 - shape.x1;
            const dy = shape.y2 - shape.y1;
            return Math.sqrt(dx * dx + dy * dy);
        }
        if (shape.type === 'polyline') {
            let len = 0;
            const pts = shape.points || [];
            for (let i = 0; i < pts.length - 1; i++) {
                const dx = pts[i+1].x - pts[i].x;
                const dy = pts[i+1].y - pts[i].y;
                len += Math.sqrt(dx * dx + dy * dy);
            }
            return len;
        }
        return 0;
    };

    const computeShapeArea = (shape) => {
        if (shape.type === 'rect') {
            return (shape.w || 0) * (shape.h || 0);
        }
        if (shape.type === 'circle') {
            return Math.PI * (shape.r || 0) * (shape.r || 0);
        }
        if (shape.type === 'polyline') {
            return getPolygonArea(shape.points);
        }
        return 0;
    };

    const handleUpdateShapeProp = (shapeId, prop, value) => {
        const currentShapes = selectedDwg?.shapes || [];
        const updated = currentShapes.map(s => {
            if (s.id === shapeId) {
                return { ...s, [prop]: value };
            }
            return s;
        });
        updateShapes(updated);
    };

    const handleExportTakeoffCSV = () => {
        const takeoffShapes = selectedDwg?.shapes?.filter(s => s.takeoffType) || [];
        if (!selectedDwg || takeoffShapes.length === 0) {
            toast.error("Tidak ada data takeoff untuk diekspor.");
            return;
        }
        
        const scale = selectedDwg?.scaleFactor || null;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "No,Item Name,Category,Subtype,Raw Value (px/px2),Real Value,Unit\n";
        
        takeoffShapes.forEach((shape, index) => {
            const num = index + 1;
            const name = shape.takeoffName || "Unnamed Item";
            const category = shape.takeoffType;
            const subtype = shape.takeoffSubtype;
            let rawVal = 0;
            let realVal = 0;
            let unit = "";
            
            if (category === 'length') {
                rawVal = computeShapeLength(shape);
                realVal = scale ? (rawVal * scale) / 1000 : rawVal;
                unit = scale ? "m" : "px";
            } else if (category === 'area') {
                rawVal = computeShapeArea(shape);
                realVal = scale ? (rawVal * (scale ** 2)) / 1000000 : rawVal;
                unit = scale ? "m2" : "px2";
            } else if (category === 'count') {
                rawVal = 1;
                realVal = 1;
                unit = "pcs";
            }
            
            csvContent += `${num},"${name.replace(/"/g, '""')}","${category}","${subtype}",${rawVal.toFixed(2)},${realVal.toFixed(2)},"${unit}"\n`;
        });
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Takeoff_${selectedDwg.name.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Data Takeoff berhasil diekspor ke CSV!");
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

    const processUploadedFile = async (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['svg', 'dxf', 'pdf', 'dwg', 'stl', 'obj', 'gltf', 'glb'].includes(extension)) {
            toast.error('Format tidak didukung! Gunakan .svg, .dxf, .pdf, .dwg, .stl, .obj, .gltf, atau .glb.');
            return;
        }

        // Handle 3D formats client-side directly
        if (['stl', 'obj', 'gltf', 'glb'].includes(extension)) {
            setIsParsing(true);
            setParseProgress(30);
            setParseStatusText('Membaca berkas 3D...');
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target.result || '';
                setParseProgress(90);
                setParseStatusText('Menyimpan model 3D...');
                setTimeout(() => {
                    setParseProgress(100);
                    setIsParsing(false);
                    const newDwg = {
                        name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' 3D Model',
                        fileName: file.name,
                        fileType: extension.toUpperCase(),
                        uploadedAt: new Date().toISOString(),
                        dimensions: [],
                        dataUrl: dataUrl
                    };
                    saveDrawing(newDwg).then(saved => {
                        setDrawings(prev => [saved, ...prev]);
                        setSelectedDwgId(saved.id);
                        if (saved.dimensions?.length > 0) setActiveDimId(saved.dimensions[0].id);
                        else setActiveDimId('');
                        toast.success(`${file.name} berhasil disimpan ke database!`);
                    }).catch(err => {
                        console.error(err);
                        toast.error('Gagal menyimpan model 3D ke database.');
                    });
                }, 600);
            };
            reader.onerror = () => { setIsParsing(false); toast.error('Gagal membaca berkas.'); };
            reader.readAsDataURL(file);
            return;
        }

        setIsParsing(true);
        setParseProgress(10);
        setParseStatusText('Mengunggah berkas ke server QMS...');

        const getFileDataUrl = () => {
            return new Promise((resolve) => {
                const r = new FileReader();
                r.onload = (ev) => resolve(ev.target.result);
                if (extension === 'pdf' || extension === 'svg') {
                    r.readAsDataURL(file);
                } else {
                    resolve(undefined);
                }
            });
        };

        const dataUrl = await getFileDataUrl();

        // 1. Try real Python parsing
        try {
            setParseProgress(40);
            setParseStatusText('Melakukan geometri parsing & CAD decoding di Python...');

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/blueprint/parse', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();

            if (result.success && result.dimensions) {
                setParseProgress(80);
                setParseStatusText('Mengekstraksi anotasi GD&T & parameter toleransi...');

                const newDwg = {
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint',
                    fileName: file.name,
                    fileType: extension.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: result.dimensions,
                    dataUrl: result.rendered_image || dataUrl
                };

                setParseProgress(100);
                setIsParsing(false);

                saveDrawing(newDwg).then(saved => {
                    setDrawings(prev => [saved, ...prev]);
                    setSelectedDwgId(saved.id);
                    if (saved.dimensions?.length > 0) setActiveDimId(saved.dimensions[0].id);
                    else setActiveDimId('');
                    toast.success(`${file.name} berhasil disimpan ke database! Ditemukan ${result.dimensions.length} parameter.`);
                }).catch(err => {
                    console.error(err);
                    toast.error('Gagal menyimpan file drawing baru ke database.');
                });
                return;
            } else {
                throw new Error(result.error || 'Parsing failed');
            }
        } catch (err) {
            console.warn('Python server parsing failed or offline, using client-side fallback:', err);
            // Fallback (original client side behavior)
            setParseProgress(30);
            setParseStatusText('Membaca berkas secara lokal...');

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target.result || '';
                const fileContent = extension === 'pdf' ? '' : result;
                let extractedDims = [];

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
                } else if (extension === 'dwg') {
                    // Fallback heuristics for DWG when backend is offline
                    extractedDims = [
                        { id: `dim_dwg_1_${Date.now()}`, label: 'DWG Shaft Length', spec: '180.0', tolMin: 179.5, tolMax: 180.5, variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 80, y1: 240, x2: 420, y2: 240, lx: 250, ly: 255 },
                        { id: `dim_dwg_2_${Date.now()}`, label: 'DWG Outer Diameter', spec: '45.0', tolMin: 44.95, tolMax: 45.05, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 285, y2: 170, lx: 295, ly: 155 }
                    ];
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
            if (extension === 'pdf' || extension === 'dwg') {
                reader.readAsDataURL(file);
            } else {
                reader.readAsText(file);
            }
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
            const baseWidth = dim.lineWidth !== undefined ? dim.lineWidth : 2;
            const strokeW = isActive ? baseWidth + 1.0 : baseWidth;
            const arrowLen = Math.max(8, baseWidth * 4.5);
            const arrowWidth = Math.max(4, baseWidth * 2.2);

            if (indicatorType === 'horizontal') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <line x1={x1} y1={y1} x2={x1} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={x2} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x1 + arrowLen - 2} y1={ly - 5} x2={x2 - arrowLen + 2} y2={ly - 5} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${x1},${ly - 5} ${x1 + arrowLen},${ly - 5 - arrowWidth} ${x1 + arrowLen},${ly - 5 + arrowWidth}`} fill={color} />
                        <polygon points={`${x2},${ly - 5} ${x2 - arrowLen},${ly - 5 - arrowWidth} ${x2 - arrowLen},${ly - 5 + arrowWidth}`} fill={color} />
                        {renderLabelBadge(dim, color, labelText, isActive)}
                    </g>
                );
            } else if (indicatorType === 'vertical') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        <line x1={x1} y1={y1} x2={lx} y2={y1} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={lx} y2={y2} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={lx - 5} y1={y1 + arrowLen - 2} x2={lx - 5} y2={y2 - arrowLen + 2} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${lx - 5},${y1} ${lx - 5 - arrowWidth},${y1 + arrowLen} ${lx - 5 + arrowWidth},${y1 + arrowLen}`} fill={color} />
                        <polygon points={`${lx - 5},${y2} ${lx - 5 - arrowWidth},${y2 - arrowLen} ${lx - 5 + arrowWidth},${y2 - arrowLen}`} fill={color} />
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
                        <circle cx={sx} cy={sy} r={Math.max(2, baseWidth * 1.25)} fill={color} />
                        <circle cx={ex} cy={ey} r={Math.max(2, baseWidth * 1.25)} fill={color} />
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
                        {renderLabelBadge(dim, color, `▢ ${dim.spec} ${dim.unit}`, isActive)}
                    </g>
                );
            } else if (indicatorType === 'callout') {
                // Surface roughness / custom callout
                const symbolChar = dim.gdt_symbol || '';
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                        {/* Leader line */}
                        <line x1={x1} y1={y1} x2={lx} y2={ly - 14} stroke={color} strokeWidth={strokeW} />
                        <circle cx={x1} cy={y1} r={Math.max(2.5, baseWidth * 1.5)} fill="none" stroke={color} strokeWidth={strokeW} />
                        {/* Roughness symbol (triangle) */}
                        {dim.category === 'roughness' && (
                            <g>
                                <path d={`M ${lx - 8},${ly + 8} L ${lx},${ly - 6} L ${lx + 8},${ly + 8}`} fill="none" stroke={color} strokeWidth={strokeW} />
                                <line x1={lx - 12} y1={ly + 8} x2={lx + 12} y2={ly + 8} stroke={color} strokeWidth={strokeW} />
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
                             const ax1 = x1 + arrowLen * Math.cos(angle - 0.25);
                             const ay1 = y1 + arrowLen * Math.sin(angle - 0.25);
                             const ax2 = x1 + arrowLen * Math.cos(angle + 0.25);
                             const ay2 = y1 + arrowLen * Math.sin(angle + 0.25);
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

    // Compute takeoff variables
    const takeoffShapes = selectedDwg?.shapes?.filter(s => s.takeoffType) || [];
    const scale = selectedDwg?.scaleFactor || null;

    // Calculate totals
    let totalCablePx = 0;
    let totalPaintPx = 0;
    let totalFloorPx = 0;
    let totalBoltCount = 0;

    takeoffShapes.forEach(shape => {
        if (shape.takeoffSubtype === 'cable_length') {
            totalCablePx += computeShapeLength(shape);
        } else if (shape.takeoffSubtype === 'paint_area') {
            totalPaintPx += computeShapeArea(shape);
        } else if (shape.takeoffSubtype === 'floor_area') {
            totalFloorPx += computeShapeArea(shape);
        } else if (shape.takeoffSubtype === 'bolt_count') {
            totalBoltCount += 1;
        }
    });

    const totalCableReal = scale ? (totalCablePx * scale) / 1000 : totalCablePx;
    const totalPaintReal = scale ? (totalPaintPx * (scale ** 2)) / 1000000 : totalPaintPx;
    const totalFloorReal = scale ? (totalFloorPx * (scale ** 2)) / 1000000 : totalFloorPx;

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div style={{ padding: '12px 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #2563eb, #7c3aed)', padding: '7px', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center' }}>
                            <Ruler size={22} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>Inspector Designer</h2>
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
                            accept=".svg,.dxf,.pdf,.dwg,.stl,.obj,.gltf,.glb"
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
            <div style={{ flex: 1, padding: '0 24px 24px 24px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden', height: '100%' }}>
                
                {/* Top Row: BOC Table (Left) + CAD Canvas (Middle) + Sidebar (Right) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `${showBocTable ? '380px' : ''} 1fr ${showQCInspector ? '360px' : ''}`.trim().replace(/\s+/g, ' '),
                    gap: '20px',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden'
                }}>
                    
                    {/* Left Column: Segmented Tab Headers / BOC Table */}
                    {showBocTable && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', minHeight: 0 }}>
                            {/* Segmented Tab Headers */}
                            <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px', gap: '12px', userSelect: 'none' }}>
                                <button
                                    onClick={() => setLeftPanelTab('qc')}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        color: leftPanelTab === 'qc' ? '#2563eb' : '#64748b',
                                        borderBottom: leftPanelTab === 'qc' ? '3px solid #2563eb' : '3px solid transparent',
                                        paddingBottom: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        outline: 'none'
                                    }}
                                >
                                    📋 QC Plan ({selectedDwg?.dimensions?.length || 0})
                                </button>
                                <button
                                    onClick={() => setLeftPanelTab('takeoff')}
                                    style={{
                                        border: 'none',
                                        background: 'none',
                                        fontSize: '0.78rem',
                                        fontWeight: 800,
                                        color: leftPanelTab === 'takeoff' ? '#7c3aed' : '#64748b',
                                        borderBottom: leftPanelTab === 'takeoff' ? '3px solid #7c3aed' : '3px solid transparent',
                                        paddingBottom: '4px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        outline: 'none'
                                    }}
                                >
                                    📐 Takeoff ({selectedDwg?.shapes?.filter(s => s.takeoffType).length || 0})
                                </button>
                            </div>

                            {leftPanelTab === 'qc' ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                                            <span style={{ fontSize: '1rem', flexShrink: 0 }}>📋</span>
                                            <h3 style={{ margin: 0, fontSize: '0.8rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }} title="Bill of Characteristics (DISCUS FAI Plan)">
                                                FAI Plan ({selectedDwg?.dimensions?.length || 0})
                                            </h3>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleExportAS9102();
                                            }}
                                            title="Export Excel (AS9102)"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: '#10b981',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                width: '28px',
                                                height: '28px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                boxShadow: '0 2px 4px rgba(16, 185, 129, 0.2)',
                                                flexShrink: 0
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
                                        >
                                            <FileDown size={14} />
                                        </button>
                                    </div>

                                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
                                        <div style={{ overflow: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc', marginTop: '10px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.7rem', textAlign: 'left' }}>
                                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', zIndex: 5, color: '#475569', fontWeight: 'bold' }}>
                                                    <tr>
                                                        <th style={{ padding: '8px 10px' }}>No</th>
                                                        <th style={{ padding: '8px 10px' }}>Label</th>
                                                        <th style={{ padding: '8px 10px' }}>Spec Nominal</th>
                                                        <th style={{ padding: '8px 10px' }}>Batas Toleransi</th>
                                                        <th style={{ padding: '8px 10px' }}>Severity</th>
                                                        <th style={{ padding: '8px 10px' }}>Metode Inspeksi</th>
                                                        <th style={{ padding: '8px 10px' }}>Variabel QMS</th>
                                                        <th style={{ padding: '8px 10px' }}>Nilai Simulasi</th>
                                                        <th style={{ padding: '8px 10px' }}>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedDwg?.dimensions || []).map((dim, idx) => {
                                                        const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
                                                        const valStatus = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
                                                        const isActive = activeDimId === dim.id;
                                                        const sevStyle = getSeverityStyle(dim.severity);
                                                        const statStyle = getValidationStatusStyle(valStatus);
                                                        return (
                                                            <tr
                                                                key={dim.id}
                                                                onClick={() => setActiveDimId(dim.id)}
                                                                style={{
                                                                    borderBottom: '1px solid #f1f5f9',
                                                                    backgroundColor: isActive ? '#f0f7ff' : 'transparent',
                                                                    cursor: 'pointer',
                                                                    transition: 'background-color 0.15s'
                                                                }}
                                                                onMouseEnter={e => { if (!isActive) e.currentTarget.style.backgroundColor = '#f8fafc'; }}
                                                                onMouseLeave={e => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                                            >
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle', fontWeight: 'bold' }}>
                                                                    <span style={{
                                                                        display: 'inline-flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        width: '18px',
                                                                        height: '18px',
                                                                        borderRadius: '50%',
                                                                        backgroundColor: isActive ? '#2563eb' : '#64748b',
                                                                        color: 'white',
                                                                        fontSize: '0.62rem'
                                                                    }}>
                                                                        {idx + 1}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle', fontWeight: 600, color: '#1e293b' }}>{dim.label}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>{dim.gdt_symbol} {dim.spec} {dim.unit}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>{dim.tolMin} ~ {dim.tolMax} {dim.unit}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                                                                    <span style={{
                                                                        padding: '1px 5px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.58rem',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: sevStyle.bg,
                                                                        color: sevStyle.text,
                                                                        border: `1px solid ${sevStyle.border}`
                                                                    }}>
                                                                        {dim.severity || 'Minor'}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>{dim.inspection_method || 'Caliper'}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle', fontFamily: 'monospace', color: '#64748b' }}>{dim.variable || '-'}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle', fontWeight: 'bold', color: '#0f172a' }}>{simVal} {dim.unit}</td>
                                                                <td style={{ padding: '6px 10px', verticalAlign: 'middle' }}>
                                                                    <span style={{
                                                                        padding: '1px 5px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.58rem',
                                                                        fontWeight: 'bold',
                                                                        backgroundColor: statStyle.bg,
                                                                        color: statStyle.text
                                                                    }}>
                                                                        {valStatus}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                    {(selectedDwg?.dimensions || []).length === 0 && (
                                                        <tr>
                                                            <td colSpan="9" style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', color: '#64748b' }}>
                                                                Belum ada parameter yang dipetakan pada blueprint ini.
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, overflow: 'hidden' }}>
                                    {scale ? (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', fontSize: '0.65rem', color: '#166534', fontWeight: 600 }}>
                                            <span>✓ Skala Terkalibrasi</span>
                                            <span>1 mm = {(1 / scale).toFixed(2)} px</span>
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px 10px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '0.65rem', color: '#b45309' }}>
                                            <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '3px' }}>⚠️ Skala Belum Kalibrasi</div>
                                            <div style={{ fontSize: '0.58rem' }}>Hasil ditampilkan dalam piksel. Gunakan tool Kalibrasi Skala 📏 di vertical toolbar untuk mengaktifkan satuan nyata.</div>
                                        </div>
                                    )}

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #10b981', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#f8fafc' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Panjang Kabel</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{totalCableReal.toFixed(2)} {scale ? 'm' : 'px'}</span>
                                        </div>
                                        <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#f8fafc' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Luas Cat</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{totalPaintReal.toFixed(2)} {scale ? 'm²' : 'px²'}</span>
                                        </div>
                                        <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#f8fafc' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Luas Lantai</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{totalFloorReal.toFixed(2)} {scale ? 'm²' : 'px²'}</span>
                                        </div>
                                        <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', borderLeft: '4px solid #ef4444', display: 'flex', flexDirection: 'column', gap: '2px', backgroundColor: '#f8fafc' }}>
                                            <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Jumlah Baut</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{totalBoltCount} pcs</span>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', border: '1px solid #e2e8f0', padding: '10px', borderRadius: '8px', backgroundColor: '#fafafb' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>Mulai Pengukuran Takeoff</span>
                                        
                                        {activeTakeoffCategory ? (
                                            <div style={{ display: 'flex', alignItems: 'center', justifyItem: 'center', justifyContent: 'space-between', backgroundColor: '#eff6ff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #bfdbfe' }}>
                                                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#1d4ed8' }}>
                                                    Mode Aktif: {
                                                        activeTakeoffCategory === 'length_cable' ? '📏 Kabel' :
                                                        activeTakeoffCategory === 'area_paint' ? '🎨 Cat Dinding' :
                                                        activeTakeoffCategory === 'area_floor' ? '🧱 Lantai' : '🔨 Baut'
                                                    }
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setActiveTakeoffCategory(null);
                                                        setCadTool('select');
                                                        setPolylineDraftPoints([]);
                                                    }}
                                                    style={{ border: 'none', background: '#ef4444', color: 'white', fontSize: '0.55rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                                                >
                                                    Selesai / Batal
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                                <button
                                                    onClick={() => {
                                                        setActiveTakeoffCategory('length_cable');
                                                        setCadTool('polyline');
                                                        setPolylineDraftPoints([]);
                                                        toast.success('Gunakan klik kiri untuk menggambar rute kabel di kanvas, double-klik untuk menutup.');
                                                    }}
                                                    style={{ flex: '1 1 48%', border: 'none', background: '#10b981', color: 'white', fontSize: '0.58rem', fontWeight: 800, padding: '6px 4px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    📏 Kabel (Linear)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveTakeoffCategory('area_paint');
                                                        setCadTool('rect');
                                                        toast.success('Gunakan klik & tarik (drag) di kanvas untuk menggambar kotak area cat.');
                                                    }}
                                                    style={{ flex: '1 1 48%', border: 'none', background: '#3b82f6', color: 'white', fontSize: '0.58rem', fontWeight: 800, padding: '6px 4px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    🎨 Luas Cat (Box)
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveTakeoffCategory('area_floor');
                                                        setCadTool('polyline');
                                                        setPolylineDraftPoints([]);
                                                        toast.success('Gunakan klik kiri untuk menggambar rute luas lantai, double-klik untuk menutup.');
                                                    }}
                                                    style={{ flex: '1 1 48%', border: 'none', background: '#f59e0b', color: 'white', fontSize: '0.58rem', fontWeight: 800, padding: '6px 4px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    🧱 Luas Lantai
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setActiveTakeoffCategory('count_bolt');
                                                        setCadTool('takeoff_count');
                                                        toast.success('Klik kiri di kanvas untuk menaruh tanda hitung baut (+1).');
                                                    }}
                                                    style={{ flex: '1 1 48%', border: 'none', background: '#ef4444', color: 'white', fontSize: '0.58rem', fontWeight: 800, padding: '6px 4px', borderRadius: '6px', cursor: 'pointer' }}
                                                >
                                                    🔨 Hitung Baut
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none', marginTop: '6px' }}>
                                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569' }}>Daftar Takeoff ({takeoffShapes.length})</span>
                                        <button
                                            onClick={handleExportTakeoffCSV}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '3px',
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                backgroundColor: '#7c3aed',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                padding: '3px 8px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.2s',
                                                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#6d28d9'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#7c3aed'}
                                        >
                                            <FileDown size={10} /> Ekspor (CSV)
                                        </button>
                                    </div>

                                    <div style={{ overflow: 'auto', flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.65rem', textAlign: 'left' }}>
                                            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f1f5f9', borderBottom: '2px solid #cbd5e1', zIndex: 5, color: '#475569', fontWeight: 'bold' }}>
                                                <tr>
                                                    <th style={{ padding: '6px 8px', width: '20px' }}>Warna</th>
                                                    <th style={{ padding: '6px 8px' }}>Nama Item</th>
                                                    <th style={{ padding: '6px 8px', textAlign: 'right' }}>Nilai</th>
                                                    <th style={{ padding: '6px 8px', textAlign: 'center', width: '30px' }}>Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {takeoffShapes.map((shape) => {
                                                    const isSelected = selectedShapeId === shape.id;
                                                    let valStr = "";
                                                    if (shape.takeoffType === 'length') {
                                                        const raw = computeShapeLength(shape);
                                                        valStr = scale ? `${((raw * scale) / 1000).toFixed(2)} m` : `${raw.toFixed(1)} px`;
                                                    } else if (shape.takeoffType === 'area') {
                                                        const raw = computeShapeArea(shape);
                                                        valStr = scale ? `${((raw * (scale ** 2)) / 1000000).toFixed(2)} m²` : `${raw.toFixed(1)} px²`;
                                                    } else if (shape.takeoffType === 'count') {
                                                        valStr = "1 pcs";
                                                    }

                                                    return (
                                                        <tr
                                                            key={shape.id}
                                                            style={{
                                                                borderBottom: '1px solid #f1f5f9',
                                                                backgroundColor: isSelected ? '#f5f3ff' : 'transparent',
                                                                transition: 'background-color 0.15s',
                                                                cursor: 'pointer'
                                                            }}
                                                            onClick={() => setSelectedShapeId(shape.id)}
                                                        >
                                                            <td style={{ padding: '4px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: shape.color, display: 'inline-block', border: '1px solid rgba(0,0,0,0.1)' }}></div>
                                                            </td>
                                                            <td style={{ padding: '4px 8px', verticalAlign: 'middle' }}>
                                                                <input
                                                                    type="text"
                                                                    value={shape.takeoffName || ""}
                                                                    onChange={(e) => handleUpdateShapeProp(shape.id, 'takeoffName', e.target.value)}
                                                                    style={{
                                                                        border: '1px solid transparent',
                                                                        background: 'none',
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 600,
                                                                        color: '#1e293b',
                                                                        width: '100%',
                                                                        padding: '2px 4px',
                                                                        borderRadius: '4px',
                                                                        outline: 'none'
                                                                    }}
                                                                    onFocus={(e) => {
                                                                        setSelectedShapeId(shape.id);
                                                                        e.target.style.backgroundColor = 'white';
                                                                        e.target.style.borderColor = '#d1d5db';
                                                                    }}
                                                                    onBlur={(e) => {
                                                                        e.target.style.backgroundColor = 'transparent';
                                                                        e.target.style.borderColor = 'transparent';
                                                                    }}
                                                                />
                                                            </td>
                                                            <td style={{ padding: '4px 8px', verticalAlign: 'middle', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                                                                {valStr}
                                                            </td>
                                                            <td style={{ padding: '4px 8px', verticalAlign: 'middle', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const updatedShapes = (selectedDwg.shapes || []).filter(s => s.id !== shape.id);
                                                                        updateShapes(updatedShapes);
                                                                        toast.success("Item takeoff dihapus.");
                                                                    }}
                                                                    title="Hapus Item"
                                                                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', transition: 'color 0.15s', padding: '2px' }}
                                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                                    onMouseLeave={e => e.currentTarget.style.color = '#cbd5e1'}
                                                                >
                                                                    <Trash2 size={11} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {takeoffShapes.length === 0 && (
                                                    <tr>
                                                        <td colSpan="4" style={{ padding: '16px', verticalAlign: 'middle', textAlign: 'center', color: '#64748b' }}>
                                                            Belum ada item takeoff pada blueprint ini.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CAD Canvas Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0b1d33', borderRadius: '16px', border: '1px solid #1e3a8a', overflow: 'hidden', position: 'relative', height: '100%', minHeight: 0 }}>
                        
                        {/* AutoCAD Window Title Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 10px',
                            backgroundColor: '#0f172a',
                            borderBottom: '1px solid #1e293b',
                            zIndex: 11,
                            userSelect: 'none',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            {/* Left: Application Logo + Quick Access */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{
                                    backgroundColor: '#b91c1c', color: 'white', fontWeight: 900,
                                    fontSize: '0.75rem', width: '18px', height: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '3px', fontFamily: "'Outfit', sans-serif"
                                }}>A</span>
                                <div style={{ width: '1px', height: '12px', backgroundColor: '#334155' }}></div>
                                <button title="Undo" disabled={undoStack.length === 0} onClick={handleUndo} style={{ background: 'none', border: 'none', color: undoStack.length === 0 ? '#475569' : '#94a3b8', cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer', padding: '2px' }}><Undo size={11} /></button>
                                <button title="Redo" disabled={redoStack.length === 0} onClick={handleRedo} style={{ background: 'none', border: 'none', color: redoStack.length === 0 ? '#475569' : '#94a3b8', cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer', padding: '2px' }}><Redo size={11} /></button>
                                <button title="Clear vector drawing overlay" onClick={() => { if (window.confirm('Hapus semua coretan/gambar CAD kustom?')) updateShapes([]); }} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: '2px' }}><Trash2 size={11} /></button>
                            </div>

                            {/* Center: File name tab title */}
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>
                                MaviCAD 2026 - [ {selectedDwg ? selectedDwg.fileName : 'New Drawing.dwg'} ]
                            </div>

                            {/* Right: Window control icons */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.65rem', color: '#475569' }}>
                                <span style={{ cursor: 'pointer' }} title="Minimize">─</span>
                                <span style={{ cursor: 'pointer' }} title="Maximize">▢</span>
                                <span style={{ cursor: 'pointer', color: '#ef4444' }} title="Close">✕</span>
                            </div>
                        </div>

                        {/* AutoCAD properties & options bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '4px 10px',
                            backgroundColor: '#0f172a',
                            borderBottom: '1px solid #1e3a8a',
                            gap: '6px',
                            zIndex: 10,
                            userSelect: 'none',
                            fontFamily: "'Inter', sans-serif",
                            minHeight: '32px'
                        }}>
                            {/* Properties group */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 'bold' }}>PROPERTIES:</span>
                                <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                                    {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCadColor(color)}
                                            style={{
                                                width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color,
                                                border: cadColor === color ? '1.5px solid white' : '1px solid rgba(255,255,255,0.2)',
                                                cursor: 'pointer', padding: 0
                                            }}
                                            title={`Active Color: ${color}`}
                                        />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '2px' }}>
                                    <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontWeight: 800 }}>{cadWidth}px</span>
                                    <input type="range" min="1" max="8" value={cadWidth} onChange={(e) => setCadWidth(parseInt(e.target.value))} style={{ width: '35px', accentColor: '#2563eb', cursor: 'pointer', height: '3px', margin: 0 }} title="Line Thickness" />
                                </div>
                                
                                <div style={{ width: '1px', height: '12px', backgroundColor: '#334155', margin: '0 4px' }} />

                                {/* Utilities */}
                                <button title="Export Drawing Schema" onClick={handleExportSchema} style={{ background: 'transparent', border: 'none', color: '#60a5fa', padding: '4px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Download size={13} />
                                </button>
                                <button title="Import Drawing Schema" onClick={() => { if (fileSchemaRef.current) fileSchemaRef.current.click(); }} style={{ background: 'transparent', border: 'none', color: '#34d399', padding: '4px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Upload size={13} />
                                </button>
                                <button title="Reset Template blueprint" onClick={handleResetToDefault} style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '4px', borderRadius: '3px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <RefreshCw size={13} />
                                </button>
                            </div>

                            {/* View toggles */}
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                    title="DISCUS Mode (Ballooning)"
                                    onClick={() => {
                                        setIsBalloonMode(prev => !prev);
                                        toast.success(!isBalloonMode ? 'Tampilan Balon Angka (DISCUS Mode) aktif.' : 'Tampilan nominal CAD aktif.');
                                    }}
                                    style={{
                                        background: isBalloonMode ? '#ef4444' : 'transparent',
                                        border: '1px solid #ef4444',
                                        color: isBalloonMode ? 'white' : '#ef4444',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    <Circle size={14} strokeWidth={isBalloonMode ? 3 : 2} fill={isBalloonMode ? 'white' : 'transparent'} />
                                </button>

                                <button
                                    title="Toggle QC Inspector Panel"
                                    onClick={() => {
                                        setShowQCInspector(prev => !prev);
                                        toast.success(!showQCInspector ? 'QC Inspector Panel aktif.' : 'QC Inspector Panel disembunyikan.');
                                    }}
                                    style={{
                                        background: showQCInspector ? '#2563eb' : 'transparent',
                                        border: '1px solid #2563eb',
                                        color: showQCInspector ? 'white' : '#60a5fa',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    <Sliders size={14} />
                                </button>

                                <button
                                    title="Toggle Tabel Karakteristik"
                                    onClick={() => {
                                        setShowBocTable(prev => !prev);
                                        toast.success(!showBocTable ? 'Tabel Karakteristik aktif.' : 'Tabel Karakteristik disembunyikan.');
                                    }}
                                    style={{
                                        background: showBocTable ? '#10b981' : 'transparent',
                                        border: '1px solid #10b981',
                                        color: showBocTable ? 'white' : '#34d399',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                >
                                    <ClipboardList size={14} />
                                </button>
                            </div>
                        </div>

                        {/* AutoCAD File tab strip */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#090d16',
                            borderBottom: '1px solid #1e3a8a',
                            padding: '3px 8px 0 8px',
                            gap: '2px',
                            userSelect: 'none',
                            fontFamily: "'Inter', sans-serif"
                        }}>
                            {drawings.map(dwg => {
                                const isSelected = dwg.id === selectedDwgId;
                                return (
                                    <div
                                        key={dwg.id}
                                        onClick={() => {
                                            setSelectedDwgId(dwg.id);
                                            setActiveDimId(dwg.dimensions?.length > 0 ? dwg.dimensions[0].id : '');
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            backgroundColor: isSelected ? '#1e293b' : '#0f172a60',
                                            border: '1px solid #1e3a8a',
                                            borderBottom: 'none',
                                            padding: '4px 8px',
                                            borderRadius: '4px 4px 0 0',
                                            cursor: 'pointer',
                                            transition: 'background-color 0.2s',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.58rem', color: isSelected ? '#60a5fa' : '#64748b', fontWeight: 800 }}>📁</span>
                                        <span style={{ fontSize: '0.58rem', color: isSelected ? '#f8fafc' : '#94a3b8', fontWeight: 700 }}>
                                            {dwg.fileName || dwg.name}
                                        </span>
                                        {drawings.length > 1 && (
                                            <button
                                                onClick={(e) => handleDeleteDwg(dwg.id, e)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.55rem', padding: '0 2px'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                            >
                                                ✕
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            <button
                                title="Create Blank Blueprint Design"
                                onClick={handleCreateBlankDrawing}
                                style={{
                                    background: 'none',
                                    border: '1px dashed #475569',
                                    color: '#64748b',
                                    padding: '2px 6px',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '0.58rem',
                                    fontWeight: 'bold',
                                    marginLeft: '4px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                            >
                                +
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

                        {/* AutoCAD Workspace Area (contains Vertical Toolbar + Canvas) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', width: '100%', minHeight: 0, overflow: 'hidden' }}>
                            
                            {/* Vertical Draw Toolbar / Palette */}
                            <div style={{
                                width: '42px',
                                backgroundColor: '#0f172a',
                                borderRight: '1px solid #1e3a8a',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                padding: '8px 0',
                                gap: '8px',
                                flexShrink: 0,
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none',
                                userSelect: 'none'
                            }}>
                                {/* DRAW SECTION */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.45rem', color: '#64748b', fontWeight: 'bold' }}>DRAW</span>
                                    <button title="Select Tool" onClick={() => setCadTool('select')} style={{ background: cadTool === 'select' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <MousePointer size={14} />
                                    </button>
                                    <button title="Pan View Tool (pan)" onClick={() => setCadTool('pan')} style={{ background: cadTool === 'pan' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Hand size={14} />
                                    </button>
                                    <button title="Line Tool (line)" onClick={() => setCadTool('line')} style={{ background: cadTool === 'line' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Slash size={14} />
                                    </button>
                                    <button title="Circle Tool (circle)" onClick={() => setCadTool('circle')} style={{ background: cadTool === 'circle' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Circle size={14} />
                                    </button>
                                    <button title="Rectangle Tool (rect)" onClick={() => setCadTool('rect')} style={{ background: cadTool === 'rect' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Square size={14} />
                                    </button>
                                    <button title="Arc Tool (arc)" onClick={() => setArcDrawState('idle') || setArcDraftCoords(null) || setCadTool('arc')} style={{ background: cadTool === 'arc' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20 A 16 16 0 0 1 20 4"/></svg>
                                    </button>
                                    <button title="Polyline Tool (polyline)" onClick={() => setPolylineDraftPoints([]) || setCadTool('polyline')} style={{ background: cadTool === 'polyline' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="4 20 10 8 16 16 20 4"/></svg>
                                    </button>
                                    <button title="Text Tool (text)" onClick={() => setCadTool('text')} style={{ background: cadTool === 'text' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Type size={14} />
                                    </button>
                                    <button title="Insert Image (image)" onClick={() => { setCadTool('image'); if (imageInsertRef.current) imageInsertRef.current.click(); }} style={{ background: cadTool === 'image' ? '#10b981' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ImagePlus size={14} />
                                    </button>
                                </div>

                                <div style={{ width: '20px', height: '1px', backgroundColor: '#1e3a8a', margin: '4px 0' }} />

                                {/* MODIFY SECTION */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.45rem', color: '#64748b', fontWeight: 'bold' }}>MODIFY</span>
                                    <button title="Move Tool (move)" onClick={() => setCadTool('move')} style={{ background: cadTool === 'move' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Move size={14} />
                                    </button>
                                    <button title="Rotate Tool (rotate)" onClick={() => setCadTool('rotate')} style={{ background: cadTool === 'rotate' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <RotateCw size={14} />
                                    </button>
                                    <button title="Mirror Tool (mirror)" onClick={() => setCadTool('mirror')} style={{ background: cadTool === 'mirror' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <FlipHorizontal size={14} />
                                    </button>
                                    <button title="Trim Tool (trim)" onClick={() => setCadTool('trim')} style={{ background: cadTool === 'trim' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Scissors size={14} />
                                    </button>
                                    <button title="Erase Tool (erase)" onClick={() => setCadTool('erase')} style={{ background: cadTool === 'erase' ? '#ef4444' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Eraser size={14} />
                                    </button>
                                </div>

                                <div style={{ width: '20px', height: '1px', backgroundColor: '#1e3a8a', margin: '4px 0' }} />

                                {/* ANNOTATE SECTION */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', width: '100%', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.45rem', color: '#64748b', fontWeight: 'bold' }}>ANNOT</span>
                                    <button title="Interactive Dimension Tool (dimension)" onClick={() => setDimDrawState('idle') || setDimDraftCoords(null) || setCadTool('dimension')} style={{ background: cadTool === 'dimension' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Ruler size={14} />
                                    </button>
                                    <button title="Scale Calibration Tool (scale)" onClick={() => setScaleDrawState('idle') || setScaleDraftCoords(null) || setCadTool('scale')} style={{ background: cadTool === 'scale' ? '#2563eb' : 'transparent', border: 'none', color: 'white', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Scale size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Right Column: Canvas SVG and Status Bar */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>

                                {/* Canvas SVG */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0px', position: 'relative', width: '100%', minHeight: 0 }}>
                            {selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType) ? (
                                <CADViewer3DEditor
                                    drawing={selectedDwg}
                                    dimensions={selectedDwg.dimensions || []}
                                    activeDimId={activeDimId}
                                    onAddDimension={handleAdd3DDimension}
                                    onSelectDimension={(id) => setActiveDimId(id)}
                                />
                            ) : (
                                <svg
                                    ref={svgRef}
                                viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                                onMouseDown={handleSvgMouseDown}
                                onMouseMove={handleSvgMouseMove}
                                onMouseUp={handleSvgMouseUp}
                                onDoubleClick={handleSvgDoubleClick}
                                onClick={handleCanvasClick}
                                onMouseEnter={() => setShowCrosshair(true)}
                                onMouseLeave={() => setShowCrosshair(false)}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    cursor: isPanning
                                        ? 'grabbing'
                                        : (spacePressed || cadTool === 'pan'
                                            ? 'grab'
                                            : (showCrosshair
                                                ? 'none'
                                                : (dragImageShape
                                                    ? 'grabbing'
                                                    : (cadTool === 'select'
                                                        ? (activeDim ? 'crosshair' : 'default')
                                                        : (cadTool === 'erase' ? 'pointer' : 'crosshair')))))
                                }}
                            >
                                <defs>
                                    <pattern id="canvas_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.25" />
                                    </pattern>
                                </defs>
                                {activeSpace === 'model' ? (
                                    <>
                                        <rect width="100%" height="100%" fill="url(#canvas_grid)" />
                                        <rect x="5" y="5" width={canvasSize.width - 10} height={canvasSize.height - 10} fill="none" stroke="#1e40af" strokeWidth="1" />
                                        <rect x="8" y="8" width={canvasSize.width - 16} height={canvasSize.height - 16} fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.5" />
                                    </>
                                ) : (() => {
                                    const sheetWidth = canvasSize.width * 0.9;
                                    const sheetHeight = canvasSize.height * 0.85;
                                    const sheetX = canvasSize.width * 0.05;
                                    const sheetY = canvasSize.height * 0.07;
                                    
                                    const titleBlockWidth = 140;
                                    const titleBlockHeight = 45;
                                    const titleBlockX = sheetX + sheetWidth - 15 - titleBlockWidth;
                                    const titleBlockY = sheetY + sheetHeight - 15 - titleBlockHeight;
                                    
                                    return (
                                        <>
                                            {/* Dark background for layout workspace */}
                                            <rect width="100%" height="100%" fill="#1e293b" />
                                            
                                            {/* Paper sheet shadow */}
                                            <rect x={sheetX + 4} y={sheetY + 4} width={sheetWidth} height={sheetHeight} fill="#090d16" opacity="0.4" rx="2" />
                                            
                                            {/* Paper sheet body */}
                                            <rect x={sheetX} y={sheetY} width={sheetWidth} height={sheetHeight} fill="#f8fafc" rx="2" />
                                            
                                            {/* Printable margin dashed border */}
                                            <rect x={sheetX + 15} y={sheetY + 15} width={sheetWidth - 30} height={sheetHeight - 30} fill="none" stroke="#cbd5e1" strokeWidth="0.75" strokeDasharray="3,3" />
                                            
                                            {/* AutoCAD Title Block */}
                                            <g style={{ userSelect: 'none' }}>
                                                <rect x={titleBlockX} y={titleBlockY} width={titleBlockWidth} height={titleBlockHeight} fill="#f8fafc" stroke="#64748b" strokeWidth="1" />
                                                <line x1={titleBlockX + 70} y1={titleBlockY} x2={titleBlockX + 70} y2={titleBlockY + titleBlockHeight} stroke="#64748b" strokeWidth="0.75" />
                                                <line x1={titleBlockX} y1={titleBlockY + 15} x2={titleBlockX + titleBlockWidth} y2={titleBlockY + 15} stroke="#64748b" strokeWidth="0.75" />
                                                <line x1={titleBlockX} y1={titleBlockY + 30} x2={titleBlockX + titleBlockWidth} y2={titleBlockY + 30} stroke="#64748b" strokeWidth="0.75" />
                                                <text x={titleBlockX + 5} y={titleBlockY + 10} fill="#475569" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">PROJECT: MAVI-MES QC</text>
                                                <text x={titleBlockX + 5} y={titleBlockY + 23} fill="#64748b" fontSize="5" fontFamily="sans-serif">DWG: {selectedDwg ? selectedDwg.fileName : 'New Drawing.dwg'}</text>
                                                <text x={titleBlockX + 75} y={titleBlockY + 23} fill="#2563eb" fontSize="5" fontWeight="800" fontFamily="sans-serif">SPACE: {activeSpace.toUpperCase()}</text>
                                                <text x={titleBlockX + 5} y={titleBlockY + 38} fill="#64748b" fontSize="5" fontFamily="sans-serif">BY: QC INSPECTOR</text>
                                                <text x={titleBlockX + 75} y={titleBlockY + 38} fill="#64748b" fontSize="5" fontFamily="sans-serif">SCALE: {selectedDwg?.scaleFactor ? 'CALIBRATED' : '1:1'}</text>
                                            </g>
                                        </>
                                    );
                                })()}

                                <g transform={`translate(${canvasSize.width / 2 + panOffset.x}, ${canvasSize.height / 2 + panOffset.y}) scale(${zoom}) translate(${-canvasSize.width / 2}, ${-canvasSize.height / 2})`}>
                                    {/* Blueprint backdrop */}
                                    {selectedDwg && (selectedDwg.fileType === 'PDF' || selectedDwg.fileType === 'DWG') && (pdfBackdropUrl || selectedDwg.dataUrl || selectedDwg.data_url) && !(pdfBackdropUrl === null && (selectedDwg.dataUrl || selectedDwg.data_url)?.startsWith('data:application/pdf')) && (
                                        <image
                                            href={pdfBackdropUrl || selectedDwg.dataUrl || selectedDwg.data_url}
                                            x="50"
                                            y="40"
                                            width={canvasSize.width - 100}
                                            height={canvasSize.height - 80}
                                            preserveAspectRatio="xMidYMid meet"
                                            opacity="0.85"
                                            style={{ pointerEvents: 'none' }}
                                        />
                                    )}

                                    {selectedDwg && selectedDwg.fileType === 'PDF' && (selectedDwg.dataUrl || selectedDwg.data_url) && !pdfBackdropUrl && (selectedDwg.dataUrl || selectedDwg.data_url).startsWith('data:application/pdf') && (
                                        <foreignObject x="50" y="80" width={canvasSize.width - 100} height={canvasSize.height - 160}>
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                height: '100%', padding: '20px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                                border: '1px dashed #ef4444', borderRadius: '8px', color: '#f8fafc',
                                                fontFamily: 'sans-serif', fontSize: '0.8rem'
                                            }}>
                                                <span style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️</span>
                                                <span style={{ fontWeight: 'bold', color: '#fca5a5', marginBottom: '4px' }}>Visual PDF Blueprint tidak aktif</span>
                                                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                                    Untuk merender gambar PDF secara visual, pastikan server Python lokal (yolo_server.py) berjalan di port 8000.
                                                </span>
                                            </div>
                                        </foreignObject>
                                    )}

                                    {selectedDwg && selectedDwg.fileType === 'DWG' && !selectedDwg.dataUrl && !pdfBackdropUrl && (
                                        <foreignObject x="50" y="80" width={canvasSize.width - 100} height={canvasSize.height - 160}>
                                            <div style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                height: '100%', padding: '20px', textAlign: 'center', backgroundColor: 'rgba(15, 23, 42, 0.75)',
                                                border: '1px dashed #3b82f6', borderRadius: '8px', color: '#f8fafc',
                                                fontFamily: 'sans-serif', fontSize: '0.8rem'
                                            }}>
                                                <span style={{ fontSize: '1.2rem', marginBottom: '8px' }}>⚠️</span>
                                                <span style={{ fontWeight: 'bold', color: '#93c5fd', marginBottom: '4px' }}>Visual DWG Blueprint tidak aktif</span>
                                                <span style={{ fontSize: '0.72rem', color: '#cbd5e1' }}>
                                                    Untuk merender visualisasi DWG, pastikan server Python lokal (yolo_server.py) berjalan dengan library ezdwg terpasang.
                                                </span>
                                            </div>
                                        </foreignObject>
                                    )}
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
                                    ) : selectedDwgId === 'dwg_product_checking' ? (
                                        <g>
                                            {/* Technical background blueprint legend/texts */}
                                            <text x="50" y="70" fill="#38bdf8" fontSize="7" fontFamily="monospace" opacity="0.6">UNSPECIFIED TOLERANCES ISO 2768-m</text>
                                            <text x="50" y="80" fill="#38bdf8" fontSize="7" fontFamily="monospace" opacity="0.6">ALL DIMENSIONS IN MM</text>
                                            
                                            {/* Stepped plate outline */}
                                            <path d="M 30,350 L 30,300 L 50,300 L 250,300 L 270,300 L 270,350 L 350,350 L 350,250 L 470,250 L 470,350 Z" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                            <line x1="30" y1="300" x2="270" y2="300" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,4,2,4" />
                                            
                                            {/* Circle for balloon mark */}
                                            <g>
                                                <circle cx="200" cy="200" r="15" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                                <circle cx="200" cy="200" r="8" fill="none" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="3,3" />
                                                <line x1="170" y1="200" x2="230" y2="200" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="10,2,2,2" />
                                                <line x1="200" y1="170" x2="200" y2="230" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="10,2,2,2" />
                                            </g>
                                            
                                            {/* Vertical cylinder/boss for pdf height */}
                                            <g>
                                                <rect x="385" y="100" width="30" height="100" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                                                <line x1="400" y1="80" x2="400" y2="220" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="5,2,1,2" />
                                            </g>
                                            
                                            {/* OpenCV Vision calibration target marker at (150, 250) */}
                                            <g>
                                                <circle cx="150" cy="250" r="10" fill="none" stroke="#3b82f6" strokeWidth="1" />
                                                <line x1="135" y1="250" x2="165" y2="250" stroke="#3b82f6" strokeWidth="0.5" />
                                                <line x1="150" y1="235" x2="150" y2="265" stroke="#3b82f6" strokeWidth="0.5" />
                                                <path d="M 150,250 L 156,250 A 6,6 0 0,1 150,256 Z" fill="#3b82f6" />
                                                <path d="M 150,250 L 144,250 A 6,6 0 0,1 150,244 Z" fill="#3b82f6" />
                                            </g>
                                            
                                            {/* QC Check test square pad at (100, 100) */}
                                            <g>
                                                <rect x="90" y="90" width="20" height="20" fill="none" stroke="#60a5fa" strokeWidth="1" />
                                                <line x1="90" y1="90" x2="110" y2="110" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="2,2" />
                                                <line x1="110" y1="90" x2="90" y2="110" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="2,2" />
                                            </g>
                                            
                                            {/* Trigger switch sensor at (300, 150) */}
                                            <g>
                                                <rect x="290" y="140" width="20" height="20" fill="none" stroke="#3b82f6" strokeWidth="1" rx="2" />
                                                <path d="M 300,143 L 295,150 L 300,150 L 298,157 L 305,149 L 299,149 Z" fill="#f59e0b" stroke="none" />
                                            </g>
                                        </g>
                                    ) : null}

                                    {/* Dynamic Indicators */}
                                    {selectedDwg && renderDimensionIndicators(selectedDwg.dimensions)}

                                    {/* Custom CAD Drawing Overlay */}
                                    {selectedDwg && (selectedDwg.shapes || []).map((shape) => {
                                        const center = getShapeCenter(shape);
                                        const rotationStr = shape.rotation ? `rotate(${shape.rotation}, ${shape.cx ?? center.x}, ${shape.cy ?? center.y})` : '';
                                         
                                         const isBlinking = 
                                             selectedShapeId === shape.id ||
                                             (hoveredShapeId === shape.id && ['move', 'rotate', 'mirror', 'trim'].includes(cadTool)) ||
                                             (dragShape && dragShape.id === shape.id && ['move', 'rotate'].includes(dragShape.type)) ||
                                             (mirrorMenu && mirrorMenu.shapeId === shape.id);
                                         const gClassName = isBlinking ? 'cad-blink' : '';
                                        
                                        const handleLocalClick = (e) => {
                                            e.stopPropagation();
                                            const coords = getCanvasCoords(e);
                                            
                                            if (cadTool === 'erase') {
                                                const currentShapes = selectedDwg.shapes || [];
                                                updateShapes(currentShapes.filter(s => s.id !== shape.id));
                                                toast.success('Bentuk terhapus', { id: 'erase-shape' });
                                            } else if (cadTool === 'mirror') {
                                                const parentRect = svgRef.current.parentElement.getBoundingClientRect();
                                                const top = e.clientY - parentRect.top;
                                                const left = e.clientX - parentRect.left;
                                                setMirrorMenu({
                                                    shapeId: shape.id,
                                                    x: left,
                                                    y: top
                                                });
                                            } else if (cadTool === 'trim' && shape.type === 'line') {
                                                handleTrimLine(shape, coords.x, coords.y);
                                            } else if (cadTool === 'select') {
                                                setSelectedShapeId(shape.id);
                                            }
                                        };

                                        const handleLocalMouseDown = (e) => {
                                            if (e.button !== 0) return; // left click only
                                            if (cadTool === 'move') {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                const coords = getCanvasCoords(e);
                                                setDragShape({
                                                    id: shape.id,
                                                    type: 'move',
                                                    startX: coords.x,
                                                    startY: coords.y,
                                                    startShape: JSON.parse(JSON.stringify(shape))
                                                });
                                            } else if (cadTool === 'rotate') {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                const coords = getCanvasCoords(e);
                                                const shapeCenter = getShapeCenter(shape);
                                                setDragShape({
                                                    id: shape.id,
                                                    type: 'rotate',
                                                    startX: coords.x,
                                                    startY: coords.y,
                                                    center: shapeCenter,
                                                    startShape: JSON.parse(JSON.stringify(shape))
                                                });
                                            }
                                        };

                                        const handleShapeMouseEnter = (e) => {
                                            setHoveredShapeId(shape.id);
                                            if (cadTool === 'erase') {
                                                const els = e.currentTarget.querySelectorAll('line, circle, rect, path, polyline');
                                                els.forEach(el => {
                                                    if (el.getAttribute('stroke') !== 'transparent') {
                                                        el.style.stroke = '#ef4444';
                                                        el.style.strokeDasharray = '4,2';
                                                    }
                                                });
                                                const textEl = e.currentTarget.querySelector('text');
                                                if (textEl) textEl.style.fill = '#ef4444';
                                            } else if (cadTool === 'trim' && shape.type === 'line') {
                                                const els = e.currentTarget.querySelectorAll('line');
                                                els.forEach(el => {
                                                    if (el.getAttribute('stroke') !== 'transparent') {
                                                        el.style.stroke = '#ef4444';
                                                        el.style.strokeDasharray = '4,2';
                                                    }
                                                });
                                            }
                                        };

                                        const handleShapeMouseLeave = (e) => {
                                             setHoveredShapeId(null);
                                            const els = e.currentTarget.querySelectorAll('line, circle, rect, path, polyline');
                                            els.forEach(el => {
                                                if (el.getAttribute('stroke') !== 'transparent') {
                                                    el.style.stroke = shape.color;
                                                    el.style.strokeDasharray = 'none';
                                                }
                                            });
                                            const textEl = e.currentTarget.querySelector('text');
                                            if (textEl) textEl.style.fill = shape.color;
                                        };

                                        const cursorStyle = 
                                            cadTool === 'erase' ? 'pointer' :
                                            cadTool === 'select' ? 'pointer' :
                                            cadTool === 'move' ? 'move' :
                                            cadTool === 'rotate' ? 'crosshair' :
                                            cadTool === 'mirror' ? 'pointer' :
                                            (cadTool === 'trim' && shape.type === 'line') ? 'pointer' :
                                            'default';

                                        const pointerEvents = ['move', 'rotate', 'mirror', 'trim', 'erase', 'select'].includes(cadTool) ? 'all' : 'none';

                                        const commonProps = {
                                            stroke: shape.color,
                                            strokeWidth: shape.strokeWidth || 2,
                                            style: { transition: 'all 0.1s' }
                                        };

                                        if (shape.type === 'line') {
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth="15" fill="none" />
                                                    <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} {...commonProps} fill="none" />
                                                </g>
                                            );
                                        } else if (shape.type === 'circle') {
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    <circle cx={shape.cx} cy={shape.cy} r={shape.r} stroke="transparent" strokeWidth="15" fill="none" />
                                                    <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...commonProps} fill="none" />
                                                </g>
                                            );
                                        } else if (shape.type === 'rect') {
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} stroke="transparent" strokeWidth="15" fill="none" />
                                                    <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...commonProps} fill="none" />
                                                </g>
                                            );
                                        } else if (shape.type === 'arc') {
                                            const sa = shape.startAngle ?? 0;
                                            const ea = shape.endAngle ?? 90;
                                            const saRad = sa * (Math.PI / 180);
                                            const eaRad = ea * (Math.PI / 180);
                                            const sx = shape.cx + shape.r * Math.cos(saRad);
                                            const sy = shape.cy + shape.r * Math.sin(saRad);
                                            const ex = shape.cx + shape.r * Math.cos(eaRad);
                                            const ey = shape.cy + shape.r * Math.sin(eaRad);
                                            const largeArc = Math.abs(ea - sa) > 180 ? 1 : 0;
                                            const sweepFlag = ea > sa ? 1 : 0;
                                            const pathD = `M ${sx},${sy} A ${shape.r},${shape.r} 0 ${largeArc},${sweepFlag} ${ex},${ey}`;
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    <path d={pathD} stroke="transparent" strokeWidth="15" fill="none" />
                                                    <path d={pathD} {...commonProps} fill="none" />
                                                </g>
                                            );
                                        } else if (shape.type === 'polyline') {
                                            const pointsStr = (shape.points || []).map(p => `${p.x},${p.y}`).join(' ');
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    <polyline points={pointsStr} stroke="transparent" strokeWidth="15" fill="none" />
                                                    <polyline points={pointsStr} {...commonProps} fill="none" />
                                                </g>
                                            );
                                        } else if (shape.type === 'text') {
                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleLocalClick}
                                                    onMouseDown={handleLocalMouseDown}
                                                    onMouseEnter={handleShapeMouseEnter}
                                                    onMouseLeave={handleShapeMouseLeave}
                                                    style={{ cursor: cursorStyle }}
                                                    pointerEvents={pointerEvents}
                                                >
                                                    {/* Extra wide invisible click background block for text */}
                                                    <rect
                                                        x={shape.x - 30}
                                                        y={shape.y - 12}
                                                        width="60"
                                                        height="24"
                                                        fill="transparent"
                                                    />
                                                    <text
                                                        x={shape.x}
                                                        y={shape.y}
                                                        fill={shape.color}
                                                        fontSize={shape.fontSize || 14}
                                                        textAnchor="middle"
                                                        dominantBaseline="middle"
                                                        style={{
                                                            fontFamily: 'monospace',
                                                            fontWeight: 'bold',
                                                            userSelect: 'none'
                                                        }}
                                                    >
                                                        {shape.text}
                                                    </text>
                                                </g>
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

                                            const handleImageClick = (e) => {
                                                if (cadTool === 'erase' || cadTool === 'mirror') {
                                                    handleLocalClick(e);
                                                } else if (cadTool === 'select') {
                                                    e.stopPropagation();
                                                    setSelectedShapeId(shape.id);
                                                }
                                            };

                                            const handleImageMouseDown = (e) => {
                                                if (cadTool === 'move' || cadTool === 'rotate') {
                                                    handleLocalMouseDown(e);
                                                } else if (cadTool === 'select') {
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
                                                }
                                            };

                                            const handleImageMouseEnter = (e) => {
                                                 setHoveredShapeId(shape.id);
                                                if (cadTool === 'erase') {
                                                    const imgEl = e.currentTarget.querySelector('svg');
                                                    if (imgEl) {
                                                        imgEl.style.opacity = '0.3';
                                                        imgEl.style.outline = '2px dashed #ef4444';
                                                    }
                                                }
                                            };

                                            const handleImageMouseLeave = (e) => {
                                                 setHoveredShapeId(null);
                                                const imgEl = e.currentTarget.querySelector('svg');
                                                if (imgEl) {
                                                    imgEl.style.opacity = shape.opacity || 0.85;
                                                    imgEl.style.outline = 'none';
                                                }
                                            };

                                            const imageCursorStyle = cadTool === 'erase' ? 'pointer' : (cadTool === 'select' ? (isDraggingThis ? 'grabbing' : 'grab') : cursorStyle);
                                            const imagePointerEvents = ['move', 'rotate', 'mirror', 'erase', 'select'].includes(cadTool) ? 'all' : 'none';

                                            return (
                                                <g
                                                    key={shape.id}
                                                    className={gClassName}
                                                    transform={rotationStr}
                                                    onClick={handleImageClick}
                                                    onMouseDown={handleImageMouseDown}
                                                    onMouseEnter={handleImageMouseEnter}
                                                    onMouseLeave={handleImageMouseLeave}
                                                    style={{ cursor: imageCursorStyle }}
                                                    pointerEvents={imagePointerEvents}
                                                >
                                                    {/* Cropped Image using nested <svg> viewport */}
                                                    <svg
                                                        x={displayX}
                                                        y={displayY}
                                                        width={displayW}
                                                        height={displayH}
                                                        viewBox={`${crop.x} ${crop.y} ${crop.w} ${crop.h}`}
                                                        preserveAspectRatio="none"
                                                        opacity={shape.opacity || 0.85}
                                                        style={{
                                                            transition: isDraggingThis ? 'none' : 'opacity 0.2s',
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

                                    {/* Real-time measurement tooltips for active line/circle/rect drawing */}
                                    {drawingShape && (() => {
                                        if (drawingShape.type === 'line') {
                                            const dx = drawingShape.x2 - drawingShape.x1;
                                            const dy = drawingShape.y2 - drawingShape.y1;
                                            const px = Math.sqrt(dx * dx + dy * dy);
                                            const factor = selectedDwg?.scaleFactor || 1.0;
                                            const text = selectedDwg?.scaleFactor ? `${(px * factor).toFixed(2)} mm` : `${px.toFixed(1)} px`;
                                            return (
                                                <g style={{ pointerEvents: 'none' }} transform={`translate(${mousePos.x + 15}, ${mousePos.y - 15})`}>
                                                    <rect x="0" y="-8" width="85" height="18" rx="3" fill="#0f172ae6" stroke="#3b82f6" strokeWidth="1" />
                                                    <text x="42.5" y="4" fill="#3b82f6" fontSize="8.5" fontWeight="bold" textAnchor="middle">{text}</text>
                                                </g>
                                            );
                                        } else if (drawingShape.type === 'circle') {
                                            const px = drawingShape.r;
                                            const factor = selectedDwg?.scaleFactor || 1.0;
                                            const text = selectedDwg?.scaleFactor ? `⌀ ${(px * 2 * factor).toFixed(2)} mm` : `⌀ ${(px * 2).toFixed(1)} px`;
                                            return (
                                                <g style={{ pointerEvents: 'none' }} transform={`translate(${mousePos.x + 15}, ${mousePos.y - 15})`}>
                                                    <rect x="0" y="-8" width="85" height="18" rx="3" fill="#0f172ae6" stroke="#3b82f6" strokeWidth="1" />
                                                    <text x="42.5" y="4" fill="#3b82f6" fontSize="8.5" fontWeight="bold" textAnchor="middle">{text}</text>
                                                </g>
                                            );
                                        } else if (drawingShape.type === 'rect') {
                                            const factor = selectedDwg?.scaleFactor || 1.0;
                                            const w = drawingShape.w * factor;
                                            const h = drawingShape.h * factor;
                                            const unit = selectedDwg?.scaleFactor ? 'mm' : 'px';
                                            return (
                                                <g style={{ pointerEvents: 'none' }} transform={`translate(${mousePos.x + 15}, ${mousePos.y - 15})`}>
                                                    <rect x="0" y="-8" width="95" height="18" rx="3" fill="#0f172ae6" stroke="#3b82f6" strokeWidth="1" />
                                                    <text x="47.5" y="4" fill="#3b82f6" fontSize="8" fontWeight="bold" textAnchor="middle">{`${w.toFixed(1)}x${h.toFixed(1)} ${unit}`}</text>
                                                </g>
                                            );
                                        }
                                        return null;
                                    })()}

                                    {/* Scale Calibration Line Draft Preview */}
                                    {cadTool === 'scale' && scaleDraftCoords && (
                                        <g style={{ pointerEvents: 'none' }}>
                                            <line x1={scaleDraftCoords.x1} y1={scaleDraftCoords.y1} x2={scaleDraftCoords.x2} y2={scaleDraftCoords.y2} stroke="#10b981" strokeWidth="2.5" />
                                            <circle cx={scaleDraftCoords.x1} cy={scaleDraftCoords.y1} r="4" fill="#10b981" />
                                            <circle cx={scaleDraftCoords.x2} cy={scaleDraftCoords.y2} r="4" fill="#10b981" />
                                            {(() => {
                                                const px = Math.sqrt((scaleDraftCoords.x2 - scaleDraftCoords.x1)**2 + (scaleDraftCoords.y2 - scaleDraftCoords.y1)**2);
                                                return (
                                                    <g transform={`translate(${(scaleDraftCoords.x1 + scaleDraftCoords.x2)/2}, ${(scaleDraftCoords.y1 + scaleDraftCoords.y2)/2 - 15})`}>
                                                        <rect x="-40" y="-8" width="80" height="16" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                                                        <text x="0" y="4" fill="#10b981" fontSize="9" fontWeight="bold" textAnchor="middle">{px.toFixed(1)} px</text>
                                                    </g>
                                                );
                                            })()}
                                        </g>
                                    )}

                                    {/* Dimension Drafting Previews */}
                                    {cadTool === 'dimension' && dimDraftCoords && (
                                        <g style={{ pointerEvents: 'none' }}>
                                            {dimDrawState === 'waiting_end' && (
                                                <>
                                                    <line x1={dimDraftCoords.x1} y1={dimDraftCoords.y1} x2={dimDraftCoords.x2} y2={dimDraftCoords.y2} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3,3" />
                                                    <circle cx={dimDraftCoords.x1} cy={dimDraftCoords.y1} r="4" fill="#3b82f6" />
                                                    <circle cx={dimDraftCoords.x2} cy={dimDraftCoords.y2} r="4" fill="#3b82f6" />
                                                    {(() => {
                                                        const px = Math.sqrt((dimDraftCoords.x2 - dimDraftCoords.x1)**2 + (dimDraftCoords.y2 - dimDraftCoords.y1)**2);
                                                        const factor = selectedDwg?.scaleFactor || 1.0;
                                                        const text = selectedDwg?.scaleFactor ? `${(px * factor).toFixed(2)} mm` : `${px.toFixed(1)} px`;
                                                        return (
                                                            <g transform={`translate(${(dimDraftCoords.x1 + dimDraftCoords.x2)/2}, ${(dimDraftCoords.y1 + dimDraftCoords.y2)/2 - 15})`}>
                                                                <rect x="-40" y="-8" width="80" height="16" rx="2" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                                                                <text x="0" y="4" fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">{text}</text>
                                                            </g>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                            {dimDrawState === 'waiting_offset' && (
                                                <>
                                                    <line x1={dimDraftCoords.x1} y1={dimDraftCoords.y1} x2={dimDraftCoords.x1} y2={dimDraftCoords.ly} stroke="rgba(148,163,184,0.4)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                    <line x1={dimDraftCoords.x2} y1={dimDraftCoords.y2} x2={dimDraftCoords.x2} y2={dimDraftCoords.ly} stroke="rgba(148,163,184,0.4)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                    <line x1={dimDraftCoords.x1} y1={dimDraftCoords.ly} x2={dimDraftCoords.x2} y2={dimDraftCoords.ly} stroke="#3b82f6" strokeWidth="1.5" />
                                                    <polygon points={`${dimDraftCoords.x1},${dimDraftCoords.ly} ${dimDraftCoords.x1+8},${dimDraftCoords.ly-3} ${dimDraftCoords.x1+8},${dimDraftCoords.ly+3}`} fill="#3b82f6" />
                                                    <polygon points={`${dimDraftCoords.x2},${dimDraftCoords.ly} ${dimDraftCoords.x2-8},${dimDraftCoords.ly-3} ${dimDraftCoords.x2-8},${dimDraftCoords.ly+3}`} fill="#3b82f6" />
                                                    
                                                    <g transform={`translate(${dimDraftCoords.lx}, ${dimDraftCoords.ly - 10})`}>
                                                        <rect x="-45" y="-8" width="90" height="16" rx="2" fill="#0f172a" stroke="#3b82f6" strokeWidth="1" />
                                                        <text x="0" y="4" fill="#3b82f6" fontSize="9" fontWeight="bold" textAnchor="middle">
                                                            {(() => {
                                                                const px = Math.sqrt((dimDraftCoords.x2 - dimDraftCoords.x1)**2 + (dimDraftCoords.y2 - dimDraftCoords.y1)**2);
                                                                const factor = selectedDwg?.scaleFactor || 1.0;
                                                                return selectedDwg?.scaleFactor ? `${(px * factor).toFixed(2)} mm` : `${px.toFixed(1)} px`;
                                                            })()}
                                                        </text>
                                                    </g>
                                                </>
                                            )}
                                        </g>
                                    )}

                                    {/* Arc Drafting Previews */}
                                    {cadTool === 'arc' && arcDraftCoords && (
                                        <g style={{ pointerEvents: 'none' }}>
                                            <circle cx={arcDraftCoords.cx} cy={arcDraftCoords.cy} r="3" fill="#60a5fa" />
                                            {arcDrawState === 'waiting_radius' && (
                                                <>
                                                    <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={mousePos.x} y2={mousePos.y} stroke="#60a5fa" strokeDasharray="3,3" strokeWidth="1" />
                                                    <circle cx={arcDraftCoords.cx} cy={arcDraftCoords.cy} r={arcDraftCoords.r} fill="none" stroke="#60a5fa" strokeDasharray="3,3" strokeWidth="1" />
                                                    {(() => {
                                                        const factor = selectedDwg?.scaleFactor || 1.0;
                                                        const text = selectedDwg?.scaleFactor ? `R: ${(arcDraftCoords.r * factor).toFixed(2)} mm` : `R: ${arcDraftCoords.r.toFixed(1)} px`;
                                                        return (
                                                            <g transform={`translate(${(arcDraftCoords.cx + mousePos.x)/2}, ${(arcDraftCoords.cy + mousePos.y)/2 - 10})`}>
                                                                <rect x="-40" y="-8" width="80" height="16" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
                                                                <text x="0" y="4" fill="#60a5fa" fontSize="8" fontWeight="bold" textAnchor="middle">{text}</text>
                                                            </g>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                            {arcDrawState === 'waiting_end' && (
                                                <>
                                                    <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={arcDraftCoords.x1} y2={arcDraftCoords.y1} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" />
                                                    <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={mousePos.x} y2={mousePos.y} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" />
                                                    {(() => {
                                                        const cx = arcDraftCoords.cx;
                                                        const cy = arcDraftCoords.cy;
                                                        const r = arcDraftCoords.r;
                                                        const sa = arcDraftCoords.startAngle;
                                                        const eaRad = Math.atan2(mousePos.y - cy, mousePos.x - cx);
                                                        const eaDeg = eaRad * (180 / Math.PI);
                                                        const saRad = sa * (Math.PI / 180);
                                                        const sx = cx + r * Math.cos(saRad);
                                                        const sy = cy + r * Math.sin(saRad);
                                                        const ex = cx + r * Math.cos(eaRad);
                                                        const ey = cy + r * Math.sin(eaRad);
                                                        const largeArc = Math.abs(eaDeg - sa) > 180 ? 1 : 0;
                                                        const sweepFlag = eaDeg > sa ? 1 : 0;
                                                        return (
                                                            <path
                                                                d={`M ${sx},${sy} A ${r},${r} 0 ${largeArc},${sweepFlag} ${ex},${ey}`}
                                                                fill="none"
                                                                stroke={cadColor}
                                                                strokeWidth={cadWidth}
                                                            />
                                                        );
                                                    })()}
                                                    {(() => {
                                                        const cx = arcDraftCoords.cx;
                                                        const cy = arcDraftCoords.cy;
                                                        const sa = arcDraftCoords.startAngle;
                                                        const eaDeg = Math.atan2(mousePos.y - cy, mousePos.x - cx) * (180 / Math.PI);
                                                        let angleDiff = Math.abs(eaDeg - sa);
                                                        if (angleDiff > 180) angleDiff = 360 - angleDiff;
                                                        return (
                                                            <g transform={`translate(${mousePos.x}, ${mousePos.y - 15})`}>
                                                                <rect x="-30" y="-8" width="60" height="16" rx="2" fill="#0f172a" stroke="#60a5fa" strokeWidth="1" />
                                                                <text x="0" y="4" fill="#60a5fa" fontSize="8" fontWeight="bold" textAnchor="middle">{angleDiff.toFixed(1)}°</text>
                                                            </g>
                                                        );
                                                    })()}
                                                </>
                                            )}
                                        </g>
                                    )}

                                    {/* Polyline Drafting Previews */}
                                    {cadTool === 'polyline' && polylineDraftPoints.length > 0 && (
                                        <g style={{ pointerEvents: 'none' }}>
                                            <polyline
                                                points={polylineDraftPoints.map(p => `${p.x},${p.y}`).join(' ')}
                                                fill="none"
                                                stroke={cadColor}
                                                strokeWidth={cadWidth}
                                                strokeDasharray="4,2"
                                            />
                                            {polylineDraftPoints.slice(0, -1).map((p, idx) => (
                                                <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#10b981" />
                                            ))}
                                            <circle cx={polylineDraftPoints[polylineDraftPoints.length - 1].x} cy={polylineDraftPoints[polylineDraftPoints.length - 1].y} r="3" fill="#ef4444" />
                                            {polylineDraftPoints.length > 1 && (() => {
                                                const p1 = polylineDraftPoints[polylineDraftPoints.length - 2];
                                                const p2 = polylineDraftPoints[polylineDraftPoints.length - 1];
                                                const px = Math.sqrt((p2.x - p1.x)**2 + (p2.y - p1.y)**2);
                                                const factor = selectedDwg?.scaleFactor || 1.0;
                                                const text = selectedDwg?.scaleFactor ? `${(px * factor).toFixed(2)} mm` : `${px.toFixed(1)} px`;
                                                return (
                                                    <g transform={`translate(${p2.x}, ${p2.y - 15})`}>
                                                        <rect x="-35" y="-8" width="70" height="16" rx="2" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
                                                        <text x="0" y="4" fill="#10b981" fontSize="8" fontWeight="bold" textAnchor="middle">{text}</text>
                                                    </g>
                                                );
                                            })()}
                                        </g>
                                    )}
                                </g>

                                {/* UCS Coordinate Axis Indicator */}
                                <g transform={`translate(35, ${canvasSize.height - 35})`} style={{ pointerEvents: 'none' }}>
                                    <line x1="0" y1="0" x2="20" y2="0" stroke="#ef4444" strokeWidth="1.5" />
                                    <polygon points="20,-2 25,0 20,2" fill="#ef4444" />
                                    <text x="28" y="3" fill="#ef4444" fontSize="7" fontWeight="bold" fontFamily="sans-serif">X</text>

                                    <line x1="0" y1="0" x2="0" y2="-20" stroke="#10b981" strokeWidth="1.5" />
                                    <polygon points="-2,-20 0,-25 2,-20" fill="#10b981" />
                                    <text x="4" y="-22" fill="#10b981" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Y</text>

                                    <rect x="-3" y="-3" width="6" height="6" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                                    <circle cx="0" cy="0" r="1" fill="#e2e8f0" />
                                </g>



                                {/* Selection Crosshair cursor */}
                                {showCrosshair && (() => {
                                    const cx = canvasSize.width / 2;
                                    const cy = canvasSize.height / 2;
                                    const screenX = cx + (crosshairPos.x - cx) * zoom + panOffset.x;
                                    const screenY = cy + (crosshairPos.y - cy) * zoom + panOffset.y;
                                    return (
                                        <g style={{ pointerEvents: 'none' }}>
                                            <line
                                                x1={screenX}
                                                y1={0}
                                                x2={screenX}
                                                y2={canvasSize.height}
                                                stroke="#94a3b8"
                                                strokeWidth="0.5"
                                                strokeDasharray="2,2"
                                                opacity="0.6"
                                            />
                                            <line
                                                x1={0}
                                                y1={screenY}
                                                x2={canvasSize.width}
                                                y2={screenY}
                                                stroke="#94a3b8"
                                                strokeWidth="0.5"
                                                strokeDasharray="2,2"
                                                opacity="0.6"
                                            />
                                            <rect
                                                x={screenX - 4}
                                                y={screenY - 4}
                                                width="8"
                                                height="8"
                                                fill="none"
                                                stroke="#2563eb"
                                                strokeWidth="1"
                                            />
                                        </g>
                                    );
                                })()}
                            </svg>
                            )}

                            {/* Custom Floating Horizontal Scrollbar */}
                            {zoom > 0.5 && (() => {
                                const maxPanX = (canvasSize.width * zoom) / 2;
                                if (maxPanX <= 0) return null;
                                const trackWidth = canvasSize.width - 40;
                                const thumbWidth = Math.max(30, trackWidth / Math.max(1, zoom));
                                const scrollableTrack = trackWidth - thumbWidth;
                                const ratio = (maxPanX - panOffset.x) / (maxPanX * 2);
                                const thumbLeft = Math.max(0, Math.min(scrollableTrack, ratio * scrollableTrack));
                                
                                const handleHScrollMouseDown = (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    scrollStartRef.current = {
                                        mouseX: e.clientX,
                                        mouseY: e.clientY,
                                        panX: panOffset.x,
                                        panY: panOffset.y
                                    };
                                    setIsDraggingScroll('horizontal');
                                };

                                return (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            bottom: '6px',
                                            left: '20px',
                                            width: `${trackWidth}px`,
                                            height: '8px',
                                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            zIndex: 20,
                                            pointerEvents: 'auto'
                                        }}
                                    >
                                        <div
                                            onMouseDown={handleHScrollMouseDown}
                                            style={{
                                                position: 'absolute',
                                                left: `${thumbLeft}px`,
                                                width: `${thumbWidth}px`,
                                                height: '100%',
                                                backgroundColor: isDraggingScroll === 'horizontal' ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
                                                borderRadius: '4px',
                                                cursor: 'ew-resize',
                                                transition: isDraggingScroll === 'horizontal' ? 'none' : 'background-color 0.2s, left 0.1s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                            }}
                                            onMouseEnter={e => { if (isDraggingScroll !== 'horizontal') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; }}
                                            onMouseLeave={e => { if (isDraggingScroll !== 'horizontal') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }}
                                        />
                                    </div>
                                );
                            })()}

                            {/* Custom Floating Vertical Scrollbar */}
                            {zoom > 0.5 && (() => {
                                const maxPanY = (canvasSize.height * zoom) / 2;
                                if (maxPanY <= 0) return null;
                                const trackHeight = canvasSize.height - 40;
                                const thumbHeight = Math.max(30, trackHeight / Math.max(1, zoom));
                                const scrollableTrack = trackHeight - thumbHeight;
                                const ratio = (maxPanY - panOffset.y) / (maxPanY * 2);
                                const thumbTop = Math.max(0, Math.min(scrollableTrack, ratio * scrollableTrack));

                                const handleVScrollMouseDown = (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    scrollStartRef.current = {
                                        mouseX: e.clientX,
                                        mouseY: e.clientY,
                                        panX: panOffset.x,
                                        panY: panOffset.y
                                    };
                                    setIsDraggingScroll('vertical');
                                };

                                return (
                                    <div
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '20px',
                                            width: '8px',
                                            height: `${trackHeight}px`,
                                            backgroundColor: 'rgba(15, 23, 42, 0.6)',
                                            borderRadius: '4px',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            zIndex: 20,
                                            pointerEvents: 'auto'
                                        }}
                                    >
                                        <div
                                            onMouseDown={handleVScrollMouseDown}
                                            style={{
                                                position: 'absolute',
                                                top: `${thumbTop}px`,
                                                width: '100%',
                                                height: `${thumbHeight}px`,
                                                backgroundColor: isDraggingScroll === 'vertical' ? '#3b82f6' : 'rgba(255, 255, 255, 0.3)',
                                                borderRadius: '4px',
                                                cursor: 'ns-resize',
                                                transition: isDraggingScroll === 'vertical' ? 'none' : 'background-color 0.2s, top 0.1s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                            }}
                                            onMouseEnter={e => { if (isDraggingScroll !== 'vertical') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.5)'; }}
                                            onMouseLeave={e => { if (isDraggingScroll !== 'vertical') e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'; }}
                                        />
                                    </div>
                                );
                            })()}

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

                            {/* Absolutely positioned Mirror Tool Menu */}
                            {mirrorMenu && (
                                <div style={{
                                    position: 'absolute',
                                    top: `${mirrorMenu.y}px`,
                                    left: `${mirrorMenu.x}px`,
                                    transform: 'translate(-50%, -100%) translateY(-10px)',
                                    backgroundColor: '#0f172ae6',
                                    border: '1px solid #3b82f6',
                                    borderRadius: '8px',
                                    padding: '6px 10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                    zIndex: 1000,
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                    fontFamily: "'Inter', sans-serif"
                                }}>
                                    <div style={{ fontSize: '0.6rem', color: '#93c5fd', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center', whiteSpace: 'nowrap' }}>
                                        Cermin Bentuk (Mirror)
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <button
                                            onClick={() => handleMirrorShape(mirrorMenu.shapeId, 'horizontal')}
                                            style={{
                                                padding: '4px 8px', backgroundColor: '#2563eb', color: 'white',
                                                border: 'none', borderRadius: '4px', fontSize: '0.65rem',
                                                fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                                            }}
                                        >
                                            Horizontal
                                        </button>
                                        <button
                                            onClick={() => handleMirrorShape(mirrorMenu.shapeId, 'vertical')}
                                            style={{
                                                padding: '4px 8px', backgroundColor: '#2563eb', color: 'white',
                                                border: 'none', borderRadius: '4px', fontSize: '0.65rem',
                                                fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px'
                                            }}
                                        >
                                            Vertical
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => setMirrorMenu(null)}
                                        style={{
                                            background: 'transparent', border: 'none', color: '#94a3b8',
                                            fontSize: '0.6rem', fontWeight: 'bold', cursor: 'pointer', textAlign: 'center',
                                            padding: '2px 0'
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                        onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                    >
                                        Batal
                                    </button>
                                </div>
                            )}



                        </div>

                        {/* AutoCAD Status Bar */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#0f172a',
                            borderTop: '1px solid #1e293b',
                            padding: '4px 12px',
                            color: '#94a3b8',
                            fontSize: '0.65rem',
                            fontFamily: "'Inter', sans-serif",
                            userSelect: 'none',
                            zIndex: 11
                        }}>
                            {/* Left Side: Model / Layout Tabs */}
                            <div style={{ display: 'flex', alignItems: 'stretch', gap: '1px', backgroundColor: '#090d16', padding: '2px', borderRadius: '4px' }}>
                                {[
                                    { id: 'model', label: 'Model' },
                                    { id: 'layout1', label: 'Layout 1' },
                                    { id: 'layout2', label: 'Layout 2' }
                                ].map(tab => {
                                    const isActive = activeSpace === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveSpace(tab.id)}
                                            style={{
                                                backgroundColor: isActive ? '#2563eb' : 'transparent',
                                                color: isActive ? '#ffffff' : '#64748b',
                                                border: 'none',
                                                borderRadius: '3px',
                                                padding: '2px 8px',
                                                fontSize: '0.58rem',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                transition: 'all 0.15s'
                                            }}
                                        >
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Side: Coordinates, snap, ortho, scale */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    fontFamily: 'monospace',
                                    backgroundColor: '#090d16',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    color: '#38bdf8',
                                    fontSize: '0.58rem',
                                    border: '1px solid #1e293b'
                                }}>
                                    {crosshairPos.x.toFixed(1)}, {crosshairPos.y.toFixed(1)}, 0.0
                                </div>

                                <div style={{ width: '1px', height: '12px', backgroundColor: '#334155' }}></div>

                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => setGridSnap(g => !g)}
                                        title="Grid Snap (GRID)"
                                        style={{
                                            backgroundColor: gridSnap ? '#2563eb20' : 'transparent',
                                            border: '1px solid ' + (gridSnap ? '#2563eb' : '#334155'),
                                            color: gridSnap ? '#60a5fa' : '#64748b',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '0.55rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}
                                    >
                                        <Magnet size={9} /> SNAP
                                    </button>
                                    
                                    <button
                                        onClick={() => setOrthoMode(o => !o)}
                                        title="Ortho Mode Lock (ORTHO)"
                                        style={{
                                            backgroundColor: orthoMode ? '#2563eb20' : 'transparent',
                                            border: '1px solid ' + (orthoMode ? '#2563eb' : '#334155'),
                                            color: orthoMode ? '#60a5fa' : '#64748b',
                                            borderRadius: '4px',
                                            padding: '2px 6px',
                                            fontSize: '0.55rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '2px'
                                        }}
                                    >
                                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 20 L20 20 M4 20 L4 4" /></svg> ORTHO
                                    </button>
                                </div>

                                <div style={{ width: '1px', height: '12px', backgroundColor: '#334155' }}></div>

                                <div style={{ fontSize: '0.58rem', fontWeight: 600, color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span>SCALE: {selectedDwg?.scaleFactor ? `1:${(1 / selectedDwg.scaleFactor).toFixed(1)}` : '1:1'} ({Math.round(zoom * 100)}%)</span>
                                    <button
                                        onClick={() => {
                                            setZoom(1.0);
                                            setPanOffset({ x: 0, y: 0 });
                                            toast.success('Tampilan kanvas direset.', { id: 'reset-view' });
                                        }}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid #334155',
                                            color: '#94a3b8',
                                            padding: '1px 6px',
                                            borderRadius: '3px',
                                            fontSize: '0.52rem',
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.backgroundColor = '#2563eb';
                                            e.currentTarget.style.borderColor = '#2563eb';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = '#94a3b8';
                                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = '#334155';
                                        }}
                                    >
                                        RESET VIEW
                                    </button>
                                </div>
                            </div>
                        </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar: Parameter Mapping (Top) + QC Simulator (Bottom) */}
                    {showQCInspector && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', minHeight: 0 }}>
                            {/* Parameter Mapping Panel */}
                            <div style={{
                                flex: 1.2,
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minHeight: 0,
                                fontFamily: "'Inter', sans-serif",
                                color: '#1e293b'
                            }}>
                                {/* Panel Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1rem' }}>≡ƒöº</span>
                                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                                            Parameter Mapping
                                        </h3>
                                        {activeDim && (
                                            <span style={{
                                                fontSize: '0.62rem',
                                                backgroundColor: '#eff6ff',
                                                color: '#2563eb',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                fontWeight: 'bold'
                                            }}>
                                                Balloon #{selectedDwg?.dimensions?.findIndex(d => d.id === activeDim.id) + 1 || '?'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
                                        <button
                                            onClick={() => setShowQCInspector(false)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#64748b',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '4px',
                                                borderRadius: '50%'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(226, 232, 240, 0.5)'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>

                                {/* Panel Body */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {activeDim ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

                                            {/* Severity / Klasifikasi Keparahan */}
                                            <div>
                                                <label style={labelStyle}>Keparahan (Severity)</label>
                                                <select value={editSeverity} onChange={(e) => updateActiveDimProp('severity', e.target.value)} style={selectStyle}>
                                                    <option value="Minor">Minor (Aesthetic/Kecil)</option>
                                                    <option value="Major">Major (Fungsional Utama)</option>
                                                    <option value="Critical">Critical (Fit/Kritis/Keamanan)</option>
                                                </select>
                                            </div>

                                            {/* Metode Inspeksi */}
                                            <div>
                                                <label style={labelStyle}>Metode Inspeksi</label>
                                                <select value={editInspectionMethod} onChange={(e) => updateActiveDimProp('inspection_method', e.target.value)} style={selectStyle}>
                                                    <option value="Caliper">Caliper (Jangka Sorong)</option>
                                                    <option value="Micrometer">Micrometer</option>
                                                    <option value="Vision Camera">Vision Camera</option>
                                                    <option value="CMM">CMM (Coordinate Measuring Machine)</option>
                                                    <option value="SCADA / PLC">SCADA / PLC</option>
                                                    <option value="Custom">Custom Method</option>
                                                </select>
                                            </div>

                                            {/* Angle-specific fields */}
                                            {editCategory === 'angle' && (
                                                <div style={{ backgroundColor: '#fffbeb', padding: '10px', borderRadius: '8px', border: '1px solid #fde68a', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92400e', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        Γêá Parameter Sudut
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                        <div>
                                                            <label style={{ ...labelStyle, color: '#92400e' }}>Sudut Mulai (┬░)</label>
                                                            <input type="number" value={editAngleStart} onChange={(e) => updateActiveDimProp('angleStart', e.target.value)} style={inputStyle} />
                                                        </div>
                                                        <div>
                                                            <label style={{ ...labelStyle, color: '#92400e' }}>Sudut Akhir (┬░)</label>
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
                                            <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                                                <div style={{ marginTop: '4px' }}>
                                                    <label style={labelStyle}>Tebal Garis: {editLineWidth || 2}px</label>
                                                    <input
                                                        type="range"
                                                        min="1"
                                                        max="10"
                                                        value={editLineWidth || 2}
                                                        onChange={(e) => updateActiveDimProp('lineWidth', e.target.value)}
                                                        style={{ width: '100%', accentColor: getCategoryColor(editCategory), height: '4px' }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Feature Trigger — Out-of-Spec Actions */}
                                            <div style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '10px', border: '1px solid #1e3a8a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <Zap size={13} color="#f59e0b" /> Aksi Trigger Out-of-Spec
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
                                                                position: 'absolute', bottom: '100%', right: 0, marginBottom: '6px',
                                                                backgroundColor: '#1e293b', borderRadius: '10px', border: '1px solid #334155',
                                                                boxShadow: '0 -12px 40px rgba(0,0,0,0.4)', padding: '8px', zIndex: 100,
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
                                                        Belum ada trigger.
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
                                                                padding: '8px',
                                                                display: 'flex', flexDirection: 'column', gap: '6px',
                                                                transition: 'all 0.3s',
                                                            }}>
                                                                {/* Trigger Header */}
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                                        <span style={{ fontSize: '0.9rem' }}>{actionDef?.icon}</span>
                                                                        <div>
                                                                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: actionDef?.color }}>{actionDef?.labelShort || actionDef?.label}</div>
                                                                        </div>
                                                                    </div>
                                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                                        <button
                                                                            onClick={() => handleToggleTrigger(trigger.id)}
                                                                            title={trigger.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                                                                            style={{
                                                                                border: 'none', borderRadius: '4px', padding: '2px 4px', cursor: 'pointer',
                                                                                backgroundColor: trigger.enabled ? '#10b98120' : '#64748b20',
                                                                                color: trigger.enabled ? '#10b981' : '#64748b',
                                                                                fontSize: '0.55rem', fontWeight: 700,
                                                                            }}
                                                                        >
                                                                            {trigger.enabled ? 'ON' : 'OFF'}
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteTrigger(trigger.id)}
                                                                            style={{ border: 'none', borderRadius: '4px', padding: '2px', cursor: 'pointer', backgroundColor: '#ef444415', color: '#ef4444', display: 'flex', alignItems: 'center' }}
                                                                        >
                                                                            <Trash2 size={10} />
                                                                        </button>
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    <select
                                                                        value={trigger.condition}
                                                                        onChange={(e) => handleUpdateTrigger(trigger.id, 'condition', e.target.value)}
                                                                        style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.65rem' }}
                                                                    >
                                                                        {TRIGGER_CONDITIONS.map(c => (
                                                                            <option key={c.key} value={c.key}>{c.label}</option>
                                                                        ))}
                                                                    </select>
                                                                    <textarea
                                                                        value={trigger.message || ''}
                                                                        onChange={(e) => handleUpdateTrigger(trigger.id, 'message', e.target.value)}
                                                                        placeholder="Pesan..."
                                                                        rows={1}
                                                                        style={{ width: '100%', padding: '4px 6px', borderRadius: '4px', border: '1px solid #334155', backgroundColor: '#0f172a', color: '#e2e8f0', fontSize: '0.62rem', resize: 'vertical' }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>

                                            {/* Control Mode Toggle */}
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: 'rgba(241, 245, 249, 0.6)', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Mode Input:</span>
                                                <div style={{ display: 'flex', gap: '2px', backgroundColor: '#e2e8f0', padding: '2px', borderRadius: '6px' }}>
                                                    <button
                                                        onClick={() => setCoordControlMode('slider')}
                                                        style={{
                                                            padding: '3px 8px',
                                                            backgroundColor: coordControlMode === 'slider' ? 'white' : 'transparent',
                                                            color: coordControlMode === 'slider' ? '#2563eb' : '#64748b',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.62rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        Slider
                                                    </button>
                                                    <button
                                                        onClick={() => setCoordControlMode('joystick')}
                                                        style={{
                                                            padding: '3px 8px',
                                                            backgroundColor: coordControlMode === 'joystick' ? 'white' : 'transparent',
                                                            color: coordControlMode === 'joystick' ? '#2563eb' : '#64748b',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            fontSize: '0.62rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.2s',
                                                            outline: 'none'
                                                        }}
                                                    >
                                                        🎮 Joystick
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Coordinate groups */}
                                            {selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType) ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {/* Group for Balloon (Mark/Label) */}
                                                    <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Sliders size={12} color="#2563eb" /> Koordinat Balloon (X, Y, Z)
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>X</label>
                                                                <input type="number" step="0.01" value={editLx} onChange={(e) => updateActiveDimProp('lx', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Y</label>
                                                                <input type="number" step="0.01" value={editLy} onChange={(e) => updateActiveDimProp('ly', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Z</label>
                                                                <input type="number" step="0.01" value={editLz} onChange={(e) => updateActiveDimProp('lz', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Group for Contact Point P1 */}
                                                    <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <Ruler size={12} color="#3b82f6" /> Koordinat Kontak P1 (X, Y, Z)
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>X</label>
                                                                <input type="number" step="0.01" value={editX1} onChange={(e) => updateActiveDimProp('x1', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Y</label>
                                                                <input type="number" step="0.01" value={editY1} onChange={(e) => updateActiveDimProp('y1', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#64748b', fontWeight: 600 }}>Z</label>
                                                                <input type="number" step="0.01" value={editZ1} onChange={(e) => updateActiveDimProp('z1', e.target.value)} style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '0.65rem', backgroundColor: 'white', color: '#1e293b' }} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : coordControlMode === 'slider' ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {/* Group for Mark/Label */}
                                                    <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                                    <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
                                            ) : (
                                                <div style={{ backgroundColor: 'rgba(248, 250, 252, 0.8)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(226, 232, 240, 0.8)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {/* Target selector */}
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <label style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Target Koordinat:</label>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                                            {[
                                                                { key: 'label', label: 'Balloon' },
                                                                { key: 'x1y1', label: 'Awal (P1)' },
                                                                { key: 'x2y2', label: 'Akhir (P2)' }
                                                            ].map(item => (
                                                                <button
                                                                    key={item.key}
                                                                    onClick={() => setJoystickTarget(item.key)}
                                                                    style={{
                                                                        padding: '4px 2px',
                                                                        backgroundColor: joystickTarget === item.key ? '#2563eb' : '#e2e8f0',
                                                                        color: joystickTarget === item.key ? 'white' : '#475569',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        fontSize: '0.58rem',
                                                                        fontWeight: 'bold',
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.15s'
                                                                    }}
                                                                >
                                                                    {item.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Target Coordinate Values Display */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f1f5f9', padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                                                        <span style={{ fontSize: '0.62rem', fontWeight: 'bold', color: '#475569' }}>
                                                            {joystickTarget === 'label' ? 'Balloon (Mark)' : joystickTarget === 'x1y1' ? 'Titik Awal (P1)' : 'Titik Akhir (P2)'}
                                                        </span>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', fontWeight: 'bold', color: '#2563eb' }}>
                                                            {joystickTarget === 'label' && `X: ${editLx}, Y: ${editLy}`}
                                                            {joystickTarget === 'x1y1' && `X: ${editX1}, Y: ${editY1}`}
                                                            {joystickTarget === 'x2y2' && `X: ${editX2}, Y: ${editY2}`}
                                                        </span>
                                                    </div>

                                                    {/* Interactive Joystick & Fine-Tune layout */}
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: '10px', marginTop: '4px' }}>
                                                        
                                                        {/* Joystick Pad */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <div
                                                                ref={joystickRef}
                                                                onMouseDown={handleJoystickStart}
                                                                style={{
                                                                    width: '140px',
                                                                    height: '140px',
                                                                    borderRadius: '50%',
                                                                    background: 'linear-gradient(135deg, #f8fafc, #cbd5e1)',
                                                                    border: '2px solid #94a3b8',
                                                                    position: 'relative',
                                                                    cursor: isDraggingJoystick ? 'grabbing' : 'grab',
                                                                    boxShadow: 'inset 0 4px 8px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    userSelect: 'none',
                                                                    touchAction: 'none'
                                                                }}
                                                                title="Tahan dan geser untuk memindahkan koordinat (Gerakan Relatif)"
                                                            >
                                                                {/* Crosshairs inside joystick pad */}
                                                                <div style={{ position: 'absolute', width: '80%', height: '1px', backgroundColor: '#e2e8f0' }} />
                                                                <div style={{ position: 'absolute', height: '80%', width: '1px', backgroundColor: '#e2e8f0' }} />
                                                                
                                                                {/* Joystick Knob */}
                                                                <div
                                                                    style={{
                                                                        width: '46px',
                                                                        height: '46px',
                                                                        borderRadius: '50%',
                                                                        background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                                                                        border: '1px solid #1e40af',
                                                                        position: 'absolute',
                                                                        transform: `translate(${joystickPos.x}px, ${joystickPos.y}px)`,
                                                                        boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4), inset 0 2px 4px rgba(255,255,255,0.3)',
                                                                        transition: isDraggingJoystick ? 'none' : 'transform 0.15s ease-out'
                                                                    }}
                                                                />
                                                            </div>
                                                            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 'bold' }}>DRAG KNOB</span>
                                                        </div>

                                                        {/* Precision D-pad / Arrow Buttons */}
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                            <div style={{
                                                                position: 'relative',
                                                                width: '110px',
                                                                height: '110px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                backgroundColor: '#e2e8f0',
                                                                borderRadius: '50%',
                                                                border: '1px solid #cbd5e1'
                                                            }}>
                                                                {/* UP */}
                                                                <button
                                                                    onClick={() => handleMicroStep('y', -1)}
                                                                    style={{ position: 'absolute', top: '6px', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                                                                    title="Naik 1px"
                                                                >
                                                                    ▲
                                                                </button>
                                                                {/* LEFT */}
                                                                <button
                                                                    onClick={() => handleMicroStep('x', -1)}
                                                                    style={{ position: 'absolute', left: '6px', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                                                                    title="Kiri 1px"
                                                                >
                                                                    ◀
                                                                </button>
                                                                {/* CENTER Indicator */}
                                                                <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#94a3b8' }} />
                                                                {/* RIGHT */}
                                                                <button
                                                                    onClick={() => handleMicroStep('x', 1)}
                                                                    style={{ position: 'absolute', right: '6px', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                                                                    title="Kanan 1px"
                                                                >
                                                                    ▶
                                                                </button>
                                                                {/* DOWN */}
                                                                <button
                                                                    onClick={() => handleMicroStep('y', 1)}
                                                                    style={{ position: 'absolute', bottom: '6px', width: '30px', height: '30px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: 'white', color: '#475569', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', outline: 'none' }}
                                                                    title="Turun 1px"
                                                                >
                                                                    ▼
                                                                </button>
                                                            </div>
                                                            <span style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 'bold' }}>FINE TUNE (1px)</span>
                                                        </div>

                                                    </div>
                                                </div>
                                            )}

                                            {/* Save / Delete */}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
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
                                        </div>
                                    ) : (
                                        <div style={{ padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                                            Pilih dimensi pada gambar atau gunakan "+ Tambah" untuk memulai konfigurasi.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* QC Simulator Panel */}
                            <div style={{
                                flex: 0.8,
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                minHeight: 0,
                                fontFamily: "'Inter', sans-serif",
                                color: '#1e293b'
                            }}>
                                {/* Panel Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(226, 232, 240, 0.8)',
                                    backgroundColor: 'rgba(248, 250, 252, 0.8)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '1rem' }}>ΓÜí</span>
                                        <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>
                                            QC Simulator
                                        </h3>
                                    </div>
                                    
                                    {/* Overall Judgment Status Badge */}
                                    {selectedDwg?.dimensions?.length > 0 && (
                                        <span style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 900,
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: overallJudgment === 'PASS' ? '#ecfdf5' : overallJudgment === 'FAIL' ? '#fee2e2' : '#f1f5f9',
                                            color: overallJudgment === 'PASS' ? '#059669' : overallJudgment === 'FAIL' ? '#dc2626' : '#64748b',
                                            border: `1px solid ${overallJudgment === 'PASS' ? '#a7f3d0' : overallJudgment === 'FAIL' ? '#fecaca' : '#cbd5e1'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '3px'
                                        }}>
                                            {overallJudgment === 'PASS' ? <CheckCircle size={10} color="#059669" /> : overallJudgment === 'FAIL' ? <XCircle size={10} color="#dc2626" /> : <Info size={10} color="#64748b" />}
                                            {overallJudgment}
                                        </span>
                                    )}
                                </div>

                                {/* Panel Body */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {(selectedDwg?.dimensions || []).map((dim, idx) => {
                                            const catDef = getCategoryDef(dim.category || 'dimension');
                                            const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
                                            const status = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
                                            const triggerCount = (dim.triggers || []).filter(t => t.enabled).length;
                                            const isTriggeredNow = triggeredActions[dim.id] !== undefined;

                                            return (
                                                <div key={dim.id} style={{
                                                    backgroundColor: isTriggeredNow ? 'rgba(254, 242, 242, 0.4)' : (activeDimId === dim.id ? 'rgba(239, 246, 255, 0.6)' : 'rgba(248, 250, 252, 0.4)'),
                                                    padding: '8px', borderRadius: '8px',
                                                    border: `1px solid ${isTriggeredNow ? '#ef4444' : (activeDimId === dim.id ? '#bfdbfe' : 'rgba(226, 232, 240, 0.8)')}`,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                }} onClick={() => setActiveDimId(dim.id)}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontWeight: 800, marginBottom: '4px' }}>
                                                        <span style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontSize: '0.58rem', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>#{idx+1}</span>
                                                            <span style={{ color: catDef.color, fontSize: '0.75rem' }}>{catDef.icon}</span>
                                                            {dim.label}
                                                            <span style={{ color: '#64748b', fontWeight: 600 }}>[{dim.tolMin}ΓÇô{dim.tolMax} {dim.unit}]</span>
                                                            {triggerCount > 0 && (
                                                                <span style={{ color: '#f59e0b', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${triggerCount} trigger aktif`}>
                                                                    ΓÜí{triggerCount}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {isTriggeredNow && (
                                                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444', padding: '1px 5px', backgroundColor: '#ef444418', borderRadius: '4px' }}>TRIGGERED</span>
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
                                                            executeTriggers(dim, newVal, oldStatus, newStatus);
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        style={{ ...inputStyle, fontSize: '0.75rem', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.7)' }}
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

                                    {/* Simulation Control Buttons */}
                                    {selectedDwg && selectedDwg.dimensions?.length > 0 && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px', borderTop: '1px solid rgba(226, 232, 240, 0.8)', paddingTop: '10px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={handleSubmitSimResults}
                                                    disabled={isSubmittingSim}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        padding: '8px 12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: isSubmittingSim ? 'not-allowed' : 'pointer',
                                                        opacity: isSubmittingSim ? 0.7 : 1,
                                                        transition: 'opacity 0.2s',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    <Database size={13} /> {isSubmittingSim ? 'Mengirim...' : 'Kirim Log'}
                                                </button>
                                                
                                                <button
                                                    onClick={handleResetSimValues}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '4px',
                                                        backgroundColor: 'white',
                                                        border: '1px solid #cbd5e1',
                                                        color: '#475569',
                                                        borderRadius: '6px',
                                                        padding: '8px 12px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        outline: 'none'
                                                    }}
                                                    title="Atur ulang nilai simulasi ke spesifikasi nominal"
                                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#94a3b8'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                                >
                                                    <RefreshCw size={13} /> Reset
                                                </button>
                                            </div>
                                            
                                            <a
                                                href="#/terminal"
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '6px',
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    color: '#2563eb',
                                                    borderRadius: '6px',
                                                    padding: '8px 12px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 700,
                                                    textDecoration: 'none',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    textAlign: 'center'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                            >
                                                <Zap size={13} /> Buka Stasiun Operator
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>



            </div>

            {/* Scale Calibration Overlay Modal */}
            {isScaleModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                        width: '380px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif"
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.4rem' }}>📏</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Kalibrasi Skala Fisik</h3>
                            </div>
                            <button
                                onClick={() => setIsScaleModalOpen(false)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: '1.5' }}>
                            Garis referensi sepanjang <b>{scaleModalPx.toFixed(1)} piksel</b> telah ditarik. Masukkan jarak nyata dalam satuan milimeter (mm) untuk mengkalibrasi kanvas.
                        </p>

                        <div>
                            <label style={labelStyle}>Jarak Nyata (mm)</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="Contoh: 15.0"
                                value={scaleModalValue}
                                onChange={(e) => setScaleModalValue(e.target.value)}
                                style={{ ...inputStyle, fontSize: '0.9rem', padding: '10px 12px' }}
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveScaleFactor(scaleModalValue);
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
                            <button
                                onClick={() => setIsScaleModalOpen(false)}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleSaveScaleFactor(scaleModalValue)}
                                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                Simpan Kalibrasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dimension Creation Overlay Modal */}
            {isDimModalOpen && dimModalData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                        width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '90vh', overflowY: 'auto', fontFamily: "'Inter', sans-serif"
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.3rem' }}>📏</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Tambah Dimensi QC Baru</h3>
                            </div>
                            <button
                                onClick={() => { setIsDimModalOpen(false); setDimModalData(null); }}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Form Fields inside Dimension Modal */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Kategori</label>
                                <select
                                    value={dimModalData.category}
                                    onChange={(e) => {
                                        const cat = e.target.value;
                                        const catDef = getCategoryDef(cat);
                                        setDimModalData(prev => ({
                                            ...prev,
                                            category: cat,
                                            measureType: catDef.defaultMeasure,
                                            indicatorType: catDef.defaultIndicator,
                                            unit: catDef.defaultUnit,
                                            gdt_symbol: catDef.symbol
                                        }));
                                    }}
                                    style={selectStyle}
                                >
                                    {PARAM_CATEGORIES.map(cat => (
                                        <option key={cat.key} value={cat.key}>{cat.icon} {cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Tipe Pengukuran</label>
                                <select
                                    value={dimModalData.measureType}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, measureType: e.target.value }))}
                                    style={selectStyle}
                                >
                                    {(MEASURE_TYPE_OPTIONS[dimModalData.category] || []).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Nama / Label Parameter</label>
                            <input
                                type="text"
                                value={dimModalData.label}
                                onChange={(e) => setDimModalData(prev => ({ ...prev, label: e.target.value }))}
                                style={inputStyle}
                                autoFocus
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Spec Target Nominal</label>
                                <input
                                    type="text"
                                    value={dimModalData.spec}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, spec: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Satuan</label>
                                <input
                                    type="text"
                                    value={dimModalData.unit}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, unit: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Toleransi Min</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={dimModalData.tolMin}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, tolMin: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Toleransi Max</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={dimModalData.tolMax}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, tolMax: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Simbol GD&T</label>
                                <input
                                    type="text"
                                    value={dimModalData.gdt_symbol}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, gdt_symbol: e.target.value }))}
                                    placeholder="Misal: ⌀, R, ∠"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Variabel QMS</label>
                                <select
                                    value={dimModalData.variable}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, variable: e.target.value }))}
                                    style={selectStyle}
                                >
                                    <option value="">-- Pilih Variabel --</option>
                                    {(QMS_VARIABLES_BY_CATEGORY[dimModalData.category] || []).map(v => (
                                        <option key={v} value={v}>{v}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={labelStyle}>Tipe Indikator Canvas</label>
                                <select
                                    value={dimModalData.indicatorType}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, indicatorType: e.target.value }))}
                                    style={selectStyle}
                                >
                                    {(INDICATOR_TYPE_OPTIONS[dimModalData.category] || INDICATOR_TYPE_OPTIONS.custom).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Bentuk Marker</label>
                                <select
                                    value={dimModalData.markerShape || 'default'}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, markerShape: e.target.value }))}
                                    style={selectStyle}
                                >
                                    <option value="default">Bawaan Indikator</option>
                                    <option value="circle">● Bulat (Circle)</option>
                                    <option value="square">■ Kotak (Square)</option>
                                    <option value="triangle">▲ Segitiga (Triangle)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                            <button
                                onClick={() => { setIsDimModalOpen(false); setDimModalData(null); }}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleSaveNewDimension(dimModalData)}
                                style={{ flex: 1, padding: '10px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                Simpan Dimensi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
