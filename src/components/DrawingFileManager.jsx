import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileCode,
    Upload,
    Database,
    RefreshCw,
    Trash2,
    Sliders,
    Eye,
    Plus,
    LayoutGrid,
    Calendar,
    ChevronDown,
    Zap,
    Download,
    CheckCircle,
    Info,
    FileText,
    ArrowRight,
    Search
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getAllDrawings, saveDrawing, deleteDrawing } from '../utils/supabaseUtilityDB';

// Default Drawing Templates (matches DrawingManager.jsx)
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
    },
    {
        id: 'dwg_product_checking',
        name: 'Product Checking Template',
        fileName: 'product-checking-template.pdf',
        fileType: 'PDF',
        uploadedAt: '2026-06-26T12:00:00Z',
        dimensions: [
            { id: 'linear_2d', label: '2D Length Dimension', spec: '50.0', tolMin: 49.8, tolMax: 50.2, variable: 'Linear_2D_Val', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 50, y1: 300, x2: 250, y2: 300, lx: 150, ly: 320 },
            { id: 'pdf_height', label: 'PDF Thickness Check', spec: '12.0', tolMin: 11.8, tolMax: 12.2, variable: 'PDF_Thickness_Val', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 400, y1: 100, x2: 400, y2: 200, lx: 420, ly: 150 },
            { id: 'balloon_mark', label: 'Balloon Marker', spec: '10.0', tolMin: 9.5, tolMax: 10.5, variable: 'Balloon_Marker', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 200, y1: 200, lx: 250, ly: 200 },
            { id: 'cad_angle', label: '3D Included Angle', spec: '90.0', tolMin: 89.5, tolMax: 90.5, variable: 'CAD_Angle_Val', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 350, y1: 250, x2: 450, y2: 350, lx: 470, ly: 280 },
            { id: 'qc_check', label: 'QC Check Status', spec: 'PASS', tolMin: 1, tolMax: 1, variable: 'QC_Check_Status', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: 'QC', x1: 100, y1: 100, lx: 150, ly: 100 },
            { id: 'trigger_check', label: 'Trigger Check', spec: '1.0', tolMin: 1.0, tolMax: 1.0, variable: 'Trigger_Output', unit: '', category: 'custom', measureType: 'custom', indicatorType: 'callout', gdt_symbol: '⚡', x1: 300, y1: 150, lx: 350, ly: 150 },
            { id: 'camera_check', label: 'Camera/Vision Check', spec: '24.0', tolMin: 23.5, tolMax: 24.5, variable: 'Vision_Camera_Val', unit: 'fps', category: 'roughness', measureType: 'surface_roughness', indicatorType: 'callout', gdt_symbol: 'Ra', x1: 150, y1: 250, lx: 200, ly: 270 }
        ]
    }
];

// Helper to define category details
const CATEGORY_MAP = {
    dimension: { icon: '📏', color: '#3b82f6', label: 'Linear' },
    diameter: { icon: '⌀', color: '#8b5cf6', label: 'Diameter' },
    radius: { icon: '⊕', color: '#06b6d4', label: 'Radius' },
    angle: { icon: '∠', color: '#f59e0b', label: 'Sudut' },
    area: { icon: '▢', color: '#10b981', label: 'Area' },
    roughness: { icon: '△', color: '#ef4444', label: 'Roughness' },
    custom: { icon: '⚙', color: '#64748b', label: 'Kustom' }
};

