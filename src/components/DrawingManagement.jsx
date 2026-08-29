/**
 * DrawingManagement.jsx
 * =====================================================
 * Full PLM Master Data Hub — Drawing, Revision, Balloon, Feature, BOM & ECN Management
 * Features:
 * - Direct Client-side Blueprint File Upload (PDF / DXF / PNG / JPG / SVG)
 * - Auto-persistence to Supabase & localStorage cache
 * - Interactive Visual Canvas Viewer with Zoom, Pan, Drag & Drop, and Reset
 * - Visual Click-to-Place Balloon Annotation on Blueprint
 * - Quick Demo Blueprint Loaders (CAD Flange & Stepper Shaft)
 * - Part Number & BOM (Bill of Materials) Integration
 * - ISO 9001 / IATF 16949 ECN (Engineering Change Notice) Workflow & Sign-Off
 * - Printable ECN Certificate & Change History
 * - GD&T Features / Dimension Table
 * - Direct Bridge to Inspector Designer & Checksheet
 * =====================================================
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Folder, FileText, Package, Plus, Trash2, RefreshCw, ChevronRight, ChevronDown,
  Circle, Layers, Search, Filter, Edit3, Save, X, Check, Eye, Download,
  GitBranch, Clock, User, ExternalLink, FileCode, ClipboardCheck, Copy,
  AlertTriangle, CheckCircle2, Archive, Tag, Hash, ArrowRight, Sparkles,
  FolderArchive, Target, Ruler, Settings2, Link2, Unlink, BarChart2,
  PlusCircle, MinusCircle, ChevronLeft, Upload, Info, ZoomIn, ZoomOut,
  Maximize2, Crosshair, Move, Image, FileUp, MousePointer, Boxes, Cpu,
  ShieldCheck, Award, Printer, FileSpreadsheet, CheckSquare, Wand2, FileSearch
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import {
  getDrawings, createDrawing, updateDrawing, deleteDrawing,
  getDrawingRevisions, createDrawingRevision, releaseDrawingRevision,
  getDrawingBalloons, createDrawingBalloon, updateDrawingBalloon, deleteDrawingBalloon,
  getDrawingFeatures, createDrawingFeature, updateDrawingFeature, deleteDrawingFeature,
  getDrawingRelations, addChildDrawing, removeChildDrawing,
  getParts, getPart, createPart, updatePart,
  generateCode
} from '../utils/mavicorePLM';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';
import { parseDxfContent } from '../utils/cadDxfRenderService';

// ─── Drawing Type Config ───
const DRAWING_TYPES = [
  { key: 'DETAIL', label: 'Detail Drawing', icon: FileText, color: '#3b82f6' },
  { key: 'ASSEMBLY', label: 'Assembly Drawing', icon: Package, color: '#8b5cf6' },
  { key: 'SCHEMATIC', label: 'Schematic', icon: Layers, color: '#06b6d4' },
  { key: 'LAYOUT', label: 'Layout', icon: Folder, color: '#f59e0b' },
];

// ─── Revision Status Config ───
const REV_STATUS = {
  DRAFT: { label: 'Draft', color: 'amber', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  RELEASED: { label: 'Released', color: 'emerald', bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  SUPERSEDED: { label: 'Superseded', color: 'slate', bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' },
};

// ─── Feature Type Config ───
const FEATURE_TYPES = [
  { key: 'DIMENSION', label: 'Dimension', symbol: '📏' },
  { key: 'TOLERANCE', label: 'Tolerance', symbol: '±' },
  { key: 'SURFACE_FINISH', label: 'Surface Finish', symbol: 'Ra' },
  { key: 'GEOMETRIC', label: 'Geometric (GD&T)', symbol: '⊥' },
];

// ─── ECN Categories (ISO 9001 / IATF 16949) ───
const ECN_CATEGORIES = [
  { key: 'DESIGN_OPTIMIZATION', label: 'Optimasi Desain', icon: '🎨' },
  { key: 'CUSTOMER_ECR', label: 'Permintaan Pelanggan (ECR)', icon: '🏢' },
  { key: 'QUALITY_DEFECT_FIX', label: 'Koreksi Mutu / Defect', icon: '🛡️' },
  { key: 'COST_REDUCTION', label: 'Efisiensi Biaya (VA/VE)', icon: '💰' },
  { key: 'TOOLING_VENDOR', label: 'Pergantian Tooling / Vendor', icon: '🔧' },
];

const DISPOSITIONS = [
  { key: 'USE_AS_IS', label: 'Use As Is (Gunakan Stok Berjalan)' },
  { key: 'REWORK', label: 'Rework Required (Wajib Rework Stok)' },
  { key: 'SCRAP', label: 'Scrap / Obsolete (Karantina & Musnahkan)' },
];

// ─── Demo CAD Blueprint Generator Helper ───
const createDemoBlueprintSvg = (type = 'flange') => {
  if (type === 'shaft') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650" style="background:%230b132b">
      <defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="%231e293b" stroke-width="0.8"/></pattern></defs>
      <rect width="100%" height="100%" fill="url(%23grid)"/>
      <rect x="50" y="40" width="900" height="570" fill="none" stroke="%2338bdf8" stroke-width="2"/>
      <text x="70" y="80" fill="%2338bdf8" font-family="monospace" font-size="18" font-weight="bold">MAVICORE CAD — PRECISION STEPPER SHAFT SFT-120</text>
      <text x="70" y="105" fill="%2394a3b8" font-family="monospace" font-size="12">DOC: DWG-SFT-001 | REV: A | SCALE 1:1 | MATERIAL: SUS304</text>
      <!-- Shaft body -->
      <rect x="150" y="260" width="180" height="120" fill="%231e293b" stroke="%2338bdf8" stroke-width="2.5"/>
      <rect x="330" y="230" width="260" height="180" fill="%231e293b" stroke="%2338bdf8" stroke-width="2.5"/>
      <rect x="590" y="270" width="220" height="100" fill="%231e293b" stroke="%2338bdf8" stroke-width="2.5"/>
      <!-- Centerlines -->
      <line x1="100" y1="320" x2="850" y2="320" stroke="%23ef4444" stroke-dasharray="10,5" stroke-width="1.5"/>
      <!-- Dimension lines -->
      <line x1="150" y1="460" x2="810" y2="460" stroke="%23facc15" stroke-width="1.5"/>
      <text x="440" y="450" fill="%23facc15" font-family="monospace" font-size="15" font-weight="bold">L = 120.00 ±0.20 mm</text>
      <text x="420" y="210" fill="%23facc15" font-family="monospace" font-size="15" font-weight="bold">Ø 40.00 ±0.01 mm</text>
      <text x="200" y="240" fill="%23facc15" font-family="monospace" font-size="14" font-weight="bold">Ø 25.00 ±0.015</text>
    </svg>`;
  }
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 650" width="1000" height="650" style="background:%230b132b">
    <defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="%231e293b" stroke-width="0.8"/></pattern></defs>
    <rect width="100%" height="100%" fill="url(%23grid)"/>
    <rect x="50" y="40" width="900" height="570" fill="none" stroke="%2338bdf8" stroke-width="2"/>
    <text x="70" y="80" fill="%2338bdf8" font-family="monospace" font-size="18" font-weight="bold">MAVICORE CAD — HYDRAULIC FLANGE HOUSING FLG-450</text>
    <text x="70" y="105" fill="%2394a3b8" font-family="monospace" font-size="12">DOC: DWG-FLG-001 | REV: A | SCALE 1:1 | MATERIAL: AL-6061-T6</text>
    <!-- Flange Circles -->
    <circle cx="500" cy="330" r="190" fill="%231e293b" stroke="%2338bdf8" stroke-width="3"/>
    <circle cx="500" cy="330" r="140" fill="none" stroke="%23ef4444" stroke-dasharray="8,4" stroke-width="1.5"/>
    <circle cx="500" cy="330" r="85" fill="%230b132b" stroke="%2338bdf8" stroke-width="2.5"/>
    <!-- Bolt Holes -->
    <circle cx="500" cy="190" r="16" fill="%230b132b" stroke="%2338bdf8" stroke-width="2"/>
    <circle cx="500" cy="470" r="16" fill="%230b132b" stroke="%2338bdf8" stroke-width="2"/>
    <circle cx="360" cy="330" r="16" fill="%230b132b" stroke="%2338bdf8" stroke-width="2"/>
    <circle cx="640" cy="330" r="16" fill="%230b132b" stroke="%2338bdf8" stroke-width="2"/>
    <!-- Centerlines -->
    <line x1="260" y1="330" x2="740" y2="330" stroke="%23ef4444" stroke-dasharray="10,5" stroke-width="1.2"/>
    <line x1="500" y1="90" x2="500" y2="570" stroke="%23ef4444" stroke-dasharray="10,5" stroke-width="1.2"/>
    <!-- Dimension Text -->
    <text x="430" y="325" fill="%23facc15" font-family="monospace" font-size="15" font-weight="bold">Ø 25.00 ±0.05</text>
    <text x="430" y="550" fill="%23facc15" font-family="monospace" font-size="15" font-weight="bold">OD Ø 120.00 ±0.15</text>
    <text x="650" y="270" fill="%23facc15" font-family="monospace" font-size="13" font-weight="bold">4x M10 PCD 95</text>
  </svg>`;
};

export default function DrawingManagement() {
  const navigate = useNavigate();

  // ─── State ───
  const [drawings, setDrawings] = useState([]);
  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Selection
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);

  // Sub-data
  const [revisions, setRevisions] = useState([]);
  const [balloons, setBalloons] = useState([]);
  const [features, setFeatures] = useState([]);
  const [relations, setRelations] = useState([]);

  // Blueprint Image & Visual Canvas State
  const [blueprintImage, setBlueprintImage] = useState(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isBalloonPlacingMode, setIsBalloonPlacingMode] = useState(false);
  const [activeBalloonId, setActiveBalloonId] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const canvasContainerRef = useRef(null);
  const imageRef = useRef(null);
  const fileInputRef = useRef(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showEcnDetailModal, setShowEcnDetailModal] = useState(false);
  const [selectedEcnRevision, setSelectedEcnRevision] = useState(null);
  const [showBalloonModal, setShowBalloonModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPartModal, setShowPartModal] = useState(false);
  const [showCreatePartModal, setShowCreatePartModal] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: '', code: '', drawing_type: 'DETAIL', description: '', file_url: null, file_name: null });
  const [revFormData, setRevFormData] = useState({
    revision_code: '',
    ecn_number: '',
    change_category: 'DESIGN_OPTIMIZATION',
    reason_for_change: '',
    description: '',
    effective_date: new Date().toISOString().split('T')[0],
    disposition: 'USE_AS_IS',
    tooling_impact: false,
    originator: 'Engineering Lead',
    approver: 'QA Manager'
  });
  const [partFormData, setPartFormData] = useState({ code: '', name: '', material: '', weight: '', part_type: 'COMPONENT', unit: 'PCS' });
  const [balloonFormData, setBalloonFormData] = useState({
    balloon_number: '',
    position_x: 100,
    position_y: 100,
    color: '#3B82F6',
    symbol: 'CIRCLE',
    target_feature_id: null,
    target_part_id: null
  });
  const [featureFormData, setFeatureFormData] = useState({
    feature_code: '',
    feature_name: '',
    feature_type: 'DIMENSION',
    nominal_value: '',
    upper_tolerance: '',
    lower_tolerance: '',
    unit: 'mm'
  });

  // Active detail tab
  const [activeTab, setActiveTab] = useState('canvas'); // canvas | bom | revisions | balloons | features | relations

  // ─── Pagination State ───
  const [drawingsPage, setDrawingsPage] = useState(0);
  const [drawingsTotal, setDrawingsTotal] = useState(0);
  const PAGE_SIZE = 20;

  // ─── Load Initial Drawings & Parts (with pagination) ───
  const loadInitialData = useCallback(async (search = '', page = 0) => {
    setLoading(true);
    try {
      // Use paginated query
      const drawingsResult = await getDrawings({ page, pageSize: PAGE_SIZE, search });
      const partsResult = await getParts({ page: 0, pageSize: 100 }); // Parts still load all for BOM dropdown

      setDrawings(drawingsResult.items || []);
      setDrawingsTotal(drawingsResult.total || 0);
      setParts(partsResult.items || partsResult || []);
    } catch (err) {
      console.error('Failed to load PLM master data:', err);
    }
    setLoading(false);
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      loadInitialData(searchTerm, drawingsPage);
    }, 300); // Wait 300ms after user stops typing
    return () => clearTimeout(timer);
  }, [searchTerm, drawingsPage, loadInitialData]);

  // ─── Load sub-data when drawing selected ───
  const selectDrawing = useCallback(async (drawing) => {
    setSelectedDrawing(drawing);
    setSelectedRevision(null);
    setSelectedPart(null);
    setBalloons([]);
    setFeatures([]);

    // Check saved image from Supabase or localStorage fallback
    const cachedImage = localStorage.getItem(`mandor_drawing_image_${drawing.id}`);
    const initialImage = drawing.thumbnail_url || drawing.file_url || cachedImage || null;
    setBlueprintImage(initialImage);

    setZoom(1);
    setPan({ x: 0, y: 0 });
    setIsBalloonPlacingMode(false);
    setActiveTab('canvas');

    try {
      const [revs, rels] = await Promise.all([
        getDrawingRevisions(drawing.id),
        getDrawingRelations(drawing.id)
      ]);
      setRevisions(revs || []);
      setRelations(rels || []);

      if (revs && revs.length > 0) {
        setSelectedRevision(revs[0]);
        if (revs[0].file_url) {
          setBlueprintImage(revs[0].file_url);
        }
      }

      if (drawing.metadata?.part_id) {
        const p = await getPart(drawing.metadata.part_id);
        if (p) setSelectedPart(p);
      } else {
        const matched = parts.find(p => p.code === drawing.code || p.name === drawing.name);
        if (matched) setSelectedPart(matched);
      }
    } catch (err) {
      console.error('Error loading drawing data:', err);
    }
  }, [parts]);

  // ─── Load balloons & features when revision selected ───
  useEffect(() => {
    if (!selectedRevision) {
      setBalloons([]);
      setFeatures([]);
      return;
    }
    const loadRevData = async () => {
      try {
        const [bals, feats] = await Promise.all([
          getDrawingBalloons(selectedRevision.id),
          getDrawingFeatures(selectedRevision.id)
        ]);
        setBalloons(bals || []);
        setFeatures(feats || []);
      } catch (err) {
        console.error('Error loading revision data:', err);
      }
    };
    loadRevData();
  }, [selectedRevision]);

  // ─── File Upload Handler (PDF, DXF, PNG, JPG, SVG) ───
  const handleFileUpload = async (file) => {
    if (!file) return;
    setIsProcessingFile(true);
    const toastId = toast.loading(`Memproses dan memuat ${file.name}...`);

    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let imageUrl = null;

      if (['png', 'jpg', 'jpeg', 'webp'].includes(ext)) {
        imageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else if (ext === 'svg') {
        const text = await file.text();
        imageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(text)}`;
      } else if (ext === 'pdf') {
        const reader = new FileReader();
        const fileDataUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageUrl = await convertPdfToImageDataUrl(fileDataUrl, 2.5);
      } else if (ext === 'dxf') {
        const text = await file.text();
        const parsed = parseDxfContent(text, file.name);
        imageUrl = parsed.rendered_image;
      } else {
        throw new Error(`Format .${ext} belum didukung. Gunakan PNG, JPG, PDF, SVG, atau DXF.`);
      }

      if (!imageUrl) throw new Error('Gambar blueprint tidak dapat diproses');

      // Update State immediately
      setBlueprintImage(imageUrl);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setActiveTab('canvas');

      if (selectedDrawing) {
        try {
          localStorage.setItem(`mandor_drawing_image_${selectedDrawing.id}`, imageUrl);
        } catch (e) {
          console.warn('localStorage quota warning:', e);
        }

        await updateDrawing(selectedDrawing.id, {
          file_name: file.name,
          file_type: ext.toUpperCase(),
          file_size: file.size,
          file_url: imageUrl,
          thumbnail_url: imageUrl
        });

        setSelectedDrawing(prev => ({
          ...prev,
          file_name: file.name,
          file_url: imageUrl,
          thumbnail_url: imageUrl
        }));

        if (selectedRevision) {
          setSelectedRevision(prev => ({ ...prev, file_url: imageUrl }));
        }
      } else {
        // Auto create drawing
        const cleanName = file.name.replace(/\.[^/.]+$/, "");
        const code = generateCode('DRW');
        const newDwgRes = await createDrawing({
          code,
          name: cleanName,
          drawing_type: 'DETAIL',
          description: `Blueprint file: ${file.name}`,
          file_name: file.name,
          file_type: ext.toUpperCase(),
          file_size: file.size,
          file_url: imageUrl,
          thumbnail_url: imageUrl
        });

        if (newDwgRes.success) {
          try {
            localStorage.setItem(`mandor_drawing_image_${newDwgRes.data.id}`, imageUrl);
          } catch (e) {}
          await loadInitialData();
          await selectDrawing(newDwgRes.data);
        }
      }

      toast.success(`✓ Blueprint "${file.name}" berhasil dimuat di canvas!`, { id: toastId });
    } catch (err) {
      console.error('File Upload Error:', err);
      toast.error(`Gagal render blueprint: ${err.message}`, { id: toastId });
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ─── Demo Blueprint Preset Loader ───
  const handleLoadDemoPreset = async (presetType) => {
    const demoSvg = createDemoBlueprintSvg(presetType);
    setBlueprintImage(demoSvg);
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveTab('canvas');

    const fileName = presetType === 'shaft' ? 'Precision_Shaft_Demo.svg' : 'Flange_Housing_Demo.svg';

    if (selectedDrawing) {
      try {
        localStorage.setItem(`mandor_drawing_image_${selectedDrawing.id}`, demoSvg);
      } catch (e) {}

      await updateDrawing(selectedDrawing.id, {
        file_name: fileName,
        file_type: 'SVG',
        file_url: demoSvg,
        thumbnail_url: demoSvg
      });

      setSelectedDrawing(prev => ({
        ...prev,
        file_name: fileName,
        file_url: demoSvg,
        thumbnail_url: demoSvg
      }));
    }
    toast.success(`✓ Demo CAD Blueprint (${presetType}) berhasil dimuat ke canvas!`);
  };

  // ─── Canvas Interaction ───
  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom(prev => Math.min(Math.max(0.3, prev * zoomFactor), 5));
  };

  const handleMouseDown = (e) => {
    if (isBalloonPlacingMode) return;
    if (e.button === 0 || e.button === 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e) => {
    if (!isBalloonPlacingMode || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const naturalWidth = imageRef.current.naturalWidth || rect.width || 1000;
    const naturalHeight = imageRef.current.naturalHeight || rect.height || 650;

    const posX = Math.round((clickX / rect.width) * naturalWidth);
    const posY = Math.round((clickY / rect.height) * naturalHeight);

    const nextNumber = String(balloons.length + 1);
    setBalloonFormData({
      balloon_number: nextNumber,
      position_x: Math.max(10, posX),
      position_y: Math.max(10, posY),
      color: '#3B82F6',
      symbol: 'CIRCLE',
      target_feature_id: null,
      target_part_id: selectedPart?.id || null
    });

    setIsBalloonPlacingMode(false);
    setShowBalloonModal(true);
    toast.success(`Koordinat balloon (${posX}, ${posY}) terdeteksi!`);
  };

  // ─── Drag & Drop Handlers on Canvas ───
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFileUpload(file);
  };

  // ─── Filtered Drawings ───
  const filteredDrawings = useMemo(() => {
    return drawings.filter(d => {
      const matchSearch = (d.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.code || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = filterType === 'ALL' || d.drawing_type === filterType;
      return matchSearch && matchType;
    });
  }, [drawings, searchTerm, filterType]);

  // ─── Stats ───
  const stats = useMemo(() => ({
    total: drawings.length,
    detail: drawings.filter(d => d.drawing_type === 'DETAIL').length,
    assembly: drawings.filter(d => d.drawing_type === 'ASSEMBLY').length,
    totalParts: parts.length,
  }), [drawings, parts]);

  // ─── CRUD Handlers ───
  const handleCreateDrawing = async () => {
    if (!formData.name.trim()) { toast.error('Nama drawing wajib diisi'); return; }
    const code = formData.code.trim() || generateCode('DRW');
    const result = await createDrawing({ ...formData, code });
    if (result.success) {
      toast.success(`Drawing ${code} berhasil dibuat`);
      setShowCreateModal(false);
      setFormData({ name: '', code: '', drawing_type: 'DETAIL', description: '', file_url: null, file_name: null });
      loadInitialData();
      selectDrawing(result.data);
    } else {
      toast.error('Gagal membuat drawing: ' + (result.error || ''));
    }
  };

  const handleUpdateDrawing = async () => {
    if (!selectedDrawing) return;
    const result = await updateDrawing(selectedDrawing.id, formData);
    if (result.success) {
      toast.success('Drawing berhasil diupdate');
      setShowEditModal(false);
      loadInitialData();
      setSelectedDrawing({ ...selectedDrawing, ...formData });
    } else {
      toast.error('Gagal update: ' + (result.error || ''));
    }
  };

  const handleDeleteDrawing = async (id) => {
    if (!window.confirm('Hapus drawing ini? Semua revisi, balloon, dan feature akan ikut terhapus.')) return;
    const result = await deleteDrawing(id);
    if (result.success) {
      toast.success('Drawing berhasil dihapus');
      if (selectedDrawing?.id === id) { setSelectedDrawing(null); setRevisions([]); setBlueprintImage(null); }
      loadInitialData();
    }
  };

  // ─── Create ECN Revision Handler ───
  const handleCreateRevision = async () => {
    if (!selectedDrawing || !revFormData.revision_code.trim()) {
      toast.error('Revision code wajib diisi');
      return;
    }

    const ecnNo = revFormData.ecn_number.trim() || `ECN-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`;

    const ecnMetadata = {
      ecn_number: ecnNo,
      change_category: revFormData.change_category,
      reason_for_change: revFormData.reason_for_change,
      effective_date: revFormData.effective_date,
      disposition: revFormData.disposition,
      tooling_impact: revFormData.tooling_impact,
      originator: revFormData.originator || 'Engineering Dept',
      approver: revFormData.approver || 'QA Management'
    };

    const result = await createDrawingRevision({
      drawing_id: selectedDrawing.id,
      revision_code: revFormData.revision_code,
      description: revFormData.description || revFormData.reason_for_change,
      file_url: blueprintImage || null,
      metadata: ecnMetadata
    });

    if (result.success) {
      toast.success(`Dokumen Revisi ${revFormData.revision_code} (${ecnNo}) berhasil dibuat!`);
      setShowRevisionModal(false);
      setRevFormData({
        revision_code: '',
        ecn_number: '',
        change_category: 'DESIGN_OPTIMIZATION',
        reason_for_change: '',
        description: '',
        effective_date: new Date().toISOString().split('T')[0],
        disposition: 'USE_AS_IS',
        tooling_impact: false,
        originator: 'Engineering Lead',
        approver: 'QA Manager'
      });
      const revs = await getDrawingRevisions(selectedDrawing.id);
      setRevisions(revs || []);
      setSelectedRevision(result.data);
    } else {
      toast.error('Gagal membuat revision: ' + (result.error || ''));
    }
  };

  const handleReleaseRevision = async (revId) => {
    const result = await releaseDrawingRevision(revId, 'QA Management (Signed)');
    if (result.success) {
      toast.success('Revision resmi dirilis (RELEASED) sesuai ISO 9001!');
      const revs = await getDrawingRevisions(selectedDrawing.id);
      setRevisions(revs || []);
      if (selectedRevision?.id === revId) setSelectedRevision(result.data);
    }
  };

  const handleCreateBalloon = async () => {
    if (!selectedRevision || !balloonFormData.balloon_number) {
      toast.error('Balloon number wajib diisi');
      return;
    }
    const result = await createDrawingBalloon({
      drawing_revision_id: selectedRevision.id,
      ...balloonFormData
    });
    if (result.success) {
      toast.success(`Balloon #${balloonFormData.balloon_number} tersimpan pada blueprint!`);
      setShowBalloonModal(false);
      setBalloonFormData({ balloon_number: '', position_x: 100, position_y: 100, color: '#3B82F6', symbol: 'CIRCLE', target_feature_id: null, target_part_id: null });
      const bals = await getDrawingBalloons(selectedRevision.id);
      setBalloons(bals || []);
    } else {
      toast.error('Gagal menambah balloon: ' + (result.error || ''));
    }
  };

  const handleDeleteBalloon = async (id) => {
    const result = await deleteDrawingBalloon(id);
    if (result.success) {
      toast.success('Balloon dihapus');
      setBalloons(prev => prev.filter(b => b.id !== id));
      if (activeBalloonId === id) setActiveBalloonId(null);
    }
  };

  const handleCreateFeature = async () => {
    if (!selectedRevision || !featureFormData.feature_code.trim() || !featureFormData.feature_name.trim()) {
      toast.error('Feature code dan nama wajib diisi');
      return;
    }
    const result = await createDrawingFeature({
      drawing_revision_id: selectedRevision.id,
      ...featureFormData,
      nominal_value: featureFormData.nominal_value ? parseFloat(featureFormData.nominal_value) : null,
      upper_tolerance: featureFormData.upper_tolerance ? parseFloat(featureFormData.upper_tolerance) : null,
      lower_tolerance: featureFormData.lower_tolerance ? parseFloat(featureFormData.lower_tolerance) : null,
    });
    if (result.success) {
      toast.success(`Feature ${featureFormData.feature_code} berhasil ditambah`);
      setShowFeatureModal(false);
      setFeatureFormData({ feature_code: '', feature_name: '', feature_type: 'DIMENSION', nominal_value: '', upper_tolerance: '', lower_tolerance: '', unit: 'mm' });
      const feats = await getDrawingFeatures(selectedRevision.id);
      setFeatures(feats || []);
    } else {
      toast.error('Gagal menambah feature: ' + (result.error || ''));
    }
  };

  const handleDeleteFeature = async (id) => {
    const result = await deleteDrawingFeature(id);
    if (result.success) {
      toast.success('Feature dihapus');
      setFeatures(prev => prev.filter(f => f.id !== id));
    }
  };

  // ─── Part & BOM Link Handlers ───
  const handleLinkPart = async (part) => {
    if (!selectedDrawing) return;
    try {
      const updatedMetadata = {
        ...(selectedDrawing.metadata || {}),
        part_id: part.id,
        part_code: part.code,
        part_name: part.name
      };
      await updateDrawing(selectedDrawing.id, { metadata: updatedMetadata });
      setSelectedDrawing(prev => ({ ...prev, metadata: updatedMetadata }));
      setSelectedPart(part);
      setShowPartModal(false);
      toast.success(`Drawing berhasil dihubungkan ke Part ${part.code}!`);
    } catch (err) {
      toast.error('Gagal menghubungkan part: ' + err.message);
    }
  };

  const handleCreatePartAndLink = async () => {
    if (!partFormData.name.trim()) {
      toast.error('Nama part wajib diisi');
      return;
    }
    const code = partFormData.code.trim() || generateCode('PRT');
    const result = await createPart({ ...partFormData, code });
    if (result.success) {
      toast.success(`Part ${code} berhasil dibuat`);
      setShowCreatePartModal(false);
      setPartFormData({ code: '', name: '', material: '', weight: '', part_type: 'COMPONENT', unit: 'PCS' });
      const partsData = await getParts();
      setParts(partsData || []);
      handleLinkPart(result.data);
    } else {
      toast.error('Gagal membuat part: ' + (result.error || ''));
    }
  };

  // ─── Direct Launch to Inspector Designer ───
  const handleOpenInInspector = () => {
    if (!selectedDrawing || !selectedRevision) {
      toast.error('Pilih drawing & revisi');
      return;
    }
    const templateData = {
      id: `insp_${Date.now()}`,
      name: `${selectedDrawing.name} (Rev ${selectedRevision.revision_code})`,
      docNo: selectedDrawing.code,
      partNo: selectedPart?.code || selectedDrawing.code,
      partName: selectedPart?.name || selectedDrawing.name,
      revisionNo: selectedRevision.revision_code,
      drawingFileName: selectedDrawing.file_name || `${selectedDrawing.code}.png`,
      drawingImageUrl: blueprintImage,
      checkPoints: balloons.map((b, i) => ({
        id: `cp_${b.id || i}`,
        pointNumber: parseInt(b.balloon_number) || (i + 1),
        title: b.target_feature?.feature_name || `Point ${b.balloon_number}`,
        category: 'Linear Dimension',
        nominal: b.target_feature?.nominal_value || 0,
        tolMin: b.target_feature?.lower_tolerance || 0,
        tolMax: b.target_feature?.upper_tolerance || 0,
        unit: b.target_feature?.unit || 'mm',
        x: b.position_x || 100,
        y: b.position_y || 100,
        criticality: 'Major',
        inspectionMethod: 'Caliper'
      }))
    };
    localStorage.setItem('mandor_inspector_active_template', JSON.stringify(templateData));
    toast.success('Membuka Inspector Designer Studio dengan blueprint ini...');
    navigate('/inspector-designer');
  };

  const getTypeConfig = (type) => DRAWING_TYPES.find(t => t.key === type) || DRAWING_TYPES[0];
  const getRevStatus = (status) => REV_STATUS[status] || REV_STATUS.DRAFT;

  // ─── Modal Component (Odoo Dialog Style) ───
  const Modal = ({ show, onClose, title, children, onSubmit, submitLabel = 'Simpan', maxWidth = 'max-w-xl' }) => {
    if (!show) return null;
    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" onClick={onClose}>
        <div className={`bg-white border border-gray-200 rounded-xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden text-gray-900`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
            <h3 className="text-base font-bold text-gray-900">{title}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 cursor-pointer"><X size={18} /></button>
          </div>
          <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">{children}</div>
          {onSubmit && (
            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-200 bg-[#f8f9fa] shrink-0">
              <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 cursor-pointer">Batal</button>
              <button onClick={onSubmit} className="px-5 py-2 text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md shadow-xs transition-all cursor-pointer">
                {submitLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const InputField = ({ label, value, onChange, placeholder, type = 'text', required = false }) => (
    <div>
      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
      />
    </div>
  );

  const SelectField = ({ label, value, onChange, options }) => (
    <div>
      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  const TextArea = ({ label, value, onChange, placeholder }) => (
    <div>
      <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all resize-none"
      />
    </div>
  );

  // ─── RENDER ───
  return (
    <div className="flex flex-col flex-1 h-full w-full bg-[#f8f9fa] text-gray-900 overflow-hidden font-sans">
      <Toaster position="top-right" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.dxf,.png,.jpg,.jpeg,.webp,.svg"
        className="hidden"
        onChange={(e) => handleFileUpload(e.target.files?.[0])}
      />

      {/* ═══ 1. ODOO CONTROL PANEL / TOP HEADER BAR ═══ */}
      <div className="bg-white border-b border-gray-200 px-6 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-20 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#714B67] flex items-center justify-center text-white shadow-sm">
            <FolderArchive size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">PLM /</span>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">Drawing & ECN Management</h1>
              <span className="bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck size={11} /> ISO 9001 / IATF 16949 ECN
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Pusat kendali blueprint CAD, dokumen ECN (Engineering Change Notice), Bill of Materials, dan balloon inspeksi.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingFile}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            {isProcessingFile ? <RefreshCw size={14} className="animate-spin text-[#714B67]" /> : <Upload size={14} className="text-[#00A09D]" />}
            Upload Blueprint
          </button>
          <button
            onClick={() => { setFormData({ name: '', code: '', drawing_type: 'DETAIL', description: '', file_url: null, file_name: null }); setShowCreateModal(true); }}
            className="flex items-center gap-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs px-4 py-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            <Plus size={15} /> Buat Drawing Baru
          </button>
          {selectedDrawing && (
            <button
              onClick={handleOpenInInspector}
              className="flex items-center gap-1.5 bg-[#00A09D] hover:bg-[#008784] text-white font-semibold text-xs px-3.5 py-2 rounded-md shadow-xs transition-all cursor-pointer"
            >
              <FileCode size={14} /> Buka di Inspector Studio
            </button>
          )}
        </div>
      </div>

      {/* ═══ 2. ODOO SMART STAT BOXES (o_stat_info) ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 py-3.5 shrink-0 bg-[#f8f9fa]">
        {[
          { label: 'Total Drawing', value: stats.total, sub: 'Blueprint aktif', icon: FolderArchive, accent: 'text-[#714B67]', iconBg: 'bg-[#714B67]/10' },
          { label: 'Master Part (BOM)', value: stats.totalParts, sub: 'Part terdaftar', icon: Boxes, accent: 'text-[#00A09D]', iconBg: 'bg-[#00A09D]/10' },
          { label: 'Revisi & ECN', value: revisions.length, sub: 'Riwayat perubahan', icon: GitBranch, accent: 'text-indigo-600', iconBg: 'bg-indigo-50' },
          { label: 'Total Balloon', value: balloons.length, sub: 'Titik ukur aktif', icon: Circle, accent: 'text-emerald-600', iconBg: 'bg-emerald-50' },
        ].map((s, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-3.5 flex items-center justify-between shadow-xs hover:border-gray-300 transition-all">
            <div>
              <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{s.label}</div>
              <div className={`text-2xl font-black ${s.accent} mt-0.5`}>{s.value}</div>
              <div className="text-[10px] text-gray-400">{s.sub}</div>
            </div>
            <div className={`w-10 h-10 rounded-lg ${s.iconBg} ${s.accent} flex items-center justify-center`}>
              <s.icon size={20} />
            </div>
          </div>
        ))}
      </div>

      {/* ═══ 3. MAIN WORKSPACE ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT SIDEBAR: Drawing List ── */}
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 border-b border-gray-200 bg-[#f8f9fa] space-y-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari drawing atau part..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-1 focus:ring-[#714B67] transition-all"
              />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {[{ key: 'ALL', label: 'Semua' }, ...DRAWING_TYPES.map(t => ({ key: t.key, label: t.key }))].map(t => (
                <button
                  key={t.key}
                  onClick={() => setFilterType(t.key)}
                  className={`px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${filterType === t.key
                    ? 'bg-[#714B67] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
                <RefreshCw size={14} className="animate-spin text-[#714B67]" />
                <span className="text-xs">Memuat data...</span>
              </div>
            ) : filteredDrawings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <Folder size={32} className="text-gray-300 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Tidak ada drawing</p>
              </div>
            ) : (
              filteredDrawings.map(drawing => {
                const typeConf = getTypeConfig(drawing.drawing_type);
                const isSelected = selectedDrawing?.id === drawing.id;
                const TypeIcon = typeConf.icon;
                return (
                  <button
                    key={drawing.id}
                    onClick={() => selectDrawing(drawing)}
                    className={`w-full text-left p-2.5 rounded-md transition-all group cursor-pointer ${isSelected
                      ? 'bg-[#714B67]/10 border-l-4 border-[#714B67] text-[#714B67]'
                      : 'hover:bg-gray-100 text-gray-700 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-[#714B67] text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <TypeIcon size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold truncate ${isSelected ? 'text-[#714B67]' : 'text-gray-900'}`}>{drawing.code}</div>
                        <div className="text-[11px] text-gray-500 truncate">{drawing.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                            {drawing.drawing_type}
                          </span>
                          {drawing.metadata?.part_code && (
                            <span className="text-[9px] text-[#00A09D] font-mono font-bold">
                              📦 {drawing.metadata.part_code}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className={`shrink-0 mt-1 transition-transform ${isSelected ? 'text-[#714B67]' : 'text-gray-400 group-hover:text-gray-600'}`} />
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Pagination Controls */}
          {drawingsTotal > PAGE_SIZE && (
            <div className="flex items-center justify-between px-3 py-2 border-t border-gray-200 bg-[#f8f9fa]">
              <button
                onClick={() => setDrawingsPage(p => Math.max(0, p - 1))}
                disabled={drawingsPage === 0}
                className="p-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-200 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-[10px] text-gray-500 font-medium">
                {drawingsPage * PAGE_SIZE + 1}-{Math.min((drawingsPage + 1) * PAGE_SIZE, drawingsTotal)} / {drawingsTotal}
              </span>
              <button
                onClick={() => setDrawingsPage(p => (p + 1) * PAGE_SIZE < drawingsTotal ? p + 1 : p)}
                disabled={(drawingsPage + 1) * PAGE_SIZE >= drawingsTotal}
                className="p-1.5 text-xs text-gray-500 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed rounded hover:bg-gray-200 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

          <div className="p-3 border-t border-gray-200 bg-[#f8f9fa]">
            <button
              onClick={() => { setDrawingsPage(0); loadInitialData(searchTerm, 0); }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-200/60 transition-all cursor-pointer"
            >
              <RefreshCw size={12} /> Refresh Data
            </button>
          </div>
        </div>

        {/* ── RIGHT MAIN PANEL: Drawing Detail & Canvas ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#f8f9fa]">
          {!selectedDrawing ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center mb-4 text-[#714B67]">
                <FolderArchive size={32} />
              </div>
              <h3 className="text-base font-bold text-gray-800 mb-1">Pilih Drawing untuk Membuka Visual Studio</h3>
              <p className="text-xs text-gray-500 max-w-sm mb-6">
                Pilih drawing dari sidebar untuk melihat blueprint, mengelola formulir ECN revisi, dan menaruh balon inspeksi.
              </p>
              <button
                onClick={() => { setFormData({ name: '', code: '', drawing_type: 'DETAIL', description: '', file_url: null, file_name: null }); setShowCreateModal(true); }}
                className="flex items-center gap-2 bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs px-5 py-2.5 rounded-md shadow-xs cursor-pointer"
              >
                <Plus size={14} /> Buat Drawing Baru
              </button>
            </div>
          ) : (
            <>
              {/* ── Drawing Info Header Bar (Odoo Form Header) ── */}
              <div className="bg-white border-b border-gray-200 px-6 py-3.5 shrink-0 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
                      {React.createElement(getTypeConfig(selectedDrawing.drawing_type).icon, { size: 20 })}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-extrabold text-gray-900">{selectedDrawing.code} - {selectedDrawing.name}</h2>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                          {selectedDrawing.drawing_type}
                        </span>
                        {selectedPart ? (
                          <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-[#00A09D] border border-teal-200 flex items-center gap-1">
                            <Boxes size={10} /> Part: {selectedPart.code} ({selectedPart.material || 'Material N/A'})
                          </span>
                        ) : (
                          <button
                            onClick={() => setShowPartModal(true)}
                            className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 hover:text-[#00A09D] border border-gray-200 flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus size={10} /> Hubungkan Part BOM
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                        <span>Revisi: <strong className="text-gray-900">{selectedRevision ? `Rev ${selectedRevision.revision_code}` : 'A (Default)'}</strong></span>
                        {selectedRevision?.metadata?.ecn_number && (
                          <span className="text-[#714B67] font-mono font-semibold">
                            • ECN: <strong>{selectedRevision.metadata.ecn_number}</strong>
                          </span>
                        )}
                        <span>•</span>
                        <span>Balloons: <strong className="text-[#00A09D]">{balloons.length}</strong></span>
                        <span>•</span>
                        <span>File: <strong className="text-gray-700">{selectedDrawing.file_name || (blueprintImage ? 'Blueprint Dimuat' : 'Belum Ada File')}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowPartModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-[#00A09D] border border-gray-300 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                    >
                      <Boxes size={13} /> {selectedPart ? 'Ganti Part BOM' : 'Hubungkan Part'}
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                    >
                      <Upload size={13} /> Ganti File
                    </button>
                    <button
                      onClick={() => { setFormData({ name: selectedDrawing.name, code: selectedDrawing.code, drawing_type: selectedDrawing.drawing_type, description: selectedDrawing.description || '', file_url: selectedDrawing.file_url, file_name: selectedDrawing.file_name }); setShowEditModal(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                    >
                      <Edit3 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteDrawing(selectedDrawing.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-md border border-rose-200 transition-all cursor-pointer"
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Odoo Notebook Tabs Navigation Bar ── */}
              <div className="flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0">
                <div className="flex items-center gap-2">
                  {[
                    { key: 'canvas', label: 'Visual Blueprint & Balon', icon: Crosshair },
                    { key: 'revisions', label: `Revisi & ECN (${revisions.length})`, icon: GitBranch },
                    { key: 'bom', label: 'Part & BOM Integration', icon: Boxes },
                    { key: 'balloons', label: `Daftar Balon (${balloons.length})`, icon: Circle },
                    { key: 'features', label: `Features / GD&T (${features.length})`, icon: Ruler },
                    { key: 'relations', label: `Relations (${relations.length})`, icon: Link2 },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === tab.key
                        ? 'border-[#714B67] text-[#714B67]'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon size={13} />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activeTab === 'canvas' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        if (!selectedRevision && revisions.length === 0) {
                          toast('Membuat Revision A awal...', { icon: '⚙️' });
                          handleCreateRevision();
                          return;
                        }
                        setIsBalloonPlacingMode(prev => !prev);
                        if (!isBalloonPlacingMode) {
                          toast('Klik pada area blueprint untuk menaruh titik balon', { icon: '🎯' });
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${isBalloonPlacingMode
                        ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                        : 'bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 hover:bg-[#714B67]/20'
                      }`}
                    >
                      <Crosshair size={13} />
                      {isBalloonPlacingMode ? 'Mode Penempatan Aktif (Klik Gambar)' : '+ Taruh Balon Visual'}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Tab Content ── */}
              <div className="flex-1 overflow-hidden flex flex-col">

                {/* ══ 1. VISUAL CANVAS TAB ══ */}
                {activeTab === 'canvas' && (
                  <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
                    {/* Top Canvas Controls (Odoo Floating Bar) */}
                    <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur border border-gray-200 p-1.5 rounded-lg shadow-md text-gray-800">
                      <button
                        onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
                        title="Zoom In"
                      >
                        <ZoomIn size={15} />
                      </button>
                      <button
                        onClick={() => setZoom(z => Math.max(z * 0.8, 0.3))}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all cursor-pointer"
                        title="Zoom Out"
                      >
                        <ZoomOut size={15} />
                      </button>
                      <button
                        onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                        className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-all text-xs font-bold px-2 cursor-pointer"
                        title="Reset View"
                      >
                        {Math.round(zoom * 100)}% Reset
                      </button>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <span className="text-[11px] text-gray-500 px-1 font-semibold">
                        {balloons.length} Balon
                      </span>
                      <div className="w-px h-4 bg-gray-200 mx-1" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-bold text-[#00A09D] hover:text-[#008784] px-2 py-1 rounded bg-teal-50 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload size={12} /> Upload File
                      </button>
                    </div>

                    {/* Canvas Area with Image & Balloons */}
                    <div
                      ref={canvasContainerRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 w-full h-full min-h-[450px] overflow-hidden flex items-center justify-center select-none relative transition-colors ${isDragOver ? 'bg-blue-950/40 border-2 border-dashed border-blue-500' : ''} ${isBalloonPlacingMode ? 'cursor-crosshair' : isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onClick={handleCanvasClick}
                    >
                      {!blueprintImage ? (
                        <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300 rounded-xl bg-white max-w-lg shadow-lg m-4">
                          <Image size={48} className="text-gray-300 mb-3" />
                          <h4 className="text-base font-bold text-gray-900 mb-1">Belum Ada File Blueprint yang Dimuat</h4>
                          <p className="text-xs text-gray-500 mb-5 max-w-sm">
                            Unggah file CAD berupa <strong>PDF, DXF, PNG, JPG, atau SVG</strong> (atau drag & drop langsung ke sini).
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-3">
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="flex items-center gap-2 bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs px-4 py-2.5 rounded-md shadow-xs cursor-pointer"
                            >
                              <Upload size={15} /> Pilih File dari Komputer
                            </button>
                            <button
                              onClick={() => handleLoadDemoPreset('flange')}
                              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-xs px-3.5 py-2.5 rounded-md transition-all cursor-pointer shadow-2xs"
                            >
                              <Wand2 size={14} className="text-[#00A09D]" /> Muat Demo Flange CAD
                            </button>
                            <button
                              onClick={() => handleLoadDemoPreset('shaft')}
                              className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold text-xs px-3.5 py-2.5 rounded-md transition-all cursor-pointer shadow-2xs"
                            >
                              <Wand2 size={14} className="text-[#714B67]" /> Muat Demo Shaft CAD
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.05s ease-out',
                            position: 'relative',
                            display: 'inline-block'
                          }}
                        >
                          <img
                            ref={imageRef}
                            src={blueprintImage}
                            alt="Blueprint Canvas"
                            className="max-w-none shadow-2xl rounded-lg border border-slate-800 pointer-events-auto"
                            style={{
                              maxHeight: '75vh',
                              maxWidth: '85vw',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                            onLoad={() => console.log('[DrawingManagement] Blueprint loaded successfully')}
                            onError={(e) => console.error('[DrawingManagement] Image element load error:', e)}
                          />

                          {/* Visual Balloons Layer */}
                          {balloons.map((balloon) => {
                            const naturalWidth = imageRef.current?.naturalWidth || 1000;
                            const naturalHeight = imageRef.current?.naturalHeight || 650;

                            const leftPercent = (balloon.position_x / naturalWidth) * 100;
                            const topPercent = (balloon.position_y / naturalHeight) * 100;

                            const isSelected = activeBalloonId === balloon.id;

                            return (
                              <div
                                key={balloon.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveBalloonId(balloon.id);
                                }}
                                style={{
                                  position: 'absolute',
                                  left: `${leftPercent}%`,
                                  top: `${topPercent}%`,
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: isSelected ? 30 : 10
                                }}
                                className="group/balloon cursor-pointer"
                              >
                                <div
                                  className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-black text-xs shadow-lg transition-transform ${isSelected ? 'scale-125 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'group-hover/balloon:scale-110'}`}
                                  style={{ backgroundColor: balloon.color || '#714B67' }}
                                >
                                  {balloon.balloon_number}
                                </div>

                                <div className="opacity-0 group-hover/balloon:opacity-100 pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 bg-gray-900/95 text-white border border-gray-700 px-2.5 py-1 rounded-md text-[10px] whitespace-nowrap shadow-xl z-40 transition-opacity">
                                  <div className="font-bold">Point #{balloon.balloon_number}</div>
                                  {balloon.target_feature && (
                                    <div className="text-[#00A09D] font-mono">
                                      {balloon.target_feature.nominal_value} ±{balloon.target_feature.upper_tolerance || '0'} {balloon.target_feature.unit || 'mm'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ 2. REVISIONS & ECN TAB ══ */}
                {activeTab === 'revisions' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <ShieldCheck size={18} className="text-[#714B67]" />
                          Riwayat Revisi & Dokumen ECN (ISO 9001 / IATF 16949)
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Catatan perubahan Engineering Change Notice untuk kendali mutu dokumen manufaktur
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          const currentRevChar = revisions.length > 0 ? String.fromCharCode(revisions[0].revision_code.charCodeAt(0) + 1) : 'A';
                          setRevFormData({
                            revision_code: currentRevChar,
                            ecn_number: `ECN-${new Date().getFullYear()}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
                            change_category: 'DESIGN_OPTIMIZATION',
                            reason_for_change: '',
                            description: '',
                            effective_date: new Date().toISOString().split('T')[0],
                            disposition: 'USE_AS_IS',
                            tooling_impact: false,
                            originator: 'Engineering Lead',
                            approver: 'QA Manager'
                          });
                          setShowRevisionModal(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs transition-all cursor-pointer"
                      >
                        <Plus size={14} /> Buat Revisi Baru (Formulir ECN)
                      </button>
                    </div>

                    {revisions.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <GitBranch size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium mb-3">Belum ada dokumen revisi atau ECN yang dicatat.</p>
                        <button
                          onClick={() => {
                            setRevFormData({
                              revision_code: 'A',
                              ecn_number: `ECN-${new Date().getFullYear()}-001`,
                              change_category: 'DESIGN_OPTIMIZATION',
                              reason_for_change: 'Rilis gambar teknik awal untuk lini produksi massal.',
                              description: 'Rilis perdana dokumen drawing kendali mutu.',
                              effective_date: new Date().toISOString().split('T')[0],
                              disposition: 'USE_AS_IS',
                              tooling_impact: false,
                              originator: 'Engineering Lead',
                              approver: 'QA Manager'
                            });
                            setShowRevisionModal(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs cursor-pointer"
                        >
                          <Plus size={13} /> Buat Rilis Awal (Revision A)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {revisions.map((rev) => {
                          const st = getRevStatus(rev.status);
                          const isActive = selectedRevision?.id === rev.id;
                          const ecn = rev.metadata || {};
                          const catObj = ECN_CATEGORIES.find(c => c.key === ecn.change_category) || ECN_CATEGORIES[0];

                          return (
                            <div
                              key={rev.id}
                              onClick={() => setSelectedRevision(rev)}
                              className={`p-4 rounded-lg border cursor-pointer transition-all ${isActive
                                ? 'bg-purple-50/40 border-[#714B67] shadow-xs'
                                : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-start gap-3">
                                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ${rev.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {rev.revision_code}
                                  </div>
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm font-bold text-gray-900">Revision {rev.revision_code}</span>
                                      {ecn.ecn_number && (
                                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20">
                                          📄 {ecn.ecn_number}
                                        </span>
                                      )}
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rev.status === 'RELEASED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                        {st.label}
                                      </span>
                                      {isActive && (
                                        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#714B67] text-white">
                                          AKTIF
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 font-medium mt-1">
                                      {ecn.reason_for_change || rev.description || 'Tidak ada catatan ECN'}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3 mt-2 text-[10px] text-gray-400">
                                      {ecn.change_category && (
                                        <span className="flex items-center gap-1 text-[#00A09D] font-semibold">
                                          {catObj.icon} {catObj.label}
                                        </span>
                                      )}
                                      {ecn.effective_date && (
                                        <span>• Tanggal Efektif: <strong className="text-gray-700">{ecn.effective_date}</strong></span>
                                      )}
                                      {ecn.originator && (
                                        <span>• Pembuat: <strong className="text-gray-700">{ecn.originator}</strong></span>
                                      )}
                                      {ecn.approver && (
                                        <span>• Approver: <strong className="text-emerald-700">{ecn.approver}</strong></span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedEcnRevision(rev);
                                      setShowEcnDetailModal(true);
                                    }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-[11px] font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                                  >
                                    <FileSpreadsheet size={12} className="text-[#714B67]" /> Sertifikat ECN
                                  </button>

                                  {rev.status === 'DRAFT' && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleReleaseRevision(rev.id);
                                      }}
                                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-md border border-emerald-300 transition-all cursor-pointer"
                                    >
                                      <CheckCircle2 size={12} /> Sign-off (Release)
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ 3. PART & BOM INTEGRATION TAB ══ */}
                {activeTab === 'bom' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl">
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#00A09D]/10 text-[#00A09D] flex items-center justify-center">
                            <Boxes size={22} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">Master Part Number yang Terhubung</h3>
                            <p className="text-xs text-gray-500">Identitas fisik komponen pada database manufaktur / ERP</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowPartModal(true)}
                            className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-[#00A09D] text-xs font-bold rounded-md border border-teal-200 transition-all cursor-pointer"
                          >
                            Pilih dari Master Part
                          </button>
                          <button
                            onClick={() => { setPartFormData({ code: `PRT-${selectedDrawing.code}`, name: selectedDrawing.name, material: '', weight: '', part_type: 'COMPONENT', unit: 'PCS' }); setShowCreatePartModal(true); }}
                            className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
                          >
                            + Buat Part Baru
                          </button>
                        </div>
                      </div>

                      {selectedPart ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-[#f8f9fa] p-4 rounded-lg border border-gray-200">
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Part Code</span>
                            <div className="text-sm font-extrabold text-[#00A09D] font-mono">{selectedPart.code}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Part Name</span>
                            <div className="text-sm font-bold text-gray-900">{selectedPart.name}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Material</span>
                            <div className="text-sm font-bold text-amber-700">{selectedPart.material || 'Aluminium 6061'}</div>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Tipe Part</span>
                            <div className="text-sm font-bold text-[#714B67]">{selectedPart.part_type || 'COMPONENT'}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 border border-dashed border-gray-300 rounded-lg text-center bg-[#f8f9fa]">
                          <p className="text-xs text-gray-600 font-medium mb-1">Drawing ini belum dihubungkan ke Master Part Number.</p>
                          <p className="text-[11px] text-gray-400">Hubungkan agar seluruh data spesifikasi & material terintegrasi otomatis ke sistem ERP/BOM.</p>
                        </div>
                      )}
                    </div>

                    {/* BOM Table if Assembly (Odoo Tree View) */}
                    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900">Bill of Materials (BOM) & Sub-Parts</h4>
                          <p className="text-xs text-gray-500">Daftar part penyusun untuk gambar assembly ini</p>
                        </div>
                      </div>

                      <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600">
                              <th className="text-left py-2.5 px-3 font-bold text-[10px] uppercase">Item #</th>
                              <th className="text-left py-2.5 px-3 font-bold text-[10px] uppercase">Part Number</th>
                              <th className="text-left py-2.5 px-3 font-bold text-[10px] uppercase">Deskripsi Part</th>
                              <th className="text-center py-2.5 px-3 font-bold text-[10px] uppercase">Qty</th>
                              <th className="text-left py-2.5 px-3 font-bold text-[10px] uppercase">Material</th>
                              <th className="text-center py-2.5 px-3 font-bold text-[10px] uppercase">Balloon Ref</th>
                            </tr>
                          </thead>
                          <tbody>
                            {relations.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="text-center py-6 text-gray-400">
                                  Tidak ada sub-part BOM. Tambahkan child drawing pada tab Relations.
                                </td>
                              </tr>
                            ) : (
                              relations.map((rel, idx) => (
                                <tr key={rel.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <td className="py-2.5 px-3 font-mono font-bold text-gray-500">0{idx + 1}</td>
                                  <td className="py-2.5 px-3 font-mono font-bold text-[#00A09D]">{rel.child?.code}</td>
                                  <td className="py-2.5 px-3 text-gray-900 font-medium">{rel.child?.name}</td>
                                  <td className="py-2.5 px-3 text-center font-bold text-gray-900">{rel.quantity || 1}</td>
                                  <td className="py-2.5 px-3 text-gray-600">{rel.child?.metadata?.material || '-'}</td>
                                  <td className="py-2.5 px-3 text-center">
                                    <span className="px-2 py-0.5 rounded bg-[#714B67]/10 text-[#714B67] font-bold text-[10px]">
                                      #{idx + 1}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {/* ══ 4. BALLOONS LIST TAB ══ */}
                {activeTab === 'balloons' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Balloon Annotations</h3>
                        {selectedRevision && <p className="text-[11px] text-gray-500 mt-0.5">Revision {selectedRevision.revision_code}</p>}
                      </div>
                      <button
                        onClick={() => { setBalloonFormData({ balloon_number: String(balloons.length + 1), position_x: 100, position_y: 100, color: '#714B67', symbol: 'CIRCLE', target_feature_id: null, target_part_id: null }); setShowBalloonModal(true); }}
                        disabled={!selectedRevision}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <Plus size={13} /> Add Balloon Manual
                      </button>
                    </div>

                    {balloons.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <Circle size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium mb-3">Belum ada balloon. Buka tab <strong>Visual Blueprint</strong> dan klik '+ Taruh Balon Visual'.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
                        {balloons.map(balloon => (
                          <div key={balloon.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-xs hover:border-[#714B67]/40 transition-all group">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-xs"
                                style={{ backgroundColor: balloon.color || '#714B67' }}
                              >
                                {balloon.balloon_number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-gray-900">Balloon #{balloon.balloon_number}</div>
                                <div className="text-[11px] text-gray-500">
                                  Pos: ({balloon.position_x}, {balloon.position_y})
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteBalloon(balloon.id)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>

                            {balloon.target_feature && (
                              <div className="bg-[#f8f9fa] rounded-md p-2.5 border border-gray-100">
                                <div className="text-[10px] font-bold text-gray-400 uppercase">Linked Feature</div>
                                <div className="text-xs font-bold text-gray-900 mt-0.5">{balloon.target_feature.feature_name}</div>
                                {balloon.target_feature.nominal_value && (
                                  <div className="text-[11px] text-[#00A09D] font-mono font-bold mt-0.5">
                                    {balloon.target_feature.nominal_value} ±{balloon.target_feature.upper_tolerance || '0'} {balloon.target_feature.unit || 'mm'}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ══ 5. FEATURES TAB ══ */}
                {activeTab === 'features' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900">Features & GD&T Dimensions</h3>
                      </div>
                      <button
                        onClick={() => { setFeatureFormData({ feature_code: `DIM-00${features.length + 1}`, feature_name: '', feature_type: 'DIMENSION', nominal_value: '', upper_tolerance: '', lower_tolerance: '', unit: 'mm' }); setShowFeatureModal(true); }}
                        disabled={!selectedRevision}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <Plus size={13} /> Add Feature
                      </button>
                    </div>

                    {features.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <Ruler size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium mb-3">Belum ada fitur dimensi GD&T.</p>
                      </div>
                    ) : (
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-xs">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 bg-[#f8f9fa] text-gray-600">
                              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase">Code</th>
                              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase">Nama</th>
                              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase">Tipe</th>
                              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase">Nominal</th>
                              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase">Toleransi</th>
                              <th className="text-center px-4 py-3 text-[10px] font-bold uppercase">Unit</th>
                              <th className="text-center px-4 py-3 text-[10px] font-bold uppercase"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {features.map(feat => {
                              const ftype = FEATURE_TYPES.find(f => f.key === feat.feature_type) || FEATURE_TYPES[0];
                              return (
                                <tr key={feat.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                  <td className="px-4 py-3 font-mono font-bold text-[#714B67]">{feat.feature_code}</td>
                                  <td className="px-4 py-3 text-gray-900 font-semibold">{feat.feature_name}</td>
                                  <td className="px-4 py-3">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                                      {ftype.symbol} {ftype.label}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{feat.nominal_value != null ? feat.nominal_value : '-'}</td>
                                  <td className="px-4 py-3 text-right font-mono text-amber-700">
                                    {feat.upper_tolerance != null && feat.lower_tolerance != null
                                      ? `+${feat.upper_tolerance} / -${feat.lower_tolerance}`
                                      : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-center text-gray-500">{feat.unit || 'mm'}</td>
                                  <td className="px-4 py-3 text-center">
                                    <button
                                      onClick={() => handleDeleteFeature(feat.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ 6. RELATIONS TAB ══ */}
                {activeTab === 'relations' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 max-w-6xl">
                    <h3 className="text-sm font-bold text-gray-900 mb-2">Hierarki Drawing Relations (Parent-Child)</h3>
                    {relations.length === 0 ? (
                      <div className="border border-dashed border-gray-300 bg-white rounded-lg p-10 flex flex-col items-center justify-center text-center">
                        <Link2 size={32} className="text-gray-300 mb-2" />
                        <p className="text-xs text-gray-500 font-medium">Tidak ada child drawings yang terhubung.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {relations.map(rel => (
                          <div key={rel.id} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center">
                                <Package size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-gray-900">{rel.child?.code || 'Unknown'}</div>
                                <div className="text-[11px] text-gray-500">{rel.child?.name || ''}</div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeChildDrawing(rel.id).then(() => {
                                setRelations(prev => prev.filter(r => r.id !== rel.id));
                                toast.success('Relation removed');
                              })}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ═══ MODALS (ODOO STYLE DIALOGS) ═══ */}

      {/* ── 1. Create Revision Modal with Full ECN Form ── */}
      <Modal
        show={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Formulir Engineering Change Notice (ECN) & Revisi ISO"
        onSubmit={handleCreateRevision}
        submitLabel="Dokumentasikan ECN & Revisi"
        maxWidth="max-w-2xl"
      >
        <div className="bg-[#f8f9fa] p-3.5 rounded-lg border border-gray-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-gray-500 font-medium">Drawing Target:</div>
            <div className="text-sm font-bold text-gray-900">{selectedDrawing?.code} - {selectedDrawing?.name}</div>
          </div>
          <span className="bg-[#714B67]/10 text-[#714B67] border border-[#714B67]/20 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <ShieldCheck size={11} /> ISO 9001 Form
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <InputField
            label="Revision Code Baru"
            value={revFormData.revision_code}
            onChange={v => setRevFormData(p => ({ ...p, revision_code: v }))}
            placeholder="A, B, C atau 1.0, 2.0"
            required
          />
          <InputField
            label="Nomor Dokumen ECN"
            value={revFormData.ecn_number}
            onChange={v => setRevFormData(p => ({ ...p, ecn_number: v }))}
            placeholder="ECN-2026-XXXX (Otomatis jika kosong)"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SelectField
            label="Kategori Perubahan (Change Category)"
            value={revFormData.change_category}
            onChange={v => setRevFormData(p => ({ ...p, change_category: v }))}
            options={ECN_CATEGORIES.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))}
          />
          <InputField
            label="Tanggal Efektif Berlaku"
            type="date"
            value={revFormData.effective_date}
            onChange={v => setRevFormData(p => ({ ...p, effective_date: v }))}
          />
        </div>

        <TextArea
          label="Alasan / Latar Belakang Perubahan (Reason for Change)"
          value={revFormData.reason_for_change}
          onChange={v => setRevFormData(p => ({ ...p, reason_for_change: v }))}
          placeholder="Jelaskan pemicu revisi (misal: ECR pelanggan nomor 45, optimasi proses turning, pengetatan toleransi)..."
        />

        <TextArea
          label="Rincian / Ringkasan Perubahan Teknis (Technical Change Summary)"
          value={revFormData.description}
          onChange={v => setRevFormData(p => ({ ...p, description: v }))}
          placeholder="Rincian dimensi GD&T atau instruksi kerja yang diperbarui..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          <SelectField
            label="Disposisi Stok Berjalan / WIP (Material Disposition)"
            value={revFormData.disposition}
            onChange={v => setRevFormData(p => ({ ...p, disposition: v }))}
            options={DISPOSITIONS.map(d => ({ value: d.key, label: d.label }))}
          />
          <div className="flex flex-col justify-end">
            <label className="flex items-center gap-2 cursor-pointer py-2 text-xs font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={revFormData.tooling_impact}
                onChange={e => setRevFormData(p => ({ ...p, tooling_impact: e.target.checked }))}
                className="w-4 h-4 rounded text-[#714B67] border-gray-300"
              />
              Perlu Modifikasi Tooling / Jig / Cetakan
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-gray-200">
          <InputField
            label="Originator (Insinyur Pembuat)"
            value={revFormData.originator}
            onChange={v => setRevFormData(p => ({ ...p, originator: v }))}
            placeholder="Nama engineer"
          />
          <InputField
            label="QA Approver (Penanggung Jawab Mutu)"
            value={revFormData.approver}
            onChange={v => setRevFormData(p => ({ ...p, approver: v }))}
            placeholder="QA Manager"
          />
        </div>
      </Modal>

      {/* ── 2. ECN Certificate & Detail Viewer Modal ── */}
      {showEcnDetailModal && selectedEcnRevision && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-[9999] p-4" onClick={() => setShowEcnDetailModal(false)}>
          <div className="bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden text-gray-900" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-[#f8f9fa] shrink-0">
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={20} className="text-emerald-600" />
                <div>
                  <h3 className="text-base font-bold text-gray-900">Sertifikat Engineering Change Notice (ECN)</h3>
                  <p className="text-xs text-gray-500 font-mono">
                    {selectedEcnRevision.metadata?.ecn_number || `ECN-${selectedDrawing?.code}-REV-${selectedEcnRevision.revision_code}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowEcnDetailModal(false)} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 font-semibold">Drawing:</span>
                  <div className="font-bold text-gray-900">{selectedDrawing?.code}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Revision Target:</span>
                  <div className="font-bold text-[#00A09D]">Rev {selectedEcnRevision.revision_code}</div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Status ISO:</span>
                  <div className={`font-bold ${selectedEcnRevision.status === 'RELEASED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {selectedEcnRevision.status}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold">Tanggal Efektif:</span>
                  <div className="font-bold text-gray-900">{selectedEcnRevision.metadata?.effective_date || new Date().toISOString().split('T')[0]}</div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-[#714B67] uppercase tracking-wider">Kategori Perubahan</span>
                  <div className="text-sm font-semibold text-gray-900 mt-0.5">
                    {ECN_CATEGORIES.find(c => c.key === selectedEcnRevision.metadata?.change_category)?.label || 'Optimasi Desain'}
                  </div>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Alasan Perubahan (Reason for Change)</span>
                  <p className="text-xs text-gray-800 mt-1 bg-white p-3 rounded-md border border-gray-200">
                    {selectedEcnRevision.metadata?.reason_for_change || selectedEcnRevision.description || 'Rilis pembaruan gambar kerja'}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rincian Teknis Perubahan</span>
                  <p className="text-xs text-gray-800 mt-1 bg-white p-3 rounded-md border border-gray-200">
                    {selectedEcnRevision.description || 'Pembaruan dimensi dan toleransi'}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold">Disposisi Material WIP:</span>
                    <div className="text-xs font-bold text-amber-700 mt-0.5">
                      {DISPOSITIONS.find(d => d.key === selectedEcnRevision.metadata?.disposition)?.label || 'Use As Is'}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 font-semibold">Dampak Tooling:</span>
                    <div className="text-xs font-bold text-gray-900 mt-0.5">
                      {selectedEcnRevision.metadata?.tooling_impact ? '⚠️ Ya (Perlu Modifikasi Cetakan/Tooling)' : '✓ Tidak ada dampak tooling'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Award size={20} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-gray-900">Digital Approval Sign-Off</div>
                    <div className="text-[11px] text-gray-500">
                      Disetujui oleh: <strong className="text-emerald-700">{selectedEcnRevision.metadata?.approver || 'QA Manager'}</strong>
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-3 py-1 rounded bg-white text-gray-600 border border-gray-200">
                  ISO 9001 / IATF 16949 VERIFIED
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-200 shrink-0 bg-[#f8f9fa]">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-xs font-semibold rounded-md shadow-2xs transition-all cursor-pointer"
              >
                <Printer size={14} /> Cetak Lembar ECN
              </button>
              <button
                onClick={() => setShowEcnDetailModal(false)}
                className="px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-semibold rounded-md shadow-xs transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Select Master Part Modal ── */}
      <Modal show={showPartModal} onClose={() => setShowPartModal(false)} title="Hubungkan ke Master Part Number">
        <p className="text-xs text-gray-500 mb-3">Pilih Part Number yang sesuai dari database PLM:</p>
        <div className="max-h-60 overflow-y-auto space-y-1.5">
          {parts.map(p => (
            <button
              key={p.id}
              onClick={() => handleLinkPart(p)}
              className="w-full text-left p-2.5 rounded-md bg-[#f8f9fa] hover:bg-purple-50/50 border border-gray-200 hover:border-[#714B67]/40 transition-all flex items-center justify-between group cursor-pointer"
            >
              <div>
                <div className="text-xs font-bold text-gray-900 font-mono group-hover:text-[#714B67]">{p.code}</div>
                <div className="text-[11px] text-gray-500">{p.name} • {p.material || 'Material N/A'}</div>
              </div>
              <Check size={14} className="text-gray-300 group-hover:text-[#714B67]" />
            </button>
          ))}
        </div>
        <div className="pt-3 border-t border-gray-200 flex justify-end">
          <button
            onClick={() => { setShowPartModal(false); setShowCreatePartModal(true); }}
            className="text-xs font-bold text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> Buat Part Baru di Master
          </button>
        </div>
      </Modal>

      {/* ── 4. Create New Part Modal ── */}
      <Modal show={showCreatePartModal} onClose={() => setShowCreatePartModal(false)} title="Buat Master Part Baru" onSubmit={handleCreatePartAndLink} submitLabel="Simpan & Hubungkan">
        <InputField label="Part Code" value={partFormData.code} onChange={v => setPartFormData(p => ({ ...p, code: v }))} placeholder="PRT-001 (kosongkan untuk auto)" />
        <InputField label="Nama Part" value={partFormData.name} onChange={v => setPartFormData(p => ({ ...p, name: v }))} placeholder="Nama part komponen" required />
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Material" value={partFormData.material} onChange={v => setPartFormData(p => ({ ...p, material: v }))} placeholder="Al-6061 / SS-304" />
          <InputField label="Berat (kg)" value={partFormData.weight} onChange={v => setPartFormData(p => ({ ...p, weight: v }))} placeholder="0.25" />
        </div>
        <SelectField label="Tipe Part" value={partFormData.part_type} onChange={v => setPartFormData(p => ({ ...p, part_type: v }))}
          options={[{ value: 'COMPONENT', label: 'Component' }, { value: 'RAW_MATERIAL', label: 'Raw Material' }, { value: 'FINISHED_GOODS', label: 'Finished Goods' }]} />
      </Modal>

      {/* ── 5. Create Drawing Modal ── */}
      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Drawing Baru" onSubmit={handleCreateDrawing} submitLabel="Buat Drawing">
        <InputField label="Kode Drawing" value={formData.code} onChange={v => setFormData(p => ({ ...p, code: v }))} placeholder="DRW-001 (kosongkan untuk auto-generate)" />
        <InputField label="Nama Drawing" value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} placeholder="Contoh: Flange Housing Detail" required />
        <SelectField label="Tipe Drawing" value={formData.drawing_type} onChange={v => setFormData(p => ({ ...p, drawing_type: v }))}
          options={DRAWING_TYPES.map(t => ({ value: t.key, label: t.label }))} />
        <TextArea label="Deskripsi" value={formData.description} onChange={v => setFormData(p => ({ ...p, description: v }))} placeholder="Deskripsi drawing (opsional)" />
      </Modal>

      {/* ── 6. Edit Drawing Modal ── */}
      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Drawing" onSubmit={handleUpdateDrawing} submitLabel="Simpan Perubahan">
        <InputField label="Kode Drawing" value={formData.code} onChange={v => setFormData(p => ({ ...p, code: v }))} placeholder="DRW-001" />
        <InputField label="Nama Drawing" value={formData.name} onChange={v => setFormData(p => ({ ...p, name: v }))} placeholder="Nama drawing" required />
        <SelectField label="Tipe Drawing" value={formData.drawing_type} onChange={v => setFormData(p => ({ ...p, drawing_type: v }))}
          options={DRAWING_TYPES.map(t => ({ value: t.key, label: t.label }))} />
        <TextArea label="Deskripsi" value={formData.description} onChange={v => setFormData(p => ({ ...p, description: v }))} placeholder="Deskripsi drawing" />
      </Modal>

      {/* ── 7. Create / Edit Balloon Modal ── */}
      <Modal show={showBalloonModal} onClose={() => setShowBalloonModal(false)} title="Detail Titik Balon Inspeksi" onSubmit={handleCreateBalloon} submitLabel="Simpan Balon">
        <InputField label="Nomor Balon" value={balloonFormData.balloon_number} onChange={v => setBalloonFormData(p => ({ ...p, balloon_number: v }))} placeholder="1, 2, 3..." required />
        
        {features.length > 0 && (
          <SelectField
            label="Hubungkan ke Feature / Dimensi (Opsional)"
            value={balloonFormData.target_feature_id || ''}
            onChange={v => setBalloonFormData(p => ({ ...p, target_feature_id: v || null }))}
            options={[
              { value: '', label: '-- Tanpa Dimensi (Standalone) --' },
              ...features.map(f => ({ value: f.id, label: `${f.feature_code}: ${f.feature_name} (${f.nominal_value || ''} ${f.unit || 'mm'})` }))
            ]}
          />
        )}

        <div className="grid grid-cols-2 gap-3">
          <InputField label="Posisi X (px)" type="number" value={balloonFormData.position_x} onChange={v => setBalloonFormData(p => ({ ...p, position_x: parseInt(v) || 0 }))} />
          <InputField label="Posisi Y (px)" type="number" value={balloonFormData.position_y} onChange={v => setBalloonFormData(p => ({ ...p, position_y: parseInt(v) || 0 }))} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider mb-1.5">Warna Balon</label>
            <input type="color" value={balloonFormData.color} onChange={e => setBalloonFormData(p => ({ ...p, color: e.target.value }))}
              className="w-full h-9 bg-white border border-gray-300 rounded-md cursor-pointer" />
          </div>
          <SelectField label="Simbol" value={balloonFormData.symbol} onChange={v => setBalloonFormData(p => ({ ...p, symbol: v }))}
            options={[{ value: 'CIRCLE', label: '● Circle' }, { value: 'SQUARE', label: '■ Square' }, { value: 'TRIANGLE', label: '▲ Triangle' }, { value: 'DIAMOND', label: '◆ Diamond' }]} />
        </div>
      </Modal>

      {/* ── 8. Create Feature Modal ── */}
      <Modal show={showFeatureModal} onClose={() => setShowFeatureModal(false)} title="Tambah Feature / Dimensi GD&T" onSubmit={handleCreateFeature} submitLabel="Tambah Feature">
        <div className="grid grid-cols-2 gap-3">
          <InputField label="Feature Code" value={featureFormData.feature_code} onChange={v => setFeatureFormData(p => ({ ...p, feature_code: v }))} placeholder="DIM-001" required />
          <SelectField label="Tipe" value={featureFormData.feature_type} onChange={v => setFeatureFormData(p => ({ ...p, feature_type: v }))}
            options={FEATURE_TYPES.map(f => ({ value: f.key, label: `${f.symbol} ${f.label}` }))} />
        </div>
        <InputField label="Nama Dimensi / Fitur" value={featureFormData.feature_name} onChange={v => setFeatureFormData(p => ({ ...p, feature_name: v }))} placeholder="Contoh: Internal Bore Diameter" required />
        <div className="grid grid-cols-3 gap-3">
          <InputField label="Nominal" type="number" value={featureFormData.nominal_value} onChange={v => setFeatureFormData(p => ({ ...p, nominal_value: v }))} placeholder="25.000" />
          <InputField label="Upper Tol. (+)" type="number" value={featureFormData.upper_tolerance} onChange={v => setFeatureFormData(p => ({ ...p, upper_tolerance: v }))} placeholder="0.100" />
          <InputField label="Lower Tol. (-)" type="number" value={featureFormData.lower_tolerance} onChange={v => setFeatureFormData(p => ({ ...p, lower_tolerance: v }))} placeholder="0.100" />
        </div>
        <SelectField label="Unit" value={featureFormData.unit} onChange={v => setFeatureFormData(p => ({ ...p, unit: v }))}
          options={[{ value: 'mm', label: 'mm' }, { value: 'inch', label: 'inch' }, { value: 'µm', label: 'µm' }, { value: '°', label: '° (degree)' }, { value: 'Ra', label: 'Ra (roughness)' }]} />
      </Modal>
    </div>
  );
}
