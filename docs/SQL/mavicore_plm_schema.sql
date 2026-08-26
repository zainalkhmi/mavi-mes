-- =====================================================
-- MAVICORE PLM/PDM DATABASE SCHEMA
-- Drawing Management + Product Structure + Revision
-- =====================================================

-- 1. PRODUCTS (Top-level product/assembly)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- 'ASSEMBLY', 'PRODUCT', 'SEMI-FINISHED'
    status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'DISCONTINUED', 'DRAFT'
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PARTS (Individual parts that belong to products)
CREATE TABLE IF NOT EXISTS parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    part_type VARCHAR(50) DEFAULT 'COMPONENT', -- 'COMPONENT', 'RAW_MATERIAL', 'FINISHED_GOODS'
    unit VARCHAR(20) DEFAULT 'PCS',
    weight DECIMAL(10,3),
    weight_unit VARCHAR(20) DEFAULT 'KG',
    material VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PART REVISIONS (Version history for parts)
CREATE TABLE IF NOT EXISTS part_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
    revision_code VARCHAR(50) NOT NULL, -- 'A', 'B', 'C', '1.0', '2.0', etc.
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'RELEASED', 'SUPERSEDED'
    released_at TIMESTAMPTZ,
    released_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(part_id, revision_code)
);

-- 4. DRAWINGS (Main drawing entities)
CREATE TABLE IF NOT EXISTS drawings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    drawing_type VARCHAR(50) DEFAULT 'DETAIL', -- 'ASSEMBLY', 'DETAIL', 'SCHEMATIC', 'LAYOUT'
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    thumbnail_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    organization_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DRAWING REVISIONS (Version history for drawings)
CREATE TABLE IF NOT EXISTS drawing_revisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
    revision_code VARCHAR(50) NOT NULL, -- 'A', 'B', 'C', '1.0', '2.0'
    description TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'RELEASED', 'SUPERSEDED'
    file_url TEXT,
    file_name TEXT,
    released_at TIMESTAMPTZ,
    released_by UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(drawing_id, revision_code)
);

-- 6. DRAWING RELATIONS (Parent-child relationships)
CREATE TABLE IF NOT EXISTS drawing_relations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
    child_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
    relation_type VARCHAR(50) DEFAULT 'CONTAINS', -- 'CONTAINS', 'REFERENCES', 'USES', 'ASSEMBLES'
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    sequence INTEGER DEFAULT 0,
    quantity DECIMAL(10,2) DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_id, child_id)
);

-- 7. PRODUCT PARTS (Link products to parts with quantity)
CREATE TABLE IF NOT EXISTS product_parts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    part_id UUID REFERENCES parts(id) ON DELETE CASCADE,
    quantity DECIMAL(10,2) DEFAULT 1,
    position INTEGER DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(product_id, part_id)
);

-- 8. DRAWING FEATURES (Features/measurements on drawings)
CREATE TABLE IF NOT EXISTS drawing_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_revision_id UUID REFERENCES drawing_revisions(id) ON DELETE CASCADE,
    feature_code VARCHAR(100) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    feature_type VARCHAR(50) DEFAULT 'DIMENSION', -- 'DIMENSION', 'TOLERANCE', 'SURFACE_FINISH', 'GEOMETRIC', 'TEXT'
    nominal_value DECIMAL(15,5),
    upper_tolerance DECIMAL(15,5),
    lower_tolerance DECIMAL(15,5),
    unit VARCHAR(20),
    position_x INTEGER,
    position_y INTEGER,
    position_z INTEGER,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. DRAWING BALLOONS (Balloon annotations on drawings)
CREATE TABLE IF NOT EXISTS drawing_balloons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_revision_id UUID REFERENCES drawing_revisions(id) ON DELETE CASCADE,
    balloon_number VARCHAR(50) NOT NULL,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    target_feature_id UUID REFERENCES drawing_features(id) ON DELETE SET NULL,
    target_part_id UUID REFERENCES parts(id) ON DELETE SET NULL,
    target_drawing_id UUID REFERENCES drawings(id) ON DELETE SET NULL,
    target_drawing_revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
    symbol VARCHAR(50), -- 'CIRCLE', 'SQUARE', 'TRIANGLE', 'DIAMOND'
    color VARCHAR(20) DEFAULT '#3B82F6',
    size INTEGER DEFAULT 24,
    linked_checksheet_id UUID,
    linked_inspector_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. DRAWING DOCUMENTS (Attached documents for drawings)
