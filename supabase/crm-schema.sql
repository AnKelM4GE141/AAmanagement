-- CRM System Database Schema
-- Phase 4B: Database tables for CRM admin panel

-- ============================================
-- Business Settings Table
-- ============================================
CREATE TABLE IF NOT EXISTS business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  business_name TEXT DEFAULT 'AA Portal',
  logo_url TEXT,
  primary_email TEXT,
  primary_phone TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT one_settings_per_owner UNIQUE (owner_id)
);

-- ============================================
-- Conversations Tables
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL CHECK (channel IN ('email', 'phone', 'in_app_chat')),
  subject TEXT,
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending')),
  assigned_to UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_internal_note BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Opportunities Table (Pipeline/Sales tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS opportunities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  stage VARCHAR(50) NOT NULL CHECK (stage IN (
    'lead',
    'contacted',
    'application_submitted',
    'application_reviewing',
    'approved',
    'lease_signed',
    'moved_in',
    'lost'
  )),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  expected_move_in DATE,
  value DECIMAL(10, 2), -- Expected first month rent or total lease value
  probability INTEGER CHECK (probability BETWEEN 0 AND 100),
  notes TEXT,
  assigned_to UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Property Documents Table
-- ============================================
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- 'lease_template', 'rules', 'inspection_report', etc.
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  uploaded_by UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Appointments Table
-- ============================================
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  appointment_type VARCHAR(50) NOT NULL CHECK (appointment_type IN (
    'showing',
    'inspection',
    'meeting',
    'maintenance'
  )),
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
  )),
  notes TEXT,
  assigned_to UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Maintenance Requests Tables
-- ============================================
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(50) DEFAULT 'submitted' CHECK (status IN (
    'submitted',
    'in_progress',
    'completed',
    'cancelled'
  )),
  assigned_to UUID REFERENCES users_profile(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maintenance_request_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID NOT NULL REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL, -- Supabase Storage URL
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes
-- ============================================

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_contact_id ON conversations(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_assigned_to ON conversations(assigned_to);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conversation_id ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender_id ON conversation_messages(sender_id);

-- Opportunities indexes
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_property_id ON opportunities(property_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_assigned_to ON opportunities(assigned_to);

-- Property documents indexes
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_uploaded_by ON property_documents(uploaded_by);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_contact_id ON appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_appointments_property_id ON appointments(property_id);
CREATE INDEX IF NOT EXISTS idx_appointments_assigned_to ON appointments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

-- Maintenance requests indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_tenant_id ON maintenance_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_property_id ON maintenance_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_status ON maintenance_requests(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_priority ON maintenance_requests(priority);
CREATE INDEX IF NOT EXISTS idx_maintenance_requests_assigned_to ON maintenance_requests(assigned_to);
CREATE INDEX IF NOT EXISTS idx_maintenance_request_photos_request_id ON maintenance_request_photos(request_id);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_request_photos ENABLE ROW LEVEL SECURITY;

-- Business Settings Policies
-- Only admins can view/update business settings
CREATE POLICY "Admins can view business settings" ON business_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can update business settings" ON business_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

CREATE POLICY "Admins can insert business settings" ON business_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Conversations Policies
-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations" ON conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Users can view conversations they're involved in
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT
  USING (contact_id = auth.uid() OR assigned_to = auth.uid());

-- Admins can manage conversations
CREATE POLICY "Admins can manage conversations" ON conversations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Conversation Messages Policies
-- Admins can view all messages
CREATE POLICY "Admins can view all messages" ON conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Users can view messages in their conversations
CREATE POLICY "Users can view own messages" ON conversation_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_messages.conversation_id
      AND (conversations.contact_id = auth.uid() OR conversations.assigned_to = auth.uid())
    )
  );

-- Admins and involved users can create messages
CREATE POLICY "Admins can create messages" ON conversation_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Opportunities Policies
-- Admins can view all opportunities
CREATE POLICY "Admins can view all opportunities" ON opportunities
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Admins can manage opportunities
CREATE POLICY "Admins can manage opportunities" ON opportunities
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Property Documents Policies
-- Admins can view all property documents
CREATE POLICY "Admins can view all property documents" ON property_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Tenants can view documents for their property
CREATE POLICY "Tenants can view own property documents" ON property_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.user_id = auth.uid()
      AND tenants.property_id = property_documents.property_id
      AND tenants.status = 'active'
    )
  );

-- Admins can manage property documents
CREATE POLICY "Admins can manage property documents" ON property_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Appointments Policies
-- Admins can view all appointments
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON appointments
  FOR SELECT
  USING (contact_id = auth.uid() OR assigned_to = auth.uid());

-- Admins can manage appointments
CREATE POLICY "Admins can manage appointments" ON appointments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Maintenance Requests Policies
-- Admins can view all maintenance requests
CREATE POLICY "Admins can view all maintenance requests" ON maintenance_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Tenants can view their own maintenance requests
CREATE POLICY "Tenants can view own maintenance requests" ON maintenance_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = maintenance_requests.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Tenants can create maintenance requests
CREATE POLICY "Tenants can create maintenance requests" ON maintenance_requests
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = tenant_id
      AND tenants.user_id = auth.uid()
      AND tenants.status = 'active'
    )
  );

-- Admins can manage maintenance requests
CREATE POLICY "Admins can manage maintenance requests" ON maintenance_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Maintenance Request Photos Policies
-- Admins can view all photos
CREATE POLICY "Admins can view all maintenance photos" ON maintenance_request_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users_profile
      WHERE users_profile.id = auth.uid()
      AND users_profile.role = 'admin'
    )
  );

-- Tenants can view photos for their requests
CREATE POLICY "Tenants can view own maintenance photos" ON maintenance_request_photos
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      JOIN tenants ON tenants.id = maintenance_requests.tenant_id
      WHERE maintenance_requests.id = maintenance_request_photos.request_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Tenants can upload photos to their requests
CREATE POLICY "Tenants can upload maintenance photos" ON maintenance_request_photos
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM maintenance_requests
      JOIN tenants ON tenants.id = maintenance_requests.tenant_id
      WHERE maintenance_requests.id = request_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Admins can manage photos
CREATE POLICY "Admins can manage maintenance photos" ON maintenance_request_photos
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

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for tables with updated_at
CREATE TRIGGER update_business_settings_updated_at BEFORE UPDATE ON business_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opportunities_updated_at BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at BEFORE UPDATE ON maintenance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data
-- ============================================

-- No initial data needed for CRM tables
-- Business settings will be created when owner first accesses settings page
