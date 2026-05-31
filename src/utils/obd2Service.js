/**
 * OBD2 Service — ELM327 Bluetooth BLE & Web Serial Interface
 * Supports real connection to car ECU via ELM327 adapters.
 *
 * Bluetooth UUIDs:
 *   Primary   : FFE0 (service) / FFE1 (characteristic) — most clone adapters
 *   Fallback  : FFF0 (service) / FFF1 (characteristic) — Kiwi / Vlink
 *
 * Usage:
 *   import obd2Service from './obd2Service';
 *   await obd2Service.connectBluetooth();
 *   const result = await obd2Service.queryPID('010C'); // RPM
 *   obd2Service.startLiveStream('compId', '010C', 500, (r) => console.log(r));
 *   await obd2Service.disconnect();
 */

let tauriInvoke = null;
let tauriListen = null;
let tauriUnlisten = null;

async function getTauriApi() {
    if (window.__TAURI_INTERNALS__) {
        if (!tauriInvoke) {
            try {
                const core = await import('@tauri-apps/api/core');
                const eventApi = await import('@tauri-apps/api/event');
                tauriInvoke = core.invoke;
                tauriListen = eventApi.listen;
            } catch (e) {
                console.warn('Failed to load Tauri APIs:', e);
            }
        }
        return { invoke: tauriInvoke, listen: tauriListen };
    }
    return { invoke: null, listen: null };
}

// ─── ELM327 BLE UUIDs ────────────────────────────────────────────────────────
const BLE_UUID = {
    FFE0_SVC:  '0000ffe0-0000-1000-8000-00805f9b34fb',
    FFE1_CHAR: '0000ffe1-0000-1000-8000-00805f9b34fb',
    FFF0_SVC:  '0000fff0-0000-1000-8000-00805f9b34fb',
    FFF1_CHAR: '0000fff1-0000-1000-8000-00805f9b34fb',
};

// ─── PID Decoder Table ────────────────────────────────────────────────────────
// Each entry: (bytes: number[]) => { value: number, unit: string, label: string }
export const PID_DECODERS = {
    '0101': (b) => {
        const mil = (b[0] & 0x80) !== 0;
        const dtcCount = b[0] & 0x7F;
        return { value: mil ? 'ON' : 'OFF', unit: '', label: 'MIL / DTC Count', extra: { mil, dtcCount } };
    },
    '0104': (b) => ({ value: +(b[0] * 100 / 255).toFixed(1), unit: '%',   label: 'Engine Load' }),
    '0105': (b) => ({ value: b[0] - 40,                        unit: '°C', label: 'Coolant Temp' }),
    '0106': (b) => ({ value: +((b[0] - 128) * 100 / 128).toFixed(2), unit: '%', label: 'STFT Bank 1' }),
    '0107': (b) => ({ value: +((b[0] - 128) * 100 / 128).toFixed(2), unit: '%', label: 'LTFT Bank 1' }),
    '010A': (b) => ({ value: b[0] * 3,                          unit: 'kPa', label: 'Fuel Pressure' }),
    '010B': (b) => ({ value: b[0],                              unit: 'kPa', label: 'MAP Pressure' }),
    '010C': (b) => ({ value: +((b[0] * 256 + b[1]) / 4).toFixed(0), unit: 'rpm', label: 'Engine RPM' }),
    '010D': (b) => ({ value: b[0],                              unit: 'km/h', label: 'Vehicle Speed' }),
    '010E': (b) => ({ value: +(b[0] / 2 - 64).toFixed(1),      unit: '°',   label: 'Ignition Timing' }),
    '010F': (b) => ({ value: b[0] - 40,                         unit: '°C', label: 'Intake Air Temp' }),
    '0110': (b) => ({ value: +((b[0] * 256 + b[1]) / 100).toFixed(2), unit: 'g/s', label: 'MAF' }),
    '0111': (b) => ({ value: +(b[0] * 100 / 255).toFixed(1),   unit: '%',   label: 'Throttle Position' }),
    '012F': (b) => ({ value: +(b[0] * 100 / 255).toFixed(1),   unit: '%',   label: 'Fuel Level' }),
    '0133': (b) => ({ value: b[0],                              unit: 'kPa', label: 'Barometric Pressure' }),
    '0142': (b) => ({ value: +((b[0] * 256 + b[1]) / 1000).toFixed(2), unit: 'V', label: 'Battery Voltage' }),
    '0144': (b) => ({ value: +((b[0] * 256 + b[1]) * 2 / 65535).toFixed(3), unit: 'λ', label: 'O2 Equiv. Ratio' }),
    '0114': (b) => ({ value: +(b[0] / 200).toFixed(3),         unit: 'V',   label: 'O2 Sensor B1S1' }),
    '015C': (b) => ({ value: b[0] - 40,                         unit: '°C', label: 'Oil Temperature' }),
};

