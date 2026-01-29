-- Pipelines System for Opportunities
-- Allows admins to create multiple custom pipelines with custom stages

-- ============================================
-- Pipelines Table
-- ============================================
CREATE TABLE IF NOT EXISTS pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Pipeline Stages Table
-- ============================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'gray' CHECK (color IN ('gray', 'blue', 'yellow', 'green', 'indigo', 'red', 'purple', 'pink', 'orange')),
  position INTEGER NOT NULL, -- Order of stages
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (pipeline_id, position)
);

-- Update opportunities table to reference pipeline
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL;

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_pipelines_created_by ON pipelines(created_by);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_pipeline_id ON pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_pipeline_id ON opportunities(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage_id ON opportunities(stage_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Admins can view all pipelines
CREATE POLICY "Admins can view all pipelines" ON pipelines
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Admins can manage pipelines
CREATE POLICY "Admins can manage pipelines" ON pipelines
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Admins can view all pipeline stages
CREATE POLICY "Admins can view all pipeline stages" ON pipeline_stages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Admins can manage pipeline stages
CREATE POLICY "Admins can manage pipeline stages" ON pipeline_stages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- ============================================
-- Updated_at Triggers
-- ============================================
CREATE TRIGGER update_pipelines_updated_at BEFORE UPDATE ON pipelines
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data - Default Leasing Pipeline
-- ============================================
-- Insert default leasing pipeline
INSERT INTO pipelines (name, description, is_default, created_at)
VALUES
  ('Default Leasing Pipeline', 'Standard pipeline for tracking rental applications through lease signing', TRUE, NOW())
ON CONFLICT DO NOTHING;

-- Get the pipeline ID
DO $$
DECLARE
  default_pipeline_id UUID;
BEGIN
  SELECT id INTO default_pipeline_id FROM pipelines WHERE is_default = TRUE LIMIT 1;

  -- Insert default stages
  INSERT INTO pipeline_stages (pipeline_id, name, color, position) VALUES
    (default_pipeline_id, 'Lead', 'gray', 1),
    (default_pipeline_id, 'Contacted', 'blue', 2),
    (default_pipeline_id, 'Application Submitted', 'yellow', 3),
    (default_pipeline_id, 'Reviewing', 'yellow', 4),
    (default_pipeline_id, 'Approved', 'green', 5),
    (default_pipeline_id, 'Lease Signed', 'green', 6),
    (default_pipeline_id, 'Moved In', 'indigo', 7),
    (default_pipeline_id, 'Lost', 'red', 8)
  ON CONFLICT DO NOTHING;
END $$;
