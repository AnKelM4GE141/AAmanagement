'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import type { SavedPaymentMethod } from '@/lib/types/payment'

interface AutopayEnrollmentProps {
  discountAmount?: number
  onEnrollmentChange?: () => void
}

export default function AutopayEnrollment({
  discountAmount = 25,
  onEnrollmentChange,
}: AutopayEnrollmentProps) {
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmCancel, setShowConfirmCancel] = useState(false)

  useEffect(() => {
    fetchAutopayStatus()
    fetchPaymentMethods()
  }, [])

  async function fetchAutopayStatus() {
    try {
      const response = await fetch('/api/autopay/status')
      const data = await response.json()

      if (response.ok) {
        setIsEnrolled(data.is_enrolled || false)
        setEnrollment(data.enrollment)

        if (data.enrollment?.payment_method?.id) {
          setSelectedPaymentMethodId(data.enrollment.payment_method.id)
        }
      }
    } catch (err: any) {
      console.error('Error fetching autopay status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function fetchPaymentMethods() {
    try {
      const response = await fetch('/api/payment-methods')
      const data = await response.json()

      if (response.ok) {
        setPaymentMethods(data.payment_methods || [])

        // Auto-select default payment method if available and not already selected
        if (!selectedPaymentMethodId && data.payment_methods?.length > 0) {
          const defaultMethod = data.payment_methods.find(
            (pm: SavedPaymentMethod) => pm.is_default
          )
          if (defaultMethod) {
            setSelectedPaymentMethodId(defaultMethod.id)
          } else {
            setSelectedPaymentMethodId(data.payment_methods[0].id)
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment methods:', err)
    }
  }

  async function handleEnroll() {
    if (!selectedPaymentMethodId) {
      setError('Please select a payment method')
      return
    }

    try {
      setIsProcessing(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/autopay/enroll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_method_id: selectedPaymentMethodId,
          discount_amount: discountAmount,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to enroll in autopay')
      }

      setSuccess('Successfully enrolled in autopay!')
      setIsEnrolled(true)
      setEnrollment(data.enrollment)

      // Refresh status
      await fetchAutopayStatus()

      // Notify parent component
      if (onEnrollmentChange) {
        onEnrollmentChange()
      }
    } catch (err: any) {
      console.error('Error enrolling in autopay:', err)
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  async function handleCancel() {
    try {
      setIsProcessing(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/autopay/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel autopay')
      }

      setSuccess('Autopay cancelled successfully')
      setIsEnrolled(false)
      setEnrollment(null)
      setShowConfirmCancel(false)

      // Refresh status
      await fetchAutopayStatus()

      // Notify parent component
      if (onEnrollmentChange) {
        onEnrollmentChange()
      }
    } catch (err: any) {
      console.error('Error cancelling autopay:', err)
      setError(err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  function getPaymentMethodLabel(pm: SavedPaymentMethod) {
    if (pm.type === 'ach') {
      return `${pm.bank_name || 'Bank Account'} ····${pm.last4}`
    } else {
      return `${pm.card_brand ? pm.card_brand.toUpperCase() : 'Card'} ····${pm.last4}`
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    )
  }

  if (isEnrolled && enrollment) {
    return (
      <div>
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
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
                Autopay is Active
              </h3>
              <p className="text-sm text-purple-700 mb-4">
                You're saving ${(enrollment.discount_amount || discountAmount).toFixed(2)}
                /month with automatic payments on the 1st of each month.
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Active
            </div>
          </div>

          {enrollment.payment_method && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-purple-200">
              <p className="text-xs text-gray-600 mb-2">Payment Method</p>
              <p className="text-sm font-medium text-gray-900">
                {getPaymentMethodLabel(enrollment.payment_method)}
              </p>
            </div>
          )}

          <div className="bg-purple-100 rounded-lg p-4 mb-4">
            <p className="text-xs text-purple-700">
              💡 Your rent will be automatically charged on the 1st of each month. Make
              sure your payment method has sufficient funds to avoid failed payments.
            </p>
          </div>

          {!showConfirmCancel ? (
            <Button
              variant="secondary"
              onClick={() => setShowConfirmCancel(true)}
              disabled={isProcessing}
            >
              Cancel Autopay
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 mb-2">
                  ⚠️ Are you sure you want to cancel autopay?
                </p>
                <p className="text-xs text-yellow-700">
                  You'll lose your ${(enrollment.discount_amount || discountAmount).toFixed(2)}/month
                  discount and will need to make manual payments.
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="danger"
                  onClick={handleCancel}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Cancelling...' : 'Yes, Cancel Autopay'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowConfirmCancel(false)}
                  disabled={isProcessing}
                >
                  Keep Autopay
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Not enrolled - show enrollment form
  return (
    <div>
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">
          Enroll in Autopay & Save ${discountAmount.toFixed(2)}/Month
        </h3>
        <p className="text-sm text-blue-700 mb-6">
          Never miss a payment and save money! Your rent will be automatically charged
          on the 1st of each month.
        </p>

        {paymentMethods.length === 0 ? (
          <div className="p-4 bg-white rounded-lg border border-blue-200 mb-4">
            <p className="text-sm text-gray-600 mb-4">
              You need to save a payment method before enrolling in autopay.
            </p>
            <p className="text-xs text-gray-500">
              Make a payment first to save your payment method, then return here to enroll
              in autopay.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="payment-method"
                className="block text-sm font-medium text-blue-900 mb-2"
              >
                Select Payment Method
              </label>
              <select
                id="payment-method"
                value={selectedPaymentMethodId}
                onChange={(e) => setSelectedPaymentMethodId(e.target.value)}
                className="block w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isProcessing}
              >
                {paymentMethods.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {getPaymentMethodLabel(pm)}
                    {pm.is_default ? ' (Default)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-xs text-blue-600 mt-2">
                We recommend using ACH (bank account) for autopay to minimize fees
              </p>
            </div>

            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">
                How Autopay Works
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Automatic payment on the 1st of each month</li>
                <li>
                  • Save ${discountAmount.toFixed(2)}/month (${(discountAmount * 12).toFixed(2)}/year!)
                </li>
                <li>• No more manual payments or late fees</li>
                <li>• Cancel anytime (discount ends next billing cycle)</li>
                <li>• Email confirmation after each payment</li>
              </ul>
            </div>

            <Button
              onClick={handleEnroll}
              disabled={!selectedPaymentMethodId || isProcessing}
              className="w-full"
            >
              {isProcessing ? 'Enrolling...' : `Enroll in Autopay & Save $${discountAmount.toFixed(2)}/mo`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
