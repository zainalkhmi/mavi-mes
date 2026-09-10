import { test, expect } from '@playwright/test';
import {
  DyadCAGResolver,
  DyadPatchEngine,
  DyadDiagnosticBridge,
  DyadReadSchema,
  DyadSearchReplaceSchema,
  DyadWriteSchema
} from '../../src/vibe/ai/DyadEngine.js';

test.describe('MAVI MES - Dyad Engine (CAG & Atomic Patching)', () => {
  test('Dyad CAG Resolver resolves relevant files on-demand', () => {
    const projectFiles = [
      'src/App.jsx',
      'src/components/Login.jsx',
      'src/components/appbuilder/VibeSandpackViewer.jsx',
      'src/ui-engine/preview/GluestackAppPlayer.jsx',
      'src/components/AgentManager.jsx'
    ];

    // Case 1: Gluestack prompt
    const gluestackFiles = DyadCAGResolver.resolveRelevantFiles('Tolong tambahkan badge di gluestack mobile player', projectFiles);
    expect(gluestackFiles.some(f => f.includes('GluestackAppPlayer'))).toBeTruthy();

    // Case 2: Auth prompt
    const authFiles = DyadCAGResolver.resolveRelevantFiles('Perbaiki validasi password di login auth', projectFiles);
    expect(authFiles.some(f => f.includes('Login'))).toBeTruthy();

    // Case 3: Sandbox prompt
    const sandboxFiles = DyadCAGResolver.resolveRelevantFiles('Buka sandbox runner live preview', projectFiles);
    expect(sandboxFiles.some(f => f.includes('Sandpack'))).toBeTruthy();
  });

  test('Dyad Patch Engine applies atomic search-replace accurately', () => {
    const originalCode = `
function Header() {
  return (
    <div className="header">
      <h1>Mavi MES Old Title</h1>
    </div>
  );
}
`;

    const searchChunk = '<h1>Mavi MES Old Title</h1>';
    const replaceChunk = '<h1>Mavi MES Powered by Dyad Copilot</h1>';

    const result = DyadPatchEngine.applySearchReplace(originalCode, searchChunk, replaceChunk);
    expect(result.success).toBe(true);
    expect(result.code).toContain('Mavi MES Powered by Dyad Copilot');
    expect(result.code).not.toContain('Old Title');
  });

  test('Dyad Diagnostic Bridge identifies Playwright strict mode errors', () => {
    const sampleError = {
      rawLog: "Error: strict mode violation: locator('button').or(locator('span')) resolved to 2 elements",
      affectedFiles: ['tests/e2e/gluestack.spec.js']
    };

    const diagnosis = DyadDiagnosticBridge.diagnosePlaywrightFailure(sampleError);
    expect(diagnosis.errorType).toBe('STRICT_MODE_VIOLATION');
    expect(diagnosis.isSelfHealable).toBe(true);
    expect(diagnosis.suggestion).toContain('.first()');
  });

  test('Dyad Zod tool schemas validate correctly', () => {
    const validRead = DyadReadSchema.safeParse({ path: 'src/App.jsx' });
    expect(validRead.success).toBe(true);

    const validSearchReplace = DyadSearchReplaceSchema.safeParse({
      path: 'src/App.jsx',
      search: 'old',
      replace: 'new'
    });
    expect(validSearchReplace.success).toBe(true);

    const validWrite = DyadWriteSchema.safeParse({
      path: 'src/NewComponent.jsx',
      content: 'export default () => null;'
    });
    expect(validWrite.success).toBe(true);
  });
});
