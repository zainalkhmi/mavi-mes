/**
 * Bug Classifier for MaviCore Automated Testing
 * ==============================================================================
 * Classifies test failures into standardized industrial bug categories:
 * UI, ROUTING, COMPONENT, DATA_BINDING, VARIABLE, EVENT, TRIGGER, WORKFLOW,
 * TOOL, API, DATABASE, PERMISSION, RPA, PERFORMANCE, REGRESSION.
 * ==============================================================================
 */

export const BUG_CATEGORIES = [
  'UI',
  'ROUTING',
  'COMPONENT',
  'DATA_BINDING',
  'VARIABLE',
  'EVENT',
  'TRIGGER',
  'WORKFLOW',
  'TOOL',
  'API',
  'DATABASE',
  'PERMISSION',
  'RPA',
  'PERFORMANCE',
  'REGRESSION'
];

let bugCounter = 1;

export const bugClassifier = {
  /**
   * Classifies an error trace or test assertion failure into a structured Bug Ticket
   */
  classify(failureContext = {}) {
    const {
      testId = `TEST_${Date.now()}`,
      categoryHint = '',
      action = '',
      target = '',
      expected = '',
      actual = '',
      errorMessage = '',
      stack = '',
      registry = null,
      appId = ''
    } = failureContext;

    const lowerError = String(errorMessage || '').toLowerCase();
    const lowerStack = String(stack || '').toLowerCase();
    const lowerAction = String(action || '').toLowerCase();

    let category = 'COMPONENT';
    let severity = 'MEDIUM';

    // 1. ROUTING
    if (
      lowerError.includes('route') ||
      lowerError.includes('404') ||
      lowerError.includes('navigation') ||
      lowerAction.includes('navigate') ||
      categoryHint === 'ROUTING'
    ) {
      category = 'ROUTING';
      severity = 'HIGH';
    }
    // 2. PERMISSION
    else if (
      lowerError.includes('permission') ||
      lowerError.includes('unauthorized') ||
      lowerError.includes('403') ||
      lowerError.includes('forbidden') ||
      categoryHint === 'PERMISSION'
    ) {
      category = 'PERMISSION';
      severity = 'HIGH';
    }
    // 3. DATA_BINDING
    else if (
      lowerError.includes('binding') ||
      lowerError.includes('unbound') ||
      lowerError.includes('variable is undefined') ||
      lowerAction.includes('assertvariable') ||
      categoryHint === 'DATA_BINDING'
    ) {
      category = 'DATA_BINDING';
      severity = 'HIGH';
    }
    // 4. VARIABLE
    else if (
      lowerError.includes('variable') ||
      lowerError.includes('validation error') ||
      lowerError.includes('range') ||
      categoryHint === 'VARIABLE'
    ) {
      category = 'VARIABLE';
      severity = 'MEDIUM';
    }
    // 5. TRIGGER
    else if (
      lowerError.includes('trigger') ||
      lowerError.includes('clause') ||
      lowerError.includes('condition evaluated to false') ||
      categoryHint === 'TRIGGER'
    ) {
      category = 'TRIGGER';
      severity = 'HIGH';
    }
    // 6. TOOL / FUNCTION
    else if (
      lowerError.includes('tool') ||
      lowerError.includes('function') ||
      lowerError.includes('not a function') ||
      lowerError.includes('cannot read property of undefined') ||
      categoryHint === 'TOOL'
    ) {
      category = 'TOOL';
      severity = 'HIGH';
    }
    // 7. WORKFLOW
    else if (
      lowerError.includes('workflow') ||
      lowerError.includes('step sequence') ||
      categoryHint === 'WORKFLOW'
    ) {
      category = 'WORKFLOW';
      severity = 'CRITICAL';
    }
    // 8. DATABASE / API
    else if (
      lowerError.includes('sql') ||
      lowerError.includes('table') ||
      lowerError.includes('supabase') ||
      lowerError.includes('database') ||
      categoryHint === 'DATABASE'
    ) {
      category = 'DATABASE';
      severity = 'CRITICAL';
    }
    // 9. RPA
    else if (
      lowerError.includes('ghost') ||
      lowerError.includes('rpa') ||
      lowerError.includes('glide') ||
      categoryHint === 'RPA'
    ) {
      category = 'RPA';
      severity = 'MEDIUM';
    }
    // 10. UI / COMPONENT
    else if (
      lowerError.includes('not visible') ||
      lowerError.includes('not found') ||
      lowerError.includes('locator') ||
      lowerError.includes('timed out waiting for element') ||
      categoryHint === 'UI' ||
      categoryHint === 'COMPONENT'
    ) {
      category = lowerError.includes('not found') ? 'COMPONENT' : 'UI';
      severity = 'HIGH';
    }

    const bugId = `BUG-${String(bugCounter++).padStart(3, '0')}`;

    // Cross-reference with App Registry if available
    let registryComponent = null;
    let registryTool = null;
    let registryVariable = null;

    if (registry) {
      const components = registry['components.json'] || [];
      const tools = registry['tools.json'] || [];
      const variables = registry['variables.json'] || [];

      registryComponent = components.find(c => c.instanceId === target || c.displayName === target);
      registryTool = tools.find(t => t.id === target || lowerError.includes(t.id.toLowerCase()));
      registryVariable = variables.find(v => v.id === target || lowerError.includes(v.id.toLowerCase()));
    }

    return {
      bugId,
      id: bugId,
      appId,
      testId,
      category,
      type: category,
      severity,
      component: target || 'unknown-component',
      action: action || 'test_assertion',
      expected: expected || 'Action to succeed',
      actual: actual || errorMessage || 'Failed assertion',
      message: errorMessage || `Test ${testId} failed on ${target}`,
      stack,
      registryContext: {
        component: registryComponent,
        tool: registryTool,
        variable: registryVariable
      },
      createdAt: new Date().toISOString()
    };
  }
};
