/**
 * supabaseUtilityDB.js
 * =====================================================
 * Storage layer for MAVi Cameras and Datasets using Supabase.
 * =====================================================
 */
import { getSupabaseClient } from './supabaseManualDB.js';
import Dexie from 'dexie';

// Dedicated IndexedDB for Full Blueprint Drawings & Large CAD/PDF DataURLs
export const drawingsLocalDB = typeof window !== 'undefined' ? new Dexie('mavi_drawings_local_db') : null;
if (drawingsLocalDB) {
    drawingsLocalDB.version(1).stores({
        drawings: 'id, fileName, fileType, name, updated_at'
    });
}

// ── Cameras ──────────────────────────────────────────

export async function getAllCameras() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('cameras')
            .select('*')
            .order('name');
        if (error) throw error;
        // Sync local storage cache for offline/fallback use
        if (typeof window !== 'undefined') {
            localStorage.setItem('mavi_local_cameras', JSON.stringify(data || []));
        }
        return data || [];
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to fetch cameras from database, loading from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('mavi_local_cameras');
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to parse local cameras cache:', e);
            }
        }
        return [];
    }
}

export async function saveCamera(camera) {
    const payload = {
        name: camera.name,
        url: camera.url,
        type: camera.type,
        settings: camera.settings || {},
        updated_at: new Date().toISOString()
    };

    try {
        const supabase = getSupabaseClient();
        let result;
        if (camera.id && !String(camera.id).startsWith('local-')) {
            result = await supabase.from('cameras').update(payload).eq('id', camera.id).select().single();
        } else {
            const insertPayload = { ...payload, created_at: new Date().toISOString() };
            // If it was a local item, do not send the temporary local- id to Supabase
            if (camera.id && !String(camera.id).startsWith('local-')) {
                insertPayload.id = camera.id;
            }
            result = await supabase.from('cameras').insert(insertPayload).select().single();
        }
        if (result.error) throw result.error;
        
        // Sync local cache
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_cameras') || '[]';
                let list = JSON.parse(cachedRaw);
                const index = list.findIndex(c => c.id === camera.id || c.id === result.data.id);
                if (index !== -1) {
                    list[index] = result.data;
                } else {
                    list.push(result.data);
                }
                localStorage.setItem('mavi_local_cameras', JSON.stringify(list));
            } catch (e) {
                console.error('[Supabase Fallback] Failed to update local cache on save:', e);
            }
        }
        return result.data;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to save camera to database, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_cameras') || '[]';
                const list = JSON.parse(cachedRaw);
                let savedItem;
                
                if (camera.id) {
                    // Update existing
                    const index = list.findIndex(c => c.id === camera.id);
                    savedItem = {
                        ...camera,
                        ...payload,
                        id: camera.id
                    };
                    if (index !== -1) {
                        list[index] = savedItem;
                    } else {
                        list.push(savedItem);
                    }
                } else {
                    // Insert new
                    savedItem = {
                        ...payload,
                        id: 'local-' + Math.random().toString(36).substr(2, 9),
                        created_at: payload.updated_at
                    };
                    list.push(savedItem);
                }
                
                localStorage.setItem('mavi_local_cameras', JSON.stringify(list));
                return savedItem;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save camera locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

export async function deleteCamera(id) {
    try {
        const supabase = getSupabaseClient();
        if (id && !String(id).startsWith('local-')) {
            const { error } = await supabase.from('cameras').delete().eq('id', id);
            if (error) throw error;
        }
        
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_local_cameras') || '[]';
            const list = JSON.parse(cachedRaw);
            const newList = list.filter(c => c.id !== id);
            localStorage.setItem('mavi_local_cameras', JSON.stringify(newList));
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to delete camera from database, deleting from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_cameras') || '[]';
                const list = JSON.parse(cachedRaw);
                const newList = list.filter(c => c.id !== id);
                localStorage.setItem('mavi_local_cameras', JSON.stringify(newList));
                return true;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to delete camera locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

// ── Datasets ─────────────────────────────────────────

export async function getAllDatasets() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('datasets')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (typeof window !== 'undefined') {
            localStorage.setItem('mavi_local_datasets', JSON.stringify(data || []));
        }
        return data || [];
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to fetch datasets from database, loading from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('mavi_local_datasets');
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to parse local datasets cache:', e);
            }
        }
        return [];
    }
}

