import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isPublicRegistrationOpen } from '@/lib/launch-config'
import { isMasterCoachEmail } from '@/lib/authz'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isPreLaunchBlockedPublicPath(pathname: string, searchParams: URLSearchParams, isProduction: boolean): boolean {
  if (pathname === '/auth/signup') {
    const coachInvite = searchParams.get('coach') || ''
    return !UUID_PATTERN.test(coachInvite)
  }
  // Keep public informational marketing routes (/packages, /corporate, /audit, /apply, /credentials, /apps)
  // browsable from the Founding Cohort splash screen while self-serve signup & Stripe checkout stay locked
  // server-side until Monday, Jan 4, 2027.
  if (
    pathname === '/async-coaching' ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/r/')
  ) {
    return true
  }
  if (isProduction && (pathname === '/preview' || pathname.startsWith('/preview/'))) {
    return true
  }
  return false
}

export async function proxy(request: NextRequest) {
  // IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser().
  // Cookie mutations must be applied before returning.
  let supabaseResponse = NextResponse.next({ request })

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const { pathname } = request.nextUrl

  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  let isValidUrl = false
  if (supabaseUrl) {
    try {
      const parsed = new URL(supabaseUrl)
      isValidUrl = parsed.protocol.startsWith('http')
    } catch {
      isValidUrl = false
    }
  }

  // Detect helper / companion requests (Capacitor iOS/Android, PWA standalone, or companion flags)
  const isCapacitorPlatform =
    request.headers.get('x-capacitor-platform') ||
    request.headers.get('x-app-platform') ||
    request.headers.get('x-companion-mode') ||
    (request.headers.get('user-agent') || '').includes('Capacitor')
  const searchParams = request.nextUrl.searchParams
  const isHelperQuery =
    searchParams.get('source') === 'pwa' ||
    searchParams.get('source') === 'native' ||
    searchParams.get('source') === 'helper' ||
    searchParams.get('mode') === 'companion' ||
    searchParams.get('mode') === 'helper'
  const isHelperCookie = request.cookies.get('gaa_helper_mode')?.value === '1'
  const isExplicitHelperRequest = Boolean(isCapacitorPlatform || isHelperQuery)
  const isHelperRequest = Boolean(isExplicitHelperRequest || isHelperCookie)

  if (
    process.env.NODE_ENV === 'production' &&
    (pathname.startsWith('/test-harness') || pathname.startsWith('/api/test-harness'))
  ) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl) {
    // Supabase is not configured — protect routes defensively by redirecting
    // unauthenticated requests to login without attempting an auth check.
    const isProtectedEnterprise = pathname.startsWith('/enterprise') && pathname !== '/enterprise/login'
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/coach') || isProtectedEnterprise) {
      const url = request.nextUrl.clone()
      url.pathname = isProtectedEnterprise ? '/enterprise/login' : '/auth/login'
      if (!isProtectedEnterprise && isHelperRequest) {
        url.searchParams.set('mode', 'companion')
      }
      return NextResponse.redirect(url)
    }
    if (
      !isPublicRegistrationOpen() &&
      isPreLaunchBlockedPublicPath(pathname, searchParams, process.env.NODE_ENV === 'production')
    ) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.search = '?waitlist=prelaunch'
      return NextResponse.redirect(url)
    }
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Persist helper mode cookie if this is a helper app session
  if (isHelperRequest && !isHelperCookie) {
    supabaseResponse.cookies.set('gaa_helper_mode', '1', {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
  }

  // 1. Route explicit helper launches away from the public homepage.
  if (pathname === '/' && isExplicitHelperRequest) {
    const url = request.nextUrl.clone()
    if (user) {
      url.pathname = '/dashboard/fitness'
      url.searchParams.set('source', 'helper')
      return NextResponse.redirect(url)
    } else {
      url.pathname = '/auth/login'
      url.searchParams.set('mode', 'companion')
      url.searchParams.set('next', '/dashboard/fitness')
      return NextResponse.redirect(url)
    }
  }

  // 1b. Enforce Pre-Launch Public Signup & Checkout Route Lockdown (bypasses Master Coach / staff)
  const isStaffCoach = Boolean(user?.email && isMasterCoachEmail(user.email))
  if (
    !isPublicRegistrationOpen() &&
    !isStaffCoach &&
    isPreLaunchBlockedPublicPath(pathname, searchParams, process.env.NODE_ENV === 'production')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = '?waitlist=prelaunch'
    return NextResponse.redirect(url)
  }

  // 2. Protect /dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    url.searchParams.set('next', pathname)
    if (isHelperRequest) {
      url.searchParams.set('mode', 'companion')
    }
    return NextResponse.redirect(url)
  }

  // 3. Protect /coach and /enterprise routes (excluding /enterprise/login)
  const isProtectedEnterprisePath = pathname.startsWith('/enterprise') && pathname !== '/enterprise/login'
  if ((pathname.startsWith('/coach') || isProtectedEnterprisePath) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = isProtectedEnterprisePath ? '/enterprise/login' : '/auth/login'
    if (!isProtectedEnterprisePath) {
      url.searchParams.set('next', pathname)
    }
    return NextResponse.redirect(url)
  }

  // Force password reset for accounts flagged by admin provisioning.
  // Verify server-authoritative sources (app_metadata & RLS-locked clients.must_reset_password)
  // in addition to user_metadata so a client cannot bypass the flag via updateUser().
  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/coach') || isProtectedEnterprisePath)) {
    let mustResetPassword =
      user.app_metadata?.must_reset_password === true ||
      user.user_metadata?.must_reset_password === true

    if (!mustResetPassword) {
      const { data: clientFlag } = await supabase
        .from('clients')
        .select('must_reset_password')
        .eq('id', user.id)
        .maybeSingle()
      if (clientFlag?.must_reset_password === true) {
        mustResetPassword = true
      }
    }

    if (mustResetPassword) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/reset-password'
      url.searchParams.set('required', '1')
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
