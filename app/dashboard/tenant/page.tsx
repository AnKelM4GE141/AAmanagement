import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default async function TenantDashboard() {
  const profile = await requireRole(['tenant'])

  const supabase = await createClient()

  // Fetch tenant assignment and property details
  const { data: tenantData } = await supabase
    .from('tenants')
    .select(`
      *,
      property:properties(
        name,
        address,
        description
      )
    `)
    .eq('user_id', profile.id)
    .eq('status', 'active')
    .single()

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-gray-600 mt-1">Tenant Portal</p>
      </div>

      {/* Rent Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Rent Status</h2>
            <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
              Up to Date
            </div>
            <p className="text-sm text-gray-600 mt-4">
              Payment system coming in Phase 3
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Make Payment</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Pay your rent online securely</p>
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
              Coming in Phase 3
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Maintenance Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Submit a maintenance ticket</p>
            <button className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed">
              Coming in Phase 4
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Information Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Lease Information</CardTitle>
          </CardHeader>
          <CardContent>
            {!tenantData ? (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">Not assigned to a property yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Contact your property manager for assistance
                </p>
              </div>
            ) : (
              <>
                {tenantData.property && (
                  <div className="mb-4 pb-4 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">
                      {tenantData.property.name || 'Your Property'}
                    </h4>
                    <p className="text-sm text-gray-600">{tenantData.property.address}</p>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">
                      {tenantData.unit_number || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lease Start:</span>
                    <span className="font-medium">
                      {tenantData.lease_start
                        ? new Date(tenantData.lease_start).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lease End:</span>
                    <span className="font-medium">
                      {tenantData.lease_end
                        ? new Date(tenantData.lease_end).toLocaleDateString()
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Rent:</span>
                    <span className="font-medium text-lg">
                      {tenantData.rent_amount
                        ? `$${tenantData.rent_amount.toLocaleString()}`
                        : '-'}
                    </span>
                  </div>
                  {tenantData.security_deposit && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Security Deposit:</span>
                      <span className="font-medium">
                        ${tenantData.security_deposit.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">No recent activity</p>
            <p className="text-xs text-gray-500 mt-2">
              Activity tracking coming soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-2 text-sm text-gray-600">No documents available</p>
            <p className="text-xs text-gray-500 mt-1">
              Document management coming in Phase 2
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
