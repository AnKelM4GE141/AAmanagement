'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

interface AssignTenantFormProps {
  propertyId: string
  availableUsers: Array<{
    id: string
    full_name: string
    email: string
  }>
}

export default function AssignTenantForm({ propertyId, availableUsers }: AssignTenantFormProps) {
  const router = useRouter()
  const [userId, setUserId] = useState('')
  const [unitNumber, setUnitNumber] = useState('')
  const [rentAmount, setRentAmount] = useState('')
  const [leaseStart, setLeaseStart] = useState('')
  const [leaseEnd, setLeaseEnd] = useState('')
  const [moveInDate, setMoveInDate] = useState('')
  const [securityDeposit, setSecurityDeposit] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/tenants/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          property_id: propertyId,
          unit_number: unitNumber || null,
          rent_amount: rentAmount ? parseFloat(rentAmount) : null,
          lease_start: leaseStart || null,
          lease_end: leaseEnd || null,
          move_in_date: moveInDate || null,
          security_deposit: securityDeposit ? parseFloat(securityDeposit) : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to assign tenant')
        setIsLoading(false)
        return
      }

      setSuccess('Tenant assigned successfully!')
      // Reset form
      setUserId('')
      setUnitNumber('')
      setRentAmount('')
      setLeaseStart('')
      setLeaseEnd('')
      setMoveInDate('')
      setSecurityDeposit('')
      setIsLoading(false)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Select Tenant <span className="text-red-500">*</span>
        </label>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">Choose a tenant...</option>
          {availableUsers.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.email})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Only users with "Tenant" role are shown
        </p>
      </div>

      <Input
        label="Unit Number"
        type="text"
        placeholder="e.g., Apt 101, Unit A"
        value={unitNumber}
        onChange={(e) => setUnitNumber(e.target.value)}
        helperText="Optional: Specific unit within the property"
      />

      <Input
        label="Monthly Rent"
        type="number"
        step="0.01"
        min="0"
        placeholder="1200.00"
        value={rentAmount}
        onChange={(e) => setRentAmount(e.target.value)}
        helperText="Monthly rent amount in dollars"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Lease Start Date"
          type="date"
          value={leaseStart}
          onChange={(e) => setLeaseStart(e.target.value)}
        />

        <Input
          label="Lease End Date"
          type="date"
          value={leaseEnd}
          onChange={(e) => setLeaseEnd(e.target.value)}
        />
      </div>

      <Input
        label="Move-In Date"
        type="date"
        value={moveInDate}
        onChange={(e) => setMoveInDate(e.target.value)}
        helperText="Actual or planned move-in date"
      />

      <Input
        label="Security Deposit"
        type="number"
        step="0.01"
        min="0"
        placeholder="1200.00"
        value={securityDeposit}
        onChange={(e) => setSecurityDeposit(e.target.value)}
        helperText="One-time security deposit amount"
      />

      <Button type="submit" fullWidth isLoading={isLoading}>
        Assign Tenant
      </Button>
    </form>
  )
}
