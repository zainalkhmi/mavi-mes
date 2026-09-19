/**
 * AppTestingEngine.jsx
 * =====================================================
 * Comprehensive App Testing Engine for MaviCore
 * Tests widgets, triggers, bindings, and simulates user interactions
 * =====================================================
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckCircle2, XCircle, AlertTriangle, Play, RotateCcw,
  ChevronRight, ChevronDown, Loader2, Zap, Bug, Shield,
  MousePointer, Keyboard, Database, Layers, Variable,
  Box, ArrowRight, Eye, EyeOff, RefreshCw, ClipboardList,
  ShieldCheck
} from 'lucide-react';

/**
 * Test Result Types
 */
export const TEST_STATUS = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  WARNING: 'WARNING',
  SKIP: 'SKIP',
  RUNNING: 'RUNNING'
};

/**
 * Test Categories
 */
const TEST_CATEGORIES = {
  BINDING: { icon: Database, color: '#3b82f6', label: 'Data Binding' },
  TRIGGER: { icon: Zap, color: '#f59e0b', label: 'Triggers' },
  VARIABLE: { icon: Variable, color: '#8b5cf6', label: 'Variables' },
  NAVIGATION: { icon: ArrowRight, color: '#10b981', label: 'Navigation' },
  WIDGET: { icon: Box, color: '#06b6d4', label: 'Widgets' },
  INTERACTION: { icon: MousePointer, color: '#ec4899', label: 'Interactions' }
};

/**
 * Run Basic Widget Validation Tests
 */
export function runWidgetValidationTests(steps) {
  const results = [];

  if (!steps || !Array.isArray(steps)) {
    results.push({
      id: 'steps_exist',
      name: 'App Steps Existence',
      category: 'WIDGET',
      status: TEST_STATUS.FAIL,
      message: 'No steps found in app configuration',
      suggestions: ['Add at least one screen to your app']
    });
    return results;
  }

  // Test 1: Check if there are screens
  results.push({
    id: 'steps_exist',
    name: 'App Screens Existence',
    category: 'WIDGET',
    status: steps.length > 0 ? TEST_STATUS.PASS : TEST_STATUS.FAIL,
    message: steps.length > 0
      ? `Found ${steps.length} screen(s)`
      : 'No screens found in app',
    suggestions: steps.length === 0
      ? ['Add at least one screen using Copilot or manually']
      : []
  });

  // Test 2: Check widgets in each screen
  steps.forEach((step, stepIndex) => {
    const widgetCount = (step.components || []).length;
    results.push({
      id: `widgets_count_${step.id}`,
      name: `Screen "${step.title || `Screen ${stepIndex + 1}`}" Widgets`,
      category: 'WIDGET',
      status: widgetCount > 0 ? TEST_STATUS.PASS : TEST_STATUS.WARNING,
      message: widgetCount > 0
        ? `Has ${widgetCount} widget(s)`
        : 'No widgets on this screen',
      suggestions: widgetCount === 0
        ? ['Add widgets like buttons, inputs, or text to this screen']
        : []
    });

    // Check each widget
    (step.components || []).forEach((widget, widgetIndex) => {
      const widgetId = widget.id || `widget_${widgetIndex}`;

      // Test widget has required properties
      results.push({
        id: `widget_props_${widgetId}`,
        name: `Widget "${widget.displayName || widget.type}" Properties`,
        category: 'WIDGET',
        status: widget.x !== undefined && widget.y !== undefined
          ? TEST_STATUS.PASS
          : TEST_STATUS.WARNING,
        message: widget.x !== undefined && widget.y !== undefined
          ? 'Widget has valid position'
          : 'Widget position might be undefined',
        widgetId,
        suggestions: widget.x === undefined || widget.y === undefined
          ? ['Check widget position in canvas']
          : []
      });
    });
  });

  return results;
}

/**
 * Run Binding Validation Tests
 */
