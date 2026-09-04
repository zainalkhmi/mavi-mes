/**
 * VibeCodeSearch.js
 * Code Search & Analysis with ripgrep and Tree-sitter patterns
 * Enables semantic code search and understanding
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Search Result Types ─────────────────────────────────────────────────────

export const SearchResult = {
  file: String,        // File path
  line: Number,        // Line number
  column: Number,      // Column number
  match: String,       // Matched text
  context: String,     // Surrounding context (few lines before/after)
  score: Number,       // Relevance score
};

// ─── ripgrep-style Search ────────────────────────────────────────────────────

export class CodeSearcher {
  constructor() {
    this.files = [];
    this.index = new Map(); // Simple file index for searching
  }

  // Index files for search
  indexFiles(files) {
    this.files = Object.entries(files).map(([path, content]) => ({
      path,
      content,
      lines: content.split('\n'),
      // Pre-compute searchable tokens
      tokens: this.tokenize(content)
    }));

    // Build index
    this.buildIndex();
  }

  tokenize(content) {
    return content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);
  }

  buildIndex() {
    this.index.clear();
    this.files.forEach((file, fileIndex) => {
      file.tokens.forEach((token, tokenIndex) => {
        if (!this.index.has(token)) {
          this.index.set(token, []);
        }
        this.index.get(token).push({ fileIndex, tokenIndex });
      });
    });
  }

  // Simple regex search (simulating ripgrep)
  search(pattern, options = {}) {
    const {
      caseSensitive = false,
      wholeWord = false,
      regex = true,
      maxResults = 100
    } = options;

    let searchPattern = pattern;
    if (!regex) {
      searchPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (wholeWord) {
      searchPattern = `\\b${searchPattern}\\b`;
    }

    const flags = caseSensitive ? 'g' : 'gi';
    let regexObj;
    try {
      regexObj = new RegExp(searchPattern, flags);
    } catch {
      return []; // Invalid regex
    }

    const results = [];
    const contextLines = options.context || 2;

    for (const file of this.files) {
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        let match;
        const matches = [];

        while ((match = regexObj.exec(line)) !== null) {
          matches.push({
            file: file.path,
            line: i + 1,
            column: match.index + 1,
            match: match[0],
            context: file.lines.slice(
              Math.max(0, i - contextLines),
              Math.min(file.lines.length, i + contextLines + 1)
            ).join('\n'),
            score: this.calculateScore(match[0], file.path, pattern)
          });
        }

        results.push(...matches);
        if (results.length >= maxResults) break;
      }
      if (results.length >= maxResults) break;
    }

    // Sort by score
    return results.sort((a, b) => b.score - a.score);
  }

  calculateScore(match, filePath, pattern) {
    let score = match.length * 10; // Longer matches = higher score

    // Boost for exact match
    if (match.toLowerCase() === pattern.toLowerCase()) {
      score += 50;
    }

    // Boost for matches in filename
    if (filePath.toLowerCase().includes(pattern.toLowerCase())) {
      score += 30;
    }

    // Boost for shorter files (likely more relevant)
    const file = this.files.find(f => f.path === filePath);
    if (file) {
      score += Math.max(0, 20 - file.lines.length / 100);
    }

    return score;
  }

  // Find all imports in code
  findImports(code) {
    const importRegex = /import\s+(?:(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+)?['"]([^'"]+)['"]|require\(['"]([^'"]+)['"])/g;
    const imports = [];
    let match;

    while ((match = importRegex.exec(code)) !== null) {
      imports.push({
        module: match[1] || match[2],
        type: match[0].startsWith('import') ? 'import' : 'require'
      });
    }

    return imports;
  }

  // Find all function/component definitions
  findDefinitions(code) {
    const definitions = [];

    // React components
    const componentRegex = /(?:export\s+)?(?:default\s+)?function\s+([A-Z][a-zA-Z0-9]*)|(?:const|let|var)\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:(?:\([^)]*\)|[^=])\s*)?=>/g;
    let match;
    while ((match = componentRegex.exec(code)) !== null) {
      definitions.push({
        name: match[1] || match[2],
        type: 'component',
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Functions
    const funcRegex = /(?:export\s+)?function\s+([a-z][a-zA-Z0-9]*)/g;
    while ((match = funcRegex.exec(code)) !== null) {
      definitions.push({
        name: match[1],
        type: 'function',
        line: code.substring(0, match.index).split('\n').length
      });
    }

    // Hooks
    const hookRegex = /(?:export\s+)?const\s+([a-z][a-zA-Z0-9]*use[A-Z][a-zA-Z0-9]*)\s*=/g;
    while ((match = hookRegex.exec(code)) !== null) {
      definitions.push({
        name: match[1],
        type: 'hook',
        line: code.substring(0, match.index).split('\n').length
      });
    }

    return definitions;
  }

  // Analyze code structure
  analyzeStructure(code) {
    return {
      imports: this.findImports(code),
      definitions: this.findDefinitions(code),
      lines: code.split('\n').length,
      characters: code.length,
      complexity: this.estimateComplexity(code)
    };
  }

  estimateComplexity(code) {
    let score = 0;
    const patterns = [
      { pattern: /\bif\b/g, weight: 1 },
      { pattern: /\bfor\b|\bwhile\b/g, weight: 2 },
      { pattern: /\bswitch\b/g, weight: 2 },
      { pattern: /\bcatch\b/g, weight: 2 },
      { pattern: /\?\s*[^:]+:/g, weight: 1 }, // Ternary
      { pattern: /\&\&|\|\|/g, weight: 1 },  // Logical operators
    ];

    for (const { pattern, weight } of patterns) {
      const matches = code.match(pattern);
      if (matches) score += matches.length * weight;
    }

    if (score < 10) return 'low';
    if (score < 30) return 'medium';
    return 'high';
  }
}

// ─── React Hook ────────────────────────────────────────────────────────────────

export function useCodeSearch() {
  const searcherRef = useRef(new CodeSearcher());
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const indexFiles = useCallback((files) => {
    searcherRef.current.indexFiles(files);
  }, []);

  const search = useCallback((pattern, options = {}) => {
    setIsSearching(true);
    setLastQuery(pattern);

    // Use setTimeout to not block UI
    setTimeout(() => {
      const searchResults = searcherRef.current.search(pattern, options);
      setResults(searchResults);
      setIsSearching(false);
    }, 0);
  }, []);

  const analyzeFile = useCallback((code) => {
    return searcherRef.current.analyzeStructure(code);
  }, []);

  const findInFile = useCallback((code, pattern) => {
    return searcherRef.current.search(pattern, {
      caseSensitive: false,
      maxResults: 50
    });
  }, []);

  return {
    results,
    isSearching,
    lastQuery,
    search,
    indexFiles,
    analyzeFile,
    findInFile
  };
}

// ─── Search Modal Component ───────────────────────────────────────────────────

export function CodeSearchModal({ files, onSelect, onClose }) {
  const { search, results, isSearching, indexFiles } = useCodeSearch();
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    regex: true
  });

  // Index files on mount
  useEffect(() => {
    if (files) {
      indexFiles(files);
    }
  }, [files, indexFiles]);

  // Search on query change
  useEffect(() => {
    if (query.trim()) {
      search(query, options);
    } else {
      setResults([]);
    }
  }, [query, options, search]);

  const handleSelect = (result) => {
    onSelect(result);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      paddingTop: '100px',
      zIndex: 9999
    }}>
      <div style={{
        width: '600px',
        maxHeight: '500px',
        backgroundColor: '#1e1e1e',
        borderRadius: '12px',
        border: '1px solid #333',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Search Input */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '8px'
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code... (regex supported)"
            autoFocus
            style={{
              flex: 1,
              padding: '10px 14px',
              backgroundColor: '#0d0d0d',
              border: '1px solid #333',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={onClose}
            style={{
              padding: '10px 14px',
              backgroundColor: '#333',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            ESC
          </button>
        </div>

        {/* Options */}
        <div style={{
          padding: '8px 16px',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: '12px',
          fontSize: '12px'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
            <input
              type="checkbox"
              checked={options.caseSensitive}
              onChange={(e) => setOptions(o => ({ ...o, caseSensitive: e.target.checked }))}
            />
            Case sensitive
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
            <input
              type="checkbox"
              checked={options.wholeWord}
              onChange={(e) => setOptions(o => ({ ...o, wholeWord: e.target.checked }))}
            />
            Whole word
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#999' }}>
            <input
              type="checkbox"
              checked={options.regex}
              onChange={(e) => setOptions(o => ({ ...o, regex: e.target.checked }))}
            />
            Regex
          </label>
        </div>

        {/* Results */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '8px'
        }}>
          {isSearching && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              Searching...
            </div>
          )}

          {!isSearching && query && results.length === 0 && (
            <div style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
              No results found
            </div>
          )}

          {results.map((result, i) => (
            <div
              key={i}
              onClick={() => handleSelect(result)}
              style={{
                padding: '8px 12px',
                marginBottom: '4px',
                backgroundColor: '#252525',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#252525'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 600 }}>
                  {result.file}
                </span>
                <span style={{ color: '#666', fontSize: '10px' }}>
                  Line {result.line}:{result.column}
                </span>
              </div>
              <pre style={{
                margin: 0,
                fontSize: '12px',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#ccc',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {result.context}
              </pre>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '8px 16px',
          borderTop: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '11px',
          color: '#666'
        }}>
          <span>{results.length} results</span>
          <span>ripgrep-style search</span>
        </div>
      </div>
    </div>
  );
}

export default {
  CodeSearcher,
  useCodeSearch,
  CodeSearchModal,
  SearchResult
};
