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
  Maximize2, Minimize2, Crosshair, Move, Image, FileUp, MousePointer, Boxes, Cpu,
  ShieldCheck, Award, Printer, FileSpreadsheet, CheckSquare, Wand2, FileSearch,
  HelpCircle, FileDown, BookOpen, ListOrdered, MousePointerClick, FileCheck,
  Camera, Star, ShieldAlert, Split, Calendar, MapPin, UserCheck
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import {
  getDrawings, createDrawing, updateDrawing, deleteDrawing,
  getDrawingRevisions, createDrawingRevision, releaseDrawingRevision,
  getDrawingBalloons, createDrawingBalloon, deleteDrawingBalloon,
  getDrawingFeatures, createDrawingFeature, deleteDrawingFeature,
  getDrawingRelations, addChildDrawing, removeChildDrawing,
  getParts, getPart, createPart,
  getLimitSamples, createLimitSample, updateLimitSample, deleteLimitSample,
  generateCode
} from '../utils/mavicorePLM';
import { convertPdfToImageDataUrl } from '../utils/pdfRenderService';
import { parseDxfContent } from '../utils/cadDxfRenderService';
import { templatesLocalDB, getTemplates, safeRetrieveLocalTemplates } from '../utils/supabaseTemplateDB';

// ─── Realistic Demo Product Photo Generator ───
const createDemoProductPhotoSvg = (type = 'flange', angle = 'Isometric 3D') => {
  if (type === 'shaft') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="bg" cx="50%" cy="50%" r="75%">
          <stop offset="0%" stop-color="%232a3447" />
          <stop offset="100%" stop-color="%230f172a" />
        </radialGradient>
        <linearGradient id="metal" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="%23cbd5e1"/>
          <stop offset="30%" stop-color="%23f8fafc"/>
          <stop offset="50%" stop-color="%2394a3b8"/>
          <stop offset="70%" stop-color="%23e2e8f0"/>
          <stop offset="100%" stop-color="%2364748b"/>
        </linearGradient>
        <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23fde047"/>
          <stop offset="100%" stop-color="%23ca8a04"/>
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="15" stdDeviation="20" flood-color="%23000000" flood-opacity="0.6"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" fill="url(%23bg)"/>
      <ellipse cx="400" cy="510" rx="320" ry="40" fill="%23000000" opacity="0.4"/>
      <!-- Precision Ground CNC Shaft -->
      <g filter="url(%23shadow)">
        <rect x="120" y="240" width="160" height="120" rx="8" fill="url(%23metal)" stroke="%23f8fafc" stroke-width="2"/>
        <rect x="280" y="200" width="240" height="200" rx="10" fill="url(%23metal)" stroke="%23f8fafc" stroke-width="2"/>
        <rect x="520" y="250" width="160" height="100" rx="8" fill="url(%23metal)" stroke="%23f8fafc" stroke-width="2"/>
        <!-- Bevels & Grooves -->
        <line x1="280" y1="200" x2="280" y2="400" stroke="%23475569" stroke-width="3"/>
        <line x1="520" y1="250" x2="520" y2="350" stroke="%23475569" stroke-width="3"/>
        <rect x="360" y="230" width="80" height="20" rx="4" fill="%23334155"/>
        <text x="375" y="245" fill="%2394a3b8" font-family="sans-serif" font-size="11" font-weight="bold">KEYWAY</text>
      </g>
      <!-- CNC Machine Finish Lines -->
      <line x1="120" y1="300" x2="680" y2="300" stroke="%23ffffff" opacity="0.4" stroke-width="2"/>
      <text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-size="20" font-weight="900">REAL PRODUCT PHOTO (CNC TURNED PART)</text>
      <text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="13">Item: Precision Ground Stepper Shaft | Mat: SUS304 Ground Finish | View: ${angle}</text>
      <rect x="40" y="520" width="180" height="36" rx="6" fill="%2310b981" opacity="0.9"/>
      <text x="55" y="543" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold">✓ 100% VISUAL QC PASSED</text>
    </svg>`;
  }
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
    <defs>
      <radialGradient id="bg" cx="50%" cy="50%" r="75%">
        <stop offset="0%" stop-color="%232a3447" />
        <stop offset="100%" stop-color="%230f172a" />
      </radialGradient>
      <linearGradient id="metalFlange" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23e2e8f0"/>
        <stop offset="35%" stop-color="%23f8fafc"/>
        <stop offset="60%" stop-color="%2394a3b8"/>
        <stop offset="100%" stop-color="%23475569"/>
      </linearGradient>
      <linearGradient id="anodizedInner" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="%23714B67"/>
        <stop offset="100%" stop-color="%234a2842"/>
      </linearGradient>
      <filter id="shadowFlange" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="20" stdDeviation="25" flood-color="%23000000" flood-opacity="0.65"/>
      </filter>
    </defs>
    <rect width="100%" height="100%" fill="url(%23bg)"/>
    <ellipse cx="400" cy="510" rx="260" ry="35" fill="%23000000" opacity="0.45"/>
    <!-- Flange Outer Disc -->
    <g filter="url(%23shadowFlange)">
      <ellipse cx="400" cy="310" rx="220" ry="170" fill="url(%23metalFlange)" stroke="%23ffffff" stroke-width="3"/>
      <ellipse cx="400" cy="305" rx="165" ry="125" fill="none" stroke="%2394a3b8" stroke-dasharray="8,6" stroke-width="2"/>
      <!-- Inner Anodized Bore -->
      <ellipse cx="400" cy="310" rx="100" ry="75" fill="url(%23anodizedInner)" stroke="%23f8fafc" stroke-width="2"/>
      <ellipse cx="400" cy="310" rx="50" ry="38" fill="%230f172a" stroke="%2338bdf8" stroke-width="2"/>
      <!-- 4 PCD Bolt Holes -->
      <ellipse cx="400" cy="180" rx="18" ry="14" fill="%230f172a" stroke="%23cbd5e1" stroke-width="2"/>
      <ellipse cx="400" cy="430" rx="18" ry="14" fill="%230f172a" stroke="%23cbd5e1" stroke-width="2"/>
      <ellipse cx="235" cy="310" rx="18" ry="14" fill="%230f172a" stroke="%23cbd5e1" stroke-width="2"/>
      <ellipse cx="565" cy="310" rx="18" ry="14" fill="%230f172a" stroke="%23cbd5e1" stroke-width="2"/>
    </g>
    <text x="40" y="60" fill="%23f8fafc" font-family="sans-serif" font-size="20" font-weight="900">REAL PRODUCT PHOTO (MACHINED FLANGE)</text>
    <text x="40" y="90" fill="%2394a3b8" font-family="sans-serif" font-size="13">Item: Hydraulic Flange Housing | Mat: AL-6061-T6 Anodized | View: ${angle}</text>
    <rect x="40" y="520" width="180" height="36" rx="6" fill="%2310b981" opacity="0.9"/>
    <text x="55" y="543" fill="%23ffffff" font-family="sans-serif" font-size="12" font-weight="bold">✓ 100% VISUAL QC PASSED</text>
  </svg>`;
};

// ─── Defect Categories Config (Limit Sample / Boundary Standard) ───
const DEFECT_CATEGORIES = [
  { key: 'SCRATCH', label: 'Goresan (Scratch / Scuff)', icon: '⚡', color: '#f59e0b' },
  { key: 'BURR', label: 'Geram / Ketajaman Sisi (Burr / Sharp Edge)', icon: '🔪', color: '#ef4444' },
  { key: 'DENT', label: 'Penyok / Benturan (Dent / Impact Mark)', icon: '🔨', color: '#8b5cf6' },
  { key: 'BLOWHOLE', label: 'Porositas / Pinhole (Casting Defect)', icon: '🫧', color: '#06b6d4' },
  { key: 'COLOR', label: 'Warna / Anodizing Tone (Discoloration)', icon: '🎨', color: '#ec4899' },
  { key: 'FLASH', label: 'Flash / Sirip Plastik / Parting Line', icon: '📐', color: '#10b981' },
  { key: 'OTHER', label: 'Cacat Visual Lainnya', icon: '🔍', color: '#64748b' },
];

