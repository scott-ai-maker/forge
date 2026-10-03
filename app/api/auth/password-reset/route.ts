import { NextRequest, NextResponse } from 'next/server'
import { sendPasswordResetEmail, getMissingEmailConfigKeys } from '@/lib/marketing-email'
import { supabaseAdmin } from '@/lib/supabase'
import { getTrustedAppBaseUrl } from '@/lib/app-base-url'
import { detectEmailTypo } from '@/lib/email-validation'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

function getBaseUrl(req: NextRequest) {
  if (process.env.EMAIL_LINK_BASE_URL?.trim()) {
    return process.env.EMAIL_LINK_BASE_URL.trim().replace(/\/+$/, '')
  }
  void req
  return getTrustedAppBaseUrl()
}

function parseEmail(body: unknown) {
  if (typeof body !== 'object' || body === null) return null
  const email = (body as Record<string, unknown>).email
  if (typeof email !== 'string') return null
  const normalized = email.trim().toLowerCase()
  return EMAIL_REGEX.test(normalized) ? normalized : null
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const email = parseEmail(body)

  // Return a generic success for invalid input to avoid account enumeration.
  if (!email) {
    return NextResponse.json({ success: true })
  }

  const typoCheck = detectEmailTypo(email)
  if (typoCheck.hasTypo && typoCheck.suggestedEmail) {
    return NextResponse.json(
      { error: `Did you mean ${typoCheck.suggestedEmail}? Please verify your email address.` },
      { status: 400 }
    )
  }

  const ipLimit = getPositiveIntEnv('RATE_LIMIT_PASSWORD_RESET_IP_LIMIT', 10)
  const ipWindowSeconds = getPositiveIntEnv('RATE_LIMIT_PASSWORD_RESET_IP_WINDOW_SECONDS', 60 * 60)
  const emailLimit = getPositiveIntEnv('RATE_LIMIT_PASSWORD_RESET_EMAIL_LIMIT', 3)
  const emailWindowSeconds = getPositiveIntEnv('RATE_LIMIT_PASSWORD_RESET_EMAIL_WINDOW_SECONDS', 60 * 60)

  const ip = getClientIp(req)
  const ipResult = await enforceRateLimit({
    key: `password_reset:ip:${ip}`,
    limit: ipLimit,
    windowSeconds: ipWindowSeconds,
    route: '/api/auth/password-reset',
    dimension: 'ip',
  })

  if (!ipResult.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds(ipResult.resetAt)),
        },
      }
    )
  }

  const emailResult = await enforceRateLimit({
    key: `password_reset:email:${email}`,
    limit: emailLimit,
    windowSeconds: emailWindowSeconds,
    route: '/api/auth/password-reset',
    dimension: 'email',
  })

  if (!emailResult.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts for this email. Please try again later.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfterSeconds(emailResult.resetAt)),
        },
      }
    )
  }

  const admin = supabaseAdmin()
  let baseUrl: string
  try {
    baseUrl = getBaseUrl(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'App base URL is not configured'
    return NextResponse.json({ error: message }, { status: 503 })
  }

  try {
    const { data: linkData, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${baseUrl}/auth/reset-password`,
      },
    })

    // Keep response generic regardless of existence or auth provider state (except for master coach).
    if (error || !linkData?.properties?.hashed_token) {
      console.warn('[PasswordReset] Failed to generate recovery link (user may not exist or auth error):', {
        email,
        error: error?.message ?? 'No hashed_token returned',
      })
      if (email === 'scott.gordon72@outlook.com') {
        return NextResponse.json(
          { error: `Account lookup error (${error?.message || 'user not found'}). Please sign in with 1-Click Coach Fast Pass.` },
          { status: 400 }
        )
      }
      return NextResponse.json({ success: true })
    }

    // Build a scanner-safe reset URL by putting token params in the URL fragment.
    // Most email link scanners only request the URL path/query and ignore fragments,
    // which prevents accidental one-time token consumption before the user clicks.
    const resetLink = `${baseUrl}/auth/reset-password#token_hash=${encodeURIComponent(linkData.properties.hashed_token)}&type=recovery`

    if (process.env.NODE_ENV === 'development' || process.env.ENABLE_DEMO_LOGIN === 'true') {
      console.info(
        `\n===================================================================\n` +
        `🔑 [PasswordReset Dev Link] Generated recovery link for ${email}:\n` +
        `   ${resetLink}\n` +
        `===================================================================\n`
      )
    }

    if (resetLink.includes('localhost') || resetLink.includes('127.0.0.1')) {
      console.warn(
        '[PasswordReset] Warning: Outbound reset link uses a localhost origin. ' +
        'Recipient spam filters (and Resend Insights) may flag this due to domain mismatch with your sending domain. ' +
        'Set EMAIL_LINK_BASE_URL=https://gordonathleticadvisory.com in .env.local to send canonical production links.'
      )
    }

    const result = await sendPasswordResetEmail({
      email,
      resetLink,
    })

    if (result.skipped) {
      const missing = getMissingEmailConfigKeys()
      console.warn('[PasswordReset] Email service skipped dispatch. Missing keys:', missing)
      return NextResponse.json(
        {
          error: `Email service is not configured on this environment. Missing: ${missing.join(', ') || 'unknown settings'}.`,
          missing,
        },
        { status: 503 }
      )
    }

    console.info('[PasswordReset] Recovery email successfully dispatched:', {
      email,
      messageId: result.id,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[PasswordReset] Failed to generate or dispatch recovery email:', err)
    if (email === 'scott.gordon72@outlook.com' || process.env.NODE_ENV === 'development') {
      const msg = err instanceof Error ? err.message : 'Email dispatch provider error'
      return NextResponse.json(
        { error: `Email dispatch failed: ${msg}. Please use 1-Click Coach Fast Pass on the login page to access your console.` },
        { status: 502 }
      )
    }
    // Keep response generic to avoid exposing user existence.
    return NextResponse.json({ success: true })
  }
}
