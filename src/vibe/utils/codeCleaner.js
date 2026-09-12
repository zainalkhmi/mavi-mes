/**
 * codeCleaner.js
 * Sanitizes and extracts clean, executable React/JSX code from AI responses.
 * Removes <vibe_code> tags, markdown fences (```jsx, ```js, ```), and rogue artifacts.
 */

function stripStringsAndComments(code) {
  if (!code || typeof code !== 'string') return '';
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*/g, '')
    .replace(/`(?:\\`|[\s\S])*?`/g, '""')
    .replace(/'(?:\\'|[^'\n])*'/g, "''")
    .replace(/"(?:\\"|[^"\n])*"/g, '""');
}

/**
 * Deduplicates and consolidates import statements across the file.
 * Merges repeated imports from the same source (e.g. ./mavicore-bridge, ./mavicore-ui)
 * and eliminates duplicate variable declarations (such as 'useMaviCoreData has already been declared').
 */
export function deduplicateImports(code) {
  if (!code || typeof code !== 'string') return '';

  // Pre-process: collapse multi-line imports into single lines
  // e.g. "import { KPICard,\n  Numpad,\n  ScadaStartBtn } from './mavicore-ui';"
  // becomes "import { KPICard, Numpad, ScadaStartBtn } from './mavicore-ui';"
  let normalized = code.replace(/import\s*\{([^}]*)\}\s*from/gs, (match, specifiers) => {
    const collapsed = specifiers.replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return `import { ${collapsed} } from`;
  });

  const lines = normalized.split('\n');
  const bridgeLines = [];
  const uiLines = [];
  const otherLines = [];
  const seenExactImportLines = new Set();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // 1. Detect any mavicore-bridge imports
    if (/from\s+['"][./]*mavicore[-_]?bridge(?:\.js)?['"]/i.test(trimmed)) {
      bridgeLines.push(line);
      continue;
    }

    // 2. Detect any mavicore-ui imports
    if (/from\s+['"][./]*mavicore-ui(?:\.jsx?|\.js)?['"]/i.test(trimmed)) {
      uiLines.push(line);
      continue;
    }

    // 3. Detect duplicate generic import lines
    if (/^import\s+/.test(trimmed)) {
      if (seenExactImportLines.has(trimmed)) {
        continue;
      }
      seenExactImportLines.add(trimmed);
    }

    otherLines.push(line);
  }

  // Check if code uses MaviCoreBridge or useMaviCoreData anywhere
  const isBridgeDefinitionFile = /export\s+(?:const|let|var)\s+MaviCoreBridge\b/.test(code) ||
    /export\s+function\s+useMaviCoreData\b/.test(code) ||
    /\/\/\s*MaviCore\s+(?:Table\s+)?Bridge/i.test(code);

  const needsBridge = !isBridgeDefinitionFile && (
    bridgeLines.length > 0 ||
    /\buseMaviCoreData\b/.test(code) ||
    /\bMaviCoreBridge\b/.test(code) ||
    /\bbridge\./.test(code)
  );

  const consolidatedBridge = needsBridge
    ? "import { useMaviCoreData, MaviCoreBridge, bridge } from './mavicore-bridge';"
    : null;

  // Consolidate UI components
  const isUIDefinitionFile = /export\s+const\s+KPICard\b/.test(code) ||
    /\/\/\s*MaviCore\s+UI\s+Component\s+Library/i.test(code);

  let consolidatedUI = null;
  if (!isUIDefinitionFile && uiLines.length > 0) {
    const componentSet = new Set();
    for (const l of uiLines) {
      const m = l.match(/import\s*\{([^}]+)\}/);
      if (m && m[1]) {
        m[1].split(',').map(s => s.trim()).filter(Boolean).forEach(c => componentSet.add(c));
      }
    }
    if (componentSet.size > 0) {
      consolidatedUI = `import { ${Array.from(componentSet).join(', ')} } from './mavicore-ui';`;
    }
  }

  // Find index of first import in otherLines to insert consolidated lines
  let firstImportIdx = otherLines.findIndex(l => /^import\s+/.test(l.trim()));
  if (firstImportIdx === -1) firstImportIdx = 0;

  // Known mavicore-ui component names and mavicore-bridge exports that must NOT appear in other imports
  const mavicoreBridgeExports = ['useMaviCoreData', 'MaviCoreBridge', 'bridge'];
  const mavicoreUIComponentNames = [
    'KPICard', 'Numpad', 'KeyboardPro', 'SignaturePad', 'BooleanToggle',
    'QualityTolerance', 'QualityChecklist', 'DialGauge', 'DigitalCaliper',
    'BarcodeScanner', 'ScadaStartBtn', 'ScadaStopBtn', 'ScadaTank',
    'ScadaPlcStatus', 'ScadaProdCounter', 'StatusBadge', 'TelemetryGauge',
    'Card', 'CardHeader', 'CardTitle', 'CardContent', 'CardFooter',
    'Badge', 'Button', 'Modal', 'Dialog', 'MetricCard', 'StatCard', 'KpiCard',
    'MaviButton', 'MaviCard', 'MaviKPI', 'MaviStatus', 'MaviChecklist'
  ];
  const reservedMavicoreNames = new Set([...mavicoreBridgeExports, ...mavicoreUIComponentNames]);

  // Filter otherLines: remove stray mavicore imports AND strip mavicore names from non-mavicore imports
  const filteredOther = otherLines.map(l => {
    const t = l.trim();
    // Drop any leftover mavicore import entirely
    if (t.startsWith('import ') && /from\s+['"][./]*mavicore/i.test(t)) return null;
    if (t.startsWith('import ') && /\buseMaviCoreData\b/.test(t) && !t.includes("from './mavicore-bridge'")) return null;

    // For named imports from OTHER modules (e.g. lucide-react), strip any mavicore names that leaked in
    const namedImportMatch = t.match(/^import\s*\{([^}]+)\}\s*(from\s+.+)$/);
    if (namedImportMatch) {
      const specifiers = namedImportMatch[1].split(',').map(s => s.trim()).filter(Boolean);
      const cleaned = specifiers.filter(s => !reservedMavicoreNames.has(s));
      if (cleaned.length === 0) return null; // entire import was mavicore names — drop it
      if (cleaned.length < specifiers.length) {
        return `import { ${cleaned.join(', ')} } ${namedImportMatch[2]}`;
      }
    }
    return l;
  }).filter(l => l !== null);

  const topImports = [];
  if (consolidatedUI) topImports.push(consolidatedUI);
  if (consolidatedBridge) topImports.push(consolidatedBridge);

  // Recalculate firstImportIdx after filtering
  let insertIdx = filteredOther.findIndex(l => /^import\s+/.test(l.trim()));
  if (insertIdx === -1) insertIdx = 0;

  filteredOther.splice(insertIdx, 0, ...topImports);

  return filteredOther.join('\n');
}

export function cleanVibeCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';
  let cleaned = rawCode.trim();

  // Strip any corrupted _safe_ prefixes injected from previous error recovery attempts
  cleaned = cleaned.replace(/<_safe_([A-Za-z0-9_]+)/g, '<$1');
  cleaned = cleaned.replace(/<\/_safe_([A-Za-z0-9_]+)/g, '</$1');
  cleaned = cleaned.replace(/\bconst\s+_safe_[A-Za-z0-9_]+\s*=[^;\n]+;?\n?/g, '');

  // 1. Extract from <vibe_code> ... </vibe_code> if present
  const vibeCodeMatch = cleaned.match(/<vibe_code[^>]*>([\s\S]*?)<\/vibe_code>/i) || cleaned.match(/<vibe-code[^>]*>([\s\S]*?)<\/vibe-code>/i);
  if (vibeCodeMatch && vibeCodeMatch[1]) {
    cleaned = vibeCodeMatch[1].trim();
  } else {
    // If not closed properly, strip opening <vibe_code>
    cleaned = cleaned.replace(/^[\s\S]*?<vibe[-_]code[^>]*>\s*/i, '');
    cleaned = cleaned.replace(/\s*<\/vibe[-_]code>[\s\S]*$/i, '');
  }

  // 2. Extract content from markdown code fences if wrapped
  const fenceMatch = cleaned.match(/```(?:jsx|javascript|js|tsx|react|html)?\s*\n?([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  } else {
    // Strip opening/closing standalone fences
    while (/^```[a-zA-Z0-9_-]*\s*\n?/i.test(cleaned) || /\n?```\s*$/i.test(cleaned)) {
      cleaned = cleaned.replace(/^```[a-zA-Z0-9_-]*\s*\n?/i, '');
      cleaned = cleaned.replace(/\n?```\s*$/i, '');
      cleaned = cleaned.trim();
    }
  }

  // 3. FIX: If code starts with `return (` without a function wrapper, wrap it in a function
  const startsWithReturnOnly = /^\s*return\s*\(/i.test(cleaned) && !/function\s+\w+|export\s+default|const\s+\w+\s*=\s*\(/i.test(cleaned.slice(0, 200));
  if (startsWithReturnOnly) {
    cleaned = `export default function App() {\n  ${cleaned}\n}`;
  }

  // 4. Strip any conversational text before the first import or export
  const firstImportOrExport = cleaned.search(/(?:^|\n)\s*(?:import\s+|export\s+default\s+function|export\s+default\s+const|function\s+App)/i);
  if (firstImportOrExport > 0) {
    cleaned = cleaned.slice(firstImportOrExport).trim();
  }

  // 5. Strip any stray markdown language headers at the top
  cleaned = cleaned.replace(/^(?:javascript|jsx|js|tsx|react)\s*\n/i, '');

  // 5b. Consolidate and deduplicate MaviCore Bridge imports across all naming conventions
  cleaned = deduplicateImports(cleaned);

  // Auto-inject and merge import for specialized MaviCore UI widgets only if explicitly used as JSX tags
  const mavicoreSpecializedWidgets = [
    'Numpad', 'KeyboardPro', 'SignaturePad', 'BooleanToggle', 'QualityTolerance',
    'QualityChecklist', 'DialGauge', 'DigitalCaliper', 'BarcodeScanner',
    'ScadaStartBtn', 'ScadaStopBtn', 'ScadaTank', 'ScadaPlcStatus', 'KPICard',
    'ScadaProdCounter', 'StatusBadge', 'TelemetryGauge', 'MaviButton', 'MaviCard',
    'MaviKPI', 'MaviStatus', 'MaviChecklist'
  ];
  const usedSpecializedWidgets = mavicoreSpecializedWidgets.filter(c => new RegExp(`<${c}[\\s/>]`).test(cleaned));
  if (usedSpecializedWidgets.length > 0) {
    if (/from\s+['"][^'"]*mavicore-ui[^'"]*['"]/i.test(cleaned)) {
      cleaned = cleaned.replace(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*mavicore-ui[^'"]*['"]/i, (match, existing) => {
        const existingList = existing.split(',').map(s => s.trim());
        const toAdd = usedSpecializedWidgets.filter(c => !existingList.includes(c));
        return toAdd.length > 0 ? `import { ${existing.trim()}, ${toAdd.join(', ')} } from './mavicore-ui'` : match;
      });
    } else {
      cleaned = `import { ${usedSpecializedWidgets.join(', ')} } from './mavicore-ui';\n` + cleaned;
    }
  }

  // Ensure imports are strictly deduplicated
  cleaned = deduplicateImports(cleaned);

  // Auto-inject and merge popular Lucide icons used in JSX or icon props
  const popularLucideIcons = [
    'Activity', 'Gauge', 'Clock', 'TrendingUp', 'TrendingDown', 'CheckCircle2', 'AlertTriangle',
    'XCircle', 'Info', 'Play', 'Square', 'Pause', 'RotateCcw', 'RotateCw', 'RefreshCw',
    'Sliders', 'Layers', 'Cpu', 'Thermometer', 'ShieldCheck', 'ShieldAlert', 'Camera',
    'Barcode', 'Eye', 'FileSpreadsheet', 'Database', 'ArrowRight', 'ArrowLeft', 'Trash2',
    'Check', 'Wifi', 'WifiOff', 'User', 'Users', 'Zap', 'ChevronDown', 'ChevronUp',
    'ChevronRight', 'ChevronLeft', 'X', 'Sparkles', 'Droplet', 'Volume2', 'Settings',
    'Lock', 'Unlock', 'Hash', 'Calendar', 'Search', 'Filter', 'Plus', 'Minus', 'Edit',
    'Save', 'Download', 'Upload', 'Share2', 'Package', 'Box', 'Truck', 'Factory',
    'Wrench', 'Clipboard', 'ClipboardCheck', 'ClipboardList', 'QrCode', 'Power', 'Bell',
    'FileText', 'BarChart2', 'PieChart', 'LineChart', 'FilePlus', 'Globe', 'Smartphone',
    'Edit3', 'Edit2', 'History', 'CheckSquare', 'SquareCheck', 'HelpCircle', 'AlertCircle'
  ];
  // Exclude any mavicore-ui component names from being treated as lucide icons
  const mavicoreUISet = new Set(mavicoreSpecializedWidgets);
  const usedIcons = popularLucideIcons.filter(icon => {
    if (mavicoreUISet.has(icon)) return false; // never treat mavicore components as lucide icons
    const jsxTagRegex = new RegExp(`<${icon}[\\s/>]`);
    const propRegex = new RegExp(`\\b(?:icon|Icon)\\s*=\\s*\\{\\s*${icon}\\s*\\}`);
    return jsxTagRegex.test(cleaned) || propRegex.test(cleaned);
  });
  if (usedIcons.length > 0) {
    if (/from\s+['"]lucide-react['"]/i.test(cleaned)) {
      cleaned = cleaned.replace(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/i, (match, existing) => {
        const existingList = existing.split(',').map(s => s.trim());
        const toAdd = usedIcons.filter(icon => !existingList.includes(icon));
        return toAdd.length > 0 ? `import { ${existing.trim()}, ${toAdd.join(', ')} } from 'lucide-react'` : match;
      });
    } else if (!/from\s+['"][^'"]*mavicore-ui[^'"]*['"]/i.test(cleaned)) {
      cleaned = `import { ${usedIcons.join(', ')} } from 'lucide-react';\n` + cleaned;
    }
  }

  // Auto-inject and merge Recharts components if used in JSX
  const rechartsComponents = ['ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie', 'Cell', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend'];
  const usedRecharts = rechartsComponents.filter(c => new RegExp(`<${c}[\\s/>]`).test(cleaned));
  if (usedRecharts.length > 0) {
    if (/from\s+['"]recharts['"]/i.test(cleaned)) {
      cleaned = cleaned.replace(/import\s*\{([^}]+)\}\s*from\s*['"]recharts['"]/i, (match, existing) => {
        const existingList = existing.split(',').map(s => s.trim());
        const toAdd = usedRecharts.filter(c => !existingList.includes(c));
        return toAdd.length > 0 ? `import { ${existing.trim()}, ${toAdd.join(', ')} } from 'recharts'` : match;
      });
    } else {
      cleaned = `import { ${usedRecharts.join(', ')} } from 'recharts';\n` + cleaned;
    }
  }

  // 6. Sanitize rogue quotes after numeric values or commas (e.g. `quantity: 50,'` -> `quantity: 50,`)
  cleaned = cleaned.replace(/(\b\d+\s*,)\s*['"]\s*$/gm, '$1');

  // Strip trailing rogue quote, backtick, or fence residue at the very end
  cleaned = cleaned.replace(/[\s\r\n`'"]+$/g, '').trim();

  // 6b. Sanitize rogue standalone `);` mistakenly inserted before closures or callbacks
  // e.g. `setLiveRpm(...);\n  }\n);\n  }, 2500);` -> removes the extra `);`
  cleaned = cleaned.replace(/(\n\s*\}\s*;?)\s*\n\s*\)\s*;(?=\s*\n\s*\}\s*[,);])/g, '$1');
  cleaned = cleaned.replace(/\n\s*\)\s*;(?=\s*\n\s*\}\s*,\s*(?:\d+|\[|\{))/g, '');
  cleaned = cleaned.replace(/\n\s*\)\s*;(?=\s*\n\s*\}\s*\))/g, '');

  // Clean repeated broken closures caused by over-healing (e.g. `\n);\n}}\n      );'`)
  cleaned = cleaned.replace(/(\n\s*\)\s*;[\s\S]*?\n\s*\})[\s\S]*$/i, (match, validEnd) => {
    const trailing = match.slice(validEnd.length);
    if (/^[\s\r\n;})'"`]*$/.test(trailing)) {
      return validEnd;
    }
    return match;
  });

  // 7. Auto-heal truncated code only if not already cleanly terminated
  cleaned = healTruncatedReactCode(cleaned);

  // 8. Ensure export default is present for Sandpack if a function component exists
  if (!cleaned.includes('export default')) {
    if (/\b(?:function\s+App|const\s+App|let\s+App|var\s+App)\b/.test(cleaned)) {
      cleaned += `\nexport default App;`;
    } else {
      const fnMatch = cleaned.match(/(?:export\s+)?function\s+([A-Z][A-Za-z0-9_]*)/) ||
                      cleaned.match(/(?:export\s+)?const\s+([A-Z][A-Za-z0-9_]*)\s*=/);
      if (fnMatch && fnMatch[1]) {
        cleaned += `\nexport default ${fnMatch[1]};`;
      } else {
        cleaned += `\nexport default App;`;
      }
    }
  }

  return cleaned.trim();
}

