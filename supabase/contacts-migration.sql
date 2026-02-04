-- ============================================
-- Contacts System Migration
-- Creates separate contacts table decoupled from users_profile
-- ============================================

-- ============================================
-- contacts table
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT NOT NULL DEFAULT 'manual',  -- manual, signup, invitation, facebook, email, phone, other
  notes TEXT,
  user_id UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- contact_history table (changelog)
-- ============================================
CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_created_by ON contacts(created_by);
CREATE INDEX IF NOT EXISTS idx_contacts_source ON contacts(source);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_id_unique ON contacts(user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contact_history_contact_id ON contact_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_history_changed_at ON contact_history(changed_at);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

-- Admins can do everything with contacts
CREATE POLICY "Admins can manage contacts" ON contacts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- Users can view their own linked contact
CREATE POLICY "Users can view own contact" ON contacts
  FOR SELECT USING (user_id = auth.uid());

-- Admins can view and insert contact history
CREATE POLICY "Admins can manage contact history" ON contact_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid() AND users_profile.role = 'admin'
    )
  );

-- Users can insert history for their own linked contact (for profile sync)
CREATE POLICY "Users can insert own contact history" ON contact_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_history.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- Users can view history for their own linked contact
CREATE POLICY "Users can view own contact history" ON contact_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = contact_history.contact_id
      AND contacts.user_id = auth.uid()
    )
  );

-- ============================================
-- Triggers
-- ============================================
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Add contact_id to user_invitations (for invite-from-contact flow)
-- ============================================
ALTER TABLE user_invitations ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- ============================================
-- Make legacy_user_contact_id nullable (contacts without user accounts need opportunities)
-- ============================================
-- NOTE: After finalize migration, contact_id points to contacts table,
-- legacy_user_contact_id points to users_profile (old contact_id).
ALTER TABLE opportunities ALTER COLUMN legacy_user_contact_id DROP NOT NULL;

-- ============================================
-- DATA MIGRATION: Create contacts for existing non-admin users
-- ============================================
INSERT INTO contacts (full_name, email, phone, source, user_id, created_at, updated_at)
SELECT
  up.full_name,
  up.email,
  up.phone,
  'signup' AS source,
  up.id AS user_id,
  up.created_at,
  up.updated_at
FROM users_profile up
WHERE up.role IN ('applicant', 'tenant')
  AND NOT EXISTS (
    SELECT 1 FROM contacts c WHERE c.user_id = up.id
  );

-- ============================================
-- Populate contact_id on existing opportunities (points to contacts table)
-- ============================================
UPDATE opportunities o
SET contact_id = c.id
FROM contacts c
WHERE c.user_id = o.legacy_user_contact_id
  AND o.contact_id IS NULL;

-- ============================================
-- RLS: Allow users to view their own opportunities via contacts link
-- (The original crm-schema.sql only had admin policies for opportunities)
-- ============================================
CREATE POLICY "Users can view own opportunities via contact" ON opportunities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM contacts
      WHERE contacts.id = opportunities.contact_id
      AND contacts.user_id = auth.uid()
    )
    OR legacy_user_contact_id = auth.uid()  -- legacy fallback
  );
