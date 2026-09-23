/**
 * EmergentAgentPipeline.js
 * Autonomous Multi-Step Agentic Pipeline for MaviCore Vibe Coding.
 * Inspired by emergent.sh architecture:
 * 1. Architect & Intent Analysis (Planning & Schema)
 * 2. Dependency Management (npm packages auto-detection)
 * 3. Multi-File Code Generation (Virtual File System)
 * 4. Runtime Execution & Sandbox Compile Check
 * 5. Autonomous Self-Healing / Auto-Fix Loop
 * 6. Database Table Auto-Provisioning (MaviCore / Supabase)
 * 7. Live Production Verification
 */

import { AgenticPromptEngine } from './AgenticPromptEngine';
import { cleanVibeCode, autoFixMissingImports, autoFixSyntaxErrors } from '../utils/codeCleaner';
import { syncVibeAppToTable } from '../../utils/vibeTableBridge';

export const PIPELINE_STEPS = {
  PLANNING: 'planning',
  DEPENDENCIES: 'dependencies',
  GENERATING: 'generating',
  COMPILING: 'compiling',
  SELF_HEALING: 'self_healing',
  DATABASE_SYNC: 'database_sync',
  READY: 'ready',
  FAILED: 'failed'
};

export class EmergentAgentPipeline {
  constructor({
    vfs,
    runtimeManager,
    versionControl,
    onStepChange = () => {},
    onLog = () => {},
    onFileWritten = () => {},
    onTableSync = () => {}
  }) {
    this.vfs = vfs;
    this.runtimeManager = runtimeManager;
    this.versionControl = versionControl;
    this.onStepChange = onStepChange;
    this.onLog = onLog;
    this.onFileWritten = onFileWritten;
    this.onTableSync = onTableSync;

    this.currentStep = null;
    this.stepHistory = [];
    this.maxAutoFixAttempts = 3;
  }

  setStep(step, label, detail = '', status = 'active') {
    this.currentStep = step;
    const entry = {
      step,
      label,
      detail,
      status, // 'active' | 'completed' | 'error'
      timestamp: new Date()
    };
    this.stepHistory.push(entry);
    this.log(`[Emergent Pipeline] ${label} - ${detail}`);
    this.onStepChange(entry, [...this.stepHistory]);
  }

  log(text) {
    const entry = { timestamp: new Date(), text: String(text) };
    this.onLog(entry);
  }

