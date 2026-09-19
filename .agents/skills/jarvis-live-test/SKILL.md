---
name: jarvis-live-test
description: >-
  Skill untuk melakukan live browser testing pada MAVI MES app setelah
  selesai coding. Gunakan skill ini setiap kali selesai membuat atau
  mengubah komponen UI, halaman, form, atau fitur interaktif. Skill ini
  memandu Jarvis untuk membuka browser, menjalankan test real-time
  (klik, input, submit), memeriksa error, dan melaporkan hasilnya.
---

# Jarvis Live Test — Panduan Browser Testing

Skill ini digunakan setelah selesai coding untuk memverifikasi app berjalan
dengan benar secara real-time di browser.

## Prasyarat

- Dev server harus berjalan di `http://localhost:5173`
- Jika belum berjalan, jalankan: `npm run dev`
- Tunggu sampai server siap sebelum mulai testing

## Langkah-Langkah Testing

### 1. Persiapan

```
- Pastikan dev server sudah berjalan dan siap
- Identifikasi halaman/komponen yang baru saja diubah
- Tentukan test scenarios berdasarkan perubahan
```

### 2. Buka Browser dan Navigasi

Gunakan `browser_subagent` untuk membuka app:

```
Task: Buka http://localhost:5173 dan navigasi ke halaman [target]
```

### 3. Test Scenarios (Pilih Sesuai Perubahan)

#### A. Test Halaman Baru / Perubahan Layout
```
1. Navigasi ke halaman
2. Verifikasi halaman dimuat tanpa blank/crash
3. Cek semua section tampil
4. Verifikasi tidak ada console error
```

#### B. Test Form & Input
```
1. Klik pada setiap input field
2. Ketik data test (gunakan data realistis)
3. Test dropdown/select → pilih opsi
4. Test checkbox/toggle → klik untuk toggle
5. Test date picker → pilih tanggal
6. Klik tombol Submit/Save
7. Verifikasi response (success message, data tersimpan, dll)
```

#### C. Test Navigasi & Menu
```
1. Klik setiap item di sidebar/navbar
2. Verifikasi halaman berpindah
3. Cek breadcrumb update
4. Test tombol back/forward
```

#### D. Test Tombol & Interaksi
```
1. Klik setiap tombol yang visible
2. Verifikasi ada feedback (loading, toast, modal, dll)
3. Test hover effects
4. Test dialog/modal open & close
```

#### E. Test Tabel & Data
```
1. Verifikasi tabel tampil dengan data/placeholder
2. Test sort kolom (klik header)
3. Test search/filter (ketik keyword)
4. Test pagination (klik next/prev)
5. Test row actions (edit, delete, dll)
```

### 4. Pengecekan Error

Saat browser terbuka, periksa:
```
- Console errors (filter yang bukan dari supabase/websocket)
- Network errors (gagal fetch API)  
- React error boundaries (red error screens)
- Blank/white screens
- Komponen yang tidak render
- Layout yang rusak/overflow
```

### 5. Pengambilan Keputusan

Setelah testing, ambil keputusan:

```
IF semua_test_pass:
    → Lapor ke user: "✅ App berjalan dengan baik"
    → Sertakan bukti (screenshot/video recording)

IF error_minor (styling, alignment, spacing):
    → Perbaiki langsung tanpa bertanya user
    → Test ulang setelah perbaikan
    → Lapor: "⚠️ Ditemukan masalah minor, sudah diperbaiki"

IF error_medium (fungsi tidak bekerja, data tidak muncul):
    → Lapor ke user dengan detail error
    → Tawarkan solusi perbaikan
    → Tanya: "Apakah perlu saya perbaiki sekarang?"

IF error_critical (crash, blank page, data loss):
    → Perbaiki langsung (prioritas tinggi)
    → Test ulang
    → Lapor ke user: "🚨 Ditemukan error kritis, sudah diperbaiki"
```

### 6. Format Laporan

Gunakan format berikut saat melaporkan hasil:

```markdown
## 🔍 Hasil Live Test

| Item | Status |
|------|--------|
| Halaman dimuat | ✅/❌ |
| Console errors | ✅ Bersih / ❌ [jumlah] error |
| Navigasi | ✅/❌ |
| Form & Input | ✅/❌ |
| Tombol & Interaksi | ✅/❌ |
| Layout & Visual | ✅/❌ |

### Detail
- **Route di-test**: /halaman-yang-ditest
- **Komponen**: [daftar komponen yang di-test]
- **Durasi test**: ~X detik
- **Video rekaman**: [link ke file recording]

### Masalah Ditemukan
1. [Deskripsi masalah] → [Status: Diperbaiki/Perlu input user]

### Rekomendasi
- [Saran improvement jika ada]
```

## Referensi Route MAVI MES

Halaman utama yang bisa di-test:
- `/` — Home/Dashboard
- `/tables` — Table Manager
- `/connectors` — Connector Manager
- `/users` — User Manager
- `/app-builder` — App Builder
- `/app-player` — App Player
- `/workflow` — Workflow Editor
- `/automations` — Automation Dashboard
- `/stations` — Station Manager
- `/machines` — Machine Manager
- `/analytics` — Analysis Manager
- `/dashboards` — Dashboard Manager
- `/work-orders` — Work Order Dashboard
- `/scada` — SCADA Dashboard
- `/app-store` — App Store

## Tips

- Gunakan `RecordingName` yang deskriptif untuk video recording
- Test di resolusi desktop (1280x720 minimum)
- Jika app membutuhkan login, cek apakah ada bypass mode untuk testing
- Selalu filter console errors: abaikan WebSocket, supabase reconnect, ResizeObserver
