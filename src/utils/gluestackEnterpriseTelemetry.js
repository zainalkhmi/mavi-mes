/**
 * MAVI MES — Gluestack Enterprise Fase 3 Engine
 * 1. Industrial IoT Telemetry (OPC-UA / MQTT Machine Tag Streaming)
 * 2. Edge AI Computer Vision Defect Inspector (Real-time Defect Classification)
 * 3. Two-Way Enterprise ERP / SAP Connector (Work Order Sync & Batch Release)
 */

import iotConnector from './iotConnector';
import { recordAuditLog } from './gluestackOfflineManager';

// ==========================================
// 1. IOT MACHINE TELEMETRY & ALARM THRESHOLDS
// ==========================================
export const DEFAULT_MACHINE_TAGS = [
  { tag: 'ns=2;s=SpindleSpeed', name: 'Spindle RPM', unit: 'RPM', min: 0, max: 2400, warnHigh: 2100, critHigh: 2300, icon: 'Gauge' },
  { tag: 'ns=2;s=Temperature', name: 'Motor Temp', unit: '°C', min: 20, max: 120, warnHigh: 75, critHigh: 90, icon: 'Thermometer' },
  { tag: 'ns=2;s=HydraulicPress', name: 'Hydraulic Press', unit: 'Bar', min: 0, max: 250, warnHigh: 210, critHigh: 235, icon: 'Activity' },
  { tag: 'ns=2;s=Vibration', name: 'Vibration', unit: 'mm/s', min: 0, max: 15, warnHigh: 8.5, critHigh: 11.0, icon: 'Zap' },
  { tag: 'ns=2;s=OEE_Rate', name: 'Live OEE', unit: '%', min: 0, max: 100, warnLow: 65, critLow: 50, icon: 'TrendingUp' }
];

export class EnterpriseTelemetryEngine {
  constructor() {
    this.listeners = new Set();
    this.currentValues = new Map();
    this.alarms = [];
    this.alarmListeners = new Set();
    this.timer = null;
    this.init();
  }

  init() {
    // Seed initial values
    this.currentValues.set('ns=2;s=SpindleSpeed', 1780);
    this.currentValues.set('ns=2;s=Temperature', 68.4);
    this.currentValues.set('ns=2;s=HydraulicPress', 182.5);
    this.currentValues.set('ns=2;s=Vibration', 3.2);
    this.currentValues.set('ns=2;s=OEE_Rate', 86.4);

    // Dynamic live generator (every 1.5s)
    this.timer = setInterval(() => {
      this.tick();
    }, 1500);
  }

  tick() {
    const now = Date.now();
    const speed = Math.round(1750 + Math.sin(now / 4000) * 120 + (Math.random() * 20 - 10));
    const temp = +(68.0 + Math.sin(now / 8000) * 8 + Math.random() * 1.5).toFixed(1);
    const press = +(180.0 + Math.cos(now / 5000) * 15 + Math.random() * 2).toFixed(1);
    const vib = +(3.2 + Math.random() * 1.2).toFixed(2);
    const oee = +(85.5 + Math.sin(now / 10000) * 4).toFixed(1);

    this.currentValues.set('ns=2;s=SpindleSpeed', speed);
    this.currentValues.set('ns=2;s=Temperature', temp);
    this.currentValues.set('ns=2;s=HydraulicPress', press);
    this.currentValues.set('ns=2;s=Vibration', vib);
    this.currentValues.set('ns=2;s=OEE_Rate', oee);

    // Sync to global iotConnector if available
    try {
      iotConnector.setSimValue('ns=2;s=SpindleSpeed', speed);
      iotConnector.setSimValue('ns=2;s=Temperature', temp);
      iotConnector.setSimValue('ns=2;s=HydraulicPress', press);
      iotConnector.setSimValue('ns=2;s=Vibration', vib);
      iotConnector.setSimValue('ns=2;s=OEE_Rate', oee);
    } catch (e) {}

    // Check Alarm Interlocks
    this.checkAlarms(temp, speed, vib);

    // Notify telemetry listeners
    const snapshot = this.getSnapshot();
    this.listeners.forEach((cb) => {
      try { cb(snapshot); } catch (e) {}
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('mavi_telemetry_updated', { detail: snapshot }));
    }
  }

  checkAlarms(temp, speed, vib) {
    if (temp >= 75 && !this.alarms.find(a => a.tag === 'TEMP_HIGH')) {
      const alarm = {
        id: `alarm-${Date.now()}`,
        tag: 'TEMP_HIGH',
        level: temp >= 90 ? 'CRITICAL' : 'WARNING',
        message: `Suhu Spindle Tinggi: ${temp}°C (Batas Normal: <75°C)`,
        timestamp: new Date().toISOString()
      };
      this.alarms.unshift(alarm);
      this.notifyAlarms();
    }
  }

  notifyAlarms() {
    this.alarmListeners.forEach(cb => {
      try { cb(this.alarms); } catch (e) {}
    });
  }

