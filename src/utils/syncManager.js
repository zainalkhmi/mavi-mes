/**
 * syncManager.js (Deprecated)
 * Background sync logic has been disabled as the system is now Cloud-Native (Supabase-Only).
 */

export const startSyncProcess = () => {
    console.log('[SyncManager] System is in Cloud-Native mode. Offline sync is disabled.');
};

export const processSyncQueue = async () => {
    return Promise.resolve();
};
