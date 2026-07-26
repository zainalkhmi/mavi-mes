/**
 * historianEngine.js
 * =====================================================
 * SCADA Historian - Time-Series Data Persistence Layer
 * Uses IndexedDB (Dexie) for local storage + Supabase sync.
 * Implements data compression, retention policies, and
 * efficient querying for historical trend analysis.
 * =====================================================
 */

import Dexie from 'dexie';

const DB_NAME = 'MaviSCADAHistorian';
const DB_VERSION = 1;

const db = new Dexie(DB_NAME);
db.version(DB_VERSION).stores({
    tags: '++id, name, unit, description, createdAt',
    samples: '++id, tagId, timestamp, [tagId+timestamp]',
    alarms: '++id, tagId, timestamp, severity, [tagId+timestamp]',
    events: '++id, type, timestamp, [type+timestamp]'
});

const DEFAULT_RETENTION = {
    highResolution: 7 * 24 * 60 * 60 * 1000,
    lowResolution: 90 * 24 * 60 * 60 * 1000,
    archive: 365 * 24 * 60 * 60 * 1000
};

const COMPRESSION_INTERVAL = 60 * 1000;

class HistorianEngine {
    constructor() {
        this._tags = new Map();
        this._buffers = new Map();
        this._listeners = new Map();
        this._compressionTimer = null;
        this._syncTimer = null;
        this._retentionTimer = null;
        this._initialized = false;
    }

    async initialize() {
        if (this._initialized) return;
        try {
            await db.open();
            const tags = await db.tags.toArray();
            tags.forEach(tag => this._tags.set(tag.name, tag));
            this._startBackgroundTasks();
            this._initialized = true;
        } catch (err) {
            console.error('[Historian] Failed to initialize:', err);
        }
    }

    async shutdown() {
        if (this._compressionTimer) clearInterval(this._compressionTimer);
        if (this._syncTimer) clearInterval(this._syncTimer);
        if (this._retentionTimer) clearInterval(this._retentionTimer);
        await this.flushBuffers();
        await db.close();
        this._initialized = false;
    }

    async registerTag(name, options = {}) {
        if (this._tags.has(name)) return this._tags.get(name);
        const tag = {
            name,
            unit: options.unit || '',
            description: options.description || '',
            dataType: options.dataType || 'number',
            deadband: options.deadband || 0,
            createdAt: Date.now()
        };
        const id = await db.tags.add(tag);
        tag.id = id;
        this._tags.set(name, tag);
        return tag;
    }

    async getTags() {
        return Array.from(this._tags.values());
    }

    async recordSample(tagName, value, timestamp = Date.now()) {
        const tag = this._tags.get(tagName);
        if (!tag) {
            await this.registerTag(tagName);
        }

        if (!this._buffers.has(tagName)) {
            this._buffers.set(tagName, []);
        }

        const buffer = this._buffers.get(tagName);
        buffer.push({ value, timestamp });

        if (buffer.length >= 100) {
            await this._flushTagBuffer(tagName);
        }

        this._notifyListeners(tagName, value, timestamp);
    }

    async recordSamples(samples) {
        for (const [tagName, value] of Object.entries(samples)) {
            await this.recordSample(tagName, value);
        }
    }

    async _flushTagBuffer(tagName) {
        const buffer = this._buffers.get(tagName);
        if (!buffer || buffer.length === 0) return;

        const tag = this._tags.get(tagName);
        const tagId = tag?.id || tagName;

        const records = buffer.splice(0, buffer.length).map(s => ({
            tagId,
            timestamp: s.timestamp,
            value: s.value
        }));

        try {
            await db.samples.bulkAdd(records);
        } catch (err) {
            console.error(`[Historian] Failed to flush buffer for ${tagName}:`, err);
        }
    }

    async flushBuffers() {
        for (const tagName of this._buffers.keys()) {
            await this._flushTagBuffer(tagName);
        }
    }

    async query(tagName, startTime, endTime, maxPoints = 500) {
        const tag = this._tags.get(tagName);
        if (!tag) return [];

        const samples = await db.samples
            .where('[tagId+timestamp]')
            .between([tag.id || tagName, startTime], [tag.id || tagName, endTime])
            .toArray();

        if (samples.length <= maxPoints) {
            return samples.map(s => ({ t: s.timestamp, v: s.value }));
        }

        return this._downsample(samples, maxPoints);
    }

    _downsample(samples, targetPoints) {
        const bucketSize = Math.ceil(samples.length / targetPoints);
        const result = [];

        for (let i = 0; i < samples.length; i += bucketSize) {
            const bucket = samples.slice(i, i + bucketSize);
            const avgValue = bucket.reduce((sum, s) => sum + (typeof s.value === 'number' ? s.value : 0), 0) / bucket.length;
            result.push({
                t: bucket[Math.floor(bucket.length / 2)].timestamp,
                v: Math.round(avgValue * 1000) / 1000
            });
        }

        return result;
    }

    async getLatest(tagName) {
        const tag = this._tags.get(tagName);
        if (!tag) return null;

        const sample = await db.samples
            .where('tagId')
            .equals(tag.id || tagName)
            .last();

        return sample ? { t: sample.timestamp, v: sample.value } : null;
    }

