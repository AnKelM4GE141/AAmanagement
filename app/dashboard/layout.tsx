import { getUserProfile } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  // Admin has its own layout with sidebar, so just render children
  if (profile.role === 'admin') {
    return <>{children}</>
  }

  // For tenant/applicant, we can add their layout later
  return <>{children}</>
}
