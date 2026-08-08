import mqtt from 'mqtt';
import automationEngine from './automationEngine';

/**
 * IoT Connector Utility
 * Handles MQTT connections and simulates Industrial Protocols (OPC-UA, Modbus).
 * Optimized with high-frequency telemetry throttling & animation-frame batching.
 */
class IOTConnector {
    constructor() {
        this.client = null;
        this.subscriptions = new Map();
        this.status = 'disconnected';
        this.statusListeners = new Set();
        this.messageListeners = new Set();
        
        // Simulation Data
        this.simulatedValues = new Map();
        this.simInterval = null;

        // Telemetry Throttling & Batching Buffers
        this.latestValues = new Map();
        this.topicMessageCounts = new Map();
        this.lastTopicLogTimes = new Map();
        this.pendingBatchFlush = false;
        this.batchFlushIntervalMs = 50; // 20 FPS UI update ceiling for data streams
        this.lastFlushTime = 0;

        this.startSimulation();
    }

    startSimulation() {
        if (this.simInterval) clearInterval(this.simInterval);
        this.simInterval = setInterval(() => {
            // Simulate changing values for common industrial tags
            const now = Date.now();
            
            // OPC-UA Simulation (NodeIDs)
            this.setSimValue('ns=2;s=SpindleSpeed', 1200 + Math.sin(now / 5000) * 100);
            this.setSimValue('ns=2;s=Temperature', 45 + Math.random() * 5);
            this.setSimValue('ns=2;s=Status', Math.random() > 0.9 ? 'IDLE' : 'RUNNING');
            
            // Modbus Simulation (Registers)
            this.setSimValue('40001', 50 + Math.sin(now / 2000) * 10); // Holding Register
            this.setSimValue('10001', Math.random() > 0.5); // Discrete Input
        }, 2000);
    }

    setSimValue(tag, value) {
        this.simulatedValues.set(tag, value);
        this.handleIncomingMessage(tag, String(value), value, tag.includes('=') ? 'OPC_UA' : 'MODBUS');
    }

    getLiveValue(tag) {
        if (this.simulatedValues.has(tag)) {
            return this.simulatedValues.get(tag);
        }
        if (this.latestValues.has(tag)) {
            return this.latestValues.get(tag).parsedPayload;
        }
        return "N/A";
    }

    handleIncomingMessage(topic, payload, parsedPayload, protocol = 'MQTT') {
        const now = Date.now();
        const msgObj = { topic, payload, parsedPayload, protocol, ts: new Date(now).toISOString() };

        // Save latest state snapshot
        this.latestValues.set(topic, msgObj);

        // Throttle verbose console logging (at most 1 log per topic per second)
        const lastLog = this.lastTopicLogTimes.get(topic) || 0;
        const count = (this.topicMessageCounts.get(topic) || 0) + 1;
        this.topicMessageCounts.set(topic, count);

        if (now - lastLog > 1000) {
            if (count > 5) {
                console.log(`[IoT] High-throughput [${topic}]: ${count} msgs/sec. Latest:`, payload);
            } else {
                console.log(`[IoT] Received [${topic}]:`, payload);
            }
            this.lastTopicLogTimes.set(topic, now);
            this.topicMessageCounts.set(topic, 0);
        }

        // Trigger Automation Engine with tag sliding window debounce
        automationEngine.trigger('MACHINE_TRIGGER', { topic, payload: parsedPayload });

        // Batch dispatch to UI subscribers on animation frame / 50ms window
        this.scheduleBatchFlush();
    }

    scheduleBatchFlush() {
        if (this.pendingBatchFlush) return;
        this.pendingBatchFlush = true;

        const now = Date.now();
        const timeSinceLastFlush = now - this.lastFlushTime;
        const delay = Math.max(0, this.batchFlushIntervalMs - timeSinceLastFlush);

        setTimeout(() => {
            this.flushBatch();
        }, delay);
    }

    flushBatch() {
        this.pendingBatchFlush = false;
        this.lastFlushTime = Date.now();

        // Dispatch batched updates to direct topic subscribers
        this.subscriptions.forEach((callback, topic) => {
            if (this.latestValues.has(topic)) {
                const latest = this.latestValues.get(topic);
                try {
                    callback(latest.payload, latest.parsedPayload, latest);
                } catch (err) {
                    console.error(`[IoT] Error in subscriber for topic "${topic}":`, err);
                }
            }
        });

        // Dispatch batched updates to global message listeners
        if (this.messageListeners.size > 0) {
            this.latestValues.forEach((msgObj) => {
                this.messageListeners.forEach(fn => {
                    try {
                        fn(msgObj);
                    } catch (err) {
                        console.error('[IoT] Error in global message listener:', err);
                    }
                });
            });
        }
    }

    connect(brokerUrl = 'wss://broker.emqx.io:8084/mqtt') {
        if (this.client) return;

        if (brokerUrl.startsWith('ws://')) {
            const oldUrl = brokerUrl;
            if (brokerUrl.includes('broker.emqx.io')) {
                brokerUrl = brokerUrl.replace('ws://', 'wss://').replace(':8083', ':8084');
            } else {
                brokerUrl = brokerUrl.replace('ws://', 'wss://');
            }
            console.warn(`[IoT] Mixed Content protection: Upgraded ${oldUrl} to ${brokerUrl}`);
        }

        console.log(`Connecting to MQTT broker: ${brokerUrl}`);
        this.client = mqtt.connect(brokerUrl, {
            keepalive: 60,
            reconnectPeriod: 2000,
            connectTimeout: 30000,
            clean: true
        });

        this.client.on('connect', () => {
            this.status = 'connected';
            console.log('Successfully connected to MQTT broker');
            this.statusListeners.forEach(fn => fn({ status: 'connected', brokerUrl }));
            this.subscriptions.forEach((callback, topic) => {
                this.client.subscribe(topic);
            });
        });

        this.client.on('message', (topic, message) => {
            const payload = message.toString();
            let parsedPayload = payload;
            try {
                parsedPayload = JSON.parse(payload);
            } catch (e) {}

            this.handleIncomingMessage(topic, payload, parsedPayload, 'MQTT');
        });

        this.client.on('error', (err) => {
            this.status = 'error';
            console.error('MQTT Connection Error:', err);
            this.statusListeners.forEach(fn => fn({ status: 'error', error: err }));
        });

        this.client.on('close', () => {
            this.status = 'disconnected';
            console.log('MQTT Connection Closed');
            this.statusListeners.forEach(fn => fn({ status: 'disconnected' }));
        });
    }

    subscribe(topic, callback) {
        this.subscriptions.set(topic, callback);
        if (this.client && this.client.connected) {
            this.client.subscribe(topic);
        }
    }

    unsubscribe(topic) {
        this.subscriptions.delete(topic);
        if (this.client && this.client.connected) {
            this.client.unsubscribe(topic);
        }
    }

    publish(topic, message) {
        if (this.client && this.client.connected) {
            this.client.publish(topic, message);
        }
    }

    subscribeStatus(cb) {
        this.statusListeners.add(cb);
        cb({ status: this.status });
        return () => this.statusListeners.delete(cb);
    }

    subscribeMessage(cb) {
        this.messageListeners.add(cb);
        return () => this.messageListeners.delete(cb);
    }
}

const iotConnector = new IOTConnector();
export default iotConnector;
