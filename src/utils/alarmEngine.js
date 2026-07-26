/**
 * alarmEngine.js
 * =====================================================
 * SCADA Alarm Management System (ISA-18.2 / IEC 62682)
 * Implements alarm classification, prioritization,
 * shelving, suppression, escalation, and audit trail.
 * =====================================================
 */

import historian from './historianEngine';

const ALARM_STATES = {
    INACTIVE: 'INACTIVE',
    ACTIVE: 'ACTIVE',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    SHELVED: 'SHELVED',
    SUPPRESSED: 'SUPPRESSED',
    RETURNED_TO_NORMAL: 'RETURNED_TO_NORMAL'
};

const SEVERITY = {
    CRITICAL: { level: 1, color: '#ef4444', label: 'Critical' },
    HIGH: { level: 2, color: '#f97316', label: 'High' },
    MEDIUM: { level: 3, color: '#eab308', label: 'Medium' },
    LOW: { level: 4, color: '#3b82f6', label: 'Low' },
    INFO: { level: 5, color: '#6b7280', label: 'Info' }
};

const ALARM_TYPES = {
    PROCESS: 'PROCESS',
    EQUIPMENT: 'EQUIPMENT',
    SAFETY: 'SAFETY',
    ENVIRONMENTAL: 'ENVIRONMENTAL'
};

class AlarmEngine {
    constructor() {
        this._definitions = new Map();
        this._activeAlarms = new Map();
        this._alarmHistory = [];
        this._shelvedAlarms = new Map();
        this._suppressedAlarms = new Set();
        this._ackTimeouts = new Map();
        this._escalationTimers = new Map();
        this._listeners = new Map();
        this._maxHistory = 10000;
        this._initialized = false;
    }

    async initialize() {
        if (this._initialized) return;
        try {
            await historian.initialize();
            this._initialized = true;
        } catch (err) {
            console.error('[AlarmEngine] Init failed:', err);
        }
    }

    shutdown() {
        this._ackTimeouts.forEach(timer => clearTimeout(timer));
        this._escalationTimers.forEach(timer => clearInterval(timer));
        this._ackTimeouts.clear();
        this._escalationTimers.clear();
    }

    defineAlarm(tagName, config = {}) {
        const definition = {
            id: config.id || `ALM-${tagName}-${Date.now()}`,
            tagName,
            type: config.type || ALARM_TYPES.PROCESS,
            severity: config.severity || SEVERITY.MEDIUM,
            message: config.message || `Alarm on ${tagName}`,
            description: config.description || '',
            setpoint: config.setpoint || null,
            deadband: config.deadband || 0,
            delay: config.delay || 0,
            hysteresis: config.hysteresis || 0,
            enabled: config.enabled !== false,
            priority: config.priority || 3,
            group: config.group || 'Default',
            acknowledgeTimeout: config.acknowledgeTimeout || 300000,
            escalationDelay: config.escalationDelay || 60000,
            maxEscalations: config.maxEscalations || 3,
            createdAt: Date.now()
        };
        this._definitions.set(definition.id, definition);
        return definition;
    }

    removeAlarmDefinition(alarmId) {
        this._definitions.delete(alarmId);
        this._activeAlarms.delete(alarmId);
        this._shelvedAlarms.delete(alarmId);
    }

    async evaluate(tagName, value, timestamp = Date.now()) {
        if (!this._initialized) await this.initialize();

        for (const [alarmId, def] of this._definitions) {
            if (def.tagName !== tagName || !def.enabled) continue;
            if (this._suppressedAlarms.has(alarmId)) continue;

            const shelved = this._shelvedAlarms.get(alarmId);
            if (shelved && shelved.until > timestamp) continue;
            if (shelved && shelved.until <= timestamp) {
                this._shelvedAlarms.delete(alarmId);
            }

            const isAlarm = this._checkCondition(value, def);
            const current = this._activeAlarms.get(alarmId);

            if (isAlarm && !current) {
                await this._activateAlarm(def, value, timestamp);
            } else if (!isAlarm && current) {
                await this._returnToNormal(alarmId, timestamp);
            } else if (isAlarm && current) {
                this._updateAlarmValue(alarmId, value, timestamp);
            }
        }
    }

