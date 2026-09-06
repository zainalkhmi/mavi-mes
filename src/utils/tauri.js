/**
 * Tauri API Helper
 * Frontend utilities for Tauri native features
 */

import { invoke } from '@tauri-apps/api/core';
import { platform, arch } from '@tauri-apps/plugin-os';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { open as openUrl } from '@tauri-apps/plugin-opener';

// ═══════════════════════════════════════════════════════════════════════════════
// File System Operations
// ═══════════════════════════════════════════════════════════════════════════════

export const TauriFS = {
  /**
   * Read file content
   */
  async readFile(path: string): Promise<string> {
    return await invoke('read_file', { path });
  },

  /**
   * Write content to file
   */
  async writeFile(path: string, content: string): Promise<void> {
    return await invoke('write_file', { path, content });
  },

  /**
   * Delete file
   */
  async deleteFile(path: string): Promise<void> {
    return await invoke('delete_file', { path });
  },

  /**
   * List directory contents
   */
  async listDirectory(path: string): Promise<FileInfo[]> {
    return await invoke('list_directory', { path });
  },

  /**
   * Create directory
   */
  async createDirectory(path: string): Promise<void> {
    return await invoke('create_directory', { path });
  },

  /**
   * Copy file
   */
  async copyFile(source: string, destination: string): Promise<void> {
    return await invoke('copy_file', { source, destination });
  },

  /**
   * Move file
   */
  async moveFile(source: string, destination: string): Promise<void> {
    return await invoke('move_file', { source, destination });
  },

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    return await invoke('get_file_metadata', { path });
  },

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    return await invoke('file_exists', { path });
  },

  /**
   * Open file in system file explorer (select/highlight)
   */
  async openInExplorer(path: string): Promise<void> {
    return await invoke('open_in_explorer', { path });
  },
};

export interface FileInfo {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export interface FileMetadata {
  size: number;
  is_dir: boolean;
  is_file: boolean;
  modified: number;
  created: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// System Operations
// ═══════════════════════════════════════════════════════════════════════════════

export const TauriSystem = {
  /**
   * Get app data directory
   */
  async getAppDataDir(): Promise<string> {
    return await invoke('get_app_data_dir');
  },

  /**
   * Get system info
   */
  async getSystemInfo(): Promise<{ os: string; arch: string }> {
    return await invoke('get_system_info');
  },

  /**
   * Get platform info (from plugin)
   */
  async getPlatform(): Promise<string> {
    return await platform();
  },

  /**
   * Get architecture (from plugin)
   */
  async getArch(): Promise<string> {
    return await arch();
  },

  /**
   * Open URL in default browser
   */
  async openUrl(url: string): Promise<void> {
    return await openUrl(url);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Dialog Operations
// ═══════════════════════════════════════════════════════════════════════════════

export const TauriDialog = {
  /**
   * Open file picker
   */
  async openFile(options?: {
    multiple?: boolean;
    directory?: boolean;
    filters?: { name: string; extensions: string[] }[];
    defaultPath?: string;
  }): Promise<string | string[] | null> {
    const result = await openDialog({
      multiple: options?.multiple ?? false,
      directory: options?.directory ?? false,
      filters: options?.filters,
      defaultPath: options?.defaultPath,
    });
    return result;
  },

  /**
   * Save file picker
   */
  async saveFile(options?: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
  }): Promise<string | null> {
    return await openDialog({
      save: true,
      defaultPath: options?.defaultPath,
      filters: options?.filters,
    });
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Format file size to human readable
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number): string {
  if (timestamp === 0) return '-';
  return new Date(timestamp * 1000).toLocaleString();
}

// ═══════════════════════════════════════════════════════════════════════════════
// App Project Storage (using Tauri FS)
// ═══════════════════════════════════════════════════════════════════════════════

export const TauriAppProjects = {
  /**
   * Get projects directory
   */
  async getProjectsDir(): Promise<string> {
    const appData = await TauriSystem.getAppDataDir();
    return `${appData}/projects`;
  },

  /**
   * Ensure projects directory exists
   */
  async ensureProjectsDir(): Promise<string> {
    const dir = await this.getProjectsDir();
    try {
      await TauriFS.createDirectory(dir);
    } catch (e) {
      // Directory may already exist
    }
    return dir;
  },

  /**
   * Save project
   */
  async saveProject(projectId: string, data: any): Promise<void> {
    const dir = await this.ensureProjectsDir();
    const filePath = `${dir}/${projectId}.json`;
    await TauriFS.writeFile(filePath, JSON.stringify(data, null, 2));
  },

  /**
   * Load project
   */
  async loadProject(projectId: string): Promise<any | null> {
    const dir = await this.ensureProjectsDir();
    const filePath = `${dir}/${projectId}.json`;
    try {
      const exists = await TauriFS.exists(filePath);
      if (!exists) return null;
      const content = await TauriFS.readFile(filePath);
      return JSON.parse(content);
    } catch (e) {
      console.error('Failed to load project:', e);
      return null;
    }
  },

  /**
   * List all projects
   */
  async listProjects(): Promise<{ id: string; name: string; updated: number }[]> {
    const dir = await this.ensureProjectsDir();
    const files = await TauriFS.listDirectory(dir);

    const projects = [];
    for (const file of files) {
      if (!file.is_dir && file.name.endsWith('.json')) {
        try {
          const content = await TauriFS.readFile(file.path);
          const data = JSON.parse(content);
          projects.push({
            id: file.name.replace('.json', ''),
            name: data.name || 'Untitled',
            updated: file.modified,
          });
        } catch (e) {
          // Skip invalid files
        }
      }
    }

    return projects.sort((a, b) => b.updated - a.updated);
  },

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const dir = await this.ensureProjectsDir();
    const filePath = `${dir}/${projectId}.json`;
    await TauriFS.deleteFile(filePath);
  },
};

export default {
  TauriFS,
  TauriSystem,
  TauriDialog,
  TauriAppProjects,
  isTauri,
  formatFileSize,
  formatDate,
};
