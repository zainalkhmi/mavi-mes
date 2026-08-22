/**
 * WhatsApp Integration Service for MANDOR MES
 * ==========================================
 * Connects the in-app ChatWidget and LiveTerminal to WhatsApp.
 *
 * Supported Providers:
 *  1. FONNTE (https://fonnte.com) - Popular Indonesian WA Gateway
 *  2. WABLAS (https://wablas.com) - WA Gateway API
 *  3. N8N_WEBHOOK - Dispatches to n8n workflow for routing to WA
 *  4. CUSTOM_GATEWAY - Custom REST endpoint (Baileys / WPPConnect)
 *  5. DIRECT_LINK - Generates instant wa.me click-to-chat links
 */

import n8nWebhook from './n8nWebhookService';

const LS_WA_CONFIG = 'mandor_whatsapp_config';
const LS_WA_LOGS = 'mandor_whatsapp_logs';
const MAX_LOGS = 100;

export const WA_PROVIDERS = [
  { id: 'FONNTE', name: 'Fonnte WA Gateway', defaultUrl: 'https://api.fonnte.com/send' },
  { id: 'WABLAS', name: 'Wablas WA Gateway', defaultUrl: 'https://kudus.wablas.com/api/send-message' },
  { id: 'N8N_WEBHOOK', name: 'n8n Workflow Automation', defaultUrl: '' },
  { id: 'CUSTOM_GATEWAY', name: 'Custom HTTP Gateway / Baileys', defaultUrl: 'http://localhost:3000/send-message' },
  { id: 'DIRECT_LINK', name: 'Direct WhatsApp Web / App (wa.me)', defaultUrl: '' }
];

const DEFAULT_CONFIG = {
  enabled: true,
  provider: 'DIRECT_LINK',
  apiKey: '',
  apiUrl: 'https://api.fonnte.com/send',
  departmentPhones: {
    'LOGISTIC': '',
    'MAINTENANCE': '',
    'QUALITY': '',
    'SUPERVISOR': '',
    'PRODUCTION': '',
    'ALL': ''
  },
  autoForwardOnSend: true,
  includeMedia: true
};

class WhatsAppService {
  constructor() {
    this.config = this.loadConfig();
    this.logs = this.loadLogs();
  }

