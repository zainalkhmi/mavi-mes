import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  BarChart2, FileCheck, SlidersHorizontal, Smartphone as DeviceIcon, Sparkles, FolderArchive,
  FileSpreadsheet, FileSliders, Hash, Pencil, Highlighter, ArrowUpRight, Eraser, Type, Undo2, Redo2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import QRCode from 'react-qr-code';
import { getAllDrawings, saveDrawing, drawingsLocalDB } from '../utils/supabaseUtilityDB';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';
import { parseDxfContent } from '../utils/cadDxfRenderService';
import { extractBlueprintDimensions, detectPdfType } from '../utils/pdfDimensionExtractor';
import { getTables, createTable } from '../utils/supabaseTablesDB';
import { getTemplates, saveTemplates } from '../utils/supabaseTemplateDB';
import { getCurrentUser } from '../utils/auth';
import { executeReportPrintAction } from '../utils/reportPrintService';

// GD&T Parameter Categories
const PARAM_CATEGORIES = [
  { key: 'dimension', label: 'Linear Dimension', icon: '📏', color: '#3b82f6', symbol: '' },
  { key: 'diameter', label: 'Diameter', icon: '⌀', color: '#8b5cf6', symbol: '⌀' },
  { key: 'radius', label: 'Radius', icon: 'R', color: '#06b6d4', symbol: 'R' },
  { key: 'angle', label: 'Angle', icon: '∠', color: '#f59e0b', symbol: '∠' },
  { key: 'depth', label: 'Depth', icon: '⏥', color: '#10b981', symbol: '⏥' },
  { key: 'visual', label: 'Visual & Surface', icon: '👁️', color: '#10b981', symbol: '👁️' },
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
  { key: 'Visual Limit Sample', label: 'Visual Limit Sample (3-Way Comparator)', icon: '👁️' },
  { key: 'Bore Gauge', label: 'Bore Gauge', icon: '🔘' },
  { key: 'Height Gauge', label: 'Height Gauge', icon: '📐' },
  { key: 'CMM', label: 'CMM Machine', icon: '🤖' },
  { key: 'Vision', label: 'Vision System', icon: '👁️' },
  { key: 'Profile Projector', label: 'Profile Projector', icon: '🔍' },
  { key: 'Go-No Go', label: 'Go/No Go Gauge', icon: '✓' },
];

