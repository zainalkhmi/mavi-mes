export const hasAccess = (user, path) => {
  if (!user) return false;
  const role = user.role?.toUpperCase();
  const rawRole = user.role?.toLowerCase();

  // Account Owner: Access to everything
  if (role === 'ACCOUNT_OWNER' || rawRole === 'owner') return true;

  // Administrator / ADMIN
  if (role === 'ADMINISTRATOR' || role === 'ADMIN') {
    return !['/supabase-settings'].includes(path);
  }

  // n8n webhook settings accessible by ACCOUNT_OWNER and ADMIN
  if (path === '/n8n-settings') {
    return role === 'ACCOUNT_OWNER' || role === 'ADMINISTRATOR' || role === 'ADMIN';
  }

  // Connector Supervisor
  if (role === 'CONNECTOR_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/connectors', '/functions', '/automations', '/analytics', '/dashboards', '/reports', '/mcp-server',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet', '/simple-checksheet',
      '/drawing-management', '/plm-integration', '/plm',
      '/player', '/terminal', '/plc-settings', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.includes(path) || path.startsWith('/plm');
  }

  // Station Supervisor
  if (role === 'STATION_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/vision', '/mcp-server',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet', '/simple-checksheet',
      '/drawing-management', '/plm-integration', '/plm',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/plc-settings', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.includes(path) || path.startsWith('/plm');
  }

  // Tulip Tables Supervisor
  if (role === 'TABLES_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/tables', '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet', '/simple-checksheet',
      '/drawing-management', '/plm-integration', '/plm',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.includes(path) || path.startsWith('/plm');
  }

  // Application Engineer
  if (role === 'APPLICATION_ENGINEER' || role === 'ENGINEER') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet', '/simple-checksheet',
      '/drawing-management', '/plm-integration', '/plm',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.includes(path) || path.startsWith('/plm');
  }

  // Viewer
  if (role === 'VIEWER') {
    const allowed = [
      '/', '/store', '/analytics', '/dashboards', '/reports', '/checksheets', '/checksheet-management', '/checksheet-manager',
      '/drawing-checksheet', '/qa-checksheet', '/simple-checksheet', '/drawing-management', '/plm-integration', '/plm',
      '/player', '/terminal'
    ];
    return allowed.includes(path) || path.startsWith('/plm');
  }

  // Station Operator / OPERATOR
  if (role === 'STATION_OPERATOR' || role === 'OPERATOR') {
    const allowed = ['/player', '/terminal', '/simple-checksheet'];
    return allowed.includes(path);
  }

  return false;
};
