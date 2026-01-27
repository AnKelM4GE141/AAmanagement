-- =====================================================
-- Payment System Schema for AA Portal
-- Phase 3: Payment System Implementation
-- =====================================================

-- =====================================================
-- 1. CREATE TABLES
-- =====================================================

-- Payments table: Track all rent payments and transactions
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10, 2) NOT NULL,
  payment_type VARCHAR(50) NOT NULL CHECK (payment_type IN ('rent', 'late_fee', 'other')),
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('stripe_ach', 'stripe_card', 'check', 'cash', 'money_order')),

  -- Payment status
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),

  -- Stripe integration fields
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_charge_id TEXT,
  stripe_fee_amount DECIMAL(10, 2),

  -- Period tracking (for rent payments)
  period_start DATE,
  period_end DATE,
  due_date DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE) + interval '1 month',

  -- Payment tracking
  payment_date TIMESTAMP WITH TIME ZONE,
  recorded_by UUID REFERENCES users_profile(id), -- Admin who recorded manual payment
  is_autopay BOOLEAN DEFAULT FALSE, -- True if paid via autopay

  -- Additional info
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment methods table: Store saved Stripe payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,

  -- Stripe details
  stripe_payment_method_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,

  -- Method type and details
  type VARCHAR(50) NOT NULL CHECK (type IN ('ach', 'card')),
  is_default BOOLEAN DEFAULT FALSE,

  -- Display information (from Stripe)
  last4 TEXT, -- Last 4 digits of account/card
  bank_name TEXT, -- For ACH
  card_brand TEXT, -- For cards (visa, mastercard, etc.)
  exp_month INTEGER, -- For cards
  exp_year INTEGER, -- For cards

  -- Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Autopay enrollments table: Track autopay enrollment for discount
