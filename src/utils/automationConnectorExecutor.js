/**
 * Automation Connector Executor
 * Execute connector nodes (Telegram, Slack, Google Sheets, Email)
 *
 * Import this module to execute connector nodes in the automation engine
 */

import { telegramConnector } from './connectors/telegram';
import { slackConnector } from './connectors/slack';
import { googleSheetsConnector } from './connectors/googleSheets';
import { emailConnector } from './connectors/email';
import { getCredentialById, logStepStart, logStepComplete } from './automationDB';

// =====================================================
// EXECUTE CONNECTOR NODE
// =====================================================

/**
 * Execute a connector node
 * @param {Object} nodeData - Node configuration from automation graph
 * @param {Object} context - Execution context { runId, variables, credentials }
 * @returns {Promise<Object>} - { success, output, error }
 */
export async function executeConnectorNode(nodeData, context = {}) {
    const { runId, variables = {} } = context;
    let stepId = null;

    try {
        // Log step start
        if (runId) {
            const step = await logStepStart(runId, {
                nodeId: nodeData.id,
                nodeName: nodeData.label || nodeData.connectorType,
                nodeType: `connector_${nodeData.connectorType}`,
                inputData: sanitizeInput(nodeData)
            });
            stepId = step?.id;
        }

        // Execute based on connector type
        let result;
        switch (nodeData.connectorType) {
            case 'telegram':
                result = await executeTelegram(nodeData, variables);
                break;
            case 'slack':
                result = await executeSlack(nodeData, variables);
                break;
            case 'google_sheets':
                result = await executeGoogleSheets(nodeData, variables);
                break;
            case 'email':
                result = await executeEmail(nodeData, variables);
                break;
            default:
                throw new Error(`Unknown connector type: ${nodeData.connectorType}`);
        }

        // Log step completion
        if (stepId) {
            await logStepComplete(stepId, {
                status: 'completed',
                outputData: result
            });
        }

        return { success: true, output: result };

    } catch (error) {
        console.error(`[ConnectorExecutor] Error executing ${nodeData.connectorType}:`, error);

        // Log step failure
        if (stepId) {
            await logStepComplete(stepId, {
                status: 'failed',
                error: error.message
            });
        }

        return { success: false, error: error.message };
    }
}

// =====================================================
// TELEGRAM EXECUTION
// =====================================================

async function executeTelegram(nodeData, variables) {
    const { action, config, credentialId } = nodeData;
    const interpolatedConfig = interpolateConfig(config, variables);

    // Get credential if specified
    let executionConfig = { ...interpolatedConfig };
    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential?.encrypted_config) {
            executionConfig = { ...credential.encrypted_config, ...interpolatedConfig };
        }
    }

    switch (action) {
        case 'sendMessage':
            return telegramConnector.sendMessage({
                botToken: executionConfig.botToken || executionConfig.token,
                chatId: executionConfig.chatId || executionConfig.chat_id,
                text: executionConfig.text || executionConfig.message,
                parseMode: executionConfig.parseMode || 'Markdown'
            });

        case 'sendPhoto':
            return telegramConnector.sendPhoto({
                botToken: executionConfig.botToken,
                chatId: executionConfig.chatId,
                photo: executionConfig.photo,
                caption: executionConfig.caption
            });

        case 'sendDocument':
            return telegramConnector.sendDocument({
                botToken: executionConfig.botToken,
                chatId: executionConfig.chatId,
                document: executionConfig.document,
                filename: executionConfig.filename,
                caption: executionConfig.caption
            });

        case 'sendWithKeyboard':
            return telegramConnector.sendWithKeyboard({
                botToken: executionConfig.botToken,
                chatId: executionConfig.chatId,
                text: executionConfig.text,
                buttons: executionConfig.buttons || [[{ text: 'OK', callback_data: 'ok' }]]
            });

        case 'getMe':
            return telegramConnector.getMe(executionConfig.botToken);

        default:
            throw new Error(`Unknown Telegram action: ${action}`);
    }
}

// =====================================================
// SLACK EXECUTION
// =====================================================