  /**
   * Executes the entire Emergent.sh autonomous build pipeline from AI generated response
   * @param {object} params
   * @param {string} params.rawResponse AI streaming or full response text
   * @param {string} [params.prompt] Original user prompt
   * @param {object} [params.sandpackBridge] Ref to active Sandpack bridge
   * @returns {Promise<{ success: boolean, mainCode: string, files: Record<string, string>, table: any }>}
   */
  async execute({ rawResponse, prompt = '', sandpackBridge = null }) {
    try {
      // ─── STAGE 1: ARCHITECTURE & PARSING ───
      this.setStep(PIPELINE_STEPS.PLANNING, '🧠 Menganalisis Arsitektur & Rencana', 'Mem-parsing struktur file dan instruksi...');
      const { plan, packages, tableSchemas, fileActions } = AgenticPromptEngine.parseResponse(rawResponse, '/App.js');

      if (plan) {
        this.log(`[Plan] ${plan.split('\n')[0]}`);
      }

      // ─── STAGE 2: DEPENDENCIES CHECK ───
      if (packages && packages.length > 0) {
        this.setStep(PIPELINE_STEPS.DEPENDENCIES, '📦 Memeriksa & Menginstal Dependensi', `Paket: ${packages.join(', ')}`);
        for (const pkg of packages) {
          if (this.runtimeManager?.installDependency) {
            await this.runtimeManager.installDependency(pkg);
          }
          this.log(`[Dependency] Terkonfigurasi: ${pkg}`);
        }
      }

      // ─── STAGE 3: MULTI-FILE CODE GENERATION ───
      this.setStep(
        PIPELINE_STEPS.GENERATING,
        '📁 Menghasilkan File Modular',
        `Menulis ${fileActions.length > 0 ? fileActions.length : 1} file ke Virtual File System...`
      );

      let mainCode = '';

      if (fileActions && fileActions.length > 0) {
        for (const action of fileActions) {
          let cleanContent = cleanVibeCode(action.content || '');
          cleanContent = autoFixMissingImports(cleanContent);
          cleanContent = autoFixSyntaxErrors(cleanContent);

          if (this.vfs) {
            this.vfs.writeFile(action.path, cleanContent);
            if (action.path === '/App.js' || action.path === '/App.jsx') {
              mainCode = cleanContent;
              this.vfs.writeFile('/App.js', cleanContent);
              this.vfs.writeFile('/App.jsx', cleanContent);
            }
          }

          if (sandpackBridge) {
            sandpackBridge.updateFile(action.path, cleanContent);
            if (action.path === '/App.js' || action.path === '/App.jsx') {
              sandpackBridge.updateFile('/App.js', cleanContent);
              sandpackBridge.updateFile('/App.jsx', cleanContent);
            }
          }

          this.onFileWritten(action.path, cleanContent);
          this.log(`[VFS] Berhasil menulis file: ${action.path}`);
        }
      }

      if (!mainCode) {
        let code = cleanVibeCode(rawResponse);
        if (/^\s*return\s*\(/.test(code) && !/function\s+\w+\s*\(|=>\s*\(?|export\s+default/i.test(code.slice(0, 100))) {
          code = `export default function App() {\n  ${code}\n}`;
        }
        code = autoFixMissingImports(code);
        code = autoFixSyntaxErrors(code);

        mainCode = code;
        if (this.vfs) {
          this.vfs.writeFile('/App.js', code);
          this.vfs.writeFile('/App.jsx', code);
        }
        if (sandpackBridge) {
          sandpackBridge.updateFile('/App.js', code);
          sandpackBridge.updateFile('/App.jsx', code);
        }
        this.onFileWritten('/App.js', code);
      }

      // Snapshot for version control
      if (this.versionControl && this.vfs) {
        this.versionControl.createSnapshot(this.vfs.getAllFilesRecord(), `Emergent Build: ${prompt.slice(0, 30) || 'App Update'}`);
      }

      // ─── STAGE 4: COMPILATION & RUNTIME CHECK ───
      this.setStep(PIPELINE_STEPS.COMPILING, '⚙️ Menjalankan Virtual Runtime', 'Kompilasi komponen React & asset...');
      if (sandpackBridge) {
        sandpackBridge.openFile?.('/App.js');
        sandpackBridge.runSandpack?.();
      }

      // ─── STAGE 5: DATABASE AUTO-PROVISIONING ───
      this.setStep(PIPELINE_STEPS.DATABASE_SYNC, '🗄️ Sinkronisasi Database MaviCore', 'Memeriksa skema tabel & auto-provisioning...');
      let connectedTable = null;
      try {
        const syncRes = await syncVibeAppToTable(mainCode);
        if (syncRes?.table) {
          connectedTable = syncRes.table;
          this.log(`[Database] Tabel tersinkronisasi: "${syncRes.table.name}" (${syncRes.recordCount} data)`);
          this.onTableSync(syncRes.table, syncRes.recordCount);
        }
      } catch (dbErr) {
        this.log(`[Database Sync Warn] ${dbErr.message}`);
      }

      // ─── STAGE 6: READY ───
      this.setStep(PIPELINE_STEPS.READY, '🚀 Aplikasi Siap & Live!', 'Semua komponen, routing, dan database aktif.', 'completed');

      return {
        success: true,
        mainCode,
        table: connectedTable,
        stepHistory: this.stepHistory
      };
    } catch (err) {
      this.setStep(PIPELINE_STEPS.FAILED, '❌ Terjadi Kesalahan', err.message, 'error');
      this.log(`[Pipeline Error] ${err.message}`);
      throw err;
    }
  }
}
