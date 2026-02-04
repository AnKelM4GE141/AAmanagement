import { requireRole } from '@/lib/auth/helpers'
import AdminSidebar from '@/components/admin/layout/AdminSidebar'
import AdminContent from '@/components/admin/layout/AdminContent'
import { SidebarProvider } from '@/components/admin/layout/SidebarContext'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const profile = await requireRole(['admin'])

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <AdminSidebar
          userFullName={profile.full_name}
          userEmail={profile.email}
          isOwner={profile.is_owner}
          avatarUrl={profile.avatar_url}
        />

        {/* Main content */}
        <AdminContent>
          <main className="px-4 sm:px-6 lg:px-8 py-8">{children}</main>
        </AdminContent>
      </div>
    </SidebarProvider>
  )
}
