import { NextRequest, NextResponse } from 'next/server'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'

function retryAfterSeconds(resetAt: string) {
  const ms = new Date(resetAt).getTime() - Date.now()
  return Math.max(1, Math.ceil(ms / 1000))
}

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 })
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
      profileType,
    } = await req.json() as {
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
      profileType?: unknown
    }

    const validation = await validateInboundEmail({
      email,
      honeypot,
      startTimeMs,
    })

    if (!validation.valid) {
      if (validation.isBot) {
        // Silently discard bot submissions to protect resources and sender reputation
        return NextResponse.json({ success: true })
      }
      return NextResponse.json(
        {
          error: validation.error || 'Invalid email',
          suggestion: validation.suggestedEmail,
        },
        { status: 400 }
      )
    }

    const normalizedEmail = validation.normalizedEmail

    const normalizedFirstName = typeof firstName === 'string' ? firstName.trim() : ''
    const normalizedTrainingLevel = typeof trainingLevel === 'string' ? trainingLevel.trim().toLowerCase() : ''
    const normalizedPrimaryGoal = typeof primaryGoal === 'string' ? primaryGoal.trim() : ''
    const normalizedSource = typeof source === 'string' ? source.trim().toLowerCase() : 'waitlist'

    if (normalizedFirstName.length > 80) {
      return NextResponse.json({ error: 'First name is too long' }, { status: 400 })
    }

    if (
      normalizedTrainingLevel &&
      !['beginner', 'intermediate', 'advanced'].includes(normalizedTrainingLevel)
    ) {
      return NextResponse.json({ error: 'Invalid training level' }, { status: 400 })
    }

    if (normalizedPrimaryGoal.length > 600) {
      return NextResponse.json({ error: 'Primary goal is too long' }, { status: 400 })
    }

    if (!/^[a-z0-9_-]{1,40}$/.test(normalizedSource)) {
      return NextResponse.json({ error: 'Invalid source' }, { status: 400 })
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
      key: `waitlist:email:${normalizedEmail}`,
      limit: emailLimit,
      windowSeconds: emailWindowSeconds,
      route: '/api/waitlist',
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

    const supabase = supabaseAdmin()

    const insertPayload = {
      email: normalizedEmail,
      first_name: normalizedFirstName || null,
      training_level: normalizedTrainingLevel || null,
      primary_goal: normalizedPrimaryGoal || null,
      source: normalizedSource,
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
      const normalizedPhone = typeof phone === 'string' ? phone.trim().slice(0, 40) : null
      const normalizedProfileType = typeof profileType === 'string' ? profileType.trim().slice(0, 40) : null
      const isFoundingCohort = normalizedSource === 'founding_cohort_intake' || normalizedSource === 'founding_cohort'

      await triggerLeadEmailAutomation(supabase, {
        email: normalizedEmail,
        firstName: normalizedFirstName || null,
        source: isFoundingCohort ? 'founding_cohort' : 'waitlist',
        cohortReservationNumber: validCohortNumber,
        phone: normalizedPhone,
        profileType: normalizedProfileType,
        primaryGoal: normalizedPrimaryGoal || null,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
