'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import Alert from '@/components/ui/Alert'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
        setIsLoading(false)
        return
      }

      // Fetch user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profileError || !profile) {
        setError('Failed to load user profile')
        setIsLoading(false)
        return
      }

      // Redirect based on role
      const dashboards = {
        admin: '/dashboard/admin',
        tenant: '/dashboard/tenant',
        applicant: '/dashboard/applicant',
      }

      router.push(dashboards[profile.role as keyof typeof dashboards])
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AA Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}

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
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-sm">
              <Link
                href="/auth/forgot-password"
                className="text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" fullWidth isLoading={isLoading}>
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            First time here?{' '}
            <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
              Get Started
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
