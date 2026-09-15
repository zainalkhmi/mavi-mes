/**
 * MaviCore Auto App Registry Service
 * ==============================================================================
 * Source of truth for App Builder, UI Rendering, AI Copilot, Triggers,
 * Tools, Data Bindings, Navigation, Playwright Automation, and Health Checking.
 *
 * Automatically generates and maintains the 13 machine-readable artifacts:
 * /app-registry/{appId}/
 * ├── app.json
 * ├── routes.json
 * ├── components.json
 * ├── variables.json
 * ├── data-bindings.json
 * ├── events.json
 * ├── triggers.json
 * ├── workflows.json
 * ├── tools.json
 * ├── test-cases.json
 * ├── selectors.json
 * ├── permissions.json
 * └── test-contract.json
 * ==============================================================================
 */

// Helper to sanitize slug IDs
export const slugify = (text) => {
  return String(text || 'unnamed-app')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';
};

// Default permissions dictionary for common industrial actions
const DEFAULT_PERMISSIONS_MAP = {
  'machine.start': 'SUPERVISOR',
  'machine.stop': 'OPERATOR',
  'machine.getStatus': 'READ',
  'inspection.submit': 'OPERATOR',
  'quality.createNCR': 'QUALITY_ENGINEER',
  'database.delete': 'ADMIN',
  'plc.writeTag': 'MAINTENANCE',
  'plc.readTag': 'READ',
  'auth.login': 'PUBLIC'
};

