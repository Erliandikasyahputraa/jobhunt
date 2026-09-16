import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { fetchWithTimeout } from '@/lib/utils/network-guard'
import { isAuthError, isNetworkError, isTimeoutError } from '@/lib/utils/error-handler'

/**
 * Checks whether a given path is public and does not require authentication.
 */
export function isPublicRoute(pathname: string): boolean {
  return (
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/auth')
  )
}

/**
 * Safely clears only Supabase authentication cookies without touching unrelated cookies.
 * Matches default Supabase SSR cookie patterns:
 * - sb-<project-ref>-auth-token
 * - sb-<project-ref>-auth-token.<chunk>
 * - sb-access-token
 * - sb-refresh-token
 */
export function clearAuthCookies(request: NextRequest, response: NextResponse): void {
  const allCookies = request.cookies.getAll()
  for (const cookie of allCookies) {
    const name = cookie.name
    if (
      name.startsWith('sb-') &&
      (name.includes('-auth-token') ||
        name.endsWith('-token') ||
        name.includes('-access-token') ||
        name.includes('-refresh-token'))
    ) {
      response.cookies.delete(name)
    }
  }
}

export async function updateSession(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl
  const error = searchParams.get('error')

  // Handle OAuth errors (preserve query error on /login)
  if (error) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('error', error)
    loginUrl.searchParams.delete('code')
    return NextResponse.redirect(loginUrl)
  }

  // Create response object that we'll modify with session cookies
  const response = NextResponse.next({
    request,
  })

  // Create Supabase client with timeout guard and cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: fetchWithTimeout,
      },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  let authError: unknown = null

  // Defensive auth token validation with Supabase Auth
  try {
    const { data, error: userError } = await supabase.auth.getUser()
    if (userError) {
      authError = userError
    } else {
      user = data.user
    }
  } catch (err: unknown) {
    authError = err
  }

  const isPublic = isPublicRoute(pathname)

  // 1. Authenticated User Flow
  if (user) {
    // Prevent authenticated users from visiting auth pages (login/signup)
    if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.pathname = '/dashboard'
      return NextResponse.redirect(dashboardUrl)
    }
    return response
  }

  // 2. Public Route Flow (Unauthenticated or Errored)
  if (isPublic) {
    // If there was an expired/corrupt auth token on a public route, clean stale cookies
    if (authError && isAuthError(authError)) {
      clearAuthCookies(request, response)
    }
    // Allow guest access without any redirect loop
    return response
  }

  // 3. Protected Route Flow (User is unauthenticated or error occurred)
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/login'

  if (authError) {
    if (isTimeoutError(authError)) {
      // Network timeout: do not delete cookies, notify about slow connection
      redirectUrl.searchParams.set('reason', 'timeout')
      return NextResponse.redirect(redirectUrl)
    }

    if (isNetworkError(authError)) {
      // Infrastructure/DNS error: do not delete cookies, notify about connection issue
      redirectUrl.searchParams.set('reason', 'network_error')
      return NextResponse.redirect(redirectUrl)
    }

    // Genuine auth/session invalidation (e.g. invalid refresh token)
    redirectUrl.searchParams.set('reason', 'expired')
    const redirectResponse = NextResponse.redirect(redirectUrl)
    clearAuthCookies(request, redirectResponse)
    return redirectResponse
  }

  // Normal unauthenticated access to protected route
  return NextResponse.redirect(redirectUrl)
}
