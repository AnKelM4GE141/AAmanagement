import { getUserProfile, getDashboardPath } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import SignOutButton from '@/components/auth/SignOutButton'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/auth/login')
  }

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    tenant: 'bg-blue-100 text-blue-800',
    applicant: 'bg-green-100 text-green-800',
  }

  const dashboardHome = getDashboardPath(profile.role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href={dashboardHome} className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors">
                AA Portal
              </Link>
              <span
                className={`ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  roleColors[profile.role]
                }`}
              >
                {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{profile.full_name}</span>
              <SignOutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
