import React, { useState, useEffect, useCallback, useRef } from 'react';

export const MAVICORE_BRIDGE_VIRTUAL_FILE = `import React, { useState, useEffect, useCallback, useRef } from 'react';

// Safe cross-frame postMessage sender
function postToMaviCore(payload) {
  if (typeof window === 'undefined') return;
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(payload, '*');
    }
  } catch (_) {}
  try {
    if (window.top && window.top !== window && window.top !== window.parent) {
      window.top.postMessage(payload, '*');
    }
  } catch (_) {}
  try {
    window.dispatchEvent(new CustomEvent('mavicore_bridge_event', { detail: payload }));
  } catch (_) {}
}

export const MaviCoreBridge = {
  // CREATE / INSERT
  save: async (tableName, data) => {
    return new Promise((resolve) => {
      const recordId = data.recordId || data.id || ('REC_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
      const payloadData = {
        recordId,
        timestamp: new Date().toISOString(),
        ...data
      };
      const reqId = 'INS_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      const handler = (event) => {
        if (!event.data) return;
        if (
          event.data.type === 'MAVICORE_RECORD_SAVED' &&
          (event.data.table === tableName || event.data.tableName === tableName)
        ) {
          window.removeEventListener('message', handler);
          resolve(event.data.record || payloadData);
        }
      };
      window.addEventListener('message', handler);

      postToMaviCore({
        type: 'MAVICORE_TABLE_INSERT',
        tableName,
        table: tableName,
        reqId,
        data: payloadData
      });

      // Timeout fallback
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(payloadData);
      }, 1500);
    });
  },

  // READ / SELECT ALL
  read: async (tableName) => {
    return new Promise((resolve) => {
      const reqId = 'READ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      const handler = (event) => {
        if (!event.data) return;
        const { type, tableName: tName, table: tbl, records } = event.data;
        if (
          (type === 'MAVICORE_TABLE_READ_RESPONSE' || type === 'MAVICORE_TABLE_RESULT') &&
          (tName === tableName || tbl === tableName)
        ) {
          window.removeEventListener('message', handler);
          resolve(Array.isArray(records) ? records : []);
        }
      };
      window.addEventListener('message', handler);

      postToMaviCore({
        type: 'MAVICORE_TABLE_READ',
        tableName,
        table: tableName,
        reqId
      });
      postToMaviCore({
        type: 'MAVICORE_TABLE_QUERY',
        tableName,
        table: tableName,
        reqId
      });

      // Timeout fallback
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve([]);
      }, 2500);
    });
  },

  // UPDATE
  update: async (tableName, recordId, data) => {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (!event.data) return;
        if (
          event.data.type === 'MAVICORE_RECORD_UPDATED' &&
          (event.data.table === tableName || event.data.tableName === tableName)
        ) {
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };
      window.addEventListener('message', handler);

      postToMaviCore({
        type: 'MAVICORE_TABLE_UPDATE',
        tableName,
        table: tableName,
        recordId,
        data
      });

      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(true);
      }, 1500);
    });
  },

  // DELETE
  delete: async (tableName, recordId) => {
    return new Promise((resolve) => {
      const handler = (event) => {
        if (!event.data) return;
        if (
          event.data.type === 'MAVICORE_RECORD_DELETED' &&
          (event.data.table === tableName || event.data.tableName === tableName)
        ) {
          window.removeEventListener('message', handler);
          resolve(true);
        }
      };
      window.addEventListener('message', handler);

      postToMaviCore({
        type: 'MAVICORE_TABLE_DELETE',
        tableName,
        table: tableName,
        recordId
      });

      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(true);
      }, 1500);
    });
  },

  // REALTIME EVENT SUBSCRIPTION
  onRecord: (tableName, callback) => {
    const handler = (event) => {
      if (!event.data) return;
      const { type, table, tableName: tName, record, recordId, data } = event.data;
      if (
        (type === 'MAVICORE_RECORD_SAVED' || type === 'MAVICORE_RECORD_UPDATED' || type === 'MAVICORE_RECORD_DELETED') &&
        (table === tableName || tName === tableName)
      ) {
        callback({ type, record: record || data, recordId: recordId || record?.recordId, eventData: event.data });
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }
};

// Global attachment on window
if (typeof window !== 'undefined') {
  window.MaviCoreBridge = MaviCoreBridge;
}

/**
 * Custom React Hook for live CRUD operations with MaviCore Tables
 * @param {string} tableName Name of the table
 * @returns {{ records, loading, error, refresh, insert, update, remove, setRecords }}
 */
export function useMaviCoreData(tableName) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const tableNameRef = useRef(tableName);
  tableNameRef.current = tableName;

  const refresh = useCallback(async () => {
    const tbl = tableNameRef.current;
    if (!tbl) return [];
    setLoading(true);
    try {
      const data = await MaviCoreBridge.read(tbl);
      setRecords(Array.isArray(data) ? data : []);
      return data;
    } catch (err) {
      setError(err?.message || 'Failed to read table');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    // Subscribe to real-time additions, edits, and deletions
    const cleanup = MaviCoreBridge.onRecord(tableName, (change) => {
      if (change.type === 'MAVICORE_RECORD_SAVED' && change.record) {
        setRecords(prev => {
          const exists = prev.some(r => (r.recordId || r.id) === (change.record.recordId || change.record.id));
          return exists ? prev.map(r => ((r.recordId || r.id) === (change.record.recordId || change.record.id) ? change.record : r)) : [change.record, ...prev];
        });
      } else if (change.type === 'MAVICORE_RECORD_DELETED' && change.recordId) {
        setRecords(prev => prev.filter(r => (r.recordId || r.id) !== change.recordId));
      } else {
        refresh();
      }
    });

    return cleanup;
  }, [tableName, refresh]);

  const insert = useCallback(async (data) => {
    const saved = await MaviCoreBridge.save(tableName, data);
    setRecords(prev => [saved, ...prev.filter(r => (r.recordId || r.id) !== (saved.recordId || saved.id))]);
    return saved;
  }, [tableName]);

  const update = useCallback(async (recordId, updatedFields) => {
    await MaviCoreBridge.update(tableName, recordId, updatedFields);
    setRecords(prev => prev.map(r => ((r.recordId || r.id) === recordId ? { ...r, ...updatedFields } : r)));
  }, [tableName]);

  const remove = useCallback(async (recordId) => {
    await MaviCoreBridge.delete(tableName, recordId);
    setRecords(prev => prev.filter(r => (r.recordId || r.id) !== recordId));
  }, [tableName]);

  return {
    records,
    loading,
    error,
    refresh,
    insert,
    save: insert,
    update,
    delete: remove,
    remove,
    setRecords
  };
}

export default MaviCoreBridge;
`;
