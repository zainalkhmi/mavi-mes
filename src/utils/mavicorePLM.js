/**
 * mavicorePLM.js
 * =====================================================
 * PLM/PDM Service for MaviCore
 * Drawing Management + Product Structure + Revision
 * RESILIENT: Supabase Database + LocalStorage Fallback
 * =====================================================
 */

import { getSupabaseClient } from './supabaseManualDB.js';

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

// ─── Local Fallback Storage Helpers ───────────────────
const getLocal = (key, fallback = []) => {
  try {
    const raw = localStorage.getItem(`mandor_plm_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setLocal = (key, data) => {
  try {
    localStorage.setItem(`mandor_plm_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn(`[PLM LocalStorage] write error for ${key}:`, err);
  }
};

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

  const local = getLocal('products', []);
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
  const local = getLocal('products', []);
  return local.find(p => p.id === id) || null;
}

export async function createProduct(product) {
  const newProduct = {
    id: product.id || `prd_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...product
  };

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

  const local = getLocal('products', []);
  local.unshift(newProduct);
  setLocal('products', local);
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

  const local = getLocal('products', []);
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal('products', local);
    invalidateCache('products');
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Product not found' };
}

export async function deleteProduct(id) {
  const client = getClient();
  if (client) {
    try {
      await client.from('products').delete().eq('id', id);
    } catch (e) {
      console.warn('[PLM] deleteProduct Supabase fallback:', e);
    }
  }

  const local = getLocal('products', []);
  setLocal('products', local.filter(p => p.id !== id));
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

  const local = getLocal('parts', [
    { id: 'prt_1', code: 'PRT-CAST-450', name: 'Housing Cover Cast Al-6061', material: 'AL-6061-T6', weight: '0.45', part_type: 'COMPONENT' },
    { id: 'prt_2', code: 'PRT-SFT-120', name: 'Precision Stepper Shaft', material: 'SUS-304', weight: '0.28', part_type: 'COMPONENT' }
  ]);
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

  const local = getLocal('parts', []);
  return local.find(p => p.id === id) || null;
}

export async function createPart(part) {
  const newPart = {
    id: part.id || `prt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...part
  };

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('parts').insert(newPart).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createPart Supabase fallback:', err);
    }
  }

  const local = getLocal('parts', []);
  local.unshift(newPart);
  setLocal('parts', local);
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

  const local = getLocal('parts', []);
  const idx = local.findIndex(p => p.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal('parts', local);
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
      if (!error && data) {
        const result = { items: data, total: count || data.length, page, pageSize };
        setCache('drawings', cacheKey, result);
        return result;
      }
    } catch (err) {
      console.warn('[PLM] getDrawings Supabase fallback:', err);
    }
  }

  let local = getLocal('drawings', [
    {
      id: 'dwg_cast_housing',
      code: 'DWG-FLG-001',
      name: 'Hydraulic Flange Housing Cover',
      drawing_type: 'DETAIL',
      description: 'Precision casting flange drawing ISO 9001 Rev 2.1',
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    }
  ]);

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

  const local = getLocal('drawings', []);
  const dwg = local.find(d => d.id === id) || null;
  if (dwg) {
    const revisions = getLocal('drawing_revisions', []).filter(r => r.drawing_id === id);
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

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawings').insert(newDrawing).select().single();
      if (!error && data) {
        invalidateCache('drawings');
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[PLM] createDrawing Supabase fallback:', err);
    }
  }

  const local = getLocal('drawings', []);
  local.unshift(newDrawing);
  setLocal('drawings', local);
  invalidateCache('drawings');
  return { success: true, data: newDrawing };
}

export async function updateDrawing(id, updates) {
  const client = getClient();
  if (client) {
    try {
      updates.updated_at = new Date().toISOString();
      const { data, error } = await client.from('drawings').update(updates).eq('id', id).select().single();
      if (!error && data) {
        invalidateCache('drawings');
        invalidateCache('drawing', id);
        return { success: true, data };
      }
    } catch (err) {
      console.warn('[PLM] updateDrawing Supabase fallback:', err);
    }
  }

  const local = getLocal('drawings', []);
  const idx = local.findIndex(d => d.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal('drawings', local);
    invalidateCache('drawings');
    invalidateCache('drawing', id);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Drawing not found' };
}

export async function deleteDrawing(id) {
  const client = getClient();
  if (client) {
    try {
      await client.from('drawings').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawing Supabase fallback:', err);
    }
  }

  const local = getLocal('drawings', []);
  setLocal('drawings', local.filter(d => d.id !== id));
  invalidateCache('drawings');
  invalidateCache('drawing', id);
  return { success: true };
}

// =====================================================
// DRAWING REVISIONS
// =====================================================

export async function getDrawingRevisions(drawingId) {
  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('drawing_revisions')
        .select('*')
        .eq('drawing_id', drawingId)
        .order('created_at', { ascending: false });

      if (!error && data) return data;
    } catch (err) {
      console.warn('[PLM] getDrawingRevisions Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_revisions', []);
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

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_revisions').insert(newRev).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createDrawingRevision Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_revisions', []);
  local.unshift(newRev);
  setLocal('drawing_revisions', local);
  return { success: true, data: newRev };
}

