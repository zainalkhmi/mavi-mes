import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Button, ButtonText, ButtonIcon,
  Input, InputField, InputIcon,
  Card, CardBody,
  Badge, BadgeText,
  Switch,
  Progress,
  Spinner,
  Avatar, AvatarFallbackText,
  TriggerEditorModal,
  Image as UiImage,
  PDFViewer as UiPDFViewer,
  Chart as UiChart,
  Timer as UiTimer,
  Counter as UiCounter,
  NumberInput as UiNumberInput,
  DateTimePicker as UiDateTimePicker,
  Gauge as UiGauge,
  Signature as UiSignature,
  ListItem as UiListItem
} from '../components';
import {
  Plus, Trash2, Move, Copy, ChevronDown, ChevronUp,
  GripVertical, Save, Eye, Code, ArrowUp, ArrowDown,
  Layers, Box, Type, Image, Grid3X3, LayoutTemplate,
  CheckSquare, ToggleLeft, ChevronRight, RotateCcw,
  Search, FileText, Palette, Settings, Smartphone,
  Tablet, Monitor, Play, Download, Upload, FolderOpen,
  X, Edit3, Check, LayoutGrid, List,
  Hash, User, Lock, Unlock, Phone, Calendar, Camera,
  FileCode, Gauge, Package, ClipboardCheck,
  BarChart3, Bell, LogOut, Home, Settings2,
  PlusCircle, MinusCircle, Edit, Trash,
  Variable, Zap, Database, Table, Code2,
  PlayCircle, Clock, Wifi, Bluetooth, AlertTriangle,
  ChevronLeft, Link, Unlink, Terminal,
  Activity, TrendingUp, Target, Timer, Filter,
  ArrowRight, RefreshCw, Power, ToggleRight,
  MousePointer, MousePointer2, Printer, Sparkles,
  Undo2, Redo2, Maximize2, Minimize2, ZoomIn, ZoomOut,
  FilePlus, Ruler, Cpu, Factory, Music, Shapes,
  CheckCircle2, ShieldCheck, Sliders, Wrench,
  AlignLeft, ListFilter, Columns, AppWindow, PanelRightClose,
  Loader2, Tag, Compass, ChevronsUpDown, MousePointerClick,
  QrCode, Video, Film, ScanLine, Cast, ExternalLink,
  Bot, Wand2, PenTool
} from 'lucide-react';
import QRCode from 'react-qr-code';
import BuilderCopilot from '../../components/BuilderCopilot';
import GluestackWidgetProperties from './GluestackWidgetProperties';
import {
  saveFrontlineApp,
  getAllFrontlineApps,
  getFrontlineAppById,
  deleteFrontlineApp
} from '../../utils/supabaseFrontlineDB';
import { getAppBuilderType, BUILDER_TYPES } from '../../utils/builderType';
import { useAuth } from '../../contexts/AuthContext';

// Pre-built App Templates available for quick load into canvas (16 Total)
const APP_TEMPLATES = [
  {
    id: 'dashboard',
    title: 'Production Dashboard',
    category: 'Shop Floor',
    description: 'Real-time shift output, OEE target progress, and machine reject rate',
    icon: LayoutGrid,
    color: 'text-emerald-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Production Dashboard', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Card', props: { title: 'OEE Target', content: '85% (Target met)' } },
      { id: 'comp_3', type: 'Card', props: { title: 'Output Today', content: '1,234 pcs' } },
      { id: 'comp_4', type: 'Card', props: { title: 'Reject Rate', content: '2.3% (Below threshold)' } },
      { id: 'comp_5', type: 'Progress', props: { value: 85, label: 'Daily Target Completion' } }
    ]
  },
  {
    id: 'inspection',
    title: 'Quality Inspection Form',
    category: 'Quality Control',
    description: 'Part scan verification, dimensional visual check, and pass/fail decision',
    icon: ClipboardCheck,
    color: 'text-amber-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Quality Inspection Sheet', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Input', props: { label: 'Part / Serial Number', placeholder: 'Scan or enter barcode...' } },
      { id: 'comp_3', type: 'Checkbox', props: { label: 'Visual Surface Check - OK', checked: false } },
      { id: 'comp_4', type: 'Checkbox', props: { label: 'Caliper Tolerance Spec - OK', checked: false } },
      { id: 'comp_5', type: 'Switch', props: { label: 'Pass Inspection Result', value: false } },
      { id: 'comp_6', type: 'Button', props: { text: 'Submit Inspection Result', variant: 'positive' } }
    ]
  },
  {
    id: 'checklist',
    title: 'Daily TPM Checklist',
    category: 'Maintenance',
    description: 'Machine safety guards, oil level, and emergency stop checklist',
    icon: List,
    color: 'text-purple-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Daily Machine TPM Checklist', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Progress', props: { value: 40, label: 'Checklist Progress' } },
      { id: 'comp_3', type: 'Checkbox', props: { label: 'Hydraulic oil level within limits', checked: true } },
      { id: 'comp_4', type: 'Checkbox', props: { label: 'Machine surface and chips cleaned', checked: true } },
      { id: 'comp_5', type: 'Checkbox', props: { label: 'Safety light curtains functional', checked: false } },
      { id: 'comp_6', type: 'Checkbox', props: { label: 'Emergency stop button tested', checked: false } },
      { id: 'comp_7', type: 'Button', props: { text: 'Complete TPM Checklist', variant: 'primary' } }
    ]
  },
  {
    id: 'login',
    title: 'Operator Login Screen',
    category: 'Authentication',
    description: 'Operator NIK badge, PIN password, and station login',
    icon: Lock,
    color: 'text-blue-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'MANDOR MES STATION', size: 'xl', bold: true } },
      { id: 'comp_2', type: 'Text', props: { text: 'Sign in with your employee badge or NIK', size: 'sm', bold: false } },
      { id: 'comp_3', type: 'Input', props: { label: 'Operator NIK', placeholder: 'e.g. OP-1049' } },
      { id: 'comp_4', type: 'Input', props: { label: 'PIN / Security Key', placeholder: '••••', isPassword: true } },
      { id: 'comp_5', type: 'Button', props: { text: 'Sign In to Station', variant: 'primary' } }
    ]
  },
  {
    id: 'workorder',
    title: 'Work Order & Lot Details',
    category: 'Shop Floor',
    description: 'Work order part details, takt time timer, and batch completion',
    icon: Package,
    color: 'text-teal-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Work Order #WO-9921', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Card', props: { title: 'Part Name: Flange Bracket A', content: 'Material: AL6061 | Customer: PT Astra' } },
      { id: 'comp_3', type: 'Timer', props: { label: 'Takt Time Clock', duration: 45 } },
      { id: 'comp_4', type: 'Counter', props: { label: 'Current Good Parts', value: 340 } },
      { id: 'comp_5', type: 'Button', props: { text: 'Complete Batch & Print Tag', variant: 'primary' } }
    ]
  },
  {
    id: 'scada',
    title: 'SCADA Machine Telemetry',
    category: 'Hardware & IoT',
    description: 'Live machine status, tank level indicator, and relay control',
    icon: Cpu,
    color: 'text-cyan-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'CNC Milling Line 1 Status', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Badge', props: { text: 'STATUS: RUNNING' } },
      { id: 'comp_3', type: 'Progress', props: { value: 72, label: 'Coolant Tank Level (72%)' } },
      { id: 'comp_4', type: 'Switch', props: { label: 'Auto Chip Conveyor Relay', value: true } },
      { id: 'comp_5', type: 'Button', props: { text: 'Emergency Line Pause', variant: 'danger' } }
    ]
  },
  {
    id: 'profile',
    title: 'Operator Profile & Station',
    category: 'User',
    description: 'Operator shift metrics, skills badge, and logout action',
    icon: User,
    color: 'text-indigo-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Operator Profile', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Avatar', props: { name: 'Ahmad Fauzi' } },
      { id: 'comp_3', type: 'Card', props: { title: 'Shift 1 - Line Assembly', content: 'Total Output: 450 pcs | Efficiency: 94%' } },
      { id: 'comp_4', type: 'Button', props: { text: 'Switch Station / Logout', variant: 'secondary' } }
    ]
  },
  {
    id: 'digital_checksheet',
    title: 'Digital Checksheet 5-Poin',
    category: 'Shop Floor',
    description: 'Checksheet 5S, verifikasi parameter mesin awal shift, dan konfirmasi operator',
    icon: CheckCircle2,
    color: 'text-emerald-700',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Checksheet Harian Stamping Press', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Input', props: { label: 'Tekanan Hidrolik (Bar)', placeholder: 'Standard 120 - 140 Bar' } },
      { id: 'comp_3', type: 'Checkbox', props: { label: 'Kondisi Guard Pelindung & Sensor Interlock - OK', checked: true } },
      { id: 'comp_4', type: 'Checkbox', props: { label: 'Level Pelumas Silinder Memadai', checked: true } },
      { id: 'comp_5', type: 'Switch', props: { label: 'Konfirmasi Awal Shift Siap Produksi', value: true } },
      { id: 'comp_6', type: 'Button', props: { text: 'Kirim Checksheet Shift', variant: 'primary' } }
    ]
  },
  {
    id: 'aql_sampling',
    title: 'Quality Inspection (AQL Sampling)',
    category: 'Quality Control',
    description: 'Pengujian sampling mutu AQL, counter defect Major/Minor, dan keputusan release lot',
    icon: ShieldCheck,
    color: 'text-rose-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'AQL Sampling Inspection (Lot 80 pcs)', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Card', props: { title: 'Part: Bracket Housing #BH-88', content: 'Sampling Plan: Level II Normal | AQL Major 1.0, Minor 2.5' } },
      { id: 'comp_3', type: 'Counter', props: { label: 'Jumlah Cacat Major (Kritis)', value: 0 } },
      { id: 'comp_4', type: 'Counter', props: { label: 'Jumlah Cacat Minor (Visual)', value: 1 } },
      { id: 'comp_5', type: 'Switch', props: { label: 'Keputusan: RELEASE LOT UNTUK PACKING', value: true } },
      { id: 'comp_6', type: 'Button', props: { text: 'Simpan Rekap AQL & Generate CoA', variant: 'positive' } }
    ]
  },
  {
    id: 'andon',
    title: 'Production Monitoring (Andon)',
    category: 'Shop Floor',
    description: 'Layar Andon status lini, perbandingan target vs aktual, dan tombol panggil maintenance',
    icon: Gauge,
    color: 'text-amber-500',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Lini Assembly 2 - Andon Live Display', size: 'xl', bold: true } },
      { id: 'comp_2', type: 'Badge', props: { text: 'STATUS LINI: RUNNING NORMAL' } },
      { id: 'comp_3', type: 'Card', props: { title: 'Target Shift: 1,500 pcs', content: 'Aktual Saat Ini: 1,120 pcs | Gap: -38 pcs' } },
      { id: 'comp_4', type: 'Progress', props: { value: 75, label: 'Pencapaian Target Shift (75%)' } },
      { id: 'comp_5', type: 'Button', props: { text: 'PANGGIL TEKNISI / SUPERVISOR', variant: 'danger' } }
    ]
  },
  {
    id: 'inventory',
    title: 'Inventory & Bin Management',
    category: 'Warehouse',
    description: 'Pencatatan stok material, alokasi rak bin lokasi, dan peringatan batas minimum stok',
    icon: Layers,
    color: 'text-sky-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Warehouse Stock & Bin Locator', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Card', props: { title: 'Part No: SCR-M6-25 (Hex Bolt M6)', content: 'Bin Lokasi: RAK-B3-L2 | Min Stock: 200 pcs' } },
      { id: 'comp_3', type: 'Input', props: { label: 'Pindah ke Lokasi Bin Baru', placeholder: 'Contoh: RAK-C1-L1' } },
      { id: 'comp_4', type: 'Counter', props: { label: 'Stok Fisik Saat Ini (Pcs)', value: 450 } },
      { id: 'comp_5', type: 'Button', props: { text: 'Perbarui Stok & Simpan Bin', variant: 'primary' } }
    ]
  },
  {
    id: 'kanban',
    title: 'Electronic Kanban Board',
    category: 'Warehouse',
    description: 'Visualisasi kartu e-Kanban pemindahan lot material antar stasiun kerja',
    icon: Sliders,
    color: 'text-violet-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'e-Kanban Card #KB-4029', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Badge', props: { text: 'KANBAN STAGE: IN MACHINING' } },
      { id: 'comp_3', type: 'Card', props: { title: 'Lot No: LOT-20260905-A', content: 'Qty: 250 unit | Asal: Stasiun Press | Tujuan: Stasiun Las' } },
      { id: 'comp_4', type: 'Progress', props: { value: 60, label: 'Progress Cycle Pengerjaan' } },
      { id: 'comp_5', type: 'Button', props: { text: 'Selesaikan & Kirim Kanban ke QC', variant: 'positive' } }
    ]
  },
  {
    id: 'preventive_maint',
    title: 'Preventive Maintenance (PM)',
    category: 'Maintenance',
    description: 'Jadwal pemeliharaan bulanan mesin CNC, checklist penggantian filter, dan sign-off',
    icon: Wrench,
    color: 'text-orange-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Jadwal PM Bulanan CNC Milling #03', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Counter', props: { label: 'Total Jam Kerja Spindle (Hours)', value: 1420 } },
      { id: 'comp_3', type: 'Checkbox', props: { label: 'Ganti Filter Udara Pneumatik & Kuras Air', checked: true } },
      { id: 'comp_4', type: 'Checkbox', props: { label: 'Lumasi Linear Guide Way X/Y/Z Axis', checked: true } },
      { id: 'comp_5', type: 'Checkbox', props: { label: 'Periksa Backlash Ball Screw & Kalibrasi Zero', checked: false } },
      { id: 'comp_6', type: 'Button', props: { text: 'Tanda Tangani & Selesaikan PM', variant: 'primary' } }
    ]
  },
  {
    id: 'visual_sop',
    title: 'Visual SOP & Work Instructions',
    category: 'Training',
    description: 'Panduan langkah kerja standar dengan pedoman APD/PPE dan cycle time timer',
    icon: FileText,
    color: 'text-blue-500',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'SOP Perakitan Sub-Assy Gearbox (Tahap 2)', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Badge', props: { text: 'APD WAJIB: SARUNG TANGAN & KACAMATA SAFETY' } },
      { id: 'comp_3', type: 'Card', props: { title: 'Instruksi: Pemasangan Primary Bearing', content: 'Pastikan alur ring snap terpasang presisi dengan torsi 45 Nm.' } },
      { id: 'comp_4', type: 'Timer', props: { label: 'Standar Cycle Time (40s)', duration: 40 } },
      { id: 'comp_5', type: 'Button', props: { text: 'Langkah Selesai -> Lanjut Tahap 3', variant: 'primary' } }
    ]
  },
  {
    id: 'approval',
    title: 'Multi-Stage Approval Workflow',
    category: 'Management',
    description: 'Pengajuan deviasi produksi, tinjauan supervisor, dan persetujuan Manager QC',
    icon: ShieldCheck,
    color: 'text-yellow-600',
    components: [
      { id: 'comp_1', type: 'Text', props: { text: 'Pengajuan Izin Deviasi Produksi #DEV-082', size: 'lg', bold: true } },
      { id: 'comp_2', type: 'Card', props: { title: 'Permohonan: Penggantian Material Sheet AL5052', content: 'Alasan: Stok AL6061 kosong dari vendor. Telah diuji kekuatan tarik.' } },
      { id: 'comp_3', type: 'Badge', props: { text: 'STATUS: MENUNGGU APPROVAL QC MANAGER' } },
      { id: 'comp_4', type: 'Input', props: { label: 'Catatan Persetujuan Supervisor', placeholder: 'Masukkan catatan rekomendasi...' } },
      { id: 'comp_5', type: 'Button', props: { text: 'Setujui Deviasi (Approve Deviation)', variant: 'positive' } }
    ]
  },
  {
    id: 'blank',
    title: 'Blank Canvas',
    category: 'Empty',
    description: 'Mulai dengan kanvas kosong untuk desain kustom dari nol',
    icon: FileText,
    color: 'text-slate-400',
    components: []
  }
];

