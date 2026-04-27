# Panduan Sistem Manajemen Project Mavi-MES

## Fitur-Fitur Baru

### 1. **Export Project**
Ekspor project Anda ke berbagai format:

#### a. Export JSON
- **Fungsi**: Menyimpan project lengkap termasuk semua konfigurasi sebagai file JSON
- **Kegunaan**: Backup, berbagi project dengan tim, atau import kembali nanti
- **Cara menggunakan**:
  1. Buka project yang ingin di-export
  2. Klik tombol "Manajemen Proyek" di toolbar
  3. Pilih "Export JSON"
  4. File akan otomatis diunduh dengan nama `[NamaProject]-[Timestamp].json`

#### b. Export CSV
- **Fungsi**: Ekspor ringkasan project dalam format tabel
- **Kegunaan**: Dokumentasi, laporan, atau analisis di Excel/Google Sheets
- **Cara menggunakan**:
  1. Buka project
  2. Klik "Manajemen Proyek"
  3. Pilih "Export CSV"
  4. File akan diunduh dengan nama `[NamaProject]-summary-[Timestamp].csv`
  5. Berisi informasi project dan daftar komponen

### 2. **Import Project**
Impor project dari file JSON yang sudah disimpan sebelumnya

**Cara menggunakan**:
1. Klik tombol "Manajemen Proyek"
2. Pilih "Import"
3. Pilih file JSON project
4. Project akan dimuat dengan nama baru (versi draft)
5. Klik "Save" untuk menyimpan sebagai project baru

**Tips**:
- Perubahan status dari imported project akan menjadi DRAFT
- Anda bisa mengubah nama project sebelum menyimpan
- File harus dalam format JSON yang sesuai

### 3. **Duplikasi Project**
Buat copy dari project yang sudah ada dengan mudah

**Cara menggunakan**:
1. Buka project yang ingin diduplikasi
2. Klik "Manajemen Proyek"
3. Pilih "Duplikasi"
4. Masukkan nama baru untuk project (default: `[NamaProject] (Copy)`)
5. Klik OK
6. Project duplikat siap dengan nama baru
7. Klik "Save" untuk menyimpan

**Kegunaan**:
- Template project dari project yang sudah sukses
- Testing tanpa merusak project asli
- Membuat variasi dari project existing

### 4. **Backup & Restore**
Sistem backup otomatis dan manual untuk keamanan data

#### a. Membuat Backup Manual
**Cara menggunakan**:
1. Klik "Manajemen Proyek"
2. Pilih "Buat Backup"
3. Klik "Buat Backup" pada dialog konfirmasi
4. Backup akan disimpan ke localStorage browser

**Fitur**:
- Menyimpan hingga 5 backup terakhir per project
- Backup otomatis dengan timestamp
- Tidak perlu koneksi internet

#### b. Restore dari Backup
**Cara menggunakan**:
1. Klik "Manajemen Proyek"
2. Pilih "Restore Backup ([N])" - N = jumlah backup tersedia
3. Pilih backup yang ingin di-restore (lihat tanggal/waktu)
4. Klik "Restore"
5. Konfirmasi bahwa data saat ini akan ditimpa
6. Project akan di-restore ke versi backup yang dipilih

**Peringatan**:
- Restore akan menimpa perubahan terbaru
- Backup disimpan di browser (hilang jika clear cache)
- Backup hanya tersimpan di device lokal (tidak di cloud)

### 5. **Auto-Save Draft**
Fitur auto-save membantu mencegah kehilangan data

**Cara kerja**:
- Draft otomatis disimpan setiap kali ada perubahan
- Tersimpan di localStorage browser
- Jika browser crash/tertutup, draft bisa dipulihkan

**Recover Draft**:
- Jika ada draft yang tersimpan, sistem akan otomatis menawarkan untuk recover
- Data terbaru bisa dikembalikan dengan cepat

## Struktur File JSON Export

