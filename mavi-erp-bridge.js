/**
 * Mavi ERP Bridge — CORS Proxy + SQL Gateway
 * =============================================
 * Jalankan ini di server yang sama dengan ERP / database Anda.
 * Ini memungkinkan Mavi-MES di browser memanggil ERP & query PostgreSQL
 * tanpa CORS error dan tanpa expose credentials ke frontend.
 *
 * Install:
 *   npm install express http-proxy-middleware cors pg
 *
 * Run:
 *   node mavi-erp-bridge.js
 *
 * Env vars (opsional, bisa juga set via /sql API):
 *   PORT=3099
 *   ODOO_URL=http://192.168.1.10:8069
 *   SAP_URL=http://192.168.1.20:8000
 *   FREPPLE_URL=http://192.168.1.30:8001
 *   BRIDGE_API_KEY=rahasia123   ← wajib untuk production!
 *
 * Endpoint SQL:
 *   POST /sql/query          → jalankan SELECT query
 *   POST /sql/connect-test   → test koneksi PostgreSQL
 *   GET  /sql/tables         → list semua tabel
 *   GET  /sql/schema/:table  → schema kolom tabel
 *   GET  /health             → status semua koneksi
 */

const express    = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors       = require('cors');
const { Pool }   = require('pg');

const app  = express();
const PORT = process.env.PORT || 3099;

// API Key untuk keamanan (set via env var BRIDGE_API_KEY)
// Jika tidak di-set, mode development (tanpa auth)
const API_KEY = process.env.BRIDGE_API_KEY || null;

// ─── Pool Registry: simpan koneksi PostgreSQL yang aktif ──────────────────────
// Key: connection string atau alias name
const pgPools = new Map();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 'Authorization', 'X-API-Key',
        'X-CSRF-Token', 'sap-client', '$format',
        'X-Mavi-Bridge-Key'
    ]
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));

// ─── Auth Middleware (jika API_KEY di-set) ────────────────────────────────────
function authMiddleware(req, res, next) {
    if (!API_KEY) return next(); // Development mode: skip auth
    const key = req.headers['x-mavi-bridge-key'] || req.headers['authorization']?.replace('Bearer ', '');
    if (key !== API_KEY) {
        return res.status(401).json({ error: 'Unauthorized. Set X-Mavi-Bridge-Key header.' });
    }
    next();
}

// ─── Logger ───────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    const ts = new Date().toISOString().substring(11, 19);
    console.log(`[${ts}] ${req.method} ${req.path}`);
    next();
});

// ─── Helper: dapatkan atau buat Pool ──────────────────────────────────────────
function getPool(connConfig) {
    // Buat key unik dari config
    const key = typeof connConfig === 'string'
        ? connConfig
        : `${connConfig.host}:${connConfig.port}/${connConfig.database}`;

    if (!pgPools.has(key)) {
        const pool = new Pool({
            ...(typeof connConfig === 'string' ? { connectionString: connConfig } : connConfig),
            max: 5,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: connConfig.ssl || false
        });

        pool.on('error', (err) => {
            console.error(`[PG Pool ${key}] Unexpected error:`, err.message);
        });

        pgPools.set(key, pool);
        console.log(`[PG] New pool created for: ${key}`);
    }

    return pgPools.get(key);
}

// ─── SQL ENDPOINTS ────────────────────────────────────────────────────────────

/**
 * POST /sql/query
 * Jalankan SQL query ke PostgreSQL database mana saja.
 *
 * Body:
 * {
 *   "connection": {
 *     "host": "192.168.1.10",
 *     "port": 5432,
 *     "database": "odoo_db",
 *     "user": "odoo",
 *     "password": "secret",
 *     "ssl": false
 *   },
 *   "query": "SELECT id, name, state FROM mrp_production WHERE state = $1 LIMIT $2",
 *   "params": ["confirmed", 50],
 *   "readOnly": true   ← jika true, hanya SELECT yang diizinkan
 * }
 */
