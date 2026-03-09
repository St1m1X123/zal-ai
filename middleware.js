import { NextResponse } from 'next/server'
import { createMiddlewareClient } from './lib/supabase-server'

export async function middleware(request) {
    const { pathname } = request.nextUrl
    const response = NextResponse.next()

    // Create SSR Supabase client that reads session from cookies
    const supabase = createMiddlewareClient(request, response)

    // Get current session
    const { data: { session } } = await supabase.auth.getSession()

    // ── 1. Not logged in ──────────────────────────────────────────
    // Allow only the landing page and auth routes
    if (!session) {
        if (
            pathname === '/' ||
            pathname.startsWith('/auth') ||
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api')
        ) {
            return response
        }
        return NextResponse.redirect(new URL('/', request.url))
    }

    // ── 2. Logged in — check if profile exists ────────────────────
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle()

    const hasProfile = !!profile

    // No profile yet → force /onboarding (except /auth routes)
    if (!hasProfile) {
        if (pathname === '/onboarding' || pathname.startsWith('/auth') || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
            return response
        }
        return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Has profile → don't let them back to /onboarding
    if (hasProfile && pathname === '/onboarding') {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    // Run middleware on all routes except Next.js internals and static files
    matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)'],
}
