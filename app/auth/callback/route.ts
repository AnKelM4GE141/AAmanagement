import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Get user profile to determine redirect
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const dashboards = {
            admin: '/dashboard/admin',
            tenant: '/dashboard/tenant',
            applicant: '/dashboard/applicant',
          }
          return NextResponse.redirect(`${origin}${dashboards[profile.role as keyof typeof dashboards]}`)
        }
      }
    }
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_error`)
}
