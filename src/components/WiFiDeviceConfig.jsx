import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Wifi, WifiOff, Signal, Plus, Search, RefreshCw, Trash2,
  Settings2, CheckCircle2, XCircle, Clock, Activity,
  Power, Server, AlertTriangle, ChevronDown, ChevronRight,
  Globe, X, Save, Eye, EyeOff, Cpu, Radio, Zap,
  Router, Smartphone, Thermometer, Lightbulb, Lock,
  Shield, Key, Copy, RotateCcw, Network, HardDrive,
  ToggleLeft, ToggleRight, Info, ChevronLeft, Loader2,
  BarChart2, Layers, Home, Tag
} from 'lucide-react';

// ── WiFi Device Brands / Firmware ──────────────────────────────────────────
const WIFI_PLATFORMS = {
  TASMOTA: {
    label: 'Tasmota',
    color: '#ef4444',
    bg: '#fef2f2',
    icon: '🔴',
    desc: 'Open-source firmware (ESP8266/ESP32)',
    discoveryPort: 80,
    defaultTopic: 'tasmota/+/stat/POWER',
    setupUrl: 'http://{ip}/cm?cmnd=Status%200',
    brands: ['Sonoff', 'Gosund', 'BlitzWolf', 'Generic ESP'],
    mqttPattern: 'tasmota/{device_id}/cmnd/{command}',
  },
  TUYA: {
    label: 'Tuya / SmartLife',
    color: '#f59e0b',
    bg: '#fffbeb',
    icon: '🟡',
    desc: 'Tuya IoT Platform (WiFi 2.4GHz)',
    discoveryPort: 6668,
    defaultTopic: 'tuya/+/command',
    setupUrl: 'Tuya App pairing',
    brands: ['Gosund', 'Treatlife', 'Kasa', 'Teckin', 'Aubess'],
    mqttPattern: 'tuya/{device_id}/command',
  },
  SHELLY: {
    label: 'Shelly',
    color: '#3b82f6',
    bg: '#eff6ff',
    icon: '🔵',
    desc: 'Shelly Gen1/Gen2 REST & MQTT',
    discoveryPort: 80,
    defaultTopic: 'shellies/+/relay/0',
    setupUrl: 'http://{ip}/settings',
    brands: ['Shelly 1', 'Shelly Plus', 'Shelly Pro', 'Shelly Plug'],
    mqttPattern: 'shellies/{device_id}/relay/0/command',
  },
  ESPHOME: {
    label: 'ESPHome',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    icon: '🟣',
    desc: 'ESPHome YAML-based firmware',
    discoveryPort: 6052,
    defaultTopic: 'esphome/+/state',
    setupUrl: 'http://{ip}/',
    brands: ['ESP8266', 'ESP32', 'Custom DIY'],
    mqttPattern: '{device_name}/command/{component}',
  },
  HOMEASSISTANT: {
    label: 'Home Assistant',
    color: '#06b6d4',
    bg: '#ecfeff',
    icon: '🏠',
    desc: 'HA MQTT Discovery Auto-config',
    discoveryPort: 8123,
    defaultTopic: 'homeassistant/+/+/config',
    setupUrl: 'http://{ip}:8123',
    brands: ['Any HA-compatible device'],
    mqttPattern: 'homeassistant/{component}/{device_id}/command',
  },
  GENERIC: {
    label: 'Generic MQTT WiFi',
    color: '#10b981',
    bg: '#f0fdf4',
    icon: '📡',
    desc: 'Any WiFi device with MQTT support',
    discoveryPort: 1883,
    defaultTopic: 'devices/+/state',
    setupUrl: 'Manual configuration',
    brands: ['Any MQTT-capable device'],
    mqttPattern: 'devices/{device_id}/command',
  },
};

// ── Simulated WiFi Device Database ─────────────────────────────────────────
const SIMULATED_WIFI_DEVICES = [
  { id: 'w1', ip: '192.168.1.101', mac: 'A4:CF:12:78:3B:01', hostname: 'sonoff-pow-r2', platform: 'TASMOTA', brand: 'Sonoff', model: 'POW R2', type: 'PLUG', icon: '🔌', rssi: -42, online: true, uptime: '5d 12h', capabilities: ['on_off', 'power', 'voltage', 'current'], telemetry: { on: true, power: 45.2, voltage: 220, current: 0.21 } },
  { id: 'w2', ip: '192.168.1.102', mac: 'DC:4F:22:11:AA:02', hostname: 'gosund-sp111', platform: 'TUYA', brand: 'Gosund', model: 'SP111 Smart Plug', type: 'PLUG', icon: '🔌', rssi: -58, online: true, uptime: '2d 3h', capabilities: ['on_off', 'power'], telemetry: { on: false, power: 0 } },
  { id: 'w3', ip: '192.168.1.103', mac: 'EC:FA:BC:55:CC:03', hostname: 'shelly1pm-living', platform: 'SHELLY', brand: 'Shelly', model: '1PM Plus', type: 'RELAY', icon: '⚡', rssi: -50, online: true, uptime: '14d 8h', capabilities: ['on_off', 'power', 'temperature'], telemetry: { on: true, power: 120.5, temperature: 38.2 } },
  { id: 'w4', ip: '192.168.1.104', mac: '24:D7:EB:AA:DD:04', hostname: 'esphome-temp-bed', platform: 'ESPHOME', brand: 'DIY ESP32', model: 'BME280 Sensor Node', type: 'SENSOR', icon: '🌡️', rssi: -63, online: true, uptime: '7d 21h', capabilities: ['temperature', 'humidity', 'pressure'], telemetry: { temperature: 24.5, humidity: 65, pressure: 1013 } },
  { id: 'w5', ip: '192.168.1.105', mac: 'B8:27:EB:FE:11:05', hostname: 'tasmota-bulb-1', platform: 'TASMOTA', brand: 'Gosund', model: 'LB3 RGB Bulb', type: 'BULB', icon: '💡', rssi: -70, online: false, uptime: '—', capabilities: ['on_off', 'brightness', 'color_temp'], telemetry: { on: false, brightness: 80, color_temp: 4000 } },
  { id: 'w6', ip: '192.168.1.106', mac: 'C8:2B:96:EE:22:06', hostname: 'shelly-dimmer-2', platform: 'SHELLY', brand: 'Shelly', model: 'Dimmer 2', type: 'BULB', icon: '💡', rssi: -45, online: true, uptime: '3d 5h', capabilities: ['on_off', 'brightness'], telemetry: { on: true, brightness: 70 } },
  { id: 'w7', ip: '192.168.1.107', mac: 'AA:BB:CC:DD:EE:07', hostname: 'tuya-aircon-1', platform: 'TUYA', brand: 'Midea', model: 'WiFi AC Control', type: 'THERMOSTAT', icon: '❄️', rssi: -55, online: true, uptime: '1d 4h', capabilities: ['on_off', 'temperature', 'target_temp'], telemetry: { on: true, temperature: 27, target_temp: 24 } },
];

