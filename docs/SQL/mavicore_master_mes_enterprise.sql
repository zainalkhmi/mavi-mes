-- =============================================================================
-- MAVICORE ENTERPRISE MANUFACTURING EXECUTION SYSTEM (MES) - MASTER DATABASE BLUEPRINT
-- Target Engine: PostgreSQL 14+ / Supabase
-- Architecture: Multi-Plant, Hierarchical Organization, PLM, OEE, Quality & IoT
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONS & PREREQUISITES
-- -----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean schema namespace (Optional comment: comment out in existing production)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;

-- -----------------------------------------------------------------------------
-- 0.1 GLOBAL UTILITY FUNCTIONS & TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. DOMAIN: ORGANIZATION & MASTER DATA (PLANT HIERARCHY)
-- Hierarchy: Enterprise -> Plants -> Departments -> Lines -> Workstations -> Machines
-- -----------------------------------------------------------------------------

-- 1.1 Plants
CREATE TABLE IF NOT EXISTS plants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    location TEXT,
    timezone VARCHAR(50) DEFAULT 'Asia/Jakarta',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.2 Departments (Production, Quality, Maintenance, Warehouse, Engineering)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(plant_id, code)
);

-- 1.3 Production Lines
CREATE TABLE IF NOT EXISTS lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    line_type VARCHAR(100) DEFAULT 'ASSEMBLY', -- FABRICATION, ASSEMBLY, PACKAGING, MACHINING
    target_capacity_per_hour NUMERIC(10,2) DEFAULT 100.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(department_id, code)
);

-- 1.4 Workstations / Stations
CREATE TABLE IF NOT EXISTS workstations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_id UUID NOT NULL REFERENCES lines(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    station_sequence INTEGER DEFAULT 1,
    ip_address VARCHAR(45),
    status VARCHAR(50) DEFAULT 'IDLE', -- IDLE, RUNNING, DOWN, CHANGEOVER
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(line_id, code)
);

-- 1.5 Machines / Equipment
CREATE TABLE IF NOT EXISTS machines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workstation_id UUID REFERENCES workstations(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    model_number VARCHAR(100),
    serial_number VARCHAR(100),
    brand VARCHAR(100),
    plc_ip_address VARCHAR(45),
    plc_protocol VARCHAR(50) DEFAULT 'MODBUS_TCP', -- OPC_UA, MODBUS_TCP, MQTT, S7
    rated_speed_ppm NUMERIC(10,2) DEFAULT 60.00, -- parts per minute
    status VARCHAR(50) DEFAULT 'IDLE', -- RUNNING, IDLE, ERROR, MAINTENANCE
    last_ping TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1.6 Production Shifts
CREATE TABLE IF NOT EXISTS shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    shift_name VARCHAR(100) NOT NULL, -- Shift 1 (Pagi), Shift 2 (Sore), Shift 3 (Malam)
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_duration_minutes INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. DOMAIN: ACCESS CONTROL & RBAC
-- -----------------------------------------------------------------------------

-- 2.1 Roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_key VARCHAR(50) UNIQUE NOT NULL, -- operator, technician, supervisor, engineer, admin
    role_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.2 Permissions
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    permission_key VARCHAR(100) UNIQUE NOT NULL, -- work_order.create, checksheet.submit, machine.control
    description TEXT,
    module VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.3 Role Permissions Map
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- 2.4 User Profiles (Linked with Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nik VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    plant_id UUID REFERENCES plants(id) ON DELETE SET NULL,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.5 User Roles Map
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- -----------------------------------------------------------------------------
-- 3. DOMAIN: PRODUCT ENGINEERING & PLM (BOM, ROUTING, DRAWINGS)
-- -----------------------------------------------------------------------------

-- 3.1 Parts / Products / Raw Materials
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    revision VARCHAR(20) DEFAULT 'A',
    description TEXT,
    category VARCHAR(50) DEFAULT 'MANUFACTURED', -- RAW_MATERIAL, SEMI_FINISHED, FINISHED_GOOD, CONSUMABLE
    unit_of_measure VARCHAR(20) DEFAULT 'PCS', -- PCS, KG, METER, LITER, BOX
    standard_cost NUMERIC(15,2) DEFAULT 0.00,
    cycle_time_seconds NUMERIC(10,2) DEFAULT 30.00,
    technical_specifications JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2 Multilevel Bill of Materials (BOM)
CREATE TABLE IF NOT EXISTS bill_of_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    child_part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    quantity_required NUMERIC(12,4) NOT NULL,
    scrap_factor_percent NUMERIC(5,2) DEFAULT 0.00,
    find_number VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_part_id, child_part_id)
);

