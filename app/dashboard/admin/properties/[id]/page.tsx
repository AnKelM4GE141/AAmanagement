import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'
import AssignTenantForm from '@/components/admin/properties/AssignTenantForm'

export const dynamic = 'force-dynamic'

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireRole(['admin'])
  const { id } = await params

  const supabase = await createClient()

  // Fetch property details
  const { data: property, error: propertyError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single()

  if (propertyError || !property) {
    notFound()
  }

  // Fetch tenants for this property
  const { data: tenants } = await supabase
    .from('tenants')
    .select(`
      *,
      user:users_profile!tenants_user_id_fkey(
        id,
        full_name,
        email,
        phone
      )
    `)
    .eq('property_id', id)
    .eq('status', 'active')

  // Fetch all tenant users (role = tenant) for assignment
  const { data: availableUsers } = await supabase
    .from('users_profile')
    .select('id, full_name, email')
    .eq('role', 'tenant')
    .order('full_name')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/admin/properties"
          className="text-sm text-primary-600 hover:text-primary-700 mb-2 inline-block"
        >
          ← Back to Properties
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">
          {property.name || property.address}
        </h1>
        <p className="text-slate-600 mt-1">{property.address}</p>
      </div>

      {/* Property Details */}
      <Card>
        <CardHeader>
          <CardTitle>Property Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {property.property_type && (
              <div>
                <p className="text-sm text-slate-600">Type</p>
                <p className="font-medium capitalize">
                  {property.property_type.replace('_', ' ')}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-slate-600">Total Units</p>
              <p className="font-medium">{property.total_units}</p>
            </div>
            {property.description && (
              <div className="col-span-2">
                <p className="text-sm text-slate-600">Description</p>
                <p className="text-slate-900">{property.description}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assign Tenant Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Assign Tenant</CardTitle>
            </CardHeader>
            <CardContent>
              <AssignTenantForm
                propertyId={id}
                availableUsers={availableUsers || []}
              />
            </CardContent>
          </Card>
        </div>

        {/* Tenants List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Tenants ({tenants?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {(!tenants || tenants.length === 0) && (
                <p className="text-slate-600 text-sm">
                  No tenants assigned yet. Use the form to assign a tenant to this property.
                </p>
              )}

              {tenants && tenants.length > 0 && (
                <div className="space-y-4">
                  {tenants.map((tenant: any) => (
                    <div
                      key={tenant.id}
                      className="p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">
                            {tenant.user.full_name}
                          </h3>
                          <p className="text-sm text-slate-600">{tenant.user.email}</p>
                          {tenant.user.phone && (
                            <p className="text-sm text-slate-600">{tenant.user.phone}</p>
                          )}

                          <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                            {tenant.unit_number && (
                              <div>
                                <p className="text-slate-600">Unit</p>
                                <p className="font-medium">{tenant.unit_number}</p>
                              </div>
                            )}
                            {tenant.rent_amount && (
                              <div>
                                <p className="text-slate-600">Rent</p>
                                <p className="font-medium">${tenant.rent_amount.toLocaleString()}/mo</p>
                              </div>
                            )}
                            {tenant.lease_start && (
                              <div>
                                <p className="text-slate-600">Lease Start</p>
                                <p className="font-medium">
                                  {new Date(tenant.lease_start).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {tenant.lease_end && (
                              <div>
                                <p className="text-slate-600">Lease End</p>
                                <p className="font-medium">
                                  {new Date(tenant.lease_end).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
