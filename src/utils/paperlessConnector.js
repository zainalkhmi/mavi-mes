/**
 * Paperless-ngx REST API Connector for MAVI MES
 * ==============================================
 * Comprehensive integration with Paperless-ngx Document Management System (DMS).
 * Enables automatic archiving of Work Orders, QC Inspection Checksheets,
 * Technical Drawing PDFs, and full-text OCR search from within MAVI MES.
 */

const STORAGE_KEY = 'mavi_paperless_config';

/**
 * Retrieve saved Paperless-ngx configuration
 * @returns {{ host: string, token: string, enabled: boolean, defaultDocType: string }}
 */
export function getPaperlessConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[Paperless] Failed to read config from localStorage', err);
  }

  // Also check if configured in Mandor Integration Connectors
  try {
    const connectors = JSON.parse(localStorage.getItem('mandor_integration_connectors') || '[]');
    const paperlessConn = connectors.find(c => c.type === 'PAPERLESS');
    if (paperlessConn) {
      return {
        host: paperlessConn.baseUrl || paperlessConn.serverAddress || 'http://localhost:8000',
        token: paperlessConn.auth?.token || '',
        enabled: true,
        defaultDocType: 'Manufacturing Report'
      };
    }
  } catch {
    // ignore
  }

  return {
    host: 'http://localhost:8000',
    token: '',
    enabled: false,
    defaultDocType: 'Manufacturing Report'
  };
}

/**
 * Save Paperless-ngx configuration
 * @param {Object} config 
 */
export function savePaperlessConfig(config) {
  try {
    const current = getPaperlessConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[Paperless] Failed to save config', err);
    throw err;
  }
}

/**
 * Helper to normalize base host URL and build headers
 */
function resolveEndpoint(path, customConfig) {
  const config = customConfig || getPaperlessConfig();
  const host = (config.host || 'http://localhost:8000').trim().replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${host}${cleanPath}`;
  
  const headers = {
    'Accept': 'application/json'
  };

  if (config.token) {
    // Paperless-ngx supports Token <key>
    headers['Authorization'] = `Token ${config.token.trim()}`;
  }

  return { url, host, headers, config };
}

/**
 * Test connectivity with the Paperless-ngx server
 * @param {Object} [customConfig] - Optional { host, token }
 * @returns {Promise<{ success: boolean, message: string, serverInfo?: any }>}
 */
export async function testConnection(customConfig) {
  try {
    const { url, headers } = resolveEndpoint('/api/', customConfig);
    const res = await fetch(url, { method: 'GET', headers });
    
    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'Autentikasi gagal. Pastikan API Token Paperless-ngx valid.' };
    }
    
    if (!res.ok) {
      return { success: false, message: `Server merespon dengan status ${res.status}: ${res.statusText}` };
    }

    const data = await res.json();
    return {
      success: true,
      message: 'Koneksi ke Paperless-ngx berhasil terhubung.',
      serverInfo: data
    };
  } catch (err) {
    return {
      success: false,
      message: `Gagal terhubung ke host: ${err.message || 'Cek URL dan konfigurasi CORS Paperless-ngx'}`
    };
  }
}

/**
 * Search documents using Paperless-ngx Full-Text OCR Engine
 * @param {Object} params
 * @param {string} [params.query] - OCR / Full-text search term
 * @param {number} [params.page=1]
 * @param {number} [params.pageSize=20]
 * @param {string} [params.ordering='-created']
 * @param {number[]} [params.tagIds]
 * @param {number} [params.documentTypeId]
 * @param {number} [params.correspondentId]
 * @param {Object} [customConfig]
 */
export async function searchDocuments(params = {}, customConfig) {
  const {
    query = '',
    page = 1,
    pageSize = 20,
    ordering = '-created',
    tagIds = [],
    documentTypeId,
    correspondentId
  } = params;

  const qp = new URLSearchParams();
  if (query) qp.set('query', query);
  if (page) qp.set('page', String(page));
  if (pageSize) qp.set('page_size', String(pageSize));
  if (ordering) qp.set('ordering', ordering);
  if (documentTypeId) qp.set('document_type__id', String(documentTypeId));
  if (correspondentId) qp.set('correspondent__id', String(correspondentId));
  if (Array.isArray(tagIds) && tagIds.length > 0) {
    qp.set('tags__id__all', tagIds.join(','));
  }

  const { url, headers } = resolveEndpoint(`/api/documents/?${qp.toString()}`, customConfig);
  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Search failed (${res.status}): ${errorText || res.statusText}`);
  }

  return await res.json();
}

/**
 * Get single document detail including metadata and extracted OCR text
 * @param {number|string} documentId
 * @param {Object} [customConfig]
 */
