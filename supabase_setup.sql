-- SUPABASE SETUP SCRIPT
-- =====================================================
-- Run this in your Supabase SQL Editor to create the
-- necessary tables for the MES Application.
-- =====================================================

-- 1. Table: manuals
CREATE TABLE IF NOT EXISTS public.manuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    document_number TEXT,
    version TEXT DEFAULT '1.0',
    status TEXT DEFAULT 'DRAFT',
    author TEXT,
    summary TEXT,
    difficulty TEXT DEFAULT 'Moderate',
    time_required TEXT,
    category TEXT DEFAULT 'Work Instruction',
    industry TEXT,
    type TEXT DEFAULT 'manual',
    content_json JSONB DEFAULT '{}',
    steps JSONB DEFAULT '{}', -- Fallback column
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table: frontline_apps
CREATE TABLE IF NOT EXISTS public.frontline_apps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Shop Floor',
    config JSONB DEFAULT '{"components": []}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: production_queue
CREATE TABLE IF NOT EXISTS public.production_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order TEXT NOT NULL,
    app_id UUID REFERENCES public.frontline_apps(id),
    target_qty INTEGER DEFAULT 0,
    status TEXT DEFAULT 'PENDING',
    priority TEXT DEFAULT 'P2', -- P1 (High), P2 (Normal)
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Policies for production_queue
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.production_queue TO anon, authenticated;
ALTER TABLE public.production_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all production_queue" ON public.production_queue;
CREATE POLICY "Allow all production_queue" ON public.production_queue FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Table: audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_type TEXT NOT NULL,
    operator_id TEXT DEFAULT 'anonymous',
    station_id TEXT DEFAULT 'N/A',
    work_order TEXT DEFAULT 'N/A',
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()

);
-- 5. Table: dynamic_translations
CREATE TABLE IF NOT EXISTS public.dynamic_translations (
    key_string TEXT PRIMARY KEY,
    translations JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Policies for dynamic_translations
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.dynamic_translations TO anon, authenticated;
ALTER TABLE public.dynamic_translations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all dynamic_translations" ON public.dynamic_translations;
CREATE POLICY "Allow all dynamic_translations" ON public.dynamic_translations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6. Storage bucket for images (required by IMAGE widget upload)
-- NOTE: run with a role that can manage storage (SQL Editor as project owner)
INSERT INTO storage.buckets (id, name, public)
VALUES ('manual-media', 'manual-media', true)
ON CONFLICT (id) DO NOTHING;

-- Optional compatibility buckets (app now tries fallback names too)
INSERT INTO storage.buckets (id, name, public)
VALUES ('manuals', 'manuals', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (so anon key from frontend can upload/read)
-- Re-runnable: drop then recreate policies.
DROP POLICY IF EXISTS "Public read manual-media" ON storage.objects;
CREATE POLICY "Public read manual-media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'manual-media');

DROP POLICY IF EXISTS "Anon insert manual-media" ON storage.objects;
CREATE POLICY "Anon insert manual-media"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (bucket_id = 'manual-media');

DROP POLICY IF EXISTS "Anon update manual-media" ON storage.objects;
CREATE POLICY "Anon update manual-media"
ON storage.objects
FOR UPDATE
TO anon
USING (bucket_id = 'manual-media')
WITH CHECK (bucket_id = 'manual-media');

DROP POLICY IF EXISTS "Anon delete manual-media" ON storage.objects;
CREATE POLICY "Anon delete manual-media"
ON storage.objects
FOR DELETE
TO anon
USING (bucket_id = 'manual-media');

-- Enable RLS (Optional but recommended - currently set to public access for development)
-- ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.frontline_apps ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.production_queue ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.dynamic_translations ENABLE ROW LEVEL SECURITY;

-- Note: In a production environment, you should add RLS policies.
-- For now, ensure your Anon Key has permission to read/write these tables.

-- =====================================================
-- NEW TABLES - Copy below and run in Supabase SQL Editor
-- =====================================================

-- 7. Table: app_variables (Global variables for the app builder)
CREATE TABLE IF NOT EXISTS public.app_variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'TEXT',
    default_value TEXT,
    clear_on_completion BOOLEAN DEFAULT TRUE,
    save_for_analysis BOOLEAN DEFAULT TRUE,
    where_used TEXT DEFAULT '-',
    validation_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_variables_name_unique'
  ) THEN
    ALTER TABLE public.app_variables ADD CONSTRAINT app_variables_name_unique UNIQUE (name);
  END IF;
END $$;

-- Policies for app_variables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_variables TO anon, authenticated;
ALTER TABLE public.app_variables ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read app_variables" ON public.app_variables;
CREATE POLICY "Allow read app_variables" ON public.app_variables FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert app_variables" ON public.app_variables;
CREATE POLICY "Allow insert app_variables" ON public.app_variables FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update app_variables" ON public.app_variables;
CREATE POLICY "Allow update app_variables" ON public.app_variables FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete app_variables" ON public.app_variables;
CREATE POLICY "Allow delete app_variables" ON public.app_variables FOR DELETE TO anon, authenticated USING (true);

ALTER TABLE public.app_variables
ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}';