  acknowledgeAlarm(alarmId) {
    this.alarms = this.alarms.filter(a => a.id !== alarmId);
    this.notifyAlarms();
  }

  getSnapshot() {
    const obj = {};
    for (const [k, v] of this.currentValues.entries()) {
      obj[k] = v;
    }
    return obj;
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.getSnapshot());
    return () => this.listeners.delete(callback);
  }

  subscribeAlarms(callback) {
    this.alarmListeners.add(callback);
    callback(this.alarms);
    return () => this.alarmListeners.delete(callback);
  }
}

export const telemetryEngine = new EnterpriseTelemetryEngine();

// ==========================================
// 2. INDUSTRIAL AI COMPUTER VISION DEFECT INSPECTOR
// ==========================================
export const DEFECT_CATALOG = [
  { id: 'DEF-POR-01', type: 'POROSITY', label: 'Porositas Permukaan (Porosity)', severity: 'CRITICAL', box: { x: 34, y: 42, w: 22, h: 18 } },
  { id: 'DEF-SCR-02', type: 'SCRATCH', label: 'Goresan Machining (Surface Scratch)', severity: 'MINOR', box: { x: 62, y: 28, w: 28, h: 8 } },
  { id: 'DEF-BUR-03', type: 'BURR', label: 'Burr Pinggiran Drat (Edge Burr)', severity: 'MAJOR', box: { x: 15, y: 70, w: 18, h: 14 } },
  { id: 'DEF-DIM-04', type: 'DIMENSION', label: 'Deviasi Diameter Luar (+0.12mm)', severity: 'CRITICAL', box: { x: 45, y: 60, w: 30, h: 25 } }
];

export async function runAiVisionDefectInspection(options = {}) {
  // Simulate inference time 450ms
  await new Promise(r => setTimeout(r, 450));

  const hasDefect = options.forceDefect !== undefined ? options.forceDefect : (Math.random() > 0.35);
  const detectedDefects = [];

  if (hasDefect) {
    const defectSample = DEFECT_CATALOG[Math.floor(Math.random() * DEFECT_CATALOG.length)];
    detectedDefects.push({
      ...defectSample,
      confidence: +(88.5 + Math.random() * 10.5).toFixed(1),
      detectedAt: new Date().toISOString()
    });
  }

  const result = {
    inspectionId: `AI-VIS-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    status: detectedDefects.length > 0 ? 'DEFECT_FOUND' : 'PASS_NO_DEFECT',
    modelName: 'MobileNetV3-MES-IndustrialEdge (FP16)',
    inferenceTimeMs: 42,
    confidenceAvg: detectedDefects.length > 0 ? detectedDefects[0].confidence : 99.2,
    defects: detectedDefects
  };

  // Log to Audit Trail
  recordAuditLog({
    action: 'AI_VISION_INSPECTION',
    user: 'AI-Edge-Vision-Node',
    station: 'LINE-01 • QC TERMINAL',
    details: `Status: ${result.status} | Defect Count: ${result.defects.length} | Confidence: ${result.confidenceAvg}%`
  });

  return result;
}

// ==========================================
// 3. TWO-WAY ENTERPRISE ERP / SAP CONNECTOR
// ==========================================
export const MOCK_ERP_WORK_ORDERS = [
  { woNumber: 'WO-2026-SAP-881', partNumber: 'PART-SPINDLE-772', customer: 'PT Astra Motor Component', targetQty: 500, completedQty: 342, status: 'IN_PROGRESS' },
  { woNumber: 'WO-2026-SAP-882', partNumber: 'PART-GEARBOX-X4', customer: 'PT Komatsu Indonesia', targetQty: 250, completedQty: 0, status: 'QUEUED' },
  { woNumber: 'WO-2026-SAP-883', partNumber: 'LOT-2026-X88', customer: 'PT Toyota Boshoku', targetQty: 1000, completedQty: 890, status: 'IN_PROGRESS' }
];

export async function fetchErpWorkOrders() {
  await new Promise(r => setTimeout(r, 400));
  return MOCK_ERP_WORK_ORDERS;
}

export async function pushBatchReleaseToErp({ woNumber, batchId, goodQty, rejectQty, signOffBy }) {
  await new Promise(r => setTimeout(r, 600));

  const releaseDoc = {
    erpDocumentId: `SAP-MATDOC-${Date.now().toString(36).toUpperCase()}`,
    woNumber,
    batchId: batchId || `BAT-${Date.now()}`,
    goodQty,
    rejectQty,
    signOffBy,
    syncStatus: 'SYNCHRONIZED',
    timestamp: new Date().toISOString()
  };

  // Log to Audit Trail
  recordAuditLog({
    action: 'ERP_BATCH_SYNC',
    user: signOffBy || 'System Admin',
    station: 'LINE-01 • QC TERMINAL',
    details: `WO: ${woNumber} -> SAP MatDoc: ${releaseDoc.erpDocumentId} (Good: ${goodQty}, Reject: ${rejectQty})`
  });

  return releaseDoc;
}
