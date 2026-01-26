-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('admin', 'tenant', 'applicant');

-- Users Profile Table (extends auth.users)
CREATE TABLE users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'applicant',
  is_owner BOOLEAN NOT NULL DEFAULT FALSE,
  invited_by UUID REFERENCES users_profile(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Invitations Table
CREATE TABLE user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Properties Table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  landlord_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tenants Table (additional tenant-specific info)
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_number TEXT,
  lease_start DATE,
  lease_end DATE,
  rent_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users_profile

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON users_profile
  FOR SELECT
  USING (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON users_profile
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users_profile
  FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY "Admins can update any profile"
  ON users_profile
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow profile creation during signup
CREATE POLICY "Allow profile creation"
  ON users_profile
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- RLS Policies for user_invitations

-- Admins can view all invitations
CREATE POLICY "Admins can view invitations"
  ON user_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON user_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for properties

-- Admins can view all properties
CREATE POLICY "Admins can view all properties"
  ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Tenants can view their assigned property
CREATE POLICY "Tenants can view their property"
  ON properties
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.user_id = auth.uid()
      AND tenants.property_id = properties.id
    )
  );

-- Admins can insert properties
CREATE POLICY "Admins can insert properties"
  ON properties
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for tenants

-- Tenants can view their own record
CREATE POLICY "Tenants can view own record"
  ON tenants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all tenant records
CREATE POLICY "Admins can view all tenants"
  ON tenants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can insert tenant records
CREATE POLICY "Admins can insert tenants"
  ON tenants
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_profile_updated_at
  BEFORE UPDATE ON users_profile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better query performance
CREATE INDEX idx_users_profile_email ON users_profile(email);
CREATE INDEX idx_users_profile_role ON users_profile(role);
CREATE INDEX idx_user_invitations_token ON user_invitations(token);
CREATE INDEX idx_user_invitations_email ON user_invitations(email);
CREATE INDEX idx_tenants_user_id ON tenants(user_id);
CREATE INDEX idx_properties_landlord_id ON properties(landlord_id);