-- 8. Table: app_tables (Tulip-style table definitions)
CREATE TABLE IF NOT EXISTS public.app_tables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    fields JSONB DEFAULT '[]',
    queries JSONB DEFAULT '[]',
    aggregations JSONB DEFAULT '[]',
    archived_field_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure columns exist if table was created without them
ALTER TABLE public.app_tables ADD COLUMN IF NOT EXISTS queries JSONB DEFAULT '[]';
ALTER TABLE public.app_tables ADD COLUMN IF NOT EXISTS aggregations JSONB DEFAULT '[]';


-- 9. Table: app_table_records (Records for each app_table)
CREATE TABLE IF NOT EXISTS public.app_table_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_id UUID NOT NULL REFERENCES public.app_tables(id) ON DELETE CASCADE,
    record_id TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(table_id, record_id)
);

-- 10. Grants & RLS policies for app_tables / app_table_records
--    Needed so frontend (anon key) can read/write when RLS is enabled.

-- Basic grants
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_tables TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.app_table_records TO anon, authenticated;

-- Enable RLS (safe to rerun)
ALTER TABLE public.app_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_table_records ENABLE ROW LEVEL SECURITY;

-- Recreate policies (rerunnable)
DROP POLICY IF EXISTS "Allow read app_tables" ON public.app_tables;
CREATE POLICY "Allow read app_tables"
ON public.app_tables
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert app_tables" ON public.app_tables;
CREATE POLICY "Allow insert app_tables"
ON public.app_tables
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update app_tables" ON public.app_tables;
CREATE POLICY "Allow update app_tables"
ON public.app_tables
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete app_tables" ON public.app_tables;
CREATE POLICY "Allow delete app_tables"
ON public.app_tables
FOR DELETE
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow read app_table_records" ON public.app_table_records;
CREATE POLICY "Allow read app_table_records"
ON public.app_table_records
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert app_table_records" ON public.app_table_records;
CREATE POLICY "Allow insert app_table_records"
ON public.app_table_records
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update app_table_records" ON public.app_table_records;
CREATE POLICY "Allow update app_table_records"
ON public.app_table_records
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete app_table_records" ON public.app_table_records;
CREATE POLICY "Allow delete app_table_records"
ON public.app_table_records
FOR DELETE
TO anon, authenticated
USING (true);
-- 11. Table: chat_messages (Real-time collaboration between operators)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    station_id TEXT NOT NULL,
    target_station_id TEXT, -- NULL means broadcast to everyone
    target_user_id TEXT,    -- For private user-to-user chat
    content TEXT NOT NULL,
    type TEXT DEFAULT 'TEXT', -- TEXT, ALERT, IMAGE, VIDEO, FILE
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & Policies for chat_messages
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.chat_messages TO anon, authenticated;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read chat_messages" ON public.chat_messages;
CREATE POLICY "Allow read chat_messages"
ON public.chat_messages
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow insert chat_messages" ON public.chat_messages;
CREATE POLICY "Allow insert chat_messages"
ON public.chat_messages
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 12. Policies for manuals (Fix 400 errors)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.manuals TO anon, authenticated;
ALTER TABLE public.manuals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read manuals" ON public.manuals;
CREATE POLICY "Allow read manuals" ON public.manuals FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert manuals" ON public.manuals;
CREATE POLICY "Allow insert manuals" ON public.manuals FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update manuals" ON public.manuals;
CREATE POLICY "Allow update manuals" ON public.manuals FOR UPDATE TO anon, authenticated USING (true);

-- 13. Policies for audit_logs (Fix 401 errors)
GRANT SELECT, INSERT ON TABLE public.audit_logs TO anon, authenticated;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read audit_logs" ON public.audit_logs;
CREATE POLICY "Allow read audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert audit_logs" ON public.audit_logs;
CREATE POLICY "Allow insert audit_logs" ON public.audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);