export async function saveDataset(dataset) {
    const payload = {
        name: dataset.name,
        project_name: dataset.projectName || dataset.project_name || '',
        clip_id: dataset.clipId || dataset.clip_id || '',
        folder_id: dataset.folderId || dataset.folder_id || '',
        zip_url: dataset.zipUrl || dataset.zip_url || '',
        metadata: dataset.metadata || {},
        updated_at: new Date().toISOString()
    };

    try {
        const supabase = getSupabaseClient();
        let result;
        if (dataset.id && !String(dataset.id).startsWith('local-')) {
            result = await supabase.from('datasets').update(payload).eq('id', dataset.id).select().single();
        } else {
            const insertPayload = { ...payload, created_at: new Date().toISOString() };
            if (dataset.id && !String(dataset.id).startsWith('local-')) {
                insertPayload.id = dataset.id;
            }
            result = await supabase.from('datasets').insert(insertPayload).select().single();
        }
        if (result.error) throw result.error;
        
        // Sync local cache
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_datasets') || '[]';
                let list = JSON.parse(cachedRaw);
                const index = list.findIndex(d => d.id === dataset.id || d.id === result.data.id);
                if (index !== -1) {
                    list[index] = result.data;
                } else {
                    list.push(result.data);
                }
                localStorage.setItem('mavi_local_datasets', JSON.stringify(list));
            } catch (e) {
                console.error('[Supabase Fallback] Failed to update local datasets cache on save:', e);
            }
        }
        return result.data;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to save dataset to database, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_datasets') || '[]';
                const list = JSON.parse(cachedRaw);
                let savedItem;
                
                if (dataset.id) {
                    const index = list.findIndex(d => d.id === dataset.id);
                    savedItem = {
                        ...dataset,
                        ...payload,
                        id: dataset.id
                    };
                    if (index !== -1) {
                        list[index] = savedItem;
                    } else {
                        list.push(savedItem);
                    }
                } else {
                    savedItem = {
                        ...payload,
                        id: 'local-' + Math.random().toString(36).substr(2, 9),
                        created_at: payload.updated_at
                    };
                    list.push(savedItem);
                }
                
                localStorage.setItem('mavi_local_datasets', JSON.stringify(list));
                return savedItem;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save dataset locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

export async function deleteDataset(id) {
    try {
        const supabase = getSupabaseClient();
        if (id && !String(id).startsWith('local-')) {
            const { error } = await supabase.from('datasets').delete().eq('id', id);
            if (error) throw error;
        }
        
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_local_datasets') || '[]';
            const list = JSON.parse(cachedRaw);
            const newList = list.filter(d => d.id !== id);
            localStorage.setItem('mavi_local_datasets', JSON.stringify(newList));
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to delete dataset from database, deleting from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_datasets') || '[]';
                const list = JSON.parse(cachedRaw);
                const newList = list.filter(d => d.id !== id);
                localStorage.setItem('mavi_local_datasets', JSON.stringify(newList));
                return true;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to delete dataset locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

// ── Vision Models ──────────────────────────────────────

export async function getAllVisionModels() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('vision_models')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        if (typeof window !== 'undefined') {
            localStorage.setItem('mavi_local_vision_models', JSON.stringify(data || []));
        }
        return data || [];
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to fetch vision models from database, loading from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('mavi_local_vision_models');
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to parse local vision models cache:', e);
            }
        }
        return [];
    }
}

