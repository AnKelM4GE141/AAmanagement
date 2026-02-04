import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import Link from 'next/link'

export default async function ApplicantDashboard() {
  const profile = await requireRole(['applicant'])
  const supabase = await createClient()

  // Fetch applicant's contracts (all non-draft statuses for signing, plus drafts to show "being prepared")
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, status, signing_token, document_file_name, signed_at, sent_at, properties!property_id(address, name)')
    .eq('applicant_id', profile.id)
    .order('created_at', { ascending: false })

  // Look up the contact linked to this user
  const { data: contactRecord } = await supabase
    .from('contacts')
    .select('id')
    .eq('user_id', profile.id)
    .single()

  // Fetch latest opportunity for this applicant via contacts table
  let opportunities: any[] | null = null
  if (contactRecord) {
    const { data } = await supabase
      .from('opportunities')
      .select('id, stage, stage_id, pipeline_stages!stage_id(name)')
      .eq('contact_id', contactRecord.id)
      .order('created_at', { ascending: false })
      .limit(1)
    opportunities = data
  } else {
    // Fallback: try legacy_user_contact_id for pre-migration data
    const { data } = await supabase
      .from('opportunities')
      .select('id, stage, stage_id, pipeline_stages!stage_id(name)')
      .eq('legacy_user_contact_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(1)
    opportunities = data
  }

  const latestOpportunity = opportunities?.[0] || null
  const rawStage = (latestOpportunity as any)?.pipeline_stages?.name
    || latestOpportunity?.stage
    || null
  // Normalize to lowercase for comparisons
  const opportunityStage = rawStage?.toLowerCase().replace(/\s+/g, '_') || null
  // Display name with proper casing
  const opportunityStageDisplay = rawStage
    ? rawStage.split(/[\s_]+/).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : null

  const isApproved = opportunityStage === 'approved' || opportunityStage === 'lease_signed' || opportunityStage === 'moved_in'

  const pendingContracts = (contracts || []).filter(
    (c: any) => c.status === 'sent' || c.status === 'viewed'
  )
  const signedContracts = (contracts || []).filter((c: any) => c.status === 'signed')
  const draftContracts = (contracts || []).filter((c: any) => c.status === 'draft')
  const hasContracts = (contracts || []).length > 0

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome, {profile.full_name}
        </h1>
        <p className="text-gray-600 mt-1">Applicant Portal</p>
      </div>

      {/* Pending Contracts - ready to sign */}
      {pendingContracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingContracts.map((contract: any) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-blue-900">
                      You have a lease agreement to sign
                    </p>
                    <p className="text-sm text-blue-700 mt-0.5">
                      {contract.document_file_name}
                      {contract.properties?.address && ` — ${contract.properties.address}`}
                    </p>
                  </div>
                  <Link
                    href={`/sign/${contract.signing_token}`}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-shrink-0 ml-4"
                  >
                    Review & Sign
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Application Status */}
      <Card>
        <CardHeader>
          <CardTitle>Application Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            {signedContracts.length > 0 ? (
              <>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  Lease Signed
                </div>
                <p className="text-gray-600 mb-2">Your lease has been signed</p>
                <p className="text-sm text-gray-500">
                  Signed on {new Date(signedContracts[0].signed_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </>
            ) : pendingContracts.length > 0 ? (
              <>
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
                  Ready to Sign
                </div>
                <p className="text-gray-600 mb-2">Your lease agreement is ready for signing</p>
                <p className="text-sm text-gray-500">
                  Please review and sign your lease above
                </p>
              </>
            ) : isApproved ? (
              <>
                <div className="inline-block px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium mb-4">
                  Application Approved
                </div>
                <p className="text-gray-600 mb-2">Your application has been approved</p>
                <p className="text-sm text-gray-500">
                  {draftContracts.length > 0
                    ? 'Your lease agreement is being prepared and will be ready for signing soon'
                    : 'Your lease agreement will be prepared shortly'}
                </p>
              </>
            ) : (
              <>
                <div className="inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium mb-4">
                  {opportunityStageDisplay || 'Pending Review'}
                </div>
                <p className="text-gray-600 mb-2">Your application is being reviewed</p>
                <p className="text-sm text-gray-500">
                  You will be notified once your application has been processed
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Application Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm">
            <p className="text-gray-900">{profile.full_name}</p>
            <p className="text-gray-600">{profile.email}</p>
            {profile.phone && <p className="text-gray-600">{profile.phone}</p>}
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
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  isApproved || hasContracts ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {isApproved || hasContracts ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : '1'}
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Application Review</h4>
                <p className="text-sm text-gray-600">
                  {isApproved || hasContracts
                    ? 'Your application has been approved'
                    : 'Your application is currently being reviewed by the property manager'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  signedContracts.length > 0
                    ? 'bg-green-100 text-green-600'
                    : pendingContracts.length > 0 || (isApproved && hasContracts)
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {signedContracts.length > 0 ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  ) : '2'}
                </div>
              </div>
              <div className={`ml-4 ${!isApproved && !hasContracts ? 'opacity-50' : ''}`}>
                <h4 className="text-sm font-medium text-gray-900">Lease Signing</h4>
                <p className="text-sm text-gray-600">
                  {signedContracts.length > 0
                    ? 'Lease signed successfully'
                    : pendingContracts.length > 0
                    ? 'Your lease is ready for signing'
                    : draftContracts.length > 0
                    ? 'Your lease is being prepared'
                    : isApproved
                    ? 'Your lease agreement will be sent to you soon'
                    : 'Review and sign your lease agreement'}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`flex items-center justify-center h-8 w-8 rounded-full text-sm font-medium ${
                  signedContracts.length > 0 ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  3
                </div>
              </div>
              <div className={`ml-4 ${signedContracts.length === 0 ? 'opacity-50' : ''}`}>
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
          <p className="text-sm text-gray-600">
            Have questions about your application? Contact your property manager for assistance.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
