import { describe, it, expect } from 'vitest';
import {
  BUILDER_TYPES,
  BUILDER_METADATA,
  getAppBuilderType,
  getBuilderInfo,
  canBuilderOpenApp,
  checkBuilderCompatibility
} from '../../utils/builderType';

describe('Builder Type Utility & Isolation Rules', () => {
  describe('getAppBuilderType detection', () => {
    it('detects explicit builder_type correctly', () => {
      expect(getAppBuilderType({ builder_type: 'app_builder' })).toBe(BUILDER_TYPES.MAVI);
      expect(getAppBuilderType({ builder_type: 'gluestack' })).toBe(BUILDER_TYPES.GLUESTACK);
      expect(getAppBuilderType({ builder_type: 'sandbox' })).toBe(BUILDER_TYPES.SANDBOX);
    });

    it('handles alternative alias casings for builder_type', () => {
      expect(getAppBuilderType({ builder_type: 'GLUESTACK' })).toBe(BUILDER_TYPES.GLUESTACK);
      expect(getAppBuilderType({ builder_type: 'mavi_builder' })).toBe(BUILDER_TYPES.MAVI);
      expect(getAppBuilderType({ builder_type: 'vibe_sandpack' })).toBe(BUILDER_TYPES.SANDBOX);
    });

    it('detects legacy sandbox apps without builder_type', () => {
      const sandboxApp1 = {
        name: 'Live HMI Generator',
        config: { appType: 'vibe_sandpack', vibeCode: 'export default function App() {}' }
      };
      expect(getAppBuilderType(sandboxApp1)).toBe(BUILDER_TYPES.SANDBOX);

      const sandboxApp2 = {
        name: 'Vibe Press Monitor',
        description: 'Aplikasi HMI/Frontline dibuat dengan Sandpack Vibe Engine. Terhubung ke tabel: Test',
        config: {}
      };
      expect(getAppBuilderType(sandboxApp2)).toBe(BUILDER_TYPES.SANDBOX);
    });

    it('detects legacy gluestack apps without builder_type', () => {
      const gluestackApp1 = {
        name: 'Warehouse Mobile Scanner',
        category: 'GlueStack App',
        config: { components: [{ id: 'screen_1' }] }
      };
      expect(getAppBuilderType(gluestackApp1)).toBe(BUILDER_TYPES.GLUESTACK);

      const gluestackApp2 = {
        name: 'Gluestack Inspection App',
        config: { components: [{ id: 'screen_1' }] }
      };
      expect(getAppBuilderType(gluestackApp2)).toBe(BUILDER_TYPES.GLUESTACK);
    });

    it('defaults standard apps to Mavi Builder (app_builder)', () => {
      const standardMaviApp = {
        name: 'Assembly Checksheet PC',
        category: 'Shop Floor',
        config: {
          steps: [{ id: 'step_1', components: [] }]
        }
      };
      expect(getAppBuilderType(standardMaviApp)).toBe(BUILDER_TYPES.MAVI);
      expect(getAppBuilderType(null)).toBe(BUILDER_TYPES.MAVI);
    });
  });

  describe('Builder Isolation (cannot be opened by one another)', () => {
    const maviApp = { id: 'app-mavi-1', name: 'Workstation PC App', builder_type: 'app_builder' };
    const gluestackApp = { id: 'app-glue-1', name: 'Mobile Tablet App', builder_type: 'gluestack' };
    const sandboxApp = { id: 'app-sand-1', name: 'AI HMI Code Sandbox', builder_type: 'sandbox' };

    it('prevents Mavi Builder from opening Gluestack and Sandbox apps', () => {
      expect(canBuilderOpenApp(BUILDER_TYPES.MAVI, maviApp)).toBe(true);
      expect(canBuilderOpenApp(BUILDER_TYPES.MAVI, gluestackApp)).toBe(false);
      expect(canBuilderOpenApp(BUILDER_TYPES.MAVI, sandboxApp)).toBe(false);

      const checkGluestack = checkBuilderCompatibility(BUILDER_TYPES.MAVI, gluestackApp);
      expect(checkGluestack.allowed).toBe(false);
      expect(checkGluestack.message).toContain('Gluestack');
      expect(checkGluestack.recommendedUrl).toContain('/#/ui-engine?appId=app-glue-1');

      const checkSandbox = checkBuilderCompatibility(BUILDER_TYPES.MAVI, sandboxApp);
      expect(checkSandbox.allowed).toBe(false);
      expect(checkSandbox.message).toContain('Sandbox');
      expect(checkSandbox.recommendedUrl).toContain('/#/sandbox?appId=app-sand-1');
    });

    it('prevents Gluestack Builder from opening Mavi Builder and Sandbox apps', () => {
      expect(canBuilderOpenApp(BUILDER_TYPES.GLUESTACK, gluestackApp)).toBe(true);
      expect(canBuilderOpenApp(BUILDER_TYPES.GLUESTACK, maviApp)).toBe(false);
      expect(canBuilderOpenApp(BUILDER_TYPES.GLUESTACK, sandboxApp)).toBe(false);

      const checkMavi = checkBuilderCompatibility(BUILDER_TYPES.GLUESTACK, maviApp);
      expect(checkMavi.allowed).toBe(false);
      expect(checkMavi.message).toContain('Mavi Builder');
      expect(checkMavi.recommendedUrl).toContain('/#/builder?appId=app-mavi-1');
    });

    it('prevents Sandbox Builder from opening Mavi Builder and Gluestack apps', () => {
      expect(canBuilderOpenApp(BUILDER_TYPES.SANDBOX, sandboxApp)).toBe(true);
      expect(canBuilderOpenApp(BUILDER_TYPES.SANDBOX, maviApp)).toBe(false);
      expect(canBuilderOpenApp(BUILDER_TYPES.SANDBOX, gluestackApp)).toBe(false);

      const checkMavi = checkBuilderCompatibility(BUILDER_TYPES.SANDBOX, maviApp);
      expect(checkMavi.allowed).toBe(false);
      expect(checkMavi.recommendedUrl).toContain('/#/builder?appId=app-mavi-1');
    });
  });

  describe('Builder Metadata and Edit URLs', () => {
    it('provides correct metadata for each builder', () => {
      const maviInfo = getBuilderInfo(BUILDER_TYPES.MAVI);
      expect(maviInfo.label).toBe('Mavi Builder');
      expect(maviInfo.badge).toBe('PC / Desktop');
      expect(maviInfo.getEditUrl('123')).toBe('/#/builder?appId=123');

      const gluestackInfo = getBuilderInfo(BUILDER_TYPES.GLUESTACK);
      expect(gluestackInfo.label).toBe('Gluestack');
      expect(gluestackInfo.badge).toBe('Mobile / Tablet');
      expect(gluestackInfo.getEditUrl('456')).toBe('/#/ui-engine?appId=456');

      const sandboxInfo = getBuilderInfo(BUILDER_TYPES.SANDBOX);
      expect(sandboxInfo.label).toBe('Sandbox');
      expect(sandboxInfo.badge).toBe('Generatif AI');
      expect(sandboxInfo.getEditUrl('789')).toBe('/#/sandbox?appId=789');
    });
  });
});
