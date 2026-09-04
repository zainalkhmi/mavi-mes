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
🎨 STANDAR VISUAL ESTETIKA: WAJIB VIBRANT, MODERN & BERWARNA (DILARANG HITAM-PUTIH / MONOKROM!)
════════════════════════════════════════════════
PERINGATAN KERAS: JANGAN SEKALI-KALI membuat tampilan hitam-putih, wireframe kaku, atau kotak monokrom polos! Pengguna menginginkan antarmuka yang "GOOD & BEAUTIFUL", kaya warna, modern, dan memukau:

1. 🌈 BACKGROUND & CARD AESTHETICS (TIDAK BOLEH HITAM PEKAT POLOS):
   - Background Utama: Gunakan deep slate/navy mesh gradient mewah:
     \`background: 'linear-gradient(135deg, #0b0f19 0%, #0f172a 40%, #1e1b4b 100%)'\` atau \`radial-gradient(ellipse at top, #1e293b 0%, #0a0e1a 100%)\`. JANGAN pakai #000000 atau #ffffff polos!
   - Kartu / Panels: Desain glassmorphism bergradasi halus dengan border glow lembut:
     \`background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.85) 100%)'\`
     \`backdropFilter: 'blur(16px)'\`, \`border: '1px solid rgba(255, 255, 255, 0.08)'\`, \`borderRadius: '16px'\`
     \`boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'\`

2. 🟢🔴 TOMBOL AKSI HARUS KAYA WARNA & GRADASI (DILARANG TOMBOL KOTAK HITAM DENGAN TEKS PUTIH!):
   - Tombol PRODUKSI OK / PASS / CATAT OK:
     Wajib gradasi hijau emerald cerah berkilau:
     \`background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'\`
     \`boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'\`, \`border: '1px solid rgba(52, 211, 153, 0.4)'\`, \`color: '#ffffff'\`
     Hover & active: scale 1.02, glow lebih terang!
   - Tombol PRODUKSI NG / REJECT / DEFECT / CATAT NG:
     Wajib gradasi merah crimson/rose mencolok:
     \`background: 'linear-gradient(135deg, #f43f5e 0%, #dc2626 100%)'\`
     \`boxShadow: '0 6px 20px rgba(244, 63, 94, 0.4)'\`, \`border: '1px solid rgba(251, 113, 133, 0.4)'\`, \`color: '#ffffff'\`
   - Tombol Kategori Defect / Pilihan:
     Beri aksen warna-warni spesifik untuk tiap kategori, JANGAN kotak hitam putih:
     - Dimensi/Ukuran: \`background: 'rgba(56, 189, 248, 0.12)'\`, border: \`#0284c7\`, teks: \`#38bdf8\`
     - Scratch/Visual: \`background: 'rgba(245, 158, 11, 0.12)'\`, border: \`#d97706\`, teks: \`#fbbf24\`
     - Welding/Material: \`background: 'rgba(168, 85, 247, 0.12)'\`, border: \`#7c3aed\`, teks: \`#c084fc\`
     - Saat tombol dipilih (selected): Jadikan background gradien penuh dengan teks putih dan glow!

3. 📊 STAT CARDS / METRICS DENGAN AKSEN WARNA-WARNI CERAH:
   - Setiap kartu metrik harus memiliki aksen warna cerah yang hidup:
     - Total Produksi: Badge/Ikon Sky Blue (\`#38bdf8\`, container bg: \`rgba(14, 165, 233, 0.15)\`)
     - Good Parts (OK): Badge/Ikon Emerald Green (\`#34d399\`, container bg: \`rgba(16, 185, 129, 0.15)\`)
     - Defect Parts (NG): Badge/Ikon Coral Rose (\`#f87171\`, container bg: \`rgba(239, 68, 68, 0.15)\`)
     - Yield / Efisiensi: Badge/Ikon Violet (\`#c084fc\`, container bg: \`rgba(139, 92, 246, 0.15)\`)
   - Tambahkan indikator progress bar warna-warni yang mencerminkan capaian target!

4. 📋 TABEL REAL-TIME & LOG DATA YANG CANTIK:
   - Header tabel: \`background: 'rgba(30, 41, 59, 0.85)'\`, teks \`#94a3b8\`, border halus.
   - Baris tabel: zebra striping halus dengan efek hover glow (\`rgba(56, 189, 248, 0.06)\`).
   - Badge Status: Gunakan pill badge berwarna dengan dot indikator:
     - "OK" -> \`backgroundColor: 'rgba(16, 185, 129, 0.18)'\`, \`color: '#34d399'\`, border \`1px solid rgba(16, 185, 129, 0.3)\`
     - "NG" -> \`backgroundColor: 'rgba(239, 68, 68, 0.18)'\`, \`color: '#f87171'\`, border \`1px solid rgba(239, 68, 68, 0.3)\`

5. 💡 STATUS ANDON & KONTROL:
   - Gunakan indikator lampu status yang berkedip/glowing (Running: Hijau glowing, Warning: Kuning, Stop: Merah).
   - Pastikan visual terasa hidup, interaktif, elegan, dan membuat pengguna kagum (WOW).

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
