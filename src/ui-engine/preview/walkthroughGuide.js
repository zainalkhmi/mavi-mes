/**
 * Visual Walkthrough Guide Controller
 * Provides step-by-step interactive spotlight highlighting for UI operations
 */

export const INSPECTION_WALKTHROUGH_STEPS = [
  {
    step: 1,
    title: 'Buka Menu Inspeksi',
    description: 'Pilih modul inspeksi QC pada navigasi mobile untuk membuka antrean part.',
    targetSelector: '[data-tour="header"]'
  },
  {
    step: 2,
    title: 'Pilih Part / Lot Kerja',
    description: 'Periksa nomor part (SN) dan lot produksi yang aktif di stasiun kerja.',
    targetSelector: '[data-tour="part-info"]'
  },
  {
    step: 3,
    title: 'Lihat Blueprint & Toleransi CAD',
    description: 'Buka gambar CAD preview untuk melihat standar nominal dan batas toleransi.',
    targetSelector: '[data-tour="drawing"]'
  },
  {
    step: 4,
    title: 'Masukkan Nilai Pengukuran',
    description: 'Ketik hasil pengukuran caliper atau micrometer pada kolom dimensi aktual.',
    targetSelector: '[data-tour="measurement"]'
  },
  {
    step: 5,
    title: 'Tentukan Keputusan OK / NG',
    description: 'Pilih tombol hijau OK jika part masuk toleransi, atau tombol merah NG jika cacat.',
    targetSelector: '[data-tour="decision"]'
  },
  {
    step: 6,
    title: 'Lampirkan Foto Bukti',
    description: 'Ambil foto bukti visual menggunakan kamera perangkat jika diperlukan audit mutu.',
    targetSelector: '[data-tour="photo"]'
  },
  {
    step: 7,
    title: 'Kirim Hasil Inspeksi',
    description: 'Ketuk tombol Kirim Hasil Inspeksi untuk menyimpan data ke database server MaviCore.',
    targetSelector: '[data-tour="submit"]'
  }
];
