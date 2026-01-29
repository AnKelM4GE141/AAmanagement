import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile - only admins can issue refunds
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can issue refunds' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { payment_id, amount, reason } = body

    if (!payment_id) {
      return NextResponse.json(
        { error: 'payment_id is required' },
        { status: 400 }
      )
    }

    // Get payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', payment_id)
      .single()

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      )
    }

    // Validate payment can be refunded
    if (payment.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only refund completed payments' },
        { status: 400 }
      )
    }

    if (payment.status === 'refunded') {
      return NextResponse.json(
        { error: 'Payment has already been refunded' },
        { status: 400 }
      )
    }

    // Only refund Stripe payments (not manual payments)
    if (
      !payment.payment_method ||
      (!payment.payment_method.startsWith('stripe_') &&
        !payment.stripe_payment_intent_id)
    ) {
      return NextResponse.json(
        { error: 'Can only refund Stripe payments. Manual payments must be refunded offline.' },
        { status: 400 }
      )
    }

    if (!payment.stripe_payment_intent_id) {
      return NextResponse.json(
        { error: 'No Stripe Payment Intent found for this payment' },
        { status: 400 }
      )
    }

    // Validate refund amount
    const refundAmount = amount ? parseFloat(amount) : payment.amount
    if (isNaN(refundAmount) || refundAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      )
    }

    if (refundAmount > payment.amount) {
      return NextResponse.json(
        { error: 'Refund amount cannot exceed payment amount' },
        { status: 400 }
      )
    }

    // Issue refund through Stripe
    try {
      const refund = await stripe.refunds.create({
        payment_intent: payment.stripe_payment_intent_id,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: reason || 'requested_by_customer',
        metadata: {
          payment_id: payment.id,
          refunded_by: user.id,
          refund_reason: reason || '',
        },
      })

      // Update payment status in database
      const { data: updatedPayment, error: updateError } = await supabase
        .from('payments')
        .update({
          status: 'refunded',
          notes: `${payment.notes || ''}\n\nRefunded: $${refundAmount.toFixed(2)} on ${new Date().toISOString().split('T')[0]}. Reason: ${reason || 'No reason provided'}. Refund ID: ${refund.id}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update payment after refund:', updateError)
        // Refund was issued but database update failed - log this critical error
        return NextResponse.json(
          {
            warning:
              'Refund was issued in Stripe but failed to update database. Please update manually.',
            refund_id: refund.id,
            payment_id: payment.id,
          },
          { status: 207 }
        ) // 207 Multi-Status
      }

      return NextResponse.json({
        message: 'Refund issued successfully',
        refund_id: refund.id,
        amount: refundAmount,
        payment: updatedPayment,
      })
    } catch (stripeError: any) {
      console.error('Stripe refund error:', stripeError)
      return NextResponse.json(
        {
          error: `Stripe refund failed: ${stripeError.message || 'Unknown error'}`,
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
