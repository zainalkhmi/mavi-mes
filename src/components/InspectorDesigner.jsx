import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FileCode, Upload, Download, Plus, Trash2, Settings, Eye, Save, Play,
  ChevronRight, ChevronLeft, Check, X, ArrowRight, ArrowLeft, Layers,
  Ruler, Scale, Target, AlertTriangle, CheckCircle2, XCircle, Zap, Copy,
  ClipboardList, Database, FileText, Move, MousePointer, ZoomIn, ZoomOut,
  Maximize2, Printer, QrCode, Smartphone, Globe, Link, Copy as CopyIcon,
  RefreshCw, Search, Filter, Gauge, Wrench, Shield, ShieldCheck, Award,
  Info, Square, Circle, Triangle, Hexagon, PlusCircle, MinusCircle, Camera,
  List, Grid3x3, PlayCircle, Send, EyeOff, CheckSquare, FolderOpen,
  HardDrive, Table as TableIcon, Settings2, ExternalLink, User, Clock,
  BarChart2, FileCheck, SlidersHorizontal, Smartphone as DeviceIcon, Sparkles, FolderArchive
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { getAllDrawings, saveDrawing } from '../utils/supabaseUtilityDB';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';
import { parseDxfContent } from '../utils/cadDxfRenderService';
import { getTables, addTableRecord, createTable } from '../utils/supabaseTablesDB';
import { getCurrentUser } from '../utils/auth';

// GD&T Parameter Categories
const PARAM_CATEGORIES = [
  { key: 'dimension', label: 'Linear Dimension', icon: '📏', color: '#3b82f6', symbol: '' },
  { key: 'diameter', label: 'Diameter', icon: '⌀', color: '#8b5cf6', symbol: '⌀' },
  { key: 'radius', label: 'Radius', icon: 'R', color: '#06b6d4', symbol: 'R' },
  { key: 'angle', label: 'Angle', icon: '∠', color: '#f59e0b', symbol: '∠' },
  { key: 'depth', label: 'Depth', icon: '⏥', color: '#10b981', symbol: '⏥' },
  { key: 'roughness', label: 'Surface Roughness', icon: 'Ra', color: '#ef4444', symbol: 'Ra' },
  { key: 'flatness', label: 'Flatness', icon: '⊥', color: '#6366f1', symbol: '⊥' },
  { key: 'roundness', label: 'Roundness', icon: '◎', color: '#ec4899', symbol: '◎' },
];

// Criticality Levels
const CRITICALITY_LEVELS = [
  { key: 'Critical (CC)', label: 'Critical (CC)', color: '#ef4444', description: 'Dampak fatal - wajib 100% inspeksi' },
  { key: 'Major', label: 'Major', color: '#f59e0b', description: 'Dampak signifikan - inspeksi sampling' },
  { key: 'Minor', label: 'Minor', color: '#3b82f6', description: 'Dampak rendah - inspeksi random' },
];

// Inspection Methods
const INSPECTION_METHODS = [
  { key: 'Caliper', label: 'Digital Caliper', icon: '📏' },
  { key: 'Micrometer', label: 'Micrometer', icon: '🎯' },
  { key: 'Bore Gauge', label: 'Bore Gauge', icon: '🔘' },
  { key: 'Height Gauge', label: 'Height Gauge', icon: '📐' },
  { key: 'CMM', label: 'CMM Machine', icon: '🤖' },
  { key: 'Vision', label: 'Vision System', icon: '👁️' },
  { key: 'Profile Projector', label: 'Profile Projector', icon: '🔍' },
  { key: 'Go-No Go', label: 'Go/No Go Gauge', icon: '✓' },
];

// Default template for a check point
const createDefaultCheckPoint = (index, x = 200, y = 200) => ({
  id: `cp_${Date.now()}_${index}`,
  pointNumber: index,
  title: `Inspection Point ${index}`,
  category: 'dimension',
  nominal: 0,
  tolMin: 0,
  tolMax: 0,
  unit: 'mm',
  x: x,
  y: y,
  criticality: 'Minor',
  inspectionMethod: 'Caliper',
  toolId: '',
  notes: '',
  gdtSymbol: '',
  required: false,
  autoAdvance: true
});

