# 📊 Mavi-MES: Composable Application Suites Presentation Slides

This presentation slide deck has been compiled as a native PowerPoint (.pptx) file:
📁 **[mavi_mes_presentation.pptx](file:///C:/Users/ACER/.gemini/antigravity/brain/4155ddda-a19d-44bf-a7d9-d3d2882b5a3a/mavi_mes_presentation.pptx)**

Below is the slide-by-slide structure and script content for your reference.

---

### **Slide 1: Title Slide (Dark Theme)**
*   **Over-title**: `SMART FACTORY OPERATIONAL DECK`
*   **Main Title**: `Mavi-MES: Composable Application Suites`
*   **Subtitle**: `End-to-End Operational Guide connecting Warehouse Ingestion, Production Execution, Andon Escalations, QMS Inspections, and OEE Leadership Analytics.`
*   **Theme Colors**: Deep Slate Gray (#0f172a) & Tech Teal (#0d9488)

---

### **Slide 2: Digital Transformation - The Four Operational Pillars (Light Theme)**
*   **Pillar 01: Gudang & Logistik**:
    *   *Description*: Mengotomatiskan penerimaan barang, pergerakan bin inventaris, dan siklus loop Kanban untuk mengeliminasi downtime kekurangan material.
*   **Pillar 02: Eksekusi Lini Produksi**:
    *   *Description*: Mengarahkan operator melalui instruksi kerja digital terintegrasi, melacak OEE secara real-time, dan menghentikan stasiun saat Andon downtime.
*   **Pillar 03: Frontline QMS**:
    *   *Description*: Menstandardisasi pengujian spesifikasi dan visual kontrol, mengisolasi defect instan di papan MRB, serta merancang tindakan korektif CAPA.
*   **Pillar 04: Analitik Manajemen**:
    *   *Description*: Menyajikan wawasan data terpadu untuk efisiensi siklus pemenuhan bahan baku, distribusi downtime, dan tingkat mutu langsung bagi pimpinan.

---

### **Slide 3: Alur Masuk & Manajemen Gudang (Light Theme)**
*   **Title**: `1. Alur Masuk & Manajemen Gudang`
*   **Core Concepts**:
    *   *Material Loading & Receiving*: Operator dermaga memindai material baru, mencatat lot, status, serta memasukkannya ke database supabase.
    *   *Material Warehouse*: Petugas stockroom memindahkan barang masuk ke rak penyimpanan tetap, memperbarui data bin secara real-time.
    *   *Inventory Management*: Menyediakan dasbor administrasi pusat untuk melihat kuantitas di setiap bin, mendefinisikan part baru, dan mengaktifkan kartu Kanban.
*   **Database Architecture**:
    *   `Inventory_Items` Table: tracks location IDs, areas, bin numbers, and status.
    *   `Material_Definitions` Table: stores part masters and target cycle times.
*   **💡 Auto-Seed Highlight**:
    *   Saat diinstal, sistem otomatis memasukkan 45 pcs unit silinder aktuator (`DEMO-CYL-A1`) ke lokasi `BIN-12 Rack A` agar dasbor langsung terisi data visual.

---

### **Slide 4: Alur Pengisian Bahan Baku di Shopfloor (Light Theme)**
*   **Title**: `2. Alur Pengisian Bahan Baku di Shopfloor`
*   **Core Concepts**:
    *   *Material Request App*: Operator memindai bin kosong saat bahan baku menipis, memicu order pemenuhan otomatis di database.
    *   *Replenishment App*: Bertindak sebagai terminal mini-warehouse untuk menampilkan daftar pesanan pengisian stok aktif berdasarkan prioritas FIFO.
    *   *Material Handling App*: Memberikan panduan picking terpadu dan peta rute antar stasiun bagi petugas logistik (*Water Spider*).
*   **Database Architecture**:
    *   `Material_Requests` Table: handles statuses (`PENDING`, `IN PROGRESS`, `COMPLETED`).
    *   `Kanban_Cards` Table: maintains bin occupancy (`FULL`, `EMPTY`).
*   **💡 Auto-Seed Highlight**:
    *   Data default diisi pesanan aktif silinder aktuator (10 unit, PENDING, stasiun 1) dan fasteners M6 (200 unit, IN PROGRESS, stasiun 2) untuk demonstrasi loop tangkas.

---

### **Slide 5: Eksekusi Produksi & Alur Downtime Andon (Light Theme)**
*   **Title**: `3. Eksekusi Produksi & Alur Downtime Andon`
*   **Core Concepts**:
    *   *Order Execution App*: Memuat daftar perintah kerja aktif, menuntun langkah perakitan, dan mencatat unit hasil kerja ke database secara terpadu.
    *   *Andon Terminal App*: Memberdayakan operator untuk langsung melaporkan kendala kritis, membekukan stasiun (`Status: DOWN`) demi mencegah cacat perakitan.
    *   *Andon Management App*: Menyediakan dasbor pusat bagi supervisor untuk menunjuk penanggung jawab masalah dan membuka kembali stasiun kerja.
*   **Database Architecture**:
    *   `Work_Orders` Table: manages orders status (`RELEASED`, `IN PROGRESS`, `COMPLETED`, `SHIPPED`).
    *   `Actions` Table: logs active alert tickets.
    *   `Stations` Table: tracks running or down states.
*   **💡 Auto-Seed Highlight**:
    *   Tabel stasiun langsung terisi data stasiun aktif berserta durasi downtime untuk kalkulasi Overall Equipment Effectiveness (OEE).

---

### **Slide 6: Frontline Quality (QMS) & Inspeksi Visual (Light Theme)**
*   **Title**: `4. Frontline Quality (QMS) & Inspeksi Visual`
*   **Core Concepts**:
    *   *Quality Inspection Suite*: Uji mutu produk di stasiun perakitan, memeriksa ukuran numerik atau mencocokkan titik kelurusan kelonggaran aktuator silinder.
    *   *Frontline QMS App (MRB)*: Menyediakan panel disposisi dewan kualitas. Operator menunjuk status scrap (buang), rework (perbaiki), atau use-as-is.
    *   *CAPA Incident Architect*: Penulisan tindakan pencegahan formal terintegrasi, mempermudah pelacakan investigasi 5-Why langsung di lapangan.
*   **Database Architecture**:
    *   `Inspection_Plans` Table: sets dynamic targets and UoMs.
    *   `Defect_Events` Table: tracks deviation tickets.
    *   `CAPA_Incidents` Table: links root causes to corrective plans.
*   **💡 Auto-Seed Highlight**:
    *   Tabel defect terisi contoh riil gagal uji silinder aktuator `PU-58130425022025` lengkap dengan alasan kegagalan kelurusan untuk simulasi alur penanganan deviasi kualitas.

### **Slide 7: Alur Penanganan Material Review Board (MRB) (Light Theme)**
*   **Title**: `4b. Alur Penanganan Material Review Board (MRB)`
*   **Core Concepts**:
    *   *Review & Audit Defect*: Evaluasi kegagalan dari visual QMS, revisi alasan/deskripsi detail jika diperlukan sebelum keputusan disposisi.
    *   *Penetapan Keputusan Disposisi*: Operator / Quality Engineer memilih salah satu keputusan disposisi material: Scrap (Buang), Rework (Perbaiki), atau Use-As-Is (Terima Deviasi).
    *   *Upload Bukti Fisik*: Mengambil foto fisik defect menggunakan kamera tablet, mencatat instruksi pengerjaan ulang (rework instructions) & penunjuk stasiun/penanggung jawab.
*   **Database Architecture**:
    *   `Defect_Events` Table: records status shifts (`SCRAPPED`, `REWORK IN PROGRESS`, `USE AS IS`), disposition types, justification, assignee, station, and upload evidence.
    *   `Work_Orders` Table: logs repair operations linked to specific stations.
*   **💡 Auto-Seed Highlight**:
    *   Dua record defect uji silinder (`PU-98210398` & `PU-98210399`) otomatis ditambahkan dalam status `PENDING MRB REVIEW` di backlog agar dashboard dapat langsung dievaluasi.

---

### **Slide 8: Dasbor Analitik OEE & Kinerja Pabrik (Light Theme)**
*   **Title**: `5. Dasbor Analitik OEE & Kinerja Pabrik`
*   **Core Concepts**:
    *   *Inventory Dashboard*: Memantau durasi penyelesaian loop pengisian material, membantu optimasi logistik tangkas pabrik.
    *   *Operations Management Dashboard*: Mengonsolidasikan OEE stasiun kerja secara langsung, grafik volume produksi per jam, dan rasio kualitas.
    *   *Downtime & Defect Analytics*: Memetakan sebaran penyebab terhentinya produksi (Andon) dan pola defect kualitas terbanyak.
*   **Database Architecture**:
    *   `Station_Activity_History` Table: logs downtime durations and reasons.
    *   `Production_Counts` Table: tracks targets vs actual quantities per hour.

---

### **Slide 9: Urutan Instalasi & Panduan Dependensi Suite (Light Theme)**
*   **Title**: `Urutan Instalasi & Panduan Dependensi Suite`
*   **Sequence Steps**:
    *   *Langkah 1: INVENTORY SUITE (Fondasi Utama)*:
        *   **App Store Templates**: `Material Warehouse`, `Inventory App Suite`.
        *   **Fungsi**: Membangun tabel fondasi `Inventory_Items` & `Material_Definitions`.
        *   **Langkah Verifikasi**: Buka *Material Warehouse App*, pastikan unit dummy `DEMO-CYL-A1` muncul di Rak `BIN-12`.
    *   *Langkah 2: PRODUCTION & ANDON SUITE (Operasional Inti)*:
        *   **App Store Templates**: `Composable MES for Discrete Manufacturing`, `Andon Terminal`, `Andon Management`.
        *   **Fungsi**: Menghubungkan perakitan & downtime stasiun kerja yang memotong stok.
        *   **Langkah Verifikasi**: Picu downtime stasiun di *Andon Terminal*, pastikan status stasiun `DOWN` terupdate real-time di dasbor Andon.
    *   *Langkah 3: QUALITY QMS SUITE (Sistem Keamanan Mutu)*:
        *   **App Store Templates**: `Quality Inspection Suite`, `Frontline QMS`, `Material Review Board (MRB)`.
        *   **Fungsi**: Mengevaluasi hasil lini & menyalurkan defect perakitan ke papan MRB.
        *   **Langkah Verifikasi**: Jalankan uji mutu, masukkan kegagalan uji kelonggaran, pastikan defect terdaftar instan ke MRB backlog.
    *   *Langkah 4: REPLENISHMENT & DASHBOARD (Optimasi & OEE)*:
        *   **App Store Templates**: `Replenishment App`, `Material Handling App`, `Operations Management Dashboard`.
        *   **Fungsi**: Konsolidasi Kanban loop, OEE, & cycle time historis pabrik secara utuh.
        *   **Langkah Verifikasi**: Scan bin kosong di *Request*, pastikan order baru masuk antrean *Water Spider* logistik.
*   **💡 Deployment Tips**:
    1. Setiap instalasi template mendeteksi dan membuat tabel Supabase yang belum ada.
    2. Urutan di atas menjamin data relasional terhubung secara instan dan bebas error null reference.

---

### **Slide 10: Pemetaan Proses & Diagram Alur Kerja Template (Light Theme - Flow Chart)**
*   **Title**: `Pemetaan Proses & Diagram Alur Kerja Template`
*   **Visual Flow Steps**:
    1.  `LANGKAH 1: INGESTION (Teal)`: *Material Loading & Warehouse*. Registrasi & penempatan material baru ke rak penyimpanan.
    2.  `LANGKAH 2: REPLENISH (Blue)`: *Material Request & Replenishment*. Pemicuan loop Kanban saat bin perakitan di lini habis.
    3.  `LANGKAH 3: EXECUTE (Orange)`: *Order Execution & Andon Terminal*. Instruksi perakitan operator & pemicuan downtime terintegrasi.
    4.  `LANGKAH 4: VERIFY (Gold)`: *Quality Inspection, QMS & Material Review Board (MRB)*. Uji toleransi produk perakitan & disposisi cacat (MRB).
    5.  `LANGKAH 5: ANALYZE (Purple)`: *Dashboard OEE & Analytics*. Konsolidasi pencapaian target per jam, OEE, & cycle time.
*   **💡 Layout Description**:
    *   Widescreen 16:9 slide presenting five beautiful, colored rounded rectangle panels side-by-side representing the end-to-end discrete manufacturing flow, with clean pointing arrow connectors and descriptions underneath each box.

---

### **Slide 11: Spesifikasi Perangkat Keras & Infrastruktur Lini (Light Theme)**
*   **Title**: `Spesifikasi Perangkat Keras & Infrastruktur Lini`
*   **Hardware Modules**:
    1.  `01 TABLET OPERATOR (Teal)`: Tablet layar sentuh min. 10 inci (iOS/Android) ditempatkan di stasiun perakitan operator & stasiun visual kualitas (QMS) sebagai terminal input.
    2.  `02 BARCODE SCANNER (Orange)`: Pemindai genggam USB/Bluetooth dalam mode Keyboard Emulation untuk scan otomatis nomor Lot material & barcode bin kosong Kanban secara cepat.
    3.  `03 ANDON MONITOR TV (Gold)`: Smart TV / TV LCD min. 43 inci di lorong stasiun perakitan untuk visualisasi stasiun DOWN secara terpusat bagi supervisor & tim utilitas.
    4.  `04 DATABASE SUPABASE (Purple)`: Koneksi Wi-Fi pabrik berlatensi rendah (<50ms) yang terhubung langsung ke skema Supabase aman untuk sinkronisasi inventaris & order secara instan.

---

### **Slide 12: Pedoman Standardisasi Label Barcode Pabrik (Light Theme)**
*   **Title**: `Pedoman Standardisasi Label Barcode Pabrik`
*   **Syntax Standard**:
    *   **Format Kartu Kanban (Bin Kosong)**:
        *   Sintaks: `KB-[KODE_STASIUN]-[NOMOR_PART]`
        *   Contoh: `KB-STA1-CYL-A1` (Scan bin kosong memicu order replenishment baru stasiun 1).
    *   **Format Lot Penerimaan (Barang Datang)**:
        *   Sintaks: `LOT-[NOMOR_PART]-[YYYYMMDD]-[BATCH]`
        *   Contoh: `LOT-CYL-A1-20260519-01` (Memastikan ketertelusuran cacat bahan baku di MRB).
    *   **Format Perintah Kerja (Work Order)**:
        *   Sintaks: `WO-[TIPE_PRODUK]-[NO_URUT]`
        *   Contoh: `WO-CYL-A1-0089` (Scan WO untuk memuat langkah instruksi perakitan).
*   **💡 Scanner Integration Guide**:
    1. Pemindai harus diatur ke mode keyboard (HID Mode) agar tulisan barcode langsung terisi ke kotak input teks.
    2. Rekomendasi stiker barcode tahan panas/oli untuk stiker rak logam atau bin perakitan logam.
    3. Parser regex yang tertanam pada widget Mavi-MES memvalidasi kecocokan nomor part secara otomatis untuk menghindari salah pemicuan.

---

### **Slide 13: Protokol Penanganan Masalah & FAQ Operasional (Light Theme)**
*   **Title**: `Protokol Penanganan Masalah & FAQ Operasional`
*   **Troubleshooting Matrix**:
    *   *Gejala 1*: Barcode dipindai tetapi pesanan pengisian Kanban tidak masuk ke antrean Water Spider.
        *   **✓ Solusi**: Pastikan kursor input (focus) sedang aktif di kotak teks scanner pada tablet stasiun perakitan operator, dan Wi-Fi tablet dalam kondisi terhubung internet pabrik.
    *   *Gejala 2*: Unit cacat terdeteksi stasiun QMS, tetapi stasiun perakitan operator tidak terkunci otomatis.
        *   **✓ Solusi**: Pastikan stasiun kerja di stasiun Quality Inspection dan stasiun Order Execution terdaftar menggunakan ID stasiun yang sama persis di database Supabase.
    *   *Gejala 3*: Angka pencapaian OEE dan grafik visualisasi downtime bernilai NaN atau kosong.
        *   **✓ Solusi**: Periksa tabel `Station_Activity_History`. Pastikan stasiun telah menyelesaikan minimal 1 work order agar kalkulasi rasio kualitas/performance OEE teracumulasi secara utuh.

---

### **Slide 14: Kesimpulan & Keunggulan Utama Mavi-MES (Dark Theme)**
*   **Title**: `KESIMPULAN: KEUNGGULAN UTAMA MAVI-MES`
*   **Key Values**:
    *   `Satu Arsitektur Database Terpadu`: Seluruh modul (Gudang, Produksi, Kualitas, Andon) bertukar data secara langsung tanpa perlu integrasi middleware rumit.
    *   `Proteksi Kesalahan Operasional (Poka-Yoke)`: Kegagalan kualitas di QMS atau pemicuan status downtime di Andon secara instan memblokir eksekusi perintah kerja di lini produksi.
    *   `Data Siap Pakai Langsung (Auto-Seed)`: Data demo riil terisi otomatis saat menginstal template agar simulasi alur berjalan lancar.
    *   `Kemudahan Kustomisasi Tanpa-Kode (No-Code Scaling)`: Insinyur lapangan dapat dengan mudah mendesain ulang tata letak, logika widget, dan tabel sesuai kebutuhan spesifik pabrik.
