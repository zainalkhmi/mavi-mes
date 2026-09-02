/**
 * supabaseTemplateDB.js
 * Cloud storage + Dexie IndexedDB storage for Inspector Studio templates
 * OPTIMIZED: Pagination + Caching + IndexedDB Full Storage (No 5MB Quota Limit)
 */
import { getSupabaseAuth } from './supabaseAuth.js';
import Dexie from 'dexie';

const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

import { drawingsLocalDB } from './supabaseUtilityDB.js';

// Dedicated IndexedDB for Inspector Studio Templates (No 5MB Quota Limit)
export const templatesLocalDB = typeof window !== 'undefined' ? new Dexie('mandor_inspector_templates_db') : null;
if (templatesLocalDB) {
    templatesLocalDB.version(1).stores({
        templates: 'id, name, docNo, status, updated_at'
    });
}

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

/**
 * Sanitize templates for localStorage (strip heavy base64 to avoid quota error)
 */
export function sanitizeForLocalStorage(templates) {
    if (!Array.isArray(templates)) return [];
    return templates.slice(0, 10).map(t => {
        const clean = { ...t };
        if (clean.drawingSvg && clean.drawingSvg.length > 30000) clean.drawingSvg = null;
        if (clean.drawingDataUrl && clean.drawingDataUrl.length > 30000) clean.drawingDataUrl = null;
        if (clean.pdfData && clean.pdfData.length > 30000) clean.pdfData = null;
        if (clean.cadData && clean.cadData.length > 30000) clean.cadData = null;
        if (clean.thumbnail && clean.thumbnail.length > 30000) clean.thumbnail = null;
        return clean;
    });
}

/**
 * Safely persist templates to IndexedDB (full) and localStorage (lightweight)
 */
export async function safePersistTemplates(templates) {
    if (!Array.isArray(templates)) return;
    cache.clear();
    
    // 1. Save full rich templates to IndexedDB (virtually unlimited quota)
    // Clear first so deleted items do not persist
    if (templatesLocalDB) {
        try {
            await templatesLocalDB.templates.clear();
            if (templates.length > 0) {
                await templatesLocalDB.templates.bulkPut(templates);
            }
        } catch (dbErr) {
            console.warn('[Templates IndexedDB] Bulk put error:', dbErr);
        }
    }

    // 2. Save lightweight sanitized version to localStorage without throwing quota error
    try {
        const sanitized = sanitizeForLocalStorage(templates);
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(sanitized));
    } catch (e) {
        try {
            const minimal = sanitizeForLocalStorage(templates).slice(0, 3);
            localStorage.setItem('mandor_inspector_templates', JSON.stringify(minimal));
        } catch (e2) {
            console.warn('[Templates LocalStorage] Quota full, relying on IndexedDB:', e2);
        }
    }
}

/**
 * Safely retrieve templates from IndexedDB first, then localStorage
 */
export async function safeRetrieveLocalTemplates() {
    if (templatesLocalDB) {
        try {
            const idbList = await templatesLocalDB.templates.toArray();
            if (idbList && idbList.length > 0) {
                return idbList;
            }
        } catch (dbErr) {
            console.warn('[Templates IndexedDB] Retrieve error:', dbErr);
        }
    }
    try {
        return JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * Get templates with pagination
 * @param {object} options - { page, pageSize, search }
 */
export async function getTemplates({ page = 0, pageSize = DEFAULT_PAGE_SIZE, search = '' } = {}) {
    const cacheKey = `templates:${page}:${pageSize}:${search}`;
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        const from = page * pageSize;
        let query = client
            .from('inspector_templates')
            .select('*', { count: 'exact' })
            .order('updated_at', { ascending: false })
            .range(from, from + pageSize - 1);

        if (search) {
            query = query.or(`name.ilike.%${search}%,doc_no.ilike.%${search}%`);
        }

        const { data, error, count } = await query;
        if (error) throw error;

        const result = { items: data || [], total: count || 0, page, pageSize };
        setCache(cacheKey, result);
        return result;
    } catch (e) {
        console.warn('[Supabase Templates] getTemplates failed, falling back to local DB', e);
        const local = await safeRetrieveLocalTemplates();
        return { items: local, total: local.length, page, pageSize };
    }
}

/**
 * Get all templates (legacy - prefer paginated version)
 */
export async function getTemplatesAll() {
    const cacheKey = 'templates:all';
    const cached = getCached(cacheKey);
    if (cached) return cached;

    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        const { data, error } = await client
            .from('inspector_templates')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;

        const templates = (data || []).map(row => row.template_data || row);
        await safePersistTemplates(templates);
        setCache(cacheKey, templates);
        return templates;
    } catch (e) {
        console.warn('[Supabase Templates] getTemplatesAll failed, falling back to local DB', e);
        return await safeRetrieveLocalTemplates();
    }
}

