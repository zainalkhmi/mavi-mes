import { describe, it, expect } from 'vitest';
import { MAVICORE_UI_VIRTUAL_FILE } from '../../vibe/sdk/mavicoreUI';
import { autoFixMissingImports } from '../../vibe/utils/codeCleaner';

describe('MaviCore UI Industrial Virtual Component Library', () => {
  it('MAVICORE_UI_VIRTUAL_FILE exports all App Builder widgets', () => {
    expect(MAVICORE_UI_VIRTUAL_FILE).toBeDefined();

    // 1. Touchscreen & Interface
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function Numpad(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function KeyboardPro(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function SignaturePad(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function BooleanToggle(');

    // 2. Quality & Inspection
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function QualityTolerance(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function QualityChecklist(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function BarcodeScanner(');

    // 3. Metrology & Gauges
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function DialGauge(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function DigitalCaliper(');

    // 4. SCADA HMI
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function ScadaStartBtn(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function ScadaStopBtn(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function ScadaTank(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function ScadaPlcStatus(');

    // 5. MES Metrics & OEE
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function KPICard(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function ScadaProdCounter(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function StatusBadge(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function TelemetryGauge(');

    // 6. Backward-compatibility aliases
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export const MaviButton = ScadaStartBtn;');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export const MaviCard = KPICard;');
  });

  it('autoFixMissingImports auto-injects ./mavicore-ui when a component is used without import', () => {
    const codeWithoutImport = `
      export default function App() {
        return (
          <div>
            <Numpad onEnter={(v) => console.log(v)} />
          </div>
        );
      }
    `;

    const fixed = autoFixMissingImports(codeWithoutImport, 'ReferenceError: Numpad is not defined');
    expect(fixed).toContain("import { Numpad } from './mavicore-ui';");
  });

  it('cleanVibeCode auto-injects ./mavicore-ui import when MaviCore components are in JSX', async () => {
    const { cleanVibeCode } = await import('../../vibe/utils/codeCleaner');
    const jsxWithoutImport = `
      export default function App() {
        return (
          <div>
            <KPICard title="OEE" value="95%" />
            <StatusBadge status="OPTIMAL" />
          </div>
        );
      }
    `;
    const cleaned = cleanVibeCode(jsxWithoutImport);
    expect(cleaned).toContain("from './mavicore-ui';");
    expect(cleaned).toContain('KPICard');
    expect(cleaned).toContain('StatusBadge');
  });

  it('proStarterCodes all import and use ./mavicore-ui components', async () => {
    const { PRO_OEE_DASHBOARD_CODE, PRO_KANBAN_BOARD_CODE, PRO_CHECK_SHEET_CODE } = await import('../../vibe/templates/proStarterCodes');
    
    // OEE Dashboard
    expect(PRO_OEE_DASHBOARD_CODE).toContain("from './mavicore-ui'");
    expect(PRO_OEE_DASHBOARD_CODE).toContain('<KPICard');
    expect(PRO_OEE_DASHBOARD_CODE).toContain('<ScadaProdCounter');
    expect(PRO_OEE_DASHBOARD_CODE).toContain('<TelemetryGauge');
    expect(PRO_OEE_DASHBOARD_CODE).toContain('<StatusBadge');

    // Kanban Board
    expect(PRO_KANBAN_BOARD_CODE).toContain("from './mavicore-ui'");
    expect(PRO_KANBAN_BOARD_CODE).toContain('<KPICard');
    expect(PRO_KANBAN_BOARD_CODE).toContain('<StatusBadge');
    expect(PRO_KANBAN_BOARD_CODE).toContain('<Numpad');

    // Check Sheet
    expect(PRO_CHECK_SHEET_CODE).toContain("from './mavicore-ui'");
    expect(PRO_CHECK_SHEET_CODE).toContain('<KPICard');
    expect(PRO_CHECK_SHEET_CODE).toContain('<StatusBadge');
    expect(PRO_CHECK_SHEET_CODE).toContain('<SignaturePad');
  });

  it('cleanVibeCode intelligently merges missing MaviCore UI components into existing import', async () => {
    const { cleanVibeCode } = await import('../../vibe/utils/codeCleaner');
    const codeWithPartialImport = `
      import { KPICard } from './mavicore-ui';
      export function App() {
        return (
          <div>
            <KPICard title="Output" value="1200" />
            <StatusBadge status="RUNNING" />
            <ScadaProdCounter target={1000} actual={850} />
          </div>
        );
      }
    `;
    const cleaned = cleanVibeCode(codeWithPartialImport);
    expect(cleaned).toContain("from './mavicore-ui'");
    expect(cleaned).toContain('StatusBadge');
    expect(cleaned).toContain('ScadaProdCounter');
    expect(cleaned).toContain('export default App;');
  });

  it('cleanVibeCode merges missing Lucide icons into existing lucide-react import', async () => {
    const { cleanVibeCode } = await import('../../vibe/utils/codeCleaner');
    const codeWithMissingIcons = `
      import { Activity } from 'lucide-react';
      export default function App() {
        return (
          <div>
            <Activity />
            <Gauge size={20} />
            <Clock size={16} />
            <Sparkles size={16} />
          </div>
        );
      }
    `;
    const cleaned = cleanVibeCode(codeWithMissingIcons);
    expect(cleaned).toContain('Gauge');
    expect(cleaned).toContain('Clock');
    expect(cleaned).toContain('Sparkles');
  });

  it('autoFixMissingImports heals "Element type is invalid ... but got: undefined" runtime error', async () => {
    const codeWithUndefinedComponent = `
      import { KPICard } from './mavicore-ui';
      export function App() {
        return (
          <div>
            <KPICard title="OEE" value="98%" />
            <StatusBadge status="OPTIMAL" />
          </div>
        );
      }
    `;
    const errorMsg = 'Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: undefined. You likely forgot to export your component from the file its defined in, or you might have mixed up default and named imports. Check the render method of App.';
    const healed = autoFixMissingImports(codeWithUndefinedComponent, errorMsg);
    expect(healed).toBeDefined();
    expect(healed).toContain('StatusBadge');
    expect(healed).toContain("from './mavicore-ui'");
    expect(healed).toContain('export default App;');
  });

  it('MAVICORE_UI_VIRTUAL_FILE exports universal UI primitives Card, Button, Badge, Modal, and Lucide icons', () => {
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function Card(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function Button(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function Badge(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export function Modal(');
    expect(MAVICORE_UI_VIRTUAL_FILE).toContain('export { \n  Play, Square, RotateCcw');
  });
});
