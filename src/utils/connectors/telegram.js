/**
 * Telegram Connector
 * Send messages via Telegram Bot API
 *
 * Usage:
 * import { telegramConnector } from './connectors/telegram';
 * await telegramConnector.sendMessage({ chatId: '123456', text: 'Hello!' });
 */

import { getCredentialById, updateCredentialLastUsed } from '../automationDB';

// =====================================================
// TELEGRAM API ENDPOINTS
// =====================================================
const API_BASE = 'https://api.telegram.org';

/**
 * Send text message via Telegram Bot
 * @param {Object} config - { botToken, chatId, text, parseMode, replyMarkup }
 * @returns {Promise<Object>}
 */
export async function sendMessage(config) {
    const { botToken, chatId, text, parseMode = 'Markdown', replyMarkup = null } = config;

    if (!botToken || !chatId || !text) {
        throw new Error('Missing required params: botToken, chatId, text');
    }

    const url = `${API_BASE}/bot${botToken}/sendMessage`;

    const body = {
        chat_id: chatId,
        text: text,
        parse_mode: parseMode
    };

    if (replyMarkup) {
        body.reply_markup = replyMarkup;
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description} (code: ${data.error_code})`);
    }

    return data.result;
}

/**
 * Send photo via Telegram Bot
 * @param {Object} config - { botToken, chatId, photo, caption, parseMode }
 * @returns {Promise<Object>}
 */
export async function sendPhoto(config) {
    const { botToken, chatId, photo, caption = '', parseMode = 'Markdown' } = config;

    if (!botToken || !chatId || !photo) {
        throw new Error('Missing required params: botToken, chatId, photo');
    }

    const url = `${API_BASE}/bot${botToken}/sendPhoto`;

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('photo', photo);
    if (caption) {
        formData.append('caption', caption);
        formData.append('parse_mode', parseMode);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data.result;
}

/**
 * Send document via Telegram Bot
 * @param {Object} config - { botToken, chatId, document, filename, caption }
 * @returns {Promise<Object>}
 */
export async function sendDocument(config) {
    const { botToken, chatId, document, filename = 'document', caption = '' } = config;

    const url = `${API_BASE}/bot${botToken}/sendDocument`;

    const formData = new FormData();
    formData.append('chat_id', chatId);

    if (typeof document === 'string') {
        // URL
        formData.append('document', document);
    } else if (document instanceof Blob) {
        // Blob/File
        formData.append('document', document, filename);
    }

    if (caption) {
        formData.append('caption', caption);
    }

    const response = await fetch(url, {
        method: 'POST',
        body: formData
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data.result;
}

/**
 * Send inline keyboard buttons
 * @param {Object} config - { botToken, chatId, text, buttons }
 * @returns {Promise<Object>}
 *
 * buttons format: [[{ text: 'Button 1', url: 'https://...' }], [{ text: 'Button 2', callback_data: 'action' }]]
 */
export async function sendWithKeyboard(config) {
    const { botToken, chatId, text, buttons } = config;

    const inlineKeyboard = buttons.map(row =>
        row.map(btn => {
            if (btn.url) return { text: btn.text, url: btn.url };
            if (btn.callback_data) return { text: btn.text, callback_data: btn.callback_data };
            return { text: btn.text };
        })
    );

    return sendMessage({
        botToken,
        chatId,
        text,
        replyMarkup: { inline_keyboard: inlineKeyboard }
    });
}

/**
 * Get bot info
 * @param {string} botToken
 * @returns {Promise<Object>}
 */
export async function getMe(botToken) {
    const response = await fetch(`${API_BASE}/bot${botToken}/getMe`);
    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data.result;
}

/**
 * Get updates (for webhook setup)
 * @param {string} botToken
 * @param {number} offset
 * @returns {Promise<Array>}
 */
export async function getUpdates(botToken, offset = 0) {
    const response = await fetch(`${API_BASE}/bot${botToken}/getUpdates?offset=${offset}&timeout=60`);
    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data.result;
}

/**
 * Set webhook
 * @param {string} botToken
 * @param {string} webhookUrl
 * @returns {Promise<Object>}
 */
export async function setWebhook(botToken, webhookUrl) {
    const response = await fetch(`${API_BASE}/bot${botToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
    });
    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Telegram API Error: ${data.description}`);
    }

    return data.result;
}

// =====================================================
// NODE EXECUTION FUNCTION
// =====================================================

/**
 * Execute Telegram node in automation
 * @param {Object} nodeData - Node configuration from automation
 * @param {Object} context - Execution context (variables, credentials)
 * @returns {Promise<Object>}
 */
export async function execute(nodeData, context = {}) {
    const { action, config, credentialId } = nodeData;
    const variables = context.variables || {};

    // Get credential if specified
    let botToken = config?.botToken;
    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential) {
            botToken = credential.encrypted_config?.botToken || credential.encrypted_config?.token;
            await updateCredentialLastUsed(credentialId);
        }
    }

    // Support variable interpolation
    botToken = interpolate(botToken, variables);
    const chatId = interpolate(config?.chatId, variables);
    const text = interpolate(config?.text || config?.message, variables);

    switch (action) {
        case 'sendMessage':
            return sendMessage({ botToken, chatId, text, parseMode: config?.parseMode });

        case 'sendPhoto':
            return sendPhoto({
                botToken,
                chatId,
                photo: interpolate(config?.photo, variables),
                caption: interpolate(config?.caption, variables),
                parseMode: config?.parseMode
            });

        case 'sendDocument':
            return sendDocument({
                botToken,
                chatId,
                document: interpolate(config?.document, variables),
                filename: config?.filename,
                caption: interpolate(config?.caption, variables)
            });

        case 'sendWithKeyboard':
            return sendWithKeyboard({
                botToken,
                chatId,
                text,
                buttons: config?.buttons
            });

        case 'getMe':
            return getMe(botToken);

        default:
            throw new Error(`Unknown Telegram action: ${action}`);
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Simple variable interpolation
 * Supports: {{variable}} syntax
 */
function interpolate(str, variables = {}) {
    if (!str || typeof str !== 'string') return str;

    return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
        const keys = path.trim().split('.');
        let value = variables;
        for (const key of keys) {
            value = value?.[key];
        }
        return value ?? match;
    });
}

/**
 * Format message with template
 * @param {string} template
 * @param {Object} data
 * @returns {string}
 */
export function formatMessage(template, data = {}) {
    if (!template) return '';

    const lines = template.split('\n');
    const formatted = lines.map(line => interpolate(line, data));

    return formatted.join('\n');
}

/**
 * Create Telegram message from template
 * @param {Object} template - { header, body, footer, items }
 * @param {Object} data
 * @returns {string}
 */
export function createMessageFromTemplate(template, data = {}) {
    const parts = [];

    if (template.header) {
        parts.push(`*${interpolate(template.header, data)}*`);
    }

    if (template.body) {
        parts.push(interpolate(template.body, data));
    }

    if (template.items) {
        const items = Array.isArray(template.items) ? template.items : Object.entries(template.items);
        const itemsText = items.map(([key, value]) => {
            const label = typeof key === 'string' ? key : value;
            const val = typeof value === 'function' ? value(data) : interpolate(value, data);
            return `• *${label}*: ${val}`;
        }).join('\n');
        parts.push(itemsText);
    }

    if (template.footer) {
        parts.push(`_${interpolate(template.footer, data)}_`);
    }

    return parts.join('\n\n');
}

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
    sendMessage,
    sendPhoto,
    sendDocument,
    sendWithKeyboard,
    getMe,
    getUpdates,
    setWebhook,
    execute,
    formatMessage,
    createMessageFromTemplate
};

// Named exports for direct import
export const telegramConnector = {
    sendMessage,
    sendPhoto,
    sendDocument,
    sendWithKeyboard,
    getMe,
    execute,
    formatMessage,
    createMessageFromTemplate
};
