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

  it('automatically sanitizes and fixes rogue standalone ");" placed before timer callback closures (unexpected token 131:0)', async () => {
    const { autoFixSyntaxErrors } = await import('../vibe/utils/codeCleaner.js');
    const brokenCode = `import React, { useState, useEffect } from 'react';

export default function App() {
  const [liveRpm, setLiveRpm] = useState(1200);
  const [isLineActive, setIsLineActive] = useState(true);

  useEffect(() => {
    if (!isLineActive) return;
    const interval = setInterval(() => {
      setLiveRpm((prev) => Math.max(0, Math.round(prev + (Math.random() * 40 - 20))));
    }
);
    }, 2500);
    return () => clearInterval(interval);
  }, [isLineActive]);

  return (
    <div>{liveRpm}</div>
  );
}`;

    const cleaned = cleanVibeCode(brokenCode);
    expect(cleaned).not.toContain('}\n);\n');
    expect(cleaned).toContain('setLiveRpm');
    expect(cleaned).toContain('}, 2500);');

    const autoFixed = autoFixSyntaxErrors(brokenCode, "SyntaxError: /App.js: Unexpected token (131:0)");
    expect(autoFixed).not.toBeNull();
    expect(autoFixed).not.toContain('}\n);\n');
  });

  it('deduplicates multiple bridge imports and fixes "Identifier useMaviCoreData has already been declared"', async () => {
    const { deduplicateImports, autoFixMissingImports, autoFixSyntaxErrors } = await import('../vibe/utils/codeCleaner.js');
    const duplicateImportsCode = `import { KPICard, Numpad, QualityTolerance, ScadaStartBtn, ScadaStopBtn, ScadaProdCounter, StatusBadge, TelemetryGauge } from './mavicore-ui';
import { useMaviCoreData } from './mavicore-bridge';
import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';
import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';
import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';

export default function App() {
  const { records } = useMaviCoreData('attendance');
  return <div>{records.length}</div>;
}`;

    const deduped = deduplicateImports(duplicateImportsCode);
    const bridgeCount = (deduped.match(/from\s+['"][./]*mavicore-bridge['"]/g) || []).length;
    expect(bridgeCount).toBe(1);
    expect(deduped).toContain("import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';");
    expect(deduped).toContain("import { KPICard, Numpad");

    const err = "SyntaxError: /App.js: Identifier 'useMaviCoreData' has already been declared. (3:9)";
    const fixedFromMissing = autoFixMissingImports(duplicateImportsCode, err);
    expect((fixedFromMissing.match(/useMaviCoreData/g) || []).length).toBe(2); // 1 in import, 1 in useMaviCoreData call

    const fixedFromSyntax = autoFixSyntaxErrors(duplicateImportsCode, err);
    expect((fixedFromSyntax.match(/from\s+['"][./]*mavicore-bridge['"]/g) || []).length).toBe(1);
  });

  it('strips mavicore component names that leaked into lucide-react import', async () => {
    const { deduplicateImports } = await import('../vibe/utils/codeCleaner.js');
    const brokenCode = [
      "import { KPICard, Numpad, StatusBadge } from './mavicore-ui';",
      "import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';",
      "import React, { useState, useEffect } from 'react';",
      "import { KPICard, Numpad, StatusBadge, Activity, Settings, Trash2 } from 'lucide-react';",
      "",
      "export default function App() {",
      "  const { records } = useMaviCoreData('production');",
      "  return <div><KPICard /><Activity /></div>;",
      "}"
    ].join('\n');

    const deduped = deduplicateImports(brokenCode);
    const lucideMatch = deduped.match(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/);
    expect(lucideMatch).not.toBeNull();
    const lucideNames = lucideMatch[1].split(',').map(s => s.trim());
    expect(lucideNames).not.toContain('KPICard');
    expect(lucideNames).not.toContain('Numpad');
    expect(lucideNames).not.toContain('StatusBadge');
    expect(lucideNames).toContain('Activity');
    expect(lucideNames).toContain('Settings');
    expect(lucideNames).toContain('Trash2');
  });

  it('collapses and deduplicates multi-line mavicore imports', async () => {
    const { deduplicateImports } = await import('../vibe/utils/codeCleaner.js');
    // Exact scenario from user: LLM generates multi-line import that spans 4+ lines
    const brokenCode = [
      "import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';",
      "import React, { useState, useEffect } from 'react';",
      "import { KPICard,",
      "  Numpad,",
      "  SignaturePad,",
      "  ScadaStartBtn,",
      "  ScadaStopBtn,",
      "  ScadaProdCounter,",
      "  StatusBadge,",
      "  TelemetryGauge,",
      "  Modal } from './mavicore-ui';",
      "",
      "export default function App() {",
      "  const { records } = useMaviCoreData('production');",
      "  return <div><KPICard value={records.length} /></div>;",
      "}"
    ].join('\n');

    const deduped = deduplicateImports(brokenCode);

    // Should have exactly 1 mavicore-ui import
    const uiCount = (deduped.match(/from\s+['"][./]*mavicore-ui['"]/g) || []).length;
    expect(uiCount).toBe(1);

    // Should have exactly 1 bridge import
    const bridgeCount = (deduped.match(/from\s+['"][./]*mavicore-bridge['"]/g) || []).length;
    expect(bridgeCount).toBe(1);

    // KPICard should appear in import + JSX = 2 times only
    const kpiCount = (deduped.match(/\bKPICard\b/g) || []).length;
    expect(kpiCount).toBe(2);

    // No multi-line import fragments should remain
    expect(deduped).not.toMatch(/^\s*Numpad,\s*$/m);
    expect(deduped).not.toMatch(/^\s*SignaturePad,\s*$/m);
  });

  it('never injects bridge self-imports into MAVICORE_BRIDGE_VIRTUAL_FILE', async () => {
    const { deduplicateImports, autoFixMissingImports } = await import('../vibe/utils/codeCleaner.js');
    const { MAVICORE_BRIDGE_VIRTUAL_FILE } = await import('../vibe/sdk/mavicoreBridge.js');

    // Passing the bridge file to deduplicateImports must NOT prepend ./mavicore-bridge
    const result = deduplicateImports(MAVICORE_BRIDGE_VIRTUAL_FILE);
    expect(result).not.toContain("from './mavicore-bridge'");

    // Passing the bridge file to autoFixMissingImports on error must return null (protecting it)
    const err = "SyntaxError: /mavicore-bridge.js: Identifier 'MaviCoreBridge' has already been declared. (63:13)";
    const fixed = autoFixMissingImports(MAVICORE_BRIDGE_VIRTUAL_FILE, err);
    expect(fixed).toBeNull();
  });

  it('provides runtime fallback when (0, _mavicoreBridge.useMaviCoreData) is not a function occurs in App.js', async () => {
    const { autoFixMissingImports } = await import('../vibe/utils/codeCleaner.js');
    const appCode = `import React from 'react';
import { useMaviCoreData } from './mavicore-bridge';

export default function App() {
  const { records } = useMaviCoreData('production');
  return <div>{records.length}</div>;
}`;

    const err = "Error: (0 , _mavicoreBridge.useMaviCoreData) is not a function";
    const fixed = autoFixMissingImports(appCode, err);
    expect(fixed).toContain('window.useMaviCoreData');
  });

  it('instantly heals _safe_StatusBadge is not defined errors by removing _safe_ and importing component', async () => {
    const { cleanVibeCode, autoFixMissingImports, autoFixSyntaxErrors } = await import('../vibe/utils/codeCleaner.js');
    const corruptedCode = `import React from 'react';
import { KPICard } from './mavicore-ui';

export default function App() {
  return (
    <div>
      <_safe_StatusBadge status="RUNNING" />
    </div>
  );
}`;

    const cleaned = cleanVibeCode(corruptedCode);
    expect(cleaned).not.toContain('_safe_');
    expect(cleaned).toContain('<StatusBadge status="RUNNING" />');
    expect(cleaned).toContain('StatusBadge');

    const err = "ReferenceError: _safe_StatusBadge is not defined";
    const fixedFromMissing = autoFixMissingImports(corruptedCode, err);
    expect(fixedFromMissing).not.toContain('_safe_');
    expect(fixedFromMissing).toContain('StatusBadge');
    expect(fixedFromMissing).toContain('<StatusBadge status="RUNNING" />');

    const fixedFromSyntax = autoFixSyntaxErrors(corruptedCode, err);
    expect(fixedFromSyntax).not.toContain('_safe_');
    expect(fixedFromSyntax).toContain('StatusBadge');
  });
});