CREATE TABLE IF NOT EXISTS autopay_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  payment_method_id UUID NOT NULL REFERENCES payment_methods(id),

  -- Enrollment details
  is_active BOOLEAN DEFAULT TRUE,
  discount_amount DECIMAL(10, 2) DEFAULT 25.00, -- Monthly discount for autopay

  -- Enrollment tracking
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_property_id ON payments(property_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_period ON payments(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent ON payments(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- Payment methods indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_customer ON payment_methods(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_default ON payment_methods(user_id, is_default) WHERE is_default = TRUE;

-- Autopay enrollments indexes
CREATE INDEX IF NOT EXISTS idx_autopay_tenant_id ON autopay_enrollments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_autopay_active ON autopay_enrollments(is_active) WHERE is_active = TRUE;

-- =====================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE autopay_enrollments ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. DROP EXISTING POLICIES (IF ANY)
-- =====================================================

DROP POLICY IF EXISTS "Tenants can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;
DROP POLICY IF EXISTS "Tenants can create payments" ON payments;
DROP POLICY IF EXISTS "Admins can insert payments" ON payments;
DROP POLICY IF EXISTS "Admins can update payments" ON payments;
DROP POLICY IF EXISTS "Admins can delete payments" ON payments;

DROP POLICY IF EXISTS "Users can view own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can view all payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can insert own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can update own payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Users can delete own payment methods" ON payment_methods;

DROP POLICY IF EXISTS "Tenants can view own autopay enrollment" ON autopay_enrollments;
DROP POLICY IF EXISTS "Admins can view all autopay enrollments" ON autopay_enrollments;
DROP POLICY IF EXISTS "Tenants can insert own autopay enrollment" ON autopay_enrollments;
DROP POLICY IF EXISTS "Tenants can update own autopay enrollment" ON autopay_enrollments;
DROP POLICY IF EXISTS "Admins can insert autopay enrollments" ON autopay_enrollments;
DROP POLICY IF EXISTS "Admins can update autopay enrollments" ON autopay_enrollments;
DROP POLICY IF EXISTS "Admins can delete autopay enrollments" ON autopay_enrollments;

-- =====================================================
-- 5. CREATE RLS POLICIES - PAYMENTS TABLE
-- =====================================================

-- Tenants can view their own payments
CREATE POLICY "Tenants can view own payments"
  ON payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = payments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments"
  ON payments
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Tenants can create payments (for online payments)
CREATE POLICY "Tenants can create payments"
  ON payments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = payments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Admins can create payments (for manual recording)
CREATE POLICY "Admins can insert payments"
  ON payments
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update payments (status changes, manual edits)
CREATE POLICY "Admins can update payments"
  ON payments
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete payments
CREATE POLICY "Admins can delete payments"
  ON payments
  FOR DELETE
  USING (is_admin(auth.uid()));

-- =====================================================
-- 6. CREATE RLS POLICIES - PAYMENT METHODS TABLE
-- =====================================================

-- Users can view their own payment methods
CREATE POLICY "Users can view own payment methods"
  ON payment_methods
  FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all payment methods
CREATE POLICY "Admins can view all payment methods"
  ON payment_methods
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Users can insert their own payment methods
CREATE POLICY "Users can insert own payment methods"
  ON payment_methods
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own payment methods
CREATE POLICY "Users can update own payment methods"
  ON payment_methods
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own payment methods
CREATE POLICY "Users can delete own payment methods"
  ON payment_methods
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. CREATE RLS POLICIES - AUTOPAY ENROLLMENTS TABLE
-- =====================================================

-- Tenants can view their own autopay enrollment
CREATE POLICY "Tenants can view own autopay enrollment"
  ON autopay_enrollments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = autopay_enrollments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Admins can view all autopay enrollments
CREATE POLICY "Admins can view all autopay enrollments"
  ON autopay_enrollments
  FOR SELECT
  USING (is_admin(auth.uid()));

-- Tenants can insert their own autopay enrollment
CREATE POLICY "Tenants can insert own autopay enrollment"
  ON autopay_enrollments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = autopay_enrollments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Tenants can update their own autopay enrollment
CREATE POLICY "Tenants can update own autopay enrollment"
  ON autopay_enrollments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.id = autopay_enrollments.tenant_id
      AND tenants.user_id = auth.uid()
    )
  );

-- Admins can insert autopay enrollments
CREATE POLICY "Admins can insert autopay enrollments"
  ON autopay_enrollments
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

-- Admins can update autopay enrollments
CREATE POLICY "Admins can update autopay enrollments"
  ON autopay_enrollments
  FOR UPDATE
  USING (is_admin(auth.uid()));

-- Admins can delete autopay enrollments
CREATE POLICY "Admins can delete autopay enrollments"
  ON autopay_enrollments
  FOR DELETE
  USING (is_admin(auth.uid()));

-- =====================================================
-- 8. CREATE TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Trigger for payments table
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for payment_methods table
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for autopay_enrollments table
CREATE TRIGGER update_autopay_enrollments_updated_at
  BEFORE UPDATE ON autopay_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. HELPER FUNCTIONS
-- =====================================================

-- Function to calculate payment amount with autopay discount
CREATE OR REPLACE FUNCTION calculate_payment_amount(
  p_tenant_id UUID,
  p_base_amount DECIMAL(10, 2)
)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
  v_discount DECIMAL(10, 2);
  v_final_amount DECIMAL(10, 2);
BEGIN
  -- Check if tenant is enrolled in active autopay
  SELECT discount_amount INTO v_discount
  FROM autopay_enrollments
  WHERE tenant_id = p_tenant_id
    AND is_active = TRUE
    AND cancelled_at IS NULL;

  -- Apply discount if enrolled, otherwise use base amount
  IF v_discount IS NOT NULL THEN
    v_final_amount := p_base_amount - v_discount;
  ELSE
    v_final_amount := p_base_amount;
  END IF;

  RETURN v_final_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if payment already exists for period
CREATE OR REPLACE FUNCTION payment_exists_for_period(
  p_tenant_id UUID,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM payments
    WHERE tenant_id = p_tenant_id
      AND period_start = p_period_start
      AND period_end = p_period_end
      AND status IN ('pending', 'processing', 'completed')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SCHEMA CREATION COMPLETE
-- =====================================================

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Payment system schema created successfully!';
  RAISE NOTICE 'Tables created: payments, payment_methods, autopay_enrollments';
  RAISE NOTICE 'RLS policies and indexes configured';
  RAISE NOTICE 'Helper functions created';
END $$;
