import { type NextRequest, NextResponse } from 'next/server'
import { updateSession, isPublicRoute } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  try {
    return await updateSession(request)
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled error in middleware updateSession:', error)
    }

    // Defensive fallback: if public route, allow pass-through; if protected, redirect cleanly to /login
    if (isPublicRoute(request.nextUrl.pathname)) {
      return NextResponse.next()
    }

    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('reason', 'expired')
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  // Use Node.js runtime for full API support and Supabase SSR compatibility
  runtime: 'nodejs',

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