    async getLatestAll() {
        const result = {};
        for (const [name] of this._tags) {
            const latest = await this.getLatest(name);
            if (latest) result[name] = latest;
        }
        return result;
    }

    subscribe(tagName, callback) {
        if (!this._listeners.has(tagName)) {
            this._listeners.set(tagName, new Set());
        }
        this._listeners.get(tagName).add(callback);
        return () => this._listeners.get(tagName)?.delete(callback);
    }

    _notifyListeners(tagName, value, timestamp) {
        const listeners = this._listeners.get(tagName);
        if (listeners) {
            listeners.forEach(cb => {
                try { cb(value, timestamp); } catch (e) { /* silent */ }
            });
        }
        const allListeners = this._listeners.get('*');
        if (allListeners) {
            allListeners.forEach(cb => {
                try { cb(tagName, value, timestamp); } catch (e) { /* silent */ }
            });
        }
    }

    async compressOldData() {
        const now = Date.now();
        const lowResStart = now - DEFAULT_RETENTION.highResolution;
        const highResTags = await db.tags.toArray();

        for (const tag of highResTags) {
            const samples = await db.samples
                .where('[tagId+timestamp]')
                .between([tag.id, 0], [tag.id, lowResStart])
                .toArray();

            if (samples.length === 0) continue;

            const bucketMs = 5 * 60 * 1000;
            const buckets = new Map();

            for (const sample of samples) {
                const bucketKey = Math.floor(sample.timestamp / bucketMs) * bucketMs;
                if (!buckets.has(bucketKey)) {
                    buckets.set(bucketKey, { sum: 0, count: 0, min: Infinity, max: -Infinity });
                }
                const b = buckets.get(bucketKey);
                const val = typeof sample.value === 'number' ? sample.value : 0;
                b.sum += val;
                b.count += 1;
                b.min = Math.min(b.min, val);
                b.max = Math.max(b.max, val);
            }

            const sampleIds = samples.map(s => s.id);
            await db.samples.bulkDelete(sampleIds);

            const compressed = Array.from(buckets.entries()).map(([timestamp, b]) => ({
                tagId: tag.id,
                timestamp,
                value: Math.round((b.sum / b.count) * 1000) / 1000
            }));

            await db.samples.bulkAdd(compressed);
        }
    }

    async enforceRetentionPolicy(retention = DEFAULT_RETENTION) {
        const now = Date.now();
        const cutoff = now - retention.archive;
        await db.samples.where('timestamp').below(cutoff).delete();
        await db.alarms.where('timestamp').below(cutoff).delete();
        await db.events.where('timestamp').below(cutoff).delete();
    }

    async syncToSupabase(supabaseUrl, anonKey) {
        if (!supabaseUrl || !anonKey) return;
        try {
            const unsynced = await db.samples.where('synced').equals(0).limit(500).toArray();
            if (unsynced.length === 0) return;

            const response = await fetch(`${supabaseUrl}/rest/v1/historian_samples`, {
                method: 'POST',
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${anonKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(unsynced.map(s => ({
                    tag_id: s.tagId,
                    timestamp: new Date(s.timestamp).toISOString(),
                    value: s.value
                })))
            });

            if (response.ok) {
                const ids = unsynced.map(s => s.id);
                await db.samples.bulkUpdate(ids.map(id => ({ key: id, changes: { synced: 1 } })));
            }
        } catch (err) {
            console.error('[Historian] Supabase sync failed:', err);
        }
    }

    _startBackgroundTasks() {
        this._compressionTimer = setInterval(() => this.compressOldData(), COMPRESSION_INTERVAL);
        this._syncTimer = setInterval(() => {
            try {
                const settings = JSON.parse(localStorage.getItem('supabase_storage_settings') || '{}');
                if (settings.url && settings.anonKey) {
                    this.syncToSupabase(settings.url, settings.anonKey);
                }
            } catch { /* silent */ }
        }, 30 * 1000);
        this._retentionTimer = setInterval(() => this.enforceRetentionPolicy(), 60 * 60 * 1000);
    }

    async getStats() {
        const sampleCount = await db.samples.count();
        const tagCount = await db.tags.count();
        const oldest = await db.samples.orderBy('timestamp').first();
        const newest = await db.samples.orderBy('timestamp').last();
        return {
            sampleCount,
            tagCount,
            oldestTimestamp: oldest?.timestamp || null,
            newestTimestamp: newest?.timestamp || null,
            bufferSizes: Object.fromEntries(
                Array.from(this._buffers.entries()).map(([k, v]) => [k, v.length])
            )
        };
    }

    async exportCSV(tagName, startTime, endTime) {
        const data = await this.query(tagName, startTime, endTime, 100000);
        const tag = this._tags.get(tagName);
        const header = `timestamp,value${tag?.unit ? `,unit` : ''}\n`;
        const rows = data.map(d =>
            `${new Date(d.t).toISOString()},${d.v}${tag?.unit ? `,${tag.unit}` : ''}`
        ).join('\n');
        return header + rows;
    }

    async clearAll() {
        await db.samples.clear();
        await db.alarms.clear();
        await db.events.clear();
        await db.tags.clear();
        this._tags.clear();
        this._buffers.clear();
    }
}

const historian = new HistorianEngine();
export default historian;
export { HistorianEngine, db as historianDb };