// Organized Component Library (27 Gluestack UI & Media Components categorized)
const COMPONENT_GROUPS = [
  {
    category: 'Actions',
    icon: Zap,
    theme: {
      idle: 'bg-amber-100 hover:bg-amber-200/90 text-amber-700 border-amber-300/80',
      active: 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/50',
      iconColor: 'text-amber-700',
      headerText: 'text-amber-700'
    },
    items: [
      { type: 'Button', label: 'Button', icon: LayoutTemplate, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Aksi pemicu tombol' },
      { type: 'Dropdown', label: 'Dropdown', icon: ChevronDown, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Menu aksi konteks dropdown' },
      { type: 'FAB', label: 'FAB', icon: PlusCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Floating Action Button' }
    ]
  },
  {
    category: 'Forms',
    icon: FileText,
    theme: {
      idle: 'bg-blue-100 hover:bg-blue-200/90 text-blue-700 border-blue-300/80',
      active: 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-400/50',
      iconColor: 'text-blue-700',
      headerText: 'text-blue-700'
    },
    items: [
      { type: 'Input', label: 'Input', icon: Box, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'Field input teks' },
      { type: 'Textarea', label: 'Textarea', icon: AlignLeft, color: 'text-cyan-600', bg: 'bg-cyan-50', desc: 'Multi-line text input' },
      { type: 'Select', label: 'Select', icon: ListFilter, color: 'text-sky-600', bg: 'bg-sky-50', desc: 'Dropdown pemilih opsi' },
      { type: 'Checkbox', label: 'Checkbox', icon: CheckSquare, color: 'text-green-600', bg: 'bg-green-50', desc: 'Kotak centang verifikasi' },
      { type: 'Switch', label: 'Switch', icon: ToggleLeft, color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Sakelar status on/off' },
      { type: 'Form', label: 'Form', icon: FileText, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Kontainer form validasi' }
    ]
  },
  {
    category: 'Embed',
    icon: Code2,
    theme: {
      idle: 'bg-violet-100 hover:bg-violet-200/90 text-violet-700 border-violet-300/80',
      active: 'bg-violet-600 text-white border-violet-700 shadow-md ring-2 ring-violet-400/50',
      iconColor: 'text-violet-700',
      headerText: 'text-violet-700'
    },
    items: [
      { type: 'Timer', label: 'Timer / Countdown', icon: Timer, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Untuk cycle time, takt time' },
      { type: 'Counter', label: 'Counter', icon: Hash, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Good parts / Bad parts counter' },
      { type: 'NumberInput', label: 'NumberInput / Stepper', icon: PlusCircle, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Input quantity presisi' },
      { type: 'DateTimePicker', label: 'DateTimePicker', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Schedule maintenance mesin' },
      { type: 'Gauge', label: 'Gauge / Dial', icon: Gauge, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'RPM, Temperature visualization' },
      { type: 'Image', label: 'Image', icon: Image, color: 'text-pink-600', bg: 'bg-pink-50', desc: 'Drawing, defect photos' },
      { type: 'PDFViewer', label: 'PDFViewer', icon: FileText, color: 'text-red-600', bg: 'bg-red-50', desc: 'Work instruction & SOP digital' },
      { type: 'Signature', label: 'Signature', icon: PenTool, color: 'text-teal-600', bg: 'bg-teal-50', desc: 'QC approval tanda tangan' },
      { type: 'ListItem', label: 'ListItem', icon: List, color: 'text-cyan-600', bg: 'bg-cyan-50', desc: 'Data list rows operasional' },
      { type: 'Chart', label: 'LineChart / BarChart', icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'KPI dashboard & OEE trend' }
    ]
  },
  {
    category: 'Media & Devices',
    icon: Video,
    theme: {
      idle: 'bg-emerald-100 hover:bg-emerald-200/90 text-emerald-700 border-emerald-300/80',
      active: 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/50',
      iconColor: 'text-emerald-700',
      headerText: 'text-emerald-700'
    },
    items: [
      { type: 'QRCodeScanner', label: 'QR Scanner', icon: QrCode, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Pindai barcode & QR code kamera' },
      { type: 'VideoPlayer', label: 'Video Player', icon: Video, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Pemutar video SOP & pelatihan kerja' },
      { type: 'Camera', label: 'Camera', icon: Camera, color: 'text-cyan-600', bg: 'bg-cyan-50', desc: 'Viewfinder & capture foto defek QC' }
    ]
  },
  {
    category: 'Surfaces',
    icon: Grid3X3,
    theme: {
      idle: 'bg-orange-100 hover:bg-orange-200/90 text-orange-700 border-orange-300/80',
      active: 'bg-orange-500 text-white border-orange-600 shadow-md ring-2 ring-orange-400/50',
      iconColor: 'text-orange-700',
      headerText: 'text-orange-700'
    },
    items: [
      { type: 'Card', label: 'Card', icon: Grid3X3, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Kontainer card surface' },
      { type: 'Accordion', label: 'Accordion', icon: ChevronsUpDown, color: 'text-orange-600', bg: 'bg-orange-50', desc: 'Section lipat / collapsible' }
    ]
  },
  {
    category: 'Data Display',
    icon: Tag,
    theme: {
      idle: 'bg-cyan-100 hover:bg-cyan-200/90 text-cyan-700 border-cyan-300/80',
      active: 'bg-cyan-600 text-white border-cyan-700 shadow-md ring-2 ring-cyan-400/50',
      iconColor: 'text-cyan-700',
      headerText: 'text-cyan-700'
    },
    items: [
      { type: 'Badge', label: 'Badge', icon: Tag, color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Status tag & chip label' },
      { type: 'Avatar', label: 'Avatar', icon: User, color: 'text-rose-600', bg: 'bg-rose-50', desc: 'Profil operator / avatar' },
      { type: 'Table', label: 'Table', icon: Table, color: 'text-blue-700', bg: 'bg-blue-50', desc: 'Data grid spesifikasi' }
    ]
  },
  {
    category: 'Feedback',
    icon: Bell,
    theme: {
      idle: 'bg-rose-100 hover:bg-rose-200/90 text-rose-700 border-rose-300/80',
      active: 'bg-rose-600 text-white border-rose-700 shadow-md ring-2 ring-rose-400/50',
      iconColor: 'text-rose-700',
      headerText: 'text-rose-700'
    },
    items: [
      { type: 'Alert', label: 'Alert', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50', desc: 'Banner peringatan sistem' },
      { type: 'Toast', label: 'Toast', icon: Bell, color: 'text-indigo-700', bg: 'bg-indigo-50', desc: 'Notifikasi pop-up singkat' },
      { type: 'Progress', label: 'Progress', icon: Gauge, color: 'text-emerald-700', bg: 'bg-emerald-50', desc: 'Bar progres persentase' },
      { type: 'Spinner', label: 'Spinner', icon: Loader2, color: 'text-teal-700', bg: 'bg-teal-50', desc: 'Loading spinner berputar' }
    ]
  },
  {
    category: 'Navigation',
    icon: Compass,
    theme: {
      idle: 'bg-indigo-100 hover:bg-indigo-200/90 text-indigo-700 border-indigo-300/80',
      active: 'bg-indigo-600 text-white border-indigo-700 shadow-md ring-2 ring-indigo-400/50',
      iconColor: 'text-indigo-700',
      headerText: 'text-indigo-700'
    },
    items: [
      { type: 'Tabs', label: 'Tabs', icon: Columns, color: 'text-sky-700', bg: 'bg-sky-50', desc: 'Tab navigasi segmented' },
      { type: 'Command', label: 'Command', icon: Terminal, color: 'text-slate-700', bg: 'bg-slate-100', desc: 'Palet pencarian cepat' },
      { type: 'Navigation', label: 'Navbar', icon: Compass, color: 'text-blue-800', bg: 'bg-blue-50', desc: 'Header navigasi bar' },
      { type: 'BottomNavigation', label: 'BottomNav', icon: Smartphone, color: 'text-teal-800', bg: 'bg-teal-50', desc: 'Mobile bottom dock bar' }
    ]
  },
  {
    category: 'Overlays',
    icon: AppWindow,
    theme: {
      idle: 'bg-purple-100 hover:bg-purple-200/90 text-purple-700 border-purple-300/80',
      active: 'bg-purple-600 text-white border-purple-700 shadow-md ring-2 ring-purple-400/50',
      iconColor: 'text-purple-700',
      headerText: 'text-purple-700'
    },
    items: [
      { type: 'Modal', label: 'Modal', icon: AppWindow, color: 'text-purple-700', bg: 'bg-purple-50', desc: 'Dialog popup overlay' },
      { type: 'Drawer', label: 'Drawer', icon: PanelRightClose, color: 'text-fuchsia-700', bg: 'bg-fuchsia-50', desc: 'Slide-in panel drawer' }
    ]
  }
];


// Trigger and Action types for components
const TRIGGER_TYPES = [
  { id: 'onClick', name: 'On Click', icon: MousePointer, description: 'When user taps the component' },
  { id: 'onChange', name: 'On Change', icon: RefreshCw, description: 'When value changes' },
  { id: 'onLoad', name: 'On Screen Load', icon: PlayCircle, description: 'When screen loads' },
  { id: 'onLongPress', name: 'On Long Press', icon: Clock, description: 'When user long presses' },
  { id: 'onSwipe', name: 'On Swipe', icon: Activity, description: 'When user swipes' },
];

const ACTION_TYPES = [
  { id: 'NAVIGATE', name: 'Navigate to Screen', icon: ArrowRight, description: 'Go to another screen' },
  { id: 'SET_VARIABLE', name: 'Set Variable', icon: Variable, description: 'Update variable value' },
  { id: 'UPDATE_RECORD', name: 'Update Record', icon: Database, description: 'Save to Record Placeholder / Table' },
  { id: 'SHOW_TOAST', name: 'Show Toast', icon: Bell, description: 'Display notification' },
  { id: 'CALL_FUNCTION', name: 'Call Function', icon: Code2, description: 'Execute custom script' },
  { id: 'TOGGLE', name: 'Toggle Component', icon: ToggleRight, description: 'Toggle another component' },
  { id: 'REFRESH', name: 'Refresh Data', icon: RefreshCw, description: 'Reload screen data' },
  { id: 'LOGOUT', name: 'Logout', icon: LogOut, description: 'Sign out user' },
];

const VARIABLE_TYPES = [
  { id: 'string', name: 'Text', icon: Type, color: 'text-blue-600' },
  { id: 'number', name: 'Number', icon: Hash, color: 'text-green-600' },
  { id: 'boolean', name: 'Boolean', icon: ToggleLeft, color: 'text-amber-600' },
  { id: 'date', name: 'Date', icon: Calendar, color: 'text-purple-600' },
];

// Screen settings presets
const SCREEN_PRESETS = [
  { id: 'default', name: 'Default White', bgColor: 'white', headerColor: 'slate-900', showHeader: true, showNavBar: false },
  { id: 'dark', name: 'Dark Industrial', bgColor: '#12131c', headerColor: 'black', showHeader: true, showNavBar: false },
  { id: 'transparent', name: 'Clean Transparent', bgColor: 'transparent', headerColor: 'slate-900', showHeader: false, showNavBar: false },
  { id: 'withNavbar', name: 'With Bottom Nav', bgColor: 'white', headerColor: 'slate-900', showHeader: true, showNavBar: true },
];

// Generate unique ID
const generateId = () => `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Default component properties generator for 24 Gluestack UI components
const getDefaultProps = (type) => {
  switch (type) {
    // Actions
    case 'Button': return { text: 'Action Button', variant: 'primary' };
    case 'Dropdown': return { label: 'Opsi Tindakan...', items: ['Export PDF', 'Cetak Label', 'Kirim Notifikasi'] };
    case 'FAB': return { label: 'Scan QR', action: 'positive' };

    // Forms
    case 'Input': return { placeholder: 'Enter text...', label: 'Input Field', isPassword: false };
    case 'Textarea': return { placeholder: 'Tulis catatan inspeksi...', label: 'Keterangan Detail', rows: 3 };
    case 'Select': return { label: 'Pilih Shift', placeholder: 'Pilih opsi...', options: ['Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)'] };
    case 'Checkbox': return { label: 'Pemeriksaan Visual - OK', checked: false };
    case 'Switch': return { label: 'Aktifkan Mesin', value: true };
    case 'Form': return { title: 'Formulir Inspeksi', description: 'Harap isi semua parameter sebelum verifikasi' };

    // Media & Devices
    case 'QRCodeScanner': return { label: 'Pindai QR / Barcode Part', subtitle: 'Arahkan kamera ke label lot', aspectRatio: 'square', showControls: true, autoScan: true };
    case 'VideoPlayer': return { title: 'SOP Perakitan Sub-Assy Pompa Hidrolik', subtitle: 'Instruksi Kerja Standar • Rev 2.1', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', poster: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', aspectRatio: '16:9', autoPlay: false, controls: true };
    case 'Camera': return { label: 'Kamera Inspeksi Defek Visual', subtitle: 'Ambil foto bukti cacat atau kelayakan part', showGrid: true, showShutter: true, aspectRatio: 'square' };

    // Surfaces
    case 'Card': return { title: 'Card Container', content: 'Konten spesifikasi dan parameter part...' };
    case 'Accordion': return { title: '1. Verifikasi Parameter Awal', content: 'Periksa kelengkapan fixture dan pastikan sensor berfungsi normal.' };

    // Data Display
    case 'Badge': return { text: 'PASSED', action: 'success' };
    case 'Avatar': return { name: 'OP-01', size: 'md' };
    case 'Table': return { title: 'Spesifikasi Toleransi', headers: ['Parameter', 'Standar', 'Aktual'], rows: [['Torsi Baut', '45 Nm', '45.2 Nm'], ['Ketebalan', '2.5 mm', '2.51 mm']] };

    // Feedback
    case 'Alert': return { title: 'Peringatan Safety', message: 'Pastikan APD kacamata pelindung selalu dipakai di line ini.', action: 'warning' };
    case 'Toast': return { title: 'Data Tersimpan', message: 'Hasil inspeksi berhasil disinkronisasi ke server.', action: 'success' };
    case 'Progress': return { value: 75, label: 'Target Output Shift' };
    case 'Spinner': return { label: 'Menyinkronkan data...', color: '#008784' };

    // Navigation
    case 'Tabs': return { tabs: ['Info Part', 'Spesifikasi', 'Riwayat'], activeIndex: 0 };
    case 'Command': return { placeholder: 'Cari modul atau serial number part...' };
    case 'Navigation': return { brand: 'MaviCore MES', current: 'Inspeksi QC' };
    case 'BottomNavigation': return { items: ['Home', 'Scan', 'QC Check', 'Profil'] };

    // Overlays
    case 'Modal': return { title: 'Konfirmasi Reject Lot', body: 'Apakah Anda yakin ingin menandai Lot ini sebagai NG?' };
    case 'Drawer': return { title: 'Panel Filter', content: 'Filter riwayat inspeksi berdasarkan tanggal, operator, dan mesin.' };

    // Embed Widgets
    case 'Timer': return { label: 'Cycle Time / Takt Time', duration: 45, mode: 'countdown', autoStart: false };
    case 'Counter': return { label: 'Good Parts Counter', value: 0, step: 1, min: 0, max: 99999 };
    case 'NumberInput': return { label: 'Input Quantity (Pcs)', value: 10, min: 1, max: 1000, step: 1 };
    case 'DateTimePicker': return { label: 'Jadwal Preventive Maintenance', mode: 'datetime' };
    case 'Gauge': return { label: 'Spindle Speed (RPM)', value: 1850, min: 0, max: 3000, unit: 'RPM', warningThreshold: 2400, dangerThreshold: 2800 };
    case 'Image': return { title: 'Technical Drawing - Part #AL-502', src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800', alt: 'Technical Drawing', aspectRatio: '16:9', zoomable: true, badgeText: 'CAD DRAWING' };
    case 'PDFViewer': return { title: 'WI-042: Standar Perakitan Gearbox & Torsi', docNo: 'SOP-QC-2026-08', rev: 'Rev 2.3', pages: 3 };
    case 'Signature': return { label: 'Approval Tanda Tangan QC', placeholder: 'Bubuhkan tanda tangan persetujuan QC di sini' };
    case 'ListItem': return { title: 'LOT-20260906-01: Housing Gear', subtitle: 'Target Qty: 250 unit • Station Press 02', status: 'IN_PROGRESS', badge: 'Station 2', value: '250 Pcs' };
    case 'Chart':
    case 'LineChart':
    case 'BarChart':
      return {
        title: 'KPI Output & OEE Trend Shift 1',
        subtitle: 'Pencapaian per jam vs Target',
        type: 'line',
        unit: 'pcs',
        targetValue: 50,
        data: [
          { label: '07:00', value: 42, target: 50 },
          { label: '08:00', value: 48, target: 50 },
          { label: '09:00', value: 54, target: 50 },
          { label: '10:00', value: 52, target: 50 },
          { label: '11:00', value: 58, target: 50 },
          { label: '12:00', value: 35, target: 50 },
          { label: '13:00', value: 56, target: 50 },
          { label: '14:00', value: 60, target: 50 }
        ]
      };

    // Text & Fallbacks
    case 'Text': return { text: 'Label Text', size: 'sm', bold: false };
    default: return { label: type };
  }
};

// Helper icon for screen tree components
const getComponentIcon = (type) => {
  switch (type) {
    case 'Button': return LayoutTemplate;
    case 'Dropdown': return ChevronDown;
    case 'FAB': return PlusCircle;
    case 'Input': return Box;
    case 'Textarea': return AlignLeft;
    case 'Select': return ListFilter;
    case 'Checkbox': return CheckSquare;
    case 'Switch': return ToggleLeft;
    case 'Form': return FileText;
    case 'QRCodeScanner': return QrCode;
    case 'VideoPlayer': return Video;
    case 'Camera': return Camera;
    case 'Card': return Grid3X3;
    case 'Accordion': return ChevronsUpDown;
    case 'Badge': return Tag;
    case 'Avatar': return User;
    case 'Table': return Table;
    case 'Alert': return AlertTriangle;
    case 'Toast': return Bell;
    case 'Progress': return Gauge;
    case 'Spinner': return Loader2;
    case 'Tabs': return Columns;
    case 'Command': return Terminal;
    case 'Navigation': return Compass;
    case 'BottomNavigation': return Smartphone;
    case 'Modal': return AppWindow;
    case 'Drawer': return PanelRightClose;
    case 'Text': return Type;
    case 'Timer': return Timer;
    case 'Counter': return Hash;
    case 'NumberInput': return PlusCircle;
    case 'DateTimePicker': return Calendar;
    case 'Gauge': return Gauge;
    case 'Image': return Image;
    case 'PDFViewer': return FileText;
    case 'Signature': return PenTool;
    case 'ListItem': return List;
    case 'Chart':
    case 'LineChart':
    case 'BarChart': return BarChart3;
    default: return Box;
  }
};

export default function AppCanvas({
  deviceFrame: controlledDeviceFrame,
  onDeviceFrameChange
} = {}) {
  let authUser = null;
  try {
    const auth = useAuth();
    authUser = auth?.user || null;
  } catch (e) {
    // safe fallback if rendered outside AuthProvider
  }

  // Device Frame selection
  const [internalDeviceFrame, setInternalDeviceFrame] = useState('iphone');
  const currentDeviceFrame = controlledDeviceFrame || internalDeviceFrame;
  const setDeviceFrame = onDeviceFrameChange || setInternalDeviceFrame;

  // Zoom and Canvas view state
  const [zoom, setZoom] = useState(100);
  const [isCanvasLocked, setIsCanvasLocked] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [previewFormValues, setPreviewFormValues] = useState({});
  const [previewCounters, setPreviewCounters] = useState({});
  const [previewTabsState, setPreviewTabsState] = useState({});
  const [previewAccordionState, setPreviewAccordionState] = useState({});
  const [previewDropdownState, setPreviewDropdownState] = useState({});
  const [previewTimersState, setPreviewTimersState] = useState({});

  // Active ticking timer in Preview Mode
  useEffect(() => {
    if (!isPreview) return;
    const interval = setInterval(() => {
      setPreviewTimersState(prev => {
        let changed = false;
        const next = { ...prev };
        Object.keys(next).forEach(id => {
          if (next[id]?.running && next[id]?.time > 0) {
            next[id] = { ...next[id], time: next[id].time - 1 };
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isPreview]);

  // Selected Component ID & View State
  const [selectedId, setSelectedId] = useState(null);


  // Reset function to clear canvas
  const handleResetCanvas = () => {
    setScreens([
      {
        id: 'screen_1',
        title: 'Home',
        components: [
          { id: 'comp_1', type: 'Text', props: { text: 'Mobile Dashboard', size: 'lg', bold: true } }
        ],
        triggers: []
      }
    ]);
    setCurrentScreenId('screen_1');
    setSelectedId(null);
  };

  // Tabs: Left Pane (SCREENS | RECORDS), Right Pane (WIDGET | SCREEN | APP)
  const [activeLeftTab, setActiveLeftTab] = useState('SCREENS'); // SCREENS | RECORDS
  const [activeRightTab, setActiveRightTab] = useState('WIDGET'); // WIDGET | SCREEN | APP

  // App Metadata - Only user created apps are displayed (NO dummy hardcoded apps)
  const [appName, setAppName] = useState('Mobile App');
  const [currentAppId, setCurrentAppId] = useState(() => `app_${Date.now()}`);
  const [appsList, setAppsList] = useState(() => {
    try {
      const stored = localStorage.getItem('mavi_ui_engine_apps');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Exclude dummy placeholder apps
        return (parsed || []).filter(a =>
          a && a.id !== 'app_1' && a.id !== 'app_2' && a.name !== 'app test' && a.name !== 'Digital_Checksheet_5Poin'
        );
      }
    } catch (e) {
      console.warn('Failed to parse local gluestack apps:', e);
    }
    return [];
  });
  const [isLoadingAppsList, setIsLoadingAppsList] = useState(false);
  const [isEditingAppName, setIsEditingAppName] = useState(false);
  const [isCompanionModalOpen, setIsCompanionModalOpen] = useState(false);
  const [isSavingApp, setIsSavingApp] = useState(false);
  const [isSavedAppFeedback, setIsSavedAppFeedback] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [preCopilotSnapshot, setPreCopilotSnapshot] = useState(null);

  const [openPalette, setOpenPalette] = useState(null); // 'COMPONENTS' | null
  const [componentSearch, setComponentSearch] = useState('');
  const [templateSearch, setTemplateSearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [expandedScreens, setExpandedScreens] = useState(new Set(['screen_1']));

  // Toggle expand/collapse screen in tree
  const toggleExpandScreen = (scrId) => {
    setExpandedScreens(prev => {
      const next = new Set(prev);
      if (next.has(scrId)) {
        next.delete(scrId);
      } else {
        next.add(scrId);
      }
      return next;
    });
  };

  // Add new screen directly from pre-built template
  const addScreenFromTemplate = (template) => {
    const newComps = (template.components || []).map(c => ({
      ...c,
      id: generateId()
    }));
    const newScr = {
      id: `screen_${Date.now()}`,
      title: template.title || `Screen ${screens.length + 1}`,
      components: newComps,
      triggers: []
    };
    setScreens(prev => [...prev, newScr]);
    setCurrentScreenId(newScr.id);
    setSelectedId(null);
    setExpandedScreens(prev => new Set([...prev, newScr.id]));
    setShowTemplateModal(false);
    setActiveDropdown(null);
  };

  // Load full app template
  const loadTemplate = (template) => {
    if (screenComponents.length > 0) {
      if (!confirm(`Terapkan template "${template.title}"? Komponen di layar saat ini akan digantikan.`)) {
        return;
      }
    }
    const newComps = template.components.map(c => ({
      ...c,
      id: generateId()
    }));
    updateComponents(newComps);
    setScreens(prev => prev.map(s => s.id === currentScreenId ? { ...s, title: template.title } : s));
    setOpenPalette(null);
    setSelectedId(null);
  };



  // Screens State
  const [screens, setScreens] = useState([
    {
      id: 'screen_1',
      title: 'Screen 1',
      components: [
        { id: 'comp_1', type: 'Text', props: { text: 'Production Dashboard', size: 'lg', bold: true } },
        { id: 'comp_2', type: 'Card', props: { title: 'OEE Target', content: '85%' } },
        { id: 'comp_3', type: 'Card', props: { title: 'Output Today', content: '1,234 pcs' } },
        { id: 'comp_4', type: 'Card', props: { title: 'Reject Rate', content: '2.3%' } },
        { id: 'comp_5', type: 'Progress', props: { value: 85, label: 'Daily Target' } }
      ],
      triggers: []
    }
  ]);
  const [currentScreenId, setCurrentScreenId] = useState('screen_1');
  const [editingScreenTitle, setEditingScreenTitle] = useState(null);
  const [newScreenTitle, setNewScreenTitle] = useState('');

  // Drag reorder
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Screen Reordering Drag & Drop states
  const [draggedScreenIndex, setDraggedScreenIndex] = useState(null);
  const [dragOverScreenIndex, setDragOverScreenIndex] = useState(null);

  // Screen Settings (Background, Header, Nav)
  const [screenSettings, setScreenSettings] = useState({
    bgColor: '#f8fafc',
    headerColor: 'white',
    showHeader: true,
    showNavBar: false,
    screenPreset: 'default'
  });

  // Data Sources: Tables & Record Placeholders
  const [tables, setTables] = useState([
    {
      id: 'table_1',
      name: 'WorkOrders',
      columns: [{ name: 'id' }, { name: 'orderNo' }, { name: 'status' }, { name: 'partNumber' }]
    },
    {
      id: 'table_2',
      name: 'InspectionLog',
      columns: [{ name: 'id' }, { name: 'recordId' }, { name: 'partNumber' }, { name: 'result' }, { name: 'operator' }]
    }
  ]);
  const [recordPlaceholders, setRecordPlaceholders] = useState([
    { id: 'rp_1', name: 'Current Work Order', tableId: 'table_1', field: 'orderNo' },
    { id: 'rp_2', name: 'Active Inspection', tableId: 'table_2', field: 'partNumber' }
  ]);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const [showAddRpModal, setShowAddRpModal] = useState(false);
  const [newRpName, setNewRpName] = useState('');
  const [newRpTableId, setNewRpTableId] = useState('table_1');

  // App Variables
  const [variables, setVariables] = useState([
    { id: 'var_1', name: 'CURRENT_OPERATOR', type: 'string', value: 'OP-01', persisted: true },
    { id: 'var_2', name: 'TARGET_QTY', type: 'number', value: '1500', persisted: false },
    { id: 'var_3', name: 'LINE_STOPPED', type: 'boolean', value: false, persisted: false }
  ]);
  const [newVar, setNewVar] = useState({ name: '', type: 'string', value: '' });

  // Synchronous refs for Copilot batch command execution (ensures multi-screen, triggers, and tables are consistent in loops)
  const screensRef = useRef(screens);
  const currentScreenIdRef = useRef(currentScreenId);
  const tablesRef = useRef(tables);
  const variablesRef = useRef(variables);
  const recordPlaceholdersRef = useRef(recordPlaceholders);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => { screensRef.current = screens; }, [screens]);
  useEffect(() => { currentScreenIdRef.current = currentScreenId; }, [currentScreenId]);
  useEffect(() => { tablesRef.current = tables; }, [tables]);
  useEffect(() => { variablesRef.current = variables; }, [variables]);
  useEffect(() => { recordPlaceholdersRef.current = recordPlaceholders; }, [recordPlaceholders]);
  useEffect(() => { selectedIdRef.current = selectedId; }, [selectedId]);

  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);

  // Active Screen & Components
  const currentScreen = screens.find(s => s.id === currentScreenId) || screens[0];
  const screenComponents = currentScreen?.components || [];
  const selectedComponent = screenComponents.find(c => c.id === selectedId);

  // Close open palette when clicking outside
  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest('[data-palette-root]')) {
        setOpenPalette(null);
        setActiveDropdown(null);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Update Components with History
  const updateComponents = useCallback((newComponents) => {
    setHistory(prev => [...prev.slice(-20), screens]);
    setFuture([]);
    setScreens(prev => prev.map(s =>
      s.id === currentScreenId ? { ...s, components: newComponents } : s
    ));
  }, [currentScreenId, screens]);

  // Undo / Redo
  const handleUndo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture(prev => [screens, ...prev]);
    setHistory(prev => prev.slice(0, prev.length - 1));
    setScreens(previous);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory(prev => [...prev, screens]);
    setFuture(prev => prev.slice(1));
    setScreens(next);
  };

  // Add Component to Canvas
  const addComponent = (type, customProps = {}) => {
    const newComponent = {
      id: generateId(),
      type,
      props: { ...getDefaultProps(type), ...customProps },
      triggers: [],
      dataSource: { type: 'none', tableId: '', column: '', recordPlaceholderId: '' }
    };
    const nextComponents = [...screenComponents, newComponent];
    updateComponents(nextComponents);
    setSelectedId(newComponent.id);
    setActiveRightTab('WIDGET');
    setOpenPalette(null);
  };

  // Remove Component
  const removeComponent = (id) => {
    const next = screenComponents.filter(c => c.id !== id);
    updateComponents(next);
    if (selectedId === id) setSelectedId(null);
  };

  // Duplicate Component
  const duplicateComponent = (id) => {
    const target = screenComponents.find(c => c.id === id);
    if (!target) return;
    const duplicate = {
      ...JSON.parse(JSON.stringify(target)),
      id: generateId()
    };
    updateComponents([...screenComponents, duplicate]);
    setSelectedId(duplicate.id);
  };

  // Move Component up/down
  const moveComponent = (id, direction) => {
    const idx = screenComponents.findIndex(c => c.id === id);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      const next = [...screenComponents];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      updateComponents(next);
    } else if (direction === 'down' && idx < screenComponents.length - 1) {
      const next = [...screenComponents];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      updateComponents(next);
    }
  };

  // Reorder component stack (Bring to Front, Send to Back, Forward, Backward)
  const reorderComponent = (id, action) => {
    const idx = screenComponents.findIndex(c => c.id === id);
    if (idx === -1) return;
    const next = [...screenComponents];
    const item = next.splice(idx, 1)[0];
    if (action === 'FRONT') {
      next.push(item);
    } else if (action === 'BACK') {
      next.unshift(item);
    } else if (action === 'FORWARD') {
      const newIdx = Math.min(next.length, idx + 1);
      next.splice(newIdx, 0, item);
    } else if (action === 'BACKWARD') {
      const newIdx = Math.max(0, idx - 1);
      next.splice(newIdx, 0, item);
    }
    updateComponents(next);
  };

  // Update component props
  const updateProps = (id, newProps) => {
    const next = screenComponents.map(c =>
      c.id === id ? { ...c, props: { ...c.props, ...newProps } } : c
    );
    updateComponents(next);
  };

  // Update component data source binding
  const updateDataSource = (id, dataSourceUpdates) => {
    const next = screenComponents.map(c =>
      c.id === id ? { ...c, dataSource: { ...(c.dataSource || {}), ...dataSourceUpdates } } : c
    );
    updateComponents(next);
  };

  // Trigger Editor State (Mavi AppBuilder Modal)
  const [triggerEditor, setTriggerEditor] = useState({
    isOpen: false,
    sourceType: 'WIDGET',
    sourceId: null,
    trigger: null,
    editIndex: -1
  });

  // Active Toast notification for actions / feedback
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 3200);
    return () => clearTimeout(timer);
  }, [activeToast]);

  // Companion URL helper (Clean live real device runner)
  const getCompanionUrl = useCallback(() => {
    const origin = window.location.origin || '';
    const pathname = window.location.pathname || '';
    return `${origin}${pathname}#/app-player?appId=${encodeURIComponent(currentAppId || 'app_1')}&mode=companion`;
  }, [currentAppId]);

  // Load user's Gluestack apps from Supabase & localStorage (NO hardcoded mock apps)
  const loadGluestackApps = useCallback(async () => {
    setIsLoadingAppsList(true);
    try {
      const remoteApps = await getAllFrontlineApps();
      // Filter strictly to Gluestack apps created by the user or belonging to gluestack
      const gluestackApps = (remoteApps || []).filter(app => {
        // Exclude dummy placeholder apps
        if (app.id === 'app_1' || app.id === 'app_2' || app.name === 'app test' || app.name === 'Digital_Checksheet_5Poin') {
          return false;
        }
        const isGluestack = getAppBuilderType(app) === BUILDER_TYPES.GLUESTACK;
        if (!isGluestack) return false;

        // If user is authenticated and app has created_by / user_id metadata, ensure it matches user
        if (authUser?.id && (app.created_by || app.user_id)) {
          return app.created_by === authUser.id || app.user_id === authUser.id;
        }
        return true;
      });

      // Also read local saved apps
      let localApps = [];
      try {
        const stored = localStorage.getItem('mavi_ui_engine_apps');
        if (stored) {
          localApps = (JSON.parse(stored) || []).filter(a =>
            a && a.id !== 'app_1' && a.id !== 'app_2' && a.name !== 'app test' && a.name !== 'Digital_Checksheet_5Poin'
          );
        }
      } catch (e) {
        // ignore
      }

      // Merge remote and local apps by id, avoiding duplicates
      const mergedMap = new Map();
      gluestackApps.forEach(a => {
        mergedMap.set(a.id, {
          id: a.id,
          name: a.name || 'Untitled App',
          updated_at: a.updated_at || a.created_at || new Date().toISOString(),
          config: a.config
        });
      });
      localApps.forEach(a => {
        if (!mergedMap.has(a.id)) {
          mergedMap.set(a.id, a);
        }
      });

      const finalApps = Array.from(mergedMap.values());
      setAppsList(finalApps);
      try {
        localStorage.setItem('mavi_ui_engine_apps', JSON.stringify(finalApps));
      } catch (e) {
        // ignore
      }
    } catch (err) {
      console.warn('[GlueStack] Failed to load remote apps:', err);
    } finally {
      setIsLoadingAppsList(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadGluestackApps();
  }, [loadGluestackApps]);

  // Select and load an app from the list onto the canvas
  const handleSelectApp = useCallback(async (app) => {
    if (!app || !app.id) return;
    setCurrentAppId(app.id);
    setAppName(app.name || 'Untitled App');

    // 1. Try to load from localStorage first
    try {
      const localData = localStorage.getItem(`mavi_app_${app.id}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (parsed.screens && Array.isArray(parsed.screens)) {
          setScreens(parsed.screens);
          if (parsed.variables) setVariables(parsed.variables);
          if (parsed.tables) setTables(parsed.tables);
          if (parsed.recordPlaceholders) setRecordPlaceholders(parsed.recordPlaceholders);
          setCurrentScreenId(parsed.screens[0]?.id || 'screen_1');
          setActiveToast({ message: `Aplikasi "${app.name}" berhasil dimuat`, type: 'SUCCESS' });
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to load app from localStorage:', e);
    }

    // 2. If app object already has config (from remote list)
    if (app.config && app.config.components) {
      setScreens(app.config.components);
      if (app.config.variables) setVariables(app.config.variables);
      if (app.config.tables) setTables(app.config.tables);
      if (app.config.recordPlaceholders) setRecordPlaceholders(app.config.recordPlaceholders);
      setCurrentScreenId(app.config.components[0]?.id || 'screen_1');
      setActiveToast({ message: `Aplikasi "${app.name}" berhasil dimuat`, type: 'SUCCESS' });
      return;
    }

    // 3. Fallback: Fetch from Supabase by ID
    try {
      const remoteData = await getFrontlineAppById(app.id);
      if (remoteData && remoteData.config) {
        const cfg = remoteData.config;
        if (cfg.components && Array.isArray(cfg.components)) setScreens(cfg.components);
        if (cfg.variables) setVariables(cfg.variables);
        if (cfg.tables) setTables(cfg.tables);
        if (cfg.recordPlaceholders) setRecordPlaceholders(cfg.recordPlaceholders);
        setCurrentScreenId(cfg.components?.[0]?.id || 'screen_1');
        setActiveToast({ message: `Aplikasi "${app.name}" berhasil dimuat`, type: 'SUCCESS' });
      }
    } catch (err) {
      console.error('Failed to load remote app data:', err);
    }
  }, []);

  // Delete an app from the list, localStorage, and Supabase
  const handleDeleteApp = useCallback(async (app, e) => {
    if (e) e.stopPropagation();
    const confirmed = window.confirm(`Apakah Anda yakin ingin menghapus aplikasi "${app.name}"?`);
    if (!confirmed) return;

    // Remove from state
    setAppsList(prev => prev.filter(a => a.id !== app.id));

    // Remove from localStorage
    try {
      localStorage.removeItem(`mavi_app_${app.id}`);
      const stored = localStorage.getItem('mavi_ui_engine_apps');
      if (stored) {
        const parsed = (JSON.parse(stored) || []).filter(a => a.id !== app.id);
        localStorage.setItem('mavi_ui_engine_apps', JSON.stringify(parsed));
      }
    } catch (err) {
      // ignore
    }

    // Remove from Supabase if valid ID
    if (app.id && app.id.length > 20) {
      try {
        await deleteFrontlineApp(app.id);
      } catch (err) {
        console.warn('Failed to delete app from Supabase:', err);
      }
    }

    setActiveToast({ message: `Aplikasi "${app.name}" dihapus`, type: 'INFO' });

    // If active app was deleted, reset canvas to a new blank screen
    if (currentAppId === app.id) {
      setCurrentAppId(`app_${Date.now()}`);
      setAppName('Mobile App');
      setScreens([
        {
          id: 'screen_1',
          title: 'Home',
          components: [
            { id: 'comp_1', type: 'Text', props: { text: 'Mobile Dashboard', size: 'lg', bold: true } },
            { id: 'comp_2', type: 'Card', props: { title: 'OEE Target', content: '85%' } },
            { id: 'comp_3', type: 'Card', props: { title: 'Output Today', content: '1,234 pcs' } },
            { id: 'comp_4', type: 'Card', props: { title: 'Reject Rate', content: '2.3%' } },
            { id: 'comp_5', type: 'Progress', props: { value: 85, label: 'Daily Target' } }
          ],
          triggers: []
        }
      ]);
    }
  }, [currentAppId]);

  // Save App to localStorage AND Supabase
  const handleSaveApp = useCallback(async () => {
    setIsSavingApp(true);
    try {
      const appPayload = {
        id: currentAppId || `app_${Date.now()}`,
        name: appName.trim() || 'Untitled App',
        screens,
        variables,
        tables,
        recordPlaceholders,
        updated_at: new Date().toISOString()
      };
      // Save specific app state to localStorage
      localStorage.setItem(`mavi_app_${appPayload.id}`, JSON.stringify(appPayload));

      // Update apps list in state & storage
      setAppsList(prev => {
        const nextList = [...prev];
        const idx = nextList.findIndex(a => a.id === appPayload.id);
        if (idx >= 0) {
          nextList[idx] = { id: appPayload.id, name: appPayload.name, updated_at: appPayload.updated_at };
        } else {
          nextList.push({ id: appPayload.id, name: appPayload.name, updated_at: appPayload.updated_at });
        }
        try {
          localStorage.setItem('mavi_ui_engine_apps', JSON.stringify(nextList));
        } catch (e) {
          console.warn('Failed to persist apps list:', e);
        }
        return nextList;
      });

      // Save to Supabase with builder_type = 'gluestack'
      try {
        const supabasePayload = {
          name: appPayload.name,
          category: 'GlueStack App',
          config: {
            components: screens || [],
            variables: variables || [],
            tables: tables || [],
            recordPlaceholders: recordPlaceholders || []
          },
          builder_type: 'gluestack',
          created_by: authUser?.id || undefined,
          version: 1
        };

        // If we have a currentAppId that looks like a UUID from Supabase, use it for update
        const existingId = currentAppId && currentAppId.includes('-') && currentAppId.length > 20
          ? currentAppId
          : null;

        if (existingId) {
          supabasePayload.id = existingId;
        }

        const saved = await saveFrontlineApp(supabasePayload);
        if (saved && saved.id) {
          // Update local state with the Supabase ID if it was a new save
          if (!existingId && saved.id !== currentAppId) {
            // The app got a new UUID, update localStorage with new ID
            localStorage.setItem(`mavi_app_${saved.id}`, JSON.stringify({ ...appPayload, id: saved.id }));
            localStorage.removeItem(`mavi_app_${currentAppId}`);
            setCurrentAppId(saved.id);
          }
          console.log('[GlueStack] App saved to Supabase:', saved.id);
          // Refresh list from remote
          loadGluestackApps();
        }
      } catch (supabaseErr) {
        console.warn('[GlueStack] Failed to save to Supabase (will work offline):', supabaseErr.message);
        // Don't fail the whole save if Supabase fails - localStorage still works
      }

      setIsSavedAppFeedback(true);
      setTimeout(() => setIsSavedAppFeedback(false), 2200);

      try {
        window.dispatchEvent(new CustomEvent('mavi_ui_engine_app_saved', { detail: { appName: appPayload.name } }));
      } catch (e) {
        // ignore
      }

      setActiveToast({
        message: `Aplikasi "${appPayload.name}" berhasil disimpan!`,
        type: 'SUCCESS'
      });
    } catch (err) {
      console.error('Error saving app:', err);
      setActiveToast({
        message: `Gagal menyimpan aplikasi: ${err.message}`,
        type: 'ERROR'
      });
    } finally {
      setIsSavingApp(false);
    }
  }, [currentAppId, appName, screens, variables, tables, recordPlaceholders, authUser, loadGluestackApps]);

  // Copy Link App to clipboard
  const handleCopyAppLink = useCallback(async () => {
    const url = getCompanionUrl();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setActiveToast({
        message: `Link aplikasi "${appName}" berhasil disalin ke clipboard!`,
        type: 'SUCCESS'
      });
    } catch (err) {
      console.error('Failed to copy link:', err);
      setActiveToast({
        message: 'Gagal menyalin link aplikasi ke clipboard',
        type: 'ERROR'
      });
    }
  }, [getCompanionUrl, appName]);

  // Listen to external companion events (from top studio header)
  useEffect(() => {
    const onSave = () => handleSaveApp();
    const onLink = () => handleCopyAppLink();
    const onQr = () => setIsCompanionModalOpen(true);
    const onSetName = (e) => {
      if (e.detail?.appName) setAppName(e.detail.appName);
    };
    // Handle loading app from Supabase (when opened from App Management)
    const onLoadApp = (e) => {
      const { appId, name, config } = e.detail || {};
      if (appId) {
        setCurrentAppId(appId);
        setAppName(name || 'Untitled App');
        // Load config if available
        if (config) {
          if (config.components) setScreens(config.components);
          if (config.variables) setVariables(config.variables);
          if (config.tables) setTables(config.tables);
          if (config.recordPlaceholders) setRecordPlaceholders(config.recordPlaceholders);
        }
      }
    };

    window.addEventListener('mavi_ui_engine_save_app', onSave);
    window.addEventListener('mavi_ui_engine_copy_link', onLink);
    window.addEventListener('mavi_ui_engine_open_qr', onQr);
    window.addEventListener('mavi_ui_engine_set_app_name', onSetName);
    window.addEventListener('mavi_ui_engine_load_app', onLoadApp);

    return () => {
      window.removeEventListener('mavi_ui_engine_save_app', onSave);
      window.removeEventListener('mavi_ui_engine_copy_link', onLink);
      window.removeEventListener('mavi_ui_engine_open_qr', onQr);
      window.removeEventListener('mavi_ui_engine_set_app_name', onSetName);
      window.removeEventListener('mavi_ui_engine_load_app', onLoadApp);
    };
  }, [handleSaveApp, handleCopyAppLink]);

  // Helper to normalize any incoming widget type (Mavi or Gluestack) into supported Gluestack UI components
  const mapToGluestackWidgetType = (rawType = '') => {
    const t = String(rawType).toUpperCase().replace(/[\s-_]/g, '');
    if (t.includes('BUTTON')) return 'Button';
    if (t.includes('TEXTINPUT') || t === 'INPUT') return 'Input';
    if (t.includes('TEXTAREA')) return 'Textarea';
    if (t.includes('SELECT') || t.includes('DROPDOWN')) return 'Select';
    if (t.includes('CHECKBOX')) return 'Checkbox';
    if (t.includes('SWITCH') || t.includes('TOGGLE')) return 'Switch';
    if (t.includes('CARD') || t.includes('CONTAINER') || t.includes('METRIC')) return 'Card';
    if (t.includes('BADGE') || t.includes('TAG') || t.includes('CHIP')) return 'Badge';
    if (t.includes('TABLE') || t.includes('GRID')) return 'Table';
    if (t.includes('PROGRESS') || t.includes('GAUGE')) return 'Progress';
    if (t.includes('AVATAR') || t.includes('USER') || t.includes('PROFILE')) return 'Avatar';
    if (t.includes('ALERT') || t.includes('BANNER') || t.includes('NOTICE')) return 'Alert';
    if (t.includes('QR') || t.includes('BARCODE') || t.includes('SCANNER')) return 'QRCodeScanner';
    if (t.includes('CAMERA') || t.includes('PHOTO')) return 'Camera';
    if (t.includes('VIDEO')) return 'VideoPlayer';
    if (t.includes('TAB')) return 'Tabs';
    if (t.includes('DRAWER')) return 'Drawer';
    if (t.includes('MODAL') || t.includes('DIALOG')) return 'Modal';
    if (t.includes('ACCORDION') || t.includes('COLLAPSIBLE')) return 'Accordion';
    if (t.includes('SPINNER') || t.includes('LOADER')) return 'Spinner';
    if (t.includes('TIMER') || t.includes('CLOCK')) return 'Timer';
    if (t.includes('COUNTER') || t.includes('COUNT')) return 'Counter';
    if (t.includes('FAB')) return 'FAB';
    if (t.includes('FORM')) return 'Form';
    if (t.includes('TEXT') || t.includes('LABEL') || t.includes('HEADING')) return 'Text';

    const validTypes = [
      'Button', 'Dropdown', 'FAB', 'Input', 'Textarea', 'Select', 'Checkbox', 'Switch', 'Form',
      'QRCodeScanner', 'VideoPlayer', 'Camera', 'Card', 'Accordion', 'Badge', 'Avatar', 'Table',
      'Alert', 'Toast', 'Progress', 'Spinner', 'Tabs', 'Command', 'Navigation', 'BottomNavigation',
      'Modal', 'Drawer', 'Text', 'Timer', 'Counter'
    ];
    const match = validTypes.find(v => v.toLowerCase() === String(rawType).toLowerCase());
    return match || 'Button';
  };

  // Execute AI Copilot commands (matching Mavi AppBuilder workflow with synchronous batch execution)
  const handleAiCommand = useCallback(async (cmd) => {
    if (!cmd || !cmd.type) return;
    const p = cmd.payload || {};

    switch (cmd.type) {
      // 0. Snapshot management for Copilot Undo/Rollback
      case 'CREATE_SNAPSHOT': {
        setPreCopilotSnapshot({
          screens: JSON.parse(JSON.stringify(screensRef.current)),
          variables: JSON.parse(JSON.stringify(variablesRef.current)),
          tables: JSON.parse(JSON.stringify(tablesRef.current)),
          recordPlaceholders: JSON.parse(JSON.stringify(recordPlaceholdersRef.current)),
          appName: appName
        });
        break;
      }
      case 'RESTORE_SNAPSHOT': {
        if (preCopilotSnapshot) {
          screensRef.current = preCopilotSnapshot.screens || screensRef.current;
          tablesRef.current = preCopilotSnapshot.tables || tablesRef.current;
          variablesRef.current = preCopilotSnapshot.variables || variablesRef.current;
          recordPlaceholdersRef.current = preCopilotSnapshot.recordPlaceholders || recordPlaceholdersRef.current;
          setScreens(screensRef.current);
          setTables(tablesRef.current);
          setVariables(variablesRef.current);
          setRecordPlaceholders(recordPlaceholdersRef.current);
          if (preCopilotSnapshot.appName) setAppName(preCopilotSnapshot.appName);
          setPreCopilotSnapshot(null);
        }
        break;
      }

      // 1. Step / Screen Management (Must support batch creation & switching)
      case 'ADD_STEP':
      case 'CREATE_STEP': {
        const newScreenId = p.id || p.stepId || `screen_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
        const screenTitle = p.title || p.stepTitle || `Screen ${screensRef.current.length + 1}`;

        // Check if screen already exists (case-insensitive)
        const existingScr = screensRef.current.find(s => s.id === newScreenId || s.title.toLowerCase() === screenTitle.toLowerCase());
        if (existingScr) {
          currentScreenIdRef.current = existingScr.id;
          setCurrentScreenId(existingScr.id);
        } else {
          const initialComps = (p.components || []).map(c => {
            const wType = mapToGluestackWidgetType(c.type || 'Text');
            return {
              id: generateId(),
              displayName: c.displayName || c.name || wType,
              type: wType,
              props: { ...getDefaultProps(wType), ...(c.props || {}) },
              triggers: c.triggers || []
            };
          });
          const newScreen = {
            id: newScreenId,
            title: screenTitle,
            components: initialComps,
            triggers: p.triggers || []
          };
          const nextScreens = [...screensRef.current, newScreen];
          screensRef.current = nextScreens;
          currentScreenIdRef.current = newScreenId;
          setScreens(nextScreens);
          setCurrentScreenId(newScreenId);
          setExpandedScreens(prev => new Set([...prev, newScreenId]));
        }
        break;
      }
      case 'UPDATE_STEP': {
        const targetId = p.stepId || p.id;
        const targetTitle = p.stepTitle;
        const nextScreens = screensRef.current.map(s => {
          if (s.id === targetId || (targetTitle && s.title.toLowerCase() === String(targetTitle).toLowerCase())) {
            return {
              ...s,
              title: p.updates?.title || p.title || s.title
            };
          }
          return s;
        });
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        break;
      }
      case 'DELETE_STEP': {
        const targetId = p.stepId || p.id;
        const targetTitle = p.stepTitle;
        if (screensRef.current.length > 1) {
          const filtered = screensRef.current.filter(s => s.id !== targetId && (!targetTitle || s.title.toLowerCase() !== String(targetTitle).toLowerCase()));
          screensRef.current = filtered;
          setScreens(filtered);
          if (!filtered.find(s => s.id === currentScreenIdRef.current)) {
            currentScreenIdRef.current = filtered[0].id;
            setCurrentScreenId(filtered[0].id);
          }
        }
        break;
      }
      case 'GO_TO_STEP': {
        const targetKey = String(p.stepId || p.stepTitle || p.target || '').toLowerCase().trim();
        const targetScreen = screensRef.current.find(s =>
          s.id.toLowerCase() === targetKey ||
          s.title.toLowerCase() === targetKey ||
          s.title.toLowerCase().includes(targetKey)
        );
        if (targetScreen) {
          currentScreenIdRef.current = targetScreen.id;
          setCurrentScreenId(targetScreen.id);
        }
        break;
      }

      // 2. Widget Management
      case 'CREATE_WIDGET':
      case 'ADD_WIDGET': {
        const rawType = p.type || p.widgetType || 'Button';
        const widgetType = mapToGluestackWidgetType(rawType);
        const defaults = getDefaultProps(widgetType);

        // Normalize incoming props
        const incomingProps = { ...(p.props || {}) };
        const labelOrName = p.displayName || p.name || p.widgetName;
        if (labelOrName && !incomingProps.label && !incomingProps.text && !incomingProps.title) {
          if (['Button', 'Badge', 'Text'].includes(widgetType)) incomingProps.text = labelOrName;
          else if (['Card', 'Modal', 'Drawer', 'Alert', 'Table', 'VideoPlayer'].includes(widgetType)) incomingProps.title = labelOrName;
          else incomingProps.label = labelOrName;
        }
        if (widgetType === 'Button' && incomingProps.label && !incomingProps.text) {
          incomingProps.text = incomingProps.label;
        }
        if (widgetType === 'Card' && incomingProps.text && !incomingProps.content) {
          incomingProps.content = incomingProps.text;
        }
        if (widgetType === 'Table') {
          if (p.columns && !incomingProps.headers) {
            incomingProps.headers = p.columns.map(c => typeof c === 'string' ? c : (c.name || c.title));
          }
          if (p.rows && !incomingProps.rows) {
            incomingProps.rows = p.rows;
          }
        }

        const newComp = {
          id: p.id || generateId(),
          displayName: labelOrName || widgetType,
          type: widgetType,
          props: { ...defaults, ...incomingProps },
          triggers: p.triggers || [],
          dataSource: p.dataSource || { type: 'none', tableId: '', column: '', recordPlaceholderId: '' }
        };
        newComp.props.triggers = newComp.triggers;

        // Resolve target screen ID (checks stepTitle, stepId, or falls back to currentScreenIdRef.current)
        let targetScreenId = currentScreenIdRef.current;
        if (p.stepId) {
          const match = screensRef.current.find(s => s.id === p.stepId);
          if (match) targetScreenId = match.id;
        } else if (p.stepTitle || p.screenTitle) {
          const titleTarget = String(p.stepTitle || p.screenTitle).toLowerCase().trim();
          const match = screensRef.current.find(s => s.title.toLowerCase() === titleTarget || s.title.toLowerCase().includes(titleTarget));
          if (match) targetScreenId = match.id;
        }

        const nextScreens = screensRef.current.map(s => {
          if (s.id === targetScreenId) {
            return { ...s, components: [...(s.components || []), newComp] };
          }
          return s;
        });
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        selectedIdRef.current = newComp.id;
        setSelectedId(newComp.id);
        break;
      }
      case 'UPDATE_WIDGET': {
        const targetId = p.id || p.widgetId;
        const targetName = String(p.widgetName || p.displayName || '').toLowerCase().trim();
        const nextScreens = screensRef.current.map(s => ({
          ...s,
          components: (s.components || []).map(c => {
            const isTarget = (targetId && c.id === targetId) ||
              (!targetId && targetName && (
                String(c.displayName || '').toLowerCase() === targetName ||
                String(c.props?.label || '').toLowerCase() === targetName ||
                String(c.props?.text || '').toLowerCase() === targetName ||
                String(c.props?.title || '').toLowerCase() === targetName
              )) ||
              (!targetId && !targetName && c.id === selectedIdRef.current);
            if (isTarget) {
              const incomingProps = { ...(p.props || {}), ...(p.updates || {}) };
              return {
                ...c,
                props: { ...c.props, ...incomingProps },
                triggers: p.triggers ? p.triggers : c.triggers
              };
            }
            return c;
          })
        }));
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        break;
      }
      case 'DELETE_WIDGET': {
        const targetId = p.id || p.widgetId;
        const targetName = String(p.widgetName || p.displayName || '').toLowerCase().trim();
        const nextScreens = screensRef.current.map(s => ({
          ...s,
          components: (s.components || []).filter(c => {
            const isTarget = (targetId && c.id === targetId) ||
              (!targetId && targetName && (
                String(c.displayName || '').toLowerCase() === targetName ||
                String(c.props?.label || '').toLowerCase() === targetName ||
                String(c.props?.text || '').toLowerCase() === targetName ||
                String(c.props?.title || '').toLowerCase() === targetName
              )) ||
              (!targetId && !targetName && c.id === selectedIdRef.current);
            return !isTarget;
          })
        }));
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        break;
      }

      // 3. Trigger Management
      case 'CREATE_TRIGGER': {
        const targetIdRaw = p.widgetId || p.componentId || p.target || p.widgetName || selectedIdRef.current;
        const rawTargetLower = String(targetIdRaw || '').toLowerCase().trim();

        let resolvedEvent = p.event || 'ON_CLICK';
        if (typeof resolvedEvent === 'object') {
          resolvedEvent = resolvedEvent.type || resolvedEvent.name || 'ON_CLICK';
        }
        const eventStr = String(resolvedEvent).toUpperCase().trim();
        const normalizedEvent = (eventStr.includes('CLICK') || eventStr.includes('SUBMIT') || eventStr.includes('TAP')) ? 'ON_CLICK'
          : (eventStr.includes('CHANGE') ? 'ON_CHANGE'
          : (eventStr.includes('SCAN') ? 'ON_SCAN' : eventStr));

        let clauses = p.clauses;
        if (!clauses && p.actions) {
          clauses = [{
            id: `clause_${Date.now()}`,
            match: p.match || 'ALL',
            conditions: p.conditions || [],
            actions: p.actions || []
          }];
        } else if (!clauses) {
          clauses = [{ id: `clause_${Date.now()}`, match: 'ALL', conditions: [], actions: [] }];
        }

        const newTrigger = {
          id: p.id || `trig_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: p.name || `${normalizedEvent} Trigger`,
          event: normalizedEvent,
          enabled: true,
          stopOnError: false,
          clauses,
          elseActions: p.elseActions || []
        };

        // Match target widget across screensRef.current
        let foundScreenId = null;
        let foundCompId = null;

        const matchWidget = (c) => {
          if (!targetIdRaw) return false;
          if (c.id === targetIdRaw) return true;
          if (c.displayName && c.displayName.toLowerCase().trim() === rawTargetLower) return true;
          if (c.props?.label && c.props.label.toLowerCase().trim() === rawTargetLower) return true;
          if (c.props?.text && c.props.text.toLowerCase().trim() === rawTargetLower) return true;
          if (c.props?.title && c.props.title.toLowerCase().trim() === rawTargetLower) return true;
          if (c.displayName && (c.displayName.toLowerCase().includes(rawTargetLower) || rawTargetLower.includes(c.displayName.toLowerCase()))) return true;
          if (c.props?.text && (c.props.text.toLowerCase().includes(rawTargetLower) || rawTargetLower.includes(c.props.text.toLowerCase()))) return true;
          return false;
        };

        // 1. Current screen search
        const currScr = screensRef.current.find(s => s.id === currentScreenIdRef.current);
        if (currScr) {
          const matched = (currScr.components || []).find(matchWidget);
          if (matched) {
            foundScreenId = currScr.id;
            foundCompId = matched.id;
          }
        }

        // 2. All screens search
        if (!foundCompId) {
          for (const scr of screensRef.current) {
            const matched = (scr.components || []).find(matchWidget);
            if (matched) {
              foundScreenId = scr.id;
              foundCompId = matched.id;
              break;
            }
          }
        }

        // 3. Fallback: If event is ON_CLICK and target refers to a button/action, attach to the last button
        if (!foundCompId && (normalizedEvent === 'ON_CLICK' || rawTargetLower.includes('btn') || rawTargetLower.includes('submit') || rawTargetLower.includes('simpan') || rawTargetLower.includes('button'))) {
          const targetScr = currScr || screensRef.current[0];
          if (targetScr) {
            const lastBtn = (targetScr.components || []).slice().reverse().find(c => c.type === 'Button' || c.type === 'FAB');
            if (lastBtn) {
              foundScreenId = targetScr.id;
              foundCompId = lastBtn.id;
            }
          }
        }

        // 4. Fallback to currently selected widget
        if (!foundCompId && selectedIdRef.current) {
          for (const scr of screensRef.current) {
            const matched = (scr.components || []).find(c => c.id === selectedIdRef.current);
            if (matched) {
              foundScreenId = scr.id;
              foundCompId = matched.id;
              break;
            }
          }
        }

        if (foundCompId && foundScreenId) {
          const nextScreens = screensRef.current.map(s => {
            if (s.id === foundScreenId) {
              return {
                ...s,
                components: s.components.map(c => {
                  if (c.id === foundCompId) {
                    const updatedTriggers = [...(c.triggers || []), newTrigger];
                    return {
                      ...c,
                      triggers: updatedTriggers,
                      props: { ...c.props, triggers: updatedTriggers }
                    };
                  }
                  return c;
                })
              };
            }
            return s;
          });
          screensRef.current = nextScreens;
          setScreens(nextScreens);
        } else {
          // Screen-level trigger
          const nextScreens = screensRef.current.map(s => {
            if (s.id === currentScreenIdRef.current) {
              return { ...s, triggers: [...(s.triggers || []), newTrigger] };
            }
            return s;
          });
          screensRef.current = nextScreens;
          setScreens(nextScreens);
        }
        break;
      }
      case 'UPDATE_TRIGGER': {
        const trigId = p.triggerId || p.id;
        const trigName = String(p.triggerName || p.name || '').toLowerCase().trim();
        const updates = p.updates || {};
        const updateTrigList = (list = []) => list.map(t => {
          if ((trigId && t.id === trigId) || (trigName && t.name.toLowerCase().trim() === trigName)) {
            return { ...t, ...updates };
          }
          return t;
        });
        const nextScreens = screensRef.current.map(s => ({
          ...s,
          components: (s.components || []).map(c => {
            const updated = updateTrigList(c.triggers || []);
            return { ...c, triggers: updated, props: { ...c.props, triggers: updated } };
          })
        }));
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        break;
      }
      case 'DELETE_TRIGGER': {
        const trigId = p.triggerId || p.id;
        const trigName = String(p.triggerName || p.name || '').toLowerCase().trim();
        const filterTrigList = (list = []) => list.filter(t => (trigId ? t.id !== trigId : t.name.toLowerCase().trim() !== trigName));
        const nextScreens = screensRef.current.map(s => ({
          ...s,
          components: (s.components || []).map(c => {
            const filtered = filterTrigList(c.triggers || []);
            return { ...c, triggers: filtered, props: { ...c.props, triggers: filtered } };
          })
        }));
        screensRef.current = nextScreens;
        setScreens(nextScreens);
        break;
      }

      // 4. Tables Management
      case 'CREATE_TABLE': {
        const tableName = p.name || p.tableName || `Table_${Date.now()}`;
        const rawCols = p.columns || [{ name: 'id' }, { name: 'created_at' }];
        const formattedCols = rawCols.map(col => typeof col === 'string' ? { name: col } : { name: col.name || col.title || 'col', type: col.type || 'text' });

        const existingIdx = tablesRef.current.findIndex(t => t.name.toLowerCase() === tableName.toLowerCase());
        let newTableObj;
        if (existingIdx !== -1) {
          newTableObj = { ...tablesRef.current[existingIdx], columns: formattedCols };
          const next = [...tablesRef.current];
          next[existingIdx] = newTableObj;
          tablesRef.current = next;
          setTables(next);
        } else {
          newTableObj = {
            id: p.id || `table_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: tableName,
            columns: formattedCols
          };
          const next = [...tablesRef.current, newTableObj];
          tablesRef.current = next;
          setTables(next);
        }

        // Auto-create connected Record Placeholder for easy form binding
        const hasRp = recordPlaceholdersRef.current.some(rp => rp.tableId === newTableObj.id || rp.name.toLowerCase().includes(tableName.toLowerCase()));
        if (!hasRp) {
          const autoRp = {
            id: `rp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            name: `Active_${tableName}`,
            tableId: newTableObj.id,
            field: formattedCols[0]?.name || 'id'
          };
          const nextRp = [...recordPlaceholdersRef.current, autoRp];
          recordPlaceholdersRef.current = nextRp;
          setRecordPlaceholders(nextRp);
        }
        break;
      }
      case 'UPDATE_TABLE': {
        const tableName = String(p.tableName || p.name || '').toLowerCase().trim();
        const next = tablesRef.current.map(t => t.name.toLowerCase().trim() === tableName ? { ...t, ...(p.updates || {}) } : t);
        tablesRef.current = next;
        setTables(next);
        break;
      }
      case 'DELETE_TABLE': {
        const tableName = String(p.tableName || p.name || '').toLowerCase().trim();
        const next = tablesRef.current.filter(t => t.name.toLowerCase().trim() !== tableName);
        tablesRef.current = next;
        setTables(next);
        break;
      }

      // 5. Record Placeholders
      case 'CREATE_RECORD_PLACEHOLDER': {
        const phName = p.name || 'New Placeholder';
        const targetTableId = p.tableId || (tablesRef.current[0]?.id || 'table_1');
        const newRp = {
          id: p.id || `rp_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: phName,
          tableId: targetTableId,
          field: p.field || ''
        };
        const next = [...recordPlaceholdersRef.current, newRp];
        recordPlaceholdersRef.current = next;
        setRecordPlaceholders(next);
        break;
      }
      case 'UPDATE_RECORD_PLACEHOLDER': {
        const phId = p.placeholderId || p.id;
        const next = recordPlaceholdersRef.current.map(rp => rp.id === phId ? { ...rp, ...(p.updates || {}) } : rp);
        recordPlaceholdersRef.current = next;
        setRecordPlaceholders(next);
        break;
      }
      case 'DELETE_RECORD_PLACEHOLDER': {
        const phId = p.placeholderId || p.id;
        const next = recordPlaceholdersRef.current.filter(rp => rp.id !== phId);
        recordPlaceholdersRef.current = next;
        setRecordPlaceholders(next);
        break;
      }

      // 6. Variables Management
      case 'CREATE_VARIABLE': {
        const newVarObj = {
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          name: p.name || 'NEW_VARIABLE',
          type: p.type || 'string',
          value: p.defaultValue !== undefined ? p.defaultValue : (p.value || ''),
          persisted: !!p.persisted
        };
        const next = [...variablesRef.current, newVarObj];
        variablesRef.current = next;
        setVariables(next);
        break;
      }
      case 'UPDATE_VARIABLE': {
        const varName = String(p.variableName || p.name || '').toLowerCase().trim();
        const next = variablesRef.current.map(v => v.name.toLowerCase().trim() === varName ? { ...v, ...(p.updates || {}) } : v);
        variablesRef.current = next;
        setVariables(next);
        break;
      }
      case 'DELETE_VARIABLE': {
        const varName = String(p.variableName || p.name || '').toLowerCase().trim();
        const next = variablesRef.current.filter(v => v.name.toLowerCase().trim() !== varName);
        variablesRef.current = next;
        setVariables(next);
        break;
      }

      // 7. App Metadata
      case 'SET_APP_NAME': {
        const newName = typeof p === 'string' ? p : (p.name || p.appName);
        if (newName) {
          setAppName(newName);
          try {
            window.dispatchEvent(new CustomEvent('mavi_ui_engine_app_name_changed', { detail: { appName: newName } }));
          } catch (e) {}
        }
        break;
      }
      default:
        console.log('[Gluestack Copilot Command]', cmd);
    }
  }, [updateComponents, removeComponent, appName, preCopilotSnapshot]);

  // Open modal to create a new trigger
  const openAddTrigger = (sourceType = 'WIDGET', sourceId = null) => {
    const isWidget = sourceType === 'WIDGET';
    const target = isWidget
      ? screenComponents.find(c => c.id === (sourceId || selectedId))
      : currentScreen;

    const defaultEvent = isWidget
      ? (['Button', 'FAB', 'Card', 'Badge'].includes(target?.type) ? 'ON_CLICK' :
         target?.type === 'QRCodeScanner' ? 'ON_SCAN' :
         target?.type === 'Camera' ? 'ON_CAPTURE' : 'ON_CHANGE')
      : 'ON_SCREEN_LOAD';

    setTriggerEditor({
      isOpen: true,
      sourceType,
      sourceId: sourceId || (isWidget ? selectedId : currentScreenId),
      trigger: {
        id: `trig_${Date.now()}`,
        name: 'New Trigger',
        event: defaultEvent,
        enabled: true,
        stopOnError: false,
        clauses: [
          {
            id: `clause_${Date.now()}`,
            match: 'ALL',
            conditions: [],
            actions: [
              {
                id: `act_${Date.now()}`,
                type: 'SET_VARIABLE',
                payload: { varPath: '', valueType: 'STATIC', value: '' }
              }
            ]
          }
        ],
        elseActions: []
      },
      editIndex: -1
    });
  };

  // Open modal to edit existing trigger
  const openEditTrigger = (trigger, index, sourceType = 'WIDGET', sourceId = null) => {
    setTriggerEditor({
      isOpen: true,
      sourceType,
      sourceId: sourceId || (sourceType === 'WIDGET' ? selectedId : currentScreenId),
      trigger: JSON.parse(JSON.stringify(trigger)),
      editIndex: index
    });
  };

  // Save trigger (create new or update existing)
  const handleSaveTrigger = (savedTrigger) => {
    if (triggerEditor.sourceType === 'WIDGET') {
      const compId = triggerEditor.sourceId || selectedId;
      const comp = screenComponents.find(c => c.id === compId);
      if (!comp) return;
      const currentTriggers = [...(comp.triggers || [])];
      if (triggerEditor.editIndex >= 0 && triggerEditor.editIndex < currentTriggers.length) {
        currentTriggers[triggerEditor.editIndex] = savedTrigger;
      } else {
        currentTriggers.push(savedTrigger);
      }
      const next = screenComponents.map(c => c.id === compId ? { ...c, triggers: currentTriggers } : c);
      updateComponents(next);
      setActiveToast({
        message: `Trigger "${savedTrigger.name}" saved to widget`,
        type: 'SUCCESS'
      });
    } else {
      const scrId = triggerEditor.sourceId || currentScreenId;
      setScreens(prev => prev.map(s => {
        if (s.id !== scrId) return s;
        const currentTriggers = [...(s.triggers || [])];
        if (triggerEditor.editIndex >= 0 && triggerEditor.editIndex < currentTriggers.length) {
          currentTriggers[triggerEditor.editIndex] = savedTrigger;
        } else {
          currentTriggers.push(savedTrigger);
        }
        return { ...s, triggers: currentTriggers };
      }));
      setActiveToast({
        message: `Trigger "${savedTrigger.name}" saved to screen`,
        type: 'SUCCESS'
      });
    }
    setTriggerEditor(prev => ({ ...prev, isOpen: false }));
  };

  // Delete trigger
  const handleDeleteTrigger = (triggerId) => {
    if (triggerEditor.sourceType === 'WIDGET') {
      const compId = triggerEditor.sourceId || selectedId;
      const next = screenComponents.map(c =>
        c.id === compId ? { ...c, triggers: (c.triggers || []).filter(t => t.id !== triggerId) } : c
      );
      updateComponents(next);
      setActiveToast({
        message: 'Trigger deleted',
        type: 'INFO'
      });
    } else {
      const scrId = triggerEditor.sourceId || currentScreenId;
      setScreens(prev => prev.map(s =>
        s.id === scrId ? { ...s, triggers: (s.triggers || []).filter(t => t.id !== triggerId) } : s
      ));
      setActiveToast({
        message: 'Screen trigger deleted',
        type: 'INFO'
      });
    }
    setTriggerEditor(prev => ({ ...prev, isOpen: false }));
  };

  // Run/execute trigger logic
  const runTrigger = useCallback((trig, runtimeEvent = 'ON_CLICK') => {
    if (!trig || trig.enabled === false) return;
    if (trig.event && trig.event !== runtimeEvent) return;

    const evalCondition = (cond) => {
      let leftVal = '';
      if (cond.leftSource === 'VARIABLE') {
        const found = variables.find(v => v.name === cond.leftValue || v.id === cond.leftValue);
        leftVal = found ? found.value : '';
      } else {
        leftVal = cond.leftValue;
      }

      let rightVal = '';
      if (cond.rightSource === 'VARIABLE') {
        const found = variables.find(v => v.name === cond.rightValue || v.id === cond.rightValue);
        rightVal = found ? found.value : '';
      } else {
        rightVal = cond.rightValue;
      }

      const op = cond.operator || '==';
      const lStr = String(leftVal ?? '').toLowerCase();
      const rStr = String(rightVal ?? '').toLowerCase();
      const lNum = Number(leftVal);
      const rNum = Number(rightVal);

      switch (op) {
        case '==': return lStr === rStr;
        case '!=': return lStr !== rStr;
        case '>': return !isNaN(lNum) && !isNaN(rNum) && lNum > rNum;
        case '<': return !isNaN(lNum) && !isNaN(rNum) && lNum < rNum;
        case '>=': return !isNaN(lNum) && !isNaN(rNum) && lNum >= rNum;
        case '<=': return !isNaN(lNum) && !isNaN(rNum) && lNum <= rNum;
        case 'contains': return lStr.includes(rStr);
        case 'is_empty': return !leftVal || leftVal === '';
        case 'is_not_empty': return !!leftVal && leftVal !== '';
        default: return true;
      }
    };

    const runAction = (act) => {
      if (!act) return;
      const type = act.type;
      const payload = act.payload || {};

      if (type === 'SET_VARIABLE') {
        const varPath = payload.varPath;
        const val = payload.valueType === 'VARIABLE' 
          ? (variables.find(v => v.name === payload.value || v.id === payload.value)?.value ?? '')
          : payload.value;
        if (varPath) {
          setVariables(prev => prev.map(v => 
            (v.name === varPath || v.id === varPath) ? { ...v, value: val } : v
          ));
          setActiveToast({
            message: `Variable '${varPath}' set to '${val}'`,
            type: 'SUCCESS'
          });
        }
      } else if (type === 'GOTO_SCREEN' || type === 'NAVIGATE') {
        const targetScreenId = payload.screenId || payload.targetScreenId;
        if (targetScreenId) {
          const target = screens.find(s => s.id === targetScreenId);
          if (target) {
            setCurrentScreenId(target.id);
            setActiveToast({
              message: `Navigated to screen '${target.title}'`,
              type: 'INFO'
            });
          }
        }
      } else if (type === 'SHOW_MESSAGE' || type === 'SHOW_TOAST') {
        setActiveToast({
          message: payload.message || 'Action executed successfully!',
          type: payload.messageType || 'SUCCESS'
        });
      } else if (type === 'CLEAR_VARIABLE') {
        const varPath = payload.varPath;
        if (varPath) {
          setVariables(prev => prev.map(v => 
            (v.name === varPath || v.id === varPath) ? { ...v, value: '' } : v
          ));
        }
      } else {
        setActiveToast({
          message: `Action '${type}' triggered successfully`,
          type: 'SUCCESS'
        });
      }
    };

    try {
      const clauses = trig.clauses || [];
      let anyClauseMatched = false;

      for (const clause of clauses) {
        const conds = clause.conditions || [];
        let isMatch = true;
        if (conds.length > 0) {
          if (clause.match === 'ANY') {
            isMatch = conds.some(evalCondition);
          } else {
            isMatch = conds.every(evalCondition);
          }
        }
        if (isMatch) {
          anyClauseMatched = true;
          for (const act of (clause.actions || [])) {
            runAction(act);
          }
          break;
        }
      }

      if (!anyClauseMatched && (trig.elseActions || []).length > 0) {
        for (const act of trig.elseActions) {
          runAction(act);
        }
      }
    } catch (err) {
      console.error('Trigger error:', err);
      if (trig.stopOnError) {
        setActiveToast({
          message: `Trigger stopped on error: ${err.message}`,
          type: 'ERROR'
        });
      }
    }
  }, [variables, screens]);

  const executeComponentTriggers = useCallback((comp, eventType = 'ON_CLICK') => {
    if (!comp) return;

    // Built-in Button Action Navigation (NEXT_SCREEN, PREV_SCREEN, GO_TO_SCREEN, COMPLETE_APP)
    if (eventType === 'ON_CLICK' && comp.props?.action) {
      if (comp.props.action === 'NEXT_SCREEN') {
        const curIdx = screens.findIndex(s => s.id === currentScreenId);
        if (curIdx >= 0 && curIdx < screens.length - 1) {
          setCurrentScreenId(screens[curIdx + 1].id);
          setActiveToast({ message: `Beralih ke layar: ${screens[curIdx + 1].title}`, type: 'INFO' });
        } else {
          setActiveToast({ message: `Layar terakhir (Hanya 1 layar tersedia: "${screens[curIdx]?.title || 'Home'}"). Tambahkan Screen 2 untuk multi-layar.`, type: 'INFO' });
        }
      } else if (comp.props.action === 'PREV_SCREEN') {
        const curIdx = screens.findIndex(s => s.id === currentScreenId);
        if (curIdx > 0) {
          setCurrentScreenId(screens[curIdx - 1].id);
          setActiveToast({ message: `Kembali ke layar: ${screens[curIdx - 1].title}`, type: 'INFO' });
        } else {
          setActiveToast({ message: 'Ini adalah layar pertama', type: 'INFO' });
        }
      } else if (comp.props.action === 'GO_TO_SCREEN' && comp.props.targetScreenId) {
        const targetScr = screens.find(s => s.id === comp.props.targetScreenId);
        setCurrentScreenId(comp.props.targetScreenId);
        if (targetScr) {
          setActiveToast({ message: `Beralih ke layar: ${targetScr.title}`, type: 'INFO' });
        }
      } else if (comp.props.action === 'COMPLETE_APP') {
        setActiveToast({
          message: 'Work Order / Aplikasi Berhasil Diselesaikan!',
          type: 'SUCCESS'
        });
      }
    } else if (eventType === 'ON_CLICK' && comp.type === 'Button' && (!comp.triggers || comp.triggers.length === 0)) {
      setActiveToast({
        message: `Tombol "${comp.props.text || comp.props.label || 'Action'}" aktif (Klik berhasil)`,
        type: 'SUCCESS'
      });
    }

    if (!comp.triggers || comp.triggers.length === 0) return;
    comp.triggers.forEach(trig => {
      runTrigger(trig, eventType);
    });
  }, [screens, currentScreenId, runTrigger]);

  // Screens Operations
  const addScreen = (screenType = 'Screen') => {
    const newScr = {
      id: `screen_${Date.now()}`,
      title: `${screenType} ${screens.length + 1}`,
      components: [],
      triggers: []
    };
    setScreens(prev => [...prev, newScr]);
    setCurrentScreenId(newScr.id);
    setSelectedId(null);
    setExpandedScreens(prev => new Set([...prev, newScr.id]));
    setActiveDropdown(null);
  };

  const deleteScreen = (scrId) => {
    if (screens.length <= 1) return;
    const filtered = screens.filter(s => s.id !== scrId);
    setScreens(filtered);
    if (currentScreenId === scrId) {
      setCurrentScreenId(filtered[0].id);
    }
  };

  const duplicateScreen = (scrId) => {
    const scr = screens.find(s => s.id === scrId);
    if (!scr) return;
    const duplicated = {
      id: `screen_${Date.now()}`,
      title: `${scr.title} (Copy)`,
      components: scr.components.map(c => ({ ...c, id: generateId() })),
      triggers: [...(scr.triggers || [])]
    };
    setScreens(prev => [...prev, duplicated]);
    setCurrentScreenId(duplicated.id);
  };

  // Move screen up / down
  const moveScreen = (scrId, direction) => {
    const idx = screens.findIndex(s => s.id === scrId);
    if (idx === -1) return;
    if (direction === 'up' && idx > 0) {
      const next = [...screens];
      const temp = next[idx];
      next[idx] = next[idx - 1];
      next[idx - 1] = temp;
      setScreens(next);
    } else if (direction === 'down' && idx < screens.length - 1) {
      const next = [...screens];
      const temp = next[idx];
      next[idx] = next[idx + 1];
      next[idx + 1] = temp;
      setScreens(next);
    }
  };

  // Reorder screens via drag & drop
  const reorderScreens = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex === null || toIndex === null) return;
    setScreens(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  // Add Table
  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    const newT = {
      id: `table_${Date.now()}`,
      name: newTableName.trim(),
      columns: [{ name: 'id' }, { name: 'createdAt' }, { name: 'status' }]
    };
    setTables(prev => [...prev, newT]);
    setNewTableName('');
    setShowAddTableModal(false);
  };

  // Add Record Placeholder
  const handleCreateRp = () => {
    if (!newRpName.trim()) return;
    const newRp = {
      id: `rp_${Date.now()}`,
      name: newRpName.trim(),
      tableId: newRpTableId,
      field: 'id'
    };
    setRecordPlaceholders(prev => [...prev, newRp]);
    setNewRpName('');
    setShowAddRpModal(false);
  };

  // Export App JSON
  const exportAsJSON = () => {
    const data = {
      name: appName,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      screens,
      tables,
      recordPlaceholders,
      variables
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Device Width Classes mapping - Responsive height to ensure full device visibility at 100% zoom
  const deviceWidthClasses = {
    iphone: 'w-[360px] max-w-full h-[calc(100vh-210px)] max-h-[660px] min-h-[460px]',
    android: 'w-[760px] max-w-full h-[calc(100vh-210px)] max-h-[440px] min-h-[380px]',
    tablet: 'w-[680px] max-w-full h-[calc(100vh-210px)] max-h-[700px] min-h-[500px]',
    responsive: 'w-full max-w-5xl h-[calc(100vh-210px)] min-h-[500px]'
  };
  const activeDeviceClass = deviceWidthClasses[currentDeviceFrame] || deviceWidthClasses.iphone;

  // Render Component on Canvas Preview for 24 Gluestack UI components
  const renderPreview = (comp) => {
    switch (comp.type) {
      // ACTIONS
      case 'Button':
        return (
          <button
            type="button"
            onClick={(e) => {
              if (isPreview) {
                e.stopPropagation();
                executeComponentTriggers(comp, 'ON_CLICK');
              }
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98 ${
              comp.props.variant === 'primary' ? 'bg-[#008784] text-white hover:bg-[#007471]' :
              comp.props.variant === 'secondary' ? 'bg-slate-800 text-white' :
              comp.props.variant === 'positive' ? 'bg-emerald-600 text-white' :
              comp.props.variant === 'danger' ? 'bg-rose-600 text-white' :
              'border border-slate-300 text-slate-700 bg-white'
            } ${isPreview ? 'cursor-pointer' : ''}`}
          >
            <span>{comp.props.text || comp.props.label || 'Action Button'}</span>
          </button>
        );
      case 'Dropdown': {
        const isDropOpen = !!previewDropdownState[comp.id];
        const dropItems = comp.props.items || comp.props.options || ['Export PDF', 'Cetak Label Barcode', 'Kirim Notifikasi QC'];
        const selectedOpt = previewFormValues[comp.id] || comp.props.label || 'Opsi Tindakan...';
        return (
          <div className="relative w-full" onClick={(e) => isPreview && e.stopPropagation()}>
            <button
              type="button"
              onClick={() => {
                if (isPreview) {
                  setPreviewDropdownState(prev => ({ ...prev, [comp.id]: !isDropOpen }));
                }
              }}
              className={`w-full p-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs transition-all ${
                isPreview ? 'cursor-pointer hover:border-teal-500 hover:bg-slate-50 active:scale-99' : ''
              }`}
            >
              <span className="font-semibold text-slate-800 truncate">{selectedOpt}</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${isDropOpen ? 'rotate-180 text-teal-600' : ''}`} />
            </button>
            {isPreview && isDropOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-40 py-1 divide-y divide-slate-100 animate-in fade-in-50 zoom-in-95 duration-150">
                {dropItems.map((it, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setPreviewFormValues(prev => ({ ...prev, [comp.id]: it }));
                      setPreviewDropdownState(prev => ({ ...prev, [comp.id]: false }));
                      setActiveToast({ message: `Dipilih: "${it}"`, type: 'SUCCESS' });
                      executeComponentTriggers(comp, 'ON_CHANGE');
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-800 font-medium transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{it}</span>
                    {selectedOpt === it && <Check className="w-3.5 h-3.5 text-teal-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      }
      case 'FAB':
        return (
          <div className="flex justify-end p-1">
            <div
              onClick={(e) => {
                if (isPreview) {
                  e.stopPropagation();
                  executeComponentTriggers(comp, 'ON_CLICK');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#008784] text-white text-xs font-bold shadow-md cursor-pointer hover:bg-[#007471] active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{comp.props.label || 'Scan QR'}</span>
            </div>
          </div>
        );

      // FORMS
      case 'Input':
        return (
          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-600 block">{comp.props.label || 'Input Field'}</label>
            {isPreview ? (
              <input
                type={comp.props.isPassword ? 'password' : 'text'}
                value={previewFormValues[comp.id] !== undefined ? previewFormValues[comp.id] : (comp.props.defaultValue || '')}
                onChange={(e) => setPreviewFormValues(prev => ({ ...prev, [comp.id]: e.target.value }))}
                placeholder={comp.props.placeholder || 'Enter text...'}
                className="w-full p-2 border border-teal-500/80 rounded-lg bg-white text-xs text-slate-800 shadow-2xs outline-none ring-2 ring-teal-500/20"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-500 shadow-2xs">
                {comp.props.placeholder || 'Enter text...'}
              </div>
            )}
          </div>
        );
      case 'Textarea':
        return (
          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-600 block">{comp.props.label || 'Keterangan Detail'}</label>
            {isPreview ? (
              <textarea
                rows={comp.props.rows || 3}
                value={previewFormValues[comp.id] !== undefined ? previewFormValues[comp.id] : (comp.props.defaultValue || '')}
                onChange={(e) => setPreviewFormValues(prev => ({ ...prev, [comp.id]: e.target.value }))}
                placeholder={comp.props.placeholder || 'Tulis catatan inspeksi...'}
                className="w-full p-2 border border-teal-500/80 rounded-lg bg-white text-xs text-slate-800 shadow-2xs outline-none ring-2 ring-teal-500/20 resize-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <div className="p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-400 min-h-[60px] shadow-2xs">
                {comp.props.placeholder || 'Tulis catatan inspeksi...'}
              </div>
            )}
          </div>
        );
      case 'Select':
        return (
          <div className="space-y-1 w-full">
            <label className="text-xs font-semibold text-slate-600 block">{comp.props.label || 'Pilih Opsi'}</label>
            {isPreview ? (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <select
                  value={previewFormValues[comp.id] !== undefined ? previewFormValues[comp.id] : (comp.props.options?.[0] || '')}
                  onChange={(e) => setPreviewFormValues(prev => ({ ...prev, [comp.id]: e.target.value }))}
                  className="w-full p-2 border border-teal-500/80 rounded-lg bg-white text-xs text-slate-800 shadow-2xs outline-none appearance-none pr-7 cursor-pointer"
                >
                  {(comp.props.options || ['Shift 1 (Pagi)', 'Shift 2 (Siang)', 'Shift 3 (Malam)']).map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            ) : (
              <div className="p-2 border border-slate-300 rounded-lg bg-white text-xs text-slate-700 flex items-center justify-between shadow-2xs">
                <span>{comp.props.options?.[0] || 'Shift 1 (Pagi)'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            )}
          </div>
        );
      case 'Checkbox': {
        const isChecked = previewFormValues[comp.id] !== undefined ? !!previewFormValues[comp.id] : !!comp.props.checked;
        return (
          <div
            onClick={(e) => {
              if (isPreview) {
                e.stopPropagation();
                setPreviewFormValues(prev => ({ ...prev, [comp.id]: !isChecked }));
              }
            }}
            className={`flex items-center gap-2.5 p-1 ${isPreview ? 'cursor-pointer hover:bg-slate-50 rounded-lg' : ''}`}
          >
            <input
              type="checkbox"
              checked={isChecked}
              readOnly
              className={`w-4 h-4 rounded text-[#008784] border-slate-300 ${!isPreview ? 'pointer-events-none' : 'cursor-pointer'}`}
            />
            <span className="text-xs font-medium text-slate-700">{comp.props.label || 'Pemeriksaan Visual - OK'}</span>
          </div>
        );
      }
      case 'Switch': {
        const isSwitched = previewFormValues[comp.id] !== undefined ? !!previewFormValues[comp.id] : (comp.props.value !== undefined ? !!comp.props.value : true);
        return (
          <div
            onClick={(e) => {
              if (isPreview) {
                e.stopPropagation();
                setPreviewFormValues(prev => ({ ...prev, [comp.id]: !isSwitched }));
              }
            }}
            className={`flex items-center justify-between p-1 ${isPreview ? 'cursor-pointer hover:bg-slate-50 rounded-lg' : ''}`}
          >
            <span className="text-xs font-medium text-slate-700">{comp.props.label || 'Status Aktif'}</span>
            <div className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${isSwitched ? 'bg-[#008784]' : 'bg-slate-300'}`}>
              <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-transform ${isSwitched ? 'left-4' : 'left-0.5'}`} />
            </div>
          </div>
        );
      }
      case 'Form':
        return (
          <div className="p-3 bg-white rounded-xl border border-dashed border-slate-300 shadow-2xs space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <FileText className="w-3.5 h-3.5 text-[#008784]" />
              <span>{comp.props.title || 'Formulir Inspeksi'}</span>
            </div>
            <p className="text-[10px] text-slate-500">{comp.props.description || 'Kontainer validasi form'}</p>
          </div>
        );

      // MEDIA & DEVICES
      case 'QRCodeScanner':
        return (
          <div className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <div className="font-bold text-slate-200 text-[11px] truncate">{comp.props.label || 'Pindai QR Code'}</div>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">READY</span>
            </div>
            <div className="relative aspect-4/3 bg-slate-900/90 flex flex-col items-center justify-center p-3">
              <div className="w-28 h-28 border-2 border-teal-400/50 rounded-xl relative flex items-center justify-center shadow-[0_0_15px_rgba(45,212,191,0.2)]">
                <div className="w-full h-0.5 bg-teal-400 absolute top-1/2 -translate-y-1/2 shadow-[0_0_8px_rgba(45,212,191,0.9)] animate-pulse" />
                <QrCode className="w-12 h-12 text-teal-400/30" />
              </div>
              <span className="text-[10px] text-slate-400 mt-2 font-medium">{comp.props.subtitle || 'Arahkan kamera ke label part'}</span>
            </div>
            {comp.props.showControls !== false && (
              <div className="p-2 bg-slate-900/80 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 px-3">
                <span className="flex items-center gap-1 font-mono">Torch: AUTO</span>
                <span className="text-teal-400 font-bold">Html5Qrcode Ready</span>
              </div>
            )}
            {isPreview && (
              <div className="p-2 bg-slate-900 border-t border-slate-800 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => {
                    const mockCode = `LOT-${Math.floor(1000 + Math.random() * 9000)}`;
                    setActiveToast({ message: `QR Code Terdeteksi: ${mockCode}`, type: 'SUCCESS' });
                    executeComponentTriggers(comp, 'ON_SCAN');
                  }}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shadow-sm cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulasi Scan Barcode (OK)</span>
                </button>
              </div>
            )}
          </div>
        );

      case 'VideoPlayer':
        return (
          <div className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="relative aspect-video bg-black flex items-center justify-center group/vid">
              <img
                src={comp.props.poster || 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600'}
                alt="Video Thumbnail"
                className="w-full h-full object-cover opacity-60"
              />
              <div className="absolute top-2 inset-x-2 flex items-center justify-between text-xs">
                <span className="bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold text-white truncate max-w-[200px]">
                  {comp.props.title || 'SOP Training Video'}
                </span>
                <span className="bg-teal-600 px-1.5 py-0.5 rounded text-[9px] font-extrabold text-white uppercase">SOP</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-teal-500/90 text-white flex items-center justify-center shadow-lg border border-white/20">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
              <div className="absolute bottom-0 inset-x-0 p-2 bg-linear-to-t from-black/90 to-transparent flex items-center justify-between text-[10px] text-slate-300">
                <span className="font-mono">00:00 / 03:45</span>
                <span className="text-slate-400">1080p HD</span>
              </div>
            </div>
          </div>
        );

      case 'Camera':
        return (
          <div className="w-full bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-md">
            <div className="p-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Camera className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-slate-200 text-[11px] truncate">{comp.props.label || 'Kamera Inspeksi'}</span>
              </div>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">LIVE</span>
            </div>
            <div className="relative aspect-square max-h-56 bg-slate-900 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div />
              </div>
              <div className="flex flex-col items-center gap-1 text-slate-400 z-10">
                <Camera className="w-8 h-8 opacity-60 text-teal-400" />
                <span className="text-[10px]">{comp.props.subtitle || 'Viewfinder Aktif'}</span>
              </div>
            </div>
            <div className="p-2.5 bg-slate-900 border-t border-slate-800 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white p-0.5 flex items-center justify-center shadow-md">
                <div className="w-full h-full rounded-full bg-teal-500" />
              </div>
            </div>
          </div>
        );

      // SURFACES
      case 'Card':
        return (
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-800">{comp.props.title || 'Card Container'}</div>
            <div className="text-xs text-slate-600 whitespace-pre-wrap">{comp.props.content || 'Konten spesifikasi part...'}</div>
          </div>
        );
      case 'Accordion': {
        const isAccOpen = previewAccordionState[comp.id] !== undefined ? previewAccordionState[comp.id] : true;
        return (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div
              onClick={(e) => {
                if (isPreview) {
                  e.stopPropagation();
                  setPreviewAccordionState(prev => ({ ...prev, [comp.id]: !isAccOpen }));
                }
              }}
              className={`p-2.5 bg-slate-50 flex items-center justify-between text-xs font-bold text-slate-800 ${
                isPreview ? 'cursor-pointer hover:bg-slate-100' : ''
              }`}
            >
              <span>{comp.props.title || '1. Verifikasi Parameter Awal'}</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            {isAccOpen && (
              <div className="p-2.5 text-xs text-slate-600 border-t border-slate-100">
                {comp.props.content || 'Periksa kelengkapan fixture dan pastikan sensor berfungsi normal.'}
              </div>
            )}
          </div>
        );
      }

      // DATA DISPLAY
      case 'Badge':
        return (
          <div className="inline-flex">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200">
              {comp.props.text || 'PASSED'}
            </span>
          </div>
        );
      case 'Avatar':
        return (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#714b67] text-white flex items-center justify-center font-bold text-xs">
              {comp.props.name?.slice(0, 2).toUpperCase() || 'OP'}
            </div>
            <span className="text-xs font-semibold text-slate-700">{comp.props.name || 'OP-01'}</span>
          </div>
        );
      case 'Table':
        return (
          <div className="w-full border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-700 border-b border-slate-200">
              {comp.props.title || 'Spesifikasi Toleransi'}
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/60 text-[10px] text-slate-500 font-bold uppercase">
                <tr>
                  {(comp.props.headers || ['Parameter', 'Standar', 'Aktual']).map((h, i) => (
                    <th key={i} className="p-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {(comp.props.rows || [['Torsi Baut', '45 Nm', '45.2 Nm']]).map((r, i) => (
                  <tr key={i}>
                    {r.map((cell, ci) => (
                      <td key={ci} className={`p-2 ${ci === 2 ? 'font-bold text-emerald-600' : ''}`}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      // FEEDBACK
      case 'Alert':
        return (
          <div className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{comp.props.title || 'Peringatan Safety'}</div>
              <div className="text-[11px] text-amber-700">{comp.props.message || 'Gunakan APD kacamata dan sarung tangan saat pengujian.'}</div>
            </div>
          </div>
        );
      case 'Toast':
        return (
          <div className="p-2.5 rounded-xl border border-emerald-300 bg-emerald-50 flex items-center justify-between text-xs text-emerald-900 shadow-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <div className="font-bold">{comp.props.title || 'Data Tersimpan'}</div>
                <div className="text-[10px] text-emerald-700">{comp.props.message || 'Hasil inspeksi berhasil disinkronisasi.'}</div>
              </div>
            </div>
            <span className="text-[9px] bg-white px-1.5 py-0.5 rounded text-emerald-600 font-bold">Now</span>
          </div>
        );
      case 'Progress':
        return (
          <div className="space-y-1 w-full">
            <div className="flex justify-between text-xs text-slate-600">
              <span>{comp.props.label || 'Target Output Shift'}</span>
              <span className="font-bold">{comp.props.value || 75}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${comp.props.value || 75}%` }} />
            </div>
          </div>
        );
      case 'Spinner':
        return (
          <div className="flex items-center justify-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            <Loader2 className="w-4 h-4 animate-spin text-[#008784]" />
            <span className="font-medium">{comp.props.label || 'Menyinkronkan data...'}</span>
          </div>
        );

      // NAVIGATION
      case 'Tabs': {
        const tabsList = comp.props.tabs || ['Info Part', 'Spesifikasi', 'Riwayat'];
        const activeTabIdx = previewTabsState[comp.id] !== undefined ? previewTabsState[comp.id] : (comp.props.activeIndex || 0);
        return (
          <div className="flex border-b border-slate-200 bg-slate-50/50 rounded-lg overflow-hidden">
            {tabsList.map((tab, i) => (
              <div
                key={i}
                onClick={(e) => {
                  if (isPreview) {
                    e.stopPropagation();
                    setPreviewTabsState(prev => ({ ...prev, [comp.id]: i }));
                  }
                }}
                className={`flex-1 py-1.5 text-center text-xs font-bold border-b-2 transition-colors ${
                  isPreview ? 'cursor-pointer hover:text-[#008784]' : ''
                } ${
                  i === activeTabIdx ? 'border-[#008784] text-[#008784] bg-white' : 'border-transparent text-slate-500'
                }`}
              >
                {tab}
              </div>
            ))}
          </div>
        );
      }
      case 'Command':
        return (
          <div className="p-2 border border-slate-200 rounded-xl bg-slate-50 flex items-center gap-2 text-xs text-slate-400">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>{comp.props.placeholder || 'Cari modul atau serial number...'}</span>
            <kbd className="ml-auto font-mono text-[9px] bg-white border border-slate-200 px-1 rounded">⌘K</kbd>
          </div>
        );
      case 'Navigation':
        return (
          <div className="p-2.5 bg-slate-900 text-white rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold tracking-tight">{comp.props.brand || 'MaviCore MES'}</span>
            <span className="text-[10px] text-slate-400">{comp.props.current || 'Inspeksi QC'}</span>
          </div>
        );
      case 'BottomNavigation':
        return (
          <div className="p-2 bg-white border border-slate-200 rounded-2xl flex items-center justify-around shadow-xs text-[10px] text-slate-600">
            {(comp.props.items || ['Home', 'Scan', 'QC Check', 'Profil']).map((it, i) => (
              <div key={i} className={`flex flex-col items-center ${i === 0 ? 'text-[#008784] font-bold' : ''}`}>
                <div className="w-1.5 h-1.5 rounded-full mb-0.5" />
                <span>{it}</span>
              </div>
            ))}
          </div>
        );

      // OVERLAYS
      case 'Modal':
        return (
          <div className="p-3 bg-white rounded-xl border border-slate-300 shadow-md space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">{comp.props.title || 'Konfirmasi Reject Lot'}</span>
              <X className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-600">{comp.props.body || 'Apakah Anda yakin ingin menandai Lot ini sebagai NG?'}</p>
          </div>
        );
      case 'Drawer':
        return (
          <div className="p-3 bg-white rounded-xl border-l-4 border-l-[#008784] border border-slate-200 shadow-xs space-y-1">
            <div className="text-xs font-bold text-slate-800">{comp.props.title || 'Panel Filter Drawer'}</div>
            <p className="text-[11px] text-slate-500">{comp.props.content || 'Filter riwayat inspeksi tanggal, operator, dan mesin.'}</p>
          </div>
        );

      // LEGACY FALLBACKS
      case 'Text':
        return (
          <div className={`${comp.props.bold ? 'font-bold' : ''} ${comp.props.size === 'lg' ? 'text-lg' : comp.props.size === 'xl' ? 'text-xl' : 'text-sm'}`}>
            {comp.props.text}
          </div>
        );
      // EMBED WIDGETS
      case 'Image':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiImage
              src={comp.props.src}
              alt={comp.props.alt || 'Inspection Image'}
              title={comp.props.title}
              caption={comp.props.caption}
              aspectRatio={comp.props.aspectRatio || '16:9'}
              badgeText={comp.props.badgeText || 'CAD DRAWING'}
              zoomable={comp.props.zoomable !== false}
            />
          </div>
        );

      case 'PDFViewer':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiPDFViewer
              src={comp.props.src}
              title={comp.props.title || 'Work Instruction SOP'}
              docNo={comp.props.docNo || 'SOP-QC-2026-08'}
              rev={comp.props.rev || 'Rev 2.3'}
              pages={comp.props.pages || 3}
              height="280px"
            />
          </div>
        );

      case 'Signature':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiSignature
              label={comp.props.label || 'Tanda Tangan Approval QC'}
              placeholder={comp.props.placeholder || 'Bubuhkan tanda tangan persetujuan di sini'}
              onChange={(sigData) => {
                if (isPreview) {
                  setPreviewFormValues(prev => ({ ...prev, [comp.id]: sigData }));
                  setActiveToast({ message: 'Tanda tangan QC tersimpan', type: 'SUCCESS' });
                  executeComponentTriggers(comp, 'ON_SIGN');
                }
              }}
            />
          </div>
        );

      case 'ListItem':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiListItem
              title={comp.props.title || 'Baris Data Operasional'}
              subtitle={comp.props.subtitle || 'Keterangan lot atau status stasiun'}
              badge={comp.props.badge || 'ACTIVE'}
              value={comp.props.value}
              onClick={() => {
                if (isPreview) {
                  setActiveToast({ message: `Item dipilih: "${comp.props.title || 'Data Operasional'}"`, type: 'INFO' });
                  executeComponentTriggers(comp, 'ON_CLICK');
                }
              }}
            />
          </div>
        );

      case 'Chart':
      case 'LineChart':
      case 'BarChart':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiChart
              type={comp.props.type || (comp.type === 'BarChart' ? 'bar' : 'line')}
              title={comp.props.title || 'KPI Output & OEE Trend'}
              subtitle={comp.props.subtitle}
              data={comp.props.data}
              unit={comp.props.unit || 'pcs'}
              targetValue={comp.props.targetValue || 50}
            />
          </div>
        );

      case 'Gauge':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiGauge
              label={comp.props.label || 'Spindle RPM / Telemetry'}
              value={Number(comp.props.value) || 1850}
              min={Number(comp.props.min) || 0}
              max={Number(comp.props.max) || 3000}
              unit={comp.props.unit || 'RPM'}
              warningThreshold={comp.props.warningThreshold || 2400}
              dangerThreshold={comp.props.dangerThreshold || 2800}
            />
          </div>
        );

      case 'NumberInput': {
        const numVal = previewCounters[comp.id] !== undefined ? previewCounters[comp.id] : (Number(comp.props.value) || 10);
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiNumberInput
              label={comp.props.label || 'Input Quantity'}
              value={numVal}
              min={Number(comp.props.min) || 0}
              max={Number(comp.props.max) || 99999}
              step={Number(comp.props.step) || 1}
              onChange={(val) => {
                if (isPreview) {
                  setPreviewCounters(prev => ({ ...prev, [comp.id]: val }));
                  executeComponentTriggers(comp, 'ON_CHANGE');
                }
              }}
            />
          </div>
        );
      }

      case 'DateTimePicker':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiDateTimePicker
              label={comp.props.label || 'Jadwal Maintenance'}
              value={previewFormValues[comp.id] || comp.props.value}
              mode={comp.props.mode || 'datetime'}
              onChange={(val) => {
                if (isPreview) {
                  setPreviewFormValues(prev => ({ ...prev, [comp.id]: val }));
                  setActiveToast({ message: `Waktu dipilih: ${val}`, type: 'SUCCESS' });
                  executeComponentTriggers(comp, 'ON_CHANGE');
                }
              }}
            />
          </div>
        );

      case 'Timer':
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiTimer
              label={comp.props.label || 'Cycle Time / Takt Time'}
              duration={Number(comp.props.duration) || 60}
              mode={comp.props.mode || 'countdown'}
              autoStart={comp.props.autoStart !== false}
              onComplete={() => {
                if (isPreview) {
                  setActiveToast({ message: 'Timer Siklus Selesai!', type: 'SUCCESS' });
                  executeComponentTriggers(comp, 'ON_COMPLETE');
                }
              }}
            />
          </div>
        );

      case 'Counter': {
        const countVal = previewCounters[comp.id] !== undefined ? previewCounters[comp.id] : (Number(comp.props.value) || 0);
        return (
          <div onClick={(e) => isPreview && e.stopPropagation()}>
            <UiCounter
              label={comp.props.label || 'Good Parts Counter'}
              value={countVal}
              min={Number(comp.props.min) || 0}
              max={Number(comp.props.max) || 99999}
              step={Number(comp.props.step) || 1}
              onChange={(val) => {
                if (isPreview) {
                  setPreviewCounters(prev => ({ ...prev, [comp.id]: val }));
                  executeComponentTriggers(comp, 'ON_CHANGE');
                }
              }}
            />
          </div>
        );
      }
      default:
        return (
          <div className="p-2 bg-slate-100 rounded text-xs text-slate-600">
            {comp.type}
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#f8fafc] text-slate-800 overflow-hidden font-sans select-none" data-palette-root>
      {/* ======================================================== */}
      {/* 1. TOP TOOLBAR (Matching Mavi Core AppBuilder)          */}
      {/* ======================================================== */}
      <header className="h-16 px-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs shrink-0 z-30 relative gap-3">
        {/* Left: Add Screen Button & NAMA APP YG DIBUAT */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(prev => prev === 'ADD_SCREEN' ? null : 'ADD_SCREEN')}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#eff6ff] hover:bg-[#dbeafe] border border-[#bfdbfe] text-[#1d4ed8] rounded-xl font-bold text-xs transition-colors shadow-2xs"
            >
              <div className="w-6 h-6 rounded-lg bg-[#2563eb] text-white flex items-center justify-center">
                <Plus className="w-4 h-4" strokeWidth={3} />
              </div>
              <span>Add Screen</span>
              <ChevronDown className="w-3.5 h-3.5 text-blue-600" />
            </button>

            {/* Dropdown for Add Screen: Blank or From Template */}
            {activeDropdown === 'ADD_SCREEN' && (
              <div className="absolute top-full left-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => addScreen('Screen')}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">Blank Screen</div>
                    <div className="text-[10px] text-slate-400 font-normal">Mulai layar kanvas kosong</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveDropdown(null);
                    setShowTemplateModal(true);
                  }}
                  className="w-full text-left p-2.5 rounded-xl text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#714b67] flex items-center gap-3 transition-all mt-0.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-[#714b67] flex items-center justify-center shrink-0">
                    <LayoutTemplate className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800">From Template...</div>
                    <div className="text-[10px] text-slate-400 font-normal">Buka galeri modal template</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <div className="h-6 w-px bg-slate-200 hidden md:block" />
        </div>

        {/* Center: Toolbar Komponen - Model Dropdown Icon per Kategori (Warna & Ukuran Kotak Lebih Besar) */}
        <div className="flex items-center gap-2 py-1.5 px-2 bg-slate-50/90 rounded-2xl border border-slate-200/80 shadow-2xs relative overflow-visible">
          {COMPONENT_GROUPS.map((group) => {
            const CatIcon = group.icon || Box;
            const isOpen = activeDropdown === `CAT_${group.category}`;
            const theme = group.theme || {
              idle: 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200/90',
              active: 'bg-[#008784] text-white border-[#008784] shadow-md ring-2 ring-[#008784]/30',
              iconColor: 'text-slate-600',
              headerText: 'text-slate-600'
            };

            return (
              <div key={group.category} className="relative" data-dropdown>
                <button
                  type="button"
                  onClick={() => setActiveDropdown(prev => prev === `CAT_${group.category}` ? null : `CAT_${group.category}`)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all shrink-0 select-none cursor-pointer active:scale-95 shadow-xs ${
                    isOpen ? theme.active : theme.idle
                  }`}
                  title={`${group.category} (${group.items.length} komponen)`}
                >
                  <CatIcon className={`w-5 h-5 transition-transform ${isOpen ? 'text-white scale-110' : theme.iconColor}`} />
                </button>

                {/* Dropdown Menu Popover */}
                {isOpen && (
                  <div
                    className="absolute top-full left-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 divide-y divide-slate-100"
                    data-dropdown
                  >
                    {/* Header */}
                    <div className="pb-1.5 mb-1 px-2.5 pt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isOpen ? theme.active : 'bg-slate-100'}`}>
                          <CatIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                        <span className={`text-[11px] font-black uppercase tracking-wider ${theme.headerText || 'text-slate-700'}`}>
                          {group.category}
                        </span>
                      </div>
                      <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {group.items.length} item
                      </span>
                    </div>

                    {/* Items */}
                    <div className="pt-1 space-y-0.5 max-h-[320px] overflow-y-auto no-scrollbar">
                      {group.items.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => {
                              addComponent(item.type, { label: item.label, text: item.label });
                              setActiveDropdown(null);
                            }}
                            className="w-full p-2 rounded-xl flex items-start gap-2.5 text-left hover:bg-slate-50 hover:border-slate-200/80 border border-transparent transition-all group/item active:scale-98 cursor-pointer"
                          >
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.bg} ${item.color} group-hover/item:scale-105 transition-transform shadow-2xs`}>
                              <ItemIcon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-800 group-hover/item:text-[#008784] transition-colors flex items-center justify-between">
                                <span>{item.label}</span>
                                <Plus className="w-3 h-3 text-slate-300 group-hover/item:text-[#008784] transition-colors" />
                              </div>
                              <div className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                                {item.desc}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right: Lock + Undo/Redo + Preview Mode */}
        <div className="flex items-center gap-2">

          {/* Buka / Lock Button */}
          <button
            type="button"
            onClick={() => setIsCanvasLocked(!isCanvasLocked)}
            className={`flex flex-col items-center justify-center px-2 py-1 rounded-xl border text-xs font-bold transition-colors min-w-[46px] ${
              isCanvasLocked ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {isCanvasLocked ? <Lock className="w-3.5 h-3.5 text-indigo-600 mb-0.5" /> : <Unlock className="w-3.5 h-3.5 text-slate-500 mb-0.5" />}
            <span className="text-[9px]">{isCanvasLocked ? 'Terkunci' : 'Buka'}</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              title="Undo"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-600" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={future.length === 0}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors"
              title="Redo"
            >
              <Redo2 className="w-3.5 h-3.5 text-slate-600" />
            </button>
          </div>

          {/* Preview / Edit Mode */}
          <Button
            size="sm"
            variant={isPreview ? 'positive' : 'outline'}
            onPress={() => setIsPreview(!isPreview)}
          >
            <ButtonIcon as={Eye} />
            <ButtonText className="hidden sm:inline">{isPreview ? 'Edit' : 'Preview'}</ButtonText>
          </Button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN 3-PANE WORKSPACE LAYOUT                          */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden">
        {/* ------------------------------------------------------ */}
        {/* LEFT PANE: SCREENS | RECORDS (Hidden in Preview Mode)  */}
        {/* ------------------------------------------------------ */}
        {!isPreview && (
          <aside className="w-80 border-r border-slate-200 bg-white flex flex-col shrink-0 shadow-2xs">
          {/* Left Pane Top Tabs: SCREENS | RECORDS */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              type="button"
              onClick={() => setActiveLeftTab('SCREENS')}
              className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 tracking-wider ${
                activeLeftTab === 'SCREENS' ? 'border-[#008784] text-[#008784] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              SCREENS
            </button>
            <button
              type="button"
              onClick={() => setActiveLeftTab('RECORDS')}
              className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 tracking-wider ${
                activeLeftTab === 'RECORDS' ? 'border-[#008784] text-[#008784] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              RECORDS
            </button>
          </div>

          {/* Left Pane Content: SCREENS */}
          {activeLeftTab === 'SCREENS' && (
            <div className="flex-1 overflow-y-auto flex flex-col divide-y divide-slate-100">
              {/* SCREENS TREE LIST */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between relative">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    APP SCREENS ({screens.length})
                  </span>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setActiveDropdown(prev => prev === 'SIDEBAR_ADD_SCREEN' ? null : 'SIDEBAR_ADD_SCREEN')}
                      className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg border border-blue-200 flex items-center gap-0.5 text-[10px] font-bold"
                      title="Add screen"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>

                    {/* Mini dropdown for sidebar add screen */}
                    {activeDropdown === 'SIDEBAR_ADD_SCREEN' && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 animate-in fade-in zoom-in-95">
                        <button
                          type="button"
                          onClick={() => addScreen('Screen')}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-600" /> Blank Screen
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveDropdown(null);
                            setShowTemplateModal(true);
                          }}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-[#714b67] flex items-center gap-2 mt-0.5"
                        >
                          <LayoutTemplate className="w-3.5 h-3.5 text-[#714b67]" /> From Template...
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hierarchical Screen Tree with Reordering Support */}
                <div className="space-y-1.5">
                  {screens.map((scr, index) => {
                    const isActive = currentScreenId === scr.id;
                    const isExpanded = expandedScreens.has(scr.id);
                    const isDragging = draggedScreenIndex === index;
                    const isDragOver = dragOverScreenIndex === index;
                    const comps = scr.components || [];

                    return (
                      <div
                        key={scr.id}
                        className={`space-y-1 transition-all duration-150 ${isDragOver ? 'scale-[1.01]' : ''}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (draggedScreenIndex !== null && draggedScreenIndex !== index) {
                            setDragOverScreenIndex(index);
                          }
                        }}
                        onDragLeave={() => {
                          if (dragOverScreenIndex === index) {
                            setDragOverScreenIndex(null);
                          }
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedScreenIndex !== null && draggedScreenIndex !== index) {
                            reorderScreens(draggedScreenIndex, index);
                          }
                          setDraggedScreenIndex(null);
                          setDragOverScreenIndex(null);
                        }}
                      >
                        {/* Screen Tree Node Header */}
                        <div
                          draggable
                          onDragStart={(e) => {
                            setDraggedScreenIndex(index);
                            e.dataTransfer.effectAllowed = 'move';
                            e.dataTransfer.setData('text/plain', scr.id);
                          }}
                          onDragEnd={() => {
                            setDraggedScreenIndex(null);
                            setDragOverScreenIndex(null);
                          }}
                          onClick={() => setCurrentScreenId(scr.id)}
                          className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${
                            isDragging
                              ? 'opacity-40 border-dashed border-blue-400 bg-blue-50/30'
                              : isDragOver
                              ? 'border-2 border-[#1967d2] ring-2 ring-blue-100 bg-blue-50/50'
                              : isActive
                              ? 'bg-[#e8f0fe] border-[#bed8fb] text-[#1967d2] font-bold shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            {/* Drag Handle Grip */}
                            <div
                              className="cursor-grab active:cursor-grabbing p-0.5 text-slate-300 hover:text-slate-600 transition-colors shrink-0"
                              title="Tarik untuk mengubah urutan screen"
                            >
                              <GripVertical className="w-3.5 h-3.5" />
                            </div>

                            {/* Expand / Collapse Chevron */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpandScreen(scr.id);
                              }}
                              className="p-0.5 hover:bg-black/5 rounded text-slate-500 transition-colors shrink-0"
                              title={isExpanded ? 'Collapse components' : 'Expand components'}
                            >
                              <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-150 ${isExpanded ? 'rotate-90 text-blue-600' : 'text-slate-400'}`} />
                            </button>

                            {/* Screen Document Icon */}
                            <FileText className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />

                            {/* Screen Title */}
                            <span className="text-xs truncate select-none">{scr.title}</span>
                            <span className="text-[10px] text-slate-400 font-normal shrink-0">({comps.length})</span>
                          </div>

                          {/* Screen Action buttons & Reorder arrows */}
                          <div className="flex items-center gap-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                            {/* Reorder: Move Up */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveScreen(scr.id, 'up');
                              }}
                              disabled={index === 0}
                              className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                              title="Pindah ke Atas"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>

                            {/* Reorder: Move Down */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveScreen(scr.id, 'down');
                              }}
                              disabled={index === screens.length - 1}
                              className="p-1 hover:bg-black/5 rounded text-slate-400 hover:text-slate-700 disabled:opacity-20 transition-colors"
                              title="Pindah ke Bawah"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>

                            {/* Duplicate */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); duplicateScreen(scr.id); }}
                              className="p-1 hover:bg-white/60 rounded text-slate-500"
                              title="Duplicate Screen"
                            >
                              <Copy className="w-3 h-3" />
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); deleteScreen(scr.id); }}
                              disabled={screens.length <= 1}
                              className="p-1 hover:bg-rose-100/60 rounded text-slate-400 hover:text-rose-600 disabled:opacity-20"
                              title="Delete Screen"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Screen Tree Children: Components List inside Screen */}
                        {isExpanded && (
                          <div className="ml-5 pl-2.5 border-l-2 border-blue-200/80 my-1 space-y-1">
                            {comps.length === 0 ? (
                              <div className="text-[11px] text-slate-400 italic py-1.5 px-2 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
                                Belum ada komponen. Pilih menu "Komponen" di atas.
                              </div>
                            ) : (
                              comps.map((comp) => {
                                const isCompSelected = isActive && selectedId === comp.id;
                                const CompIcon = getComponentIcon(comp.type);
                                const compLabel = comp.props?.text || comp.props?.label || comp.props?.title || comp.props?.placeholder || comp.type;

                                return (
                                  <div
                                    key={comp.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (currentScreenId !== scr.id) setCurrentScreenId(scr.id);
                                      setSelectedId(comp.id);
                                      setActiveRightTab('WIDGET');
                                    }}
                                    className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-all border ${
                                      isCompSelected
                                        ? 'bg-[#008784]/15 border-[#008784] text-[#008784] font-bold shadow-2xs'
                                        : 'bg-white hover:bg-slate-50 border-slate-200/70 text-slate-700'
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                        isCompSelected ? 'bg-[#008784] text-white' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                        <CompIcon className="w-3 h-3" />
                                      </div>
                                      <span className="truncate text-[11px] leading-tight">
                                        {compLabel}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                      <span className="text-[9px] text-slate-400 bg-slate-100 px-1 py-0.2 rounded font-normal">
                                        {comp.type}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (currentScreenId !== scr.id) setCurrentScreenId(scr.id);
                                          removeComponent(comp.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-opacity"
                                        title="Hapus Komponen"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* MY FRONT-LINE APPS (Matching Mavi Core AppBuilder) */}
              <div className="p-3 space-y-2 flex-1">
                <div className="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <FolderOpen className="w-3 h-3 text-slate-400" />
                    <span>My Front-Line Apps</span>
                    {appsList.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-teal-50 text-teal-700 text-[9px] font-mono font-bold">
                        {appsList.length}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newId = `app_${Date.now()}`;
                      setCurrentAppId(newId);
                      setAppName(`Mobile App ${appsList.length + 1}`);
                      setScreens([
                        {
                          id: 'screen_1',
                          title: 'Home',
                          components: [
                            { id: 'comp_1', type: 'Text', props: { text: 'Mobile Dashboard', size: 'lg', bold: true } },
                            { id: 'comp_2', type: 'Card', props: { title: 'OEE Target', content: '85%' } },
                            { id: 'comp_3', type: 'Card', props: { title: 'Output Today', content: '1,234 pcs' } },
                            { id: 'comp_4', type: 'Card', props: { title: 'Reject Rate', content: '2.3%' } },
                            { id: 'comp_5', type: 'Progress', props: { value: 85, label: 'Daily Target' } }
                          ],
                          triggers: []
                        }
                      ]);
                      setActiveToast({ message: 'Kanvas baru siap didesain. Klik Simpan untuk menyimpan ke daftar aplikasi.', type: 'INFO' });
                    }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                    title="Buat Aplikasi Baru"
                  >
                    <Plus className="w-3.5 h-3.5 text-teal-700" />
                  </button>
                </div>

                <div className="space-y-1">
                  {isLoadingAppsList ? (
                    <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#008784]" />
                      <span>Memuat aplikasi...</span>
                    </div>
                  ) : appsList.length === 0 ? (
                    <div className="text-center py-5 px-3 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <FolderOpen className="w-5 h-5 text-slate-300 mx-auto mb-1" />
                      <div className="text-[11px] font-bold text-slate-600">Belum ada aplikasi</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">Hanya aplikasi Gluestack yang Anda simpan yang akan tampil di sini.</div>
                    </div>
                  ) : (
                    appsList.map(app => {
                      const isSelected = app.id === currentAppId;
                      return (
                        <div
                          key={app.id}
                          onClick={() => handleSelectApp(app)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between group ${
                            isSelected ? 'bg-teal-50 border-[#008784] text-[#008784]' : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold truncate">{app.name}</div>
                            <div className="text-[9px] text-slate-400">
                              Updated {new Date(app.updated_at || Date.now()).toLocaleDateString('id-ID')}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteApp(app, e)}
                            className="opacity-30 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded text-rose-500 transition-opacity ml-1 cursor-pointer"
                            title="Hapus Aplikasi"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Left Pane Content: RECORDS */}
          {activeLeftTab === 'RECORDS' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4 divide-y divide-slate-100">
              {/* 1. APP DATA SOURCES */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    APP DATA SOURCES
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddTableModal(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold transition-colors border border-blue-200"
                  >
                    <Plus className="w-3 h-3" /> Add Table
                  </button>
                </div>

                {tables.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 italic">
                    Belum ada tabel data. Klik "Add Table" untuk menambahkan.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tables.map(table => {
                      const relatedRps = recordPlaceholders.filter(r => r.tableId === table.id);
                      return (
                        <div key={table.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Table className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-xs font-bold text-slate-800">{table.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500">{table.columns?.length || 0} cols</span>
                              <button
                                type="button"
                                onClick={() => setTables(prev => prev.filter(t => t.id !== table.id))}
                                className="p-0.5 text-slate-400 hover:text-rose-600 rounded"
                                title="Hapus Table"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          {/* Record placeholders under table */}
                          <div className="pl-4 space-y-1">
                            {relatedRps.length === 0 ? (
                              <div className="text-[10px] text-slate-400 italic py-0.5">Tidak ada placeholder terhubung</div>
                            ) : (
                              relatedRps.map(rp => (
                                <div key={rp.id} className="flex items-center justify-between text-[11px] bg-emerald-50/80 text-emerald-800 px-2 py-1 rounded-lg border border-emerald-200 font-medium">
                                  <span>🏷️ {rp.name}</span>
                                  <span className="font-mono text-slate-500 text-[10px]">{rp.field}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. RECORD PLACEHOLDERS */}
              <div className="space-y-2.5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                    RECORD PLACEHOLDERS ({recordPlaceholders.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddRpModal(true)}
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#008784]/10 text-[#008784] hover:bg-[#008784]/20 text-[10px] font-bold transition-colors border border-[#008784]/30"
                  >
                    <Plus className="w-3 h-3" /> Add Placeholder
                  </button>
                </div>

                <div className="space-y-2">
                  {recordPlaceholders.map(rp => {
                    const linkedTable = tables.find(t => t.id === rp.tableId);
                    return (
                      <div key={rp.id} className="p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            🏷️ {rp.name}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRecordPlaceholders(prev => prev.filter(r => r.id !== rp.id))}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded"
                            title="Delete placeholder"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500 flex justify-between">
                          <span>Table: <strong className="text-slate-700">{linkedTable?.name || 'None'}</strong></span>
                          <span>Field: <strong className="font-mono text-emerald-700">{rp.field}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </aside>
        )}

        {/* ------------------------------------------------------ */}
        {/* CENTER PANE: GLUESTACK INTERACTIVE CANVAS PREVIEW      */}
        {/* ------------------------------------------------------ */}
        <main className={`flex-1 bg-slate-100 dark:bg-[#090a0f] flex flex-col overflow-hidden relative ${isPreview ? 'w-full' : ''}`}>
          {/* Top Preview Banner when Preview Mode is Active */}
          {isPreview && (
            <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between shadow-md shrink-0 z-30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                <span className="text-xs font-black uppercase tracking-wider">Preview Mode (Interactive Running App)</span>
                <span className="text-xs text-emerald-100 hidden sm:inline">| {currentScreen?.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={currentScreenId}
                  onChange={(e) => setCurrentScreenId(e.target.value)}
                  className="bg-emerald-700 text-white text-xs rounded-lg px-2.5 py-1 border border-emerald-500 font-bold outline-none cursor-pointer"
                >
                  {screens.map((s, idx) => (
                    <option key={s.id} value={s.id}>{idx + 1}. {s.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewFormValues({});
                    setPreviewCounters({});
                    setActiveToast({ message: 'Form state di-reset', type: 'INFO' });
                  }}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Reset Form
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreview(false)}
                  className="px-3 py-1 bg-white text-emerald-800 hover:bg-emerald-50 rounded-lg text-xs font-black transition-colors flex items-center gap-1 shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Exit Preview</span>
                </button>
              </div>
            </div>
          )}
          {/* Scrollable Canvas Viewport */}
          <div className="flex-1 overflow-y-auto py-3 px-4 pb-16 flex flex-col items-center justify-center">
            {/* Device Viewport Mockup (Responds to Device Switcher) */}
            <div
              className={`transition-all duration-300 mx-auto bg-white dark:bg-[#12131c] rounded-3xl shadow-2xl overflow-hidden border border-slate-300 dark:border-slate-700 flex flex-col relative ${activeDeviceClass}`}
              style={{
                backgroundColor: screenSettings.bgColor === 'transparent' ? 'transparent' : screenSettings.bgColor,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center'
              }}
            >
              {/* Phone Notch/Status Header for mobile & tablet */}
              {currentDeviceFrame !== 'responsive' && (
                <div className="h-6 bg-slate-900 text-white flex items-center justify-between px-6 shrink-0 select-none text-[10px] font-bold">
                  <span>09:41</span>
                  <div className="w-20 h-3 bg-black rounded-full" />
                  <div className="flex items-center gap-1.5">
                    <span>5G</span>
                    <div className="w-3.5 h-2 border border-white rounded-xs relative">
                      <div className="h-full w-2.5 bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* In-app Header if configured */}
              {screenSettings.showHeader && (
                <div
                  className="h-10 flex items-center justify-between px-4 text-xs font-bold text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: screenSettings.headerColor === 'black' ? '#000' : '#1e293b' }}
                >
                  <span>{currentScreen?.title || 'Screen'}</span>
                  <span className="text-[10px] text-slate-300 font-mono">{appName}</span>
                </div>
              )}

              {/* In-Phone Feedback Notification for Preview Mode */}
              {isPreview && activeToast && (
                <div className="absolute top-8 inset-x-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 pointer-events-none">
                  <div className={`px-3 py-2 rounded-xl shadow-xl border text-xs font-bold flex items-center gap-2 text-white ${
                    activeToast.type === 'ERROR' ? 'bg-rose-600 border-rose-500' :
                    activeToast.type === 'WARNING' ? 'bg-amber-600 border-amber-500' :
                    activeToast.type === 'INFO' ? 'bg-blue-600 border-blue-500' :
                    activeToast.type === 'SUCCESS' ? 'bg-emerald-600 border-emerald-500' :
                    'bg-slate-900 border-slate-800'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                    <span className="truncate flex-1">{activeToast.message}</span>
                  </div>
                </div>
              )}

              {/* Component Canvas Container */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
                {screenComponents.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-slate-700">Start building your canvas</div>
                    <div className="text-xs text-slate-400 text-center max-w-xs">
                      Drag widgets from the toolbar above or click any category to add components.
                    </div>
                    <button
                      type="button"
                      onClick={() => addComponent('Button', { text: 'New Button' })}
                      className="px-4 py-2 bg-[#008784] hover:bg-[#007471] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 mt-2"
                    >
                      <Plus className="w-4 h-4" /> Add Widget
                    </button>
                  </div>
                ) : (
                  screenComponents.map((comp) => {
                    // Check visibility condition in preview mode
                    if (isPreview && comp.props?.visibilityCondition) {
                      const vc = comp.props.visibilityCondition;
                      if (vc.variable) {
                        const foundVar = variables.find(v => v.name === vc.variable || v.id === vc.variable);
                        const varVal = foundVar ? String(foundVar.value ?? '') : '';
                        const targetVal = String(vc.value ?? '');
                        let isVisible = true;
                        if (vc.operator === '==') isVisible = varVal.toLowerCase() === targetVal.toLowerCase();
                        else if (vc.operator === '!=') isVisible = varVal.toLowerCase() !== targetVal.toLowerCase();
                        else if (vc.operator === '>') isVisible = Number(varVal) > Number(targetVal);
                        else if (vc.operator === '<') isVisible = Number(varVal) < Number(targetVal);
                        else if (vc.operator === 'contains') isVisible = varVal.toLowerCase().includes(targetVal.toLowerCase());
                        if (!isVisible) return null;
                      }
                    }

                    const isBlinking = comp.props?.isBlinking;
                    const isThisDropOpen = comp.type === 'Dropdown' && !!previewDropdownState[comp.id];
                    const customStyle = {
                      ...(comp.props?.backgroundColor && comp.props.backgroundColor !== 'transparent' ? { backgroundColor: comp.props.backgroundColor } : {}),
                      ...(comp.props?.color ? { color: comp.props.color } : {}),
                      ...(comp.props?.fontSize ? { fontSize: `${comp.props.fontSize}px` } : {}),
                      ...(comp.props?.fontWeight === 'bold' ? { fontWeight: 'bold' } : {}),
                      ...(comp.props?.fontStyle === 'italic' ? { fontStyle: 'italic' } : {}),
                      ...(comp.props?.textDecoration === 'underline' ? { textDecoration: 'underline' } : {}),
                      ...(comp.props?.textAlign ? { textAlign: comp.props.textAlign } : {})
                    };

                    return (
                      <div
                        key={comp.id}
                        style={customStyle}
                        onClick={() => {
                          if (!isPreview && !isCanvasLocked) {
                            setSelectedId(comp.id);
                            setActiveRightTab('WIDGET');
                          } else if (isPreview) {
                            executeComponentTriggers(comp, 'ON_CLICK');
                          }
                        }}
                        className={`p-2 rounded-xl transition-all relative group ${
                          isThisDropOpen ? 'z-40' : 'z-10'
                        } ${
                          !isPreview && selectedId === comp.id
                            ? 'ring-2 ring-[#714b67] bg-[#714b67]/5 shadow-xs'
                            : !isPreview ? 'hover:ring-1 hover:ring-slate-300' : ''
                        } ${isBlinking ? 'animate-pulse' : ''} ${!isPreview ? 'cursor-pointer' : ''}`}
                      >
                      {/* Floating component actions on hover */}
                      {!isPreview && selectedId === comp.id && (
                        <div className="absolute top-1 right-1 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-lg shadow-md z-20 border border-slate-200">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'up'); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); moveComponent(comp.id, 'down'); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); duplicateComponent(comp.id); }}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500"
                            title="Duplicate"
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); removeComponent(comp.id); }}
                            className="p-1 hover:bg-rose-50 rounded text-rose-500"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      {renderPreview(comp)}
                    </div>
                  );
                  })
                )}
              </div>

              {/* Bottom Nav if enabled */}
              {screenSettings.showNavBar && (
                <div className="h-14 bg-white border-t border-slate-200 flex items-center justify-around px-4 shrink-0">
                  <div className="flex flex-col items-center gap-0.5 text-emerald-600">
                    <Home className="w-4 h-4" />
                    <span className="text-[9px] font-bold">Home</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-slate-400">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-[9px]">Analytics</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-slate-400">
                    <Bell className="w-4 h-4" />
                    <span className="text-[9px]">Alerts</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 text-slate-400">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-[9px]">Settings</span>
                  </div>
                </div>
              )}

              {/* Bottom Home Indicator Bar */}
              {currentDeviceFrame !== 'responsive' && (
                <div className="h-4 bg-white dark:bg-[#12131c] flex items-center justify-center shrink-0 border-t border-slate-100 dark:border-slate-800/40">
                  <div className="w-28 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                </div>
              )}
            </div>
          </div>

        </main>

        {/* ------------------------------------------------------ */}
        {/* RIGHT PANE: WIDGET | SCREEN | APP (Hidden in Preview)  */}
        {/* ------------------------------------------------------ */}
        {!isPreview && (
          <aside className="w-84 border-l border-slate-200 bg-white flex flex-col shrink-0 shadow-2xs">
          {/* Right Pane Top Tabs: WIDGET | SCREEN | APP */}
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            {['WIDGET', 'SCREEN', 'APP'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveRightTab(t)}
                className={`flex-1 py-3 text-xs font-extrabold transition-colors border-b-2 tracking-wider ${
                  activeRightTab === t ? 'border-[#008784] text-[#008784] bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Right Pane Content: WIDGET (Complete Mavi AppBuilder Properties System for Gluestack) */}
          {activeRightTab === 'WIDGET' && (
            <div className="flex-1 overflow-y-auto p-4">
              <GluestackWidgetProperties
                selectedComponent={selectedComponent}
                updateProps={updateProps}
                updateDataSource={updateDataSource}
                updateComponentName={(id, name) => {
                  const next = screenComponents.map(c => c.id === id ? { ...c, name } : c);
                  updateComponents(next);
                }}
                updateComponentDisplayName={(id, displayName) => {
                  const next = screenComponents.map(c => c.id === id ? { ...c, displayName } : c);
                  updateComponents(next);
                }}
                removeComponent={removeComponent}
                duplicateComponent={duplicateComponent}
                reorderComponent={reorderComponent}
                moveComponent={moveComponent}
                screens={screens}
                currentScreenId={currentScreenId}
                variables={variables}
                setVariables={setVariables}
                tables={tables}
                recordPlaceholders={recordPlaceholders}
                openAddTrigger={openAddTrigger}
                openEditTrigger={openEditTrigger}
                handleDeleteTrigger={handleDeleteTrigger}
                onOpenCopilot={(comp) => {
                  if (comp) setSelectedId(comp.id);
                  setIsCopilotOpen(true);
                }}
              />
            </div>
          )}

          {/* Right Pane Content: SCREEN */}
          {activeRightTab === 'SCREEN' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Screen Title</label>
                <input
                  type="text"
                  value={currentScreen?.title || ''}
                  onChange={(e) => {
                    const title = e.target.value;
                    setScreens(prev => prev.map(s => s.id === currentScreenId ? { ...s, title } : s));
                  }}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                />
              </div>

              {/* Screen Presets */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PRESETS</span>
                <div className="grid grid-cols-2 gap-2">
                  {SCREEN_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setScreenSettings(prev => ({
                        ...prev,
                        bgColor: preset.bgColor,
                        headerColor: preset.headerColor,
                        showHeader: preset.showHeader,
                        showNavBar: preset.showNavBar,
                        screenPreset: preset.id
                      }))}
                      className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                        screenSettings.screenPreset === preset.id ? 'border-[#008784] bg-teal-50/50 text-[#008784]' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">BACKGROUND COLOR</span>
                <div className="flex items-center gap-2">
                  {['white', '#f8fafc', '#0f172a', '#12131c', 'transparent'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setScreenSettings(prev => ({ ...prev, bgColor: color }))}
                      className={`w-7 h-7 rounded-lg border-2 transition-all ${
                        screenSettings.bgColor === color ? 'border-[#008784] scale-110' : 'border-slate-200'
                      }`}
                      style={{ backgroundColor: color === 'transparent' ? '#fff' : color }}
                      title={color}
                    />
                  ))}
                  <input
                    type="color"
                    value={screenSettings.bgColor === 'transparent' ? '#ffffff' : screenSettings.bgColor}
                    onChange={(e) => setScreenSettings(prev => ({ ...prev, bgColor: e.target.value }))}
                    className="w-7 h-7 rounded-lg border border-slate-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Display Options */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">DISPLAY OPTIONS</span>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <span className="text-xs font-semibold text-slate-700">Show Header</span>
                  <input
                    type="checkbox"
                    checked={screenSettings.showHeader}
                    onChange={(e) => setScreenSettings(prev => ({ ...prev, showHeader: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#008784]"
                  />
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded-xl">
                  <span className="text-xs font-semibold text-slate-700">Show Bottom Nav</span>
                  <input
                    type="checkbox"
                    checked={screenSettings.showNavBar}
                    onChange={(e) => setScreenSettings(prev => ({ ...prev, showNavBar: e.target.checked }))}
                    className="w-4 h-4 rounded text-[#008784]"
                  />
                </div>
              </div>

              {/* Screen Triggers (Mavi AppBuilder Standard) */}
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">SCREEN TRIGGERS</span>
                    <span className="text-[9px] text-slate-400 font-medium">On Load, On Leave, Timer</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openAddTrigger('SCREEN', currentScreenId)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-extrabold flex items-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Trigger</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {(currentScreen?.triggers || []).length === 0 ? (
                    <div className="text-[11px] text-slate-400 bg-slate-50/80 p-3 rounded-xl border border-dashed border-slate-200 text-center space-y-1.5">
                      <Zap className="w-4 h-4 mx-auto text-slate-300" />
                      <div className="text-slate-500 font-medium">No screen-level triggers configured.</div>
                      <button
                        type="button"
                        onClick={() => openAddTrigger('SCREEN', currentScreenId)}
                        className="text-[10px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add screen trigger
                      </button>
                    </div>
                  ) : (
                    (currentScreen?.triggers || []).map((trig, idx) => {
                      const clauseCount = (trig.clauses || []).length;
                      let totalActions = (trig.elseActions || []).length;
                      (trig.clauses || []).forEach(c => {
                        totalActions += (c.actions || []).length;
                      });
                      const isActive = trig.enabled !== false;

                      return (
                        <div
                          key={trig.id || idx}
                          onClick={() => openEditTrigger(trig, idx, 'SCREEN', currentScreenId)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer group hover:shadow-xs ${
                            isActive ? 'bg-white border-slate-200 hover:border-indigo-300' : 'bg-slate-50/70 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${
                                isActive ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'
                              }`}>
                                {isActive ? 'ACTIVE' : 'OFF'}
                              </span>
                              <span className="font-bold text-slate-800 text-xs truncate">
                                {trig.name || 'New Trigger'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditTrigger(trig, idx, 'SCREEN', currentScreenId);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTrigger(trig.id);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span className="font-mono text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.2 rounded text-[9px]">
                              {trig.event || 'ON_SCREEN_LOAD'}
                            </span>
                            <span>{clauseCount} clause{clauseCount !== 1 ? 's' : ''} • {totalActions} action{totalActions !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Right Pane Content: APP */}
          {activeRightTab === 'APP' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 block">Application Name</label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white font-bold text-slate-800"
                />
              </div>

              {/* App Variables */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">APP VARIABLES ({variables.length})</span>
                </div>

                <div className="space-y-1.5">
                  {variables.map(v => (
                    <div key={v.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold font-mono text-slate-800">{v.name}</span>
                        <span className="text-[9px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded uppercase font-bold">{v.type}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">Value: <span className="font-semibold text-slate-700">{String(v.value)}</span></div>
                    </div>
                  ))}
                </div>

                {/* Add variable form */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="text-[10px] font-bold text-slate-600">New Variable</div>
                  <input
                    type="text"
                    placeholder="VAR_NAME"
                    value={newVar.name}
                    onChange={(e) => setNewVar(prev => ({ ...prev, name: e.target.value.toUpperCase() }))}
                    className="w-full text-xs p-1.5 border border-slate-300 rounded bg-white font-mono"
                  />
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Initial value"
                      value={newVar.value}
                      onChange={(e) => setNewVar(prev => ({ ...prev, value: e.target.value }))}
                      className="flex-1 text-xs p-1.5 border border-slate-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newVar.name.trim()) return;
                        setVariables(prev => [...prev, { id: `var_${Date.now()}`, name: newVar.name.trim(), type: 'string', value: newVar.value, persisted: false }]);
                        setNewVar({ name: '', type: 'string', value: '' });
                      }}
                      className="px-3 py-1 bg-[#008784] text-white text-xs font-bold rounded hover:bg-[#007471]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">PROJECT ACTIONS</span>
                <button
                  type="button"
                  onClick={exportAsJSON}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Export App JSON
                </button>
              </div>
            </div>
          )}
        </aside>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. MODALS: ADD TABLE & ADD RECORD PLACEHOLDER           */}
      {/* ======================================================== */}
      {showAddTableModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Table className="w-4 h-4 text-blue-600" /> Create Data Table
            </div>
            <input
              type="text"
              placeholder="Table Name (e.g. DefectsLog)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              autoFocus
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTableModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateTable}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700"
              >
                Create Table
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRpModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <div className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600" /> Add Record Placeholder
            </div>
            <input
              type="text"
              placeholder="Placeholder Name (e.g. Scanned Part)"
              value={newRpName}
              onChange={(e) => setNewRpName(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg"
              autoFocus
            />
            <select
              value={newRpTableId}
              onChange={(e) => setNewRpTableId(e.target.value)}
              className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white"
            >
              {tables.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddRpModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateRp}
                className="px-4 py-1.5 rounded-lg bg-[#008784] text-white text-xs font-bold hover:bg-[#007471]"
              >
                Save Placeholder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: TEMPLATE SCREEN GALLERY (Ketika Add Screen -> From Template) */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <LayoutTemplate className="w-4 h-4 text-[#714b67]" />
                    Pilih Template Screen
                  </h3>
                  <span className="text-[10px] bg-purple-100 text-[#714b67] font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                    {APP_TEMPLATES.length} Template
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tersedia 16 template layar industri bawaan untuk mempercepat pembuatan aplikasi shop floor, QC, atau SCADA.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Search & Category Filter */}
            <div className="p-4 px-6 border-b border-slate-100 bg-white shrink-0 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari template (contoh: inspection, dashboard, work order, kanban, sop, tpm, scada)..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-[#714b67] outline-none transition-all"
                  autoFocus
                />
              </div>

              {/* Quick Category Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 text-[11px] font-semibold text-slate-600">
                <span className="text-[10px] text-slate-400 shrink-0 uppercase tracking-wider font-extrabold">Filter:</span>
                {['Semua', 'Shop Floor', 'Quality Control', 'Maintenance', 'Warehouse', 'Authentication', 'Hardware & IoT', 'Management', 'Training'].map((cat) => {
                  const isCurrent = (cat === 'Semua' && !templateSearch) || templateSearch.toLowerCase() === cat.toLowerCase();
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTemplateSearch(cat === 'Semua' ? '' : cat)}
                      className={`px-2.5 py-1 rounded-lg transition-colors shrink-0 text-[10px] font-bold ${
                        isCurrent
                          ? 'bg-[#714b67] text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Templates Grid */}
            <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/40">
              {APP_TEMPLATES.filter(tpl =>
                tpl.title.toLowerCase().includes(templateSearch.toLowerCase()) ||
                tpl.description.toLowerCase().includes(templateSearch.toLowerCase()) ||
                tpl.category.toLowerCase().includes(templateSearch.toLowerCase())
              ).map((tpl) => {
                const TplIcon = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => addScreenFromTemplate(tpl)}
                    className="p-4 rounded-2xl border border-slate-200/80 bg-white hover:border-[#714b67] hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center ${tpl.color} group-hover:scale-105 transition-transform`}>
                            <TplIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-[#714b67] transition-colors leading-tight">
                              {tpl.title}
                            </div>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold uppercase">
                              {tpl.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {tpl.components?.length || 0} Komponen
                      </span>
                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-purple-50 group-hover:bg-[#714b67] text-[#714b67] group-hover:text-white text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        Pilih Template <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 px-6 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  setShowTemplateModal(false);
                  addScreen('Screen');
                }}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Atau buat Blank Screen baru
              </button>
              <button
                type="button"
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mavi AppBuilder Standard Trigger Editor Modal */}
      <TriggerEditorModal
        isOpen={triggerEditor.isOpen}
        onClose={() => setTriggerEditor(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveTrigger}
        onDelete={handleDeleteTrigger}
        initialTrigger={triggerEditor.trigger}
        sourceType={triggerEditor.sourceType}
        sourceComponent={triggerEditor.sourceType === 'WIDGET' ? screenComponents.find(c => c.id === triggerEditor.sourceId) : null}
        screens={screens}
        variables={variables}
        tables={tables}
        recordPlaceholders={recordPlaceholders}
        onTestTrigger={(trig) => runTrigger(trig, trig.event)}
      />

      {/* Companion Connect Modal (QR Code & Link App) */}
      {isCompanionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-center animate-in zoom-in-95 duration-200 flex flex-col items-center">
            {/* Modal Header */}
            <div className="w-full flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Cast className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-extrabold text-slate-800 leading-tight">Companion Connect</h3>
                  <p className="text-[11px] text-slate-400">Hubungkan perangkat mobile ke aplikasi ini</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCompanionModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* App Name Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 border border-slate-200/90 rounded-full text-xs font-bold text-slate-700 shadow-3xs mb-4 max-w-full">
              <Smartphone className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate">{appName}</span>
            </div>

            {/* QR Code Container (Local Vector SVG via react-qr-code) */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-100 shadow-sm mb-4 flex items-center justify-center">
              <QRCode
                value={getCompanionUrl()}
                size={190}
                level="H"
                bgColor="#ffffff"
                fgColor="#0f172a"
              />
            </div>

            {/* Description */}
            <p className="text-xs text-slate-500 mb-4 leading-relaxed max-w-xs">
              Scan QR code ini menggunakan kamera HP atau aplikasi <strong className="text-slate-800 font-bold">MES Companion</strong> untuk menjalankan dan menguji aplikasi secara real-time.
            </p>

            {/* Shareable Link Codebox */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 flex items-center gap-2 mb-4">
              <code className="text-[11px] text-slate-600 font-mono flex-1 text-left truncate px-1">
                {getCompanionUrl()}
              </code>
              <button
                type="button"
                onClick={handleCopyAppLink}
                className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-bold transition-colors shrink-0 flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              >
                <Copy className="w-3 h-3" />
                <span>Salin</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  window.open(getCompanionUrl(), '_blank');
                }}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Buka di Tab Baru</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCompanionModalOpen(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification Banner for Trigger Executions & App Actions */}
      {activeToast && (
        <div className="fixed bottom-6 right-24 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl border text-xs font-bold text-white ${
            activeToast.type === 'ERROR' ? 'bg-rose-600 border-rose-500' :
            activeToast.type === 'WARNING' ? 'bg-amber-600 border-amber-500' :
            activeToast.type === 'INFO' ? 'bg-blue-600 border-blue-500' :
            activeToast.type === 'SUCCESS' ? 'bg-emerald-600 border-emerald-500' :
            'bg-slate-900 border-slate-800'
          }`}>
            {activeToast.type === 'SUCCESS' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-100 shrink-0" />
            ) : (
              <Zap className="w-4 h-4 text-teal-400 shrink-0" />
            )}
            <span>{activeToast.message}</span>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Gluestack Canvas Copilot Floating Action Button (Direct launch, matching MaviCore AppBuilder) */}
      {!isCopilotOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center">
          <button
            type="button"
            onClick={() => setIsCopilotOpen(true)}
            className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-indigo-500/40 border border-white/20 hover:scale-105 hover:shadow-indigo-500/60 active:scale-95 transition-all cursor-pointer relative"
            title="Buka Gluestack Canvas Copilot (AI Mobile App Builder)"
          >
            {/* Ambient Pulse Ring */}
            <span className="absolute -inset-1 rounded-full bg-indigo-500/30 animate-ping -z-10 pointer-events-none" />

            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shadow-inner">
              <Bot className="w-5 h-5 text-white group-hover:scale-110 group-hover:rotate-12 transition-transform" />
            </div>

            <div className="flex flex-col text-left pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wide text-white">Copilot Gluestack</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-400/30 text-blue-200 border border-blue-300/30">Canvas</span>
              </div>
              <span className="text-[10px] text-blue-100/80">AI Mobile App Builder</span>
            </div>

            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs animate-pulse ml-0.5" />
          </button>
        </div>
      )}

      {/* Mavi AppBuilder Copilot Panel - Dedicated to Gluestack Canvas Builder */}
      <BuilderCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onApplyCommand={handleAiCommand}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        hasSnapshot={!!preCopilotSnapshot}
        selectedWidget={selectedComponent}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        context={{
          builderMode: 'GLUESTACK_MOBILE',
          platform: 'mobile',
          currentStepName: currentScreen?.title,
          currentStepId: currentScreenId,
          widgets: screenComponents.map(w => ({
            id: w.id,
            type: w.type,
            name: w.props?.label || w.props?.text || w.props?.title || w.type,
            displayName: w.props?.label || w.props?.text || w.props?.title || w.type,
            props: w.props,
            triggers: (w.triggers || []).map(t => ({ id: t.id, name: t.name, event: t.event, clauseCount: (t.clauses || []).length }))
          })),
          allScreensWidgets: screens.map(s => ({
            screenTitle: s.title,
            screenId: s.id,
            widgets: (s.components || []).map(w => ({
              id: w.id,
              type: w.type,
              name: w.props?.label || w.props?.text || w.props?.title || w.type,
              displayName: w.props?.label || w.props?.text || w.props?.title || w.type,
              props: w.props,
              triggers: (w.triggers || []).map(t => ({ id: t.id, name: t.name, event: t.event, clauseCount: (t.clauses || []).length }))
            }))
          })),
          variables: variables || [],
          triggers: currentScreen?.triggers || [],
          tables: tables || [],
          steps: screens.map(s => ({ id: s.id, title: s.title, components: s.components || [] })),
          recordPlaceholders: recordPlaceholders || [],
          appName: appName || '',
          availableWidgets: [
            'Button', 'Dropdown', 'FAB', 'Input', 'Textarea', 'Select', 'Checkbox', 'Switch', 'Form',
            'QRCodeScanner', 'VideoPlayer', 'Camera', 'Card', 'Accordion', 'Badge', 'Avatar', 'Table',
            'Alert', 'Toast', 'Progress', 'Spinner', 'Tabs', 'Modal', 'Drawer', 'Text', 'Timer', 'Counter'
          ]
        }}
      />
    </div>
  );
}