export async function getDocumentDetail(documentId, customConfig) {
  if (!documentId) throw new Error('Document ID is required');
  const { url, headers } = resolveEndpoint(`/api/documents/${documentId}/`, customConfig);
  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    throw new Error(`Failed to get document #${documentId}: ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Get direct download/preview URL with token (or use fetch blob helper for secure download)
 * @param {number|string} documentId
 * @param {Object} [customConfig]
 */
export function getDocumentPreviewUrl(documentId, customConfig) {
  const { url } = resolveEndpoint(`/api/documents/${documentId}/preview/`, customConfig);
  return url;
}

/**
 * Get thumbnail image URL
 * @param {number|string} documentId
 * @param {Object} [customConfig]
 */
export function getDocumentThumbnailUrl(documentId, customConfig) {
  const { url } = resolveEndpoint(`/api/documents/${documentId}/thumb/`, customConfig);
  return url;
}

/**
 * Download document as a Blob with authorization header
 * @param {number|string} documentId
 * @param {boolean} [preview=false] - If true, requests the preview version
 * @param {Object} [customConfig]
 * @returns {Promise<{ blob: Blob, objectUrl: string }>}
 */
export async function getDocumentBlob(documentId, preview = false, customConfig) {
  const endpoint = preview
    ? `/api/documents/${documentId}/preview/`
    : `/api/documents/${documentId}/download/`;
  
  const { url, headers } = resolveEndpoint(endpoint, customConfig);
  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    throw new Error(`Failed to download document #${documentId}: ${res.statusText}`);
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { blob, objectUrl };
}

/**
 * Upload a document to Paperless-ngx for ingestion & OCR indexing
 * @param {Object} payload
 * @param {File|Blob|string} payload.file - File object, Blob, or base64 data URI
 * @param {string} [payload.filename='document.pdf']
 * @param {string} [payload.title]
 * @param {number|string} [payload.documentType] - Document type ID
 * @param {number|string} [payload.correspondent] - Correspondent ID
 * @param {Array<number|string>} [payload.tags] - Array of tag IDs
 * @param {string} [payload.createdDate] - ISO date string (YYYY-MM-DD)
 * @param {number} [payload.archiveSerialNumber] - Optional numeric barcode / serial
 * @param {Object} [customConfig]
 * @returns {Promise<{ success: boolean, taskId: string, raw: any }>}
 */
export async function uploadDocument(payload, customConfig) {
  const {
    file,
    filename = 'document.pdf',
    title,
    documentType,
    correspondent,
    tags = [],
    createdDate,
    archiveSerialNumber
  } = payload;

  if (!file) throw new Error('File/Document is required for upload');

  const formData = new FormData();

  // Convert base64 data URL to Blob if necessary
  if (typeof file === 'string' && file.startsWith('data:')) {
    const res = await fetch(file);
    const blob = await res.blob();
    formData.append('document', blob, filename);
  } else if (file instanceof Blob || (typeof File !== 'undefined' && file instanceof File)) {
    formData.append('document', file, filename);
  } else {
    throw new Error('Unsupported file format. Provide a File, Blob, or Base64 data URL.');
  }

  if (title) formData.append('title', title);
  if (documentType) formData.append('document_type', String(documentType));
  if (correspondent) formData.append('correspondent', String(correspondent));
  if (createdDate) formData.append('created', createdDate);
  if (archiveSerialNumber !== undefined && archiveSerialNumber !== null) {
    formData.append('archive_serial_number', String(archiveSerialNumber));
  }

  if (Array.isArray(tags) && tags.length > 0) {
    tags.forEach(t => formData.append('tags', String(t)));
  }

  const { url, config } = resolveEndpoint('/api/documents/post_document/', customConfig);
  
  // Note: Do NOT set Content-Type header manually for FormData, browser will include boundary
  const headers = {};
  if (config.token) {
    headers['Authorization'] = `Token ${config.token.trim()}`;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}): ${errorText || res.statusText}`);
  }

  // Paperless-ngx returns the Task UUID (string or JSON)
  const text = await res.text();
  let taskId = text;
  try {
    const parsed = JSON.parse(text);
    taskId = typeof parsed === 'string' ? parsed : (parsed.task_id || parsed.id || text);
  } catch {
    // text is raw UUID string
  }

  return {
    success: true,
    taskId: taskId.replace(/"/g, ''),
    raw: text
  };
}

/**
 * Get processing task status (monitoring consumption queue & OCR progress)
 * @param {string} taskId
 * @param {Object} [customConfig]
 */
export async function getTaskStatus(taskId, customConfig) {
  if (!taskId) throw new Error('Task ID is required');
  const { url, headers } = resolveEndpoint(`/api/tasks/?task_id=${encodeURIComponent(taskId)}`, customConfig);
  const res = await fetch(url, { method: 'GET', headers });

  if (!res.ok) {
    throw new Error(`Failed to check task status (${res.status}): ${res.statusText}`);
  }

  return await res.json();
}

/**
 * Poll task completion until document is fully consumed
 * @param {string} taskId
 * @param {Object} options
 * @param {number} [options.intervalMs=2000]
 * @param {number} [options.maxAttempts=15]
 * @param {Object} [customConfig]
 */
export async function pollTaskCompletion(taskId, { intervalMs = 2000, maxAttempts = 15 } = {}, customConfig) {
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    const tasks = await getTaskStatus(taskId, customConfig);
    const task = Array.isArray(tasks) ? tasks[0] : tasks;

    if (task) {
      if (task.status === 'SUCCESS') {
        return { success: true, status: 'SUCCESS', documentId: task.related_document, task };
      }
      if (task.status === 'FAILURE') {
        return { success: false, status: 'FAILURE', error: task.result || 'Processing failed', task };
      }
    }

    await new Promise(r => setTimeout(r, intervalMs));
  }

  return { success: false, status: 'TIMEOUT', message: 'Task polling timed out' };
}

// ─── Tag & Document Type Management ──────────────────────────────────────────

/**
 * Get list of tags
 * @param {Object} [customConfig]
 */
export async function getTags(customConfig) {
  const { url, headers } = resolveEndpoint('/api/tags/?page_size=100', customConfig);
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Failed to fetch tags: ${res.statusText}`);
  const data = await res.json();
  return data.results || data;
}

