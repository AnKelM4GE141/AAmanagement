import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
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
        { error: 'Only tenants can check autopay status' },
        { status: 403 }
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

    // Get autopay enrollment with payment method details
    const { data: enrollment } = await supabase
      .from('autopay_enrollments')
      .select(
        `
        *,
        payment_method:payment_methods(
          id,
          type,
          last4,
          bank_name,
          card_brand,
          exp_month,
          exp_year,
          is_default
        )
      `
      )
      .eq('tenant_id', tenant.id)
      .single()

    // Return status
    return NextResponse.json({
      is_enrolled: enrollment
        ? enrollment.is_active && !enrollment.cancelled_at
        : false,
      enrollment: enrollment || null,
    })
  } catch (error) {
    console.error('Autopay status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
