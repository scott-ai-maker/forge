import { NextRequest, NextResponse } from 'next/server'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
} as const

function jsonNoStore(
  body: Record<string, unknown>,
  init?: { status?: number; headers?: Record<string, string> }
) {
  return NextResponse.json(body, {
    status: init?.status ?? 200,
    headers: {
      ...NO_STORE_HEADERS,
      ...(init?.headers ?? {}),
    },
  })
}

function sanitizeText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001F\u007F<>]/g, '').trim()
}

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

const FOUNDING_COHORT_SOURCES = new Set([
  'founding_cohort_intake',
  'founding_cohort',
  'holiday_unmasking_drop',
])

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return jsonNoStore({ error: 'Supabase not configured' }, { status: 503 })
  }

  let parsedBody: {
    email?: unknown
    firstName?: unknown
    trainingLevel?: unknown
    primaryGoal?: unknown
    source?: unknown
    honeypot?: unknown
    startTimeMs?: unknown
    assignedCohortNumber?: unknown
    cohortReservationNumber?: unknown
    phone?: unknown
    smsConsent?: unknown
    timezone?: unknown
    profileType?: unknown
  }

  try {
    const raw = await req.json()
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    parsedBody = raw as typeof parsedBody
  } catch {
    return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  try {
    const { supabaseAdmin } = await import('@/lib/supabase')
    const { triggerLeadEmailAutomation } = await import('@/lib/marketing-email')
    const { validateInboundEmail } = await import('@/lib/email-validation')
    const {
      email,
      firstName,
      trainingLevel,
      primaryGoal,
      source,
      honeypot,
      startTimeMs,
      assignedCohortNumber,
      cohortReservationNumber,
      phone,
      smsConsent,
      timezone,
      profileType,
    } = parsedBody

    const validation = await validateInboundEmail({
      email,
      honeypot,
      startTimeMs,
    })

    if (!validation.valid) {
      if (validation.isBot) {
        // Silently discard bot submissions to protect resources and sender reputation
        return jsonNoStore({ success: true })
      }
      return jsonNoStore(
        {
          error: validation.error || 'Invalid email',
          suggestion: validation.suggestedEmail,
        },
        { status: 400 }
      )
    }

    const normalizedEmail = validation.normalizedEmail

    const normalizedFirstName = sanitizeText(firstName)
    const normalizedTrainingLevel = typeof trainingLevel === 'string' ? trainingLevel.trim().toLowerCase() : ''
    const normalizedPrimaryGoal = sanitizeText(primaryGoal)
    const normalizedSource = typeof source === 'string' && source.trim() ? source.trim().toLowerCase() : 'waitlist'

    if (normalizedFirstName.length > 80) {
      return jsonNoStore({ error: 'First name is too long' }, { status: 400 })
    }

    if (
      normalizedTrainingLevel &&
      !['beginner', 'intermediate', 'advanced'].includes(normalizedTrainingLevel)
    ) {
      return jsonNoStore({ error: 'Invalid training level' }, { status: 400 })
    }

    if (normalizedPrimaryGoal.length > 600) {
      return jsonNoStore({ error: 'Primary goal is too long' }, { status: 400 })
    }

    if (!/^[a-z0-9_-]{1,40}$/.test(normalizedSource)) {
      return jsonNoStore({ error: 'Invalid source' }, { status: 400 })
    }

    const ipLimit = getPositiveIntEnv('RATE_LIMIT_WAITLIST_IP_LIMIT', 20)
    const ipWindowSeconds = getPositiveIntEnv('RATE_LIMIT_WAITLIST_IP_WINDOW_SECONDS', 60 * 60)
    const emailLimit = getPositiveIntEnv('RATE_LIMIT_WAITLIST_EMAIL_LIMIT', 3)
    const emailWindowSeconds = getPositiveIntEnv('RATE_LIMIT_WAITLIST_EMAIL_WINDOW_SECONDS', 24 * 60 * 60)

    const ip = getClientIp(req)
    const ipResult = await enforceRateLimit({
      key: `waitlist:ip:${ip}`,
      limit: ipLimit,
      windowSeconds: ipWindowSeconds,
      route: '/api/waitlist',
      dimension: 'ip',
    })

    if (!ipResult.allowed) {
      return jsonNoStore(
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
      key: `waitlist:email:${normalizedEmail}`,
      limit: emailLimit,
      windowSeconds: emailWindowSeconds,
      route: '/api/waitlist',
      dimension: 'email',
    })

    if (!emailResult.allowed) {
      return jsonNoStore(
        { error: 'Too many attempts for this email. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(retryAfterSeconds(emailResult.resetAt)),
          },
        }
      )
    }

    const supabase = supabaseAdmin()
    const { toE164 } = await import('@/lib/phone')
    const rawPhoneStr = typeof phone === 'string' ? sanitizeText(phone).slice(0, 40) : ''
    if (rawPhoneStr && smsConsent !== true) {
      return jsonNoStore(
        {
          error:
            'Affirmative TCPA written SMS consent is required when submitting a mobile number (or leave the optional phone field blank).',
        },
        { status: 400 }
      )
    }
    const rawConsentedPhoneE164 = smsConsent === true && rawPhoneStr ? toE164(rawPhoneStr) : null
    if (smsConsent === true && rawPhoneStr && !rawConsentedPhoneE164) {
      return jsonNoStore(
        { error: 'Please enter a valid 10-digit US or international mobile number.' },
        { status: 400 }
      )
    }

    // Honor prior STOP / account-deletion SMS suppressions on unauthenticated waitlist submissions (#18)
    let consentedPhoneE164 = rawConsentedPhoneE164
    if (consentedPhoneE164) {
      try {
        const { data: suppressedRow } = await supabase
          .from('sms_suppressions')
          .select('phone')
          .eq('phone', consentedPhoneE164)
          .maybeSingle()
        if (suppressedRow) {
          consentedPhoneE164 = null
        }
      } catch {
        // Proceed if sms_suppressions table is unavailable in local mock
      }
    }
    let validTimezone: string | null = null
    if (typeof timezone === 'string' && timezone.trim() && timezone.length <= 64) {
      try {
        Intl.DateTimeFormat('en-US', { timeZone: timezone.trim() }).format(new Date())
        validTimezone = timezone.trim()
      } catch {
        validTimezone = null
      }
    }
    const nowIso = new Date().toISOString()

    const insertPayload = {
      email: normalizedEmail,
      first_name: normalizedFirstName || null,
      training_level: normalizedTrainingLevel || null,
      primary_goal: normalizedPrimaryGoal || null,
      source: normalizedSource,
      ...(consentedPhoneE164
        ? {
            phone: consentedPhoneE164,
            sms_opt_in: true,
            sms_consent_at: nowIso,
          }
        : {
            sms_opt_in: false,
          }),
      ...(validTimezone ? { timezone: validTimezone } : {}),
    }

    const shouldFallbackToEmailOnly = (errorCode: string | null, message: string) => {
      if (errorCode === '42703' || errorCode === 'PGRST204') return true
      return /column|schema cache/i.test(message)
    }

    let { error } = await supabase
      .from('waitlist')
      .insert(insertPayload)

    if (error && shouldFallbackToEmailOnly(error.code ?? null, error.message ?? '')) {
      const fallbackInsert = await supabase
        .from('waitlist')
        .insert({ email: normalizedEmail })
      error = fallbackInsert.error
    }

    if (error && error.code !== '23505') throw error

    // Avoid repeated confirmation/sequence spam for duplicate waitlist submissions.
    if (!error) {
      const rawCohort = assignedCohortNumber ?? cohortReservationNumber
      const parsedCohort =
        typeof rawCohort === 'number'
          ? rawCohort
          : typeof rawCohort === 'string' && !isNaN(parseInt(rawCohort, 10))
            ? parseInt(rawCohort, 10)
            : null
      const validCohortNumber = parsedCohort && parsedCohort >= 1 && parsedCohort <= 99 ? parsedCohort : null
      const normalizedProfileType = typeof profileType === 'string' ? sanitizeText(profileType).slice(0, 40) || null : null
      const isFoundingCohort = FOUNDING_COHORT_SOURCES.has(normalizedSource)

      await triggerLeadEmailAutomation(supabase, {
        email: normalizedEmail,
        firstName: normalizedFirstName || null,
        source: isFoundingCohort ? 'founding_cohort' : 'waitlist',
        cohortReservationNumber: validCohortNumber,
        phone: consentedPhoneE164,
        profileType: normalizedProfileType,
        primaryGoal: normalizedPrimaryGoal || null,
      })
    }

    return jsonNoStore({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return jsonNoStore({ error: 'Server error' }, { status: 500 })
  }
}
