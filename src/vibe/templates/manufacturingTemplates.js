/**
 * manufacturingTemplates.js
 * Pre-configured prompt and code templates for industrial manufacturing use cases:
 * - Digital Checksheet
 * - Digital Inspection
 * - Quality Inspection
 * - OEE Dashboard
 * - Production Monitoring
 * - Inventory & Stock
 * - Kanban Management
 * - Preventive Maintenance
 * - Standard Operating Procedure (SOP)
 * - Multi-stage Approval Workflow
 * - Executive Manufacturing Dashboard
 */

export const MANUFACTURING_TEMPLATES = [
  {
    id: 'digital_checksheet',
    title: 'Digital Checksheet',
    category: 'Shop Floor',
    icon: 'ClipboardList',
    description: 'Checksheet harian operator mesin: pembersihan, pelumasan, pengetatan, dan verifikasi parameter awal shift.',
    prompt: 'Buatkan aplikasi Digital Checksheet harian untuk operator stamping press: checklist 5 poin keselamatan, input tekanan oli, verifikasi suhu bearing, dan tombol kirim dengan konfirmasi shift.'
  },
  {
    id: 'digital_inspection',
    title: 'Digital Inspection',
    category: 'Quality Control',
    icon: 'CheckCircle2',
    description: 'Inspeksi dimensi dan toleransi part menggunakan caliper/micrometer dengan evaluasi otomatis PASS/FAIL.',
    prompt: 'Buatkan aplikasi Digital Inspection untuk stasiun machining: inspeksi diameter lubang (standar 25.0 ± 0.1 mm), kedalaman milling (standar 12.5 ± 0.05 mm), evaluasi PASS/FAIL otomatis, dan catat ke tabel MaviCore.'
  },
  {
    id: 'quality_inspection',
    title: 'Quality Inspection (AQL Sampling)',
    category: 'Quality Control',
    icon: 'ShieldCheck',
    description: 'Inspeksi sampling mutu AQL dengan klasifikasi cacat (Critical, Major, Minor), foto bukti NG, dan kesimpulan lot.',
    prompt: 'Buatkan aplikasi Quality Inspection AQL sampling: input lot number, jumlah sample 80 pcs, counter defect Major/Minor, lampiran foto defect, dan rekomendasi Release Lot atau Hold Lot.'
  },
  {
    id: 'oee_dashboard',
    title: 'OEE Dashboard Real-Time',
    category: 'Management',
    icon: 'Activity',
    description: 'Visualisasi Overall Equipment Effectiveness (Availability, Performance, Quality) dengan radial gauge dan timeline downtime.',
    prompt: 'Buatkan aplikasi OEE Dashboard real-time untuk lini perakitan: gauge meter OEE %, Availability %, Performance %, Quality %, timeline status mesin (Running, Breakdown, Setup), dan grafik tren jam per jam.'
  },
  {
    id: 'production_monitoring',
    title: 'Production Monitoring (Andon)',
    category: 'Shop Floor',
    icon: 'Gauge',
    description: 'Layar Andon monitoring target vs aktual produksi, cycle time, kecepatan lini, dan tombol panggilan supervisor/maintenance.',
    prompt: 'Buatkan aplikasi Production Monitoring Andon: display target shift (1500 pcs), aktual tercapai, selisih part (+/-), status Andon warna (Hijau/Kuning/Merah), dan tombol darurat panggil teknisi maintenance.'
  },
  {
    id: 'inventory_stock',
    title: 'Inventory & Bin Management',
    category: 'Warehouse',
    icon: 'Layers',
    description: 'Pencatatan stok part, transfer antar bin lokasi rak, dan peringatan batas minimum stok (Min-Max Alert).',
    prompt: 'Buatkan aplikasi Inventory & Bin Management: daftar komponen part, stok saat ini, tombol penyesuaian stok (+/-), input nomor bin lokasi, dan warning merah jika stok di bawah minimum 50 unit.'
  },
  {
    id: 'kanban_board',
    title: 'Electronic Kanban (e-Kanban)',
    category: 'Warehouse',
    icon: 'Sliders',
    description: 'Papan visual kartu Kanban digital: To Do, In Progress, QA Testing, Done dengan nomor kartu dan lot.',
    prompt: 'Buatkan aplikasi e-Kanban board interaktif dengan kolom To Do, Machining, QC Inspection, Ready to Ship, kartu Kanban yang bisa digeser atau diubah statusnya, dan auto-save ke database MaviCore.'
  },
  {
    id: 'preventive_maintenance',
    title: 'Preventive Maintenance (PM)',
    category: 'Maintenance',
    icon: 'Wrench',
    description: 'Jadwal dan instruksi pemeliharaan berkala mesin: cek motor, ganti oli hidrolik, kalibrasi sensor, tanda tangan teknisi.',
    prompt: 'Buatkan aplikasi Preventive Maintenance: daftar task pemeliharaan mesin CNC bulanan, checklist komponen yang diganti, input jam kerja spindle, upload catatan teknisi, dan tanda tangan digital pemeliharaan.'
  },
  {
    id: 'digital_sop',
    title: 'Visual SOP & Work Instructions',
    category: 'Training',
    icon: 'FileText',
    description: 'Instruksi kerja standar langkah demi langkah dengan ilustrasi, timer cycle time standar, dan panduan keselamatan PPE.',
    prompt: 'Buatkan aplikasi Visual SOP perakitan gearbox: panduan langkah 1 sampai 5 dengan kartu foto proses, petunjuk keselamatan PPE, stopwatch cycle time per langkah, dan tombol konfirmasi langkah selesai.'
  },
  {
    id: 'approval_workflow',
    title: 'Multi-Stage Approval Workflow',
    category: 'Management',
    icon: 'ShieldCheck',
    description: 'Alur persetujuan bertingkat: Operator request -> Supervisor review -> QC Manager approval dengan status badge.',
    prompt: 'Buatkan aplikasi Approval Workflow untuk izin deviasi produksi: formulir permohonan, riwayat review supervisor, tombol persetujuan bertingkat (Approve / Reject / Rework), dan audit log timestamp.'
  },
  {
    id: 'manufacturing_dashboard',
    title: 'Plant Overview Dashboard',
    category: 'Executive',
    icon: 'BarChart2',
    description: 'Dashboard eksekutif pabrik: matriks status 6 lini produksi, total output harian, defect rate pabrik, dan status energi.',
    prompt: 'Buatkan aplikasi Plant Overview Dashboard: grid status 6 lini produksi pabrik (Lini 1 - 6), kartu KPI total output, rata-rata OEE pabrik, konsumsi daya kW, dan tabel alarm terkini.'
  }
];
