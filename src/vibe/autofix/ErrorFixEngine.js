/**
 * ErrorFixEngine.js
 * Automated error detection, AI analysis, and auto-repair engine for MaviCore Vibe Coding.
 * Loops through: Error -> Capture -> AI Analysis -> Generate Fix -> Apply -> Re-verify (up to max attempts).
 */

import { AIProvider } from '../ai/AIProvider';
import { AgenticPromptEngine } from '../ai/AgenticPromptEngine';

export class ErrorFixEngine {
  constructor(vfs, runtimeManager, maxAttempts = 3) {
    /** @type {import('../filesystem/ProjectFileSystem').ProjectFileSystem} */
    this.vfs = vfs;
    /** @type {import('../runtime/RuntimeManager').RuntimeManager} */
    this.runtimeManager = runtimeManager;
    this.maxAttempts = maxAttempts;
    this.attemptCount = 0;
    this.isRepairing = false;
    this.listeners = new Set();
  }

  /**
   * Subscribes to repair progress events
   * @param {Function} cb (event: { stage: string, attempt: number, message: string, fixed?: boolean }) => void
   */
  onProgress(cb) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  notify(event) {
    for (const l of this.listeners) {
      try { l(event); } catch { /* ignore listener error */ }
    }
  }

  /**
   * Initiates the automatic repair cycle for a detected error
   * @param {string} errorText
   * @param {string} [source]
   * @returns {Promise<{ success: boolean, appliedFiles: string[], attempts: number }>}
   */
  async attemptAutoFix(errorText, source = '') {
    if (this.isRepairing) {
      console.warn('[ErrorFixEngine] Repair already in progress, skipping duplicate trigger.');
      return { success: false, appliedFiles: [], attempts: this.attemptCount };
    }

    this.isRepairing = true;
    this.attemptCount += 1;

    this.notify({
      stage: 'analyzing',
      attempt: this.attemptCount,
      message: `Mendeteksi error. Menganalisis kode dan penyebab kesalahan (Percobaan ${this.attemptCount}/${this.maxAttempts})...`
    });

    try {
      // 1. Build Auto-Fix Prompt
      const fixPrompt = AgenticPromptEngine.buildAutoFixPrompt({
        errorText,
        errorSource: source,
        vfs: this.vfs
      });

      const messages = [
        {
          role: 'system',
          content: 'Anda adalah Senior Software Debugger untuk React, Vite, Ionic, dan MES industrial apps. Perbaiki kode yang rusak dan berikan kode pengganti yang bekerja sempurna tanpa error.'
        },
        {
          role: 'user',
          content: fixPrompt
        }
      ];

      this.notify({
        stage: 'generating',
        attempt: this.attemptCount,
        message: 'AI sedang menghasilkan patch perbaikan kode...'
      });

      // 2. Call AI Completion
      const response = await AIProvider.getCompletion(messages);

      // 3. Parse File Actions
      const { plan: _plan, fileActions } = AgenticPromptEngine.parseResponse(response);

      if (fileActions.length === 0) {
        this.notify({
          stage: 'failed',
          attempt: this.attemptCount,
          message: 'AI tidak menghasilkan file perbaikan yang valid.'
        });
        this.isRepairing = false;
        return { success: false, appliedFiles: [], attempts: this.attemptCount };
      }

      // 4. Apply Patches to Virtual File System
      const applied = [];
      for (const action of fileActions) {
        this.notify({
          stage: 'patching',
          attempt: this.attemptCount,
          message: `Menerapkan perbaikan pada file ${action.path}...`
        });

        if (action.action === 'delete') {
          this.vfs.deleteFile(action.path);
        } else {
          this.vfs.writeFile(action.path, action.content);
        }
        applied.push(action.path);
      }

      // 5. Update Runtime
      await this.runtimeManager.mountProject(this.vfs.getAllFilesRecord());

      this.notify({
        stage: 'verifying',
        attempt: this.attemptCount,
        message: 'Menguji aplikasi kembali setelah perbaikan diterapkan...'
      });

      // Reset repair state
      this.isRepairing = false;
      this.notify({
        stage: 'success',
        attempt: this.attemptCount,
        message: `✅ Berhasil diperbaiki otomatis (${applied.join(', ')})!`,
        fixed: true
      });

      return { success: true, appliedFiles: applied, attempts: this.attemptCount };
    } catch (err) {
      this.isRepairing = false;
      this.notify({
        stage: 'error',
        attempt: this.attemptCount,
        message: `Gagal memperbaiki error secara otomatis: ${err.message}`
      });
      return { success: false, appliedFiles: [], attempts: this.attemptCount };
    }
  }

  reset() {
    this.attemptCount = 0;
    this.isRepairing = false;
  }
}