export const appRegistryService = {
  /**
   * Generates all 13 machine-readable registry artifacts from current AppBuilder state.
   */
  generateRegistry(projectState = {}) {
    const {
      currentAppId,
      appName = 'Industrial Application',
      appCategory = 'General',
      appMeta = {},
      steps = [],
      baseComponents = [],
      appTriggers = [],
      appVariables = [],
      appFunctions = [],
      appTables = [],
      recordPlaceholders = [],
      permissions = []
    } = projectState;

    const appId = currentAppId ? String(currentAppId) : slugify(appName);
    const version = appMeta?.version || '1.0.0';

    // --------------------------------------------------------------------------
    // 1. ROUTES REGISTRY (routes.json)
    // --------------------------------------------------------------------------
    const routes = steps.map((step, index) => {
      const stepSlug = slugify(step.title || `screen-${index + 1}`);
      return {
        id: step.id,
        routeId: `${appId}.${stepSlug}`,
        path: `/${appId}/${stepSlug}`,
        title: step.title || `Screen ${index + 1}`,
        stepType: step.stepType || 'Screen',
        cycleTimeSeconds: step.cycleTimeSeconds || 60,
        isInitialRoute: index === 0,
        componentCount: (step.components || []).length
      };
    });

    if (routes.length === 0) {
      routes.push({
        id: 'screen_1',
        routeId: `${appId}.main`,
        path: `/${appId}/main`,
        title: 'Main Screen',
        stepType: 'Screen',
        cycleTimeSeconds: 60,
        isInitialRoute: true,
        componentCount: 0
      });
    }

    // --------------------------------------------------------------------------
    // 2. COMPONENTS REGISTRY (components.json)
    // --------------------------------------------------------------------------
    const allRawComponents = [
      ...baseComponents.map(c => ({ ...c, _page: 'BASE' })),
      ...steps.flatMap(s => (s.components || []).map(c => ({ ...c, _page: s.title || s.id })))
    ];

    const components = allRawComponents.map((comp, idx) => {
      const stableId = comp.props?.testId || comp.displayName || comp.id || `widget-${idx + 1}`;
      const maviId = slugify(stableId);
      const isInteractive = ['BUTTON', 'INPUT_TEXT', 'INPUT_NUMBER', 'CHECKBOX', 'SWITCH', 'DROPDOWN', 'TABLE', 'CAMERA_SCAN', 'SIGNATURE', 'BARCODE_SCANNER'].includes(comp.type);
      const dataBinding = comp.props?.targetVariable || comp.props?.bindVar || null;

      // Extract events
      const events = [];
      if (['BUTTON', 'ACTION_BUTTON'].includes(comp.type)) events.push('onClick');
      if (['INPUT_TEXT', 'INPUT_NUMBER', 'DROPDOWN'].includes(comp.type)) {
        events.push('onChange');
        events.push('onBlur');
      }
      if (['SWITCH', 'CHECKBOX'].includes(comp.type)) events.push('onToggle');

      // Extract actions triggered by this widget
      const triggeredActions = appTriggers
        .filter(t => t.widgetId === comp.displayName || t.widgetId === comp.id || t.widgetId === comp.props?.text)
        .flatMap(t => (t.actions || []).map(a => a.type || a.action));

      return {
        instanceId: maviId,
        componentId: `widget.${(comp.type || 'unknown').toLowerCase()}`,
        originalId: comp.id,
        displayName: comp.displayName || comp.props?.label || comp.props?.text || comp.type,
        type: comp.type,
        page: comp._page,
        position: {
          x: comp.x ?? 0,
          y: comp.y ?? 0,
          w: comp.w ?? 120,
          h: comp.h ?? 40,
          zIndex: comp.props?.zIndex || 1000
        },
        properties: {
          text: comp.props?.text || '',
          label: comp.props?.label || '',
          placeholder: comp.props?.placeholder || '',
          color: comp.props?.color || null,
          backgroundColor: comp.props?.backgroundColor || null,
          fontSize: comp.props?.fontSize || null,
          disabled: !!comp.props?.disabled,
          locked: !!comp.props?.locked,
          required: !!comp.props?.required,
          targetVariable: dataBinding
        },
        dataBinding: dataBinding ? {
          variable: dataBinding,
          property: 'value',
          direction: 'two-way'
        } : null,
        events,
        actions: triggeredActions,
        selector: {
          strategy: 'data-mavi-id',
          value: maviId,
          cssSelector: `[data-mavi-id="${maviId}"]`,
          testId: `[data-testid="${maviId}"]`
        },
        test: {
          visible: comp.props?.visible !== false,
          interactive: isInteractive,
          expectedState: comp.props?.disabled ? 'DISABLED' : 'READY',
          testabilityStatus: isInteractive ? 'TESTABLE' : 'STATIC'
        }
      };
    });

    // --------------------------------------------------------------------------
    // 3. SELECTORS REGISTRY (selectors.json)
    // --------------------------------------------------------------------------
    const selectors = {};
    components.forEach(c => {
      selectors[c.instanceId] = {
        maviId: c.selector.value,
        dataTestId: c.selector.value,
        css: c.selector.cssSelector,
        type: c.type,
        page: c.page,
        interactive: c.test.interactive
      };
    });

    // --------------------------------------------------------------------------
    // 4. VARIABLES REGISTRY (variables.json)
    // --------------------------------------------------------------------------
    const variables = (appVariables || []).map(v => {
      const varName = typeof v === 'string' ? v : (v.name || v.id);
      const varType = v.type || (typeof v.defaultValue === 'number' ? 'number' : typeof v.defaultValue === 'boolean' ? 'boolean' : 'text');
      
      // Find components bound to this variable
      const usedBy = components
        .filter(c => c.dataBinding?.variable === varName)
        .map(c => c.instanceId);

      // Find triggers referencing this variable
      const triggerRefs = appTriggers
        .filter(t => t.watchVar === varName || JSON.stringify(t.conditions || []).includes(varName))
        .map(t => t.id || t.name);

      return {
        id: varName,
        type: varType,
        scope: v.scope || 'page',
        page: v.page || 'global',
        defaultValue: v.defaultValue ?? null,
        required: !!v.required,
        validation: v.validation || {
          min: v.type === 'number' ? (v.min ?? 0) : undefined,
          max: v.type === 'number' ? (v.max ?? 1000) : undefined,
          regex: v.pattern || undefined
        },
        usedBy: Array.from(new Set([...usedBy, ...triggerRefs]))
      };
    });

    // --------------------------------------------------------------------------
    // 5. DATA BINDINGS REGISTRY (data-bindings.json)
    // --------------------------------------------------------------------------
    const dataBindings = components
      .filter(c => c.dataBinding)
      .map(c => ({
        component: c.instanceId,
        displayName: c.displayName,
        page: c.page,
        property: c.dataBinding.property,
        variable: c.dataBinding.variable,
        direction: c.dataBinding.direction
      }));

    // --------------------------------------------------------------------------
    // 6. EVENTS REGISTRY (events.json)
    // --------------------------------------------------------------------------
    const events = [];
    components.forEach(c => {
      (c.events || []).forEach(evName => {
        const boundTriggers = appTriggers.filter(t => 
          t.widgetId === c.displayName || 
          t.widgetId === c.originalId ||
          t.widgetId === c.properties.text
        );
        events.push({
          id: `${c.instanceId}-${evName.toLowerCase()}`,
          source: c.instanceId,
          event: evName,
          page: c.page,
          actions: boundTriggers.flatMap(t => (t.actions || []).map(a => a.type || a.action || 'CUSTOM_ACTION'))
        });
      });
    });

    // --------------------------------------------------------------------------
    // 7. TRIGGERS REGISTRY (triggers.json)
    // --------------------------------------------------------------------------
    const triggers = (appTriggers || []).map((t, idx) => {
      const triggerId = t.id || slugify(t.name || `trigger-${idx + 1}`);
      const rawConditions = t.conditions || t.clauses || [];
      const conditionStr = typeof t.condition === 'string' ? t.condition : (rawConditions.length > 0 ? JSON.stringify(rawConditions) : 'true');

      return {
        id: triggerId,
        name: t.name || `Trigger ${idx + 1}`,
        type: t.event || 'condition',
        widgetSource: t.widgetId || null,
        condition: conditionStr,
        actions: (t.actions || []).map(a => ({
          type: a.type || a.action || 'EXECUTE',
          payload: a.payload || a.params || {}
        })),
        test: {
          enabled: true,
          testInput: t.testInput || (t.watchVar ? { [t.watchVar]: 85 } : {})
        }
      };
    });

    // --------------------------------------------------------------------------
    // 8. WORKFLOWS REGISTRY (workflows.json)
    // --------------------------------------------------------------------------
    const workflows = [
      {
        id: `${appId}-lifecycle`,
        name: `${appName} Primary Workflow`,
        initialRoute: routes[0]?.path || `/${appId}/main`,
        steps: routes.map((r, i) => ({
          stepNumber: i + 1,
          route: r.path,
          title: r.title,
          nextStep: routes[i + 1]?.path || null,
          cycleTimeSeconds: r.cycleTimeSeconds
        }))
      }
    ];

    // --------------------------------------------------------------------------
    // 9. TOOLS & FUNCTIONS REGISTRY (tools.json)
    // --------------------------------------------------------------------------
    const standardTools = (appFunctions || []).map(fn => {
      const fnName = fn.name || fn.id;
      return {
        id: fnName,
        type: 'function',
        description: fn.description || 'Custom business logic function',
        input: (fn.inputs || []).map(i => i.name || i),
        output: (fn.outputs || []).map(o => o.name || o),
        permission: fn.permission || DEFAULT_PERMISSIONS_MAP[fnName] || 'OPERATOR',
        test: {
          mockable: true,
          expectedStatus: 'success',
          mockOutput: { status: 'OK', executed: true }
        }
      };
    });

    // Auto-discover tools referenced in triggers (e.g. machine.getStatus, inspection.submit)
    const discoveredToolNames = new Set();
    triggers.forEach(tr => {
      (tr.actions || []).forEach(ac => {
        if (ac.type && (ac.type.includes('.') || ac.type.startsWith('CALL_'))) {
          const toolId = ac.type.replace(/^CALL_/, '');
          discoveredToolNames.add(toolId);
        }
      });
    });

    discoveredToolNames.forEach(toolName => {
      if (!standardTools.some(t => t.id === toolName)) {
        standardTools.push({
          id: toolName,
          type: 'tool',
          description: `Discovered tool action for ${toolName}`,
          input: ['parameters'],
          output: ['result'],
          permission: DEFAULT_PERMISSIONS_MAP[toolName] || 'OPERATOR',
          test: {
            mockable: true,
            expectedStatus: 'success',
            mockOutput: { status: 'SUCCESS', tool: toolName }
          }
        });
      }
    });

    // --------------------------------------------------------------------------
    // 10. PERMISSIONS REGISTRY (permissions.json)
    // --------------------------------------------------------------------------
    const permissionsRegistry = {
      appId,
      roles: ['ADMIN', 'SUPERVISOR', 'QUALITY_ENGINEER', 'MAINTENANCE', 'OPERATOR', 'PUBLIC'],
      routePermissions: routes.reduce((acc, r) => {
        acc[r.path] = 'OPERATOR';
        return acc;
      }, {}),
      toolPermissions: standardTools.reduce((acc, t) => {
        acc[t.id] = t.permission || 'OPERATOR';
        return acc;
      }, {}),
      widgetPermissions: components
        .filter(c => c.properties.locked)
        .reduce((acc, c) => {
          acc[c.instanceId] = 'SUPERVISOR';
          return acc;
        }, {})
    };

    // --------------------------------------------------------------------------
    // 11. TEST CASES REGISTRY (test-cases.json)
    // --------------------------------------------------------------------------
    const testCases = [];

    // A. Route Navigation Tests
    routes.forEach(r => {
      testCases.push({
        id: `TC_ROUTE_${slugify(r.title).toUpperCase()}`,
        name: `Verify Route: ${r.title}`,
        category: 'ROUTING',
        severity: 'HIGH',
        route: r.path,
        steps: [
          { action: 'navigate', target: r.path },
          { action: 'assertRoute', target: r.path, routeId: r.routeId, expected: true }
        ]
      });
    });

    // B. Component Visibility & Presence Tests
    components.filter(c => c.test.visible).forEach(c => {
      testCases.push({
        id: `TC_COMP_${slugify(c.instanceId).toUpperCase()}`,
        name: `Verify Component Render: ${c.displayName}`,
        category: 'COMPONENT',
        severity: 'MEDIUM',
        route: routes.find(r => r.title === c.page)?.path || routes[0]?.path,
        steps: [
          { action: 'locate', target: c.instanceId, selector: c.selector.cssSelector },
          { action: 'assertVisible', target: c.instanceId, expected: true }
        ]
      });
    });

    // C. Data Binding & Variable Tests
    dataBindings.forEach(db => {
      testCases.push({
        id: `TC_BIND_${slugify(db.component).toUpperCase()}`,
        name: `Verify Data Binding: ${db.component} ↔ ${db.variable}`,
        category: 'DATA_BINDING',
        severity: 'HIGH',
        steps: [
          { action: 'fill', target: db.component, value: 'TestVal-72' },
          { action: 'assertVariable', variable: db.variable, expected: 'TestVal-72' }
        ]
      });
    });

    // D. Trigger Evaluation Tests
    triggers.forEach(tr => {
      testCases.push({
        id: `TC_TRIG_${slugify(tr.id).toUpperCase()}`,
        name: `Verify Trigger Condition: ${tr.name}`,
        category: 'TRIGGER',
        severity: 'HIGH',
        steps: [
          { action: 'simulateEvent', target: tr.widgetSource || 'system', event: tr.type },
          { action: 'assertActionsDispatched', actions: tr.actions.map(a => a.type) }
        ]
      });
    });

    // E. Negative & Boundary Tests
    variables.filter(v => v.type === 'number').forEach(v => {
      const boundComp = components.find(c => c.dataBinding?.variable === v.id);
      if (boundComp) {
        testCases.push({
          id: `TC_NEG_${slugify(v.id).toUpperCase()}_OUT_OF_BOUNDS`,
          name: `Negative Validation: Out of Range for ${v.id}`,
          category: 'VARIABLE',
          severity: 'MEDIUM',
          steps: [
            { action: 'fill', target: boundComp.instanceId, value: -999 },
            { action: 'assertValidationError', target: boundComp.instanceId, expected: true }
          ]
        });
      }
    });

    // F. End-to-End Scenario Test
    testCases.push({
      id: `TC_E2E_${slugify(appId).toUpperCase()}_PRIMARY_FLOW`,
      name: `E2E Flow: Primary User Journey for ${appName}`,
      category: 'WORKFLOW',
      severity: 'CRITICAL',
      steps: [
        { action: 'navigate', target: routes[0]?.path || `/${appId}/main` },
        ...components.filter(c => c.test.interactive).slice(0, 4).map(c => ({
          action: c.type.includes('INPUT') ? 'fill' : 'click',
          target: c.instanceId,
          value: c.type.includes('INPUT') ? '72' : undefined
        })),
        { action: 'assertState', expected: 'RUNNING' }
      ]
    });

    // --------------------------------------------------------------------------
    // 12. TEST CONTRACT (test-contract.json)
    // --------------------------------------------------------------------------
    const testContract = {
      appId,
      app: appId,
      appName,
      version,
      healthChecks: [
        'route',
        'component',
        'binding',
        'event',
        'trigger',
        'tool',
        'workflow',
        'navigation',
        'permission'
      ],
      requiredRoutes: routes.map(r => r.path),
      requiredComponents: components.filter(c => c.test.interactive).map(c => c.instanceId),
      requiredTools: standardTools.map(t => t.id),
      requiredVariables: variables.filter(v => v.required).map(v => v.id),
      safetyMocks: [
        'machine.start',
        'database.delete',
        'plc.writeTag'
      ]
    };

    // --------------------------------------------------------------------------
    // 13. APP MANIFEST (app.json)
    // --------------------------------------------------------------------------
    const appManifest = {
      appId,
      version,
      name: appName,
      category: appCategory,
      status: 'active',
      generatedAt: new Date().toISOString(),
      routes: routes.map(r => r.routeId),
      components: components.map(c => c.componentId),
      variables: variables.map(v => v.id),
      tools: standardTools.map(t => t.id),
      triggers: triggers.map(t => t.id),
      workflows: workflows.map(w => w.id),
      testCasesCount: testCases.length,
      healthScore: 100
    };

    return {
      'app.json': appManifest,
      'routes.json': routes,
      'components.json': components,
      'variables.json': variables,
      'data-bindings.json': dataBindings,
      'events.json': events,
      'triggers.json': triggers,
      'workflows.json': workflows,
      'tools.json': standardTools,
      'test-cases.json': testCases,
      'selectors.json': selectors,
      'permissions.json': permissionsRegistry,
      'test-contract.json': testContract
    };
  },

  /**
   * Saves the 13 registry files to localStorage and in-memory cache
   */
  saveRegistry(appId, registry) {
    if (!appId || !registry) return;
    try {
      const storageKey = `mavicore_app_registry_${appId}`;
      localStorage.setItem(storageKey, JSON.stringify(registry));
      
      // Also register into global app registry index
      const indexKey = 'mavicore_app_registry_index';
      const existingIndex = JSON.parse(localStorage.getItem(indexKey) || '[]');
      if (!existingIndex.includes(appId)) {
        existingIndex.push(appId);
        localStorage.setItem(indexKey, JSON.stringify(existingIndex));
      }
      return true;
    } catch (err) {
      console.warn('[AppRegistry] Failed to write registry to localStorage:', err);
      return false;
    }
  },

  /**
   * Loads registry for a specific appId
   */
  getRegistry(appId) {
    if (!appId) return null;
    try {
      const storageKey = `mavicore_app_registry_${appId}`;
      const raw = localStorage.getItem(storageKey);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      console.warn('[AppRegistry] Error reading registry for', appId, e);
    }
    return null;
  },

  /**
   * Synchronizes registry from current project state directly
   */
  syncFromProjectState(projectState) {
    const registry = this.generateRegistry(projectState);
    const appId = registry['app.json']?.appId || 'app';
    this.saveRegistry(appId, registry);
    return { appId, registry };
  },

  /**
   * Exports the complete 13-artifact registry as formatted JSON bundle
   */
  exportRegistryJson(appId, projectState = null) {
    const registry = projectState ? this.generateRegistry(projectState) : this.getRegistry(appId);
    if (!registry) return null;
    return JSON.stringify(registry, null, 2);
  },

  /**
   * Exports the 13 registry artifacts as a ZIP blob
   */
  async exportRegistryZip(appId, projectState = null) {
    const registry = projectState ? this.generateRegistry(projectState) : this.getRegistry(appId);
    if (!registry) return null;
    try {
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default || JSZipModule;
      const zip = new JSZip();
      const rootFolder = zip.folder(`app-registry-${appId || 'app'}`);
      
      Object.entries(registry).forEach(([fileName, fileData]) => {
        rootFolder.file(fileName, JSON.stringify(fileData, null, 2));
      });

      const blob = await zip.generateAsync({ type: 'blob' });
      return blob;
    } catch (err) {
      console.warn('[AppRegistry] exportRegistryZip error:', err);
      return null;
    }
  },

  /**
   * Registry Sync Validator: validates code/state against the registry
   * Detects: missing selectors, broken tools, unbound variables, contract issues
   */
  validateApp(appId, projectState) {
    const registry = projectState ? this.generateRegistry(projectState) : this.getRegistry(appId);
    if (!registry) {
      return {
        valid: false,
        issues: [{ severity: 'CRITICAL', message: `No registry found for app: ${appId}` }]
      };
    }

    const issues = [];
    const components = registry['components.json'] || [];
    const variables = registry['variables.json'] || [];
    const tools = registry['tools.json'] || [];
    const triggers = registry['triggers.json'] || [];
    const contract = registry['test-contract.json'] || {};

    // 1. Validate Test Selectors
    components.forEach(c => {
      if (c.test.interactive && (!c.selector || !c.selector.value)) {
        issues.push({
          type: 'MISSING_SELECTOR',
          severity: 'HIGH',
          component: c.displayName || c.instanceId,
          message: `Missing stable test selector for interactive widget ${c.displayName}`
        });
      }
    });

    // 2. Validate Data Bindings
    (registry['data-bindings.json'] || []).forEach(b => {
      const varExists = variables.some(v => v.id === b.variable);
      if (!varExists) {
        issues.push({
          type: 'BROKEN_DATA_BINDING',
          severity: 'HIGH',
          component: b.component,
          variable: b.variable,
          message: `Widget ${b.component} is bound to non-existent variable "${b.variable}"`
        });
      }
    });

    // 3. Validate Discovered Tools
    triggers.forEach(tr => {
      (tr.actions || []).forEach(ac => {
        if (ac.type && ac.type.includes('.')) {
          const toolExists = tools.some(t => t.id === ac.type);
          if (!toolExists) {
            issues.push({
              type: 'BROKEN_TOOL_REFERENCE',
              severity: 'HIGH',
              trigger: tr.id,
              tool: ac.type,
              message: `Trigger "${tr.name}" calls unregistered tool "${ac.type}"`
            });
          }
        }
      });
    });

    // 4. Validate Contract Requirements
    (contract.requiredComponents || []).forEach(reqComp => {
      const exists = components.some(c => c.instanceId === reqComp);
      if (!exists) {
        issues.push({
          type: 'CONTRACT_VIOLATION',
          severity: 'MEDIUM',
          component: reqComp,
          message: `Contract requirement missing component: ${reqComp}`
        });
      }
    });

    const isHealthy = issues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length === 0;

    return {
      appId,
      valid: isHealthy,
      totalIssues: issues.length,
      issues,
      summary: {
        routes: (registry['routes.json'] || []).length,
        components: components.length,
        variables: variables.length,
        tools: tools.length,
        triggers: triggers.length,
        testCases: (registry['test-cases.json'] || []).length
      }
    };
  },

  /**
   * Calculates detailed App Health Score (0–100%) broken down by categories
   */
  calculateHealthScore(registry, testResults = {}) {
    if (!registry) return { overall: 0, categories: {} };

    const {
      passed = 0,
      failed = 0,
      total = 0,
      categoryResults = {}
    } = testResults;

    const categories = {
      UI: 100,
      Routing: 100,
      Components: 100,
      DataBinding: 100,
      Triggers: 100,
      Workflow: 100,
      Tools: 100,
      Permissions: 100
    };

    // Apply category test pass rates if available
    Object.keys(categories).forEach(cat => {
      const res = categoryResults[cat.toUpperCase()] || categoryResults[cat];
      if (res && res.total > 0) {
        categories[cat] = Math.round((res.passed / res.total) * 100);
      }
    });

    // If total tests were run, calculate weighted overall score
    let overall = 100;
    if (total > 0) {
      overall = Math.round((passed / total) * 100);
    } else {
      // Static health score based on completeness
      const hasRoutes = (registry['routes.json'] || []).length > 0;
      const hasComponents = (registry['components.json'] || []).length > 0;
      const hasContract = !!registry['test-contract.json'];
      if (!hasRoutes) overall -= 25;
      if (!hasComponents) overall -= 25;
      if (!hasContract) overall -= 10;
    }

    return {
      overall: Math.max(0, Math.min(100, overall)),
      categories,
      passed,
      failed,
      total
    };
  }
};
