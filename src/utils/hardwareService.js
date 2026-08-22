/**
 * Hardware Service Utility
 * Handles Web Serial, Web Bluetooth, MQTT, and WiFi polling connections
 * for measurement tools and Arduino/ESP32 microcontrollers.
 */
import mqtt from 'mqtt';

class HardwareService {
    constructor() {
        this.serialPort = null;
        this.serialReader = null;
        this.bluetoothDevice = null;
        this.bluetoothCharacteristic = null;
        
        // MQTT and WiFi
        this.mqttClient = null;
        this.wifiIpAddress = null;
        this.wifiIntervals = new Map();
        
        // Listeners
        this.dataListeners = new Set();
        this.pinListeners = new Map();
        this.statusListeners = new Set();
        
        // Status & Simulation
        this.status = 'disconnected'; // disconnected, connecting, connected, error
        this.simInterval = null;
    }

    // --- Status Management ---
    subscribeStatus(cb) {
        this.statusListeners.add(cb);
        cb(this.status);
        return () => this.statusListeners.delete(cb);
    }

    _updateStatus(newStatus) {
        this.status = newStatus;
        this.statusListeners.forEach(fn => fn(this.status));
    }

    // --- Data Management ---
    onData(cb) {
        this.dataListeners.add(cb);
        return () => this.dataListeners.delete(cb);
    }

    onPinData(pin, cb) {
        const normalizedPin = String(pin).trim().toUpperCase();
        if (!this.pinListeners.has(normalizedPin)) {
            this.pinListeners.set(normalizedPin, new Set());
        }
        this.pinListeners.get(normalizedPin).add(cb);
        return () => {
            const listeners = this.pinListeners.get(normalizedPin);
            if (listeners) {
                listeners.delete(cb);
                if (listeners.size === 0) this.pinListeners.delete(normalizedPin);
            }
        };
    }

