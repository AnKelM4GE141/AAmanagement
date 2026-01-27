import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { ManualPaymentRequest } from '@/lib/types/payment'

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

    // Get user profile and verify admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 })
    }

    // Parse request body
    const body: ManualPaymentRequest = await request.json()
    const {
      tenant_id,
      amount,
      payment_type,
      payment_method,
      payment_date,
      period_start,
      period_end,
      notes,
    } = body

    // Validate required fields
    if (!tenant_id || !amount || !payment_type || !payment_method || !payment_date) {
      return NextResponse.json(
        {
          error:
            'Tenant ID, amount, payment type, payment method, and payment date are required',
        },
        { status: 400 }
      )
    }

    // Validate payment method is manual (not Stripe)
    const validManualMethods = ['check', 'cash', 'money_order']
    if (!validManualMethods.includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment method for manual payment' },
        { status: 400 }
      )
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get tenant record to verify it exists and get property_id
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, property_id, rent_amount')
      .eq('id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Calculate due date if not provided (defaults to 1st of current month)
    const finalDueDate = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
      .toISOString()
      .split('T')[0]

    // Create payment record with status 'completed' since it's already received
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenant_id,
        property_id: tenant.property_id,
        amount: amount,
        payment_type: payment_type,
        payment_method: payment_method,
        status: 'completed', // Manual payments are immediately marked as completed
        period_start: period_start || null,
        period_end: period_end || null,
        due_date: finalDueDate,
        payment_date: new Date(payment_date).toISOString(),
        recorded_by: user.id, // Track which admin recorded this payment
        is_autopay: false,
        notes: notes || null,
      })
      .select()
      .single()

    if (paymentError) {
      console.error('Failed to create manual payment:', paymentError)
      return NextResponse.json(
        { error: 'Failed to record payment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment: payment,
    })
  } catch (error) {
    console.error('Manual payment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
