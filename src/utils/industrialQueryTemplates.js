/**
 * industrialQueryTemplates.js
 * Master Industrial SQL Query Templates for MaviCore MES
 * Production-ready queries covering: Production & Shopfloor, Machine OEE & Downtime,
 * Quality & Pareto Defects, Warehouse & BOM Structure, and K3 EHS.
 */

export const INDUSTRIAL_QUERY_CATEGORIES = [
  { id: 'all', label: 'Semua Kategori' },
  { id: 'production', label: 'Produksi & Shopfloor' },
  { id: 'oee', label: 'Mesin, OEE & Downtime' },
  { id: 'quality', label: 'Quality Assurance & Defect' },
  { id: 'warehouse', label: 'Warehouse, Stok & BOM' },
  { id: 'joins', label: 'Multi-Table JOINs & Dashboard' }
];

export const INDUSTRIAL_QUERY_TEMPLATES = [
  // ── 1. Produksi & Shopfloor ──────────────────────────────────────────────
  {
    id: 'wo_progress_summary',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    title: 'Work Order Progress & Completion Rate',
    description: 'Menghitung persentase progres penyelesaian SPK dan mendeteksi pesanan yang mendekati deadline.',
    table: 'work_orders',
    sql: `SELECT 
  order_number AS "No SPK",
  part_name AS "Nama Produk",
  line_name AS "Lini",
  target_quantity AS "Target",
  completed_quantity AS "Selesai OK",
  scrap_quantity AS "Scrap",
  ROUND((completed_quantity * 100.0 / NULLIF(target_quantity, 0)), 1) AS "Progress (%)",
  status AS "Status",
  due_date AS "Batas Waktu"
FROM work_orders
ORDER BY due_date ASC;`
  },
  {
    id: 'operator_performance_yield',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    title: 'Performa Operator & First Pass Yield',
    description: 'Menghitung total output barang bagus, barang scrap, yield rate (%), dan rata-rata cycle time per operator.',
    table: 'production_logs',
    sql: `SELECT 
  operator_name AS "Operator",
  station_name AS "Stasiun Kerja",
  COUNT(lot_number) AS "Total Lot",
  SUM(good_quantity) AS "Total Output OK",
  SUM(rejected_quantity) AS "Total Reject",
  ROUND((SUM(good_quantity) * 100.0 / NULLIF(SUM(good_quantity + rejected_quantity), 0)), 2) AS "Yield Rate (%)",
  ROUND(AVG(cycle_time_seconds), 1) AS "Rata-rata Cycle Time (detik)"
FROM production_logs
GROUP BY operator_name, station_name
ORDER BY "Total Output OK" DESC;`
  },
  {
    id: 'hourly_production_trend',
    category: 'production',
    categoryLabel: 'Produksi & Shopfloor',
    title: 'Tren Output Produksi per Jam',
    description: 'Analisis fluktuasi output produksi per jam untuk mendeteksi bottleneck lini.',
    table: 'production_logs',
    sql: `SELECT 
  DATE_TRUNC('hour', log_time) AS "Jam Produksi",
  COUNT(lot_number) AS "Scan Lot",
  SUM(good_quantity) AS "Output OK",
  SUM(rejected_quantity) AS "Reject"
FROM production_logs
GROUP BY DATE_TRUNC('hour', log_time)
ORDER BY "Jam Produksi" DESC;`
  },

  // ── 2. Mesin, OEE & Downtime ─────────────────────────────────────────────
  {
    id: 'machine_oee_variance',
    category: 'oee',
    categoryLabel: 'Mesin, OEE & Downtime',
    title: 'Status Mesin & OEE vs Target',
    description: 'Monitoring OEE mesin terkini dibandingkan target dengan klasifikasi kesehatan performa.',
    table: 'machines_equipment',
    sql: `SELECT 
  machine_code AS "Kode Mesin",
  machine_name AS "Nama Mesin",
  location_line AS "Lini",
  status AS "Status Mesin",
  oee_target_percent AS "Target OEE (%)",
  current_oee_percent AS "OEE Aktual (%)",
  (current_oee_percent - oee_target_percent) AS "Variansi (+/-)",
  CASE 
    WHEN current_oee_percent >= oee_target_percent THEN 'ABOVE_TARGET'
    WHEN current_oee_percent >= 75 THEN 'ACCEPTABLE'
    ELSE 'CRITICAL_ATTENTION'
  END AS "Status Kesehatan"
FROM machines_equipment
ORDER BY current_oee_percent DESC;`
  },
  {
    id: 'downtime_pareto_analysis',
    category: 'oee',
    categoryLabel: 'Mesin, OEE & Downtime',
    title: 'Pareto Downtime per Kategori & Mesin',
    description: 'Mengidentifikasi kontribusi persentase downtime terbesar untuk diagram Pareto.',
    table: 'downtime_events',
    sql: `SELECT 
  category AS "Kategori Downtime",
  machine_code AS "Mesin",
  COUNT(*) AS "Frekuensi Kejadian",
  SUM(duration_minutes) AS "Total Menit Mati",
  ROUND((SUM(duration_minutes) * 100.0 / NULLIF((SELECT SUM(duration_minutes) FROM downtime_events), 0)), 2) AS "Kontribusi (%)"
FROM downtime_events
GROUP BY category, machine_code
ORDER BY "Total Menit Mati" DESC;`
  },
  {
    id: 'outstanding_maintenance_orders',
    category: 'oee',
    categoryLabel: 'Mesin, OEE & Downtime',
    title: 'Perintah Kerja Perawatan Aktif (PM / CM)',
    description: 'Daftar tiket maintenance preventif dan breakdown darurat yang sedang aktif atau terjadwal.',
    table: 'maintenance_orders',
    sql: `SELECT 
  wo_number AS "No Maintenance WO",
  machine_code AS "Mesin",
  type AS "Tipe (PM/CM)",
  description AS "Deskripsi Pekerjaan",
  priority AS "Prioritas",
  status AS "Status",
  technician AS "Teknisi",
  scheduled_date AS "Jadwal"
FROM maintenance_orders
WHERE status IN ('SCHEDULED', 'IN_PROGRESS')
ORDER BY 
  CASE priority 
    WHEN 'HIGH' THEN 1 
    WHEN 'MEDIUM' THEN 2 
    ELSE 3 
  END,
  scheduled_date ASC;`
  },

  // ── 3. Quality Assurance & Defect ────────────────────────────────────────
  {
    id: 'qa_checksheet_pass_rate',
    category: 'quality',
    categoryLabel: 'Quality Assurance & Defect',
    title: 'Tingkat Kelulusan QC (Pass Rate per Part)',
    description: 'Statistik hasil inspeksi mutu part berdasarkan keputusan PASS, FAIL, dan HOLD.',
    table: 'qa_checksheets',
    sql: `SELECT 
  part_number AS "Part SKU",
  COUNT(checksheet_number) AS "Total Inspeksi",
  SUM(sample_size) AS "Total Sampel Diuji",
  COUNT(*) FILTER (WHERE result_status = 'PASS') AS "Lolos (PASS)",
  COUNT(*) FILTER (WHERE result_status = 'FAIL') AS "Gagal (FAIL)",
  COUNT(*) FILTER (WHERE result_status = 'HOLD') AS "Tahan (HOLD)",
  ROUND((COUNT(*) FILTER (WHERE result_status = 'PASS') * 100.0 / NULLIF(COUNT(*), 0)), 1) AS "Pass Rate (%)"
FROM qa_checksheets
GROUP BY part_number;`
  },
  {
    id: 'pareto_defect_root_cause',
    category: 'quality',
    categoryLabel: 'Quality Assurance & Defect',
    title: 'Pareto Cacat Produk & Tindakan Koreksi (CAPA)',
    description: 'Analisis frekuensi dan kuantitas defect beserta akar masalah dan tindakan korektif.',
    table: 'defect_records',
    sql: `SELECT 
  defect_code AS "Kode Defect",
  defect_type AS "Jenis Cacat",
  station_found AS "Stasiun",
  SUM(quantity_defective) AS "Qty Cacat (Pcs)",
  ROUND((SUM(quantity_defective) * 100.0 / NULLIF((SELECT SUM(quantity_defective) FROM defect_records), 0)), 2) AS "Porsi Cacat (%)",
  root_cause AS "Akar Masalah",
  corrective_action AS "Tindakan Koreksi"
FROM defect_records
GROUP BY defect_code, defect_type, station_found, root_cause, corrective_action
ORDER BY "Qty Cacat (Pcs)" DESC;`
  },

  // ── 4. Warehouse, Stok & BOM ─────────────────────────────────────────────
  {
    id: 'inventory_reorder_alert',
    category: 'warehouse',
    categoryLabel: 'Warehouse, Stok & BOM',
    title: 'Peringatan Stok Kritis (Under Reorder Point)',
    description: 'Mendeteksi material yang stoknya berada di bawah batas minimum beserta valuasi aset.',
    table: 'inventory_parts',
    sql: `SELECT 
  part_number AS "Part Number",
  part_name AS "Nama Barang",
  category AS "Kategori",
  current_stock AS "Stok Saat Ini",
  min_stock AS "Stok Minimum",
  (min_stock - current_stock) AS "Defisit Kuantitas",
  unit_of_measure AS "Satuan",
  warehouse_bin AS "Lokasi Rak",
  unit_cost AS "Harga Satuan (IDR)",
  (current_stock * unit_cost) AS "Valuasi Stok (IDR)"
FROM inventory_parts
WHERE current_stock <= min_stock
ORDER BY (min_stock - current_stock) DESC;`
  },
  {
    id: 'bom_structure_costing',
    category: 'warehouse',
    categoryLabel: 'Warehouse, Stok & BOM',
    title: 'Struktur BOM & Estimasi Biaya Komponen',
    description: 'Menghitung total kebutuhan biaya komponen per rakitan produk dengan memperhitungkan faktor scrap.',
    table: 'bill_of_materials',
    sql: `SELECT 
  bom.parent_assembly AS "Produk Induk (Parent)",
  bom.component_part AS "Part Komponen (Child)",
  ip.part_name AS "Nama Komponen",
  bom.quantity_required AS "Qty Kebutuhan",
  bom.unit AS "Satuan",
  bom.scrap_factor_percent AS "Toleransi Scrap (%)",
  ip.unit_cost AS "Harga Satuan (IDR)",
  ROUND((bom.quantity_required * ip.unit_cost * (1 + COALESCE(bom.scrap_factor_percent, 0) / 100.0)), 2) AS "Estimasi Biaya (IDR)",
  bom.revision_level AS "Revisi"
FROM bill_of_materials bom
LEFT JOIN inventory_parts ip ON bom.component_part = ip.part_number
ORDER BY bom.parent_assembly, "Estimasi Biaya (IDR)" DESC;`
  },

  // ── 5. Multi-Table JOINs & Dashboard ─────────────────────────────────────
  {
    id: 'work_order_traceability_join',
    category: 'joins',
    categoryLabel: 'Multi-Table JOINs & Dashboard',
    title: 'Multi-Table JOIN: SPK ──► Scan Operator ──► Defect',
    description: 'Pelacakan lengkap dari Work Order ke Log Scan Operator dan catatan reject yang terhubung.',
    table: 'work_orders',
    sql: `SELECT 
  wo.order_number AS "No SPK",
  wo.part_name AS "Produk",
  wo.line_name AS "Lini",
  pl.lot_number AS "Nomor Lot",
  pl.operator_name AS "Operator",
  pl.good_quantity AS "Output OK",
  pl.rejected_quantity AS "Reject",
  COALESCE(dr.defect_type, 'Nihil / OK') AS "Jenis Defect",
  pl.log_time AS "Waktu Log"
FROM work_orders wo
JOIN production_logs pl ON pl.work_order_number = wo.order_number
LEFT JOIN defect_records dr ON dr.part_number = wo.part_number
ORDER BY pl.log_time DESC
LIMIT 50;`
  },
  {
    id: 'ehs_safety_summary',
    category: 'joins',
    categoryLabel: 'Multi-Table JOINs & Dashboard',
    title: 'Ringkasan Laporan Keselamatan Kerja (K3 EHS)',
    description: 'Rekapitulasi insiden keselamatan pabrik berdasarkan tingkat keparahan dan status investigasi.',
    table: 'ehs_incidents',
    sql: `SELECT 
  severity_level AS "Tingkat Keparahan",
  incident_type AS "Jenis Insiden",
  location_area AS "Lokasi Area",
  status AS "Status Investigasi",
  COUNT(*) AS "Jumlah Kasus",
  reported_by AS "Pelapor",
  corrective_action AS "Tindakan Koreksi"
FROM ehs_incidents
GROUP BY severity_level, incident_type, location_area, status, reported_by, corrective_action
ORDER BY 
  CASE severity_level 
    WHEN 'HIGH' THEN 1 
    WHEN 'MED' THEN 2 
    ELSE 3 
  END;`
  }
];

export function getIndustrialQueryTemplates() {
  return INDUSTRIAL_QUERY_TEMPLATES;
}

export function getQueriesByCategory(category = 'all') {
  if (!category || category === 'all') {
    return INDUSTRIAL_QUERY_TEMPLATES;
  }
  return INDUSTRIAL_QUERY_TEMPLATES.filter(q => q.category === category);
}