export default function DrawingFileManager() {
    const navigate = useNavigate();
    
    // Load Drawings with Auto Migration
    const [drawings, setDrawings] = useState(() => {
        const saved = localStorage.getItem('mavi_drawings');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) {
                    if (!parsed.some(d => d.id === 'dwg_product_checking')) {
                        const templateDwg = DEFAULT_DRAWINGS.find(d => d.id === 'dwg_product_checking');
                        if (templateDwg) {
                            const updated = [...parsed, templateDwg];
                            localStorage.setItem('mavi_drawings', JSON.stringify(updated));
                            return updated;
                        }
                    }
                    return parsed;
                }
            } catch (e) {
                return DEFAULT_DRAWINGS;
            }
        }
        return DEFAULT_DRAWINGS;
    });

    // Load drawings from database on mount
    useEffect(() => {
        const loadDwgFromDb = async () => {
            try {
                const dbDrawings = await getAllDrawings();
                if (dbDrawings && dbDrawings.length > 0) {
                    setDrawings(dbDrawings);
                }
            } catch (err) {
                console.error('Failed to load drawings from database:', err);
            }
        };
        loadDwgFromDb();
    }, []);

    const [searchTerm, setSearchTerm] = useState('');
    const [isDragOver, setIsDragOver] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const [parseProgress, setParseProgress] = useState(0);
    const [parseStatusText, setParseStatusText] = useState('');
    const [showGlobalMenu, setShowGlobalMenu] = useState(false);

    const fileInputRef = useRef(null);
    const fileSchemaRef = useRef(null);
    const globalMenuRef = useRef(null);

    // Save drawings to localStorage on changes
    useEffect(() => {
        localStorage.setItem('mavi_drawings', JSON.stringify(drawings));
    }, [drawings]);

    // Close menus on outside click
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (globalMenuRef.current && !globalMenuRef.current.contains(e.target)) {
                setShowGlobalMenu(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // Filtered Drawings
    const filteredDrawings = drawings.filter(d => 
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        d.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.fileType.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Statistics Calculation
    const stats = React.useMemo(() => {
        let totalParams = 0;
        const variables = new Set();
        const types = { DXF: 0, DWG: 0, SVG: 0, PDF: 0 };

        drawings.forEach(d => {
            totalParams += (d.dimensions || []).length;
            (d.dimensions || []).forEach(dim => {
                if (dim.variable) variables.add(dim.variable);
            });
            const type = (d.fileType || 'DXF').toUpperCase();
            types[type] = (types[type] || 0) + 1;
        });

        return {
            totalFiles: drawings.length,
            totalParams,
            uniqueVars: variables.size,
            types
        };
    }, [drawings]);

    // Navigation linking
    const handleViewInCanvas = (dwgId) => {
        localStorage.setItem('mavi_selected_dwg_id', dwgId);
        navigate('/drawings');
        toast.success('Dialihkan ke kanvas gambar.');
    };

    // Export Specific Schema
    const handleExportDwgSchema = (dwg, e) => {
        e.stopPropagation();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dwg, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `mavi_schema_${dwg.id}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success(`Skema untuk "${dwg.name}" diekspor.`);
    };

    // Export All Drawings Schema
    const handleExportAllSchema = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(drawings, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "mavi_all_drawings_schema.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        toast.success('Semua skema gambar berhasil diekspor.');
        setShowGlobalMenu(false);
    };

    // Import Schema
    const handleImportSchema = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (Array.isArray(parsed)) {
                    const isValid = parsed.every(dwg => dwg.name && Array.isArray(dwg.dimensions));
                    if (isValid) {
                        const savePromises = parsed.map(dwg => saveDrawing(dwg));
                        const savedDrawings = await Promise.all(savePromises);
                        setDrawings(savedDrawings);
                        if (savedDrawings.length > 0) {
                            localStorage.setItem('mavi_selected_dwg_id', savedDrawings[0].id);
                        }
                        toast.success('Skema drawing berhasil diimpor ke database!');
                    } else {
                        toast.error('Format berkas JSON tidak valid.');
                    }
                } else if (parsed && parsed.name && Array.isArray(parsed.dimensions)) {
                    // Single drawing schema import
                    const saved = await saveDrawing(parsed);
                    setDrawings(prev => {
                        const exists = prev.some(d => d.id === saved.id);
                        if (exists) {
                            return prev.map(d => d.id === saved.id ? saved : d);
                        }
                        return [saved, ...prev];
                    });
                    localStorage.setItem('mavi_selected_dwg_id', saved.id);
                    toast.success(`Skema drawing "${saved.name}" diimpor ke database.`);
                } else {
                    toast.error('Format berkas tidak dikenali.');
                }
            } catch (err) {
                console.error(err);
                toast.error('Gagal membaca atau menyimpan berkas JSON.');
            }
        };
        reader.readAsText(file);
        setShowGlobalMenu(false);
        e.target.value = '';
    };

    // Delete blueprint
    const handleDeleteDwg = async (dwgId, dwgName, e) => {
        e.stopPropagation();
        if (window.confirm(`Apakah Anda yakin ingin menghapus blueprint "${dwgName}" dari database?`)) {
            try {
                await deleteDrawing(dwgId);
                const updated = drawings.filter(d => d.id !== dwgId);
                setDrawings(updated);
                
                // Cleanup selected ID if deleted
                const activeId = localStorage.getItem('mavi_selected_dwg_id');
                if (activeId === dwgId) {
                    if (updated.length > 0) {
                        localStorage.setItem('mavi_selected_dwg_id', updated[0].id);
                    } else {
                        localStorage.removeItem('mavi_selected_dwg_id');
                    }
                }
                toast.success(`Blueprint "${dwgName}" berhasil dihapus dari database.`);
            } catch (err) {
                console.error(err);
                toast.error('Gagal menghapus blueprint dari database.');
            }
        }
    };

    // Reset database to templates
    const handleResetToDefault = async () => {
        if (window.confirm('Reset semua blueprint ke template bawaan di database? Perubahan kustom Anda akan hilang.')) {
            try {
                const savePromises = DEFAULT_DRAWINGS.map(dwg => saveDrawing(dwg));
                const savedList = await Promise.all(savePromises);
                setDrawings(savedList);
                if (savedList.length > 0) {
                    localStorage.setItem('mavi_selected_dwg_id', savedList[0].id);
                }
                toast.success('Database blueprint berhasil direset.');
            } catch (err) {
                console.error(err);
                toast.error('Gagal mereset blueprint di database.');
            }
            setShowGlobalMenu(false);
        }
    };

    // Clear all blueprints
    const handleClearAll = async () => {
        if (window.confirm('Hapus semua file blueprint dalam database?')) {
            try {
                const deletePromises = drawings.map(dwg => deleteDrawing(dwg.id));
                await Promise.all(deletePromises);
                setDrawings([]);
                localStorage.removeItem('mavi_selected_dwg_id');
                toast.success('Semua blueprint telah dihapus dari database.');
            } catch (err) {
                console.error(err);
                toast.error('Gagal menghapus beberapa blueprint dari database.');
            }
            setShowGlobalMenu(false);
        }
    };

    // File Processing (simulate scanning/OCR mapping matching DrawingManager.jsx)
    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length > 0) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files?.length > 0) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = async (file) => {
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['svg', 'dxf', 'pdf', 'dwg'].includes(ext)) {
            toast.error('Format tidak didukung! Gunakan .svg, .dxf, .pdf, atau .dwg.');
            return;
        }

        setIsParsing(true);
        setParseProgress(10);
        setParseStatusText('Mengunggah berkas ke server QMS...');

        // Helper to load file as dataURL for display
        const getFileDataUrl = () => {
            return new Promise((resolve) => {
                const r = new FileReader();
                r.onload = (ev) => resolve(ev.target.result);
                if (ext === 'pdf' || ext === 'svg') {
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

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.dimensions) {
                setParseProgress(80);
                setParseStatusText('Mengekstraksi anotasi GD&T & parameter toleransi...');
                
                const newDwg = {
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint',
                    fileName: file.name,
                    fileType: ext.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: result.dimensions,
                    dataUrl: result.rendered_image || dataUrl
                };

                setParseProgress(100);
                const saved = await saveDrawing(newDwg);
                setDrawings(prev => [saved, ...prev]);
                localStorage.setItem('mavi_selected_dwg_id', saved.id);
                toast.success(`Ekstraksi Python berhasil! Ditemukan ${result.dimensions.length} parameter pada "${file.name}".`);
                setIsParsing(false);
                return;
            } else {
                console.warn('Python parser returned unsuccessful parsing, falling back:', result.error);
                throw new Error(result.error || 'Unknown parsing failure');
            }
        } catch (err) {
            console.warn('Koneksi Python server gagal atau error. Menggunakan fallback simulasi:', err);
            
            // Fallback Simulation logic (original behavior)
            setParseProgress(45);
            setParseStatusText('Jatuh kembali ke geometri parsing simulasi...');
            
            const timer1 = setTimeout(() => {
                setParseProgress(75);
                setParseStatusText('Mengekstraksi parameter toleransi simulasi...');
            }, 600);

            const timer2 = setTimeout(() => {
                setParseProgress(95);
                setParseStatusText('Membangun visualisasi model simulasi...');
            }, 1200);

            const timer3 = setTimeout(() => {
                setParseProgress(100);
                setIsParsing(false);

                const nameLower = file.name.toLowerCase();
                let extracted = [];
                if (nameLower.includes('shaft') || nameLower.includes('rod') || nameLower.includes('piston')) {
                    extracted = [
                        { id: `dim_sh_1_${Date.now()}`, label: 'Shaft Length (L)', spec: '240.0', tolMin: 239.5, tolMax: 240.5, variable: 'Meas_Length', unit: 'mm', category: 'dimension', measureType: 'linear_horizontal', indicatorType: 'horizontal', gdt_symbol: '', x1: 120, y1: 240, x2: 360, y2: 240, lx: 240, ly: 255 },
                        { id: `dim_sh_2_${Date.now()}`, label: 'Journal Diameter (d1)', spec: '35.0', tolMin: 34.98, tolMax: 35.02, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 120, y1: 135, x2: 120, y2: 205, lx: 95, ly: 170 },
                        { id: `dim_sh_3_${Date.now()}`, label: 'Chamfer Angle', spec: '45.0', tolMin: 44.0, tolMax: 46.0, variable: 'Meas_Angle', unit: '°', category: 'angle', measureType: 'angle', indicatorType: 'arc', gdt_symbol: '∠', x1: 360, y1: 170, x2: 380, y2: 150, lx: 390, ly: 155, cx: 360, cy: 170, angleStart: -30, angleEnd: 0 },
                    ];
                } else if (nameLower.includes('gear') || nameLower.includes('pinion') || nameLower.includes('wheel')) {
                    extracted = [
                        { id: `dim_gr_1_${Date.now()}`, label: 'Outer Pitch Diameter', spec: '150.0', tolMin: 149.8, tolMax: 150.2, variable: 'Meas_Diameter', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 120, y1: 80, x2: 360, y2: 80, lx: 240, ly: 65 },
                        { id: `dim_gr_2_${Date.now()}`, label: 'Center Hub Bore', spec: '30.0', tolMin: 29.95, tolMax: 30.05, variable: 'Meas_Bore', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 255, y2: 170, lx: 265, ly: 155 },
                    ];
                } else {
                    extracted = [
                        { id: `dim_gen_1_${Date.now()}`, label: 'Dimension Height (H)', spec: '50.0', tolMin: 49.5, tolMax: 50.5, variable: 'Meas_Height', unit: 'mm', category: 'dimension', measureType: 'linear_vertical', indicatorType: 'vertical', gdt_symbol: '', x1: 90, y1: 80, x2: 90, y2: 260, lx: 65, ly: 170 },
                        { id: `dim_gen_2_${Date.now()}`, label: 'Core Diameter', spec: '12.0', tolMin: 11.9, tolMax: 12.1, variable: 'Inner_Dia', unit: 'mm', category: 'diameter', measureType: 'diameter', indicatorType: 'radial', gdt_symbol: '⌀', x1: 240, y1: 170, x2: 250, y2: 170, lx: 260, ly: 155 },
                    ];
                }

                const newDwg = {
                    name: file.name.split('.')[0].replace(/[-_]/g, ' ').toUpperCase() + ' Blueprint (Simulasi)',
                    fileName: file.name,
                    fileType: ext.toUpperCase(),
                    uploadedAt: new Date().toISOString(),
                    dimensions: extracted,
                    dataUrl: dataUrl
                };

                saveDrawing(newDwg).then(saved => {
                    setDrawings(prev => [saved, ...prev]);
                    localStorage.setItem('mavi_selected_dwg_id', saved.id);
                    toast.success(`Unggah berhasil disimpan secara simulasi! Ditemukan ${extracted.length} parameter pada "${file.name}".`);
                }).catch(saveErr => {
                    console.error(saveErr);
                    toast.error('Gagal menyimpan file blueprint simulasi.');
                });
            }, 1800);
        }
        
        if (ext === 'pdf') {
            reader.readAsDataURL(file);
        } else {
            reader.readAsText(file);
        }
    };

    return (
        <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#f8fafc', padding: '24px', fontFamily: "'Inter', sans-serif" }}>
            
            {/* Header Title */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', padding: '8px', borderRadius: '10px', color: 'white', display: 'flex', alignItems: 'center' }}>
                            <FileCode size={24} />
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: '#0f172a' }}>Management File Drawing</h1>
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.88rem' }}>
                        Unggah model blueprint CAD (.DXF, .SVG, .PDF) dan kelola daftar file gambar integrasi QMS Anda.
                    </p>
                </div>

                {/* Global Actions dropdown */}
                <div style={{ position: 'relative' }} ref={globalMenuRef}>
                    <button
                        onClick={() => setShowGlobalMenu(!showGlobalMenu)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            border: '1px solid #cbd5e1', backgroundColor: 'white',
                            color: '#334155', padding: '10px 16px', borderRadius: '8px',
                            fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                            transition: 'all 0.2s', outline: 'none', boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                    >
                        <Sliders size={15} /> Database Kontrol <ChevronDown size={14} />
                    </button>
                    {showGlobalMenu && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                            backgroundColor: 'white', borderRadius: '10px', border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                            padding: '6px 0', zIndex: 100, width: '220px', display: 'flex', flexDirection: 'column'
                        }}>
                            <button
                                onClick={handleExportAllSchema}
                                style={globalItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Database size={14} color="#3b82f6" /> Ekspor Semua Skema (.json)
                            </button>
                            <button
                                onClick={() => fileSchemaRef.current.click()}
                                style={globalItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Upload size={14} color="#10b981" /> Impor Skema / Berkas (.json)
                            </button>
                            <input
                                type="file"
                                ref={fileSchemaRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={handleImportSchema}
                            />
                            <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '6px 0' }} />
                            <button
                                onClick={handleResetToDefault}
                                style={globalItemStyle}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <RefreshCw size={14} color="#f59e0b" /> Reset ke Template Bawaan
                            </button>
                            <button
                                onClick={handleClearAll}
                                style={{ ...globalItemStyle, color: '#ef4444' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fee2e2'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <Trash2 size={14} color="#ef4444" /> Hapus Semua Gambar
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div style={statCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={statLabelStyle}>Total Blueprint</span>
                        <div style={{ ...statIconBg, backgroundColor: '#eff6ff', color: '#2563eb' }}>
                            <FileCode size={18} />
                        </div>
                    </div>
                    <div style={statValueStyle}>{stats.totalFiles}</div>
                    <div style={statDescStyle}>Model CAD Terdaftar</div>
                </div>
                
                <div style={statCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={statLabelStyle}>Mapped Parameters</span>
                        <div style={{ ...statIconBg, backgroundColor: '#f5f3ff', color: '#7c3aed' }}>
                            <Sliders size={18} />
                        </div>
                    </div>
                    <div style={statValueStyle}>{stats.totalParams}</div>
                    <div style={statDescStyle}>Dimensi / Batas Toleransi</div>
                </div>

                <div style={statCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={statLabelStyle}>Active QMS Variables</span>
                        <div style={{ ...statIconBg, backgroundColor: '#ecfdf5', color: '#059669' }}>
                            <Database size={18} />
                        </div>
                    </div>
                    <div style={statValueStyle}>{stats.uniqueVars}</div>
                    <div style={statDescStyle}>Koneksi Tag Database</div>
                </div>

                <div style={statCardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={statLabelStyle}>Format Distribusi</span>
                        <div style={{ ...statIconBg, backgroundColor: '#fffbeb', color: '#d97706' }}>
                            <Zap size={18} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                        <div><b style={{ color: '#ef4444' }}>DXF:</b> {stats.types.DXF || 0}</div>
                        <div><b style={{ color: '#8b5cf6' }}>DWG:</b> {stats.types.DWG || 0}</div>
                        <div><b style={{ color: '#10b981' }}>SVG:</b> {stats.types.SVG || 0}</div>
                        <div><b style={{ color: '#3b82f6' }}>PDF:</b> {stats.types.PDF || 0}</div>
                    </div>
                    <div style={{ ...statDescStyle, marginTop: '4px' }}>Tipe geometri file</div>
                </div>
            </div>

            {/* Upload Zone & Filter Input Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start', marginBottom: '24px' }}>
                
                {/* Search & Filter Bar */}
                <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#1e293b' }}>Filter & Cari File</h3>
                        <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Menampilkan <b>{filteredDrawings.length}</b> dari {drawings.length} data</span>
                    </div>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Cari berdasarkan nama model, tipe file, atau nama file..."
                            style={{
                                width: '100%', padding: '10px 12px 10px 38px',
                                borderRadius: '8px', border: '1px solid #cbd5e1',
                                fontSize: '0.82rem', outline: 'none', fontFamily: "'Inter', sans-serif",
                                transition: 'border-color 0.2s'
                            }}
                        />
                    </div>
                </div>

                {/* Upload drag drop zone */}
                <div
                    onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current.click()}
                    style={{
                        backgroundColor: isDragOver ? '#f0f7ff' : 'white',
                        border: `2px dashed ${isDragOver ? '#3b82f6' : '#cbd5e1'}`,
                        borderRadius: '12px', padding: '16px', cursor: 'pointer',
                        textAlign: 'center', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                    }}
                >
                    <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".dxf,.svg,.pdf,.dwg" onChange={handleFileSelect} />
                    <Upload size={24} color={isDragOver ? '#3b82f6' : '#94a3b8'} style={{ margin: '0 auto 6px' }} />
                    <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#1e293b', marginBottom: '2px' }}>Unggah Blueprint Gambar</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Klik atau drop file <b>.DXF, .DWG, .SVG, .PDF</b> di sini.</div>
                </div>
            </div>

            {/* OCR Parser Progress Panel */}
            {isParsing && (
                <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 800, color: '#1e293b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <RefreshCw size={14} style={{ animation: 'spin 1.5s linear infinite' }} /> Membaca berkas & menganotasi metadata CAD...
                        </span>
                        <span>{parseProgress}%</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${parseProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', transition: 'width 0.4s ease' }}></div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontStyle: 'italic' }}>{parseStatusText}</div>
                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {/* Library Grid View */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: '20px' }}>
                {filteredDrawings.map((dwg) => {
                    // Count dimension categories
                    const counts = {};
                    (dwg.dimensions || []).forEach(d => {
                        const cat = d.category || 'dimension';
                        counts[cat] = (counts[cat] || 0) + 1;
                    });

                    const uploadDate = dwg.uploadedAt ? new Date(dwg.uploadedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tidak Diketahui';

                    return (
                        <div key={dwg.id} style={cardStyle} className="dwg-file-card">
                            
                            {/* Card visual header */}
                            <div style={{ height: '120px', backgroundColor: '#0b1d33', borderBottom: '1px solid #1e3a8a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                {/* Decorative geometric lines to feel like blueprint vector */}
                                <svg viewBox="0 0 100 40" style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.25 }}>
                                    <line x1="0" y1="20" x2="100" y2="20" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="3,3" />
                                    <line x1="50" y1="0" x2="50" y2="40" stroke="#3b82f6" strokeWidth="0.3" strokeDasharray="3,3" />
                                    {dwg.id === 'dwg_flange_connector' ? (
                                        <g>
                                            <circle cx="50" cy="20" r="14" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                                            <circle cx="50" cy="20" r="6" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                                            <line x1="30" y1="5" x2="70" y2="35" stroke="#60a5fa" strokeWidth="0.4" />
                                        </g>
                                    ) : dwg.id === 'dwg_product_checking' ? (
                                        <g>
                                            {/* Miniature stepped bracket */}
                                            <path d="M 15,32 L 15,28 L 20,28 L 50,28 L 55,28 L 55,32 L 70,32 L 70,22 L 90,22 L 90,32 Z" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                                            {/* Center hole circle */}
                                            <circle cx="35" cy="18" r="4" fill="none" stroke="#60a5fa" strokeWidth="0.4" />
                                            {/* Right boss rect */}
                                            <rect x="78" y="10" width="6" height="12" fill="none" stroke="#60a5fa" strokeWidth="0.4" />
                                        </g>
                                    ) : (
                                        <g>
                                            <rect x="35" y="10" width="30" height="20" fill="none" stroke="#60a5fa" strokeWidth="0.5" />
                                            <rect x="40" y="13" width="20" height="14" fill="none" stroke="#60a5fa" strokeWidth="0.5" strokeDasharray="1,1" />
                                        </g>
                                    )}
                                </svg>

                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2 }}>
                                    <FileCode size={36} color="#93c5fd" />
                                    <span style={{ fontSize: '0.62rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: '#1e3a8a', color: '#93c5fd', marginTop: '6px', border: '1px solid #3b82f6' }}>
                                        {dwg.fileType} FORMAT
                                    </span>
                                </div>

                                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                                    <button
                                        onClick={(e) => handleDeleteDwg(dwg.id, dwg.name, e)}
                                        style={cardActionBtnStyle}
                                        title="Hapus Model"
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#ef4444'; e.currentTarget.style.color = 'white'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'; e.currentTarget.style.color = '#ef4444'; }}
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Details */}
                            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: '#0f172a' }}>{dwg.name}</h4>
                                    <span style={{ fontSize: '0.7rem', color: '#64748b', fontFamily: 'monospace' }}>{dwg.fileName}</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#475569' }}>
                                    <Calendar size={13} color="#94a3b8" />
                                    <span>Diunggah: <b>{uploadDate}</b></span>
                                </div>

                                {/* Counts badges */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', margin: '4px 0' }}>
                                    {Object.entries(counts).map(([cat, count]) => {
                                        const def = CATEGORY_MAP[cat] || CATEGORY_MAP.custom;
                                        return (
                                            <span
                                                key={cat}
                                                style={{
                                                    fontSize: '0.65rem', fontWeight: 700,
                                                    color: def.color, backgroundColor: `${def.color}12`,
                                                    padding: '2px 6px', borderRadius: '4px',
                                                    border: `1px solid ${def.color}25`,
                                                    display: 'flex', alignItems: 'center', gap: '3px'
                                                }}
                                            >
                                                <span>{def.icon}</span>
                                                <span>{def.label}: <b>{count}</b></span>
                                            </span>
                                        );
                                    })}
                                    {dwg.dimensions.length === 0 && (
                                        <span style={{ fontSize: '0.65rem', color: '#64748b', padding: '2px 6px', backgroundColor: '#f1f5f9', borderRadius: '4px' }}>
                                            Belum ada parameter yang dipetakan
                                        </span>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                                    <button
                                        onClick={() => handleViewInCanvas(dwg.id)}
                                        style={{
                                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                                            padding: '8px 12px', border: 'none', borderRadius: '6px',
                                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white',
                                            fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'opacity 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                    >
                                        <Eye size={13} /> View & Map QC
                                    </button>
                                    <button
                                        onClick={(e) => handleExportDwgSchema(dwg, e)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '6px',
                                            backgroundColor: '#f8fafc', color: '#475569',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                        title="Ekspor Skema JSON Gambar Ini"
                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.borderColor = '#cbd5e1'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                                    >
                                        <Download size={13} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {filteredDrawings.length === 0 && (
                    <div style={{ gridColumn: '1 / -1', padding: '40px', backgroundColor: 'white', borderRadius: '16px', border: '1px dashed #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                        <FileText size={40} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>Tidak Ada Blueprint Ditemukan</h4>
                        <p style={{ margin: 0, fontSize: '0.8rem' }}>Ubah kata kunci pencarian atau unggah file blueprint gambar baru di atas.</p>
                    </div>
                )}
            </div>

            {/* Bottom info section */}
            <div style={{ marginTop: '24px', backgroundColor: '#eff6ff', borderRadius: '12px', border: '1px solid #bfdbfe', padding: '12px 16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Info size={16} color="#3b82f6" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                    <b>Integrasi QMS:</b> Semua perubahan file drawing, parameter toleransi, dan tag variabel disinkronkan secara realtime dengan modul QMS, ERP Bridge, dan Supabase Database.
                </span>
            </div>
        </div>
    );
}

// Styling Constants
const statCardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
};
const statLabelStyle = {
    fontSize: '0.7rem',
    color: '#64748b',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
};
const statValueStyle = {
    fontSize: '1.6rem',
    fontWeight: 900,
    color: '#0f172a',
    lineHeight: '1.2'
};
const statDescStyle = {
    fontSize: '0.68rem',
    color: '#94a3b8'
};
const statIconBg = {
    padding: '6px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
};
const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s',
};
const cardActionBtnStyle = {
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    border: 'none',
    color: '#ef4444',
    padding: '6px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s'
};
const globalItemStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    border: 'none',
    background: 'none',
    width: '100%',
    textAlign: 'left',
    fontSize: '0.76rem',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
};