    _checkCondition(value, def) {
        if (typeof value !== 'number' || def.setpoint === null) return false;
        const setpoint = def.setpoint;
        const deadband = def.deadband || 0;

        if (def.condition === 'greater_than') return value > setpoint;
        if (def.condition === 'less_than') return value < setpoint;
        if (def.condition === 'equals') return Math.abs(value - setpoint) <= deadband;
        if (def.condition === 'not_equals') return Math.abs(value - setpoint) > deadband;
        if (def.condition === 'high_high') return value > setpoint + deadband;
        if (def.condition === 'low_low') return value < setpoint - deadband;

        return value > setpoint;
    }

    async _activateAlarm(def, value, timestamp) {
        const alarm = {
            id: def.id,
            tagName: def.tagName,
            type: def.type,
            severity: def.severity,
            message: def.message,
            state: ALARM_STATES.ACTIVE,
            value,
            setpoint: def.setpoint,
            triggeredAt: timestamp,
            acknowledgedAt: null,
            acknowledgedBy: null,
            returnedToNormalAt: null,
            escalationCount: 0
        };

        if (def.delay > 0) {
            await new Promise(resolve => {
                const timer = setTimeout(async () => {
                    const stillAlarm = this._checkCondition(value, def);
                    if (stillAlarm) {
                        this._activeAlarms.set(def.id, alarm);
                        this._alarmHistory.push({ ...alarm });
                        this._trimHistory();
                        this._notifyListeners('alarmActivated', alarm);
                        historian.recordSample(`ALARM_${def.tagName}`, 1, timestamp);
                        this._startEscalation(def, alarm);
                    }
                    resolve();
                }, def.delay);
                this._ackTimeouts.set(def.id + '_delay', timer);
            });
        } else {
            this._activeAlarms.set(def.id, alarm);
            this._alarmHistory.push({ ...alarm });
            this._trimHistory();
            this._notifyListeners('alarmActivated', alarm);
            historian.recordSample(`ALARM_${def.tagName}`, 1, timestamp);
            this._startEscalation(def, alarm);
        }
    }

    async _returnToNormal(alarmId, timestamp) {
        const alarm = this._activeAlarms.get(alarmId);
        if (!alarm) return;

        alarm.state = ALARM_STATES.RETURNED_TO_NORMAL;
        alarm.returnedToNormalAt = timestamp;

        this._alarmHistory.push({ ...alarm });
        this._trimHistory();
        this._activeAlarms.delete(alarmId);
        this._stopEscalation(alarmId);

        this._notifyListeners('alarmReturnedToNormal', alarm);
        historian.recordSample(`ALARM_${alarm.tagName}`, 0, timestamp);
    }

    _updateAlarmValue(alarmId, value, timestamp) {
        const alarm = this._activeAlarms.get(alarmId);
        if (alarm) {
            alarm.value = value;
            alarm.lastUpdatedAt = timestamp;
        }
    }

    async acknowledgeAlarm(alarmId, userId = 'system') {
        const alarm = this._activeAlarms.get(alarmId);
        if (!alarm) return null;

        alarm.state = ALARM_STATES.ACKNOWLEDGED;
        alarm.acknowledgedAt = Date.now();
        alarm.acknowledgedBy = userId;

        this._alarmHistory.push({ ...alarm });
        this._trimHistory();
        this._stopEscalation(alarmId);
        this._notifyListeners('alarmAcknowledged', alarm);
        historian.recordSample(`ACK_${alarm.tagName}`, 1, Date.now());
        return alarm;
    }

    async acknowledgeAll(userId = 'system') {
        const results = [];
        for (const [alarmId] of this._activeAlarms) {
            const result = await this.acknowledgeAlarm(alarmId, userId);
            if (result) results.push(result);
        }
        return results;
    }

    async shelveAlarm(alarmId, durationMs = 3600000) {
        const alarm = this._activeAlarms.get(alarmId);
        if (!alarm) return false;

        this._shelvedAlarms.set(alarmId, {
            until: Date.now() + durationMs,
            shelvedAt: Date.now()
        });

        alarm.state = ALARM_STATES.SHELVED;
        this._alarmHistory.push({ ...alarm });
        this._trimHistory();
        this._notifyListeners('alarmShelved', alarm);
        return true;
    }