export async function saveVisionModel(model) {
    const payload = {
        name: model.name,
        description: model.description || '',
        provider: model.provider || 'Landing AI',
        type: model.type || 'Classification',
        dataset_id: model.dataset_id || model.datasetId || null,
        dataset_name: model.dataset_name || model.datasetName || '',
        status: model.status || 'Uploading',
        classes: model.classes || [],
        metadata: model.metadata || {},
        updated_at: new Date().toISOString()
    };

    try {
        const supabase = getSupabaseClient();
        let result;
        if (model.id && !String(model.id).startsWith('local-')) {
            result = await supabase.from('vision_models').update(payload).eq('id', model.id).select().single();
        } else {
            const insertPayload = { ...payload, created_at: new Date().toISOString() };
            if (model.id && !String(model.id).startsWith('local-')) {
                insertPayload.id = model.id;
            }
            result = await supabase.from('vision_models').insert(insertPayload).select().single();
        }
        if (result.error) throw result.error;
        
        // Sync local cache
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_vision_models') || '[]';
                let list = JSON.parse(cachedRaw);
                const index = list.findIndex(m => m.id === model.id || m.id === result.data.id);
                if (index !== -1) {
                    list[index] = result.data;
                } else {
                    list.push(result.data);
                }
                localStorage.setItem('mavi_local_vision_models', JSON.stringify(list));
            } catch (e) {
                console.error('[Supabase Fallback] Failed to update local vision models cache on save:', e);
            }
        }
        return result.data;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to save vision model to database, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_vision_models') || '[]';
                const list = JSON.parse(cachedRaw);
                let savedItem;
                
                if (model.id) {
                    const index = list.findIndex(m => m.id === model.id);
                    savedItem = {
                        ...model,
                        ...payload,
                        id: model.id
                    };
                    if (index !== -1) {
                        list[index] = savedItem;
                    } else {
                        list.push(savedItem);
                    }
                } else {
                    savedItem = {
                        ...payload,
                        id: 'local-' + Math.random().toString(36).substr(2, 9),
                        created_at: payload.updated_at
                    };
                    list.push(savedItem);
                }
                
                localStorage.setItem('mavi_local_vision_models', JSON.stringify(list));
                return savedItem;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save vision model locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

export async function deleteVisionModel(id) {
    try {
        const supabase = getSupabaseClient();
        if (id && !String(id).startsWith('local-')) {
            const { error } = await supabase.from('vision_models').delete().eq('id', id);
            if (error) throw error;
        }
        
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_local_vision_models') || '[]';
            const list = JSON.parse(cachedRaw);
            const newList = list.filter(m => m.id !== id);
            localStorage.setItem('mavi_local_vision_models', JSON.stringify(newList));
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to delete vision model from database, deleting from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_vision_models') || '[]';
                const list = JSON.parse(cachedRaw);
                const newList = list.filter(m => m.id !== id);
                localStorage.setItem('mavi_local_vision_models', JSON.stringify(newList));
                return true;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to delete vision model locally:', e);
                throw err;
            }
        }
        throw err;
    }
}


// ── Live Terminal Measurements ───────────────────────

export async function saveLiveMeasurement(data) {
    const supabase = getSupabaseClient();
    const payload = {
        video_name: data.video_name || `LIVE_${new Date().getTime()}`,
        timestamp: new Date().toISOString(),
        measurements: data.measurements || {},
        cycle_data: data.cycle_data || [],
        quality_data: data.quality_data || {},
        work_order: data.work_order || '',
        narration: data.narration || 'Live Terminal Production Cycle',
        created_at: new Date().toISOString()
    };


    const saveWithPayload = async (p) => {
        return await supabase
            .from('measurements')
            .insert(p)
            .select()
            .single();
    };

    let result = await saveWithPayload(payload);

    // Robust Fallback: If quality_data or work_order columns are missing, retry without them
    if (result.error && (result.error.message?.includes('quality_data') || result.error.message?.includes('work_order'))) {
        const fallback = { ...payload };
        delete fallback.quality_data;
        delete fallback.work_order;
        result = await saveWithPayload(fallback);
    }

    if (result.error) throw result.error;
    return result.data;
}

// ── Drawings ──────────────────────────────────────────

export function safeSaveDrawingsToLocalStorage(drawingsList) {
    if (typeof window === 'undefined' || !Array.isArray(drawingsList)) return;

    // 1. Always persist complete drawings to IndexedDB (No 5MB quota limit)
    if (drawingsLocalDB) {
        try {
            drawingsLocalDB.drawings.bulkPut(drawingsList).catch(e => {
                console.warn('[IndexedDB Drawings] Bulk put error:', e);
            });
        } catch (dbErr) {
            console.warn('[IndexedDB Drawings] Error saving drawings to IndexedDB:', dbErr);
        }
    }

    // 2. Mirror ONLY essential metadata to LocalStorage (skip large dataUrl)
    // This is for quick bootstrap only, full data is in IndexedDB
    try {
        const minimalList = drawingsList.map(dwg => ({
            id: dwg.id,
            name: dwg.name,
            fileName: dwg.fileName || dwg.file_name,
            fileType: dwg.fileType || dwg.file_type,
            dimensions: dwg.dimensions,
            shapes: dwg.shapes,
            entities: dwg.entities,
            layers: dwg.layers,
            uploadedAt: dwg.uploadedAt,
            hasDataUrl: !!(dwg.dataUrl || dwg.data_url),
            updated_at: dwg.updated_at
        }));
        localStorage.setItem('mavi_drawings', JSON.stringify(minimalList));
    } catch (e) {
        // If even minimal data doesn't fit, skip LocalStorage entirely - IndexedDB has full data
        console.warn('[Storage Quota] LocalStorage full, relying on IndexedDB only:', e);
        try { localStorage.removeItem('mavi_drawings'); } catch {}
    }
}

