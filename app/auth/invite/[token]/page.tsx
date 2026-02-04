'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'

export default function AcceptInvitePage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string

  const [invitation, setInvitation] = useState<any>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingInvite, setIsCheckingInvite] = useState(true)

  useEffect(() => {
    checkInvitation()
  }, [token])

  const checkInvitation = async () => {
    const supabase = createClient()

    const { data, error } = await supabase
      .from('user_invitations')
      .select('*')
      .eq('token', token)
      .is('accepted_at', null)
      .single()

    if (error || !data) {
      setError('Invalid or expired invitation')
      setIsCheckingInvite(false)
      return
    }

    // Check if invitation is expired
    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      setError('This invitation has expired')
      setIsCheckingInvite(false)
      return
    }

    setInvitation(data)
    setIsCheckingInvite(false)
  }

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up the user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (signUpError || !authData.user) {
        setError(signUpError?.message || 'Failed to create account')
        setIsLoading(false)
        return
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('users_profile')
        .insert({
          id: authData.user.id,
          email: invitation.email,
          full_name: fullName,
          phone: phone || null,
          role: invitation.role,
          is_owner: false,
          invited_by: invitation.invited_by,
        })

      if (profileError) {
        setError('Failed to create user profile')
        setIsLoading(false)
        return
      }

      // Mark invitation as accepted
      await supabase
        .from('user_invitations')
        .update({ accepted_at: new Date().toISOString() })
        .eq('id', invitation.id)

      // Create or link contact for non-admin roles
      if (invitation.role !== 'admin') {
        if (invitation.contact_id) {
          // Link existing contact to this new user
          await supabase
            .from('contacts')
            .update({ user_id: authData.user.id })
            .eq('id', invitation.contact_id)
        } else {
          // Create new contact linked to this user
          await supabase
            .from('contacts')
            .insert({
              full_name: fullName,
              email: invitation.email,
              phone: phone || null,
              source: 'invitation',
              user_id: authData.user.id,
              created_by: invitation.invited_by,
            })
        }
      }

      // Redirect to appropriate dashboard
      const dashboards = {
        admin: '/dashboard/admin',
        tenant: '/dashboard/tenant',
        applicant: '/dashboard/applicant',
      }

      router.push(dashboards[invitation.role as keyof typeof dashboards])
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  if (isCheckingInvite) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <Card>
            <Alert variant="error">{error}</Alert>
            <div className="mt-6 text-center">
              <Button onClick={() => router.push('/auth/login')}>
                Go to Login
              </Button>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to AA Portal</h1>
          <p className="text-gray-600 mt-2">
            You've been invited as a <span className="font-semibold">{invitation?.role}</span>
          </p>
        </div>

        <Card>
          <form onSubmit={handleAccept} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

            <Alert variant="info">
              <p className="text-sm">
                <strong>Email:</strong> {invitation?.email}
              </p>
            </Alert>

            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />

            <Input
              label="Phone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="At least 8 characters"
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Accept Invitation
            </Button>
          </form>
        </Card>
      </div>
    </div>
  )
}
