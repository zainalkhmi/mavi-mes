/**
 * Automation Connectors Index
 * Export all connector modules for easy importing
 */

// Telegram Connector
export { telegramConnector, default as telegram } from './telegram';
export * from './telegram';

// Slack Connector
export { slackConnector, default as slack } from './slack';
export * from './slack';

// Google Sheets Connector
export { googleSheetsConnector, default as googleSheets } from './googleSheets';
export * from './googleSheets';

// Email Connector
export { emailConnector, default as email } from './email';
export * from './email';

// =====================================================
// CONNECTOR REGISTRY
// =====================================================

/**
 * Registry of all available connectors
 * Used by automation engine to resolve connector by type
 */
export const CONNECTOR_REGISTRY = {
    telegram: {
        name: 'Telegram',
        description: 'Send messages via Telegram Bot API',
        icon: '📱',
        color: '#0088cc',
        actions: ['sendMessage', 'sendPhoto', 'sendDocument', 'sendWithKeyboard', 'getMe']
    },
    slack: {
        name: 'Slack',
        description: 'Send messages via Slack Webhook or API',
        icon: '💬',
        color: '#4A154B',
        actions: ['sendWebhook', 'sendMessage', 'uploadFile', 'scheduleMessage', 'getUserInfo']
    },
    google_sheets: {
        name: 'Google Sheets',
        description: 'Read and write data to Google Sheets',
        icon: '📊',
        color: '#0F9D58',
        actions: ['readRange', 'updateRange', 'appendRow', 'batchUpdate', 'clearRange']
    },
    email: {
        name: 'Email',
        description: 'Send emails via SMTP or email APIs',
        icon: '📧',
        color: '#EA4335',
        actions: ['send', 'sendWithTemplate', 'sendGrid', 'mailgun', 'brevo']
    },
    webhook: {
        name: 'Webhook',
        description: 'Send HTTP requests to any endpoint',
        icon: '🔗',
        color: '#6366F1',
        actions: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
    },
    http: {
        name: 'HTTP Request',
        description: 'Make HTTP/HTTPS requests',
        icon: '🌐',
        color: '#6366F1',
        actions: ['request']
    },
    database: {
        name: 'Database',
        description: 'Query and update database records',
        icon: '🗄️',
        color: '#336791',
        actions: ['query', 'insert', 'update', 'delete']
    }
};

/**
 * Get connector by type
 * @param {string} type
 * @returns {Object|null}
 */
export function getConnector(type) {
    return CONNECTOR_REGISTRY[type] || null;
}

/**
 * Get all connector types
 * @returns {Array}
 */
export function getConnectorTypes() {
    return Object.keys(CONNECTOR_REGISTRY);
}

/**
 * Default export - all connectors
 */
export default {
    telegram: telegramConnector,
    slack: slackConnector,
    googleSheets: googleSheetsConnector,
    email: emailConnector,
    CONNECTOR_REGISTRY,
    getConnector,
    getConnectorTypes
};
