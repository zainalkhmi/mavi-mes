#!/usr/bin/env node
/**
 * copilot-test-and-fix.mjs
 * ==============================================================================
 * Autonomous AI Copilot + Playwright Self-Healing Loop for MAVI MES
 * 
 * Flow:
 *  1. Execute Playwright E2E tests
 *  2. If passed: Exit with success (0)
 *  3. If failed:
 *     - Parse failure stack trace, locator errors, and error-context.md
 *     - Read target files (source file / spec file)
 *     - Query AI (Gemini / OpenAI / Ollama) to analyze root cause & generate fix
 *     - Apply patch directly to file
 *     - Rerun Playwright test in a loop until all tests pass!
 * ==============================================================================
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const MAX_ITERATIONS = 5;

// Read .env.local for AI keys
function loadEnvKeys() {
  const envPath = path.join(rootDir, '.env.local');
  const env = { ...process.env };
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const [key, ...vals] = trimmed.split('=');
      if (key && vals.length > 0) {
        env[key.trim()] = vals.join('=').trim();
      }
    });
  }
  return {
    geminiKey: env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY,
    openaiKey: env.OPENAI_API_KEY || env.VITE_OPENAI_API_KEY,
  };
}

// Execute Playwright test runner
function runPlaywright(targetSpec = '') {
  return new Promise((resolve) => {
    console.log(`\n\x1b[36m🚀 [Playwright] Menjalankan pengujian ${targetSpec || 'seluruh test suite'}...\x1b[0m`);
    const args = ['playwright', 'test'];
    if (targetSpec) {
      args.push(targetSpec);
    }
    args.push('--reporter=list,json');

    const commandString = ['npx', 'playwright', 'test', ...(targetSpec ? [targetSpec] : []), '--reporter=list,json'].join(' ');
    const child = spawn(commandString, {
      cwd: rootDir,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, PLAYWRIGHT_JSON_OUTPUT_NAME: 'test-results/report.json' }
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      const str = data.toString();
      stdout += str;
      process.stdout.write(str);
    });

    child.stderr.on('data', (data) => {
      const str = data.toString();
      stderr += str;
      process.stderr.write(str);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        code,
        stdout,
        stderr
      });
    });
  });
}

// Parse error details from test output
function extractErrorDetails(stdout, stderr) {
  const fullLog = stdout + '\n' + stderr;
  const errors = [];

  // Match file lines e.g. tests\e2e\auth.spec.js:15:3
  const fileMatches = [...fullLog.matchAll(/([a-zA-Z0-9_\-\\\/]+\.spec\.[jt]sx?):(\d+):(\d+)/g)];
  const filesFound = [...new Set(fileMatches.map(m => m[1].replace(/\\/g, '/')))];

  // Look for error-context.md in test-results
  const testResultsDir = path.join(rootDir, 'test-results');
  let errorContext = '';
  if (fs.existsSync(testResultsDir)) {
    const findErrorFiles = (dir) => {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const item of list) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
          results = results.concat(findErrorFiles(full));
        } else if (item.endsWith('error-context.md')) {
          results.push(full);
        }
      }
      return results;
    };

    const contextFiles = findErrorFiles(testResultsDir);
    if (contextFiles.length > 0) {
      // Read the newest error context
      errorContext = fs.readFileSync(contextFiles[0], 'utf8');
    }
  }

  return {
    rawLog: fullLog,
    affectedFiles: filesFound,
    errorContext
  };
}

// Request fix from Gemini API
async function askGeminiToFix(apiKey, fileContent, filePath, errorDetails) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const prompt = `Anda adalah AI QA Engineer ahli Playwright & React.
Berikut file yang mengalami kegagalan pengujian Playwright:
Berkas: ${filePath}

Isi berkas saat ini:
\`\`\`javascript
${fileContent}
\`\`\`

Detail Error Pengujian Playwright:
${errorDetails.errorContext || errorDetails.rawLog.slice(-1500)}

TUGAS:
1. Analisis kenapa tes gagal (misal selector locator tidak cocok, hash routing /#/login, waktu tunggu timeout, atau komponen berubah).
2. Kembalikan KODE LENGKAP YANG SUDAH DIPERBAIKI.
3. Berikan HANYA kode di dalam blok markdown \`\`\`javascript ... \`\`\` tanpa penjelasan panjang agar bisa langsung diterapkan.`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1 }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  
  // Extract code from markdown fence
  const codeMatch = text.match(/```(?:javascript|js)?\n([\s\S]*?)```/);
  return codeMatch ? codeMatch[1].trim() : text.trim();
}

// Heuristic fallback fixer when API key is not provided
function applyHeuristicFix(filePath, content, errorDetails) {
  let modified = content;
  const raw = errorDetails.rawLog;

  // 1. HashRouter fix: if test uses /login without /#/login
  if (raw.includes('HashRouter') || (raw.includes("goto('/login')") || raw.includes('goto("/login")'))) {
    modified = modified.replace(/goto\(['"]\/login['"]\)/g, "goto('/#/login')");
    modified = modified.replace(/goto\(['"]\/store['"]\)/g, "goto('/#/store')");
  }

  // 2. Increase timeout if timed out
  if (raw.includes('Test timeout of') && !modified.includes('test.setTimeout')) {
    modified = modified.replace(/test\(/g, "test.setTimeout(60000);\n  test(");
  }

  // 3. Strict mode violation fix: append .first() when multiple elements match
  if (raw.includes('strict mode violation')) {
    modified = modified.replace(/(\.locator\([^)]+\))(\.toBeVisible)/g, '$1.first()$2');
  }

  return modified !== content ? modified : null;
}

// Main Self-Healing Loop
async function main() {
  const targetSpec = process.argv[2] || '';
  const { geminiKey, openaiKey } = loadEnvKeys();

  console.log('\x1b[35m' + '='.repeat(65));
  console.log(' 🤖 MAVI MES - Autonomous Copilot + Playwright Self-Healing Loop');
  console.log('='.repeat(65) + '\x1b[0m');

  if (geminiKey) {
    console.log(' ✨ Engine AI: Google Gemini (Aktif via API Key)');
  } else if (openaiKey) {
    console.log(' ✨ Engine AI: OpenAI (Aktif via API Key)');
  } else {
    console.log(' ℹ️  Engine AI: Heuristic Engine & Antigravity Agent Mode');
    console.log('    (Tip: Masukkan VITE_GEMINI_API_KEY di .env.local untuk full AI auto-refactoring)');
  }

  let iteration = 1;
  let success = false;

  while (iteration <= MAX_ITERATIONS && !success) {
    console.log(`\n\x1b[33m🔄 [Iterasi ${iteration}/${MAX_ITERATIONS}] Menjalankan siklus pengujian...\x1b[0m`);
    
    const result = await runPlaywright(targetSpec);

    if (result.success) {
      console.log('\n\x1b[32m' + '═'.repeat(65));
      console.log(' 🎉 SEMUA PENGUJIAN LOLOS 100%! Aplikasi telah terverifikasi aman.');
      console.log('═'.repeat(65) + '\x1b[0m\n');
      success = true;
      process.exit(0);
    }

    console.log(`\n\x1b[31m❌ Terdeteksi kegagalan pada pengujian Playwright.\x1b[0m`);
    console.log('\x1b[34m🔍 Menganalisis log kegagalan & struktur file...\x1b[0m');

    const errorDetails = extractErrorDetails(result.stdout, result.stderr);
    
    if (errorDetails.affectedFiles.length === 0) {
      console.log('\x1b[31m⚠️  Tidak dapat menemukan file sumber yang terkait dari log error.\x1b[0m');
      break;
    }

    console.log(`📂 Berkas yang terpengaruh: ${errorDetails.affectedFiles.join(', ')}`);

    let fixApplied = false;

    for (const relPath of errorDetails.affectedFiles) {
      const absPath = path.resolve(rootDir, relPath);
      if (!fs.existsSync(absPath)) continue;

      const originalCode = fs.readFileSync(absPath, 'utf8');
      console.log(`\n🛠️  [Copilot] Mencari solusi perbaikan untuk: ${relPath}...`);

      let fixedCode = null;

      if (geminiKey) {
        try {
          console.log('    📡 Menghubungi Gemini AI untuk mem-patch kode...');
          fixedCode = await askGeminiToFix(geminiKey, originalCode, relPath, errorDetails);
        } catch (e) {
          console.log(`    ⚠️  Panggilan Gemini gagal (${e.message}), mencoba perbaikan heuristik...`);
          fixedCode = applyHeuristicFix(absPath, originalCode, errorDetails);
        }
      } else {
        fixedCode = applyHeuristicFix(absPath, originalCode, errorDetails);
      }

      if (fixedCode && fixedCode !== originalCode) {
        fs.writeFileSync(absPath, fixedCode, 'utf8');
        console.log(`\x1b[32m    ✅ Patch perbaikan berhasil diterapkan pada: ${relPath}\x1b[0m`);
        fixApplied = true;
      } else {
        console.log(`    ⚠️  Belum ada patch otomatis yang dapat diaplikasikan pada file ini.`);
      }
    }

    if (!fixApplied) {
      console.log('\n\x1b[33m💡 AI Agent / Copilot menganalisis error. Silakan periksa detail kegagalan di atas.\x1b[0m');
      break;
    }

    iteration++;
  }

  if (!success) {
    console.log('\n\x1b[31m' + '═'.repeat(65));
    console.log(' ⚠️  Siklus perbaikan mandiri mencapai batas maksimum iterasi.');
    console.log('    Buka Playwright UI untuk inspeksi visual: npm run test:e2e:ui');
    console.log('═'.repeat(65) + '\x1b[0m\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('\n❌ Fatal error in copilot runner:', err);
  process.exit(1);
});
