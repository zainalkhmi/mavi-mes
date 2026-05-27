/**
 * auth.js
 * =====================================================
 * Frontend Authentication Utility for MAVI-MES
 * Uses localStorage for session management and user DB.
 * =====================================================
 */

const AUTH_KEY = 'mavi_mes_auth_session';
const USERS_STORAGE_KEY = 'mavi_mes_users_list';

const ROLE_MAP = {
    'ADMIN': 'ADMINISTRATOR',
    'ENGINEER': 'APPLICATION_ENGINEER',
    'OPERATOR': 'STATION_OPERATOR'
};

// Preconfigured factory users (fallback if DB is empty)
const DEFAULT_USERS = [
    { id: 'usr-owner', username: 'owner', password: '123', name: 'Account Owner', role: 'ACCOUNT_OWNER', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-admin', username: 'admin', password: '123', name: 'System Admin', role: 'ADMINISTRATOR', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-conn-sup', username: 'conn_supervisor', password: '123', name: 'Connector Supervisor', role: 'CONNECTOR_SUPERVISOR', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-station-sup', username: 'station_supervisor', password: '123', name: 'Station Supervisor', role: 'STATION_SUPERVISOR', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-tables-sup', username: 'tables_supervisor', password: '123', name: 'Tables Supervisor', role: 'TABLES_SUPERVISOR', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-eng', username: 'engineer', password: '123', name: 'Manufacturing Engineer', role: 'APPLICATION_ENGINEER', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-viewer', username: 'viewer', password: '123', name: 'Quality Viewer', role: 'VIEWER', assignedStation: 'ALL', assignedApp: 'ALL' },
    { id: 'usr-operator', username: 'operator', password: '123', name: 'Station Operator', role: 'STATION_OPERATOR', assignedStation: 'NONE', assignedApp: 'NONE' }
];

/**
 * Ensures that the internal localStorage DB for users is populated.
 * @returns {Array} List of all registered users
 */
export function getAllUsers() {
    try {
        const rawUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (rawUsers) {
            const parsed = JSON.parse(rawUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
                // Backward-compatibility role mapping
                let updated = false;
                const mappedUsers = parsed.map(u => {
                    const mappedRole = ROLE_MAP[u.role?.toUpperCase()];
                    if (mappedRole) {
                        updated = true;
                        return { ...u, role: mappedRole };
                    }
                    return u;
                });
                if (updated) {
                    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(mappedUsers));
                }
                return mappedUsers;
            }
        }
    } catch (err) {
        console.error('Failed to read users DB from localStorage', err);
    }
    
    // Fallback: Initialize and return defaults
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
}

/**
 * Creates or updates a user in the localStorage DB.
 * @param {object} user - The user object to save
 * @returns {boolean} Success state
 */
export function saveUser(user) {
    if (!user || !user.username) return false;
    
    try {
        const users = getAllUsers();
        const existingIndex = users.findIndex(u => u.id === user.id);
        
        let targetUser = { ...user };
        // Ensure new users get an ID
        if (!targetUser.id) {
            targetUser.id = 'usr-' + Date.now();
        }

        if (existingIndex >= 0) {
            // Update existing
            users[existingIndex] = targetUser;
        } else {
            // Anti-duplicate username check
            const usernameExists = users.some(u => u.username.toLowerCase() === targetUser.username.toLowerCase());
            if (usernameExists) throw new Error('Username already exists');
            // Add new
            users.push(targetUser);
        }

        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        return targetUser;
    } catch (err) {
        console.error('Failed to save user', err);
        throw err;
    }
}

/**
 * Deletes a user from the localStorage DB. 
 * Prevents deletion of the core 'admin' user.
 * @param {string} userId
 */
export function deleteUser(userId) {
    const users = getAllUsers();
    
    // Safety check
    const userToDelete = users.find(u => u.id === userId);
    if (!userToDelete) return false;
    if (userToDelete.username === 'admin') {
        throw new Error('Default system administrator cannot be deleted');
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
    return true;
}

/**
 * Attempts to login with a username and password.
 * @param {string} username 
 * @param {string} password 
 * @returns {object|null} The user object if successful, null otherwise.
 */
export function login(username, password) {
    const users = getAllUsers();
    const user = users.find(u => 
        u.username.toLowerCase() === username.toLowerCase() && 
        u.password === password
    );

    if (user) {
        // Strip out the password before saving to local storage active session
        const { password, ...safeUser } = user;
        localStorage.setItem(AUTH_KEY, JSON.stringify(safeUser));
        return safeUser;
    }

    return null;
}

/**
 * Retrieves the currently logged in user session.
 * @returns {object|null}
 */
export function getCurrentUser() {
    try {
        const session = localStorage.getItem(AUTH_KEY);
        if (session) {
            const user = JSON.parse(session);
            if (user && user.role) {
                const mappedRole = ROLE_MAP[user.role.toUpperCase()];
                if (mappedRole) {
                    user.role = mappedRole;
                }
            }
            return user;
        }
    } catch (err) {
        console.error('Failed to read auth session', err);
    }
    return null;
}

/**
 * Logs out the current user by clearing the session.
 */
export function logout() {
    localStorage.removeItem(AUTH_KEY);
}

/**
 * Checks if the user has higher level privileges (Builder access).
 * @param {object} user 
 * @returns {boolean}
 */
export function isPrivileged(user) {
    if (!user) return false;
    const privilegedRoles = [
        'ACCOUNT_OWNER',
        'ADMINISTRATOR',
        'CONNECTOR_SUPERVISOR',
        'STATION_SUPERVISOR',
        'TABLES_SUPERVISOR',
        'APPLICATION_ENGINEER',
        'ADMIN', // Legacy support
        'ENGINEER' // Legacy support
    ];
    return privilegedRoles.includes(user.role?.toUpperCase());
}
