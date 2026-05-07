import * as offlineDb from './offlineDb';
import { addTableRecord } from './supabaseTablesDB';
import { saveCompletion } from './supabaseCompletionsDB';
import { toast } from 'react-hot-toast';

let isSyncing = false;

export const startSyncProcess = () => {
  console.log('[SyncManager] Starting background sync worker...');
  
  // Try sync immediately
  processSyncQueue();
  
  // Poll every 30 seconds
  setInterval(processSyncQueue, 30000);
  
  // Also sync when coming back online
  window.addEventListener('online', () => {
    console.log('[SyncManager] Network is back online! Forcing sync...');
    processSyncQueue();
  });
};

export const processSyncQueue = async () => {
  if (isSyncing || !navigator.onLine) return;
  
  const pending = await offlineDb.getPendingSync();
  if (pending.length === 0) return;
  
  isSyncing = true;
  console.log(`[SyncManager] Found ${pending.length} items to sync.`);
  
  const toastId = toast.loading(`Syncing ${pending.length} items...`);
  let successCount = 0;
  
  for (const item of pending) {
    try {
      await offlineDb.markAsSyncing(item.id);
      
      if (item.type === 'ADD_RECORD') {
        const { tableId, data } = item.payload;
        await addTableRecord(tableId, data);
      } else if (item.type === 'COMPLETION') {
        await saveCompletion(item.payload);
      }
      
      await offlineDb.removeFromSyncQueue(item.id);
      successCount++;
    } catch (err) {
      console.error(`[SyncManager] Failed to sync item ${item.id}:`, err);
      await offlineDb.db.syncQueue.update(item.id, { status: 'pending' });
    }
  }
  
  if (successCount > 0) {
    toast.success(`Successfully synced ${successCount} items!`, { id: toastId });
  } else {
    toast.dismiss(toastId);
  }
  
  isSyncing = false;
  console.log('[SyncManager] Sync cycle complete.');
};
