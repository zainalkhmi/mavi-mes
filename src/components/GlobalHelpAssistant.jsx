import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, BookOpen, 
  Layout, Cpu, BarChart3, Zap, Paperclip, X,
  Search, ChevronDown, ChevronUp, Info, Scale, SlidersHorizontal, ToggleRight, Type, Table, FileText, Globe, Eye,
  Sparkles, Clock, MapPin, Database, Bluetooth, Code, Activity, Calendar, Camera, FolderOpen, PenTool,
  Play, Volume2, Mic, Tv, Map, Wifi, AlertTriangle, Wrench, CreditCard, Gamepad2, Grid3X3, Sun, Flame, Wind,
  Snowflake, Compass, Container, Bell, Power, ArrowRight, RotateCw, ArrowDownUp, Car, Fuel, Bug, Trash2, Wallet,
  Keyboard, Menu, Hash, Upload, ShieldCheck, Cog, AlignLeft, LayoutGrid, Palette, PlayCircle, Thermometer, Video,
  Gauge, TrendingUp, Rocket, Route, AppWindow, Factory, Workflow, Link2
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getPrimaryAiConnector } from '../utils/database';
import { getChatCompletion } from '../utils/aiService';
import { Link } from 'react-router-dom'; // For internal linking if needed, though markdown links handle href well

const SYSTEM_PROMPT = `
Anda adalah **Mavi Global AI Assistant**, pakar utama dari platform **Mavi MES (Manufacturing Execution System)**.
Tugas Anda adalah membantu pengguna memahami cara kerja Mavi, mulai dari konfigurasi hardware hingga pembuatan aplikasi industri.
Pengetahuan dasar Mavi meliputi:
1. **Apps (App Builder & Copilot):** Pengguna dapat membuat aplikasi operator/HMI secara drag-and-drop, mengatur tag PLC ke variabel UI, dan mempublish aplikasi. **PENTING:** Jika pengguna bertanya tentang cara membuat aplikasi (app), Anda WAJIB memberikan langkah-langkah dasar dan menyertakan tautan ini: [Buka Copilot App Builder](#/builder?copilot=true)
2. **Widget List (Daftar Widget HMI):** Mavi memiliki banyak widget untuk mendesain antarmuka operator:
   - **Kontrol & Input UI**: Button (memicu aksi/trigger click), Slider (input nilai kontinu/rentang), Switch (boolean toggle ON/OFF), TextBox (input teks/angka manual).
   - **Visualisasi & Data**: Gauge/Circular Gauge (indikator analog/speedometer real-time), Chart (tren grafik Line/Bar/Pie), Data Table (tabel interaktif untuk list Work Order/inspeksi QC dari database Mavi), Live Analysis (analytics).
   - **Industri & Sensor**: Machine Status (indikator status Merah/Hijau/Kuning), Camera Scanner (scan QR/Barcode), Measurement (mengambil data dari Caliper/Micrometer via Serial COM/USB).
   - **Media & Dokumen**: PDF Viewer (menampilkan SOP di stasiun kerja), Webpage (integrasi web eksternal/CCTV).
   Jika ditanya cara menggunakannya, jelaskan fungsi, cara pakai, dan parameter konfigurasinya (seperti 'value', 'min', 'max', 'on', 'trackColorActive', 'tableId', 'connectionType', 'baudRate', dll.).
3. **Shop Floor (Hardware & Station):** Mavi menghubungkan hardware via Edge Devices, IoT Hub, dan PLC Settings (Modbus TCP/RTU, OPC UA, MQTT). Pengguna dapat memanajemen jalur produksi di Station Manager dan Assign App ke operator.
4. **Analytics:** Mavi memiliki Dashboard dan Analysis Manager untuk visualisasi data produksi (OEE, Downtime, dll).
5. **Logic & Automations:** Mavi mendukung otomatisasi berbasis node logic (Event-Condition-Action) dan Functions/API eksternal.
6. **Console:** Aplikasi dijalankan oleh operator melalui Live Terminal atau App Player.
Berikan panduan yang komprehensif, langkah demi langkah, dan mudah dipahami.
Gunakan format markdown yang rapi (bullet points, bold, code block).
`;