export async function getAllDrawings() {
    let indexedDbList = [];
    if (drawingsLocalDB) {
        try {
            indexedDbList = await drawingsLocalDB.drawings.toArray();
        } catch (e) {
            console.warn('[IndexedDB Drawings] Error loading from IndexedDB:', e);
        }
    }

    // If Supabase drawings table failed in this session, merge indexedDB + local storage directly
    if (typeof window !== 'undefined' && sessionStorage.getItem('mavi_drawings_offline') === 'true') {
        let cached = [];
        try {
            const raw = localStorage.getItem('mavi_drawings');
            if (raw) cached = JSON.parse(raw);
        } catch (e) {}

        // Merge: prefer indexedDb item because it contains full dataUrl
        const map = new Map();
        (cached || []).forEach(d => { if (d && d.id) map.set(d.id, d); });
        (indexedDbList || []).forEach(d => {
            if (d && d.id) {
                const existing = map.get(d.id) || {};
                map.set(d.id, { ...existing, ...d, dataUrl: d.dataUrl || d.data_url || existing.dataUrl || existing.data_url });
            }
        });

        return Array.from(map.values());
    }

    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('drawings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        const mappedData = (data || []).map(d => {
            // Check if full dataUrl exists in IndexedDB
            const idbMatch = indexedDbList.find(x => x.id === d.id);
            return {
                ...d,
                fileName: d.file_name || d.fileName,
                fileType: d.file_type || d.fileType,
                dataUrl: d.data_url || d.dataUrl || idbMatch?.dataUrl || idbMatch?.data_url
            };
        });
        
        // Also add any local drawings that are not in supabase yet
        const dbIds = new Set(mappedData.map(d => d.id));
        indexedDbList.forEach(idbDwg => {
            if (idbDwg && idbDwg.id && !dbIds.has(idbDwg.id)) {
                mappedData.push(idbDwg);
            }
        });

        safeSaveDrawingsToLocalStorage(mappedData);
        return mappedData;
    } catch (err) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('mavi_drawings_offline', 'true');
            let cached = [];
            try {
                const raw = localStorage.getItem('mavi_drawings');
                if (raw) cached = JSON.parse(raw);
            } catch (e) {}

            const map = new Map();
            (cached || []).forEach(d => { if (d && d.id) map.set(d.id, d); });
            (indexedDbList || []).forEach(d => {
                if (d && d.id) {
                    const existing = map.get(d.id) || {};
                    map.set(d.id, { ...existing, ...d, dataUrl: d.dataUrl || d.data_url || existing.dataUrl || existing.data_url });
                }
            });

            return Array.from(map.values());
        }
        return indexedDbList || [];
    }
}

