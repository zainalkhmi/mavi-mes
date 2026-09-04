/**
 * ProjectMemory.js
 * Project context indexer and selective context retriever for MaviCore Vibe Coding.
 * Prevents blowing LLM token limits by summarizing project layout, exported components,
 * package.json dependencies, tables, and recent modifications.
 */

export class ProjectMemory {
  /**
   * Builds an index of project contents
   * @param {import('../filesystem/ProjectFileSystem').ProjectFileSystem} vfs
   * @param {object} [extraContext]
   * @returns {object}
   */
  static indexProject(vfs, extraContext = {}) {
    const fileList = vfs.listFiles();
    const pkg = vfs.getPackageJson() || {};

    const components = [];
    const routes = [];
    const tables = extraContext.tables || [];

    for (const path of fileList) {
      if (path.endsWith('.jsx') || path.endsWith('.tsx') || path.endsWith('.js')) {
        const content = vfs.readFile(path) || '';
        // Find exported function names
        const exports = [];
        const fnMatches = content.matchAll(/export\s+(?:default\s+)?(?:function|const)\s+([A-Za-z0-9_]+)/g);
        for (const m of fnMatches) {
          exports.push(m[1]);
        }
        components.push({ path, exports, lineCount: content.split('\n').length });
      }
    }

    return {
      fileCount: fileList.length,
      filePaths: fileList,
      dependencies: Object.keys(pkg.dependencies || {}),
      components,
      routes,
      tables: tables.map(t => ({ id: t.id, name: t.name, columnCount: (t.fields || t.columns || []).length }))
    };
  }

  /**
   * Generates a compact Markdown summary to include in the system prompt
   * @param {import('../filesystem/ProjectFileSystem').ProjectFileSystem} vfs
   * @param {string} userPrompt
   * @param {object} [extraContext]
   * @returns {string}
   */
  static getCompactContext(vfs, extraContext = {}) {
    const index = this.indexProject(vfs, extraContext);

    let summary = `## CURRENT PROJECT CONTEXT\n`;
    summary += `- Files in project: ${index.filePaths.join(', ')}\n`;
    summary += `- Installed dependencies: ${index.dependencies.join(', ') || 'react, lucide-react'}\n`;

    if (index.components.length > 0) {
      summary += `- Key Components:\n`;
      for (const comp of index.components.slice(0, 8)) {
        summary += `  • ${comp.path} (${comp.exports.join(', ') || 'default'})\n`;
      }
    }

    if (index.tables.length > 0) {
      summary += `- Connected MaviCore Tables: ${index.tables.map(t => t.name).join(', ')}\n`;
    }

    // Include full contents of key target files if small enough, or targeted files
    const mainFiles = ['/package.json', '/App.jsx', '/App.js'];
    for (const mf of mainFiles) {
      const c = vfs.readFile(mf);
      if (c && c.length < 3500) {
        summary += `\n### File: ${mf}\n\`\`\`${mf.endsWith('.json') ? 'json' : 'jsx'}\n${c}\n\`\`\`\n`;
      }
    }

    return summary;
  }
}
