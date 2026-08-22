/**
 * Mandor App Health & Self-Healing Utility
 * Scans the app state for inconsistencies and proposes fixes.
 */

export const checkAppHealth = (appState) => {
  const issues = [];
  const { steps, baseComponents, appVariables } = appState;
  
  const allComponents = [
    ...baseComponents,
    ...steps.flatMap(s => s.components)
  ];
  
  const variableNames = appVariables.map(v => v.name);

  // 1. Check for broken variable references in props
  allComponents.forEach(comp => {
    Object.entries(comp.props).forEach(([key, value]) => {
      if (typeof value === 'string' && value.includes('{{')) {
        const matches = value.match(/{{(.*?)}}/g);
        if (matches) {
          matches.forEach(m => {
            const varName = m.replace('{{', '').replace('}}', '').trim();
            if (!variableNames.includes(varName) && !varName.includes('.')) {
              issues.push({
                type: 'MISSING_VARIABLE',
                severity: 'HIGH',
                compId: comp.id,
                compName: comp.displayName || comp.type,
                message: `Widget references missing variable: ${varName}`,
                fix: {
                  type: 'CREATE_VARIABLE',
                  payload: { name: varName, type: 'TEXT', defaultValue: '' }
                }
              });
            }
          });
        }
      }
    });
  });

  // 2. Check for overlapping widgets (potential layout issues)
  // (Simple implementation for now)
  
  // 3. Check for invalid table references in datasources
  
  return issues;
};

export const proposeSelfHealingCommands = (issues) => {
  return issues.map(issue => issue.fix).filter(Boolean);
};
