import React, { useState, useEffect, useRef } from 'react';
import {
  X, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Wifi, Bluetooth, Cpu, Zap, Home, Tag, AlertTriangle, Router
} from 'lucide-react';

// ── Protocol meta-info ─────────────────────────────────────────────────────
const PROTOCOL_META = {
  ZIGBEE: {
    label: 'Zigbee',
    color: '#f59e0b',
    bg: '#fffbeb',
    border: '#fcd34d',
    icon: Zap,
    instructions: [
      'Pastikan Zigbee Gateway (Zigbee2MQTT / Coordinator) aktif dan terhubung.',
      'Tekan dan tahan tombol reset/pair pada perangkat selama 5-10 detik hingga LED berkedip.',
      'Lepaskan tombol — perangkat akan masuk mode pairing.',
      'Mavi akan mendeteksi perangkat secara otomatis dalam 30 detik.',
    ],
    tip: 'Pastikan perangkat dalam jarak 10m dari coordinator/router Zigbee.'
  },
  MATTER: {
    label: 'Matter',
    color: '#8b5cf6',
    bg: '#f5f3ff',
    border: '#c4b5fd',
    icon: Cpu,
    instructions: [
      'Pastikan perangkat Matter terhubung ke jaringan WiFi yang sama.',
      'Scan QR code yang ada di kemasan perangkat, atau masukkan Matter Setup Code.',
      'Perangkat akan ditemukan secara otomatis di jaringan lokal.',
      'Matter mendukung: iOS 16+, Android 8.1+, Google Home, Apple Home.',
    ],
    tip: 'Matter bekerja via WiFi/Thread — tidak butuh hub khusus.'
  },
  BLE: {
    label: 'Bluetooth LE',
    color: '#3b82f6',
    bg: '#eff6ff',
    border: '#93c5fd',
    icon: Bluetooth,
    instructions: [
      'Pastikan Bluetooth aktif di BLE Gateway yang terhubung ke Mavi.',
      'Nyalakan atau reset perangkat BLE ke mode advertising/pairing.',
      'LED biru berkedip cepat menandakan perangkat siap di-pair.',
      'Jaga jarak maksimum 10 meter dari BLE Gateway.',
    ],
    tip: 'BLE Mesh cocok untuk perangkat kecil hemat daya seperti sensor dan lampu.'
  },
  WIFI: {
    label: 'WiFi (ESP/Tuya/Shelly)',
    color: '#06b6d4',
    bg: '#ecfeff',
    border: '#67e8f9',
    icon: Router,
    instructions: [
      'Pastikan perangkat sudah terhubung ke jaringan WiFi 2.4GHz yang sama.',
      'Untuk Tasmota: akses hotspot Tasmota-XXXX lalu masukkan SSID WiFi Anda.',
      'Untuk Tuya/SmartLife: gunakan aplikasi untuk initial pairing dulu.',
      'Setelah terhubung ke WiFi, Mavi akan menemukannya via LAN scan.',
    ],
    tip: 'WiFi devices seperti Sonoff Tasmota, Gosund, dan Shelly tidak butuh hub khusus — langsung via LAN/MQTT.'
  }
};

const ROOMS = ['Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Office', 'Garage', 'Garden', 'Corridor', 'Dining Room', 'Balcony'];

