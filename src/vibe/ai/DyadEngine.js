/**
 * DyadEngine.js
 * ==============================================================================
 * Dyad-inspired Engine for MaviCore Copilot (Adapted from dyad-sh/dyad)
 * 
 * Features:
 *  1. Context-Augmented Generation (CAG): On-demand file resolution
 *  2. Atomic File Editing: Targeted search-and-replace (dyad-search-replace)
 *  3. Tool Calling Registry: MCP-compatible tool definitions with Zod schemas
 *  4. Playwright Diagnostic Bridge: Converts test failures into self-healing tasks
 * ==============================================================================
 */

import { z } from 'zod';

// ─── 1. Tool Schemas (Zod) ───────────────────────────────────────────────────

export const DyadReadSchema = z.object({
  path: z.string().describe('Relative path to the file to inspect'),
  startLine: z.number().optional().describe('Optional start line number (1-indexed)'),
  endLine: z.number().optional().describe('Optional end line number (1-indexed)')
});

export const DyadSearchReplaceSchema = z.object({
  path: z.string().describe('Relative path to the file to modify'),
  search: z.string().describe('Exact code snippet to find and replace'),
  replace: z.string().describe('Replacement code snippet')
});

export const DyadWriteSchema = z.object({
  path: z.string().describe('Relative path to the file to write'),
  content: z.string().describe('Complete content of the file')
});

// ─── 2. Context-Augmented Generation (CAG) Resolver ──────────────────────────

export class DyadCAGResolver {
  /**
   * Identifies files in the project that are relevant to the user prompt.
   * Prevents context window saturation by only loading what is needed.
   * 
   * @param {string} prompt - User request
   * @param {string[]} availableFiles - List of all available file paths in project
   * @returns {string[]} Relevant file paths
   */
  static resolveRelevantFiles(prompt, availableFiles = []) {
    if (!prompt || availableFiles.length === 0) return [];

    const lowerPrompt = prompt.toLowerCase();
    const relevant = new Set();

    for (const file of availableFiles) {
      const lowerFile = file.toLowerCase();
      const fileName = file.split('/').pop().toLowerCase();
      const baseName = fileName.split('.')[0];

      // Exact filename or basename mention
      if (lowerPrompt.includes(fileName) || (baseName.length > 2 && lowerPrompt.includes(baseName))) {
        relevant.add(file);
      }

      // Domain keyword mapping
      if ((lowerPrompt.includes('login') || lowerPrompt.includes('auth')) && lowerFile.includes('auth') || lowerFile.includes('login')) {
        relevant.add(file);
      }
      if ((lowerPrompt.includes('gluestack') || lowerPrompt.includes('mobile')) && (lowerFile.includes('gluestack') || lowerFile.includes('mobile'))) {
        relevant.add(file);
      }
      if ((lowerPrompt.includes('sandbox') || lowerPrompt.includes('runner')) && (lowerFile.includes('sandbox') || lowerFile.includes('sandpack'))) {
        relevant.add(file);
      }
      if ((lowerPrompt.includes('agent') || lowerPrompt.includes('copilot')) && (lowerFile.includes('agent') || lowerFile.includes('copilot'))) {
        relevant.add(file);
      }
    }

    // Default fallback to entry point if nothing detected
    if (relevant.size === 0) {
      const entry = availableFiles.find(f => f.endsWith('App.jsx') || f.endsWith('App.tsx') || f.endsWith('App.js'));
      if (entry) relevant.add(entry);
    }

    return Array.from(relevant);
  }

  /**
   * Formats files into a CAG context block for LLM prompts.
   * @param {Record<string, string>} fileContents - Map of relative path -> content
   * @returns {string} Formatted context
   */
  static buildCagContextBlock(fileContents = {}) {
    const blocks = [];
    for (const [filePath, content] of Object.entries(fileContents)) {
      blocks.push(`<file path="${filePath}">\n${content}\n</file>`);
    }
    return blocks.join('\n\n');
  }
}

// ─── 3. Atomic Search & Replace Engine ───────────────────────────────────────

export class DyadPatchEngine {
  /**
   * Applies an atomic search-and-replace chunk to a file.
   * Matches Dyad's dyad-search-replace protocol.
   * 
   * @param {string} sourceCode - Existing file content
   * @param {string} searchChunk - Exact block to find
   * @param {string} replaceChunk - New content to replace with
   * @returns {{ success: boolean, code: string, error?: string }}
   */
  static applySearchReplace(sourceCode, searchChunk, replaceChunk) {
    if (!sourceCode) {
      return { success: false, code: sourceCode, error: 'Source code is empty' };
    }

    const trimmedSearch = searchChunk.trim();

    // 1. Direct match
    if (sourceCode.includes(searchChunk)) {
      const updated = sourceCode.replace(searchChunk, replaceChunk);
      return { success: true, code: updated };
    }

    // 2. Trimmed match (handling newline & whitespace variations)
    if (sourceCode.includes(trimmedSearch)) {
      const updated = sourceCode.replace(trimmedSearch, replaceChunk.trim());
      return { success: true, code: updated };
    }

    // 3. Normalized whitespace match
    const normalize = (str) => str.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ');
    const normSource = normalize(sourceCode);
    const normSearch = normalize(searchChunk);

    if (normSource.includes(normSearch)) {
      // Fallback: replace with line-based scan
      const lines = sourceCode.split('\n');
      const searchLines = searchChunk.split('\n').map(l => l.trim()).filter(Boolean);
      
      let foundIndex = -1;
      for (let i = 0; i <= lines.length - searchLines.length; i++) {
        const slice = lines.slice(i, i + searchLines.length).map(l => l.trim()).filter(Boolean);
        if (slice.join('===') === searchLines.join('===')) {
          foundIndex = i;
          break;
        }
      }

      if (foundIndex !== -1) {
        lines.splice(foundIndex, searchLines.length, replaceChunk);
        return { success: true, code: lines.join('\n') };
      }
    }

    return {
      success: false,
      code: sourceCode,
      error: `Search block not found in file. Ensure the target snippet matches exactly.`
    };
  }
}

// ─── 4. Playwright Diagnostic Bridge ─────────────────────────────────────────

export class DyadDiagnosticBridge {
  /**
   * Converts a Playwright failure report into actionable self-healing instructions.
   * @param {object} report - Failure report details
   * @returns {object} Diagnosis and suggested patch strategy
   */
  static diagnosePlaywrightFailure(report = {}) {
    const raw = report.rawLog || report.stderr || '';

    let errorType = 'UNKNOWN';
    let suggestion = '';

    if (raw.includes('strict mode violation')) {
      errorType = 'STRICT_MODE_VIOLATION';
      suggestion = 'Selector resolved to multiple elements. Add .first() or a more specific role locator.';
    } else if (raw.includes('toBeVisible() failed') || raw.includes('element(s) not found')) {
      errorType = 'LOCATOR_NOT_FOUND';
      suggestion = 'Element locator did not appear in DOM. Verify selector, Suspense loading, or route state.';
    } else if (raw.includes('Test timeout of')) {
      errorType = 'TIMEOUT_EXCEEDED';
      suggestion = 'Operation exceeded timeout limit. Increase timeout or ensure async events resolve properly.';
    } else if (raw.includes('pageerror') || raw.includes('SyntaxError')) {
      errorType = 'RUNTIME_SYNTAX_ERROR';
      suggestion = 'Unhandled exception or syntax crash in client application.';
    }

    return {
      errorType,
      suggestion,
      isSelfHealable: errorType !== 'UNKNOWN',
      affectedFiles: report.affectedFiles || []
    };
  }
}
