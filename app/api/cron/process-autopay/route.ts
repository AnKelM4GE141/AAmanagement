import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/stripe/client'

/**
 * Autopay Cron Job
 *
 * This endpoint should be called on the 1st of each month at 6am to process
 * all active autopay enrollments.
 *
 * Setup with Vercel Cron:
 * Add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/process-autopay",
 *     "schedule": "0 6 1 * *"
 *   }]
 * }
 *
 * Or use an external cron service to POST to this endpoint.
 *
 * For security, set a CRON_SECRET environment variable and pass it in the
 * Authorization header: Authorization: Bearer YOUR_CRON_SECRET
 */

export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all active autopay enrollments with tenant and payment method details
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('autopay_enrollments')
      .select(
        `
        id,
        tenant_id,
        payment_method_id,
        discount_amount,
        tenant:tenants!inner(
          id,
          user_id,
          property_id,
          rent_amount,
          unit_number
        ),
        payment_method:payment_methods!inner(
          id,
          stripe_payment_method_id,
          stripe_customer_id,
          type
        )
      `
      )
      .eq('is_active', true)
      .is('cancelled_at', null)

    if (enrollmentsError) {
      console.error('Failed to fetch autopay enrollments:', enrollmentsError)
      return NextResponse.json(
        { error: 'Failed to fetch autopay enrollments' },
        { status: 500 }
      )
    }

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({
        message: 'No active autopay enrollments to process',
        processed: 0,
      })
    }

    // Calculate current month period
    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split('T')[0]
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0]
    const dueDate = periodStart // Due on 1st of month

    const results = {
      total: enrollments.length,
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
    }

    // Process each enrollment
    for (const enrollment of enrollments) {
      try {
        const tenant = enrollment.tenant as any
        const paymentMethod = enrollment.payment_method as any

        // Calculate amount with discount
        const baseAmount = tenant.rent_amount || 0
        const discount = enrollment.discount_amount || 0
        const finalAmount = baseAmount - discount

        if (finalAmount <= 0) {
          results.skipped++
          results.errors.push({
            tenant_id: tenant.id,
            error: 'Invalid rent amount after discount',
          })
          continue
        }

        // Check if payment already exists for this period
        const { data: existingPayment } = await supabase
          .from('payments')
          .select('id, status')
          .eq('tenant_id', tenant.id)
          .eq('period_start', periodStart)
          .eq('period_end', periodEnd)
          .in('status', ['pending', 'processing', 'completed'])
          .single()

        if (existingPayment) {
          // Payment already exists - skip
          results.skipped++
          continue
        }

        // Create payment record in database (pending status)
        const { data: payment, error: paymentCreateError } = await supabase
          .from('payments')
          .insert({
            tenant_id: tenant.id,
            property_id: tenant.property_id,
            amount: finalAmount,
            payment_type: 'rent',
            payment_method:
              paymentMethod.type === 'ach' ? 'stripe_ach' : 'stripe_card',
            status: 'pending',
            period_start: periodStart,
            period_end: periodEnd,
            due_date: dueDate,
            is_autopay: true,
            notes: `Autopay - discount applied: $${discount.toFixed(2)}`,
          })
          .select()
          .single()

        if (paymentCreateError || !payment) {
          console.error(
            `Failed to create payment for tenant ${tenant.id}:`,
            paymentCreateError
          )
          results.failed++
          results.errors.push({
            tenant_id: tenant.id,
            error: paymentCreateError?.message || 'Failed to create payment',
          })
          continue
        }

        // Create Payment Intent with Stripe
        try {
          const amountCents = Math.round(finalAmount * 100)

          const paymentIntent = await createPaymentIntent(
            paymentMethod.stripe_customer_id,
            amountCents,
            paymentMethod.stripe_payment_method_id,
            {
              tenant_id: tenant.id,
              payment_id: payment.id,
              property_id: tenant.property_id,
              unit_number: tenant.unit_number || '',
              payment_type: 'rent',
              period_start: periodStart,
              period_end: periodEnd,
              is_autopay: 'true',
              discount_applied: discount.toFixed(2),
            }
          )

          // Update payment with Stripe Payment Intent ID
          const { error: updateError } = await supabase
            .from('payments')
            .update({
              stripe_payment_intent_id: paymentIntent.id,
              status: 'processing',
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

          if (updateError) {
            console.error(
              `Failed to update payment ${payment.id} with Payment Intent:`,
              updateError
            )
          }

          results.successful++
        } catch (stripeError: any) {
          console.error(
            `Stripe error for tenant ${tenant.id}:`,
            stripeError
          )

          // Update payment status to failed
          await supabase
            .from('payments')
            .update({
              status: 'failed',
              notes: `Autopay failed: ${stripeError.message || 'Stripe error'}`,
              updated_at: new Date().toISOString(),
            })
            .eq('id', payment.id)

          results.failed++
          results.errors.push({
            tenant_id: tenant.id,
            error: stripeError.message || 'Stripe payment failed',
          })
        }
      } catch (error: any) {
        console.error(
          `Error processing autopay for enrollment ${enrollment.id}:`,
          error
        )
        results.failed++
        results.errors.push({
          tenant_id: enrollment.tenant_id,
          error: error.message || 'Unknown error',
        })
      }
    }

    console.log('Autopay processing complete:', results)

    return NextResponse.json({
      message: 'Autopay processing complete',
      results,
    })
  } catch (error) {
    console.error('Autopay cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Also support GET for manual testing
export async function GET(request: Request) {
  return POST(request)
}
