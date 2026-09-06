/**
 * industrialTableTemplates.js
 * Master Industrial Table Templates for MaviCore MES (ISA-95 compliant)
 * Comprehensive set of 12 production-ready manufacturing tables with complete field schemas,
 * data types, and realistic sample records ready to be consumed by App Builder, GlueStack, and Sandbox.
 */

import { createTable, addTableRecord, getTables } from './supabaseTablesDB.js';

export const INDUSTRIAL_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'production', label: 'Produksi & Shopfloor' },
  { id: 'maintenance', label: 'Mesin, OEE & Maintenance' },
  { id: 'quality', label: 'Quality Assurance (QA/QC)' },
  { id: 'warehouse', label: 'Warehouse, BOM & Traceability' },
  { id: 'ehs', label: 'K3 & Keselamatan Kerja (EHS)' }
];

export const INDUSTRIAL_TABLE_TEMPLATES = [
  // ── 1. Produksi & Shopfloor ──────────────────────────────────────────────
  {
    id: 'work_orders',
    name: 'work_orders',
    label: 'Work Orders (Surat Perintah Kerja)',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    description: 'Pelacakan Surat Perintah Kerja (SPK), target kuantitas, status lini produksi, dan tanggal tenggat.',
    icon: 'FileText',
    recommendedApps: ['Work Order Dispatcher', 'Operator Terminal', 'Shopfloor Progress Tracker'],
    fields: [
      { name: 'order_number', label: 'No. SPK / WO', type: 'text', required: true },
      { name: 'part_name', label: 'Nama Part / Produk', type: 'text', required: true },
      { name: 'part_number', label: 'Part Number (SKU)', type: 'text', required: true },
      { name: 'line_name', label: 'Lini Produksi', type: 'text', required: true },
      { name: 'target_quantity', label: 'Target Produksi (Pcs)', type: 'number', required: true },
      { name: 'completed_quantity', label: 'Selesai Bagus (Pcs)', type: 'number', required: true },
      { name: 'scrap_quantity', label: 'Scrap / Reject (Pcs)', type: 'number', required: false },
      { name: 'status', label: 'Status Produksi', type: 'text', required: true },
      { name: 'supervisor', label: 'Supervisor Shift', type: 'text', required: false },
      { name: 'due_date', label: 'Batas Waktu (Due Date)', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        order_number: 'WO-2026-09-001',
        part_name: 'Precision Flange SS316',
        part_number: 'PART-FLANGE-001',
        line_name: 'Machining Line 1',
        target_quantity: 500,
        completed_quantity: 480,
        scrap_quantity: 4,
        status: 'RUNNING',
        supervisor: 'Budi Santoso',
        due_date: '2026-09-08 17:00:00'
      },
      {
        order_number: 'WO-2026-09-002',
        part_name: 'Hex Bolt M12x50 High Tensile',
        part_number: 'PART-BOLT-M12',
        line_name: 'Stamping Line A',
        target_quantity: 2000,
        completed_quantity: 2000,
        scrap_quantity: 12,
        status: 'COMPLETED',
        supervisor: 'Ahmad Fauzi',
        due_date: '2026-09-06 14:00:00'
      },
      {
        order_number: 'WO-2026-09-003',
        part_name: 'Control Valve Housing AlSi10Mg',
        part_number: 'PART-HOUSING-02',
        line_name: 'CNC 5-Axis Cell',
        target_quantity: 150,
        completed_quantity: 65,
        scrap_quantity: 1,
        status: 'RUNNING',
        supervisor: 'Budi Santoso',
        due_date: '2026-09-10 12:00:00'
      },
      {
        order_number: 'WO-2026-09-004',
        part_name: 'Drive Shaft Spline Induction',
        part_number: 'PART-SHAFT-22',
        line_name: 'Heat Treatment Line',
        target_quantity: 400,
        completed_quantity: 0,
        scrap_quantity: 0,
        status: 'PENDING',
        supervisor: 'Siti Rahma',
        due_date: '2026-09-12 18:00:00'
      }
    ]
  },
  {
    id: 'production_logs',
    name: 'production_logs',
    label: 'Production Logs (Scan Output Lot)',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    description: 'Catatan transaksi output operator per lot, kuantitas OK, reject, dan waktu siklus.',
    icon: 'Layers',
    recommendedApps: ['Barcode Scan HMI', 'Hourly Output Tracker', 'Traceability Log'],
    fields: [
      { name: 'lot_number', label: 'Nomor Lot / Batch', type: 'text', required: true },
      { name: 'work_order_number', label: 'No. Work Order', type: 'text', required: true },
      { name: 'operator_name', label: 'Nama Operator', type: 'text', required: true },
      { name: 'station_name', label: 'Stasiun Kerja / Mesin', type: 'text', required: true },
      { name: 'good_quantity', label: 'Qty OK (Pcs)', type: 'number', required: true },
      { name: 'rejected_quantity', label: 'Qty Reject (Pcs)', type: 'number', required: true },
      { name: 'cycle_time_seconds', label: 'Cycle Time (Detik)', type: 'number', required: false },
      { name: 'log_time', label: 'Waktu Input', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        lot_number: 'LOT-20260906-001',
        work_order_number: 'WO-2026-09-001',
        operator_name: 'Joko Widodo',
        station_name: 'CNC Milling 01',
        good_quantity: 50,
        rejected_quantity: 1,
        cycle_time_seconds: 42,
        log_time: '2026-09-06 09:15:00'
      },
      {
        lot_number: 'LOT-20260906-002',
        work_order_number: 'WO-2026-09-001',
        operator_name: 'Joko Widodo',
        station_name: 'CNC Milling 01',
        good_quantity: 48,
        rejected_quantity: 0,
        cycle_time_seconds: 40,
        log_time: '2026-09-06 10:20:00'
      },
      {
        lot_number: 'LOT-20260906-003',
        work_order_number: 'WO-2026-09-002',
        operator_name: 'Agus Pratama',
        station_name: 'Stamping Press 200T',
        good_quantity: 250,
        rejected_quantity: 3,
        cycle_time_seconds: 8,
        log_time: '2026-09-06 11:00:00'
      }
    ]
  },
  {
    id: 'shift_handovers',
    name: 'shift_handovers',
    label: 'Shift Handovers (Serah Terima Shift)',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    description: 'Catatan serah terima shift operasional antar supervisor dan leader lantai pabrik.',
    icon: 'RotateCcw',
    recommendedApps: ['Shift Handover Digital Log', 'Daily Standup Dashboard'],
    fields: [
      { name: 'shift_name', label: 'Nama Shift', type: 'text', required: true },
      { name: 'outgoing_supervisor', label: 'Supervisor Shift Selesai', type: 'text', required: true },
      { name: 'incoming_supervisor', label: 'Supervisor Shift Penerima', type: 'text', required: true },
      { name: 'line_name', label: 'Lini / Area', type: 'text', required: true },
      { name: 'production_output_summary', label: 'Ringkasan Output', type: 'text', required: true },
      { name: 'pending_issues', label: 'Isu / Kendala Berjalan', type: 'text', required: false },
      { name: 'safety_incidents', label: 'Catatan K3 / Safety', type: 'text', required: false },
      { name: 'handover_time', label: 'Waktu Handover', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        shift_name: 'Shift 1 (07:00 - 15:30)',
        outgoing_supervisor: 'Budi Santoso',
        incoming_supervisor: 'Ahmad Fauzi',
        line_name: 'Machining Line 1',
        production_output_summary: 'Target 500 pcs, tercapai 480 pcs. Line lancar.',
        pending_issues: 'Coolant level CNC-02 agak rendah, perlu di-top up saat pergantian tool.',
        safety_incidents: 'Nihil insiden (Zero Accident)',
        handover_time: '2026-09-06 15:25:00'
      }
    ]
  },

  // ── 2. Mesin, OEE & Maintenance ──────────────────────────────────────────
  {
    id: 'machines_equipment',
    name: 'machines_equipment',
    label: 'Machines & Equipment (Aset Mesin)',
    category: 'maintenance',
    categoryLabel: 'Mesin, OEE & Maintenance',
    description: 'Master data aset mesin, stasiun kerja, status operasional, dan target OEE.',
    icon: 'Sliders',
    recommendedApps: ['Machine Status Board', 'Andon Display', 'OEE Live Monitor'],
    fields: [
      { name: 'machine_code', label: 'Kode Mesin', type: 'text', required: true },
      { name: 'machine_name', label: 'Nama Mesin', type: 'text', required: true },
      { name: 'brand_model', label: 'Merk & Tipe', type: 'text', required: false },
      { name: 'location_line', label: 'Lokasi Lini', type: 'text', required: true },
      { name: 'status', label: 'Status Saat Ini', type: 'text', required: true },
      { name: 'oee_target_percent', label: 'Target OEE (%)', type: 'number', required: true },
      { name: 'current_oee_percent', label: 'OEE Terkini (%)', type: 'number', required: false },
      { name: 'last_maintenance_date', label: 'Perawatan Terakhir', type: 'datetime', required: false }
    ],
    sampleRows: [
      {
        machine_code: 'CNC-MCH-01',
        machine_name: '5-Axis Machining Center',
        brand_model: 'DMG MORI DMU 50',
        location_line: 'Machining Line 1',
        status: 'RUNNING',
        oee_target_percent: 85,
        current_oee_percent: 88.4,
        last_maintenance_date: '2026-08-28 09:00:00'
      },
      {
        machine_code: 'LATHE-02',
        machine_name: 'CNC Turning Center',
        brand_model: 'Mazak Quick Turn 250',
        location_line: 'Turning Cell A',
        status: 'IDLE',
        oee_target_percent: 80,
        current_oee_percent: 74.2,
        last_maintenance_date: '2026-09-01 14:00:00'
      },
      {
        machine_code: 'PRESS-200T',
        machine_name: 'Hydraulic Stamping Press',
        brand_model: 'Komatsu H1F-200',
        location_line: 'Press Shop',
        status: 'RUNNING',
        oee_target_percent: 90,
        current_oee_percent: 91.8,
        last_maintenance_date: '2026-08-15 08:30:00'
      }
    ]
  },
  {
    id: 'downtime_events',
    name: 'downtime_events',
    label: 'Downtime Events (Log Kerusakan Mesin)',
    category: 'maintenance',
    categoryLabel: 'Mesin, OEE & Maintenance',
    description: 'Pencatatan kejadian mesin mati, klasifikasi penyebab (Breakdown, Setup, Material, Waiting).',
    icon: 'Clock',
    recommendedApps: ['Andon Downtime Logger', 'Availability Loss Pareto'],
    fields: [
      { name: 'machine_code', label: 'Kode Mesin', type: 'text', required: true },
      { name: 'category', label: 'Kategori Downtime', type: 'text', required: true },
      { name: 'reason', label: 'Penyebab / Gejala', type: 'text', required: true },
      { name: 'duration_minutes', label: 'Durasi (Menit)', type: 'number', required: true },
      { name: 'operator_reported', label: 'Pelapor', type: 'text', required: true },
      { name: 'technician_assigned', label: 'Teknisi Penanganan', type: 'text', required: false },
      { name: 'action_taken', label: 'Tindakan Perbaikan', type: 'text', required: false },
      { name: 'start_time', label: 'Waktu Mulai', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        machine_code: 'CNC-MCH-01',
        category: 'SETUP_CHANGE',
        reason: 'Penggantian chuck dan kalibrasi probe',
        duration_minutes: 25,
        operator_reported: 'Joko Widodo',
        technician_assigned: 'Hendra Setiawan',
        action_taken: 'Setup selesai, parameter zeroing verified',
        start_time: '2026-09-06 08:00:00'
      },
      {
        machine_code: 'LATHE-02',
        category: 'TOOL_BREAKAGE',
        reason: 'Insert carbide patah saat roughing',
        duration_minutes: 18,
        operator_reported: 'Ahmad Fauzi',
        technician_assigned: 'Hendra Setiawan',
        action_taken: 'Ganti insert Sandvik WNMG 080408, periksa spindle runout',
        start_time: '2026-09-06 13:30:00'
      }
    ]
  },
  {
    id: 'maintenance_orders',
    name: 'maintenance_orders',
    label: 'Maintenance Orders (PM & CM Work Order)',
    category: 'maintenance',
    categoryLabel: 'Mesin, OEE & Maintenance',
    description: 'Perintah kerja pemeliharaan preventif (Preventive) dan perbaikan darurat (Corrective).',
    icon: 'Shield',
    recommendedApps: ['Maintenance Ticket System', 'Preventive Maintenance Scheduler'],
    fields: [
      { name: 'wo_number', label: 'No. Maintenance WO', type: 'text', required: true },
      { name: 'machine_code', label: 'Mesin', type: 'text', required: true },
      { name: 'type', label: 'Tipe (PM / CM)', type: 'text', required: true },
      { name: 'description', label: 'Deskripsi Pekerjaan', type: 'text', required: true },
      { name: 'priority', label: 'Prioritas (HIGH/MED/LOW)', type: 'text', required: true },
      { name: 'status', label: 'Status', type: 'text', required: true },
      { name: 'technician', label: 'Teknisi Penanggung Jawab', type: 'text', required: false },
      { name: 'scheduled_date', label: 'Jadwal Pelaksanaan', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        wo_number: 'PM-2026-09-01',
        machine_code: 'PRESS-200T',
        type: 'PREVENTIVE',
        description: 'Pengecekan oli hidrolik, saringan filter, dan uji tekanan akumulator',
        priority: 'MEDIUM',
        status: 'SCHEDULED',
        technician: 'Hendra Setiawan',
        scheduled_date: '2026-09-12 08:00:00'
      },
      {
        wo_number: 'CM-2026-09-02',
        machine_code: 'CNC-MCH-01',
        type: 'CORRECTIVE',
        description: 'Vibrasi abnormal pada spindle saat kecepatan > 8000 RPM',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        technician: 'Rudi Hartono',
        scheduled_date: '2026-09-06 10:00:00'
      }
    ]
  },

  // ── 3. Quality Assurance (QA/QC) ─────────────────────────────────────────
  {
    id: 'qa_checksheets',
    name: 'qa_checksheets',
    label: 'QA Checksheets (Inspeksi Mutu)',
    category: 'quality',
    categoryLabel: 'Quality Assurance (QA/QC)',
    description: 'Lembar inspeksi mutu produk, pengecekan dimensi toleransi, dan verifikasi visual QC.',
    icon: 'CheckSquare',
    recommendedApps: ['Digital QC Inspection HMI', 'Incoming QA Station', 'Outgoing Quality Gate'],
    fields: [
      { name: 'checksheet_number', label: 'No. Lembar QC', type: 'text', required: true },
      { name: 'part_number', label: 'Part Number', type: 'text', required: true },
      { name: 'lot_number', label: 'No. Lot / Batch', type: 'text', required: true },
      { name: 'inspector_name', label: 'Nama Inspector', type: 'text', required: true },
      { name: 'sample_size', label: 'Jumlah Sampel (Pcs)', type: 'number', required: true },
      { name: 'dimension_check', label: 'Kesesuaian Dimensi (OK/NG)', type: 'text', required: true },
      { name: 'visual_check', label: 'Kondisi Visual (OK/NG)', type: 'text', required: true },
      { name: 'result_status', label: 'Keputusan (PASS/FAIL/HOLD)', type: 'text', required: true },
      { name: 'notes', label: 'Catatan Temuan', type: 'text', required: false },
      { name: 'inspection_time', label: 'Waktu Inspeksi', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        checksheet_number: 'QC-2026-0906-01',
        part_number: 'PART-FLANGE-001',
        lot_number: 'LOT-20260906-001',
        inspector_name: 'Siti Rahma',
        sample_size: 5,
        dimension_check: 'OK',
        visual_check: 'OK',
        result_status: 'PASS',
        notes: 'Diameter lubang baut 12.02 mm (toleransi +/- 0.05 mm)',
        inspection_time: '2026-09-06 10:45:00'
      },
      {
        checksheet_number: 'QC-2026-0906-02',
        part_number: 'PART-BOLT-M12',
        lot_number: 'LOT-20260906-003',
        inspector_name: 'Siti Rahma',
        sample_size: 20,
        dimension_check: 'OK',
        visual_check: 'NG',
        result_status: 'HOLD',
        notes: 'Ditemukan 2 pcs ulir tergores (burrs) sebelum plating',
        inspection_time: '2026-09-06 11:30:00'
      }
    ]
  },
  {
    id: 'defect_records',
    name: 'defect_records',
    label: 'Defect Records (Pareto NG & Scrap)',
    category: 'quality',
    categoryLabel: 'Quality Assurance (QA/QC)',
    description: 'Database pencatatan cacat produk, kode defect, kuantitas reject, dan analisis akar masalah.',
    icon: 'AlertCircle',
    recommendedApps: ['Defect Logger Touchscreen', 'Pareto Defect Dashboard'],
    fields: [
      { name: 'defect_code', label: 'Kode Defect', type: 'text', required: true },
      { name: 'defect_type', label: 'Jenis Cacat', type: 'text', required: true },
      { name: 'part_number', label: 'Part Terkait', type: 'text', required: true },
      { name: 'quantity_defective', label: 'Jumlah Cacat (Pcs)', type: 'number', required: true },
      { name: 'station_found', label: 'Stasiun Ditemukan', type: 'text', required: true },
      { name: 'root_cause', label: 'Penyebab Utama (Root Cause)', type: 'text', required: false },
      { name: 'corrective_action', label: 'Tindakan Koreksi', type: 'text', required: false },
      { name: 'reported_at', label: 'Waktu Pencatatan', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        defect_code: 'DEF-SCRATCH',
        defect_type: 'Surface Scratch / Baret',
        part_number: 'PART-FLANGE-001',
        quantity_defective: 3,
        station_found: 'Final Inspection',
        root_cause: 'Jig handling operator tidak dilapisi karet pelindung',
        corrective_action: 'Lapisi fixture dengan silicone pad',
        reported_at: '2026-09-06 11:15:00'
      },
      {
        defect_code: 'DEF-BURRS',
        defect_type: 'Burrs / Geram Sisa Pemotongan',
        part_number: 'PART-BOLT-M12',
        quantity_defective: 8,
        station_found: 'Threading Station',
        root_cause: 'Mata tap sudah aus setelah 4000 siklus',
        corrective_action: 'Ganti tap baru dan sesuaikan jadwal preventive',
        reported_at: '2026-09-06 13:40:00'
      }
    ]
  },

  // ── 4. Warehouse, BOM & Traceability ─────────────────────────────────────
  {
    id: 'inventory_parts',
    name: 'inventory_parts',
    label: 'Inventory Parts (Master Stok Barang)',
    category: 'warehouse',
    categoryLabel: 'Warehouse, BOM & Traceability',
    description: 'Master stok material mentah (Raw), setengah jadi (WIP), dan barang jadi (FG).',
    icon: 'Database',
    recommendedApps: ['Stock Level Monitor', 'Material Requisition HMI', 'Inventory Barcode Audit'],
    fields: [
      { name: 'part_number', label: 'Part Number (SKU)', type: 'text', required: true },
      { name: 'part_name', label: 'Nama Barang / Komponen', type: 'text', required: true },
      { name: 'category', label: 'Kategori (RAW / WIP / FG)', type: 'text', required: true },
      { name: 'current_stock', label: 'Stok Terkini', type: 'number', required: true },
      { name: 'min_stock', label: 'Stok Minimum (Reorder)', type: 'number', required: true },
      { name: 'unit_of_measure', label: 'Satuan (Pcs/Kg/M)', type: 'text', required: true },
      { name: 'warehouse_bin', label: 'Lokasi Rak / Bin', type: 'text', required: true },
      { name: 'unit_cost', label: 'Harga Satuan (IDR)', type: 'number', required: false }
    ],
    sampleRows: [
      {
        part_number: 'PART-FLANGE-001',
        part_name: 'Precision Flange SS316',
        category: 'WIP',
        current_stock: 350,
        min_stock: 100,
        unit_of_measure: 'Pcs',
        warehouse_bin: 'RACK-B-04-02',
        unit_cost: 195000
      },
      {
        part_number: 'PART-BOLT-M12',
        part_name: 'Hex Bolt M12x50 Steel 8.8',
        category: 'RAW',
        current_stock: 4500,
        min_stock: 1000,
        unit_of_measure: 'Pcs',
        warehouse_bin: 'BIN-A-01-05',
        unit_cost: 12500
      },
      {
        part_number: 'RAW-ROD-SS316-50',
        part_name: 'Round Bar SS316 Dia 50mm',
        category: 'RAW',
        current_stock: 85,
        min_stock: 20,
        unit_of_measure: 'Batang (6m)',
        warehouse_bin: 'RACK-STEEL-01',
        unit_cost: 1850000
      }
    ]
  },
  {
    id: 'material_movements',
    name: 'material_movements',
    label: 'Material Movements (Mutasi Gudang)',
    category: 'warehouse',
    categoryLabel: 'Warehouse, BOM & Traceability',
    description: 'Catatan keluar masuk material: Inbound penerimaan supplier, issue ke lantai produksi, dan transfer.',
    icon: 'ArrowRight',
    recommendedApps: ['Warehouse Inbound HMI', 'Shopfloor Material Issue'],
    fields: [
      { name: 'movement_id', label: 'No. Transaksi Mutasi', type: 'text', required: true },
      { name: 'movement_type', label: 'Tipe (INBOUND/ISSUE/TRANSFER)', type: 'text', required: true },
      { name: 'part_number', label: 'Part Number', type: 'text', required: true },
      { name: 'quantity', label: 'Jumlah', type: 'number', required: true },
      { name: 'from_location', label: 'Dari Lokasi', type: 'text', required: true },
      { name: 'to_location', label: 'Tujuan Lokasi', type: 'text', required: true },
      { name: 'operator_pic', label: 'Petugas Gudang', type: 'text', required: true },
      { name: 'timestamp', label: 'Waktu Perpindahan', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        movement_id: 'MOV-20260906-01',
        movement_type: 'ISSUE',
        part_number: 'PART-BOLT-M12',
        quantity: 500,
        from_location: 'BIN-A-01-05',
        to_location: 'Stamping Line A',
        operator_pic: 'Dani Darmawan',
        timestamp: '2026-09-06 08:30:00'
      },
      {
        movement_id: 'MOV-20260906-02',
        movement_type: 'INBOUND',
        part_number: 'RAW-ROD-SS316-50',
        quantity: 20,
        from_location: 'Supplier PT Steelindo',
        to_location: 'RACK-STEEL-01',
        operator_pic: 'Dani Darmawan',
        timestamp: '2026-09-06 10:00:00'
      }
    ]
  },
  {
    id: 'bill_of_materials',
    name: 'bill_of_materials',
    label: 'Bill of Materials (BOM Structure)',
    category: 'warehouse',
    categoryLabel: 'Warehouse, BOM & Traceability',
    description: 'Struktur resep komponen per rakitan produk untuk perencanaan kebutuhan material (MRP).',
    icon: 'BookOpen',
    recommendedApps: ['BOM Viewer & Costing', 'Material Requirement Planning Calculator'],
    fields: [
      { name: 'parent_assembly', label: 'Produk Induk (Parent)', type: 'text', required: true },
      { name: 'component_part', label: 'Komponen (Child)', type: 'text', required: true },
      { name: 'quantity_required', label: 'Kebutuhan per Unit', type: 'number', required: true },
      { name: 'unit', label: 'Satuan', type: 'text', required: true },
      { name: 'scrap_factor_percent', label: 'Toleransi Scrap (%)', type: 'number', required: false },
      { name: 'revision_level', label: 'Level Revisi Engineering', type: 'text', required: true }
    ],
    sampleRows: [
      {
        parent_assembly: 'VALVE-ASSY-316',
        component_part: 'PART-FLANGE-001',
        quantity_required: 2,
        unit: 'Pcs',
        scrap_factor_percent: 1.5,
        revision_level: 'REV-C'
      },
      {
        parent_assembly: 'VALVE-ASSY-316',
        component_part: 'PART-BOLT-M12',
        quantity_required: 8,
        unit: 'Pcs',
        scrap_factor_percent: 2.0,
        revision_level: 'REV-C'
      },
      {
        parent_assembly: 'VALVE-ASSY-316',
        component_part: 'SEAL-O-RING-NBR',
        quantity_required: 2,
        unit: 'Pcs',
        scrap_factor_percent: 1.0,
        revision_level: 'REV-C'
      }
    ]
  },

  // ── 5. K3 & Keselamatan Kerja (EHS) ──────────────────────────────────────
  {
    id: 'ehs_incidents',
    name: 'ehs_incidents',
    label: 'EHS Safety Incidents (Laporan K3)',
    category: 'ehs',
    categoryLabel: 'K3 & Keselamatan Kerja (EHS)',
    description: 'Pencatatan insiden K3 pabrik: Near-miss, First Aid, Property Damage, dan investigasi tindakan pencegahan.',
    icon: 'Shield',
    recommendedApps: ['Safety Incident Reporter', 'EHS Plant Dashboard'],
    fields: [
      { name: 'report_number', label: 'No. Laporan K3', type: 'text', required: true },
      { name: 'incident_type', label: 'Jenis Insiden (NEAR_MISS / FIRST_AID / DAMAGE)', type: 'text', required: true },
      { name: 'location_area', label: 'Lokasi Kejadian', type: 'text', required: true },
      { name: 'description', label: 'Kronologi Kejadian', type: 'text', required: true },
      { name: 'reported_by', label: 'Pelapor', type: 'text', required: true },
      { name: 'severity_level', label: 'Tingkat Keparahan (LOW/MED/HIGH)', type: 'text', required: true },
      { name: 'corrective_action', label: 'Tindakan Pencegahan (CAPA)', type: 'text', required: false },
      { name: 'status', label: 'Status Investigasi', type: 'text', required: true },
      { name: 'incident_time', label: 'Waktu Kejadian', type: 'datetime', required: true }
    ],
    sampleRows: [
      {
        report_number: 'EHS-2026-001',
        incident_type: 'NEAR_MISS',
        location_area: 'Machining Line 1 Gangway',
        description: 'Tetesan oli coolant di lantai berpotensi menyebabkan operator terpeleset.',
        reported_by: 'Budi Santoso',
        severity_level: 'LOW',
        corrective_action: 'Langsung dibersihkan dengan oil absorbent powder dan dipasang sign licin.',
        status: 'RESOLVED',
        incident_time: '2026-09-05 14:10:00'
      }
    ]
  }
];