-- 14. Fix missing columns in manuals table
ALTER TABLE public.manuals ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Moderate';
ALTER TABLE public.manuals ADD COLUMN IF NOT EXISTS time_required TEXT;
ALTER TABLE public.manuals ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Work Instruction';
ALTER TABLE public.manuals ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE public.manuals ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'manual';

-- 15. Policies for frontline_apps (Fix RLS violation on save)
GRANT ALL ON TABLE public.frontline_apps TO anon, authenticated;
ALTER TABLE public.frontline_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read frontline_apps" ON public.frontline_apps;
CREATE POLICY "Allow read frontline_apps" ON public.frontline_apps FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow insert frontline_apps" ON public.frontline_apps;
CREATE POLICY "Allow insert frontline_apps" ON public.frontline_apps FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update frontline_apps" ON public.frontline_apps;
CREATE POLICY "Allow update frontline_apps" ON public.frontline_apps FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow delete frontline_apps" ON public.frontline_apps;
CREATE POLICY "Allow delete frontline_apps" ON public.frontline_apps FOR DELETE TO anon, authenticated USING (true);

-- =====================================================
-- SHOP FLOOR MANAGEMENT TABLES
-- =====================================================

-- 16. Table: stations
CREATE TABLE IF NOT EXISTS public.stations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    station_group_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 17. Table: machines
CREATE TABLE IF NOT EXISTS public.machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    status TEXT DEFAULT 'OFFLINE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 18. Table: interfaces
CREATE TABLE IF NOT EXISTS public.interfaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    device_type TEXT DEFAULT 'Computer',
    station_id TEXT,
    status TEXT DEFAULT 'ONLINE',
    version TEXT DEFAULT 'r284.1',
    last_seen TIMESTAMPTZ DEFAULT now(),
    ip_address TEXT,
    drivers JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 19. Table: integration_connectors
CREATE TABLE IF NOT EXISTS public.integration_connectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- AI, HTTP, DATABASE, etc.
    config JSONB DEFAULT '{}',
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 20. Table: edge_devices
CREATE TABLE IF NOT EXISTS public.edge_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT,
    ip_address TEXT,
    status TEXT DEFAULT 'OFFLINE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 21. Table: station_groups
CREATE TABLE IF NOT EXISTS public.station_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Basic grants for new tables
GRANT ALL ON TABLE public.stations TO anon, authenticated;
GRANT ALL ON TABLE public.machines TO anon, authenticated;
GRANT ALL ON TABLE public.interfaces TO anon, authenticated;
GRANT ALL ON TABLE public.integration_connectors TO anon, authenticated;
GRANT ALL ON TABLE public.edge_devices TO anon, authenticated;
GRANT ALL ON TABLE public.station_groups TO anon, authenticated;

-- Enable RLS and add basic policies (Public read/write for dev)
ALTER TABLE public.stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.edge_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all stations" ON public.stations;
CREATE POLICY "Allow all stations" ON public.stations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all machines" ON public.machines;
CREATE POLICY "Allow all machines" ON public.machines FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all interfaces" ON public.interfaces;
CREATE POLICY "Allow all interfaces" ON public.interfaces FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all integration_connectors" ON public.integration_connectors;
CREATE POLICY "Allow all integration_connectors" ON public.integration_connectors FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all edge_devices" ON public.edge_devices;
CREATE POLICY "Allow all edge_devices" ON public.edge_devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all station_groups" ON public.station_groups;
CREATE POLICY "Allow all station_groups" ON public.station_groups FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- SCHEMA MIGRATIONS (Ensure columns exist for old tables)
-- =====================================================

DO $$ 
BEGIN
    -- Interfaces table
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'Computer';
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS station_id TEXT;
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ONLINE';
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS version TEXT DEFAULT 'r284.1';
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS ip_address TEXT;
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS drivers JSONB DEFAULT '{}';
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
    ALTER TABLE public.interfaces ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
    
    -- Stations table
    ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE public.stations ADD COLUMN IF NOT EXISTS station_group_id TEXT;
    
    -- Machines table
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS type TEXT;
    ALTER TABLE public.machines ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OFFLINE';
END $$;

-- 22. Table: measurements (Legacy Live Terminal records)
CREATE TABLE IF NOT EXISTS public.measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_name TEXT,
    timestamp TIMESTAMPTZ DEFAULT now(),
    measurements JSONB DEFAULT '{}',
    cycle_data JSONB DEFAULT '[]',
    narration TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 23. Table: completions (Formal App Execution records)
