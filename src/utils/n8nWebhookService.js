/**
 * n8n Webhook Service for Mandor MES
 * =================================
 * Central outgoing webhook engine that fires events to n8n
 * (or any webhook-compatible workflow automation tool).
 *
 * Features:
 *  - Configurable webhook URL + secret key
 *  - Per-event-type subscription control
 *  - Retry logic with exponential backoff (3 attempts)
 *  - Delivery log stored in localStorage for debugging
 *  - HMAC-SHA256 signature header for security (optional)
 *
 * Usage:
 *   import n8nWebhook from './n8nWebhookService';
 *   n8nWebhook.fire('work_order.completed', { work_order: 'WO-001', ... });
 */

// ─── Constants ─────────────────────────────────────────────────────────────────
const LS_CONFIG_KEY = 'mandor_n8n_webhook_config';
const LS_LOG_KEY    = 'mandor_n8n_webhook_log';
const MAX_LOG_ENTRIES = 150;
const MAX_RETRIES     = 3;
const BASE_DELAY_MS   = 1000; // 1s, 2s, 4s exponential backoff

/**
 * All supported MES event types.
 * Each entry: { key, label, description, defaultEnabled }
 */
export const N8N_EVENT_TYPES = [
    { key: 'work_order.created',      label: 'Work Order Created',       description: 'Triggered when a new production job is created',          defaultEnabled: true  },
    { key: 'work_order.started',      label: 'Work Order Started',       description: 'Triggered when a job status changes to IN_PROGRESS',      defaultEnabled: true  },
    { key: 'work_order.completed',    label: 'Work Order Completed',     description: 'Triggered when a job status changes to COMPLETED',        defaultEnabled: true  },
    { key: 'cycle.completed',         label: 'Cycle Completed',          description: 'Triggered when an operator completes a production cycle', defaultEnabled: true  },
    { key: 'inspection.passed',       label: 'Inspection Passed (QC)',   description: 'Triggered when a quality inspection passes',              defaultEnabled: true  },
    { key: 'inspection.failed',       label: 'Inspection Failed (QC)',   description: 'Triggered when a quality inspection fails',               defaultEnabled: true  },
    { key: 'andon.triggered',         label: 'Andon Triggered',          description: 'Triggered when an Andon alert is activated',              defaultEnabled: true  },
    { key: 'andon.resolved',          label: 'Andon Resolved',           description: 'Triggered when an Andon alert is resolved',               defaultEnabled: false },
    { key: 'production.job_created',  label: 'Production Job Created',   description: 'Triggered when a job enters the production queue',        defaultEnabled: true  },
    { key: 'machine.status_changed',  label: 'Machine Status Changed',   description: 'Triggered on machine status update',                     defaultEnabled: false },
    { key: 'inventory.low_stock',     label: 'Inventory Low Stock',      description: 'Triggered when stock falls below threshold',              defaultEnabled: false },
    { key: 'app.published',           label: 'App Published',            description: 'Triggered when a frontline app is published',             defaultEnabled: false },
    { key: 'chat.message_sent',       label: 'Chat Message Sent (WhatsApp)', description: 'Triggered when a message is sent in the Chat Widget', defaultEnabled: true },
];

// Build default subscription map
const DEFAULT_SUBSCRIPTIONS = Object.fromEntries(
    N8N_EVENT_TYPES.map(e => [e.key, e.defaultEnabled])
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getConfig() {
    try {
        const raw = localStorage.getItem(LS_CONFIG_KEY);
        if (!raw) return getDefaultConfig();
        return { ...getDefaultConfig(), ...JSON.parse(raw) };
    } catch {
        return getDefaultConfig();
    }
}

function getDefaultConfig() {
    return {
        enabled: false,
        webhookUrl: '',
        secretKey: '',
        subscriptions: { ...DEFAULT_SUBSCRIPTIONS },
        includeMetadata: true
    };
}

function saveConfig(config) {
    localStorage.setItem(LS_CONFIG_KEY, JSON.stringify(config));
}

function getDeliveryLog() {
    try {
        return JSON.parse(localStorage.getItem(LS_LOG_KEY) || '[]');
    } catch {
        return [];
    }
}

function appendLog(entry) {
    try {
        const log = getDeliveryLog();
        log.unshift(entry);
        localStorage.setItem(LS_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES)));
    } catch { /* noop */ }
}

