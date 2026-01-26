import { createClient } from '@/lib/supabase/server'
import { UserProfile, UserRole } from '@/lib/types/user'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()
  const user = await getUser()

  if (!user) return null

  const { data, error } = await supabase
    .from('users_profile')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data as UserProfile
}

export async function requireAuth() {
  const user = await getUser()
  if (!user) {
    redirect('/auth/login')
  }
  return user
}

export async function requireRole(allowedRoles: UserRole[]) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  if (!allowedRoles.includes(profile.role)) {
    // Redirect to their appropriate dashboard
    redirect(getDashboardPath(profile.role))
  }

  return profile
}

export function getDashboardPath(role: UserRole): string {
  const dashboards = {
    admin: '/dashboard/admin',
    tenant: '/dashboard/tenant',
    applicant: '/dashboard/applicant',
  }
  return dashboards[role]
}

export async function checkIsFirstUser(): Promise<boolean> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('users_profile')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error checking user count:', error)
    return false
  }

  return count === 0
}