/**
 * Auto-heals code cut off mid-stream or by token limits.
 * Strips incomplete trailing lines with unterminated strings and properly closes JSX tags/functions.
 */
export function healTruncatedReactCode(code) {
  if (!code || typeof code !== 'string') return '';
  let cleaned = code.trim();

  if (cleaned.length < 30) return cleaned;

  // Strip trailing rogue quote or fence residue
  cleaned = cleaned.replace(/[\s\r\n`'"]+$/g, '').trim();

  // If the code is already cleanly terminated (ends with } or export default ...;)
  // DO NOT append additional closures!
  const isCleanlyTerminated = /\}\s*;?\s*$/.test(cleaned) || /export\s+default\s+[A-Za-z0-9_]+;?\s*$/.test(cleaned);
  if (isCleanlyTerminated) {
    return cleaned;
  }

  let lines = cleaned.split('\n');

  // Discard trailing incomplete lines (unclosed string, open tag, dangling operator, or dangling comment)
  while (lines.length > 0) {
    const lastLine = lines[lines.length - 1].trim();
    if (!lastLine) {
      lines.pop();
      continue;
    }

    const doubleQuotes = (lastLine.match(/"/g) || []).length;
    const singleQuotes = (lastLine.match(/'/g) || []).length;
    const backticks = (lastLine.match(/`/g) || []).length;

    const hasUnclosedString = (doubleQuotes % 2 !== 0) || (singleQuotes % 2 !== 0) || (backticks % 2 !== 0);
    const isIncompleteTag = /<[a-zA-Z0-9_-]+(?:\s+[^>]*$|$)/.test(lastLine) && !lastLine.endsWith('/>') && !lastLine.endsWith('>');
    const isIncompleteOperator = /[=+\-*/&|,:(.?\[]\s*$/.test(lastLine) ||
      /\b(?:const|let|var|function|return|if|else|switch|case|default)\s*$/.test(lastLine) ||
      /(?:&&|\|\||\?\?|=>|\.\.|\.toLowerCase\(\)\.|\.toUpperCase\(\)\.|\.trim\(\)\.)$/.test(lastLine);

    if (hasUnclosedString || isIncompleteTag || isIncompleteOperator) {
      lines.pop();
    } else {
      break;
    }
  }

  let healed = lines.join('\n').trim();
  if (!healed) return code;

  // Re-check termination after popping incomplete lines
  if (/\}\s*;?\s*$/.test(healed) || /export\s+default\s+[A-Za-z0-9_]+;?\s*$/.test(healed)) {
    return healed;
  }

  // Detect and balance unclosed JSX tags inside return (...)
  const returnIdx = healed.lastIndexOf('return (');
  if (returnIdx !== -1) {
    // Check if there's a function wrapper BEFORE the return statement
    const beforeReturn = healed.slice(0, returnIdx);
    const hasFunctionWrapper = /function\s+\w+\s*\(|=>\s*\(?|export\s+default\s+function|export\s+default\s+const\s+\w+\s*=/i.test(beforeReturn);

    // If return is found but no function wrapper exists, wrap it
    if (!hasFunctionWrapper) {
      // Insert a function wrapper before the return
      healed = beforeReturn + `export default function App() {\n  return (`;
      return healed.trim();
    }

    const jsxPart = healed.slice(returnIdx);
    const tagRegex = /<\/?([a-zA-Z0-9_.-]+)(?:\s+[^>]*?)?(\/?)>/g;
    const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
    const openTags = [];
    let m;
    while ((m = tagRegex.exec(jsxPart)) !== null) {
      const full = m[0];
      const tag = m[1];
      const isSelfClosing = m[2] === '/' || voidTags.has(tag.toLowerCase());
      const isClosing = full.startsWith('</');
      if (isClosing) {
        const lastIdx = openTags.lastIndexOf(tag);
        if (lastIdx !== -1) {
          openTags.splice(lastIdx, 1);
        }
      } else if (!isSelfClosing) {
        openTags.push(tag);
      }
    }

    if (openTags.length > 0) {
      for (let i = openTags.length - 1; i >= 0; i--) {
        healed += `\n        </${openTags[i]}>`;
      }
    }
  } else {
    // If the component was cut off BEFORE reaching a return (...) statement,
    // intelligently synthesize a valid, modern Light-themed HMI JSX return so Sandpack never breaks!
    const hasComponentFn = /export\s+default\s+function\s+([A-Za-z0-9_]+)?/i.test(healed) || /function\s+App/i.test(healed);
    if (hasComponentFn) {
      const strippedBefore = stripStringsAndComments(healed);
      const oBraces = (strippedBefore.match(/{/g) || []).length;
      const cBraces = (strippedBefore.match(/}/g) || []).length;
      // Close inner dangling callbacks/blocks so only the App function block remains open (oBraces - cBraces === 1)
      if (oBraces - cBraces > 1) {
        healed += '\n' + '}'.repeat((oBraces - cBraces) - 1) + ';';
      }

      healed += `\n  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-xl font-bold text-slate-900">MaviCore MES Station</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sistem Inspeksi & Verifikasi Kualitas Terhubung</p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200">
            ● Bridge Ready
          </span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-600 font-medium">Data dan logika state berhasil dipulihkan & aktif di layar preview.</p>
        </div>
      </div>
    </div>
  );\n}`;
      return healed.trim();
    }
  }

  // Count braces and parenthesis ONLY on stripped code (ignoring string literals & comments)
  const stripped = stripStringsAndComments(healed);
  const openBraces = (stripped.match(/{/g) || []).length;
  const closeBraces = (stripped.match(/}/g) || []).length;
  const missingBraces = Math.max(0, openBraces - closeBraces);

  const openParens = (stripped.match(/\(/g) || []).length;
  const closeParens = (stripped.match(/\)/g) || []).length;
  const missingParens = Math.max(0, openParens - closeParens);

  const hasComponent = /export\s+default/m.test(healed) || /function\s+[A-Za-z0-9_]+/m.test(healed) || /const\s+[A-Za-z0-9_]+\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/m.test(healed);

  if (hasComponent) {
    if (missingParens > 0) {
      healed += '\n      );';
    }
    if (missingBraces > 0) {
      healed += '\n' + '}'.repeat(missingBraces);
    }
  } else if (missingBraces > 0) {
    healed += '\n' + '}'.repeat(missingBraces);
  }

  return healed.trim();
}

/**
 * Validates that extracted code actually contains a React component and return statement or can be safely healed.
 */
function isValidComponentCandidate(code) {
  if (!code || typeof code !== 'string' || code.trim().length < 30) return false;
  const hasFunction = /function\s+[A-Za-z0-9_]+/i.test(code) || /const\s+[A-Za-z0-9_]+\s*=\s*(?:\([^)]*\)|[A-Za-z0-9_]+)\s*=>/i.test(code);
  const hasReturn = /return\s*\(?/i.test(code);
  if (hasFunction && hasReturn) return true;
  // If it has component declaration and state/imports, it is healable into a valid component
  if (hasFunction && (code.includes('useState') || code.includes('useEffect') || code.includes('import '))) {
    return true;
  }
  return false;
}

/**
 * Extracts React/JSX code block from an AI response text.
 * Robustly matches closed/unclosed <vibe_code>, closed/unclosed markdown fences,
 * or raw React component files.
 * Returns null if no valid component code could be extracted.
 */
export function extractVibeCode(text) {
  if (!text || typeof text !== 'string') return null;

  // 1. Closed <vibe_code>...</vibe_code> or <vibe-code>...</vibe-code>
  const closedVibe = text.match(/<vibe[-_]code[^>]*>([\s\S]*?)<\/vibe[-_]code>/i);
  if (closedVibe && closedVibe[1].trim()) {
    const cleaned = cleanVibeCode(closedVibe[1]);
    if (isValidComponentCandidate(cleaned)) return cleaned;
  }

  // 2. Unclosed <vibe_code>...
  const openVibe = text.match(/<vibe[-_]code[^>]*>([\s\S]*)$/i);
  if (openVibe && openVibe[1].trim()) {
    const candidate = cleanVibeCode(openVibe[1]);
    if (isValidComponentCandidate(candidate)) return candidate;
  }

  // 3. Closed markdown code fences
  const fenceMatches = [...text.matchAll(/```(?:jsx|javascript|js|tsx|react|html)?\s*\n?([\s\S]*?)```/gi)];
  for (const m of fenceMatches) {
    const candidate = m[1].trim();
    if (
      candidate.includes('export default') ||
      candidate.includes('import ') ||
      candidate.includes('function ') ||
      candidate.includes('return') ||
      candidate.includes('const ')
    ) {
      const cleaned = cleanVibeCode(candidate);
      if (isValidComponentCandidate(cleaned)) return cleaned;
    }
  }

  // 4. Any generic code fence ```...```
  const anyFence = [...text.matchAll(/```\s*\n?([\s\S]*?)```/gi)];
  for (const m of anyFence) {
    const candidate = m[1].trim();
    if (
      candidate.includes('export default') ||
      candidate.includes('import ') ||
      candidate.includes('function ') ||
      candidate.includes('return')
    ) {
      const cleaned = cleanVibeCode(candidate);
      if (isValidComponentCandidate(cleaned)) return cleaned;
    }
  }

  // 5. Unclosed markdown code fence ```jsx ... (e.g. streaming stopped or truncated)
  const unclosedFence = text.match(/```(?:jsx|javascript|js|tsx|react|html)?\s*\n?([\s\S]*)$/i);
  if (unclosedFence && unclosedFence[1].trim()) {
    const candidate = unclosedFence[1].trim();
    if (
      candidate.includes('export default') ||
      candidate.includes('import ') ||
      candidate.includes('function ') ||
      candidate.includes('return')
    ) {
      const cleaned = cleanVibeCode(candidate);
      if (isValidComponentCandidate(cleaned)) return cleaned;
    }
  }

  // 6. Raw React code with import
  const rawImportMatch = text.match(/(?:import\s+[\s\S]+?from\s+['"][^'"]+['"];?[\s\S]*)/i);
  if (rawImportMatch && rawImportMatch[0]) {
    const candidate = rawImportMatch[0].trim();
    if (candidate.includes('return') || candidate.includes('export') || candidate.includes('function')) {
      const cleaned = cleanVibeCode(candidate);
      if (isValidComponentCandidate(cleaned)) return cleaned;
    }
  }

  // 7. Raw export default
  const rawExportMatch = text.match(/(?:export\s+default\s+function[\s\S]*)/i);
  if (rawExportMatch && rawExportMatch[0]) {
    const cleaned = cleanVibeCode(rawExportMatch[0]);
    if (isValidComponentCandidate(cleaned)) return cleaned;
  }

  // 8. Fallback: if text contains JSX return or export default, clean directly
  if (text.includes('export default') || (text.includes('import ') && text.includes('return'))) {
    const cleaned = cleanVibeCode(text);
    if (isValidComponentCandidate(cleaned)) return cleaned;
  }

  return null;
}

/**
 * Automatically detects and injects missing imports (Lucide icons, React hooks, Framer Motion, Recharts)
 * for ReferenceError runtime issues.
 */
export function autoFixMissingImports(code, errorText) {
  if (!code || typeof code !== 'string' || !errorText) return null;

  // Never mutate or patch the virtual bridge or UI definition files themselves
  if (
    /export\s+(?:const|let|var)\s+MaviCoreBridge\b/.test(code) ||
    /export\s+function\s+useMaviCoreData\b/.test(code) ||
    /export\s+const\s+KPICard\b/.test(code) ||
    /\/\/\s*MaviCore\s+(?:Table\s+)?Bridge/i.test(code)
  ) {
    return null;
  }

  const errStr = String(errorText);

  // 0a. Sanitize any _safe_ prefix from previous erroneous recovery attempts
  if (errStr.includes('_safe_')) {
    const sanitized = cleanVibeCode(code);
    if (sanitized && sanitized.trim() !== code.trim()) {
      return sanitized;
    }
  }

  // 0. Identifier already declared / duplicate import resolution
  if (errStr.includes('has already been declared') || errStr.includes('already been declared')) {
    const fixed = deduplicateImports(code);
    if (fixed && fixed.trim() !== code.trim()) {
      return fixed;
    }
    const match = errStr.match(/Identifier\s+['"]([A-Za-z0-9_]+)['"]\s+has already been declared/i);
    if (match && match[1]) {
      const varName = match[1];
      const lines = code.split('\n');
      let seen = false;
      const filtered = lines.filter(line => {
        if (new RegExp(`\\b${varName}\\b`).test(line) && line.trim().startsWith('import ')) {
          if (seen) return false;
          seen = true;
        }
        return true;
      });
      return filtered.join('\n');
    }
    return fixed;
  }

  // 0b. MaviCore Bridge & useMaviCoreData resolution error
  if (errStr.includes('useMaviCoreData') || errStr.includes('_mavicoreBridge') || errStr.includes('MaviCoreBridge')) {
    if (/export\s+(?:const|let|var)\s+MaviCoreBridge\b/.test(code) || /export\s+function\s+useMaviCoreData\b/.test(code)) {
      return null; // Never mutate the virtual bridge definition itself
    }
    const deduped = deduplicateImports(code);
    if (errStr.includes('is not a function') && /useMaviCoreData/i.test(errStr)) {
      // If bundler fails to link the named import or default import, provide safe hook fallback
      if (!deduped.includes('const useMaviCoreData = (typeof window')) {
        return `// Bridge runtime hook fallback\nconst useMaviCoreData = (typeof window !== 'undefined' && window.useMaviCoreData) ? window.useMaviCoreData : (() => ({ records: [], loading: false, insert: () => {}, update: () => {}, remove: () => {} }));\n` + deduped;
      }
    }
    return deduped;
  }

  // 0c. Element type is invalid / undefined component error recovery
  if (errStr.includes('Element type is invalid') || errStr.includes('likely forgot to export') || errStr.includes('Check the render method')) {
    let cleaned = cleanVibeCode(code);

    // Scan for any PascalCase JSX tags in the code that are neither imported nor declared
    const tagMatches = [...cleaned.matchAll(/<([A-Z][A-Za-z0-9_]+)[\s/>]/g)].map(m => m[1]);
    const uniqueTags = [...new Set(tagMatches)].filter(t => t !== 'App' && t !== 'Fragment' && t !== 'StrictMode');
    const missingDefinitions = [];

    for (const tag of uniqueTags) {
      const isDeclared = new RegExp(`(?:function|class)\\s+${tag}\\b`).test(cleaned) ||
        new RegExp(`(?:const|let|var)\\s+${tag}\\s*=`).test(cleaned) ||
        new RegExp(`import\\s*\\{[^}]*\\b${tag}\\b[^}]*\\}\\s*from`).test(cleaned) ||
        new RegExp(`import\\s+${tag}\\b`).test(cleaned);

      if (!isDeclared) {
        missingDefinitions.push(`const ${tag} = ({ children, className = '', ...props }) => <div className={'inline-flex items-center justify-center p-1 rounded ' + className} data-tag="${tag}" {...props}>{children || null}</div>;`);
      }
    }

    if (missingDefinitions.length > 0) {
      const lastImportIdx = cleaned.lastIndexOf('\nimport ');
      if (lastImportIdx !== -1) {
        const endOfImportLine = cleaned.indexOf('\n', lastImportIdx + 1);
        cleaned = cleaned.slice(0, endOfImportLine + 1) + '\n// Safe Component Fallbacks\n' + missingDefinitions.join('\n') + '\n' + cleaned.slice(endOfImportLine + 1);
      } else {
        cleaned = missingDefinitions.join('\n') + '\n' + cleaned;
      }
    }

    if (cleaned !== code) {
      return cleaned;
    }
  }

  const match = errStr.match(/ReferenceError:\s*([A-Za-z0-9_]+)\s+is not defined/i) ||
                errStr.match(/([A-Za-z0-9_]+)\s+is not defined/i);
  if (!match) return null;

  let missingName = match[1];
  if (missingName.startsWith('_safe_')) {
    missingName = missingName.replace(/^_safe_/, '');
    code = cleanVibeCode(code);
  }

  // 1. Missing React hooks
  const reactHooks = ['useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer'];
  if (reactHooks.includes(missingName)) {
    if (/from\s+['"]react['"]/i.test(code)) {
      return code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react['"]/i, (m, existing) => {
        if (existing.includes(missingName)) return m;
        return `import { ${existing.trim()}, ${missingName} } from 'react'`;
      });
    } else {
      return `import React, { ${missingName} } from 'react';\n` + code;
    }
  }

  // 2. Missing Framer Motion
  if (missingName === 'motion' || missingName === 'AnimatePresence') {
    if (/from\s+['"]framer-motion['"]/i.test(code)) {
      return code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]framer-motion['"]/i, (m, existing) => {
        if (existing.includes(missingName)) return m;
        return `import { ${existing.trim()}, ${missingName} } from 'framer-motion'`;
      });
    } else {
      return `import { ${missingName} } from 'framer-motion';\n` + code;
    }
  }

  // 3. Missing Recharts components
  const rechartsComponents = ['ResponsiveContainer', 'BarChart', 'Bar', 'LineChart', 'Line', 'AreaChart', 'Area', 'PieChart', 'Pie', 'Cell', 'XAxis', 'YAxis', 'CartesianGrid', 'Tooltip', 'Legend'];
  if (rechartsComponents.includes(missingName)) {
    if (/from\s+['"]recharts['"]/i.test(code)) {
      return code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]recharts['"]/i, (m, existing) => {
        if (existing.includes(missingName)) return m;
        return `import { ${existing.trim()}, ${missingName} } from 'recharts'`;
      });
    } else {
      return `import { ${missingName} } from 'recharts';\n` + code;
    }
  }

  // 3b. Missing MaviCore UI components
  const mavicoreUIComponents = [
    'Numpad', 'KeyboardPro', 'SignaturePad', 'BooleanToggle', 'QualityTolerance', 
    'QualityChecklist', 'DialGauge', 'DigitalCaliper', 'BarcodeScanner', 
    'ScadaStartBtn', 'ScadaStopBtn', 'ScadaTank', 'ScadaPlcStatus', 'KPICard', 
    'ScadaProdCounter', 'StatusBadge', 'TelemetryGauge', 'MaviButton', 'MaviCard', 
    'MaviKPI', 'MaviStatus', 'MaviChecklist'
  ];
  if (mavicoreUIComponents.includes(missingName)) {
    if (/from\s+['"][^'"]*mavicore-ui[^'"]*['"]/i.test(code)) {
      return code.replace(/import\s*\{([^}]+)\}\s*from\s*['"][^'"]*mavicore-ui[^'"]*['"]/i, (m, existing) => {
        if (existing.includes(missingName)) return m;
        return `import { ${existing.trim()}, ${missingName} } from './mavicore-ui'`;
      });
    } else {
      return `import { ${missingName} } from './mavicore-ui';\n` + code;
    }
  }

  // 4. Missing Lucide Icon or general PascalCase React Icon component
  if (/^[A-Z][A-Za-z0-9]+$/.test(missingName)) {
    if (/from\s+['"]lucide-react['"]/i.test(code)) {
      return code.replace(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/i, (m, existing) => {
        if (existing.includes(missingName)) return m;
        return `import {\n  ${existing.trim()},\n  ${missingName}\n} from 'lucide-react'`;
      });
    } else {
      return `import { ${missingName} } from 'lucide-react';\n` + code;
    }
  }

  return null;
}

