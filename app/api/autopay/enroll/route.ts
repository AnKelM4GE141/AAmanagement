import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'tenant') {
      return NextResponse.json(
        { error: 'Only tenants can enroll in autopay' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { payment_method_id, discount_amount } = body

    if (!payment_method_id) {
      return NextResponse.json(
        { error: 'payment_method_id is required' },
        { status: 400 }
      )
    }

    // Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'No active tenant record found' },
        { status: 404 }
      )
    }

    // Verify payment method exists and belongs to user
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('id, user_id')
      .eq('id', payment_method_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (pmError || !paymentMethod) {
      return NextResponse.json(
        { error: 'Payment method not found or invalid' },
        { status: 404 }
      )
    }

    // Check if already enrolled in autopay
    const { data: existingEnrollment } = await supabase
      .from('autopay_enrollments')
      .select('id, is_active, cancelled_at')
      .eq('tenant_id', tenant.id)
      .single()

    if (existingEnrollment) {
      if (existingEnrollment.is_active && !existingEnrollment.cancelled_at) {
        // Already enrolled - update payment method
        const { data: updatedEnrollment, error: updateError } = await supabase
          .from('autopay_enrollments')
          .update({
            payment_method_id,
            discount_amount: discount_amount || 25.0,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEnrollment.id)
          .select()
          .single()

        if (updateError) {
          console.error('Failed to update autopay enrollment:', updateError)
          return NextResponse.json(
            { error: 'Failed to update autopay enrollment' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Autopay payment method updated successfully',
          enrollment: updatedEnrollment,
        })
      } else {
        // Reactivate cancelled enrollment
        const { data: reactivatedEnrollment, error: reactivateError } =
          await supabase
            .from('autopay_enrollments')
            .update({
              payment_method_id,
              is_active: true,
              discount_amount: discount_amount || 25.0,
              cancelled_at: null,
              enrolled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingEnrollment.id)
            .select()
            .single()

        if (reactivateError) {
          console.error('Failed to reactivate autopay:', reactivateError)
          return NextResponse.json(
            { error: 'Failed to reactivate autopay' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          message: 'Autopay enrollment reactivated successfully',
          enrollment: reactivatedEnrollment,
        })
      }
    }

    // Create new autopay enrollment
    const { data: newEnrollment, error: createError } = await supabase
      .from('autopay_enrollments')
      .insert({
        tenant_id: tenant.id,
        payment_method_id,
        is_active: true,
        discount_amount: discount_amount || 25.0,
        enrolled_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create autopay enrollment:', createError)
      return NextResponse.json(
        { error: 'Failed to enroll in autopay' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Successfully enrolled in autopay',
      enrollment: newEnrollment,
    })
  } catch (error) {
    console.error('Autopay enrollment error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
