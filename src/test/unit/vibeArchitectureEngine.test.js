import { describe, it, expect } from 'vitest';
import { ProjectFileSystem } from '../../vibe/filesystem/ProjectFileSystem';
import { ProjectVersionControl } from '../../vibe/filesystem/ProjectVersionControl';
import { AgenticPromptEngine } from '../../vibe/ai/AgenticPromptEngine';
import { RuntimeManager } from '../../vibe/runtime/RuntimeManager';
import { MANUFACTURING_TEMPLATES } from '../../vibe/templates/manufacturingTemplates';

describe('MaviCore Vibe Coding Engine Architecture', () => {
  describe('ProjectFileSystem', () => {
    it('initializes and manages virtual files and directories correctly', () => {
      const vfs = new ProjectFileSystem({
        '/App.jsx': 'export default function App() {}',
        '/components/Header.jsx': 'export function Header() {}',
        '/package.json': JSON.stringify({ name: 'test-app', dependencies: { react: '19.0.0' } })
      });

      expect(vfs.exists('/App.jsx')).toBe(true);
      expect(vfs.exists('/components/Header.jsx')).toBe(true);
      expect(vfs.readFile('/App.jsx')).toContain('export default function App');

      // Write new file
      vfs.writeFile('/components/Footer.jsx', 'export function Footer() {}');
      expect(vfs.exists('/components/Footer.jsx')).toBe(true);

      // File Tree
      const tree = vfs.getFileTree();
      expect(tree.length).toBeGreaterThan(0);
      const componentsDir = tree.find(item => item.name === 'components');
      expect(componentsDir).toBeDefined();
      expect(componentsDir.isDirectory).toBe(true);
      expect(componentsDir.children.length).toBe(2);

      // Delete file
      vfs.deleteFile('/components/Footer.jsx');
      expect(vfs.exists('/components/Footer.jsx')).toBe(false);

      // Package.json dependencies update
      vfs.updateDependencies({ 'lucide-react': 'latest' });
      const pkg = vfs.getPackageJson();
      expect(pkg.dependencies['lucide-react']).toBe('latest');
    });
  });

  describe('ProjectVersionControl', () => {
    it('creates snapshots, supports undo, redo, and computes diffs', () => {
      const vc = new ProjectVersionControl();
      const state1 = { '/App.jsx': 'console.log(1);' };
      const state2 = { '/App.jsx': 'console.log(2);', '/Inspection.jsx': 'export default 1;' };

      vc.createSnapshot(state1, 'Initial');
      vc.createSnapshot(state2, 'Added inspection');

      expect(vc.canUndo()).toBe(true);
      const diff = ProjectVersionControl.computeDiff(state1, state2);
      expect(diff.length).toBe(2);
      expect(diff.find(d => d.path === '/Inspection.jsx').type).toBe('created');
      expect(diff.find(d => d.path === '/App.jsx').type).toBe('modified');

      // Undo
      const restored = vc.undo();
      expect(restored.files['/App.jsx']).toBe('console.log(1);');
      expect(restored.files['/Inspection.jsx']).toBeUndefined();

      // Redo
      const redone = vc.redo();
      expect(redone.files['/Inspection.jsx']).toBe('export default 1;');
    });
  });

  describe('AgenticPromptEngine', () => {
    it('parses plans, file actions, and single-file fallback', () => {
      const responseText = `
<ai_plan>
1. Buat kartu inspeksi
2. Update App.jsx
</ai_plan>

<file_action path="/components/InspectionCard.jsx" action="create">
export function InspectionCard() { return <div>OK</div>; }
</file_action>

<file_action path="/App.jsx" action="modify">
export default function App() { return <div>App</div>; }
</file_action>
`;

      const parsed = AgenticPromptEngine.parseResponse(responseText);
      expect(parsed.plan).toContain('Buat kartu inspeksi');
      expect(parsed.fileActions.length).toBe(2);
      expect(parsed.fileActions[0].path).toBe('/components/InspectionCard.jsx');
      expect(parsed.fileActions[0].action).toBe('create');
      expect(parsed.fileActions[1].path).toBe('/App.jsx');

      // Backward compatibility with <vibe_code>
      const legacyResponse = `
Penjelasan singkat.
<vibe_code>
export default function Legacy() { return <h1>Legacy</h1>; }
</vibe_code>
`;
      const legacyParsed = AgenticPromptEngine.parseResponse(legacyResponse);
      expect(legacyParsed.fileActions.length).toBe(1);
      expect(legacyParsed.fileActions[0].path).toBe('/App.jsx');
      expect(legacyParsed.fileActions[0].content).toContain('export default function Legacy');
    });
  });

  describe('RuntimeManager', () => {
    it('initializes Sandpack engine and handles file operations', async () => {
      const rm = new RuntimeManager('sandpack');
      expect(rm.activeType).toBe('sandpack');

      await rm.mountProject({ '/App.js': 'export default function App() {}' });
      const logs = rm.getLogs();
      expect(logs.length).toBeGreaterThan(0);

      await rm.writeFile('/App.js', 'export default function Updated() {}');
      const content = await rm.readFile('/App.js');
      expect(content).toContain('Updated');
    });
  });

  describe('Manufacturing Templates', () => {
    it('contains all 11 required manufacturing templates', () => {
      expect(MANUFACTURING_TEMPLATES.length).toBe(11);
      const ids = MANUFACTURING_TEMPLATES.map(t => t.id);
      expect(ids).toContain('digital_checksheet');
      expect(ids).toContain('digital_inspection');
      expect(ids).toContain('quality_inspection');
      expect(ids).toContain('oee_dashboard');
      expect(ids).toContain('production_monitoring');
      expect(ids).toContain('inventory_stock');
      expect(ids).toContain('kanban_board');
      expect(ids).toContain('preventive_maintenance');
      expect(ids).toContain('digital_sop');
      expect(ids).toContain('approval_workflow');
      expect(ids).toContain('manufacturing_dashboard');
    });
  });
});
