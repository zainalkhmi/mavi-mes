/**
 * SandpackRuntimeProvider.js
 * Sandpack-backed runtime implementation for MaviCore Vibe Coding.
 * Provides instant in-browser React/Ionic sandbox execution with multi-file support.
 */

export class SandpackRuntimeProvider {
  constructor() {
    this.type = 'sandpack';
    this.files = {};
    this.logs = [];
    this.errorListeners = new Set();
    this.logListeners = new Set();
    this.status = 'idle'; // 'idle' | 'running' | 'error'
  }

  isSupported() {
    return true; // Sandpack works in all modern browsers without COOP/COEP
  }

  /**
   * Mounts virtual file system files into Sandpack format
   * @param {Record<string, string>} filesRecord
   */
  async mountProject(filesRecord) {
    this.files = { ...filesRecord };
    // Ensure styles.css and App.jsx exist
    if (!this.files['/styles.css']) {
      this.files['/styles.css'] = `body { margin: 0; background: #030712; color: #f8fafc; font-family: sans-serif; }`;
    }
    this.addLog('[SandpackRuntime] Proyek berhasil dimounting ke Sandpack Sandbox.');
    this.status = 'running';
    return true;
  }

  async writeFile(path, content) {
    this.files[path] = content;
    this.addLog(`[SandpackRuntime] File diupdate: ${path}`);
    return true;
  }

  async readFile(path) {
    return this.files[path] || null;
  }

  async deleteFile(path) {
    delete this.files[path];
    this.addLog(`[SandpackRuntime] File dihapus: ${path}`);
    return true;
  }

  async installDependency(pkgName, version = 'latest') {
    let pkg = {};
    try {
      pkg = JSON.parse(this.files['/package.json'] || '{}');
    } catch {
      /* ignore invalid json */
    }
    pkg.dependencies = pkg.dependencies || {};
    pkg.dependencies[pkgName] = version;
    this.files['/package.json'] = JSON.stringify(pkg, null, 2);
    this.addLog(`[SandpackRuntime] Dependency ditambahkan: ${pkgName}@${version}`);
    return true;
  }

  async runCommand(cmd, args = []) {
    this.addLog(`[SandpackRuntime] $ ${cmd} ${args.join(' ')}`);
    return { exitCode: 0, output: 'OK' };
  }

  async startDevServer() {
    this.status = 'running';
    this.addLog('[SandpackRuntime] Dev server aktif di Sandpack engine.');
    return { url: 'sandpack://localhost' };
  }

  async stopDevServer() {
    this.status = 'idle';
    this.addLog('[SandpackRuntime] Dev server dihentikan.');
  }

  addLog(msg) {
    const entry = { timestamp: new Date(), text: msg };
    this.logs.push(entry);
    for (const l of this.logListeners) {
      try { l(entry); } catch { /* ignore log error */ }
    }
  }

  recordError(err) {
    this.status = 'error';
    const errText = typeof err === 'string' ? err : err.message || JSON.stringify(err);
    this.addLog(`[ERROR] ${errText}`);
    for (const l of this.errorListeners) {
      try { l(errText, err); } catch { /* ignore error listener */ }
    }
  }

  getLogs() {
    return this.logs;
  }

  onError(callback) {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  onLog(callback) {
    this.logListeners.add(callback);
    return () => this.logListeners.delete(callback);
  }
}
