/**
 * @mavicore/sdk
 * Official client SDK for MaviCore manufacturing applications.
 * Provides modules for API, Auth, Inspection, Checksheet, Inventory, OEE, IoT, Hardware, and Workflow.
 */

export const MAVICORE_SDK_VIRTUAL_FILE = `
// @mavicore/sdk implementation bundle

export const mavicore = {
  // 1. API & Tables
  api: {
    async insertRecord(tableName, data) {
      if (typeof window !== 'undefined' && window.parent) {
        window.parent.postMessage({
          type: 'MAVICORE_TABLE_INSERT',
          tableName,
          data: { timestamp: new Date().toISOString(), ...data }
        }, '*');
      }
      return { success: true, timestamp: new Date().toISOString() };
    },
    async query(tableName, filters = {}) {
      console.log('[MaviCore API] Query table:', tableName, filters);
      return [];
    }
  },

  // 2. Auth & Operator
  auth: {
    getCurrentUser() {
      return {
        id: 'OP-001',
        name: 'Operator Line 1',
        role: 'OPERATOR',
        shift: 'Shift 1 (Pagi)'
      };
    },
    isSupervisor() {
      return false;
    }
  },

  // 3. Inspection & Quality
  inspection: {
    evaluateTolerance(actual, nominal, tolerance) {
      const min = nominal - tolerance;
      const max = nominal + tolerance;
      const pass = actual >= min && actual <= max;
      return {
        pass,
        deviation: actual - nominal,
        status: pass ? 'OK' : 'NG'
      };
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

  // 5. IoT & Telemetry Mock / Bridge
  iot: {
    subscribeTopic(topic, onMessage) {
      console.log('[MaviCore IoT] Subscribed to topic:', topic);
      return () => console.log('[MaviCore IoT] Unsubscribed from topic:', topic);
    },
    publish(topic, payload) {
      console.log('[MaviCore IoT] Publish to topic:', topic, payload);
    }
  },

  // 6. Camera & Hardware
  camera: {
    async capturePhoto() {
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><rect width="300" height="200" fill="%231e293b"/><text x="50%" y="50%" fill="%2338bdf8" dominant-baseline="middle" text-anchor="middle">Defect Evidence Captured</text></svg>';
    }
  },

  // 7. Barcode / QR
  barcode: {
    async scan() {
      return 'PART-' + Math.floor(10000 + Math.random() * 90000);
    }
  },

  // 8. Workflow & Approvals
  workflow: {
    async requestApproval({ workflowName, requestedBy, payload }) {
      console.log('[MaviCore Workflow] Request approval:', workflowName, payload);
      return { approvalId: 'APPR-' + Date.now(), status: 'PENDING' };
    }
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