// Derived / calculated PIDs (not standard OBD, computed from real PIDs)
const DERIVED_PIDS = new Set(['BOOST_EST', 'TORQUE_EST', 'HP_EST', 'KNOCK', 'FREEZE_FRAME', 'DTC']);

// ─── Response Parser ──────────────────────────────────────────────────────────
/**
 * Parse a raw ELM327 response string for a given PID.
 * @param {string} raw   Raw response from ELM327 (may contain spaces / newlines)
 * @param {string} pid   e.g. '010C'
 * @returns {{ value, unit, label } | null}
 */
export function parseOBDResponse(raw, pid) {
    if (!raw || DERIVED_PIDS.has(pid)) return null;

    const clean = raw.replace(/[\r\n\s]/g, '').toUpperCase();

    if (
        clean.includes('NODATA') ||
        clean.includes('ERROR') ||
        clean.includes('UNABLETOCONNECT') ||
        clean.includes('BUSBUSY') ||
        clean === ''
    ) return null;

    // OBD mode response byte = mode + 0x40
    const modeHex   = pid.substring(0, 2);
    const pidHex    = pid.substring(2).toUpperCase();
    const respMode  = (parseInt(modeHex, 16) + 0x40).toString(16).toUpperCase().padStart(2, '0');
    const header    = respMode + pidHex;

    const idx = clean.indexOf(header);
    if (idx === -1) return null;

    const dataStr = clean.substring(idx + header.length);
    const bytes   = [];
    for (let i = 0; i + 1 < dataStr.length; i += 2) {
        const byte = parseInt(dataStr.substring(i, i + 2), 16);
        if (isNaN(byte)) break;
        bytes.push(byte);
    }
    if (bytes.length === 0) return null;

    const decoder = PID_DECODERS[pid.toUpperCase()];
    if (decoder) {
        try { return decoder(bytes); } catch { return null; }
    }
    // Unknown PID — return raw first byte
    return { value: bytes[0], unit: '', label: pid };
}

// ─── DTC Parser ───────────────────────────────────────────────────────────────
const DTC_PREFIX_MAP = {
    '0':'P0','1':'P1','2':'P2','3':'P3',
    '4':'C0','5':'C1','6':'C2','7':'C3',
    '8':'B0','9':'B1','A':'B2','B':'B3',
    'C':'U0','D':'U1','E':'U2','F':'U3',
};

function parseDTCResponse(raw) {
    const clean = raw.replace(/[\r\n\s]/g, '').toUpperCase();
    if (clean.includes('NODATA') || !clean.includes('43')) return [];
    const start = clean.indexOf('43');
    const data  = clean.substring(start + 2);
    const dtcs  = [];
    for (let i = 0; i + 3 < data.length; i += 4) {
        const b1 = data.substring(i,     i + 2);
        const b2 = data.substring(i + 2, i + 4);
        if (b1 === '00' && b2 === '00') continue;
        const prefix = DTC_PREFIX_MAP[b1[0]] || 'P0';
        dtcs.push(`${prefix}${b1[1]}${b2}`);
    }
    return dtcs;
}

