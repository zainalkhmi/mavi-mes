-- =====================================================
-- AI MEMORY TABLES (Phase 3)
-- =====================================================
-- RAG Memory and AI enhancements
-- Run this in Supabase SQL Editor
-- =====================================================

-- AI Memories table for RAG
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    type TEXT DEFAULT 'conversation' CHECK (type IN ('conversation', 'knowledge', 'fact', 'preference')),
    embedding JSONB,
    session_id TEXT,
    user_id TEXT,
    workflow_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.ai_memories TO anon, authenticated;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all ai_memories" ON public.ai_memories;
CREATE POLICY "Allow all ai_memories" ON public.ai_memories FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Indexes for ai_memories
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON public.ai_memories(type);
CREATE INDEX IF NOT EXISTS idx_ai_memories_session ON public.ai_memories(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON public.ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_workflow ON public.ai_memories(workflow_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_created ON public.ai_memories(created_at DESC);

-- Function to clear old conversation memories (for maintenance)
CREATE OR REPLACE FUNCTION public.clear_old_ai_memories(days_old INTEGER DEFAULT 30)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.ai_memories
    WHERE type = 'conversation'
    AND created_at < NOW() - (days_old || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- =====================================================
-- AUTOMATION VERSIONS ENHANCEMENT (if not exists)
-- =====================================================

-- The automation_versions table should already exist from Phase 1
-- If not, create it here
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

CREATE INDEX IF NOT EXISTS idx_automation_versions_automation ON public.automation_versions(automation_id);

-- =====================================================
-- SAMPLE TEMPLATES (Optional - for marketplace)
-- =====================================================

-- Insert sample templates into automations table
INSERT INTO public.automations (name, description, graph_data, trigger_config, is_active) VALUES
(
    'QC Alert Template',
    'Send alerts when quality inspection fails',
    '{
        "nodes": [
            {"id": "trigger-1", "type": "event", "position": {"x": 100, "y": 150}, "data": {"triggerType": "WEBHOOK", "label": "QC Webhook"}},
            {"id": "filter-1", "type": "decision", "position": {"x": 300, "y": 150}, "data": {"label": "Pass/Fail?"}},
            {"id": "action-1", "type": "action", "position": {"x": 500, "y": 150}, "data": {"type": "TELEGRAM", "label": "Alert Team"}},
            {"id": "action-2", "type": "action", "position": {"x": 500, "y": 250}, "data": {"type": "GOOGLE_SHEETS", "label": "Log Result"}}
        ],
        "edges": [
            {"id": "e1", "source": "trigger-1", "target": "filter-1"},
            {"id": "e2", "source": "filter-1", "target": "action-1", "label": "Fail"},
            {"id": "e3", "source": "action-1", "target": "action-2"}
        ]
    }'::JSONB,
    '{"type": "webhook", "path": "/webhook/qc-alert"}'::JSONB,
    false
),
(
    'Shift Report Template',
    'Generate and send shift production report',
    '{
        "nodes": [
            {"id": "trigger-1", "type": "event", "position": {"x": 100, "y": 150}, "data": {"triggerType": "TIMER", "label": "Daily 17:00", "cron": "0 0 17 * * *"}},
            {"id": "db-1", "type": "database", "position": {"x": 300, "y": 150}, "data": {"label": "Query Completions"}},
            {"id": "transform-1", "type": "template", "position": {"x": 500, "y": 150}, "data": {"label": "Format Report"}},
            {"id": "action-1", "type": "action", "position": {"x": 700, "y": 100}, "data": {"type": "TELEGRAM", "label": "Send to Telegram"}},
            {"id": "action-2", "type": "action", "position": {"x": 700, "y": 200}, "data": {"type": "EMAIL", "label": "Email Manager"}}
        ],
        "edges": [
            {"id": "e1", "source": "trigger-1", "target": "db-1"},
            {"id": "e2", "source": "db-1", "target": "transform-1"},
            {"id": "e3", "source": "transform-1", "target": "action-1"},
            {"id": "e4", "source": "transform-1", "target": "action-2"}
        ]
    }'::JSONB,
    '{"type": "timer", "cron": "0 0 17 * * *", "timezone": "Asia/Jakarta"}'::JSONB,
    false
),
(
    'Smart Andon Template',
    'Advanced Andon with AI root cause analysis',
    '{
        "nodes": [
            {"id": "trigger-1", "type": "event", "position": {"x": 100, "y": 150}, "data": {"triggerType": "MACHINE_TRIGGER", "label": "Machine Alert"}},
            {"id": "ai-1", "type": "ai_agent", "position": {"x": 300, "y": 150}, "data": {"label": "AI Root Cause"}},
            {"id": "action-1", "type": "action", "position": {"x": 500, "y": 150}, "data": {"type": "SLACK", "label": "Notify Team"}},
            {"id": "wait-1", "type": "delay", "position": {"x": 500, "y": 250}, "data": {"label": "Wait 30 min", "duration": 1800}},
            {"id": "decision-1", "type": "decision", "position": {"x": 700, "y": 200}, "data": {"label": "Resolved?"}}
        ],
        "edges": [
            {"id": "e1", "source": "trigger-1", "target": "ai-1"},
            {"id": "e2", "source": "ai-1", "target": "action-1"},
            {"id": "e3", "source": "action-1", "target": "wait-1"},
            {"id": "e4", "source": "wait-1", "target": "decision-1"}
        ]
    }'::JSONB,
    '{"type": "machine", "topics": ["machine/alerts"]}'::JSONB,
    false
)
ON CONFLICT DO NOTHING;
