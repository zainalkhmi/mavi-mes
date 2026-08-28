/**
 * supabaseTemplateDB.js
 * Cloud storage for Inspector Studio templates via Supabase
 * OPTIMIZED: Pagination + Caching
 */
import { getSupabaseAuth } from './supabaseAuth.js';

const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
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

// Table: inspector_templates
// Columns: id, name, doc_no, revision, status, template_data (jsonb), created_at, updated_at

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
        console.warn('[Supabase Templates] getTemplates failed, falling back to localStorage', e);
        const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
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

        setCache(cacheKey, data || []);
        return data || [];
    } catch (e) {
        console.warn('[Supabase Templates] getTemplatesAll failed, falling back to localStorage', e);
        return JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
    }
}

/**
 * Save all templates (full array replace)
 */
export async function saveTemplates(templates) {
    if (!templates?.length) return;
    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        // Upsert each template
        for (const t of templates) {
            await client.from('inspector_templates').upsert({
                id: t.id,
                name: t.name,
                doc_no: t.docNo || t.id,
                revision: t.revisionNo || '1.0',
                status: t.status || 'DRAFT',
                template_data: t,
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });
        }
    } catch (e) {
        console.warn('[Supabase] saveTemplates failed, trying localStorage', e);
    }

    // Save locally as fallback, but handle quota exceeded
    try {
        const data = JSON.stringify(templates);
        // If data is too large (> 4MB), keep only last 10 templates
        if (data.length > 4 * 1024 * 1024) {
            console.warn('[Templates] Data too large, trimming to last 10 templates');
            templates = templates.slice(-10);
        }
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(templates));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.message.includes('quota')) {
            console.warn('[Templates] localStorage full, trying to clear old data');
            // Try to save with fewer templates
            try {
                localStorage.setItem('mandor_inspector_templates', JSON.stringify(templates.slice(-5)));
            } catch (e2) {
                console.error('[Templates] Cannot save even 5 templates to localStorage');
            }
        } else {
            console.error('[Templates] Failed to save to localStorage:', e);
        }
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
        const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
        return local.find(t => t.id === id) || null;
    }
}

/**
 * Delete template by id
 */
export async function deleteTemplate(id) {
    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        await client.from('inspector_templates').delete().eq('id', id);
    } catch (e) {
        console.warn('[Supabase] deleteTemplate offline', e);
    }
    const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
    const filtered = local.filter(t => t.id !== id);
    localStorage.setItem('mandor_inspector_templates', JSON.stringify(filtered));
    return filtered;
}
