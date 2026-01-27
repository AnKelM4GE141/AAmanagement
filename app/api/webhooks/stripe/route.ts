import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import Stripe from 'stripe'
import { constructWebhookEvent, centsToDollars } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

// Disable body parsing for webhooks (we need raw body)
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Get raw body
    const body = await request.text()

    // Get Stripe signature from headers
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
    }

    // Verify and construct the event
    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    console.log(`Received webhook event: ${event.type}`)

    // Handle the event based on type
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'payment_intent.processing':
        await handlePaymentIntentProcessing(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge)
        break

      case 'payment_method.attached':
        console.log('Payment method attached:', event.data.object.id)
        // Payment method attachment is handled in the API route
        break

      case 'customer.created':
        console.log('Customer created:', event.data.object.id)
        // Customer creation is handled in the API route
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Return success response
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment intent
 */
async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  const supabase = await createClient()

  console.log(`Payment intent succeeded: ${paymentIntent.id}`)

  // Find payment record by stripe_payment_intent_id
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (fetchError || !payment) {
    console.error('Payment not found for intent:', paymentIntent.id)
    return
  }

  // Calculate Stripe fee from charges
  let stripeFee = 0
  if (paymentIntent.charges.data.length > 0) {
    const charge = paymentIntent.charges.data[0]
    if (charge.balance_transaction) {
      // Fee is in cents, convert to dollars
      stripeFee = centsToDollars(
        (charge.balance_transaction as Stripe.BalanceTransaction).fee || 0
      )
    }
  }

  // Get charge ID
  const chargeId =
    paymentIntent.charges.data.length > 0
      ? paymentIntent.charges.data[0].id
      : null

  // Update payment status to completed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'completed',
      payment_date: new Date().toISOString(),
      stripe_charge_id: chargeId,
      stripe_fee_amount: stripeFee,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Failed to update payment:', updateError)
  } else {
    console.log(`Payment ${payment.id} marked as completed`)
  }
}

/**
 * Handle failed payment intent
 */
async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent
) {
  const supabase = await createClient()

  console.log(`Payment intent failed: ${paymentIntent.id}`)

  // Find payment record
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (fetchError || !payment) {
    console.error('Payment not found for intent:', paymentIntent.id)
    return
  }

  // Get failure message
  const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed'

  // Update payment status to failed
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'failed',
      notes: failureMessage,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Failed to update payment:', updateError)
  } else {
    console.log(`Payment ${payment.id} marked as failed`)
    // TODO: Send notification to tenant about failed payment
  }
}

/**
 * Handle processing payment intent (typically for ACH)
 */
async function handlePaymentIntentProcessing(
  paymentIntent: Stripe.PaymentIntent
) {
  const supabase = await createClient()

  console.log(`Payment intent processing: ${paymentIntent.id}`)

  // Find payment record
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .single()

  if (fetchError || !payment) {
    console.error('Payment not found for intent:', paymentIntent.id)
    return
  }

  // Update payment status to processing
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'processing',
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Failed to update payment:', updateError)
  } else {
    console.log(`Payment ${payment.id} marked as processing`)
  }
}

/**
 * Handle refunded charge
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  const supabase = await createClient()

  console.log(`Charge refunded: ${charge.id}`)

  // Find payment record by stripe_charge_id
  const { data: payment, error: fetchError } = await supabase
    .from('payments')
    .select('id')
    .eq('stripe_charge_id', charge.id)
    .single()

  if (fetchError || !payment) {
    console.error('Payment not found for charge:', charge.id)
    return
  }

  // Update payment status to refunded
  const { error: updateError } = await supabase
    .from('payments')
    .update({
      status: 'refunded',
      notes: `Refunded: ${charge.refunds?.data[0]?.reason || 'No reason provided'}`,
    })
    .eq('id', payment.id)

  if (updateError) {
    console.error('Failed to update payment:', updateError)
  } else {
    console.log(`Payment ${payment.id} marked as refunded`)
  }
}
