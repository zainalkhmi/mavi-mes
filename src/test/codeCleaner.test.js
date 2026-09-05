import { describe, it, expect } from 'vitest';
import { cleanVibeCode, healTruncatedReactCode, extractVibeCode, autoFixMissingImports } from '../vibe/utils/codeCleaner.js';

describe('codeCleaner robust handling', () => {
  it('does not append extra braces or parenthesis to already cleanly terminated components', () => {
    const code = `import React from 'react';
export default function App() {
  const label = "Quality Check (Station 1) {Critical}";
  return (
    <div className="p-4">
      <p>{label}</p>
    </div>
  );
}`;
    const cleaned = cleanVibeCode(code);
    expect(cleaned).not.toContain('}}');
    expect(cleaned).not.toContain(");'");
    expect(cleaned.endsWith('}')).toBe(true);
  });

  it('cleans rogue quotes and over-healed duplicate closures', () => {
    const corruptCode = `import React from 'react';
export default function App() {
  return (
    <div>
      <p>Test</p>
    </div>
  );
}}
      );'`;
    const cleaned = cleanVibeCode(corruptCode);
    expect(cleaned).not.toContain(");'");
    expect(cleaned).not.toContain('}}');
    expect(cleaned).toContain('export default function App');
  });

  it('rejects incomplete snippets (e.g. aborted on rate-limit 429) from being recognized as complete components', () => {
    const incomplete = `import React, { useState, useEffect } from 'react';
import { CheckCircle2, X`;
    const extracted = extractVibeCode(incomplete);
    expect(extracted).toBeNull();
  });

  it('heals genuinely cut-off JSX code by properly closing tags and function', () => {
    const truncated = `import React from 'react';
export default function App() {
  return (
    <div>
      <p>Cutting off here`;
    const healed = healTruncatedReactCode(truncated);
    expect(healed).toContain('</p>');
    expect(healed).toContain('</div>');
    expect(healed).toContain(');');
    expect(healed).toContain('}');
  });

  it('autoFixMissingImports automatically adds missing Lucide icon Trash2 to imports', () => {
    const codeWithoutTrash2 = `import React, { useState } from 'react';
import { Activity, Play, Pause } from 'lucide-react';

export default function IndustrialDashboard() {
  return (
    <div>
      <button><Trash2 size={16} /></button>
    </div>
  );
}`;
    const errorText = 'Uncaught ReferenceError: Trash2 is not defined';
    const fixed = autoFixMissingImports(codeWithoutTrash2, errorText);
    expect(fixed).toContain('Trash2');
    expect(fixed).toContain("from 'lucide-react'");
  });

  it('heals the exact user truncation scenario ending at item.partNumber.toLowerCase().', () => {
    const userTruncatedCode = `import React, { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [logs, setLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((item) => {
    const matchesFilter = filterStatus === 'ALL' || item.status === filterStatus;
    const matchesSearch = item.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.partNumber.toLowerCase().`;

    const healed = cleanVibeCode(userTruncatedCode);
    expect(healed).not.toContain('toLowerCase().');
    expect(healed).toContain('return (');
    expect(healed).toContain('export default function App');
    expect(healed.endsWith('}')).toBe(true);

    const extracted = extractVibeCode(userTruncatedCode);
    expect(extracted).not.toBeNull();
    expect(extracted).toContain('return (');
  });

  it('correctly detects truncated plans and truncated code using isTruncatedResponse', async () => {
    const { isTruncatedResponse } = await import('../utils/ai/VibeAIStreamService.js');

    const truncatedPlan = `# 📋 Implementation Plan: Aplikasi Check Part
## 🎯 Ringkasan Tujuan
Aplikasi industrial HMI/MES modern untuk QC.
## 🗄️ Rencana Database & Kolom Tabel MaviCore
- **Nama Tabel**: Part_Inspection_Log
- **Kolom Data**:
  - recordId (text) - ID unik inspeksi (contoh:`;

    expect(isTruncatedResponse(truncatedPlan, true)).toBe(true);

    const completePlan = `# 📋 Implementation Plan: Aplikasi Check Part
## 🎯 Ringkasan Tujuan
Aplikasi industrial HMI/MES modern untuk QC.
## 🗄️ Rencana Database & Kolom Tabel MaviCore
- **Nama Tabel**: Part_Inspection_Log
- **Kolom Data**:
  - recordId (text) - ID unik
## 🧩 Fitur & Komponen UI
1. KPI Status Bar
## 🛡️ Verification Plan
- Kompilasi React bebas error di Sandpack preview`;

    expect(isTruncatedResponse(completePlan, true)).toBe(false);

    const truncatedCode = `import React from 'react';
export default function App() {
  const [data, setData] = useState([]);
  const filtered = data.filter(x => x.`;

    expect(isTruncatedResponse(truncatedCode, false)).toBe(true);
  });
});