async function executeSlack(nodeData, variables) {
    const { action, config, credentialId } = nodeData;
    const interpolatedConfig = interpolateConfig(config, variables);

    let executionConfig = { ...interpolatedConfig };
    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential?.encrypted_config) {
            executionConfig = { ...credential.encrypted_config, ...interpolatedConfig };
        }
    }

    switch (action) {
        case 'sendWebhook':
            return slackConnector.sendWebhook({
                webhookUrl: executionConfig.webhookUrl || executionConfig.url,
                text: executionConfig.text || executionConfig.message,
                blocks: executionConfig.blocks
            });

        case 'sendMessage':
            return slackConnector.sendMessage({
                token: executionConfig.token,
                channel: executionConfig.channel,
                text: executionConfig.text || executionConfig.message,
                blocks: executionConfig.blocks
            });

        case 'uploadFile':
            return slackConnector.uploadFile({
                token: executionConfig.token,
                channel: executionConfig.channel,
                file: executionConfig.file,
                filename: executionConfig.filename,
                title: executionConfig.title
            });

        case 'scheduleMessage':
            return slackConnector.scheduleMessage({
                token: executionConfig.token,
                channel: executionConfig.channel,
                text: executionConfig.text,
                postAt: parseInt(executionConfig.postAt) || Math.floor(Date.now() / 1000) + 3600
            });

        case 'getUserInfo':
            return slackConnector.getUserInfo(executionConfig.token, executionConfig.userId);

        default:
            throw new Error(`Unknown Slack action: ${action}`);
    }
}

// =====================================================
// GOOGLE SHEETS EXECUTION
// =====================================================

async function executeGoogleSheets(nodeData, variables) {
    const { action, config, credentialId } = nodeData;
    const interpolatedConfig = interpolateConfig(config, variables);

    let executionConfig = { ...interpolatedConfig };
    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential?.encrypted_config) {
            executionConfig = { ...credential.encrypted_config, ...interpolatedConfig };
        }
    }

    switch (action) {
        case 'readRange':
            return googleSheetsConnector.readRange({
                spreadsheetId: executionConfig.spreadsheetId,
                range: executionConfig.range,
                serviceAccount: executionConfig.serviceAccount
            });

        case 'updateRange':
            return googleSheetsConnector.updateRange({
                spreadsheetId: executionConfig.spreadsheetId,
                range: executionConfig.range,
                values: executionConfig.values,
                serviceAccount: executionConfig.serviceAccount,
                valueInputOption: executionConfig.valueInputOption
            });

        case 'appendRow':
            return googleSheetsConnector.appendRow({
                spreadsheetId: executionConfig.spreadsheetId,
                range: executionConfig.range,
                values: executionConfig.values,
                serviceAccount: executionConfig.serviceAccount
            });

        case 'batchUpdate':
            return googleSheetsConnector.batchUpdate({
                spreadsheetId: executionConfig.spreadsheetId,
                data: executionConfig.data,
                serviceAccount: executionConfig.serviceAccount
            });

        case 'clearRange':
            return googleSheetsConnector.clearRange({
                spreadsheetId: executionConfig.spreadsheetId,
                range: executionConfig.range,
                serviceAccount: executionConfig.serviceAccount
            });

        case 'create':
            return googleSheetsConnector.createSpreadsheet({
                title: executionConfig.title,
                serviceAccount: executionConfig.serviceAccount
            });

        default:
            throw new Error(`Unknown Google Sheets action: ${action}`);
    }
}

// =====================================================
// EMAIL EXECUTION
// =====================================================

