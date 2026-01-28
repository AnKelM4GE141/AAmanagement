import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import PaymentStatusTable from '@/components/admin/payments/PaymentStatusTable'

export const dynamic = 'force-dynamic'

export default async function AdminPaymentsPage() {
  const profile = await requireRole(['admin'])
  const supabase = await createClient()

  // Calculate current month period
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  // Fetch all active tenants with property and autopay info
  const { data: tenants } = await supabase
    .from('tenants')
    .select(
      `
      id,
      user_id,
      property_id,
      unit_number,
      rent_amount,
      property:properties(
        id,
        name
      ),
      user:users_profile(
        id,
        full_name
      )
    `
    )
    .eq('status', 'active')

  // Fetch all autopay enrollments
  const { data: autopayEnrollments } = await supabase
    .from('autopay_enrollments')
    .select('tenant_id, discount_amount, is_active')
    .eq('is_active', true)
    .is('cancelled_at', null)

  // Create autopay lookup
  const autopayMap = new Map(
    autopayEnrollments?.map((ae) => [ae.tenant_id, ae]) || []
  )

  // Fetch all payments for current month
  const { data: payments } = await supabase
    .from('payments')
    .select('*')
    .eq('period_start', currentMonthStart)
    .eq('period_end', currentMonthEnd)

  // Create payments lookup
  const paymentsMap = new Map(
    payments?.map((p) => [p.tenant_id, p]) || []
  )

  // Build tenant payment status array
  const tenantPaymentStatuses = (tenants || []).map((tenant: any) => {
    const autopay = autopayMap.get(tenant.id)
    const payment = paymentsMap.get(tenant.id)

    const isEnrolledInAutopay = !!autopay
    const autopayDiscount = autopay?.discount_amount || 0
    const rentAmount = tenant.rent_amount || 0
    const currentAmountDue = isEnrolledInAutopay
      ? rentAmount - autopayDiscount
      : rentAmount

    // Determine payment status
    let paymentStatus: 'paid' | 'unpaid' | 'overdue' | 'processing' = 'unpaid'
    if (payment) {
      if (payment.status === 'completed') {
        paymentStatus = 'paid'
      } else if (payment.status === 'processing') {
        paymentStatus = 'processing'
      } else if (payment.status === 'pending' || payment.status === 'failed') {
        // Check if overdue (past due date)
        const dueDate = new Date(payment.due_date)
        const today = new Date()
        if (dueDate < today) {
          paymentStatus = 'overdue'
        }
      }
    } else {
      // No payment record - check if overdue
      const dueDate = new Date(currentMonthStart)
      const today = new Date()
      if (dueDate < today) {
        paymentStatus = 'overdue'
      }
    }

    return {
      tenant_id: tenant.id,
      tenant_name: tenant.user?.full_name || 'Unknown',
      unit_number: tenant.unit_number,
      property_name: tenant.property?.name || 'Unknown Property',
      rent_amount: rentAmount,
      autopay_enrolled: isEnrolledInAutopay,
      autopay_discount: autopayDiscount,
      current_amount_due: currentAmountDue,
      payment_status: paymentStatus,
      payment_date: payment?.payment_date || null,
      payment_method: payment?.payment_method || null,
      last_payment_id: payment?.id || null,
    }
  })

  // Calculate summary statistics
  const totalTenants = tenantPaymentStatuses.length
  const paidCount = tenantPaymentStatuses.filter(
    (t) => t.payment_status === 'paid'
  ).length
  const unpaidCount = tenantPaymentStatuses.filter(
    (t) => t.payment_status === 'unpaid'
  ).length
  const overdueCount = tenantPaymentStatuses.filter(
    (t) => t.payment_status === 'overdue'
  ).length
  const processingCount = tenantPaymentStatuses.filter(
    (t) => t.payment_status === 'processing'
  ).length

  const totalExpected = tenantPaymentStatuses.reduce(
    (sum, t) => sum + t.current_amount_due,
    0
  )
  const totalCollected = tenantPaymentStatuses
    .filter((t) => t.payment_status === 'paid')
    .reduce((sum, t) => sum + t.current_amount_due, 0)
  const collectionRate =
    totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

  const autopayEnrolled = tenantPaymentStatuses.filter(
    (t) => t.autopay_enrolled
  ).length
  const autopayRate = totalTenants > 0 ? (autopayEnrolled / totalTenants) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
        <p className="text-gray-600 mt-1">
          Track and manage rent payments for all properties
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Total Expected</p>
              <p className="text-3xl font-bold text-gray-900">
                ${totalExpected.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {totalTenants} active tenants
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Collected</p>
              <p className="text-3xl font-bold text-green-600">
                ${totalCollected.toFixed(2)}
              </p>
              <p className="text-xs text-green-600 mt-1">
                {collectionRate.toFixed(1)}% collection rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Outstanding</p>
              <p className="text-3xl font-bold text-yellow-600">
                ${(totalExpected - totalCollected).toFixed(2)}
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                {unpaidCount + overdueCount + processingCount} tenants
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Autopay Rate</p>
              <p className="text-3xl font-bold text-purple-600">
                {autopayRate.toFixed(0)}%
              </p>
              <p className="text-xs text-purple-600 mt-1">
                {autopayEnrolled} enrolled
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700">Paid</p>
                  <p className="text-2xl font-bold text-green-900">
                    {paidCount}
                  </p>
                </div>
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-700">Unpaid</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {unpaidCount}
                  </p>
                </div>
                <svg
                  className="w-8 h-8 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700">Overdue</p>
                  <p className="text-2xl font-bold text-red-900">
                    {overdueCount}
                  </p>
                </div>
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700">Processing</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {processingCount}
                  </p>
                </div>
                <svg
                  className="w-8 h-8 text-blue-600 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentStatusTable tenants={tenantPaymentStatuses} />
        </CardContent>
      </Card>
    </div>
  )
}
