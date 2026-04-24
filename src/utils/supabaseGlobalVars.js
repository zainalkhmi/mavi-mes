import { getSupabaseClient } from './supabaseManualDB.js';


/**
 * Fetch all global variables for the organization.
 */
export async function listGlobalVariables() {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return [];

        const { data, error } = await supabase
            .from('global_variables')
            .select('*')
            .order('name', { ascending: true });

        if (error) {
            console.error('[GlobalVars] Fetch failed:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.warn('[Offline Mode] listGlobalVariables failed');
        return [];
    }
}

/**
 * Update or create a global variable.
 */
export async function upsertGlobalVariable(name, type, value) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('global_variables')
            .upsert({ 
                name, 
                type, 
                value: { val: value }, 
                last_updated: new Date().toISOString() 
            }, { onConflict: 'name' })
            .select()
            .single();

        if (error) {
            console.error('[GlobalVars] Upsert failed:', error);
            return null;
        }
        return data;
    } catch (err) {
        console.warn('[Offline Mode] upsertGlobalVariable failed');
        return null;
    }
}

/**
 * Subscribe to real-time changes of global variables.
 */
export function subscribeToGlobalVariables(onUpdate) {
    try {
        const supabase = getSupabaseClient();
        if (!supabase) return null;

        const channel = supabase
            .channel('global_vars_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'global_variables' }, (payload) => {
                onUpdate(payload);
            })
            .subscribe();

        return channel;
    } catch (err) {
        console.warn('[Offline Mode] subscribeToGlobalVariables failed');
        return null;
    }
}
