/**
 * projectManagement.js
 * Enhanced project management utilities for Mavi-MES
 * Features: Export, Import, Duplicate, Backup, Version History
 */

/**
 * Export a project to JSON file
 */
export const exportProjectToJSON = (app, filename = null) => {
  try {
    if (!app || !app.id) {
      throw new Error('Project tidak valid untuk export');
    }

    const projectData = {
      // Metadata
      metadata: {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0',
        exportVersion: 1
      },
      // Project Info
      project: {
        id: app.id,
        name: app.name,
        category: app.category || 'Shop Floor',
        description: app.description || '',
        version: app.version || 1,
        approval_status: app.approval_status || 'DRAFT',
        is_published: app.is_published || false
      },
      // Configuration
      config: app.config || {},
      // Timestamps
      timestamps: {
        created_at: app.created_at || new Date().toISOString(),
        updated_at: app.updated_at || new Date().toISOString()
      }
    };

    // Create JSON blob
    const jsonString = JSON.stringify(projectData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || `${app.name}-${Date.now()}.json`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[ProjectManagement] Project exported successfully:', link.download);
    return { success: true, filename: link.download };
  } catch (error) {
    console.error('[ProjectManagement] Export failed:', error);
    throw error;
  }
};

/**
 * Import a project from JSON file
 */
export const importProjectFromJSON = (file) => {
  return new Promise((resolve, reject) => {
    try {
      if (!file) {
        reject(new Error('File tidak dipilih'));
        return;
      }

      if (!file.name.endsWith('.json')) {
        reject(new Error('Hanya file JSON yang didukung'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target.result;
          const projectData = JSON.parse(content);

          // Validate imported data
          if (!projectData.project || !projectData.config) {
            reject(new Error('Format file tidak sesuai'));
            return;
          }

          // Return imported project (will need new ID when saved)
          resolve({
            success: true,
            data: {
              name: projectData.project.name,
              category: projectData.project.category,
              description: projectData.project.description,
              config: projectData.config,
              version: 1,
              approval_status: 'DRAFT',
              is_published: false,
              importedFrom: projectData.project.name,
              importedAt: new Date().toISOString()
            }
          });
        } catch (parseError) {
          reject(new Error('Gagal membaca file JSON: ' + parseError.message));
        }
      };

      reader.onerror = () => {
        reject(new Error('Gagal membaca file'));
      };

      reader.readAsText(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Duplicate/Clone a project
 */
export const duplicateProject = (app, newName = null) => {
  try {
    if (!app) {
      throw new Error('Project tidak valid untuk diduplikasi');
    }

    const duplicatedProject = {
      // Don't include ID - will be generated on save
      name: newName || `${app.name} (Copy)`,
      category: app.category || 'Shop Floor',
      description: app.description || '',
      config: JSON.parse(JSON.stringify(app.config || {})), // Deep copy
      version: 1,
      approval_status: 'DRAFT',
      is_published: false,
      clonedFrom: app.id,
      clonedAt: new Date().toISOString()
    };

    return duplicatedProject;
  } catch (error) {
    console.error('[ProjectManagement] Duplication failed:', error);
    throw error;
  }
};

/**
 * Create a backup of project to localStorage
 */
export const backupProjectToLocalStorage = (app) => {
  try {
    if (!app || !app.id) {
      throw new Error('Project tidak valid untuk backup');
    }

    const backupKey = `project_backup_${app.id}`;
    const backup = {
      id: app.id,
      name: app.name,
      backupTime: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(app))
    };

    // Store backup
    localStorage.setItem(backupKey, JSON.stringify(backup));

    // Also maintain a list of backups
    const backupList = JSON.parse(localStorage.getItem('project_backups') || '{}');
    if (!backupList[app.id]) {
      backupList[app.id] = [];
    }
    
    // Keep only last 5 backups per project
    const backups = backupList[app.id];
    backups.push({
      time: backup.backupTime,
      key: backupKey
    });
    
    if (backups.length > 5) {
      const removed = backups.shift();
      localStorage.removeItem(removed.key);
    }
    
    localStorage.setItem('project_backups', JSON.stringify(backupList));

    console.log('[ProjectManagement] Backup created:', backupKey);
    return { success: true, backupKey, time: backup.backupTime };
  } catch (error) {
    console.error('[ProjectManagement] Backup failed:', error);
    throw error;
  }
};

/**
 * Restore a project from backup
 */
export const restoreProjectFromBackup = (appId, backupKey) => {
  try {
    const backup = JSON.parse(localStorage.getItem(backupKey));
    
    if (!backup) {
      throw new Error('Backup tidak ditemukan');
    }

    return {
      success: true,
      data: backup.data
    };
  } catch (error) {
    console.error('[ProjectManagement] Restore failed:', error);
    throw error;
  }
};

/**
 * Get all backups for a project
 */
export const getProjectBackups = (appId) => {
  try {
    const backupList = JSON.parse(localStorage.getItem('project_backups') || '{}');
    const backups = backupList[appId] || [];
    
    return backups.map(backup => ({
      ...backup,
      displayTime: new Date(backup.time).toLocaleString()
    }));
  } catch (error) {
    console.error('[ProjectManagement] Failed to get backups:', error);
    return [];
  }
};

/**
 * Delete a backup
 */
export const deleteBackup = (appId, backupKey) => {
  try {
    localStorage.removeItem(backupKey);
    
    const backupList = JSON.parse(localStorage.getItem('project_backups') || '{}');
    if (backupList[appId]) {
      backupList[appId] = backupList[appId].filter(b => b.key !== backupKey);
      localStorage.setItem('project_backups', JSON.stringify(backupList));
    }

    return { success: true };
  } catch (error) {
    console.error('[ProjectManagement] Delete backup failed:', error);
    throw error;
  }
};

/**
 * Auto-save draft to localStorage
 */
export const autoSaveDraft = (app) => {
  try {
    if (!app || !app.id) {
      console.warn('[ProjectManagement] Cannot auto-save: app missing');
      return;
    }

    const draftKey = `draft_${app.id}`;
    const draft = {
      id: app.id,
      name: app.name,
      lastAutoSave: new Date().toISOString(),
      data: JSON.parse(JSON.stringify(app))
    };

    localStorage.setItem(draftKey, JSON.stringify(draft));
    console.log('[ProjectManagement] Auto-save draft completed:', draftKey);
  } catch (error) {
    console.error('[ProjectManagement] Auto-save failed:', error);
  }
};

/**
 * Get auto-saved draft
 */
export const getAutoSavedDraft = (appId) => {
  try {
    const draftKey = `draft_${appId}`;
    const draft = JSON.parse(localStorage.getItem(draftKey));
    return draft || null;
  } catch (error) {
    console.error('[ProjectManagement] Failed to get draft:', error);
    return null;
  }
};

/**
 * Clear auto-saved draft
 */
export const clearAutoSavedDraft = (appId) => {
  try {
    const draftKey = `draft_${appId}`;
    localStorage.removeItem(draftKey);
    return { success: true };
  } catch (error) {
    console.error('[ProjectManagement] Failed to clear draft:', error);
    throw error;
  }
};

/**
 * Batch export multiple projects
 */
export const exportMultipleProjects = (apps) => {
  try {
    if (!Array.isArray(apps) || apps.length === 0) {
      throw new Error('Tidak ada project untuk export');
    }

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0',
        exportVersion: 1,
        totalProjects: apps.length
      },
      projects: apps.map(app => ({
        project: {
          id: app.id,
          name: app.name,
          category: app.category || 'Shop Floor',
          description: app.description || '',
          version: app.version || 1,
          approval_status: app.approval_status || 'DRAFT',
          is_published: app.is_published || false
        },
        config: app.config || {},
        timestamps: {
          created_at: app.created_at || new Date().toISOString(),
          updated_at: app.updated_at || new Date().toISOString()
        }
      }))
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `projects-backup-${Date.now()}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    console.log('[ProjectManagement] Multiple projects exported:', apps.length);
    return { success: true, count: apps.length };
  } catch (error) {
    console.error('[ProjectManagement] Batch export failed:', error);
    throw error;
  }
};

/**
 * Validate project data integrity
 */
export const validateProjectData = (app) => {
  const issues = [];

  if (!app.id) issues.push('Project ID hilang');
  if (!app.name) issues.push('Project name hilang');
  if (!app.config) issues.push('Project config hilang');
  
  // Check for empty components
  if (app.config && app.config.baseComponents && Array.isArray(app.config.baseComponents)) {
    const emptyComponents = app.config.baseComponents.filter(c => !c.componentType);
    if (emptyComponents.length > 0) {
      issues.push(`${emptyComponents.length} komponen memiliki type yang hilang`);
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

/**
 * Export project as CSV (summary)
 */
export const exportProjectAsCSV = (app) => {
  try {
    if (!app) {
      throw new Error('Project tidak valid untuk export');
    }

    const data = [
      ['Project Information'],
      ['Field', 'Value'],
      ['Name', app.name],
      ['Category', app.category || 'N/A'],
      ['Version', app.version || 1],
      ['Status', app.approval_status || 'N/A'],
      ['Published', app.is_published ? 'Yes' : 'No'],
      ['Created', app.created_at || 'N/A'],
      ['Updated', app.updated_at || 'N/A'],
      [],
      ['Components'],
      ['Type', 'Count'],
      ...(app.config && app.config.baseComponents 
        ? [['Total Components', app.config.baseComponents.length]]
        : [['Total Components', 0]])
    ];

    // If there are components, count by type
    if (app.config && app.config.baseComponents && Array.isArray(app.config.baseComponents)) {
      const typeCount = {};
      app.config.baseComponents.forEach(comp => {
        const type = comp.componentType || 'Unknown';
        typeCount[type] = (typeCount[type] || 0) + 1;
      });

      Object.entries(typeCount).forEach(([type, count]) => {
        data.push([type, count.toString()]);
      });
    }

    const csv = data.map(row => 
      row.map(cell => 
        typeof cell === 'string' && cell.includes(',') 
          ? `"${cell}"` 
          : cell
      ).join(',')
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${app.name}-summary-${Date.now()}.csv`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true, filename: link.download };
  } catch (error) {
    console.error('[ProjectManagement] CSV export failed:', error);
    throw error;
  }
};

export default {
  exportProjectToJSON,
  importProjectFromJSON,
  duplicateProject,
  backupProjectToLocalStorage,
  restoreProjectFromBackup,
  getProjectBackups,
  deleteBackup,
  autoSaveDraft,
  getAutoSavedDraft,
  clearAutoSavedDraft,
  exportMultipleProjects,
  validateProjectData,
  exportProjectAsCSV
};
