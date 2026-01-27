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
        { error: 'Only tenants can access this endpoint' },
        { status: 403 }
      )
    }

    // Get tenant data
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select(`
        *,
        property:properties(
          id,
          name,
          address,
          description
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (tenantError && tenantError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('Error fetching tenant:', tenantError)
      return NextResponse.json(
        { error: 'Failed to fetch tenant data' },
        { status: 500 }
      )
    }

    // Check for autopay enrollment
    let isEnrolledInAutopay = false
    let autopayDiscount = 0

    if (tenant) {
      const { data: autopayEnrollment } = await supabase
        .from('autopay_enrollments')
        .select('discount_amount, is_active')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true)
        .is('cancelled_at', null)
        .single()

      if (autopayEnrollment) {
        isEnrolledInAutopay = true
        autopayDiscount = autopayEnrollment.discount_amount || 25
      }
    }

    return NextResponse.json({
      tenant,
      isEnrolledInAutopay,
      autopayDiscount,
    })
  } catch (error) {
    console.error('Get current tenant error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