CREATE TABLE IF NOT EXISTS drawing_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_id UUID REFERENCES drawings(id) ON DELETE CASCADE,
    drawing_revision_id UUID REFERENCES drawing_revisions(id) ON DELETE SET NULL,
    document_type VARCHAR(50) DEFAULT 'OTHER', -- 'SPECIFICATION', 'STANDARD', 'CERTIFICATE', 'PHOTO', 'OTHER'
    title VARCHAR(255) NOT NULL,
    description TEXT,
    file_url TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. INSPECTION LINKS (Link balloons to inspection templates)
CREATE TABLE IF NOT EXISTS inspection_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    drawing_balloon_id UUID REFERENCES drawing_balloons(id) ON DELETE CASCADE,
    drawing_feature_id UUID REFERENCES drawing_features(id) ON DELETE CASCADE,
    inspector_template_id UUID, -- Link to existing inspector_templates table
    checksheet_id UUID, -- Link to existing checksheets table
    inspection_sequence INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT TRUE,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
CREATE INDEX IF NOT EXISTS idx_parts_org ON parts(organization_id);
CREATE INDEX IF NOT EXISTS idx_drawings_org ON drawings(organization_id);
CREATE INDEX IF NOT EXISTS idx_drawing_relations_parent ON drawing_relations(parent_id);
CREATE INDEX IF NOT EXISTS idx_drawing_relations_child ON drawing_relations(child_id);
CREATE INDEX IF NOT EXISTS idx_product_parts_product ON product_parts(product_id);
CREATE INDEX IF NOT EXISTS idx_product_parts_part ON product_parts(part_id);
CREATE INDEX IF NOT EXISTS idx_drawing_balloons_revision ON drawing_balloons(drawing_revision_id);
CREATE INDEX IF NOT EXISTS idx_drawing_features_revision ON drawing_features(drawing_revision_id);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawings ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_balloons ENABLE ROW LEVEL SECURITY;
ALTER TABLE drawing_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspection_links ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Products policy
CREATE POLICY "Users can view products" ON products FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert products" ON products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update products" ON products FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete products" ON products FOR DELETE USING (auth.uid() IS NOT NULL);

-- Parts policy
CREATE POLICY "Users can view parts" ON parts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert parts" ON parts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update parts" ON parts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete parts" ON parts FOR DELETE USING (auth.uid() IS NOT NULL);

-- Part revisions policy
CREATE POLICY "Users can view part revisions" ON part_revisions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert part revisions" ON part_revisions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update part revisions" ON part_revisions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete part revisions" ON part_revisions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawings policy
CREATE POLICY "Users can view drawings" ON drawings FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawings" ON drawings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawings" ON drawings FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawings" ON drawings FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawing revisions policy
CREATE POLICY "Users can view drawing revisions" ON drawing_revisions FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawing revisions" ON drawing_revisions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawing revisions" ON drawing_revisions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawing revisions" ON drawing_revisions FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawing relations policy
CREATE POLICY "Users can view drawing relations" ON drawing_relations FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawing relations" ON drawing_relations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawing relations" ON drawing_relations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawing relations" ON drawing_relations FOR DELETE USING (auth.uid() IS NOT NULL);

-- Product parts policy
CREATE POLICY "Users can view product parts" ON product_parts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert product parts" ON product_parts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update product parts" ON product_parts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete product parts" ON product_parts FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawing features policy
CREATE POLICY "Users can view drawing features" ON drawing_features FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawing features" ON drawing_features FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawing features" ON drawing_features FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawing features" ON drawing_features FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawing balloons policy
CREATE POLICY "Users can view drawing balloons" ON drawing_balloons FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawing balloons" ON drawing_balloons FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawing balloons" ON drawing_balloons FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawing balloons" ON drawing_balloons FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drawing documents policy
CREATE POLICY "Users can view drawing documents" ON drawing_documents FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert drawing documents" ON drawing_documents FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update drawing documents" ON drawing_documents FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete drawing documents" ON drawing_documents FOR DELETE USING (auth.uid() IS NOT NULL);

-- Inspection links policy
CREATE POLICY "Users can view inspection links" ON inspection_links FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can insert inspection links" ON inspection_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update inspection links" ON inspection_links FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete inspection links" ON inspection_links FOR DELETE USING (auth.uid() IS NOT NULL);
