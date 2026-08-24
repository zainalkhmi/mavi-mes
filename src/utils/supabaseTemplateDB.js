/**
 * supabaseTemplateDB.js
 * Cloud storage for Inspector Studio templates via Supabase
 */
import { createClient } from '@supabase/supabase-js';

const getClient = (() => {
    const url = 'https://pypjnzvsolxsddsqworw.supabase.co';
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5cGpuenZzb2x4c2Rkc3F3b3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTQ1MDQsImV4cCI6MjA5MjY5MDUwNH0.kjKlJu336ZqIOEk4SV7WhPrhsHzQv-rrKDh-oPasbAc';
    return createClient(url, anonKey);
})();

// Table: inspector_templates
// Columns: id, name, doc_no, revision, status, template_data (jsonb), created_at, updated_at

/**
 * Get all templates
 */
export async function getTemplates() {
    try {
        const { data, error } = await getClient()
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
        // Upsert each template
        const client = getClient();
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
        console.warn('[Supabase] saveTemplates offline fallback to localStorage', e);
    } finally {
        // Always save locally as fallback
        localStorage.setItem('mandor_inspector_templates', JSON.stringify(templates));
    }
}

/**
 * Load one template by id
 */
export async function getTemplate(id) {
    try {
        const { data, error } = await getClient()
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
        await getClient().from('inspector_templates').delete().eq('id', id);
    } catch (e) {
        console.warn('[Supabase] deleteTemplate offline', e);
    }
    const local = JSON.parse(localStorage.getItem('mandor_inspector_templates') || '[]');
    const filtered = local.filter(t => t.id !== id);
    localStorage.setItem('mandor_inspector_templates', JSON.stringify(filtered));
    return filtered;
}
