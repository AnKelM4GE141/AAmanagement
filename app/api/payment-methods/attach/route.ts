import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  getOrCreateStripeCustomer,
  attachPaymentMethodToCustomer,
  getPaymentMethodDetails,
  savePaymentMethodToDatabase,
} from '@/lib/stripe/client'
import type { AttachPaymentMethodRequest } from '@/lib/types/payment'

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
      .select('email, full_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const body: AttachPaymentMethodRequest = await request.json()
    const { stripe_payment_method_id, is_default } = body

    if (!stripe_payment_method_id) {
      return NextResponse.json(
        { error: 'Stripe payment method ID is required' },
        { status: 400 }
      )
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(
      user.id,
      profile.email,
      profile.full_name
    )

    // Attach payment method to customer in Stripe
    await attachPaymentMethodToCustomer(stripe_payment_method_id, customerId)

    // Get payment method details from Stripe
    const paymentMethod = await getPaymentMethodDetails(stripe_payment_method_id)

    // Save to database
    const savedPaymentMethod = await savePaymentMethodToDatabase(
      user.id,
      paymentMethod,
      customerId,
      is_default || false
    )

    return NextResponse.json({
      message: 'Payment method saved successfully',
      payment_method: savedPaymentMethod,
    })
  } catch (error: any) {
    console.error('Attach payment method error:', error)

    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save payment method' },
      { status: 500 }
    )
  }
}
