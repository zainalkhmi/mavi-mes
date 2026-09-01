/**
 * Slack Connector
 * Send messages via Slack Webhook or Slack API
 *
 * Usage:
 * import { slackConnector } from './connectors/slack';
 * await slackConnector.sendMessage({ webhookUrl, text: 'Hello!' });
 * await slackConnector.sendBlockKit({ token, channel, blocks });
 */

import { getCredentialById, updateCredentialLastUsed } from '../automationDB';

// =====================================================
// SLACK WEBHOOK
// =====================================================

/**
 * Send message via Slack Incoming Webhook
 * @param {Object} config - { webhookUrl, text, blocks, attachments }
 * @returns {Promise<Object>}
 */
export async function sendWebhook(config) {
    const { webhookUrl, text, blocks, attachments } = config;

    if (!webhookUrl) {
        throw new Error('Missing required param: webhookUrl');
    }

    const payload = {};

    if (text) {
        payload.text = text;
    }

    if (blocks) {
        payload.blocks = typeof blocks === 'string' ? JSON.parse(blocks) : blocks;
    }

    if (attachments) {
        payload.attachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
    }

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error(`Slack Webhook Error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
}

// =====================================================
// SLACK API (with Bot Token)
// =====================================================

/**
 * Send message via Slack API with Bot Token
 * @param {Object} config - { token, channel, text, blocks, attachments }
 * @returns {Promise<Object>}
 */
export async function sendMessage(config) {
    const { token, channel, text, blocks, attachments, threadTs } = config;

    if (!token || !channel) {
        throw new Error('Missing required params: token, channel');
    }

    const payload = {
        channel,
        text: text || ' '
    };

    if (blocks) {
        payload.blocks = typeof blocks === 'string' ? JSON.parse(blocks) : blocks;
    }

    if (attachments) {
        payload.attachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
    }

    if (threadTs) {
        payload.thread_ts = threadTs;
    }

    const response = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data;
}

/**
 * Upload file to Slack
 * @param {Object} config - { token, channel, file, filename, title, initialComment }
 * @returns {Promise<Object>}
 */
export async function uploadFile(config) {
    const { token, channel, file, filename, title, initialComment } = config;

    if (!token || !channel || !file) {
        throw new Error('Missing required params: token, channel, file');
    }

    const formData = new FormData();
    formData.append('channels', channel);
    formData.append('file', file, filename);

    if (title) formData.append('title', title);
    if (initialComment) formData.append('initial_comment', initialComment);

    const response = await fetch('https://slack.com/api/files.upload', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data;
}

/**
 * Get user info
 * @param {string} token
 * @param {string} userId
 * @returns {Promise<Object>}
 */
export async function getUserInfo(token, userId) {
    const response = await fetch(
        `https://slack.com/api/users.info?user=${userId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data.user;
}

/**
 * Get channel info
 * @param {string} token
 * @param {string} channelId
 * @returns {Promise<Object>}
 */
export async function getChannelInfo(token, channelId) {
    const response = await fetch(
        `https://slack.com/api/conversations.info?channel=${channelId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data.channel;
}

/**
 * Schedule a message
 * @param {Object} config - { token, channel, text, postAt (Unix timestamp) }
 * @returns {Promise<Object>}
 */
export async function scheduleMessage(config) {
    const { token, channel, text, postAt, blocks } = config;

    if (!token || !channel || !postAt) {
        throw new Error('Missing required params: token, channel, postAt');
    }

    const payload = {
        channel,
        text,
        post_at: postAt
    };

    if (blocks) {
        payload.blocks = typeof blocks === 'string' ? JSON.parse(blocks) : blocks;
    }

    const response = await fetch('https://slack.com/api/chat.scheduleMessage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data;
}

/**
 * Open a dialog
 * @param {Object} config - { token, triggerId, dialog }
 * @returns {Promise<Object>}
 */
export async function openDialog(config) {
    const { token, triggerId, dialog } = config;

    const response = await fetch('https://slack.com/api/dialog.open', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            trigger_id: triggerId,
            dialog
        })
    });

    const data = await response.json();

    if (!data.ok) {
        throw new Error(`Slack API Error: ${data.error}`);
    }

    return data;
}

// =====================================================
// BLOCK KIT HELPERS
// =====================================================

/**
 * Create a section block
 */
export function section(text, options = {}) {
    const block = {
        type: 'section',
        text: {
            type: options.type || 'mrkdwn',
            text
        }
    };

    if (options.accessory) {
        block.accessory = options.accessory;
    }

    return block;
}

/**
 * Create a divider block
 */
export function divider() {
    return { type: 'divider' };
}

/**
 * Create an image block
 */
export function image(url, altText, title = '') {
    const block = {
        type: 'image',
        image_url: url,
        alt_text: altText
    };

    if (title) {
        block.title = { type: 'plain_text', text: title };
    }

    return block;
}

/**
 * Create a context block
 */
export function context(elements) {
    return {
        type: 'context',
        elements: elements.map(el => {
            if (typeof el === 'string') {
                return { type: 'mrkdwn', text: el };
            }
            return el;
        })
    };
}

/**
 * Create actions block
 */
export function actions(elements) {
    return {
        type: 'actions',
        elements
    };
}

/**
 * Create a button element
 */
export function button(text, actionId, options = {}) {
    return {
        type: 'button',
        text: { type: 'plain_text', text },
        action_id: actionId,
        style: options.style,
        url: options.url,
        value: options.value
    };
}

/**
 * Create header block
 */
export function header(text) {
    return {
        type: 'header',
        text: { type: 'plain_text', text }
    };
}

/**
 * Create a complete Block Kit message
 */
export function createMessage(options = {}) {
    const blocks = [];

    if (options.header) {
        blocks.push(header(options.header));
    }

    if (options.sections) {
        options.sections.forEach(s => {
            blocks.push(section(s.text, s.options));
        });
    }

    if (options.divider !== false) {
        blocks.push(divider());
    }

    if (options.context) {
        blocks.push(context(options.context));
    }

    if (options.actions) {
        blocks.push(actions(options.actions));
    }

    return {
        text: options.text || options.header || '',
        blocks
    };
}

// =====================================================
// NODE EXECUTION FUNCTION
// =====================================================

/**
 * Execute Slack node in automation
 * @param {Object} nodeData - Node configuration from automation
 * @param {Object} context - Execution context (variables, credentials)
 * @returns {Promise<Object>}
 */
export async function execute(nodeData, context = {}) {
    const { action, config, credentialId } = nodeData;
    const variables = context.variables || {};

    // Get credential if specified
    let webhookUrl = config?.webhookUrl;
    let token = config?.token;

    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential) {
            webhookUrl = credential.encrypted_config?.webhookUrl || credential.encrypted_config?.url;
            token = credential.encrypted_config?.token || credential.encrypted_config?.botToken;
            await updateCredentialLastUsed(credentialId);
        }
    }

    // Variable interpolation
    webhookUrl = interpolate(webhookUrl, variables);
    token = interpolate(token, variables);
    const channel = interpolate(config?.channel, variables);
    const text = interpolate(config?.text || config?.message, variables);

    switch (action) {
        case 'sendWebhook':
            return sendWebhook({ webhookUrl, text, blocks: config?.blocks });

        case 'sendMessage':
            return sendMessage({ token, channel, text, blocks: config?.blocks });

        case 'uploadFile':
            return uploadFile({
                token,
                channel,
                file: interpolate(config?.file, variables),
                filename: config?.filename,
                title: interpolate(config?.title, variables)
            });

        case 'scheduleMessage':
            return scheduleMessage({
                token,
                channel,
                text,
                postAt: parseInt(config?.postAt) || Date.now() / 1000 + 3600
            });

        case 'getUserInfo':
            return getUserInfo(token, interpolate(config?.userId, variables));

        case 'getChannelInfo':
            return getChannelInfo(token, channel);

        default:
            throw new Error(`Unknown Slack action: ${action}`);
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Simple variable interpolation
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
 * Format Slack message with template
 */
export function formatMessage(template, data = {}) {
    if (!template) return '';

    const lines = template.split('\n');
    const formatted = lines.map(line => interpolate(line, data));

    return formatted.join('\n');
}

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
    sendWebhook,
    sendMessage,
    uploadFile,
    scheduleMessage,
    getUserInfo,
    getChannelInfo,
    openDialog,
    execute,
    formatMessage,
    createMessage,
    // Block Kit helpers
    section,
    divider,
    image,
    context,
    actions,
    button,
    header
};

export const slackConnector = {
    sendWebhook,
    sendMessage,
    uploadFile,
    scheduleMessage,
    getUserInfo,
    getChannelInfo,
    execute,
    formatMessage,
    createMessage
};
