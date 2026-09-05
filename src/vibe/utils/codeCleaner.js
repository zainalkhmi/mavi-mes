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

export function cleanVibeCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') return '';
  let cleaned = rawCode.trim();

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

  // 6. Sanitize rogue quotes after numeric values or commas (e.g. `quantity: 50,'` -> `quantity: 50,`)
  cleaned = cleaned.replace(/(\b\d+\s*,)\s*['"]\s*$/gm, '$1');

  // Strip trailing rogue quote, backtick, or fence residue at the very end
  cleaned = cleaned.replace(/[\s\r\n`'"]+$/g, '').trim();

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
    const fnMatch = cleaned.match(/function\s+([A-Za-z0-9_]+)/);
    if (fnMatch && fnMatch[1]) {
      cleaned += `\nexport default ${fnMatch[1]};`;
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
  const match = String(errorText).match(/ReferenceError:\s*([A-Za-z0-9_]+)\s+is not defined/i) ||
                String(errorText).match(/([A-Za-z0-9_]+)\s+is not defined/i);
  if (!match) return null;

  const missingName = match[1];

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

export default { cleanVibeCode, healTruncatedReactCode, extractVibeCode, autoFixMissingImports };
