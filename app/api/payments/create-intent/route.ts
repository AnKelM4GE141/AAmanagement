import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getOrCreateStripeCustomer,
  createPaymentIntent,
  dollarsToCents,
} from '@/lib/stripe/client'
import type { CreatePaymentIntentRequest } from '@/lib/types/payment'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role, full_name, email')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const body: CreatePaymentIntentRequest = await request.json()
    const {
      tenant_id,
      amount,
      payment_type,
      period_start,
      period_end,
      due_date,
      payment_method_id,
    } = body

    // Validate required fields
    if (!tenant_id || !amount || !payment_type) {
      return NextResponse.json(
        { error: 'Tenant ID, amount, and payment type are required' },
        { status: 400 }
      )
    }

    // Get tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*, property:properties(id, name)')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Authorization check: Only the tenant themselves or an admin can create payment
    const isTenantOwner = tenant.user_id === user.id
    const isAdmin = profile.role === 'admin'

    if (!isTenantOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if tenant is enrolled in autopay
    const { data: autopayEnrollment } = await supabase
      .from('autopay_enrollments')
      .select('discount_amount')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true)
      .is('cancelled_at', null)
      .single()

    // Calculate expected amount with autopay discount if applicable
    let expectedAmount = tenant.rent_amount || 0
    const discount = autopayEnrollment?.discount_amount || 0

    if (payment_type === 'rent' && autopayEnrollment) {
      expectedAmount = expectedAmount - discount
    }

    // Security: Validate that requested amount matches expected amount
    // Allow small floating point differences (less than 1 cent)
    if (Math.abs(amount - expectedAmount) > 0.01) {
      return NextResponse.json(
        {
          error: 'Payment amount does not match expected amount',
          expected: expectedAmount,
          requested: amount,
        },
        { status: 400 }
      )
    }

    // Check for duplicate payments for the same period
    if (period_start && period_end) {
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('id, status')
        .eq('tenant_id', tenant_id)
        .eq('period_start', period_start)
        .eq('period_end', period_end)
        .in('status', ['pending', 'processing', 'completed'])
        .single()

      if (existingPayment) {
        return NextResponse.json(
          {
            error: 'A payment already exists for this period',
            existing_payment_id: existingPayment.id,
            status: existingPayment.status,
          },
          { status: 409 }
        )
      }
    }

    // Get or create Stripe customer for the tenant's user
    const stripeCustomerId = await getOrCreateStripeCustomer(
      tenant.user_id,
      profile.email,
      profile.full_name
    )

    // Convert amount to cents for Stripe
    const amountCents = dollarsToCents(amount)

    // Create Stripe Payment Intent
    const paymentIntent = await createPaymentIntent(
      stripeCustomerId,
      amountCents,
      payment_method_id,
      {
        tenant_id: tenant_id,
        property_id: tenant.property_id,
        payment_type: payment_type,
        user_id: user.id,
      }
    )

    // Calculate due date if not provided (defaults to 1st of next month)
    const finalDueDate =
      due_date ||
      new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        .toISOString()
        .split('T')[0]

    // Create payment record in database
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenant_id,
        property_id: tenant.property_id,
        amount: amount,
        payment_type: payment_type,
        payment_method: 'stripe_card', // Will be updated based on actual payment method used
        status: 'pending',
        stripe_payment_intent_id: paymentIntent.id,
        period_start: period_start || null,
        period_end: period_end || null,
        due_date: finalDueDate,
        is_autopay: false, // Manual payment
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError)
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      )
    }

    // Return client secret for Stripe Elements
    return NextResponse.json({
      payment_intent_id: paymentIntent.id,
      client_secret: paymentIntent.client_secret!,
      payment_id: payment.id,
      amount: amount,
    })
  } catch (error) {
    console.error('Create payment intent error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
