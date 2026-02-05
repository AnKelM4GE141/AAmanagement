import { cookies } from 'next/headers'
import { UserRole } from '@/lib/types/user'

export const VIEW_AS_COOKIE = 'aa-view-as'

const VALID_VIEW_ROLES: UserRole[] = ['tenant', 'applicant']

/**
 * Read the "view as" cookie and return the role being impersonated,
 * or null if no impersonation is active.
 */
export async function getViewAsRole(): Promise<UserRole | null> {
  const cookieStore = await cookies()
  const value = cookieStore.get(VIEW_AS_COOKIE)?.value as UserRole | undefined
  if (value && VALID_VIEW_ROLES.includes(value)) {
    return value
  }
  return null
}

/**
 * For an admin user, returns the impersonated role if the cookie is set,
 * otherwise returns their actual role. Non-admins always get their actual role.
 */
export async function getEffectiveRole(actualRole: UserRole): Promise<UserRole> {
  if (actualRole !== 'admin') return actualRole
  const viewAs = await getViewAsRole()
  return viewAs ?? actualRole
}
