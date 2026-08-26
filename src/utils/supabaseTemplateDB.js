/**
 * supabaseTemplateDB.js
 * Cloud storage for Inspector Studio templates via Supabase
 */
import { getSupabaseAuth } from './supabaseAuth.js';

// Table: inspector_templates
// Columns: id, name, doc_no, revision, status, template_data (jsonb), created_at, updated_at

/**
 * Get all templates
 */
export async function getTemplates() {
    try {
        const client = getSupabaseAuth();
        if (!client) throw new Error('Supabase not configured');

        const { data, error } = await client
            .from('inspector_templates')
            .select('*')
            .order('updated_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        console.warn('[Supabase Templates] getTemplates failed, falling back to localStorage', e);
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
