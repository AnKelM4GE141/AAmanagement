-- ============================================
-- Contacts Migration Finalize
-- Run AFTER all code is deployed and verified using new_contact_id
-- This swaps the column names so contact_id on opportunities
-- points to the contacts table instead of users_profile
-- ============================================

-- Step 1: Drop the old FK constraint on contact_id (points to users_profile)
ALTER TABLE opportunities DROP CONSTRAINT IF EXISTS opportunities_contact_id_fkey;

-- Step 2: Rename columns
ALTER TABLE opportunities RENAME COLUMN contact_id TO legacy_user_contact_id;
ALTER TABLE opportunities RENAME COLUMN new_contact_id TO contact_id;

-- Step 3: Drop old index and create new one
DROP INDEX IF EXISTS idx_opportunities_new_contact_id;
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id_new ON opportunities(contact_id);

-- Step 4: Same treatment for conversations table if in use
-- ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_contact_id_fkey;
-- ALTER TABLE conversations ADD COLUMN IF NOT EXISTS new_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE;
-- UPDATE conversations conv SET new_contact_id = c.id FROM contacts c WHERE c.user_id = conv.contact_id;
-- ALTER TABLE conversations RENAME COLUMN contact_id TO legacy_user_contact_id;
-- ALTER TABLE conversations RENAME COLUMN new_contact_id TO contact_id;

-- Step 5: Same treatment for appointments table if in use
-- ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_contact_id_fkey;
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS new_contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE;
-- UPDATE appointments appt SET new_contact_id = c.id FROM contacts c WHERE c.user_id = appt.contact_id;
-- ALTER TABLE appointments RENAME COLUMN contact_id TO legacy_user_contact_id;
-- ALTER TABLE appointments RENAME COLUMN new_contact_id TO contact_id;

-- NOTE: After verifying everything works, you can drop the legacy columns:
-- ALTER TABLE opportunities DROP COLUMN legacy_user_contact_id;
