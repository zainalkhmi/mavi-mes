export { MAVICORE_BRIDGE_VIRTUAL_FILE } from './mavicoreBridge.js';

export const MAVICORE_SDK_VIRTUAL_FILE = `
// @mavicore/sdk v2.0 — Real implementations for manufacturing apps

// Internal postMessage helper (posts to both parent and top to escape nested iframes)
const _postMessage = (type, payload) => {
  if (typeof window === 'undefined') return;
  const msg = { type, ...payload };
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(msg, '*');
    }
  } catch (_) {}
  try {
    if (window.top && window.top !== window && window.top !== window.parent) {
      window.top.postMessage(msg, '*');
    }
  } catch (_) {}
};

// Local storage helper for offline data
const _store = {
  get(key) { try { return JSON.parse(localStorage.getItem('mc_' + key)); } catch { return null; } },
  set(key, val) { try { localStorage.setItem('mc_' + key, JSON.stringify(val)); } catch {} },
  append(key, item) { const arr = this.get(key) || []; arr.push(item); this.set(key, arr); }
};

export const mavicore = {
  // 1. API & Tables — Real database operations via postMessage bridge
  api: {
    async insertRecord(tableName, data) {
      const record = { timestamp: new Date().toISOString(), id: 'REC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6), ...data };
      _postMessage('MAVICORE_TABLE_INSERT', { tableName, data: record });
      _store.append('table_' + tableName, record);
      return { success: true, record };
    },
    async saveRecord(tableName, data) {
      return this.insertRecord(tableName, data);
    },
    async save(tableName, data) {
      return this.insertRecord(tableName, data);
    },
    async insert(tableName, data) {
      return this.insertRecord(tableName, data);
    },
    async query(tableName, filters = {}) {
      // Request query from parent frame
      return new Promise((resolve) => {
        const reqId = 'QRY-' + Date.now();
        const handler = (e) => {
          if (e.data && e.data.type === 'MAVICORE_TABLE_RESULT' && e.data.reqId === reqId) {
            window.removeEventListener('message', handler);
            resolve(e.data.records || []);
          }
        };
        window.addEventListener('message', handler);
        _postMessage('MAVICORE_TABLE_QUERY', { tableName, filters, reqId });
        // Fallback to localStorage after 2s
        setTimeout(() => { window.removeEventListener('message', handler); resolve(_store.get('table_' + tableName) || []); }, 2000);
      });
    },
    async getRecords(tableName, filters = {}) {
      return this.query(tableName, filters);
    },
    async read(tableName, filters = {}) {
      return this.query(tableName, filters);
    },
    async updateRecord(tableName, recordId, data) {
      _postMessage('MAVICORE_TABLE_UPDATE', { tableName, recordId, data });
      return { success: true };
    },
    async update(tableName, recordId, data) {
      return this.updateRecord(tableName, recordId, data);
    },
    async deleteRecord(tableName, recordId) {
      _postMessage('MAVICORE_TABLE_DELETE', { tableName, recordId });
      return { success: true };
    },
    async delete(tableName, recordId) {
      return this.deleteRecord(tableName, recordId);
    }
  },

  // 2. Auth & Operator
  auth: {
    getCurrentUser() {
      return new Promise((resolve) => {
        _postMessage('MAVICORE_AUTH_REQUEST', {});
        const handler = (e) => {
          if (e.data && e.data.type === 'MAVICORE_AUTH_RESULT') {
            window.removeEventListener('message', handler);
            resolve(e.data.user || { id: 'OP-001', name: 'Operator', role: 'OPERATOR', shift: 'Shift 1' });
          }
        };
        window.addEventListener('message', handler);
        setTimeout(() => { window.removeEventListener('message', handler); resolve({ id: 'OP-001', name: 'Operator', role: 'OPERATOR', shift: 'Shift 1' }); }, 1500);
      });
    },
    isSupervisor() { return false; }
  },

  // 3. Inspection & Quality
  inspection: {
    evaluateTolerance(actual, nominal, tolerance) {
      const min = nominal - tolerance;
      const max = nominal + tolerance;
      const pass = actual >= min && actual <= max;
      return { pass, deviation: +(actual - nominal).toFixed(4), status: pass ? 'OK' : 'NG', min, max };
    },
    // AQL sampling lookup (ISO 2859-1 simplified)
    aqlSample(lotSize, aqlLevel = 2.5) {
      const levels = { 1: { '2-8': 2, '9-15': 3, '16-25': 5, '26-50': 8, '51-90': 13, '91-150': 20, '151-280': 32, '281-500': 50, '501-1200': 80, '1201-3000': 125, '3001-10000': 200 },
        2.5: { '2-8': 2, '9-15': 3, '16-25': 5, '26-50': 8, '51-90': 13, '91-150': 20, '151-280': 32, '281-500': 50, '501-1200': 80, '1201-3000': 125, '3001-10000': 200 } };
      const tbl = levels[aqlLevel] || levels[2.5];
      for (const [range, sample] of Object.entries(tbl)) {
        const [min, max] = range.split('-').map(Number);
        if (lotSize >= min && lotSize <= max) return { sampleSize: sample, lotSize, aql: aqlLevel };
      }
      return { sampleSize: Math.min(200, Math.floor(lotSize * 0.1)), lotSize, aql: aqlLevel };
    }
  },

  // 4. OEE & KPIs
  oee: {
    calculate({ plannedTimeMin, runTimeMin, totalParts, goodParts, idealCycleSec }) {
      const availability = plannedTimeMin > 0 ? (runTimeMin / plannedTimeMin) : 1;
      const operatingSec = runTimeMin * 60;
      const performance = operatingSec > 0 ? ((totalParts * idealCycleSec) / operatingSec) : 1;
      const quality = totalParts > 0 ? (goodParts / totalParts) : 1;
      const oee = availability * performance * quality;
      return {
        availability: Math.min(100, Math.max(0, +(availability * 100).toFixed(1))),
        performance: Math.min(100, Math.max(0, +(performance * 100).toFixed(1))),
        quality: Math.min(100, Math.max(0, +(quality * 100).toFixed(1))),
        oee: Math.min(100, Math.max(0, +(oee * 100).toFixed(1)))
      };
    }
  },

  // 5. IoT & Telemetry — Real MQTT bridge
  iot: {
    subscribeTopic(topic, onMessage) {
      const handler = (e) => {
        if (e.data && e.data.type === 'MAVICORE_IOT_MESSAGE' && e.data.topic === topic) {
          onMessage(e.data.payload);
        }
      };
      window.addEventListener('message', handler);
      _postMessage('MAVICORE_IOT_SUBSCRIBE', { topic });
      return () => { window.removeEventListener('message', handler); _postMessage('MAVICORE_IOT_UNSUBSCRIBE', { topic }); };
    },
    publish(topic, payload) {
      _postMessage('MAVICORE_IOT_PUBLISH', { topic, payload });
    }
  },

  // 6. Camera & Hardware — Real camera capture
  camera: {
    async capturePhoto(options = {}) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: options.facing || 'environment', width: { ideal: options.width || 1280 }, height: { ideal: options.height || 720 } } });
        const video = document.createElement('video');
        video.srcObject = stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
        await new Promise(r => setTimeout(r, 500));
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        stream.getTracks().forEach(t => t.stop());
        return canvas.toDataURL('image/jpeg', options.quality || 0.85);
      } catch (err) {
        console.warn('[MaviCore Camera] Capture failed, returning placeholder:', err.message);
        return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%231e293b"/><text x="50%" y="50%" fill="%2338bdf8" dominant-baseline="middle" text-anchor="middle" font-size="14">Camera not available</text></svg>';
      }
    }
  },

  // 7. Barcode / QR — Real camera barcode scanning
  barcode: {
    async scan() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        return new Promise((resolve, reject) => {
          const id = 'mc-barcode-' + Date.now();
          const el = document.createElement('div');
          el.id = id;
          el.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#000;';
          document.body.appendChild(el);
          const scanner = new Html5Qrcode(id);
          scanner.start({ facingMode: 'environment' }, { fps: 10, qrbox: 250 },
            (text) => { scanner.stop().then(() => { el.remove(); resolve(text); }).catch(() => { el.remove(); resolve(text); }); },
            () => {}
          );
          // Auto-cancel after 15s
          setTimeout(() => { try { scanner.stop(); } catch {} el.remove(); reject(new Error('Scan timeout')); }, 15000);
        });
      } catch (err) {
        console.warn('[MaviCore Barcode] Scanner unavailable:', err.message);
        return 'PART-' + Math.floor(10000 + Math.random() * 90000);
      }
    }
  },

  // 8. Workflow & Approvals — Real approval via postMessage
  workflow: {
    async requestApproval({ workflowName, requestedBy, payload }) {
      return new Promise((resolve) => {
        const reqId = 'WF-' + Date.now();
        _postMessage('MAVICORE_WORKFLOW_REQUEST', { workflowName, requestedBy, payload, reqId });
        const handler = (e) => {
          if (e.data && e.data.type === 'MAVICORE_WORKFLOW_RESULT' && e.data.reqId === reqId) {
            window.removeEventListener('message', handler);
            resolve(e.data);
          }
        };
        window.addEventListener('message', handler);
        setTimeout(() => { window.removeEventListener('message', handler); resolve({ approvalId: reqId, status: 'PENDING' }); }, 3000);
      });
    }
  },

  // 9. Date & Time utilities (replaces dayjs need for common ops)
  date: {
    now() { return new Date().toISOString(); },
    format(date, fmt) {
      const d = new Date(date);
      const pad = (n) => String(n).padStart(2, '0');
      return fmt.replace('YYYY', d.getFullYear()).replace('MM', pad(d.getMonth() + 1)).replace('DD', pad(d.getDate()))
        .replace('HH', pad(d.getHours())).replace('mm', pad(d.getMinutes())).replace('ss', pad(d.getSeconds()));
    },
    shiftId() { const h = new Date().getHours(); if (h >= 6 && h < 14) return 'SHIFT-1'; if (h >= 14 && h < 22) return 'SHIFT-2'; return 'SHIFT-3'; },
    timestamp() { return new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }); }
  },

  // 10. Notification — Real browser notification
  notification: {
    async show(title, body, options = {}) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: options.icon, tag: options.tag });
      }
      _postMessage('MAVICORE_NOTIFICATION', { title, body, ...options });
    },
    async requestPermission() {
      if ('Notification' in window) return await Notification.requestPermission();
      return 'denied';
    }
  },

  // 11. Storage — Offline localStorage wrapper
  storage: {
    save(key, value) { _store.set(key, value); },
    load(key) { return _store.get(key); },
    remove(key) { localStorage.removeItem('mc_' + key); },
    list(prefix = '') { const results = []; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && k.startsWith('mc_' + prefix)) results.push(k.replace('mc_', '')); } return results; }
  }
};

export default mavicore;
`;

export const mavicore = {
  api: {
    async insertRecord(tableName, data) {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
          type: 'MAVICORE_TABLE_INSERT',
          tableName,
          data: { timestamp: new Date().toISOString(), ...data }
        }, '*');
      }
      return { success: true };
    }
  },
  auth: {
    getCurrentUser() {
      return { id: 'OP-001', name: 'Operator Line 1', role: 'OPERATOR', shift: 'Shift 1' };
    }
  }
};
