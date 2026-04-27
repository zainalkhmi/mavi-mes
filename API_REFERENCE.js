/**
 * PROJECT MANAGEMENT API REFERENCE
 * 
 * Complete API documentation for projectManagement.js
 * Last Updated: 27 April 2026
 */

// ============================================================================
// IMPORT
// ============================================================================

import * as projectMgmt from '../utils/projectManagement';
// atau
import ProjectManager from '../components/ProjectManager';

// ============================================================================
// 1. EXPORT FUNCTIONS
// ============================================================================

/**
 * Export single project to JSON file
 * @param {Object} app - Complete project object
 * @param {string} [filename] - Optional custom filename (without .json)
 * @returns {Promise<{success: boolean, filename: string}>}
 * 
 * @example
 * await projectMgmt.exportProjectToJSON(currentApp);
 * // Downloads: MyApp-1682522400000.json
 * 
 * await projectMgmt.exportProjectToJSON(app, 'backup-v1');
 * // Downloads: backup-v1.json
 */
async function exportProjectToJSON(app, filename = null) { }

/**
 * Export multiple projects to single JSON file
 * @param {Array<Object>} apps - Array of project objects
 * @returns {Promise<{success: boolean, count: number}>}
 * 
 * @example
 * const apps = [app1, app2, app3];
 * await projectMgmt.exportMultipleProjects(apps);
 * // Downloads: projects-backup-1682522400000.json
 */
async function exportMultipleProjects(apps) { }

/**
 * Export project summary to CSV file
 * @param {Object} app - Project object
 * @returns {Promise<{success: boolean, filename: string}>}
 * 
 * @example
 * await projectMgmt.exportProjectAsCSV(app);
 * // Downloads: MyApp-summary-1682522400000.csv
 * // Contains: Project info, component counts, component types
 */
async function exportProjectAsCSV(app) { }

// ============================================================================
// 2. IMPORT FUNCTIONS
// ============================================================================

/**
 * Import project from JSON file
 * @param {File} file - JSON file from file input
 * @returns {Promise<{success: boolean, data: Object}>}
 * @throws {Error} If file is invalid or format doesn't match
 * 
 * @example
 * const fileInput = document.querySelector('input[type="file"]');
 * const file = fileInput.files[0];
 * const result = await projectMgmt.importProjectFromJSON(file);
 * 
 * if (result.success) {
 *   // result.data contains imported project data
 *   handleImportProject(result.data);
 * }
 */
async function importProjectFromJSON(file) { }

// ============================================================================
// 3. DUPLICATION
// ============================================================================

/**
 * Create duplicate/clone of project
 * @param {Object} app - Original project object
 * @param {string} [newName] - Optional new name (default: "Original (Copy)")
 * @returns {Object} New project data without ID
 * 
 * @example
 * const cloned = projectMgmt.duplicateProject(app, 'My New App');
 * // Returns new project with custom name
 * 
 * // Then save it
 * const saved = await saveFrontlineApp(cloned);
 */
function duplicateProject(app, newName = null) { }

// ============================================================================
// 4. BACKUP FUNCTIONS
// ============================================================================

/**
 * Create backup of project to browser localStorage
 * Maintains max 5 backups per project
 * @param {Object} app - Project object (must have id)
 * @returns {Promise<{success: boolean, backupKey: string, time: string}>}
 * @throws {Error} If project invalid
 * 
 * @example
 * const backup = await projectMgmt.backupProjectToLocalStorage(app);
 * console.log(backup.backupKey);  // 'project_backup_app_123_1'
 * console.log(backup.time);       // '2026-04-27T10:00:00Z'
 */
async function backupProjectToLocalStorage(app) { }

/**
 * Get list of all backups for a project
 * @param {string} appId - Project ID
 * @returns {Array<{time: string, key: string, displayTime: string}>}
 * 
 * @example
 * const backups = projectMgmt.getProjectBackups('app_123');
 * // Returns:
 * // [
 * //   { 
 * //     time: '2026-04-27T10:00:00Z',
 * //     key: 'project_backup_app_123_1',
 * //     displayTime: '4/27/2026, 10:00:00 AM'
 * //   },
 * //   { ... }
 * // ]
 */
function getProjectBackups(appId) { }

/**
 * Restore project from backup
 * @param {string} appId - Project ID
 * @param {string} backupKey - Backup key (from getProjectBackups)
 * @returns {Promise<{success: boolean, data: Object}>}
 * @throws {Error} If backup not found
 * 
 * @example
 * const restored = await projectMgmt.restoreProjectFromBackup(
 *   'app_123',
 *   'project_backup_app_123_1'
 * );
 * // Returns restored project data
 */
async function restoreProjectFromBackup(appId, backupKey) { }

/**
 * Delete specific backup
 * @param {string} appId - Project ID
 * @param {string} backupKey - Backup key to delete
 * @returns {Promise<{success: boolean}>}
 * 
 * @example
 * await projectMgmt.deleteBackup('app_123', 'project_backup_app_123_1');
 */