-- 3.3 Manufacturing Routings
CREATE TABLE IF NOT EXISTS routings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    revision VARCHAR(20) DEFAULT 'A',
    description TEXT,
    is_primary BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4 Routing Operations (Step-by-Step Sequences)
CREATE TABLE IF NOT EXISTS routing_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_id UUID NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
    sequence_number INTEGER NOT NULL,
    operation_name VARCHAR(255) NOT NULL,
    workstation_id UUID REFERENCES workstations(id),
    standard_setup_time_minutes NUMERIC(10,2) DEFAULT 15.00,
    standard_run_time_seconds NUMERIC(10,2) DEFAULT 45.00,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(routing_id, sequence_number)
);

-- 3.5 Technical Drawings & 2D CAD
CREATE TABLE IF NOT EXISTS technical_drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
    drawing_number VARCHAR(100) NOT NULL,
    revision VARCHAR(20) DEFAULT 'Rev.0',
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    extracted_features JSONB DEFAULT '[]', -- Auto-extracted tolerances, ballooning coords
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6 Standard Operating Procedures (SOP / Digital Work Instructions)
CREATE TABLE IF NOT EXISTS sops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routing_operation_id UUID REFERENCES routing_operations(id) ON DELETE SET NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    revision VARCHAR(20) DEFAULT '1.0',
    steps JSONB NOT NULL DEFAULT '[]', -- Step array: [{ step: 1, text: '...', media_url: '...' }]
    approved_by UUID REFERENCES user_profiles(id),
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 4. DOMAIN: PRODUCTION EXECUTION & TRACKING
-- -----------------------------------------------------------------------------

-- 4.1 Work Orders (Production Orders / SPK)
CREATE TABLE IF NOT EXISTS work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    line_id UUID REFERENCES lines(id) ON DELETE SET NULL,
    target_quantity NUMERIC(12,2) NOT NULL,
    completed_quantity NUMERIC(12,2) DEFAULT 0.00,
    scrap_quantity NUMERIC(12,2) DEFAULT 0.00,
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- LOW, MEDIUM, HIGH, URGENT
    status VARCHAR(50) DEFAULT 'PLANNED', -- PLANNED, RELEASED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.2 Production Logs (Transaction Output / Realtime Barcode scans)
CREATE TABLE IF NOT EXISTS production_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    workstation_id UUID NOT NULL REFERENCES workstations(id),
    operator_id UUID NOT NULL REFERENCES user_profiles(id),
    shift_id UUID REFERENCES shifts(id),
    produced_quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    good_quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    rejected_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    serial_barcode VARCHAR(100),
    cycle_time_seconds NUMERIC(10,2),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4.3 Machine Downtime Events
CREATE TABLE IF NOT EXISTS downtime_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    category VARCHAR(50) DEFAULT 'UNPLANNED', -- PLANNED, UNPLANNED, CHANGEOVER, MATERIAL_WAIT
    reason_code VARCHAR(100) NOT NULL, -- BREAKDOWN, JAMMED, NO_OPERATOR, NO_MATERIAL
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    duration_seconds INTEGER,
    operator_notes TEXT,
    action_taken TEXT,
    resolved_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.4 OEE Metrics (Overall Equipment Effectiveness)
CREATE TABLE IF NOT EXISTS oee_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id),
    metric_date DATE NOT NULL,
    availability_rate NUMERIC(5,2) DEFAULT 0.00, -- e.g. 92.50%
    performance_rate NUMERIC(5,2) DEFAULT 0.00,  -- e.g. 88.20%
    quality_rate NUMERIC(5,2) DEFAULT 0.00,      -- e.g. 98.00%
    oee_score NUMERIC(5,2) DEFAULT 0.00,         -- Availability * Performance * Quality
    planned_production_time_min INTEGER DEFAULT 480,
    operating_time_min INTEGER DEFAULT 0,
    ideal_cycle_time_sec NUMERIC(8,2) DEFAULT 10.00,
    total_count INTEGER DEFAULT 0,
    good_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(machine_id, shift_id, metric_date)
);

