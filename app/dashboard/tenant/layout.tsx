import { requireRole } from '@/lib/auth/helpers'
import SignOutButton from '@/components/auth/SignOutButton'
import Link from 'next/link'

export default async function TenantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['tenant'])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/tenant"
                className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
              >
                AA Portal
              </Link>
              <span className="ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Tenant
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-700 hidden sm:block">
                {profile.full_name}
              </span>
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
