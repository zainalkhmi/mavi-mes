# MAVI MES — Aturan Jarvis Copilot

## Wajib: Live Testing Setelah Setiap Perubahan Kode

Setelah menyelesaikan pembuatan atau perubahan signifikan pada komponen UI, halaman, atau fitur di MAVI MES, kamu **WAJIB** melakukan live browser testing sebelum melaporkan bahwa pekerjaan selesai.

### Alur Kerja Wajib

```
1. Selesai coding
2. Pastikan dev server berjalan (npm run dev, port 5173)
3. Buka browser → navigasi ke halaman yang diubah
4. Test interaksi: klik, input, submit, navigasi
5. Cek console error dan visual bug
6. Jika ada masalah → perbaiki otomatis ATAU lapor ke user
7. Jika semua OK → lapor hasil test ke user dengan bukti
```

### Kapan Harus Test

Lakukan live browser testing ketika:
- Membuat komponen baru
- Mengubah UI/layout yang sudah ada
- Menambah/mengubah form, tombol, atau input
- Memperbaiki bug UI
- Mengubah routing atau navigasi
- Mengubah state management yang mempengaruhi tampilan

### Apa yang Harus Di-test

1. **Halaman dimuat** — Tidak ada blank page atau crash
2. **Navigasi** — Menu/sidebar bisa diklik dan berpindah halaman
3. **Form & Input** — Bisa diketik, dropdown bisa dipilih
4. **Tombol** — Bisa diklik, ada feedback visual
5. **Console Errors** — Tidak ada error kritis di console
6. **Responsive** — Layout tidak rusak

### Cara Melaporkan Hasil

Setelah testing, berikan laporan ke user dengan format:

```
✅ HASIL LIVE TEST
- Halaman: [nama halaman/route]
- Status: ✅ PASS / ❌ FAIL
- Komponen di-test: [daftar komponen]
- Error ditemukan: [daftar error atau "Tidak ada"]
- Screenshot/Video: [link ke rekaman]
- Rekomendasi: [saran perbaikan jika ada]
```

### Jika Ditemukan Masalah

Ketika menemukan masalah saat live testing:
1. **Minor** (styling, alignment) → Perbaiki langsung, test ulang
2. **Medium** (fungsi tidak bekerja) → Lapor ke user, tawarkan perbaikan
3. **Critical** (crash, blank page) → Perbaiki langsung, test ulang, lapor ke user

### Info Teknis

- Dev server: `http://localhost:5173`
- Framework: React + Vite
- Test tool: Gunakan `browser_subagent` untuk live testing
- E2E framework: Playwright tersedia di `tests/e2e/`
- Rekaman disimpan otomatis sebagai video WebP
