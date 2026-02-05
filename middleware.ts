import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request)

  const path = request.nextUrl.pathname

  // Public routes that don't require authentication
  const publicRoutes = ['/auth/login', '/auth/signup', '/auth/callback', '/']
  const isPublicRoute = publicRoutes.includes(path) || path.startsWith('/auth/invite/')

  // If not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    const redirectUrl = new URL('/auth/login', request.url)
    redirectUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(redirectUrl)
  }

  // If authenticated and trying to access auth pages, redirect to dashboard
  if (user && (path === '/auth/login' || path === '/auth/signup')) {
    // Fetch user role from headers or make a request
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    // We need to get the user's role to redirect properly
    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users_profile?id=eq.${user.id}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (profileResponse.ok) {
      const profiles = await profileResponse.json()
      if (profiles && profiles.length > 0) {
        const role = profiles[0].role
        const dashboards = {
          admin: '/dashboard/admin',
          tenant: '/dashboard/tenant',
          applicant: '/dashboard/applicant',
        }
        return NextResponse.redirect(new URL(dashboards[role as keyof typeof dashboards], request.url))
      }
    }
  }

  // Role-based access control for dashboard routes
  if (user && path.startsWith('/dashboard/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const profileResponse = await fetch(`${supabaseUrl}/rest/v1/users_profile?id=eq.${user.id}`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    })

    if (profileResponse.ok) {
      const profiles = await profileResponse.json()
      if (profiles && profiles.length > 0) {
        const userRole = profiles[0].role

        // Admin "View As" — let admins access other dashboards when impersonating
        const viewAsRole = request.cookies.get('aa-view-as')?.value
        const effectiveRole =
          userRole === 'admin' && (viewAsRole === 'tenant' || viewAsRole === 'applicant')
            ? viewAsRole
            : userRole

        // Check if user is accessing their correct dashboard
        if (path.startsWith('/dashboard/admin') && userRole !== 'admin') {
          return NextResponse.redirect(new URL(`/dashboard/${userRole}`, request.url))
        }
        if (path.startsWith('/dashboard/tenant') && effectiveRole !== 'tenant') {
          return NextResponse.redirect(new URL(`/dashboard/${effectiveRole}`, request.url))
        }
        if (path.startsWith('/dashboard/applicant') && effectiveRole !== 'applicant') {
          return NextResponse.redirect(new URL(`/dashboard/${effectiveRole}`, request.url))
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