-- -----------------------------------------------------------------------------
-- 5. DOMAIN: WAREHOUSE, INVENTORY & TRACEABILITY
-- -----------------------------------------------------------------------------

-- 5.1 Warehouse Locations / Storage Bins
CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
    zone VARCHAR(50) NOT NULL, -- RM (Raw Mat), WIP (Work In Progress), FG (Finished Goods)
    aisle VARCHAR(20),
    rack VARCHAR(20),
    bin VARCHAR(20),
    code VARCHAR(100) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.2 Suppliers / Vendors
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    rating NUMERIC(3,2) DEFAULT 5.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.3 Lots & Batch Traceability
CREATE TABLE IF NOT EXISTS lots_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE RESTRICT,
    lot_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id UUID REFERENCES suppliers(id),
    manufacture_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    initial_quantity NUMERIC(15,2) NOT NULL,
    current_quantity NUMERIC(15,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'RELEASED', -- QUARANTINE, RELEASED, REJECTED, EXPIRED
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5.4 Inventory Items (Realtime Stock on hand)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    location_id UUID REFERENCES warehouse_locations(id) ON DELETE SET NULL,
    lot_id UUID REFERENCES lots_batches(id) ON DELETE SET NULL,
    quantity_on_hand NUMERIC(15,2) DEFAULT 0.00,
    quantity_reserved NUMERIC(15,2) DEFAULT 0.00,
    minimum_stock_level NUMERIC(15,2) DEFAULT 10.00,
    maximum_stock_level NUMERIC(15,2) DEFAULT 1000.00,
    last_counted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(part_id, location_id, lot_id)
);

-- 5.5 Stock Movements / Ledger
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id),
    lot_id UUID REFERENCES lots_batches(id),
    movement_type VARCHAR(50) NOT NULL, -- RECEIPT, ISSUE_TO_PRODUCTION, RETURN, ADJUSTMENT, TRANSFER
    source_location_id UUID REFERENCES warehouse_locations(id),
    dest_location_id UUID REFERENCES warehouse_locations(id),
    work_order_id UUID REFERENCES work_orders(id),
    quantity NUMERIC(15,2) NOT NULL,
    performed_by UUID NOT NULL REFERENCES user_profiles(id),
    reference_document VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. DOMAIN: QUALITY ASSURANCE & CHECKSHEETS (QC/QA)
-- -----------------------------------------------------------------------------

