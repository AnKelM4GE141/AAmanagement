import { requireRole } from '@/lib/auth/helpers'
import BusinessProfileForm from '@/components/admin/settings/BusinessProfileForm'
import TeamMemberList from '@/components/admin/settings/TeamMemberList'

export default async function SettingsPage() {
  await requireRole(['admin'])

  return (
    <div className="max-w-4xl animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your business profile and team settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Business Profile Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">Business Profile</h2>
            <p className="mt-1 text-sm text-slate-600">
              Update your business information and branding
            </p>
          </div>
          <div className="px-6 py-6">
            <BusinessProfileForm />
          </div>
        </div>

        {/* Team Members Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">Team Members</h2>
            <p className="mt-1 text-sm text-slate-600">
              View all team members and their roles
            </p>
          </div>
          <div className="px-6 py-6">
            <TeamMemberList />
          </div>
        </div>
      </div>
    </div>
  )
}