/**
 * Get all available industrial table templates
 */
export function getIndustrialTemplates() {
  return INDUSTRIAL_TABLE_TEMPLATES;
}

/**
 * Get templates filtered by category
 */
export function getTemplatesByCategory(category = 'all') {
  if (!category || category === 'all') {
    return INDUSTRIAL_TABLE_TEMPLATES;
  }
  return INDUSTRIAL_TABLE_TEMPLATES.filter(t => t.category === category);
}

/**
 * Instantiate a single industrial table template into MaviCore
 * Creates table in app_tables and populates its sample records
 */
export async function instantiateTableFromTemplate(templateId) {
  const template = INDUSTRIAL_TABLE_TEMPLATES.find(t => t.id === templateId || t.name === templateId);
  if (!template) {
    throw new Error(`Template "${templateId}" tidak ditemukan.`);
  }

  // Check if table with this name already exists
  const existingTables = await getTables();
  const exists = existingTables.find(t => t.name.toLowerCase() === template.name.toLowerCase());
  if (exists) {
    throw new Error(`Tabel "${template.name}" sudah ada di database.`);
  }

  // 1. Create Table in Supabase / Local Table DB
  const tableData = {
    name: template.name,
    label: template.label,
    description: template.description,
    fields: template.fields
  };

  const createdTable = await createTable(tableData);
  const targetTableId = createdTable?.id || template.name;

  // 2. Populate Sample Records if provided
  if (template.sampleRows && template.sampleRows.length > 0) {
    for (const row of template.sampleRows) {
      try {
        await addTableRecord(targetTableId, row);
      } catch (recErr) {
        console.warn(`[industrialTemplates] Could not insert sample row into ${template.name}:`, recErr);
      }
    }
  }

  return {
    table: createdTable,
    template
  };
}

/**
 * Batch instantiate all 12 industrial templates into MaviCore
 */
export async function instantiateAllIndustrialTemplates() {
  const existingTables = await getTables();
  const existingNames = new Set(existingTables.map(t => t.name.toLowerCase()));
  const results = {
    installed: [],
    skipped: []
  };

  for (const template of INDUSTRIAL_TABLE_TEMPLATES) {
    if (existingNames.has(template.name.toLowerCase())) {
      results.skipped.push(template.name);
      continue;
    }

    try {
      await instantiateTableFromTemplate(template.id);
      results.installed.push(template.name);
    } catch (err) {
      console.warn(`[industrialTemplates] Failed installing template ${template.name}:`, err);
    }
  }

  return results;
}