async function deleteBackup(appId, backupKey) { }

// ============================================================================
// 5. DRAFT / AUTO-SAVE FUNCTIONS
// ============================================================================

/**
 * Auto-save project draft to localStorage
 * Call this on every significant change
 * @param {Object} app - Project object (must have id)
 * @returns {void}
 * 
 * @example
 * const draft = {
 *   id: 'app_123',
 *   name: 'MyApp',
 *   config: { ... },
 *   ...
 * };
 * projectMgmt.autoSaveDraft(draft);
 * 
 * // In component state update:
 * useEffect(() => {
 *   if (currentAppId) {
 *     projectMgmt.autoSaveDraft({
 *       id: currentAppId,
 *       name: appName,
 *       config: { baseComponents, steps, ... }
 *     });
 *   }
 * }, [appName, baseComponents, steps]); // On change
 */
function autoSaveDraft(app) { }

/**
 * Retrieve auto-saved draft for project
 * @param {string} appId - Project ID
 * @returns {Object|null} Draft data or null if not found
 * 
 * @example
 * const draft = projectMgmt.getAutoSavedDraft('app_123');
 * if (draft) {
 *   console.log('Found draft from', draft.lastAutoSave);
 *   // Load draft into editor
 * }
 */
function getAutoSavedDraft(appId) { }

/**
 * Clear auto-saved draft
 * @param {string} appId - Project ID
 * @returns {{success: boolean}}
 * 
 * @example
 * projectMgmt.clearAutoSavedDraft('app_123');
 */
function clearAutoSavedDraft(appId) { }

// ============================================================================
// 6. VALIDATION
// ============================================================================

/**
 * Validate project data integrity
 * @param {Object} app - Project object
 * @returns {{isValid: boolean, issues: Array<string>}}
 * 
 * @example
 * const validation = projectMgmt.validateProjectData(app);
 * if (!validation.isValid) {
 *   console.error('Project has issues:', validation.issues);
 *   // Issues: ['Project ID hilang', '3 komponen memiliki type yang hilang']
 * }
 */
function validateProjectData(app) { }

// ============================================================================
// 7. TYPESCRIPT TYPES (Reference)
// ============================================================================

/**
 * @typedef {Object} ProjectObject
 * @property {string} id - Unique project ID
 * @property {string} name - Project name
 * @property {string} [category] - Project category (default: 'Shop Floor')
 * @property {string} [description] - Project description
 * @property {number} [version] - Version number
 * @property {string} [approval_status] - Status: DRAFT, PENDING, APPROVED, PUBLISHED
 * @property {boolean} [is_published] - Published flag
 * @property {Date} [created_at] - Creation timestamp
 * @property {Date} [updated_at] - Update timestamp
 * @property {Object} config - Project configuration
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {Array} steps - App steps/screens
 * @property {Array} baseComponents - UI components
 * @property {Array} appTriggers - Event triggers
 * @property {Array} appVariables - Variables
 * @property {Array} appFunctions - Functions
 * @property {Array} appTables - Data tables
 * @property {Array} recordPlaceholders - Record links
 * @property {string|null} materialId - Material reference
 * @property {string} productImage - Image URL
 * @property {Object} iotConfig - IoT configuration
 * @property {Array} integrationConnectors - API connectors
 * @property {string} appBackgroundColor - Background color
 * @property {string} appThemeMode - Theme: light/dark
 * @property {boolean} leftSidebarEnabled
 * @property {boolean} rightSidebarEnabled
 * @property {boolean} copilotEnabled
 * @property {boolean} stepListEnabled
 */

/**
 * @typedef {Object} BackupInfo
 * @property {string} key - Backup storage key
 * @property {string} time - ISO timestamp
 * @property {string} displayTime - Formatted display time
 */

// ============================================================================
// 8. USAGE IN APPBUILDER
// ============================================================================

/**
 * AppBuilder Handler Functions
 */

// Handler for importing project
async function handleImportProject(importedData) {
  // Set state from imported data
  setCurrentAppId(null);  // Reset ID for new project
  setAppName(importedData.name);
  setAppCategory(importedData.category);
  setSteps(importedData.config?.steps || []);
  setBaseComponents(importedData.config?.baseComponents || []);
  // ... set all other state
  
  alert('Project imported successfully! Click Save to save as new.');
}

// Handler for duplicating project
async function handleDuplicateProject(duplicatedData) {
  // Same as import, but with duplicate data
  handleImportProject(duplicatedData);
}

// Auto-save on component changes
useEffect(() => {
  if (currentAppId) {
    projectMgmt.autoSaveDraft({
      id: currentAppId,
      name: appName,
      category: appCategory,
      config: {
        steps, baseComponents, appTriggers, appVariables,
        appFunctions, appTables, recordPlaceholders,
        materialId, productImage, iotConfig,
        integrationConnectors, appBackgroundColor,
        appThemeMode, leftSidebarEnabled,
        rightSidebarEnabled, copilotEnabled,
        stepListEnabled
      }
    });
  }
}, [appName, baseComponents, steps]); // On significant changes

