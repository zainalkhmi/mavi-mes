import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi, Bluetooth, Cpu, Zap, Plus, Search, RefreshCw, Trash2,
  Settings2, Activity, CheckCircle2, XCircle, Clock, BarChart2,
  ToggleLeft, ToggleRight, Thermometer, Eye, Lock, Lightbulb,
  Power, Server, AlertTriangle, ChevronDown, ChevronRight, Radio,
  Gauge, Layers, HardDrive, Globe, X, Save, PlayCircle, StopCircle
} from 'lucide-react';
import iotProtocolGateway, { DEVICE_PROFILES } from '../utils/iotProtocolGateway';
import { getSmartDevices, saveSmartDevice, deleteSmartDevice, getIotGateways, saveIotGateway, deleteIotGateway } from '../utils/database';
import DevicePairingWizard from './DevicePairingWizard';
import WiFiDeviceConfig from './WiFiDeviceConfig';

// ── Protocol Meta ──────────────────────────────────────────────────────────
const PROTO = {
  ZIGBEE: { label: 'Zigbee',        color: '#f59e0b', bg: '#fffbeb', Icon: Zap,       desc: 'Zigbee2MQTT · Mesh Network · IEEE 802.15.4' },
  MATTER: { label: 'Matter',        color: '#8b5cf6', bg: '#f5f3ff', Icon: Cpu,       desc: 'WiFi · Thread · Universal Standard' },
  BLE:    { label: 'Bluetooth LE',  color: '#3b82f6', bg: '#eff6ff', Icon: Bluetooth, desc: 'BLE 5.0 · Mesh · Low Power' },
};

// ── Device type → icon map ──────────────────────────────────────────────────
const TYPE_ICON = {
  BULB: '💡', SWITCH: '🔌', PLUG: '🔌', RELAY: '⚡', SENSOR: '🌡️',
  MOTION: '👁️', CONTACT: '🚪', LOCK: '🔒', THERMOSTAT: '🌡️', CURTAIN: '🪟',
  BRIDGE: '🌐', CAMERA: '📷', STRIP: '🌈', SCALE: '⚖️', WEARABLE: '⌚',
  BUTTON: '🔘', UNKNOWN: '📡'
};

// ── Telemetry display helper ──────────────────────────────────────────────
function TelemetryBadge({ cap, val }) {
  if (val === undefined || val === null) return null;
  const fmts = {
    temperature:    v => `${v}°C`,
    humidity:       v => `${v}%`,
    power:          v => `${v}W`,
    voltage:        v => `${v}V`,
    brightness:     v => `${v}%`,
    battery:        v => `${v}%🔋`,
    co2:            v => `${v}ppm`,
    position:       v => `${v}%`,
    target_temp:    v => `→${v}°C`,
    soil_moisture:  v => `${v}%`,
    illuminance:    v => `${v}lux`,
    signal_strength:v => `${v}dBm`,
  };
  const fmt = fmts[cap];
  if (!fmt) return null;
  return (
    <span style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
      {fmt(val)}
    </span>
  );
}

// ── On/Off toggle ─────────────────────────────────────────────────────────
function OnOffToggle({ on, onChange, color }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onChange(!on); }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
    >
      {on
        ? <ToggleRight size={28} color={color || '#10b981'} />
        : <ToggleLeft size={28} color="#cbd5e1" />}
    </button>
  );
}