// ─── OBD2Service Class ────────────────────────────────────────────────────────
class OBD2Service {
    constructor() {
        // Hardware handles
        this._btDevice    = null;
        this._btChar      = null;
        this._serialPort  = null;
        this._serialWrite = null;
        this._serialRead  = null;

        // State
        this.connected   = false;
        this.transport   = null; // 'BLUETOOTH' | 'SERIAL'
        this.status      = 'disconnected'; // disconnected | connecting | connected | error

        // Internal response promise
        this._buf          = '';
        this._pendingTimer = null;
        this._pendingRes   = null;
        this._pendingRej   = null;

        // Simulated Mode variables
        this.simulated = false;
        this._simulatedDTCs = ['P0300', 'P0171', 'P0420'];
        this._connectTime = null;

        // Listeners
        this._statusListeners = new Set();
        this._dataListeners   = new Map(); // pid -> Set<fn>
        this._liveTimers      = new Map(); // compId -> intervalId
    }

    // ── Status Management ──────────────────────────────────────────────────────
    subscribeStatus(cb) {
        this._statusListeners.add(cb);
        cb(this.status);
        return () => this._statusListeners.delete(cb);
    }

    _setStatus(s) {
        this.status = s;
        this._statusListeners.forEach(fn => fn(s));
    }

    // ── Data Listeners ─────────────────────────────────────────────────────────
    /**
     * Subscribe to live data for a specific PID.
     * Use '*' to receive all PID updates.
     * @returns unsubscribe function
     */
    onPIDData(pid, cb) {
        const key = pid.toUpperCase();
        if (!this._dataListeners.has(key)) this._dataListeners.set(key, new Set());
        this._dataListeners.get(key).add(cb);
        return () => this._dataListeners.get(key)?.delete(cb);
    }

    _emitPIDData(pid, result) {
        const key = pid.toUpperCase();
        this._dataListeners.get(key)?.forEach(fn => fn(result));
        this._dataListeners.get('*')?.forEach(fn => fn({ pid, ...result }));
    }

    // ── ELM327 Low-level Protocol ──────────────────────────────────────────────
    _handleChunk(chunk) {
        this._buf += chunk;
        if (this._buf.includes('>')) {
            const response = this._buf.replace(/>/g, '').trim();
            this._buf = '';
            if (this._pendingRes) {
                const res = this._pendingRes;
                this._pendingRes = null;
                clearTimeout(this._pendingTimer);
                res(response);
            }
        }
    }

    _sendRaw(cmd, timeoutMs = 3000) {
        return new Promise((resolve, reject) => {
            if (this._pendingRes) {
                return reject(new Error('Device busy'));
            }

            this._pendingRes = resolve;
            this._pendingRej = reject;
            this._pendingTimer = setTimeout(() => {
                this._pendingRes = null;
                this._pendingRej = null;
                reject(new Error(`OBD2 timeout: ${cmd}`));
            }, timeoutMs);

            const data = new TextEncoder().encode(cmd + '\r');

            if (this.transport === 'BLUETOOTH' && this._btChar) {
                this._btChar.writeValueWithoutResponse(data).catch(err => {
                    clearTimeout(this._pendingTimer);
                    this._pendingRes = null;
                    reject(err);
                });
            } else if (this.transport === 'SERIAL' && this._serialWrite) {
                this._serialWrite.write(data).catch(err => {
                    clearTimeout(this._pendingTimer);
                    this._pendingRes = null;
                    reject(err);
                });
            } else if (this.transport === 'WIFI' && this._wsPort && this._wsPort.readyState === 1) {
                this._wsPort.send(cmd + '\r');
            } else if (this.transport === 'WIFI_TAURI' && tauriInvoke) {
                tauriInvoke('tcp_send', { data: cmd + '\r' }).catch(err => {
                    clearTimeout(this._pendingTimer);
                    this._pendingRes = null;
                    reject(new Error(err));
                });
            } else {
                clearTimeout(this._pendingTimer);
                this._pendingRes = null;
                reject(new Error('Not connected'));
            }
        });
    }


    /**
     * Send AT command to ELM327, returns raw response string.
     */
    async sendAT(cmd, timeoutMs = 3000) {
        return this._sendRaw(cmd, timeoutMs);
    }