// Drawing & Markup Annotation Constants (ISO Drawing Designer)
const STAMPS = [
  { id: 'approve', label: 'APPROVED', icon: '✓', color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e' },
  { id: 'reject', label: 'REJECTED', icon: '✗', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444' },
  { id: 'hold', label: 'HOLD', icon: '⏸', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b' },
  { id: 'review', label: 'REVIEW', icon: '👁', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6' },
  { id: 'absolute', label: 'ABSOLUTE', icon: '◎', color: '#0f172a', bg: 'rgba(15, 23, 42, 0.1)', border: '#0f172a' },
  { id: 'ncr', label: 'NCR', icon: '⚠', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.15)', border: '#dc2626' },
  { id: 'qa', label: 'QA PASS', icon: '★', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.15)', border: '#16a34a' },
  { id: 'witness', label: 'WITNESS', icon: '👁', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.15)', border: '#7c3aed' },
  { id: 'date', label: 'DATE', icon: '📅', color: '#64748b', bg: 'rgba(100, 116, 139, 0.1)', border: '#64748b' },
  { id: 'init', label: 'INITIAL', icon: '✍', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.15)', border: '#0891b2' },
];

const DRAWING_COLORS = [
  { color: '#ef4444', name: 'Merah' },
  { color: '#f59e0b', name: 'Kuning' },
  { color: '#22c55e', name: 'Hijau' },
  { color: '#3b82f6', name: 'Biru' },
  { color: '#8b5cf6', name: 'Ungu' },
  { color: '#0f172a', name: 'Hitam' },
  { color: '#ffffff', name: 'Putih' },
];

const DRAWING_SIZES = [
  { size: 1, label: 'Halus (1px)' },
  { size: 1.8, label: 'Normal (1.8px)' },
  { size: 3, label: 'Tebal (3px)' },
  { size: 5, label: 'Ekstra (5px)' },
];

// ─── CAD DRAWING GRID ZONE DETECTOR (AS9102 / ISO 9001) ─────────
const calculateDrawingZone = (x, y, width = 980, height = 680) => {
  const colIndex = Math.min(8, Math.max(1, Math.ceil((x / (width || 980)) * 8)));
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const rowIndex = Math.min(5, Math.max(0, Math.floor((y / (height || 680)) * 6)));
  const rowLetter = rows[rowIndex] || 'A';
  return `${rowLetter}-${colIndex}`;
};

// Default template for a check point with automatic Leader Line & Arrow Target
const createDefaultCheckPoint = (index, targetX = 200, targetY = 200, defaultShape = 'circle') => {
  const zone = calculateDrawingZone(targetX, targetY, 980, 680);
  const offsetDirX = targetX > 500 ? 32 : -32;
  const offsetDirY = targetY > 350 ? 32 : -32;
  const balloonX = Math.min(960, Math.max(30, targetX + offsetDirX));
  const balloonY = Math.min(660, Math.max(30, targetY + offsetDirY));

  return {
    id: `cp_${Date.now()}_${index}`,
    pointNumber: index,
    title: `Dimensi #${index}`,
    category: 'dimension',
    nominal: '10.00',
    tolMin: '9.95',
    tolMax: '10.05',
    upperTol: '0.05',
    lowerTol: '-0.05',
    unit: 'mm',
    x: balloonX,
    y: balloonY,
    targetX: targetX,
    targetY: targetY,
    zone: zone,
    shape: defaultShape,
    criticality: defaultShape === 'hexagon' ? 'Critical (KC)' : defaultShape === 'diamond' ? 'Major (Safety)' : 'Standard',
    inspectionMethod: 'Digital Caliper 0-150mm',
    toolId: '',
    notes: `Pemeriksaan dimensi di Drawing Zone ${zone}`,
    gdtSymbol: '',
    required: true,
    autoAdvance: true
  };
};

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
  const [hoverCoords, setHoverCoords] = useState(null); // { x: number, y: number }

  // ─── Drawing & Markup Annotation Tools State (Step 2 & 3) ───
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingTool, setDrawingTool] = useState('pen'); // pen, marker, highlighter, arrow, rect, circle, text, eraser, stamp
  const [drawingColor, setDrawingColor] = useState('#ef4444');
  const [drawingSize, setDrawingSize] = useState(1.8);
  const [drawings, setDrawings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_inspector_drawings') || '[]');
    } catch {
      return [];
    }
  });
  const [currentStroke, setCurrentStroke] = useState([]);
  const [shapeStart, setShapeStart] = useState(null);
  const [shapeCurrent, setShapeCurrent] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [redoStack, setRedoStack] = useState([]);
  const [showStampModal, setShowStampModal] = useState(false);
  const [selectedStamp, setSelectedStamp] = useState('approve');
  const [stamps, setStamps] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('mandor_inspector_stamps') || '[]');
    } catch {
      return [];
    }
  });
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInputPosition, setTextInputPosition] = useState(null);
  const [textInputValue, setTextInputValue] = useState('');
  const drawingCanvasRef = useRef(null);
  
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
  const [checkSheetName, setCheckSheetName] = useState('');
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
  const [showOpenProjectModal, setShowOpenProjectModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [reportPaperSize, setReportPaperSize] = useState('A4'); // A4, A3, Letter, Legal, Label_100x150
  const [reportOrientation, setReportOrientation] = useState('portrait'); // portrait, landscape
  const [reportTheme, setReportTheme] = useState('mandor_purple'); // mandor_purple, navy_modern, emerald_qa, monochrome
  const [reportMargin] = useState('10mm');
  const [includeIsoHeader, setIncludeIsoHeader] = useState(true);
  const [includeStatsBar, setIncludeStatsBar] = useState(true);
  const [includeGdtTable, setIncludeGdtTable] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);
  const [includeQrCode] = useState(true);

  // ─── PRO CAD BALLOONING SUITE STATES ─────────────────────────────
  const [defaultBalloonShape, setDefaultBalloonShape] = useState('circle'); // circle, hexagon, diamond, square
  const [enableMicroLoupe] = useState(true);
  const [showRenumberMenu, setShowRenumberMenu] = useState(false);

  // ─── Report Generator & Deep Link ───
  const handleOpenInReportDesigner = () => {
    const isLandscape = reportOrientation === 'landscape';
    const paperWidth = reportPaperSize === 'A3' ? (isLandscape ? 420 : 297) : reportPaperSize === 'Letter' ? (isLandscape ? 279 : 216) : (isLandscape ? 297 : 210);
    const paperHeight = reportPaperSize === 'A3' ? (isLandscape ? 297 : 420) : reportPaperSize === 'Letter' ? (isLandscape ? 216 : 279) : (isLandscape ? 210 : 297);

    const templateId = `custom-cs-${partNo ? partNo.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'cs'}-${Date.now().toString().slice(-4)}`;
    
    const themeBg = reportTheme === 'navy_modern' ? '#1e3a8a' : reportTheme === 'emerald_qa' ? '#065f46' : reportTheme === 'monochrome' ? '#1f2937' : '#4c1d95';
    const themeSubtitle = reportTheme === 'navy_modern' ? '#bfdbfe' : reportTheme === 'emerald_qa' ? '#a7f3d0' : reportTheme === 'monochrome' ? '#9ca3af' : '#ddd6fe';

    const customTemplate = {
      id: templateId,
      name: `${checkSheetName || partName || 'Checksheet'} (${reportPaperSize} ${reportOrientation.toUpperCase()})`,
      category: 'Quality Control',
      paperPresetId: reportPaperSize,
      description: `Format cetak fisik checksheet ${partNo || ''} standar ISO 9001 orientasi ${reportOrientation}.`,
      template: {
        basePdf: { width: paperWidth, height: paperHeight, padding: [10, 10, 10, 10] },
        schemas: [
          [
            // 1. Header Banner
            { name: 'header_bg', type: 'rectangle', position: { x: 12, y: 10 }, width: paperWidth - 24, height: 22, color: themeBg, borderWidth: 0 },
            { name: 'report_title', type: 'text', position: { x: 16, y: 13 }, width: isLandscape ? 200 : 120, height: 7, fontSize: 12.5, fontColor: '#ffffff', content: (checkSheetName || partName || 'QC INSPECTION CHECKSHEET').toUpperCase() },
            { name: 'company_subtitle', type: 'text', position: { x: 16, y: 21 }, width: isLandscape ? 200 : 120, height: 4, fontSize: 6, fontColor: themeSubtitle, content: `MANDOR MES — ${qualityStandard} QUALITY ASSURANCE VERIFICATION` },
            { name: 'doc_id', type: 'text', position: { x: paperWidth - 75, y: 13 }, width: 38, height: 4, fontSize: 6, fontColor: '#ffffff', content: `DOC: ${drawingNo || 'QA-CS-2026-08'}` },
            { name: 'doc_control_val', type: 'text', position: { x: paperWidth - 75, y: 18 }, width: 38, height: 6, fontSize: 5.5, fontColor: '#ffffff', content: `REV: ${revisionNo || 'A'} | ${effectiveDate || '2026-08-23'}` },
            { name: 'report_qr', type: 'qrcode', position: { x: paperWidth - 34, y: 11 }, width: 18, height: 18 },

            // 2. Master Info Grid (4 columns)
            { name: 'info_border', type: 'rectangle', position: { x: 12, y: 35 }, width: paperWidth - 24, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
            
            { name: 'part_no_label', type: 'text', position: { x: 15, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NUMBER' },
            { name: 'part_no_value', type: 'text', position: { x: 15, y: 41 }, width: 42, height: 5, fontSize: 8.5, fontColor: '#0f172a' },
            { name: 'station_label', type: 'text', position: { x: 15, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STATION / PROCESS' },
            { name: 'station_value', type: 'text', position: { x: 15, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'part_name_label', type: 'text', position: { x: isLandscape ? 80 : 60, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NAME' },
            { name: 'part_name_value', type: 'text', position: { x: isLandscape ? 80 : 60, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
            { name: 'inspector_label', type: 'text', position: { x: isLandscape ? 80 : 60, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QC INSPECTOR' },
            { name: 'inspector_value', type: 'text', position: { x: isLandscape ? 80 : 60, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'customer_label', type: 'text', position: { x: isLandscape ? 150 : 105, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'CUSTOMER' },
            { name: 'customer_value', type: 'text', position: { x: isLandscape ? 150 : 105, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
            { name: 'approver_label', type: 'text', position: { x: isLandscape ? 150 : 105, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'APPROVAL LEAD' },
            { name: 'approver_value', type: 'text', position: { x: isLandscape ? 150 : 105, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'date_time_label', type: 'text', position: { x: isLandscape ? 220 : 150, y: 37 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TANGGAL PENGUKURAN' },
            { name: 'date_time_value', type: 'text', position: { x: isLandscape ? 220 : 150, y: 41 }, width: 45, height: 5, fontSize: 7, fontColor: '#0284c7' },
            { name: 'standard_label', type: 'text', position: { x: isLandscape ? 220 : 150, y: 47 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STANDAR MUTU' },
            { name: 'standard_value', type: 'text', position: { x: isLandscape ? 220 : 150, y: 51 }, width: 45, height: 5, fontSize: 7.5, fontColor: '#059669', content: qualityStandard || 'ISO 9001:2015' },

            // 3. Summary Statistics Bar (4 Cards)
            { name: 'stat_box_1', type: 'rectangle', position: { x: 12, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f1f5f9' },
            { name: 'stat_lbl_1', type: 'text', position: { x: 13, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TOTAL TITIK UKUR' },
            { name: 'total_value', type: 'text', position: { x: 13, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#0f172a' },

            { name: 'stat_box_2', type: 'rectangle', position: { x: 12 + ((paperWidth - 36) / 4) + 4, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#a7f3d0', borderWidth: 0.5, color: '#ecfdf5' },
            { name: 'stat_lbl_2', type: 'text', position: { x: 13 + ((paperWidth - 36) / 4) + 4, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#047857', content: 'STATUS DISPOSISI' },
            { name: 'status_value', type: 'text', position: { x: 13 + ((paperWidth - 36) / 4) + 4, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9, fontColor: '#059669' },

            { name: 'stat_box_3', type: 'rectangle', position: { x: 12 + (((paperWidth - 36) / 4) * 2) + 8, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#ddd6fe', borderWidth: 0.5, color: '#f5f3ff' },
            { name: 'stat_lbl_3', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 2) + 8, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#6d28d9', content: 'TARGET CPK' },
            { name: 'cpk_value', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 2) + 8, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#7c3aed' },

            { name: 'stat_box_4', type: 'rectangle', position: { x: 12 + (((paperWidth - 36) / 4) * 3) + 12, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#bae6fd', borderWidth: 0.5, color: '#f0f9ff' },
            { name: 'stat_lbl_4', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 3) + 12, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#0369a1', content: 'PASS RATE' },
            { name: 'rate_value', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 3) + 12, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#0284c7' },

            // 4. Parameter Matrix Table
            {
              name: 'inspection_table',
              type: 'table',
              position: { x: 12, y: 82 },
              width: paperWidth - 24,
              height: isLandscape ? 90 : 138,
              showHead: true,
              head: ['#', 'PARAMETER UKUR', 'KATEGORI', 'NOMINAL', 'TOLERANSI (MIN / MAX)', 'HASIL UKUR', 'CRITICALITY', 'STATUS'],
              headWidthPercentages: [5, 26, 14, 12, 16, 12, 9, 6],
              tableStyles: { borderColor: themeBg, borderWidth: 0.3 },
              headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 7, fontColor: '#ffffff', backgroundColor: themeBg, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
              bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 6.5, fontColor: '#0f172a', padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 }, alternateBackgroundColor: '#f8fafc' },
              columnStyles: {}
            },

            // 5. ISO Signature Blocks (3 Columns)
            { name: 'sign_box1', type: 'rectangle', position: { x: 12, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl1', type: 'text', position: { x: 14, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'INSPECTOR (OPERATOR)' },
            { name: 'sign_val1', type: 'text', position: { x: 14, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#059669', content: `✓ ${inspectorName || currentUser?.username || 'admin'}` },
            { name: 'sign_sub1', type: 'text', position: { x: 14, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Tanda Tangan & Tanggal' },

            { name: 'sign_box2', type: 'rectangle', position: { x: 12 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QA / QC SUPERVISOR' },
            { name: 'sign_val2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#4338ca', content: `✓ ${approvedBy || 'Ahmad Setiawan'}` },
            { name: 'sign_sub2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Disetujui QA Management' },

            { name: 'sign_box3', type: 'rectangle', position: { x: 12 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PRODUCTION LEADER' },
            { name: 'sign_val3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#64748b', content: '✓ Handover Verified' },
            { name: 'sign_sub3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Diterima Line Produksi' },

            // 6. ISO Watermark Footer
            { name: 'footer_line', type: 'line', position: { x: 12, y: isLandscape ? 203 : 255 }, width: paperWidth - 24, height: 0.2, color: '#cbd5e1' },
            { name: 'footer_text', type: 'text', position: { x: 12, y: isLandscape ? 204 : 257 }, width: paperWidth - 24, height: 4, fontSize: 5.5, fontColor: '#94a3b8', content: `MANDOR MES QUALITY REPORT ENGINE • ISO 9001:2015 AUDITED CHECKSHEET • DIGITAL GENERATED ${new Date().toLocaleDateString()}` }
          ]
        ]
      },
      sampleInputs: [
        {
          report_qr: `https://mandor-core.online/doc/${partNo || 'PRT-FLG-450X'}`,
          doc_id: `DOC: ${drawingNo || 'QA-CS-2026-08'}`,
          doc_control_val: `REV: ${revisionNo || 'A'} | ${effectiveDate || '2026-08-23'}`,
          part_no_value: partNo || 'PRT-FLG-450X',
          part_name_value: partName || checkSheetName || 'Hydraulic Flange',
          customer_value: customer || 'AeroTech Dynamics Ltd.',
          station_value: `${stationId} (${processName || 'CNC Line 2'})`,
          inspector_value: inspectorName || currentUser?.username || 'admin',
          approver_value: approvedBy || 'Ahmad Setiawan',
          date_time_value: new Date().toLocaleString(),
          standard_value: qualityStandard || 'ISO 9001:2015',
          total_value: `${checkPoints.length} Poin`,
          status_value: 'APPROVED (PASS)',
          cpk_value: '1.67 (Min 1.33)',
          rate_value: '100.0%',
          inspection_table: JSON.stringify(
            (checkPoints || []).length > 0 ? (checkPoints || []).map((p, idx) => [
              String(p.pointNumber || idx + 1),
              p.title || `Param #${idx + 1}`,
              p.category || 'Linear Dimension',
              `${p.nominal || '0'} ${p.unit || 'mm'}`,
              p.tolMin !== undefined ? `${p.tolMin} - ${p.tolMax}` : '±0.05',
              p.nominal ? `${p.nominal} ${p.unit || 'mm'}` : '-',
              p.criticality || 'Major',
              'OK'
            ]) : [
              ['1', 'Internal Bore Diameter', 'Linear Dimension', '25.00 mm', '±0.05', '25.01 mm', 'Critical', 'OK'],
              ['2', 'Outer Flange Diameter', 'Linear Dimension', '45.00 mm', '±0.05', '45.02 mm', 'Major', 'OK'],
              ['3', 'Seal Face Flatness', 'Flatness (GD&T)', '0.02 mm', 'Max 0.03', '0.018 mm', 'Major', 'OK']
            ]
          )
        }
      ]
    };

    try {
      const existing = JSON.parse(localStorage.getItem('mandor_pdf_templates_v6') || '[]');
      const filtered = existing.filter(t => t.id !== templateId);
      localStorage.setItem('mandor_pdf_templates_v6', JSON.stringify([customTemplate, ...filtered]));
      localStorage.setItem('mandor_active_report_template_id', templateId);
      toast.success(`Template ${customTemplate.name} berhasil dibuat & diimpor ke Report Designer!`);
      navigate('/reports');
    } catch (e) {
      toast.error('Gagal membuka Report Designer: ' + e.message);
    }
  };

  const handlePrintSamplePDF = async () => {
    try {
      const isLandscape = reportOrientation === 'landscape';
      const paperWidth = reportPaperSize === 'A3' ? (isLandscape ? 420 : 297) : reportPaperSize === 'Letter' ? (isLandscape ? 279 : 216) : (isLandscape ? 297 : 210);
      const paperHeight = reportPaperSize === 'A3' ? (isLandscape ? 297 : 420) : reportPaperSize === 'Letter' ? (isLandscape ? 216 : 279) : (isLandscape ? 210 : 297);
      const themeBg = reportTheme === 'navy_modern' ? '#1e3a8a' : reportTheme === 'emerald_qa' ? '#065f46' : reportTheme === 'monochrome' ? '#1f2937' : '#4c1d95';
      const themeSubtitle = reportTheme === 'navy_modern' ? '#bfdbfe' : reportTheme === 'emerald_qa' ? '#a7f3d0' : reportTheme === 'monochrome' ? '#9ca3af' : '#ddd6fe';

      const customPrintTemplate = {
        basePdf: { width: paperWidth, height: paperHeight, padding: [10, 10, 10, 10] },
        schemas: [
          [
            // 1. Header Banner
            { name: 'header_bg', type: 'rectangle', position: { x: 12, y: 10 }, width: paperWidth - 24, height: 22, color: themeBg, borderWidth: 0 },
            { name: 'report_title', type: 'text', position: { x: 16, y: 13 }, width: isLandscape ? 200 : 120, height: 7, fontSize: 12.5, fontColor: '#ffffff', content: (checkSheetName || partName || 'QC INSPECTION CHECKSHEET').toUpperCase() },
            { name: 'company_subtitle', type: 'text', position: { x: 16, y: 21 }, width: isLandscape ? 200 : 120, height: 4, fontSize: 6, fontColor: themeSubtitle, content: `MANDOR MES — ${qualityStandard} QUALITY ASSURANCE VERIFICATION` },
            { name: 'doc_id', type: 'text', position: { x: paperWidth - 75, y: 13 }, width: 38, height: 4, fontSize: 6, fontColor: '#ffffff', content: `DOC: ${drawingNo || 'QA-CS-2026-08'}` },
            { name: 'doc_control_val', type: 'text', position: { x: paperWidth - 75, y: 18 }, width: 38, height: 6, fontSize: 5.5, fontColor: '#ffffff', content: `REV: ${revisionNo || 'A'} | ${effectiveDate || '2026-08-23'}` },
            { name: 'report_qr', type: 'qrcode', position: { x: paperWidth - 34, y: 11 }, width: 18, height: 18 },

            // 2. Master Info Grid (4 columns)
            { name: 'info_border', type: 'rectangle', position: { x: 12, y: 35 }, width: paperWidth - 24, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f8fafc' },
            
            { name: 'part_no_label', type: 'text', position: { x: 15, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NUMBER' },
            { name: 'part_no_value', type: 'text', position: { x: 15, y: 41 }, width: 42, height: 5, fontSize: 8.5, fontColor: '#0f172a' },
            { name: 'station_label', type: 'text', position: { x: 15, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STATION / PROCESS' },
            { name: 'station_value', type: 'text', position: { x: 15, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'part_name_label', type: 'text', position: { x: isLandscape ? 80 : 60, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PART NAME' },
            { name: 'part_name_value', type: 'text', position: { x: isLandscape ? 80 : 60, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
            { name: 'inspector_label', type: 'text', position: { x: isLandscape ? 80 : 60, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QC INSPECTOR' },
            { name: 'inspector_value', type: 'text', position: { x: isLandscape ? 80 : 60, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'customer_label', type: 'text', position: { x: isLandscape ? 150 : 105, y: 37 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'CUSTOMER' },
            { name: 'customer_value', type: 'text', position: { x: isLandscape ? 150 : 105, y: 41 }, width: 42, height: 5, fontSize: 8, fontColor: '#0f172a' },
            { name: 'approver_label', type: 'text', position: { x: isLandscape ? 150 : 105, y: 47 }, width: 42, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'APPROVAL LEAD' },
            { name: 'approver_value', type: 'text', position: { x: isLandscape ? 150 : 105, y: 51 }, width: 42, height: 5, fontSize: 7.5, fontColor: '#0f172a' },

            { name: 'date_time_label', type: 'text', position: { x: isLandscape ? 220 : 150, y: 37 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TANGGAL PENGUKURAN' },
            { name: 'date_time_value', type: 'text', position: { x: isLandscape ? 220 : 150, y: 41 }, width: 45, height: 5, fontSize: 7, fontColor: '#0284c7' },
            { name: 'standard_label', type: 'text', position: { x: isLandscape ? 220 : 150, y: 47 }, width: 45, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'STANDAR MUTU' },
            { name: 'standard_value', type: 'text', position: { x: isLandscape ? 220 : 150, y: 51 }, width: 45, height: 5, fontSize: 7.5, fontColor: '#059669', content: qualityStandard || 'ISO 9001:2015' },

            // 3. Summary Statistics Bar (4 Cards)
            { name: 'stat_box_1', type: 'rectangle', position: { x: 12, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#f1f5f9' },
            { name: 'stat_lbl_1', type: 'text', position: { x: 13, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'TOTAL TITIK UKUR' },
            { name: 'total_value', type: 'text', position: { x: 13, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#0f172a' },

            { name: 'stat_box_2', type: 'rectangle', position: { x: 12 + ((paperWidth - 36) / 4) + 4, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#a7f3d0', borderWidth: 0.5, color: '#ecfdf5' },
            { name: 'stat_lbl_2', type: 'text', position: { x: 13 + ((paperWidth - 36) / 4) + 4, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#047857', content: 'STATUS DISPOSISI' },
            { name: 'status_value', type: 'text', position: { x: 13 + ((paperWidth - 36) / 4) + 4, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9, fontColor: '#059669' },

            { name: 'stat_box_3', type: 'rectangle', position: { x: 12 + (((paperWidth - 36) / 4) * 2) + 8, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#ddd6fe', borderWidth: 0.5, color: '#f5f3ff' },
            { name: 'stat_lbl_3', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 2) + 8, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#6d28d9', content: 'TARGET CPK' },
            { name: 'cpk_value', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 2) + 8, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#7c3aed' },

            { name: 'stat_box_4', type: 'rectangle', position: { x: 12 + (((paperWidth - 36) / 4) * 3) + 12, y: 64 }, width: (paperWidth - 36) / 4, height: 15, borderColor: '#bae6fd', borderWidth: 0.5, color: '#f0f9ff' },
            { name: 'stat_lbl_4', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 3) + 12, y: 66 }, width: (paperWidth - 38) / 4, height: 3, fontSize: 5.5, fontColor: '#0369a1', content: 'PASS RATE' },
            { name: 'rate_value', type: 'text', position: { x: 13 + (((paperWidth - 36) / 4) * 3) + 12, y: 70 }, width: (paperWidth - 38) / 4, height: 6, fontSize: 9.5, fontColor: '#0284c7' },

            // 4. Parameter Matrix Table
            {
              name: 'inspection_table',
              type: 'table',
              position: { x: 12, y: 82 },
              width: paperWidth - 24,
              height: isLandscape ? 90 : 138,
              showHead: true,
              head: ['#', 'PARAMETER UKUR', 'KATEGORI', 'NOMINAL', 'TOLERANSI (MIN / MAX)', 'HASIL UKUR', 'CRITICALITY', 'STATUS'],
              headWidthPercentages: [5, 26, 14, 12, 16, 12, 9, 6],
              tableStyles: { borderColor: themeBg, borderWidth: 0.3 },
              headStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 7, fontColor: '#ffffff', backgroundColor: themeBg, padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 } },
              bodyStyles: { alignment: 'center', verticalAlignment: 'middle', fontSize: 6.5, fontColor: '#0f172a', padding: { top: 2.5, right: 2, bottom: 2.5, left: 2 }, alternateBackgroundColor: '#f8fafc' },
              columnStyles: {}
            },

            // 5. ISO Signature Blocks (3 Columns)
            { name: 'sign_box1', type: 'rectangle', position: { x: 12, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl1', type: 'text', position: { x: 14, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'INSPECTOR (OPERATOR)' },
            { name: 'sign_val1', type: 'text', position: { x: 14, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#059669', content: `✓ ${inspectorName || currentUser?.username || 'admin'}` },
            { name: 'sign_sub1', type: 'text', position: { x: 14, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Tanda Tangan & Tanggal' },

            { name: 'sign_box2', type: 'rectangle', position: { x: 12 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'QA / QC SUPERVISOR' },
            { name: 'sign_val2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#4338ca', content: `✓ ${approvedBy || 'Ahmad Setiawan'}` },
            { name: 'sign_sub2', type: 'text', position: { x: 14 + ((paperWidth - 32) / 3) + 4, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Disetujui QA Management' },

            { name: 'sign_box3', type: 'rectangle', position: { x: 12 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 175 : 225 }, width: (paperWidth - 32) / 3, height: 26, borderColor: '#cbd5e1', borderWidth: 0.5, color: '#ffffff' },
            { name: 'sign_lbl3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 177 : 227 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5.5, fontColor: '#64748b', content: 'PRODUCTION LEADER' },
            { name: 'sign_val3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 183 : 233 }, width: (paperWidth - 36) / 3, height: 6, fontSize: 8, fontColor: '#64748b', content: '✓ Handover Verified' },
            { name: 'sign_sub3', type: 'text', position: { x: 14 + (((paperWidth - 32) / 3) * 2) + 8, y: isLandscape ? 193 : 243 }, width: (paperWidth - 36) / 3, height: 3, fontSize: 5, fontColor: '#94a3b8', content: 'Diterima Line Produksi' },

            // 6. ISO Watermark Footer
            { name: 'footer_line', type: 'line', position: { x: 12, y: isLandscape ? 203 : 255 }, width: paperWidth - 24, height: 0.2, color: '#cbd5e1' },
            { name: 'footer_text', type: 'text', position: { x: 12, y: isLandscape ? 204 : 257 }, width: paperWidth - 24, height: 4, fontSize: 5.5, fontColor: '#94a3b8', content: `MANDOR MES QUALITY REPORT ENGINE • ISO 9001:2015 AUDITED CHECKSHEET • DIGITAL GENERATED ${new Date().toLocaleDateString()}` }
          ]
        ]
      };

      const reportData = {
        report_qr: `https://mandor-core.online/doc/${partNo || 'PRT-FLG-450X'}`,
        doc_id: `DOC: ${drawingNo || 'QA-CS-2026-08'}`,
        doc_control_val: `REV: ${revisionNo || 'A'} | ${effectiveDate || '2026-08-23'}`,
        part_no_value: partNo || 'PRT-FLG-450X',
        part_name_value: partName || checkSheetName || 'Hydraulic Flange',
        customer_value: customer || 'AeroTech Dynamics Ltd.',
        station_value: `${stationId} (${processName || 'CNC Line 2'})`,
        inspector_value: inspectorName || currentUser?.username || 'admin',
        approver_value: approvedBy || 'Ahmad Setiawan',
        date_time_value: new Date().toLocaleString(),
        standard_value: qualityStandard || 'ISO 9001:2015',
        total_value: `${checkPoints.length} Poin`,
        status_value: 'APPROVED (PASS)',
        cpk_value: '1.67 (Min 1.33)',
        rate_value: '100.0%',
        inspection_table: JSON.stringify(
          (checkPoints || []).length > 0 ? (checkPoints || []).map((p, idx) => [
            String(p.pointNumber || idx + 1),
            p.title || `Param #${idx + 1}`,
            p.category || 'Linear Dimension',
            `${p.nominal || '0'} ${p.unit || 'mm'}`,
            p.tolMin !== undefined ? `${p.tolMin} - ${p.tolMax}` : '±0.05',
            p.nominal ? `${p.nominal} ${p.unit || 'mm'}` : '-',
            p.criticality || 'Major',
            'OK'
          ]) : [
            ['1', 'Internal Bore Diameter', 'Linear Dimension', '25.00 mm', '±0.05', '25.01 mm', 'Critical', 'OK'],
            ['2', 'Outer Flange Diameter', 'Linear Dimension', '45.00 mm', '±0.05', '45.02 mm', 'Major', 'OK'],
            ['3', 'Seal Face Flatness', 'Flatness (GD&T)', '0.02 mm', 'Max 0.03', '0.018 mm', 'Major', 'OK']
          ]
        )
      };

      await executeReportPrintAction({
        customTemplate: customPrintTemplate,
        templateId: 'qc-inspection-checksheet-a4',
        data: reportData,
        silent: false
      });
      toast.success('Membuka pratinjau cetak PDF...');
    } catch (err) {
      console.error(err);
      toast.error('Gagal mencetak: ' + err.message);
    }
  };

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
  // ─── Load Check Sheet into Designer (for Edit / Modification) ───
  const loadChecksheetIntoDesigner = (cs, allDrawings = []) => {
    if (!cs) return;
    setPartNo(cs.partNo || cs.part_no || '');
    setPartName(cs.partName || cs.part_name || cs.name || '');
    setCustomer(cs.customer || '');
    setProcessName(cs.processName || cs.process || '');
    setDrawingNo(cs.drawingNo || cs.docNo || cs.doc_no || '');
    setRevisionNo(cs.revisionNo || cs.revision || 'A');
    setEffectiveDate(cs.effectiveDate || cs.effective_date || new Date().toISOString().split('T')[0]);
    setNextReviewDate(cs.nextReviewDate || cs.next_review_date || '');
    setInspectorName(cs.inspectorName || cs.author || currentUser?.username || '');
    setApprovedBy(cs.approvedBy || cs.approver || '');
    setQualityStandard(cs.qualityStandard || cs.standard || 'ISO 9001:2015');
    setCheckSheetStatus(cs.status || 'draft');
    setCheckSheetName(cs.name || cs.checkSheetName || cs.title || 'Check Sheet');
    setCheckSheetDescription(cs.description || '');
    setWorkOrderPrefix(cs.workOrderPrefix || 'WO-2026');
    setStationId(cs.stationId || cs.station || 'ST-01');

    if (cs.checkPoints && Array.isArray(cs.checkPoints) && cs.checkPoints.length > 0) {
      setCheckPoints(cs.checkPoints);
    } else if (cs.points && Array.isArray(cs.points) && cs.points.length > 0) {
      setCheckPoints(cs.points);
    }

    // Resolve drawing preview & metadata
    const preview = cs.drawingPreview || cs.drawingSvg || cs.svgData || cs.dataUrl || cs.drawingDataUrl || null;
    if (preview) {
      setDrawingPreview(preview);
    }

    const dwgs = allDrawings && allDrawings.length > 0 ? allDrawings : drawingsList;
    let matchedDrawing = null;
    if (cs.drawingId && dwgs && dwgs.length > 0) {
      matchedDrawing = dwgs.find(d => d.id === cs.drawingId);
      if (matchedDrawing) {
        setSelectedDrawing(matchedDrawing);
        if (!preview && (matchedDrawing.svgData || matchedDrawing.dataUrl)) {
          setDrawingPreview(matchedDrawing.svgData || matchedDrawing.dataUrl);
        }
      }
    }
    if (!matchedDrawing && (cs.drawingId || cs.drawingName || preview)) {
      setSelectedDrawing({
        id: cs.drawingId || cs.id || 'dwg_custom',
        name: cs.drawingName || cs.name || 'Inspection Drawing',
        svgData: preview,
        fileType: 'SVG'
      });
    }

    if (cs.targetTableId) {
      setTargetTableId(cs.targetTableId);
    }

    toast.success(`Check Sheet "${cs.name || cs.docNo || 'Aktif'}" berhasil dimuat ke Designer!`, { icon: '✏️' });
  };

  // ─── Load Drawings & Checksheet on Mount ───
  useEffect(() => {
    const loadData = async () => {
      let loadedDrawings = [];
      try {
        const drawings = await getAllDrawings();
        if (drawings && drawings.length > 0) {
          loadedDrawings = drawings;
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

      let allTemplates = [];
      // Load saved templates from Supabase (fallback to localStorage)
      try {
        const remoteTemplates = await getTemplates();
        if (remoteTemplates && remoteTemplates.length > 0) {
          allTemplates = remoteTemplates;
          setSavedTemplates(remoteTemplates);
          localStorage.setItem('mandor_inspector_templates', JSON.stringify(remoteTemplates));
        } else {
          const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
          allTemplates = local;
          setSavedTemplates(local);
        }
      } catch (e) {
        console.warn('[InspectorDesigner] getTemplates failed, using localStorage fallback', e);
        const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
        allTemplates = local;
        setSavedTemplates(local);
      }

      // ── Check if there is an active checksheet requested for edit from Checksheet Management ──
      const editTemplateJson = localStorage.getItem('mandor_inspector_active_template');
      if (editTemplateJson) {
        try {
          const cs = JSON.parse(editTemplateJson);
          loadChecksheetIntoDesigner(cs, loadedDrawings);
        } catch (err) {
          console.warn('[InspectorDesigner] Failed to parse mandor_inspector_active_template', err);
        }
      } else {
        // Check URL query parameters (e.g. ?edit=... or ?id=...)
        const urlParams = new URLSearchParams(window.location.hash.includes('?') ? window.location.hash.split('?')[1] : window.location.search);
        const editId = urlParams.get('edit') || urlParams.get('id') || urlParams.get('docNo');
        if (editId && allTemplates.length > 0) {
          const found = allTemplates.find(t => t.id === editId || t.docNo === editId || t.name === editId);
          if (found) {
            loadChecksheetIntoDesigner(found, loadedDrawings);
          }
        }
      }
    };
    loadData();
  }, []);

  // ─── Proportional Canvas Auto-Fit (Zero Wasted Space) ───
  const handleFitToScreen = useCallback(() => {
    if (containerRef.current) {
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth > 150 && clientHeight > 150) {
        const targetW = 1000;
        const targetH = 700;
        // 94% fit to maintain clean aesthetic margin without wasted dead space
        const scaleX = (clientWidth * 0.94) / targetW;
        const scaleY = (clientHeight * 0.94) / targetH;
        const bestFit = Math.min(scaleX, scaleY, 2.5);
        setZoom(Number(Math.max(0.35, bestFit).toFixed(2)));
        setPan({ x: 0, y: 0 });
      }
    }
  }, []);

  // Auto-fit on drawing load, step switch, or window resize
  useEffect(() => {
    const timer = setTimeout(() => {
      handleFitToScreen();
    }, 100);
    window.addEventListener('resize', handleFitToScreen);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleFitToScreen);
    };
  }, [handleFitToScreen, drawingPreview, currentStep]);

  // ─── Precision Auto-Balloon State ───
  const [showAutoBalloonModal, setShowAutoBalloonModal] = useState(false);
  const [autoBalloonToleranceGrade, setAutoBalloonToleranceGrade] = useState('iso_m'); // iso_f (fine ±0.05), iso_m (medium ±0.1), custom_precision (±0.02)
  const [autoBalloonSortStrategy, setAutoBalloonSortStrategy] = useState('spatial'); // spatial, critical_first, clockwise

  // ─── AUTO-ALIGN & DISPERSE BALLOONS (COLLISION AVOIDANCE) ─────────
  const handleAutoDisperseBalloons = () => {
    if (checkPoints.length <= 1) return;
    const updated = checkPoints.map(p => ({ ...p }));
    let dispersedCount = 0;

    for (let i = 0; i < updated.length; i++) {
      for (let j = i + 1; j < updated.length; j++) {
        const dx = updated[i].x - updated[j].x;
        const dy = updated[i].y - updated[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          if (updated[j].targetX === undefined) {
            updated[j].targetX = updated[j].x;
            updated[j].targetY = updated[j].y;
          }
          const angle = Math.atan2(dy, dx) || 0.5;
          updated[j].x = Math.round(updated[j].x - Math.cos(angle) * 44);
          updated[j].y = Math.round(updated[j].y - Math.sin(angle) * 44);
          dispersedCount++;
        }
      }
    }
    setCheckPoints(updated);
    toast.success(`⚡ ${dispersedCount} Balon dirapikan otomatis dengan Leader Lines!`, { icon: '📐' });
  };

  // ─── SMART RE-NUMBERING: CLOCKWISE SORT ────────────────────────────
  const handleSortClockwise = () => {
    if (checkPoints.length <= 1) return;
    const centerX = checkPoints.reduce((s, p) => s + p.x, 0) / checkPoints.length;
    const centerY = checkPoints.reduce((s, p) => s + p.y, 0) / checkPoints.length;

    const sorted = [...checkPoints].sort((a, b) => {
      const angleA = Math.atan2(a.y - centerY, a.x - centerX);
      const angleB = Math.atan2(b.y - centerY, b.x - centerX);
      return angleA - angleB;
    }).map((p, idx) => ({ ...p, pointNumber: idx + 1 }));

    setCheckPoints(sorted);
    setShowRenumberMenu(false);
    toast.success('Urutan balon diperbarui searah jarum jam (Clockwise)!', { icon: '🔄' });
  };

  // ─── SMART RE-NUMBERING: READING ORDER (GRID) ─────────────────────
  const handleSortReadingOrder = () => {
    if (checkPoints.length <= 1) return;
    const sorted = [...checkPoints].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 60) return a.y - b.y; // Top to Bottom
      return a.x - b.x; // Left to Right
    }).map((p, idx) => ({ ...p, pointNumber: idx + 1 }));

    setCheckPoints(sorted);
    setShowRenumberMenu(false);
    toast.success('Urutan balon diperbarui sesuai Grid (Top-to-Bottom / Left-to-Right)!', { icon: '🔢' });
  };
  const [detectedCADPoints, setDetectedCADPoints] = useState([]);
  const [isExtractingCAD, setIsExtractingCAD] = useState(false);
  const [extractionStatusText, setExtractionStatusText] = useState('');
  const [detectedPdfTypeInfo, setDetectedPdfTypeInfo] = useState('VECTOR_PDF');

  // ─── AI / CAD Feature High-Precision Auto-Ballooning Dimension Extractor ───
  const handleOpenAutoBalloonStudio = useCallback(async () => {
    setIsExtractingCAD(true);
    setExtractionStatusText('🔍 Membaca geometri drawing PDF...');
    const loadingToastId = toast.loading('Memulai Engine Auto-Ballooning Dimensi CAD & PDF...', { id: 'autoballoon-toast' });

    try {
      // Determine best drawing source available
      const drawingSource = selectedDrawing?.pdfData || selectedDrawing?.dataUrl || selectedDrawing?.svgData || drawingPreview || null;

      const result = await extractBlueprintDimensions(
        drawingSource,
        {
          toleranceGrade: autoBalloonToleranceGrade,
          sortStrategy: autoBalloonSortStrategy,
          canvasWidth: 1000,
          canvasHeight: 700,
          rasterImageDataUrl: drawingPreview || selectedDrawing?.dataUrl || null
        },
        (statusUpdate) => {
          if (statusUpdate.message) {
            setExtractionStatusText(statusUpdate.message);
          }
        }
      );

      setDetectedPdfTypeInfo(result.pdfType || 'VECTOR_PDF');
      setDetectedCADPoints(result.points || []);
      setShowAutoBalloonModal(true);

      toast.success(`🎯 ${result.count} Dimensi CAD & GD&T berhasil diekstraksi (${result.pdfType})!`, {
        id: 'autoballoon-toast',
        duration: 3500
      });
    } catch (err) {
      console.error('[InspectorDesigner] Auto-balloon extraction error:', err);
      toast.error('Gagal mengekstrak dimensi otomatis: ' + err.message, { id: 'autoballoon-toast' });
    } finally {
      setIsExtractingCAD(false);
      setExtractionStatusText('');
    }
  }, [selectedDrawing, drawingPreview, autoBalloonToleranceGrade, autoBalloonSortStrategy]);

  // Apply detected points to active check sheet
  const handleApplyAutoBalloons = (pointsToApply) => {
    let finalPoints = [...pointsToApply];

    if (autoBalloonSortStrategy === 'critical_first') {
      finalPoints.sort((a, b) => {
        const aCrit = a.criticality.includes('Critical') ? 0 : a.criticality.includes('Major') ? 1 : 2;
        const bCrit = b.criticality.includes('Critical') ? 0 : b.criticality.includes('Major') ? 1 : 2;
        return aCrit - bCrit;
      });
    } else if (autoBalloonSortStrategy === 'clockwise') {
      const centerX = 350;
      const centerY = 280;
      finalPoints.sort((a, b) => {
        const angleA = Math.atan2(a.y - centerY, a.x - centerX);
        const angleB = Math.atan2(b.y - centerY, b.x - centerX);
        return angleA - angleB;
      });
    } else {
      // Spatial Flow (Top to Bottom, Left to Right)
      finalPoints.sort((a, b) => a.y - b.y || a.x - b.x);
    }

    // Re-index point numbers sequentially
    const reindexed = finalPoints.map((pt, idx) => ({
      ...pt,
      pointNumber: idx + 1
    }));

    setCheckPoints(reindexed);
    if (reindexed.length > 0) {
      setActivePointId(reindexed[0].id);
    }
    setShowAutoBalloonModal(false);
    toast.success(`✨ ${reindexed.length} Balon & Parameter Presisi Berhasil Diterapkan ke Blueprint!`, {
      duration: 4000,
      icon: '🎯'
    });
  };

  const [isGeneratingTable, setIsGeneratingTable] = useState(false);
  const [_generatedTableInfo, setGeneratedTableInfo] = useState(null);

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
    const _defaultDocNo = `CS-${Date.now().toString(36).toUpperCase()}`;
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

      let pdfDataUrl = null;
      let rawImageDataUrl = null;

      if (ext === 'pdf') {
        const reader = new FileReader();
        const fileDataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        pdfDataUrl = fileDataUrl;
        // Convert PDF to High-Res Image Data URL
        const imagePngUrl = await convertPdfToImageDataUrl(fileDataUrl, 2.5);
        rawImageDataUrl = imagePngUrl;
        previewContent = `<img src="${imagePngUrl}" style="width:100%;height:100%;object-fit:contain;" />`;

      } else if (ext === 'dxf') {
        const text = await file.text();
        const dxfResult = parseDxfContent(text, fileName);
        
        if (dxfResult && dxfResult.rendered_image) {
          rawImageDataUrl = dxfResult.rendered_image;
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
        rawImageDataUrl = dataUrl;
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
        pdfData: pdfDataUrl,
        dataUrl: rawImageDataUrl,
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
  const _handleSelectDrawing = (drawing) => {
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
      x: point.x + 25,
      y: point.y + 25,
      targetX: point.targetX !== undefined ? point.targetX : point.x,
      targetY: point.targetY !== undefined ? point.targetY : point.y
    };
    setCheckPoints([...checkPoints, newPoint]);
    toast.success('Point duplicated');
  };
  
  // ─── Precise Canvas Coordinate Conversion (Exact Subpixel Mapping) ───
  const getCanvasCoords = (clientX, clientY) => {
    if (!canvasContentRef.current) return { x: 200, y: 200 };
    const rect = canvasContentRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return { x: 200, y: 200 };
    
    // Normalized 0 to 1 position across the rendered canvas rectangle
    const normX = (clientX - rect.left) / rect.width;
    const normY = (clientY - rect.top) / rect.height;
    
    // Canvas blueprint dimensions are 1000 x 700
    const canvasX = Math.round(normX * 1000);
    const canvasY = Math.round(normY * 700);
    
    return {
      x: Math.max(5, Math.min(995, canvasX)),
      y: Math.max(5, Math.min(695, canvasY))
    };
  };

  // ─── Drawing Annotation Persistence & Synchronization ───
  useEffect(() => {
    try {
      localStorage.setItem('mandor_inspector_drawings', JSON.stringify(drawings));
    } catch (err) {
      console.warn('Failed to persist drawings:', err);
    }
  }, [drawings]);

  useEffect(() => {
    try {
      localStorage.setItem('mandor_inspector_stamps', JSON.stringify(stamps));
    } catch (err) {
      console.warn('Failed to persist stamps:', err);
    }
  }, [stamps]);

  // ─── Drawing Event Handlers ───
  const handleDrawStart = (e) => {
    if (!isDrawingMode) return;
    e.stopPropagation();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pt = getCanvasCoords(clientX, clientY);

    if (drawingTool === 'eraser') {
      const remaining = drawings.filter(d => {
        if (d.type === 'pen' || d.type === 'marker' || d.type === 'highlighter') {
          return !d.points.some(p => Math.hypot(p.x - pt.x, p.y - pt.y) < 20);
        }
        if (d.type === 'arrow') {
          return Math.hypot(d.x1 - pt.x, d.y1 - pt.y) > 20 && Math.hypot(d.x2 - pt.x, d.y2 - pt.y) > 20;
        }
        if (d.type === 'rect') {
          return !(pt.x >= d.x && pt.x <= d.x + d.w && pt.y >= d.y && pt.y <= d.y + d.h);
        }
        if (d.type === 'circle') {
          return Math.hypot(d.cx - pt.x, d.cy - pt.y) > d.r;
        }
        if (d.type === 'text') {
          return Math.hypot(d.x - pt.x, d.y - pt.y) > 30;
        }
        return true;
      });
      setDrawings(remaining);
      return;
    }

    if (drawingTool === 'text') {
      setTextInputPosition(pt);
      setShowTextModal(true);
      return;
    }

    if (drawingTool === 'stamp') {
      const stampDef = STAMPS.find(s => s.id === selectedStamp) || STAMPS[0];
      const newStamp = {
        id: `stamp_${Date.now()}`,
        x: pt.x,
        y: pt.y,
        type: selectedStamp,
        label: stampDef.label,
        icon: stampDef.icon,
        color: stampDef.color,
        bg: stampDef.bg,
        border: stampDef.border,
        date: new Date().toLocaleDateString()
      };
      setStamps(prev => [...prev, newStamp]);
      toast.success(`Stamp ${stampDef.label} diletakkan!`);
      return;
    }

    setIsDrawing(true);
    if (drawingTool === 'pen' || drawingTool === 'marker' || drawingTool === 'highlighter') {
      setCurrentStroke([pt]);
    } else {
      setShapeStart(pt);
      setShapeCurrent(pt);
    }
  };

  const handleDrawMove = (e) => {
    if (!isDrawingMode || !isDrawing) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const pt = getCanvasCoords(clientX, clientY);

    if (drawingTool === 'pen' || drawingTool === 'marker' || drawingTool === 'highlighter') {
      setCurrentStroke(prev => [...prev, pt]);
    } else {
      setShapeCurrent(pt);
    }
  };

  const handleDrawEnd = () => {
    if (!isDrawingMode || !isDrawing) return;
    setIsDrawing(false);

    let newShape = null;
    if ((drawingTool === 'pen' || drawingTool === 'marker' || drawingTool === 'highlighter') && currentStroke.length > 1) {
      newShape = {
        id: `draw_${Date.now()}`,
        type: drawingTool,
        color: drawingColor,
        size: drawingSize,
        opacity: drawingTool === 'highlighter' ? 0.35 : drawingTool === 'marker' ? 0.85 : 1,
        points: currentStroke
      };
    } else if (drawingTool === 'arrow' && shapeStart && shapeCurrent) {
      newShape = {
        id: `arrow_${Date.now()}`,
        type: 'arrow',
        color: drawingColor,
        size: drawingSize,
        x1: shapeStart.x,
        y1: shapeStart.y,
        x2: shapeCurrent.x,
        y2: shapeCurrent.y
      };
    } else if (drawingTool === 'rect' && shapeStart && shapeCurrent) {
      const x = Math.min(shapeStart.x, shapeCurrent.x);
      const y = Math.min(shapeStart.y, shapeCurrent.y);
      const w = Math.abs(shapeCurrent.x - shapeStart.x);
      const h = Math.abs(shapeCurrent.y - shapeStart.y);
      if (w > 5 && h > 5) {
        newShape = {
          id: `rect_${Date.now()}`,
          type: 'rect',
          color: drawingColor,
          size: drawingSize,
          x, y, w, h
        };
      }
    } else if (drawingTool === 'circle' && shapeStart && shapeCurrent) {
      const r = Math.hypot(shapeCurrent.x - shapeStart.x, shapeCurrent.y - shapeStart.y);
      if (r > 5) {
        newShape = {
          id: `circle_${Date.now()}`,
          type: 'circle',
          color: drawingColor,
          size: drawingSize,
          cx: shapeStart.x,
          cy: shapeStart.y,
          r
        };
      }
    }

    if (newShape) {
      setDrawings(prev => [...prev, newShape]);
      setRedoStack([]);
    }
    setCurrentStroke([]);
    setShapeStart(null);
    setShapeCurrent(null);
  };

  const handleUndo = () => {
    if (drawings.length > 0) {
      const last = drawings[drawings.length - 1];
      setRedoStack(prev => [...prev, last]);
      setDrawings(prev => prev.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const item = redoStack[redoStack.length - 1];
      setDrawings(prev => [...prev, item]);
      setRedoStack(prev => prev.slice(0, -1));
    }
  };

  const handleClearAllDrawings = () => {
    if (window.confirm('Hapus semua coretan dan anotasi pada blueprint ini?')) {
      setDrawings([]);
      setStamps([]);
      setRedoStack([]);
      toast.success('Semua anotasi dibersihkan');
    }
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
        revisionNo: revisionNo,
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

      const toastId = toast.loading('Menyimpan template ke cloud...');
      let updatedTemplates;
      try {
        // Build the full templates array: replace if exists, otherwise prepend
        const existingTemplates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
        const existingIndex = existingTemplates.findIndex(t => t.id === templateData.id);
        if (existingIndex >= 0) {
          updatedTemplates = existingTemplates.map((t, i) => i === existingIndex ? templateData : t);
        } else {
          updatedTemplates = [templateData, ...existingTemplates];
        }

        await saveTemplates(updatedTemplates);
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(updatedTemplates));
        toast.success(`✓ Template "${templateData.name}" disimpan ke cloud!`, { id: toastId });
      } catch (e) {
        console.warn('[InspectorDesigner] saveTemplates failed, saving locally only', e);
        // Fallback: save to localStorage anyway
        const existingTemplates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
        const existingIndex = existingTemplates.findIndex(t => t.id === templateData.id);
        if (existingIndex >= 0) {
          updatedTemplates = existingTemplates.map((t, i) => i === existingIndex ? templateData : t);
        } else {
          updatedTemplates = [templateData, ...existingTemplates];
        }
        setSavedTemplates(updatedTemplates);
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(updatedTemplates));
        toast.error('⚠ Cloud save gagal — disimpan secara lokal saja.', { id: toastId });
      } finally {
        setIsSaving(false);
      }
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
      setIsSaving(false);
    }
  };
  
  // ─── Export to Digital Check Sheet ───
  const handleExportToCheckSheet = async () => {
    if (checkPoints.length === 0) {
      toast.error('Please add at least one inspection point');
      return;
    }
    
    const publishId = `CS-${partNo || 'PART'}-${Date.now().toString(36).toUpperCase()}`;
    const dwgId = selectedDrawing?.id || publishId;
    const fullDrawingSvg = drawingPreview || selectedDrawing?.svgData || selectedDrawing?.dataUrl || null;

    const checkSheetData = {
      // ISO 9001:2015 Document Control Fields
      id: publishId,
      docNo: drawingNo || publishId,
      status: checkSheetStatus || 'APPROVED',
      qualityStandard: qualityStandard || 'ISO 9001:2015',
      revision: revisionNo || 'A',
      revisionNo: revisionNo || 'A',
      effectiveDate: effectiveDate || new Date().toISOString().split('T')[0],
      nextReviewDate: nextReviewDate || '',

      // Master Data Header
      partNo: partNo || checkSheetName || 'PART-001',
      partName: partName || checkSheetName || 'Standard Component',
      name: checkSheetName || partName || 'Inspection Check Sheet',
      customer: customer || 'Internal Quality',
      process: processName || 'Assembly / Machining',
      processName: processName || 'Assembly / Machining',
      drawingNo: drawingNo || publishId,
      description: checkSheetDescription || '',
      workOrderPrefix: workOrderPrefix || '',
      stationId: stationId || '',

      // Personnel
      inspectorName: inspectorName || currentUser?.username || 'Quality Inspector',
      approver: approvedBy || 'QC Lead',
      approvedBy: approvedBy || 'QC Lead',
      createdBy: currentUser?.username || 'Unknown',
      createdAt: new Date().toISOString(),

      // Drawing Reference & Uploaded Blueprint
      drawingId: dwgId,
      drawingName: selectedDrawing?.name || checkSheetName || partName || 'Inspection Drawing',
      drawingSvg: fullDrawingSvg,

      // Inspection Points / Parameters
      checkPoints: checkPoints.map((p, idx) => ({
        id: p.id || `cp_${idx + 1}`,
        pointNumber: p.pointNumber || idx + 1,
        title: p.title || `Point ${idx + 1}`,
        category: p.category || 'Dimension',
        nominal: parseFloat(p.nominal) || 0,
        tolMin: parseFloat(p.tolMin !== undefined ? p.tolMin : (p.toleranceMin || 0)),
        tolMax: parseFloat(p.tolMax !== undefined ? p.tolMax : (p.toleranceMax || 0)),
        unit: p.unit || 'mm',
        x: p.x !== undefined ? p.x : 200,
        y: p.y !== undefined ? p.y : 200,
        criticality: p.criticality || 'Major',
        tool: p.inspectionMethod || p.tool || 'Caliper',
        toolId: p.toolId || '',
        gdtSymbol: p.gdtSymbol || '',
        notes: p.notes || '',
        required: p.required !== false,
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
    
    // 1. In-memory handoff for instant rendering without storage lag
    if (typeof window !== 'undefined') {
      window.__mandor_active_checksheet = checkSheetData;
      window.__mandor_active_drawing_svg = fullDrawingSvg;
    }

    // 2. Persist large drawing into IndexedDB (Dexie) - No 5MB quota limit
    try {
      if (fullDrawingSvg && drawingsLocalDB) {
        await drawingsLocalDB.drawings.put({
          id: dwgId,
          name: checkSheetData.drawingName,
          fileName: selectedDrawing?.fileName || `${dwgId}.png`,
          fileType: selectedDrawing?.fileType || 'IMAGE',
          svgData: fullDrawingSvg,
          dataUrl: fullDrawingSvg,
          updated_at: new Date().toISOString()
        });
      }
    } catch (idbErr) {
      console.warn('[InspectorDesigner] IndexedDB save error:', idbErr);
    }

    // 3. Save to localStorage with safe size handling (strip large base64 if needed to avoid QuotaExceededError)
    try {
      localStorage.setItem('mandor_checksheet_published', 'true');
      localStorage.setItem('mandor_checksheet_publish_id', publishId);
      localStorage.setItem('mandor_checksheet_active_drawing_id', dwgId);

      const isDrawingHuge = fullDrawingSvg && fullDrawingSvg.length > 200000;
      const storageSafeCheckSheet = {
        ...checkSheetData,
        drawingSvg: isDrawingHuge ? null : fullDrawingSvg
      };
      
      try {
        localStorage.setItem('mandor_published_checksheet', JSON.stringify(storageSafeCheckSheet));
      } catch {
        storageSafeCheckSheet.drawingSvg = null;
        localStorage.setItem('mandor_published_checksheet', JSON.stringify(storageSafeCheckSheet));
      }

      // Also save lightweight drawing metadata in drawings list
      const existingDrawings = JSON.parse(localStorage.getItem('mandor_checksheet_drawings') || '[]');
      const dwgItem = {
        id: dwgId,
        name: checkSheetData.drawingName,
        partNo: partNo || '',
        svgData: isDrawingHuge ? null : fullDrawingSvg,
        uploadedAt: new Date().toISOString()
      };
      const updatedDrawings = [dwgItem, ...existingDrawings.filter(d => d.id !== dwgId).slice(0, 10)];
      try {
        localStorage.setItem('mandor_checksheet_drawings', JSON.stringify(updatedDrawings));
      } catch {
        // Skip lightweight list if localStorage is full - IndexedDB has it
      }
    } catch (e) {
      console.warn('[InspectorDesigner] localStorage write handled:', e);
    }

    // 4. Fire-and-forget template sync (with sanitized payload to prevent Supabase 400 & quota error)
    try {
      const templateData = {
        ...checkSheetData,
        drawingSvg: checkSheetData.drawingSvg && checkSheetData.drawingSvg.length > 200000 ? null : checkSheetData.drawingSvg
      };
      const existingTemplates = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
      const existingIndex = existingTemplates.findIndex(t => t.id === templateData.id);
      let updatedTemplates;
      if (existingIndex >= 0) {
        updatedTemplates = existingTemplates.map((t, i) => i === existingIndex ? templateData : t);
      } else {
        updatedTemplates = [templateData, ...existingTemplates.slice(0, 10)];
      }
      saveTemplates(updatedTemplates);
      setSavedTemplates(updatedTemplates);
    } catch (e) {
      console.warn('[InspectorDesigner] Template sync warning:', e);
    }

    toast.success(`✓ Exported to Digital Check Sheet! ${checkSheetData.checkPoints.length} Parameter & Drawing terhubung.`);
    navigate('/drawing-checksheet');
  };
  
  // ─── Generate QR Code ───
  const handleGenerateQR = () => {
    const origin = window.location.origin;
    const pathname = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
    const publishId = `CHECKSHEET_${workOrderPrefix}_${Date.now().toString(36)}`;
    const qrUrl = `${origin}${pathname}#/drawing-checksheet?checksheet=${publishId}&mode=companion&standalone=true&wo=${encodeURIComponent(checkSheetName || workOrderPrefix)}`;
    setPreviewQRCode(qrUrl);
    setShowQRModal(true);
  };
  
  const getCategoryColor = (key) => {
    const cleanKey = String(key || '').toLowerCase();
    const cat = PARAM_CATEGORIES.find(c => c.key.toLowerCase() === cleanKey || c.label.toLowerCase() === cleanKey);
    return cat?.color || '#3b82f6';
  };
  
  const getCategoryIcon = (key) => {
    const cleanKey = String(key || '').toLowerCase();
    const cat = PARAM_CATEGORIES.find(c => c.key.toLowerCase() === cleanKey || c.label.toLowerCase() === cleanKey);
    return cat?.icon || '📏';
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
        
        {/* Top Step Indicator (7-Step Process) - Icon Only */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {[
            { num: 1, label: 'Header', icon: ClipboardList, color: '#38bdf8' },
            { num: 2, label: 'Drawing', icon: Layers, color: '#a78bfa' },
            { num: 3, label: 'Parameters', icon: Ruler, color: '#f59e0b' },
            { num: 4, label: 'Data', icon: Database, color: '#10b981' },
            { num: 5, label: 'Workflow', icon: SlidersHorizontal, color: '#ec4899' },
            { num: 6, label: 'Report & Print', icon: FileSpreadsheet, color: '#8b5cf6' },
            { num: 7, label: 'Deploy', icon: Sparkles, color: '#06b6d4' }
          ].map((s, idx) => {
            const IconCmp = s.icon;
            const isActive = currentStep === s.num;
            const isCompleted = currentStep > s.num;
            return (
              <React.Fragment key={s.num}>
                <button
                  onClick={() => setCurrentStep(s.num)}
                  title={`Step ${s.num}: ${s.label}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    backgroundColor: isActive 
                      ? 'rgba(139, 92, 246, 0.35)' 
                      : isCompleted 
                      ? 'rgba(16, 185, 129, 0.18)' 
                      : 'rgba(30, 41, 59, 0.65)',
                    border: isActive 
                      ? '2px solid #a78bfa' 
                      : isCompleted 
                      ? '1.5px solid #10b981' 
                      : '1.5px solid #334155',
                    cursor: 'pointer',
                    transition: 'all 0.18s ease',
                    transform: isActive ? 'scale(1.08)' : 'scale(1)',
                    boxShadow: isActive ? '0 0 14px rgba(139, 92, 246, 0.5)' : 'none',
                    padding: 0
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.8)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.backgroundColor = isCompleted ? 'rgba(16, 185, 129, 0.18)' : 'rgba(30, 41, 59, 0.65)';
                  }}
                >
                  <div style={{
                    width: '26px', height: '26px',
                    borderRadius: '50%',
                    backgroundColor: isActive ? '#8b5cf6' : isCompleted ? '#10b981' : 'transparent',
                    color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {isCompleted ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <IconCmp size={16} strokeWidth={isActive ? 2.5 : 2} color={isActive ? 'white' : s.color} />
                    )}
                  </div>
                </button>
                {idx < 6 && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                    color: currentStep > s.num ? '#10b981' : currentStep === s.num ? '#a78bfa' : '#64748b',
                    filter: currentStep > s.num ? 'drop-shadow(0 0 6px rgba(16, 185, 129, 0.6))' : currentStep === s.num ? 'drop-shadow(0 0 6px rgba(167, 139, 250, 0.6))' : 'none',
                    transition: 'all 0.2s ease'
                  }}>
                    <ArrowRight size={18} strokeWidth={2.8} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Right Toolbar: ISO Controls & Actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* ISO 9001 Status Badge */}
          <div 
            title={`Status: ${checkSheetStatus ? checkSheetStatus.toUpperCase() : 'DRAFT'}`}
            style={{
              padding: '4px 8px',
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
            }}
          >
            <ShieldCheck size={12} />
            <span>
              {checkSheetStatus === 'draft' ? 'DRAFT' :
               checkSheetStatus === 'pending_approval' ? 'PENDING' :
               checkSheetStatus === 'approved' ? 'APPROVED' :
               checkSheetStatus === 'released' ? 'RELEASED' : 'ARCHIVED'}
            </span>
          </div>

          {/* Checksheet Management ISO 9001 */}
          <button
            onClick={() => navigate('/checksheets')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Dokumen ISO 9001 (Checksheet Management)"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0c1a2e'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
          >
            <FolderArchive size={16} />
          </button>

          {/* Template Library Button */}
          <button
            onClick={() => setShowTemplateModal(true)}
            style={{
              height: '32px',
              padding: '0 8px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
            title={`Template Library (${savedTemplates.length})`}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
          >
            <FileText size={15} />
            <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>({savedTemplates.length})</span>
          </button>

          {/* Revision History */}
          <button
            onClick={() => setShowRevisionModal(true)}
            style={{
              height: '32px',
              padding: '0 8px',
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              fontWeight: 700,
              transition: 'all 0.15s'
            }}
            title={`Revision History (Rev ${revisionNo})`}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
          >
            <Clock size={15} />
            <span style={{ fontSize: '0.68rem', color: '#38bdf8' }}>{revisionNo}</span>
          </button>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#334155', margin: '0 2px' }} />

          {/* Create New Check Sheet */}
          <button
            onClick={handleCreateNewCheckSheet}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(16, 185, 129, 0.35)',
              transition: 'all 0.15s'
            }}
            title="Create New Check Sheet (Buat Baru)"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <PlusCircle size={16} />
          </button>

          {/* Open Project */}
          <button
            onClick={() => setShowOpenProjectModal(true)}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c7',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Buka Project (Open)"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0c1a2e'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
          >
            <FolderOpen size={16} />
          </button>

          {/* Save Project */}
          <button
            onClick={handleSaveTemplate}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
              transition: 'all 0.15s'
            }}
            title="Simpan Project (Save)"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            <Save size={16} />
          </button>

          {/* Back to QA Checksheet */}
          <button
            onClick={() => navigate('/qa-checksheet')}
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#334155',
              color: '#f8fafc',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s'
            }}
            title="Back to QA Checksheet"
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#475569'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#334155'}
          >
            <ArrowLeft size={16} />
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {currentStep === 1 && <ClipboardList size={16} color="#38bdf8" />}
              {currentStep === 2 && <Layers size={16} color="#a78bfa" />}
              {currentStep === 3 && <Ruler size={16} color="#f59e0b" />}
              {currentStep === 4 && <Database size={16} color="#10b981" />}
              {currentStep === 5 && <SlidersHorizontal size={16} color="#ec4899" />}
              {currentStep === 6 && <FileSpreadsheet size={16} color="#8b5cf6" />}
              {currentStep === 7 && <Sparkles size={16} color="#06b6d4" />}
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                {currentStep === 1 ? '1. Parameter Header & Info' :
                 currentStep === 2 ? '2. Upload Drawing / CAD' :
                 currentStep === 3 ? '3. Inspection Parameters' :
                 currentStep === 4 ? '4. Data & Auto-Table' :
                 currentStep === 5 ? '5. Workflow Step & Rules' :
                 currentStep === 6 ? '6. Report & Physical Print' :
                 '7. Deploy & Export'}
              </span>
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
                    <label style={{ fontSize: '0.68rem', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <span>Nama Check Sheet / Title *</span>
                    </label>
                    <input
                      type="text"
                      value={checkSheetName}
                      onChange={e => setCheckSheetName(e.target.value)}
                      placeholder="e.g., Dual Stage Planetary Gearbox QC Checksheet"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        backgroundColor: '#1e293b',
                        border: '1.5px solid #0284c7',
                        borderRadius: '6px',
                        color: '#ffffff',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        outline: 'none',
                        boxShadow: '0 0 10px rgba(56, 189, 248, 0.15)'
                      }}
                    />
                  </div>

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
                Lanjut ke Step 6: Report & Print Layout <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* ─── STEP 6: Report Designer & Physical Checksheet ─── */}
          {currentStep === 6 && (
            <div style={{ flex: 1, overflow: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Paper Format & Orientation Settings */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                  <FileSpreadsheet size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#f8fafc' }}>
                    Pengaturan Kertas & Orientasi Fisik
                  </span>
                </div>

                {/* Paper Size Selector */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Jenis Kertas Cetak (Paper Size):
                  </label>
                  <select
                    value={reportPaperSize}
                    onChange={e => setReportPaperSize(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option value="A4">A4 (210 × 297 mm) — Standar ISO Pabrik</option>
                    <option value="A3">A3 (297 × 420 mm) — Format Lebar Drawing</option>
                    <option value="Letter">Letter (8.5 × 11 in) — Standar US</option>
                    <option value="Legal">Legal (8.5 × 14 in)</option>
                    <option value="Label_100x150">Thermal Label (100 × 150 mm)</option>
                  </select>
                </div>

                {/* Orientation Buttons */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                    Orientasi Cetak (Orientation):
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => setReportOrientation('portrait')}
                      style={{
                        padding: '8px',
                        backgroundColor: reportOrientation === 'portrait' ? 'rgba(139, 92, 246, 0.25)' : '#0f172a',
                        border: reportOrientation === 'portrait' ? '1.5px solid #8b5cf6' : '1px solid #334155',
                        borderRadius: '6px',
                        color: reportOrientation === 'portrait' ? '#c084fc' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <div style={{ width: '12px', height: '16px', border: '1.5px solid currentColor', borderRadius: '2px' }} />
                      Portrait (Tegak)
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportOrientation('landscape')}
                      style={{
                        padding: '8px',
                        backgroundColor: reportOrientation === 'landscape' ? 'rgba(139, 92, 246, 0.25)' : '#0f172a',
                        border: reportOrientation === 'landscape' ? '1.5px solid #8b5cf6' : '1px solid #334155',
                        borderRadius: '6px',
                        color: reportOrientation === 'landscape' ? '#c084fc' : '#94a3b8',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                      }}
                    >
                      <div style={{ width: '16px', height: '12px', border: '1.5px solid currentColor', borderRadius: '2px' }} />
                      Landscape (Melebar)
                    </button>
                  </div>
                </div>

                {/* Theme Style */}
                <div>
                  <label style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    Tema Warna Cetak ISO:
                  </label>
                  <select
                    value={reportTheme}
                    onChange={e => setReportTheme(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      backgroundColor: '#0f172a',
                      border: '1px solid #475569',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      outline: 'none'
                    }}
                  >
                    <option value="mandor_purple">Mandor Classic Purple (ISO Premium)</option>
                    <option value="navy_modern">Industrial Modern Navy Blue</option>
                    <option value="emerald_qa">Emerald Quality Green</option>
                    <option value="monochrome">Monochrome High-Contrast (B&W)</option>
                  </select>
                </div>
              </div>

              {/* Physical Checksheet ISO Sections Toggle */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '10px',
                padding: '14px',
                border: '1px solid #334155'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#a78bfa', display: 'block', marginBottom: '8px' }}>
                  Atribut Dokumen Fisik ISO 9001
                </span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.72rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={includeIsoHeader}
                      onChange={e => setIncludeIsoHeader(e.target.checked)}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    Header Kontrol Dokumen ISO (Doc No & Rev)
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={includeStatsBar}
                      onChange={e => setIncludeStatsBar(e.target.checked)}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    Ringkasan KPI, Pass Rate & Cpk Target
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={includeGdtTable}
                      onChange={e => setIncludeGdtTable(e.target.checked)}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    Tabel Matriks Titik Ukur GD&T ({checkPoints.length} Poin)
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#f8fafc' }}>
                    <input
                      type="checkbox"
                      checked={includeSignatures}
                      onChange={e => setIncludeSignatures(e.target.checked)}
                      style={{ accentColor: '#8b5cf6' }}
                    />
                    Kolom Tanda Tangan Digital & Verifikasi QA
                  </label>
                </div>
              </div>

              {/* Action Buttons to Report Designer & PDF Sample */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleOpenInReportDesigner}
                  style={{
                    width: '100%',
                    padding: '11px',
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
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.4)'
                  }}
                  title="Otomatis buat template PDF & buka di Report Designer Studio"
                >
                  <ExternalLink size={15} /> Buka & Desain di Report Designer
                </button>

                <button
                  onClick={handlePrintSamplePDF}
                  style={{
                    width: '100%',
                    padding: '10px',
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #0284c7',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Printer size={15} /> Cetak / Download Sample PDF
                </button>

                <button
                  onClick={() => setCurrentStep(7)}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: '#10b981',
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
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
                    marginTop: '4px'
                  }}
                >
                  Lanjut ke Step 7: Deploy & Export <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 7: Export & Deploy ─── */}
          {currentStep === 7 && (
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
                    <span style={{ color: '#64748b' }}>Format Cetak:</span>
                    <div style={{ fontWeight: 700, color: '#8b5cf6' }}>{reportPaperSize} ({reportOrientation})</div>
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
          onMouseDown={currentStep !== 6 ? handleCanvasMouseDown : undefined}
          onMouseMove={currentStep !== 6 ? handleCanvasMouseMove : undefined}
          onMouseUp={currentStep !== 6 ? handleCanvasMouseUp : undefined}
          onMouseLeave={currentStep !== 6 ? handleCanvasMouseUp : undefined}
          style={{
            position: 'relative',
            backgroundColor: currentStep === 6 ? '#0b1120' : '#090d16',
            overflow: 'hidden',
            cursor: currentStep === 6 ? 'default' : isPanning ? 'grabbing' : isDragging ? 'move' : 'crosshair',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            padding: currentStep === 6 ? '30px 20px' : '0',
            userSelect: 'none'
          }}
        >
          {/* HUD Compact Vertical Floating Toolbar on Left Side of Canvas */}
          {currentStep !== 6 && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 30,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(10px)',
              padding: '6px 5px',
              borderRadius: '10px',
              border: '1px solid #334155',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
            }}>
              {/* Point Counter Badge */}
              <div 
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'default',
                  minWidth: '32px'
                }}
                title={`${checkPoints.length} Titik Ukur / Balon`}
              >
                <Target size={13} color="#a855f7" />
                <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#c084fc', marginTop: '1px' }}>
                  {checkPoints.length}
                </span>
              </div>

              <div style={{ width: '22px', height: '1px', backgroundColor: '#334155' }} />

              {/* Add Pin Mode Toggle */}
              <button
                onClick={() => setIsAddPinMode(!isAddPinMode)}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: isAddPinMode ? '#16a34a' : '#1e293b',
                  color: '#ffffff',
                  border: isAddPinMode ? '1.5px solid #22c55e' : '1px solid #475569',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isAddPinMode ? '0 0 12px rgba(34, 197, 94, 0.6)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title={isAddPinMode ? 'Mode Pin Aktif (Klik Canvas untuk Pin)' : 'Tambah Titik Balon (+ Pin)'}
              >
                <PlusCircle size={16} color={isAddPinMode ? '#ffffff' : '#22c55e'} />
              </button>

              {/* 🪄 1-Click Auto-Balloon Feature Extractor (Solid & Vibrant) */}
              <button
                onClick={handleOpenAutoBalloonStudio}
                disabled={isExtractingCAD}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: isExtractingCAD ? '#4c1d95' : '#7c3aed',
                  color: '#ffffff',
                  border: '1px solid #6d28d9',
                  borderRadius: '7px',
                  cursor: isExtractingCAD ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(124, 58, 237, 0.45)',
                  transition: 'all 0.15s ease'
                }}
                title={isExtractingCAD ? extractionStatusText || 'Mengekstrak dimensi...' : 'Auto-Balloon CAD & PDF (Ekstraksi Otomatis Dimensi)'}
                onMouseEnter={e => { if (!isExtractingCAD) e.currentTarget.style.backgroundColor = '#6d28d9'; }}
                onMouseLeave={e => { if (!isExtractingCAD) e.currentTarget.style.backgroundColor = '#7c3aed'; }}
              >
                {isExtractingCAD ? (
                  <RefreshCw size={15} color="#ffffff" className="animate-spin" />
                ) : (
                  <Sparkles size={16} color="#ffffff" />
                )}
              </button>

              {/* 📐 Auto-Align & Disperse Overlaps Button */}
              <button
                onClick={handleAutoDisperseBalloons}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: '#0284c7',
                  color: '#ffffff',
                  border: '1px solid #0369a1',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.45)',
                  transition: 'all 0.15s ease'
                }}
                title="Auto-Align (Rapikan Balon & Buat Leader Lines)"
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0369a1'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = '#0284c7'}
              >
                <Layers size={16} color="#ffffff" />
              </button>

              {/* 🔢 Smart Re-Number Dropdown Menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowRenumberMenu(!showRenumberMenu)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: '1px solid #475569',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s'
                  }}
                  title="Urutkan Ulang Nomor Balon (Re-Number)"
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#334155'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = '#1e293b'}
                >
                  <Hash size={16} color="#f59e0b" />
                </button>

                {showRenumberMenu && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: '38px',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '4px',
                    zIndex: 100,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '3px',
                    width: '160px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.7)'
                  }}>
                    <button
                      onClick={() => { handleSortClockwise(); setShowRenumberMenu(false); }}
                      style={{ padding: '7px 10px', textAlign: 'left', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🔄 Clockwise Sort
                    </button>
                    <button
                      onClick={() => { handleSortReadingOrder(); setShowRenumberMenu(false); }}
                      style={{ padding: '7px 10px', textAlign: 'left', background: 'none', border: 'none', color: '#f8fafc', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', borderRadius: '4px' }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#1e293b'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      ⬇️ Grid Reading Order
                    </button>
                  </div>
                )}
              </div>

              <div style={{ width: '22px', height: '1px', backgroundColor: '#334155' }} />

              {/* ⭐ QC Balloon Shape Selector (Compact 2x2 Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', backgroundColor: '#090d16', padding: '2px', borderRadius: '6px', border: '1px solid #1e293b' }}>
                <button
                  onClick={() => setDefaultBalloonShape('circle')}
                  title="Bulat (Dimensi Standar)"
                  style={{ width: '15px', height: '15px', borderRadius: '50%', border: defaultBalloonShape === 'circle' ? '1.5px solid #38bdf8' : '1px solid #475569', backgroundColor: defaultBalloonShape === 'circle' ? '#0284c7' : 'transparent', color: '#fff', fontSize: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ◯
                </button>
                <button
                  onClick={() => setDefaultBalloonShape('hexagon')}
                  title="Hexagon (Kritis / Cpk >= 1.67)"
                  style={{ width: '15px', height: '15px', border: defaultBalloonShape === 'hexagon' ? '1.5px solid #ef4444' : '1px solid #475569', backgroundColor: defaultBalloonShape === 'hexagon' ? '#dc2626' : 'transparent', color: '#fff', fontSize: '0.55rem', cursor: 'pointer', clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ⬡
                </button>
                <button
                  onClick={() => setDefaultBalloonShape('diamond')}
                  title="Diamond (Major Safety)"
                  style={{ width: '15px', height: '15px', border: defaultBalloonShape === 'diamond' ? '1.5px solid #f59e0b' : '1px solid #475569', backgroundColor: defaultBalloonShape === 'diamond' ? '#d97706' : 'transparent', color: '#fff', fontSize: '0.55rem', cursor: 'pointer', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ⬥
                </button>
                <button
                  onClick={() => setDefaultBalloonShape('square')}
                  title="Kotak (Pass/Fail Attribute)"
                  style={{ width: '15px', height: '15px', borderRadius: '2px', border: defaultBalloonShape === 'square' ? '1.5px solid #22c55e' : '1px solid #475569', backgroundColor: defaultBalloonShape === 'square' ? '#16a34a' : 'transparent', color: '#fff', fontSize: '0.55rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ▢
                </button>
              </div>

              {/* 🖍️ Drawing Markup & Annotation Mode Toggle */}
              <button
                onClick={() => {
                  const next = !isDrawingMode;
                  setIsDrawingMode(next);
                  if (next) setIsAddPinMode(false);
                  toast(next ? '🖍️ Mode Coretan & Anotasi Aktif' : 'Mode Coretan Dinonaktifkan', { icon: '✏️' });
                }}
                style={{
                  width: '32px',
                  height: '32px',
                  backgroundColor: isDrawingMode ? '#d97706' : '#1e293b',
                  color: '#ffffff',
                  border: isDrawingMode ? '1.5px solid #f59e0b' : '1px solid #475569',
                  borderRadius: '7px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: isDrawingMode ? '0 0 12px rgba(245, 158, 11, 0.5)' : 'none',
                  transition: 'all 0.15s ease'
                }}
                title="Alat Gambar & Anotasi Blueprint (Draw Tools)"
              >
                <Pencil size={15} color={isDrawingMode ? '#ffffff' : '#f59e0b'} />
              </button>

              <div style={{ width: '22px', height: '1px', backgroundColor: '#334155' }} />

              {/* Zoom Controls Vertical Group */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                backgroundColor: '#090d16',
                padding: '3px 2px',
                borderRadius: '6px',
                border: '1px solid #1e293b'
              }}>
                <button
                  onClick={() => setZoom(z => Math.min(3, z + 0.1))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Zoom In"
                >
                  <ZoomIn size={14} />
                </button>
                <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#8b5cf6', textAlign: 'center', padding: '1px 0' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Zoom Out"
                >
                  <ZoomOut size={14} />
                </button>
                <button
                  onClick={handleFitToScreen}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', padding: '2px', marginTop: '2px', borderTop: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Fit to Screen (Proporsional)"
                >
                  <Maximize2 size={13} />
                </button>
              </div>
            </div>
          )}

          {/* ─── LEFT FLOATING PALETTE: DRAW TOOLS (FOR CAD BLUEPRINT MARKUP & ANNOTATION) ─── */}
          {isDrawingMode && currentStep !== 6 && (
            <div
              style={{
                position: 'absolute',
                left: '56px',
                top: '12px',
                bottom: '16px',
                zIndex: 35,
                width: '108px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1.5px solid #334155',
                boxShadow: '0 16px 36px rgba(0,0,0,0.65)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                padding: '8px 6px',
                overflowY: 'auto',
                userSelect: 'none'
              }}
            >
              {/* Sidebar Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px 6px', borderBottom: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontSize: '0.66rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <Pencil size={11} /> Draw Tools
                </div>
                <button
                  onClick={() => setIsDrawingMode(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0', fontSize: '11px', lineHeight: 1 }}
                  title="Tutup Toolbar"
                >
                  ✕
                </button>
              </div>

              {/* Tools List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <button
                  onClick={() => setDrawingTool('pen')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'pen' ? '#22c55e' : 'transparent',
                    color: drawingTool === 'pen' ? '#ffffff' : '#94a3b8',
                    border: drawingTool === 'pen' ? '1px solid #22c55e' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Pen Bebas"
                >
                  <Pencil size={13} />
                  <span>Pen</span>
                </button>

                <button
                  onClick={() => setDrawingTool('marker')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'marker' ? '#f59e0b' : 'transparent',
                    color: drawingTool === 'marker' ? '#0f172a' : '#94a3b8',
                    border: drawingTool === 'marker' ? '1px solid #f59e0b' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Marker Tebal"
                >
                  <span style={{ fontSize: '12px' }}>🖍️</span>
                  <span>Marker</span>
                </button>

                <button
                  onClick={() => setDrawingTool('highlighter')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'highlighter' ? '#fcd34d' : 'transparent',
                    color: drawingTool === 'highlighter' ? '#0f172a' : '#94a3b8',
                    border: drawingTool === 'highlighter' ? '1px solid #fcd34d' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Stabilo Transparan"
                >
                  <Highlighter size={13} />
                  <span>Stabilo</span>
                </button>

                <button
                  onClick={() => setDrawingTool('arrow')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'arrow' ? '#38bdf8' : 'transparent',
                    color: drawingTool === 'arrow' ? '#0f172a' : '#94a3b8',
                    border: drawingTool === 'arrow' ? '1px solid #38bdf8' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Panah Dimensi"
                >
                  <ArrowUpRight size={13} />
                  <span>Panah</span>
                </button>

                <button
                  onClick={() => setDrawingTool('rect')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'rect' ? '#38bdf8' : 'transparent',
                    color: drawingTool === 'rect' ? '#0f172a' : '#94a3b8',
                    border: drawingTool === 'rect' ? '1px solid #38bdf8' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Kotak Area"
                >
                  <Square size={13} />
                  <span>Kotak</span>
                </button>

                <button
                  onClick={() => setDrawingTool('circle')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'circle' ? '#38bdf8' : 'transparent',
                    color: drawingTool === 'circle' ? '#0f172a' : '#94a3b8',
                    border: drawingTool === 'circle' ? '1px solid #38bdf8' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Lingkaran Defect"
                >
                  <Circle size={13} />
                  <span>Lingkaran</span>
                </button>

                <button
                  onClick={() => {
                    setDrawingTool('text');
                    toast('Klik canvas untuk meletakkan teks catatan', { icon: '✍️' });
                  }}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'text' ? '#a855f7' : 'transparent',
                    color: drawingTool === 'text' ? '#ffffff' : '#94a3b8',
                    border: drawingTool === 'text' ? '1px solid #a855f7' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Teks Catatan"
                >
                  <Type size={13} />
                  <span>Teks</span>
                </button>

                <button
                  onClick={() => { setDrawingTool('stamp'); setShowStampModal(true); }}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'stamp' ? '#8b5cf6' : 'transparent',
                    color: drawingTool === 'stamp' ? '#ffffff' : '#94a3b8',
                    border: drawingTool === 'stamp' ? '1px solid #8b5cf6' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Stamp QA"
                >
                  <span style={{ fontSize: '12px' }}>🏷️</span>
                  <span>Stamp</span>
                </button>

                <button
                  onClick={() => setDrawingTool('eraser')}
                  style={{
                    padding: '6px',
                    backgroundColor: drawingTool === 'eraser' ? '#ef4444' : 'transparent',
                    color: drawingTool === 'eraser' ? '#ffffff' : '#94a3b8',
                    border: drawingTool === 'eraser' ? '1px solid #ef4444' : '1px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Penghapus"
                >
                  <Eraser size={13} />
                  <span>Hapus</span>
                </button>
              </div>

              {/* Stroke Size Selector */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '6px', marginTop: '2px' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '3px' }}>
                  Tebal
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px' }}>
                  {DRAWING_SIZES.map(s => (
                    <button
                      key={s.size}
                      onClick={() => setDrawingSize(s.size)}
                      style={{
                        padding: '3px 2px',
                        backgroundColor: drawingSize === s.size ? '#0284c7' : '#1e293b',
                        color: drawingSize === s.size ? '#ffffff' : '#94a3b8',
                        border: drawingSize === s.size ? '1px solid #38bdf8' : '1px solid #334155',
                        borderRadius: '4px',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center'
                      }}
                    >
                      {s.size}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '6px' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                  Warna
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '4px' }}>
                  {DRAWING_COLORS.map(c => (
                    <div
                      key={c.color}
                      onClick={() => setDrawingColor(c.color)}
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        backgroundColor: c.color,
                        border: drawingColor === c.color ? '2px solid #ffffff' : '1.5px solid #334155',
                        cursor: 'pointer',
                        boxShadow: drawingColor === c.color ? '0 0 6px rgba(255,255,255,0.8)' : 'none',
                        margin: '0 auto',
                        transform: drawingColor === c.color ? 'scale(1.15)' : 'scale(1)',
                        transition: 'all 0.15s'
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              {/* History & Actions */}
              <div style={{ borderTop: '1px solid #334155', paddingTop: '6px', display: 'flex', gap: '3px', marginTop: 'auto' }}>
                <button
                  onClick={handleUndo}
                  disabled={drawings.length === 0}
                  style={{
                    flex: 1,
                    padding: '5px',
                    backgroundColor: '#1e293b',
                    color: drawings.length === 0 ? '#475569' : '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    cursor: drawings.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Undo"
                >
                  <Undo2 size={12} />
                </button>
                <button
                  onClick={handleRedo}
                  disabled={redoStack.length === 0}
                  style={{
                    flex: 1,
                    padding: '5px',
                    backgroundColor: '#1e293b',
                    color: redoStack.length === 0 ? '#475569' : '#f8fafc',
                    border: '1px solid #334155',
                    borderRadius: '4px',
                    cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Redo"
                >
                  <Redo2 size={12} />
                </button>
                <button
                  onClick={handleClearAllDrawings}
                  style={{
                    flex: 1,
                    padding: '5px',
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Hapus Semua Coretan"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          )}

          {/* ─── STEP 6: LIVE INTERACTIVE PHYSICAL CHECKSHEET PAPER MOCKUP ─── */}
          {currentStep === 6 ? (
            <div style={{
              width: reportOrientation === 'landscape' ? '920px' : '720px',
              minHeight: reportOrientation === 'landscape' ? '650px' : '980px',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '6px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)',
              padding: reportMargin === '5mm' ? '18px' : reportMargin === '15mm' ? '36px' : '26px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              fontFamily: 'Inter, system-ui, sans-serif',
              position: 'relative',
              transition: 'all 0.3s ease'
            }}>
              {/* Paper Badge Indicator Top Right */}
              <div style={{
                position: 'absolute',
                top: '-24px',
                right: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', border: '1px solid #334155' }}>
                  {reportPaperSize} • {reportOrientation.toUpperCase()}
                </span>
                <span>Standar ISO 9001:2015</span>
              </div>

              <div>
                {/* 1. ISO 9001 Header Banner */}
                {includeIsoHeader && (
                  <div style={{
                    backgroundColor: reportTheme === 'navy_modern' ? '#1e3a8a' : reportTheme === 'emerald_qa' ? '#065f46' : reportTheme === 'monochrome' ? '#1f2937' : '#4c1d95',
                    color: '#ffffff',
                    borderRadius: '4px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}>
                    <div>
                      <h2 style={{ fontSize: '1.05rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>
                        {(checkSheetName || partName || 'QC INSPECTION CHECKSHEET').toUpperCase()}
                      </h2>
                      <div style={{ fontSize: '0.68rem', opacity: 0.9, marginTop: '2px', fontWeight: 500 }}>
                        MANDOR MES — {qualityStandard} QUALITY ASSURANCE VERIFICATION
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', lineHeight: 1.3 }}>
                        <div style={{ fontWeight: 800 }}>DOC: {drawingNo || 'QA-CS-2026-08'}</div>
                        <div style={{ opacity: 0.85 }}>REV: {revisionNo || '1.0'} | {effectiveDate || '2026-08-23'}</div>
                      </div>
                      {includeQrCode && (
                        <div style={{ backgroundColor: '#ffffff', padding: '4px', borderRadius: '4px' }}>
                          <QRCode value={`https://mandor.online/doc/${partNo || 'ISO9001'}`} size={38} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Master Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: reportOrientation === 'landscape' ? 'repeat(4, 1fr)' : 'repeat(4, 1fr)',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '10px 12px',
                  fontSize: '0.72rem',
                  marginBottom: '14px'
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Part Number</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.8rem' }}>{partNo || 'PRT-FLG-450X'}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Part Name</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{partName || checkSheetName || 'Hydraulic Flange'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Customer</span>
                    <span style={{ color: '#0f172a' }}>{customer || 'AeroTech Dynamics Ltd.'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Tanggal Pengukuran</span>
                    <strong style={{ color: '#0284c7', fontSize: '0.75rem' }}>{new Date().toLocaleString()}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Station / Process</span>
                    <span style={{ color: '#0f172a' }}>{stationId} ({processName || 'CNC Line 2'})</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>QC Inspector</span>
                    <span style={{ color: '#0f172a' }}>{inspectorName || 'admin'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Approval Lead</span>
                    <span style={{ color: '#0f172a' }}>{approvedBy || 'Ahmad Setiawan'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>Standar Mutu</span>
                    <span style={{ color: '#059669', fontWeight: 700 }}>{qualityStandard || 'ISO 9001:2015'}</span>
                  </div>
                </div>

                {/* 3. Summary Statistics Bar */}
                {includeStatsBar && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '6px',
                    marginBottom: '14px'
                  }}>
                    <div style={{ backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.58rem', color: '#64748b', fontWeight: 700 }}>TOTAL TITIK UKUR</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0f172a' }}>{checkPoints.length} Poin</div>
                    </div>
                    <div style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.58rem', color: '#047857', fontWeight: 700 }}>STATUS DISPOSISI</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>APPROVED (PASS)</div>
                    </div>
                    <div style={{ backgroundColor: '#f5f3ff', border: '1px solid #ddd6fe', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.58rem', color: '#6d28d9', fontWeight: 700 }}>TARGET CPK</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#7c3aed' }}>1.67 (Min 1.33)</div>
                    </div>
                    <div style={{ backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '0.58rem', color: '#0369a1', fontWeight: 700 }}>PASS RATE</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#0284c7' }}>100.0%</div>
                    </div>
                  </div>
                )}

                {/* 4. Dynamic Parameter & GD&T Inspection Matrix Table */}
                {includeGdtTable && (
                  <div style={{ marginBottom: '14px', border: '1px solid #cbd5e1', borderRadius: '4px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.68rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{
                          backgroundColor: reportTheme === 'navy_modern' ? '#1e3a8a' : reportTheme === 'emerald_qa' ? '#065f46' : reportTheme === 'monochrome' ? '#1f2937' : '#4c1d95',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.62rem',
                          textTransform: 'uppercase'
                        }}>
                          <th style={{ padding: '6px 8px', width: '30px' }}>#</th>
                          <th style={{ padding: '6px 8px' }}>Parameter Ukur</th>
                          <th style={{ padding: '6px 8px' }}>Kategori</th>
                          <th style={{ padding: '6px 8px' }}>Nominal</th>
                          <th style={{ padding: '6px 8px' }}>Toleransi (Min / Max)</th>
                          <th style={{ padding: '6px 8px' }}>Hasil Ukur</th>
                          <th style={{ padding: '6px 8px' }}>Criticality</th>
                          <th style={{ padding: '6px 8px', textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkPoints.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
                              Belum ada parameter titik ukur yang ditambahkan di Step 3.
                            </td>
                          </tr>
                        ) : (
                          checkPoints.map((pt, idx) => (
                            <tr key={idx} style={{
                              backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc',
                              borderBottom: '1px solid #e2e8f0'
                            }}>
                              <td style={{ padding: '6px 8px', fontWeight: 800, color: '#475569' }}>{pt.pointNumber || idx + 1}</td>
                              <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f172a' }}>{pt.title}</td>
                              <td style={{ padding: '6px 8px', color: '#64748b' }}>{pt.category || 'Linear Dimension'}</td>
                              <td style={{ padding: '6px 8px', fontWeight: 700, color: '#0f172a', fontFamily: 'monospace' }}>
                                {pt.nominal} {pt.unit || 'mm'}
                              </td>
                              <td style={{ padding: '6px 8px', color: '#4338ca', fontFamily: 'monospace' }}>
                                {pt.tolMin !== undefined ? `${pt.tolMin} - ${pt.tolMax}` : '±0.05'}
                              </td>
                              <td style={{ padding: '6px 8px', fontWeight: 800, color: '#059669', fontFamily: 'monospace' }}>
                                {pt.nominal ? `${pt.nominal} ${pt.unit || 'mm'}` : '-'}
                              </td>
                              <td style={{ padding: '6px 8px' }}>
                                <span style={{
                                  fontSize: '0.58rem',
                                  fontWeight: 800,
                                  padding: '1px 5px',
                                  borderRadius: '3px',
                                  backgroundColor: pt.criticality?.includes('Critical') ? '#fee2e2' : '#f1f5f9',
                                  color: pt.criticality?.includes('Critical') ? '#dc2626' : '#475569'
                                }}>
                                  {pt.criticality || 'Major'}
                                </span>
                              </td>
                              <td style={{ padding: '6px 8px', textAlign: 'center' }}>
                                <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 900, fontSize: '0.62rem', padding: '1px 6px', borderRadius: '3px' }}>
                                  OK
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* 5. ISO Signature & Approval Blocks */}
              {includeSignatures && (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  borderTop: '1px solid #cbd5e1',
                  paddingTop: '12px',
                  marginTop: '12px'
                }}>
                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>INSPECTOR (OPERATOR)</div>
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontWeight: 800, fontSize: '0.75rem' }}>
                      ✓ {inspectorName || 'Budi Santoso'}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '2px' }}>
                      Tanda Tangan & Tanggal
                    </div>
                  </div>

                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>QA / QC SUPERVISOR</div>
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4338ca', fontWeight: 800, fontSize: '0.75rem' }}>
                      ✓ {approvedBy || 'Ahmad Setiawan'}
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '2px' }}>
                      Disetujui QA Management
                    </div>
                  </div>

                  <div style={{ border: '1px dashed #cbd5e1', borderRadius: '4px', padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.6rem', color: '#64748b', fontWeight: 700 }}>PRODUCTION LEADER</div>
                    <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontWeight: 800, fontSize: '0.75rem' }}>
                      ✓ Handover Verified
                    </div>
                    <div style={{ fontSize: '0.55rem', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '2px' }}>
                      Diterima Line Produksi
                    </div>
                  </div>
                </div>
              )}

              {/* 6. Footer ISO Watermark */}
              <div style={{
                textAlign: 'center',
                fontSize: '0.55rem',
                color: '#94a3b8',
                marginTop: '10px',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '4px'
              }}>
                MANDOR MES QUALITY REPORT ENGINE • ISO 9001:2015 AUDITED CHECKSHEET • GENERATED {new Date().toLocaleDateString()}
              </div>
            </div>
          ) : (
            /* Standard CAD Blueprint Canvas for Steps 1-5 & 7 */
            <div
              ref={canvasContentRef}
              onDoubleClick={handleCanvasDoubleClick}
              onMouseMove={(e) => {
                if (isDragging && draggedPointId) {
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  setCheckPoints(prev => prev.map(pt => {
                    if (pt.id === draggedPointId) {
                      const targetX = pt.targetX !== undefined ? pt.targetX : pt.x;
                      const targetY = pt.targetY !== undefined ? pt.targetY : pt.y;
                      const zone = calculateDrawingZone(coords.x, coords.y, 980, 680);
                      return { ...pt, x: coords.x, y: coords.y, targetX, targetY, zone };
                    }
                    return pt;
                  }));
                } else if (isAddPinMode) {
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  setHoverCoords(coords);
                }
              }}
              onMouseUp={() => {
                if (isDragging) {
                  setIsDragging(false);
                  setDraggedPointId(null);
                }
              }}
              onMouseLeave={() => {
                if (hoverCoords) setHoverCoords(null);
                if (isDragging) {
                  setIsDragging(false);
                  setDraggedPointId(null);
                }
              }}
              onClick={(e) => {
                if (isAddPinMode) {
                  e.stopPropagation();
                  const coords = getCanvasCoords(e.clientX, e.clientY);
                  const newPoint = createDefaultCheckPoint(
                    checkPoints.length + 1,
                    coords.x,
                    coords.y,
                    defaultBalloonShape
                  );
                  setCheckPoints(prev => [...prev, newPoint]);
                  setActivePointId(newPoint.id);
                  setCurrentStep(3);
                  toast.success(`Titik ukur #${newPoint.pointNumber} (${newPoint.shape || 'circle'}) diletakkan di (${coords.x}, ${coords.y}) - Zone ${newPoint.zone}`);
                  setIsAddPinMode(false);
                  setHoverCoords(null);
                }
              }}
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: 'center center',
                position: 'relative',
                width: '1000px',
                height: '700px',
                backgroundColor: 'white',
                boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                borderRadius: '4px',
                margin: 'auto',
                flexShrink: 0,
                cursor: isAddPinMode ? 'crosshair' : 'default',
                transition: isPanning || isDragging ? 'none' : 'transform 0.12s ease-out'
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

              {/* ─── REAL-TIME PRECISION RED LASER CROSSHAIR & TARGET RETICLE OVERLAY ─── */}
              {isAddPinMode && hoverCoords && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}>
                  {/* Vertical Red Laser Guide Line (Ultra-Vibrant Ruby Beam) */}
                  <div style={{
                    position: 'absolute',
                    left: `${hoverCoords.x}px`,
                    top: 0,
                    bottom: 0,
                    width: '2px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 3px #ffffff, 0 0 8px #ff0055, 0 0 16px #ef4444, 0 0 28px #dc2626, 0 0 50px #991b1b',
                    opacity: 1,
                    transform: 'translateX(-50%)'
                  }} />
                  {/* Horizontal Red Laser Guide Line (Ultra-Vibrant Ruby Beam) */}
                  <div style={{
                    position: 'absolute',
                    top: `${hoverCoords.y}px`,
                    left: 0,
                    right: 0,
                    height: '2px',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 3px #ffffff, 0 0 8px #ff0055, 0 0 16px #ef4444, 0 0 28px #dc2626, 0 0 50px #991b1b',
                    opacity: 1,
                    transform: 'translateY(-50%)'
                  }} />

                  {/* Target Reticle Red Laser Glow Ring */}
                  <div style={{
                    position: 'absolute',
                    left: `${hoverCoords.x}px`,
                    top: `${hoverCoords.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    border: '2.5px dashed #ff0055',
                    boxShadow: '0 0 16px #ff0055, inset 0 0 12px rgba(255, 0, 85, 0.6), 0 0 30px rgba(220, 38, 38, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'spin 12s linear infinite'
                  }}>
                  </div>

                  {/* Center Intense Ruby Laser Focal Point */}
                  <div style={{
                    position: 'absolute',
                    left: `${hoverCoords.x}px`,
                    top: `${hoverCoords.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    border: '2px solid #ff0055',
                    boxShadow: '0 0 8px #ff0055, 0 0 20px #ff0055, 0 0 35px #dc2626'
                  }} />

                  {/* Ghost Next Pin Preview */}
                  <div style={{
                    position: 'absolute',
                    left: `${hoverCoords.x}px`,
                    top: `${hoverCoords.y}px`,
                    transform: 'translate(-50%, -50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: '2px solid #ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '0.75rem',
                    opacity: 0.9,
                    boxShadow: '0 0 16px #ff0055, 0 4px 10px rgba(0,0,0,0.5)'
                  }}>
                    {checkPoints.length + 1}
                  </div>

                  {/* Real-time Coordinates HUD Red Laser Tag (with Auto Zone) */}
                  <div style={{
                    position: 'absolute',
                    left: `${Math.min(hoverCoords.x + 24, 860)}px`,
                    top: `${Math.max(hoverCoords.y - 32, 10)}px`,
                    backgroundColor: 'rgba(20, 5, 10, 0.95)',
                    color: '#ff2a5f',
                    padding: '4px 10px',
                    borderRadius: '5px',
                    fontSize: '0.68rem',
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    boxShadow: '0 0 15px rgba(255, 0, 85, 0.5), 0 4px 16px rgba(0,0,0,0.7)',
                    border: '1.5px solid #ff0055',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <span>🎯 X: {hoverCoords.x}px • Y: {hoverCoords.y}px</span>
                    <span style={{ backgroundColor: '#ff0055', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontSize: '0.62rem' }}>
                      Zone: {calculateDrawingZone(hoverCoords.x, hoverCoords.y, 980, 680)}
                    </span>
                  </div>

                  {/* 🔬 Micro-Loupe Magnifier (2.5x High-Precision Zoom Lens) */}
                  {enableMicroLoupe && drawingPreview && (
                    <div style={{
                      position: 'absolute',
                      left: `${Math.min(hoverCoords.x + 35, 820)}px`,
                      top: `${Math.max(hoverCoords.y - 120, 10)}px`,
                      width: '105px',
                      height: '105px',
                      borderRadius: '50%',
                      border: '3px solid #ff0055',
                      boxShadow: '0 0 22px rgba(255, 0, 85, 0.6), 0 8px 24px rgba(0,0,0,0.7)',
                      backgroundColor: '#ffffff',
                      overflow: 'hidden',
                      zIndex: 50,
                      pointerEvents: 'none'
                    }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: `${-hoverCoords.x * 2.5 + 52}px`,
                          top: `${-hoverCoords.y * 2.5 + 52}px`,
                          transform: 'scale(2.5)',
                          transformOrigin: '0 0',
                          pointerEvents: 'none'
                        }}
                        dangerouslySetInnerHTML={{ __html: drawingPreview }}
                      />
                      {/* Loupe Laser Reticle */}
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: '100%', height: '1.5px', backgroundColor: 'rgba(255, 0, 85, 0.8)' }} />
                        <div style={{ height: '100%', width: '1.5px', backgroundColor: 'rgba(255, 0, 85, 0.8)', position: 'absolute' }} />
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #ff0055', position: 'absolute' }} />
                      </div>
                      <span style={{ position: 'absolute', bottom: '4px', right: '12px', fontSize: '0.55rem', fontWeight: 900, color: '#ff0055', backgroundColor: 'rgba(255,255,255,0.9)', padding: '1px 4px', borderRadius: '3px' }}>2.5×</span>
                    </div>
                  )}
                </div>
              )}

              {/* ─── LEADER LINES & POINTER ARROWS SVG LAYER ─────────────── */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 12 }}>
                <defs>
                  <marker id="leader-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff0055" />
                  </marker>
                </defs>
                {checkPoints.map(pt => {
                  if (pt.targetX !== undefined && pt.targetY !== undefined && (Math.abs(pt.targetX - pt.x) > 10 || Math.abs(pt.targetY - pt.y) > 10)) {
                    return (
                      <g key={`leader_${pt.id}`}>
                        <line
                          x1={pt.x}
                          y1={pt.y}
                          x2={pt.targetX}
                          y2={pt.targetY}
                          stroke={pt.criticality?.includes('Critical') ? '#dc2626' : '#0284c7'}
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          markerEnd="url(#leader-arrow)"
                        />
                        <circle cx={pt.targetX} cy={pt.targetY} r="4" fill="#ff0055" stroke="#ffffff" strokeWidth="1.5" />
                      </g>
                    );
                  }
                  return null;
                })}
              </svg>
              
              {/* Check Point Pins (with Geometrical QC Shapes) */}
              {checkPoints.map(point => {
                const isActive = point.id === activePointId;
                const isBeingDragged = isDragging && draggedPointId === point.id;
                const pinSize = isActive ? 36 : 28;
                const isHexagon = point.shape === 'hexagon' || point.criticality?.includes('Critical');
                const isDiamond = point.shape === 'diamond' || point.criticality?.includes('Major');
                const isSquare = point.shape === 'square';

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
                      width: `${pinSize}px`,
                      height: `${pinSize}px`,
                      transform: 'translate(-50%, -50%)',
                      cursor: isBeingDragged ? 'grabbing' : 'grab',
                      zIndex: isActive ? 25 : 15,
                      userSelect: 'none',
                      touchAction: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {/* Pulse Ring */}
                    <div style={{
                      position: 'absolute',
                      inset: '-10px',
                      borderRadius: isSquare ? '6px' : '50%',
                      backgroundColor: isHexagon ? '#dc2626' : isDiamond ? '#d97706' : getCategoryColor(point.category),
                      opacity: isActive ? 0.4 : 0.2,
                      animation: 'pulse 2s infinite',
                      pointerEvents: 'none'
                    }} />
                    
                    {/* Pin Geometrical Shape */}
                    <div style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: isSquare ? '4px' : isHexagon || isDiamond ? '0' : '50%',
                      clipPath: isHexagon
                        ? 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)'
                        : isDiamond
                        ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                        : 'none',
                      backgroundColor: isHexagon ? '#dc2626' : isDiamond ? '#d97706' : isSquare ? '#16a34a' : getCategoryColor(point.category),
                      color: 'white',
                      border: isHexagon || isDiamond ? 'none' : '3px solid white',
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
                        top: `${pinSize + 6}px`,
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
                        zIndex: 30,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <span>{point.title}</span>
                          <span style={{ fontSize: '0.58rem', backgroundColor: '#38bdf8', color: '#0f172a', padding: '1px 4px', borderRadius: '3px', fontWeight: 800 }}>
                            Zone: {point.zone || calculateDrawingZone(point.x, point.y, 980, 680)}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#94a3b8' }}>
                          {point.nominal} {point.unit} ({point.criticality || 'Standard'})
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Placed QA Stamps */}
              {stamps.map(st => (
                <div
                  key={st.id}
                  style={{
                    position: 'absolute',
                    left: `${st.x}px`,
                    top: `${st.y}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: 22,
                    pointerEvents: isDrawingMode && drawingTool === 'eraser' ? 'auto' : 'none',
                    cursor: isDrawingMode && drawingTool === 'eraser' ? 'pointer' : 'default'
                  }}
                  onClick={() => {
                    if (isDrawingMode && drawingTool === 'eraser') {
                      setStamps(prev => prev.filter(s => s.id !== st.id));
                      toast('Stamp dihapus', { icon: '🗑️' });
                    }
                  }}
                >
                  <div
                    style={{
                      transform: 'rotate(-12deg)',
                      border: `2px dashed ${st.border}`,
                      backgroundColor: st.bg,
                      color: st.color,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontWeight: 900,
                      fontSize: '0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <span>{st.icon}</span>
                    <span>{st.label}</span>
                    <span style={{ fontSize: '0.5rem', opacity: 0.8 }}>{st.date}</span>
                  </div>
                </div>
              ))}

              {/* Drawing Canvas Layer - Annotation Overlay */}
              <svg
                ref={drawingCanvasRef}
                viewBox="0 0 1000 700"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: isDrawingMode ? 'all' : 'none',
                  cursor: isDrawingMode
                    ? drawingTool === 'eraser'
                      ? 'cell'
                      : drawingTool === 'text'
                      ? 'text'
                      : drawingTool === 'stamp'
                      ? 'copy'
                      : 'crosshair'
                    : 'default',
                  zIndex: 28,
                  touchAction: 'none'
                }}
                onMouseDown={handleDrawStart}
                onMouseMove={handleDrawMove}
                onMouseUp={handleDrawEnd}
                onMouseLeave={handleDrawEnd}
                onTouchStart={handleDrawStart}
                onTouchMove={handleDrawMove}
                onTouchEnd={handleDrawEnd}
              >
                <defs>
                  <marker
                    id="designer-arrowhead"
                    markerUnits="userSpaceOnUse"
                    markerWidth="12"
                    markerHeight="12"
                    refX="10"
                    refY="6"
                    orient="auto"
                  >
                    <path d="M 0 1 L 10 6 L 0 11 Z" fill={drawingColor} />
                  </marker>
                </defs>

                {/* Saved Shapes & Strokes */}
                {drawings.map((shape) => {
                  if (shape.type === 'pen' || shape.type === 'marker' || shape.type === 'highlighter') {
                    if (!shape.points || shape.points.length < 2) return null;
                    const pathData = shape.points.reduce(
                      (acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`,
                      ''
                    );
                    return (
                      <path
                        key={shape.id}
                        d={pathData}
                        fill="none"
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={shape.opacity || 1}
                      />
                    );
                  }
                  if (shape.type === 'arrow') {
                    return (
                      <line
                        key={shape.id}
                        x1={shape.x1}
                        y1={shape.y1}
                        x2={shape.x2}
                        y2={shape.y2}
                        stroke={shape.color}
                        strokeWidth={shape.size}
                        markerEnd="url(#designer-arrowhead)"
                      />
                    );
                  }
                  if (shape.type === 'rect') {
                    return (
                      <rect
                        key={shape.id}
                        x={shape.x}
                        y={shape.y}
                        width={shape.w}
                        height={shape.h}
                        fill="none"
                        stroke={shape.color}
                        strokeWidth={shape.size}
                      />
                    );
                  }
                  if (shape.type === 'circle') {
                    return (
                      <circle
                        key={shape.id}
                        cx={shape.cx}
                        cy={shape.cy}
                        r={shape.r}
                        fill="none"
                        stroke={shape.color}
                        strokeWidth={shape.size}
                      />
                    );
                  }
                  if (shape.type === 'text') {
                    return (
                      <text
                        key={shape.id}
                        x={shape.x}
                        y={shape.y}
                        fill={shape.color}
                        fontSize={shape.fontSize || 14}
                        fontWeight="700"
                        fontFamily="sans-serif"
                      >
                        {shape.text}
                      </text>
                    );
                  }
                  return null;
                })}

                {/* Active in-progress stroke */}
                {isDrawing && currentStroke.length > 1 && (
                  <path
                    d={currentStroke.reduce((acc, pt, i) => i === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`, '')}
                    fill="none"
                    stroke={drawingColor}
                    strokeWidth={drawingSize}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={drawingTool === 'highlighter' ? 0.35 : drawingTool === 'marker' ? 0.85 : 1}
                  />
                )}

                {/* Active shape preview */}
                {isDrawing && shapeStart && shapeCurrent && drawingTool === 'rect' && (
                  <rect
                    x={Math.min(shapeStart.x, shapeCurrent.x)}
                    y={Math.min(shapeStart.y, shapeCurrent.y)}
                    width={Math.abs(shapeCurrent.x - shapeStart.x)}
                    height={Math.abs(shapeCurrent.y - shapeStart.y)}
                    fill="none"
                    stroke={drawingColor}
                    strokeWidth={drawingSize}
                    strokeDasharray="4 4"
                  />
                )}

                {isDrawing && shapeStart && shapeCurrent && drawingTool === 'circle' && (
                  <circle
                    cx={shapeStart.x}
                    cy={shapeStart.y}
                    r={Math.hypot(shapeCurrent.x - shapeStart.x, shapeCurrent.y - shapeStart.y)}
                    fill="none"
                    stroke={drawingColor}
                    strokeWidth={drawingSize}
                    strokeDasharray="4 4"
                  />
                )}

                {isDrawing && shapeStart && shapeCurrent && drawingTool === 'arrow' && (
                  <line
                    x1={shapeStart.x}
                    y1={shapeStart.y}
                    x2={shapeCurrent.x}
                    y2={shapeCurrent.y}
                    stroke={drawingColor}
                    strokeWidth={drawingSize}
                    strokeDasharray="4 4"
                  />
                )}
              </svg>
            </div>
          )}
        </div>

        {/* ─── RIGHT PANEL: Properties Editor / Report Schema Inspector ─── */}
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
              {currentStep === 6 ? 'Report Schema & Data Binding' : activePoint ? 'Edit Point #' + activePoint.pointNumber : 'Point Properties'}
            </span>
          </div>
          
          {currentStep === 6 ? (
            <div style={{ flex: 1, overflow: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* PDFME Engine Schema Status */}
              <div style={{
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={13} /> Schema Ready
                  </span>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', backgroundColor: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>
                    PDFME Engine v5.2
                  </span>
                </div>
                <p style={{ fontSize: '0.68rem', color: '#cbd5e1', margin: 0 }}>
                  Semua parameter drawing, toleransi GD&T, dan master data part telah terikat otomatis ke schema PDF Report Designer.
                </p>
              </div>

              {/* Data Binding Variable Attributes */}
              <div>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#a78bfa', display: 'block', marginBottom: '8px' }}>
                  Variabel Terhubung (Bound Variables):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                  {[
                    { key: 'doc_id', label: 'Document Number', val: drawingNo || 'QA-CS-2026' },
                    { key: 'part_no_value', label: 'Part Number', val: partNo || '-' },
                    { key: 'part_name_value', label: 'Part Name', val: partName || '-' },
                    { key: 'customer_value', label: 'Customer', val: customer || '-' },
                    { key: 'date_time_value', label: 'Tanggal Ukur', val: new Date().toLocaleString() },
                    { key: 'station_value', label: 'Station ID', val: stationId },
                    { key: 'inspector_value', label: 'Inspector', val: inspectorName || 'QA Lead' },
                    { key: 'inspection_table', label: 'Table Matrix', val: `${checkPoints.length} baris parameter` }
                  ].map(v => (
                    <div key={v.key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#090d16',
                      padding: '6px 8px',
                      borderRadius: '4px',
                      border: '1px solid #1e293b'
                    }}>
                      <span style={{ color: '#94a3b8', fontFamily: 'monospace' }}>{v.key}</span>
                      <strong style={{ color: '#38bdf8' }}>{v.val}</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deep Link Button to Studio */}
              <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  onClick={handleOpenInReportDesigner}
                  style={{
                    width: '100%',
                    padding: '11px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                  }}
                >
                  <ExternalLink size={14} /> Buka di Report Designer Studio
                </button>
              </div>
            </div>
          ) : activePoint ? (
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                  {PARAM_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => {
                        handleUpdatePoint('category', cat.key);
                        if (cat.key === 'visual') {
                          handleUpdatePoint('inspectionMethod', 'Visual Limit Sample');
                          handleUpdatePoint('shape', 'square');
                        }
                      }}
                      style={{
                        padding: '6px 4px',
                        backgroundColor: (activePoint.category === cat.key || activePoint.category?.toLowerCase() === cat.key.toLowerCase() || activePoint.category === cat.label) ? cat.color : '#1e293b',
                        color: 'white',
                        border: (activePoint.category === cat.key || activePoint.category?.toLowerCase() === cat.key.toLowerCase() || activePoint.category === cat.label) ? '1.5px solid #ffffff' : '1px solid #334155',
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
                      <span style={{ fontSize: '0.58rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ════════════════════════════════════════════════════════════════
                  VISUAL LIMIT SAMPLE & DEFECT STANDARD CONFIGURATION
                  ════════════════════════════════════════════════════════════════ */}
              {(activePoint.category === 'visual' || activePoint.category?.toLowerCase().includes('visual') || activePoint.inspectionMethod?.includes('Visual')) ? (
                <div style={{ backgroundColor: '#090d16', border: '1.5px solid #10b981', borderRadius: '8px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 900, color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      👁️ Visual Limit Sample Standard
                    </span>
                    <span style={{ fontSize: '0.6rem', color: '#a7f3d0', backgroundColor: 'rgba(16,185,129,0.2)', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                      ISO 9001: 8.5.1
                    </span>
                  </div>

                  {/* Defect Classification Tag */}
                  <div>
                    <label style={{ fontSize: '0.62rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '3px' }}>
                      Jenis Cacat (Defect Classification):
                    </label>
                    <select
                      value={activePoint.defectTag || 'Scratch / Goresan'}
                      onChange={e => handleUpdatePoint('defectTag', e.target.value)}
                      style={{ width: '100%', padding: '6px 8px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#38bdf8', fontSize: '0.74rem', fontWeight: 700, outline: 'none' }}
                    >
                      <option value="Scratch / Goresan">Scratch / Goresan</option>
                      <option value="Painting / Cat Belang">Painting / Cat Belang (Orange Peel)</option>
                      <option value="Burr / Ketajaman">Burr / Ketajaman Sisa Mesin</option>
                      <option value="Pinhole / Porosi">Pinhole / Porosi Coran</option>
                      <option value="Dent / Penyok">Dent / Penyok Benturan</option>
                      <option value="Weld Bead">Weld Bead / Sambungan Las</option>
                    </select>
                  </div>

                  {/* 1. Golden Sample Photo & Spec */}
                  <div style={{ backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px', border: '1px solid #166534' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#22c55e', display: 'block', marginBottom: '3px' }}>
                      🟢 1. Golden Sample (Kondisi Sempurna OK)
                    </span>
                    <input
                      type="text"
                      placeholder="Spesifikasi (cth: Permukaan mulus, cat rata, bebas cacat)"
                      value={activePoint.goldenSpec || ''}
                      onChange={e => handleUpdatePoint('goldenSpec', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '0.68rem', outline: 'none', marginBottom: '4px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activePoint.goldenSampleImg ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={activePoint.goldenSampleImg} alt="Golden" style={{ width: '22px', height: '22px', borderRadius: '3px', objectFit: 'cover' }} />
                          <button onClick={() => handleUpdatePoint('goldenSampleImg', null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      ) : (
                        <label style={{ padding: '2px 6px', backgroundColor: '#1e293b', color: '#22c55e', border: '1px solid #166534', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Upload size={10} /> Upload Foto Golden
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = ev => handleUpdatePoint('goldenSampleImg', ev.target.result);
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* 2. Limit Sample Boundary Photo & Spec */}
                  <div style={{ backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px', border: '1px solid #854d0e' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#f59e0b', display: 'block', marginBottom: '3px' }}>
                      🟡 2. Limit Sample (Batas Maksimal Toleransi)
                    </span>
                    <input
                      type="text"
                      placeholder="Batas batas toleransi (cth: Scratch halus ≤ 2mm, pinhole ≤ 0.3mm)"
                      value={activePoint.limitSpec || ''}
                      onChange={e => handleUpdatePoint('limitSpec', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '0.68rem', outline: 'none', marginBottom: '4px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activePoint.limitSampleImg ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={activePoint.limitSampleImg} alt="Limit" style={{ width: '22px', height: '22px', borderRadius: '3px', objectFit: 'cover' }} />
                          <button onClick={() => handleUpdatePoint('limitSampleImg', null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      ) : (
                        <label style={{ padding: '2px 6px', backgroundColor: '#1e293b', color: '#f59e0b', border: '1px solid #854d0e', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Upload size={10} /> Upload Foto Limit Sample
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = ev => handleUpdatePoint('limitSampleImg', ev.target.result);
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* 3. Reject Sample Photo & Spec */}
                  <div style={{ backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px', border: '1px solid #991b1b' }}>
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#ef4444', display: 'block', marginBottom: '3px' }}>
                      🔴 3. Reject Sample (Contoh Cacat Ditolak)
                    </span>
                    <input
                      type="text"
                      placeholder="Kriteria tolak (cth: Scratch > 2mm / terasa kuku, cat meleleh)"
                      value={activePoint.rejectSpec || ''}
                      onChange={e => handleUpdatePoint('rejectSpec', e.target.value)}
                      style={{ width: '100%', padding: '4px 6px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px', color: '#f8fafc', fontSize: '0.68rem', outline: 'none', marginBottom: '4px' }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {activePoint.rejectSampleImg ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <img src={activePoint.rejectSampleImg} alt="Reject" style={{ width: '22px', height: '22px', borderRadius: '3px', objectFit: 'cover' }} />
                          <button onClick={() => handleUpdatePoint('rejectSampleImg', null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.6rem', cursor: 'pointer' }}>Hapus</button>
                        </div>
                      ) : (
                        <label style={{ padding: '2px 6px', backgroundColor: '#1e293b', color: '#ef4444', border: '1px solid #991b1b', borderRadius: '3px', fontSize: '0.62rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Upload size={10} /> Upload Foto Reject
                          <input type="file" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const r = new FileReader();
                              r.onload = ev => handleUpdatePoint('rejectSampleImg', ev.target.result);
                              r.readAsDataURL(file);
                            }
                          }} style={{ display: 'none' }} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* Nominal & Tolerance (For Numerical Dimensions) */
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
              )}
              
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

      {/* ─── OPEN PROJECT MODAL ─── */}
      {showOpenProjectModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(4px)'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowOpenProjectModal(false); }}
        >
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '16px',
            width: '720px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px',
                  backgroundColor: '#0ea5e9',
                  borderRadius: '8px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <FolderOpen size={18} color="white" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
                    Open Project
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    Pilih template checksheet untuk dimuat
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowOpenProjectModal(false)}
                style={{
                  width: '32px', height: '32px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#94a3b8'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px 12px'
              }}>
                <Search size={14} color="#64748b" />
                <input
                  type="text"
                  placeholder="Cari nama template, part no, atau customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    backgroundColor: 'transparent',
                    border: 'none', outline: 'none',
                    color: '#f8fafc', fontSize: '0.8rem',
                    flex: 1
                  }}
                />
              </div>
            </div>

            {/* Project List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              {savedTemplates.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '40px 20px', color: '#64748b', textAlign: 'center'
                }}>
                  <FileSpreadsheet size={40} color="#334155" />
                  <div style={{ marginTop: '12px', fontWeight: 700, color: '#475569' }}>
                    Tidak ada project tersimpan
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#334155', marginTop: '4px' }}>
                    Simpan template terlebih dahulu menggunakan tombol Save
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {savedTemplates
                    .filter(t => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (t.name || '').toLowerCase().includes(q) ||
                             (t.partNo || '').toLowerCase().includes(q) ||
                             (t.customer || '').toLowerCase().includes(q) ||
                             (t.docNo || '').toLowerCase().includes(q);
                    })
                    .map(template => (
                      <div
                        key={template.id}
                        onClick={() => {
                          // Load template into editor state
                          setCheckSheetName(template.name || '');
                          setPartNo(template.partNo || '');
                          setPartName(template.partName || '');
                          setCustomer(template.customer || '');
                          setProcessName(template.processName || '');
                          setDrawingNo(template.drawingNo || '');
                          setRevisionNo(template.revisionNo || template.revision || 'A');
                          setEffectiveDate(template.effectiveDate || '');
                          setNextReviewDate(template.nextReviewDate || '');
                          setInspectorName(template.inspectorName || '');
                          setApprovedBy(template.approvedBy || '');
                          setQualityStandard(template.qualityStandard || 'ISO 9001:2015');
                          setCheckSheetStatus(template.status || 'draft');
                          setCheckPoints(template.checkPoints || []);
                          setCheckSheetDescription(template.description || '');
                          if (template.drawingSvg) setDrawingPreview(template.drawingSvg);
                          setSelectedDrawing(template.drawingId ? { id: template.drawingId, name: template.drawingName } : null);
                          setShowOpenProjectModal(false);
                          setSearchQuery('');
                          toast.success(`Project "${template.name}" dimuat!`);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          padding: '12px 14px',
                          backgroundColor: selectedTemplateId === template.id ? '#1e293b' : '#0f172a',
                          border: `1px solid ${selectedTemplateId === template.id ? '#6366f1' : '#1e293b'}`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={e => {
                          if (selectedTemplateId !== template.id) {
                            e.currentTarget.style.backgroundColor = '#1e293b';
                            e.currentTarget.style.borderColor = '#334155';
                          }
                        }}
                        onMouseLeave={e => {
                          if (selectedTemplateId !== template.id) {
                            e.currentTarget.style.backgroundColor = '#0f172a';
                            e.currentTarget.style.borderColor = '#1e293b';
                          }
                        }}
                      >
                        {/* Status dot */}
                        <div style={{
                          width: '10px', height: '10px',
                          borderRadius: '50%',
                          backgroundColor:
                            template.status === 'approved' || template.status === 'APPROVED' ? '#22c55e' :
                            template.status === 'released' || template.status === 'RELEASED' ? '#3b82f6' :
                            template.status === 'pending_approval' || template.status === 'IN_REVIEW' ? '#f59e0b' : '#64748b',
                          flexShrink: 0
                        }} />

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                          }}>
                            {template.name || 'Untitled Template'}
                          </div>
                          <div style={{
                            fontSize: '0.65rem', color: '#64748b', marginTop: '2px',
                            display: 'flex', gap: '8px', flexWrap: 'wrap'
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <Hash size={10} /> {template.partNo || '-'}
                            </span>
                            <span>{template.customer || '-'}</span>
                            <span style={{ color: '#475569' }}>•</span>
                            <span>{template.checkPoints?.length || 0} pts</span>
                            <span style={{ color: '#475569' }}>•</span>
                            <span>Rev {template.revisionNo || template.revision || 'A'}</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '0.6rem',
                          fontWeight: 800,
                          backgroundColor:
                            template.status === 'approved' || template.status === 'APPROVED' ? 'rgba(34,197,94,0.15)' :
                            template.status === 'released' || template.status === 'RELEASED' ? 'rgba(59,130,246,0.15)' :
                            template.status === 'pending_approval' || template.status === 'IN_REVIEW' ? 'rgba(245,158,11,0.15)' : 'rgba(100,116,139,0.15)',
                          color:
                            template.status === 'approved' || template.status === 'APPROVED' ? '#4ade80' :
                            template.status === 'released' || template.status === 'RELEASED' ? '#60a5fa' :
                            template.status === 'pending_approval' || template.status === 'IN_REVIEW' ? '#fbbf24' : '#94a3b8',
                          flexShrink: 0
                        }}>
                          {(template.status || 'DRAFT').toUpperCase()}
                        </div>

                        {/* Load icon */}
                        <div style={{
                          width: '28px', height: '28px',
                          backgroundColor: '#10b981',
                          borderRadius: '6px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Check size={14} color="white" />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 20px',
              borderTop: '1px solid #1e293b'
            }}>
              <div style={{ fontSize: '0.7rem', color: '#475569' }}>
                {savedTemplates.length} project tersimpan
              </div>
              <button
                onClick={() => setShowOpenProjectModal(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#1e293b',
                  color: '#94a3b8',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
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
                          setRevisionNo(template.revisionNo || template.revision || 'A');
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
                            {template.checkPoints?.length || 0} parameters • Rev {template.revisionNo || template.revision || 'A'} • Updated {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString() : '-'}
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
                                // Sync delete to Supabase
                                import('../utils/supabaseTemplateDB').then(({ deleteTemplate }) => {
                                  deleteTemplate(template.id).catch(e => console.warn('[InspectorDesigner] deleteTemplate failed:', e));
                                });
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
                    revisionNo: revisionNo,
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

      {/* ─── PRECISION AUTO-BALLOON STUDIO MODAL ─── */}
      {showAutoBalloonModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,0.85)',
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(6px)',
          padding: '20px'
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAutoBalloonModal(false); }}
        >
          <div style={{
            backgroundColor: '#0f172a',
            border: '2px solid #8b5cf6',
            borderRadius: '16px',
            width: '940px',
            maxWidth: '96vw',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)'
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(139, 92, 246, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: '#8b5cf6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Sparkles size={20} color="white" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#f8fafc', letterSpacing: '-0.02em' }}>
                      CAD & PDF Precision Auto-Balloon Studio
                    </h2>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '6px',
                      backgroundColor: detectedPdfTypeInfo === 'VECTOR_PDF' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: detectedPdfTypeInfo === 'VECTOR_PDF' ? '#34d399' : '#fbbf24',
                      border: `1px solid ${detectedPdfTypeInfo === 'VECTOR_PDF' ? '#059669' : '#d97706'}`
                    }}>
                      {detectedPdfTypeInfo === 'VECTOR_PDF' ? '⚡ VECTOR PDF (Native Streams)' : '🔬 SCANNED PDF (OCR Vision)'}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: '#c4b5fd' }}>
                    {detectedCADPoints.length} Dimensi CAD & GD&T berhasil diekstraksi secara presisi dengan toleransi ISO
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={handleOpenAutoBalloonStudio}
                  disabled={isExtractingCAD}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    cursor: isExtractingCAD ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    color: '#38bdf8'
                  }}
                  title="Pindai ulang dimensi drawing PDF"
                >
                  <RefreshCw size={13} className={isExtractingCAD ? 'animate-spin' : ''} />
                  {isExtractingCAD ? 'Memindai...' : 'Pindai Ulang'}
                </button>

                <button
                  onClick={() => setShowAutoBalloonModal(false)}
                  style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tolerance Standard & Sorting Controls */}
            <div style={{
              padding: '12px 20px',
              backgroundColor: '#090d16',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              {/* Tolerance Standard */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>STANDAR TOLERANSI:</span>
                <select
                  value={autoBalloonToleranceGrade}
                  onChange={(e) => {
                    setAutoBalloonToleranceGrade(e.target.value);
                  }}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#38bdf8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <option value="iso_m">ISO 2768-mK Medium (General ±0.1 ~ ±0.3)</option>
                  <option value="iso_f">ISO 2768-f Fine (Aerospace/Metrology ±0.05 ~ ±0.1)</option>
                  <option value="custom_precision">High-Precision Machining (CC: ±0.02, Major: ±0.05)</option>
                </select>
              </div>

              {/* Sorting Strategy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94a3b8' }}>URUTAN BALON:</span>
                <select
                  value={autoBalloonSortStrategy}
                  onChange={(e) => setAutoBalloonSortStrategy(e.target.value)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#c4b5fd',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    padding: '5px 10px',
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  <option value="spatial">Alur Spasial (Atas-ke-Bawah, Kiri-ke-Kanan)</option>
                  <option value="critical_first">Dimensi Kritis Dahulu (Critical CC ➔ Major)</option>
                  <option value="clockwise">Melingkar Searah Jarum Jam (Clockwise Part)</option>
                </select>
              </div>
            </div>

            {/* Detected Dimensions Table Preview */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.74rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1e293b', color: '#94a3b8', borderBottom: '1px solid #334155', textAlign: 'left' }}>
                    <th style={{ padding: '8px 10px', width: '45px' }}>#</th>
                    <th style={{ padding: '8px 10px' }}>FITUR CAD / DESKRIPSI</th>
                    <th style={{ padding: '8px 10px' }}>KATEGORI</th>
                    <th style={{ padding: '8px 10px' }}>NOMINAL</th>
                    <th style={{ padding: '8px 10px' }}>TOLERANSI MIN / MAX</th>
                    <th style={{ padding: '8px 10px' }}>ALAT UKUR METROLOGI</th>
                    <th style={{ padding: '8px 10px' }}>CRITICALITY</th>
                  </tr>
                </thead>
                <tbody>
                  {detectedCADPoints.map((pt, idx) => (
                    <tr
                      key={pt.id || idx}
                      style={{
                        borderBottom: '1px solid #1e293b',
                        backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <td style={{ padding: '8px 10px', fontWeight: 900, color: '#38bdf8' }}>
                        #{idx + 1}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 700, color: '#f8fafc' }}>
                        {pt.title}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1' }}>
                        {pt.gdtSymbol} {pt.category}
                      </td>
                      <td style={{ padding: '8px 10px', fontWeight: 800, color: '#22c55e' }}>
                        {pt.nominal} {pt.unit}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#cbd5e1', fontWeight: 700 }}>
                        {pt.tolMin} ~ {pt.tolMax} {pt.unit}
                      </td>
                      <td style={{ padding: '8px 10px', color: '#94a3b8' }}>
                        🛠️ {pt.toolId || pt.inspectionMethod}
                      </td>
                      <td style={{ padding: '8px 10px' }}>
                        <span style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontSize: '0.66rem',
                          fontWeight: 800,
                          backgroundColor: pt.criticality.includes('Critical') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                          color: pt.criticality.includes('Critical') ? '#ef4444' : '#38bdf8',
                          border: `1px solid ${pt.criticality.includes('Critical') ? '#ef4444' : '#0284c7'}`
                        }}>
                          {pt.criticality}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Modal Actions Footer */}
            <div style={{
              padding: '14px 20px',
              borderTop: '1px solid #1e293b',
              backgroundColor: '#090d16',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                💡 Posisi pin dan toleransi dapat diedit kapan saja setelah diterapkan.
              </span>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowAutoBalloonModal(false)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>

                <button
                  onClick={() => handleApplyAutoBalloons(detectedCADPoints)}
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 0 16px rgba(139, 92, 246, 0.5)'
                  }}
                >
                  <Sparkles size={15} /> Terapkan {detectedCADPoints.length} Balon Presisi ➔
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── STAMP SELECTION MODAL ─── */}
      {showStampModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '440px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#090d16'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 800, color: '#f8fafc' }}>
                <span>🏷️</span> Pilih Cap / Stamp QA untuk Blueprint
              </div>
              <button
                onClick={() => setShowStampModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', maxHeight: '380px', overflowY: 'auto' }}>
              {STAMPS.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    setSelectedStamp(s.id);
                    setShowStampModal(false);
                    toast.success(`Stamp ${s.label} dipilih! Klik canvas untuk meletakkannya.`);
                  }}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedStamp === s.id ? 'rgba(56, 189, 248, 0.15)' : '#1e293b',
                    border: selectedStamp === s.id ? '2px solid #38bdf8' : '1px solid #334155',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{s.icon}</span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 900, color: s.color }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── TEXT NOTE INPUT MODAL ─── */}
      {showTextModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#0f172a',
            border: '1px solid #334155',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '380px',
            boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '14px 18px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#090d16'
            }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#f8fafc' }}>
                ✍️ Tambah Teks Anotasi pada Blueprint
              </div>
              <button
                onClick={() => setShowTextModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '16px' }}>
              <input
                type="text"
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                placeholder="Tulis catatan (misal: Rework Area, CC-01, dll)..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && textInputValue.trim() && textInputPosition) {
                    const newText = {
                      id: `text_${Date.now()}`,
                      type: 'text',
                      text: textInputValue.trim(),
                      color: drawingColor,
                      fontSize: 14,
                      x: textInputPosition.x,
                      y: textInputPosition.y
                    };
                    setDrawings(prev => [...prev, newText]);
                    setTextInputValue('');
                    setShowTextModal(false);
                    toast.success('Teks catatan berhasil diletakkan!');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#1e293b',
                  border: '1.5px solid #38bdf8',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '0.85rem',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button
                  onClick={() => setShowTextModal(false)}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (textInputValue.trim() && textInputPosition) {
                      const newText = {
                        id: `text_${Date.now()}`,
                        type: 'text',
                        text: textInputValue.trim(),
                        color: drawingColor,
                        fontSize: 14,
                        x: textInputPosition.x,
                        y: textInputPosition.y
                      };
                      setDrawings(prev => [...prev, newText]);
                      setTextInputValue('');
                      setShowTextModal(false);
                      toast.success('Teks catatan berhasil diletakkan!');
                    }
                  }}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#38bdf8',
                    color: '#0f172a',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Simpan Teks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}