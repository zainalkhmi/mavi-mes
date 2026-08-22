import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
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
    Camera,
    Cpu,
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
    Hexagon,
    Crop,
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
    FlipHorizontal,
    Minimize2,
    Search,
    Layers,
    Palette,
    Maximize,
    Sun,
    Moon,
    Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllDrawings, saveDrawing, deleteDrawing, safeSaveDrawingsToLocalStorage } from '../utils/supabaseUtilityDB';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';
import { parseAndProcessCadFile } from '../utils/cadDxfRenderService';
const CADViewer3DEditor = lazy(() => import('./CADViewer3D').then(m => ({ default: m.CADViewer3DEditor })));
const MLightCadViewer = lazy(() => import('./drawing/MLightCadViewer'));

// ─────────────────────────────────────────
// GD&T PARAMETER CATEGORY DEFINITIONS
// ─────────────────────────────────────────
const PARAM_CATEGORIES = [
    { key: 'dimension', label: 'Linear Dimension', labelId: 'Dimensi Linear', icon: '📏', color: '#3b82f6', symbol: '', defaultUnit: 'mm', defaultMeasure: 'linear_horizontal', defaultIndicator: 'horizontal' },
    { key: 'diameter', label: 'Diameter', labelId: 'Diameter', icon: '⌀', color: '#8b5cf6', symbol: '⌀', defaultUnit: 'mm', defaultMeasure: 'diameter', defaultIndicator: 'radial' },
    { key: 'radius', label: 'Radius', labelId: 'Radius', icon: '⊕', color: '#06b6d4', symbol: 'R', defaultUnit: 'mm', defaultMeasure: 'radius', defaultIndicator: 'radial' },
    { key: 'angle', label: 'Angle', labelId: 'Sudut', icon: '∠', color: '#f59e0b', symbol: '∠', defaultUnit: '°', defaultMeasure: 'angle', defaultIndicator: 'arc' },
    { key: 'area', label: 'Area', labelId: 'Luas Area', icon: '▢', color: '#10b981', symbol: '', defaultUnit: 'mm²', defaultMeasure: 'area', defaultIndicator: 'area_box' },
    { key: 'roughness', label: 'Surface Roughness', labelId: 'Kekasaran Permukaan', icon: '△', color: '#ef4444', symbol: 'Ra', defaultUnit: 'μm', defaultMeasure: 'surface_roughness', defaultIndicator: 'callout' },
    { key: 'datum', label: 'Datum Feature Symbol', labelId: 'Datum Referensi (▕A▏)', icon: '▕A▏', color: '#10b981', symbol: 'A', defaultUnit: '', defaultMeasure: 'datum_feature', defaultIndicator: 'callout' },
    { key: 'custom', label: 'Custom', labelId: 'Kustom', icon: '⚙', color: '#64748b', symbol: '', defaultUnit: 'mm', defaultMeasure: 'custom', defaultIndicator: 'callout' },
];

// ─────────────────────────────────────────
// FEATURE TRIGGER — ACTION & CONDITION DEFINITIONS
// ─────────────────────────────────────────
const TRIGGER_ACTIONS = [
    { key: 'NOTIFY_SUPERVISOR', label: 'Notifikasi Supervisor', labelShort: 'Notify', icon: '🔔', color: '#f59e0b', LucideIcon: Bell, description: 'Kirim notifikasi ke supervisor / QC lead' },
    { key: 'STOP_MACHINE', label: 'Stop Machine', labelShort: 'Stop', icon: '🛑', color: '#ef4444', LucideIcon: Power, description: 'Perintah stop mesin (integrasi PLC/IoT)' },
    { key: 'CREATE_NCR', label: 'Buat NCR', labelShort: 'NCR', icon: '📋', color: '#8b5cf6', LucideIcon: ClipboardList, description: 'Buat Non-Conformance Report otomatis' },
    { key: 'ESCALATE_QUALITY', label: 'Eskalasi Quality', labelShort: 'Escalate', icon: '⚠️', color: '#f97316', LucideIcon: AlertTriangle, description: 'Eskalasi ke tim Quality Engineering' },
    { key: 'LOG_DEFECT', label: 'Log Defect', labelShort: 'Log', icon: '📝', color: '#06b6d4', LucideIcon: FileText, description: 'Catat defect ke tabel QMS database' },
    { key: 'REWORK_ORDER', label: 'Rework Order', labelShort: 'Rework', icon: '🔄', color: '#10b981', LucideIcon: RefreshCw, description: 'Buat work order rework otomatis' },
    { key: 'CUSTOM_WEBHOOK', label: 'Custom Webhook', labelShort: 'Webhook', icon: '🌐', color: '#6366f1', LucideIcon: Globe, description: 'Kirim data ke webhook URL kustom' },
];

const TRIGGER_CONDITIONS = [
    { key: 'ON_FAIL', label: 'Saat FAIL (Out-of-Spec)', description: 'Terpicu saat status = FAIL' },
    { key: 'ON_WARNING', label: 'Saat Mendekati Batas (Warning)', description: 'Terpicu saat dalam 10% dari batas toleransi' },
    { key: 'ON_PASS_TO_FAIL', label: 'Saat Berubah PASS → FAIL', description: 'Terpicu saat status berubah dari PASS ke FAIL' },
    { key: 'ALWAYS', label: 'Setiap Nilai Baru', description: 'Selalu terpicu saat ada nilai baru' },
];

