import { describe, it, expect } from 'vitest';
import { appRegistryService } from '../../services/appRegistry/appRegistryService';
import { playwrightTestGenerator } from '../../services/testEngine/playwrightTestGenerator';
import { BrowserTestRunner } from '../../services/testEngine/browserTestRunner';
import { bugClassifier } from '../../services/testEngine/bugClassifier';
import { aiBugAnalyzer } from '../../services/testEngine/aiBugAnalyzer';
import { globalTestSafety } from '../../services/testEngine/testSafetyMock';

describe('MaviCore Auto App Registry Engine', () => {
  const mockProjectState = {
    currentAppId: 'app_cutting_qc',
    appName: 'Cutting Station Quality Control',
    appCategory: 'Quality Control',
    appMeta: { version: '1.2.0', description: 'Inspection app for cutting line' },
    steps: [
      {
        id: 'screen_1',
        title: 'Operator Login',
        cycleTimeSeconds: 30,
        components: [
          { id: 'heading_title', type: 'HEADING', props: { text: 'Cutting Line Station 3' } },
          { id: 'input_operator', type: 'INPUT_TEXT', props: { label: 'Operator Badge', targetVariable: 'operator_id' } },
          { id: 'btn_login', type: 'BUTTON', props: { text: 'Login Station', label: 'Login Station' } }
        ]
      },
      {
        id: 'screen_2',
        title: 'Dimension Check',
        cycleTimeSeconds: 120,
        components: [
          { id: 'input_width', type: 'INPUT_NUMBER', props: { label: 'Length mm', targetVariable: 'length_mm' } },
          { id: 'btn_confirm', type: 'BUTTON', props: { text: 'Confirm Inspection' } }
        ]
      }
    ],
    baseComponents: [
      { id: 'base_header', type: 'HEADING', props: { text: 'MAVI MES HEADER' } }
    ],
    appVariables: [
      { id: 'operator_id', name: 'operator_id', type: 'text', defaultValue: 'OP-001' },
      { id: 'length_mm', name: 'length_mm', type: 'number', defaultValue: 150.5, validation: { min: 100, max: 200 } }
    ],
    appTriggers: [
      {
        id: 'trig_save',
        name: 'On Inspection Save',
        widgetId: 'btn_confirm',
        actions: [{ type: 'inspection.submit', payload: {} }]
      }
    ],
    appFunctions: [],
    appTables: ['quality_checks']
  };

  it('generates all 13 machine-readable artifacts with correct structure', () => {
    const registry = appRegistryService.generateRegistry(mockProjectState);
    expect(registry).toBeDefined();

    const expectedArtifacts = [
      'app.json',
      'routes.json',
      'components.json',
      'variables.json',
      'data-bindings.json',
      'events.json',
      'triggers.json',
      'workflows.json',
      'tools.json',
      'test-cases.json',
      'selectors.json',
      'permissions.json',
      'test-contract.json'
    ];

    expectedArtifacts.forEach(artifact => {
      expect(registry[artifact]).toBeDefined();
    });

    // Verify app.json
    expect(registry['app.json'].appId).toBe('app_cutting_qc');
    expect(registry['app.json'].name).toBe('Cutting Station Quality Control');
    expect(registry['app.json'].routes.length).toBe(2);

    // Verify routes.json
    expect(registry['routes.json'].length).toBe(2);
    expect(registry['routes.json'][0].title).toBe('Operator Login');

    // Verify components.json & stable selectors
    expect(registry['components.json'].length).toBe(6); // 1 base + 3 screen1 + 2 screen2
    const opInput = registry['components.json'].find(c => c.originalId === 'input_operator');
    expect(opInput).toBeDefined();
    expect(opInput.selector.strategy).toBe('data-mavi-id');
    expect(opInput.dataBinding.variable).toBe('operator_id');

    // Verify test-contract.json
    expect(registry['test-contract.json'].appId).toBe('app_cutting_qc');
  });

  it('validates a healthy application registry without critical issues', () => {
    const report = appRegistryService.validateApp('app_cutting_qc', mockProjectState);
    expect(report.valid).toBe(true);
    expect(report.totalIssues).toBe(0);
  });

  it('detects broken data bindings when widget references missing variable', () => {
    const brokenState = {
      ...mockProjectState,
      steps: [
        {
          id: 'screen_1',
          title: 'Screen 1',
          components: [
            { id: 'bad_input', type: 'INPUT_TEXT', props: { targetVariable: 'non_existent_var' } }
          ]
        }
      ],
      appVariables: []
    };

    const report = appRegistryService.validateApp('broken_app', brokenState);
    expect(report.valid).toBe(false);
    const brokenBinding = report.issues.find(i => i.type === 'BROKEN_DATA_BINDING');
    expect(brokenBinding).toBeDefined();
    expect(brokenBinding.variable).toBe('non_existent_var');
  });

  it('calculates category health score accurately', () => {
    const registry = appRegistryService.generateRegistry(mockProjectState);
    const health = appRegistryService.calculateHealthScore(registry, {
      total: 10,
      passed: 9,
      failed: 1,
      categoryResults: {
        UI: { passed: 5, total: 5 },
        ROUTING: { passed: 4, total: 5 }
      }
    });

    expect(health.overall).toBe(90);
    expect(health.passed).toBe(9);
    expect(health.failed).toBe(1);
    expect(health.categories.UI).toBe(100);
    expect(health.categories.Routing).toBe(80);
  });

  it('exports registry as JSON and ZIP archive', async () => {
    const jsonString = appRegistryService.exportRegistryJson('app_cutting_qc', mockProjectState);
    expect(jsonString).toBeDefined();
    const parsed = JSON.parse(jsonString);
    expect(parsed['app.json']).toBeDefined();

    const zipBlob = await appRegistryService.exportRegistryZip('app_cutting_qc', mockProjectState);
    expect(zipBlob).toBeDefined();
    expect(zipBlob.size).toBeGreaterThan(0);
  });
});

