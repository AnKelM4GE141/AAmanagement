'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Alert from '@/components/ui/Alert'

interface InviteUserFormProps {
  onSuccess?: () => void
}

export default function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'tenant' | 'applicant'>('tenant')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setInviteUrl('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/users/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to send invitation')
        setIsLoading(false)
        return
      }

      setSuccess(`Invitation sent to ${email}`)
      setInviteUrl(data.inviteUrl)
      setEmail('')
      setRole('tenant')
      setIsLoading(false)

      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  const copyInviteUrl = () => {
    navigator.clipboard.writeText(inviteUrl)
    alert('Invitation link copied to clipboard!')
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && (
          <Alert variant="success">
            <div className="space-y-2">
              <p>{success}</p>
              {inviteUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Invitation Link:</p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={inviteUrl}
                      readOnly
                      className="flex-1 px-3 py-2 text-sm border border-green-300 rounded bg-white"
                    />
                    <button
                      type="button"
                      onClick={copyInviteUrl}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs mt-2">
                    Share this link with the invited user. It expires in 7 days.
                  </p>
                </div>
              )}
            </div>
          </Alert>
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'tenant' | 'applicant')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="tenant">Tenant</option>
            <option value="applicant">Applicant</option>
            <option value="admin">Admin</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {role === 'admin' && 'Full access to manage users and properties'}
            {role === 'tenant' && 'Access to tenant portal for payments and maintenance'}
            {role === 'applicant' && 'Limited access to view application status'}
          </p>
        </div>

        <Button type="submit" fullWidth isLoading={isLoading}>
          Send Invitation
        </Button>
      </form>
    </div>
  )
}
