/**
 * PLM Integration Service
 * Deep integration between Drawing Management, Inspector Designer, and Digital Check Sheet
 */

import { getSupabaseClient } from './supabaseManualDB.js';

const supabase = getSupabaseClient();

// =====================================================
// INSPECTION LINKS MANAGEMENT
// =====================================================

/**
 * Link a balloon to an Inspector Designer template
 */
export async function linkBalloonToInspector(balconId, inspectorTemplateId) {
  try {
    // Update balloon with inspector link
    const { error: balloonError } = await supabase
      .from('drawing_balloons')
      .update({ linked_inspector_id: inspectorTemplateId })
      .eq('id', balconId);

    if (balloonError) throw balloonError;

    // Create inspection link record
    const { data: linkData, error: linkError } = await supabase
      .from('inspection_links')
      .insert({
        drawing_balloon_id: balconId,
        inspector_template_id: inspectorTemplateId,
        is_required: true
      })
      .select()
      .single();

    if (linkError) throw linkError;

    return { success: true, data: linkData };
  } catch (err) {
    console.error('[PLM Integration] linkBalloonToInspector error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Link a balloon to a Digital Check Sheet
 */
export async function linkBalloonToChecksheet(balconId, checksheetId) {
  try {
    const { data, error } = await supabase
      .from('inspection_links')
      .insert({
        drawing_balloon_id: balconId,
        checksheet_id: checksheetId,
        is_required: true
      })
      .select()
      .single();

    if (error) throw error;

    // Also update balloon
    await supabase
      .from('drawing_balloons')
      .update({ linked_checksheet_id: checksheetId })
      .eq('id', balconId);

    return { success: true, data };
  } catch (err) {
    console.error('[PLM Integration] linkBalloonToChecksheet error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get all inspection links for a drawing revision
 */
export async function getInspectionLinksByRevision(revisionId) {
  try {
    const { data, error } = await supabase
      .from('inspection_links')
      .select(`
        *,
        balloon:drawing_balloons (
          id,
          balloon_number,
          position_x,
          position_y,
          color,
          symbol
        ),
        feature:drawing_features (
          id,
          feature_code,
          feature_name,
          nominal_value,
          upper_tolerance,
          lower_tolerance,
          unit
        )
      `)
      .eq('balloon.drawing_revision_id', revisionId);

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM Integration] getInspectionLinksByRevision error:', err);
    return [];
  }
}

/**
 * Get inspection history for a balloon
 */
export async function getInspectionHistory(balconId) {
  try {
    const { data, error } = await supabase
      .from('inspection_results')
      .select('*')
      .eq('balloon_id', balconId)
      .order('inspected_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[PLM Integration] getInspectionHistory error:', err);
    return [];
  }
}

// =====================================================
// AUTO-GENERATE INSPECTOR FROM BALLOONS
// =====================================================

/**
 * Generate Inspector Designer template from drawing balloons
 */
export async function generateInspectorFromBalloons(revisionId, drawingInfo) {
  try {
    // Get all balloons for this revision
    const balloons = await supabase
      .from('drawing_balloons')
      .select(`
        *,
        feature:drawing_features (
          id,
          feature_code,
          feature_name,
          feature_type,
          nominal_value,
          upper_tolerance,
          lower_tolerance,
          unit
        )
      `)
      .eq('drawing_revision_id', revisionId);

    if (balloons.error) throw balloons.error;

    // Generate inspection points from balloons
    const points = balloons.data.map((balloon, index) => {
      const feature = balloon.feature;
      return {
        id: `point_${Date.now()}_${index}`,
        name: feature?.feature_name || `Inspection Point ${balloon.balloon_number}`,
        pointNo: balloon.balloon_number,
        nominalValue: feature?.nominal_value || '',
        upperTolerance: feature?.upper_tolerance || '',
        lowerTolerance: feature?.lower_tolerance || '',
        unit: feature?.unit || 'mm',
        position: { x: balloon.position_x, y: balloon.position_y },
        balloonId: balloon.id,
        featureId: feature?.id || null,
        type: 'MEASUREMENT',
        isRequired: true,
        hasPhoto: false,
        hasNotes: true,
      };
    });

    // Generate inspector template data
    const inspectorTemplate = {
      id: `inspector_${Date.now()}`,
      name: `${drawingInfo.name} - Inspection Template`,
      version: '1.0',
      status: 'DRAFT',
      points: points,
      drawingCode: drawingInfo.code,
      drawingRevision: drawingInfo.currentRevision,
      createdFrom: 'PLM_AUTO_GENERATE',
      sourceRevisionId: revisionId,
      organization: drawingInfo.organization || 'Default',
      createdAt: new Date().toISOString(),
    };

    return { success: true, data: inspectorTemplate, points };
  } catch (err) {
    console.error('[PLM Integration] generateInspectorFromBalloons error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate Digital Check Sheet from drawing balloons
 */
export async function generateCheckSheetFromBalloons(revisionId, drawingInfo) {
  try {
    const balloons = await supabase
      .from('drawing_balloons')
      .select(`
        *,
        feature:drawing_features (
          feature_name,
          nominal_value,
          upper_tolerance,
          lower_tolerance,
          unit
        )
      `)
      .eq('drawing_revision_id', revisionId);

    if (balloons.error) throw balloons.error;

    const items = balloons.data.map((balloon, index) => {
      const feature = balloon.feature;
      const spec = feature?.nominal_value
        ? `${feature.nominal_value} ${feature.unit || 'mm'}`
        : 'N/A';
      const tolerance = feature?.upper_tolerance && feature?.lower_tolerance
        ? `± ${feature.upper_tolerance} ${feature.unit || 'mm'}`
        : 'N/A';

      return {
        id: `item_${Date.now()}_${index}`,
        name: feature?.feature_name || `Point ${balloon.balloon_number}`,
        spec: spec,
        tolerance: tolerance,
        balloonNumber: balloon.balloon_number,
        balloonId: balloon.id,
        type: 'MEASUREMENT',
        required: true,
      };
    });

    const checkSheet = {
      id: `checksheet_${Date.now()}`,
      name: `${drawingInfo.name} - Check Sheet`,
      workOrder: `WO-${Date.now().toString(36).toUpperCase()}`,
      items: items,
      drawingCode: drawingInfo.code,
      sourceRevisionId: revisionId,
      status: 'DRAFT',
      createdAt: new Date().toISOString(),
    };

    return { success: true, data: checkSheet, items };
  } catch (err) {
    console.error('[PLM Integration] generateCheckSheetFromBalloons error:', err);
    return { success: false, error: err.message };
  }
}

// =====================================================
// INSPECTION RESULTS SYNC
// =====================================================

/**
 * Save inspection result and link back to balloon
 */
export async function saveInspectionResult(inspectionData) {
  try {
    const { data, error } = await supabase
      .from('inspection_results')
      .insert({
        balloon_id: inspectionData.balloonId,
        feature_id: inspectionData.featureId,
        inspector_template_id: inspectionData.templateId,
        checksheet_id: inspectionData.checksheetId,
        result_value: inspectionData.resultValue,
        result_status: inspectionData.status, // 'OK', 'NG', 'SKIP'
        notes: inspectionData.notes,
        photo_url: inspectionData.photoUrl,
        inspected_by: inspectionData.inspectedBy,
        inspected_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('[PLM Integration] saveInspectionResult error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get inspection statistics for a drawing revision
 */
export async function getRevisionInspectionStats(revisionId) {
  try {
    const balloons = await supabase
      .from('drawing_balloons')
      .select('id')
      .eq('drawing_revision_id', revisionId);

    if (balloons.error) throw balloons.error;

    const balloonIds = balloons.data.map(b => b.id);

    if (balloonIds.length === 0) {
      return {
        total: 0,
        ok: 0,
        ng: 0,
        pending: 0,
        completionRate: 0
      };
    }

    const results = await supabase
      .from('inspection_results')
      .select('result_status')
      .in('balloon_id', balloonIds);

    if (results.error) throw results.error;

    const stats = {
      total: balloonIds.length,
      ok: results.data.filter(r => r.result_status === 'OK').length,
      ng: results.data.filter(r => r.result_status === 'NG').length,
      pending: balloonIds.length - results.data.length,
      completionRate: results.data.length > 0
        ? Math.round((results.data.length / balloonIds.length) * 100)
        : 0
    };

    return stats;
  } catch (err) {
    console.error('[PLM Integration] getRevisionInspectionStats error:', err);
    return { total: 0, ok: 0, ng: 0, pending: 0, completionRate: 0 };
  }
}

// =====================================================
// REPORT GENERATION
// =====================================================

/**
 * Generate FAI (First Article Inspection) Report data
 */
export async function generateFAIReport(revisionId, options = {}) {
  try {
    const {
      data: revision,
      error: revError
    } = await supabase
      .from('drawing_revisions')
      .select(`
        *,
        drawing:drawings (
          id,
          code,
          name,
          drawing_type
        )
      `)
      .eq('id', revisionId)
      .single();

    if (revError) throw revError;

    // Get balloons with features and inspection results
    const { data: balloons, error: balError } = await supabase
      .from('drawing_balloons')
      .select(`
        *,
        feature:drawing_features (
          feature_code,
          feature_name,
          feature_type,
          nominal_value,
          upper_tolerance,
          lower_tolerance,
          unit
        ),
        results:inspection_results (
          result_value,
          result_status,
          notes,
          inspected_at,
          inspected_by
        )
      `)
      .eq('drawing_revision_id', revisionId)
      .order('balloon_number');

    if (balError) throw balError;

    // Calculate statistics
    const stats = {
      totalPoints: balloons.length,
      okPoints: balloons.filter(b => b.results?.some(r => r.result_status === 'OK')).length,
      ngPoints: balloons.filter(b => b.results?.some(r => r.result_status === 'NG')).length,
      measuredPoints: balloons.filter(b => b.results?.length > 0).length,
    };

    const reportData = {
      reportType: 'FAI',
      reportNumber: `FAI-${revision.drawing?.code}-${revision.revision_code}-${Date.now().toString(36).toUpperCase()}`,
      drawingInfo: {
        code: revision.drawing?.code,
        name: revision.drawing?.name,
        type: revision.drawing?.drawing_type,
        revision: revision.revision_code,
      },
      inspectionDate: new Date().toISOString(),
      inspector: options.inspectorName || 'N/A',
      statistics: stats,
      items: balloons.map(b => {
        const latestResult = b.results?.[0];
        const feature = b.feature;
        return {
          balloonNumber: b.balloon_number,
          featureCode: feature?.feature_code || '-',
          featureName: feature?.feature_name || '-',
          nominalValue: feature?.nominal_value || '-',
          tolerance: feature?.upper_tolerance && feature?.lower_tolerance
            ? `± ${feature.upper_tolerance}`
            : 'N/A',
          unit: feature?.unit || '-',
          actualValue: latestResult?.result_value || '-',
          status: latestResult?.result_status || 'PENDING',
          notes: latestResult?.notes || '',
          measuredAt: latestResult?.inspected_at || null,
        };
      }),
      summary: {
        passRate: stats.totalPoints > 0
          ? Math.round((stats.okPoints / stats.totalPoints) * 100)
          : 0,
        status: stats.ngPoints > 0 ? 'REJECTED' : 'ACCEPTED',
      },
    };

    return { success: true, data: reportData };
  } catch (err) {
    console.error('[PLM Integration] generateFAIReport error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Generate Summary Report for drawing inspection
 */
export async function generateInspectionSummary(drawingId) {
  try {
    const { data: revisions, error } = await supabase
      .from('drawing_revisions')
      .select('*')
      .eq('drawing_id', drawingId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = await Promise.all(
      revisions.map(async rev => {
        const stats = await getRevisionInspectionStats(rev.id);
        return {
          revisionId: rev.id,
          revisionCode: rev.revision_code,
          status: rev.status,
          createdAt: rev.created_at,
          releasedAt: rev.released_at,
          statistics: stats,
        };
      })
    );

    return { success: true, data: summary };
  } catch (err) {
    console.error('[PLM Integration] generateInspectionSummary error:', err);
    return { success: false, error: err.message };
  }
}

export default {
  // Links
  linkBalloonToInspector,
  linkBalloonToChecksheet,
  getInspectionLinksByRevision,
  getInspectionHistory,
  // Auto-generate
  generateInspectorFromBalloons,
  generateCheckSheetFromBalloons,
  // Results
  saveInspectionResult,
  getRevisionInspectionStats,
  // Reports
  generateFAIReport,
  generateInspectionSummary,
};
