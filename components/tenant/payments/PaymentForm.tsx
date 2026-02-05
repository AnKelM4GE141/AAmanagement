'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import type { CreatePaymentIntentRequest } from '@/lib/types/payment'

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface PaymentFormProps {
  tenantId: string
  amount: number
  rentAmount: number // Original rent amount before discount
  propertyName?: string
  hasAutopayDiscount?: boolean
  discountAmount?: number
  onSuccess?: () => void
  onCancel?: () => void
}

// Inner form component that uses Stripe hooks
function CheckoutForm({
  tenantId,
  amount,
  rentAmount,
  propertyName,
  hasAutopayDiscount,
  discountAmount,
  onSuccess,
  onCancel,
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()

  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Failed to process payment')
        setIsProcessing(false)
        return
      }

      // Confirm payment with Stripe
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/tenant/payments?payment=success`,
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setIsProcessing(false)
        return
      }

      // Payment successful
      setSuccess(true)
      setIsProcessing(false)

      // Call success callback
      if (onSuccess) {
        onSuccess()
      } else {
        // Refresh the page to show updated payment status
        setTimeout(() => {
          router.refresh()
        }, 1500)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError('An unexpected error occurred')
      setIsProcessing(false)
    }
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
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
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Payment Successful!
        </h3>
        <p className="text-sm text-slate-600">
          Your payment of ${amount.toFixed(2)} has been processed.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Redirecting to your dashboard...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      {/* Payment Summary */}
      <div className="bg-slate-50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Property:</span>
          <span className="font-medium text-slate-900">
            {propertyName || 'Your Property'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Monthly Rent:</span>
          <span className="font-medium text-slate-900">
            ${rentAmount.toFixed(2)}
          </span>
        </div>
        {hasAutopayDiscount && discountAmount && discountAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Autopay Discount:</span>
            <span className="font-medium text-green-600">
              -${discountAmount.toFixed(2)}
            </span>
          </div>
        )}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex justify-between">
            <span className="font-semibold text-slate-900">Total Due:</span>
            <span className="font-bold text-lg text-slate-900">
              ${amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Payment Method
        </label>
        <PaymentElement />
        <p className="mt-2 text-xs text-slate-500">
          Supports credit/debit cards and ACH bank transfers
        </p>
      </div>

      {/* Fee Information */}
      <div className="bg-primary-50 p-3 rounded-lg">
        <p className="text-xs text-primary-800">
          <strong>Payment Processing Fees:</strong>
          <br />
          • Credit/Debit Cards: 2.9% + $0.30
          <br />• ACH Bank Transfer: 0.8% (capped at $5.00)
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <Button
          type="submit"
          fullWidth
          isLoading={isProcessing}
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            fullWidth
            disabled={isProcessing}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

// Main component that creates the payment intent and wraps with Elements
export default function PaymentForm(props: PaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Create payment intent when component mounts
    async function createPaymentIntent() {
      try {
        setIsLoading(true)
        setError('')

        // Calculate period for this month
        const now = new Date()
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0]
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          .toISOString()
          .split('T')[0]
        const dueDate = new Date(now.getFullYear(), now.getMonth(), 1)
          .toISOString()
          .split('T')[0]

        const requestBody: CreatePaymentIntentRequest = {
          tenant_id: props.tenantId,
          amount: props.amount,
          payment_type: 'rent',
          period_start: periodStart,
          period_end: periodEnd,
          due_date: dueDate,
        }

        const response = await fetch('/api/payments/create-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || 'Failed to initialize payment')
          setIsLoading(false)
          return
        }

        setClientSecret(data.client_secret)
        setIsLoading(false)
      } catch (err) {
        console.error('Failed to create payment intent:', err)
        setError('Failed to initialize payment')
        setIsLoading(false)
      }
    }

    createPaymentIntent()
  }, [props.tenantId, props.amount])

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-blue-600"></div>
        <p className="mt-4 text-sm text-slate-600">Initializing payment...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-4">
        <Alert variant="error">{error}</Alert>
        {props.onCancel && (
          <Button
            variant="secondary"
            onClick={props.onCancel}
            fullWidth
            className="mt-4"
          >
            Go Back
          </Button>
        )}
      </div>
    )
  }

  if (!clientSecret) {
    return (
      <div className="py-4">
        <Alert variant="error">Failed to initialize payment</Alert>
      </div>
    )
  }

  // Stripe Elements options
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#111827',
        colorDanger: '#dc2626',
        fontFamily: 'system-ui, sans-serif',
        borderRadius: '0.5rem',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  )
}
