import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import PropertyForm from '@/components/admin/properties/PropertyForm'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function PropertiesPage() {
  await requireRole(['admin'])

  const supabase = await createClient()

  // Fetch all properties with tenant counts
  const { data: properties, error: propertiesError } = await supabase
    .from('properties')
    .select(`
      *,
      tenants:tenants(count)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Properties</h1>
        <p className="text-slate-600 mt-1">Manage your rental properties</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Property Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Add New Property</CardTitle>
            </CardHeader>
            <CardContent>
              <PropertyForm />
            </CardContent>
          </Card>
        </div>

        {/* Properties List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Properties ({properties?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {propertiesError && (
                <div className="text-red-600 text-sm">Error loading properties</div>
              )}

              {properties && properties.length === 0 && (
                <p className="text-slate-600 text-sm">
                  No properties yet. Add your first property to get started!
                </p>
              )}

              {properties && properties.length > 0 && (
                <div className="space-y-4">
                  {properties.map((property: any) => {
                    const tenantCount = property.tenants[0]?.count || 0

                    return (
                      <div
                        key={property.id}
                        className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              {property.name && (
                                <h3 className="font-semibold text-slate-900">
                                  {property.name}
                                </h3>
                              )}
                              {property.property_type && (
                                <span className="px-2 py-0.5 text-xs bg-primary-100 text-primary-800 rounded-full">
                                  {property.property_type.replace('_', ' ')}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-700 mt-1">
                              {property.address}
                            </p>
                            {property.description && (
                              <p className="text-sm text-slate-600 mt-1">
                                {property.description}
                              </p>
                            )}
                            <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                              <span>{property.total_units} {property.total_units === 1 ? 'unit' : 'units'}</span>
                              <span>•</span>
                              <span>{tenantCount} active {tenantCount === 1 ? 'tenant' : 'tenants'}</span>
                            </div>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Link
                              href={`/dashboard/admin/properties/${property.id}`}
                              className="px-3 py-1.5 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
