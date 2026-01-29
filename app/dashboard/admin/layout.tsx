import { requireRole } from '@/lib/auth/helpers'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import SignOutButton from '@/components/auth/SignOutButton'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['admin'])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        userFullName={profile.full_name}
        userEmail={profile.email}
      />

      {/* Main content */}
      <div className="lg:pl-60">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Left side - breadcrumbs or page title could go here */}
              <div className="flex-1 min-w-0">
                {/* Space for future breadcrumbs */}
              </div>

              {/* Right side - user info and sign out */}
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700 hidden sm:block">
                  {profile.full_name}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  {profile.is_owner ? 'Owner' : 'Admin'}
                </span>
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  )
}
