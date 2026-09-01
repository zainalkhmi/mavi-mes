/**
 * Email SMTP Connector
 * Send emails via SMTP
 *
 * Usage:
 * import { emailConnector } from './connectors/email';
 * await emailConnector.send({
 *   host: 'smtp.gmail.com',
 *   port: 587,
 *   secure: false,
 *   auth: { user: 'xxx', pass: 'xxx' },
 *   from: 'sender@example.com',
 *   to: ['recipient@example.com'],
 *   subject: 'Hello',
 *   text: 'Plain text body',
 *   html: '<p>HTML body</p>'
 * });
 */

import { getCredentialById, updateCredentialLastUsed } from '../automationDB';

// =====================================================
// EMAIL TEMPLATE
// =====================================================

/**
 * Send email via SMTP (using direct fetch to SMTP relay or API)
 *
 * For browser-side sending, we use:
 * 1. SMTP.js (CDN) - classic approach
 * 2. Direct to backend relay (recommended)
 * 3. Third-party email APIs (SendGrid, Mailgun, etc.)
 */

/**
 * Send email using SMTP.js (browser-compatible)
 * @param {Object} config
 * @returns {Promise<Object>}
 */
export async function sendWithSMTPJS(config) {
    const { smtpConfig, emailData } = config;

    if (!smtpConfig || !emailData) {
        throw new Error('Missing required params: smtpConfig, emailData');
    }

    // Dynamic import SMTP.js if available
    if (typeof window !== 'undefined' && !window.Email) {
        await loadSMTPJS();
    }

    return new Promise((resolve, reject) => {
        try {
            window.Email.send({
                Host: smtpConfig.host,
                Port: smtpConfig.port || 587,
                SecureToken: smtpConfig.secureToken,
                Username: smtpConfig.username,
                Password: smtpConfig.password,
                From: emailData.from,
                To: Array.isArray(emailData.to) ? emailData.to.join(',') : emailData.to,
                Cc: emailData.cc ? (Array.isArray(emailData.cc) ? emailData.cc.join(',') : emailData.cc) : null,
                Bcc: emailData.bcc ? (Array.isArray(emailData.bcc) ? emailData.bcc.join(',') : emailData.bcc) : null,
                Subject: emailData.subject,
                Body: emailData.html || emailData.text,
                Attachments: emailData.attachments?.map((att, i) => ({
                    name: att.filename || `attachment_${i}`,
                    data: att.data
                }))
            }).then(result => {
                if (result === 'OK') {
                    resolve({ success: true, messageId: result });
                } else {
                    reject(new Error(`SMTP Error: ${result}`));
                }
            }).catch(reject);
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Load SMTP.js dynamically
 */
function loadSMTPJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://smtpjs.com/v3/smtp.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load SMTP.js'));
        document.head.appendChild(script);
    });
}

// =====================================================
// SENDGRID API
// =====================================================

/**
 * Send email via SendGrid API
 * @param {Object} config - { apiKey, from, to, subject, text, html, cc, bcc, attachments }
 * @returns {Promise<Object>}
 */
export async function sendWithSendGrid(config) {
    const { apiKey, from, to, subject, text, html, cc, bcc, attachments } = config;

    if (!apiKey) {
        throw new Error('Missing required param: apiKey');
    }

    const personalizations = [
        {
            to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }]
        }
    ];

    if (cc) {
        personalizations[0].cc = Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }];
    }

    if (bcc) {
        personalizations[0].bcc = Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }];
    }

    const content = [];
    if (text) content.push({ type: 'text/plain', value: text });
    if (html) content.push({ type: 'text/html', value: html });

    const payload = {
        personalizations,
        from: typeof from === 'string' ? { email: from } : from,
        subject,
        content
    };

    if (attachments) {
        payload.attachments = attachments.map(att => ({
            content: att.data,
            filename: att.filename,
            type: att.type,
            disposition: 'attachment'
        }));
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(`SendGrid Error: ${JSON.stringify(error)}`);
    }

    return {
        success: true,
        messageId: response.headers.get('X-Message-Id')
    };
}

// =====================================================
// MAILGUN API
// =====================================================

/**
 * Send email via Mailgun API
 * @param {Object} config - { apiKey, domain, from, to, subject, text, html, cc, bcc }
 * @returns {Promise<Object>}
 */
