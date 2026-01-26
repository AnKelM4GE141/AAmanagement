import { requireRole } from '@/lib/auth/helpers'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'

export default async function ApplicantDashboard() {
  const profile = await requireRole(['applicant'])

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-gray-600 mt-1">Applicant Portal</p>
      </div>

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
              Pending Review
            </div>
            <p className="text-gray-600 mb-2">Your application is being reviewed</p>
            <p className="text-sm text-gray-500">
              You will be notified once your application has been processed
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Application</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Contact Information</label>
              <div className="mt-2 space-y-1 text-sm">
                <p className="text-gray-900">{profile.full_name}</p>
                <p className="text-gray-600">{profile.email}</p>
                {profile.phone && <p className="text-gray-600">{profile.phone}</p>}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Application submission and tracking features coming in Phase 2
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600">
                  1
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Application Review</h4>
                <p className="text-sm text-gray-600">
                  Your application is currently being reviewed by the property manager
                </p>
              </div>
            </div>

            <div className="flex items-start opacity-50">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600">
                  2
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Background Check</h4>
                <p className="text-sm text-gray-600">
                  Complete required background and credit checks
                </p>
              </div>
            </div>

            <div className="flex items-start opacity-50">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600">
                  3
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Lease Signing</h4>
                <p className="text-sm text-gray-600">
                  Review and sign your lease agreement
                </p>
              </div>
            </div>

            <div className="flex items-start opacity-50">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gray-100 text-gray-600">
                  4
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Move-In</h4>
                <p className="text-sm text-gray-600">
                  Complete move-in process and receive keys
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Have questions about your application? Contact your property manager for assistance.
          </p>
          <button className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg cursor-not-allowed text-sm">
            Message Property Manager (Coming in Phase 5)
          </button>
        </CardContent>
      </Card>
    </div>
  )
}
