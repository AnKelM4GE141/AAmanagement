'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'

interface ManualPaymentFormProps {
  tenantId: string
  propertyId: string
  rentAmount: number
  tenantName?: string
  unitNumber?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function ManualPaymentForm({
  tenantId,
  propertyId,
  rentAmount,
  tenantName,
  unitNumber,
  onSuccess,
  onCancel,
}: ManualPaymentFormProps) {
  const [formData, setFormData] = useState({
    amount: rentAmount.toFixed(2),
    payment_method: 'check' as 'check' | 'cash' | 'money_order',
    payment_type: 'rent' as 'rent' | 'late_fee' | 'other',
    payment_date: new Date().toISOString().split('T')[0],
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Calculate current month period
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split('T')[0]
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split('T')[0]

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setIsSubmitting(true)
      setError('')
      setSuccess('')

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Please enter a valid amount')
      }

      const response = await fetch('/api/payments/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          property_id: propertyId,
          amount,
          payment_method: formData.payment_method,
          payment_type: formData.payment_type,
          payment_date: formData.payment_date,
          period_start: periodStart,
          period_end: periodEnd,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record payment')
      }

      setSuccess('Payment recorded successfully!')

      // Reset form
      setFormData({
        amount: rentAmount.toFixed(2),
        payment_method: 'check',
        payment_type: 'rent',
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
      })

      // Call onSuccess callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess()
        }, 1000)
      }
    } catch (err: any) {
      console.error('Error recording manual payment:', err)
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tenant Info */}
        {(tenantName || unitNumber) && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Recording payment for:</p>
            <p className="font-medium text-gray-900">
              {tenantName}
              {unitNumber && ` - Unit ${unitNumber}`}
            </p>
          </div>
        )}

        {/* Payment Type */}
        <div>
          <label
            htmlFor="payment_type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Type
          </label>
          <select
            id="payment_type"
            name="payment_type"
            value={formData.payment_type}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="rent">Rent Payment</option>
            <option value="late_fee">Late Fee</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Amount
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
              $
            </span>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <label
            htmlFor="payment_method"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Method
          </label>
          <select
            id="payment_method"
            name="payment_method"
            value={formData.payment_method}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          >
            <option value="check">Check</option>
            <option value="cash">Cash</option>
            <option value="money_order">Money Order</option>
          </select>
        </div>

        {/* Payment Date */}
        <div>
          <label
            htmlFor="payment_date"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Payment Date
          </label>
          <input
            type="date"
            id="payment_date"
            name="payment_date"
            value={formData.payment_date}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes (Optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Check number, reference, or other notes..."
          />
        </div>

        {/* Period Info */}
        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <p className="text-xs text-blue-700">
            This payment will be recorded for the period: {periodStart} to{' '}
            {periodEnd}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? 'Recording...' : 'Record Payment'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
