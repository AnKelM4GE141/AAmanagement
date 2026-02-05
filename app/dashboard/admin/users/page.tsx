import { requireRole } from '@/lib/auth/helpers'
import { createClient } from '@/lib/supabase/server'
import Card, { CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import InviteUserForm from '@/components/admin/InviteUserForm'
import UserRoleSelect from '@/components/admin/UserRoleSelect'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  await requireRole(['admin'])

  const supabase = await createClient()

  // Get current user ID
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const currentUserId = currentUser?.id

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from('users_profile')
    .select('*')
    .order('created_at', { ascending: false })

  // Fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('user_invitations')
    .select('*')
    .is('accepted_at', null)
    .order('created_at', { ascending: false })

  const roleColors = {
    admin: 'bg-purple-100 text-purple-800',
    tenant: 'bg-primary-100 text-primary-800',
    applicant: 'bg-green-100 text-green-800',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
        <p className="text-slate-600 mt-1">Manage users and send invitations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invite User Form */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Invite New User</CardTitle>
            </CardHeader>
            <CardContent>
              <InviteUserForm />
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>All Users ({users?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {usersError && (
                <div className="text-red-600 text-sm">Error loading users</div>
              )}

              {users && users.length === 0 && (
                <p className="text-slate-600 text-sm">No users found</p>
              )}

              {users && users.length > 0 && (
                <div className="space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-slate-900">
                            {user.full_name}
                          </h3>
                        </div>
                        <p className="text-sm text-slate-600">{user.email}</p>
                        {user.phone && (
                          <p className="text-sm text-slate-600">{user.phone}</p>
                        )}
                      </div>
                      <UserRoleSelect
                        userId={user.id}
                        currentRole={user.role as 'admin' | 'tenant' | 'applicant'}
                        userName={user.full_name}
                        isOwner={user.is_owner}
                        currentUserId={currentUserId}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Invitations */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {invitationsError && (
                <div className="text-red-600 text-sm">Error loading invitations</div>
              )}

              {invitations && invitations.length === 0 && (
                <p className="text-slate-600 text-sm">No pending invitations</p>
              )}

              {invitations && invitations.length > 0 && (
                <div className="space-y-3">
                  {invitations.map((invite) => {
                    const expiresAt = new Date(invite.expires_at)
                    const isExpired = expiresAt < new Date()

                    return (
                      <div
                        key={invite.id}
                        className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg"
                      >
                        <div className="flex-1">
                          <h3 className="font-medium text-slate-900">{invite.email}</h3>
                          <p className="text-sm text-slate-600">
                            {isExpired ? (
                              <span className="text-red-600">Expired</span>
                            ) : (
                              <>
                                Expires{' '}
                                {expiresAt.toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </>
                            )}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            roleColors[invite.role as keyof typeof roleColors]
                          }`}
                        >
                          {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                        </span>
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
