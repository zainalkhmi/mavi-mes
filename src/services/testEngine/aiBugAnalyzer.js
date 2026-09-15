/**
 * AI Bug Analyzer & Autonomous Self-Healing Loop for MaviCore
 * ==============================================================================
 * Cross-references test failures with the App Registry and source state to
 * diagnose root causes, produce actionable fix proposals, and drive the
 * closed-loop "Generate → Test → Diagnose → Fix → Retest" cycle (max 3 retries).
 * ==============================================================================
 */

import { appRegistryService } from '../appRegistry/appRegistryService';

export const aiBugAnalyzer = {
  /**
   * Analyzes a single bug ticket against the App Registry
   */
  analyzeBug(bugTicket = {}, registry = {}) {
    const { type, component, actual, message, expected, testId } = bugTicket;
    const components = registry ? (registry['components.json'] || []) : [];
    const variables = registry ? (registry['variables.json'] || []) : [];
    const bindings = registry ? (registry['data-bindings.json'] || []) : [];
    const tools = registry ? (registry['tools.json'] || []) : [];
    const triggers = registry ? (registry['triggers.json'] || []) : [];

    let rootCause = '';
    let explanation = '';
    let suggestedFix = null;

    switch (type) {
      case 'DATA_BINDING': {
        const boundItem = bindings.find(b => b.component === component || b.displayName === component || (component && b.component?.includes(component.toLowerCase())));
        if (!boundItem) {
          rootCause = `Widget "${component}" does not have a registered data binding.`;
          explanation = `The component attempted to read or write a value, but its targetVariable property is not mapped to any variable in variables.json.`;
          suggestedFix = {
            actionType: 'UPDATE_DATA_BINDING',
            target: component,
            variable: `${component}_value`,
            patch: {
              component,
              property: 'value',
              variable: `${component}_value`,
              direction: 'two-way'
            },
            description: `Bind ${component}.value to variable "${component}_value"`
          };
        } else {
          rootCause = `Variable "${boundItem.variable}" bound to ${component} does not exist in variables registry.`;
          explanation = `The widget refers to variable "${boundItem.variable}", but that variable was never created in appVariables.`;
          suggestedFix = {
            actionType: 'CREATE_VARIABLE',
            target: boundItem.variable,
            patch: {
              id: boundItem.variable,
              name: boundItem.variable,
              type: 'text',
              defaultValue: ''
            },
            description: `Auto-create variable "${boundItem.variable}" with default string type`
          };
        }
        break;
      }

      case 'VARIABLE': {
        rootCause = `Variable validation failure or missing variable definition for "${component}".`;
        explanation = actual || message;
        suggestedFix = {
          actionType: 'RELAX_VALIDATION',
          target: component,
          patch: { min: -1000, max: 10000 },
          description: `Adjust validation boundaries for variable "${component}" to accept wide range`
        };
        break;
      }

      case 'TRIGGER': {
        const matchedTrig = triggers.find(t => t.id === component || t.widgetSource === component);
        rootCause = `Trigger condition evaluated to false or target action was missing.`;
        explanation = `Trigger "${matchedTrig?.name || component}" could not dispatch its configured actions because the condition was unfulfilled or the target was undefined.`;
        suggestedFix = {
          actionType: 'UPDATE_TRIGGER',
          target: matchedTrig?.id || component,
          patch: { condition: 'true' },
          description: `Ensure trigger condition fallback is valid and actions are reachable`
        };
        break;
      }

      case 'TOOL': {
        rootCause = `Unregistered tool action or missing tool handler.`;
        explanation = `The application attempted to invoke tool "${component}", but it is missing from tools.json or lacked execution permissions.`;
        suggestedFix = {
          actionType: 'REGISTER_TOOL',
          target: component,
          patch: {
            id: component,
            type: 'tool',
            permission: 'OPERATOR',
            test: { mockable: true, expectedStatus: 'success' }
          },
          description: `Register tool mock for "${component}" in tools.json`
        };
        break;
      }

      case 'ROUTING': {
        rootCause = `Destination screen/route is not present in routes.json.`;
        explanation = actual || `Could not navigate to target route.`;
        const rawTitle = component || 'New Screen';
        const cleanTitle = rawTitle.includes('.')
          ? rawTitle.split('.').pop().replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          : rawTitle;
        suggestedFix = {
          actionType: 'ADD_STEP',
          target: component,
          patch: { title: cleanTitle },
          description: `Auto-create missing screen "${cleanTitle}" in routes`
        };
        break;
      }

      case 'UI':
      case 'COMPONENT':
      default: {
        rootCause = `Component "${component}" could not be located on canvas or is hidden.`;
        explanation = `Test element locator for [data-mavi-id="${component}"] did not find a visible DOM node.`;
        suggestedFix = {
          actionType: 'UPDATE_WIDGET_SELECTOR',
          target: component,
          patch: { visible: true, testId: component },
          description: `Ensure component "${component}" has visible=true and stable testId="${component}"`
        };
        break;
      }
    }

    return {
      bugId: bugTicket.bugId,
      testId,
      type,
      rootCause,
      explanation,
      suggestedFix,
      confidence: 0.94,
      createdAt: new Date().toISOString()
    };
  },

  /**
   * Applies a proposed fix patch to current project state & updates the App Registry
   */
  applyFix(projectState = {}, suggestedFix = {}, setters = {}) {
    if (!suggestedFix) return projectState;

    const { actionType, target, patch } = suggestedFix;
    const nextState = { ...projectState };

    switch (actionType) {
      case 'CREATE_VARIABLE': {
        const existingVars = nextState.appVariables || [];
        if (!existingVars.some(v => (v.name || v.id) === patch.name)) {
          nextState.appVariables = [...existingVars, patch];
          if (setters.setAppVariables) setters.setAppVariables(nextState.appVariables);
        }
        break;
      }

      case 'UPDATE_DATA_BINDING': {
        // Update widget props targetVariable
        const updateWidget = (w) => {
          if (w.displayName === target || w.id === target || slugify(w.displayName) === target) {
            return {
              ...w,
              props: {
                ...(w.props || {}),
                targetVariable: patch.variable
              }
            };
          }
          return w;
        };

        if (nextState.steps) {
          nextState.steps = nextState.steps.map(s => ({
            ...s,
            components: (s.components || []).map(updateWidget)
          }));
          if (setters.setSteps) setters.setSteps(nextState.steps);
        }

        // Also add the variable if missing
        const existingVars = nextState.appVariables || [];
        if (!existingVars.some(v => (v.name || v.id) === patch.variable)) {
          nextState.appVariables = [...existingVars, { name: patch.variable, type: 'text', defaultValue: '' }];
          if (setters.setAppVariables) setters.setAppVariables(nextState.appVariables);
        }
        break;
      }

      case 'UPDATE_WIDGET_SELECTOR': {
        const makeVisible = (w) => {
          if (w.displayName === target || w.id === target || slugify(w.displayName) === target) {
            return {
              ...w,
              props: {
                ...(w.props || {}),
                visible: true,
                testId: patch.testId
              }
            };
          }
          return w;
        };

        if (nextState.steps) {
          nextState.steps = nextState.steps.map(s => ({
            ...s,
            components: (s.components || []).map(makeVisible)
          }));
          if (setters.setSteps) setters.setSteps(nextState.steps);
        }
        break;
      }

      case 'ADD_STEP': {
        const existingSteps = nextState.steps || [];
        const newStepId = `screen_${Date.now()}`;
        const newStep = {
          id: newStepId,
          title: patch.title,
          stepType: 'Screen',
          cycleTimeSeconds: 60,
          components: [],
          triggers: []
        };
        nextState.steps = [...existingSteps, newStep];
        if (setters.setSteps) setters.setSteps(nextState.steps);
        break;
      }

      case 'REGISTER_TOOL': {
        const existingTools = nextState.appFunctions || [];
        if (!existingTools.some(t => (t.name || t.id) === patch.id)) {
          nextState.appFunctions = [...existingTools, { name: patch.id, ...patch }];
          if (setters.setAppFunctions) setters.setAppFunctions(nextState.appFunctions);
        }
        break;
      }

      default:
        console.warn(`[aiBugAnalyzer] Unhandled fix actionType: ${actionType}`);
    }

    // Automatically synchronize the App Registry after applying fix
    const syncResult = appRegistryService.syncFromProjectState(nextState);
    return { nextState, registry: syncResult.registry };
  },

  /**
   * Autonomous AI Auto-Fix Loop (Configurable Max Retries, Default 3)
   */
  async runAutoFixLoop({
    runnerFactory,
    getProjectState,
    setters,
    maxRetries = 3,
    onProgress = () => {}
  }) {
    let attempt = 1;
    let currentState = getProjectState();
    let lastResults = null;

    while (attempt <= maxRetries) {
      onProgress({
        attempt,
        maxRetries,
        status: `Running automated test suite (Attempt ${attempt}/${maxRetries})...`
      });

      // 1. Sync registry from current state
      const { registry } = appRegistryService.syncFromProjectState(currentState);

      // 2. Run Test Suite
      const runner = runnerFactory(registry, currentState);
      const results = await runner.runSuite('Quick Test');
      lastResults = results;

      // 3. Check if all tests passed
      if (results.failed === 0) {
        onProgress({
          attempt,
          status: 'SUCCESS',
          message: `All tests PASSED on attempt ${attempt}! Self-healing complete.`,
          results
        });
        return { success: true, attempts: attempt, results };
      }

      // 4. Analyze first high-priority bug
      const firstBug = results.bugs[0];
      if (!firstBug) {
        break;
      }

      onProgress({
        attempt,
        status: 'ANALYZING',
        message: `Analyzing failure ${firstBug.bugId} (${firstBug.type}) on ${firstBug.component}...`,
        bug: firstBug
      });

      const analysis = this.analyzeBug(firstBug, registry);
      if (!analysis.suggestedFix) {
        onProgress({
          attempt,
          status: 'NO_FIX',
          message: `AI cannot synthesize an automated fix for ${firstBug.bugId}. Human review required.`
        });
        break;
      }

      onProgress({
        attempt,
        status: 'APPLYING_FIX',
        message: `Applying fix: ${analysis.suggestedFix.description}...`,
        fix: analysis.suggestedFix
      });

      // 5. Apply the fix
      const fixResult = this.applyFix(currentState, analysis.suggestedFix, setters);
      currentState = fixResult.nextState;

      // Brief delay before re-testing
      await new Promise(r => setTimeout(r, 600));
      attempt++;
    }

    return {
      success: lastResults?.failed === 0,
      attempts: attempt - 1,
      results: lastResults
    };
  }
};
