/**
 * securityService.js
 * =====================================================
 * SCADA Security Service - RBAC, Audit Trail, Session
 * Management, and Security Policy Enforcement.
 * =====================================================
 */

import Dexie from 'dexie';

const DB_NAME = 'MaviSCADASecurity';
const DB_VERSION = 1;

const db = new Dexie(DB_NAME);
db.version(DB_VERSION).stores({
    users: '++id, username, role, status',
    sessions: '++id, userId, token, [token], expiresAt',
    auditLogs: '++id, userId, action, resource, timestamp, [userId+timestamp], [action+timestamp]',
    permissions: '++id, role, resource, action, [role+resource]'
});

const SCADA_PERMISSIONS = {
    ACCOUNT_OWNER: [
        'system:configure', 'system:admin', 'users:manage', 'users:view',
        'alarms:manage', 'alarms:acknowledge', 'alarms:shelve', 'alarms:view',
        'historian:view', 'historian:export', 'historian:manage',
        'plc:read', 'plc:write', 'plc:configure',
        'machine:read', 'machine:write', 'machine:control',
        'station:read', 'station:write', 'station:control',
        'production:read', 'production:write', 'production:control',
        'quality:read', 'quality:write', 'quality:approve',
        'reports:view', 'reports:generate', 'reports:export',
        'connector:manage', 'connector:view',
        'vision:manage', 'vision:view',
        'iot:manage', 'iot:view'
    ],
    ADMINISTRATOR: [
        'users:manage', 'users:view',
        'alarms:manage', 'alarms:acknowledge', 'alarms:shelve', 'alarms:view',
        'historian:view', 'historian:export',
        'plc:read', 'plc:write',
        'machine:read', 'machine:write', 'machine:control',
        'station:read', 'station:write',
        'production:read', 'production:write',
        'quality:read', 'quality:write',
        'reports:view', 'reports:generate', 'reports:export',
        'connector:manage', 'connector:view',
        'vision:manage', 'vision:view',
        'iot:manage', 'iot:view'
    ],
    SUPERVISOR: [
        'alarms:acknowledge', 'alarms:shelve', 'alarms:view',
        'historian:view', 'historian:export',
        'plc:read',
        'machine:read', 'machine:control',
        'station:read', 'station:control',
        'production:read', 'production:write',
        'quality:read', 'quality:write',
        'reports:view', 'reports:generate'
    ],
    ENGINEER: [
        'alarms:view',
        'historian:view',
        'plc:read', 'plc:write',
        'machine:read', 'machine:write',
        'station:read',
        'production:read',
        'quality:read',
        'reports:view'
    ],
    OPERATOR: [
        'alarms:acknowledge', 'alarms:view',
        'machine:read', 'machine:control',
        'station:read', 'station:control',
        'production:read', 'production:write'
    ],
    VIEWER: [
        'historian:view',
        'machine:read',
        'station:read',
        'production:read',
        'quality:read',
        'reports:view'
    ]
};

const ROLE_HIERARCHY = {
    ACCOUNT_OWNER: ['ADMINISTRATOR', 'SUPERVISOR', 'ENGINEER', 'OPERATOR', 'VIEWER'],
    ADMINISTRATOR: ['SUPERVISOR', 'ENGINEER', 'OPERATOR', 'VIEWER'],
    SUPERVISOR: ['ENGINEER', 'OPERATOR', 'VIEWER'],
    ENGINEER: ['VIEWER'],
    OPERATOR: [],
    VIEWER: []
};

class SecurityService {
    constructor() {
        this._currentUser = null;
        this._sessionTimer = null;
        this._listeners = new Map();
        this._initialized = false;
        this._sessionTimeout = 30 * 60 * 1000;
        this._maxFailedLogins = 5;
        this._lockoutDuration = 15 * 60 * 1000;
    }

    async initialize() {
        if (this._initialized) return;
        try {
            await db.open();
            this._initialized = true;
            await this._restoreSession();
        } catch (err) {
            console.error('[Security] Init failed:', err);
        }
    }

    async shutdown() {
        if (this._sessionTimer) clearTimeout(this._sessionTimer);
        await db.close();
        this._initialized = false;
    }

    async login(username, password, options = {}) {
        if (!this._initialized) await this.initialize();

        const user = await db.users.where('username').equals(username).first();
        if (!user) {
            await this._logAudit(null, 'LOGIN_FAILED', 'auth', { username, reason: 'user_not_found' });
            return { success: false, error: 'Invalid credentials' };
        }

        if (user.status === 'LOCKED') {
            if (user.lockedUntil && user.lockedUntil > Date.now()) {
                const remaining = Math.ceil((user.lockedUntil - Date.now()) / 60000);
                return { success: false, error: `Account locked. Try again in ${remaining} minutes.` };
            }
            await db.users.update(user.id, { status: 'ACTIVE', failedLogins: 0, lockedUntil: null });
        }

        if (user.password !== password) {
            const failedLogins = (user.failedLogins || 0) + 1;
            if (failedLogins >= this._maxFailedLogins) {
                await db.users.update(user.id, {
                    status: 'LOCKED',
                    failedLogins,
                    lockedUntil: Date.now() + this._lockoutDuration
                });
                await this._logAudit(user.id, 'ACCOUNT_LOCKED', 'auth', { username, failedLogins });
            } else {
                await db.users.update(user.id, { failedLogins });
            }
            await this._logAudit(user.id, 'LOGIN_FAILED', 'auth', { username, reason: 'wrong_password', failedLogins });
            return { success: false, error: 'Invalid credentials' };
        }

        await db.users.update(user.id, { failedLogins: 0, lockedUntil: null, lastLogin: Date.now() });

        const token = this._generateToken();
        const session = {
            userId: user.id,
            token,
            ipAddress: options.ipAddress || 'local',
            userAgent: navigator.userAgent,
            createdAt: Date.now(),
            expiresAt: Date.now() + this._sessionTimeout
        };
        await db.sessions.add(session);

        const permissions = this._getPermissionsForRole(user.role);
        this._currentUser = { ...user, token, permissions };
        delete this._currentUser.password;

        this._startSessionTimer();
        await this._logAudit(user.id, 'LOGIN_SUCCESS', 'auth', { username });
        this._notifyListeners('login', this._currentUser);

        return { success: true, user: this._currentUser };
    }

