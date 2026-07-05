/**
 * supabaseUtilityDB.js
 * =====================================================
 * Storage layer for MAVi Cameras and Datasets using Supabase.
 * =====================================================
 */
import { getSupabaseClient } from './supabaseManualDB.js';

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
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('mavi_drawings', JSON.stringify(drawingsList));
    } catch (e) {
        console.warn('[Storage Quota] Failed to save full drawings, attempting to save without large images:', e);
        try {
            const minimizedList = drawingsList.map(dwg => {
                if (dwg.dataUrl && dwg.dataUrl.length > 80000) {
                    return { ...dwg, dataUrl: null, hasOmittedDataUrl: true };
                }
                if (dwg.data_url && dwg.data_url.length > 80000) {
                    return { ...dwg, data_url: null, hasOmittedDataUrl: true };
                }
                return dwg;
            });
            localStorage.setItem('mavi_drawings', JSON.stringify(minimizedList));
            console.log('[Storage Quota] Saved minimized drawings to localStorage successfully.');
        } catch (innerErr) {
            console.error('[Storage Quota] Completely failed to save drawings to localStorage:', innerErr);
        }
    }
}


export async function getAllDrawings() {
    try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
            .from('drawings')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        
        const mappedData = (data || []).map(d => ({
            ...d,
            fileName: d.file_name,
            fileType: d.file_type,
            dataUrl: d.data_url
        }));
        
        // Sync local storage cache for offline/fallback use
        safeSaveDrawingsToLocalStorage(mappedData);
        return mappedData;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to fetch drawings from database, loading from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cached = localStorage.getItem('mavi_drawings');
                if (cached) return JSON.parse(cached);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to parse local drawings cache:', e);
            }
        }
        return [];
    }
}

export async function saveDrawing(drawing) {
    const payload = {
        name: drawing.name,
        file_name: drawing.fileName || drawing.file_name || '',
        file_type: drawing.fileType || drawing.file_type || 'DXF',
        dimensions: drawing.dimensions || [],
        shapes: drawing.shapes || [],
        data_url: drawing.dataUrl || drawing.data_url || null,
        updated_at: new Date().toISOString()
    };


    try {
        const supabase = getSupabaseClient();
        let result;
        const isRealUuid = drawing.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(drawing.id);
        
        if (isRealUuid) {
            result = await supabase.from('drawings').update(payload).eq('id', drawing.id).select().single();
        } else {
            const insertPayload = { ...payload, created_at: new Date().toISOString() };
            result = await supabase.from('drawings').insert(insertPayload).select().single();
        }
        if (result.error) throw result.error;
        
        // Sync local cache
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                let list = JSON.parse(cachedRaw);
                const mappedData = {
                    ...result.data,
                    fileName: result.data.file_name,
                    fileType: result.data.file_type,
                    dataUrl: result.data.data_url
                };
                const index = list.findIndex(d => d.id === drawing.id || d.id === result.data.id);
                if (index !== -1) {
                    list[index] = mappedData;
                } else {
                    list.push(mappedData);
                }
                safeSaveDrawingsToLocalStorage(list);
            } catch (e) {
                console.error('[Supabase Fallback] Failed to update local cache on save:', e);
            }
        }
        return {
            ...result.data,
            fileName: result.data.file_name,
            fileType: result.data.file_type,
            dataUrl: result.data.data_url
        };
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to save drawing to database, saving to localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                const list = JSON.parse(cachedRaw);
                let savedItem;
                
                if (drawing.id) {
                    const index = list.findIndex(d => d.id === drawing.id);
                    savedItem = {
                        ...drawing,
                        ...payload,
                        id: drawing.id
                    };
                    if (index !== -1) {
                        list[index] = savedItem;
                    } else {
                        list.push(savedItem);
                    }
                } else {
                    savedItem = {
                        ...payload,
                        fileName: payload.file_name,
                        fileType: payload.file_type,
                        dataUrl: payload.data_url,
                        id: 'local-' + Math.random().toString(36).substr(2, 9),
                        created_at: payload.updated_at
                    };
                    list.push(savedItem);
                }
                
                safeSaveDrawingsToLocalStorage(list);
                return savedItem;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to save drawing locally:', e);
                throw err;
            }
        }
        throw err;
    }
}

export async function deleteDrawing(id) {
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
        }
        return true;
    } catch (err) {
        console.warn('[Supabase Fallback] Failed to delete drawing from database, deleting from localStorage:', err);
        if (typeof window !== 'undefined') {
            try {
                const cachedRaw = localStorage.getItem('mavi_drawings') || '[]';
                const list = JSON.parse(cachedRaw);
                const newList = list.filter(d => d.id !== id);
                safeSaveDrawingsToLocalStorage(newList);
                return true;
            } catch (e) {
                console.error('[Supabase Fallback] Failed to delete drawing locally:', e);
                throw err;
            }
        }
        throw err;
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