    async _initELM327() {
        await this._sendRaw('ATZ',  5000); // Reset
        await new Promise(r => setTimeout(r, 1500));
        await this._sendRaw('ATE0');       // Echo OFF
        await this._sendRaw('ATL0');       // Linefeeds OFF
        await this._sendRaw('ATH0');       // Headers OFF (simplifies parsing)
        await this._sendRaw('ATS0');       // Spaces OFF
        await this._sendRaw('ATSP0');      // Auto-detect OBD protocol
    }

    // ── Bluetooth Connect ──────────────────────────────────────────────────────
    async connectBluetooth() {
        if (!navigator.bluetooth) {
            console.warn('[OBD2] Web Bluetooth not supported. Falling back to Simulation Mode...');
            return this.connectSimulated('BLUETOOTH');
        }
        this._setStatus('connecting');
        try {
            this._btDevice = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'OBD'   },
                    { namePrefix: 'ELM'   },
                    { namePrefix: 'OBDII' },
                    { namePrefix: 'Kiwi'  },
                    { namePrefix: 'Vlink' },
                    { namePrefix: 'VEEPEAK' },
                    { namePrefix: 'iCar'  },
                ],
                optionalServices: [
                    BLE_UUID.FFE0_SVC,
                    BLE_UUID.FFF0_SVC,
                ],
            });

            const server = await this._btDevice.gatt.connect();

            // Try FFE0 first, fallback to FFF0
            let service, char;
            try {
                service = await server.getPrimaryService(BLE_UUID.FFE0_SVC);
                char    = await service.getCharacteristic(BLE_UUID.FFE1_CHAR);
            } catch {
                service = await server.getPrimaryService(BLE_UUID.FFF0_SVC);
                char    = await service.getCharacteristic(BLE_UUID.FFF1_CHAR);
            }

            this._btChar  = char;
            this.transport = 'BLUETOOTH';

            // Subscribe to notifications (incoming data from ELM327)
            await char.startNotifications();
            char.addEventListener('characteristicvaluechanged', (e) => {
                this._handleChunk(new TextDecoder().decode(e.target.value));
            });

            this._btDevice.addEventListener('gattserverdisconnected', () => {
                this.connected = false;
                this._setStatus('disconnected');
            });

            await this._initELM327();
            this.connected = true;
            this.simulated = false;
            this._setStatus('connected');
            return true;
        } catch (err) {
            console.warn('[OBD2] Bluetooth connect failed. Falling back to Simulation Mode:', err.message);
            return this.connectSimulated('BLUETOOTH');
        }
    }

    // ── Serial (USB) Connect ───────────────────────────────────────────────────
    async connectSerial(baudRate = 38400) {
        if (!navigator.serial) {
            console.warn('[OBD2] Web Serial not supported. Falling back to Simulation Mode...');
            return this.connectSimulated('SERIAL');
        }
        this._setStatus('connecting');
        try {
            this._serialPort = await navigator.serial.requestPort({
                filters: [
                    { usbVendorId: 0x0403 }, // FTDI (common ELM327 clone)
                    { usbVendorId: 0x10C4 }, // Silicon Labs CP210x
                    { usbVendorId: 0x1A86 }, // CH340 (cheap clones)
                ],
            });
            await this._serialPort.open({ baudRate });

            // Write stream
            const encStream = new TextEncoderStream();
            encStream.readable.pipeTo(this._serialPort.writable);
            this._serialWrite = encStream.writable.getWriter();

            // Read stream (async loop)
            this.transport = 'SERIAL';
            this._startSerialReadLoop();

            await this._initELM327();
            this.connected = true;
            this.simulated = false;
            this._setStatus('connected');
            return true;
        } catch (err) {
            console.warn('[OBD2] Serial connect failed. Falling back to Simulation Mode:', err.message);
            return this.connectSimulated('SERIAL');
        }
    }

    async connectSimulated(transport = 'BLUETOOTH') {
        this._setStatus('connecting');
        await new Promise(r => setTimeout(r, 800)); // Simulate connection delay
        this.transport = `${transport} (SIMULATOR)`;
        this.connected = true;
        this.simulated = true;
        this._connectTime = Date.now();
        this._simulatedDTCs = ['P0300', 'P0171', 'P0420']; // Reset simulated codes on new connect
        this._setStatus('connected');
        return true;
    }

    async _startSerialReadLoop() {
        while (this._serialPort && this._serialPort.readable) {
            const reader = this._serialPort.readable.getReader();
            this._serialRead = reader;
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    this._handleChunk(new TextDecoder().decode(value));
                }
            } catch { /* port closed */ }
            finally { reader.releaseLock(); }
        }
    }

    // ── WiFi Connect ───────────────────────────────────────────────────────────
    async connectWiFi(ipAddress = '192.168.0.10', port = 35000) {
        this._setStatus('connecting');
        
        // Native TCP via Tauri
        const { invoke, listen } = await getTauriApi();
        if (invoke && listen) {
            try {
                await invoke('tcp_connect', { ip: ipAddress, port });
                
                // Cleanup previous listener if any
                if (tauriUnlisten) {
                    tauriUnlisten();
                    tauriUnlisten = null;
                }

                // Listen for incoming data
                const unlistenData = await listen('tcp-data', (event) => {
                    if (event.payload) {
                        this._handleChunk(event.payload);
                    }
                });
                
                const unlistenDisconnect = await listen('tcp-disconnect', () => {
                    if (this.transport === 'WIFI_TAURI') {
                        this.connected = false;
                        this._setStatus('disconnected');
                    }
                });

                tauriUnlisten = () => {
                    unlistenData();
                    unlistenDisconnect();
                };

                this.transport = 'WIFI_TAURI';
                await this._initELM327();
                this.connected = true;
                this._setStatus('connected');
                return true;
            } catch (err) {
                this._setStatus('error');
                throw new Error(err.message || String(err));
            }
        }
        
        try {
            // Fallback for Web Browser using WebSocket proxy
            const wsUrl = `ws://${ipAddress}:${port}`;
            this._wsPort = new WebSocket(wsUrl);

            await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    if (this._wsPort) this._wsPort.close();
                    reject(new Error('WiFi connection timeout. Ensure proxy is running.'));
                }, 5000);

                this._wsPort.onopen = () => {
                    clearTimeout(timeout);
                    resolve();
                };

                this._wsPort.onerror = (err) => {
                    clearTimeout(timeout);
                    reject(new Error('WiFi connection failed. Ensure target is reachable.'));
                };
            });

            this._wsPort.onmessage = (event) => {
                if (event.data instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        this._handleChunk(reader.result);
                    };
                    reader.readAsText(event.data);
                } else {
                    this._handleChunk(event.data);
                }
            };

            this._wsPort.onclose = () => {
                if (this.transport === 'WIFI') {
                    this.connected = false;
                    this._setStatus('disconnected');
                }
            };

            this.transport = 'WIFI';
            await this._initELM327();
            this.connected = true;
            this._setStatus('connected');
            return true;
        } catch (err) {
            this._setStatus('error');
            throw err;
        }
    }

    async connectWifi(ipAddress = '192.168.0.10', port = 35000) {
        return this.connectWiFi(ipAddress, port);
    }


    // ── Query a single PID ─────────────────────────────────────────────────────
    /**
     * Query a standard OBD2 PID once.
     * @param {string} pid  e.g. '010C'
     * @returns {{ value, unit, label } | null}
     */
    async queryPID(pid) {
        if (!this.connected) throw new Error('OBD2: Not connected');

        const normalizedPid = String(pid || '').toUpperCase();

        // Special handling for derived DTC queries
        if (normalizedPid === 'DTC') {
            try {
                const dtcs = await this.readDTC();
                const result = { value: JSON.stringify(dtcs), unit: '', label: 'Diagnostic Trouble Codes' };
                this._emitPIDData('DTC', { ...result, timestamp: Date.now() });
                return result;
            } catch (err) {
                console.warn(`[OBD2] queryPID(DTC) error:`, err.message);
                return null;
            }
        }

        if (this.simulated) {
            let value = 0;
            let unit = '';
            let label = pid;
            const now = Date.now();

            if (normalizedPid === '010C') { // RPM
                const sec = Math.floor(now / 1000) % 30;
                if (sec > 10 && sec < 15) {
                    value = Math.floor(1800 + Math.random() * 200);
                } else if (sec >= 15 && sec < 18) {
                    value = Math.floor(2500 + Math.random() * 300);
                } else {
                    value = Math.floor(780 + Math.random() * 40);
                }
                unit = 'rpm';
                label = 'Engine RPM';
            } else if (normalizedPid === '010D') { // Speed
                const sec = Math.floor(now / 1000) % 30;
                if (sec > 10 && sec < 20) {
                    value = Math.floor((sec - 10) * 8 + Math.random() * 5);
                } else if (sec >= 20 && sec < 25) {
                    value = Math.floor(Math.max(0, 80 - (sec - 20) * 15));
                } else {
                    value = 0;
                }
                unit = 'km/h';
                label = 'Vehicle Speed';
            } else if (normalizedPid === '0105') { // Coolant Temp
                const elapsed = Math.floor((now - (this._connectTime || now)) / 1000);
                value = Math.min(92, 70 + Math.floor(elapsed / 2));
                if (value === 92) value += Math.floor(Math.random() * 2) - 1;
                unit = '°C';
                label = 'Coolant Temp';
            } else if (normalizedPid === '0104') { // Engine Load
                const sec = Math.floor(now / 1000) % 30;
                if (sec > 10 && sec < 18) {
                    value = +(45 + Math.random() * 10).toFixed(1);
                } else {
                    value = +(15 + Math.random() * 3).toFixed(1);
                }
                unit = '%';
                label = 'Engine Load';
            } else if (normalizedPid === '0111') { // Throttle
                const sec = Math.floor(now / 1000) % 30;
                if (sec > 10 && sec < 18) {
                    value = +(35 + Math.random() * 15).toFixed(1);
                } else {
                    value = +(14.5 + Math.random() * 1).toFixed(1);
                }
                unit = '%';
                label = 'Throttle Position';
            } else if (normalizedPid === '0142') { // Battery Voltage
                value = +(13.8 + Math.random() * 0.3).toFixed(2);
                unit = 'V';
                label = 'Battery Voltage';
            } else if (normalizedPid === '012F') { // Fuel Level
                value = 65;
                unit = '%';
                label = 'Fuel Level';
            } else if (normalizedPid === '0101') { // MIL Status
                value = this._simulatedDTCs.length > 0 ? 'ON' : 'OFF';
                unit = '';
                label = 'MIL / DTC Count';
            } else {
                value = 0;
                unit = '';
            }

            const result = { value, unit, label };
            this._emitPIDData(pid, { ...result, timestamp: now });
            return result;
        }

        if (DERIVED_PIDS.has(normalizedPid)) return null; 

        try {
            const raw = await this._sendRaw(pid, 3500);
            if (pid === '010C') console.log(`[OBD2 DEBUG] PID: ${pid}, Raw: "${raw}"`);
            const result = parseOBDResponse(raw, pid);
            if (result) {
                this._emitPIDData(pid, { ...result, timestamp: Date.now() });
            }
            return result;
        } catch (err) {
            console.warn(`[OBD2] queryPID(${pid}) error:`, err.message);
            return null;
        }
    }


    // ── DTC Methods ────────────────────────────────────────────────────────────
    /**
     * Read Diagnostic Trouble Codes (Mode 03).
     * @returns {string[]} e.g. ['P0300', 'P0420']
     */
    async readDTC() {
        if (!this.connected) throw new Error('OBD2: Not connected');
        if (this.simulated) {
            return this._simulatedDTCs;
        }
        const raw = await this._sendRaw('03', 6000);
        return parseDTCResponse(raw);
    }

    /**
     * Clear DTCs and reset MIL (Mode 04).
     * @returns {boolean} true if acknowledged
     */
    async clearDTC() {
        if (!this.connected) throw new Error('OBD2: Not connected');
        if (this.simulated) {
            await new Promise(r => setTimeout(r, 600)); // Simulate clear delay
            this._simulatedDTCs = [];
            this._emitPIDData('DTC', { value: '[]', unit: '', label: 'Diagnostic Trouble Codes', timestamp: Date.now() });
            this._emitPIDData('0101', { value: 'OFF', unit: '', label: 'MIL / DTC Count', extra: { mil: false, dtcCount: 0 }, timestamp: Date.now() });
            return true;
        }
        const raw = await this._sendRaw('04', 6000);
        const clean = raw.replace(/\s/g, '').toUpperCase();
        return clean.includes('44') || !clean.includes('ERROR');
    }

    // ── Live Streaming ─────────────────────────────────────────────────────────
    /**
     * Start polling a PID at a given interval.
     * @param {string}   compId      Widget component ID (used as timer key)
     * @param {string}   pid         OBD2 PID string e.g. '010C'
     * @param {number}   intervalMs  Poll interval in milliseconds (min 200)
     * @param {Function} callback    Called with { value, unit, label } on each update
     */
    startLiveStream(compId, pid, intervalMs = 1000, callback) {
        this.stopLiveStream(compId);

        const timer = setInterval(async () => {
            if (!this.connected) {
                this.stopLiveStream(compId);
                return;
            }
            try {
                const result = await this.queryPID(pid);
                if (result) {
                    this._emitPIDData(pid, result);
                    callback?.(result);
                }
            } catch (e) {
                console.warn('[OBD2] Live stream error:', e);
            }
        }, Math.max(200, intervalMs));

        this._liveTimers.set(compId, timer);
    }

    /**
     * Stop live polling for a specific component.
     */
    stopLiveStream(compId) {
        if (this._liveTimers.has(compId)) {
            clearInterval(this._liveTimers.get(compId));
            this._liveTimers.delete(compId);
        }
    }

    /**
     * Stop ALL live streams.
     */
    stopAllStreams() {
        this._liveTimers.forEach(timer => clearInterval(timer));
        this._liveTimers.clear();
    }

    // ── Disconnect ─────────────────────────────────────────────────────────────
    async disconnect() {
        this.stopAllStreams();

        if (this._pendingRej) {
            this._pendingRej(new Error('Disconnected'));
            this._pendingRes = null;
            this._pendingRej = null;
        }

        if (this._serialRead) {
            try { await this._serialRead.cancel(); } catch {}
            this._serialRead = null;
        }
        if (this._serialWrite) {
            try { this._serialWrite.releaseLock(); } catch {}
            this._serialWrite = null;
        }
        if (this._serialPort) {
            try { await this._serialPort.close(); } catch {}
            this._serialPort = null;
        }
        if (this._btChar) {
            try { await this._btChar.stopNotifications(); } catch {}
            this._btChar = null;
        }
        if (this._btDevice?.gatt?.connected) {
            try { this._btDevice.gatt.disconnect(); } catch {}
        }
        if (this._wsPort) {
            try { this._wsPort.close(); } catch {}
            this._wsPort = null;
        }
        if (this.transport === 'WIFI_TAURI' && tauriInvoke) {
            try { await tauriInvoke('tcp_disconnect'); } catch {}
            if (tauriUnlisten) {
                tauriUnlisten();
                tauriUnlisten = null;
            }
        }
        this._btDevice  = null;
        this.connected  = false;
        this.transport  = null;
        this._setStatus('disconnected');
    }

    // ── Utility ────────────────────────────────────────────────────────────────
    /**
     * Check if browser supports required APIs.
     * @returns {{ bluetooth: boolean, serial: boolean }}
     */
    static checkSupport() {
        return {
            bluetooth: !!navigator.bluetooth,
            serial:    !!navigator.serial,
        };
    }

    /**
     * Returns the human-readable label for a given PID.
     */
    static getPIDLabel(pid) {
        const decoder = PID_DECODERS[pid?.toUpperCase()];
        if (!decoder) return pid;
        try { return decoder([0, 0]).label; } catch { return pid; }
    }
}

const obd2Service = new OBD2Service();
export default obd2Service;
