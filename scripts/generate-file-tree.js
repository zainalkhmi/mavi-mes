import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.resolve(ROOT_DIR, 'public', 'project-files.json');

// Files and folders to ignore completely
const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.antigravitycli',
  'dist',
  'docs',
  '.gemini',
  'tmp',
  'build'
]);

const IGNORE_FILES = new Set([
  'package-lock.json',
  '.DS_Store',
  'thumbs.db',
  'desktop.ini',
  '~$mavi_mes_presentation_v2.pptx'
]);

// Text extensions we want to read contents for
const TEXT_EXTENSIONS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.css',
  '.json',
  '.md',
  '.html',
  '.sql',
  '.config',
  '.cjs',
  '.mjs',
  '.txt'
]);

const stats = {
  totalFiles: 0,
  totalDirectories: 0,
  totalLines: 0,
  totalSize: 0,
  extensions: {}
};

const filesMap = {};

function getRelativePath(absolutePath) {
  return path.relative(ROOT_DIR, absolutePath).replace(/\\/g, '/');
}

function processFile(absolutePath) {
  const stat = fs.statSync(absolutePath);
  const ext = path.extname(absolutePath).toLowerCase();
  const name = path.basename(absolutePath);
  const relPath = getRelativePath(absolutePath);

  // If binary file (not in TEXT_EXTENSIONS), skip content reading but keep in tree/stats
  const isText = TEXT_EXTENSIONS.has(ext) || ext === '';
  let content = '';
  let lineCount = 0;

  if (isText && stat.size < 5 * 1024 * 1024) { // Ignore files > 5MB for safety
    try {
      content = fs.readFileSync(absolutePath, 'utf-8');
      lineCount = content.split('\n').length;
    } catch (e) {
      console.warn(`Warning: Could not read content of ${relPath}: ${e.message}`);
    }
  }

  // Update Stats
  stats.totalFiles++;
  stats.totalLines += lineCount;
  stats.totalSize += stat.size;

  const extKey = ext || 'no-extension';
  if (!stats.extensions[extKey]) {
    stats.extensions[extKey] = { count: 0, size: 0, lines: 0 };
  }
  stats.extensions[extKey].count++;
  stats.extensions[extKey].size += stat.size;
  stats.extensions[extKey].lines += lineCount;

  // Add to map
  filesMap[relPath] = {
    name,
    path: relPath,
    size: stat.size,
    lines: lineCount,
    content: isText ? content : '[Binary File]',
    ext
  };

  return {
    name,
    type: 'file',
    path: relPath,
    size: stat.size,
    lines: lineCount,
    ext
  };
}

function walk(dirPath) {
  const name = path.basename(dirPath);
  const relPath = getRelativePath(dirPath);
  
  const children = [];
  const items = fs.readdirSync(dirPath);

  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const itemStat = fs.statSync(fullPath);

    if (itemStat.isDirectory()) {
      if (IGNORE_DIRS.has(item)) continue;
      stats.totalDirectories++;
      children.push(walk(fullPath));
    } else {
      if (IGNORE_FILES.has(item)) continue;
      // Skip very large binary files (like powerpoint files in root/public)
      const ext = path.extname(item).toLowerCase();
      if (ext === '.pptx' || ext === '.png' || ext === '.jpg' || ext === '.jpeg' || ext === '.svg') {
        continue;
      }
      children.push(processFile(fullPath));
    }
  }

  // Sort children: directories first, then files alphabetically
  children.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  return {
    name: name || 'root',
    type: 'directory',
    path: relPath || '.',
    children
  };
}

console.log('Generating project files index...');
const tree = walk(ROOT_DIR);

const payload = {
  generatedAt: new Date().toISOString(),
  stats,
  tree,
  files: filesMap
};

// Ensure parent dir of output file exists
const outDir = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(OUTPUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
console.log(`Successfully generated project index at ${OUTPUT_FILE}`);
console.log(`Total files indexed: ${stats.totalFiles}`);
console.log(`Total lines of code: ${stats.totalLines}`);
console.log(`Total size: ${(stats.totalSize / 1024).toFixed(2)} KB`);
