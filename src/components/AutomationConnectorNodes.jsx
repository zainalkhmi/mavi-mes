/**
 * Automation Connector Nodes
 * New node components for Telegram, Slack, Google Sheets, Email connectors
 */

import React from 'react';
import { Handle, Position } from 'reactflow';
import { Send, MessageSquare, FileSpreadsheet, Mail } from 'lucide-react';

// =====================================================
// TELEGRAM NODE
// =====================================================

export const TelegramNode = ({ data, selected }) => {
    const getActionLabel = () => {
        switch (data.action) {
            case 'sendMessage': return 'Send Message';
            case 'sendPhoto': return 'Send Photo';
            case 'sendDocument': return 'Send Document';
            case 'sendWithKeyboard': return 'Keyboard';
            case 'getMe': return 'Get Bot Info';
            default: return 'Telegram';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '18px',
                backgroundColor: '#0088cc',
                border: `3px solid ${selected ? '#ffffff' : '#006699'}`,
                boxShadow: selected ? '0 0 24px rgba(0, 136, 204, 0.8)' : '0 8px 18px rgba(0, 136, 204, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}>
                <Handle type="target" position={Position.Left} style={{
                    width: '12px', height: '12px', background: '#0088cc', border: '2px solid #ffffff', left: '-6px'
                }} />
                <Send size={28} />
                <Handle type="source" position={Position.Right} style={{
                    width: '12px', height: '12px', background: '#0088cc', border: '2px solid #ffffff', right: '-6px'
                }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.label || 'Telegram'}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0088cc', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {getActionLabel()}
                </div>
            </div>
        </div>
    );
};

// =====================================================
// SLACK NODE
// =====================================================

export const SlackNode = ({ data, selected }) => {
    const getActionLabel = () => {
        switch (data.action) {
            case 'sendWebhook': return 'Webhook';
            case 'sendMessage': return 'Send Message';
            case 'uploadFile': return 'Upload File';
            case 'scheduleMessage': return 'Schedule';
            case 'getUserInfo': return 'Get User';
            default: return 'Slack';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '18px',
                backgroundColor: '#4A154B',
                border: `3px solid ${selected ? '#ffffff' : '#3D1240'}`,
                boxShadow: selected ? '0 0 24px rgba(74, 21, 75, 0.8)' : '0 8px 18px rgba(74, 21, 75, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}>
                <Handle type="target" position={Position.Left} style={{
                    width: '12px', height: '12px', background: '#4A154B', border: '2px solid #ffffff', left: '-6px'
                }} />
                <MessageSquare size={28} />
                <Handle type="source" position={Position.Right} style={{
                    width: '12px', height: '12px', background: '#4A154B', border: '2px solid #ffffff', right: '-6px'
                }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.label || 'Slack'}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#4A154B', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {getActionLabel()}
                </div>
            </div>
        </div>
    );
};

// =====================================================
// GOOGLE SHEETS NODE
// =====================================================

export const GoogleSheetsNode = ({ data, selected }) => {
    const getActionLabel = () => {
        switch (data.action) {
            case 'readRange': return 'Read';
            case 'updateRange': return 'Update';
            case 'appendRow': return 'Append';
            case 'batchUpdate': return 'Batch';
            case 'clearRange': return 'Clear';
            case 'create': return 'Create';
            default: return 'Sheets';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '18px',
                backgroundColor: '#0F9D58',
                border: `3px solid ${selected ? '#ffffff' : '#0D7A47'}`,
                boxShadow: selected ? '0 0 24px rgba(15, 157, 88, 0.8)' : '0 8px 18px rgba(15, 157, 88, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}>
                <Handle type="target" position={Position.Left} style={{
                    width: '12px', height: '12px', background: '#0F9D58', border: '2px solid #ffffff', left: '-6px'
                }} />
                <FileSpreadsheet size={28} />
                <Handle type="source" position={Position.Right} style={{
                    width: '12px', height: '12px', background: '#0F9D58', border: '2px solid #ffffff', right: '-6px'
                }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.label || 'Google Sheets'}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#0F9D58', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {getActionLabel()}
                </div>
            </div>
        </div>
    );
};

// =====================================================
// EMAIL NODE (Enhanced)
// =====================================================

export const EmailNode = ({ data, selected }) => {
    const getProviderLabel = () => {
        switch (data.provider) {
            case 'sendgrid': return 'SendGrid';
            case 'mailgun': return 'Mailgun';
            case 'brevo': return 'Brevo';
            case 'smtpjs': return 'SMTP';
            default: return 'Email';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <div style={{
                width: '62px',
                height: '62px',
                borderRadius: '18px',
                backgroundColor: '#EA4335',
                border: `3px solid ${selected ? '#ffffff' : '#C5221F'}`,
                boxShadow: selected ? '0 0 24px rgba(234, 67, 53, 0.8)' : '0 8px 18px rgba(234, 67, 53, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                transition: 'all 0.2s ease',
                position: 'relative'
            }}>
                <Handle type="target" position={Position.Left} style={{
                    width: '12px', height: '12px', background: '#EA4335', border: '2px solid #ffffff', left: '-6px'
                }} />
                <Mail size={28} />
                <Handle type="source" position={Position.Right} style={{
                    width: '12px', height: '12px', background: '#EA4335', border: '2px solid #ffffff', right: '-6px'
                }} />
            </div>

            <div style={{ textAlign: 'center', marginTop: '8px', maxWidth: '140px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {data.label || 'Send Email'}
                </div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#EA4335', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                    {getProviderLabel()}
                </div>
            </div>
        </div>
    );
};

// =====================================================
// NODE TYPES REGISTRY
// =====================================================

export const connectorNodeTypes = {
    telegram: TelegramNode,
    slack: SlackNode,
    google_sheets: GoogleSheetsNode,
    email: EmailNode
};

// =====================================================
// NODE DEFINITIONS FOR SIDEBAR
// =====================================================

export const connectorNodeDefinitions = {
    telegram: [
        { type: 'telegram', label: 'Send Telegram Message', icon: Send, data: { connectorType: 'telegram', action: 'sendMessage', label: 'Send Message', connectorId: null } },
        { type: 'telegram', label: 'Send Photo', icon: Send, data: { connectorType: 'telegram', action: 'sendPhoto', label: 'Send Photo', connectorId: null } },
        { type: 'telegram', label: 'Send Document', icon: Send, data: { connectorType: 'telegram', action: 'sendDocument', label: 'Send Document', connectorId: null } },
        { type: 'telegram', label: 'Inline Keyboard', icon: Send, data: { connectorType: 'telegram', action: 'sendWithKeyboard', label: 'Inline Keyboard', connectorId: null } },
    ],
    slack: [
        { type: 'slack', label: 'Slack Webhook', icon: MessageSquare, data: { connectorType: 'slack', action: 'sendWebhook', label: 'Webhook Alert', connectorId: null } },
        { type: 'slack', label: 'Slack Message', icon: MessageSquare, data: { connectorType: 'slack', action: 'sendMessage', label: 'Send Message', connectorId: null } },
        { type: 'slack', label: 'Slack File Upload', icon: MessageSquare, data: { connectorType: 'slack', action: 'uploadFile', label: 'Upload File', connectorId: null } },
        { type: 'slack', label: 'Schedule Message', icon: MessageSquare, data: { connectorType: 'slack', action: 'scheduleMessage', label: 'Schedule', connectorId: null } },
    ],
    google_sheets: [
        { type: 'google_sheets', label: 'Read Range', icon: FileSpreadsheet, data: { connectorType: 'google_sheets', action: 'readRange', label: 'Read Data', connectorId: null } },
        { type: 'google_sheets', label: 'Update Range', icon: FileSpreadsheet, data: { connectorType: 'google_sheets', action: 'updateRange', label: 'Update Data', connectorId: null } },
        { type: 'google_sheets', label: 'Append Row', icon: FileSpreadsheet, data: { connectorType: 'google_sheets', action: 'appendRow', label: 'Add Row', connectorId: null } },
        { type: 'google_sheets', label: 'Clear Range', icon: FileSpreadsheet, data: { connectorType: 'google_sheets', action: 'clearRange', label: 'Clear Data', connectorId: null } },
    ],
    email: [
        { type: 'email', label: 'SendGrid Email', icon: Mail, data: { connectorType: 'email', action: 'send', provider: 'sendgrid', label: 'SendGrid', connectorId: null } },
        { type: 'email', label: 'Mailgun Email', icon: Mail, data: { connectorType: 'email', action: 'send', provider: 'mailgun', label: 'Mailgun', connectorId: null } },
        { type: 'email', label: 'Brevo Email', icon: Mail, data: { connectorType: 'email', action: 'send', provider: 'brevo', label: 'Brevo', connectorId: null } },
        { type: 'email', label: 'SMTP Email', icon: Mail, data: { connectorType: 'email', action: 'send', provider: 'smtpjs', label: 'SMTP', connectorId: null } },
    ]
};

export default {
    TelegramNode,
    SlackNode,
    GoogleSheetsNode,
    EmailNode,
    connectorNodeTypes,
    connectorNodeDefinitions
};
