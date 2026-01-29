import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all active tenants with their lease and property information
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select(`
        id,
        user_id,
        property_id,
        unit_number,
        lease_start,
        lease_end,
        rent_amount,
        users_profile!user_id (
          full_name,
          email
        ),
        properties!property_id (
          address
        )
      `)
      .eq('status', 'active')
      .order('lease_start', { ascending: false })

    if (tenantsError) {
      throw tenantsError
    }

    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const firstOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)

    // For each tenant, calculate lease progress and payment status
    const tenantPaymentData = await Promise.all(
      (tenants || []).map(async (tenant: any) => {
        const leaseStart = new Date(tenant.lease_start)
        const leaseEnd = new Date(tenant.lease_end)
        const totalLeaseDays = Math.ceil(
          (leaseEnd.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
        )
        const daysIntoLease = Math.ceil(
          (today.getTime() - leaseStart.getTime()) / (1000 * 60 * 60 * 24)
        )
        const leaseProgressPercent = Math.min(
          100,
          Math.max(0, Math.round((daysIntoLease / totalLeaseDays) * 100))
        )

        // Check if tenant has paid for current month
        const { data: payments } = await supabase
          .from('payments')
          .select('id, status, is_autopay')
          .eq('tenant_id', tenant.id)
          .gte('created_at', firstOfMonth.toISOString())
          .lt('created_at', firstOfNextMonth.toISOString())
          .eq('payment_type', 'rent')
          .in('status', ['completed', 'processing'])

        const currentMonthPaid = (payments?.length || 0) > 0
        const isAutopay = payments?.some((p) => p.is_autopay) || false

        // Check if payment is overdue (after 5th of month and not paid)
        const fifthOfMonth = new Date(today.getFullYear(), today.getMonth(), 5)
        const isOverdue = !currentMonthPaid && today > fifthOfMonth

        // Get payment methods for this tenant's user
        const { data: paymentMethods } = await supabase
          .from('payment_methods')
          .select('id, type, last4, bank_name, card_brand, is_default, status')
          .eq('user_id', tenant.user_id)
          .eq('status', 'active')
          .order('is_default', { ascending: false })

        return {
          id: tenant.id,
          full_name: tenant.users_profile?.full_name || 'Unknown',
          email: tenant.users_profile?.email || '',
          property_address: tenant.properties?.address || 'Unknown Property',
          unit_number: tenant.unit_number,
          lease_start: tenant.lease_start,
          lease_end: tenant.lease_end,
          rent_amount: tenant.rent_amount,
          current_month_paid: currentMonthPaid,
          is_autopay: isAutopay,
          days_into_lease: Math.max(0, daysIntoLease),
          total_lease_days: totalLeaseDays,
          lease_progress_percent: leaseProgressPercent,
          payment_due_date: firstOfMonth.toISOString().split('T')[0],
          is_overdue: isOverdue,
          payment_methods: paymentMethods || [],
        }
      })
    )

    return NextResponse.json({ tenants: tenantPaymentData })
  } catch (error: any) {
    console.error('Error fetching tenant payment overview:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment overview' },
      { status: 500 }
    )
  }
}
