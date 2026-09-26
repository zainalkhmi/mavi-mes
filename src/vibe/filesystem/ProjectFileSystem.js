/**
 * ProjectFileSystem.js
 * In-memory hierarchical Virtual File System for MaviCore Vibe Coding Engine.
 * Supports file CRUD, folder hierarchy, file search, tree generation, and package.json synchronization.
 */

import { cleanVibeCode } from '../utils/codeCleaner.js';

export class VirtualFile {
  constructor(path, content = '', isBinary = false) {
    this.path = this.normalizePath(path);
    this.content = content != null ? (typeof content === 'string' ? content : String(content)) : '';
    this.isBinary = isBinary;
    this.updatedAt = new Date();
  }

  normalizePath(p) {
    let clean = String(p || '').replace(/\\/g, '/').trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    return clean;
  }
}

export class ProjectFileSystem {
  constructor(initialFiles = {}) {
    /** @type {Map<string, VirtualFile>} */
    this.files = new Map();
    this.listeners = new Set();
    this.init(initialFiles);
  }

  normalizePath(p) {
    if (!p) return '/';
    let clean = String(p).replace(/\\/g, '/').trim();
    if (!clean.startsWith('/')) clean = '/' + clean;
    // Remove trailing slash unless it's root
    if (clean.length > 1 && clean.endsWith('/')) {
      clean = clean.slice(0, -1);
    }
    return clean;
  }

  init(initialFiles = {}) {
    this.files.clear();
    for (const [path, content] of Object.entries(initialFiles)) {
      const norm = this.normalizePath(path);
      let finalContent = content;
      if (typeof content === 'string' && (norm === '/App.js' || norm === '/App.jsx')) {
        finalContent = cleanVibeCode(content);
      }
      const isBin = typeof finalContent !== 'string';
      this.files.set(norm, new VirtualFile(norm, finalContent, isBin));
    }
    // Mirror and synchronize /App.js to /App.jsx strictly
    const appJs = this.files.get('/App.js');
    const appJsx = this.files.get('/App.jsx');
    const bestContent = (appJs?.content && String(appJs.content).trim())
      ? appJs.content
      : (appJsx?.content && String(appJsx.content).trim())
        ? appJsx.content
        : '';
    if (bestContent) {
      this.files.set('/App.js', new VirtualFile('/App.js', bestContent, false));
      this.files.set('/App.jsx', new VirtualFile('/App.jsx', bestContent, false));
    }
    this.notify();
  }

  /**
   * Reads a file content by normalized path
   * @param {string} path
   * @returns {string | null}
   */
  readFile(path) {
    const norm = this.normalizePath(path);
    let file = this.files.get(norm);
    if (!file && norm === '/App.jsx') file = this.files.get('/App.js');
    if (!file && norm === '/App.js') file = this.files.get('/App.jsx');
    return file ? file.content : null;
  }

  /**
   * Writes or updates a file
   * @param {string} path
   * @param {string} content
   * @returns {VirtualFile}
   */
  writeFile(path, content) {
    const norm = this.normalizePath(path);
    let finalContent = content != null ? content : '';
    if (typeof finalContent === 'string' && (norm === '/App.js' || norm === '/App.jsx')) {
      finalContent = cleanVibeCode(finalContent);
    }
    const isBin = typeof finalContent !== 'string';
    const file = new VirtualFile(norm, finalContent, isBin);
    this.files.set(norm, file);

    // CRITICAL FIX: Keep /App.js and /App.jsx strictly synchronized
    // so whether bundler resolves .js or .jsx, both always contain the latest generated code!
    if (norm === '/App.js') {
      this.files.set('/App.jsx', new VirtualFile('/App.jsx', finalContent, isBin));
    } else if (norm === '/App.jsx') {
      this.files.set('/App.js', new VirtualFile('/App.js', finalContent, isBin));
    }

    this.notify({ type: 'write', path: norm, file });
    return file;
  }

  /**
   * Deletes a file or directory
   * @param {string} path
   * @returns {boolean}
   */
  deleteFile(path) {
    const norm = this.normalizePath(path);
    let deleted = false;

    // Check if exact file
    if (this.files.has(norm)) {
      this.files.delete(norm);
      deleted = true;
    } else {
      // Check if folder delete (prefix match)
      const prefix = norm.endsWith('/') ? norm : norm + '/';
      const toDelete = [];
      for (const key of this.files.keys()) {
        if (key.startsWith(prefix)) {
          toDelete.push(key);
        }
      }
      for (const k of toDelete) {
        this.files.delete(k);
        deleted = true;
      }
    }

    if (deleted) {
      this.notify({ type: 'delete', path: norm });
    }
    return deleted;
  }

