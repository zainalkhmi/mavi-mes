/**
 * DATABASE_OPTIMIZATION.sql
 * =====================================================
 * MaviCore MES - Database Performance Optimization
 * Run this in Supabase SQL Editor
 * =====================================================
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INDEX OPTIMIZATIONS
 * These indexes speed up common queries for PLM, MES, and realtime features
 * ═══════════════════════════════════════════════════════════════════════════
 */

-- ─── Products ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_products_code ON products(code);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at DESC);

-- ─── Parts ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_parts_code ON parts(code);
CREATE INDEX IF NOT EXISTS idx_parts_name ON parts(name);
CREATE INDEX IF NOT EXISTS idx_parts_product_id ON parts(product_id);
CREATE INDEX IF NOT EXISTS idx_parts_updated ON parts(updated_at DESC);

-- ─── Drawings (PLM) ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drawings_code ON drawings(code);
CREATE INDEX IF NOT EXISTS idx_drawings_name ON drawings(name);
CREATE INDEX IF NOT EXISTS idx_drawings_type ON drawings(drawing_type);
CREATE INDEX IF NOT EXISTS idx_drawings_updated ON drawings(updated_at DESC);

-- ─── Drawing Revisions ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_status ON drawing_revisions(status);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_updated ON drawing_revisions(updated_at DESC);

-- ─── Drawing Balloons ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drawing_balloons_revision ON drawing_balloons(drawing_revision_id);
CREATE INDEX IF NOT EXISTS idx_drawing_balloons_feature ON drawing_balloons(target_feature_id);

-- ─── Drawing Features ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drawing_features_revision ON drawing_features(drawing_revision_id);
CREATE INDEX IF NOT EXISTS idx_drawing_features_type ON drawing_features(feature_type);

-- ─── Drawing Relations ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_drawing_relations_parent ON drawing_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_drawing_relations_child ON drawing_relations(child_id);

-- ─── Manuals (Knowledge Base) ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_manuals_title ON manuals(title);
CREATE INDEX IF NOT EXISTS idx_manuals_doc_number ON manuals(document_number);
CREATE INDEX IF NOT EXISTS idx_manuals_status ON manuals(status);
CREATE INDEX IF NOT EXISTS idx_manuals_category ON manuals(category);
CREATE INDEX IF NOT EXISTS idx_manuals_updated ON manuals(updated_at DESC);

-- ─── Inspector Templates ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_inspector_templates_name ON inspector_templates(name);
CREATE INDEX IF NOT EXISTS idx_inspector_templates_doc ON inspector_templates(doc_no);
CREATE INDEX IF NOT EXISTS idx_inspector_templates_status ON inspector_templates(status);
CREATE INDEX IF NOT EXISTS idx_inspector_templates_updated ON inspector_templates(updated_at DESC);

