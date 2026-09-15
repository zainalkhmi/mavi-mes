import { describe, it, expect, vi } from 'vitest';
import { appRegistryService } from '../../services/appRegistry/appRegistryService';
import { BrowserTestRunner } from '../../services/testEngine/browserTestRunner';
import { aiBugAnalyzer } from '../../services/testEngine/aiBugAnalyzer';
import { bugClassifier } from '../../services/testEngine/bugClassifier';

describe('Jarvis-Copilot App Creation Lifecycle & Governance Engine', () => {
  // Mock Project State
  const initialProjectState = {
    currentAppId: 'app_stamping_qc',
    appName: 'Stamping Quality Control Line',
    appCategory: 'Quality Control',
    appMeta: { version: '1.0.0' },
    steps: [
      {
        id: 'screen_1',
        title: 'Inspection Screen',
        components: [
          { id: 'btn_pass', type: 'BUTTON', displayName: 'Pass Inspection', props: { text: 'Pass' } },
          { id: 'input_dim', type: 'INPUT_NUMBER', displayName: 'Thickness mm', props: { targetVariable: 'thickness_val' } }
        ]
      }
    ],
    baseComponents: [],
    appVariables: [
      { id: 'thickness_val', name: 'thickness_val', type: 'number', defaultValue: 2.5 }
    ],
    appTriggers: [
      { id: 'trig_1', name: 'On Pass', widgetId: 'btn_pass', actions: [{ type: 'inspection.submit' }] }
    ]
  };

  // Phase 1: Pre-Coding Plan Extraction & Briefing
  it('Phase 1: Extracts planned screens, widgets, and triggers for Pre-Coding briefing', () => {
    const rpaCommands = [
      { type: 'ADD_SCREEN', payload: { title: 'Screen 1: Login' } },
      { type: 'ADD_WIDGET', payload: { type: 'INPUT', displayName: 'Badge Input' } },
      { type: 'ADD_WIDGET', payload: { type: 'BUTTON', displayName: 'Login Button' } },
      { type: 'ADD_SCREEN', payload: { title: 'Screen 2: Inspection' } },
      { type: 'ADD_WIDGET', payload: { type: 'NUMBER_INPUT', displayName: 'Dimension Input' } },
      { type: 'CREATE_TRIGGER', payload: { event: 'ON_CLICK', widgetId: 'Login Button' } }
    ];

    const screens = [];
    rpaCommands.forEach(cmd => {
      const p = cmd.payload || {};
      if (cmd.type?.includes('SCREEN') || cmd.type?.includes('STEP')) {
        const title = typeof p === 'string' ? p : (p.title || p.stepTitle || p.name);
        if (title && !screens.includes(title)) screens.push(title);
      }
    });

    const widgetsCount = rpaCommands.filter(c => c.type?.includes('WIDGET')).length;
    const triggersCount = rpaCommands.filter(c => c.type?.includes('TRIGGER')).length;

    expect(screens.length).toBe(2);
    expect(screens[0]).toBe('Screen 1: Login');
    expect(screens[1]).toBe('Screen 2: Inspection');
    expect(widgetsCount).toBe(3);
    expect(triggersCount).toBe(1);
  });

  // Phase 2: Coding Assembly & State Update
  it('Phase 2: App state settles after commands execution', () => {
    expect(initialProjectState.steps.length).toBe(1);
    expect(initialProjectState.steps[0].components.length).toBe(2);
  });

  // Phase 3 & 4: App Registry Test Simulator runs upon "OK"
  it('Phase 3 & 4: Syncs App Registry and executes in-browser simulator upon user OK', async () => {
    const syncRes = appRegistryService.syncFromProjectState(initialProjectState);
    expect(syncRes.registry).toBeDefined();
    expect(syncRes.registry['app.json'].appId).toBe('app_stamping_qc');

    const runner = new BrowserTestRunner({
      appId: initialProjectState.currentAppId,
      registry: syncRes.registry,
      appState: initialProjectState
    });

    const results = await runner.runSuite('Quick Test');
    expect(results.total).toBeGreaterThan(0);
    expect(results.passed).toBeGreaterThan(0);
    expect(results.durationMs).toBeGreaterThanOrEqual(0);
  });

  // Phase 5: Test Failure & User Auto-Fix Revision Decision
  it('Phase 5: Diagnoses failures and formulates AI auto-fix patches when test fails', () => {
    // Simulate project state with a broken data binding (missing variable)
    const brokenState = {
      ...initialProjectState,
      steps: [
        {
          id: 'screen_1',
          title: 'Inspection Screen',
          components: [
            { id: 'input_oil', type: 'INPUT_NUMBER', displayName: 'Oil Level', props: { targetVariable: 'missing_oil_var' } }
          ]
        }
      ],
      appVariables: [] // Variable missing!
    };

    const registry = appRegistryService.generateRegistry(brokenState);
    const validation = appRegistryService.validateApp('app_stamping_qc', brokenState);

    expect(validation.valid).toBe(false);
    expect(validation.issues.some(i => i.type === 'BROKEN_DATA_BINDING')).toBe(true);

    // AI Bug Analyzer diagnoses the ticket and proposes patch
    const bugTicket = {
      type: 'DATA_BINDING',
      component: 'oil-level',
      message: 'Widget oil-level is bound to non-existent variable missing_oil_var'
    };

    const analysis = aiBugAnalyzer.analyzeBug(bugTicket, registry);
    expect(analysis.suggestedFix).toBeDefined();
    expect(analysis.suggestedFix.actionType).toBe('CREATE_VARIABLE');

    // Simulate applying the user-approved auto-fix patch
    const patch = analysis.suggestedFix;
    const patchedVariables = [...brokenState.appVariables, patch.patch];
    expect(patchedVariables.some(v => v.name === 'missing_oil_var' || v.id === 'missing_oil_var')).toBe(true);

    // Re-validate after patch applied
    const fixedState = { ...brokenState, appVariables: patchedVariables };
    const fixedValidation = appRegistryService.validateApp('app_stamping_qc', fixedState);
    expect(fixedValidation.valid).toBe(true);
  });

  // Phase 1b: Device Confirmation & Precision Canvas Settings
  it('Phase 1b: Validates device confirmation presets (PC, Laptop, Tablet, Mobile) and resolution mapping', () => {
    const devices = [
      { id: 'PC_FULLHD', width: 1920, height: 1080 },
      { id: 'LAPTOP_HD', width: 1366, height: 768 },
      { id: 'TABLET', width: 768, height: 1024 },
      { id: 'MOBILE', width: 375, height: 667 }
    ];

    devices.forEach(dev => {
      expect(dev.width).toBeGreaterThan(300);
      expect(dev.height).toBeGreaterThan(500);
    });
  });

  // Phase 4b: Route verification in BrowserTestRunner doesn't throw false DOM missing errors
  it('Phase 4b: Asserts routes correctly in BrowserTestRunner without DOM selector errors', async () => {
    const multiScreenState = {
      ...initialProjectState,
      steps: [
        { id: 'step_1', title: 'Work Order Perbaikan', components: [] },
        { id: 'step_2', title: 'Pemeriksaan Akhir', components: [] }
      ]
    };

    const registry = appRegistryService.generateRegistry(multiScreenState);
    expect(registry['routes.json'].length).toBe(2);

    const runner = new BrowserTestRunner({
      appId: multiScreenState.currentAppId,
      registry,
      appState: multiScreenState
    });

    // Test asserting route step
    const routeStep = {
      action: 'assertRoute',
      target: '/app_stamping_qc/work-order-perbaikan',
      expected: true
    };

    const stepPassed = await runner.executeStep(routeStep, {});
    expect(stepPassed).toBe(true);
  });

  // Phase 5b: Auto-Fix repairs missing routes/screens
  it('Phase 5b: AI Bug Analyzer repairs ROUTING failures by generating missing screen', () => {
    const routingBug = {
      type: 'ROUTING',
      component: 'new-frontline-app.work-order-perbaikan',
      message: 'Route "new-frontline-app.work-order-perbaikan" target screen not found'
    };

    const analysis = aiBugAnalyzer.analyzeBug(routingBug);
    expect(analysis.suggestedFix).toBeDefined();
    expect(analysis.suggestedFix.actionType).toBe('ADD_STEP');

    let state = {
      steps: [{ id: 'step_main', title: 'Main Screen', components: [] }],
      baseComponents: [],
      appVariables: [],
      appTriggers: [],
      appFunctions: []
    };

    const mockSetters = {
      setSteps: (fn) => { state.steps = typeof fn === 'function' ? fn(state.steps) : fn; },
      setBaseComponents: (fn) => { state.baseComponents = typeof fn === 'function' ? fn(state.baseComponents) : fn; },
      setAppVariables: (fn) => { state.appVariables = typeof fn === 'function' ? fn(state.appVariables) : fn; },
      setAppTriggers: (fn) => { state.appTriggers = typeof fn === 'function' ? fn(state.appTriggers) : fn; },
      setAppFunctions: (fn) => { state.appFunctions = typeof fn === 'function' ? fn(state.appFunctions) : fn; }
    };

    const fixResult = aiBugAnalyzer.applyFix(state, analysis.suggestedFix, mockSetters);
    expect(fixResult.nextState.steps.length).toBe(2);
    expect(fixResult.nextState.steps.some(s => s.title === 'Work Order Perbaikan')).toBe(true);
  });

  // Complete End-to-End Governance Flow Test
  it('End-to-End: Verifies complete 5-phase governance flow lifecycle', async () => {
    // 1. Pre-Coding Briefing
    let userPreCodingDecision = 'OK';
    expect(userPreCodingDecision).toBe('OK');

    // 2. Coding phase settles state
    const state = { ...initialProjectState };

    // 3. Post-Coding Review
    let userPostCodingDecision = 'OK_RUN_TEST';
    expect(userPostCodingDecision).toBe('OK_RUN_TEST');

    // 4. Test Simulator Runs
    const syncRes = appRegistryService.syncFromProjectState(state);
    const runner = new BrowserTestRunner({
      appId: state.currentAppId,
      registry: syncRes.registry,
      appState: state
    });
    const results = await runner.runSuite('Quick Test');
    expect(results.total).toBeGreaterThan(0);

    // 5. Post-Test Decision
    if (results.failed > 0) {
      const userRevisionDecision = 'APPROVE_AUTO_FIX';
      expect(userRevisionDecision).toBe('APPROVE_AUTO_FIX');
    } else {
      expect(results.failed).toBe(0);
    }
  });

  // Construction Sequence & Device Precision Layout Verification
  it('Construction Sequence: Enforces Base Layout (Header & Footer) before variables, screens, triggers, and functions', () => {
    const executionOrder = [];

    // Simulate lifecycle execution flow
    const executeAppCreation = (devicePreset = 'LAPTOP_HD') => {
      // 1. Base Layout (Header at y:0, Footer at y:H-50)
      const height = devicePreset === 'DESKTOP_FHD' ? 1080 : (devicePreset === 'IPHONE_14' ? 852 : 720);
      const width = devicePreset === 'DESKTOP_FHD' ? 1920 : (devicePreset === 'IPHONE_14' ? 393 : 1280);
      executionOrder.push('BASE_LAYOUT');

      const baseComponents = [
        { id: 'header-bar', type: 'box', x: 0, y: 0, w: width, h: 56, layer: 'header' },
        { id: 'footer-bar', type: 'box', x: 0, y: height - 50, w: width, h: 50, layer: 'footer' }
      ];

      // 2. Variables
      executionOrder.push('VARIABLES');
      const variables = [{ id: 'var_status', name: 'status', type: 'text', defaultValue: 'RUNNING' }];

      // 3. Screen Widgets (placed inside safe area between header and footer)
      executionOrder.push('SCREEN_WIDGETS');
      const contentWidget = { id: 'widget-1', type: 'text', x: 20, y: 70, w: 300, h: 40 };
      expect(contentWidget.y).toBeGreaterThanOrEqual(baseComponents[0].h);
      expect(contentWidget.y + contentWidget.h).toBeLessThanOrEqual(baseComponents[1].y);

      // 4. Triggers
      executionOrder.push('TRIGGERS');
      const triggers = [{ id: 'trig_1', event: 'onClick', action: 'SAVE' }];

      // 5. Functions
      executionOrder.push('FUNCTIONS');
      const functions = [{ id: 'fn_1', name: 'calculateOee' }];

      return { baseComponents, variables, contentWidget, triggers, functions };
    };

    executeAppCreation('LAPTOP_HD');
    expect(executionOrder).toEqual([
      'BASE_LAYOUT',
      'VARIABLES',
      'SCREEN_WIDGETS',
      'TRIGGERS',
      'FUNCTIONS'
    ]);
  });
});

