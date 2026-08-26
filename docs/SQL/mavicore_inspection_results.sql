-- =====================================================
-- INSPECTION RESULTS TABLE
-- Stores actual inspection results linked to balloons
-- =====================================================

CREATE TABLE IF NOT EXISTS inspection_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    balloon_id UUID REFERENCES drawing_balloons(id) ON DELETE SET NULL,
    feature_id UUID REFERENCES drawing_features(id) ON DELETE SET NULL,
    inspector_template_id UUID,
    checksheet_id UUID,
    result_value TEXT,
    result_status VARCHAR(20) DEFAULT 'PENDING', -- 'OK', 'NG', 'SKIP', 'PENDING'
    notes TEXT,
    photo_url TEXT,
    inspected_by UUID,
    inspector_name VARCHAR(255),
    inspected_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

-- Enable RLS
ALTER TABLE inspection_results ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view inspection results" ON inspection_results
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert inspection results" ON inspection_results
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update inspection results" ON inspection_results
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete inspection results" ON inspection_results
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inspection_results_balloon ON inspection_results(balloon_id);
CREATE INDEX IF NOT EXISTS idx_inspection_results_feature ON inspection_results(feature_id);
CREATE INDEX IF NOT EXISTS idx_inspection_results_status ON inspection_results(result_status);
CREATE INDEX IF NOT EXISTS idx_inspection_results_date ON inspection_results(inspected_at);
