/**
 * n8nWebhook.test.js
 * =====================================================
 * Tests for n8n Webhook Service
 * =====================================================
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import n8nWebhook, { N8N_EVENT_TYPES } from '../../utils/n8nWebhookService';

// Mock fetch
global.fetch = vi.fn();

describe('n8nWebhookService', () => {
  beforeEach(() => {
    // Reset config and clear localStorage
    n8nWebhook.resetConfig();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Configuration', () => {
    it('should have default config disabled', () => {
      const config = n8nWebhook.getConfig();
      expect(config.enabled).toBe(false);
    });

    it('should update config', () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });
      const config = n8nWebhook.getConfig();
      expect(config.enabled).toBe(true);
      expect(config.webhookUrl).toBe('https://example.com/webhook');
    });

    it('should reset to defaults', () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com',
        secretKey: 'secret123',
      });
      n8nWebhook.resetConfig();
      const config = n8nWebhook.getConfig();
      expect(config.enabled).toBe(false);
      expect(config.webhookUrl).toBe('');
    });

    it('should check if active', () => {
      expect(n8nWebhook.isActive()).toBe(false);
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com',
      });
      expect(n8nWebhook.isActive()).toBe(true);
    });
  });

  describe('Event Subscriptions', () => {
    it('should have all event types defined', () => {
      expect(N8N_EVENT_TYPES.length).toBeGreaterThan(0);
      expect(N8N_EVENT_TYPES.some(e => e.key === 'work_order.completed')).toBe(true);
      expect(N8N_EVENT_TYPES.some(e => e.key === 'inspection.failed')).toBe(true);
    });

    it('should toggle subscription', () => {
      const initial = n8nWebhook.getConfig().subscriptions['work_order.completed'];
      n8nWebhook.updateConfig({
        subscriptions: { 'work_order.completed': !initial },
      });
      const updated = n8nWebhook.getConfig().subscriptions['work_order.completed'];
      expect(updated).toBe(!initial);
    });

    it('should not fire unsubscribed events', async () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
        subscriptions: { 'work_order.completed': false },
      });

      const result = await n8nWebhook.fire('work_order.completed', { id: '123' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not subscribed');
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Fire Events', () => {
    beforeEach(() => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });
    });

    it('should fire event successfully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await n8nWebhook.fire('work_order.completed', {
        id: '123',
        status: 'COMPLETED',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Verify payload
      const call = global.fetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.event).toBe('work_order.completed');
      expect(body.data.id).toBe('123');
      expect(body.source).toBe('mandor-mes');
    });

    it('should include metadata when enabled', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await n8nWebhook.fire(
        'cycle.completed',
        { cycle_id: '456' },
        { station: 'Line-A', operator: 'John' }
      );

      const call = global.fetch.mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.metadata.station).toBe('Line-A');
      expect(body.metadata.operator).toBe('John');
    });

    it('should not fire when disabled', async () => {
      n8nWebhook.updateConfig({ enabled: false });

      const result = await n8nWebhook.fire('work_order.completed', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not enabled');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not fire when URL not set', async () => {
      n8nWebhook.updateConfig({ webhookUrl: '' });

      const result = await n8nWebhook.fire('work_order.completed', {});

      expect(result.success).toBe(false);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should include HMAC signature when secret is set', async () => {
      n8nWebhook.updateConfig({
        secretKey: 'my-secret-key',
        includeMetadata: false,
      });

      // Mock crypto.subtle for HMAC
      const mockSign = vi.fn().mockResolvedValue(new ArrayBuffer(32));
      const mockImportKey = vi.fn().mockResolvedValue({});
      const mockDigest = vi.fn().mockResolvedValue(new Uint8Array(32));

      global.crypto.subtle = {
        importKey: mockImportKey,
        sign: mockSign,
        digest: mockDigest,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await n8nWebhook.fire('test.connection', {});

      const call = global.fetch.mock.calls[0];
      expect(call[1].headers['X-Mandor-Signature']).toBeDefined();
      expect(call[1].headers['X-Mandor-Signature']).toMatch(/^sha256=/);
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });
    });

    it('should retry on failure', async () => {
      global.fetch
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: false, status: 500 })
        .mockResolvedValueOnce({ ok: true, status: 200 });

      const result = await n8nWebhook.fire('work_order.completed', {});

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await n8nWebhook.fire('work_order.completed', {});

      expect(result.success).toBe(false);
      expect(global.fetch).toHaveBeenCalledTimes(3); // MAX_RETRIES = 3
    });
  });

  describe('Delivery Log', () => {
    it('should log successful delivery', async () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      await n8nWebhook.fire('work_order.completed', {});
      const log = n8nWebhook.getDeliveryLog();

      expect(log.length).toBeGreaterThan(0);
      expect(log[0].status).toBe('delivered');
      expect(log[0].event).toBe('work_order.completed');
    });

    it('should log failed delivery', async () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });

      global.fetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      await n8nWebhook.fire('work_order.completed', {});
      const log = n8nWebhook.getDeliveryLog();

      expect(log[0].status).toBe('failed');
      expect(log[0].error).toContain('HTTP 500');
    });

    it('should clear delivery log', async () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });

      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
      });

      await n8nWebhook.fire('work_order.completed', {});
      expect(n8nWebhook.getDeliveryLog().length).toBeGreaterThan(0);

      n8nWebhook.clearDeliveryLog();
      expect(n8nWebhook.getDeliveryLog().length).toBe(0);
    });
  });

  describe('Test Connection', () => {
    it('should send test event', async () => {
      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await n8nWebhook.testConnection();

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fail when URL not set', async () => {
      n8nWebhook.updateConfig({ webhookUrl: '' });

      const result = await n8nWebhook.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toContain('not configured');
    });
  });

  describe('Listener System', () => {
    it('should notify listeners on events', async () => {
      const callback = vi.fn();

      n8nWebhook.updateConfig({
        enabled: true,
        webhookUrl: 'https://example.com/webhook',
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const unsubscribe = n8nWebhook.addListener(callback);
      await n8nWebhook.fire('work_order.completed', {});

      expect(callback).toHaveBeenCalledWith('delivered', expect.any(Object));

      // Test unsubscribe
      unsubscribe();
      await n8nWebhook.fire('test.connection', {});
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('Event Mapping', () => {
    it('should map audit events correctly', () => {
      expect(n8nWebhook.mapAuditEvent('CYCLE_COMPLETE')).toBe('cycle.completed');
      expect(n8nWebhook.mapAuditEvent('QUALITY_PASS')).toBe('inspection.passed');
      expect(n8nWebhook.mapAuditEvent('QUALITY_FAIL')).toBe('inspection.failed');
      expect(n8nWebhook.mapAuditEvent('WORK_ORDER_BIND')).toBe('work_order.created');
    });

    it('should map andon events from details', () => {
      expect(n8nWebhook.mapAuditEvent('OTHER', { action: 'ANDON_TRIGGERED' })).toBe('andon.triggered');
      expect(n8nWebhook.mapAuditEvent('OTHER', { action: 'ANDON_RESOLVED' })).toBe('andon.resolved');
    });

    it('should return null for unmapped events', () => {
      expect(n8nWebhook.mapAuditEvent('UNKNOWN_EVENT')).toBe(null);
    });
  });
});