export async function saveDrawing(drawing) {
    const dwgId = drawing.id || ('dwg_custom_' + Date.now());

    // Strip ArrayBuffer properties - cannot be stored in IndexedDB/JSON
    const { _rawBuffer, rawBuffer, ...drawingWithoutBuffer } = drawing;

    const payload = {
        id: dwgId,
        name: drawingWithoutBuffer.name || 'Untitled Drawing',
        file_name: drawingWithoutBuffer.fileName || drawingWithoutBuffer.file_name || '',
        file_type: drawingWithoutBuffer.fileType || drawingWithoutBuffer.file_type || 'DXF',
        dimensions: drawingWithoutBuffer.dimensions || [],
        shapes: drawingWithoutBuffer.shapes || [],
        entities: drawingWithoutBuffer.entities || [],
        layers: drawingWithoutBuffer.layers || [],
        data_url: drawingWithoutBuffer.dataUrl || drawingWithoutBuffer.data_url || null,
        updated_at: new Date().toISOString()
    };

    // Store the original ArrayBuffer reference for session use
    const originalRawBuffer = rawBuffer || _rawBuffer;

    const savedFullItem = {
        ...drawingWithoutBuffer,
        ...payload,
        id: dwgId,
        fileName: payload.file_name,
        fileType: payload.file_type,
        dataUrl: payload.data_url,
        // Re-attach rawBuffer for session use (not stored in IndexedDB)
        _rawBuffer: originalRawBuffer
    };

    // 1. Immediately write full payload to IndexedDB (without ArrayBuffer)
    if (drawingsLocalDB) {
        try {
            // Create a clean version without ArrayBuffer for IndexedDB
            const dbSafeItem = { ...savedFullItem };
            delete dbSafeItem._rawBuffer;
            delete dbSafeItem.rawBuffer;
            await drawingsLocalDB.drawings.put(dbSafeItem);
        } catch (dbErr) {
            console.warn('[IndexedDB Drawings] Put error:', dbErr);
        }
    }

    // 2. Broadcast update event so AppBuilder, LiveTerminal, AppPlayer react immediately
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mavi_drawings_updated', { detail: savedFullItem }));
    }

    // 3. If Supabase table is offline/missing column, save locally directly to avoid network 400 error
    if (typeof window !== 'undefined' && sessionStorage.getItem('mavi_drawings_offline') === 'true') {
        try {
            const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
            const list = JSON.parse(cachedRaw);
            const index = list.findIndex(d => d.id === dwgId);
            // Create clean version without ArrayBuffer for localStorage
            const dbSafeItem = { ...savedFullItem };
            delete dbSafeItem._rawBuffer;
            delete dbSafeItem.rawBuffer;
            if (index !== -1) list[index] = dbSafeItem;
            else list.unshift(dbSafeItem);
            safeSaveDrawingsToLocalStorage(list);
            return savedFullItem;
        } catch (e) {
            console.error('[Supabase Fallback] Local save failed:', e);
            return savedFullItem;
        }
    }

    try {
        const supabase = getSupabaseClient();
        let result;
        const isRealUuid = dwgId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(dwgId);

        if (isRealUuid) {
            result = await supabase.from('drawings').update(payload).eq('id', dwgId).select().single();
        } else {
            const insertPayload = { ...payload, created_at: new Date().toISOString() };
            result = await supabase.from('drawings').insert(insertPayload).select().single();
        }
        if (result.error) throw result.error;

        // Sync local cache (strip ArrayBuffer for JSON storage)
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                let list = JSON.parse(cachedRaw);
                const mappedData = {
                    ...savedFullItem,
                    ...result.data,
                    fileName: result.data.file_name || savedFullItem.fileName,
                    fileType: result.data.file_type || savedFullItem.fileType,
                    dataUrl: result.data.data_url || savedFullItem.dataUrl
                };
                // Strip ArrayBuffer before storing in JSON
                delete mappedData._rawBuffer;
                delete mappedData.rawBuffer;
                const index = list.findIndex(d => d.id === dwgId || d.id === result.data?.id);
                if (index !== -1) list[index] = mappedData;
                else list.unshift(mappedData);
                safeSaveDrawingsToLocalStorage(list);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to update local cache on save:', e);
            }
        }
        return savedFullItem;
    } catch (err) {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('mavi_drawings_offline', 'true');
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                const list = JSON.parse(cachedRaw);
                // Strip ArrayBuffer before storing
                const dbSafeItem = { ...savedFullItem };
                delete dbSafeItem._rawBuffer;
                delete dbSafeItem.rawBuffer;
                const index = list.findIndex(d => d.id === dwgId);
                if (index !== -1) list[index] = dbSafeItem;
                else list.unshift(dbSafeItem);

                safeSaveDrawingsToLocalStorage(list);
                return savedFullItem;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save drawing locally:', e);
            }
        }
        return savedFullItem;
    }
}