// ── WiFi Signal Strength Badge ─────────────────────────────────────────────
function SignalBadge({ rssi }) {
  const strength = rssi >= -50 ? 'Excellent' : rssi >= -60 ? 'Good' : rssi >= -70 ? 'Fair' : 'Weak';
  const color = rssi >= -50 ? '#10b981' : rssi >= -60 ? '#3b82f6' : rssi >= -70 ? '#f59e0b' : '#ef4444';
  const bars = rssi >= -50 ? 4 : rssi >= -60 ? 3 : rssi >= -70 ? 2 : 1;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: `${color}18`, borderRadius: '12px', fontSize: '0.7rem', fontWeight: 700, color }}>
      <span style={{ display: 'flex', alignItems: 'flex-end', gap: '1px', height: '12px' }}>
        {[1,2,3,4].map(b => (
          <div key={b} style={{ width: '3px', height: `${3 * b}px`, backgroundColor: b <= bars ? color : '#e2e8f0', borderRadius: '1px' }} />
        ))}
      </span>
      {rssi} dBm
    </span>
  );
}

// ── WiFi Device Card ────────────────────────────────────────────────────────
function WiFiDeviceCard({ device, onToggle, onDelete, onSelect, onConfigure }) {
  const plat = WIFI_PLATFORMS[device.platform] || WIFI_PLATFORMS.GENERIC;
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
      {/* Platform color stripe */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', backgroundColor: plat.color }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '4px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ fontSize: '1.8rem', lineHeight: 1 }}>{device.icon}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a', lineHeight: 1.2 }}>{device.brand} {device.model}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px', fontFamily: 'monospace' }}>{device.ip} · {device.hostname}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '20px', backgroundColor: isOnline ? '#dcfce7' : '#fee2e2', fontSize: '0.68rem', fontWeight: 700 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: isOnline ? '#10b981' : '#ef4444', animation: isOnline ? 'blink 2s infinite' : 'none' }} />
            <span style={{ color: isOnline ? '#065f46' : '#991b1b' }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', padding: '1px 7px', borderRadius: '20px', backgroundColor: plat.bg, fontSize: '0.65rem', fontWeight: 700, color: plat.color }}>
            <span>{plat.icon}</span> {plat.label}
          </div>
        </div>
      </div>

      {/* Telemetry + toggle */}
      <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '4px', alignItems: 'center' }}>
        {device.capabilities?.includes('on_off') && (
          <button
            onClick={e => { e.stopPropagation(); onToggle(device.id, { on: !device.telemetry?.on }); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
          >
            {device.telemetry?.on
              ? <ToggleRight size={28} color={plat.color} />
              : <ToggleLeft size={28} color="#cbd5e1" />}
          </button>
        )}
        {device.telemetry?.power !== undefined && <span style={{ padding: '2px 8px', backgroundColor: '#f1f5f9', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>{device.telemetry.power}W</span>}
        {device.telemetry?.temperature !== undefined && <span style={{ padding: '2px 8px', backgroundColor: '#fff7ed', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: '#c2410c' }}>{device.telemetry.temperature}°C</span>}
        {device.telemetry?.humidity !== undefined && <span style={{ padding: '2px 8px', backgroundColor: '#eff6ff', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: '#1d4ed8' }}>{device.telemetry.humidity}%</span>}
        {device.telemetry?.brightness !== undefined && <span style={{ padding: '2px 8px', backgroundColor: '#fefce8', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 600, color: '#a16207' }}>💡 {device.telemetry.brightness}%</span>}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SignalBadge rssi={device.rssi} />
          {isOnline && <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>↑ {device.uptime}</span>}
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            onClick={e => { e.stopPropagation(); onConfigure(device); }}
            style={{ padding: '4px 8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', color: '#64748b', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem', fontWeight: 600 }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
          >
            <Settings2 size={12} /> Config
          </button>
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
    </div>
  );
}

// ── WiFi Setup Wizard ───────────────────────────────────────────────────────
function WiFiSetupWizard({ onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const [platform, setPlatform] = useState('TASMOTA');
  const [scanning, setScanning] = useState(false);
  const [discovered, setDiscovered] = useState([]);
  const [selected, setSelected] = useState(null);
  const [wifiSSID, setWifiSSID] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [mqttBroker, setMqttBroker] = useState('');
  const [mqttUser, setMqttUser] = useState('');
  const [mqttPass, setMqttPass] = useState('');
  const [mqttTopic, setMqttTopic] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [deviceRoom, setDeviceRoom] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const scanRef = useRef(null);

  const STEPS = ['Platform', 'WiFi Config', 'Scan LAN', 'MQTT Setup', 'Detail'];
  const plat = WIFI_PLATFORMS[platform];

  // Simulate LAN scan
  const startScan = useCallback(() => {
    setScanning(true);
    setDiscovered([]);
    let found = 0;
    const devices = SIMULATED_WIFI_DEVICES.filter(d => d.platform === platform);
    scanRef.current = setInterval(() => {
      if (found < devices.length) {
        setDiscovered(prev => [...prev, { ...devices[found], tempId: `scan_${found}` }]);
        found++;
      } else {
        clearInterval(scanRef.current);
        setScanning(false);
      }
    }, 800);
  }, [platform]);

  useEffect(() => {
    return () => { if (scanRef.current) clearInterval(scanRef.current); };
  }, []);

  useEffect(() => {
    if (step === 2) startScan();
  }, [step]);

  useEffect(() => {
    if (selected) {
      setMqttTopic(plat.mqttPattern.replace('{device_id}', selected.hostname).replace('{device_name}', selected.hostname).replace('{command}', 'POWER').replace('{component}', 'switch/0'));
    }
  }, [selected, platform]);

  const handleSelectDevice = (dev) => {
    setSelected(dev);
    setDeviceName(`${dev.brand} ${dev.model}`);
    setStep(3);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 1500));
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      onSaved?.({
        ...selected,
        name: deviceName,
        room: deviceRoom,
        platform,
        wifiSSID,
        mqttBroker,
        mqttTopic,
        config: {
          platform, wifiSSID, mqttBroker, mqttUser, mqttTopic,
          capabilities: selected?.capabilities || [],
        }
      });
      onClose();
    }, 800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 4000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '560px', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.3)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', background: `linear-gradient(135deg, ${plat.color}22 0%, white 100%)`, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: 36, height: 36, borderRadius: '10px', backgroundColor: plat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>{plat.icon}</div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: '#0f172a' }}>Tambah Perangkat WiFi</h2>
                <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8' }}>Langkah {step + 1} dari {STEPS.length}: {STEPS[step]}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <X size={18} color="#64748b" />
          </button>
        </div>

        {/* Progress */}
        <div style={{ height: '4px', backgroundColor: '#f1f5f9' }}>
          <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: plat.color, transition: 'width 0.4s ease' }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '12px' }}>
          {STEPS.map((s, i) => (
            <div key={i} title={s} style={{ width: i === step ? 28 : 8, height: 8, borderRadius: '4px', backgroundColor: i <= step ? plat.color : '#e2e8f0', transition: 'all 0.3s' }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 16px', maxHeight: '420px', overflowY: 'auto' }}>

          {/* STEP 0: Platform Selection */}
          {step === 0 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Pilih Platform WiFi</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem' }}>Pilih firmware/platform yang digunakan perangkat WiFi Anda.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(WIFI_PLATFORMS).map(([key, meta]) => {
                  const isActive = platform === key;
                  return (
                    <button key={key} onClick={() => setPlatform(key)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${isActive ? meta.color : '#e2e8f0'}`, backgroundColor: isActive ? meta.bg : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', boxShadow: isActive ? `0 0 0 3px ${meta.color}22` : 'none' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: isActive ? meta.color : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>{meta.icon}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>{meta.label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>{meta.desc}</div>
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '2px' }}>📦 {meta.brands.slice(0, 3).join(' · ')}</div>
                      </div>
                      {isActive && <CheckCircle2 size={20} color={meta.color} />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 1: WiFi Configuration */}
          {step === 1 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Konfigurasi WiFi</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.85rem' }}>Masukkan kredensial WiFi rumah Anda (2.4GHz). Perangkat akan terhubung ke jaringan ini.</p>

              <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fcd34d', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', fontSize: '0.8rem', color: '#78350f', display: 'flex', gap: '8px' }}>
                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                <div><strong>Penting:</strong> Kebanyakan perangkat IoT hanya mendukung WiFi <strong>2.4GHz</strong>. Pastikan router Anda memisahkan band 2.4GHz dan 5GHz.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
                    <Wifi size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Nama WiFi (SSID)
                  </label>
                  <input type="text" value={wifiSSID} onChange={e => setWifiSSID(e.target.value)} placeholder="Nama jaringan WiFi Anda" style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = plat.color} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
                    <Key size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Password WiFi
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPass ? 'text' : 'password'} value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="Password WiFi Anda" style={{ width: '100%', padding: '10px 40px 10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = plat.color} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Platform-specific instructions */}
                <div style={{ backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd', padding: '14px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#0369a1', marginBottom: '8px' }}>📋 Cara pairing {plat.label}:</div>
                  {platform === 'TASMOTA' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Flash firmware Tasmota ke perangkat ESP.<br/>2. Hubungkan ke hotspot Tasmota-XXXX.<br/>3. Buka <code>192.168.4.1</code> dan masukkan SSID di atas.<br/>4. Perangkat akan restart dan terhubung ke WiFi Anda.</div>}
                  {platform === 'TUYA' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Download aplikasi SmartLife / Tuya Smart.<br/>2. Tekan "+" → tambah perangkat → masukkan SSID di atas.<br/>3. Tekan tombol reset perangkat 5 detik hingga LED berkedip.<br/>4. Ikuti instruksi di aplikasi untuk pairing.</div>}
                  {platform === 'SHELLY' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Nyalakan Shelly, hubungkan ke hotspot ShellyXX-XXXX.<br/>2. Buka <code>192.168.33.1</code> → WiFi → masukkan SSID di atas.<br/>3. Shelly akan restart dan terhubung ke jaringan Anda.<br/>4. Cek IP di router Anda.</div>}
                  {platform === 'ESPHOME' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Tambahkan SSID dan password di file YAML ESPHome Anda.<br/>2. Compile dan flash ke perangkat ESP.<br/>3. Perangkat otomatis terhubung dan ditemukan via mDNS.</div>}
                  {platform === 'HOMEASSISTANT' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Pastikan HA sudah running di jaringan yang sama.<br/>2. Masukkan IP HA di langkah berikutnya.<br/>3. Aktifkan MQTT Broker di HA (Add-on Mosquitto).</div>}
                  {platform === 'GENERIC' && <div style={{ fontSize: '0.78rem', color: '#0c4a6e', lineHeight: 1.7 }}>1. Hubungkan perangkat ke WiFi Anda melalui app atau hotspot bawaan.<br/>2. Cek IP perangkat di router Anda.<br/>3. Konfigurasikan MQTT broker di langkah berikutnya.</div>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LAN Scanner */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ margin: '0 0 2px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Scan Jaringan Lokal</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>Mencari perangkat {plat.label} di LAN (192.168.x.x)...</p>
                </div>
                <button onClick={startScan} disabled={scanning} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px', borderRadius: '8px', border: `1.5px solid ${plat.color}`, backgroundColor: scanning ? plat.bg : plat.color, color: scanning ? plat.color : 'white', fontWeight: 700, fontSize: '0.78rem', cursor: scanning ? 'default' : 'pointer' }}>
                  <RefreshCw size={14} style={{ animation: scanning ? 'spin 1s linear infinite' : 'none' }} /> {scanning ? 'Scanning...' : 'Scan Ulang'}
                </button>
              </div>

              {/* Radar / Scanning animation */}
              {scanning && discovered.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px', gap: '16px' }}>
                  <div style={{ position: 'relative', width: 80, height: 80 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${plat.color}`, opacity: 0, animation: `radar-pulse 2s ease-out ${i * 0.66}s infinite` }} />
                    ))}
                    <div style={{ position: 'absolute', inset: '20%', borderRadius: '50%', backgroundColor: plat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Wifi size={20} color="white" />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>Memindai port {WIFI_PLATFORMS[platform]?.discoveryPort}...</div>
                </div>
              )}

              {/* Discovered list */}
              {discovered.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {discovered.length} Perangkat Ditemukan {scanning && <span style={{ color: plat.color }}>· Scanning...</span>}
                  </div>
                  {discovered.map(dev => (
                    <button key={dev.id} onClick={() => handleSelectDevice(dev)} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: '1.5px solid #e2e8f0', backgroundColor: 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = plat.color; e.currentTarget.style.backgroundColor = plat.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white'; }}>
                      <span style={{ fontSize: '1.6rem' }}>{dev.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{dev.brand} {dev.model}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>{dev.ip} · {dev.hostname}</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                        <SignalBadge rssi={dev.rssi} />
                        <div style={{ fontSize: '0.68rem', color: dev.online ? '#10b981' : '#ef4444', fontWeight: 700 }}>{dev.online ? '● Online' : '○ Offline'}</div>
                      </div>
                      <ChevronRight size={16} color="#94a3b8" />
                    </button>
                  ))}
                </div>
              )}

              {!scanning && discovered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '32px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                  <WifiOff size={36} color="#cbd5e1" style={{ marginBottom: '10px' }} />
                  <div style={{ fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Tidak ada perangkat ditemukan</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pastikan perangkat sudah terhubung ke WiFi yang sama.</div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: MQTT Setup */}
          {step === 3 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Konfigurasi MQTT</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.82rem' }}>Atur MQTT broker untuk mengirim dan menerima perintah dari perangkat.</p>

              {selected && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', backgroundColor: plat.bg, borderRadius: '10px', border: `1px solid ${plat.color}44`, marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.5rem' }}>{selected.icon}</span>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>{selected.brand} {selected.model}</div>
                    <div style={{ fontSize: '0.73rem', color: '#64748b', fontFamily: 'monospace' }}>{selected.ip} · {selected.hostname}</div>
                  </div>
                  <CheckCircle2 size={18} color={plat.color} style={{ marginLeft: 'auto' }} />
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>MQTT Broker URL</label>
                  <input type="text" value={mqttBroker} onChange={e => setMqttBroker(e.target.value)} placeholder="mqtt://192.168.1.10:1883 atau wss://broker.emqx.io:8084/mqtt" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>Username (opsional)</label>
                    <input type="text" value={mqttUser} onChange={e => setMqttUser(e.target.value)} placeholder="mqtt_user" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>Password (opsional)</label>
                    <input type="password" value={mqttPass} onChange={e => setMqttPass(e.target.value)} placeholder="••••••••" style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.73rem', fontWeight: 700, color: '#374151', textTransform: 'uppercase' }}>MQTT Topic (Command)</label>
                    <button onClick={() => setMqttTopic(plat.mqttPattern.replace('{device_id}', selected?.hostname || 'device').replace('{device_name}', selected?.hostname || 'device').replace('{command}', 'POWER').replace('{component}', 'switch/0'))} style={{ fontSize: '0.7rem', color: plat.color, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Auto-generate
                    </button>
                  </div>
                  <input type="text" value={mqttTopic} onChange={e => setMqttTopic(e.target.value)} placeholder={plat.mqttPattern} style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.8rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>Pattern: <code>{plat.mqttPattern}</code></div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Details */}
          {step === 4 && (
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>Informasi Perangkat</h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.82rem' }}>Beri nama dan lokasi perangkat Anda.</p>

              {!saved ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                    <span style={{ fontSize: '2rem' }}>{selected?.icon || '📡'}</span>
                    <div>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{selected?.brand} {selected?.model}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{selected?.ip} · {plat.label}</div>
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
                      <Tag size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Nama Perangkat
                    </label>
                    <input type="text" value={deviceName} onChange={e => setDeviceName(e.target.value)} placeholder={`e.g. Smart Plug Ruang Tamu`} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase' }}>
                      <Home size={12} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Ruangan
                    </label>
                    <select value={deviceRoom} onChange={e => setDeviceRoom(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white' }}>
                      <option value="">Pilih Ruangan...</option>
                      {['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Garage', 'Garden', 'Corridor', 'Dining Room', 'Balcony'].map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>

                  {/* Summary */}
                  <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '12px 14px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Ringkasan Konfigurasi</div>
                    {[
                      ['Platform', plat.label],
                      ['IP Address', selected?.ip || '—'],
                      ['WiFi SSID', wifiSSID || '—'],
                      ['MQTT Broker', mqttBroker || '—'],
                      ['MQTT Topic', mqttTopic || '—'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', padding: '3px 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ color: '#64748b', fontWeight: 600 }}>{k}</span>
                        <span style={{ color: '#0f172a', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.73rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px' }}>
                  <CheckCircle2 size={56} color="#10b981" style={{ marginBottom: '12px' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0f172a', marginBottom: '4px' }}>Perangkat berhasil ditambahkan!</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{deviceName} telah tersimpan dan siap digunakan.</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0 || step === 2} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: (step === 0 || step === 2) ? '#cbd5e1' : '#374151', fontSize: '0.85rem', fontWeight: 700, cursor: (step === 0 || step === 2) ? 'default' : 'pointer' }}>
            <ChevronLeft size={16} /> Kembali
          </button>

          {step === 4 ? (
            <button onClick={handleSave} disabled={!deviceName || saving || saved} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', borderRadius: '8px', backgroundColor: saved ? '#10b981' : plat.color, color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: !deviceName || saving || saved ? 'default' : 'pointer', opacity: !deviceName ? 0.5 : 1 }}>
              {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : saved ? <><CheckCircle2 size={16} /> Tersimpan!</> : <><Save size={16} /> Simpan Perangkat</>}
            </button>
          ) : step === 2 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Pilih perangkat dari hasil scan ↑</div>
          ) : step === 3 ? (
            <button onClick={() => setStep(4)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', borderRadius: '8px', backgroundColor: plat.color, color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
              Lanjut <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !platform} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', borderRadius: '8px', backgroundColor: plat.color, color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer' }}>
              Lanjut <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
      <style>{`
        @keyframes radar-pulse { 0% { transform: scale(0.3); opacity: 0.8; } 100% { transform: scale(1); opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
      `}</style>
    </div>
  );
}

// ── WiFi Device Config Modal ────────────────────────────────────────────────
function WiFiConfigModal({ device, onClose, onSave }) {
  const plat = WIFI_PLATFORMS[device.platform] || WIFI_PLATFORMS.GENERIC;
  const [tab, setTab] = useState('network');
  const [ip, setIp] = useState(device.ip || '');
  const [hostname, setHostname] = useState(device.hostname || '');
  const [mqttBroker, setMqttBroker] = useState(device.config?.mqttBroker || '');
  const [mqttTopic, setMqttTopic] = useState(device.mqttTopic || '');
  const [wifiSSID, setWifiSSID] = useState(device.config?.wifiSSID || '');
  const [wifiPass, setWifiPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [testStatus, setTestStatus] = useState(null);
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    setTestStatus(null);
    await new Promise(r => setTimeout(r, 1500));
    setTesting(false);
    setTestStatus(device.online ? 'success' : 'error');
  };

  const TABS = [
    { id: 'network', label: 'Jaringan', icon: Network },
    { id: 'mqtt', label: 'MQTT', icon: Server },
    { id: 'advanced', label: 'Advanced', icon: Settings2 },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3500, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '18px', width: '100%', maxWidth: '500px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ fontSize: '1.8rem' }}>{device.icon}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>{device.brand} {device.model}</div>
            <div style={{ fontSize: '0.73rem', color: '#64748b', fontFamily: 'monospace' }}>{device.ip} · <span style={{ color: plat.color, fontWeight: 700 }}>{plat.label}</span></div>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={handleTest} disabled={testing} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 12px', borderRadius: '7px', border: `1px solid ${testStatus === 'success' ? '#10b981' : testStatus === 'error' ? '#ef4444' : '#e2e8f0'}`, backgroundColor: 'white', color: testStatus === 'success' ? '#10b981' : testStatus === 'error' ? '#ef4444' : '#64748b', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>
              {testing ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : testStatus === 'success' ? <CheckCircle2 size={13} /> : testStatus === 'error' ? <XCircle size={13} /> : <Activity size={13} />}
              {testing ? 'Testing...' : testStatus === 'success' ? 'Terhubung!' : testStatus === 'error' ? 'Gagal' : 'Test Ping'}
            </button>
            <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
              <X size={18} color="#64748b" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f1f5f9', padding: '0 22px' }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '10px 14px', border: 'none', borderBottom: `2px solid ${active ? plat.color : 'transparent'}`, backgroundColor: 'transparent', color: active ? plat.color : '#64748b', fontWeight: active ? 700 : 600, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}>
                <Icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: '18px 22px', maxHeight: '320px', overflowY: 'auto' }}>
          {tab === 'network' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>IP Address</label>
                  <input type="text" value={ip} onChange={e => setIp(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>Hostname</label>
                  <input type="text" value={hostname} onChange={e => setHostname(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>WiFi SSID</label>
                <input type="text" value={wifiSSID} onChange={e => setWifiSSID(e.target.value)} placeholder="Nama WiFi yang terhubung" style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>WiFi Password (Ubah)</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPass ? 'text' : 'password'} value={wifiPass} onChange={e => setWifiPass(e.target.value)} placeholder="Kosongkan jika tidak berubah" style={{ width: '100%', padding: '8px 36px 8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
                  <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {/* Realtime info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[['MAC Address', device.mac], ['Signal', `${device.rssi} dBm`], ['Uptime', device.uptime || '—'], ['Status', device.online ? 'Online' : 'Offline']].map(([k, v]) => (
                  <div key={k} style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.82rem', fontFamily: 'monospace' }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'mqtt' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>MQTT Broker URL</label>
                <input type="text" value={mqttBroker} onChange={e => setMqttBroker(e.target.value)} placeholder="mqtt://192.168.1.10:1883" style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: '#374151', marginBottom: '5px', textTransform: 'uppercase' }}>Command Topic</label>
                <input type="text" value={mqttTopic} onChange={e => setMqttTopic(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: '7px', border: '1.5px solid #e2e8f0', fontSize: '0.82rem', boxSizing: 'border-box', fontFamily: 'monospace' }} />
              </div>
              <div style={{ padding: '12px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>📡 MQTT Pattern {plat.label}</div>
                <code style={{ fontSize: '0.73rem', color: '#0c4a6e', display: 'block', lineHeight: 1.7 }}>
                  Command: {plat.mqttPattern}<br />
                  State: {plat.defaultTopic}
                </code>
              </div>
            </div>
          )}

          {tab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '14px', backgroundColor: '#fff7ed', borderRadius: '10px', border: '1px solid #fdba74' }}>
                <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#c2410c', marginBottom: '8px' }}>⚠️ Zona Berbahaya</div>
                <button style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1.5px solid #ef4444', backgroundColor: 'white', color: '#ef4444', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <RotateCcw size={14} /> Reset ke Factory Default
                </button>
              </div>
              <div style={{ padding: '12px 14px', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase' }}>Web Interface</div>
                <a href={`http://${device.ip}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 12px', borderRadius: '7px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#3b82f6', fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none' }}>
                  <Globe size={13} /> Buka {plat.setupUrl.replace('{ip}', device.ip)}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 22px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            Batal
          </button>
          <button onClick={() => { onSave?.({ ...device, ip, hostname, config: { ...device.config, mqttBroker, mqttTopic, wifiSSID }, mqttTopic }); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px', border: 'none', backgroundColor: plat.color, color: 'white', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            <Save size={14} /> Simpan Perubahan
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Main WiFi Manager Component ─────────────────────────────────────────────
export default function WiFiDeviceManager() {
  const [devices, setDevices] = useState(SIMULATED_WIFI_DEVICES);
  const [showWizard, setShowWizard] = useState(false);
  const [configDevice, setConfigDevice] = useState(null);
  const [detailDevice, setDetailDevice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [activeTab, setActiveTab] = useState('devices');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleToggle = (id, command) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, telemetry: { ...d.telemetry, ...command } } : d));
  };

  const handleDelete = (id) => {
    if (!window.confirm('Hapus perangkat ini?')) return;
    setDevices(prev => prev.filter(d => d.id !== id));
  };

  const handleSave = (updated) => {
    setDevices(prev => prev.map(d => d.id === updated.id ? updated : d));
  };

  const handleNewDevice = (device) => {
    setDevices(prev => [...prev, { ...device, id: `w${Date.now()}`, online: true }]);
  };

  const handleNetworkScan = () => {
    setScanning(true);
    setScanProgress(0);
    const iv = setInterval(() => {
      setScanProgress(p => {
        if (p >= 100) { clearInterval(iv); setScanning(false); return 100; }
        return p + 2;
      });
    }, 60);
  };

  const filtered = devices.filter(d => {
    const matchSearch = !searchTerm || d.brand?.toLowerCase().includes(searchTerm.toLowerCase()) || d.model?.toLowerCase().includes(searchTerm.toLowerCase()) || d.ip?.includes(searchTerm) || d.hostname?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlatform = filterPlatform === 'ALL' || d.platform === filterPlatform;
    const matchStatus = filterStatus === 'ALL' || (filterStatus === 'ONLINE' ? d.online : !d.online);
    return matchSearch && matchPlatform && matchStatus;
  });

  const stats = {
    total: devices.length,
    online: devices.filter(d => d.online).length,
    offline: devices.filter(d => !d.online).length,
    platforms: Object.keys(WIFI_PLATFORMS).reduce((acc, k) => {
      acc[k] = devices.filter(d => d.platform === k).length;
      return acc;
    }, {}),
  };

  const TABS = [
    { id: 'devices', label: `Devices (${devices.length})`, icon: Layers },
    { id: 'scan', label: 'Network Scanner', icon: Radio },
    { id: 'platforms', label: 'Platforms', icon: Server },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>

      {/* Header */}
      <div style={{ padding: '20px 28px', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wifi size={20} color="white" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>WiFi Smart Devices</h2>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem' }}>Tasmota · Tuya · Shelly · ESPHome · Home Assistant</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 700, color: '#16a34a' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16a34a', animation: 'blink 2s infinite' }} />
            {stats.online} Online
          </div>
          <button onClick={() => setShowWizard(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#3b82f6'}>
            <Plus size={16} /> Tambah Device WiFi
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '0 28px', display: 'flex', gap: '4px', flexShrink: 0 }}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 16px', border: 'none', borderBottom: `3px solid ${active ? '#3b82f6' : 'transparent'}`, backgroundColor: 'transparent', color: active ? '#3b82f6' : '#64748b', fontWeight: active ? 700 : 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', marginBottom: '-1px' }}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Total', value: stats.total, color: '#3b82f6', bg: '#eff6ff' },
                { label: 'Online', value: stats.online, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Offline', value: stats.offline, color: '#ef4444', bg: '#fef2f2' },
                { label: 'Platform', value: Object.values(WIFI_PLATFORMS).length, color: '#8b5cf6', bg: '#f5f3ff' },
              ].map(s => (
                <div key={s.label} style={{ backgroundColor: s.bg, borderRadius: '12px', padding: '14px 16px', border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px', maxWidth: '300px' }}>
                <Search size={15} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input type="text" placeholder="Cari IP, brand, hostname..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '9px 12px 9px 34px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', boxSizing: 'border-box' }} />
              </div>
              <select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.82rem', backgroundColor: 'white', cursor: 'pointer' }}>
                <option value="ALL">Semua Platform</option>
                {Object.entries(WIFI_PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
              <div style={{ display: 'flex', gap: '5px' }}>
                {['ALL', 'ONLINE', 'OFFLINE'].map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '7px 13px', borderRadius: '8px', border: `1.5px solid ${filterStatus === s ? '#3b82f6' : '#e2e8f0'}`, backgroundColor: filterStatus === s ? '#eff6ff' : 'white', color: filterStatus === s ? '#3b82f6' : '#64748b', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.15s' }}>
                    {s === 'ALL' ? 'Semua' : s === 'ONLINE' ? '● Online' : '○ Offline'}
                  </button>
                ))}
              </div>
            </div>

            {/* Device grid */}
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', backgroundColor: 'white', borderRadius: '16px', border: '1.5px dashed #e2e8f0' }}>
                <WifiOff size={48} color="#cbd5e1" style={{ marginBottom: '16px' }} />
                <h3 style={{ margin: '0 0 8px', color: '#374151' }}>Tidak ada perangkat</h3>
                <p style={{ color: '#94a3b8', margin: '0 0 20px', fontSize: '0.88rem' }}>Tambah perangkat WiFi baru atau ubah filter pencarian.</p>
                <button onClick={() => setShowWizard(true)} style={{ padding: '10px 24px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}>
                  <Plus size={16} style={{ verticalAlign: 'middle', marginRight: '6px' }} /> Tambah Device WiFi
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '14px' }}>
                {filtered.map(device => (
                  <WiFiDeviceCard
                    key={device.id}
                    device={device}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSelect={setDetailDevice}
                    onConfigure={setConfigDevice}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Network Scanner Tab */}
        {activeTab === 'scan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ backgroundColor: 'white', borderRadius: '16px', border: '1.5px solid #e2e8f0', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontWeight: 900, color: '#0f172a' }}>Network Scanner</h3>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Pindai jaringan LAN untuk menemukan perangkat IoT WiFi</p>
                </div>
                <button onClick={handleNetworkScan} disabled={scanning} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: scanning ? '#e2e8f0' : '#3b82f6', color: scanning ? '#94a3b8' : 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: scanning ? 'default' : 'pointer', fontSize: '0.85rem' }}>
                  <Radio size={16} style={{ animation: scanning ? 'spin 2s linear infinite' : 'none' }} />
                  {scanning ? `Scanning... ${scanProgress}%` : 'Start Scan'}
                </button>
              </div>

              {scanning && (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Memindai 192.168.1.1 – 192.168.1.254</span>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#3b82f6' }}>{scanProgress}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${scanProgress}%`, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)', borderRadius: '3px', transition: 'width 0.1s' }} />
                  </div>
                </div>
              )}

              {/* Scan results table */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc' }}>
                      {['IP Address', 'Hostname', 'Platform', 'MAC', 'Signal', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIMULATED_WIFI_DEVICES.map((d, i) => {
                      const plat = WIFI_PLATFORMS[d.platform];
                      return (
                        <tr key={d.id} style={{ borderBottom: i < SIMULATED_WIFI_DEVICES.length - 1 ? '1px solid #f1f5f9' : 'none', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f8fafc'}
                          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 700 }}>{d.ip}</td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#475569' }}>{d.hostname}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: plat.bg, color: plat.color, borderRadius: '12px', fontWeight: 700, fontSize: '0.72rem' }}>
                              {plat.icon} {plat.label}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.75rem' }}>{d.mac}</td>
                          <td style={{ padding: '10px 14px' }}><SignalBadge rssi={d.rssi} /></td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', backgroundColor: d.online ? '#dcfce7' : '#fee2e2', borderRadius: '12px', fontSize: '0.72rem', fontWeight: 700, color: d.online ? '#065f46' : '#991b1b' }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: d.online ? '#10b981' : '#ef4444' }} />
                              {d.online ? 'Online' : 'Offline'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Platforms Tab */}
        {activeTab === 'platforms' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {Object.entries(WIFI_PLATFORMS).map(([key, plat]) => {
              const count = devices.filter(d => d.platform === key).length;
              return (
                <div key={key} style={{ backgroundColor: 'white', borderRadius: '16px', border: `2px solid ${count > 0 ? plat.color + '55' : '#e2e8f0'}`, padding: '20px', boxShadow: count > 0 ? `0 0 0 3px ${plat.color}11` : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: 44, height: 44, borderRadius: '12px', backgroundColor: plat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>{plat.icon}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{plat.label}</div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{plat.desc}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 900, color: count > 0 ? plat.color : '#cbd5e1' }}>{count}</div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '10px' }}>
                    <strong>Brand:</strong> {plat.brands.join(' · ')}
                  </div>
                  <div style={{ padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '8px', fontFamily: 'monospace', fontSize: '0.7rem', color: '#64748b' }}>
                    {plat.mqttPattern}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Device Detail Drawer */}
      {detailDevice && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }}
          onClick={() => setDetailDevice(null)}>
          <div style={{ width: '380px', height: '100%', backgroundColor: 'white', overflowY: 'auto', padding: '24px', boxShadow: '-8px 0 32px rgba(0,0,0,0.15)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.05rem' }}>Device Detail</h3>
              <button onClick={() => setDetailDevice(null)} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
                <X size={18} color="#64748b" />
              </button>
            </div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '8px' }}>{detailDevice.icon}</div>
              <div style={{ fontWeight: 900, fontSize: '1.05rem', color: '#0f172a' }}>{detailDevice.brand} {detailDevice.model}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', fontFamily: 'monospace' }}>{detailDevice.ip}</div>
              <div style={{ marginTop: '8px' }}>
                <span style={{ padding: '3px 12px', borderRadius: '20px', backgroundColor: WIFI_PLATFORMS[detailDevice.platform]?.bg, color: WIFI_PLATFORMS[detailDevice.platform]?.color, fontWeight: 700, fontSize: '0.78rem' }}>
                  {WIFI_PLATFORMS[detailDevice.platform]?.icon} {WIFI_PLATFORMS[detailDevice.platform]?.label}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '18px' }}>
              {[
                ['IP Address', detailDevice.ip],
                ['Hostname', detailDevice.hostname],
                ['MAC Address', detailDevice.mac],
                ['Platform', WIFI_PLATFORMS[detailDevice.platform]?.label],
                ['Signal', `${detailDevice.rssi} dBm`],
                ['Uptime', detailDevice.uptime || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>{k}</span>
                  <span style={{ fontSize: '0.78rem', color: '#0f172a', fontWeight: 700, fontFamily: 'monospace' }}>{v}</span>
                </div>
              ))}
            </div>

            {/* Live Telemetry */}
            {detailDevice.telemetry && Object.keys(detailDevice.telemetry).length > 0 && (
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#64748b', marginBottom: '8px', textTransform: 'uppercase' }}>Live Telemetry</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(detailDevice.telemetry).map(([k, v]) => (
                    <div key={k} style={{ padding: '10px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                      <div style={{ fontSize: '0.65rem', color: '#0369a1', fontWeight: 700, textTransform: 'uppercase', marginBottom: '2px' }}>{k.replace(/_/g, ' ')}</div>
                      <div style={{ fontWeight: 900, color: '#0f172a', fontSize: '0.95rem' }}>
                        {typeof v === 'boolean' ? (v ? '✅ ON' : '❌ OFF') : String(v)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => { setConfigDevice(detailDevice); setDetailDevice(null); }} style={{ marginTop: '18px', width: '100%', padding: '10px', borderRadius: '8px', border: `1.5px solid ${WIFI_PLATFORMS[detailDevice.platform]?.color}`, backgroundColor: 'white', color: WIFI_PLATFORMS[detailDevice.platform]?.color, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <Settings2 size={15} /> Konfigurasi Perangkat
            </button>
          </div>
        </div>
      )}

      {/* WiFi Setup Wizard */}
      {showWizard && <WiFiSetupWizard onClose={() => setShowWizard(false)} onSaved={handleNewDevice} />}

      {/* Config Modal */}
      {configDevice && <WiFiConfigModal device={configDevice} onClose={() => setConfigDevice(null)} onSave={handleSave} />}

      <style>{`
        @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.3; } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
