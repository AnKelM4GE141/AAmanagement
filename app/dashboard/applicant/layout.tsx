import { requireRole } from '@/lib/auth/helpers'
import { getViewAsRole } from '@/lib/auth/view-as'
import SignOutButton from '@/components/auth/SignOutButton'
import ViewAsBanner from '@/components/admin/ViewAsBanner'
import ViewSwitcher from '@/components/admin/ViewSwitcher'
import Link from 'next/link'

export default async function ApplicantLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['applicant'])
  const viewAsRole = await getViewAsRole()
  const isImpersonating = profile.role === 'admin' && viewAsRole === 'applicant'

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Impersonation Banner */}
      {isImpersonating && <ViewAsBanner role="applicant" />}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link
                href="/dashboard/applicant"
                className="text-xl font-bold text-slate-900 hover:text-slate-700 transition-colors"
              >
                AA Portal
              </Link>
              <span className="ml-4 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Applicant
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {isImpersonating && <ViewSwitcher currentView="applicant" />}
              <span className="text-sm text-slate-700 hidden sm:block">
                {profile.full_name}
              </span>
              {!isImpersonating && <SignOutButton />}
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