export function runBindingValidationTests(steps, tables, recordPlaceholders) {
  const results = [];

  if (!steps) return results;

  const inputWidgets = ['TEXT_INPUT', 'NUMBER_INPUT', 'DROPDOWN', 'CHECKBOX', 'RADIO_GROUP', 'DATE_PICKER', 'DATETIME_PICKER', 'TEXT_AREA'];
  const outputWidgets = ['LABEL', 'TEXT', 'KPI', 'CHART', 'TABLE', 'GAUGE', 'PROGRESS_BAR'];

  steps.forEach((step, stepIndex) => {
    const stepName = step.title || `Screen ${stepIndex + 1}`;

    (step.components || []).forEach((widget) => {
      const widgetId = widget.id || widget.displayName || widget.type;

      // Test input widgets binding
      if (inputWidgets.includes(widget.type)) {
        const hasBinding = !!widget.props?.targetVariable;
        const hasTableId = !!widget.props?.tableId;

        results.push({
          id: `binding_input_${widgetId}`,
          name: `"${widgetId}" Data Binding`,
          category: 'BINDING',
          status: hasBinding || hasTableId ? TEST_STATUS.PASS : TEST_STATUS.WARNING,
          message: hasBinding
            ? `Bound to variable: ${widget.props.targetVariable}`
            : hasTableId
              ? `Connected to table: ${widget.props.tableId}`
              : 'No data binding configured',
          widgetId: widget.id,
          suggestions: !hasBinding && !hasTableId
            ? [
                `Bind "${widgetId}" to a variable or table column`,
                'Use Copilot: "Bind widget [name] to table [table]"'
              ]
            : []
        });
      }

      // Test output widgets binding
      if (outputWidgets.includes(widget.type)) {
        const hasBinding = !!widget.props?.targetVariable;

        results.push({
          id: `binding_output_${widgetId}`,
          name: `"${widgetId}" Data Display`,
          category: 'BINDING',
          status: hasBinding ? TEST_STATUS.PASS : TEST_STATUS.WARNING,
          message: hasBinding
            ? `Displays variable: ${widget.props.targetVariable}`
            : 'No variable binding - displays static text only',
          widgetId: widget.id,
          suggestions: !hasBinding
            ? [
                `Bind "${widgetId}" to a variable to display dynamic data`,
                'Use Copilot: "Connect [widget] to show [variable]"'
              ]
            : []
        });
      }
    });
  });

  return results;
}

/**
 * Run Trigger Validation Tests
 */
export function runTriggerValidationTests(steps) {
  const results = [];

  if (!steps) return results;

  const triggerableWidgets = ['BUTTON', 'ICON_BUTTON', 'TOUCH_ICON', 'COMPLETE_BUTTON'];
  const interactiveWidgets = ['TEXT_INPUT', 'NUMBER_INPUT', 'DROPDOWN', 'CHECKBOX', 'RADIO_GROUP', 'TOGGLE', 'SLIDER'];

  steps.forEach((step, stepIndex) => {
    const stepName = step.title || `Screen ${stepIndex + 1}`;

    (step.components || []).forEach((widget) => {
      const widgetId = widget.id || widget.displayName || widget.type;

      // Test button triggers
      if (triggerableWidgets.includes(widget.type)) {
        const triggers = widget.props?.triggers || [];

        results.push({
          id: `trigger_button_${widgetId}`,
          name: `"${widgetId}" Trigger Actions`,
          category: 'TRIGGER',
          status: triggers.length > 0 ? TEST_STATUS.PASS : TEST_STATUS.WARNING,
          message: triggers.length > 0
            ? `Has ${triggers.length} trigger(s): ${triggers.map(t => t.event).join(', ')}`
            : 'No triggers configured - button will do nothing',
          widgetId: widget.id,
          suggestions: triggers.length === 0
            ? [
                `Add trigger to "${widgetId}" for user interaction`,
                'Use Copilot: "Add trigger ON_CLICK to button [name]"'
              ]
            : []
        });
      }

      // Test interactive widget triggers
      if (interactiveWidgets.includes(widget.type)) {
        const triggers = widget.props?.triggers || [];

        results.push({
          id: `trigger_interactive_${widgetId}`,
          name: `"${widgetId}" Change Triggers`,
          category: 'TRIGGER',
          status: triggers.length > 0 ? TEST_STATUS.PASS : TEST_STATUS.SKIP,
          message: triggers.length > 0
            ? `Has ${triggers.length} trigger(s) for value changes`
            : 'Optional: Add triggers for value change events',
          widgetId: widget.id,
          suggestions: []
        });
      }
    });
  });

  return results;
}

/**
 * Run Variable Validation Tests
 */