    async unshelveAlarm(alarmId) {
        this._shelvedAlarms.delete(alarmId);
        this._notifyListeners('alarmUnshelved', { alarmId });
        return true;
    }

    suppressAlarm(alarmId) {
        this._suppressedAlarms.add(alarmId);
        this._notifyListeners('alarmSuppressed', { alarmId });
    }

    unsuppressAlarm(alarmId) {
        this._suppressedAlarms.delete(alarmId);
        this._notifyListeners('alarmUnsuppressed', { alarmId });
    }

    _startEscalation(def, alarm) {
        if (!def.escalationDelay || def.escalationDelay <= 0) return;

        const timer = setInterval(() => {
            const current = this._activeAlarms.get(alarm.id);
            if (!current || current.state === ALARM_STATES.ACKNOWLEDGED) {
                this._stopEscalation(alarm.id);
                return;
            }

            if (current.escalationCount < (def.maxEscalations || 3)) {
                current.escalationCount++;
                current.severity = this._escalateSeverity(current.severity);
                this._notifyListeners('alarmEscalated', current);
                historian.recordSample(`ESCALATE_${def.tagName}`, current.severity.level, Date.now());
            }
        }, def.escalationDelay);

        this._escalationTimers.set(alarm.id, timer);
    }

    _stopEscalation(alarmId) {
        const timer = this._escalationTimers.get(alarmId);
        if (timer) {
            clearInterval(timer);
            this._escalationTimers.delete(alarmId);
        }
    }

    _escalateSeverity(current) {
        const levels = [SEVERITY.CRITICAL, SEVERITY.HIGH, SEVERITY.MEDIUM, SEVERITY.LOW, SEVERITY.INFO];
        const idx = levels.findIndex(s => s.level === current.level);
        return idx > 0 ? levels[idx - 1] : current;
    }

    _trimHistory() {
        if (this._alarmHistory.length > this._maxHistory) {
            this._alarmHistory = this._alarmHistory.slice(-this._maxHistory);
        }
    }

    subscribe(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return () => this._listeners.get(event)?.delete(callback);
    }

    _notifyListeners(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(cb => {
                try { cb(data); } catch (e) { /* silent */ }
            });
        }
        const allListeners = this._listeners.get('*');
        if (allListeners) {
            allListeners.forEach(cb => {
                try { cb(event, data); } catch (e) { /* silent */ }
            });
        }
    }

    getActiveAlarms() {
        return Array.from(this._activeAlarms.values());
    }

    getAlarmHistory(options = {}) {
        let history = [...this._alarmHistory];
        if (options.tagName) {
            history = history.filter(a => a.tagName === options.tagName);
        }
        if (options.severity) {
            history = history.filter(a => a.severity.label === options.severity);
        }
        if (options.startTime) {
            history = history.filter(a => a.triggeredAt >= options.startTime);
        }
        if (options.endTime) {
            history = history.filter(a => a.triggeredAt <= options.endTime);
        }
        if (options.limit) {
            history = history.slice(-options.limit);
        }
        return history;
    }

    getAlarmStats() {
        const active = this.getActiveAlarms();
        const bySeverity = {};
        const byState = {};

        for (const alarm of active) {
            const sev = alarm.severity.label;
            bySeverity[sev] = (bySeverity[sev] || 0) + 1;
            byState[alarm.state] = (byState[alarm.state] || 0) + 1;
        }

        return {
            totalActive: active.length,
            totalHistory: this._alarmHistory.length,
            totalDefinitions: this._definitions.size,
            bySeverity,
            byState,
            unacknowledged: active.filter(a => a.state === ALARM_STATES.ACTIVE).length,
            shelved: this._shelvedAlarms.size,
            suppressed: this._suppressedAlarms.size
        };
    }

    getDefinitions() {
        return Array.from(this._definitions.values());
    }

    updateAlarmDefinition(alarmId, updates) {
        const def = this._definitions.get(alarmId);
        if (!def) return null;
        Object.assign(def, updates);
        return def;
    }
}

const alarmEngine = new AlarmEngine();
export default alarmEngine;
export { AlarmEngine, ALARM_STATES, SEVERITY, ALARM_TYPES };
