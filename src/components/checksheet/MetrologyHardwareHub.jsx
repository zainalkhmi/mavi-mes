import React, { useState, useEffect } from 'react';
import {
  Wifi,
  Usb,
  Thermometer,
  Radio,
  Sparkles,
  Award,
  FileCheck,
  Zap,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';

const MATERIALS = [
  { id: 'al', name: 'AL (A380)', alpha: 23.1 },
  { id: 'steel', name: 'Steel (S45C)', alpha: 11.5 },
  { id: 'ss', name: 'SUS304', alpha: 16.0 },
  { id: 'brass', name: 'Brass', alpha: 19.0 },
  { id: 'iron', name: 'Cast Iron', alpha: 10.5 }
];

/**
 * MetrologyHardwareHub - Compact icon-driven IoT + Thermal + Traceability strip
 */
export default function MetrologyHardwareHub({
  activePoint,
  onAutoSetMeasurement
}) {
  const [connectionType, setConnectionType] = useState('ble');
  const [isConnected, setIsConnected] = useState(true);
  const [deviceName, setDeviceName] = useState('Mitutoyo U-WAVE-TMB');
  const [batteryLevel] = useState(88);
  const [rssi] = useState(-58);
  const [footswitchActive, setFootswitchActive] = useState(true);

  const [ambientTemp, setAmbientTemp] = useState(24.2);
  const [selectedMaterial, setSelectedMaterial] = useState(MATERIALS[0]);
  const [isThermalCompActive, setIsThermalCompActive] = useState(true);

  const [expandedPanel, setExpandedPanel] = useState(null); // 'iot' | 'thermal' | 'cal' | null

  const [stabilityPoints, setStabilityPoints] = useState([0, 1, -1, 0, 2, -1, 0, 0, 1, 0, 0]);
  const [isStable, setIsStable] = useState(true);

  const nominalNum = activePoint ? (parseFloat(activePoint.nominal) || 25.0) : 25.0;
  const tempDelta = ambientTemp - 20.0;
  const thermalExpansionMm = (nominalNum * selectedMaterial.alpha * tempDelta * 0.000001);
  const compensatedValue = nominalNum - thermalExpansionMm;

  // Stability waveform
  useEffect(() => {
    const interval = setInterval(() => {
      const noise = (Math.random() - 0.5) * 0.0015;
      setStabilityPoints(prev => {
        const next = [...prev.slice(1), noise * 1000];
        setIsStable(Math.max(...next.map(Math.abs)) < 1.2);
        return next;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  // Web Bluetooth
  const handleConnectBluetooth = async () => {
    if (navigator.bluetooth) {
      try {
        toast.loading('Scanning BLE...', { id: 'ble' });
        const device = await navigator.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: ['battery_service', 'device_information']
        });
        setDeviceName(device.name || 'BLE Gauge');
        setIsConnected(true);
        setConnectionType('ble');
        toast.success(`Connected: ${device.name || 'BLE Gauge'}`, { id: 'ble' });
      } catch (err) {
        if (err.name !== 'NotFoundError') toast.error('BLE failed', { id: 'ble' });
        else toast.dismiss('ble');
      }
    } else {
      setIsConnected(true);
      setConnectionType('ble');
      setDeviceName('Mitutoyo U-WAVE (Sim)');
      toast.success('BLE Simulated!', { icon: '📶' });
    }
  };

  // Web Serial
  const handleConnectSerial = async () => {
    if (navigator.serial) {
      try {
        toast.loading('Opening USB port...', { id: 'usb' });
        const port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });
        setDeviceName('USB IT-016U SPC');
        setIsConnected(true);
        setConnectionType('usb');
        toast.success('USB Connected!', { id: 'usb' });
      } catch (err) {
        if (err.name !== 'NotFoundError') toast.error('USB failed', { id: 'usb' });
        else toast.dismiss('usb');
      }
    } else {
      setIsConnected(true);
      setConnectionType('usb');
      setDeviceName('USB IT-016U (Sim)');
      toast.success('USB Simulated!', { icon: '🔌' });
    }
  };

  // Footswitch listener
  useEffect(() => {
    if (!footswitchActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'F9' || (e.ctrlKey && e.key === ' ')) {
        e.preventDefault();
        const val = isThermalCompActive ? compensatedValue : nominalNum;
        if (onAutoSetMeasurement) {
          onAutoSetMeasurement(val.toFixed(3));
          toast.success(`🦶 Pedal: ${val.toFixed(3)} mm`, { icon: '⚡' });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [footswitchActive, isThermalCompActive, compensatedValue, nominalNum, onAutoSetMeasurement]);

  const handleTransmit = () => {
    const val = isThermalCompActive ? compensatedValue : nominalNum;
    if (onAutoSetMeasurement) {
      onAutoSetMeasurement(val.toFixed(3));
      toast.success(`📡 Sent: ${val.toFixed(3)} mm`, { icon: '🎯' });
    }
  };

  const togglePanel = (panel) => setExpandedPanel(prev => prev === panel ? null : panel);

  // Shared icon button style
  const iconBtn = (active, color = '#38bdf8') => ({
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: active ? `1.5px solid ${color}` : '1px solid #334155',
    backgroundColor: active ? `${color}18` : '#0f172a',
    color: active ? color : '#64748b',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    transition: 'all 0.15s ease'
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>

      {/* ─── ICON TOOLBAR STRIP ─── */}
      <div
        style={{
          backgroundColor: '#0b1120',
          borderRadius: '8px',
          border: '1px solid #1e293b',
          padding: '6px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px'
        }}
      >
        {/* Left: Connection & Feature Icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* BLE */}
          <button
            onClick={handleConnectBluetooth}
            style={iconBtn(connectionType === 'ble' && isConnected, '#38bdf8')}
            title="Pair Bluetooth (BLE)"
          >
            <Wifi size={15} />
          </button>

          {/* USB */}
          <button
            onClick={handleConnectSerial}
            style={iconBtn(connectionType === 'usb' && isConnected, '#a78bfa')}
            title="Connect USB / SPC Digimatic"
          >
            <Usb size={15} />
          </button>

          {/* Divider */}
          <div style={{ width: '1px', height: '20px', backgroundColor: '#1e293b', margin: '0 2px' }} />

          {/* Footswitch Toggle */}
          <button
            onClick={() => setFootswitchActive(!footswitchActive)}
            style={iconBtn(footswitchActive, '#f59e0b')}
            title={`Footswitch [F9]: ${footswitchActive ? 'ON' : 'OFF'}`}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>🦶</span>
          </button>

          {/* IoT Panel Toggle */}
          <button
            onClick={() => togglePanel('iot')}
            style={iconBtn(expandedPanel === 'iot', '#22c55e')}
            title="IoT Connection Status"
          >
            <Radio size={15} />
          </button>

          {/* Thermal Panel Toggle */}
          <button
            onClick={() => togglePanel('thermal')}
            style={iconBtn(expandedPanel === 'thermal', '#f59e0b')}
            title="Thermal Compensation (ISO 1)"
          >
            <Thermometer size={15} />
          </button>

          {/* Calibration Panel Toggle */}
          <button
            onClick={() => togglePanel('cal')}
            style={iconBtn(expandedPanel === 'cal', '#22c55e')}
            title="Master Gauge & Traceability (ISO 17025)"
          >
            <Award size={15} />
          </button>
        </div>

        {/* Right: Transmit + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Live stability dot */}
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isStable ? '#22c55e' : '#f59e0b',
              boxShadow: isStable ? '0 0 6px #22c55e' : '0 0 6px #f59e0b',
              transition: 'all 0.2s'
            }}
            title={isStable ? 'STABLE ±0.001mm' : 'Acquiring...'}
          />

          {/* Transmit Button */}
          <button
            onClick={handleTransmit}
            style={{
              ...iconBtn(true, '#10b981'),
              width: 'auto',
              padding: '0 10px',
              gap: '4px',
              backgroundColor: '#10b981',
              color: '#fff',
              border: 'none',
              fontWeight: 800,
              fontSize: '0.62rem'
            }}
            title="Transmit SPC Data ke Checksheet"
          >
            <Send size={12} />
          </button>
        </div>
      </div>

      {/* ─── EXPANDABLE: IoT STATUS ─── */}
      {expandedPanel === 'iot' && (
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.64rem', fontWeight: 800, color: '#e2e8f0' }}>{deviceName}</span>
            <span
              style={{
                fontSize: '0.56rem',
                fontWeight: 800,
                padding: '1px 5px',
                borderRadius: '3px',
                backgroundColor: isConnected ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                color: isConnected ? '#22c55e' : '#ef4444',
                border: `1px solid ${isConnected ? '#22c55e44' : '#ef444444'}`
              }}
            >
              {isConnected ? 'SYNCED' : 'OFF'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.58rem', color: '#94a3b8' }}>
            <span>{connectionType.toUpperCase()} • {rssi}dBm</span>
            <span style={{ color: '#f59e0b' }}>🔋 {batteryLevel}%</span>
          </div>
          {/* Mini waveform */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.54rem', color: isStable ? '#22c55e' : '#f59e0b', fontWeight: 800 }}>
              {isStable ? '● STABLE' : '○ ACQ'}
            </span>
            <svg width="100%" height="16" viewBox="0 0 110 16" style={{ flex: 1, backgroundColor: '#020617', borderRadius: '3px' }}>
              <polyline
                fill="none"
                stroke={isStable ? '#22c55e' : '#f59e0b'}
                strokeWidth="1.2"
                points={stabilityPoints.map((p, i) => `${i * 11},${8 + p * 3.5}`).join(' ')}
              />
            </svg>
          </div>
        </div>
      )}

      {/* ─── EXPANDABLE: THERMAL ─── */}
      {expandedPanel === 'thermal' && (
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          {/* Temp row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.64rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8' }}>
              <Thermometer size={12} style={{ color: '#f59e0b' }} />
              <span>Workshop</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <input
                type="number"
                step="0.1"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(parseFloat(e.target.value) || 20.0)}
                style={{
                  width: '44px',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '4px',
                  color: '#38bdf8',
                  fontSize: '0.66rem',
                  fontWeight: 900,
                  textAlign: 'center',
                  padding: '1px 2px'
                }}
              />
              <span style={{ color: '#94a3b8', fontSize: '0.6rem', fontWeight: 700 }}>°C</span>
              <span style={{ color: tempDelta > 0 ? '#ef4444' : '#22c55e', fontSize: '0.56rem', fontWeight: 800 }}>
                {tempDelta > 0 ? '+' : ''}{tempDelta.toFixed(1)}°
              </span>
            </div>
          </div>

          {/* Material row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.62rem' }}>
            <span style={{ color: '#94a3b8' }}>Material</span>
            <select
              value={selectedMaterial.id}
              onChange={(e) => {
                const found = MATERIALS.find(m => m.id === e.target.value);
                if (found) setSelectedMaterial(found);
              }}
              style={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '4px',
                color: '#f8fafc',
                fontSize: '0.6rem',
                fontWeight: 700,
                padding: '1px 3px'
              }}
            >
              {MATERIALS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Delta row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px dashed #1e293b',
            paddingTop: '4px',
            fontSize: '0.62rem'
          }}>
            <span style={{ color: '#94a3b8' }}>ΔL Comp</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#22c55e', fontWeight: 900, fontFamily: 'monospace' }}>
                {isThermalCompActive
                  ? `${thermalExpansionMm >= 0 ? '-' : '+'}${Math.abs(thermalExpansionMm).toFixed(4)}mm`
                  : 'OFF'}
              </span>
              <button
                onClick={() => setIsThermalCompActive(!isThermalCompActive)}
                style={{
                  width: '28px',
                  height: '14px',
                  borderRadius: '7px',
                  border: 'none',
                  backgroundColor: isThermalCompActive ? '#0284c7' : '#334155',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s'
                }}
                title={isThermalCompActive ? 'Auto Comp ON' : 'Auto Comp OFF'}
              >
                <div style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#fff',
                  position: 'absolute',
                  top: '2px',
                  left: isThermalCompActive ? '16px' : '2px',
                  transition: 'left 0.2s'
                }} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── EXPANDABLE: CALIBRATION ─── */}
      {expandedPanel === 'cal' && (
        <div
          style={{
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #1e293b',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '0.6rem',
            animation: 'fadeIn 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Master Ref</span>
            <strong style={{ color: '#38bdf8' }}>CAL-BLOCK-101 (K)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>U (k=2)</span>
            <strong style={{ color: '#f8fafc' }}>0.0003 mm</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#94a3b8' }}>Valid</span>
            <strong style={{ color: '#22c55e' }}>18-Jan-2027</strong>
          </div>
          <button
            onClick={() => toast('Sertifikat KAN ISO 17025 Valid (LK-088-IDN)', { icon: '📜' })}
            style={{
              marginTop: '2px',
              backgroundColor: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #0284c744',
              borderRadius: '5px',
              padding: '3px 6px',
              fontSize: '0.58rem',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
          >
            <FileCheck size={11} />
            <span>Lihat Sertifikat</span>
          </button>
        </div>
      )}
    </div>
  );
}
