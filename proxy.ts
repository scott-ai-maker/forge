import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
  const isHelperRequest = Boolean(isCapacitorPlatform || isHelperQuery || isHelperCookie)

  if (!supabaseUrl || !supabaseAnonKey || !isValidUrl) {
    // Supabase is not configured — protect routes defensively by redirecting
    // unauthenticated requests to login without attempting an auth check.
    if (pathname.startsWith('/dashboard') || pathname.startsWith('/coach')) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      if (isHelperRequest) {
        url.searchParams.set('mode', 'companion')
      }
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
      sameSite: 'lax',
    })
  }

  // 1. Root route guard for helper apps:
  // When running inside a helper app (PWA, iOS, Android), root '/' should NEVER display
  // the marketing website. Instead route directly to workout execution or companion login.
  if (pathname === '/' && isHelperRequest) {
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

  // 2. Protect /dashboard routes
  if (pathname.startsWith('/dashboard') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    if (isHelperRequest) {
      url.searchParams.set('mode', 'companion')
    }
    return NextResponse.redirect(url)
  }

  // 3. Protect /coach routes
  if (pathname.startsWith('/coach') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Force password reset for accounts flagged by admin provisioning.
  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/coach'))) {
    if (user.user_metadata?.must_reset_password === true) {
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
