-- Enhance properties table with more details
ALTER TABLE properties ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 1;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS property_type TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger for properties updated_at
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enhance tenants table for better rent tracking
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_in_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS move_out_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS security_deposit DECIMAL(10, 2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add trigger for tenants updated_at
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can update properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete properties" ON properties;
DROP POLICY IF EXISTS "Admins can update tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can delete tenants" ON tenants;

-- Add RLS policies for property updates
CREATE POLICY "Admins can update properties"
  ON properties
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Add RLS policies for property deletion
CREATE POLICY "Admins can delete properties"
  ON properties
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Add RLS policies for tenant updates
CREATE POLICY "Admins can update tenants"
  ON tenants
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Add RLS policies for tenant deletion
CREATE POLICY "Admins can delete tenants"
  ON tenants
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_landlord_id ON properties(landlord_id);
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