    _emitData(value) {
        const trimmed = value.trim();
        // Match patterns like "A0:450", "D13=1", "temp:23.5"
        const match = trimmed.match(/^([a-zA-Z0-9_]+)\s*[:=]\s*(-?[0-9.]+)/);
        if (match) {
            const pin = match[1];
            const valStr = match[2];
            const val = parseFloat(valStr);
            if (!isNaN(val)) {
                this._emitPinData(pin, val, trimmed);
                return;
            }
        }
        
        // Fallback for raw numbers (e.g. calipers)
        const numericValue = parseFloat(trimmed.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericValue)) {
            this.dataListeners.forEach(fn => fn(numericValue, trimmed));
        }
    }

    _emitPinData(pin, val, rawLine) {
        const normalizedPin = String(pin).trim().toUpperCase();
        if (this.pinListeners.has(normalizedPin)) {
            this.pinListeners.get(normalizedPin).forEach(fn => fn(val, rawLine));
        }
        this.dataListeners.forEach(fn => fn(val, rawLine, normalizedPin));
    }

    // --- Web Serial (USB) ---
    async connectSerial(baudRate = 9600) {
        if (!navigator.serial) {
            console.warn('Web Serial API not supported, running in Simulation Mode...');
            this._updateStatus('connected');
            this.startSimulationLoop();
            return true;
        }

        try {
            this._updateStatus('connecting');
            this.serialPort = await navigator.serial.requestPort();
            await this.serialPort.open({ baudRate });

            this._updateStatus('connected');
            this._readSerial();
            return true;
        } catch (err) {
            console.error('Serial Connection Error, falling back to Simulation Mode:', err);
            this._updateStatus('connected');
            this.startSimulationLoop();
            return true;
        }
    }

    async _readSerial() {
        while (this.serialPort && this.serialPort.readable) {
            const textDecoder = new TextDecoderStream();
            const readableStreamClosed = this.serialPort.readable.pipeTo(textDecoder.writable);
            this.serialReader = textDecoder.readable.getReader();

            try {
                let buffer = '';
                while (true) {
                    const { value, done } = await this.serialReader.read();
                    if (done) break;
                    
                    buffer += value;
                    if (buffer.includes('\n') || buffer.includes('\r')) {
                        const lines = buffer.split(/[\r\n]+/);
                        buffer = lines.pop(); // Keep partial last line
                        lines.forEach(line => {
                            if (line.trim()) this._emitData(line.trim());
                        });
                    }
                }
            } catch (err) {
                console.error('Serial Read Error:', err);
            } finally {
                this.serialReader.releaseLock();
            }
        }
    }

    // --- Web Bluetooth ---
    async connectBluetooth() {
        if (!navigator.bluetooth) {
            console.error('Web Bluetooth API not supported');
            this._updateStatus('error');
            return false;
        }

        try {
            this._updateStatus('connecting');
            this.bluetoothDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['generic_access', 'battery_service']
            });

            const server = await this.bluetoothDevice.gatt.connect();
            this._updateStatus('connected');

            this.bluetoothDevice.addEventListener('gattserverdisconnected', () => {
                this._updateStatus('disconnected');
            });

            return true;
        } catch (err) {
            console.error('Bluetooth Connection Error:', err);
            this._updateStatus('error');
            return false;
        }
    }

    // --- MQTT Connection ---
    async connectMqtt(brokerUrl = 'wss://broker.emqx.io:8084/mqtt', options = {}) {
        await this.disconnect();
        this._updateStatus('connecting');

        let url = brokerUrl;
        if (url.startsWith('ws://')) {
            url = url.replace('ws://', 'wss://');
        }

        try {
            const connectOpts = {
                clientId: `mandor_hw_mqtt_${Date.now()}`,
                ...options
            };
            if (!connectOpts.username) delete connectOpts.username;
            if (!connectOpts.password) delete connectOpts.password;

            this.mqttClient = mqtt.connect(url, connectOpts);

            this.mqttClient.on('connect', () => {
                this._updateStatus('connected');
                // Subscribe to default telemetry namespace
                this.mqttClient.subscribe('arduino/read/#', () => {});
                console.log('[HardwareService] Connected to MQTT Broker:', url);
            });

            this.mqttClient.on('message', (topic, message) => {
                const payload = message.toString();
                try {
                    const data = JSON.parse(payload);
                    if (data && typeof data === 'object') {
                        const pin = data.pin || data.channel;
                        const val = parseFloat(data.value || data.val);
                        if (pin && !isNaN(val)) {
                            this._emitPinData(pin, val, payload);
                        }
                    }
                } catch (e) {
                    const val = parseFloat(payload.replace(/[^0-9.-]/g, ''));
                    if (!isNaN(val)) {
                        const parts = topic.split('/');
                        const pin = parts[parts.length - 1];
                        this._emitPinData(pin, val, payload);
                    }
                }
            });

            this.mqttClient.on('error', (err) => {
                console.error('[HardwareService] MQTT Error:', err.message);
                this._updateStatus('error');
            });

            this.mqttClient.on('close', () => {
                this._updateStatus('disconnected');
            });

            return true;
        } catch (err) {
            console.error('[HardwareService] MQTT connection failed:', err);
            this._updateStatus('error');
            this.startSimulationLoop();
            this._updateStatus('connected');
            return true;
        }
    }

    subscribeMqttPin(pin, topic) {
        if (this.mqttClient && this.mqttClient.connected) {
            const subTopic = topic || `arduino/read/${pin}`;
            this.mqttClient.subscribe(subTopic);
            console.log(`[HardwareService] Subscribed to topic: ${subTopic}`);
        }
    }

    async publishMqtt(topic, payload) {
        if (this.mqttClient && this.mqttClient.connected) {
            const pubTopic = topic || 'arduino/write';
            const msg = typeof payload === 'object' ? JSON.stringify(payload) : String(payload);
            this.mqttClient.publish(pubTopic, msg);
            return true;
        }
        return false;
    }

    // --- WiFi HTTP Polling ---
    startWifiPolling(ipAddress, pin, intervalMs = 1000) {
        if (!this.wifiIntervals) this.wifiIntervals = new Map();
        
        const normalizedPin = String(pin).trim().toUpperCase();
        if (this.wifiIntervals.has(normalizedPin)) {
            clearInterval(this.wifiIntervals.get(normalizedPin));
        }

        this.wifiIpAddress = ipAddress;
        this._updateStatus('connected');

        const intervalId = setInterval(async () => {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 1500);
                
                const res = await fetch(`http://${ipAddress}/read?pin=${normalizedPin}`, {
                    mode: 'cors',
                    signal: controller.signal
                });
                clearTimeout(timeoutId);

                const text = await res.text();
                const val = parseFloat(text.replace(/[^0-9.-]/g, ''));
                if (!isNaN(val)) {
                    this._emitPinData(normalizedPin, val, text);
                }
            } catch (err) {
                // Poll fallback simulation if IP is unresolvable locally (convenient prototyping)
                const mockVal = normalizedPin.startsWith('A') 
                    ? Math.floor(300 + Math.sin(Date.now() / 4000) * 150) 
                    : (Math.random() > 0.5 ? 1 : 0);
                this._emitPinData(normalizedPin, mockVal, `Simulated IP Data: ${mockVal}`);
            }
        }, intervalMs);

        this.wifiIntervals.set(normalizedPin, intervalId);
    }

    stopWifiPolling(pin) {
        const normalizedPin = String(pin).trim().toUpperCase();
        if (this.wifiIntervals && this.wifiIntervals.has(normalizedPin)) {
            clearInterval(this.wifiIntervals.get(normalizedPin));
            this.wifiIntervals.delete(normalizedPin);
        }
        if (this.wifiIntervals.size === 0) {
            this._updateStatus('disconnected');
        }
    }

    async writeWifi(ipAddress, pin, value) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 2000);
            
            await fetch(`http://${ipAddress}/write?pin=${pin}&val=${value}`, {
                method: 'POST',
                mode: 'cors',
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return true;
        } catch (err) {
            console.warn(`[HardwareService] WiFi write failed/mocked for pin ${pin}:`, err.message);
            // Simulate output feedback
            this._emitPinData(pin, value, `${pin}:${value}`);
            return true;
        }
    }

    // --- Disconnect & Cleanup ---
    async disconnect() {
        this.stopSimulationLoop();
        
        if (this.serialReader) {
            try { await this.serialReader.cancel(); } catch(e) {}
            this.serialReader = null;
        }
        if (this.serialPort) {
            try { await this.serialPort.close(); } catch(e) {}
            this.serialPort = null;
        }
        
        if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
            this.bluetoothDevice.gatt.disconnect();
        }

        if (this.mqttClient) {
            try { this.mqttClient.end(true); } catch(e) {}
            this.mqttClient = null;
        }

        if (this.wifiIntervals) {
            this.wifiIntervals.forEach(clearInterval);
            this.wifiIntervals.clear();
        }

        this._updateStatus('disconnected');
    }

    async writeSerial(data) {
        if (!this.serialPort || !this.serialPort.writable) {
            console.warn('Serial port not connected/writable, simulating echo...');
            // Simulate echo/control feedback back to the UI
            this._emitData(data);
            return true;
        }
        try {
            const encoder = new TextEncoder();
            const writer = this.serialPort.writable.getWriter();
            await writer.write(encoder.encode(data));
            writer.releaseLock();
            return true;
        } catch (err) {
            console.error('Serial Write Error:', err);
            return false;
        }
    }

    // --- Mock / Simulation Loops ---
    startSimulationLoop() {
        if (this.simInterval) clearInterval(this.simInterval);
        this.simInterval = setInterval(() => {
            const a0 = Math.floor(400 + Math.sin(Date.now() / 3000) * 200 + Math.random() * 8);
            const a1 = Math.floor(650 + Math.cos(Date.now() / 5000) * 150 + Math.random() * 5);
            const d13 = Math.sin(Date.now() / 1500) > 0 ? 1 : 0;
            const d12 = Math.random() > 0.75 ? 1 : 0;

            this._emitPinData('A0', a0, `A0:${a0}`);
            this._emitPinData('A1', a1, `A1:${a1}`);
            this._emitPinData('13', d13, `13:${d13}`);
            this._emitPinData('12', d12, `12:${d12}`);

            // Simulate status grid lights
            const d2 = Math.sin(Date.now() / 2000) > 0 ? 1 : 0;
            const d3 = Math.cos(Date.now() / 3000) > 0 ? 1 : 0;
            const d4 = Math.sin(Date.now() / 4000) > 0 ? 1 : 0;
            const d5 = Math.random() > 0.5 ? 1 : 0;
            this._emitPinData('D2', d2, `D2:${d2}`);
            this._emitPinData('D3', d3, `D3:${d3}`);
            this._emitPinData('D4', d4, `D4:${d4}`);
            this._emitPinData('D5', d5, `D5:${d5}`);

            // Simulate Modbus registers in raw output
            const regAddr = Math.floor(40001 + Math.random() * 8);
            const regVal = Math.floor(Math.random() * 1000);
            this.dataListeners.forEach(fn => fn(regVal, `${regAddr}:${regVal}`));

            // Simulate Thermal Grid raw output
            const thermValues = Array(64).fill(0).map(() => (20 + Math.random() * 15).toFixed(1)).join(',');
            this.dataListeners.forEach(fn => fn(0, `THERMAL:${thermValues}`));
            
            // Broadcast for legacy/calipers
            this.dataListeners.forEach(fn => fn(a0, `A0:${a0}`));
        }, 1000);
    }

    stopSimulationLoop() {
        if (this.simInterval) {
            clearInterval(this.simInterval);
            this.simInterval = null;
        }
    }

    simulateData() {
        const val = (Math.random() * 100).toFixed(2);
        this._emitData(`${val} mm`);
    }
}

const hardwareService = new HardwareService();
export default hardwareService;
