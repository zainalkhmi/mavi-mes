/**
 * mavicorePLM.js
 * =====================================================
 * PLM/PDM Service for MaviCore
 * Drawing Management + Product Structure + Revision
 * RESILIENT: Supabase Database + Dexie IndexedDB (No 5MB Quota Limit) + LocalStorage Fallback
 * =====================================================
 */

import { getSupabaseClient, uploadManualMedia } from './supabaseManualDB.js';
import { saveTemplates } from './supabaseTemplateDB.js';
import Dexie from 'dexie';

// ─── Dedicated IndexedDB for PLM & Drawings (Virtually Unlimited Quota) ───
export const plmLocalDB = typeof window !== 'undefined' ? new Dexie('mandor_plm_local_db') : null;
if (plmLocalDB) {
  plmLocalDB.version(1).stores({
    products: 'id, name, code, updated_at',
    parts: 'id, name, code, part_type, updated_at',
    drawings: 'id, name, code, drawing_type, updated_at',
    drawing_revisions: 'id, drawing_id, revision_code, status, updated_at',
    drawing_balloons: 'id, drawing_revision_id, balloon_number',
    drawing_features: 'id, drawing_revision_id, feature_code',
    drawing_relations: 'id, parent_drawing_id, child_drawing_id'
  });
}

// ─── Config ────────────────────────────────────────────
const DEFAULT_PAGE_SIZE = 20;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Memory Cache ─────────────────────────────────────
const cache = new Map();

const getCacheKey = (prefix, id) => `${prefix}:${id || 'list'}`;

const getCached = (prefix, id) => {
  const key = getCacheKey(prefix, id);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCache = (prefix, id, data) => {
  const key = getCacheKey(prefix, id);
  cache.set(key, { data, timestamp: Date.now() });
};

const invalidateCache = (prefix) => {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix + ':')) {
      cache.delete(key);
    }
  }
};

// ─── Client Helper ────────────────────────────────────
const getClient = () => {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
};

// ─── Local Fallback Storage Helpers (IndexedDB + Safe LocalStorage) ───────────────────
export async function getLocal(key, fallback = []) {
  if (plmLocalDB && plmLocalDB[key]) {
    try {
      const idbList = await plmLocalDB[key].toArray();
      if (idbList && idbList.length > 0) return idbList;
    } catch (e) {
      console.warn(`[PLM IndexedDB] read error for ${key}:`, e);
    }
  }
  try {
    const raw = localStorage.getItem(`mandor_plm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function setLocal(key, data) {
  // 1. Write full rich payload to IndexedDB (no 5MB quota limit)
  if (plmLocalDB && plmLocalDB[key]) {
    try {
      await plmLocalDB[key].clear();
      if (Array.isArray(data) && data.length > 0) {
        await plmLocalDB[key].bulkPut(data);
      }
    } catch (e) {
      console.warn(`[PLM IndexedDB] write error for ${key}:`, e);
    }
  }

  // 2. Write lightweight sanitized version to localStorage
  try {
    let sanitized = data;
    if (Array.isArray(data)) {
      sanitized = data.slice(0, 15).map(item => {
        const clean = { ...item };
        if (clean.file_url && clean.file_url.length > 30000) clean.file_url = null;
        if (clean.thumbnail_url && clean.thumbnail_url.length > 30000) clean.thumbnail_url = null;
        if (clean.rendered_image && clean.rendered_image.length > 30000) clean.rendered_image = null;
        return clean;
      });
    }
    localStorage.setItem(`mandor_plm_${key}`, JSON.stringify(sanitized));
  } catch (err) {
    console.warn(`[PLM LocalStorage] write error for ${key}:`, err);
  }
}

// =====================================================
// PRODUCTS
// =====================================================

export async function getProducts({ page = 0, pageSize = DEFAULT_PAGE_SIZE } = {}) {
  const cacheKey = `products:${page}:${pageSize}`;
  const cached = getCached('products', cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (client) {
    try {
      const from = page * pageSize;
      const { data, error, count } = await client
        .from('products')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (!error && data) {
        const result = { items: data, total: count || data.length, page, pageSize };
        setCache('products', cacheKey, result);
        return result;
      }
    } catch (e) {
      console.warn('[PLM] getProducts Supabase fallback:', e);
    }
  }

  const local = await getLocal('products', []);
  const result = { items: local.slice(page * pageSize, (page + 1) * pageSize), total: local.length, page, pageSize };
  setCache('products', cacheKey, result);
  return result;
}

export async function getProduct(id) {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('products').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {
      console.warn('[PLM] getProduct Supabase fallback:', e);
    }
  }
  const local = await getLocal('products', []);
  return local.find(p => p.id === id) || null;
}

export async function createProduct(product) {
  const newProduct = {
    id: product.id || `prd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...product
  };

  if (plmLocalDB) {
    try { await plmLocalDB.products.put(newProduct); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('products').insert(newProduct).select().single();
      if (!error && data) {
        invalidateCache('products');
        return { success: true, data };
      }
    } catch (e) {
      console.warn('[PLM] createProduct Supabase fallback:', e);
    }
  }

  const local = await getLocal('products', []);
  const filtered = local.filter(p => p.id !== newProduct.id);
  filtered.unshift(newProduct);
  await setLocal('products', filtered);
  invalidateCache('products');
  return { success: true, data: newProduct };
}

export async function updateProduct(id, updates) {
  const client = getClient();
  if (client) {
    try {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await client.from('products').update(updates).eq('id', id).select().single();
      if (!error && data) {
        invalidateCache('products');
        return { success: true, data };
      }
    } catch (e) {
      console.warn('[PLM] updateProduct Supabase fallback:', e);
    }
  }

  const local = await getLocal('products', []);
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    await setLocal('products', local);
    invalidateCache('products');
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Product not found' };
}

export async function deleteProduct(id) {
  if (plmLocalDB) {
    try { await plmLocalDB.products.delete(id); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('[PLM] deleteProduct Supabase fallback:', e);
    }
  }

  const local = await getLocal('products', []);
  await setLocal('products', local.filter(p => p.id !== id));
  invalidateCache('products');
  return { success: true };
}

// =====================================================
// PARTS
// =====================================================

export async function getParts() {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('parts').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getParts Supabase fallback:', err);
    }
  }

  const local = await getLocal('parts', []);
  return local;
}

