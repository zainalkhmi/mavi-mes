/**
 * iotProtocolGateway.js
 * =====================================================
 * Mavi IoT Protocol Gateway Engine
 * Supports: Zigbee (via Zigbee2MQTT), Matter, BLE Mesh
 *
 * Architecture:
 *   Browser (Mavi) <--MQTT/WebSocket--> MQTT Broker <---> Hardware Gateway
 *                                                         (Zigbee2MQTT / Matter Bridge / BLE GW)
 *
 * In simulation mode (no hardware), realistic device discovery and
 * telemetry are generated locally for development and demo purposes.
 * =====================================================
 */

import mqtt from 'mqtt';

// ─────────────────────────────────────────────────────
// DEVICE PROFILE LIBRARY — 100+ device definitions
// ─────────────────────────────────────────────────────
export const DEVICE_PROFILES = {
  // ── ZIGBEE ──────────────────────────────────────────
  ZIGBEE: [
    { model: 'TRADFRI E27 806lm', brand: 'IKEA', type: 'BULB',    icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp'] },
    { model: 'GU10 345lm',        brand: 'IKEA', type: 'BULB',    icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness'] },
    { model: 'Hue White A19',     brand: 'Philips', type: 'BULB', icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp','color_xy'] },
    { model: 'Hue Color E27',     brand: 'Philips', type: 'BULB', icon: '🌈', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp','color_xy'] },
    { model: 'TS0001',            brand: 'Tuya',    type: 'SWITCH',icon: '🔌', category: 'Power',    capabilities: ['on_off'] },
    { model: 'TS0002',            brand: 'Tuya',    type: 'SWITCH',icon: '🔌', category: 'Power',    capabilities: ['on_off','channel_2'] },
    { model: 'TS011F',            brand: 'Tuya',    type: 'PLUG',  icon: '🔌', category: 'Power',    capabilities: ['on_off','power_metering'] },
    { model: 'BASICZBR3',         brand: 'Sonoff',  type: 'RELAY', icon: '⚡', category: 'Power',    capabilities: ['on_off'] },
    { model: 'SNZB-02',           brand: 'Sonoff',  type: 'SENSOR',icon: '🌡️', category: 'Sensor',  capabilities: ['temperature','humidity'] },
    { model: 'SNZB-03',           brand: 'Sonoff',  type: 'MOTION',icon: '👁️', category: 'Sensor',  capabilities: ['occupancy'] },
    { model: 'SNZB-04',           brand: 'Sonoff',  type: 'CONTACT',icon:'🚪', category: 'Sensor',  capabilities: ['contact'] },
    { model: 'MCCGQ11LM',         brand: 'Aqara',   type: 'CONTACT',icon:'🚪', category: 'Sensor',  capabilities: ['contact','battery'] },
    { model: 'RTCGQ11LM',         brand: 'Aqara',   type: 'MOTION',icon: '👁️', category: 'Sensor',  capabilities: ['occupancy','illuminance'] },
    { model: 'WSDCGQ11LM',        brand: 'Aqara',   type: 'SENSOR',icon: '🌡️', category: 'Sensor',  capabilities: ['temperature','humidity','pressure'] },
    { model: 'LLKZMK11LM',        brand: 'Aqara',   type: 'RELAY', icon: '⚡', category: 'Power',    capabilities: ['on_off','power_metering'] },
    { model: 'DL15I-1BZ',         brand: 'Innr',    type: 'BULB',  icon: '💡', category: 'Lighting', capabilities: ['on_off','brightness','color_temp'] },
    { model: 'BY 285 C',          brand: 'Innr',    type: 'BULB',  icon: '🌈', category: 'Lighting', capabilities: ['on_off','brightness','color_temp','color_xy'] },
    { model: 'TS0601_thermostat', brand: 'Tuya',    type: 'THERMOSTAT',icon:'🌡️', category: 'Climate', capabilities: ['temperature','target_temp','mode'] },
    { model: 'E2201',             brand: 'IKEA',    type: 'CURTAIN',icon: '🪟', category: 'Cover',   capabilities: ['position','tilt'] },
    { model: 'ZigBee Lock v2',    brand: 'Yale',    type: 'LOCK',  icon: '🔒', category: 'Security', capabilities: ['lock','battery','pin_code'] },
  ],

  // ── MATTER ──────────────────────────────────────────
  MATTER: [
    { model: 'Matter Bulb Gen3',  brand: 'Nanoleaf', type: 'BULB',   icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp','color_xy'] },
    { model: 'Hue Bridge v3',     brand: 'Philips',  type: 'BRIDGE', icon: '🌐', category: 'Gateway',   capabilities: ['bridge'] },
    { model: 'Eve Energy',        brand: 'Eve',      type: 'PLUG',   icon: '🔌', category: 'Power',     capabilities: ['on_off','power_metering','voltage'] },
    { model: 'Eve Door',          brand: 'Eve',      type: 'CONTACT',icon: '🚪', category: 'Sensor',    capabilities: ['contact','battery'] },
    { model: 'Eve Motion',        brand: 'Eve',      type: 'MOTION', icon: '👁️', category: 'Sensor',    capabilities: ['occupancy','illuminance','battery'] },
    { model: 'Matter Lock',       brand: 'Schlage',  type: 'LOCK',   icon: '🔒', category: 'Security',  capabilities: ['lock','battery','pin_code'] },
    { model: 'Matter Thermostat', brand: 'ecobee',   type: 'THERMOSTAT',icon:'🌡️', category: 'Climate', capabilities: ['temperature','target_temp','humidity','mode'] },
    { model: 'M5Stack Matter',    brand: 'M5Stack',  type: 'SENSOR', icon: '🌡️', category: 'Sensor',    capabilities: ['temperature','humidity','co2'] },
    { model: 'Meross Plug',       brand: 'Meross',   type: 'PLUG',   icon: '🔌', category: 'Power',     capabilities: ['on_off','power_metering'] },
    { model: 'SwitchBot Hub2',    brand: 'SwitchBot',type: 'BRIDGE', icon: '🌐', category: 'Gateway',   capabilities: ['bridge','ir_remote'] },
    { model: 'TP-Link Tapo P125M',brand: 'TP-Link',  type: 'PLUG',   icon: '🔌', category: 'Power',     capabilities: ['on_off','power_metering'] },
    { model: 'Nest Thermostat',   brand: 'Google',   type: 'THERMOSTAT',icon:'🌡️', category: 'Climate', capabilities: ['temperature','target_temp','mode','fan_mode'] },
    { model: 'Arlo Essential',    brand: 'Arlo',     type: 'CAMERA', icon: '📷', category: 'Security',  capabilities: ['motion','snapshot','stream'] },
    { model: 'Yale Assure Lock 2',brand: 'Yale',     type: 'LOCK',   icon: '🔒', category: 'Security',  capabilities: ['lock','battery','pin_code','autolock'] },
    { model: 'Tuya Matter Switch',brand: 'Tuya',     type: 'SWITCH', icon: '🔌', category: 'Power',     capabilities: ['on_off'] },
  ],

  // ── BLE (Bluetooth Low Energy Mesh) ─────────────────
  BLE: [
    { model: 'BARDI Smart Bulb',  brand: 'BARDI',    type: 'BULB',   icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp','color_xy'] },
    { model: 'Mi Desk Lamp Pro',  brand: 'Xiaomi',   type: 'BULB',   icon: '💡', category: 'Lighting',  capabilities: ['on_off','brightness','color_temp'] },
    { model: 'GOVEE H6052',       brand: 'Govee',    type: 'STRIP',  icon: '🌈', category: 'Lighting',  capabilities: ['on_off','brightness','color_xy','music_sync'] },
    { model: 'Mi Body Comp Scale2',brand:'Xiaomi',   type: 'SCALE',  icon: '⚖️', category: 'Health',    capabilities: ['weight','bmi','body_fat'] },
    { model: 'BARDI Smart Plug',  brand: 'BARDI',    type: 'PLUG',   icon: '🔌', category: 'Power',     capabilities: ['on_off','power_metering'] },
    { model: 'Govee Thermo H5075',brand: 'Govee',    type: 'SENSOR', icon: '🌡️', category: 'Sensor',    capabilities: ['temperature','humidity'] },
    { model: 'SwitchBot Bot',     brand: 'SwitchBot',type: 'BUTTON', icon: '🔘', category: 'Control',   capabilities: ['press','battery'] },
    { model: 'SwitchBot Curtain', brand: 'SwitchBot',type: 'CURTAIN',icon: '🪟', category: 'Cover',     capabilities: ['position','battery','light_level'] },
    { model: 'Mi Flora Plant',    brand: 'Xiaomi',   type: 'SENSOR', icon: '🌱', category: 'Sensor',    capabilities: ['soil_moisture','temperature','illuminance','conductivity'] },
    { model: 'Amazfit Band 7',    brand: 'Amazfit',  type: 'WEARABLE',icon:'⌚', category: 'Health',    capabilities: ['heart_rate','steps','sleep'] },
    { model: 'Ruuvi Tag',         brand: 'Ruuvi',    type: 'SENSOR', icon: '🌡️', category: 'Sensor',    capabilities: ['temperature','humidity','pressure','acceleration'] },
    { model: 'BARDI Door Sensor', brand: 'BARDI',    type: 'CONTACT',icon: '🚪', category: 'Sensor',    capabilities: ['contact','battery'] },
    { model: 'BTHome v2',         brand: 'Generic',  type: 'SENSOR', icon: '📡', category: 'Sensor',    capabilities: ['temperature','humidity','battery'] },
  ]
};

// ─────────────────────────────────────────────────────
// HELPERS — generate realistic device addresses
// ─────────────────────────────────────────────────────
function randomHex(bytes) {
  return Array.from({ length: bytes }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
}
function generateIeeeAddress() {
  return `0x${randomHex(8)}`;
}
function generateMatterId() {
  return Array.from({ length: 4 }, () => randomHex(4)).join('-').toUpperCase();
}
function generateBleMac() {
  return Array.from({ length: 6 }, () => randomHex(1)).join(':').toUpperCase();
}
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function generateTelemetry(capabilities) {
  const t = {};
  if (capabilities.includes('on_off'))       t.on = Math.random() > 0.3;
  if (capabilities.includes('brightness'))   t.brightness = Math.round(20 + Math.random() * 80);
  if (capabilities.includes('color_temp'))   t.colorTemp = Math.round(2700 + Math.random() * 3800);
  if (capabilities.includes('temperature'))  t.temperature = +(18 + Math.random() * 12).toFixed(1);
  if (capabilities.includes('humidity'))     t.humidity = Math.round(40 + Math.random() * 40);
  if (capabilities.includes('occupancy'))    t.occupancy = Math.random() > 0.7;
  if (capabilities.includes('contact'))      t.contact = Math.random() > 0.2;
  if (capabilities.includes('lock'))         t.locked = Math.random() > 0.3;
  if (capabilities.includes('power_metering')) { t.power = +(Math.random() * 2000).toFixed(1); t.voltage = +(220 + Math.random() * 10).toFixed(1); }
  if (capabilities.includes('battery'))      t.battery = Math.round(20 + Math.random() * 80);
  if (capabilities.includes('position'))     t.position = Math.round(Math.random() * 100);
  if (capabilities.includes('target_temp'))  t.targetTemp = Math.round(20 + Math.random() * 8);
  if (capabilities.includes('co2'))          t.co2 = Math.round(400 + Math.random() * 800);
  return t;
}

// ─────────────────────────────────────────────────────
// MAIN CLASS
// ─────────────────────────────────────────────────────
class IoTProtocolGateway {
  constructor() {
    // Protocol states
    this.protocols = {
      ZIGBEE: { status: 'IDLE', gateway: null, mqttPrefix: 'zigbee2mqtt' },
      MATTER: { status: 'IDLE', gateway: null, mqttPrefix: 'matter' },
      BLE:    { status: 'IDLE', gateway: null, mqttPrefix: 'ble_mesh' },
    };

    // Discovered (not yet paired) devices
    this.discoveredDevices = new Map(); // tempId -> device

    // Paired devices (persisted via Supabase / local cache)
    this.pairedDevices = new Map(); // id -> device

    // MQTT client for gateway bridge
    this.mqttClient = null;
    this.mqttConnected = false;

    // Listeners
    this.statusListeners   = new Set();
    this.discoveryListeners= new Set();
    this.telemetryListeners= new Set();
    this.deviceListeners   = new Set();

    // Telemetry simulation interval
    this._telemetryInterval = null;
    this._startTelemetrySimulation();
  }

  // ── PROTOCOL STATUS ──────────────────────────────────
  getProtocolStatus(protocol) {
    return this.protocols[protocol] || null;
  }

  getAllProtocolStatuses() {
    return { ...this.protocols };
  }

  _setProtocolStatus(protocol, status, extra = {}) {
    if (!this.protocols[protocol]) return;
    this.protocols[protocol] = { ...this.protocols[protocol], status, ...extra };
    this._emit(this.statusListeners, { protocol, status, ...extra });
  }

  // ── MQTT BRIDGE ──────────────────────────────────────
  connectMqttGateway(brokerUrl, options = {}) {
    if (this.mqttClient) {
      try { this.mqttClient.end(true); } catch(e) {}
    }

    // Upgrade ws -> wss for mixed-content protection
    if (brokerUrl.startsWith('ws://')) {
      brokerUrl = brokerUrl.replace('ws://', 'wss://');
    }

    try {
      this.mqttClient = mqtt.connect(brokerUrl, {
        clientId: `mavi_iot_gw_${Date.now()}`,
        ...options
      });

      this.mqttClient.on('connect', () => {
        this.mqttConnected = true;
        console.log('[IoTGW] MQTT Bridge connected:', brokerUrl);

        // Subscribe to all protocol topics
        const topics = [
          'zigbee2mqtt/+',
          'zigbee2mqtt/bridge/devices',
          'matter/#',
          'ble_mesh/#',
        ];
        topics.forEach(t => this.mqttClient.subscribe(t, () => {}));
        this._emit(this.statusListeners, { event: 'MQTT_CONNECTED', brokerUrl });
      });

      this.mqttClient.on('message', (topic, message) => {
        this._handleMqttMessage(topic, message.toString());
      });

      this.mqttClient.on('error', (err) => {
        this.mqttConnected = false;
        console.warn('[IoTGW] MQTT error:', err.message);
        this._emit(this.statusListeners, { event: 'MQTT_ERROR', error: err.message });
      });

      this.mqttClient.on('close', () => {
        this.mqttConnected = false;
        this._emit(this.statusListeners, { event: 'MQTT_DISCONNECTED' });
      });
    } catch (err) {
      console.warn('[IoTGW] Could not connect to MQTT gateway:', err.message);
    }
  }

  disconnectMqttGateway() {
    if (this.mqttClient) {
      this.mqttClient.end(true);
      this.mqttClient = null;
      this.mqttConnected = false;
    }
  }

  _handleMqttMessage(topic, payload) {
    try {
      const data = JSON.parse(payload);

      // Zigbee2MQTT bridge device list
      if (topic === 'zigbee2mqtt/bridge/devices') {
        if (Array.isArray(data)) {
          data.forEach(dev => {
            const profile = DEVICE_PROFILES.ZIGBEE.find(p => p.model === dev.definition?.model) || {
              type: 'UNKNOWN', brand: dev.definition?.vendor || 'Unknown',
              model: dev.definition?.model || 'Unknown', icon: '📡',
              category: 'Unknown', capabilities: []
            };
            const discovered = {
              tempId: dev.ieee_address,
              protocol: 'ZIGBEE',
              ieeeAddress: dev.ieee_address,
              friendly_name: dev.friendly_name,
              ...profile,
              telemetry: {},
              source: 'HARDWARE',
            };
            this.discoveredDevices.set(dev.ieee_address, discovered);
          });
          this._emit(this.discoveryListeners, {
            protocol: 'ZIGBEE',
            devices: Array.from(this.discoveredDevices.values()).filter(d => d.protocol === 'ZIGBEE')
          });
        }
        return;
      }

      // Device telemetry from any protocol
      const parts = topic.split('/');
      if (parts.length >= 2) {
        const deviceId = parts.slice(1).join('/');
        this._emit(this.telemetryListeners, { deviceId, topic, data });

        // Update paired device telemetry if matched
        for (const [id, device] of this.pairedDevices) {
          if (device.mqttTopic === topic || device.friendlyName === deviceId) {
            device.telemetry = { ...device.telemetry, ...data };
            device.lastSeen = new Date().toISOString();
            this._emit(this.deviceListeners, { event: 'TELEMETRY_UPDATE', device });
            break;
          }
        }
      }
    } catch (e) {
      // not JSON — ignore
    }
  }

  publishCommand(device, command) {
    if (!this.mqttClient || !this.mqttConnected) {
      console.warn('[IoTGW] MQTT not connected, command not sent:', command);
      return false;
    }
    const topic = device.mqttPublishTopic || `${device.mqttTopic}/set`;
    this.mqttClient.publish(topic, JSON.stringify(command));
    return true;
  }

  // ── DISCOVERY ────────────────────────────────────────
  /**
   * Start scanning for devices on a given protocol.
   * In simulation mode: generates realistic fake devices after a delay.
   * In hardware mode: sends MQTT permit_join command to gateway.
   * @param {string} protocol — 'ZIGBEE' | 'MATTER' | 'BLE'
   * @param {object} options — { simulationMode: true, duration: 8000 }
   */
  startDiscovery(protocol, options = {}) {
    const { simulationMode = true, duration = 8000, onProgress } = options;

    if (!this.protocols[protocol]) {
      console.warn('[IoTGW] Unknown protocol:', protocol);
      return;
    }

    this._setProtocolStatus(protocol, 'SCANNING');

    // Clear previous discovered devices for this protocol
    for (const [key, dev] of this.discoveredDevices) {
      if (dev.protocol === protocol) this.discoveredDevices.delete(key);
    }

    if (!simulationMode && this.mqttConnected) {
      // ── HARDWARE MODE: send permit_join to Zigbee2MQTT
      if (protocol === 'ZIGBEE') {
        this.mqttClient.publish('zigbee2mqtt/bridge/request/permit_join', JSON.stringify({ value: true, time: 254 }));
      } else if (protocol === 'MATTER') {
        this.mqttClient.publish('matter/bridge/discovery/start', JSON.stringify({ duration }));
      } else if (protocol === 'BLE') {
        this.mqttClient.publish('ble_mesh/scan/start', JSON.stringify({ duration }));
      }
    }

    // ── SIMULATION MODE (or fallback)
    const profiles = DEVICE_PROFILES[protocol] || [];
    const count = 2 + Math.floor(Math.random() * 4); // 2-5 devices
    let found = 0;

    const addDevice = () => {
      if (found >= count) {
        this._setProtocolStatus(protocol, 'IDLE');
        this._emit(this.discoveryListeners, {
          protocol,
          event: 'SCAN_COMPLETE',
          devices: Array.from(this.discoveredDevices.values()).filter(d => d.protocol === protocol)
        });
        return;
      }

      const profile = randomFrom(profiles);
      const tempId = `disc_${protocol}_${Date.now()}_${found}`;

      const device = {
        tempId,
        protocol,
        ...profile,
        ieeeAddress:  protocol === 'ZIGBEE' ? generateIeeeAddress() : undefined,
        matterId:     protocol === 'MATTER' ? generateMatterId()    : undefined,
        bleMac:       protocol === 'BLE'    ? generateBleMac()      : undefined,
        signalStrength: -(30 + Math.floor(Math.random() * 50)), // dBm
        rssi:         -(40 + Math.floor(Math.random() * 60)),
        telemetry:    generateTelemetry(profile.capabilities),
        source:       'SIMULATION',
        discoveredAt: new Date().toISOString(),
      };

      this.discoveredDevices.set(tempId, device);
      found++;

      if (onProgress) onProgress({ found, total: count, device });

      this._emit(this.discoveryListeners, {
        protocol,
        event: 'DEVICE_FOUND',
        device,
        devices: Array.from(this.discoveredDevices.values()).filter(d => d.protocol === protocol)
      });

      // Schedule next device appearance
      const delay = (duration / count) * (0.7 + Math.random() * 0.6);
      setTimeout(addDevice, delay);
    };

    // First device appears after 1-2 seconds
    setTimeout(addDevice, 1000 + Math.random() * 1000);

    // Auto-stop after duration
    setTimeout(() => {
      if (this.protocols[protocol]?.status === 'SCANNING') {
        this._setProtocolStatus(protocol, 'IDLE');
        this._emit(this.discoveryListeners, {
          protocol,
          event: 'SCAN_COMPLETE',
          devices: Array.from(this.discoveredDevices.values()).filter(d => d.protocol === protocol)
        });
      }
    }, duration + 500);
  }

  stopDiscovery(protocol) {
    this._setProtocolStatus(protocol, 'IDLE');
    if (this.mqttConnected && protocol === 'ZIGBEE') {
      this.mqttClient.publish('zigbee2mqtt/bridge/request/permit_join', JSON.stringify({ value: false }));
    }
  }

  getDiscoveredDevices(protocol = null) {
    const all = Array.from(this.discoveredDevices.values());
    return protocol ? all.filter(d => d.protocol === protocol) : all;
  }

  // ── PAIRING ──────────────────────────────────────────
  /**
   * Pair a discovered device — goes through the PAIRING state then resolves.
   * @param {string} tempId — the discovered device's tempId
   * @param {object} meta — { name, room }
   * @returns {Promise<object>} paired device object
   */
  pairDevice(tempId, meta = {}) {
    return new Promise((resolve, reject) => {
      const discovered = this.discoveredDevices.get(tempId);
      if (!discovered) {
        reject(new Error('Device not found in discovered list'));
        return;
      }

      this._emit(this.deviceListeners, { event: 'PAIRING_START', tempId });

      // Simulate pairing delay (1.5s - 3s)
      const pairingDuration = 1500 + Math.random() * 1500;

      setTimeout(() => {
        const pairedDevice = {
          id: `paired_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: meta.name || `${discovered.brand} ${discovered.type}`,
          room: meta.room || 'Unassigned',
          protocol: discovered.protocol,
          deviceType: discovered.type,
          brand: discovered.brand,
          model: discovered.model,
          icon: discovered.icon,
          category: discovered.category,
          capabilities: discovered.capabilities,
          // Protocol-specific identifiers
          ieeeAddress:  discovered.ieeeAddress,
          matterId:     discovered.matterId,
          bleMac:       discovered.bleMac,
          // MQTT
          mqttTopic:        this._buildMqttTopic(discovered),
          mqttPublishTopic: this._buildMqttTopic(discovered) + '/set',
          // Status
          status: 'PAIRED',
          online: true,
          lastSeen: new Date().toISOString(),
          pairedAt: new Date().toISOString(),
          // Live data
          telemetry: { ...discovered.telemetry },
          signalStrength: discovered.signalStrength || -55,
        };

        this.pairedDevices.set(pairedDevice.id, pairedDevice);
        this.discoveredDevices.delete(tempId);

        this._emit(this.deviceListeners, { event: 'PAIRING_SUCCESS', device: pairedDevice });
        resolve(pairedDevice);
      }, pairingDuration);
    });
  }

  unpairDevice(deviceId) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return false;
    this.pairedDevices.delete(deviceId);
    this._emit(this.deviceListeners, { event: 'DEVICE_REMOVED', deviceId });
    return true;
  }

  loadPairedDevices(devices) {
    this.pairedDevices.clear();
    devices.forEach(d => this.pairedDevices.set(d.id, d));
  }

  getPairedDevices(protocol = null) {
    const all = Array.from(this.pairedDevices.values());
    return protocol ? all.filter(d => d.protocol === protocol) : all;
  }

  _buildMqttTopic(device) {
    const prefix = this.protocols[device.protocol]?.mqttPrefix || device.protocol.toLowerCase();
    const id = device.ieeeAddress || device.matterId || device.bleMac || device.tempId;
    return `${prefix}/${id}`;
  }

  // ── DEVICE CONTROL ───────────────────────────────────
  sendCommand(deviceId, command) {
    const device = this.pairedDevices.get(deviceId);
    if (!device) return false;

    // Update local telemetry immediately (optimistic)
    device.telemetry = { ...device.telemetry, ...command };
    device.lastSeen = new Date().toISOString();
    this._emit(this.deviceListeners, { event: 'TELEMETRY_UPDATE', device });

    // Send via MQTT if connected
    if (this.mqttConnected) {
      this.publishCommand(device, command);
    }

    return true;
  }

  // ── TELEMETRY SIMULATION ─────────────────────────────
  _startTelemetrySimulation() {
    if (this._telemetryInterval) clearInterval(this._telemetryInterval);
    this._telemetryInterval = setInterval(() => {
      this.pairedDevices.forEach(device => {
        if (!device.online) return;

        const t = device.telemetry || {};
        const caps = device.capabilities || [];

        let updated = false;
        const newT = { ...t };

        // Small random walk for numeric values
        if (caps.includes('temperature') && newT.temperature != null) {
          newT.temperature = +(newT.temperature + (Math.random() - 0.5) * 0.3).toFixed(1);
          updated = true;
        }
        if (caps.includes('humidity') && newT.humidity != null) {
          newT.humidity = Math.max(10, Math.min(95, Math.round(newT.humidity + (Math.random() - 0.5) * 2)));
          updated = true;
        }
        if (caps.includes('power_metering') && newT.power != null) {
          newT.power = Math.max(0, +(newT.power + (Math.random() - 0.5) * 50).toFixed(1));
          updated = true;
        }
        if (caps.includes('occupancy') && Math.random() < 0.03) {
          newT.occupancy = !newT.occupancy;
          updated = true;
        }
        if (caps.includes('battery') && newT.battery != null && Math.random() < 0.01) {
          newT.battery = Math.max(0, newT.battery - 1);
          updated = true;
        }
        if (caps.includes('co2') && newT.co2 != null) {
          newT.co2 = Math.max(400, Math.round(newT.co2 + (Math.random() - 0.4) * 15));
          updated = true;
        }

        if (updated) {
          device.telemetry = newT;
          device.lastSeen = new Date().toISOString();
          this._emit(this.telemetryListeners, { deviceId: device.id, data: newT });
        }
      });
    }, 3000);
  }

  stopTelemetrySimulation() {
    if (this._telemetryInterval) {
      clearInterval(this._telemetryInterval);
      this._telemetryInterval = null;
    }
  }

  // ── GATEWAY MANAGEMENT ───────────────────────────────
  async testGatewayConnection(gatewayConfig) {
    const { mqttBroker, type } = gatewayConfig;
    return new Promise((resolve) => {
      if (!mqttBroker) {
        resolve({ success: false, error: 'No broker URL specified' });
        return;
      }

      let url = mqttBroker;
      if (url.startsWith('ws://')) url = url.replace('ws://', 'wss://');

      try {
        const testClient = mqtt.connect(url, { connectTimeout: 5000 });
        const timer = setTimeout(() => {
          testClient.end(true);
          resolve({ success: false, error: 'Connection timeout (5s)' });
        }, 5000);

        testClient.on('connect', () => {
          clearTimeout(timer);
          testClient.end(true);
          resolve({ success: true, message: `Connected to ${url}` });
        });
        testClient.on('error', (err) => {
          clearTimeout(timer);
          testClient.end(true);
          resolve({ success: false, error: err.message });
        });
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  // ── STATISTICS ───────────────────────────────────────
  getStats() {
    const all = this.getPairedDevices();
    return {
      total: all.length,
      online: all.filter(d => d.online).length,
      offline: all.filter(d => !d.online).length,
      byProtocol: {
        ZIGBEE: all.filter(d => d.protocol === 'ZIGBEE').length,
        MATTER: all.filter(d => d.protocol === 'MATTER').length,
        BLE:    all.filter(d => d.protocol === 'BLE').length,
      },
      byCategory: all.reduce((acc, d) => {
        acc[d.category] = (acc[d.category] || 0) + 1;
        return acc;
      }, {}),
    };
  }

  // ── EVENT BUS ────────────────────────────────────────
  onStatus(cb)    { this.statusListeners.add(cb);    return () => this.statusListeners.delete(cb); }
  onDiscovery(cb) { this.discoveryListeners.add(cb); return () => this.discoveryListeners.delete(cb); }
  onTelemetry(cb) { this.telemetryListeners.add(cb); return () => this.telemetryListeners.delete(cb); }
  onDevice(cb)    { this.deviceListeners.add(cb);    return () => this.deviceListeners.delete(cb); }

  _emit(set, data) {
    set.forEach(fn => { try { fn(data); } catch(e) { console.warn('[IoTGW] listener error:', e); } });
  }
}

// ─────────────────────────────────────────────────────
// Singleton export
// ─────────────────────────────────────────────────────
const iotProtocolGateway = new IoTProtocolGateway();
export default iotProtocolGateway;
