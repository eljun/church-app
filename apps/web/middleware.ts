/**
 * Middleware for authentication and session refresh
 * Runs on every request to protected routes
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessModule } from '@/lib/rbac'
import type { UserRole } from '@/lib/rbac'
import type { ModuleName } from '@/lib/rbac'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protected routes - redirect to login if not authenticated
  const protectedPaths = ['/', '/members', '/churches', '/transfers', '/reports', '/settings']
  const isProtectedPath = protectedPaths.some(path =>
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check user status and role-based access control
  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    // Block deactivated users - sign them out and redirect to login
    if (userData && userData.is_active === false) {
      await supabase.auth.signOut()
      const response = NextResponse.redirect(new URL('/login?deactivated=true', request.url))
      response.cookies.delete('sb-access-token')
      response.cookies.delete('sb-refresh-token')
      return response
    }

    // Role-based module access control
    if (userData?.role) {
      const pathname = request.nextUrl.pathname
      const userRole = userData.role as UserRole

      // Map routes to modules
      const routeToModule: Record<string, ModuleName> = {
        '/': 'dashboard',
        '/members': 'members',
        '/visitors': 'visitors',
        '/churches': 'churches',
        '/events': 'events',
        '/attendance': 'attendance',
        '/transfers': 'transfers',
        '/calendar': 'calendar',
        '/reports': 'reports',
        '/missionary-reports': 'missionary-reports',
        '/settings': 'settings',
      }

      // Find the module for current route
      let module: ModuleName | null = null
      for (const [route, moduleName] of Object.entries(routeToModule)) {
        if (pathname === route || pathname.startsWith(route + '/')) {
          module = moduleName
          break
        }
      }

      // Check if user has access to this module
      if (module && !canAccessModule(userRole, module)) {
        // Redirect to their default landing page based on role
        const defaultPages: Record<UserRole, string> = {
          superadmin: '/',
          field_secretary: '/',
          pastor: '/',
          church_secretary: '/',
          coordinator: '/events',
          bibleworker: '/',
        }

        const defaultPage = defaultPages[userRole] || '/'
        if (pathname !== defaultPage) {
          return NextResponse.redirect(new URL(defaultPage, request.url))
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
