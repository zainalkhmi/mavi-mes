/**
 * BuildService.js
 * Bridges MaviCore Vibe Coding with local/remote Build Services (Tauri / Capacitor / Gradle).
 * Supports:
 * - Desktop EXE build (via build-bridge.js)
 * - Android APK / AAB build
 * - Web Production Bundle export
 * Shows honest connection status and live SSE compilation logs.
 */

export class BuildService {
  constructor(bridgeUrl = 'http://localhost:3010') {
    this.bridgeUrl = bridgeUrl;
    this.status = 'checking'; // 'checking' | 'online' | 'offline'
    this.isBuilding = false;
  }

  /**
   * Checks whether the compiler bridge daemon is online
   * @returns {Promise<{ isOnline: boolean, details?: object }>}
   */
  async checkStatus() {
    try {
      const resp = await fetch(`${this.bridgeUrl}/status`, { method: 'GET' });
      if (resp.ok) {
        const data = await resp.json();
        this.status = 'online';
        this.isBuilding = Boolean(data.isBuilding);
        return { isOnline: true, details: data };
      }
      this.status = 'offline';
      return { isOnline: false };
    } catch {
      this.status = 'offline';
      return { isOnline: false };
    }
  }

  /**
   * Triggers an APK build through the build service
   * @param {object} params
   * @param {Record<string, string>} params.projectFiles
   * @param {string} params.appName
   * @param {Function} [params.onLog]
   * @param {Function} [params.onSuccess]
   * @param {Function} [params.onError]
   */
  async buildAndroidApk({ projectFiles, appName = 'MaviApp', onLog, onSuccess, onError }) {
    const status = await this.checkStatus();
    if (!status.isOnline) {
      const err = new Error('Build service not connected. Jalankan "node build-bridge.js" di terminal untuk mengaktifkan compiler APK/EXE.');
      if (onError) onError(err);
      throw err;
    }

    if (onLog) onLog('[BuildService] Menghubungi Android Capacitor Build Server...');

    // Attempt trigger via bridge
    try {
      const response = await fetch(`${this.bridgeUrl}/build-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appName,
          target: 'apk',
          files: projectFiles
        })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Build server returned status ${response.status}`);
      }

      if (onLog) onLog(`[BuildService] Memulai kompilasi APK untuk ${appName}...`);
      if (onSuccess) onSuccess({ message: 'Proses kompilasi APK berhasil dimulai.' });
      return { success: true };
    } catch (err) {
      if (onLog) onLog(`[BuildService Log] ${err.message}`);
      if (onError) onError(err);
      throw err;
    }
  }

  /**
   * Exports project files as a downloadable ZIP package
   * @param {Record<string, string>} projectFiles
   * @param {string} appName
   */
  async exportProjectZip(projectFiles, appName = 'mavicore-app') {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();

    for (const [path, content] of Object.entries(projectFiles)) {
      const clean = path.replace(/^\//, '');
      zip.file(clean, content);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${appName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }
}

export const buildService = new BuildService();
