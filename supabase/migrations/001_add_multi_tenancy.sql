-- =====================================================
-- MIGRATION: 001_add_multi_tenancy
-- =====================================================
-- Adds multi-tenancy support to Mavi MES
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- STEP 1: Create Organizations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'professional', 'enterprise')),
    owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner ON public.organizations(owner_id);

-- =====================================================
-- STEP 2: Create Organization Members Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, organization_id)
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- =====================================================
-- STEP 3: Create Invitations Table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_org_invitations_token ON public.organization_invitations(token);
CREATE INDEX IF NOT EXISTS idx_org_invitations_email ON public.organization_invitations(email);

-- =====================================================
-- STEP 4: Add organization_id to Existing Tables
-- Only add column if the table exists
-- =====================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        -- Only process known MES tables
        IF tbl.tablename IN (
            'manuals', 'frontline_apps', 'production_queue',
            'app_variables', 'app_tables', 'app_table_records',
            'stations', 'machines', 'interfaces', 'integration_connectors',
            'edge_devices', 'station_groups', 'measurements', 'completions',
            'dashboards', 'player_sessions', 'iot_smart_devices',
            'iot_gateways', 'plc_controllers', 'plc_tags', 'cameras',
            'datasets', 'vision_models', 'drawings', 'historian_tags',
            'historian_samples', 'scada_alarms', 'scada_alarm_definitions',
            'scada_audit_logs', 'scada_reports', 'ai_agents', 'audit_logs',
            'chat_messages', 'saved_analyses'
        ) THEN
            -- Add column if it doesn't exist
            BEGIN
                EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS organization_id UUID', tbl.tablename);
                RAISE NOTICE 'Added organization_id to %.', tbl.tablename;
            EXCEPTION WHEN OTHERS THEN
                RAISE NOTICE 'Skipped adding column to %: %', tbl.tablename, SQLERRM;
            END;
        END IF;
    END LOOP;
END $$;

-- =====================================================
-- STEP 5: Create Indexes for organization_id
-- Only create indexes for tables that have the column
-- =====================================================

DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT DISTINCT c.table_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
        AND c.column_name = 'organization_id'
    LOOP
        BEGIN
            EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%s_org ON public.%I (organization_id)', tbl.table_name, tbl.table_name);
            RAISE NOTICE 'Created index for %.', tbl.table_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Index creation skipped for %: %', tbl.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 6: Enable RLS on New Tables
-- =====================================================
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 7: RLS Policies for Organizations
-- =====================================================

-- Users can see their own organizations
CREATE POLICY "Users can view their organizations"
ON public.organizations FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Users can update their organization (if owner/admin)
CREATE POLICY "Owners/admins can update organization"
ON public.organizations FOR UPDATE
USING (
    id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organization"
ON public.organizations FOR DELETE
USING (
    id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role = 'owner'
    )
);

-- Users can insert organizations (signup flow)
CREATE POLICY "Users can create organizations"
ON public.organizations FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
);

-- =====================================================
-- STEP 8: RLS Policies for Organization Members
-- =====================================================

-- Users can view members of their organizations
CREATE POLICY "Users can view org members"
ON public.organization_members FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
    )
);

-- Users can update their own membership
CREATE POLICY "Users can update own membership"
ON public.organization_members FOR UPDATE
USING (user_id = auth.uid());

-- Users can insert their own membership (signup flow)
CREATE POLICY "Users can insert own membership"
ON public.organization_members FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Owners/admins can add new members
CREATE POLICY "Owners/admins can add members"
ON public.organization_members FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Owners/admins can remove members
CREATE POLICY "Owners/admins can remove members"
ON public.organization_members FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
    AND user_id != auth.uid() -- Can't remove yourself
);

-- =====================================================
-- STEP 9: RLS Policies for Invitations
-- =====================================================

-- Members can view invitations for their org
CREATE POLICY "Members can view invitations"
ON public.organization_invitations FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
ON public.organization_invitations FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.organization_invitations FOR DELETE
USING (
    organization_id IN (
        SELECT organization_id FROM public.organization_members
        WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
    )
);

-- Anyone with valid token can accept invitation
CREATE POLICY "Valid token holders can accept"
ON public.organization_invitations FOR UPDATE
USING (
    expires_at > now()
);

-- =====================================================
-- STEP 10: Update RLS Policies for Existing Tables
-- Only apply to tables that exist and have organization_id column
-- =====================================================

-- Function to add tenant isolation policy (safer version)
CREATE OR REPLACE FUNCTION add_tenant_isolation_policy(table_name TEXT)
RETURNS void AS $$
BEGIN
    -- Only proceed if table exists and has organization_id column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = add_tenant_isolation_policy.table_name
        AND column_name = 'organization_id'
    ) THEN
        RAISE NOTICE 'Table % does not have organization_id column, skipping.', add_tenant_isolation_policy.table_name;
        RETURN;
    END IF;

    -- Drop existing policies (ignore errors)
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Allow all %I" ON %I', add_tenant_isolation_policy.table_name, add_tenant_isolation_policy.table_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Allow read %I" ON %I', add_tenant_isolation_policy.table_name, add_tenant_isolation_policy.table_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Allow insert %I" ON %I', add_tenant_isolation_policy.table_name, add_tenant_isolation_policy.table_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    BEGIN
        EXECUTE format('DROP POLICY IF EXISTS "Tenant isolation for %I" ON %I', add_tenant_isolation_policy.table_name, add_tenant_isolation_policy.table_name);
    EXCEPTION WHEN OTHERS THEN NULL;
    END;

    -- Create tenant isolation policy
    EXECUTE format(
        'CREATE POLICY "Tenant isolation for %I"
        ON %I FOR ALL
        USING (
            organization_id IN (
                SELECT organization_id FROM public.organization_members
                WHERE user_id = auth.uid()
            )
        )',
        add_tenant_isolation_policy.table_name, add_tenant_isolation_policy.table_name
    );

    RAISE NOTICE 'Applied RLS to %.', add_tenant_isolation_policy.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to all existing tables that have organization_id column
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN
        SELECT DISTINCT c.table_name
        FROM information_schema.columns c
        JOIN pg_tables t ON t.tablename = c.table_name AND t.schemaname = c.table_schema
        WHERE c.table_schema = 'public'
        AND c.column_name = 'organization_id'
    LOOP
        BEGIN
            PERFORM add_tenant_isolation_policy(tbl.table_name);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error applying RLS to %: %', tbl.table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- =====================================================
-- STEP 11: Grant Permissions
-- =====================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- =====================================================
-- STEP 12: Create Organization (for existing data)
-- =====================================================

-- This will be run separately after creating a default organization
-- for migrating existing localStorage users

-- =====================================================
-- ROLLBACK SCRIPT (save this for emergencies)
-- =====================================================
/*
-- To rollback this migration:
1. Drop all new tables
DROP TABLE IF EXISTS public.organization_invitations;
DROP TABLE IF EXISTS public.organization_members;
DROP TABLE IF EXISTS public.organizations;

2. Drop the function
DROP FUNCTION IF EXISTS add_tenant_isolation_policy(text);

3. Remove organization_id columns (optional, careful!)
ALTER TABLE public.manuals DROP COLUMN IF EXISTS organization_id;
-- ... repeat for other tables
*/
