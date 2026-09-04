/**
 * WebContainerRuntimeProvider.js
 * WebContainer-backed runtime provider for MaviCore Vibe Coding.
 * Spawns in-browser Node.js runtime, npm install, Vite dev server, and terminal output.
 */

export class WebContainerRuntimeProvider {
  constructor() {
    this.type = 'webcontainer';
    this.webcontainerInstance = null;
    this.isBooting = false;
    this.serverUrl = null;
    this.logs = [];
    this.errorListeners = new Set();
    this.logListeners = new Set();
    this.urlListeners = new Set();
    this.status = 'idle'; // 'idle' | 'booting' | 'ready' | 'running' | 'unsupported' | 'error'
  }

  /**
   * Checks if the current browser environment can run WebContainer
   * Requires WebAssembly and Cross-Origin-Isolation (COOP/COEP)
   */
  isSupported() {
    if (typeof window === 'undefined') return false;
    const hasSharedArrayBuffer = typeof window.SharedArrayBuffer !== 'undefined';
    const isIsolated = Boolean(window.crossOriginIsolated);
    return hasSharedArrayBuffer && isIsolated;
  }

  /**
   * Boots the WebContainer instance if not already running
   */
  async boot() {
    if (this.webcontainerInstance) return this.webcontainerInstance;
    if (!this.isSupported()) {
      this.status = 'unsupported';
      const reason = !window.crossOriginIsolated
        ? 'Cross-Origin-Isolation (COOP/COEP) belum aktif di header browser/server.'
        : 'SharedArrayBuffer tidak didukung di browser ini.';
      this.addLog(`[WebContainer] Tidak didukung di sesi ini: ${reason}. Menggunakan Sandpack sebagai engine utama.`);
      throw new Error(`WebContainer unsupported: ${reason}`);
    }

    this.isBooting = true;
    this.status = 'booting';
    this.addLog('[WebContainer] Memulai virtual machine Node.js in-browser...');

    try {
      // Dynamic import of @webcontainer/api
      const { WebContainer } = await import('@webcontainer/api');
      this.webcontainerInstance = await WebContainer.boot();
      this.status = 'ready';
      this.isBooting = false;
      this.addLog('[WebContainer] Virtual machine Node.js siap!');

      // Listen for server-ready events
      this.webcontainerInstance.on('server-ready', (port, url) => {
        this.serverUrl = url;
        this.addLog(`[WebContainer] Dev Server live di ${url} (port ${port})`);
        for (const l of this.urlListeners) {
          try { l(url, port); } catch { /* ignore listener error */ }
        }
      });

      this.webcontainerInstance.on('error', (err) => {
        this.recordError(err.message || 'WebContainer internal error');
      });

      return this.webcontainerInstance;
    } catch (err) {
      this.status = 'error';
      this.isBooting = false;
      this.recordError(err);
      throw err;
    }
  }

  /**
   * Mounts virtual file system files into WebContainer
   * @param {Record<string, string>} filesRecord
   */
  async mountProject(filesRecord) {
    const container = await this.boot();
    const tree = {};

    for (const [rawPath, content] of Object.entries(filesRecord)) {
      const parts = rawPath.replace(/^\//, '').split('/');
      let curr = tree;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
          curr[part] = { file: { contents: content } };
        } else {
          curr[part] = curr[part] || { directory: {} };
          curr = curr[part].directory;
        }
      }
    }

    await container.mount(tree);
    this.addLog('[WebContainer] Seluruh file proyek berhasil dimounting ke filesystem.');
    return true;
  }

  async writeFile(path, content) {
    const container = await this.boot();
    const clean = path.replace(/^\//, '');
    await container.fs.writeFile(clean, content);
    this.addLog(`[WebContainer] fs.writeFile: ${clean}`);
    return true;
  }

  async readFile(path) {
    const container = await this.boot();
    const clean = path.replace(/^\//, '');
    return await container.fs.readFile(clean, 'utf-8');
  }

  async deleteFile(path) {
    const container = await this.boot();
    const clean = path.replace(/^\//, '');
    await container.fs.rm(clean, { recursive: true });
    this.addLog(`[WebContainer] fs.rm: ${clean}`);
    return true;
  }

  async installDependency(pkgName, version = 'latest') {
    return await this.runCommand('npm', ['install', `${pkgName}@${version}`]);
  }

  async runCommand(cmd, args = []) {
    const container = await this.boot();
    this.addLog(`[WebContainer] $ ${cmd} ${args.join(' ')}`);

    const process = await container.spawn(cmd, args);

    process.output.pipeTo(
      new WritableStream({
        write: (data) => {
          this.addLog(data);
        }
      })
    );

    const exitCode = await process.exit;
    if (exitCode !== 0) {
      this.recordError(`Command "${cmd} ${args.join(' ')}" gagal dengan exit code ${exitCode}`);
    }
    return { exitCode };
  }

  async startDevServer() {
    this.addLog('[WebContainer] Menjalankan npm run dev...');
    this.status = 'running';
    return await this.runCommand('npm', ['run', 'dev']);
  }

  async stopDevServer() {
    this.status = 'idle';
    this.serverUrl = null;
    this.addLog('[WebContainer] Dev server dihentikan.');
  }

  addLog(msg) {
    const entry = { timestamp: new Date(), text: String(msg) };
    this.logs.push(entry);
    for (const l of this.logListeners) {
      try { l(entry); } catch { /* ignore listener error */ }
    }
  }

  recordError(err) {
    this.status = 'error';
    const errText = typeof err === 'string' ? err : err.message || JSON.stringify(err);
    this.addLog(`[ERROR] ${errText}`);
    for (const l of this.errorListeners) {
      try { l(errText, err); } catch { /* ignore error callback */ }
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

  onServerReady(callback) {
    this.urlListeners.add(callback);
    return () => this.urlListeners.delete(callback);
  }
}