/**
 * Create a new tag if not already existing
 * @param {string} name
 * @param {string} [color='#0088cc']
 * @param {Object} [customConfig]
 */
export async function getOrCreateTag(name, color = '#2563eb', customConfig) {
  try {
    const existing = await getTags(customConfig);
    const match = existing.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (match) return match;

    const { url, headers } = resolveEndpoint('/api/tags/', customConfig);
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, color })
    });

    if (!res.ok) throw new Error(`Failed to create tag: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Paperless] getOrCreateTag(${name}) warning:`, err);
    return null;
  }
}

/**
 * Get list of document types
 * @param {Object} [customConfig]
 */
export async function getDocumentTypes(customConfig) {
  const { url, headers } = resolveEndpoint('/api/document_types/?page_size=100', customConfig);
  const res = await fetch(url, { method: 'GET', headers });
  if (!res.ok) throw new Error(`Failed to fetch document types: ${res.statusText}`);
  const data = await res.json();
  return data.results || data;
}

/**
 * Create or get a document type
 * @param {string} name
 * @param {Object} [customConfig]
 */
export async function getOrCreateDocumentType(name, customConfig) {
  try {
    const existing = await getDocumentTypes(customConfig);
    const match = existing.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (match) return match;

    const { url, headers } = resolveEndpoint('/api/document_types/', customConfig);
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    if (!res.ok) throw new Error(`Failed to create document type: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn(`[Paperless] getOrCreateDocumentType(${name}) warning:`, err);
    return null;
  }
}

// ─── High-Level MES Convenience Workflow ──────────────────────────────────────

/**
 * Archive a completed MES report (QC Checksheet, WO Summary, or Drawing PDF)
 * Automatically ensures tags and document types exist in Paperless-ngx.
 * 
 * @param {Object} params
 * @param {Blob|File|string} params.file - Document binary or Data URI
 * @param {string} params.title - Document title (e.g. "QC Inspection - WO-2026-09-001")
 * @param {string} [params.filename]
 * @param {string} [params.woNumber] - Work Order number for auto-tagging
 * @param {string} [params.partNumber] - Part/SKU number for auto-tagging
 * @param {string} [params.docTypeName='QC Checksheet']
 * @param {string[]} [params.extraTags=[]]
 * @param {Object} [customConfig]
 */
export async function archiveMesDocument(params, customConfig) {
  const {
    file,
    title,
    filename = 'mes_report.pdf',
    woNumber,
    partNumber,
    docTypeName = 'QC Checksheet',
    extraTags = []
  } = params;

  // 1. Resolve Document Type
  let docTypeId = undefined;
  if (docTypeName) {
    const docTypeObj = await getOrCreateDocumentType(docTypeName, customConfig);
    if (docTypeObj) docTypeId = docTypeObj.id;
  }

  // 2. Resolve Tag IDs
  const rawTagNames = [
    'MAVI-MES',
    woNumber ? `WO:${woNumber}` : null,
    partNumber ? `PART:${partNumber}` : null,
    ...extraTags
  ].filter(Boolean);

  const tagIds = [];
  for (const tName of rawTagNames) {
    const tagObj = await getOrCreateTag(tName, '#0284c7', customConfig);
    if (tagObj?.id) tagIds.push(tagObj.id);
  }

  // 3. Upload to Paperless-ngx
  return await uploadDocument({
    file,
    filename,
    title: title || `MES Report ${woNumber ? `(WO ${woNumber})` : ''}`,
    documentType: docTypeId,
    tags: tagIds,
    createdDate: new Date().toISOString().split('T')[0]
  }, customConfig);
}

export default {
  getPaperlessConfig,
  savePaperlessConfig,
  testConnection,
  searchDocuments,
  getDocumentDetail,
  getDocumentPreviewUrl,
  getDocumentThumbnailUrl,
  getDocumentBlob,
  uploadDocument,
  getTaskStatus,
  pollTaskCompletion,
  getTags,
  getOrCreateTag,
  getDocumentTypes,
  getOrCreateDocumentType,
  archiveMesDocument
};
