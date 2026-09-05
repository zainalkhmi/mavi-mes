import React, { useState, useEffect, useCallback, useRef } from 'react';

export const MAVICORE_BRIDGE_VIRTUAL_FILE = `import React, { useState, useEffect, useCallback, useRef } from 'react';

// Safe cross-frame postMessage sender (posts to both parent and top to escape nested Sandpack iframes)
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

// Local storage helper for instant offline/caching in Sandpack
const _store = {
  get(key) {
    try {
      const v = localStorage.getItem('mc_' + key);
      return v ? JSON.parse(v) : null;
    } catch { return null; }
  },
  set(key, val) {
    try {
      localStorage.setItem('mc_' + key, JSON.stringify(val));
    } catch {}
  },
  append(key, item) {
    const arr = this.get(key) || [];
    const itemId = item.recordId || item.id;
    const existingIdx = arr.findIndex(r => (r.recordId || r.id) === itemId);
    if (existingIdx >= 0) {
      arr[existingIdx] = { ...arr[existingIdx], ...item };
    } else {
      arr.unshift(item);
    }
    this.set(key, arr);
  },
  update(key, recordId, updatedFields) {
    const arr = this.get(key) || [];
    const targetIdx = arr.findIndex(r => (r.recordId || r.id) === recordId || String(r.id) === String(recordId) || String(r.recordId) === String(recordId));
    if (targetIdx >= 0) {
      arr[targetIdx] = { ...arr[targetIdx], ...updatedFields, updatedAt: new Date().toISOString() };
      this.set(key, arr);
      return arr[targetIdx];
    }
    return null;
  },
  remove(key, recordId) {
    const arr = this.get(key) || [];
    const filtered = arr.filter(r => (r.recordId || r.id) !== recordId && String(r.id) !== String(recordId) && String(r.recordId) !== String(recordId));
    this.set(key, filtered);
    return filtered;
  }
};

export const MaviCoreBridge = {
  // CREATE TABLE
  createTable: (tableName, fields = []) => {
    const payload = {
      type: 'MAVICORE_TABLE_CREATE',
      tableName,
      table: tableName,
      fields: fields || []
    };
    postToMaviCore(payload);
    window.dispatchEvent(new CustomEvent('mavicore_create_table', { detail: payload }));
    console.log('[MaviCoreBridge] 🆕 Table created:', tableName, fields);
    return true;
  },

  // CREATE / INSERT
  save: async (tableName, data = {}) => {
    const recordId = data.recordId || data.id || ('REC_' + Date.now() + '_' + Math.floor(Math.random() * 1000));
    const payloadData = {
      recordId,
      timestamp: data.timestamp || new Date().toISOString(),
      ...data
    };

    // 1. Immediately cache in local store for instant UI reactivity
    _store.append('table_' + tableName, payloadData);

    // 2. Dispatch local events for instant subscription updates
    window.dispatchEvent(new CustomEvent('mavicore_save', { detail: { tableName, data: payloadData } }));
    window.dispatchEvent(new CustomEvent('mavicore_record_change', {
      detail: { type: 'MAVICORE_RECORD_SAVED', table: tableName, tableName, record: payloadData }
    }));

    return new Promise((resolve) => {
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

      // Quick fallback resolves with payloadData
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(payloadData);
      }, 500);
    });
  },

  // READ / SELECT ALL
  read: async (tableName) => {
    return new Promise((resolve) => {
      const cached = _store.get('table_' + tableName) || [];
      const reqId = 'READ_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);

      const handler = (event) => {
        if (!event.data) return;
        const { type, tableName: tName, table: tbl, records } = event.data;
        if (
          (type === 'MAVICORE_TABLE_READ_RESPONSE' || type === 'MAVICORE_TABLE_RESULT') &&
          (tName === tableName || tbl === tableName)
        ) {
          window.removeEventListener('message', handler);
          const serverRecords = Array.isArray(records) ? records : [];
          if (serverRecords.length > 0) {
            _store.set('table_' + tableName, serverRecords);
            resolve(serverRecords);
          } else {
            resolve(cached);
          }
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

      // Quick fallback resolves with cached records
      setTimeout(() => {
        window.removeEventListener('message', handler);
        resolve(cached);
      }, 600);
    });
  },

  // UPDATE
  update: async (tableName, recordId, data = {}) => {
    _store.update('table_' + tableName, recordId, data);
    window.dispatchEvent(new CustomEvent('mavicore_update', { detail: { tableName, recordId, data } }));
    window.dispatchEvent(new CustomEvent('mavicore_record_change', {
      detail: { type: 'MAVICORE_RECORD_UPDATED', table: tableName, tableName, recordId, data }
    }));

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
      }, 500);
    });
  },

  // DELETE
  delete: async (tableName, recordId) => {
    _store.remove('table_' + tableName, recordId);
    window.dispatchEvent(new CustomEvent('mavicore_delete', { detail: { tableName, recordId } }));
    window.dispatchEvent(new CustomEvent('mavicore_record_change', {
      detail: { type: 'MAVICORE_RECORD_DELETED', table: tableName, tableName, recordId }
    }));

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
      }, 500);
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

    const localChangeHandler = (e) => {
      if (e.detail?.table === tableName || e.detail?.tableName === tableName) {
        callback(e.detail);
      }
    };
    window.addEventListener('mavicore_record_change', localChangeHandler);

    return () => {
      window.removeEventListener('message', handler);
      window.removeEventListener('mavicore_record_change', localChangeHandler);
    };
  }
};

// Global attachment on window for auto-injection in Sandpack preview
if (typeof window !== 'undefined') {
  window.MaviCoreBridge = MaviCoreBridge;
}

/**
 * Custom React Hook for live CRUD operations with MaviCore Tables
 * @param {string} tableName Name of the table
 * @returns {{ records, loading, error, refresh, insert, save, update, delete, remove, setRecords }}
 */
export function useMaviCoreData(tableName) {
  const [records, setRecords] = useState(() => {
    try {
      const c = localStorage.getItem('mc_table_' + tableName);
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });
  const [loading, setLoading] = useState(false);
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
          const rec = change.record;
          const recId = rec.recordId || rec.id;
          const exists = prev.some(r => (r.recordId || r.id) === recId);
          return exists
            ? prev.map(r => ((r.recordId || r.id) === recId ? { ...r, ...rec } : r))
            : [rec, ...prev];
        });
      } else if (change.type === 'MAVICORE_RECORD_UPDATED') {
        const recId = change.recordId || change.record?.recordId || change.record?.id;
        const patch = change.data || change.record || {};
        if (recId) {
          setRecords(prev => prev.map(r => ((r.recordId || r.id) === recId ? { ...r, ...patch } : r)));
        } else {
          refresh();
        }
      } else if (change.type === 'MAVICORE_RECORD_DELETED') {
        const delId = change.recordId;
        if (delId) {
          setRecords(prev => prev.filter(r => (r.recordId || r.id) !== delId && String(r.id) !== String(delId) && String(r.recordId) !== String(delId)));
        } else {
          refresh();
        }
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
    setRecords(prev => prev.map(r => ((r.recordId || r.id) === recordId || String(r.id) === String(recordId) ? { ...r, ...updatedFields } : r)));
  }, [tableName]);

  const remove = useCallback(async (recordId) => {
    await MaviCoreBridge.delete(tableName, recordId);
    setRecords(prev => prev.filter(r => (r.recordId || r.id) !== recordId && String(r.id) !== String(recordId)));
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

if (typeof window !== 'undefined') {
  window.useMaviCoreData = useMaviCoreData;

  // ─── Visual Component Inspector (Click-to-Code) ───
  let isInspectActive = false;
  let hoverOverlay = null;
  let tooltipEl = null;

  function ensureInspectorDOM() {
    if (!document.body) return;
    if (!hoverOverlay) {
      hoverOverlay = document.createElement('div');
      hoverOverlay.id = 'mavicore-inspect-highlight-box';
      hoverOverlay.style.cssText = 'position:fixed;pointer-events:none;z-index:9999999;border:2px dashed #0284c7;background:rgba(14,165,233,0.18);border-radius:6px;transition:all 0.05s ease;display:none;box-shadow:0 0 14px rgba(14,165,233,0.5);';
      document.body.appendChild(hoverOverlay);
    }
    if (!tooltipEl) {
      tooltipEl = document.createElement('div');
      tooltipEl.id = 'mavicore-inspect-tag-tooltip';
      tooltipEl.style.cssText = 'position:fixed;pointer-events:none;z-index:10000000;background:#0f172a;color:#38bdf8;border:1px solid #0284c7;padding:3px 8px;border-radius:6px;font-size:11px;font-family:monospace;font-weight:700;box-shadow:0 4px 14px rgba(0,0,0,0.6);display:none;white-space:nowrap;';
      document.body.appendChild(tooltipEl);
    }
  }

  function hideInspectorDOM() {
    if (hoverOverlay) hoverOverlay.style.display = 'none';
    if (tooltipEl) tooltipEl.style.display = 'none';
  }

  window.addEventListener('message', (e) => {
    if (e.data?.type === 'MAVICORE_SET_INSPECT_MODE') {
      isInspectActive = Boolean(e.data.enabled);
      if (!isInspectActive) {
        hideInspectorDOM();
      } else {
        ensureInspectorDOM();
      }
    }
  });

  document.addEventListener('mousemove', (e) => {
    if (!isInspectActive) return;
    ensureInspectorDOM();
    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === hoverOverlay || target === tooltipEl || target === document.body || target === document.documentElement) {
      hideInspectorDOM();
      return;
    }

    const rect = target.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    hoverOverlay.style.display = 'block';
    hoverOverlay.style.top = rect.top + 'px';
    hoverOverlay.style.left = rect.left + 'px';
    hoverOverlay.style.width = rect.width + 'px';
    hoverOverlay.style.height = rect.height + 'px';

    const tag = target.tagName.toLowerCase();
    const txt = (target.innerText || target.getAttribute('placeholder') || '').trim().slice(0, 22);
    tooltipEl.style.display = 'block';
    tooltipEl.style.top = Math.max(6, rect.top - 24) + 'px';
    tooltipEl.style.left = Math.max(6, rect.left) + 'px';
    tooltipEl.textContent = '<' + tag + '>' + (txt ? ' "' + txt + '"' : '');
  }, true);

  document.addEventListener('click', (e) => {
    if (!isInspectActive) return;
    const target = e.target;
    if (!target) return;

    e.preventDefault();
    e.stopPropagation();

    // If target is a small wrapper around a heading, button or input, pick the more specific element
    const specificChild = target.querySelector('h1, h2, h3, h4, h5, button, label, input, select, textarea');
    const effectiveTarget = (specificChild && target.children.length <= 4) ? specificChild : target;

    const tagName = effectiveTarget.tagName.toLowerCase();
    const rawText = (effectiveTarget.innerText || target.innerText || '').trim();
    const firstLine = (rawText.split('\n')[0] || rawText.split('\r')[0] || rawText).trim();
    const placeholder = target.getAttribute('placeholder') || effectiveTarget.getAttribute('placeholder') || '';
    const name = target.getAttribute('name') || effectiveTarget.getAttribute('name') || '';
    const id = target.id || effectiveTarget.id || '';
    const className = typeof target.className === 'string' ? target.className : '';
    const value = target.value || target.getAttribute('value') || '';

    const words = (firstLine || rawText)
      .replace(/[^a-zA-Z0-9_\s-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .slice(0, 8);

    postToMaviCore({
      type: 'MAVICORE_ELEMENT_INSPECTED',
      tagName,
      text: firstLine || rawText.slice(0, 60),
      firstLine,
      placeholder,
      name,
      value,
      id,
      className,
      words
    });

    hideInspectorDOM();
  }, true);
}

export default MaviCoreBridge;
`;

export default MAVICORE_BRIDGE_VIRTUAL_FILE;
