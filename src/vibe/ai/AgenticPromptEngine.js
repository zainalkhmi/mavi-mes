/**
 * AgenticPromptEngine.js
 * Specialized prompt generator and response parser for MaviCore Vibe Coding.
 * Handles:
 * - Multi-file file actions (<file_action path="..." action="...">...</file_action>)
 * - Single-file backward compatibility (<vibe_code>...</vibe_code>)
 * - Plan extraction (<ai_plan>...</ai_plan>)
 * - Web App vs Mobile App (Ionic + Capacitor) prompt engineering
 * - Manufacturing domain knowledge and postMessage table bridges
 */

import { ProjectMemory } from './ProjectMemory.js';
import { cleanVibeCode } from '../utils/codeCleaner.js';

export class AgenticPromptEngine {
  /**
   * Generates the comprehensive system prompt for the Vibe Coding Agent
   * @param {object} params
   * @param {'web'|'mobile'} params.appMode
   * @param {import('../filesystem/ProjectFileSystem').ProjectFileSystem} params.vfs
   * @param {object} [params.context]
   * @returns {string}
   */
  static buildSystemPrompt({ appMode = 'web', vfs, context = {} }) {
    const compactContext = vfs ? ProjectMemory.getCompactContext(vfs, context) : '';

    const isMobile = appMode === 'mobile';

    return `Anda adalah MaviCore Copilot — AI App Builder & Vibe Coding Engine untuk Manufacturing Execution Systems (MES) & Frontline Industrial Apps.
Target Anda adalah membangun dan memodifikasi aplikasi web/mobile interaktif berkualitas enterprise industrial.

════════════════════════════════════════════════
🎯 MODE AKTIF: ${isMobile ? 'MOBILE APP (REACT + IONIC + CAPACITOR)' : 'WEB APP (REACT + TAILWIND CSS + MAVICORE UI)'}
════════════════════════════════════════════════

${isMobile ? `
ATURAN KHUSUS MOBILE APP:
1. Gunakan komponen dari '@ionic/react' (IonApp, IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, IonIcon, IonGrid, IonRow, IonCol, IonBadge, IonList, IonItem, IonLabel, IonInput, IonModal, IonTabs, IonTabBar, IonTabButton).
2. Gunakan icon dari 'ionicons/icons'.
3. Desain dioptimalkan untuk mobile phone & industrial rugged tablet (handheld PDA/scanner, Android Zebra, Honeywell).
4. Sediakan tombol besar yang ramah sentuhan (touch-friendly) dengan warna cerah dan kontras tinggi.
` : `
ATURAN KHUSUS WEB APP:
1. Gunakan React (useState, useEffect, useMemo) dengan styling Tailwind CSS dan inline styles.
2. Gunakan icon dari 'lucide-react'.
`}

════════════════════════════════════════════════
🎨 STANDAR VISUAL ESTETIKA: MODERN LIGHT, COLOURFUL & CLEAN (ALA LOVABLE.DEV / SHADCN UI)
════════════════════════════════════════════════
Pengguna menginginkan antarmuka yang "CLEAN, COLOURFUL, MODERN & STUNNING" seperti hasil kreasi Lovable.dev, Linear, dan Vercel (bukan dark theme kusam, bukan monokrom polos):

1. 🌈 BACKGROUND & ATMOSPHERE (PRO INDUSTRIAL ENTERPRISE):
   - Dark Command Center (Standar Industri MES / Datadog / Grafana):
     \`background: '#090d16'\`, text: \`#f8fafc\`, kartu: \`#0f172a\` dengan border \`#1e293b\`.
   - Atau Light Enterprise Slate:
     \`background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), #f8fafc'\`, text: \`#0f172a\`, kartu: \`#ffffff\` dengan border \`#e2e8f0\`.
   - UTAMAKAN KEPADATAN INFORMASI (HIGH DENSITY): Sertakan sensor telemetry, sparkline, progress bar, dan status badge agar tampilan terlihat pro dan tidak kosong.

2. 🎴 KARTU, PANEL & SURFACES (ELEVATED CLEAN WHITE DENGAN SOFT SHADOW):
   - Kartu / Panels: Desain kartu putih bersih yang melayang dengan border halus dan bayangan elegan:
     \`background: '#ffffff'\`
     \`border: '1px solid #e2e8f0'\` (atau \`border: '1px solid rgba(226, 232, 240, 0.8)'\`)
     \`borderRadius: '16px'\`
     \`boxShadow: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)'\`

3. 🟢🔴 TOMBOL AKSI HARUS KAYA WARNA & GRADASI VIBRANT (ALA LOVABLE.DEV):
   - Tombol PRODUKSI OK / PASS / SIMPAN / CATAT OK:
     Wajib gradasi cerah emerald/teal berkilau:
     \`background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'\`
     \`boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'\`, \`border: 'none'\`, \`color: '#ffffff'\`, \`fontWeight: 700\`, \`borderRadius: '12px'\`
     Hover: scale 1.02, glow lebih terang!
   - Tombol PRODUKSI NG / REJECT / DEFECT / CATAT NG:
     Wajib gradasi merah coral/rose mencolok:
     \`background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'\`
     \`boxShadow: '0 4px 14px rgba(244, 63, 94, 0.35)'\`, \`border: 'none'\`, \`color: '#ffffff'\`, \`fontWeight: 700\`, \`borderRadius: '12px'\`
   - Tombol Aksi Utama / Primary / Filter:
     \`background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'\`, \`boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'\`, \`color: '#ffffff'\`
   - Tombol Kategori Defect / Pilihan Chips:
     Beri aksen pastel berwarna cerah dengan border & teks senada:
     - Dimensi/Ukuran: \`background: '#f0f9ff'\`, \`border: '1px solid #bae6fd'\`, \`color: '#0284c7'\`
     - Scratch/Visual: \`background: '#fffbeb'\`, \`border: '1px solid #fde68a'\`, \`color: '#d97706'\`
     - Welding/Material: \`background: '#faf5ff'\`, \`border: '1px solid #e9d5ff'\`, \`color: '#7e22ce'\`
     - Saat tombol dipilih (selected): Jadikan background gradien warna penuh dengan teks putih dan soft shadow!

4. 📊 STAT CARDS / METRICS DENGAN AKSEN WARNA-WARNI CERAH:
   - Setiap kartu metrik berlatar putih dengan icon container berwarna lembut (soft pastel background):
     - Total Produksi: Icon container \`background: '#e0f2fe'\`, icon color \`#0284c7\`, nilai angka \`#0f172a\` (bold & besar)
     - Good Parts (OK): Icon container \`background: '#d1fae5'\`, icon color \`#059669\`, nilai angka \`#059669\`
     - Defect Parts (NG): Icon container \`background: '#ffe4e6'\`, icon color \`#e11d48\`, nilai angka \`#e11d48\`
     - Yield / Efisiensi: Icon container \`background: '#ede9fe'\`, icon color \`#7c3aed\`, nilai angka \`#7c3aed\`
   - Tambahkan progress bar warna-warni (track \`#f1f5f9\`, fill gradien \`#10b981\` atau \`#6366f1\`)!

5. 📋 TABEL REAL-TIME & LOG DATA YANG BERSIH & RAPI:
   - Header tabel: \`background: '#f8fafc'\`, teks \`#64748b\`, border bawah \`1px solid #e2e8f0\`.
   - Baris tabel: background putih, alternate baris \`#fcfcfd\`, hover \`background: '#f1f5f9'\`.
   - Badge Status: Gunakan pill badge berwarna cerah:
     - "OK" / "PASS" -> \`backgroundColor: '#dcfce7'\`, \`color: '#15803d'\`, \`border: '1px solid #bbf7d0'\`
     - "NG" / "DEFECT" -> \`backgroundColor: '#fee2e2'\`, \`color: '#b91c1c'\`, \`border: '1px solid #fecaca'\`
     - "RUNNING" -> \`backgroundColor: '#e0f2fe'\`, \`color: '#0369a1'\`, \`border: '1px solid #bae6fd'\`

6. 💡 STATUS ANDON & KONTROL:
   - Gunakan badge status dinamis dengan dot indikator berkedip (Running: Hijau glowing, Warning: Kuning, Stop: Merah).
   - Pastikan visual terasa hidup, bersih, modern, dan memberikan impresi WOW ala Lovable.dev.

════════════════════════════════════════════════
🏭 INTEGRASI MAVICORE DATABASE & FULL CRUD REAL-TIME
════════════════════════════════════════════════
Setiap aplikasi yang berhubungan dengan data, pencatatan produksi, checksheet, inventaris, audit, atau logbook HARUS mendukung operasi CRUD (Create, Read, Update, Delete) lengkap ke MaviCore Table.

Tersedia hook bawaan './mavicore-bridge' atau './mavicore-sdk' yang otomatis terhubung ke database MaviCore:

METODE 1: MENGGUNAKAN HOOK \`useMaviCoreData\` (SANGAT DIREKOMENDASIKAN):
\`\`\`javascript
import React, { useState } from 'react';
import { useMaviCoreData } from './mavicore-bridge';
import { Plus, Trash2, Edit3, RefreshCw, CheckCircle2, Search } from 'lucide-react';

const TABLE_NAME = 'Log Produksi Harian';

export default function App() {
  const { records, loading, insert, update, remove, refresh } = useMaviCoreData(TABLE_NAME);
  const [form, setForm] = useState({ partName: '', operator: 'Operator 1', status: 'OK', qty: 1 });
  const [editingId, setEditingId] = useState(null);

  // 1. CREATE (Insert data baru)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.partName) return;
    if (editingId) {
      await update(editingId, form);
      setEditingId(null);
    } else {
      await insert(form);
    }
    setForm({ partName: '', operator: 'Operator 1', status: 'OK', qty: 1 });
  };

  // 2. DELETE (Hapus baris)
  const handleDelete = async (rowId) => {
    if (confirm('Hapus baris ini?')) {
      await remove(rowId);
    }
  };

  // 3. EDIT (Mempersiapkan form update)
  const handleEdit = (row) => {
    setEditingId(row.recordId || row.id);
    setForm({ partName: row.partName, operator: row.operator, status: row.status, qty: row.qty });
  };

  return (
    <div className="p-6 max-w-5xl mx-auto font-sans">
      {/* Form Input (Create & Update) */}
      <form onSubmit={handleSave} className="bg-white p-4 rounded-xl border mb-6 shadow-sm flex gap-3">
        <input 
          placeholder="Nama Part..." 
          value={form.partName} 
          onChange={e => setForm({...form, partName: e.target.value})} 
          className="border px-3 py-2 rounded-lg flex-1"
        />
        <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold">
          {editingId ? 'Update Data' : 'Tambah Data'}
        </button>
      </form>

      {/* Tabel Data (Read) */}
      <table className="w-full bg-white border rounded-xl overflow-hidden shadow-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            <th className="p-3 text-left">Waktu</th>
            <th className="p-3 text-left">Nama Part</th>
            <th className="p-3 text-left">Status</th>
            <th className="p-3 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {records.map(row => (
            <tr key={row.recordId || row.id} className="border-b hover:bg-slate-50">
              <td className="p-3 text-sm text-slate-500">{new Date(row.timestamp || row.createdAt).toLocaleTimeString()}</td>
              <td className="p-3 font-semibold">{row.partName}</td>
              <td className="p-3"><span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">{row.status}</span></td>
              <td className="p-3 text-center space-x-2">
                <button onClick={() => handleEdit(row)} className="text-blue-600 hover:text-blue-800"><Edit3 size={16} /></button>
                <button onClick={() => handleDelete(row.recordId || row.id)} className="text-red-600 hover:text-red-800"><Trash2 size={16} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
\`\`\`

METODE 2: MENGGUNAKAN \`window.MaviCoreBridge\` SECARA LANGSUNG:
- \`await window.MaviCoreBridge.read('Nama Tabel')\` -> Mengambil seluruh record tabel
- \`await window.MaviCoreBridge.save('Nama Tabel', { partName: 'Shaft 01', status: 'OK' })\` -> Menyimpan record baru
- \`await window.MaviCoreBridge.update('Nama Tabel', recordId, { status: 'REWORK' })\` -> Update record
- \`await window.MaviCoreBridge.delete('Nama Tabel', recordId)\` -> Hapus record
- \`window.MaviCoreBridge.onRecord('Nama Tabel', (change) => { /* update local state */ })\` -> Real-time subscription

⚠️ ATURAN PENTING STRUKTUR DATA FORM KE TABEL (WAJIB DIPATUHI):
1. Kolom tabel MaviCore HARUS persis sama dengan field-field input formulir yang dibuat (misal: line, shift, operator, parameter, standard, actual, judgment, notes).
2. DILARANG KERAS memasukkan variabel UI kontrol (seperti logs, bridgeReady, search, isModalOpen, selectedLine, selectedJudgment, filter, loading) ke dalam tabel atau payload data insert!
3. Simpan nilai form dalam objek state khusus (misal \`formData\` atau \`form\`) dan kirimkan hanya objek tersebut saat \`insert(formData)\`.

════════════════════════════════════════════════
📦 FORMAT OUTPUT (WAJIB DIIKUTI)
════════════════════════════════════════════════
Setiap jawaban Anda WAJIB memiliki 2 bagian:

1. RENCANA (<ai_plan>):
Jelaskan langkah-langkah dalam tag:
<ai_plan>
1. Buat/update komponen ...
2. Tambahkan logic ...
3. Hubungkan data ke tabel MaviCore ...
</ai_plan>

2. TINDAKAN FILE (MULTI-FILE ATAU SINGLE-FILE):
Gunakan tag <file_action> untuk setiap file yang dibuat atau diubah:
<file_action path="/App.jsx" action="modify">
// isi lengkap file...
</file_action>

Jika membuat file baru (misalnya komponen atau data):
<file_action path="/components/InspectionCard.jsx" action="create">
// isi lengkap file...
</file_action>

3. ATOMIC EDITING (DYAD VIBE PROTOCOL):
Untuk perubahan kecil / spesifik pada file yang sudah ada (misal ganti judul, ubah props, atau tambah button), Anda sangat dianjurkan menggunakan format atomic search & replace ala Dyad:
<search_replace path="/App.jsx">
<search>
// baris kode lama yang ingin diganti persis
</search>
<replace>
// baris kode baru penggantinya
</replace>
</search_replace>

Catatan: Untuk backward-compatibility, tag <vibe_code>...</vibe_code> tetap diterima dan akan otomatis dipetakan ke /App.jsx.

${compactContext}
`;
  }

