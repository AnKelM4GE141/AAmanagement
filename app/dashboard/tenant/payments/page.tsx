'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import PaymentForm from '@/components/tenant/payments/PaymentForm'
import PaymentHistory from '@/components/tenant/payments/PaymentHistory'
import SavedPaymentMethods from '@/components/tenant/payments/SavedPaymentMethods'
import AutopayEnrollment from '@/components/tenant/payments/AutopayEnrollment'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import type { Payment } from '@/lib/types/payment'

export default function TenantPaymentsPage() {
  const router = useRouter()
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [tenantData, setTenantData] = useState<any>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'overdue'>('unpaid')
  const [paymentAmount, setPaymentAmount] = useState(0)
  const [rentAmount, setRentAmount] = useState(0)
  const [isEnrolledInAutopay, setIsEnrolledInAutopay] = useState(false)
  const [autopayDiscount, setAutopayDiscount] = useState(0)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      setIsLoading(true)
      setError('')

      // Fetch current user's tenant data (we'll need to create an API for this)
      // For now, we'll use a simple fetch
      const response = await fetch('/api/tenant/current')
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to load data')
        setIsLoading(false)
        return
      }

      setTenantData(data.tenant)
      setRentAmount(data.tenant.rent_amount || 0)

      // Check autopay enrollment
      setIsEnrolledInAutopay(data.isEnrolledInAutopay || false)
      setAutopayDiscount(data.autopayDiscount || 0)

      let finalAmount = data.tenant.rent_amount || 0
      if (data.isEnrolledInAutopay) {
        finalAmount -= data.autopayDiscount || 0
      }
      setPaymentAmount(finalAmount)

      // Fetch payment history
      if (data.tenant.id) {
        const paymentsResponse = await fetch(
          `/api/payments/tenant/${data.tenant.id}`
        )
        const paymentsData = await paymentsResponse.json()

        if (paymentsResponse.ok && paymentsData.payments) {
          setPayments(paymentsData.payments)

          // Check if current month is paid
          const now = new Date()
          const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
            .toISOString()
            .split('T')[0]
          const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
            .toISOString()
            .split('T')[0]

          const currentMonthPayment = paymentsData.payments.find(
            (p: Payment) =>
              p.period_start === currentMonthStart &&
              p.period_end === currentMonthEnd &&
              p.status === 'completed'
          )

          setPaymentStatus(currentMonthPayment ? 'paid' : 'unpaid')
        }
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Failed to load payment data')
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600"></div>
          <p className="mt-4 text-sm text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
        <Alert variant="error">{error}</Alert>
      </div>
    )
  }

  if (!tenantData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <Button variant="secondary" onClick={() => router.back()}>
            ← Back
          </Button>
        </div>
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <p className="text-slate-600">
                You are not assigned to a property yet
              </p>
              <p className="text-sm text-slate-500 mt-2">
                Contact your property manager for assistance
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600 mt-1">Manage your rent payments</p>
        </div>
        <Button variant="secondary" onClick={() => router.back()}>
          ← Back to Dashboard
        </Button>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Current Month</p>
              <p className="text-3xl font-bold text-slate-900">
                ${paymentAmount.toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {paymentStatus === 'paid' ? 'Paid' : 'Due'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Base Rent</p>
              <p className="text-3xl font-bold text-slate-900">
                ${rentAmount.toFixed(2)}
              </p>
              {isEnrolledInAutopay && (
                <p className="text-xs text-purple-600 mt-1">
                  -${autopayDiscount.toFixed(2)} autopay discount
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-slate-600 mb-1">Total Paid</p>
              <p className="text-3xl font-bold text-slate-900">
                $
                {payments
                  .filter((p) => p.status === 'completed')
                  .reduce((sum, p) => sum + Number(p.amount), 0)
                  .toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {payments.filter((p) => p.status === 'completed').length} payments
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Make Payment Section */}
      {paymentStatus !== 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle>Make a Payment</CardTitle>
          </CardHeader>
          <CardContent>
            {!showPaymentForm ? (
              <div className="text-center py-6">
                <p className="text-slate-600 mb-6">
                  Pay your rent securely with credit card or ACH bank transfer
                </p>
                <Button onClick={() => setShowPaymentForm(true)} size="lg">
                  Pay ${paymentAmount.toFixed(2)}
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Card: 2.9% + $0.30 fee • ACH: 0.8% fee (max $5.00)
                </p>
              </div>
            ) : (
              <PaymentForm
                tenantId={tenantData.id}
                amount={paymentAmount}
                rentAmount={rentAmount}
                propertyName={tenantData.property?.name}
                hasAutopayDiscount={isEnrolledInAutopay}
                discountAmount={autopayDiscount}
                onSuccess={() => {
                  setShowPaymentForm(false)
                  fetchData() // Refresh data
                }}
                onCancel={() => setShowPaymentForm(false)}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Autopay Section */}
      <Card>
        <CardHeader>
          <CardTitle>Autopay</CardTitle>
        </CardHeader>
        <CardContent>
          <AutopayEnrollment
            discountAmount={autopayDiscount || 25}
            onEnrollmentChange={() => fetchData()}
          />
        </CardContent>
      </Card>

      {/* Saved Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Saved Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <SavedPaymentMethods />
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentHistory payments={payments} />
        </CardContent>
      </Card>
    </div>
  )
}
