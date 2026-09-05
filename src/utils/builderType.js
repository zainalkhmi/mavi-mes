/**
 * builderType.js
 * Centralized definition, metadata, detection, and compatibility check for the 3 MaviCore builders:
 * 1. Mavi Builder (PC / Desktop Workstation Canvas) -> 'app_builder'
 * 2. Gluestack Builder (Mobile / Tablet UI Engine Studio) -> 'gluestack'
 * 3. Sandbox Builder (Generative AI Live Sandbox) -> 'sandbox'
 */

export const BUILDER_TYPES = {
  MAVI: 'app_builder',
  APP_BUILDER: 'app_builder',
  GLUESTACK: 'gluestack',
  SANDBOX: 'sandbox'
};

export const BUILDER_METADATA = {
  app_builder: {
    key: 'app_builder',
    label: 'Mavi Builder',
    title: 'PC — Mavi App Builder',
    shortLabel: 'Mavi Builder',
    badge: 'PC / Desktop',
    color: '#2563eb', // Blue
    bgColor: '#eff6ff',
    borderColor: '#bfdbfe',
    route: '/builder',
    getEditUrl: (appId) => `/#/builder?appId=${encodeURIComponent(appId)}`
  },
  gluestack: {
    key: 'gluestack',
    label: 'Gluestack',
    title: 'Mobile — Gluestack App Builder',
    shortLabel: 'Gluestack',
    badge: 'Mobile / Tablet',
    color: '#7c3aed', // Purple
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    route: '/ui-engine',
    getEditUrl: (appId) => `/#/ui-engine?appId=${encodeURIComponent(appId)}`
  },
  sandbox: {
    key: 'sandbox',
    label: 'Sandbox',
    title: 'Generatif — Sandbox App Builder',
    shortLabel: 'Sandbox',
    badge: 'Generatif AI',
    color: '#d97706', // Amber / Orange
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    route: '/sandbox',
    getEditUrl: (appId) => `/#/sandbox?appId=${encodeURIComponent(appId)}`
  }
};

/**
 * Accurately detect builder type of an application.
 * Handles both new apps with explicit builder_type and legacy apps.
 * @param {object} app
 * @returns {'app_builder' | 'gluestack' | 'sandbox'}
 */
export function getAppBuilderType(app) {
  if (!app) return BUILDER_TYPES.MAVI;

  const rawType = String(app.builder_type || '').toLowerCase().trim();
  if (rawType === 'gluestack') return BUILDER_TYPES.GLUESTACK;
  if (rawType === 'sandbox' || rawType === 'vibe_sandpack') return BUILDER_TYPES.SANDBOX;
  if (rawType === 'app_builder' || rawType === 'mavi' || rawType === 'mavi_builder') return BUILDER_TYPES.MAVI;

  // Legacy heuristics if builder_type was null/undefined
  const config = app.config || {};
  if (config.appType === 'vibe_sandpack' || config.vibeCode || (app.description && app.description.includes('Sandpack Vibe Engine'))) {
    return BUILDER_TYPES.SANDBOX;
  }

  if (
    app.category === 'GlueStack App' ||
    (Array.isArray(config.components) && !config.steps && !config.baseComponents) ||
    (app.name && app.name.toLowerCase().includes('gluestack'))
  ) {
    return BUILDER_TYPES.GLUESTACK;
  }

  return BUILDER_TYPES.MAVI;
}

/**
 * Returns metadata for the given builder type or app.
 * @param {string | object} appOrType
 */
export function getBuilderInfo(appOrType) {
  const type = typeof appOrType === 'object' ? getAppBuilderType(appOrType) : (appOrType || BUILDER_TYPES.MAVI);
  return BUILDER_METADATA[type] || BUILDER_METADATA[BUILDER_TYPES.MAVI];
}

/**
 * Checks if the target builder can open the application.
 * Applications from one builder cannot be opened by another.
 * @param {string} targetBuilder - 'app_builder' | 'gluestack' | 'sandbox'
 * @param {object} app
 * @returns {boolean}
 */
export function canBuilderOpenApp(targetBuilder, app) {
  if (!app) return false;
  const appBuilderType = getAppBuilderType(app);
  return targetBuilder === appBuilderType;
}

/**
 * Generates an incompatibility report with details and navigation advice.
 * @param {string} targetBuilder - The builder trying to open the app
 * @param {object} app - The app being opened
 * @returns {{ allowed: boolean, appBuilderType: string, appBuilderLabel: string, targetBuilderLabel: string, recommendedUrl: string, message: string }}
 */
export function checkBuilderCompatibility(targetBuilder, app) {
  const appBuilderType = getAppBuilderType(app);
  const isAllowed = targetBuilder === appBuilderType;
  const appMeta = getBuilderInfo(appBuilderType);
  const targetMeta = getBuilderInfo(targetBuilder);

  return {
    allowed: isAllowed,
    appBuilderType,
    appBuilderLabel: appMeta.label,
    targetBuilderLabel: targetMeta.label,
    recommendedUrl: appMeta.getEditUrl(app.id || ''),
    message: isAllowed
      ? 'Aplikasi kompatibel dengan builder ini.'
      : `Aplikasi "${app.name || 'Untitled'}" dibuat menggunakan ${appMeta.label} (${appMeta.badge}) dan tidak dapat dibuka di ${targetMeta.label}.`
  };
}
