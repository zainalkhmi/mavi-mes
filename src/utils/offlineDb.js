import Dexie from 'dexie';

export const db = new Dexie('MaviOfflineDB');

db.version(1).stores({
  apps: 'id, name, version, updatedAt',
  tables: 'id, name, updatedAt',
  tableRecords: '[tableId+id], tableId',
  variables: 'name, value, updatedAt',
  syncQueue: '++id, type, entityId, payload, timestamp, status' // status: 'pending' | 'syncing' | 'failed'
});

/**
 * App Caching
 */
export const cacheApp = async (app) => {
  return await db.apps.put({
    ...app,
    updatedAt: new Date().toISOString()
  });
};

export const getCachedApp = async (appId) => {
  return await db.apps.get(appId);
};

/**
 * Table & Record Caching
 */
export const cacheTableRecords = async (tableId, records) => {
  const data = records.map(r => ({
    ...r,
    tableId,
    cachedAt: new Date().toISOString()
  }));
  return await db.tableRecords.where({ tableId }).delete().then(() => {
    return db.tableRecords.bulkPut(data);
  });
};

export const getCachedTableRecords = async (tableId) => {
  return await db.tableRecords.where({ tableId }).toArray();
};

/**
 * Sync Queue
 */
export const addToSyncQueue = async (type, payload) => {
  return await db.syncQueue.add({
    type,
    payload,
    timestamp: new Date().toISOString(),
    status: 'pending'
  });
};

export const getPendingSync = async () => {
  return await db.syncQueue.where({ status: 'pending' }).toArray();
};

export const markAsSyncing = async (id) => {
  return await db.syncQueue.update(id, { status: 'syncing' });
};

export const removeFromSyncQueue = async (id) => {
  return await db.syncQueue.delete(id);
};