export async function sendWithMailgun(config) {
    const { apiKey, domain, from, to, subject, text, html, cc, bcc } = config;

    if (!apiKey || !domain) {
        throw new Error('Missing required params: apiKey, domain');
    }

    const formData = new FormData();
    formData.append('from', from);
    formData.append('to', Array.isArray(to) ? to : [to]);
    if (cc) formData.append('cc', Array.isArray(cc) ? cc : [cc]);
    if (bcc) formData.append('bcc', Array.isArray(bcc) ? bcc : [bcc]);
    formData.append('subject', subject);
    if (text) formData.append('text', text);
    if (html) formData.append('html', html);

    const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(`api:${apiKey}`)}`
        },
        body: formData
    });

    const data = await response.json();

    if (response.status !== 200) {
        throw new Error(`Mailgun Error: ${data.message || response.statusText}`);
    }

    return {
        success: true,
        messageId: data.id
    };
}

// =====================================================
// BREVO (SENDINBLUE) API
// =====================================================

/**
 * Send email via Brevo (Sendinblue) API
 * @param {Object} config - { apiKey, from, to, subject, text, html, cc, bcc, attachments }
 * @returns {Promise<Object>}
 */
export async function sendWithBrevo(config) {
    const { apiKey, from, to, subject, text, html, cc, bcc, attachments } = config;

    if (!apiKey) {
        throw new Error('Missing required param: apiKey');
    }

    const payload = {
        sender: typeof from === 'string' ? { email: from } : from,
        to: Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text
    };

    if (cc) {
        payload.cc = Array.isArray(cc) ? cc.map(email => ({ email })) : [{ email: cc }];
    }

    if (bcc) {
        payload.bcc = Array.isArray(bcc) ? bcc.map(email => ({ email })) : [{ email: bcc }];
    }

    if (attachments) {
        payload.attachment = attachments.map(att => ({
            name: att.filename,
            content: att.data
        }));
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(`Brevo Error: ${data.message || response.statusText}`);
    }

    return {
        success: true,
        messageId: data.messageId
    };
}

// =====================================================
// GENERIC SMTP (NODE.JS BACKEND)
// =====================================================

/**
 * Send email via backend SMTP relay
 * This requires a backend endpoint that handles SMTP
 * @param {Object} config - { endpoint, smtpConfig, emailData }
 * @returns {Promise<Object>}
 */
export async function sendViaBackendRelay(config) {
    const { endpoint, smtpConfig, emailData } = config;

    if (!endpoint) {
        throw new Error('Missing required param: endpoint');
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ smtp: smtpConfig, email: emailData })
    });

    if (!response.ok) {
        throw new Error(`Backend relay error: ${response.statusText}`);
    }

    return response.json();
}

// =====================================================
// UNIFIED SEND FUNCTION
// =====================================================

/**
 * Send email (auto-detect provider)
 * @param {Object} config
 * @returns {Promise<Object>}
 */
export async function send(config) {
    const { provider = 'smtpjs', ...rest } = config;

    switch (provider.toLowerCase()) {
        case 'sendgrid':
            return sendWithSendGrid(rest);

        case 'mailgun':
            return sendWithMailgun(rest);

        case 'brevo':
        case 'sendinblue':
            return sendWithBrevo(rest);

        case 'smtpjs':
            return sendWithSMTPJS(rest);

        case 'relay':
            return sendViaBackendRelay(rest);

        default:
            throw new Error(`Unknown email provider: ${provider}`);
    }
}

// =====================================================
// HTML TEMPLATE HELPERS
// =====================================================

/**
 * Create HTML email template
 * @param {Object} options - { title, header, body, footer, styles }
 * @returns {string}
 */
export function createEmailTemplate(options) {
    const {
        title = 'Email',
        header = '',
        body = '',
        footer = '',
        styles = {}
    } = options;

    const defaultStyles = {
        body: 'font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333;',
        container: 'max-width: 600px; margin: 0 auto; padding: 20px;',
        header: 'background: #4A90D9; color: white; padding: 20px; text-align: center;',
        title: 'font-size: 24px; margin: 0;',
        body: 'padding: 20px; background: #f9f9f9;',
        footer: 'padding: 20px; text-align: center; font-size: 12px; color: #666;',
        button: 'display: inline-block; padding: 10px 20px; background: #4A90D9; color: white; text-decoration: none; border-radius: 5px;'
    };

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
</head>
<body style="${defaultStyles.body}">
    <div style="${defaultStyles.container}">
        ${header ? `<div style="${defaultStyles.header}"><h1 style="${defaultStyles.title}">${header}</h1></div>` : ''}
        <div style="${defaultStyles.body}">
            ${body}
        </div>
        ${footer ? `<div style="${defaultStyles.footer}">${footer}</div>` : ''}
    </div>
</body>
</html>
`;
}

