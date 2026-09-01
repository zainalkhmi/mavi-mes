-- =====================================================
-- AUTOMATION ENGINE TABLES
-- =====================================================
-- Phase 1: MVP Database Schema
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Table: automations (Workflow definitions)
CREATE TABLE IF NOT EXISTS public.automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    graph_data JSONB NOT NULL DEFAULT '{"nodes": [], "edges": []}',
    trigger_config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT false,
    is_paused BOOLEAN DEFAULT false,
    created_by TEXT,
    organization_id TEXT,
    version INTEGER DEFAULT 1,
    last_executed_at TIMESTAMPTZ,
    execution_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automations TO anon, authenticated;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automations" ON public.automations;
CREATE POLICY "Allow all automations" ON public.automations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for automations
CREATE INDEX IF NOT EXISTS idx_automations_active ON public.automations(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_automations_org ON public.automations(organization_id);

-- 2. Table: automation_runs (Execution history)
CREATE TABLE IF NOT EXISTS public.automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'running' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled', 'paused')),
    trigger_type TEXT DEFAULT 'manual',
    trigger_event JSONB DEFAULT '{}',
    variables JSONB DEFAULT '{}',
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT,
    error_message TEXT,
    error_node_id TEXT,
    result_data JSONB DEFAULT '{}',
    execution_mode TEXT DEFAULT 'production' CHECK (execution_mode IN ('production', 'test', 'debug')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_runs TO anon, authenticated;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_runs" ON public.automation_runs;
CREATE POLICY "Allow all automation_runs" ON public.automation_runs FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for automation_runs
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON public.automation_runs(automation_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON public.automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started ON public.automation_runs(started_at DESC);

-- 3. Table: automation_run_steps (Step-by-step execution log)
CREATE TABLE IF NOT EXISTS public.automation_run_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.automation_runs(id) ON DELETE CASCADE,
    node_id TEXT NOT NULL,
    node_name TEXT,
    node_type TEXT,
    step_order INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'skipped')),
    input_data JSONB DEFAULT '{}',
    output_data JSONB DEFAULT '{}',
    error TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_ms BIGINT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_run_steps TO anon, authenticated;
ALTER TABLE public.automation_run_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_run_steps" ON public.automation_run_steps;
CREATE POLICY "Allow all automation_run_steps" ON public.automation_run_steps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for automation_run_steps
CREATE INDEX IF NOT EXISTS idx_automation_run_steps_run ON public.automation_run_steps(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_run_steps_order ON public.automation_run_steps(run_id, step_order);

-- 4. Table: automation_credentials (Secure credential storage)
CREATE TABLE IF NOT EXISTS public.automation_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('telegram', 'slack', 'google_sheets', 'smtp', 'http', 'webhook', 'custom')),
    encrypted_config JSONB DEFAULT '{}',
    config_preview JSONB DEFAULT '{}',
    organization_id TEXT,
    is_encrypted BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_credentials TO anon, authenticated;
ALTER TABLE public.automation_credentials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_credentials" ON public.automation_credentials;
CREATE POLICY "Allow all automation_credentials" ON public.automation_credentials FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for automation_credentials
CREATE INDEX IF NOT EXISTS idx_automation_credentials_type ON public.automation_credentials(type);
CREATE INDEX IF NOT EXISTS idx_automation_credentials_org ON public.automation_credentials(organization_id);

-- 5. Table: automation_versions (Version history)
CREATE TABLE IF NOT EXISTS public.automation_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    graph_data JSONB NOT NULL,
    trigger_config JSONB DEFAULT '{}',
    change_notes TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(automation_id, version)
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.automation_versions TO anon, authenticated;
ALTER TABLE public.automation_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all automation_versions" ON public.automation_versions;
CREATE POLICY "Allow all automation_versions" ON public.automation_versions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Index for automation_versions
CREATE INDEX IF NOT EXISTS idx_automation_versions_automation ON public.automation_versions(automation_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to update automation execution stats
CREATE OR REPLACE FUNCTION public.update_automation_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.status IN ('completed', 'failed', 'cancelled') THEN
        UPDATE public.automations
        SET
            last_executed_at = NEW.started_at,
            execution_count = execution_count + 1,
            updated_at = now()
        WHERE id = NEW.automation_id;
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger to update stats
DROP TRIGGER IF EXISTS trg_update_automation_stats ON public.automation_runs;
CREATE TRIGGER trg_update_automation_stats
    AFTER INSERT ON public.automation_runs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_automation_stats();

-- Function to get automation by ID with runs summary
CREATE OR REPLACE FUNCTION public.get_automation_with_stats(p_automation_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    description TEXT,
    graph_data JSONB,
    trigger_config JSONB,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    total_runs BIGINT,
    successful_runs BIGINT,
    failed_runs BIGINT,
    avg_duration_ms BIGINT,
    last_run_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.name,
        a.description,
        a.graph_data,
        a.trigger_config,
        a.is_active,
        a.created_at,
        a.updated_at,
        COUNT(r.id)::BIGINT as total_runs,
        COUNT(r.id) FILTER (WHERE r.status = 'completed')::BIGINT as successful_runs,
        COUNT(r.id) FILTER (WHERE r.status = 'failed')::BIGINT as failed_runs,
        AVG(r.duration_ms)::BIGINT as avg_duration_ms,
        MAX(r.started_at) as last_run_at
    FROM public.automations a
    LEFT JOIN public.automation_runs r ON a.id = r.automation_id
    WHERE a.id = p_automation_id
    GROUP BY a.id, a.name, a.description, a.graph_data, a.trigger_config, a.is_active, a.created_at, a.updated_at;
END;
$$;

-- =====================================================
-- INITIAL DATA: Sample automation templates
-- =====================================================

-- Insert sample automation templates (optional)
INSERT INTO public.automations (name, description, graph_data, trigger_config, is_active) VALUES
(
    'Daily Production Report',
    'Kirim laporan produksi harian ke Telegram',
    '{
        "nodes": [
            {"id": "trigger-1", "type": "timer", "position": {"x": 100, "y": 100}, "data": {"label": "Daily Timer", "cron": "0 8 * * *"}},
            {"id": "db-1", "type": "database", "position": {"x": 300, "y": 100}, "data": {"label": "Query Completions"}},
            {"id": "transform-1", "type": "transform", "position": {"x": 500, "y": 100}, "data": {"label": "Format Report"}},
            {"id": "telegram-1", "type": "telegram", "position": {"x": 700, "y": 100}, "data": {"label": "Send to Telegram"}}
        ],
        "edges": [
            {"id": "e1", "source": "trigger-1", "target": "db-1"},
            {"id": "e2", "source": "db-1", "target": "transform-1"},
            {"id": "e3", "source": "transform-1", "target": "telegram-1"}
        ]
    }'::JSONB,
    '{"type": "timer", "cron": "0 8 * * *", "timezone": "Asia/Jakarta"}'::JSONB,
    false
),
(
    'QC Alert Workflow',
    'Kirim alert ke Slack saat QC gagal',
    '{
        "nodes": [
            {"id": "trigger-1", "type": "webhook", "position": {"x": 100, "y": 100}, "data": {"label": "QC Webhook"}},
            {"id": "filter-1", "type": "filter", "position": {"x": 300, "y": 100}, "data": {"label": "Filter Failed", "condition": {"field": "status", "operator": "equals", "value": "failed"}}},
            {"id": "slack-1", "type": "slack", "position": {"x": 500, "y": 100}, "data": {"label": "Notify Slack"}}
        ],
        "edges": [
            {"id": "e1", "source": "trigger-1", "target": "filter-1"},
            {"id": "e2", "source": "filter-1", "target": "slack-1"}
        ]
    }'::JSONB,
    '{"type": "webhook", "path": "/webhook/qc-alert"}'::JSONB,
    false
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.automations IS 'Workflow automation definitions with ReactFlow graph data';
COMMENT ON TABLE public.automation_runs IS 'Execution history for each automation run';
COMMENT ON TABLE public.automation_run_steps IS 'Step-by-step log for each automation run';
COMMENT ON TABLE public.automation_credentials IS 'Encrypted credentials for external service integrations';
COMMENT ON TABLE public.automation_versions IS 'Version history for automation changes';
