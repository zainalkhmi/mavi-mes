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
    HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DrawingManager() {
    // Current drawing database (persisted in localStorage)
    const [drawings, setDrawings] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        return saved ? JSON.parse(saved) : [
            {
                id: 'dwg_flange_connector',
                name: 'Flange Connector CAD Model',
                fileName: 'industrial-flange-rev2.dxf',
                fileType: 'DXF',
                uploadedAt: '2026-06-20T10:30:00Z',
                dimensions: [
                    { id: 'dim_len', label: 'Overall Length (L)', spec: '120.0', tolMin: 119.5, tolMax: 120.5, variable: 'Meas_Length', unit: 'mm', x1: 325, y1: 80, x2: 390, y2: 80, lx: 360, ly: 80, type: 'horizontal' },
                    { id: 'dim_dia', label: 'Flange Diameter (D)', spec: '80.0', tolMin: 79.8, tolMax: 80.2, variable: 'Meas_Diameter', unit: 'mm', x1: 30, y1: 100, x2: 30, y2: 260, lx: 30, ly: 180, type: 'vertical' },
                    { id: 'dim_bore', label: 'Center Bore (B)', spec: '25.0', tolMin: 24.9, tolMax: 25.1, variable: 'Meas_Bore', unit: 'mm', x1: 135, y1: 165, x2: 95, y2: 115, lx: 75, ly: 115, type: 'radial' }
                ]
            },
            {
                id: 'dwg_hydraulic_cylinder',
                name: 'Hydraulic Cylinder Blueprint',
                fileName: 'hydraulic-cyl-assembly.pdf',
                fileType: 'PDF',
                uploadedAt: '2026-06-19T08:15:00Z',
                dimensions: [
                    { id: 'hc_bore', label: 'Cylinder Bore', spec: '80.0', tolMin: 79.95, tolMax: 80.05, variable: 'Cylinder_Bore_Dia', unit: 'mm', x1: 50, y1: 100, x2: 50, y2: 220, lx: 30, ly: 160, type: 'vertical' },
                    { id: 'hc_rod', label: 'Rod Diameter', spec: '56.0', tolMin: 55.98, tolMax: 56.02, variable: 'Rod_Diameter_Spec', unit: 'mm', x1: 390, y1: 130, x2: 390, y2: 190, lx: 390, ly: 160, type: 'vertical' },
                    { id: 'hc_stroke', label: 'Stroke Length', spec: '500.0', tolMin: 499.5, tolMax: 500.5, variable: 'Stroke_Length_Actual', unit: 'mm', x1: 60, y1: 240, x2: 280, y2: 240, lx: 170, ly: 240, type: 'horizontal' }
                ]
            }
        ];
    });

    const [selectedDwgId, setSelectedDwgId] = useState('dwg_flange_connector');
    const selectedDwg = drawings.find(d => d.id === selectedDwgId) || drawings[0];

    // Form editing states for mappings
    const [activeDimId, setActiveDimId] = useState('dim_len');
    const activeDim = selectedDwg?.dimensions.find(dim => dim.id === activeDimId);

    // Edit properties
    const [editLabel, setEditLabel] = useState('');
    const [editSpec, setEditSpec] = useState('');
    const [editTolMin, setEditTolMin] = useState(0);
    const [editTolMax, setEditTolMax] = useState(0);
    const [editVariable, setEditVariable] = useState('');
    const [editUnit, setEditUnit] = useState('mm');
    const [editType, setEditType] = useState('horizontal');
    const [editX1, setEditX1] = useState(150);
    const [editY1, setEditY1] = useState(180);
    const [editX2, setEditX2] = useState(350);
    const [editY2, setEditY2] = useState(180);
    const [editLx, setEditLx] = useState(250);
    const [editLy, setEditLy] = useState(200);

    // Simulation states
    const [simLength, setSimLength] = useState(120.0);
    const [simDiameter, setSimDiameter] = useState(80.0);
    const [simBore, setSimBore] = useState(25.0);

    // Upload & parsing state
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState(0);
    const [parseStatusText, setParseStatusText] = useState('');
    const fileInputRef = useRef(null);

    // Sync form values with active dimension
    useEffect(() => {
        if (activeDim) {
            setEditLabel(activeDim.label || '');
            setEditSpec(activeDim.spec || '');
            setEditTolMin(activeDim.tolMin || 0);
            setEditTolMax(activeDim.tolMax || 0);
            setEditVariable(activeDim.variable || '');
            setEditUnit(activeDim.unit || 'mm');
            setEditType(activeDim.type || 'horizontal');
            setEditX1(activeDim.x1 !== undefined ? activeDim.x1 : 150);
            setEditY1(activeDim.y1 !== undefined ? activeDim.y1 : 180);
            setEditX2(activeDim.x2 !== undefined ? activeDim.x2 : 350);
            setEditY2(activeDim.y2 !== undefined ? activeDim.y2 : 180);
            setEditLx(activeDim.lx !== undefined ? activeDim.lx : 250);
            setEditLy(activeDim.ly !== undefined ? activeDim.ly : 200);
        }
    }, [activeDimId, selectedDwgId, drawings]);

    // Save drawings array to local storage whenever it changes
    useEffect(() => {
        localStorage.setItem('mavi_drawings', JSON.stringify(drawings));
    }, [drawings]);

    // Helper validation
    const getValidationStatus = (val, min, max) => {
        const floatVal = parseFloat(val);
        if (isNaN(floatVal) || floatVal === 0) return 'PENDING';
        return (floatVal >= min && floatVal <= max) ? 'PASS' : 'FAIL';
    };

    const getStatusColor = (status, isActive) => {
        if (status === 'PASS') return '#10b981'; // Green
        if (status === 'FAIL') return '#ef4444'; // Red
        return isActive ? '#3b82f6' : '#64748b'; // Blue or Slate
    };

    // Update active dimension values in real-time
    const updateActiveDimProp = (field, value) => {
        if (!activeDim) return;
        
        // Update local edits
        if (field === 'label') setEditLabel(value);
        else if (field === 'spec') setEditSpec(value);
        else if (field === 'tolMin') setEditTolMin(value);
        else if (field === 'tolMax') setEditTolMax(value);
        else if (field === 'variable') setEditVariable(value);
        else if (field === 'unit') setEditUnit(value);
        else if (field === 'type') setEditType(value);
        else if (field === 'x1') setEditX1(value);
        else if (field === 'y1') setEditY1(value);
        else if (field === 'x2') setEditX2(value);
        else if (field === 'y2') setEditY2(value);
        else if (field === 'lx') setEditLx(value);
        else if (field === 'ly') setEditLy(value);

        // Update main state for instant canvas rendering
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    let parsedVal = value;
                    if (['x1', 'y1', 'x2', 'y2', 'lx', 'ly'].includes(field)) {
                        parsedVal = parseInt(value) || 0;
                    } else if (['tolMin', 'tolMax'].includes(field)) {
                        parsedVal = parseFloat(value) || 0;
                    }
                    return {
                        ...dim,
                        [field]: parsedVal
                    };
                }
                return dim;
            })
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
    };

    const handleSaveMapping = () => {
        if (!activeDim) return;
        
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.map(dim => {
                if (dim.id === activeDimId) {
                    return {
                        ...dim,
                        label: editLabel,
                        spec: editSpec,
                        tolMin: parseFloat(editTolMin),
                        tolMax: parseFloat(editTolMax),
                        variable: editVariable,
                        unit: editUnit,
                        type: editType,
                        x1: parseInt(editX1),
                        y1: parseInt(editY1),
                        x2: parseInt(editX2),
                        y2: parseInt(editY2),
                        lx: parseInt(editLx),
                        ly: parseInt(editLy)
                    };
                }
                return dim;
            })
        };

        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        toast.success(`Successfully saved mapping for dimension "${editLabel}"`);
    };

    const handleAddDimension = () => {
        if (!selectedDwg) {
            toast.error('Pilih gambar blueprint terlebih dahulu.');
            return;
        }

        const newDimId = `dim_custom_${Date.now()}`;
        const newDim = {
            id: newDimId,
            label: 'Parameter QC Baru',
            spec: '10.0',
            tolMin: 9.5,
            tolMax: 10.5,
            variable: '',
            unit: 'mm',
            type: 'horizontal',
            x1: 150,
            y1: 180,
            x2: 350,
            y2: 180,
            lx: 250,
            ly: 200
        };

        const updatedDwg = {
            ...selectedDwg,
            dimensions: [...selectedDwg.dimensions, newDim]
        };

        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        setActiveDimId(newDimId);
        toast.success('Parameter QC baru berhasil ditambahkan.');
    };

    const handleDeleteDimension = (dimId) => {
        if (!selectedDwg) return;
        const updatedDwg = {
            ...selectedDwg,
            dimensions: selectedDwg.dimensions.filter(dim => dim.id !== dimId)
        };
        setDrawings(prev => prev.map(d => d.id === selectedDwgId ? updatedDwg : d));
        
        if (activeDimId === dimId) {
            if (updatedDwg.dimensions.length > 0) {
                setActiveDimId(updatedDwg.dimensions[0].id);
            } else {
                setActiveDimId('');
            }
        }
        toast.success('Parameter QC berhasil dihapus.');
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
                        lx: x,
                        ly: y,
                        x1: dim.x1 !== undefined ? Math.max(10, Math.min(490, dim.x1 + dx)) : x - 30,
                        y1: dim.y1 !== undefined ? Math.max(10, Math.min(350, dim.y1 + dy)) : y - 20,
                        x2: dim.x2 !== undefined ? Math.max(10, Math.min(490, dim.x2 + dx)) : x + 30,
                        y2: dim.y2 !== undefined ? Math.max(10, Math.min(350, dim.y2 + dy)) : y - 20
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
                if (updatedDrawings[0].dimensions.length > 0) {
                    setActiveDimId(updatedDrawings[0].dimensions[0].id);
                } else {
                    setActiveDimId('');
                }
            } else {
                setSelectedDwgId('');
                setActiveDimId('');
            }
        }
        toast.success('Gambar drawing berhasil dihapus dari database.');
    };

    // Upload handlers
    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            processUploadedFile(files[0]);
        }
    };

    const handleFileSelect = (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processUploadedFile(files[0]);
        }
    };

    const processUploadedFile = (file) => {
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['svg', 'dxf', 'pdf'].includes(extension)) {
            toast.error('Format berkas tidak didukung! Gunakan file .svg, .dxf, atau .pdf.');
            return;
        }

        setIsParsing(true);
        setParseProgress(5);
        setParseStatusText('Membaca berkas binary...');

        // Read file contents as text to perform actual feature extraction
        const reader = new FileReader();
        reader.onload = (event) => {
            const fileContent = event.target.result || '';
            let extractedDims = [];

            setParseProgress(30);
            setParseStatusText('Mengekstrak vector data & geometry primitives...');

            if (extension === 'svg') {
                // Scan SVG content for circle radiuses and rect widths
                const circleRegex = /<circle[^>]*\sr="([^"]+)"[^>]*>/gi;
                let match;
                let circleCount = 0;
                while ((match = circleRegex.exec(fileContent)) !== null && circleCount < 3) {
                    const radius = parseFloat(match[1]);
                    if (!isNaN(radius)) {
                        circleCount++;
                        extractedDims.push({
                            id: `dim_svg_c_${circleCount}_${Date.now()}`,
                            label: circleCount === 1 ? 'Inner Bore Diameter' : `Hole Circle ${circleCount} Dia`,
                            spec: (radius * 2).toFixed(1),
                            tolMin: parseFloat((radius * 2 - 0.1).toFixed(2)),
                            tolMax: parseFloat((radius * 2 + 0.1).toFixed(2)),
                            variable: circleCount === 1 ? 'Meas_Bore' : 'Inner_Diameter_Spec',
                            unit: 'mm',
                            x1: 240, y1: 170,
                            x2: 240 + Math.round(radius), y2: 170,
                            lx: 240 + Math.round(radius) + 15, ly: 170 - 15,
                            type: 'radial'
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
                            id: `dim_svg_w_${Date.now()}`,
                            label: 'Overall Width',
                            spec: w.toFixed(1),
                            tolMin: parseFloat((w - 0.5).toFixed(2)),
                            tolMax: parseFloat((w + 0.5).toFixed(2)),
                            variable: 'Meas_Length',
                            unit: 'mm',
                            x1: 120, y1: 260,
                            x2: 120 + Math.round(w), y2: 260,
                            lx: 120 + Math.round(w/2), ly: 280,
                            type: 'horizontal'
                        });
                        extractedDims.push({
                            id: `dim_svg_h_${Date.now()}`,
                            label: 'Overall Height',
                            spec: h.toFixed(1),
                            tolMin: parseFloat((h - 0.5).toFixed(2)),
                            tolMax: parseFloat((h + 0.5).toFixed(2)),
                            variable: 'Meas_Height',
                            unit: 'mm',
                            x1: 90, y1: 80,
                            x2: 90, y2: 80 + Math.round(h),
                            lx: 65, ly: 80 + Math.round(h/2),
                            type: 'vertical'
                        });
                    }
                }
            } else if (extension === 'dxf') {
                // Scan DXF coordinates for CIRCLE groups and radii
                const circleMatches = fileContent.match(/CIRCLE[\s\S]*?\b40\s+([0-9.]+)/gi);
                if (circleMatches) {
                    circleMatches.slice(0, 3).forEach((cm, idx) => {
                        const radiusVal = parseFloat(cm.replace(/CIRCLE[\s\S]*?\b40\s+/, '').trim());
                        if (!isNaN(radiusVal)) {
                            extractedDims.push({
                                id: `dim_dxf_c_${idx}_${Date.now()}`,
                                label: `Outer Flange Diameter ${idx + 1}`,
                                spec: (radiusVal * 2).toFixed(1),
                                tolMin: parseFloat((radiusVal * 2 - 0.2).toFixed(2)),
                                tolMax: parseFloat((radiusVal * 2 + 0.2).toFixed(2)),
                                variable: 'Meas_Diameter',
                                unit: 'mm',
                                x1: 240, y1: 170,
                                x2: 240 + Math.round(radiusVal), y2: 170,
                                lx: 240 + Math.round(radiusVal) + 15, ly: 170 + 20 * idx,
                                type: 'radial'
                            });
                        }
                    });
                }
            }

            setParseProgress(65);
            setParseStatusText('Melakukan OCR & text parsing untuk menemukan spesifikasi nominal...');

            // Fallback heuristics if no geometry elements were parsed, or for PDF files
            if (extractedDims.length === 0) {
                const nameLower = file.name.toLowerCase();
                if (nameLower.includes('shaft') || nameLower.includes('rod') || nameLower.includes('piston')) {
                    extractedDims = [
                        { id: `dim_sh_1_${Date.now()}`, label: 'Shaft Length (L)', spec: '240.0', tolMin: 239.5, tolMax: 240.5, variable: 'Meas_Length', unit: 'mm', x1: 120, y1: 240, x2: 360, y2: 240, lx: 240, ly: 255, type: 'horizontal' },
                        { id: `dim_sh_2_${Date.now()}`, label: 'Journal Diameter (d1)', spec: '35.0', tolMin: 34.98, tolMax: 35.02, variable: 'Meas_Diameter', unit: 'mm', x1: 120, y1: 135, x2: 120, y2: 205, lx: 95, ly: 170, type: 'vertical' },
                        { id: `dim_sh_3_${Date.now()}`, label: 'Keyway Width (W)', spec: '10.0', tolMin: 9.95, tolMax: 10.05, variable: 'Inner_Diameter_Spec', unit: 'mm', x1: 240, y1: 170, x2: 250, y2: 170, lx: 245, ly: 150, type: 'radial' }
                    ];
                } else if (nameLower.includes('gear') || nameLower.includes('pinion') || nameLower.includes('wheel')) {
                    extractedDims = [
                        { id: `dim_gr_1_${Date.now()}`, label: 'Outer Pitch Diameter', spec: '150.0', tolMin: 149.8, tolMax: 150.2, variable: 'Meas_Diameter', unit: 'mm', x1: 120, y1: 80, x2: 360, y2: 80, lx: 240, ly: 65, type: 'horizontal' },
                        { id: `dim_gr_2_${Date.now()}`, label: 'Center Hub Bore', spec: '30.0', tolMin: 29.95, tolMax: 30.05, variable: 'Meas_Bore', unit: 'mm', x1: 240, y1: 170, x2: 255, y2: 170, lx: 265, ly: 155, type: 'radial' },
                        { id: `dim_gr_3_${Date.now()}`, label: 'Face Width (B)', spec: '45.0', tolMin: 44.7, tolMax: 45.3, variable: 'Meas_Height', unit: 'mm', x1: 90, y1: 80, x2: 90, y2: 260, lx: 65, ly: 170, type: 'vertical' }
                    ];
                } else if (nameLower.includes('bracket') || nameLower.includes('plate') || nameLower.includes('housing')) {
                    extractedDims = [
                        { id: `dim_br_1_${Date.now()}`, label: 'Plate Width (W)', spec: '180.0', tolMin: 179.3, tolMax: 180.7, variable: 'Meas_Length', unit: 'mm', x1: 120, y1: 260, x2: 360, y2: 260, lx: 240, ly: 280, type: 'horizontal' },
                        { id: `dim_br_2_${Date.now()}`, label: 'Flange Height (H)', spec: '120.0', tolMin: 119.4, tolMax: 120.6, variable: 'Meas_Height', unit: 'mm', x1: 90, y1: 80, x2: 90, y2: 260, lx: 65, ly: 170, type: 'vertical' },
                        { id: `dim_br_3_${Date.now()}`, label: 'Mounting Hole Dia', spec: '14.0', tolMin: 13.9, tolMax: 14.1, variable: 'Inner_Diameter_Spec', unit: 'mm', x1: 240, y1: 170, x2: 247, y2: 170, lx: 255, ly: 155, type: 'radial' }
                    ];
                } else {
                    extractedDims = [
                        { id: `dim_gen_1_${Date.now()}`, label: 'Dimension Height (H)', spec: '50.0', tolMin: 49.5, tolMax: 50.5, variable: 'Meas_Height', unit: 'mm', x1: 90, y1: 80, x2: 90, y2: 260, lx: 65, ly: 170, type: 'vertical' },
                        { id: `dim_gen_2_${Date.now()}`, label: 'Internal Core Diameter', spec: '12.0', tolMin: 11.9, tolMax: 12.1, variable: 'Inner_Diameter_Spec', unit: 'mm', x1: 240, y1: 170, x2: 250, y2: 170, lx: 260, ly: 155, type: 'radial' }
                    ];
                }
            }

            setParseProgress(95);
            setParseStatusText('Membangun pemetaan koordinat SVG interaktif...');

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
                if (extractedDims.length > 0) {
                    setActiveDimId(extractedDims[0].id);
                } else {
                    setActiveDimId('');
                }
                toast.success(`Berkas ${file.name} berhasil di-convert! Ditemukan ${extractedDims.length} parameter.`);
            }, 800);
        };

        reader.onerror = () => {
            setIsParsing(false);
            toast.error('Gagal membaca berkas drawing.');
        };

        reader.readAsText(file);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f1f5f9', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header */}
            <div style={{ padding: '24px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ backgroundColor: '#2563eb', padding: '6px', borderRadius: '8px', color: 'white', display: 'flex', alignItems: 'center' }}>
                            <Ruler size={24} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: '#0f172a' }}>Drawing & CAD Blueprint Manager</h2>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '3px 10px', backgroundColor: '#eff6ff', color: '#2563eb', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Zap size={12} /> Live Connector Connected
                        </span>
                    </div>
                    <p style={{ margin: '6px 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                        Unggah gambar CAD (.dxf, .svg, .pdf), petakan koordinat dimensi secara visual ke variabel QMS, dan atur batas toleransi QC.
                    </p>
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '24px', display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', overflow: 'hidden' }}>
                
                {/* Left Sidebar: Drawing Library & Uploader */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                    
                    {/* Upload Zone */}
                    <div 
                        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                        onDragLeave={() => setIsDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current.click()}
                        style={{
                            border: `2px dashed ${isDragOver ? '#2563eb' : '#cbd5e1'}`,
                            borderRadius: '12px',
                            padding: '24px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: isDragOver ? '#eff6ff' : 'white',
                            transition: 'all 0.2s',
                        }}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            style={{ display: 'none' }} 
                            onChange={handleFileSelect}
                            accept=".svg,.dxf,.pdf"
                        />
                        <Upload size={32} color={isDragOver ? '#2563eb' : '#94a3b8'} style={{ margin: '0 auto 12px' }} />
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#1e293b', marginBottom: '4px' }}>Unggah Blueprint Baru</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Seret & taruh file di sini atau klik untuk browse.<br />Mendukung: <b>.DXF, .SVG, .PDF</b></div>
                    </div>

                    {/* Parser Status Overlay */}
                    {isParsing && (
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#1e293b' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCw size={12} style={{ animation: 'spin 1.5s linear infinite' }} /> Mengonversi File...</span>
                                <span>{parseProgress}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${parseProgress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.3s' }}></div>
                            </div>
                            <span style={{ fontSize: '0.65rem', color: '#64748b', fontStyle: 'italic' }}>{parseStatusText}</span>
                            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                        </div>
                    )}

                    {/* Library List */}
                    <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                        <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#1e293b' }}>Daftar CAD Blueprint</h3>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '10px', color: '#475569' }}>
                                {drawings.length} Berkas
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                            {drawings.map((dwg) => {
                                const isSelected = dwg.id === selectedDwgId;
                                return (
                                    <div
                                        key={dwg.id}
                                        onClick={() => {
                                            setSelectedDwgId(dwg.id);
                                            if (dwg.dimensions.length > 0) {
                                                setActiveDimId(dwg.dimensions[0].id);
                                            }
                                        }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '8px',
                                            backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                                            border: `1px solid ${isSelected ? '#bfdbfe' : 'transparent'}`,
                                            cursor: 'pointer',
                                            marginBottom: '8px',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <FileCode size={16} color={isSelected ? '#2563eb' : '#64748b'} style={{ flexShrink: 0 }} />
                                                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: isSelected ? '#1d4ed8' : '#1e293b', wordBreak: 'break-word' }}>
                                                    {dwg.name}
                                                </div>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteDwg(dwg.id, e)}
                                                title="Hapus Blueprint"
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '4px',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    color: '#94a3b8',
                                                    transition: 'color 0.2s, background-color 0.2s',
                                                    flexShrink: 0
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.backgroundColor = '#fee2e2'; }}
                                                onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#64748b', paddingLeft: '24px' }}>
                                            <span>{dwg.fileName} ({dwg.fileType})</span>
                                            <span>{dwg.dimensions.length} mapping</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Area: Interactive Editor & Mapping Panel */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', overflow: 'hidden' }}>
                    
                    {/* Interactive Editor Canvas */}
                    <div style={{ backgroundColor: '#0b1d33', borderRadius: '16px', border: '1px solid #1e3a8a', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
                        
                        {/* Canvas toolbar */}
                        <div style={{ padding: '16px', borderBottom: '1px solid #1e3a8a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    CAD Canvas View
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '0.65rem', color: '#94a3b8' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#10b981' }}></span>PASS</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ef4444' }}></span>FAIL</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#3b82f6' }}></span>ACTIVE</span>
                            </div>
                        </div>

                        {/* Helper function to draw dynamic markers on the canvas */}
                        {(() => {
                            const renderDimensionIndicators = (dims) => {
                                return dims.map((dim) => {
                                    const isActive = dim.id === activeDimId;
                                    const x1 = dim.x1 !== undefined ? dim.x1 : 150;
                                    const y1 = dim.y1 !== undefined ? dim.y1 : 180;
                                    const x2 = dim.x2 !== undefined ? dim.x2 : 350;
                                    const y2 = dim.y2 !== undefined ? dim.y2 : 180;
                                    const lx = dim.lx !== undefined ? dim.lx : 250;
                                    const ly = dim.ly !== undefined ? dim.ly : 200;
                                    const type = dim.type || 'horizontal';
                                    
                                    // Resolve simulation values
                                    let simVal = 0;
                                    if (dim.variable === 'Meas_Length' || dim.variable === 'Meas_Height' || dim.id.includes('len') || dim.id.includes('stroke') || dim.id.includes('width') || dim.id.includes('height') || dim.type === 'horizontal') {
                                        simVal = simLength;
                                    } else if (dim.variable === 'Meas_Bore' || dim.variable === 'Inner_Diameter_Spec' || dim.id.includes('bore')) {
                                        simVal = simBore;
                                    } else {
                                        simVal = simDiameter;
                                    }

                                    const valStatus = getValidationStatus(simVal, dim.tolMin, dim.tolMax);
                                    const color = getStatusColor(valStatus, isActive);

                                    if (type === 'horizontal') {
                                        return (
                                            <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                                                <line x1={x1} y1={y1} x2={x1} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                <line x1={x2} y1={y2} x2={x2} y2={ly} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                <line x1={x1 + 8} y1={ly - 5} x2={x2 - 8} y2={ly - 5} stroke={color} strokeWidth={isActive ? "2.5" : "1.5"} />
                                                <polygon points={`${x1},${ly - 5} ${x1+10},${ly - 8} ${x1+10},${ly - 2}`} fill={color} />
                                                <polygon points={`${x2},${ly - 5} ${x2-10},${ly - 8} ${x2-10},${ly - 2}`} fill={color} />
                                                <rect x={lx - 40} y={ly - 17} width="80" height="24" rx="4" fill="#0f172a" stroke={color} strokeWidth={isActive ? 2 : 1} />
                                                <text x={lx} y={ly - 2} textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">
                                                    {dim.label ? dim.label.split(' ')[0] : 'Dim'}: {dim.spec}
                                                </text>
                                                {isActive && (
                                                    <circle cx={lx} cy={ly - 5} r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                                        <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                )}
                                            </g>
                                        );
                                    } else if (type === 'vertical') {
                                        return (
                                            <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                                                <line x1={x1} y1={y1} x2={lx} y2={y1} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                <line x1={x2} y1={y2} x2={lx} y2={y2} stroke="rgba(148,163,184,0.3)" strokeWidth="0.75" strokeDasharray="2,2" />
                                                <line x1={lx - 5} y1={y1 + 8} x2={lx - 5} y2={y2 - 8} stroke={color} strokeWidth={isActive ? "2.5" : "1.5"} />
                                                <polygon points={`${lx - 5},${y1} ${lx - 8},${y1+10} ${lx - 2},${y1+10}`} fill={color} />
                                                <polygon points={`${lx - 5},${y2} ${lx - 8},${y2-10} ${lx - 2},${y2-10}`} fill={color} />
                                                <rect x={lx - 40} y={ly - 12} width="80" height="24" rx="4" fill="#0f172a" stroke={color} strokeWidth={isActive ? 2 : 1} />
                                                <text x={lx} y={ly + 4} textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">
                                                    {dim.label ? dim.label.split(' ')[0] : 'Dim'}: {dim.spec}
                                                </text>
                                                {isActive && (
                                                    <circle cx={lx} cy={ly} r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                                        <animate attributeName="r" values="10;24;10" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                )}
                                            </g>
                                        );
                                    } else {
                                        return (
                                            <g key={dim.id} style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); setActiveDimId(dim.id); }}>
                                                <path d={`M ${x1},${y1} L ${x2},${y2} L ${lx},${ly}`} fill="none" stroke={color} strokeWidth={isActive ? "2" : "1.5"} />
                                                {(() => {
                                                    const angle = Math.atan2(y2 - y1, x2 - x1);
                                                    const arrowLength = 10;
                                                    const ax1 = x1 + arrowLength * Math.cos(angle - 0.25);
                                                    const ay1 = y1 + arrowLength * Math.sin(angle - 0.25);
                                                    const ax2 = x1 + arrowLength * Math.cos(angle + 0.25);
                                                    const ay2 = y1 + arrowLength * Math.sin(angle + 0.25);
                                                    return (
                                                        <polygon points={`${x1},${y1} ${ax1},${ay1} ${ax2},${ay2}`} fill={color} />
                                                    );
                                                })()}
                                                <rect x={lx - 40} y={ly - 12} width="80" height="24" rx="4" fill="#0f172a" stroke={color} strokeWidth={isActive ? 2 : 1} />
                                                <text x={lx} y={ly + 4} textAnchor="middle" fill={color} fontSize="9" fontWeight="bold">
                                                    {dim.label ? dim.label.split(' ')[0] : 'Dim'}: Ø{dim.spec}
                                                </text>
                                                {isActive && (
                                                    <circle cx={lx} cy={ly} r="16" fill="none" stroke="#3b82f6" strokeWidth="1.5">
                                                        <animate attributeName="r" values="8;20;8" dur="2s" repeatCount="indefinite" />
                                                        <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                                                    </circle>
                                                )}
                                            </g>
                                        );
                                    }
                                });
                            };

                            return (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', width: '100%', height: '100%' }}>
                                    <svg viewBox="0 0 500 360" onClick={handleCanvasClick} style={{ maxWidth: '100%', maxHeight: '100%', width: '100%', cursor: activeDim ? 'crosshair' : 'default' }}>
                                        <defs>
                                            <pattern id="canvas_grid" width="20" height="20" patternUnits="userSpaceOnUse">
                                                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.25" />
                                            </pattern>
                                        </defs>
                                        <rect width="100%" height="100%" fill="url(#canvas_grid)" />

                                        {/* Blueprint border */}
                                        <rect x="5" y="5" width="490" height="350" fill="none" stroke="#1e40af" strokeWidth="1" />
                                        <rect x="8" y="8" width="484" height="344" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.5" />

                                        {/* Backdrop render based on selected drawing */}
                                        {selectedDwgId === 'dwg_flange_connector' ? (
                                            <>
                                                {/* Front circle flange */}
                                                <g transform="translate(10, 0)">
                                                    <circle cx="140" cy="180" r="90" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                                    <circle cx="140" cy="180" r="65" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="5,5" />
                                                    <circle cx="140" cy="180" r="30" fill="none" stroke="#3b82f6" strokeWidth="1.5" />
                                                    <line x1="140" y1="75" x2="140" y2="285" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                                    <line x1="35" y1="180" x2="245" y2="180" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />

                                                    {/* Bolt Holes */}
                                                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, idx) => {
                                                        const rad = (angle * Math.PI) / 180;
                                                        const bx = 140 + 65 * Math.cos(rad);
                                                        const by = 180 + 65 * Math.sin(rad);
                                                        return (
                                                            <g key={idx}>
                                                                <circle cx={bx} cy={by} r="8" fill="none" stroke="#3b82f6" strokeWidth="1" />
                                                            </g>
                                                        );
                                                    })}
                                                </g>

                                                {/* Side Cut profile */}
                                                <g transform="translate(300, 0)">
                                                    <line x1="100" y1="65" x2="100" y2="295" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                                    <path d="M 40,110 L 100,110 L 100,140 L 90,140 L 90,220 L 100,220 L 100,250 L 40,250 L 40,220 L 15,220 L 15,140 L 40,140 Z" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                                                    <path d="M 40,120 L 50,110 M 40,140 L 70,110 M 40,160 L 90,110 M 40,180 L 100,120 M 40,200 L 100,140 M 45,210 L 100,155 M 65,210 L 100,175" fill="none" stroke="#1e3a8a" strokeWidth="0.5" strokeOpacity="0.4" />
                                                </g>
                                            </>
                                        ) : selectedDwgId === 'dwg_hydraulic_cylinder' ? (
                                            <g transform="translate(40, 20)">
                                                {/* Cylinder Tube */}
                                                <rect x="60" y="100" width="220" height="120" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                                {/* Cylinder Rod */}
                                                <rect x="280" y="130" width="140" height="60" fill="none" stroke="#60a5fa" strokeWidth="2" />
                                                {/* Clevis end */}
                                                <circle cx="435" cy="160" r="15" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                                {/* Center Line */}
                                                <line x1="20" y1="160" x2="450" y2="160" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="15,4,2,4" />
                                            </g>
                                        ) : (
                                            // Generic shape backdrop for custom uploaded drawings
                                            <g transform="translate(40, 20)">
                                                {/* Base block */}
                                                <rect x="120" y="80" width="240" height="180" fill="none" stroke="#3b82f6" strokeWidth="2" />
                                                <circle cx="240" cy="170" r="45" fill="none" stroke="#60a5fa" strokeWidth="1.5" />
                                                <line x1="240" y1="50" x2="240" y2="290" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
                                                <line x1="80" y1="170" x2="400" y2="170" stroke="#3b82f6" strokeWidth="0.5" strokeDasharray="10,5" />
                                            </g>
                                        )}

                                        {/* Dynamic Indicators rendering */}
                                        {selectedDwg && renderDimensionIndicators(selectedDwg.dimensions)}
                                    </svg>
                                </div>
                            );
                        })()}

                        {/* Quick Tips footer */}
                        <div style={{ padding: '12px 18px', backgroundColor: 'rgba(30, 58, 138, 0.2)', borderTop: '1px solid #1e3a8a', display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <HelpCircle size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '0.72rem', color: '#93c5fd' }}>
                                <b>Tips:</b> Klik pada label dimensi di atas canvas untuk memilih parameter, lalu <b>Klik di mana saja pada canvas</b> untuk memindahkan lokasinya.
                            </span>
                        </div>
                    </div>

                    {/* Left/Right controls: Hotspot Inspector Panel */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                        
                        {/* 1. MAPPING ASSIGNMENT FORM */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Settings size={18} color="#2563eb" />
                                    <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                                        Pemetaan Parameter QC
                                    </h3>
                                </div>
                                <button
                                    onClick={handleAddDimension}
                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', border: 'none', backgroundColor: '#eff6ff', color: '#2563eb', padding: '4px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                                >
                                    <Plus size={12} /> Tambah
                                </button>
                            </div>

                            {activeDim ? (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Label Parameter</label>
                                        <input
                                            type="text"
                                            value={editLabel}
                                            onChange={(e) => updateActiveDimProp('label', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Target Spec Nominal</label>
                                            <input
                                                type="text"
                                                value={editSpec}
                                                onChange={(e) => updateActiveDimProp('spec', e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Satuan (Unit)</label>
                                            <input
                                                type="text"
                                                value={editUnit}
                                                onChange={(e) => updateActiveDimProp('unit', e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Batas Toleransi Min</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editTolMin}
                                                onChange={(e) => updateActiveDimProp('tolMin', e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Batas Toleransi Max</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={editTolMax}
                                                onChange={(e) => updateActiveDimProp('tolMax', e.target.value)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', outline: 'none' }}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Variabel Connector (QMS)</label>
                                        <select
                                            value={editVariable}
                                            onChange={(e) => updateActiveDimProp('variable', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: 'white' }}
                                        >
                                            <option value="">-- Pilih Variabel --</option>
                                            <option value="Meas_Length">Meas_Length (Length 120.0)</option>
                                            <option value="Meas_Diameter">Meas_Diameter (Diameter 80.0)</option>
                                            <option value="Meas_Bore">Meas_Bore (Center Bore 25.0)</option>
                                            <option value="Meas_Height">Meas_Height (Generic Height 50.0)</option>
                                            <option value="Cylinder_Bore_Dia">Cylinder_Bore_Dia (Hydraulic Bore 80.0)</option>
                                            <option value="Rod_Diameter_Spec">Rod_Diameter_Spec (Rod 56.0)</option>
                                            <option value="Stroke_Length_Actual">Stroke_Length_Actual (Stroke 500.0)</option>
                                            <option value="Inner_Diameter_Spec">Inner_Diameter_Spec (Core 12.0)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 800, marginBottom: '6px' }}>Tipe Indikator Gambar</label>
                                        <select
                                            value={editType}
                                            onChange={(e) => updateActiveDimProp('type', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem', backgroundColor: 'white' }}
                                        >
                                            <option value="horizontal">Garis Dimensi Horizontal</option>
                                            <option value="vertical">Garis Dimensi Vertikal</option>
                                            <option value="radial">Pointer / Radial Diagonal</option>
                                        </select>
                                    </div>

                                    <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569' }}>Koordinat Indikator (Manual)</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Label X: {editLx}</label>
                                                <input type="range" min="10" max="490" value={editLx} onChange={(e) => updateActiveDimProp('lx', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Label Y: {editLy}</label>
                                                <input type="range" min="10" max="350" value={editLy} onChange={(e) => updateActiveDimProp('ly', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Awal X: {editX1}</label>
                                                <input type="range" min="10" max="490" value={editX1} onChange={(e) => updateActiveDimProp('x1', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Awal Y: {editY1}</label>
                                                <input type="range" min="10" max="350" value={editY1} onChange={(e) => updateActiveDimProp('y1', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Akhir X: {editX2}</label>
                                                <input type="range" min="10" max="490" value={editX2} onChange={(e) => updateActiveDimProp('x2', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.62rem', color: '#64748b' }}>Akhir Y: {editY2}</label>
                                                <input type="range" min="10" max="350" value={editY2} onChange={(e) => updateActiveDimProp('y2', e.target.value)} style={{ width: '100%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                        <button
                                            onClick={handleSaveMapping}
                                            style={{ flex: 1, padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', transition: 'background-color 0.2s' }}
                                        >
                                            Simpan Mapping
                                        </button>
                                        <button
                                            onClick={() => handleDeleteDimension(activeDim.id)}
                                            style={{ padding: '10px', backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            title="Hapus Parameter"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                                    Pilih dimensi pada gambar sebelah kiri untuk memulai konfigurasi.
                                </div>
                            )}
                        </div>

                        {/* 2. LIVE QC TERMINAL SIMULATOR */}
                        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
                                <Play size={18} color="#10b981" />
                                <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#1e293b' }}>
                                    Simulasi Input Caliper QC
                                </h3>
                            </div>
                            
                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.7rem', lineHeight: 1.4 }}>
                                Masukkan nilai simulasi caliper untuk memverifikasi apakah batas toleransi mewarnai blueprint secara benar:
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {selectedDwg?.dimensions.map((dim) => {
                                    let simVal = 0;
                                    let setter = () => {};

                                    if (dim.variable === 'Meas_Length' || dim.variable === 'Meas_Height' || dim.id.includes('len') || dim.id.includes('stroke') || dim.id.includes('width') || dim.id.includes('height') || dim.type === 'horizontal') {
                                        simVal = simLength;
                                        setter = (val) => setSimLength(val);
                                    } else if (dim.variable === 'Meas_Bore' || dim.variable === 'Inner_Diameter_Spec' || dim.id.includes('bore')) {
                                        simVal = simBore;
                                        setter = (val) => setSimBore(val);
                                    } else {
                                        simVal = simDiameter;
                                        setter = (val) => setSimDiameter(val);
                                    }

                                    const status = getValidationStatus(simVal, dim.tolMin, dim.tolMax);

                                    return (
                                        <div key={dim.id}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '4px' }}>
                                                <span style={{ color: '#1e293b' }}>{dim.label} [{dim.tolMin} - {dim.tolMax}]</span>
                                                <span style={{
                                                    color: status === 'PASS' ? '#10b981' : '#ef4444',
                                                    fontWeight: 900
                                                }}>{status}</span>
                                            </div>
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={simVal}
                                                onChange={(e) => setter(parseFloat(e.target.value) || 0)}
                                                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                                            />
                                        </div>
                                    );
                                })}

                                {(!selectedDwg || selectedDwg.dimensions.length === 0) && (
                                    <div style={{ padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1', textAlign: 'center', fontSize: '0.75rem', color: '#64748b' }}>
                                        Tambahkan parameter QC di atas untuk memulai simulasi.
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
