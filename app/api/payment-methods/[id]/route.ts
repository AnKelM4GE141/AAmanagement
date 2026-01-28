import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { detachPaymentMethod } from '@/lib/stripe/client'

// Delete payment method
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get payment method to verify ownership and get Stripe ID
    const { data: paymentMethod, error: fetchError } = await supabase
      .from('payment_methods')
      .select('stripe_payment_method_id, user_id')
      .eq('id', id)
      .single()

    if (fetchError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found' },
        { status: 404 }
      )
    }

    // Verify user owns this payment method
    if (paymentMethod.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if payment method is used in any active autopay enrollment
    const { data: autopayEnrollment } = await supabase
      .from('autopay_enrollments')
      .select('id')
      .eq('payment_method_id', id)
      .eq('is_active', true)
      .is('cancelled_at', null)
      .single()

    if (autopayEnrollment) {
      return NextResponse.json(
        {
          error:
            'Cannot delete payment method that is used for autopay. Please cancel autopay first.',
        },
        { status: 400 }
      )
    }

    // Detach from Stripe
    try {
      await detachPaymentMethod(paymentMethod.stripe_payment_method_id)
    } catch (stripeError) {
      console.error('Failed to detach from Stripe:', stripeError)
      // Continue with database deletion even if Stripe detach fails
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Failed to delete payment method:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Payment method deleted successfully',
    })
  } catch (error) {
    console.error('Delete payment method error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
