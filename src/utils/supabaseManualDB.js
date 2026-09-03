/**
 * supabaseManualDB.js
 * =====================================================
 * Single storage layer for Manual Creation using Supabase.
 * Replaces: tursoAPI.js + knowledgeBaseDB.js + tursoClient.js
 * OPTIMIZED: Pagination + Caching + Null-Safe
 * =====================================================
 */
import { getSupabaseAuth, isSupabaseReady as isAuthReady } from './supabaseAuth.js';
import { createClient } from '@supabase/supabase-js';

// ─── Config ────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Memory Cache ─────────────────────────────────────
const cache = new Map();

const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
};

const MANUAL_SUMMARY_COLUMNS = [
    'id',
    'title',
    'document_number',
    'version',
    'status',
    // 'author',
    // 'summary',
    'difficulty',
    'time_required',
    'category',
    'industry',
    'type',
    'created_at',
    'updated_at'
].join(',');

const normalizeWorkflowStatus = (status) => {
    const value = String(status || '').trim().toUpperCase();
    if (!value) return 'DRAFT';
    if (['DRAFT', 'REVIEW', 'PUBLISHED'].includes(value)) return value;
    if (['IN REVIEW', 'IN_REVIEW', 'PROPOSED'].includes(value)) return 'REVIEW';
    if (['APPROVED', 'RELEASED'].includes(value)) return 'PUBLISHED';
    return 'DRAFT';
};

function getCredentials() {
    return {
        url: import.meta.env.VITE_SUPABASE_URL || '',
        anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || ''
    };
}

// ── Singleton client ──────────────────────────────────

/**
 * Returns the Supabase JS client from supabaseAuth.js
 */
export function getSupabaseClient() {
    return getSupabaseAuth();
}

/**
 * Returns true if Supabase credentials are available.
 */
export function isSupabaseReady() {
    return isAuthReady();
}

// ── Schema columns (mirrors supabase_setup.sql) ───────
// manuals table columns:
//   id            UUID  PK  (gen_random_uuid())
//   title         TEXT  NOT NULL
//   document_number TEXT
//   version       TEXT  DEFAULT '1.0'
//   status        TEXT  DEFAULT 'Draft'
//   author        TEXT
//   summary       TEXT
//   difficulty    TEXT  DEFAULT 'Moderate'
//   time_required TEXT
//   category      TEXT
//   industry      TEXT
//   type          TEXT  DEFAULT 'manual'
//   content_json  JSONB           ← full guide snapshot
//   created_at    TIMESTAMPTZ
//   updated_at    TIMESTAMPTZ

/**
 * Insert or update a manual.
 * If `id` is provided and exists, performs an UPDATE.
 * Otherwise inserts a new row.
 *
 * @param {object} manual - Guide data from ManualCreation
 * @returns {{ id: string, updatedAt: string }}
 */
export async function upsertManual(manual) {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const row = {
        title: String(manual.title || 'Untitled Manual'),
        document_number: String(manual.documentNumber || ''),
        version: String(manual.version || '1.0'),
        status: normalizeWorkflowStatus(manual.status || 'DRAFT'),
        author: String(manual.author || ''),
        summary: String(manual.description || manual.summary || ''),
        difficulty: String(manual.difficulty || 'Moderate'),
        time_required: String(manual.timeRequired || ''),
        category: String(manual.category || 'Work Instruction'),
        industry: String(manual.industry || ''),
        type: 'manual',
        content_json: manual.content || {}, // Primary column
        updated_at: now
    };

    // Helper to perform the actual Supabase call
    const performUpsert = async (payload) => {
        if (manual.id && manual.id.includes('-')) {
            return await supabase
                .from('manuals')
                .upsert({ id: manual.id, ...payload, created_at: manual.createdAt || now }, { onConflict: 'id' })
                .select('id, updated_at')
                .single();
        } else {
            return await supabase
                .from('manuals')
                .insert({ ...payload, created_at: now })
                .select('id, updated_at')
                .single();
        }
    };

    try {
        const { data, error } = await performUpsert(row);
        if (error) {
            // Check if error is "column does not exist" for content_json
            if (error.code === '42703' && error.message?.includes('content_json')) {
                console.warn('[supabaseManualDB] content_json missing, retrying with steps column');
                const fallbackRow = { ...row, steps: manual.content || {} };
                delete fallbackRow.content_json;
                const retry = await performUpsert(fallbackRow);
                if (retry.error) throw retry.error;
                invalidateCache('manuals'); // Clear all manuals cache
                return { id: retry.data.id, updatedAt: retry.data.updated_at };
            }
            throw error;
        }
        invalidateCache('manuals'); // Clear all manuals cache
        return { id: data.id, updatedAt: data.updated_at };
    } catch (err) {
        console.error('[supabaseManualDB] Upsert failed:', err);
        throw err;
    }
}

