import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { VIEW_AS_COOKIE } from '@/lib/auth/view-as'
import { UserRole } from '@/lib/types/user'

const VALID_ROLES: UserRole[] = ['tenant', 'applicant']

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body as { role: UserRole | null }

    // Clear impersonation — go back to admin
    if (!role || role === 'admin') {
      const response = NextResponse.json({ redirect: '/dashboard/admin' })
      response.cookies.delete(VIEW_AS_COOKIE)
      return response
    }

    // Validate the requested role
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Set the view-as cookie
    const response = NextResponse.json({ redirect: `/dashboard/${role}` })
    response.cookies.set(VIEW_AS_COOKIE, role, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 8, // 8 hours
    })

    return response
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