/**
 * Generate HMAC-SHA256 signature for payload verification.
 * Uses Web Crypto API (available in all modern browsers).
 */
async function generateSignature(payload, secret) {
    if (!secret) return null;
    try {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
        return Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    } catch (err) {
        console.warn('[n8n-Webhook] HMAC signature generation failed:', err);
        return null;
    }
}

/**
 * Sleep helper for retry delay.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Main Service Class ────────────────────────────────────────────────────────

class N8nWebhookService {
    constructor() {
        this._config = null;
        this._listeners = [];
    }

    // ── Configuration ──────────────────────────────────────────────────────────

    /** Get current configuration (cached). */
    getConfig() {
        if (!this._config) this._config = getConfig();
        return { ...this._config };
    }

    /** Update configuration and persist. */
    updateConfig(partial) {
        const current = this.getConfig();
        const next = {
            ...current,
            ...partial,
            subscriptions: {
                ...current.subscriptions,
                ...(partial.subscriptions || {})
            }
        };
        saveConfig(next);
        this._config = next;
        this._notifyListeners('config_changed', next);
        return next;
    }

    /** Reset to defaults. */
    resetConfig() {
        const defaults = getDefaultConfig();
        saveConfig(defaults);
        this._config = defaults;
        this._notifyListeners('config_changed', defaults);
        return defaults;
    }

    /** Check if service is active and properly configured. */
    isActive() {
        const cfg = this.getConfig();
        return Boolean(cfg.enabled && cfg.webhookUrl);
    }

    // ── Event Firing ───────────────────────────────────────────────────────────

    /**
     * Fire an event to n8n webhook.
     * @param {string} eventType - One of the N8N_EVENT_TYPES keys (e.g. 'work_order.completed')
     * @param {Object} data - Event-specific payload data
     * @param {Object} [metadata] - Optional metadata (station, operator, app_id, etc.)
     * @returns {Promise<{success: boolean, statusCode?: number, error?: string}>}
     */
    async fire(eventType, data = {}, metadata = {}) {
        const cfg = this.getConfig();

        // Guard: service disabled
        if (!cfg.enabled || !cfg.webhookUrl) {
            return { success: false, error: 'Webhook not enabled or URL not configured' };
        }

        // Guard: event type not subscribed
        if (cfg.subscriptions[eventType] === false) {
            return { success: false, error: `Event "${eventType}" is not subscribed` };
        }

        const payload = {
            event: eventType,
            timestamp: new Date().toISOString(),
            source: 'mandor-mes',
            version: '1.0',
            data,
            ...(cfg.includeMetadata ? { metadata } : {})
        };

        const bodyString = JSON.stringify(payload);

        // Build headers
        const headers = {
            'Content-Type': 'application/json',
            'X-Mandor-Event': eventType,
            'X-Mandor-Source': 'mandor-mes'
        };

        // HMAC signature
        if (cfg.secretKey) {
            const sig = await generateSignature(bodyString, cfg.secretKey);
            if (sig) headers['X-Mandor-Signature'] = `sha256=${sig}`;
        }

        // Attempt delivery with retry
        let lastError = null;
        let statusCode = null;

        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

                const response = await fetch(cfg.webhookUrl, {
                    method: 'POST',
                    headers,
                    body: bodyString,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                statusCode = response.status;

                if (response.ok) {
                    const logEntry = {
                        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                        event: eventType,
                        timestamp: payload.timestamp,
                        status: 'delivered',
                        statusCode,
                        attempt,
                        url: cfg.webhookUrl
                    };
                    appendLog(logEntry);
                    this._notifyListeners('delivered', logEntry);
                    console.log(`[n8n-Webhook] ✅ ${eventType} delivered (attempt ${attempt})`);
                    return { success: true, statusCode };
                }

                lastError = `HTTP ${statusCode}`;
                console.warn(`[n8n-Webhook] ⚠️ ${eventType} attempt ${attempt}/${MAX_RETRIES} failed: ${lastError}`);

            } catch (err) {
                lastError = err?.name === 'AbortError' ? 'Timeout (10s)' : (err.message || 'Network error');
                console.warn(`[n8n-Webhook] ⚠️ ${eventType} attempt ${attempt}/${MAX_RETRIES} error:`, lastError);
            }

            // Exponential backoff before retry
            if (attempt < MAX_RETRIES) {
                await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1));
            }
        }

        // All retries exhausted
        const logEntry = {
            id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            event: eventType,
            timestamp: payload.timestamp,
            status: 'failed',
            statusCode,
            error: lastError,
            attempt: MAX_RETRIES,
            url: cfg.webhookUrl
        };
        appendLog(logEntry);
        this._notifyListeners('failed', logEntry);
        console.error(`[n8n-Webhook] ❌ ${eventType} failed after ${MAX_RETRIES} attempts: ${lastError}`);
        return { success: false, statusCode, error: lastError };
    }

    /**
     * Send a test event to verify webhook connectivity.
     * @returns {Promise<{success: boolean, statusCode?: number, error?: string}>}
     */
    async testConnection() {
        const cfg = this.getConfig();
        if (!cfg.webhookUrl) {
            return { success: false, error: 'Webhook URL is not configured' };
        }

        // Temporarily force enabled for test
        const wasEnabled = cfg.enabled;
        if (!wasEnabled) {
            this._config = { ...cfg, enabled: true };
        }

        const result = await this.fire('test.connection', {
            message: 'This is a test event from Mandor MES',
            testId: crypto.randomUUID?.() || Date.now().toString()
        }, {
            station: 'Settings Panel',
            operator: 'System',
            app_id: null
        });

        // Restore original state
        if (!wasEnabled) {
            this._config = cfg;
        }

        return result;
    }

    // ── Delivery Log ───────────────────────────────────────────────────────────

    /** Get recent delivery log entries. */
    getDeliveryLog() {
        return getDeliveryLog();
    }

    /** Clear the delivery log. */
    clearDeliveryLog() {
        localStorage.removeItem(LS_LOG_KEY);
        this._notifyListeners('log_cleared');
    }

    // ── Listener System ────────────────────────────────────────────────────────

    /**
     * Subscribe to webhook service events.
     * @param {Function} callback - Called with (eventName, data)
     * @returns {Function} Unsubscribe function
     */
    addListener(callback) {
        if (typeof callback === 'function') {
            this._listeners.push(callback);
        }
        return () => {
            this._listeners = this._listeners.filter(l => l !== callback);
        };
    }

    _notifyListeners(eventName, data) {
        this._listeners.forEach(cb => {
            try { cb(eventName, data); } catch (e) { /* noop */ }
        });
    }

    // ── Convenience: Map audit event types to n8n event types ──────────────────

    /**
     * Maps MANDOR audit event types to n8n webhook event types.
     * Returns null if the audit event should not fire a webhook.
     */
    mapAuditEvent(auditEventType, details = {}) {
        const action = details?.action?.toUpperCase?.() || '';

        switch (auditEventType) {
            case 'CYCLE_COMPLETE':
                return 'cycle.completed';
            case 'QUALITY_PASS':
                return 'inspection.passed';
            case 'QUALITY_FAIL':
                return 'inspection.failed';
            case 'WORK_ORDER_BIND':
                return 'work_order.created';
            default:
                break;
        }

        // Andon events come via details.action
        if (action === 'ANDON_TRIGGERED') return 'andon.triggered';
        if (action === 'ANDON_RESOLVED') return 'andon.resolved';

        return null;
    }
}

// ─── Singleton Export ──────────────────────────────────────────────────────────
const n8nWebhook = new N8nWebhookService();
export default n8nWebhook;