export function runVariableValidationTests(appVariables, steps) {
  const results = [];

  // Test variables existence
  results.push({
    id: 'variables_exist',
    name: 'App Variables Configuration',
    category: 'VARIABLE',
    status: appVariables && appVariables.length > 0 ? TEST_STATUS.PASS : TEST_STATUS.SKIP,
    message: appVariables && appVariables.length > 0
      ? `Found ${appVariables.length} variable(s)`
      : 'No variables configured (optional)',
    suggestions: []
  });

  if (!appVariables || !steps) return results;

  // Check if bound variables exist
  const varNames = new Set(appVariables.map(v => v.name));

  steps.forEach((step, stepIndex) => {
    (step.components || []).forEach((widget) => {
      const binding = widget.props?.targetVariable;

      if (binding && !varNames.has(binding)) {
        results.push({
          id: `var_missing_${widget.id}`,
          name: `Variable "${binding}" Not Found`,
          category: 'VARIABLE',
          status: TEST_STATUS.FAIL,
          message: `Widget "${widget.displayName || widget.type}" references "${binding}" but it doesn't exist`,
          widgetId: widget.id,
          suggestions: [
            `Create variable "${binding}" in Variables panel`,
            'Use Copilot: "Create variable [name] type TEXT/NUMBER"'
          ]
        });
      }
    });
  });

  return results;
}

/**
 * Run Navigation Validation Tests
 */
export function runNavigationValidationTests(steps) {
  const results = [];

  if (!steps || steps.length <= 1) {
    if (steps && steps.length === 1) {
      results.push({
        id: 'nav_single_screen',
        name: 'Single Screen App',
        category: 'NAVIGATION',
        status: TEST_STATUS.PASS,
        message: 'Single screen app - no navigation needed',
        suggestions: []
      });
    }
    return results;
  }

  const stepIds = new Set(steps.map(s => s.id));
  const navTargets = new Set();

  // Find all navigation targets
  steps.forEach(step => {
    (step.components || []).forEach(widget => {
      const triggers = widget.props?.triggers || [];
      triggers.forEach(trigger => {
        (trigger.actions || []).forEach(action => {
          if (action.type === 'GO_TO_STEP') {
            navTargets.add(action.stepId);
          }
        });
      });
    });
  });

  // Check if all navigation targets exist
  navTargets.forEach(targetId => {
    if (!stepIds.has(targetId)) {
      results.push({
        id: `nav_missing_${targetId}`,
        name: `Navigation Target Not Found`,
        category: 'NAVIGATION',
        status: TEST_STATUS.FAIL,
        message: `Navigation targets "${targetId}" but this screen doesn't exist`,
        suggestions: [
          `Create screen with ID "${targetId}"`,
          'Check trigger actions in your navigation buttons'
        ]
      });
    }
  });

  // Check for orphan screens (no navigation to them)
  const reachableScreens = new Set(['BASE']); // BASE is always reachable
  navTargets.forEach(t => reachableScreens.add(t));

  steps.forEach(step => {
    if (!reachableScreens.has(step.id)) {
      results.push({
        id: `nav_orphan_${step.id}`,
        name: `Orphan Screen: "${step.title || step.id}"`,
        category: 'NAVIGATION',
        status: TEST_STATUS.WARNING,
        message: 'No navigation leads to this screen',
        suggestions: [
          `Add button with GO_TO_STEP to "${step.title || step.id}"`,
          'Use Copilot: "Add navigation button to screen [name]"'
        ]
      });
    }
  });

  return results;
}

/**
 * Run All Tests
 */
export function runAllTests({ steps, tables, recordPlaceholders, appVariables }) {
  const allResults = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      skipped: 0
    },
    tests: [],
    byCategory: {}
  };

  // Run all test suites
  const testSuites = [
    runWidgetValidationTests(steps),
    runBindingValidationTests(steps, tables, recordPlaceholders),
    runTriggerValidationTests(steps),
    runVariableValidationTests(appVariables, steps),
    runNavigationValidationTests(steps)
  ];

  // Merge results
  testSuites.forEach(suite => {
    suite.forEach(test => {
      allResults.tests.push(test);

      // Count by category
      if (!allResults.byCategory[test.category]) {
        allResults.byCategory[test.category] = [];
      }
      allResults.byCategory[test.category].push(test);
    });
  });

  // Calculate summary
  allResults.tests.forEach(test => {
    allResults.summary.total++;
    switch (test.status) {
      case TEST_STATUS.PASS: allResults.summary.passed++; break;
      case TEST_STATUS.FAIL: allResults.summary.failed++; break;
      case TEST_STATUS.WARNING: allResults.summary.warnings++; break;
      case TEST_STATUS.SKIP: allResults.summary.skipped++; break;
    }
  });

  return allResults;
}

