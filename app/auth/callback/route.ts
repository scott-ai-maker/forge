import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import type { EmailOtpType } from '@supabase/supabase-js'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function normalizeCoachId(value: string | null) {
  if (!value) return null
  return UUID_PATTERN.test(value) ? value : null
}

function getSafeRedirectUrl(nextParam: string | null, origin: string): URL {
  if (!nextParam) return new URL('/dashboard', origin)
  const trimmed = nextParam.trim()
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    try {
      const candidate = new URL(trimmed, origin)
      if (candidate.origin === origin) {
        return candidate
      }
    } catch {
      // Fall through to fallback
    }
  }
  return new URL('/dashboard', origin)
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const requestedCoachId = normalizeCoachId(searchParams.get('coach'))
  const nextParam = searchParams.get('next')

  // Handle OAuth provider errors returned in callback URL (e.g. access_denied, user cancellation, misconfiguration)
  const oauthError = searchParams.get('error')
  const oauthErrorCode = searchParams.get('error_code')
  const oauthErrorDescription = searchParams.get('error_description')

  if (oauthError || oauthErrorCode || oauthErrorDescription) {
    const errorMsg = oauthErrorDescription || oauthError || 'Authentication failed'
    const loginUrl = new URL('/auth/login', origin)
    loginUrl.searchParams.set('error', errorMsg)
    if (nextParam) loginUrl.searchParams.set('next', nextParam)
    return NextResponse.redirect(loginUrl.toString())
  }

  const redirectUrl = getSafeRedirectUrl(nextParam, origin)
  const isRecoveryResetRedirect = Boolean(tokenHash && type === 'recovery' && redirectUrl.pathname === '/auth/reset-password')
  let keepRecoveryTokenOnRedirect = false

  // Create the redirect response first so we can write session cookies directly onto it.
  // cookies() from next/headers does NOT merge into NextResponse objects returned from
  // Route Handlers, so any session set via that path would be silently dropped.
  const response = NextResponse.redirect(redirectUrl.toString())

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
    supabaseUrl = `https://${supabaseUrl}`
  }

  const supabase = createServerClient(
    supabaseUrl,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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

  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      console.error('OAuth code exchange error:', exchangeError)
      const loginUrl = new URL('/auth/login', origin)
      loginUrl.searchParams.set('error', exchangeError.message)
      if (nextParam) loginUrl.searchParams.set('next', nextParam)
      return NextResponse.redirect(loginUrl.toString())
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    })

    // Only preserve token params for client-side retry when server-side verification fails.
    if (error && isRecoveryResetRedirect) {
      keepRecoveryTokenOnRedirect = true
    }
  }

  if (keepRecoveryTokenOnRedirect && tokenHash && type) {
    redirectUrl.searchParams.set('token_hash', tokenHash)
    redirectUrl.searchParams.set('type', type)
  }

  if (type === 'email_change') {
    redirectUrl.searchParams.set('email_updated', '1')
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const admin = supabaseAdmin()
    const rawFullName = (
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      [user.user_metadata?.given_name, user.user_metadata?.family_name].filter(Boolean).join(' ') ||
      ''
    ).toString().trim()
    const displayName = rawFullName.length > 0 ? rawFullName : null

    const userEmail = (user.email ?? '').toLowerCase().trim()
    const isMasterCoach = userEmail === 'scott.gordon72@outlook.com'
    const { data: existingProfile } = await admin
      .from('clients')
      .select('id, role, avatar_path')
      .eq('id', user.id)
      .maybeSingle()

    let resolvedRole: 'coach' | 'client' = isMasterCoach ? 'coach' : 'client'

    if (existingProfile) {
      resolvedRole = (isMasterCoach || existingProfile.role === 'coach') ? 'coach' : 'client'
      // Refresh profile fields for existing accounts
      await admin
        .from('clients')
        .update({
          email: userEmail || user.email || '',
          full_name: displayName,
          ...(isMasterCoach ? { role: 'coach' } : {}),
        })
        .eq('id', user.id)

      if (user.user_metadata?.surface_role !== resolvedRole) {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata ?? {}),
            surface_role: resolvedRole,
          },
        })
      }
    } else {
      // Create first-time profiles as clients (or coach if master coach) without mutating pre-existing rows.
      await admin
        .from('clients')
        .upsert(
          {
            id: user.id,
            email: userEmail || user.email || '',
            full_name: displayName,
            avatar_path: null,
            role: resolvedRole,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        )

      if (user.user_metadata?.surface_role !== resolvedRole) {
        await admin.auth.admin.updateUserById(user.id, {
          user_metadata: {
            ...(user.user_metadata ?? {}),
            surface_role: resolvedRole,
          },
        })
      }
    }

    if (requestedCoachId) {
      const { data: coach } = await admin
        .from('clients')
        .select('id')
        .eq('id', requestedCoachId)
        .eq('role', 'coach')
        .maybeSingle()

      if (coach) {
        await admin
          .from('clients')
          .update({ designated_coach_id: coach.id })
          .eq('id', user.id)
          .eq('role', 'client')
          .is('designated_coach_id', null)
      }
    }

    // Role-aware redirect: If a coach logs in and target was default (/dashboard), redirect to /coach
    if (resolvedRole === 'coach' && (!nextParam || redirectUrl.pathname === '/dashboard')) {
      const coachRedirect = NextResponse.redirect(new URL('/coach', origin).toString())
      response.cookies.getAll().forEach(cookie => {
        coachRedirect.cookies.set(cookie.name, cookie.value, cookie)
      })
      return coachRedirect
    }
  }

  return response
}