export default function InspectorDesigner() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  
  // ─── State Management ───
  const [currentStep, setCurrentStep] = useState(1);
  const [drawingsList, setDrawingsList] = useState([]);
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [drawingPreview, setDrawingPreview] = useState(null);
  
  // Check sheet metadata
  const [checkSheetName, setCheckSheetName] = useState('');
  const [checkSheetDescription, setCheckSheetDescription] = useState('');
  const [workOrderPrefix, setWorkOrderPrefix] = useState('WO-2026');
  const [stationId, setStationId] = useState('ST-01');
  
  // Check points
  const [checkPoints, setCheckPoints] = useState([]);
  const [activePointId, setActivePointId] = useState(null);
  
  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPointId, setDraggedPointId] = useState(null);
  
  // Workflow settings
  const [guidedMode, setGuidedMode] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [requireSignature, setRequireSignature] = useState(true);
  
  // Preview & Export
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [previewQRCode, setPreviewQRCode] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Tables
  const [availableTables, setAvailableTables] = useState([]);
  const [targetTableId, setTargetTableId] = useState('');
  
  // ─── ISO 9001:2015 Check Sheet Header Fields ───
  const [partNo, setPartNo] = useState('');
  const [partName, setPartName] = useState('');
  const [customer, setCustomer] = useState('');
  const [processName, setProcessName] = useState('');
  const [drawingNo, setDrawingNo] = useState('');
  const [revisionNo, setRevisionNo] = useState('A');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [nextReviewDate, setNextReviewDate] = useState('');
  const [inspectorName, setInspectorName] = useState(currentUser?.username || '');
  const [approvedBy, setApprovedBy] = useState('');
  const [qualityStandard, setQualityStandard] = useState('ISO 9001:2015');

  // Check Sheet Status (ISO 9001 Document Control)
  const [checkSheetStatus, setCheckSheetStatus] = useState('draft'); // draft, pending_approval, approved, released, archived
  const [revisionHistory, setRevisionHistory] = useState([]);

  // Check Sheet Management
  const [savedTemplates, setSavedTemplates] = useState([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Interaction Modes
  const [isAddPinMode, setIsAddPinMode] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const containerRef = useRef(null);
  const canvasContentRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // Active point helper
  const activePoint = useMemo(() => {
    return checkPoints.find(p => p.id === activePointId) || null;
  }, [checkPoints, activePointId]);  
  // ─── Load Drawings on Mount ───
  useEffect(() => {
    const loadData = async () => {
      try {
        const drawings = await getAllDrawings();
        if (drawings && drawings.length > 0) {
          setDrawingsList(drawings);
        }
      } catch (err) {
        console.warn('Could not load drawings:', err);
      }

      try {
        const tables = await getTables();
        if (tables && tables.length > 0) {
          setAvailableTables(tables);
          const savedId = localStorage.getItem('mandor_inspector_target_table_id');
          if (savedId && tables.some(t => t.id === savedId)) {
            setTargetTableId(savedId);
          }
        }
      } catch (err) {
        console.warn('Could not load tables:', err);
      }

      // Load saved templates from localStorage
      const templates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
      setSavedTemplates(templates);
    };
    loadData();
  }, []);

  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [generatedTableInfo, setGeneratedTableInfo] = useState(null);

  // ─── Auto-Generate Dedicated Database Table ───
  const handleAutoGenerateTable = async () => {
    setIsGeneratingTable(true);
    const toastId = toast.loading('Membuat skema tabel otomatis di Supabase...');
    try {
      const cleanPart = (partNo || 'PART').replace(/[^a-zA-Z0-9_-]/g, '_');
      const tableName = `QC_${cleanPart}_${checkSheetName ? checkSheetName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20) : 'Checksheet'}`;
      
      const dynamicFields = [
        { id: 'fld_wo', name: 'WO Number', type: 'text', required: true },
        { id: 'fld_part_no', name: 'Part No', type: 'text', required: true },
        { id: 'fld_part_name', name: 'Part Name', type: 'text', required: false },
        { id: 'fld_station', name: 'Station ID', type: 'text', required: false },
        { id: 'fld_inspector', name: 'Inspector Name', type: 'text', required: false },
        { id: 'fld_overall_status', name: 'Overall Status', type: 'text', required: true },
        { id: 'fld_date_time', name: 'Date & Time', type: 'datetime', required: true },
      ];

      // Add columns for each check point
      checkPoints.forEach((pt, idx) => {
        const safeName = (pt.title || `Point_${pt.pointNumber || idx + 1}`).replace(/[^a-zA-Z0-9_ ]/g, '');
        dynamicFields.push({
          id: `fld_pt_${pt.pointNumber || idx + 1}_val`,
          name: `#${pt.pointNumber || idx + 1} ${safeName} (${pt.unit || 'mm'})`,
          type: 'number',
          required: pt.required || false
        });
        dynamicFields.push({
          id: `fld_pt_${pt.pointNumber || idx + 1}_status`,
          name: `#${pt.pointNumber || idx + 1} ${safeName} Status`,
          type: 'text',
          required: false
        });
      });

      const newTable = await createTable({
        name: tableName,
        description: `Tabel otomatis untuk ${checkSheetName || 'Quality Check Sheet'} (${partNo || 'General'}) dibuat dari Inspector Designer`,
        fields: dynamicFields
      });

      // Reload tables
      const allTables = await getTables();
      setAvailableTables(allTables);
      setTargetTableId(newTable.id);
      setGeneratedTableInfo(newTable);
      localStorage.setItem('mandor_inspector_target_table_id', newTable.id);

      toast.success(`Tabel "${newTable.name}" berhasil dibuat dengan ${dynamicFields.length} kolom otomatis!`, { id: toastId });
    } catch (err) {
      console.error('Error creating auto table:', err);
      toast.error(`Gagal membuat tabel otomatis: ${err.message || err}`, { id: toastId });
    } finally {
      setIsGeneratingTable(false);
    }
  };

  // ─── Create New Check Sheet (Reset & Fresh Setup) ───
  const handleCreateNewCheckSheet = () => {
    const defaultDocNo = `CS-${Date.now().toString(36).toUpperCase()}`;
    setCheckSheetName('New Quality Check Sheet');
    setPartNo('PART-' + Math.floor(1000 + Math.random() * 9000));
    setPartName('Precision Component');
    setCustomer('Manufacturing Division');
    setProcessName('Machining & Final QC');
    setDrawingNo('DWG-' + Math.floor(100 + Math.random() * 900));
    setRevisionNo('01');
    setCheckSheetDescription('ISO 9001:2015 Quality Inspection Check Sheet');
    setCheckSheetStatus('draft');
    setQualityStandard('ISO 9001:2015');
    setEffectiveDate(new Date().toISOString().split('T')[0]);
    setNextReviewDate(new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
    setWorkOrderPrefix('WO-2026');
    setStationId('ST-01');
    setSelectedDrawing(null);
    setDrawingPreview(null);
    setCheckPoints([]);
    setActivePointId(null);
    setSelectedTemplateId(null);
    setCurrentStep(1);
    toast.success('Lembar Check Sheet Baru siap dibuat! Silakan upload drawing atau tentukan parameter.');
  };

  // ─── Load Pre-defined QC Presets ───
  const handleLoadPresetTemplate = (presetType) => {
    let newPoints = [];
    let name = '';
    let part = '';
    let dwg = '';

    if (presetType === 'shaft') {
      name = 'Shaft & Bearing Seat QA Check Sheet';
      part = 'SFT-2540-V2';
      dwg = 'DWG-SFT-001';
      newPoints = [
        { id: `cp_${Date.now()}_1`, pointNumber: 1, title: 'Main Bearing Bore Ø', category: 'diameter', nominal: 25.000, tolMin: 24.985, tolMax: 25.015, unit: 'mm', x: 260, y: 320, criticality: 'Critical (CC)', inspectionMethod: 'Bore Gauge', toolId: 'BG-01', required: true, autoAdvance: true, gdtSymbol: '⌀', notes: 'H7 Tolerance Fit' },
        { id: `cp_${Date.now()}_2`, pointNumber: 2, title: 'Outer Journal Diameter', category: 'diameter', nominal: 40.000, tolMin: 39.990, tolMax: 40.010, unit: 'mm', x: 520, y: 320, criticality: 'Major', inspectionMethod: 'Micrometer', toolId: 'MIC-02', required: true, autoAdvance: true, gdtSymbol: '⌀', notes: 'h6 Shaft Fit' },
        { id: `cp_${Date.now()}_3`, pointNumber: 3, title: 'Overall Shaft Length', category: 'dimension', nominal: 150.000, tolMin: 149.800, tolMax: 150.200, unit: 'mm', x: 400, y: 190, criticality: 'Minor', inspectionMethod: 'Digital Caliper', toolId: 'CAL-01', required: false, autoAdvance: true, gdtSymbol: '', notes: 'Overall dimension' },
        { id: `cp_${Date.now()}_4`, pointNumber: 4, title: 'Bearing Seat Surface Roughness', category: 'roughness', nominal: 0.800, tolMin: 0.000, tolMax: 0.800, unit: 'Ra', x: 740, y: 320, criticality: 'Critical (CC)', inspectionMethod: 'Roughness Tester', toolId: 'RT-01', required: true, autoAdvance: true, gdtSymbol: 'Ra', notes: 'Max Ra 0.8 um' }
      ];
    } else if (presetType === 'flange') {
      name = 'Flange & PCD Bolt Hole Pattern QC';
      part = 'FLG-120-PCD';
      dwg = 'DWG-FLG-002';
      newPoints = [
        { id: `cp_${Date.now()}_1`, pointNumber: 1, title: 'Flange Outer Diameter', category: 'diameter', nominal: 120.000, tolMin: 119.850, tolMax: 120.150, unit: 'mm', x: 300, y: 220, criticality: 'Major', inspectionMethod: 'Digital Caliper', toolId: 'CAL-01', required: true, autoAdvance: true, gdtSymbol: '⌀', notes: 'OD Turn' },
        { id: `cp_${Date.now()}_2`, pointNumber: 2, title: 'Pitch Circle Diameter (PCD)', category: 'diameter', nominal: 95.000, tolMin: 94.900, tolMax: 95.100, unit: 'mm', x: 500, y: 350, criticality: 'Critical (CC)', inspectionMethod: 'CMM', toolId: 'CMM-01', required: true, autoAdvance: true, gdtSymbol: '⌀', notes: '4x M10 Holes' },
        { id: `cp_${Date.now()}_3`, pointNumber: 3, title: 'Flange Thickness', category: 'dimension', nominal: 15.000, tolMin: 14.850, tolMax: 15.150, unit: 'mm', x: 700, y: 350, criticality: 'Minor', inspectionMethod: 'Micrometer', toolId: 'MIC-01', required: false, autoAdvance: true, gdtSymbol: '', notes: 'Facing face' },
        { id: `cp_${Date.now()}_4`, pointNumber: 4, title: 'Mating Face Flatness', category: 'flatness', nominal: 0.050, tolMin: 0.000, tolMax: 0.050, unit: 'mm', x: 500, y: 520, criticality: 'Critical (CC)', inspectionMethod: 'Dial Indicator', toolId: 'DIAL-01', required: true, autoAdvance: true, gdtSymbol: '⊥', notes: 'Gasket Sealing Surface' }
      ];
    } else {
      name = 'Stamping & Sheet Metal QC Sheet';
      part = 'BKT-SHT-04';
      dwg = 'DWG-BKT-003';
      newPoints = [
        { id: `cp_${Date.now()}_1`, pointNumber: 1, title: 'Sheet Material Thickness', category: 'dimension', nominal: 2.000, tolMin: 1.900, tolMax: 2.100, unit: 'mm', x: 300, y: 250, criticality: 'Major', inspectionMethod: 'Digital Caliper', toolId: 'CAL-01', required: true, autoAdvance: true, gdtSymbol: '', notes: 'Cold Rolled Steel' },
        { id: `cp_${Date.now()}_2`, pointNumber: 2, title: '90 Degree Bending Angle', category: 'angle', nominal: 90.000, tolMin: 89.000, tolMax: 91.000, unit: '°', x: 520, y: 340, criticality: 'Critical (CC)', inspectionMethod: 'Angle Gauge / Bevel', toolId: 'AG-01', required: true, autoAdvance: true, gdtSymbol: '∠', notes: 'Bending Die Check' },
        { id: `cp_${Date.now()}_3`, pointNumber: 3, title: 'Mounting Hole Distance to Edge', category: 'dimension', nominal: 18.500, tolMin: 18.250, tolMax: 18.750, unit: 'mm', x: 700, y: 250, criticality: 'Minor', inspectionMethod: 'Height Gauge', toolId: 'HG-01', required: false, autoAdvance: true, gdtSymbol: '', notes: 'Punching location' }
      ];
    }

    setCheckSheetName(name);
    setPartNo(part);
    setPartName(name);
    setDrawingNo(dwg);
    setCheckPoints(newPoints);
    setActivePointId(newPoints[0]?.id || null);
    setCurrentStep(3); // Jump straight to parameter editing
    toast.success(`Template preset "${name}" loaded dengan ${newPoints.length} titik ukur!`);
  };
  
  // ─── Direct File Upload (PDF, DXF, SVG, Image) ───
  const handleDirectFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileName = file.name;
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    const ext = fileName.split('.').pop().toLowerCase();
    
    setIsUploading(true);
    const toastId = toast.loading(`Memproses ${fileName}...`);

    try {
      let previewContent = null;
      let extractedDimensions = [];
      const drawingId = `dwg_direct_${Date.now()}`;

      if (ext === 'pdf') {
        const reader = new FileReader();
        const fileDataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Convert PDF to High-Res Image Data URL
        const imagePngUrl = await convertPdfToImageDataUrl(fileDataUrl, 2.5);
        previewContent = `<img src="${imagePngUrl}" style="width:100%;height:100%;object-fit:contain;" />`;

      } else if (ext === 'dxf') {
        const text = await file.text();
        const dxfResult = parseDxfContent(text, fileName);
        
        if (dxfResult && dxfResult.rendered_image) {
          previewContent = `<img src="${dxfResult.rendered_image}" style="width:100%;height:100%;object-fit:contain;" />`;
        } else if (dxfResult && dxfResult.svg) {
          previewContent = dxfResult.svg;
        }

        if (dxfResult && dxfResult.dimensions && dxfResult.dimensions.length > 0) {
          extractedDimensions = dxfResult.dimensions;
        }

      } else if (ext === 'svg') {
        const svgText = await file.text();
        previewContent = svgText;

      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        const reader = new FileReader();
        const dataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        previewContent = `<img src="${dataUrl}" style="width:100%;height:100%;object-fit:contain;" />`;
      } else {
        throw new Error('Format file tidak didukung. Harap upload file PDF, DXF, SVG, atau PNG/JPG.');
      }

      // Create Drawing Object
      const newDrawing = {
        id: drawingId,
        name: cleanName,
        fileName: fileName,
        fileType: ext.toUpperCase(),
        description: `Uploaded directly in Inspector Designer on ${new Date().toLocaleDateString()}`,
        svgData: previewContent,
        dimensions: extractedDimensions,
        createdAt: new Date().toISOString()
      };

      // Set State
      setSelectedDrawing(newDrawing);
      setDrawingPreview(previewContent);
      setCheckSheetName(cleanName);
      setDrawingsList(prev => [newDrawing, ...prev]);

      // If dimensions were extracted from DXF, automatically convert to checkpoints
      if (extractedDimensions.length > 0) {
        const converted = extractedDimensions.map((dim, idx) => ({
          id: `cp_${Date.now()}_${idx}`,
          pointNumber: idx + 1,
          title: dim.label || `Point ${idx + 1}`,
          category: dim.category || 'dimension',
          nominal: parseFloat(dim.spec) || 0,
          tolMin: dim.tolMin || 0,
          tolMax: dim.tolMax || 0,
          unit: dim.unit || 'mm',
          x: dim.lx || dim.x1 || 200 + idx * 40,
          y: dim.ly || dim.y1 || 200,
          criticality: dim.severity || 'Minor',
          inspectionMethod: dim.inspection_method || 'Caliper',
          toolId: dim.variable || '',
          notes: '',
          gdtSymbol: dim.gdt_symbol || '',
          required: dim.severity === 'Critical (CC)',
          autoAdvance: true
        }));
        setCheckPoints(converted);
      }

      // Persist to database in background
      try {
        await saveDrawing(newDrawing);
      } catch (saveErr) {
        console.warn('Auto-save to database failed, drawing kept in local state:', saveErr);
      }

      toast.success(`${fileName} berhasil dimuat!`, { id: toastId });
      setCurrentStep(3); // Automatically jump to parameter setup!

    } catch (err) {
      console.error('Direct upload failed:', err);
      toast.error(`Gagal upload: ${err.message}`, { id: toastId });
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // ─── Select Drawing ───
  const handleSelectDrawing = (drawing) => {
    setSelectedDrawing(drawing);
    setDrawingPreview(drawing.svgData || drawing.dataUrl || null);
    setCheckSheetName(drawing.name || 'New Check Sheet');
    setCheckSheetDescription(drawing.description || '');
    
    // If drawing has dimensions, convert to check points
    if (drawing.dimensions && drawing.dimensions.length > 0) {
      const convertedPoints = drawing.dimensions.map((dim, idx) => ({
        id: `cp_${Date.now()}_${idx}`,
        pointNumber: idx + 1,
        title: dim.label || `Point ${idx + 1}`,
        category: dim.category || 'dimension',
        nominal: parseFloat(dim.spec) || 0,
        tolMin: dim.tolMin || 0,
        tolMax: dim.tolMax || 0,
        unit: dim.unit || 'mm',
        x: dim.lx || dim.x1 || 200 + idx * 50,
        y: dim.ly || dim.y1 || 200,
        criticality: dim.severity || 'Minor',
        inspectionMethod: dim.inspection_method || 'Caliper',
        toolId: dim.variable || '',
        notes: '',
        gdtSymbol: dim.gdt_symbol || '',
        required: dim.severity === 'Critical (CC)',
        autoAdvance: true
      }));
      setCheckPoints(convertedPoints);
      toast.success(`Loaded ${convertedPoints.length} parameters from drawing!`);
    }
  };
  
  // ─── Add Check Point ───
  const handleAddCheckPoint = () => {
    const newPoint = createDefaultCheckPoint(
      checkPoints.length + 1,
      200 + Math.random() * 400,
      200 + Math.random() * 300
    );
    setCheckPoints([...checkPoints, newPoint]);
    setActivePointId(newPoint.id);
    toast.success('New inspection point added!');
  };
  
  // ─── Update Check Point ───
  const handleUpdatePoint = (field, value) => {
    if (!activePointId) return;
    setCheckPoints(prev => prev.map(p => 
      p.id === activePointId ? { ...p, [field]: value } : p
    ));
  };
  
  // ─── Delete Check Point ───
  const handleDeletePoint = (pointId) => {
    if (!window.confirm('Delete this inspection point?')) return;
    const updated = checkPoints.filter(p => p.id !== pointId);
    // Renumber
    const renumbered = updated.map((p, idx) => ({ ...p, pointNumber: idx + 1 }));
    setCheckPoints(renumbered);
    if (activePointId === pointId) {
      setActivePointId(null);
    }
    toast.success('Point deleted');
  };
  
  // ─── Duplicate Check Point ───
  const handleDuplicatePoint = (pointId) => {
    const point = checkPoints.find(p => p.id === pointId);
    if (!point) return;
    const newPoint = {
      ...point,
      id: `cp_${Date.now()}_${checkPoints.length + 1}`,
      pointNumber: checkPoints.length + 1,
      title: point.title + ' (Copy)',
      x: point.x + 20,
      y: point.y + 20
    };
    setCheckPoints([...checkPoints, newPoint]);
    toast.success('Point duplicated');
  };
  
  // ─── Precise Canvas Coordinate Conversion ───
  const getCanvasCoords = (clientX, clientY) => {
    if (!canvasContentRef.current) return { x: 200, y: 200 };
    const rect = canvasContentRef.current.getBoundingClientRect();
    const x = Math.round((clientX - rect.left) / zoom);
    const y = Math.round((clientY - rect.top) / zoom);
    return {
      x: Math.max(15, Math.min(985, x)),
      y: Math.max(15, Math.min(685, y))
    };
  };

  // ─── Pin Mouse Down Handler (Drag Start) ───
  const handlePinMouseDown = (e, pointId) => {
    e.stopPropagation();
    e.preventDefault();
    setActivePointId(pointId);
    setIsDragging(true);
    setDraggedPointId(pointId);
  };

  // ─── Canvas Mouse Down Handler (Pan or Add Pin) ───
  const handleCanvasMouseDown = (e) => {
    if (isAddPinMode) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      const newPoint = createDefaultCheckPoint(
        checkPoints.length + 1,
        coords.x,
        coords.y
      );
      setCheckPoints(prev => [...prev, newPoint]);
      setActivePointId(newPoint.id);
      setCurrentStep(3);
      toast.success(`Point #${newPoint.pointNumber} added at (${coords.x}, ${coords.y})`);
      setIsAddPinMode(false);
      return;
    }

    // Start canvas panning
    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // ─── Canvas Double Click (Direct Add Pin on Click) ───
  const handleCanvasDoubleClick = (e) => {
    const coords = getCanvasCoords(e.clientX, e.clientY);
    const newPoint = createDefaultCheckPoint(
      checkPoints.length + 1,
      coords.x,
      coords.y
    );
    setCheckPoints(prev => [...prev, newPoint]);
    setActivePointId(newPoint.id);
    setCurrentStep(3);
    toast.success(`Point #${newPoint.pointNumber} added at (${coords.x}, ${coords.y})`);
  };

  // ─── Mouse Move and Mouse Up Handlers ───
  const handleCanvasMouseMove = (e) => {
    if (isDragging && draggedPointId) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setCheckPoints(prev => prev.map(p => 
        p.id === draggedPointId ? { ...p, x: coords.x, y: coords.y } : p
      ));
    } else if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    }
  };

  const handleCanvasMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      setDraggedPointId(null);
    }
    if (isPanning) {
      setIsPanning(false);
    }
  };

  // ─── Global Smooth Drag & Pan Mouse Listeners ───
  useEffect(() => {
    const handleWindowMouseMove = (e) => {
      if (isDragging && draggedPointId) {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setCheckPoints(prev => prev.map(p => 
          p.id === draggedPointId ? { ...p, x: coords.x, y: coords.y } : p
        ));
      } else if (isPanning) {
        setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      }
    };

    const handleWindowMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDraggedPointId(null);
      }
      if (isPanning) {
        setIsPanning(false);
      }
    };

    if (isDragging || isPanning) {
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isDragging, isPanning, draggedPointId, panStart, zoom]);
  
  // ─── Save Check Sheet Template ───
  const handleSaveTemplate = async () => {
    if (!checkSheetName.trim() && !partNo.trim()) {
      toast.error('Please enter a check sheet name or part number');
      return;
    }

    setIsSaving(true);
    try {
      const templateId = `TMPL_${partNo || 'PART'}_${Date.now().toString(36).toUpperCase()}`;
      const templateData = {
        // ISO 9001 Document Control
        id: templateId,
        docNo: `CS-${partNo || 'PART'}-${revisionNo}`,
        status: checkSheetStatus,
        qualityStandard,
        revision: revisionNo,
        effectiveDate,
        nextReviewDate,
        updatedAt: new Date().toISOString(),

        // Master Data
        name: checkSheetName || `Check Sheet - ${partNo}`,
        partNo,
        partName,
        customer,
        processName,
        drawingNo,
        description: checkSheetDescription,
        workOrderPrefix,
        stationId,

        // Personnel
        inspectorName,
        approvedBy,
        createdBy: currentUser?.username || 'Unknown',
        createdAt: new Date().toISOString(),

        // Drawing Reference
        drawingId: selectedDrawing?.id || null,
        drawingName: selectedDrawing?.name || null,
        drawingSvg: drawingPreview,

        // Inspection Points
        checkPoints: checkPoints,
        workflowSettings: {
          guidedMode,
          autoAdvance,
          requirePhoto,
          requireSignature
        },
        version: '1.0'
      };

      // Save to localStorage
      const templates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
      templates.push(templateData);
      setSavedTemplates(templates);
      localStorage.setItem('mandor_inspector_templates', JSON.stringify(templates));
      
      toast.success('Check Sheet template saved!');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };
  
  // ─── Export to Digital Check Sheet ───
  const handleExportToCheckSheet = () => {
    if (checkPoints.length === 0) {
      toast.error('Please add at least one inspection point');
      return;
    }
    
    const publishId = `CS-${partNo || 'PART'}-${Date.now().toString(36).toUpperCase()}`;

    const checkSheetData = {
      // ISO 9001:2015 Document Control Fields
      id: publishId,
      docNo: publishId,
      status: checkSheetStatus,
      qualityStandard,
      revision: revisionNo,
      effectiveDate,
      nextReviewDate,

      // Master Data Header
      partNo,
      partName,
      customer,
      processName,
      drawingNo,
      description: checkSheetDescription,
      workOrderPrefix,
      stationId,

      // Personnel
      inspectorName,
      approvedBy,
      createdBy: currentUser?.username || 'Unknown',
      createdAt: new Date().toISOString(),

      // Drawing Reference
      drawingId: selectedDrawing?.id || null,
      drawingName: selectedDrawing?.name || null,
      drawingSvg: drawingPreview,

      // Inspection Points
      checkPoints: checkPoints.map(p => ({
        id: p.id,
        pointNumber: p.pointNumber,
        title: p.title,
        category: p.category,
        nominal: p.nominal,
        tolMin: p.tolMin,
        tolMax: p.tolMax,
        unit: p.unit,
        x: p.x,
        y: p.y,
        criticality: p.criticality,
        tool: p.inspectionMethod,
        toolId: p.toolId,
        gdtSymbol: p.gdtSymbol,
        notes: p.notes,
        required: p.required,
        status: 'PENDING',
        measuredVal: '',
        disposition: 'Pending Inspection'
      })),
      workflowSettings: {
        guidedMode,
        autoAdvance,
        requirePhoto,
        requireSignature
      },
      publishedAt: new Date().toISOString(),
      publishedBy: currentUser?.username || 'Unknown'
    };
    
    // Save to localStorage for Digital Check Sheet
    localStorage.setItem('mandor_published_checksheet', JSON.stringify(checkSheetData));
    localStorage.setItem('mandor_checksheet_published', 'true');
    localStorage.setItem('mandor_checksheet_publish_id', publishId);
    
    toast.success('Exported to Digital Check Sheet! ID: ' + publishId);
    navigate('/qa-checksheet');
  };
  
  // ─── Generate QR Code ───
  const handleGenerateQR = () => {
    const baseUrl = window.location.origin;
    const publishId = `CHECKSHEET_${workOrderPrefix}_${Date.now().toString(36)}`;
    const qrUrl = `${baseUrl}/live-player?checksheet=${publishId}&mode=companion&wo=${encodeURIComponent(checkSheetName)}`;
    setPreviewQRCode(qrUrl);
    setShowQRModal(true);
  };
  
  const getCategoryColor = (key) => {
    const cat = PARAM_CATEGORIES.find(c => c.key === key);
    return cat?.color || '#64748b';
  };
  
  const getCategoryIcon = (key) => {
    const cat = PARAM_CATEGORIES.find(c => c.key === key);
    return cat?.icon || '📐';
  };
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#0b1120',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      overflow: 'hidden',
      width: '100%',
      height: '100%'
    }}>
      <Toaster position="top-right" />
      
      {/* ─── Header ─── */}
      <div style={{
        height: '56px',
        backgroundColor: '#0f172a',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px', height: '32px',
            backgroundColor: '#8b5cf6',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Ruler size={18} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
              INSPECTOR DESIGNER STUDIO
            </div>
            <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
              Design QC inspection workflows
            </div>
          </div>
        </div>
        
        {/* Top Step Indicator (6-Step Process) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {[
            { num: 1, label: 'Header', icon: ClipboardList, color: '#38bdf8' },
            { num: 2, label: 'Drawing', icon: Layers, color: '#a78bfa' },
            { num: 3, label: 'Parameters', icon: Ruler, color: '#f59e0b' },
            { num: 4, label: 'Data', icon: Database, color: '#10b981' },
            { num: 5, label: 'Workflow', icon: SlidersHorizontal, color: '#ec4899' },
            { num: 6, label: 'Deploy', icon: Sparkles, color: '#06b6d4' }
          ].map((s, idx) => {
            const IconCmp = s.icon;
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setCurrentStep(s.num)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: isActive ? '4px 10px' : '4px 7px',
                    borderRadius: '20px',
                    backgroundColor: isActive 
                      ? 'rgba(139, 92, 246, 0.25)' 
                      : isCompleted 
                      ? 'rgba(16, 185, 129, 0.12)' 
                      : 'rgba(30, 41, 59, 0.5)',
                    border: isActive 
                      ? '1.5px solid #a78bfa' 
                      : isCompleted 
                      ? '1px solid rgba(16, 185, 129, 0.4)' 
                      : '1px solid #334155',
                    color: isActive ? '#ffffff' : isCompleted ? '#34d399' : '#94a3b8',
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{
                    width: '18px', height: '18px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#8b5cf6' : isCompleted ? '#10b981' : '#334155',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.62rem', fontWeight: 800
                  }}>
                    {isCompleted ? <Check size={11} strokeWidth={3} /> : <IconCmp size={10} />}
                  </div>
                  <span>{s.label}</span>
                </button>
                {idx < 5 && (
                  <div style={{
                    width: '8px',
                    height: '2px',
                    backgroundColor: currentStep > s.num ? '#10b981' : '#334155'
                  }} />
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* ISO 9001 Status Badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: checkSheetStatus === 'draft' ? '#64748b' :
                             checkSheetStatus === 'pending_approval' ? '#f59e0b' :
                             checkSheetStatus === 'approved' ? '#22c55e' :
                             checkSheetStatus === 'released' ? '#3b82f6' : '#ef4444',
            color: 'white',
            fontSize: '0.65rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={12} />
            {checkSheetStatus === 'draft' ? 'DRAFT' :
             checkSheetStatus === 'pending_approval' ? 'PENDING APPROVAL' :
             checkSheetStatus === 'approved' ? 'APPROVED' :
             checkSheetStatus === 'released' ? 'RELEASED' : 'ARCHIVED'}
          </div>

          {/* Checksheet Management ISO 9001 */}
          <button
            onClick={() => navigate('/checksheets')}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="Buka Checksheet Management ISO 9001"
          >
            <FolderArchive size={14} /> Dokumen ISO
          </button>

          {/* Template Library Button */}
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <FileText size={14} />
            Library ({savedTemplates.length})
          </button>

          {/* Revision History */}
          <button
            onClick={() => setShowRevisionModal(true)}
            style={{
              padding: '6px 10px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '6px',
              fontSize: '0.72rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} />
            Rev {revisionNo}
          </button>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Create New Check Sheet */}
          <button
            onClick={handleCreateNewCheckSheet}
            style={{
              padding: '7px 14px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)'
            }}
            title="Mulai membuat lembar checksheet inspeksi baru dari awal"
          >
            <PlusCircle size={15} /> + Create New Check Sheet
          </button>

          <button
            onClick={() => navigate('/qa-checksheet')}
            style={{
              padding: '7px 12px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        </div>
      </div>      
      {/* ─── Main Content ─── */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '320px 1fr 360px', overflow: 'hidden' }}>
        
        {/* ─── LEFT PANEL: Navigation & Tools ─── */}
        <div style={{
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '10px 12px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#090d16'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              {currentStep === 1 && <ClipboardList size={16} color="#38bdf8" />}
              {currentStep === 2 && <Layers size={16} color="#a78bfa" />}
              {currentStep === 3 && <Ruler size={16} color="#f59e0b" />}
              {currentStep === 4 && <Database size={16} color="#10b981" />}
              {currentStep === 5 && <SlidersHorizontal size={16} color="#ec4899" />}
              {currentStep === 6 && <Sparkles size={16} color="#06b6d4" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                {currentStep === 1 ? '1. Parameter Header & Info' :
                 currentStep === 2 ? '2. Upload Drawing / CAD' :
                 currentStep === 3 ? '3. Inspection Parameters' :
                 currentStep === 4 ? '4. Data & Auto-Table' :
                 currentStep === 5 ? '5. Workflow Step & Rules' :
                 '6. Deploy & Export'}
              </span>
            </div>
            
            {/* Step Navigation Bar with Pro Icons */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '4px',
              backgroundColor: '#050811',
              padding: '4px',
              borderRadius: '8px',
              border: '1px solid #1e293b'
            }}>
              {[
                { num: 1, label: 'Header', icon: ClipboardList, color: '#38bdf8' },
                { num: 2, label: 'Drawing', icon: Layers, color: '#a78bfa' },
                { num: 3, label: 'Param', icon: Ruler, color: '#f59e0b' },
                { num: 4, label: 'Data', icon: Database, color: '#10b981' },
                { num: 5, label: 'Flow', icon: SlidersHorizontal, color: '#ec4899' },
                { num: 6, label: 'Deploy', icon: Sparkles, color: '#06b6d4' }
              ].map(s => {
                const IconComponent = s.icon;
                const isActive = currentStep === s.num;
                const isCompleted = currentStep > s.num;
                return (
                  <button
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '7px 2px',
                      backgroundColor: isActive 
                        ? '#7c3aed'
                        : isCompleted 
                        ? 'rgba(15, 23, 42, 0.9)' 
                        : 'rgba(30, 41, 59, 0.4)',
                      backgroundImage: isActive ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'none',
                      color: isActive ? '#ffffff' : isCompleted ? '#cbd5e1' : '#64748b',
                      border: isActive 
                        ? '1px solid #c084fc' 
                        : isCompleted 
                        ? '1px solid rgba(139, 92, 246, 0.3)' 
                        : '1px solid rgba(51, 65, 85, 0.4)',
                      borderRadius: '6px',
                      fontSize: '0.62rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.18s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isActive ? '0 3px 10px rgba(139, 92, 246, 0.45)' : 'none',
                      position: 'relative'
                    }}
                    title={`Step ${s.num}: ${s.label}`}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isActive ? '#ffffff' : s.color
                    }}>
                      <IconComponent size={14} strokeWidth={isActive ? 2.6 : 2} />
                    </div>
                    <span style={{
                      fontSize: '0.58rem',
                      letterSpacing: '-0.01em',
                      lineHeight: 1,
                      fontWeight: isActive ? 800 : 600
                    }}>
                      {s.num}.{s.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* ─── STEP 1: Parameter Header & Info ─── */}
          {currentStep === 1 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>

              {/* ISO 9001 Document Info Card */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '12px',
                border: '1px solid #8b5cf6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <Shield size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa' }}>
                    ISO 9001:2015 DOCUMENT CONTROL
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Document No
                    </label>
                    <input
                      type="text"
                      value={partNo ? `CS-${partNo}-${revisionNo}` : ''}
                      readOnly
                      placeholder="Auto-generated"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#090d16',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: '#8b5cf6',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Revision
                    </label>
                    <select
                      value={revisionNo}
                      onChange={e => setRevisionNo(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    >
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].map(r => (
                        <option key={r} value={r}>Rev {r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Effective Date
                    </label>
                    <input
                      type="date"
                      value={effectiveDate}
                      onChange={e => setEffectiveDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Next Review
                    </label>
                    <input
                      type="date"
                      value={nextReviewDate}
                      onChange={e => setNextReviewDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Master Data Header */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <ClipboardList size={14} color="#22c55e" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#22c55e' }}>
                    MASTER DATA HEADER
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Part No / Part Number *
                    </label>
                    <input
                      type="text"
                      value={partNo}
                      onChange={e => setPartNo(e.target.value)}
                      placeholder="e.g., 12345-A"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Part Name / Description *
                    </label>
                    <input
                      type="text"
                      value={partName}
                      onChange={e => setPartName(e.target.value)}
                      placeholder="e.g., Engine Casting Housing"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Customer / Pelanggan
                    </label>
                    <input
                      type="text"
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder="e.g., PT Astra Honda"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Process / Proses
                    </label>
                    <input
                      type="text"
                      value={processName}
                      onChange={e => setProcessName(e.target.value)}
                      placeholder="e.g., CNC Machining, Die Casting"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Drawing No / No Drawing
                    </label>
                    <input
                      type="text"
                      value={drawingNo}
                      onChange={e => setDrawingNo(e.target.value)}
                      placeholder="e.g., DWG-2024-001 Rev A"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Quality Standard
                    </label>
                    <select
                      value={qualityStandard}
                      onChange={e => setQualityStandard(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '0.8rem',
                        outline: 'none'
                      }}
                    >
                      <option value="ISO 9001:2015">ISO 9001:2015 Quality Management</option>
                      <option value="IATF 16949">IATF 16949 Automotive</option>
                      <option value="AS9100D">AS9100D Aerospace</option>
                      <option value="ISO 13485">ISO 13485 Medical Devices</option>
                      <option value="Internal QC">Internal QC Standard</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Personnel */}
              <div style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <User size={14} color="#38bdf8" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#38bdf8' }}>
                    PERSONNEL & STATION
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Inspector
                    </label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={e => setInspectorName(e.target.value)}
                      placeholder="Nama inspector"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Approved By
                    </label>
                    <input
                      type="text"
                      value={approvedBy}
                      onChange={e => setApprovedBy(e.target.value)}
                      placeholder="QC Manager"
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      WO Prefix
                    </label>
                    <input
                      type="text"
                      value={workOrderPrefix}
                      onChange={e => setWorkOrderPrefix(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                      Station ID
                    </label>
                    <input
                      type="text"
                      value={stationId}
                      onChange={e => setStationId(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 8px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '4px',
                        color: 'white',
                        fontSize: '0.75rem',
                        outline: 'none'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Check Sheet Description / Catatan
                </label>
                <textarea
                  value={checkSheetDescription}
                  onChange={e => setCheckSheetDescription(e.target.value)}
                  placeholder="Optional description or notes..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.75rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Next Step Button */}
              <button
                onClick={() => setCurrentStep(2)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                }}
              >
                Lanjut ke Step 2: Upload Drawing <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 2: Upload Drawing / Blueprint ─── */}
          {currentStep === 2 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                  Upload Gambar Teknik / Blueprint
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  Upload blueprint PDF, DXF, SVG, atau gambar komponen yang akan diinspeksi.
                </div>
              </div>

              {/* Direct Blueprint Upload Dropzone */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleDirectFileUpload}
                accept=".pdf,.dxf,.svg,.png,.jpg,.jpeg,.webp"
                style={{ display: 'none' }}
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '24px 16px',
                  border: '2px dashed #8b5cf6',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(139, 92, 246, 0.08)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '16px'
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.08)'; }}
              >
                <Upload size={32} color="#a78bfa" />
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f8fafc' }}>
                  {isUploading ? 'Memproses File CAD/PDF...' : 'Klik atau Drop File Blueprint'}
                </div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                  Mendukung PDF Vektor, AutoCAD DXF, SVG & PNG/JPG
                </div>
              </div>

              {/* Drawing Status Card */}
              {selectedDrawing ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <CheckCircle2 size={16} color="#10b981" />
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#34d399' }}>
                      Drawing Aktif Dimuat
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                    {selectedDrawing.name}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
                    Format: {selectedDrawing.fileType} {selectedDrawing.dimensions?.length > 0 ? `• ${selectedDrawing.dimensions.length} dimensi terdeteksi` : ''}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '1px dashed #475569',
                  color: '#94a3b8',
                  fontSize: '0.72rem',
                  textAlign: 'center',
                  marginBottom: '16px'
                }}>
                  Belum ada drawing dimuat. Silakan upload file gambar teknik di atas.
                </div>
              )}

              {/* Preset QC Templates */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px' }}>
                  Atau Gunakan Template Blueprint Preset:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => handleLoadPresetTemplate('shaft')}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    🔧 Shaft & Bearing Seat QC (4 Titik Ukur)
                  </button>
                  <button
                    onClick={() => handleLoadPresetTemplate('flange')}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    ⚙️ Flange & PCD Bolt Pattern (4 Titik Ukur)
                  </button>
                  <button
                    onClick={() => handleLoadPresetTemplate('sheet')}
                    style={{
                      padding: '8px 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    📐 Stamping & Sheet Metal (3 Titik Ukur)
                  </button>
                </div>
              </div>

              {/* Next Step Button */}
              <button
                onClick={() => setCurrentStep(3)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                }}
              >
                Lanjut ke Step 3: Parameters Inspeksi <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 3: Inspection Parameters & Points ─── */}
          {currentStep === 3 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={handleAddCheckPoint}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                  }}
                >
                  <PlusCircle size={16} /> + Add Point
                </button>

                <button
                  onClick={() => setIsAddPinMode(!isAddPinMode)}
                  style={{
                    padding: '10px 14px',
                    backgroundColor: isAddPinMode ? '#22c55e' : '#1e293b',
                    color: isAddPinMode ? '#0f172a' : '#f8fafc',
                    border: isAddPinMode ? '1px solid #22c55e' : '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title="Klik di kanvas gambar teknik untuk meletakkan pin inspeksi"
                >
                  <Target size={15} />
                  {isAddPinMode ? 'Pin Aktif' : 'Pin Mode'}
                </button>
              </div>

              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '10px', lineHeight: 1.4 }}>
                Total: <span style={{ color: '#a78bfa', fontWeight: 800 }}>{checkPoints.length} Titik Ukur</span>. Klik titik di bawah atau di kanvas untuk mengedit parameter nominal & toleransi di panel kanan.
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
                {checkPoints.map(point => (
                  <div
                    key={point.id}
                    onClick={() => setActivePointId(point.id)}
                    style={{
                      padding: '10px',
                      backgroundColor: activePointId === point.id ? 'rgba(139, 92, 246, 0.2)' : '#1e293b',
                      border: activePointId === point.id ? '1px solid #8b5cf6' : '1px solid #334155',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <div style={{
                      width: '24px', height: '24px',
                      borderRadius: '50%',
                      backgroundColor: getCategoryColor(point.category),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.7rem', fontWeight: 800,
                      color: 'white'
                    }}>
                      {point.pointNumber}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                        {point.title}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                        {getCategoryIcon(point.category)} {point.nominal} {point.unit} (±{point.tolMin}-{point.tolMax}) • {point.criticality || 'Minor'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePoint(point.id); }}
                      style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        color: '#ef4444',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                
                {checkPoints.length === 0 && (
                  <div style={{
                    padding: '24px',
                    backgroundColor: '#1e293b',
                    borderRadius: '8px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.78rem'
                  }}>
                    Belum ada titik ukur.<br />Klik "+ Add Point" atau klik di kanvas untuk menambah pin.
                  </div>
                )}
              </div>

              {/* Next Step Button */}
              <button
                onClick={() => setCurrentStep(4)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                }}
              >
                Lanjut ke Step 4: Data & Auto-Table <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 4: Data & Auto Table Generator (Attribute Drawing ke Sistem Tabel) ─── */}
          {currentStep === 4 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              
              {/* Feature Header Card */}
              <div style={{
                backgroundColor: 'rgba(139, 92, 246, 0.12)',
                border: '1px solid #8b5cf6',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Database size={18} color="#a78bfa" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                    Pembuatan Tabel Otomatis Attribute Drawing
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', lineHeight: 1.5, marginBottom: '12px' }}>
                  Sistem mengekstrak attribute drawing & parameter ({checkPoints.length} titik ukur) langsung menjadi skema tabel database Supabase siap pakai.
                </div>

                <button
                  onClick={handleAutoGenerateTable}
                  disabled={isGeneratingTable}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    cursor: isGeneratingTable ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)'
                  }}
                >
                  <Zap size={16} />
                  {isGeneratingTable ? 'Membuat Tabel di Supabase...' : '⚡ Buat Tabel Database Otomatis'}
                </button>
              </div>

              {/* Attribute Mapping Preview */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#f8fafc' }}>
                    Mapping Kolom Attribute Drawing ({7 + checkPoints.length * 2} Kolom)
                  </span>
                  <span style={{ fontSize: '0.62rem', color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                    Auto-Generated
                  </span>
                </div>

                <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
                  {/* System Header Columns */}
                  <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px', marginBottom: '2px' }}>
                    • System & Header Attributes (Otomatis)
                  </div>
                  {[
                    { label: 'WO Number', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Part No', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Part Name', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Station ID', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Inspector', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Overall Status', type: 'TEXT', color: '#38bdf8' },
                    { label: 'Date & Time', type: 'DATETIME (AUTO)', color: '#10b981', isHighlight: true }
                  ].map((col, idx) => (
                    <div key={idx} style={{
                      padding: '5px 8px',
                      backgroundColor: col.isHighlight ? 'rgba(16, 185, 129, 0.1)' : '#0f172a',
                      border: col.isHighlight ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(255,255,255,0.03)',
                      borderRadius: '5px',
                      fontSize: '0.7rem',
                      color: col.isHighlight ? '#f0fdf4' : '#e2e8f0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ fontWeight: col.isHighlight ? 800 : 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {col.isHighlight && <Clock size={12} color="#10b981" />}
                        {col.label}
                      </span>
                      <span style={{
                        color: col.color,
                        fontSize: '0.6rem',
                        fontWeight: 800,
                        backgroundColor: col.isHighlight ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.1)',
                        padding: '2px 5px',
                        borderRadius: '3px'
                      }}>
                        {col.type}
                      </span>
                    </div>
                  ))}

                  {/* Dynamic Checkpoints Columns */}
                  <div style={{ fontSize: '0.62rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '8px', marginBottom: '2px' }}>
                    • Drawing Parameter Points Attributes ({checkPoints.length} Poin)
                  </div>
                  {checkPoints.map((pt, idx) => (
                    <div key={pt.id} style={{
                      padding: '5px 8px',
                      backgroundColor: '#0f172a',
                      borderRadius: '5px',
                      fontSize: '0.68rem',
                      color: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderLeft: `3px solid ${getCategoryColor(pt.category)}`
                    }}>
                      <span style={{ fontWeight: 600 }}>#{pt.pointNumber || idx + 1} {pt.title} ({pt.unit || 'mm'})</span>
                      <span style={{ color: '#22c55e', fontSize: '0.58rem', fontWeight: 800, backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '2px 5px', borderRadius: '3px' }}>
                        NUMERIC + STATUS
                      </span>
                    </div>
                  ))}

                  {checkPoints.length === 0 && (
                    <div style={{ fontSize: '0.68rem', color: '#64748b', fontStyle: 'italic', padding: '6px' }}>
                      Belum ada parameter titik ukur. Tambahkan di Step 3 agar kolom otomatis terisi.
                    </div>
                  )}
                </div>
              </div>

              {/* Manual Table Selector */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                  Atau Pilih Tabel Database yang Sudah Ada:
                </label>
                <select
                  value={targetTableId}
                  onChange={e => {
                    setTargetTableId(e.target.value);
                    localStorage.setItem('mandor_inspector_target_table_id', e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                >
                  <option value="">-- Pilih Tabel Penyimpanan --</option>
                  {availableTables.map(tbl => (
                    <option key={tbl.id} value={tbl.id}>{tbl.name}</option>
                  ))}
                </select>
              </div>

              {/* Selected / Generated Table Summary */}
              {targetTableId && (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                    <CheckCircle2 size={15} color="#10b981" />
                    <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#34d399' }}>
                      Tabel Terhubung
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f8fafc' }}>
                    {availableTables.find(t => t.id === targetTableId)?.name || 'Custom Table'}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '4px' }}>
                    Kolom siap menerima data WO, Operator, Status, Timestamp & {checkPoints.length} Titik Ukur.
                  </div>
                </div>
              )}

              {/* Next Step Button */}
              <button
                onClick={() => setCurrentStep(5)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                }}
              >
                Lanjut ke Step 5: Workflow Step <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 5: Workflow Step & Rules ─── */}
          {currentStep === 5 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>
                  Alur & Mode Inspeksi
                </h4>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={guidedMode}
                    onChange={e => setGuidedMode(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Guided Mode (Step-by-Step)</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Operator diarahkan urut titik per titik</div>
                  </div>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoAdvance}
                    onChange={e => setAutoAdvance(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Auto-Advance</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Otomatis pindah ke titik berikutnya saat input valid</div>
                  </div>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requirePhoto}
                    onChange={e => setRequirePhoto(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Wajib Foto Bukti (Photo Capture)</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Operator wajib mengambil foto di titik ukur</div>
                  </div>
                </label>
                
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={requireSignature}
                    onChange={e => setRequireSignature(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6' }}
                  />
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>Tanda Tangan Digital Operator</div>
                    <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Wajib digital signature sebelum submit</div>
                  </div>
                </label>
              </div>

              {/* Inspection Rules & Tolerances */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                border: '1px solid #334155'
              }}>
                <h4 style={{ fontSize: '0.78rem', fontWeight: 800, color: '#a78bfa', margin: '0 0 8px 0' }}>
                  Validasi & Routing Toleransi
                </h4>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', lineHeight: 1.4 }}>
                  • Jika nilai di luar spesifikasi min/max: <span style={{ color: '#ef4444', fontWeight: 700 }}>Peringatan NG Otomatis</span>
                  <br />
                  • Dimensi Critical (CC): <span style={{ color: '#ef4444', fontWeight: 700 }}>Wajib 100% diisi</span>
                  <br />
                  • Disposisi Part: <span style={{ color: '#38bdf8', fontWeight: 700 }}>Auto-calculate Pass/Fail</span>
                </div>
              </div>

              {/* Next Step Button */}
              <button
                onClick={() => setCurrentStep(6)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)'
                }}
              >
                Lanjut ke Step 6: Deploy & Export <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 6: Export & Deploy ─── */}
          {currentStep === 6 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>
                  Check Sheet Deployment Summary
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem' }}>
                  <div>
                    <span style={{ color: '#64748b' }}>Check Sheet:</span>
                    <div style={{ fontWeight: 700, color: '#38bdf8' }}>{checkSheetName || 'Untitled'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Part No:</span>
                    <div style={{ fontWeight: 700, color: '#a78bfa' }}>{partNo || 'N/A'} (Rev {revisionNo})</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Titik Ukur:</span>
                    <div style={{ fontWeight: 700, color: '#22c55e' }}>{checkPoints.length} parameters</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Drawing:</span>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{selectedDrawing?.name || 'Uploaded'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Workflow:</span>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{guidedMode ? 'Guided' : 'Free'}</div>
                  </div>
                  <div>
                    <span style={{ color: '#64748b' }}>Target Table:</span>
                    <div style={{ fontWeight: 700, color: targetTableId ? '#10b981' : '#f59e0b' }}>
                      {availableTables.find(t => t.id === targetTableId)?.name || 'Not Bound'}
                    </div>
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={() => setShowPreviewModal(true)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #8b5cf6',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Eye size={16} /> Preview Check Sheet
                </button>
                
                <button
                  onClick={handleGenerateQR}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <QrCode size={16} /> Generate Companion QR Code
                </button>
                
                <button
                  onClick={handleExportToCheckSheet}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <PlayCircle size={16} /> Export to Digital Check Sheet
                </button>

                <button
                  onClick={handleSaveTemplate}
                  disabled={isSaving}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
                  }}
                >
                  <Save size={16} /> {isSaving ? 'Menyimpan...' : 'Save & Publish Check Sheet'}
                </button>
              </div>
            </div>
          )}
        </div>        
        {/* ─── CENTER PANEL: Canvas ─── */}
        <div
          ref={containerRef}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{
            position: 'relative',
            backgroundColor: '#e2e8f0',
            overflow: 'hidden',
            cursor: isPanning ? 'grabbing' : isDragging ? 'move' : 'crosshair'
          }}
        >
          {/* HUD Compact */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '12px',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              padding: '4px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <Target size={14} color="#8b5cf6" />
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'white' }}>
                {checkPoints.length} Poin
              </span>
            </div>

            {/* Add Pin Mode Toggle */}
            <button
              onClick={() => setIsAddPinMode(!isAddPinMode)}
              style={{
                padding: '4px 10px',
                backgroundColor: isAddPinMode ? '#22c55e' : 'rgba(15, 23, 42, 0.85)',
                color: isAddPinMode ? '#0f172a' : '#f8fafc',
                border: isAddPinMode ? '1px solid #22c55e' : '1px solid #8b5cf6',
                borderRadius: '6px',
                fontSize: '0.72rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: isAddPinMode ? '0 0 10px rgba(34, 197, 94, 0.4)' : 'none'
              }}
              title="Klik canvas untuk meletakkan titik ukur baru"
            >
              <PlusCircle size={13} />
              {isAddPinMode ? 'Klik Canvas untuk Pin' : '+ Pin'}
            </button>
            
            {/* Zoom Controls */}
            <div style={{
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              padding: '2px 6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <button
                onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
              >
                <ZoomOut size={14} />
              </button>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#8b5cf6', minWidth: '38px', textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 4px' }}
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </div>
          
          {/* Canvas Content */}
          <div
            ref={canvasContentRef}
            onDoubleClick={handleCanvasDoubleClick}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              position: 'relative',
              width: '1000px',
              height: '700px',
              backgroundColor: 'white',
              boxShadow: '0 25px 50px rgba(0,0,0,0.2)',
              margin: '50px auto',
              cursor: isAddPinMode ? 'crosshair' : 'default'
            }}
          >
            {/* Grid Background */}
            <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(203, 213, 225, 0.3)" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            
            {/* Drawing Preview */}
            {drawingPreview && (
              <div
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
                dangerouslySetInnerHTML={{ __html: drawingPreview }}
              />
            )}
            
            {/* Check Point Pins */}
            {checkPoints.map(point => {
              const isActive = point.id === activePointId;
              const isBeingDragged = isDragging && draggedPointId === point.id;
              return (
                <div
                  key={point.id}
                  onMouseDown={(e) => handlePinMouseDown(e, point.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActivePointId(point.id);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${point.x}px`,
                    top: `${point.y}px`,
                    transform: 'translate(-50%, -50%)',
                    cursor: isBeingDragged ? 'grabbing' : 'grab',
                    zIndex: isActive ? 25 : 15,
                    userSelect: 'none',
                    touchAction: 'none'
                  }}
                >
                  {/* Pulse Ring */}
                  <div style={{
                    position: 'absolute',
                    inset: '-10px',
                    borderRadius: '50%',
                    backgroundColor: getCategoryColor(point.category),
                    opacity: isActive ? 0.4 : 0.2,
                    animation: 'pulse 2s infinite',
                    pointerEvents: 'none'
                  }} />
                  
                  {/* Pin Circle */}
                  <div style={{
                    width: isActive ? '36px' : '28px',
                    height: isActive ? '36px' : '28px',
                    borderRadius: '50%',
                    backgroundColor: getCategoryColor(point.category),
                    color: 'white',
                    border: '3px solid white',
                    boxShadow: isBeingDragged ? '0 10px 25px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: isActive ? '0.9rem' : '0.75rem',
                    transition: isBeingDragged ? 'none' : 'transform 0.15s, box-shadow 0.15s',
                    transform: isBeingDragged ? 'scale(1.15)' : 'scale(1)'
                  }}>
                    {point.pointNumber}
                  </div>
                  
                  {/* Tooltip Label */}
                  {isActive && (
                    <div style={{
                      position: 'absolute',
                      top: '42px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#0f172a',
                      color: 'white',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      border: '1px solid #334155',
                      pointerEvents: 'none',
                      zIndex: 30
                    }}>
                      {point.title}
                      <div style={{ fontSize: '0.6rem', color: '#94a3b8', marginTop: '2px' }}>
                        {point.nominal} {point.unit}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── RIGHT PANEL: Properties Editor ─── */}
        <div style={{
          backgroundColor: '#0f172a',
          borderLeft: '1px solid #1e293b',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '12px',
            borderBottom: '1px solid #1e293b',
            backgroundColor: '#090d16'
          }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#8b5cf6' }}>
              {activePoint ? 'Edit Point #' + activePoint.pointNumber : 'Point Properties'}
            </span>
          </div>
          
          {activePoint ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Title */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Point Title
                </label>
                <input
                  type="text"
                  value={activePoint.title}
                  onChange={e => handleUpdatePoint('title', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
              
              {/* Category */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Category
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {PARAM_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => handleUpdatePoint('category', cat.key)}
                      style={{
                        padding: '6px 4px',
                        backgroundColor: activePoint.category === cat.key ? cat.color : '#1e293b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.key.slice(0, 4)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Nominal & Tolerance */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div>
                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Nominal
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={activePoint.nominal}
                    onChange={e => handleUpdatePoint('nominal', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#38bdf8',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Min
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={activePoint.tolMin}
                    onChange={e => handleUpdatePoint('tolMin', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Max
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={activePoint.tolMax}
                    onChange={e => handleUpdatePoint('tolMax', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '4px',
                      color: '#ef4444',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      outline: 'none',
                      textAlign: 'center'
                    }}
                  />
                </div>
              </div>
              
              {/* Unit */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Unit
                </label>
                <select
                  value={activePoint.unit}
                  onChange={e => handleUpdatePoint('unit', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                >
                  <option value="mm">mm</option>
                  <option value="inch">inch</option>
                  <option value="°">° (degree)</option>
                  <option value="μm">μm (micron)</option>
                  <option value="mm²">mm²</option>
                  <option value="Ra">Ra (μm)</option>
                </select>
              </div>
              
              {/* Criticality */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Criticality
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {CRITICALITY_LEVELS.map(level => (
                    <button
                      key={level.key}
                      onClick={() => handleUpdatePoint('criticality', level.key)}
                      style={{
                        flex: 1,
                        padding: '6px 4px',
                        backgroundColor: activePoint.criticality === level.key ? level.color : '#1e293b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {level.key}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Inspection Method */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Inspection Method
                </label>
                <select
                  value={activePoint.inspectionMethod}
                  onChange={e => handleUpdatePoint('inspectionMethod', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                >
                  {INSPECTION_METHODS.map(m => (
                    <option key={m.key} value={m.key}>{m.icon} {m.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Tool ID / Variable */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Tool ID / Variable
                </label>
                <input
                  type="text"
                  value={activePoint.toolId}
                  onChange={e => handleUpdatePoint('toolId', e.target.value)}
                  placeholder="e.g., CAL-001"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.8rem',
                    outline: 'none'
                  }}
                />
              </div>
              
              {/* Notes */}
              <div>
                <label style={{ fontSize: '0.65rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  Notes
                </label>
                <textarea
                  value={activePoint.notes}
                  onChange={e => handleUpdatePoint('notes', e.target.value)}
                  placeholder="Additional notes..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '0.75rem',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              {/* Actions */}
              <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                <button
                  onClick={() => handleDuplicatePoint(activePoint.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Copy size={14} /> Duplicate
                </button>
                <button
                  onClick={() => handleDeletePoint(activePoint.id)}
                  style={{
                    flex: 1,
                    padding: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              color: '#64748b',
              fontSize: '0.8rem',
              textAlign: 'center'
            }}>
              Select a point on the canvas to edit its properties
            </div>
          )}
          
          {/* Bottom Actions */}
          <div style={{
            padding: '12px',
            borderTop: '1px solid #1e293b',
            backgroundColor: '#090d16',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <button
              onClick={handleSaveTemplate}
              disabled={isSaving}
              style={{
                padding: '10px',
                backgroundColor: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                borderRadius: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Save as Template'}
            </button>
            
            <button
              onClick={handleExportToCheckSheet}
              style={{
                padding: '12px',
                backgroundColor: '#22c55e',
                color: '#0f172a',
                border: 'none',
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)'
              }}
            >
              <PlayCircle size={16} />
              Export to Digital Check Sheet
            </button>
          </div>
        </div>
      </div>    
      {/* ─── PREVIEW MODAL ─── */}
      {showPreviewModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.9)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            width: '95vw',
            maxWidth: '1400px',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Eye size={24} color="#8b5cf6" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    Check Sheet Preview
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#a78bfa' }}>
                    {checkSheetName} • {checkPoints.length} inspection points
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <X size={16} /> Close
              </button>
            </div>
            
            {/* Modal Body */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '250px 1fr 320px', overflow: 'hidden' }}>
              {/* Left: Checklist */}
              <div style={{ backgroundColor: '#0a0f1a', borderRight: '1px solid #1e293b', overflow: 'auto', padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '8px' }}>
                  INSPECTION POINTS
                </div>
                {checkPoints.map(point => (
                  <div key={point.id} style={{
                    padding: '8px 10px',
                    marginBottom: '6px',
                    backgroundColor: '#1e293b',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '24px', height: '24px',
                      borderRadius: '50%',
                      backgroundColor: getCategoryColor(point.category),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '0.7rem', color: 'white'
                    }}>
                      {point.pointNumber}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>{point.title}</div>
                      <div style={{ fontSize: '0.6rem', color: '#64748b' }}>
                        {point.nominal} {point.unit} (±{point.tolMin}-{point.tolMax})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Center: Canvas Preview */}
              <div style={{ backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
                <div style={{
                  width: '900px',
                  height: '600px',
                  backgroundColor: 'white',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
                  borderRadius: '8px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <svg width="100%" height="100%" style={{ position: 'absolute' }}>
                    <rect width="100%" height="100%" fill="#f8fafc" />
                    <pattern id="previewGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" strokeWidth="0.5" />
                    </pattern>
                    <rect width="100%" height="100%" fill="url(#previewGrid)" />
                  </svg>
                  
                  {checkPoints.map(point => (
                    <div key={point.id} style={{
                      position: 'absolute',
                      left: `${(point.x / 1000) * 100}%`,
                      top: `${(point.y / 700) * 100}%`,
                      transform: 'translate(-50%, -50%)'
                    }}>
                      <div style={{
                        width: '28px', height: '28px',
                        borderRadius: '50%',
                        backgroundColor: getCategoryColor(point.category),
                        color: 'white',
                        border: '2px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 900, fontSize: '0.75rem'
                      }}>
                        {point.pointNumber}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right: Summary */}
              <div style={{ backgroundColor: '#0a0f1a', borderLeft: '1px solid #1e293b', overflow: 'auto', padding: '12px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#8b5cf6', marginBottom: '12px' }}>
                  WORKFLOW SETTINGS
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Mode</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f8fafc' }}>
                    {guidedMode ? 'Guided Step-by-Step' : 'Free Inspection'}
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Features</div>
                  <div style={{ fontSize: '0.75rem', color: '#f8fafc' }}>
                    {autoAdvance && <div>✓ Auto-advance</div>}
                    {requirePhoto && <div>✓ Photo capture</div>}
                    {requireSignature && <div>✓ Digital signature</div>}
                  </div>
                </div>
                
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '4px' }}>Data Storage</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: targetTableId ? '#22c55e' : '#ef4444' }}>
                    {targetTableId ? 'Table connected' : 'No table selected'}
                  </div>
                </div>
                
                <div style={{
                  marginTop: '16px',
                  padding: '12px',
                  backgroundColor: '#1e293b',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '6px' }}>Ready to Export</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>
                    {checkPoints.length} points configured
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ─── QR CODE MODAL ─── */}
      {showQRModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            padding: '24px',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 800, color: '#f8fafc' }}>
              Companion QR Code
            </h3>
            
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '16px', display: 'inline-block', marginBottom: '16px' }}>
              {previewQRCode && (
                <QRCode
                  value={previewQRCode}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0f172a"
                />
              )}
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Scan untuk membuka Live Player
            </p>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(previewQRCode);
                  toast.success('Link copied!');
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#1e293b',
                  color: 'white',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Copy Link
              </button>
              <button
                onClick={() => setShowQRModal(false)}
                style={{
                  padding: '10px 16px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── TEMPLATE MANAGEMENT MODAL ─── */}
      {showTemplateModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileText size={24} color="#8b5cf6" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    Check Sheet Template Library
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#a78bfa' }}>
                    Manage ISO 9001 inspection templates
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTemplateModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search & Filter */}
            <div style={{
              padding: '12px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              gap: '12px'
            }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 10px 10px 40px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '0.85rem',
                    outline: 'none'
                  }}
                />
              </div>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{
                  padding: '10px 14px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="released">Released</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            {/* Template List */}
            <div style={{ flex: 1, overflow: 'auto', padding: '12px' }}>
              {savedTemplates.length === 0 ? (
                <div style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#64748b'
                }}>
                  <FileText size={48} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>No templates saved</div>
                  <div style={{ fontSize: '0.85rem' }}>Save a check sheet to create your first template</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedTemplates
                    .filter(t => filterStatus === 'all' || t.status === filterStatus)
                    .filter(t => !searchQuery ||
                      t.partName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.partNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.customer?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.docNo?.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                    .map(template => (
                      <div
                        key={template.id}
                        onClick={() => {
                          // Load template
                          setPartNo(template.partNo || '');
                          setPartName(template.partName || '');
                          setCustomer(template.customer || '');
                          setProcessName(template.processName || '');
                          setDrawingNo(template.drawingNo || '');
                          setRevisionNo(template.revision || 'A');
                          setEffectiveDate(template.effectiveDate || '');
                          setNextReviewDate(template.nextReviewDate || '');
                          setInspectorName(template.inspectorName || '');
                          setApprovedBy(template.approvedBy || '');
                          setQualityStandard(template.qualityStandard || 'ISO 9001:2015');
                          setCheckSheetStatus(template.status || 'draft');
                          setCheckPoints(template.checkPoints || []);
                          setCheckSheetName(template.name || '');
                          setCheckSheetDescription(template.description || '');
                          setWorkOrderPrefix(template.workOrderPrefix || 'WO-2026');
                          setStationId(template.stationId || 'ST-01');
                          setSelectedDrawing(template.drawingId ? drawingsList.find(d => d.id === template.drawingId) : null);
                          setShowTemplateModal(false);
                          toast.success(`Template "${template.name}" loaded!`);
                        }}
                        style={{
                          padding: '14px 16px',
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#8b5cf6';
                          e.currentTarget.style.backgroundColor = 'rgba(139, 92, 246, 0.1)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#334155';
                          e.currentTarget.style.backgroundColor = '#1e293b';
                        }}
                      >
                        <div style={{
                          width: '48px', height: '48px',
                          borderRadius: '8px',
                          backgroundColor: template.status === 'approved' ? '#22c55e' :
                                          template.status === 'released' ? '#3b82f6' :
                                          template.status === 'pending_approval' ? '#f59e0b' : '#64748b',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'white', fontWeight: 900, fontSize: '1.2rem'
                        }}>
                          {template.status === 'approved' ? <CheckCircle2 size={24} /> :
                           template.status === 'released' ? <ShieldCheck size={24} /> :
                           template.status === 'pending_approval' ? <Clock size={24} /> : <FileText size={24} />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>{template.name || template.partName || 'Untitled'}</span>
                            <span style={{
                              fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px',
                              backgroundColor: template.status === 'approved' ? '#22c55e' :
                                              template.status === 'released' ? '#3b82f6' :
                                              template.status === 'pending_approval' ? '#f59e0b' : '#64748b',
                              color: 'white', fontWeight: 700
                            }}>
                              {template.status === 'approved' ? 'APPROVED' :
                               template.status === 'released' ? 'RELEASED' :
                               template.status === 'pending_approval' ? 'PENDING' :
                               template.status === 'archived' ? 'ARCHIVED' : 'DRAFT'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            <span>Doc: <strong style={{ color: '#8b5cf6' }}>{template.docNo}</strong></span>
                            <span style={{ marginLeft: '12px' }}>Part: <strong>{template.partNo || '-'}</strong></span>
                            <span style={{ marginLeft: '12px' }}>Customer: <strong>{template.customer || '-'}</strong></span>
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                            {template.checkPoints?.length || 0} parameters • Rev {template.revision || 'A'} • Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : '-'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this template?')) {
                                const updated = savedTemplates.filter(t => t.id !== template.id);
                                setSavedTemplates(updated);
                                localStorage.setItem('mandor_inspector_templates', JSON.stringify(updated));
                                toast.success('Template deleted');
                              }
                            }}
                            style={{
                              padding: '8px',
                              backgroundColor: 'rgba(239, 68, 68, 0.2)',
                              color: '#ef4444',
                              border: '1px solid #ef4444',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── REVISION HISTORY MODAL ─── */}
      {showRevisionModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            width: '600px',
            maxWidth: '95vw',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(139, 92, 246, 0.1)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Clock size={24} color="#8b5cf6" />
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#f8fafc' }}>
                    Revision History
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#a78bfa' }}>
                    Document control and revision tracking
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRevisionModal(false)}
                style={{
                  padding: '8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Revision List */}
            <div style={{ padding: '16px', maxHeight: '400px', overflow: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Current Revision */}
                <div style={{
                  padding: '12px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  border: '2px solid #8b5cf6',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#a78bfa' }}>Revision {revisionNo}</span>
                      <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#8b5cf6', color: 'white', fontWeight: 700 }}>CURRENT</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{effectiveDate}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    Initial release - {qualityStandard} compliant inspection document
                  </div>
                </div>

                {/* Revision History Entries */}
                {revisionHistory.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '0.85rem'
                  }}>
                    No previous revisions. This is the first version.
                  </div>
                ) : (
                  revisionHistory.map((rev, idx) => (
                    <div key={idx} style={{
                      padding: '12px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f8fafc' }}>Revision {rev.revision}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{rev.date}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        {rev.description}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
                        By: {rev.by}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Add Revision */}
            <div style={{ padding: '16px', borderTop: '1px solid #1e293b' }}>
              <button
                onClick={() => {
                  const newRevision = {
                    revision: revisionNo,
                    date: effectiveDate,
                    description: `Document revision ${revisionNo} - ${qualityStandard}`,
                    by: approvedBy || currentUser?.username || 'Unknown'
                  };
                  setRevisionHistory([...revisionHistory, newRevision]);
                  toast.success('Revision recorded');
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <PlusCircle size={16} /> Record Revision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}