  loadConfig() {
    try {
      const stored = localStorage.getItem(LS_WA_CONFIG);
      return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : { ...DEFAULT_CONFIG };
    } catch {
      return { ...DEFAULT_CONFIG };
    }
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem(LS_WA_CONFIG, JSON.stringify(this.config));
    } catch (e) {
      console.warn('Failed to save WA config to localStorage:', e);
    }
    return this.config;
  }

  getConfig() {
    return { ...this.config };
  }

  loadLogs() {
    try {
      const stored = localStorage.getItem(LS_WA_LOGS);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addLog(entry) {
    this.logs = [
      {
        id: 'wa_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        timestamp: new Date().toISOString(),
        ...entry
      },
      ...this.logs
    ].slice(0, MAX_LOGS);

    try {
      localStorage.setItem(LS_WA_LOGS, JSON.stringify(this.logs));
    } catch (e) {}
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
    localStorage.removeItem(LS_WA_LOGS);
  }

  /**
   * Format phone number to international standard (e.g. 0812 -> 62812)
   */
  normalizePhoneNumber(phone = '') {
    let clean = phone.replace(/[^0-9]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return clean;
  }

  /**
   * Find phone number for a given target station or contact name
   */
  getPhoneForTarget(target) {
    if (!target) return this.config.departmentPhones.DEFAULT || '';
    const key = String(target).toUpperCase();

    // Check specific department mapping
    for (const [dept, phone] of Object.entries(this.config.departmentPhones || {})) {
      if (phone && (key.includes(dept) || dept.includes(key))) {
        return this.normalizePhoneNumber(phone);
      }
    }

    // Direct phone number if numeric
    if (/^[0-9+ ]{8,20}$/.test(target)) {
      return this.normalizePhoneNumber(target);
    }

    return this.normalizePhoneNumber(this.config.departmentPhones.SUPERVISOR || this.config.departmentPhones.DEFAULT || '');
  }

  /**
   * Build human-readable WhatsApp message body
   */
  formatMessage({ sender, station, targetName, message, mediaUrl }) {
    const time = new Date().toLocaleTimeString();
    let text = `🏭 *[MANDOR MES - Chat Notification]*\n`;
    text += `📍 *Dari:* ${sender || 'Operator'} (Station: ${station || 'Live Terminal'})\n`;
    if (targetName) text += `🎯 *Kepada:* ${targetName}\n`;
    text += `🕒 *Waktu:* ${time}\n\n`;
    text += `💬 *Pesan:*\n${message}\n`;
    if (mediaUrl) {
      text += `\n📎 *Lampiran Media:* ${mediaUrl}\n`;
    }
    text += `\n_Balas pesan ini untuk mengirim tanggapan langsung ke operator._`;
    return text;
  }

  /**
   * Generate Direct WhatsApp Web URL (using web.whatsapp.com for logged-in sessions)
   */
  generateDirectUrl({ phone, message, sender, station, targetName, mediaUrl }) {
    const targetPhone = phone || this.getPhoneForTarget(targetName);
    const body = this.formatMessage({ sender, station, targetName, message, mediaUrl });
    const encodedBody = encodeURIComponent(body);
    if (!targetPhone) {
      return `https://web.whatsapp.com/send?text=${encodedBody}`;
    }
    return `https://web.whatsapp.com/send?phone=${targetPhone}&text=${encodedBody}`;
  }

  /**
   * Open WhatsApp Web directly in a dedicated synced popup window
   */
  openWhatsAppWeb({ phone, message, sender, station, targetName, mediaUrl } = {}) {
    let url = 'https://web.whatsapp.com';
    if (message || phone || targetName) {
      url = this.generateDirectUrl({ phone, message, sender, station, targetName, mediaUrl });
    }
    const windowFeatures = 'width=1150,height=800,top=80,left=120,resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no';
    const popup = window.open(url, 'MandorWhatsAppWeb', windowFeatures);
    if (popup) {
      popup.focus();
    }
    return url;
  }

  /**
   * Send WhatsApp notification via configured Gateway / API
   */
  async sendMessage({ sender, station, targetName, targetPhone, message, mediaUrl }) {
    const config = this.config;
    const phone = targetPhone || this.getPhoneForTarget(targetName);
    const body = this.formatMessage({ sender, station, targetName, message, mediaUrl });

    // Always fire n8n event for workflow webhook triggers
    try {
      n8nWebhook.fire('chat.message_sent', {
        sender,
        station,
        target: targetName,
        targetPhone: phone,
        message,
        mediaUrl,
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.warn('n8n webhook fire failed:', e);
    }

    if (!config.enabled) {
      return { success: false, reason: 'WhatsApp integration is disabled in settings' };
    }

    // Direct link provider (no API call needed, user opens link)
    if (config.provider === 'DIRECT_LINK') {
      const url = this.generateDirectUrl({ phone, message, sender, station, targetName, mediaUrl });
      this.addLog({ provider: 'DIRECT_LINK', phone, status: 'READY_TO_OPEN', url });
      return { success: true, provider: 'DIRECT_LINK', url };
    }

    if (!phone && config.provider !== 'N8N_WEBHOOK') {
      return { success: false, reason: 'Nomor WhatsApp tujuan belum diatur untuk ' + (targetName || 'kontak ini') };
    }

    try {
      let res;
      if (config.provider === 'FONNTE') {
        const formData = new FormData();
        formData.append('target', phone);
        formData.append('message', body);
        if (mediaUrl) formData.append('url', mediaUrl);

        res = await fetch(config.apiUrl || 'https://api.fonnte.com/send', {
          method: 'POST',
          headers: {
            'Authorization': config.apiKey || ''
          },
          body: formData
        });
      } else if (config.provider === 'WABLAS') {
        res = await fetch(config.apiUrl || 'https://kudus.wablas.com/api/send-message', {
          method: 'POST',
          headers: {
            'Authorization': config.apiKey || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            phone,
            message: body,
            image: mediaUrl || undefined
          })
        });
      } else if (config.provider === 'N8N_WEBHOOK' || config.provider === 'CUSTOM_GATEWAY') {
        res = await fetch(config.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {})
          },
          body: JSON.stringify({
            phone,
            message: body,
            rawMessage: message,
            sender,
            station,
            targetName,
            mediaUrl,
            timestamp: new Date().toISOString()
          })
        });
      }

      const resData = res ? await res.json().catch(() => ({})) : {};
      const isSuccess = res && res.ok;

      this.addLog({
        provider: config.provider,
        phone,
        status: isSuccess ? 'SENT' : 'FAILED',
        response: resData,
        statusCode: res ? res.status : 0
      });

      return {
        success: isSuccess,
        data: resData,
        provider: config.provider
      };
    } catch (err) {
      this.addLog({
        provider: config.provider,
        phone,
        status: 'ERROR',
        error: err.message
      });
      return { success: false, error: err.message };
    }
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;