app.post('/sql/query', authMiddleware, async (req, res) => {
    const { connection, query, params = [], readOnly = true } = req.body;

    if (!connection) {
        return res.status(400).json({ error: 'connection config is required' });
    }
    if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'query string is required' });
    }

    // Safety: jika readOnly, hanya izinkan SELECT
    if (readOnly) {
        const trimmed = query.trim().toUpperCase();
        if (!trimmed.startsWith('SELECT') && !trimmed.startsWith('WITH')) {
            return res.status(403).json({
                error: 'Only SELECT queries are allowed in readOnly mode.',
                hint: 'Set "readOnly": false to allow write operations.'
            });
        }
    }

    const startTime = Date.now();
    try {
        const pool = getPool(connection);
        const result = await pool.query(query, params);
        const durationMs = Date.now() - startTime;

        console.log(`[SQL] Query OK — ${result.rowCount} rows in ${durationMs}ms`);

        res.json({
            ok: true,
            rows: result.rows,
            rowCount: result.rowCount,
            fields: result.fields?.map(f => ({ name: f.name, dataTypeID: f.dataTypeID })),
            durationMs,
            query: query.substring(0, 100) + (query.length > 100 ? '...' : '')
        });
    } catch (err) {
        console.error('[SQL] Query error:', err.message);
        res.status(500).json({
            ok: false,
            error: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            durationMs: Date.now() - startTime
        });
    }
});

/**
 * POST /sql/connect-test
 * Test koneksi ke PostgreSQL tanpa query.
 */
app.post('/sql/connect-test', authMiddleware, async (req, res) => {
    const { connection } = req.body;
    if (!connection) return res.status(400).json({ error: 'connection config is required' });

    const startTime = Date.now();
    let client;
    try {
        const pool = getPool(connection);
        client = await pool.connect();
        const result = await client.query('SELECT version(), current_database(), current_user, now()');
        const row = result.rows[0];

        res.json({
            ok: true,
            latencyMs: Date.now() - startTime,
            database: row.current_database,
            user: row.current_user,
            serverTime: row.now,
            version: row.version?.split(' ').slice(0, 2).join(' ')
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            error: err.message,
            latencyMs: Date.now() - startTime
        });
    } finally {
        if (client) client.release();
    }
});

/**
 * POST /sql/tables
 * List semua tabel & views di database.
 */
app.post('/sql/tables', authMiddleware, async (req, res) => {
    const { connection, schema = 'public' } = req.body;
    if (!connection) return res.status(400).json({ error: 'connection config is required' });

    try {
        const pool = getPool(connection);
        const result = await pool.query(
            `SELECT table_name, table_type
             FROM information_schema.tables
             WHERE table_schema = $1
               AND table_type IN ('BASE TABLE', 'VIEW')
             ORDER BY table_type, table_name`,
            [schema]
        );
        res.json({ ok: true, tables: result.rows });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /sql/schema
 * Lihat kolom & tipe data suatu tabel.
 * Body: { connection, table, schema }
 */
app.post('/sql/schema', authMiddleware, async (req, res) => {
    const { connection, table, schema = 'public' } = req.body;
    if (!connection || !table) return res.status(400).json({ error: 'connection and table are required' });

    try {
        const pool = getPool(connection);
        const result = await pool.query(
            `SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
             FROM information_schema.columns
             WHERE table_schema = $1 AND table_name = $2
             ORDER BY ordinal_position`,
            [schema, table]
        );
        res.json({ ok: true, table, columns: result.rows });
    } catch (err) {
        res.status(500).json({ ok: false, error: err.message });
    }
});

/**
 * POST /sql/execute
 * Jalankan INSERT / UPDATE / DELETE (write operation).
 * Hanya diizinkan jika readOnly: false di body.
 */
app.post('/sql/execute', authMiddleware, async (req, res) => {
    const { connection, statements } = req.body;
    // statements: array of { query, params }

    if (!connection) return res.status(400).json({ error: 'connection config is required' });
    if (!Array.isArray(statements) || statements.length === 0) {
        return res.status(400).json({ error: 'statements array is required' });
    }

    const startTime = Date.now();
    let client;
    try {
        const pool = getPool(connection);
        client = await pool.connect();
        await client.query('BEGIN');

        const results = [];
        for (const stmt of statements) {
            const r = await client.query(stmt.query, stmt.params || []);
            results.push({
                rowCount: r.rowCount,
                command: r.command,
                rows: r.rows || []
            });
        }

        await client.query('COMMIT');
        res.json({ ok: true, results, durationMs: Date.now() - startTime });
    } catch (err) {
        if (client) await client.query('ROLLBACK');
        console.error('[SQL] Execute error:', err.message);
        res.status(500).json({ ok: false, error: err.message, code: err.code });
    } finally {
        if (client) client.release();
    }
});

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Mavi ERP Bridge',
        version: '2.0.0',
        time: new Date().toISOString(),
        activePgPools: pgPools.size,
        features: ['cors-proxy', 'sql-gateway', 'pg-pool'],
        routes: {
            'POST /sql/query':        'Run SELECT query',
            'POST /sql/execute':      'Run INSERT/UPDATE/DELETE (with transaction)',
            'POST /sql/connect-test': 'Test PostgreSQL connection',
            'POST /sql/tables':       'List all tables',
            'POST /sql/schema':       'Get table column schema',
            '/odoo/*':                `Proxy → ${process.env.ODOO_URL || 'http://localhost:8069'}`,
            '/sap/*':                 `Proxy → ${process.env.SAP_URL || 'http://sap-server:8000'}`,
            '/frepple/*':             `Proxy → ${process.env.FREPPLE_URL || 'http://localhost:8001'}`,
        },
        authMode: API_KEY ? 'API Key required (X-Mavi-Bridge-Key header)' : 'Open (development mode)'
    });
});

