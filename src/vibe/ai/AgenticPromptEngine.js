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

1. 🌈 BACKGROUND & ATMOSPHERE (SEGAR, BERSIH DENGAN SOFT COLORFUL MESH):
   - Background Utama: Gunakan soft off-white/light slate canvas dengan subtle colorful pastel radial mesh di sudut layar:
     \`background: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.08) 0px, transparent 50%), radial-gradient(at 100% 0%, rgba(236, 72, 153, 0.06) 0px, transparent 50%), radial-gradient(at 50% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%), #f8fafc'\`
     atau \`background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'\`.
     Teks Utama: \`#0f172a\` (Slate 900) untuk heading, \`#475569\` (Slate 600) untuk deskripsi/label.
     (JANGAN gunakan background hitam pekat/dark pekat kecuali user secara eksplisit meminta 'dark mode').

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
🏭 INTEGRASI MAVICORE DATABASE & HARDWARE
════════════════════════════════════════════════
Setiap kali ada aksi simpan form, pencatatan produksi OK, reject NG, inspeksi toleransi, atau checksheet, SELALU sertakan pengiriman postMessage ke MaviCore database:
\`\`\`javascript
if (typeof window !== 'undefined' && window.parent) {
  window.parent.postMessage({
    type: 'MAVICORE_TABLE_INSERT',
    tableName: 'Nama Tabel yang Spesifik',
    data: { timestamp: new Date().toISOString(), ...dataFields }
  }, '*');
}
\`\`\`

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
   * @returns {{ plan: string | null, fileActions: Array<{ path: string, action: 'create'|'modify'|'delete', content: string }> }}
   */
  static parseResponse(responseText = '') {
    let plan = null;
    const planMatch = responseText.match(/<ai_plan>([\s\S]*?)<\/ai_plan>/i);
    if (planMatch && planMatch[1]) {
      plan = planMatch[1].trim();
    }

    const fileActions = [];

    // 1. Check for <file_action path="..." action="...">...</file_action>
    const fileActionRegex = /<file_action\s+path=["']([^"']+)["'](?:\s+action=["']([^"']+)["'])?>([\s\S]*?)<\/file_action>/gi;
    let match;
    while ((match = fileActionRegex.exec(responseText)) !== null) {
      const path = match[1].trim();
      const action = (match[2] || 'modify').toLowerCase().trim();
      const content = match[3].trim();
      fileActions.push({ path, action, content });
    }

    // 2. Backward compatibility: Check for <vibe_code>...</vibe_code>
    if (fileActions.length === 0) {
      const vibeCodeMatch = responseText.match(/<vibe_code>([\s\S]*?)<\/vibe_code>/i);
      if (vibeCodeMatch && vibeCodeMatch[1]) {
        fileActions.push({
          path: '/App.jsx',
          action: 'modify',
          content: vibeCodeMatch[1].trim()
        });
      }
    }

    return { plan, fileActions };
  }
}
