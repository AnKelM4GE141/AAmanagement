import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import PaymentStatusCard from '@/components/tenant/payments/PaymentStatusCard'
import PaymentHistory from '@/components/tenant/payments/PaymentHistory'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function TenantDashboard() {
  const profile = await requireRole(['tenant'])

  const supabase = await createClient()

  // Fetch tenant assignment and property details
  const { data: tenantData } = await supabase
    .from('tenants')
    .select(`
      *,
      property:properties(
        name,
        address,
        description
      )
    `)
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .single()

  // Initialize payment status variables
  let paymentStatus: 'paid' | 'unpaid' | 'overdue' | 'partial' | 'processing' = 'unpaid'
  let currentMonthPayment = null
  let recentPayments: any[] = []
  let nextDueDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0]
  let paymentAmount = tenantData?.rent_amount || 0
  let isEnrolledInAutopay = false
  let autopayDiscount = 0

  if (tenantData) {
    // Check for autopay enrollment
    const { data: autopayEnrollment } = await supabase
      .from('autopay_enrollments')
      .select('discount_amount, is_active')
      .eq('tenant_id', tenantData.id)
      .eq('is_active', true)
      .is('cancelled_at', null)
      .single()

    if (autopayEnrollment) {
      isEnrolledInAutopay = true
      autopayDiscount = autopayEnrollment.discount_amount || 25
      paymentAmount = paymentAmount - autopayDiscount
    }

    // Fetch payments for this tenant
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantData.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (payments && payments.length > 0) {
      recentPayments = payments

      // Calculate current month period
      const now = new Date()
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0]

      // Find payment for current month
      currentMonthPayment = payments.find(
        (p: any) =>
          p.period_start === currentMonthStart &&
          p.period_end === currentMonthEnd
      )

      // Determine payment status
      if (currentMonthPayment) {
        if (currentMonthPayment.status === 'completed') {
          paymentStatus = 'paid'
        } else if (currentMonthPayment.status === 'processing') {
          paymentStatus = 'processing'
        } else if (currentMonthPayment.status === 'pending') {
          const dueDate = new Date(currentMonthPayment.due_date)
          const today = new Date()
          if (dueDate < today) {
            paymentStatus = 'overdue'
          } else {
            paymentStatus = 'unpaid'
          }
        }
      } else {
        // No payment for current month - check if it's overdue
        const today = new Date()
        const dueDate = new Date(nextDueDate)
        if (dueDate < today) {
          paymentStatus = 'overdue'
        }
      }
    }
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-slate-600 mt-1">Tenant Portal</p>
      </div>

      {!tenantData ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-sm text-slate-600">Not assigned to a property yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Contact your property manager for assistance
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payment Status Card */}
          <PaymentStatusCard
            status={paymentStatus}
            dueDate={nextDueDate}
            amount={paymentAmount}
            lastPaymentDate={currentMonthPayment?.payment_date}
            isEnrolledInAutopay={isEnrolledInAutopay}
            autopayDiscount={autopayDiscount}
          />

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Make Payment</CardTitle>
              </CardHeader>
              <CardContent>
                {paymentStatus === 'paid' ? (
                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-green-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      Paid for this month
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Thank you for your payment!
                    </p>
                  </div>
                ) : paymentStatus === 'processing' ? (
                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-primary-600 animate-spin"
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
                    <p className="text-sm font-medium text-slate-900">
                      Payment Processing
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      ACH payments take 5-7 business days
                    </p>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-4">
                      Pay your rent online securely with card or ACH
                    </p>
                    <Link
                      href="/dashboard/tenant/payments"
                      className="block w-full text-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      {paymentStatus === 'overdue'
                        ? 'Pay Now - Overdue'
                        : `Pay $${paymentAmount.toFixed(2)}`}
                    </Link>
                    {!isEnrolledInAutopay && (
                      <p className="text-xs text-center text-slate-500 mt-2">
                        💡 Enroll in autopay and save ${autopayDiscount || 25}/month
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  {isEnrolledInAutopay ? 'Autopay Active' : 'Autopay'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEnrolledInAutopay ? (
                  <div className="text-center py-4">
                    <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                      <svg
                        className="w-6 h-6 text-purple-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-slate-900">
                      You're saving ${autopayDiscount}/month
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Automatic payments on the 1st
                    </p>
                    <Link
                      href="/dashboard/tenant/payments"
                      className="text-xs text-purple-600 hover:text-purple-700 mt-2 inline-block"
                    >
                      Manage autopay →
                    </Link>
                  </div>
                ) : (
                  <>
                    <p className="text-slate-600 mb-4">
                      Save ${autopayDiscount || 25}/month with automatic payments
                    </p>
                    <Link
                      href="/dashboard/tenant/payments"
                      className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Enroll in Autopay
                    </Link>
                    <p className="text-xs text-center text-slate-500 mt-2">
                      Never miss a payment, save money
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Payment History */}
          {recentPayments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Payments</CardTitle>
                  <Link
                    href="/dashboard/tenant/payments"
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    View all →
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <PaymentHistory payments={recentPayments.slice(0, 5)} />
              </CardContent>
            </Card>
          )}

          {/* Information Sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Lease Information</CardTitle>
              </CardHeader>
              <CardContent>
                {tenantData.property && (
                  <div className="mb-4 pb-4 border-b border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">
                      {tenantData.property.name || 'Your Property'}
                    </h4>
                    <p className="text-sm text-slate-600">
                      {tenantData.property.address}
                    </p>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Unit:</span>
                    <span className="font-medium">
                      {tenantData.unit_number || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lease Start:</span>
                    <span className="font-medium">
                      {tenantData.lease_start
                        ? new Date(tenantData.lease_start).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Lease End:</span>
                    <span className="font-medium">
                      {tenantData.lease_end
                        ? new Date(tenantData.lease_end).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Base Rent:</span>
                    <span className="font-medium text-lg">
                      {tenantData.rent_amount
                        ? `$${tenantData.rent_amount.toLocaleString()}`
                        : '-'}
                    </span>
                  </div>
                  {isEnrolledInAutopay && (
                    <div className="flex justify-between text-purple-600">
                      <span className="font-medium">Autopay Discount:</span>
                      <span className="font-medium">
                        -${autopayDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {tenantData.security_deposit && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Security Deposit:</span>
                      <span className="font-medium">
                        ${tenantData.security_deposit.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Request</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">Submit a maintenance ticket</p>
                <button className="w-full px-4 py-2 bg-slate-200 text-slate-500 rounded-lg cursor-not-allowed">
                  Coming in Phase 4
                </button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
