import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { supabaseAdmin } from '@/lib/supabase'
import { isMasterCoachEmail } from '@/lib/authz'
import type { EmailOtpType } from '@supabase/supabase-js'
import { attributeReferralSignup, getOrCreateClientReferralCode } from '@/lib/referrals'
import {
  checkClientLegalConsentGate,
  extractRequestIp,
  isValidLegalSignature,
  recordLegalConsentAudit,
} from '@/lib/legal-compliance'
import { isPublicRegistrationOpen } from '@/lib/launch-config'

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

  const requestedPlanRaw = (searchParams.get('plan') || '').trim().toLowerCase()
  const validPlanParam =
    requestedPlanRaw === 'core_lab' ||
    requestedPlanRaw === 'plus' ||
    requestedPlanRaw === 'coach_support'
      ? requestedPlanRaw
      : null

  const effectiveNextParam =
    (!nextParam || nextParam === '/dashboard') && validPlanParam && isPublicRegistrationOpen()
      ? `/packages?plan=${validPlanParam}#memberships`
      : nextParam

  const redirectUrl = getSafeRedirectUrl(effectiveNextParam, origin)
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
    // Never trust client-writable user_metadata.surface_role; derive coach authority strictly from DB or Master Coach allowlist.
    const isMasterCoach = isMasterCoachEmail(user.email)
    const { data: existingProfile } = await admin
      .from('clients')
      .select('id, role, avatar_path')
      .eq('id', user.id)
      .maybeSingle()

    const resolvedRole: 'coach' | 'client' =
      isMasterCoach || existingProfile?.role === 'coach' ? 'coach' : 'client'

    if (existingProfile) {
      // Refresh profile fields for existing accounts
      await admin
        .from('clients')
        .update({
          email: userEmail || user.email || '',
          full_name: displayName,
          ...(resolvedRole === 'coach' ? { role: 'coach' } : {}),
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

      if (
        user.user_metadata?.legal_terms_accepted === true &&
        user.user_metadata?.legal_callback_logged !== true
      ) {
        const healthAccepted = user.user_metadata?.health_biometric_consented === true
        const auditRes = await recordLegalConsentAudit({
          adminClient: admin,
          userId: user.id,
          documentTypes: [
            'terms_of_service',
            'privacy_policy',
            ...(healthAccepted ? (['consumer_health_biometric_policy'] as const) : []),
          ],
          typedSignature: null,
          ipAddress: extractRequestIp(request.headers),
          userAgent: request.headers.get('user-agent'),
          consentedAt:
            typeof user.user_metadata?.legal_consented_at === 'string'
              ? user.user_metadata.legal_consented_at
              : new Date().toISOString(),
          metadata: {
            flow: 'signup_clickwrap_callback',
            ageVerified18Plus: true,
            healthBiometricConsented: healthAccepted,
          },
        })
        if (!auditRes.error) {
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata ?? {}),
              surface_role: resolvedRole,
              legal_callback_logged: true,
            },
          })
        }
      }
    } else {
      // Pre-launch defense-in-depth: block uninvited new public OAuth/auth registrations until Jan 4, 2027
      let hasVerifiedCoachInvite = false
      if (requestedCoachId) {
        const { data: validCoach } = await admin
          .from('clients')
          .select('id')
          .eq('id', requestedCoachId)
          .eq('role', 'coach')
          .maybeSingle()
        hasVerifiedCoachInvite = Boolean(validCoach?.id)
      }

      const enforcePrelaunchSignupLock =
        process.env.ENFORCE_PRELAUNCH_SIGNUP_LOCK === 'true' ||
        process.env.NODE_ENV === 'production' ||
        process.env.VERCEL_ENV === 'production'

      if (
        enforcePrelaunchSignupLock &&
        !isMasterCoach &&
        !hasVerifiedCoachInvite &&
        !isPublicRegistrationOpen()
      ) {
        if (typeof supabase.auth.signOut === 'function') {
          await supabase.auth.signOut()
        }
        try {
          await admin.auth.admin.deleteUser(user.id)
        } catch {
          // Non-fatal cleanup
        }
        const blockedUrl = new URL('/auth/login', origin)
        blockedUrl.searchParams.set(
          'error',
          'Public enrollment opens Monday, January 4, 2027. Join the Founding Cohort waitlist on our homepage.'
        )
        return NextResponse.redirect(blockedUrl.toString())
      }

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

      if (
        user.user_metadata?.legal_terms_accepted === true &&
        user.user_metadata?.legal_callback_logged !== true
      ) {
        const healthAccepted = user.user_metadata?.health_biometric_consented === true
        const auditRes = await recordLegalConsentAudit({
          adminClient: admin,
          userId: user.id,
          documentTypes: [
            'terms_of_service',
            'privacy_policy',
            ...(healthAccepted ? (['consumer_health_biometric_policy'] as const) : []),
          ],
          typedSignature: null,
          ipAddress: extractRequestIp(request.headers),
          userAgent: request.headers.get('user-agent'),
          consentedAt:
            typeof user.user_metadata?.legal_consented_at === 'string'
              ? user.user_metadata.legal_consented_at
              : new Date().toISOString(),
          metadata: {
            flow: 'signup_clickwrap_callback',
            ageVerified18Plus: true,
            healthBiometricConsented: healthAccepted,
          },
        })
        if (!auditRes.error) {
          await admin.auth.admin.updateUserById(user.id, {
            user_metadata: {
              ...(user.user_metadata ?? {}),
              surface_role: resolvedRole,
              legal_callback_logged: true,
            },
          })
        }
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

    const rawReferral =
      searchParams.get('ref') ||
      searchParams.get('referral') ||
      request.cookies.get('forge_referral_code')?.value

    if (!existingProfile) {
      try {
        const { suppressOnAccountActivated } = await import('@/lib/automations/launchSequence')
        await suppressOnAccountActivated(admin, {
          userId: user.id,
          email: userEmail || user.email || null,
        })
      } catch (err) {
        console.warn('[auth:callback] Account activation suppression warning:', err)
      }
    }

    if (rawReferral && !existingProfile) {
      try {
        await attributeReferralSignup(admin, {
          code: rawReferral,
          refereeId: user.id,
          refereeEmail: userEmail,
          refereeFirstName: displayName,
          source: 'signup_callback',
        })
      } catch (err) {
        console.warn('[auth:callback] Referral attribution warning:', err)
      }
    }

    // Provision user's own referral code so they can invite friends immediately
    try {
      await getOrCreateClientReferralCode(admin, user.id, displayName)
    } catch (err) {
      console.warn('[auth:callback] Referral code provisioning warning:', err)
    }

    // Role-aware redirect: If a coach logs in and target was default (/dashboard), redirect to /coach
    if (resolvedRole === 'coach' && (!nextParam || redirectUrl.pathname === '/dashboard')) {
      const coachRedirect = NextResponse.redirect(new URL('/coach', origin).toString())
      response.cookies.getAll().forEach(cookie => {
        coachRedirect.cookies.set(cookie.name, cookie.value, cookie)
      })
      return coachRedirect
    }

    // Close OAuth zero-clickwrap bypass: if an authenticated client signed in via Google/Apple
    // on /auth/login without having executed Terms of Service + Athletic Liability Waiver,
    // route them to onboarding/consent before granting access to training dashboards.
    if (resolvedRole === 'client' && !isRecoveryResetRedirect) {
      const consentGate = await checkClientLegalConsentGate(admin, user.id, {
        requireTermsOfService: true,
        requireLiabilityWaiver: true,
      })
      if (!consentGate.verified) {
        const mandatoryConsentUrl = new URL('/dashboard', origin)
        mandatoryConsentUrl.searchParams.set('requireConsent', '1')
        const consentRedirect = NextResponse.redirect(mandatoryConsentUrl.toString())
        response.cookies.getAll().forEach(cookie => {
          consentRedirect.cookies.set(cookie.name, cookie.value, cookie)
        })
        return consentRedirect
      }
    }
  }

  return response
}