/**
 * Fetch manuals with pagination.
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @param {object} filters - Optional filters {search, category, status}
 * @returns {{ items: Array, total: number, page: number, pageSize: number }}
 */
export async function listManuals({ page = 0, pageSize = DEFAULT_PAGE_SIZE, search = '', category = '', status = '' } = {}) {
    const supabase = getSupabaseClient();
    const cacheKey = `manuals:${page}:${pageSize}:${search}:${category}:${status}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const from = page * pageSize;
        let query = supabase
            .from('manuals')
            .select(MANUAL_SUMMARY_COLUMNS, { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(from, from + pageSize - 1);

        if (search) {
            query = query.or(`title.ilike.%${search}%,document_number.ilike.%${search}%`);
        }
        if (category) {
            query = query.eq('category', category);
        }
        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) throw error;
        const result = { items: (data || []).map(normalizeRow), total: count || 0, page, pageSize };
        setCache(cacheKey, result);
        return result;
    } catch (err) {
        console.error('[supabaseManualDB] listManuals error:', err);
        return { items: [], total: 0, page, pageSize };
    }
}

/**
 * Fetch all manuals (legacy - prefer paginated version).
 * @returns {Array}
 */
export async function listManualsAll() {
    const cacheKey = 'manuals:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('manuals')
        .select(MANUAL_SUMMARY_COLUMNS)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    const result = (data || []).map(normalizeRow);
    setCache(cacheKey, result);
    return result;
}

/**
 * Fetch lightweight manual rows for list/search views.
 * Excludes large JSON columns (content_json/steps) to reduce query cost.
 * @returns {Array}
 */
export async function listManualSummaries() {
    const cacheKey = 'manuals:summaries';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    const supabase = getSupabaseClient();

    try {
        const { data, error } = await supabase
            .from('manuals')
            .select(MANUAL_SUMMARY_COLUMNS)
            .order('updated_at', { ascending: false });

        if (error) {
            console.warn('[Offline Mode] Supabase query failed, trying cache...', error);
            throw error;
        }

        const normalized = (data || []).map(normalizeRow);
        setCache(cacheKey, normalized);

        // Also save to localStorage for offline
        if (typeof window !== 'undefined') {
            try {
                localStorage.setItem('offline_manual_summaries_cache', JSON.stringify(normalized));
            } catch (e) {}
        }
        return normalized;
    } catch (err) {
        console.warn('[Offline Mode] Manual Summaries fetch failed, returning cache or empty array');
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('offline_manual_summaries_cache');
                if (cached) return JSON.parse(cached);
            } catch (e) {}
        }
        return [];
    }
}

/**
 * Fetch a single manual by its UUID.
 * @param {string} id
 * @returns {object|null}
 */
export async function getManualById(id) {
    const supabase = getSupabaseClient();

    try {
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.warn(`[Offline Mode] Supabase query failed for Manual ${id}, trying cache...`, error);
            throw error;
        }
        
        const normalized = normalizeRow(data);
        if (typeof window !== 'undefined' && normalized) {
            localStorage.setItem(`offline_manual_cache_${id}`, JSON.stringify(normalized));
        }
        return normalized;
    } catch (err) {
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem(`offline_manual_cache_${id}`);
                if (cached) {
                    console.log(`[Offline Mode] Successfully returned Manual ${id} from local storage cache.`);
                    return JSON.parse(cached);
                }
            } catch (e) {
                console.error(`[Offline Mode] Failed to parse local storage cache for manual ${id}`, e);
            }
        }
        throw err;
    }
}

/**
 * Delete a manual by ID.
 * @param {string} id
 */
export async function deleteManual(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('manuals')
        .delete()
        .eq('id', id);

    if (error) throw error;
    invalidateCache('manuals'); // Clear all manuals cache
    return true;
}

export const getManualByCloudId = getManualById;

/**
 * Append an acknowledgement to a manual's content.
 */
export async function appendManualAcknowledgement(id, ack) {
    const manual = await getManualById(id);
    if (!manual) return null;

    const content = manual.content || {};
    if (!content.acknowledgements) content.acknowledgements = [];
    content.acknowledgements.push({
        ...ack,
        timestamp: new Date().toISOString()
    });

    return await upsertManual({ ...manual, content });
}

/**
 * Append data capture results to a manual's content.
 */
export async function appendManualDataCapture(id, capture) {
    const manual = await getManualById(id);
    if (!manual) return null;

    const content = manual.content || {};
    if (!content.dataCaptures) content.dataCaptures = [];
    content.dataCaptures.push({
        ...capture,
        timestamp: new Date().toISOString()
    });

    return await upsertManual({ ...manual, content });
}
/**
 * Upload an image (data URL or File/Blob) to Supabase Storage.
 * Returns the public URL of the uploaded file.
 *
 * OPTIMIZED: Caches working bucket to avoid trying all buckets every time
 *
 * @param {string} storagePath  e.g. "manuals/manual-uuid/step-1.jpg"
 * @param {string|Blob} fileOrDataUrl
 * @param {object} [overrideSettings]  optional {url, anonKey, bucket}
 * @returns {string} public URL
 */
export async function uploadManualImage(storagePath, fileOrDataUrl, overrideSettings = null) {
    const { url, anonKey } = overrideSettings || getCredentials();
    if (!url || !anonKey) throw new Error('Supabase not configured for storage');

    const supabase = overrideSettings
        ? createClient(url, anonKey, { auth: { persistSession: false } })
        : getSupabaseClient();

    // Read settings for bucket name
    let bucket =
        overrideSettings?.bucket ||
        import.meta.env.VITE_SUPABASE_BUCKET ||
        'manual-media';

    try {
        const raw = localStorage.getItem('supabase_storage_settings');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (!overrideSettings?.bucket) {
                bucket = parsed?.bucket || bucket;
            }
        }
    } catch { /* ignore */ }

    let fileBlob;
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
        // Convert data URL → Blob
        const [header, base64] = fileOrDataUrl.split(',');
        const mime = header.replace('data:', '').replace(';base64', '');
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        fileBlob = new Blob([bytes], { type: mime });
    } else {
        fileBlob = fileOrDataUrl; // already a Blob/File
    }

    const cleanPath = String(storagePath).replace(/^\/+/, '');

    // OPTIMIZED: Try cached bucket first, then fallback list
    const cachedBucket = localStorage.getItem('supabase_active_bucket') || bucket;
    const fallbackBuckets = ['manual-media', 'manuals', 'images'].filter(b => b !== cachedBucket);
    const candidateBuckets = [cachedBucket, ...fallbackBuckets].filter(Boolean);

    let uploadError = null;
    let activeBucket = null;

    for (const candidate of candidateBuckets) {
        const { error } = await supabase.storage.from(candidate).upload(cleanPath, fileBlob, { upsert: true });
        if (!error) {
            activeBucket = candidate;
            uploadError = null;
            // Cache successful bucket
            localStorage.setItem('supabase_active_bucket', candidate);
            break;
        }
        uploadError = error;
    }

    if (uploadError) {
        const message = String(uploadError?.message || '').toLowerCase();
        if (message.includes('bucket') && (message.includes('not found') || message.includes('does not exist'))) {
            throw new Error(
                `Supabase bucket tidak ditemukan. Coba buat bucket \"manual-media\" (public) di Supabase Storage, atau set bucket yang benar di supabase_storage_settings. Detail: ${uploadError.message}`
            );
        }
        throw uploadError;
    }

    const { data } = supabase.storage.from(activeBucket).getPublicUrl(cleanPath);
    return data.publicUrl;
}