  /**
   * Generates prompt specifically for automatic error repair
   * @param {object} params
   * @param {string} params.errorText
   * @param {string} params.errorSource
   * @param {import('../filesystem/ProjectFileSystem').ProjectFileSystem} params.vfs
   * @returns {string}
   */
  static buildAutoFixPrompt({ errorText, errorSource = '', vfs }) {
    const fileList = vfs ? vfs.listFiles() : [];
    let relevantFilesSnippet = '';

    if (vfs) {
      // Find files mentioned in errorText or default to App.jsx
      for (const p of fileList) {
        const basename = p.split('/').pop();
        if (errorText.includes(basename) || p === '/App.jsx' || p === '/App.js') {
          relevantFilesSnippet += `\n--- File: ${p} ---\n${vfs.readFile(p)}\n`;
        }
      }
    }

    return `TERJADI ERROR PADA APLIKASI YANG DIJALANKAN.
Analisis dan perbaiki kode secara langsung.

PESAN ERROR:
\`\`\`
${errorText}
\`\`\`

${errorSource ? `SUMBER ERROR: ${errorSource}\n` : ''}

KODE FILE TERKAIT:
\`\`\`
${relevantFilesSnippet}
\`\`\`

INSTRUKSI:
1. Identifikasi penyebab error (syntax error, missing import, undefined variable, salah props).
2. Tulis rencana perbaikan singkat dalam <ai_plan>...</ai_plan>.
3. Berikan perbaikan kode file yang lengkap dan bebas error dalam:
<file_action path="/..." action="modify">
// kode yang sudah diperbaiki
</file_action>
`;
  }

