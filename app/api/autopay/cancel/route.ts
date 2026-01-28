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
        { error: 'Only tenants can cancel autopay' },
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

    // Get autopay enrollment
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('autopay_enrollments')
      .select('id, is_active, cancelled_at')
      .eq('tenant_id', tenant.id)
      .single()

    if (enrollmentError || !enrollment) {
      return NextResponse.json(
        { error: 'No autopay enrollment found' },
        { status: 404 }
      )
    }

    if (!enrollment.is_active || enrollment.cancelled_at) {
      return NextResponse.json(
        { error: 'Autopay is not active' },
        { status: 400 }
      )
    }

    // Cancel autopay enrollment
    const { data: cancelledEnrollment, error: cancelError } = await supabase
      .from('autopay_enrollments')
      .update({
        is_active: false,
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', enrollment.id)
      .select()
      .single()

    if (cancelError) {
      console.error('Failed to cancel autopay:', cancelError)
      return NextResponse.json(
        { error: 'Failed to cancel autopay' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Autopay cancelled successfully',
      enrollment: cancelledEnrollment,
    })
  } catch (error) {
    console.error('Autopay cancellation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