-- 6.1 Inspection Plans
CREATE TABLE IF NOT EXISTS inspection_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID NOT NULL REFERENCES parts(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    inspection_stage VARCHAR(50) DEFAULT 'IN_PROCESS', -- INCOMING, IN_PROCESS, FINAL, PDI
    sampling_rule VARCHAR(50) DEFAULT '100_PERCENT', -- 100_PERCENT, AQL_LEVEL_2, SAMPLE_5
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.2 Checksheet Templates (Definition of Items to check)
CREATE TABLE IF NOT EXISTS checksheet_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_plan_id UUID NOT NULL REFERENCES inspection_plans(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0',
    parameters JSONB NOT NULL DEFAULT '[]', -- Array of { item: 1, param: 'Diameter', nominal: 10.0, lsl: 9.8, usl: 10.2, unit: 'mm', tool: 'caliper' }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.3 Checksheet Runs / Execution Submissions
CREATE TABLE IF NOT EXISTS checksheet_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checksheet_template_id UUID NOT NULL REFERENCES checksheet_templates(id),
    work_order_id UUID REFERENCES work_orders(id),
    inspector_id UUID NOT NULL REFERENCES user_profiles(id),
    lot_id UUID REFERENCES lots_batches(id),
    serial_number VARCHAR(100),
    results JSONB NOT NULL DEFAULT '{}', -- Key-value parameter readings
    overall_status VARCHAR(20) DEFAULT 'PASS', -- PASS, FAIL, REWORK
    inspector_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6.4 Defect Records (Non-Conformance / NG Pareto)
CREATE TABLE IF NOT EXISTS defect_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id UUID REFERENCES parts(id),
    workstation_id UUID REFERENCES workstations(id),
    defect_code VARCHAR(50) NOT NULL, -- DENT, SCRATCH, BURR, WRONG_DIMENSION, DISCOLOR
    defect_category VARCHAR(50) DEFAULT 'WORKMANSHIP', -- MATERIAL, PROCESS, TOOLING, WORKMANSHIP
    quantity_defective NUMERIC(10,2) NOT NULL DEFAULT 1,
    discovered_by UUID NOT NULL REFERENCES user_profiles(id),
    disposition VARCHAR(50) DEFAULT 'SCRAP', -- SCRAP, REWORK, CONCESSION, RETURN_SUPPLIER
    photo_url TEXT,
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 6.5 Corrective and Preventive Actions (CAPA)
CREATE TABLE IF NOT EXISTS capa_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    defect_id UUID REFERENCES defect_records(id) ON DELETE SET NULL,
    problem_statement TEXT NOT NULL,
    root_cause_analysis TEXT, -- 5-Why or Fishbone
    corrective_action TEXT NOT NULL,
    assigned_to UUID REFERENCES user_profiles(id),
    due_date DATE,
    status VARCHAR(50) DEFAULT 'OPEN', -- OPEN, IN_PROGRESS, VERIFIED, CLOSED
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. DOMAIN: IOT, EDGE SENSORS & TELEMETRY
-- -----------------------------------------------------------------------------

-- 7.1 IoT Devices / Edge Gateways (Raspberry Pi, ESP32, Industrial IPC)
CREATE TABLE IF NOT EXISTS iot_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE SET NULL,
    device_uid VARCHAR(100) UNIQUE NOT NULL,
    device_name VARCHAR(255) NOT NULL,
    device_type VARCHAR(50) DEFAULT 'EDGE_GATEWAY', -- SENSOR_NODE, EDGE_GATEWAY, SMART_CALIPER
    firmware_version VARCHAR(50) DEFAULT '1.0.0',
    ip_address VARCHAR(45),
    mac_address VARCHAR(50),
    auth_token TEXT,
    last_heartbeat TIMESTAMPTZ,
    is_online BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7.2 Sensor Telemetry Stream (Timeseries with JSONB payload)
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    id BIGSERIAL,
    iot_device_id UUID NOT NULL REFERENCES iot_devices(id) ON DELETE CASCADE,
    machine_id UUID REFERENCES machines(id),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payload JSONB NOT NULL, -- e.g. {"temperature": 75.4, "vibration": 1.2, "rpm": 1450, "current": 12.8}
    PRIMARY KEY (id, timestamp)
);

-- 7.3 Alarms & Threshold Alerts
CREATE TABLE IF NOT EXISTS alarms_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    machine_id UUID REFERENCES machines(id) ON DELETE CASCADE,
    iot_device_id UUID REFERENCES iot_devices(id),
    severity VARCHAR(20) DEFAULT 'WARNING', -- INFO, WARNING, CRITICAL, EMERGENCY
    alarm_code VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    metric_value NUMERIC(12,4),
    threshold_value NUMERIC(12,4),
    is_acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by UUID REFERENCES user_profiles(id),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. PERFORMANCE OPTIMIZATION: INDEXES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_work_orders_part_id ON work_orders(part_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_sched_start ON work_orders(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_production_logs_wo ON production_logs(work_order_id);
CREATE INDEX IF NOT EXISTS idx_production_logs_timestamp ON production_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_oee_metrics_machine_date ON oee_metrics(machine_id, metric_date);
CREATE INDEX IF NOT EXISTS idx_telemetry_device_time ON sensor_telemetry(iot_device_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_part_loc ON inventory_items(part_id, location_id);
CREATE INDEX IF NOT EXISTS idx_defect_records_code ON defect_records(defect_code);
CREATE INDEX IF NOT EXISTS idx_checksheet_runs_wo ON checksheet_runs(work_order_id);

-- -----------------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE defect_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;

-- 9.1 Public Read for Authenticated Users
CREATE POLICY "Allow authenticated read on plants" ON plants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on lines" ON lines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on workstations" ON workstations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on machines" ON machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on work_orders" ON work_orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read on inventory" ON inventory_items FOR SELECT TO authenticated USING (true);

-- 9.2 Operator Production Log Inserts
CREATE POLICY "Allow authenticated insert on production_logs" ON production_logs 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Allow authenticated read on production_logs" ON production_logs 
FOR SELECT TO authenticated USING (true);

-- 9.3 User Profile self management
CREATE POLICY "Users can view all profiles" ON user_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- -----------------------------------------------------------------------------
-- 10. AUTOMATED TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_plants_updated_at BEFORE UPDATE ON plants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_lines_updated_at BEFORE UPDATE ON lines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_machines_updated_at BEFORE UPDATE ON machines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_parts_updated_at BEFORE UPDATE ON parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment work order completed_quantity when production_log is created
CREATE OR REPLACE FUNCTION update_work_order_progress()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE work_orders
    SET completed_quantity = completed_quantity + NEW.good_quantity,
        scrap_quantity = scrap_quantity + NEW.rejected_quantity,
        status = CASE 
            WHEN (completed_quantity + NEW.good_quantity) >= target_quantity THEN 'COMPLETED'
            ELSE 'IN_PROGRESS'
        END,
        actual_start = COALESCE(actual_start, NOW())
    WHERE id = NEW.work_order_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_production_log_progress
AFTER INSERT ON production_logs
FOR EACH ROW EXECUTE FUNCTION update_work_order_progress();

-- -----------------------------------------------------------------------------
-- 11. SAMPLE ENTERPRISE SEED DATA
-- -----------------------------------------------------------------------------
-- 11.1 Seed Plant
INSERT INTO plants (id, code, name, location)
VALUES ('11111111-1111-1111-1111-111111111111', 'PLANT-CIKARANG', 'MaviCore Cikarang Smart Plant', 'Kawasan Industri GIIC Cikarang')
ON CONFLICT (code) DO NOTHING;

-- 11.2 Seed Department
INSERT INTO departments (id, plant_id, code, name)
VALUES ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'DEPT-MACHINING', 'CNC Machining & Fabrication')
ON CONFLICT (plant_id, code) DO NOTHING;

-- 11.3 Seed Line
INSERT INTO lines (id, department_id, code, name, line_type)
VALUES ('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'LINE-CNC-01', 'CNC Precision Line 01', 'MACHINING')
ON CONFLICT (department_id, code) DO NOTHING;

-- 11.4 Seed Workstation
INSERT INTO workstations (id, line_id, code, name, station_sequence)
VALUES ('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', 'WS-MILL-01', 'Milling Workstation 1', 1)
ON CONFLICT (line_id, code) DO NOTHING;

-- 11.5 Seed Machine
INSERT INTO machines (id, workstation_id, code, name, brand, model_number, status)
VALUES ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'MC-DMG-01', 'DMG MORI 5-Axis CNC', 'DMG MORI', 'DMU 50', 'RUNNING')
ON CONFLICT (code) DO NOTHING;

-- 11.6 Seed Roles
INSERT INTO roles (role_key, role_name, description) VALUES
('operator', 'Machine Operator', 'Menjalankan mesin dan menginput data produksi'),
('supervisor', 'Production Supervisor', 'Mengelola work order dan monitoring OEE line'),
('quality_inspector', 'QC Inspector', 'Melakukan checksheet inspeksi dan audit toleransi'),
('admin', 'System Administrator', 'Akses penuh ke seluruh konfigurasi MES')
ON CONFLICT (role_key) DO NOTHING;

-- 11.7 Seed Part
INSERT INTO parts (id, part_number, name, category, unit_of_measure, standard_cost, cycle_time_seconds)
VALUES ('66666666-6666-6666-6666-666666666666', 'PART-FLANGE-001', 'Precision Flange Stainless 316', 'FINISHED_GOOD', 'PCS', 185000.00, 45.00)
ON CONFLICT (part_number) DO NOTHING;

-- 11.8 Seed Work Order
INSERT INTO work_orders (id, order_number, part_id, line_id, target_quantity, scheduled_start, scheduled_end, status)
VALUES ('77777777-7777-7777-7777-777777777777', 'WO-2026-09-001', '66666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', 500, NOW(), NOW() + INTERVAL '2 days', 'IN_PROGRESS')
ON CONFLICT (order_number) DO NOTHING;

-- =============================================================================
-- END OF MAVICORE ENTERPRISE MES SCHEMA BLUEPRINT
-- =============================================================================