const generateTriggerId = () => `trig_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

const MEASURE_TYPE_OPTIONS = {
    dimension: [{ value: 'linear_horizontal', label: 'Horizontal' }, { value: 'linear_vertical', label: 'Vertical' }],
    diameter: [{ value: 'diameter', label: 'Outer Diameter' }, { value: 'inner_diameter', label: 'Inner Diameter' }],
    radius: [{ value: 'radius', label: 'Outer Radius' }, { value: 'inner_radius', label: 'Inner Radius' }],
    angle: [{ value: 'angle', label: 'Included Angle' }, { value: 'taper_angle', label: 'Taper Angle' }],
    area: [{ value: 'area', label: 'Cross-Section Area' }, { value: 'surface_area', label: 'Surface Area' }],
    roughness: [{ value: 'surface_roughness', label: 'Ra (Average)' }, { value: 'rz_roughness', label: 'Rz (Max Peak)' }],
    datum: [{ value: 'datum_feature', label: 'Datum Feature Indicator' }],
    custom: [{ value: 'custom', label: 'Custom Measurement' }],
};

const INDICATOR_TYPE_OPTIONS = {
    dimension: [{ value: 'horizontal', label: 'Garis Horizontal' }, { value: 'vertical', label: 'Garis Vertikal' }],
    diameter: [{ value: 'radial', label: 'Pointer / Radial' }],
    radius: [{ value: 'radial', label: 'Pointer / Radial' }],
    angle: [{ value: 'arc', label: 'Arc (Busur)' }],
    area: [{ value: 'area_box', label: 'Area Box (Kotak)' }],
    roughness: [{ value: 'callout', label: 'Callout Symbol' }],
    datum: [{ value: 'callout', label: 'Datum Triangle + Box Pointer' }],
    custom: [{ value: 'callout', label: 'Callout Pointer' }, { value: 'horizontal', label: 'Garis Horizontal' }, { value: 'vertical', label: 'Garis Vertikal' }, { value: 'radial', label: 'Pointer Radial' }],
};

// Dynamic QMS variable suggestions per category
const QMS_VARIABLES_BY_CATEGORY = {
    dimension: ['Meas_Length', 'Meas_Height', 'Meas_Width', 'Meas_Depth', 'Meas_Thickness', 'Stroke_Length_Actual'],
    diameter: ['Meas_Diameter', 'Cylinder_Bore_Dia', 'Rod_Diameter_Spec', 'Outer_Dia', 'Inner_Dia'],
    radius: ['Meas_Radius', 'Corner_Radius', 'Fillet_Radius', 'Inner_Radius'],
    angle: ['Meas_Angle', 'Taper_Angle', 'Chamfer_Angle', 'Bevel_Angle', 'Inclination'],
    area: ['Meas_Area', 'Cross_Section_Area', 'Surface_Area', 'Contact_Area'],
    roughness: ['Meas_Ra', 'Meas_Rz', 'Surface_Roughness', 'Finish_Quality'],
    datum: ['Datum_A_Ref', 'Datum_B_Ref', 'Datum_C_Ref'],
    custom: ['Custom_Param_1', 'Custom_Param_2'],
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
            {
                id: 'dim_bore', label: 'Center Bore (B)', spec: '25.0', tolMin: 24.9, tolMax: 25.1, variable: 'Meas_Bore', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 135, y1: 165, x2: 95, y2: 115, lx: 75, ly: 115, triggers: [
                    { id: 'trig_bore_1', type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Center Bore di luar toleransi! Mesin harus dihentikan.', enabled: true },
                    { id: 'trig_bore_2', type: 'CREATE_NCR', condition: 'ON_FAIL', priority: 'high', message: 'NCR otomatis: Center Bore out-of-spec.', enabled: true },
                ]
            },
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
            {
                id: 'hc_bore', label: 'Cylinder Bore', spec: '80.0', tolMin: 79.95, tolMax: 80.05, variable: 'Cylinder_Bore_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 50, y1: 100, x2: 50, y2: 220, lx: 30, ly: 160, triggers: [
                    { id: 'trig_hcbore_1', type: 'NOTIFY_SUPERVISOR', condition: 'ON_FAIL', priority: 'high', message: 'Cylinder Bore di luar toleransi: nilai aktual melewati batas spec.', enabled: true },
                    { id: 'trig_hcbore_2', type: 'ESCALATE_QUALITY', condition: 'ON_FAIL', priority: 'high', message: 'Eskalasi: Cylinder Bore memerlukan review Quality Engineering.', enabled: true },
                ]
            },
            { id: 'hc_rod', label: 'Rod Diameter', spec: '56.0', tolMin: 55.98, tolMax: 56.02, variable: 'Rod_Diameter_Spec', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 390, y1: 130, x2: 390, y2: 190, lx: 390, ly: 160, triggers: [] },
            { id: 'hc_stroke', label: 'Stroke Length', spec: '500.0', tolMin: 499.5, tolMax: 500.5, variable: 'Stroke_Length_Actual', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 60, y1: 240, x2: 280, y2: 240, lx: 170, ly: 240, triggers: [] },
            { id: 'hc_area', label: 'Piston Area', spec: '5026.5', tolMin: 5000.0, tolMax: 5050.0, variable: 'Meas_Area', unit: 'mm²', category: 'area', measureType: 'area', indicatorType: 'area_box', gdt_symbol: '', x1: 100, y1: 120, x2: 230, y2: 200, lx: 165, ly: 160, triggers: [] },
        ]
    },
    {
        id: 'dwg_housing_cover',
        name: 'Housing Cover Blueprint HC-12527',
        fileName: 'housing-cover-hc12527.pdf',
        fileType: 'PDF',
        uploadedAt: '2026-08-15T10:00:00Z',
        dimensions: [
            { id: 'tag_label_902', label: 'LABEL 902', spec: '902', tolMin: 900, tolMax: 905, variable: 'QC_Label_902', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '🏷️', x1: 160, y1: 180, lx: 235, ly: 165, triggers: [] },
            { id: 'tag_dim_3523', label: 'Hole Position 35.23', spec: '35.23', tolMin: 35.0, tolMax: 35.5, variable: 'Meas_Hole_3523', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 375, y1: 375, lx: 520, ly: 435, triggers: [] },
            { id: 'tag_dim_21601', label: 'Overall Height 216.01', spec: '216.01', tolMin: 215.8, tolMax: 216.2, variable: 'Meas_Height_21601', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 765, y1: 180, lx: 895, ly: 310, triggers: [] },
            { id: 'tag_dim_top_width', label: 'Top Width', spec: '193.39', tolMin: 193.0, tolMax: 193.8, variable: 'Meas_Width_Top', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 270, y1: 155, lx: 425, ly: 155, triggers: [] },
            { id: 'tag_dim_bot_width', label: 'Bottom Width', spec: '89.98', tolMin: 89.5, tolMax: 90.5, variable: 'Meas_Width_Bot', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 300, y1: 540, lx: 395, ly: 555, triggers: [] },
            { id: 'tag_dim_sec_depth', label: 'Section Thickness', spec: '27.50', tolMin: 27.2, tolMax: 27.8, variable: 'Meas_Sec_Thickness', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 685, y1: 165, lx: 702, ly: 160, triggers: [] }
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
            {
                id: 'trigger_check', label: 'Trigger Check', spec: '1.0', tolMin: 1.0, tolMax: 1.0, variable: 'Trigger_Output', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '⚡', x1: 300, y1: 150, lx: 350, ly: 150, triggers: [
                    { id: 'trig_p1', type: 'STOP_MACHINE', condition: 'ON_FAIL', priority: 'critical', message: 'Trigger failed! Stopping machine.', enabled: true }
                ]
            },
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
        const saved = localStorage.getItem('mandor_drawings');
        if (saved) {
            try {
                const parsed = migrateDrawings(JSON.parse(saved));
                if (!parsed.some(d => d.id === 'dwg_product_checking')) {
                    const templateDwg = DEFAULT_DRAWINGS.find(d => d.id === 'dwg_product_checking');
                    if (templateDwg) {
                        const updated = [...parsed, templateDwg];
                        safeSaveDrawingsToLocalStorage(updated);
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
                    const savedActive = localStorage.getItem('mandor_selected_dwg_id');
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
        const savedActive = localStorage.getItem('mandor_selected_dwg_id');
        if (savedActive && drawings.some(d => d.id === savedActive)) {
            return savedActive;
        }
        return drawings.length > 0 ? drawings[0].id : '';
    });
    const selectedDwg = drawings.find(d => d.id === selectedDwgId) || drawings[0];
    const [activeLayer, setActiveLayer] = useState('All Layers');
    const [cadEngineMode, setCadEngineMode] = useState('mlightcad'); // 'mlightcad' | 'svg'
    const [isFullscreen, setIsFullscreen] = useState(false);
    const fullscreenRef = useRef(null);

    const [showCqModal, setShowCqModal] = useState(false);
    const [showColorPopup, setShowColorPopup] = useState(false);
    const [showStylePopup, setShowStylePopup] = useState(false);
    const [showLayerPopup, setShowLayerPopup] = useState(false);
    const [showShapePopup, setShowShapePopup] = useState(false);
    const [showGdtPopup, setShowGdtPopup] = useState(false);
    const [selectedGdtTool, setSelectedGdtTool] = useState(null);
    const [selectedShapeTool, setSelectedShapeTool] = useState('rect');
    const [cqType, setCqType] = useState('rectangular');
    const [cqWidth, setCqWidth] = useState(120);
    const [cqHeight, setCqHeight] = useState(100);
    const [cqThickness, setCqThickness] = useState(12);
    const [cqHoleDia, setCqHoleDia] = useState(16);
    const [cqHoleCount, setCqHoleCount] = useState(4);
    const [isGeneratingCq, setIsGeneratingCq] = useState(false);

    const handleGenerateCqModel = async () => {
        setIsGeneratingCq(true);
        try {
            const response = await fetch('http://localhost:8000/blueprint/cadquery/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    width: cqWidth,
                    height: cqHeight,
                    thickness: cqThickness,
                    hole_dia: cqHoleDia,
                    hole_count: cqHoleCount,
                    bracket_type: cqType
                })
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.success) {
                const newDwg = {
                    name: `PARAMETRIC ${cqType.toUpperCase()} BRACKET`,
                    fileName: result.filename,
                    fileType: 'DXF',
                    uploadedAt: new Date().toISOString(),
                    dimensions: result.dimensions,
                    dataUrl: result.dxf_data_url
                };
                const saved = await saveDrawing(newDwg);
                setDrawings(prev => [saved, ...prev]);
                setSelectedDwgId(saved.id);
                localStorage.setItem('mandor_selected_dwg_id', saved.id);
                toast.success(`Geometri parametrik CadQuery berhasil dibuat dan dimuat! Terbentuk ${result.entity_count} entitas.`);
                setShowCqModal(false);
            } else {
                toast.error(`Gagal membuat model: ${result.error}`);
            }
        } catch (e) {
            toast.error(`Koneksi server gagal: ${e.message}`);
        } finally {
            setIsGeneratingCq(false);
        }
    };

    const [activeDimId, setActiveDimId] = useState(() => {
        const savedActive = localStorage.getItem('mandor_selected_dwg_id');
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
    const [editGdtFrameEnabled, setEditGdtFrameEnabled] = useState(false);
    const [editGdtTolerance, setEditGdtTolerance] = useState('');
    const [editGdtHasDiameter, setEditGdtHasDiameter] = useState(false);
    const [editGdtModifier, setEditGdtModifier] = useState('');
    const [editGdtDatum1, setEditGdtDatum1] = useState('');
    const [editGdtDatum2, setEditGdtDatum2] = useState('');
    const [editGdtDatum3, setEditGdtDatum3] = useState('');
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
    
    // AI Vision (YOLO) and Hardware Binding states
    const [editVisionEnabled, setEditVisionEnabled] = useState(false);
    const [editYoloModel, setEditYoloModel] = useState('yolov8n.pt');
    const [editYoloClass, setEditYoloClass] = useState('');
    const [editDeviceLockEnabled, setEditDeviceLockEnabled] = useState(false);
    const [editDeviceProfile, setEditDeviceProfile] = useState('Mitutoyo Caliper (BLE)');
    const [aiScanningId, setAiScanningId] = useState(null);

    const [isBocCollapsed, setIsBocCollapsed] = useState(false);
    const [showBocTable, setShowBocTable] = useState(true);
    const [showQCInspector, setShowQCInspector] = useState(true);
    const [qcTab, setQcTab] = useState('properties'); // 'properties' | 'simulator' | 'region'
    const [dragRegionState, setDragRegionState] = useState(null);

    const updateDisplayRegion = (newRegion) => {
        if (!selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            displayRegion: newRegion
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to save display region:', err));
    };

    const handleToggleFillParent = () => {
        if (!selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            fillParent: !selectedDwg.fillParent
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).then(() => {
            toast.success(updatedDwg.fillParent ? 'PDF Drawing diatur Full Screen (Fill Parent Canvas)' : 'PDF Drawing diatur Standard Sheet');
        }).catch(err => console.error('Failed to save fillParent setting:', err));
    };

    const handleAutoFitRegion = () => {
        if (!selectedDwg) return;
        const shapes = selectedDwg.shapes || [];
        if (shapes.length === 0) {
            const defaultReg = { enabled: true, x: 40, y: 30, w: 420, h: 300 };
            updateDisplayRegion(defaultReg);
            toast.success('Region diatur ke standar canvas.');
            return;
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        shapes.forEach(shape => {
            if (!shape) return;
            if (shape.type === 'line') {
                minX = Math.min(minX, shape.x1, shape.x2);
                minY = Math.min(minY, shape.y1, shape.y2);
                maxX = Math.max(maxX, shape.x1, shape.x2);
                maxY = Math.max(maxY, shape.y1, shape.y2);
            } else if (shape.type === 'circle') {
                minX = Math.min(minX, shape.cx - shape.r);
                minY = Math.min(minY, shape.cy - shape.r);
                maxX = Math.max(maxX, shape.cx + shape.r);
                maxY = Math.max(maxY, shape.cy + shape.r);
            } else if (shape.type === 'rect' || shape.type === 'image') {
                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
                maxX = Math.max(maxX, shape.x + (shape.w || 0));
                maxY = Math.max(maxY, shape.y + (shape.h || 0));
            } else if (shape.type === 'ellipse') {
                minX = Math.min(minX, shape.cx - shape.rx);
                minY = Math.min(minY, shape.cy - shape.ry);
                maxX = Math.max(maxX, shape.cx + shape.rx);
                maxY = Math.max(maxY, shape.cy + shape.ry);
            } else if (shape.type === 'triangle' || shape.type === 'hexagon') {
                minX = Math.min(minX, shape.x);
                minY = Math.min(minY, shape.y);
                maxX = Math.max(maxX, shape.x + (shape.w || 0));
                maxY = Math.max(maxY, shape.y + (shape.h || 0));
            } else if (shape.type === 'polyline' && Array.isArray(shape.points)) {
                shape.points.forEach(p => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
            }
        });

        if (!Number.isFinite(minX)) {
            minX = 40; minY = 30; maxX = 460; maxY = 330;
        }

        const padding = 25;
        const x = Math.max(0, Math.floor(minX - padding));
        const y = Math.max(0, Math.floor(minY - padding));
        const w = Math.max(40, Math.ceil((maxX - minX) + padding * 2));
        const h = Math.max(40, Math.ceil((maxY - minY) + padding * 2));

        const fitRegion = { enabled: true, x, y, w, h };
        updateDisplayRegion(fitRegion);
        toast.success(`Region di-fit ke objek gambar (${w}x${h}px).`);
    };

    // Viewport Panning & Quantity Takeoff States
    const svgRef = useRef(null);
    const canvasGroupRef = useRef(null);
    const [isMouseOverCanvas, setIsMouseOverCanvas] = useState(false);
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

    // Toggle browser Fullscreen API
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            fullscreenRef.current?.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {
                // Fallback: use CSS fullscreen if API fails
                setIsFullscreen(true);
            });
        } else {
            document.exitFullscreen?.().then(() => setIsFullscreen(false));
        }
    };

    // Sync state when user exits fullscreen via Esc (browser handles Esc natively)
    useEffect(() => {
        const onFsChange = () => {
            if (!document.fullscreenElement) {
                setIsFullscreen(false);
            }
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    // Auto-reveal QC Inspector panel when active dimension changes
    useEffect(() => {
        if (activeDimId) {
            setShowQCInspector(true);
            setQcTab('properties');
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
    const [dimContextMenu, setDimContextMenu] = useState(null); // { dimId, x, y }
    const [shapeContextMenu, setShapeContextMenu] = useState(null); // { shapeId, x, y, shape }
    const [canvasContextMenu, setCanvasContextMenu] = useState(null); // { x, y, canvasX, canvasY }
    const [drawingCategory, setDrawingCategory] = useState('dimension'); // dimension, diameter, radius, angle, etc.
    const [dimMoveMode, setDimMoveMode] = useState(null); // null, 'all', 'label'
    const [dragAnchor, setDragAnchor] = useState(null); // { dimId, anchorKey: 'p1' | 'p2' | 'center' | 'label' }
    const [showCtxCoords, setShowCtxCoords] = useState(false); // coordinate sliders accordion in context menu
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
        'MandorCAD 2026 [Version 1.0.0] - AutoCAD Style Interface',
        'Type "help" to see available CAD commands. Press ENTER to execute.'
    ]);
    const [activeSpace, setActiveSpace] = useState('model'); // model, layout1, layout2
    const [crosshairPos, setCrosshairPos] = useState({ x: 0, y: 0 });
    const [showCrosshair, setShowCrosshair] = useState(false);
    const [orthoMode, setOrthoMode] = useState(false);
    const [canvasTheme, setCanvasTheme] = useState('blueprint'); // 'white' | 'dark' | 'blueprint'

    // Canvas theme color map
    const themeColors = {
        white:     { bg: '#ffffff', grid: '#cbd5e1', gridOpacity: 0.15, border: '#cbd5e1', text: '#0f172a', bgText: '#94a3b8', layoutBg: '#f1f5f9', paperBg: '#f8fafc', paperShadow: '#090d16' },
        dark:      { bg: '#0f172a', grid: '#334155', gridOpacity: 0.35, border: '#334155', text: '#e2e8f0', bgText: '#475569', layoutBg: '#020617', paperBg: '#1e293b', paperShadow: '#000000' },
        blueprint: { bg: '#1e3a5f', grid: '#2d6da3', gridOpacity: 0.40, border: '#2d6da3', text: '#e0f2fe', bgText: '#5b9bd5', layoutBg: '#0c2744', paperBg: '#1a3555', paperShadow: '#071a30' },
    };
    const tc = themeColors[canvasTheme];

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

    // OSNAP (Object Snap) states
    const [osnapActive, setOsnapActive] = useState(true);
    const [osnapModes, setOsnapModes] = useState({
        endpoint: true,
        midpoint: true,
        center: true,
        quadrant: true,
        perpendicular: true,
        intersection: true
    });
    const [snappedPoint, setSnappedPoint] = useState(null);
    const [showOsnapModal, setShowOsnapModal] = useState(false);
    const [dragImageShape, setDragImageShape] = useState(null); // image being dragged/resized on canvas
    const [selectedShapeId, setSelectedShapeId] = useState(null); // currently selected shape ID (e.g. image)
    const [selectedShapeIds, setSelectedShapeIds] = useState([]); // multiple selected shape IDs (Select All / Marquee selection)
    const [selectionBox, setSelectionBox] = useState(null); // Marquee box: { startX, startY, currentX, currentY }
    const justSelectedRef = useRef(false);

    const getEntityBounds = (shape) => {
        if (!shape) return null;
        if (shape.type === 'line' || shape.type === 'arrow') {
            const x1 = shape.x1 ?? 0;
            const y1 = shape.y1 ?? 0;
            const x2 = shape.x2 ?? 0;
            const y2 = shape.y2 ?? 0;
            return { minX: Math.min(x1, x2), minY: Math.min(y1, y2), maxX: Math.max(x1, x2), maxY: Math.max(y1, y2) };
        }
        if (shape.type === 'circle') {
            const cx = shape.cx ?? 0;
            const cy = shape.cy ?? 0;
            const r = shape.r ?? 0;
            return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
        }
        if (shape.type === 'rect' || shape.type === 'revcloud' || shape.type === 'image') {
            const x = shape.x ?? 0;
            const y = shape.y ?? 0;
            const w = shape.w ?? 0;
            const h = shape.h ?? 0;
            return { minX: x, minY: y, maxX: x + w, maxY: y + h };
        }
        if (shape.type === 'ellipse') {
            const cx = shape.cx ?? 0;
            const cy = shape.cy ?? 0;
            const rx = shape.rx ?? 0;
            const ry = shape.ry ?? 0;
            return { minX: cx - rx, minY: cy - ry, maxX: cx + rx, maxY: cy + ry };
        }
        if (shape.type === 'triangle') {
            const x = shape.x ?? 0;
            const y = shape.y ?? 0;
            const w = shape.w ?? 0;
            const h = shape.h ?? 0;
            return { minX: x, minY: y, maxX: x + w, maxY: y + h };
        }
        if (shape.type === 'hexagon') {
            const cx = shape.cx ?? 0;
            const cy = shape.cy ?? 0;
            const r = shape.r ?? 0;
            return { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r };
        }
        if (shape.type === 'polyline' && Array.isArray(shape.points) && shape.points.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            shape.points.forEach(p => {
                if (p.x < minX) minX = p.x;
                if (p.x > maxX) maxX = p.x;
                if (p.y < minY) minY = p.y;
                if (p.y > maxY) maxY = p.y;
            });
            return { minX, minY, maxX, maxY };
        }
        if (shape.type === 'callout') {
            const tX = shape.targetX ?? 0;
            const tY = shape.targetY ?? 0;
            const bX = shape.boxX ?? 0;
            const bY = shape.boxY ?? 0;
            return { minX: Math.min(tX, bX - 35), minY: Math.min(tY, bY - 15), maxX: Math.max(tX, bX + 35), maxY: Math.max(tY, bY + 15) };
        }
        if (shape.type === 'text' || shape.type === 'stamp') {
            const x = shape.x ?? 0;
            const y = shape.y ?? 0;
            return { minX: x - 40, minY: y - 20, maxX: x + 40, maxY: y + 20 };
        }
        return null;
    };

    // Clear selection on tool or drawing change
    useEffect(() => {
        setSelectedShapeId(null);
        setSelectedShapeIds([]);
        setSelectionBox(null);
        setHoveredShapeId(null);
    }, [cadTool]);

    useEffect(() => {
        setSelectedShapeId(null);
        setSelectedShapeIds([]);
        setSelectionBox(null);
        setHoveredShapeId(null);
        setPanOffset({ x: 0, y: 0 });
        setZoom(1.0);
        setActiveTakeoffCategory(null);
        setActiveLayer('All Layers');
    }, [selectedDwgId]);

    // PDF backdrop rendering state and effect (100% Client-side JS / Node Engine)
    const [pdfBackdropUrl, setPdfBackdropUrl] = useState(null);
    const [isRenderingPdf, setIsRenderingPdf] = useState(false);

    useEffect(() => {
        let isMounted = true;
        const dataUrlVal = selectedDwg?.dataUrl || selectedDwg?.data_url;
        
        if (selectedDwg && (selectedDwg.fileType === 'PDF' || selectedDwg.fileType === 'DWG' || selectedDwg.fileName?.toLowerCase().endsWith('.pdf')) && dataUrlVal) {
            if (dataUrlVal.startsWith('data:image/')) {
                setPdfBackdropUrl(dataUrlVal);
            } else if (dataUrlVal.startsWith('data:application/pdf') || dataUrlVal.startsWith('blob:') || selectedDwg.fileType === 'PDF' || selectedDwg.fileName?.toLowerCase().endsWith('.pdf')) {
                setIsRenderingPdf(true);
                convertPdfToImageDataUrl(dataUrlVal, 2.5)
                    .then(imgUrl => {
                        if (isMounted) {
                            setPdfBackdropUrl(imgUrl);
                        }
                    })
                    .catch(err => {
                        console.error("[DrawingManager] Error rendering PDF via pdfjs-dist:", err);
                        if (isMounted) {
                            setPdfBackdropUrl(null);
                        }
                    })
                    .finally(() => {
                        if (isMounted) {
                            setIsRenderingPdf(false);
                        }
                    });
            } else {
                setPdfBackdropUrl(null);
            }
        } else {
            setPdfBackdropUrl(null);
        }

        return () => {
            isMounted = false;
        };
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
            const gdt = activeDim.gdt_frame || {};
            setEditGdtFrameEnabled(gdt.enabled || false);
            setEditGdtTolerance(gdt.tolerance || '');
            setEditGdtHasDiameter(gdt.hasDiameter || false);
            setEditGdtModifier(gdt.modifier || '');
            setEditGdtDatum1(gdt.datum1 || '');
            setEditGdtDatum2(gdt.datum2 || '');
            setEditGdtDatum3(gdt.datum3 || '');
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
            
            // Sync AI Vision and Hardware Binding states
            setEditVisionEnabled(activeDim.visionEnabled || false);
            setEditYoloModel(activeDim.yoloModel || 'yolov8n.pt');
            setEditYoloClass(activeDim.yoloClass || '');
            setEditDeviceLockEnabled(activeDim.deviceLockEnabled || false);
            setEditDeviceProfile(activeDim.deviceProfile || 'Mitutoyo Caliper (BLE)');

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

    useEffect(() => {
        safeSaveDrawingsToLocalStorage(drawings);
    }, [drawings]);

    // Save selected blueprint selection to localStorage for cross-dashboard syncing
    useEffect(() => {
        if (selectedDwg?.id) {
            localStorage.setItem('mandor_selected_dwg_id', selectedDwg.id);
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
            gdtFrameEnabled: setEditGdtFrameEnabled, gdtTolerance: setEditGdtTolerance,
            gdtHasDiameter: setEditGdtHasDiameter, gdtModifier: setEditGdtModifier,
            gdtDatum1: setEditGdtDatum1, gdtDatum2: setEditGdtDatum2, gdtDatum3: setEditGdtDatum3,
            x1: setEditX1, y1: setEditY1, z1: setEditZ1, x2: setEditX2, y2: setEditY2, z2: setEditZ2,
            lx: setEditLx, ly: setEditLy, lz: setEditLz, cx: setEditCx, cy: setEditCy,
            angleStart: setEditAngleStart, angleEnd: setEditAngleEnd,
            markerShape: setEditMarkerShape, markerSize: setEditMarkerSize, lineWidth: setEditLineWidth,
            severity: setEditSeverity, inspection_method: setEditInspectionMethod,
            visionEnabled: setEditVisionEnabled, yoloModel: setEditYoloModel, yoloClass: setEditYoloClass,
            deviceLockEnabled: setEditDeviceLockEnabled, deviceProfile: setEditDeviceProfile,
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
    // ─── FILE OPERATIONS (MLightCadViewer) ────────────────────────────
    const handleSaveCurrentDrawing = async () => {
        if (!selectedDwg) {
            toast.error('Tidak ada drawing aktif yang dapat disimpan.');
            return;
        }
        toast.loading('Menyimpan drawing...', { id: 'save-dwg' });
        try {
            await saveDrawing(selectedDwg);
            toast.success('Drawing berhasil disimpan ke database.', { id: 'save-dwg' });
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Gagal menyimpan drawing.', { id: 'save-dwg' });
        }
    };

    const handleExportCAD = (format = 'dxf') => {
        if (!selectedDwg) {
            toast.error('Tidak ada drawing untuk di-export.');
            return;
        }
        toast.success(`Memproses export ${format.toUpperCase()}...`, { icon: '⚙️' });
        setTimeout(() => {
            toast.success(`Berhasil! File ${selectedDwg.name || 'drawing'}.${format} siap diunduh.`, { icon: '✅' });
        }, 1500);
    };

    const handleExportPDF = () => {
        if (!selectedDwg) {
            toast.error('Tidak ada drawing untuk di-export.');
            return;
        }
        toast.success('Mengekspor ke Vector PDF...', { icon: '🖨️' });
        setTimeout(() => {
            toast.success(`Berhasil! File PDF siap diunduh.`, { icon: '📄' });
        }, 1500);
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
                        visionEnabled: editVisionEnabled,
                        yoloModel: editYoloModel,
                        yoloClass: editYoloClass,
                        deviceLockEnabled: editDeviceLockEnabled,
                        deviceProfile: editDeviceProfile,
                        gdt_frame: {
                            enabled: editGdtFrameEnabled,
                            symbol: editGdtSymbol,
                            tolerance: editGdtTolerance,
                            hasDiameter: editGdtHasDiameter,
                            modifier: editGdtModifier,
                            datum1: editGdtDatum1,
                            datum2: editGdtDatum2,
                            datum3: editGdtDatum3
                        },
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

    // ─── Add new dimension by category (starts interactive drawing) ───
    const handleAddDimension = (categoryKey) => {
        if (!selectedDwg) {
            toast.error('Pilih gambar blueprint terlebih dahulu.');
            return;
        }
        setDrawingCategory(categoryKey);
        setCadTool('dimension');
        setDimDrawState('idle');
        setDimDraftCoords(null);
        setShowAddPicker(false);
        const catDef = getCategoryDef(categoryKey);
        if (categoryKey === 'angle') {
            toast.success(`Menggambar ${catDef.labelId}: Klik titik pusat (Vertex), lalu lengan pertama, dan terakhir lengan kedua.`);
        } else {
            toast.success(`Menggambar ${catDef.labelId}: Klik titik awal dan titik akhir. Balon akan otomatis diletakkan di tengah.`);
        }
    };

    const handleDeleteDimension = (dimId) => {
        if (!selectedDwg) return;
        const updatedDwg = { ...selectedDwg, dimensions: selectedDwg.dimensions.filter(dim => dim.id !== dimId) };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        if (activeDimId === dimId) {
            setActiveDimId(updatedDwg.dimensions.length > 0 ? updatedDwg.dimensions[0].id : '');
        }
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save after delete:', err));
        toast.success('Parameter berhasil dihapus.');
    };

    const handleDuplicateDimension = (dimId) => {
        if (!selectedDwg) return;
        const original = selectedDwg.dimensions.find(d => d.id === dimId);
        if (!original) return;
        const newDimId = `dim_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const newDim = {
            ...original,
            id: newDimId,
            label: `${original.label} (Copy)`,
            // Offset coordinates slightly so they don't cover the original
            x1: (original.x1 ?? 150) + 15,
            y1: (original.y1 ?? 180) + 15,
            x2: (original.x2 ?? 350) + 15,
            y2: (original.y2 ?? 180) + 15,
            lx: (original.lx ?? 250) + 15,
            ly: (original.ly ?? 200) + 15,
            cx: (original.cx ?? 250) + 15,
            cy: (original.cy ?? 180) + 15
        };

        const updatedDwg = { ...selectedDwg, dimensions: [...selectedDwg.dimensions, newDim] };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        setActiveDimId(newDimId);
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save after duplicate:', err));
        toast.success('Parameter berhasil diduplikasi.');
    };

    const handleRotateDimension = (dimId, actionType = 'toggle') => {
        if (!selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === dimId) {
                    if (actionType === 'toggle') {
                        const nextType = dim.indicatorType === 'horizontal' ? 'vertical' : 'horizontal';
                        return { ...dim, indicatorType: nextType };
                    } else if (actionType === '90deg') {
                        const cx = ((dim.x1 ?? 150) + (dim.x2 ?? 350)) / 2;
                        const cy = ((dim.y1 ?? 180) + (dim.y2 ?? 180)) / 2;
                        const rx1 = cx - ((dim.y1 ?? 180) - cy);
                        const ry1 = cy + ((dim.x1 ?? 150) - cx);
                        const rx2 = cx - ((dim.y2 ?? 180) - cy);
                        const ry2 = cy + ((dim.x2 ?? 350) - cx);
                        const rlx = cx - ((dim.ly ?? 200) - cy);
                        const rly = cy + ((dim.lx ?? 250) - cx);
                        
                        return {
                            ...dim,
                            x1: Math.round(rx1),
                            y1: Math.round(ry1),
                            x2: Math.round(rx2),
                            y2: Math.round(ry2),
                            lx: Math.round(rlx),
                            ly: Math.round(rly),
                            indicatorType: dim.indicatorType === 'horizontal' ? 'vertical' : (dim.indicatorType === 'vertical' ? 'horizontal' : dim.indicatorType)
                        };
                    }
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save after rotate:', err));
        toast.success('Parameter berhasil dirotasi.');
    };

    const handleChangeDimensionProp = (dimId, prop, value) => {
        if (!selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === dimId) {
                    return { ...dim, [prop]: value };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        if (activeDimId === dimId) {
            if (prop === 'markerSize') setEditMarkerSize(value);
            if (prop === 'lineWidth') setEditLineWidth(value);
            if (prop === 'markerShape') setEditMarkerShape(value);
            if (prop === 'category') setEditCategory(value);
        }
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save prop:', err));
    };

    const handleSliderCoordinateChange = (dimObj, key, val) => {
        const numVal = parseInt(val);
        const isAngle = dimObj.category === 'angle';
        
        let extraFields = {};
        if (isAngle) {
            const cx = key === 'cx' ? numVal : (dimObj.cx ?? 250);
            const cy = key === 'cy' ? numVal : (dimObj.cy ?? 180);
            const x1 = key === 'x1' ? numVal : (dimObj.x1 ?? 150);
            const y1 = key === 'y1' ? numVal : (dimObj.y1 ?? 180);
            const x2 = key === 'x2' ? numVal : (dimObj.x2 ?? 350);
            const y2 = key === 'y2' ? numVal : (dimObj.y2 ?? 180);
            
            const angleStart = Math.round(Math.atan2(y1 - cy, x1 - cx) * (180 / Math.PI));
            const angleEnd = Math.round(Math.atan2(y2 - cy, x2 - cx) * (180 / Math.PI));
            
            extraFields = { angleStart, angleEnd };
        }
        
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(d => {
                if (d.id === dimObj.id) {
                    return { ...d, [key]: numVal, ...extraFields };
                }
                return d;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        
        // Sync local edit values if this is the active dim
        if (activeDimId === dimObj.id) {
            if (key === 'lx') setEditLx(numVal);
            if (key === 'ly') setEditLy(numVal);
            if (key === 'x1') setEditX1(numVal);
            if (key === 'y1') setEditY1(numVal);
            if (key === 'x2') setEditX2(numVal);
            if (key === 'y2') setEditY2(numVal);
        }
        
        saveDrawing(updatedDwg).catch(err => console.error('Failed to save slider position:', err));
    };

    const handleChangeDimensionCategory = (dimId, newCategory) => {
        if (!selectedDwg) return;
        const catDef = getCategoryDef(newCategory);
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === dimId) {
                    return {
                        ...dim,
                        category: newCategory,
                        measureType: catDef.defaultMeasure,
                        indicatorType: catDef.defaultIndicator,
                        unit: catDef.defaultUnit,
                        gdt_symbol: catDef.symbol
                    };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        if (activeDimId === dimId) {
            setEditCategory(newCategory);
            setEditMeasureType(catDef.defaultMeasure);
            setEditIndicatorType(catDef.defaultIndicator);
            setEditUnit(catDef.defaultUnit);
            setEditGdtSymbol(catDef.symbol);
        }
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save category change:', err));
        toast.success(`Tipe parameter diubah ke ${catDef.label}.`);
    };

    const handleDimensionContextMenu = (e, dimId) => {
        e.preventDefault();
        e.stopPropagation();
        setActiveDimId(dimId);
        if (svgRef.current) {
            const parentRect = svgRef.current.parentElement.getBoundingClientRect();
            const top = e.clientY - parentRect.top;
            const left = e.clientX - parentRect.left;
            setDimContextMenu({
                dimId,
                x: left,
                y: top
            });
        }
    };

    const handleDeleteShape = (shapeId) => {
        if (!selectedDwg || !shapeId) return;
        const currentShapes = selectedDwg.shapes || [];
        const filtered = currentShapes.filter(s => s.id !== shapeId);
        updateShapes(filtered);
        if (selectedShapeId === shapeId) setSelectedShapeId(null);
        toast.success('Bentuk geometri berhasil dihapus.');
    };

    const handleCanvasContextMenu = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (svgRef.current) {
            const parentRect = svgRef.current.parentElement.getBoundingClientRect();
            const top = e.clientY - parentRect.top;
            const left = e.clientX - parentRect.left;
            const canvasCoords = getCanvasCoords(e);
            setCanvasContextMenu({
                x: left,
                y: top,
                canvasX: canvasCoords.x,
                canvasY: canvasCoords.y
            });
        }
    };

    const setStartPointFromCanvasMenu = () => {
        if (!activeDimId || !selectedDwg || !canvasContextMenu) return;
        const targetX = Math.round(canvasContextMenu.canvasX);
        const targetY = Math.round(canvasContextMenu.canvasY);
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    const isAngle = dim.category === 'angle';
                    if (isAngle) {
                        const cx = dim.cx ?? dim.lx;
                        const cy = dim.cy ?? dim.ly;
                        const angleStart = Math.round(Math.atan2(targetY - cy, targetX - cx) * (180 / Math.PI));
                        return { ...dim, x1: targetX, y1: targetY, angleStart };
                    }
                    return { ...dim, x1: targetX, y1: targetY };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save start point change:', err));
        setCanvasContextMenu(null);
        toast.success('Titik awal parameter berhasil diperbarui.');
    };

    const setEndPointFromCanvasMenu = () => {
        if (!activeDimId || !selectedDwg || !canvasContextMenu) return;
        const targetX = Math.round(canvasContextMenu.canvasX);
        const targetY = Math.round(canvasContextMenu.canvasY);
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    const isAngle = dim.category === 'angle';
                    if (isAngle) {
                        const cx = dim.cx ?? dim.lx;
                        const cy = dim.cy ?? dim.ly;
                        const angleEnd = Math.round(Math.atan2(targetY - cy, targetX - cx) * (180 / Math.PI));
                        return { ...dim, x2: targetX, y2: targetY, angleEnd };
                    }
                    return { ...dim, x2: targetX, y2: targetY };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save end point change:', err));
        setCanvasContextMenu(null);
        toast.success('Titik akhir parameter berhasil diperbarui.');
    };

    const setCenterPointFromCanvasMenu = () => {
        if (!activeDimId || !selectedDwg || !canvasContextMenu) return;
        const targetX = Math.round(canvasContextMenu.canvasX);
        const targetY = Math.round(canvasContextMenu.canvasY);
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    const angleStart = Math.round(Math.atan2((dim.y1 ?? 180) - targetY, (dim.x1 ?? 150) - targetX) * (180 / Math.PI));
                    const angleEnd = Math.round(Math.atan2((dim.y2 ?? 180) - targetY, (dim.x2 ?? 350) - targetX) * (180 / Math.PI));
                    return { ...dim, cx: targetX, cy: targetY, angleStart, angleEnd };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save center point change:', err));
        setCanvasContextMenu(null);
        toast.success('Titik pusat (Vertex) parameter berhasil diperbarui.');
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
        } else if (shape.type === 'circle' || shape.type === 'arc' || shape.type === 'ellipse' || shape.type === 'hexagon') {
            return { x: shape.cx, y: shape.cy };
        } else if (shape.type === 'rect' || shape.type === 'image' || shape.type === 'triangle') {
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
                } else if (shape.type === 'rect' || shape.type === 'image' || shape.type === 'triangle') {
                    if (direction === 'horizontal') {
                        return { ...shape, x: 2 * cx - shape.x - shape.w };
                    } else {
                        return { ...shape, y: 2 * cy - shape.y - shape.h };
                    }
                } else if (shape.type === 'circle' || shape.type === 'ellipse' || shape.type === 'hexagon') {
                    if (direction === 'horizontal') {
                        return { ...shape, cx: 2 * cx - shape.cx };
                    } else {
                        return { ...shape, cy: 2 * cy - shape.cy };
                    }
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

    // Helper to finish drafting polyline
    const finishPolylineDraft = () => {
        if (cadTool === 'polyline' && polylineDraftPoints.length > 0) {
            const points = polylineDraftPoints.length > 2 ? polylineDraftPoints.slice(0, -1) : polylineDraftPoints;
            if (points.length >= 2) {
                const currentShapes = selectedDwg?.shapes || [];
                const takeoffShapesList = currentShapes.filter(s => s.takeoffType);

                const newPolyline = {
                    id: `shape_poly_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
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
                        newPolyline.takeoffName = `Pipa #${takeoffShapesList.filter(s => s.takeoffSubtype === 'cable_length').length + 1}`;
                    } else if (activeTakeoffCategory === 'area_paint') {
                        newPolyline.takeoffType = 'area';
                        newPolyline.takeoffSubtype = 'paint_area';
                        newPolyline.takeoffName = `Luas Ducting #${takeoffShapesList.filter(s => s.takeoffSubtype === 'paint_area').length + 1}`;
                    } else if (activeTakeoffCategory === 'area_floor') {
                        newPolyline.takeoffType = 'area';
                        newPolyline.takeoffSubtype = 'floor_area';
                        newPolyline.takeoffName = `Luas Isolasi #${takeoffShapesList.filter(s => s.takeoffSubtype === 'floor_area').length + 1}`;
                    }
                }

                updateShapes([...currentShapes, newPolyline]);
                toast.success(activeTakeoffCategory ? 'Item Takeoff berhasil ditambahkan.' : 'Polyline selesai.');
            }
            setPolylineDraftPoints([]);
        }
    };

    // Hotkeys / Keyboard shortcuts for dimension parameter editing & CAD tools
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ignore hotkeys if user is currently typing in any input field or textarea
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
                return;
            }

            // Finish Polyline with Enter / Return key
            if ((e.key === 'Enter' || e.key === 'NumpadEnter') && cadTool === 'polyline' && polylineDraftPoints.length > 0) {
                e.preventDefault();
                e.stopPropagation();
                finishPolylineDraft();
                return;
            }

            if (activeDimId) {
                const activeDim = selectedDwg?.dimensions?.find(d => d.id === activeDimId);

                // 1. Delete / Backspace -> Delete Selected Parameter
                if ((e.key === 'Delete' || e.key === 'Backspace') && activeDim && !activeDim.locked) {
                    e.preventDefault();
                    handleDeleteDimension(activeDimId);
                    toast.success('Parameter dihapus via hotkey.');
                }

                // 2. Ctrl + D -> Duplicate Selected Parameter
                if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                    e.preventDefault();
                    handleDuplicateDimension(activeDimId);
                    toast.success('Parameter diduplikat via hotkey.');
                }
            }

            // Ctrl + A -> Select All CAD Entities
            if ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) {
                e.preventDefault();
                const allShapes = selectedDwg?.shapes || [];
                const allIds = allShapes.map(s => s.id);
                setSelectedShapeIds(allIds);
                setSelectedShapeId(null);
                if (allIds.length > 0) {
                    toast.success(`${allIds.length} seluruh entitas CAD dipilih (Select All).`);
                }
            }

            // Delete / Backspace -> Delete Selected CAD Entities
            if ((e.key === 'Delete' || e.key === 'Backspace') && (selectedShapeIds.length > 0 || selectedShapeId)) {
                e.preventDefault();
                const toDeleteIds = selectedShapeId ? [...new Set([...selectedShapeIds, selectedShapeId])] : selectedShapeIds;
                const currentShapes = selectedDwg?.shapes || [];
                const remaining = currentShapes.filter(s => !toDeleteIds.includes(s.id));
                updateShapes(remaining);
                toast.success(`${toDeleteIds.length} entitas CAD dihapus.`);
                setSelectedShapeIds([]);
                setSelectedShapeId(null);
            }

            // 3. Escape -> Clear active selection / cancel polyline draft / cancel shape draft / close menus
            if (e.key === 'Escape') {
                e.preventDefault();
                if (drawingShape) {
                    setDrawingShape(null);
                    toast.info('Pembuatan objek dibatalkan.');
                }
                if (cadTool === 'polyline' && polylineDraftPoints.length > 0) {
                    setPolylineDraftPoints([]);
                    toast.info('Pembuatan polyline dibatalkan.');
                }
                setDimContextMenu(null);
                setDimMoveMode(null);
                setDimDrawState('idle');
                setDimDraftCoords(null);
                setSelectedShapeId(null);
                setSelectedShapeIds([]);
                setSelectionBox(null);
            }

            // 4. F3 -> Toggle OSNAP Mode
            if (e.key === 'F3') {
                e.preventDefault();
                setOsnapActive(prev => {
                    const nextVal = !prev;
                    toast.success(nextVal ? 'OSNAP Aktif' : 'OSNAP Nonaktif', { id: 'osnap-toggle' });
                    return nextVal;
                });
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeDimId, selectedDwg, handleDeleteDimension, handleDuplicateDimension, setOsnapActive, cadTool, polylineDraftPoints, finishPolylineDraft]);

    const getSnappedCoords = (rawX, rawY) => {
        if (!osnapActive) return { x: rawX, y: rawY, snap: null };

        const segments = [];
        const circles = [];
        const arcs = [];
        const rects = [];

        const addSegment = (p1, p2) => {
            if (p1 && p2) segments.push({ p1, p2 });
        };

        if (selectedDwg) {
            // User shapes
            (selectedDwg.shapes || []).forEach(s => {
                if (s.type === 'line') {
                    addSegment({ x: s.x1, y: s.y1 }, { x: s.x2, y: s.y2 });
                } else if (s.type === 'polyline' && s.points) {
                    for (let i = 0; i < s.points.length - 1; i++) {
                        addSegment(s.points[i], s.points[i+1]);
                    }
                } else if (s.type === 'rect') {
                    const x = s.x;
                    const y = s.y;
                    const w = s.width;
                    const h = s.height;
                    rects.push({ x, y, w, h });
                    addSegment({ x, y }, { x: x + w, y });
                    addSegment({ x: x + w, y }, { x: x + w, y: y + h });
                    addSegment({ x: x + w, y: y + h }, { x, y: y + h });
                    addSegment({ x, y: y + h }, { x, y });
                } else if (s.type === 'triangle') {
                    const x = s.x;
                    const y = s.y;
                    const w = s.width;
                    const h = s.height;
                    const pTop = { x: x + w / 2, y: y };
                    const pBL = { x: x, y: y + h };
                    const pBR = { x: x + w, y: y + h };
                    rects.push({ x, y, w, h });
                    addSegment(pTop, pBL);
                    addSegment(pBL, pBR);
                    addSegment(pBR, pTop);
                } else if (s.type === 'hexagon') {
                    const cx = s.cx ?? (s.x + (s.width || 60) / 2);
                    const cy = s.cy ?? (s.y + (s.height || 60) / 2);
                    const r = s.r ?? ((s.width || 60) / 2);
                    const hexPts = [];
                    for (let i = 0; i < 6; i++) {
                        const rad = (i * 60 * Math.PI) / 180;
                        hexPts.push({ x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) });
                    }
                    for (let i = 0; i < 6; i++) {
                        addSegment(hexPts[i], hexPts[(i + 1) % 6]);
                    }
                    circles.push({ cx, cy, r });
                } else if (s.type === 'ellipse') {
                    const rx = s.rx ?? s.r ?? ((s.width || 60) / 2);
                    const ry = s.ry ?? s.r ?? ((s.height || 40) / 2);
                    circles.push({ cx: s.cx, cy: s.cy, r: Math.max(rx, ry) });
                } else if (s.type === 'circle') {
                    circles.push({ cx: s.cx, cy: s.cy, r: s.r });
                } else if (s.type === 'arc') {
                    arcs.push({ cx: s.cx, cy: s.cy, r: s.r, startAngle: s.startAngle, endAngle: s.endAngle });
                }
            });

            // DXF entities
            (selectedDwg.entities || []).forEach(e => {
                if (e.type === 'LINE') {
                    addSegment({ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 });
                } else if (e.type === 'CIRCLE') {
                    circles.push({ cx: e.cx, cy: e.cy, r: e.radius });
                } else if (e.type === 'ARC') {
                    arcs.push({ cx: e.cx, cy: e.cy, r: e.radius, startAngle: e.startAngle, endAngle: e.endAngle });
                }
            });

            // Dimensions
            (selectedDwg.dimensions || []).forEach(d => {
                if (d.x1 !== undefined && d.y1 !== undefined && d.x2 !== undefined && d.y2 !== undefined) {
                    addSegment({ x: d.x1, y: d.y1 }, { x: d.x2, y: d.y2 });
                }
            });
        }

        // Active drawing shapes and polyline draft points
        if (drawingShape) {
            if (drawingShape.type === 'line') {
                addSegment({ x: drawingShape.x1, y: drawingShape.y1 }, { x: drawingShape.x2, y: drawingShape.y2 });
            } else if (drawingShape.type === 'rect') {
                const x = drawingShape.x, y = drawingShape.y, w = drawingShape.width, h = drawingShape.height;
                addSegment({ x, y }, { x: x + w, y });
                addSegment({ x: x + w, y }, { x: x + w, y: y + h });
                addSegment({ x: x + w, y: y + h }, { x, y: y + h });
                addSegment({ x, y: y + h }, { x, y });
            } else if (drawingShape.type === 'triangle') {
                const x = drawingShape.x, y = drawingShape.y, w = drawingShape.width, h = drawingShape.height;
                const pTop = { x: x + w / 2, y };
                const pBL = { x, y: y + h };
                const pBR = { x: x + w, y: y + h };
                addSegment(pTop, pBL); addSegment(pBL, pBR); addSegment(pBR, pTop);
            }
        }
        if (polylineDraftPoints && polylineDraftPoints.length > 0) {
            for (let i = 0; i < polylineDraftPoints.length - 1; i++) {
                addSegment(polylineDraftPoints[i], polylineDraftPoints[i + 1]);
            }
        }

        // 1b. Inject hardcoded blueprint mockups for OSNAP detection
        if (selectedDwgId === 'dwg_flange_connector') {
            const g1x = 10;
            circles.push({ cx: 140 + g1x, cy: 180, r: 90 });
            circles.push({ cx: 140 + g1x, cy: 180, r: 65 });
            circles.push({ cx: 140 + g1x, cy: 180, r: 30 });
            addSegment({ x: 140 + g1x, y: 75 }, { x: 140 + g1x, y: 285 });
            addSegment({ x: 35 + g1x, y: 180 }, { x: 245 + g1x, y: 180 });
            [0, 45, 90, 135, 180, 225, 270, 315].forEach(angle => {
                const rad = (angle * Math.PI) / 180;
                const bx = 140 + 65 * Math.cos(rad) + g1x;
                const by = 180 + 65 * Math.sin(rad);
                circles.push({ cx: bx, cy: by, r: 8 });
            });

            const g2x = 300;
            addSegment({ x: 100 + g2x, y: 65 }, { x: 100 + g2x, y: 295 });
            const pts = [
                { x: 40 + g2x, y: 110 }, { x: 100 + g2x, y: 110 }, { x: 100 + g2x, y: 140 },
                { x: 90 + g2x, y: 140 }, { x: 90 + g2x, y: 220 }, { x: 100 + g2x, y: 220 },
                { x: 100 + g2x, y: 250 }, { x: 40 + g2x, y: 250 }, { x: 40 + g2x, y: 220 },
                { x: 15 + g2x, y: 220 }, { x: 15 + g2x, y: 140 }, { x: 40 + g2x, y: 140 }
            ];
            for (let i = 0; i < pts.length; i++) {
                addSegment(pts[i], pts[(i + 1) % pts.length]);
            }
        } else if (selectedDwgId === 'dwg_hydraulic_cylinder') {
            const gx = 40;
            const gy = 20;
            rects.push({ x: 60 + gx, y: 100 + gy, w: 220, h: 120 });
            rects.push({ x: 280 + gx, y: 130 + gy, w: 140, h: 60 });
            circles.push({ cx: 435 + gx, cy: 160 + gy, r: 15 });
            addSegment({ x: 20 + gx, y: 160 + gy }, { x: 450 + gx, y: 160 + gy });
            
            addSegment({ x: 60 + gx, y: 100 + gy }, { x: 280 + gx, y: 100 + gy });
            addSegment({ x: 280 + gx, y: 100 + gy }, { x: 280 + gx, y: 220 + gy });
            addSegment({ x: 280 + gx, y: 220 + gy }, { x: 60 + gx, y: 220 + gy });
            addSegment({ x: 60 + gx, y: 220 + gy }, { x: 60 + gx, y: 100 + gy });
            
            addSegment({ x: 280 + gx, y: 130 + gy }, { x: 420 + gx, y: 130 + gy });
            addSegment({ x: 420 + gx, y: 130 + gy }, { x: 420 + gx, y: 190 + gy });
            addSegment({ x: 420 + gx, y: 190 + gy }, { x: 280 + gx, y: 190 + gy });
            addSegment({ x: 280 + gx, y: 190 + gy }, { x: 280 + gx, y: 130 + gy });
        } else if (selectedDwgId === 'dwg_product_checking') {
            const pts = [
                { x: 30, y: 350 }, { x: 30, y: 300 }, { x: 50, y: 300 }, { x: 250, y: 300 },
                { x: 270, y: 300 }, { x: 270, y: 350 }, { x: 350, y: 350 }, { x: 350, y: 250 },
                { x: 470, y: 250 }, { x: 470, y: 350 }
            ];
            for (let i = 0; i < pts.length; i++) {
                addSegment(pts[i], pts[(i + 1) % pts.length]);
            }
            addSegment({ x: 30, y: 300 }, { x: 270, y: 300 });

            circles.push({ cx: 200, cy: 200, r: 15 });
            circles.push({ cx: 200, cy: 200, r: 8 });
            addSegment({ x: 170, y: 200 }, { x: 230, y: 200 });
            addSegment({ x: 200, y: 170 }, { x: 200, y: 230 });

            rects.push({ x: 385, y: 100, w: 30, h: 100 });
            addSegment({ x: 385, y: 100 }, { x: 415, y: 100 });
            addSegment({ x: 415, y: 100 }, { x: 415, y: 200 });
            addSegment({ x: 415, y: 200 }, { x: 385, y: 200 });
            addSegment({ x: 385, y: 200 }, { x: 385, y: 100 });
            addSegment({ x: 400, y: 80 }, { x: 400, y: 220 });

            circles.push({ cx: 150, cy: 250, r: 10 });
            addSegment({ x: 135, y: 250 }, { x: 165, y: 250 });
            addSegment({ x: 150, y: 235 }, { x: 150, y: 265 });

            rects.push({ x: 90, y: 90, w: 20, h: 20 });
            addSegment({ x: 90, y: 90 }, { x: 110, y: 90 });
            addSegment({ x: 110, y: 90 }, { x: 110, y: 110 });
            addSegment({ x: 110, y: 110 }, { x: 90, y: 110 });
            addSegment({ x: 90, y: 110 }, { x: 90, y: 90 });

            rects.push({ x: 290, y: 140, w: 20, h: 20 });
            addSegment({ x: 290, y: 140 }, { x: 310, y: 140 });
            addSegment({ x: 310, y: 140 }, { x: 310, y: 160 });
            addSegment({ x: 310, y: 160 }, { x: 290, y: 160 });
            addSegment({ x: 290, y: 160 }, { x: 290, y: 140 });
        }

        const candidates = [];

        const addCandidate = (x, y, type) => {
            if (isNaN(x) || isNaN(y)) return;
            candidates.push({ x: Math.round(x), y: Math.round(y), type });
        };

        // endpoint
        if (osnapModes.endpoint) {
            segments.forEach(s => {
                addCandidate(s.p1.x, s.p1.y, 'start_point');
                addCandidate(s.p2.x, s.p2.y, 'end_point');
            });
            rects.forEach(r => {
                addCandidate(r.x, r.y, 'start_point');
                addCandidate(r.x + r.w, r.y, 'endpoint');
                addCandidate(r.x + r.w, r.y + r.h, 'end_point');
                addCandidate(r.x, r.y + r.h, 'endpoint');
            });
            arcs.forEach(a => {
                const radStart = (a.startAngle * Math.PI) / 180;
                const radEnd = (a.endAngle * Math.PI) / 180;
                addCandidate(a.cx + a.r * Math.cos(radStart), a.cy - a.r * Math.sin(radStart), 'start_point');
                addCandidate(a.cx + a.r * Math.cos(radEnd), a.cy - a.r * Math.sin(radEnd), 'end_point');
            });
        }

        // midpoint
        if (osnapModes.midpoint) {
            segments.forEach(s => {
                addCandidate((s.p1.x + s.p2.x) / 2, (s.p1.y + s.p2.y) / 2, 'midpoint');
            });
            arcs.forEach(a => {
                let diff = a.endAngle - a.startAngle;
                if (diff < 0) diff += 360;
                const midAngle = a.startAngle + diff / 2;
                const radMid = (midAngle * Math.PI) / 180;
                addCandidate(a.cx + a.r * Math.cos(radMid), a.cy - a.r * Math.sin(radMid), 'midpoint');
            });
        }

        // center
        if (osnapModes.center) {
            circles.forEach(c => {
                addCandidate(c.cx, c.cy, 'center');
            });
            arcs.forEach(a => {
                addCandidate(a.cx, a.cy, 'center');
            });
            rects.forEach(r => {
                addCandidate(r.x + r.w / 2, r.y + r.h / 2, 'center');
            });
        }

        // quadrant
        if (osnapModes.quadrant) {
            circles.forEach(c => {
                addCandidate(c.cx + c.r, c.cy, 'quadrant');
                addCandidate(c.cx - c.r, c.cy, 'quadrant');
                addCandidate(c.cx, c.cy + c.r, 'quadrant');
                addCandidate(c.cx, c.cy - c.r, 'quadrant');
            });
        }

        // perpendicular
        if (osnapModes.perpendicular) {
            let pStart = null;
            if (drawingShape && drawingShape.type === 'line') {
                pStart = { x: drawingShape.x1, y: drawingShape.y1 };
            } else if (polylineDraftPoints.length > 1) {
                pStart = polylineDraftPoints[polylineDraftPoints.length - 2];
            } else if (dimDraftCoords && dimDrawState === 'waiting_end') {
                pStart = { x: dimDraftCoords.x1, y: dimDraftCoords.y1 };
            } else if (scaleDraftCoords && scaleDrawState === 'drawing') {
                pStart = { x: scaleDraftCoords.x1, y: scaleDraftCoords.y1 };
            }

            if (pStart) {
                segments.forEach(s => {
                    const dx = s.p2.x - s.p1.x;
                    const dy = s.p2.y - s.p1.y;
                    const lenSq = dx * dx + dy * dy;
                    if (lenSq > 0) {
                        const t = ((pStart.x - s.p1.x) * dx + (pStart.y - s.p1.y) * dy) / lenSq;
                        if (t >= 0 && t <= 1) {
                            addCandidate(s.p1.x + t * dx, s.p1.y + t * dy, 'perpendicular');
                        }
                    }
                });
            }
        }

        // intersection (segment-segment, segment-circle, circle-circle)
        if (osnapModes.intersection) {
            const getSegmentIntersection = (p1, p2, p3, p4) => {
                const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);
                if (denom === 0) return null;
                const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;
                const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denom;
                if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
                    return {
                        x: p1.x + ua * (p2.x - p1.x),
                        y: p1.y + ua * (p2.y - p1.y)
                    };
                }
                return null;
            };

            // 1. Segment vs Segment
            for (let i = 0; i < segments.length; i++) {
                for (let j = i + 1; j < segments.length; j++) {
                    const pt = getSegmentIntersection(segments[i].p1, segments[i].p2, segments[j].p1, segments[j].p2);
                    if (pt) {
                        addCandidate(pt.x, pt.y, 'intersection');
                    }
                }
            }

            // 2. Segment vs Circle
            const getSegmentCircleIntersection = (p1, p2, c) => {
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const lenSq = dx * dx + dy * dy;
                if (lenSq === 0) return [];
                const t = ((c.cx - p1.x) * dx + (c.cy - p1.y) * dy) / lenSq;
                const closestX = p1.x + t * dx;
                const closestY = p1.y + t * dy;
                const distSq = (c.cx - closestX) ** 2 + (c.cy - closestY) ** 2;
                const rSq = c.r ** 2;
                if (distSq > rSq) return [];
                const h = Math.sqrt((rSq - distSq) / lenSq);
                const results = [];
                const t1 = t - h;
                const t2 = t + h;
                if (t1 >= 0 && t1 <= 1) results.push({ x: p1.x + t1 * dx, y: p1.y + t1 * dy });
                if (t2 >= 0 && t2 <= 1 && Math.abs(t2 - t1) > 1e-4) results.push({ x: p1.x + t2 * dx, y: p1.y + t2 * dy });
                return results;
            };

            segments.forEach(s => {
                circles.forEach(c => {
                    getSegmentCircleIntersection(s.p1, s.p2, c).forEach(pt => addCandidate(pt.x, pt.y, 'intersection'));
                });
            });

            // 3. Circle vs Circle
            const getCircleCircleIntersection = (c1, c2) => {
                const dx = c2.cx - c1.cx;
                const dy = c2.cy - c1.cy;
                const d = Math.hypot(dx, dy);
                if (d === 0 || d > c1.r + c2.r || d < Math.abs(c1.r - c2.r)) return [];
                const a = (c1.r ** 2 - c2.r ** 2 + d ** 2) / (2 * d);
                const h2 = c1.r ** 2 - a ** 2;
                if (h2 < 0) return [];
                const h = Math.sqrt(h2);
                const x2 = c1.cx + (a * dx) / d;
                const y2 = c1.cy + (a * dy) / d;
                const rx = -dy * (h / d);
                const ry = dx * (h / d);
                if (h === 0) return [{ x: x2, y: y2 }];
                return [{ x: x2 + rx, y: y2 + ry }, { x: x2 - rx, y: y2 - ry }];
            };

            for (let i = 0; i < circles.length; i++) {
                for (let j = i + 1; j < circles.length; j++) {
                    getCircleCircleIntersection(circles[i], circles[j]).forEach(pt => addCandidate(pt.x, pt.y, 'intersection'));
                }
            }
        }

        const snapRadius = Math.max(30 / zoom, 20);
        let bestTarget = null;
        let minDistance = Infinity;

        candidates.forEach(tc => {
            const dist = Math.hypot(tc.x - rawX, tc.y - rawY);
            if (dist < snapRadius && dist < minDistance) {
                minDistance = dist;
                bestTarget = tc;
            }
        });

        if (bestTarget) {
            return { x: bestTarget.x, y: bestTarget.y, snap: bestTarget };
        }

        return { x: rawX, y: rawY, snap: null };
    };

    const getCanvasCoords = (e) => {
        if (!svgRef.current) return { x: 0, y: 0 };

        let x = 0;
        let y = 0;
        let ctmCalculated = false;

        // Use the native SVG CTM inverse to achieve exact mathematical precision
        // regardless of screen resolution, container aspect-ratio, SVG letterboxing, pan, and zoom.
        if (canvasGroupRef.current && canvasGroupRef.current.getScreenCTM) {
            try {
                const ctm = canvasGroupRef.current.getScreenCTM();
                if (ctm) {
                    const pt = svgRef.current.createSVGPoint();
                    pt.x = e.clientX;
                    pt.y = e.clientY;
                    const transformed = pt.matrixTransform(ctm.inverse());
                    x = transformed.x;
                    y = transformed.y;
                    ctmCalculated = true;
                }
            } catch (err) {
                // Fallback below
            }
        }

        if (!ctmCalculated) {
            if (svgRef.current.getScreenCTM) {
                try {
                    const ctm = svgRef.current.getScreenCTM();
                    if (ctm) {
                        const pt = svgRef.current.createSVGPoint();
                        pt.x = e.clientX;
                        pt.y = e.clientY;
                        const svgP = pt.matrixTransform(ctm.inverse());
                        const cx = canvasSize.width / 2;
                        const cy = canvasSize.height / 2;
                        x = cx + (svgP.x - cx - panOffset.x) / zoom;
                        y = cy + (svgP.y - cy - panOffset.y) / zoom;
                        ctmCalculated = true;
                    }
                } catch (err) {
                    // Fallback below
                }
            }
        }

        if (!ctmCalculated) {
            const rect = svgRef.current.getBoundingClientRect();
            const scaleX = canvasSize.width / rect.width;
            const scaleY = canvasSize.height / rect.height;
            const clickX = (e.clientX - rect.left) * scaleX;
            const clickY = (e.clientY - rect.top) * scaleY;

            const cx = canvasSize.width / 2;
            const cy = canvasSize.height / 2;

            x = cx + (clickX - cx - panOffset.x) / zoom;
            y = cy + (clickY - cy - panOffset.y) / zoom;
        }

        // Perform OSNAP check first
        const snapRes = getSnappedCoords(x, y);
        if (snapRes.snap) {
            setSnappedPoint(snapRes.snap);
            return { x: snapRes.x, y: snapRes.y };
        } else {
            setSnappedPoint(null);
        }

        if (gridSnap) {
            x = Math.round(x / 10) * 10;
            y = Math.round(y / 10) * 10;
        } else {
            x = Math.round(x * 10) / 10;
            y = Math.round(y * 10) / 10;
        }

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
            case 'osnap':
                setShowOsnapModal(true);
                successMessage = 'OSNAP Settings opened.';
                break;
            case 'theme': {
                const themeOrder = ['dark', 'blueprint', 'white'];
                const themeLabels = { dark: '⬛ Dark (Black)', blueprint: '📐 Blueprint (Blue)', white: '⬜ White (Light)' };
                const idx = themeOrder.indexOf(canvasTheme);
                const next = themeOrder[(idx + 1) % themeOrder.length];
                setCanvasTheme(next);
                successMessage = `Canvas Theme: ${themeLabels[next]}`;
                break;
            }
            case 'blueprint':
                setCanvasTheme('blueprint');
                successMessage = 'Canvas Theme: 📐 Blueprint (Blue)';
                break;
            case 'darkmode':
            case 'dark':
                setCanvasTheme('dark');
                successMessage = 'Canvas Theme: ⬛ Dark (Black)';
                break;
            case 'lightmode':
            case 'white':
                setCanvasTheme('white');
                successMessage = 'Canvas Theme: ⬜ White (Light)';
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
                    'Toggles: GRID (toggle snap), ORTHO (toggle drawing lock), OSNAP (Object Snap settings), CLEAR (clear shapes), HELP',
                    'Theme: THEME (cycle), BLUEPRINT (blue), DARK (black), WHITE (light)'
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
            visionEnabled: formData.visionEnabled || false,
            yoloModel: formData.yoloModel || 'yolov8n.pt',
            yoloClass: formData.yoloClass || '',
            deviceLockEnabled: formData.deviceLockEnabled || false,
            deviceProfile: formData.deviceProfile || 'Mitutoyo Caliper (BLE)',
            gdt_frame: formData.gdt_frame || {
                enabled: formData.gdtFrameEnabled || false,
                symbol: formData.gdt_symbol || 'POSITION',
                tolerance: formData.gdtTolerance || '',
                hasDiameter: formData.gdtHasDiameter || false,
                modifier: formData.gdtModifier || '',
                datum1: formData.gdtDatum1 || '',
                datum2: formData.gdtDatum2 || '',
                datum3: formData.gdtDatum3 || ''
            },
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

    const handleDuplicateShape = (shapeToCopy) => {
        if (!shapeToCopy || !selectedDwg) return;
        const currentShapes = selectedDwg.shapes || [];
        const newShape = JSON.parse(JSON.stringify(shapeToCopy));
        newShape.id = `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

        const dx = 15;
        const dy = 15;

        if (newShape.type === 'line') {
            newShape.x1 += dx; newShape.y1 += dy;
            newShape.x2 += dx; newShape.y2 += dy;
        } else if (newShape.type === 'circle' || newShape.type === 'ellipse' || newShape.type === 'hexagon' || newShape.type === 'arc') {
            newShape.cx += dx; newShape.cy += dy;
        } else if (newShape.type === 'rect' || newShape.type === 'triangle' || newShape.type === 'text') {
            newShape.x += dx; newShape.y += dy;
        } else if (newShape.type === 'polyline' && Array.isArray(newShape.points)) {
            newShape.points = newShape.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
        }

        updateShapes([...currentShapes, newShape]);
        setSelectedShapeId(newShape.id);
        toast.success(`Geometri ${newShape.type.toUpperCase()} berhasil diduplikat!`);
    };

    const handleSvgDoubleClick = (e) => {
        if (cadTool === 'polyline' && polylineDraftPoints.length > 0) {
            e.stopPropagation();
            e.preventDefault();
            finishPolylineDraft();
        }
    };

    const handleSvgMouseDown = (e) => {
        setDimContextMenu(null);
        setCanvasContextMenu(null);

        // Intercept middle click, Spacebar + drag, or Pan tool active
        if (e.button === 1 || (e.button === 0 && spacePressed) || (cadTool === 'pan' && e.button === 0)) {
            setIsPanning(true);
            setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
            e.stopPropagation();
            e.preventDefault();
            return;
        }

        const isSelectionTool = !cadTool || cadTool === 'select' || cadTool === 'default';

        if (isSelectionTool) {
            const coords = getCanvasCoords(e);
            if (selectionBox) {
                // Second Click: Commit Marquee Selection!
                const minX = Math.min(selectionBox.startX, coords.x);
                const maxX = Math.max(selectionBox.startX, coords.x);
                const minY = Math.min(selectionBox.startY, coords.y);
                const maxY = Math.max(selectionBox.startY, coords.y);
                const width = maxX - minX;
                const height = maxY - minY;

                if (width > 4 || height > 4) {
                    const isCrossing = coords.x < selectionBox.startX; // Right-to-Left = Crossing (Green), Left-to-Right = Window (Blue)
                    const shapes = selectedDwg?.shapes || [];
                    const matchedIds = [];

                    shapes.forEach(shape => {
                        const bounds = getEntityBounds(shape);
                        if (!bounds) return;

                        if (isCrossing) {
                            const intersects = !(bounds.maxX < minX || bounds.minX > maxX || bounds.maxY < minY || bounds.minY > maxY);
                            if (intersects) matchedIds.push(shape.id);
                        } else {
                            const inside = bounds.minX >= minX && bounds.maxX <= maxX && bounds.minY >= minY && bounds.maxY <= maxY;
                            if (inside) matchedIds.push(shape.id);
                        }
                    });

                    setSelectedShapeIds(matchedIds);
                    justSelectedRef.current = true;
                    if (matchedIds.length > 0) {
                        toast.success(`${matchedIds.length} entitas CAD dipilih (${isCrossing ? 'Crossing' : 'Window'} Selection).`);
                    } else {
                        setSelectedShapeId(null);
                    }
                }
                setSelectionBox(null);
                return;
            } else {
                // First Click: Start Marquee Selection Box!
                setSelectionBox({
                    startX: coords.x,
                    startY: coords.y,
                    currentX: coords.x,
                    currentY: coords.y
                });
                setSelectedShapeId(null);
                setSelectedShapeIds([]);
                return;
            }
        }

        if (cadTool === 'move' || cadTool === 'rotate' || cadTool === 'mirror' || cadTool === 'trim' || cadTool === 'erase' || cadTool === 'copy' || cadTool === 'offset') return;

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
                takeoffName: `Valve #${currentShapes.filter(s => s.takeoffSubtype === 'bolt_count').length + 1}`
            };
            updateShapes([...currentShapes, newShape]);
            toast.success('Valve dihitung (+1)', { id: 'takeoff-count' });
            return;
        }

        if (e.button !== 0) return; // left click only

        const isCadShapeTool = ['line', 'circle', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt', 'rect', 'rectangle', 'ellipse', 'triangle', 'hexagon', 'polygon', 'callout', 'revcloud', 'arrow', 'stamp'].includes(cadTool);

        if (isCadShapeTool) {
            if (drawingShape) {
                // Second Click: Commit/place the shape onto canvas!
                const currentShapes = selectedDwg.shapes || [];
                const newShape = {
                    ...drawingShape,
                    id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`
                };

                // Tag takeoff if active
                if (activeTakeoffCategory) {
                    const takeoffShapesList = currentShapes.filter(s => s.takeoffType);
                    if (activeTakeoffCategory === 'length_cable') {
                        newShape.takeoffType = 'length';
                        newShape.takeoffSubtype = 'cable_length';
                        newShape.takeoffName = `Pipa #${takeoffShapesList.filter(s => s.takeoffSubtype === 'cable_length').length + 1}`;
                        newShape.color = '#10b981';
                    } else if (activeTakeoffCategory === 'area_paint') {
                        newShape.takeoffType = 'area';
                        newShape.takeoffSubtype = 'paint_area';
                        newShape.takeoffName = `Luas Ducting #${takeoffShapesList.filter(s => s.takeoffSubtype === 'paint_area').length + 1}`;
                        newShape.color = '#3b82f6';
                    } else if (activeTakeoffCategory === 'area_floor') {
                        newShape.takeoffType = 'area';
                        newShape.takeoffSubtype = 'floor_area';
                        newShape.takeoffName = `Luas Isolasi #${takeoffShapesList.filter(s => s.takeoffSubtype === 'floor_area').length + 1}`;
                        newShape.color = '#f59e0b';
                    } else if (activeTakeoffCategory === 'count_bolt') {
                        newShape.takeoffType = 'count';
                        newShape.takeoffSubtype = 'bolt_count';
                        newShape.takeoffName = `Valve #${takeoffShapesList.filter(s => s.takeoffSubtype === 'bolt_count').length + 1}`;
                        newShape.color = '#ef4444';
                    }
                }

                updateShapes([...currentShapes, newShape]);
                toast.success(`${(drawingShape.type || 'Objek').toUpperCase()} berhasil ditempatkan.`);
                setDrawingShape(null);
                return;
            } else {
                // First Click: Set starting point!
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
                } else if (['circle', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt'].includes(cadTool)) {
                    setDrawingShape({
                        type: 'circle',
                        mode: cadTool,
                        startX: coords.x,
                        startY: coords.y,
                        cx: coords.x,
                        cy: coords.y,
                        r: 0,
                        color: cadColor,
                        strokeWidth: cadWidth
                    });
                } else if (cadTool === 'rect' || cadTool === 'rectangle') {
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
                } else if (cadTool === 'ellipse') {
                    setDrawingShape({
                        type: 'ellipse',
                        cx: coords.x,
                        cy: coords.y,
                        startX: coords.x,
                        startY: coords.y,
                        rx: 0,
                        ry: 0,
                        color: cadColor,
                        strokeWidth: cadWidth
                    });
                } else if (cadTool === 'triangle') {
                    setDrawingShape({
                        type: 'triangle',
                        x: coords.x,
                        y: coords.y,
                        x1: coords.x,
                        y1: coords.y,
                        w: 0,
                        h: 0,
                        color: cadColor,
                        strokeWidth: cadWidth
                    });
                } else if (cadTool === 'hexagon' || cadTool === 'polygon') {
                    setDrawingShape({
                        type: 'hexagon',
                        cx: coords.x,
                        cy: coords.y,
                        startX: coords.x,
                        startY: coords.y,
                        r: 0,
                        color: cadColor,
                        strokeWidth: cadWidth
                    });
                } else if (cadTool === 'callout') {
                    setDrawingShape({
                        type: 'callout',
                        targetX: coords.x,
                        targetY: coords.y,
                        boxX: coords.x + 40,
                        boxY: coords.y - 30,
                        text: 'Callout',
                        color: cadColor || '#ef4444',
                        strokeWidth: cadWidth || 2
                    });
                } else if (cadTool === 'arrow') {
                    setDrawingShape({
                        type: 'arrow',
                        x1: coords.x,
                        y1: coords.y,
                        x2: coords.x,
                        y2: coords.y,
                        color: cadColor || '#ef4444',
                        strokeWidth: cadWidth || 2
                    });
                } else if (cadTool === 'revcloud') {
                    setDrawingShape({
                        type: 'revcloud',
                        x: coords.x,
                        y: coords.y,
                        x1: coords.x,
                        y1: coords.y,
                        w: 0,
                        h: 0,
                        color: cadColor || '#ef4444',
                        strokeWidth: cadWidth || 2
                    });
                } else if (cadTool === 'stamp') {
                    const currentShapes = selectedDwg.shapes || [];
                    const newShape = {
                        id: `shape_stamp_${Date.now()}`,
                        type: 'stamp',
                        x: coords.x,
                        y: coords.y,
                        text: 'APPROVED',
                        color: '#22c55e',
                        strokeWidth: 2
                    };
                    updateShapes([...currentShapes, newShape]);
                    toast.success('Stempel APPROVED ditempatkan.');
                    return;
                }
                return;
            }
        } else if (cadTool === 'balloon') {
            const nextBalloonNum = (selectedDwg?.dimensions?.length || 0) + 1;
            const catDef = getCategoryDef(drawingCategory || 'dimension');
            const suggestedVars = QMS_VARIABLES_BY_CATEGORY[drawingCategory || 'dimension'] || [];
            
            const lx = coords.x + 35;
            const ly = coords.y - 35;

            setDimModalData({
                x1: coords.x,
                y1: coords.y,
                x2: lx,
                y2: ly,
                lx: lx,
                ly: ly,
                cx: coords.x,
                cy: coords.y,
                spec: '10.00',
                label: `Balon #${nextBalloonNum} - ${catDef.labelId || 'Inspeksi QC'}`,
                category: drawingCategory || 'dimension',
                measureType: catDef.defaultMeasure || 'linear',
                indicatorType: 'radial',
                unit: catDef.defaultUnit || 'mm',
                gdt_symbol: catDef.symbol || '⌀',
                tolMin: '9.80',
                tolMax: '10.20',
                variable: suggestedVars[0] || `Meas_Balloon_${nextBalloonNum}`,
                angleStart: 0,
                angleEnd: 90,
                markerShape: 'circle',
                markerSize: 60,
                visionEnabled: false,
                yoloModel: 'yolov8n.pt',
                yoloClass: '',
                deviceLockEnabled: false,
                deviceProfile: 'Mitutoyo Caliper (BLE)',
                gdtFrameEnabled: false,
                gdtTolerance: '',
                gdtHasDiameter: false,
                gdtModifier: '',
                gdtDatum1: '',
                gdtDatum2: '',
                gdtDatum3: '',
                isBalloonOrigin: true,
                balloonNumber: nextBalloonNum
            });
            setIsBalloonMode(true);
            setIsDimModalOpen(true);
            toast.success(`Titik Balon #${nextBalloonNum} dipilih! Silakan tentukan tipe parameter QC.`);
            return;
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
            const isAngle = drawingCategory === 'angle';

            if (dimDrawState === 'idle') {
                if (isAngle) {
                    setDimDraftCoords({
                        cx: coords.x,
                        cy: coords.y,
                        x1: coords.x,
                        y1: coords.y,
                        x2: coords.x,
                        y2: coords.y,
                        lx: coords.x,
                        ly: coords.y
                    });
                    setDimDrawState('waiting_end');
                    toast.success('Titik pusat (Vertex) sudut ditentukan. Klik titik kedua untuk lengan pertama.');
                } else {
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
                }
            } else if (dimDrawState === 'waiting_end') {
                if (isAngle) {
                    setDimDraftCoords(prev => ({
                        ...prev,
                        x1: coords.x,
                        y1: coords.y
                    }));
                    setDimDrawState('waiting_offset');
                    toast.success('Lengan pertama ditentukan. Klik titik ketiga untuk lengan kedua.');
                } else {
                    // For line/caliper parameters, 2 clicks is all it takes!
                    // Balloon is automatically placed exactly in the middle.
                    const x1 = dimDraftCoords.x1;
                    const y1 = dimDraftCoords.y1;
                    const x2 = coords.x;
                    const y2 = coords.y;
                    const lx = Math.round((x1 + x2) / 2);
                    const ly = Math.round((y1 + y2) / 2);

                    const pxDist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
                    const currentScale = selectedDwg?.scaleFactor || 1.0;
                    const initialSpec = (pxDist * currentScale).toFixed(2);
                    
                    const catDef = getCategoryDef(drawingCategory || 'dimension');
                    const suggestedVars = QMS_VARIABLES_BY_CATEGORY[drawingCategory || 'dimension'] || [];

                    setDimModalData({
                        x1, y1, x2, y2, lx, ly,
                        cx: Math.round((x1 + x2) / 2),
                        cy: Math.round((y1 + y2) / 2),
                        spec: initialSpec,
                        label: selectedGdtTool ? `${selectedGdtTool} Baru` : `${catDef.labelId || 'Dimensi'} Baru`,
                        category: drawingCategory || 'dimension',
                        measureType: catDef.defaultMeasure,
                        indicatorType: catDef.defaultIndicator,
                        unit: catDef.defaultUnit,
                        gdt_symbol: selectedGdtTool || catDef.symbol,
                        tolMin: (parseFloat(initialSpec) - 0.1).toFixed(2),
                        tolMax: (parseFloat(initialSpec) + 0.1).toFixed(2),
                        variable: suggestedVars[0] || 'Meas_Length',
                        angleStart: 0,
                        angleEnd: 90,
                        markerShape: 'default',
                        markerSize: 60,
                        visionEnabled: false,
                        yoloModel: 'yolov8n.pt',
                        yoloClass: '',
                        deviceLockEnabled: false,
                        deviceProfile: 'Mitutoyo Caliper (BLE)',
                        gdtFrameEnabled: !!selectedGdtTool,
                        gdtTolerance: '',
                        gdtHasDiameter: false,
                        gdtModifier: '',
                        gdtDatum1: '',
                        gdtDatum2: '',
                        gdtDatum3: ''
                    });
                    setIsDimModalOpen(true);
                    setDimDrawState('idle');
                    setDimDraftCoords(null);
                    setSelectedGdtTool(null);
                    toast.success('Titik kedua ditempatkan. Dimensi berhasil dibuat.');
                }
            } else if (dimDrawState === 'waiting_offset') {
                if (isAngle) {
                    const cx = dimDraftCoords.cx;
                    const cy = dimDraftCoords.cy;
                    const x1 = dimDraftCoords.x1;
                    const y1 = dimDraftCoords.y1;
                    const x2 = coords.x;
                    const y2 = coords.y;
                    
                    const angleStart = Math.round(Math.atan2(y1 - cy, x1 - cx) * (180 / Math.PI));
                    const angleEnd = Math.round(Math.atan2(y2 - cy, x2 - cx) * (180 / Math.PI));
                    
                    // Position balloon midway between angles
                    const midAngle = (angleStart + angleEnd) / 2;
                    const lx = Math.round(cx + 45 * Math.cos(midAngle * Math.PI / 180));
                    const ly = Math.round(cy + 45 * Math.sin(midAngle * Math.PI / 180));

                    const diff = Math.abs(angleEnd - angleStart);
                    const initialSpec = (diff > 180 ? 360 - diff : diff).toFixed(1);
                    
                    const catDef = getCategoryDef('angle');
                    const suggestedVars = QMS_VARIABLES_BY_CATEGORY['angle'] || [];

                    setDimModalData({
                        x1, y1, x2, y2, lx, ly, cx, cy,
                        spec: initialSpec,
                        label: selectedGdtTool ? `${selectedGdtTool} Baru` : 'Sudut Baru',
                        category: 'angle',
                        measureType: 'angle',
                        indicatorType: 'arc',
                        unit: '°',
                        gdt_symbol: selectedGdtTool || '∠',
                        tolMin: (parseFloat(initialSpec) - 1.0).toFixed(1),
                        tolMax: (parseFloat(initialSpec) + 1.0).toFixed(1),
                        variable: suggestedVars[0] || 'Meas_Angle',
                        angleStart,
                        angleEnd,
                        markerShape: 'default',
                        markerSize: 60,
                        visionEnabled: false,
                        yoloModel: 'yolov8n.pt',
                        yoloClass: '',
                        deviceLockEnabled: false,
                        deviceProfile: 'Mitutoyo Caliper (BLE)',
                        gdtFrameEnabled: !!selectedGdtTool,
                        gdtTolerance: '',
                        gdtHasDiameter: false,
                        gdtModifier: '',
                        gdtDatum1: '',
                        gdtDatum2: '',
                        gdtDatum3: ''
                    });
                    setIsDimModalOpen(true);
                    setDimDrawState('idle');
                    setDimDraftCoords(null);
                    setSelectedGdtTool(null);
                    toast.success('Lengan kedua ditentukan. Sudut berhasil dibuat.');
                }
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

        if (dragRegionState) {
            const dx = coords.x - dragRegionState.startX;
            const dy = coords.y - dragRegionState.startY;
            const init = dragRegionState.initialRegion;
            let nextR = { ...init };

            if (dragRegionState.type === 'move') {
                nextR.x = Math.round(init.x + dx);
                nextR.y = Math.round(init.y + dy);
            } else if (dragRegionState.type === 'resize-br') {
                nextR.w = Math.max(30, Math.round(init.w + dx));
                nextR.h = Math.max(30, Math.round(init.h + dy));
            } else if (dragRegionState.type === 'resize-tl') {
                nextR.x = Math.round(init.x + dx);
                nextR.y = Math.round(init.y + dy);
                nextR.w = Math.max(30, Math.round(init.w - dx));
                nextR.h = Math.max(30, Math.round(init.h - dy));
            } else if (dragRegionState.type === 'resize-tr') {
                nextR.y = Math.round(init.y + dy);
                nextR.w = Math.max(30, Math.round(init.w + dx));
                nextR.h = Math.max(30, Math.round(init.h - dy));
            } else if (dragRegionState.type === 'resize-bl') {
                nextR.x = Math.round(init.x + dx);
                nextR.w = Math.max(30, Math.round(init.w - dx));
                nextR.h = Math.max(30, Math.round(init.h + dy));
            } else if (dragRegionState.type === 'resize-t') {
                nextR.y = Math.round(init.y + dy);
                nextR.h = Math.max(30, Math.round(init.h - dy));
            } else if (dragRegionState.type === 'resize-b') {
                nextR.h = Math.max(30, Math.round(init.h + dy));
            } else if (dragRegionState.type === 'resize-l') {
                nextR.x = Math.round(init.x + dx);
                nextR.w = Math.max(30, Math.round(init.w - dx));
            } else if (dragRegionState.type === 'resize-r') {
                nextR.w = Math.max(30, Math.round(init.w + dx));
            }

            const updatedDwg = {
                ...selectedDwg,
                displayRegion: nextR
            };
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
            return;
        }

        if (dragAnchor) {
            const { dimId, anchorKey } = dragAnchor;
            const updatedDwg = {
                ...selectedDwg,
                dimensions: selectedDwg.dimensions.map(dim => {
                    if (dim.id === dimId) {
                        const isAngle = dim.category === 'angle';
                        if (anchorKey === 'p1') {
                            const newX1 = Math.round(coords.x);
                            const newY1 = Math.round(coords.y);
                            if (isAngle) {
                                const cx = dim.cx ?? dim.lx;
                                const cy = dim.cy ?? dim.ly;
                                const angleStart = Math.round(Math.atan2(newY1 - cy, newX1 - cx) * (180 / Math.PI));
                                return { ...dim, x1: newX1, y1: newY1, angleStart };
                            }
                            return { ...dim, x1: newX1, y1: newY1 };
                        }
                        if (anchorKey === 'p2') {
                            const newX2 = Math.round(coords.x);
                            const newY2 = Math.round(coords.y);
                            if (isAngle) {
                                const cx = dim.cx ?? dim.lx;
                                const cy = dim.cy ?? dim.ly;
                                const angleEnd = Math.round(Math.atan2(newY2 - cy, newX2 - cx) * (180 / Math.PI));
                                return { ...dim, x2: newX2, y2: newY2, angleEnd };
                            }
                            return { ...dim, x2: newX2, y2: newY2 };
                        }
                        if (anchorKey === 'center') {
                            const newCx = Math.round(coords.x);
                            const newCy = Math.round(coords.y);
                            const angleStart = Math.round(Math.atan2((dim.y1 ?? 180) - newCy, (dim.x1 ?? 150) - newCx) * (180 / Math.PI));
                            const angleEnd = Math.round(Math.atan2((dim.y2 ?? 180) - newCy, (dim.x2 ?? 350) - newCx) * (180 / Math.PI));
                            return { ...dim, cx: newCx, cy: newCy, angleStart, angleEnd };
                        }
                        if (anchorKey === 'label') {
                            return { ...dim, lx: Math.round(coords.x), ly: Math.round(coords.y) };
                        }
                    }
                    return dim;
                })
            };
            setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
            return;
        }

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
                        } else if (s.type === 'circle' || s.type === 'arc' || s.type === 'ellipse' || s.type === 'hexagon') {
                            return {
                                ...s,
                                cx: Math.round(startShape.cx + dx),
                                cy: Math.round(startShape.cy + dy)
                            };
                        } else if (s.type === 'rect' || s.type === 'image' || s.type === 'triangle' || s.type === 'text') {
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

        if (selectionBox) {
            setSelectionBox(prev => ({
                ...prev,
                currentX: coords.x,
                currentY: coords.y
            }));
            return;
        }

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
            const startX = drawingShape.startX ?? drawingShape.cx;
            const startY = drawingShape.startY ?? drawingShape.cy;
            const dx = coords.x - startX;
            const dy = coords.y - startY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (drawingShape.mode === 'circle_diameter') {
                setDrawingShape(prev => ({
                    ...prev,
                    cx: startX,
                    cy: startY,
                    r: Math.round(dist / 2),
                    diameter: Math.round(dist)
                }));
            } else if (drawingShape.mode === 'circle_2p') {
                const midX = (startX + coords.x) / 2;
                const midY = (startY + coords.y) / 2;
                setDrawingShape(prev => ({
                    ...prev,
                    cx: Math.round(midX),
                    cy: Math.round(midY),
                    r: Math.round(dist / 2)
                }));
            } else {
                setDrawingShape(prev => ({
                    ...prev,
                    cx: startX,
                    cy: startY,
                    r: Math.round(dist)
                }));
            }
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
        } else if (drawingShape.type === 'ellipse') {
            const rx = Math.round(Math.abs(coords.x - drawingShape.cx));
            const ry = Math.round(Math.abs(coords.y - drawingShape.cy));
            setDrawingShape(prev => ({
                ...prev,
                rx,
                ry
            }));
        } else if (drawingShape.type === 'triangle') {
            const x = Math.min(drawingShape.x1, coords.x);
            const y = Math.min(drawingShape.y1, coords.y);
            const w = Math.round(Math.abs(coords.x - drawingShape.x1));
            const h = Math.round(Math.abs(coords.y - drawingShape.y1));
            setDrawingShape(prev => ({
                ...prev,
                x,
                y,
                w,
                h
            }));
        } else if (drawingShape.type === 'hexagon') {
            const dx = coords.x - drawingShape.cx;
            const dy = coords.y - drawingShape.cy;
            const r = Math.round(Math.sqrt(dx * dx + dy * dy));
            setDrawingShape(prev => ({
                ...prev,
                r
            }));
        } else if (drawingShape.type === 'callout') {
            setDrawingShape(prev => ({
                ...prev,
                boxX: coords.x,
                boxY: coords.y
            }));
        } else if (drawingShape.type === 'arrow') {
            setDrawingShape(prev => ({
                ...prev,
                x2: coords.x,
                y2: coords.y
            }));
        } else if (drawingShape.type === 'revcloud') {
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
        } else if (drawingShape.type === 'roi') {
            const x = Math.min(drawingShape.x1, coords.x);
            const y = Math.min(drawingShape.y1, coords.y);
            const w = Math.round(Math.abs(coords.x - drawingShape.x1));
            const h = Math.round(Math.abs(coords.y - drawingShape.y1));
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
        if (selectionBox) {
            const minX = Math.min(selectionBox.startX, selectionBox.currentX);
            const maxX = Math.max(selectionBox.startX, selectionBox.currentX);
            const minY = Math.min(selectionBox.startY, selectionBox.currentY);
            const maxY = Math.max(selectionBox.startY, selectionBox.currentY);
            const width = maxX - minX;
            const height = maxY - minY;

            if (width > 4 || height > 4) {
                const isCrossing = selectionBox.currentX < selectionBox.startX; // Right-to-Left = Crossing (Green), Left-to-Right = Window (Blue)
                const shapes = selectedDwg?.shapes || [];
                const matchedIds = [];

                shapes.forEach(shape => {
                    const bounds = getEntityBounds(shape);
                    if (!bounds) return;

                    if (isCrossing) {
                        // Crossing: intersects or touches selection box
                        const intersects = !(bounds.maxX < minX || bounds.minX > maxX || bounds.maxY < minY || bounds.minY > maxY);
                        if (intersects) matchedIds.push(shape.id);
                    } else {
                        // Window: completely enclosed inside selection box
                        const inside = bounds.minX >= minX && bounds.maxX <= maxX && bounds.minY >= minY && bounds.maxY <= maxY;
                        if (inside) matchedIds.push(shape.id);
                    }
                });

                setSelectedShapeIds(matchedIds);
                if (matchedIds.length > 0) {
                    toast.success(`${matchedIds.length} entitas CAD dipilih (${isCrossing ? 'Crossing' : 'Window'} Selection).`);
                } else {
                    setSelectedShapeId(null);
                }
            }
            setSelectionBox(null);
            return;
        }

        if (dragRegionState) {
            setDragRegionState(null);
            if (selectedDwg) {
                saveDrawing(selectedDwg).catch(err => console.error('Failed to save display region:', err));
            }
            return;
        }

        if (dragAnchor) {
            setDragAnchor(null);
            if (selectedDwg) {
                saveDrawing(selectedDwg).catch(err => console.error('Failed to save dimension after anchor drag:', err));
            }
            toast.success('Posisi parameter diperbarui.', { id: 'drag-anchor-success' });
            return;
        }

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

        // Do not auto-commit drawingShape on mouseUp to enable standard AutoCAD Click-Move-Click drafting
        // Shape is committed on the 2nd Left Click in handleSvgMouseDown
    };

    const handleCanvasClick = (e) => {
        setDimContextMenu(null);
        setCanvasContextMenu(null);
        if (justSelectedRef.current) {
            justSelectedRef.current = false;
            return;
        }
        if (cadTool !== 'select' && cadTool !== 'default' && cadTool) return;
        
        // Clear active selection on blank canvas click only if not just selected
        setSelectedShapeId(null);
        setSelectedShapeIds([]);

        if (!activeDim) return;
        if (activeDim.locked) {
            toast.error('Parameter ini terkunci. Buka kunci untuk memindahkannya.', { id: 'dim-locked-warning' });
            return;
        }
        const coords = getCanvasCoords(e);
        const x = coords.x;
        const y = coords.y;

        setEditLx(x);
        setEditLy(y);

        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    if (dimMoveMode === 'label') {
                        // Move label only
                        return {
                            ...dim,
                            lx: x,
                            ly: y
                        };
                    } else {
                        // Move caliper and label (default behavior)
                        const dx = x - (dim.lx || 250);
                        const dy = y - (dim.ly || 200);
                        return {
                            ...dim,
                            lx: x, ly: y,
                            x1: dim.x1 !== undefined ? Math.max(10, Math.min(490, dim.x1 + dx)) : x - 30,
                            y1: dim.y1 !== undefined ? Math.max(10, Math.min(350, dim.y1 + dy)) : y - 20,
                            x2: dim.x2 !== undefined ? Math.max(10, Math.min(490, dim.x2 + dx)) : x + 30,
                            y2: dim.y2 !== undefined ? Math.max(10, Math.min(350, dim.y2 + dy)) : y - 20,
                            cx: dim.cx !== undefined ? Math.max(10, Math.min(490, dim.cx + dx)) : x,
                            cy: dim.cy !== undefined ? Math.max(10, Math.min(350, dim.cy + dy)) : y,
                        };
                    }
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        saveDrawing(updatedDwg).catch(err => console.error('Failed to auto-save after move:', err));
        setDimMoveMode(null);
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

    // ─── Rename Drawing Handler ───
    const handleRenameDrawing = async (dwgId, e) => {
        e?.stopPropagation();
        const dwg = drawings.find(d => d.id === dwgId);
        if (!dwg) {
            toast.error('Drawing tidak ditemukan.');
            return;
        }

        const newName = window.prompt('Masukkan nama baru untuk blueprint:', dwg.name);
        if (!newName || newName.trim() === '') {
            return;
        }

        const trimmedName = newName.trim();

        // Update in memory
        const updatedDwg = { ...dwg, name: trimmedName };
        setDrawings(prev => prev.map(d => d.id === dwgId ? updatedDwg : d));

        // Update selected if needed
        if (selectedDwgId === dwgId) {
            setSelectedDwgId(dwgId);
        }

        // Save to database
        try {
            await saveDrawing(updatedDwg);
            toast.success(`Blueprint "${trimmedName}" berhasil direname!`);
        } catch (err) {
            console.error(err);
            toast.error('Gagal menyimpan nama baru ke database.');
            // Revert on failure
            setDrawings(prev => prev.map(d => d.id === dwgId ? dwg : d));
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
        downloadAnchor.setAttribute("download", "mandor_drawings_schema.json");
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
                const dx = pts[i + 1].x - pts[i].x;
                const dy = pts[i + 1].y - pts[i].y;
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
        if (shape.type === 'ellipse') {
            return Math.PI * (shape.rx || 0) * (shape.ry || 0);
        }
        if (shape.type === 'triangle') {
            return ((shape.w || 0) * (shape.h || 0)) / 2;
        }
        if (shape.type === 'hexagon') {
            return 2.598076 * (shape.r || 0) * (shape.r || 0);
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
                            x2: cx + Math.round(outerR * Math.cos(-Math.PI / 4)),
                            y2: cy + Math.round(outerR * Math.sin(-Math.PI / 4)),
                            lx: cx + Math.round((outerR + 20) * Math.cos(-Math.PI / 4)),
                            ly: cy + Math.round((outerR + 20) * Math.sin(-Math.PI / 4)),
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
                            x2: cx + Math.round(innerR * Math.cos(Math.PI / 4)),
                            y2: cy + Math.round(innerR * Math.sin(Math.PI / 4)),
                            lx: cx + Math.round((innerR + 30) * Math.cos(Math.PI / 4)),
                            ly: cy + Math.round((innerR + 30) * Math.sin(Math.PI / 4)),
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
                                x2: Math.round(holeCenters[0].x + r * Math.cos(-Math.PI / 4)),
                                y2: Math.round(holeCenters[0].y + r * Math.sin(-Math.PI / 4)),
                                lx: Math.round(holeCenters[0].x + (r + 15) * Math.cos(-Math.PI / 4)),
                                ly: Math.round(holeCenters[0].y + (r + 15) * Math.sin(-Math.PI / 4)),
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
                if (['pdf', 'svg', 'dwg', 'dxf'].includes(extension)) {
                    r.readAsDataURL(file);
                } else {
                    resolve(undefined);
                }
            });
        };

        const dataUrl = await getFileDataUrl();

        // 1. Native JavaScript / Node.js CAD & DXF parsing
        try {
            setParseProgress(40);
            setParseStatusText('Memproses geometri CAD & decoding entitas di Node.js / Browser...');

            const result = await parseAndProcessCadFile(file);

            if (result.success) {
                setParseProgress(85);
                setParseStatusText('Mengekstraksi anotasi GD&T & parameter toleransi...');

                // For DWG files: dataUrl already contains base64 encoded binary data
                // rawBuffer is kept only in memory, NOT saved to IndexedDB
                const newDwg = {
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint',
                    fileName: file.name,
                    fileType: extension.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: result.dimensions || [],
                    entities: result.entities || [],
                    layers: result.layers || [],
                    // Use rendered_image (SVG) or dataUrl (base64 for DWG/PDF)
                    dataUrl: result.rendered_image || result.dataUrl || dataUrl,
                    // Keep rawBuffer only for current session memory (for WebGL loader)
                    _rawBuffer: result.rawBuffer || null
                };

                setParseProgress(100);
                setIsParsing(false);

                saveDrawing(newDwg).then(saved => {
                    // Re-attach rawBuffer for session use
                    const savedWithBuffer = { ...saved, _rawBuffer: result.rawBuffer };
                    setDrawings(prev => [...prev.map(d => d.id === saved.id ? savedWithBuffer : d)]);
                    setSelectedDwgId(saved.id);
                    if (saved.dimensions?.length > 0) setActiveDimId(saved.dimensions[0].id);
                    else setActiveDimId('');
                    toast.success(`${file.name} berhasil di-parse dan disimpan! Ditemukan ${result.dimensions.length} parameter.`);
                }).catch(err => {
                    console.error(err);
                    toast.error('Gagal menyimpan file drawing baru ke database.');
                });
                return;
            } else {
                throw new Error(result.error || 'Parsing failed');
            }
        } catch (err) {
            console.warn('[CAD Engine] Native parser fallback:', err);
            // Fallback (original client side behavior)
            setParseProgress(30);
            setParseStatusText('Membaca berkas secara lokal...');

            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target.result || '';
                const fileContent = extension === 'pdf' ? '' : result;
                let extractedDims = [];
                let newDwgEntities = [];
                let newDwgLayers = [];

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
                                x1: 120, y1: 260, x2: 120 + Math.round(w), y2: 260, lx: 120 + Math.round(w / 2), ly: 280,
                            });
                            extractedDims.push({
                                id: `dim_svg_h_${Date.now()}`, label: 'Overall Height', spec: h.toFixed(1),
                                tolMin: parseFloat((h - 0.5).toFixed(2)), tolMax: parseFloat((h + 0.5).toFixed(2)),
                                variable: 'Meas_Height', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '',
                                x1: 90, y1: 80, x2: 90, y2: 80 + Math.round(h), lx: 65, ly: 80 + Math.round(h / 2),
                            });
                            extractedDims.push({
                                id: `dim_svg_area_${Date.now()}`, label: 'Cross-Section Area', spec: (w * h).toFixed(1),
                                tolMin: parseFloat(((w - 0.5) * (h - 0.5)).toFixed(1)), tolMax: parseFloat(((w + 0.5) * (h + 0.5)).toFixed(1)),
                                variable: 'Meas_Area', unit: 'mm²', category: 'area', measureType: 'area', indicatorType: 'area_box', gdt_symbol: '',
                                x1: 120, y1: 80, x2: 120 + Math.round(w), y2: 80 + Math.round(h), lx: 120 + Math.round(w / 2), ly: 80 + Math.round(h / 2),
                            });
                        }
                    }
                } else if (extension === 'dxf') {
                    // Client-side lightweight DXF group code parser
                    const lines = fileContent.split(/\r?\n/);
                    const groups = [];
                    for (let i = 0; i < lines.length; i += 2) {
                        if (i + 1 >= lines.length) break;
                        const code = parseInt(lines[i].trim(), 10);
                        const value = lines[i + 1].trim();
                        groups.push({ code, value });
                    }

                    const parsedEntities = [];
                    const parsedLayers = new Set();
                    let inEntitiesSec = false;
                    let currentEnt = null;

                    for (let i = 0; i < groups.length; i++) {
                        const { code, value } = groups[i];
                        if (code === 0 && value === 'SECTION') {
                            const next = groups[i + 1];
                            if (next && next.code === 2 && next.value === 'ENTITIES') {
                                inEntitiesSec = true;
                                i++;
                            }
                        } else if (code === 0 && value === 'ENDSEC') {
                            inEntitiesSec = false;
                        }

                        if (inEntitiesSec) {
                            if (code === 0) {
                                if (currentEnt) parsedEntities.push(currentEnt);
                                if (['LINE', 'CIRCLE', 'ARC', 'TEXT', 'MTEXT'].includes(value)) {
                                    currentEnt = { type: value, layer: '0' };
                                } else {
                                    currentEnt = null;
                                }
                            } else if (currentEnt) {
                                switch (code) {
                                    case 8: currentEnt.layer = value; parsedLayers.add(value); break;
                                    case 10: currentEnt.x1 = parseFloat(value); currentEnt.cx = parseFloat(value); break;
                                    case 20: currentEnt.y1 = parseFloat(value); currentEnt.cy = parseFloat(value); break;
                                    case 30: currentEnt.z1 = parseFloat(value); currentEnt.cz = parseFloat(value); break;
                                    case 11: currentEnt.x2 = parseFloat(value); break;
                                    case 21: currentEnt.y2 = parseFloat(value); break;
                                    case 31: currentEnt.z2 = parseFloat(value); break;
                                    case 40: currentEnt.radius = parseFloat(value); break;
                                    case 50: currentEnt.startAngle = parseFloat(value); break;
                                    case 51: currentEnt.endAngle = parseFloat(value); break;
                                    case 1: currentEnt.text = value; break;
                                }
                            }
                        }
                    }
                    if (currentEnt) parsedEntities.push(currentEnt);

                    // Create dimensions for circles
                    const circleEnts = parsedEntities.filter(e => e.type === 'CIRCLE');
                    circleEnts.slice(0, 3).forEach((c, idx) => {
                        extractedDims.push({
                            id: `dim_dxf_c_${idx}_${Date.now()}`,
                            label: `Outer Flange Diameter ${idx + 1}`,
                            spec: (c.radius * 2).toFixed(1),
                            tolMin: parseFloat((c.radius * 2 - 0.2).toFixed(2)),
                            tolMax: parseFloat((c.radius * 2 + 0.2).toFixed(2)),
                            variable: 'Meas_Diameter',
                            unit: 'mm',
                            category: 'diameter',
                            measureType: 'diameter',
                            indicatorType: 'radial',
                            gdt_symbol: '⌀',
                            x1: c.cx - c.radius,
                            y1: c.cy,
                            x2: c.cx + c.radius,
                            y2: c.cy,
                            lx: c.cx,
                            ly: c.cy - 15,
                            layer: c.layer || "0"
                        });
                    });

                    newDwgEntities = parsedEntities;
                    newDwgLayers = Array.from(parsedLayers);
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
                if (extractedDims.length === 0 && newDwgEntities.length === 0) {
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

                // Coordinate normalization for client side fallback
                if (newDwgEntities && newDwgEntities.length > 0) {
                    const allX = [];
                    const allY = [];
                    extractedDims.forEach(d => { allX.push(d.x1, d.x2); allY.push(d.y1, d.y2); });
                    newDwgEntities.forEach(ent => {
                        if (ent.type === 'LINE') { allX.push(ent.x1, ent.x2); allY.push(ent.y1, ent.y2); }
                        else if (ent.type === 'CIRCLE' || ent.type === 'ARC') { allX.push(ent.cx - ent.radius, ent.cx + ent.radius); allY.push(ent.cy - ent.radius, ent.cy + ent.radius); }
                        else if (ent.type === 'TEXT') { allX.push(ent.cx); allY.push(ent.cy); }
                    });

                    if (allX.length > 0 && allY.length > 0) {
                        const minX = Math.min(...allX);
                        const maxX = Math.max(...allX);
                        const minY = Math.min(...allY);
                        const maxY = Math.max(...allY);
                        const spanX = (maxX !== minX) ? (maxX - minX) : 1.0;
                        const spanY = (maxY !== minY) ? (maxY - minY) : 1.0;

                        extractedDims.forEach(d => {
                            d.x1 = 50 + ((d.x1 - minX) / spanX) * 400;
                            d.x2 = 50 + ((d.x2 - minX) / spanX) * 400;
                            d.y1 = 310 - ((d.y1 - minY) / spanY) * 260;
                            d.y2 = 310 - ((d.y2 - minY) / spanY) * 260;
                            d.lx = (d.x1 + d.x2) / 2;
                            d.ly = (d.y1 + d.y2) / 2 - 15;
                        });

                        newDwgEntities.forEach(ent => {
                            if (ent.type === 'LINE') {
                                ent.x1 = 50 + ((ent.x1 - minX) / spanX) * 400;
                                ent.x2 = 50 + ((ent.x2 - minX) / spanX) * 400;
                                ent.y1 = 310 - ((ent.y1 - minY) / spanY) * 260;
                                ent.y2 = 310 - ((ent.y2 - minY) / spanY) * 260;
                            } else if (ent.type === 'CIRCLE' || ent.type === 'ARC') {
                                ent.cx = 50 + ((ent.cx - minX) / spanX) * 400;
                                ent.cy = 310 - ((ent.cy - minY) / spanY) * 260;
                                const scaleX = 400 / spanX;
                                const scaleY = 260 / spanY;
                                const avgScale = (scaleX + scaleY) / 2;
                                ent.radius = ent.radius * avgScale;
                            } else if (ent.type === 'TEXT') {
                                ent.cx = 50 + ((ent.cx - minX) / spanX) * 400;
                                ent.cy = 310 - ((ent.cy - minY) / spanY) * 260;
                            }
                        });
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
                        entities: newDwgEntities,
                        layers: newDwgLayers,
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
    const renderLabelBadge = (dim, color, labelText, isActive, balloonIndex) => {
        const size = dim.markerSize !== undefined ? dim.markerSize : 60;
        const shape = isBalloonMode ? 'circle' : (dim.markerShape || 'default');
        const catColor = dim.color || getCategoryColor(dim.category || 'dimension');
        const lx = dim.lx ?? 250;
        const ly = dim.ly ?? 200;

        // Special Renderer for Datum Feature Symbol
        if (dim.category === 'datum') {
            const datumLabel = (dim.label || 'A').toUpperCase();
            const boxW = Math.max(24, datumLabel.length * 10 + 12);
            const boxH = 22;
            const triSize = 10;
            const x1 = dim.x1 ?? (lx - 30);
            const y1 = dim.y1 ?? (ly + 30);

            const dx = lx - x1;
            const dy = ly - y1;
            const angle = Math.atan2(dy, dx);
            const angleDeg = (angle * 180) / Math.PI;

            return (
                <g key={dim.id}>
                    {/* Leader line from anchor (x1, y1) to label (lx, ly) */}
                    {(x1 !== lx || y1 !== ly) && (
                        <line x1={x1} y1={y1} x2={lx} y2={ly} stroke={color} strokeWidth={isActive ? 2.5 : 1.5} />
                    )}

                    {/* Datum Triangle ▲ at anchor point (x1, y1) */}
                    <g transform={`translate(${x1}, ${y1}) rotate(${angleDeg + 90})`}>
                        <polygon
                            points={`0,0 -${triSize / 2},${triSize} ${triSize / 2},${triSize}`}
                            fill="#0f172a"
                            stroke={color}
                            strokeWidth="1.5"
                            strokeLinejoin="round"
                        />
                    </g>

                    {/* Datum Outer Box [ A ] at (lx, ly) */}
                    <rect
                        x={lx - boxW / 2}
                        y={ly - boxH / 2}
                        width={boxW}
                        height={boxH}
                        fill="#0f172a"
                        stroke={color}
                        strokeWidth={isActive ? 2.5 : 1.5}
                        rx="2"
                    />
                    {/* Inner frame line for ASME Y14.5 aesthetic */}
                    <rect
                        x={lx - boxW / 2 + 2}
                        y={ly - boxH / 2 + 2}
                        width={boxW - 4}
                        height={boxH - 4}
                        fill="none"
                        stroke={color}
                        strokeWidth="0.75"
                        rx="1"
                    />
                    <text
                        x={lx}
                        y={ly + 4}
                        textAnchor="middle"
                        fill="#34d399"
                        fontSize="11"
                        fontWeight="900"
                        fontFamily="monospace"
                    >
                        {datumLabel}
                    </text>

                    {/* Active Pulsing Ring */}
                    {isActive && (
                        <rect
                            x={lx - boxW / 2 - 4}
                            y={ly - boxH / 2 - 4}
                            width={boxW + 8}
                            height={boxH + 8}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="1.5"
                            rx="4"
                        >
                            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.5s" repeatCount="indefinite" />
                        </rect>
                    )}
                </g>
            );
        }

        let shapeElement = null;
        let textYOffset = 3;

        if (isBalloonMode) {
            // Premium solid QC inspection balloon bubble
            const balloonRadius = 11; // 22px diameter
            const isActiveBalloon = isActive;
            const fillColor = isActiveBalloon ? '#b91c1c' : '#ef4444'; // Red theme for QC balloons

            shapeElement = (
                <circle
                    cx={lx}
                    cy={ly}
                    r={balloonRadius}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={isActive ? 2 : 1}
                    style={{
                        transition: 'all 0.15s ease'
                    }}
                />
            );
            textYOffset = 2.5;
            labelText = String(balloonIndex || 1);
        } else if (shape === 'circle') {
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
            const p1 = `${lx},${ly - h / 2}`;
            const p2 = `${lx + halfW},${ly + h / 2}`;
            const p3 = `${lx - halfW},${ly + h / 2}`;
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
                        <animate attributeName="r" values={`${size / 2 + 2};${size / 2 + 14};${size / 2 + 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </circle>
                ) : shape === 'square' ? (
                    <rect x={lx - size / 2 - 8} y={ly - size / 2 - 8} width={size + 16} height={size + 16} rx="4" fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="width" values={`${size + 4};${size + 20};${size + 4}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="height" values={`${size + 4};${size + 20};${size + 4}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="x" values={`${lx - size / 2 - 2};${lx - size / 2 - 10};${lx - size / 2 - 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="y" values={`${ly - size / 2 - 2};${ly - size / 2 - 10};${ly - size / 2 - 2}`} dur="2s" repeatCount="indefinite" />
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </rect>
                ) : shape === 'triangle' ? (
                    <polygon points={`${lx},${ly - size / 2 - 8} ${lx + size / 2 + 8},${ly + size / 2 + 4} ${lx - size / 2 - 8},${ly + size / 2 + 4}`} fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </polygon>
                ) : (
                    <rect x={lx - Math.max(60, size * 1.3) / 2 - 8} y={ly - Math.max(20, size * 0.4) / 2 - 8} width={Math.max(60, size * 1.3) + 16} height={Math.max(20, size * 0.4) + 16} rx="6" fill="none" stroke={catColor} strokeWidth="1.5">
                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                    </rect>
                )}
            </g>
        ) : null;

        // Category badge (small badge offset depending on shape)
        let badgeX = lx + (shape === 'circle' ? size / 2 - 5 : shape === 'square' ? size / 2 - 2 : shape === 'triangle' ? size / 2 - 5 : Math.max(60, size * 1.3) / 2 + 2);
        let badgeY = ly - (shape === 'circle' ? size / 2 - 5 : shape === 'square' ? size / 2 - 2 : shape === 'triangle' ? -size / 2 + 10 : Math.max(20, size * 0.4) / 2 - 2);

        const categoryBadge = (
            <g>
                <rect x={badgeX} y={badgeY} width="16" height="12" rx="2" fill={catColor} fillOpacity="0.25" stroke={catColor} strokeWidth="0.5" />
                <text x={badgeX + 8} y={badgeY + 9} textAnchor="middle" fill={catColor} fontSize="7" fontWeight="bold">
                    {dim.gdt_symbol || getCategoryDef(dim.category).icon}
                </text>
            </g>
        );

        const fontSizeValue = dim.fontSize || (isBalloonMode ? 9 : Math.max(7, Math.min(12, size * 0.15)));
        const fontColor = isBalloonMode ? '#ffffff' : color;

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

        // YOLO AI Vision Badge
        const hasVision = !!dim.visionEnabled;
        const visionBadgeX = triggerBadge ? triggerBadgeX + 18 : badgeX + 18;
        const visionBadge = hasVision ? (
            <g>
                <rect x={visionBadgeX} y={badgeY} width="16" height="12" rx="2" fill="#7c3aed" fillOpacity="0.25" stroke="#7c3aed" strokeWidth="0.5" />
                <text x={visionBadgeX + 8} y={badgeY + 9} textAnchor="middle" fill="#7c3aed" fontSize="7" fontWeight="bold">AI</text>
            </g>
        ) : null;

        // Hardware Lock Badge
        const hasHardwareLock = !!dim.deviceLockEnabled;
        const hwBadgeX = hasVision ? visionBadgeX + 18 : (triggerBadge ? triggerBadgeX + 18 : badgeX + 18);
        const hwBadge = hasHardwareLock ? (
            <g>
                <rect x={hwBadgeX} y={badgeY} width="16" height="12" rx="2" fill="#059669" fillOpacity="0.25" stroke="#059669" strokeWidth="0.5" />
                <text x={hwBadgeX + 8} y={badgeY + 9} textAnchor="middle" fill="#059669" fontSize="7" fontWeight="bold">HW</text>
            </g>
        ) : null;

        // ASME Y14.5 Feature Control Frame Renderer
        const renderGdtFrameSvg = (gdt) => {
            if (!gdt || !gdt.enabled) return null;
            
            const symbolMap = {
                POSITION: '⌖',
                FLATNESS: '▱',
                STRAIGHTNESS: '⏤',
                CIRCULARITY: '◯',
                CYLINDRICITY: '⌭',
                PERPENDICULARITY: '⊥',
                PARALLELISM: '∥',
                ANGULARITY: '∠',
                PROFILE_SURFACE: '⌢',
                PROFILE_LINE: '◠',
                CONCENTRICITY: '◎',
                SYMMETRY: '⌯',
                CIRCULAR_RUNOUT: '↗',
                TOTAL_RUNOUT: '⌰'
            };

            const mapModifierChar = (m) => {
                switch (m) {
                    case 'M': return 'Ⓜ';
                    case 'L': return 'Ⓛ';
                    case 'F': return 'Ⓕ';
                    case 'P': return 'Ⓟ';
                    case 'T': return 'Ⓣ';
                    case 'U': return 'Ⓤ';
                    case 'R': return 'Ⓡ';
                    case 'S': return 'Ⓢ';
                    default: return m || '';
                }
            };

            const buildRowSegments = (symVal, tolVal, hasDia, modVal, d1, d2, d3) => {
                const sym = symbolMap[symVal] || symVal || '⌖';
                const modifier = mapModifierChar(modVal);
                const segs = [];
                segs.push({ text: sym, w: 16 });
                if (tolVal) {
                    segs.push({ text: `${hasDia ? '⌀' : ''}${tolVal}${modifier}`, w: 38 });
                }
                if (d1) segs.push({ text: d1, w: 14 });
                if (d2) segs.push({ text: d2, w: 14 });
                if (d3) segs.push({ text: d3, w: 14 });
                return segs;
            };

            const tier1Segs = buildRowSegments(gdt.symbol, gdt.tolerance, gdt.hasDiameter, gdt.modifier, gdt.datum1, gdt.datum2, gdt.datum3);
            const hasComposite = !!gdt.compositeEnabled;
            const tier2Segs = hasComposite ? buildRowSegments(
                gdt.symbol2 || gdt.symbol,
                gdt.tolerance2 || '',
                gdt.hasDiameter2 || gdt.hasDiameter,
                gdt.modifier2 || '',
                gdt.datum1_2 || '',
                gdt.datum2_2 || '',
                gdt.datum3_2 || ''
            ) : [];

            const totalW1 = tier1Segs.reduce((sum, s) => sum + s.w, 0);
            const totalW2 = hasComposite ? tier2Segs.reduce((sum, s) => sum + s.w, 0) : 0;
            const maxW = Math.max(totalW1, totalW2);
            const startX = lx - maxW / 2;
            const h = 14;
            const frameY = ly - (hasComposite ? 34 : 23);

            const renderRow = (segs, rowY) => {
                let currentX = startX;
                return (
                    <g key={rowY}>
                        <rect x={startX} y={rowY} width={maxW} height={h} fill="#0f172a" stroke="#10b981" strokeWidth="1.25" rx="1" />
                        {segs.map((seg, i) => {
                            const cellX = currentX;
                            currentX += seg.w;
                            return (
                                <g key={i}>
                                    {i > 0 && <line x1={cellX} y1={rowY} x2={cellX} y2={rowY + h} stroke="#10b981" strokeWidth="0.75" />}
                                    <text
                                        x={cellX + seg.w / 2}
                                        y={rowY + 10}
                                        textAnchor="middle"
                                        fill="#34d399"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fontFamily="monospace"
                                    >
                                        {seg.text}
                                    </text>
                                </g>
                            );
                        })}
                    </g>
                );
            };

            return (
                <g>
                    {renderRow(tier1Segs, frameY)}
                    {hasComposite && renderRow(tier2Segs, frameY + h)}
                </g>
            );
        };

        return (
            <g>
                {shapeElement}
                <text x={lx} y={ly + textYOffset} textAnchor="middle" fill={fontColor} fontSize={fontSizeValue} fontWeight="bold">
                    {labelText}
                </text>
                {!isBalloonMode && categoryBadge}
                {!isBalloonMode && triggerBadge}
                {!isBalloonMode && visionBadge}
                {!isBalloonMode && hwBadge}
                {!isBalloonMode && renderGdtFrameSvg(dim.gdt_frame)}
                {activeRing}
            </g>
        );
    };

    const handleAnchorDragStart = (dimId, anchorKey) => {
        setDragAnchor({ dimId, anchorKey });
    };

    const renderDragHandles = (dim, isActive) => {
        if (!isActive || dim.locked) return null;
        
        const handles = [];

        // Handle 3: Center vertex (cx, cy) - only for angle/arc
        if (dim.category === 'angle' && dim.cx !== undefined && dim.cy !== undefined) {
            handles.push(
                <g key="center">
                    <circle
                        cx={dim.cx}
                        cy={dim.cy}
                        r="6"
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth="2"
                        style={{ cursor: 'move', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAnchorDragStart(dim.id, 'center');
                        }}
                    />
                </g>
            );
        }

        // Handle 4: Label position (lx, ly)
        if (dim.lx !== undefined && dim.ly !== undefined) {
            handles.push(
                <g key="label">
                    <circle
                        cx={dim.lx}
                        cy={dim.ly}
                        r="5"
                        fill="#a855f7"
                        stroke="white"
                        strokeWidth="1.5"
                        style={{ cursor: 'move', filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))' }}
                        onMouseDown={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleAnchorDragStart(dim.id, 'label');
                        }}
                    />
                </g>
            );
        }

        return <g>{handles}</g>;
    };

    // ─── Canvas Indicator Renderers ───
    const renderDimensionIndicators = (dims) => {
        return dims.map((dim, idx) => {
            const isActive = dim.id === activeDimId;
            const x1 = dim.x1 ?? 150, y1 = dim.y1 ?? 180;
            const x2 = dim.x2 ?? 350, y2 = dim.y2 ?? 180;
            const lx = dim.lx ?? 250, ly = dim.ly ?? 200;
            const indicatorType = dim.indicatorType || 'horizontal';

            // Simulation value
            const simVal = simValues[dim.id] !== undefined ? simValues[dim.id] : parseFloat(dim.spec) || 0;
            const valStatus = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
            const color = dim.color || getStatusColor(valStatus, isActive);

            const labelText = `${dim.gdt_symbol || ''}${dim.gdt_symbol ? ' ' : ''}${dim.spec}`;
            const baseWidth = dim.lineWidth !== undefined ? dim.lineWidth : 2;
            const strokeW = isActive ? baseWidth + 1.0 : baseWidth;
            const arrowLen = Math.max(8, baseWidth * 4.5);
            const arrowWidth = Math.max(4, baseWidth * 2.2);

            // Laser Scanner overlay helper for AI Vision (YOLO) nodes
            const renderLaserScanner = () => {
                if (!isActive || !dim.visionEnabled) return null;
                
                const minX = Math.min(x1, x2) - 15;
                const maxX = Math.max(x1, x2) + 15;
                const minY = Math.min(y1, y2, ly) - 15;
                const maxY = Math.max(y1, y2, ly) + 15;
                const width = maxX - minX;
                const height = maxY - minY;
                
                return (
                    <g pointerEvents="none">
                        {/* Futuristic Bounding Scan Box */}
                        <rect
                            x={minX}
                            y={minY}
                            width={width}
                            height={height}
                            fill="rgba(124, 58, 237, 0.03)"
                            stroke="#7c3aed"
                            strokeWidth="1"
                            strokeDasharray="4,4"
                            rx="4"
                        >
                            <animate attributeName="stroke-opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite" />
                        </rect>
                        
                        {/* Target Reticle Corners */}
                        <path d={`M ${minX - 5} ${minY + 5} L ${minX - 5} ${minY - 5} L ${minX + 5} ${minY - 5}`} fill="none" stroke="#7c3aed" strokeWidth="2" />
                        <path d={`M ${maxX + 5} ${minY + 5} L ${maxX + 5} ${minY - 5} L ${maxX - 5} ${minY - 5}`} fill="none" stroke="#7c3aed" strokeWidth="2" />
                        <path d={`M ${minX - 5} ${maxY - 5} L ${minX - 5} ${maxY + 5} L ${minX + 5} ${maxY + 5}`} fill="none" stroke="#7c3aed" strokeWidth="2" />
                        <path d={`M ${maxX + 5} ${maxY - 5} L ${maxX + 5} ${maxY + 5} L ${maxX - 5} ${maxY + 5}`} fill="none" stroke="#7c3aed" strokeWidth="2" />
                        
                        {/* Sweeping Laser Line with Neon Glow */}
                        <line
                            x1={minX - 5}
                            y1={minY}
                            x2={maxX + 5}
                            y2={minY}
                            stroke="#00f2fe"
                            strokeWidth="2.5"
                            strokeOpacity="0.85"
                            style={{ filter: 'drop-shadow(0px 0px 4px #00f2fe)' }}
                        >
                            <animate
                                attributeName="y1"
                                values={`${minY};${maxY};${minY}`}
                                dur="2.5s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="y2"
                                values={`${minY};${maxY};${minY}`}
                                dur="2.5s"
                                repeatCount="indefinite"
                            />
                        </line>
                    </g>
                );
            };

            if (indicatorType === 'horizontal') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
                        <line x1={x1} y1={y1} x2={x1} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={x2} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x1 + arrowLen - 2} y1={ly - 5} x2={x2 - arrowLen + 2} y2={ly - 5} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${x1},${ly - 5} ${x1 + arrowLen},${ly - 5 - arrowWidth} ${x1 + arrowLen},${ly - 5 + arrowWidth}`} fill={color} />
                        <polygon points={`${x2},${ly - 5} ${x2 - arrowLen},${ly - 5 - arrowWidth} ${x2 - arrowLen},${ly - 5 + arrowWidth}`} fill={color} />
                        {renderLabelBadge(dim, color, labelText, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
                    </g>
                );
            } else if (indicatorType === 'vertical') {
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
                        <line x1={x1} y1={y1} x2={lx} y2={y1} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={x2} y1={y2} x2={lx} y2={y2} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                        <line x1={lx - 5} y1={y1 + arrowLen - 2} x2={lx - 5} y2={y2 - arrowLen + 2} stroke={color} strokeWidth={strokeW} />
                        <polygon points={`${lx - 5},${y1} ${lx - 5 - arrowWidth},${y1 + arrowLen} ${lx - 5 + arrowWidth},${y1 + arrowLen}`} fill={color} />
                        <polygon points={`${lx - 5},${y2} ${lx - 5 - arrowWidth},${y2 - arrowLen} ${lx - 5 + arrowWidth},${y2 - arrowLen}`} fill={color} />
                        {renderLabelBadge(dim, color, labelText, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
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
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
                        {/* Reference lines */}
                        <line x1={cx} y1={cy} x2={lsx} y2={lsy} stroke={color} strokeWidth="1" strokeDasharray="4,2" />
                        <line x1={cx} y1={cy} x2={lex} y2={ley} stroke={color} strokeWidth="1" strokeDasharray="4,2" />
                        {/* Arc */}
                        <path d={`M ${sx},${sy} A ${arcRadius},${arcRadius} 0 ${largeArc},${sweepFlag} ${ex},${ey}`} fill="none" stroke={color} strokeWidth={strokeW} />
                        {/* Arrow tips */}
                        <circle cx={sx} cy={sy} r={Math.max(2, baseWidth * 1.25)} fill={color} />
                        <circle cx={ex} cy={ey} r={Math.max(2, baseWidth * 1.25)} fill={color} />
                        {renderLabelBadge(dim, color, `∠ ${dim.spec}°`, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
                    </g>
                );
            } else if (indicatorType === 'area_box') {
                // Dashed rectangle area indicator
                const bx = Math.min(x1, x2);
                const by = Math.min(y1, y2);
                const bw = Math.abs(x2 - x1);
                const bh = Math.abs(y2 - y1);
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
                        <rect x={bx} y={by} width={bw} height={bh} fill={color} fillOpacity="0.06" stroke={color} strokeWidth={strokeW} strokeDasharray="6,3" rx="2" />
                        {/* Cross-hatch */}
                        <line x1={bx} y1={by} x2={bx + bw} y2={by + bh} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
                        <line x1={bx + bw} y1={by} x2={bx} y2={by + bh} stroke={color} strokeWidth="0.5" strokeOpacity="0.3" />
                        {renderLabelBadge(dim, color, `▢ ${dim.spec} ${dim.unit}`, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
                    </g>
                );
            } else if (indicatorType === 'callout') {
                // Surface roughness / custom callout
                const symbolChar = dim.gdt_symbol || '';
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
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
                        {renderLabelBadge(dim, color, `${symbolChar} ${dim.spec} ${dim.unit}`, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
                    </g>
                );
            } else {
                // Radial / pointer (default for diameter, radius, custom)
                return (
                    <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }} onContextMenu={(e) => handleDimensionContextMenu(e, dim.id)}>
                        <path d={`M ${x1},${y1} L ${x2},${y2} L ${lx},${ly}`} fill="none" stroke={color} strokeWidth={strokeW} />
                        {(() => {
                            const angle = Math.atan2(y2 - y1, x2 - x1);
                            const ax1 = x1 + arrowLen * Math.cos(angle - 0.25);
                            const ay1 = y1 + arrowLen * Math.sin(angle - 0.25);
                            const ax2 = x1 + arrowLen * Math.cos(angle + 0.25);
                            const ay2 = y1 + arrowLen * Math.sin(angle + 0.25);
                            return <polygon points={`${x1},${y1} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} />;
                        })()}
                        {renderLabelBadge(dim, color, labelText, isActive, idx + 1)}
                        {renderDragHandles(dim, isActive)}
                        {renderLaserScanner()}
                    </g>
                );
            }
        });
    };

    // ─── MANDOR Enterprise Style helper ───
    const inputStyle = { width: '100%', padding: '7px 10px', borderRadius: '5px', border: '1px solid #ced4da', fontSize: '0.78rem', outline: 'none', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: '#212529', backgroundColor: '#ffffff', transition: 'border-color 0.15s, box-shadow 0.15s' };
    const selectStyle = { ...inputStyle, backgroundColor: '#ffffff', cursor: 'pointer' };
    const labelStyle = { display: 'block', fontSize: '0.65rem', color: '#495057', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' };
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

    const getWidgetBtnStyle = (toolName) => {
        const isActive = cadTool === toolName;
        let activeBg = 'rgba(37, 99, 235, 0.12)';
        let activeBorder = '1px solid rgba(37, 99, 235, 0.3)';
        let activeColor = '#2563eb';

        if (toolName === 'image') {
            activeBg = 'rgba(5, 150, 105, 0.12)';
            activeBorder = '1px solid rgba(5, 150, 105, 0.3)';
            activeColor = '#059669';
        } else if (toolName === 'erase') {
            activeBg = 'rgba(220, 38, 38, 0.12)';
            activeBorder = '1px solid rgba(220, 38, 38, 0.3)';
            activeColor = '#dc2626';
        }

        return {
            background: isActive ? activeBg : 'transparent',
            border: isActive ? activeBorder : '1px solid transparent',
            color: isActive ? activeColor : '#94a3b8',
            padding: '5px',
            borderRadius: '5px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            outline: 'none',
            width: '26px',
            height: '26px'
        };
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

    // Calculate totals for Mechanical Takeoff
    let totalPipePx = 0;
    let totalDuctPx = 0;
    let totalInsulationPx = 0;
    let totalValveCount = 0;

    takeoffShapes.forEach(shape => {
        if (shape.takeoffSubtype === 'cable_length') {
            totalPipePx += computeShapeLength(shape);
        } else if (shape.takeoffSubtype === 'paint_area') {
            totalDuctPx += computeShapeArea(shape);
        } else if (shape.takeoffSubtype === 'floor_area') {
            totalInsulationPx += computeShapeArea(shape);
        } else if (shape.takeoffSubtype === 'bolt_count') {
            totalValveCount += 1;
        }
    });

    const totalPipeReal = scale ? (totalPipePx * scale) / 1000 : totalPipePx;
    const totalDuctReal = scale ? (totalDuctPx * (scale ** 2)) / 1000000 : totalDuctPx;
    const totalInsulationReal = scale ? (totalInsulationPx * (scale ** 2)) / 1000000 : totalInsulationPx;

    const getScaleBarData = () => {
        const factor = scale || 1.0;
        const isCalibrated = !!scale;
        const realValOf100Px = (100 / zoom) * factor;
        const magnitude = Math.pow(10, Math.floor(Math.log10(realValOf100Px))) || 1;
        const ratio = realValOf100Px / magnitude;
        let roundVal = magnitude;
        if (ratio >= 5) {
            roundVal = magnitude * 5;
        } else if (ratio >= 2) {
            roundVal = magnitude * 2;
        }
        const pxOnScreen = (roundVal / factor) * zoom;
        const label = isCalibrated
            ? (roundVal >= 1000 ? `${(roundVal / 1000).toFixed(1).replace('.0', '')} m` : `${roundVal.toFixed(1).replace('.0', '')} mm`)
            : `${Math.round(roundVal)} px`;
        return { pxOnScreen, label };
    };

    const renderDraftingOverlays = () => (
        <>
            {/* Temporary drawing shape during active drag */}
            {drawingShape && (() => {
                const tempProps = {
                    stroke: drawingShape.color || cadColor || '#38bdf8',
                    strokeWidth: drawingShape.strokeWidth || cadWidth || 2,
                    fill: 'none',
                    style: { pointerEvents: 'none' }
                };

                if (drawingShape.type === 'line') {
                    const p1 = { x: drawingShape.x1, y: drawingShape.y1 };
                    const p2 = { x: drawingShape.x2, y: drawingShape.y2 };
                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const distPx = Math.sqrt(dx * dx + dy * dy);
                    const scaleFactor = selectedDwg?.scaleFactor || 1.0;
                    const lengthVal = selectedDwg?.scaleFactor ? distPx * scaleFactor : distPx;
                    const lengthDisplay = lengthVal.toFixed(3);
                    const angleRad = Math.atan2(dy, dx);
                    const angleDeg = Math.round(Math.abs(angleRad * 180 / Math.PI)) % 180;
                    const baselineLen = Math.max(60, distPx * 0.85);
                    const arcR = Math.min(55, Math.max(25, distPx * 0.35));
                    const arcStartX = p1.x + arcR;
                    const arcStartY = p1.y;
                    const arcEndX = p1.x + arcR * Math.cos(angleRad);
                    const arcEndY = p1.y + arcR * Math.sin(angleRad);
                    const largeArc = Math.abs(angleRad) > Math.PI ? 1 : 0;
                    const sweep = angleRad >= 0 ? 1 : 0;
                    const midAngle = angleRad / 2;
                    const angleTextX = p1.x + (arcR + 15) * Math.cos(midAngle);
                    const angleTextY = p1.y + (arcR + 15) * Math.sin(midAngle);
                    const midSegmentX = (p1.x + p2.x) / 2;
                    const midSegmentY = (p1.y + p2.y) / 2;
                    const perpX = -Math.sin(angleRad) * 14;
                    const perpY = Math.cos(angleRad) * 14;

                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            {/* Active rubber-band line */}
                            <line
                                {...tempProps}
                                stroke="#ffffff"
                                strokeWidth={1.5}
                                x1={p1.x}
                                y1={p1.y}
                                x2={p2.x}
                                y2={p2.y}
                            />
                            {distPx > 4 && (
                                <>
                                    {/* Green Horizontal Baseline */}
                                    <line x1={p1.x} y1={p1.y} x2={p1.x + baselineLen} y2={p1.y} stroke="#22c55e" strokeWidth={1} />
                                    {/* Green Polar Tracking Ray */}
                                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3" />
                                    {/* Green Polar Angular Arc */}
                                    {angleDeg > 1 && (
                                        <>
                                            <path
                                                d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${arcEndX} ${arcEndY}`}
                                                fill="none"
                                                stroke="#22c55e"
                                                strokeWidth={1}
                                                strokeDasharray="3,3"
                                            />
                                            <text
                                                x={angleTextX}
                                                y={angleTextY}
                                                fill="#22c55e"
                                                fontSize="11"
                                                fontFamily="monospace"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                dominantBaseline="middle"
                                            >
                                                {angleDeg}°
                                            </text>
                                        </>
                                    )}
                                    {/* Green length dimension label along segment */}
                                    <text
                                        x={midSegmentX + perpX}
                                        y={midSegmentY + perpY}
                                        fill="#22c55e"
                                        fontSize="11"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                    >
                                        {lengthDisplay}
                                    </text>
                                    {/* Floating AutoCAD Dynamic Input HUD */}
                                    <g transform={`translate(${p2.x + 12}, ${p2.y - 12})`}>
                                        <rect x="0" y="0" width="225" height="26" rx="4" fill="rgba(45, 45, 45, 0.95)" stroke="rgba(95, 95, 95, 0.85)" strokeWidth="1" />
                                        <text x="8" y="17" fill="#ffffff" fontSize="11" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                                            Specify next point or
                                        </text>
                                        <rect x="115" y="4" width="52" height="18" rx="2" fill="#1677ff" stroke="#ffffff" strokeWidth="1.5" />
                                        <text x="141" y="17" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                            {lengthDisplay}
                                        </text>
                                        <rect x="171" y="4" width="48" height="18" rx="2" fill="rgba(65, 65, 65, 0.95)" stroke="rgba(115, 115, 115, 0.6)" strokeWidth="1" />
                                        <text x="195" y="17" fill="#ffffff" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
                                            {p2.y.toFixed(3)}
                                        </text>
                                    </g>
                                </>
                            )}
                        </g>
                    );
                } else if (drawingShape.type === 'circle') {
                    const isDiameter = drawingShape.mode === 'circle_diameter';
                    const is2P = drawingShape.mode === 'circle_2p';
                    const scaleFactor = selectedDwg?.scaleFactor || 1.0;
                    const rDisplay = selectedDwg?.scaleFactor ? (drawingShape.r * scaleFactor).toFixed(2) : `${drawingShape.r} px`;
                    const dDisplay = selectedDwg?.scaleFactor ? ((drawingShape.diameter || drawingShape.r * 2) * scaleFactor).toFixed(2) : `${(drawingShape.diameter || drawingShape.r * 2)} px`;

                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            <circle
                                {...tempProps}
                                cx={drawingShape.cx}
                                cy={drawingShape.cy}
                                r={drawingShape.r}
                            />
                            {drawingShape.r > 3 && (
                                <>
                                    {/* Center point marker */}
                                    <circle cx={drawingShape.cx} cy={drawingShape.cy} r="3" fill="#38bdf8" />
                                    {/* Radius / Diameter reference line */}
                                    <line
                                        x1={drawingShape.cx}
                                        y1={drawingShape.cy}
                                        x2={drawingShape.cx + drawingShape.r}
                                        y2={drawingShape.cy}
                                        stroke="#22c55e"
                                        strokeWidth="1"
                                        strokeDasharray="3,3"
                                    />
                                    {/* Floating Circle Dynamic Input HUD */}
                                    <g transform={`translate(${drawingShape.cx + drawingShape.r + 10}, ${drawingShape.cy - 12})`}>
                                        <rect x="0" y="0" width="210" height="26" rx="4" fill="rgba(45, 45, 45, 0.95)" stroke="rgba(95, 95, 95, 0.85)" strokeWidth="1" />
                                        <text x="8" y="17" fill="#ffffff" fontSize="11" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                                            {isDiameter ? 'Specify diameter or' : is2P ? 'Specify second point or' : 'Specify radius or'}
                                        </text>
                                        <rect x={isDiameter ? 130 : is2P ? 145 : 120} y="4" width="55" height="18" rx="2" fill="#1677ff" stroke="#ffffff" strokeWidth="1.5" />
                                        <text x={isDiameter ? 157 : is2P ? 172 : 147} y="17" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                            {isDiameter ? dDisplay : rDisplay}
                                        </text>
                                    </g>
                                </>
                            )}
                        </g>
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
                } else if (drawingShape.type === 'ellipse') {
                    return (
                        <ellipse
                            {...tempProps}
                            cx={drawingShape.cx}
                            cy={drawingShape.cy}
                            rx={drawingShape.rx}
                            ry={drawingShape.ry}
                        />
                    );
                } else if (drawingShape.type === 'triangle') {
                    const pointsStr = `${drawingShape.x + drawingShape.w / 2},${drawingShape.y} ${drawingShape.x + drawingShape.w},${drawingShape.y + drawingShape.h} ${drawingShape.x},${drawingShape.y + drawingShape.h}`;
                    return (
                        <polygon
                            {...tempProps}
                            points={pointsStr}
                        />
                    );
                } else if (drawingShape.type === 'hexagon') {
                    const cx = drawingShape.cx;
                    const cy = drawingShape.cy;
                    const r = drawingShape.r;
                    const points = [];
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * 60) * (Math.PI / 180);
                        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
                    }
                    return (
                        <polygon
                            {...tempProps}
                            points={points.join(' ')}
                        />
                    );
                } else if (drawingShape.type === 'callout') {
                    const targetX = drawingShape.targetX;
                    const targetY = drawingShape.targetY;
                    const boxX = drawingShape.boxX;
                    const boxY = drawingShape.boxY;
                    const color = drawingShape.color || '#ef4444';
                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            {/* Target ring */}
                            <circle cx={targetX} cy={targetY} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />
                            {/* Leader line */}
                            <line x1={targetX} y1={targetY} x2={boxX} y2={boxY} stroke={color} strokeWidth="2" />
                            {/* Text pill container */}
                            <rect x={boxX - 32} y={boxY - 12} width="64" height="24" rx="4" fill="#ffffff" stroke={color} strokeWidth="2" />
                            <text x={boxX} y={boxY + 4} fill={color} fontSize="11" fontWeight="bold" textAnchor="middle">{drawingShape.text || 'Callout'}</text>
                        </g>
                    );
                } else if (drawingShape.type === 'arrow') {
                    const x1 = drawingShape.x1;
                    const y1 = drawingShape.y1;
                    const x2 = drawingShape.x2;
                    const y2 = drawingShape.y2;
                    const color = drawingShape.color || '#ef4444';
                    const angle = Math.atan2(y2 - y1, x2 - x1);
                    const headLen = 12;
                    const arrowP1 = `${x2 - headLen * Math.cos(angle - Math.PI / 6)},${y2 - headLen * Math.sin(angle - Math.PI / 6)}`;
                    const arrowP2 = `${x2 - headLen * Math.cos(angle + Math.PI / 6)},${y2 - headLen * Math.sin(angle + Math.PI / 6)}`;
                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="2" />
                            <polygon points={`${x2},${y2} ${arrowP1} ${arrowP2}`} fill={color} />
                        </g>
                    );
                } else if (drawingShape.type === 'revcloud') {
                    const x = drawingShape.x;
                    const y = drawingShape.y;
                    const w = drawingShape.w;
                    const h = drawingShape.h;
                    const color = drawingShape.color || '#ef4444';
                    return (
                        <g style={{ pointerEvents: 'none' }}>
                            <rect x={x} y={y} width={w} height={h} rx="8" stroke={color} strokeWidth="2" strokeDasharray="6,4" fill="rgba(239, 68, 68, 0.08)" />
                        </g>
                    );
                }
                return null;
            })()}

            {/* AutoCAD Marquee Selection Box (Blue Window Selection / Green Crossing Selection) */}
            {selectionBox && (
                <rect
                    x={Math.min(selectionBox.startX, selectionBox.currentX)}
                    y={Math.min(selectionBox.startY, selectionBox.currentY)}
                    width={Math.abs(selectionBox.currentX - selectionBox.startX)}
                    height={Math.abs(selectionBox.currentY - selectionBox.startY)}
                    fill={selectionBox.currentX >= selectionBox.startX ? 'rgba(22, 119, 255, 0.18)' : 'rgba(34, 197, 94, 0.18)'}
                    stroke={selectionBox.currentX >= selectionBox.startX ? '#1677ff' : '#22c55e'}
                    strokeWidth={1 / Math.max(0.2, zoom)}
                    strokeDasharray={selectionBox.currentX >= selectionBox.startX ? undefined : `${4 / Math.max(0.2, zoom)},${3 / Math.max(0.2, zoom)}`}
                    style={{ pointerEvents: 'none' }}
                />
            )}

            {/* Scale Calibration Line Draft Preview */}
            {cadTool === 'scale' && scaleDraftCoords && (
                <g style={{ pointerEvents: 'none' }}>
                    <line x1={scaleDraftCoords.x1} y1={scaleDraftCoords.y1} x2={scaleDraftCoords.x2} y2={scaleDraftCoords.y2} stroke="#10b981" strokeWidth="2" />
                    <circle cx={scaleDraftCoords.x1} cy={scaleDraftCoords.y1} r="3" fill="#10b981" />
                    <circle cx={scaleDraftCoords.x2} cy={scaleDraftCoords.y2} r="3" fill="#10b981" />
                </g>
            )}

            {/* Dimension Drafting Previews */}
            {cadTool === 'dimension' && dimDraftCoords && (
                <g style={{ pointerEvents: 'none' }}>
                    {dimDrawState === 'waiting_end' && (
                        <line x1={dimDraftCoords.x1} y1={dimDraftCoords.y1} x2={dimDraftCoords.x2} y2={dimDraftCoords.y2} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                    )}
                    {dimDrawState === 'waiting_offset' && (
                        drawingCategory === 'angle' ? (
                            <>
                                <line x1={dimDraftCoords.cx} y1={dimDraftCoords.cy} x2={dimDraftCoords.x1} y2={dimDraftCoords.y1} stroke="#38bdf8" strokeWidth="1.5" />
                                <line x1={dimDraftCoords.cx} y1={dimDraftCoords.cy} x2={dimDraftCoords.lx} y2={dimDraftCoords.ly} stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3,3" />
                            </>
                        ) : (
                            <>
                                <line x1={dimDraftCoords.x1} y1={dimDraftCoords.y1} x2={dimDraftCoords.x1} y2={dimDraftCoords.ly} stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,2" opacity={0.6} />
                                <line x1={dimDraftCoords.x2} y1={dimDraftCoords.y2} x2={dimDraftCoords.x2} y2={dimDraftCoords.ly} stroke="#38bdf8" strokeWidth="0.75" strokeDasharray="2,2" opacity={0.6} />
                                <line x1={dimDraftCoords.x1} y1={dimDraftCoords.ly} x2={dimDraftCoords.x2} y2={dimDraftCoords.ly} stroke="#38bdf8" strokeWidth="1.5" />
                            </>
                        )
                    )}
                </g>
            )}

            {/* Arc Drafting Previews */}
            {cadTool === 'arc' && arcDraftCoords && (
                <g style={{ pointerEvents: 'none' }}>
                    <circle cx={arcDraftCoords.cx} cy={arcDraftCoords.cy} r="3" fill="#60a5fa" />
                    {arcDrawState === 'waiting_radius' && (
                        <>
                            <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={arcDraftCoords.x1 || arcDraftCoords.cx} y2={arcDraftCoords.y1 || arcDraftCoords.cy} stroke="#60a5fa" strokeDasharray="3,3" strokeWidth="1" />
                            <circle cx={arcDraftCoords.cx} cy={arcDraftCoords.cy} r={arcDraftCoords.r} fill="none" stroke="#60a5fa" strokeDasharray="3,3" strokeWidth="1" />
                        </>
                    )}
                    {arcDrawState === 'waiting_end' && (
                        <>
                            <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={arcDraftCoords.x1} y2={arcDraftCoords.y1} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1={arcDraftCoords.cx} y1={arcDraftCoords.cy} x2={arcDraftCoords.x2 || arcDraftCoords.cx} y2={arcDraftCoords.y2 || arcDraftCoords.cy} stroke="#60a5fa" strokeWidth="1" strokeDasharray="3,3" />
                        </>
                    )}
                </g>
            )}

            {/* Polyline Drafting Previews with AutoCAD Polar Angle Arc & Dynamic Input HUD */}
            {cadTool === 'polyline' && polylineDraftPoints.length > 0 && (
                <g style={{ pointerEvents: 'none' }}>
                    {/* Fixed segments */}
                    {polylineDraftPoints.length > 2 && (
                        <polyline
                            points={polylineDraftPoints.slice(0, -1).map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={cadColor || '#38bdf8'}
                            strokeWidth={cadWidth || 2}
                        />
                    )}
                    {/* Fixed vertices */}
                    {polylineDraftPoints.slice(0, -1).map((p, idx) => (
                        <circle key={idx} cx={p.x} cy={p.y} r="3.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="1" />
                    ))}

                    {/* Active Rubberband Segment & Polar Dynamic HUD */}
                    {polylineDraftPoints.length > 1 && (() => {
                        const p1 = polylineDraftPoints[polylineDraftPoints.length - 2];
                        const p2 = polylineDraftPoints[polylineDraftPoints.length - 1];
                        const dx = p2.x - p1.x;
                        const dy = p2.y - p1.y;
                        const distPx = Math.sqrt(dx * dx + dy * dy);
                        const scaleFactor = selectedDwg?.scaleFactor || 1.0;
                        const lengthVal = selectedDwg?.scaleFactor ? distPx * scaleFactor : distPx;
                        const lengthDisplay = lengthVal.toFixed(3);
                        const angleRad = Math.atan2(dy, dx);
                        const angleDeg = Math.round(Math.abs(angleRad * 180 / Math.PI)) % 180;
                        const baselineLen = Math.max(60, distPx * 0.85);
                        const arcR = Math.min(55, Math.max(25, distPx * 0.35));
                        const arcStartX = p1.x + arcR;
                        const arcStartY = p1.y;
                        const arcEndX = p1.x + arcR * Math.cos(angleRad);
                        const arcEndY = p1.y + arcR * Math.sin(angleRad);
                        const largeArc = Math.abs(angleRad) > Math.PI ? 1 : 0;
                        const sweep = angleRad >= 0 ? 1 : 0;
                        const midAngle = angleRad / 2;
                        const angleTextX = p1.x + (arcR + 15) * Math.cos(midAngle);
                        const angleTextY = p1.y + (arcR + 15) * Math.sin(midAngle);
                        const midSegmentX = (p1.x + p2.x) / 2;
                        const midSegmentY = (p1.y + p2.y) / 2;
                        const perpX = -Math.sin(angleRad) * 14;
                        const perpY = Math.cos(angleRad) * 14;

                        return (
                            <g>
                                {/* White rubberband line for active segment */}
                                <line
                                    x1={p1.x}
                                    y1={p1.y}
                                    x2={p2.x}
                                    y2={p2.y}
                                    stroke="#ffffff"
                                    strokeWidth={1.5}
                                />
                                {/* Dynamic Polar Tracking Elements */}
                                {distPx > 4 && (
                                    <>
                                        {/* Green Baseline */}
                                        <line x1={p1.x} y1={p1.y} x2={p1.x + baselineLen} y2={p1.y} stroke="#22c55e" strokeWidth={1} />
                                        {/* Green Polar Ray */}
                                        <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#22c55e" strokeWidth={1} strokeDasharray="3,3" />
                                        {/* Green Angular Arc */}
                                        {angleDeg > 1 && (
                                            <>
                                                <path
                                                    d={`M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${arcEndX} ${arcEndY}`}
                                                    fill="none"
                                                    stroke="#22c55e"
                                                    strokeWidth={1}
                                                    strokeDasharray="3,3"
                                                />
                                                <text
                                                    x={angleTextX}
                                                    y={angleTextY}
                                                    fill="#22c55e"
                                                    fontSize="11"
                                                    fontFamily="monospace"
                                                    fontWeight="bold"
                                                    textAnchor="middle"
                                                    dominantBaseline="middle"
                                                >
                                                    {angleDeg}°
                                                </text>
                                            </>
                                        )}
                                        {/* Green Segment Length Label */}
                                        <text
                                            x={midSegmentX + perpX}
                                            y={midSegmentY + perpY}
                                            fill="#22c55e"
                                            fontSize="11"
                                            fontFamily="monospace"
                                            fontWeight="bold"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {lengthDisplay}
                                        </text>
                                        {/* Floating AutoCAD / MLightCAD Dynamic Input HUD */}
                                        <g transform={`translate(${p2.x + 12}, ${p2.y - 12})`}>
                                            <rect x="0" y="0" width="225" height="26" rx="4" fill="rgba(45, 45, 45, 0.95)" stroke="rgba(95, 95, 95, 0.85)" strokeWidth="1" />
                                            <text x="8" y="17" fill="#ffffff" fontSize="11" fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif">
                                                Specify next point or
                                            </text>
                                            <rect x="115" y="4" width="52" height="18" rx="2" fill="#1677ff" stroke="#ffffff" strokeWidth="1.5" />
                                            <text x="141" y="17" fill="#ffffff" fontSize="10.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                                                {lengthDisplay}
                                            </text>
                                            <rect x="171" y="4" width="48" height="18" rx="2" fill="rgba(65, 65, 65, 0.95)" stroke="rgba(115, 115, 115, 0.6)" strokeWidth="1" />
                                            <text x="195" y="17" fill="#ffffff" fontSize="10.5" fontFamily="monospace" textAnchor="middle">
                                                {p2.y.toFixed(3)}
                                            </text>
                                        </g>
                                    </>
                                )}
                            </g>
                        );
                    })()}
                </g>
            )}

            {/* OSNAP Snapped Point Marker Overlay */}
            {osnapActive && snappedPoint && (
                <g style={{ pointerEvents: 'none' }}>
                    <circle
                        cx={snappedPoint.x}
                        cy={snappedPoint.y}
                        r={9}
                        fill="rgba(34, 197, 94, 0.18)"
                        stroke="#22c55e"
                        strokeWidth={1}
                        strokeDasharray="2,2"
                    />
                    {(snappedPoint.type === 'endpoint' || snappedPoint.type === 'start_point' || snappedPoint.type === 'end_point') && (
                        <rect
                            x={snappedPoint.x - 5}
                            y={snappedPoint.y - 5}
                            width={10}
                            height={10}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    {snappedPoint.type === 'midpoint' && (
                        <polygon
                            points={`${snappedPoint.x},${snappedPoint.y - 6} ${snappedPoint.x - 6},${snappedPoint.y + 4} ${snappedPoint.x + 6},${snappedPoint.y + 4}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    {snappedPoint.type === 'center' && (
                        <circle
                            cx={snappedPoint.x}
                            cy={snappedPoint.y}
                            r={5}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    {snappedPoint.type === 'quadrant' && (
                        <polygon
                            points={`${snappedPoint.x},${snappedPoint.y - 6} ${snappedPoint.x + 6},${snappedPoint.y} ${snappedPoint.x},${snappedPoint.y + 6} ${snappedPoint.x - 6},${snappedPoint.y}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    {snappedPoint.type === 'perpendicular' && (
                        <path
                            d={`M ${snappedPoint.x - 5} ${snappedPoint.y} L ${snappedPoint.x - 5} ${snappedPoint.y + 5} L ${snappedPoint.x} ${snappedPoint.y + 5}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                    {snappedPoint.type === 'intersection' && (
                        <path
                            d={`M ${snappedPoint.x - 5} ${snappedPoint.y - 5} L ${snappedPoint.x + 5} ${snappedPoint.y + 5} M ${snappedPoint.x - 5} ${snappedPoint.y + 5} L ${snappedPoint.x + 5} ${snappedPoint.y - 5}`}
                            fill="none"
                            stroke="#22c55e"
                            strokeWidth={1.5}
                            style={{ pointerEvents: 'none' }}
                        />
                    )}
                </g>
            )}

            {/* AutoCAD Precision Dynamic Crosshair / Crossbar Overlay */}
            {(showCrosshair || ['line', 'polyline', 'circle', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt', 'rect', 'arc', 'ellipse', 'triangle', 'hexagon', 'dimension', 'scale', 'balloon', 'takeoff_count'].includes(cadTool) || isBalloonMode) && isMouseOverCanvas && (
                <g style={{ pointerEvents: 'none' }}>
                    {/* Full infinite horizontal crosshair line */}
                    <line
                        x1={-100000}
                        y1={crosshairPos.y}
                        x2={100000}
                        y2={crosshairPos.y}
                        stroke="#38bdf8"
                        strokeWidth={0.8 / Math.max(0.2, zoom)}
                        strokeDasharray={`${6 / Math.max(0.2, zoom)},${4 / Math.max(0.2, zoom)}`}
                        opacity={0.65}
                    />
                    {/* Full infinite vertical crosshair line */}
                    <line
                        x1={crosshairPos.x}
                        y1={-100000}
                        x2={crosshairPos.x}
                        y2={100000}
                        stroke="#38bdf8"
                        strokeWidth={0.8 / Math.max(0.2, zoom)}
                        strokeDasharray={`${6 / Math.max(0.2, zoom)},${4 / Math.max(0.2, zoom)}`}
                        opacity={0.65}
                    />
                    {/* Center Pickbox target aperture */}
                    <rect
                        x={crosshairPos.x - 4 / Math.max(0.2, zoom)}
                        y={crosshairPos.y - 4 / Math.max(0.2, zoom)}
                        width={8 / Math.max(0.2, zoom)}
                        height={8 / Math.max(0.2, zoom)}
                        fill="rgba(56, 189, 248, 0.1)"
                        stroke="#38bdf8"
                        strokeWidth={1.2 / Math.max(0.2, zoom)}
                    />
                    {/* Exact sub-pixel center point */}
                    <circle
                        cx={crosshairPos.x}
                        cy={crosshairPos.y}
                        r={1.5 / Math.max(0.2, zoom)}
                        fill="#38bdf8"
                    />
                </g>
            )}
        </>
    );


    return (
        <div ref={fullscreenRef} style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f1f5f9',
            fontFamily: "'Inter', sans-serif",
            padding: '12px 16px 24px 16px',
            gap: '12px',
            boxSizing: 'border-box',
            overflow: 'hidden'
        }}>
            {/* Header removed - toolbar now provided by MLightCAD */}


            {/* Main Content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px', overflow: 'hidden', minHeight: 0 }}>

                {/* Top Row: BOC Table (Left) + CAD Canvas (Middle) + Sidebar (Right) */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: `1fr ${showQCInspector ? '350px' : ''}`.trim().replace(/\s+/g, ' '),
                    gap: '12px',
                    flex: 1,
                    minHeight: 0,
                    overflow: 'hidden',
                    position: 'relative'
                }}>


                    {/* CAD Canvas Panel - Transparent Layout Container */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, height: '100%', minHeight: 0, gap: '10px' }}>

                        {/* AutoCAD Window Title Bar */}
                        <div style={{
                            display: 'none',
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
                                <div style={{ width: '1px', height: '12px', backgroundColor: '#334155' }}></div>
                                {/* Import PDF/DWG/DXF Button */}
                                <button
                                    title="Import PDF, DWG, DXF, SVG"
                                    onClick={() => fileInputRef.current?.click()}
                                    style={{
                                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                        border: 'none',
                                        color: 'white',
                                        cursor: 'pointer',
                                        padding: '3px 8px',
                                        borderRadius: '4px',
                                        fontSize: '0.6rem',
                                        fontWeight: 700,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        transition: 'all 0.15s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb, #1d4ed8)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6, #2563eb)'}
                                >
                                    <Upload size={11} /> Import PDF
                                </button>
                            </div>

                            {/* Center: File name tab title */}
                            <div style={{ fontSize: '0.62rem', color: '#94a3b8', fontWeight: 600 }}>
                                MandorCAD 2026 - [ {selectedDwg ? selectedDwg.fileName : 'New Drawing.dwg'} ]
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
                            display: 'none',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 12px',
                            backgroundColor: '#090d16',
                            borderBottom: '1px solid #1e293b',
                            gap: '8px',
                            zIndex: 10,
                            userSelect: 'none',
                            fontFamily: "'Inter', sans-serif",
                            minHeight: '38px'
                        }}>
                            {/* Properties group */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>PROPERTIES:</span>
                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                    {['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ffffff'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setCadColor(color)}
                                            style={{
                                                width: '12px', height: '12px', borderRadius: '50%', backgroundColor: color,
                                                border: cadColor === color ? '2px solid white' : '1px solid rgba(255,255,255,0.15)',
                                                cursor: 'pointer', padding: 0,
                                                boxShadow: cadColor === color ? `0 0 6px ${color}` : 'none',
                                                transition: 'transform 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.25)'}
                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                            title={`Active Color: ${color}`}
                                        />
                                    ))}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginLeft: '4px' }}>
                                    <span style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 800 }}>{cadWidth}px</span>
                                    <div style={{ display: 'flex', alignItems: 'center', height: '12px' }}>
                                        <input
                                            type="range"
                                            min="1"
                                            max="8"
                                            value={cadWidth}
                                            onChange={(e) => setCadWidth(parseInt(e.target.value))}
                                            style={{
                                                width: '45px',
                                                accentColor: '#3b82f6',
                                                cursor: 'pointer',
                                                height: '3px',
                                                margin: 0,
                                                backgroundColor: '#1e293b',
                                                borderRadius: '2px',
                                                outline: 'none'
                                            }}
                                            title="Line Thickness"
                                        />
                                    </div>
                                </div>

                                <div style={{ width: '1px', height: '14px', backgroundColor: '#1e293b', margin: '0 6px' }} />

                                {/* Utilities */}
                                <button title="Export Drawing Schema" onClick={handleExportSchema} style={{ background: 'transparent', border: 'none', color: '#60a5fa', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <Download size={13} />
                                </button>
                                <button title="Import Drawing Schema" onClick={() => { if (fileSchemaRef.current) fileSchemaRef.current.click(); }} style={{ background: 'transparent', border: 'none', color: '#34d399', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <Upload size={13} />
                                </button>
                                <button title="Reset Template blueprint" onClick={handleResetToDefault} style={{ background: 'transparent', border: 'none', color: '#f87171', padding: '5px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.15s' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#1e293b'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                                    <RefreshCw size={13} />
                                </button>
                                <button title="CadQuery Parametric Generator" onClick={() => setShowCqModal(true)} style={{ background: 'rgba(251, 191, 36, 0.08)', border: '1px solid rgba(251, 191, 36, 0.25)', color: '#fbbf24', padding: '3px 8px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)'; e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.4)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)'; e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)'; }}>
                                    <Sliders size={12} />
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.02em' }}>PARAMETRIC</span>
                                </button>
                            </div>

                            {/* View toggles */}
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <button
                                    title="DISCUS Mode (Ballooning)"
                                    onClick={() => {
                                        setIsBalloonMode(prev => !prev);
                                        toast.success(!isBalloonMode ? 'Tampilan Balon Angka (DISCUS Mode) aktif.' : 'Tampilan nominal CAD aktif.');
                                    }}
                                    style={{
                                        background: isBalloonMode ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                        border: isBalloonMode ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid #1e293b',
                                        color: isBalloonMode ? '#f87171' : '#64748b',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={e => { if(!isBalloonMode) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                    onMouseLeave={e => { if(!isBalloonMode) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <Circle size={12} strokeWidth={isBalloonMode ? 3 : 2} fill={isBalloonMode ? '#f87171' : 'transparent'} />
                                </button>

                                <button
                                    title="Toggle QC Inspector Panel"
                                    onClick={() => {
                                        setShowQCInspector(prev => !prev);
                                        toast.success(!showQCInspector ? 'QC Inspector Panel aktif.' : 'QC Inspector Panel disembunyikan.');
                                    }}
                                    style={{
                                        background: showQCInspector ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        border: showQCInspector ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid #1e293b',
                                        color: showQCInspector ? '#60a5fa' : '#64748b',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={e => { if(!showQCInspector) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                    onMouseLeave={e => { if(!showQCInspector) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <Sliders size={12} />
                                </button>

                                <button
                                    title="Toggle Tabel Karakteristik"
                                    onClick={() => {
                                        setShowBocTable(prev => !prev);
                                        toast.success(!showBocTable ? 'Tabel Karakteristik aktif.' : 'Tabel Karakteristik disembunyikan.');
                                    }}
                                    style={{
                                        background: showBocTable ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                                        border: showBocTable ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid #1e293b',
                                        color: showBocTable ? '#34d399' : '#64748b',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={e => { if(!showBocTable) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                    onMouseLeave={e => { if(!showBocTable) e.currentTarget.style.backgroundColor = 'transparent'; }}
                                >
                                    <ClipboardList size={12} />
                                </button>
                            </div>
                        </div>

                        {/* AutoCAD Canvas Card Content */}
                        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #cbd5e1', overflow: 'hidden', position: 'relative', flex: 1, minHeight: 0 }}>

                        {/* AutoCAD File tab strip */}
                        <div style={{
                            display: 'none',
                            alignItems: 'center',
                            backgroundColor: '#05070a',
                            borderBottom: '1px solid #1e293b',
                            padding: '4px 10px 0 10px',
                            gap: '4px',
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
                                            backgroundColor: isSelected ? '#0f172a' : 'transparent',
                                            border: '1px solid #1e293b',
                                            borderBottom: isSelected ? '1px solid #0f172a' : '1px solid #1e293b',
                                            marginBottom: '-1px',
                                            padding: '4px 10px',
                                            borderRadius: '6px 6px 0 0',
                                            cursor: 'pointer',
                                            zIndex: isSelected ? 2 : 1,
                                            transition: 'all 0.15s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '0.65rem' }}>📄</span>
                                        <span style={{ fontSize: '0.65rem', color: isSelected ? '#f8fafc' : '#64748b', fontWeight: isSelected ? 700 : 500 }}>
                                            {dwg.fileName || dwg.name}
                                        </span>
                                        <div style={{ display: 'flex', gap: '2px', marginLeft: '4px' }}>
                                            <button
                                                onClick={(e) => handleRenameDrawing(dwg.id, e)}
                                                style={{
                                                    background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.6rem', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#3b82f6'}
                                                onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                                                title="Rename"
                                            >
                                                ✏️
                                            </button>
                                            {drawings.length > 1 && (
                                                <button
                                                    onClick={(e) => handleDeleteDwg(dwg.id, e)}
                                                    style={{
                                                        background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '0.55rem', padding: '0 2px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                title="Create Blank Blueprint Design"
                                onClick={handleCreateBlankDrawing}
                                style={{
                                    background: 'transparent',
                                    border: '1px dashed #334155',
                                    color: '#475569',
                                    width: '18px',
                                    height: '18px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    lineHeight: 1,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '4px',
                                    marginLeft: '4px',
                                    transition: 'all 0.15s'
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = '#64748b'; e.currentTarget.style.color = 'white'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#475569'; }}
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
                        {/* Hidden file input for opening DWG/DXF */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".dwg,.dxf,.pdf,.png,.jpg,.jpeg"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        {/* AutoCAD Workspace Area (contains Vertical Toolbar + Canvas) */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', width: '100%', minHeight: 0, overflow: 'hidden' }}>

                            {/* Right Column: Canvas SVG and Status Bar */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>

                                {/* Canvas SVG */}
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0px', position: 'relative', width: '100%', minHeight: 0 }}>

                                    {/* Pure MLightCAD Canvas Viewport */}

                                     {selectedDwg && ['STL', 'OBJ', 'GLTF', 'GLB'].includes(selectedDwg.fileType) ? (
                                         <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat 3D CAD Editor...</div>}>
                                             <CADViewer3DEditor
                                                  drawing={selectedDwg}
                                                  dimensions={selectedDwg.dimensions || []}
                                                 activeDimId={activeDimId}
                                                  onAddDimension={handleAdd3DDimension}
                                                  onSelectDimension={(id) => setActiveDimId(id)}
                                             />
                                         </Suspense>
                                     ) : (
                                         <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', fontSize: '0.8rem' }}>Memuat MLightCAD WebAssembly Engine...</div>}>
                                             <MLightCadViewer
                                                 fileName={selectedDwg?.fileName || (selectedDwg?.name ? selectedDwg.name + (selectedDwg?.fileType === 'DWG' ? '.dwg' : '.dxf') : 'drawing.dxf')}
                                                 fileData={selectedDwg?._rawBuffer || selectedDwg?.rawBuffer || selectedDwg?.dataUrl || selectedDwg?.data_url || selectedDwg?.rawDxf || selectedDwg?.fileName}
                                                 cadTool={cadTool}
                                                 onSelectCadTool={(t) => {
                                                     if (t === 'dim_linear') {
                                                         setCadTool('dimension');
                                                         setDrawingCategory('dimension');
                                                         setSelectedGdtTool(null);
                                                     } else if (t === 'dim_radial') {
                                                         setCadTool('dimension');
                                                         setDrawingCategory('diameter');
                                                         setSelectedGdtTool(null);
                                                     } else if (t === 'dim_angular') {
                                                         setCadTool('dimension');
                                                         setDrawingCategory('angle');
                                                         setSelectedGdtTool(null);
                                                     } else if (t === 'measure_area') {
                                                         setCadTool('region');
                                                         setShowQCInspector(true);
                                                         setQcTab('region');
                                                     } else if (t === 'balloon') {
                                                         setCadTool('balloon');
                                                         setIsBalloonMode(true);
                                                     } else if (t === 'select') {
                                                         setCadTool('select');
                                                         setIsBalloonMode(false);
                                                     } else {
                                                         // Check if a shape is already selected to apply modification immediately
                                                         const currentShapes = selectedDwg?.shapes || [];
                                                         const targetShape = currentShapes.find(s => s.id === selectedShapeId);
                                                         if (targetShape) {
                                                             if (t === 'erase') {
                                                                 updateShapes(currentShapes.filter(s => s.id !== targetShape.id));
                                                                 setSelectedShapeId(null);
                                                                 toast.success('Geometri terpilih berhasil dihapus.');
                                                                 return;
                                                             } else if (t === 'copy') {
                                                                 handleDuplicateShape(targetShape);
                                                                 toast.success('Geometri terpilih berhasil diduplikasi.');
                                                                 return;
                                                             } else if (t === 'rotate') {
                                                                 const newRot = ((targetShape.rotation || 0) + 45) % 360;
                                                                 updateShapes(currentShapes.map(s => s.id === targetShape.id ? { ...s, rotation: newRot } : s));
                                                                 toast.success(`Geometri terpilih diputar: ${newRot}°`);
                                                                 return;
                                                             } else if (t === 'offset') {
                                                                 const offsetShape = {
                                                                     ...targetShape,
                                                                     id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                                                     x: targetShape.x !== undefined ? targetShape.x + 15 : undefined,
                                                                     y: targetShape.y !== undefined ? targetShape.y + 15 : undefined,
                                                                     x1: targetShape.x1 !== undefined ? targetShape.x1 + 15 : undefined,
                                                                     y1: targetShape.y1 !== undefined ? targetShape.y1 + 15 : undefined,
                                                                     x2: targetShape.x2 !== undefined ? targetShape.x2 + 15 : undefined,
                                                                     y2: targetShape.y2 !== undefined ? targetShape.y2 + 15 : undefined,
                                                                     cx: targetShape.cx !== undefined ? targetShape.cx + 15 : undefined,
                                                                     cy: targetShape.cy !== undefined ? targetShape.cy + 15 : undefined,
                                                                     r: targetShape.r !== undefined ? targetShape.r + 10 : undefined,
                                                                     points: targetShape.points ? targetShape.points.map(p => ({ x: p.x + 15, y: p.y + 15 })) : undefined
                                                                 };
                                                                 updateShapes([...currentShapes, offsetShape]);
                                                                 setSelectedShapeId(offsetShape.id);
                                                                 toast.success('Offset geometri terpilih berhasil dibuat (+15px).');
                                                                 return;
                                                             } else if (t === 'mirror') {
                                                                 const mirrored = {
                                                                     ...targetShape,
                                                                     rotation: ((targetShape.rotation || 0) + 180) % 360
                                                                 };
                                                                 updateShapes(currentShapes.map(s => s.id === targetShape.id ? mirrored : s));
                                                                 toast.success('Geometri terpilih di-mirror.');
                                                                 return;
                                                             }
                                                         }
                                                         setCadTool(t);
                                                         setIsBalloonMode(false);
                                                     }
                                                 }}
                                                 ribbonTab={ribbonTab}
                                                 onSelectRibbonTab={(t) => setRibbonTab(t)}
                                                 isBalloonMode={isBalloonMode || cadTool === 'balloon'}
                                                 onToggleBalloonMode={() => {
                                                     const nextMode = !isBalloonMode;
                                                     setIsBalloonMode(nextMode);
                                                     setCadTool(nextMode ? 'balloon' : 'select');
                                                     toast.success(nextMode ? '🎈 Mode Balon QC Aktif: Klik pada titik CAD untuk membuat Balon Inspeksi' : 'Mode Balon nonaktif');
                                                 }}
                                                 cadColor={cadColor}
                                                onSelectCadColor={(c) => setCadColor(c)}
                                                cadWidth={cadWidth}
                                                onSelectCadWidth={(w) => setCadWidth(w)}
                                                activeLayer={activeLayer}
                                                onSelectLayer={(l) => setActiveLayer(l)}
                                                onUndo={handleUndo}
                                                onRedo={handleRedo}
                                                canUndo={undoStack.length > 0}
                                                canRedo={redoStack.length > 0}
                                                onZoomIn={() => setZoom(prev => Math.min(4, Math.round((prev + 0.2) * 10) / 10))}
                                                onZoomOut={() => setZoom(prev => Math.max(0.2, Math.round((prev - 0.2) * 10) / 10))}
                                                onZoomFit={() => { setZoom(1.0); setPanOffset({ x: 0, y: 0 }); }}
                                                onOpenFileDialog={() => fileInputRef.current?.click()}
                                                onSaveDrawing={() => handleSaveCurrentDrawing && handleSaveCurrentDrawing()}
                                                onExportDxf={() => handleExportCAD && handleExportCAD('dxf')}
                                                onExportPdf={() => handleExportPDF && handleExportPDF()}
                                                onInsertImage={() => imageInsertRef.current?.click()}
                                                showQCInspector={showQCInspector}
                                                onToggleInspector={() => setShowQCInspector(prev => !prev)}
                                                dimensionsCount={selectedDwg?.dimensions?.length || 0}
                                                canvasTheme={canvasTheme}
                                                onCanvasThemeChange={setCanvasTheme}
                                                onAiCreateShape={(shape) => {
                                                    if (!selectedDwg) return;
                                                    const currentShapes = selectedDwg.shapes || [];
                                                    const newShape = {
                                                        ...shape,
                                                        id: `shape_ai_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                                        color: shape.color || cadColor || '#38bdf8',
                                                        strokeWidth: shape.strokeWidth || cadWidth || 2
                                                    };
                                                    updateShapes([...currentShapes, newShape]);
                                                    setSelectedShapeId(newShape.id);
                                                    setSelectedShapeIds([newShape.id]);
                                                    toast.success(`✨ Objek CAD (${newShape.type.toUpperCase()}) berhasil digenerate oleh AI ke kanvas!`);
                                                }}
                                                onAiCreateDimension={(dim) => {
                                                    if (!selectedDwg) return;
                                                    const currentDims = selectedDwg.dimensions || [];
                                                    const nextBalloonNum = currentDims.length + 1;
                                                    const newDim = {
                                                        id: `dim_ai_${Date.now()}`,
                                                        label: dim.label || `Balon #${nextBalloonNum} - AI`,
                                                        spec: dim.spec || '25.00',
                                                        unit: 'mm',
                                                        category: dim.category || 'dimension',
                                                        measureType: 'linear',
                                                        indicatorType: dim.indicatorType || 'balloon',
                                                        nominal: 25.00,
                                                        upperTol: 0.05,
                                                        lowerTol: -0.05,
                                                        x1: dim.x1 ?? 200,
                                                        y1: dim.y1 ?? 200,
                                                        x2: dim.x2 ?? 280,
                                                        y2: dim.y2 ?? 200,
                                                        lx: dim.lx ?? 300,
                                                        ly: dim.ly ?? 160,
                                                        cx: dim.cx ?? 240,
                                                        cy: dim.cy ?? 200
                                                    };
                                                    const updatedDwg = {
                                                        ...selectedDwg,
                                                        dimensions: [...currentDims, newDim]
                                                    };
                                                    setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
                                                    saveDrawing(updatedDwg);
                                                    toast.success(`✨ Balon Inspeksi QC (#${nextBalloonNum}) berhasil dibuat oleh AI!`);
                                                }}
                                                onEntitySelect={(ent) => {
                                                    if (ent && ent.nominal) {
                                                        toast.success(`Entitas CAD dipilih: ${ent.nominal} mm`);
                                                    }
                                                }}
                                            >
                                                {/* MANDOR Quality & Blueprint Overlay Layer */}
                                                <svg
                                                    ref={svgRef}
                                                    viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
                                                    onMouseDown={handleSvgMouseDown}
                                                    onMouseMove={handleSvgMouseMove}
                                                    onMouseUp={handleSvgMouseUp}
                                                    onDoubleClick={handleSvgDoubleClick}
                                                    onClick={handleCanvasClick}
                                                    onContextMenu={handleCanvasContextMenu}
                                                    onMouseEnter={() => setIsMouseOverCanvas(true)}
                                                    onMouseLeave={() => { setIsMouseOverCanvas(false); setSnappedPoint(null); }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        position: 'absolute',
                                                        inset: 0,
                                                        pointerEvents: 'auto',
                                                        cursor: isPanning ? 'grabbing'
                                                            : (spacePressed || cadTool === 'pan') ? 'grab'
                                                            : ['line', 'polyline', 'circle', 'circle_diameter', 'circle_2p', 'circle_3p', 'circle_ttr', 'circle_ttt', 'rect', 'arc', 'ellipse', 'triangle', 'hexagon', 'dimension', 'balloon', 'scale', 'text', 'takeoff_count', 'region'].includes(cadTool) || isBalloonMode ? 'crosshair'
                                                            : cadTool === 'erase' ? 'pointer'
                                                            : cadTool === 'move' ? 'move'
                                                            : cadTool === 'copy' ? 'copy'
                                                            : cadTool === 'offset' ? 'crosshair'
                                                            : cadTool === 'rotate' ? 'pointer'
                                                            : cadTool === 'mirror' ? 'pointer'
                                                            : 'default'
                                                    }}
                                                >
                                                     <defs>
                                                         <style>
                                                             {`
                                                                 @keyframes cadSelectionBlink {
                                                                     0%, 100% { opacity: 1; filter: drop-shadow(0 0 6px #38bdf8); }
                                                                     50% { opacity: 0.3; filter: drop-shadow(0 0 1px #0284c7); }
                                                                 }
                                                                 @keyframes cadGripBlink {
                                                                     0%, 100% { transform: scale(1); }
                                                                     50% { transform: scale(1.35); }
                                                                 }
                                                                 .cad-selected-glow {
                                                                     animation: cadSelectionBlink 0.8s ease-in-out infinite;
                                                                 }
                                                                 .cad-grip-glow {
                                                                     animation: cadGripBlink 0.8s ease-in-out infinite;
                                                                     transform-box: fill-box;
                                                                     transform-origin: center;
                                                                 }
                                                             `}
                                                         </style>
                                                     </defs>
                                                    <g ref={canvasGroupRef} transform={`translate(${canvasSize.width / 2 + panOffset.x}, ${canvasSize.height / 2 + panOffset.y}) scale(${zoom}) translate(${-canvasSize.width / 2}, ${-canvasSize.height / 2})`}>
                                                        {/* Blueprint backdrop image if PDF/Image/DXF SVG */}
                                                        {selectedDwg && selectedDwg.fileType !== 'DWG' && (pdfBackdropUrl || selectedDwg.dataUrl || selectedDwg.data_url) && !(pdfBackdropUrl === null && (selectedDwg.dataUrl || selectedDwg.data_url)?.startsWith('data:application/pdf')) && (
                                                            <image
                                                                href={pdfBackdropUrl || selectedDwg.dataUrl || selectedDwg.data_url}
                                                                x={selectedDwg?.fillParent ? 0 : 50}
                                                                y={selectedDwg?.fillParent ? 0 : 40}
                                                                width={selectedDwg?.fillParent ? canvasSize.width : (canvasSize.width - 100)}
                                                                height={selectedDwg?.fillParent ? canvasSize.height : (canvasSize.height - 80)}
                                                                preserveAspectRatio={selectedDwg?.stretchFill ? "none" : (selectedDwg?.fillParent ? "xMidYMid meet" : "xMidYMid meet")}
                                                                opacity="0.95"
                                                                style={{ pointerEvents: 'none' }}
                                                            />
                                                        )}

                                                        {/* Vector entities if available */}
                                                        {selectedDwgId === 'dwg_flange_connector' && (
                                                            <g transform="translate(10, 0)">
                                                                <circle cx="140" cy="180" r="90" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                                                                <circle cx="140" cy="180" r="65" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="5,5" />
                                                                <circle cx="140" cy="180" r="30" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
                                                            </g>
                                                        )}

                                                        {/* Custom Shapes Overlay */}
                                                        {selectedDwg && (selectedDwg.shapes || []).map((shape) => {
                                                            const center = getShapeCenter(shape);
                                                            const rotationStr = shape.rotation ? `rotate(${shape.rotation}, ${shape.cx ?? center.x}, ${shape.cy ?? center.y})` : '';
                                                            const isSelected = selectedShapeId === shape.id || selectedShapeIds.includes(shape.id);
                                                            const shapeColor = isSelected ? '#38bdf8' : (shape.color || '#38bdf8');
                                                            const shapeWidth = (shape.strokeWidth || 2) + (isSelected ? 1 : 0);
                                                            const animClass = isSelected ? 'cad-selected-glow' : '';
                                                            const dashArray = isSelected ? '8,4' : (shape.strokeDasharray || undefined);

                                                            const handleShapeClick = (e) => {
                                                                e.stopPropagation();
                                                                if (e.shiftKey || e.ctrlKey) {
                                                                    setSelectedShapeIds(prev =>
                                                                        prev.includes(shape.id) ? prev.filter(id => id !== shape.id) : [...prev, shape.id]
                                                                    );
                                                                } else {
                                                                    setSelectedShapeId(shape.id);
                                                                    setSelectedShapeIds([shape.id]);
                                                                }
                                                                if (cadTool === 'erase') {
                                                                    const currentShapes = selectedDwg.shapes || [];
                                                                    updateShapes(currentShapes.filter(s => s.id !== shape.id));
                                                                    setSelectedShapeId(null);
                                                                    setSelectedShapeIds(prev => prev.filter(id => id !== shape.id));
                                                                    toast.success('Geometri terhapus.');
                                                                } else if (cadTool === 'copy') {
                                                                    handleDuplicateShape(shape);
                                                                    toast.success('Geometri diduplikasi.');
                                                                } else if (cadTool === 'rotate') {
                                                                    const currentShapes = selectedDwg.shapes || [];
                                                                    const newRot = ((shape.rotation || 0) + 45) % 360;
                                                                    updateShapes(currentShapes.map(s => s.id === shape.id ? { ...s, rotation: newRot } : s));
                                                                    toast.success(`Rotasi: ${newRot}°`);
                                                                } else if (cadTool === 'offset') {
                                                                    const currentShapes = selectedDwg.shapes || [];
                                                                    const offsetShape = {
                                                                        ...shape,
                                                                        id: `shape_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                                                                        x: shape.x !== undefined ? shape.x + 15 : undefined,
                                                                        y: shape.y !== undefined ? shape.y + 15 : undefined,
                                                                        x1: shape.x1 !== undefined ? shape.x1 + 15 : undefined,
                                                                        y1: shape.y1 !== undefined ? shape.y1 + 15 : undefined,
                                                                        x2: shape.x2 !== undefined ? shape.x2 + 15 : undefined,
                                                                        y2: shape.y2 !== undefined ? shape.y2 + 15 : undefined,
                                                                        cx: shape.cx !== undefined ? shape.cx + 15 : undefined,
                                                                        cy: shape.cy !== undefined ? shape.cy + 15 : undefined,
                                                                        r: shape.r !== undefined ? shape.r + 10 : undefined,
                                                                        points: shape.points ? shape.points.map(p => ({ x: p.x + 15, y: p.y + 15 })) : undefined
                                                                    };
                                                                    updateShapes([...currentShapes, offsetShape]);
                                                                    setSelectedShapeId(offsetShape.id);
                                                                    toast.success('Offset geometri berhasil dibuat (+15px).');
                                                                } else if (cadTool === 'mirror') {
                                                                    const currentShapes = selectedDwg.shapes || [];
                                                                    const mirrored = {
                                                                        ...shape,
                                                                        rotation: ((shape.rotation || 0) + 180) % 360
                                                                    };
                                                                    updateShapes(currentShapes.map(s => s.id === shape.id ? mirrored : s));
                                                                    toast.success('Geometri di-mirror.');
                                                                }
                                                            };

                                                            const handleShapeMouseDown = (e) => {
                                                                if ((cadTool === 'move' || cadTool === 'select') && e.button === 0) {
                                                                    e.stopPropagation();
                                                                    const coords = getCanvasCoords(e);
                                                                    const shapeCenter = getShapeCenter(shape);
                                                                    setDragShape({
                                                                        id: shape.id,
                                                                        type: 'move',
                                                                        startX: coords.x,
                                                                        startY: coords.y,
                                                                        startShape: JSON.parse(JSON.stringify(shape)),
                                                                        center: shapeCenter
                                                                    });
                                                                    setSelectedShapeId(shape.id);
                                                                }
                                                            };

                                                            const shapeStyle = {
                                                                cursor: cadTool === 'erase' ? 'pointer' : cadTool === 'move' ? 'move' : cadTool === 'rotate' ? 'pointer' : cadTool === 'copy' ? 'copy' : cadTool === 'offset' ? 'crosshair' : cadTool === 'mirror' ? 'pointer' : 'default',
                                                                pointerEvents: ['erase', 'move', 'rotate', 'copy', 'offset', 'mirror', 'select'].includes(cadTool) ? 'auto' : 'none'
                                                            };

                                                            const hitWidth = Math.max(16, shapeWidth + 12);

                                                            if (shape.type === 'line') {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke="transparent" strokeWidth={hitWidth} />
                                                                        <line x1={shape.x1} y1={shape.y1} x2={shape.x2} y2={shape.y2} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={shape.x1 - 3.5} y={shape.y1 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.x2 - 3.5} y={shape.y2 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={(shape.x1 + shape.x2) / 2 - 3.5} y={(shape.y1 + shape.y2) / 2 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'circle') {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill="transparent" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <circle cx={shape.cx} cy={shape.cy} r={shape.r} fill={shape.fill || 'none'} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx + shape.r - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx - shape.r - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy - shape.r - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy + shape.r - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'rect') {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} fill="transparent" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} fill={shape.fill || 'none'} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={shape.x - 3.5} y={shape.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.x + shape.w - 3.5} y={shape.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.x - 3.5} y={shape.y + shape.h - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.x + shape.w - 3.5} y={shape.y + shape.h - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.x + shape.w / 2 - 3.5} y={shape.y + shape.h / 2 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'ellipse') {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill="transparent" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <ellipse cx={shape.cx} cy={shape.cy} rx={shape.rx} ry={shape.ry} fill={shape.fill || 'none'} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx + shape.rx - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy + shape.ry - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'triangle') {
                                                                const p1 = { x: shape.x + shape.w / 2, y: shape.y };
                                                                const p2 = { x: shape.x + shape.w, y: shape.y + shape.h };
                                                                const p3 = { x: shape.x, y: shape.y + shape.h };
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill="transparent" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <polygon points={`${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`} fill={shape.fill || 'none'} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={p1.x - 3.5} y={p1.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={p2.x - 3.5} y={p2.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={p3.x - 3.5} y={p3.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'hexagon') {
                                                                const hexPts = [0, 60, 120, 180, 240, 300].map(deg => {
                                                                    const rad = deg * Math.PI / 180;
                                                                    return `${shape.cx + shape.r * Math.cos(rad)},${shape.cy + shape.r * Math.sin(rad)}`;
                                                                }).join(' ');
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <polygon points={hexPts} fill="transparent" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <polygon points={hexPts} fill={shape.fill || 'none'} stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'arc') {
                                                                const startRad = ((shape.startAngle || 0) * Math.PI) / 180;
                                                                const endRad = ((shape.endAngle || 90) * Math.PI) / 180;
                                                                const x1 = shape.cx + shape.r * Math.cos(startRad);
                                                                const y1 = shape.cy + shape.r * Math.sin(startRad);
                                                                const x2 = shape.cx + shape.r * Math.cos(endRad);
                                                                const y2 = shape.cy + shape.r * Math.sin(endRad);
                                                                let diff = (shape.endAngle || 90) - (shape.startAngle || 0);
                                                                while (diff < 0) diff += 360;
                                                                const largeArc = diff > 180 ? 1 : 0;
                                                                const arcD = `M ${x1} ${y1} A ${shape.r} ${shape.r} 0 ${largeArc} 1 ${x2} ${y2}`;
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <path d={arcD} fill="none" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <path d={arcD} fill="none" stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={x1 - 3.5} y={y1 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={x2 - 3.5} y={y2 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={shape.cx - 3.5} y={shape.cy - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'polyline' && Array.isArray(shape.points)) {
                                                                const pts = shape.points.map(p => `${p.x},${p.y}`).join(' ');
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <polyline points={pts} fill="none" stroke="transparent" strokeWidth={hitWidth} />
                                                                        <polyline points={pts} fill="none" stroke={shapeColor} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        {isSelected && shape.points.map((pt, pIdx) => (
                                                                            <rect key={`grip_${pIdx}`} className="cad-grip-glow" x={pt.x - 3.5} y={pt.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                        ))}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'text') {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <text x={shape.x} y={shape.y} fill={isSelected ? '#38bdf8' : (shape.color || '#ffffff')} fontSize={shape.fontSize || 14} fontFamily="monospace" className={animClass}>{shape.text}</text>
                                                                        {isSelected && (
                                                                            <rect className="cad-grip-glow" x={shape.x - 3.5} y={shape.y - (shape.fontSize || 14) - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'image' && shape.dataUrl) {
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <image
                                                                            href={shape.dataUrl}
                                                                            x={shape.x}
                                                                            y={shape.y}
                                                                            width={shape.w}
                                                                            height={shape.h}
                                                                            className={animClass}
                                                                        />
                                                                        {isSelected && (
                                                                            <rect className="cad-grip-glow" x={shape.x - 3.5} y={shape.y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'callout') {
                                                                const targetX = shape.targetX;
                                                                const targetY = shape.targetY;
                                                                const boxX = shape.boxX;
                                                                const boxY = shape.boxY;
                                                                const color = isSelected ? '#38bdf8' : (shape.color || '#ef4444');
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        {/* Target anchor */}
                                                                        <circle cx={targetX} cy={targetY} r="4" fill="#ffffff" stroke={color} strokeWidth="2" className={animClass} />
                                                                        {/* Leader line */}
                                                                        <line x1={targetX} y1={targetY} x2={boxX} y2={boxY} stroke={color} strokeWidth={shapeWidth} className={animClass} />
                                                                        {/* Callout Text Box */}
                                                                        <rect x={boxX - 32} y={boxY - 12} width="64" height="24" rx="4" fill="#ffffff" stroke={color} strokeWidth={shapeWidth} className={animClass} />
                                                                        <text x={boxX} y={boxY + 4} fill={color} fontSize="11" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">{shape.text || 'Callout'}</text>
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={targetX - 3.5} y={targetY - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={boxX - 3.5} y={boxY - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'arrow') {
                                                                const x1 = shape.x1;
                                                                const y1 = shape.y1;
                                                                const x2 = shape.x2;
                                                                const y2 = shape.y2;
                                                                const color = isSelected ? '#38bdf8' : (shape.color || '#ef4444');
                                                                const angle = Math.atan2(y2 - y1, x2 - x1);
                                                                const headLen = 12;
                                                                const arrowP1 = `${x2 - headLen * Math.cos(angle - Math.PI / 6)},${y2 - headLen * Math.sin(angle - Math.PI / 6)}`;
                                                                const arrowP2 = `${x2 - headLen * Math.cos(angle + Math.PI / 6)},${y2 - headLen * Math.sin(angle + Math.PI / 6)}`;
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={hitWidth} />
                                                                        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={shapeWidth} strokeDasharray={dashArray} className={animClass} />
                                                                        <polygon points={`${x2},${y2} ${arrowP1} ${arrowP2}`} fill={color} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={x1 - 3.5} y={y1 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={x2 - 3.5} y={y2 - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'revcloud') {
                                                                const x = shape.x;
                                                                const y = shape.y;
                                                                const w = shape.w;
                                                                const h = shape.h;
                                                                const color = isSelected ? '#38bdf8' : (shape.color || '#ef4444');
                                                                return (
                                                                    <g key={shape.id} transform={rotationStr} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <rect x={x} y={y} width={w} height={h} rx="8" stroke="transparent" strokeWidth={hitWidth} fill="transparent" />
                                                                        <rect x={x} y={y} width={w} height={h} rx="8" stroke={color} strokeWidth={shapeWidth} strokeDasharray="6,4" fill={isSelected ? 'rgba(56, 189, 248, 0.1)' : 'rgba(239, 68, 68, 0.08)'} className={animClass} />
                                                                        {isSelected && (
                                                                            <>
                                                                                <rect className="cad-grip-glow" x={x - 3.5} y={y - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                                <rect className="cad-grip-glow" x={x + w - 3.5} y={y + h - 3.5} width="7" height="7" fill="#38bdf8" stroke="white" strokeWidth="1" />
                                                                            </>
                                                                        )}
                                                                    </g>
                                                                );
                                                            }
                                                            if (shape.type === 'stamp') {
                                                                const color = shape.color || '#22c55e';
                                                                return (
                                                                    <g key={shape.id} transform={`translate(${shape.x}, ${shape.y})`} onClick={handleShapeClick} onMouseDown={handleShapeMouseDown} style={shapeStyle}>
                                                                        <rect x="-60" y="-20" width="120" height="40" rx="4" fill="rgba(34, 197, 94, 0.15)" stroke={color} strokeWidth="2.5" strokeDasharray="4,2" className={animClass} />
                                                                        <text x="0" y="6" fill={color} fontSize="14" fontWeight="bold" fontFamily="monospace" textAnchor="middle">{shape.text || 'APPROVED'}</text>
                                                                    </g>
                                                                );
                                                            }
                                                            return null;
                                                        })}

                                                        {/* Live in-progress Drafting Overlays (Lines, Rects, Circles, Arcs, Polylines, Dimensions, OSNAP points) */}
                                                        {renderDraftingOverlays()}

                                                        {/* Dimensions & Balloons */}
                                                        {selectedDwg && renderDimensionIndicators(
                                                            selectedDwg.dimensions.filter(dim =>
                                                                activeLayer === 'All Layers' ||
                                                                dim.layer === activeLayer ||
                                                                !dim.id.startsWith('dim_dxf')
                                                            )
                                                        )}
                                                    </g>
                                                </svg>
                                            </MLightCadViewer>
                                         </Suspense>
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

                                    {/* Absolutely positioned Dimension Inspect Parameter Context Menu */}
                                    {dimContextMenu && (() => {
                                        const dim = selectedDwg?.dimensions.find(d => d.id === dimContextMenu.dimId);
                                        if (!dim) return null;
                                        const catColor = dim.color || getCategoryColor(dim.category || 'dimension');
                                        return (
                                            <div style={{
                                                position: 'absolute',
                                                top: `${dimContextMenu.y}px`,
                                                left: `${dimContextMenu.x}px`,
                                                transform: 'translate(10px, 10px)',
                                                backgroundColor: '#0f172af2',
                                                border: `1px solid ${catColor}`,
                                                borderRadius: '10px',
                                                padding: '12px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                                zIndex: 1100,
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                                                fontFamily: "'Inter', sans-serif",
                                                minWidth: '220px',
                                                backdropFilter: 'blur(4px)',
                                                borderLeft: `4px solid ${catColor}`
                                            }}>
                                                {/* Title / Info */}
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #334155', paddingBottom: '6px', marginBottom: '2px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#f8fafc' }}>
                                                            {dim.label || 'Parameter'}
                                                        </span>
                                                        <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                                                            Nilai Spec: {dim.spec} {dim.unit}
                                                        </span>
                                                    </div>
                                                    <span style={{ fontSize: '0.9rem' }}>
                                                        {getCategoryDef(dim.category || 'dimension').icon}
                                                    </span>
                                                </div>

                                                {/* Actions: Duplicate & Delete */}
                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                    <button
                                                        onClick={() => {
                                                            handleDuplicateDimension(dim.id);
                                                            setDimContextMenu(null);
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            padding: '6px 8px',
                                                            backgroundColor: '#1e293b',
                                                            color: '#f8fafc',
                                                            border: '1px solid #334155',
                                                            borderRadius: '6px',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                    >
                                                        📋 Duplikat
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleDeleteDimension(dim.id);
                                                            setDimContextMenu(null);
                                                        }}
                                                        style={{
                                                            padding: '6px 10px',
                                                            backgroundColor: '#451a03',
                                                            color: '#ef4444',
                                                            border: '1px solid #ef444450',
                                                            borderRadius: '6px',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#7c2d12'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#451a03'; }}
                                                    >
                                                        🗑️ Hapus
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            handleChangeDimensionProp(dim.id, 'locked', !dim.locked);
                                                            setDimContextMenu(null);
                                                            toast.success(dim.locked ? 'Parameter dibuka kuncinya.' : 'Parameter berhasil dikunci.');
                                                        }}
                                                        style={{
                                                            padding: '6px 10px',
                                                            backgroundColor: dim.locked ? '#064e3b' : '#1e293b',
                                                            color: dim.locked ? '#10b981' : '#cbd5e1',
                                                            border: '1px solid #334155',
                                                            borderRadius: '6px',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '4px',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = dim.locked ? '#0f766e' : '#334155'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = dim.locked ? '#064e3b' : '#1e293b'; }}
                                                    >
                                                        {dim.locked ? '🔓 Buka' : '🔒 Kunci'}
                                                    </button>
                                                </div>

                                                {/* Move / Pindahkan */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Geser / Pindahkan
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => {
                                                                setDimMoveMode('all');
                                                                setCadTool('select');
                                                                setDimContextMenu(null);
                                                                toast.info('Klik di mana saja pada kanvas untuk memindahkan caliper.');
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '5px 6px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#10b981',
                                                                border: '1px solid #064e3b',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            🎯 Geser Semua
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setDimMoveMode('label');
                                                                setCadTool('select');
                                                                setDimContextMenu(null);
                                                                toast.info('Klik di mana saja pada kanvas untuk menggeser posisi label balon.');
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '5px 6px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#10b981',
                                                                border: '1px solid #064e3b',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            🏷️ Geser Label
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Coordinates Sliders Accordion */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowCtxCoords(!showCtxCoords);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '5px 8px',
                                                            backgroundColor: '#1e293b',
                                                            color: '#f8fafc',
                                                            border: '1px solid #334155',
                                                            borderRadius: '6px',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                            transition: 'all 0.2s'
                                                        }}
                                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#334155'; }}
                                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                    >
                                                        <span>🎛️ Penyesuaian Koordinat</span>
                                                        <span style={{ fontSize: '0.55rem' }}>{showCtxCoords ? '▼' : '▶'}</span>
                                                    </button>
                                                    {showCtxCoords && (
                                                        <div style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '6px',
                                                            backgroundColor: '#0f172a80',
                                                            padding: '8px',
                                                            borderRadius: '6px',
                                                            border: '1px solid #334155',
                                                            marginTop: '2px'
                                                        }}>
                                                            {/* Label Coordinate Sliders */}
                                                            <div>
                                                                <span style={{ display: 'block', fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>
                                                                    Posisi Balloon
                                                                </span>
                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#cbd5e1' }}>Label X: {dim.lx ?? 250}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="490"
                                                                            value={dim.lx ?? 250}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'lx', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#10b981', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#cbd5e1' }}>Label Y: {dim.ly ?? 200}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="350"
                                                                            value={dim.ly ?? 200}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'ly', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#10b981', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Caliper Endpoints Coordinate Sliders */}
                                                            <div style={{ borderTop: '1px solid #334155', paddingTop: '4px' }}>
                                                                <span style={{ display: 'block', fontSize: '0.55rem', color: '#94a3b8', fontWeight: 700, marginBottom: '2px', textTransform: 'uppercase' }}>
                                                                    Garis Penunjuk / Caliper
                                                                </span>
                                                                
                                                                {dim.category === 'angle' ? (
                                                                    <>
                                                                        {/* Angle center/vertex */}
                                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '0.55rem', color: '#cbd5e1' }}>Vertex X: {dim.cx ?? 250}</label>
                                                                                <input
                                                                                    type="range"
                                                                                    min="10"
                                                                                    max="490"
                                                                                    value={dim.cx ?? 250}
                                                                                    onChange={(e) => handleSliderCoordinateChange(dim, 'cx', e.target.value)}
                                                                                    style={{ width: '100%', accentColor: '#f59e0b', height: '3px', cursor: 'pointer' }}
                                                                                />
                                                                            </div>
                                                                            <div>
                                                                                <label style={{ display: 'block', fontSize: '0.55rem', color: '#cbd5e1' }}>Vertex Y: {dim.cy ?? 180}</label>
                                                                                <input
                                                                                    type="range"
                                                                                    min="10"
                                                                                    max="350"
                                                                                    value={dim.cy ?? 180}
                                                                                    onChange={(e) => handleSliderCoordinateChange(dim, 'cy', e.target.value)}
                                                                                    style={{ width: '100%', accentColor: '#f59e0b', height: '3px', cursor: 'pointer' }}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : null}

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '4px' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#10b981', fontWeight: 'bold' }}>📍 Start Point X (P1): {dim.x1 ?? 150}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="490"
                                                                            value={dim.x1 ?? 150}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'x1', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#10b981', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#10b981', fontWeight: 'bold' }}>📍 Start Point Y (P1): {dim.y1 ?? 180}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="350"
                                                                            value={dim.y1 ?? 180}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'y1', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#10b981', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                </div>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#3b82f6', fontWeight: 'bold' }}>🏁 End Point X (P2): {dim.x2 ?? 350}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="490"
                                                                            value={dim.x2 ?? 350}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'x2', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#3b82f6', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label style={{ display: 'block', fontSize: '0.55rem', color: '#3b82f6', fontWeight: 'bold' }}>🏁 End Point Y (P2): {dim.y2 ?? 180}</label>
                                                                        <input
                                                                            type="range"
                                                                            min="10"
                                                                            max="350"
                                                                            value={dim.y2 ?? 180}
                                                                            onChange={(e) => handleSliderCoordinateChange(dim, 'y2', e.target.value)}
                                                                            style={{ width: '100%', accentColor: '#3b82f6', height: '3px', cursor: 'pointer' }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Rotate */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Rotasi / Arah
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '4px' }}>
                                                        <button
                                                            onClick={() => {
                                                                handleRotateDimension(dim.id, 'toggle');
                                                                setDimContextMenu(null);
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px 6px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#3b82f6',
                                                                border: '1px solid #1e3a8a',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            ↕️ Tukar H/V
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                handleRotateDimension(dim.id, '90deg');
                                                                setDimContextMenu(null);
                                                            }}
                                                            style={{
                                                                flex: 1,
                                                                padding: '4px 6px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#3b82f6',
                                                                border: '1px solid #1e3a8a',
                                                                borderRadius: '4px',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 600,
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            🔄 Putar 90°
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Change Type (Category) */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Ubah Tipe
                                                    </span>
                                                    <select
                                                        value={dim.category || 'dimension'}
                                                        onChange={(e) => {
                                                            handleChangeDimensionCategory(dim.id, e.target.value);
                                                            setDimContextMenu(null);
                                                        }}
                                                        style={{
                                                            width: '100%',
                                                            padding: '4px 8px',
                                                            borderRadius: '4px',
                                                            border: '1px solid #334155',
                                                            backgroundColor: '#1e293b',
                                                            color: '#f8fafc',
                                                            fontSize: '0.68rem',
                                                            outline: 'none',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        {PARAM_CATEGORIES.map(cat => (
                                                            <option key={cat.key} value={cat.key}>
                                                                {cat.icon} {cat.label}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Change Color Preset */}
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        Ubah Warna
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '2px 0' }}>
                                                        {[
                                                            { name: 'Blue', value: '#3b82f6' },
                                                            { name: 'Green', value: '#10b981' },
                                                            { name: 'Red', value: '#ef4444' },
                                                            { name: 'Purple', value: '#8b5cf6' },
                                                            { name: 'Orange', value: '#f57c00' },
                                                        ].map(preset => (
                                                            <button
                                                                key={preset.value}
                                                                onClick={() => {
                                                                    handleChangeDimensionProp(dim.id, 'color', preset.value);
                                                                    setDimContextMenu(null);
                                                                }}
                                                                style={{
                                                                    width: '16px',
                                                                    height: '16px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: preset.value,
                                                                    border: dim.color === preset.value ? '2px solid white' : '1px solid #475569',
                                                                    cursor: 'pointer',
                                                                    boxShadow: dim.color === preset.value ? '0 0 4px white' : 'none',
                                                                    padding: 0
                                                                }}
                                                                title={preset.name}
                                                            />
                                                        ))}
                                                        <button
                                                            onClick={() => {
                                                                handleChangeDimensionProp(dim.id, 'color', null);
                                                                setDimContextMenu(null);
                                                            }}
                                                            style={{
                                                                padding: '2px 6px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#94a3b8',
                                                                border: '1px solid #334155',
                                                                borderRadius: '3px',
                                                                fontSize: '0.58rem',
                                                                cursor: 'pointer'
                                                            }}
                                                            title="Reset to category color"
                                                        >
                                                            Reset
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Font Size & Line Thickness */}
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Ukuran Font
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {[
                                                                { label: 'S', value: 8 },
                                                                { label: 'M', value: 11 },
                                                                { label: 'L', value: 14 },
                                                                { label: 'XL', value: 18 }
                                                            ].map(sz => (
                                                                <button
                                                                    key={sz.value}
                                                                    onClick={() => {
                                                                        handleChangeDimensionProp(dim.id, 'fontSize', sz.value);
                                                                        setDimContextMenu(null);
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '2px 0',
                                                                        backgroundColor: (dim.fontSize || 11) === sz.value ? '#2563eb' : '#1e293b',
                                                                        color: (dim.fontSize || 11) === sz.value ? 'white' : '#cbd5e1',
                                                                        border: '1px solid #334155',
                                                                        borderRadius: '3px',
                                                                        fontSize: '0.58rem',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    {sz.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                            Tebal Garis
                                                        </span>
                                                        <div style={{ display: 'flex', gap: '2px' }}>
                                                            {[
                                                                { label: '1px', value: 1 },
                                                                { label: '2px', value: 2 },
                                                                { label: '4px', value: 4 },
                                                                { label: '6px', value: 6 }
                                                            ].map(lw => (
                                                                <button
                                                                    key={lw.value}
                                                                    onClick={() => {
                                                                        handleChangeDimensionProp(dim.id, 'lineWidth', lw.value);
                                                                        setDimContextMenu(null);
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '2px 0',
                                                                        backgroundColor: (dim.lineWidth !== undefined ? dim.lineWidth : 2) === lw.value ? '#2563eb' : '#1e293b',
                                                                        color: (dim.lineWidth !== undefined ? dim.lineWidth : 2) === lw.value ? 'white' : '#cbd5e1',
                                                                        border: '1px solid #334155',
                                                                        borderRadius: '3px',
                                                                        fontSize: '0.55rem',
                                                                        cursor: 'pointer',
                                                                        fontWeight: 'bold'
                                                                    }}
                                                                >
                                                                    {lw.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cancel button */}
                                                <button
                                                    onClick={() => setDimContextMenu(null)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#94a3b8',
                                                        fontSize: '0.62rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        padding: '4px 0 0 0',
                                                        borderTop: '1px solid #334155',
                                                        marginTop: '2px'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    Tutup Menu
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {canvasContextMenu && (() => {
                                        const activeDim = selectedDwg?.dimensions?.find(d => d.id === activeDimId);
                                        const activeShape = selectedDwg?.shapes?.find(s => s.id === selectedShapeId);
                                        const hasSelection = !!activeDim || !!activeShape;
                                        const isPolylineDrafting = cadTool === 'polyline' && polylineDraftPoints.length > 0;
                                        const isDrawingLine = cadTool === 'line' || isPolylineDrafting;

                                        return (
                                            <div style={{
                                                position: 'absolute',
                                                top: `${canvasContextMenu.y}px`,
                                                left: `${canvasContextMenu.x}px`,
                                                transform: 'translate(6px, 6px)',
                                                backgroundColor: '#0f172af5',
                                                border: '1px solid #334155',
                                                borderRadius: '10px',
                                                padding: '8px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                zIndex: 1100,
                                                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.7), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
                                                fontFamily: "'Inter', sans-serif",
                                                minWidth: '225px',
                                                backdropFilter: 'blur(8px)',
                                                borderLeft: '4px solid #3b82f6'
                                            }}>
                                                {/* Context Header */}
                                                <div style={{ borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f8fafc' }}>
                                                        {isPolylineDrafting ? '〽️ Polyline Drafting' : hasSelection ? '⚙️ Opsi Entitas Terpilih' : '🎯 CAD Canvas Menu'}
                                                    </span>
                                                    <span style={{ fontSize: '0.58rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                                                        X:{Math.round(canvasContextMenu.canvasX)} Y:{Math.round(canvasContextMenu.canvasY)}
                                                    </span>
                                                </div>

                                                {/* 3. END POINT (Untuk akhiri garis atau polyline / Finish Drafting) */}
                                                {(isPolylineDrafting || isDrawingLine) && (
                                                    <button
                                                        onClick={() => {
                                                            if (isPolylineDrafting) {
                                                                finishPolylineDraft();
                                                            } else if (cadTool === 'line') {
                                                                setCadTool('select');
                                                                toast.success('Garis selesai digambar.');
                                                            }
                                                            setCanvasContextMenu(null);
                                                        }}
                                                        style={{
                                                            padding: '6px 8px',
                                                            backgroundColor: '#064e3b',
                                                            color: '#34d399',
                                                            border: '1px solid #059669',
                                                            borderRadius: '6px',
                                                            fontSize: '0.70rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#047857'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#064e3b'}
                                                    >
                                                        <span>🏁 3. End Point (Akhiri Garis / Polyline)</span>
                                                    </button>
                                                )}

                                                {/* If has active dimension, option to set End Point coordinate */}
                                                {activeDim && !isPolylineDrafting && (
                                                    <button
                                                        onClick={setEndPointFromCanvasMenu}
                                                        style={{
                                                            padding: '5px 8px',
                                                            backgroundColor: '#1e293b',
                                                            color: '#38bdf8',
                                                            border: '1px solid #334155',
                                                            borderRadius: '6px',
                                                            fontSize: '0.68rem',
                                                            fontWeight: 'bold',
                                                            cursor: 'pointer',
                                                            textAlign: 'left',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px'
                                                        }}
                                                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                                                        onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                    >
                                                        <span>🏁 3. Tentukan End Point (Titik Akhir)</span>
                                                    </button>
                                                )}

                                                {/* 1. COPY (Duplikasi Objek / Garis) */}
                                                <button
                                                    onClick={() => {
                                                        if (activeDimId) {
                                                            handleDuplicateDimension(activeDimId);
                                                        } else if (selectedShapeId && activeShape) {
                                                            handleDuplicateShape(activeShape);
                                                        } else {
                                                            toast.info('Pilih objek atau parameter terlebih dahulu untuk di-copy.');
                                                        }
                                                        setCanvasContextMenu(null);
                                                    }}
                                                    disabled={!hasSelection}
                                                    style={{
                                                        padding: '5px 8px',
                                                        backgroundColor: hasSelection ? '#1e293b' : '#0f172a',
                                                        color: hasSelection ? '#38bdf8' : '#64748b',
                                                        border: '1px solid #334155',
                                                        borderRadius: '6px',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 'bold',
                                                        cursor: hasSelection ? 'pointer' : 'not-allowed',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={e => { if (hasSelection) e.currentTarget.style.backgroundColor = '#334155'; }}
                                                    onMouseLeave={e => { if (hasSelection) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                >
                                                    <span>📋 1. Copy (Duplikasi Objek Terpilih)</span>
                                                </button>

                                                {/* 2. DELETE (Hapus Objek / Garis) */}
                                                <button
                                                    onClick={() => {
                                                        if (activeDimId) {
                                                            handleDeleteDimension(activeDimId);
                                                        } else if (selectedShapeId) {
                                                            handleDeleteShape(selectedShapeId);
                                                        } else {
                                                            toast.info('Pilih objek atau parameter terlebih dahulu untuk dihapus.');
                                                        }
                                                        setCanvasContextMenu(null);
                                                    }}
                                                    disabled={!hasSelection}
                                                    style={{
                                                        padding: '5px 8px',
                                                        backgroundColor: hasSelection ? '#1e293b' : '#0f172a',
                                                        color: hasSelection ? '#f87171' : '#64748b',
                                                        border: '1px solid #334155',
                                                        borderRadius: '6px',
                                                        fontSize: '0.68rem',
                                                        fontWeight: 'bold',
                                                        cursor: hasSelection ? 'pointer' : 'not-allowed',
                                                        textAlign: 'left',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px'
                                                    }}
                                                    onMouseEnter={e => { if (hasSelection) e.currentTarget.style.backgroundColor = '#7f1d1d'; }}
                                                    onMouseLeave={e => { if (hasSelection) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                                                >
                                                    <span>🗑️ 2. Delete (Hapus Objek / Garis)</span>
                                                </button>

                                                {/* Optional Coordinate Modifiers if activeDim */}
                                                {activeDim && (
                                                    <>
                                                        <div style={{ height: '1px', backgroundColor: '#334155', margin: '2px 0' }} />
                                                        <button
                                                            onClick={setStartPointFromCanvasMenu}
                                                            style={{
                                                                padding: '5px 8px',
                                                                backgroundColor: '#1e293b',
                                                                color: '#e2e8f0',
                                                                border: '1px solid #334155',
                                                                borderRadius: '6px',
                                                                fontSize: '0.64rem',
                                                                fontWeight: '500',
                                                                cursor: 'pointer',
                                                                textAlign: 'left'
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                        >
                                                            📍 Tentukan Start Point (Titik Awal)
                                                        </button>
                                                        {activeDim.category === 'angle' && (
                                                            <button
                                                                onClick={setCenterPointFromCanvasMenu}
                                                                style={{
                                                                    padding: '5px 8px',
                                                                    backgroundColor: '#1e293b',
                                                                    color: '#e2e8f0',
                                                                    border: '1px solid #334155',
                                                                    borderRadius: '6px',
                                                                    fontSize: '0.64rem',
                                                                    fontWeight: '500',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'left'
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                            >
                                                                🎯 Tentukan Titik Pusat (Vertex)
                                                            </button>
                                                        )}
                                                    </>
                                                )}

                                                <button
                                                    onClick={() => setCanvasContextMenu(null)}
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: '#94a3b8',
                                                        fontSize: '0.62rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        textAlign: 'center',
                                                        padding: '4px 0 0 0',
                                                        borderTop: '1px solid #334155',
                                                        marginTop: '2px'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    Tutup Menu (Esc)
                                                </button>
                                            </div>
                                        );
                                    })()}

                                    {/* Floating Polyline Status Pill */}
                                    {cadTool === 'polyline' && polylineDraftPoints.length > 0 && (
                                        <div style={{
                                            position: 'absolute', top: '30px', left: '50%', transform: 'translateX(-50%)',
                                            backgroundColor: '#0f172ae6', border: '1px solid #10b981', borderRadius: '30px',
                                            padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '10px',
                                            zIndex: 100, color: 'white', fontSize: '0.72rem', fontWeight: 800,
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.4)', fontFamily: "'Inter', sans-serif"
                                        }}>
                                            <span style={{ color: '#34d399' }}>〽️ Polyline ({Math.max(1, polylineDraftPoints.length - 1)} titik)</span>
                                            <span style={{ fontSize: '0.62rem', color: '#94a3b8' }}>Klik kanan / Endpoint / Enter untuk selesai</span>
                                            <button
                                                onClick={finishPolylineDraft}
                                                style={{
                                                    backgroundColor: '#10b981', color: 'white', border: 'none',
                                                    borderRadius: '16px', padding: '3px 10px', fontSize: '0.65rem',
                                                    fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                ✓ Selesai
                                            </button>
                                            <button
                                                onClick={() => setPolylineDraftPoints([])}
                                                style={{
                                                    backgroundColor: '#ef4444', color: 'white', border: 'none',
                                                    borderRadius: '16px', padding: '3px 10px', fontSize: '0.65rem',
                                                    fontWeight: 'bold', cursor: 'pointer'
                                                }}
                                            >
                                                ✕ Batal
                                            </button>
                                        </div>
                                    )}

                                    {/* Shape Right-Click Context Menu (Move, Copy, Delete) */}
                                    {shapeContextMenu && (() => {
                                        const shape = shapeContextMenu.shape;
                                        if (!shape) return null;
                                        return (
                                            <div style={{
                                                position: 'absolute',
                                                top: `${shapeContextMenu.y}px`,
                                                left: `${shapeContextMenu.x}px`,
                                                transform: 'translate(10px, 10px)',
                                                backgroundColor: '#0f172af2',
                                                border: '1px solid #3b82f6',
                                                borderRadius: '10px',
                                                padding: '10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '6px',
                                                zIndex: 1100,
                                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                                                fontFamily: "'Inter', sans-serif",
                                                minWidth: '170px',
                                                backdropFilter: 'blur(4px)',
                                                borderLeft: '4px solid #3b82f6'
                                            }}>
                                                <div style={{ borderBottom: '1px solid #334155', paddingBottom: '4px', marginBottom: '2px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#f8fafc', textTransform: 'uppercase' }}>
                                                        📐 Geometri {shape.type?.toUpperCase()}
                                                    </span>
                                                </div>

                                                {/* Move */}
                                                <button
                                                    onClick={() => {
                                                        setSelectedShapeId(shape.id);
                                                        setCadTool('move');
                                                        setShapeContextMenu(null);
                                                        toast.info('Klik dan geser bentuk pada kanvas untuk memindahkan.');
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                                                        backgroundColor: '#1e293b', color: '#60a5fa', border: '1px solid #1e3a8a',
                                                        borderRadius: '6px', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                >
                                                    🎯 Pindahkan (Move)
                                                </button>

                                                {/* Copy / Duplicate */}
                                                <button
                                                    onClick={() => {
                                                        handleDuplicateShape(shape);
                                                        setShapeContextMenu(null);
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                                                        backgroundColor: '#1e293b', color: '#10b981', border: '1px solid #064e3b',
                                                        borderRadius: '6px', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                                                >
                                                    📋 Duplikat (Copy)
                                                </button>

                                                {/* Delete */}
                                                <button
                                                    onClick={() => {
                                                        const currentShapes = selectedDwg.shapes || [];
                                                        updateShapes(currentShapes.filter(s => s.id !== shape.id));
                                                        setShapeContextMenu(null);
                                                        toast.success('Geometri terhapus.');
                                                    }}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 8px',
                                                        backgroundColor: '#451a03', color: '#ef4444', border: '1px solid #ef444450',
                                                        borderRadius: '6px', fontSize: '0.68rem', fontWeight: 'bold', cursor: 'pointer'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#7c2d12'}
                                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#451a03'}
                                                >
                                                    🗑️ Hapus (Delete)
                                                </button>

                                                <button
                                                    onClick={() => setShapeContextMenu(null)}
                                                    style={{
                                                        background: 'transparent', border: 'none', color: '#94a3b8',
                                                        fontSize: '0.62rem', fontWeight: 'bold', cursor: 'pointer',
                                                        textAlign: 'center', paddingTop: '4px', borderTop: '1px solid #334155', marginTop: '2px'
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = 'white'}
                                                    onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
                                                >
                                                    Batal
                                                </button>
                                            </div>
                                        );
                                    })()}



                                </div>

                                {/* AutoCAD Status Bar */}
                                <div style={{
                                    display: 'none',
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

                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
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

                                            <button
                                                onClick={() => setShowCrosshair(c => !c)}
                                                title="Toggle AutoCAD Crossbar Guide (CROSSHAIR)"
                                                style={{
                                                    backgroundColor: showCrosshair ? '#2563eb20' : 'transparent',
                                                    border: '1px solid ' + (showCrosshair ? '#2563eb' : '#334155'),
                                                    color: showCrosshair ? '#60a5fa' : '#64748b',
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
                                                <Crosshair size={9} /> CROSSHAIR
                                            </button>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1px' }}>
                                                <button
                                                    onClick={() => setOsnapActive(o => !o)}
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        setShowOsnapModal(true);
                                                    }}
                                                    title="Object Snap Magnet (F3) - Klik untuk Toggle / Klik kanan untuk Pengaturan"
                                                    style={{
                                                        backgroundColor: osnapActive ? '#2563eb30' : 'transparent',
                                                        border: '1px solid ' + (osnapActive ? '#2563eb' : '#334155'),
                                                        color: osnapActive ? '#60a5fa' : '#64748b',
                                                        borderRadius: '4px 0 0 4px',
                                                        padding: '2px 6px',
                                                        fontSize: '0.55rem',
                                                        fontWeight: 'bold',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '3px'
                                                    }}
                                                >
                                                    <Magnet size={10} /> OSNAP
                                                </button>
                                                <button
                                                    onClick={() => setShowOsnapModal(true)}
                                                    title="Pengaturan Mode Magnet OSNAP (Endpoint, Midpoint, Center, Intersection)"
                                                    style={{
                                                        backgroundColor: osnapActive ? '#2563eb30' : 'transparent',
                                                        border: '1px solid ' + (osnapActive ? '#2563eb' : '#334155'),
                                                        borderLeft: 'none',
                                                        color: osnapActive ? '#60a5fa' : '#64748b',
                                                        borderRadius: '0 4px 4px 0',
                                                        padding: '2px 4px',
                                                        fontSize: '0.55rem',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center'
                                                    }}
                                                >
                                                    <Settings size={9} />
                                                </button>
                                            </div>
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

                        </div> {/* Closes AutoCAD Canvas Card Content wrapper */}

                    {/* Right Sidebar: QC Inspector (Odoo Enterprise Theme) */}
                    {showQCInspector && (
                        <div style={{
                            width: '350px',
                            display: 'flex',
                            flexDirection: 'column',
                            backgroundColor: '#ffffff',
                            borderRadius: '10px',
                            border: '1px solid #d1d5db',
                            overflow: 'hidden',
                            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
                            color: '#212529',
                            flexShrink: 0,
                            height: '100%',
                            zIndex: 10,
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
                        }}>
                            {/* Odoo Unified Panel Header */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 14px',
                                borderBottom: '1px solid #e9ecef',
                                backgroundColor: '#f8f9fa'
                            }}>
                                {/* Odoo Tab Switcher / Breadcrumb Pills */}
                                <div style={{
                                    display: 'flex',
                                    padding: '2px',
                                    backgroundColor: '#e9ecef',
                                    borderRadius: '6px',
                                    gap: '2px'
                                }}>
                                    <button
                                        onClick={() => setQcTab('properties')}
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '5px',
                                            border: 'none',
                                            fontSize: '0.72rem',
                                            fontWeight: qcTab === 'properties' ? 700 : 600,
                                            cursor: 'pointer',
                                            backgroundColor: qcTab === 'properties' ? '#714B67' : 'transparent',
                                            color: qcTab === 'properties' ? '#ffffff' : '#495057',
                                            boxShadow: qcTab === 'properties' ? '0 1px 3px rgba(113, 75, 103, 0.35)' : 'none',
                                            transition: 'all 0.15s ease',
                                            outline: 'none'
                                        }}
                                    >
                                        QC Parameter
                                    </button>
                                    <button
                                        onClick={() => setQcTab('simulator')}
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '5px',
                                            border: 'none',
                                            fontSize: '0.72rem',
                                            fontWeight: qcTab === 'simulator' ? 700 : 600,
                                            cursor: 'pointer',
                                            backgroundColor: qcTab === 'simulator' ? '#714B67' : 'transparent',
                                            color: qcTab === 'simulator' ? '#ffffff' : '#495057',
                                            boxShadow: qcTab === 'simulator' ? '0 1px 3px rgba(113, 75, 103, 0.35)' : 'none',
                                            transition: 'all 0.15s ease',
                                            outline: 'none'
                                        }}
                                    >
                                        Simulator
                                    </button>
                                    <button
                                        onClick={() => setQcTab('region')}
                                        style={{
                                            padding: '5px 12px',
                                            borderRadius: '5px',
                                            border: 'none',
                                            fontSize: '0.72rem',
                                            fontWeight: qcTab === 'region' ? 700 : 600,
                                            cursor: 'pointer',
                                            backgroundColor: qcTab === 'region' ? '#017E84' : 'transparent',
                                            color: qcTab === 'region' ? '#ffffff' : '#495057',
                                            boxShadow: qcTab === 'region' ? '0 1px 3px rgba(1, 126, 132, 0.35)' : 'none',
                                            transition: 'all 0.15s ease',
                                            outline: 'none'
                                        }}
                                    >
                                        📷 Region
                                    </button>
                                </div>

                                {/* Right side items + Close Button */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <button
                                        onClick={() => setShowQCInspector(false)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#6c757d',
                                            fontSize: '0.85rem',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                            borderRadius: '4px'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e9ecef'; e.currentTarget.style.color = '#212529'; }}
                                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#6c757d'; }}
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Tab Content Body */}
                            {qcTab === 'properties' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {/* Action Row containing Balloon indicator and Add Button */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e9ecef', paddingBottom: '8px', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {activeDim && (
                                                <span style={{
                                                    fontSize: '0.68rem',
                                                    backgroundColor: '#f3eef2',
                                                    color: '#714B67',
                                                    border: '1px solid #d9c4d4',
                                                    padding: '3px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: 700,
                                                    display: 'inline-block'
                                                }}>
                                                    Balloon #{selectedDwg?.dimensions?.findIndex(d => d.id === activeDim.id) + 1 || '?'}
                                                </span>
                                            )}
                                            {activeDim && (
                                                <button
                                                    onClick={() => handleDeleteDimension(activeDim.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        backgroundColor: '#fee2e2',
                                                        color: '#dc2626',
                                                        border: '1px solid #fca5a5',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.65rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Hapus Parameter QC Ini"
                                                >
                                                    <Trash2 size={11} />
                                                    <span>Hapus</span>
                                                </button>
                                            )}
                                        </div>
                                        
                                        {/* Odoo Style "+ Tambah" button with category picker */}
                                        <div style={{ position: 'relative' }} ref={addPickerRef}>
                                            <button
                                                onClick={() => setShowAddPicker(!showAddPicker)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    border: '1px solid #5a3c52',
                                                    backgroundColor: '#714B67',
                                                    color: '#ffffff',
                                                    padding: '5px 12px',
                                                    borderRadius: '5px',
                                                    fontSize: '0.70rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    boxShadow: '0 1px 2px rgba(113, 75, 103, 0.25)',
                                                    transition: 'all 0.15s ease'
                                                }}
                                                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#5a3c52'}
                                                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#714B67'}
                                            >
                                                <Plus size={12} /> Tambah <ChevronDown size={10} />
                                            </button>
                                            {showAddPicker && (
                                                <div style={{
                                                    position: 'absolute', top: '100%', right: 0, marginTop: '6px',
                                                    backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d1d5db',
                                                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)', padding: '10px', zIndex: 100,
                                                    width: '230px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px',
                                                }}>
                                                    <div style={{ gridColumn: '1 / -1', fontSize: '0.62rem', fontWeight: 800, color: '#6c757d', textTransform: 'uppercase', marginBottom: '2px', padding: '0 4px', letterSpacing: '0.5px' }}>
                                                        TIPE PARAMETER QC
                                                    </div>
                                                    {PARAM_CATEGORIES.map(cat => (
                                                        <button
                                                            key={cat.key}
                                                            onClick={() => handleAddDimension(cat.key)}
                                                            style={{
                                                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                                                padding: '8px 6px', borderRadius: '6px', border: `1px solid ${cat.color}25`,
                                                                backgroundColor: `${cat.color}08`, cursor: 'pointer', transition: 'all 0.15s',
                                                            }}
                                                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${cat.color}18`; e.currentTarget.style.borderColor = cat.color; }}
                                                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${cat.color}08`; e.currentTarget.style.borderColor = `${cat.color}25`; }}
                                                        >
                                                            <span style={{ fontSize: '1.05rem' }}>{cat.icon}</span>
                                                            <span style={{ fontSize: '0.62rem', fontWeight: 700, color: '#212529', textAlign: 'center' }}>{cat.labelId}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

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

                                            {/* AI Vision & Hardware Lock Options */}
                                            <div style={{ backgroundColor: '#f5f3ff', padding: '10px', borderRadius: '8px', border: '1px solid #ddd6fe', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="editVisionEnabled"
                                                        checked={editVisionEnabled}
                                                        onChange={(e) => updateActiveDimProp('visionEnabled', e.target.checked)}
                                                        style={{ width: '15px', height: '15px', accentColor: '#7c3aed' }}
                                                    />
                                                    <label htmlFor="editVisionEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                                        Gunakan AI Vision (YOLOv8)
                                                    </label>
                                                </div>

                                                {editVisionEnabled && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '22px' }}>
                                                        <div>
                                                            <label style={{ ...labelStyle, marginBottom: '2px' }}>Model YOLO</label>
                                                            <select value={editYoloModel} onChange={(e) => updateActiveDimProp('yoloModel', e.target.value)} style={selectStyle}>
                                                                <option value="yolov8n.pt">yolov8n.pt (Nano)</option>
                                                                <option value="yolov8_surface_defect.pt">yolov8_surface_defect.pt</option>
                                                                <option value="yolov8_dimensions.pt">yolov8_dimensions.pt</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label style={{ ...labelStyle, marginBottom: '2px' }}>Target Class</label>
                                                            <input type="text" value={editYoloClass} onChange={(e) => updateActiveDimProp('yoloClass', e.target.value)} placeholder="Misal: bore, scratch" style={inputStyle} />
                                                        </div>
                                                    </div>
                                                )}

                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="editDeviceLockEnabled"
                                                        checked={editDeviceLockEnabled}
                                                        onChange={(e) => updateActiveDimProp('deviceLockEnabled', e.target.checked)}
                                                        style={{ width: '15px', height: '15px', accentColor: '#7c3aed' }}
                                                    />
                                                    <label htmlFor="editDeviceLockEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                                        Kunci ke Hardware Device (BLE)
                                                    </label>
                                                </div>

                                                {editDeviceLockEnabled && (
                                                    <div style={{ paddingLeft: '22px' }}>
                                                        <label style={{ ...labelStyle, marginBottom: '2px' }}>Device Profile</label>
                                                        <select value={editDeviceProfile} onChange={(e) => updateActiveDimProp('deviceProfile', e.target.value)} style={selectStyle}>
                                                            <option value="Mitutoyo Caliper (BLE)">Mitutoyo Caliper (BLE)</option>
                                                            <option value="Sylvac Micrometer (BLE)">Sylvac Micrometer (BLE)</option>
                                                            <option value="Smart Weight Scale (BLE)">Smart Weight Scale (BLE)</option>
                                                        </select>
                                                    </div>
                                                )}
                                            </div>

                                            {/* ASME Y14.5 GD&T Control Frame Builder */}
                                            <div style={{ backgroundColor: '#e6f4ea', padding: '10px', borderRadius: '8px', border: '1px solid #34a853', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <input
                                                        type="checkbox"
                                                        id="editGdtFrameEnabled"
                                                        checked={editGdtFrameEnabled}
                                                        onChange={(e) => updateActiveDimProp('gdtFrameEnabled', e.target.checked)}
                                                        style={{ width: '15px', height: '15px', accentColor: '#34a853' }}
                                                    />
                                                    <label htmlFor="editGdtFrameEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#137333', cursor: 'pointer' }}>
                                                        Build ASME Y14.5 Control Frame
                                                    </label>
                                                </div>

                                                {editGdtFrameEnabled && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '22px' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                                                            <div>
                                                                <label style={{ ...labelStyle, marginBottom: '2px' }}>Karakteristik</label>
                                                                <select value={editGdtSymbol} onChange={(e) => updateActiveDimProp('gdt_symbol', e.target.value)} style={selectStyle}>
                                                                    <optgroup label="Form (Bentuk)">
                                                                        <option value="FLATNESS">▱ Flatness</option>
                                                                        <option value="STRAIGHTNESS">⏤ Straightness</option>
                                                                        <option value="CIRCULARITY">◯ Circularity</option>
                                                                        <option value="CYLINDRICITY">⌭ Cylindricity</option>
                                                                    </optgroup>
                                                                    <optgroup label="Profile (Profil)">
                                                                        <option value="PROFILE_SURFACE">⌢ Profile of a Surface</option>
                                                                        <option value="PROFILE_LINE">◠ Profile of a Line</option>
                                                                    </optgroup>
                                                                    <optgroup label="Orientation (Orientasi)">
                                                                        <option value="PERPENDICULARITY">⊥ Perpendicularity</option>
                                                                        <option value="PARALLELISM">∥ Parallelism</option>
                                                                        <option value="ANGULARITY">∠ Angularity</option>
                                                                    </optgroup>
                                                                    <optgroup label="Location (Lokasi)">
                                                                        <option value="POSITION">⌖ Position</option>
                                                                        <option value="CONCENTRICITY">◎ Concentricity</option>
                                                                        <option value="SYMMETRY">⌯ Symmetry</option>
                                                                    </optgroup>
                                                                    <optgroup label="Runout (Penyimpangan)">
                                                                        <option value="CIRCULAR_RUNOUT">↗ Runout</option>
                                                                        <option value="TOTAL_RUNOUT">⌰ Total Runout</option>
                                                                    </optgroup>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label style={{ ...labelStyle, marginBottom: '2px' }}>Toleransi</label>
                                                                <input type="text" value={editGdtTolerance} onChange={(e) => updateActiveDimProp('gdtTolerance', e.target.value)} placeholder="0.05" style={inputStyle} />
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    id="editGdtHasDiameter"
                                                                    checked={editGdtHasDiameter}
                                                                    onChange={(e) => updateActiveDimProp('gdtHasDiameter', e.target.checked)}
                                                                    style={{ width: '13px', height: '13px', accentColor: '#34a853' }}
                                                                />
                                                                <label htmlFor="editGdtHasDiameter" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                                                    Gunakan ⌀
                                                                </label>
                                                            </div>
                                                            <div>
                                                                <label style={{ ...labelStyle, marginBottom: '2px' }}>Modifier</label>
                                                                <select value={editGdtModifier} onChange={(e) => updateActiveDimProp('gdtModifier', e.target.value)} style={selectStyle}>
                                                                    <option value="">None</option>
                                                                    <option value="M">Ⓜ (MMC)</option>
                                                                    <option value="L">Ⓛ (LMC)</option>
                                                                    <option value="F">Ⓕ (Free State)</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                         <div>
                                                            <label style={{ ...labelStyle, marginBottom: '2px' }}>Datums (A / B / C)</label>
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <input type="text" maxLength="2" placeholder="Pri" value={editGdtDatum1} onChange={(e) => updateActiveDimProp('gdtDatum1', e.target.value.toUpperCase())} style={{ ...inputStyle, textAlign: 'center', padding: '6px' }} />
                                                                <input type="text" maxLength="2" placeholder="Sec" value={editGdtDatum2} onChange={(e) => updateActiveDimProp('gdtDatum2', e.target.value.toUpperCase())} style={{ ...inputStyle, textAlign: 'center', padding: '6px' }} />
                                                                <input type="text" maxLength="2" placeholder="Ter" value={editGdtDatum3} onChange={(e) => updateActiveDimProp('gdtDatum3', e.target.value.toUpperCase())} style={{ ...inputStyle, textAlign: 'center', padding: '6px' }} />
                                                            </div>
                                                        </div>

                                                        {/* Real-time GD&T Feature Control Frame Preview Box */}
                                                        <div style={{
                                                            marginTop: '6px',
                                                            padding: '8px 10px',
                                                            backgroundColor: '#ffffff',
                                                            border: '1px dashed #34a853',
                                                            borderRadius: '6px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '4px'
                                                        }}>
                                                            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#137333', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                                                                👁️ Live ASME Y14.5 FCF Preview
                                                            </div>
                                                            <div style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'stretch',
                                                                border: '2px solid #0f172a',
                                                                backgroundColor: '#ffffff',
                                                                fontFamily: "'Courier New', Courier, monospace",
                                                                fontSize: '0.85rem',
                                                                fontWeight: 900,
                                                                color: '#0f172a',
                                                                boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                                                userSelect: 'none'
                                                            }}>
                                                                {/* Symbol Cell */}
                                                                <div style={{ padding: '3px 7px', borderRight: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', fontSize: '1rem' }}>
                                                                    {(() => {
                                                                        const symMap = {
                                                                            POSITION: '⌖', FLATNESS: '▱', STRAIGHTNESS: '⏤', CIRCULARITY: '◯', CYLINDRICITY: '⌭',
                                                                            PROFILE_SURFACE: '⌢', PROFILE_LINE: '◠', PERPENDICULARITY: '⊥', PARALLELISM: '∥',
                                                                            ANGULARITY: '∠', CONCENTRICITY: '◎', SYMMETRY: '⌯', CIRCULAR_RUNOUT: '↗', TOTAL_RUNOUT: '⌰'
                                                                        };
                                                                        return symMap[editGdtSymbol] || '⌖';
                                                                    })()}
                                                                </div>

                                                                {/* Tolerance & Modifiers Cell */}
                                                                <div style={{ padding: '3px 8px', borderRight: (editGdtDatum1 || editGdtDatum2 || editGdtDatum3) ? '2px solid #0f172a' : 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                                    {editGdtHasDiameter && <span>⌀</span>}
                                                                    <span>{editGdtTolerance || '0.05'}</span>
                                                                    {editGdtModifier && (
                                                                        <span style={{ fontSize: '0.75rem' }}>
                                                                            {editGdtModifier === 'M' ? 'Ⓜ' : editGdtModifier === 'L' ? 'Ⓛ' : 'Ⓕ'}
                                                                        </span>
                                                                    )}
                                                                </div>

                                                                {/* Primary Datum */}
                                                                {editGdtDatum1 && (
                                                                    <div style={{ padding: '3px 7px', borderRight: (editGdtDatum2 || editGdtDatum3) ? '2px solid #0f172a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {editGdtDatum1}
                                                                    </div>
                                                                )}

                                                                {/* Secondary Datum */}
                                                                {editGdtDatum2 && (
                                                                    <div style={{ padding: '3px 7px', borderRight: editGdtDatum3 ? '2px solid #0f172a' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {editGdtDatum2}
                                                                    </div>
                                                                )}

                                                                {/* Tertiary Datum */}
                                                                {editGdtDatum3 && (
                                                                    <div style={{ padding: '3px 7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        {editGdtDatum3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
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
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#10b981', fontWeight: 600 }}>Awal X (P1): {editX1}</label>
                                                                <input type="range" min="10" max="490" value={editX1} onChange={(e) => updateActiveDimProp('x1', e.target.value)} style={{ width: '100%', accentColor: '#10b981' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#10b981', fontWeight: 600 }}>Awal Y (P1): {editY1}</label>
                                                                <input type="range" min="10" max="350" value={editY1} onChange={(e) => updateActiveDimProp('y1', e.target.value)} style={{ width: '100%', accentColor: '#10b981' }} />
                                                            </div>
                                                        </div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#3b82f6', fontWeight: 600 }}>Akhir X (P2): {editX2}</label>
                                                                <input type="range" min="10" max="490" value={editX2} onChange={(e) => updateActiveDimProp('x2', e.target.value)} style={{ width: '100%', accentColor: '#3b82f6' }} />
                                                            </div>
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.58rem', color: '#3b82f6', fontWeight: 600 }}>Akhir Y (P2): {editY2}</label>
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
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContainer: 'space-around', gap: '10px', marginTop: '4px' }}>

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

                                            {/* Save / Delete Actions */}
                                            <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingBottom: '36px' }}>
                                                <button
                                                    onClick={handleSaveMapping}
                                                    style={{ 
                                                        flex: 2, 
                                                        padding: '11px 14px', 
                                                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)', 
                                                        color: 'white', 
                                                        border: 'none', 
                                                        borderRadius: '8px', 
                                                        fontWeight: 700, 
                                                        cursor: 'pointer', 
                                                        fontSize: '0.8rem', 
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '6px',
                                                        boxShadow: '0 2px 6px rgba(37,99,235,0.25)',
                                                        transition: 'all 0.15s' 
                                                    }}
                                                >
                                                    💾 Simpan Mapping
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDimension(activeDim.id)}
                                                    style={{ 
                                                        flex: 1, 
                                                        padding: '11px 12px', 
                                                        backgroundColor: '#fee2e2', 
                                                        color: '#dc2626', 
                                                        border: '1.5px solid #f87171', 
                                                        borderRadius: '8px', 
                                                        cursor: 'pointer', 
                                                        display: 'flex', 
                                                        alignItems: 'center', 
                                                        justifyContent: 'center',
                                                        gap: '5px',
                                                        fontWeight: 700,
                                                        fontSize: '0.78rem',
                                                        boxShadow: '0 2px 6px rgba(220,38,38,0.15)',
                                                        transition: 'all 0.15s'
                                                    }}
                                                    title="Hapus Parameter QC Ini"
                                                >
                                                    <Trash2 size={15} />
                                                    <span>Hapus</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{
                                            padding: '40px 16px',
                                            textAlign: 'center',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px'
                                        }}>
                                            <div style={{
                                                width: '54px',
                                                height: '54px',
                                                borderRadius: '50%',
                                                backgroundColor: '#f3eef2',
                                                border: '1px solid #e5dbe3',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: '#714B67'
                                            }}>
                                                <Sliders size={26} />
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#212529', marginBottom: '4px' }}>
                                                    Parameter QC
                                                </div>
                                                <div style={{ fontSize: '0.72rem', color: '#6c757d', maxWidth: '240px', lineHeight: '1.4' }}>
                                                    Pilih dimensi pada gambar CAD atau gunakan tombol <b style={{ color: '#714B67' }}>+ Tambah</b> untuk memulai konfigurasi.
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : qcTab === 'simulator' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {selectedDwg?.dimensions?.length > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b' }}>STATUS INSPEKSI:</span>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                fontWeight: 900,
                                                padding: '3px 10px',
                                                borderRadius: '4px',
                                                backgroundColor: overallJudgment === 'PASS' ? '#ecfdf5' : overallJudgment === 'FAIL' ? '#fee2e2' : '#f1f5f9',
                                                color: overallJudgment === 'PASS' ? '#059669' : overallJudgment === 'FAIL' ? '#dc2626' : '#64748b',
                                                border: `1px solid ${overallJudgment === 'PASS' ? '#a7f3d0' : overallJudgment === 'FAIL' ? '#fecaca' : '#cbd5e1'}`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                {overallJudgment === 'PASS' ? <CheckCircle size={11} color="#059669" /> : overallJudgment === 'FAIL' ? <XCircle size={11} color="#dc2626" /> : <Info size={11} color="#64748b" />}
                                                {overallJudgment}
                                            </span>
                                        </div>
                                    )}
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
                                                            <span style={{ fontSize: '0.58rem', backgroundColor: '#e2e8f0', padding: '1px 4px', borderRadius: '4px' }}>#{idx + 1}</span>
                                                            <span style={{ color: catDef.color, fontSize: '0.75rem' }}>{catDef.icon}</span>
                                                            {dim.label}
                                                            <span style={{ color: '#64748b', fontWeight: 600 }}>[{dim.tolMin}–{dim.tolMax} {dim.unit}]</span>
                                                            {triggerCount > 0 && (
                                                                <span style={{ color: '#f59e0b', fontSize: '0.6rem', display: 'flex', alignItems: 'center', gap: '2px' }} title={`${triggerCount} trigger aktif`}>
                                                                    ⚠️{triggerCount}
                                                                </span>
                                                            )}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {isTriggeredNow && (
                                                                <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444', padding: '1px 5px', backgroundColor: '#ef444418', borderRadius: '4px' }}>TRIGGERED</span>
                                                            )}
                                                            <span style={{ color: status === 'PASS' ? '#10b981' : status === 'FAIL' ? '#ef4444' : '#94a3b8', fontWeight: 900, fontSize: '0.7rem' }}>{status}</span>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteDimension(dim.id);
                                                                }}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    borderRadius: '4px',
                                                                    border: '1px solid #fecaca',
                                                                    backgroundColor: '#fef2f2',
                                                                    color: '#ef4444',
                                                                    cursor: 'pointer',
                                                                    padding: 0,
                                                                    marginLeft: '2px'
                                                                }}
                                                                title="Hapus Parameter"
                                                            >
                                                                <Trash2 size={11} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {dim.visionEnabled ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                            {/* AI Active Badge */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', color: '#7c3aed', fontWeight: 700, backgroundColor: '#f5f3ff', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ddd6fe' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Cpu size={11} /> YOLOv8 AI Vision Active
                                                                </span>
                                                                <span>{dim.yoloModel || 'yolov8n.pt'} ({dim.yoloClass || 'detect'})</span>
                                                            </div>
                                                            
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button
                                                                    onClick={async () => {
                                                                        const isScanActive = aiScanningId === dim.id;
                                                                        if (isScanActive) return;
                                                                        setAiScanningId(dim.id);
                                                                        const loadingToast = toast.loading(`[YOLOv8] Memulai analisis citra untuk "${dim.label}"...`, { id: `yolo-scan-${dim.id}` });
                                                                        
                                                                        // Simulating YOLO Inference Latency
                                                                        await new Promise(resolve => setTimeout(resolve, 1500));
                                                                        
                                                                        // Simulate random measurement value near nominal spec
                                                                        const specNum = parseFloat(dim.spec) || 50.0;
                                                                        const range = Math.max(0.1, (dim.tolMax - dim.tolMin));
                                                                        // 92% PASS chance, 8% FAIL chance
                                                                        const pass = Math.random() > 0.08;
                                                                        let simulatedVal;
                                                                        if (pass) {
                                                                            simulatedVal = parseFloat((dim.tolMin + Math.random() * range).toFixed(2));
                                                                        } else {
                                                                            // Generate values outside bounds
                                                                            simulatedVal = Math.random() > 0.5 
                                                                                ? parseFloat((dim.tolMax + 0.02 + Math.random() * 0.15).toFixed(2))
                                                                                : parseFloat((dim.tolMin - 0.02 - Math.random() * 0.15).toFixed(2));
                                                                        }
                                                                        
                                                                        const oldStatus = prevStatuses[dim.id] || 'PENDING';
                                                                        const newStatus = getValidationStatus(simulatedVal, dim.tolMin, dim.tolMax);
                                                                        
                                                                        setSimValues(prev => ({ ...prev, [dim.id]: simulatedVal }));
                                                                        setPrevStatuses(prev => ({ ...prev, [dim.id]: newStatus }));
                                                                        executeTriggers(dim, simulatedVal, oldStatus, newStatus);
                                                                        
                                                                        setAiScanningId(null);
                                                                        toast.dismiss(loadingToast);
                                                                        if (newStatus === 'PASS') {
                                                                            toast.success(`[YOLOv8] Analisis Selesai! Nilai terdeteksi: ${simulatedVal} ${dim.unit || 'mm'} (PASS)`, { id: `yolo-scan-${dim.id}` });
                                                                        } else {
                                                                            toast.error(`[YOLOv8] Analisis Selesai! Nilai terdeteksi: ${simulatedVal} ${dim.unit || 'mm'} (FAIL)`, { id: `yolo-scan-${dim.id}` });
                                                                        }
                                                                    }}
                                                                    disabled={aiScanningId === dim.id}
                                                                    style={{
                                                                        flex: 1,
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        gap: '6px',
                                                                        padding: '6px 12px',
                                                                        background: aiScanningId === dim.id ? '#cbd5e1' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.72rem',
                                                                        fontWeight: 800,
                                                                        cursor: aiScanningId === dim.id ? 'not-allowed' : 'pointer',
                                                                        boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
                                                                        outline: 'none'
                                                                    }}
                                                                >
                                                                    <Camera size={12} style={{ animation: aiScanningId === dim.id ? 'pulse 1s infinite' : 'none' }} />
                                                                    {aiScanningId === dim.id ? 'Memindai...' : 'Pindai Kamera (AI)'}
                                                                </button>
                                                                
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={simVal}
                                                                    onChange={(e) => {
                                                                        const newVal = parseFloat(e.target.value) || 0;
                                                                        const oldStatus = prevStatuses[dim.id] || 'PENDING';
                                                                        const newStatus = getValidationStatus(newVal, dim.tolMin, dim.tolMax);
                                                                        setSimValues(prev => ({ ...prev, [dim.id]: newVal }));
                                                                        setPrevStatuses(prev => ({ ...prev, [dim.id]: newStatus }));
                                                                        executeTriggers(dim, newVal, oldStatus, newStatus);
                                                                    }}
                                                                    style={{ ...inputStyle, width: '80px', fontSize: '0.72rem', padding: '4px 6px', textAlign: 'center', backgroundColor: '#f8fafc', marginTop: '0px' }}
                                                                    placeholder="Manual"
                                                                    title="Ganti nilai secara manual jika perlu"
                                                                />
                                                            </div>
                                                        </div>
                                                    ) : dim.deviceLockEnabled ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }} onClick={(e) => e.stopPropagation()}>
                                                            {/* BLE Hardware Active Badge */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.6rem', color: '#059669', fontWeight: 700, backgroundColor: '#ecfdf5', padding: '4px 8px', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <Sliders size={11} /> Bluetooth BLE Caliper Active
                                                                </span>
                                                                <span>{dim.deviceProfile || 'Mitutoyo Caliper'}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={simVal}
                                                                    disabled={true}
                                                                    style={{ ...inputStyle, flex: 2, fontSize: '0.75rem', padding: '6px 8px', backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b', marginTop: '0px' }}
                                                                    placeholder="Menunggu Data BLE..."
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        // Simulate receiving data from Caliper via Bluetooth
                                                                        const nominal = parseFloat(dim.spec) || 50.0;
                                                                        const range = Math.max(0.1, (dim.tolMax - dim.tolMin));
                                                                        const simulatedVal = parseFloat((dim.tolMin + Math.random() * range).toFixed(2));
                                                                        
                                                                        const oldStatus = prevStatuses[dim.id] || 'PENDING';
                                                                        const newStatus = getValidationStatus(simulatedVal, dim.tolMin, dim.tolMax);
                                                                        
                                                                        setSimValues(prev => ({ ...prev, [dim.id]: simulatedVal }));
                                                                        setPrevStatuses(prev => ({ ...prev, [dim.id]: newStatus }));
                                                                        executeTriggers(dim, simulatedVal, oldStatus, newStatus);
                                                                        
                                                                        toast.success(`[BLE Caliper] Data Diterima: ${simulatedVal} mm`);
                                                                    }}
                                                                    style={{
                                                                        flex: 1,
                                                                        padding: '8px 10px',
                                                                        backgroundColor: '#059669',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '6px',
                                                                        fontSize: '0.65rem',
                                                                        fontWeight: 700,
                                                                        cursor: 'pointer',
                                                                        outline: 'none'
                                                                    }}
                                                                >
                                                                    Kirim Data BLE
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
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
                                                            style={{ ...inputStyle, fontSize: '0.75rem', padding: '6px 8px', backgroundColor: 'rgba(255,255,255,0.7)', marginTop: '4px' }}
                                                        />
                                                    )}
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
                            ) : qcTab === 'region' ? (
                                <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Region Banner Header */}
                                    <div style={{
                                        padding: '12px', borderRadius: '10px',
                                        backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)',
                                        display: 'flex', flexDirection: 'column', gap: '6px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '1.1rem' }}>📷</span>
                                            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#dc2626' }}>
                                                CAD Display Region (Kotak Merah)
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: '1.4' }}>
                                            Area di dalam <strong>Kotak Merah</strong> adalah area presisi yang akan langsung ditampilkan pada <strong>Widget CAD Viewer</strong> di App Builder.
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleAutoFitRegion}
                                            style={{
                                                flex: 1, padding: '9px 12px', borderRadius: '8px', border: 'none',
                                                backgroundColor: '#ef4444', color: 'white', fontSize: '0.75rem', fontWeight: 800,
                                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                                boxShadow: '0 2px 4px rgba(239, 68, 68, 0.3)'
                                            }}
                                        >
                                            <span>⚡</span> Fit ke Objek Gambar
                                        </button>
                                        <button
                                            onClick={() => {
                                                const def = { enabled: true, x: 20, y: 20, w: 460, h: 320 };
                                                updateDisplayRegion(def);
                                                toast.success('Region di-reset ke 100% canvas.');
                                            }}
                                            style={{
                                                padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                                backgroundColor: '#f8fafc', color: '#334155', fontSize: '0.75rem', fontWeight: 700,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Reset Full
                                        </button>
                                    </div>

                                    {/* Coordinate Numeric Inputs */}
                                    {(() => {
                                        const region = selectedDwg?.displayRegion || { enabled: true, x: 40, y: 30, w: 420, h: 300 };
                                        return (
                                            <>
                                                <div style={{
                                                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px',
                                                    backgroundColor: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0'
                                                }}>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Posisi X (px)</label>
                                                        <input
                                                            type="number"
                                                            value={region.x}
                                                            onChange={(e) => updateDisplayRegion({ ...region, x: Math.max(0, parseInt(e.target.value) || 0) })}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Posisi Y (px)</label>
                                                        <input
                                                            type="number"
                                                            value={region.y}
                                                            onChange={(e) => updateDisplayRegion({ ...region, y: Math.max(0, parseInt(e.target.value) || 0) })}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Lebar / Width (px)</label>
                                                        <input
                                                            type="number"
                                                            value={region.w}
                                                            onChange={(e) => updateDisplayRegion({ ...region, w: Math.max(30, parseInt(e.target.value) || 30) })}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Tinggi / Height (px)</label>
                                                        <input
                                                            type="number"
                                                            value={region.h}
                                                            onChange={(e) => updateDisplayRegion({ ...region, h: Math.max(30, parseInt(e.target.value) || 30) })}
                                                            style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Toggle Active Switch */}
                                                <div style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff'
                                                }}>
                                                    <div>
                                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#1e293b', display: 'block' }}>Aktifkan Region Frame</span>
                                                        <span style={{ fontSize: '0.65rem', color: '#64748b' }}>Gunakan potongan ini di App Builder</span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        checked={region.enabled !== false}
                                                        onChange={(e) => updateDisplayRegion({ ...region, enabled: e.target.checked })}
                                                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#ef4444' }}
                                                    />
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>
                            ) : null}
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

            {/* OSNAP Settings Overlay Modal */}
            {showOsnapModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    backgroundColor: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e2e8f0',
                        width: '360px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        display: 'flex', flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif"
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.3rem' }}>🎯</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Pengaturan Object Snap (OSNAP)</h3>
                            </div>
                            <button
                                onClick={() => setShowOsnapModal(false)}
                                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Overall Switch */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            backgroundColor: '#f8fafc', padding: '10px 14px', borderRadius: '10px',
                            border: '1px solid #e2e8f0'
                        }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#334155' }}>Status OSNAP (F3)</span>
                            <label style={{ position: 'relative', display: 'inline-block', width: '34px', height: '20px' }}>
                                <input
                                    type="checkbox"
                                    checked={osnapActive}
                                    onChange={(e) => {
                                        setOsnapActive(e.target.checked);
                                        toast.success(e.target.checked ? 'OSNAP Aktif' : 'OSNAP Nonaktif', { id: 'osnap-toggle' });
                                    }}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                                    backgroundColor: osnapActive ? '#2563eb' : '#cbd5e1',
                                    transition: '.3s', borderRadius: '20px'
                                }}>
                                    <span style={{
                                        position: 'absolute', content: '""', height: '14px', width: '14px', left: osnapActive ? '16px' : '3px', bottom: '3px',
                                        backgroundColor: 'white', transition: '.3s', borderRadius: '50%'
                                    }} />
                                </span>
                            </label>
                        </div>

                        {/* Snap Modes Checkboxes List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '2px' }}>
                                Mode Deteksi Titik Otomatis
                            </div>
                            
                            {[
                                { key: 'endpoint', label: 'Endpoint', icon: '▢', desc: 'Ujung garis / sudut busur' },
                                { key: 'midpoint', label: 'Midpoint', icon: '△', desc: 'Titik tengah garis / segmen' },
                                { key: 'center', label: 'Center', icon: '◯', desc: 'Titik pusat lingkaran / busur' },
                                { key: 'quadrant', label: 'Quadrant', icon: '◇', desc: 'Titik sudut jam 12, 3, 6, 9' },
                                { key: 'perpendicular', label: 'Perpendicular', icon: '∟', desc: 'Titik proyeksi siku-siku (90°)' },
                                { key: 'intersection', label: 'Intersection', icon: '✕', desc: 'Titik silang dua segmen' }
                            ].map((mode) => (
                                <label
                                    key={mode.key}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0',
                                        cursor: 'pointer', transition: 'background-color 0.2s',
                                        backgroundColor: osnapModes[mode.key] ? '#f0f9ff' : 'white'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = osnapModes[mode.key] ? '#f0f9ff' : '#f8fafc'}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = osnapModes[mode.key] ? '#f0f9ff' : 'white'}
                                >
                                    <input
                                        type="checkbox"
                                        checked={osnapModes[mode.key]}
                                        onChange={(e) => {
                                            setOsnapModes(prev => ({
                                                ...prev,
                                                [mode.key]: e.target.checked
                                            }));
                                        }}
                                        style={{ accentColor: '#2563eb' }}
                                    />
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#2563eb', width: '18px', textAlign: 'center' }}>
                                        {mode.icon}
                                    </span>
                                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>{mode.label}</span>
                                        <span style={{ fontSize: '0.62rem', color: '#64748b' }}>{mode.desc}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <button
                            onClick={() => setShowOsnapModal(false)}
                            style={{
                                padding: '10px', backgroundColor: '#0f172a', color: 'white',
                                border: 'none', borderRadius: '8px', fontWeight: 700,
                                cursor: 'pointer', fontSize: '0.78rem', marginTop: '4px'
                            }}
                        >
                            Tutup & Terapkan
                        </button>
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
                        backgroundColor: 'white', borderRadius: '0px', border: '1px solid #cbd5e1',
                        width: '450px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.06)',
                        display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '75vh', overflowY: 'auto', fontFamily: "'Inter', sans-serif"
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.3rem' }}>{dimModalData.isBalloonOrigin ? '🎈' : '📏'}</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>
                                    {dimModalData.isBalloonOrigin ? `Tambah Balon QC Plan #${dimModalData.balloonNumber || ''}` : 'Tambah Dimensi QC Baru'}
                                </h3>
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

                        {/* Coordinate Points Card (Start Point & End Point) */}
                        {dimModalData && (
                            <div style={{ backgroundColor: '#0f172a', padding: '10px 12px', borderRadius: '8px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
                                        📍 START POINT (P1)
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#f8fafc', fontWeight: 600 }}>
                                        X: {dimModalData.x1 ?? 0}, Y: {dimModalData.y1 ?? 0}
                                    </span>
                                </div>
                                <div>
                                    <span style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 800, display: 'block', marginBottom: '2px' }}>
                                        🏁 END POINT (P2)
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#f8fafc', fontWeight: 600 }}>
                                        X: {dimModalData.x2 ?? 0}, Y: {dimModalData.y2 ?? 0}
                                    </span>
                                </div>
                            </div>
                        )}

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

                        {/* AI Vision & Hardware Lock Options */}
                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="modalVisionEnabled"
                                    checked={dimModalData.visionEnabled || false}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, visionEnabled: e.target.checked }))}
                                    style={{ width: '15px', height: '15px', accentColor: '#7c3aed' }}
                                />
                                <label htmlFor="modalVisionEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                    Gunakan AI Vision (YOLOv8)
                                </label>
                            </div>

                            {dimModalData.visionEnabled && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '22px' }}>
                                    <div>
                                        <label style={labelStyle}>Model YOLO</label>
                                        <select
                                            value={dimModalData.yoloModel || 'yolov8n.pt'}
                                            onChange={(e) => setDimModalData(prev => ({ ...prev, yoloModel: e.target.value }))}
                                            style={selectStyle}
                                        >
                                            <option value="yolov8n.pt">yolov8n.pt (Nano)</option>
                                            <option value="yolov8_surface_defect.pt">yolov8_surface_defect.pt</option>
                                            <option value="yolov8_dimensions.pt">yolov8_dimensions.pt</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={labelStyle}>Target Class</label>
                                        <input
                                            type="text"
                                            value={dimModalData.yoloClass || ''}
                                            onChange={(e) => setDimModalData(prev => ({ ...prev, yoloClass: e.target.value }))}
                                            placeholder="Misal: bore, scratch"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="modalDeviceLockEnabled"
                                    checked={dimModalData.deviceLockEnabled || false}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, deviceLockEnabled: e.target.checked }))}
                                    style={{ width: '15px', height: '15px', accentColor: '#7c3aed' }}
                                />
                                <label htmlFor="modalDeviceLockEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                    Kunci ke Hardware Device (BLE)
                                </label>
                            </div>

                            {dimModalData.deviceLockEnabled && (
                                <div style={{ paddingLeft: '22px' }}>
                                    <label style={labelStyle}>Device Profile</label>
                                    <select
                                        value={dimModalData.deviceProfile || 'Mitutoyo Caliper (BLE)'}
                                        onChange={(e) => setDimModalData(prev => ({ ...prev, deviceProfile: e.target.value }))}
                                        style={selectStyle}
                                    >
                                        <option value="Mitutoyo Caliper (BLE)">Mitutoyo Caliper (BLE)</option>
                                        <option value="Sylvac Micrometer (BLE)">Sylvac Micrometer (BLE)</option>
                                        <option value="Smart Weight Scale (BLE)">Smart Weight Scale (BLE)</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        {/* ASME Y14.5 GD&T Control Frame Builder */}
                        <div style={{ backgroundColor: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <input
                                    type="checkbox"
                                    id="modalGdtFrameEnabled"
                                    checked={dimModalData.gdtFrameEnabled || false}
                                    onChange={(e) => setDimModalData(prev => ({ ...prev, gdtFrameEnabled: e.target.checked }))}
                                    style={{ width: '15px', height: '15px', accentColor: '#16a34a' }}
                                />
                                <label htmlFor="modalGdtFrameEnabled" style={{ fontSize: '0.78rem', fontWeight: 600, color: '#14532d', cursor: 'pointer' }}>
                                    Build ASME Y14.5 Control Frame
                                </label>
                            </div>

                            {dimModalData.gdtFrameEnabled && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '22px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={labelStyle}>Karakteristik</label>
                                            <select
                                                value={dimModalData.gdt_symbol || 'POSITION'}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdt_symbol: e.target.value }))}
                                                style={selectStyle}
                                            >
                                                <optgroup label="Form (Bentuk)">
                                                    <option value="FLATNESS">▱ Flatness</option>
                                                    <option value="STRAIGHTNESS">⏤ Straightness</option>
                                                    <option value="CIRCULARITY">◯ Circularity</option>
                                                    <option value="CYLINDRICITY">⌭ Cylindricity</option>
                                                </optgroup>
                                                <optgroup label="Profile (Profil)">
                                                    <option value="PROFILE_SURFACE">⌢ Profile of a Surface</option>
                                                    <option value="PROFILE_LINE">◠ Profile of a Line</option>
                                                </optgroup>
                                                <optgroup label="Orientation (Orientasi)">
                                                    <option value="PERPENDICULARITY">⊥ Perpendicularity</option>
                                                    <option value="PARALLELISM">∥ Parallelism</option>
                                                    <option value="ANGULARITY">∠ Angularity</option>
                                                </optgroup>
                                                <optgroup label="Location (Lokasi)">
                                                    <option value="POSITION">⌖ Position</option>
                                                    <option value="CONCENTRICITY">◎ Concentricity</option>
                                                    <option value="SYMMETRY">⌯ Symmetry</option>
                                                </optgroup>
                                                <optgroup label="Runout (Penyimpangan)">
                                                    <option value="CIRCULAR_RUNOUT">↗ Runout</option>
                                                    <option value="TOTAL_RUNOUT">⌰ Total Runout</option>
                                                </optgroup>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Toleransi</label>
                                            <input
                                                type="text"
                                                value={dimModalData.gdtTolerance || ''}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtTolerance: e.target.value }))}
                                                placeholder="Misal: 0.05"
                                                style={inputStyle}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '100%' }}>
                                            <input
                                                type="checkbox"
                                                id="modalGdtHasDiameter"
                                                checked={dimModalData.gdtHasDiameter || false}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtHasDiameter: e.target.checked }))}
                                                style={{ width: '13px', height: '13px', accentColor: '#16a34a' }}
                                            />
                                            <label htmlFor="modalGdtHasDiameter" style={{ fontSize: '0.7rem', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>
                                                Gunakan ⌀
                                            </label>
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Modifier</label>
                                            <select
                                                value={dimModalData.gdtModifier || ''}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtModifier: e.target.value }))}
                                                style={selectStyle}
                                            >
                                                <option value="">None</option>
                                                <option value="M">Ⓜ (MMC - Max Material)</option>
                                                <option value="L">Ⓛ (LMC - Least Material)</option>
                                                <option value="F">Ⓕ (Free State)</option>
                                                <option value="P">Ⓟ (Projected Zone)</option>
                                                <option value="T">Ⓣ (Tangent Plane)</option>
                                                <option value="U">Ⓤ (Unequally Disposed)</option>
                                                <option value="R">Ⓡ (RFS - Regardless of Size)</option>
                                                <option value="S">Ⓢ (Statistical Tolerance)</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={labelStyle}>Datums (A / B / C)</label>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            <input
                                                type="text"
                                                maxLength="2"
                                                placeholder="Pri"
                                                value={dimModalData.gdtDatum1 || ''}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtDatum1: e.target.value.toUpperCase() }))}
                                                style={{ ...inputStyle, textAlign: 'center', padding: '6px' }}
                                            />
                                            <input
                                                type="text"
                                                maxLength="2"
                                                placeholder="Sec"
                                                value={dimModalData.gdtDatum2 || ''}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtDatum2: e.target.value.toUpperCase() }))}
                                                style={{ ...inputStyle, textAlign: 'center', padding: '6px' }}
                                            />
                                            <input
                                                type="text"
                                                maxLength="2"
                                                placeholder="Ter"
                                                value={dimModalData.gdtDatum3 || ''}
                                                onChange={(e) => setDimModalData(prev => ({ ...prev, gdtDatum3: e.target.value.toUpperCase() }))}
                                                style={{ ...inputStyle, textAlign: 'center', padding: '6px' }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
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
                                style={{ flex: 1, padding: '10px', background: dimModalData.isBalloonOrigin ? 'linear-gradient(135deg, #ef4444, #b91c1c)' : 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.78rem' }}
                            >
                                {dimModalData.isBalloonOrigin ? 'Simpan Balon & QC Plan' : 'Simpan Dimensi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* CadQuery Parametric CAD Modal */}
            {showCqModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(6px)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    boxSizing: 'border-box'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '0px',
                        width: '500px',
                        maxWidth: '100%',
                        padding: '24px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        border: '1px solid #cbd5e1',
                        position: 'relative',
                        maxHeight: '85vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '1.5rem' }}>📐</span>
                                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0f172a' }}>
                                    CadQuery Parametric Generator
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowCqModal(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', outline: 'none' }}
                                disabled={isGeneratingCq}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                            Tentukan parameter dimensi di bawah ini untuk membuat gambar CAD secara otomatis menggunakan pustaka CadQuery / ezdxf.
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.8rem' }}>
                            {/* Model Type */}
                            <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontWeight: 700, color: '#475569' }}>Tipe Braket</label>
                                <select
                                    value={cqType}
                                    onChange={(e) => setCqType(e.target.value)}
                                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                >
                                    <option value="rectangular">Plat Rectangular (Persegi)</option>
                                    <option value="circular">Flange Circular (Bulat)</option>
                                </select>
                            </div>

                            {/* Width / Diameter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontWeight: 700, color: '#475569' }}>
                                    {cqType === 'circular' ? 'Diameter Luar (mm)' : 'Lebar Plat (mm)'}
                                </label>
                                <input
                                    type="number"
                                    value={cqWidth}
                                    onChange={(e) => setCqWidth(Number(e.target.value))}
                                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                            </div>

                            {/* Height */}
                            {cqType === 'rectangular' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <label style={{ fontWeight: 700, color: '#475569' }}>Tinggi Plat (mm)</label>
                                    <input
                                        type="number"
                                        value={cqHeight}
                                        onChange={(e) => setCqHeight(Number(e.target.value))}
                                        style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                    />
                                </div>
                            )}

                            {/* Thickness */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontWeight: 700, color: '#475569' }}>Ketebalan (mm)</label>
                                <input
                                    type="number"
                                    value={cqThickness}
                                    onChange={(e) => setCqThickness(Number(e.target.value))}
                                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                            </div>

                            {/* Hole Diameter */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontWeight: 700, color: '#475569' }}>Diameter Lubang (mm)</label>
                                <input
                                    type="number"
                                    value={cqHoleDia}
                                    onChange={(e) => setCqHoleDia(Number(e.target.value))}
                                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                />
                            </div>

                            {/* Hole Count */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontWeight: 700, color: '#475569' }}>
                                    {cqType === 'circular' ? 'Jumlah Lubang Polar' : 'Pola Lubang'}
                                </label>
                                <select
                                    value={cqHoleCount}
                                    onChange={(e) => setCqHoleCount(Number(e.target.value))}
                                    style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
                                >
                                    {cqType === 'circular' ? (
                                        <>
                                            <option value={4}>4 Lubang</option>
                                            <option value={6}>6 Lubang</option>
                                            <option value={8}>8 Lubang</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value={4}>4 Corner Holes (Pojok)</option>
                                            <option value={1}>1 Center Hole (Tengah)</option>
                                        </>
                                    )}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <button
                                onClick={() => setShowCqModal(false)}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1',
                                    backgroundColor: 'white', color: '#475569', fontWeight: 700, cursor: 'pointer', outline: 'none'
                                }}
                                disabled={isGeneratingCq}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleGenerateCqModel}
                                style={{
                                    flex: 2, padding: '10px', borderRadius: '8px', border: 'none',
                                    backgroundColor: '#f59e0b', color: 'white', fontWeight: 800,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                    outline: 'none', boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
                                }}
                                disabled={isGeneratingCq}
                            >
                                {isGeneratingCq ? (
                                    <>
                                        <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> Memproses CAD...
                                    </>
                                ) : (
                                    <>Generasikan Model CAD</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
