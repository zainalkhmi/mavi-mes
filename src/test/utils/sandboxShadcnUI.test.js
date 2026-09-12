import { describe, it, expect } from 'vitest';
import {
  SHADCN_UI_VIRTUAL_FILES,
  SHADCN_UTILS_CODE,
  SHADCN_BUTTON_CODE,
  SHADCN_CARD_CODE,
  SHADCN_BADGE_CODE,
  SHADCN_INPUT_CODE,
  SHADCN_DIALOG_CODE,
  SHADCN_TABS_CODE,
  SHADCN_INDEX_CODE
} from '../../vibe/uikit/shadcnVirtualFiles';
import { cleanVibeCode } from '../../vibe/utils/codeCleaner';

describe('Sandbox shadcn/ui Virtual Files and Integration', () => {
  it('SHADCN_UI_VIRTUAL_FILES exports all required UI primitives and utils', () => {
    expect(SHADCN_UI_VIRTUAL_FILES).toBeDefined();

    // Utils
    expect(SHADCN_UI_VIRTUAL_FILES['/lib/utils.js']).toBe(SHADCN_UTILS_CODE);
    expect(SHADCN_UI_VIRTUAL_FILES['/src/lib/utils.js']).toBe(SHADCN_UTILS_CODE);
    expect(SHADCN_UTILS_CODE).toContain('export function cn(');

    // Button
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/button.jsx']).toBe(SHADCN_BUTTON_CODE);
    expect(SHADCN_BUTTON_CODE).toContain('const Button =');
    expect(SHADCN_BUTTON_CODE).toContain('export { Button, buttonVariants };');

    // Card
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/card.jsx']).toBe(SHADCN_CARD_CODE);
    expect(SHADCN_CARD_CODE).toContain('const Card =');
    expect(SHADCN_CARD_CODE).toContain('CardHeader');
    expect(SHADCN_CARD_CODE).toContain('CardTitle');
    expect(SHADCN_CARD_CODE).toContain('CardContent');

    // Badge
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/badge.jsx']).toBe(SHADCN_BADGE_CODE);
    expect(SHADCN_BADGE_CODE).toContain('function Badge(');
    expect(SHADCN_BADGE_CODE).toContain('export { Badge, badgeVariants };');

    // Input
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/input.jsx']).toBe(SHADCN_INPUT_CODE);
    expect(SHADCN_INPUT_CODE).toContain('const Input =');

    // Dialog
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/dialog.jsx']).toBe(SHADCN_DIALOG_CODE);
    expect(SHADCN_DIALOG_CODE).toContain('function Dialog(');
    expect(SHADCN_DIALOG_CODE).toContain('DialogContent');

    // Tabs
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/tabs.jsx']).toBe(SHADCN_TABS_CODE);
    expect(SHADCN_TABS_CODE).toContain('function Tabs(');
    expect(SHADCN_TABS_CODE).toContain('TabsList');
    expect(SHADCN_TABS_CODE).toContain('TabsTrigger');
    expect(SHADCN_TABS_CODE).toContain('TabsContent');

    // Index
    expect(SHADCN_UI_VIRTUAL_FILES['/components/ui/index.js']).toBe(SHADCN_INDEX_CODE);
  });

  it('cleanVibeCode preserves shadcn/ui imports and normalizes @/ to ./ for Sandpack', () => {
    const rawAppCode = `
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Factory, AlertCircle } from 'lucide-react';

export default function App() {
  const [name, setName] = useState('');
  return (
    <Card className={cn("p-6 m-4", "border-blue-500")}>
      <CardHeader>
        <CardTitle>Stasiun Produksi MES</CardTitle>
        <Badge variant="success">ACTIVE</Badge>
      </CardHeader>
      <CardContent>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Batch No..." />
        <Button variant="default">Simpan Log</Button>
      </CardContent>
    </Card>
  );
}
`;

    const cleaned = cleanVibeCode(rawAppCode);

    // Verify imports are normalized to ./ for Sandpack relative resolution
    expect(cleaned).toContain("from './components/ui/button'");
    expect(cleaned).toContain("from './components/ui/card'");
    expect(cleaned).toContain("from './components/ui/badge'");
    expect(cleaned).toContain("from './components/ui/input'");
    expect(cleaned).toContain("from './components/ui/dialog'");
    expect(cleaned).toContain("from './components/ui/tabs'");
    expect(cleaned).toContain("from './lib/utils'");

    // Verify specifiers were NOT stripped by reservedMavicoreNames
    expect(cleaned).toContain('Button');
    expect(cleaned).toContain('Card');
    expect(cleaned).toContain('Badge');
    expect(cleaned).toContain('Input');
    expect(cleaned).toContain('Dialog');
    expect(cleaned).toContain('Tabs');
    expect(cleaned).toContain('cn');
  });

  it('cleanVibeCode supports relative ./components/ui imports directly without alteration', () => {
    const rawAppCode = `
import React from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';

export default function App() {
  return (
    <Card>
      <CardContent>
        <Button>Submit</Button>
      </CardContent>
    </Card>
  );
}
`;

    const cleaned = cleanVibeCode(rawAppCode);
    expect(cleaned).toContain("import { Button } from './components/ui/button'");
    expect(cleaned).toContain("import { Card, CardContent } from './components/ui/card'");
  });

  it('ProjectFileSystem.getFileTree() handles SHADCN_UI_VIRTUAL_FILES without throwing', async () => {
    const { ProjectFileSystem } = await import('../../vibe/filesystem/ProjectFileSystem');
    const initialFiles = {
      '/App.js': 'export default function App() { return <div>Test</div>; }',
      ...SHADCN_UI_VIRTUAL_FILES
    };

    const vfs = new ProjectFileSystem(initialFiles);
    expect(() => vfs.getFileTree()).not.toThrow();

    const tree = vfs.getFileTree();
    expect(Array.isArray(tree)).toBe(true);

    const componentsNode = tree.find(node => node.name === 'components');
    expect(componentsNode).toBeDefined();
    expect(componentsNode.isDirectory).toBe(true);
    expect(Array.isArray(componentsNode.children)).toBe(true);

    const uiNode = componentsNode.children.find(node => node.name === 'ui');
    expect(uiNode).toBeDefined();
    expect(uiNode.isDirectory).toBe(true);
    expect(Array.isArray(uiNode.children)).toBe(true);
    expect(uiNode.children.some(child => child.name === 'button.jsx')).toBe(true);
  });
});
