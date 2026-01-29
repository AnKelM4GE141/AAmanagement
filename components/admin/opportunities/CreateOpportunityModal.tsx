'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

interface Contact {
  id: string
  full_name: string
  email: string
}

interface Property {
  id: string
  address: string
}

interface CreateOpportunityModalProps {
  contact: Contact
  onClose: () => void
  onSuccess: () => void
}

export default function CreateOpportunityModal({
  contact,
  onClose,
  onSuccess,
}: CreateOpportunityModalProps) {
  const [properties, setProperties] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    stage: 'lead',
    property_id: '',
    expected_move_in: '',
    value: '',
    notes: '',
  })

  useEffect(() => {
    fetchProperties()
  }, [])

  async function fetchProperties() {
    try {
      const response = await fetch('/api/admin/properties')
      const data = await response.json()
      setProperties(data.properties || [])
    } catch (err: any) {
      console.error('Error fetching properties:', err)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/admin/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: contact.id,
          stage: formData.stage,
          property_id: formData.property_id || null,
          expected_move_in: formData.expected_move_in || null,
          value: formData.value ? parseFloat(formData.value) : null,
          notes: formData.notes || null,
        }),
      })

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      onSuccess()
    } catch (err: any) {
      console.error('Error creating opportunity:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Create Opportunity</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Create a new opportunity for {contact.full_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && <Alert variant="error">{error}</Alert>}

          {/* Stage */}
          <div>
            <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Stage
            </label>
            <select
              id="stage"
              value={formData.stage}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              <option value="lead">Lead</option>
              <option value="contacted">Contacted</option>
              <option value="application_submitted">Application Submitted</option>
              <option value="application_reviewing">Reviewing</option>
              <option value="approved">Approved</option>
              <option value="lease_signed">Lease Signed</option>
            </select>
          </div>

          {/* Property */}
          <div>
            <label htmlFor="property" className="block text-sm font-medium text-gray-700 mb-1">
              Property (Optional)
            </label>
            <select
              id="property"
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">No property selected</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address}
                </option>
              ))}
            </select>
          </div>

          {/* Expected Move-in Date */}
          <Input
            label="Expected Move-in Date (Optional)"
            type="date"
            value={formData.expected_move_in}
            onChange={(e) => setFormData({ ...formData, expected_move_in: e.target.value })}
          />

          {/* Value */}
          <Input
            label="Expected Value (Optional)"
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({ ...formData, value: e.target.value })}
            placeholder="e.g., 1200"
          />

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Any additional notes..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isLoading}>
              Create Opportunity
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
