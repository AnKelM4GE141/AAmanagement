'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserRoleSelectProps {
  userId: string
  currentRole: 'admin' | 'tenant' | 'applicant'
  userName: string
  isOwner: boolean
  currentUserId?: string
}

export default function UserRoleSelect({ userId, currentRole, userName, isOwner, currentUserId }: UserRoleSelectProps) {
  const router = useRouter()
  const [role, setRole] = useState(currentRole)
  const [isLoading, setIsLoading] = useState(false)

  const handleRoleChange = async (newRole: string) => {
    if (newRole === role) return

    const confirmed = confirm(
      `Change ${userName}'s role from ${role} to ${newRole}?`
    )

    if (!confirmed) {
      setRole(role) // Reset to current role
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/users/update-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, newRole }),
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || 'Failed to update role')
        setRole(role) // Reset to current role
        setIsLoading(false)
        return
      }

      setRole(newRole as 'admin' | 'tenant' | 'applicant')
      setIsLoading(false)
      router.refresh()
    } catch (err) {
      alert('An unexpected error occurred')
      setRole(role) // Reset to current role
      setIsLoading(false)
    }
  }

  // Don't allow changing owner role
  if (isOwner) {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
        {role.charAt(0).toUpperCase() + role.slice(1)} (Owner)
      </span>
    )
  }

  // Don't allow admins to demote themselves
  const isSelf = currentUserId && userId === currentUserId
  if (isSelf && role === 'admin') {
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        {role.charAt(0).toUpperCase() + role.slice(1)} (You)
      </span>
    )
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    tenant: 'bg-blue-100 text-blue-800 border-blue-200',
    applicant: 'bg-green-100 text-green-800 border-green-200',
  }

  return (
    <select
      value={role}
      onChange={(e) => handleRoleChange(e.target.value)}
      disabled={isLoading}
      className={`px-2.5 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${roleColors[role]}`}
    >
      <option value="admin">Admin</option>
      <option value="tenant">Tenant</option>
      <option value="applicant">Applicant</option>
    </select>
  )
}
