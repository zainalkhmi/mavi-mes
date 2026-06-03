/**
 * Hardware Service Utility
 * Handles Web Serial and Web Bluetooth connections for measurement tools.
 */
class HardwareService {
    constructor() {
        this.serialPort = null;
        this.serialReader = null;
        this.bluetoothDevice = null;
        this.bluetoothCharacteristic = null;
        this.dataListeners = new Set();
        this.statusListeners = new Set();
        this.status = 'disconnected'; // disconnected, connecting, connected, error
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

    _emitData(value) {
        // Clean up the value (often contains units or whitespace)
        const numericValue = parseFloat(value.replace(/[^0-9.-]/g, ''));
        if (!isNaN(numericValue)) {
            this.dataListeners.forEach(fn => fn(numericValue, value));
        }
    }

    // --- Web Serial (USB) ---
    async connectSerial(baudRate = 9600) {
        if (!navigator.serial) {
            console.error('Web Serial API not supported');
            this._updateStatus('error');
            return false;
        }

        try {
            this._updateStatus('connecting');
            this.serialPort = await navigator.serial.requestPort();
            await this.serialPort.open({ baudRate });

            this._updateStatus('connected');
            this._readSerial();
            return true;
        } catch (err) {
            console.error('Serial Connection Error:', err);
            this._updateStatus('error');
            return false;
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
                    // Calipers usually send data ending with newline
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
            // We search for devices that might be calipers or measurement tools
            // Note: In a real scenario, we might need specific Service UUIDs
            this.bluetoothDevice = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: ['generic_access', 'battery_service'] // Common services
            });

            const server = await this.bluetoothDevice.gatt.connect();
            this._updateStatus('connected');

            // Listen for disconnection
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

    async disconnect() {
        if (this.serialReader) {
            await this.serialReader.cancel();
            this.serialReader = null;
        }
        if (this.serialPort) {
            await this.serialPort.close();
            this.serialPort = null;
        }
        if (this.bluetoothDevice && this.bluetoothDevice.gatt.connected) {
            this.bluetoothDevice.gatt.disconnect();
        }
        this._updateStatus('disconnected');
    }

    async writeSerial(data) {
        if (!this.serialPort || !this.serialPort.writable) {
            console.warn('Serial port not connected or not writable');
            return false;
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

    // --- Mock for Demo/Development ---
    simulateData() {
        const val = (Math.random() * 100).toFixed(2);
        this._emitData(`${val} mm`);
    }
}

const hardwareService = new HardwareService();
export default hardwareService;