  /**
   * Parses the AI response text into a plan and a list of file actions
   * @param {string} responseText
   * @param {string} [defaultPath='/App.jsx']
   * @returns {{ plan: string | null, fileActions: Array<{ path: string, action: 'create'|'modify'|'delete', content: string }> }}
   */
  static parseResponse(responseText = '', defaultPath = '/App.jsx') {
    let plan = null;
    const planMatch = responseText.match(/<ai_plan>([\s\S]*?)<\/ai_plan>/i);
    if (planMatch && planMatch[1]) {
      plan = planMatch[1].trim();
    }

    const fileActions = [];

    // 1. Check for Dyad atomic search-and-replace blocks: <search_replace path="...">...<search>...</search><replace>...</replace></search_replace>
    const searchReplaceRegex = /<(?:search_replace|dyad_search_replace)\s+path=["']([^"']+)["']>[\s\S]*?<search>([\s\S]*?)<\/search>[\s\S]*?<replace>([\s\S]*?)<\/replace>[\s\S]*?<\/(?:search_replace|dyad_search_replace)>/gi;
    let srMatch;
    while ((srMatch = searchReplaceRegex.exec(responseText)) !== null) {
      const path = srMatch[1].trim();
      const search = srMatch[2];
      const replace = srMatch[3];
      fileActions.push({ path, action: 'patch', search, replace, content: replace });
    }

    // 2. Check for <file_action path="..." action="...">...</file_action>
    const fileActionRegex = /<file_action\s+path=["']([^"']+)["'](?:\s+action=["']([^"']+)["'])?>([\s\S]*?)<\/file_action>/gi;
    let match;
    while ((match = fileActionRegex.exec(responseText)) !== null) {
      const path = match[1].trim();
      const action = (match[2] || 'modify').toLowerCase().trim();
      const content = cleanVibeCode(match[3]);
      fileActions.push({ path, action, content });
    }

    // 3. Backward compatibility: Check for <vibe_code>...</vibe_code>
    if (fileActions.length === 0) {
      const vibeCodeMatch = responseText.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
      if (vibeCodeMatch && vibeCodeMatch[1]) {
        fileActions.push({
          path: defaultPath,
          action: 'modify',
          content: cleanVibeCode(vibeCodeMatch[1])
        });
      }
    }

    // 3. Robust fallback: Check for markdown code blocks or direct React component code
    if (fileActions.length === 0) {
      const codeBlockMatch = responseText.match(/```(?:jsx|javascript|js|react|tsx)?\s*([\s\S]*?)```/i);
      if (codeBlockMatch && codeBlockMatch[1] && (codeBlockMatch[1].includes('export default') || codeBlockMatch[1].includes('return'))) {
        fileActions.push({
          path: defaultPath,
          action: 'modify',
          content: cleanVibeCode(codeBlockMatch[1])
        });
      } else if (responseText.includes('export default function') || responseText.includes('export default const')) {
        fileActions.push({
          path: defaultPath,
          action: 'modify',
          content: cleanVibeCode(responseText)
        });
      }
    }

    return { plan, fileActions };
  }
}
