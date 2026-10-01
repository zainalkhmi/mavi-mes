import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getPaperlessConfig,
  savePaperlessConfig,
  testConnection,
  searchDocuments,
  uploadDocument,
  getDocumentDetail,
  getDocumentBlob,
  archiveMesDocument,
  pollTaskCompletion
} from '../../utils/paperlessConnector';

describe('Paperless-ngx REST API Connector', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('manages config in localStorage correctly', () => {
    expect(getPaperlessConfig()).toEqual({
      host: 'http://localhost:8000',
      token: '',
      enabled: false,
      defaultDocType: 'Manufacturing Report'
    });

    savePaperlessConfig({
      host: 'http://paperless.factory.local:8000',
      token: 'secret-token-123',
      enabled: true
    });

    const updated = getPaperlessConfig();
    expect(updated.host).toBe('http://paperless.factory.local:8000');
    expect(updated.token).toBe('secret-token-123');
    expect(updated.enabled).toBe(true);
  });

  it('tests connection successfully with valid API token', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        version: '2.14.0',
        documents: '/api/documents/'
      })
    });

    const res = await testConnection({
      host: 'http://localhost:8000',
      token: 'valid-token'
    });

    expect(res.success).toBe(true);
    expect(res.message).toContain('berhasil terhubung');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token valid-token'
        })
      })
    );
  });

  it('handles unauthorized connection error gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    const res = await testConnection({
      host: 'http://localhost:8000',
      token: 'invalid-token'
    });

    expect(res.success).toBe(false);
    expect(res.message).toContain('Autentikasi gagal');
  });

  it('searches documents with OCR query and tags', async () => {
    const mockResults = {
      count: 2,
      results: [
        { id: 101, title: 'WO-1029 Checksheet', content: 'Inspeksi lolos QC' },
        { id: 102, title: 'Drawing Assy P-99', content: 'Tolerance +/- 0.05' }
      ]
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResults
    });

    const data = await searchDocuments(
      {
        query: 'Inspeksi lolos',
        page: 1,
        pageSize: 10,
        tagIds: [12, 15]
      },
      { host: 'http://127.0.0.1:8000', token: 'token-abc' }
    );

    expect(data.count).toBe(2);
    expect(data.results[0].title).toBe('WO-1029 Checksheet');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/documents/?query=Inspeksi+lolos&page=1&page_size=10&ordering=-created&tags__id__all=12%2C15'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Token token-abc'
        })
      })
    );
  });

  it('uploads document with FormData and Token authentication', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => '"98e404b9-1234-5678-abcd-ef0123456789"'
    });

    const mockBlob = new Blob(['sample pdf content'], { type: 'application/pdf' });
    const res = await uploadDocument(
      {
        file: mockBlob,
        filename: 'wo-report.pdf',
        title: 'Work Order #1005 Summary',
        tags: [1, 2],
        documentType: 5
      },
      { host: 'http://localhost:8000', token: 'token-upload' }
    );

    expect(res.success).toBe(true);
    expect(res.taskId).toBe('98e404b9-1234-5678-abcd-ef0123456789');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://localhost:8000/api/documents/post_document/',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Token token-upload'
        },
        body: expect.any(FormData)
      })
    );
  });

  it('archives MES document with auto tagging for WO and Part numbers', async () => {
    // Mock getTags & getDocumentTypes responses
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/document_types/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [{ id: 7, name: 'QC Checksheet' }]
        });
      }
      if (url.includes('/api/tags/')) {
        return Promise.resolve({
          ok: true,
          json: async () => [
            { id: 21, name: 'MAVI-MES' },
            { id: 22, name: 'WO:WO-8899' },
            { id: 23, name: 'PART:SKU-404' }
          ]
        });
      }
      if (url.includes('/api/documents/post_document/')) {
        return Promise.resolve({
          ok: true,
          text: async () => 'task-uuid-xyz'
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const mockBlob = new Blob(['pdf data'], { type: 'application/pdf' });
    const res = await archiveMesDocument(
      {
        file: mockBlob,
        title: 'QC Inspection Report - Line 1',
        woNumber: 'WO-8899',
        partNumber: 'SKU-404',
        docTypeName: 'QC Checksheet'
      },
      { host: 'http://localhost:8000', token: 'test-token' }
    );

    expect(res.success).toBe(true);
    expect(res.taskId).toBe('task-uuid-xyz');
  });

  it('polls task status until completion', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: async () => [
          {
            task_id: 'task-123',
            status: callCount >= 2 ? 'SUCCESS' : 'PENDING',
            related_document: 555
          }
        ]
      });
    });

    const result = await pollTaskCompletion(
      'task-123',
      { intervalMs: 10, maxAttempts: 5 },
      { host: 'http://localhost:8000', token: 'token' }
    );

    expect(result.success).toBe(true);
    expect(result.status).toBe('SUCCESS');
    expect(result.documentId).toBe(555);
    expect(callCount).toBe(2);
  });
});