// Get current app for export
function getCurrentApp() {
  return {
    id: currentAppId,
    name: appName,
    category: appCategory,
    config: {
      steps, baseComponents, appTriggers, appVariables,
      appFunctions, appTables, recordPlaceholders,
      materialId, productImage, iotConfig,
      integrationConnectors, appBackgroundColor,
      appThemeMode, leftSidebarEnabled,
      rightSidebarEnabled, copilotEnabled,
      stepListEnabled
    },
    version: appMeta.version,
    approval_status: appMeta.approval_status,
    is_published: appMeta.is_published
  };
}

// ============================================================================
// 9. USAGE IN REACT COMPONENT
// ============================================================================

/**
 * ProjectManager Component Props
 * 
 * @example
 * <ProjectManager
 *   app={getCurrentApp()}
 *   onImport={handleImportProject}
 *   onDuplicate={handleDuplicateProject}
 *   onAppChange={handleAppChange}
 * />
 */

// Props:
// - app: {Object} Current project object (must have id)
// - onImport: {Function} Called when project imported
// - onDuplicate: {Function} Called when project duplicated
// - onAppChange: {Function} Called when app state should update

// ============================================================================
// 10. ERROR HANDLING
// ============================================================================

/**
 * Common Errors & Solutions
 */

// Error: "Project tidak valid untuk export"
// Solution: Ensure app object has id property
if (!app || !app.id) {
  console.error('Project tidak valid');
  return;
}

// Error: "Hanya file JSON yang didukung"
// Solution: Check file.name ends with .json
if (!file.name.endsWith('.json')) {
  console.error('Invalid file format');
  return;
}

// Error: "Format file tidak sesuai"
// Solution: Ensure JSON has 'project' and 'config' keys
const json = JSON.parse(content);
if (!json.project || !json.config) {
  console.error('Invalid project format');
  return;
}

// ============================================================================
// 11. STORAGE DETAILS
// ============================================================================

/**
 * localStorage Structure
 */

// Project Backups
localStorage['project_backup_app_123'] = JSON.stringify({
  id: 'app_123',
  name: 'ProjectName',
  backupTime: '2026-04-27T10:00:00Z',
  data: { /* full project */ }
});

// Backup Index
localStorage['project_backups'] = JSON.stringify({
  'app_123': [
    { time: '2026-04-27T10:00:00Z', key: 'project_backup_app_123_1' },
    { time: '2026-04-27T11:00:00Z', key: 'project_backup_app_123_2' }
  ]
});

// Auto-saved Draft
localStorage['draft_app_123'] = JSON.stringify({
  id: 'app_123',
  name: 'ProjectName',
  lastAutoSave: '2026-04-27T10:30:00Z',
  data: { /* full project */ }
});

// ============================================================================
// 12. EXAMPLES
// ============================================================================

/**
 * Complete Workflow Example
 */

async function completeWorkflow() {
  // 1. Get current app
  const currentApp = getCurrentApp();
  
  // 2. Create backup before major change
  const backup = await projectMgmt.backupProjectToLocalStorage(currentApp);
  console.log('Backup created:', backup.backupKey);
  
  // 3. Make changes...
  // ... modify components, triggers, etc ...
  
  // 4. Export for sharing
  await projectMgmt.exportProjectToJSON(currentApp, 'team-version');
  
  // 5. Create duplicate for testing
  const testDuplicate = projectMgmt.duplicateProject(currentApp, 'Testing');
  handleDuplicateProject(testDuplicate);
  
  // 6. If something goes wrong, restore
  const backups = projectMgmt.getProjectBackups(currentApp.id);
  if (backups.length > 0) {
    const restored = await projectMgmt.restoreProjectFromBackup(
      currentApp.id,
      backups[0].key
    );
    console.log('Restored from backup');
  }
}

/**
 * Auto-save Implementation
 */

function setupAutoSave(currentAppId) {
  // Save every 30 seconds
  setInterval(() => {
    if (currentAppId) {
      projectMgmt.autoSaveDraft({
        id: currentAppId,
        name: appName,
        config: { /* current config */ }
      });
    }
  }, 30000);
  
  // Or on specific changes
  const handleChange = (newValue) => {
    setComponentValue(newValue);
    projectMgmt.autoSaveDraft(getCurrentApp());
  };
}

/**
 * Recovery on App Load
 */

function setupRecoveryOnLoad() {
  useEffect(() => {
    if (currentAppId) {
      const draft = projectMgmt.getAutoSavedDraft(currentAppId);
      if (draft) {
        const confirmed = window.confirm(
          `Found auto-saved draft from ${draft.lastAutoSave}. Recover?`
        );
        if (confirmed) {
          handleImportProject(draft.data);
          projectMgmt.clearAutoSavedDraft(currentAppId);
        }
      }
    }
  }, [currentAppId]);
}

// ============================================================================
// END OF API REFERENCE
// ============================================================================
