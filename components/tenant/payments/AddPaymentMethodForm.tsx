'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)

interface AddPaymentMethodFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function PaymentMethodForm({ onSuccess, onCancel }: AddPaymentMethodFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError('')

    try {
      // MUST call submit first
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      // THEN create payment method
      const { error: createError, paymentMethod } = await stripe.createPaymentMethod({
        elements,
      })

      if (createError) {
        throw new Error(createError.message)
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method')
      }

      // Save payment method via API
      const response = await fetch('/api/payment-methods/attach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_payment_method_id: paymentMethod.id,
          is_default: setAsDefault,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save payment method')
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error saving payment method:', err)
      setError(err.message || 'Failed to save payment method')
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <PaymentElement />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="setAsDefault"
          checked={setAsDefault}
          onChange={(e) => setSetAsDefault(e.target.checked)}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
        />
        <label
          htmlFor="setAsDefault"
          className="ml-2 block text-sm text-slate-900"
        >
          Set as default payment method
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || isProcessing}>
          {isProcessing ? 'Saving...' : 'Save Payment Method'}
        </Button>
      </div>
    </form>
  )
}

export default function AddPaymentMethodForm({
  onSuccess,
  onCancel,
}: AddPaymentMethodFormProps) {
  const options = {
    mode: 'setup' as const,
    currency: 'usd',
    setupFutureUsage: 'off_session' as const,
    paymentMethodCreation: 'manual' as const,
  }

  return (
    <div className="space-y-4">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-lg font-medium text-slate-900">
          Add Payment Method
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Add a card or bank account for future payments
        </p>
      </div>

      <Elements stripe={stripePromise} options={options}>
        <PaymentMethodForm onSuccess={onSuccess} onCancel={onCancel} />
      </Elements>
    </div>
  )
}
