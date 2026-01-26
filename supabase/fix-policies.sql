-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON users_profile;
DROP POLICY IF EXISTS "Admins can update any profile" ON users_profile;
DROP POLICY IF EXISTS "Admins can view invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can create invitations" ON user_invitations;
DROP POLICY IF EXISTS "Admins can view all properties" ON properties;
DROP POLICY IF EXISTS "Admins can insert properties" ON properties;
DROP POLICY IF EXISTS "Admins can view all tenants" ON tenants;
DROP POLICY IF EXISTS "Admins can insert tenants" ON tenants;

-- Create a function to check if user is admin (bypasses RLS with SECURITY DEFINER)
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users_profile
    WHERE id = user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies using the function

-- Users Profile Policies
CREATE POLICY "Admins can view all profiles"
  ON users_profile
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update any profile"
  ON users_profile
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- User Invitations Policies
CREATE POLICY "Admins can view invitations"
  ON user_invitations
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can create invitations"
  ON user_invitations
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Properties Policies
CREATE POLICY "Admins can view all properties"
  ON properties
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert properties"
  ON properties
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Tenants Policies
CREATE POLICY "Admins can view all tenants"
  ON tenants
  FOR SELECT
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert tenants"
  ON tenants
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));