// ── Single Device Card ───────────────────────────────────────────────────
function DeviceCard({ device, onToggle, onDelete, onSelect }) {
  const proto = PROTO[device.protocol] || PROTO.ZIGBEE;
  const icon = TYPE_ICON[device.deviceType] || TYPE_ICON[device.config?.type] || '📡';
  const caps = device.config?.capabilities || device.capabilities || [];
  const tel = device.telemetry || {};
  const isOnline = device.online !== false;

  return (
    <div
      onClick={() => onSelect(device)}
      style={{
        backgroundColor: 'white', borderRadius: '14px',
        border: `1.5px solid ${isOnline ? '#e2e8f0' : '#fecaca'}`,
        padding: '16px', cursor: 'pointer', transition: 'all 0.2s',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        position: 'relative', overflow: 'hidden'
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'; }}
    >
      {/* Protocol stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: proto.color }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.2 }}>{device.name}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{device.brand} · {device.room || 'Unassigned'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          {/* Status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', backgroundColor: isOnline ? '#dcfce7' : '#fee2e2', fontSize: '0.68rem', fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isOnline ? '#10b981' : '#ef4444' }} />
            <span style={{ color: isOnline ? '#065f46' : '#991b1b' }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          {/* Protocol badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 7px', borderRadius: '20px', backgroundColor: proto.bg, fontSize: '0.65rem', fontWeight: 700, color: proto.color }}>
            <proto.Icon size={9} />
            {proto.label}
          </div>
        </div>
      </div>

      {/* Telemetry row */}
      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
        {caps.includes('on_off') && (
          <OnOffToggle on={tel.on} onChange={v => onToggle(device.id, { on: v })} color={proto.color} />
        )}
        {['temperature','humidity','power','battery','brightness','co2','position'].map(cap =>
          caps.includes(cap) ? <TelemetryBadge key={cap} cap={cap} val={tel[cap]} /> : null
        )}
        {caps.includes('contact') && tel.contact !== undefined && (
          <span style={{ padding: '2px 8px', backgroundColor: tel.contact ? '#dcfce7' : '#fee2e2', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: tel.contact ? '#065f46' : '#991b1b' }}>
            {tel.contact ? 'Closed' : 'Open'}
          </span>
        )}
        {caps.includes('occupancy') && tel.occupancy !== undefined && (
          <span style={{ padding: '2px 8px', backgroundColor: tel.occupancy ? '#fef3c7' : '#f1f5f9', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: tel.occupancy ? '#92400e' : '#64748b' }}>
            {tel.occupancy ? '🏃 Motion' : 'No Motion'}
          </span>
        )}
        {caps.includes('lock') && tel.locked !== undefined && (
          <span style={{ padding: '2px 8px', backgroundColor: tel.locked ? '#dcfce7' : '#fee2e2', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: tel.locked ? '#065f46' : '#991b1b' }}>
            {tel.locked ? '🔒 Locked' : '🔓 Unlocked'}
          </span>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
          {device.ieeeAddress || device.matterId || device.bleMac || '—'}
        </div>
        <button
          onClick={e => { e.stopPropagation(); onDelete(device.id); }}
          style={{ padding: '4px', border: 'none', background: 'none', cursor: 'pointer', color: '#fca5a5', borderRadius: '6px', display: 'flex' }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Protocol Scan Card ────────────────────────────────────────────────────
function ProtocolScanCard({ protocol, status, deviceCount, discoveredCount, onScan, onStop }) {
  const meta = PROTO[protocol];
  const Icon = meta.Icon;
  const scanning = status === 'SCANNING';

  return (
    <div style={{ backgroundColor: 'white', borderRadius: '16px', border: `2px solid ${scanning ? meta.color : '#e2e8f0'}`, padding: '20px', transition: 'all 0.3s', boxShadow: scanning ? `0 0 0 4px ${meta.color}22` : 'none' }}>
      {/* Top */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: scanning ? meta.color : meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s' }}>
            <Icon size={24} color={scanning ? 'white' : meta.color} />
          </div>
          <div>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '1rem' }}>{meta.label}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{meta.desc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '20px', backgroundColor: scanning ? '#fef3c7' : '#f1f5f9', fontSize: '0.72rem', fontWeight: 700 }}>
          {scanning
            ? <><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color, animation: 'blink 1s infinite' }} /><span style={{ color: meta.color }}>Scanning...</span></>
            : <><div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#94a3b8' }} /><span style={{ color: '#64748b' }}>Idle</span></>}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        <div style={{ padding: '10px', backgroundColor: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: meta.color }}>{deviceCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>PAIRED</div>
        </div>
        <div style={{ padding: '10px', backgroundColor: scanning ? '#fffbeb' : '#f8fafc', borderRadius: '10px', textAlign: 'center', transition: 'all 0.3s' }}>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: scanning ? meta.color : '#94a3b8' }}>{discoveredCount}</div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>DISCOVERED</div>
        </div>
      </div>

      {/* Radar when scanning */}
      {scanning && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{ position: 'relative', width: 60, height: 60 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${meta.color}`, opacity: 0, animation: `radar-pulse 2s ease-out ${i * 0.66}s infinite` }} />
            ))}
            <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', backgroundColor: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={16} color="white" />
            </div>
          </div>
        </div>
      )}

      {/* Action button */}
      <button
        onClick={scanning ? onStop : onScan}
        style={{ width: '100%', padding: '10px', borderRadius: '10px', border: `2px solid ${meta.color}`, backgroundColor: scanning ? 'white' : meta.color, color: scanning ? meta.color : 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
      >
        {scanning ? <><StopCircle size={16} /> Stop Scan</> : <><Radio size={16} /> Start Scan</>}
      </button>
    </div>
  );
}

// ── Gateway Config Tab ─────────────────────────────────────────────────────
function GatewayConfigTab({ gateways, onSave, onDelete, onTest }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', type: 'ZIGBEE2MQTT', mqttBroker: 'wss://broker.emqx.io:8084/mqtt', config: {} });
  const [testing, setTesting] = useState(null);

  const GW_TYPES = [
    { value: 'ZIGBEE2MQTT', label: 'Zigbee2MQTT',    icon: Zap,       desc: 'Zigbee coordinator via MQTT' },
    { value: 'MATTER_BRIDGE', label: 'Matter Bridge', icon: Cpu,       desc: 'Matter to MQTT bridge' },
    { value: 'BLE_GATEWAY',   label: 'BLE Gateway',  icon: Bluetooth, desc: 'BLE Mesh to MQTT gateway' },
  ];

  const handleTest = async (gw) => {
    setTesting(gw.id || 'new');
    const result = await iotProtocolGateway.testGatewayConnection({ mqttBroker: gw.mqttBroker || form.mqttBroker, type: gw.type });
    setTesting(null);
    onTest?.(result);
    alert(result.success ? `✅ ${result.message}` : `❌ ${result.error}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ margin: 0, fontWeight: 800, color: '#0f172a' }}>IoT Gateways</h3>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: '0.85rem' }}>Konfigurasi MQTT broker untuk hardware gateway</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}
        >
          <Plus size={16} /> Tambah Gateway
        </button>
      </div>

      {/* Add gateway form */}
      {showForm && (
        <div style={{ backgroundColor: '#f8fafc', borderRadius: '14px', border: '1.5px solid #e2e8f0', padding: '20px' }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '0.95rem' }}>Tambah Gateway Baru</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Nama Gateway</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rumah Utama Zigbee" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>Tipe</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', backgroundColor: 'white' }}>
                {GW_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase' }}>MQTT Broker URL</label>
            <input type="text" value={form.mqttBroker} onChange={e => setForm(f => ({ ...f, mqttBroker: e.target.value }))} placeholder="wss://your-broker:8084/mqtt" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.88rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
              Contoh: <code>wss://broker.emqx.io:8084/mqtt</code> atau MQTT broker lokal Anda
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleTest(form)} disabled={testing === 'new'} style={{ padding: '8px 16px', borderRadius: '8px', border: '1.5px solid #3b82f6', color: '#3b82f6', backgroundColor: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
              {testing === 'new' ? 'Testing...' : '🔌 Test Koneksi'}
            </button>
            <button onClick={() => { onSave(form); setShowForm(false); setForm({ name: '', type: 'ZIGBEE2MQTT', mqttBroker: '', config: {} }); }} disabled={!form.name || !form.mqttBroker} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#3b82f6', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
              <Save size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Simpan
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}>
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Existing gateways */}
      {gateways.length === 0 && !showForm && (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: 'white', borderRadius: '14px', border: '1.5px dashed #e2e8f0' }}>
          <Server size={40} color="#cbd5e1" style={{ marginBottom: '12px' }} />
          <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Belum ada gateway</div>
          <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Tambahkan gateway MQTT untuk menghubungkan hardware Zigbee/Matter/BLE</div>
        </div>
      )}

      {gateways.map(gw => (
        <div key={gw.id} style={{ backgroundColor: 'white', borderRadius: '14px', border: '1.5px solid #e2e8f0', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Server size={20} color="#64748b" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{gw.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontFamily: 'monospace' }}>{gw.mqttBroker || gw.mqtt_broker}</div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>{gw.type}</div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => handleTest(gw)} disabled={testing === gw.id} style={{ padding: '6px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#475569', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
              {testing === gw.id ? '...' : '🔌 Test'}
            </button>
            <button onClick={() => onDelete(gw.id)} style={{ padding: '6px 10px', borderRadius: '7px', border: '1px solid #fecaca', backgroundColor: 'white', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ))}

      {/* Info box */}
      <div style={{ padding: '14px 18px', backgroundColor: '#f0f9ff', borderRadius: '12px', border: '1px solid #bae6fd' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>💡 Cara Kerja Gateway</div>
        <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.6 }}>
          Mavi terhubung ke <strong>MQTT broker</strong> untuk berkomunikasi dengan hardware gateway.
          Zigbee2MQTT, Matter Bridge, dan BLE Gateway menjembatani protokol ke MQTT.
          Tanpa hardware, gunakan <strong>Simulation Mode</strong> untuk testing dan demo.
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
export default function IoTHubManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [devices, setDevices] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [discoveredMap, setDiscoveredMap] = useState({ ZIGBEE: [], MATTER: [], BLE: [] });
  const [protocolStatus, setProtocolStatus] = useState({ ZIGBEE: 'IDLE', MATTER: 'IDLE', BLE: 'IDLE' });
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProtocol, setFilterProtocol] = useState('ALL');
  const [showWizard, setShowWizard] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activityLog, setActivityLog] = useState([]);
  const unsubsRef = useRef([]);

  // ── Load from DB ────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [devs, gws] = await Promise.all([getSmartDevices(), getIotGateways()]);

      // Load into gateway engine
      iotProtocolGateway.loadPairedDevices(devs.map(d => ({
        ...d,
        capabilities: d.config?.capabilities || [],
        icon: d.config?.icon || TYPE_ICON[d.deviceType] || '📡',
        category: d.config?.category || 'Unknown',
        signalStrength: d.config?.signalStrength || -55,
        online: d.status !== 'OFFLINE',
      })));

      setDevices(devs);
      setGateways(gws);
    } catch (e) {
      console.error('IoTHub load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Subscribe to gateway events ─────────────────────────────────────────
  useEffect(() => {
    const addLog = (msg) => setActivityLog(l => [{ id: Date.now(), ts: new Date().toLocaleTimeString(), msg }, ...l.slice(0, 49)]);

    const u1 = iotProtocolGateway.onStatus(({ protocol, status, event }) => {
      if (protocol) setProtocolStatus(s => ({ ...s, [protocol]: status }));
      if (event) addLog(`[Gateway] ${event}`);
    });

    const u2 = iotProtocolGateway.onDiscovery(({ protocol, event, devices: devs }) => {
      setDiscoveredMap(m => ({ ...m, [protocol]: devs || [] }));
      if (event === 'DEVICE_FOUND' && devs?.length > 0) {
        const d = devs[devs.length - 1];
        addLog(`[${protocol}] Found: ${d.brand} ${d.model}`);
      }
      if (event === 'SCAN_COMPLETE') {
        addLog(`[${protocol}] Scan complete — ${devs?.length || 0} device(s) found`);
      }
    });

    const u3 = iotProtocolGateway.onDevice(({ event, device, deviceId }) => {
      if (event === 'PAIRING_SUCCESS') {
        addLog(`[Pair] ✅ ${device?.name || device?.brand} paired successfully`);
      }
      if (event === 'DEVICE_REMOVED') {
        addLog(`[Pair] 🗑️ Device removed`);
      }
      if (event === 'TELEMETRY_UPDATE') {
        setDevices(prev => prev.map(d => d.id === device.id ? { ...d, telemetry: device.telemetry, online: device.online } : d));
      }
    });

    const u4 = iotProtocolGateway.onTelemetry(({ deviceId }) => {
      // Sync telemetry from engine to state
      const d = iotProtocolGateway.getPairedDevices().find(x => x.id === deviceId);
      if (d) setDevices(prev => prev.map(x => x.id === deviceId ? { ...x, telemetry: d.telemetry, lastSeen: d.lastSeen } : x));
    });

    unsubsRef.current = [u1, u2, u3, u4];
    return () => unsubsRef.current.forEach(u => u?.());
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleScan = (protocol) => {
    iotProtocolGateway.startDiscovery(protocol, { simulationMode: true, duration: 10000 });
    setActiveTab('discovery');
  };

  const handleStopScan = (protocol) => iotProtocolGateway.stopDiscovery(protocol);

  const handleToggle = async (deviceId, command) => {
    iotProtocolGateway.sendCommand(deviceId, command);
    setDevices(prev => prev.map(d => d.id === deviceId ? { ...d, telemetry: { ...d.telemetry, ...command } } : d));
    // Persist
    const device = devices.find(d => d.id === deviceId);
    if (device) {
      try {
        await saveSmartDevice({ ...device, telemetry: { ...device.telemetry, ...command } });
      } catch (e) {}
    }
  };

  const handleDelete = async (deviceId) => {
    if (!window.confirm('Hapus perangkat ini dari registry?')) return;
    try {
      await deleteSmartDevice(deviceId);
      iotProtocolGateway.unpairDevice(deviceId);
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (e) { alert('Gagal menghapus perangkat'); }
  };

  const handlePaired = async (device) => {
    await loadData();
    setActivityLog(l => [{ id: Date.now(), ts: new Date().toLocaleTimeString(), msg: `✅ ${device.name} berhasil ditambahkan` }, ...l]);
  };

  const handleSaveGateway = async (gw) => {
    try {
      await saveIotGateway(gw);
      await loadData();
      if (gw.mqttBroker) iotProtocolGateway.connectMqttGateway(gw.mqttBroker);
    } catch (e) { alert('Gagal menyimpan gateway'); }
  };

  const handleDeleteGateway = async (id) => {
    if (!window.confirm('Hapus gateway ini?')) return;
    try {
      await deleteIotGateway(id);
      await loadData();
    } catch (e) { alert('Gagal menghapus gateway'); }
  };

  // ── Computed ─────────────────────────────────────────────────────────────
  const stats = iotProtocolGateway.getStats();
  const filteredDevices = devices.filter(d => {
    const matchSearch = !searchTerm || d.name?.toLowerCase().includes(searchTerm.toLowerCase()) || d.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || d.room?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchProto = filterProtocol === 'ALL' || d.protocol === filterProtocol;
    return matchSearch && matchProto;
  });

  const totalDiscovered = Object.values(discoveredMap).reduce((a, b) => a + b.length, 0);

  // ── Tabs config ──────────────────────────────────────────────────────────
  const TABS = [
    { id: 'overview',   label: 'Overview',   icon: BarChart2 },
    { id: 'devices',    label: `Devices (${devices.length})`, icon: Layers },
    { id: 'wifi',       label: 'WiFi Devices', icon: Wifi },
    { id: 'discovery',  label: `Scanner ${totalDiscovered > 0 ? `(${totalDiscovered})` : ''}`, icon: Radio },
    { id: 'gateways',   label: 'Gateways',   icon: Server },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ padding: '20px 28px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Radio size={20} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: '#0f172a' }}>IoT Hub</h2>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>Zigbee · Matter · Bluetooth LE — Device Gateway</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', animation: 'blink 2s infinite' }} />
            {stats.online} Online
          </div>
          <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
            <Plus size={16} /> Tambah Device
          </button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', display: 'flex', gap: '4px', flexShrink: 0 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: 'none', borderBottom: `3px solid ${active ? '#3b82f6' : 'transparent'}`, backgroundColor: 'transparent', color: active ? '#3b82f6' : '#64748b', fontWeight: active ? 700 : 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

        {/* ─── Overview Tab ─────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Protocol stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {Object.entries(PROTO).map(([key, meta]) => {
                const Icon = meta.Icon;
                const count = stats.byProtocol[key];
                const scanning = protocolStatus[key] === 'SCANNING';
                return (
                  <div key={key} style={{ backgroundColor: 'white', borderRadius: '16px', border: `2px solid ${scanning ? meta.color : '#e2e8f0'}`, padding: '20px', boxShadow: scanning ? `0 0 0 3px ${meta.color}22` : '0 2px 8px rgba(0,0,0,0.04)', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={22} color={meta.color} />
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: '20px', backgroundColor: scanning ? meta.bg : '#f1f5f9', fontSize: '0.68rem', fontWeight: 700, color: scanning ? meta.color : '#94a3b8' }}>
                        {scanning ? '● Scanning' : 'Idle'}
                      </div>
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>{count}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>{meta.label} Devices</div>
                    <button
                      onClick={() => handleScan(key)}
                      style={{ marginTop: '14px', width: '100%', padding: '8px', borderRadius: '8px', border: `1.5px solid ${meta.color}`, backgroundColor: 'white', color: meta.color, fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = meta.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'white'; }}
                    >
                      <Radio size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                      Scan {meta.label}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total Devices', value: stats.total, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Online', value: stats.online, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Offline', value: stats.offline, color: '#ef4444', bg: '#fef2f2' },
                { label: 'Gateways', value: gateways.length, color: '#8b5cf6', bg: '#f5f3ff' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Activity feed + category breakdown side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '16px' }}>
              {/* Activity feed */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="#3b82f6" /> Activity Log
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {activityLog.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '0.82rem' }}>Belum ada aktivitas</div>
                  ) : activityLog.map(log => (
                    <div key={log.id} style={{ display: 'flex', gap: '10px', padding: '10px 18px', borderBottom: '1px solid #f8fafc', fontSize: '0.8rem' }}>
                      <span style={{ color: '#94a3b8', flexShrink: 0, fontFamily: 'monospace' }}>{log.ts}</span>
                      <span style={{ color: '#475569' }}>{log.msg}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category breakdown */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #f1f5f9', fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
                  By Category
                </div>
                <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(stats.byCategory).length === 0 ? (
                    <div style={{ color: '#94a3b8', fontSize: '0.82rem', textAlign: 'center', padding: '20px 0' }}>Tidak ada data</div>
                  ) : Object.entries(stats.byCategory).map(([cat, cnt]) => (
                    <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>{cat}</span>
                      <span style={{ fontSize: '0.82rem', color: '#0f172a', fontWeight: 800 }}>{cnt}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Devices Tab ──────────────────────────────────────── */}
        {activeTab === 'devices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Cari device, brand, ruangan..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {['ALL', 'ZIGBEE', 'MATTER', 'BLE'].map(p => (
                  <button key={p} onClick={() => setFilterProtocol(p)} style={{ padding: '7px 14px', borderRadius: '8px', border: `1.5px solid ${filterProtocol === p ? (PROTO[p]?.color || '#3b82f6') : '#e2e8f0'}`, backgroundColor: filterProtocol === p ? (PROTO[p]?.bg || '#eff6ff') : 'white', color: filterProtocol === p ? (PROTO[p]?.color || '#3b82f6') : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {p === 'ALL' ? 'Semua' : PROTO[p]?.label}
                  </button>
                ))}
              </div>
              <button onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Loader2 size={32} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ color: '#64748b', fontSize: '0.85rem' }}>Memuat perangkat...</span>
                </div>
              </div>
            ) : filteredDevices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px dashed #e2e8f0' }}>
                <Radio size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Belum ada perangkat IoT</h3>
                <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: '0.88rem' }}>Klik "Tambah Device" atau scan untuk mendeteksi perangkat di sekitarmu.</p>
                <button onClick={() => setShowWizard(true)} style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Tambah Device
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {filteredDevices.map(device => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSelect={setSelectedDevice}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Discovery Tab ────────────────────────────────────── */}
        {activeTab === 'discovery' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '12px', padding: '14px 18px', fontSize: '0.83rem', color: '#78350f', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
              <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong>Simulation Mode aktif.</strong> Scan akan mensimulasikan penemuan perangkat secara realistis.
                Untuk koneksi hardware nyata, tambahkan MQTT Gateway di tab Gateways.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {Object.entries(PROTO).map(([key, meta]) => (
                <ProtocolScanCard
                  key={key}
                  protocol={key}
                  status={protocolStatus[key]}
                  deviceCount={stats.byProtocol[key]}
                  discoveredCount={discoveredMap[key]?.length || 0}
                  onScan={() => handleScan(key)}
                  onStop={() => handleStopScan(key)}
                />
              ))}
            </div>

            {/* Discovered devices list */}
            {totalDiscovered > 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0', overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                    Perangkat Terdeteksi ({totalDiscovered})
                  </div>
                  <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>
                    <Plus size={14} /> Pair Device
                  </button>
                </div>
                {Object.entries(discoveredMap).map(([proto, devs]) =>
                  devs.map(dev => {
                    const meta = PROTO[proto];
                    return (
                      <div key={dev.tempId} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px', borderBottom: '1px solid #f8fafc', transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                        <span style={{ fontSize: '1.5rem' }}>{dev.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{dev.brand} {dev.model}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                            {dev.ieeeAddress || dev.matterId || dev.bleMac}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: meta.color, fontWeight: 700, backgroundColor: meta.bg, padding: '2px 8px', borderRadius: '12px' }}>
                          <meta.Icon size={10} /> {proto}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{dev.signalStrength} dBm</div>
                        <button onClick={() => setShowWizard(true)} style={{ padding: '6px 14px', borderRadius: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}>
                          Pair
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── WiFi Tab ─────────────────────────────────────────── */}
        {activeTab === 'wifi' && (
          <WiFiDeviceConfig />
        )}

        {/* ─── Gateway Tab ──────────────────────────────────────── */}
        {activeTab === 'gateways' && (
          <GatewayConfigTab
            gateways={gateways}
            onSave={handleSaveGateway}
            onDelete={handleDeleteGateway}
          />
        )}
      </div>

      {/* ── Device Detail Panel (side drawer) ── */}
      {selectedDevice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setSelectedDevice(null)}>
          <div style={{ width: '380px', height: '100%', backgroundColor: 'white', overflowY: 'auto', padding: '24px', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem' }}>Device Detail</h3>
              <button onClick={() => setSelectedDevice(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '4rem', marginBottom: '8px' }}>{TYPE_ICON[selectedDevice.deviceType] || '📡'}</div>
              <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#0f172a' }}>{selectedDevice.name}</div>
              <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{selectedDevice.brand} · {selectedDevice.model}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['Protocol', selectedDevice.protocol],
                ['Status', selectedDevice.status],
                ['Room', selectedDevice.room || 'Unassigned'],
                ['IEEE/ID', selectedDevice.ieeeAddress || selectedDevice.matterId || selectedDevice.bleMac || '—'],
                ['MQTT Topic', selectedDevice.mqttTopic || '—'],
                ['Last Seen', selectedDevice.lastSeen ? new Date(selectedDevice.lastSeen).toLocaleString() : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: '0.8rem', color: '#0f172a', fontWeight: 700, fontFamily: k === 'MQTT Topic' || k === 'IEEE/ID' ? 'monospace' : 'inherit', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                </div>
              ))}
            </div>
            {/* Telemetry */}
            {selectedDevice.telemetry && Object.keys(selectedDevice.telemetry).length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Live Telemetry</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(selectedDevice.telemetry).map(([k, v]) => (
                    <div key={k} style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '0.68rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                        {typeof v === 'boolean' ? (v ? '✅' : '❌') : String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pairing Wizard */}
      {showWizard && (
        <DevicePairingWizard
          onClose={() => setShowWizard(false)}
          onPaired={handlePaired}
        />
      )}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes radar-pulse { 0% { transform:scale(0.3); opacity:0.8; } 100% { transform:scale(1); opacity:0; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