-- ─── Production Queue (MES) ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_production_queue_station ON production_queue(station_id);
CREATE INDEX IF NOT EXISTS idx_production_queue_status ON production_queue(status);
CREATE INDEX IF NOT EXISTS idx_production_queue_created ON production_queue(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_production_queue_work_order ON production_queue(work_order_id);

-- ─── Audit Logs (Real-time) ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_audit_logs_station ON audit_logs(station_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_operator ON audit_logs(operator_id);

-- ─── Andon Events ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_andon_events_station ON andon_events(station_id);
CREATE INDEX IF NOT EXISTS idx_andon_events_status ON andon_events(status);
CREATE INDEX IF NOT EXISTS idx_andon_events_created ON andon_events(created_at DESC);

-- ─── Workstation Status ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_workstation_status_station ON workstation_status(station_id);
CREATE INDEX IF NOT EXISTS idx_workstation_status_updated ON workstation_status(updated_at DESC);

-- ─── Chat Messages ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_chat_messages_station ON chat_messages(station_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_target ON chat_messages(target_station_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_read ON chat_messages(is_read) WHERE is_read = false;

-- ─── Global Variables ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_global_variables_name ON global_variables(name);

-- ─── Frontline Apps ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_frontline_apps_name ON frontline_apps(name);
CREATE INDEX IF NOT EXISTS idx_frontline_apps_updated ON frontline_apps(updated_at DESC);

-- ─── App Tables ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_app_tables_name ON app_tables(name);

-- ─── Stations ──────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_stations_name ON stations(name);

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * REALTIME OPTIMIZATION
 * Enable/disable realtime for specific tables based on need
 * ═══════════════════════════════════════════════════════════════════════════
 */

-- Enable Realtime for frequently updated tables
ALTER PUBLICATION supabase_realtime ADD TABLE production_queue;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE andon_events;
ALTER PUBLICATION supabase_realtime ADD TABLE workstation_status;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE global_variables;

-- Disable Realtime for large/rarely updated tables (saves bandwidth)
-- ALTER PUBLICATION supabase_realtime DROP TABLE manuals;
-- ALTER PUBLICATION supabase_realtime DROP TABLE inspector_templates;
-- ALTER PUBLICATION supabase_realtime DROP TABLE drawings;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * QUERY OPTIMIZATION FUNCTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 */

/**
 * Get paginated drawings with optimal query
 */
CREATE OR REPLACE FUNCTION get_drawings_paginated(
    p_page INT DEFAULT 0,
    p_page_size INT DEFAULT 20,
    p_search TEXT DEFAULT ''
)
RETURNS TABLE(
    items JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(
            json_agg(d.* ORDER BY d.updated_at DESC),
            '[]'::JSONB
        ) as items,
        COUNT(*) OVER() as total_count
    FROM drawings d
    WHERE
        (p_search = '' OR d.name ILIKE '%' || p_search || '%' OR d.code ILIKE '%' || p_search || '%')
    LIMIT p_page_size
    OFFSET p_page * p_page_size;
END;
$$;

/**
 * Get paginated manuals with optimal query
 */
CREATE OR REPLACE FUNCTION get_manuals_paginated(
    p_page INT DEFAULT 0,
    p_page_size INT DEFAULT 20,
    p_search TEXT DEFAULT '',
    p_category TEXT DEFAULT '',
    p_status TEXT DEFAULT ''
)
RETURNS TABLE(
    items JSONB,
    total_count BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Exclude large content_json column for list view
        json_build_object(
            'id', d.id,
            'title', d.title,
            'document_number', d.document_number,
            'version', d.version,
            'status', d.status,
            'difficulty', d.difficulty,
            'time_required', d.time_required,
            'category', d.category,
            'industry', d.industry,
            'author', d.author,
            'created_at', d.created_at,
            'updated_at', d.updated_at
        ) as items,
        COUNT(*) OVER() as total_count
    FROM manuals d
    WHERE
        (p_search = '' OR d.title ILIKE '%' || p_search || '%' OR d.document_number ILIKE '%' || p_search || '%')
        AND (p_category = '' OR d.category = p_category)
        AND (p_status = '' OR d.status = p_status)
    ORDER BY d.updated_at DESC
    LIMIT p_page_size
    OFFSET p_page * p_page_size;
END;
$$;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CLEANUP: Remove unused indexes
 * ═══════════════════════════════════════════════════════════════════════════
 */

-- Drop indexes that might exist from previous schemas (cleanup)
DROP INDEX IF EXISTS idx_drawings_created;
DROP INDEX IF EXISTS idx_products_created;
DROP INDEX IF EXISTS idx_manuals_created;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * ANALYZE: Update table statistics for query planner
 * ═══════════════════════════════════════════════════════════════════════════
 */

ANALYZE products;
ANALYZE parts;
ANALYZE drawings;
ANALYZE drawing_revisions;
ANALYZE drawing_balloons;
ANALYZE drawing_features;
ANALYZE drawing_relations;
ANALYZE manuals;
ANALYZE inspector_templates;
ANALYZE production_queue;
ANALYZE audit_logs;
ANALYZE andon_events;
ANALYZE workstation_status;
ANALYZE chat_messages;
ANALYZE global_variables;
ANALYZE frontline_apps;
ANALYZE app_tables;
ANALYZE stations;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * VERIFICATION
 * ═══════════════════════════════════════════════════════════════════════════
 */

-- Show all created indexes
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as number_of_scans
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Show table sizes
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;