/**
 * Save all templates (full array replace)
 */
export async function saveTemplates(templates) {
    if (!templates?.length) return;
    cache.clear();

    // 1. Immediately persist to IndexedDB + sanitized localStorage
    await safePersistTemplates(templates);

    // 2. Sanitize templates for Supabase payload
    const safeTemplates = templates.map(t => {
        if (t.drawingSvg && t.drawingSvg.length > 200000) {
            return { ...t, drawingSvg: null };
        }
        return t;
    });

    try {
        const client = getSupabaseAuth();
        if (client) {
            // Upsert each template
            for (const t of safeTemplates) {
                try {
                    const { error } = await client.from('inspector_templates').upsert({
                        id: t.id,
                        name: t.name,
                        doc_no: t.docNo || t.id,
                        revision: t.revisionNo || '1.0',
                        status: t.status || 'DRAFT',
                        template_data: t,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'id' });
                    if (error) {
                        console.warn('[Supabase] Template upsert skipped:', error.message);
                    }
                } catch (upsertErr) {
                    console.warn('[Supabase] Template upsert error:', upsertErr?.message || upsertErr);
                }
            }
        }
    } catch (e) {
        console.warn('[Supabase] saveTemplates failed, stored in local IndexedDB', e);
    }
}

/**
 * Load one template by id
 */
export async function getTemplate(id) {
    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        const { data, error } = await client
            .from('inspector_templates')
            .select('*')
            .eq('id', id)
            .single();
        if (error) throw error;
        return data?.template_data || null;
    } catch (e) {
        const local = await safeRetrieveLocalTemplates();
        return local.find(t => t.id === id) || null;
    }
}

/**
 * Delete template by id permanently across Supabase, IndexedDB, and localStorage
 */
export async function deleteTemplate(id) {
    cache.clear();
    
    // 1. Delete from Supabase
    try {
        const client = getSupabaseAuth();
        if (client) {
            await client.from('inspector_templates').delete().eq('id', id);
        }
    } catch (e) {
        console.warn('[Supabase] deleteTemplate error:', e);
    }
    
    // 2. Delete from templates IndexedDB
    if (templatesLocalDB) {
        try {
            await templatesLocalDB.templates.delete(id);
        } catch (dbErr) {
            console.warn('[Templates IndexedDB] Delete error:', dbErr);
        }
    }

    // 3. Also delete from drawings IndexedDB
    if (drawingsLocalDB) {
        try {
            await drawingsLocalDB.drawings.delete(id);
        } catch (dwgErr) {
            console.warn('[Drawings IndexedDB] Delete error:', dwgErr);
        }
    }

    // 4. Delete from drawings localStorage
    try {
        const dwgsRaw = localStorage.getItem('mandor_drawings');
        if (dwgsRaw) {
            const dwgs = JSON.parse(dwgsRaw);
            const filteredDwgs = dwgs.filter(d => d.id !== id && d.templateId !== id && d.name !== id);
            localStorage.setItem('mandor_drawings', JSON.stringify(filteredDwgs));
        }
    } catch (e) {}
    
    // 5. Delete from templates localStorage and memory
    const local = await safeRetrieveLocalTemplates();
    const filtered = local.filter(t => t.id !== id);
    await safePersistTemplates(filtered);
    return filtered;
}

/**
 * Get all checksheets for station assignments and terminal execution
 */
export async function getAllChecksheets() {
    try {
        const templates = await getTemplatesAll();
        if (Array.isArray(templates) && templates.length > 0) {
            return templates.filter(p => !p.id?.startsWith('cs-iso-00') && p.id !== 'cs-iso-001' && p.id !== 'cs-iso-002' && p.id !== 'cs-iso-003');
        }
    } catch (e) {
        console.warn('[Supabase Templates] getAllChecksheets fallback:', e);
    }
    const local = await safeRetrieveLocalTemplates();
    return (local || []).filter(p => !p.id?.startsWith('cs-iso-00') && p.id !== 'cs-iso-001' && p.id !== 'cs-iso-002' && p.id !== 'cs-iso-003');
}

