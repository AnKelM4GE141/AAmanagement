import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function PATCH(
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

    // Get payment method to verify ownership
    const { data: paymentMethod, error: fetchError } = await supabase
      .from('payment_methods')
      .select('user_id')
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

    // Unset all other payment methods as default for this user
    await supabase
      .from('payment_methods')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .eq('is_default', true)

    // Set this payment method as default
    const { data: updatedPaymentMethod, error: updateError } = await supabase
      .from('payment_methods')
      .update({ is_default: true })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to set default payment method:', updateError)
      return NextResponse.json(
        { error: 'Failed to set default payment method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Default payment method updated successfully',
      payment_method: updatedPaymentMethod,
    })
  } catch (error) {
    console.error('Set default payment method error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
