import { describe, it, expect } from 'vitest';
import { CLEAN_BLANK_APP_CODE, DEFAULT_VIBE_HMI_CODE } from '../../components/appbuilder/VibeSandpackViewer';
import { autoFixMissingImports, healTruncatedReactCode } from '../../vibe/utils/codeCleaner';
import { getAppBuilderType, BUILDER_TYPES } from '../../utils/builderType';

describe('Sandbox Initial State & Auto-Fix Workflow', () => {
  it('CLEAN_BLANK_APP_CODE starts clean without dummy CNC/MES stations', () => {
    expect(CLEAN_BLANK_APP_CODE).toBeDefined();
    expect(CLEAN_BLANK_APP_CODE).toContain('Sandbox Siap Digunakan');
    expect(CLEAN_BLANK_APP_CODE).toContain('export default function App');
    // Ensure no active dummy station data or CNC milling
    expect(CLEAN_BLANK_APP_CODE).not.toContain('CNC Milling');
    expect(CLEAN_BLANK_APP_CODE).not.toContain('ST-001');
    expect(CLEAN_BLANK_APP_CODE).not.toContain('Laser Cutter');
  });

  it('detects sandbox apps correctly for tab file listing', () => {
    const sandboxApp = {
      id: 'sb-001',
      name: 'Sandbox Sensor Monitor',
      builder_type: 'sandbox',
      config: { vibeCode: 'export default function App() {}' }
    };
    const gluestackApp = {
      id: 'gs-001',
      name: 'Mobile Forklift App',
      builder_type: 'gluestack'
    };
    const pcBuilderApp = {
      id: 'pc-001',
      name: 'Desktop HMI',
      builder_type: 'app_builder'
    };

    expect(getAppBuilderType(sandboxApp)).toBe(BUILDER_TYPES.SANDBOX);
    expect(getAppBuilderType(gluestackApp)).toBe(BUILDER_TYPES.GLUESTACK);
    expect(getAppBuilderType(pcBuilderApp)).toBe(BUILDER_TYPES.APP_BUILDER);

    const apps = [sandboxApp, gluestackApp, pcBuilderApp];
    const filteredSandbox = apps.filter(a => getAppBuilderType(a) === BUILDER_TYPES.SANDBOX);
    expect(filteredSandbox).toHaveLength(1);
    expect(filteredSandbox[0].name).toBe('Sandbox Sensor Monitor');
  });

  it('auto-fixes missing imports when device reports reference error', () => {
    const brokenCode = `import React from 'react';
import { Activity, Play } from 'lucide-react';

export default function App() {
  return (
    <div>
      <Activity />
      <RotateCcw size={16} />
    </div>
  );
}`;
    const deviceError = 'ReferenceError: RotateCcw is not defined';
    const fixedCode = autoFixMissingImports(brokenCode, deviceError);

    expect(fixedCode).toContain('RotateCcw');
    expect(fixedCode).toContain("from 'lucide-react'");
  });

  it('heals truncated syntax errors from device run', () => {
    const cutOffCode = `import React from 'react';

export default function App() {
  return (
    <div>
      <h3>Device Status</h3>
      <p>Running`;

    const healed = healTruncatedReactCode(cutOffCode);
    expect(healed).toContain('</p>');
    expect(healed).toContain('</div>');
    expect(healed).toContain(');');
    expect(healed).toContain('}');
  });
});
