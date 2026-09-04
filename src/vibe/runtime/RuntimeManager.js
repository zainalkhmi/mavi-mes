/**
 * RuntimeManager.js
 * Central Runtime Manager for MaviCore Vibe Coding Engine.
 * Implements the required interface:
 *  - mountProject(files)
 *  - writeFile(path, content)
 *  - readFile(path)
 *  - deleteFile(path)
 *  - installDependency(pkgName, version)
 *  - runCommand(cmd, args)
 *  - startDevServer()
 *  - stopDevServer()
 *  - getLogs()
 *
 * Automatically delegates to WebContainer if supported, or Sandpack as reliable fallback.
 */

import { SandpackRuntimeProvider } from './SandpackRuntimeProvider';
import { WebContainerRuntimeProvider } from './WebContainerRuntimeProvider';

export class RuntimeManager {
  constructor(preferredType = 'auto') {
    this.sandpack = new SandpackRuntimeProvider();
    this.webcontainer = new WebContainerRuntimeProvider();

    this.activeType = 'sandpack';
    this.provider = this.sandpack;

    this.initProvider(preferredType);
  }

  initProvider(preferredType = 'auto') {
    if (preferredType === 'webcontainer' && this.webcontainer.isSupported()) {
      this.activeType = 'webcontainer';
      this.provider = this.webcontainer;
    } else if (preferredType === 'sandpack') {
      this.activeType = 'sandpack';
      this.provider = this.sandpack;
    } else {
      // Auto selection
      if (this.webcontainer.isSupported()) {
        this.activeType = 'webcontainer';
        this.provider = this.webcontainer;
      } else {
        this.activeType = 'sandpack';
        this.provider = this.sandpack;
      }
    }
  }

  /**
   * Switch the active runtime engine
   * @param {'sandpack'|'webcontainer'} type
   */
  switchEngine(type) {
    if (type === 'webcontainer' && !this.webcontainer.isSupported()) {
      throw new Error('WebContainer tidak didukung pada browser/environment ini (memerlukan Cross-Origin Isolation).');
    }
    this.activeType = type;
    this.provider = type === 'webcontainer' ? this.webcontainer : this.sandpack;
  }

  /**
   * Mounts all project files into the active runtime
   * @param {Record<string, string>} filesRecord
   */
  async mountProject(filesRecord) {
    return await this.provider.mountProject(filesRecord);
  }

  async writeFile(path, content) {
    return await this.provider.writeFile(path, content);
  }

  async readFile(path) {
    return await this.provider.readFile(path);
  }

  async deleteFile(path) {
    return await this.provider.deleteFile(path);
  }

  async installDependency(pkgName, version = 'latest') {
    return await this.provider.installDependency(pkgName, version);
  }

  async runCommand(cmd, args = []) {
    return await this.provider.runCommand(cmd, args);
  }

  async startDevServer() {
    return await this.provider.startDevServer();
  }

  async stopDevServer() {
    return await this.provider.stopDevServer();
  }

  getLogs() {
    return this.provider.getLogs();
  }

  onError(callback) {
    return this.provider.onError(callback);
  }

  onLog(callback) {
    return this.provider.onLog(callback);
  }
}