// ─── Limit Sample Demo SVG Generator (OK vs NG Visual Boundaries) ───
const createDemoLimitSampleSvgs = (defectKey = 'SCRATCH', type = 'OK') => {
  const isOk = type === 'OK';
  const bgColor = isOk ? '%23064e3b' : '%237f1d1d';
  const borderColor = isOk ? '%2310b981' : '%23ef4444';
  const badgeText = isOk ? '🟢 BATAS DITERIMA (OK LIMIT)' : '🔴 BATAS DITOLAK (NG LIMIT)';

  if (defectKey === 'SCRATCH') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
      <defs>
        <linearGradient id="metalBg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23334155"/>
          <stop offset="50%" stop-color="%2364748b"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(%23metalBg1)"/>
      <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
      <!-- Part Surface Mockup -->
      <rect x="50" y="70" width="500" height="290" rx="6" fill="%23475569" stroke="%2394a3b8" stroke-width="1.5"/>
      ${isOk
        ? `<!-- Hairline Scratch (Acceptable) -->
           <path d="M 180 190 Q 220 200 260 195" stroke="%23cbd5e1" stroke-width="1" opacity="0.6" stroke-dasharray="4,2"/>
           <circle cx="220" cy="195" r="30" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="3,3"/>
           <text x="260" y="170" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Panjang < 10mm, Kedalaman < 0.05mm (OK)</text>`
        : `<!-- Severe Deep Scratch (Reject) -->
           <path d="M 140 170 Q 280 240 420 200" stroke="%23ffffff" stroke-width="4.5"/>
           <path d="M 140 170 Q 280 240 420 200" stroke="%23ef4444" stroke-width="2"/>
           <circle cx="280" cy="210" r="50" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
           <text x="240" y="145" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Goresan Dalam > 0.2mm Menembus Lapisan (REJECT)</text>`
      }
      <!-- Header Badge -->
      <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
      <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
      <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Goresan Permukaan (Surface Scratch)</text>
      <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
    </svg>`;
  }

  if (defectKey === 'BURR') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
      <defs>
        <linearGradient id="metalBg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="%23334155"/>
          <stop offset="50%" stop-color="%2364748b"/>
          <stop offset="100%" stop-color="%231e293b"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(%23metalBg2)"/>
      <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
      <!-- Edge Chamfer Mockup -->
      <path d="M 80 320 L 80 180 L 250 180 L 320 250 L 520 250 L 520 320 Z" fill="%23475569" stroke="%2394a3b8" stroke-width="2"/>
      ${isOk
        ? `<!-- Smooth Chamfer with micro burr <= 0.05mm (OK) -->
           <circle cx="285" cy="215" r="30" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="4,2"/>
           <text x="325" y="200" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Burr Chamfer <= 0.05 mm (Halus / Diterima)</text>`
        : `<!-- Sharp Ragged Burr >= 0.3mm (NG) -->
           <path d="M 280 210 L 290 195 L 298 215 L 310 200 L 320 220" stroke="%23ef4444" stroke-width="4" fill="none"/>
           <circle cx="300" cy="210" r="40" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
           <text x="310" y="175" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Geram Tajam > 0.3 mm Melukai Tangan (REJECT)</text>`
      }
      <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
      <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
      <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Geram / Ketajaman Tepi (Edge Burr)</text>
      <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
    </svg>`;
  }

  // Default Blowhole / Porosity
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 450" width="600" height="450">
    <defs>
      <linearGradient id="metalBg3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="%23334155"/>
        <stop offset="50%" stop-color="%2364748b"/>
        <stop offset="100%" stop-color="%231e293b"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(%23metalBg3)"/>
    <rect x="20" y="20" width="560" height="410" rx="8" fill="none" stroke="${borderColor}" stroke-width="3"/>
    <circle cx="300" cy="230" r="130" fill="%23475569" stroke="%2394a3b8" stroke-width="2"/>
    ${isOk
      ? `<!-- Single isolated pinhole <= 0.3mm (OK) -->
         <circle cx="280" cy="210" r="2" fill="%230f172a" stroke="%2310b981" stroke-width="1.5"/>
         <circle cx="280" cy="210" r="25" fill="none" stroke="%2310b981" stroke-width="2" stroke-dasharray="3,3"/>
         <text x="315" y="195" fill="%2310b981" font-family="sans-serif" font-size="12" font-weight="bold">Pinhole Tunggal Ø <= 0.3 mm (Diterima)</text>`
      : `<!-- Cluster blowhole > 1.5mm (NG) -->
         <circle cx="270" cy="210" r="8" fill="%230f172a"/>
         <circle cx="290" cy="225" r="12" fill="%230f172a"/>
         <circle cx="310" cy="205" r="6" fill="%230f172a"/>
         <circle cx="290" cy="215" r="45" fill="none" stroke="%23ef4444" stroke-width="2.5"/>
         <text x="230" y="150" fill="%23ef4444" font-family="sans-serif" font-size="12" font-weight="bold">Cluster Porositas Porous Ø > 1.5 mm (REJECT)</text>`
    }
    <rect x="20" y="20" width="560" height="40" fill="${bgColor}"/>
    <text x="40" y="46" fill="%23ffffff" font-family="sans-serif" font-size="14" font-weight="900">${badgeText}</text>
    <text x="40" y="390" fill="%23f8fafc" font-family="sans-serif" font-size="12">Kategori: Porositas Pengecoran (Cast Blowhole)</text>
    <text x="40" y="410" fill="%2394a3b8" font-family="sans-serif" font-size="10">Standar ISO/IATF Visual Master Boundary</text>
  </svg>`;
};

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

// ─── Complete Industrial BOM Templates (Multi-Level Engineering Assemblies) ───
const BOM_TEMPLATES = [
  {
    id: 'bom_hyd_flange',
    name: 'Precision Hydraulic Flange Assembly',
    code: 'ASM-FLG-450',
    category: 'Hydraulics & Precision Machining',
    drawingType: 'ASSEMBLY',
    description: 'Unit perakitan flange hidrolik presisi tinggi dengan sealing O-Ring ganda dan bearing penopang poros stepper.',
    totalParts: 5,
    items: [
      { itemNo: '01', partCode: 'PRT-FLG-01', partName: 'Main Cast Housing Flange', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'AL-6061-T6', weight: '0.450', balloonRef: '#1', notes: 'CNC Milled & Anodized Silver' },
      { itemNo: '02', partCode: 'PRT-SFT-02', partName: 'Precision Stepper Drive Shaft', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'SUS-304', weight: '0.280', balloonRef: '#2', notes: 'Ground OD Ø25.00 ±0.005' },
      { itemNo: '03', partCode: 'PRT-BRG-03', partName: 'Deep Groove Ball Bearing 6002-2RS', type: 'STANDARD_PART', qty: 2, unit: 'PCS', material: 'Chrome Steel GCr15', weight: '0.065', balloonRef: '#3', notes: 'JIS B 1521 Standard' },
      { itemNo: '04', partCode: 'PRT-SL-04', partName: 'Hydraulic O-Ring NBR-70 Ø25x2.5', type: 'STANDARD_PART', qty: 1, unit: 'PCS', material: 'Nitrile Rubber NBR-70', weight: '0.005', balloonRef: '#4', notes: 'ISO 3601-1 Sealing' },
      { itemNo: '05', partCode: 'PRT-FST-05', partName: 'Hex Socket Head Cap Bolt M6x20 Gr 8.8', type: 'STANDARD_PART', qty: 4, unit: 'PCS', material: 'Carbon Steel (Black Oxide)', weight: '0.012', balloonRef: '#5', notes: 'DIN 912 / ISO 4762' },
    ]
  },
  {
    id: 'bom_gearbox_unit',
    name: 'Dual Stage Planetary Gearbox Transmission',
    code: 'ASM-GBX-100',
    category: 'Automotive & Power Transmission',
    drawingType: 'ASSEMBLY',
    description: 'Unit transmisi gearbox planetary rasio 5:1 untuk aplikasi robotika dan otomotif bertorsi tinggi.',
    totalParts: 6,
    items: [
      { itemNo: '01', partCode: 'PRT-GBX-CASING', partName: 'Die-Cast Planetary Gearbox Housing', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'ADC-12 Aluminium', weight: '0.850', balloonRef: '#1', notes: 'Shot blasted & Powder Coated' },
      { itemNo: '02', partCode: 'PRT-GEAR-SUN', partName: 'Sun Input Gear Mod 1.5 24T', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'SCM-415 (Carburized)', weight: '0.190', balloonRef: '#2', notes: 'Heat Treated HRC 58-62' },
      { itemNo: '03', partCode: 'PRT-GEAR-PLANET', partName: 'Planetary Gear Cluster 18T', type: 'COMPONENT', qty: 3, unit: 'PCS', material: 'SCM-415 (Carburized)', weight: '0.120', balloonRef: '#3', notes: 'Needle roller fitted bore' },
      { itemNo: '04', partCode: 'PRT-PIN-01', partName: 'Planetary Carrier Dowel Pin Ø6x30', type: 'STANDARD_PART', qty: 3, unit: 'PCS', material: 'SUJ2 Hardened Steel', weight: '0.015', balloonRef: '#4', notes: 'Tolerance m6 fit' },
      { itemNo: '05', partCode: 'PRT-OIL-SL', partName: 'Rotary Oil Seal TC 20x35x7', type: 'STANDARD_PART', qty: 1, unit: 'PCS', material: 'FKM Viton', weight: '0.008', balloonRef: '#5', notes: 'High temp resistant 180°C' },
      { itemNo: '06', partCode: 'PRT-LUB-01', partName: 'Synthetic Gear Lubricant EP-2', type: 'RAW_MATERIAL', qty: 0.05, unit: 'KG', material: 'Synthetic Grease EP-2', weight: '0.050', balloonRef: '#6', notes: 'Factory Filled 50ml' },
    ]
  },
  {
    id: 'bom_sheet_enclosure',
    name: 'Industrial IP65 Control Box Enclosure',
    code: 'ASM-ENC-800',
    category: 'Sheet Metal & Enclosure',
    drawingType: 'ASSEMBLY',
    description: 'Kotak panel kontrol elektrik industri dengan standar proteksi tahan cuaca IP65 dan grounding terisolasi.',
    totalParts: 5,
    items: [
      { itemNo: '01', partCode: 'PRT-SHT-BASE', partName: 'Base Enclosure Chassis 2.0mm', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'SPCC Cold Rolled Steel', weight: '1.450', balloonRef: '#1', notes: 'CNC Laser Cut & Bended' },
      { itemNo: '02', partCode: 'PRT-SHT-TOP', partName: 'Top Cover Panel 1.5mm', type: 'COMPONENT', qty: 1, unit: 'PCS', material: 'SPCC Cold Rolled Steel', weight: '0.780', balloonRef: '#2', notes: 'Powder Coated RAL 7035 Grey' },
      { itemNo: '03', partCode: 'PRT-GSK-01', partName: 'EPDM Continuous Sealing Gasket Strip', type: 'RAW_MATERIAL', qty: 1.2, unit: 'MTR', material: 'EPDM Sponge Rubber', weight: '0.040', balloonRef: '#3', notes: 'Self-adhesive waterproof profile' },
      { itemNo: '04', partCode: 'PRT-PEM-M4', partName: 'PEM Self-Clinching Standoff M4x10', type: 'STANDARD_PART', qty: 8, unit: 'PCS', material: 'Zinc Plated Steel', weight: '0.003', balloonRef: '#4', notes: 'Hydraulic Pressed to sheet' },
      { itemNo: '05', partCode: 'PRT-LCH-01', partName: 'Quarter-Turn Cam Latch Lock Key', type: 'STANDARD_PART', qty: 2, unit: 'SET', material: 'Zinc Alloy Die-Cast', weight: '0.085', balloonRef: '#5', notes: 'IP65 Rated Key Lock' },
    ]
  }
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

// ─── Reusable Modal & Form Components (Module Level to Prevent Re-mount Loss of Focus) ───
const Modal = ({ show, onClose, title, children, onSubmit, submitLabel = 'Simpan', maxWidth = 'max-w-xl', allowFullscreen = false }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else if (onClose) {
          onClose();
        }
      }
    };
    if (show) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [show, isFullscreen, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center ${isFullscreen ? 'p-0' : 'p-3 sm:p-6'} animate-in fade-in duration-150`}>
      <div
        className={`bg-white text-gray-900 flex flex-col shadow-2xl transition-all duration-150 ${
          isFullscreen
            ? 'fixed inset-0 w-screen h-screen max-w-none max-h-none rounded-none z-[99999]'
            : `w-full ${maxWidth} max-h-[90vh] rounded-xl border border-gray-200`
        }`}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header with Prominent Action Buttons */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 border-b border-gray-200 bg-[#f8f9fa] shadow-2xs shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{title}</h3>
            {isFullscreen && (
              <span className="text-[10px] font-bold bg-[#714B67]/10 text-[#714B67] px-2 py-0.5 rounded border border-[#714B67]/20">
                Mode Layar Penuh
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {allowFullscreen && (
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-md shadow-2xs transition-all cursor-pointer"
                title={isFullscreen ? 'Keluar Layar Penuh (Restore Window)' : 'Perbesar Layar Penuh (Fullscreen)'}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 size={15} className="text-[#714B67]" />
                    <span>Perkecil</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={15} className="text-[#714B67]" />
                    <span>Layar Penuh</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsFullscreen(false);
                if (onClose) onClose();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs transition-all cursor-pointer"
              title="Tutup Modal (Esc)"
            >
              <X size={15} />
              <span>Tutup</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 bg-white">
          {children}
        </div>

        {/* Sticky Footer */}
        {onSubmit ? (
          <div className="sticky bottom-0 z-30 flex items-center justify-end gap-2 px-6 py-3 border-t border-gray-200 bg-[#f8f9fa] shrink-0">
            <button
              type="button"
              onClick={() => { setIsFullscreen(false); if (onClose) onClose(); }}
              className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-200 cursor-pointer transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSubmit}
              className="px-5 py-2 text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white rounded-md shadow-xs transition-all cursor-pointer"
            >
              {submitLabel}
            </button>
          </div>
        ) : isFullscreen ? (
          <div className="sticky bottom-0 z-30 flex items-center justify-between px-6 py-2.5 border-t border-gray-200 bg-[#f8f9fa] shrink-0 text-xs text-gray-500">
            <span>💡 Tekan tombol <strong>Esc</strong> pada keyboard untuk keluar layar penuh</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="font-bold text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Minimize2 size={13} /> Keluar Layar Penuh (Perkecil)
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange, placeholder, type = 'text', required = false, autoFocus = false }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20 transition-all"
    />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{label}</label>
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20 transition-all cursor-pointer"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const TextArea = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">{label}</label>
    <textarea
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20 transition-all resize-none"
    />
  </div>
);

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
  const [allTemplates, setAllTemplates] = useState([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

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
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showBomTemplateModal, setShowBomTemplateModal] = useState(false);
  const [selectedBomTemplate, setSelectedBomTemplate] = useState(BOM_TEMPLATES[0]);
  const [activeHelpTab, setActiveHelpTab] = useState('workflow');

  // Product Photo Gallery State
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [photoEditData, setPhotoEditData] = useState({ index: 0, label: '', angle: 'Depan (Front)' });
  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Limit Sample (Sampel Batas Mutu) State
  const [limitSamples, setLimitSamples] = useState([]);
  const [showCreateLimitSampleModal, setShowCreateLimitSampleModal] = useState(false);
  const [showLimitSampleDetailModal, setShowLimitSampleDetailModal] = useState(false);
  const [selectedLimitSample, setSelectedLimitSample] = useState(null);
  const [showPrintTagModal, setShowPrintTagModal] = useState(false);
  const [limitSampleFormData, setLimitSampleFormData] = useState({
    code: '',
    title: '',
    defect_category: 'SCRATCH',
    ok_photo_url: null,
    ok_criteria: 'Batas goresan halus (hairline scratch) panjang < 10mm, kedalaman < 0.05mm yang tidak mempengaruhi fungsi perakitan.',
    ng_photo_url: null,
    ng_criteria: 'Goresan dalam > 0.2mm yang menembus lapisan pelindung atau mengenai area permukaan bearing (Wajib REJECT).',
    effective_date: new Date().toISOString().split('T')[0],
    expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    storage_location: 'Rak QC Metrologi #01',
    qa_approver: 'QA Manager',
    customer_approver: 'Customer Quality Rep',
    notes: 'Disetujui bersama tim Quality Engineering & Customer untuk standar lot produksi tahun berjalan.'
  });
  const okPhotoInputRef = useRef(null);
  const ngPhotoInputRef = useRef(null);

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

  // ─── Load Check Sheet Templates (from Supabase & IndexedDB) ───
  const loadCheckSheetTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    try {
      const res = await getTemplates();
      const items = Array.isArray(res) ? res : (res?.items || []);
      if (items && items.length > 0) {
        setAllTemplates(items);
      } else {
        const local = await safeRetrieveLocalTemplates();
        setAllTemplates(local || []);
      }
    } catch (e) {
      console.warn('[DrawingManagement] getTemplates error, falling back to local DB:', e);
      const local = await safeRetrieveLocalTemplates();
      setAllTemplates(local || []);
    } finally {
      setIsLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    loadCheckSheetTemplates();
  }, [loadCheckSheetTemplates]);

  // ─── Connected Check Sheets for Selected Drawing ───
  const connectedCheckSheets = useMemo(() => {
    if (!selectedDrawing || !allTemplates || allTemplates.length === 0) return [];
    const dwgId = String(selectedDrawing.id || '').toLowerCase();
    const dwgCode = String(selectedDrawing.code || '').trim().toLowerCase();
    const dwgName = String(selectedDrawing.name || '').trim().toLowerCase();

    return allTemplates.filter(t => {
      const tId = String(t.drawingId || t.drawing_id || '').toLowerCase();
      const tDocNo = String(t.docNo || t.doc_no || '').trim().toLowerCase();
      const tDwgNo = String(t.drawingNo || t.drawing_no || '').trim().toLowerCase();
      const tPartNo = String(t.partNo || t.part_no || '').trim().toLowerCase();
      const tName = String(t.name || t.title || '').trim().toLowerCase();

      const matchId = tId && (tId === dwgId || tId === dwgCode);
      const matchDocNo = dwgCode && (tDocNo === dwgCode || tDocNo.includes(dwgCode));
      const matchDwgNo = dwgCode && (tDwgNo === dwgCode || tDwgNo.includes(dwgCode));
      const matchPartNo = dwgCode && (tPartNo === dwgCode);
      const matchName = (dwgCode && tName.includes(dwgCode)) || (dwgName && tName.includes(dwgName));

      return matchId || matchDocNo || matchDwgNo || matchPartNo || matchName;
    });
  }, [selectedDrawing, allTemplates]);

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
      const [revs, rels, ls] = await Promise.all([
        getDrawingRevisions(drawing.id),
        getDrawingRelations(drawing.id),
        getLimitSamples(drawing.id)
      ]);
      setRevisions(revs || []);
      setRelations(rels || []);
      setLimitSamples(ls || []);

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
          } catch {
            // LocalStorage quota fallback
          }
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
      } catch {
        // LocalStorage quota fallback
      }

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

  // ─── Product Photos Memo & Handlers ───
  const productPhotos = useMemo(() => {
    if (!selectedDrawing) return [];
    if (Array.isArray(selectedDrawing.product_photos)) return selectedDrawing.product_photos;
    try {
      const stored = localStorage.getItem(`mandor_drawing_photos_${selectedDrawing.id}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  }, [selectedDrawing]);

  const handleAddProductPhotos = async (files) => {
    if (!files || files.length === 0 || !selectedDrawing) return;
    const newPhotos = [...productPhotos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      newPhotos.push({
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: file.name,
        url: dataUrl,
        label: newPhotos.length === 0 ? 'Foto Utama (Primary)' : cleanName || `Foto #${newPhotos.length + 1}`,
        angle: newPhotos.length === 0 ? 'Depan (Front)' : 'Isometric 3D',
        date: new Date().toISOString(),
        isPrimary: newPhotos.length === 0
      });
    }

    try {
      localStorage.setItem(`mandor_drawing_photos_${selectedDrawing.id}`, JSON.stringify(newPhotos));
    } catch {}

    const updated = await updateDrawing(selectedDrawing.id, { product_photos: newPhotos });
    if (updated.success) {
      setSelectedDrawing(prev => ({ ...prev, product_photos: newPhotos }));
      setDrawings(prev => prev.map(d => d.id === selectedDrawing.id ? { ...d, product_photos: newPhotos } : d));
    }
    toast.success(`✓ ${files.length} Foto produk berhasil ditambahkan!`);
    if (photoInputRef.current) photoInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const handleDeleteProductPhoto = async (indexToDelete) => {
    if (!selectedDrawing) return;
    const newPhotos = productPhotos.filter((_, idx) => idx !== indexToDelete);
    if (newPhotos.length > 0 && !newPhotos.some(p => p.isPrimary)) {
      newPhotos[0].isPrimary = true;
    }
    try {
      localStorage.setItem(`mandor_drawing_photos_${selectedDrawing.id}`, JSON.stringify(newPhotos));
    } catch {}
    await updateDrawing(selectedDrawing.id, { product_photos: newPhotos });
    setSelectedDrawing(prev => ({ ...prev, product_photos: newPhotos }));
    setDrawings(prev => prev.map(d => d.id === selectedDrawing.id ? { ...d, product_photos: newPhotos } : d));
    if (selectedPhotoIndex >= newPhotos.length) {
      setSelectedPhotoIndex(Math.max(0, newPhotos.length - 1));
    }
    toast.success('Foto produk dihapus');
  };

  const handleSetPrimaryPhoto = async (indexToPrimary) => {
    if (!selectedDrawing) return;
    const newPhotos = productPhotos.map((p, idx) => ({
      ...p,
      isPrimary: idx === indexToPrimary
    }));
    try {
      localStorage.setItem(`mandor_drawing_photos_${selectedDrawing.id}`, JSON.stringify(newPhotos));
    } catch {}
    await updateDrawing(selectedDrawing.id, { product_photos: newPhotos });
    setSelectedDrawing(prev => ({ ...prev, product_photos: newPhotos }));
    setDrawings(prev => prev.map(d => d.id === selectedDrawing.id ? { ...d, product_photos: newPhotos } : d));
    toast.success('Foto utama produk berhasil diatur!');
  };

  const handleOpenEditPhoto = (photo, index) => {
    setPhotoEditData({
      index,
      label: photo.label || `Foto #${index + 1}`,
      angle: photo.angle || 'Depan (Front)'
    });
    setShowPhotoEditModal(true);
  };

  const handleSavePhotoEdit = async () => {
    if (!selectedDrawing) return;
    const newPhotos = productPhotos.map((p, idx) =>
      idx === photoEditData.index ? { ...p, label: photoEditData.label, angle: photoEditData.angle } : p
    );
    try {
      localStorage.setItem(`mandor_drawing_photos_${selectedDrawing.id}`, JSON.stringify(newPhotos));
    } catch {}
    await updateDrawing(selectedDrawing.id, { product_photos: newPhotos });
    setSelectedDrawing(prev => ({ ...prev, product_photos: newPhotos }));
    setDrawings(prev => prev.map(d => d.id === selectedDrawing.id ? { ...d, product_photos: newPhotos } : d));
    setShowPhotoEditModal(false);
    toast.success('Keterangan foto diperbarui');
  };

  const handleLoadSampleProductPhotos = async () => {
    if (!selectedDrawing) return;
    const isShaft = selectedDrawing.name?.toLowerCase().includes('shaft') || selectedDrawing.code?.toLowerCase().includes('sft');
    const type = isShaft ? 'shaft' : 'flange';
    const sample1 = createDemoProductPhotoSvg(type, 'Isometric 3D');
    const sample2 = createDemoProductPhotoSvg(type, 'Tampak Depan (Front View)');
    const sample3 = createDemoProductPhotoSvg(type, 'Close-Up Detail QC Toleransi');

    const samplePhotos = [
      {
        id: `photo_${Date.now()}_1`,
        name: `${type.toUpperCase()}_Isometric_View.svg`,
        url: sample1,
        label: isShaft ? 'Precision Stepper Shaft - Isometric 3D' : 'Hydraulic Flange Housing - Isometric 3D',
        angle: 'Isometric 3D',
        date: new Date().toISOString(),
        isPrimary: true
      },
      {
        id: `photo_${Date.now()}_2`,
        name: `${type.toUpperCase()}_Front_View.svg`,
        url: sample2,
        label: isShaft ? 'Precision Stepper Shaft - Tampak Depan' : 'Hydraulic Flange Housing - Tampak Depan',
        angle: 'Depan (Front)',
        date: new Date().toISOString(),
        isPrimary: false
      },
      {
        id: `photo_${Date.now()}_3`,
        name: `${type.toUpperCase()}_QC_Detail.svg`,
        url: sample3,
        label: isShaft ? 'Area Grinding & Chamfer Poros' : 'Detail Lubang Baut PCD & Surface Finish',
        angle: 'Detail QC Permukaan',
        date: new Date().toISOString(),
        isPrimary: false
      }
    ];

    try {
      localStorage.setItem(`mandor_drawing_photos_${selectedDrawing.id}`, JSON.stringify(samplePhotos));
    } catch {}
    await updateDrawing(selectedDrawing.id, { product_photos: samplePhotos });
    setSelectedDrawing(prev => ({ ...prev, product_photos: samplePhotos }));
    setDrawings(prev => prev.map(d => d.id === selectedDrawing.id ? { ...d, product_photos: samplePhotos } : d));
    setSelectedPhotoIndex(0);
    toast.success(`✓ 3 Contoh Foto Produk Riil Manufaktur berhasil dimuat!`);
  };

  // ─── Limit Sample (Sampel Batas Mutu) Handlers ───
  const handleCreateLimitSample = async () => {
    if (!selectedDrawing) return;
    if (!limitSampleFormData.title) {
      toast.error('Judul Limit Sample wajib diisi');
      return;
    }

    const code = limitSampleFormData.code || `LS-${selectedDrawing.code || 'PRT'}-${limitSamples.length + 1}`;
    const okPhoto = limitSampleFormData.ok_photo_url || createDemoLimitSampleSvgs(limitSampleFormData.defect_category, 'OK');
    const ngPhoto = limitSampleFormData.ng_photo_url || createDemoLimitSampleSvgs(limitSampleFormData.defect_category, 'NG');

    const newSample = {
      code,
      title: limitSampleFormData.title,
      defect_category: limitSampleFormData.defect_category,
      drawing_id: selectedDrawing.id,
      part_id: selectedDrawing.metadata?.part_id || null,
      ok_photo_url: okPhoto,
      ok_criteria: limitSampleFormData.ok_criteria,
      ng_photo_url: ngPhoto,
      ng_criteria: limitSampleFormData.ng_criteria,
      status: 'ACTIVE',
      effective_date: limitSampleFormData.effective_date,
      expiry_date: limitSampleFormData.expiry_date,
      storage_location: limitSampleFormData.storage_location,
      qa_approver: limitSampleFormData.qa_approver,
      customer_approver: limitSampleFormData.customer_approver,
      notes: limitSampleFormData.notes
    };

    const res = await createLimitSample(newSample);
    if (res.success) {
      const updated = await getLimitSamples(selectedDrawing.id);
      setLimitSamples(updated);
      setShowCreateLimitSampleModal(false);
      toast.success(`✓ Limit Sample "${newSample.title}" berhasil didaftarkan!`);
    }
  };

  const handleDeleteLimitSample = async (id) => {
    if (!selectedDrawing) return;
    await deleteLimitSample(id, selectedDrawing.id);
    const updated = await getLimitSamples(selectedDrawing.id);
    setLimitSamples(updated);
    toast.success('Limit sample berhasil dihapus');
  };

  const handleLoadDemoLimitSamples = async () => {
    if (!selectedDrawing) return;
    const demoItems = [
      {
        code: `LS-${selectedDrawing.code || 'DWG'}-001`,
        title: 'Batas Goresan Permukaan Bodi Mesin (Scratch Boundary)',
        defect_category: 'SCRATCH',
        drawing_id: selectedDrawing.id,
        part_id: selectedDrawing.metadata?.part_id || null,
        ok_photo_url: createDemoLimitSampleSvgs('SCRATCH', 'OK'),
        ok_criteria: 'Hairline scratch halus panjang < 10 mm, kedalaman < 0.05 mm pada area non-kritis (Lolos / OK).',
        ng_photo_url: createDemoLimitSampleSvgs('SCRATCH', 'NG'),
        ng_criteria: 'Goresan dalam > 0.2 mm menembus lapisan atau melintasi dudukan bearing (Wajib REJECT).',
        status: 'ACTIVE',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        storage_location: 'Rak QC Metrologi Box #01',
        qa_approver: 'Budi Santoso (QA Lead)',
        customer_approver: 'Takeshi Tanaka (Customer QA Rep)',
        notes: 'Disetujui untuk lot perakitan tahun 2026 sesuai klausul IATF 16949.'
      },
      {
        code: `LS-${selectedDrawing.code || 'DWG'}-002`,
        title: 'Batas Ketajaman Sisi & Geram Chamfer (Burr Boundary)',
        defect_category: 'BURR',
        drawing_id: selectedDrawing.id,
        part_id: selectedDrawing.metadata?.part_id || null,
        ok_photo_url: createDemoLimitSampleSvgs('BURR', 'OK'),
        ok_criteria: 'Tepi chamfer halus, micro burr <= 0.05 mm yang tidak melukai tangan operator (Lolos / OK).',
        ng_photo_url: createDemoLimitSampleSvgs('BURR', 'NG'),
        ng_criteria: 'Geram tajam bergerigi > 0.3 mm yang berisiko merobek seal hidrolik (Wajib REJECT).',
        status: 'ACTIVE',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        storage_location: 'Rak QC Metrologi Box #02',
        qa_approver: 'Budi Santoso (QA Lead)',
        customer_approver: 'Takeshi Tanaka (Customer QA Rep)',
        notes: 'Standar de-burring proses CNC Milling & Chamfering.'
      },
      {
        code: `LS-${selectedDrawing.code || 'DWG'}-003`,
        title: 'Batas Porositas & Pinhole Coran (Blowhole Boundary)',
        defect_category: 'BLOWHOLE',
        drawing_id: selectedDrawing.id,
        part_id: selectedDrawing.metadata?.part_id || null,
        ok_photo_url: createDemoLimitSampleSvgs('BLOWHOLE', 'OK'),
        ok_criteria: 'Pinhole tunggal terisolir dengan diameter <= 0.3 mm di luar area sealing (Lolos / OK).',
        ng_photo_url: createDemoLimitSampleSvgs('BLOWHOLE', 'NG'),
        ng_criteria: 'Cluster porositas berkelompok diameter > 1.5 mm yang berpotensi bocor fluida (Wajib REJECT).',
        status: 'ACTIVE',
        effective_date: new Date().toISOString().split('T')[0],
        expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
        storage_location: 'Rak QC Metrologi Box #03',
        qa_approver: 'Budi Santoso (QA Lead)',
        customer_approver: 'Takeshi Tanaka (Customer QA Rep)',
        notes: 'Standar coran aluminium die casting.'
      }
    ];

    for (const item of demoItems) {
      await createLimitSample(item);
    }
    const updated = await getLimitSamples(selectedDrawing.id);
    setLimitSamples(updated);
    toast.success(`✓ 3 Master Limit Sample Industri berhasil dimuat!`);
  };

  const handleOpenPrintTag = (sample) => {
    setSelectedLimitSample(sample);
    setShowPrintTagModal(true);
  };

  const handleOpenLimitSampleDetail = (sample) => {
    setSelectedLimitSample(sample);
    setShowLimitSampleDetailModal(true);
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

  // ─── CRUD Handlers ───
  const handleCreateDrawing = async () => {
    if (!formData.name.trim()) { toast.error('Nama drawing wajib diisi'); return; }
    const code = formData.code.trim() || generateCode('DRW');
    const result = await createDrawing({ ...formData, code });
    if (result.success) {
      toast.success(`Drawing ${code} berhasil dibuat`);
      setShowCreateModal(false);
      setFormData({ name: '', code: '', drawing_type: 'DETAIL', description: '', file_url: null, file_name: null });
      await loadInitialData();
      if (result.data) {
        await selectDrawing(result.data);
      }
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
      await loadInitialData();
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
      await loadInitialData();
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
  const handleOpenInInspector = async () => {
    if (!selectedDrawing) {
      toast.error('Pilih drawing terlebih dahulu');
      return;
    }
    const revCode = selectedRevision?.revision_code || selectedDrawing.revision || selectedDrawing.revision_code || 'A';
    const effectiveImage = blueprintImage || selectedDrawing.file_url || selectedDrawing.thumbnail_url || null;

    const templateData = {
      id: `insp_${Date.now()}`,
      name: `${selectedDrawing.name || 'Drawing'} (Rev ${revCode})`,
      docNo: selectedDrawing.code || `DWG-${Date.now()}`,
      partNo: selectedPart?.code || selectedDrawing.code || '',
      partName: selectedPart?.name || selectedDrawing.name || '',
      revisionNo: revCode,
      drawingFileName: selectedDrawing.file_name || `${selectedDrawing.code || 'drawing'}.png`,
      drawingImageUrl: effectiveImage,
      drawingPreview: effectiveImage,
      drawingSvg: effectiveImage,
      drawingDataUrl: effectiveImage,
      svgData: effectiveImage,
      dataUrl: effectiveImage,
      drawingId: selectedDrawing.id,
      drawingName: selectedDrawing.name,
      checkPoints: (balloons && balloons.length > 0) ? balloons.map((b, i) => ({
        id: `cp_${b.id || i}`,
        pointNumber: parseInt(b.balloon_number) || (i + 1),
        title: b.target_feature?.feature_name || `Point ${b.balloon_number || (i + 1)}`,
        category: 'Linear Dimension',
        nominal: b.target_feature?.nominal_value || 0,
        tolMin: b.target_feature?.lower_tolerance || 0,
        tolMax: b.target_feature?.upper_tolerance || 0,
        unit: b.target_feature?.unit || 'mm',
        x: b.position_x || 100,
        y: b.position_y || 100,
        criticality: 'Major',
        inspectionMethod: 'Caliper'
      })) : []
    };

    // 1. Save to IndexedDB (No Quota Limit)
    try {
      if (templatesLocalDB) {
        await templatesLocalDB.templates.put(templateData);
      }
    } catch (dbErr) {
      console.warn('[DrawingManagement] IndexedDB template cache warning:', dbErr);
    }

    // 2. Save to sessionStorage
    try {
      sessionStorage.setItem('mandor_inspector_active_template', JSON.stringify(templateData));
    } catch (sErr) {
      console.warn('[DrawingManagement] sessionStorage warning:', sErr);
    }

    // 3. Save to localStorage (with quota fallback)
    try {
      localStorage.setItem('mandor_inspector_active_template', JSON.stringify(templateData));
    } catch (lsErr) {
      console.warn('[DrawingManagement] LocalStorage quota reached, saving lightweight metadata:', lsErr);
      try {
        const lightweight = {
          ...templateData,
          drawingImageUrl: null,
          drawingPreview: null,
          drawingSvg: null,
          drawingDataUrl: null,
          svgData: null,
          dataUrl: null
        };
        localStorage.setItem('mandor_inspector_active_template', JSON.stringify(lightweight));
      } catch (e) {
        console.warn('[DrawingManagement] LocalStorage metadata fallback warning:', e);
      }
    }

    toast.success('Membuka Inspector Designer Studio dengan blueprint ini...');
    navigate('/inspector-designer');
  };

  const getTypeConfig = (type) => DRAWING_TYPES.find(t => t.key === type) || DRAWING_TYPES[0];
  const getRevStatus = (status) => REV_STATUS[status] || REV_STATUS.DRAFT;

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
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs px-3 py-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            <HelpCircle size={14} className="text-amber-600" />
            Panduan & SOP
          </button>
          <button
            onClick={() => setShowBomTemplateModal(true)}
            className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-300 font-bold text-xs px-3 py-2 rounded-md shadow-xs transition-all cursor-pointer"
          >
            <Package size={14} className="text-indigo-600" />
            Template BOM Lengkap
          </button>
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
        </div>
      </div>

      {/* ═══ 2. MAIN WORKSPACE ═══ */}
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

          <div className="p-3 border-t border-gray-200 bg-[#f8f9fa] flex items-center gap-2">
            <button
              onClick={() => { setDrawingsPage(0); loadInitialData(searchTerm, 0); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-200/60 transition-all cursor-pointer"
            >
              <RefreshCw size={12} /> Refresh
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
              <div className="flex items-center justify-between px-6 border-b border-gray-200 bg-white shrink-0 overflow-x-auto">
                <div className="flex items-center gap-2">
                  {[
                    { key: 'canvas', label: 'Preview Blueprint (2D)', icon: FileText },
                    { 
                      key: 'checksheet', 
                      label: `Check Sheet (${connectedCheckSheets.length})`, 
                      icon: ClipboardCheck,
                      isConnected: connectedCheckSheets.length > 0
                    },
                    { key: 'photos', label: `Foto Produk (${productPhotos.length})`, icon: Camera },
                    { key: 'limit_sample', label: `Limit Sample (${limitSamples.length})`, icon: ShieldAlert },
                    { key: 'revisions', label: `Revisi & ECN (${revisions.length})`, icon: GitBranch },
                    { key: 'bom', label: 'Part & BOM Integration', icon: Boxes },
                    { key: 'relations', label: `Drawing Relations (${relations.length})`, icon: Link2 },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${activeTab === tab.key
                        ? 'border-[#714B67] text-[#714B67]'
                        : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon size={13} className={tab.key === 'checksheet' && tab.isConnected ? 'text-emerald-600' : ''} />
                      {tab.label}
                      {tab.key === 'checksheet' && (
                        <span 
                          className={`w-2 h-2 rounded-full inline-block ${tab.isConnected ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-amber-400'}`} 
                          title={tab.isConnected ? 'Sudah Terkoneksi Check Sheet' : 'Belum Terkoneksi'} 
                        />
                      )}
                    </button>
                  ))}
                </div>
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

                    {/* Canvas Area with Blueprint Image */}
                    <div
                      ref={canvasContainerRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 w-full h-full min-h-[450px] overflow-hidden flex items-center justify-center select-none relative transition-colors ${isDragOver ? 'bg-blue-950/40 border-2 border-dashed border-blue-500' : ''} ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                      onWheel={handleWheel}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
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
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ══ CHECK SHEET INTEGRATION TAB ══ */}
                {activeTab === 'checksheet' && (
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-6xl">
                    {/* Header Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold ${
                          connectedCheckSheets.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          <ClipboardCheck size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-base font-bold text-gray-900">
                              Digital Quality Check Sheet (ISO 17025 / IATF 16949)
                            </h3>
                            {connectedCheckSheets.length > 0 ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                <CheckCircle2 size={12} className="text-emerald-600" /> Terkoneksi ({connectedCheckSheets.length} Check Sheet)
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                <AlertTriangle size={12} className="text-amber-600" /> Belum Terkoneksi
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Status integrasi blueprint drawing dengan lembar pemeriksaan dimensi digital & parameter toleransi GD&T.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={loadCheckSheetTemplates}
                          disabled={isLoadingTemplates}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                        >
                          <RefreshCw size={13} className={isLoadingTemplates ? 'animate-spin' : ''} /> Refresh
                        </button>
                        <button
                          onClick={handleOpenInInspector}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#00A09D] hover:bg-[#008784] text-white rounded-md text-xs font-bold shadow-xs transition-all cursor-pointer"
                        >
                          <FileCode size={13} /> {connectedCheckSheets.length > 0 ? 'Edit di Inspector Studio ➔' : '+ Buat Check Sheet Baru ➔'}
                        </button>
                      </div>
                    </div>

                    {/* Content Section: Connected Check Sheets List or Empty State */}
                    {connectedCheckSheets.length > 0 ? (
                      <div className="space-y-4">
                        {connectedCheckSheets.map((cs, index) => {
                          const pts = cs.checkPoints || cs.points || [];
                          return (
                            <div
                              key={cs.id || index}
                              className="bg-white border-2 border-emerald-500/30 rounded-xl p-6 shadow-xs space-y-5 hover:border-emerald-500 transition-colors"
                            >
                              {/* Card Header */}
                              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-gray-100">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white tracking-wider">
                                      {cs.status || 'Active Check Sheet'}
                                    </span>
                                    <span className="text-xs font-mono font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                      No. Dokumen: <strong className="text-gray-900">{cs.docNo || cs.id || cs.doc_no || 'CS-AUTO'}</strong>
                                    </span>
                                  </div>
                                  <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    {cs.name || cs.title || `${selectedDrawing.name} Check Sheet`}
                                  </h4>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => navigate(`/inspector-designer?edit=${encodeURIComponent(cs.id || cs.docNo || '')}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white shadow-xs transition-all cursor-pointer"
                                    title="Buka & Edit Check Sheet di Inspector Designer Studio"
                                  >
                                    <Edit3 size={13} /> Edit di Inspector Studio
                                  </button>
                                  <button
                                    onClick={() => navigate(`/drawing-checksheet?fromDrawing=true&code=${encodeURIComponent(selectedDrawing.code)}`)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
                                    title="Mulai Live Inspection Player"
                                  >
                                    <CheckSquare size={13} /> Live Inspection Player
                                  </button>
                                </div>
                              </div>

                              {/* Details Grid */}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#f8f9fa] p-4 rounded-lg border border-gray-200">
                                <div>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Part No & Part Name</span>
                                  <span className="text-xs font-bold text-gray-900">{cs.partNo || selectedDrawing.code}</span>
                                  <span className="text-[11px] text-gray-500 block truncate">{cs.partName || selectedDrawing.name}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Revisi & Standar Mutu</span>
                                  <span className="text-xs font-bold text-[#714B67]">Rev {cs.revisionNo || cs.revision || selectedRevision?.revision_code || 'A'}</span>
                                  <span className="text-[11px] text-gray-500 block">{cs.qualityStandard || 'ISO 9001:2015'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Work Order & Station</span>
                                  <span className="text-xs font-bold text-gray-900">{cs.workOrderPrefix || 'WO-2026'}</span>
                                  <span className="text-[11px] text-gray-500 block">Stasiun: {cs.stationId || 'ST-01'}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Total Titik Ukur GD&T</span>
                                  <span className="text-xs font-extrabold text-[#00A09D] flex items-center gap-1">
                                    <Target size={13} /> {pts.length} Titik Ukur Balon
                                  </span>
                                  <span className="text-[11px] text-gray-500 block">{cs.inspectorName ? `Inspector: ${cs.inspectorName}` : 'Terkontrol Sistem'}</span>
                                </div>
                              </div>

                              {/* Check Points Table Preview */}
                              {pts.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                      <ListOrdered size={14} className="text-[#00A09D]" />
                                      Daftar Balon & Dimensi Ukur Terdaftar ({pts.length} Titik)
                                    </h5>
                                    <span className="text-[11px] text-gray-500 font-medium">Metrologi & Toleransi ISO 17025</span>
                                  </div>
                                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-60 overflow-y-auto">
                                    <table className="w-full text-left text-xs border-collapse">
                                      <thead className="bg-gray-100 text-gray-700 sticky top-0 z-10 text-[11px] uppercase tracking-wider font-bold">
                                        <tr className="border-b border-gray-200">
                                          <th className="py-2 px-3 text-center w-12">Balon #</th>
                                          <th className="py-2 px-3">Fitur / Parameter Dimensi</th>
                                          <th className="py-2 px-3">Kategori</th>
                                          <th className="py-2 px-3 text-right">Nominal Spec</th>
                                          <th className="py-2 px-3 text-center">Toleransi (Min/Max)</th>
                                          <th className="py-2 px-3 text-center">Unit</th>
                                          <th className="py-2 px-3 text-center">Alat Ukur</th>
                                          <th className="py-2 px-3 text-center">Criticality</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-100 bg-white">
                                        {pts.map((pt, pIdx) => {
                                          const pNum = pt.pointNumber || (pIdx + 1);
                                          const isCrit = String(pt.criticality || '').includes('Critical');
                                          return (
                                            <tr key={pt.id || pIdx} className="hover:bg-gray-50">
                                              <td className="py-2 px-3 text-center font-bold">
                                                <span className="w-6 h-6 rounded-full bg-[#00A09D]/15 text-[#00A09D] inline-flex items-center justify-center font-mono text-xs">
                                                  {pNum}
                                                </span>
                                              </td>
                                              <td className="py-2 px-3 font-semibold text-gray-900">{pt.title || `Point ${pNum}`}</td>
                                              <td className="py-2 px-3 text-gray-600">{pt.category || 'Linear Dimension'}</td>
                                              <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">{Number(pt.nominal || 0).toFixed(3)}</td>
                                              <td className="py-2 px-3 text-center font-mono text-gray-600">
                                                [{Number(pt.tolMin || 0) >= 0 ? `+${pt.tolMin}` : pt.tolMin} / {Number(pt.tolMax || 0) >= 0 ? `+${pt.tolMax}` : pt.tolMax}]
                                              </td>
                                              <td className="py-2 px-3 text-center text-gray-500">{pt.unit || 'mm'}</td>
                                              <td className="py-2 px-3 text-center text-gray-700">{pt.inspectionMethod || 'Caliper'}</td>
                                              <td className="py-2 px-3 text-center">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                  isCrit ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                  {pt.criticality || 'Major'}
                                                </span>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      /* Empty State: Belum Terkoneksi */
                      <div className="border-2 border-dashed border-gray-300 bg-white rounded-xl p-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                          <ClipboardCheck size={36} />
                        </div>
                        <div className="max-w-md space-y-1.5">
                          <h4 className="text-base font-bold text-gray-900">
                            Drawing Belum Terkoneksi ke Check Sheet
                          </h4>
                          <p className="text-xs text-gray-500 leading-relaxed">
                            Drawing <strong>{selectedDrawing.code}</strong> (<em>{selectedDrawing.name}</em>) belum memiliki Digital Check Sheet. Buka di <strong>Inspector Studio</strong> untuk menentukan penomoran balon, spesifikasi toleransi GD&T, dan lembar periksa inspeksi mutu.
                          </p>
                        </div>
                        <button
                          onClick={handleOpenInInspector}
                          className="flex items-center gap-2 bg-[#00A09D] hover:bg-[#008784] text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          <FileCode size={15} /> Atur Balon & Buat Check Sheet di Inspector Studio ➔
                        </button>
                      </div>
                    )}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Package size={16} className="text-[#714B67]" /> Bill of Materials (BOM) & Multi-level Parts
                          </h4>
                          <p className="text-xs text-gray-500">Daftar part penyusun, material spesifikasi, dan toleransi untuk perakitan</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setShowBomTemplateModal(true)}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-md border border-indigo-200 flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Sparkles size={13} /> Muat Template BOM Standar
                          </button>
                          <button
                            onClick={() => {
                              const tpl = BOM_TEMPLATES[0];
                              const headers = ['Item #', 'Part Number', 'Part Name', 'Qty', 'Unit', 'Material', 'Balloon Ref', 'Notes'];
                              const rows = relations.length > 0 
                                ? relations.map((rel, idx) => [`"0${idx + 1}"`, `"${rel.child?.code || ''}"`, `"${rel.child?.name || ''}"`, rel.quantity || 1, '"PCS"', `"${rel.child?.metadata?.material || '-'}"`, `"#${idx + 1}"`, '""'])
                                : tpl.items.map(it => [`"${it.itemNo}"`, `"${it.partCode}"`, `"${it.partName}"`, it.qty, `"${it.unit}"`, `"${it.material}"`, `"${it.balloonRef}"`, `"${it.notes}"`]);
                              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                              const encodedUri = encodeURI(csvContent);
                              const link = document.createElement('a');
                              link.setAttribute('href', encodedUri);
                              link.setAttribute('download', `BOM_Export_${selectedDrawing?.code || 'Drawing'}.csv`);
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              toast.success('✓ File CSV BOM berhasil diunduh!');
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md border border-gray-300 flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                          >
                            <FileDown size={13} /> Export CSV
                          </button>
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

                {/* ══ FOTO PRODUK (PRODUCT PHOTOS & VISUAL GALLERY) TAB ══ */}
                {activeTab === 'photos' && (
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Top Action & Status Bar */}
                    <div className="px-6 py-3.5 border-b border-gray-200 bg-[#f8f9fa] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#714B67]/10 text-[#714B67] flex items-center justify-center font-bold">
                          <Camera size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-gray-900">Galeri Foto Fisik Produk Manufaktur</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-[#714B67]">
                              {productPhotos.length} Foto
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            Dokumentasikan hasil foto part riil dari berbagai sudut (Tampak Depan, Samping, Atas, 3D, dan Detail QC Visual).
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons & Hidden Inputs */}
                      <div className="flex items-center gap-2">
                        {/* Hidden file & camera inputs */}
                        <input
                          type="file"
                          ref={photoInputRef}
                          multiple
                          accept="image/*"
                          onChange={e => handleAddProductPhotos(e.target.files)}
                          className="hidden"
                        />
                        <input
                          type="file"
                          ref={cameraInputRef}
                          accept="image/*"
                          capture="environment"
                          onChange={e => handleAddProductPhotos(e.target.files)}
                          className="hidden"
                        />

                        {productPhotos.length === 0 && (
                          <button
                            onClick={handleLoadSampleProductPhotos}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition-all cursor-pointer"
                            title="Muat contoh foto produk riil 3D"
                          >
                            <Sparkles size={13} className="text-amber-600" /> Muat Contoh Foto
                          </button>
                        )}

                        <button
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 shadow-2xs transition-all cursor-pointer"
                        >
                          <Camera size={13} className="text-[#714B67]" /> Buka Kamera
                        </button>

                        <button
                          onClick={() => photoInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white shadow-xs transition-all cursor-pointer"
                        >
                          <Plus size={14} /> + Unggah Foto Produk
                        </button>
                      </div>
                    </div>

                    {/* Main Content: Gallery or Empty State */}
                    {productPhotos.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fafafa]">
                        <div className="w-18 h-18 rounded-2xl bg-white border-2 border-dashed border-gray-300 shadow-sm flex items-center justify-center mb-4 text-[#714B67]/70">
                          <Camera size={36} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Belum Ada Foto Produk yang Diunggah</h4>
                        <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                          Unggah foto komponen fisik hasil mesin CNC / perakitan untuk melengkapi dokumentasi inspeksi visual dan memverifikasi kualitas part riil.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => photoInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs cursor-pointer transition-all"
                          >
                            <Upload size={14} /> Unggah File Foto (JPG / PNG)
                          </button>
                          <button
                            onClick={() => cameraInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-md border border-gray-300 shadow-2xs cursor-pointer transition-all"
                          >
                            <Camera size={14} className="text-[#714B67]" /> Ambil dari Kamera
                          </button>
                          <button
                            onClick={handleLoadSampleProductPhotos}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200 shadow-2xs cursor-pointer transition-all"
                          >
                            <Sparkles size={14} className="text-amber-600" /> Muat Contoh Part
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                        {/* Hero Preview Stage (Left / Center) */}
                        <div className="flex-1 flex flex-col bg-slate-900 relative overflow-hidden min-h-[420px]">
                          {/* Top Overlay Badge & Action Toolbar */}
                          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
                            <div className="flex items-center gap-2 pointer-events-auto">
                              {productPhotos[selectedPhotoIndex]?.isPrimary && (
                                <span className="flex items-center gap-1 bg-amber-500 text-slate-950 font-extrabold text-[11px] px-2.5 py-1 rounded-md shadow-md">
                                  <Star size={12} fill="currentColor" /> Foto Utama (Thumbnail)
                                </span>
                              )}
                              <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[11px] px-2.5 py-1 rounded-md border border-white/15">
                                📐 Sudut: {productPhotos[selectedPhotoIndex]?.angle || 'Depan (Front)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 pointer-events-auto bg-black/60 backdrop-blur-md p-1 rounded-lg border border-white/15">
                              {!productPhotos[selectedPhotoIndex]?.isPrimary && (
                                <button
                                  onClick={() => handleSetPrimaryPhoto(selectedPhotoIndex)}
                                  className="px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:text-white hover:bg-amber-500/30 rounded transition-all flex items-center gap-1 cursor-pointer"
                                  title="Jadikan sebagai foto utama part"
                                >
                                  <Star size={12} /> Jadikan Utama
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEditPhoto(productPhotos[selectedPhotoIndex], selectedPhotoIndex)}
                                className="px-2.5 py-1 text-[11px] font-bold text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all flex items-center gap-1 cursor-pointer"
                                title="Edit keterangan dan sudut foto"
                              >
                                <Edit3 size={12} /> Edit Label
                              </button>
                              <a
                                href={productPhotos[selectedPhotoIndex]?.url}
                                download={productPhotos[selectedPhotoIndex]?.name || 'product-photo.png'}
                                className="p-1.5 text-gray-300 hover:text-white hover:bg-white/10 rounded transition-all cursor-pointer"
                                title="Unduh foto"
                              >
                                <Download size={13} />
                              </a>
                              <button
                                onClick={() => handleDeleteProductPhoto(selectedPhotoIndex)}
                                className="p-1.5 text-rose-400 hover:text-rose-200 hover:bg-rose-500/20 rounded transition-all cursor-pointer"
                                title="Hapus foto ini"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Image Display */}
                          <div className="flex-1 flex items-center justify-center p-6 select-none overflow-hidden">
                            <img
                              src={productPhotos[selectedPhotoIndex]?.url}
                              alt={productPhotos[selectedPhotoIndex]?.label || 'Product Photo'}
                              className="max-h-[520px] max-w-full object-contain rounded-lg shadow-2xl transition-transform duration-200"
                            />
                          </div>

                          {/* Bottom Caption Bar */}
                          <div className="bg-slate-950/80 backdrop-blur-md px-4 py-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
                            <div>
                              <span className="font-bold text-white mr-2">{productPhotos[selectedPhotoIndex]?.label}</span>
                              <span className="text-[11px] text-slate-400">({selectedPhotoIndex + 1} dari {productPhotos.length} foto)</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {productPhotos[selectedPhotoIndex]?.date ? new Date(productPhotos[selectedPhotoIndex]?.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>

                        {/* Thumbnail Carousel / Sidebar Grid (Right) */}
                        <div className="w-full lg:w-80 bg-[#f8f9fa] border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col shrink-0">
                          <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                            <span className="font-bold text-xs text-gray-800">Daftar Foto Produk ({productPhotos.length})</span>
                            <button
                              onClick={() => photoInputRef.current?.click()}
                              className="text-[11px] font-bold text-[#714B67] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={12} /> Tambah Foto
                            </button>
                          </div>

                          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[600px]">
                            {productPhotos.map((photo, idx) => (
                              <div
                                key={photo.id || idx}
                                onClick={() => setSelectedPhotoIndex(idx)}
                                className={`p-2 rounded-lg border transition-all cursor-pointer flex gap-2.5 items-center group relative ${
                                  selectedPhotoIndex === idx
                                    ? 'bg-[#714B67]/5 border-[#714B67] ring-2 ring-[#714B67]/20 shadow-xs'
                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                              >
                                {/* Thumbnail Image */}
                                <div className="w-16 h-16 rounded-md bg-slate-900 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200 relative">
                                  <img
                                    src={photo.url}
                                    alt={photo.label}
                                    className="w-full h-full object-cover"
                                  />
                                  {photo.isPrimary && (
                                    <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 p-0.5 rounded-full shadow-xs" title="Foto Utama">
                                      <Star size={10} fill="currentColor" />
                                    </div>
                                  )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h5 className="font-bold text-xs text-gray-900 truncate group-hover:text-[#714B67]">
                                      {photo.label}
                                    </h5>
                                  </div>
                                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1 font-medium">
                                    <span className="px-1.5 py-0.2 bg-gray-100 text-gray-600 rounded">
                                      {photo.angle || 'Depan'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {!photo.isPrimary && (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); handleSetPrimaryPhoto(idx); }}
                                        className="text-[10px] font-bold text-amber-700 hover:underline flex items-center gap-0.5"
                                      >
                                        <Star size={10} /> Jadikan Utama
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleOpenEditPhoto(photo, idx); }}
                                      className="text-[10px] font-semibold text-gray-500 hover:text-gray-800"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteProductPhoto(idx); }}
                                      className="text-[10px] font-semibold text-rose-500 hover:text-rose-700 ml-auto"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ══ LIMIT SAMPLE (SAMPEL BATAS MUTU ISO / IATF) TAB ══ */}
                {activeTab === 'limit_sample' && (
                  <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    {/* Top Header Bar */}
                    <div className="px-6 py-3.5 border-b border-gray-200 bg-[#f8f9fa] flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
                          <ShieldAlert size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-xs text-gray-900">Manajemen Limit Sample (Sampel Batas Mutu Visual)</h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              {limitSamples.length} Standar
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">
                            Standarisasi batas penerimaan cacat visual (Batas OK vs Batas NG) sesuai standar IATF 16949 / ISO 9001.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {limitSamples.length === 0 && (
                          <button
                            onClick={handleLoadDemoLimitSamples}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 shadow-2xs transition-all cursor-pointer"
                          >
                            <Sparkles size={13} className="text-amber-600" /> Muat Contoh Master
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setLimitSampleFormData({
                              code: `LS-${selectedDrawing.code || 'PRT'}-${limitSamples.length + 1}`,
                              title: '',
                              defect_category: 'SCRATCH',
                              ok_photo_url: null,
                              ok_criteria: '',
                              ng_photo_url: null,
                              ng_criteria: '',
                              effective_date: new Date().toISOString().split('T')[0],
                              expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                              storage_location: 'Rak QC Metrologi #01',
                              qa_approver: 'QA Manager',
                              customer_approver: 'Customer Quality Rep',
                              notes: ''
                            });
                            setShowCreateLimitSampleModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold bg-[#714B67] hover:bg-[#5C3D54] text-white shadow-xs transition-all cursor-pointer"
                        >
                          <Plus size={14} /> + Daftarkan Limit Sample
                        </button>
                      </div>
                    </div>

                    {/* Summary Metric Pills */}
                    {limitSamples.length > 0 && (
                      <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center gap-3 overflow-x-auto text-[11px]">
                        <span className="font-bold text-gray-700">Status Validasi:</span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                          🟢 {limitSamples.filter(s => new Date(s.expiry_date) > new Date()).length} Aktif & Valid
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold border border-amber-200 flex items-center gap-1">
                          ⚠️ {limitSamples.filter(s => {
                            const diff = (new Date(s.expiry_date) - new Date()) / (1000 * 60 * 60 * 24);
                            return diff > 0 && diff <= 30;
                          }).length} Mendekati Kedaluwarsa (&lt;30 Hari)
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-200 flex items-center gap-1">
                          🔴 {limitSamples.filter(s => new Date(s.expiry_date) <= new Date()).length} Expired (Perlu Re-evaluasi)
                        </span>
                      </div>
                    )}

                    {/* Content List / Cards */}
                    {limitSamples.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#fafafa]">
                        <div className="w-18 h-18 rounded-2xl bg-white border-2 border-dashed border-gray-300 shadow-sm flex items-center justify-center mb-4 text-rose-600/70">
                          <ShieldAlert size={36} />
                        </div>
                        <h4 className="text-sm font-bold text-gray-900 mb-1">Belum Ada Limit Sample yang Didaftarkan</h4>
                        <p className="text-xs text-gray-500 max-w-md mb-6 leading-relaxed">
                          Daftarkan sampel batas visual (Batas Goresan, Burr, Porositas, Dent, Warna) untuk menghilangkan keraguan operator saat memeriksa part di lini produksi.
                        </p>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setLimitSampleFormData({
                                code: `LS-${selectedDrawing.code || 'PRT'}-1`,
                                title: '',
                                defect_category: 'SCRATCH',
                                ok_photo_url: null,
                                ok_criteria: '',
                                ng_photo_url: null,
                                ng_criteria: '',
                                effective_date: new Date().toISOString().split('T')[0],
                                expiry_date: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
                                storage_location: 'Rak QC Metrologi #01',
                                qa_approver: 'QA Manager',
                                customer_approver: 'Customer Quality Rep',
                                notes: ''
                              });
                              setShowCreateLimitSampleModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-[#714B67] hover:bg-[#5C3D54] text-white text-xs font-bold rounded-md shadow-xs cursor-pointer transition-all"
                          >
                            <Plus size={14} /> Daftarkan Limit Sample Baru
                          </button>
                          <button
                            onClick={handleLoadDemoLimitSamples}
                            className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-md border border-amber-200 shadow-2xs cursor-pointer transition-all"
                          >
                            <Sparkles size={14} className="text-amber-600" /> Muat Contoh Master Standar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {limitSamples.map(sample => {
                          const isExpired = new Date(sample.expiry_date) <= new Date();
                          const isExpiringSoon = !isExpired && (new Date(sample.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30;

                          return (
                            <div
                              key={sample.id}
                              className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden hover:border-gray-300 transition-all"
                            >
                              {/* Card Header Bar */}
                              <div className="px-5 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono font-bold text-xs bg-white text-gray-800 px-2 py-0.5 rounded border border-gray-200">
                                    {sample.code}
                                  </span>
                                  <h5 className="font-bold text-xs text-gray-900">{sample.title}</h5>
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-[#714B67] border border-purple-200">
                                    {DEFECT_CATEGORIES.find(c => c.key === sample.defect_category)?.label || sample.defect_category}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  {isExpired ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                      🔴 EXPIRED
                                    </span>
                                  ) : isExpiringSoon ? (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                      ⚠️ EXPIRES SOON
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                      🟢 AKTIF / VALID
                                    </span>
                                  )}

                                  <button
                                    onClick={() => handleOpenLimitSampleDetail(sample)}
                                    className="p-1 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded transition-all cursor-pointer"
                                    title="Perbesar Split View Perbandingan"
                                  >
                                    <Split size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleOpenPrintTag(sample)}
                                    className="p-1 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded transition-all cursor-pointer"
                                    title="Cetak Label Fisik ISO untuk Box Sampel"
                                  >
                                    <Printer size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLimitSample(sample.id)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition-all cursor-pointer"
                                    title="Hapus Limit Sample"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Visual Comparison Grid (Side by Side: OK vs NG) */}
                              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* OK Limit Box */}
                                <div className="p-3.5 bg-emerald-50/40 border-2 border-emerald-500/40 rounded-lg flex flex-col space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-emerald-800 flex items-center gap-1.5">
                                      <CheckCircle2 size={14} className="text-emerald-600" /> BATAS MAKSIMAL DITERIMA (OK LIMIT)
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                      PASS
                                    </span>
                                  </div>
                                  <div className="w-full h-48 bg-slate-900 rounded-md overflow-hidden flex items-center justify-center border border-emerald-200 cursor-pointer"
                                    onClick={() => handleOpenLimitSampleDetail(sample)}
                                  >
                                    <img
                                      src={sample.ok_photo_url || createDemoLimitSampleSvgs(sample.defect_category, 'OK')}
                                      alt="OK Limit Boundary"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="text-[11px] text-gray-700 leading-relaxed bg-white p-2.5 rounded border border-emerald-200">
                                    <strong className="text-emerald-900 block mb-0.5">Kriteria Penerimaan:</strong>
                                    {sample.ok_criteria}
                                  </div>
                                </div>

                                {/* NG Limit Box */}
                                <div className="p-3.5 bg-rose-50/40 border-2 border-rose-500/40 rounded-lg flex flex-col space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-extrabold text-rose-800 flex items-center gap-1.5">
                                      <AlertTriangle size={14} className="text-rose-600" /> BATAS MINIMAL DITOLAK (NG LIMIT)
                                    </span>
                                    <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded">
                                      REJECT
                                    </span>
                                  </div>
                                  <div className="w-full h-48 bg-slate-900 rounded-md overflow-hidden flex items-center justify-center border border-rose-200 cursor-pointer"
                                    onClick={() => handleOpenLimitSampleDetail(sample)}
                                  >
                                    <img
                                      src={sample.ng_photo_url || createDemoLimitSampleSvgs(sample.defect_category, 'NG')}
                                      alt="NG Limit Boundary"
                                      className="w-full h-full object-contain"
                                    />
                                  </div>
                                  <div className="text-[11px] text-gray-700 leading-relaxed bg-white p-2.5 rounded border border-rose-200">
                                    <strong className="text-rose-900 block mb-0.5">Kriteria Penolakan:</strong>
                                    {sample.ng_criteria}
                                  </div>
                                </div>
                              </div>

                              {/* Card Footer: Metadata, Approvals & Location */}
                              <div className="px-5 py-2.5 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-[11px] text-gray-600 flex-wrap gap-2">
                                <div className="flex items-center gap-4 flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Calendar size={12} className="text-gray-400" /> Masa Berlaku: <strong>{sample.effective_date}</strong> s/d <strong className={isExpired ? 'text-rose-600 font-bold' : ''}>{sample.expiry_date}</strong>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin size={12} className="text-gray-400" /> Lokasi Fisik: <strong>{sample.storage_location || 'Rak QC'}</strong>
                                  </span>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1 text-gray-700">
                                    <UserCheck size={12} className="text-emerald-600" /> QA: <strong>{sample.qa_approver || 'Approved'}</strong>
                                  </span>
                                  {sample.customer_approver && (
                                    <span className="flex items-center gap-1 text-gray-700">
                                      <Award size={12} className="text-blue-600" /> Customer: <strong>{sample.customer_approver}</strong>
                                    </span>
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

      {/* ── 4b. Edit Product Photo Details Modal ── */}
      <Modal
        show={showPhotoEditModal}
        onClose={() => setShowPhotoEditModal(false)}
        title="Ubah Keterangan & Sudut Pengambilan Foto"
        onSubmit={handleSavePhotoEdit}
        submitLabel="Simpan Perubahan"
      >
        <InputField
          label="Label / Keterangan Foto"
          value={photoEditData.label}
          onChange={v => setPhotoEditData(p => ({ ...p, label: v }))}
          placeholder="cth: Tampak Depan Komponen Flange Mesin CNC"
          required
        />
        <SelectField
          label="Sudut Pengambilan (Camera Angle / View)"
          value={photoEditData.angle}
          onChange={v => setPhotoEditData(p => ({ ...p, angle: v }))}
          options={[
            { value: 'Depan (Front)', label: 'Tampak Depan (Front View)' },
            { value: 'Belakang (Back)', label: 'Tampak Belakang (Back View)' },
            { value: 'Kiri (Left)', label: 'Tampak Samping Kiri (Left View)' },
            { value: 'Kanan (Right)', label: 'Tampak Samping Kanan (Right View)' },
            { value: 'Atas (Top)', label: 'Tampak Atas (Top View)' },
            { value: 'Bawah (Bottom)', label: 'Tampak Bawah (Bottom View)' },
            { value: 'Isometric 3D', label: 'Perspektif Isometrik (Isometric 3D)' },
            { value: 'Detail QC Permukaan', label: 'Close-Up Detail Toleransi / Surface Finish' },
            { value: 'Sambungan Las / Assembly', label: 'Detail Sambungan / Assembly Fitting' },
            { value: 'Kemasan & Finishing', label: 'Kondisi Part Jadi / Packaging' },
          ]}
        />
      </Modal>

      {/* ── 4c. Create Limit Sample Modal (ISO / IATF 16949 Master Standard) ── */}
      <Modal
        show={showCreateLimitSampleModal}
        onClose={() => setShowCreateLimitSampleModal(false)}
        title="Registrasi Master Limit Sample (Sampel Batas Mutu)"
        onSubmit={handleCreateLimitSample}
        submitLabel="Simpan & Validasi Standar"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Nomor Registrasi Sampel (Tag ID)"
              value={limitSampleFormData.code}
              onChange={v => setLimitSampleFormData(p => ({ ...p, code: v }))}
              placeholder="LS-FLG-001"
              required
            />
            <SelectField
              label="Kategori Cacat Mutu"
              value={limitSampleFormData.defect_category}
              onChange={v => setLimitSampleFormData(p => ({ ...p, defect_category: v }))}
              options={DEFECT_CATEGORIES.map(c => ({ value: c.key, label: `${c.icon} ${c.label}` }))}
            />
          </div>

          <InputField
            label="Nama / Judul Sampel Batas"
            value={limitSampleFormData.title}
            onChange={v => setLimitSampleFormData(p => ({ ...p, title: v }))}
            placeholder="cth: Batas Goresan Permukaan Bodi Mesin (Scratch Limit)"
            required
          />

          {/* OK vs NG Boundary Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* OK Boundary */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-300 rounded-lg space-y-2">
              <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-emerald-600" /> 1. Batas Maksimal Diterima (OK Limit)
              </span>
              <TextArea
                label="Deskripsi Kriteria Lolos (OK)"
                value={limitSampleFormData.ok_criteria}
                onChange={v => setLimitSampleFormData(p => ({ ...p, ok_criteria: v }))}
                placeholder="Batas cacat visual yang masih diizinkan..."
                rows={3}
                required
              />
              <div className="pt-1">
                <input
                  type="file"
                  ref={okPhotoInputRef}
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setLimitSampleFormData(p => ({ ...p, ok_photo_url: ev.target.result }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => okPhotoInputRef.current?.click()}
                  className="w-full py-2 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded border border-emerald-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} /> {limitSampleFormData.ok_photo_url ? 'Ganti Foto OK' : 'Unggah Foto Batas OK'}
                </button>
              </div>
            </div>

            {/* NG Boundary */}
            <div className="p-3.5 bg-rose-50/50 border border-rose-300 rounded-lg space-y-2">
              <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-rose-600" /> 2. Batas Minimal Ditolak (NG Limit)
              </span>
              <TextArea
                label="Deskripsi Kriteria Tolak (NG)"
                value={limitSampleFormData.ng_criteria}
                onChange={v => setLimitSampleFormData(p => ({ ...p, ng_criteria: v }))}
                placeholder="Batas cacat visual yang wajib di-reject..."
                rows={3}
                required
              />
              <div className="pt-1">
                <input
                  type="file"
                  ref={ngPhotoInputRef}
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setLimitSampleFormData(p => ({ ...p, ng_photo_url: ev.target.result }));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => ngPhotoInputRef.current?.click()}
                  className="w-full py-2 bg-white hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded border border-rose-300 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload size={13} /> {limitSampleFormData.ng_photo_url ? 'Ganti Foto NG' : 'Unggah Foto Batas NG'}
                </button>
              </div>
            </div>
          </div>

          {/* Validity & Approvals */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <InputField
              label="Tanggal Efektif"
              type="date"
              value={limitSampleFormData.effective_date}
              onChange={v => setLimitSampleFormData(p => ({ ...p, effective_date: v }))}
              required
            />
            <InputField
              label="Tanggal Kedaluwarsa (Masa Berlaku)"
              type="date"
              value={limitSampleFormData.expiry_date}
              onChange={v => setLimitSampleFormData(p => ({ ...p, expiry_date: v }))}
              required
            />
            <InputField
              label="Lokasi Rak Fisik di Pabrik"
              value={limitSampleFormData.storage_location}
              onChange={v => setLimitSampleFormData(p => ({ ...p, storage_location: v }))}
              placeholder="Rak QC Box #01"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <InputField
              label="Disetujui oleh (QA Manager)"
              value={limitSampleFormData.qa_approver}
              onChange={v => setLimitSampleFormData(p => ({ ...p, qa_approver: v }))}
              placeholder="Nama QA Approver"
              required
            />
            <InputField
              label="Persetujuan Customer (Opsional)"
              value={limitSampleFormData.customer_approver}
              onChange={v => setLimitSampleFormData(p => ({ ...p, customer_approver: v }))}
              placeholder="Nama Customer Representative"
            />
          </div>
        </div>
      </Modal>

      {/* ── 4d. Fullscreen Split-View Limit Sample Detail Inspector Modal ── */}
      {showLimitSampleDetailModal && selectedLimitSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-xs bg-[#714B67] text-white px-2.5 py-1 rounded">
                  {selectedLimitSample.code}
                </span>
                <div>
                  <h3 className="font-bold text-sm text-white">{selectedLimitSample.title}</h3>
                  <p className="text-[11px] text-slate-400">
                    Kategori: {DEFECT_CATEGORIES.find(c => c.key === selectedLimitSample.defect_category)?.label || selectedLimitSample.defect_category} • Masa Berlaku: {selectedLimitSample.effective_date} s/d {selectedLimitSample.expiry_date}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLimitSampleDetailModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Split Screen Stage */}
            <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
              {/* OK Stage */}
              <div className="flex flex-col bg-emerald-950/40 border-2 border-emerald-500/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} /> 🟢 BATAS DITERIMA (OK LIMIT)
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 font-mono text-xs px-2.5 py-0.5 rounded font-bold border border-emerald-500/30">
                    PASS CRITERIA
                  </span>
                </div>
                <div className="flex-1 min-h-[300px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-emerald-900">
                  <img
                    src={selectedLimitSample.ok_photo_url || createDemoLimitSampleSvgs(selectedLimitSample.defect_category, 'OK')}
                    alt="OK Limit"
                    className="max-h-[360px] max-w-full object-contain"
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-emerald-800/60 text-xs text-emerald-200">
                  <strong className="text-emerald-400 block mb-1">Pedoman Penerimaan:</strong>
                  {selectedLimitSample.ok_criteria}
                </div>
              </div>

              {/* NG Stage */}
              <div className="flex flex-col bg-rose-950/40 border-2 border-rose-500/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-rose-400 flex items-center gap-2">
                    <AlertTriangle size={16} /> 🔴 BATAS DITOLAK (NG LIMIT)
                  </span>
                  <span className="bg-rose-500/20 text-rose-300 font-mono text-xs px-2.5 py-0.5 rounded font-bold border border-rose-500/30">
                    REJECT CRITERIA
                  </span>
                </div>
                <div className="flex-1 min-h-[300px] bg-slate-950 rounded-lg overflow-hidden flex items-center justify-center p-2 border border-rose-900">
                  <img
                    src={selectedLimitSample.ng_photo_url || createDemoLimitSampleSvgs(selectedLimitSample.defect_category, 'NG')}
                    alt="NG Limit"
                    className="max-h-[360px] max-w-full object-contain"
                  />
                </div>
                <div className="p-3 bg-slate-900 rounded-lg border border-rose-800/60 text-xs text-rose-200">
                  <strong className="text-rose-400 block mb-1">Pedoman Penolakan:</strong>
                  {selectedLimitSample.ng_criteria}
                </div>
              </div>
            </div>

            {/* Footer Bar */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div>
                <span>Lokasi Box Fisik: <strong className="text-white">{selectedLimitSample.storage_location}</strong></span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { setShowLimitSampleDetailModal(false); handleOpenPrintTag(selectedLimitSample); }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} /> Cetak Label Box Fisik (ISO Tag)
                </button>
                <button
                  onClick={() => setShowLimitSampleDetailModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4e. Printable Physical Limit Sample Tag Modal (IATF 16949 Master Tag) ── */}
      {showPrintTagModal && selectedLimitSample && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="px-6 py-3 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer size={16} className="text-indigo-600" />
                <h3 className="font-bold text-xs text-gray-900">Kartu Label Fisik Limit Sample (ISO / IATF 16949)</h3>
              </div>
              <button
                onClick={() => setShowPrintTagModal(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Printable Tag Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gray-100 flex items-center justify-center">
              <div className="w-full max-w-xl bg-white border-2 border-black p-6 rounded-lg shadow-md font-sans text-black">
                {/* Tag Header */}
                <div className="border-b-2 border-black pb-3 mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black tracking-wider uppercase">QUALITY MASTER LIMIT SAMPLE</h2>
                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-wide">
                      Standard Quality Reference Card • IATF 16949 / ISO 9001
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-mono font-black border-2 border-black px-2 py-0.5 rounded">
                      {selectedLimitSample.code}
                    </span>
                  </div>
                </div>

                {/* Part & Defect Info */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3 border-b pb-3 border-gray-300">
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Part Target:</span>
                    <strong className="text-xs">{selectedDrawing?.name} ({selectedDrawing?.code})</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase block">Kategori Cacat:</span>
                    <strong className="text-xs">{DEFECT_CATEGORIES.find(c => c.key === selectedLimitSample.defect_category)?.label || selectedLimitSample.defect_category}</strong>
                  </div>
                </div>

                {/* Photos OK vs NG */}
                <div className="grid grid-cols-2 gap-3 mb-3 border-b pb-3 border-gray-300">
                  <div className="border border-emerald-600 p-2 rounded text-center bg-emerald-50/20">
                    <span className="text-[10px] font-black text-emerald-800 block mb-1 uppercase">🟢 OK LIMIT (TERIMA)</span>
                    <img
                      src={selectedLimitSample.ok_photo_url || createDemoLimitSampleSvgs(selectedLimitSample.defect_category, 'OK')}
                      alt="OK Sample"
                      className="w-full h-32 object-contain bg-slate-900 rounded mb-1.5"
                    />
                    <p className="text-[9px] text-left text-gray-700 leading-tight">{selectedLimitSample.ok_criteria}</p>
                  </div>

                  <div className="border border-rose-600 p-2 rounded text-center bg-rose-50/20">
                    <span className="text-[10px] font-black text-rose-800 block mb-1 uppercase">🔴 NG LIMIT (TOLAK)</span>
                    <img
                      src={selectedLimitSample.ng_photo_url || createDemoLimitSampleSvgs(selectedLimitSample.defect_category, 'NG')}
                      alt="NG Sample"
                      className="w-full h-32 object-contain bg-slate-900 rounded mb-1.5"
                    />
                    <p className="text-[9px] text-left text-gray-700 leading-tight">{selectedLimitSample.ng_criteria}</p>
                  </div>
                </div>

                {/* Validity and Sign-off Table */}
                <table className="w-full text-[10px] border-collapse border border-black mb-2">
                  <tbody>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-black w-1/4">Tgl Berlaku:</td>
                      <td className="p-1.5 border-r border-black w-1/4 font-mono">{selectedLimitSample.effective_date}</td>
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-black w-1/4">Tgl Kedaluwarsa:</td>
                      <td className="p-1.5 font-mono font-bold w-1/4">{selectedLimitSample.expiry_date}</td>
                    </tr>
                    <tr className="border-b border-black">
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-black">Lokasi Fisik:</td>
                      <td className="p-1.5 border-r border-black">{selectedLimitSample.storage_location}</td>
                      <td className="p-1.5 font-bold bg-gray-100 border-r border-black">QA Approver:</td>
                      <td className="p-1.5 font-bold">{selectedLimitSample.qa_approver}</td>
                    </tr>
                  </tbody>
                </table>

                <p className="text-[8px] text-gray-500 italic text-center">
                  *Kartu ini ditempelkan pada wadah master sampel batas di lantai pabrik. Wajib dire-evaluasi sebelum tanggal kedaluwarsa.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Printer size={13} /> Cetak Kartu Label
              </button>
              <button
                onClick={() => setShowPrintTagModal(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md text-xs font-semibold cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* ── 9. SOP & Help Guide Modal ── */}
      <Modal show={showHelpModal} onClose={() => setShowHelpModal(false)} title="Buku Panduan & SOP Drawing, ECN & Metrologi Kalibrasi" maxWidth="max-w-5xl" allowFullscreen={true}>
        <div className="flex flex-col gap-4 text-xs">
          {/* Sub Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-2 pb-2 overflow-x-auto">
            {[
              { id: 'workflow', label: '1. Alur Kerja PLM (4 Tahap)', icon: GitBranch },
              { id: 'bom', label: '2. Struktur BOM & Master Part', icon: Package },
              { id: 'ecn', label: '3. Standar ISO & Aturan ECN', icon: ShieldCheck },
              { id: 'inspector', label: '4. Buka di Inspector Studio & Check Sheet', icon: FileCode },
              { id: 'metrology', label: '5. Standar Alat Ukur & Kalibrasi (ISO 17025)', icon: Ruler },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setActiveHelpTab(t.id)}
                className={`px-3 py-1.5 rounded-md font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                  activeHelpTab === t.id ? 'bg-[#714B67] text-white shadow-xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <t.icon size={13} /> {t.label}
              </button>
            ))}
          </div>

          {/* ══════════════════════════════════════════════════════════
              TAB 1: ALUR KERJA PLM (4 TAHAP LENGKAP)
          ══════════════════════════════════════════════════════════ */}
          {activeHelpTab === 'workflow' && (
            <div className="space-y-4 text-gray-700 max-h-[72vh] overflow-y-auto pr-1">
              <div className="bg-[#714B67]/5 border border-[#714B67]/20 rounded-lg p-3.5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#714B67] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <GitBranch size={18} />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-[#714B67]">
                    Siklus Hidup Dokumen Gambar & PLM Manufaktur (Engineering to Shopfloor)
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Modul ini dirancang sebagai <strong>Single Source of Truth</strong> (Pusat Kendali Data Tunggal Resmi) berbasis <strong>Supabase Cloud</strong> untuk menghubungkan Departemen Engineering, PPIC, Produksi, dan Quality Control.
                  </p>
                </div>
              </div>

              {/* 4 Detail Steps with Tujuan, Contoh, and Cara Buatnya */}
              <div className="space-y-3.5">
                {/* Tahap 1 */}
                <div className="p-3.5 bg-white border border-teal-200 rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center">1</span>
                      <span className="font-bold text-sm text-teal-900">Tahap 1: Registrasi & Unggah Blueprint (CAD / Vector)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-bold border border-teal-200">Tahap 1</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] pl-7">
                    <p><strong className="text-gray-900">🎯 Tujuan:</strong> Menjadi <em>Single Source of Truth</em> agar operator lini dan inspektur QC selalu mengakses versi CAD yang valid dan mencegah risiko salah produksi akibat gambar kedaluwarsa.</p>
                    <div className="bg-teal-50/60 p-2 rounded border border-teal-100 text-teal-900">
                      <strong>💡 Contoh:</strong> Mengunggah file <code>.dxf</code> / <code>.pdf</code> dengan kode <code>DWG-FLG-001</code> (<em>Hydraulic Flange Housing Cover</em>, Tipe <code>DETAIL</code>).
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-gray-700 space-y-1">
                      <strong className="text-gray-900 block">🛠️ Cara Buatnya (Apa yang Dilakukan Step-by-Step):</strong>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Klik tombol ungu <strong>[+ Buat Drawing Baru]</strong> di header atas.</li>
                        <li>Masukkan Kode Drawing (cth: <code>DWG-FLG-001</code>), Nama Drawing, Tipe (<code>DETAIL</code> / <code>ASSEMBLY</code>), dan Deskripsi.</li>
                        <li>Pilih drawing tersebut dari sidebar kiri, lalu klik tombol <strong>[Upload Blueprint]</strong> untuk mengunggah file <code>.PDF</code>, <code>.DXF</code>, <code>.SVG</code>, atau <code>.PNG</code> resolusi tinggi.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Tahap 2 */}
                <div className="p-3.5 bg-white border border-purple-200 rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-[#714B67] text-white font-bold text-[10px] flex items-center justify-center">2</span>
                      <span className="font-bold text-sm text-[#714B67]">Tahap 2: Hubungkan ke Master Part & Susun Struktur BOM</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-[#714B67] font-bold border border-purple-200">Tahap 2</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] pl-7">
                    <p><strong className="text-gray-900">🎯 Tujuan:</strong> Menautkan gambar dengan nomor part fisik inventori ERP, berat jenis material, dan menyusun pohon perakitan rakitan (*Assembly Tree*).</p>
                    <div className="bg-purple-50/60 p-2 rounded border border-purple-100 text-purple-900">
                      <strong>💡 Contoh:</strong> Menautkan drawing ke Part <code>PRT-FLG-450</code> (Bahan: <em>AL-6061-T6</em>, Berat: <em>0.45 kg</em>).
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-gray-700 space-y-1">
                      <strong className="text-gray-900 block">🛠️ Cara Buatnya (Apa yang Dilakukan Step-by-Step):</strong>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Pilih drawing dari sidebar kiri, lalu klik tombol <strong>[Hubungkan Master Part]</strong> di sub-header atas kanvas.</li>
                        <li>Pilih Part Number yang sesuai dari database, atau klik <strong>[+ Buat Part Baru di Master]</strong>.</li>
                        <li>Isi Part Code, Nama Part, Material, Berat jenis, lalu klik <strong>[Simpan & Hubungkan]</strong>.</li>
                        <li>Untuk gambar tipe rakitan, buka tab <strong>[BOM & Relasi Part]</strong> dan tambahkan sub-drawing child beserta kuantitasnya.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Tahap 3 */}
                <div className="p-3.5 bg-white border border-amber-200 rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white font-bold text-[10px] flex items-center justify-center">3</span>
                      <span className="font-bold text-sm text-amber-900">Tahap 3: Penerbitan ECN & Manajemen Riwayat Revisi</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold border border-amber-200">Tahap 3</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] pl-7">
                    <p><strong className="text-gray-900">🎯 Tujuan:</strong> Mengontrol legalitas perubahan dimensi desain sesuai ISO 9001 / IATF 16949 dan menentukan disposisi stok fisik yang tersisa.</p>
                    <div className="bg-amber-50/60 p-2 rounded border border-amber-100 text-amber-900">
                      <strong>💡 Contoh:</strong> Penerbitan <code>ECN-2026-001</code> Revisi B karena pengetatan toleransi lubang poros menjadi ±0.015 mm dengan disposisi <strong>REWORK</strong> (bubut ulang di workshop).
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-gray-700 space-y-1">
                      <strong className="text-gray-900 block">🛠️ Cara Buatnya (Apa yang Dilakukan Step-by-Step):</strong>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Buka tab <strong>[Revisi & Dokumen ECN]</strong> di atas kanvas visual.</li>
                        <li>Klik tombol kuning <strong>[+ Terbitkan ECN Revisi Baru]</strong>.</li>
                        <li>Masukkan Kode Revisi (cth: <code>B</code>), Alasan Perubahan, Disposisi Stok (<code>USE AS IS</code> / <code>REWORK</code> / <code>SCRAP</code>), Dampak Tooling, dan Approver QA.</li>
                        <li>Klik <strong>[Terbitkan ECN Revisi]</strong>. Klik <strong>[🖨️ Cetak Lembar ECN]</strong> untuk menghasilkan lembar audit fisik.</li>
                      </ol>
                    </div>
                  </div>
                </div>

                {/* Tahap 4 */}
                <div className="p-3.5 bg-white border border-emerald-200 rounded-lg shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">4</span>
                      <span className="font-bold text-sm text-emerald-900">Tahap 4: Integrasi ke Inspector Studio & Digital Check Sheet (ISO 17025)</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">Tahap 4</span>
                  </div>
                  <div className="space-y-1.5 text-[11px] pl-7">
                    <p><strong className="text-gray-900">🎯 Tujuan:</strong> Mentransformasi blueprint statis menjadi kanvas metrologi interaktif dengan penomoran balon inspeksi, koneksi alat ukur terkalibrasi, dan validasi data QC cloud.</p>
                    <div className="bg-emerald-50/60 p-2 rounded border border-emerald-100 text-emerald-900">
                      <strong>💡 Contoh:</strong> Balon #1 (Internal Bore) terhubung ke Digital Caliper (<code>CAL-003</code>) yang berstatus <strong>CAL OK</strong> dengan toleransi ±0.02 mm.
                    </div>
                    <div className="bg-gray-50 p-2.5 rounded border border-gray-200 text-gray-700 space-y-1">
                      <strong className="text-gray-900 block">🛠️ Cara Buatnya (Apa yang Dilakukan Step-by-Step):</strong>
                      <ol className="list-decimal list-inside space-y-1 text-[11px]">
                        <li>Pada drawing yang dipilih, klik tombol hijau <strong>[Buka di Inspector Studio]</strong> di pojok kanan atas.</li>
                        <li>Klik titik dimensi pada gambar untuk meletakkan Balon Inspeksi (#1, #2, dst.) dan tentukan alat ukur serta toleransi nominal/min/max.</li>
                        <li>Klik <strong>[Simpan Template Check Sheet]</strong>. Lembar pemeriksaan otomatis terbit di menu <strong>Digital Drawing Check Sheet</strong> untuk diisi operator lapangan lengkap dengan validasi status kalibrasi alat ukur real-time.</li>
                      </ol>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 2: STRUKTUR BOM & MASTER PART
          ══════════════════════════════════════════════════════════ */}
          {activeHelpTab === 'bom' && (
            <div className="space-y-4 text-gray-700 max-h-[72vh] overflow-y-auto pr-1">
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-lg p-3">
                <h4 className="font-extrabold text-sm text-indigo-900 flex items-center gap-1.5">
                  <Package size={16} className="text-indigo-600" /> Bill of Materials (BOM) & Master Part
                </h4>
                <p className="text-[11px] text-gray-600 mt-1">
                  MaviCore PLM menghubungkan dokumen gambar CAD 2D/3D dengan data fisik manufaktur dan menyusun pohon rakitan perakitan (*Assembly Tree*).
                </p>
              </div>

              {/* Klasifikasi Gambar & Kategori Part */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Klasifikasi Gambar: Assembly vs Detail
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    <strong>Drawing Assembly (ASSEMBLY):</strong> Gambar rakitan utuh yang menunjukkan susunan beberapa part, posisi balon komponen, dan nomor part referensi BOM.
                  </p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    <strong>Drawing Detail (DETAIL):</strong> Gambar tunggal komponen manufaktur dengan spesifikasi dimensi, toleransi GD&T, dan perlakuan permukaan (*surface finish*).
                  </p>
                </div>

                <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Kategori Part Manufaktur
                  </div>
                  <ul className="text-[11px] text-gray-600 space-y-1">
                    <li>• <strong className="text-gray-800">Component:</strong> Part yang dibuat sendiri di lini produksi (cth: CNC Turning Shaft, Milling Body).</li>
                    <li>• <strong className="text-gray-800">Standard Part:</strong> Komponen standar beli jadi (cth: Bearing SKF, O-Ring, Baut M6 DIN 912).</li>
                    <li>• <strong className="text-gray-800">Raw Material:</strong> Bahan mentah (cth: Batangan Al-6061, Pelat Baja SPCC, Grease).</li>
                  </ul>
                </div>
              </div>

              {/* Tabel Riil Perakitan */}
              <div className="p-3.5 bg-gray-50 border border-gray-300 rounded-lg space-y-2">
                <div className="font-bold text-xs text-gray-900 flex items-center justify-between">
                  <span>📋 Tabel Riil Perakitan: Unit Flange Hidrolik (ASM-FLG-450)</span>
                  <span className="text-[10px] text-indigo-700 bg-indigo-50 font-bold px-2 py-0.5 rounded border border-indigo-200">BOM Multi-Level</span>
                </div>
                <div className="border border-gray-200 rounded-md overflow-hidden bg-white text-[11px]">
                  <table className="w-full">
                    <thead className="bg-gray-100 text-gray-700 text-[10px] uppercase font-bold border-b border-gray-200">
                      <tr>
                        <th className="p-2 text-left">Item #</th>
                        <th className="p-2 text-left">Part Number</th>
                        <th className="p-2 text-left">Nama Komponen</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-left">Material / Standar</th>
                        <th className="p-2 text-left">Fungsi Manufaktur</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="p-2 font-mono font-bold text-gray-500">01</td>
                        <td className="p-2 font-mono font-bold text-[#714B67]">PRT-FLG-01</td>
                        <td className="p-2 font-semibold text-gray-900">Main Cast Housing Flange</td>
                        <td className="p-2 text-center font-bold">1 PCS</td>
                        <td className="p-2 text-gray-600">AL-6061-T6 (Anodized)</td>
                        <td className="p-2 text-gray-500">Bodi utama penampung oli & bearing</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-gray-500">02</td>
                        <td className="p-2 font-mono font-bold text-[#714B67]">PRT-SFT-02</td>
                        <td className="p-2 font-semibold text-gray-900">Precision Stepper Shaft</td>
                        <td className="p-2 text-center font-bold">1 PCS</td>
                        <td className="p-2 text-gray-600">SUS-304 (Ground Ø25)</td>
                        <td className="p-2 text-gray-500">Poros penggerak transmisi daya</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-gray-500">03</td>
                        <td className="p-2 font-mono font-bold text-[#714B67]">PRT-BRG-03</td>
                        <td className="p-2 font-semibold text-gray-900">Ball Bearing 6002-2RS</td>
                        <td className="p-2 text-center font-bold">2 PCS</td>
                        <td className="p-2 text-gray-600">GCr15 (JIS Standard)</td>
                        <td className="p-2 text-gray-500">Bantalan putar poros anti-gesekan</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-mono font-bold text-gray-500">04</td>
                        <td className="p-2 font-mono font-bold text-[#714B67]">PRT-SL-04</td>
                        <td className="p-2 font-semibold text-gray-900">O-Ring NBR-70 Ø25x2.5</td>
                        <td className="p-2 text-center font-bold">1 PCS</td>
                        <td className="p-2 text-gray-600">Nitrile Rubber NBR-70</td>
                        <td className="p-2 text-gray-500">Pencegah kebocoran fluida hidrolik</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 3: STANDAR ISO & ATURAN ECN
          ══════════════════════════════════════════════════════════ */}
          {activeHelpTab === 'ecn' && (
            <div className="space-y-4 text-gray-700 max-h-[72vh] overflow-y-auto pr-1">
              <div className="bg-rose-50/60 border border-rose-200 rounded-lg p-3">
                <h4 className="font-extrabold text-sm text-rose-900 flex items-center gap-1.5">
                  <ShieldCheck size={16} className="text-rose-600" /> Kepatuhan Standar ISO 9001 & IATF 16949 ECN
                </h4>
                <p className="text-[11px] text-gray-600 mt-1">
                  Engineering Change Notice (ECN) adalah protokol resmi untuk mengontrol revisi produk dan mencegah kerugian akibat pemakaian komponen yang salah.
                </p>
              </div>

              <div className="space-y-3">
                {/* Protokol Disposisi Stok */}
                <div className="p-3.5 bg-white border border-rose-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span> Protokol Disposisi Stok (Stock Disposition)
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Ketika ada revisi baru, sistem mewajibkan penetapan nasib stok fisik part lama yang tersisa di gudang atau lini produksi:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[11px]">
                    <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900">
                      <strong className="block text-emerald-800 text-xs mb-0.5">🟢 USE AS IS</strong>
                      <span className="text-[10px] text-gray-600">Habiskan stok lama di lini perakitan karena perubahan tidak berdampak kritis pada fungsi rakitan.</span>
                    </div>
                    <div className="p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900">
                      <strong className="block text-amber-800 text-xs mb-0.5">🟡 REWORK</strong>
                      <span className="text-[10px] text-gray-600">Modifikasi ulang stok lama di mesin permesinan sesuai dimensi revisi baru.</span>
                    </div>
                    <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-900">
                      <strong className="block text-rose-800 text-xs mb-0.5">🔴 SCRAP</strong>
                      <span className="text-[10px] text-gray-600">Musnahkan/buang stok lama segera karena tidak dapat dipakai lagi dan berisiko fatal.</span>
                    </div>
                  </div>
                </div>

                {/* Penilaian Dampak Tooling */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#714B67]"></span> Penilaian Dampak Tooling (Tooling Impact Assessment)
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Evaluasi cetakan/dies/jig baru. Menentukan apakah perubahan geometri gambar memerlukan pembuatan cetakan (*Mold/Die*) baru, modifikasi jig pengelasan, atau penggantian insert pemotong CNC.
                  </p>
                </div>

                {/* Digital Sign-Off */}
                <div className="p-3.5 bg-white border border-gray-200 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="font-bold text-xs text-gray-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span> Digital Sign-Off & Tanggal Berlaku
                  </div>
                  <p className="text-[11px] text-gray-600">
                    Otorisasi oleh QA Lead & Engineering Manager sebelum berstatus <code>RELEASED</code> dengan tanggal berlaku efektif yang jelas di lini produksi.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 4: BUKA DI INSPECTOR STUDIO & CHECK SHEET
          ══════════════════════════════════════════════════════════ */}
          {activeHelpTab === 'inspector' && (
            <div className="space-y-4 text-gray-700 max-h-[72vh] overflow-y-auto pr-1">
              <div className="bg-teal-50/60 border border-teal-200 rounded-lg p-3">
                <h4 className="font-extrabold text-sm text-teal-900 flex items-center gap-1.5">
                  <FileCode size={16} className="text-[#00A09D]" /> Pembuatan Balon & Check Sheet di Inspector Studio
                </h4>
                <p className="text-[11px] text-gray-600 mt-1">
                  Menjembatani dokumen gambar teknik dari PLM ke lantai pabrik untuk penomoran balon inspeksi (*First Article Inspection*) dan ekspor ke formulir tablet.
                </p>
              </div>

              <div className="space-y-3">
                {/* Panduan 6 Langkah */}
                <div className="p-3.5 bg-white border border-teal-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-teal-900">Panduan 6 Langkah Mengubah Gambar Menjadi Lembar Pemeriksaan:</div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-gray-700 pl-1">
                    <li>Pilih drawing yang ingin diinspeksi dari daftar sidebar kiri.</li>
                    <li>Klik tombol hijau <strong>[Buka di Inspector Studio]</strong> di bilah navigasi atas.</li>
                    <li>Studio Inspector Designer akan terbuka otomatis dengan gambar blueprint yang sudah ter-load.</li>
                    <li>Klik pada gambar untuk menaruh <strong>Balon Inspeksi</strong> (Point #1, #2, dst.) dan isi batas toleransi (Nominal, Min, Max).</li>
                    <li>Pilih metode alat ukur dari database Supabase (Caliper, Micrometer, Height Gauge, Bore Gauge, CMM).</li>
                    <li>Simpan template. Formulir otomatis muncul di menu <strong>Digital Drawing Check Sheet</strong> untuk diisi oleh operator.</li>
                  </ol>
                </div>

                {/* Validasi Kalibrasi Real-Time */}
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] space-y-1.5">
                  <span className="font-bold text-emerald-900 block text-xs">🛡️ Validasi Status Kalibrasi Otomatis (ISO 9001: 7.1.5):</span>
                  <p className="text-emerald-800 leading-relaxed">
                    Setiap baris pengukuran di check sheet akan menampilkan badge status <strong>`CAL OK`</strong> (hijau) atau <strong>`CAL OVERDUE`</strong> (merah). Jika alat kedaluwarsa, sistem otomatis memperingatkan operator dan mencatat log audit ketidaksesuaian.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════
              TAB 5: STANDAR ALAT UKUR & KALIBRASI (ISO 17025)
          ══════════════════════════════════════════════════════════ */}
          {activeHelpTab === 'metrology' && (
            <div className="space-y-4 text-gray-700 max-h-[72vh] overflow-y-auto pr-1">
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3">
                <h4 className="font-extrabold text-sm text-blue-900 flex items-center gap-1.5">
                  <Ruler size={16} className="text-blue-600" /> Manajemen Inventaris Alat Ukur & Kalibrasi (ISO 17025 / ISO 9001: 7.1.5)
                </h4>
                <p className="text-[11px] text-gray-600 mt-1">
                  Prosedur standar penjaminan mutu keabsahan alat ukur metrologi, ketertelusuran standar nasional KAN, dan pencegahan penggunaan alat kedaluwarsa.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Registrasi & Database Supabase Cloud */}
                <div className="p-3.5 bg-white border border-blue-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span> 1. Registrasi Alat Ukur ke Cloud Database
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Setiap alat ukur di area workshop (Caliper, Micrometer, Bore Gauge, Height Gauge, CMM) wajib terdaftar di menu <strong>Master Alat Ukur (/measuring-tools)</strong> dengan nomor ID unik, serial number, resolusi, akurasi, dan lokasi stasiun kerja.
                  </p>
                </div>

                {/* 2. Siklus Kalibrasi & Peringatan Otomatis */}
                <div className="p-3.5 bg-white border border-amber-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-amber-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span> 2. Siklus Kalibrasi & Tombol Pengingat Notifikasi
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Interval kalibrasi ditetapkan setiap 6 atau 12 bulan. Sistem menghitung tanggal jatuh tempo secara otomatis. Gunakan tombol <strong>[🔔 Kirim Pengingat Email]</strong> untuk mengirimkan disposisi penarikan alat yang berstatus <code>OVERDUE</code> ke tim QA & Mandor Lini.
                  </p>
                </div>

                {/* 3. Ketertelusuran Standar Master */}
                <div className="p-3.5 bg-white border border-purple-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600"></span> 3. Ketertelusuran Standar Master (Traceability Chain)
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Semua kalibrasi in-house dan verifikasi harian wajib mengacu pada <strong>Master Gauge Block Set (Grade 0 / DIN EN ISO 3650)</strong> yang tertelusur langsung ke Laboratorium KAN dan Standar SI Meter BIPM Internasional.
                  </p>
                </div>

                {/* 4. Penempelan Stiker Kalibrasi Fisik */}
                <div className="p-3.5 bg-white border border-emerald-200 rounded-lg space-y-2 shadow-2xs">
                  <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600"></span> 4. Penempelan Stiker Kalibrasi Fisik
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Setelah alat selesai dikalibrasi dan divalidasi, cetak stiker kalibrasi melalui tombol <strong>[🖨️ Cetak Stiker]</strong> dan tempelkan pada bodi alat sebelum alat diserahkan kembali ke operator stasiun kerja.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ── 10. Complete Industrial BOM Templates Modal ── */}
      <Modal show={showBomTemplateModal} onClose={() => setShowBomTemplateModal(false)} title="Template Lengkap BOM (Bill of Materials) Industri" maxWidth="max-w-4xl">
        <div className="flex flex-col gap-4 text-xs">
          <p className="text-gray-600">Pilih salah satu template struktur perakitan manufaktur standar di bawah ini untuk diterapkan langsung ke drawing dan database:</p>

          {/* Template Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BOM_TEMPLATES.map(tpl => (
              <div
                key={tpl.id}
                onClick={() => setSelectedBomTemplate(tpl)}
                className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                  selectedBomTemplate.id === tpl.id ? 'border-[#714B67] bg-[#714B67]/5 shadow-sm ring-2 ring-[#714B67]/20' : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono font-bold text-xs text-[#714B67]">{tpl.code}</span>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-semibold">{tpl.totalParts} Parts</span>
                </div>
                <h5 className="font-bold text-gray-900 text-xs mb-1">{tpl.name}</h5>
                <p className="text-[11px] text-gray-500 line-clamp-2">{tpl.description}</p>
              </div>
            ))}
          </div>

          {/* Selected Template Details & Table Preview */}
          {selectedBomTemplate && (
            <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-sm text-gray-900">{selectedBomTemplate.name} ({selectedBomTemplate.code})</div>
                  <div className="text-[11px] text-gray-500">Kategori: <strong className="text-gray-700">{selectedBomTemplate.category}</strong></div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const tpl = selectedBomTemplate;
                      const headers = ['Item No', 'Part Number', 'Part Name', 'Type', 'Quantity', 'Unit', 'Material', 'Weight (kg)', 'Balloon Ref', 'Engineering Notes'];
                      const rows = tpl.items.map(it => [
                        `"${it.itemNo}"`,
                        `"${it.partCode}"`,
                        `"${it.partName}"`,
                        `"${it.type}"`,
                        it.qty,
                        `"${it.unit}"`,
                        `"${it.material}"`,
                        it.weight,
                        `"${it.balloonRef}"`,
                        `"${it.notes}"`
                      ]);
                      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                      const encodedUri = encodeURI(csvContent);
                      const link = document.createElement('a');
                      link.setAttribute('href', encodedUri);
                      link.setAttribute('download', `BOM_Template_${tpl.code}.csv`);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      toast.success(`✓ File CSV Template BOM ${tpl.code} berhasil diunduh!`);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-semibold text-xs rounded-md shadow-2xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileDown size={13} /> Unduh CSV Template
                  </button>
                  <button
                    onClick={async () => {
                      toast.loading('Menerapkan Template BOM & Master Parts...', { id: 'bom_tpl' });
                      try {
                        const tpl = selectedBomTemplate;
                        let topDwg = selectedDrawing;
                        if (!topDwg) {
                          const createRes = await createDrawing({
                            code: tpl.code,
                            name: tpl.name,
                            drawing_type: 'ASSEMBLY',
                            description: tpl.description
                          });
                          topDwg = createRes.data;
                        }

                        for (let i = 0; i < tpl.items.length; i++) {
                          const item = tpl.items[i];
                          const partRes = await createPart({
                            code: item.partCode,
                            name: item.partName,
                            material: item.material,
                            weight: item.weight,
                            part_type: item.type,
                            unit: item.unit
                          });
                          
                          const childDwgRes = await createDrawing({
                            code: `DWG-${item.partCode}`,
                            name: `${item.partName} Drawing`,
                            drawing_type: 'DETAIL',
                            description: item.notes,
                            master_part_id: partRes.data?.id
                          });

                          if (topDwg && childDwgRes.data) {
                            await addChildDrawing(topDwg.id, childDwgRes.data.id, 'CONTAINS');
                          }
                        }

                        if (!blueprintImage) {
                          await handleLoadDemoPreset('flange');
                        }

                        await loadInitialData();
                        if (topDwg) await selectDrawing(topDwg);
                        setActiveTab('bom');
                        setShowBomTemplateModal(false);
                        toast.success(`✓ Template BOM "${tpl.name}" berhasil diterapkan (${tpl.items.length} Part)!`, { id: 'bom_tpl' });
                      } catch (err) {
                        console.error('Apply BOM error:', err);
                        toast.error(`Gagal menerapkan template BOM: ${err.message}`, { id: 'bom_tpl' });
                      }
                    }}
                    className="px-3.5 py-1.5 bg-[#714B67] hover:bg-[#5C3D54] text-white font-bold text-xs rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles size={13} /> Terapkan ke Drawing Aktif
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                      <th className="py-2 px-3 text-left font-bold text-[10px] uppercase">Item #</th>
                      <th className="py-2 px-3 text-left font-bold text-[10px] uppercase">Part Code</th>
                      <th className="py-2 px-3 text-left font-bold text-[10px] uppercase">Part Name</th>
                      <th className="py-2 px-3 text-center font-bold text-[10px] uppercase">Qty</th>
                      <th className="py-2 px-3 text-left font-bold text-[10px] uppercase">Material</th>
                      <th className="py-2 px-3 text-center font-bold text-[10px] uppercase">Balon</th>
                      <th className="py-2 px-3 text-left font-bold text-[10px] uppercase">Catatan Manufaktur</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBomTemplate.items.map((it, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                        <td className="py-2 px-3 font-mono font-bold text-gray-500">{it.itemNo}</td>
                        <td className="py-2 px-3 font-mono font-bold text-[#00A09D]">{it.partCode}</td>
                        <td className="py-2 px-3 font-semibold text-gray-900">{it.partName}</td>
                        <td className="py-2 px-3 text-center font-bold text-gray-800">{it.qty} {it.unit}</td>
                        <td className="py-2 px-3 text-gray-600">{it.material}</td>
                        <td className="py-2 px-3 text-center">
                          <span className="px-1.5 py-0.5 bg-[#714B67]/10 text-[#714B67] font-bold text-[10px] rounded">
                            {it.balloonRef}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-[11px] text-gray-500">{it.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