/**
 * Create table from data
 * @param {Array} headers
 * @param {Array} rows
 * @returns {string}
 */
export function createTable(headers, rows) {
    const headerCells = headers.map(h => `<th style="padding: 10px; border: 1px solid #ddd; background: #f0f0f0;">${h}</th>`).join('');
    const dataRows = rows.map(row =>
        `<tr>${row.map(cell => `<td style="padding: 10px; border: 1px solid #ddd;">${cell}</td>`).join('')}</tr>`
    ).join('');

    return `
<table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${dataRows}</tbody>
</table>
`;
}

/**
 * Create alert box
 * @param {string} type - success, error, warning, info
 * @param {string} message
 * @returns {string}
 */
export function createAlert(type, message) {
    const colors = {
        success: { bg: '#d4edda', border: '#c3e6cb', color: '#155724' },
        error: { bg: '#f8d7da', border: '#f5c6cb', color: '#721c24' },
        warning: { bg: '#fff3cd', border: '#ffeeba', color: '#856404' },
        info: { bg: '#d1ecf1', border: '#bee5eb', color: '#0c5460' }
    };

    const style = colors[type] || colors.info;

    return `
<div style="background: ${style.bg}; border: 1px solid ${style.border}; color: ${style.color}; padding: 15px; border-radius: 4px; margin: 20px 0;">
    ${message}
</div>
`;
}

// =====================================================
// NODE EXECUTION FUNCTION
// =====================================================

/**
 * Execute Email node in automation
 * @param {Object} nodeData
 * @param {Object} context
 * @returns {Promise<Object>}
 */
export async function execute(nodeData, context = {}) {
    const { action, config, credentialId } = nodeData;
    const variables = context.variables || {};

    // Get credential if specified
    let providerConfig = config;

    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential) {
            providerConfig = { ...credential.encrypted_config, ...config };
            await updateCredentialLastUsed(credentialId);
        }
    }

    // Interpolate variables
    const interpolate = (str) => {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const keys = path.trim().split('.');
            let value = variables;
            for (const key of keys) {
                value = value?.[key];
            }
            return value ?? match;
        });
    };

    const emailData = {
        from: interpolate(config.from || providerConfig.from),
        to: Array.isArray(config.to) ? config.to.map(interpolate) : interpolate(config.to),
        subject: interpolate(config.subject),
        text: interpolate(config.text),
        html: config.html ? interpolate(config.html) : null,
        cc: config.cc ? (Array.isArray(config.cc) ? config.cc.map(interpolate) : interpolate(config.cc)) : null,
        bcc: config.bcc ? (Array.isArray(config.bcc) ? config.bcc.map(interpolate) : interpolate(config.bcc)) : null,
        attachments: config.attachments
    };

    switch (action) {
        case 'send':
            return send({ ...providerConfig, ...emailData });

        case 'sendWithTemplate':
            const html = createEmailTemplate({
                header: interpolate(config.header),
                body: interpolate(config.body),
                footer: interpolate(config.footer),
                title: interpolate(config.title)
            });
            return send({ ...providerConfig, ...emailData, html });

        case 'sendGrid':
            return sendWithSendGrid({ ...providerConfig, ...emailData });

        case 'mailgun':
            return sendWithMailgun({ ...providerConfig, ...emailData });

        case 'brevo':
            return sendWithBrevo({ ...providerConfig, ...emailData });

        default:
            throw new Error(`Unknown Email action: ${action}`);
    }
}

// =====================================================
// DEFAULT EXPORT
// =====================================================
export default {
    send,
    sendWithSMTPJS,
    sendWithSendGrid,
    sendWithMailgun,
    sendWithBrevo,
    sendViaBackendRelay,
    createEmailTemplate,
    createTable,
    createAlert,
    execute
};

export const emailConnector = {
    send,
    sendWithSendGrid,
    sendWithMailgun,
    sendWithBrevo,
    createEmailTemplate,
    createTable,
    createAlert,
    execute
};