export async function getPart(id) {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('parts').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getPart Supabase fallback:', err);
    }
  }

  const local = await getLocal('parts', []);
  return local.find(p => p.id === id) || null;
}

export async function createPart(part) {
  const newPart = {
    id: part.id || `prt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...part
  };

  if (plmLocalDB) {
    try { await plmLocalDB.parts.put(newPart); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('parts').insert(newPart).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createPart Supabase fallback:', err);
    }
  }

  const local = await getLocal('parts', []);
  const filtered = local.filter(p => p.id !== newPart.id);
  filtered.unshift(newPart);
  await setLocal('parts', filtered);
  return { success: true, data: newPart };
}

export async function updatePart(id, updates) {
  const client = getClient();
  if (client) {
    try {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await client.from('parts').update(updates).eq('id', id).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] updatePart Supabase fallback:', err);
    }
  }

  const local = await getLocal('parts', []);
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    await setLocal('parts', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Part not found' };
}

// =====================================================
// DRAWINGS (with pagination, search & caching)
// =====================================================

export async function getDrawings({ page = 0, pageSize = DEFAULT_PAGE_SIZE, search = '' } = {}) {
  const cacheKey = `drawings:${page}:${pageSize}:${search}`;
  const cached = getCached('drawings', cacheKey);
  if (cached) return cached;

  const client = getClient();
  if (client) {
    try {
      const from = page * pageSize;
      let query = client
        .from('drawings')
        .select('*', { count: 'exact' })
        .order('updated_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (search) {
        query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`);
      }

      const { data, error, count } = await query;
      if (!error && data && data.length > 0) {
        // Hydrate from IndexedDB for complete file_urls
        let hydrated = data;
        if (plmLocalDB) {
          try {
            const idbList = await plmLocalDB.drawings.toArray();
            const idbMap = new Map(idbList.map(x => [x.id, x]));
            hydrated = data.map(d => ({
              ...(idbMap.get(d.id) || {}),
              ...d,
              file_url: d.file_url || idbMap.get(d.id)?.file_url,
              thumbnail_url: d.thumbnail_url || idbMap.get(d.id)?.thumbnail_url
            }));
          } catch (e) {}
        }
        const result = { items: hydrated, total: count || data.length, page, pageSize };
        setCache('drawings', cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('[PLM] getDrawings Supabase fallback:', err);
    }
  }

  // Load from IndexedDB / LocalStorage
  let local = [];
  if (plmLocalDB) {
    try {
      local = await plmLocalDB.drawings.toArray();
      local.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
    } catch (e) {}
  }
  if (!local || local.length === 0) {
    local = await getLocal('drawings', []);
  }

  if (search) {
    const s = search.toLowerCase();
    local = local.filter(d => (d.name || '').toLowerCase().includes(s) || (d.code || '').toLowerCase().includes(s));
  }

  const result = {
    items: local.slice(page * pageSize, (page + 1) * pageSize),
    total: local.length,
    page,
    pageSize
  };
  setCache('drawings', cacheKey, result);
  return result;
}

export async function getDrawingsAll() {
  const res = await getDrawings({ page: 0, pageSize: 200 });
  return res.items || [];
}

