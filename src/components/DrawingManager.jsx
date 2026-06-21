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
    X
} from 'lucide-react';
import toast from 'react-hot-toast';

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
        dimensions: (dwg.dimensions || []).map(migrateDimension)
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
            { id: 'dim_len', label: 'Overall Length (L)', spec: '120.0', tolMin: 119.5, tolMax: 120.5, variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 325, y1: 80, x2: 390, y2: 80, lx: 360, ly: 80 },
            { id: 'dim_dia', label: 'Flange Diameter (D)', spec: '80.0', tolMin: 79.8, tolMax: 80.2, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 30, y1: 100, x2: 30, y2: 260, lx: 30, ly: 180 },
            { id: 'dim_bore', label: 'Center Bore (B)', spec: '25.0', tolMin: 24.9, tolMax: 25.1, variable: 'Meas_Bore', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 135, y1: 165, x2: 95, y2: 115, lx: 75, ly: 115 },
            { id: 'dim_angle_1', label: 'Chamfer Angle', spec: '45.0', tolMin: 44.0, tolMax: 46.0, variable: 'Meas_Angle', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 370, y1: 130, x2: 410, y2: 170, lx: 420, ly: 140, cx: 370, cy: 170, angleStart: -45, angleEnd: 0 },
            { id: 'dim_ra_1', label: 'Surface Finish Ra', spec: '1.6', tolMin: 0.0, tolMax: 3.2, variable: 'Meas_Ra', unit: 'μm', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 200, y1: 290, x2: 200, y2: 290, lx: 200, ly: 310 },
        ]
    },
    {
        id: 'dwg_hydraulic_cylinder',
        name: 'Hydraulic Cylinder Blueprint',
        fileName: 'hydraulic-cyl-assembly.pdf',
        fileType: 'PDF',
        uploadedAt: '2026-06-19T08:15:00Z',
        dimensions: [
            { id: 'hc_bore', label: 'Cylinder Bore', spec: '80.0', tolMin: 79.95, tolMax: 80.05, variable: 'Cylinder_Bore_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 50, y1: 100, x2: 50, y2: 220, lx: 30, ly: 160 },
            { id: 'hc_rod', label: 'Rod Diameter', spec: '56.0', tolMin: 55.98, tolMax: 56.02, variable: 'Rod_Diameter_Spec', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 390, y1: 130, x2: 390, y2: 190, lx: 390, ly: 160 },
            { id: 'hc_stroke', label: 'Stroke Length', spec: '500.0', tolMin: 499.5, tolMax: 500.5, variable: 'Stroke_Length_Actual', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 60, y1: 240, x2: 280, y2: 240, lx: 170, ly: 240 },
            { id: 'hc_area', label: 'Piston Area', spec: '5026.5', tolMin: 5000.0, tolMax: 5050.0, variable: 'Meas_Area', unit: 'mm²', category: 'area', measureType: 'area', indicatorType: 'area_box', gdt_symbol: '', x1: 100, y1: 120, x2: 230, y2: 200, lx: 165, ly: 160 },
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
        return DEFAULT_DRAWINGS;
    });

    const [selectedDwgId, setSelectedDwgId] = useState(() => drawings.length > 0 ? drawings[0].id : '');
    const selectedDwg = drawings.find(d => d.id === selectedDwgId) || drawings[0];

    const [activeDimId, setActiveDimId] = useState(() => {
        const dwg = drawings.find(d => d.id === (drawings.length > 0 ? drawings[0].id : ''));
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

    // Close add picker and management menu on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (addPickerRef.current && !addPickerRef.current.contains(e.target)) {
                setShowAddPicker(false);
            }
            if (mgmtMenuRef.current && !mgmtMenuRef.current.contains(e.target)) {
                setShowMgmtMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
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

    const handleSaveMapping = () => {
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
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        toast.success(`Parameter "${editLabel}" berhasil disimpan.`);
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

    const handleCanvasClick = (e) => {
        if (!activeDim) return;
        const svg = e.currentTarget;
        const rect = svg.getBoundingClientRect();
        const x = Math.round(((e.clientX - rect.left) / rect.width) * 500);
        const y = Math.round(((e.clientY - rect.top) / rect.height) * 360);
        
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

    const handleDeleteDwg = (dwgId, e) => {
        e.stopPropagation();
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
        toast.success('Gambar drawing berhasil dihapus.');
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

    const handleResetToDefault = () => {
        if (window.confirm('Apakah Anda yakin ingin mereset semua blueprint ke template bawaan? Perubahan kustom Anda akan hilang.')) {
            setDrawings(DEFAULT_DRAWINGS);
            setSelectedDwgId(DEFAULT_DRAWINGS[0].id);
            setActiveDimId(DEFAULT_DRAWINGS[0].dimensions.length > 0 ? DEFAULT_DRAWINGS[0].dimensions[0].id : '');
            toast.success('Blueprint berhasil direset ke template bawaan.');
            setShowMgmtMenu(false);
        }
    };

    const handleClearAllDrawings = () => {
        if (window.confirm('Apakah Anda yakin ingin menghapus semua gambar blueprint?')) {
            setDrawings([]);
            setSelectedDwgId('');
            setActiveDimId('');
            toast.success('Semua gambar blueprint telah dihapus.');
            setShowMgmtMenu(false);
        }
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
            const fileContent = event.target.result || '';
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
                        { id: `dim_gen_2_${Date.now()}`, label: 'Core Diameter', spec: '12.0', tolMin: 11.9, tolMax: 12.1, variable: 'Inner_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 250, y2: 170, lx: 260, ly: 155 },
                    ];
                }
            }

            setParseProgress(95);
            setParseStatusText('Membangun pemetaan koordinat interaktif...');

            setTimeout(() => {
                setParseProgress(100);
                setIsParsing(false);
                const newDwgId = `dwg_${Date.now()}`;
                const newDwg = {
                    id: newDwgId,
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint',
                    fileName: file.name,
                    fileType: extension.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: extractedDims
                };
                setDrawings(prev => [newDwg, ...prev]);
                setSelectedDwgId(newDwgId);
                if (extractedDims.length > 0) setActiveDimId(extractedDims[0].id);
                else setActiveDimId('');
                toast.success(`${file.name} berhasil! Ditemukan ${extractedDims.length} parameter.`);
            }, 800);
        };
        reader.onerror = () => { setIsParsing(false); toast.error('Gagal membaca berkas.'); };
        reader.readAsText(file);
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

        return (
            <g>
                {shapeElement}
                <text x={lx} y={ly + textYOffset} textAnchor="middle" fill={color} fontSize={fontSizeValue} fontWeight="bold">
                    {labelText}
                </text>
                {categoryBadge}
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
            <div style={{ padding: '20px 24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
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
                    <p style={{ margin: '5px 0 0 0', color: '#64748b', fontSize: '0.82rem' }}>
                        Pemetaan parameter QC multi-tipe: dimensi, sudut, area, diameter, roughness — langsung ke variabel QMS.
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    {/* Category legend */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxWidth: '350px' }}>
                        {PARAM_CATEGORIES.filter(c => c.key !== 'custom').map(cat => (
                            <span key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.62rem', fontWeight: 700, color: cat.color, backgroundColor: `${cat.color}12`, padding: '2px 7px', borderRadius: '6px', border: `1px solid ${cat.color}30` }}>
                                <span style={{ fontSize: '0.7rem' }}>{cat.icon}</span> {cat.label}
                            </span>
                        ))}
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
                            <Sliders size={14} /> Manajemen Drawing <ChevronDown size={12} />
                        </button>
                        {showMgmtMenu && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                                backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
                                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                padding: '6px 0', zIndex: 100, width: '200px', display: 'flex', flexDirection: 'column'
                            }}>
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
            <div style={{ flex: 1, padding: '20px', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '20px', overflow: 'hidden' }}>
                
                {/* Left Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                    
                    {/* Upload Zone */}
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            border: `2px dashed ${isDragOver ? '#2563eb' : '#cbd5e1'}`,
                            borderRadius: '12px', padding: '20px', textAlign: 'center', cursor: 'pointer',
                            backgroundColor: isDragOver ? '#eff6ff' : 'white', transition: 'all 0.2s',
                        }}
                    >
                        <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} accept=".svg,.dxf,.pdf" />
                        <Upload size={28} color={isDragOver ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 8px' }} />
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#1e293b', marginBottom: '3px' }}>Unggah Blueprint Baru</div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Seret & taruh file di sini atau klik.<br />Mendukung: <b>.DXF, .SVG, .PDF</b></div>
                    </div>

                    {/* Parser */}
                    {isParsing && (
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', fontWeight: 800, color: '#1e293b' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} /> Mengonversi File...</span>
                                <span>{parseProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '5px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${parseProgress}%`, height: '100%', background: 'linear-gradient(90deg, #2563eb, #7c3aed)', transition: 'width 0.3s' }}></div>
                            </div>
                            <span style={{ fontSize: '0.62rem', color: '#64748b', fontStyle: 'italic' }}>{parseStatusText}</span>
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {/* Library List */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        <div style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>Daftar CAD Blueprint</h3>
                            <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '10px', color: '#475569' }}>
                                {drawings.length} Berkas
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
                            {drawings.map((dwg) => {
                                const isSelected = dwg.id === selectedDwgId;
                                // Count categories
                                const catCounts = {};
                                (dwg.dimensions || []).forEach(d => { const c = d.category || 'dimension'; catCounts[c] = (catCounts[c] || 0) + 1; });
                                return (
                                    <div
                                        key={dwg.id}
                                        onClick={() => { setSelectedDwgId(dwg.id); if (dwg.dimensions.length > 0) setActiveDimId(dwg.dimensions[0].id); }}
                                        style={{
                                            padding: '10px 12px', borderRadius: '8px',
                                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                            border: `1px solid ${isSelected ? '#bfdbfe' : 'transparent'}`,
                                            cursor: 'pointer', marginBottom: '6px', transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                                                <FileCode size={15} color={isSelected ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                                                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: isSelected ? '#1d4ed8' : '#1e293b', wordBreak: 'break-word' }}>{dwg.name}</div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteDwg(dwg.id, e)} title="Hapus Blueprint"
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '3px', borderRadius: '4px', display: 'flex', alignItems: 'center', color: '#94a3b8', transition: 'color 0.2s', flexShrink: 0 }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#64748b', paddingLeft: '22px' }}>
                                            <span>{dwg.fileName} ({dwg.fileType})</span>
                                            <span>{dwg.dimensions.length} param</span>
                                        </div>
                                        {/* Category badges */}
                                        {Object.keys(catCounts).length > 0 && (
                                            <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '5px', paddingLeft: '22px' }}>
                                                {Object.entries(catCounts).map(([cat, count]) => {
                                                    const catDef = getCategoryDef(cat);
                                                    return (
                                                        <span key={cat} style={{ fontSize: '0.58rem', fontWeight: 700, color: catDef.color, backgroundColor: `${catDef.color}15`, padding: '1px 5px', borderRadius: '4px', border: `1px solid ${catDef.color}30` }}>
                                                            {catDef.icon} {count}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Area: Canvas + Properties */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', overflow: 'hidden' }}>
                    
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

                        {/* Canvas SVG */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', position: 'relative', width: '100%', height: '100%' }}>
                            <svg viewBox="0 0 500 360" onClick={handleCanvasClick} style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', cursor: activeDim ? 'crosshair' : 'default' }}>
                                <defs>
                                    <pattern id="canvas_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.25" />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#canvas_grid)" />
                                <rect x="5" y="5" width="490" height="350" fill="none" stroke="#1e40af" strokeWidth="1" />
                                <rect x="8" y="8" width="484" height="344" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.5" />

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
                                ) : (
                                    <g transform="translate(40, 20)">
                                        <rect x="120" y="80" width="240" height="180" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                        <circle cx="240" cy="170" r="45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                                        <line x1="240" y1="50" x2="240" y2="290" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
                                        <line x1="80" y1="170" x2="400" y2="170" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
                                    </g>
                                )}

                                {/* Dynamic Indicators */}
                                {selectedDwg && renderDimensionIndicators(selectedDwg.dimensions)}
                            </svg>
                        </div>

                        {/* Tips footer */}
                        <div style={{ padding: '10px 16px', backgroundColor: 'rgba(30, 58, 138, 0.2)', borderTop: '1px solid #1e3a8a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <HelpCircle size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.68rem', color: '#93c5fd' }}>
                                <b>Tips:</b> Klik label pada canvas untuk memilih, lalu <b>klik di mana saja</b> untuk reposisi. Warna berubah berdasarkan status QC.
                            </span>
                        </div>
                    </div>

                    {/* Right Panel: Properties + Simulation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
                        
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

                                    return (
                                        <div key={dim.id} style={{ backgroundColor: activeDimId === dim.id ? '#f0f9ff' : '#f8fafc', padding: '8px', borderRadius: '6px', border: `1px solid ${activeDimId === dim.id ? '#bfdbfe' : '#e2e8f0'}`, cursor: 'pointer' }} onClick={() => setActiveDimId(dim.id)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', fontWeight: 800, marginBottom: '4px' }}>
                                                <span style={{ color: '#1e293b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span style={{ color: catDef.color, fontSize: '0.75rem' }}>{catDef.icon}</span>
                                                    {dim.label}
                                                    <span style={{ color: '#94a3b8', fontWeight: 600 }}>[{dim.tolMin}–{dim.tolMax} {dim.unit}]</span>
                                                </span>
                                                <span style={{ color: status === 'PASS' ? '#10b981' : status === 'FAIL' ? '#ef4444' : '#94a3b8', fontWeight: 900, fontSize: '0.7rem' }}>{status}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={simVal}
                                                onChange={(e) => setSimValues(prev => ({ ...prev, [dim.id]: parseFloat(e.target.value) || 0 }))}
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
        </div>
    );
}