/**
 * Interactive Test Simulation - Simulates user interactions
 */
export function simulateUserInteraction(widget, interactionType, appVariables, setVariable, showToast) {
  const results = [];

  const logResult = (success, message) => {
    results.push({ success, message, widget: widget.id || widget.displayName });
    if (showToast) {
      showToast(message, success ? 'success' : 'error');
    }
    return results;
  };

  switch (interactionType) {
    case 'CLICK':
      // Simulate button click
      if (widget.type === 'BUTTON' || widget.type === 'COMPLETE_BUTTON') {
        const triggers = widget.props?.triggers || [];
        if (triggers.length > 0) {
          logResult(true, `✓ Button "${widget.displayName}" clicked - ${triggers.length} trigger(s) will fire`);
          triggers.forEach(trigger => {
            logResult(true, `  → ${trigger.event}: ${(trigger.actions || []).length} action(s)`);
          });
        } else {
          logResult(false, `✗ Button "${widget.displayName}" clicked but has no triggers`);
        }
      }
      break;

    case 'INPUT':
      // Simulate text input
      if (widget.type === 'TEXT_INPUT') {
        const binding = widget.props?.targetVariable;
        if (binding && setVariable) {
          setVariable(binding, 'Test Value');
          logResult(true, `✓ Input "${widget.displayName}" set to "Test Value" → Variable "${binding}"`);
        } else {
          logResult(false, `✗ Input "${widget.displayName}" has no variable binding`);
        }
      }
      break;

    case 'SUBMIT':
      // Simulate form submit
      logResult(true, `✓ Form submission triggered`);
      break;

    case 'NAVIGATE':
      // Simulate navigation
      logResult(true, `✓ Navigation triggered`);
      break;
  }

  return results;
}

/**
 * AppTestingPanel Component - Interactive Testing UI
 */
