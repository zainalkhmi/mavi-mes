import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Bot, User, Loader2, BookOpen, 
  Layout, Cpu, BarChart3, Zap, Paperclip, X,
  Search, ChevronDown, ChevronUp, Info, Scale, SlidersHorizontal, ToggleRight, Type, Table, FileText, Globe, Eye,
  Sparkles, Clock, MapPin, Database, Bluetooth, Code, Activity, Calendar, Camera, FolderOpen, PenTool,
  Play, Volume2, Mic, Tv, Map, Wifi, AlertTriangle, Wrench, CreditCard, Gamepad2, Grid3X3, Sun, Flame, Wind,
  Snowflake, Compass, Container, Bell, Power, ArrowRight, RotateCw, ArrowDownUp, Car, Fuel, Bug, Trash2, Wallet,
  Keyboard, Menu, Hash, Upload, ShieldCheck, Cog, AlignLeft, LayoutGrid, Palette, PlayCircle, Thermometer, Video,
  Gauge, TrendingUp, Rocket, Route, AppWindow, Factory, Workflow, Link2, BrainCircuit, Ruler, Network
} from 'lucide-react';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { getPrimaryAiConnector } from '../utils/database';
import { getChatCompletion } from '../utils/aiService';
import { Link } from 'react-router-dom';
import { getStations, getTables } from '../utils/supabaseFrontlineDB';
import { getTableRecords, addTableRecord } from '../utils/supabaseTablesDB'; // For internal linking if needed, though markdown links handle href well
import { getSupabaseClient } from '../utils/supabaseManualDB';

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
6. **Node Canvas (Visual Logic Flow):** Menu **Node Canvas** di App Builder memungkinkan pengguna memvisualisasikan dan mengkonfigurasi logic UI aplikasi secara visual berbasis node-graph. Canvas ini MEMBACA semua widget (komponen) yang ada di setiap screen (step) maupun global (baseComponents) beserta properti dan logicnya, lalu menampilkannya sebagai node yang bisa dihubungkan dengan wire (edge). Jelaskan cara membuka palette (tab Widgets/Events/Vars/Tables), cara klik node widget untuk inspect props dan logic, cara mengatur WHEN-IF-THEN logic, dan cara menjalankan Play/Test Run Flow.
7. **Console:** Aplikasi dijalankan oleh operator melalui Live Terminal atau App Player.
8. **Mavi Vision & AI Detector Integrations (AI Deep Learning + Rule-Based CV):**
   - **Visual Inspection Datasets (Pengumpulan Data):** Tab khusus untuk membuat dataset lokal dan mengambil gambar sampel langsung dari kamera kerja. Operator melabeli gambar tersebut sebagai PASS, FAIL, atau label defect kustom. Rekomendasi minimal 30-50 sampel gambar per kategori.
   - **AI Models & Inspection (Pelatihan & Pengujian):** Tab untuk melatih model secara lokal di server. Jenis model meliputi:
     - *Anomaly Detection (PatchCore)*: Deteksi anomali tanpa pengawasan (hanya melatih gambar OK/Normal). Menghasilkan heatmap anomali.
     - *Classification (CNN)*: Klasifikasi terawasi untuk melabeli OK/NG berdasarkan kategori produk.
     - *Segmentation (U-Net)*: Segmentasi piksel cacat secara presisi di area region.
     - Tab ini juga mendukung *Inference Testing* dengan mengunggah gambar uji coba untuk menampilkan perbandingan heatmap visual dan tingkat skor sebelum dideploy.
   - **Camera Configurations (Integrasi & Deteksi):** Menghubungkan model AI yang telah dilatih ke kamera lantai produksi. Pengguna membuat wilayah pantau (*Region of Interest* / ROI) pada kamera dan menambahkan **AI Detector** dengan opsi:
     - *Anomaly Threshold* (batas nilai anomali untuk kelulusan region).
     - *Expected PASS Class Label* (label kelas yang diharapkan lulus).
     - *Max Defect Area Limit (px)* & *Segmentation Pixel Threshold* (batas luas area cacat piksel hasil segmentasi).
   - **Visual Detectors Tradisional**:
     - *Color Detectors*: Memantau kesesuaian nilai target warna.
     - *Change Detectors*: Mendeteksi gerakan / perubahan piksel pada region.
     - *Jig Detectors*: Melacak fixture perakitan via ArUco marker. Dikoneksikan dengan **Jig Builder** khusus (dukungan area constraint dan fixture registration table).
     - *Hand Detectors*: Mendeteksi kehadiran tangan operator (memasuki/meninggalkan zona).
   - **OpenCV Camera Widget (Filter Types)**: Widget kamera real-time berbasis OpenCV.js mendukung berbagai filter vision:
     - *Canny / Sobel / Threshold*: Edge detection dan segmentasi dasar.
     - *Caliper OCR*: Membaca angka digital caliper secara otomatis.
     - *Dial Gauge*: Membaca posisi jarum indikator analog.
     - *Part Counting*: Menghitung jumlah objek menggunakan findContours.
     - *Barcode/QR*: Pemindaian barcode.
     - *Change Detector*: Deteksi motion/perubahan piksel.
     - *YOLO Detector*: Object detection (safety APD, defect QC).
     - *Dimension Measurement*: **FITUR BARU** — Pengukuran dimensi objek secara real-time menggunakan kontur OpenCV. Memerlukan kalibrasi mm/pixel dari objek referensi (misal blok ukur 20mm). Mendukung pengukuran Width, Height, Diagonal, dan Area dengan pass/fail berdasarkan toleransi LSL/USL.
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
    id: 'mcp-guide',
    title: 'Model Context Protocol (MCP)',
    icon: BrainCircuit,
    color: '#8b5cf6', // Violet
    content: `
**Panduan Integrasi Mavi MCP Server dengan Claude Desktop & Antigravity**

Model Context Protocol (MCP) adalah standar terbuka yang memungkinkan asisten AI (LLM) terhubung secara aman ke repositori data lokal Anda. Mavi dilengkapi dengan MCP Server mandiri yang mengekspos data operasional pabrik sebagai *tools* bagi asisten AI seperti **Claude Desktop** dan **Antigravity**.

---

### 1. Daftar Toolset Mavi MCP
Saat terhubung, asisten AI akan mendapatkan akses ke 6 tool berikut:
1. \`read_mavi_table\`: Membaca baris data dari tabel kualitas, stasiun, dll.
2. \`write_mavi_table\`: Menambahkan data log baru ke database.
3. \`get_station_status\`: Mengambil status real-time dari stasiun kerja.
4. \`set_station_status\`: Memperbarui status operasional stasiun kerja.
5. \`get_machine_info\`: Membaca telemetri sensor & vibrasi mesin.
6. \`list_active_users\`: Mendapatkan daftar operator yang aktif login di stasiun.

---

### 2. Panduan Koneksi ke Claude Desktop
Untuk menghubungkan Mavi ke Claude Desktop:
1. Pastikan Anda memiliki Node.js terinstal (versi 18+ direkomendasikan).
2. Buka berkas konfigurasi Claude Desktop di Windows pada path:
   \`%APPDATA%\\Claude\\claude_desktop_config.json\`
3. Tambahkan konfigurasi berikut di bawah bagian \`mcpServers\`:
   \`\`\`json
   {
     "mcpServers": {
       "mavi-mes-mcp": {
         "command": "node",
         "args": [
           "C:\\\\Users\\\\ndens\\\\mavi-core\\\\mavi-mcp-server.js"
         ],
         "env": {
           "SUPABASE_URL": "https://pypjnzvsolxsddsqworw.supabase.co",
           "SUPABASE_KEY": "KUNCI_ANON_SUPABASE_ANDA"
         }
       }
     }
   }
   \`\`\`
4. Simpan berkas lalu restart Claude Desktop. Ikon palu (tools) akan muncul menandakan koneksi berhasil.

---

### 3. Panduan Koneksi ke Antigravity
Untuk menghubungkan Mavi ke asisten coding Antigravity Anda:
1. Di workspace proyek Anda, pastikan terdapat berkas konfigurasi \`mavi-mcp-server.js\`.
2. Daftarkan skrip ini ke konfigurasi client Antigravity/Gemini Anda di bawah setelan \`mcpServers\` pada berkas konfigurasi IDE Anda:
   \`\`\`json
   {
     "mcpServers": {
       "mavi-mes-mcp": {
         "command": "node",
         "args": ["C:/Users/ndens/mavi-core/mavi-mcp-server.js"]
       }
     }
   }
   \`\`\`
3. Ketika Anda memulai obrolan dengan Antigravity, agen akan secara otomatis mendeteksi tools MCP yang terekspos.
4. Anda bisa langsung menginstruksikan dalam chat: *"Antigravity, tolong periksa stasiun WS-01"* atau *"Buatkan visualisasi log kualitas dari data tabel."*
`
  },
  {
    id: 'yolo-offline-guide',
    title: 'YOLO Offline (Kustom Dataset)',
    icon: ShieldCheck,
    color: '#10b981', // Emerald/Green
    content: `
### Panduan YOLOv8 Offline (Kustom Dataset & Privasi Data)

![YOLO Offline Workflow](/assets/yolo-offline.jpg)

Jika data dan gambar dari pabrik Anda bersifat rahasia (**privacy/confidential dataset**), Anda wajib menggunakan alur kerja **100% Offline (Local-First)** agar gambar produk tidak terunggah ke internet.

---

#### 1. Pelabelan Gambar Secara Offline (Local Labeling)
Jangan menggunakan Roboflow Cloud. Gunakan aplikasi pelabelan yang berjalan lokal di komputer Anda:

**Opsi A: Menggunakan Label Studio (Modern & Lengkap)**
1. Instal melalui pip di terminal komputer Anda:
   \`\`\`bash
   pip install label-studio
   \`\`\`
2. Jalankan aplikasi:
   \`\`\`bash
   label-studio
   \`\`\`
3. Aplikasi akan otomatis terbuka di browser lokal Anda di alamat \`http://localhost:8080\`.
4. Buat project baru, pilih template **Object Detection**, masukkan gambar-gambar Anda, dan lakukan pelabelan.
5. Saat selesai, klik **Export** dan pilih format **YOLO**.

**Opsi B: Menggunakan LabelImg (Sangat Ringan & Klasik)**
1. Instal lewat pip:
   \`\`\`bash
   pip install labelImg
   \`\`\`
2. Jalankan dari terminal:
   \`\`\`bash
   labelImg
   \`\`\`
3. Di dalam aplikasi LabelImg, set format penyimpanan ke **YOLO** (bukan PascalVOC). Gambar kotak deteksi pada produk Anda dan simpan.

---

#### 2. Mengatur Struktur Folder Offline
Setelah selesai melabeli, susun folder di komputer Anda secara manual seperti berikut:

\`\`\`text
C:/YOLO_Projects/my_private_dataset/
├── dataset.yaml
├── train/
│   ├── images/   <-- Foto latihan (.jpg)
│   └── labels/   <-- Koordinat label latihan (.txt)
└── val/
    ├── images/   <-- Foto validasi (.jpg)
    └── labels/   <-- Koordinat label validasi (.txt)
\`\`\`

Buat file \`dataset.yaml\` menggunakan notepad/VS Code, masukkan path lokal komputer Anda:
\`\`\`yaml
path: C:/YOLO_Projects/my_private_dataset
train: train/images
val: val/images

names:
  0: ok_product
  1: scratch_defect
  2: dent_defect
\`\`\`

---

#### 3. Training Model Secara Offline (Local Training)
Jalankan proses training model di komputer Anda sendiri menggunakan Python.

Buat file Python bernama \`train_offline.py\`:
\`\`\`python
from ultralytics import YOLO

# Load model dasar (pre-trained nano model)
model = YOLO("yolov8n.pt") 

if __name__ == '__main__':
    model.train(
        data="C:/YOLO_Projects/my_private_dataset/dataset.yaml", 
        epochs=100,      # Jumlah putaran latihan
        imgsz=640,       # Ukuran gambar input standar
        device=0,        # Ketik 0 jika pakai GPU NVIDIA, atau ganti "cpu" jika tanpa GPU
        workers=2
    )
\`\`\`
Jalankan di terminal:
\`\`\`bash
python train_offline.py
\`\`\`
Model kustom hasil training Anda akan tersimpan di:
\`runs/detect/train/weights/best.pt\`

---

#### 4. Menjalankan Server API Lokal
Buat file \`yolo_server.py\` di folder lokal yang memuat file model kustom Anda (\`best.pt\`):

\`\`\`python
import cv2
import numpy as np
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO

app = FastAPI(title="YOLOv8 Local Inference API")

# Aktifkan CORS agar browser dapat mengakses localhost
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("best.pt") # Meload model kustom hasil training offline

@app.post("/detect")
async def detect_objects(file: UploadFile = File(...)):
    try:
        image_bytes = await file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        results = model(img)
        predictions = []
        for box in results[0].boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            cls_id = int(box.cls[0])
            label = results[0].names[cls_id]
            conf = float(box.conf[0]) * 100

            predictions.append({
                "x": int(x1),
                "y": int(y1),
                "w": int(x2 - x1),
                "h": int(y2 - y1),
                "label": label,
                "confidence": round(conf, 1)
            })
        return {"predictions": predictions}
    except Exception as e:
        return {"error": str(e), "predictions": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
\`\`\`
Jalankan di terminal:
\`\`\`bash
python yolo_server.py
\`\`\`

---

#### 5. Menghubungkan ke App Builder Mavi
1. Di **App Builder**, tambahkan atau pilih widget **OpenCV Camera**.
2. Pada panel properti sebelah kanan, ganti **YOLO Run Mode** menjadi **Local Python API (localhost:8000)**.
3. Masukkan URL Endpoint: \`http://localhost:8000/detect\`.
`
  },
  {
    id: 'mavi-vision',
    title: 'Mavi Vision & AI Detector',
    icon: Eye,
    color: '#3b82f6', // Blue
    content: `
### Panduan Mavi Vision & AI Detector (Hybrid AI & Rule-Based CV)

Modul **MAVI Vision** dirancang untuk mengotomatisasi inspeksi kualitas produk dengan menggabungkan kekuatan **AI Deep Learning** (Anomaly Detection, Classification, Segmentation) dan **Rule-Based Computer Vision** (Color, Change, Jig, Dimension, Barcode/QR, OCR) secara real-time.

Berikut adalah panduan lengkap langkah demi langkah mulai dari pengumpulan data hingga referensi konfigurasi untuk **10 Jenis Detektor Visual** yang tersedia.

---

#### LANGKAH 1: Pengumpulan & Pelabelan Data (Visual Inspection Datasets)
Sebelum dapat menggunakan AI, Anda harus mengumpulkan sampel gambar untuk melatih model.
1. Masuk ke halaman **Vision**, lalu klik tab **Visual Inspection Datasets**.
2. Klik tombol **+** di pojok kanan atas sidebar untuk membuat dataset baru. Masukkan *Dataset Name* dan *Project Name*.
3. Pilih dataset yang baru dibuat dari sidebar untuk membuka **Live Camera Capture Workspace**.
4. Di bagian viewfinder kamera, pastikan kamera terhubung (Webcam atau IP Camera).
5. Letakkan produk contoh di bawah kamera, lalu gunakan tombol aksi:
   - **CAPTURE AS PASS:** Ambil gambar untuk produk normal/layak (OK).
   - **CAPTURE AS FAIL:** Ambil gambar untuk produk yang memiliki cacat (NG).
   - **Capture custom:** Tulis tag defect spesifik (misal: *Baret*, *Penyok*, *Retak*).
   > 💡 **Rekomendasi Industri:** Kumpulkan minimal **30 - 50 sampel gambar** per kategori agar model AI memiliki akurasi yang tinggi saat dijalankan.

---

#### LANGKAH 2: Pelatihan & Pengujian Model AI (AI Models & Inspection)
Setelah data terkumpul, saatnya melatih model kecerdasan buatan Anda secara offline di server lokal.
1. Alihkan tab ke **AI Models & Inspection**.
2. Di bagian **Train a New AI Model**, pilih jenis inspeksi yang ingin dilatih:
   - **Anomaly Detection (PatchCore):** *Paling direkomendasikan.* Hanya membutuhkan sampel gambar **PASS/OK**. AI mengenali produk normal dan otomatis mendeteksi anomali sekecil apa pun, lengkap dengan visualisasi heatmap.
   - **Classification (CNN):** Model supervised yang membutuhkan sampel **PASS** dan **FAIL**. AI mengklasifikasikan biner (OK/NG) atau multi-kelas.
   - **Segmentation (U-Net):** Segmentasi piksel cacat secara presisi pada permukaan produk (membutuhkan input anotasi area cacat).
3. Pilih dataset yang telah Anda kumpulkan pada langkah sebelumnya.
4. Tentukan nama model (*Model Name*) dan jumlah iterasi (*Epochs*). Klik **Start Model Training**.
5. Setelah status model berubah menjadi **Ready/Complete**, lakukan uji coba (*Testing*) dengan mengunggah foto produk uji di panel kanan untuk memverifikasi tingkat akurasi (*confidence score* atau *anomaly score*) sebelum model dideploy.

---

#### LANGKAH 3: Integrasi ke Kamera (Camera Configurations & ROI Setup)
Langkah terakhir adalah mengaktifkan detektor pilihan Anda agar memantau produk secara real-time pada kamera kerja.
1. Alihkan tab ke **Camera Configurations**, pilih kamera aktif yang ingin disetel, lalu klik **Edit Assignment / Configure**.
2. Di layar editor kamera, buat/gambar area kotak pantau (**Region of Interest / ROI**) tepat di lokasi produk akan diperiksa.
3. Di panel setelan sebelah kanan, klik **+ Add Detector**, lalu pilih salah satu dari 10 pilihan detektor di bawah ini.

---

### PANDUAN REFERENSI 10 DETEKTOR VISUAL

Berikut adalah fungsi dan instruksi cara setup dari masing-masing 10 detektor yang dapat dipasang pada area ROI:

#### 1. Presence Check (Deteksi Kehadiran / Perubahan Visual)
* **Fungsi**: Memastikan keberadaan komponen, perakitan part yang lengkap, atau mendeteksi pergerakan di zona pantau (Rule-Based).
* **Cara Setup**: 
  1. Gambar kotak ROI melingkupi area di mana komponen seharusnya berada.
  2. Setel **Begin Threshold** (sensitivitas deteksi pergerakan, contoh: 40%).
  3. Atur **Lower Threshold** untuk mengabaikan noise kecil (seperti bayangan).
  4. Sistem memicu status **PASS** jika objek terdeteksi dan **FAIL/NG** jika area tersebut kosong.

#### 2. Scratch Inspection (Deteksi Cacat / Anomali Permukaan - AI)
* **Fungsi**: Menemukan cacat kosmetik yang tidak teratur seperti goresan, retak, penyok, baret, kontaminasi, atau cacat cetakan pada permukaan produk.
* **Cara Setup**: 
  1. Pasang detektor ini pada ROI produk.
  2. Pilih jenis model AI **Anomaly Detection (PatchCore)** yang telah Anda latih pada Langkah 2.
  3. Setel **Anomaly Score Threshold** (default: 0.5). Jika baret/cacat terdeteksi pada produk saat live dan skor anomalinya melebihi batas ini, status judgment otomatis berubah menjadi **NG (FAIL)**.

#### 3. GD&T Measurement (Pengukuran Geometri Dimensi)
* **Fungsi**: Mengukur lebar (*Width*), tinggi (*Height*), diameter lingkaran (*Circle Diameter*), panjang diagonal, atau luas area objek secara presisi.
* **Cara Setup**: 
  1. Pastikan kamera telah dikalibrasi skala fisiknya (lihat menu Kalibrasi Kamera).
  2. Gambar ROI melingkupi objek yang ingin diukur dimensinya.
  3. Pilih **Measure Mode** (misal: *Width* atau *Circle Diameter*) dan tentukan unit pengukurannya (**mm** atau **px**).
  4. Masukkan batas spesifikasi **LSL (Lower Specification Limit)** dan **USL (Upper Specification Limit)** (contoh: Target 20.0mm, LSL: 19.5mm, USL: 20.5mm). Jika hasil ukur berada di luar rentang ini, detektor memicu status **FAIL**.

#### 4. Positioning (Jig / Penyelarasan Koordinat)
* **Fungsi**: Melacak koordinat titik referensi objek (seperti ArUco marker atau kecocokan pola) sehingga ketika produk bergeser atau miring di atas conveyor, kotak ROI detektor lain akan **mengikuti pergeseran tersebut secara dinamis**.
* **Cara Setup**:
  1. Gambar ROI tepat melingkupi marker fisik atau sudut produk yang dijadikan patokan.
  2. Tentukan **Marker Type** (seperti *ArUco* atau *Template Matching*) dan atur **Marker ID** yang sesuai.
  3. Detektor ini akan bertindak sebagai jangkar koordinat bagi ROI pengukuran lainnya.

#### 5. Color Inspection (Inspeksi Warna RGB/HSV)
* **Fungsi**: Memastikan produk dicat dengan warna yang benar, mendeteksi keberadaan kabel warna tertentu, atau membedakan tipe produk berdasarkan warna.
* **Cara Setup**:
  1. Letakkan produk dengan warna target di bawah kamera.
  2. Gambar ROI pada area berwarna tersebut.
  3. Klik tombol **Set current region color** untuk merekam rata-rata nilai warna secara instan.
  4. Setel **Begin Color detection threshold** (misal: 75%). Jika warna objek menyimpang dari target (misal salah pasang part warna merah padahal harusnya biru), nilai similarity akan anjlok di bawah batas toleransi dan memicu **FAIL**.

#### 6. Count Detector (Penghitung Jumlah Objek - AI)
* **Fungsi**: Menghitung kuantitas pin konektor, sekrup dalam wadah, atau botol di dalam kemasan karton menggunakan model deteksi objek YOLO.
* **Cara Setup**:
  1. Gambar ROI mencakup seluruh area penampung objek.
  2. Masukkan **Target Object Class** sesuai kelas pelabelan pada model YOLO (misalnya: *screw* atau *cap*).
  3. Setel **Expected Count** (jumlah objek yang harus ada, contoh: 6) dan **Confidence Threshold** (sensitivitas pembacaan AI).
  4. Jika jumlah objek yang terdeteksi kurang atau lebih dari nilai *Expected Count*, region otomatis dinyatakan **FAIL/NG**.

#### 7. Character Recognition (OCR Text Reader - AI)
* **Fungsi**: Membaca string alfanumerik secara otomatis seperti nomor batch produksi, tanggal kedaluwarsa (*expiry date*), atau nomor seri produk.
* **Cara Setup**:
  1. Gambar ROI memanjang melingkupi baris tulisan/karakter pada produk.
  2. Tentukan **Language** pembacaan (English, German, Chinese, dll).
  3. Masukkan **Match Pattern** jika Anda ingin memvalidasi format teks tertentu (contoh regex: \`LOT-[0-9]{4}\`). Teks hasil pembacaan EasyOCR akan langsung disinkronkan ke memori variabel HMI untuk dicatat dalam log QC database.

#### 8. 1D Code Reader (Scanner Barcode)
* **Fungsi**: Menscan dan menerjemahkan barcode garis (1D) konvensional pada label kemasan produk.
* **Cara Setup**:
  1. Gambar ROI melingkupi seluruh area barcode garis.
  2. Pilih **Symbology Filter** (*ANY*, *Code 128*, *Code 39*, *EAN-13*).
  3. Jika ingin memvalidasi keaslian kode, masukkan string target pada kolom **Expected Value**. Jika barcode terdeteksi namun isinya salah, status region menjadi **NG**.

#### 9. 2D Code Reader (Scanner QR / DataMatrix)
* **Fungsi**: Membaca kode matriks 2D (QR Code atau DataMatrix) yang dicetak langsung pada permukaan produk (*Direct Part Marking* / DPM) untuk ketelusuran (*traceability*) tingkat tinggi.
* **Cara Setup**:
  1. Arahkan ROI tepat melingkupi kode QR atau DataMatrix.
  2. Pilih **Code Format** (*QR* atau *DataMatrix*).
  3. Sistem secara instan men-decode isi data dan mengirimkannya ke log QC database saat konveyor bergerak.

#### 10. Calibration Tool (Kompensasi Grid & Unit Fisik)
* **Fungsi**: Memverifikasi bahwa kamera masih dalam status terkalibrasi presisi dan menerapkan matriks kompensasi kelengkungan lensa OpenCV secara dinamis sebelum pengukuran ROI lainnya dievaluasi.
* **Cara Setup**:
  1. Gambar ROI pada area pola kalibrasi checkerboard atau titik ukur referensi.
  2. Pilih tipe kalibrasi: **Scale Factor (mm/px)** atau **Lens Distortion**.
  3. Panel status akan menampilkan indikator hijau **"Camera matrix loaded & active"** untuk menandakan koreksi geometri OpenCV sedang berjalan aktif secara real-time pada frame video.

#### 11. Visual Tool Chain Builder (QuickBuild)
* **Fungsi**: Memungkinkan penyusunan alur kerja inspeksi visual (kamera) dengan menghubungkan blok-blok fungsional secara dinamis (Acquire → Locate → Measure → Inspect → Decide) lewat flowchart editor interaktif tanpa menulis kode program.
* **Cara Setup**:
  1. Masuk ke halaman **Vision**, lalu klik tab **⚡ QuickBuild Pipeline**.
  2. Gunakan sidebar **QuickBuild Tool Blocks** untuk menambahkan blok ke kanvas:
     * **Acquire**: Mengatur input kamera dan pemicu tangkapan (trigger).
     * **Locate**: Melacak pergerakan pola untuk meluruskan titik ukur (alignment).
     * **Measure**: Melakukan pengukuran sub-pixel caliper.
     * **Inspect**: Menjalankan analisis khusus (OCR, OCV, barcode, atau AI Anomaly).
     * **Decide**: Menentukan status kelulusan akhir (PASS/FAIL) dan mengirimkan perintah reject ke mesin/PLC.
  3. Hubungkan pin bulat di kanan suatu blok ke pin kiri blok lainnya untuk mengalirkan data (kawat kustom akan terbentuk secara otomatis).
  4. Klik blok mana saja untuk memunculkan panel setelan parameter spesifiknya di sisi kanan.
  5. Tekan **RUN PIPELINE** untuk menyimulasikan aliran proses QC dan melihat status kelulusan visual langkah demi langkah.
`
  },
  {
    id: 'drawing-cad-guide',
    title: 'Drawing & CAD Integration',
    icon: Ruler,
    color: '#2563eb', // Blue
    content: `
### Panduan Lengkap Drawing / Inspection Designer & Integrasi CAD Widget

Fitur **Drawing / Inspection Designer** (disebut juga **Drawing Manager**) menjembatani gambar teknik (.dxf, .svg, .pdf) dengan antarmuka HMI operator. Sistem ini memungkinkan input pengukuran fisik secara manual atau via Bluetooth Caliper diverifikasi langsung terhadap spesifikasi toleransi CAD secara dinamis dan real-time di stasiun operator.

---

#### LANGKAH 1: Unggah & Pemetaan Gambar Teknik (Drawing Manager)
Sebelum diintegrasikan ke aplikasi, berkas gambar harus disiapkan dan dimensi spesifiknya dipetakan ke variabel penampung data.

1. **Akses Menu**: Buka menu **Apps** \u2192 **Drawing Manager** dari bar navigasi atas platform MAVI.
2. **Unggah Berkas**: Seret (*drag & drop*) berkas gambar teknik Anda (.svg, .dxf, atau .pdf) pada zona pengunggahan. Sistem akan secara otomatis membedah entitas geometri, koordinat garis, lingkaran, dan teks dimensi yang ada pada file.
3. **Buka Kanvas Interaktif**: Pilih nama berkas gambar dari daftar di sebelah kiri untuk membuka lembar kerja di bagian tengah.
4. **Petakan Dimensi Spesifik (Dimension SPEC Mapping)**:
   - Ketuk/klik langsung pada **kotak label dimensi** atau **garis ukuran** di atas kanvas gambar (contoh: \`Ø 80.0\` atau \`L: 120.0\`).
   - Panel setelan spesifikasi dimensi akan meluncur keluar di sisi kanan.
5. **Konfigurasikan Parameter Toleransi**:
   - **Target Spec Nominal**: Masukkan angka nilai target ideal (contoh: \`80.0\`).
   - **Batas Toleransi**: Masukkan nilai deviasi atau batas spesifikasi langsung:
     * *Batas Bawah (LSL / Lower Specification Limit)*: Nilai minimum produk lolos (contoh: \`79.9\`).
     * *Batas Atas (USL / Upper Specification Limit)*: Nilai maksimum produk lolos (contoh: \`80.1\`).
   - **Variabel Connector (QMS)**: Masukkan nama variabel unik yang akan menampung nilai dimensi ini di memori HMI (contoh: \`Meas_Diameter\`).
     > ⚠️ **PENTING**: Nama variabel ini harus unik dan disarankan menggunakan format snake_case atau camelCase tanpa spasi/karakter khusus.
   - **Measure Type**: Pilih orientasi pengukuran yang sesuai (*Linear Horizontal*, *Linear Vertical*, *Diameter*, *Radial*, atau *Angle*).
6. **Simpan Konfigurasi**: Klik tombol **Simpan Pemetaan Dimensi**. Elemen geometri yang berhasil dipetakan akan berubah warna menjadi biru pada kanvas.

---

#### LANGKAH 2: Konfigurasi HMI & Widget di App Builder
Setelah gambar blueprint dipetakan, ikuti langkah ini untuk merancang tampilannya di aplikasi operator.

1. **Buka App Builder**: Buka menu **Apps** \u2192 **App Builder** dan pilih aplikasi HMI Anda.
2. **Deklarasikan Variabel Aplikasi**:
   - Di panel kiri (ikon database/variabel), klik **Create Variable**.
   - Masukkan nama variabel global dengan ejaan dan huruf besar-kecil yang **SAMA PERSIS** dengan *Variabel Connector (QMS)* yang Anda setel di Drawing Manager (contoh: \`Meas_Diameter\` dengan tipe \`NUMBER\`).
3. **Letakkan Widget CAD Viewer**:
   - Tarik (*drag & drop*) widget **CAD** (atau \`CAD_VIEWER\`) dari palet widget kategori *Embedded* ke dalam kanvas HMI Anda.
   - Klik widget tersebut dan atur propertinya di sidebar kanan:
     * **\`fileUrl\`**: Pilih nama file blueprint yang baru saja Anda petakan (contoh: \`dwg_hydraulic_cylinder\`).
     * **\`showGrid\`**: Setel ke \`true\` untuk menampilkan grid penunjuk posisi.
     * **\`autoRotate\`**: Setel ke \`false\` agar operator tidak pusing saat membaca gambar yang bergerak.
4. **Buat Form Input Pengukuran**:
   - Tarik widget input data (seperti **Number Input** atau **Text Input**) di dekat gambar CAD untuk tempat operator memasukkan hasil pengukuran fisik.
   - Pada panel properti widget input tersebut, isi properti **\`targetVariable\`** dan arahkan ke variabel global yang telah Anda buat sebelumnya (contoh: \`Meas_Diameter\`).

---

#### LANGKAH 3: Cara Kerja Validasi Dinamis & Alur Kerja Operator
Ketika operator menjalankan aplikasi di stasiun kerja (**Live Terminal** / **App Player**):

1. **Pemicu Fokus Otomatis (On-Click Focus)**:
   - Operator tidak perlu menepuk kotak input form. Cukup **ketuk/klik langsung garis dimensi** (misalnya garis diameter \`Ø 80.0\`) pada gambar CAD di layar sentuh.
   - Widget CAD akan mendeteksi interaksi tersebut dan memicu event \`ACTIVE_DIMENSION_CHANGED\`.
   - Sistem secara otomatis memfokuskan kursor dan mengaktifkan widget input yang terikat ke variabel \`Meas_Diameter\`.
2. **Input Pengukuran Fisik**:
   - Operator melakukan pengukuran produk fisik menggunakan jangka sorong (caliper/micrometer).
   - Angka hasil pengukuran dimasukkan ke dalam input box (diketik manual atau dikirim otomatis dari alat ukur jika terhubung via USB/Bluetooth menggunakan widget *Measurement*).
3. **Pencocokan Nilai & Feedback Visual**:
   - Begitu nilai dimasukkan ke variabel \`Meas_Diameter\`, engine MAVI langsung mengevaluasi angka tersebut terhadap batas toleransi LSL (\`79.9\`) dan USL (\`80.1\`).
   - Garis dimensi pada gambar cetak biru CAD akan berubah warna secara instan:
     * **HIJAU (PASS)**: Jika hasil ukur operator masuk dalam batas toleransi (\`LSL <= Nilai <= USL\`, misal: \`80.05\`).
     * **MERAH (FAIL/NG)**: Jika hasil ukur menyimpang dari toleransi (\`Nilai < LSL\` atau \`Nilai > USL\`, misal: \`79.85\`).
     * **ABU-ABU (UNMEASURED)**: Jika dimensi tersebut belum diukur atau nilainya dikosongkan.
4. **Triggers & Automations**:
   - Status kelulusan ini juga memperbarui status variabel terkait (seperti \`Status_Meas_Diameter\` menjadi \`"PASS"\` atau \`"FAIL"\`).
   - Nilai kelulusan ini dapat digunakan untuk memicu aksi otomatis (seperti mencetak label lulus QC, menghentikan mesin konveyor, atau memicu alarm stasiun kerja).
`
  },
  {
    id: 'widgets',
    title: 'Daftar Widget HMI',
    icon: LayoutGrid,
    color: '#a855f7', // Purple
    content: ''
  },
  {
    id: 'panduan-pemula-lengkap',
    title: 'Panduan Pemula Lengkap',
    icon: BookOpen,
    color: '#0ea5e9', // Sky
    content: `
**Panduan Lengkap MAVI MES untuk Pemula**
*Tables → App Builder → Triggers → Dashboard*

---

## 1. Overview Sistem

MAVI MES adalah platform **no-code** untuk membuat aplikasi manufaktur. Alur kerja utama:

\`\`\`
Tabel Database → App Builder → Triggers → Dashboard → Deploy
     ↓              ↓             ↓           ↓          ↓
  Simpan data    Buat UI      Tambah logika  Visualisasi  Jalankan
\`\`\`

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
| \`serial_number\` | Text | Nomor serial produk |
| \`inspector_name\` | Text | Nama inspektur |
| \`inspection_date\` | Date | Tanggal inspeksi |
| \`result\` | Text | Hasil: PASS / FAIL |
| \`defect_notes\` | Text | Catatan defect |
| \`photo_url\` | Text | URL foto hasil |

**Langkah:**
1. Klik **"+ Create New Table"**
2. Isi nama tabel: \`qc_inspections\`
3. Tambah kolom satu per satu dengan klik **"+ Add Field"**
4. Pilih tipe data untuk setiap kolom
5. Klik **Save**

### 2.3 Contoh Tabel Lain yang Berguna

**Tabel Work Orders:**
- \`work_order_id\` (Text)
- \`product_name\` (Text)
- \`quantity\` (Number)
- \`status\` (Text): PENDING / IN_PROGRESS / COMPLETED
- \`due_date\` (Date)

**Tabel Defect Log:**
- \`defect_id\` (Text)
- \`product_serial\` (Text)
- \`defect_type\` (Text)
- \`severity\` (Text): LOW / MEDIUM / HIGH / CRITICAL
- \`corrective_action\` (Text)
- \`reported_by\` (Text)

---

## 3. Membangun Aplikasi dengan App Builder

### 3.1 Membuka App Builder
1. Klik menu **Apps**
2. Klik **"Buat Aplikasi Baru"** atau pilih template
3. App Builder akan terbuka dengan kanvas kosong

### 3.2 Mengenal Interface App Builder

\`\`\`
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
\`\`\`

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
   - \`text\`: "FORM INSPEKSI QC"
   - \`fontSize\`: 24
   - \`fontWeight\`: bold
   - \`textAlignment\`: center

**Langkah 2: Tambah Input Serial Number**
1. Drag widget **TEXT_INPUT** ke canvas
2. Di Properties:
   - \`placeholder\`: "Masukkan Serial Number..."
   - \`targetVariable\`: \`serial_number\`

**Langkah 3: Tambah Dropdown Hasil**
1. Drag widget **DROPDOWN** ke canvas
2. Di Properties:
   - \`options\`: ["PASS", "FAIL"]
   - \`targetVariable\`: \`inspection_result\`

**Langkah 4: Tambah Tombol Submit**
1. Drag widget **BUTTON** ke canvas
2. Di Properties:
   - \`text\`: "SUBMIT"
   - \`backgroundColor\`: "#2563eb"
   - \`color\`: "white"

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
| \`ON_CLICK\` | Saat tombol/widget diklik |
| \`ON_CHANGE\` | Saat nilai input berubah |
| \`ON_SUBMIT\` | Saat form disubmit |
| \`ON_LOAD\` | Saat step dimuat |
| \`ON_ROW_SELECT\` | Saat baris tabel dipilih |

### 4.4 Jenis Aksi Trigger

#### a) SET_VARIABLE - Ubah Nilai Variabel
\`\`\`
Event: ON_CLICK
Aksi: SET_VARIABLE
Variable: inspection_result
Value: "PASS"
\`\`\`

#### b) NAVIGATION - Pindah Step
\`\`\`
Event: ON_CLICK
Aksi: NAVIGATION
Action: GO_TO_STEP
Step: "Step 2: Hasil"
\`\`\`

#### c) SHOW_MESSAGE - Tampilkan Notifikasi
\`\`\`
Event: ON_CLICK
Aksi: SHOW_MESSAGE
Message: "Data berhasil disimpan!"
Message Type: success
\`\`\`

#### d) SAVE_TO_TABLE - Simpan ke Database
\`\`\`
Event: ON_CLICK
Aksi: SAVE_TO_TABLE
Table: qc_inspections
Fields:
  - serial_number: {{@serial_number}}
  - inspector_name: {{@inspector_name}}
  - result: {{@inspection_result}}
\`\`\`

#### e) LOAD_FROM_TABLE - Ambil Data dari Database
\`\`\`
Event: ON_LOAD
Aksi: LOAD_FROM_TABLE
Table: qc_inspections
Filter: serial_number = {{@serial_number}}
Limit: 1
\`\`\`

### 4.5 Contoh Trigger Lengkap: Form Submit

**Skenario:** Tombol Submit menyimpan data ke tabel dan pindah ke halaman terima kasih

\`\`\`
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
\`\`\`

### 4.6 Variabel App (App Variables)

Variabel adalah **wadah penyimpanan sementara** di memori aplikasi.

**Membuat Variabel:**
1. Di App Builder, klik tab **"Variables"** (di panel kiri)
2. Klik **"+ Add Variable"**
3. Isi:
   - \`name\`: \`serial_number\`
   - \`type\`: string
   - \`defaultValue\`: ""

**Menggunakan Variabel:**
- Di widget: \`{{@serial_number}}\`
- Di trigger: \`variable: "serial_number"\`

### 4.7 Record Placeholder (untuk Tabel)

Record Placeholder adalah **wadah untuk satu baris data** dari tabel.

**Membuat Record Placeholder:**
1. Di App Builder, klik tab **"Record Placeholders"**
2. Klik **"+ Add Record Placeholder"**
3. Isi:
   - \`name\`: \`current_inspection\`
   - \`tableId\`: pilih tabel \`qc_inspections\`

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

### 5.3 Menghubungkan Dashboard dengan Tabel

1. Di widget dashboard, klik **"Data Source"**
2. Pilih tabel yang sudah dibuat (misal: \`qc_inspections\`)
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
\`\`\`
Tanya diri sendiri:
- Data apa yang perlu dikumpulkan?
- Siapa yang akan mengisi data?
- Bagaimana data akan ditampilkan?
- Ke mana data akan dikirim?
\`\`\`

### 2. Buat Prototipe Sederhana
\`\`\`
Step 1: Buat tabel dulu
Step 2: Buat app dengan 1-2 widget
Step 3: Test dengan data dummy
Step 4: Tambah widget/logika bertahap
\`\`\`

### 3. Gunakan Template
- App Store menyediakan banyak template siap pakai
- Install template yang sesuai
- Kustomisasi sesuai kebutuhan

### 4. Test Sebelum Deploy
- Gunakan **Preview/Simulate** di App Builder
- Test semua trigger dan alur
- Pastikan data tersimpan dengan benar

---

## Troubleshooting Umum

| Masalah | Solusi |
|---------|--------|
| Widget tidak muncul di preview | Cek apakah widget sudah di-save |
| Trigger tidak jalan | Pastikan event dan aksi sudah benar |
| Data tidak tersimpan | Cek koneksi database dan field names |
| Variabel tidak terisi | Pastikan \`{{@variable_name}}\` benar |
| Dashboard kosong | Cek data source dan filter |
| App tidak muncul di Station | Pastikan sudah di-publish dan di-assign |

---

## Referensi Cepat

### Syntax Variabel
\`\`\`
{{@variable_name}}          → Variabel app
{{@record.field}}           → Record placeholder field
{{@APP_INFO.USER}}          → Nama user login
{{@APP_INFO.STATION}}       → Nama station
\`\`\`

### Tipe Data
- \`string\` → Teks
- \`number\` → Angka
- \`boolean\` → true/false
- \`date\` → Tanggal
- \`image\` → URL gambar

### Trigger Actions
- \`SET_VARIABLE\` → Ubah nilai variabel
- \`NAVIGATION\` → Pindah step/tab
- \`SHOW_MESSAGE\` → Tampilkan notifikasi
- \`SAVE_TO_TABLE\` → Simpan ke tabel
- \`LOAD_FROM_TABLE\` → Ambil dari tabel
- \`UPDATE_TABLE\` → Update data di tabel
- \`DELETE_TABLE_RECORD\` → Hapus data
- \`EXECUTE_FUNCTION\` → Jalankan function kustom
\`\`\`
    `
  },
  {
    id: 'node-canvas',
    title: 'Node Canvas & Logic Flow',
    icon: Network,
    color: '#6366f1',
    content: `
# 🔷 Node Canvas — Enterprise Visual Logic Flow Builder

Menu **Node Canvas** adalah lingkungan pemrograman visual (Visual Logic Flow Editor) tingkat enterprise di Mavi MES untuk **memvisualisasikan, membaca, dan merancang logika aplikasi industri** berbasis node-graph.

---

## 🚀 5 Fitur Utama Enterprise Node Canvas:

1. **🔄 Auto-Wiring Engine (Drag-to-Connect Logic)**
   - Cukup tarik garis (**wire**) dari Handle Widget ➔ Variable / Step / Table / Action Node.
   - Sistem secara **otomatis** membuatkan pemicu logika dan menyimpan kode skripnya ke App Builder tanpa perlu isi form manual!

2. **🔀 Multi-Condition & ELSE Branching (IF - AND/OR - ELSE)**
   - Inspector tab **Logic** mendukung percabangan kondisi jamak (\`AND\` / \`OR\`).
   - Mendukung **ELSE Branch** jika kondisi tidak terpenuhi (misal: pemicu alarm atau notifikasi fallback).

3. **🌐 Live Telemetry Signal Pulse Visualizer**
   - Saat menekan **Play / Test Run Flow**, garis penghubung (wire) dan node akan **menyala berdenyut hijau (Glow Pulse)** secara real-time saat sinyal sensor/event melintas.

4. **↩️ Undo / Redo History Stack (Ctrl+Z / Ctrl+Y)**
   - Dukungan pintasan keyboard \`Ctrl+Z\` (Undo) dan \`Ctrl+Y\` (Redo) serta tombol history pada toolbar untuk membatalkan pergeseran node atau penghapusan wire.

5. **📦 Export & Import JSON Flow Blueprints**
   - Tombol **Export JSON** dan **Import JSON** pada toolbar untuk menyimpan cetak biru (*blueprint*) alur logika aplikasi ke file lokal atau membagikannya ke stasiun kerja lain.

---

## 🗺️ Layout & Navigasi Utama

| Area | Posisi | Fungsi |
|------|--------|--------|
| **Palette** | Kiri | Library 4 tab: Widgets, Events, Vars, dan Tables |
| **Canvas** | Tengah | Kanvas visual tempat menggambar node & wire |
| **Inspector** | Kanan | Panel konfigurasi Props, Logic Multi-IF, dan Info |
| **Console** | Bawah | Output log eksekusi simulasi sinyal real-time |

---

## 🎨 Kode Warna Node & Wire

| Warna | Tipe Node | Fungsi |
|-------|-----------|--------|
| 🟣 **Indigo** | Widget BUTTON | Tombol pemicu aksi |
| 🔵 **Biru** | Widget TEXT / Step | Step navigasi / Teks |
| 🟢 **Hijau Teal** | Widget GAUGE | Indikator analog sensor |
| 🔴 **Merah** | Trigger Node | Titik WHEN (Event pemicu) |
| 🟣 **Violet** | Action Node | Titik THEN (Aksi utama) |
| 🟢 **Hijau** | Variable Node | Variabel state aplikasi |
| 🩵 **Teal** | Table Node | Database log / record |
| 🟠 **Oranye** | Branch Condition | Multi-Condition (IF/ELSE) |

---

## 💡 Cara Pintas & Tips Penggunaan

1. **Tarik Wire untuk Auto-Connect**: Tarik dari handle kanan Widget ke Variable untuk otomatis membuat update state.
2. **Auto-Arrange Layout**: Klik tombol **Auto-Arrange** untuk merapikan ribuan node dalam hitungan milidetik.
3. **Pintasan Keyboard**: Gunakan \`Ctrl+Z\` untuk Undo dan \`Ctrl+Y\` untuk Redo saat mengedit kanvas.
4. **Simpan Logic**: Setiap pengubahan kondisi di Inspector akan langsung memperbarui state di App Builder & database.

    `
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
  const [fullscreenImg, setFullscreenImg] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  // MCP Tab States & Refs
  const [activeTab, setActiveTab] = useState('assistant'); // 'assistant' | 'mcp_console'
  const [mcpStations, setMcpStations] = useState([]);
  const [mcpLogs, setMcpLogs] = useState([]);
  const [mcpMessages, setMcpMessages] = useState([
    {
      role: 'assistant',
      content: 'Antigravity Live MCP Console Ready. Anda bisa menanyakan status stasiun, membaca tabel database, atau memonitor sensor mesin secara langsung.'
    }
  ]);
  const [isMcpLoading, setIsMcpLoading] = useState(false);

  // Load stations on activeTab = 'mcp_console'
  useEffect(() => {
    if (activeTab === 'mcp_console') {
      loadMcpStations();
    }
  }, [activeTab]);

  const loadMcpStations = async () => {
    try {
      const data = await getStations();
      setMcpStations(data || []);
    } catch (e) {
      console.error('Failed to load MCP stations:', e);
    }
  };

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
      if (activeTab === 'mcp_console') {
        handleMcpSend();
      } else {
        handleSend();
      }
    }
  };

  const handleMcpSend = async (messageText = null) => {
    const textToSend = messageText !== null ? messageText : input;
    if (!textToSend.trim() || isMcpLoading) return;

    const userMessage = { role: 'user', content: textToSend };
    setMcpMessages(prev => [...prev, userMessage]);
    if (messageText === null) setInput('');
    setIsMcpLoading(true);

    // Append to live developer terminal logs
    setMcpLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      type: 'INFO',
      message: `User: "${textToSend}"`
    }]);

    try {
      if (!aiConnector || !aiConnector.config?.apiKey) {
        throw new Error('AI Connector belum dikonfigurasi. Silakan setting AI di halaman Integrasi terlebih dahulu.');
      }

      const history = mcpMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      
      const systemPrompt = `
Anda adalah **Antigravity Live MCP Agent** yang terintegrasi di dalam dashboard Mavi MES.
Tugas Anda adalah memantau dan mengendalikan stasiun kerja, membaca database, dan mengambil telemetri sensor lokal.
Anda memiliki akses ke 5 tools lokal. Jika pengguna meminta informasi yang memerlukan tools tersebut, Anda WAJIB merespons dengan menyertakan tag XML \`<mcp_call tool="tool_name" params='{"key": "val"}' />\` di akhir pesan Anda dan jangan menulis apapun setelah tag tersebut agar sistem dapat mengeksekusinya.

Daftar tools:
1. **get_station_status**: Membaca status stasiun manufaktur saat ini. Params: \`{"stationId": "string"}\`.
2. **set_station_status**: Memperbarui status stasiun manufaktur (RUNNING / IDLE / STOPPED / SETUP). Params: \`{"stationId": "string", "status": "string"}\`.
3. **read_mavi_table**: Membaca baris data dari tabel kualitas/produksi. Params: \`{"tableName": "string"}\`.
4. **write_mavi_table**: Menambahkan baris log/downtime baru ke database. Params: \`{"tableName": "string", "row": object}\`.
5. **get_machine_info**: Mengambil telemetri sensor (suhu, getaran, rpm) mesin pabrik. Params: \`{"machineId": "string"}\`.

Jika status stasiun berhasil diubah, pastikan mengonfirmasi bahwa relai PLC kontaktor stasiun telah di-update secara fisik.
`;

      const payload = [
        { role: 'system', content: systemPrompt },
        ...history,
        { role: 'user', content: userMessage.content }
      ];

      const response = await getChatCompletion(payload, aiConnector);
      
      setMcpMessages(prev => [...prev, { role: 'assistant', content: response }]);

      // Check for MCP call tags
      const mcpCallRegex = /<mcp_call\s+tool="([^"]+)"\s+params='([^']+)'\s*\/>/gi;
      const match = mcpCallRegex.exec(response);
      if (match) {
        const toolName = match[1];
        const paramsStr = match[2];
        let params = {};
        try {
          params = JSON.parse(paramsStr);
        } catch (e) {}

        // Log execution to terminal console
        setMcpLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          type: 'MCP_CALL',
          message: `Executing tool ${toolName} with params: ${paramsStr}`
        }]);

        let toolOutput = "";
        try {
          if (toolName === 'get_station_status') {
            const supabase = getSupabaseClient();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.stationId);
            let query = supabase.from('stations').select('*');
            if (isUuid) {
              query = query.or(`id.eq.${params.stationId},name.ilike.%${params.stationId}%`);
            } else {
              query = query.ilike('name', `%${params.stationId}%`);
            }
            const { data: stations, error: stationError } = await query.limit(1);

            if (stationError) {
              toolOutput = JSON.stringify({ error: `Gagal membaca database: ${stationError.message}` });
            } else if (stations && stations.length > 0) {
              const station = stations[0];
              toolOutput = JSON.stringify({ id: station.id, name: station.name, status: station.status || 'RUNNING', operator: station.active_operator || 'None' });
            } else {
              toolOutput = JSON.stringify({ error: `Stasiun '${params.stationId}' tidak ditemukan.` });
            }
          } 
          else if (toolName === 'set_station_status') {
            const supabase = getSupabaseClient();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.stationId);
            let query = supabase.from('stations').select('*');
            if (isUuid) {
              query = query.or(`id.eq.${params.stationId},name.ilike.%${params.stationId}%`);
            } else {
              query = query.ilike('name', `%${params.stationId}%`);
            }
            const { data: stations, error: stationError } = await query.limit(1);

            if (stationError || !stations || stations.length === 0) {
              toolOutput = JSON.stringify({ error: `Stasiun '${params.stationId}' tidak ditemukan.` });
            } else {
              const station = stations[0];
              const statusUpper = params.status.toUpperCase();
              
              const { data: updateData, error: updateError } = await supabase
                .from('stations')
                .update({ status: statusUpper, updated_at: new Date().toISOString() })
                .eq('id', station.id)
                .select();
                
              if (updateError) {
                toolOutput = JSON.stringify({ error: `Gagal mengupdate database: ${updateError.message}` });
              } else {
                // Update local state simulator
                setMcpStations(prev => prev.map(s => {
                  if (s.id === station.id) {
                    return { ...s, status: statusUpper };
                  }
                  return s;
                }));
                toolOutput = JSON.stringify({ 
                  success: true, 
                  stationId: station.id, 
                  status: statusUpper, 
                  message: `Relai kontaktor PLC di stasiun ${station.name} berhasil dipicu ke status ${statusUpper} (Database berhasil diupdate).` 
                });
              }
            }
          } 
          else if (toolName === 'read_mavi_table') {
            const tables = await getTables();
            const table = tables.find(t => t.name?.toLowerCase() === params.tableName?.toLowerCase());
            if (table) {
              const records = await getTableRecords(table.id);
              toolOutput = JSON.stringify({ tableName: table.name, recordCount: records.length, records: records.slice(0, 3) });
            } else {
              toolOutput = JSON.stringify({ error: `Tabel '${params.tableName}' tidak ditemukan.` });
            }
          } 
          else if (toolName === 'write_mavi_table') {
            const tables = await getTables();
            const table = tables.find(t => t.name?.toLowerCase() === params.tableName?.toLowerCase());
            if (table) {
              const res = await addTableRecord(table.id, params.row || {});
              toolOutput = JSON.stringify({ success: true, insertedRow: res });
            } else {
              toolOutput = JSON.stringify({ error: `Tabel '${params.tableName}' tidak ditemukan.` });
            }
          } 
          else if (toolName === 'get_machine_info') {
            const supabase = getSupabaseClient();
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.machineId);
            let query = supabase.from('machines').select('*');
            if (isUuid) {
              query = query.or(`id.eq.${params.machineId},name.ilike.%${params.machineId}%`);
            } else {
              query = query.ilike('name', `%${params.machineId}%`);
            }
            const { data: machines, error: machineError } = await query.limit(1);

            if (machineError) {
              toolOutput = JSON.stringify({ error: `Gagal membaca database: ${machineError.message}` });
            } else if (machines && machines.length > 0) {
              toolOutput = JSON.stringify(machines[0]);
            } else {
              toolOutput = JSON.stringify({ error: `Mesin '${params.machineId}' tidak ditemukan.` });
            }
          } else {
            toolOutput = JSON.stringify({ error: `Tool ${toolName} tidak dikenal.` });
          }
        } catch (err) {
          toolOutput = JSON.stringify({ error: err.message });
        }

        // Add tool response to terminal logs
        setMcpLogs(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString(),
          type: 'MCP_RESP',
          message: `Tool ${toolName} returned: ${toolOutput.substring(0, 100)}...`
        }]);

        // Add system log block in chat
        setMcpMessages(prev => [...prev, {
          role: 'system',
          content: `⚙️ MCP Tool Call: ${toolName}`,
          mcpLog: { toolName, params, output: toolOutput }
        }]);

        // Trigger follow-up to explain the tool output
        const followUpPayload = [
          { role: 'system', content: systemPrompt },
          ...history,
          { role: 'user', content: userMessage.content },
          { role: 'assistant', content: response },
          { role: 'user', content: `[SYSTEM: Tool execution output for ${toolName} is: ${toolOutput}. Jelaskan hasil ini kepada pengguna dalam bahasa Indonesia.]` }
        ];

        const finalResponse = await getChatCompletion(followUpPayload, aiConnector);
        setMcpMessages(prev => [...prev, { role: 'assistant', content: finalResponse }]);
      }
    } catch (err) {
      setMcpMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Error: ${err.message}`, 
        isError: true 
      }]);
    } finally {
      setIsMcpLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', padding: '24px', flex: 1, minHeight: 0, boxSizing: 'border-box', backgroundColor: '#f8fafc', flexDirection: 'column' }}>
      
      {/* ─── MAIN HEADER TAB SELECTION ───────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffffff', borderRadius: '12px', padding: '4px', border: '1px solid #e2e8f0', gap: '6px' }}>
        <button
          onClick={() => setActiveTab('assistant')}
          style={{
            flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px',
            backgroundColor: activeTab === 'assistant' ? '#6366f1' : 'transparent',
            color: activeTab === 'assistant' ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <BookOpen size={16} />
          Mavi Guide Assistant
        </button>
        <button
          onClick={() => setActiveTab('mcp_console')}
          style={{
            flex: 1, padding: '10px 16px', border: 'none', borderRadius: '8px',
            backgroundColor: activeTab === 'mcp_console' ? '#8b5cf6' : 'transparent',
            color: activeTab === 'mcp_console' ? 'white' : '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
            transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
          }}
        >
          <BrainCircuit size={16} />
          Antigravity MCP Live Console
        </button>
      </div>

      {/* ─── TWO COLUMN MAIN CONTENT WORKSPACE ────────────────────── */}
      <div style={{ flex: 1, display: 'flex', gap: '24px', minHeight: 0 }}>
        
        {/* Left Column depending on Active Tab */}
        {activeTab === 'assistant' ? (
          /* Assistant Left Column: Guides and Docs */
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
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
                      width: '42px', height: '42px', borderRadius: '12px', border: isActive ? '1px solid ' + guide.color : '1px solid #e2e8f0',
                      backgroundColor: isActive ? `${guide.color}15` : '#ffffff',
                      color: isActive ? guide.color : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? `0 4px 12px ${guide.color}20` : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${guide.color}40`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = isActive ? `0 4px 12px ${guide.color}20` : '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
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
                <WidgetDirectory onImageClick={setFullscreenImg} />
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
                            style={{ 
                              maxWidth: '100%', 
                              borderRadius: '12px', 
                              border: '1px solid #cbd5e1', 
                              margin: '16px 0', 
                              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                              cursor: 'zoom-in',
                              transition: 'transform 0.2s ease'
                            }} 
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.015)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            onClick={() => setFullscreenImg(props.src)}
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
        ) : (
          /* MCP Console Left Column: Local Shop Floor & Terminal Dashboard */
          <div style={{ flex: '1.2', display: 'flex', flexDirection: 'column', gap: '16px', minHeight: 0 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '10px', backgroundColor: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px' }}>
                  <BrainCircuit size={24} color="#8b5cf6" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.1rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Shop Floor Live MCP Monitor
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'chatPulseGlow 2s infinite' }} />
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Status stasiun & telemetri sensor local terintegrasi.</p>
                </div>
              </div>
              <button 
                onClick={loadMcpStations}
                style={{ padding: '6px 12px', fontSize: '0.75rem', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#475569', fontWeight: 600 }}
              >
                <RotateCw size={12} /> REFRESH
              </button>
            </div>

            {/* Live Stations list */}
            <div style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stasiun Kerja Aktif</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                {mcpStations.length === 0 ? (
                  <div style={{ gridColumn: '1/-1', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', padding: '12px' }}>Tidak ada stasiun ditemukan.</div>
                ) : (
                  mcpStations.slice(0, 4).map(station => {
                    const statusColors = {
                      RUNNING: { bg: '#ecfdf5', text: '#10b981', light: '#10b981' },
                      IDLE: { bg: '#fffbeb', text: '#d97706', light: '#f59e0b' },
                      STOPPED: { bg: '#fef2f2', text: '#ef4444', light: '#ef4444' },
                      SETUP: { bg: '#f0f9ff', text: '#0284c7', light: '#0ea5e9' }
                    };
                    const color = statusColors[station.status] || statusColors.RUNNING;
                    return (
                      <div key={station.id} style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{station.name}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: '#64748b' }}>
                          <span style={{ fontSize: '0.9rem' }}>👤</span>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{station.active_operator || 'None'}</span>
                        </div>
                        <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 6px', borderRadius: '4px', backgroundColor: color.bg, color: color.text, fontSize: '0.6rem', fontWeight: 800 }}>
                          <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: color.light }} />
                          {station.status || 'RUNNING'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Live Terminal Log Viewer */}
            <div style={{ flex: 1, backgroundColor: '#090d16', borderRadius: '16px', border: '1px solid #1e293b', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px', overflow: 'hidden', fontFamily: 'monospace' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '8px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#38bdf8' }}>console@antigravity-mcp-server:~</span>
                <span style={{ fontSize: '0.65rem', color: '#475569' }}>v1.0.0 (Localhost)</span>
              </div>
              <div className="mavi-chat-scroll" style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.7rem' }}>
                <div style={{ color: '#64748b' }}>[System] Initializing Antigravity local collaboration pipeline...</div>
                <div style={{ color: '#10b981' }}>[Success] Connection established with Supabase Frontline DB.</div>
                <div style={{ color: '#a855f7' }}>[Ready] Listening to AI Agent tool calls via Model Context Protocol.</div>
                
                {mcpLogs.map((log, idx) => {
                  let color = '#94a3b8';
                  if (log.type === 'MCP_CALL') color = '#c084fc'; // Violet
                  if (log.type === 'MCP_RESP') color = '#22c55e'; // Green
                  if (log.type === 'ERROR') color = '#ef4444'; // Red
                  return (
                    <div key={idx} style={{ display: 'flex', gap: '8px' }}>
                      <span style={{ color: '#475569' }}>[{log.timestamp}]</span>
                      <span style={{ color, fontWeight: 'bold' }}>[{log.type}]</span>
                      <span style={{ color: '#e2e8f0', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{log.message}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Right Column: AI Chat Panel (Switched style based on Active Tab) */}
        <div style={{ 
          flex: '1', 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: activeTab === 'mcp_console' ? '#090d16' : '#0f172a',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px -15px rgba(0,0,0,0.3)',
          position: 'relative',
          border: activeTab === 'mcp_console' ? '1px solid #1e293b' : 'none'
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
            background: activeTab === 'mcp_console' 
              ? 'linear-gradient(135deg, #0f172a 0%, #090d16 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderBottom: '1px solid rgba(148,163,184,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 2
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '38px', height: '38px', borderRadius: '12px',
                background: activeTab === 'mcp_console'
                  ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.2)'
              }}>
                {activeTab === 'mcp_console' ? <BrainCircuit size={18} color="#fff" /> : <Bot size={18} color="#fff" />}
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {activeTab === 'mcp_console' ? 'Antigravity MCP Agent' : 'Mavi AI Assistant'}
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'chatPulseGlow 2s infinite' }} />
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '1px' }}>
                  {activeTab === 'mcp_console' ? 'Interactive local tool calls active' : 'Panduan instan & tanya jawab sistem Mavi'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Chat Message List View ── */}
          <div 
            ref={scrollRef}
            className="mavi-chat-scroll"
            style={{ 
              flex: 1, 
              padding: '24px 20px', 
              overflowY: 'auto', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '20px',
              backgroundColor: activeTab === 'mcp_console' ? 'rgba(9, 13, 22, 0.4)' : 'transparent',
              minHeight: 0
            }}
          >
            {/* Suggestions on Empty History */}
            {((activeTab === 'assistant' ? messages.length : mcpMessages.length) <= 1 && !(activeTab === 'assistant' ? isLoading : isMcpLoading)) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '20px', animation: 'chatFadeSlideIn 0.4s ease-out' }}>
                <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Pertanyaan Populer</div>
                {(activeTab === 'assistant' 
                  ? [
                      'Bagaimana cara mendeploy aplikasi ke stasiun?',
                      'Bagaimana cara kerja PLC tag binding?',
                      'Apa perbedaan record placeholder dengan variables?'
                    ]
                  : [
                      'Cek status stasiun manufaktur saat ini',
                      'Baca tabel inspeksi data kualitas',
                      'Bagaimana telemetri suhu mesin Press-03?',
                      'Matikan stasiun Line 1'
                    ]
                ).map((sug, idx) => (
                  <button 
                    key={idx}
                    className="mavi-chat-suggestion"
                    onClick={() => {
                      if (activeTab === 'mcp_console') {
                        handleMcpSend(sug);
                      } else {
                        setInput(sug);
                      }
                    }}
                    style={{
                      padding: '10px 14px', borderRadius: '10px',
                      backgroundColor: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(148,163,184,0.08)',
                      color: '#a5b4fc', fontSize: '0.78rem', textAlign: 'left',
                      cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500
                    }}
                  >
                    💡 {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Render loop based on active Tab */}
            {(activeTab === 'assistant' ? messages : mcpMessages).map((msg, idx) => {
              const isUser = msg.role === 'user';
              if (idx === 0 && (activeTab === 'assistant' ? messages.length : mcpMessages.length) <= 1 && !(activeTab === 'assistant' ? isLoading : isMcpLoading)) return null;
              return (
                <div key={idx} className="mavi-chat-msg" style={{ 
                  display: 'flex', 
                  gap: '10px', 
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  position: 'relative',
                  zIndex: 1,
                  flexDirection: 'row'
                }}>
                  {!isUser && (
                    <div style={{ 
                      width: '30px', height: '30px', borderRadius: '10px', 
                      background: activeTab === 'mcp_console'
                        ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                        : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      flexShrink: 0, marginTop: '2px',
                      boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
                    }}>
                      {activeTab === 'mcp_console' ? <BrainCircuit size={14} color="#fff" /> : <Sparkles size={14} color="#fff" />}
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

                      {/* Tool call card details */}
                      {msg.mcpLog && (
                        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#090d16', border: '1px solid #1e293b', borderRadius: '8px', color: '#38bdf8', fontSize: '0.7rem', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: 'bold', color: '#c084fc', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#c084fc' }} />
                            ⚙️ MCP CALL: {msg.mcpLog.toolName}
                          </div>
                          <div style={{ color: '#64748b', marginBottom: '6px' }}>Params: {JSON.stringify(msg.mcpLog.params)}</div>
                          <div style={{ color: '#4ade80', borderTop: '1px solid #1e293b', paddingTop: '6px', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                            Response: {msg.mcpLog.output}
                          </div>
                        </div>
                      )}
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
            {(activeTab === 'assistant' ? isLoading : isMcpLoading) && (
              <div className="mavi-chat-msg" style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', position: 'relative', zIndex: 1 }}>
                <div style={{ 
                  width: '30px', height: '30px', borderRadius: '10px', 
                  background: activeTab === 'mcp_console'
                    ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  flexShrink: 0, marginTop: '2px',
                  boxShadow: '0 2px 8px rgba(99,102,241,0.25)'
                }}>
                  {activeTab === 'mcp_console' ? <BrainCircuit size={14} color="#fff" /> : <Sparkles size={14} color="#fff" />}
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
            background: activeTab === 'mcp_console'
              ? 'linear-gradient(0deg, #090d16 0%, rgba(9,13,22,0.95) 100%)'
              : 'linear-gradient(0deg, #0f172a 0%, rgba(15,23,42,0.95) 100%)',
            borderTop: '1px solid rgba(148,163,184,0.08)',
            position: 'relative', zIndex: 2
          }}>
            
            {/* Knowledge Base Chips (only in assistant mode) */}
            {(activeTab === 'assistant' && knowledgeFiles.length > 0) && (
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
                borderRadius: (activeTab === 'assistant' && knowledgeFiles.length > 0) ? '0 0 14px 14px' : '14px',
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
                placeholder={activeTab === 'mcp_console' ? "Perintahkan pencarian status, log, atau set PLC..." : "Tanya apapun tentang cara kerja Mavi..."}
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
                  fontFamily: activeTab === 'mcp_console' ? 'monospace' : 'inherit',
                  lineHeight: '1.4'
                }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = (e.target.scrollHeight <= 120 ? e.target.scrollHeight : 120) + 'px';
                }}
              />
              {activeTab === 'assistant' && (
                <>
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
                      transition: 'all 0.25s ease', flexShrink: 0
                    }}
                  >
                    <Paperclip size={16} />
                  </button>
                </>
              )}
              <button
                className="mavi-chat-send"
                onClick={activeTab === 'mcp_console' ? () => handleMcpSend() : handleSend}
                disabled={(activeTab === 'assistant' ? isLoading : isMcpLoading) || !input.trim()}
                style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: ((activeTab === 'assistant' ? isLoading : isMcpLoading) || !input.trim()) 
                    ? 'rgba(51,65,85,0.5)' 
                    : activeTab === 'mcp_console'
                      ? 'linear-gradient(135deg, #a855f7, #8b5cf6)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: ((activeTab === 'assistant' ? isLoading : isMcpLoading) || !input.trim()) ? '#475569' : '#ffffff',
                  border: 'none', 
                  cursor: ((activeTab === 'assistant' ? isLoading : isMcpLoading) || !input.trim()) ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.25s ease', flexShrink: 0,
                  boxShadow: ((activeTab === 'assistant' ? isLoading : isMcpLoading) || !input.trim()) ? 'none' : '0 2px 10px rgba(99,102,241,0.3)'
                }}
              >
                {(activeTab === 'assistant' ? isLoading : isMcpLoading) ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>

            <div style={{ 
              textAlign: 'center', marginTop: '8px', 
              fontSize: '0.62rem', color: '#475569', fontWeight: 500,
              letterSpacing: '0.03em'
            }}>
              Powered by Mavi AI Engine & Antigravity MCP
            </div>
          </div>
        </div>

      </div>

      {/* Fullscreen Image Modal Overlay */}
      {fullscreenImg && (
        <div 
          onClick={() => setFullscreenImg(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            cursor: 'zoom-out',
            backdropFilter: 'blur(8px)',
            animation: 'maviHelpFadeIn 0.2s ease-out'
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setFullscreenImg(null); }}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={24} />
          </button>
          <img 
            src={fullscreenImg} 
            alt="Fullscreen Preview" 
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90%',
              maxHeight: '90%',
              objectFit: 'contain',
              borderRadius: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              animation: 'maviHelpZoomIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          />
          <style>{`
            @keyframes maviHelpFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            @keyframes maviHelpZoomIn {
              from { transform: scale(0.95); opacity: 0; }
              to { transform: scale(1); opacity: 1; }
            }
          `}</style>
        </div>
      )}
      
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

function WidgetDirectory({ onImageClick }) {
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
          style={{ 
            maxWidth: '100%', 
            borderRadius: '12px', 
            border: '1px solid #cbd5e1', 
            marginTop: '16px', 
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            cursor: 'zoom-in',
            transition: 'transform 0.2s ease'
          }} 
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.015)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onClick={() => onImageClick?.('/assets/hmi-widget-list.jpg')}
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
