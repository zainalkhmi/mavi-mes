# Mavi MES × n8n Integration Guide

Panduan lengkap untuk mengintegrasikan **Mavi MES** dengan **n8n** workflow automation.

---

## 📋 Daftar Isi

1. [Quick Start (5 Menit)](#quick-start)
2. [Event Types & Payload Schema](#event-types)
3. [Contoh Workflow n8n](#contoh-workflow)
4. [Supabase DB Triggers (Opsional)](#supabase-db-triggers)
5. [Security & HMAC Verification](#security)
6. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Setup n8n Webhook Node

1. Buka n8n → **Create New Workflow**
2. Tambah node **Webhook**
3. Set method: `POST`
4. Copy **Webhook URL** (Production URL, bukan Test URL)
5. Klik **Listen for Test Event** untuk mode testing

### 2. Konfigurasi di Mavi MES

1. Buka Mavi MES → **Settings** (⚙️)
2. Scroll ke section **"n8n / Webhook Integration"**
3. Paste **Webhook URL** dari n8n
4. (Opsional) Masukkan **Secret Key** untuk HMAC signature
5. Pilih event mana yang ingin di-subscribe
6. Aktifkan toggle **"Enable Webhook"**
7. Klik **"Test Connection"** → cek n8n menerima test event ✅

---

## Event Types

### Daftar Semua Event

| Event Type | Trigger | Deskripsi |
|---|---|---|
| `work_order.created` | WO baru dibuat | Job baru masuk production queue |
| `work_order.started` | Status → IN_PROGRESS | Work order mulai diproses |
| `work_order.completed` | Status → COMPLETED | Work order selesai |
| `cycle.completed` | Operator sign-off | Satu cycle produksi selesai |
| `inspection.passed` | QC Pass | Inspeksi kualitas lolos |
| `inspection.failed` | QC Fail | Inspeksi kualitas gagal |
| `andon.triggered` | Andon alert aktif | Masalah di line produksi |
| `andon.resolved` | Andon resolved | Masalah sudah ditangani |
| `production.job_created` | Job created | Job baru masuk antrian produksi |
| `machine.status_changed` | Machine update | Status mesin berubah |
| `inventory.low_stock` | Low stock alert | Stok di bawah threshold |
| `app.published` | App published | Frontline app dipublish ke shop floor |
| `test.connection` | Test button | Test koneksi dari settings panel |

### Payload Schema

Semua event dikirim sebagai JSON POST body dengan format standar:

```json
{
  "event": "work_order.completed",
  "timestamp": "2026-07-08T20:30:00.000Z",
  "source": "mavi-mes",
  "version": "1.0",
  "data": {
    "job_id": "uuid-xxx",
    "work_order": "WO-2026-001",
    "app_id": "uuid-xxx",
    "status": "COMPLETED",
    "target_qty": 100
  },
  "metadata": {
    "station": "Station-A",
    "operator": "Operator-01",
    "app_id": "uuid-xxx"
  }
}
```

### Headers

| Header | Contoh | Deskripsi |
|---|---|---|
| `Content-Type` | `application/json` | Selalu JSON |
| `X-Mavi-Event` | `work_order.completed` | Event type identifier |
| `X-Mavi-Source` | `mavi-mes` | Source identifier |
| `X-Mavi-Signature` | `sha256=abc123...` | HMAC-SHA256 signature (jika secret key di-set) |

---

## Contoh Workflow

### Workflow 1: WO Completed → Telegram Notification

```
[Webhook] → [IF: event == "work_order.completed"] → [Telegram] Send Message
```

**n8n Node Setup:**

1. **Webhook** node — Receive POST dari Mavi
2. **IF** node — Filter: `{{ $json.event }}` equals `work_order.completed`
3. **Telegram** node — Send Message:
   ```
   ✅ Work Order Selesai!
   WO: {{ $json.data.work_order }}
   Status: {{ $json.data.status }}
   Station: {{ $json.metadata.station }}
   Operator: {{ $json.metadata.operator }}
   Time: {{ $json.timestamp }}
   ```

### Workflow 2: QC Failed → Email Alert + Log ke Google Sheets

```
[Webhook] → [IF: event == "inspection.failed"] → [Email] + [Google Sheets]
```

**n8n Node Setup:**

1. **Webhook** node — Receive POST dari Mavi
2. **IF** node — Filter: `{{ $json.event }}` equals `inspection.failed`
3. **Send Email** node:
   - Subject: `⚠️ QC FAIL - {{ $json.data.work_order }}`
   - Body: Detail inspeksi dari `$json.data`
4. **Google Sheets** node — Append Row:
   - Spreadsheet: "QC Failure Log"
   - Columns: Timestamp, WO, Station, Operator, Details

### Workflow 3: Daily Production Report (Cron + Supabase Query)

```
[Schedule Trigger: 17:00 daily] → [Supabase] Query completions → [Code] Aggregate → [Email] Send Report
```

**n8n Node Setup:**

1. **Schedule Trigger** — Every day at 17:00
2. **Supabase** node — Query `completions` table:
   ```sql
   SELECT app_name, COUNT(*) as total, 
          AVG(duration_ms) as avg_duration
   FROM completions 
   WHERE end_time >= CURRENT_DATE
   GROUP BY app_name
   ```
3. **Code** node — Format data menjadi HTML report
4. **Send Email** node — Kirim ke management

### Workflow 4: Andon Alert → WhatsApp + Create Ticket

```
[Webhook] → [IF: event == "andon.triggered"] → [WhatsApp] + [Jira/Trello]
```

### Workflow 5: Multi-Event Router

Satu webhook URL untuk semua event, lalu di-route berdasarkan event type:

```
[Webhook] → [Switch: $json.event] 
  → "work_order.*" → [Production Team Channel]
  → "inspection.*" → [QC Team Channel]  
  → "andon.*"      → [Maintenance Team Channel]
```

---

## Supabase DB Triggers

> **Ini opsional.** Frontend webhook sudah cukup untuk kebanyakan use case.
> DB triggers berguna jika Anda ingin webhook tetap fire meskipun perubahan data 
> dilakukan langsung di database (bukan via Mavi frontend).

### Prerequisite

1. Buka **Supabase Dashboard** → **Database** → **Extensions**
2. Cari dan aktifkan **`pg_net`**
3. Set webhook URL di `app_variables`:

```sql
INSERT INTO app_variables (name, default_value)
VALUES ('N8N_WEBHOOK_URL', 'https://your-n8n.com/webhook/xxxx')
ON CONFLICT (name) DO UPDATE SET default_value = EXCLUDED.default_value;
```

4. Jalankan SQL trigger dari `supabase_setup.sql` (bagian terakhir file)

### Triggers yang Tersedia

| Trigger | Table | Event | n8n Event Type |
|---|---|---|---|
| `trg_n8n_production_queue` | `production_queue` | INSERT | `production.job_created` |
| `trg_n8n_production_queue` | `production_queue` | UPDATE | `work_order.started/completed` |
| `trg_n8n_completion` | `completions` | INSERT | `cycle.completed` |

---

## Security

### HMAC-SHA256 Signature Verification

Jika Anda mengisi **Secret Key** di Mavi settings, setiap webhook request akan menyertakan header:

```
X-Mavi-Signature: sha256=<hex-encoded-hmac>
```

**Verifikasi di n8n menggunakan Code node:**

```javascript
const crypto = require('crypto');
const secret = 'YOUR_SECRET_KEY';
const body = JSON.stringify($input.first().json);
const expectedSignature = 'sha256=' + crypto
  .createHmac('sha256', secret)
  .update(body)
  .digest('hex');

const receivedSignature = $input.first().headers['x-mavi-signature'];

if (receivedSignature !== expectedSignature) {
  throw new Error('Invalid webhook signature!');
}

return $input.all();
```

---

## n8n Credentials Setup

### Menggunakan HTTP Header Auth

Jika Anda ingin mengamankan n8n webhook dari akses tidak sah:

1. Di n8n Webhook node, set **Authentication** → **Header Auth**
2. Set header name: `X-API-Key`
3. Set value: `your-api-key-here`
4. Di Mavi, tambahkan API key yang sama (future feature)

### Rekomendasi Production

- Gunakan **n8n self-hosted** atau n8n Cloud
- Selalu set **Secret Key** untuk HMAC verification
- Gunakan **HTTPS** webhook URL
- Filter event yang benar-benar dibutuhkan (jangan subscribe semua)

---

## Troubleshooting

### Webhook Tidak Diterima di n8n

1. Cek apakah webhook **enabled** di Mavi Settings
2. Cek **Webhook URL** sudah benar (Production URL, bukan Test URL)
3. Cek **Delivery Log** di settings panel Mavi — lihat status terakhir
4. Pastikan n8n workflow sudah **Active** (toggle hijau)
5. Cek browser console untuk error `[n8n-Webhook]`

### CORS Error

Webhook dikirim dari browser (frontend). Jika n8n instance Anda tidak mengizinkan CORS:
- Gunakan **n8n Cloud** (CORS sudah di-handle)
- Atau set environment variable di n8n self-hosted:
  ```
  N8N_CORS_ALLOW_ORIGIN=*
  ```

### Retry Logic

- Mavi akan retry **3 kali** dengan exponential backoff (1s, 2s, 4s)
- Setelah 3x gagal, event di-log sebagai "failed" di delivery log
- Event yang gagal **tidak** di-queue untuk retry nanti (fire-and-forget)

### Delivery Log

Semua webhook delivery tercatat di **localStorage** (`mavi_n8n_webhook_log`).
Bisa dilihat di:
1. Mavi Settings → n8n section → Delivery Log
2. Browser DevTools → Application → Local Storage → `mavi_n8n_webhook_log`
