/**
 * mavicorePLM.js
 * =====================================================
 * PLM/PDM Service for MaviCore
 * Drawing Management + Product Structure + Revision
 * =====================================================
 */

import { getSupabaseClient } from './supabaseManualDB.js';

const supabase = getSupabaseClient();

// =====================================================
// PRODUCTS
// =====================================================

export async function getProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getProducts error:', err);
    return [];
  }
}

export async function getProduct(id) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[PLM] getProduct error:', err);
    return null;
  }
}

export async function createProduct(product) {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createProduct error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateProduct(id, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateProduct error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteProduct(id) {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] deleteProduct error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// PARTS
// =====================================================

export async function getParts() {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getParts error:', err);
    return [];
  }
}

export async function getPart(id) {
  try {
    const { data, error } = await supabase
      .from('parts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[PLM] getPart error:', err);
    return null;
  }
}

export async function createPart(part) {
  try {
    const { data, error } = await supabase
      .from('parts')
      .insert(part)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createPart error:', err);
    return { success: false, error: err.message };
  }
}

export async function updatePart(id, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('parts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updatePart error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWINGS
// =====================================================

export async function getDrawings() {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getDrawings error:', err);
    return [];
  }
}

export async function getDrawing(id) {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .select(`
        *,
        drawing_revisions (*),
        drawing_relations!parent_id (
          *,
          child:drawings (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('[PLM] getDrawing error:', err);
    return null;
  }
}

export async function createDrawing(drawing) {
  try {
    const { data, error } = await supabase
      .from('drawings')
      .insert(drawing)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createDrawing error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateDrawing(id, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('drawings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateDrawing error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteDrawing(id) {
  try {
    const { error } = await supabase
      .from('drawings')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] deleteDrawing error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWING REVISIONS
// =====================================================

export async function getDrawingRevisions(drawingId) {
  try {
    const { data, error } = await supabase
      .from('drawing_revisions')
      .select('*')
      .eq('drawing_id', drawingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getDrawingRevisions error:', err);
    return [];
  }
}

export async function createDrawingRevision(revision) {
  try {
    const { data, error } = await supabase
      .from('drawing_revisions')
      .insert(revision)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createDrawingRevision error:', err);
    return { success: false, error: err.message };
  }
}

export async function releaseDrawingRevision(id, releasedBy) {
  try {
    const { data, error } = await supabase
      .from('drawing_revisions')
      .update({
        status: 'RELEASED',
        released_at: new Date().toISOString(),
        released_by: releasedBy
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] releaseDrawingRevision error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWING FILE UPLOAD
// =====================================================

/**
 * Upload drawing file to Supabase Storage
 * @param {string} revisionId - The revision ID
 * @param {File} file - The file to upload
 * @param {string} folder - Optional folder path
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function uploadDrawingFile(revisionId, file, folder = 'drawings') {
  try {
    // Validate file
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'application/pdf',
                         'image/svg+xml', 'model/gltf+json', 'model/gltf-binary'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: `Tipe file tidak didukung: ${file.type}` };
    }
    if (file.size > maxSize) {
      return { success: false, error: 'Ukuran file terlalu besar (max 50MB)' };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${folder}/${revisionId}/${timestamp}_${file.name}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawing-files')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      // If storage bucket doesn't exist, try alternative approach (base64 in database)
      console.warn('[PLM] Storage upload failed, using base64 fallback:', uploadError);
      return await uploadDrawingFileBase64(revisionId, file);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('drawing-files')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        file_url: urlData.publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        storage_path: fileName
      }
    };
  } catch (err) {
    console.error('[PLM] uploadDrawingFile error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fallback: Store file as base64 in database (when storage not available)
 */
export async function uploadDrawingFileBase64(revisionId, file) {
  try {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result;

        // Update revision with base64 data URL
        const { data, error } = await supabase
          .from('drawing_revisions')
          .update({
            file_url: base64,
            file_name: file.name,
            metadata: {
              file_type: file.type,
              file_size: file.size,
              uploaded_at: new Date().toISOString()
            }
          })
          .eq('id', revisionId)
          .select()
          .single();

        if (error) {
          resolve({ success: false, error: error.message });
        } else {
          resolve({
            success: true,
            data: {
              file_url: base64,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              is_base64: true
            }
          });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('[PLM] uploadDrawingFileBase64 error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Update revision with file info (after successful upload)
 */
export async function updateDrawingRevisionFile(revisionId, fileInfo) {
  try {
    const { data, error } = await supabase
      .from('drawing_revisions')
      .update({
        file_url: fileInfo.file_url,
        file_name: fileInfo.file_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', revisionId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateDrawingRevisionFile error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete drawing file from storage
 */
export async function deleteDrawingFile(storagePath) {
  try {
    if (!storagePath || storagePath.startsWith('data:')) {
      // It's base64 data, no need to delete from storage
      return { success: true };
    }

    const { error } = await supabase.storage
      .from('drawing-files')
      .remove([storagePath]);

    if (error) {
      console.warn('[PLM] deleteDrawingFile warning:', error);
    }
    return { success: true };
  } catch (err) {
    console.error('[PLM] deleteDrawingFile error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWING RELATIONS (Parent-Child Tree)
// =====================================================

export async function getDrawingRelations(parentId) {
  try {
    const { data, error } = await supabase
      .from('drawing_relations')
      .select(`
        *,
        child:drawings (
          *,
          drawing_revisions (*)
        )
      `)
      .eq('parent_id', parentId)
      .order('sequence', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getDrawingRelations error:', err);
    return [];
  }
}

export async function addChildDrawing(parentId, childId, relationType = 'CONTAINS') {
  try {
    const { data, error } = await supabase
      .from('drawing_relations')
      .insert({
        parent_id: parentId,
        child_id: childId,
        relation_type: relationType
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] addChildDrawing error:', err);
    return { success: false, error: err.message };
  }
}

export async function removeChildDrawing(relationId) {
  try {
    const { error } = await supabase
      .from('drawing_relations')
      .delete()
      .eq('id', relationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] removeChildDrawing error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateRelationPosition(relationId, positionX, positionY) {
  try {
    const { data, error } = await supabase
      .from('drawing_relations')
      .update({
        position_x: positionX,
        position_y: positionY,
        updated_at: new Date().toISOString()
      })
      .eq('id', relationId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateRelationPosition error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWING FEATURES (Dimensions/Measurements)
// =====================================================

export async function getDrawingFeatures(revisionId) {
  try {
    const { data, error } = await supabase
      .from('drawing_features')
      .select('*')
      .eq('drawing_revision_id', revisionId)
      .order('feature_code', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getDrawingFeatures error:', err);
    return [];
  }
}

export async function createDrawingFeature(feature) {
  try {
    const { data, error } = await supabase
      .from('drawing_features')
      .insert(feature)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createDrawingFeature error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateDrawingFeature(id, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('drawing_features')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateDrawingFeature error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteDrawingFeature(id) {
  try {
    const { error } = await supabase
      .from('drawing_features')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] deleteDrawingFeature error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// DRAWING BALLOONS
// =====================================================

export async function getDrawingBalloons(revisionId) {
  try {
    const { data, error } = await supabase
      .from('drawing_balloons')
      .select(`
        *,
        target_feature:drawing_features (*),
        target_part:parts (*)
      `)
      .eq('drawing_revision_id', revisionId)
      .order('balloon_number', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getDrawingBalloons error:', err);
    return [];
  }
}

export async function createDrawingBalloon(balloon) {
  try {
    const { data, error } = await supabase
      .from('drawing_balloons')
      .insert(balloon)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] createDrawingBalloon error:', err);
    return { success: false, error: err.message };
  }
}

export async function updateDrawingBalloon(id, updates) {
  try {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('drawing_balloons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] updateDrawingBalloon error:', err);
    return { success: false, error: err.message };
  }
}

export async function deleteDrawingBalloon(id) {
  try {
    const { error } = await supabase
      .from('drawing_balloons')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] deleteDrawingBalloon error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// INSPECTION LINKS
// =====================================================

export async function getInspectionLinks(balconId) {
  try {
    const { data, error } = await supabase
      .from('inspection_links')
      .select('*')
      .eq('drawing_balloon_id', balconId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getInspectionLinks error:', err);
    return [];
  }
}

export async function linkToInspector(balconId, inspectorTemplateId) {
  try {
    const { data, error } = await supabase
      .from('drawing_balloons')
      .update({ linked_inspector_id: inspectorTemplateId })
      .eq('id', balconId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] linkToInspector error:', err);
    return { success: false, error: err.message };
  }
}

export async function linkToChecksheet(balconId, checksheetId) {
  try {
    const { data, error } = await supabase
      .from('drawing_balloons')
      .update({ linked_checksheet_id: checksheetId })
      .eq('id', balconId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] linkToChecksheet error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

/**
 * Generate unique code for product/part/drawing
 */
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

/**
 * Get complete drawing tree (recursive)
 */
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

      return {
        ...d,
        children
      };
    };

    return await buildTree(drawing);
  } catch (err) {
    console.error('[PLM] getDrawingTree error:', err);
    return null;
  }
}

/**
 * Search drawings/part/products
 */
export async function searchPLM(query) {
  try {
    const [products, parts, drawings] = await Promise.all([
      supabase.from('products').select('*').or(`name.ilike.%${query}%,code.ilike.%${query}%`),
      supabase.from('parts').select('*').or(`name.ilike.%${query}%,code.ilike.%${query}%`),
      supabase.from('drawings').select('*').or(`name.ilike.%${query}%,code.ilike.%${query}%`)
    ]);

    return {
      products: products.data || [],
      parts: parts.data || [],
      drawings: drawings.data || []
    };
  } catch (err) {
    console.error('[PLM] searchPLM error:', err);
    return { products: [], parts: [], drawings: [] };
  }
}

// =====================================================
// PRODUCT PARTS (BOM - BILL OF MATERIALS)
// =====================================================

export async function getProductParts(productId) {
  try {
    const { data, error } = await supabase
      .from('product_parts')
      .select(`
        *,
        part:parts (*)
      `)
      .eq('product_id', productId)
      .order('position', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM] getProductParts error:', err);
    return [];
  }
}

export async function addProductPart(productPart) {
  try {
    const { data, error } = await supabase
      .from('product_parts')
      .insert(productPart)
      .select(`
        *,
        part:parts (*)
      `)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM] addProductPart error:', err);
    return { success: false, error: err.message };
  }
}

export async function removeProductPart(id) {
  try {
    const { error } = await supabase
      .from('product_parts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('[PLM] removeProductPart error:', err);
    return { success: false, error: err.message };
  }
}

export default {
  // Products
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  // Parts
  getParts, getPart, createPart, updatePart,
  // Product Parts (BOM)
  getProductParts, addProductPart, removeProductPart,
  // Drawings
  getDrawings, getDrawing, createDrawing, updateDrawing, deleteDrawing,
  // Revisions
  getDrawingRevisions, createDrawingRevision, releaseDrawingRevision,
  // Relations
  getDrawingRelations, addChildDrawing, removeChildDrawing, updateRelationPosition,
  // Features
  getDrawingFeatures, createDrawingFeature, updateDrawingFeature, deleteDrawingFeature,
  // Balloons
  getDrawingBalloons, createDrawingBalloon, updateDrawingBalloon, deleteDrawingBalloon,
  // Inspection
  getInspectionLinks, linkToInspector, linkToChecksheet,
  // Utilities
  generateCode, getDrawingTree, searchPLM
};