```json
{
  "metadata": {
    "exportedAt": "2026-04-27T10:30:00.000Z",
    "appVersion": "1.0",
    "exportVersion": 1
  },
  "project": {
    "id": "app_123456",
    "name": "Nama Project",
    "category": "Shop Floor",
    "description": "Deskripsi project",
    "version": 1,
    "approval_status": "DRAFT",
    "is_published": false
  },
  "config": {
    "steps": [],
    "baseComponents": [],
    "appTriggers": [],
    "appVariables": [],
    "appFunctions": [],
    "appTables": [],
    "recordPlaceholders": [],
    "materialId": null,
    "productImage": "",
    "iotConfig": {},
    "integrationConnectors": [],
    "appBackgroundColor": "#ffffff",
    "appThemeMode": "light",
    "leftSidebarEnabled": true,
    "rightSidebarEnabled": true,
    "copilotEnabled": true,
    "stepListEnabled": true
  },
  "timestamps": {
    "created_at": "2026-04-27T10:00:00.000Z",
    "updated_at": "2026-04-27T10:30:00.000Z"
  }
}
```

## Best Practices

### Backup & Recovery
1. **Buat backup sebelum perubahan besar**
   - Sebelum mengubah struktur komponen signifikan
   - Sebelum testing fitur baru
   - Sebelum update versi

2. **Ekspor JSON secara berkala**
   - Simpan di cloud storage (Google Drive, OneDrive, dll)
   - Gunakan untuk backup jangka panjang
   - Bisa digunakan sebagai dokumentasi

3. **Monitoring backup**
   - Periksa jumlah backup yang tersedia
   - Hapus backup lama yang tidak diperlukan
   - Jangan andalkan backup browser terlalu lama

### Project Management
1. **Naming Convention**
   - Gunakan nama deskriptif: `Production_Line_A_v2`
   - Hindari karakter khusus
   - Tambahkan versi jika ada multiple versions

2. **Version Control**
   - Gunakan export JSON untuk version control
   - Simpan di Git/version control system
   - Track perubahan dengan timestamp

3. **Kolaborasi Tim**
   - Export project untuk dibagikan ke tim
   - Import project dari kolaborator
   - Gunakan naming convention yang jelas

## Troubleshooting

### Problem: "File JSON invalid"
**Solusi**:
- Pastikan file adalah JSON valid
- Jangan ubah struktur file secara manual
- Download kembali project dari system yang benar

### Problem: "Backup tidak ditemukan"
**Solusi**:
- Browser cache mungkin sudah dihapus
- Backup disimpan per device/browser
- Gunakan export JSON untuk backup long-term

### Problem: "Import gagal"
**Solusi**:
- Periksa format file JSON
- Pastikan project name tidak kosong
- Coba refresh halaman dan import ulang

### Problem: "Auto-save tidak bekerja"
**Solusi**:
- Periksa localStorage browser (Klik F12 → Application → Local Storage)
- Pastikan ada cukup space storage
- Clear cache dan coba lagi

## Fitur Lanjutan

### Batch Export
Export multiple projects sekaligus:
```javascript
import * as projectMgmt from '../utils/projectManagement';

const apps = [app1, app2, app3];
await projectMgmt.exportMultipleProjects(apps);
```

### Project Validation
Validate integritas data project:
```javascript
const validation = projectMgmt.validateProjectData(app);
if (!validation.isValid) {
  console.log('Issues:', validation.issues);
}
```

### Programmatic Export/Import
Bisa digunakan di custom scripts atau automation:
```javascript
// Export
const result = projectMgmt.exportProjectToJSON(app, 'custom-name.json');

// Import
const file = document.querySelector('input[type=file]').files[0];
const imported = await projectMgmt.importProjectFromJSON(file);
```

## Keyboard Shortcuts (Planned)
- `Ctrl+S` atau `Cmd+S`: Quick Save
- `Ctrl+Shift+E` atau `Cmd+Shift+E`: Export JSON
- `Ctrl+Shift+B` atau `Cmd+Shift+B`: Buat Backup

## Support & Issues

Jika mengalami masalah:
1. Buka Developer Console (F12)
2. Lihat error message di console
3. Screenshot dan laporkan ke tim development

---

**Last Updated**: 27 April 2026
**Version**: 1.0