async function executeEmail(nodeData, variables) {
    const { action, config, credentialId } = nodeData;
    const interpolatedConfig = interpolateConfig(config, variables);

    let executionConfig = { ...interpolatedConfig };
    if (credentialId) {
        const credential = await getCredentialById(credentialId);
        if (credential?.encrypted_config) {
            executionConfig = { ...credential.encrypted_config, ...interpolatedConfig };
        }
    }

    const provider = executionConfig.provider || 'smtpjs';
    const emailData = {
        from: executionConfig.from,
        to: Array.isArray(executionConfig.to) ? executionConfig.to : [executionConfig.to],
        subject: executionConfig.subject,
        text: executionConfig.text,
        html: executionConfig.html,
        cc: executionConfig.cc,
        bcc: executionConfig.bcc,
        attachments: executionConfig.attachments
    };

    switch (action) {
        case 'send':
        case 'sendWithTemplate':
            if (action === 'sendWithTemplate' && executionConfig.htmlTemplate) {
                emailData.html = emailConnector.createEmailTemplate({
                    header: interpolatedConfig.header,
                    body: interpolatedConfig.body,
                    footer: interpolatedConfig.footer,
                    title: interpolatedConfig.title
                });
            }
            return emailConnector.send({ provider, ...emailData });

        case 'sendGrid':
            return emailConnector.sendWithSendGrid({ apiKey: executionConfig.apiKey, ...emailData });

        case 'mailgun':
            return emailConnector.sendWithMailgun({
                apiKey: executionConfig.apiKey,
                domain: executionConfig.domain,
                ...emailData
            });

        case 'brevo':
            return emailConnector.sendWithBrevo({ apiKey: executionConfig.apiKey, ...emailData });

        default:
            throw new Error(`Unknown Email action: ${action}`);
    }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Interpolate variables in config
 * Supports {{variable}} and {{nested.variable}} syntax
 */
function interpolateConfig(config, variables = {}) {
    if (!config) return {};

    const interpolated = {};

    for (const [key, value] of Object.entries(config)) {
        if (typeof value === 'string') {
            interpolated[key] = value.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
                const keys = path.trim().split('.');
                let result = variables;
                for (const k of keys) {
                    result = result?.[k];
                }
                return result ?? match;
            });
        } else if (Array.isArray(value)) {
            interpolated[key] = value.map(item => {
                if (typeof item === 'object') {
                    return interpolateConfig(item, variables);
                }
                return item;
            });
        } else if (typeof value === 'object' && value !== null) {
            interpolated[key] = interpolateConfig(value, variables);
        } else {
            interpolated[key] = value;
        }
    }

    return interpolated;
}

/**
 * Sanitize input for logging (remove sensitive data)
 */
function sanitizeInput(nodeData) {
    const sanitized = { ...nodeData };
    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'botToken', 'privateKey', 'serviceAccount'];

    for (const key of sensitiveKeys) {
        if (sanitized[key]) {
            sanitized[key] = '***REDACTED***';
        }
        if (sanitized.config?.[key]) {
            sanitized.config[key] = '***REDACTED***';
        }
    }

    return sanitized;
}

// =====================================================
// VALIDATE CREDENTIAL
// =====================================================

/**
 * Validate a connector credential
 * @param {string} credentialId
 * @returns {Promise<{valid: boolean, error?: string}>}
 */
export async function validateCredential(credentialId) {
    try {
        const credential = await getCredentialById(credentialId);
        if (!credential) {
            return { valid: false, error: 'Credential not found' };
        }

        // Type-specific validation
        switch (credential.type) {
            case 'telegram':
                if (!credential.encrypted_config?.botToken) {
                    return { valid: false, error: 'Missing bot token' };
                }
                // Test the token
                await telegramConnector.getMe(credential.encrypted_config.botToken);
                break;

            case 'slack':
                if (!credential.encrypted_config?.token && !credential.encrypted_config?.webhookUrl) {
                    return { valid: false, error: 'Missing token or webhook URL' };
                }
                break;

            case 'google_sheets':
                if (!credential.encrypted_config?.serviceAccount) {
                    return { valid: false, error: 'Missing service account' };
                }
                break;

            case 'email':
                const config = credential.encrypted_config;
                const hasProvider = config?.apiKey || config?.secureToken || config?.host;
                if (!hasProvider) {
                    return { valid: false, error: 'Missing email configuration' };
                }
                break;
        }

        return { valid: true };

    } catch (error) {
        return { valid: false, error: error.message };
    }
}

// =====================================================
// TEST CONNECTOR
// =====================================================

/**
 * Test a connector with sample data
 * @param {string} connectorType - telegram, slack, google_sheets, email
 * @param {Object} config - Test configuration
 * @returns {Promise<Object>}
 */
export async function testConnector(connectorType, config) {
    try {
        const testVariables = {
            test: {
                value: 'TEST_VALUE',
                number: 123,
                timestamp: new Date().toISOString()
            }
        };

        const nodeData = {
            connectorType,
            action: config.action || 'sendMessage',
            config: config.testData || config,
            credentialId: config.credentialId
        };

        const result = await executeConnectorNode(nodeData, {
            variables: testVariables
        });

        return result;

    } catch (error) {
        return { success: false, error: error.message };
    }
}

// =====================================================
// DEFAULT EXPORT
// =====================================================

export default {
    executeConnectorNode,
    validateCredential,
    testConnector
};
