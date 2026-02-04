-- Contract/Lease Signing System
-- Allows admins to upload PDF leases and applicants to sign via canvas signature pad

-- ============================================
-- Contracts Table
-- ============================================
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- PDF document
  document_file_name TEXT NOT NULL,
  document_url TEXT NOT NULL,

  -- Status & signing
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed')),
  signing_token UUID NOT NULL DEFAULT uuid_generate_v4(),

  -- Signature data (populated after signing)
  signature_data_url TEXT,
  signed_at TIMESTAMP WITH TIME ZONE,
  signer_ip TEXT,
  signer_user_agent TEXT,

  -- Timestamps
  sent_at TIMESTAMP WITH TIME ZONE,
  viewed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_signing_token ON contracts(signing_token);
CREATE INDEX IF NOT EXISTS idx_contracts_opportunity_id ON contracts(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_contracts_applicant_id ON contracts(applicant_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_property_id ON contracts(property_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage contracts" ON contracts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Applicants can view their own contracts
CREATE POLICY "Applicants can view own contracts" ON contracts
  FOR SELECT
  USING (applicant_id = auth.uid());

-- Applicants can update their own contracts (for signing)
CREATE POLICY "Applicants can sign own contracts" ON contracts
  FOR UPDATE
  USING (applicant_id = auth.uid());

-- ============================================
-- Updated_at Trigger
-- ============================================
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
