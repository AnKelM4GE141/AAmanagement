import { requireRole } from '@/lib/auth/helpers'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'

export default async function AdminDashboard() {
  const profile = await requireRole(['admin'])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {profile.full_name}
        </h1>
        <p className="text-gray-600 mt-1">
          {profile.is_owner ? 'Owner & Administrator' : 'Administrator'}
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Active Tenants</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">-</p>
              <p className="text-xs text-gray-500 mt-1">Coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Invite Users</h3>
                <p className="text-sm text-gray-600">
                  Invite tenants, applicants, or additional admins
                </p>
              </div>
              <Link
                href="/dashboard/admin/users"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Users
              </Link>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Properties</h3>
                <p className="text-sm text-gray-600">
                  Add and manage your rental properties
                </p>
              </div>
              <Link
                href="/dashboard/admin/properties"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Properties
              </Link>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Getting Started:</strong> Add your properties first, then invite tenants and assign them to units.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 className="font-medium text-gray-900">Applications</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage tenant applications</p>
              <p className="text-xs text-gray-500 mt-2">Coming in Phase 2</p>
            </button>

            <Link href="/dashboard/admin/properties" className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors block">
              <h3 className="font-medium text-gray-900">Properties</h3>
              <p className="text-sm text-gray-600 mt-1">Manage your rental properties</p>
              <p className="text-xs text-blue-600 mt-2 font-medium">Available Now →</p>
            </Link>

            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 className="font-medium text-gray-900">Payments</h3>
              <p className="text-sm text-gray-600 mt-1">Track rent payments</p>
              <p className="text-xs text-gray-500 mt-2">Coming in Phase 3</p>
            </button>

            <button className="p-4 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <h3 className="font-medium text-gray-900">Maintenance</h3>
              <p className="text-sm text-gray-600 mt-1">View maintenance requests</p>
              <p className="text-xs text-gray-500 mt-2">Coming in Phase 4</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