CREATE TABLE IF NOT EXISTS public.completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID NOT NULL,
    app_name TEXT NOT NULL,
    app_version INTEGER DEFAULT 1,
    user_id TEXT,
    user_email TEXT,
    station_name TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ DEFAULT now(),
    duration_ms BIGINT,
    status TEXT DEFAULT 'COMPLETED', -- COMPLETED, CANCELED, SAVED
    variables_snapshot JSONB DEFAULT '{}',
    step_history JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Grants & Policies for Measurements & Completions
GRANT ALL ON TABLE public.measurements TO anon, authenticated;
GRANT ALL ON TABLE public.completions TO anon, authenticated;

ALTER TABLE public.measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all measurements" ON public.measurements;
CREATE POLICY "Allow all measurements" ON public.measurements FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all completions" ON public.completions;
CREATE POLICY "Allow all completions" ON public.completions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 24. Table: saved_analyses
CREATE TABLE IF NOT EXISTS public.saved_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    config JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON TABLE public.saved_analyses TO anon, authenticated;
ALTER TABLE public.saved_analyses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all saved_analyses" ON public.saved_analyses;
CREATE POLICY "Allow all saved_analyses" ON public.saved_analyses FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 25. Table: dashboards
CREATE TABLE IF NOT EXISTS public.dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    layout JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON TABLE public.dashboards TO anon, authenticated;
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all dashboards" ON public.dashboards;
CREATE POLICY "Allow all dashboards" ON public.dashboards FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 26. Table: player_sessions
CREATE TABLE IF NOT EXISTS public.player_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    app_id UUID REFERENCES public.frontline_apps(id),
    app_name TEXT,
    station_id UUID REFERENCES public.stations(id),
    station_name TEXT,
    operator TEXT,
    duration_seconds INTEGER DEFAULT 0,
    step_count INTEGER DEFAULT 0,
    dev_mode BOOLEAN DEFAULT false,
    comments JSONB DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now()
);

GRANT ALL ON TABLE public.player_sessions TO anon, authenticated;
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all player_sessions" ON public.player_sessions;
CREATE POLICY "Allow all player_sessions" ON public.player_sessions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- IoT Protocol Gateway Tables (Zigbee / Matter / BLE)
-- Run these in Supabase SQL Editor to enable IoT Hub
-- =====================================================

-- IoT Smart Devices Registry
CREATE TABLE IF NOT EXISTS public.iot_smart_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    protocol TEXT NOT NULL CHECK (protocol IN ('ZIGBEE', 'MATTER', 'BLE')),
    device_type TEXT NOT NULL DEFAULT 'UNKNOWN',
    brand TEXT,
    model TEXT,
    status TEXT DEFAULT 'PAIRED' CHECK (status IN ('PAIRED', 'PAIRING', 'OFFLINE', 'ERROR')),
    -- Protocol-specific identifiers
    ieee_address TEXT,   -- Zigbee IEEE address (e.g. 0x00158d0001234567)
    matter_id TEXT,      -- Matter device ID (e.g. A1B2-C3D4-E5F6-G7H8)
    ble_mac TEXT,        -- BLE MAC address  (e.g. AA:BB:CC:DD:EE:FF)
    -- Placement
    room TEXT DEFAULT 'Unassigned',
    -- MQTT
    mqtt_topic TEXT,
    mqtt_publish_topic TEXT,
    -- Live data (JSON)
    telemetry JSONB DEFAULT '{}',
    -- Metadata
    config JSONB DEFAULT '{}',   -- capabilities, icon, category, signalStrength
    last_seen TIMESTAMPTZ,
    paired_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iot_smart_devices TO anon, authenticated;
ALTER TABLE public.iot_smart_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all iot_smart_devices" ON public.iot_smart_devices;
CREATE POLICY "Allow all iot_smart_devices" ON public.iot_smart_devices FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Index for fast protocol filtering
CREATE INDEX IF NOT EXISTS idx_iot_smart_devices_protocol ON public.iot_smart_devices (protocol);
CREATE INDEX IF NOT EXISTS idx_iot_smart_devices_room ON public.iot_smart_devices (room);

-- ── IoT Gateways ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.iot_gateways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ZIGBEE2MQTT', 'MATTER_BRIDGE', 'BLE_GATEWAY', 'CUSTOM')),
    mqtt_broker TEXT,          -- wss://broker-url:port/mqtt
    status TEXT DEFAULT 'OFFLINE' CHECK (status IN ('ONLINE', 'OFFLINE', 'ERROR')),
    config JSONB DEFAULT '{}', -- optional extra config (auth, topics, etc.)
    last_ping TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.iot_gateways TO anon, authenticated;
ALTER TABLE public.iot_gateways ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all iot_gateways" ON public.iot_gateways;
CREATE POLICY "Allow all iot_gateways" ON public.iot_gateways FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

