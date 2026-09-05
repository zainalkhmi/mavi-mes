-- Migration: Add builder_type and missing columns to frontline_apps
-- Run this in your Supabase SQL Editor

-- Add builder_type column to identify which builder created the app
ALTER TABLE public.frontline_apps ADD COLUMN IF NOT EXISTS builder_type TEXT DEFAULT 'app_builder';

-- Add missing columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'published_config') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN published_config JSONB;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'is_published') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN is_published BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'approval_status') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN approval_status TEXT DEFAULT 'DRAFT';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'approved_by') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN approved_by TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'approved_at') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN approved_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'frontline_apps' AND column_name = 'description') THEN
        ALTER TABLE public.frontline_apps ADD COLUMN description TEXT;
    END IF;
END $$;

-- Ensure RLS is enabled and policies exist
ALTER TABLE public.frontline_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all frontline_apps" ON public.frontline_apps;
CREATE POLICY "Allow all frontline_apps" ON public.frontline_apps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.frontline_apps TO anon, authenticated;

-- Update existing apps without builder_type to default 'app_builder'
UPDATE public.frontline_apps SET builder_type = 'app_builder' WHERE builder_type IS NULL;

-- Add index for faster queries by builder_type
CREATE INDEX IF NOT EXISTS idx_frontline_apps_builder_type ON public.frontline_apps(builder_type);

-- Add index for faster queries by approval_status
CREATE INDEX IF NOT EXISTS idx_frontline_apps_approval_status ON public.frontline_apps(approval_status);

COMMENT ON COLUMN public.frontline_apps.builder_type IS 'Builder type: app_builder, gluestack, or sandbox';
