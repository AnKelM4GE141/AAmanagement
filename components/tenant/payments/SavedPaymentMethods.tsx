'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Alert from '@/components/ui/Alert'
import AddPaymentMethodForm from './AddPaymentMethodForm'
import type { SavedPaymentMethod } from '@/lib/types/payment'

interface SavedPaymentMethodsProps {
  onSelectForAutopay?: (paymentMethodId: string) => void
}

export default function SavedPaymentMethods({
  onSelectForAutopay,
}: SavedPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  async function fetchPaymentMethods() {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/payment-methods')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch payment methods')
      }

      setPaymentMethods(data.payment_methods || [])
    } catch (err: any) {
      console.error('Error fetching payment methods:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this payment method?')) {
      return
    }

    try {
      setDeletingId(id)
      setError('')

      const response = await fetch(`/api/payment-methods/${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete payment method')
      }

      // Remove from list
      setPaymentMethods((prev) => prev.filter((pm) => pm.id !== id))
    } catch (err: any) {
      console.error('Error deleting payment method:', err)
      setError(err.message)
    } finally {
      setDeletingId(null)
    }
  }

  async function handleSetDefault(id: string) {
    try {
      setSettingDefaultId(id)
      setError('')

      const response = await fetch(`/api/payment-methods/${id}/set-default`, {
        method: 'PATCH',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set default payment method')
      }

      // Update list - set this as default, unset others
      setPaymentMethods((prev) =>
        prev.map((pm) => ({
          ...pm,
          is_default: pm.id === id,
        }))
      )
    } catch (err: any) {
      console.error('Error setting default:', err)
      setError(err.message)
    } finally {
      setSettingDefaultId(null)
    }
  }

  function handleAddSuccess() {
    setShowAddForm(false)
    fetchPaymentMethods() // Refresh the list
  }

  function handleAddCancel() {
    setShowAddForm(false)
  }

  function getPaymentMethodIcon(type: string) {
    if (type === 'ach') {
      return (
        <svg
          className="w-8 h-8 text-blue-600"
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
      )
    } else {
      return (
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
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      )
    }
  }

  function getPaymentMethodLabel(pm: SavedPaymentMethod) {
    if (pm.type === 'ach') {
      return (
        <div>
          <div className="font-medium text-gray-900">
            {pm.bank_name || 'Bank Account'}
          </div>
          <div className="text-sm text-gray-600">····{pm.last4}</div>
        </div>
      )
    } else {
      return (
        <div>
          <div className="font-medium text-gray-900">
            {pm.card_brand ? pm.card_brand.toUpperCase() : 'Card'} ····
            {pm.last4}
          </div>
          <div className="text-sm text-gray-600">
            Expires {pm.exp_month}/{pm.exp_year}
          </div>
        </div>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-2 text-sm text-gray-600">Loading payment methods...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      {showAddForm ? (
        <AddPaymentMethodForm
          onSuccess={handleAddSuccess}
          onCancel={handleAddCancel}
        />
      ) : (
        <>
          {!isLoading && (
            <div className="flex justify-end">
              <Button onClick={() => setShowAddForm(true)}>
                + Add Payment Method
              </Button>
            </div>
          )}

          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-2 text-sm text-gray-600">No saved payment methods</p>
              <p className="text-xs text-gray-500 mt-1">
                Click "Add Payment Method" above to get started
              </p>
            </div>
          ) : (
        <div className="space-y-3">
          {paymentMethods.map((pm) => (
            <div
              key={pm.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                pm.is_default
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center space-x-4">
                {getPaymentMethodIcon(pm.type)}
                <div className="flex-1">
                  {getPaymentMethodLabel(pm)}
                  {pm.is_default && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                      Default
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onSelectForAutopay && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onSelectForAutopay(pm.id)}
                  >
                    Use for Autopay
                  </Button>
                )}

                {!pm.is_default && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSetDefault(pm.id)}
                    disabled={settingDefaultId === pm.id}
                  >
                    {settingDefaultId === pm.id
                      ? 'Setting...'
                      : 'Set as Default'}
                  </Button>
                )}

                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(pm.id)}
                  disabled={deletingId === pm.id}
                >
                  {deletingId === pm.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          About Saved Payment Methods
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Payment methods are securely stored with Stripe</li>
          <li>• We never see or store your full card or bank account numbers</li>
          <li>• You can use saved methods for future payments</li>
          <li>• Set a default payment method for faster checkout</li>
          <li>• Required for autopay enrollment</li>
        </ul>
      </div>
        </>
      )}
    </div>
  )
}
