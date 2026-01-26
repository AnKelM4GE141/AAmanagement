export type UserRole = 'admin' | 'tenant' | 'applicant'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string | null
  role: UserRole
  is_owner: boolean
  invited_by: string | null
  created_at: string
  updated_at: string
}

export interface UserInvitation {
  id: string
  email: string
  invited_by: string
  role: UserRole
  token: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}
