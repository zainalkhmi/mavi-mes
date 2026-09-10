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
});
