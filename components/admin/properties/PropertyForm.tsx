'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'
import type { Property } from '@/lib/types/property'

interface PropertyFormProps {
  property?: Property
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PropertyForm({ property, onSuccess, onCancel }: PropertyFormProps) {
  const router = useRouter()
  const [name, setName] = useState(property?.name || '')
  const [address, setAddress] = useState(property?.address || '')
  const [description, setDescription] = useState(property?.description || '')
  const [totalUnits, setTotalUnits] = useState(property?.total_units?.toString() || '1')
  const [propertyType, setPropertyType] = useState(property?.property_type || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const url = property ? `/api/properties/${property.id}` : '/api/properties'
      const method = property ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name || null,
          address,
          description: description || null,
          total_units: parseInt(totalUnits) || 1,
          property_type: propertyType || null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save property')
        setIsLoading(false)
        return
      }

      setIsLoading(false)
      router.refresh()

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="Property Name"
        type="text"
        placeholder="Sunset Apartments"
        value={name}
        onChange={(e) => setName(e.target.value)}
        helperText="Optional: A friendly name for this property"
      />

      <Input
        label="Address"
        type="text"
        placeholder="123 Main St, City, State 12345"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the property..."
          rows={3}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Total Units"
          type="number"
          min="1"
          placeholder="1"
          value={totalUnits}
          onChange={(e) => setTotalUnits(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Property Type
          </label>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select type...</option>
            <option value="single_family">Single Family</option>
            <option value="apartment">Apartment</option>
            <option value="condo">Condo</option>
            <option value="townhouse">Townhouse</option>
            <option value="multi_family">Multi-Family</option>
            <option value="commercial">Commercial</option>
          </select>
        </div>
      </div>

      <div className="flex space-x-3">
        <Button type="submit" fullWidth isLoading={isLoading}>
          {property ? 'Update Property' : 'Add Property'}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
