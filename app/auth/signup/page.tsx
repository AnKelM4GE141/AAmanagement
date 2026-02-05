'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingUsers, setIsCheckingUsers] = useState(true)
  const [signupDisabled, setSignupDisabled] = useState(false)

  useEffect(() => {
    checkExistingUsers()
  }, [])

  const checkExistingUsers = async () => {
    const supabase = createClient()
    const { count } = await supabase
      .from('users_profile')
      .select('*', { count: 'exact', head: true })

    if (count && count > 0) {
      setSignupDisabled(true)
    }
    setIsCheckingUsers(false)
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    // Validate password strength
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()

      // Sign up the user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setIsLoading(false)
        return
      }

      if (!data.user) {
        setError('Failed to create account')
        setIsLoading(false)
        return
      }

      // Create user profile (first user becomes owner/admin)
      const { error: profileError } = await supabase
        .from('users_profile')
        .insert({
          id: data.user.id,
          email: email,
          full_name: fullName,
          phone: phone || null,
          role: 'admin',
          is_owner: true,
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        setError('Failed to create user profile')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setIsLoading(false)

      // Redirect to admin dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard/admin')
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Decorative panel (shared across all states)
  const decorativePanel = (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900" />
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="relative flex items-center justify-center w-full">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-white">AA Portal</h2>
          <p className="text-primary-200 mt-3 text-lg">Property Management Platform</p>
        </div>
      </div>
    </div>
  )

  if (isCheckingUsers) {
    return (
      <div className="flex min-h-screen">
        {decorativePanel}
        <div className="flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-slate-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (signupDisabled) {
    return (
      <div className="flex min-h-screen">
        {decorativePanel}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="w-full max-w-md animate-fade-in-up">
            <Card>
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Signup Unavailable
                </h2>
                <p className="text-slate-600 mb-6">
                  An admin account already exists. Please contact your administrator for an invitation.
                </p>
                <Link href="/auth/login">
                  <Button fullWidth>Go to Login</Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="flex min-h-screen">
        {decorativePanel}
        <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50">
          <div className="w-full max-w-md animate-fade-in-up">
            <Card>
              <Alert variant="success">
                <div>
                  <p className="font-semibold mb-2">Account created successfully!</p>
                  <p>You are now the owner/admin. Redirecting to your dashboard...</p>
                </div>
              </Alert>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      {decorativePanel}

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-4 sm:px-6 lg:px-8 bg-slate-50 py-12">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile logo */}
          <div className="text-center mb-8 lg:hidden">
            <h1 className="text-3xl font-bold text-slate-900">AA Portal</h1>
            <p className="text-slate-500 mt-2">Create your owner account</p>
          </div>
          {/* Desktop heading */}
          <div className="hidden lg:block text-center mb-8">
            <h1 className="text-2xl font-bold text-slate-900">Get Started</h1>
            <p className="text-slate-500 mt-2">Create your owner account</p>
            <p className="text-sm text-primary-600 mt-1">
              You will become the administrator
            </p>
          </div>

          <Card>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && <Alert variant="error">{error}</Alert>}

              <Input
                label="Full Name"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
                Create Owner Account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign In
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
