// Payment System Type Definitions

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'

export type PaymentType = 'rent' | 'late_fee' | 'other'

export type PaymentMethodType = 'stripe_ach' | 'stripe_card' | 'check' | 'cash' | 'money_order'

export type SavedPaymentMethodType = 'ach' | 'card'

export type SavedPaymentMethodStatus = 'active' | 'inactive'

// Main payment record
export interface Payment {
  id: string
  tenant_id: string
  property_id: string

  // Payment details
  amount: number
  payment_type: PaymentType
  payment_method: PaymentMethodType

  // Payment status
  status: PaymentStatus

  // Stripe integration
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_fee_amount: number | null

  // Period tracking
  period_start: string | null
  period_end: string | null
  due_date: string

  // Payment tracking
  payment_date: string | null
  recorded_by: string | null // Admin user ID for manual payments
  is_autopay: boolean

  // Additional info
  notes: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

// Extended payment with related data
export interface PaymentWithDetails extends Payment {
  tenant?: {
    id: string
    unit_number: string | null
    user: {
      id: string
      full_name: string
      email: string
    }
  }
  property?: {
    id: string
    name: string | null
    address: string
  }
}

// Saved payment method (Stripe)
export interface SavedPaymentMethod {
  id: string
  user_id: string

  // Stripe details
  stripe_payment_method_id: string
  stripe_customer_id: string

  // Method type and details
  type: SavedPaymentMethodType
  is_default: boolean

  // Display information
  last4: string | null
  bank_name: string | null // For ACH
  card_brand: string | null // For cards
  exp_month: number | null // For cards
  exp_year: number | null // For cards

  // Status
  status: SavedPaymentMethodStatus

  // Timestamps
  created_at: string
  updated_at: string
}

// Autopay enrollment
export interface AutopayEnrollment {
  id: string
  tenant_id: string
  payment_method_id: string

  // Enrollment details
  is_active: boolean
  discount_amount: number // Default $25.00

  // Enrollment tracking
  enrolled_at: string
  cancelled_at: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

// Extended autopay enrollment with payment method details
export interface AutopayEnrollmentWithDetails extends AutopayEnrollment {
  payment_method?: SavedPaymentMethod
}

// Payment summary for dashboard
export interface PaymentSummary {
  totalPaid: number
  totalPending: number
  totalOverdue: number
  totalFailed: number
  upcomingPayments: Payment[]
  overduePayments: Payment[]
  recentPayments: Payment[]
}

// Tenant payment status (for dashboard)
export interface TenantPaymentStatus {
  tenant_id: string
  current_month_status: 'paid' | 'unpaid' | 'overdue' | 'partial' | 'processing'
  current_month_payment: Payment | null
  next_due_date: string
  next_amount: number
  is_enrolled_in_autopay: boolean
  autopay_discount: number
  recent_payments: Payment[]
  total_paid: number
}

// Property payment summary (for admin)
export interface PropertyPaymentSummary {
  property_id: string
  property_name: string
  total_expected: number
  total_collected: number
  total_pending: number
  total_overdue: number
  collection_rate: number // Percentage
  autopay_enrollment_rate: number // Percentage
  tenant_count: number
  paid_tenant_count: number
}

// Admin payments overview
export interface AdminPaymentsOverview {
  summary: {
    total_expected: number
    total_collected: number
    total_pending: number
    total_overdue: number
    collection_rate: number
    autopay_enrollment_rate: number
  }
  by_property: PropertyPaymentSummary[]
  recent_payments: PaymentWithDetails[]
}

// API request/response types

// Create payment intent request
export interface CreatePaymentIntentRequest {
  tenant_id: string
  amount: number
  payment_type: PaymentType
  period_start?: string
  period_end?: string
  due_date?: string
  payment_method_id?: string // Optional: use saved payment method
}

// Create payment intent response
export interface CreatePaymentIntentResponse {
  payment_intent_id: string
  client_secret: string
  payment_id: string
  amount: number
}

// Manual payment request
export interface ManualPaymentRequest {
  tenant_id: string
  amount: number
  payment_type: PaymentType
  payment_method: Extract<PaymentMethodType, 'check' | 'cash' | 'money_order'>
  payment_date: string
  period_start?: string
  period_end?: string
  notes?: string
}

// Attach payment method request
export interface AttachPaymentMethodRequest {
  stripe_payment_method_id: string
  is_default?: boolean
}

// Autopay enrollment request
export interface AutopayEnrollRequest {
  payment_method_id: string
}

// Refund payment request
export interface RefundPaymentRequest {
  payment_id: string
  amount?: number // Optional for partial refund
  reason?: string
}

// Stripe webhook event types
export type StripeWebhookEvent =
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed'
  | 'payment_intent.processing'
  | 'charge.refunded'
  | 'payment_method.attached'
  | 'customer.created'