    async logout() {
        if (!this._currentUser) return;
        const userId = this._currentUser.id;
        await this._logAudit(userId, 'LOGOUT', 'auth', {});
        if (this._sessionTimer) clearTimeout(this._sessionTimer);
        await db.sessions.where('token').equals(this._currentUser.token).delete();
        this._currentUser = null;
        this._notifyListeners('logout', null);
    }

    async _restoreSession() {
        const raw = localStorage.getItem('mavi_mes_auth_session');
        if (!raw) return;
        try {
            const session = JSON.parse(raw);
            if (session && session.token) {
                const dbSession = await db.sessions.where('token').equals(session.token).first();
                if (dbSession && dbSession.expiresAt > Date.now()) {
                    const user = await db.users.get(dbSession.userId);
                    if (user) {
                        const permissions = this._getPermissionsForRole(user.role);
                        this._currentUser = { ...user, token: session.token, permissions };
                        delete this._currentUser.password;
                        this._startSessionTimer();
                    }
                }
            }
        } catch { /* silent */ }
    }

    _startSessionTimer() {
        if (this._sessionTimer) clearTimeout(this._sessionTimer);
        this._sessionTimer = setTimeout(async () => {
            await this.logout();
            this._notifyListeners('sessionExpired', null);
        }, this._sessionTimeout);
    }

    hasPermission(permission) {
        if (!this._currentUser) return false;
        if (this._currentUser.role === 'ACCOUNT_OWNER') return true;
        return this._currentUser.permissions?.includes(permission) || false;
    }

    requirePermission(permission) {
        if (!this.hasPermission(permission)) {
            throw new Error(`Permission denied: ${permission} required`);
        }
        return true;
    }

    canAccessResource(resource, action) {
        if (!this._currentUser) return false;
        const perm = `${resource}:${action}`;
        return this.hasPermission(perm);
    }

    _getPermissionsForRole(role) {
        const normalizedRole = role?.toUpperCase();
        if (SCADA_PERMISSIONS[normalizedRole]) {
            return SCADA_PERMISSIONS[normalizedRole];
        }
        const parentRoles = ROLE_HIERARCHY[normalizedRole] || [];
        const perms = new Set();
        for (const parent of parentRoles) {
            (SCADA_PERMISSIONS[parent] || []).forEach(p => perms.add(p));
        }
        return Array.from(perms);
    }

    async _logAudit(userId, action, resource, details = {}) {
        const log = {
            userId: userId || 'system',
            action,
            resource,
            details,
            timestamp: Date.now(),
            ipAddress: 'local',
            sessionId: this._currentUser?.token?.substring(0, 8) || 'system'
        };
        try {
            await db.auditLogs.add(log);
        } catch (err) {
            console.error('[Security] Audit log failed:', err);
        }
        this._notifyListeners('audit', log);
    }

    async getAuditLogs(options = {}) {
        let logs = await db.auditLogs.toArray();
        if (options.userId) logs = logs.filter(l => l.userId === options.userId);
        if (options.action) logs = logs.filter(l => l.action === options.action);
        if (options.resource) logs = logs.filter(l => l.resource === options.resource);
        if (options.startTime) logs = logs.filter(l => l.timestamp >= options.startTime);
        if (options.endTime) logs = logs.filter(l => l.timestamp <= options.endTime);
        if (options.limit) logs = logs.slice(-options.limit);
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }

    async getSessionInfo() {
        if (!this._currentUser) return null;
        return {
            user: this._currentUser,
            permissions: this._currentUser.permissions,
            sessionExpiresAt: this._currentUser.token ?
                (await db.sessions.where('token').equals(this._currentUser.token).first())?.expiresAt : null
        };
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
    }

    _generateToken() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    async getUsers() {
        return db.users.toArray().then(users =>
            users.map(u => {
                const { password, ...safe } = u;
                return safe;
            })
        );
    }

    async createUser(userData) {
        const existing = await db.users.where('username').equals(userData.username).first();
        if (existing) throw new Error('Username already exists');
        const user = {
            username: userData.username,
            password: userData.password,
            name: userData.name || userData.username,
            role: userData.role || 'VIEWER',
            status: 'ACTIVE',
            assignedStation: userData.assignedStation || 'ALL',
            failedLogins: 0,
            createdAt: Date.now()
        };
        const id = await db.users.add(user);
        return { ...user, id, permissions: this._getPermissionsForRole(user.role) };
    }

    async updateUser(userId, updates) {
        if (updates.password) {
            await db.users.update(userId, updates);
        } else {
            const { password, ...safeUpdates } = updates;
            await db.users.update(userId, safeUpdates);
        }
        return true;
    }

    async deleteUser(userId) {
        const user = await db.users.get(userId);
        if (!user) return false;
        if (user.username === 'admin') throw new Error('Cannot delete system administrator');
        await db.users.delete(userId);
        return true;
    }
}

const securityService = new SecurityService();
export default securityService;
export { SecurityService, SCADA_PERMISSIONS, ROLE_HIERARCHY, db as securityDb };