/**
 * Universal alias for uploading media/images to Supabase Storage.
 * Supports both argument orders: (storagePath, file) or (file, storagePath).
 */
export async function uploadManualMedia(arg1, arg2, overrideSettings = null) {
    if (typeof arg1 === 'string' && (arg1.startsWith('data:') || arg1.startsWith('blob:') || arg1.length > 500)) {
        return uploadManualImage(arg2, arg1, overrideSettings);
    }
    return uploadManualImage(arg1, arg2, overrideSettings);
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * 
 * @param {string} publicUrl 
 * @returns {boolean} success
 */
export async function deleteChatMedia(publicUrl) {
    if (!publicUrl || !publicUrl.includes('/storage/v1/object/public/')) return false;
    
    try {
        const supabase = getSupabaseClient();
        const urlObj = new URL(publicUrl);
        const parts = urlObj.pathname.split('/storage/v1/object/public/');
        if (parts.length < 2) return false;
        
        const pathParts = parts[1].split('/');
        const bucket = pathParts[0];
        const path = pathParts.slice(1).join('/');
        
        const { error } = await supabase.storage.from(bucket).remove([path]);
        if (error) {
            console.warn('[Supabase Storage] Delete failed:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.warn('[Supabase Storage] URL parsing failed:', e);
        return false;
    }
}

// ── Internal helpers ──────────────────────────────────

/**
 * Normalize a Supabase row into the guide shape expected by ManualCreation.
 */
function normalizeRow(row) {
    if (!row) return null;

    const rawContent = row.content_json || row.steps || {};
    const content = typeof rawContent === 'string'
        ? safeParseJson(rawContent)
        : rawContent;

    return {
        // Top-level identity used by ManualCreation
        id: row.id,
        cloudId: row.id,   // kept for QR link compatibility
        kbId: row.id,

        // Metadata columns
        title: row.title || '',
        documentNumber: row.document_number || '',
        version: row.version || '1.0',
        status: normalizeWorkflowStatus(row.status || 'DRAFT'),
        author: row.author || '',
        description: row.summary || '',
        summary: row.summary || '',
        difficulty: row.difficulty || 'Moderate',
        timeRequired: row.time_required || '',
        category: row.category || '',
        industry: row.industry || '',
        type: row.type || 'manual',
        createdAt: row.created_at,
        updatedAt: row.updated_at,

        // Full guide content
        content
    };
}

function safeParseJson(value) {
    try { return JSON.parse(value); } catch { return {}; }
}

// ─── Cache Control ────────────────────────────────────────

/**
 * Clear all cached data
 */
export function clearAllCache() {
    cache.clear();
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem('offline_manual_summaries_cache');
            // Clear individual manual caches
            for (let i = localStorage.length - 1; i >= 0; i--) {
                const key = localStorage.key(i);
                if (key?.startsWith('offline_manual_cache_')) {
                    localStorage.removeItem(key);
                }
            }
        } catch (e) {}
    }
}

/**
 * Get cache statistics
 * @returns {{ size: number, keys: string[] }}
 */
export function getCacheStats() {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
        memoryUsage: JSON.stringify(Array.from(cache.entries())).length
    };
}