export async function deleteDrawing(id) {
    // 1. Delete from IndexedDB
    if (drawingsLocalDB) {
        try {
            await drawingsLocalDB.drawings.delete(id);
        } catch (e) {}
    }

    try {
        const supabase = getSupabaseClient();
        const isRealUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
        
        if (isRealUuid) {
            const { error } = await supabase.from('drawings').delete().eq('id', id);
            if (error) throw error;
        }
        
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
            const list = JSON.parse(cachedRaw);
            const newList = list.filter(d => d.id !== id);
            safeSaveDrawingsToLocalStorage(newList);
            window.dispatchEvent(new CustomEvent('mavi_drawings_updated', { detail: { id, deleted: true } }));
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Delete drawing fallback:', err);
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
            const list = JSON.parse(cachedRaw);
            const newList = list.filter(d => d.id !== id);
            safeSaveDrawingsToLocalStorage(newList);
            window.dispatchEvent(new CustomEvent('mavi_drawings_updated', { detail: { id, deleted: true } }));
        }
        return true;
    }
}

export async function renameDrawing(id, newName) {
    try {
        const supabase = getSupabaseClient();
        const isRealUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        if (isRealUuid) {
            const { error } = await supabase.from('drawings').update({ name: newName, updated_at: new Date().toISOString() }).eq('id', id);
            if (error) throw error;
        }

        // Update local storage
        if (typeof window !== 'undefined') {
            const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
            const list = JSON.parse(cachedRaw);
            const index = list.findIndex(d => d.id === id);
            if (index !== -1) {
                list[index] = { ...list[index], name: newName };
                safeSaveDrawingsToLocalStorage(list);
            }
            window.dispatchEvent(new CustomEvent('mavi_drawings_updated', { detail: { id, renamed: true, newName } }));
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Rename drawing fallback:', err);
        // Even if DB fails, update local
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                const list = JSON.parse(cachedRaw);
                const index = list.findIndex(d => d.id === id);
                if (index !== -1) {
                    list[index] = { ...list[index], name: newName };
                    safeSaveDrawingsToLocalStorage(list);
                }
            } catch (e) {}
        }
        return true;
    }
}

// ── Calibration Logs ──────────────────────────────────────

export async function getAllCalibrationLogs() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('calibration_logs')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        // Sync local storage cache for offline/fallback use
        if (typeof window !== 'undefined') {
            localStorage.setItem('mavi_local_calibration_logs', JSON.stringify(data || []));
        }
        return data || [];
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to fetch calibration logs from database, loading from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('mavi_local_calibration_logs');
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to parse local calibration logs cache:', e);
            }
        }
        return [];
    }
}

export async function addCalibrationLog(log) {
    const payload = {
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        operator: log.operator || 'System',
        camera: log.camera || 'Unknown',
        type: log.type || 'Scale Re-cal',
        rms: log.rms || '0.0 px',
        scale: log.scale || '0.0 mm/px',
        status: log.status || 'VALID',
        created_at: new Date().toISOString()
    };

    try {
        const supabase = getSupabaseClient();
        
        // Supabase Insert
        const { data, error } = await supabase.from('calibration_logs').insert(payload).select().single();
        if (error) throw error;
        
        // Sync to local storage
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_calibration_logs') || '[]';
                const list = JSON.parse(cachedRaw);
                const updatedList = list.map(item => {
                  if (item.camera === payload.camera && item.status === 'VALID') {
                    return { ...item, status: 'SUPERSEDED' };
                  }
                  return item;
                });
                updatedList.unshift(data);
                localStorage.setItem('mavi_local_calibration_logs', JSON.stringify(updatedList));
            } catch (e) {
                console.error('[Supabase Fallback] Failed to sync local storage on insert:', e);
            }
        }
        
        return data;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to add calibration log to database, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_local_calibration_logs') || '[]';
                const list = JSON.parse(cachedRaw);
                const localData = { ...payload, id: 'local-' + Date.now() };
                
                // Mark older ones as superseded locally
                const updatedList = list.map(item => {
                  if (item.camera === payload.camera && item.status === 'VALID') {
                    return { ...item, status: 'SUPERSEDED' };
                  }
                  return item;
                });
                
                updatedList.unshift(localData);
                localStorage.setItem('mavi_local_calibration_logs', JSON.stringify(updatedList));
                return localData;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save calibration log locally:', e);
                throw e;
            }
        }
        throw err;
    }
}