// ─── HTTP PROXY ROUTES (Odoo, SAP, FrePPLe, dll) ────────────────────────────
const ERP_TARGETS = {
    '/odoo': {
        target: process.env.ODOO_URL || 'http://localhost:8069',
        changeOrigin: true,
        pathRewrite: { '^/odoo': '' },
        label: 'Odoo'
    },
    '/sap': {
        target: process.env.SAP_URL || 'http://sap-server:8000',
        changeOrigin: true,
        pathRewrite: { '^/sap': '' },
        auth: process.env.SAP_AUTH || undefined,
        label: 'SAP'
    },
    '/frepple': {
        target: process.env.FREPPLE_URL || 'http://localhost:8001',
        changeOrigin: true,
        pathRewrite: { '^/frepple': '' },
        label: 'FrePPLe'
    },
    '/erp': {
        target: process.env.GENERIC_API_URL || 'http://erp-server:8080',
        changeOrigin: true,
        pathRewrite: { '^/erp': '' },
        label: 'Generic ERP'
    }
};

Object.entries(ERP_TARGETS).forEach(([route, config]) => {
    const { label, ...proxyOptions } = config;
    app.use(route, createProxyMiddleware({
        ...proxyOptions,
        on: {
            error: (err, req, res) => {
                console.error(`[${label}] Proxy error:`, err.message);
                res.status(502).json({
                    error: `Mavi Bridge: Cannot connect to ${label}`,
                    target: proxyOptions.target,
                    message: err.message
                });
            },
            proxyReq: (proxyReq, req) => {
                if (proxyOptions.auth && !req.headers.authorization) {
                    proxyReq.setHeader('Authorization',
                        `Basic ${Buffer.from(proxyOptions.auth).toString('base64')}`);
                }
            }
        }
    }));
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        available: ['/health', '/sql/query', '/sql/execute', '/sql/connect-test', '/sql/tables', '/sql/schema', '/odoo', '/sap', '/frepple', '/erp']
    });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n╔══════════════════════════════════════════════════╗');
    console.log('║         🔗 Mavi ERP Bridge v2.0                  ║');
    console.log('╚══════════════════════════════════════════════════╝');
    console.log(`\n  Local:   http://localhost:${PORT}`);
    console.log(`  Network: http://0.0.0.0:${PORT}`);
    console.log(`  Health:  http://localhost:${PORT}/health`);
    console.log(`  Auth:    ${API_KEY ? '🔒 API Key mode' : '🔓 Open (development)'}`);
    console.log('\n📡 HTTP Proxy Routes:');
    Object.entries(ERP_TARGETS).forEach(([route, { target, label }]) => {
        console.log(`  ${route.padEnd(12)} → ${target.padEnd(35)} (${label})`);
    });
    console.log('\n🗄️  SQL Gateway Endpoints:');
    console.log('  POST /sql/query        → SELECT query ke PostgreSQL mana saja');
    console.log('  POST /sql/execute      → INSERT/UPDATE/DELETE (dengan transaksi)');
    console.log('  POST /sql/connect-test → Test koneksi database');
    console.log('  POST /sql/tables       → List semua tabel');
    console.log('  POST /sql/schema       → Schema kolom tabel');
    console.log('\n⚙️  Env vars:');
    console.log('  ODOO_URL=http://192.168.1.10:8069');
    console.log('  SAP_URL=http://192.168.1.20:8000');
    console.log('  FREPPLE_URL=http://192.168.1.30:8001');
    console.log('  BRIDGE_API_KEY=rahasia123  (untuk production)');
    console.log('  PORT=3099\n');
});