const MAVI_GUIDES = [
  {
    id: 'workflow-roadmap',
    title: 'Workflow & Roadmap',
    icon: Route,
    color: '#6366f1', // Indigo
    content: `
**Roadmap Alur Pembuatan Aplikasi di Mavi**

![Mavi App Workflow](/assets/workflow-roadmap.png)

Berikut adalah panduan langkah demi langkah (workflow) untuk merancang, membangun, dan menyebarkan aplikasi HMI/Operator dari awal hingga berjalan di lantai produksi:

1. **Fase 1: Persiapan & Pemetaan Data (Database & Hardware Tag)**
   - **Langkah 1.1: Buat Tabel Data (Tables):** Masuk ke menu **Tables** untuk merancang skema penyimpanan data jika aplikasi memerlukan pencatatan (seperti log Downtime, daftar defect QC, atau daftar instruksi kerja).
   - **Langkah 1.2: Petakan Register PLC (PLC Settings / IoT Hub):** Jika aplikasi perlu membaca/menulis memori PLC, buat koneksi (Modbus TCP/OPC UA) dan petakan register menjadi Tag nama simbolik (contoh: \`Tag_Suhu_Mesin\` -> register \`40002\`).

2. **Fase 2: Perancangan Antarmuka (App Builder)**
   - **Langkah 2.1: Buat Aplikasi Baru:** Masuk ke **Apps -> App Builder** dan klik "Buat Aplikasi Baru".
   - **Langkah 2.2: Rancang Layout UI (Drag & Drop):** Tarik widget (Teks, Tombol, Grafik, Input Form) dari panel kiri ke kanvas aplikasi.
   - **Langkah 2.3: Konfigurasi Record Placeholder:** Jika menggunakan Tabel, buat Record Placeholder di panel variabel aplikasi untuk menampung baris aktif tabel yang sedang dioperasikan.

3. **Fase 3: Implementasi Logika (Triggers & Connectors)**
   - **Langkah 3.1: Tambahkan Logic Trigger:** Konfigurasi aksi pada tombol atau widget (contoh: "Ketika tombol Submit diklik -> Tulis data form ke Record Placeholder -> Simpan ke Tabel").
   - **Langkah 3.2: Integrasikan Functions / Connectors:** Jika aplikasi butuh validasi kustom atau transfer data ke ERP eksternal (SAP/Odoo), hubungkan aksi widget untuk memanggil **Function** atau REST API **Connector**.

4. **Fase 4: Uji Coba & Deployment**
   - **Langkah 4.1: Simulasi Lokal (Simulate/Preview):** Gunakan tombol Preview di App Builder untuk mensimulasikan alur kerja aplikasi secara lokal.
   - **Langkah 4.2: Publikasikan Aplikasi (Publish):** Jika sudah siap, klik **Publish** untuk mengirim versi aplikasi ke **App Store** internal Mavi.
   - **Langkah 4.3: Tetapkan Aplikasi ke Stasiun Kerja (Assign to Station):** Masuk ke menu **Shop Floor -> Stations**, pilih stasiun kerja fisik (contoh: "Assembly Line 1"), dan tetapkan aplikasi yang baru dipublikasikan tersebut. Operator yang login di stasiun kerja tersebut akan otomatis melihat aplikasi Anda berjalan di layar mereka.

---

### Kamus Istilah Cepat (Glossary)
- **Tag:** Alamat memori di PLC (sensor/mesin) untuk membaca/menulis data.
- **Trigger:** Aturan sebab-akibat (Jika tombol diklik, maka simpan data).
- **Record Placeholder:** Wadah sementara di memori aplikasi untuk menyimpan satu baris data dari Tabel Database.
- **Edge Device:** Komputer mini di pabrik yang menjembatani mesin fisik ke sistem Mavi.
    `
  },
  {
    id: 'quick-start',
    title: 'Quick Start: Hello World',
    icon: Rocket,
    color: '#f43f5e', // Rose
    content: `
**Tutorial 5 Menit: Membuat Aplikasi Pertama Anda**

Mari kita buat aplikasi "Hello World" sederhana untuk memahami cara kerja App Builder!

1. **Buka App Builder**
   - Navigasi ke menu **Apps**, lalu klik tombol **Buat Aplikasi Baru**.
   - Pilih opsi **Blank Canvas** (Kanvas Kosong).

2. **Tambahkan Widget ke Layar**
   - Di sebelah kiri layar, cari menu **Widget Palette** (ikon Plus).
   - Tarik (drag) widget **Text** ke tengah layar. Ubah teksnya menjadi "Status: Belum Ditekan" melalui panel Properties di sebelah kanan.
   - Tarik widget **Button** dan letakkan di bawah teks tadi. Ubah label tombol menjadi "Tekan Saya".

3. **Buat Logika Sederhana (Trigger)**
   - Klik widget **Button** yang baru Anda buat.
   - Di panel kanan, buka tab **Triggers** dan klik **Add Trigger**.
   - **Kondisi (When):** Pilih \`On Click\` (Saat diklik).
   - **Aksi (Then):** Pilih \`Update Widget Property\`. Pilih widget **Text** tadi, pilih properti \`text\`, dan masukkan nilai baru: "Status: Tombol Ditekan!".
   - Simpan Trigger.

4. **Uji Coba Aplikasi**
   - Klik tombol **Simulate / Preview** (ikon Play) di pojok kanan atas.
   - Klik tombol "Tekan Saya" di layar simulasi. Jika teks berubah, selamat! Anda baru saja membuat aplikasi pertama Anda yang berfungsi!
    `
  },
  {
    id: 'copilot-tips',
    title: 'Tips AI Copilot',
    icon: Sparkles,
    color: '#8b5cf6', // Violet
    content: `
**Cara Membuat Prompt AI yang Akurat**

Mavi dilengkapi dengan **AI Copilot** yang bisa men-generate aplikasi (UI dan tabel) secara otomatis. Kunci untuk mendapatkan hasil yang bagus adalah memberikan perintah (*prompt*) yang spesifik.

### Contoh Prompt yang Buruk ❌
> *"Buatkan aplikasi untuk inspeksi."*
*(Terlalu singkat. AI akan mengarang struktur form yang mungkin tidak sesuai dengan format pabrik Anda).*

### Contoh Prompt yang Baik ✅
> *"Buatkan form inspeksi Quality Control. Saya butuh input untuk Nama Inspektur, dropdown untuk Status (Lolos / Gagal), dan input angka untuk Berat Produk. Berikan warna tema gelap (dark mode), dan tambahkan tombol Submit besar di bagian bawah."*

### Tips Iterasi 🔄
Jika hasil pertama dari AI kurang pas, Anda tidak perlu mengulang dari nol! Cukup berikan perintah lanjutan di kolom chat Copilot, misalnya:
- *"Ganti warna tombol Submit menjadi merah."*
- *"Tambahkan satu kolom input teks untuk Catatan Tambahan."*
- *"Ubah dropdown Status menjadi opsi: Good, Rework, dan Reject."*
    `
  },
  {
    id: 'create-app',
    title: 'Create App',
    icon: AppWindow,
    color: '#14b8a6',
    content: `
**3 Cara Membuat Aplikasi di Mavi — Tanpa Coding, Tanpa Database Manual**

![3 Ways to Create Apps](/assets/create-app-ways.jpg)

Mavi menyediakan **tiga cara** untuk membuat aplikasi industri (HMI/Operator) sesuai kebutuhan dan tingkat kenyamanan Anda:

---

### 1. Download Template dari App Store

Cara termudah dan tercepat untuk memulai. Cukup buka menu **App Store**, pilih template yang sesuai dengan kebutuhan Anda (Quality Inspection, Manufacturing Dashboard, Weigh and Dispense, dll.), lalu klik **Install**.

- Template siap pakai untuk berbagai kebutuhan industri (Quality, Manufacturing, Production)
- Cukup satu klik untuk menginstall dan langsung digunakan
- Alur: **DOWNLOAD -> CUSTOMIZE -> DEPLOY -> USE**
- *Best for: Quick start dengan template yang sudah teruji*

---

### 2. Manual Drag & Drop ke Canvas

Bangun aplikasi dari nol dengan kendali penuh. Buka **App Builder**, lalu tarik widget (Button, Chart, Text Input, Camera Scanner, dll.) dari toolbar ke canvas.

- Kontrol penuh atas desain dan layout aplikasi
- Tambahkan logic, tables, validasi, dan konfigurasi sesuai keinginan
- Alur: **DRAG -> CONFIGURE -> SAVE -> DEPLOY**
- *Best for: Aplikasi kustom yang sesuai kebutuhan spesifik Anda*

---

### 3. Generate dengan Copilot (AI-Powered)

Deskripsikan apa yang Anda butuhkan, dan **Mavi Builder Copilot** (AI) akan membuatkan aplikasi lengkap untuk Anda — termasuk form, tabel, logic, dan chart.

- AI membuat app, forms, tables, logic & charts secara otomatis
- Hemat waktu dan kurangi pekerjaan manual
- Alur: **DESCRIBE -> GENERATE -> REVIEW -> DEPLOY**
- *Best for: Pembuatan cepat dengan bantuan AI*

[Buka Copilot App Builder](#/builder?copilot=true)

---

### Deploy ke Station & Mulai Digunakan

Setelah aplikasi selesai dibuat (dengan cara apapun di atas), langkah terakhir adalah men-**deploy** aplikasi ke Station yang tepat. Operator dapat langsung membuka aplikasi di PC, tablet, atau kiosk dan mulai bekerja.

- Real-time Data & Track & Monitor
- Improve Productivity & Ensure Quality
    `
  },
  {
    id: 'app-builder',
    title: 'App Builder & Copilot',
    icon: Bot,
    color: '#ec4899', // Pink
    content: `
**Membangun Aplikasi HMI/Operator**

![App Builder & Copilot](/assets/app-builder-copilot.png)

Mavi menyediakan **App Builder** yang memungkinkan Anda membuat antarmuka aplikasi industri (HMI) secara *drag-and-drop* tanpa perlu coding.

1. **Membuat UI:** Buka menu **Apps -> App Builder**. Anda dapat menambahkan Widget seperti Tombol, Indikator Angka, Grafik, maupun Input Teks.
2. **Koneksi Variabel:** Setiap Widget dapat dikaitkan dengan *Variables* yang mana nilainya bisa bersumber dari PLC (Tag), Database (Tables), atau Input Operator.
3. **AI Copilot:** Anda bisa meminta Mavi AI Copilot untuk meng-*generate* layout UI berdasarkan prompt (contoh: "Buatkan form inspeksi quality control").
4. **Publishing:** Setelah selesai, aplikasi dapat di-Publish ke **App Store** internal untuk nantinya ditugaskan (assigned) ke *Station* tertentu di area Shop Floor.
    `
  },
  {
    id: 'shop-floor',
    title: 'Shop Floor & Konektivitas',
    icon: Factory,
    color: '#3b82f6', // Blue
    content: `
**Manajemen Pabrik & Hardware**

![Mavi Shop Floor & Konektivitas](/assets/shop-floor-connectivity.png)

Mavi mengatur hierarki lantai produksi dan mengumpulkan data dari mesin.

1. **Stations:** Titik kerja operator (misal: "Assembly Line 1"). Aplikasi (App) ditugaskan pada setiap Station, sehingga operator yang login di Station tersebut akan melihat App yang relevan.
2. **Machines & Edge Devices:** Repositori untuk mendaftarkan aset fisik pabrik. Edge Devices digunakan untuk memproses data komputasi di area lokal sebelum dikirim ke server.
3. **PLC Settings:** Untuk mengonfigurasi konektivitas Mavi ke PLC industri via protokol **Modbus TCP, Modbus RTU (Serial), OPC UA**, atau platform mikrokontroler seperti Arduino. Di sini Anda bisa memetakan memori register PLC menjadi Tag agar bisa dibaca oleh App.
4. **IoT Hub:** Menerima *streaming* data real-time via MQTT or HTTP dari perangkat IoT.
    `
  },
  {
    id: 'logic',
    title: 'Logic & Automations',
    icon: Workflow,
    color: '#f59e0b', // Orange
    content: `
**Automasi & Pengolahan Data**

![Mavi Logic & Automation](/assets/logic-automation.png)

Sistem automasi Mavi memproses data dari perangkat keras (PLC/IoT) dan tingkat operator untuk mengeksekusi logika backend tanpa perlu menulis kode yang rumit.

1. **Triggers (Pemicu):**
   - Merupakan kejadian (*events*) yang memulai alur logika dalam aplikasi HMI maupun automasi visual.
   - *Tingkat HMI:* Penekanan tombol (Button click), input nilai teks, pemindaian barcode, atau ketika layar dibuka (*App open*).
   - *Tingkat Automasi:* Nilai memori PLC berubah (Tag change), interval waktu berkala (Timer), atau data baru yang masuk dari MQTT Broker/HTTP API.

2. **Connectors (Konektor):**
   - Jembatan integrasi untuk menghubungkan Mavi dengan sistem luar, database relasional pihak ketiga, atau REST API eksternal.
   - Mendukung integrasi dengan ERP Enterprise (seperti **SAP, Odoo, Dynamics 365**), database SQL (PostgreSQL, MSSQL, MySQL), serta web service eksternal (Webhook).

3. **Functions (Fungsi):**
   - Skrip kustom JavaScript atau kueri REST API yang dapat dipanggil langsung dari widget aplikasi HMI (App Builder).
   - Berguna untuk melakukan kalkulasi matematis yang kompleks, format parsing data JSON, atau mengirimkan query cepat ke database sebelum menampilkan data di layar operator.

4. **Automations (Automasi):**
   - Aturan logika visual berbasis node dengan pola *Event-Condition-Action* (ECA) yang berjalan di latar belakang (*background*).
   - Digunakan untuk memonitor fault mesin secara terus-menerus, memicu sirine alarm jika parameter melebihi batas aman, mengirimkan email peringatan ke departemen maintenance, atau menulis log Downtime secara otomatis ke Tabel Database Mavi.
    `
  },
  {
    id: 'analytics',
    title: 'Analytics & Dashboards',
    icon: TrendingUp,
    color: '#10b981', // Green
    content: `
**Visualisasi & Manajemen Data Produksi**

![Mavi Analytics & Dashboards](/assets/analytics-dashboards.png)

Kelola database produksi Anda dan bangun visualisasi visual (*real-time chart*) untuk memantau produktivitas pabrik Anda secara langsung.

1. **Tables (Tabel Database):**
   - Sistem database relasional internal terintegrasi di Mavi (mirip *Tulip Tables*) untuk menyimpan data master dan log operasional pabrik.
   - Digunakan untuk mencatat daftar Mesin, Work Order (Perintah Kerja), data Inventaris Bahan Baku, riwayat Cacat Produk (Quality Defect), serta Log Operator.

2. **Record Placeholder (Penampung Rekam):**
   - Variabel dinamis di tingkat aplikasi HMI yang berfungsi sebagai penampung baris (*record*) aktif yang diambil dari suatu Tabel.
   - Melalui Record Placeholder, tombol HMI dapat memuat data baris tertentu (misalnya memuat "Work Order #123"), menampilkan kolom-kolomnya ke widget teks, mengedit nilainya, dan menulisnya kembali ke tabel untuk disimpan.

3. **Linked Record (Rekam Terhubung):**
   - Relasi data antar tabel yang memungkinkan Anda menghubungkan suatu baris di satu tabel ke baris di tabel lainnya.
   - Contoh: Menghubungkan baris pada tabel **"Downtime Log"** ke baris tertentu pada tabel **"Mesin"**, sehingga mempermudah proses agregasi performa mesin per jalur produksi.

4. **Analysis Manager & Dashboards:**
   - **Analysis Manager:** Alat perumus kueri untuk menghitung indikator performa utama seperti OEE (Overall Equipment Effectiveness), menghitung persentase downtime mesin, dan membandingkan target vs aktual produksi.
   - **Dashboards:** Papan informasi interaktif untuk supervisor dan manajemen yang menyajikan grafik tren (Line Chart, Bar Chart, Gauge) secara real-time dari data analisis.
    `
  },
  {
    id: 'connectors-guide',
    title: 'Connectors & Integrasi',
    icon: Link2,
    color: '#3b82f6', // Blue
    content: `
**Panduan Konfigurasi & Integrasi Connector MAVI**

Connector adalah jembatan penghubung antara platform MAVI-MES dengan sistem eksternal, baik berupa REST API, database SQL, broker IoT (MQTT), standar industri (OPC UA & Modbus), asisten AI (LLM), maupun alat desain (Canva).

Berikut adalah panduan konfigurasi (*caranya*) dan contoh penggunaan (*contohnya*) untuk masing-masing **9 tipe connector** yang tersedia di MAVI:

---

### 1. HTTP (REST API / Webhooks)
* **Tujuan**: Mengambil atau mengirimkan data dari/ke layanan web eksternal (REST API, Webhook ERP, sistem cloud).
* **Cara Konfigurasi**:
  1. Pilih tipe **HTTP** saat membuat connector baru.
  2. Isi **Server Address** dengan domain/endpoint tujuan (misal: \`api.weather.gov\` atau \`erp.mycompany.com\`).
  3. Setel **TLS** ke \`Yes\` (jika URL menggunakan HTTPS) dan tentukan **Port** (default \`443\` untuk HTTPS).
  4. Pilih **Authentication Type** sesuai kebutuhan (misal: \`No Auth\`, \`Basic Auth\`, atau \`OAuth 2.0 (Bearer Token)\`).
  5. Tambahkan custom headers jika API eksternal membutuhkan header khusus (seperti \`Content-Type\` atau token API).
* **Contoh Penggunaan & Payload**:
  * **Mengambil Data Cuaca (GET)**:
    * Endpoint: \`https://api.weather.gov/gridpoints/TOP/31,80/forecast\`
    * Response:
      \`\`\`json
      {
        "temperature": 28,
        "humidity": 75,
        "shortForecast": "Partly Cloudy"
      }
      \`\`\`
  * **Mengirim Data Work Order ke Odoo ERP (POST)**:
    * Endpoint: \`https://erp.mycompany.com/api/workorder/update\`
    * Payload:
      \`\`\`json
      {
        "wo_id": "WO-9988",
        "status": "In Progress",
        "operator": "Ahmad"
      }
      \`\`\`

---

### 2. SQL Database (Postgres, MySQL, MSSQL)
* **Tujuan**: Menghubungkan MAVI langsung ke database relasional eksternal perusahaan untuk pertukaran data operasional.
* **Cara Konfigurasi**:
  1. Pilih tipe **SQL**.
  2. Isi **Server Address** dengan IP/Domain server database (misal: \`192.168.1.100\`).
  3. Masukkan **Database Name** (nama database target).
  4. Masukkan kredensial berupa **Username** & **Password**.
  5. Jika database menggunakan port khusus (non-standar), aktifkan **Use custom port** dan isi portnya (default Postgres: \`5432\`, MySQL: \`3306\`, MSSQL: \`1433\`).
* **Contoh Kueri SQL**:
  * **Membaca Jadwal Produksi (SELECT)**:
    \`\`\`sql
    SELECT id, part_no, qty_target, status 
    FROM production_schedule 
    WHERE line_id = 'Line-A' AND status = 'Ready';
    \`\`\`
  * **Menulis Aktual Output Hasil QC (UPDATE)**:
    \`\`\`sql
    UPDATE production_schedule 
    SET qty_actual = qty_actual + 1, updated_at = NOW() 
    WHERE id = 'WO-102';
    \`\`\`

---

### 3. Supabase (Backend-as-a-Service)
* **Tujuan**: Mengintegrasikan MAVI secara native ke layanan Supabase cloud database Anda untuk membaca/menulis data secara real-time.
* **Cara Konfigurasi**:
  1. Pilih tipe **Supabase**.
  2. Masukkan **Supabase Project URL** (format: \`https://[project-id].supabase.co\`).
  3. Masukkan **Supabase API Key** (Anon Key atau Service Role Key).
* **Contoh Penggunaan**:
  * **Mengambil Data PLC Controllers**:
    \`\`\`javascript
    const { data, error } = await supabase
      .from('plc_controllers')
      .select('*')
      .eq('status', 'online');
    \`\`\`
  * **Menyimpan Laporan Defect QC Baru**:
    \`\`\`javascript
    const { data, error } = await supabase
      .from('qc_inspection_logs')
      .insert([
        { inspector_name: 'Budi', part_no: 'C001', status: 'REJECT', defect_reason: 'Baret/Scratch' }
      ]);
    \`\`\`

---

### 4. Google Sheets (Spreadsheet Integration)
* **Tujuan**: Membaca atau menulis data langsung ke baris-baris file Google Spreadsheet.
* **Cara Konfigurasi**:
  1. Pilih tipe **Google Sheets**.
  2. Masukkan **Spreadsheet ID** (disalin dari URL browser: \`docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit\`).
  3. Masukkan **Default Sheet Name** (contoh: \`Sheet1\`).
* **Contoh Penggunaan & Payload**:
  * **Menambahkan Baris Log Baru (Append Row)** ketika operator memindai label barang yang salah pada proses supply:
    \`\`\`json
    {
      "spreadsheetId": "1aBCdEfGhIjKlMnOpQrStUvWxYz_1234567890",
      "range": "Data_QC!A:D",
      "values": [
        ["2026-06-14 18:00:00", "Ahmad", "C001", "Wrong Location Rack"]
      ]
    }
    \`\`\`

---

### 5. MQTT (Machine Telemetry Broker)
* **Tujuan**: Menghubungkan MAVI ke broker MQTT untuk mengirim atau menerima aliran data sensor dan parameter mesin (telemetri) secara real-time.
* **Cara Konfigurasi**:
  1. Pilih tipe **MQTT**.
  2. Isi **Server Address** broker MQTT (misal: \`broker.emqx.io\` atau \`192.168.1.15\`).
  3. Pilih **Protocol** (\`MQTT\` / \`MQTTs\`) dan **MQTT Version** (\`3.1.1\` atau \`5.0\`).
  4. Tentukan parameter **QoS** (0, 1, atau 2), **Keep Alive** (default 60 detik), dan status **Clean Session**.
  5. Masukkan sertifikat keamanan TLS pada bagian **Security** jika broker mewajibkan otentikasi SSL/TLS.
* **Contoh Topik & Payload**:
  * **Menerima Data Suhu Oven (Subscribe)**:
    * Topik: \`factory/line1/oven/telemetry\`
    * Payload masuk:
      \`\`\`json
      {
        "timestamp": 1781436192,
        "temperature_celsius": 185.3,
        "heater_status": "ON"
      }
      \`\`\`
  * **Mengaktifkan Lampu Alarm Stasiun (Publish)**:
    * Topik: \`factory/line1/andon/control\`
    * Payload keluar: \`{"status": "RED", "buzzer": true}\`

---

### 6. OPC UA (Industrial Standard)
* **Tujuan**: Menghubungkan MAVI ke server OPC UA untuk memetakan variabel PLC secara aman dan terstruktur.
* **Cara Konfigurasi**:
  1. Pilih tipe **OPC UA**.
  2. Masukkan **Endpoint URL** server OPC UA (contoh: \`opc.tcp://192.168.1.10:4840\`).
  3. Pilih **Security Policy** (\`None\`, \`Basic256Sha256 (Sign & Encrypt)\`, atau \`Basic256 (Sign)\`).
  4. Pilih **Authentication** (\`Anonymous\` atau \`Username & Password\`).
* **Contoh Pemetaan Node Tag PLC**:
  * **Membaca status Kecepatan Conveyor**:
    * NodeId: \`ns=2;s=Line1.Conveyor1.ActualSpeed\`
  * **Membaca Trigger Siklus Selesai**:
    * NodeId: \`ns=2;s=Line1.Station2.CycleComplete\`

---

### 7. Modbus TCP (Direct PLC Register Access)
* **Tujuan**: Membaca dan menulis secara langsung ke alamat memori register PLC (Modbus Coils / Holding Registers) melalui jaringan Ethernet.
* **Cara Konfigurasi**:
  1. Pilih tipe **Modbus TCP**.
  2. Masukkan **IP Address** PLC (misal: \`192.168.1.50\`).
  3. Tentukan **Port** (default standard Modbus: \`502\`).
  4. Isi **Unit ID / Slave Address** (biasanya bernilai \`1\`).
* **Contoh Pemetaan Register**:
  * **Membaca Input Sensor Suhu (Holding Register 4x)**:
    * Alamat Register: \`40002\`
    * Nilai Skala: \`* 0.1\` (Jika nilai register mentah bernilai \`854\`, sistem akan membacanya sebagai \`85.4 °C\`).
  * **Menulis Trigger Mulai Mesin (Coil Register 0x)**:
    * Alamat Register: \`00001\`
    * Aksi Trigger: Menulis nilai \`true\` (ON) ke register coil untuk menghidupkan relai motor.

---

### 8. AI Assistant (Copilot LLM Integration)
* **Tujuan**: Mengintegrasikan model kecerdasan buatan LLM (seperti OpenAI, Anthropic, Gemini, atau server LLM lokal) ke stasiun kerja operator sebagai asisten troubleshooting atau asisten lisan.
* **Cara Konfigurasi**:
  1. Pilih tipe **AI Assistant (Copilot)**.
  2. Pilih **AI Provider** (\`OpenAI\`, \`Anthropic\`, \`Google Gemini\`, atau \`Local (Ollama/LM Studio)\`).
  3. Masukkan **API Key** yang valid dari provider bersangkutan.
  4. Masukkan **Model ID** (contoh: \`gpt-4o\`, \`gemini-1.5-pro\`, atau \`claude-3-5-sonnet\`).
  5. Masukkan **Base System Prompt** untuk memberikan konteks perilaku AI.
* **Contoh Skenario Chat Asisten**:
  * **System Prompt**: *"Anda adalah asisten operator lini manufaktur MAVI. Jawablah pertanyaan operator mengenai error mesin secara singkat, aman, dan ikuti standar keselamatan industri."*
  * **Input Operator**: *"Mesin Press hidrolik mengeluarkan bunyi mendengung keras dan jarum tekanan bergoyang."*
  * **Respon AI**:
    > **Tindakan Darurat:**
    > 1. Segera hentikan operasi mesin dengan menekan tombol **E-Stop** fisik di stasiun Anda.
    > 2. Jangan mencoba menyentuh pipa hidrolik selagi mesin dalam kondisi panas.
    > 3. Laporkan kegagalan sistem melalui tombol **Buat Tiket Perbaikan** di menu MAVI HMI.

---

### 9. Canva Connect (Mockups & SOP Visual)
* **Tujuan**: Menghubungkan MAVI secara dinamis ke Canva API untuk menarik dokumen instruksi kerja (SOP), mockup kemasan, atau aset visual stasiun kerja secara real-time.
* **Cara Konfigurasi**:
  1. Pilih tipe **Canva Connect**.
  2. Masukkan **Canva API Key / Access Token** dari portal developer Canva.
  3. Isi **Default Design Folder ID** (opsional).
  4. Tentukan **Export Format** (\`PNG\`, \`JPG\`, atau \`PDF\`).
* **Contoh Penggunaan**:
  * Menampilkan gambar panduan perakitan visual terbaru di layar operator:
    * Setiap kali model produk berganti (misal dari model A ke B), HMI MAVI memanggil Canva Connector dengan mengirimkan Design ID spesifik (\`DAG12345XYZ\`).
    * Connector akan menarik versi ekspor PNG terbaru langsung dari project Canva desainer produk dan menampilkannya di stasiun kerja operator secara instan.
`
  },
  {
    id: 'widgets',
    title: 'Daftar Widget HMI',
    icon: LayoutGrid,
    color: '#a855f7', // Purple
    content: ''
  }
];

