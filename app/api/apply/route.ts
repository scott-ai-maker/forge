import { NextRequest, NextResponse } from 'next/server'
import {
  enforceRateLimit,
  getClientIp,
  getPositiveIntEnv,
} from '@/lib/rate-limit'
import { validateInboundEmail } from '@/lib/email-validation'

type ApplyPayload = {
  email?: string
  firstName?: string
  goal?: string
  timeline?: string
  trainingDays?: string
  supportLevel?: string
  primaryObstacle?: string
  coachingHistory?: string
  budgetBand?: string
  readiness?: string
  recommendedTier?: string
  honeypot?: string
  startTimeMs?: number
}

const REQUIRED_FIELDS: Array<keyof ApplyPayload> = [
  'email',
  'goal',
  'timeline',
  'trainingDays',
  'supportLevel',
  'primaryObstacle',
  'coachingHistory',
  'budgetBand',
  'readiness',
  'recommendedTier',
]


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

const QUIZ_FIELD_KEYS: Array<Exclude<keyof ApplyPayload, 'email' | 'firstName' | 'honeypot' | 'startTimeMs'>> = [
  'goal',
  'timeline',
  'trainingDays',
  'supportLevel',
  'primaryObstacle',
  'coachingHistory',
  'budgetBand',
  'readiness',
  'recommendedTier',
]

export async function POST(req: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return jsonNoStore({ error: 'Supabase not configured' }, { status: 503 })
  }

  let payload: ApplyPayload
  try {
    const raw = await req.json()
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
    }
    payload = raw as ApplyPayload
  } catch {
    return jsonNoStore({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  try {
    for (const field of REQUIRED_FIELDS) {
      const value = payload[field]
      if (typeof value !== 'string' || value.trim().length === 0) {
        return jsonNoStore({ error: `Missing required field: ${field}` }, { status: 400 })
      }
    }

    const normalizedFirstName = sanitizeText(payload.firstName)
    if (normalizedFirstName.length > 80) {
      return jsonNoStore({ error: 'First name is too long' }, { status: 400 })
    }

    const sanitizedQuizFields = {} as Record<(typeof QUIZ_FIELD_KEYS)[number], string>
    for (const field of QUIZ_FIELD_KEYS) {
      const cleaned = sanitizeText(payload[field])
      if (!cleaned || cleaned.length > 120) {
        return jsonNoStore({ error: `Invalid value for ${field}` }, { status: 400 })
      }
      sanitizedQuizFields[field] = cleaned
    }

    const validation = await validateInboundEmail({
      email: payload.email,
      honeypot: payload.honeypot,
      startTimeMs: payload.startTimeMs,
    })

    if (!validation.valid) {
      if (validation.isBot) {
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

    const email = validation.normalizedEmail

    const ipLimit = getPositiveIntEnv('RATE_LIMIT_APPLY_IP_LIMIT', 15)
    const ipWindowSeconds = getPositiveIntEnv('RATE_LIMIT_APPLY_IP_WINDOW_SECONDS', 60 * 60)
    const emailLimit = getPositiveIntEnv('RATE_LIMIT_APPLY_EMAIL_LIMIT', 2)
    const emailWindowSeconds = getPositiveIntEnv('RATE_LIMIT_APPLY_EMAIL_WINDOW_SECONDS', 24 * 60 * 60)

    const ip = getClientIp(req)
    const ipResult = await enforceRateLimit({
      key: `apply:ip:${ip}`,
      limit: ipLimit,
      windowSeconds: ipWindowSeconds,
      route: '/api/apply',
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
      key: `apply:email:${email}`,
      limit: emailLimit,
      windowSeconds: emailWindowSeconds,
      route: '/api/apply',
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

    const { supabaseAdmin } = await import('@/lib/supabase')
    const supabase = supabaseAdmin()

    const { error } = await supabase
      .from('coaching_applications')
      .insert({
        email,
        first_name: normalizedFirstName || null,
        goal: sanitizedQuizFields.goal,
        timeline: sanitizedQuizFields.timeline,
        training_days: sanitizedQuizFields.trainingDays,
        support_level: sanitizedQuizFields.supportLevel,
        primary_obstacle: sanitizedQuizFields.primaryObstacle,
        coaching_history: sanitizedQuizFields.coachingHistory,
        budget_band: sanitizedQuizFields.budgetBand,
        readiness: sanitizedQuizFields.readiness,
        recommended_tier: sanitizedQuizFields.recommendedTier,
        source: 'apply_quiz',
      })

    if (error) throw error

    const { triggerLeadEmailAutomation } = await import('@/lib/marketing-email')
    await triggerLeadEmailAutomation(supabase, {
      email,
      firstName: normalizedFirstName || null,
      source: 'apply',
      recommendedTier: sanitizedQuizFields.recommendedTier,
    })

    return jsonNoStore({ success: true })
  } catch (err) {
    console.error('Apply route error:', err)
    return jsonNoStore({ error: 'Server error' }, { status: 500 })
  }
}