export async function getDrawing(id) {
  const cached = getCached('drawing', id);
  if (cached) return cached;

  if (plmLocalDB) {
    try {
      const idbDrawing = await plmLocalDB.drawings.get(id);
      if (idbDrawing) {
        const revisions = await getDrawingRevisions(id);
        return { ...idbDrawing, drawing_revisions: revisions };
      }
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawings')
        .select(`*, drawing_revisions (*)`)
        .eq('id', id)
        .single();

      if (!error && data) {
        setCache('drawing', id, data);
        return data;
      }
    } catch (err) {
      console.warn('[PLM] getDrawing Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawings', []);
  const dwg = local.find(d => d.id === id) || null;
  if (dwg) {
    const revisions = (await getLocal('drawing_revisions', [])).filter(r => r.drawing_id === id);
    return { ...dwg, drawing_revisions: revisions };
  }
  return null;
}

export async function createDrawing(drawing) {
  const newDrawing = {
    id: drawing.id || `dwg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    code: drawing.code || `DRW-${Date.now().toString(36).toUpperCase()}`,
    name: drawing.name || 'Untitled Drawing',
    drawing_type: drawing.drawing_type || 'DETAIL',
    description: drawing.description || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...drawing
  };

  // 1. Save full rich object to IndexedDB immediately (no quota limit)
  if (plmLocalDB) {
    try {
      await plmLocalDB.drawings.put(newDrawing);
    } catch (e) {
      console.warn('[PLM IndexedDB] createDrawing error:', e);
    }
  }

  // 2. Try Supabase
  const client = getClient();
  if (client) {
    try {
      const supaPayload = { ...newDrawing };
      if (supaPayload.file_url && supaPayload.file_url.length > 200000) supaPayload.file_url = null;
      if (supaPayload.thumbnail_url && supaPayload.thumbnail_url.length > 200000) supaPayload.thumbnail_url = null;
      const { data, error } = await client.from('drawings').insert(supaPayload).select().single();
      if (!error && data) {
        invalidateCache('drawings');
        return { success: true, data: { ...newDrawing, ...data } };
      }
    } catch (err) {
      console.warn('[PLM] createDrawing Supabase fallback:', err);
    }
  }

  // 3. Fallback to sanitized LocalStorage
  const local = await getLocal('drawings', []);
  const filtered = local.filter(d => d.id !== newDrawing.id);
  filtered.unshift(newDrawing);
  await setLocal('drawings', filtered);
  invalidateCache('drawings');
  return { success: true, data: newDrawing };
}

export async function updateDrawing(id, updates) {
  const updatedItem = { ...updates, id, updated_at: new Date().toISOString() };

  if (plmLocalDB) {
    try {
      const existing = await plmLocalDB.drawings.get(id);
      await plmLocalDB.drawings.put({ ...(existing || {}), ...updatedItem });
    } catch (e) {
      console.warn('[PLM IndexedDB] updateDrawing error:', e);
    }
  }

  const client = getClient();
  if (client) {
    try {
      const supaPayload = { ...updates, updated_at: new Date().toISOString() };
      if (supaPayload.file_url && supaPayload.file_url.length > 200000) supaPayload.file_url = null;
      if (supaPayload.thumbnail_url && supaPayload.thumbnail_url.length > 200000) supaPayload.thumbnail_url = null;
      const { data, error } = await client.from('drawings').update(supaPayload).eq('id', id).select().single();
      if (!error && data) {
        invalidateCache('drawings');
        invalidateCache('drawing', id);
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[PLM] updateDrawing Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawings', []);
  const idx = local.findIndex(d => d.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    await setLocal('drawings', local);
    invalidateCache('drawings');
    invalidateCache('drawing', id);
    return { success: true, data: local[idx] };
  }
  return { success: true, data: updatedItem };
}

export async function deleteDrawing(id) {
  if (plmLocalDB) {
    try {
      await plmLocalDB.drawings.delete(id);
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('drawings').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawing Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawings', []);
  await setLocal('drawings', local.filter(d => d.id !== id));
  invalidateCache('drawings');
  invalidateCache('drawing', id);
  return { success: true };
}

// =====================================================
// DRAWING REVISIONS
// =====================================================

export async function getDrawingRevisions(drawingId) {
  if (plmLocalDB) {
    try {
      const idbRevs = await plmLocalDB.drawing_revisions.where('drawing_id').equals(drawingId).toArray();
      if (idbRevs && idbRevs.length > 0) return idbRevs;
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawing_revisions')
        .select('*')
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('[PLM] getDrawingRevisions Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_revisions', []);
  const revs = local.filter(r => r.drawing_id === drawingId);
  if (revs.length === 0) {
    return [
      {
        id: `rev_${drawingId}_A`,
        drawing_id: drawingId,
        revision_code: 'A',
        status: 'RELEASED',
        change_description: 'Initial Release Baseline',
        created_at: new Date().toISOString()
      }
    ];
  }
  return revs;
}

export async function createDrawingRevision(revision) {
  const newRev = {
    id: revision.id || `rev_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    status: revision.status || 'DRAFT',
    created_at: new Date().toISOString(),
    ...revision
  };

  if (plmLocalDB) {
    try { await plmLocalDB.drawing_revisions.put(newRev); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const supaRev = { ...newRev };
      if (supaRev.file_url && supaRev.file_url.length > 200000) supaRev.file_url = null;
      const { data, error } = await client.from('drawing_revisions').insert(supaRev).select().single();
      if (!error && data) return { success: true, data: { ...newRev, ...data } };
    } catch (err) {
      console.warn('[PLM] createDrawingRevision Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_revisions', []);
  const filtered = local.filter(r => r.id !== newRev.id);
  filtered.unshift(newRev);
  await setLocal('drawing_revisions', filtered);
  return { success: true, data: newRev };
}

export async function releaseDrawingRevision(id, releasedBy) {
  const updates = {
    status: 'RELEASED',
    released_at: new Date().toISOString(),
    released_by: releasedBy
  };

  if (plmLocalDB) {
    try {
      const existing = await plmLocalDB.drawing_revisions.get(id);
      if (existing) await plmLocalDB.drawing_revisions.put({ ...existing, ...updates });
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_revisions').update(updates).eq('id', id).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] releaseDrawingRevision Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_revisions', []);
  const idx = local.findIndex(r => r.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    await setLocal('drawing_revisions', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Revision not found' };
}

// =====================================================
// DRAWING RELATIONS (Parent-Child Tree)
// =====================================================

export async function getDrawingRelations(parentId) {
  if (plmLocalDB) {
    try {
      const idbRels = await plmLocalDB.drawing_relations.where('parent_id').equals(parentId).toArray();
      if (idbRels && idbRels.length > 0) return idbRels;
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawing_relations')
        .select(`*, child:drawings (*)`)
        .eq('parent_id', parentId)
        .order('sequence', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getDrawingRelations Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_relations', []);
  return local.filter(r => r.parent_id === parentId);
}

export async function addChildDrawing(parentId, childId, relationType = 'CONTAINS') {
  const newRel = {
    id: `rel_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    parent_id: parentId,
    child_id: childId,
    relation_type: relationType,
    created_at: new Date().toISOString()
  };

  if (plmLocalDB) {
    try { await plmLocalDB.drawing_relations.put(newRel); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_relations').insert(newRel).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] addChildDrawing Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_relations', []);
  local.push(newRel);
  await setLocal('drawing_relations', local);
  return { success: true, data: newRel };
}

export async function removeChildDrawing(relationId) {
  if (plmLocalDB) {
    try { await plmLocalDB.drawing_relations.delete(relationId); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_relations').delete().eq('id', relationId);
    } catch (err) {
      console.warn('[PLM] removeChildDrawing Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_relations', []);
  await setLocal('drawing_relations', local.filter(r => r.id !== relationId));
  return { success: true };
}

// =====================================================
// DRAWING FEATURES (Dimensions/Measurements)
// =====================================================

export async function getDrawingFeatures(revisionId) {
  if (plmLocalDB) {
    try {
      const idbFeats = await plmLocalDB.drawing_features.where('drawing_revision_id').equals(revisionId).toArray();
      if (idbFeats && idbFeats.length > 0) return idbFeats;
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawing_features')
        .select('*')
        .eq('drawing_revision_id', revisionId)
        .order('feature_code', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getDrawingFeatures Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_features', []);
  return local.filter(f => f.drawing_revision_id === revisionId);
}

export async function createDrawingFeature(feature) {
  const newFeature = {
    id: feature.id || `ft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    ...feature
  };

  if (plmLocalDB) {
    try { await plmLocalDB.drawing_features.put(newFeature); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_features').insert(newFeature).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createDrawingFeature Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_features', []);
  local.push(newFeature);
  await setLocal('drawing_features', local);
  return { success: true, data: newFeature };
}

export async function updateDrawingFeature(id, updates) {
  if (plmLocalDB) {
    try {
      const existing = await plmLocalDB.drawing_features.get(id);
      if (existing) await plmLocalDB.drawing_features.put({ ...existing, ...updates });
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await client.from('drawing_features').update(updates).eq('id', id).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] updateDrawingFeature Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_features', []);
  const idx = local.findIndex(f => f.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    await setLocal('drawing_features', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Feature not found' };
}

export async function deleteDrawingFeature(id) {
  if (plmLocalDB) {
    try { await plmLocalDB.drawing_features.delete(id); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_features').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawingFeature Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_features', []);
  await setLocal('drawing_features', local.filter(f => f.id !== id));
  return { success: true };
}

// =====================================================
// DRAWING BALLOONS
// =====================================================

export async function getDrawingBalloons(revisionId) {
  if (plmLocalDB) {
    try {
      const idbBalloons = await plmLocalDB.drawing_balloons.where('drawing_revision_id').equals(revisionId).toArray();
      if (idbBalloons && idbBalloons.length > 0) return idbBalloons;
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawing_balloons')
        .select(`*, target_feature:drawing_features (*), target_part:parts (*)`)
        .eq('drawing_revision_id', revisionId)
        .order('balloon_number', { ascending: true });

      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getDrawingBalloons Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_balloons', []);
  return local.filter(b => b.drawing_revision_id === revisionId);
}

export async function createDrawingBalloon(balloon) {
  const newBalloon = {
    id: balloon.id || `bal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    ...balloon
  };

  if (plmLocalDB) {
    try { await plmLocalDB.drawing_balloons.put(newBalloon); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_balloons').insert(newBalloon).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createDrawingBalloon Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_balloons', []);
  local.push(newBalloon);
  await setLocal('drawing_balloons', local);
  return { success: true, data: newBalloon };
}

export async function updateDrawingBalloon(id, updates) {
  if (plmLocalDB) {
    try {
      const existing = await plmLocalDB.drawing_balloons.get(id);
      if (existing) await plmLocalDB.drawing_balloons.put({ ...existing, ...updates });
    } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await client.from('drawing_balloons').update(updates).eq('id', id).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] updateDrawingBalloon Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_balloons', []);
  const idx = local.findIndex(b => b.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    await setLocal('drawing_balloons', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Balloon not found' };
}

export async function deleteDrawingBalloon(id) {
  if (plmLocalDB) {
    try { await plmLocalDB.drawing_balloons.delete(id); } catch (e) {}
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_balloons').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawingBalloon Supabase fallback:', err);
    }
  }

  const local = await getLocal('drawing_balloons', []);
  await setLocal('drawing_balloons', local.filter(b => b.id !== id));
  return { success: true };
}

// =====================================================
// INSPECTION LINKS
// =====================================================

export async function getInspectionLinks(balloonId) {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('inspection_links').select('*').eq('drawing_balloon_id', balloonId);
      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getInspectionLinks Supabase fallback:', err);
    }
  }
  return [];
}

export async function linkToInspector(balloonId, inspectorTemplateId) {
  return await updateDrawingBalloon(balloonId, { linked_inspector_id: inspectorTemplateId });
}

export async function linkToChecksheet(balloonId, checksheetId) {
  return await updateDrawingBalloon(balloonId, { linked_checksheet_id: checksheetId });
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export function generateCode(prefix, existingCodes = []) {
  const timestamp = Date.now().toString(36).toUpperCase();
  let code = `${prefix}-${timestamp}`;
  let counter = 1;

  while (existingCodes.includes(code)) {
    code = `${prefix}-${timestamp}-${counter}`;
    counter++;
  }

  return code;
}

export async function getDrawingTree(drawingId) {
  try {
    const drawing = await getDrawing(drawingId);
    if (!drawing) return null;

    const buildTree = async (d) => {
      const relations = await getDrawingRelations(d.id);
      const children = [];

      for (const rel of relations) {
        if (rel.child) {
          const childTree = await buildTree(rel.child);
          children.push({
            ...childTree,
            relationId: rel.id,
            relationType: rel.relation_type,
            quantity: rel.quantity,
            position: { x: rel.position_x, y: rel.position_y }
          });
        }
      }

      return { ...d, children };
    };

    return await buildTree(drawing);
  } catch (err) {
    console.error('[PLM] getDrawingTree error:', err);
    return null;
  }
}

export async function searchPLM(query) {
  const q = (query || '').toLowerCase();
  const [productsRes, parts, drawingsRes] = await Promise.all([
    getProducts({ page: 0, pageSize: 100 }),
    getParts(),
    getDrawings({ page: 0, pageSize: 100 })
  ]);

  return {
    products: (productsRes.items || []).filter(p => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)),
    parts: parts.filter(p => (p.name || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q)),
    drawings: (drawingsRes.items || []).filter(d => (d.name || '').toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q))
  };
}

export async function clearAllDrawings() {
  if (plmLocalDB) {
    try {
      await plmLocalDB.drawings.clear();
      await plmLocalDB.drawing_revisions.clear();
      await plmLocalDB.drawing_balloons.clear();
      await plmLocalDB.drawing_features.clear();
      await plmLocalDB.drawing_relations.clear();
      await plmLocalDB.parts.clear();
    } catch (e) {
      console.warn('[PLM IndexedDB] clear error:', e);
    }
  }

  const client = getClient();
  if (client) {
    try {
      await client.from('drawings').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('drawing_revisions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('drawing_balloons').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('drawing_features').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await client.from('drawing_relations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.warn('[PLM Supabase] clear error:', e);
    }
  }

  await setLocal('drawings', []);
  await setLocal('drawing_revisions', []);
  await setLocal('drawing_balloons', []);
  await setLocal('drawing_features', []);
  await setLocal('drawing_relations', []);
  await setLocal('parts', []);
  invalidateCache('drawings');
  invalidateCache('products');
  return { success: true };
}

// ─── Limit Sample (Sample Batas / Boundary Sample) Management ───
export async function getLimitSamples(drawingOrPartId) {
  if (plmLocalDB) {
    try {
      if (plmLocalDB.limit_samples) {
        let results = [];
        if (drawingOrPartId) {
          results = await plmLocalDB.limit_samples
            .filter(ls => ls.drawing_id === drawingOrPartId || ls.part_id === drawingOrPartId)
            .toArray();
        } else {
          results = await plmLocalDB.limit_samples.toArray();
        }
        if (results.length > 0) return results;
      }
    } catch (e) {
      console.warn('[PLM IndexedDB] getLimitSamples error:', e);
    }
  }

  // LocalStorage Fallback
  try {
    const key = drawingOrPartId ? `mandor_limit_samples_${drawingOrPartId}` : 'mandor_limit_samples_all';
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.warn('[PLM LocalStorage] getLimitSamples error:', e);
  }
  return [];
}

export async function createLimitSample(data) {
  const item = {
    id: data.id || `ls_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    code: data.code || `LS-${Date.now().toString().slice(-4)}`,
    title: data.title || 'Limit Sample Visual',
    defect_category: data.defect_category || 'SCRATCH', // SCRATCH | BURR | DENT | BLOWHOLE | COLOR | FLASH | OTHER
    drawing_id: data.drawing_id || null,
    part_id: data.part_id || null,
    ok_photo_url: data.ok_photo_url || null,
    ok_criteria: data.ok_criteria || 'Batas maksimal cacat visual yang masih dapat diterima fungsi rakitan.',
    ng_photo_url: data.ng_photo_url || null,
    ng_criteria: data.ng_criteria || 'Batas minimal cacat visual yang wajib di-reject / tidak boleh lolos.',
    status: data.status || 'ACTIVE', // ACTIVE | EXPIRING_SOON | EXPIRED | UNDER_REVIEW
    effective_date: data.effective_date || new Date().toISOString().split('T')[0],
    expiry_date: data.expiry_date || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], // 6 months validity
    storage_location: data.storage_location || 'Rak QC Metrologi #01',
    qa_approver: data.qa_approver || 'QA Manager',
    customer_approver: data.customer_approver || 'Customer Quality Rep',
    notes: data.notes || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (plmLocalDB && plmLocalDB.limit_samples) {
    try {
      await plmLocalDB.limit_samples.put(item);
    } catch (e) {}
  }

  try {
    const targetKey = item.drawing_id ? `mandor_limit_samples_${item.drawing_id}` : 'mandor_limit_samples_all';
    const existing = JSON.parse(localStorage.getItem(targetKey) || '[]');
    existing.unshift(item);
    localStorage.setItem(targetKey, JSON.stringify(existing));
  } catch (e) {}

  return { success: true, data: item };
}

export async function updateLimitSample(id, updates, drawingId) {
  const targetKey = drawingId ? `mandor_limit_samples_${drawingId}` : 'mandor_limit_samples_all';
  try {
    const existing = JSON.parse(localStorage.getItem(targetKey) || '[]');
    const updatedList = existing.map(item => item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item);
    localStorage.setItem(targetKey, JSON.stringify(updatedList));
  } catch (e) {}

  return { success: true };
}

export async function deleteLimitSample(id, drawingId) {
  const targetKey = drawingId ? `mandor_limit_samples_${drawingId}` : 'mandor_limit_samples_all';
  try {
    const existing = JSON.parse(localStorage.getItem(targetKey) || '[]');
    const filtered = existing.filter(item => item.id !== id);
    localStorage.setItem(targetKey, JSON.stringify(filtered));
  } catch (e) {}

  return { success: true };
}

/**
 * Save complete drawing data (drawing, revision, balloons, features, part relations, blueprint)
 * to Supabase tables, Supabase storage, and Supabase inspector templates with local fallback.
 */
export async function saveDrawingWithParametersToSupabase({
  drawing,
  revision,
  balloons = [],
  features = [],
  part = null,
  relations = [],
  limitSamples = [],
  blueprintImage = null
}) {
  if (!drawing || !drawing.id) {
    return { success: false, error: 'Drawing data tidak valid atau belum dipilih' };
  }

  const client = getClient();
  let cloudFileUrl = drawing.file_url || null;

  // 1. Upload Blueprint to Supabase Storage if it's a data URL / local blob
  if (blueprintImage && (blueprintImage.startsWith('data:') || blueprintImage.startsWith('blob:'))) {
    try {
      const ext = (drawing.file_type || 'png').toLowerCase();
      const storagePath = `drawings/${drawing.code || 'DRW'}_${Date.now()}.${ext}`;
      const uploadedUrl = await uploadManualMedia(storagePath, blueprintImage);
      if (uploadedUrl) {
        cloudFileUrl = uploadedUrl;
      }
    } catch (storageErr) {
      console.warn('[PLM] Supabase storage upload fallback:', storageErr?.message || storageErr);
    }
  }

  // 2. Prepare Drawing Payload
  const drawingId = drawing.id;
  const now = new Date().toISOString();
  const drawingPayload = {
    id: drawingId,
    code: drawing.code || `DRW-${Date.now().toString(36).toUpperCase()}`,
    name: drawing.name || 'Untitled Drawing',
    drawing_type: drawing.drawing_type || 'DETAIL',
    description: drawing.description || '',
    file_name: drawing.file_name || `${drawing.code || 'drawing'}.png`,
    file_type: drawing.file_type || 'PNG',
    file_size: drawing.file_size || 0,
    file_url: cloudFileUrl && cloudFileUrl.length < 200000 ? cloudFileUrl : null,
    thumbnail_url: cloudFileUrl && cloudFileUrl.length < 200000 ? cloudFileUrl : null,
    metadata: {
      ...(drawing.metadata || {}),
      part_id: part?.id || drawing.metadata?.part_id || null,
      part_code: part?.code || drawing.metadata?.part_code || null,
      part_name: part?.name || drawing.metadata?.part_name || null,
      balloons_count: balloons.length,
      features_count: features.length,
      has_cloud_file: !!cloudFileUrl,
      last_saved_to_supabase: now
    },
    updated_at: now
  };

  // 3. Upsert to Supabase 'drawings'
  let supabaseSaved = false;
  if (client) {
    try {
      const { error: dwgErr } = await client.from('drawings').upsert(drawingPayload, { onConflict: 'id' });
      if (!dwgErr) supabaseSaved = true;
      else console.warn('[PLM] Upsert drawing to Supabase warning:', dwgErr.message);
    } catch (e) {
      console.warn('[PLM] Supabase drawings upsert error:', e);
    }
  }

  // 4. Upsert Revision
  const revisionId = revision?.id || `rev_${drawingId}_${revision?.revision_code || 'A'}`;
  const revPayload = {
    id: revisionId,
    drawing_id: drawingId,
    revision_code: revision?.revision_code || 'A',
    status: revision?.status || 'DRAFT',
    description: revision?.description || 'Synchronized Revision',
    file_url: cloudFileUrl && cloudFileUrl.length < 200000 ? cloudFileUrl : null,
    metadata: {
      ...(revision?.metadata || {}),
      ecn_number: revision?.metadata?.ecn_number || `ECN-${new Date().getFullYear()}-${drawing.code || '001'}`,
      saved_at: now
    },
    updated_at: now
  };

  if (client) {
    try {
      await client.from('drawing_revisions').upsert(revPayload, { onConflict: 'id' });
    } catch (e) {
      console.warn('[PLM] Supabase revision upsert error:', e);
    }
  }

  // 5. Upsert Features (Dimensions & Tolerances)
  if (features && features.length > 0 && client) {
    for (const f of features) {
      try {
        const featPayload = {
          id: f.id || `ft_${drawingId}_${f.feature_code || Math.random().toString(36).substr(2, 6)}`,
          drawing_revision_id: revisionId,
          feature_code: f.feature_code,
          feature_name: f.feature_name || f.feature_code,
          feature_type: f.feature_type || 'DIMENSION',
          nominal_value: f.nominal_value !== undefined && f.nominal_value !== '' ? parseFloat(f.nominal_value) : null,
          upper_tolerance: f.upper_tolerance !== undefined && f.upper_tolerance !== '' ? parseFloat(f.upper_tolerance) : null,
          lower_tolerance: f.lower_tolerance !== undefined && f.lower_tolerance !== '' ? parseFloat(f.lower_tolerance) : null,
          unit: f.unit || 'mm',
          updated_at: now
        };
        await client.from('drawing_features').upsert(featPayload, { onConflict: 'id' });
      } catch (e) {
        console.warn('[PLM] Supabase feature upsert error:', e);
      }
    }
  }

  // 6. Upsert Balloons
  if (balloons && balloons.length > 0 && client) {
    for (const b of balloons) {
      try {
        const balPayload = {
          id: b.id || `bal_${drawingId}_${b.balloon_number || Math.random().toString(36).substr(2, 6)}`,
          drawing_revision_id: revisionId,
          balloon_number: String(b.balloon_number),
          position_x: b.position_x || 100,
          position_y: b.position_y || 100,
          color: b.color || '#3B82F6',
          symbol: b.symbol || 'CIRCLE',
          target_feature_id: b.target_feature_id || null,
          target_part_id: b.target_part_id || part?.id || null,
          notes: b.notes || '',
          updated_at: now
        };
        await client.from('drawing_balloons').upsert(balPayload, { onConflict: 'id' });
      } catch (e) {
        console.warn('[PLM] Supabase balloon upsert error:', e);
      }
    }
  }

  // 7. Sync to Digital Checksheet Template (inspector_templates)
  const effectiveImageUrl = cloudFileUrl || blueprintImage;
  const templatePayload = {
    id: `insp_${drawingId}`,
    name: `${drawing.name || 'Drawing'} (Rev ${revision?.revision_code || 'A'})`,
    docNo: drawing.code,
    drawingNo: drawing.code,
    partNo: part?.code || drawing.metadata?.part_code || drawing.code,
    partName: part?.name || drawing.metadata?.part_name || drawing.name,
    revisionNo: revision?.revision_code || 'A',
    drawingFileName: drawing.file_name || `${drawing.code}.png`,
    drawingImageUrl: effectiveImageUrl,
    drawingPreview: effectiveImageUrl,
    drawingSvg: effectiveImageUrl,
    drawingDataUrl: effectiveImageUrl,
    drawingId: drawingId,
    drawingName: drawing.name,
    checkPoints: (balloons && balloons.length > 0) ? balloons.map((b, i) => {
      const matchedFeat = features?.find(f => f.id === b.target_feature_id || f.feature_code === b.target_feature?.feature_code) || b.target_feature;
      return {
        id: `cp_${b.id || i}`,
        pointNumber: parseInt(b.balloon_number) || (i + 1),
        title: matchedFeat?.feature_name || `Point ${b.balloon_number || (i + 1)}`,
        category: matchedFeat?.feature_type || 'Linear Dimension',
        nominal: matchedFeat?.nominal_value !== undefined ? parseFloat(matchedFeat.nominal_value) : 0,
        tolMin: matchedFeat?.lower_tolerance !== undefined ? parseFloat(matchedFeat.lower_tolerance) : 0,
        tolMax: matchedFeat?.upper_tolerance !== undefined ? parseFloat(matchedFeat.upper_tolerance) : 0,
        unit: matchedFeat?.unit || 'mm',
        x: b.position_x || 100,
        y: b.position_y || 100,
        criticality: 'Major',
        inspectionMethod: 'Caliper'
      };
    }) : [],
    status: 'APPROVED',
    updated_at: now
  };

  try {
    await saveTemplates([templatePayload]);
  } catch (templateErr) {
    console.warn('[PLM] Template sync error:', templateErr);
  }

  // 8. Update IndexedDB & Local Storage Cache
  const fullDrawingItem = {
    ...drawing,
    ...drawingPayload,
    file_url: effectiveImageUrl,
    thumbnail_url: effectiveImageUrl
  };

  if (plmLocalDB) {
    try {
      if (plmLocalDB.drawings) await plmLocalDB.drawings.put(fullDrawingItem);
      if (plmLocalDB.drawing_revisions) await plmLocalDB.drawing_revisions.put({ ...revPayload, file_url: effectiveImageUrl });
      if (balloons.length > 0 && plmLocalDB.drawing_balloons) {
        for (const b of balloons) {
          await plmLocalDB.drawing_balloons.put({ ...b, drawing_revision_id: revisionId });
        }
      }
      if (features.length > 0 && plmLocalDB.drawing_features) {
        for (const f of features) {
          await plmLocalDB.drawing_features.put({ ...f, drawing_revision_id: revisionId });
        }
      }
    } catch (idbErr) {
      console.warn('[PLM] IndexedDB cache error:', idbErr);
    }
  }

  invalidateCache('drawings');
  invalidateCache('drawing', drawingId);

  return {
    success: true,
    supabaseSaved,
    fileUrl: effectiveImageUrl,
    cloudFileUrl,
    drawing: fullDrawingItem,
    balloonsCount: balloons.length,
    featuresCount: features.length,
    timestamp: now
  };
}

export default {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getParts, getPart, createPart, updatePart,
  getDrawings, getDrawingsAll, getDrawing, createDrawing, updateDrawing, deleteDrawing, clearAllDrawings,
  getDrawingRevisions, createDrawingRevision, releaseDrawingRevision,
  getDrawingRelations, addChildDrawing, removeChildDrawing,
  getDrawingFeatures, createDrawingFeature, updateDrawingFeature, deleteDrawingFeature,
  getDrawingBalloons, createDrawingBalloon, updateDrawingBalloon, deleteDrawingBalloon,
  getInspectionLinks, linkToInspector, linkToChecksheet,
  getLimitSamples, createLimitSample, updateLimitSample, deleteLimitSample,
  saveDrawingWithParametersToSupabase,
  generateCode, getDrawingTree, searchPLM
};
