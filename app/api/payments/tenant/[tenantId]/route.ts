import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params
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

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get tenant record
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, user_id, rent_amount')
      .eq('id', tenantId)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Authorization: Only the tenant themselves or an admin can view payments
    const isTenantOwner = tenant.user_id === user.id
    const isAdmin = profile.role === 'admin'

    if (!isTenantOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all payments for this tenant, ordered by most recent first
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (paymentsError) {
      console.error('Failed to fetch payments:', paymentsError)
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      )
    }

    // Calculate summary statistics
    const totalPaid = payments
      .filter((p) => p.status === 'completed')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const totalPending = payments
      .filter((p) => p.status === 'pending' || p.status === 'processing')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const today = new Date()
    const overduePayments = payments.filter((p) => {
      if (p.status === 'completed') return false
      const dueDate = new Date(p.due_date)
      return dueDate < today
    })

    const totalOverdue = overduePayments.reduce(
      (sum, p) => sum + Number(p.amount),
      0
    )

    const totalFailed = payments
      .filter((p) => p.status === 'failed')
      .reduce((sum, p) => sum + Number(p.amount), 0)

    const upcomingPayments = payments.filter((p) => {
      if (p.status === 'completed') return false
      const dueDate = new Date(p.due_date)
      return dueDate >= today
    })

    const recentPayments = payments.slice(0, 10) // Last 10 payments

    return NextResponse.json({
      payments,
      summary: {
        totalPaid,
        totalPending,
        totalOverdue,
        totalFailed,
        upcomingPayments,
        overduePayments,
        recentPayments,
      },
    })
  } catch (error) {
    console.error('Get payments error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