describe('Playwright Test Suite Generator', () => {
  const mockProjectState = {
    currentAppId: 'app_cutting_qc',
    appName: 'Cutting Station Quality Control',
    steps: [
      {
        id: 'screen_1',
        title: 'Operator Login',
        components: [
          { id: 'btn_login', type: 'BUTTON', displayName: 'Login Station', props: { text: 'Login Station' } }
        ]
      }
    ],
    baseComponents: [],
    appVariables: [{ id: 'temp_c', name: 'temp_c', type: 'number' }],
    appTriggers: []
  };

  it('generates production Playwright spec targeting stable selectors', () => {
    const spec = playwrightTestGenerator.generateSpecCode(mockProjectState);
    expect(spec).toContain("import { test, expect } from '@playwright/test'");
    expect(spec).toContain("test.describe('Cutting Station Quality Control [App Registry Suite]'");
    expect(spec).toContain("Route Test: Screen \"Operator Login\"");
    expect(spec).toContain("Component Test: \"Login Station\"");
    expect(spec).toContain("data-mavi-id");
    expect(spec).toContain("E2E Flow: Full Execution Scenario");
  });
});

describe('In-Browser Test Runner', () => {
  it('filters test cases according to selected mode', () => {
    const mockRegistry = {
      'test-cases.json': [
        { id: 'tc1', category: 'ROUTING' },
        { id: 'tc2', category: 'COMPONENT' },
        { id: 'tc3', category: 'TRIGGER' },
        { id: 'tc4', category: 'DATA_BINDING' },
        { id: 'tc5', category: 'WORKFLOW' }
      ]
    };

    const runner = new BrowserTestRunner({ registry: mockRegistry });
    const quickCases = runner.filterTestCases(mockRegistry['test-cases.json'], 'Quick Test');
    expect(quickCases.length).toBe(2);
    expect(quickCases.map(c => c.id)).toEqual(['tc1', 'tc2']);

    const integrationCases = runner.filterTestCases(mockRegistry['test-cases.json'], 'Integration Test');
    expect(integrationCases.length).toBe(2);
    expect(integrationCases.map(c => c.id)).toEqual(['tc3', 'tc4']);
  });

  it('runs browser suite and handles user abortion cleanly', async () => {
    const mockRegistry = {
      'test-cases.json': [
        { id: 'tc1', name: 'Test 1', category: 'ROUTING', steps: [{ action: 'assertState' }] },
        { id: 'tc2', name: 'Test 2', category: 'ROUTING', steps: [{ action: 'assertState' }] }
      ]
    };

    const runner = new BrowserTestRunner({ registry: mockRegistry });
    // Abort before execution
    runner.abort();
    const results = await runner.runSuite('Quick Test');
    expect(runner.isAborted).toBe(true);
  });
});

describe('Bug Classifier & AI Bug Analyzer', () => {
  it('correctly classifies DATA_BINDING failures and targets', () => {
    const bug = bugClassifier.classify({
      errorMessage: 'Component widget_temp is bound to unbound variable temp_sensor',
      categoryHint: 'DATA_BINDING',
      target: 'widget_temp'
    });

    expect(bug.category).toBe('DATA_BINDING');
    expect(bug.severity).toBe('HIGH');
  });

  it('produces structured patch proposals for missing variables', () => {
    const bugTicket = {
      type: 'DATA_BINDING',
      component: 'speed_gauge',
      message: 'Widget speed_gauge does not have registered variable'
    };

    const registry = {
      'components.json': [{ instanceId: 'speed_gauge' }],
      'data-bindings.json': [{ component: 'speed_gauge', variable: 'machine_speed' }],
      'variables.json': []
    };

    const analysis = aiBugAnalyzer.analyzeBug(bugTicket, registry);
    expect(analysis.rootCause).toContain('machine_speed');
    expect(analysis.suggestedFix).toBeDefined();
    expect(analysis.suggestedFix.actionType).toBe('CREATE_VARIABLE');
    expect(analysis.suggestedFix.patch.name).toBe('machine_speed');
  });
});

describe('Test Safety Mock Sandbox', () => {
  it('identifies dangerous operations and intercepts them', async () => {
    expect(globalTestSafety.isDangerous('machine.start')).toBe(true);
    expect(globalTestSafety.isDangerous('plc.writeTag')).toBe(true);
    expect(globalTestSafety.isDangerous('database.delete')).toBe(true);
    expect(globalTestSafety.isDangerous('machine.getStatus')).toBe(false);

    const result = await globalTestSafety.intercept('machine.start', { lineId: 'LINE-01' });
    expect(result.status).toBe('MOCKED_SUCCESS');
    expect(result.simulated).toBe(true);
    expect(globalTestSafety.getAuditLog().length).toBeGreaterThan(0);
  });
});
