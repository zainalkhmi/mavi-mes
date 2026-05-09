/**
 * offlineDb.js (Deprecated)
 * This file is kept for backward compatibility during migration.
 * Offline-First and IndexedDB logic has been removed as per user request.
 */

export const db = {
    syncQueue: {
        clear: async () => {},
        update: async () => {}
    },
    appCache: {
        clear: async () => {}
    }
};

export const addToSyncQueue = async () => {};
export const getPendingSync = async () => [];
export const markAsSyncing = async () => {};
export const removeFromSyncQueue = async () => {};
export const getCachedApp = async () => null;
export const cacheApp = async () => {};
