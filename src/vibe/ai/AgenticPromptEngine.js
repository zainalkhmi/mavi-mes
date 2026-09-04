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

import { ProjectMemory } from './ProjectMemory';

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
4. Sediakan tombol besar yang ramah sentuhan (touch-friendly) untuk operator yang memakai sarung tangan kerja.
` : `
ATURAN KHUSUS WEB APP:
1. Gunakan React (useState, useEffect, useMemo) dengan styling Tailwind CSS dan inline styles.
2. Palet warna: Slate 950 (#030712) background, kartu Slate 900 (#0f172a), border #1e293b.
3. Aksen status industri: Cyan/Sky (#38bdf8) untuk active/info, Emerald (#34d399 / #10b981) untuk OK/Normal, Rose/Red (#f43f5e / #ef4444) untuk Alarm/Defect/NG, Amber (#f59e0b) untuk Warning/Pending.
4. Gunakan icon dari 'lucide-react'.
`}

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