  /**
   * Renames/moves a file
   * @param {string} oldPath
   * @param {string} newPath
   * @returns {boolean}
   */
  renameFile(oldPath, newPath) {
    const oldNorm = this.normalizePath(oldPath);
    const newNorm = this.normalizePath(newPath);

    if (this.files.has(oldNorm)) {
      const file = this.files.get(oldNorm);
      this.files.delete(oldNorm);
      file.path = newNorm;
      file.updatedAt = new Date();
      this.files.set(newNorm, file);
      this.notify({ type: 'rename', oldPath: oldNorm, newPath: newNorm });
      return true;
    }

    // Folder rename
    const oldPrefix = oldNorm.endsWith('/') ? oldNorm : oldNorm + '/';
    const newPrefix = newNorm.endsWith('/') ? newNorm : newNorm + '/';
    const toRename = [];

    for (const [key, file] of this.files.entries()) {
      if (key.startsWith(oldPrefix)) {
        toRename.push({ oldKey: key, suffix: key.slice(oldPrefix.length), file });
      }
    }

    if (toRename.length > 0) {
      for (const item of toRename) {
        this.files.delete(item.oldKey);
        const replacedPath = newPrefix + item.suffix;
        item.file.path = replacedPath;
        item.file.updatedAt = new Date();
        this.files.set(replacedPath, item.file);
      }
      this.notify({ type: 'rename_folder', oldPath: oldNorm, newPath: newNorm });
      return true;
    }

    return false;
  }

  /**
   * Checks if a file or directory exists
   * @param {string} path
   * @returns {boolean}
   */
  exists(path) {
    const norm = this.normalizePath(path);
    if (this.files.has(norm)) return true;
    const prefix = norm.endsWith('/') ? norm : norm + '/';
    for (const k of this.files.keys()) {
      if (k.startsWith(prefix)) return true;
    }
    return false;
  }

  /**
   * Returns a plain record of { [path]: content }
   * @returns {Record<string, string>}
   */
  getAllFilesRecord() {
    const record = {};
    for (const [path, file] of this.files.entries()) {
      if (!path) continue;
      const content = file?.content;
      record[path] = typeof content === 'string' ? content : (content != null ? String(content) : '');
    }
    return record;
  }

  /**
   * Returns list of all file paths
   * @returns {string[]}
   */
  listFiles() {
    return Array.from(this.files.keys()).sort();
  }

  /**
   * Generates a hierarchical file tree structure for UI rendering
   * @returns {Array<object>}
   */
  getFileTree() {
    const root = { name: '', path: '/', isDirectory: true, children: [] };

    for (const path of this.listFiles()) {
      const parts = path.split('/').filter(Boolean);
      let curr = root;
      let currentPath = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        currentPath += '/' + part;
        const isFile = i === parts.length - 1;
        if (!curr.children) {
          curr.children = [];
          curr.isDirectory = true;
        }

        let existing = curr.children.find(c => c.name === part);
        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            isDirectory: !isFile,
            children: isFile ? [] : [],
            file: isFile ? this.files.get(currentPath) : undefined
          };
          curr.children.push(existing);
        } else if (!isFile) {
          existing.isDirectory = true;
          if (!existing.children) existing.children = [];
        }
        curr = existing;
      }
    }

    // Sort /App.js first, then user files/folders, and node_modules last
    const sortTree = (node) => {
      if (node.children) {
        node.children.sort((a, b) => {
          // Pin /App.js to the absolute top of the root tree
          if (a.path === '/App.js') return -1;
          if (b.path === '/App.js') return 1;
          // Subsume /App.jsx right under /App.js if present
          if (a.path === '/App.jsx') return -1;
          if (b.path === '/App.jsx') return 1;

          // Push node_modules to bottom
          if (a.name === 'node_modules') return 1;
          if (b.name === 'node_modules') return -1;

          if (a.isDirectory && !b.isDirectory) return -1;
          if (!a.isDirectory && b.isDirectory) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };

    sortTree(root);
    return root.children || [];
  }

  /**
   * Reads and parses package.json if it exists
   * @returns {object | null}
   */
  getPackageJson() {
    const content = this.readFile('/package.json');
    if (!content) return null;
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Updates package.json dependencies safely
   * @param {Record<string, string>} newDependencies
   * @param {Record<string, string>} newDevDependencies
   */
  updateDependencies(newDependencies = {}, newDevDependencies = {}) {
    let pkg = this.getPackageJson() || {
      name: 'mavicore-vibe-app',
      version: '1.0.0',
      private: true,
      dependencies: {},
      devDependencies: {}
    };

    pkg.dependencies = { ...(pkg.dependencies || {}), ...newDependencies };
    if (Object.keys(newDevDependencies).length > 0) {
      pkg.devDependencies = { ...(pkg.devDependencies || {}), ...newDevDependencies };
    }

    this.writeFile('/package.json', JSON.stringify(pkg, null, 2));
    return pkg;
  }

  /**
   * Subscribes to file system changes
   * @param {Function} listener
   * @returns {Function} unsubscribe
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event = { type: 'batch' }) {
    for (const listener of this.listeners) {
      try {
        listener(event, this);
      } catch (err) {
        console.error('[ProjectFileSystem] Listener error:', err);
      }
    }
  }
}
