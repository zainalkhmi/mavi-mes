export const hasAccess = (user, path) => {
  if (!user) return false;
  const role = user.role?.toUpperCase();
  
  // Account Owner: Access to everything
  if (role === 'ACCOUNT_OWNER') return true;
  
  // Administrator / ADMIN: All assets + User Access, but NO technical settings
  if (role === 'ADMINISTRATOR' || role === 'ADMIN') {
    return !['/supabase-settings'].includes(path);
  }

  // n8n webhook settings accessible by ACCOUNT_OWNER and ADMIN
  if (path === '/n8n-settings') {
    return role === 'ACCOUNT_OWNER' || role === 'ADMINISTRATOR' || role === 'ADMIN';
  }
  
  // Connector Supervisor: Build apps, manage connectors/functions, logic, analytics, console
  if (role === 'CONNECTOR_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/connectors', '/functions', '/automations', '/analytics', '/dashboards', '/reports', '/mcp-server',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet',
      '/player', '/terminal', '/plc-settings', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }
  
  // Station Supervisor: Build apps, manage stations/machines/devices/IoT/vision/analytics/console
  if (role === 'STATION_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/stations', '/display-devices', '/machines', '/edge-devices', '/iot-hub', '/vision', '/mcp-server',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/plc-settings', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }
  
  // Tulip Tables Supervisor: Build apps, manage Tables, analytics, console
  if (role === 'TABLES_SUPERVISOR') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/tables', '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }
  
  // Application Engineer: Build apps, variables, store, analytics, console
  if (role === 'APPLICATION_ENGINEER' || role === 'ENGINEER') {
    const allowed = [
      '/', '/builder', '/flutter-builder','/file-explorer', '/store', '/app-management', '/variables',
      '/checksheets', '/checksheet-management', '/checksheet-manager', '/inspector-designer', '/drawing-checksheet', '/qa-checksheet',
      '/analytics', '/dashboards', '/reports', '/player', '/terminal', '/voice-inspection', '/predictive-maintenance'
    ];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }

  // Viewer: App Store, Analytics, Dashboards, Console
  if (role === 'VIEWER') {
    const allowed = [
      '/', '/store', '/analytics', '/dashboards', '/reports', '/checksheets', '/checksheet-management', '/checksheet-manager',
      '/drawing-checksheet', '/qa-checksheet', '/player', '/terminal'
    ];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }
  
  // Station Operator / OPERATOR
  if (role === 'STATION_OPERATOR' || role === 'OPERATOR') {
    const allowed = ['/player', '/terminal'];
    return allowed.some(p => path === p || path.startsWith(p + '/'));
  }
  
  return false;
};