export function AppTestingPanel({
  appConfig,
  onRunTests,
  onSimulateInteraction,
  testResults,
  isRunning
}) {
  const [expandedCategories, setExpandedCategories] = useState(new Set(['WIDGET', 'BINDING', 'TRIGGER']));
  const [expandedTests, setExpandedTests] = useState(new Set());
  const [interactionLog, setInteractionLog] = useState([]);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const toggleTest = (testId) => {
    setExpandedTests(prev => {
      const next = new Set(prev);
      if (next.has(testId)) {
        next.delete(testId);
      } else {
        next.add(testId);
      }
      return next;
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case TEST_STATUS.PASS:
        return <CheckCircle2 size={16} color="#10b981" />;
      case TEST_STATUS.FAIL:
        return <XCircle size={16} color="#ef4444" />;
      case TEST_STATUS.WARNING:
        return <AlertTriangle size={16} color="#f59e0b" />;
      case TEST_STATUS.SKIP:
        return <span style={{ fontSize: '12px', opacity: 0.5 }}>○</span>;
      default:
        return <Loader2 size={16} className="animate-spin" color="#3b82f6" />;
    }
  };

  const runTest = async () => {
    setInteractionLog([]);
    if (onRunTests) {
      await onRunTests();
    }
  };

  return (
    <div style={{
      backgroundColor: '#0f172a',
      borderRadius: '16px',
      overflow: 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif"
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc' }}>
              App Testing Mode
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
              Validate & test your app functionality
            </div>
          </div>
        </div>

        <button
          onClick={runTest}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            background: isRunning
              ? 'rgba(99,102,241,0.3)'
              : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            border: 'none',
            color: 'white',
            fontSize: '13px',
            fontWeight: 700,
            cursor: isRunning ? 'default' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
        >
          {isRunning ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Running Tests...
            </>
          ) : (
            <>
              <Play size={14} />
              Run All Tests
            </>
          )}
        </button>
      </div>

      {/* Summary Cards */}
      {testResults && (
        <div style={{
          padding: '16px 20px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)'
        }}>
          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981' }}>
              {testResults.summary.passed}
            </div>
            <div style={{ fontSize: '11px', color: '#6ee7b7' }}>Passed</div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444' }}>
              {testResults.summary.failed}
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5' }}>Failed</div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#f59e0b' }}>
              {testResults.summary.warnings}
            </div>
            <div style={{ fontSize: '11px', color: '#fcd34d' }}>Warnings</div>
          </div>

          <div style={{
            padding: '12px',
            borderRadius: '10px',
            background: 'rgba(59,130,246,0.15)',
            border: '1px solid rgba(59,130,246,0.3)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#3b82f6' }}>
              {testResults.summary.total}
            </div>
            <div style={{ fontSize: '11px', color: '#93c5fd' }}>Total Tests</div>
          </div>
        </div>
      )}

      {/* Test Results by Category */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {testResults && Object.entries(testResults.byCategory).map(([category, tests]) => {
          const CategoryInfo = TEST_CATEGORIES[category] || TEST_CATEGORIES.WIDGET;
          const isExpanded = expandedCategories.has(category);
          const categoryPassed = tests.filter(t => t.status === TEST_STATUS.PASS).length;
          const categoryFailed = tests.filter(t => t.status === TEST_STATUS.FAIL).length;
          const categoryWarnings = tests.filter(t => t.status === TEST_STATUS.WARNING).length;

          return (
            <div key={category} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {/* Category Header */}
              <div
                onClick={() => toggleCategory(category)}
                style={{
                  padding: '12px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CategoryInfo.icon size={18} color={CategoryInfo.color} />
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#f1f5f9' }}>
                    {CategoryInfo.label}
                  </span>
                  <span style={{
                    fontSize: '11px',
                    color: '#64748b',
                    background: 'rgba(255,255,255,0.1)',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {tests.length}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px' }}>
                    {categoryPassed > 0 && (
                      <span style={{ color: '#10b981' }}>✓ {categoryPassed}</span>
                    )}
                    {categoryFailed > 0 && (
                      <span style={{ color: '#ef4444' }}>✗ {categoryFailed}</span>
                    )}
                    {categoryWarnings > 0 && (
                      <span style={{ color: '#f59e0b' }}>⚠ {categoryWarnings}</span>
                    )}
                  </div>
                  {isExpanded ? (
                    <ChevronDown size={16} color="#64748b" />
                  ) : (
                    <ChevronRight size={16} color="#64748b" />
                  )}
                </div>
              </div>

              {/* Category Tests */}
              {isExpanded && tests.map((test, idx) => (
                <div
                  key={test.id}
                  style={{
                    padding: '10px 20px 10px 48px',
                    borderTop: idx === 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getStatusIcon(test.status)}
                    <span style={{ fontSize: '12px', color: '#e2e8f0', flex: 1 }}>
                      {test.name}
                    </span>
                    {test.suggestions?.length > 0 && (
                      <button
                        onClick={() => toggleTest(test.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#6366f1',
                          fontSize: '11px',
                          cursor: 'pointer',
                          padding: '2px 6px',
                          borderRadius: '4px'
                        }}
                      >
                        {expandedTests.has(test.id) ? 'Hide' : 'Fix'}
                      </button>
                    )}
                  </div>

                  <div style={{
                    fontSize: '11px',
                    color: test.status === TEST_STATUS.PASS ? '#10b981' :
                           test.status === TEST_STATUS.FAIL ? '#ef4444' : '#f59e0b',
                    paddingLeft: '24px'
                  }}>
                    {test.message}
                  </div>

                  {expandedTests.has(test.id) && test.suggestions?.length > 0 && (
                    <div style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginLeft: '24px'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#a5b4fc', marginBottom: '6px' }}>
                        💡 Suggestions:
                      </div>
                      {test.suggestions.map((sug, i) => (
                        <div key={i} style={{ fontSize: '11px', color: '#c7d2fe', marginBottom: '4px' }}>
                          • {sug}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Interaction Log */}
      {interactionLog.length > 0 && (
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)'
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#f8fafc', marginBottom: '10px' }}>
            📝 Interaction Log
          </div>
          <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
            {interactionLog.map((log, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: '11px',
                  color: log.success ? '#10b981' : '#ef4444',
                  marginBottom: '4px'
                }}
              >
                {log.success ? '✓' : '✗'} {log.message}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