// ── Step Components ────────────────────────────────────────────────────────
function StepProtocol({ selected, onSelect }) {
  return (
    <div>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Pilih Protokol</h3>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.9rem' }}>Pilih jenis protokol perangkat yang akan di-pair.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Object.entries(PROTOCOL_META).map(([key, meta]) => {
          const Icon = meta.icon;
          const isActive = selected === key;
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '16px',
                padding: '16px 20px', borderRadius: '12px',
                border: `2px solid ${isActive ? meta.color : '#e2e8f0'}`,
                backgroundColor: isActive ? meta.bg : 'white',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 0 3px ${meta.color}22` : 'none'
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: isActive ? meta.color : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={22} color={isActive ? 'white' : '#64748b'} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{meta.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                  {key === 'ZIGBEE' && 'Zigbee2MQTT · Koordinator USB · Mesh Network'}
                  {key === 'MATTER' && 'WiFi · Thread · Standard universal Apple/Google/Amazon'}
                  {key === 'BLE' && 'Bluetooth 5.0 LE · BLE Mesh · Hemat daya'}
                  {key === 'WIFI' && 'Tasmota · Tuya · Shelly · ESPHome · LAN/MQTT'}
                </div>
              </div>
              {isActive && <CheckCircle2 size={20} color={meta.color} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepInstructions({ protocol }) {
  const meta = PROTOCOL_META[protocol];
  const Icon = meta.icon;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ width: 44, height: 44, borderRadius: '10px', backgroundColor: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color="white" />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800 }}>Persiapkan Perangkat {meta.label}</h3>
          <p style={{ margin: '2px 0 0', color: '#64748b', fontSize: '0.82rem' }}>Ikuti langkah berikut sebelum scanning</p>
        </div>
      </div>

      <ol style={{ margin: '0 0 20px', padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {meta.instructions.map((inst, i) => (
          <li key={i} style={{ color: '#334155', fontSize: '0.88rem', lineHeight: 1.6 }}>
            <span style={{ fontWeight: 600 }}>Step {i + 1}:</span> {inst}
          </li>
        ))}
      </ol>

      <div style={{ display: 'flex', gap: '10px', padding: '12px 16px', backgroundColor: '#f0f9ff', borderRadius: '10px', border: '1px solid #bae6fd' }}>
        <Wifi size={16} color="#0284c7" style={{ flexShrink: 0, marginTop: 2 }} />
        <p style={{ margin: 0, fontSize: '0.82rem', color: '#0369a1' }}>{meta.tip}</p>
      </div>
    </div>
  );
}

function StepScanning({ protocol, onDeviceFound, discoveredDevices }) {
  const meta = PROTOCOL_META[protocol];
  const [dots, setDots] = useState('');

  useEffect(() => {
    const iv = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <h3 style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Scanning {meta.label}</h3>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.88rem' }}>Mendeteksi perangkat di sekitar{dots}</p>

      {/* Radar animation */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', width: 120, height: 120 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              border: `2px solid ${meta.color}`,
              opacity: 0,
              animation: `radar-pulse 2s ease-out ${i * 0.66}s infinite`,
            }} />
          ))}
          <div style={{
            position: 'absolute', inset: '25%', borderRadius: '50%',
            backgroundColor: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Wifi size={24} color="white" />
          </div>
        </div>
      </div>

      {/* Discovered devices */}
      {discoveredDevices.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', padding: '8px' }}>
          Menunggu perangkat{dots}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {discoveredDevices.length} Perangkat Ditemukan
          </div>
          {discoveredDevices.map(dev => (
            <button
              key={dev.tempId}
              onClick={() => onDeviceFound(dev)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 16px', borderRadius: '10px',
                border: '1px solid #e2e8f0', backgroundColor: 'white',
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.backgroundColor = meta.bg; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.backgroundColor = 'white'; }}
            >
              <span style={{ fontSize: '1.5rem' }}>{dev.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.88rem' }}>{dev.brand} {dev.model}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {dev.ieeeAddress || dev.matterId || dev.bleMac} · Signal: {dev.signalStrength} dBm
                </div>
              </div>
              <ChevronRight size={16} color="#94a3b8" />
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes radar-pulse {
          0% { transform: scale(0.3); opacity: 0.8; }
          100% { transform: scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function StepPairing({ device, pairing, paired }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 0' }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{device?.icon || '📡'}</div>
      <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', fontWeight: 800 }}>
        {paired ? 'Pairing Berhasil!' : pairing ? 'Sedang Pairing...' : 'Siap Pair'}
      </h3>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.88rem' }}>
        {device?.brand} {device?.model}
      </p>

      {pairing && !paired && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <Loader2 size={48} color="#3b82f6" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Menghubungkan perangkat ke Mavi...</div>
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {paired && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <CheckCircle2 size={56} color="#10b981" />
          <div style={{ padding: '12px 20px', backgroundColor: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
            <div style={{ fontSize: '0.82rem', color: '#166534', fontWeight: 600 }}>Perangkat berhasil terdaftar!</div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDetails({ device, name, setName, room, setRoom }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px' }}>
        <span style={{ fontSize: '2rem' }}>{device?.icon}</span>
        <div>
          <div style={{ fontWeight: 800, color: '#0f172a' }}>{device?.brand} {device?.model}</div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{device?.category} · {device?.protocol}</div>
        </div>
        <CheckCircle2 size={20} color="#10b981" style={{ marginLeft: 'auto' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Tag size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Nama Perangkat
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`e.g. Living Room ${device?.type || 'Device'}`}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Home size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Ruangan
          </label>
          <select
            value={room}
            onChange={e => setRoom(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.9rem', backgroundColor: 'white', cursor: 'pointer' }}
          >
            <option value="">Pilih Ruangan...</option>
            {ROOMS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#374151', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Capabilities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {(device?.capabilities || []).map(cap => (
              <span key={cap} style={{ padding: '3px 10px', backgroundColor: '#dbeafe', color: '#1d4ed8', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600 }}>
                {cap.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Wizard ──────────────────────────────────────────────────────────────
const STEPS = ['Protokol', 'Persiapan', 'Scanning', 'Pairing', 'Detail'];

export default function DevicePairingWizard({ onClose, onPaired, gateway }) {
  const [step, setStep] = useState(0);
  const [protocol, setProtocol] = useState('ZIGBEE');
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [pairing, setPairing] = useState(false);
  const [paired, setPaired] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [deviceRoom, setDeviceRoom] = useState('');
  const scanningRef = useRef(false);

  // Start scan when entering step 2
  useEffect(() => {
    if (step === 2 && !scanningRef.current) {
      scanningRef.current = true;
      setDiscoveredDevices([]);

      // Dynamic import to avoid circular deps
      import('../utils/iotProtocolGateway.js').then(({ default: gw }) => {
        const unsub = gw.onDiscovery(({ event, devices }) => {
          if (event === 'DEVICE_FOUND' || event === 'SCAN_COMPLETE') {
            setDiscoveredDevices([...devices]);
          }
        });

        gw.startDiscovery(protocol, { simulationMode: true, duration: 10000 });

        return () => {
          unsub();
          gw.stopDiscovery(protocol);
        };
      });
    }
    if (step !== 2) {
      scanningRef.current = false;
    }
  }, [step, protocol]);

  // Start pairing when entering step 3
  useEffect(() => {
    if (step === 3 && selectedDevice && !pairing && !paired) {
      setPairing(true);
      import('../utils/iotProtocolGateway.js').then(({ default: gw }) => {
        gw.pairDevice(selectedDevice.tempId, { name: deviceName, room: deviceRoom }).then(device => {
          setPairing(false);
          setPaired(true);
          setSelectedDevice(device);
        }).catch(() => {
          setPairing(false);
        });
      });
    }
  }, [step]);

  const handleSelectDevice = (dev) => {
    setSelectedDevice(dev);
    setDeviceName(`${dev.brand} ${dev.type}`);
    setStep(3);
  };

  const handleNext = () => {
    if (step === 3 && paired) {
      setStep(4);
    } else if (step < STEPS.length - 1 && step !== 2 && step !== 3) {
      setStep(s => s + 1);
    }
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleFinish = async () => {
    const finalDevice = {
      ...selectedDevice,
      name: deviceName || selectedDevice?.name,
      room: deviceRoom || 'Unassigned',
    };

    // Persist to Supabase
    try {
      const { saveSmartDevice } = await import('../utils/database.js');
      const saved = await saveSmartDevice({
        name: finalDevice.name,
        protocol: finalDevice.protocol,
        deviceType: finalDevice.deviceType || finalDevice.type,
        brand: finalDevice.brand,
        model: finalDevice.model,
        status: 'PAIRED',
        ieeeAddress: finalDevice.ieeeAddress,
        matterId: finalDevice.matterId,
        bleMac: finalDevice.bleMac,
        room: finalDevice.room,
        mqttTopic: finalDevice.mqttTopic,
        lastSeen: finalDevice.lastSeen,
        telemetry: finalDevice.telemetry || {},
        config: { capabilities: finalDevice.capabilities, icon: finalDevice.icon, category: finalDevice.category, signalStrength: finalDevice.signalStrength }
      });
      onPaired?.(saved || finalDevice);
    } catch (e) {
      onPaired?.(finalDevice);
    }
    onClose();
  };

  const canGoNext = () => {
    if (step === 0) return !!protocol;
    if (step === 3) return paired;
    if (step === 4) return !!deviceName;
    return true;
  };

  const meta = PROTOCOL_META[protocol];

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: '20px' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', boxShadow: '0 25px 60px rgba(0,0,0,0.25)' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>Tambah Perangkat IoT</h2>
            <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
              Langkah {step + 1} dari {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f1f5f9', borderRadius: '8px', padding: '6px', cursor: 'pointer', display: 'flex' }}>
            <X size={18} color="#64748b" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: '3px', backgroundColor: '#f1f5f9' }}>
          <div style={{ height: '100%', width: `${((step + 1) / STEPS.length) * 100}%`, backgroundColor: meta?.color || '#3b82f6', transition: 'width 0.3s ease' }} />
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', padding: '14px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: '4px',
              backgroundColor: i <= step ? (meta?.color || '#3b82f6') : '#e2e8f0',
              transition: 'all 0.3s'
            }} />
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '0 24px 20px', minHeight: '280px' }}>
          {step === 0 && <StepProtocol selected={protocol} onSelect={setProtocol} />}
          {step === 1 && <StepInstructions protocol={protocol} />}
          {step === 2 && <StepScanning protocol={protocol} discoveredDevices={discoveredDevices} onDeviceFound={handleSelectDevice} />}
          {step === 3 && <StepPairing device={selectedDevice} pairing={pairing} paired={paired} />}
          {step === 4 && <StepDetails device={selectedDevice} name={deviceName} setName={setDeviceName} room={deviceRoom} setRoom={setDeviceRoom} />}
        </div>

        {/* Footer buttons */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={handleBack}
            disabled={step === 0}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: step === 0 ? '#cbd5e1' : '#374151', fontSize: '0.85rem', fontWeight: 700, cursor: step === 0 ? 'default' : 'pointer' }}
          >
            <ChevronLeft size={16} /> Kembali
          </button>

          {step === 4 ? (
            <button
              onClick={handleFinish}
              disabled={!deviceName}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: deviceName ? 'pointer' : 'default', opacity: deviceName ? 1 : 0.5 }}
            >
              <CheckCircle2 size={16} /> Selesai & Simpan
            </button>
          ) : step === 2 ? (
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Pilih perangkat dari hasil scan
            </div>
          ) : step === 3 && !paired ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748b' }}>
              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Pairing...
            </div>
          ) : (
            <button
              onClick={step === 3 && paired ? () => setStep(4) : handleNext}
              disabled={!canGoNext()}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 22px', borderRadius: '8px', backgroundColor: canGoNext() ? (meta?.color || '#3b82f6') : '#e2e8f0', color: canGoNext() ? 'white' : '#94a3b8', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: canGoNext() ? 'pointer' : 'default', transition: 'all 0.2s' }}
            >
              {step === 3 && paired ? 'Atur Detail' : 'Lanjut'} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