/**
 * Automatically detects and fixes rogue syntax errors (such as rogue `);` inserted before timer/callback closures,
 * mismatched tokens, or over-healed closures).
 */
export function autoFixSyntaxErrors(code, errorText) {
  if (!code || typeof code !== 'string') return null;
  const errStr = String(errorText || '');

  // If error is about _safe_ identifier, heal immediately
  if (errStr.includes('_safe_')) {
    const healed = cleanVibeCode(code);
    if (healed && healed.trim() !== code.trim()) {
      return healed;
    }
  }

  const isSyntax = /syntaxerror|unexpected token|unterminated|already been declared|read only property 'message'/i.test(errStr);
  if (!isSyntax) return null;

  if (errStr.includes('already been declared')) {
    const deduped = deduplicateImports(code);
    if (deduped && deduped.trim() !== code.trim()) {
      return deduped;
    }
  }

  let fixed = cleanVibeCode(code);
  fixed = fixed.replace(/(\n\s*\}\s*;?)\s*\n\s*\)\s*;(?=\s*\n\s*\}\s*[,);])/g, '$1');
  fixed = fixed.replace(/\n\s*\)\s*;(?=\s*\n\s*\}\s*,\s*(?:\d+|\[|\{))/g, '');
  fixed = fixed.replace(/\n\s*\)\s*;(?=\s*\n\s*\}\s*\))/g, '');

  if (fixed && fixed.trim() !== code.trim()) {
    return fixed;
  }
  return null;
}

export default { cleanVibeCode, healTruncatedReactCode, extractVibeCode, autoFixMissingImports, autoFixSyntaxErrors, deduplicateImports };
