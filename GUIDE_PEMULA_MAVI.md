# Panduan Lengkap MAVI MES untuk Pemula

## Daftar Isi
1. [Overview Sistem](#1-overview-sistem)
2. [Membuat Tabel Database](#2-membuat-tabel-database)
3. [Membangun Aplikasi dengan App Builder](#3-membangun-aplikasi-dengan-app-builder)
4. [Menggunakan Triggers (Logika)](#4-menggunakan-triggers-logika)
5. [Membuat Dashboard](#5-membuat-dashboard)
6. [Deployment ke Shop Floor](#6-deployment-ke-shop-floor)

---

## 1. Overview Sistem

MAVI MES adalah platform **no-code** untuk membuat aplikasi manufaktur. Alur kerja utama:

```
Tabel Database → App Builder → Triggers → Dashboard → Deploy
     ↓              ↓             ↓           ↓          ↓
  Simpan data    Buat UI      Tambah logika  Visualisasi  Jalankan
```

### Komponen Utama

| Komponen | Fungsi | Lokasi Menu |
|----------|--------|-------------|
| **Tables** | Database untuk menyimpan data | Menu "Tables" |
| **App Builder** | Visual editor untuk buat UI | Menu "Apps" → "App Builder" |
| **Triggers** | Logika aksi (jika...maka...) | Di dalam App Builder |
| **Dashboard** | Visualisasi data / chart | Menu "Dashboard" |
| **Stations** | Stasiun kerja operator | Menu "Shop Floor" → "Stations" |

---

## 2. Membuat Tabel Database

### 2.1 Membuka Tables Manager
1. Login ke MAVI MES
2. Klik menu **Tables** di navigation bar
3. Klik tombol **"+ Create New Table"**

### 2.2 Membuat Tabel Baru
Contoh: Tabel untuk menyimpan data inspeksi QC

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| `serial_number` | Text | Nomor serial produk |
| `inspector_name` | Text | Nama inspektur |
| `inspection_date` | Date | Tanggal inspeksi |
| `result` | Text | Hasil: PASS / FAIL |
| `defect_notes` | Text | Catatan defect |
| `photo_url` | Text | URL foto hasil |

**Langkah:**
1. Klik **"+ Create New Table"**
2. Isi nama tabel: `qc_inspections`
3. Tambah kolom satu per satu dengan klik **"+ Add Field"**
4. Pilih tipe data untuk setiap kolom
5. Klik **Save**

### 2.3 Mengisi Data Manual
1. Klik tabel yang sudah dibuat
2. Klik **"+ Add Record"**
3. Isi data di setiap kolom
4. Klik **Save**

### 2.4 Contoh Tabel Lain yang Berguna

**Tabel Work Orders:**
- `work_order_id` (Text)
- `product_name` (Text)
- `quantity` (Number)
- `status` (Text): PENDING / IN_PROGRESS / COMPLETED
- `due_date` (Date)

**Tabel Defect Log:**
- `defect_id` (Text)
- `product_serial` (Text)
- `defect_type` (Text)
- `severity` (Text): LOW / MEDIUM / HIGH / CRITICAL
- `corrective_action` (Text)
- `reported_by` (Text)

---

## 3. Membangun Aplikasi dengan App Builder

### 3.1 Membuka App Builder
1. Klik menu **Apps**
2. Klik **"Buat Aplikasi Baru"** atau pilih template
3. App Builder akan terbuka dengan kanvas kosong

### 3.2 Mengenal Interface App Builder

```
┌─────────────────────────────────────────────────────┐
│  Toolbar (Save, Preview, Publish)                    │
├──────────┬────────────────────────┬─────────────────┤
│ Widget   │                        │ Properties      │
│ Palette  │      Canvas            │ Panel           │
│ (Kiri)   │      (Tengah)          │ (Kanan)         │
│          │                        │                 │
│ - Text   │  [Widget ditempatkan]  │ - Position      │
│ - Button │                        │ - Size          │
│ - Input  │                        │ - Style         │
│ - Image  │                        │ - Triggers      │
│ - etc    │                        │                 │
├──────────┴────────────────────────┴─────────────────┤
│  Steps Panel (Bottom) - Untuk multi-step app         │
└─────────────────────────────────────────────────────┘
```

### 3.3 Widget Dasar yang Sering Digunakan

| Widget | Fungsi | Contoh Penggunaan |
|--------|--------|-------------------|
| **TEXT** | Tampilkan teks/judul | Judul form, label |
| **BUTTON** | Tombol aksi | Submit, Next, Cancel |
| **TEXT_INPUT** | Input teks manual | Nama, serial number |
| **DROPDOWN** | Pilihan dari list | Status, kategori |
| **CHECKLIST** | Centang/pilih opsi | Checklist inspeksi |
| **CAMERA** | Ambil foto | Dokumentasi produk |
| **BARCODE** | Scan barcode/QR | Identifikasi produk |
| **TABLE** | Tampilkan data tabel | Daftar work order |
| **CHART** | Grafik visualisasi | Dashboard produksi |
| **GAUGE** | Indikator speedometer | Suhu, tekanan |
| **SIGNATURE** | Tanda tangan digital | Approval, sign-off |

### 3.4 Membuat Aplikasi Sederhana: Form Inspeksi

**Langkah 1: Tambah Judul**
1. Drag widget **TEXT** ke canvas
2. Di Properties panel, ubah:
   - `text`: "FORM INSPEKSI QC"
   - `fontSize`: 24
   - `fontWeight`: bold
   - `textAlignment`: center

**Langkah 2: Tambah Input Serial Number**
1. Drag widget **TEXT_INPUT** ke canvas
2. Di Properties:
   - `placeholder`: "Masukkan Serial Number..."
   - `targetVariable`: `serial_number`

**Langkah 3: Tambah Dropdown Hasil**
1. Drag widget **DROPDOWN** ke canvas
2. Di Properties:
   - `options`: ["PASS", "FAIL"]
   - `targetVariable`: `inspection_result`

**Langkah 4: Tambah Tombol Submit**
1. Drag widget **BUTTON** ke canvas
2. Di Properties:
   - `text`: "SUBMIT"
   - `backgroundColor`: "#2563eb"
   - `color`: "white"

### 3.5 Membuat Multi-Step App

1. Di bagian bawah App Builder, klik **"+ Add Step"**
2. Buat step baru: "Step 2: Hasil Inspeksi"
3. Drag widget yang diperlukan ke step baru
4. Atur navigasi antar step dengan trigger pada tombol

---

## 4. Menggunakan Triggers (Logika)

### 4.1 Apa itu Trigger?
Trigger adalah aturan **"Jika...Maka..."** yang menentukan apa yang terjadi saat user berinteraksi dengan widget.

### 4.2 Membuka Panel Triggers
1. Klik widget (misal: Button)
2. Di Properties panel, klik tab **"Triggers"**
3. Klik **"+ Add Trigger"**

### 4.3 Jenis Event Trigger

| Event | Kapan Dipanggil |
|-------|-----------------|
| `ON_CLICK` | Saat tombol/widget diklik |
| `ON_CHANGE` | Saat nilai input berubah |
| `ON_SUBMIT` | Saat form disubmit |
| `ON_LOAD` | Saat step dimuat |
| `ON_ROW_SELECT` | Saat baris tabel dipilih |

### 4.4 Jenis Aksi Trigger

#### a) SET_VARIABLE - Ubah Nilai Variabel
```
Event: ON_CLICK
Aksi: SET_VARIABLE
Variable: inspection_result
Value: "PASS"
```

#### b) NAVIGATION - Pindah Step
```
Event: ON_CLICK
Aksi: NAVIGATION
Action: GO_TO_STEP
Step: "Step 2: Hasil"
```

#### c) SHOW_MESSAGE - Tampilkan Notifikasi
```
Event: ON_CLICK
Aksi: SHOW_MESSAGE
Message: "Data berhasil disimpan!"
Message Type: success
```

#### d) SAVE_TO_TABLE - Simpan ke Database
```
Event: ON_CLICK
Aksi: SAVE_TO_TABLE
Table: qc_inspections
Fields:
  - serial_number: {{@serial_number}}
  - inspector_name: {{@inspector_name}}
  - result: {{@inspection_result}}
```

#### e) LOAD_FROM_TABLE - Ambil Data dari Database
```
Event: ON_LOAD
Aksi: LOAD_FROM_TABLE
Table: qc_inspections
Filter: serial_number = {{@serial_number}}
Limit: 1
```

### 4.5 Contoh Trigger Lengkap: Form Submit

**Skenario:** Tombol Submit menyimpan data ke tabel dan pindah ke halaman terima kasih

```
Trigger 1:
  Event: ON_CLICK
  Aksi: SAVE_TO_TABLE
  Table: qc_inspections
  Fields:
    - serial_number: {{@serial_number}}
    - inspector_name: {{@inspector_name}}
    - result: {{@inspection_result}}
    - defect_notes: {{@defect_notes}}

Trigger 2:
  Event: ON_CLICK
  Aksi: SHOW_MESSAGE
  Message: "Inspeksi berhasil disimpan!"
  Message Type: success

Trigger 3:
  Event: ON_CLICK
  Aksi: NAVIGATION
  Action: GO_TO_STEP
  Step: "Step 3: Selesai"
```

### 4.6 Variabel App (App Variables)

Variabel adalah **wadah penyimpanan sementara** di memori aplikasi.

**Membuat Variabel:**
1. Di App Builder, klik tab **"Variables"** (di panel kiri)
2. Klik **"+ Add Variable"**
3. Isi:
   - `name`: `serial_number`
   - `type`: string
   - `defaultValue`: ""

**Menggunakan Variabel:**
- Di widget: `{{@serial_number}}`
- Di trigger: `variable: "serial_number"`

### 4.7 Record Placeholder (untuk Tabel)

Record Placeholder adalah **wadah untuk satu baris data** dari tabel.

**Membuat Record Placeholder:**
1. Di App Builder, klik tab **"Record Placeholders"**
2. Klik **"+ Add Record Placeholder"**
3. Isi:
   - `name`: `current_inspection`
   - `tableId`: pilih tabel `qc_inspections`

**Menggunakan Record Placeholder:**
- Ambil data: `current_inspection.serial_number`
- Simpan data: isi fields di trigger SAVE_TO_TABLE

---

## 5. Membuat Dashboard

### 5.1 Membuka Dashboard Manager
1. Klik menu **Dashboard**
2. Klik **"+ Create New Dashboard"**

### 5.2 Jenis Widget Dashboard

| Widget | Fungsi | Contoh |
|--------|--------|--------|
| **Bar Chart** | Grafik batang | Jumlah produksi per hari |
| **Line Chart** | Grafik garis | Tren produksi mingguan |
| **Pie Chart** | Grafik lingkaran | Persentase PASS/FAIL |
| **KPI Card** | Angka besar | Total produksi hari ini |
| **Table** | Tabel data | Daftar work order aktif |
| **Gauge** | Speedometer | OEE, Cycle Time |

### 5.3 Membuat Dashboard Produksi

**Langkah 1: Buat Dashboard Baru**
1. Klik **"+ Create New Dashboard"**
2. Isi nama: "Dashboard Produksi Harian"

**Langkah 2: Tambah KPI Card - Total Produksi**
1. Drag widget **KPI Card** ke dashboard
2. Konfigurasi:
   - `title`: "Total Produksi Hari Ini"
   - `dataSource`: `completions`
   - `filter`: `created_at >= today`
   - `aggregation`: count

**Langkah 3: Tambah Bar Chart - Produksi per Stasiun**
1. Drag widget **Bar Chart** ke dashboard
2. Konfigurasi:
   - `title`: "Produksi per Stasiun"
   - `dataSource`: `completions`
   - `xAxis`: `station_name`
   - `yAxis`: count
   - `filter`: `created_at >= today`

**Langkah 4: Tambah Pie Chart - PASS/FAIL Ratio**
1. Drag widget **Pie Chart** ke dashboard
2. Konfigurasi:
   - `title`: "Hasil Inspeksi"
   - `dataSource`: `qc_inspections`
   - `category`: `result`
   - `filter`: `inspection_date >= today`

### 5.4 Menghubungkan Dashboard dengan Tabel

1. Di widget dashboard, klik **"Data Source"**
2. Pilih tabel yang sudah dibuat (misal: `qc_inspections`)
3. Atur filter sesuai kebutuhan
4. Atur aggregation (count, sum, average, dll)

---

## 6. Deployment ke Shop Floor

### 6.1 Publish Aplikasi
1. Di App Builder, klik tombol **"Publish"**
2. Konfirmasi publish
3. App akan muncul di **App Store**

### 6.2 Assign ke Station
1. Buka menu **Shop Floor → Stations**
2. Pilih stasiun kerja (misal: "Assembly Line 1")
3. Di bagian **"Assigned App"**, pilih aplikasi yang sudah di-publish
4. Klik **Save**

### 6.3 Operator Menjalankan App
1. Operator login di stasiun kerja
2. Aplikasi akan otomatis muncul di layar
3. Operator menjalankan app step-by-step
4. Data tersimpan otomatis ke database

---

## Tips untuk Pemula

### 1. Mulai dari Kebutuhan
```
Tanya diri sendiri:
- Data apa yang perlu dikumpulkan?
- Siapa yang akan mengisi data?
- Bagaimana data akan ditampilkan?
- Ke mana data akan dikirim?
```

### 2. Buat Prototipe Sederhana
```
Step 1: Buat tabel dulu
Step 2: Buat app dengan 1-2 widget
Step 3: Test dengan data dummy
Step 4: Tambah widget/logika bertahap
```

### 3. Gunakan Template
- App Store menyediakan banyak template siap pakai
- Install template yang sesuai
- Kustomisasi sesuai kebutuhan

### 4. Test Sebelum Deploy
- Gunakan **Preview/Simulate** di App Builder
- Test semua trigger dan alur
- Pastikan data tersimpan dengan benar

### 5. Backup Teratur
- Export project secara berkala
- Simpan backup di tempat aman
- Gunakan versioning jika memungkinkan

---

## Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| Widget tidak muncul di preview | Cek apakah widget sudah di-save |
| Trigger tidak jalan | Pastikan event dan aksi sudah benar |
| Data tidak tersimpan | Cek koneksi database dan field names |
| Variabel tidak terisi | Pastikan `{{@variable_name}}` benar |
| Dashboard kosong | Cek data source dan filter |
| App tidak muncul di Station | Pastikan sudah di-publish dan di-assign |

---

## Referensi Cepat

### Syntax Variabel
```
{{@variable_name}}          → Variabel app
{{@record.field}}           → Record placeholder field
{{@APP_INFO.USER}}          → Nama user login
{{@APP_INFO.STATION}}       → Nama station
```

### Tipe Data
- `string` → Teks
- `number` → Angka
- `boolean` → true/false
- `date` → Tanggal
- `image` → URL gambar

### Trigger Actions
- `SET_VARIABLE` → Ubah nilai variabel
- `NAVIGATION` → Pindah step/tab
- `SHOW_MESSAGE` → Tampilkan notifikasi
- `SAVE_TO_TABLE` → Simpan ke tabel
- `LOAD_FROM_TABLE` → Ambil dari tabel
- `UPDATE_TABLE` → Update data di tabel
- `DELETE_TABLE_RECORD` → Hapus data
- `EXECUTE_FUNCTION` → Jalankan function kustom