export async function releaseDrawingRevision(id, releasedBy) {
  const updates = {
    status: 'RELEASED',
    released_at: new Date().toISOString(),
    released_by: releasedBy
  };

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_revisions').update(updates).eq('id', id).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] releaseDrawingRevision Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_revisions', []);
  const idx = local.findIndex(r => r.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates };
    setLocal('drawing_revisions', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Revision not found' };
}

// =====================================================
// DRAWING RELATIONS (Parent-Child Tree)
// =====================================================

export async function getDrawingRelations(parentId) {
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

  const local = getLocal('drawing_relations', []);
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

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_relations').insert(newRel).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] addChildDrawing Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_relations', []);
  local.push(newRel);
  setLocal('drawing_relations', local);
  return { success: true, data: newRel };
}

export async function removeChildDrawing(relationId) {
  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_relations').delete().eq('id', relationId);
    } catch (err) {
      console.warn('[PLM] removeChildDrawing Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_relations', []);
  setLocal('drawing_relations', local.filter(r => r.id !== relationId));
  return { success: true };
}

// =====================================================
// DRAWING FEATURES (Dimensions/Measurements)
// =====================================================

export async function getDrawingFeatures(revisionId) {
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

  const local = getLocal('drawing_features', []);
  return local.filter(f => f.drawing_revision_id === revisionId);
}

export async function createDrawingFeature(feature) {
  const newFeature = {
    id: feature.id || `ft_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    ...feature
  };

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_features').insert(newFeature).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createDrawingFeature Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_features', []);
  local.push(newFeature);
  setLocal('drawing_features', local);
  return { success: true, data: newFeature };
}

export async function updateDrawingFeature(id, updates) {
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

  const local = getLocal('drawing_features', []);
  const idx = local.findIndex(f => f.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal('drawing_features', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Feature not found' };
}

export async function deleteDrawingFeature(id) {
  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_features').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawingFeature Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_features', []);
  setLocal('drawing_features', local.filter(f => f.id !== id));
  return { success: true };
}

// =====================================================
// DRAWING BALLOONS
// =====================================================

export async function getDrawingBalloons(revisionId) {
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

  const local = getLocal('drawing_balloons', []);
  return local.filter(b => b.drawing_revision_id === revisionId);
}

export async function createDrawingBalloon(balloon) {
  const newBalloon = {
    id: balloon.id || `bal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    created_at: new Date().toISOString(),
    ...balloon
  };

  const client = getClient();
  if (client) {
    try {
      const { data, error } = await client.from('drawing_balloons').insert(newBalloon).select().single();
      if (!error && data) return { success: true, data };
    } catch (err) {
      console.warn('[PLM] createDrawingBalloon Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_balloons', []);
  local.push(newBalloon);
  setLocal('drawing_balloons', local);
  return { success: true, data: newBalloon };
}

export async function updateDrawingBalloon(id, updates) {
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

  const local = getLocal('drawing_balloons', []);
  const idx = local.findIndex(b => b.id === id);
  if (idx !== -1) {
    local[idx] = { ...local[idx], ...updates, updated_at: new Date().toISOString() };
    setLocal('drawing_balloons', local);
    return { success: true, data: local[idx] };
  }
  return { success: false, error: 'Balloon not found' };
}

export async function deleteDrawingBalloon(id) {
  const client = getClient();
  if (client) {
    try {
      await client.from('drawing_balloons').delete().eq('id', id);
    } catch (err) {
      console.warn('[PLM] deleteDrawingBalloon Supabase fallback:', err);
    }
  }

  const local = getLocal('drawing_balloons', []);
  setLocal('drawing_balloons', local.filter(b => b.id !== id));
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

export default {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  getParts, getPart, createPart, updatePart,
  getDrawings, getDrawingsAll, getDrawing, createDrawing, updateDrawing, deleteDrawing,
  getDrawingRevisions, createDrawingRevision, releaseDrawingRevision,
  getDrawingRelations, addChildDrawing, removeChildDrawing,
  getDrawingFeatures, createDrawingFeature, updateDrawingFeature, deleteDrawingFeature,
  getDrawingBalloons, createDrawingBalloon, updateDrawingBalloon, deleteDrawingBalloon,
  getInspectionLinks, linkToInspector, linkToChecksheet,
  generateCode, getDrawingTree, searchPLM
};
