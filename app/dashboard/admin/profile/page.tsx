import { requireRole } from '@/lib/auth/helpers'
import ProfileForm from '@/components/admin/profile/ProfileForm'

export default async function ProfilePage() {
  const profile = await requireRole(['admin'])

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your personal account settings
        </p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-6">
          <ProfileForm
            initialFullName={profile.full_name}
            initialEmail={profile.email}
            initialPhone={profile.phone || ''}
            initialAvatarUrl={profile.avatar_url || null}
          />
        </div>
      </div>
    </div>
  )
}