export default function GlobalHelpAssistant() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Halo! Saya Mavi Global AI Assistant. Saya siap menjawab pertanyaan Anda mengenai platform Mavi, mulai dari App Builder, Manajemen Station, hingga konfigurasi PLC dan IoT. Ada yang ingin Anda pelajari hari ini?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [aiConnector, setAiConnector] = useState(null);
  const [activeGuide, setActiveGuide] = useState(MAVI_GUIDES[0].id);
  const [knowledgeFiles, setKnowledgeFiles] = useState([]);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem('mavi_global_knowledge_files');
    if (saved) {
      try {
        setKnowledgeFiles(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2000000) { 
      toast.error('File terlalu besar! Batas maksimal 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target.result;
      const newFile = {
        id: Date.now().toString(),
        name: file.name,
        content: content,
        timestamp: new Date().toISOString()
      };
      const newFiles = [...knowledgeFiles, newFile];
      setKnowledgeFiles(newFiles);
      try {
        localStorage.setItem('mavi_global_knowledge_files', JSON.stringify(newFiles));
        toast.success(`File ${file.name} berhasil diunggah.`);
      } catch(err) {
        toast.error('Gagal menyimpan file ke penyimpanan lokal (melebihi batas kuota browser).');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteFile = (id) => {
    const newFiles = knowledgeFiles.filter(f => f.id !== id);
    setKnowledgeFiles(newFiles);
    localStorage.setItem('mavi_global_knowledge_files', JSON.stringify(newFiles));
  };

  useEffect(() => {
    const initAi = async () => {
      try {
        const connector = await getPrimaryAiConnector();
        setAiConnector(connector);
      } catch (err) {
        console.warn("Could not load AI connector:", err);
      }
    };
    initAi();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!aiConnector || !aiConnector.config?.apiKey) {
        throw new Error('AI Connector belum dikonfigurasi. Silakan setting AI di halaman Integrasi terlebih dahulu.');
      }

      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      let systemPromptWithContext = SYSTEM_PROMPT;
      if (knowledgeFiles.length > 0) {
        systemPromptWithContext += `\n\n=== FILE KNOWLEDGE BASE ===\nAnda memiliki referensi file tambahan yang diunggah oleh pengguna:\n`;
        knowledgeFiles.forEach(f => {
          systemPromptWithContext += `\n[Nama File: ${f.name}]\n\`\`\`\n${f.content}\n\`\`\`\n`;
        });
      }

      const payload = [
        { role: 'system', content: systemPromptWithContext },
        ...history,
        { role: 'user', content: userMessage.content }
      ];

      const response = await getChatCompletion(payload, aiConnector);
      
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error: ${err.message}`, 
        isError: true 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', height: 'calc(100vh - 56px)', boxSizing: 'border-box', backgroundColor: '#f8fafc', flexDirection: 'row' }}>
      
      {/* ─── LEFT COLUMN: DOCUMENTATION ──────────────────────────── */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px' }}>
            <BookOpen size={24} color="#3b82f6" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Panduan Aplikasi Mavi</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Pilih topik untuk melihat dokumentasi fungsional Mavi.</p>
          </div>
        </div>

        {/* Protocol Selector Tabs/Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {MAVI_GUIDES.map(guide => {
            const isActive = activeGuide === guide.id;
            const Icon = guide.icon;
            return (
              <button
                key={guide.id}
                onClick={() => setActiveGuide(guide.id)}
                title={guide.title}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '10px', borderRadius: '12px', border: isActive ? '1px solid ' + guide.color : '1px solid #cbd5e1',
                  backgroundColor: isActive ? `${guide.color}15` : '#ffffff',
                  color: isActive ? guide.color : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `0 4px 12px ${guide.color}30` : 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 4px 12px ${guide.color}40`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isActive ? `0 4px 12px ${guide.color}30` : 'none';
                }}
              >
                <Icon size={20} />
              </button>
            );
          })}
        </div>

        {/* Content Viewer */}
        <div style={{ 
          flex: 1, 
          backgroundColor: '#ffffff', 
          border: '1px solid #cbd5e1', 
          borderRadius: '16px', 
          padding: '24px',
          overflowY: 'auto'
        }}>
          {activeGuide === 'widgets' ? (
            <WidgetDirectory />
          ) : (
            MAVI_GUIDES.map(guide => guide.id === activeGuide && (
              <div key={guide.id} className="markdown-body" style={{ color: '#334155', fontSize: '0.9rem', lineHeight: '1.6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
                  <guide.icon size={28} color={guide.color} />
                  <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>{guide.title}</h3>
                </div>
                <ReactMarkdown
                  components={{
                    img: ({node, ...props}) => (
                      <img 
                        style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', margin: '16px 0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                        {...props} 
                      />
                    )
                  }}
                >
                  {guide.content}
                </ReactMarkdown>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── RIGHT COLUMN: AI CHATBOT ────────────────────────────── */}
      <div style={{ 
        flex: '1', 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#0f172a',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        {/* Inline CSS for animations */}
        <style>{`
          @keyframes chatPulseGlow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
            50% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          }
          @keyframes chatTypingDot {
            0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
            40% { transform: scale(1); opacity: 1; }
          }
          @keyframes chatFadeSlideIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes chatShimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .mavi-chat-msg { animation: chatFadeSlideIn 0.3s ease-out forwards; }
          .mavi-chat-input:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.15) !important; }
          .mavi-chat-suggestion:hover { background: rgba(99,102,241,0.15) !important; border-color: #6366f1 !important; transform: translateY(-1px); }
          .mavi-chat-send:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 4px 15px rgba(99,102,241,0.4); }
          .mavi-chat-attach:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(148,163,184,0.4) !important; color: #a5b4fc !important; }
          .mavi-chat-scroll::-webkit-scrollbar { width: 4px; }
          .mavi-chat-scroll::-webkit-scrollbar-track { background: transparent; }
          .mavi-chat-scroll::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.25); border-radius: 4px; }
          .mavi-chat-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148,163,184,0.4); }
        `}</style>

        {/* ── Chat Header ── */}
        <div style={{ 
          padding: '16px 20px', 
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          borderBottom: '1px solid rgba(148,163,184,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative',
          zIndex: 2
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '40px', height: '40px', borderRadius: '12px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(99,102,241,0.35)',
              position: 'relative'
            }}>
              <Sparkles size={20} color="#fff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#f1f5f9', fontWeight: 700, letterSpacing: '-0.01em' }}>Mavi AI Assistant</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                <span style={{ 
                  width: '7px', height: '7px', borderRadius: '50%', 
                  backgroundColor: aiConnector ? '#10b981' : '#ef4444',
                  animation: aiConnector ? 'chatPulseGlow 2s ease-in-out infinite' : 'none'
                }} />
                <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 500 }}>
                  {aiConnector ? 'Online • Ready to assist' : 'Offline • Configure AI'}
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ 
              padding: '5px 10px', borderRadius: '8px', 
              background: 'rgba(99,102,241,0.12)', 
              fontSize: '0.65rem', color: '#a5b4fc', fontWeight: 600,
              letterSpacing: '0.05em', textTransform: 'uppercase'
            }}>
              AI Chat
            </div>
          </div>
        </div>

        {/* ── Chat Messages Area ── */}
        <div 
          ref={scrollRef}
          className="mavi-chat-scroll"
          style={{ 
            flex: 1, 
            padding: '20px', 
            overflowY: 'auto', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
            position: 'relative'
          }}
        >
          {/* Subtle background grid */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.03,
            backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
            backgroundSize: '24px 24px',
            pointerEvents: 'none'
          }} />

          {/* Welcome State — only shown if no user messages yet */}
          {messages.length <= 1 && !isLoading && (
            <div className="mavi-chat-msg" style={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', 
              justifyContent: 'center', flex: 1, gap: '20px', position: 'relative', zIndex: 1,
              paddingTop: '24px'
            }}>
              {/* Brand Logo */}
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '20px', 
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 30px rgba(99,102,241,0.3)',
                marginBottom: '4px'
              }}>
                <Sparkles size={30} color="#fff" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', color: '#f1f5f9', fontWeight: 700 }}>
                  Ada yang bisa saya bantu?
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', maxWidth: '320px', lineHeight: '1.5' }}>
                  Tanyakan apapun tentang Mavi — dari cara membuat aplikasi hingga konfigurasi PLC.
                </p>
              </div>

              {/* Quick Suggestion Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', maxWidth: '400px', marginTop: '4px' }}>
                {[
                  { icon: Layout, text: 'Cara membuat App baru' },
                  { icon: Cpu, text: 'Koneksi PLC Modbus' },
                  { icon: Zap, text: 'Setup Automation' },
                  { icon: BarChart3, text: 'Buat Dashboard OEE' }
                ].map((suggestion, i) => (
                  <button 
                    key={i}
                    className="mavi-chat-suggestion"
                    onClick={() => { setInput(suggestion.text); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '7px',
                      padding: '8px 14px', borderRadius: '12px',
                      background: 'rgba(51,65,85,0.4)',
                      border: '1px solid rgba(148,163,184,0.15)',
                      color: '#cbd5e1', fontSize: '0.78rem', fontWeight: 500,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    <suggestion.icon size={14} style={{ color: '#a5b4fc', flexShrink: 0 }} />
                    {suggestion.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Bubbles */}
          {messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            // Skip the initial welcome from the assistant if we're showing the welcome UI
            if (idx === 0 && messages.length <= 1 && !isLoading) return null;
            return (
              <div key={idx} className="mavi-chat-msg" style={{ 
                display: 'flex', 
                gap: '10px', 
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                position: 'relative',
                zIndex: 1
              }}>
                {!isUser && (
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '10px', 
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, marginTop: '2px',
                    boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
                  }}>
                    <Sparkles size={14} color="#fff" />
                  </div>
                )}
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ 
                    backgroundColor: isUser 
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)' 
                      : msg.isError 
                        ? 'rgba(239,68,68,0.1)' 
                        : 'rgba(30, 41, 59, 0.8)',
                    background: isUser 
                      ? 'linear-gradient(135deg, #4f46e5, #6366f1)' 
                      : msg.isError 
                        ? 'rgba(239,68,68,0.15)' 
                        : 'rgba(30, 41, 59, 0.8)',
                    border: msg.isError 
                      ? '1px solid rgba(239,68,68,0.25)' 
                      : '1px solid rgba(148,163,184,0.08)',
                    padding: '12px 16px',
                    borderRadius: '16px',
                    borderTopRightRadius: isUser ? '4px' : '16px',
                    borderTopLeftRadius: !isUser ? '4px' : '16px',
                    color: isUser ? '#ffffff' : msg.isError ? '#fca5a5' : '#e2e8f0',
                    fontSize: '0.88rem',
                    lineHeight: '1.6',
                    backdropFilter: 'blur(12px)',
                    boxShadow: isUser 
                      ? '0 4px 15px rgba(79,70,229,0.3)' 
                      : '0 2px 8px rgba(0,0,0,0.15)'
                  }}>
                    <div className="markdown-body" style={{ color: 'inherit' }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                </div>

                {isUser && (
                  <div style={{ 
                    width: '30px', height: '30px', borderRadius: '10px', 
                    background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    flexShrink: 0, marginTop: '2px',
                    boxShadow: '0 2px 8px rgba(79,70,229,0.3)'
                  }}>
                    <User size={14} color="#ffffff" />
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Typing Indicator */}
          {isLoading && (
            <div className="mavi-chat-msg" style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', position: 'relative', zIndex: 1 }}>
              <div style={{ 
                width: '30px', height: '30px', borderRadius: '10px', 
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                flexShrink: 0, marginTop: '2px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <div style={{ 
                background: 'rgba(30, 41, 59, 0.8)', 
                border: '1px solid rgba(148,163,184,0.08)',
                padding: '14px 20px', borderRadius: '16px', borderTopLeftRadius: '4px', 
                display: 'flex', alignItems: 'center', gap: '5px',
                backdropFilter: 'blur(12px)'
              }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    backgroundColor: '#a5b4fc',
                    display: 'inline-block',
                    animation: `chatTypingDot 1.4s ease-in-out ${i * 0.2}s infinite`
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Input Area ── */}
        <div style={{ 
          padding: '16px 16px 16px 16px', 
          background: 'linear-gradient(0deg, #0f172a 0%, rgba(15,23,42,0.95) 100%)',
          borderTop: '1px solid rgba(148,163,184,0.08)',
          position: 'relative', zIndex: 2
        }}>
          
          {/* Knowledge Base Chips */}
          {knowledgeFiles.length > 0 && (
            <div style={{ 
              padding: '8px 12px', 
              backgroundColor: 'rgba(30,41,59,0.6)', 
              borderRadius: '12px 12px 0 0', 
              display: 'flex', gap: '8px', flexWrap: 'wrap', 
              border: '1px solid rgba(148,163,184,0.1)', 
              borderBottom: 'none',
              marginBottom: '-1px'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', marginRight: '4px', fontWeight: 600 }}>
                <BookOpen size={12} style={{ marginRight: '4px' }}/> Referensi:
              </span>
              {knowledgeFiles.map(f => (
                <div key={f.id} style={{ 
                  display: 'flex', alignItems: 'center', gap: '4px', 
                  padding: '3px 8px', 
                  backgroundColor: 'rgba(99,102,241,0.1)', 
                  border: '1px solid rgba(99,102,241,0.2)', 
                  borderRadius: '8px', fontSize: '0.72rem', color: '#a5b4fc' 
                }}>
                  <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={f.name}>{f.name}</span>
                  <button onClick={() => handleDeleteFile(f.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div 
            className="mavi-chat-input"
            style={{ 
              display: 'flex', 
              alignItems: 'flex-end', 
              gap: '8px', 
              backgroundColor: 'rgba(30,41,59,0.6)',
              borderRadius: knowledgeFiles.length > 0 ? '0 0 14px 14px' : '14px',
              border: '1px solid rgba(148,163,184,0.12)',
              padding: '8px 8px 8px 16px',
              transition: 'all 0.25s ease',
              backdropFilter: 'blur(12px)'
            }}
          >
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apapun tentang cara kerja Mavi..."
              rows={1}
              style={{
                flex: 1,
                backgroundColor: 'transparent',
                border: 'none',
                color: '#e2e8f0',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none',
                maxHeight: '120px',
                paddingTop: '7px',
                fontFamily: 'inherit',
                lineHeight: '1.4'
              }}
              onInput={(e) => {
                e.target.style.height = 'auto';
                e.target.style.height = (e.target.scrollHeight <= 120 ? e.target.scrollHeight : 120) + 'px';
              }}
            />
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".txt,.csv,.json,.md,.js" style={{ display: 'none' }} />
            <button
              className="mavi-chat-attach"
              onClick={() => fileInputRef.current?.click()}
              title="Unggah Dokumen Referensi"
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                backgroundColor: 'transparent', color: '#64748b',
                border: '1px solid rgba(148,163,184,0.15)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.2s ease', flexShrink: 0
              }}
            >
              <Paperclip size={16} />
            </button>
            <button
              className="mavi-chat-send"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: (isLoading || !input.trim()) 
                  ? 'rgba(51,65,85,0.5)' 
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: (isLoading || !input.trim()) ? '#475569' : '#ffffff',
                border: 'none', 
                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.25s ease', flexShrink: 0,
                boxShadow: (isLoading || !input.trim()) ? 'none' : '0 2px 10px rgba(99,102,241,0.3)'
              }}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>

          {/* Powered by label */}
          <div style={{ 
            textAlign: 'center', marginTop: '8px', 
            fontSize: '0.62rem', color: '#475569', fontWeight: 500,
            letterSpacing: '0.03em'
          }}>
            Powered by Mavi AI Engine
          </div>
        </div>
      </div>
      
    </div>
  );
}

const WIDGET_DATABASE = [
  // 1. KONTROL & INPUT UI
  {
    id: 'BUTTON',
    name: 'Button (Tombol)',
    category: 'Kontrol & Input UI',
    icon: ToggleRight,
    color: '#3b82f6',
    fungsi: 'Memicu aksi, event, atau perubahan status ketika diklik oleh operator.',
    caraPakai: 'Tarik widget ke canvas. Konfigurasikan trigger pada event "ON_CLICK" untuk menyimpan data, pindah halaman, atau kontrol PLC.',
    konfigurasi: [
      { properti: 'text', deskripsi: 'Teks label tombol.' },
      { properti: 'backgroundColor', deskripsi: 'Warna latar tombol.' },
      { properti: 'enabled', deskripsi: 'Mengunci tombol agar tidak bisa diklik (true/false).' }
    ]
  },
  {
    id: 'SLIDER',
    name: 'Slider (Penggeser)',
    category: 'Kontrol & Input UI',
    icon: SlidersHorizontal,
    color: '#3b82f6',
    fungsi: 'Menginput nilai numerik secara kontinu dengan menggeser knob.',
    caraPakai: 'Tarik slider ke canvas, lalu hubungkan properti "thumbPosition" ke variabel PLC atau database.',
    konfigurasi: [
      { properti: 'minValue / maxValue', deskripsi: 'Skala minimum dan maksimum slider.' },
      { properti: 'numberOfSteps', deskripsi: 'Jumlah langkah pembagian geser.' }
    ]
  },
  {
    id: 'DROPDOWN',
    name: 'Dropdown Spinner (Pilihan)',
    category: 'Kontrol & Input UI',
    icon: ChevronDown,
    color: '#3b82f6',
    fungsi: 'Menampilkan daftar opsi drop-down untuk dipilih operator.',
    caraPakai: 'Masukkan pilihan pada properti "elements" atau hubungkan ke kolom database.',
    konfigurasi: [
      { properti: 'elements', deskripsi: 'Daftar item pilihan (array).' },
      { properti: 'selection', deskripsi: 'Item terpilih saat ini.' }
    ]
  },
  {
    id: 'BOOLEAN_TOGGLE',
    name: 'Switch (Saklar)',
    category: 'Kontrol & Input UI',
    icon: ToggleRight,
    color: '#3b82f6',
    fungsi: 'Saklar biner On/Off (True/False).',
    caraPakai: 'Petakan properti "on" langsung ke register PLC (Modbus Coil atau MQTT state).',
    konfigurasi: [
      { properti: 'on', deskripsi: 'Status aktif (true/false).' },
      { properti: 'trackColorActive', deskripsi: 'Warna track saat ON.' }
    ]
  },
  {
    id: 'TEXT_INPUT',
    name: 'TextBox (Input Teks)',
    category: 'Kontrol & Input UI',
    icon: Type,
    color: '#3b82f6',
    fungsi: 'Kolom input satu baris teks atau angka.',
    caraPakai: 'Gunakan untuk form input. Aktifkan "numbersOnly" jika hanya menerima angka.',
    konfigurasi: [
      { properti: 'hint', deskripsi: 'Placeholder teks abu-abu.' },
      { properti: 'numbersOnly', deskripsi: 'Hanya menerima angka (true/false).' }
    ]
  },
  {
    id: 'TEXT_AREA',
    name: 'NotesArea (Catatan Multi-baris)',
    category: 'Kontrol & Input UI',
    icon: AlignLeft,
    color: '#3b82f6',
    fungsi: 'Kolom input teks besar multi-baris.',
    caraPakai: 'Cocok digunakan untuk menulis alasan downtime atau deskripsi defect produk.',
    konfigurasi: [
      { properti: 'text', deskripsi: 'Isi teks catatan.' },
      { properti: 'hint', deskripsi: 'Placeholder teks instruksi.' }
    ]
  },
  {
    id: 'DATETIME_PICKER',
    name: 'DateTimePicker (Pemilih Waktu)',
    category: 'Kontrol & Input UI',
    icon: Calendar,
    color: '#3b82f6',
    fungsi: 'Pemilih tanggal & waktu visual.',
    caraPakai: 'Pilih waktu dan tanggal untuk data log atau form jadwal pemeliharaan.',
    konfigurasi: [
      { properti: 'instant', deskripsi: 'Menyimpan format ISO Date-Time terpilih.' }
    ]
  },
  {
    id: 'FILE_PICKER',
    name: 'FilePicker (Unggah File)',
    category: 'Kontrol & Input UI',
    icon: FolderOpen,
    color: '#3b82f6',
    fungsi: 'Mengunggah berbagai berkas berkategori umum ke server.',
    caraPakai: 'Gunakan untuk melampirkan berkas konfigurasi CSV atau dokumen audit.',
    konfigurasi: [
      { properti: 'mimeType', deskripsi: 'Filter tipe berkas (misal: text/csv, */*).' }
    ]
  },
  {
    id: 'IMAGE_PICKER',
    name: 'ImagePicker (Unggah Gambar)',
    category: 'Kontrol & Input UI',
    icon: Camera,
    color: '#3b82f6',
    fungsi: 'Memilih dan mengunggah gambar dari kamera atau galeri lokal.',
    caraPakai: 'Dipakai pada form laporan defect/kerusakan material visual.',
    konfigurasi: [
      { properti: 'selection', deskripsi: 'Path gambar yang berhasil diunggah.' }
    ]
  },
  {
    id: 'MULTI_SELECT',
    name: 'MultiSelect Dropdown',
    category: 'Kontrol & Input UI',
    icon: Grid3X3,
    color: '#3b82f6',
    fungsi: 'Dropdown yang mengizinkan memilih lebih dari satu opsi sekaligus.',
    caraPakai: 'Operator menandai beberapa stasiun kerja atau defect code sekaligus.',
    konfigurasi: [
      { properti: 'options', deskripsi: 'Daftar semua opsi yang tersedia.' },
      { properti: 'selection', deskripsi: 'Array opsi terpilih.' }
    ]
  },
  {
    id: 'NUMBER_INPUT',
    name: 'Number Input',
    category: 'Kontrol & Input UI',
    icon: Hash,
    color: '#3b82f6',
    fungsi: 'Input numerik presisi khusus.',
    caraPakai: 'Menginput parameter angka langsung menggunakan tombol up-down bawaan browser.',
    konfigurasi: [
      { properti: 'triggers', deskripsi: 'Aksi saat nilai angka berubah.' }
    ]
  },
  {
    id: 'NUMPAD',
    name: 'Numeric Numpad (Keypad Numerik)',
    category: 'Kontrol & Input UI',
    icon: Grid3X3,
    color: '#3b82f6',
    fungsi: 'Keypad numerik virtual di layar sentuh HMI operator.',
    caraPakai: 'Sangat berguna jika PC HMI operator di lapangan tidak dilengkapi keyboard fisik.',
    konfigurasi: [
      { properti: 'targetVariable', deskripsi: 'Variabel penampung hasil ketikan angka.' },
      { properti: 'allowDecimal', deskripsi: 'Mengizinkan tanda desimal koma/titik.' }
    ]
  },
  {
    id: 'KEYBOARD_PRO',
    name: 'Keyboard UI/UX Pro (Keyboard Virtual)',
    category: 'Kontrol & Input UI',
    icon: Keyboard,
    color: '#3b82f6',
    fungsi: 'Keyboard virtual qwerty penuh di layar sentuh stasiun operator.',
    caraPakai: 'Letakkan di bagian bawah halaman pengisian formulir operator.',
    konfigurasi: [
      { properti: 'theme', deskripsi: 'Tema keyboard (light / dark).' },
      { properti: 'targetVariable', deskripsi: 'Nama variabel teks penerima input ketikan.' }
    ]
  },

  // 2. VISUALISASI & ANALISIS
  {
    id: 'GAUGE',
    name: 'Gauge (KPI Indikator)',
    category: 'Visualisasi & Analisis',
    icon: Cpu,
    color: '#10b981',
    fungsi: 'Menampilkan data numerik sensor real-time dalam format meteran busur/speedometer.',
    caraPakai: 'Hubungkan properti "value" ke PLC tag suhu, tekanan, kelembaban, atau persentase OEE.',
    konfigurasi: [
      { properti: 'value', deskripsi: 'Nilai numerik saat ini.' },
      { properti: 'min / max', deskripsi: 'Skala minimum dan maksimum gauge.' },
      { properti: 'unit', deskripsi: 'Satuan unit (misal: %, °C, Bar, kg).' }
    ]
  },
  {
    id: 'GAUGE_CIRCULAR',
    name: 'Circular Gauge (Gauge Lingkaran)',
    category: 'Visualisasi & Analisis',
    icon: RotateCw,
    color: '#10b981',
    fungsi: 'Indikator gauge melingkar 360 derajat.',
    caraPakai: 'Menampilkan data utilitas stasiun kerja atau sisa kapasitas penyimpanan tangki material.',
    konfigurasi: [
      { properti: 'value', deskripsi: 'Nilai persentase/skala aktif.' },
      { properti: 'color', deskripsi: 'Warna strip lingkar gauge.' }
    ]
  },
  {
    id: 'DIAL_GAUGE',
    name: 'Dial Gauge (Jarum Presisi)',
    category: 'Visualisasi & Analisis',
    icon: Clock,
    color: '#10b981',
    fungsi: 'Gauge jarum melingkar presisi tinggi (seperti jam dial indikator metrologi).',
    caraPakai: 'Cocok digunakan di stasiun kalibrasi dimensi produk logam presisi.',
    konfigurasi: [
      { properti: 'title', deskripsi: 'Nama instrumen dial.' },
      { properti: 'value', deskripsi: 'Nilai presisi aktif (misal: dalam mm).' }
    ]
  },
  {
    id: 'CHART',
    name: 'Chart (Grafik Analisa)',
    category: 'Visualisasi & Analisis',
    icon: BarChart3,
    color: '#10b981',
    fungsi: 'Menggambar grafik tren real-time atau data historis database (Line, Bar, Pie).',
    caraPakai: 'Gunakan bersama widget "ChartData2D" untuk memvisualisasikan data cacat QC atau downtime pabrik.',
    konfigurasi: [
      { properti: 'type', deskripsi: 'Bentuk grafik (Line / Bar / Pie).' },
      { properti: 'gridEnabled', deskripsi: 'Menampilkan grid koordinat grafik.' }
    ]
  },
  {
    id: 'CHART_DATA_2D',
    name: 'ChartData2D (Seri Data Grafik)',
    category: 'Visualisasi & Analisis',
    icon: BarChart3,
    color: '#10b981',
    fungsi: 'Mewakili satu seri data di dalam widget Chart induk.',
    caraPakai: 'Tempatkan di dalam Chart. Masukkan kueri SQL/database sebagai datasource.',
    konfigurasi: [
      { properti: 'label', deskripsi: 'Nama seri data (legenda).' },
      { properti: 'color', deskripsi: 'Warna garis/batang grafik seri ini.' }
    ]
  },
  {
    id: 'TRENDLINE',
    name: 'Trendline (Garis Tren)',
    category: 'Visualisasi & Analisis',
    icon: Activity,
    color: '#10b981',
    fungsi: 'Menampilkan garis tren rata-rata pergerakan data di chart untuk analisis prediktif.',
    caraPakai: 'Tambahkan pada chart throughput produksi stasiun.',
    konfigurasi: [
      { properti: 'model', deskripsi: 'Model regresi tren (Linear, Logarithmic, dll).' }
    ]
  },
  {
    id: 'INTERACTIVE_TABLE',
    name: 'Data Table (Tabel Interaktif)',
    category: 'Visualisasi & Analisis',
    icon: Table,
    color: '#10b981',
    fungsi: 'Tabel data interaktif yang mendukung pencarian, filter, dan export Excel.',
    caraPakai: 'Gunakan untuk list antrean Work Order stasiun kerja operator. Bind properti "tableId".',
    konfigurasi: [
      { properti: 'tableId', deskripsi: 'ID tabel database Mavi sumber data.' },
      { properti: 'pageSize', deskripsi: 'Jumlah baris data per halaman.' }
    ]
  },
  {
    id: 'TABLE_AGGREGATION',
    name: 'Table Aggregation (Total/Rata-rata)',
    category: 'Visualisasi & Analisis',
    icon: BarChart3,
    color: '#10b981',
    fungsi: 'Mengkalkulasi dan menampilkan nilai agregasi (SUM, AVG, COUNT) dari suatu kolom database.',
    caraPakai: 'Berguna untuk menampilkan total produk OK hari ini secara real-time di atas dashboard.',
    konfigurasi: [
      { properti: 'calculation', deskripsi: 'Aksi kalkulasi (COUNT, SUM, AVG, MIN, MAX).' },
      { properti: 'column', deskripsi: 'Nama kolom database target.' }
    ]
  },
  {
    id: 'RECORD_DISPLAY',
    name: 'Record Card (Kartu Data)',
    category: 'Visualisasi & Analisis',
    icon: Table,
    color: '#10b981',
    fungsi: 'Menampilkan detail seluruh kolom dari satu baris data terpilih dalam bentuk card.',
    caraPakai: 'Hubungkan dengan stasiun operator untuk menampilkan detail Work Order yang sedang berjalan.',
    konfigurasi: [
      { properti: 'placeholderId', deskripsi: 'ID record placeholder target database.' },
      { properti: 'fieldsToShow', deskripsi: 'Daftar nama kolom yang ingin diperlihatkan.' }
    ]
  },
  {
    id: 'ANALYTIC',
    name: 'Analytic (Kalkulasi OEE)',
    category: 'Visualisasi & Analisis',
    icon: BarChart3,
    color: '#10b981',
    fungsi: 'Menampilkan visualisasi OEE, downtime, atau total output stasiun dari Analysis Manager.',
    caraPakai: 'Tarik ke dashboard supervisor stasiun untuk memantau performa langsung lini.',
    konfigurasi: [
      { properti: 'analysisId', deskripsi: 'ID Analisis terdaftar di sistem.' },
      { properti: 'refreshSeconds', deskripsi: 'Interval pembaruan data analisis.' }
    ]
  },
  {
    id: 'LEAN_DASHBOARD_WIDGET',
    name: 'Lean Dashboard MES (Status Harian)',
    category: 'Visualisasi & Analisis',
    icon: Layout,
    color: '#10b981',
    fungsi: 'Laporan visual matriks Lean Manufacturing (SQDCM: Safety, Quality, Delivery, Cost, Morale).',
    caraPakai: 'Menggambarkan status 31 hari performa kepatuhan (hijau/merah) di lantai pabrik.',
    konfigurasi: [
      { properti: 'letter', deskripsi: 'Indikator huruf stasiun (S/Q/D/C/M).' },
      { properti: 'incidents', deskripsi: 'String status bulanan (31 karakter Y/N).' }
    ]
  },
  {
    id: 'STEP_TIME',
    name: 'Step Time (Waktu Siklus)',
    category: 'Visualisasi & Analisis',
    icon: Clock,
    color: '#10b981',
    fungsi: 'Melacak waktu yang dihabiskan operator untuk memproses langkah pekerjaan (Takt Time).',
    caraPakai: 'Mulai otomatis ketika stasiun assembly dibuka, dan simpan hasilnya setelah selesai.',
    konfigurasi: [
      { properti: 'mode', deskripsi: 'Mode waktu (ELAPSED berlalu, COUNTDOWN hitung mundur).' }
    ]
  },
  {
    id: 'GRID',
    name: 'Grid Layout (Tata Letak)',
    category: 'Visualisasi & Analisis',
    icon: LayoutGrid,
    color: '#10b981',
    fungsi: 'Mengelompokkan susunan widget anak ke dalam grid kolom & baris.',
    caraPakai: 'Gunakan sebagai container utama halaman form agar tampilan widget rapi & auto-align.',
    konfigurasi: [
      { properti: 'rows / cols', deskripsi: 'Jumlah baris dan kolom kisi.' }
    ]
  },
  {
    id: 'MACHINE_ATTRIBUTE',
    name: 'Machine Attribute (Variabel Mesin)',
    category: 'Visualisasi & Analisis',
    icon: Cpu,
    color: '#10b981',
    fungsi: 'Menampilkan nilai atribut tertentu dari profil mesin pabrik.',
    caraPakai: 'Menampilkan atribut "Suhu Maksimum" atau "Model Motor" di halaman detail mesin.',
    konfigurasi: [
      { properti: 'machineId', deskripsi: 'ID mesin terdaftar.' },
      { properti: 'attribute', deskripsi: 'Nama atribut target.' }
    ]
  },
  {
    id: 'MACHINE_TIMELINE',
    name: 'Machine Timeline (Linimasa Status)',
    category: 'Visualisasi & Analisis',
    icon: Activity,
    color: '#10b981',
    fungsi: 'Menampilkan chart batang berwarna horizontal riwayat status mesin (Running/Idle/Stop) dalam periode waktu.',
    caraPakai: 'Tarik ke dashboard manajemen mesin untuk melacak utilisasi downtime historis.',
    konfigurasi: [
      { properti: 'machineId', deskripsi: 'ID mesin terdaftar.' },
      { properti: 'timeRange', deskripsi: 'Rentang waktu (misal: 8h, 24h, 7d).' }
    ]
  },

  // 3. IOT & SENSOR PERANGKAT
  {
    id: 'SMARTHOME_DEVICE',
    name: 'SmartHome Controller',
    category: 'IoT & Sensor Perangkat',
    icon: Cpu,
    color: '#f59e0b',
    fungsi: 'Mengontrol perangkat IoT pintar rumahan/kantor seperti saklar pintar, lampu, dan AC.',
    caraPakai: 'Hubungkan ke Tuya/Shelly/Sonoff lokal untuk kontrol ventilasi stasiun.',
    konfigurasi: [
      { properti: 'deviceBrand', deskripsi: 'Protokol/Brand modul (TUYA, BARDI, SHELLY, CUSTOM).' },
      { properti: 'mqttPublishTopic', deskripsi: 'Topik MQTT publish kontrol instruksi.' }
    ]
  },
  {
    id: 'TUYA_PRODUCT',
    name: 'Tuya Smart IoT Product (Pencahayaan/Relay)',
    category: 'IoT & Sensor Perangkat',
    icon: Cpu,
    color: '#f59e0b',
    fungsi: 'Mengontrol parameter detail produk ekosistem pintar Tuya IoT.',
    caraPakai: 'Mengatur tingkat kecerahan lampu inspeksi visual atau mengaktifkan smart-plug.',
    konfigurasi: [
      { properti: 'productCase', deskripsi: 'Jenis produk (LIGHTING, CAMERA, PLUG, SENSOR).' },
      { properti: 'brightness / colorHex', deskripsi: 'Tingkat kecerahan dan warna lampu RGB.' }
    ]
  },
  {
    id: 'IOT_DEVICE',
    name: 'IoT Connector (MQTT Client)',
    category: 'IoT & Sensor Perangkat',
    icon: Globe,
    color: '#f59e0b',
    fungsi: 'Menghubungkan HMI Mavi ke broker MQTT industri secara dua arah.',
    caraPakai: 'Gunakan untuk integrasi node IoT kustom (ESP32/Raspberry Pi) di lantai produksi.',
    konfigurasi: [
      { properti: 'topic', deskripsi: 'Topik MQTT broker tempat data dibaca atau ditulis.' }
    ]
  },
  {
    id: 'CLOCK',
    name: 'Clock (Sensor Waktu/Jam)',
    category: 'IoT & Sensor Perangkat',
    icon: Clock,
    color: '#f59e0b',
    fungsi: 'Menampilkan jam digital real-time dan memicu event interval periodik.',
    caraPakai: 'Memicu pembacaan sensor berkala setiap 5 detik.',
    konfigurasi: [
      { properti: 'timeInterval', deskripsi: 'Jeda interval eksekusi berulang (ms).' }
    ]
  },
  {
    id: 'ACCELEROMETER',
    name: 'Accelerometer Sensor',
    category: 'IoT & Sensor Perangkat',
    icon: Activity,
    color: '#f59e0b',
    fungsi: 'Mendeteksi getaran, akselerasi, dan guncangan pada perangkat mobile operator.',
    caraPakai: 'Mendeteksi guncangan abnormal pada unit pembawa material.',
    konfigurasi: [
      { properti: 'sensitivity', deskripsi: 'Sensitivitas tangkapan sensor (LOW, MODERATE, HIGH).' }
    ]
  },
  {
    id: 'BAROMETER',
    name: 'Barometer Sensor (Tekanan Udara)',
    category: 'IoT & Sensor Perangkat',
    icon: Wind,
    color: '#f59e0b',
    fungsi: 'Mengukur tekanan atmosfer lingkungan stasiun kerja.',
    caraPakai: 'Pasang pada stasiun steril/cleanroom untuk memantau kestabilan tekanan ruangan.',
    konfigurasi: [
      { properti: 'refreshTime', deskripsi: 'Interval pembacaan ulang (ms).' }
    ]
  },
  {
    id: 'GYROSCOPE_SENSOR',
    name: 'Gyroscope Sensor (Kemiringan)',
    category: 'IoT & Sensor Perangkat',
    icon: Compass,
    color: '#f59e0b',
    fungsi: 'Mengukur rotasi dan tingkat kemiringan sudut perangkat operator.',
    caraPakai: 'Melacak sudut kemiringan lengan manipulator robotik kustom.',
    konfigurasi: [
      { properti: 'enabled', deskripsi: 'Mengaktifkan sensor (true/false).' }
    ]
  },
  {
    id: 'HYGROMETER',
    name: 'Hygrometer Sensor (Kelembaban)',
    category: 'IoT & Sensor Perangkat',
    icon: RotateCw,
    color: '#f59e0b',
    fungsi: 'Mengukur tingkat kelembaban udara sekitar stasiun.',
    caraPakai: 'Dipasang pada gudang penyimpanan bahan baku kimia sensitif kelembaban.',
    konfigurasi: [
      { properti: 'refreshTime', deskripsi: 'Waktu refresh data (ms).' }
    ]
  },
  {
    id: 'LIGHT_SENSOR',
    name: 'Light Sensor (Intensitas Cahaya)',
    category: 'IoT & Sensor Perangkat',
    icon: Sun,
    color: '#f59e0b',
    fungsi: 'Mengukur intensitas cahaya (lux) di sekitar area kerja.',
    caraPakai: 'Memastikan stasiun inspeksi visual QC memiliki pencahayaan yang cukup sesuai SOP.',
    konfigurasi: [
      { properti: 'enabled', deskripsi: 'Status sensor.' }
    ]
  },
  {
    id: 'LOCATION_SENSOR',
    name: 'Location Sensor (GPS)',
    category: 'IoT & Sensor Perangkat',
    icon: MapPin,
    color: '#f59e0b',
    fungsi: 'Mendeteksi koordinat lokasi geografis stasiun kerja bergerak operator.',
    caraPakai: 'Dipakai pada tablet operator logistik luar ruangan (yard management).',
    konfigurasi: [
      { properti: 'distanceInterval', deskripsi: 'Perpindahan jarak minimum untuk update data (meter).' }
    ]
  },
  {
    id: 'MAGNETIC_FIELD_SENSOR',
    name: 'Magnetic Field Sensor',
    category: 'IoT & Sensor Perangkat',
    icon: Compass,
    color: '#f59e0b',
    fungsi: 'Mengukur kekuatan medan magnet di sekitar perangkat.',
    caraPakai: 'Mendeteksi kedekatan pelindung mesin logam magnetic safety-switch.',
    konfigurasi: [
      { properti: 'enabled', deskripsi: 'Mengaktifkan sensor.' }
    ]
  },
  {
    id: 'NEAR_FIELD',
    name: 'NearField (Sensor NFC)',
    category: 'IoT & Sensor Perangkat',
    icon: CreditCard,
    color: '#f59e0b',
    fungsi: 'Membaca atau menulis data ke kartu/tag NFC.',
    caraPakai: 'Operator menempelkan badge karyawan ke tablet HMI stasiun untuk melakukan log-in.',
    konfigurasi: [
      { properti: 'readMode', deskripsi: 'Set ke true untuk membaca tag, false untuk menulis tag.' }
    ]
  },
  {
    id: 'ORIENTATION_SENSOR',
    name: 'Orientation Sensor',
    category: 'IoT & Sensor Perangkat',
    icon: Compass,
    color: '#f59e0b',
    fungsi: 'Menangkap data orientasi rotasi 3D (Roll, Pitch, Azimuth) perangkat.',
    caraPakai: 'Mendeteksi pergeseran kemiringan fixture penampang material.',
    konfigurasi: [
      { properti: 'enabled', deskripsi: 'Status aktif sensor.' }
    ]
  },
  {
    id: 'PEDOMETER',
    name: 'Pedometer (Penghitung Langkah)',
    category: 'IoT & Sensor Perangkat',
    icon: Clock,
    color: '#f59e0b',
    fungsi: 'Menghitung jumlah langkah kaki operator di area lantai pabrik.',
    caraPakai: 'Melacak produktivitas fisik operator patroli pemeliharaan preventif.',
    konfigurasi: [
      { properti: 'strideLength', deskripsi: 'Panjang rata-rata langkah kaki operator (meter).' }
    ]
  },
  {
    id: 'PROXIMITY_SENSOR',
    name: 'Proximity Sensor (Sensor Jarak Dekat)',
    category: 'IoT & Sensor Perangkat',
    icon: Activity,
    color: '#f59e0b',
    fungsi: 'Mendeteksi keberadaan objek tanpa kontak fisik langsung.',
    caraPakai: 'Mendeteksi apakah penutup kaca keselamatan mesin CNC sedang terbuka.',
    konfigurasi: [
      { properti: 'enabled', deskripsi: 'Status sensor.' }
    ]
  },
  {
    id: 'THERMOMETER',
    name: 'Thermometer Sensor (Suhu Perangkat)',
    category: 'IoT & Sensor Perangkat',
    icon: Thermometer,
    color: '#f59e0b',
    fungsi: 'Mengukur suhu internal prosessor perangkat operator/gateway.',
    caraPakai: 'Memantau overheat box panel HMI luar ruangan.',
    konfigurasi: [
      { properti: 'refreshTime', deskripsi: 'Jeda pembacaan ulang suhu (ms).' }
    ]
  },
  {
    id: 'OBD2_SCANNER',
    name: 'OBD2 Scanner (Diagnostik Kendaraan)',
    category: 'IoT & Sensor Perangkat',
    icon: Car,
    color: '#f59e0b',
    fungsi: 'Menyambung ke OBD2 adapter kendaraan via Bluetooth/Serial untuk membaca data ECU mobil.',
    caraPakai: 'Gunakan pada stasiun uji coba akhir pabrik perakitan otomotif.',
    konfigurasi: [
      { properti: 'transport', deskripsi: 'Tipe koneksi komunikasi (BLUETOOTH / SERIAL).' },
      { properti: 'pid', deskripsi: 'Daftar PID standard (misal: 010C untuk RPM).' }
    ]
  },
  {
    id: 'OBD2_RPM',
    name: 'OBD2 Engine RPM',
    category: 'IoT & Sensor Perangkat',
    icon: Gauge,
    color: '#f59e0b',
    fungsi: 'Menampilkan data kecepatan rotasi mesin (RPM) dari ECU kendaraan.',
    caraPakai: 'Gunakan untuk pengujian stasioner mesin mobil.',
    konfigurasi: [
      { properti: 'value', deskripsi: 'Nilai RPM mesin terbaca.' }
    ]
  },
  {
    id: 'OBD2_SPEED',
    name: 'OBD2 Vehicle Speed',
    category: 'IoT & Sensor Perangkat',
    icon: TrendingUp,
    color: '#f59e0b',
    fungsi: 'Menampilkan kecepatan laju kendaraan aktual dari ECU.',
    caraPakai: 'Dipasang pada modul HMI dinamis kendaraan logistik internal AGV.',
    konfigurasi: [
      { properti: 'value', deskripsi: 'Kecepatan laju (km/h).' }
    ]
  },

  // 4. INDUSTRI & QC
  {
    id: 'MACHINE_STATUS',
    name: 'Machine Status (Status Mesin)',
    category: 'Industri & QC',
    icon: Zap,
    color: '#ec4899',
    fungsi: 'Menampilkan status operasional mesin dengan warna industri (Merah, Hijau, Kuning).',
    caraPakai: 'Hubungkan properti "status" ke register PLC yang melambangkan status mesin.',
    konfigurasi: [
      { properti: 'status', deskripsi: 'Status mesin (RUNNING, STOPPED, FAULT).' },
      { properti: 'runningColor / stoppedColor', deskripsi: 'Kustomisasi warna untuk masing-masing status.' }
    ]
  },
  {
    id: 'CAMERA_SCANNER',
    name: 'Camera Scanner (Scan QR/Barcode)',
    category: 'Industri & QC',
    icon: Eye,
    color: '#ec4899',
    fungsi: 'Memindai barcode, QR code, atau kode matriks data produk via kamera bawaan perangkat.',
    caraPakai: 'Gunakan di awal stasiun kerja untuk scan barcode pada Work Order atau material.',
    konfigurasi: [
      { properti: 'scanType', deskripsi: 'Filter pemindaian (QR_CODE, BARCODE, atau ALL).' },
      { properti: 'active', deskripsi: 'Mengaktifkan/menonaktifkan streaming kamera (true/false).' }
    ]
  },
  {
    id: 'VISION_DETECTOR',
    name: 'Vision AI OCR (Pembaca Teks Visual)',
    category: 'Industri & QC',
    icon: Eye,
    color: '#ec4899',
    fungsi: 'Menggunakan model AI vision untuk membaca teks (OCR) dari tangkapan kamera secara real-time.',
    caraPakai: 'Mengidentifikasi serial number produk yang terukir pada plat logam secara otomatis.',
    konfigurasi: [
      { properti: 'label', deskripsi: 'Judul area bidik kamera.' }
    ]
  },
  {
    id: 'VISION_MEASUREMENT',
    name: 'Vision Measurement (Pengukuran AI)',
    category: 'Industri & QC',
    icon: Camera,
    color: '#ec4899',
    fungsi: 'Mengukur dimensi benda secara visual menggunakan model AI Vision.',
    caraPakai: 'Letakkan produk di bawah kamera inspeksi QC, dan sistem akan mengukur ketebalan/panjang otomatis.',
    konfigurasi: [
      { properti: 'unit', deskripsi: 'Satuan pengukuran (mm/inch).' },
      { properti: 'precision', deskripsi: 'Akurasi angka di belakang koma.' }
    ]
  },
  {
    id: 'MEASUREMENT_WIDGET',
    name: 'Measurement (Caliper & Micrometer)',
    category: 'Industri & QC',
    icon: Scale,
    color: '#ec4899',
    fungsi: 'Mengambil data numerik presisi dari alat ukur digital (Caliper/Micrometer) via Serial COM Port.',
    caraPakai: 'QC menempelkan caliper ke produk, menekan tombol kirim data di caliper, dan widget otomatis menangkap nilai tersebut.',
    konfigurasi: [
      { properti: 'connectionType', deskripsi: 'Jenis koneksi komunikasi hardware (SERIAL / USB).' },
      { properti: 'baudRate', deskripsi: 'Kecepatan komunikasi data port (default: 9600).' }
    ]
  },
  {
    id: 'TORQUE_WRENCH',
    name: 'Torque Wrench (Kunci Torsi)',
    category: 'Industri & QC',
    icon: Wrench,
    color: '#ec4899',
    fungsi: 'Membaca besaran nilai torsi kekencangan baut dari kunci torsi elektrik digital via Serial COM.',
    caraPakai: 'Gunakan pada stasiun assembly komponen otomotif guna mencatat nilai pengencangan baut.',
    konfigurasi: [
      { properti: 'unit', deskripsi: 'Satuan torsi (Nm / Ft-Lbs).' }
    ]
  },
  {
    id: 'WEIGHING_SCALE',
    name: 'Weighing Scale (Timbangan Industri)',
    category: 'Industri & QC',
    icon: Scale,
    color: '#ec4899',
    fungsi: 'Menangkap nilai berat material dari timbangan digital industri secara langsung.',
    caraPakai: 'Gunakan untuk penimbangan material sisa, pencatatan berat kemasan akhir, atau inspeksi berat produk.',
    konfigurasi: [
      { properti: 'unit', deskripsi: 'Satuan berat (kg, g, lbs).' }
    ]
  },
  {
    id: 'SIGNATURE_PAD',
    name: 'Signature Pad (Tanda Tangan Manual)',
    category: 'Industri & QC',
    icon: PenTool,
    color: '#ec4899',
    fungsi: 'Menggambar tanda tangan langsung pada layar menggunakan stylus pen atau jari.',
    caraPakai: 'Operator atau supervisor menandatangani form serah terima batch produksi secara manual.',
    konfigurasi: [
      { properti: 'pencolor', deskripsi: 'Warna coretan garis tanda tangan.' }
    ]
  },
  {
    id: 'SIGNATURE',
    name: 'Electronic Signature (Otorisasi Digital)',
    category: 'Industri & QC',
    icon: ShieldCheck,
    color: '#ec4899',
    fungsi: 'Melakukan otorisasi digital operator/supervisor yang sah menggunakan e-sign aman.',
    caraPakai: 'Mencegah langkah produksi berlanjut sebelum disetujui (sign-off) oleh supervisor QC.',
    konfigurasi: [
      { properti: 'signatureMeaning', deskripsi: 'Pernyataan arti tanda tangan (misal: "Saya menyatakan batch ini aman").' },
      { properti: 'signeeType', deskripsi: 'Siapa yang boleh menandatangani (ANY_OPERATOR, APP_EXECUTOR, dll).' }
    ]
  },
  {
    id: 'ARDUINO_BOARD',
    name: 'Arduino Board (Konfigurasi Board)',
    category: 'Industri & QC',
    icon: Cpu,
    color: '#ec4899',
    fungsi: 'Menyambungkan board mikrokontroler Arduino ke stasiun kerja via Serial USB.',
    caraPakai: 'Letakkan satu widget ini per board di canvas untuk inisialisasi koneksi port.',
    konfigurasi: [
      { properti: 'boardType', deskripsi: 'Jenis board (UNO, MEGA, NANO, ESP32).' },
      { properti: 'port', deskripsi: 'COM Port (misal: COM3).' }
    ]
  },
  {
    id: 'ARDUINO_CONTROLLER',
    name: 'Arduino Pin Controller (Keluaran Relay)',
    category: 'Industri & QC',
    icon: ToggleRight,
    color: '#ec4899',
    fungsi: 'Mengirimkan perintah output digital (High/Low) atau analog (PWM) ke pin Arduino.',
    caraPakai: 'Gunakan untuk menyalakan lampu sirine tower-light atau mengaktifkan solenoid valve.',
    konfigurasi: [
      { properti: 'pin', deskripsi: 'Nomor pin keluaran Arduino.' },
      { properti: 'controlType', deskripsi: 'Metode aksi (TOGGLE, BUTTON, SLIDER).' }
    ]
  },
  {
    id: 'ARDUINO_JOYSTICK',
    name: 'Arduino XY Joystick',
    category: 'Industri & QC',
    icon: Gamepad2,
    color: '#ec4899',
    fungsi: 'Membaca posisi stik joystick XY analog yang terhubung ke board Arduino.',
    caraPakai: 'Menggerakkan lengan manipulator robot atau mengatur arah conveyor manual.',
    konfigurasi: [
      { properti: 'targetVariable', deskripsi: 'Variabel penerima data posisi XY.' }
    ]
  },
  {
    id: 'ARDUINO_KEYPAD',
    name: 'Arduino 4x4 Keypad',
    category: 'Industri & QC',
    icon: Grid3X3,
    color: '#ec4899',
    fungsi: 'Menangkap tombol yang ditekan pada keypad matriks fisik 4x4.',
    caraPakai: 'Operator memasukkan pin otorisasi pada tombol keypad fisik di stasiun.',
    konfigurasi: [
      { properti: 'lastKeyPressed', deskripsi: 'Tombol terakhir yang ditekan operator.' }
    ]
  },
  {
    id: 'ARDUINO_SCADA_ESTOP',
    name: 'SCADA Emergency Stop (Tombol E-Stop)',
    category: 'Industri & QC',
    icon: Power,
    color: '#ec4899',
    fungsi: 'Tombol stop darurat berukuran besar di layar untuk memicu pemberhentian instan mesin.',
    caraPakai: 'Operator menekan tombol E-Stop ini untuk memutus daya PLC jika terjadi bahaya.',
    konfigurasi: [
      { properti: 'requireConfirmation', deskripsi: 'Konfirmasi tambahan "Apakah Anda yakin?" (true/false).' }
    ]
  },
  {
    id: 'ARDUINO_SCADA_PID',
    name: 'SCADA PID Faceplate',
    category: 'Industri & QC',
    icon: BarChart3,
    color: '#ec4899',
    fungsi: 'Tampilan kontrol PID loop industri (menampilkan SP, PV, OP, dan parameter Kp, Ki, Kd).',
    caraPakai: 'Gunakan untuk menyetel parameter loop suhu oven pembakaran.',
    konfigurasi: [
      { properti: 'sp / pv / op', deskripsi: 'Setpoint, Process Value, dan Output Value.' },
      { properti: 'mode', deskripsi: 'Mode kontrol loop (AUTO / MANUAL).' }
    ]
  },
  {
    id: 'SCADA_MOTOR',
    name: 'SCADA Motor Driver',
    category: 'Industri & QC',
    icon: Cog,
    color: '#ec4899',
    fungsi: 'Menggambarkan visualisasi motor industri (menampilkan RPM, arus listrik, dan status).',
    caraPakai: 'Gunakan untuk mengawasi status kompresor angin atau motor utama stasiun.',
    konfigurasi: [
      { properti: 'motorState', deskripsi: 'Status motor (RUNNING, STOPPED, FAULT).' },
      { properti: 'rpm / current', deskripsi: 'Putaran per menit dan konsumsi arus listrik.' }
    ]
  },
  {
    id: 'SCADA_CONVEYOR',
    name: 'SCADA Conveyor Belt',
    category: 'Industri & QC',
    icon: ArrowRight,
    color: '#ec4899',
    fungsi: 'Merender grafis sabuk conveyor berjalan dengan arah & kecepatan dinamis.',
    caraPakai: 'Membuat visualisasi pergerakan material di sepanjang stasiun lini.',
    konfigurasi: [
      { properti: 'conveyorState', deskripsi: 'Status berjalan/mati.' },
      { properti: 'direction', deskripsi: 'Arah gerak belt (LEFT / RIGHT).' }
    ]
  },
  {
    id: 'SCADA_MIXER',
    name: 'SCADA Mixer / Agitator',
    category: 'Industri & QC',
    icon: RotateCw,
    color: '#ec4899',
    fungsi: 'Visualisasi pisau pengaduk/mixer di dalam tangki bahan cair.',
    caraPakai: 'Mengawasi status pengadukan stasiun kimia atau mixing tank.',
    konfigurasi: [
      { properti: 'mixerState', deskripsi: 'Status pengaduk (RUNNING / STOPPED).' }
    ]
  },
  {
    id: 'SCADA_BOILER',
    name: 'SCADA Boiler (Ketel Uap)',
    category: 'Industri & QC',
    icon: Flame,
    color: '#ec4899',
    fungsi: 'Visualisasi tabung boiler dengan indikasi nyala api, suhu, dan tekanan uap.',
    caraPakai: 'Mengawasi status pembakaran uap utilitas pabrik.',
    konfigurasi: [
      { properti: 'boilerState', deskripsi: 'Status (ON / OFF).' },
      { properti: 'pressure / temperature', deskripsi: 'Tekanan uap (bar) dan suhu (°C).' }
    ]
  },
  {
    id: 'SCADA_SILO',
    name: 'SCADA Silo / Hopper',
    category: 'Industri & QC',
    icon: Container,
    color: '#ec4899',
    fungsi: 'Menampilkan tangki silo vertikal penyimpanan bijih/padat dengan visualisasi persentase kapasitas.',
    caraPakai: 'Melihat sisa stok gandum, plastik, semen di tangki penampung utama.',
    konfigurasi: [
      { properti: 'level', deskripsi: 'Tingkat pengisian silo saat ini (%).' },
      { properti: 'capacity', deskripsi: 'Kapasitas maksimal silo (ton).' }
    ]
  },

  // 5. MEDIA, GAMBAR & DOKUMEN
  {
    id: 'PDF_VIEWER',
    name: 'PDF Viewer (Dokumen SOP)',
    category: 'Media & Dokumen',
    icon: FileText,
    color: '#f59e0b',
    fungsi: 'Merender file PDF (seperti SOP perakitan, instruksi keselamatan kerja) di layar operator.',
    caraPakai: 'Masukkan tautan file PDF di kolom "url". Nilai ini bisa dibuat dinamis berdasarkan tipe produk.',
    konfigurasi: [
      { properti: 'url', deskripsi: 'URL absolut atau path lokal menuju file PDF.' },
      { properti: 'title', deskripsi: 'Judul dokumen yang tertera pada bar atas widget.' }
    ]
  },
  {
    id: 'WEBPAGE',
    name: 'WebViewer / Webpage',
    category: 'Media & Dokumen',
    icon: Globe,
    color: '#f59e0b',
    fungsi: 'Menampilkan halaman web luar atau aplikasi eksternal di dalam aplikasi Mavi.',
    caraPakai: 'Gunakan jika ingin mengintegrasikan dashboard eksternal atau monitoring CCTV.',
    konfigurasi: [
      { properti: 'url', deskripsi: 'Tautan web lengkap tujuan.' }
    ]
  },
  {
    id: 'CAD_VIEWER',
    name: 'CAD Viewer (Model STL 3D)',
    category: 'Media & Dokumen',
    icon: Layout,
    color: '#f59e0b',
    fungsi: 'Menampilkan visualisasi gambar model teknik STL 3D yang dapat di-rotate/zoom.',
    caraPakai: 'Membantu operator melihat detail perakitan komponen rumit.',
    konfigurasi: [
      { properti: 'fileUrl', deskripsi: 'Tautan URL tempat file model STL disimpan.' }
    ]
  },
  {
    id: 'CAMERA',
    name: 'Camera (Ambil Foto)',
    category: 'Media & Dokumen',
    icon: Camera,
    color: '#f59e0b',
    fungsi: 'Mengambil tangkapan gambar (foto) tunggal dari perangkat operator.',
    caraPakai: 'Merekam gambar kondisi defect produk pada formulir quality control QC.',
    konfigurasi: [
      { properti: 'visible', deskripsi: 'Menyembunyikan/menampilkan tombol kontrol kamera.' }
    ]
  },
  {
    id: 'CAMCORDER',
    name: 'Camcorder (Perekam Video)',
    category: 'Media & Dokumen',
    icon: Video,
    color: '#f59e0b',
    fungsi: 'Merekam klip video langsung melalui perangkat operator.',
    caraPakai: 'Mengambil rekaman video proses kegagalan mesin saat mengajukan tiket repair.',
    konfigurasi: [
      { properti: 'rotation', deskripsi: 'Arah rotasi rotasi kamera.' }
    ]
  },
  {
    id: 'CANVAS',
    name: 'Canvas (Area Gambar Bebas)',
    category: 'Media & Dokumen',
    icon: PenTool,
    color: '#f59e0b',
    fungsi: 'Menyediakan canvas interaktif untuk menggambar garis bebas atau coretan.',
    caraPakai: 'Melampirkan coretan sketsa masalah pada layout mesin saat mengajukan maintenance.',
    konfigurasi: [
      { properti: 'paintColor', deskripsi: 'Warna kuas gambar aktif.' },
      { properti: 'lineWidth', deskripsi: 'Lebar goresan kuas.' }
    ]
  },
  {
    id: 'PLAYER',
    name: 'Player (Pemutar Audio)',
    category: 'Media & Dokumen',
    icon: PlayCircle,
    color: '#f59e0b',
    fungsi: 'Memutar berkas audio alunan/nada peringatan.',
    caraPakai: 'Memutar suara bell tanda istirahat, alarm, atau instruksi lisan bagi operator.',
    konfigurasi: [
      { properti: 'source', deskripsi: 'Tautan file audio yang akan diputar.' },
      { properti: 'volume', deskripsi: 'Volume pemutar (0-100).' }
    ]
  },
  {
    id: 'SOUND_RECORDER',
    name: 'SoundRecorder (Perekam Suara)',
    category: 'Media & Dokumen',
    icon: Mic,
    color: '#f59e0b',
    fungsi: 'Merekam suara sekitar melalui microphone perangkat.',
    caraPakai: 'Operator mendiktekan laporan audit secara lisan.',
    konfigurasi: [
      { properti: 'savedRecording', deskripsi: 'Variabel penyimpan berkas suara rekaman.' }
    ]
  },
  {
    id: 'TEXT_TO_SPEECH',
    name: 'TextToSpeech (TTS)',
    category: 'Media & Dokumen',
    icon: Volume2,
    color: '#f59e0b',
    fungsi: 'Membacakan teks tulisan secara lisan melalui speaker.',
    caraPakai: 'Mengumumkan notifikasi suara jika stasiun mengalami kegagalan (misal: "Safety Fault Alert").',
    konfigurasi: [
      { properti: 'speechRate', deskripsi: 'Kecepatan pembacaan suara lisan.' }
    ]
  },
  {
    id: 'SHAPE_CIRCLE',
    name: 'Shape Circle (Bentuk Lingkaran)',
    category: 'Media & Dokumen',
    icon: Layout,
    color: '#f59e0b',
    fungsi: 'Bentuk geometris lingkaran statis untuk ornamen visual UI.',
    caraPakai: 'Tarik ke canvas untuk membuat tombol kustom bundar atau batas indikator visual.',
    konfigurasi: [
      { properti: 'backgroundColor', deskripsi: 'Warna pengisi lingkaran.' }
    ]
  },

  // 6. KONEKTIVITAS & STORAGE
  {
    id: 'TINY_DB',
    name: 'TinyDB (Penyimpanan Lokal)',
    category: 'Konektivitas & Storage',
    icon: Database,
    color: '#a855f7',
    fungsi: 'Menyimpan data sederhana (Key-Value) secara permanen di memori lokal perangkat.',
    caraPakai: 'Gunakan untuk mengingat pilihan bahasa operator atau menyimpan sementara data input offline.',
    konfigurasi: [
      { properti: 'namespace', deskripsi: 'Nama grup penyimpanan untuk memisahkan domain data.' }
    ]
  },
  {
    id: 'CLOUD_DB',
    name: 'CloudDB (Penyimpanan Awan)',
    category: 'Konektivitas & Storage',
    icon: Database,
    color: '#a855f7',
    fungsi: 'Menyimpan data secara terpusat di server cloud database Redis.',
    caraPakai: 'Berguna untuk bertukar data real-time antar stasiun kerja yang berbeda lokasi.',
    konfigurasi: [
      { properti: 'projectID', deskripsi: 'ID project unik untuk isolasi data Anda.' }
    ]
  },
  {
    id: 'WEB',
    name: 'Web (API HTTP Client)',
    category: 'Konektivitas & Storage',
    icon: Globe,
    color: '#a855f7',
    fungsi: 'Mengirim dan menerima request data HTTP (GET, POST, PUT, DELETE) ke web service luar.',
    caraPakai: 'Gunakan jika HMI Mavi ingin memanggil API eksternal (misal: memanggil data ERP SAP).',
    konfigurasi: [
      { properti: 'url', deskripsi: 'URL endpoint API tujuan.' }
    ]
  },
  {
    id: 'SPREADSHEET',
    name: 'Spreadsheet (Google Sheets)',
    category: 'Konektivitas & Storage',
    icon: Table,
    color: '#a855f7',
    fungsi: 'Menghubungkan aplikasi langsung ke file Google Spreadsheet Anda.',
    caraPakai: 'Operator dapat menulis laporan defect langsung ke baris spreadsheet tanpa database.',
    konfigurasi: [
      { properti: 'spreadsheetID', deskripsi: 'ID dokumen spreadsheet Google.' }
    ]
  },
  {
    id: 'CUSTOM_WIDGET',
    name: 'Custom Widget (HTML/CSS/JS)',
    category: 'Konektivitas & Storage',
    icon: Code,
    color: '#a855f7',
    fungsi: 'Membuat widget sendiri menggunakan custom code HTML, CSS, dan Javascript.',
    caraPakai: 'Gunakan jika Mavi tidak memiliki widget yang Anda butuhkan.',
    konfigurasi: [
      { properti: 'htmlTemplate', deskripsi: 'Struktur kode HTML widget.' },
      { properti: 'jsTemplate', deskripsi: 'Logika Javascript interaktif.' }
    ]
  },
  {
    id: 'AI_CHAT',
    name: 'AI Chat Assistant',
    category: 'Konektivitas & Storage',
    icon: Sparkles,
    color: '#a855f7',
    fungsi: 'Menyediakan antarmuka chat asisten kecerdasan buatan (AI) di layar operator.',
    caraPakai: 'Membantu operator menerjemahkan error code mesin atau mencarikan manual troubleshooting.',
    konfigurasi: [
      { properti: 'title', deskripsi: 'Judul header widget.' },
      { properti: 'systemPrompt', deskripsi: 'Sistem instruksi AI.' }
    ]
  },
  {
    id: 'BLUETOOTH_CLIENT',
    name: 'Bluetooth Client (Komunikasi nirkabel)',
    category: 'Konektivitas & Storage',
    icon: Bluetooth,
    color: '#a855f7',
    fungsi: 'Menghubungkan aplikasi HMI Mavi ke perangkat Bluetooth luar (sensor, printer label).',
    caraPakai: 'Gunakan untuk mengirimkan perintah cetak label ke printer bluetooth.',
    konfigurasi: [
      { properti: 'secure', deskripsi: 'Gunakan protokol pairing aman (true/false).' }
    ]
  },
  {
    id: 'PAYMENT_GATEWAY',
    name: 'Payment / QRIS (Sistem Kasir)',
    category: 'Konektivitas & Storage',
    icon: Wallet,
    color: '#a855f7',
    fungsi: 'Menyediakan interface checkout pembayaran QRIS/E-Wallet via Payment Gateway Midtrans.',
    caraPakai: 'Dipasang pada vending machine pintar atau stasiun pengemasan ritel produksi.',
    konfigurasi: [
      { properti: 'amount', deskripsi: 'Jumlah uang pembayaran (Rupiah).' },
      { properti: 'provider', deskripsi: 'Penyedia gateway pembayaran (Midtrans, dll).' }
    ]
  }
];

function WidgetDirectory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [expandedWidget, setExpandedWidget] = useState(null);

  const categories = ['Semua', 'Kontrol & Input UI', 'Visualisasi & Analisis', 'IoT & Sensor Perangkat', 'Industri & QC', 'Media & Dokumen', 'Konektivitas & Storage'];

  const filteredWidgets = WIDGET_DATABASE.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.fungsi.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          w.caraPakai.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || w.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Layout size={28} color="#a855f7" />
          <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#0f172a' }}>Daftar Widget Aplikasi</h3>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
          Mavi menyediakan beragam komponen visual (Widget) siap pakai mulai dari UI kontrol, IoT, sensor perangkat, QC industri, media, hingga konektivitas dan penyimpanan data.
          Klik kartu widget untuk melihat fungsi detail, cara penggunaan, dan konfigurasinya.
        </p>
        <img 
          src="/assets/hmi-widget-list.jpg" 
          alt="Daftar Widget Aplikasi" 
          style={{ maxWidth: '100%', borderRadius: '12px', border: '1px solid #cbd5e1', marginTop: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
        />
      </div>

      {/* Search and Category Filters */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Search Input */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '14px' }} />
          <input
            type="text"
            placeholder="Cari widget, fungsi, atau konfigurasi..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 42px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
              transition: 'border-color 0.2s',
              backgroundColor: '#f8fafc'
            }}
            onFocus={e => e.target.style.borderColor = '#a855f7'}
            onBlur={e => e.target.style.borderColor = '#cbd5e1'}
          />
        </div>

        {/* Category Selector */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {categories.map(cat => {
            const isActive = selectedCategory === cat;
            const count = cat === 'Semua' 
              ? WIDGET_DATABASE.length 
              : WIDGET_DATABASE.filter(w => w.category === cat).length;
            
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  border: isActive ? '1px solid #a855f7' : '1px solid #e2e8f0',
                  backgroundColor: isActive ? '#f3e8ff' : '#ffffff',
                  color: isActive ? '#a855f7' : '#64748b',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s'
                }}
              >
                {cat}
                <span style={{
                  fontSize: '0.7rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  backgroundColor: isActive ? '#a855f7' : '#f1f5f9',
                  color: isActive ? '#ffffff' : '#64748b'
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Widgets List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredWidgets.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed #cbd5e1', borderRadius: '16px', color: '#64748b' }}>
            <Info size={32} style={{ marginBottom: '8px', color: '#94a3b8' }} />
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Tidak menemukan widget dengan kata kunci tersebut.</p>
          </div>
        ) : (
          filteredWidgets.map(widget => {
            const isExpanded = expandedWidget === widget.id;
            const IconComponent = widget.icon;

            return (
              <div
                key={widget.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: isExpanded ? '2px solid #a855f7' : '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '18px',
                  transition: 'all 0.2s ease-in-out',
                  boxShadow: isExpanded ? '0 4px 20px rgba(168, 85, 247, 0.1)' : '0 1px 3px rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
                onClick={() => setExpandedWidget(isExpanded ? null : widget.id)}
              >
                {/* Header Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      backgroundColor: `${widget.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: widget.color
                    }}>
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                        {widget.name}
                      </h4>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: widget.color,
                        backgroundColor: `${widget.color}10`,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        marginTop: '4px'
                      }}>
                        {widget.category}
                      </span>
                    </div>
                  </div>
                  <div style={{ color: '#94a3b8' }}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* Short Description */}
                <p style={{ margin: '12px 0 0 0', fontSize: '0.88rem', color: '#475569', lineHeight: 1.5 }}>
                  {widget.fungsi}
                </p>

                {/* Expanded content */}
                {isExpanded && (
                  <div 
                    style={{ 
                      marginTop: '16px', 
                      paddingTop: '16px', 
                      borderTop: '1px solid #f1f5f9',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      cursor: 'default'
                    }}
                    onClick={e => e.stopPropagation()}
                  >
                    <div>
                      <h5 style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                        🚀 Cara Penggunaan:
                      </h5>
                      <p style={{ margin: 0, fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
                        {widget.caraPakai}
                      </p>
                    </div>

                    <div>
                      <h5 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#0f172a', fontWeight: 700 }}>
                        ⚙️ Konfigurasi Utama (Properti):
                      </h5>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {widget.konfigurasi.map((cfg, cIdx) => (
                          <div key={cIdx} style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', alignItems: 'flex-start', lineHeight: 1.4 }}>
                            <code style={{
                              backgroundColor: '#f1f5f9',
                              color: '#a855f7',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: 600,
                              fontFamily: 'monospace',
                              flexShrink: 0
                            }}>
                              {cfg.properti}
                            </code>
                            <span style={{ color: '#475569' }}>
                              {cfg.deskripsi}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
